// Vercel Serverless Function — OpenCorporates screening
// POST /api/screening/opencorporates

class OpenCorporatesService {
  constructor() { this.apiKey = process.env.OPENCORPORATES_API_KEY || null; this.baseUrl = 'https://api.opencorporates.com/v0.4'; }

  async screenEntity(query) {
    const { name, jurisdiction } = query;
    const [compRes, offRes] = await Promise.all([
      this.searchCompanies(name, { jurisdiction }).catch(e => ({ source: 'opencorporates_companies', data: null, error: e.message })),
      this.searchOfficers(name, { jurisdiction }).catch(e => ({ source: 'opencorporates_officers', data: null, error: e.message })),
    ]);
    const sources = {}; for (const r of [compRes, offRes]) sources[r.source] = { data: r.data, error: r.error || null, matchCount: r.data?.results?.length || 0 };
    const companies = compRes?.data?.results || []; const officers = offRes?.data?.results || [];
    let score = 0; const flags = [];
    const offshore = ['vg','ky','bm','pa','sc','bs','je','gg','im','li','mc','gi','ai','tc','ws','vu','mh'];
    const offCo = companies.filter(c => offshore.includes((c.jurisdictionCode || '').toLowerCase()));
    if (offCo.length > 0) { score += 20; flags.push({ severity: 'HIGH', type: 'OFFSHORE_JURISDICTION', message: `${offCo.length} offshore company/ies` }); }
    const dissolved = companies.filter(c => (c.status || '').toLowerCase().includes('dissolv'));
    if (dissolved.length > 0) { score += 10; flags.push({ severity: 'MEDIUM', type: 'DISSOLVED', message: `${dissolved.length} dissolved company/ies` }); }
    if (officers.length > 10) { score += 15; flags.push({ severity: 'MEDIUM', type: 'MANY_DIRECTORSHIPS', message: `${officers.length} officer positions` }); }
    return { query: { name, jurisdiction }, companies: companies.slice(0, 20), officers: officers.slice(0, 20), totalCompanies: compRes?.data?.total || 0, totalOfficers: offRes?.data?.total || 0, riskAssessment: { score: Math.min(score, 100), level: score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW', flags }, sources, screenedAt: new Date().toISOString() };
  }

  async searchCompanies(name, options = {}) {
    const params = new URLSearchParams({ q: name, order: 'score' });
    if (options.jurisdiction) params.append('jurisdiction_code', options.jurisdiction);
    if (this.apiKey) params.append('api_token', this.apiKey);
    const res = await fetch(`${this.baseUrl}/companies/search?${params}`, { signal: AbortSignal.timeout(15000), headers: { 'Accept': 'application/json' } });
    if (!res.ok) return { source: 'opencorporates_companies', data: { results: [], total: 0 } };
    const data = await res.json();
    const results = (data.results?.companies || []).map(c => { const co = c.company || c; return { name: co.name || '', companyNumber: co.company_number || '', jurisdictionCode: co.jurisdiction_code || '', incorporationDate: co.incorporation_date || '', dissolutionDate: co.dissolution_date || null, companyType: co.company_type || '', status: co.current_status || '', registeredAddress: co.registered_address_in_full || '', previousNames: (co.previous_names || []).map(p => p.company_name || ''), url: co.opencorporates_url || '', source: 'opencorporates' }; });
    return { source: 'opencorporates_companies', data: { results, total: data.results?.total_count || results.length } };
  }

  async searchOfficers(name, options = {}) {
    const params = new URLSearchParams({ q: name, order: 'score' });
    if (options.jurisdiction) params.append('jurisdiction_code', options.jurisdiction);
    if (this.apiKey) params.append('api_token', this.apiKey);
    const res = await fetch(`${this.baseUrl}/officers/search?${params}`, { signal: AbortSignal.timeout(15000), headers: { 'Accept': 'application/json' } });
    if (!res.ok) return { source: 'opencorporates_officers', data: { results: [], total: 0 } };
    const data = await res.json();
    const results = (data.results?.officers || []).map(o => { const off = o.officer || o; return { name: off.name || '', position: off.position || '', startDate: off.start_date || '', endDate: off.end_date || null, companyName: off.company?.name || '', companyNumber: off.company?.company_number || '', jurisdictionCode: off.company?.jurisdiction_code || '', url: off.opencorporates_url || '', source: 'opencorporates' }; });
    return { source: 'opencorporates_officers', data: { results, total: data.results?.total_count || results.length } };
  }
}

const service = new OpenCorporatesService();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name, jurisdiction } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await service.screenEntity({ name, jurisdiction });
    res.json(result);
  } catch (error) {
    console.error('OpenCorporates screening error:', error);
    res.status(500).json({ error: error.message });
  }
}
