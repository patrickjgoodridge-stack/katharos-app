#!/usr/bin/env node

/**
 * Seed OFAC regulatory documents into Pinecone RAG.
 * Fetches PDFs and web pages from OFAC/Treasury, extracts text,
 * chunks it, and indexes to the regulatory_docs namespace.
 *
 * Usage: PINECONE_API_KEY=... node scripts/seed-ofac-docs.js
 */

const path = require('path');
const pdf = require('pdf-parse');
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
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Katharos-RAG/1.0)',
        'Accept': '*/*',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

    const contentType = res.headers.get('content-type') || '';
    const buffer = Buffer.from(await res.arrayBuffer());

    if (url.endsWith('.pdf') || contentType.includes('pdf') || url.includes('download?inline')) {
      // Parse PDF
      const data = await pdf(buffer);
      return cleanText(data.text);
    } else {
      // Parse HTML
      const html = buffer.toString('utf-8');
      return cleanText(stripHtml(html));
    }
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

// ─── OFAC Document Registry ────────────────────────────────────────────────

const OFAC_DOCUMENTS = [
  // === Core Compliance Framework ===
  {
    id: 'ofac-compliance-framework',
    title: 'A Framework for OFAC Compliance Commitments',
    url: 'https://home.treasury.gov/system/files/126/framework_ofac_cc.pdf',
    category: 'ofac_framework',
    subcategory: 'compliance',
  },
  {
    id: 'ofac-enforcement-guidelines',
    title: 'Economic Sanctions Enforcement Guidelines',
    url: 'https://ofac.treasury.gov/media/6331/download?inline',
    category: 'ofac_framework',
    subcategory: 'enforcement',
  },
  {
    id: 'ofac-50pct-rule-guidance',
    title: 'OFAC 50 Percent Rule Guidance',
    url: 'https://ofac.treasury.gov/media/6186/download?inline',
    category: 'ofac_framework',
    subcategory: 'ownership',
  },
  {
    id: 'ofac-50pct-rule-faqs',
    title: 'OFAC 50 Percent Rule FAQs',
    url: 'https://ofac.treasury.gov/faqs/topic/1521',
    category: 'ofac_framework',
    subcategory: 'ownership',
  },

  // === Enforcement Actions & Settlements ===
  {
    id: 'ofac-enforcement-2024',
    title: '2024 OFAC Enforcement Actions',
    url: 'https://ofac.treasury.gov/civil-penalties-and-enforcement-information/2024-enforcement-information',
    category: 'ofac_enforcement',
    subcategory: 'settlements',
  },
  {
    id: 'ofac-enforcement-2023',
    title: '2023 OFAC Enforcement Actions',
    url: 'https://ofac.treasury.gov/civil-penalties-and-enforcement-information/2023-enforcement-information',
    category: 'ofac_enforcement',
    subcategory: 'settlements',
  },
  {
    id: 'ofac-enforcement-all',
    title: 'All OFAC Enforcement Actions (2009-Present)',
    url: 'https://ofac.treasury.gov/civil-penalties-and-enforcement-information',
    category: 'ofac_enforcement',
    subcategory: 'settlements',
  },
  {
    id: 'ofac-recent-enforcement',
    title: 'Recent OFAC Enforcement Actions',
    url: 'https://ofac.treasury.gov/recent-actions/enforcement-actions',
    category: 'ofac_enforcement',
    subcategory: 'settlements',
  },

  // === Russia Sanctions ===
  {
    id: 'ofac-russia-program',
    title: 'Russia Sanctions Program Page',
    url: 'https://ofac.treasury.gov/sanctions-programs-and-country-information/russian-harmful-foreign-activities-sanctions',
    category: 'ofac_country',
    subcategory: 'russia',
  },
  {
    id: 'ofac-russia-ffi-guidance',
    title: 'Updated Guidance for FFIs on Russia Military-Industrial Base',
    url: 'https://ofac.treasury.gov/media/932436/download?inline',
    category: 'ofac_country',
    subcategory: 'russia',
  },
  {
    id: 'ofac-russia-spfs-alert',
    title: 'SPFS (Russian SWIFT Alternative) Alert',
    url: 'https://ofac.treasury.gov/media/933656/download?inline',
    category: 'ofac_country',
    subcategory: 'russia',
  },
  {
    id: 'ofac-russia-faqs',
    title: 'Russia Sanctions FAQs',
    url: 'https://ofac.treasury.gov/faqs/topic/6626',
    category: 'ofac_country',
    subcategory: 'russia',
  },

  // === Iran Sanctions ===
  {
    id: 'ofac-iran-program',
    title: 'Iran Sanctions Program Page',
    url: 'https://ofac.treasury.gov/sanctions-programs-and-country-information/iran-sanctions',
    category: 'ofac_country',
    subcategory: 'iran',
  },
  {
    id: 'ofac-iran-overview',
    title: 'Iran Sanctions Overview',
    url: 'https://ofac.treasury.gov/system/files/126/iran.pdf',
    category: 'ofac_country',
    subcategory: 'iran',
  },
  {
    id: 'ofac-iran-oil-evasion-2025',
    title: 'Iranian Oil Sanctions Evasion Guidance (2025)',
    url: 'https://ofac.treasury.gov/media/934236/download?inline',
    category: 'ofac_country',
    subcategory: 'iran',
  },
  {
    id: 'ofac-iran-faqs',
    title: 'Iran Sanctions FAQs',
    url: 'https://ofac.treasury.gov/faqs/topic/1551',
    category: 'ofac_country',
    subcategory: 'iran',
  },

  // === Maritime & Shipping ===
  {
    id: 'ofac-maritime-communique-2024',
    title: 'Maritime Compliance Communiqué (Oct 2024)',
    url: 'https://ofac.treasury.gov/media/933556/download?inline',
    category: 'ofac_industry',
    subcategory: 'maritime',
  },
  {
    id: 'ofac-shipping-evasion-guidance',
    title: 'Guidance to Address Illicit Shipping and Sanctions Evasion',
    url: 'https://ofac.treasury.gov/media/22596/download?inline',
    category: 'ofac_industry',
    subcategory: 'maritime',
  },
  {
    id: 'ofac-maritime-oil-advisory',
    title: 'Advisory for Maritime Oil Industry',
    url: 'https://ofac.treasury.gov/media/932091/download?inline',
    category: 'ofac_industry',
    subcategory: 'maritime',
  },

  // === Industry-Specific Guidance ===
  {
    id: 'ofac-virtual-currency-guidance',
    title: 'Virtual Currency Compliance Guidance',
    url: 'https://ofac.treasury.gov/media/48471/download?inline',
    category: 'ofac_industry',
    subcategory: 'crypto',
  },
  {
    id: 'ofac-instant-payments-guidance',
    title: 'Instant Payment Systems Guidance',
    url: 'https://ofac.treasury.gov/media/932231/download?inline',
    category: 'ofac_industry',
    subcategory: 'payments',
  },
  {
    id: 'ofac-artwork-advisory',
    title: 'High-Value Artwork Advisory',
    url: 'https://ofac.treasury.gov/media/48186/download?inline',
    category: 'ofac_industry',
    subcategory: 'art',
  },
  {
    id: 'ofac-industry-groups',
    title: 'OFAC Information for Industry Groups',
    url: 'https://ofac.treasury.gov/additional-ofac-resources/ofac-information-for-industry-groups',
    category: 'ofac_industry',
    subcategory: 'general',
  },

  // === FAQs & Reference ===
  {
    id: 'ofac-faqs-all',
    title: 'All OFAC FAQs',
    url: 'https://ofac.treasury.gov/faqs',
    category: 'ofac_reference',
    subcategory: 'faqs',
  },
  {
    id: 'ofac-basic-info',
    title: 'Basic Information on OFAC',
    url: 'https://ofac.treasury.gov/faqs/topic/1501',
    category: 'ofac_reference',
    subcategory: 'overview',
  },
  {
    id: 'ofac-sdn-search',
    title: 'SDN List (Searchable)',
    url: 'https://sanctionssearch.ofac.treas.gov/',
    category: 'ofac_reference',
    subcategory: 'lists',
  },
  {
    id: 'ofac-all-programs',
    title: 'All Sanctions Programs',
    url: 'https://ofac.treasury.gov/sanctions-programs-and-country-information',
    category: 'ofac_reference',
    subcategory: 'programs',
  },

  // === Other Key Programs ===
  {
    id: 'ofac-north-korea',
    title: 'North Korea Sanctions Program',
    url: 'https://ofac.treasury.gov/sanctions-programs-and-country-information/north-korea-sanctions',
    category: 'ofac_country',
    subcategory: 'north_korea',
  },
  {
    id: 'ofac-cuba',
    title: 'Cuba Sanctions Program',
    url: 'https://ofac.treasury.gov/sanctions-programs-and-country-information/cuba-sanctions',
    category: 'ofac_country',
    subcategory: 'cuba',
  },
  {
    id: 'ofac-venezuela',
    title: 'Venezuela Sanctions Program',
    url: 'https://ofac.treasury.gov/sanctions-programs-and-country-information/venezuela-related-sanctions',
    category: 'ofac_country',
    subcategory: 'venezuela',
  },
  {
    id: 'ofac-syria',
    title: 'Syria Sanctions Program',
    url: 'https://ofac.treasury.gov/sanctions-programs-and-country-information/syria-sanctions',
    category: 'ofac_country',
    subcategory: 'syria',
  },
  {
    id: 'ofac-global-magnitsky',
    title: 'Global Magnitsky Sanctions Program',
    url: 'https://ofac.treasury.gov/sanctions-programs-and-country-information/global-magnitsky-sanctions',
    category: 'ofac_country',
    subcategory: 'magnitsky',
  },
];

