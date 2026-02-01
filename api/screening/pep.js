// Vercel Serverless Function — PEP screening
// POST /api/screening/pep

class PEPScreeningService {
  constructor() {
    this.openSanctionsKey = process.env.OPENSANCTIONS_API_KEY || null;
    this.cache = new Map();
    this.cacheTimeout = 60 * 60 * 1000;
  }

  async screenEntity(query) {
    const { name, type, country, dateOfBirth } = query;
    const results = await Promise.all([
      this.searchOpenSanctions(name, { type, country, dateOfBirth }).catch(e => ({ source: 'opensanctions', data: null, error: e.message })),
      this.searchWikidata(name, { type, country }).catch(e => ({ source: 'wikidata', data: null, error: e.message })),
    ]);
    const sources = {};
    for (const r of results) sources[r.source] = { data: r.data, error: r.error || null, matchCount: r.data?.matches?.length || r.data?.results?.length || 0 };
    const allMatches = [];
    for (const r of results) { if (r.data) allMatches.push(...(r.data.matches || r.data.results || [])); }
    const pepMatches = allMatches.filter(m => m.isPEP);
    const hasActive = pepMatches.some(m => m.pepLevel === 'ACTIVE' || m.pepLevel === 'HEAD_OF_STATE' || (m.positions || []).some(p => p.isCurrent));
    let score = 0; const flags = [];
    if (pepMatches.length > 0) {
      if (hasActive) { score += 40; flags.push({ severity: 'HIGH', type: 'ACTIVE_PEP', message: `Active PEP (${pepMatches.length} source(s))` }); }
      else { score += 25; flags.push({ severity: 'MEDIUM', type: 'FORMER_PEP', message: `Former PEP (${pepMatches.length} source(s))` }); }
    }
    const sanctioned = allMatches.filter(m => m.sanctions?.length > 0);
    if (sanctioned.length > 0) { score += 50; flags.push({ severity: 'CRITICAL', type: 'SANCTIONS_LIST', message: `On sanctions list(s)` }); }
    return { query: { name, type: type || 'individual', country }, isPEP: pepMatches.length > 0, pepLevel: pepMatches.length === 0 ? 'NOT_PEP' : hasActive ? 'PEP_ACTIVE' : 'PEP_FORMER', matchCount: allMatches.length, matches: allMatches.slice(0, 30), riskAssessment: { score: Math.min(score, 100), level: score >= 70 ? 'CRITICAL' : score >= 40 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW', flags }, sources, screenedAt: new Date().toISOString() };
  }

  async searchOpenSanctions(name, options = {}) {
    const params = new URLSearchParams({ q: name, limit: '50' });
    if (options.country) params.append('countries', options.country);
    const headers = { 'Accept': 'application/json' };
    if (this.openSanctionsKey) headers['Authorization'] = `ApiKey ${this.openSanctionsKey}`;
    const allResults = [];
    for (const dataset of ['default', 'peps']) {
      try {
        const res = await fetch(`https://api.opensanctions.org/search/${dataset}?${params}`, { headers, signal: AbortSignal.timeout(15000) });
        if (res.ok) { const data = await res.json(); if (data.results) allResults.push(...data.results); }
      } catch {}
    }
    const seen = new Set(); const matches = [];
    for (const r of allResults) {
      if (seen.has(r.id)) continue; seen.add(r.id);
      const props = r.properties || {};
      const isPEP = (r.datasets || []).some(d => d.includes('pep')) || (props.topics || []).some(t => t.includes('role') || t.includes('pep'));
      matches.push({ id: r.id, name: props.name?.[0] || r.caption || 'Unknown', aliases: props.alias || [], type: r.schema === 'Person' ? 'individual' : 'entity', isPEP, pepPosition: props.position?.[0] || null, country: props.country || [], nationality: props.nationality || [], dateOfBirth: props.birthDate?.[0] || null, datasets: r.datasets || [], topics: props.topics || [], sanctions: (r.datasets || []).filter(d => d.includes('sanction') || d.includes('ofac')), matchScore: r.score || 0, url: `https://opensanctions.org/entities/${r.id}/`, source: 'opensanctions' });
    }
    return { source: 'opensanctions', data: { matches: matches.sort((a, b) => b.matchScore - a.matchScore), total: matches.length } };
  }

  async searchWikidata(name, options = {}) {
    const sparql = `SELECT ?person ?personLabel ?positionLabel ?countryLabel ?startDate ?endDate WHERE { ?person wdt:P31 wd:Q5 . ?person rdfs:label ?nameLabel . FILTER(CONTAINS(LCASE(?nameLabel), "${name.toLowerCase().replace(/"/g, '\\"')}")) FILTER(LANG(?nameLabel) = "en") { ?person wdt:P39 ?position . OPTIONAL { ?person p:P39 ?stmt . ?stmt ps:P39 ?position . OPTIONAL { ?stmt pq:P580 ?startDate } OPTIONAL { ?stmt pq:P582 ?endDate } } } UNION { ?person wdt:P106 ?occ . FILTER(?occ IN (wd:Q82955, wd:Q372436, wd:Q193391)) } OPTIONAL { ?person wdt:P27 ?country } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } LIMIT 20`;
    try {
      const res = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`, { headers: { 'User-Agent': 'Marlowe/1.0', 'Accept': 'application/json' }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) return { source: 'wikidata', data: { results: [], total: 0 } };
      const data = await res.json();
      const map = new Map();
      for (const b of (data.results?.bindings || [])) {
        const id = b.person?.value || '';
        if (!map.has(id)) map.set(id, { id, name: b.personLabel?.value || '', positions: [], country: b.countryLabel?.value || null, isPEP: true, source: 'wikidata' });
        const e = map.get(id); const pos = b.positionLabel?.value;
        if (pos && !e.positions.some(p => p.title === pos)) e.positions.push({ title: pos, startDate: b.startDate?.value?.substring(0, 10) || null, endDate: b.endDate?.value?.substring(0, 10) || null, isCurrent: !b.endDate?.value });
      }
      const results = [...map.values()].map(r => ({ ...r, pepLevel: r.positions.some(p => p.isCurrent) ? 'ACTIVE' : 'FORMER', url: r.id }));
      return { source: 'wikidata', data: { results, total: results.length } };
    } catch { return { source: 'wikidata', data: { results: [], total: 0 } }; }
  }
}

const service = new PEPScreeningService();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name, type, country, dateOfBirth } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await service.screenEntity({ name, type: type || 'individual', country, dateOfBirth });
    res.json(result);
  } catch (error) {
    console.error('PEP screening error:', error);
    res.status(500).json({ error: error.message });
  }
}
