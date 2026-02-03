// Financial Regulatory Registration Sources — Layer 8
// Free public APIs: FINRA BrokerCheck, SEC IAPD, NFA BASIC, FDIC BankFind, NCUA, SEC EDGAR

class FinancialRegistrationsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour
  }

  _cached(key) {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.ts < this.cacheTimeout) return entry.data;
    return null;
  }

  _setCache(key, data) {
    this.cache.set(key, { data, ts: Date.now() });
    return data;
  }

  // ============================================
  // FINRA BrokerCheck — Individual broker disclosures
  // ============================================

  async checkBrokerCheck(name) {
    const cacheKey = `brokercheck:${name}`;
    const cached = this._cached(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://api.brokercheck.finra.org/search/individual?query=${encodeURIComponent(name)}&filter=active=true,prev=true`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) return this._setCache(cacheKey, { matches: [], error: null });

      const data = await response.json();
      const hits = data.hits?.hits || [];

      const matches = hits.slice(0, 5).map(hit => {
        const s = hit._source || {};
        return {
          name: `${s.ind_firstname || ''} ${s.ind_lastname || ''}`.trim(),
          crdNumber: s.ind_source_id,
          currentEmployments: s.ind_current_employments || [],
          previousEmployments: s.ind_previous_employments || [],
          disclosureCount: s.ind_num_disclosures || 0,
          disclosures: s.ind_disclosures || [],
          registrationStatus: s.ind_ia_reg_status || s.ind_bd_reg_status || 'Unknown',
          isBarred: s.ind_barred === 'Y',
          score: hit._score || 0
        };
      });

      return this._setCache(cacheKey, { matches, error: null });
    } catch (e) {
      return this._setCache(cacheKey, { matches: [], error: e.message });
    }
  }

  // ============================================
  // SEC IAPD — Investment Adviser Public Disclosure
  // ============================================

  async checkSECAdviser(name) {
    const cacheKey = `sec-iapd:${name}`;
    const cached = this._cached(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://api.adviserinfo.sec.gov/IAPD/Content/Search/api/Person/Search?SearchValue=${encodeURIComponent(name)}&SearchType=Name`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) return this._setCache(cacheKey, { matches: [], error: null });

      const data = await response.json();
      const matches = (data.Results || []).slice(0, 5).map(r => ({
        name: `${r.FirstName || ''} ${r.LastName || ''}`.trim(),
        crdNumber: r.IndividualPK,
        currentEmployments: r.CurrentEmployments || [],
        hasDisclosure: !!r.HasDisclosure,
        active: !!r.Active,
        registrationStatus: r.Active ? 'Active' : 'Inactive'
      }));

      return this._setCache(cacheKey, { matches, error: null });
    } catch (e) {
      return this._setCache(cacheKey, { matches: [], error: e.message });
    }
  }

  async checkSECAdviserFirm(name) {
    const cacheKey = `sec-iapd-firm:${name}`;
    const cached = this._cached(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://api.adviserinfo.sec.gov/IAPD/Content/Search/api/Firm/Search?SearchValue=${encodeURIComponent(name)}&SearchType=Name`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) return this._setCache(cacheKey, { matches: [], error: null });

      const data = await response.json();
      const matches = (data.Results || []).slice(0, 5).map(r => ({
        firmName: r.FirmName || '',
        crdNumber: r.FirmPK,
        secNumber: r.SECNumber || '',
        active: !!r.Active,
        hasDisclosure: !!r.HasDisclosure,
        totalAssets: r.TotalAssets || null
      }));

      return this._setCache(cacheKey, { matches, error: null });
    } catch (e) {
      return this._setCache(cacheKey, { matches: [], error: e.message });
    }
  }

  // ============================================
  // NFA BASIC — National Futures Association
  // ============================================

  async checkNFABasic(name) {
    const cacheKey = `nfa:${name}`;
    const cached = this._cached(cacheKey);
    if (cached) return cached;

    try {
      // NFA BASIC search via their website
      const url = `https://www.nfa.futures.org/basicnet/Details.aspx?entityType=firm&entityName=${encodeURIComponent(name)}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Marlowe Compliance App/1.0', 'Accept': 'text/html' }
      });
      if (!response.ok) return this._setCache(cacheKey, { found: false, actions: [], error: null });

      const html = await response.text();
      const actions = [];

      // Parse for enforcement/regulatory actions mentions
      const actionPatterns = [
        { regex: /expul/gi, type: 'Expulsion' },
        { regex: /suspend/gi, type: 'Suspension' },
        { regex: /fine[ds]?\b/gi, type: 'Fine' },
        { regex: /revok/gi, type: 'Revocation' },
        { regex: /withdraw/gi, type: 'Withdrawal' }
      ];

      const lowerHtml = html.toLowerCase();
      const nameFirst = name.toLowerCase().split(/\s+/)[0];
      const found = lowerHtml.includes(nameFirst);

      if (found) {
        for (const { regex, type } of actionPatterns) {
          if (regex.test(html)) {
            actions.push({ type, source: 'NFA BASIC' });
          }
        }
      }

      return this._setCache(cacheKey, { found, actions, error: null });
    } catch (e) {
      return this._setCache(cacheKey, { found: false, actions: [], error: e.message });
    }
  }

  // ============================================
  // FDIC BankFind — Bank status and failures
  // ============================================

  async checkFDICBank(name) {
    const cacheKey = `fdic:${name}`;
    const cached = this._cached(cacheKey);
    if (cached) return cached;

    try {
      // Search for institution
      const searchUrl = `https://banks.data.fdic.gov/api/financials?filters=REPNM:${encodeURIComponent(`"${name}"`)}&limit=5&sort_by=REPDTE&sort_order=DESC`;
      const [bankRes, failRes] = await Promise.all([
        fetch(searchUrl, { signal: AbortSignal.timeout(10000), headers: { 'Accept': 'application/json' } }).catch(() => null),
        fetch(`https://banks.data.fdic.gov/api/failures?filters=INSTNAME:${encodeURIComponent(`"${name}"`)}&limit=5`, {
          signal: AbortSignal.timeout(10000), headers: { 'Accept': 'application/json' }
        }).catch(() => null)
      ]);

      const banks = [];
      if (bankRes?.ok) {
        const bankData = await bankRes.json();
        for (const b of (bankData.data || []).slice(0, 3)) {
          banks.push({
            name: b.data?.REPNM || name,
            certNumber: b.data?.CERT,
            city: b.data?.CITY,
            state: b.data?.STALP,
            active: b.data?.ACTIVE !== 0,
            totalAssets: b.data?.ASSET,
            totalDeposits: b.data?.DEP,
            bankClass: b.data?.BKCLASS
          });
        }
      }

      const failures = [];
      if (failRes?.ok) {
        const failData = await failRes.json();
        for (const f of (failData.data || []).slice(0, 3)) {
          failures.push({
            name: f.data?.INSTNAME || name,
            failDate: f.data?.FAILDATE,
            totalDeposits: f.data?.TOTALDEPOSITS,
            acquirer: f.data?.ACQUIRER
          });
        }
      }

      return this._setCache(cacheKey, { banks, failures, hasFailed: failures.length > 0, error: null });
    } catch (e) {
      return this._setCache(cacheKey, { banks: [], failures: [], hasFailed: false, error: e.message });
    }
  }

  // ============================================
  // NCUA — Credit Union Locator
  // ============================================

  async checkNCUA(name) {
    const cacheKey = `ncua:${name}`;
    const cached = this._cached(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://mapping.ncua.gov/api/NCUAMapping/SearchCreditUnions?Name=${encodeURIComponent(name)}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) return this._setCache(cacheKey, { matches: [], error: null });

      const data = await response.json();
      const matches = (Array.isArray(data) ? data : []).slice(0, 5).map(cu => ({
        name: cu.CU_NAME || '',
        charterNumber: cu.CU_NUMBER,
        state: cu.STATE,
        active: cu.CU_STATUS_NAME === 'Active',
        totalAssets: cu.TOTAL_ASSETS,
        memberCount: cu.MEMBERS
      }));

      return this._setCache(cacheKey, { matches, error: null });
    } catch (e) {
      return this._setCache(cacheKey, { matches: [], error: e.message });
    }
  }

  // ============================================
  // SEC EDGAR — Litigation releases & filings
  // ============================================

  async checkSECEdgar(name) {
    const cacheKey = `edgar:${name}`;
    const cached = this._cached(cacheKey);
    if (cached) return cached;

    try {
      // Search for litigation releases and AAERs
      const litUrl = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(name)}%22&forms=LIT-REL,AAER&dateRange=custom&startdt=2015-01-01`;
      const response = await fetch(litUrl, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Marlowe/1.0 (compliance-screening)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) return this._setCache(cacheKey, { litigationReleases: [], totalLitigation: 0, error: null });

      const data = await response.json();
      const hits = data.hits?.hits || [];
      const litigationReleases = hits.slice(0, 10).map(h => ({
        title: h._source?.file_description || h._source?.display_names?.[0] || '',
        date: h._source?.file_date || '',
        form: h._source?.form_type || '',
        url: h._source?.file_url ? `https://www.sec.gov${h._source.file_url}` : ''
      }));

      return this._setCache(cacheKey, {
        litigationReleases,
        totalLitigation: data.hits?.total?.value || 0,
        error: null
      });
    } catch (e) {
      return this._setCache(cacheKey, { litigationReleases: [], totalLitigation: 0, error: e.message });
    }
  }

  // ============================================
  // GDELT fallback for OCC / Federal Reserve
  // ============================================

  async _gdeltEnforcementSearch(name, domain, source) {
    try {
      const query = encodeURIComponent(`"${name}" enforcement OR penalty OR fine OR action domain:${domain}`);
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=10&format=json&timespan=5y`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return { actions: [], total: 0 };
      const data = await response.json();

      const actions = (data.articles || []).map(a => ({
        title: a.title || '',
        date: a.seendate ? a.seendate.substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '',
        url: a.url || '',
        source
      }));

      return { actions, total: actions.length };
    } catch {
      return { actions: [], total: 0 };
    }
  }

  async checkOCCEnforcement(name) {
    const cacheKey = `occ:${name}`;
    const cached = this._cached(cacheKey);
    if (cached) return cached;

    const result = await this._gdeltEnforcementSearch(name, 'occ.gov', 'OCC');
    return this._setCache(cacheKey, result);
  }

  async checkFedEnforcement(name) {
    const cacheKey = `fed-enforcement:${name}`;
    const cached = this._cached(cacheKey);
    if (cached) return cached;

    const result = await this._gdeltEnforcementSearch(name, 'federalreserve.gov', 'Federal Reserve');
    return this._setCache(cacheKey, result);
  }

  // ============================================
  // Main screening entry point
  // ============================================

  async screenEntity({ name, type = 'auto' }) {
    if (!name) return { sources: {}, riskAssessment: { score: 0, level: 'LOW', flags: [] }, sourcesChecked: [] };

    const isIndividual = type === 'individual' || type === 'auto';
    const isEntity = type === 'entity' || type === 'company' || type === 'institution' || type === 'auto';

    const promises = [];
    const labels = [];

    // Individual sources
    if (isIndividual) {
      promises.push(this.checkBrokerCheck(name));
      labels.push('brokerCheck');
      promises.push(this.checkSECAdviser(name));
      labels.push('secAdviser');
      promises.push(this.checkNFABasic(name));
      labels.push('nfa');
    }

    // Entity sources
    if (isEntity) {
      promises.push(this.checkSECAdviserFirm(name));
      labels.push('secAdviserFirm');
      promises.push(this.checkFDICBank(name));
      labels.push('fdic');
      promises.push(this.checkNCUA(name));
      labels.push('ncua');
      promises.push(this.checkOCCEnforcement(name));
      labels.push('occ');
      promises.push(this.checkFedEnforcement(name));
      labels.push('fed');
    }

    // Both
    promises.push(this.checkSECEdgar(name));
    labels.push('secEdgar');

    const results = await Promise.all(promises.map(p => p.catch(e => ({ error: e.message }))));

    const sources = {};
    for (let i = 0; i < labels.length; i++) {
      sources[labels[i]] = results[i];
    }

    const riskAssessment = this.calculateRisk(sources, isIndividual, isEntity);

    const sourcesChecked = [];
    if (sources.brokerCheck) sourcesChecked.push('FINRA BrokerCheck');
    if (sources.secAdviser) sourcesChecked.push('SEC IAPD');
    if (sources.secAdviserFirm) sourcesChecked.push('SEC IAPD Firm');
    if (sources.nfa) sourcesChecked.push('NFA BASIC');
    if (sources.fdic) sourcesChecked.push('FDIC BankFind');
    if (sources.ncua) sourcesChecked.push('NCUA');
    if (sources.occ) sourcesChecked.push('OCC Enforcement');
    if (sources.fed) sourcesChecked.push('Federal Reserve Enforcement');
    if (sources.secEdgar) sourcesChecked.push('SEC EDGAR');

    return { sources, riskAssessment, sourcesChecked };
  }

  // ============================================
  // Risk calculation
  // ============================================

  calculateRisk(sources, isIndividual, isEntity) {
    let score = 0;
    const flags = [];

    // FINRA BrokerCheck
    if (sources.brokerCheck?.matches?.length > 0) {
      const top = sources.brokerCheck.matches[0];
      if (top.isBarred) {
        score += 60;
        flags.push({ severity: 'CRITICAL', type: 'FINRA_BARRED', message: `BARRED by FINRA: ${top.name} (CRD #${top.crdNumber})` });
      }
      if (top.disclosureCount > 0) {
        const discScore = Math.min(top.disclosureCount * 10, 40);
        score += discScore;
        flags.push({ severity: top.disclosureCount >= 3 ? 'HIGH' : 'MEDIUM', type: 'FINRA_DISCLOSURES', message: `${top.disclosureCount} FINRA disclosure(s) for ${top.name} (CRD #${top.crdNumber})` });
      }
      if (top.disclosureCount >= 3) {
        score += 25;
        flags.push({ severity: 'HIGH', type: 'FINRA_PATTERN', message: `Pattern indicator: ${top.disclosureCount} disclosures on FINRA BrokerCheck` });
      }
    }

    // SEC IAPD — Individual
    if (sources.secAdviser?.matches?.length > 0) {
      const top = sources.secAdviser.matches[0];
      if (top.hasDisclosure) {
        score += 25;
        flags.push({ severity: 'MEDIUM', type: 'SEC_IAPD_DISCLOSURE', message: `SEC adviser disclosure on record: ${top.name} (CRD #${top.crdNumber})` });
      }
    }

    // SEC IAPD — Firm
    if (sources.secAdviserFirm?.matches?.length > 0) {
      const top = sources.secAdviserFirm.matches[0];
      if (top.hasDisclosure) {
        score += 25;
        flags.push({ severity: 'MEDIUM', type: 'SEC_IAPD_FIRM_DISCLOSURE', message: `SEC adviser firm disclosure: ${top.firmName} (CRD #${top.crdNumber})` });
      }
    }

    // NFA BASIC
    if (sources.nfa?.actions?.length > 0) {
      for (const action of sources.nfa.actions) {
        if (action.type === 'Expulsion') {
          score += 60;
          flags.push({ severity: 'CRITICAL', type: 'NFA_EXPULSION', message: 'NFA expulsion on record' });
        } else if (action.type === 'Suspension') {
          score += 40;
          flags.push({ severity: 'HIGH', type: 'NFA_SUSPENSION', message: 'NFA suspension on record' });
        } else if (action.type === 'Fine' || action.type === 'Revocation') {
          score += 30;
          flags.push({ severity: 'HIGH', type: `NFA_${action.type.toUpperCase()}`, message: `NFA ${action.type.toLowerCase()} on record` });
        }
      }
    }

    // FDIC
    if (sources.fdic) {
      if (sources.fdic.hasFailed) {
        score += 50;
        const fail = sources.fdic.failures[0];
        flags.push({ severity: 'CRITICAL', type: 'FDIC_BANK_FAILED', message: `Bank failed: ${fail?.name || 'Unknown'} (${fail?.failDate || 'date unknown'})` });
      }
      if (sources.fdic.banks?.length > 0 && !sources.fdic.banks[0].active) {
        score += 15;
        flags.push({ severity: 'MEDIUM', type: 'FDIC_INACTIVE', message: 'FDIC-insured institution no longer active' });
      }
    }

    // NCUA
    if (sources.ncua?.matches?.length > 0) {
      const top = sources.ncua.matches[0];
      if (!top.active) {
        score += 20;
        flags.push({ severity: 'MEDIUM', type: 'NCUA_INACTIVE', message: `Credit union no longer active: ${top.name}` });
      }
    }

    // OCC Enforcement (GDELT)
    if (sources.occ?.actions?.length > 0) {
      score += Math.min(sources.occ.actions.length * 15, 40);
      flags.push({ severity: 'HIGH', type: 'OCC_ENFORCEMENT', message: `${sources.occ.actions.length} OCC enforcement mention(s) found` });
    }

    // Federal Reserve (GDELT)
    if (sources.fed?.actions?.length > 0) {
      score += Math.min(sources.fed.actions.length * 15, 40);
      flags.push({ severity: 'HIGH', type: 'FED_ENFORCEMENT', message: `${sources.fed.actions.length} Federal Reserve enforcement mention(s) found` });
    }

    // SEC EDGAR — Litigation releases
    if (sources.secEdgar?.totalLitigation > 0) {
      const litScore = Math.min(sources.secEdgar.totalLitigation * 20, 50);
      score += litScore;
      flags.push({ severity: sources.secEdgar.totalLitigation >= 3 ? 'CRITICAL' : 'HIGH', type: 'SEC_LITIGATION', message: `${sources.secEdgar.totalLitigation} SEC litigation release(s) / AAER(s) found` });
    }

    // Sort flags by severity
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    flags.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

    return {
      score: Math.min(score, 100),
      level: score >= 70 ? 'CRITICAL' : score >= 40 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW',
      flags
    };
  }
}

module.exports = { FinancialRegistrationsService };
