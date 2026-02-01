// Vercel Serverless Function — OCCRP Aleph screening
// POST /api/screening/occrp-aleph

class OCCRPAlephService {
  constructor() {
    this.baseUrl = 'https://aleph.occrp.org/api/2';
    this.apiKey = process.env.OCCRP_ALEPH_API_KEY;
    this.cache = new Map();
    this.cacheTimeout = 60 * 60 * 1000;
  }

  headers() {
    const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (this.apiKey) h['Authorization'] = `ApiKey ${this.apiKey}`;
    return h;
  }

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
      summary: { totalResults: (entityResults.total || 0) + (documentResults.total || 0), entityMatches: processedEntities.length, documentMatches: processedDocuments.length, datasetMatches, riskScore: riskAssessment.score },
      entities: processedEntities.slice(0, 50),
      documents: processedDocuments.slice(0, 50),
      riskFlags: riskAssessment.flags,
      sourcesSearched: ['occrp_aleph'],
      searchedAt: new Date().toISOString()
    };
  }

  async searchEntities(query, options = {}) {
    const params = new URLSearchParams({ q: query, limit: String(options.limit || 100), offset: String(options.offset || 0) });
    try {
      const response = await fetch(`${this.baseUrl}/entities?${params}`, { headers: this.headers(), signal: AbortSignal.timeout(20000) });
      if (!response.ok) return { results: [], total: 0 };
      return response.json();
    } catch (e) { return { results: [], total: 0 }; }
  }

  async searchDocuments(query, options = {}) {
    const params = new URLSearchParams({ q: query, limit: String(options.limit || 100), offset: String(options.offset || 0) });
    try {
      const response = await fetch(`${this.baseUrl}/documents?${params}`, { headers: this.headers(), signal: AbortSignal.timeout(20000) });
      if (!response.ok) return { results: [], total: 0 };
      return response.json();
    } catch (e) { return { results: [], total: 0 }; }
  }

  async crossReference(entity) {
    const payload = { schema: entity.type === 'company' ? 'Company' : 'Person', properties: { name: [entity.name] } };
    if (entity.dateOfBirth) payload.properties.birthDate = [entity.dateOfBirth];
    if (entity.nationality) payload.properties.nationality = [entity.nationality];
    if (entity.country) payload.properties.country = [entity.country];
    if (entity.registrationNumber) payload.properties.registrationNumber = [entity.registrationNumber];
    try {
      const response = await fetch(`${this.baseUrl}/match`, { method: 'POST', headers: this.headers(), body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) });
      if (!response.ok) return { results: [], total: 0 };
      return response.json();
    } catch (e) { return { results: [], total: 0 }; }
  }

  processEntityResults(results, searchName) {
    if (!results.results) return [];
    const searchNameLower = searchName.toLowerCase();
    return results.results.map(entity => {
      const properties = entity.properties || {};
      const names = [...(properties.name || []), ...(properties.alias || []), ...(properties.previousName || [])].map(n => n.toLowerCase());
      let matchConfidence = 0;
      for (const name of names) {
        if (name === searchNameLower) { matchConfidence = 1.0; break; }
        else if (name.includes(searchNameLower) || searchNameLower.includes(name)) matchConfidence = Math.max(matchConfidence, 0.8);
        else matchConfidence = Math.max(matchConfidence, this.calculateSimilarity(name, searchNameLower));
      }
      return {
        id: entity.id, schema: entity.schema, name: properties.name?.[0] || 'Unknown', aliases: properties.alias || [],
        type: this.mapSchemaToType(entity.schema),
        properties: { dateOfBirth: properties.birthDate?.[0], nationality: properties.nationality || [], country: properties.country || [], address: properties.address?.[0], registrationNumber: properties.registrationNumber?.[0], incorporationDate: properties.incorporationDate?.[0], jurisdiction: properties.jurisdiction?.[0], status: properties.status?.[0] },
        collection: { id: entity.collection?.id, label: entity.collection?.label, category: entity.collection?.category },
        matchConfidence, url: `https://aleph.occrp.org/entities/${entity.id}`, updatedAt: entity.updated_at
      };
    }).filter(e => e.matchConfidence >= 0.6).sort((a, b) => b.matchConfidence - a.matchConfidence);
  }

  processDocumentResults(results, searchName) {
    if (!results.results) return [];
    return results.results.map(doc => {
      const p = doc.properties || {};
      return {
        id: doc.id, title: p.title?.[0] || p.fileName?.[0] || 'Untitled', fileName: p.fileName?.[0], fileType: p.mimeType?.[0],
        date: p.date?.[0] || p.createdAt?.[0], author: p.author?.[0], summary: p.summary?.[0],
        collection: { id: doc.collection?.id, label: doc.collection?.label, category: doc.collection?.category },
        snippet: doc.highlight?.text?.[0] || null, url: `https://aleph.occrp.org/documents/${doc.id}`, updatedAt: doc.updated_at
      };
    });
  }

  mapSchemaToType(schema) {
    const m = { 'Person': 'individual', 'LegalEntity': 'company', 'Company': 'company', 'Organization': 'organization', 'PublicBody': 'government', 'Asset': 'asset', 'RealEstate': 'property', 'Vehicle': 'vehicle', 'Vessel': 'vessel', 'Aircraft': 'aircraft', 'BankAccount': 'bank_account', 'CryptoWallet': 'crypto_wallet', 'Directorship': 'relationship', 'Ownership': 'relationship', 'Family': 'relationship', 'Associate': 'relationship' };
    return m[schema] || 'unknown';
  }

  identifyDatasets(entities, documents) {
    const datasets = new Set();
    const hpd = { 'panama_papers': ['panama', 'mossack fonseca'], 'paradise_papers': ['paradise', 'appleby'], 'pandora_papers': ['pandora'], 'offshore_leaks': ['offshore leaks', 'icij'], 'bahamas_leaks': ['bahamas'], 'swiss_leaks': ['hsbc', 'swiss'], 'lux_leaks': ['luxembourg', 'pwc'], 'fincen_files': ['fincen', 'suspicious activity'], 'ofac': ['ofac', 'sdn'], 'eu_sanctions': ['eu sanctions', 'european union'], 'un_sanctions': ['un sanctions', 'security council'], 'world_bank_debarment': ['world bank', 'debarment'] };
    const labels = [...entities.map(e => (e.collection?.label || '').toLowerCase()), ...documents.map(d => (d.collection?.label || '').toLowerCase())];
    for (const label of labels) { for (const [ds, kws] of Object.entries(hpd)) { if (kws.some(kw => label.includes(kw))) datasets.add(ds); } }
    return [...datasets];
  }

  calculateRiskScore(entities, documents, datasets) {
    let score = 0; const flags = [];
    const hcm = entities.filter(e => e.matchConfidence >= 0.9);
    if (hcm.length > 0) { score += 20; flags.push({ severity: 'HIGH', type: 'ENTITY_MATCH', message: `${hcm.length} high-confidence match(es) in OCCRP Aleph` }); }
    const leaks = ['panama_papers', 'paradise_papers', 'pandora_papers', 'offshore_leaks', 'bahamas_leaks', 'swiss_leaks', 'fincen_files'];
    const lm = datasets.filter(d => leaks.includes(d));
    if (lm.length > 0) { score += 30 + (lm.length - 1) * 10; flags.push({ severity: 'CRITICAL', type: 'LEAK_DATABASE_MATCH', message: `Found in leaked database(s): ${lm.join(', ')}` }); }
    const sm = datasets.filter(d => ['ofac', 'eu_sanctions', 'un_sanctions'].includes(d));
    if (sm.length > 0) { score += 50; flags.push({ severity: 'CRITICAL', type: 'SANCTIONS_DATABASE', message: `Appears in sanctions database(s): ${sm.join(', ')}` }); }
    if (datasets.includes('world_bank_debarment')) { score += 25; flags.push({ severity: 'HIGH', type: 'WORLD_BANK_DEBARMENT', message: 'Listed in World Bank debarment database' }); }
    if (documents.length > 50) { score += 15; flags.push({ severity: 'MEDIUM', type: 'HIGH_DOCUMENT_VOLUME', message: `${documents.length} documents mentioning this entity` }); }
    else if (documents.length > 10) { score += 10; flags.push({ severity: 'LOW', type: 'DOCUMENT_MENTIONS', message: `${documents.length} documents mentioning this entity` }); }
    const oj = ['bvi', 'british virgin islands', 'cayman', 'panama', 'seychelles', 'bahamas', 'jersey', 'guernsey', 'isle of man', 'liechtenstein'];
    const oe = entities.filter(e => { const j = (e.properties.jurisdiction || '').toLowerCase(); const c = (e.properties.country || []).join(' ').toLowerCase(); return oj.some(o => j.includes(o) || c.includes(o)); });
    if (oe.length > 0) { score += 15; flags.push({ severity: 'MEDIUM', type: 'OFFSHORE_ENTITIES', message: `${oe.length} offshore entity connection(s)` }); }
    return { score: Math.min(score, 100), flags: flags.sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[a.severity] - ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[b.severity]) };
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    return (longer.length - this.levenshteinDistance(longer, shorter)) / longer.length;
  }

  levenshteinDistance(s1, s2) {
    const m = []; for (let i = 0; i <= s2.length; i++) m[i] = [i]; for (let j = 0; j <= s1.length; j++) m[0][j] = j;
    for (let i = 1; i <= s2.length; i++) for (let j = 1; j <= s1.length; j++) { if (s2[i-1] === s1[j-1]) m[i][j] = m[i-1][j-1]; else m[i][j] = Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1); }
    return m[s2.length][s1.length];
  }
}

const service = new OCCRPAlephService();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name, type, action, dateOfBirth, nationality, country, registrationNumber } = req.body;
    if (action === 'xref') {
      const result = await service.crossReference({ name, type, dateOfBirth, nationality, country, registrationNumber });
      return res.json(result);
    }
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await service.screenEntity({ name, type: type || 'individual' });
    res.json(result);
  } catch (error) {
    console.error('OCCRP Aleph screening error:', error);
    res.status(500).json({ error: error.message });
  }
}
