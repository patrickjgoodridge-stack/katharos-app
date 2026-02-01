// ShippingTradeService — Maritime & trade compliance screening
// Sources: UN Comtrade, MarineTraffic, VesselFinder, Equasis, ITU MARS

class ShippingTradeService {

  constructor() {
    this.marineTrafficKey = process.env.MARINETRAFFIC_API_KEY || null;
    this.comtradeKey = process.env.UN_COMTRADE_API_KEY || null;
  }

  // ============================================
  // MAIN ENTRY
  // ============================================

  async screenEntity(query) {
    const { name, type, imo, mmsi } = query;

    const promises = [
      this.searchUNComtrade(name).catch(e => ({ source: 'un_comtrade', data: null, error: e.message })),
      this.searchITUMARS(name, { imo, mmsi }).catch(e => ({ source: 'itu_mars', data: null, error: e.message })),
      this.searchEquasis(name, { imo }).catch(e => ({ source: 'equasis', data: null, error: e.message })),
    ];

    if (this.marineTrafficKey) {
      promises.push(this.searchMarineTraffic(name, { imo, mmsi }).catch(e => ({ source: 'marinetraffic', data: null, error: e.message })));
    }

    // Also search VesselFinder (limited free data)
    if (imo || mmsi || type === 'vessel') {
      promises.push(this.searchVesselFinder(name, { imo, mmsi }).catch(e => ({ source: 'vesselfinder', data: null, error: e.message })));
    }

    const results = await Promise.all(promises);
    const sources = {};
    for (const r of results) {
      sources[r.source] = { data: r.data, error: r.error || null, matchCount: r.data?.results?.length || r.data?.matches?.length || 0 };
    }

    const allFindings = this.consolidateFindings(results);
    const risk = this.calculateRisk(allFindings, query);

    return {
      query: { name, type: type || 'entity', imo, mmsi },
      findings: allFindings,
      riskAssessment: risk,
      sources,
      screenedAt: new Date().toISOString()
    };
  }

  // ============================================
  // UN COMTRADE — International trade data
  // ============================================

  async searchUNComtrade(name) {
    // UN Comtrade API v1 — search by reporter/partner name
    const query = encodeURIComponent(name);
    try {
      // Search partners list for country/entity matching
      const partnerRes = await fetch(`https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=&partnerCode=&period=2023&cmdCode=TOTAL&flowCode=M,X&customsCode=C00&motCode=0`, {
        signal: AbortSignal.timeout(20000),
        headers: this.comtradeKey ? { 'Ocp-Apim-Subscription-Key': this.comtradeKey } : {}
      });

      if (!partnerRes.ok) {
        // Fallback: search for trade-related enforcement via GDELT
        return this._tradeGDELTSearch(name);
      }

      const data = await partnerRes.json();
      const results = [];
      const nameLower = name.toLowerCase();

      for (const record of (data.data || [])) {
        const reporter = (record.reporterDesc || '').toLowerCase();
        const partner = (record.partnerDesc || '').toLowerCase();
        if (reporter.includes(nameLower) || partner.includes(nameLower) || nameLower.includes(reporter) || nameLower.includes(partner)) {
          results.push({
            reporter: record.reporterDesc,
            partner: record.partnerDesc,
            year: record.period,
            flowDesc: record.flowDesc,
            tradeValue: record.primaryValue,
            commodity: record.cmdDesc || 'Total',
            source: 'un_comtrade'
          });
        }
      }

      return { source: 'un_comtrade', data: { results: results.slice(0, 20), total: results.length } };
    } catch (e) {
      return this._tradeGDELTSearch(name);
    }
  }

