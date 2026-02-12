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
    return res.status(503).json({ error: 'Database not configured' });
  }

  const { screeningId, matchIndex, isTruePositive, analystNote, source, userEmail } = req.body;

  if (!screeningId || matchIndex === undefined || isTruePositive === undefined) {
    return res.status(400).json({ error: 'screeningId, matchIndex, and isTruePositive are required' });
  }

  try {
    // Get or create metrics_sanctions record
    let { data: existing } = await supabase
      .from('metrics_sanctions')
      .select('*')
      .eq('screening_id', screeningId)
      .single();

    if (!existing) {
      // Create new record from the screening
      const { data: screening } = await supabase
        .from('screenings')
        .select('query, type, result')
        .eq('id', screeningId)
        .single();

      const matches = screening?.result?.sanctions?.matches || [];
      const { data: created, error: createErr } = await supabase
        .from('metrics_sanctions')
        .insert([{
          screening_id: screeningId,
          case_id: null,
          user_email: userEmail || null,
          query_name: screening?.query || '',
          query_type: screening?.type || '',
          match_count: matches.length,
          matches: matches.map((m, i) => ({
            sdnId: m.sdnId || m.id || `match-${i}`,
            name: m.name || m.entityName || '',
            confidence: m.confidence || m.score || 0,
            matchType: m.matchType || 'unknown',
            isTruePositive: null,
            analystNote: null,
          })),
          true_positives: 0,
          false_positives: 0,
          precision: null,
        }])
        .select()
        .single();

      if (createErr) throw createErr;
      existing = created;
    }

    // Update the specific match
    const updatedMatches = [...(existing.matches || [])];
    if (matchIndex < updatedMatches.length) {
      updatedMatches[matchIndex] = {
        ...updatedMatches[matchIndex],
        isTruePositive,
        analystNote: analystNote || updatedMatches[matchIndex].analystNote,
      };
    }

    // Recalculate precision
    const reviewed = updatedMatches.filter(m => m.isTruePositive !== null && m.isTruePositive !== undefined);
    const tp = reviewed.filter(m => m.isTruePositive === true).length;
    const fp = reviewed.filter(m => m.isTruePositive === false).length;
    const precision = (tp + fp) > 0 ? tp / (tp + fp) : null;

    // Update source breakdown
    const sourceBreakdown = { ...(existing.source_breakdown || {}) };
    if (source) {
      if (!sourceBreakdown[source]) sourceBreakdown[source] = { tp: 0, fp: 0 };
      // Recalculate for this source
      sourceBreakdown[source] = { tp: 0, fp: 0 };
      updatedMatches.forEach(m => {
        if (m.source === source && m.isTruePositive !== null) {
          if (m.isTruePositive) sourceBreakdown[source].tp++;
          else sourceBreakdown[source].fp++;
        }
      });
    }

    const { error: updateErr } = await supabase
      .from('metrics_sanctions')
      .update({
        matches: updatedMatches,
        true_positives: tp,
        false_positives: fp,
        precision,
        source_breakdown: sourceBreakdown,
        feedback_at: new Date().toISOString(),
      })
      .eq('screening_id', screeningId);

    if (updateErr) throw updateErr;

    return res.json({
      success: true,
      truePositives: tp,
      falsePositives: fp,
      precision: precision ? (precision * 100).toFixed(1) + '%' : null,
    });
  } catch (error) {
    console.error('[Feedback]', error);
    return res.status(500).json({ error: error.message });
  }
}
