#!/usr/bin/env node

/**
 * Seed Export Controls Knowledge Base into Pinecone RAG.
 * Covers BIS (EAR), DDTC (ITAR), NRC (10 CFR 110), DOE (10 CFR 810),
 * multilateral regimes (Wassenaar, NSG, MTCR, Australia Group),
 * joint guidance, enforcement actions, and the Consolidated Screening List.
 *
 * Usage: PINECONE_API_KEY=... node scripts/seed-export-controls.js
 *        PINECONE_API_KEY=... node scripts/seed-export-controls.js --curated-only
 */

const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'regulatory_docs';

// ─── Pinecone helpers ───────────────────────────────────────────────────────

let _client = null;
let _index = null;

function getClient() {
  if (!_client) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) throw new Error('PINECONE_API_KEY not configured');
    _client = new Pinecone({ apiKey });
  }
  return _client;
}

function getIndex() {
  if (!_index) _index = getClient().index(INDEX_NAME);
  return _index;
}

async function embed(text) {
  const client = getClient();
  const result = await client.inference.embed('multilingual-e5-large', [text], {
    inputType: 'passage',
    truncate: 'END'
  });
  return result.data[0].values;
}

function chunkText(text, maxChars = 3200, overlap = 400) {
  if (text.length <= maxChars) return [text];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxChars;
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('. ', end);
      if (lastPeriod > start + maxChars * 0.5) end = lastPeriod + 1;
    }
    chunks.push(text.substring(start, end));
    start = end - overlap;
  }
  return chunks;
}

async function indexChunk(id, text, metadata) {
  const idx = getIndex();
  const vector = await embed(text);
  await idx.namespace(NAMESPACE).upsert([{
    id,
    values: vector,
    metadata: { ...metadata, text: text.substring(0, 1000), timestamp: new Date().toISOString() }
  }]);
}

// ─── Document fetching ──────────────────────────────────────────────────────

