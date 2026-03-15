import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

const VALID_CATEGORIES = ['false_positive', 'false_negative', 'inaccurate', 'missing_details', 'other'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  const { caseId, messageIndex, feedbackType, category, freeText, userEmail } = req.body;

  if (!caseId || messageIndex === undefined || !feedbackType) {
    return res.status(400).json({ error: 'caseId, messageIndex, and feedbackType are required' });
  }

  if (feedbackType !== 'positive' && feedbackType !== 'negative') {
    return res.status(400).json({ error: 'feedbackType must be "positive" or "negative"' });
  }

  if (feedbackType === 'negative' && category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  try {
    const emailDomain = userEmail ? userEmail.split('@')[1]?.toLowerCase() : null;

    const { error } = await supabase
      .from('message_feedback')
      .upsert([{
        case_id: caseId,
        message_index: messageIndex,
        message_role: 'assistant',
        feedback_type: feedbackType,
        category: feedbackType === 'negative' ? (category || null) : null,
        free_text: freeText || null,
        user_email: userEmail || null,
        email_domain: emailDomain,
        updated_at: new Date().toISOString(),
      }], { onConflict: 'case_id, message_index, user_email' });

    if (error) throw error;

    return res.json({ success: true, feedbackType });
  } catch (error) {
    console.error('[MessageFeedback]', error);
    return res.status(500).json({ error: error.message });
  }
}