  async _tradeGDELTSearch(name) {
    try {
      const query = encodeURIComponent(`"${name}" (sanctions OR embargo OR trade OR export OR import) (domain:treasury.gov OR domain:commerce.gov OR domain:bis.doc.gov OR domain:trade.gov)`);
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=10&format=json&timespan=3y`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return { source: 'un_comtrade', data: { results: [], total: 0 } };
      const data = await response.json();
      const results = (data.articles || []).map(a => ({
        title: a.title || '',
        url: a.url || '',
        date: a.seendate ? a.seendate.substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '',
        source: 'trade_enforcement'
      }));
      return { source: 'un_comtrade', data: { results, total: results.length } };
    } catch {
      return { source: 'un_comtrade', data: { results: [], total: 0 } };
    }
  }

  // ============================================
  // ITU MARS — Maritime vessel database (free)
  // ============================================

  async searchITUMARS(name, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.mmsi) params.append('mmsi', options.mmsi);
      else if (options.imo) params.append('imo', options.imo);
      else params.append('shipName', name);

      const response = await fetch(`https://webapp.itu.int/MARS/api/ship?${params}`, {
        signal: AbortSignal.timeout(15000),
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) return { source: 'itu_mars', data: { results: [], total: 0 } };
      const data = await response.json();

      const results = (Array.isArray(data) ? data : data.ships || data.results || []).slice(0, 20).map(ship => ({
        name: ship.shipName || ship.name || '',
        mmsi: ship.mmsi || '',
        imo: ship.imo || '',
        callSign: ship.callSign || '',
        flag: ship.flag || ship.flagState || '',
        shipType: ship.shipType || ship.type || '',
        grossTonnage: ship.grossTonnage || ship.gt || '',
        owner: ship.owner || ship.shipOwner || '',
        source: 'itu_mars'
      }));

      return { source: 'itu_mars', data: { results, total: results.length } };
    } catch (e) {
      return { source: 'itu_mars', data: { results: [], total: 0 } };
    }
  }

  // ============================================
  // EQUASIS — Ship safety & inspection data
  // ============================================

  async searchEquasis(name, options = {}) {
    try {
      // Equasis doesn't have a public API but we can search via their web interface
      const params = new URLSearchParams({ ShipName: name });
      if (options.imo) params.set('ShipIMO', options.imo);

      const response = await fetch(`https://www.equasis.org/EquasisWeb/restricted/Search?${params}`, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Marlowe Compliance App/1.0', 'Accept': 'text/html' }
      });

      if (!response.ok) return { source: 'equasis', data: { results: [], total: 0 } };
      const html = await response.text();

      // Parse results from HTML
      const results = [];
      const rowRegex = /<tr[^>]*class="[^"]*shipResult[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
      let match;
      while ((match = rowRegex.exec(html)) !== null) {
        const cells = [];
        const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        let cellMatch;
        while ((cellMatch = cellRegex.exec(match[1])) !== null) {
          cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
        }
        if (cells.length >= 3) {
          results.push({
            name: cells[0] || '',
            imo: cells[1] || '',
            flag: cells[2] || '',
            type: cells[3] || '',
            tonnage: cells[4] || '',
            source: 'equasis'
          });
        }
      }

      return { source: 'equasis', data: { results: results.slice(0, 10), total: results.length } };
    } catch (e) {
      return { source: 'equasis', data: { results: [], total: 0 } };
    }
  }

  // ============================================
  // MARINETRAFFIC — AIS vessel tracking (requires key)
  // ============================================

  async searchMarineTraffic(name, options = {}) {
    if (!this.marineTrafficKey) return { source: 'marinetraffic', data: null, error: 'No API key' };

    try {
      let url;
      if (options.mmsi) {
        url = `https://services.marinetraffic.com/api/exportvessel/v:5/${this.marineTrafficKey}/mmsi:${options.mmsi}/protocol:jsono`;
      } else if (options.imo) {
        url = `https://services.marinetraffic.com/api/exportvessel/v:5/${this.marineTrafficKey}/imo:${options.imo}/protocol:jsono`;
      } else {
        url = `https://services.marinetraffic.com/api/exportvessel/v:5/${this.marineTrafficKey}/shipname:${encodeURIComponent(name)}/protocol:jsono`;
      }

      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) return { source: 'marinetraffic', data: null, error: `HTTP ${response.status}` };
      const data = await response.json();

      const results = (Array.isArray(data) ? data : [data]).map(v => ({
        name: v.SHIPNAME || '',
        imo: v.IMO || '',
        mmsi: v.MMSI || '',
        flag: v.FLAG || '',
        type: v.SHIPTYPE || '',
        status: v.STATUS || '',
        speed: v.SPEED || '',
        lat: v.LAT || '',
        lon: v.LON || '',
        destination: v.DESTINATION || '',
        eta: v.ETA || '',
        lastPort: v.LAST_PORT || '',
        lastPortTime: v.LAST_PORT_TIME || '',
        source: 'marinetraffic'
      }));

      return { source: 'marinetraffic', data: { results, total: results.length } };
    } catch (e) {
      return { source: 'marinetraffic', data: null, error: e.message };
    }
  }

  // ============================================
  // VESSELFINDER — vessel search
  // ============================================

  async searchVesselFinder(name, options = {}) {
    try {
      // VesselFinder has limited free access via their website
      const query = options.imo || options.mmsi || name;
      const response = await fetch(`https://www.vesselfinder.com/api/pub/search/v2?q=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Marlowe Compliance App/1.0', 'Accept': 'application/json' }
      });
      if (!response.ok) return { source: 'vesselfinder', data: { results: [], total: 0 } };
      const data = await response.json();

      const results = (data.results || data || []).slice(0, 10).map(v => ({
        name: v.name || v.SHIPNAME || '',
        imo: v.imo || '',
        mmsi: v.mmsi || '',
        flag: v.flag || '',
        type: v.type || '',
        source: 'vesselfinder'
      }));

      return { source: 'vesselfinder', data: { results, total: results.length } };
    } catch (e) {
      return { source: 'vesselfinder', data: { results: [], total: 0 } };
    }
  }

  // ============================================
  // CONSOLIDATION & RISK
  // ============================================

  consolidateFindings(results) {
    const findings = { vessels: [], tradeRecords: [], enforcementActions: [] };

    for (const r of results) {
      if (!r.data) continue;
      const items = r.data.results || r.data.matches || [];
      for (const item of items) {
        if (item.mmsi || item.imo || item.flag || item.shipType) {
          findings.vessels.push(item);
        } else if (item.tradeValue || item.flowDesc) {
          findings.tradeRecords.push(item);
        } else if (item.title || item.agency) {
          findings.enforcementActions.push(item);
        }
      }
    }

    return findings;
  }

  calculateRisk(findings, query) {
    let score = 0;
    const flags = [];

    // Sanctioned flag states
    const sanctionedFlags = ['north korea', 'dprk', 'kp', 'iran', 'ir', 'syria', 'sy', 'cuba', 'cu', 'crimea'];
    const flaggedVessels = findings.vessels.filter(v => {
      const f = (v.flag || '').toLowerCase();
      return sanctionedFlags.some(sf => f.includes(sf));
    });
    if (flaggedVessels.length > 0) {
      score += 50;
      flags.push({ severity: 'CRITICAL', type: 'SANCTIONED_FLAG', message: `${flaggedVessels.length} vessel(s) flagged to sanctioned state(s): ${[...new Set(flaggedVessels.map(v => v.flag))].join(', ')}` });
    }

    // Flag of convenience
    const focFlags = ['panama', 'pa', 'liberia', 'lr', 'marshall islands', 'mh', 'bahamas', 'bs', 'malta', 'mt', 'cyprus', 'cy', 'bermuda', 'bm', 'antigua', 'ag', 'st kitts', 'kn', 'vanuatu', 'vu', 'comoros', 'km', 'togo', 'tg', 'mongolia', 'mn', 'tanzania', 'tz', 'palau', 'pw', 'sierra leone', 'sl', 'cameroon', 'cm', 'bolivia', 'bo'];
    const focVessels = findings.vessels.filter(v => {
      const f = (v.flag || '').toLowerCase();
      return focFlags.some(ff => f.includes(ff));
    });
    if (focVessels.length > 0) {
      score += 10;
      flags.push({ severity: 'LOW', type: 'FLAG_OF_CONVENIENCE', message: `${focVessels.length} vessel(s) with flag(s) of convenience` });
    }

    // Trade with embargoed countries
    const embargoedCountries = ['north korea', 'iran', 'syria', 'cuba', 'crimea', 'russia', 'belarus', 'myanmar', 'venezuela'];
    const embargoTrade = findings.tradeRecords.filter(t => {
      const partner = (t.partner || '').toLowerCase();
      return embargoedCountries.some(ec => partner.includes(ec));
    });
    if (embargoTrade.length > 0) {
      score += 40;
      flags.push({ severity: 'CRITICAL', type: 'EMBARGO_TRADE', message: `Trade records with embargoed countries: ${[...new Set(embargoTrade.map(t => t.partner))].join(', ')}` });
    }

    // Enforcement actions
    if (findings.enforcementActions.length > 0) {
      score += 20;
      flags.push({ severity: 'HIGH', type: 'TRADE_ENFORCEMENT', message: `${findings.enforcementActions.length} trade-related enforcement action(s)` });
    }

    return {
      score: Math.min(score, 100),
      level: score >= 70 ? 'CRITICAL' : score >= 40 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW',
      flags: flags.sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[a.severity] - ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[b.severity])
    };
  }
}

module.exports = { ShippingTradeService };
