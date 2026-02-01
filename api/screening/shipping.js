// Vercel Serverless Function — Shipping & trade screening
// POST /api/screening/shipping

class ShippingTradeService {
  constructor() { this.marineTrafficKey = process.env.MARINETRAFFIC_API_KEY || null; this.comtradeKey = process.env.UN_COMTRADE_API_KEY || null; }

  async screenEntity(query) {
    const { name, type, imo, mmsi } = query;
    const promises = [
      this.searchUNComtrade(name).catch(e => ({ source: 'un_comtrade', data: null, error: e.message })),
      this.searchITUMARS(name, { imo, mmsi }).catch(e => ({ source: 'itu_mars', data: null, error: e.message })),
    ];
    if (this.marineTrafficKey) promises.push(this.searchMarineTraffic(name, { imo, mmsi }).catch(e => ({ source: 'marinetraffic', data: null, error: e.message })));
    const results = await Promise.all(promises);
    const sources = {}; for (const r of results) sources[r.source] = { data: r.data, error: r.error || null, matchCount: r.data?.results?.length || 0 };
    const findings = { vessels: [], tradeRecords: [], enforcementActions: [] };
    for (const r of results) { if (!r.data) continue; for (const item of (r.data.results || [])) { if (item.mmsi || item.imo) findings.vessels.push(item); else if (item.tradeValue) findings.tradeRecords.push(item); else findings.enforcementActions.push(item); } }
    let score = 0; const flags = [];
    const sanctionedFlags = ['north korea','dprk','iran','syria','cuba','crimea'];
    const flagged = findings.vessels.filter(v => sanctionedFlags.some(sf => (v.flag || '').toLowerCase().includes(sf)));
    if (flagged.length > 0) { score += 50; flags.push({ severity: 'CRITICAL', type: 'SANCTIONED_FLAG', message: `${flagged.length} vessel(s) flagged to sanctioned state(s)` }); }
    return { query: { name, type, imo, mmsi }, findings, riskAssessment: { score: Math.min(score, 100), level: score >= 70 ? 'CRITICAL' : score >= 40 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW', flags }, sources, screenedAt: new Date().toISOString() };
  }

  async searchUNComtrade(name) {
    try {
      const query = encodeURIComponent(`"${name}" (sanctions OR embargo OR trade) (domain:treasury.gov OR domain:commerce.gov OR domain:bis.doc.gov)`);
      const res = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=10&format=json&timespan=3y`, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) return { source: 'un_comtrade', data: { results: [], total: 0 } };
      const data = await res.json();
      const results = (data.articles || []).map(a => ({ title: a.title || '', url: a.url || '', date: a.seendate ? a.seendate.substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '', source: 'trade_enforcement' }));
      return { source: 'un_comtrade', data: { results, total: results.length } };
    } catch { return { source: 'un_comtrade', data: { results: [], total: 0 } }; }
  }

  async searchITUMARS(name, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.mmsi) params.append('mmsi', options.mmsi); else if (options.imo) params.append('imo', options.imo); else params.append('shipName', name);
      const res = await fetch(`https://webapp.itu.int/MARS/api/ship?${params}`, { signal: AbortSignal.timeout(15000), headers: { 'Accept': 'application/json' } });
      if (!res.ok) return { source: 'itu_mars', data: { results: [], total: 0 } };
      const data = await res.json();
      const results = (Array.isArray(data) ? data : data.ships || []).slice(0, 20).map(s => ({ name: s.shipName || s.name || '', mmsi: s.mmsi || '', imo: s.imo || '', flag: s.flag || '', shipType: s.shipType || '', owner: s.owner || '', source: 'itu_mars' }));
      return { source: 'itu_mars', data: { results, total: results.length } };
    } catch { return { source: 'itu_mars', data: { results: [], total: 0 } }; }
  }

  async searchMarineTraffic(name, options = {}) {
    if (!this.marineTrafficKey) return { source: 'marinetraffic', data: null, error: 'No API key' };
    try {
      let url; if (options.mmsi) url = `https://services.marinetraffic.com/api/exportvessel/v:5/${this.marineTrafficKey}/mmsi:${options.mmsi}/protocol:jsono`; else if (options.imo) url = `https://services.marinetraffic.com/api/exportvessel/v:5/${this.marineTrafficKey}/imo:${options.imo}/protocol:jsono`; else url = `https://services.marinetraffic.com/api/exportvessel/v:5/${this.marineTrafficKey}/shipname:${encodeURIComponent(name)}/protocol:jsono`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return { source: 'marinetraffic', data: null, error: `HTTP ${res.status}` };
      const data = await res.json();
      const results = (Array.isArray(data) ? data : [data]).map(v => ({ name: v.SHIPNAME || '', imo: v.IMO || '', mmsi: v.MMSI || '', flag: v.FLAG || '', destination: v.DESTINATION || '', source: 'marinetraffic' }));
      return { source: 'marinetraffic', data: { results, total: results.length } };
    } catch (e) { return { source: 'marinetraffic', data: null, error: e.message }; }
  }
}

const service = new ShippingTradeService();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name, type, imo, mmsi } = req.body;
    if (!name && !imo && !mmsi) return res.status(400).json({ error: 'Name, IMO, or MMSI required' });
    const result = await service.screenEntity({ name: name || '', type, imo, mmsi });
    res.json(result);
  } catch (error) {
    console.error('Shipping screening error:', error);
    res.status(500).json({ error: error.message });
  }
}
