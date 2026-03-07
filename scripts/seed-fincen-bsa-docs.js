#!/usr/bin/env node

/**
 * Seed FinCEN, BSA/AML, FATF, and Treasury regulatory documents into Pinecone RAG.
 * Fetches web pages and indexes curated summaries for PDFs.
 *
 * Usage: PINECONE_API_KEY=... node scripts/seed-fincen-bsa-docs.js
 *        PINECONE_API_KEY=... node scripts/seed-fincen-bsa-docs.js --curated-only
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
  // Core BSA/AML
  { id: 'fincen-bsa-overview', title: 'Bank Secrecy Act Overview', url: 'https://www.fincen.gov/resources/statutes-and-regulations/bank-secrecy-act', category: 'bsa_aml', subcategory: 'framework' },
  { id: 'fincen-legal-authorities', title: 'FinCEN Legal Authorities', url: 'https://www.fincen.gov/resources/fincens-legal-authorities', category: 'bsa_aml', subcategory: 'framework' },
  { id: 'fincen-all-guidance', title: 'All FinCEN Guidance', url: 'https://www.fincen.gov/resources/statutes-regulations/guidance', category: 'bsa_aml', subcategory: 'guidance' },
  { id: 'fincen-all-advisories', title: 'All FinCEN Advisories', url: 'https://www.fincen.gov/resources/advisoriesbulletinsfact-sheets/advisories', category: 'bsa_aml', subcategory: 'advisories' },
  { id: 'fincen-alerts-bulletins', title: 'All Alerts/Notices/Bulletins', url: 'https://www.fincen.gov/resources/advisoriesbulletinsfact-sheets', category: 'bsa_aml', subcategory: 'alerts' },
  { id: 'fincen-sar-key-terms', title: 'SAR Key Terms by Advisory', url: 'https://www.fincen.gov/resources/suspicious-activity-report-sar-advisory-key-terms', category: 'bsa_aml', subcategory: 'sar' },

  // SAR
  { id: 'fincen-sar-faq-page', title: 'SAR FAQ Page', url: 'https://www.fincen.gov/resources/frequently-asked-questions-regarding-fincen-suspicious-activity-report-sar', category: 'bsa_aml', subcategory: 'sar' },

  // BEC
  { id: 'fincen-bec-advisory-2016', title: 'BEC Advisory (2016)', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2016-a003', category: 'fraud', subcategory: 'bec' },
  { id: 'fincen-bec-real-estate-2023', title: 'BEC in Real Estate FTA (2023)', url: 'https://www.fincen.gov/news/news-releases/fincen-exchange-forum-counters-business-email-compromise-scams', category: 'fraud', subcategory: 'bec' },

  // Check Fraud
  { id: 'fincen-check-fraud-fta-2024', title: 'Mail Theft Check Fraud FTA (2024)', url: 'https://www.fincen.gov/news/news-releases/fincen-issues-depth-analysis-check-fraud-related-mail-theft', category: 'fraud', subcategory: 'check_fraud' },

  // Romance/Pig Butchering
  { id: 'fincen-romance-scams-2025', title: 'Relationship Investment Scams Reminder (2025)', url: 'https://www.fincen.gov/news/news-releases/fincen-reminds-financial-institutions-remain-vigilant-regarding-potential', category: 'fraud', subcategory: 'pig_butchering' },

  // Elder
  { id: 'fincen-elder-advisory-2011', title: 'Elder Abuse Advisory (2011)', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2011-a003', category: 'fraud', subcategory: 'elder' },
  { id: 'fincen-elder-fta-2024', title: 'Elder Financial Exploitation FTA (2024)', url: 'https://www.fincen.gov/news/news-releases/fincen-issues-analysis-elder-financial-exploitation', category: 'fraud', subcategory: 'elder' },
  { id: 'fincen-elder-interagency', title: 'Interagency Statement on Elder Financial Exploitation', url: 'https://www.fincen.gov/resources/statutes-regulations/guidance/interagency-statement-elder-financial-exploitation', category: 'fraud', subcategory: 'elder' },

  // COVID
  { id: 'fincen-covid-eip-2021', title: 'COVID-19 Economic Impact Payments Fraud', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2021-a002', category: 'fraud', subcategory: 'covid' },
  { id: 'fincen-covid-resource', title: 'FinCEN COVID-19 Resource Page', url: 'https://www.fincen.gov/coronavirus', category: 'fraud', subcategory: 'covid' },

  // Mortgage
  { id: 'fincen-mortgage-fraud', title: 'Mortgage Fraud Resource Page', url: 'https://www.fincen.gov/mortgage-fraud', category: 'fraud', subcategory: 'mortgage' },
  { id: 'fincen-mortgage-advisory-2012', title: 'Mortgage Loan Fraud Advisory (2012)', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2012-a009', category: 'fraud', subcategory: 'mortgage' },
  { id: 'fincen-foreclosure-2009', title: 'Foreclosure Rescue Scams (2009)', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2009-a001', category: 'fraud', subcategory: 'mortgage' },
  { id: 'fincen-foreclosure-2010', title: 'Updated Foreclosure Rescue (2010)', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2010-a006', category: 'fraud', subcategory: 'mortgage' },
  { id: 'fincen-hecm-fraud', title: 'Home Equity Conversion Mortgage Fraud', url: 'https://www.fincen.gov/mortgage-fraud', category: 'fraud', subcategory: 'mortgage' },
  { id: 'fincen-foreclosure-page', title: 'Foreclosure Rescue Scams Page', url: 'https://www.fincen.gov/foreclosure-rescue-scams-loan-modification-fraud', category: 'fraud', subcategory: 'mortgage' },

  // Real Estate ML
  { id: 'fincen-real-estate-advisory', title: 'Real Estate Advisory (2017)', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2017-a003', category: 'aml', subcategory: 'real_estate' },

  // TBML
  { id: 'fincen-tbml-advisory-2010', title: 'TBML Advisory (2010)', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2010-a001', category: 'aml', subcategory: 'tbml' },
  { id: 'fincen-funnel-accounts-2014', title: 'Funnel Accounts & TBML (2014)', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a005', category: 'aml', subcategory: 'tbml' },

  // Human Trafficking
  { id: 'fincen-human-trafficking-2020', title: 'Human Trafficking Supplemental Advisory (2020)', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2020-a008', category: 'aml', subcategory: 'human_trafficking' },
  { id: 'fincen-human-trafficking-orig', title: 'Human Trafficking Advisory (2014)', url: 'https://www.fincen.gov/resources/advisoriesbulletinsfact-sheets/advisories', category: 'aml', subcategory: 'human_trafficking' },

  // Corruption
  { id: 'fincen-nicaragua-corruption', title: 'Nicaragua Corruption (2018)', url: 'https://www.fincen.gov/resources/advisoriesbulletinsfact-sheets/advisories', category: 'corruption', subcategory: 'kleptocracy' },

  // Cyber/Ransomware
  { id: 'fincen-cyber-advisory-2016', title: 'Cyber-Events Advisory (2016)', url: 'https://www.fincen.gov/resources/advisoriesbulletinsfact-sheets/advisories', category: 'cyber', subcategory: 'ransomware' },
  { id: 'fincen-ransomware-page', title: 'FinCEN Combats Ransomware', url: 'https://www.fincen.gov/resources/fincen-combats-ransomware', category: 'cyber', subcategory: 'ransomware' },

  // Virtual Currency
  { id: 'fincen-cvc-guidance-2019', title: 'Illicit CVC Activity Guidance (2019)', url: 'https://www.fincen.gov/news/news-releases/new-fincen-guidance-affirms-its-longstanding-regulatory-framework-virtual', category: 'crypto', subcategory: 'compliance' },
  { id: 'fincen-cvc-mixing-nprm', title: 'CVC Mixing NPRM (Section 311)', url: 'https://www.fincen.gov/news/news-releases/fincen-proposes-new-regulation-enhance-transparency-convertible-virtual-currency', category: 'crypto', subcategory: 'mixing' },
  { id: 'fincen-bitzlato-311', title: 'Bitzlato Section 311 Order', url: 'https://www.fincen.gov/news/news-releases/fincen-identifies-virtual-currency-exchange-bitzlato-primary-money-laundering', category: 'crypto', subcategory: 'enforcement' },
  { id: 'fincen-btce-enforcement', title: 'BTC-e Enforcement ($110M)', url: 'https://www.fincen.gov/news/news-releases/fincen-fines-btc-e-virtual-currency-exchange-110-million-facilitating-ransomware', category: 'crypto', subcategory: 'enforcement' },

  // Sanctions Evasion / Proliferation
  { id: 'fincen-nk-advisory-2013', title: 'North Korea Advisory (2013)', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2013-a005', category: 'sanctions', subcategory: 'north_korea' },
  { id: 'fincen-fatf-jurisdictions', title: 'FATF Jurisdictions Advisory', url: 'https://www.fincen.gov/news/news-releases/financial-action-task-force-identifies-jurisdictions-anti-money-laundering-1', category: 'sanctions', subcategory: 'fatf' },
  { id: 'fincen-iran-terrorism-2024', title: 'Iran-Backed Terrorism Financing (2024)', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2024-a001', category: 'sanctions', subcategory: 'iran' },
  { id: 'fincen-iran-oil-shadow-2025', title: 'Iranian Oil Smuggling/Shadow Banking (2025)', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2025-a002', category: 'sanctions', subcategory: 'iran' },
  { id: 'fincen-isis-financing-2025', title: 'ISIS Financing Advisory (2025)', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2025-a001', category: 'sanctions', subcategory: 'terrorism' },

  // AML Culture
  { id: 'fincen-compliance-culture-2014', title: 'Promoting a Culture of Compliance (2014)', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a007', category: 'bsa_aml', subcategory: 'culture' },
  { id: 'fincen-msb-monitoring', title: 'MSB Agent Monitoring Guidance', url: 'https://www.fincen.gov/resources/statutes-regulations/guidance/guidance-existing-aml-program-rule-compliance-obligations', category: 'bsa_aml', subcategory: 'msb' },

  // BOI
  { id: 'fincen-boi-reporting', title: 'BOI Reporting Final Rule', url: 'https://www.fincen.gov/boi', category: 'bsa_aml', subcategory: 'boi' },
  { id: 'fincen-boi-factsheet', title: 'BOI Fact Sheet', url: 'https://www.fincen.gov/beneficial-ownership-information-reporting-rule-fact-sheet', category: 'bsa_aml', subcategory: 'boi' },
  { id: 'fincen-boi-faqs', title: 'BOI FAQs', url: 'https://www.fincen.gov/boi-faqs', category: 'bsa_aml', subcategory: 'boi' },

  // FFIEC
  { id: 'ffiec-exam-manual', title: 'FFIEC BSA/AML Examination Manual', url: 'https://bsaaml.ffiec.gov/manual', category: 'bsa_aml', subcategory: 'ffiec' },
  { id: 'ffiec-exam-procedures', title: 'FFIEC Examination Procedures', url: 'https://bsaaml.ffiec.gov/examprocedures', category: 'bsa_aml', subcategory: 'ffiec' },
  { id: 'ffiec-infobase', title: 'FFIEC BSA/AML InfoBase', url: 'https://bsaaml.ffiec.gov/', category: 'bsa_aml', subcategory: 'ffiec' },
  { id: 'ffiec-resources', title: 'FFIEC Agency Resources', url: 'https://bsaaml.ffiec.gov/resources', category: 'bsa_aml', subcategory: 'ffiec' },
  { id: 'ffiec-whatsnew', title: 'FFIEC Updates', url: 'https://bsaaml.ffiec.gov/whatsnew', category: 'bsa_aml', subcategory: 'ffiec' },

  // FATF
  { id: 'fatf-recommendations-page', title: 'FATF 40 Recommendations Page', url: 'https://www.fatf-gafi.org/en/publications/Fatfrecommendations/Fatf-recommendations.html', category: 'fatf', subcategory: 'standards' },
  { id: 'fatf-topics', title: 'FATF Topics Overview', url: 'https://www.fatf-gafi.org/en/topics.html', category: 'fatf', subcategory: 'overview' },

  // FTAs
  { id: 'fincen-all-ftas', title: 'All Financial Trend Analyses', url: 'https://www.fincen.gov/resources/financial-trend-analyses', category: 'bsa_aml', subcategory: 'fta' },
  { id: 'fincen-sar-activity-reviews', title: 'SAR Activity Reviews', url: 'https://www.fincen.gov/resources/sar-activity-reviews', category: 'bsa_aml', subcategory: 'sar' },

  // Enforcement
  { id: 'fincen-enforcement-actions', title: 'FinCEN Enforcement Actions', url: 'https://www.fincen.gov/news-room/enforcement-actions', category: 'enforcement', subcategory: 'fincen' },
];

// ─── Curated summaries for PDFs ─────────────────────────────────────────────

const CURATED_CHUNKS = [
  // Core Framework
  {
    id: 'fincen-aml-program-rule-2024',
    title: 'AML/CFT Program Rule (2024 NPRM)',
    url: 'https://www.fincen.gov/system/files/shared/Program-NPRM-FactSheet-508.pdf',
    category: 'bsa_aml', subcategory: 'framework',
    chunks: [
      'FinCEN AML/CFT Program Rule (2024 NPRM). FinCEN proposed rule to strengthen AML/CFT programs for financial institutions. Key requirements: 1) RISK ASSESSMENT — Financial institutions must conduct and document a risk assessment of their ML/TF/PF risks. 2) RISK-BASED APPROACH — AML programs must be risk-based, allocating more resources to higher-risk areas. 3) GOVERNMENT PRIORITIES — Programs must incorporate FinCEN\'s AML/CFT priorities (fraud, cybercrime, terrorism financing, drug trafficking, corruption, human trafficking, proliferation financing, sanctions evasion). 4) BENEFICIAL OWNERSHIP — Programs must incorporate procedures for collecting and verifying beneficial ownership information. 5) INDEPENDENT TESTING — Regular independent testing of AML program effectiveness. 6) BOARD/SENIOR MANAGEMENT OVERSIGHT — Senior management must approve AML programs and receive regular reports. This rule codifies risk-based approach as regulatory standard.',
    ],
  },

  // SAR
  {
    id: 'fincen-sar-filing-instructions',
    title: 'SAR Filing Instructions',
    url: 'https://www.fincen.gov/system/files/shared/FinCEN%20SAR%20ElectronicFilingInstructions-%20Stand%20Alone%20doc.pdf',
    category: 'bsa_aml', subcategory: 'sar',
    chunks: [
      'FinCEN SAR Filing Instructions. Suspicious Activity Reports (SARs) must be filed by financial institutions when they detect suspicious transactions. Filing requirements: 1) THRESHOLD — Banks must file SARs for transactions of $5,000+ that are suspicious. MSBs file for $2,000+. Casinos file for $5,000+. 2) TIMING — SARs must be filed within 30 calendar days of detection. If no suspect identified, 60-day extension allowed. 3) NARRATIVE — SAR narrative is most critical element. Must describe: Who conducted the activity? What instruments/mechanisms were used? When did it occur? Where did it take place? Why is it suspicious? How was it carried out? 4) CONFIDENTIALITY — SARs are confidential. Filing institution may not notify the subject. Violation of SAR confidentiality is a criminal offense. 5) SAFE HARBOR — Financial institutions and their employees are protected from civil liability for filing SARs in good faith. 6) CONTINUING ACTIVITY — File continuation SARs every 90 days if suspicious activity continues.',
    ],
  },
  {
    id: 'fincen-sar-faqs-2025',
    title: 'SAR FAQs (Oct 2025)',
    url: 'https://www.fincen.gov/system/files/2025-10/SAR-FAQs-October-2025.pdf',
    category: 'bsa_aml', subcategory: 'sar',
    chunks: [
      'FinCEN SAR FAQs (October 2025 Update). Key clarifications: 1) AGGREGATION — Financial institutions should aggregate suspicious transactions by subject, not just by account. Multiple transactions that individually fall below threshold but collectively suggest suspicious activity should be reported. 2) CYBER-RELATED — SARs involving cyber events should use SAR key term "CYBER EVENT" and include IP addresses, email addresses, and virtual currency addresses when available. 3) VIRTUAL CURRENCY — VASPs (Virtual Asset Service Providers) have same SAR obligations as traditional financial institutions. Include blockchain addresses, transaction hashes, and exchange identifiers. 4) THIRD-PARTY PAYMENT PROCESSORS — Payment processors must file SARs for suspicious transactions processed on behalf of merchants. 5) ELDER EXPLOITATION — Use key term "FIN-2022-EFE" for elder financial exploitation. 6) BEC — Use key term "BEC FRAUD" for business email compromise. 7) PIG BUTCHERING — Use key term "FIN-2023-PIGBUTCHERING" for pig butchering/romance investment scams.',
    ],
  },
  {
    id: 'fincen-sar-narrative-guidance',
    title: 'SAR Narrative Guidance',
    url: 'https://www.fincen.gov/system/files/shared/sarnarrcompletguidfinal_112003.pdf',
    category: 'bsa_aml', subcategory: 'sar',
    chunks: [
      'FinCEN SAR Narrative Completion Guidance. The narrative is the most valuable part of a SAR for law enforcement. Best practices: 1) FIVE Ws — Every narrative must clearly answer Who, What, When, Where, Why, and How. 2) SPECIFICITY — Include specific dollar amounts, dates, account numbers, identification numbers, addresses. Avoid vague language. 3) PATTERNS — Describe the pattern of activity, not just individual transactions. How did transactions relate to each other? 4) RED FLAGS — Explain why the activity is suspicious. What red flags triggered the filing? 5) STRUCTURING — For structuring, detail the pattern: amounts, frequency, locations, whether customer appeared aware of reporting thresholds. 6) SUBJECT INFO — Include all identifying information for subjects: full name, DOB, SSN/TIN, address, occupation, account numbers, driver license, passport. 7) BENEFICIAL OWNERS — If suspicious activity involves an entity, include beneficial ownership information. 8) RELATED SARs — Reference prior SAR filings on the same subject or activity pattern.',
    ],
  },

  // BEC
  {
    id: 'fincen-bec-advisory-2019',
    title: 'Updated BEC Advisory (2019)',
    url: 'https://www.fincen.gov/sites/default/files/advisory/2019-07-16/Updated%20BEC%20Advisory%20FINAL%20508.pdf',
    category: 'fraud', subcategory: 'bec',
    chunks: [
      'FinCEN Updated BEC Advisory (2019). Business Email Compromise (BEC) schemes have evolved significantly. Key typologies: 1) CEO FRAUD — Criminal impersonates CEO/executive, emails finance department requesting urgent wire transfer. Often timed when CEO is traveling. 2) VENDOR EMAIL COMPROMISE — Criminal compromises vendor email, sends fake invoices with altered bank details. 3) ATTORNEY IMPERSONATION — Criminal impersonates attorney handling confidential transactions, pressures victim to act quickly. 4) W-2/DATA THEFT — Criminal impersonates HR executive, requests employee tax records for identity theft. 5) REAL ESTATE BEC — Criminal inserts themselves into real estate transactions, redirects closing funds. Red flags: urgency/secrecy requests, domain spoofing (l vs 1, rn vs m), changes to established payment instructions, new beneficiary accounts, requests to bypass approval processes. Financial institutions should: verify wire transfer requests through established callback procedures, flag changes to beneficiary information, implement dual authorization for large transfers. SAR key term: "BEC FRAUD" or "EMAIL COMPROMISE."',
    ],
  },

  // Check Fraud
  {
    id: 'fincen-check-fraud-alert-2023',
    title: 'Mail Theft-Related Check Fraud Alert (2023)',
    url: 'https://www.fincen.gov/system/files/shared/FinCEN%20Alert%20Mail%20Theft-Related%20Check%20Fraud%20FINAL%20508.pdf',
    category: 'fraud', subcategory: 'check_fraud',
    chunks: [
      'FinCEN Alert: Mail Theft-Related Check Fraud (2023). Dramatic increase in check fraud driven by mail theft. Red flags: 1) ALTERED PAYEE — Check payee name has been chemically washed or altered. Ink inconsistencies, different handwriting for payee vs other fields. 2) ALTERED AMOUNT — Dollar amount appears modified. 3) MOBILE DEPOSIT FRAUD — Same check deposited via mobile at multiple institutions. 4) COUNTERFEIT CHECKS — High-quality reproductions of legitimate checks using stolen account/routing numbers. 5) STOLEN MAIL — Customer reports mail theft, followed by unauthorized check activity. 6) ACCOUNT TAKEOVER — Checks deposited into newly opened accounts, rapid withdrawal follows. Typology: Criminals steal mail from USPS blue collection boxes, residential mailboxes, intercept at carrier routes. Checks are chemically washed to change payee, then deposited. Organized rings recruit money mules to open accounts for deposits. SAR key term: "FIN-2023-MAILTHEFT." Financial institutions should implement: positive pay systems, check image analysis, monitoring for mail theft patterns.',
    ],
  },

  // Pig Butchering
  {
    id: 'fincen-pig-butchering-2023',
    title: 'Pig Butchering Alert (2023)',
    url: 'https://www.fincen.gov/system/files/shared/FinCEN_Alert_Pig_Butchering_FINAL_508c.pdf',
    category: 'fraud', subcategory: 'pig_butchering',
    chunks: [
      'FinCEN Alert: Pig Butchering / Relationship Investment Scams (2023). Pig butchering is a form of fraud combining romance scams with fake investment platforms. Phases: 1) TARGETING — Victims contacted via social media, dating apps, or "wrong number" text messages. 2) GROOMING — Scammer builds trust over weeks/months, develops romantic or close relationship. 3) INVESTMENT INTRODUCTION — Scammer casually mentions successful cryptocurrency/investment trading. 4) FAKE PLATFORM — Victim directed to fraudulent trading platform that shows fake profits. 5) ESCALATION — Victim deposits increasing amounts, sees fake returns, encouraged to invest more. 6) SLAUGHTER — When victim tries to withdraw, told they owe "taxes" or "fees." Platform disappears. Red flags for financial institutions: Customer suddenly making large cryptocurrency purchases, customer mentions online relationship with investment advice, wire transfers to cryptocurrency exchanges from previously inactive accounts, urgency to move funds, customer references investment platform that cannot be verified. SAR key term: "FIN-2023-PIGBUTCHERING." Victims often subjected to forced labor at scam compounds in Southeast Asia.',
    ],
  },

  // Elder Exploitation
  {
    id: 'fincen-elder-advisory-2022',
    title: 'Elder Financial Exploitation Advisory (2022)',
    url: 'https://www.fincen.gov/sites/default/files/advisory/2022-06-15/FinCEN%20Advisory%20Elder%20Financial%20Exploitation%20FINAL%20508.pdf',
    category: 'fraud', subcategory: 'elder',
    chunks: [
      'FinCEN Advisory: Elder Financial Exploitation (2022). Elder financial exploitation causes estimated $28.3B in annual losses. Key typologies: 1) CAREGIVER/FAMILY EXPLOITATION — Family member or caregiver controls finances, diverts funds, changes beneficiaries. 2) ROMANCE/CONFIDENCE SCAMS — Targeting elderly via online dating, religious groups, phone calls. 3) TECH SUPPORT SCAMS — Fake pop-ups claiming computer infected, demand payment for fake repairs. 4) GOVERNMENT IMPERSONATION — IRS, Social Security, Medicare scams demanding immediate payment. 5) INVESTMENT FRAUD — Targeting retirement savings through Ponzi schemes, unregistered securities. Red flags: unusual account activity inconsistent with customer history, third party suddenly involved in finances, fear/confusion during transactions, large withdrawals or wire transfers unusual for the customer, new authorized signers or POA, customer unable to explain transactions, reluctance to discuss account activity in front of companion. SAR key term: "FIN-2022-EFE." Financial institutions should: train tellers on elder abuse indicators, implement alerts for unusual activity patterns, allow extra time for elderly customers, establish adult protective services contacts.',
    ],
  },

  // Deepfakes
  {
    id: 'fincen-deepfakes-alert-2024',
    title: 'Deepfake Media Alert (2024)',
    url: 'https://www.fincen.gov/system/files/shared/FinCEN-Alert-DeepFakes-Alert508FINAL.pdf',
    category: 'fraud', subcategory: 'deepfakes',
    chunks: [
      'FinCEN Alert: Deepfake Media and Identity Fraud (2024). Generative AI enables creation of highly realistic fake identity documents, voice clones, and video deepfakes used to circumvent financial institution controls. Red flags: 1) DOCUMENT FRAUD — AI-generated ID documents with inconsistent fonts, metadata anomalies, mismatched photos. 2) VOICE CLONING — Customers contacted by phone sound different than usual, or verification calls sound artificial. 3) VIDEO DEEPFAKES — Synthetic video used to pass live identity verification/KYC checks. 4) SYNTHETIC IDENTITIES — AI-generated photos combined with stolen or fabricated PII to create entirely new identities. 5) ACCOUNT OPENING — Multiple accounts opened using AI-generated documents with similar patterns. Countermeasures: multi-factor authentication beyond voice/video, liveness detection in biometric systems, metadata analysis of submitted documents, cross-referencing identity data across databases, behavioral analytics to detect anomalies post-account-opening. Financial institutions should update their risk assessments to account for AI-enabled fraud vectors.',
    ],
  },

  // COVID
  {
    id: 'fincen-covid-ui-fraud-2020',
    title: 'COVID-19 Unemployment Insurance Fraud (2020)',
    url: 'https://www.fincen.gov/system/files/advisory/2020-10-13/Advisory%20Unemployment%20Insurance%20COVID%2019%20508%20Final.pdf',
    category: 'fraud', subcategory: 'covid',
    chunks: [
      'FinCEN Advisory: COVID-19 Unemployment Insurance Fraud (2020). Massive fraud targeting pandemic unemployment programs. Red flags: 1) MULTIPLE STATES — Individual receiving UI benefits from multiple states simultaneously. 2) IDENTITY THEFT — UI payments deposited into accounts that don\'t match the name on the claim. 3) BULK FILINGS — Multiple UI claims from same IP address, same device, or same email patterns. 4) MONEY MULES — Accounts receiving multiple UI deposits from different states, rapid withdrawal follows. 5) PREPAID CARDS — UI debit cards loaded and quickly drained. 6) PRISONERS — Claims filed using identities of incarcerated individuals. 7) DECEASED — Claims using identities of deceased persons. Estimated $80B+ in pandemic UI fraud. Financial institutions should: monitor for multiple state UI deposits, flag accounts with unusual UI deposit patterns, cross-reference against deceased registries, file SARs promptly.',
    ],
  },
  {
    id: 'fincen-covid-erc-fraud-2023',
    title: 'COVID-19 ERC Fraud Alert (2023)',
    url: 'https://www.fincen.gov/system/files/shared/FinCEN_ERC_Fraud_Alert_FINAL508.pdf',
    category: 'fraud', subcategory: 'covid',
    chunks: [
      'FinCEN Alert: Employee Retention Credit (ERC) Fraud (2023). Widespread fraud involving false ERC claims. The ERC was a refundable tax credit for employers who retained employees during COVID-19. Red flags: 1) ERC MILLS — Third-party promoters filing false claims on behalf of businesses, often on contingency fee basis. 2) INELIGIBLE BUSINESSES — Businesses that did not experience qualifying revenue decline or government orders filing claims. 3) LARGE REFUNDS — Unusually large IRS refund checks deposited by businesses. 4) MARKETING — Aggressive marketing by promoters guaranteeing ERC eligibility. 5) AMENDED RETURNS — Businesses filing amended returns solely to claim ERC they previously did not claim. SAR key term: "FIN-2023-ERCFRAUD." IRS has identified over $1B in fraudulent ERC claims.',
    ],
  },

  // Disaster Fraud
  {
    id: 'fincen-disaster-fraud-2017',
    title: 'Disaster-Related Fraud Advisory (2017)',
    url: 'https://www.fincen.gov/system/files/advisory/2017-10-31/FinCEN%20Advisory%20FIN-2017-A007-508%20Compliant.pdf',
    category: 'fraud', subcategory: 'disaster',
    chunks: [
      'FinCEN Advisory: Disaster-Related Financial Fraud (2017). Following natural disasters, criminals exploit relief programs and vulnerable victims. Key typologies: 1) FEMA FRAUD — Filing false claims for disaster assistance, claiming damage to properties not in affected areas. 2) CHARITY SCAMS — Fake charities soliciting donations, diverting funds. 3) CONTRACTOR FRAUD — Unlicensed contractors taking advance payments, performing substandard or no work. 4) INSURANCE FRAUD — Inflating damage claims, filing claims for pre-existing damage. 5) IDENTITY THEFT — Stealing PII from displaced persons to file false claims. 6) PRICE GOUGING — Essential goods/services at exploitative prices. Red flags: large cash deposits from disaster relief, newly opened accounts in disaster areas, suspicious wire activity following disaster declarations, accounts receiving multiple FEMA/SBA disaster payments.',
    ],
  },

  // Fentanyl
  {
    id: 'fincen-fentanyl-advisory-2019',
    title: 'Fentanyl/Synthetic Opioids Advisory (2019)',
    url: 'https://www.fincen.gov/system/files/advisory/2019-08-21/Fentanyl%20Advisory%20FINAL%20508.pdf',
    category: 'drugs', subcategory: 'fentanyl',
    chunks: [
      'FinCEN Advisory: Fentanyl and Synthetic Opioid Trafficking (2019). Illicit fentanyl is the leading cause of drug overdose deaths in the US. Financial red flags: 1) PRECURSOR PURCHASES — Purchases of precursor chemicals from Chinese suppliers, often via wire transfers or cryptocurrency. 2) PILL PRESS EQUIPMENT — Purchases of pill press machines, die molds, binding agents from online marketplaces. 3) SHIPPING PATTERNS — Small packages from China/Mexico containing fentanyl or precursors, use of freight forwarders to obscure origin. 4) DARKNET MARKETS — Cryptocurrency transactions linked to darknet drug markets. 5) CASH-INTENSIVE — Structuring of cash deposits by drug trafficking organizations. 6) MONEY LAUNDERING — Funnel accounts receiving deposits in drug source cities, wire transfers to Mexico/China. Supply chain: Chinese chemical companies produce precursors → shipped to Mexican cartels → processed into fentanyl/pills → distributed in US. SAR key term: "FIN-2019-FENTANYL."',
    ],
  },
  {
    id: 'fincen-fentanyl-supplemental-2024',
    title: 'Supplemental Fentanyl Precursor Advisory (2024)',
    url: 'https://www.fincen.gov/system/files/advisory/2024-06-20/FinCEN-Supplemental-Advisory-on-Fentanyl-508C.pdf',
    category: 'drugs', subcategory: 'fentanyl',
    chunks: [
      'FinCEN Supplemental Advisory: Fentanyl-Related Financial Activity (2024). Updated guidance reflecting evolving fentanyl supply chains. Key updates: 1) CHINESE MONEY LAUNDERING NETWORKS (CMLNs) — Professional money laundering organizations based in China providing financial services to Mexican cartels. Use mirror transactions, trade-based laundering, and cryptocurrency to move drug proceeds. 2) CRYPTOCURRENCY EVOLUTION — Increased use of stablecoins (USDT), DEXs, and cross-chain bridges to move fentanyl proceeds. 3) SOCIAL MEDIA SALES — Fentanyl pills sold openly on social media platforms with cryptocurrency payment. 4) XYLAZINE — New adulterant "tranq" (xylazine) appearing in fentanyl supply, creating additional public health crisis. 5) NITAZENES — New class of synthetic opioids more potent than fentanyl entering supply chain. Financial institutions should monitor for: cryptocurrency exchanges with high Mexico/China transaction volumes, wire transfers to chemical companies, purchases of lab equipment.',
    ],
  },

  // Corruption/Kleptocracy
  {
    id: 'fincen-kleptocracy-2022',
    title: 'Kleptocracy & Foreign Public Corruption (2022)',
    url: 'https://www.fincen.gov/system/files/advisory/2022-04-14/FinCEN%20Advisory%20Corruption%20FINAL%20508.pdf',
    category: 'corruption', subcategory: 'kleptocracy',
    chunks: [
      'FinCEN Advisory: Kleptocracy and Foreign Public Corruption (2022). Corrupt foreign officials use US financial system to launder proceeds. Red flags: 1) PEP IDENTIFICATION — Politically Exposed Persons (current/former senior officials, their family, close associates) with unexplained wealth. 2) SHELL COMPANIES — PEPs using US shell companies, trusts, or other legal entities to hold assets. 3) LUXURY REAL ESTATE — High-value property purchases through anonymous LLCs, all-cash purchases. 4) GATEKEEPERS — Use of lawyers, accountants, real estate agents, wealth managers as intermediaries. 5) CORRESPONDENT BANKING — Funds routed through multiple jurisdictions to obscure origin. 6) FAMILY MEMBERS — Wealth flowing to family members with no independent means of support. 7) GOLDEN VISAS — Investment immigration programs used to access US/Western financial systems. Kleptocrats typically launder through: real estate, luxury goods, fine art, private banking, investment vehicles, educational institutions. Financial institutions should: implement PEP screening, conduct enhanced due diligence on high-risk customers, monitor for shell company activity.',
    ],
  },
  {
    id: 'fincen-pep-facilitators-2018',
    title: 'Human Rights Abuses & Corrupt PEPs (2018)',
    url: 'https://www.fincen.gov/system/files/advisory/2018-06-12/PEP%20Facilitator%20Advisory_FINAL%20508.pdf',
    category: 'corruption', subcategory: 'pep',
    chunks: [
      'FinCEN Advisory: PEP Facilitators Enabling Human Rights Abuses and Corruption (2018). Corrupt PEPs rely on professional facilitators to move and hide illicit wealth. Key facilitator roles: 1) LAWYERS — Setting up shell companies, trusts, creating legal structures to hide beneficial ownership. 2) ACCOUNTANTS — Creating false financial records, managing offshore structures, facilitating tax evasion. 3) REAL ESTATE PROFESSIONALS — Facilitating anonymous property purchases, using LLCs to hide buyer identity. 4) WEALTH MANAGERS — Opening accounts, managing investments, providing access to financial system. 5) TRUST AND COMPANY SERVICE PROVIDERS — Creating nominee arrangements, providing registered agent services. Red flags for facilitators: creating complex multi-jurisdictional structures with no apparent business purpose, using client funds accounts to avoid reporting, refusing to provide beneficial ownership information, clients with connections to authoritarian regimes, transactions with no economic rationale.',
    ],
  },

  // Ransomware
  {
    id: 'fincen-ransomware-advisory-2021',
    title: 'Ransomware Advisory (2021)',
    url: 'https://www.fincen.gov/system/files/advisory/2021-11-08/FinCEN%20Ransomware%20Advisory_FINAL_508_.pdf',
    category: 'cyber', subcategory: 'ransomware',
    chunks: [
      'FinCEN Advisory: Ransomware and Financial Intermediaries (2021). Ransomware attacks continue to escalate, with payments often made in cryptocurrency. Red flags: 1) CRYPTOCURRENCY PURCHASES — Customer urgently purchasing large amounts of CVC, especially if not typical behavior. 2) CVC EXCHANGES — Exchanges processing ransomware payments, often with nexus to high-risk jurisdictions. 3) NESTED SERVICES — Exchanges operating within exchanges (nested services) to facilitate ransomware payments. 4) MIXERS/TUMBLERS — Use of CVC mixing services to obscure transaction trail. 5) DARKNET — Ransomware-as-a-Service (RaaS) operations advertised on darknet forums. 6) NEGOTIATION FIRMS — Third-party firms negotiating with ransomware operators on behalf of victims. Ransomware variants of note: REvil, DarkSide, Conti, LockBit, BlackCat/ALPHV, Hive. OFAC warnings: Paying ransomware may violate sanctions if threat actor is a sanctioned entity (e.g., Lazarus Group/DPRK, Evil Corp/Russia). Financial institutions facilitating ransomware payments risk sanctions violations.',
    ],
  },

  // Chinese Money Laundering Networks
  {
    id: 'fincen-cmln-advisory-2025',
    title: 'Chinese Money Laundering Networks Advisory (2025)',
    url: 'https://www.fincen.gov/system/files/2025-08/FinCEN-Advisory-CMLN-508.pdf',
    category: 'aml', subcategory: 'cmln',
    chunks: [
      'FinCEN Advisory: Chinese Money Laundering Networks (CMLNs) (2025). Professional money laundering organizations based in China providing laundering services to drug cartels, fraud rings, and other criminal enterprises. Key characteristics: 1) MIRROR TRANSACTIONS — CMLNs accept USD cash in the US and deliver equivalent value in Chinese yuan (or pesos) in China/Mexico, without cross-border wire transfers. 2) TRADE-BASED ML — Using import/export businesses to move value through over/under-invoicing. 3) CRYPTOCURRENCY — Using stablecoins and P2P platforms to transfer value internationally. 4) FUNNEL ACCOUNTS — US bank accounts receiving structured cash deposits from multiple cities. 5) UNDERGROUND BANKING — Informal value transfer networks operating outside regulated financial system. CMLNs serve multiple criminal clienteles: Mexican cartels (drug proceeds), fraud rings (scam proceeds), human smuggling networks, sanction evaders. SAR key term: "CMLN-2025-A003." Red flags: accounts with deposits in multiple US cities, rapid movement of funds internationally, business accounts with activity inconsistent with stated purpose.',
    ],
  },

  // North Korea
  {
    id: 'fincen-nk-advisory-2017',
    title: 'North Korea Advisory (2017)',
    url: 'https://www.fincen.gov/sites/default/files/advisory/2017-11-02/DPRK%20Advisory%20FINAL%20508%20C.pdf',
    category: 'sanctions', subcategory: 'north_korea',
    chunks: [
      'FinCEN Advisory: North Korea Financial Threats (2017). North Korea uses the international financial system to evade sanctions, fund weapons programs, and generate revenue. Key methods: 1) FRONT COMPANIES — DPRK operates front companies worldwide, particularly in China, Southeast Asia, Africa. Companies obscure DPRK connections through layered ownership. 2) DIPLOMATIC PERSONNEL — North Korean diplomats involved in illicit procurement and revenue generation. 3) FORCED LABOR — DPRK sends workers abroad (construction, manufacturing), regime seizes most wages. 4) ARMS TRAFFICKING — Weapons sales to sanctioned states and non-state actors. 5) CYBER THEFT — Lazarus Group and other DPRK-linked hackers stealing from financial institutions and cryptocurrency exchanges. Notable thefts: Bangladesh Bank ($81M), Ronin Bridge ($625M). 6) IT WORKERS — DPRK nationals obtaining remote IT jobs under false identities, earnings funneled to regime. Red flags: transactions with DPRK-linked entities, payments to workers in Southeast Asia with DPRK connections, cryptocurrency transactions linked to known DPRK wallet clusters.',
    ],
  },

  // FATF 40 Recommendations
  {
    id: 'fatf-40-recommendations',
    title: 'FATF 40 Recommendations',
    url: 'https://www.fatf-gafi.org/content/dam/fatf-gafi/recommendations/FATF%20Recommendations%202012.pdf.coredownload.inline.pdf',
    category: 'fatf', subcategory: 'standards',
    chunks: [
      'FATF 40 Recommendations — International AML/CFT Standards. The Financial Action Task Force 40 Recommendations are the international standard for combating money laundering, terrorist financing, and proliferation financing. Key recommendations: R1-R2: AML/CFT Policies and Coordination — Countries must assess ML/TF risks, have national AML/CFT policies, designate an authority for coordination. R3: Money Laundering Offense — Countries must criminalize money laundering consistent with Vienna and Palermo Conventions. R5: Terrorist Financing Offense — Must criminalize terrorist financing. R10: Customer Due Diligence (CDD) — Financial institutions must identify and verify customer identity, beneficial ownership, understand nature of business relationship. R12: PEPs — Enhanced due diligence for Politically Exposed Persons. R15: New Technologies — Countries must assess ML/TF risks of new technologies including virtual assets. R16: Wire Transfers — Originator and beneficiary information must accompany wire transfers. R20: Suspicious Transaction Reporting — Financial institutions must file STRs/SARs. R24: Transparency of Legal Persons — Countries must ensure adequate transparency of beneficial ownership. R35: Sanctions — Countries must implement targeted financial sanctions for terrorism and proliferation financing.',
      'FATF Risk-Based Approach and Mutual Evaluations. R1 requires countries to identify, assess, and understand their ML/TF risks and apply a risk-based approach. This means: higher-risk areas receive more resources and scrutiny, lower-risk areas may receive simplified measures. FATF conducts Mutual Evaluations of member countries assessing: Technical Compliance (do laws exist?) and Effectiveness (do they work in practice?). Countries rated on 11 Immediate Outcomes covering: risk assessment, international cooperation, supervision, preventive measures, legal persons transparency, financial intelligence, investigation/prosecution, confiscation, terrorist financing, proliferation financing, sanctions. Countries failing evaluation placed on: Grey List (increased monitoring) or Black List (high-risk, countermeasures recommended). Current Black List: Iran, Myanmar, North Korea. Grey List: varies but has included Pakistan, South Africa, Nigeria, UAE, Turkey, Philippines.',
    ],
  },

  // Treasury Risk Assessments
  {
    id: 'treasury-ml-risk-assessment-2024',
    title: '2024 National Money Laundering Risk Assessment',
    url: 'https://home.treasury.gov/system/files/136/2024-National-Money-Laundering-Risk-Assessment.pdf',
    category: 'treasury', subcategory: 'risk_assessment',
    chunks: [
      'US Treasury 2024 National Money Laundering Risk Assessment. Key findings: 1) TOP ML THREATS — Drug trafficking (fentanyl), fraud (BEC, romance scams, identity fraud), corruption, professional money laundering networks (CMLNs). 2) REAL ESTATE — Continues to be significant ML vulnerability. All-cash transactions, use of shell companies, geographic concentration in major metros. 3) VIRTUAL ASSETS — Cryptocurrency increasingly used for ML, with DeFi and cross-chain bridges creating new challenges. 4) BENEFICIAL OWNERSHIP — Despite CTA/BOI reporting, shell companies remain primary ML vehicle. 5) GATEKEEPERS — Lawyers, accountants, real estate agents, trust/company service providers facilitate ML. Not all subject to AML obligations. 6) TRADE-BASED ML — Import/export fraud, misrepresentation of goods, funnel accounts. 7) CASH — Despite declining use, cash remains key ML mechanism, especially for drug trafficking. 8) EMERGING RISKS — AI-enabled fraud (deepfakes), private credit markets, digital identity fraud. Recommendations: strengthen beneficial ownership transparency, expand AML obligations to gatekeepers, enhance virtual asset supervision.',
    ],
  },
  {
    id: 'treasury-tf-risk-assessment-2024',
    title: '2024 National Terrorist Financing Risk Assessment',
    url: 'https://home.treasury.gov/system/files/136/2024-National-Terrorist-Financing-Risk-Assessment.pdf',
    category: 'treasury', subcategory: 'risk_assessment',
    chunks: [
      'US Treasury 2024 National Terrorist Financing Risk Assessment. Key findings: 1) DOMESTIC VIOLENT EXTREMISM — Self-funded through personal income, small purchases of weapons/materials. Low-value transactions make detection difficult. 2) HAMAS — Fundraising through cryptocurrency, charities, and informal transfer systems. Significant increase post-October 2023. 3) HEZBOLLAH — Drug trafficking, trade-based schemes, diamond trade, used car networks. 4) ISIS — Remnant networks using hawala, cryptocurrency, and abuse of non-profit sector. 5) AL-QAEDA — Reduced but persistent threat. Donations, small businesses, honey trade. 6) IRAN — State sponsorship of terrorism through financial networks, sanctions evasion. 7) CROWDFUNDING — Online platforms used to raise small amounts from many donors. 8) CRYPTOCURRENCY — Growing use by terrorist organizations, particularly stablecoins. OFAC designations remain primary disruption tool.',
    ],
  },
  {
    id: 'treasury-pf-risk-assessment-2024',
    title: '2024 National Proliferation Financing Risk Assessment',
    url: 'https://home.treasury.gov/system/files/136/2024-National-Proliferation-Financing-Risk-Assessment.pdf',
    category: 'treasury', subcategory: 'risk_assessment',
    chunks: [
      'US Treasury 2024 National Proliferation Financing Risk Assessment. Key findings: 1) NORTH KOREA — DPRK remains top PF threat. Revenue generation through: cyber theft (Lazarus Group), IT worker fraud, arms sales, forced labor. DPRK targets cryptocurrency exchanges and DeFi protocols. 2) IRAN — Procurement networks for missile/nuclear programs using front companies in Turkey, UAE, China, Malaysia. 3) DUAL-USE GOODS — Advanced manufacturing equipment, electronics, software, chemicals. 4) PROCUREMENT NETWORKS — Multi-layered company structures across jurisdictions to obscure end-user. 5) ACADEMIC/RESEARCH — Exploitation of academic and research institutions for technology transfer. 6) SHIPPING — Deceptive shipping practices to move controlled goods. Red flags: orders for dual-use goods with vague end-use descriptions, transactions involving known PF jurisdictions, customers reluctant to provide end-user certificates, payment through third countries inconsistent with trade route.',
    ],
  },

  // Fentanyl FTA
  {
    id: 'fincen-fentanyl-fta-2025',
    title: 'Fentanyl FTA (2025)',
    url: 'https://www.fincen.gov/system/files/shared/FinCEN-FTA-Fentanyl.pdf',
    category: 'drugs', subcategory: 'fentanyl',
    chunks: [
      'FinCEN Financial Trend Analysis: Fentanyl (2025). Analysis of SAR filings related to fentanyl trafficking. Key findings: 1) VOLUME — SAR filings mentioning fentanyl increased 375% from 2019-2024. 2) GEOGRAPHY — Highest concentrations in California, Texas, Arizona (border states) and Ohio, Pennsylvania, Massachusetts (distribution hubs). 3) FINANCIAL PATTERNS — Structured cash deposits ($5,000-$9,000), funnel account activity (deposits in one city, withdrawals in another), wire transfers to Mexico and China. 4) CRYPTOCURRENCY — Growing use of P2P platforms and stablecoins for payment, particularly for precursor chemical purchases from China. 5) MONEY LAUNDERING METHODS — CMLNs providing laundering services to cartels, TBML through import/export businesses, real estate purchases in source/transit cities. 6) MULES — Recruitment of money mules through social media for cash pickups and deposits.',
    ],
  },

  // CMLN FTA
  {
    id: 'fincen-cmln-fta-2025',
    title: 'Chinese Money Laundering Networks FTA (2025)',
    url: 'https://www.fincen.gov/system/files/2025-08/4000-10-INV-144549-S3F6L-FTA-CMLN-508.pdf',
    category: 'aml', subcategory: 'cmln',
    chunks: [
      'FinCEN Financial Trend Analysis: Chinese Money Laundering Networks (2025). Detailed analysis of CMLN operations from SAR data. Key findings: 1) SCALE — CMLNs move billions annually, serving as professional launderers for multiple criminal organizations simultaneously. 2) OPERATIONAL MODEL — CMLNs operate as value transfer brokers: accept cash in US, deliver equivalent value in yuan/pesos abroad through mirror transactions, trade invoicing, or crypto. No actual cross-border wire transfer occurs. 3) BUSINESS FRONTS — Use legitimate import/export businesses (electronics, textiles, household goods) for TBML. Over/under-invoicing creates value differential for laundering. 4) CRYPTO INTEGRATION — Increasing use of Tether (USDT) on Tron network for settlement between CMLN operators. OTC desks in China converting USDT to yuan. 5) GEOGRAPHIC CONCENTRATION — Cash collection concentrated in major US cities (LA, NYC, Chicago, Houston). 6) MULTI-CLIENT — Same CMLN serves drug cartels, fraud rings, human smugglers, and even sanctions evaders. SAR key term: "CMLN-2025-A003."',
    ],
  },
];

// ─── SAR Key Terms Reference ────────────────────────────────────────────────

const SAR_KEY_TERMS = {
  id: 'fincen-sar-key-terms-reference',
  title: 'SAR Key Terms by Fraud Type — Quick Reference',
  category: 'bsa_aml', subcategory: 'sar',
  chunks: [
    'FinCEN SAR Advisory Key Terms — Quick Reference for Filing. When filing SARs, include these key terms in the narrative to enable FinCEN analysis: BEC FRAUD — Business Email Compromise schemes. EAC FRAUD — Email Account Compromise. FIN-2023-PIGBUTCHERING — Pig butchering / relationship investment scams. FIN-2022-EFE — Elder Financial Exploitation. FIN-2023-MAILTHEFT — Mail theft-related check fraud. FIN-2023-ERCFRAUD — COVID-19 Employee Retention Credit fraud. CMLN-2025-A003 — Chinese Money Laundering Networks. FIN-2019-FENTANYL — Fentanyl and synthetic opioid trafficking. FIN-2014-HUMANTRAFFICKING — Human trafficking financial indicators. CYBER EVENT — Cyber-related suspicious activity. Including these terms helps FinCEN aggregate reports, identify trends, and support law enforcement investigations. Always include the key term in the SAR narrative field along with a detailed description of the suspicious activity.',
  ],
};

// ─── Main seeding function ──────────────────────────────────────────────────

async function seed() {
  const curatedOnly = process.argv.includes('--curated-only');

  console.log(`\n=== FinCEN/BSA/AML/FATF Document RAG Seeder ===`);
  console.log(`Index: ${INDEX_NAME} | Namespace: ${NAMESPACE}`);
  if (curatedOnly) console.log(`Mode: Curated summaries only\n`);
  else console.log(`Web docs: ${WEB_DOCUMENTS.length} | Curated PDFs: ${CURATED_CHUNKS.length}\n`);

  let totalChunks = 0;
  let failedDocs = 0;
  let skippedDocs = 0;

  // Phase 1: Fetch web pages
  if (!curatedOnly) {
    console.log(`--- Phase 1: Web Pages (${WEB_DOCUMENTS.length} documents) ---\n`);

    for (const doc of WEB_DOCUMENTS) {
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
        console.log(`SKIPPED (${text?.length || 0} chars)`);
        skippedDocs++;
        continue;
      }

      console.log(`${text.length} chars`);
      const chunks = chunkText(text);
      console.log(`  → ${chunks.length} chunk(s)`);

      for (let i = 0; i < chunks.length; i++) {
        const chunkId = chunks.length === 1 ? doc.id : `${doc.id}-chunk-${i + 1}`;
        const metadata = {
          source: 'FinCEN/Treasury',
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

  // Phase 2: Curated PDF summaries
  const allCurated = [...CURATED_CHUNKS, SAR_KEY_TERMS];
  console.log(`\n--- Phase 2: Curated PDF Summaries (${allCurated.length} documents) ---\n`);

  for (const doc of allCurated) {
    console.log(`[${doc.id}] Seeding "${doc.title}" (${doc.chunks.length} chunks)`);

    for (let i = 0; i < doc.chunks.length; i++) {
      const chunkId = doc.chunks.length === 1 ? doc.id : `${doc.id}-chunk-${i + 1}`;
      const metadata = {
        source: 'FinCEN/Treasury',
        category: doc.category,
        subcategory: doc.subcategory,
        title: doc.title,
        url: doc.url || '',
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
  console.log(`Web documents: ${WEB_DOCUMENTS.length - failedDocs - skippedDocs}/${WEB_DOCUMENTS.length}`);
  console.log(`Curated summaries: ${allCurated.length}`);
  console.log(`Total chunks indexed: ${totalChunks}`);
  console.log(`Fetch failures: ${failedDocs} | Skipped: ${skippedDocs}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

seed().catch(err => {
  console.error('\nSeed failed:', err);
  process.exit(1);
});
