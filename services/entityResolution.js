// entityResolution.js - Entity Resolution Graph
// Learns that "LetterOne" and "Letter One Holdings" and "L1 Energy" are the same entity
// without human labeling. Uses session co-occurrence, fuzzy matching, and user re-queries.

const { Pinecone } = require('@pinecone-database/pinecone');
const { createClient } = require('@supabase/supabase-js');

let _pc = null, _supabase = null;

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

async function embed(text) {
  const pc = getPinecone();
  const result = await pc.inference.embed('multilingual-e5-large', [text], {
    inputType: 'passage', truncate: 'END'
  });
  return result.data[0].values;
}

async function embedQuery(text) {
  const pc = getPinecone();
  const result = await pc.inference.embed('multilingual-e5-large', [text], {
    inputType: 'query', truncate: 'END'
  });
  return result.data[0].values;
}

function getIndex() {
  return getPinecone().index(process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes');
}

// ── Name normalization ──

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAbbreviation(name) {
  return name.split(/\s+/).map(w => w[0] || '').join('').toUpperCase();
}

function levenshtein(a, b) {
  const m = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) m[0][i] = i;
  for (let j = 0; j <= b.length; j++) m[j][0] = j;
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const ind = a[i - 1] === b[j - 1] ? 0 : 1;
      m[j][i] = Math.min(m[j][i - 1] + 1, m[j - 1][i] + 1, m[j - 1][i - 1] + ind);
    }
  }
  return m[b.length][a.length];
}

function looksLikeVariant(name1, name2) {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  if (n1 === n2) return true;

  const distance = levenshtein(n1, n2);
  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) return false;
  const similarity = 1 - (distance / maxLen);
  if (similarity > 0.8) return true;

  if (n1.includes(n2) || n2.includes(n1)) return true;

  const abbrev1 = getAbbreviation(n1);
  const abbrev2 = getAbbreviation(n2);
  if (abbrev1.length > 1 && (abbrev1 === n2.toUpperCase() || abbrev2 === n1.toUpperCase())) return true;

  return false;
}

// ── Core operations ──

async function findOrCreateEntity(entityName) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const normalized = normalizeName(entityName);
  if (!normalized) return null;

  // Check known variants
  const { data: existingVariant } = await supabase
    .from('entity_variants')
    .select('id, entity_node_id, times_searched')
    .eq('variant_name', normalized)
    .single();

  if (existingVariant) {
    await supabase
      .from('entity_variants')
      .update({ times_searched: (existingVariant.times_searched || 0) + 1 })
      .eq('id', existingVariant.id);

    const { data: node } = await supabase
      .from('entity_nodes')
      .select('*')
      .eq('id', existingVariant.entity_node_id)
      .single();

    return node;
  }

  // Check for fuzzy match via Pinecone
  const similarEntity = await findSimilarEntity(normalized);
  if (similarEntity && similarEntity.confidence > 0.85) {
    await addVariant(similarEntity.entityNodeId, normalized, 'fuzzy_match', similarEntity.confidence);
    return similarEntity.entityNode;
  }

  // Create new entity
  const { data: newEntity, error } = await supabase
    .from('entity_nodes')
    .insert({ canonical_name: entityName })
    .select()
    .single();

  if (error) {
    console.error('[EntityRes] Create entity failed:', error.message);
    return null;
  }

  await addVariant(newEntity.id, normalized, 'primary', 1.0);

  // Index for future similarity lookups
  try {
    const vector = await embed(entityName);
    const idx = getIndex();
    await idx.namespace('entities').upsert([{
      id: newEntity.id,
      values: vector,
      metadata: { canonical_name: entityName, entity_node_id: newEntity.id },
    }]);
  } catch (e) {
    console.warn('[EntityRes] Pinecone index failed:', e.message);
  }

  return newEntity;
}

async function findSimilarEntity(normalizedName) {
  try {
    const vector = await embedQuery(normalizedName);
    const idx = getIndex();
    const results = await idx.namespace('entities').query({
      vector,
      topK: 5,
      includeMetadata: true,
    });

    if (results.matches && results.matches.length > 0 && results.matches[0].score > 0.85) {
      const match = results.matches[0];
      const supabase = getSupabase();
      const { data: node } = await supabase
        .from('entity_nodes')
        .select('*')
        .eq('id', match.metadata?.entity_node_id || match.id)
        .single();

      if (node) {
        return { entityNodeId: node.id, entityNode: node, confidence: match.score };
      }
    }
  } catch (e) {
    console.warn('[EntityRes] Similarity search failed:', e.message);
  }
  return null;
}

async function addVariant(entityNodeId, variantName, source, confidence) {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase
    .from('entity_variants')
    .upsert({
      entity_node_id: entityNodeId,
      variant_name: variantName,
      source,
      confidence,
      times_searched: 1,
    }, { onConflict: 'entity_node_id,variant_name' });
}

async function processSessionCoOccurrence(sessionId, currentEntityId, currentEntityName) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { data: sessionScreenings } = await supabase
    .from('events')
    .select('entity_name')
    .eq('session_id', sessionId)
    .eq('event_type', 'screening.completed')
    .neq('entity_name', currentEntityName)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!sessionScreenings || sessionScreenings.length === 0) return;

  for (const screening of sessionScreenings) {
    if (!screening.entity_name) continue;
    const otherEntity = await findOrCreateEntity(screening.entity_name);
    if (!otherEntity) continue;

    if (looksLikeVariant(currentEntityName, screening.entity_name)) {
      await mergeEntities(currentEntityId, otherEntity.id, 'user_requery');
    } else {
      await recordCoOccurrence(currentEntityId, otherEntity.id, sessionId);
    }
  }
}

