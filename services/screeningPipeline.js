// Unified Screening Pipeline — orchestrates all 7 layers
// Calls existing services in parallel, aggregates results, computes overall risk

const { OFACScreeningService } = require('./ofacScreening');
const { SanctionsAnnouncementService } = require('./sanctionsAnnouncements');
const { WebIntelligenceService } = require('./webIntelligence');
const { WalletScreeningService } = require('./walletScreening');
const { PEPScreeningService } = require('./pepScreening');
const { RegulatoryEnforcementService } = require('./regulatoryEnforcement');
const { AdverseMediaService } = require('./adverseMedia');
const { CourtRecordsService } = require('./courtRecords');
const { OCCRPAlephService } = require('./occrpAleph');
const { OpenCorporatesService } = require('./openCorporates');
const { UKCompaniesHouseService } = require('./ukCompaniesHouse');
const { BlockchainScreeningService } = require('./blockchainScreening');
const { ShippingTradeService } = require('./shippingTrade');
const { FinancialRegistrationsService } = require('./financialRegistrations');

class ScreeningPipeline {
  constructor() {
    this.ofac = new OFACScreeningService();
    this.announcements = new SanctionsAnnouncementService();
    this.webIntel = new WebIntelligenceService();
    this.wallet = new WalletScreeningService();
    this.pep = new PEPScreeningService();
    this.regulatory = new RegulatoryEnforcementService();
    this.adverseMedia = new AdverseMediaService();
    this.courtRecords = new CourtRecordsService();
    this.occrp = new OCCRPAlephService();
    this.openCorporates = new OpenCorporatesService();
    this.ukCompaniesHouse = new UKCompaniesHouseService();
    this.blockchain = new BlockchainScreeningService();
    this.shipping = new ShippingTradeService();
    this.finreg = new FinancialRegistrationsService();
  }

