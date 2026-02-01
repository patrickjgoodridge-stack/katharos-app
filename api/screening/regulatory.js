// Vercel Serverless Function — Regulatory enforcement screening
// POST /api/screening/regulatory

class RegulatoryEnforcementService {
  constructor() { this.cache = new Map(); }

  async screenEntity(query) {
    const { name, type } = query;
    const results = await Promise.all([
      this.searchDOJ(name).catch(e => ({ source: 'doj', data: null, error: e.message })),
      this.searchCFPB(name).catch(e => ({ source: 'cfpb', data: null, error: e.message })),
      this.searchFTC(name).catch(e => ({ source: 'ftc', data: null, error: e.message })),
      this._gdeltDomain(name, 'cftc.gov', 'cftc').catch(e => ({ source: 'cftc', data: null, error: e.message })),
      this._gdeltDomain(name, 'federalreserve.gov', 'federal_reserve').catch(e => ({ source: 'federal_reserve', data: null, error: e.message })),
      this._gdeltDomain(name, 'fdic.gov', 'fdic').catch(e => ({ source: 'fdic', data: null, error: e.message })),
      this._gdeltDomain(name, 'occ.gov', 'occ').catch(e => ({ source: 'occ', data: null, error: e.message })),
      this.searchFCA(name).catch(e => ({ source: 'fca', data: null, error: e.message })),
      this._gdeltDomain(name, 'ec.europa.eu', 'eu_competition').catch(e => ({ source: 'eu_competition', data: null, error: e.message })),
    ]);
    const sources = {}; let allActions = [];
    for (const r of results) { sources[r.source] = { data: r.data, error: r.error || null, matchCount: r.data?.actions?.length || 0 }; if (r.data?.actions) allActions.push(...r.data.actions); }
    let score = 0; const flags = [];
    const criminal = allActions.filter(a => ['INDICTMENT','CRIMINAL_CONVICTION','CRIMINAL_CHARGE'].includes(a.type));
    if (criminal.length > 0) { score += 50; flags.push({ severity: 'CRITICAL', type: 'CRIMINAL_ACTION', message: `${criminal.length} criminal action(s)` }); }
    const warnings = allActions.filter(a => ['SANCTIONS','FCA_WARNING'].includes(a.type));
    if (warnings.length > 0) { score += 30; flags.push({ severity: 'HIGH', type: 'REGULATORY_WARNING', message: `${warnings.length} warning(s)/sanctions` }); }
    const agencies = new Set(allActions.map(a => a.agency));
    if (agencies.size >= 3) { score += 15; flags.push({ severity: 'HIGH', type: 'MULTI_AGENCY', message: `Actions from ${agencies.size} agencies` }); }
    return { query: { name, type: type || 'ALL' }, totalActions: allActions.length, actions: allActions.slice(0, 50), riskAssessment: { score: Math.min(score, 100), level: score >= 70 ? 'CRITICAL' : score >= 40 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW', flags }, sources, screenedAt: new Date().toISOString() };
  }

  async searchDOJ(name) {
    try {
      const res = await fetch(`https://www.justice.gov/api/v1/press-releases.json?keyword=${encodeURIComponent(`"${name}"`)}&sort=date&direction=DESC&pagesize=10`, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Marlowe/1.0' } });
      if (!res.ok) return this._gdeltDomain(name, 'justice.gov', 'doj');
      const data = await res.json();
      const actions = (data.results || []).map(r => ({ agency: 'DOJ', title: r.title || '', date: r.date || '', type: this._classifyDOJ(r.title || ''), url: r.url ? `https://www.justice.gov${r.url}` : '', source: 'doj' }));
      return { source: 'doj', data: { actions, total: actions.length } };
    } catch { return this._gdeltDomain(name, 'justice.gov', 'doj'); }
  }

  _classifyDOJ(t) { t = t.toLowerCase(); if (t.includes('indict')) return 'INDICTMENT'; if (t.includes('guilty') || t.includes('sentenced')) return 'CRIMINAL_CONVICTION'; if (t.includes('charged')) return 'CRIMINAL_CHARGE'; if (t.includes('settlement')) return 'SETTLEMENT'; return 'ENFORCEMENT_ACTION'; }

  async searchCFPB(name) {
    try {
      const res = await fetch(`https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/?search_term=${encodeURIComponent(name)}&size=10&sort=created_date_desc`, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return this._gdeltDomain(name, 'consumerfinance.gov', 'cfpb');
      const data = await res.json();
      const actions = (data.hits?.hits || []).map(h => { const s = h._source || {}; return { agency: 'CFPB', title: `Complaint: ${s.product || 'Unknown'}`, date: s.date_received || '', type: 'COMPLAINT', source: 'cfpb' }; });
      return { source: 'cfpb', data: { actions, total: data.hits?.total?.value || actions.length } };
    } catch { return this._gdeltDomain(name, 'consumerfinance.gov', 'cfpb'); }
  }

  async searchFTC(name) {
    try {
      const res = await fetch(`https://www.ftc.gov/api/v1/enforcement.json?keyword=${encodeURIComponent(`"${name}"`)}&sort=date&direction=DESC&pagesize=10`, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Marlowe/1.0' } });
      if (!res.ok) return this._gdeltDomain(name, 'ftc.gov', 'ftc');
      const data = await res.json();
      const actions = (data.results || []).map(r => ({ agency: 'FTC', title: r.title || '', date: r.date || '', type: 'FTC_ACTION', url: r.url ? `https://www.ftc.gov${r.url}` : '', source: 'ftc' }));
      return { source: 'ftc', data: { actions, total: actions.length } };
    } catch { return this._gdeltDomain(name, 'ftc.gov', 'ftc'); }
  }

  async searchFCA(name) {
    try {
      const res = await fetch(`https://register.fca.org.uk/services/V0.1/Warnings?q=${encodeURIComponent(name)}`, { signal: AbortSignal.timeout(15000), headers: { 'Accept': 'application/json' } });
      if (!res.ok) return this._gdeltDomain(name, 'fca.org.uk', 'fca');
      const data = await res.json();
      const actions = (data.Data || []).map(w => ({ agency: 'FCA', title: `Warning: ${w.Name || name}`, date: w.Date || '', type: 'FCA_WARNING', source: 'fca' }));
      return { source: 'fca', data: { actions, total: actions.length } };
    } catch { return this._gdeltDomain(name, 'fca.org.uk', 'fca'); }
  }

  async _gdeltDomain(name, domain, source) {
    try {
      const res = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`"${name}" domain:${domain}`)}&mode=ArtList&maxrecords=10&format=json&timespan=5y`, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) return { source, data: { actions: [], total: 0 } };
      const data = await res.json();
      const actions = (data.articles || []).map(a => ({ agency: source.toUpperCase(), title: a.title || '', date: a.seendate ? a.seendate.substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '', type: 'PRESS_RELEASE', url: a.url || '', source }));
      return { source, data: { actions, total: actions.length } };
    } catch { return { source, data: { actions: [], total: 0 } }; }
  }
}

const service = new RegulatoryEnforcementService();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name, type } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await service.screenEntity({ name, type: type || 'ALL' });
    res.json(result);
  } catch (error) {
    console.error('Regulatory screening error:', error);
    res.status(500).json({ error: error.message });
  }
}
