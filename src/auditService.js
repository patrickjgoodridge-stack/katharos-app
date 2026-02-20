import { supabase, isSupabaseConfigured } from './supabaseClient';

export const logAudit = async (action, { entityType, entityId, details = {} } = {}) => {
  if (!isSupabaseConfigured()) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const email = session.user.email;
    const name = session.user.user_metadata?.name || session.user.user_metadata?.full_name || null;

    await supabase.from('audit_logs').insert([{
      user_email: email,
      user_name: name,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      details,
      user_agent: navigator.userAgent,
    }]);
  } catch (err) {
    console.error('[Audit] Log error:', err);
  }
};

export const fetchAuditLogs = async ({ page = 1, pageSize = 50, filters = {} } = {}) => {
  if (!isSupabaseConfigured()) return { data: [], count: 0 };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.userEmail) query = query.eq('user_email', filters.userEmail);
    if (filters.action) query = query.eq('action', filters.action);
    if (filters.entityType) query = query.eq('entity_type', filters.entityType);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

    const { data, count, error } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  } catch (error) {
    console.error('[Audit] Fetch error:', error);
    return { data: [], count: 0 };
  }
};
