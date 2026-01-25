// AuthContext.js - Simple Email Gate with Name & Company
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const AuthContext = createContext({});

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

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing user
    const storedUser = localStorage.getItem('marlowe_user');
    if (storedUser) {
      try {
        setUserInfo(JSON.parse(storedUser));
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

  const value = {
    user: userInfo,
    email: userInfo?.email,
    loading,
    submitEmail,
    signOut,
    trackQuery,
    isAuthenticated: !!userInfo,
    isConfigured: true, // Email gate is always enabled
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
