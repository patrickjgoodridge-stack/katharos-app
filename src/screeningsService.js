import { supabase, isSupabaseConfigured } from './supabaseClient';

export const saveScreening = async (screening) => {
  if (!isSupabaseConfigured()) return { data: null, error: null };

  const record = {
    id: screening.id,
    user_email: screening.userEmail,
    query: screening.query,
    type: screening.type || 'individual',
    country: screening.country || null,
    year_of_birth: screening.yearOfBirth || null,
    client_ref: screening.clientRef || null,
    result: screening.result || {},
    result_summary: {
      overallRisk: screening.result?.overallRisk,
      riskScore: screening.result?.riskScore,
      riskSummary: screening.result?.riskSummary,
      sanctions: { status: screening.result?.sanctions?.status },
      subject: screening.result?.subject,
      onboardingDecision: screening.result?.onboardingDecision,
    },
    risk_level: screening.result?.overallRisk || null,
    risk_score: screening.result?.riskScore || null,
    sanctions_status: screening.result?.sanctions?.status || null,
    case_id: screening.caseId || null,
    email_domain: screening.emailDomain || '',
    created_at: screening.timestamp || new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('screenings')
      .upsert([record], { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[Screenings] Save error:', error);
    return { data: null, error };
  }
};

export const fetchScreenings = async (userEmail, emailDomain, { page = 1, pageSize = 50 } = {}) => {
  if (!isSupabaseConfigured()) return { data: [], count: 0, error: null };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from('screenings')
      .select('id, query, type, risk_level, risk_score, sanctions_status, client_ref, case_id, result_summary, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (emailDomain && userEmail) {
      query = query.or(`email_domain.eq.${emailDomain},user_email.eq.${userEmail}`);
    } else if (userEmail) {
      query = query.eq('user_email', userEmail);
    }

    const { data, count, error } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0, error: null };
  } catch (error) {
    console.error('[Screenings] Fetch error:', error);
    return { data: [], count: 0, error };
  }
};

export const fetchScreeningById = async (id) => {
  if (!isSupabaseConfigured()) return { data: null, error: null };

  try {
    const { data, error } = await supabase
      .from('screenings')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[Screenings] Fetch by ID error:', error);
    return { data: null, error };
  }
};
