#!/usr/bin/env node

/**
 * Seed Comprehensive Fraud & Financial Crime Knowledge Base into Pinecone RAG.
 * Covers DOJ, FBI/IC3, SEC, FTC, CFTC, FINRA, HHS-OIG, OCC, Secret Service,
 * USPIS, Federal Reserve, FDIC, CFPB, NASAA, and interagency resources.
 *
 * Usage: PINECONE_API_KEY=... node scripts/seed-fraud-crime-docs.js
 *        PINECONE_API_KEY=... node scripts/seed-fraud-crime-docs.js --curated-only
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
  // ──── DOJ — Justice Manual / Fraud Statutes ────
  { id: 'doj-mail-wire-fraud-manual', title: 'DOJ Justice Manual — Mail Fraud & Wire Fraud (JM 9-43.000)', url: 'https://www.justice.gov/jm/jm-9-43000-mail-fraud-and-wire-fraud', category: 'fraud_statutes', subcategory: 'doj' },
  { id: 'doj-wire-fraud-elements', title: 'Elements of Wire Fraud (18 USC 1343)', url: 'https://www.justice.gov/archives/jm/criminal-resource-manual-941-18-usc-1343-elements-wire-fraud', category: 'fraud_statutes', subcategory: 'doj' },
  { id: 'doj-mail-fraud-elements', title: 'Elements of Mail Fraud (18 USC 1341)', url: 'https://www.justice.gov/archives/jm/criminal-resource-manual-940-18-usc-section-1341-elements-mail-fraud', category: 'fraud_statutes', subcategory: 'doj' },
  { id: 'doj-conspiracy-mail-wire', title: 'Conspiracy to Violate Mail/Wire Fraud Statutes', url: 'https://www.justice.gov/archives/jm/criminal-resource-manual-965-conspiracy-violate-mail-fraud-or-wire-fraud-statutes', category: 'fraud_statutes', subcategory: 'doj' },
  { id: 'doj-fraud-financial-institution', title: 'Fraud Affecting Financial Institution', url: 'https://www.justice.gov/archives/jm/criminal-resource-manual-958-fraud-affecting-financial-institution', category: 'fraud_statutes', subcategory: 'doj' },
  { id: 'doj-venue-wire-fraud', title: 'Venue in Wire Fraud', url: 'https://www.justice.gov/archives/jm/criminal-resource-manual-967-venue-wire-fraud', category: 'fraud_statutes', subcategory: 'doj' },

  // DOJ Criminal Division — Fraud Section
  { id: 'doj-fraud-section-home', title: 'DOJ Criminal Fraud Section Home', url: 'https://www.justice.gov/criminal/criminal-fraud', category: 'fraud_enforcement', subcategory: 'doj' },
  { id: 'doj-report-fraud', title: 'DOJ Report Fraud', url: 'https://www.justice.gov/criminal/criminal-fraud/report-fraud', category: 'fraud_enforcement', subcategory: 'doj' },

  // DOJ Civil Division — False Claims Act / FIRREA
  { id: 'doj-civil-fraud-practice', title: 'DOJ Civil Fraud Section Practice Areas', url: 'https://www.justice.gov/civil/practice-areas-0', category: 'fraud_enforcement', subcategory: 'doj' },

  // DOJ National Center for Disaster Fraud
  { id: 'doj-disaster-fraud', title: 'National Center for Disaster Fraud (NCDF)', url: 'https://www.justice.gov/disaster-fraud', category: 'fraud_enforcement', subcategory: 'doj' },

  // ──── FBI — IC3 & Cyber/Financial Crimes ────
  { id: 'ic3-home', title: 'IC3 Internet Crime Complaint Center Home', url: 'https://www.ic3.gov', category: 'cyber_fraud', subcategory: 'fbi' },
  { id: 'ic3-annual-reports', title: 'IC3 Annual Reports Archive', url: 'https://www.ic3.gov/Home/AnnualReports', category: 'cyber_fraud', subcategory: 'fbi' },
  { id: 'ic3-psas', title: 'IC3 Public Service Announcements', url: 'https://www.ic3.gov/Home/PSAs', category: 'cyber_fraud', subcategory: 'fbi' },
  { id: 'fbi-cyber-division', title: 'FBI Cyber Division', url: 'https://www.fbi.gov/investigate/cyber', category: 'cyber_fraud', subcategory: 'fbi' },
  { id: 'fbi-financial-crimes', title: 'FBI Financial Crimes / White-Collar Crime', url: 'https://www.fbi.gov/investigate/white-collar-crime', category: 'fraud_enforcement', subcategory: 'fbi' },
  { id: 'fbi-operation-level-up', title: 'FBI Operation Level Up (Pig Butchering)', url: 'https://www.fbi.gov/how-we-can-help-you/victim-services/national-crimes-and-victim-resources/operation-level-up', category: 'fraud_enforcement', subcategory: 'fbi' },
  { id: 'fbi-scams-safety', title: 'FBI Scams & Safety', url: 'https://www.fbi.gov/scams-and-safety', category: 'consumer_protection', subcategory: 'fbi' },

  // ──── SEC — Division of Enforcement & Investor Alerts ────
  { id: 'sec-enforcement-home', title: 'SEC Division of Enforcement / Protecting You', url: 'https://www.sec.gov/Protecting-You', category: 'securities_fraud', subcategory: 'sec' },
  { id: 'sec-investor-alerts', title: 'SEC All Investor Alerts', url: 'https://www.sec.gov/investor/alerts', category: 'securities_fraud', subcategory: 'sec' },
  { id: 'sec-pump-dump', title: 'SEC Pump-and-Dump Schemes Alert', url: 'https://www.sec.gov/investor/alerts/ia_pumpanddump.htm', category: 'securities_fraud', subcategory: 'sec' },
  { id: 'sec-microcap-fraud', title: 'SEC Microcap Fraud Archive', url: 'https://www.sec.gov/spotlight/microcap/microcap-fraud-archive.shtml', category: 'securities_fraud', subcategory: 'sec' },

  // ──── FTC — Consumer Protection & Fraud Reporting ────
  { id: 'ftc-consumer-scams', title: 'FTC Consumer Advice: Scams', url: 'https://consumer.ftc.gov/scams', category: 'consumer_fraud', subcategory: 'ftc' },
  { id: 'ftc-consumer-alerts', title: 'FTC Consumer Alerts', url: 'https://consumer.ftc.gov/consumer-alerts', category: 'consumer_fraud', subcategory: 'ftc' },
  { id: 'ftc-data-explorer', title: 'FTC Data Explorer (Fraud Statistics)', url: 'https://www.ftc.gov/exploredata', category: 'consumer_fraud', subcategory: 'ftc' },

  // ──── CFTC — Commodity Futures Fraud ────
  { id: 'cftc-fraud-advisories', title: 'CFTC Fraud Advisories', url: 'https://www.cftc.gov/LearnAndProtect/FraudAwarenessPrevention/CFTCFraudAdvisories', category: 'commodities_fraud', subcategory: 'cftc' },
  { id: 'cftc-phony-websites', title: 'CFTC Phony Futures/Options Websites', url: 'https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/fraudadv_phonywebsites.html', category: 'commodities_fraud', subcategory: 'cftc' },
  { id: 'cftc-commodity-pool', title: 'CFTC Commodity Pool Fraud', url: 'https://www.cftc.gov/LearnAndProtect', category: 'commodities_fraud', subcategory: 'cftc' },
  { id: 'cftc-recovering-losses', title: 'CFTC Recovering from Fraud Losses', url: 'https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/recoveringfromlosses.html', category: 'commodities_fraud', subcategory: 'cftc' },
  { id: 'cftc-customer-advisories', title: 'CFTC Customer Advisories', url: 'https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles', category: 'commodities_fraud', subcategory: 'cftc' },
  { id: 'cftc-enforcement', title: 'CFTC Enforcement Actions', url: 'https://www.cftc.gov/LawRegulation/Enforcement', category: 'commodities_fraud', subcategory: 'cftc' },

  // ──── FINRA — Investor Protection & Regulatory Notices ────
  { id: 'finra-investor-home', title: 'FINRA Investor Homepage', url: 'https://www.finra.org/investors', category: 'securities_fraud', subcategory: 'finra' },
  { id: 'finra-avoid-fraud', title: 'FINRA Avoid Fraud & Scams', url: 'https://www.finra.org/about/office-ombuds/avoid-fraud-scams', category: 'securities_fraud', subcategory: 'finra' },
  { id: 'finra-investor-education', title: 'FINRA Investor Education Resources', url: 'https://www.finra.org/rules-guidance/key-topics/investor-education-resources', category: 'securities_fraud', subcategory: 'finra' },
  { id: 'finra-scam-prevention', title: 'FINRA Scam Prevention & Assistance', url: 'https://www.finra.org/rules-guidance/key-topics/scam-prevention-assistance-resources', category: 'securities_fraud', subcategory: 'finra' },
  { id: 'finra-industry-risks', title: 'FINRA Industry Risks & Threats', url: 'https://www.finra.org/compliance-tools/Industry_Risks_and_Threats', category: 'securities_fraud', subcategory: 'finra' },
  { id: 'finra-manipulative-trading', title: 'FINRA Manipulative Trading (Pump-and-Dump)', url: 'https://www.finra.org/rules-guidance/guidance/reports/2026-finra-annual-regulatory-oversight-report/manipulative-trading', category: 'securities_fraud', subcategory: 'finra' },
  { id: 'finra-aml-fraud-sanctions', title: 'FINRA AML, Fraud & Sanctions', url: 'https://www.finra.org/rules-guidance/key-topics/aml', category: 'securities_fraud', subcategory: 'finra' },
  { id: 'finra-regulatory-notices', title: 'FINRA Regulatory Notices', url: 'https://www.finra.org/rules-guidance/notices', category: 'securities_fraud', subcategory: 'finra' },

  // ──── HHS-OIG — Healthcare Fraud ────
  { id: 'hhs-oig-report-fraud', title: 'HHS-OIG Report Healthcare Fraud', url: 'https://oig.hhs.gov/fraud/report-fraud/', category: 'healthcare_fraud', subcategory: 'hhs_oig' },
  { id: 'hhs-oig-fraud-home', title: 'HHS-OIG Fraud Home', url: 'https://oig.hhs.gov/fraud/', category: 'healthcare_fraud', subcategory: 'hhs_oig' },
  { id: 'hhs-oig-mfcu', title: 'Medicaid Fraud Control Units', url: 'https://oig.hhs.gov/fraud/medicaid-fraud-control-units-mfcu/', category: 'healthcare_fraud', subcategory: 'hhs_oig' },
  { id: 'hhs-oig-managed-care', title: 'Managed Care Fraud Reports', url: 'https://oig.hhs.gov/reports/featured/managed-care/', category: 'healthcare_fraud', subcategory: 'hhs_oig' },
  { id: 'hhs-oig-exclusions', title: 'HHS-OIG Exclusions (LEIE List)', url: 'https://oig.hhs.gov/exclusions/', category: 'healthcare_fraud', subcategory: 'hhs_oig' },
  { id: 'hhs-oig-compliance', title: 'HHS-OIG Compliance Home', url: 'https://oig.hhs.gov/compliance/', category: 'healthcare_fraud', subcategory: 'hhs_oig' },
  { id: 'hhs-oig-compliance-guidance', title: 'HHS-OIG General Compliance Program Guidance', url: 'https://oig.hhs.gov/compliance/compliance-guidance/', category: 'healthcare_fraud', subcategory: 'hhs_oig' },
  { id: 'hhs-oig-advisory-opinions', title: 'HHS-OIG Advisory Opinions', url: 'https://oig.hhs.gov/compliance/advisory-opinions/', category: 'healthcare_fraud', subcategory: 'hhs_oig' },
  { id: 'hhs-oig-self-disclosure', title: 'HHS-OIG Self-Disclosure Protocol', url: 'https://oig.hhs.gov/compliance/self-disclosure-info/', category: 'healthcare_fraud', subcategory: 'hhs_oig' },
  { id: 'hhs-oig-cia', title: 'HHS-OIG Corporate Integrity Agreements', url: 'https://oig.hhs.gov/compliance/corporate-integrity-agreements/', category: 'healthcare_fraud', subcategory: 'hhs_oig' },
  { id: 'hhs-oig-enforcement', title: 'HHS-OIG Enforcement Actions', url: 'https://oig.hhs.gov/fraud/enforcement-actions/', category: 'healthcare_fraud', subcategory: 'hhs_oig' },

  // ──── OCC — Bank Fraud & Risk Management ────
  { id: 'occ-fraud-risk-2019', title: 'OCC Fraud Risk Management Principles (Bulletin 2019-37)', url: 'https://www.occ.gov/news-issuances/bulletins/2019/bulletin-2019-37.html', category: 'bank_fraud', subcategory: 'occ' },
  { id: 'occ-comptrollers-handbook', title: 'OCC Comptroller\'s Handbook Index', url: 'https://www2.occ.gov/publications-and-resources/publications/comptrollers-handbook/index-comptrollers-handbook.html', category: 'bank_fraud', subcategory: 'occ' },
  { id: 'occ-bank-supervision', title: 'OCC Bank Supervision Process', url: 'https://www.occ.gov/publications-and-resources/publications/comptrollers-handbook/files/bank-supervision-process/index-bank-supervision-process.html', category: 'bank_fraud', subcategory: 'occ' },
  { id: 'occ-semiannual-risk', title: 'OCC Semiannual Risk Perspective', url: 'https://www.occ.gov/publications-and-resources/publications/semiannual-risk-perspective/', category: 'bank_fraud', subcategory: 'occ' },
  { id: 'occ-correspondent-banking', title: 'OCC Foreign Correspondent Banking Risk Management (Bulletin 2016-32)', url: 'https://www.occ.gov/news-issuances/bulletins/2016/bulletin-2016-32.html', category: 'bank_fraud', subcategory: 'occ' },

  // ──── Secret Service — Financial & Cyber Investigations ────
  { id: 'usss-financial-investigations', title: 'Secret Service Financial Investigations', url: 'https://www.secretservice.gov/investigations/financial', category: 'financial_investigations', subcategory: 'secret_service' },
  { id: 'usss-cyber-investigations', title: 'Secret Service Cyber Investigations', url: 'https://www.secretservice.gov/investigations/cyber', category: 'cyber_fraud', subcategory: 'secret_service' },

  // ──── CFPB — Consumer Financial Protection ────
  { id: 'cfpb-consumer-tools', title: 'CFPB Consumer Tools', url: 'https://www.consumerfinance.gov/consumer-tools/', category: 'consumer_protection', subcategory: 'cfpb' },
  { id: 'cfpb-fraud-scams', title: 'CFPB Fraud & Scams', url: 'https://www.consumerfinance.gov/consumer-tools/fraud/', category: 'consumer_fraud', subcategory: 'cfpb' },

  // ──── NASAA — State Regulators ────
  { id: 'nasaa-home', title: 'NASAA (State Securities Regulators)', url: 'https://www.nasaa.org', category: 'securities_fraud', subcategory: 'nasaa' },
  { id: 'nasaa-find-regulator', title: 'NASAA Find Your State Regulator', url: 'https://www.nasaa.org/contact-your-regulator/', category: 'securities_fraud', subcategory: 'nasaa' },
  { id: 'nasaa-investor-library', title: 'NASAA Investor Information Library', url: 'https://www.nasaa.org/investor-education/', category: 'securities_fraud', subcategory: 'nasaa' },

  // ──── Interagency Resources ────
  { id: 'stopransomware-gov', title: 'StopRansomware.gov (Multi-Agency)', url: 'https://www.stopransomware.gov', category: 'cyber_fraud', subcategory: 'interagency' },
  { id: 'cisa-ransomware-guide', title: 'CISA Ransomware Guide', url: 'https://www.cisa.gov/stopransomware', category: 'cyber_fraud', subcategory: 'interagency' },

  // ──── FDIC — Consumer Protection ────
  { id: 'fdic-consumer-protection', title: 'FDIC Consumer Protection Resources', url: 'https://www.fdic.gov/resources/consumers/', category: 'consumer_protection', subcategory: 'fdic' },

  // ──── Federal Reserve ────
  { id: 'fed-consumer-help', title: 'Federal Reserve Consumer Help', url: 'https://www.federalreserveconsumerhelp.gov', category: 'consumer_protection', subcategory: 'federal_reserve' },
];

// ─── Curated PDF / complex page summaries ────────────────────────────────────

const CURATED_CHUNKS = [
  // ──── IC3 Annual Reports (PDFs) ────
  {
    id: 'ic3-report-2024',
    title: '2024 IC3 Internet Crime Report',
    chunks: [`IC3 2024 Internet Crime Report — Key Findings: The FBI's Internet Crime Complaint Center (IC3) received over 880,000 complaints in 2024 with total reported losses exceeding $16 billion, a significant increase from prior years. Top crime types by complaint count include phishing/spoofing, personal data breach, non-payment/non-delivery, extortion, and tech support fraud. Top crime types by financial loss include investment fraud (primarily cryptocurrency/pig butchering), business email compromise (BEC), tech support scams, personal data breaches, and confidence/romance fraud.

Investment fraud losses reached approximately $6.6 billion, driven heavily by cryptocurrency investment scams ("pig butchering"), with victims often recruited through social media and messaging apps. BEC losses exceeded $2.9 billion with criminals using compromised email accounts, social engineering, and deepfake technology to redirect wire transfers. Ransomware remained the top threat to critical infrastructure with healthcare, manufacturing, government, IT, and financial services being the most targeted sectors.

Elder fraud (victims 60+) losses exceeded $4.8 billion, a sharp increase. IC3's Recovery Asset Team (RAT) intervened in BEC cases, achieving a 74% success rate in freezing fraudulent transfers. Operation Level Up, targeting pig butchering, identified thousands of victims and prevented hundreds of millions in potential losses. Call center fraud originating from South Asia (India) and Southeast Asia continued to be a major driver of elder exploitation.

Key trends: AI-generated deepfakes used in BEC, social engineering and impersonation of government/bank officials, cryptocurrency as primary payment mechanism for fraud, expansion of pig butchering to include job scams and fake lending platforms, and increasing use of shell companies and money mules for laundering.`],
    metadata: { source: 'FBI IC3', documentType: 'annual_report', category: 'cyber_fraud', subcategory: 'fbi', year: '2024', url: 'https://www.ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf' }
  },
  {
    id: 'ic3-report-2023',
    title: '2023 IC3 Internet Crime Report',
    chunks: [`IC3 2023 Internet Crime Report — Key Findings: IC3 received approximately 880,418 complaints in 2023, with potential losses exceeding $12.5 billion, a 22% increase in losses from 2022. This represented the highest losses recorded since IC3's inception. Investment fraud was the costliest crime type at $4.57 billion, up 38% from 2022, with cryptocurrency investment fraud (pig butchering) accounting for $3.94 billion. BEC complaints reported losses of $2.9 billion across 21,489 complaints.

Ransomware incidents increased 18% with 2,825 complaints. The FBI reported that the top ransomware variants targeting critical infrastructure included LockBit, ALPHV/BlackCat, Akira, Royal, and Black Basta. Healthcare was the most-targeted critical infrastructure sector. Tech support fraud and government impersonation scams combined for over $1.3 billion in losses, predominantly affecting elderly victims.

The IC3 Recovery Asset Team (RAT) processed 3,008 frozen/held payment incidents worth $758.05 million, with a 71% success rate. Cryptocurrency-related fraud was reported in 58,000+ complaints with over $5.6 billion in total losses across all crypto-related crime types. Notable: over 40% of reported cryptocurrency fraud victims were aged 30-49, while those 60+ suffered the highest per-victim losses.`],
    metadata: { source: 'FBI IC3', documentType: 'annual_report', category: 'cyber_fraud', subcategory: 'fbi', year: '2023', url: 'https://www.ic3.gov/Media/PDF/AnnualReport/2023_IC3Report.pdf' }
  },
  {
    id: 'fbi-crypto-fraud-report-2023',
    title: '2023 FBI Cryptocurrency Fraud Report',
    chunks: [`FBI 2023 Cryptocurrency Fraud Report: IC3 received 69,468 cryptocurrency-related complaints in 2023, with combined losses of approximately $5.6 billion. While crypto-related complaints represented only about 10% of all financial fraud complaints, they accounted for almost 50% of total financial losses. Investment fraud involving cryptocurrency was the most prevalent, accounting for $3.96 billion (71% of all crypto losses).

Key findings: Pig butchering (relationship investment scams) remained the dominant form of crypto investment fraud. Victims are cultivated through dating apps, social media, and messaging platforms before being directed to fraudulent trading platforms. Crypto ATM and kiosk scams increased, with criminals directing victims (often elderly) to deposit cash at crypto ATMs. Liquidity mining, play-to-earn gaming, and decentralized finance (DeFi) exploitation emerged as growing fraud vectors.

Age demographics: Individuals aged 30-49 filed the most complaints, while those 60+ suffered the highest aggregate losses ($1.24 billion). State-by-state: California, Texas, Florida, New York, and Ohio recorded the highest losses. International elements: significant fraud operations traced to Southeast Asia (Myanmar, Cambodia, Laos) involving forced labor/human trafficking to staff scam compounds.`],
    metadata: { source: 'FBI IC3', documentType: 'annual_report', category: 'crypto_fraud', subcategory: 'fbi', year: '2023', url: 'https://www.fbi.gov/news/stories/2023-cryptocurrency-fraud-report-released' }
  },

  // ──── FBI Elder Fraud ────
  {
    id: 'fbi-elder-fraud-2024',
    title: '2024 FBI Elder Fraud Report',
    chunks: [`FBI 2024 Elder Fraud Report: Victims aged 60 and older reported losses exceeding $4.8 billion in 2024, a significant increase from prior years. Over 147,000 complaints were filed by older adults. The most common fraud types targeting elders include: tech support scams (criminals impersonating major tech companies to gain remote access and steal funds), government impersonation (fake IRS, SSA, or law enforcement calls), investment fraud/pig butchering (increasingly targeting retirees with cryptocurrency schemes), romance/confidence fraud (long-term online relationships leading to financial exploitation), and lottery/sweepstakes/inheritance scams.

Key patterns in elder fraud: call center operations based in India and Southeast Asia target elderly Americans systematically. Criminals instruct victims to purchase gift cards, wire money, send cash via mail, or use cryptocurrency ATMs. "Phantom hacker" scams combine tech support, bank impersonation, and government impersonation in multi-stage attacks. Financial institution employees play a critical role in identifying and preventing elder exploitation.

FBI's Operation Level Up and collaboration with financial institutions helped identify and notify thousands of elderly scam victims before additional losses occurred. Recommended red flags for financial institutions: sudden large withdrawals, purchases of gift cards or cryptocurrency by elderly customers, wire transfers to unfamiliar recipients, mentions of "tech support" or "government agent" directing transactions, customer appearing coached or reading from notes during transactions.`],
    metadata: { source: 'FBI', documentType: 'annual_report', category: 'elder_fraud', subcategory: 'fbi', year: '2024', url: 'https://www.fbi.gov/news/stories/2024-elder-fraud-report' }
  },

  // ──── SEC Investor Alerts (some are PDFs or complex pages) ────
  {
    id: 'sec-social-media-fraud',
    title: 'SEC Social Media & Investment Fraud',
    chunks: [`SEC Investor Alert — Social Media and Investing: How Fraud Can Spread. The SEC warns that social media platforms are increasingly used by fraudsters to promote investment scams. Key risks include: pump-and-dump schemes where promoters hype stocks on social media then sell their shares after the price rises; fake celebrity endorsements and impersonation accounts promoting crypto tokens, forex, or penny stocks; coordinated social media campaigns using bots and paid influencers to create artificial buzz; "finfluencer" fraud where social media personalities promote unregistered securities or scam investments.

Red flags: guaranteed high returns with no risk, pressure to act immediately, unsolicited investment offers via social media DMs, claims of "insider tips" or secret information, requests to invest through unfamiliar platforms or crypto wallets, difficulty withdrawing funds. Investors should verify registration through SEC EDGAR, FINRA BrokerCheck, or state securities regulators before investing. Report suspicious activity to SEC at sec.gov/tcr.`],
    metadata: { source: 'SEC', documentType: 'investor_alert', category: 'securities_fraud', subcategory: 'sec', url: 'https://www.sec.gov/investor/alerts/socialmediaandfraud.pdf' }
  },
  {
    id: 'sec-covid-investment-scams',
    title: 'SEC COVID-19 Investment Scams Alert',
    chunks: [`SEC Investor Alert — COVID-19 Related Investment Scams: The SEC warned investors about fraudulent offerings and schemes related to the COVID-19 pandemic. Scam types include: companies making false claims about COVID-19 treatments, cures, vaccines, or testing capabilities to inflate stock prices; promoters using pandemic fear to push precious metals, cryptocurrency, or other "safe haven" investments; Paycheck Protection Program (PPP) and Economic Injury Disaster Loan (EIDL) fraud involving shell companies and inflated payroll figures; fake COVID-related biotech companies with fabricated partnerships or clinical trial results.

Red flags: unsolicited investment offers linked to COVID-19 developments, claims of government backing for private investments, pressure to invest before a "deadline" tied to pandemic developments, companies suddenly pivoting their business model to COVID-related products. The SEC, working with DOJ and FBI, brought numerous enforcement actions against COVID-related securities fraud schemes including PPP/EIDL fraud, fake testing companies, and pump-and-dump schemes exploiting pandemic fears.`],
    metadata: { source: 'SEC', documentType: 'investor_alert', category: 'securities_fraud', subcategory: 'sec', url: 'https://www.sec.gov/oiea/investor-alerts-and-bulletins/ia_coronavirus' }
  },
  {
    id: 'sec-ai-investment-fraud',
    title: 'SEC AI & Investment Fraud Alert',
    chunks: [`SEC Investor Alert — Artificial Intelligence and Investment Fraud: The SEC warns that fraudsters increasingly use AI buzzwords and technology claims to lure investors. Key schemes include: companies falsely claiming to use AI/machine learning for trading or investment decisions (so-called "AI washing"); fake AI-powered trading platforms or bots promising guaranteed algorithmic returns; deepfake videos impersonating celebrities or financial advisors to promote scam investments; unregistered offerings in AI startups with fabricated technology, partnerships, or revenue.

Red flags for AI investment fraud: claims of proprietary AI that "never loses" or guarantees returns; pressure to invest quickly before the "AI revolution"; inability to explain how the AI/algorithm works in plain terms; testimonials from fake users or deepfake celebrity endorsements; unregistered securities or investment advisers. The SEC has brought enforcement actions against firms making false AI claims and issued risk alerts about AI washing in the investment management industry. Investors should verify all claims through SEC EDGAR filings and FINRA BrokerCheck.`],
    metadata: { source: 'SEC', documentType: 'investor_alert', category: 'securities_fraud', subcategory: 'sec', year: '2024', url: 'https://www.sec.gov/investor/alerts' }
  },

  // ──── FTC Reports ────
  {
    id: 'ftc-consumer-sentinel-2024',
    title: 'FTC 2024 Consumer Sentinel Network Data Book',
    chunks: [`FTC Consumer Sentinel Network Data Book 2024: The Consumer Sentinel Network received over 5.7 million reports in 2024, including approximately 2.6 million fraud reports, 1.1 million identity theft reports, and 2 million "other" reports. Total reported fraud losses reached $12.5 billion, a significant increase from $10.0 billion in 2023.

Top fraud categories by reports: imposter scams (including government and business impersonation), online shopping scams, prizes/sweepstakes/lotteries, investment fraud, and business/job opportunity scams. Top fraud categories by dollar loss: investment scams ($5.7 billion), imposter scams ($2.95 billion), online shopping ($1.4 billion), business/job opportunities, and prizes/lotteries.

Payment methods: bank transfers/payments led in total losses ($2.5 billion), followed by cryptocurrency ($1.4 billion), wire transfers ($985 million), credit cards ($930 million), and gift cards/reload cards ($567 million). Contact methods: social media was the most common initial contact method for fraud. Age analysis: younger adults (20-29) reported fraud more frequently, but older adults (70+) reported the highest median individual losses. Top companies impersonated: banks, government agencies (SSA, IRS), Amazon, Apple, and Microsoft.`],
    metadata: { source: 'FTC', documentType: 'annual_report', category: 'consumer_fraud', subcategory: 'ftc', year: '2024', url: 'https://www.ftc.gov/reports/consumer-sentinel-network-data-book-2024' }
  },
  {
    id: 'ftc-impersonation-scams-2025',
    title: 'FTC Impersonation Scams Data (2025)',
    chunks: [`FTC Data on Impersonation Scams (2025): The FTC reported a more than four-fold increase in impersonation scam reports, with consumers losing tens to hundreds of thousands of dollars. Government impersonation and business impersonation are the two primary variants. Government impersonation scams involve criminals pretending to be from the IRS, Social Security Administration, Medicare, FBI, or local law enforcement, demanding immediate payment via gift cards, wire transfers, or cryptocurrency.

Business impersonation involves criminals impersonating banks, tech companies (Microsoft, Apple, Amazon), utility companies, or shipping companies. Multi-stage "phantom hacker" attacks combine tech support, bank impersonation, and government impersonation sequentially. Losses from impersonation scams exceeded $2 billion. The FTC's Impersonation Rule (finalized 2024) makes it unlawful to impersonate government or business entities in connection with commercial transactions, giving the FTC authority to seek monetary relief.

Common red flags: unsolicited calls claiming to be from government agencies, threats of arrest or legal action, demands for payment via gift cards or cryptocurrency, requests to move money to "safe" accounts, caller spoofing official phone numbers, emails or texts with official-looking logos directing to fake websites.`],
    metadata: { source: 'FTC', documentType: 'data_report', category: 'consumer_fraud', subcategory: 'ftc', year: '2025', url: 'https://www.ftc.gov/news-events/news/press-releases/2025/08/ftc-data-show-more-four-fold-increase-reports-impersonation-scammers-stealing-tens-even-hundreds' }
  },

  // ──── CFTC Key Advisories ────
  {
    id: 'cftc-romance-crypto-advisory',
    title: 'CFTC Romance Scams — Forex, Precious Metals & Digital Asset Fraud',
    chunks: [`CFTC Advisory — Avoiding Forex, Precious Metals, and Digital Asset Romance Scams: The Commodity Futures Trading Commission warns consumers about romance scams that evolve into fraudulent investment schemes involving forex, precious metals, and cryptocurrency. Criminals establish fake romantic relationships through dating apps and social media, then gradually introduce victims to "investment opportunities."

Typical progression: initial contact via dating app or social media → building trust over weeks/months → introduction to forex trading or crypto investment → directing victim to fraudulent trading platform → initial small "profits" shown to build confidence → encouragement to invest larger amounts → victim unable to withdraw funds → scammer disappears.

Red flags: online romantic interest who consistently avoids meeting in person, unprompted offers to teach investing or share trading strategies, direction to specific trading platforms or crypto wallets, pressure to invest retirement savings or borrow money, platforms showing consistent gains with no losses, difficulty or inability to withdraw funds, requests to pay "taxes" or "fees" before withdrawal. The CFTC warns that these fraudulent platforms are not registered with any U.S. regulator. Report to CFTC at cftc.gov/complaint.`],
    metadata: { source: 'CFTC', documentType: 'advisory', category: 'commodities_fraud', subcategory: 'cftc', url: 'https://www.cftc.gov' }
  },
  {
    id: 'cftc-enforcement-fy2024',
    title: 'CFTC FY 2024 Enforcement Results',
    chunks: [`CFTC FY 2024 Enforcement Results: The CFTC filed enforcement actions resulting in significant monetary sanctions targeting fraud involving digital assets, forex, precious metals, and commodity pool schemes. Key areas of enforcement included: digital asset fraud involving unregistered trading platforms and fraudulent crypto investment schemes; manipulation and spoofing in commodity futures markets; forex fraud targeting retail investors; failure to register as commodity pool operators or commodity trading advisors.

The CFTC continued its partnership with DOJ for parallel criminal enforcement and worked with international regulators to combat cross-border fraud. Notable enforcement themes: schemes using social media and messaging apps to recruit victims, use of decentralized finance (DeFi) protocols to obscure fund flows, increasing use of AI claims in fraudulent trading platforms, and expanding pig butchering operations targeting commodity and forex markets. The CFTC's whistleblower program continued to receive significant tips leading to enforcement actions.`],
    metadata: { source: 'CFTC', documentType: 'enforcement_report', category: 'commodities_fraud', subcategory: 'cftc', year: '2024', url: 'https://www.cftc.gov/PressRoom/PressReleases/9011-24' }
  },

  // ──── HHS-OIG Healthcare Fraud ────
  {
    id: 'hhs-oig-fraud-overview',
    title: 'HHS-OIG Healthcare Fraud — Comprehensive Overview',
    chunks: [`HHS Office of Inspector General — Healthcare Fraud Overview: Healthcare fraud costs the U.S. healthcare system an estimated $100+ billion annually. The HHS-OIG investigates and prosecutes healthcare fraud through criminal, civil, and administrative actions. Major healthcare fraud schemes include:

1. Billing fraud: upcoding (billing for more expensive services), unbundling (separately billing for bundled services), phantom billing (billing for services never rendered), duplicate billing. 2. Kickback schemes: violations of the Anti-Kickback Statute (AKS) where healthcare providers receive payments for referrals. 3. False Claims Act violations: submitting false claims to Medicare, Medicaid, TRICARE, or other federal healthcare programs. 4. Prescription drug fraud: illegal prescribing, diversion, and distribution of controlled substances, including the opioid crisis. 5. Durable medical equipment (DME) fraud: billing for unnecessary or undelivered equipment, particularly power wheelchairs and orthotic braces.

Key enforcement tools: False Claims Act (31 USC 3729-3733) with treble damages, Anti-Kickback Statute (42 USC 1320a-7b), Physician Self-Referral Law (Stark Law), Civil Monetary Penalties Law, Program Exclusion Authority. The OIG maintains the List of Excluded Individuals/Entities (LEIE) — organizations must check this list before hiring or contracting with healthcare workers. Medicare Advantage fraud has become an increasing enforcement priority, with schemes involving improper risk adjustment, cherry-picking healthy enrollees, and denying medically necessary care.`],
    metadata: { source: 'HHS-OIG', documentType: 'guidance', category: 'healthcare_fraud', subcategory: 'hhs_oig', url: 'https://oig.hhs.gov/fraud/' }
  },
  {
    id: 'hhs-oig-compliance-program',
    title: 'HHS-OIG General Compliance Program Guidance (GCPG)',
    chunks: [`HHS-OIG General Compliance Program Guidance: The OIG's compliance guidance provides a framework for healthcare entities to develop effective compliance programs. The seven fundamental elements of an effective compliance program are:

1. Written policies, procedures, and standards of conduct establishing expectations and guidelines for compliant behavior. 2. Compliance leadership and oversight with a designated compliance officer and compliance committee reporting to the board. 3. Training and education to ensure all employees understand compliance obligations and can identify potential fraud. 4. Effective lines of communication including anonymous reporting mechanisms (hotlines) for employees to report concerns without fear of retaliation. 5. Internal monitoring and auditing through regular, systematic reviews of billing practices, coding accuracy, and regulatory compliance. 6. Enforcing standards through well-publicized disciplinary guidelines consistently applied. 7. Prompt response to detected offenses including investigation, corrective action, and voluntary self-disclosure to OIG when appropriate.

The OIG's Self-Disclosure Protocol allows entities that discover potential fraud to voluntarily report it, typically resulting in reduced penalties. Corporate Integrity Agreements (CIAs) are imposed on entities as part of fraud settlements, requiring enhanced compliance measures, independent review organizations, and reporting obligations for a period of years. Industry-specific compliance guidance exists for hospitals, nursing facilities, clinical laboratories, home health agencies, physician practices, pharmaceutical manufacturers, Medicare Advantage organizations, and others.`],
    metadata: { source: 'HHS-OIG', documentType: 'compliance_guidance', category: 'healthcare_fraud', subcategory: 'hhs_oig', url: 'https://oig.hhs.gov/compliance/compliance-guidance/' }
  },

  // ──── OCC Bank Fraud ────
  {
    id: 'occ-fraud-risk-principles',
    title: 'OCC Fraud Risk Management Principles (Bulletin 2019-37)',
    chunks: [`OCC Bulletin 2019-37 — Sound Practices for Managing Fraud Risk: The Office of the Comptroller of the Currency outlines core principles for managing fraud risk in national banks and federal savings associations. Key principles:

1. Fraud Risk Governance: Board and senior management should establish a fraud risk appetite, assign clear accountability, and ensure adequate resources for fraud prevention. Fraud risk management should be integrated into the bank's overall risk management framework. 2. Fraud Risk Assessment: Banks should conduct regular, comprehensive fraud risk assessments covering internal fraud (employee/insider), external fraud (customer, third-party), cyber-enabled fraud, and vendor/third-party fraud. Assessments should consider emerging fraud typologies.

3. Fraud Prevention and Detection Controls: Implement preventive controls (dual authorization, segregation of duties, vendor due diligence, employee screening) and detective controls (transaction monitoring, data analytics, exception reporting, whistleblower programs). Technology solutions including AI/ML for anomaly detection. 4. Fraud Investigation and Response: Establish clear investigation protocols, evidence preservation, suspicious activity reporting (SARs), coordination with law enforcement, and customer notification. 5. Fraud Risk Reporting and Monitoring: Regular reporting to board and management on fraud trends, losses, recoveries, and control effectiveness.

Common bank fraud types: check fraud (counterfeiting, alteration, kiting), wire transfer fraud/BEC, account takeover, new account fraud, loan fraud, insider/employee fraud, ATM/card fraud, synthetic identity fraud, and cyber-enabled fraud. The OCC expects banks to have robust BSA/AML programs that integrate fraud detection with suspicious activity monitoring.`],
    metadata: { source: 'OCC', documentType: 'bulletin', category: 'bank_fraud', subcategory: 'occ', year: '2019', url: 'https://www.occ.gov/news-issuances/bulletins/2019/bulletin-2019-37.html' }
  },

  // ──── Secret Service ────
  {
    id: 'usss-cyber-fraud-task-forces',
    title: 'Secret Service Cyber Fraud Task Forces (CFTFs)',
    chunks: [`U.S. Secret Service Cyber Fraud Task Forces (CFTFs): In 2020, the Secret Service merged its Electronic Crimes Task Forces and Financial Crimes Task Forces into unified Cyber Fraud Task Forces (CFTFs) operating in field offices nationwide. CFTFs combine the investigation of cyber-enabled financial crimes, including:

Business email compromise (BEC) and email account compromise (EAC): The Secret Service is a lead agency in investigating BEC schemes, which account for billions in annual losses. CFTFs work with financial institutions to identify and freeze fraudulent wire transfers. Ransomware: CFTFs investigate ransomware attacks targeting businesses, government entities, and critical infrastructure, coordinating with CISA and FBI. Account takeover and identity theft: investigating schemes involving stolen credentials, SIM swapping, and synthetic identity fraud. Cryptocurrency fraud: tracing cryptocurrency transactions, investigating fraudulent exchanges, and seizing digital assets.

The Secret Service's Global Investigative Operations Center (GIOC) supports international investigations. The National Computer Forensics Institute (NCFI) provides training to state and local law enforcement on digital forensics. The Secret Service also maintains a role in investigating counterfeit currency and financial system integrity. CFTFs partner with private sector companies, banks, and technology firms through public-private partnerships to share threat intelligence and coordinate incident response.`],
    metadata: { source: 'U.S. Secret Service', documentType: 'program_overview', category: 'financial_investigations', subcategory: 'secret_service', url: 'https://www.secretservice.gov/investigations/financial' }
  },
  {
    id: 'usss-pandemic-fraud',
    title: 'Secret Service National Pandemic Fraud Recovery Coordinator',
    chunks: [`U.S. Secret Service Pandemic Fraud Recovery: The Secret Service appointed a National Pandemic Fraud Recovery Coordinator to lead investigations into pandemic-related financial crimes. COVID-19 pandemic fraud schemes investigated by the Secret Service include:

Paycheck Protection Program (PPP) fraud: fraudulent loan applications using fake businesses, inflated payroll figures, stolen identities, and straw borrowers. The Secret Service seized and returned hundreds of millions in fraudulently obtained PPP funds. Economic Injury Disaster Loan (EIDL) fraud: similar schemes targeting SBA EIDL programs. Unemployment Insurance (UI) fraud: massive identity theft-driven fraud against state unemployment systems, with organized criminal groups filing thousands of fraudulent claims using stolen personal information. The Secret Service identified billions in fraudulent UI claims.

Employee Retention Credit (ERC) fraud: fraudulent claims for pandemic-era tax credits by businesses that did not qualify. COVID-19 testing and treatment fraud: fake testing sites collecting personal information and insurance data. The Secret Service's financial expertise and partnerships with banks proved critical in tracing and recovering pandemic fraud proceeds, which were often laundered through cryptocurrency, prepaid debit cards, and money mule networks.`],
    metadata: { source: 'U.S. Secret Service', documentType: 'program_overview', category: 'fraud_enforcement', subcategory: 'secret_service', url: 'https://www.secretservice.gov/newsroom/releases/2021/12/us-secret-service-names-national-pandemic-fraud-recovery-coordinator' }
  },
  {
    id: 'usss-cyber-incident-guide',
    title: 'Secret Service — Preparing for a Cyber Incident Guide',
    chunks: [`U.S. Secret Service Guide — Preparing for a Cyber Incident: This guide provides organizations with a framework for cyber incident preparedness, including: Pre-Incident Planning: develop an incident response plan (IRP) that defines roles, responsibilities, and communication protocols. Establish relationships with law enforcement (Secret Service CFTFs, FBI) before an incident occurs. Maintain current contact information for key stakeholders.

During a Cyber Incident: preserve evidence (do not wipe or rebuild systems prematurely), document the timeline of events, engage legal counsel and incident response firms, notify law enforcement early (Secret Service, FBI), determine regulatory notification requirements (state breach notification laws, SEC, banking regulators), and contain the threat while preserving forensic evidence.

Post-Incident: conduct after-action review, update IRP based on lessons learned, implement remediation measures, continue cooperation with law enforcement investigation. Types of cyber incidents covered: ransomware, BEC, network intrusion, data breach, destructive malware, insider threats, and supply chain compromise. The guide emphasizes that early law enforcement engagement can help with threat intelligence, decryption keys (ransomware), and asset recovery.`],
    metadata: { source: 'U.S. Secret Service', documentType: 'guidance', category: 'cyber_fraud', subcategory: 'secret_service', url: 'https://www.secretservice.gov/sites/default/files/reports/2020-12/Preparing%20for%20a%20Cyber%20Incident%20-%20An%20Introductory%20Guide%20v%201.1.pdf' }
  },

  // ──── FINRA Foundation Research ────
  {
    id: 'finra-fraud-awareness-2024',
    title: 'FINRA Foundation Fraud Awareness Research (2024)',
    chunks: [`FINRA Foundation Fraud Awareness Research Findings (2024): The FINRA Foundation's research on investor fraud awareness reveals critical insights into who falls victim to investment fraud and why. Key findings:

Demographics: contrary to stereotypes, younger investors (18-34) are more likely to engage with potentially fraudulent investment offers than older investors. Higher-income and more financially literate individuals are also surprisingly susceptible due to overconfidence. Education and awareness alone are insufficient — behavioral and psychological factors play a larger role.

Behavioral factors: social influence (hearing about investments from friends, family, or social media influencers) significantly increases willingness to invest in potentially fraudulent schemes. Scarcity tactics ("limited time offer") and authority signals (fake credentials, celebrity endorsements) remain highly effective. Victims often exhibit "consistency bias" — once they've committed small amounts, they continue investing larger sums.

Fraud typologies studied: cryptocurrency/digital asset scams, social media investment promotions, AI-powered trading scheme claims, promissory note fraud, Ponzi schemes, pump-and-dump (microcap fraud), advance fee schemes, and affinity fraud targeting religious, ethnic, or military communities. The research emphasizes that financial institutions should implement proactive outreach to at-risk customers rather than relying solely on disclosures.`],
    metadata: { source: 'FINRA Foundation', documentType: 'research_report', category: 'securities_fraud', subcategory: 'finra', year: '2024', url: 'https://www.finra.org/media-center/newsreleases/2025/finra-foundation-releases-findings-fraud-awareness-among-investors' }
  },

  // ──── Fraud Reporting Quick Reference ────
  {
    id: 'fraud-reporting-quick-reference',
    title: 'U.S. Fraud Reporting — Quick Reference by Fraud Type',
    chunks: [`U.S. Fraud Reporting Quick Reference — Where to Report by Fraud Type:

Internet/Cyber Crime: FBI IC3 (ic3.gov) — file online complaint for all internet-enabled crimes including BEC, ransomware, phishing, online fraud, identity theft, and cryptocurrency scams.
Securities Fraud: SEC Tips, Complaints & Referrals (sec.gov/tcr) — report insider trading, accounting fraud, market manipulation, unregistered offerings, and investment adviser misconduct. Whistleblower awards available (10-30% of sanctions over $1M).
Consumer Fraud / Scams: FTC ReportFraud (reportfraud.ftc.gov) — report any consumer fraud, scam, or deceptive business practice. Data feeds into Consumer Sentinel for law enforcement.
Identity Theft: FTC IdentityTheft.gov (identitytheft.gov) — create a personalized recovery plan with pre-filled letters and forms.
Healthcare/Medicare Fraud: HHS-OIG Hotline (oig.hhs.gov/fraud/report-fraud) — report fraud, waste, and abuse in Medicare, Medicaid, and other HHS programs.
Mail Fraud: U.S. Postal Inspection Service (uspis.gov/report) — report mail theft, counterfeit mail, and fraud conducted through the U.S. Mail. Hotline: 1-800-372-8347.
Commodities/Futures/Forex Fraud: CFTC (cftc.gov/complaint) — report fraud involving commodity futures, options, forex, swaps, and digital assets.
Bank Fraud: Contact OCC, FDIC, or Federal Reserve depending on the bank's charter type. OCC handles national banks, FDIC handles state non-member banks, Federal Reserve handles state member banks.
Investment Fraud (Broker/Dealer): FINRA (finra.org) + SEC — use BrokerCheck to verify registration, file complaints about broker misconduct.
Disaster Fraud: National Center for Disaster Fraud (NCDF) — DOJ hotline: 866-720-5721. Web complaint form at justice.gov/disaster-fraud.
Cyber-Enabled Financial Crime: Secret Service Cyber Fraud Task Forces (secretservice.gov) — BEC, ransomware, account takeover, crypto fraud.
Tax Fraud: IRS Criminal Investigation (irs.gov/compliance/criminal-investigation) — report tax evasion, fraudulent returns, and tax preparer fraud.
Social Security Fraud: SSA-OIG (oig.ssa.gov) — report Social Security number misuse, benefits fraud, and SSA employee misconduct.`],
    metadata: { source: 'Multi-Agency', documentType: 'reference', category: 'fraud_reporting', subcategory: 'interagency', url: 'N/A' }
  },

  // ──── USPIS Mail Fraud ────
  {
    id: 'uspis-mail-fraud-overview',
    title: 'U.S. Postal Inspection Service — Mail Fraud Overview',
    chunks: [`U.S. Postal Inspection Service (USPIS) — Mail Fraud: The Postal Inspection Service is the federal law enforcement agency responsible for investigating crimes involving the U.S. Mail. Mail fraud (18 USC 1341) is one of the most frequently charged federal offenses and requires only that the U.S. Mail was used in furtherance of a scheme to defraud — even a single mailing is sufficient.

Key areas of USPIS investigation: mail theft and check washing/alteration (check fraud conducted through stolen mail), identity theft via stolen mail (tax returns, financial statements, credit card offers), advance fee schemes and sweepstakes/lottery fraud conducted by mail, mail-order fraud and deceptive advertising, financial fraud involving mailed instruments (counterfeit checks, money orders), elder fraud schemes using the mail, and contraband shipments.

Mail fraud statute is a predicate offense for RICO, money laundering, and other federal charges. Maximum penalty: 20 years imprisonment (30 years if involving a financial institution or disaster/emergency). The USPIS works closely with the DOJ, FBI, Secret Service, and FTC in joint investigations. The Postal Inspection Service also enforces the Deceptive Mail Prevention and Enforcement Act and operates the Mail Fraud Complaint Center (1-800-372-8347). Check fraud trend: mail theft-related check fraud has surged since 2020, with criminals stealing checks from USPS collection boxes and personal mailboxes, then washing and altering them or using account information for ACH fraud.`],
    metadata: { source: 'USPIS', documentType: 'overview', category: 'mail_fraud', subcategory: 'uspis', url: 'https://www.uspis.gov' }
  },

  // ──── DOJ False Claims Act / FIRREA ────
  {
    id: 'doj-false-claims-firrea',
    title: 'DOJ Civil Fraud — False Claims Act & FIRREA',
    chunks: [`DOJ Civil Division — False Claims Act (FCA) and Financial Institutions Reform, Recovery, and Enforcement Act (FIRREA):

False Claims Act (31 USC 3729-3733): The FCA is the government's primary civil tool for combating fraud against federal programs. Key provisions: anyone who knowingly submits a false claim for payment to the government is liable for treble damages (3x the government's loss) plus per-claim penalties ($13,946-$27,894 per violation as of 2024). The FCA's qui tam (whistleblower) provision allows private individuals to file lawsuits on behalf of the government and receive 15-30% of any recovery.

FCA areas of enforcement: healthcare fraud (Medicare/Medicaid billing fraud, kickbacks), defense contractor fraud, government procurement fraud, pandemic relief fraud (PPP, EIDL, ERC), customs and trade fraud, cybersecurity fraud (failure to meet contractual cybersecurity requirements — "Civil Cyber-Fraud Initiative"). DOJ recovered over $2.68 billion in FCA settlements and judgments in FY 2024.

FIRREA (12 USC 1833a): FIRREA gives DOJ authority to bring civil money penalty actions for fraud "affecting a federally insured financial institution." Penalties up to $1 million per violation or $5 million for continuing violations. FIRREA has been widely used in: residential mortgage fraud, LIBOR/benchmark manipulation, bank fraud, securities fraud affecting banks, and violations involving federally insured deposits. FIRREA's civil standard of proof (preponderance of evidence) makes it easier to pursue cases that may not meet criminal burden (beyond reasonable doubt).`],
    metadata: { source: 'DOJ', documentType: 'legal_framework', category: 'fraud_enforcement', subcategory: 'doj', url: 'https://www.justice.gov/civil/practice-areas-0' }
  },
];

// ─── Main execution ──────────────────────────────────────────────────────────

async function main() {
  const curatedOnly = process.argv.includes('--curated-only');

  console.log('\n=== Fraud & Financial Crime Knowledge Base RAG Seeder ===');
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
        category: doc.metadata.category || 'fraud',
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
