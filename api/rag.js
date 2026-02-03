import { Pinecone } from '@pinecone-database/pinecone';

let client = null;
let index = null;

function getClient() {
  if (!client) {
    client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return client;
}

function getIndex() {
  if (!index) {
    index = getClient().index(process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes');
  }
  return index;
}

async function embed(text, inputType = 'passage') {
  const pc = getClient();
  const result = await pc.inference.embed('multilingual-e5-large', [text], {
    inputType,
    truncate: 'END'
  });
  return result.data[0].values;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.PINECONE_API_KEY) {
    return res.status(503).json({ error: 'Pinecone not configured' });
  }

  const { action, query, filters, namespace, text, metadata, id } = req.body;

  try {
    if (action === 'search') {
      const queryVector = await embed(query, 'query');
      const idx = getIndex();
      const namespaces = [
        { ns: 'prior_screenings', topK: 5 },
        { ns: 'regulatory_docs', topK: 3 },
        { ns: 'enforcement_actions', topK: 3 },
        { ns: 'enforcement_cases', topK: 3 },
        { ns: 'case_notes', topK: 5 }
      ];

      const filter = {};
      if (filters?.workspaceId) filter.workspaceId = { $eq: filters.workspaceId };
      if (filters?.excludeCaseId) filter.caseId = { $ne: filters.excludeCaseId };
      const hasFilter = Object.keys(filter).length > 0;

      const searchPromise = Promise.all(
        namespaces.map(({ ns, topK }) =>
          idx.namespace(ns).query({
            vector: queryVector,
            topK,
            includeMetadata: true,
            ...(hasFilter ? { filter } : {})
          }).catch(() => ({ matches: [] }))
        )
      );

      const results = await Promise.race([
        searchPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);

      const merged = [];
      results.forEach((r, i) => {
        (r.matches || []).forEach(match => {
          if (match.score >= 0.7) {
            merged.push({
              id: match.id,
              score: match.score,
              namespace: namespaces[i].ns,
              metadata: match.metadata || {}
            });
          }
        });
      });

      merged.sort((a, b) => b.score - a.score);
      return res.json({ results: merged.slice(0, 16) });

    } else if (action === 'index') {
      if (!namespace || !text) {
        return res.status(400).json({ error: 'namespace and text required' });
      }
      const vector = await embed(text);
      const vecId = id || `${namespace}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await getIndex().namespace(namespace).upsert([{
        id: vecId,
        values: vector,
        metadata: { ...metadata, text: text.substring(0, 1000), timestamp: new Date().toISOString() }
      }]);
      return res.json({ success: true, id: vecId });

    } else if (action === 'findCases') {
      // Find enforcement case studies relevant to screening findings
      const { findings = {} } = req.body;
      const queryParts = [
        ...(findings.indicators || []),
        ...(findings.typologies || []),
        ...(findings.jurisdictions || []),
        findings.entityType || ''
      ].filter(Boolean);

      if (queryParts.length === 0) return res.json({ cases: [] });

      const queryVector = await embed(queryParts.join(' '), 'query');
      const idx = getIndex();
      const result = await idx.namespace('enforcement_cases').query({
        vector: queryVector,
        topK: 3,
        includeMetadata: true,
        filter: { category: { $eq: 'enforcement' } }
      }).catch(() => ({ matches: [] }));

      const cases = (result.matches || [])
        .filter(m => m.score >= 0.7)
        .map(m => ({
          caseName: m.metadata.name,
          year: m.metadata.year,
          entity: m.metadata.entity,
          penalty: m.metadata.penalty,
          regulators: m.metadata.regulators,
          typologies: m.metadata.typologies,
          relevance: m.score,
          lesson: m.metadata.lessonForScreening,
          whatHappened: m.metadata.whatHappened
        }));

      return res.json({ cases });

    } else if (action === 'delete') {
      if (!namespace || !id) {
        return res.status(400).json({ error: 'namespace and id required' });
      }
      await getIndex().namespace(namespace).deleteOne(id);
      return res.json({ success: true });

    } else {
      return res.status(400).json({ error: 'Invalid action. Use: search, index, delete, findCases' });
    }
  } catch (error) {
    console.error('[RAG]', error);
    return res.status(500).json({ error: error.message });
  }
}