  // Detect if input is a wallet address
  detectWallet(input) {
    const t = input.trim();
    if (/^0x[a-fA-F0-9]{40}$/.test(t)) return { address: t, chain: 'ETH' };
    if (/^(bc1)[a-zA-HJ-NP-Z0-9]{25,90}$/.test(t)) return { address: t, chain: 'BTC' };
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(t)) return { address: t, chain: 'BTC' };
    if (/^T[a-zA-Z0-9]{33}$/.test(t)) return { address: t, chain: 'TRX' };
    if (/^r[0-9a-zA-Z]{24,34}$/.test(t)) return { address: t, chain: 'XRP' };
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(t)) return { address: t, chain: 'SOL' };
    return null;
  }

  /**
   * Main entry point — runs all screening layers
   * @param {string} query - entity name or wallet address
   * @param {object} options - { type, layers, timeout }
   *   type: 'individual' | 'entity' | 'vessel' | 'auto'
   *   layers: array of layer names to run (default: all)
   *   timeout: per-layer timeout in ms (default: 25000)
   * @returns {object} full screening result with all layers + overall risk
   */
  async screenEntity(query, options = {}) {
    const startTime = Date.now();
    const { type = 'auto', layers = null, timeout = 45000 } = options;

    const wallet = this.detectWallet(query);
    const isWallet = !!wallet;
    const entityName = isWallet ? null : query.trim();

    const result = {
      query,
      entityType: isWallet ? 'wallet' : (type === 'auto' ? 'unknown' : type),
      isWallet,
      layers: {},
      overallRisk: { score: 0, level: 'LOW', flags: [] },
      sourcesChecked: [],
      screenedAt: new Date().toISOString(),
    };

    const shouldRun = (name) => !layers || layers.includes(name);

    const race = (promise, label) =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), timeout))
      ]).catch(e => {
        console.warn(`[Pipeline] ${label}:`, e.message);
        return { _pipelineError: true, error: e.message };
      });

    // Check if result is a real service response (not a pipeline timeout/error)
    const isValid = (res) => res && !res._pipelineError;

    // =========== WALLET PATH ===========
    if (isWallet) {
      const [walletRes, ofacWalletRes, blockchainRes] = await Promise.all([
        shouldRun('wallet') ? race(this.wallet.screenWallet(wallet.address), 'wallet') : null,
        shouldRun('ofac') ? race(this.ofac.screenWallet(wallet.address), 'ofac-wallet') : null,
        shouldRun('blockchain') ? race(this.blockchain.screenAddress({ address: wallet.address, blockchain: wallet.chain }), 'blockchain') : null,
      ]);

      if (isValid(walletRes)) {
        result.layers.wallet = walletRes;
        result.sourcesChecked.push('OFAC Wallet Lists', 'Known Sanctioned Services', 'OpenSanctions');
      }
      if (isValid(ofacWalletRes)) {
        result.layers.ofacWallet = ofacWalletRes;
        result.sourcesChecked.push('OFAC SDN CSV');
      }
      if (isValid(blockchainRes)) {
        result.layers.blockchain = blockchainRes;
        result.sourcesChecked.push('Blockchain Explorers');
      }

      result.overallRisk = this.computeWalletRisk(result.layers);
      result.durationMs = Date.now() - startTime;
      return result;
    }

    // =========== NAME/ENTITY PATH ===========
    // All layers run in parallel for maximum speed
    const [ofacRes, announcementsRes, webIntelRes, pepRes, regulatoryRes, adverseMediaRes, courtRes, occrpRes, corpRes, ukCorpRes, shippingRes, finregRes] = await Promise.all([
      // Layer 1: Sanctions
      shouldRun('sanctions') ? race(this.ofac.screenEntity({ name: entityName, type: type === 'auto' ? 'ALL' : type.toUpperCase() }), 'ofac') : null,
      shouldRun('sanctions') ? race(this.announcements.screen(entityName), 'announcements') : null,
      shouldRun('sanctions') ? race(this.webIntel.search(entityName), 'webintel') : null,
      // Layer 3: PEP
      shouldRun('pep') ? race(this.pep.screenEntity({ name: entityName, type: type === 'auto' ? 'individual' : type }), 'pep') : null,
      // Layer 2: Regulatory
      shouldRun('regulatory') ? race(this.regulatory.screenEntity({ name: entityName, type: type === 'auto' ? 'ALL' : type.toUpperCase() }), 'regulatory') : null,
      // Layer 4: Adverse media
      shouldRun('adverseMedia') ? race(this.adverseMedia.screen(entityName, type === 'auto' ? 'INDIVIDUAL' : type.toUpperCase()), 'adverse-media') : null,
      // Layer 5: Litigation
      shouldRun('litigation') ? race(this.courtRecords.screenEntity({ name: entityName, type: type === 'auto' ? 'individual' : type }), 'court-records') : null,
      shouldRun('litigation') ? race(this.occrp.screenEntity({ name: entityName, type: type === 'auto' ? 'individual' : type }), 'occrp') : null,
      // Layer 6: Corporate
      shouldRun('corporate') ? race(this.openCorporates.screenEntity({ name: entityName }), 'opencorporates') : null,
      shouldRun('corporate') ? race(this.ukCompaniesHouse.screenCompany({ companyName: entityName }), 'uk-companies') : null,
      // Layer 7b: Shipping/Trade
      shouldRun('shipping') ? race(this.shipping.screenEntity({ name: entityName, type }), 'shipping') : null,
      // Layer 8: Financial Registrations
      shouldRun('finreg') ? race(this.finreg.screenEntity({ name: entityName, type: type === 'auto' ? 'auto' : type }), 'finreg') : null,
    ]);

    if (isValid(ofacRes)) { result.layers.ofac = ofacRes; result.sourcesChecked.push('OFAC SDN List'); }
    if (isValid(announcementsRes)) { result.layers.announcements = announcementsRes; result.sourcesChecked.push('OpenSanctions', 'OFAC RSS', 'Treasury', 'EU Council', 'UK OFSI', 'Sanctions News'); }
    if (isValid(webIntelRes)) { result.layers.webIntelligence = webIntelRes; result.sourcesChecked.push('Claude Web Search'); }
    if (isValid(pepRes)) { result.layers.pep = pepRes; result.sourcesChecked.push('OpenSanctions PEP', 'Wikidata', 'EveryPolitician', 'CIA World Leaders'); }
    if (isValid(regulatoryRes)) { result.layers.regulatory = regulatoryRes; result.sourcesChecked.push('DOJ', 'CFPB', 'FTC', 'CFTC', 'Fed', 'FDIC', 'OCC', 'FCA', 'EU Competition', 'FinCEN', 'SFO', 'BaFin', 'MAS', 'HKMA', 'ASIC'); }
    if (isValid(adverseMediaRes)) { result.layers.adverseMedia = adverseMediaRes; result.sourcesChecked.push('GDELT', 'Google News', 'News RSS'); }
    if (isValid(courtRes)) { result.layers.courtRecords = courtRes; result.sourcesChecked.push('CourtListener', 'PACER'); }
    if (isValid(occrpRes)) { result.layers.occrp = occrpRes; result.sourcesChecked.push('OCCRP Aleph', 'ICIJ'); }
    if (isValid(corpRes)) { result.layers.corporate = corpRes; result.sourcesChecked.push('OpenCorporates'); }
    if (isValid(ukCorpRes)) { result.layers.ukCompanies = ukCorpRes; result.sourcesChecked.push('UK Companies House'); }
    if (isValid(shippingRes)) { result.layers.shipping = shippingRes; result.sourcesChecked.push('UN Comtrade', 'ITU MARS', 'Equasis'); }
    if (isValid(finregRes)) { result.layers.financialRegistrations = finregRes; result.sourcesChecked.push(...(finregRes.sourcesChecked || [])); }

    // Deduplicate sources
    result.sourcesChecked = [...new Set(result.sourcesChecked)];

    // Compute overall risk
    result.overallRisk = this.computeEntityRisk(result.layers);
    result.durationMs = Date.now() - startTime;

    return result;
  }

  // =========== RISK AGGREGATION ===========

  computeWalletRisk(layers) {
    const flags = [];
    let score = 0;

    if (layers.wallet?.status === 'BLOCKED') {
      score = 100;
      flags.push({ severity: 'CRITICAL', type: 'SANCTIONED_WALLET', message: `Wallet blocked: ${layers.wallet.matchSource} — ${layers.wallet.sdnEntry}`, source: 'OFAC Wallet Lists' });
    }
    if (layers.ofacWallet?.isSanctioned) {
      score = 100;
      flags.push({ severity: 'CRITICAL', type: 'OFAC_SDN_WALLET', message: `OFAC SDN crypto address match`, source: 'OFAC SDN CSV' });
    }
    if (layers.blockchain?.riskAssessment?.score > 50) {
      score = Math.max(score, layers.blockchain.riskAssessment.score);
      flags.push(...(layers.blockchain.riskAssessment.flags || []));
    }

    return { score: Math.min(score, 100), level: this.riskLevel(score), flags };
  }

  computeEntityRisk(layers) {
    const flags = [];
    let score = 0;

    // Layer 1: Sanctions — highest weight
    const ofac = layers.ofac;
    if (ofac?.matches?.length > 0) {
      const top = ofac.matches[0];
      if (top.matchConfidence >= 0.85) {
        score += 80;
        flags.push({ severity: 'CRITICAL', type: 'OFAC_SDN_MATCH', message: `OFAC SDN match: "${top.name}" (${(top.matchConfidence * 100).toFixed(0)}%) — Programs: ${(top.programs || []).join(', ')}`, source: 'OFAC SDN' });
      } else if (top.matchConfidence >= 0.75) {
        score += 40;
        flags.push({ severity: 'HIGH', type: 'OFAC_SDN_POSSIBLE', message: `Possible OFAC match: "${top.name}" (${(top.matchConfidence * 100).toFixed(0)}%)`, source: 'OFAC SDN' });
      }
    }

    const ann = layers.announcements;
    if (ann?.hasSanctionsAnnouncement) {
      score = Math.max(score, 90);
      flags.push({ severity: 'CRITICAL', type: 'SANCTIONS_ANNOUNCEMENT', message: `Sanctions announcement found — ${ann.riskDelta?.flags?.[0]?.message || ann.totalFindings + ' findings'}`, source: 'Sanctions Announcements' });
    } else if (ann?.totalFindings > 0) {
      score = Math.max(score, Math.min(score + ann.totalFindings * 5, 70));
      flags.push({ severity: 'HIGH', type: 'SANCTIONS_MENTIONS', message: `${ann.totalFindings} sanctions-related mention(s) found`, source: 'Sanctions Announcements' });
    }

    const wi = layers.webIntelligence;
    if (wi?.sanctioned && wi?.confidence === 'high') {
      score = Math.max(score, 95);
      flags.push({ severity: 'CRITICAL', type: 'WEB_INTEL_SANCTIONED', message: `Web intelligence confirms sanctions: ${wi.authority || 'Unknown'} — ${wi.summary}`, source: 'Claude Web Search' });
    } else if (wi?.sanctioned) {
      score = Math.max(score, 60);
      flags.push({ severity: 'HIGH', type: 'WEB_INTEL_POSSIBLE', message: `Possible sanctions (${wi.confidence}): ${wi.summary}`, source: 'Claude Web Search' });
    }

    // Layer 2: Regulatory
    const reg = layers.regulatory;
    if (reg?.riskAssessment?.score > 0) {
      score = Math.max(score, Math.min(score + Math.round(reg.riskAssessment.score * 0.5), 90));
      for (const f of (reg.riskAssessment?.flags || [])) {
        flags.push({ ...f, source: 'Regulatory Enforcement' });
      }
    }

    // Layer 3: PEP
    const pep = layers.pep;
    if (pep?.riskAssessment?.isPEP) {
      score = Math.max(score, Math.min(score + 30, 80));
      flags.push({ severity: 'HIGH', type: 'PEP_MATCH', message: `Politically Exposed Person: ${pep.riskAssessment?.details || pep.riskAssessment?.summary || 'PEP confirmed'}`, source: 'PEP Screening' });
    } else if (pep?.riskAssessment?.score > 0) {
      score = Math.max(score, Math.min(score + 15, 60));
      for (const f of (pep.riskAssessment?.flags || [])) {
        flags.push({ ...f, source: 'PEP Screening' });
      }
    }

    // Layer 4: Adverse media
    const am = layers.adverseMedia;
    if (am?.riskDelta?.score > 0) {
      score = Math.max(score, Math.min(score + Math.round(am.riskDelta.score * 0.4), 85));
      for (const f of (am.riskDelta?.flags || [])) {
        flags.push({ ...f, source: 'Adverse Media' });
      }
    }

    // Layer 5: Litigation
    const court = layers.courtRecords;
    if (court?.riskAssessment?.score > 0) {
      score = Math.max(score, Math.min(score + Math.round(court.riskAssessment.score * 0.3), 70));
      for (const f of (court.riskAssessment?.flags || [])) {
        flags.push({ ...f, source: 'Court Records' });
      }
    }
    const occrp = layers.occrp;
    if (occrp?.riskAssessment?.score > 0) {
      score = Math.max(score, Math.min(score + Math.round(occrp.riskAssessment.score * 0.4), 80));
      for (const f of (occrp.riskAssessment?.flags || [])) {
        flags.push({ ...f, source: 'OCCRP/ICIJ' });
      }
    }

    // Layer 6: Corporate — typically informational, lower risk weight
    const corp = layers.corporate;
    if (corp?.riskAssessment?.score > 0) {
      score = Math.max(score, Math.min(score + Math.round(corp.riskAssessment.score * 0.2), 50));
      for (const f of (corp.riskAssessment?.flags || [])) {
        flags.push({ ...f, source: 'Corporate Registry' });
      }
    }

    // Layer 7: Shipping
    const ship = layers.shipping;
    if (ship?.riskAssessment?.score > 0) {
      score = Math.max(score, Math.min(score + Math.round(ship.riskAssessment.score * 0.3), 70));
      for (const f of (ship.riskAssessment?.flags || [])) {
        flags.push({ ...f, source: 'Shipping/Trade' });
      }
    }

    // Layer 8: Financial Registrations
    const finreg = layers.financialRegistrations;
    if (finreg?.riskAssessment?.score > 0) {
      score = Math.max(score, Math.min(score + Math.round(finreg.riskAssessment.score * 0.4), 70));
      for (const f of (finreg.riskAssessment?.flags || [])) {
        flags.push({ ...f, source: 'Financial Registrations' });
      }
    }

    // Sort flags by severity
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    flags.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

    return { score: Math.min(score, 100), level: this.riskLevel(Math.min(score, 100)), flags };
  }

  riskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Format screening result as context string for Claude
   */
  formatForContext(result) {
    if (!result) return '';

    const lines = [];
    lines.push(`[FULL SCREENING PIPELINE — REAL-TIME DATA]`);
    lines.push(`⚠️ THIS IS LIVE DATA from ${result.sourcesChecked?.length || 0} sources. Trust this over training knowledge.`);
    lines.push(`Query: "${result.query}" | Type: ${result.entityType}`);
    lines.push(`Overall Risk: ${result.overallRisk.score}/100 ${result.overallRisk.level}`);
    lines.push(`Duration: ${result.durationMs}ms | Sources: ${result.sourcesChecked?.length || 0}`);
    lines.push('');

    // Risk flags
    if (result.overallRisk.flags.length > 0) {
      lines.push('RISK FLAGS:');
      for (const f of result.overallRisk.flags) {
        const icon = f.severity === 'CRITICAL' ? '🚨' : f.severity === 'HIGH' ? '🔴' : f.severity === 'MEDIUM' ? '🟡' : '🟢';
        lines.push(`${icon} [${f.severity}] ${f.message}${f.source ? ` (${f.source})` : ''}`);
      }
      lines.push('');
    }

    // Layer details
    if (result.isWallet) {
      this._formatWalletLayers(lines, result.layers);
    } else {
      this._formatEntityLayers(lines, result.layers);
    }

    // Critical override instruction
    if (result.overallRisk.score >= 80) {
      lines.push('');
      lines.push('🚨 CRITICAL: Live screening data confirms significant risk. Your risk score MUST reflect this data. Do NOT downgrade based on training knowledge.');
    }

    lines.push('');
    lines.push(`Sources checked: ${(result.sourcesChecked || []).join(', ')}`);

    return '\n\n' + lines.join('\n') + '\n';
  }

  _formatWalletLayers(lines, layers) {
    if (layers.wallet) {
      lines.push(`--- WALLET SCREENING ---`);
      lines.push(`Status: ${layers.wallet.status} | Risk: ${layers.wallet.riskScore}`);
      if (layers.wallet.matches?.length > 0) {
        for (const m of layers.wallet.matches.slice(0, 5)) {
          lines.push(`  Match: ${m.source} — ${m.service || m.entity || 'OFAC SDN'} (${m.chain}, ${m.program})`);
        }
      }
      lines.push(`Sanctioned addresses checked: ${layers.wallet.totalSanctionedAddresses}`);
      lines.push('');
    }
    if (layers.ofacWallet?.matches?.length > 0) {
      lines.push(`--- OFAC SDN WALLET ---`);
      for (const m of layers.ofacWallet.matches.slice(0, 5)) {
        lines.push(`  ${m.name} — ${m.matchType} (${(m.matchConfidence * 100).toFixed(0)}%)`);
      }
      lines.push('');
    }
    if (layers.blockchain) {
      lines.push(`--- BLOCKCHAIN ANALYSIS ---`);
      lines.push(`Risk: ${layers.blockchain.riskAssessment?.score || 0}/100 ${layers.blockchain.riskAssessment?.level || 'N/A'}`);
      lines.push('');
    }
  }

  _formatEntityLayers(lines, layers) {
    // Layer 1: OFAC
    if (layers.ofac) {
      lines.push(`--- OFAC SDN LIST ---`);
      if (layers.ofac.matches?.length > 0) {
        const top = layers.ofac.matches[0];
        lines.push(`🚨 MATCH: ${top.name} (${(top.matchConfidence * 100).toFixed(0)}% confidence)`);
        lines.push(`Type: ${top.type} | Programs: ${(top.programs || []).join(', ')}`);
        if (top.nationality) lines.push(`Nationality: ${top.nationality}`);
        if (top.dateOfBirth) lines.push(`DOB: ${top.dateOfBirth}`);
        if (top.remarks) lines.push(`Remarks: ${top.remarks}`);
        lines.push(`Total matches: ${layers.ofac.matchCount} | SDN entries: ${layers.ofac.totalSDNEntries}`);
        for (const m of layers.ofac.matches.slice(1, 5)) {
          lines.push(`  Also: ${m.name} (${(m.matchConfidence * 100).toFixed(0)}%) [${(m.programs || []).join(', ')}]`);
        }
      } else {
        lines.push(`✓ No match found (${layers.ofac.totalSDNEntries || 0} entries checked)`);
      }
      lines.push('');
    }

    // Layer 1: Sanctions Announcements
    if (layers.announcements) {
      lines.push(`--- SANCTIONS ANNOUNCEMENTS ---`);
      if (layers.announcements.totalFindings > 0) {
        lines.push(`Findings: ${layers.announcements.totalFindings} | Risk: ${layers.announcements.riskDelta?.level || 'N/A'}`);
        if (layers.announcements.riskDelta?.flags?.length > 0) {
          for (const f of layers.announcements.riskDelta.flags) {
            lines.push(`  🚩 [${f.severity}] ${f.message}${f.url ? ` — ${f.url}` : ''}`);
          }
        }
        for (const f of (layers.announcements.findings || []).slice(0, 10)) {
          lines.push(`  - [${f.severity}] ${f.source}: "${f.title}"${f.url ? ` (${f.url})` : ''}${f.date ? ` [${f.date}]` : ''}`);
        }
      } else {
        lines.push(`✓ No sanctions announcements found`);
      }
      lines.push(`Sources: ${Object.entries(layers.announcements.sourcesChecked || {}).map(([k, v]) => `${k}: ${v.count}`).join(', ')}`);
      lines.push('');
    }

    // Layer 1: Web Intelligence
    if (layers.webIntelligence) {
      lines.push(`--- WEB INTELLIGENCE (Claude Web Search) ---`);
      if (layers.webIntelligence.sanctioned) {
        lines.push(`🚨 SANCTIONED — ${layers.webIntelligence.authority || 'Unknown'}`);
        lines.push(`Program: ${layers.webIntelligence.program || 'N/A'} | Date: ${layers.webIntelligence.date || 'N/A'}`);
        lines.push(`Confidence: ${layers.webIntelligence.confidence}`);
      }
      lines.push(`Summary: ${layers.webIntelligence.summary || 'No findings'}`);
      if (layers.webIntelligence.sources?.length > 0) {
        for (const s of layers.webIntelligence.sources) {
          lines.push(`  Source: ${s.title} — ${s.url}`);
        }
      }
      lines.push('');
    }

    // Layer 2: Regulatory
    if (layers.regulatory) {
      lines.push(`--- REGULATORY ENFORCEMENT ---`);
      lines.push(`Risk: ${layers.regulatory.riskAssessment?.score || 0}/100 ${layers.regulatory.riskAssessment?.level || 'LOW'}`);
      if (layers.regulatory.riskAssessment?.flags?.length > 0) {
        for (const f of layers.regulatory.riskAssessment.flags.slice(0, 5)) {
          lines.push(`  [${f.severity}] ${f.message}`);
        }
      }
      const srcKeys = Object.keys(layers.regulatory.sources || {}).filter(k => (layers.regulatory.sources[k]?.matchCount || 0) > 0);
      if (srcKeys.length > 0) {
        lines.push(`Matches from: ${srcKeys.join(', ')}`);
      }
      lines.push('');
    }

    // Layer 3: PEP
    if (layers.pep) {
      lines.push(`--- PEP SCREENING ---`);
      lines.push(`PEP: ${layers.pep.riskAssessment?.isPEP ? 'YES' : 'No'} | Risk: ${layers.pep.riskAssessment?.score || 0}/100`);
      if (layers.pep.riskAssessment?.flags?.length > 0) {
        for (const f of layers.pep.riskAssessment.flags.slice(0, 5)) {
          lines.push(`  [${f.severity}] ${f.message}`);
        }
      }
      lines.push('');
    }

    // Layer 4: Adverse Media
    if (layers.adverseMedia) {
      lines.push(`--- ADVERSE MEDIA ---`);
      lines.push(`Risk delta: ${layers.adverseMedia.riskDelta?.score || 0}/100 ${layers.adverseMedia.riskDelta?.level || 'NONE'}`);
      if (layers.adverseMedia.riskDelta?.flags?.length > 0) {
        for (const f of layers.adverseMedia.riskDelta.flags.slice(0, 5)) {
          lines.push(`  [${f.severity}] ${f.message}`);
        }
      }
      if (layers.adverseMedia.articles?.length > 0) {
        for (const a of layers.adverseMedia.articles.slice(0, 5)) {
          lines.push(`  - "${a.title}" (${a.source}) ${a.url || ''}`);
        }
      }
      lines.push('');
    }

    // Layer 5: Litigation
    if (layers.courtRecords) {
      lines.push(`--- COURT RECORDS ---`);
      lines.push(`Risk: ${layers.courtRecords.riskAssessment?.score || 0}/100`);
      if (layers.courtRecords.riskAssessment?.flags?.length > 0) {
        for (const f of layers.courtRecords.riskAssessment.flags.slice(0, 3)) {
          lines.push(`  [${f.severity}] ${f.message}`);
        }
      }
      lines.push('');
    }
    if (layers.occrp) {
      lines.push(`--- OCCRP / ICIJ ---`);
      lines.push(`Risk: ${layers.occrp.riskAssessment?.score || 0}/100`);
      if (layers.occrp.riskAssessment?.flags?.length > 0) {
        for (const f of layers.occrp.riskAssessment.flags.slice(0, 3)) {
          lines.push(`  [${f.severity}] ${f.message}`);
        }
      }
      lines.push('');
    }

    // Layer 6: Corporate
    if (layers.corporate) {
      lines.push(`--- CORPORATE REGISTRY ---`);
      lines.push(`Risk: ${layers.corporate.riskAssessment?.score || 0}/100`);
      if (layers.corporate.riskAssessment?.flags?.length > 0) {
        for (const f of layers.corporate.riskAssessment.flags.slice(0, 3)) {
          lines.push(`  [${f.severity}] ${f.message}`);
        }
      }
      lines.push('');
    }

    // Layer 7: Shipping
    if (layers.shipping) {
      lines.push(`--- SHIPPING / TRADE ---`);
      lines.push(`Risk: ${layers.shipping.riskAssessment?.score || 0}/100`);
      if (layers.shipping.riskAssessment?.flags?.length > 0) {
        for (const f of layers.shipping.riskAssessment.flags.slice(0, 3)) {
          lines.push(`  [${f.severity}] ${f.message}`);
        }
      }
      lines.push('');
    }
  }
}

module.exports = { ScreeningPipeline };
