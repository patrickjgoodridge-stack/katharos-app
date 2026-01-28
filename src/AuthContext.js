// AuthContext.js - Simple Email Gate with Name & Company + Usage Limits
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const AuthContext = createContext({});

const DAILY_FREE_LIMIT = 5;

const PERSONAL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'aol.com', 'protonmail.com', 'mail.com', 'zoho.com', 'yandex.com',
  'live.com', 'msn.com', 'me.com', 'mac.com'
];

const extractDomain = (email) => email?.split('@')[1]?.toLowerCase() || '';
const isPersonalEmail = (domain) => PERSONAL_DOMAINS.includes(domain);

// Get workspace ID: domain for work emails, full email for personal
const getWorkspaceId = (email) => {
  if (!email) return null;
  const domain = extractDomain(email);
  return isPersonalEmail(domain) ? email.toLowerCase() : domain;
};

// Get display name for workspace
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
      }], {
        onConflict: 'email',
      });
  } catch (err) {
    // Table might not exist yet - that's okay, we'll still let them in
    console.log('Lead storage note:', err.message);
  }
};

// Increment query count for a user
const incrementQueryCount = async (email) => {
  if (!isSupabaseConfigured() || !email) return;

  try {
    // Get current count and increment
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

// Get today's date string for tracking daily usage
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

// Get daily usage from localStorage
const getDailyUsage = (email) => {
  const key = `marlowe_daily_${email}`;
  const stored = localStorage.getItem(key);
  if (!stored) return { date: getTodayString(), count: 0 };

  try {
    const data = JSON.parse(stored);
    // Reset if it's a new day
    if (data.date !== getTodayString()) {
      return { date: getTodayString(), count: 0 };
    }
    return data;
  } catch {
    return { date: getTodayString(), count: 0 };
  }
};

// Save daily usage to localStorage
const saveDailyUsage = (email, count) => {
  const key = `marlowe_daily_${email}`;
  localStorage.setItem(key, JSON.stringify({
    date: getTodayString(),
    count
  }));
};

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [dailyScreenings, setDailyScreenings] = useState(0);

  useEffect(() => {
    // Check localStorage for existing user
    const storedUser = localStorage.getItem('marlowe_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserInfo(userData);

        // Load daily usage
        const usage = getDailyUsage(userData.email);
        setDailyScreenings(usage.count);

        // Check paid status from Supabase
        checkPaidStatus(userData.email).then(paid => {
          setIsPaid(paid);
        });
      } catch {
        localStorage.removeItem('marlowe_user');
      }
    }
    setLoading(false);
  }, []);

  // Submit email to get access
  const submitEmail = async (email, name, company) => {
    const userData = {
      email: email.trim().toLowerCase(),
      name: name?.trim() || '',
      company: company?.trim() || '',
    };

    // Store in localStorage for persistence
    localStorage.setItem('marlowe_user', JSON.stringify(userData));
    setUserInfo(userData);

    // Store in Supabase for collection
    await storeLead(userData.email, userData.name, userData.company);

    return { success: true };
  };

  // Sign out (clear user)
  const signOut = () => {
    localStorage.removeItem('marlowe_user');
    setUserInfo(null);
  };

  // Track a query for the current user
  const trackQuery = () => {
    if (userInfo?.email) {
      incrementQueryCount(userInfo.email);
    }
  };

  // Check if user can perform a screening
  const canScreen = () => {
    if (isPaid) return true;
    return dailyScreenings < DAILY_FREE_LIMIT;
  };

  // Get remaining screenings for free users
  const screeningsRemaining = isPaid ? Infinity : Math.max(0, DAILY_FREE_LIMIT - dailyScreenings);

  // Increment daily screening count (call this when a screening is performed)
  const incrementScreening = () => {
    if (userInfo?.email && !isPaid) {
      const newCount = dailyScreenings + 1;
      setDailyScreenings(newCount);
      saveDailyUsage(userInfo.email, newCount);
    }
    // Also track total queries
    trackQuery();
  };

  // Refresh paid status (useful after payment)
  const refreshPaidStatus = async () => {
    if (userInfo?.email) {
      const paid = await checkPaidStatus(userInfo.email);
      setIsPaid(paid);
      return paid;
    }
    return false;
  };

  const value = {
    user: userInfo,
    email: userInfo?.email,
    loading,
    submitEmail,
    signOut,
    trackQuery,
    isAuthenticated: !!userInfo,
    isConfigured: true, // Email gate is always enabled
    // Workspace features
    domain: userInfo ? extractDomain(userInfo.email) : null,
    workspaceId: userInfo ? getWorkspaceId(userInfo.email) : null,
    workspaceName: userInfo ? getWorkspaceName(userInfo.email) : '',
    isPersonalWorkspace: userInfo ? isPersonalEmail(extractDomain(userInfo.email)) : true,
    // Usage limit features
    isPaid,
    canScreen,
    screeningsRemaining,
    dailyScreenings,
    incrementScreening,
    refreshPaidStatus,
    DAILY_FREE_LIMIT,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
