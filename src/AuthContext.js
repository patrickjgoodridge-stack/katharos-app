// AuthContext.js - Simple email gate (no passwords, no OAuth, no verification)
// Full Supabase Auth version preserved in AuthContext.supabase-auth.js
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getOrCreateUser, hasPermission as checkPermission, checkUserExists } from './userService';
import { logAudit } from './auditService';

const AuthContext = createContext({});

// Owner/admin emails that always bypass the gate (no DB lookup needed)
const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS || 'patrick@katharos.co').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

const DAILY_FREE_LIMIT = 50;

const PERSONAL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'aol.com', 'protonmail.com', 'mail.com', 'zoho.com', 'yandex.com',
  'live.com', 'msn.com', 'me.com', 'mac.com'
];

const extractDomain = (email) => email?.split('@')[1]?.toLowerCase() || '';
const isPersonalEmail = (domain) => PERSONAL_DOMAINS.includes(domain);

const getWorkspaceId = (email) => {
  if (!email) return null;
  const domain = extractDomain(email);
  return isPersonalEmail(domain) ? email.toLowerCase() : domain;
};

const getWorkspaceName = (email) => {
  if (!email) return '';
  const domain = extractDomain(email);
  if (isPersonalEmail(domain)) return 'Personal Workspace';
  const name = domain.split('.')[0];
  return name.charAt(0).toUpperCase() + name.slice(1) + ' Workspace';
};

export const useAuth = () => {
  return useContext(AuthContext);
};

// Store lead info in Supabase
const storeLead = async (email, name, company) => {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase
      .from('collected_emails')
      .upsert([{
        email,
        name: name || null,
        company: company || null,
        created_at: new Date().toISOString()
      }], { onConflict: 'email' });
  } catch (err) {
    console.log('Lead storage note:', err.message);
  }
};

// Increment query count for a user
const incrementQueryCount = async (email) => {
  if (!isSupabaseConfigured() || !email) return;
  try {
    const { data } = await supabase
      .from('collected_emails')
      .select('query_count')
      .eq('email', email)
      .single();
    const currentCount = data?.query_count || 0;
    await supabase
      .from('collected_emails')
      .update({ query_count: currentCount + 1 })
      .eq('email', email);
  } catch (err) {
    console.log('Query count update note:', err.message);
  }
};

// Check if user is paid in Supabase
const checkPaidStatus = async (email) => {
  if (!isSupabaseConfigured() || !email) return false;
  try {
    const { data } = await supabase
      .from('collected_emails')
      .select('is_paid')
      .eq('email', email)
      .single();
    return data?.is_paid === true;
  } catch (err) {
    console.log('Paid status check note:', err.message);
    return false;
  }
};

const getTodayString = () => new Date().toISOString().split('T')[0];

const getDailyUsage = (email) => {
  const key = `marlowe_daily_${email}`;
  const stored = localStorage.getItem(key);
  if (!stored) return { date: getTodayString(), count: 0 };
  try {
    const data = JSON.parse(stored);
    if (data.date !== getTodayString()) return { date: getTodayString(), count: 0 };
    return data;
  } catch {
    return { date: getTodayString(), count: 0 };
  }
};

const saveDailyUsage = (email, count) => {
  const key = `marlowe_daily_${email}`;
  localStorage.setItem(key, JSON.stringify({ date: getTodayString(), count }));
};

