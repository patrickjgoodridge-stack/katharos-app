// DataSourceManager — Unified multi-source screening service
// Sources: ICIJ Offshore Leaks, SEC EDGAR, World Bank Debarment, CourtListener, UK Companies House

class DataSourceManager {
  constructor() {
    this.ukCompaniesHouseKey = process.env.COMPANIES_HOUSE_API_KEY || null;
    this.courtListenerKey = process.env.COURTLISTENER_KEY || null;
  }

  // Main screening method — runs all sources in parallel
  async screenEntity(name, type = 'INDIVIDUAL', options = {}) {
    const promises = [
      this.searchOffshoreLeaks(name).catch(e => ({ source: 'icij', data: null, error: e.message })),
      this.searchSEC(name).catch(e => ({ source: 'sec', data: null, error: e.message })),
      this.searchWorldBankDebarred(name).catch(e => ({ source: 'worldBank', data: null, error: e.message })),
    ];

    if (this.courtListenerKey) {
      promises.push(
        this.searchCourtListener(name).catch(e => ({ source: 'courtListener', data: null, error: e.message }))
      );
    }

    if (this.ukCompaniesHouseKey && type === 'ENTITY') {
      promises.push(
        this.searchUKCompanies(name).catch(e => ({ source: 'ukCompaniesHouse', data: null, error: e.message }))
      );
    }

    const results = await Promise.all(promises);

    const output = {
      subject: name,
      type,
      screeningDate: new Date().toISOString(),
      sources: {},
      riskScore: 0,
      riskFactors: [],
    };

    for (const result of results) {
      output.sources[result.source] = {
        data: result.data,
        error: result.error || null,
        matchCount: result.data?.matches?.length || result.data?.results?.length || 0,
      };
    }

    // Calculate aggregate risk
    const risk = this.calculateRiskScore(output.sources);
    output.riskScore = risk.score;
    output.riskFactors = risk.factors;

    return output;
  }

  // ─── ICIJ Offshore Leaks ────────────────────────────────────
  async searchOffshoreLeaks(query) {
    const url = `https://offshoreleaks.icij.org/api/v1/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`ICIJ API error: ${response.status}`);
    const data = await response.json();

    const matches = [];
    // Process each result type: entities, officers, intermediaries, addresses
    for (const category of ['entities', 'officers', 'intermediaries', 'addresses']) {
      if (data[category]) {
        for (const item of data[category]) {
          matches.push({
            type: category.replace(/s$/, ''),
            name: item.name || item.entity || '',
            jurisdiction: item.jurisdiction || item.country || '',
            sourceDataset: item.source || item.dataset || '',
            linkedTo: item.linked_to || item.intermediary || '',
            address: item.address || '',
            nodeId: item.node_id || item.id || '',
          });
        }
      }
    }

    // Deduplicate by name+type
    const seen = new Set();
    const deduped = matches.filter(m => {
      const key = `${m.name}|${m.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      source: 'icij',
      data: {
        matches: deduped.slice(0, 20),
        totalResults: matches.length,
        datasetsFound: [...new Set(matches.map(m => m.sourceDataset).filter(Boolean))],
      },
    };
  }

