// Vercel Serverless Function — Federal court records screening via CourtListener Search API
// POST /api/screening/court-records

class CourtRecordsService {
  constructor() {
    this.baseUrl = 'https://www.courtlistener.com/api/rest/v4';
    this.token = process.env.COURTLISTENER_API_KEY || null;
    this.cache = new Map();
  }

  async screenEntity(entity) {
    const { name, type } = entity;
    if (!this.token) {
      return {
        entity: { name, type },
        summary: { totalCases: 0, asDefendant: 0, asPlaintiff: 0, criminalCases: 0, civilCases: 0, caselawMentions: 0, riskScore: 0 },
        cases: [], caselaw: [], riskFlags: [], sourcesSearched: [],
        error: 'COURTLISTENER_API_KEY not configured', searchedAt: new Date().toISOString()
      };
    }

    const [dockets, filings, caselaw] = await Promise.all([
      this.searchDockets(name), this.searchFilings(name), this.searchCaselaw(name)
    ]);

    const cases = this.processDockets(dockets, name);
    const opinions = this.processCaselaw(caselaw, name);
    const riskAssessment = this.calculateRiskScore(cases, opinions);

    return {
      entity: { name, type },
      summary: {
        totalCases: cases.length,
        asDefendant: cases.filter(c => c.partyRole === 'defendant').length,
        asPlaintiff: cases.filter(c => c.partyRole === 'plaintiff').length,
        criminalCases: cases.filter(c => c.caseType === 'criminal').length,
        civilCases: cases.filter(c => c.caseType === 'civil').length,
        caselawMentions: opinions.length,
        riskScore: riskAssessment.score
      },
      cases: cases.sort((a, b) => {
        const so = { critical: 0, high: 1, medium: 2, low: 3 };
        if ((so[a.riskSeverity] || 3) !== (so[b.riskSeverity] || 3)) return (so[a.riskSeverity] || 3) - (so[b.riskSeverity] || 3);
        return new Date(b.dateFiled || 0) - new Date(a.dateFiled || 0);
      }),
      caselaw: opinions.slice(0, 10),
      riskFlags: riskAssessment.flags,
      sourcesSearched: ['courtlistener'],
      searchedAt: new Date().toISOString()
    };
  }

  async searchDockets(name) {
    const cacheKey = `dockets:${name}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    const queries = [`party:"${name}"`, `caseName:"${name}"`];
    const allResults = [];
    for (const q of queries) {
      try {
        const url = `${this.baseUrl}/search/?` + new URLSearchParams({ q, type: 'r', order_by: 'dateFiled desc', highlight: 'off' });
        const response = await fetch(url, { headers: { 'Authorization': `Token ${this.token}` }, signal: AbortSignal.timeout(15000) });
        if (response.ok) { const data = await response.json(); allResults.push(...(data.results || [])); }
      } catch (e) { console.error('Docket search error:', e); }
    }
    const seen = new Set();
    const unique = allResults.filter(r => { const id = r.docket_id || r.id; if (!id || seen.has(id)) return false; seen.add(id); return true; });
    this.cache.set(cacheKey, unique);
    return unique;
  }

  async searchFilings(name) {
    const cacheKey = `filings:${name}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    try {
      const q = `"${name}" AND (indictment OR complaint OR judgment OR conviction OR fraud OR sanctions)`;
      const url = `${this.baseUrl}/search/?` + new URLSearchParams({ q, type: 'rd', order_by: 'dateFiled desc', highlight: 'on' });
      const response = await fetch(url, { headers: { 'Authorization': `Token ${this.token}` }, signal: AbortSignal.timeout(15000) });
      if (response.ok) { const data = await response.json(); const results = data.results || []; this.cache.set(cacheKey, results); return results; }
    } catch (e) { console.error('Filing search error:', e); }
    return [];
  }

