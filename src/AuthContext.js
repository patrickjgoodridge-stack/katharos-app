// AuthContext.js - Simple email gate (no passwords, no OAuth, no verification)
// Full Supabase Auth version preserved in AuthContext.supabase-auth.js
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getOrCreateUser, hasPermission as checkPermission } from './userService';
import { logAudit } from './auditService';

const AuthContext = createContext({});

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

  // Initialize — check localStorage for existing user
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

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
  }, [loadUserData]);

  // Submit email — instant access, no verification
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

  const email = user?.email || null;

  const value = {
    user,
    email,
    loading,
    submitEmail,
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
