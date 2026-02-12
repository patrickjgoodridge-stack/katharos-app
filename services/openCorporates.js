// OpenCorporatesService — Global corporate registry search
// Source: OpenCorporates API (free tier: 50 req/day, no key needed)

const { BoundedCache } = require('./boundedCache');

class OpenCorporatesService {

  constructor() {
    this.apiKey = process.env.OPENCORPORATES_API_KEY || null;
    this.baseUrl = 'https://api.opencorporates.com/v0.4';
    this.cache = new BoundedCache({ maxSize: 200, ttlMs: 60 * 60 * 1000 });
  }

  // ============================================
  // MAIN ENTRY
  // ============================================

  async screenEntity(query) {
    const { name, jurisdiction, companyNumber } = query;

    const results = await Promise.all([
      this.searchCompanies(name, { jurisdiction }).catch(e => ({ source: 'opencorporates_companies', data: null, error: e.message })),
      this.searchOfficers(name, { jurisdiction }).catch(e => ({ source: 'opencorporates_officers', data: null, error: e.message })),
    ]);

    const sources = {};
    for (const r of results) {
      sources[r.source] = { data: r.data, error: r.error || null, matchCount: r.data?.results?.length || 0 };
    }

    const companies = results[0]?.data?.results || [];
    const officers = results[1]?.data?.results || [];

    // Fetch details for top company matches
    const detailedCompanies = [];
    for (const co of companies.slice(0, 5)) {
      if (co.jurisdictionCode && co.companyNumber) {
        try {
          const detail = await this.getCompanyDetail(co.jurisdictionCode, co.companyNumber);
          if (detail) detailedCompanies.push(detail);
          else detailedCompanies.push(co);
        } catch {
          detailedCompanies.push(co);
        }
      } else {
        detailedCompanies.push(co);
      }
    }

    const risk = this.calculateRisk(detailedCompanies, officers);

    return {
      query: { name, jurisdiction },
      companies: detailedCompanies,
      officers,
      totalCompanies: results[0]?.data?.total || 0,
      totalOfficers: results[1]?.data?.total || 0,
      riskAssessment: risk,
      sources,
      screenedAt: new Date().toISOString()
    };
  }

  // ============================================
  // COMPANY SEARCH
  // ============================================

