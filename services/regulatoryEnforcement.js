// RegulatoryEnforcementService — Multi-agency enforcement action screening
// Sources: DOJ, CFPB, FTC, CFTC, Federal Reserve, FDIC, OCC, UK FCA, EU Competition, BaFin, MAS, HKMA, ASIC

const { BoundedCache } = require('./boundedCache');

class RegulatoryEnforcementService {

  constructor() {
    this.cache = new BoundedCache({ maxSize: 200, ttlMs: 60 * 60 * 1000 });
  }

  // ============================================
  // MAIN ENTRY
  // ============================================

  async screenEntity(query) {
    const { name, type, country } = query;

    const promises = [
      // US Federal
      this.searchDOJ(name).catch(e => ({ source: 'doj', data: null, error: e.message })),
      this.searchCFPB(name).catch(e => ({ source: 'cfpb', data: null, error: e.message })),
      this.searchFTC(name).catch(e => ({ source: 'ftc', data: null, error: e.message })),
      this.searchCFTC(name).catch(e => ({ source: 'cftc', data: null, error: e.message })),
      this.searchFederalReserve(name).catch(e => ({ source: 'federal_reserve', data: null, error: e.message })),
      this.searchFDIC(name).catch(e => ({ source: 'fdic', data: null, error: e.message })),
      this.searchOCC(name).catch(e => ({ source: 'occ', data: null, error: e.message })),
      // UK
      this.searchFCA(name).catch(e => ({ source: 'fca', data: null, error: e.message })),
      // EU
      this.searchEUCompetition(name).catch(e => ({ source: 'eu_competition', data: null, error: e.message })),
      // US — FinCEN
      this.searchFinCEN(name).catch(e => ({ source: 'fincen', data: null, error: e.message })),
      // UK — Serious Fraud Office
      this.searchSFO(name).catch(e => ({ source: 'sfo', data: null, error: e.message })),
      // Germany — BaFin
      this.searchBaFin(name).catch(e => ({ source: 'bafin', data: null, error: e.message })),
      // Singapore — MAS
      this.searchMAS(name).catch(e => ({ source: 'mas', data: null, error: e.message })),
      // Hong Kong — HKMA
      this.searchHKMA(name).catch(e => ({ source: 'hkma', data: null, error: e.message })),
      // Australia — ASIC
      this.searchASIC(name).catch(e => ({ source: 'asic', data: null, error: e.message })),
    ];

    const results = await Promise.all(promises);
    const sources = {};
    let allActions = [];

    for (const r of results) {
      sources[r.source] = { data: r.data, error: r.error || null, matchCount: r.data?.actions?.length || r.data?.results?.length || 0 };
      if (r.data?.actions) allActions.push(...r.data.actions);
      if (r.data?.results) allActions.push(...r.data.results);
    }

    const risk = this.calculateRisk(allActions);

    return {
      query: { name, type: type || 'ALL' },
      totalActions: allActions.length,
      actions: allActions.slice(0, 50),
      riskAssessment: risk,
      sources,
      screenedAt: new Date().toISOString()
    };
  }

  // ============================================
  // DOJ — Department of Justice press releases
  // ============================================

