class UKCompaniesHouseService {

  constructor() {
    this.apiKey = process.env.COMPANIES_HOUSE_API_KEY;
    this.baseUrl = 'https://api.company-information.service.gov.uk';
  }

  headers() {
    return {
      'Authorization': 'Basic ' + Buffer.from(this.apiKey + ':').toString('base64')
    };
  }

  // ============================================
  // MAIN ENTRY POINT
  // ============================================

  async screenCompany(identifier) {
    if (!this.apiKey) {
      return { error: 'COMPANIES_HOUSE_API_KEY not configured' };
    }

    let companyNumber = identifier.companyNumber;

    if (!companyNumber && identifier.companyName) {
      const searchResults = await this.searchCompanies(identifier.companyName);
      if (searchResults.length === 0) {
        return { error: 'Company not found', query: identifier.companyName };
      }
      companyNumber = searchResults[0].company_number;
    }

    const [company, officers, pscs, filingHistory, charges, insolvency] = await Promise.all([
      this.getCompanyProfile(companyNumber),
      this.getOfficers(companyNumber),
      this.getPSCs(companyNumber),
      this.getFilingHistory(companyNumber),
      this.getCharges(companyNumber),
      this.getInsolvency(companyNumber)
    ]);

    const disqualifiedChecks = await this.checkOfficersDisqualified(officers);

    const riskAssessment = this.calculateRiskScore(
      company, officers, pscs, filingHistory, charges, insolvency, disqualifiedChecks
    );

    return {
      company: this.formatCompany(company),
      officers: this.formatOfficers(officers, disqualifiedChecks),
      pscs: this.formatPSCs(pscs),
      filingHistory: this.formatFilings(filingHistory),
      charges: this.formatCharges(charges),
      insolvency: this.formatInsolvency(insolvency),
      riskScore: riskAssessment.score,
      riskFlags: riskAssessment.flags,
      searchedAt: new Date().toISOString()
    };
  }

  // ============================================
  // API CALLS
  // ============================================