const STORAGE_KEY = 'katharos_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { email, name, company }
  const [userRecord, setUserRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [dailyScreenings, setDailyScreenings] = useState(0);
  const [pendingInvite, setPendingInvite] = useState(null); // { token, email, name, company } — needs password
  const initRef = useRef(false);

  // Load user data from Supabase (user record, paid status, usage)
  const loadUserData = useCallback(async (email, name, company) => {
    if (!email) return;

    // Load daily usage
    const usage = getDailyUsage(email);
    setDailyScreenings(usage.count);

    // Check paid status
    checkPaidStatus(email).then(paid => setIsPaid(paid));

    // Store lead
    storeLead(email, name, company);

    // Get or create user record (no authId — simple email gate)
    const record = await getOrCreateUser(email, name, company, null);
    if (record) setUserRecord(record);
  }, []);

  // Initialize — check invite token in URL, then localStorage
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      // Check for invite token in URL (?invite=<token>)
      const params = new URLSearchParams(window.location.search);
      const inviteToken = params.get('invite');

      if (inviteToken) {
        // Use server-side lookup (bypasses RLS) instead of frontend anon key
        let invitedUser = null;
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'lookup-token', token: inviteToken }),
          });
          if (res.ok) {
            invitedUser = await res.json();
          }
        } catch { /* lookup failed */ }

        if (invitedUser?.ok) {
          // Clean the URL immediately
          window.history.replaceState({}, '', window.location.pathname);

          // If user has no password yet, prompt them to create one
          if (!invitedUser.hasPassword) {
            setPendingInvite({
              token: inviteToken,
              email: invitedUser.email,
              name: invitedUser.name || '',
              company: invitedUser.company || '',
            });
            setLoading(false);
            return;
          }

          // User already has a password — auto-login (returning invite user)
          const userData = { email: invitedUser.email, name: invitedUser.name || '', company: invitedUser.company || '' };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
          setUser(userData);
          await loadUserData(invitedUser.email, invitedUser.name, invitedUser.company);
          localStorage.setItem('katharos_invite_redirect', 'newCase');
          // Notify admin that invite link was used
          try {
            fetch('/api/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'invite_login',
                name: invitedUser.name || '',
                email: invitedUser.email,
                company: invitedUser.company || '',
              }),
            });
          } catch { /* best-effort */ }
          setLoading(false);
          return;
        }
      }

      // Fall back to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.email) {
            setUser(parsed);
            loadUserData(parsed.email, parsed.name || '', parsed.company || '');
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      setLoading(false);
    };

    init();
  }, [loadUserData]);

  // Submit email — instant access, no verification (legacy, kept for compatibility)
  const submitEmail = async (email, name, company) => {
    const trimmedEmail = String(email || '').trim().toLowerCase();
    const trimmedName = String(name || '').trim();
    const trimmedCompany = String(company || '').trim();

    if (!trimmedEmail) return { success: false, error: 'Please enter your email' };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) return { success: false, error: 'Please enter a valid email' };

    const userData = { email: trimmedEmail, name: trimmedName, company: trimmedCompany };

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);

    // Load/create user data in Supabase
    await loadUserData(trimmedEmail, trimmedName, trimmedCompany);

    // Audit log
    logAudit('user_login', {
      entityType: 'user',
      entityId: trimmedEmail,
      details: { provider: 'email_gate' }
    });

    return { success: true };
  };

  // Restricted login — only allows existing, active users (for gated access)
  // Also checks collected_emails as fallback (grandfathers in pre-gate users)
  const loginExistingUser = async (email) => {
    const trimmedEmail = String(email || '').trim().toLowerCase();
    if (!trimmedEmail) return { success: false, error: 'Please enter your email' };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) return { success: false, error: 'Please enter a valid email' };

    // Admin bypass — owner emails always get through
    if (ADMIN_EMAILS.includes(trimmedEmail)) {
      const userData = { email: trimmedEmail, name: '', company: '' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      await loadUserData(trimmedEmail, '', '');
      logAudit('user_login', { entityType: 'user', entityId: trimmedEmail, details: { provider: 'admin_bypass' } });
      return { success: true };
    }

    // Check if this user has been invited / exists in users table
    let existingUser = await checkUserExists(trimmedEmail);

    // Fallback: check collected_emails (pre-gate users who used the old flow)
    if (!existingUser && isSupabaseConfigured()) {
      try {
        const { data: legacyUser } = await supabase
          .from('collected_emails')
          .select('email, name, company')
          .eq('email', trimmedEmail)
          .single();
        if (legacyUser) {
          // Try to promote to proper user record (may fail due to RLS)
          const record = await getOrCreateUser(trimmedEmail, legacyUser.name, legacyUser.company, null);
          // Use whichever succeeded — user record or collected_emails data
          existingUser = record || { email: legacyUser.email, name: legacyUser.name, company: legacyUser.company };
        }
      } catch {
        // No legacy record either
      }
    }

    if (!existingUser) {
      return { success: false, error: 'No account found. Access is by invitation only.' };
    }

    const userData = { email: trimmedEmail, name: existingUser.name || '', company: existingUser.company || '' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);

    await loadUserData(trimmedEmail, existingUser.name, existingUser.company);

    logAudit('user_login', {
      entityType: 'user',
      entityId: trimmedEmail,
      details: { provider: 'restricted_gate' }
    });

    return { success: true };
  };

  // Login with email + password (calls /api/auth verify-password)
  const loginWithPassword = async (email, password) => {
    const trimmedEmail = String(email || '').trim().toLowerCase();
    if (!trimmedEmail || !password) return { success: false, error: 'Email and password are required' };

    // Admin bypass — no password needed
    if (ADMIN_EMAILS.includes(trimmedEmail)) {
      const userData = { email: trimmedEmail, name: '', company: '' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      await loadUserData(trimmedEmail, '', '');
      logAudit('user_login', { entityType: 'user', entityId: trimmedEmail, details: { provider: 'admin_bypass' } });
      return { success: true };
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-password', email: trimmedEmail, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { success: false, error: data.error || 'Invalid email or password' };
      }
      const userData = { email: data.email, name: data.name || '', company: data.company || '' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      await loadUserData(data.email, data.name, data.company);
      logAudit('user_login', { entityType: 'user', entityId: data.email, details: { provider: 'password' } });
      return { success: true };
    } catch {
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  };

  // Set password from invite flow (calls /api/auth set-password, then auto-logs in)
  const setPasswordFromInvite = async (token, password) => {
    if (!token || !password) return { success: false, error: 'Token and password are required' };
    if (password.length < 8) return { success: false, error: 'Password must be at least 8 characters' };

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-password', token, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { success: false, error: data.error || 'Failed to set password' };
      }
      // Auto-login after setting password
      const userData = { email: data.email, name: data.name || '', company: data.company || '' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      setPendingInvite(null);
      await loadUserData(data.email, data.name, data.company);
      localStorage.setItem('katharos_invite_redirect', 'newCase');
      // Notify admin
      try {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'invite_login',
            name: data.name || '',
            email: data.email,
            company: data.company || '',
          }),
        });
      } catch { /* best-effort */ }
      logAudit('user_login', { entityType: 'user', entityId: data.email, details: { provider: 'invite_password_set' } });
      return { success: true };
    } catch {
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  };

  // Sign out — clear localStorage + state
  const signOut = async () => {
    if (user?.email) {
      logAudit('user_logout', { entityType: 'user', entityId: user.email });
    }
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setUserRecord(null);
    setIsPaid(false);
    setDailyScreenings(0);
  };

  // Track a query for the current user
  const trackQuery = () => {
    if (user?.email) {
      incrementQueryCount(user.email);
    }
  };

  const canScreen = () => {
    if (isPaid) return true;
    return dailyScreenings < DAILY_FREE_LIMIT;
  };

  const screeningsRemaining = isPaid ? Infinity : Math.max(0, DAILY_FREE_LIMIT - dailyScreenings);

  const incrementScreening = () => {
    if (user?.email && !isPaid) {
      const newCount = dailyScreenings + 1;
      setDailyScreenings(newCount);
      saveDailyUsage(user.email, newCount);
    }
    trackQuery();
  };

  const refreshPaidStatus = async () => {
    if (user?.email) {
      const paid = await checkPaidStatus(user.email);
      setIsPaid(paid);
      return paid;
    }
    return false;
  };

  // 2-hour inactivity timeout — auto-logout
  const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
  const inactivityTimer = useRef(null);

  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        logAudit('session_timeout', { entityType: 'user', entityId: user.email, details: { reason: 'inactivity_2h' } });
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setUserRecord(null);
        setIsPaid(false);
        setDailyScreenings(0);
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // start on mount

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const email = user?.email || null;

  const value = {
    user,
    email,
    loading,
    submitEmail,
    loginExistingUser,
    loginWithPassword,
    setPasswordFromInvite,
    pendingInvite,
    signOut,
    isAuthenticated: !!user,
    isConfigured: isSupabaseConfigured(),
    // Stubs for auth methods (no-ops so nothing crashes if called)
    verifyOtp: async () => ({ success: false, error: 'Auth disabled' }),
    signUpWithPassword: async () => ({ success: false, error: 'Auth disabled' }),
    signInWithPassword: async () => ({ success: false, error: 'Auth disabled' }),
    resetPassword: async () => ({ success: false, error: 'Auth disabled' }),
    updatePassword: async () => ({ success: false, error: 'Auth disabled' }),
    signInWithGoogle: async () => ({ success: false, error: 'Auth disabled' }),
    awaitingOtp: false,
    passwordRecovery: false,
    // Workspace features
    domain: email ? extractDomain(email) : null,
    workspaceId: email ? getWorkspaceId(email) : null,
    workspaceName: email ? getWorkspaceName(email) : '',
    isPersonalWorkspace: email ? isPersonalEmail(extractDomain(email)) : true,
    // Usage limit features
    isPaid,
    canScreen,
    screeningsRemaining,
    dailyScreenings,
    incrementScreening,
    refreshPaidStatus,
    DAILY_FREE_LIMIT,
    // User management features
    userRecord,
    userRole: userRecord?.role || 'analyst',
    hasPermission: (perm) => checkPermission(userRecord, perm),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
