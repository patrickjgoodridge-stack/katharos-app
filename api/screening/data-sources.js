// Vercel Serverless Function — Multi-source data screening
// POST /api/screening/data-sources

class DataSourceManager {
  constructor() {
    this.ukCompaniesHouseKey = process.env.COMPANIES_HOUSE_API_KEY || null;
    this.courtListenerKey = process.env.COURTLISTENER_KEY || null;
  }

  async screenEntity(name, type = 'INDIVIDUAL', options = {}) {
    const promises = [
      this.searchOffshoreLeaks(name).catch(e => ({ source: 'icij', data: null, error: e.message })),
      this.searchSEC(name).catch(e => ({ source: 'sec', data: null, error: e.message })),
      this.searchWorldBankDebarred(name).catch(e => ({ source: 'worldBank', data: null, error: e.message })),
    ];
    if (this.courtListenerKey) {
      promises.push(this.searchCourtListener(name).catch(e => ({ source: 'courtListener', data: null, error: e.message })));
    }
    if (this.ukCompaniesHouseKey && type === 'ENTITY') {
      promises.push(this.searchUKCompanies(name).catch(e => ({ source: 'ukCompaniesHouse', data: null, error: e.message })));
    }

    const results = await Promise.all(promises);
    const output = { subject: name, type, screeningDate: new Date().toISOString(), sources: {}, riskScore: 0, riskFactors: [] };

    for (const result of results) {
      output.sources[result.source] = {
        data: result.data,
        error: result.error || null,
        matchCount: result.data?.matches?.length || result.data?.results?.length || 0,
      };
    }

    const risk = this.calculateRiskScore(output.sources);
    output.riskScore = risk.score;
    output.riskFactors = risk.factors;
    return output;
  }

