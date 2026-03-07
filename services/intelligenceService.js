// intelligenceService.js - Unified Intelligence Service
// Orchestrates all intelligence systems into a single API response per entity.
// Combines: Entity Resolution, Precedent Matching, Search Patterns, Crowd Wisdom, Temporal Patterns.

const entityResolution = require('./entityResolution');
const precedentMatching = require('./precedentMatching');
const searchPatterns = require('./searchPatternIntelligence');
const crowdWisdom = require('./crowdWisdom');
const temporalPatterns = require('./temporalPatterns');

// ── Entity Intelligence (per-screening) ──

async function getEntityIntelligence(entityName, entityDetails = {}) {
  const [
    relatedEntities,
    precedents,
    coSearched,
    crowdSignals,
  ] = await Promise.all([
    entityResolution.getRelatedEntities(entityName).catch(e => {
      console.warn('[Intelligence] Entity resolution failed:', e.message);
      return { entity: null, variants: [], related_entities: [] };
    }),
    precedentMatching.findPrecedents(entityName, entityDetails).catch(e => {
      console.warn('[Intelligence] Precedent matching failed:', e.message);
      return { enforcement_precedents: [], screening_precedents: { statistics: {}, top_similar: [] }, precedent_risk: null };
    }),
    searchPatterns.getFrequentlyCoSearched(entityName).catch(e => {
      console.warn('[Intelligence] Search patterns failed:', e.message);
      return [];
    }),
    crowdWisdom.getCrowdSignals(entityName).catch(e => {
      console.warn('[Intelligence] Crowd wisdom failed:', e.message);
      return { is_known_entity: false };
    }),
  ]);

  const confidence = calculateConfidence(relatedEntities, precedents, crowdSignals);

  return {
    entity: entityName,

    // Entity resolution
    known_aliases: relatedEntities.variants?.map(v => v.variant_name) || [],
    related_entities: relatedEntities.related_entities || [],

    // Precedent matching
    enforcement_precedents: precedents.enforcement_precedents || [],
    similar_screenings: precedents.screening_precedents || { statistics: {}, top_similar: [] },
    precedent_risk: precedents.precedent_risk,

    // Search patterns
    frequently_co_searched: coSearched || [],

    // Crowd wisdom
    crowd_signals: crowdSignals,

    // Overall
    intelligence_confidence: confidence,
  };
}

// ── Platform Intelligence (dashboard-level) ──

async function getPlatformIntelligence() {
  const [
    emergingPatterns,
    trendingEntities,
    alerts,
  ] = await Promise.all([
    temporalPatterns.detectEmergingPatterns().catch(() => []),
    crowdWisdom.getTrendingEntities().catch(() => []),
    temporalPatterns.getAlerts().catch(() => []),
  ]);

  return {
    emerging_patterns: emergingPatterns,
    trending_entities: trendingEntities,
    alerts,
    generated_at: new Date().toISOString(),
  };
}

// ── Post-screening processing ──

async function processScreeningEvent(sessionId, entityName, riskLevel, screeningId) {
  // Run entity resolution (learn aliases, co-occurrence)
  const entityNode = await entityResolution.processScreening(sessionId, entityName).catch(e => {
    console.warn('[Intelligence] Entity resolution processing failed:', e.message);
    return null;
  });

  // Index screening for future precedent matching
  await precedentMatching.indexScreening(screeningId, entityName, riskLevel).catch(e => {
    console.warn('[Intelligence] Screening indexing failed:', e.message);
  });

  return entityNode;
}

// ── Daily batch jobs ──

async function runDailyIntelligenceJobs() {
  console.log('[Intelligence] Starting daily jobs...');

  // 1. Compute co-occurrence patterns
  console.log('[Intelligence] Computing co-occurrence patterns...');
  await searchPatterns.computeCoOccurrencePatterns().catch(e => {
    console.error('[Intelligence] Co-occurrence failed:', e.message);
  });

  // 2. Generate and store temporal alerts
  console.log('[Intelligence] Detecting temporal patterns...');
  const alerts = await temporalPatterns.getAlerts().catch(() => []);
  if (alerts.length > 0) {
    await temporalPatterns.storeAlerts(alerts).catch(e => {
      console.error('[Intelligence] Alert storage failed:', e.message);
    });
    console.log(`[Intelligence] Stored ${alerts.length} alerts`);
  }

  console.log('[Intelligence] Daily jobs complete.');
}

// ── Helpers ──

function calculateConfidence(entityData, precedents, crowdSignals) {
  let confidence = 0.3;

  if (entityData.variants?.length > 1) confidence += 0.1;
  if (precedents.screening_precedents?.statistics?.total_similar > 10) confidence += 0.2;
  if (crowdSignals.total_screenings_all_time > 5) confidence += 0.1;
  if (precedents.enforcement_precedents?.length > 0) confidence += 0.2;

  return Math.min(0.95, Math.round(confidence * 100) / 100);
}

module.exports = {
  getEntityIntelligence,
  getPlatformIntelligence,
  processScreeningEvent,
  runDailyIntelligenceJobs,
};