  // ─── SEC EDGAR ──────────────────────────────────────────────
  async searchSEC(query) {
    // Full-text search
    const url = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(`"${query}"`)}&dateRange=custom&startdt=2019-01-01&enddt=2026-01-31&forms=10-K,10-Q,8-K,DEF+14A,13F-HR,SC+13D,SC+13G,4`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Marlowe Compliance App support@marlowe.app' },
      signal: AbortSignal.timeout(15000),
    });

    let filings = [];
    let enforcement = [];

    if (response.ok) {
      const data = await response.json();
      if (data.hits?.hits) {
        for (const hit of data.hits.hits.slice(0, 15)) {
          const src = hit._source || {};
          filings.push({
            form: src.form_type || src.file_type || '',
            filingDate: src.file_date || src.date_filed || '',
            companyName: src.display_names?.[0] || src.entity_name || '',
            cik: src.entity_id || '',
            description: src.display_date_filed || '',
          });
        }
      }
    }

    // Also search enforcement actions via EDGAR full-text
    try {
      const enfUrl = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(`"${query}"`)}&dateRange=custom&startdt=2019-01-01&enddt=2026-01-31&forms=LR,AAER,AP`;
      const enfResponse = await fetch(enfUrl, {
        headers: { 'User-Agent': 'Marlowe Compliance App support@marlowe.app' },
        signal: AbortSignal.timeout(10000),
      });
      if (enfResponse.ok) {
        const enfData = await enfResponse.json();
        if (enfData.hits?.hits) {
          for (const hit of enfData.hits.hits.slice(0, 10)) {
            const src = hit._source || {};
            enforcement.push({
              type: src.form_type || 'Enforcement',
              date: src.file_date || '',
              description: src.display_names?.[0] || '',
            });
          }
        }
      }
    } catch {
      // Non-critical
    }

    return {
      source: 'sec',
      data: {
        results: filings,
        enforcement,
        totalFilings: filings.length,
        hasEnforcement: enforcement.length > 0,
      },
    };
  }

  // ─── World Bank Debarment ───────────────────────────────────
  async searchWorldBankDebarred(query) {
    const url = 'https://apigwext.worldbank.org/dvsvc/v1.0/json/APPLICATION/ADOBE_EXPRNC/FIRM_LIST';
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`World Bank API error: ${response.status}`);
    const data = await response.json();

    const queryLower = query.toLowerCase();
    const matches = [];

    if (Array.isArray(data)) {
      for (const firm of data) {
        const firmName = (firm.FIRM_NAME || '').toLowerCase();
        const individualName = (firm.INDIVIDUAL_NAME || '').toLowerCase();
        if (firmName.includes(queryLower) || individualName.includes(queryLower) ||
            queryLower.includes(firmName) || queryLower.includes(individualName)) {
          matches.push({
            firmName: firm.FIRM_NAME || null,
            individualName: firm.INDIVIDUAL_NAME || null,
            country: firm.COUNTRY || '',
            sanctionType: firm.SANCTION_TYPE || '',
            fromDate: firm.FROM_DATE || '',
            toDate: firm.TO_DATE || '',
            grounds: firm.GROUNDS || '',
          });
        }
      }
    }

    return {
      source: 'worldBank',
      data: {
        matches: matches.slice(0, 20),
        totalResults: matches.length,
      },
    };
  }

  // ─── CourtListener ─────────────────────────────────────────
  async searchCourtListener(query) {
    const url = `https://www.courtlistener.com/api/rest/v3/search/?q=${encodeURIComponent(`"${query}"`)}&type=r&order_by=score+desc`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Token ${this.courtListenerKey}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`CourtListener API error: ${response.status}`);
    const data = await response.json();

    const results = [];
    if (data.results) {
      for (const r of data.results.slice(0, 15)) {
        results.push({
          caseName: r.caseName || r.case_name || '',
          court: r.court || r.court_id || '',
          dateFiled: r.dateFiled || r.date_filed || '',
          dateDecided: r.dateTerminated || r.date_terminated || '',
          docketNumber: r.docketNumber || r.docket_number || '',
          suitNature: r.suitNature || r.nature_of_suit || '',
          status: r.status || '',
        });
      }
    }

    return {
      source: 'courtListener',
      data: {
        results,
        totalResults: data.count || results.length,
      },
    };
  }

  // ─── UK Companies House ─────────────────────────────────────
  async searchUKCompanies(query) {
    const authHeader = 'Basic ' + Buffer.from(this.ukCompaniesHouseKey + ':').toString('base64');

    // Search companies
    const searchUrl = `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(query)}&items_per_page=5`;
    const searchResponse = await fetch(searchUrl, {
      headers: { 'Authorization': authHeader },
      signal: AbortSignal.timeout(15000),
    });
    if (!searchResponse.ok) throw new Error(`UK Companies House API error: ${searchResponse.status}`);
    const searchData = await searchResponse.json();

    const companies = [];
    if (searchData.items) {
      for (const item of searchData.items.slice(0, 5)) {
        const company = {
          companyName: item.title || '',
          companyNumber: item.company_number || '',
          status: item.company_status || '',
          incorporationDate: item.date_of_creation || '',
          address: item.address_snippet || '',
          type: item.company_type || '',
          officers: [],
          pscs: [],
        };

        // Get officers and PSCs for top results
        try {
          const [officersRes, pscsRes] = await Promise.all([
            fetch(`https://api.company-information.service.gov.uk/company/${item.company_number}/officers`, {
              headers: { 'Authorization': authHeader },
              signal: AbortSignal.timeout(10000),
            }),
            fetch(`https://api.company-information.service.gov.uk/company/${item.company_number}/persons-with-significant-control`, {
              headers: { 'Authorization': authHeader },
              signal: AbortSignal.timeout(10000),
            }),
          ]);

          if (officersRes.ok) {
            const officersData = await officersRes.json();
            company.officers = (officersData.items || []).slice(0, 10).map(o => ({
              name: o.name || '',
              role: o.officer_role || '',
              appointedOn: o.appointed_on || '',
              resignedOn: o.resigned_on || null,
              nationality: o.nationality || '',
            }));
          }

          if (pscsRes.ok) {
            const pscsData = await pscsRes.json();
            company.pscs = (pscsData.items || []).slice(0, 10).map(p => ({
              name: p.name || p.name_elements?.forename + ' ' + p.name_elements?.surname || '',
              kind: p.kind || '',
              naturesOfControl: p.natures_of_control || [],
              notifiedOn: p.notified_on || '',
              nationality: p.nationality || '',
              countryOfResidence: p.country_of_residence || '',
            }));
          }
        } catch {
          // Non-critical — we still have the company info
        }

        companies.push(company);
      }
    }

    return {
      source: 'ukCompaniesHouse',
      data: {
        results: companies,
        totalResults: searchData.total_results || companies.length,
      },
    };
  }

  // ─── Risk Score Calculation ─────────────────────────────────
  calculateRiskScore(sources) {
    let score = 0;
    const factors = [];

    // ICIJ Offshore Leaks
    const icij = sources.icij?.data;
    if (icij?.matches?.length > 0) {
      score += 20;
      factors.push({ source: 'ICIJ Offshore Leaks', detail: `${icij.matches.length} match(es) found`, points: 20 });
      const datasets = icij.datasetsFound || [];
      if (datasets.length > 1) {
        const bonus = (datasets.length - 1) * 5;
        score += bonus;
        factors.push({ source: 'ICIJ', detail: `Appears in ${datasets.length} datasets: ${datasets.join(', ')}`, points: bonus });
      }
    }

    // SEC enforcement
    const sec = sources.sec?.data;
    if (sec?.hasEnforcement) {
      score += 20;
      factors.push({ source: 'SEC', detail: `${sec.enforcement.length} enforcement action(s)`, points: 20 });
    }
    if (sec?.totalFilings > 0) {
      // Filings alone aren't negative — just informational
    }

    // World Bank debarment
    const wb = sources.worldBank?.data;
    if (wb?.matches?.length > 0) {
      const activeDebarments = wb.matches.filter(m => {
        if (!m.toDate) return true;
        return new Date(m.toDate) > new Date();
      });
      if (activeDebarments.length > 0) {
        score += 20;
        factors.push({ source: 'World Bank', detail: `${activeDebarments.length} active debarment(s)`, points: 20 });
      } else {
        score += 10;
        factors.push({ source: 'World Bank', detail: `${wb.matches.length} expired debarment(s)`, points: 10 });
      }
    }

    // CourtListener
    const cl = sources.courtListener?.data;
    if (cl?.results?.length > 0) {
      // Check for criminal cases
      const criminal = cl.results.filter(r =>
        (r.suitNature || '').toLowerCase().includes('criminal') ||
        (r.caseName || '').toLowerCase().includes('united states v')
      );
      if (criminal.length > 0) {
        score += 25;
        factors.push({ source: 'Federal Courts', detail: `${criminal.length} criminal case(s)`, points: 25 });
      }
      const civil = cl.results.length - criminal.length;
      if (civil > 0) {
        const civilPoints = Math.min(civil * 5, 15);
        score += civilPoints;
        factors.push({ source: 'Federal Courts', detail: `${civil} civil case(s)`, points: civilPoints });
      }
    }

    // UK Companies House red flags
    const uk = sources.ukCompaniesHouse?.data;
    if (uk?.results?.length > 0) {
      for (const co of uk.results) {
        if (co.status === 'dissolved') {
          score += 5;
          factors.push({ source: 'UK Companies House', detail: `${co.companyName} is dissolved`, points: 5 });
        }
        // Recently incorporated
        if (co.incorporationDate) {
          const incDate = new Date(co.incorporationDate);
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          if (incDate > oneYearAgo) {
            score += 5;
            factors.push({ source: 'UK Companies House', detail: `${co.companyName} incorporated < 1 year ago`, points: 5 });
          }
        }
        // PSC is a company (layered ownership)
        const corporatePscs = (co.pscs || []).filter(p => (p.kind || '').includes('corporate'));
        if (corporatePscs.length > 0) {
          score += 10;
          factors.push({ source: 'UK Companies House', detail: `${co.companyName} has corporate PSC (layered ownership)`, points: 10 });
        }
      }
    }

    return { score: Math.min(score, 100), factors };
  }
}

module.exports = { DataSourceManager };