  async searchCompanies(name, options = {}) {
    const params = new URLSearchParams({ q: name, order: 'score' });
    if (options.jurisdiction) params.append('jurisdiction_code', options.jurisdiction);
    if (this.apiKey) params.append('api_token', this.apiKey);

    try {
      const response = await fetch(`${this.baseUrl}/companies/search?${params}`, {
        signal: AbortSignal.timeout(15000),
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) return { source: 'opencorporates_companies', data: { results: [], total: 0 }, error: `HTTP ${response.status}` };
      const data = await response.json();

      const results = (data.results?.companies || []).map(c => {
        const co = c.company || c;
        return {
          name: co.name || '',
          companyNumber: co.company_number || '',
          jurisdictionCode: co.jurisdiction_code || '',
          incorporationDate: co.incorporation_date || '',
          dissolutionDate: co.dissolution_date || null,
          companyType: co.company_type || '',
          status: co.current_status || '',
          registeredAddress: co.registered_address_in_full || '',
          agentName: co.agent_name || null,
          agentAddress: co.agent_address || null,
          previousNames: (co.previous_names || []).map(p => p.company_name || p.name || ''),
          url: co.opencorporates_url || '',
          source: 'opencorporates'
        };
      });

      return { source: 'opencorporates_companies', data: { results, total: data.results?.total_count || results.length } };
    } catch (e) {
      return { source: 'opencorporates_companies', data: { results: [], total: 0 }, error: e.message };
    }
  }

  // ============================================
  // OFFICER SEARCH
  // ============================================

  async searchOfficers(name, options = {}) {
    const params = new URLSearchParams({ q: name, order: 'score' });
    if (options.jurisdiction) params.append('jurisdiction_code', options.jurisdiction);
    if (this.apiKey) params.append('api_token', this.apiKey);

    try {
      const response = await fetch(`${this.baseUrl}/officers/search?${params}`, {
        signal: AbortSignal.timeout(15000),
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) return { source: 'opencorporates_officers', data: { results: [], total: 0 }, error: `HTTP ${response.status}` };
      const data = await response.json();

      const results = (data.results?.officers || []).map(o => {
        const off = o.officer || o;
        return {
          name: off.name || '',
          position: off.position || '',
          startDate: off.start_date || '',
          endDate: off.end_date || null,
          nationality: off.nationality || '',
          occupation: off.occupation || '',
          companyName: off.company?.name || '',
          companyNumber: off.company?.company_number || '',
          jurisdictionCode: off.company?.jurisdiction_code || '',
          url: off.opencorporates_url || '',
          source: 'opencorporates'
        };
      });

      return { source: 'opencorporates_officers', data: { results, total: data.results?.total_count || results.length } };
    } catch (e) {
      return { source: 'opencorporates_officers', data: { results: [], total: 0 }, error: e.message };
    }
  }

  // ============================================
  // COMPANY DETAIL
  // ============================================

  async getCompanyDetail(jurisdictionCode, companyNumber) {
    const cacheKey = `${jurisdictionCode}/${companyNumber}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const params = this.apiKey ? `?api_token=${this.apiKey}` : '';
    try {
      const response = await fetch(`${this.baseUrl}/companies/${jurisdictionCode}/${companyNumber}${params}`, {
        signal: AbortSignal.timeout(15000),
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) return null;
      const data = await response.json();
      const co = data.results?.company || {};

      const detail = {
        name: co.name || '',
        companyNumber: co.company_number || '',
        jurisdictionCode: co.jurisdiction_code || '',
        incorporationDate: co.incorporation_date || '',
        dissolutionDate: co.dissolution_date || null,
        companyType: co.company_type || '',
        status: co.current_status || '',
        registeredAddress: co.registered_address_in_full || '',
        agentName: co.agent_name || null,
        previousNames: (co.previous_names || []).map(p => ({ name: p.company_name, startDate: p.start_date, endDate: p.end_date })),
        officers: (co.officers || []).map(o => {
          const off = o.officer || o;
          return { name: off.name, position: off.position, startDate: off.start_date, endDate: off.end_date };
        }),
        filings: (co.filings || []).slice(0, 10).map(f => {
          const fil = f.filing || f;
          return { title: fil.title, date: fil.date, type: fil.filing_type };
        }),
        industryCode: co.industry_codes?.[0]?.code || null,
        url: co.opencorporates_url || '',
        source: 'opencorporates'
      };

      this.cache.set(cacheKey, detail);
      return detail;
    } catch {
      return null;
    }
  }

  // ============================================
  // RISK SCORING
  // ============================================

  calculateRisk(companies, officers) {
    let score = 0;
    const flags = [];

    // Dissolved companies
    const dissolved = companies.filter(c => c.status && c.status.toLowerCase().includes('dissolv'));
    if (dissolved.length > 0) {
      score += 10;
      flags.push({ severity: 'MEDIUM', type: 'DISSOLVED_COMPANIES', message: `${dissolved.length} dissolved company/ies` });
    }

    // Offshore jurisdictions
    const offshoreJurisdictions = ['vg', 'ky', 'bm', 'pa', 'sc', 'bs', 'je', 'gg', 'im', 'li', 'mc', 'gi', 'ai', 'tc', 'ws', 'vu', 'mh'];
    const offshore = companies.filter(c => offshoreJurisdictions.includes((c.jurisdictionCode || '').toLowerCase()));
    if (offshore.length > 0) {
      score += 20;
      flags.push({ severity: 'HIGH', type: 'OFFSHORE_JURISDICTION', message: `${offshore.length} company/ies in offshore jurisdictions: ${[...new Set(offshore.map(c => c.jurisdictionCode))].join(', ')}` });
    }

    // Very recent incorporation
    const recent = companies.filter(c => {
      if (!c.incorporationDate) return false;
      const d = new Date(c.incorporationDate);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return d > oneYearAgo;
    });
    if (recent.length > 0) {
      score += 10;
      flags.push({ severity: 'LOW', type: 'RECENT_INCORPORATION', message: `${recent.length} company/ies incorporated within last year` });
    }

    // Multiple directorships
    if (officers.length > 10) {
      score += 15;
      flags.push({ severity: 'MEDIUM', type: 'MANY_DIRECTORSHIPS', message: `${officers.length} officer positions found` });
    }

    // Previous name changes
    const nameChanges = companies.filter(c => c.previousNames && c.previousNames.length > 0);
    if (nameChanges.length > 0) {
      const totalChanges = nameChanges.reduce((s, c) => s + c.previousNames.length, 0);
      if (totalChanges > 3) {
        score += 10;
        flags.push({ severity: 'LOW', type: 'NAME_CHANGES', message: `${totalChanges} name change(s) across ${nameChanges.length} company/ies` });
      }
    }

    return {
      score: Math.min(score, 100),
      level: score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW',
      flags: flags.sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[a.severity] - ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[b.severity])
    };
  }
}

module.exports = { OpenCorporatesService };