  async searchOffshoreLeaks(query) {
    const response = await fetch(`https://offshoreleaks.icij.org/api/v1/search?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`ICIJ API error: ${response.status}`);
    const data = await response.json();
    const matches = [];
    for (const category of ['entities', 'officers', 'intermediaries', 'addresses']) {
      if (data[category]) {
        for (const item of data[category]) {
          matches.push({ type: category.replace(/s$/, ''), name: item.name || item.entity || '', jurisdiction: item.jurisdiction || item.country || '', sourceDataset: item.source || item.dataset || '', linkedTo: item.linked_to || item.intermediary || '', nodeId: item.node_id || item.id || '' });
        }
      }
    }
    const seen = new Set();
    const deduped = matches.filter(m => { const k = `${m.name}|${m.type}`; if (seen.has(k)) return false; seen.add(k); return true; });
    return { source: 'icij', data: { matches: deduped.slice(0, 20), totalResults: matches.length, datasetsFound: [...new Set(matches.map(m => m.sourceDataset).filter(Boolean))] } };
  }

  async searchSEC(query) {
    const url = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(`"${query}"`)}&dateRange=custom&startdt=2019-01-01&enddt=2026-01-31&forms=10-K,10-Q,8-K,DEF+14A,13F-HR,SC+13D,SC+13G,4`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Katharos Compliance App support@marlowe.app' }, signal: AbortSignal.timeout(15000) });
    let filings = [], enforcement = [];
    if (response.ok) {
      const data = await response.json();
      if (data.hits?.hits) {
        for (const hit of data.hits.hits.slice(0, 15)) {
          const s = hit._source || {};
          filings.push({ form: s.form_type || '', filingDate: s.file_date || '', companyName: s.display_names?.[0] || '', cik: s.entity_id || '' });
        }
      }
    }
    try {
      const enfUrl = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(`"${query}"`)}&dateRange=custom&startdt=2019-01-01&enddt=2026-01-31&forms=LR,AAER,AP`;
      const enfRes = await fetch(enfUrl, { headers: { 'User-Agent': 'Katharos Compliance App support@marlowe.app' }, signal: AbortSignal.timeout(10000) });
      if (enfRes.ok) { const d = await enfRes.json(); if (d.hits?.hits) { for (const h of d.hits.hits.slice(0, 10)) { const s = h._source || {}; enforcement.push({ type: s.form_type || 'Enforcement', date: s.file_date || '', description: s.display_names?.[0] || '' }); } } }
    } catch { /* non-critical */ }
    return { source: 'sec', data: { results: filings, enforcement, totalFilings: filings.length, hasEnforcement: enforcement.length > 0 } };
  }

  async searchWorldBankDebarred(query) {
    const response = await fetch('https://apigwext.worldbank.org/dvsvc/v1.0/json/APPLICATION/ADOBE_EXPRNC/FIRM_LIST', { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`World Bank API error: ${response.status}`);
    const data = await response.json();
    const q = query.toLowerCase();
    const matches = [];
    if (Array.isArray(data)) {
      for (const f of data) {
        const fn = (f.FIRM_NAME || '').toLowerCase(), in_ = (f.INDIVIDUAL_NAME || '').toLowerCase();
        if (fn.includes(q) || in_.includes(q) || q.includes(fn) || q.includes(in_)) {
          matches.push({ firmName: f.FIRM_NAME || null, individualName: f.INDIVIDUAL_NAME || null, country: f.COUNTRY || '', sanctionType: f.SANCTION_TYPE || '', fromDate: f.FROM_DATE || '', toDate: f.TO_DATE || '', grounds: f.GROUNDS || '' });
        }
      }
    }
    return { source: 'worldBank', data: { matches: matches.slice(0, 20), totalResults: matches.length } };
  }

  async searchCourtListener(query) {
    const response = await fetch(`https://www.courtlistener.com/api/rest/v3/search/?q=${encodeURIComponent(`"${query}"`)}&type=r&order_by=score+desc`, {
      headers: { 'Authorization': `Token ${this.courtListenerKey}` }, signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error(`CourtListener API error: ${response.status}`);
    const data = await response.json();
    const results = (data.results || []).slice(0, 15).map(r => ({
      caseName: r.caseName || r.case_name || '', court: r.court || r.court_id || '',
      dateFiled: r.dateFiled || r.date_filed || '', docketNumber: r.docketNumber || r.docket_number || '',
      suitNature: r.suitNature || r.nature_of_suit || '', status: r.status || ''
    }));
    return { source: 'courtListener', data: { results, totalResults: data.count || results.length } };
  }

  async searchUKCompanies(query) {
    const auth = 'Basic ' + btoa(this.ukCompaniesHouseKey + ':');
    const res = await fetch(`https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(query)}&items_per_page=5`, {
      headers: { 'Authorization': auth }, signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) throw new Error(`UK Companies House API error: ${res.status}`);
    const data = await res.json();
    const companies = [];
    for (const item of (data.items || []).slice(0, 5)) {
      const co = { companyName: item.title || '', companyNumber: item.company_number || '', status: item.company_status || '', incorporationDate: item.date_of_creation || '', address: item.address_snippet || '', officers: [], pscs: [] };
      try {
        const [offRes, pscRes] = await Promise.all([
          fetch(`https://api.company-information.service.gov.uk/company/${item.company_number}/officers`, { headers: { 'Authorization': auth }, signal: AbortSignal.timeout(10000) }),
          fetch(`https://api.company-information.service.gov.uk/company/${item.company_number}/persons-with-significant-control`, { headers: { 'Authorization': auth }, signal: AbortSignal.timeout(10000) })
        ]);
        if (offRes.ok) { const d = await offRes.json(); co.officers = (d.items || []).slice(0, 10).map(o => ({ name: o.name || '', role: o.officer_role || '', appointedOn: o.appointed_on || '', resignedOn: o.resigned_on || null })); }
        if (pscRes.ok) { const d = await pscRes.json(); co.pscs = (d.items || []).slice(0, 10).map(p => ({ name: p.name || '', kind: p.kind || '', naturesOfControl: p.natures_of_control || [], notifiedOn: p.notified_on || '' })); }
      } catch { /* non-critical */ }
      companies.push(co);
    }
    return { source: 'ukCompaniesHouse', data: { results: companies, totalResults: data.total_results || companies.length } };
  }

  calculateRiskScore(sources) {
    let score = 0;
    const factors = [];
    const icij = sources.icij?.data;
    if (icij?.matches?.length > 0) {
      score += 20; factors.push({ source: 'ICIJ Offshore Leaks', detail: `${icij.matches.length} match(es)`, points: 20 });
      const ds = icij.datasetsFound || [];
      if (ds.length > 1) { const b = (ds.length - 1) * 5; score += b; factors.push({ source: 'ICIJ', detail: `${ds.length} datasets: ${ds.join(', ')}`, points: b }); }
    }
    const sec = sources.sec?.data;
    if (sec?.hasEnforcement) { score += 20; factors.push({ source: 'SEC', detail: `${sec.enforcement.length} enforcement action(s)`, points: 20 }); }
    const wb = sources.worldBank?.data;
    if (wb?.matches?.length > 0) {
      const active = wb.matches.filter(m => !m.toDate || new Date(m.toDate) > new Date());
      if (active.length > 0) { score += 20; factors.push({ source: 'World Bank', detail: `${active.length} active debarment(s)`, points: 20 }); }
      else { score += 10; factors.push({ source: 'World Bank', detail: `${wb.matches.length} expired debarment(s)`, points: 10 }); }
    }
    const cl = sources.courtListener?.data;
    if (cl?.results?.length > 0) {
      const crim = cl.results.filter(r => (r.suitNature || '').toLowerCase().includes('criminal') || (r.caseName || '').toLowerCase().includes('united states v'));
      if (crim.length > 0) { score += 25; factors.push({ source: 'Federal Courts', detail: `${crim.length} criminal case(s)`, points: 25 }); }
      const civil = cl.results.length - crim.length;
      if (civil > 0) { const p = Math.min(civil * 5, 15); score += p; factors.push({ source: 'Federal Courts', detail: `${civil} civil case(s)`, points: p }); }
    }
    const uk = sources.ukCompaniesHouse?.data;
    if (uk?.results?.length > 0) {
      for (const co of uk.results) {
        if (co.status === 'dissolved') { score += 5; factors.push({ source: 'UK Companies House', detail: `${co.companyName} dissolved`, points: 5 }); }
        if (co.incorporationDate) { const d = new Date(co.incorporationDate); const y = new Date(); y.setFullYear(y.getFullYear() - 1); if (d > y) { score += 5; factors.push({ source: 'UK Companies House', detail: `${co.companyName} incorporated < 1 year`, points: 5 }); } }
        if ((co.pscs || []).some(p => (p.kind || '').includes('corporate'))) { score += 10; factors.push({ source: 'UK Companies House', detail: `${co.companyName} has corporate PSC`, points: 10 }); }
      }
    }
    return { score: Math.min(score, 100), factors };
  }
}

const service = new DataSourceManager();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name, type, options } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await service.screenEntity(name, type || 'INDIVIDUAL', options || {});
    res.json(result);
  } catch (error) {
    console.error('Data source screening error:', error);
    res.status(500).json({ error: error.message });
  }
}