  async searchCaselaw(name) {
    const cacheKey = `caselaw:${name}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    const queries = [`"${name}"`, `"${name}" AND (fraud OR sanctions OR "money laundering" OR conviction)`];
    const allResults = [];
    for (const q of queries) {
      try {
        const url = `${this.baseUrl}/search/?` + new URLSearchParams({ q, type: 'o', order_by: 'score desc', highlight: 'on' });
        const response = await fetch(url, { headers: { 'Authorization': `Token ${this.token}` }, signal: AbortSignal.timeout(15000) });
        if (response.ok) { const data = await response.json(); allResults.push(...(data.results || [])); }
      } catch (e) { console.error('Caselaw search error:', e); }
    }
    const seen = new Set();
    const unique = allResults.filter(r => { const id = r.cluster_id || r.id; if (!id || seen.has(id)) return false; seen.add(id); return true; });
    this.cache.set(cacheKey, unique);
    return unique;
  }

  processDockets(results, entityName) {
    const nameLower = entityName.toLowerCase();
    return results.slice(0, 25).map(r => {
      let partyRole = 'unknown';
      const caseName = (r.caseName || r.case_name || '').toLowerCase();
      if (caseName.includes(' v. ') || caseName.includes(' vs. ') || caseName.includes(' v ')) {
        const parts = caseName.split(/ vs?\.? /i);
        if (parts.length >= 2) {
          if (parts[1].includes(nameLower)) partyRole = 'defendant';
          else if (parts[0].includes(nameLower)) partyRole = 'plaintiff';
        }
      }
      if (caseName.startsWith('united states v') || caseName.startsWith('sec v') ||
          caseName.startsWith('securities and exchange') || caseName.startsWith('federal trade commission') ||
          caseName.startsWith('commodity futures trading') || caseName.startsWith('people of the state')) {
        if (caseName.includes(nameLower)) partyRole = 'defendant';
      }
      const docketNumber = r.docketNumber || r.docket_number || '';
      const suitNature = r.suitNature || r.nature_of_suit || '';
      const caseType = this.determineCaseType(docketNumber, suitNature);
      const riskSeverity = this.determineRiskSeverity(r, partyRole, caseType);
      return {
        id: r.docket_id || r.id, caseNumber: docketNumber,
        caseName: r.caseName || r.case_name || '',
        court: r.court || this.getCourtName(r.court_id), courtId: r.court_id,
        caseType, partyRole,
        dateFiled: r.dateFiled || r.date_filed, dateTerminated: r.dateTerminated || r.date_terminated,
        status: (r.dateTerminated || r.date_terminated) ? 'closed' : 'open',
        suitNature, judge: r.assigned_to || r.judge || r.assigned_to_str,
        url: r.absolute_url ? `https://www.courtlistener.com${r.absolute_url}` : `https://www.courtlistener.com/docket/${r.docket_id || r.id}/`,
        riskSeverity, snippet: (r.snippet || '').replace(/<[^>]*>/g, ''),
        documents: (r.recap_documents || []).map(doc => ({
          description: doc.description || doc.short_description || '',
          dateFiled: doc.dateFiled || doc.date_filed || '',
          pageCount: doc.page_count || 0
        })),
        hasMoreDocs: r.more_docs || false
      };
    });
  }

  processCaselaw(results, entityName) {
    return results.slice(0, 15).map(r => {
      const snippet = r.opinions?.[0]?.snippet || r.snippet || '';
      return {
        id: r.cluster_id || r.id, caseName: r.caseName || r.case_name || '',
        caseNameFull: r.caseNameFull || r.case_name_full || '',
        court: r.court || this.getCourtName(r.court_id), courtId: r.court_id,
        dateFiled: r.dateFiled || r.date_filed, citation: r.citation || [],
        docketNumber: r.docketNumber || r.docket_number || '', status: r.status || '',
        url: r.absolute_url ? `https://www.courtlistener.com${r.absolute_url}` : '',
        snippet: (snippet || '').replace(/<[^>]*>/g, ''), relevanceScore: r.score || 0
      };
    });
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
      'dcd': 'D.D.C.', 'ilnd': 'N.D. Ill.', 'txsd': 'S.D. Tex.', 'txnd': 'N.D. Tex.',
      'txed': 'E.D. Tex.', 'txwd': 'W.D. Tex.', 'mad': 'D. Mass.',
      'flsd': 'S.D. Fla.', 'flmd': 'M.D. Fla.', 'flnd': 'N.D. Fla.',
      'njd': 'D.N.J.', 'paed': 'E.D. Pa.', 'pawd': 'W.D. Pa.', 'ded': 'D. Del.',
      'vaed': 'E.D. Va.', 'vawd': 'W.D. Va.',
      'ca1': '1st Cir.', 'ca2': '2nd Cir.', 'ca3': '3rd Cir.', 'ca4': '4th Cir.',
      'ca5': '5th Cir.', 'ca6': '6th Cir.', 'ca7': '7th Cir.', 'ca8': '8th Cir.',
      'ca9': '9th Cir.', 'ca10': '10th Cir.', 'ca11': '11th Cir.',
      'cadc': 'D.C. Cir.', 'cafc': 'Fed. Cir.', 'scotus': 'Supreme Court'
    };
    return courts[courtId] || courtId?.toUpperCase() || 'Unknown';
  }

  calculateRiskScore(cases, caselaw) {
    let score = 0;
    const flags = [];
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const c of cases) { if (c.riskSeverity) severityCounts[c.riskSeverity]++; }

    if (severityCounts.critical > 0) {
      score += 40 + (severityCounts.critical - 1) * 15;
      flags.push({ severity: 'CRITICAL', type: 'CRIMINAL_DEFENDANT', message: `Defendant in ${severityCounts.critical} federal criminal case(s)`,
        cases: cases.filter(c => c.riskSeverity === 'critical').map(c => ({ name: c.caseName, court: c.court, date: c.dateFiled })) });
    }
    if (severityCounts.high > 0) {
      score += 20 + (severityCounts.high - 1) * 10;
      flags.push({ severity: 'HIGH', type: 'GOVERNMENT_ENFORCEMENT', message: `Defendant in ${severityCounts.high} government enforcement case(s)`,
        cases: cases.filter(c => c.riskSeverity === 'high').map(c => ({ name: c.caseName, court: c.court, date: c.dateFiled })) });
    }
    if (severityCounts.medium > 0) {
      score += 10 + (severityCounts.medium - 1) * 3;
      flags.push({ severity: 'MEDIUM', type: 'CIVIL_DEFENDANT', message: `Defendant in ${severityCounts.medium} civil case(s)` });
    }
    const openCriminal = cases.filter(c => c.caseType === 'criminal' && c.status === 'open');
    if (openCriminal.length > 0) {
      score += 15;
      flags.push({ severity: 'HIGH', type: 'OPEN_CRIMINAL_CASE', message: `${openCriminal.length} open federal criminal case(s)` });
    }
    const secCases = cases.filter(c => (c.caseName || '').toLowerCase().includes('securities and exchange'));
    if (secCases.length > 0) {
      score += 10;
      flags.push({ severity: 'HIGH', type: 'SEC_ENFORCEMENT', message: `${secCases.length} SEC enforcement case(s)` });
    }
    const relevantCaselaw = (caselaw || []).filter(c => (c.snippet || '').toLowerCase().match(/fraud|sanction|conviction|guilty|indictment|money.laundering/));
    if (relevantCaselaw.length > 0) {
      score += Math.min(relevantCaselaw.length * 3, 15);
      flags.push({ severity: 'MEDIUM', type: 'CASELAW_MENTIONS', message: `Mentioned in ${relevantCaselaw.length} court opinion(s) with risk keywords` });
    }
    return { score: Math.min(score, 100), flags, severityCounts, caselawMentions: (caselaw || []).length };
  }
}

const service = new CourtRecordsService();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name, type } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await service.screenEntity({ name, type: type || 'individual' });
    res.json(result);
  } catch (error) {
    console.error('Court records screening error:', error);
    res.status(500).json({ error: error.message });
  }
}
