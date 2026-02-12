// OCCRPAlephService — OCCRP Aleph investigative data platform integration
// Searches leaked documents, corporate registries, sanctions lists, offshore leaks

const { BoundedCache } = require('./boundedCache');

class OCCRPAlephService {

  constructor() {
    this.baseUrl = 'https://aleph.occrp.org/api/2';
    this.apiKey = process.env.OCCRP_ALEPH_API_KEY;
    this.cache = new BoundedCache({ maxSize: 200, ttlMs: 60 * 60 * 1000 });
  }

  headers() {
    const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (this.apiKey) h['Authorization'] = `ApiKey ${this.apiKey}`;
    return h;
  }

  // ============================================
  // MAIN ENTRY POINT
  // ============================================

  async screenEntity(entity) {
    const { name, type } = entity;

    const [entityResults, documentResults] = await Promise.all([
      this.searchEntities(name),
      this.searchDocuments(name)
    ]);

    const processedEntities = this.processEntityResults(entityResults, name);
    const processedDocuments = this.processDocumentResults(documentResults, name);
    const datasetMatches = this.identifyDatasets(processedEntities, processedDocuments);
    const riskAssessment = this.calculateRiskScore(processedEntities, processedDocuments, datasetMatches);

    return {
      entity: { name, type },
      summary: {
        totalResults: (entityResults.total || 0) + (documentResults.total || 0),
        entityMatches: processedEntities.length,
        documentMatches: processedDocuments.length,
        datasetMatches,
        riskScore: riskAssessment.score
      },
      entities: processedEntities.slice(0, 50),
      documents: processedDocuments.slice(0, 50),
      riskFlags: riskAssessment.flags,
      sourcesSearched: ['occrp_aleph'],
      searchedAt: new Date().toISOString()
    };
  }

  // ============================================
  // SEARCH APIs
  // ============================================