// ─── Curated summaries for PDFs that can't be fetched/parsed ─────────────────

const CURATED_CHUNKS = [
  {
    id: 'ofac-compliance-framework',
    title: 'A Framework for OFAC Compliance Commitments',
    url: 'https://home.treasury.gov/system/files/126/framework_ofac_cc.pdf',
    category: 'ofac_framework',
    subcategory: 'compliance',
    chunks: [
      'OFAC Framework for Compliance Commitments. Five essential components of an effective sanctions compliance program (SCP): 1) MANAGEMENT COMMITMENT — Senior management commitment to compliance, adequate resources, compliance integrated into operations, clear reporting lines to senior management. 2) RISK ASSESSMENT — Conduct routine, comprehensive risk assessments across products, services, customers, supply chain, intermediaries, counterparties, and geographic locations. 3) INTERNAL CONTROLS — Written policies and procedures, adequate record-keeping, escalation procedures, OFAC List screening at onboarding and on ongoing basis, screening of transactions, trade, and dealing activities, interdiction of prohibited transactions. 4) TESTING AND AUDITING — Independent testing/auditing to assess effectiveness, includes testing software, screening, and escalation procedures. 5) TRAINING — Comprehensive training for all employees, especially those in high-risk areas, training on red flags, sanctions obligations, and escalation.',
      'OFAC Root Causes of Sanctions Violations (from enforcement actions). Common failures: 1) Lack of formal SCP — no written policies, no designated compliance officer. 2) Misinterpreting OFAC regulations — failing to apply 50% Rule, misunderstanding general licenses. 3) Facilitating transactions by non-US persons — US-nexus transactions with sanctioned parties. 4) Exporting without proper licensing — shipping technology or goods to sanctioned destinations. 5) Using the US financial system — processing USD payments through US correspondent banks for sanctioned party benefit. 6) Screening failures — inadequate screening technology, failure to screen against full SDN list and all programs, not screening for alternative names/aliases, not re-screening when lists update. 7) Decentralized compliance — subsidiaries operating without adequate oversight. 8) Mergers and acquisitions — inheriting sanctions exposure from acquired entities without proper due diligence.',
    ],
  },
  {
    id: 'ofac-enforcement-guidelines',
    title: 'Economic Sanctions Enforcement Guidelines',
    url: 'https://ofac.treasury.gov/media/6331/download?inline',
    category: 'ofac_framework',
    subcategory: 'enforcement',
    chunks: [
      'OFAC Economic Sanctions Enforcement Guidelines. OFAC has authority to impose civil monetary penalties for sanctions violations under IEEPA, TWEA, and other statutes. Maximum penalty: the greater of $356,579 per violation or twice the value of the transaction. Enforcement responses range from: No Action Letter, Cautionary Letter, Finding of Violation (public), Civil Monetary Penalty, Criminal referral to DOJ. OFAC considers 11 General Factors: 1) Willful or reckless violation vs negligent. 2) Awareness of conduct at issue — did entity know about sanctions obligations? 3) Harm to sanctions program objectives. 4) Individual characteristics — size, sophistication, commercial expertise. 5) Compliance program — existence and adequacy of SCP at time of violation. 6) Remedial response — cooperation, self-disclosure, corrective actions taken. 7) Cooperation with OFAC — timely, complete, truthful response to requests. 8) Prior violations (5-year lookback). 9) Timing of apparent violation — before/after guidance issued. 10) Other enforcement action — criminal prosecution, other agency action. 11) Future compliance — whether entity is implementing corrective measures.',
      'OFAC Voluntary Self-Disclosure. Voluntary self-disclosure is a significant mitigating factor. OFAC will generally reduce base penalty by 50% if: 1) Disclosure is voluntary (not compelled by investigation or subpoena). 2) Disclosure is made before OFAC contacts entity about the violations. 3) Disclosure includes thorough review of violations, root cause analysis, and remedial measures. 4) Entity cooperates fully with subsequent OFAC investigation. Self-disclosure does not guarantee no penalty — egregious violations may still result in significant penalties even with VSD. OFAC may also issue a Cautionary Letter or Finding of Violation instead of penalty for self-disclosed violations if mitigating factors outweigh aggravating.',
    ],
  },
  {
    id: 'ofac-50pct-rule-guidance',
    title: 'OFAC 50 Percent Rule Guidance',
    url: 'https://ofac.treasury.gov/media/6186/download?inline',
    category: 'ofac_framework',
    subcategory: 'ownership',
    chunks: [
      'OFAC 50 Percent Rule — Revised Guidance (2014, updated 2023). Any entity owned 50% or more, directly or indirectly, individually or in aggregate, by one or more blocked persons is itself considered a blocked person. Key principles: 1) DIRECT OWNERSHIP — If SDN owns 50%+ of Entity A, Entity A is blocked. 2) INDIRECT OWNERSHIP — If SDN owns 50%+ of Entity A, and Entity A owns 50%+ of Entity B, Entity B is blocked (multiplicative test for indirect: 50% x 50% = 25%, but also absolute test if controlled). 3) AGGREGATE — Multiple SDNs owning shares that total 50%+ make entity blocked (e.g., SDN1 owns 30%, SDN2 owns 25% = 55% aggregate). 4) CONTROL — Even if ownership is below 50%, OFAC may determine entity is blocked if SDN controls it (board seats, veto power, operational control). 5) NESTED CHAINS — Apply rule recursively through multi-layer ownership chains. Obligation: US persons must block transactions with 50%-owned entities even if not explicitly listed on SDN List. Due diligence obligation to determine beneficial ownership.',
    ],
  },
  {
    id: 'ofac-russia-ffi-guidance',
    title: 'Updated Guidance for FFIs on Russia Military-Industrial Base',
    url: 'https://ofac.treasury.gov/media/932436/download?inline',
    category: 'ofac_country',
    subcategory: 'russia',
    chunks: [
      'OFAC Guidance for Foreign Financial Institutions — Russia Military-Industrial Base (2024). Executive Order 14024 expanded secondary sanctions risk for foreign financial institutions (FFIs). FFIs risk being sanctioned by OFAC if they: 1) Conduct or facilitate significant transactions for persons designated under Russia sanctions (EO 14024). 2) Conduct or facilitate significant transactions involving Russia military-industrial base, including dual-use technology, electronics, precision instruments. High-risk goods categories: quantum computing, advanced semiconductors, CNC machines, underwater equipment, marine electronics, oil refinery equipment, chemical weapons precursors. Red flags for FFIs: transactions with Russian defense sector entities, payments for dual-use goods destined for Russia, trade finance for sanctioned commodities, correspondent banking relationships with Russian banks under sanctions. FFIs should implement enhanced due diligence on transactions with Russia nexus, screen all parties in transaction chain, monitor for evasion tactics like transshipment through Central Asian countries (Kazakhstan, Uzbekistan, Kyrgyzstan, Georgia, Armenia, Turkey, UAE).',
    ],
  },
  {
    id: 'ofac-russia-spfs-alert',
    title: 'SPFS (Russian SWIFT Alternative) Alert',
    url: 'https://ofac.treasury.gov/media/933656/download?inline',
    category: 'ofac_country',
    subcategory: 'russia',
    chunks: [
      'OFAC Alert on Russia SPFS System (System for Transfer of Financial Messages). Russia developed SPFS as alternative to SWIFT after initial sanctions. Key risks: 1) SPFS enables Russian banks to communicate payment instructions outside SWIFT — reduces transparency. 2) Russian Central Bank expanding SPFS membership to foreign banks (Belarus, Kazakhstan, Armenia, Kyrgyzstan, Tajikistan, Cuba, others). 3) Foreign banks joining SPFS may facilitate sanctions evasion by enabling Russian sanctioned banks to process international payments. 4) OFAC warns that foreign financial institutions that join or use SPFS to facilitate transactions for sanctioned Russian entities face secondary sanctions risk under EO 14024. Red flags: payments routed through SPFS-connected institutions, correspondent banking with banks that have SPFS connections, trade finance involving SPFS member institutions. Financial institutions should: assess whether counterparties are SPFS members, evaluate exposure to sanctions evasion through SPFS channels, implement monitoring for SPFS-related transaction patterns.',
    ],
  },
  {
    id: 'ofac-iran-overview',
    title: 'Iran Sanctions Overview',
    url: 'https://ofac.treasury.gov/system/files/126/iran.pdf',
    category: 'ofac_country',
    subcategory: 'iran',
    chunks: [
      'OFAC Iran Sanctions Overview. Iran is subject to comprehensive US sanctions under multiple authorities: IEEPA, ISA (Iran Sanctions Act), CISADA, ITRSHRA, Iran Threat Reduction Act, NDAA FY2012. Key prohibitions: 1) US persons prohibited from virtually all transactions with Iran, including trade, investment, financial services. 2) SDN designations include: IRGC (Islamic Revolutionary Guard Corps) — designated as terrorist organization, Iranian Central Bank, major Iranian commercial banks, NIOC (National Iranian Oil Company), shipping lines. 3) Secondary sanctions: non-US persons face sanctions for significant transactions with Iranian financial sector, energy sector, metals sector, automotive sector, shipping sector. 4) General Licenses available for: humanitarian goods (food, medicine under GL authorizations), personal communications, legal services, journalism activities. Iran sanctions evasion methods: front companies in UAE/Turkey/China, falsified documents, ship-to-ship transfers, AIS manipulation, gold-for-oil schemes, hawala networks, cryptocurrency.',
    ],
  },
  {
    id: 'ofac-iran-oil-evasion-2025',
    title: 'Iranian Oil Sanctions Evasion Guidance (2025)',
    url: 'https://ofac.treasury.gov/media/934236/download?inline',
    category: 'ofac_country',
    subcategory: 'iran',
    chunks: [
      'OFAC Guidance on Iranian Oil Sanctions Evasion (2025). Iran continues to export oil through sophisticated evasion networks. Key evasion methods: 1) DARK FLEET — Aging tankers purchased by shell companies, AIS transponders turned off, flag state frequently changed, ownership obscured through layers of shell companies. 2) SHIP-TO-SHIP TRANSFERS — Oil transferred between vessels at sea to disguise origin, falsified bills of lading showing non-Iranian origin. 3) BLENDING/RELABELING — Iranian crude blended with other origins, certificates of origin falsified. 4) FRONT COMPANIES — Networks of trading companies in UAE, Turkey, China, Singapore, Malaysia used to broker and finance Iranian oil sales. 5) ALTERNATIVE PAYMENT MECHANISMS — Barter arrangements, gold-for-oil, cryptocurrency, Chinese yuan settlements outside dollar system. OFAC has designated 50+ vessels, dozens of front companies, and shipping networks. Red flags: vessels with history of port calls to Iran, unusual STS transfer patterns, newly formed trading companies with connections to known facilitators, payments through non-transparent channels.',
    ],
  },
  {
    id: 'ofac-maritime-communique-2024',
    title: 'Maritime Compliance Communiqué (Oct 2024)',
    url: 'https://ofac.treasury.gov/media/933556/download?inline',
    category: 'ofac_industry',
    subcategory: 'maritime',
    chunks: [
      'OFAC Maritime Compliance Communiqué (October 2024). Updated guidance for maritime industry on sanctions compliance. Key areas: 1) AIS MANIPULATION — Vessels turning off AIS to avoid detection, spoofing GPS data. Companies should flag vessels with unexplained AIS gaps, especially near sanctioned countries. 2) VESSEL FLAG CHANGES — Frequent flag changes may indicate evasion. Flag states with weak oversight: Cameroon, Comoros, Palau, Tanzania, Gabon. 3) DOCUMENT FRAUD — Falsified certificates of origin, bills of lading showing non-sanctioned ports, insurance certificates from non-existent companies. 4) OWNERSHIP OBFUSCATION — Vessels registered to shell companies in secrecy jurisdictions, complex ownership chains, technical managers different from registered owners. 5) PRICING ANOMALIES — Oil sold well below market price may indicate sanctioned origin. Maritime industry participants should implement: vessel screening, AIS monitoring, counterparty due diligence on charterers and cargo owners, end-user verification for sensitive goods.',
    ],
  },
  {
    id: 'ofac-shipping-evasion-guidance',
    title: 'Guidance to Address Illicit Shipping and Sanctions Evasion',
    url: 'https://ofac.treasury.gov/media/22596/download?inline',
    category: 'ofac_industry',
    subcategory: 'maritime',
    chunks: [
      'OFAC/State/Coast Guard Guidance on Illicit Shipping and Sanctions Evasion. Tri-agency advisory on deceptive shipping practices used to evade sanctions. Key practices: 1) SHIP-TO-SHIP (STS) TRANSFERS — Sanctioned countries (Iran, North Korea, Syria, Venezuela) use STS transfers to obscure cargo origin. High-risk areas for STS: South China Sea, Straits of Malacca, East China Sea, off coasts of Malaysia, Indonesia, UAE. 2) FALSIFIED DOCUMENTATION — Bills of lading showing wrong load port, certificates of origin from countries that don\'t produce the commodity, insurance from shell insurers. 3) PHYSICAL MANIPULATION OF VESSEL — Painting over vessel name, altering IMO number plates. 4) COMPLEX OWNERSHIP — Vessels owned through multiple layers of companies in multiple jurisdictions. Industry best practices: Know Your Customer for charterers and sub-charterers, screen all parties including technical managers and beneficial owners, monitor vessel tracking data for anomalies, verify cargo documentation through independent sources, maintain records of due diligence.',
    ],
  },
  {
    id: 'ofac-maritime-oil-advisory',
    title: 'Advisory for Maritime Oil Industry',
    url: 'https://ofac.treasury.gov/media/932091/download?inline',
    category: 'ofac_industry',
    subcategory: 'maritime',
    chunks: [
      'OFAC Advisory on Maritime Petroleum Shipping. Advisory for petroleum industry on sanctions risk in maritime oil trade. Key risks: 1) Russian oil price cap evasion — vessels carrying Russian crude above G7 price cap ($60/barrel) without attestation. Service providers (insurance, flagging, financing, brokering) prohibited from providing services for shipments above price cap. 2) Iranian oil networks — sophisticated networks of shell companies, front traders, dark fleet vessels moving Iranian oil to markets (primarily China). 3) Venezuelan oil — limited authorizations under GL 44 (now expired); exports require specific license. Red flags for maritime oil: vessels with history of loading at sanctioned ports, unusually low freight rates, payment through non-traditional channels, newly formed trading companies as counterparties, P&I insurance from unknown or sanctioned insurers, vessel age (older vessels more likely in dark fleet). Price cap compliance: shipping service providers must obtain attestation from customer that oil was purchased at or below price cap, retain records, report suspected violations.',
    ],
  },
  {
    id: 'ofac-virtual-currency-guidance',
    title: 'Virtual Currency Compliance Guidance',
    url: 'https://ofac.treasury.gov/media/48471/download?inline',
    category: 'ofac_industry',
    subcategory: 'crypto',
    chunks: [
      'OFAC Compliance Guidance for the Virtual Currency Industry. OFAC sanctions obligations apply to all US persons, including virtual currency industry participants: exchanges, wallet providers, miners, validators, DeFi protocols with US nexus. Key requirements: 1) SCREENING — Screen wallet addresses against OFAC SDN List (OFAC publishes sanctioned cryptocurrency addresses). Screen customer identities against full sanctions lists. 2) TRANSACTION MONITORING — Monitor for transactions with sanctioned addresses, mixers/tumblers (Tornado Cash, Blender.io — both sanctioned), privacy coins, darknet markets. 3) GEOBLOCKING — Block transactions from comprehensively sanctioned jurisdictions (Iran, North Korea, Cuba, Syria, Crimea/Donetsk/Luhansk regions of Ukraine). 4) IP/GEOLOCATION — Use IP screening and geolocation tools to detect users in sanctioned jurisdictions using VPNs. Red flags: wallet addresses appearing on SDN list, transactions with known mixer contracts, chain-hopping patterns designed to obscure origin, users accessing from sanctioned jurisdiction IPs. Sanctioned virtual currency services: Tornado Cash (Aug 2022), Blender.io (May 2022), Garantex (April 2022), Suex (Sept 2021), Chatex (Nov 2021).',
    ],
  },
  {
    id: 'ofac-instant-payments-guidance',
    title: 'Instant Payment Systems Guidance',
    url: 'https://ofac.treasury.gov/media/932231/download?inline',
    category: 'ofac_industry',
    subcategory: 'payments',
    chunks: [
      'OFAC Guidance on Instant Payment Systems. As real-time/instant payment systems expand (FedNow, RTP, faster payments), OFAC emphasizes sanctions screening obligations remain the same. Key considerations: 1) SPEED vs COMPLIANCE — Instant settlement does not exempt from screening. Financial institutions must screen before funds are irrevocably transferred. 2) SCREENING APPROACHES — Pre-screening at payment initiation, real-time screening during processing, post-screening with recall mechanisms. OFAC expects screening to occur at or before the point of irrevocable commitment of funds. 3) INTERDICTION — Must be able to block/reject payments identified as involving sanctioned parties, even in instant payment context. 4) TECHNOLOGY — Automated screening systems must be calibrated for speed of instant payments, with minimal false positives to avoid unnecessary delays. Regular testing and tuning required. 5) RISK ASSESSMENT — Higher volume + faster speed = higher risk. Financial institutions should assess sanctions risk specific to their instant payment products and customer base.',
    ],
  },
  {
    id: 'ofac-artwork-advisory',
    title: 'High-Value Artwork Advisory',
    url: 'https://ofac.treasury.gov/media/48186/download?inline',
    category: 'ofac_industry',
    subcategory: 'art',
    chunks: [
      'OFAC Advisory on Sanctions Risks in High-Value Art Market. The art market has historically lacked transparency, making it vulnerable to sanctions evasion and money laundering. Key risks: 1) ANONYMITY — Art purchases often made through intermediaries, trusts, shell companies. Actual buyer identity may be unknown to seller or auction house. 2) FREEPORTS — Tax-free storage zones (Geneva, Luxembourg, Delaware, Singapore) where art can be stored, bought, and sold without customs or reporting. 3) HIGH VALUE/PORTABLE — Single paintings worth millions can be easily transported across borders. 4) SUBJECTIVE PRICING — Art valuations are subjective, enabling price manipulation for money laundering. Red flags: purchases through shell companies in secrecy jurisdictions, payment from third parties unrelated to buyer, requests for anonymity, transactions involving persons from high-risk jurisdictions, storage in freeports, rapid resale at significantly different prices. Industry participants should: verify identity of buyers and sellers, screen against OFAC sanctions lists, maintain records of transactions, report suspicious activity.',
    ],
  },
  {
    id: 'ofac-syria',
    title: 'Syria Sanctions Program',
    url: 'https://ofac.treasury.gov/sanctions-programs-and-country-information/syria-sanctions',
    category: 'ofac_country',
    subcategory: 'syria',
    chunks: [
      'OFAC Syria Sanctions Program. Syria is subject to comprehensive US sanctions under multiple Executive Orders (EO 13338, 13399, 13460, 13572, 13573, 13582, 13606, 13608). Key prohibitions: 1) US persons prohibited from new investment in Syria. 2) Export/import bans — prohibited to export most goods, technology, services to Syria; prohibited to import petroleum products of Syrian origin. 3) Blocking — Government of Syria, Central Bank of Syria, and numerous Syrian individuals and entities designated as SDNs. 4) Syrian Sanctions Regulations (31 CFR Part 542) — comprehensive regulations implementing sanctions. Designated entities include: Syrian government officials, military/intelligence leadership, SANA (state news agency), Central Bank, Commercial Bank of Syria. General Licenses available for: humanitarian activities (food, medicine), certain personal remittances, NGO operations, journalism. Syria sanctions evasion: front companies in Lebanon, Turkey, UAE; gold smuggling; hawala networks; manipulation of end-user certificates.',
    ],
  },
];

