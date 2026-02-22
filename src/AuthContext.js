// AuthContext.js - Supabase Auth with Magic Link OTP + Google OAuth + User Roles
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

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userRecord, setUserRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [dailyScreenings, setDailyScreenings] = useState(0);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [pendingUserInfo, setPendingUserInfo] = useState(null); // name/company stored during OTP flow
  const initRef = useRef(false);

  // Load user record and related data when we have a session
  const loadUserData = useCallback(async (authSession) => {
    if (!authSession?.user?.email) return;

    const email = authSession.user.email;
    const meta = authSession.user.user_metadata || {};
    const name = meta.name || meta.full_name || pendingUserInfo?.name || '';
    const company = meta.company || pendingUserInfo?.company || '';

    // Load daily usage
    const usage = getDailyUsage(email);
    setDailyScreenings(usage.count);

    // Check paid status
    checkPaidStatus(email).then(paid => setIsPaid(paid));

    // Store lead
    storeLead(email, name, company);

    // Get or create user record with role
    const authId = authSession.user.id;
    const record = await getOrCreateUser(email, name, company, authId);
    if (record) setUserRecord(record);

    // Clear pending info
    setPendingUserInfo(null);
  }, [pendingUserInfo]);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured() || initRef.current) return;
    initRef.current = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) {
        loadUserData(initialSession);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('[Auth] getSession error:', err);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);

        if (event === 'SIGNED_IN' && newSession) {
          setAwaitingOtp(false);
          await loadUserData(newSession);
          logAudit('user_login', {
            entityType: 'user',
            entityId: newSession.user.email,
            details: { provider: newSession.user.app_metadata?.provider || 'email' }
          });
        }

        if (event === 'PASSWORD_RECOVERY' && newSession) {
          setPasswordRecovery(true);
        }

        if (event === 'SIGNED_OUT') {
          setUserRecord(null);
          setIsPaid(false);
          setDailyScreenings(0);
          setPasswordRecovery(false);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [loadUserData]);

  // Submit email — sends OTP magic link code
  const submitEmail = async (email, name, company) => {
    if (!isSupabaseConfigured()) return { success: false, error: 'Auth not configured' };

    const trimmedEmail = email.trim().toLowerCase();

    // Store name/company to use after OTP verification
    setPendingUserInfo({ name: name?.trim() || '', company: company?.trim() || '' });

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        data: {
          name: name?.trim() || '',
          company: company?.trim() || '',
        }
      }
    });

    if (error) {
      setPendingUserInfo(null);
      return { success: false, error: error.message };
    }

    setAwaitingOtp(true);
    return { success: true };
  };

  // Verify OTP code
  const verifyOtp = async (email, token) => {
    if (!isSupabaseConfigured()) return { success: false, error: 'Auth not configured' };

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Session is set via onAuthStateChange, which triggers loadUserData
    setAwaitingOtp(false);
    return { success: true, session: data.session };
  };

  // Sign up with email + password
  const signUpWithPassword = async (email, password, name, company) => {
    if (!isSupabaseConfigured()) return { success: false, error: 'Auth not configured' };

    const trimmedEmail = email.trim().toLowerCase();
    setPendingUserInfo({ name: name?.trim() || '', company: company?.trim() || '' });

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          name: name?.trim() || '',
          company: company?.trim() || '',
        }
      }
    });

    if (error) {
      setPendingUserInfo(null);
      return { success: false, error: error.message };
    }

    // If email confirmation is required, user won't have a session yet
    if (data.user && !data.session) {
      return { success: true, needsConfirmation: true };
    }

    // If auto-confirmed (e.g. in dev), session is set via onAuthStateChange
    return { success: true, needsConfirmation: false };
  };

  // Sign in with email + password
  const signInWithPassword = async (email, password) => {
    if (!isSupabaseConfigured()) return { success: false, error: 'Auth not configured' };

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Session is set via onAuthStateChange, which triggers loadUserData
    return { success: true };
  };

  // Reset password (send reset email)
  const resetPassword = async (email) => {
    if (!isSupabaseConfigured()) return { success: false, error: 'Auth not configured' };

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}` }
    );

    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  // Update password (after clicking reset link)
  const updatePassword = async (newPassword) => {
    if (!isSupabaseConfigured()) return { success: false, error: 'Auth not configured' };

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) return { success: false, error: error.message };
    setPasswordRecovery(false);
    return { success: true };
  };

  // Google OAuth
  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) return { success: false, error: 'Auth not configured' };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  // Sign out
  const signOut = async () => {
    if (session?.user?.email) {
      logAudit('user_logout', { entityType: 'user', entityId: session.user.email });
    }
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUserRecord(null);
    setAwaitingOtp(false);
    setPendingUserInfo(null);
  };

  // Track a query for the current user
  const trackQuery = () => {
    if (session?.user?.email) {
      incrementQueryCount(session.user.email);
    }
  };

  const canScreen = () => {
    if (isPaid) return true;
    return dailyScreenings < DAILY_FREE_LIMIT;
  };

  const screeningsRemaining = isPaid ? Infinity : Math.max(0, DAILY_FREE_LIMIT - dailyScreenings);

  const incrementScreening = () => {
    if (session?.user?.email && !isPaid) {
      const newCount = dailyScreenings + 1;
      setDailyScreenings(newCount);
      saveDailyUsage(session.user.email, newCount);
    }
    trackQuery();
  };

  const refreshPaidStatus = async () => {
    if (session?.user?.email) {
      const paid = await checkPaidStatus(session.user.email);
      setIsPaid(paid);
      return paid;
    }
    return false;
  };

  const email = session?.user?.email || null;
  const userMeta = session?.user?.user_metadata || {};

  const value = {
    user: session ? { email, name: userRecord?.name || userMeta.name || userMeta.full_name || '', company: userRecord?.company || userMeta.company || '' } : null,
    email,
    loading,
    submitEmail,
    verifyOtp,
    signUpWithPassword,
    signInWithPassword,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!session,
    isConfigured: isSupabaseConfigured(),
    awaitingOtp,
    passwordRecovery,
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
