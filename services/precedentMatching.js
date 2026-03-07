// precedentMatching.js - Precedent Matching Engine
// "This entity resembles 47 previous HIGH-risk screenings, 3 of which resulted in enforcement"
// Matches current screenings against historical enforcement actions and prior screening outcomes.

const { Pinecone } = require('@pinecone-database/pinecone');
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk').default;

let _pc = null, _supabase = null, _anthropic = null;

function getPinecone() {
  if (!_pc) _pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  return _pc;
}

function getSupabase() {
  if (!_supabase) {
    const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    _supabase = createClient(url, key);
  }
  return _supabase;
}

function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

function getIndex() {
  return getPinecone().index(process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes');
}

async function embedQuery(text) {
  const pc = getPinecone();
  const result = await pc.inference.embed('multilingual-e5-large', [text], {
    inputType: 'query', truncate: 'END'
  });
  return result.data[0].values;
}

async function embedPassage(text) {
  const pc = getPinecone();
  const result = await pc.inference.embed('multilingual-e5-large', [text], {
    inputType: 'passage', truncate: 'END'
  });
  return result.data[0].values;
}

// ── Feature extraction ──

async function extractFeatures(entityName, entityDetails) {
  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Extract structured features from this entity for compliance risk analysis.

Entity Name: ${entityName}
Additional Details: ${JSON.stringify(entityDetails || {})}

Return a JSON object:
{
  "jurisdiction": "country code or null",
  "jurisdiction_risk": "high/medium/low",
  "sector": "industry sector or null",
  "entity_type": "individual/company/vessel/other",
  "ownership_indicators": [],
  "red_flags": [],
  "keywords": []
}

Return ONLY valid JSON.`
      }],
    });

    return JSON.parse(response.content[0].text);
  } catch (e) {
    console.warn('[Precedent] Feature extraction failed:', e.message);
    return {
      jurisdiction: null,
      sector: null,
      entity_type: 'unknown',
      keywords: entityName.toLowerCase().split(/\s+/).filter(w => w.length > 2),
    };
  }
}

function buildEmbeddingText(entityName, features) {
  const parts = [`Entity: ${entityName}`];
  if (features.jurisdiction) parts.push(`Jurisdiction: ${features.jurisdiction}`);
  if (features.sector) parts.push(`Sector: ${features.sector}`);
  if (features.entity_type) parts.push(`Type: ${features.entity_type}`);
  if (features.ownership_indicators?.length) parts.push(`Ownership: ${features.ownership_indicators.join(', ')}`);
  if (features.red_flags?.length) parts.push(`Red Flags: ${features.red_flags.join(', ')}`);
  if (features.keywords?.length) parts.push(`Keywords: ${features.keywords.join(', ')}`);
  return parts.join(' | ');
}

// ── Enforcement precedent matching ──

async function findSimilarEnforcement(embeddingText) {
  try {
    const vector = await embedQuery(embeddingText);
    const idx = getIndex();
    const results = await idx.namespace('enforcement').query({
      vector,
      topK: 10,
      includeMetadata: true,
    });

    return (results.matches || [])
      .filter(m => m.score > 0.5)
      .map(m => ({
        entity_name: m.metadata?.entity_name || 'Unknown',
        source: m.metadata?.source || 'unknown',
        violation_type: m.metadata?.violation_type,
        penalty_amount: m.metadata?.penalty_amount,
        date: m.metadata?.source_date,
        similarity_score: m.score,
        jurisdiction: m.metadata?.jurisdiction,
        sector: m.metadata?.sector,
      }));
  } catch (e) {
    console.warn('[Precedent] Enforcement search failed:', e.message);
    return [];
  }
}

// ── Screening precedent matching ──

async function findSimilarScreenings(embeddingText) {
  try {
    const vector = await embedQuery(embeddingText);
    const idx = getIndex();
    const results = await idx.namespace('screenings').query({
      vector,
      topK: 50,
      includeMetadata: true,
    });

    const matches = (results.matches || []).filter(m => m.score > 0.5);

    // Aggregate stats
    const highRisk = matches.filter(m =>
      m.metadata?.risk_level === 'HIGH' || m.metadata?.risk_level === 'CRITICAL'
    );

    // Get outcome data if available
    const supabase = getSupabase();
    let escalatedCount = 0, reportedCount = 0, laterSanctionedCount = 0;

    if (supabase && matches.length > 0) {
      const screeningIds = matches
        .map(m => m.metadata?.screening_id)
        .filter(Boolean)
        .slice(0, 50);

      if (screeningIds.length > 0) {
        const { data: outcomes } = await supabase
          .from('screening_outcomes')
          .select('was_escalated, was_reported, report_generated, later_sanctioned')
          .in('screening_id', screeningIds);

        if (outcomes) {
          escalatedCount = outcomes.filter(o => o.was_escalated).length;
          reportedCount = outcomes.filter(o => o.was_reported).length;
          laterSanctionedCount = outcomes.filter(o => o.later_sanctioned).length;
        }
      }
    }

    return {
      statistics: {
        total_similar: matches.length,
        high_risk_count: highRisk.length,
        escalated_count: escalatedCount,
        reported_count: reportedCount,
        later_sanctioned_count: laterSanctionedCount,
        avg_similarity: matches.length > 0
          ? matches.reduce((sum, m) => sum + m.score, 0) / matches.length
          : 0,
      },
      top_similar: matches.slice(0, 5).map(m => ({
        entity_name: m.metadata?.entity_name,
        risk_level: m.metadata?.risk_level,
        similarity_score: m.score,
        date: m.metadata?.screening_date,
      })),
    };
  } catch (e) {
    console.warn('[Precedent] Screening search failed:', e.message);
    return {
      statistics: { total_similar: 0, high_risk_count: 0, escalated_count: 0, reported_count: 0, later_sanctioned_count: 0, avg_similarity: 0 },
      top_similar: [],
    };
  }
}

// ── Risk calculation ──

function calculatePrecedentRisk(enforcementMatches, screeningMatches) {
  const stats = screeningMatches.statistics;
  let riskScore = 0;

  // Factor 1: High risk rate among similar entities
  if (stats.total_similar > 5) {
    const highRiskRate = stats.high_risk_count / stats.total_similar;
    riskScore += highRiskRate * 30;
  }

  // Factor 2: Escalation rate
  if (stats.total_similar > 3) {
    const escalationRate = stats.escalated_count / stats.total_similar;
    riskScore += escalationRate * 25;
  }

  // Factor 3: Later sanctioned
  if (stats.later_sanctioned_count > 0) {
    riskScore += Math.min(stats.later_sanctioned_count * 10, 30);
  }

  // Factor 4: Similar enforcement targets
  if (enforcementMatches.length > 0) {
    const avgSim = enforcementMatches.reduce((s, e) => s + e.similarity_score, 0) / enforcementMatches.length;
    riskScore += avgSim * 30;
  }

  riskScore = Math.min(100, riskScore);

  let riskLevel;
  if (riskScore >= 70) riskLevel = 'CRITICAL';
  else if (riskScore >= 50) riskLevel = 'HIGH';
  else if (riskScore >= 30) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';

  const confidence = Math.min(0.95,
    0.3 + (stats.total_similar / 100) * 0.5 + (enforcementMatches.length / 20) * 0.2
  );

  const reasoning = [];
  if (stats.total_similar > 0) reasoning.push(`Resembles ${stats.total_similar} previously screened entities`);
  if (stats.high_risk_count > 0) {
    const pct = Math.round((stats.high_risk_count / stats.total_similar) * 100);
    reasoning.push(`${pct}% of similar entities were rated HIGH or CRITICAL risk`);
  }
  if (stats.escalated_count > 0) reasoning.push(`${stats.escalated_count} similar entities were escalated`);
  if (stats.later_sanctioned_count > 0) reasoning.push(`${stats.later_sanctioned_count} similar entities were later sanctioned`);
  if (enforcementMatches.length > 0) {
    const top = enforcementMatches[0];
    reasoning.push(`Profile similar to ${top.entity_name} (${top.source} enforcement, ${Math.round(top.similarity_score * 100)}% match)`);
  }

  return {
    score: Math.round(riskScore),
    level: riskLevel,
    confidence: Math.round(confidence * 100) / 100,
    reasoning,
  };
}

// ── Public API ──

async function findPrecedents(entityName, entityDetails = {}) {
  const features = await extractFeatures(entityName, entityDetails);
  const embeddingText = buildEmbeddingText(entityName, features);

  const [enforcementMatches, screeningMatches] = await Promise.all([
    findSimilarEnforcement(embeddingText),
    findSimilarScreenings(embeddingText),
  ]);

  return {
    entity: entityName,
    features,
    enforcement_precedents: enforcementMatches,
    screening_precedents: screeningMatches,
    precedent_risk: calculatePrecedentRisk(enforcementMatches, screeningMatches),
  };
}

async function indexScreening(screeningId, entityName, riskLevel, features = {}) {
  try {
    const embeddingText = buildEmbeddingText(entityName, features);
    const vector = await embedPassage(embeddingText);
    const idx = getIndex();

    await idx.namespace('screenings').upsert([{
      id: screeningId,
      values: vector,
      metadata: {
        screening_id: screeningId,
        entity_name: entityName,
        risk_level: riskLevel,
        jurisdiction: features.jurisdiction || null,
        sector: features.sector || null,
        screening_date: new Date().toISOString(),
      },
    }]);
  } catch (e) {
    console.warn('[Precedent] Index screening failed:', e.message);
  }
}

module.exports = {
  findPrecedents,
  indexScreening,
  extractFeatures,
};