async function mergeEntities(entityId1, entityId2, source) {
  if (entityId1 === entityId2) return;
  const supabase = getSupabase();
  if (!supabase) return;

  const { data: entities } = await supabase
    .from('entity_nodes')
    .select('*')
    .in('id', [entityId1, entityId2]);

  if (!entities || entities.length !== 2) return;

  const [primary, secondary] = entities.sort((a, b) => (b.total_screenings || 0) - (a.total_screenings || 0));

  // Move variants, edges, outcomes
  await supabase.from('entity_variants').update({ entity_node_id: primary.id }).eq('entity_node_id', secondary.id);
  await supabase.from('entity_edges').update({ source_entity_id: primary.id }).eq('source_entity_id', secondary.id);
  await supabase.from('entity_edges').update({ target_entity_id: primary.id }).eq('target_entity_id', secondary.id);
  await supabase.from('screening_outcomes').update({ entity_node_id: primary.id }).eq('entity_node_id', secondary.id);

  // Merge stats
  await supabase.from('entity_nodes').update({
    total_screenings: (primary.total_screenings || 0) + (secondary.total_screenings || 0),
    unique_users: (primary.unique_users || 0) + (secondary.unique_users || 0),
    updated_at: new Date().toISOString(),
  }).eq('id', primary.id);

  await supabase.from('entity_nodes').delete().eq('id', secondary.id);

  console.log(`[EntityRes] Merged "${secondary.canonical_name}" → "${primary.canonical_name}" (${source})`);
}

async function recordCoOccurrence(entityId1, entityId2, sessionId) {
  if (entityId1 === entityId2) return;
  const supabase = getSupabase();
  if (!supabase) return;

  const [sourceId, targetId] = [entityId1, entityId2].sort();

  const { data: existing } = await supabase
    .from('entity_edges')
    .select('*')
    .eq('source_entity_id', sourceId)
    .eq('target_entity_id', targetId)
    .single();

  if (existing) {
    const evidence = existing.evidence || [];
    let coSearch = evidence.find(e => e.type === 'co_search') || { type: 'co_search', sessions: [], count: 0 };
    if (!coSearch.sessions.includes(sessionId)) {
      coSearch.sessions = [...coSearch.sessions, sessionId].slice(-100); // cap history
      coSearch.count++;
      const newConfidence = Math.min(0.95, 0.3 + (coSearch.count * 0.05));

      await supabase.from('entity_edges').update({
        evidence: [...evidence.filter(e => e.type !== 'co_search'), coSearch],
        confidence: newConfidence,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    }
  } else {
    await supabase.from('entity_edges').insert({
      source_entity_id: sourceId,
      target_entity_id: targetId,
      relationship_type: 'unknown',
      confidence: 0.3,
      evidence: [{ type: 'co_search', sessions: [sessionId], count: 1 }],
    });
  }
}

// ── Public API ──

async function processScreening(sessionId, entityName) {
  const entityNode = await findOrCreateEntity(entityName);
  if (!entityNode) return null;

  const supabase = getSupabase();
  if (supabase) {
    await supabase.from('entity_nodes').update({
      total_screenings: (entityNode.total_screenings || 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', entityNode.id);
  }

  await processSessionCoOccurrence(sessionId, entityNode.id, entityName);

  return entityNode;
}

async function getRelatedEntities(entityName) {
  const supabase = getSupabase();
  if (!supabase) return { entity: null, variants: [], related_entities: [] };

  const entity = await findOrCreateEntity(entityName);
  if (!entity) return { entity: null, variants: [], related_entities: [] };

  const { data: variants } = await supabase
    .from('entity_variants')
    .select('variant_name, variant_type, confidence')
    .eq('entity_node_id', entity.id);

  const { data: sourceEdges } = await supabase
    .from('entity_edges')
    .select('relationship_type, confidence, target_entity_id')
    .eq('source_entity_id', entity.id)
    .gte('confidence', 0.4)
    .order('confidence', { ascending: false })
    .limit(20);

  const { data: targetEdges } = await supabase
    .from('entity_edges')
    .select('relationship_type, confidence, source_entity_id')
    .eq('target_entity_id', entity.id)
    .gte('confidence', 0.4)
    .order('confidence', { ascending: false })
    .limit(20);

  // Resolve entity names for edges
  const relatedIds = [
    ...(sourceEdges || []).map(e => e.target_entity_id),
    ...(targetEdges || []).map(e => e.source_entity_id),
  ];

  let relatedEntities = [];
  if (relatedIds.length > 0) {
    const { data: relatedNodes } = await supabase
      .from('entity_nodes')
      .select('id, canonical_name, max_risk_level')
      .in('id', relatedIds);

    const nodeMap = Object.fromEntries((relatedNodes || []).map(n => [n.id, n]));

    relatedEntities = [
      ...(sourceEdges || []).map(e => ({
        name: nodeMap[e.target_entity_id]?.canonical_name,
        relationship: e.relationship_type,
        confidence: e.confidence,
        risk_level: nodeMap[e.target_entity_id]?.max_risk_level,
      })),
      ...(targetEdges || []).map(e => ({
        name: nodeMap[e.source_entity_id]?.canonical_name,
        relationship: e.relationship_type,
        confidence: e.confidence,
        risk_level: nodeMap[e.source_entity_id]?.max_risk_level,
      })),
    ].filter(e => e.name);
  }

  return { entity, variants: variants || [], related_entities: relatedEntities };
}

module.exports = {
  findOrCreateEntity,
  processScreening,
  getRelatedEntities,
  looksLikeVariant,
  normalizeName,
};
