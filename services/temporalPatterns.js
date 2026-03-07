// temporalPatterns.js - Temporal Pattern Detection
// Detects emerging evasion routes, enforcement trends, and anomalies.
// Compares current search patterns against historical baselines.

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

// ── Keyword extraction from entity names ──

const HIGH_RISK_JURISDICTIONS = ['russia', 'iran', 'north korea', 'syria', 'cuba', 'venezuela', 'myanmar', 'belarus'];
const SECTOR_KEYWORDS = ['semiconductor', 'oil', 'gas', 'bank', 'shipping', 'crypto', 'defense', 'military', 'trading', 'energy', 'nuclear', 'chemical'];
const STRUCTURE_KEYWORDS = ['shell', 'holding', 'offshore', 'trust', 'foundation'];

function extractKeywords(entityName) {
  if (!entityName) return [];
  const name = entityName.toLowerCase();
  const keywords = [];

  for (const j of HIGH_RISK_JURISDICTIONS) {
    if (name.includes(j)) keywords.push(j);
  }
  for (const s of SECTOR_KEYWORDS) {
    if (name.includes(s)) keywords.push(s);
  }
  for (const s of STRUCTURE_KEYWORDS) {
    if (name.includes(s)) keywords.push(s);
  }
  return keywords;
}

// ── Pattern counting from events ──

async function getPatternCounts(days) {
  const supabase = getSupabase();
  if (!supabase) return {};

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: events } = await supabase
    .from('events')
    .select('entity_name, payload')
    .eq('event_type', 'screening.completed')
    .gte('created_at', since)
    .limit(5000);

  const patterns = {};

  for (const event of events || []) {
    // Jurisdiction patterns from payload
    const jurisdiction = event.payload?.jurisdiction;
    if (jurisdiction) {
      const key = `jurisdiction:${jurisdiction.toLowerCase()}`;
      patterns[key] = (patterns[key] || 0) + 1;
    }

    // Sector patterns from payload
    const sector = event.payload?.sector;
    if (sector) {
      const key = `sector:${sector.toLowerCase()}`;
      patterns[key] = (patterns[key] || 0) + 1;
    }

    // Keyword patterns from entity names
    const keywords = extractKeywords(event.entity_name);
    for (const keyword of keywords) {
      const key = `keyword:${keyword}`;
      patterns[key] = (patterns[key] || 0) + 1;
    }

    // Risk level patterns
    const riskLevel = event.payload?.risk_level || event.payload?.riskLevel;
    if (riskLevel) {
      const key = `risk:${riskLevel}`;
      patterns[key] = (patterns[key] || 0) + 1;
    }
  }

  return patterns;
}

// ── Baseline computation ──

async function getBaselineStats(totalDays, excludeRecentDays) {
  const weeks = Math.floor((totalDays - excludeRecentDays) / 7);
  if (weeks < 2) return {};

  // Get full period and recent period, compute difference
  const fullPatterns = await getPatternCounts(totalDays);
  const recentPatterns = await getPatternCounts(excludeRecentDays);

  // Baseline = full minus recent, divided by weeks
  const stats = {};
  const allKeys = new Set([...Object.keys(fullPatterns), ...Object.keys(recentPatterns)]);

  for (const key of allKeys) {
    const total = (fullPatterns[key] || 0) - (recentPatterns[key] || 0);
    const weeklyAvg = total / Math.max(weeks, 1);
    // Approximate std as sqrt of mean (Poisson assumption for sparse data)
    const std = Math.max(Math.sqrt(weeklyAvg), 1);
    stats[key] = { mean: weeklyAvg, std };
  }

  return stats;
}

// ── Emerging pattern detection ──

async function detectEmergingPatterns() {
  const currentPatterns = await getPatternCounts(7);
  const baselineStats = await getBaselineStats(90, 7);

  const anomalies = [];

  for (const [pattern, currentCount] of Object.entries(currentPatterns)) {
    const baseline = baselineStats[pattern] || { mean: 0, std: 1 };
    const zScore = (currentCount - baseline.mean) / (baseline.std || 1);

    if (zScore > 2.5 && currentCount >= 3) {
      anomalies.push({
        pattern,
        current_weekly_count: currentCount,
        baseline_weekly_avg: Math.round(baseline.mean * 10) / 10,
        z_score: Math.round(zScore * 100) / 100,
        percent_increase: baseline.mean > 0
          ? Math.round(((currentCount - baseline.mean) / baseline.mean) * 100)
          : null,
        signal_type: classifyPattern(pattern),
      });
    }
  }

  return anomalies.sort((a, b) => b.z_score - a.z_score).slice(0, 20);
}

function classifyPattern(pattern) {
  const [type, value] = pattern.split(':');

  if (type === 'jurisdiction') {
    return HIGH_RISK_JURISDICTIONS.includes(value) ? 'high_risk_jurisdiction_spike' : 'jurisdiction_trend';
  }
  if (type === 'sector') return 'sector_trend';
  if (type === 'keyword') return 'emerging_keyword';
  if (type === 'risk') return 'risk_distribution_shift';
  return 'unknown';
}

// ── Alerts ──

async function getAlerts() {
  const patterns = await detectEmergingPatterns();

  return patterns
    .filter(p => p.z_score > 3.0)
    .map(p => ({
      title: formatAlertTitle(p),
      description: formatAlertDescription(p),
      severity: p.z_score > 4.0 ? 'critical' : 'warning',
      pattern: p,
    }));
}

function formatAlertTitle(pattern) {
  const [type, value] = pattern.pattern.split(':');

  if (type === 'jurisdiction') return `Spike in ${value.toUpperCase()} screenings`;
  if (type === 'sector') return `Increased ${value} sector activity`;
  if (type === 'keyword') return `Trending: "${value}"`;
  if (type === 'risk') return `${value} risk distribution shift`;
  return `Anomaly: ${pattern.pattern}`;
}

function formatAlertDescription(pattern) {
  if (pattern.percent_increase) {
    return `${pattern.percent_increase}% increase vs. baseline (${pattern.current_weekly_count} this week vs. avg ${pattern.baseline_weekly_avg})`;
  }
  return `${pattern.current_weekly_count} screenings this week (new pattern)`;
}

// ── Store alerts ──

async function storeAlerts(alerts) {
  const supabase = getSupabase();
  if (!supabase || alerts.length === 0) return;

  await supabase.from('platform_alerts').insert(
    alerts.map(a => ({
      alert_type: a.severity,
      title: a.title,
      description: a.description,
      metadata: a.pattern,
    }))
  );
}

module.exports = {
  detectEmergingPatterns,
  getAlerts,
  storeAlerts,
  extractKeywords,
};