async function fetchDocument(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Katharos-RAG/1.0)', 'Accept': '*/*' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    if (url.endsWith('.pdf') || contentType.includes('pdf')) {
      // Skip PDFs — handled by curated chunks
      throw new Error('PDF — use curated summary');
    }
    const html = await res.text();
    return cleanText(stripHtml(html));
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .replace(/\f/g, '\n\n')
    .trim();
}

// ─── Export Control Document Registry ───────────────────────────────────────

const EXPORT_CONTROL_DOCUMENTS = [
  // === 1. BIS — EAR Core Regulations ===
  { id: 'bis-ear-interactive', title: 'EAR Interactive Tool', url: 'https://www.bis.gov/regulations/ear', category: 'export_controls', subcategory: 'ear_core' },
  { id: 'bis-ccl', title: 'Commerce Control List (CCL)', url: 'https://www.bis.gov/regulations/commerce-control-list-ccl', category: 'export_controls', subcategory: 'ear_core' },
  { id: 'bis-entity-list', title: 'Entity List (Supp. 4 to Part 744)', url: 'https://www.bis.gov/entity-list', category: 'export_controls', subcategory: 'ear_core' },
  { id: 'bis-denied-persons', title: 'Denied Persons List', url: 'https://www.bis.gov/denied-persons-list', category: 'export_controls', subcategory: 'ear_core' },
  { id: 'bis-unverified-list', title: 'Unverified List', url: 'https://www.bis.gov/unverified-list', category: 'export_controls', subcategory: 'ear_core' },
  { id: 'bis-meu-list', title: 'Military End User List (Supp. 7 to Part 744)', url: 'https://www.bis.gov/meu-list', category: 'export_controls', subcategory: 'ear_core' },

  // === BIS — Compliance Guidance ===
  { id: 'bis-compliance-guidelines', title: 'Export Compliance Guidelines (8 Elements)', url: 'https://www.bis.gov/compliance-training/export-management-compliance/export-compliance-guidelines', category: 'export_controls', subcategory: 'ear_compliance' },
  { id: 'bis-red-flags', title: 'Red Flags Guidance', url: 'https://www.bis.gov/compliance-training/export-management-compliance/red-flags', category: 'export_controls', subcategory: 'ear_compliance' },
  { id: 'bis-vsd', title: 'Voluntary Self-Disclosure (VSD) Guidelines', url: 'https://www.bis.gov/compliance-training/export-management-compliance/voluntary-self-disclosure', category: 'export_controls', subcategory: 'ear_compliance' },
  { id: 'bis-compliance-toolkit', title: 'Export Compliance Toolkit', url: 'https://www.bis.gov/learn-support/export-compliance-programs/export-compliance-toolkit', category: 'export_controls', subcategory: 'ear_compliance' },
  { id: 'bis-deemed-export', title: 'Deemed Export FAQ', url: 'https://www.bis.gov/deemed-exports', category: 'export_controls', subcategory: 'ear_compliance' },
  { id: 'bis-reexport', title: 'Reexport Guidance', url: 'https://www.bis.gov/licensing/reexports-and-offshore-transactions', category: 'export_controls', subcategory: 'ear_compliance' },

  // === BIS — Financial Institution Guidance ===
  { id: 'bis-fi-guidance-2024', title: 'BIS Guidance to Financial Institutions (Oct 2024)', url: 'https://www.bis.gov/press-release/bis-issues-guidance-financial-institutions-best-practices-compliance-export-administration-regulations', category: 'export_controls', subcategory: 'ear_financial' },

  // === BIS — Russia/Belarus Controls ===
  { id: 'bis-russia-guidance', title: 'Russia Country Guidance', url: 'https://www.bis.gov/licensing/country-guidance/russia', category: 'export_controls', subcategory: 'ear_russia' },
  { id: 'bis-chpl', title: 'Common High Priority List (CHPL)', url: 'https://www.bis.gov/licensing/country-guidance/common-high-priority-items-list-chpl', category: 'export_controls', subcategory: 'ear_russia' },
  { id: 'bis-russia-faq', title: 'Russia Sanctions FAQ', url: 'https://www.bis.gov/russia-belarus-faq', category: 'export_controls', subcategory: 'ear_russia' },
  { id: 'bis-fdpr-russia', title: 'Foreign Direct Product Rules (Russia)', url: 'https://www.bis.gov/foreign-direct-product-rules', category: 'export_controls', subcategory: 'ear_russia' },
  { id: 'bis-fincen-alert-2022', title: 'BIS-FinCEN Joint Alert (June 2022)', url: 'https://www.fincen.gov/news/news-releases/fincen-and-us-department-commerces-bureau-industry-and-security-urge-increased', category: 'export_controls', subcategory: 'ear_russia' },
  { id: 'bis-fincen-alert-2023-nov', title: 'BIS-FinCEN Joint Notice (Nov 2023)', url: 'https://www.bis.gov/press-release/fincen-and-bis-announce-new-reporting-key-term', category: 'export_controls', subcategory: 'ear_russia' },

  // === BIS — China/Advanced Computing ===
  { id: 'bis-china-guidance', title: 'China Country Guidance', url: 'https://www.bis.gov/licensing/country-guidance/china', category: 'export_controls', subcategory: 'ear_china' },

  // === BIS — Enforcement ===
  { id: 'bis-enforcement-actions', title: 'BIS Enforcement Actions', url: 'https://www.bis.gov/enforcement/enforcement-actions', category: 'export_controls', subcategory: 'ear_enforcement' },
  { id: 'doj-strike-force', title: 'Disruptive Technology Strike Force', url: 'https://www.justice.gov/opa/pr/justice-department-launches-disruptive-technology-strike-force', category: 'export_controls', subcategory: 'ear_enforcement' },

  // === BIS — Licensing ===
  { id: 'bis-licensing', title: 'License Application Guidance', url: 'https://www.bis.gov/licensing', category: 'export_controls', subcategory: 'ear_licensing' },
  { id: 'bis-classification', title: 'Classification Requests (CCATS)', url: 'https://www.bis.gov/licensing/commodity-classification', category: 'export_controls', subcategory: 'ear_licensing' },

  // === 2. ITAR (State Department) ===
  { id: 'ddtc-portal', title: 'DDTC Public Portal', url: 'https://www.pmddtc.state.gov/ddtc_public', category: 'export_controls', subcategory: 'itar_core' },
  { id: 'ddtc-compliance-landing', title: 'ITAR Compliance Landing', url: 'https://www.pmddtc.state.gov/ddtc_public?id=ddtc_public_portal_compliance_landing', category: 'export_controls', subcategory: 'itar_compliance' },

  // === 3. NRC — 10 CFR Part 110 ===
  { id: 'nrc-export-overview', title: 'NRC Export/Import Overview', url: 'https://www.nrc.gov/about-nrc/ip/export-import.html', category: 'export_controls', subcategory: 'nrc' },
  { id: 'nrc-licensing', title: 'Export Licensing Procedures', url: 'https://www.nrc.gov/about-nrc/ip/export-import/procedures.html', category: 'export_controls', subcategory: 'nrc' },

  // === 4. DOE — 10 CFR Part 810 ===
  { id: 'doe-810-home', title: 'DOE Part 810 Home', url: 'https://www.energy.gov/nnsa/10-cfr-part-810', category: 'export_controls', subcategory: 'doe_810' },
  { id: 'doe-810-faq', title: 'Part 810 FAQ', url: 'https://www.energy.gov/nnsa/articles/part-810-frequently-asked-questions', category: 'export_controls', subcategory: 'doe_810' },

  // === 5. Multilateral Regimes ===
  { id: 'wassenaar-home', title: 'Wassenaar Arrangement', url: 'https://www.wassenaar.org/', category: 'export_controls', subcategory: 'wassenaar' },
  { id: 'wassenaar-lists', title: 'Wassenaar Control Lists', url: 'https://www.wassenaar.org/control-lists/', category: 'export_controls', subcategory: 'wassenaar' },
  { id: 'wassenaar-best-practices', title: 'Wassenaar Best Practices', url: 'https://www.wassenaar.org/best-practices/', category: 'export_controls', subcategory: 'wassenaar' },
  { id: 'bis-multilateral-overview', title: 'BIS Overview of Multilateral Regimes', url: 'https://www.bis.gov/guidance-frequently-asked-questions/multilateral-export-control-regimes', category: 'export_controls', subcategory: 'wassenaar' },
  { id: 'nsg-home', title: 'Nuclear Suppliers Group', url: 'https://www.nuclearsuppliersgroup.org/', category: 'export_controls', subcategory: 'nsg' },
  { id: 'nsg-guidelines', title: 'NSG Guidelines', url: 'https://www.nuclearsuppliersgroup.org/en/guidelines', category: 'export_controls', subcategory: 'nsg' },
  { id: 'mtcr-home', title: 'Missile Technology Control Regime', url: 'https://mtcr.info/', category: 'export_controls', subcategory: 'mtcr' },
  { id: 'mtcr-annex', title: 'MTCR Annex', url: 'https://mtcr.info/mtcr-annex/', category: 'export_controls', subcategory: 'mtcr' },
  { id: 'ag-home', title: 'Australia Group', url: 'https://www.dfat.gov.au/publications/minisite/theaustraliagroupnet/site/en/index.html', category: 'export_controls', subcategory: 'australia_group' },
  { id: 'ag-control-lists', title: 'Australia Group Control Lists', url: 'https://www.dfat.gov.au/publications/minisite/theaustraliagroupnet/site/en/controllists.html', category: 'export_controls', subcategory: 'australia_group' },

  // === 6. Consolidated Screening List ===
  { id: 'csl-search', title: 'Consolidated Screening List Search Tool', url: 'https://www.trade.gov/consolidated-screening-list', category: 'export_controls', subcategory: 'csl' },
  { id: 'csl-data', title: 'CSL Data Download', url: 'https://www.trade.gov/data/consolidated-screening-list', category: 'export_controls', subcategory: 'csl' },

  // === 7. Joint Guidance ===
  { id: 'triseal-compliance', title: 'Tri-Seal Compliance Note (DOJ/Commerce/Treasury)', url: 'https://www.bis.gov/press-release/commerce-justice-treasury-issue-compliance-note-non-us-persons', category: 'export_controls', subcategory: 'joint_guidance' },
  { id: 'g7-russia-guidance', title: 'G7 Joint Guidance on Russia Evasion', url: 'https://www.bis.gov/press-release/commerce-and-g7-release-joint-guidance-russia-export-control-evasion', category: 'export_controls', subcategory: 'joint_guidance' },
  { id: 'five-eyes-guidance', title: 'Five Eyes Export Enforcement Guidance', url: 'https://www.bis.gov/press-release/quint-seal-export-enforcement-guidance', category: 'export_controls', subcategory: 'joint_guidance' },
  { id: 'iran-uav-guidance', title: 'Iran UAV Guidance (4-agency)', url: 'https://www.bis.gov/press-release/commerce-justice-state-treasury-issue-guidance-iran-uav', category: 'export_controls', subcategory: 'joint_guidance' },

  // === 8. DOJ Export Control Prosecutions ===
  { id: 'doj-nsd-releases', title: 'DOJ National Security Division Press Releases', url: 'https://www.justice.gov/nsd/nsd-press-releases', category: 'export_controls', subcategory: 'ear_enforcement' },
  { id: 'doj-strike-force-cases', title: 'Disruptive Technology Strike Force Cases', url: 'https://www.justice.gov/opa/pr/justice-department-announces-five-cases-part-recently-launched-disruptive-technology-strike', category: 'export_controls', subcategory: 'ear_enforcement' },

  // === 9. DDTC Enforcement ===
  { id: 'ddtc-consent-agreements', title: 'DDTC Consent Agreements', url: 'https://www.pmddtc.state.gov/ddtc_public?id=ddtc_kb_article_page&sys_id=c4c2d6a5db3cd30044f9ff621f961979', category: 'export_controls', subcategory: 'itar_compliance' },
  { id: 'ddtc-charging-letters', title: 'DDTC Charging Letters', url: 'https://www.pmddtc.state.gov/ddtc_public?id=ddtc_kb_article_page&sys_id=b4f2d6a5db3cd30044f9ff621f96199e', category: 'export_controls', subcategory: 'itar_compliance' },

  // === 10. Anti-Boycott ===
  { id: 'bis-antiboycott', title: 'BIS Anti-Boycott Home', url: 'https://www.bis.gov/antiboycott', category: 'export_controls', subcategory: 'anti_boycott' },
  { id: 'bis-boycott-requesters', title: 'Boycott Requester List', url: 'https://www.bis.gov/antiboycott/boycott-requester-list', category: 'export_controls', subcategory: 'anti_boycott' },
  { id: 'bis-antiboycott-reporting', title: 'Anti-Boycott Reporting Requirements', url: 'https://www.bis.gov/antiboycott/reporting-requirements', category: 'export_controls', subcategory: 'anti_boycott' },
  { id: 'bis-antiboycott-examples', title: 'Prohibited Conduct Examples', url: 'https://www.bis.gov/antiboycott/examples', category: 'export_controls', subcategory: 'anti_boycott' },

  // === 11. Country-Specific BIS Controls ===
  { id: 'bis-cuba', title: 'Cuba Export Controls', url: 'https://www.bis.gov/licensing/country-guidance/cuba', category: 'export_controls', subcategory: 'country_controls' },
  { id: 'bis-iran', title: 'Iran Export Controls', url: 'https://www.bis.gov/licensing/country-guidance/iran', category: 'export_controls', subcategory: 'country_controls' },
  { id: 'bis-north-korea', title: 'North Korea Export Controls', url: 'https://www.bis.gov/licensing/country-guidance/north-korea', category: 'export_controls', subcategory: 'country_controls' },
  { id: 'bis-syria', title: 'Syria Export Controls', url: 'https://www.bis.gov/licensing/country-guidance/syria', category: 'export_controls', subcategory: 'country_controls' },
  { id: 'bis-belarus', title: 'Belarus Export Controls', url: 'https://www.bis.gov/licensing/country-guidance/belarus', category: 'export_controls', subcategory: 'country_controls' },

  // === 12. Academic & Research ===
  { id: 'bis-academic', title: 'BIS Academic Outreach', url: 'https://www.bis.gov/academic-outreach', category: 'export_controls', subcategory: 'academic' },
  { id: 'bis-fundamental-research', title: 'Fundamental Research Exclusion FAQ', url: 'https://www.bis.gov/fundamental-research-exclusion', category: 'export_controls', subcategory: 'academic' },
];

// ─── Curated summaries for critical documents ───────────────────────────────

const CURATED_CHUNKS = [
  // === BIS 8 Elements of Export Compliance ===
  {
    id: 'bis-compliance-guidelines',
    title: 'BIS Export Compliance Guidelines — 8 Elements',
    url: 'https://www.bis.gov/compliance-training/export-management-compliance/export-compliance-guidelines',
    category: 'export_controls',
    subcategory: 'ear_compliance',
    chunks: [
      'BIS Export Compliance Program — 8 Essential Elements. The Bureau of Industry and Security (BIS) recommends every exporter implement an Export Management and Compliance Program (EMCP) built on 8 elements: 1) MANAGEMENT COMMITMENT — Senior management sets the tone, allocates resources, and ensures compliance is integrated into business operations. Must include written policy statement, designated Export Compliance Officer (ECO), and adequate budget. 2) RISK ASSESSMENT — Identify and evaluate export compliance risks based on products (ECCN classifications), destinations (Country Chart), end-users (screening), and end-uses (military, WMD). Update annually. 3) EXPORT AUTHORIZATION — Determine license requirements using CCL, Country Chart, end-use/end-user controls (Part 744), and embargo provisions. Apply for BIS licenses when required. Use license exceptions (Part 740) only when all conditions are met. 4) COMPLIANCE PROCEDURES — Written procedures for order screening, classification, license determination, recordkeeping, and reporting. Must cover deemed exports (technology releases to foreign nationals in the US).',
      'BIS Export Compliance — 8 Elements (continued). 5) TRAINING — Regular training for all employees involved in exports: sales, engineering, shipping, legal, management. Cover EAR basics, classification, screening, red flags, license exceptions, deemed exports. Train at onboarding and annually. 6) RECORDKEEPING — Maintain export records for 5 years per EAR Part 762. Records include: export documents, licenses, classification records, end-user statements, technology control plans. 7) INTERNAL AUDITS — Regular audits to test compliance program effectiveness. Audit classifications, screening processes, license conditions, deemed exports, recordkeeping. Use findings to improve procedures. 8) HANDLING VIOLATIONS — Procedures for addressing potential violations: internal investigation, corrective action, and Voluntary Self-Disclosure (VSD) to BIS when appropriate. VSD is a significant mitigating factor in enforcement. BIS may reduce penalties by 50% or more for timely VSDs with full cooperation.',
    ],
  },

  // === Know Your Customer / Red Flags ===
  {
    id: 'bis-kyc-red-flags',
    title: 'BIS Know Your Customer Guidance & Red Flags',
    url: 'https://www.bis.gov/compliance-training/export-management-compliance/red-flags',
    category: 'export_controls',
    subcategory: 'ear_compliance',
    chunks: [
      'BIS Know Your Customer Guidance (Supplement 3 to Part 732). Exporters have a duty to inquire about suspicious circumstances. "Know Your Customer" requires due diligence on: the end-user identity and legitimacy, the stated end-use, whether the product matches the customer\'s line of business, whether the destination is appropriate for the product. KEY RED FLAGS (indicators of possible diversion): 1) Customer is reluctant to provide end-use/end-user information. 2) Product capabilities do not match buyer\'s line of business (e.g., semiconductor equipment ordered by a trading company). 3) Customer declines normal installation, training, or maintenance. 4) Delivery dates are vague or shipping route is unusual for the destination. 5) Packaging inconsistent with destination or mode of transport. 6) Customer is willing to pay cash for expensive items normally financed. 7) Order is for a "civilian" product but the buyer has military connections. 8) Customer\'s address is a P.O. box or residential address for commercial order.',
      'BIS Red Flags (continued). 9) Items ordered are incompatible with the technical level of the destination country. 10) Customer has little or no business background. 11) When questioned, buyer is evasive or gives implausible explanations. 12) Buyer uses shell companies, intermediaries, or front companies in third countries. 13) Freight forwarder is listed as the end-user. 14) Shipment route includes known transshipment points for controlled goods (UAE, Turkey, Malaysia, Singapore, Central Asia). 15) Customer requests atypical documentation or that no US-origin components be visible. OBLIGATION: If red flags are present, exporters must resolve them before proceeding. If red flags cannot be resolved, the export should not proceed and BIS should be notified. Proceeding with knowledge of red flags can result in criminal liability. General Prohibition 10 (GP10): Exporters may not proceed with a transaction knowing or having reason to know it will violate the EAR.',
    ],
  },

  // === EAR General Prohibitions ===
  {
    id: 'bis-general-prohibitions',
    title: 'EAR General Prohibitions (Part 736)',
    url: 'https://www.ecfr.gov/current/title-15/subtitle-B/chapter-VII/subchapter-C/part-736',
    category: 'export_controls',
    subcategory: 'ear_core',
    chunks: [
      'EAR General Prohibitions (15 CFR Part 736). Ten general prohibitions define the scope of EAR restrictions: GP1: EXPORT/REEXPORT — Exporting or reexporting controlled items without required license. GP2: REEXPORT/TRANSFER — Reexporting or transferring (in-country) controlled items without required license. GP3: FOREIGN DIRECT PRODUCT RULE — Exporting foreign-made items that are direct products of US technology/software when destined for Entity List/Country Group D:1/E:1 entities. GP4: DENIED PERSONS — Engaging in any transaction with persons denied export privileges (Denied Persons List). GP5: END-USE/END-USER — Exporting to prohibited end-uses (nuclear, chemical/biological weapons, missile technology) per Part 744. GP6: EMBARGO — Exporting to embargoed destinations (Cuba, Iran, North Korea, Syria, Crimea/DNR/LNR regions). GP7: US PERSON SUPPORT — US persons may not support proliferation activities even for non-US-origin items. GP8: IN-TRANSIT — Unlicensed shipments in transit through the US. GP9: ORDER VIOLATIONS — Placing orders with knowledge that the export will violate EAR. GP10: KNOWLEDGE VIOLATION — Proceeding with transaction knowing or having reason to know it will result in an EAR violation. GP10 is the "catch-all" — applies to all parties in the transaction chain including financial institutions, freight forwarders, and intermediaries.',
    ],
  },

  // === BIS Guidance to Financial Institutions ===
  {
    id: 'bis-fi-guidance-2024',
    title: 'BIS Guidance to Financial Institutions on EAR Compliance (Oct 2024)',
    url: 'https://www.bis.gov/press-release/bis-issues-guidance-financial-institutions-best-practices-compliance-export-administration-regulations',
    category: 'export_controls',
    subcategory: 'ear_financial',
    chunks: [
      'BIS Guidance to Financial Institutions (October 2024). BIS issued formal guidance to financial institutions (FIs) on EAR compliance obligations and best practices. Key points: 1) GENERAL PROHIBITION 10 — Financial institutions can violate the EAR if they proceed with transactions knowing or having reason to know the transaction will facilitate an EAR violation (unlicensed export of controlled items). This applies to: trade finance, letters of credit, payment processing, correspondent banking, insurance. 2) ENTITY LIST SCREENING — FIs should screen transaction parties against the BIS Entity List, Denied Persons List, Unverified List, and Military End User List, in addition to OFAC SDN screening. BIS lists are separate from and complementary to OFAC lists. 3) RED FLAGS FOR FIs — Transactions involving entities on BIS lists, trade finance for dual-use goods destined for countries of concern (Russia, China, Iran), unusual routing of payments for technology/equipment transactions, payments structured to avoid reporting thresholds, customers in sectors associated with WMD/military programs.',
      'BIS Guidance to Financial Institutions (continued). 4) COMMON HIGH PRIORITY LIST (CHPL) — FIs should use the CHPL to identify HS codes for goods most commonly diverted to Russia. When trade finance or payments involve CHPL items destined for Russia, Belarus, or known transshipment countries (Kazakhstan, Uzbekistan, Kyrgyzstan, Georgia, Armenia, Turkey, UAE), enhanced due diligence is warranted. 5) SUSPICIOUS ACTIVITY REPORTS — FinCEN and BIS encourage FIs to file SARs referencing "FIN-2022-RUSSIABIS" key term when identifying potential export control evasion. 6) BEST PRACTICES — Integrate BIS screening lists into existing compliance systems, train staff on export control red flags, coordinate between sanctions and trade compliance teams, implement dual-use goods identification capabilities for trade finance operations, establish escalation procedures for transactions involving controlled items or restricted parties. 7) VOLUNTARY SELF-DISCLOSURE — FIs that discover they facilitated EAR violations should consider filing a VSD with BIS, which serves as a significant mitigating factor.',
    ],
  },

  // === Entity List ===
  {
    id: 'bis-entity-list-overview',
    title: 'BIS Entity List — Overview and Screening Requirements',
    url: 'https://www.bis.gov/entity-list',
    category: 'export_controls',
    subcategory: 'ear_core',
    chunks: [
      'BIS Entity List (Supplement No. 4 to Part 744). The Entity List identifies foreign persons (individuals, organizations, companies) subject to specific license requirements for the export, reexport, or in-country transfer of specified items. Unlike OFAC sanctions (which block all transactions), Entity List entries specify: 1) ITEMS REQUIRING LICENSE — Some entries require licenses for all EAR items (EAR99 and above), others only for specified ECCNs or for items meeting specific parameters. 2) LICENSE REVIEW POLICY — Ranges from "case-by-case" to "presumption of denial" depending on the entry. Most Russia/China military/intelligence entities have presumption of denial. 3) NO LICENSE EXCEPTIONS — Most Entity List entries prohibit the use of license exceptions. Check the specific entry. Screening requirements: All exporters must screen transaction parties against the Entity List before every export, reexport, or transfer. The list is updated frequently (multiple times per month). Use automated screening tools that update with Federal Register notices. Entity List entries include: full names, aliases, addresses, and sometimes specific footnotes. Match on any variation of name or alias.',
      'BIS Entity List — Key Entity Categories. Major categories of listed entities: 1) CHINESE MILITARY COMPANIES — PLA-affiliated entities, defense research institutes, surveillance/AI companies (Huawei, SMIC, SenseTime, Hikvision, iFlytek). 2) RUSSIAN DEFENSE/INTELLIGENCE — Russian defense manufacturers, intelligence services, military research institutes, entities supporting Russia\'s war in Ukraine. 3) IRAN PROLIFERATION — Iranian entities involved in nuclear, missile, and drone programs, IRGC-affiliated companies. 4) WMD PROLIFERATION — Entities worldwide contributing to weapons of mass destruction programs. 5) HUMAN RIGHTS ABUSES — Entities providing surveillance technology used for human rights violations (NSO Group, Candiru). Entity List vs OFAC SDN: Entity List restricts exports of specific items; OFAC SDN blocks all property and prohibits all transactions. An entity can appear on both lists. Compliance programs must screen against both independently. BIS updates the Entity List through Federal Register rules; changes are effective upon publication.',
    ],
  },

  // === ITAR Compliance Program ===
  {
    id: 'ddtc-compliance-program',
    title: 'ITAR Compliance Program Guidelines (DDTC Dec 2022)',
    url: 'https://www.pmddtc.state.gov/sys_attachment.do?sys_id=35c9a068db995f00d0a370131f9619bb',
    category: 'export_controls',
    subcategory: 'itar_compliance',
    chunks: [
      'DDTC ITAR Compliance Program Guidelines (December 2022). The Directorate of Defense Trade Controls (DDTC) expects all registered manufacturers, exporters, and brokers of defense articles to maintain an effective compliance program. Key elements: 1) REGISTRATION — All US persons manufacturing, exporting, or brokering defense articles/services must register with DDTC (22 CFR 122). Registration is mandatory even if no exports are planned. Annual renewal required. Failure to register is a violation. 2) JURISDICTION & CLASSIFICATION — Determine whether items are defense articles on the US Munitions List (USML, 22 CFR 121) or commercial items on the CCL (EAR). DDTC handles commodity jurisdiction (CJ) requests. Items on the USML are subject to ITAR; items on CCL are subject to EAR. 3) AUTHORIZATION — Exports of defense articles require either: a license (DSP-5 for permanent export, DSP-73 for temporary), a Technical Assistance Agreement (TAA) for defense services/technical data, a Manufacturing License Agreement (MLA) for foreign manufacture, or a license exemption (22 CFR 123-126).',
      'DDTC ITAR Compliance (continued). 4) TECHNOLOGY CONTROL — ITAR strictly controls defense technical data (22 CFR 120.33). Any disclosure of technical data to foreign persons (including in the US — "deemed export") requires authorization. Implement Technology Control Plans (TCPs) for facilities with foreign national employees. 5) BROKERING — Brokering activities for defense articles require separate registration and prior approval (22 CFR 129). Applies to US and foreign persons. 6) VOLUNTARY DISCLOSURES — DDTC strongly encourages voluntary disclosure of potential ITAR violations (22 CFR 127.12). VDs are a significant mitigating factor. Must be filed within 60 days of discovery. Include: description of violation, root cause analysis, corrective actions taken. 7) PENALTIES — Criminal: up to $1M per violation, 20 years imprisonment. Civil: up to $1.2M per violation. Administrative: debarment (loss of export privileges). DDTC has increased enforcement, including against individuals. 8) RECORDKEEPING — Maintain all export records for 5 years (22 CFR 122.5). Includes licenses, agreements, CJ determinations, technical data transfer records.',
    ],
  },

  // === Common High Priority Items List (CHPL) ===
  {
    id: 'bis-chpl-guidance',
    title: 'Common High Priority Items List (CHPL) — Russia Export Control Evasion',
    url: 'https://www.bis.gov/licensing/country-guidance/common-high-priority-items-list-chpl',
    category: 'export_controls',
    subcategory: 'ear_russia',
    chunks: [
      'Common High Priority Items List (CHPL) — Russia/Belarus Export Control Evasion. Developed jointly by BIS, EU, Japan, UK, and other coalition partners. The CHPL identifies items most critical to Russia\'s military and industrial capabilities that are being actively sought through evasion networks. HIGH PRIORITY CATEGORIES: 1) ELECTRONICS — Integrated circuits (HS 8542), capacitors, resistors, connectors. Russia needs Western semiconductors for precision-guided munitions, communications equipment, and electronic warfare systems. 2) COMPUTERS & TELECOMMUNICATIONS — Servers, networking equipment, telecom infrastructure. 3) SENSORS & LASERS — Optical equipment, infrared sensors, laser components for targeting and surveillance. 4) NAVIGATION & AVIONICS — GPS/GLONASS receivers, inertial navigation systems, flight instruments. Russia has been unable to produce many avionics components domestically. 5) MARINE EQUIPMENT — Underwater sensors, sonar, propulsion systems for naval applications. 6) MACHINE TOOLS & MANUFACTURING — CNC machines, 3D printing equipment, precision measurement tools essential for weapons manufacturing.',
      'CHPL Evasion Patterns & Red Flags. Common evasion tactics for CHPL items: 1) TRANSSHIPMENT — Items shipped to intermediary countries (Turkey, UAE, Kazakhstan, Uzbekistan, Georgia, Armenia, Kyrgyzstan, China) then diverted to Russia. 2) FRONT COMPANIES — Shell companies in third countries ordering on behalf of Russian end-users. Often newly established with no track record. 3) MISDECLARATION — False HS codes on customs declarations, under-declaring quantities, mislabeling destinations. 4) DISAGGREGATION — Breaking large orders into smaller shipments below reporting thresholds or to avoid attention. 5) ACADEMIC/RESEARCH COVER — Orders placed through universities or research institutes as cover for military procurement. Red flags for financial institutions: Payments involving CHPL HS codes + Russia/Belarus/transshipment country destinations, multiple small transactions to same beneficiary, payments from companies with no apparent business need for dual-use electronics, trade finance for goods with HS codes matching CHPL items.',
    ],
  },

  // === Foreign Direct Product Rules ===
  {
    id: 'bis-fdpr',
    title: 'Foreign Direct Product Rules (FDPR)',
    url: 'https://www.bis.gov/foreign-direct-product-rules',
    category: 'export_controls',
    subcategory: 'ear_russia',
    chunks: [
      'Foreign Direct Product Rules (FDPR) — EAR Part 736, Supplement 2. The FDPR extends US export control jurisdiction to foreign-made items that are the "direct product" of US-origin technology or software, or produced by a plant that is itself a direct product of US technology. KEY FDPR APPLICATIONS: 1) ENTITY LIST FDPR — Foreign-made items that are direct products of US technology/software are subject to EAR when destined for Entity List entities. This is how the US controls Huawei\'s access to semiconductors — even chips made in Taiwan using US-origin chip design software or manufactured on US-origin equipment are subject to EAR. 2) RUSSIA/BELARUS FDPR — Expanded in 2022. Foreign-made items that are direct products of US technology are subject to EAR when destined for Russia or Belarus (with narrow exceptions). This dramatically expanded the scope of items Russia cannot legally obtain. 3) IRAN FDPR — Similar application for Iran-destined items. 4) SUPERCOMPUTER FDPR — Controls foreign items incorporating US technology when destined for supercomputer end-uses in Country Group D:1. Impact: The FDPR is one of the most powerful tools in US export controls because it extends jurisdiction globally. A chip made in any country, using US-origin EDA software or fabricated on US-origin lithography equipment, falls under EAR when destined for a restricted end-user or destination.',
    ],
  },

  // === Advanced Computing / Semiconductor Controls ===
  {
    id: 'bis-semiconductor-controls',
    title: 'Advanced Computing & Semiconductor Controls (China)',
    url: 'https://www.federalregister.gov/documents/2024/12/05/2024-27334/advanced-computing-and-semiconductor-manufacturing-items',
    category: 'export_controls',
    subcategory: 'ear_china',
    chunks: [
      'BIS Advanced Computing and Semiconductor Export Controls — China. Three rounds of controls (Oct 2022, Oct 2023, Dec 2024) targeting China\'s ability to develop advanced semiconductors and AI capabilities. OCTOBER 2022 — Initial controls: 1) Advanced computing chips above specified performance thresholds (TOPS × bit length). 2) Semiconductor manufacturing equipment (SME): deposition, lithography, etch, ion implant, metrology. 3) Supercomputer end-use controls. 4) Entity List additions: YMTC, others. 5) US person restrictions: US persons may not support development/production of advanced chips at fabrication facilities in China. OCTOBER 2023 — Expanded controls: 1) Lowered performance thresholds to capture additional AI chips. 2) Closed "chiplet" loopholes (interconnected dies). 3) Added more SME categories and countries (Macau added to China restrictions). 4) Expanded Entity List. 5) Additional country restrictions to prevent transshipment. DECEMBER 2024 — Further expansion: 1) 140+ Entity List additions (Chinese chip companies, AI firms). 2) Additional SME controls: advanced packaging equipment, EDA tools. 3) HBM (High Bandwidth Memory) controls. 4) Expanded FDPR to more countries to prevent circumvention. 5) New framework for controlling "AI model weights" in development.',
    ],
  },

  // === BIS-FinCEN Joint Alerts ===
  {
    id: 'bis-fincen-joint-alerts',
    title: 'BIS-FinCEN Joint Alerts on Russia Export Control Evasion',
    url: 'https://www.fincen.gov/news/news-releases/fincen-and-us-department-commerces-bureau-industry-and-security-urge-increased',
    category: 'export_controls',
    subcategory: 'ear_russia',
    chunks: [
      'BIS-FinCEN Joint Alert (June 2022) — Increased Vigilance for Export Control Evasion. FinCEN and BIS jointly alerted financial institutions to potential evasion of Russia export controls. KEY GUIDANCE: 1) SAR FILING — FIs should file SARs for suspected export control evasion with key term "FIN-2022-RUSSIABIS" in the narrative. 2) RED FLAGS — Transactions involving Russia-related trade in dual-use goods (electronics, computers, navigation, marine equipment); customers with connections to Russian military/intelligence; unusual shipping patterns through third countries; purchases of controlled items by entities with no apparent need. 3) COORDINATION — BIS and FinCEN will share information from SARs and export enforcement to identify evasion networks. 4) FINANCIAL INSTITUTION ROLE — FIs are uniquely positioned to detect export control evasion through trade finance, wire transfers, and correspondent banking.',
      'BIS-FinCEN Supplemental Alert (May 2023) and Joint Notice (Nov 2023). SUPPLEMENTAL ALERT — Updated red flags and typologies: 1) Third-country intermediaries in Central Asia, Caucasus, Turkey, UAE establishing new trade relationships with Russian entities. 2) Sharp increases in exports of CHPL items to transshipment countries. 3) Use of front companies and complex payment chains to obscure Russian end-users. 4) Mis-invoicing and under/over-valuation of controlled goods. JOINT NOTICE (NOV 2023) — New SAR filing requirement: 1) New key term "FIN-2023-RUSSIABIS" for SARs related to export control evasion through third countries. 2) Expanded HS code list for monitoring (aligned with CHPL). 3) Guidance on enhanced due diligence for trade finance involving dual-use goods and Russia-nexus transactions. 4) Case studies of actual evasion schemes detected through financial intelligence. FIs should update transaction monitoring systems to flag payments involving CHPL HS codes, Entity List parties, and known transshipment corridors.',
    ],
  },

  // === Tri-Seal Compliance Note ===
  {
    id: 'triseal-compliance-note',
    title: 'Tri-Seal Compliance Note — Non-US Persons (DOJ/Commerce/Treasury)',
    url: 'https://www.bis.gov/press-release/commerce-justice-treasury-issue-compliance-note-non-us-persons',
    category: 'export_controls',
    subcategory: 'joint_guidance',
    chunks: [
      'Tri-Seal Compliance Note for Non-US Persons (DOJ, Commerce, Treasury — March 2024). Joint guidance clarifying that non-US persons face enforcement risk under US export controls and sanctions. KEY POINTS: 1) EAR APPLIES TO NON-US PERSONS — The EAR applies to any person worldwide who exports, reexports, or transfers items subject to the EAR. Non-US persons can violate the EAR by reexporting US-origin items or foreign items subject to FDPR. 2) CRIMINAL LIABILITY — DOJ can prosecute non-US persons for conspiracy to violate US export controls, even if no US-origin item is involved, if there is sufficient US nexus (use of US financial system, communications through US, US-person involvement). 3) OFAC SECONDARY SANCTIONS — Non-US persons face secondary sanctions risk for facilitating sanctions evasion. 4) ENTITY LIST — Non-US companies that supply Entity List parties face enforcement action and potential listing themselves. 5) ENFORCEMENT TREND — US government has dramatically increased enforcement against non-US persons and companies since 2022. Includes: extradition requests, Interpol notices, asset seizures, Entity List additions as enforcement tool.',
    ],
  },

  // === G7 / Five Eyes Joint Guidance ===
  {
    id: 'g7-five-eyes-guidance',
    title: 'G7 and Five Eyes Joint Guidance on Russia Export Control Evasion',
    url: 'https://www.bis.gov/press-release/commerce-and-g7-release-joint-guidance-russia-export-control-evasion',
    category: 'export_controls',
    subcategory: 'joint_guidance',
    chunks: [
      'G7 Joint Guidance on Russia Export Control Evasion (2023-2024). Coalition guidance from US, EU, UK, Japan, Canada, Australia. KEY ELEMENTS: 1) COMMON HIGH PRIORITY LIST — Agreed list of items most sought by Russia, with HS codes for customs/financial screening. 2) TRANSSHIPMENT RED FLAGS — Third-country trade pattern changes indicating diversion: sudden spikes in dual-use exports to Central Asia/Caucasus/Turkey/UAE, new companies in these countries ordering electronics/semiconductors with no prior history. 3) INFORMATION SHARING — G7 members sharing intelligence on evasion networks, front companies, and procurement agents. 4) COORDINATED ENFORCEMENT — Simultaneous Entity List/sanctions designations across jurisdictions. Five Eyes Guidance (US/UK/Canada/Australia/New Zealand): Additional focus on: 1) Military procurement networks using academic institutions as cover. 2) Use of cryptocurrency to pay for controlled goods. 3) Exploitation of e-commerce platforms for illicit procurement. 4) Insider threats at technology companies facilitating diversion. 5) Best practices for private sector: enhanced KYC for dual-use goods transactions, end-use monitoring, suspicious order reporting.',
    ],
  },

  // === BIS Penalty Guidelines ===
  {
    id: 'bis-penalty-guidelines',
    title: 'BIS Administrative Penalty Guidelines',
    url: 'https://www.bis.gov/sites/default/files/2024-05/BIS%20Penalty%20Guidelines%20May%202024.pdf',
    category: 'export_controls',
    subcategory: 'ear_enforcement',
    chunks: [
      'BIS Administrative Penalty Guidelines (May 2024). BIS Office of Export Enforcement (OEE) penalty framework for EAR violations. PENALTY CALCULATION: Base penalty is the greater of: $364,992 per violation (adjusted annually for inflation) or twice the value of the transaction. MITIGATING FACTORS (reduce penalty): 1) Voluntary Self-Disclosure — Most significant factor; can reduce base by 50%+. 2) First offense with no prior history. 3) Effective compliance program in place. 4) Full cooperation with investigation. 5) Remedial actions taken promptly. 6) Small transaction value. AGGRAVATING FACTORS (increase penalty): 1) Willful/deliberate violation. 2) Senior management involvement. 3) Prior violations or warnings. 4) Significant harm to national security or foreign policy. 5) Pattern of violations over time. 6) Concealment or obstruction. ENFORCEMENT OUTCOMES: No Action Letter (informal — no public record), Warning Letter (administrative — public), Civil Monetary Penalty (public, can be substantial), Denial of Export Privileges (temporary or permanent — devastating for business), Criminal Referral to DOJ (up to $1M per violation, 20 years imprisonment per count).',
    ],
  },

  // === Voluntary Self-Disclosure ===
  {
    id: 'bis-vsd-guidance',
    title: 'BIS Voluntary Self-Disclosure (VSD) Guidance',
    url: 'https://www.bis.gov/compliance-training/export-management-compliance/voluntary-self-disclosure',
    category: 'export_controls',
    subcategory: 'ear_compliance',
    chunks: [
      'BIS Voluntary Self-Disclosure (VSD) — 15 CFR 764.5. VSD is the single most important mitigating factor in BIS enforcement. REQUIREMENTS: 1) Must be voluntary — not prompted by BIS investigation, subpoena, or enforcement contact. 2) Must be made before BIS contacts the disclosing party about the violations. 3) Initial notification should be filed promptly upon discovery; full narrative within 180 days. CONTENT — VSD must include: description of each violation, dates and parties involved, ECCN classification of items, destination and end-user, root cause analysis, corrective actions taken or planned, dollar value of transactions, how the violation was discovered. BIS RESPONSE — After review: may issue No Action Letter (favorable), Warning Letter, or reduced Civil Monetary Penalty. In practice, VSDs typically result in 50-75% penalty reduction. BIS publishes VSD outcomes to encourage compliance culture. BEST PRACTICE — Companies should: 1) Establish internal VSD procedures, 2) Train employees to recognize and escalate potential violations promptly, 3) Conduct internal investigation before filing, 4) Engage export controls counsel, 5) Implement corrective actions before BIS review.',
    ],
  },

  // === DOE Part 810 Guidance ===
  {
    id: 'doe-810-guidance',
    title: 'DOE 10 CFR Part 810 — Nuclear Technology Export Controls',
    url: 'https://www.energy.gov/sites/default/files/2015/03/f20/Part%20810%20Guidance%20Document%20FINAL.pdf',
    category: 'export_controls',
    subcategory: 'doe_810',
    chunks: [
      'DOE 10 CFR Part 810 — Assistance to Foreign Atomic Energy Activities. Part 810 controls the transfer of unclassified nuclear technology to foreign persons. KEY CONCEPTS: 1) GENERALLY AUTHORIZED ACTIVITIES — Nuclear assistance to countries listed in Appendix A (most allies: UK, France, Japan, etc.) requires only reporting to DOE, not prior authorization. 2) SPECIFICALLY AUTHORIZED ACTIVITIES — Nuclear assistance to all other countries (including China, Russia, India, Pakistan, Israel) requires prior written authorization from DOE/NNSA Secretary. 3) PROHIBITED ACTIVITIES — No authorization will be granted for assistance to: sensitive nuclear technology (enrichment, reprocessing, heavy water production) to non-Appendix A countries, any nuclear assistance to countries under US sanctions. COVERED ACTIVITIES: Transfer of technology for: reactor design/construction, fuel fabrication, uranium conversion, isotope separation, spent fuel reprocessing, heavy water production. Includes: training, consulting, providing technology/software, and "deemed exports" (sharing with foreign nationals in the US). REPORTING: All Part 810 activities (even generally authorized) must be reported to DOE within 30 days. Annual reports required.',
    ],
  },

  // === Anti-Boycott Regulations ===
  {
    id: 'bis-antiboycott-overview',
    title: 'BIS Anti-Boycott Regulations (Part 760)',
    url: 'https://www.bis.gov/antiboycott',
    category: 'export_controls',
    subcategory: 'anti_boycott',
    chunks: [
      'BIS Anti-Boycott Regulations (15 CFR Part 760). US law prohibits US persons from participating in or supporting foreign boycotts not sanctioned by the US government (primarily the Arab League boycott of Israel). PROHIBITED CONDUCT: 1) REFUSING TO DO BUSINESS — Cannot refuse to deal with boycotted countries or their nationals at the request of a boycotting country. 2) DISCRIMINATION — Cannot discriminate against persons based on race, religion, sex, national origin, or nationality at a boycotting country\'s request. 3) FURNISHING INFORMATION — Cannot provide information about business relationships with boycotted countries or persons, or about the religion, race, or national origin of employees. 4) LETTERS OF CREDIT — Cannot implement, comply with, or pay boycott-related terms in letters of credit. 5) NEGATIVE CERTIFICATES OF ORIGIN — Cannot certify that goods did not originate in a boycotted country (affirmative origin certificates ARE permitted). REPORTING: All boycott-related requests must be reported to BIS within 30 days, even if the request is refused. Failure to report is a separate violation. Penalties: Civil penalties up to $364,992 per violation. Criminal penalties: fines and imprisonment. Tax consequences: loss of foreign tax credits, denial of tax deferral benefits.',
    ],
  },
];

// ─── Main seeding function ──────────────────────────────────────────────────

async function seed() {
  const curatedOnly = process.argv.includes('--curated-only');

  console.log(`\n=== Export Controls RAG Seeder ===`);
  console.log(`Index: ${INDEX_NAME} | Namespace: ${NAMESPACE}`);
  if (curatedOnly) console.log(`Mode: Curated summaries only\n`);
  else console.log(`Documents to process: ${EXPORT_CONTROL_DOCUMENTS.length}\n`);

  let totalChunks = 0;
  let failedDocs = 0;
  let skippedDocs = 0;

  // ─── Phase 1: Fetch and index web documents ───────────────────────────
  if (!curatedOnly) {
    console.log(`--- Phase 1: Web Documents (${EXPORT_CONTROL_DOCUMENTS.length} documents) ---\n`);

    for (const doc of EXPORT_CONTROL_DOCUMENTS) {
      process.stdout.write(`[${doc.id}] Fetching "${doc.title}"... `);

      let text;
      try {
        text = await fetchDocument(doc.url);
      } catch (err) {
        console.log(`FETCH FAILED: ${err.message}`);
        failedDocs++;
        continue;
      }

      if (!text || text.length < 100) {
        console.log(`SKIPPED (too short: ${text?.length || 0} chars)`);
        skippedDocs++;
        continue;
      }

      console.log(`${text.length} chars`);

      const chunks = chunkText(text);
      console.log(`  → ${chunks.length} chunk(s)`);

      for (let i = 0; i < chunks.length; i++) {
        const chunkId = chunks.length === 1 ? doc.id : `${doc.id}-chunk-${i + 1}`;
        const metadata = {
          source: getSource(doc.subcategory),
          category: doc.category,
          subcategory: doc.subcategory,
          title: doc.title,
          url: doc.url,
          chunkIndex: i,
          totalChunks: chunks.length,
        };

        try {
          await indexChunk(chunkId, chunks[i], metadata);
          process.stdout.write(`  ✓ ${chunkId}\n`);
          totalChunks++;
        } catch (err) {
          process.stdout.write(`  ✗ ${chunkId}: ${err.message}\n`);
        }

        if (i < chunks.length - 1) await sleep(200);
      }

      await sleep(500);
    }
  }

  // ─── Phase 2: Seed curated chunks ─────────────────────────────────────
  console.log(`\n--- Phase 2: Curated Summaries (${CURATED_CHUNKS.length} documents) ---\n`);

  for (const doc of CURATED_CHUNKS) {
    console.log(`[${doc.id}] Seeding curated "${doc.title}" (${doc.chunks.length} chunks)`);

    for (let i = 0; i < doc.chunks.length; i++) {
      const chunkId = doc.chunks.length === 1 ? doc.id : `${doc.id}-chunk-${i + 1}`;
      const metadata = {
        source: getSource(doc.subcategory),
        category: doc.category,
        subcategory: doc.subcategory,
        title: doc.title,
        url: doc.url,
        chunkIndex: i,
        totalChunks: doc.chunks.length,
        curated: true,
      };

      try {
        await indexChunk(chunkId, doc.chunks[i], metadata);
        process.stdout.write(`  ✓ ${chunkId}\n`);
        totalChunks++;
      } catch (err) {
        process.stdout.write(`  ✗ ${chunkId}: ${err.message}\n`);
      }

      if (i < doc.chunks.length - 1) await sleep(200);
    }

    await sleep(500);
  }

  console.log(`\n=== Done ===`);
  if (!curatedOnly) {
    console.log(`Web documents processed: ${EXPORT_CONTROL_DOCUMENTS.length - failedDocs - skippedDocs}/${EXPORT_CONTROL_DOCUMENTS.length}`);
    console.log(`Fetch failures: ${failedDocs} | Skipped: ${skippedDocs}`);
  }
  console.log(`Curated documents: ${CURATED_CHUNKS.length}`);
  console.log(`Total chunks indexed: ${totalChunks}`);
}

function getSource(subcategory) {
  const sourceMap = {
    ear_core: 'BIS/Commerce',
    ear_compliance: 'BIS/Commerce',
    ear_financial: 'BIS/Commerce',
    ear_russia: 'BIS/Commerce',
    ear_china: 'BIS/Commerce',
    ear_enforcement: 'BIS/Commerce',
    ear_licensing: 'BIS/Commerce',
    itar_core: 'DDTC/State',
    itar_compliance: 'DDTC/State',
    itar_licensing: 'DDTC/State',
    nrc: 'NRC',
    doe_810: 'DOE/NNSA',
    wassenaar: 'Wassenaar/Multilateral',
    nsg: 'NSG/Multilateral',
    mtcr: 'MTCR/Multilateral',
    australia_group: 'Australia Group/Multilateral',
    csl: 'Commerce/Trade',
    joint_guidance: 'Interagency',
    anti_boycott: 'BIS/Commerce',
    country_controls: 'BIS/Commerce',
    academic: 'BIS/Commerce',
  };
  return sourceMap[subcategory] || 'Export Controls';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

seed().catch(err => {
  console.error('\nSeed failed:', err);
  process.exit(1);
});