// ─── Main seeding function ──────────────────────────────────────────────────

async function seed() {
  const curatedOnly = process.argv.includes('--curated-only');

  console.log(`\n=== OFAC Document RAG Seeder ===`);
  console.log(`Index: ${INDEX_NAME} | Namespace: ${NAMESPACE}`);
  if (curatedOnly) console.log(`Mode: Curated PDF summaries only\n`);
  else console.log(`Documents to process: ${OFAC_DOCUMENTS.length}\n`);

  let totalChunks = 0;
  let failedDocs = 0;
  let skippedDocs = 0;

  if (!curatedOnly) for (const doc of OFAC_DOCUMENTS) {
    process.stdout.write(`[${doc.id}] Fetching "${doc.title}"... `);

    let text;
    try {
      text = await fetchDocument(doc.url);
    } catch (err) {
      console.log(`FETCH FAILED: ${err.message}`);
      failedDocs++;
      continue;
    }

    // Skip if we got very little content (likely a redirect page or blocked)
    if (!text || text.length < 100) {
      console.log(`SKIPPED (too short: ${text?.length || 0} chars)`);
      skippedDocs++;
      continue;
    }

    console.log(`${text.length} chars`);

    // Chunk the text
    const chunks = chunkText(text);
    console.log(`  → ${chunks.length} chunk(s)`);

    // Index each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = chunks.length === 1 ? doc.id : `${doc.id}-chunk-${i + 1}`;
      const metadata = {
        source: 'OFAC/Treasury',
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

      // Rate limit: small delay between embeddings
      if (i < chunks.length - 1) await sleep(200);
    }

    // Delay between documents to avoid rate limits
    await sleep(500);
  }

  // ─── Phase 2: Seed curated chunks for PDFs that can't be fetched ───────
  const curatedIds = new Set(CURATED_CHUNKS.map(c => c.id));
  // Only seed curated docs that failed to fetch above
  const failedIds = new Set();
  // Track which OFAC_DOCUMENTS succeeded
  // (We need to re-derive this — just seed all curated chunks since they'll overwrite any existing)

  console.log(`\n--- Phase 2: Curated PDF Summaries (${CURATED_CHUNKS.length} documents) ---\n`);

  for (const doc of CURATED_CHUNKS) {
    console.log(`[${doc.id}] Seeding curated "${doc.title}" (${doc.chunks.length} chunks)`);

    for (let i = 0; i < doc.chunks.length; i++) {
      const chunkId = doc.chunks.length === 1 ? doc.id : `${doc.id}-chunk-${i + 1}`;
      const metadata = {
        source: 'OFAC/Treasury',
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
  console.log(`Web documents processed: ${OFAC_DOCUMENTS.length - failedDocs - skippedDocs}/${OFAC_DOCUMENTS.length}`);
  console.log(`Curated PDF summaries: ${CURATED_CHUNKS.length}`);
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
