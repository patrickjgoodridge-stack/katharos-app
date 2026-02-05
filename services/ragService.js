const { Pinecone } = require('@pinecone-database/pinecone');

class RAGService {
  constructor() {
    this._client = null;
    this._index = null;
  }

  _getClient() {
    if (!this._client) {
      const apiKey = process.env.PINECONE_API_KEY;
      if (!apiKey) throw new Error('PINECONE_API_KEY not configured');
      this._client = new Pinecone({ apiKey });
    }
    return this._client;
  }

  _getIndex() {
    if (!this._index) {
      const indexName = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
      this._index = this._getClient().index(indexName);
    }
    return this._index;
  }

  async _embed(text) {
    const client = this._getClient();
    const result = await client.inference.embed('multilingual-e5-large', [text], {
      inputType: 'passage',
      truncate: 'END'
    });
    return result.data[0].values;
  }

  async _embedQuery(text) {
    const client = this._getClient();
    const result = await client.inference.embed('multilingual-e5-large', [text], {
      inputType: 'query',
      truncate: 'END'
    });
    return result.data[0].values;
  }

  chunkText(text, maxChars = 3200, overlap = 400) {
    if (text.length <= maxChars) return [text];
    const chunks = [];
    let start = 0;
    while (start < text.length) {
      let end = start + maxChars;
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('. ', end);
        if (lastPeriod > start + maxChars * 0.5) end = lastPeriod + 1;
      }
      chunks.push(text.substring(start, end));
      start = end - overlap;
    }
    return chunks;
  }

  formatScreeningForEmbedding(result) {
    const parts = [];
    if (result.entityName) parts.push(`Entity: ${result.entityName}`);
    if (result.entityType) parts.push(`Type: ${result.entityType}`);
    if (result.overallRisk) parts.push(`Risk: ${result.overallRisk}`);
    if (result.sanctions?.status) parts.push(`Sanctions: ${result.sanctions.status}`);
    if (result.riskSummary) parts.push(`Summary: ${result.riskSummary}`);
    if (result.pepStatus) parts.push(`PEP: ${result.pepStatus}`);
    if (result.adverseMedia?.summary) parts.push(`Media: ${result.adverseMedia.summary}`);
    return parts.join(' | ');
  }

  formatMessageForEmbedding(message, caseContext = {}) {
    const prefix = caseContext.caseName ? `Case: ${caseContext.caseName}` : '';
    const role = message.role === 'assistant' ? 'Katharos' : 'User';
    return `${prefix} | ${role}: ${message.content}`.trim();
  }

  async search(query, options = {}) {
    const { workspaceId, excludeCaseId, topK = 16, scoreThreshold = 0.7 } = options;
    const index = this._getIndex();
    const queryVector = await this._embedQuery(query);

    const namespaces = [
      { ns: 'prior_screenings', topK: 5 },
      { ns: 'regulatory_docs', topK: 3 },
      { ns: 'enforcement_actions', topK: 3 },
      { ns: 'enforcement_cases', topK: 3 },
      { ns: 'case_notes', topK: 5 }
    ];

    const filter = {};
    if (workspaceId) filter.workspaceId = { $eq: workspaceId };
    if (excludeCaseId) filter.caseId = { $ne: excludeCaseId };
    const hasFilter = Object.keys(filter).length > 0;

    const results = await Promise.all(
      namespaces.map(({ ns, topK: k }) =>
        index.namespace(ns).query({
          vector: queryVector,
          topK: k,
          includeMetadata: true,
          ...(hasFilter ? { filter } : {})
        }).catch(err => {
          console.warn(`[RAG] Query failed for namespace ${ns}:`, err.message);
          return { matches: [] };
        })
      )
    );

    const merged = [];
    results.forEach((r, i) => {
      (r.matches || []).forEach(match => {
        if (match.score >= scoreThreshold) {
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
    return merged.slice(0, topK);
  }

  async index(namespace, id, text, metadata = {}) {
    const idx = this._getIndex();
    const vector = await this._embed(text);
    await idx.namespace(namespace).upsert([{
      id,
      values: vector,
      metadata: { ...metadata, text: text.substring(0, 1000), timestamp: new Date().toISOString() }
    }]);
    return { success: true, id };
  }

  async delete(namespace, id) {
    const idx = this._getIndex();
    await idx.namespace(namespace).deleteOne(id);
    return { success: true };
  }

  /**
   * Find enforcement case studies relevant to screening findings.
   * @param {object} findings - { indicators, typologies, jurisdictions, entityType, riskScore }
   * @param {object} options - { topK, scoreThreshold }
   * @returns {Array} matched cases ranked by similarity
   */
  async findRelevantCases(findings = {}, options = {}) {
    const { topK = 3, scoreThreshold = 0.7 } = options;

    // Build query from findings
    const queryParts = [
      ...(findings.indicators || []),
      ...(findings.typologies || []),
      ...(findings.jurisdictions || []),
      findings.entityType || ''
    ].filter(Boolean);

    if (queryParts.length === 0) return [];

    const query = queryParts.join(' ');
    const queryVector = await this._embedQuery(query);
    const idx = this._getIndex();

    const result = await idx.namespace('enforcement_cases').query({
      vector: queryVector,
      topK,
      includeMetadata: true,
      filter: { category: { $eq: 'enforcement' } }
    }).catch(err => {
      console.warn('[RAG] Enforcement case search failed:', err.message);
      return { matches: [] };
    });

    return (result.matches || [])
      .filter(m => m.score >= scoreThreshold)
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
  }
}

module.exports = { RAGService };