  async searchCompanies(query) {
    try {
      const response = await fetch(
        `${this.baseUrl}/search/companies?q=${encodeURIComponent(query)}&items_per_page=10`,
        { headers: this.headers(), signal: AbortSignal.timeout(15000) }
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.items || [];
    } catch (e) {
      console.error('Company search error:', e.message);
      return [];
    }
  }

  async getCompanyProfile(companyNumber) {
    try {
      const response = await fetch(
        `${this.baseUrl}/company/${companyNumber}`,
        { headers: this.headers(), signal: AbortSignal.timeout(15000) }
      );
      if (!response.ok) return null;
      return response.json();
    } catch (e) {
      console.error('Company profile error:', e.message);
      return null;
    }
  }

  async getOfficers(companyNumber) {
    try {
      const response = await fetch(
        `${this.baseUrl}/company/${companyNumber}/officers?items_per_page=100`,
        { headers: this.headers(), signal: AbortSignal.timeout(15000) }
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.items || [];
    } catch (e) {
      console.error('Officers error:', e.message);
      return [];
    }
  }

  async getPSCs(companyNumber) {
    try {
      const response = await fetch(
        `${this.baseUrl}/company/${companyNumber}/persons-with-significant-control?items_per_page=100`,
        { headers: this.headers(), signal: AbortSignal.timeout(15000) }
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.items || [];
    } catch (e) {
      console.error('PSC error:', e.message);
      return [];
    }
  }

  async getFilingHistory(companyNumber, limit = 20) {
    try {
      const response = await fetch(
        `${this.baseUrl}/company/${companyNumber}/filing-history?items_per_page=${limit}`,
        { headers: this.headers(), signal: AbortSignal.timeout(15000) }
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.items || [];
    } catch (e) {
      console.error('Filing history error:', e.message);
      return [];
    }
  }

  async getCharges(companyNumber) {
    try {
      const response = await fetch(
        `${this.baseUrl}/company/${companyNumber}/charges`,
        { headers: this.headers(), signal: AbortSignal.timeout(15000) }
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.items || [];
    } catch (e) {
      console.error('Charges error:', e.message);
      return [];
    }
  }

  async getInsolvency(companyNumber) {
    try {
      const response = await fetch(
        `${this.baseUrl}/company/${companyNumber}/insolvency`,
        { headers: this.headers(), signal: AbortSignal.timeout(15000) }
      );
      if (!response.ok) return null;
      return response.json();
    } catch (e) {
      return null;
    }
  }

  async searchDisqualifiedOfficers(name) {
    try {
      const response = await fetch(
        `${this.baseUrl}/search/disqualified-officers?q=${encodeURIComponent(name)}`,
        { headers: this.headers(), signal: AbortSignal.timeout(10000) }
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.items || [];
    } catch (e) {
      return [];
    }
  }

  // ============================================
  // DISQUALIFIED OFFICER CHECK
  // ============================================

  async checkOfficersDisqualified(officers) {
    const results = new Map();

    for (const officer of officers) {
      if (officer.resigned_on) continue;

      const matches = await this.searchDisqualifiedOfficers(officer.name);

      const match = matches.find(m => {
        if (!officer.date_of_birth || !m.date_of_birth) return false;
        return (
          m.date_of_birth.year === officer.date_of_birth.year &&
          m.date_of_birth.month === officer.date_of_birth.month
        );
      });

      if (match) {
        results.set(officer.name, { disqualified: true, details: match });
      }
    }

    return results;
  }

  // ============================================
  // DATA FORMATTING
  // ============================================

  formatCompany(company) {
    if (!company) return null;
    return {
      companyNumber: company.company_number,
      companyName: company.company_name,
      companyStatus: company.company_status,
      companyType: company.type,
      dateOfCreation: company.date_of_creation,
      dateOfCessation: company.date_of_cessation,
      jurisdiction: company.jurisdiction,
      registeredOffice: company.registered_office_address,
      sicCodes: company.sic_codes,
      accountsOverdue: company.accounts?.overdue,
      confirmationStatementOverdue: company.confirmation_statement?.overdue,
      hasCharges: company.has_charges,
      hasInsolvencyHistory: company.has_insolvency_history,
      canFile: company.can_file
    };
  }

  formatOfficers(officers, disqualifiedChecks) {
    return officers.map(o => ({
      name: o.name,
      role: o.officer_role,
      appointedOn: o.appointed_on,
      resignedOn: o.resigned_on,
      dateOfBirth: o.date_of_birth,
      nationality: o.nationality,
      countryOfResidence: o.country_of_residence,
      occupation: o.occupation,
      address: o.address,
      isActive: !o.resigned_on,
      isDisqualified: disqualifiedChecks.has(o.name),
      disqualificationDetails: disqualifiedChecks.get(o.name)?.details || null
    }));
  }

  formatPSCs(pscs) {
    return pscs.map(p => ({
      name: p.name,
      kind: p.kind,
      notifiedOn: p.notified_on,
      ceasedOn: p.ceased_on,
      dateOfBirth: p.date_of_birth,
      nationality: p.nationality,
      countryOfResidence: p.country_of_residence,
      naturesOfControl: p.natures_of_control,
      address: p.address,
      isActive: !p.ceased_on,
      identification: p.identification
    }));
  }

  formatFilings(filings) {
    return filings.map(f => ({
      date: f.date,
      category: f.category,
      type: f.type,
      description: f.description,
      actionDate: f.action_date
    }));
  }

  formatCharges(charges) {
    if (!charges) return [];
    return charges.map(c => ({
      chargeNumber: c.charge_number,
      status: c.status,
      createdOn: c.created_on,
      satisfiedOn: c.satisfied_on,
      description: c.particulars?.description,
      personsEntitled: c.persons_entitled,
      securedDetails: c.secured_details
    }));
  }

  formatInsolvency(insolvency) {
    if (!insolvency) return null;
    return {
      status: insolvency.status,
      cases: (insolvency.cases || []).map(c => ({
        type: c.type,
        number: c.number,
        dates: c.dates,
        practitioners: c.practitioners
      }))
    };
  }

  // ============================================
  // RISK SCORING
  // ============================================

  calculateRiskScore(company, officers, pscs, filings, charges, insolvency, disqualifiedChecks) {
    let score = 0;
    const flags = [];

    if (!company) {
      return { score: 0, flags: [{ severity: 'LOW', type: 'NOT_FOUND', message: 'Company not found' }] };
    }

    // CRITICAL: Insolvency
    if (insolvency?.cases?.length > 0) {
      score += 50;
      const caseTypes = insolvency.cases.map(c => c.type).join(', ');
      flags.push({ severity: 'CRITICAL', type: 'INSOLVENCY', message: `Company has insolvency proceedings: ${caseTypes}` });
    }

    // CRITICAL: Disqualified officer
    if (disqualifiedChecks.size > 0) {
      score += 40;
      const names = [...disqualifiedChecks.keys()].join(', ');
      flags.push({ severity: 'CRITICAL', type: 'DISQUALIFIED_OFFICER', message: `Disqualified director(s): ${names}` });
    }

    // HIGH: Bad company status
    const badStatuses = ['dissolved', 'liquidation', 'administration', 'voluntary-arrangement'];
    if (badStatuses.includes(company.company_status)) {
      score += 35;
      flags.push({ severity: 'HIGH', type: 'COMPANY_STATUS', message: `Company status: ${company.company_status}` });
    }

    // HIGH: Accounts overdue
    if (company.accounts?.overdue) {
      score += 20;
      flags.push({ severity: 'HIGH', type: 'ACCOUNTS_OVERDUE', message: 'Annual accounts are overdue' });
    }

    // HIGH: Confirmation statement overdue
    if (company.confirmation_statement?.overdue) {
      score += 15;
      flags.push({ severity: 'HIGH', type: 'CONFIRMATION_OVERDUE', message: 'Confirmation statement is overdue' });
    }

    // MEDIUM: Active charges
    const activeCharges = (charges || []).filter(c => c.status !== 'fully-satisfied');
    if (activeCharges.length > 0) {
      score += 10;
      flags.push({ severity: 'MEDIUM', type: 'ACTIVE_CHARGES', message: `${activeCharges.length} active charge(s) registered` });
    }

    // MEDIUM: Corporate PSC (layered ownership)
    const corporatePSCs = pscs.filter(p => p.kind?.includes('corporate') || p.identification?.legal_authority);
    if (corporatePSCs.length > 0) {
      score += 10;
      flags.push({ severity: 'MEDIUM', type: 'CORPORATE_PSC', message: `${corporatePSCs.length} corporate PSC(s) — ownership may be layered` });
    }

    // MEDIUM: High-risk jurisdiction PSC
    const highRiskJurisdictions = ['british virgin islands', 'cayman islands', 'seychelles', 'panama', 'belize'];
    const offshorePSCs = pscs.filter(p =>
      highRiskJurisdictions.some(j =>
        (p.country_of_residence || '').toLowerCase().includes(j) ||
        (p.identification?.country_registered || '').toLowerCase().includes(j)
      )
    );
    if (offshorePSCs.length > 0) {
      score += 15;
      flags.push({ severity: 'MEDIUM', type: 'OFFSHORE_PSC', message: 'PSC registered in high-risk jurisdiction' });
    }

    // MEDIUM: New company (< 2 years)
    if (company.date_of_creation) {
      const ageYears = (Date.now() - new Date(company.date_of_creation)) / (365 * 24 * 60 * 60 * 1000);
      if (ageYears < 2) {
        score += 10;
        flags.push({ severity: 'MEDIUM', type: 'NEW_COMPANY', message: `Company is less than 2 years old (${ageYears.toFixed(1)} years)` });
      }
    }

    // LOW: High officer turnover
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const recentResignations = officers.filter(o => o.resigned_on && new Date(o.resigned_on) > oneYearAgo);
    if (recentResignations.length >= 3) {
      score += 10;
      flags.push({ severity: 'LOW', type: 'HIGH_TURNOVER', message: `${recentResignations.length} officers resigned in past year` });
    }

    // LOW: Formation agent address
    const formationAgentIndicators = ['companies house', 'formation', 'registered office', 'virtual office'];
    const addressStr = JSON.stringify(company.registered_office_address || {}).toLowerCase();
    if (formationAgentIndicators.some(i => addressStr.includes(i))) {
      score += 5;
      flags.push({ severity: 'LOW', type: 'FORMATION_AGENT_ADDRESS', message: 'Registered address may be a formation agent' });
    }

    return {
      score: Math.min(score, 100),
      flags: flags.sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return order[a.severity] - order[b.severity];
      })
    };
  }
}

module.exports = { UKCompaniesHouseService };
