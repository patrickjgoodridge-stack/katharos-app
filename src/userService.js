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
