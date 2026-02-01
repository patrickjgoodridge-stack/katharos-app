// CourtRecordsService — Federal court records via CourtListener API (v4)
// Searches dockets, parties, and entries for compliance screening

class CourtRecordsService {
  constructor() {
    this.baseUrl = 'https://www.courtlistener.com/api/rest/v4';
    this.token = process.env.COURTLISTENER_API_KEY || null;
    this.cache = new Map();
  }

  // Main entry point
  async screenEntity(entity) {
    const { name, type } = entity;

    if (!this.token) {
      return {
        entity: { name, type },
        summary: { totalCases: 0, asDefendant: 0, asPlaintiff: 0, criminalCases: 0, civilCases: 0, riskScore: 0 },
        cases: [],
        riskFlags: [],
        sourcesSearched: [],
        error: 'COURTLISTENER_API_KEY not configured',
        searchedAt: new Date().toISOString()
      };
    }

    const dockets = await this.searchDockets(name);
    const casesWithDetails = await this.enrichCases(dockets, name);
    const riskAssessment = this.calculateRiskScore(casesWithDetails);

    return {
      entity: { name, type },
      summary: {
        totalCases: casesWithDetails.length,
        asDefendant: casesWithDetails.filter(c => c.partyRole === 'defendant').length,
        asPlaintiff: casesWithDetails.filter(c => c.partyRole === 'plaintiff').length,
        criminalCases: casesWithDetails.filter(c => c.caseType === 'criminal').length,
        civilCases: casesWithDetails.filter(c => c.caseType === 'civil').length,
        riskScore: riskAssessment.score
      },
      cases: casesWithDetails.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (severityOrder[a.riskSeverity] !== severityOrder[b.riskSeverity]) {
          return severityOrder[a.riskSeverity] - severityOrder[b.riskSeverity];
        }
        return new Date(b.dateFiled) - new Date(a.dateFiled);
      }),
      riskFlags: riskAssessment.flags,
      sourcesSearched: ['courtlistener'],
      searchedAt: new Date().toISOString()
    };
  }

  // Search for dockets using CourtListener Search API
  async searchDockets(name) {
    const cacheKey = `dockets:${name}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const searchUrl = `${this.baseUrl}/search/?q=party:"${encodeURIComponent(name)}"&type=r`;

    try {
      const response = await fetch(searchUrl, {
        headers: { 'Authorization': `Token ${this.token}` },
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        console.error('CourtListener search failed:', response.status);
        return [];
      }

      const data = await response.json();
      const dockets = data.results || [];

      this.cache.set(cacheKey, dockets);
      return dockets;
    } catch (e) {
      console.error('CourtListener search error:', e);
      return [];
    }
  }

  // Get docket details
  async getDocket(docketId) {
    const cacheKey = `docket:${docketId}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const response = await fetch(`${this.baseUrl}/dockets/${docketId}/`, {
        headers: { 'Authorization': `Token ${this.token}` },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) return null;

      const docket = await response.json();
      this.cache.set(cacheKey, docket);
      return docket;
    } catch (e) {
      console.error(`Failed to get docket ${docketId}:`, e);
      return null;
    }
  }

  // Get parties for a docket
  async getParties(docketId) {
    const cacheKey = `parties:${docketId}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const response = await fetch(
        `${this.baseUrl}/parties/?docket=${docketId}&filter_nested_results=True`,
        {
          headers: { 'Authorization': `Token ${this.token}` },
          signal: AbortSignal.timeout(10000)
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      const parties = data.results || [];

      this.cache.set(cacheKey, parties);
      return parties;
    } catch (e) {
      console.error(`Failed to get parties for docket ${docketId}:`, e);
      return [];
    }
  }

  // Get docket entries (limited)
  async getDocketEntries(docketId, limit = 5) {
    try {
      const response = await fetch(
        `${this.baseUrl}/docket-entries/?docket=${docketId}&order_by=-date_filed&page_size=${limit}`,
        {
          headers: { 'Authorization': `Token ${this.token}` },
          signal: AbortSignal.timeout(10000)
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return (data.results || []).map(entry => ({
        entryNumber: entry.entry_number,
        dateFiled: entry.date_filed,
        description: entry.description
      }));
    } catch (e) {
      console.error(`Failed to get entries for docket ${docketId}:`, e);
      return [];
    }
  }

  // Enrich cases with party role and details
  async enrichCases(dockets, entityName) {
    const enriched = [];
    const nameLower = entityName.toLowerCase();

    for (const docketRef of dockets.slice(0, 20)) {
      const docketId = docketRef.docket_id || docketRef.id;
      if (!docketId) continue;

      const [docket, parties, entries] = await Promise.all([
        this.getDocket(docketId),
        this.getParties(docketId),
        this.getDocketEntries(docketId, 5)
      ]);

      if (!docket) continue;

      // Find party role
      let partyRole = 'unknown';
      for (const party of parties) {
        if (party.name?.toLowerCase().includes(nameLower)) {
          const partyType = party.party_types?.[0]?.name?.toLowerCase();
          if (partyType) {
            if (partyType.includes('defendant')) partyRole = 'defendant';
            else if (partyType.includes('plaintiff')) partyRole = 'plaintiff';
            else if (partyType.includes('petitioner')) partyRole = 'petitioner';
            else if (partyType.includes('respondent')) partyRole = 'respondent';
            else partyRole = partyType;
          }
          break;
        }
      }

      const caseType = this.determineCaseType(docket);
      const riskSeverity = this.determineRiskSeverity(docket, partyRole, caseType);

      enriched.push({
        id: docket.id,
        caseNumber: docket.docket_number,
        caseName: docket.case_name,
        court: this.getCourtName(docket.court_id),
        courtId: docket.court_id,
        caseType,
        partyRole,
        dateFiled: docket.date_filed,
        dateTerminated: docket.date_terminated,
        status: docket.date_terminated ? 'closed' : 'open',
        natureOfSuit: docket.nature_of_suit,
        cause: docket.cause,
        judge: docket.assigned_to_str,
        url: `https://www.courtlistener.com${docket.absolute_url || '/docket/' + docket.id + '/'}`,
        riskSeverity,
        entries
      });
    }

    return enriched;
  }

  determineCaseType(docket) {
    const caseNum = (docket.docket_number || '').toLowerCase();
    const cause = (docket.cause || '').toLowerCase();

    if (caseNum.includes('-cr-') || caseNum.includes('-mj-')) return 'criminal';
    if (cause.includes('18:') || cause.includes('21:') || cause.includes('26:7201')) return 'criminal';
    if (caseNum.includes('-bk-') || caseNum.includes('-br-')) return 'bankruptcy';
    if (caseNum.includes('-cv-') || caseNum.includes('-mc-')) return 'civil';
    if (docket.court_id?.includes('ca') || caseNum.includes('-ap-')) return 'appellate';

    return 'civil';
  }

  determineRiskSeverity(docket, partyRole, caseType) {
    const cause = (docket.cause || '').toLowerCase();
    const nature = (docket.nature_of_suit || '').toLowerCase();
    const caseName = (docket.case_name || '').toLowerCase();

    if (caseType === 'criminal' && partyRole === 'defendant') return 'critical';

    if (caseName.includes('securities and exchange') || caseName.includes('united states v.')) {
      if (partyRole === 'defendant') return 'high';
    }
    if (cause.includes('fraud') || nature.includes('fraud')) {
      if (partyRole === 'defendant') return 'high';
    }
    if (cause.includes('1348') || cause.includes('1341') || cause.includes('1343')) return 'high';

    if (partyRole === 'defendant' && caseType === 'civil') {
      if (nature.includes('antitrust') || nature.includes('rico') || nature.includes('racketeering')) return 'medium';
      return 'medium';
    }

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
      'ca1': '1st Cir.', 'ca2': '2nd Cir.', 'ca3': '3rd Cir.', 'ca4': '4th Cir.',
      'ca5': '5th Cir.', 'ca6': '6th Cir.', 'ca7': '7th Cir.', 'ca8': '8th Cir.',
      'ca9': '9th Cir.', 'ca10': '10th Cir.', 'ca11': '11th Cir.',
      'cadc': 'D.C. Cir.', 'cafc': 'Fed. Cir.', 'scotus': 'Supreme Court'
    };
    return courts[courtId] || courtId?.toUpperCase() || 'Unknown';
  }

  calculateRiskScore(cases) {
    let score = 0;
    const flags = [];

    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const c of cases) {
      severityCounts[c.riskSeverity]++;
    }

    if (severityCounts.critical > 0) {
      score += 40 + (severityCounts.critical - 1) * 15;
      flags.push({
        severity: 'CRITICAL',
        type: 'CRIMINAL_DEFENDANT',
        message: `Defendant in ${severityCounts.critical} criminal case(s)`,
        cases: cases.filter(c => c.riskSeverity === 'critical').map(c => c.caseName)
      });
    }

    if (severityCounts.high > 0) {
      score += 20 + (severityCounts.high - 1) * 10;
      flags.push({
        severity: 'HIGH',
        type: 'REGULATORY_ENFORCEMENT',
        message: `Defendant in ${severityCounts.high} high-risk civil case(s)`,
        cases: cases.filter(c => c.riskSeverity === 'high').map(c => c.caseName)
      });
    }

    if (severityCounts.medium > 0) {
      score += 10 + (severityCounts.medium - 1) * 3;
      flags.push({
        severity: 'MEDIUM',
        type: 'CIVIL_LITIGATION',
        message: `Defendant in ${severityCounts.medium} civil case(s)`
      });
    }

    const openCriminal = cases.filter(c => c.caseType === 'criminal' && c.status === 'open');
    if (openCriminal.length > 0) {
      score += 15;
      flags.push({
        severity: 'HIGH',
        type: 'OPEN_CRIMINAL_CASE',
        message: `${openCriminal.length} open criminal case(s)`
      });
    }

    const secCases = cases.filter(c =>
      c.caseName?.toLowerCase().includes('securities and exchange') ||
      c.cause?.toLowerCase().includes('securities')
    );
    if (secCases.length > 0) {
      score += 10;
      flags.push({
        severity: 'HIGH',
        type: 'SEC_ENFORCEMENT',
        message: `${secCases.length} SEC-related case(s)`
      });
    }

    return {
      score: Math.min(score, 100),
      flags,
      severityCounts
    };
  }
}

module.exports = { CourtRecordsService };
