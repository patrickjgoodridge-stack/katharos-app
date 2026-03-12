import { supabase, isSupabaseConfigured } from './supabaseClient';

const ROLE_PERMISSIONS = {
  admin: { screen: true, create_case: true, update_case: true, delete_case: true, view_case: true, approve_reject: true, manage_users: true, view_audit_logs: true, export_reports: true, assign_cases: true, escalate: true },
  analyst: { screen: true, create_case: true, update_case: true, delete_case: false, view_case: true, approve_reject: false, manage_users: false, view_audit_logs: false, export_reports: true, assign_cases: true, escalate: true },
  reviewer: { screen: false, create_case: false, update_case: true, delete_case: false, view_case: true, approve_reject: true, manage_users: false, view_audit_logs: false, export_reports: true, assign_cases: false, escalate: false },
  viewer: { screen: false, create_case: false, update_case: false, delete_case: false, view_case: true, approve_reject: false, manage_users: false, view_audit_logs: false, export_reports: false, assign_cases: false, escalate: false },
};

export const hasPermission = (userRecord, permission) => {
  if (!userRecord) return true; // Fallback: allow all if no user record (graceful degradation)
  if (userRecord.permissions?.[permission] !== undefined) return userRecord.permissions[permission];
  return ROLE_PERMISSIONS[userRecord.role]?.[permission] || false;
};

export const getOrCreateUser = async (email, name, company, authId) => {
  if (!isSupabaseConfigured()) return null;

  const domain = email.split('@')[1]?.toLowerCase() || '';

  try {
    // Try to get existing user
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existing) {
      const updates = { last_login: new Date().toISOString() };
      // Sync auth_id if provided and not yet set
      if (authId && !existing.auth_id) {
        updates.auth_id = authId;
      }
      await supabase.from('users')
        .update(updates)
        .eq('email', email);
      return { ...existing, ...updates };
    }

    // First user for a domain gets admin role
    const { data: domainUsers } = await supabase
      .from('users')
      .select('id')
      .eq('email_domain', domain)
      .limit(1);

    const role = (!domainUsers || domainUsers.length === 0) ? 'admin' : 'analyst';

    const { data, error } = await supabase
      .from('users')
      .insert([{
        email,
        name: name || null,
        company: company || null,
        role,
        status: 'active',
        email_domain: domain,
        auth_id: authId || null,
        last_login: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Users] getOrCreateUser error:', error);
    return null;
  }
};

export const fetchTeamUsers = async (emailDomain) => {
  if (!isSupabaseConfigured() || !emailDomain) return [];

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email_domain', emailDomain)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Users] fetchTeamUsers error:', error);
    return [];
  }
};

export const updateUserRole = async (userId, role) => {
  if (!isSupabaseConfigured()) return { error: 'Not configured' };

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[Users] updateUserRole error:', error);
    return { data: null, error };
  }
};

export const suspendUser = async (userId, suspend = true) => {
  if (!isSupabaseConfigured()) return { error: 'Not configured' };

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ status: suspend ? 'suspended' : 'active', updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[Users] suspendUser error:', error);
    return { data: null, error };
  }
};

// --- Invite System (White Glove Access) ---

// Generate a secure invite token
const generateToken = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
};

// Create an invited user and return the invite token
export const createInvitedUser = async (email, name, company, role = 'analyst') => {
  if (!isSupabaseConfigured()) return { data: null, error: 'Not configured' };

  const token = generateToken();
  const domain = email.split('@')[1]?.toLowerCase() || '';

  try {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      // Update existing user with new invite token
      const { data, error } = await supabase
        .from('users')
        .update({ auth_id: token, status: 'active', updated_at: new Date().toISOString() })
        .eq('email', email.toLowerCase())
        .select()
        .single();
      if (error) throw error;
      return { data, token, error: null };
    }

    // Create new user — auth_id stores the invite token
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: email.toLowerCase(),
        name: name || null,
        company: company || null,
        role,
        status: 'active',
        email_domain: domain,
        auth_id: token,
        last_login: null,
      }])
      .select()
      .single();
    if (error) throw error;
    return { data, token, error: null };
  } catch (error) {
    console.error('[Users] createInvitedUser error:', error);
    return { data: null, token: null, error };
  }
};

// Look up a user by invite token (auth_id field)
export const lookupByInviteToken = async (token) => {
  if (!isSupabaseConfigured() || !token) return null;
  try {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', token)
      .eq('status', 'active')
      .single();
    return data || null;
  } catch {
    return null;
  }
};

// Check if an email exists as an active user (for restricted login)
export const checkUserExists = async (email) => {
  if (!isSupabaseConfigured() || !email) return null;
  try {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('status', 'active')
      .single();
    return data || null;
  } catch {
    return null;
  }
};
