#!/usr/bin/env node

/**
 * Seed Corruption, Anti-Corruption & Additional Financial Crimes into Pinecone RAG.
 * Covers FCPA, FEPA, Public Integrity, Money Laundering, Kleptocracy,
 * Antitrust/Cartels, Tax Fraud, Whistleblower Programs, Bank Fraud Statutes,
 * and International Conventions (UNCAC, UNTOC, OECD, FATF).
 *
 * Usage: PINECONE_API_KEY=... node scripts/seed-corruption-financial-crimes-docs.js
 *        PINECONE_API_KEY=... node scripts/seed-corruption-financial-crimes-docs.js --curated-only
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
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ').trim();
}

function cleanText(text) {
  return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/\s{2,}/g, ' ').replace(/\f/g, '\n\n').trim();
}

// ─── Fetchable web pages ────────────────────────────────────────────────────

const WEB_DOCUMENTS = [
  // ──── 1. FCPA — DOJ & SEC ────
  { id: 'doj-fcpa-home', title: 'DOJ FCPA Unit Home', url: 'https://www.justice.gov/criminal/criminal-fraud/foreign-corrupt-practices-act', category: 'fcpa', subcategory: 'doj' },
  { id: 'doj-fcpa-resource-guide', title: 'FCPA Resource Guide (2nd Edition)', url: 'https://www.justice.gov/criminal/criminal-fraud/fcpa-resource-guide', category: 'fcpa', subcategory: 'doj' },
  { id: 'doj-fcpa-statutes', title: 'FCPA Statutes & Regulations', url: 'https://www.justice.gov/criminal/criminal-fraud/statutes-regulations', category: 'fcpa', subcategory: 'doj' },
  { id: 'doj-fcpa-opinions', title: 'FCPA Opinion Procedure', url: 'https://www.justice.gov/criminal/criminal-fraud/fcpa-opinions', category: 'fcpa', subcategory: 'doj' },
  { id: 'doj-fcpa-corporate-enforcement', title: 'FCPA Corporate Enforcement Policy', url: 'https://www.justice.gov/criminal/criminal-fraud/corporate-enforcement-policy', category: 'fcpa', subcategory: 'doj' },
  { id: 'doj-jm-fcpa', title: 'Justice Manual — FCPA (JM 9-47.000)', url: 'https://www.justice.gov/jm/jm-9-47000-foreign-corrupt-practices-act-1977', category: 'fcpa', subcategory: 'doj' },
  { id: 'doj-fcpa-enforcement-am', title: 'FCPA Enforcement Actions A-M', url: 'https://www.justice.gov/criminal/criminal-fraud/enforcement-actions-m', category: 'fcpa', subcategory: 'doj' },
  { id: 'doj-fcpa-enforcement-nz', title: 'FCPA Enforcement Actions N-Z', url: 'https://www.justice.gov/criminal/criminal-fraud/enforcement-actions-n-z', category: 'fcpa', subcategory: 'doj' },
  { id: 'sec-fcpa-spotlight', title: 'SEC FCPA Spotlight', url: 'https://www.sec.gov/spotlight/fcpa.shtml', category: 'fcpa', subcategory: 'sec' },
  { id: 'sec-fcpa-enforcement', title: 'SEC FCPA Enforcement Cases', url: 'https://www.sec.gov/enforce/sec-enforcement-fcpa-cases', category: 'fcpa', subcategory: 'sec' },

  // ──── 2. Public Integrity — DOJ PIN ────
  { id: 'doj-pin-home', title: 'DOJ Public Integrity Section Home', url: 'https://www.justice.gov/criminal/criminal-pin', category: 'public_corruption', subcategory: 'doj_pin' },
  { id: 'doj-pin-about', title: 'About Public Integrity Section', url: 'https://www.justice.gov/criminal/criminal-pin/about', category: 'public_corruption', subcategory: 'doj_pin' },
  { id: 'doj-pin-cases', title: 'Public Integrity Section Cases', url: 'https://www.justice.gov/criminal/criminal-pin/public-integrity-sections-cases', category: 'public_corruption', subcategory: 'doj_pin' },
  { id: 'doj-pin-by-district', title: 'PIN Cases by District', url: 'https://www.justice.gov/criminal/criminal-pin/cases-district', category: 'public_corruption', subcategory: 'doj_pin' },
  { id: 'doj-pin-subject-areas', title: 'PIN Cases by Subject Area', url: 'https://www.justice.gov/criminal/criminal-pin/subject-areas', category: 'public_corruption', subcategory: 'doj_pin' },
  { id: 'doj-pin-significant', title: 'PIN Significant Cases', url: 'https://www.justice.gov/criminal/criminal-pin/significant-cases', category: 'public_corruption', subcategory: 'doj_pin' },
  { id: 'doj-pin-annual-reports', title: 'PIN Annual Reports to Congress', url: 'https://www.justice.gov/criminal/criminal-pin/annual-reports', category: 'public_corruption', subcategory: 'doj_pin' },
  { id: 'doj-election-crimes', title: 'DOJ Election Crimes Branch', url: 'https://www.justice.gov/criminal/criminal-pin/election-crimes-branch', category: 'public_corruption', subcategory: 'doj_pin' },
  { id: 'doj-jm-public-integrity', title: 'Justice Manual — Protection of Government Integrity (JM 9-85.000)', url: 'https://www.justice.gov/jm/jm-9-85000-protection-government-integrity', category: 'public_corruption', subcategory: 'doj' },

  // ──── 3. Money Laundering & Asset Forfeiture — DOJ MNF ────
  { id: 'doj-mnf-home', title: 'DOJ Money Laundering & Forfeiture Section (MNF)', url: 'https://www.justice.gov/criminal-mlars', category: 'money_laundering', subcategory: 'doj_mnf' },
  { id: 'doj-mnf-news', title: 'MNF/MLARS News', url: 'https://www.justice.gov/criminal/money-laundering-and-asset-recovery-section-mlars-news', category: 'money_laundering', subcategory: 'doj_mnf' },
  { id: 'doj-mnf-publications', title: 'MNF/MLARS Publications', url: 'https://www.justice.gov/criminal/criminal-mlars/publications', category: 'money_laundering', subcategory: 'doj_mnf' },
  { id: 'doj-asset-forfeiture-program', title: 'DOJ Asset Forfeiture Program', url: 'https://www.justice.gov/criminal-mlars/asset-forfeiture-program', category: 'asset_forfeiture', subcategory: 'doj_mnf' },
  { id: 'doj-asset-forfeiture-manual', title: 'Asset Forfeiture Policy Manual', url: 'https://www.justice.gov/criminal-mlars/asset-forfeiture-policy-manual', category: 'asset_forfeiture', subcategory: 'doj_mnf' },
  { id: 'doj-equitable-sharing', title: 'DOJ Equitable Sharing Program', url: 'https://www.justice.gov/criminal-mlars/equitable-sharing-program', category: 'asset_forfeiture', subcategory: 'doj_mnf' },
  { id: 'doj-forfeiture-victims', title: 'DOJ Asset Forfeiture Victims Program', url: 'https://www.justice.gov/criminal-mlars/victims-program', category: 'asset_forfeiture', subcategory: 'doj_mnf' },
  { id: 'doj-jm-money-laundering', title: 'Justice Manual — Money Laundering (JM 9-105.000)', url: 'https://www.justice.gov/jm/jm-9-105000-money-laundering', category: 'money_laundering', subcategory: 'doj' },
  { id: 'doj-jm-forfeiture', title: 'Justice Manual — Forfeiture/Seizure (JM 9-111.000)', url: 'https://www.justice.gov/jm/jm-9-111000-forfeitureseizure', category: 'asset_forfeiture', subcategory: 'doj' },

  // ──── 4. Kleptocracy & International Corruption ────
  { id: 'doj-kleptocapture', title: 'Task Force KleptoCapture (Russia/Ukraine)', url: 'https://www.justice.gov/opa/pr/attorney-general-merrick-b-garland-announces-launch-task-force-kleptocapture', category: 'kleptocracy', subcategory: 'doj' },
  { id: 'star-worldbank-home', title: 'Stolen Asset Recovery (StAR) Initiative', url: 'https://star.worldbank.org/', category: 'kleptocracy', subcategory: 'international' },
  { id: 'star-worldbank-about', title: 'About StAR Initiative', url: 'https://star.worldbank.org/about-star', category: 'kleptocracy', subcategory: 'international' },
  { id: 'unodc-asset-recovery', title: 'UNODC Asset Recovery', url: 'https://www.unodc.org/unodc/en/corruption/asset-recovery.html', category: 'kleptocracy', subcategory: 'international' },
  { id: 'uncac-convention', title: 'UN Convention Against Corruption (UNCAC)', url: 'https://www.unodc.org/unodc/en/treaties/CAC/index.html', category: 'international_conventions', subcategory: 'uncac' },

  // ──── 5. Antitrust / Cartel Crimes ────
  { id: 'doj-antitrust-criminal', title: 'DOJ Antitrust Criminal Enforcement', url: 'https://www.justice.gov/atr/criminal-enforcement', category: 'antitrust', subcategory: 'doj_atr' },
  { id: 'doj-antitrust-report', title: 'DOJ Report Antitrust Violations', url: 'https://www.justice.gov/atr/report-violations', category: 'antitrust', subcategory: 'doj_atr' },
  { id: 'doj-antitrust-leniency', title: 'DOJ Antitrust Leniency Program', url: 'https://www.justice.gov/atr/leniency-program', category: 'antitrust', subcategory: 'doj_atr' },
  { id: 'doj-pcsf-home', title: 'Procurement Collusion Strike Force (PCSF)', url: 'https://www.justice.gov/atr/procurement-collusion-strike-force', category: 'antitrust', subcategory: 'doj_atr' },
  { id: 'healthy-competition', title: 'HealthyCompetition.gov — Healthcare Antitrust', url: 'https://www.healthycompetition.gov', category: 'antitrust', subcategory: 'healthcare' },

  // ──── 6. Tax Fraud — IRS Criminal Investigation ────
  { id: 'irs-ci-home', title: 'IRS Criminal Investigation Home', url: 'https://www.irs.gov/compliance/criminal-investigation', category: 'tax_fraud', subcategory: 'irs_ci' },
  { id: 'irs-report-fraud', title: 'IRS Report Tax Fraud', url: 'https://www.irs.gov/help/report-fraud/report-tax-fraud-a-scam-or-law-violation', category: 'tax_fraud', subcategory: 'irs_ci' },
  { id: 'irs-ci-fraud-alerts', title: 'IRS-CI Tax Fraud Alerts', url: 'https://www.irs.gov/compliance/criminal-investigation/tax-fraud-alerts', category: 'tax_fraud', subcategory: 'irs_ci' },
  { id: 'irs-ci-emphasis-areas', title: 'IRS-CI Program & Emphasis Areas', url: 'https://www.irs.gov/compliance/criminal-investigation/program-and-emphasis-areas-for-irs-criminal-investigation', category: 'tax_fraud', subcategory: 'irs_ci' },
  { id: 'irs-ci-how-initiated', title: 'How IRS Criminal Investigations Are Initiated', url: 'https://www.irs.gov/compliance/criminal-investigation/how-criminal-investigations-are-initiated', category: 'tax_fraud', subcategory: 'irs_ci' },
  { id: 'irs-ci-statistics', title: 'IRS-CI Annual Report / Statistics', url: 'https://www.irs.gov/statistics/criminal-investigation-statistics', category: 'tax_fraud', subcategory: 'irs_ci' },
  { id: 'irs-irm-criminal-statutes', title: 'IRM 9.1.3 — Criminal Statutory Provisions', url: 'https://www.irs.gov/irm/part9/irm_09-001-003', category: 'tax_fraud', subcategory: 'irs_ci' },
  { id: 'irs-irm-fraud-development', title: 'IRM 25.1.2 — Recognizing & Developing Fraud', url: 'https://www.irs.gov/irm/part25/irm_25-001-002', category: 'tax_fraud', subcategory: 'irs_ci' },
  { id: 'irs-whistleblower', title: 'IRS Whistleblower Office', url: 'https://www.irs.gov/compliance/whistleblower-office', category: 'whistleblower', subcategory: 'irs' },
  { id: 'irs-ofe', title: 'IRS Office of Fraud Enforcement', url: 'https://www.irs.gov/about-irs/office-of-fraud-enforcement-at-a-glance', category: 'tax_fraud', subcategory: 'irs' },

  // ──── 7. Whistleblower Programs ────
  { id: 'sec-whistleblower-home', title: 'SEC Whistleblower Program Home', url: 'https://www.sec.gov/enforcement-litigation/whistleblower-program', category: 'whistleblower', subcategory: 'sec' },
  { id: 'sec-whistleblower-tips', title: 'SEC Submit a Whistleblower Tip', url: 'https://www.sec.gov/enforcement-litigation/whistleblower-program/information-about-submitting-whistleblower-tip', category: 'whistleblower', subcategory: 'sec' },
  { id: 'sec-whistleblower-faqs', title: 'SEC Whistleblower FAQs', url: 'https://www.sec.gov/enforcement-litigation/whistleblower-program/whistleblower-frequently-asked-questions', category: 'whistleblower', subcategory: 'sec' },
  { id: 'sec-whistleblower-protections', title: 'SEC Whistleblower Protections', url: 'https://www.sec.gov/enforcement-litigation/whistleblower-program/whistleblower-protections', category: 'whistleblower', subcategory: 'sec' },
  { id: 'cftc-whistleblower', title: 'CFTC Whistleblower Program', url: 'https://www.cftc.gov/whistleblower', category: 'whistleblower', subcategory: 'cftc' },

  // ──── 8. Bank Fraud & Property Crime Statutes ────
  { id: 'doj-bank-fraud-1344', title: 'Bank Fraud (18 USC 1344)', url: 'https://www.justice.gov/archives/jm/criminal-resource-manual-826-applicability-18-usc-1344', category: 'bank_fraud_statutes', subcategory: 'doj' },
  { id: 'doj-bank-robbery-2113', title: 'Bank Robbery/Larceny (18 USC 2113)', url: 'https://www.justice.gov/archives/jm/criminal-resource-manual-1349-bank-robbery-general-overview', category: 'bank_fraud_statutes', subcategory: 'doj' },
  { id: 'doj-embezzlement-641', title: 'Embezzlement of Government Property (18 USC 641)', url: 'https://www.justice.gov/archives/jm/criminal-resource-manual-1638-embezzlement-government-property-18-usc-641', category: 'bank_fraud_statutes', subcategory: 'doj' },
  { id: 'doj-theft-bribery-666', title: 'Theft/Bribery in Federal Programs (18 USC 666)', url: 'https://www.justice.gov/archives/jm/criminal-resource-manual-1002-theft-and-bribery-federally-funded-programs', category: 'bank_fraud_statutes', subcategory: 'doj' },
  { id: 'doj-conspiracy-371', title: 'Conspiracy to Defraud U.S. (18 USC 371)', url: 'https://www.justice.gov/archives/jm/criminal-resource-manual-923-18-usc-371-conspiracy-defraud-us', category: 'bank_fraud_statutes', subcategory: 'doj' },
  { id: 'doj-access-device-fraud', title: 'Access Device Fraud (18 USC 1029)', url: 'https://www.justice.gov/archives/jm/criminal-resource-manual-1029-fraudulent-presentment-and-related-unauthorized-credit-card', category: 'bank_fraud_statutes', subcategory: 'doj' },
  { id: 'doj-jm-property-crimes', title: 'Justice Manual — Crimes Involving Property (JM 9-61.000)', url: 'https://www.justice.gov/jm/jm-9-61000-crimes-involving-property', category: 'bank_fraud_statutes', subcategory: 'doj' },

  // ──── 9. International Conventions ────
  { id: 'uncac-signatories', title: 'UNCAC Signatories', url: 'https://www.unodc.org/unodc/en/treaties/CAC/signatories.html', category: 'international_conventions', subcategory: 'uncac' },
  { id: 'uncac-cosp', title: 'UNCAC Conference of States Parties', url: 'https://www.unodc.org/unodc/en/corruption/COSP/conference-of-the-states-parties.html', category: 'international_conventions', subcategory: 'uncac' },
  { id: 'untoc-convention', title: 'UN Convention Against Transnational Organized Crime (UNTOC)', url: 'https://www.unodc.org/unodc/en/organized-crime/intro/UNTOC.html', category: 'international_conventions', subcategory: 'untoc' },
  { id: 'oecd-anti-bribery', title: 'OECD Anti-Bribery Convention', url: 'https://www.oecd.org/corruption/oecdantibriberyconvention.htm', category: 'international_conventions', subcategory: 'oecd' },
  { id: 'oecd-bribery-working-group', title: 'OECD Working Group on Bribery', url: 'https://www.oecd.org/corruption/anti-bribery/', category: 'international_conventions', subcategory: 'oecd' },
  { id: 'fatf-corruption-guidance', title: 'FATF Corruption Guidance', url: 'https://www.fatf-gafi.org/en/topics/corruption.html', category: 'international_conventions', subcategory: 'fatf' },

  // ──── 10. Additional DOJ Resources ────
  { id: 'doj-criminal-resource-manual', title: 'DOJ Criminal Resource Manual Archive', url: 'https://www.justice.gov/archives/jm/criminal-resource-manual', category: 'legal_reference', subcategory: 'doj' },
];

// ─── Curated PDF / complex page summaries ────────────────────────────────────

const CURATED_CHUNKS = [
  // ──── FCPA Resource Guide (PDF) ────
  {
    id: 'fcpa-resource-guide-overview',
    title: 'FCPA Resource Guide — Overview & Anti-Bribery Provisions',
    chunks: [`FCPA Resource Guide (2nd Edition, 2020) — Overview: The Foreign Corrupt Practices Act (FCPA), enacted in 1977, has two main components: anti-bribery provisions (enforced by DOJ) and accounting/books-and-records provisions (enforced by SEC). The FCPA prohibits paying, offering, or promising anything of value to foreign government officials to obtain or retain business.

Anti-Bribery Provisions (15 USC 78dd-1 to 78dd-3): Apply to three categories: (1) issuers of securities registered in the U.S. or required to file SEC reports, (2) "domestic concerns" (U.S. citizens, nationals, residents, and entities organized under U.S. law), and (3) any person who acts within U.S. territory in furtherance of a corrupt payment. Elements: (a) use of interstate commerce (mail, phone, wire, travel), (b) corrupt intent, (c) payment/offer/promise of anything of value, (d) to a foreign official, political party, or candidate, (e) to influence an official act, induce a violation of duty, secure an improper advantage, or direct business.

Defenses: (1) local law defense — payment was lawful under the written laws of the foreign country, (2) reasonable and bona fide expenditure defense — payment directly related to product promotion or contract performance (e.g., travel for product demonstration). Facilitating payments exception: small payments to expedite routine governmental action (e.g., processing visas, providing police protection) are exempted, though DOJ and SEC have interpreted this narrowly.

Penalties — criminal: individuals face up to 5 years imprisonment and $250,000 fine per violation; entities face up to $2 million per violation. Alternative fines up to twice the gain/loss. Civil penalties up to $16,000-$223,000 per violation.`,

`FCPA Resource Guide — Accounting Provisions, Compliance & Enforcement: The FCPA's accounting provisions (15 USC 78m) require issuers to: (1) make and keep books, records, and accounts that accurately reflect transactions (books and records provision), and (2) devise and maintain a system of internal accounting controls sufficient to provide reasonable assurances about transaction authorization and asset accountability (internal controls provision). These provisions apply regardless of whether a bribe occurred — inaccurate books and records alone violate the FCPA.

Third-party liability: companies can be liable for FCPA violations committed by agents, consultants, distributors, and joint venture partners. Key risk factors: use of third-party agents in high-risk countries, unusually high commissions, payments to bank accounts in third countries, lack of transparency in agent's qualifications. DOJ/SEC expect companies to conduct risk-based due diligence on all third-party intermediaries.

Corporate Enforcement Policy (updated): DOJ provides presumption of declination (no prosecution) for companies that: (1) voluntarily self-disclose misconduct, (2) fully cooperate with investigation, (3) timely and appropriately remediate. Compliance program elements DOJ evaluates: tone at the top, policies and procedures, risk assessment, training, third-party management, M&A due diligence, investigation and remediation, reporting mechanisms.

FEPA — Foreign Extortion Prevention Act (2024): New statute (18 USC 1352) criminalizes the demand side of foreign bribery. Makes it a federal crime for foreign officials to demand or accept bribes from U.S. persons. Penalties: up to 15 years imprisonment and fines. This complements the FCPA (which targets bribe payers) by targeting bribe demanders.`],
    metadata: { source: 'DOJ/SEC', documentType: 'resource_guide', category: 'fcpa', subcategory: 'doj', url: 'https://www.justice.gov/criminal/criminal-fraud/fcpa-resource-guide' }
  },

  // ──── DAG Memo / FCPA Guidelines ────
  {
    id: 'doj-fcpa-dag-memo',
    title: 'DOJ Deputy Attorney General FCPA Guidelines Memo',
    chunks: [`DOJ Deputy Attorney General FCPA Guidelines: The DAG memo provides updated guidance on FCPA enforcement priorities and corporate compliance expectations. Key elements:

Voluntary Self-Disclosure: Companies that voluntarily disclose FCPA violations receive presumption of declination from prosecution. For self-disclosure to qualify, it must be: (1) made prior to an imminent threat of disclosure or government investigation, (2) accompanied by full cooperation including provision of all relevant facts, (3) followed by thorough remediation. Companies that self-disclose and meet all criteria can expect no criminal charges in most cases.

Cooperation Credit: DOJ evaluates cooperation quality including: timely preservation of documents, identification of individuals substantially involved in misconduct, production of facts and evidence (including from foreign jurisdictions), proactive disclosure of relevant conduct, de-confliction with government investigations, and making individuals available for interviews.

Compliance Program Assessment: DOJ evaluates three fundamental questions: (1) Is the compliance program well-designed? (adequate policies, risk assessment, training, third-party management, M&A integration), (2) Is it being applied earnestly and in good faith? (adequate resources, authority of compliance function, incentives and discipline), (3) Does it work in practice? (continuous improvement, testing, investigation outcomes, culture of compliance).

Monitors: DOJ will impose compliance monitors only when necessary and tailored to specific risks identified. The burden of a monitor is considered in reaching resolutions. Companies with effective remediation may avoid monitors entirely. Successor liability: acquiring companies have obligation to conduct FCPA due diligence in M&A; DOJ gives credit for timely self-disclosure of misconduct discovered during acquisition.`],
    metadata: { source: 'DOJ', documentType: 'policy_memo', category: 'fcpa', subcategory: 'doj', url: 'https://www.justice.gov/dag/media/1403031' }
  },

  // ──── Election Crimes Manual (PDF) ────
  {
    id: 'doj-election-crimes-manual',
    title: 'DOJ Election Crimes Manual',
    chunks: [`DOJ Federal Prosecution of Election Offenses (Election Crimes Manual): This manual provides guidance on identifying and prosecuting federal election crimes. Key categories:

1. Patronage Crimes: Using government employment, contracts, or benefits to influence votes. Includes Hatch Act violations (5 USC 7321-7326), coercion of federal employees' political activity, and using official authority to interfere with elections.

2. Campaign Finance Crimes: Violations of Federal Election Campaign Act (FECA) including exceeding contribution limits, making/receiving prohibited contributions (foreign nationals, government contractors, straw donors), failure to report contributions, and using campaign funds for personal use. Conduit/straw donor schemes involve funneling contributions through intermediaries to circumvent limits.

3. Vote Buying: Paying or offering to pay voters for voting or registering (18 USC 597, 42 USC 1973i). Includes providing gifts, jobs, or other benefits in exchange for votes.

4. Voter Fraud: Fraudulent voter registration, multiple voting, voting by ineligible persons (non-citizens, felons where prohibited), absentee ballot fraud, and ballot box stuffing. Note: DOJ policy requires consultation with the Election Crimes Branch before initiating investigations.

5. Civil Rights Violations: Voter intimidation (18 USC 594), deprivation of voting rights under color of law (18 USC 242), conspiracy against rights (18 USC 241). These statutes protect the right to vote free from coercion, intimidation, or discrimination.

Jurisdictional notes: Federal jurisdiction exists when federal candidates are on the ballot, when federal funds are involved, or when constitutional voting rights are implicated. Many election crimes also have state-law counterparts.`],
    metadata: { source: 'DOJ', documentType: 'manual', category: 'public_corruption', subcategory: 'doj_pin', url: 'https://www.justice.gov/criminal/file/1029066/download' }
  },

  // ──── Money Laundering Statutes (PDF compilation) ────
  {
    id: 'doj-money-laundering-statutes',
    title: 'Key Federal Money Laundering & Structuring Statutes',
    chunks: [`Federal Money Laundering, Structuring & Related Statutes — Comprehensive Overview:

18 USC 1956 — Laundering of Monetary Instruments: The primary federal money laundering statute. Criminalizes conducting or attempting to conduct financial transactions involving proceeds of "specified unlawful activity" (SUA), knowing the transaction is designed to: (a) promote the carrying on of SUA, (b) conceal or disguise the nature, source, location, ownership, or control of proceeds, (c) avoid transaction reporting requirements, or (d) evade taxes. Also covers international transportation of funds with intent to promote SUA or conceal proceeds. Maximum penalty: 20 years imprisonment and $500,000 fine (or twice the amount laundered). SUAs include virtually all federal felonies: fraud, drug trafficking, terrorism financing, bribery, counterfeiting, smuggling, cybercrime, and more.

18 USC 1957 — Engaging in Monetary Transactions in Property Derived from SUA: Criminalizes knowingly engaging in monetary transactions (deposits, withdrawals, transfers, exchanges) exceeding $10,000 involving criminally derived property. Broader than 1956 — does not require intent to conceal or promote; merely engaging in the transaction is sufficient if the defendant knows the funds are from a crime. Maximum penalty: 10 years imprisonment.

18 USC 1960 — Unlicensed Money Transmitting Business: Criminalizes operating a money transmitting business without required state licensing or FinCEN registration, or transmitting funds known to be from criminal proceeds or intended for illegal activity. Applied to unlicensed cryptocurrency exchanges, hawala networks, and informal value transfer systems. Maximum penalty: 5 years imprisonment.

31 USC 5324 — Structuring: Criminalizes structuring financial transactions to evade Bank Secrecy Act reporting requirements (Currency Transaction Reports for transactions over $10,000). Includes breaking up deposits/withdrawals into smaller amounts, using multiple accounts or banks, and directing others to conduct structured transactions. No requirement to prove the underlying funds are illegal — the act of structuring itself is the crime. Maximum penalty: 5 years imprisonment (10 years if connected to another crime).

31 USC 5332 — Bulk Cash Smuggling: Criminalizes knowingly concealing more than $10,000 in currency or monetary instruments and transporting (or attempting to transport) them across U.S. borders. Applies to incoming and outgoing cash. Maximum penalty: 5 years imprisonment. Subject to civil and criminal forfeiture.`],
    metadata: { source: 'DOJ', documentType: 'statutory_reference', category: 'money_laundering', subcategory: 'doj_mnf', url: 'https://www.justice.gov/criminal-mlars/file/1146911/download' }
  },

  // ──── AG Asset Forfeiture Guidelines (PDF) ────
  {
    id: 'doj-ag-forfeiture-guidelines',
    title: 'Attorney General Asset Forfeiture Guidelines (2018)',
    chunks: [`Attorney General's Guidelines on the Asset Forfeiture Program (2018): These guidelines govern DOJ's use of civil and criminal asset forfeiture as a law enforcement tool. Key elements:

Types of forfeiture: (1) Criminal forfeiture — in personam action as part of criminal prosecution; property is forfeited as part of defendant's sentence. (2) Civil forfeiture — in rem action against the property itself; no criminal conviction required; government must prove by preponderance of evidence that property is connected to criminal activity. (3) Administrative forfeiture — used for property valued under $500,000 (excluding real property); no court proceeding required unless owner files a claim.

Safeguards and limitations: adoptive seizures (where federal agencies adopt state/local seizures) are restricted to property valued at $10,000+ or involving public safety concerns. Federal agencies must provide notice to property owners within 60 days. Innocent owner defense available in civil forfeiture. Property must have substantial connection to criminal activity.

Equitable Sharing Program: allows federal agencies to share forfeited assets with state and local law enforcement that participated in the investigation. Sharing percentages range from 20-80% depending on level of participation. Receiving agencies must use shared funds for law enforcement purposes. Annual certification and audit requirements.

Priority of claims: victim restitution takes precedence over forfeiture in cases where there are identifiable victims. The DOJ Victims Program manages distribution of forfeited assets to crime victims, having returned billions to victims of fraud, money laundering, and other financial crimes.`],
    metadata: { source: 'DOJ', documentType: 'guidelines', category: 'asset_forfeiture', subcategory: 'doj_mnf', year: '2018', url: 'https://www.justice.gov/criminal/criminal-mlars/file/1123146/dl' }
  },

  // ──── Task Force KleptoCapture ────
  {
    id: 'doj-kleptocapture-overview',
    title: 'Task Force KleptoCapture — Russia Sanctions Enforcement',
    chunks: [`DOJ Task Force KleptoCapture: Launched in March 2022 in response to Russia's invasion of Ukraine, this interagency task force enforces sanctions, export control restrictions, and economic countermeasures against Russian oligarchs, elites, and entities. Led by DOJ with participation from FBI, DHS, IRS-CI, Treasury, State Department, and other agencies.

Focus areas: (1) Sanctions evasion — identifying and prosecuting individuals who evade economic sanctions imposed on Russian persons and entities, including through shell companies, nominees, and complex ownership structures. (2) Export control violations — enforcing restrictions on export of dual-use technologies, advanced semiconductors, and other controlled items to Russia. (3) Asset seizure and forfeiture — identifying, freezing, and forfeiting assets of sanctioned Russian oligarchs including yachts, real estate, aircraft, bank accounts, and cryptocurrency holdings.

Key actions: seized and forfeited hundreds of millions in assets, brought criminal charges against sanctions evaders and export control violators, coordinated with international partners (EU, UK, Australia, Japan) through the Russian Elites, Proxies, and Oligarchs (REPO) Task Force. The task force has targeted complex schemes including: use of shell companies in third countries, cryptocurrency transactions to move sanctioned funds, front companies purchasing restricted technology, and real estate holdings concealed through layered ownership structures.

Legal authorities: International Emergency Economic Powers Act (IEEPA), Export Control Reform Act (ECRA), money laundering statutes (18 USC 1956/1957), conspiracy (18 USC 371), and sanctions-specific criminal provisions.`],
    metadata: { source: 'DOJ', documentType: 'program_overview', category: 'kleptocracy', subcategory: 'doj', url: 'https://www.justice.gov/opa/pr/attorney-general-merrick-b-garland-announces-launch-task-force-kleptocapture' }
  },

  // ──── StAR Reports (PDFs) ────
  {
    id: 'star-initiative-overview',
    title: 'Stolen Asset Recovery (StAR) Initiative — World Bank/UNODC',
    chunks: [`Stolen Asset Recovery (StAR) Initiative: A joint World Bank-UNODC partnership launched in 2007 to help developing countries recover stolen assets hidden in foreign jurisdictions. Based on Chapter V of the UN Convention Against Corruption (UNCAC), which established a framework for international asset recovery.

Scale of the problem: An estimated $20-40 billion is stolen annually from developing countries through corruption and hidden offshore. Only a small fraction is ever recovered. Major barriers include: complex multi-jurisdictional legal proceedings, bank secrecy laws, difficulty tracing assets through shell companies and trusts, limited capacity in requesting countries, and political will in both requesting and requested countries.

StAR activities: (1) Country-level support — helping countries build legal frameworks and institutional capacity for asset recovery. (2) Knowledge products — research, guides, and databases on asset recovery techniques. (3) Advocacy — promoting international cooperation and legal reform. (4) Asset Recovery Watch — tracking cross-border corruption cases and recovery efforts globally.

Key resources: Non-Conviction Based (NCB) asset forfeiture guide — how countries can recover assets through civil forfeiture without requiring criminal conviction (critical when suspects are deceased, fled, or immune from prosecution). Asset recovery process: (a) identify and trace stolen assets, (b) freeze/restrain assets to prevent dissipation, (c) confiscate through criminal or civil proceedings, (d) return assets to country of origin.

UNCAC requirements: State parties must provide mutual legal assistance in asset recovery, consider returning confiscated property to prior legitimate owners, and take measures to permit other states to initiate civil proceedings for asset recovery in their courts.`],
    metadata: { source: 'World Bank/UNODC', documentType: 'program_overview', category: 'kleptocracy', subcategory: 'international', url: 'https://star.worldbank.org/' }
  },

  // ──── Antitrust Price Fixing Primer (PDF) ────
  {
    id: 'doj-price-fixing-primer',
    title: 'DOJ Antitrust Price Fixing & Bid Rigging Primer',
    chunks: [`DOJ Antitrust Division — Price Fixing, Bid Rigging, and Market Allocation Primer: This guide explains the three primary types of criminal antitrust violations:

Price Fixing: An agreement among competitors to raise, fix, or maintain prices. Per se illegal under the Sherman Act (15 USC 1) — no justification or defense is accepted. Examples: agreements on minimum prices, price increases, elimination of discounts, standardization of credit terms, or adoption of standard formulas for computing prices. Price fixing need not result in uniform prices — any agreement affecting prices violates the law.

Bid Rigging: Competing firms agree on which company will submit the winning bid on contracts. Forms include: (1) bid suppression — one or more competitors agree not to bid, (2) complementary (cover) bidding — competitors submit intentionally high bids to ensure a designated winner, (3) bid rotation — competitors take turns being the low bidder, (4) market division — competitors divide markets by geography, customer, or product and submit non-competitive bids outside their assigned market.

Market Allocation: Competitors divide markets among themselves by: territory (geographic allocation), customers (each competitor gets exclusive customer accounts), or products/services. Each participant then has a monopoly in their allocated segment.

Detection red flags: identical bids, sequential bid rotation patterns, unexplained bid withdrawals, subcontracting among supposed competitors, sudden and uniform price increases, unusual bidding patterns in public procurement. DOJ Antitrust Leniency Program: first company to self-report cartel activity and cooperate receives immunity from criminal prosecution. Individuals can also receive leniency.

Penalties: Sherman Act violations carry maximum penalties of $100 million for corporations and $1 million and 10 years imprisonment for individuals. Courts can impose fines up to twice the gain or loss.`],
    metadata: { source: 'DOJ Antitrust Division', documentType: 'primer', category: 'antitrust', subcategory: 'doj_atr', url: 'https://www.justice.gov/atr/page/file/1091651/download' }
  },

  // ──── IRS Tax Crimes Handbook (PDF) ────
  {
    id: 'irs-tax-crimes-handbook',
    title: 'IRS Tax Crimes Handbook — Key Provisions',
    chunks: [`IRS Chief Counsel Tax Crimes Handbook — Key Statutes and Provisions:

26 USC 7201 — Tax Evasion: The most serious tax crime. Requires: (1) existence of a tax deficiency, (2) an affirmative act of evasion, and (3) willfulness. Affirmative acts include filing false returns, concealing assets, destroying records, and using nominees. Maximum penalty: 5 years imprisonment and $250,000 fine ($500,000 for corporations).

26 USC 7206(1) — Filing False Returns: Making false statements under penalties of perjury on any return, statement, or document. Does not require a tax deficiency — the false statement itself is the crime. Maximum penalty: 3 years imprisonment and $250,000 fine.

26 USC 7206(2) — Aiding/Assisting in False Returns: Applies to tax preparers, accountants, and others who assist in preparing false returns. Does not require knowledge of the specific false items.

26 USC 7203 — Failure to File: Willful failure to file required returns, make required reports, keep required records, or pay required taxes. Misdemeanor with maximum 1 year imprisonment (except for certain employment tax violations which carry 5 years).

26 USC 7212 — Obstruction/Impeding IRS: Attempting to interfere with the administration of the Internal Revenue Code. Includes threats, corrupt solicitations, and attempts to obstruct.

Related non-tax charges frequently paired with tax crimes: 18 USC 1956/1957 (money laundering), 18 USC 371 (conspiracy), 18 USC 1341/1343 (mail/wire fraud), 31 USC 5324 (structuring). IRS-CI commonly investigates tax evasion schemes involving cryptocurrency, offshore accounts (FATCA/FBAR violations), nominee entities, and cash-intensive businesses. FBAR (FinCEN Form 114) — failure to report foreign bank accounts exceeding $10,000 in aggregate carries civil penalties up to $100,000 per violation and criminal penalties under 31 USC 5322.`],
    metadata: { source: 'IRS', documentType: 'handbook', category: 'tax_fraud', subcategory: 'irs_ci', url: 'https://www.irs.gov/pub/irs-counsel/tax_crimes_handbook.pdf' }
  },

  // ──── SEC Whistleblower Annual Report (PDF) ────
  {
    id: 'sec-whistleblower-annual-2025',
    title: 'SEC Whistleblower Program FY 2025 Annual Report',
    chunks: [`SEC Whistleblower Program FY 2025 Annual Report: Since inception in 2011, the SEC Whistleblower Program has awarded over $2.2 billion to whistleblowers whose tips led to successful enforcement actions. The program has become one of the most significant tools in SEC enforcement.

Key statistics: The SEC received over 24,000 whistleblower tips in FY 2025, a continuing uptrend. Awards range from 10-30% of monetary sanctions collected in enforcement actions exceeding $1 million. The largest single award exceeded $279 million. Tips have originated from over 130 countries, demonstrating the program's global reach.

Award criteria: Whistleblowers must provide original information (not derived from legal representation, audit, or compliance functions) that leads to successful enforcement action. Information must be submitted via SEC Form TCR (Tips, Complaints, and Referrals). Anonymous submission is permitted if represented by counsel. Employment-related retaliation protections: employers cannot discharge, demote, suspend, threaten, harass, or discriminate against whistleblowers.

Top allegation categories: offering/securities fraud, market manipulation, corporate disclosures/financial statements, insider trading, FCPA violations, trading/pricing issues, and unregistered offerings. The program has been instrumental in uncovering Ponzi schemes, accounting fraud, insider trading rings, and FCPA violations that might otherwise go undetected. DOJ, CFTC, and IRS also operate significant whistleblower programs with substantial awards.`],
    metadata: { source: 'SEC', documentType: 'annual_report', category: 'whistleblower', subcategory: 'sec', year: '2025', url: 'https://www.sec.gov/files/fy25-annual-whistleblower-report.pdf' }
  },

  // ──── OECD Anti-Bribery Convention ────
  {
    id: 'oecd-anti-bribery-overview',
    title: 'OECD Convention on Combating Bribery of Foreign Public Officials',
    chunks: [`OECD Anti-Bribery Convention (1997): The Convention on Combating Bribery of Foreign Public Officials in International Business Transactions establishes legally binding standards to criminalize bribery of foreign public officials in international business transactions. Currently 46 state parties including all OECD members plus key non-member countries (Argentina, Brazil, Bulgaria, Colombia, Costa Rica, Peru, Russia [suspended], South Africa, Ukraine).

Key obligations: Each party must make it a criminal offense to offer, promise, or give any undue advantage to a foreign public official to obtain or retain business. Parties must provide effective, proportionate, and dissuasive penalties (criminal, civil, or administrative). The convention requires adequate accounting standards and penalties for falsifying books and records.

Working Group on Bribery: Monitors implementation through a rigorous peer review process (Phase 1-4 evaluations). Reviews each country's legal framework, enforcement record, and practical implementation. Issues public recommendations and follows up on implementation. Publishes annual enforcement data showing significant variation in enforcement activity across parties — the U.S. accounts for the majority of enforcement actions globally.

Relationship to FCPA: The FCPA predates and inspired the OECD Convention. The convention's provisions are modeled on FCPA anti-bribery provisions. The convention expanded the international consensus against foreign bribery, creating a more level playing field for companies operating across borders. Key differences from FCPA: the convention does not include an accounting/books-and-records provision; enforcement varies significantly by country; some parties have enacted laws broader than the convention's minimum requirements.`],
    metadata: { source: 'OECD', documentType: 'convention_overview', category: 'international_conventions', subcategory: 'oecd', url: 'https://www.oecd.org/corruption/oecdantibriberyconvention.htm' }
  },

  // ──── UNCAC Overview ────
  {
    id: 'uncac-overview',
    title: 'UN Convention Against Corruption (UNCAC) — Comprehensive Overview',
    chunks: [`UN Convention Against Corruption (UNCAC): Adopted in 2003 and entered into force in 2005, UNCAC is the only legally binding universal anti-corruption instrument. With 190 state parties, it has near-universal coverage. The convention addresses five main areas:

Chapter II — Preventive Measures: Requires state parties to establish anti-corruption bodies, implement transparent public procurement, promote integrity in the public and private sectors, establish codes of conduct for public officials, implement financial disclosure requirements, and take measures to prevent money laundering.

Chapter III — Criminalization: Requires criminalization of: bribery of national and foreign public officials, embezzlement/misappropriation by public officials, trading in influence, abuse of functions, and illicit enrichment. Also addresses private sector bribery, embezzlement, laundering proceeds of crime, concealment, and obstruction of justice.

Chapter IV — International Cooperation: Mandates mutual legal assistance, extradition, joint investigations, and transfer of criminal proceedings between state parties. Establishes framework for information exchange and cooperation between law enforcement agencies.

Chapter V — Asset Recovery: The landmark innovation of UNCAC. Establishes framework for return of stolen assets to countries of origin. Provisions include: direct recovery through civil litigation, international cooperation in confiscation, return and disposal of confiscated property, and creation of financial intelligence units. Article 51 states that "return of assets is a fundamental principle of this Convention."

Chapter VI — Technical Assistance & Information Exchange: Promotes capacity building, training, and research. Establishes Conference of States Parties (COSP) as review mechanism. Implementation Review Mechanism (IRM) launched in 2010 provides peer review of each state party's compliance.`],
    metadata: { source: 'UNODC', documentType: 'convention_overview', category: 'international_conventions', subcategory: 'uncac', url: 'https://www.unodc.org/unodc/en/treaties/CAC/index.html' }
  },

  // ──── Corruption & Financial Crime Reporting Quick Reference ────
  {
    id: 'corruption-reporting-quick-reference',
    title: 'Reporting Corruption & Financial Crimes — Quick Reference',
    chunks: [`Reporting Corruption & Financial Crimes — Quick Reference:

Foreign Bribery (FCPA): DOJ FCPA Unit — email FCPA.Fraud@usdoj.gov or SEC Whistleblower Program (sec.gov/whistleblower) for securities-related violations. Awards of 10-30% of sanctions over $1M.
Foreign Extortion (FEPA): DOJ FCPA Unit — same contact (FCPA.Fraud@usdoj.gov). FEPA targets foreign officials who demand bribes.
Domestic Public Corruption: FBI (tips.fbi.gov) + DOJ Public Integrity Section. Covers bribery, fraud by government officials, election crimes, and abuse of office.
Central America Corruption: FBI — combatiendocorrupcion@fbi.gov (Northern Triangle Anticorruption Task Force).
Kleptocracy/Foreign Official Corruption: DOJ MNF Section — kleptocracy@usdoj.gov. Covers stolen assets by foreign officials hidden in U.S. and abroad.
Russia Sanctions Evasion: Task Force KleptoCapture — through DOJ, FBI, and Treasury/OFAC.
Securities Fraud/Market Manipulation: SEC Whistleblower (sec.gov/whistleblower) — awards 10-30% of sanctions over $1M.
Commodity/Futures/Forex Fraud: CFTC (cftc.gov/complaint) — CFTC whistleblower awards 10-30%.
Antitrust/Cartel Activity: DOJ Antitrust Division (justice.gov/atr/report-violations) — Leniency Program for first reporter.
Procurement Collusion: DOJ Procurement Collusion Strike Force (PCSF) Tip Center.
Tax Fraud: IRS-CI (irs.gov/compliance/whistleblower-office) — IRS Whistleblower awards 15-30% for claims over $2M.
Money Laundering: File SAR with FinCEN + report to FBI + DOJ MNF Section.
Healthcare Fraud: HHS-OIG Hotline (oig.hhs.gov/fraud/report-fraud) — qui tam under False Claims Act.
Bank Fraud: FBI + relevant banking regulator (OCC, FDIC, Federal Reserve).
Election Crimes: DOJ Election Crimes Branch (DOJ Public Integrity Section).`],
    metadata: { source: 'Multi-Agency', documentType: 'reference', category: 'corruption_reporting', subcategory: 'interagency', url: 'N/A' }
  },

  // ──── Bank Fraud & Property Crime Statutes Reference ────
  {
    id: 'bank-fraud-statutes-reference',
    title: 'Federal Bank Fraud, Embezzlement & Property Crime Statutes — Reference',
    chunks: [`Federal Bank Fraud, Embezzlement & Property Crime Statutes — Comprehensive Reference:

18 USC 1344 — Bank Fraud: Knowingly executing a scheme to defraud a financial institution or obtain money/property from a financial institution through false pretenses. Maximum: 30 years imprisonment, $1M fine. Key element: the institution must be federally insured (FDIC). Covers check kiting, loan fraud, credit card fraud, account takeover, and other schemes targeting banks.

18 USC 2113 — Bank Robbery & Larceny: Covers robbery, larceny, and burglary of banks. Graduated penalties: simple larceny (1 year), robbery/extortion (20 years), armed robbery (25 years), robbery causing death (death penalty or life imprisonment).

18 USC 641 — Embezzlement of Government Property: Theft, embezzlement, or conversion of government money, property, or records. Maximum: 10 years for amounts over $1,000; 1 year for amounts under $1,000.

18 USC 656 — Theft/Embezzlement by Bank Officers/Employees: Insider theft by officers, directors, agents, or employees of banks. Maximum: 30 years imprisonment, $1M fine. Covers both direct theft and self-dealing transactions.

18 USC 666 — Theft/Bribery in Federal Programs: Theft, embezzlement, or bribery involving organizations receiving over $10,000 in federal funds annually. Maximum: 10 years imprisonment. Applies to state/local government, universities, hospitals, and other entities receiving federal funding.

18 USC 1346 — Honest Services Fraud: Scheme to deprive another of the "intangible right of honest services" through bribery or kickbacks. Used in public corruption and corporate fraud cases. After Skilling v. United States (2010), limited to bribery and kickback schemes.

18 USC 1029 — Access Device Fraud: Fraud using counterfeit, stolen, or unauthorized access devices (credit cards, debit cards, ATM cards, account numbers, PINs). Maximum: 10-20 years depending on offense. Covers production, trafficking, and use of counterfeit access devices.

18 USC 371 — Conspiracy to Defraud the United States: Two or more persons conspiring to defraud the U.S. or any agency thereof. Maximum: 5 years imprisonment. Frequently charged alongside substantive offenses to capture the agreement and coordinated conduct.`],
    metadata: { source: 'DOJ', documentType: 'statutory_reference', category: 'bank_fraud_statutes', subcategory: 'doj', url: 'https://www.justice.gov/jm/jm-9-61000-crimes-involving-property' }
  },
];

// ─── Main execution ──────────────────────────────────────────────────────────

async function main() {
  const curatedOnly = process.argv.includes('--curated-only');

  console.log('\n=== Corruption & Financial Crimes Knowledge Base RAG Seeder ===');
  console.log(`Index: ${INDEX_NAME} | Namespace: ${NAMESPACE}`);
  console.log(`Web docs: ${WEB_DOCUMENTS.length} | Curated: ${CURATED_CHUNKS.length}`);

  let webSuccess = 0, webFail = 0, totalChunks = 0;

  // Phase 1: Web pages
  if (!curatedOnly) {
    console.log(`\n--- Phase 1: Web Pages (${WEB_DOCUMENTS.length} documents) ---\n`);
    for (const doc of WEB_DOCUMENTS) {
      process.stdout.write(`[${doc.id}] Fetching "${doc.title}"... `);
      try {
        const text = await fetchDocument(doc.url);
        console.log(`${text.length} chars`);
        const chunks = chunkText(text);
        console.log(`  → ${chunks.length} chunk(s)`);
        for (let i = 0; i < chunks.length; i++) {
          const chunkId = chunks.length === 1 ? doc.id : `${doc.id}-chunk-${i + 1}`;
          await indexChunk(chunkId, chunks[i], {
            source: doc.title,
            documentType: 'web_page',
            category: doc.category,
            subcategory: doc.subcategory,
            url: doc.url,
            namespace: NAMESPACE,
          });
          console.log(`  ✓ ${chunkId}`);
          totalChunks++;
        }
        webSuccess++;
      } catch (err) {
        console.log(`FETCH FAILED: ${err.message}`);
        webFail++;
      }
    }
  }

  // Phase 2: Curated summaries
  console.log(`\n--- Phase 2: Curated Summaries (${CURATED_CHUNKS.length} documents) ---\n`);
  for (const doc of CURATED_CHUNKS) {
    console.log(`[${doc.id}] Seeding "${doc.title}" (${doc.chunks.length} chunks)`);
    for (let i = 0; i < doc.chunks.length; i++) {
      const chunkId = doc.chunks.length === 1 ? doc.id : `${doc.id}-chunk-${i + 1}`;
      await indexChunk(chunkId, doc.chunks[i], {
        source: doc.metadata.source || doc.title,
        documentType: doc.metadata.documentType || 'curated_summary',
        category: doc.metadata.category || 'corruption',
        subcategory: doc.metadata.subcategory || 'general',
        url: doc.metadata.url || '',
        year: doc.metadata.year || '',
        namespace: NAMESPACE,
      });
      console.log(`  ✓ ${chunkId}`);
      totalChunks++;
    }
  }

  console.log('\n=== Done ===');
  if (!curatedOnly) console.log(`Web documents: ${webSuccess}/${WEB_DOCUMENTS.length}`);
  console.log(`Curated summaries: ${CURATED_CHUNKS.length}`);
  console.log(`Total chunks indexed: ${totalChunks}`);
  if (webFail > 0) console.log(`Fetch failures: ${webFail}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