  async searchDOJ(name) {
    const query = encodeURIComponent(`"${name}"`);
    try {
      // DOJ press releases search
      const response = await fetch(`https://www.justice.gov/api/v1/press-releases.json?keyword=${query}&sort=date&direction=DESC&pagesize=10`, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Katharos Compliance App/1.0' }
      });
      if (!response.ok) {
        // Fallback: GDELT search scoped to justice.gov
        return this._gdeltDomainSearch(name, 'justice.gov', 'doj');
      }
      const data = await response.json();
      const actions = (data.results || []).map(r => ({
        agency: 'DOJ',
        title: r.title || '',
        date: r.date || r.created || '',
        type: this.classifyDOJAction(r.title || ''),
        url: r.url ? `https://www.justice.gov${r.url}` : '',
        summary: r.teaser || r.body?.substring(0, 300) || '',
        source: 'doj'
      }));
      return { source: 'doj', data: { actions, total: data.count || actions.length } };
    } catch (e) {
      return this._gdeltDomainSearch(name, 'justice.gov', 'doj');
    }
  }

  classifyDOJAction(title) {
    const t = title.toLowerCase();
    if (t.includes('indictment') || t.includes('indicted')) return 'INDICTMENT';
    if (t.includes('guilty') || t.includes('conviction') || t.includes('sentenced')) return 'CRIMINAL_CONVICTION';
    if (t.includes('charged')) return 'CRIMINAL_CHARGE';
    if (t.includes('settlement') || t.includes('agrees to pay')) return 'SETTLEMENT';
    if (t.includes('forfeiture') || t.includes('seizure')) return 'FORFEITURE';
    if (t.includes('sanction')) return 'SANCTIONS';
    return 'ENFORCEMENT_ACTION';
  }

  // ============================================
  // CFPB — Consumer Financial Protection Bureau
  // ============================================

  async searchCFPB(name) {
    const query = encodeURIComponent(name);
    try {
      const response = await fetch(`https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/?search_term=${query}&size=10&sort=created_date_desc`, {
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) return this._gdeltDomainSearch(name, 'consumerfinance.gov', 'cfpb');
      const data = await response.json();
      const actions = (data.hits?.hits || []).map(h => {
        const s = h._source || {};
        return {
          agency: 'CFPB',
          title: `Complaint: ${s.product || 'Unknown product'}`,
          date: s.date_received || '',
          type: 'COMPLAINT',
          companyResponse: s.company_response || '',
          issue: s.issue || '',
          product: s.product || '',
          state: s.state || '',
          source: 'cfpb'
        };
      });
      return { source: 'cfpb', data: { actions, total: data.hits?.total?.value || actions.length } };
    } catch (e) {
      return this._gdeltDomainSearch(name, 'consumerfinance.gov', 'cfpb');
    }
  }

  // ============================================
  // FTC — Federal Trade Commission
  // ============================================

  async searchFTC(name) {
    const query = encodeURIComponent(`"${name}"`);
    try {
      const response = await fetch(`https://www.ftc.gov/api/v1/enforcement.json?keyword=${query}&sort=date&direction=DESC&pagesize=10`, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Katharos Compliance App/1.0' }
      });
      if (!response.ok) return this._gdeltDomainSearch(name, 'ftc.gov', 'ftc');
      const data = await response.json();
      const actions = (data.results || []).map(r => ({
        agency: 'FTC',
        title: r.title || '',
        date: r.date || r.created || '',
        type: 'FTC_ACTION',
        url: r.url ? `https://www.ftc.gov${r.url}` : '',
        summary: r.teaser || '',
        source: 'ftc'
      }));
      return { source: 'ftc', data: { actions, total: actions.length } };
    } catch (e) {
      return this._gdeltDomainSearch(name, 'ftc.gov', 'ftc');
    }
  }

  // ============================================
  // CFTC — Commodity Futures Trading Commission
  // ============================================

  async searchCFTC(name) {
    return this._gdeltDomainSearch(name, 'cftc.gov', 'cftc');
  }

  // ============================================
  // FEDERAL RESERVE — Enforcement actions
  // ============================================

  async searchFederalReserve(name) {
    const query = encodeURIComponent(`"${name}"`);
    try {
      const response = await fetch(`https://www.federalreserve.gov/supervisionreg/enforcement-actions-search.htm?searchText=${query}`, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Katharos Compliance App/1.0' }
      });
      if (!response.ok) return this._gdeltDomainSearch(name, 'federalreserve.gov', 'federal_reserve');

      const html = await response.text();
      const actions = this.parseEnforcementHTML(html, 'Federal Reserve', 'federal_reserve');
      return { source: 'federal_reserve', data: { actions, total: actions.length } };
    } catch (e) {
      return this._gdeltDomainSearch(name, 'federalreserve.gov', 'federal_reserve');
    }
  }

  // ============================================
  // FDIC — Federal Deposit Insurance Corporation
  // ============================================

  async searchFDIC(name) {
    const query = encodeURIComponent(`"${name}"`);
    try {
      const response = await fetch(`https://efr.fdic.gov/fcxweb/efr/index.html?searchAction=searchByName&name=${query}`, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Katharos Compliance App/1.0' }
      });
      if (!response.ok) return this._gdeltDomainSearch(name, 'fdic.gov', 'fdic');

      const html = await response.text();
      const actions = this.parseEnforcementHTML(html, 'FDIC', 'fdic');
      return { source: 'fdic', data: { actions, total: actions.length } };
    } catch (e) {
      return this._gdeltDomainSearch(name, 'fdic.gov', 'fdic');
    }
  }

  // ============================================
  // OCC — Office of the Comptroller of the Currency
  // ============================================

  async searchOCC(name) {
    return this._gdeltDomainSearch(name, 'occ.gov', 'occ');
  }

  // ============================================
  // UK FCA — Financial Conduct Authority
  // ============================================

  async searchFCA(name) {
    const query = encodeURIComponent(name);
    try {
      // FCA Register API
      const response = await fetch(`https://register.fca.org.uk/services/V0.1/Search?q=${query}&type=all`, {
        signal: AbortSignal.timeout(15000),
        headers: { 'Accept': 'application/json', 'User-Agent': 'Katharos Compliance App/1.0' }
      });
      if (!response.ok) {
        // Fallback: FCA Warning List
        return this._searchFCAWarningList(name);
      }
      const data = await response.json();

      const results = (data.Data || []).map(r => ({
        agency: 'FCA',
        name: r.Name || r.Organisation_Name || '',
        status: r.Status || '',
        type: r.Type || '',
        firmRef: r.FRN || '',
        url: r.FRN ? `https://register.fca.org.uk/s/firm?id=${r.FRN}` : '',
        source: 'fca'
      }));

      // Check warnings list too
      const warnings = await this._searchFCAWarningList(name);
      const actions = [...(warnings.data?.actions || [])];

      return { source: 'fca', data: { results, actions, total: results.length + actions.length } };
    } catch (e) {
      return this._searchFCAWarningList(name);
    }
  }

  async _searchFCAWarningList(name) {
    try {
      const response = await fetch(`https://register.fca.org.uk/services/V0.1/Warnings?q=${encodeURIComponent(name)}`, {
        signal: AbortSignal.timeout(15000),
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) return this._gdeltDomainSearch(name, 'fca.org.uk', 'fca');
      const data = await response.json();
      const actions = (data.Data || []).map(w => ({
        agency: 'FCA',
        title: `Warning: ${w.Name || name}`,
        date: w.Date || '',
        type: 'FCA_WARNING',
        detail: w.Detail || '',
        source: 'fca'
      }));
      return { source: 'fca', data: { actions, total: actions.length } };
    } catch {
      return this._gdeltDomainSearch(name, 'fca.org.uk', 'fca');
    }
  }

  // ============================================
  // EU COMPETITION — European Commission
  // ============================================

  async searchEUCompetition(name) {
    const query = encodeURIComponent(`"${name}"`);
    try {
      const response = await fetch(`https://ec.europa.eu/competition/elojade/isef/index.cfm?fuseaction=dsp_result&policy_area_id=1,2,3&case_title=${query}`, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Katharos Compliance App/1.0' }
      });
      if (!response.ok) return this._gdeltDomainSearch(name, 'ec.europa.eu', 'eu_competition');

      const html = await response.text();
      const actions = this.parseEnforcementHTML(html, 'EU Competition', 'eu_competition');
      return { source: 'eu_competition', data: { actions, total: actions.length } };
    } catch (e) {
      return this._gdeltDomainSearch(name, 'ec.europa.eu', 'eu_competition');
    }
  }

  // ============================================
  // FinCEN — Financial Crimes Enforcement Network
  // ============================================

  async searchFinCEN(name) {
    const query = encodeURIComponent(`"${name}"`);
    try {
      // FinCEN enforcement actions page (HTML scrape)
      const response = await fetch(`https://www.fincen.gov/news-room/enforcement-actions?field_news_title_value=${query}`, {
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': 'Katharos Compliance App/1.0' }
      });
      if (!response.ok) return this._gdeltDomainSearch(name, 'fincen.gov', 'fincen');
      const html = await response.text();
      const actions = this.parseEnforcementHTML(html, 'FinCEN', 'fincen');

      // Also check FinCEN's SAR stats / 311 special measures via GDELT
      if (actions.length === 0) {
        return this._gdeltDomainSearch(name, 'fincen.gov', 'fincen');
      }
      return { source: 'fincen', data: { actions, total: actions.length } };
    } catch (e) {
      return this._gdeltDomainSearch(name, 'fincen.gov', 'fincen');
    }
  }

  // ============================================
  // SFO — UK Serious Fraud Office
  // ============================================

  async searchSFO(name) {
    const query = encodeURIComponent(`"${name}"`);
    try {
      // SFO case search (HTML scrape)
      const response = await fetch(`https://www.sfo.gov.uk/?s=${query}`, {
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': 'Katharos Compliance App/1.0' }
      });
      if (!response.ok) return this._gdeltDomainSearch(name, 'sfo.gov.uk', 'sfo');
      const html = await response.text();

      // Parse SFO search results — typically <article> or <h2> with links
      const actions = [];
      const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
      let match;
      while ((match = articleRegex.exec(html)) !== null) {
        const titleMatch = match[1].match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
        const dateMatch = match[1].match(/<time[^>]*>([\s\S]*?)<\/time>/i);
        if (titleMatch) {
          const title = titleMatch[2].replace(/<[^>]+>/g, '').trim();
          if (title.toLowerCase().includes(name.toLowerCase().split(/\s+/)[0])) {
            actions.push({
              agency: 'SFO',
              title,
              date: dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').trim() : '',
              type: title.toLowerCase().includes('conviction') ? 'CRIMINAL_CONVICTION' :
                    title.toLowerCase().includes('charged') ? 'CRIMINAL_CHARGE' :
                    title.toLowerCase().includes('investigation') ? 'INVESTIGATION' : 'ENFORCEMENT_ACTION',
              url: titleMatch[1].startsWith('http') ? titleMatch[1] : `https://www.sfo.gov.uk${titleMatch[1]}`,
              source: 'sfo'
            });
          }
        }
      }

      if (actions.length === 0) return this._gdeltDomainSearch(name, 'sfo.gov.uk', 'sfo');
      return { source: 'sfo', data: { actions: actions.slice(0, 20), total: actions.length } };
    } catch (e) {
      return this._gdeltDomainSearch(name, 'sfo.gov.uk', 'sfo');
    }
  }

  // ============================================
  // BaFin — German Federal Financial Supervisory Authority
  // ============================================

  async searchBaFin(name) {
    const query = encodeURIComponent(`"${name}"`);
    try {
      // BaFin search page
      const response = await fetch(`https://www.bafin.de/SiteGlobals/Forms/Suche/Servicesuche_Formular.html?queryString=${query}&cl2Categories_Typ=Sanktionen`, {
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': 'Katharos Compliance App/1.0', 'Accept-Language': 'en-US,en;q=0.9' }
      });
      if (!response.ok) return this._gdeltDomainSearch(name, 'bafin.de', 'bafin');
      const html = await response.text();
      const actions = this.parseEnforcementHTML(html, 'BaFin', 'bafin');

      if (actions.length === 0) return this._gdeltDomainSearch(name, 'bafin.de', 'bafin');
      return { source: 'bafin', data: { actions, total: actions.length } };
    } catch (e) {
      return this._gdeltDomainSearch(name, 'bafin.de', 'bafin');
    }
  }

  // ============================================
  // MAS — Monetary Authority of Singapore
  // ============================================

  async searchMAS(name) {
    const query = encodeURIComponent(`"${name}"`);
    try {
      // MAS enforcement actions search
      const response = await fetch(`https://www.mas.gov.sg/search?q=${query}&Content=enforcement`, {
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': 'Katharos Compliance App/1.0' }
      });
      if (!response.ok) return this._gdeltDomainSearch(name, 'mas.gov.sg', 'mas');
      const html = await response.text();
      const actions = this.parseEnforcementHTML(html, 'MAS', 'mas');

      // Also check MAS investor alert list
      const alertRes = await fetch(`https://www.mas.gov.sg/investor-alert-list?q=${query}`, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Katharos Compliance App/1.0' }
      }).catch(() => null);
      if (alertRes?.ok) {
        const alertHtml = await alertRes.text();
        if (alertHtml.toLowerCase().includes(name.toLowerCase().split(/\s+/)[0].toLowerCase())) {
          actions.push({
            agency: 'MAS',
            title: `MAS Investor Alert List mention: ${name}`,
            date: '',
            type: 'REGULATORY_WARNING',
            url: 'https://www.mas.gov.sg/investor-alert-list',
            source: 'mas'
          });
        }
      }

      if (actions.length === 0) return this._gdeltDomainSearch(name, 'mas.gov.sg', 'mas');
      return { source: 'mas', data: { actions: actions.slice(0, 20), total: actions.length } };
    } catch (e) {
      return this._gdeltDomainSearch(name, 'mas.gov.sg', 'mas');
    }
  }

  // ============================================
  // HKMA — Hong Kong Monetary Authority
  // ============================================

  async searchHKMA(name) {
    const query = encodeURIComponent(`"${name}"`);
    try {
      // HKMA press releases and enforcement
      const response = await fetch(`https://www.hkma.gov.hk/eng/search-result/?q=${query}`, {
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': 'Katharos Compliance App/1.0' }
      });
      if (!response.ok) return this._gdeltDomainSearch(name, 'hkma.gov.hk', 'hkma');
      const html = await response.text();
      const actions = this.parseEnforcementHTML(html, 'HKMA', 'hkma');

      if (actions.length === 0) return this._gdeltDomainSearch(name, 'hkma.gov.hk', 'hkma');
      return { source: 'hkma', data: { actions, total: actions.length } };
    } catch (e) {
      return this._gdeltDomainSearch(name, 'hkma.gov.hk', 'hkma');
    }
  }

  // ============================================
  // ASIC — Australian Securities and Investments Commission
  // ============================================

  async searchASIC(name) {
    const query = encodeURIComponent(`"${name}"`);
    try {
      // ASIC enforcement search
      const response = await fetch(`https://asic.gov.au/search/?q=${query}&collection=asic-meta&profile=_default`, {
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': 'Katharos Compliance App/1.0' }
      });
      if (!response.ok) return this._gdeltDomainSearch(name, 'asic.gov.au', 'asic');
      const html = await response.text();

      // Parse ASIC search results
      const actions = [];
      const resultRegex = /<li[^>]*class="[^"]*search-result[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
      let match;
      while ((match = resultRegex.exec(html)) !== null) {
        const titleMatch = match[1].match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
        const dateMatch = match[1].match(/(\d{1,2}\s+\w+\s+\d{4})/);
        if (titleMatch) {
          const title = titleMatch[2].replace(/<[^>]+>/g, '').trim();
          const t = title.toLowerCase();
          const isEnforcement = t.includes('banned') || t.includes('cancel') || t.includes('penalty') ||
            t.includes('court') || t.includes('charged') || t.includes('enforceable') || t.includes('infringement');
          if (isEnforcement || t.includes(name.toLowerCase().split(/\s+/)[0])) {
            actions.push({
              agency: 'ASIC',
              title,
              date: dateMatch ? dateMatch[1] : '',
              type: t.includes('banned') ? 'BAN' :
                    t.includes('penalty') || t.includes('infringement') ? 'PENALTY' :
                    t.includes('cancel') ? 'LICENCE_CANCELLATION' :
                    t.includes('court') || t.includes('charged') ? 'CRIMINAL_CHARGE' : 'ENFORCEMENT_ACTION',
              url: titleMatch[1].startsWith('http') ? titleMatch[1] : `https://asic.gov.au${titleMatch[1]}`,
              source: 'asic'
            });
          }
        }
      }

      if (actions.length === 0) return this._gdeltDomainSearch(name, 'asic.gov.au', 'asic');
      return { source: 'asic', data: { actions: actions.slice(0, 20), total: actions.length } };
    } catch (e) {
      return this._gdeltDomainSearch(name, 'asic.gov.au', 'asic');
    }
  }

  // ============================================
  // GDELT FALLBACK — Domain-specific news
  // ============================================

  async _gdeltDomainSearch(name, domain, source) {
    try {
      const query = encodeURIComponent(`"${name}" domain:${domain}`);
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=10&format=json&timespan=5y`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return { source, data: { actions: [], total: 0 } };
      const data = await response.json();

      const actions = (data.articles || []).map(a => ({
        agency: source.toUpperCase(),
        title: a.title || '',
        date: a.seendate ? a.seendate.substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '',
        type: 'PRESS_RELEASE',
        url: a.url || '',
        source
      }));

      return { source, data: { actions, total: actions.length } };
    } catch {
      return { source, data: { actions: [], total: 0 } };
    }
  }

  // ============================================
  // HTML PARSING HELPER
  // ============================================

  parseEnforcementHTML(html, agency, source) {
    const actions = [];
    // Generic extraction: look for table rows or list items containing enforcement data
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    while ((match = rowRegex.exec(html)) !== null) {
      const cells = [];
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(match[1])) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
      }
      if (cells.length >= 2 && cells.some(c => c.length > 3)) {
        actions.push({
          agency,
          title: cells[0] || '',
          date: cells[1] || '',
          type: 'ENFORCEMENT_ACTION',
          detail: cells.slice(2).join(' | '),
          source
        });
      }
    }
    return actions.slice(0, 20);
  }

  // ============================================
  // RISK SCORING
  // ============================================

  calculateRisk(actions) {
    if (actions.length === 0) return { score: 0, level: 'LOW', flags: [] };

    let score = 0;
    const flags = [];

    // Criminal actions
    const criminal = actions.filter(a => ['INDICTMENT', 'CRIMINAL_CONVICTION', 'CRIMINAL_CHARGE'].includes(a.type));
    if (criminal.length > 0) {
      score += 50;
      flags.push({ severity: 'CRITICAL', type: 'CRIMINAL_ACTION', message: `${criminal.length} criminal action(s) found` });
    }

    // Sanctions/warnings
    const warnings = actions.filter(a => ['SANCTIONS', 'FCA_WARNING', 'REGULATORY_WARNING', 'BAN', 'LICENCE_CANCELLATION', 'INVESTIGATION'].includes(a.type));
    if (warnings.length > 0) {
      score += 30;
      flags.push({ severity: 'HIGH', type: 'REGULATORY_WARNING', message: `${warnings.length} regulatory warning(s)/sanctions` });
    }

    // Settlements/fines
    const settlements = actions.filter(a => ['SETTLEMENT', 'FORFEITURE', 'PENALTY'].includes(a.type));
    if (settlements.length > 0) {
      score += 20;
      flags.push({ severity: 'MEDIUM', type: 'SETTLEMENT', message: `${settlements.length} settlement(s)/forfeiture(s)` });
    }

    // Multiple agencies
    const agencies = new Set(actions.map(a => a.agency));
    if (agencies.size >= 3) {
      score += 15;
      flags.push({ severity: 'HIGH', type: 'MULTI_AGENCY', message: `Enforcement actions from ${agencies.size} agencies: ${[...agencies].join(', ')}` });
    }

    // Volume of actions
    if (actions.length >= 5) {
      score += 10;
      flags.push({ severity: 'MEDIUM', type: 'HIGH_ACTION_VOLUME', message: `${actions.length} total enforcement actions` });
    }

    return {
      score: Math.min(score, 100),
      level: score >= 70 ? 'CRITICAL' : score >= 40 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW',
      flags: flags.sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[a.severity] - ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[b.severity])
    };
  }
}

module.exports = { RegulatoryEnforcementService };