  async searchEntities(query, options = {}) {
    const cacheKey = `entities:${query}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      q: query,
      limit: String(options.limit || 100),
      offset: String(options.offset || 0)
    });
    if (options.schema) params.append('filter:schema', options.schema);
    if (options.collections) {
      for (const c of options.collections) params.append('filter:collection_id', c);
    }

    try {
      const response = await fetch(`${this.baseUrl}/entities?${params}`, {
        headers: this.headers(), signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) return { results: [], total: 0 };
      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (e) {
      console.error('Aleph entity search error:', e.message);
      return { results: [], total: 0 };
    }
  }

  async searchDocuments(query, options = {}) {
    const cacheKey = `documents:${query}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      q: query,
      limit: String(options.limit || 100),
      offset: String(options.offset || 0)
    });

    try {
      const response = await fetch(`${this.baseUrl}/documents?${params}`, {
        headers: this.headers(), signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) return { results: [], total: 0 };
      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (e) {
      console.error('Aleph document search error:', e.message);
      return { results: [], total: 0 };
    }
  }

  async getEntity(entityId) {
    try {
      const response = await fetch(`${this.baseUrl}/entities/${entityId}`, {
        headers: this.headers(), signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) return null;
      return response.json();
    } catch (e) { return null; }
  }

  async getEntityRelationships(entityId, options = {}) {
    const params = new URLSearchParams({
      limit: String(options.limit || 50),
      offset: String(options.offset || 0)
    });
    try {
      const response = await fetch(`${this.baseUrl}/entities/${entityId}/similar?${params}`, {
        headers: this.headers(), signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) return { results: [], total: 0 };
      return response.json();
    } catch (e) { return { results: [], total: 0 }; }
  }

  async crossReference(entity) {
    const payload = {
      schema: entity.type === 'company' ? 'Company' : 'Person',
      properties: { name: [entity.name] }
    };
    if (entity.dateOfBirth) payload.properties.birthDate = [entity.dateOfBirth];
    if (entity.nationality) payload.properties.nationality = [entity.nationality];
    if (entity.country) payload.properties.country = [entity.country];
    if (entity.registrationNumber) payload.properties.registrationNumber = [entity.registrationNumber];

    try {
      const response = await fetch(`${this.baseUrl}/match`, {
        method: 'POST', headers: this.headers(), body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) return { results: [], total: 0 };
      return response.json();
    } catch (e) {
      console.error('Cross-reference error:', e.message);
      return { results: [], total: 0 };
    }
  }

  // ============================================
  // NETWORK EXPANSION
  // ============================================

  async expandNetwork(entityId, depth = 1) {
    const visited = new Set();
    const network = { nodes: [], edges: [] };

    const expand = async (id, currentDepth) => {
      if (visited.has(id) || currentDepth > depth) return;
      visited.add(id);

      const entity = await this.getEntity(id);
      if (!entity) return;

      network.nodes.push({
        id: entity.id,
        name: entity.properties?.name?.[0],
        type: this.mapSchemaToType(entity.schema),
        depth: currentDepth
      });

      const relationships = await this.getEntityRelationships(id);
      for (const related of (relationships.results || [])) {
        network.edges.push({ source: id, target: related.id, type: related.schema });
        if (currentDepth < depth) await expand(related.id, currentDepth + 1);
      }
    };

    await expand(entityId, 0);
    return network;
  }

  // ============================================
  // DATA PROCESSING
  // ============================================

  processEntityResults(results, searchName) {
    if (!results.results) return [];
    const searchNameLower = searchName.toLowerCase();

    return results.results.map(entity => {
      const properties = entity.properties || {};
      const names = [
        ...(properties.name || []),
        ...(properties.alias || []),
        ...(properties.previousName || [])
      ].map(n => n.toLowerCase());

      let matchConfidence = 0;
      for (const name of names) {
        if (name === searchNameLower) { matchConfidence = 1.0; break; }
        else if (name.includes(searchNameLower) || searchNameLower.includes(name)) {
          matchConfidence = Math.max(matchConfidence, 0.8);
        } else {
          matchConfidence = Math.max(matchConfidence, this.calculateSimilarity(name, searchNameLower));
        }
      }

      return {
        id: entity.id,
        schema: entity.schema,
        name: properties.name?.[0] || 'Unknown',
        aliases: properties.alias || [],
        type: this.mapSchemaToType(entity.schema),
        properties: {
          dateOfBirth: properties.birthDate?.[0],
          nationality: properties.nationality || [],
          country: properties.country || [],
          address: properties.address?.[0],
          registrationNumber: properties.registrationNumber?.[0],
          incorporationDate: properties.incorporationDate?.[0],
          jurisdiction: properties.jurisdiction?.[0],
          status: properties.status?.[0]
        },
        collection: {
          id: entity.collection?.id,
          label: entity.collection?.label,
          category: entity.collection?.category
        },
        matchConfidence,
        url: `https://aleph.occrp.org/entities/${entity.id}`,
        updatedAt: entity.updated_at
      };
    })
    .filter(e => e.matchConfidence >= 0.6)
    .sort((a, b) => b.matchConfidence - a.matchConfidence);
  }

  processDocumentResults(results, searchName) {
    if (!results.results) return [];
    return results.results.map(doc => {
      const properties = doc.properties || {};
      return {
        id: doc.id,
        title: properties.title?.[0] || properties.fileName?.[0] || 'Untitled',
        fileName: properties.fileName?.[0],
        fileType: properties.mimeType?.[0],
        fileSize: properties.fileSize?.[0],
        date: properties.date?.[0] || properties.createdAt?.[0],
        author: properties.author?.[0],
        summary: properties.summary?.[0],
        collection: {
          id: doc.collection?.id,
          label: doc.collection?.label,
          category: doc.collection?.category
        },
        snippet: doc.highlight?.text?.[0] || null,
        url: `https://aleph.occrp.org/documents/${doc.id}`,
        updatedAt: doc.updated_at
      };
    });
  }

  mapSchemaToType(schema) {
    const mapping = {
      'Person': 'individual', 'LegalEntity': 'company', 'Company': 'company',
      'Organization': 'organization', 'PublicBody': 'government', 'Asset': 'asset',
      'RealEstate': 'property', 'Vehicle': 'vehicle', 'Vessel': 'vessel',
      'Aircraft': 'aircraft', 'BankAccount': 'bank_account', 'CryptoWallet': 'crypto_wallet',
      'Directorship': 'relationship', 'Ownership': 'relationship',
      'Family': 'relationship', 'Associate': 'relationship'
    };
    return mapping[schema] || 'unknown';
  }

  // ============================================
  // DATASET IDENTIFICATION
  // ============================================

  identifyDatasets(entities, documents) {
    const datasets = new Set();
    const highProfileDatasets = {
      'panama_papers': ['panama', 'mossack fonseca'],
      'paradise_papers': ['paradise', 'appleby'],
      'pandora_papers': ['pandora'],
      'offshore_leaks': ['offshore leaks', 'icij'],
      'bahamas_leaks': ['bahamas'],
      'swiss_leaks': ['hsbc', 'swiss'],
      'lux_leaks': ['luxembourg', 'pwc'],
      'fincen_files': ['fincen', 'suspicious activity'],
      'uk_companies_house': ['companies house', 'uk companies'],
      'us_sec': ['sec', 'edgar'],
      'opencorporates': ['opencorporates'],
      'ofac': ['ofac', 'sdn'],
      'eu_sanctions': ['eu sanctions', 'european union'],
      'un_sanctions': ['un sanctions', 'security council'],
      'occrp_investigations': ['occrp', 'organized crime'],
      'world_bank_debarment': ['world bank', 'debarment']
    };

    const allItems = [
      ...entities.map(e => (e.collection?.label || '').toLowerCase()),
      ...documents.map(d => (d.collection?.label || '').toLowerCase())
    ];

    for (const label of allItems) {
      for (const [dataset, keywords] of Object.entries(highProfileDatasets)) {
        if (keywords.some(kw => label.includes(kw))) datasets.add(dataset);
      }
    }
    return [...datasets];
  }

  // ============================================
  // RISK SCORING
  // ============================================

  calculateRiskScore(entities, documents, datasets) {
    let score = 0;
    const flags = [];

    const highConfidenceMatches = entities.filter(e => e.matchConfidence >= 0.9);
    if (highConfidenceMatches.length > 0) {
      score += 20;
      flags.push({
        severity: 'HIGH', type: 'ENTITY_MATCH',
        message: `${highConfidenceMatches.length} high-confidence entity match(es) in OCCRP Aleph`,
        entities: highConfidenceMatches.slice(0, 5).map(e => ({
          name: e.name, type: e.type, collection: e.collection.label, confidence: e.matchConfidence
        }))
      });
    }

    const leakDatasets = ['panama_papers', 'paradise_papers', 'pandora_papers', 'offshore_leaks', 'bahamas_leaks', 'swiss_leaks', 'fincen_files'];
    const leakMatches = datasets.filter(d => leakDatasets.includes(d));
    if (leakMatches.length > 0) {
      score += 30 + (leakMatches.length - 1) * 10;
      flags.push({ severity: 'CRITICAL', type: 'LEAK_DATABASE_MATCH', message: `Found in leaked database(s): ${leakMatches.join(', ')}`, datasets: leakMatches });
    }

    const sanctionDatasets = ['ofac', 'eu_sanctions', 'un_sanctions'];
    const sanctionMatches = datasets.filter(d => sanctionDatasets.includes(d));
    if (sanctionMatches.length > 0) {
      score += 50;
      flags.push({ severity: 'CRITICAL', type: 'SANCTIONS_DATABASE', message: `Appears in sanctions database(s): ${sanctionMatches.join(', ')}`, datasets: sanctionMatches });
    }

    if (datasets.includes('world_bank_debarment')) {
      score += 25;
      flags.push({ severity: 'HIGH', type: 'WORLD_BANK_DEBARMENT', message: 'Listed in World Bank debarment database' });
    }

    if (documents.length > 50) {
      score += 15;
      flags.push({ severity: 'MEDIUM', type: 'HIGH_DOCUMENT_VOLUME', message: `${documents.length} documents mentioning this entity` });
    } else if (documents.length > 10) {
      score += 10;
      flags.push({ severity: 'LOW', type: 'DOCUMENT_MENTIONS', message: `${documents.length} documents mentioning this entity` });
    }

    const entityTypes = new Set(entities.map(e => e.type));
    if (entityTypes.size >= 3) {
      score += 10;
      flags.push({ severity: 'MEDIUM', type: 'COMPLEX_STRUCTURE', message: `Entity appears in multiple forms: ${[...entityTypes].join(', ')}` });
    }

    const offshoreJurisdictions = ['bvi', 'british virgin islands', 'cayman', 'panama', 'seychelles', 'bahamas', 'jersey', 'guernsey', 'isle of man', 'liechtenstein'];
    const offshoreEntities = entities.filter(e => {
      const j = (e.properties.jurisdiction || '').toLowerCase();
      const c = (e.properties.country || []).join(' ').toLowerCase();
      return offshoreJurisdictions.some(oj => j.includes(oj) || c.includes(oj));
    });
    if (offshoreEntities.length > 0) {
      score += 15;
      flags.push({
        severity: 'MEDIUM', type: 'OFFSHORE_ENTITIES',
        message: `${offshoreEntities.length} offshore entity connection(s)`,
        jurisdictions: [...new Set(offshoreEntities.map(e => e.properties.jurisdiction || e.properties.country?.[0]))]
      });
    }

    return {
      score: Math.min(score, 100),
      flags: flags.sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[a.severity] - ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[b.severity])
    };
  }

  // ============================================
  // UTILITIES
  // ============================================

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    return (longer.length - this.levenshteinDistance(longer, shorter)) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
        else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[str2.length][str1.length];
  }
}

module.exports = { OCCRPAlephService };
