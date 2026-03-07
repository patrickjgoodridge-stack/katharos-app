// searchPatternIntelligence.js - Search Pattern Intelligence
// "Users investigating Entity A frequently also investigate Entity B, C, D"
// Computes co-occurrence patterns and detects emerging search anomalies.

const { createClient } = require('@supabase/supabase-js');

let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// ── Co-occurrence computation (daily batch) ──

async function computeCoOccurrencePatterns() {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc('compute_entity_co_occurrences');
  if (error) {
    console.error('[SearchPatterns] Co-occurrence computation failed:', error.message);
    return [];
  }

  let stored = 0;
  for (const pattern of (data || [])) {
    if (pattern.unique_users >= 2 && pattern.co_occurrence_count >= 3) {
      await supabase.from('entity_edges').upsert({
        source_entity_id: pattern.entity1_id || null,
        target_entity_id: pattern.entity2_id || null,
        relationship_type: 'frequently_co_searched',
        confidence: Math.min(0.9, 0.3 + (pattern.unique_users * 0.1)),
        evidence: [{
          type: 'co_search_pattern',
          count: pattern.co_occurrence_count,
          unique_users: pattern.unique_users,
          computed_at: new Date().toISOString(),
        }],
      }, { onConflict: 'source_entity_id,target_entity_id' });
      stored++;
    }
  }

  console.log(`[SearchPatterns] Stored ${stored} co-occurrence patterns`);
  return data || [];
}

// ── Query: frequently co-searched entities ──

async function getFrequentlyCoSearched(entityName, limit = 10) {
  const supabase = getSupabase();
  if (!supabase) return [];

  // Find entity node
  const normalized = entityName.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  const { data: variant } = await supabase
    .from('entity_variants')
    .select('entity_node_id')
    .eq('variant_name', normalized)
    .single();

  if (!variant) return [];

  // Get edges where this entity is source
  const { data: sourceEdges } = await supabase
    .from('entity_edges')
    .select('confidence, evidence, target_entity_id')
    .eq('source_entity_id', variant.entity_node_id)
    .in('relationship_type', ['frequently_co_searched', 'unknown'])
    .gte('confidence', 0.3)
    .order('confidence', { ascending: false })
    .limit(limit);

  // Get edges where this entity is target
  const { data: targetEdges } = await supabase
    .from('entity_edges')
    .select('confidence, evidence, source_entity_id')
    .eq('target_entity_id', variant.entity_node_id)
    .in('relationship_type', ['frequently_co_searched', 'unknown'])
    .gte('confidence', 0.3)
    .order('confidence', { ascending: false })
    .limit(limit);

  const relatedIds = [
    ...(sourceEdges || []).map(e => ({ id: e.target_entity_id, confidence: e.confidence, evidence: e.evidence })),
    ...(targetEdges || []).map(e => ({ id: e.source_entity_id, confidence: e.confidence, evidence: e.evidence })),
  ];

  if (relatedIds.length === 0) return [];

  const { data: nodes } = await supabase
    .from('entity_nodes')
    .select('id, canonical_name, total_screenings, max_risk_level')
    .in('id', relatedIds.map(r => r.id));

  const nodeMap = Object.fromEntries((nodes || []).map(n => [n.id, n]));

  return relatedIds
    .map(r => {
      const node = nodeMap[r.id];
      if (!node) return null;
      const coSearch = (r.evidence || []).find(e => e.type === 'co_search' || e.type === 'co_search_pattern');
      return {
        entity_name: node.canonical_name,
        co_search_count: coSearch?.count || 0,
        unique_users: coSearch?.unique_users || 0,
        confidence: r.confidence,
        risk_level: node.max_risk_level,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

// ── Emerging patterns detection ──

async function detectEmergingPatterns() {
  const supabase = getSupabase();
  if (!supabase) return [];

  // Get current week search terms
  const { data: currentData } = await supabase.rpc('get_search_term_patterns', { days_back: 7 });
  // Get baseline
  const { data: baselineData } = await supabase.rpc('get_search_term_patterns', { days_back: 90 });

  if (!currentData || !baselineData) return [];

  const baselineMap = Object.fromEntries(
    baselineData.map(b => [b.term, { avg: b.avg_daily_count || 0, std: b.std_daily_count || 1 }])
  );

  const anomalies = [];
  for (const current of currentData) {
    const baseline = baselineMap[current.term] || { avg: 0, std: 1 };
    const zScore = baseline.std > 0
      ? (current.daily_count - baseline.avg) / baseline.std
      : (current.daily_count > 0 ? 3.0 : 0);

    if (zScore > 2.5) {
      anomalies.push({
        term: current.term,
        current_count: current.count,
        daily_count: current.daily_count,
        baseline_avg: Math.round(baseline.avg * 10) / 10,
        z_score: Math.round(zScore * 100) / 100,
        percent_increase: baseline.avg > 0
          ? Math.round(((current.daily_count - baseline.avg) / baseline.avg) * 100)
          : null,
      });
    }
  }

  return anomalies.sort((a, b) => b.z_score - a.z_score).slice(0, 20);
}

module.exports = {
  computeCoOccurrencePatterns,
  getFrequentlyCoSearched,
  detectEmergingPatterns,
};
