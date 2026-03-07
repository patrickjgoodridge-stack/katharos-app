// crowdWisdom.js - Crowd Wisdom Signals
// "50 different users have screened this entity in the last 30 days"
// "This entity was flagged by 7 other compliance teams"
// Aggregates cross-workspace screening activity into risk signals.

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

async function getCrowdSignals(entityName) {
  const supabase = getSupabase();
  if (!supabase) return { is_known_entity: false };

  // Get crowd stats from SQL function
  const { data: stats } = await supabase.rpc('get_entity_crowd_stats', {
    p_entity_name: entityName,
  });

  const row = stats?.[0];
  if (!row || row.total_screenings === 0) {
    return { is_known_entity: false };
  }

  // Get recent activity (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentActivity } = await supabase
    .from('events')
    .select('created_at, email_domain, payload')
    .eq('event_type', 'screening.completed')
    .ilike('entity_name', entityName)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(200);

  const recentCount = recentActivity?.length || 0;
  const uniqueWorkspacesRecent = new Set((recentActivity || []).map(a => a.email_domain).filter(Boolean)).size;
  const riskDistribution = calculateRiskDistribution(recentActivity || []);

  const crowdRiskScore = calculateCrowdRiskScore({
    totalScreenings: Number(row.total_screenings) || 0,
    uniqueWorkspaces: Number(row.unique_workspaces) || 0,
    recentScreenings: recentCount,
    riskDistribution,
    escalationRate: row.escalation_rate || 0,
  });

  return {
    is_known_entity: true,
    total_screenings_all_time: Number(row.total_screenings),
    total_screenings_last_30_days: recentCount,
    unique_organizations_screening: uniqueWorkspacesRecent,
    risk_distribution: riskDistribution,
    escalation_rate: row.escalation_rate || 0,
    crowd_risk_score: crowdRiskScore,
    crowd_signals: generateCrowdSignals(row, uniqueWorkspacesRecent, recentCount),
  };
}

function calculateRiskDistribution(screenings) {
  const dist = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

  for (const s of screenings) {
    const level = s.payload?.risk_level || s.payload?.riskLevel;
    if (level && dist[level] !== undefined) {
      dist[level]++;
    }
  }

  const total = screenings.length || 1;
  return {
    CRITICAL: Math.round((dist.CRITICAL / total) * 100),
    HIGH: Math.round((dist.HIGH / total) * 100),
    MEDIUM: Math.round((dist.MEDIUM / total) * 100),
    LOW: Math.round((dist.LOW / total) * 100),
  };
}

function calculateCrowdRiskScore({ totalScreenings, uniqueWorkspaces, recentScreenings, riskDistribution, escalationRate }) {
  let score = 0;

  // Factor 1: Volume (log scale)
  score += Math.min(20, Math.log10(totalScreenings + 1) * 10);

  // Factor 2: Cross-organization interest
  score += Math.min(25, uniqueWorkspaces * 5);

  // Factor 3: Recent activity spike
  if (recentScreenings > 10) {
    score += Math.min(15, (recentScreenings / 10) * 5);
  }

  // Factor 4: Risk distribution
  score += (riskDistribution.CRITICAL * 0.4) + (riskDistribution.HIGH * 0.2);

  // Factor 5: Escalation rate
  score += escalationRate * 30;

  return Math.min(100, Math.round(score));
}

function generateCrowdSignals(stats, uniqueWorkspaces, recentCount) {
  const signals = [];

  if (recentCount > 20) {
    signals.push({
      type: 'high_activity',
      message: `${recentCount} screenings in the last 30 days`,
      severity: 'warning',
    });
  }

  if (uniqueWorkspaces >= 5) {
    signals.push({
      type: 'cross_org_interest',
      message: `Screened by ${uniqueWorkspaces} different organizations`,
      severity: 'warning',
    });
  }

  if (stats.escalation_rate > 0.3) {
    signals.push({
      type: 'high_escalation',
      message: `${Math.round(stats.escalation_rate * 100)}% of screenings were escalated`,
      severity: 'critical',
    });
  }

  if (Number(stats.total_screenings) > 100) {
    signals.push({
      type: 'high_volume',
      message: `${stats.total_screenings} total screenings across the platform`,
      severity: 'info',
    });
  }

  return signals;
}

async function getTrendingEntities(limit = 20) {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc('get_trending_entities', { result_limit: limit });
  if (error) {
    console.warn('[CrowdWisdom] Trending entities failed:', error.message);
    return [];
  }

  return (data || []).map(d => ({
    entity_name: d.entity_name,
    screening_count: Number(d.screening_count),
    unique_orgs: Number(d.unique_orgs),
    percent_change: d.percent_change,
  }));
}

module.exports = {
  getCrowdSignals,
  getTrendingEntities,
};
