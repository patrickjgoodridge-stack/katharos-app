// CourtRecordsService — Federal court records via CourtListener
// Strategy: Search API (type=r, type=o) for discovery, Case Law API for enrichment

class CourtRecordsService {
  constructor() {
    this.baseUrl = 'https://www.courtlistener.com/api/rest/v4';
    this.token = process.env.COURTLISTENER_API_KEY || null;
    this.cache = new Map();
  }

  async headers() {
    return { 'Authorization': `Token ${this.token}` };
  }

  // ============================================
  // MAIN ENTRY POINT
  // ============================================

  async screenEntity(entity) {
    const { name, type } = entity;

    if (!this.token) {
      return {
        entity: { name, type },
        summary: { totalCases: 0, asDefendant: 0, asPlaintiff: 0, criminalCases: 0, civilCases: 0, caselawMentions: 0, riskScore: 0 },
        cases: [], caselaw: [], riskFlags: [], sourcesSearched: [],
        error: 'COURTLISTENER_API_KEY not configured',
        searchedAt: new Date().toISOString()
      };
    }

    // 1. Search API: Find dockets and opinions in parallel
    const [docketResults, caselawResults] = await Promise.all([
      this.searchDockets(name),
      this.searchCaselaw(name)
    ]);

    // 2. Process search results
    const cases = this.processDockets(docketResults, name);
    const caselaw = this.processCaselaw(caselawResults, name);

    // 3. Enrich high-risk caselaw with full opinion text via Case Law API
    const enrichedCaselaw = await this.enrichHighRiskCaselaw(caselaw, name);

    // 4. Calculate risk
    const riskAssessment = this.calculateRiskScore(cases, enrichedCaselaw);

    return {
      entity: { name, type },
      summary: {
        totalCases: cases.length,
        asDefendant: cases.filter(c => c.partyRole === 'defendant').length,
        asPlaintiff: cases.filter(c => c.partyRole === 'plaintiff').length,
        criminalCases: cases.filter(c => c.caseType === 'criminal').length,
        civilCases: cases.filter(c => c.caseType === 'civil').length,
        caselawMentions: enrichedCaselaw.length,
        riskScore: riskAssessment.score
      },
      cases: cases.sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        if ((order[a.riskSeverity] || 3) !== (order[b.riskSeverity] || 3)) {
          return (order[a.riskSeverity] || 3) - (order[b.riskSeverity] || 3);
        }
        return new Date(b.dateFiled || 0) - new Date(a.dateFiled || 0);
      }),
      caselaw: enrichedCaselaw.slice(0, 15),
      riskFlags: riskAssessment.flags,
      sourcesSearched: ['courtlistener'],
      searchedAt: new Date().toISOString()
    };
  }

  // ============================================
  // SEARCH API: DISCOVERY
  // ============================================

  async searchDockets(name) {
    const cacheKey = `search:dockets:${name}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const queries = [
      `party:"${name}"`,
      `caseName:"${name}"`,
      `party:"${name}" AND (fraud OR sanctions OR "money laundering" OR indictment)`
    ];

    const allResults = [];

    for (const q of queries) {
      try {
        const url = `${this.baseUrl}/search/?` + new URLSearchParams({
          q, type: 'r', order_by: 'dateFiled desc'
        });
        const response = await fetch(url, {
          headers: await this.headers(),
          signal: AbortSignal.timeout(15000)
        });
        if (response.ok) {
          const data = await response.json();
          allResults.push(...(data.results || []));
        }
        await this.delay(200);
      } catch (e) {
        console.error('Docket search error:', e);
      }
    }

    const unique = this.deduplicateBy(allResults, 'docket_id');
    this.cache.set(cacheKey, unique);
    return unique;
  }

  async searchCaselaw(name) {
    const cacheKey = `search:caselaw:${name}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const queries = [
      `"${name}"`,
      `caseName:"${name}"`,
      `"${name}" AND (convicted OR guilty OR fraud OR sanction OR sentenced)`
    ];

    const allResults = [];

    for (const q of queries) {
      try {
        const url = `${this.baseUrl}/search/?` + new URLSearchParams({
          q, type: 'o', order_by: 'score desc', highlight: 'on',
          stat_Published: 'on', stat_Unpublished: 'on'
        });
        const response = await fetch(url, {
          headers: await this.headers(),
          signal: AbortSignal.timeout(15000)
        });
        if (response.ok) {
          const data = await response.json();
          allResults.push(...(data.results || []));
        }
        await this.delay(200);
      } catch (e) {
        console.error('Caselaw search error:', e);
      }
    }

    const unique = this.deduplicateBy(allResults, 'cluster_id');
    this.cache.set(cacheKey, unique);
    return unique;
  }

  // ============================================
  // CASE LAW API: ENRICHMENT
  // ============================================

  async getCluster(clusterId) {
    const cacheKey = `cluster:${clusterId}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    try {
      const response = await fetch(`${this.baseUrl}/clusters/${clusterId}/`, {
        headers: await this.headers(),
        signal: AbortSignal.timeout(10000)
      });
      if (response.ok) {
        const cluster = await response.json();
        this.cache.set(cacheKey, cluster);
        return cluster;
      }
    } catch (e) {
      console.error(`Failed to get cluster ${clusterId}:`, e);
    }
    return null;
  }

  async getOpinion(opinionId) {
    const cacheKey = `opinion:${opinionId}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    try {
      const url = `${this.baseUrl}/opinions/${opinionId}/?fields=id,type,author_str,html_with_citations,plain_text`;
      const response = await fetch(url, {
        headers: await this.headers(),
        signal: AbortSignal.timeout(10000)
      });
      if (response.ok) {
        const opinion = await response.json();
        this.cache.set(cacheKey, opinion);
        return opinion;
      }
    } catch (e) {
      console.error(`Failed to get opinion ${opinionId}:`, e);
    }
    return null;
  }

  async enrichHighRiskCaselaw(caselaw, entityName) {
    const enriched = [];

    for (const item of caselaw.slice(0, 10)) {
      const cluster = await this.getCluster(item.clusterId);

      if (!cluster) {
        enriched.push(item);
        continue;
      }

      let opinionExcerpt = null;

      if (cluster.sub_opinions?.length > 0) {
        const opinionUrl = cluster.sub_opinions[0];
        const opinionId = typeof opinionUrl === 'string'
          ? opinionUrl.match(/opinions\/(\d+)/)?.[1]
          : opinionUrl;

        if (opinionId) {
          const opinion = await this.getOpinion(opinionId);
          if (opinion) {
            const opinionText = opinion.html_with_citations || opinion.plain_text;
            opinionExcerpt = this.extractExcerpt(opinionText, entityName);
          }
        }
      }

      const contextAnalysis = this.analyzeOpinionContext(opinionExcerpt || item.snippet, entityName.toLowerCase());

      enriched.push({
        ...item,
        opinionExcerpt,
        contextAnalysis,
        cluster: {
          judges: cluster.judges || null,
          panel: cluster.panel || null,
          proceduralHistory: cluster.procedural_history || null,
          posture: cluster.posture || null,
          syllabus: cluster.syllabus || null
        }
      });

      await this.delay(200);
    }

    return enriched;
  }

  // ============================================
  // DATA PROCESSING
  // ============================================

  processDockets(results, entityName) {
    const nameLower = entityName.toLowerCase();

    return results.slice(0, 25).map(r => {
      const partyRole = this.determinePartyRole(r.caseName || r.case_name, nameLower);
      const docketNumber = r.docketNumber || r.docket_number || '';
      const suitNature = r.suitNature || r.nature_of_suit || '';
      const caseType = this.determineCaseType(docketNumber, suitNature);
      const riskSeverity = this.determineRiskSeverity(r, partyRole, caseType);

      return {
        id: r.docket_id || r.id,
        caseNumber: docketNumber,
        caseName: r.caseName || r.case_name || '',
        court: r.court || this.getCourtName(r.court_id),
        courtId: r.court_id,
        caseType,
        partyRole,
        dateFiled: r.dateFiled || r.date_filed,
        dateTerminated: r.dateTerminated || r.date_terminated,
        status: (r.dateTerminated || r.date_terminated) ? 'closed' : 'open',
        suitNature,
        cause: r.cause,
        judge: r.assigned_to_str || r.assigned_to || r.judge,
        url: r.absolute_url ? `https://www.courtlistener.com${r.absolute_url}` : `https://www.courtlistener.com/docket/${r.docket_id || r.id}/`,
        riskSeverity,
        snippet: this.stripHtml(r.snippet || ''),
        documents: (r.recap_documents || []).slice(0, 3).map(doc => ({
          description: doc.description || doc.short_description || '',
          dateFiled: doc.dateFiled || doc.date_filed || ''
        })),
        hasMoreDocs: r.more_docs || false
      };
    });
  }

  processCaselaw(results, entityName) {
    return results.slice(0, 15).map(r => ({
      clusterId: r.cluster_id || r.id,
      docketId: r.docket_id,
      caseName: r.caseName || r.case_name || '',
      caseNameFull: r.caseNameFull || r.case_name_full || '',
      court: r.court || this.getCourtName(r.court_id),
      courtId: r.court_id,
      dateFiled: r.dateFiled || r.date_filed,
      citations: r.citation || [],
      docketNumber: r.docketNumber || r.docket_number || '',
      status: r.status || '',
      judge: r.judge,
      url: r.absolute_url ? `https://www.courtlistener.com${r.absolute_url}` : '',
      snippet: this.stripHtml(r.opinions?.[0]?.snippet || r.snippet || ''),
      relevanceScore: r.score || 0
    }));
  }

  // ============================================
  // CONTEXT ANALYSIS
  // ============================================

  extractExcerpt(text, entityName, contextChars = 500) {
    if (!text) return null;
    const plainText = this.stripHtml(text);
    const index = plainText.toLowerCase().indexOf(entityName.toLowerCase());
    if (index === -1) return plainText.slice(0, contextChars * 2);

    const start = Math.max(0, index - contextChars);
    const end = Math.min(plainText.length, index + entityName.length + contextChars);
    let excerpt = plainText.slice(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < plainText.length) excerpt = excerpt + '...';
    return excerpt;
  }

  analyzeOpinionContext(text, entityNameLower) {
    if (!text) return { role: 'unknown', indicators: [] };
    const t = text.toLowerCase();
    const indicators = [];

    if (t.includes('defendant ' + entityNameLower) || t.includes(entityNameLower + ', defendant')) indicators.push('named_defendant');
    if (t.includes('convicted') || t.includes('guilty')) indicators.push('conviction_mentioned');
    if (t.includes('sentenced') || t.includes('imprisonment')) indicators.push('sentencing_mentioned');
    if (t.includes('indictment') || t.includes('indicted')) indicators.push('indictment_mentioned');
    if (t.includes('plaintiff ' + entityNameLower)) indicators.push('named_plaintiff');
    if (t.includes('judgment against ' + entityNameLower)) indicators.push('judgment_against');
    if (t.includes('liable') || t.includes('liability')) indicators.push('liability_mentioned');
    if (t.includes('fraud') || t.includes('fraudulent')) indicators.push('fraud_mentioned');
    if (t.includes('money laundering')) indicators.push('money_laundering_mentioned');
    if (t.includes('securities') && t.includes('violation')) indicators.push('securities_violation');
    if (t.includes('sanction') || t.includes('ofac')) indicators.push('sanctions_mentioned');

    let role = 'mentioned';
    if (indicators.includes('named_defendant')) role = 'defendant';
    else if (indicators.includes('named_plaintiff')) role = 'plaintiff';
    else if (indicators.includes('conviction_mentioned')) role = 'convicted';

    return { role, indicators };
  }

  // ============================================
  // CLASSIFICATION HELPERS
  // ============================================

  determinePartyRole(caseName, nameLower) {
    const cn = (caseName || '').toLowerCase();

    if (cn.includes(' v. ') || cn.includes(' vs. ') || cn.includes(' v ')) {
      const parts = cn.split(/ vs?\.? /i);
      if (parts.length >= 2) {
        if (parts[1].includes(nameLower)) return 'defendant';
        if (parts[0].includes(nameLower)) return 'plaintiff';
      }
    }

    if (cn.startsWith('united states v') || cn.startsWith('sec v') ||
        cn.startsWith('securities and exchange') || cn.startsWith('federal trade commission') ||
        cn.startsWith('commodity futures trading') || cn.startsWith('people of the state')) {
      if (cn.includes(nameLower)) return 'defendant';
    }

    return 'unknown';
  }

  determineCaseType(docketNumber, suitNature) {
    const num = (docketNumber || '').toLowerCase();
    const nature = (suitNature || '').toLowerCase();
    if (num.includes('-cr-') || num.includes('-mj-')) return 'criminal';
    if (num.includes('-bk-') || num.includes('-br-')) return 'bankruptcy';
    if (num.includes('-cv-') || num.includes('-mc-')) return 'civil';
    if (num.includes('-ap-')) return 'appellate';
    if (nature.includes('criminal')) return 'criminal';
    if (nature.includes('bankruptcy')) return 'bankruptcy';
    return 'civil';
  }

  determineRiskSeverity(docket, partyRole, caseType) {
    const caseName = (docket.caseName || docket.case_name || '').toLowerCase();
    const nature = (docket.suitNature || docket.nature_of_suit || '').toLowerCase();

    if (caseType === 'criminal' && partyRole === 'defendant') return 'critical';
    if (partyRole === 'defendant') {
      if (caseName.startsWith('united states v')) return 'high';
      if (caseName.includes('securities and exchange')) return 'high';
      if (caseName.includes('federal trade commission')) return 'high';
      if (caseName.includes('commodity futures trading')) return 'high';
      if (nature.includes('fraud') || nature.includes('rico') || nature.includes('racketeering')) return 'high';
    }
    if (partyRole === 'defendant' && caseType === 'civil') return 'medium';
    if (partyRole === 'plaintiff') return 'low';
    if (caseType === 'bankruptcy') return 'low';
    return 'low';
  }

  getCourtName(courtId) {
    const courts = {
      'nysd': 'S.D.N.Y.', 'nyed': 'E.D.N.Y.', 'nynd': 'N.D.N.Y.', 'nywd': 'W.D.N.Y.',
      'cacd': 'C.D. Cal.', 'cand': 'N.D. Cal.', 'casd': 'S.D. Cal.', 'caed': 'E.D. Cal.',
      'dcd': 'D.D.C.', 'ilnd': 'N.D. Ill.', 'ilsd': 'S.D. Ill.',
      'txsd': 'S.D. Tex.', 'txnd': 'N.D. Tex.', 'txed': 'E.D. Tex.', 'txwd': 'W.D. Tex.',
      'mad': 'D. Mass.', 'flsd': 'S.D. Fla.', 'flmd': 'M.D. Fla.', 'flnd': 'N.D. Fla.',
      'njd': 'D.N.J.', 'paed': 'E.D. Pa.', 'pawd': 'W.D. Pa.', 'ded': 'D. Del.',
      'vaed': 'E.D. Va.', 'vawd': 'W.D. Va.', 'gand': 'N.D. Ga.', 'gamd': 'M.D. Ga.',
      'mdd': 'D. Md.', 'cod': 'D. Colo.', 'azd': 'D. Ariz.', 'nvd': 'D. Nev.',
      'wad': 'W.D. Wash.', 'waed': 'E.D. Wash.', 'ord': 'D. Or.',
      'ohnd': 'N.D. Ohio', 'ohsd': 'S.D. Ohio', 'mied': 'E.D. Mich.', 'miwd': 'W.D. Mich.',
      'mnd': 'D. Minn.', 'mowd': 'W.D. Mo.', 'moed': 'E.D. Mo.',
      'ca1': '1st Cir.', 'ca2': '2nd Cir.', 'ca3': '3rd Cir.', 'ca4': '4th Cir.',
      'ca5': '5th Cir.', 'ca6': '6th Cir.', 'ca7': '7th Cir.', 'ca8': '8th Cir.',
      'ca9': '9th Cir.', 'ca10': '10th Cir.', 'ca11': '11th Cir.',
      'cadc': 'D.C. Cir.', 'cafc': 'Fed. Cir.', 'scotus': 'Supreme Court'
    };
    return courts[courtId] || courtId?.toUpperCase() || 'Unknown';
  }

  // ============================================
  // RISK SCORING
  // ============================================

  calculateRiskScore(cases, caselaw) {
    let score = 0;
    const flags = [];
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const c of cases) {
      if (c.riskSeverity) severityCounts[c.riskSeverity]++;
    }

    if (severityCounts.critical > 0) {
      score += 40 + (severityCounts.critical - 1) * 15;
      flags.push({
        severity: 'CRITICAL', type: 'CRIMINAL_DEFENDANT',
        message: `Defendant in ${severityCounts.critical} federal criminal case(s)`,
        cases: cases.filter(c => c.riskSeverity === 'critical').map(c => ({
          caseName: c.caseName, court: c.court, dateFiled: c.dateFiled, status: c.status
        }))
      });
    }

    if (severityCounts.high > 0) {
      score += 20 + (severityCounts.high - 1) * 10;
      flags.push({
        severity: 'HIGH', type: 'GOVERNMENT_ENFORCEMENT',
        message: `Defendant in ${severityCounts.high} government enforcement case(s)`,
        cases: cases.filter(c => c.riskSeverity === 'high').map(c => ({
          caseName: c.caseName, court: c.court, dateFiled: c.dateFiled
        }))
      });
    }

    if (severityCounts.medium > 0) {
      score += 10 + (severityCounts.medium - 1) * 3;
      flags.push({
        severity: 'MEDIUM', type: 'CIVIL_DEFENDANT',
        message: `Defendant in ${severityCounts.medium} civil case(s)`
      });
    }

    const openCriminal = cases.filter(c => c.caseType === 'criminal' && c.status === 'open');
    if (openCriminal.length > 0) {
      score += 15;
      flags.push({ severity: 'HIGH', type: 'OPEN_CRIMINAL_CASE', message: `${openCriminal.length} open federal criminal case(s)` });
    }

    // Caselaw enrichment-based scoring
    const convictionMentions = caselaw.filter(c =>
      c.contextAnalysis?.indicators?.includes('conviction_mentioned') ||
      c.contextAnalysis?.role === 'convicted'
    );
    if (convictionMentions.length > 0) {
      score += 25;
      flags.push({
        severity: 'CRITICAL', type: 'CONVICTION_IN_CASELAW',
        message: `Conviction referenced in ${convictionMentions.length} court opinion(s)`,
        cases: convictionMentions.slice(0, 3).map(c => ({
          caseName: c.caseName, court: c.court, excerpt: c.opinionExcerpt?.slice(0, 200)
        }))
      });
    }

    const fraudMentions = caselaw.filter(c =>
      c.contextAnalysis?.indicators?.includes('fraud_mentioned') ||
      c.contextAnalysis?.indicators?.includes('money_laundering_mentioned')
    );
    if (fraudMentions.length > 0) {
      score += 15;
      flags.push({
        severity: 'HIGH', type: 'FRAUD_IN_CASELAW',
        message: `Fraud/financial crime mentioned in ${fraudMentions.length} court opinion(s)`
      });
    }

    const judgmentAgainst = caselaw.filter(c =>
      c.contextAnalysis?.indicators?.includes('judgment_against') ||
      c.contextAnalysis?.indicators?.includes('liability_mentioned')
    );
    if (judgmentAgainst.length > 0) {
      score += 10;
      flags.push({
        severity: 'MEDIUM', type: 'ADVERSE_JUDGMENT',
        message: `Judgment/liability found in ${judgmentAgainst.length} court opinion(s)`
      });
    }

    return {
      score: Math.min(score, 100),
      flags,
      severityCounts,
      caselawAnalysis: {
        total: caselaw.length,
        withConviction: convictionMentions.length,
        withFraud: fraudMentions.length,
        withJudgment: judgmentAgainst.length
      }
    };
  }

  // ============================================
  // UTILITIES
  // ============================================

  deduplicateBy(array, key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key] || item.id;
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  stripHtml(text) {
    return (text || '').replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { CourtRecordsService };
