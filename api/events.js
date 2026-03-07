import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    // Silently accept events when DB isn't configured (dev mode)
    return res.status(200).json({ accepted: 0, message: 'Database not configured' });
  }

  const { events } = req.body;

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'events array is required' });
  }

  // Cap batch size to prevent abuse
  const batch = events.slice(0, 100);

  // Validate and sanitize each event
  const rows = batch
    .filter(e => e.event_type && e.event_category && e.session_id)
    .map(e => ({
      event_type: String(e.event_type).slice(0, 100),
      event_category: String(e.event_category).slice(0, 50),
      session_id: String(e.session_id).slice(0, 100),
      user_email: e.user_email ? String(e.user_email).slice(0, 255) : null,
      email_domain: e.email_domain ? String(e.email_domain).slice(0, 255) : null,
      entity_name: e.entity_name ? String(e.entity_name).slice(0, 500) : null,
      entity_type: e.entity_type ? String(e.entity_type).slice(0, 50) : null,
      case_id: e.case_id ? String(e.case_id).slice(0, 100) : null,
      payload: typeof e.payload === 'object' ? e.payload : {},
      client_timestamp: e.client_timestamp || new Date().toISOString(),
    }));

  if (rows.length === 0) {
    return res.status(400).json({ error: 'No valid events in batch' });
  }

  try {
    const { error } = await supabase.from('events').insert(rows);

    if (error) {
      console.error('[Events API]', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ accepted: rows.length });
  } catch (error) {
    console.error('[Events API]', error);
    return res.status(500).json({ error: error.message });
  }
}
