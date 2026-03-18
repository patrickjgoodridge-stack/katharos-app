// Vercel Serverless Function — Agentic Compliance Analyst
// POST /api/agent
// Autonomous agent loop with tool execution, SSE streaming, and pause/resume for user interaction.

import { OFACScreeningService } from '../services/ofacScreening.js';
import { SanctionsAnnouncementService } from '../services/sanctionsAnnouncements.js';
import { WebIntelligenceService } from '../services/webIntelligence.js';
import { PEPScreeningService } from '../services/pepScreening.js';
import { RegulatoryEnforcementService } from '../services/regulatoryEnforcement.js';
import { AdverseMediaService } from '../services/adverseMedia.js';
import { CourtRecordsService } from '../services/courtRecords.js';
import { OCCRPAlephService } from '../services/occrpAleph.js';
import { OpenCorporatesService } from '../services/openCorporates.js';
import { BlockchainScreeningService } from '../services/blockchainScreening.js';
import { ShippingTradeService } from '../services/shippingTrade.js';
import { WalletScreeningService } from '../services/walletScreening.js';
import { Pinecone } from '@pinecone-database/pinecone';

// Dynamic imports for CommonJS services (entity resolution, precedent matching, ownership)
let _entityResolution = null, _precedentMatching = null;
async function getEntityResolution() {
  if (!_entityResolution) _entityResolution = await import('../services/entityResolution.js').then(m => m.default || m);
  return _entityResolution;
}
async function getPrecedentMatching() {
  if (!_precedentMatching) _precedentMatching = await import('../services/precedentMatching.js').then(m => m.default || m);
  return _precedentMatching;
}

export const config = { maxDuration: 300 };

// ── Service Singletons ──
let _services = null;
function getServices() {
  if (!_services) {
    _services = {
      ofac: new OFACScreeningService(),
      announcements: new SanctionsAnnouncementService(),
      webIntel: new WebIntelligenceService(),
      wallet: new WalletScreeningService(),
      pep: new PEPScreeningService(),
      regulatory: new RegulatoryEnforcementService(),
      adverseMedia: new AdverseMediaService(),
      courtRecords: new CourtRecordsService(),
      occrp: new OCCRPAlephService(),
      openCorporates: new OpenCorporatesService(),
      blockchain: new BlockchainScreeningService(),
      shipping: new ShippingTradeService(),
    };
  }
  return _services;
}

// ── Pinecone Knowledge Base ──
let _pc = null, _pcIdx = null;
function getPinecone() {
  if (!_pc) _pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  return _pc;
}
function getPineconeIndex() {
  if (!_pcIdx) _pcIdx = getPinecone().index(process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes');
  return _pcIdx;
}
async function embedQuery(text) {
  const result = await getPinecone().inference.embed('multilingual-e5-large', [text], { inputType: 'query', truncate: 'END' });
  return result.data[0].values;
}
async function embedPassage(texts) {
  const result = await getPinecone().inference.embed('multilingual-e5-large', texts, { inputType: 'passage', truncate: 'END' });
  return result.data.map(d => d.values);
}
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
}

// ── Timeout wrapper ──
const TIMEOUT = 15000;
function race(promise, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} timeout`)), TIMEOUT); })
  ]).then(v => { clearTimeout(timer); return v; }, e => { clearTimeout(timer); return { _error: e.message }; });
}

// ── Tool Definitions for Claude ──
const AGENT_TOOLS = [
  {
    name: 'screen_entity',
    description: 'Run a comprehensive compliance screening on an entity, individual, or wallet address. This runs OFAC sanctions, PEP checks, adverse media, corporate records, court records, OCCRP, blockchain analysis, and more — all in parallel. Use this for full due diligence.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Entity name, individual name, or wallet address to screen' },
        type: { type: 'string', enum: ['individual', 'entity', 'wallet'], description: 'Type of screening target' },
        country: { type: 'string', description: 'Country for PEP/jurisdiction filtering (optional)' }
      },
      required: ['name', 'type']
    }
  },
  {
    name: 'search_sanctions',
    description: 'Search OFAC sanctions lists and PEP databases for a specific name.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name to check against sanctions lists' },
        type: { type: 'string', enum: ['INDIVIDUAL', 'ENTITY'], description: 'Target type' }
      },
      required: ['name']
    }
  },
  {
    name: 'search_adverse_media',
    description: 'Search for adverse media coverage, negative news, and reputational risk information about an entity or individual.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name to search for adverse media' },
        type: { type: 'string', enum: ['INDIVIDUAL', 'ENTITY'], description: 'Target type' },
        country: { type: 'string', description: 'Country filter (optional)' }
      },
      required: ['name']
    }
  },
  {
    name: 'search_corporate_records',
    description: 'Search OpenCorporates and UK Companies House for corporate registration, officers, and filings.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Company name to search' }
      },
      required: ['name']
    }
  },
  {
    name: 'search_court_records',
    description: 'Search CourtListener for federal court cases, litigation history, and criminal proceedings.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name to search in court records' },
        type: { type: 'string', enum: ['individual', 'entity'], description: 'Target type' }
      },
      required: ['name']
    }
  },
  {
    name: 'knowledge_base_search',
    description: 'Search Katharos curated knowledge base of regulatory documents from OFAC, FinCEN, DOJ, SEC, FBI, FTC, CFTC, FINRA, HHS-OIG, OCC, IRS, Secret Service, CFPB, FATF, OECD, UNODC, BIS (EAR), DDTC (ITAR), NRC, DOE, Wassenaar, NSG, MTCR, and Australia Group. Use for regulatory guidance, typologies, red flags, enforcement patterns, and compliance obligations.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query for regulatory knowledge base' }
      },
      required: ['query']
    }
  },
  {
    name: 'search_entity_investigations',
    description: 'Search Katharos curated entity investigation database containing 12,200+ pre-researched entities across 1,800+ subjects in 16 major investigations with 9,500+ semantic vectors: (1) Russian Oligarch Networks (135+ entities — Putin, Potanin, Deripaska, Abramovich), (2) Glencore corporate network (33+ entities), (3) Global Commodities sanctions (55+ entities — Iranian oil, North Korean shipping), (4) Criminal Enforcement (359+ entities — FTX, Terraform, Binance, Prince Group/Huione, Sinaloa Cartel), (5) 70-Subject Entity Investigation (415+ entities — Vinnik/BTC-e, Daren Li, Lichtenstein/Bitfinex, OneCoin, 3AC, Celsius, 1MDB, Lazarus, Tether, BitMEX, Combs RICO, Holmes/Theranos, Hwang/Archegos), (6) Top 100 SDN Subjects (685+ entities across 6 OFAC programs — Russia oligarchs Usmanov/Timchenko/Sechin/Deripaska/Fridman, IRGC-QF front companies, Lazarus/DPRK, CJNG/Sinaloa cartels, Garantex/Grinex successor chain, Gertler DRC mining network), (7) SDN Batch 2 — Next 100 Highest-Signal Subjects (871+ entities — Abramovich 261 Cyprus Confidential entities, Vekselberg/Renova, Kostin/VTB DOJ indictment, Prigozhin estate/Concord/Africa Corps, Gazprombank November 2024, Jho Low/1MDB expanded, CZ/Binance plea, Maduro/Saab/Venezuela, Obiang/Ablyazov Global Magnitsky), (8) SDN Batch 3 — Subjects 176-275 (715+ entities — Lavrov, Evraz/Abramov/Frolov 78 Cyprus Confidential, LockBit/Evil Corp ransomware, Russia Shadow Fleet January 2025, Kolomoisky Ukraine, Hezbollah/Hamas/Houthi, Isabel dos Santos, Karimova, Firtash, Manafort), (9) SDN Batch 4 — Subjects 210-309 (634+ entities — Rashnikov/MMK Turkey steel conduit, Chemezov/Rostec VSMPO-AVISMA titanium, Timchenko/Gunvor pre-designation divestment, Kovalchuk/Innopraktika Putin daughter link, Rotenberg Crimea Bridge, Melnichenko EuroChem US/EU gap, Fridman/Aven/Khan LetterOne, Alfa Bank expanded, Gazprom Neft/NIS Serbia 50% rule, Sandworm NotPetya $10B, APT29 SolarWinds, IRGC Charming Kitten, APT41 Salt Typhoon, Hemedti/RSF Sudan gold, Myanmar SAC, PDVSA/Saab, Cuba GAESA, Belarus Belaruskali potash, Tornado Cash delisted Lazarus resumed, Bybit $1.5B hack, DPRK IT workers, NIOC ghost tankers, Rosoboronexport CAATSA, Wagner Africa Corps gold/uranium, CJNG avocado fentanyl, Sovcomflot reflagging, Novatek Arctic LNG 2, Rosneft/Nayara Energy India, Gazprom TurkStream, RT SDN influence ops, professional enablers PwC/MeritServus, sanctions evasion corridors, SWIFT/SPFS alternatives, golden passport KYC bypass), (10) Financial Crime Database — 350 Subjects across 7 categories (2,260+ entities — ML: Vinnik/BTC-e $9B, Mogilevich FBI wanted, Liberty Reserve $6B, 1MDB $4.5B, Troika Laundromat, SBF/FTX, Danske Bank €200B, HSBC Sinaloa, Wirecard, Binance $4.3B; IND: Halkbank Iran $20B, Do Kwon/LUNA, Celsius/Mashinsky, Bitcoin Fog/Helix mixers; FRD: Madoff $64.5B Ponzi, Stanford $7B, Enron, Theranos, Archegos $36B, OneCoin $25B; RICO: Sinaloa RICO, Ndrangheta $55B/yr, MS-13 SDN, Yakuza, DarkSide ransomware; AF: KleptoCapture $700M+, Bitfinex $3.6B, Madoff SIPC $14.5B, FTX $7B+, Mt. Gox $9B; CRT: Los Chapitos fentanyl, CJNG, TD Bank $3B, Garcia Luna, avocado supply chain; CF: OneCoin $25B, Axie/Lazarus $625M, bridge hacks, Tornado Cash founders, pig butchering), (11) Expansion Batch — 170 Subjects (1,450+ entities — Category Batch 2: ML-051-060 trade-based ML/hawala/casino/freeport/real estate/art market/correspondent banking/crypto mixing/reverse ML, IND-051-060 sanctions evasion indictments/crypto Ponzi/tax fraud/insider trading/market manipulation, FRD-051-060 AI deepfake fraud/romance scams/invoice factoring/cryptocurrency rug pulls/NFT fraud, RICO-051-060 Wagner Group/Tren de Aragua/PCC/Albanian mafia/Irish Kinahan/Triads/Hells Angels/Russian Vory, AF-051-060 cryptocurrency seizures/luxury asset forfeiture/real estate/yacht/art/digital asset recovery, CRT-051-060 synthetic opioid networks/dark web markets/precursor chemical/wildlife trafficking/illegal mining/arms trafficking, CF-051-060 DeFi exploits/MEV attacks/cross-chain bridge hacks/oracle manipulation/flash loan attacks/NFT wash trading; SDN Batch 5 Subjects 310-409: Russia SDN expansion/Iran nuclear procurement/DPRK crypto operations/cartel financial networks/crypto sanctions enforcement/sanctions evasion networks), and (12) SDN Batch 7 — Subjects 510-609 (775+ entities — March 2026 OFAC live actions: Hamas sham charities March 12 2026 GDD/Hayat Yolu/White Hands/KNRP, DPRK IT worker facilitators Herrera Barcelona/Sim Hyon-Sop new ETH wallet, Rwanda Defence Force entire military SDN March 2 2026/M23/DRC minerals, Muslim Brotherhood Egypt/Jordan January 2026, Hamas Gaza charities January 2026/PCPA/Birawi UK, Lukoil International GmbH GL expires April 29 2026, Venezuela SDN removals, Nicaragua Ortega designations; Hamas ecosystem extended mapping; DRC/Africa: Gertler cobalt updated, Africa Corps Wagner successor, Al-Shabaab, conflict minerals full map, Sahel juntas Burkina/Niger/Mali; Central America/Caribbean: Honduras Lobo narco, El Salvador Bitcoin, Guatemala/DR/Haiti; Russia oligarch extended: Timchenko/Vekselberg/Fridman/Aven/Abramovich/Mordashov/Transneft/Kabaeva Putin family/Malofeev/Kovalchuk; SE Asia/Pacific: Laos Golden Triangle, Myanmar SAC, Cambodia scam compounds, Philippines/Vietnam/Australia Crown/NZ/Singapore/Indonesia/Malaysia; Financial intelligence: US NMLRA 2026, CTA registry, real estate AML, pig butchering, BEC; Compact entries: Brazil/Argentina/Peru/Ecuador, Panama/Pandora Papers active structures, Swiss/Liechtenstein/BVI/Cayman/Cyprus/Malta compliance, Ukraine KleptoCapture, Saudi MBS, UAE post-FATF, Gulf states, crypto regulatory arbitrage, ransomware 2025, AI-enabled crime, stablecoins, DeFi landscape, exchange compliance ranking, SWIFT alternatives), and (13) SDN Batch 8 — Subjects 610-659 (415+ entities — CLAUDE BLIND SPOTS: Zanjani/Zedcex $94B exchange re-designated January 2026/7 TRX addresses/IRGC 87% volume, Mojtaba Khamenei new Iran Supreme Leader March 8 2026/Bloomberg London mansions/imminent SDN, Gustavo Petro sitting Colombia president SDN October 2025/wife/son/Interior Minister, Lukoil International GmbH SDN December 2025/50% rule Bulgaria-Romania-Serbia-Croatia/GL 128B expires April 29, Nayara Energy India BLOCKED Rosneft 50% rule January 2025, Iran protest crackdown 30+ new SDNs/Larijani/Momeni/IRGC commanders, Soltanmohammadi 7 UK passports/4 aliases/Dubai-Singapore, Rayan Fan Group MODAFL missile procurement/38 entities October 2025/Chinese suppliers, A7A5/Old Vector SDN August 2025/$93B stablecoin/Kyrgyzstan, Phoenix Ship Management Iran shadow fleet December 2025, Nikan Pezhvak Bank Melli/Golden Mist Singapore, Colombia Egmont suspension, LNFM/Carteles Unidos/CDN FTO February 2025/full 8-organization FTO map, DPRK Shenyang Geumpungri/Herrera Barcelona/Sim Hyon-Sop live ETH March 2026, ICC EO 14203 designations/Khan arrest, OFAC 2026 gatekeeper enforcement, Iran 875 designations 2025, crypto exchange gap map Zedcex-Grinex-A7A5-OKX, Russia $104B sanctions-busting crypto 2025, 4-day gap analysis), (14) PEP Entity Mapping Batch 1 — 200 Subjects (1,000+ entities — Putin, Lukashenko, Xi Jinping, MBS, Erdogan, Modi, Maduro, Gupta family, Mugabe, Kabila, Kagame, Duterte, Hun Sen, Rajapaksa, Nawaz Sharif, Hasina, Abacha, Obiang, dos Santos across 13 regions — Russia/FSU, China, MENA, Sub-Saharan Africa, Latin America, Europe, Asia-Pacific, South/Central Asia), (15) PEP Entity Mapping Batch 2 — 200 Additional Subjects (1,000+ entities — Mishustin, Siluanov, Kostin/VTB, Gref/Sberbank, Miller/Gazprom, Chemezov/Rostec, Shoigu, Kadyrov, Prigozhin/Wagner, Jack Ma/Alibaba, Sisi, Assad, Haftar, Kagame, Dos Santos family, AMLO, Orbán, Vučić, Hun Sen/Manet, Rajapaksa across 9 regions), and (16) PEP Entity Mapping Batch 3 — 200 Subjects across 14 regions (1,000+ entities — Russia Business/Finance: Rybolovlev $3B/art laundering/FBI, Gutseriev/Russneft/Isle of Man trusts, Milner/DST Global/Facebook VTB-funded, Khodorkovsky/Yukos $50B; Ukraine: Poroshenko, Tymoshenko, Yanukovych-era; Iran: Khamenei, Mojtaba Khamenei new Supreme Leader NOT yet SDN, IRGC; DPRK: Kim Yo-jong, Kim Jong-un; Venezuela/Cuba: GAESA, Maduro, Cabello; West Africa: Emefiele CBN $2.8B, Abacha $5B estate; East Africa: Kenyatta, Moi, Al-Bashir; Southern Africa: Guebuza $2B hidden debt, Manuel Chang convicted; Latin America: Fujimori, Odebrecht $800M bribes; Europe: Schröder/Gazprom, Berlusconi, Sarkozy; Asia-Pacific: Soeharto family, Najib Razak; Gulf: MBS/PIF, Al-Rumayyan/Aramco/LIV Golf; International: Jho Low/1MDB $4.5B fugitive, SBF/FTX $8B, Adani US indicted, Ghosn fled Japan, Patrick Ho CEFC convicted SDNY). Returns entity details, SDN status, OFAC 50% rule analysis, sanctions contamination chains, and compliance implications. ALWAYS search this FIRST.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Entity name, individual name, network name, or investigation query to search against curated entity database' }
      },
      required: ['query']
    }
  },
  {
    name: 'ask_user',
    description: 'Pause and ask the user a clarifying question or present a checkpoint for approval. Use this when you need user input before proceeding, or when you want to present intermediate findings for review.',
    input_schema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question or checkpoint to present to the user' },
        options: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional list of choices for the user (e.g., ["Proceed", "Skip", "Modify approach"])'
        },
        checkpoint_data: { type: 'string', description: 'Summary of findings so far to present alongside the question (optional)' }
      },
      required: ['question']
    }
  },
  {
    name: 'trace_ownership',
    description: 'Trace the beneficial ownership chain of an entity or individual. Returns ownership percentages, sanctioned owner flags, OFAC 50% Rule analysis, sister companies through common owners, and risk levels. Use this to follow ownership layers until you reach a natural person or a dead end.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Entity or individual name to trace ownership for' },
        type: { type: 'string', enum: ['individual', 'entity'], description: 'Whether tracing from an individual (shows companies they own) or an entity (shows who owns it)' }
      },
      required: ['name']
    }
  },
  {
    name: 'find_precedents',
    description: 'Find historical enforcement actions and prior screening outcomes similar to this entity. Returns enforcement precedent matches (OFAC designations, BIS Entity List, DOJ actions), similar screening statistics (how many similar entities were high-risk, escalated, or later sanctioned), and a precedent risk score. Use this to assess whether an entity\'s risk profile matches known enforcement patterns.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Entity name to find precedents for' },
        details: { type: 'object', description: 'Optional additional details (jurisdiction, sector, red flags) to improve matching' }
      },
      required: ['name']
    }
  },
  {
    name: 'get_related_entities',
    description: 'Query the entity resolution graph to find known aliases, name variants, transliterations, and entities co-searched in the same sessions. Returns canonical entity info, all known variants, and related entities with relationship types and confidence scores. Use this to discover the full identity surface of a target before screening.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Entity name to look up in the resolution graph' }
      },
      required: ['name']
    }
  },
  {
    name: 'save_discovered_entities',
    description: 'Save entities discovered during this investigation to the Katharos knowledge base so they appear in future searches. Call this ONCE at the end of every investigation with ALL net-new entities discovered. Do NOT include entities already returned by search_entity_investigations — they are already in the database.',
    input_schema: {
      type: 'object',
      properties: {
        investigation_subject: { type: 'string', description: 'Primary subject of this investigation (e.g., "Vladimir Potanin")' },
        investigation_summary: { type: 'string', description: 'One-paragraph summary: key findings, coverage gap, and recommendation' },
        entities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Full legal name of the entity' },
              type: { type: 'string', enum: ['individual', 'entity', 'vessel', 'wallet', 'fund'], description: 'Entity type' },
              tier: { type: 'number', description: 'Tier classification (1-8) per investigation protocol' },
              riskLevel: { type: 'string', enum: ['CRITICAL', 'HIGH', 'ELEVATED', 'MEDIUM', 'LOW'], description: 'Risk classification' },
              jurisdiction: { type: 'string', description: 'Primary jurisdiction(s)' },
              sanctioned: { type: 'boolean', description: 'Whether entity is directly sanctioned' },
              connection: { type: 'string', description: 'How this entity connects to the investigation subject' },
              description: { type: 'string', description: 'Key compliance-relevant facts about this entity' },
              sdnStatus: { type: 'string', description: 'SDN designation status if applicable' },
              ofac50pct: { type: 'boolean', description: 'Whether OFAC 50% rule applies' }
            },
            required: ['name', 'type', 'tier', 'riskLevel']
          },
          description: 'Array of all net-new entities discovered during this investigation'
        }
      },
      required: ['investigation_subject', 'investigation_summary', 'entities']
    }
  },
  // Web search is a built-in Claude tool type
];

const WEB_SEARCH_TOOL = { type: 'web_search_20250305', name: 'web_search' };

// ── Tool Execution ──
async function executeTool(toolName, toolInput) {
  const s = getServices();

  switch (toolName) {
    case 'screen_entity': {
      const { name, type = 'individual', country } = toolInput;
      const screeningType = type === 'individual' ? 'INDIVIDUAL' : type === 'entity' ? 'ENTITY' : 'WALLET';
      const isWallet = type === 'wallet';

      const results = await Promise.all([
        race(s.ofac.screenEntity({ name: isWallet ? undefined : name, type: screeningType, address: isWallet ? name : undefined }), 'ofac'),
        race(s.adverseMedia.screen(name, screeningType, country || null), 'adverse-media'),
        race(s.courtRecords.screenEntity({ name, type }), 'court-records'),
        race(s.occrp.screenEntity({ name, type }), 'occrp'),
        race(s.pep.screenEntity({ name, type, country: country || null }), 'pep'),
        race(s.regulatory.screenEntity({ name, type: screeningType }), 'regulatory'),
        race(s.openCorporates.screenEntity({ name }), 'opencorporates'),
        isWallet ? race(s.blockchain.screenAddress({ address: name }), 'blockchain') : null,
        type === 'entity' ? race(s.shipping.screenEntity({ name, type: 'entity' }), 'shipping') : null,
        race(s.webIntel.search(name), 'web-intelligence'),
        isWallet ? race(s.wallet.screenWallet(name), 'wallet-screening') : null,
      ]);

      const [ofac, adverseMedia, courtRecords, occrp, pep, regulatory, openCorporates, blockchain, shipping, webIntel, wallet] = results;

      // Parse results using the actual service response shapes:
      // - regulatory: { totalActions, actions: [...], riskAssessment: { score, level, flags } }
      // - adverseMedia: { adverseMedia: { status }, articles/results from sub-sources }
      // - courtRecords: { summary: { totalCases, criminalCases, ... }, cases: [...] }
      // - ofac: { matches: [...], isMatch, totalSDNEntries }
      // - pep: { matches/pepMatches: [...] }
      // - occrp: { results: [...] }
      // - openCorporates: { companies: [...], officers: [...] }

      // Count only confirmed high-confidence matches from OFAC
      const ofacMatches = !ofac?._error ? (ofac?.matches || []).filter(m => m.matchConfidence >= 0.8) : [];

      // Regulatory: use riskAssessment, not raw action count
      const regActions = !regulatory?._error ? (regulatory?.actions || []) : [];
      const regRisk = !regulatory?._error ? regulatory?.riskAssessment : null;

      // Adverse media: count only articles flagged as relevant (HIGH/MEDIUM relevance)
      const allArticles = !adverseMedia?._error ? (adverseMedia?.adverseMedia?.articles || adverseMedia?.articles || []) : [];
      const relevantArticles = allArticles.filter(a => a.relevance === 'HIGH' || a.relevance === 'MEDIUM' || a.category !== 'OTHER');

      // Court records: use summary counts
      const courtSummary = !courtRecords?._error ? courtRecords?.summary : null;
      const courtCases = !courtRecords?._error ? (courtRecords?.cases || []) : [];

      const summary = {
        subject: name, type, screeningDate: new Date().toISOString(),
        sanctions: !ofac?._error ? { matches: ofacMatches.length, isMatch: ofac?.isMatch || false, details: ofacMatches.slice(0, 5) } : { error: ofac._error },
        pep: !pep?._error ? { matches: (pep?.matches || pep?.pepMatches || []).length, details: (pep?.matches || pep?.pepMatches || []).slice(0, 5) } : { error: pep._error },
        adverseMedia: !adverseMedia?._error ? { totalArticles: allArticles.length, relevantArticles: relevantArticles.length, status: adverseMedia?.adverseMedia?.status || 'UNKNOWN', details: relevantArticles.slice(0, 5) } : { error: adverseMedia._error },
        courtRecords: !courtRecords?._error ? { totalCases: courtSummary?.totalCases || courtCases.length, criminalCases: courtSummary?.criminalCases || 0, details: courtCases.slice(0, 5) } : { error: courtRecords._error },
        occrp: !occrp?._error ? { matches: (occrp?.results || []).length, details: (occrp?.results || []).slice(0, 5) } : { error: occrp._error },
        regulatory: !regulatory?._error ? { totalActions: regulatory?.totalActions || regActions.length, riskLevel: regRisk?.level || 'UNKNOWN', riskScore: regRisk?.score || 0, flags: (regRisk?.flags || []).slice(0, 5), details: regActions.slice(0, 5) } : { error: regulatory._error },
        corporateRecords: !openCorporates?._error ? { companies: (openCorporates?.companies || []).length, officers: (openCorporates?.officers || []).length } : { error: openCorporates._error },
        blockchain: blockchain && !blockchain?._error ? { flagged: blockchain?.flagged || false, details: blockchain } : null,
        shipping: shipping && !shipping?._error ? { matches: (shipping?.matches || []).length } : null,
        webIntelligence: !webIntel?._error ? { results: (webIntel?.results || []).length, details: (webIntel?.results || []).slice(0, 5) } : { error: webIntel._error },
      };

      return JSON.stringify(summary, null, 2);
    }

    case 'search_sanctions': {
      const { name, type = 'INDIVIDUAL' } = toolInput;
      const [ofac, pep] = await Promise.all([
        race(s.ofac.screenEntity({ name, type }), 'ofac'),
        race(s.pep.screenEntity({ name, type: type.toLowerCase() }), 'pep'),
      ]);
      return JSON.stringify({
        sanctions: !ofac?._error ? ofac : { error: ofac._error },
        pep: !pep?._error ? pep : { error: pep._error },
      }, null, 2);
    }

    case 'search_adverse_media': {
      const { name, type = 'INDIVIDUAL', country } = toolInput;
      const result = await race(s.adverseMedia.screen(name, type, country || null), 'adverse-media');
      return JSON.stringify(!result?._error ? result : { error: result._error }, null, 2);
    }

    case 'search_corporate_records': {
      const { name } = toolInput;
      const [openCorp, occrp] = await Promise.all([
        race(s.openCorporates.screenEntity({ name }), 'opencorporates'),
        race(s.occrp.screenEntity({ name, type: 'entity' }), 'occrp'),
      ]);
      return JSON.stringify({
        openCorporates: !openCorp?._error ? openCorp : { error: openCorp._error },
        occrp: !occrp?._error ? occrp : { error: occrp._error },
      }, null, 2);
    }

    case 'search_court_records': {
      const { name, type = 'individual' } = toolInput;
      const result = await race(s.courtRecords.screenEntity({ name, type }), 'court-records');
      return JSON.stringify(!result?._error ? result : { error: result._error }, null, 2);
    }

    case 'knowledge_base_search': {
      const { query } = toolInput;
      if (!process.env.PINECONE_API_KEY) return JSON.stringify({ results: [], error: 'Pinecone not configured' });
      try {
        const queryVector = await embedQuery(query);
        const idx = getPineconeIndex();
        const result = await idx.namespace('regulatory_docs').query({ vector: queryVector, topK: 5, includeMetadata: true });
        const matches = (result.matches || []).filter(m => m.score >= 0.65).map(m => ({
          title: m.metadata.source || m.id,
          category: m.metadata.category || '',
          subcategory: m.metadata.subcategory || '',
          url: m.metadata.url || '',
          relevance: m.score,
          excerpt: m.metadata.text || ''
        }));
        return JSON.stringify({ results: matches });
      } catch (err) {
        return JSON.stringify({ results: [], error: err.message });
      }
    }

    case 'search_entity_investigations': {
      const { query } = toolInput;
      if (!process.env.PINECONE_API_KEY) return JSON.stringify({ results: [], error: 'Pinecone not configured' });
      try {
        const queryVector = await embedQuery(query);
        const idx = getPineconeIndex();
        const result = await idx.namespace('entity_investigations').query({ vector: queryVector, topK: 10, includeMetadata: true });
        const matches = (result.matches || []).filter(m => m.score >= 0.60).map(m => ({
          name: m.metadata.name || m.id,
          entityId: m.metadata.entityId || '',
          type: m.metadata.type || '',
          jurisdiction: m.metadata.jurisdiction || '',
          tier: m.metadata.tier || '',
          riskLevel: m.metadata.riskLevel || '',
          sanctioned: m.metadata.sanctioned || 'false',
          sanctionsDetails: m.metadata.sanctionsDetails || '',
          convicted: m.metadata.convicted || '',
          convictionDetail: m.metadata.convictionDetail || '',
          evasionScheme: m.metadata.evasionScheme || '',
          ofac50pct: m.metadata.ofac50pct || '',
          crossNetwork: m.metadata.crossNetwork || '',
          parentNetwork: m.metadata.parentNetwork || '',
          parentSubject: m.metadata.parentSubject || '',
          investigation: m.metadata.investigation || '',
          significance: m.metadata.significance || '',
          description: m.metadata.description || '',
          relationship: m.metadata.relationship || '',
          operationalRole: m.metadata.operationalRole || '',
          complianceImplication: m.metadata.complianceImplication || '',
          beneficialOwner: m.metadata.beneficialOwner || '',
          sourcePrimary: m.metadata.sourcePrimary || '',
          sourceUrl: m.metadata.sourceUrl || '',
          confidence: m.metadata.confidence || '',
          type_tag: m.metadata.type_tag || '',
          text: m.metadata.text || '',
          relevance: m.score,
        }));
        const investigations = [...new Set(matches.map(m => m.investigation).filter(Boolean))];
        return JSON.stringify({
          totalMatches: matches.length,
          investigations,
          entities: matches,
          note: matches.length > 0
            ? `Found ${matches.length} pre-researched entities across ${investigations.length} investigation(s). These represent deep investigative findings that standard screening would miss.`
            : 'No matches in curated entity investigation database. Proceed with live screening tools.'
        }, null, 2);
      } catch (err) {
        return JSON.stringify({ results: [], error: err.message });
      }
    }

    case 'trace_ownership': {
      const { name, type = 'entity' } = toolInput;
      // Use the ownership-network module's logic inline
      // (it uses screen-sanctions.js internally — already imported as service)
      try {
        const { SANCTIONED_INDIVIDUALS, SANCTIONED_ENTITIES, screenEntity } = await import('./screen-sanctions.js');

        const normalizedName = name.toUpperCase().trim();

        if (type === 'individual') {
          // Find companies owned by this individual
          const ownedCompanies = [];
          const individual = SANCTIONED_INDIVIDUALS[normalizedName];
          if (individual?.ownership) {
            for (const [company, percentage] of Object.entries(individual.ownership)) {
              ownedCompanies.push({ company, ownershipPercent: typeof percentage === 'number' ? percentage : 0, sanctionedOwner: true });
            }
          }
          for (const [entityName, entityData] of Object.entries(SANCTIONED_ENTITIES)) {
            if (entityData.beneficialOwners?.[normalizedName]) {
              ownedCompanies.push({ company: entityName, ownershipPercent: entityData.beneficialOwners[normalizedName], ownershipType: 'BENEFICIAL' });
            }
          }
          const personScreening = screenEntity(name, 'INDIVIDUAL');
          return JSON.stringify({ subject: { name, type: 'INDIVIDUAL', sanctionStatus: personScreening.status }, ownedCompanies, totalCompanies: ownedCompanies.length }, null, 2);
        } else {
          // Analyze who owns this entity
          const knownEntity = SANCTIONED_ENTITIES[normalizedName];
          const beneficialOwners = [];
          let aggregateBlockedOwnership = 0;

          if (knownEntity?.beneficialOwners) {
            for (const [ownerName, percentage] of Object.entries(knownEntity.beneficialOwners)) {
              const ownerScreening = screenEntity(ownerName, 'INDIVIDUAL');
              const isBlocked = ownerScreening.status === 'MATCH';
              const pct = typeof percentage === 'number' ? percentage : 0;
              beneficialOwners.push({ name: ownerName, ownershipPercent: pct, sanctionStatus: isBlocked ? 'SANCTIONED' : 'CLEAR' });
              if (isBlocked && pct > 0) aggregateBlockedOwnership += pct;
            }
          }

          const entityScreening = screenEntity(name, 'ENTITY');
          const fiftyPercentRuleTriggered = aggregateBlockedOwnership >= 50;
          const riskLevel = fiftyPercentRuleTriggered ? 'CRITICAL' : aggregateBlockedOwnership >= 25 ? 'HIGH' : aggregateBlockedOwnership > 0 ? 'MEDIUM' : 'LOW';

          return JSON.stringify({
            subject: { name, type: 'ENTITY', sanctionStatus: entityScreening.status },
            beneficialOwners, aggregateBlockedOwnership, fiftyPercentRuleTriggered, riskLevel,
            summary: fiftyPercentRuleTriggered
              ? `BLOCKED under OFAC 50% Rule: ${aggregateBlockedOwnership.toFixed(1)}% owned by sanctioned persons`
              : aggregateBlockedOwnership > 0
              ? `${aggregateBlockedOwnership.toFixed(1)}% aggregate sanctioned ownership detected`
              : 'No sanctioned beneficial ownership identified'
          }, null, 2);
        }
      } catch (err) {
        return JSON.stringify({ error: err.message }, null, 2);
      }
    }

    case 'find_precedents': {
      const { name, details = {} } = toolInput;
      try {
        const precedentModule = await getPrecedentMatching();
        const result = await race(precedentModule.findPrecedents(name, details), 'precedents');
        return JSON.stringify(!result?._error ? result : { error: result._error }, null, 2);
      } catch (err) {
        return JSON.stringify({ error: err.message }, null, 2);
      }
    }

    case 'get_related_entities': {
      const { name } = toolInput;
      try {
        const entityModule = await getEntityResolution();
        const result = await race(entityModule.getRelatedEntities(name), 'entity-resolution');
        return JSON.stringify(!result?._error ? result : { error: result._error }, null, 2);
      } catch (err) {
        return JSON.stringify({ error: err.message }, null, 2);
      }
    }

    case 'save_discovered_entities': {
      const { investigation_subject, investigation_summary, entities } = toolInput;
      if (!process.env.PINECONE_API_KEY) return JSON.stringify({ saved: 0, error: 'Pinecone not configured' });
      if (!entities || entities.length === 0) return JSON.stringify({ saved: 0, note: 'No entities provided' });

      try {
        const idx = getPineconeIndex();
        const ns = idx.namespace('entity_investigations');
        const timestamp = new Date().toISOString();
        const investigationId = `AGENT-${slugify(investigation_subject).toUpperCase().substring(0, 40)}`;
        const allVectors = [];
        const BATCH = 5;

        // Embed entity vectors in batches of 5
        for (let i = 0; i < entities.length; i += BATCH) {
          const batch = entities.slice(i, i + BATCH);
          const embeddingTexts = batch.map(e => [
            `Entity: ${e.name}`,
            e.type ? `Type: ${e.type}` : '',
            e.jurisdiction ? `Jurisdiction: ${e.jurisdiction}` : '',
            e.riskLevel ? `Risk Level: ${e.riskLevel}` : '',
            e.sanctioned ? 'SANCTIONED: Yes' : '',
            e.sdnStatus ? `SDN status: ${e.sdnStatus}` : '',
            e.ofac50pct ? 'OFAC 50% RULE: Yes' : '',
            e.connection ? `Connection: ${e.connection}` : '',
            e.description ? `Description: ${e.description}` : '',
            `Investigation subject: ${investigation_subject}`,
            `Tier: ${e.tier}`,
            'Source: Katharos Agent Investigation',
          ].filter(Boolean).join(' | '));

          const vectors = await embedPassage(embeddingTexts);

          batch.forEach((e, j) => {
            const id = `agent-${slugify(investigation_subject)}-${slugify(e.name)}`.substring(0, 100);
            allVectors.push({
              id,
              values: vectors[j],
              metadata: {
                name: e.name,
                type: e.type || 'entity',
                jurisdiction: e.jurisdiction || '',
                tier: `Tier ${e.tier}`,
                riskLevel: e.riskLevel || '',
                sanctioned: String(e.sanctioned || false),
                sdnStatus: e.sdnStatus || '',
                ofac50pct: String(e.ofac50pct || false),
                connection: (e.connection || '').substring(0, 500),
                description: (e.description || '').substring(0, 500),
                parentSubject: investigation_subject,
                category: 'entity_investigation',
                investigation: investigationId,
                source_tag: 'agent-discovery',
                type_tag: 'entity',
                confidence: 'agent-assessed',
                text: embeddingTexts[j].substring(0, 1000),
                timestamp,
              }
            });
          });
        }

        // Embed investigation summary vector
        const summaryText = `Agent investigation: ${investigation_subject}. ${investigation_summary}. Entities found: ${entities.map(e => e.name).join(', ')}`.substring(0, 1500);
        const [summaryVector] = await embedPassage([summaryText]);
        allVectors.push({
          id: `agent-${slugify(investigation_subject)}-summary`.substring(0, 100),
          values: summaryVector,
          metadata: {
            name: `Agent Investigation: ${investigation_subject}`,
            type: 'investigation_summary',
            category: 'entity_investigation',
            investigation: investigationId,
            source_tag: 'agent-discovery',
            type_tag: 'investigation_metadata',
            entityCount: String(entities.length),
            text: summaryText.substring(0, 1000),
            timestamp,
          }
        });

        // Upsert in batches of 10
        let upserted = 0;
        for (let i = 0; i < allVectors.length; i += 10) {
          const batch = allVectors.slice(i, i + 10);
          await ns.upsert(batch);
          upserted += batch.length;
        }

        return JSON.stringify({
          saved: entities.length,
          investigation: investigationId,
          vectorsUpserted: upserted,
          note: `${entities.length} entities and 1 investigation summary saved to knowledge base. These will appear in future search_entity_investigations queries.`
        });
      } catch (err) {
        return JSON.stringify({ saved: 0, error: err.message });
      }
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// ── SSE Helper ──
function sendSSE(res, event, data) {
  res.write(`data: ${JSON.stringify({ type: event, ...data })}\n\n`);
}

// ── Agent System Prompt ──
const AGENT_SYSTEM_PROMPT = `You are Marlowe, the investigation engine for Katharos — an AI-native financial crime intelligence platform. You are not a general-purpose assistant. You are a senior compliance professional with deep expertise in OFAC sanctions, FinCEN BSA/AML, FCPA, export controls, KYC/CDD/EDD, SAR drafting, crypto compliance, shell company structures, money laundering typologies, and PEP screening.

Every search a user runs is a trigger for a full investigation. You do not screen. You investigate.

## YOUR VOICE

Direct, confident, professional. No corporate fluff, no filler phrases, no "I'd be happy to help" or "Great question." No unnecessary hedging — if uncertain, say why specifically. Use industry terminology naturally (SAR, CDD, EDD, PEP, UBO). Clear structure. Vary sentence length — short for impact, longer for nuance.

You are the expert in the room. When in doubt, ask yourself: "What would a 20-year OFAC veteran say?" Then say that.

WHAT YOU NEVER DO: Give vague hedged non-answers when a clear assessment is possible. Say "I cannot provide legal advice." Pad responses with unnecessary caveats. Explain what compliance is to compliance professionals. Use phrases like "It's important to note that..." Refuse to give a risk rating when you have enough information.

## OUTPUT PROTOCOL

Do NOT narrate your thinking process. No "Let me search...", "Now I'll...", "I'm going to...", "Let me now check..." narration. The user sees a progress panel showing each tool call as it runs — they do not need commentary on what you are doing.

Do NOT output branch accounting blocks. Track branches internally but do not emit them.

During the investigation, you may output brief one-line status updates ONLY when a significant finding surfaces. Examples: "SANCTIONS HIT: [entity name]" or "OFAC 50% rule triggered: [entity] via [parent]". Keep these to one line each. No paragraphs of reasoning between tool calls.

When the investigation is complete, output your final report as a SINGLE JSON code block. Wrap it in \`\`\`json ... \`\`\`. No markdown sections. No text before or after the JSON block (in the same message). The JSON must conform EXACTLY to this schema:

\`\`\`json
{
  "entitySummary": {
    "legalName": "Full legal registered name; if subsidiary is designated, include both parent and subsidiary",
    "type": "Entity classification — e.g. State-Owned Shipping Conglomerate | Subsidiary: Ship Management Company",
    "status": "Sanctions/designation status — e.g. Parent: DOD Chinese Military Company | Subsidiary: OFAC SDN Designated",
    "nationality": "Country of origin, listing jurisdiction, operational base",
    "jurisdiction": "All jurisdictions of incorporation, listing, and material operations",
    "keyBusiness": "Core business activities — comma-separated",
    "parentCompany": "Ultimate parent entity if applicable, or N/A",
    "designationDetails": "Specific list, executive order, or enforcement basis — or None",
    "pepStatus": "PEP / Non-PEP / PEP Associate — include tier and position if applicable",
    "eddObligations": "What enhanced due diligence applies — or Standard CDD sufficient"
  },
  "matchConfidence": {
    "level": "HIGH or MEDIUM or LOW",
    "percentage": 95,
    "factorsSupporting": ["exact entity match", "confirmed DOD designation", "verified state ownership"],
    "factorsReducing": ["common name variants across jurisdictions"]
  },
  "overallRisk": {
    "level": "CRITICAL or HIGH or MEDIUM or LOW",
    "score": 85,
    "recommendation": "APPROVE or DO NOT TRANSACT or ESCALATE FOR EDD",
    "summary": "One-sentence explanation of the recommendation"
  },
  "criticalFindings": [
    {
      "severity": "CRITICAL or HIGH or MEDIUM",
      "title": "Finding title",
      "description": "What standard screening misses and why it matters",
      "source": "OFAC SDN List / OCCRP / ICIJ / Companies House / etc."
    }
  ],
  "riskScoreBreakdown": [
    { "factor": "OFAC SDN designation", "weight": "40%", "score": 40, "reasoning": "Direct designation under EO 13846" },
    { "factor": "Secondary sanctions risk", "weight": "20%", "score": 15, "reasoning": "OFAC 50% rule applies to 3 subsidiaries" },
    { "factor": "Adverse media", "weight": "15%", "score": 10, "reasoning": "Multiple enforcement actions 2022-2024" },
    { "factor": "PEP exposure", "weight": "10%", "score": 10, "reasoning": "Tier 1 PEP — head of state-owned enterprise" },
    { "factor": "Entity complexity", "weight": "10%", "score": 7, "reasoning": "14 entities across 6 jurisdictions" },
    { "factor": "Jurisdiction risk", "weight": "5%", "score": 3, "reasoning": "Operations in FATF grey-list jurisdiction" }
  ],
  "redFlags": [
    {
      "title": "OFAC SDN Designation — Subsidiary Entity",
      "description": "Entity designated under Iran sanctions program with comprehensive blocking provisions including foreign exchange restrictions, banking transaction prohibitions, and investment bans.",
      "impact": "Any transaction with this subsidiary violates U.S. sanctions law and subjects U.S. persons to civil and criminal penalties."
    }
  ],
  "entityNetwork": [
    {
      "entity": "Entity name",
      "type": "Subsidiary / Parent / Affiliate",
      "jurisdiction": "Country",
      "risk": "CRITICAL or HIGH or MEDIUM or LOW",
      "sanctioned": "Yes or No or Partial Match",
      "matchPercent": 95,
      "connection": "How connected to subject",
      "source": "OFAC SDN List / Companies House / etc."
    }
  ],
  "corporateStructure": {
    "parentEntity": "Top-level entity name (the subject or its ultimate parent)",
    "structureType": "Complex structure / Simple structure / State-owned / Conglomerate",
    "owners": [
      {
        "name": "Owner name — individual, trust, fund, or entity",
        "percentage": 48,
        "description": "OFAC listed / BVI trust / undisclosed / state-owned / nominee",
        "flagged": true
      }
    ],
    "subsidiaries": [
      {
        "name": "Subsidiary name",
        "jurisdiction": "Country",
        "ownership": "100% / majority / minority",
        "risk": "CRITICAL / HIGH / MEDIUM / LOW / CLEAN",
        "badges": ["SANCTIONED", "SDN", "CONVICTED", "DPA", "DESIGNATED", "BLOCKED", "HIGH RISK"]
      }
    ],
    "notes": "Key compliance note about the ownership structure — nominee concerns, undisclosed tranches, OFAC 50% rule implications, etc."
  },
  "regulatoryContext": [
    {
      "jurisdiction": "Country name",
      "opacity": "High or Medium or Low",
      "fatfStatus": "Listed or Grey or Clean",
      "keyRisk": "One phrase",
      "notes": "One line"
    }
  ],
  "typologies": [
    {
      "name": "Sanctions Evasion via Subsidiary Restructuring",
      "pattern": "One-sentence description of the general typology",
      "evidence": "How this pattern manifests specifically — entity names, dates, jurisdictions",
      "complianceImplication": "What this means for transaction screening and due diligence"
    }
  ],
  "adverseMedia": [
    {
      "date": "YYYY-MM-DD",
      "outlet": "Publication name",
      "headline": "Article headline",
      "relevance": "High or Medium or Low",
      "source": "URL or publication name"
    }
  ],
  "ownershipHistory": [
    {
      "date": "YYYY-MM-DD",
      "event": "Formed / Renamed / Dissolved / Sold / Restructured",
      "entity": "Entity name",
      "detail": "One line description",
      "complianceNote": "One line compliance relevance"
    }
  ],
  "designationTimeline": [
    {
      "date": "YYYY-MM-DD",
      "program": "Program name",
      "authority": "OFAC / EU / UK OFSI / UN",
      "entityDesignated": "Entity name",
      "gl": "Yes or No",
      "glExpiry": "Date or N/A"
    }
  ],
  "generalLicenses": [
    {
      "gl": "GL number",
      "scope": "What the license authorizes",
      "issued": "Issue date",
      "expires": "Expiry date",
      "actionRequired": "What compliance team must do before expiry"
    }
  ],
  "programsAndAuthorities": [
    {
      "reference": "EO number / GL number / statute / list name",
      "program": "Program name",
      "authority": "Issuing authority",
      "description": "One line plain-English description"
    }
  ],
  "financialExposure": {
    "transactionExposure": "Dollar amount at risk or Unknown",
    "penaltyRange": "Civil: up to $X per violation / Criminal: up to $X",
    "comparableEnforcement": "1-2 lines on similar cases and penalties",
    "businessImpact": "One sentence on operational consequence of non-compliance"
  },
  "coverageGap": {
    "standardScreening": { "entities": 5, "jurisdictions": 2, "programs": 1, "coverage": "15%" },
    "thisInvestigation": { "entities": 33, "jurisdictions": 8, "programs": 4, "coverage": "100%" }
  },
  "gapsAndLimitations": "What could not be verified and what would close each gap",
  "recommendedActions": {
    "immediate": ["Blocking actions, regulatory notifications, SAR filings"],
    "shortTerm": ["Enhanced DD steps, document requests, registry searches"],
    "ongoing": ["Monitoring, periodic rescreening, watchlist alerts"],
    "bottomLine": "One-sentence final assessment"
  },
  "monitoringSchedule": {
    "nextReview": "Date — CRITICAL=continuous, HIGH=monthly, MEDIUM=quarterly, LOW=annually",
    "triggerEvents": "What would require immediate re-investigation",
    "assignedTo": ""
  }
}
\`\`\`

RULES:
- The six riskScoreBreakdown scores MUST sum to overallRisk.score.
- Set optional arrays to [] (not null) when not applicable: adverseMedia, ownershipHistory, designationTimeline, generalLicenses.
- corporateStructure uses \\n for newlines in the tree string.
- Include 3-5 redFlags maximum. Each must be concrete and actionable.
- Include 2-5 typologies. Only patterns supported by evidence.
- criticalFindings ordered by severity: CRITICAL first, then HIGH, then MEDIUM.
- All string values may contain plain text only — no markdown formatting (no ** bold, no links).

## INVESTIGATION PROTOCOL — EXECUTE ON EVERY SEARCH

### STEP 0 — CLASSIFY THE SUBJECT

Before anything else, classify the search:

**BOUNDED** — single individual, single company, single transaction, single DPA. Proceed directly to Step 1.

**NETWORK-SCALE** — oligarch, cartel, RICO enterprise, multi-entity corporate group, state-owned enterprise, sanctioned conglomerate, any subject where the entity count is expected to exceed 30. Use ask_user to present a SCOPE DECLARATION and get operator confirmation before proceeding at depth.

### STEP 1 — IDENTITY RESOLUTION

Your first action before any screening. Never accept the name at face value.

For individuals: resolve full legal name including all surnames and patronymics, all known aliases, transliterations, maiden names, date of birth, all nationalities and jurisdictions. "Vladimir Potanin" vs "Vladimir Olegovich Potanin" changes every subsequent search result.

For entities: full legal registered name, all known trade names and prior names, jurisdiction of incorporation and registration number, any known related entities or parent structures.

Use get_related_entities and web_search for identity resolution. Do not proceed to Batch 1 until identity is confirmed.

### STEP 2 — DATABASE CHECK FIRST (MANDATORY)

BEFORE running any screening tools, call search_entity_investigations ALONE. This is your highest-value data source — 12,200+ pre-researched entities across 1,800+ subjects. Wait for the result before deciding your next step.

**CACHE HIT (5+ entities returned):** The subject has been comprehensively investigated. DO NOT run the full protocol. Follow this FAST PATH only:
1. Call screen_entity ONCE (live sanctions/PEP status check)
2. That is it. No web_search, no trace_ownership, no knowledge_base_search, no search_corporate_records.
3. Write STEP 10 — FINAL OUTPUT immediately using the cached entity data + the live screen_entity result.
4. In COVERAGE GAP, cite the original investigation as source.
This must complete in 2 tool calls total (search_entity_investigations + screen_entity). No exceptions. Do NOT run additional tools on a cache hit — the investigation database already contains deep findings.

**CACHE MISS (0-4 entities):** Proceed to BATCH 1 below.

### BATCH 1 (Cache miss only — fire simultaneously)

Fire in parallel based on subject type:

**For INDIVIDUAL subjects — fire all simultaneously:**
- screen_entity (full 13-layer screening)
- web_search: "[full legal name]" OFAC SDN sanctioned designated
- web_search: "[full legal name]" Cyprus BVI Cayman offshore holdings structure
- web_search: "[full legal name]" beneficial owner shareholder director
- web_search: "[full legal name]" nominee proxy family member director transfer
- web_search: "[full legal name]" fraud investigation enforcement lawsuit conviction
- knowledge_base_search (regulatory context and typologies)

**For CORPORATE ENTITY subjects — fire all simultaneously:**
- screen_entity (full 13-layer screening)
- web_search: "[full legal name]" DOJ FCPA "plea agreement" OR "deferred prosecution" settlement
- web_search: "[full legal name]" subsidiaries "wholly owned" OR "majority owned"
- web_search: "[full legal name]" ICIJ "offshore leaks" OR "panama papers" OR "paradise papers"
- web_search: "[full legal name]" bribery intermediary agent "shell company" convicted
- web_search: "[full legal name]" "beneficial owner" OR "ultimate beneficial owner" undisclosed hidden
- knowledge_base_search (regulatory context and typologies)

Do not wait for all to complete before starting Batch 2. Stream findings as they arrive.

### STEP 3 — BATCH 2 (Spawn on every new entity from Batch 1)

For each entity discovered in Batch 1, immediately investigate using the appropriate tools:

**For each INDIVIDUAL found:**
- search_sanctions
- trace_ownership (type: individual)
- web_search: "[name]" conviction indicted charges enforcement

**For each CORPORATE ENTITY found:**
- search_sanctions
- search_corporate_records
- trace_ownership (type: entity)
- web_search: "[entity name]" DOJ enforcement plea settlement

Start Batch 2 the moment the first Batch 1 result returns. Do not wait.

### STEP 4 — DEEP BRANCH TRIGGERS

Spawn a deep branch immediately on any entity that returns: a sanctions hit or near-match, an offshore jurisdiction in the ownership chain (BVI, Cayman, Malta, Cyprus, Liechtenstein, UAE, Singapore, Seychelles, Panama, Delaware), a nominee or proxy pattern, a formation date within 12 months of a sanctions designation, a connection to Iran/Russia (post-2022)/Belarus/Venezuela/North Korea/Cuba/Syria or any FATF grey/black list country.

Additional corporate triggers: a named shell company or intermediary in any enforcement document, a subsidiary with its own conviction or DPA separate from the parent, any entity described as "undisclosed" or not in public filings, any entity formed within 12 months of an enforcement action.

Deep branch runs: trace_ownership to natural person or documented dead end, search all associated entities named in any designation or enforcement document.

### STEP 5 — NOMINEE DETECTION

For every individual appearing as director or shareholder in a connected entity:
1. If they appear as director of 10+ unrelated companies — professional nominee. Flag and go deeper.
2. Check for spouse, children, siblings, known business associates appearing in roles where the subject previously held directly.
3. Flag any transfer occurring within 12 months before a sanctions designation — this is the primary evasion restructuring signal.

### STEP 6 — BRANCH ACCOUNTING (internal tracking — do not output to user)

Track branches internally to ensure all leads are pursued. Do not emit branch accounting blocks in your output. SPAWNED must list every entity found. OPEN must reach zero before the investigation closes. Every item remaining in OPEN becomes the next investigation subject.

### STEP 7 — TIER CLASSIFICATION (assign every entity to exactly one tier)

TIER 1 — Directly convicted or sanctioned. Named on OFAC SDN, UN, EU, or UK OFSI list; or subject to criminal conviction or DPA.

TIER 2 — OFAC 50% Rule. Not individually named but owned 50%+ by a Tier 1 entity. Sanctioned by operation of law.

TIER 3 — Beneficially owned, not individually sanctioned. Owned or controlled by subject but below 50% threshold.

TIER 4 — Recently formed, renamed, or redomiciled. Entities formed or renamed within 24 months. Flag any within 12 months of a sanctions designation — deliberate evasion restructuring.

TIER 5 — Investment vehicles and fund structures. Named funds, venture vehicles, family office entities, charitable foundations, joint ventures.

TIER 6 — Third-country and high-risk jurisdiction exposure. Iran, Russia (post-2022), Belarus, Venezuela, North Korea, Cuba, Syria, FATF grey/black list countries.

TIER 7 — Digital asset and crypto exposure. Blockchain platforms, tokenization services, digital asset funds, crypto exchanges, OTC desks.

TIER 8 — Intermediaries and enablers not in any database. Shell companies used as bribery conduits, nominee directors, professional money launderers, fixers. Found only through court filings, leaked databases, and investigative journalism.

### STEP 8 — SANCTIONS CONTAMINATION

When any entity in the network is sanctioned:
- Every entity owned 50%+ by a sanctioned individual inherits sanctions exposure
- Every entity where a sanctioned individual exercises control warrants escalation
- Never score subsidiaries independently from their sanctioned parent
- Document the contamination path: [Subject] [SANCTIONED] → [Entity A] [50% owned → OFAC 50% rule] → [Entity B] [contaminated]

### STEP 9 — REFLECTION PASS (before final output)

Run this checklist before writing final output:
1. Have I resolved the subject's full legal name including all transliterations?
2. Have I checked all offshore jurisdictions — Cyprus, BVI, Cayman, Liechtenstein, Malta, UAE, Singapore, Seychelles, Panama, Delaware?
3. Have I searched the entity investigation database for pre-researched intelligence?
4. Have I traced every ownership chain to a natural person or documented dead end?
5. Have I applied the OFAC 50% rule to every entity where a sanctioned individual appears?
6. Have I checked all formation dates — any within 12 months of a designation is an evasion signal?
7. Have I checked for adverse media that predates formal enforcement actions?
8. For corporate subjects: Have I read the full enforcement document, not just the press release?
9. For corporate subjects: Have I checked every subsidiary independently?
10. BRANCH ACCOUNTING CHECK: Does FOUND LIST = INVESTIGATED LIST? Is OPEN = 0?
11. Have I included MATCH CONFIDENCE with specific supporting and reducing factors?
12. Have I checked for active OFAC General Licenses with expiry dates? Missing a GL window is the #1 compliance failure mode.
13. Have I included DESIGNATION TIMELINE (with GL? and GL Expiry columns) for any sanctioned entities?
14. Is my COVERAGE GAP a comparison table with entities, jurisdictions, programs screened, and coverage %?
15. Are my RECOMMENDED ACTIONS split into IMMEDIATE / SHORT-TERM / ONGOING urgency tiers?
16. Are my CRITICAL FINDINGS numbered with **[CRITICAL]** / **[HIGH]** / **[MEDIUM]** severity prefixes, each with a Source line?
17. Have I included PEP STATUS — even if the subject is Non-PEP?
18. Have I included REGULATORY CONTEXT with a row per jurisdiction in the entity network?
19. Have I included RISK SCORE BREAKDOWN with weighted factors totaling 100%?
20. Have I included FINANCIAL EXPOSURE with penalty range and comparable enforcement actions?
21. Have I included PROGRAMS AND AUTHORITIES listing every EO, GL, statute, or list referenced in the report?
22. Have I included MONITORING SCHEDULE with next review date based on risk level?
23. Does each entity in ENTITY NETWORK have a Match % and Source column?
24. Have I included CORPORATE NETWORK as an ASCII tree diagram in a code block showing the ownership/control hierarchy?

If any check fails, do not write final output. Close the gap first.

### STEP 10 — FINAL OUTPUT

Output your findings as the JSON code block defined in OUTPUT PROTOCOL above. The JSON must be valid and complete. ALWAYS include the coverageGap — this is the core value proposition.

### STEP 11 — PERSIST DISCOVERIES

After writing your final output, call save_discovered_entities ONCE with:
- investigation_subject: the primary subject name
- investigation_summary: your coverage gap statement and key finding summary (1 paragraph)
- entities: every net-new entity from your BRANCH ACCOUNTING that was NOT already present in the entity investigation database (from search_entity_investigations results). Include tier, riskLevel, type, jurisdiction, connection, and description for each.

This persists your findings so future investigations automatically benefit from this work. Only include entities YOU discovered through live screening — not entities that search_entity_investigations already returned. This step is MANDATORY. Every investigation must end with a save_discovered_entities call.

## TOOL STRATEGY

Your tools and when to use them:

- **search_entity_investigations**: ALWAYS USE FIRST. Curated database of 12,200+ pre-researched entities across 1,800+ subjects in 16 investigations with 9,500+ vectors. If the subject appears here, you have deep intelligence before live screening even starts. Contains full network maps for Russian oligarchs, Glencore, commodities sanctions, criminal enforcement, 70-subject database, SDN Top 100, SDN Batch 2 (Abramovich, Vekselberg, Kostin, Prigozhin, Gazprombank, Jho Low/1MDB, CZ/Binance), SDN Batch 3 (Lavrov, Evraz, LockBit, Evil Corp, Shadow Fleet, Kolomoisky, Hezbollah/Hamas/Houthi, Isabel dos Santos, Karimova, Firtash, Manafort), SDN Batch 4 (Rashnikov/MMK, Chemezov/Rostec, Timchenko/Gunvor, Rotenberg, Melnichenko/EuroChem, Fridman/Alfa, Gazprom Neft/NIS Serbia, Sandworm, APT29, IRGC Charming Kitten, Hemedti/Sudan, Myanmar, Venezuela, Cuba, Belarus, Tornado Cash delisted, Bybit $1.5B, DPRK IT workers, NIOC ghost tankers, Wagner Africa Corps, CJNG fentanyl, Rosneft/Nayara, professional enablers, SWIFT/SPFS alternatives), Financial Crime Database (350 subjects across 7 categories — convicted ML: Vinnik/BTC-e, Mogilevich, 1MDB, Troika Laundromat, SBF/FTX, Danske Bank, HSBC, Wirecard, Binance; indicted: Halkbank, Do Kwon, Celsius; fraud: Madoff, Stanford, Enron, Theranos, Archegos, OneCoin; RICO: Sinaloa, Ndrangheta, MS-13, Yakuza, ransomware; asset forfeiture: KleptoCapture, Bitfinex $3.6B, Mt. Gox; cartel: Los Chapitos, CJNG, TD Bank, Garcia Luna; crypto fraud: OneCoin, Axie/Lazarus, bridge hacks, Tornado Cash founders, pig butchering), Expansion Batch (170 subjects, 1,450+ entities — Category Batch 2: trade-based ML/hawala/casino/freeport/real estate/art market ML, sanctions evasion indictments, AI deepfake fraud, Wagner/Tren de Aragua/PCC RICO, cryptocurrency seizures, synthetic opioid/dark web/arms trafficking, DeFi exploits/MEV/flash loans/NFT wash trading; SDN Batch 5: Russia SDN expansion, Iran nuclear procurement, DPRK crypto ops, cartel financial networks, crypto sanctions enforcement, sanctions evasion networks), and SDN Batch 7 (subjects 510-609, 775+ entities — March 2026 OFAC live actions: Hamas sham charities, DPRK IT worker facilitators, Rwanda Defence Force, Muslim Brotherhood, Lukoil GL expiry, Venezuela removals, Nicaragua; Hamas/Hezbollah ecosystem; DRC/Africa: Gertler, Africa Corps, Al-Shabaab, Sahel juntas; Central America/Caribbean; Russia oligarch extended: Timchenko/Vekselberg/Fridman/Abramovich/Mordashov/Kabaeva; SE Asia/Pacific; financial intelligence/typology; offshore jurisdiction compliance maps; crypto/DeFi/stablecoin landscape 2026), and SDN Batch 8 (subjects 610-659, 415+ entities — CLAUDE BLIND SPOTS: Zanjani/Zedcex $94B re-designated January 2026, Mojtaba Khamenei new Supreme Leader March 2026, Petro Colombia president SDN October 2025, Lukoil International GmbH SDN December 2025/50% rule, Nayara Energy India BLOCKED, Iran protest crackdown 30+ SDNs, Soltanmohammadi 7 UK passports, Rayan Fan MODAFL procurement, A7A5/Old Vector $93B, Phoenix Ship Management, Golden Mist Singapore, LNFM/CU/CDN FTO map, DPRK Shenyang/Herrera/Sim live ETH, ICC designations, OFAC gatekeeper enforcement 2026, Russia $104B crypto), PEP Batch 1 (200 PEP subjects, 1,000+ entities — Putin, Lukashenko, Xi Jinping, MBS, Erdogan, Modi, Maduro, Gupta, Mugabe across 13 regions), PEP Batch 2 (200 additional PEP subjects, 1,000+ entities — Mishustin, Kostin/VTB, Gref/Sberbank, Miller/Gazprom, Kadyrov, Jack Ma, Sisi, Assad, AMLO, Orbán across 9 regions), and PEP Batch 3 (200 subjects, 1,000+ entities across 14 regions — Rybolovlev/FBI, Gutseriev/Isle of Man, Milner/DST Global, Khodorkovsky/Yukos, Mojtaba Khamenei new Supreme Leader, Jho Low/1MDB, SBF/FTX, Adani US indicted, Schröder/Gazprom, Guebuza $2B hidden debt, Odebrecht $800M, MBS/PIF/LIV Golf, Patrick Ho CEFC SDNY).
- **screen_entity**: Full 13-layer screening (OFAC, PEP, adverse media, corporate, courts, OCCRP, blockchain, etc). Use for comprehensive due diligence on any entity.
- **search_sanctions**: Targeted OFAC/PEP lookup. Use in Batch 2 for each new entity.
- **search_adverse_media**: News and reputational intelligence. Use for media-driven investigations.
- **search_corporate_records**: OpenCorporates / Companies House. Use for structure, officers, filings.
- **search_court_records**: Federal litigation and criminal cases. Use for legal exposure.
- **trace_ownership**: Beneficial ownership chains. Use to follow money and control to natural person.
- **get_related_entities**: Aliases, variants, co-searched names. Use in Step 1 identity resolution.
- **find_precedents**: Historical enforcement pattern matching. Use to contextualize risk.
- **knowledge_base_search**: Regulatory guidance from OFAC, FinCEN, DOJ, FATF, SEC, etc. Use for typologies and red flags.
- **web_search**: Current news, OSINT, public records. CRITICAL: Never conclude without at least one live search per subject.
- **ask_user**: Pause for operator input. Use for NETWORK-SCALE scope declarations or when investigation branches require authorization.
- **save_discovered_entities**: Save all net-new entities to the permanent knowledge base. Call ONCE as your FINAL tool call in every investigation. Include every entity from BRANCH ACCOUNTING with tier, risk level, and connection. Do NOT include entities already returned by search_entity_investigations.

## MANDATORY PROTOCOLS

### KNOWLEDGE BASE PERSISTENCE
Every investigation MUST end with a save_discovered_entities call. The knowledge base grows with every investigation. Skipping this step means your findings die with the session.

### EVIDENCE SUFFICIENCY
Do not state as fact anything unverified from a primary source. Use qualified language: "Reported to hold" not "has", "LinkedIn indicates" not "previously worked at." A documented negative search IS the due diligence.

### AGENTIC LOOP RULES
You do not stop because you ran a fixed number of searches. You stop when evidence is sufficient.

CONTINUE if: a finding raises a new unanswered question, a new name/entity/jurisdiction appears unsearched, stated and verified information conflict, full legal name unconfirmed, or beneficial ownership not traced to a natural person.

STOP only when: all subjects screened across all sources, all corporate chains traced, all facts verified or flagged as unverified, and OPEN branches = 0.

MANDATORY LOOP EXTENSIONS:
1. Incomplete name — search for full legal version before proceeding
2. Unexpected entity — any new company/jurisdiction/individual surfacing mid-investigation must be investigated
3. Conflicting data — do not average or pick one source. Investigate the conflict.
4. Offshore jurisdiction — BVI, Cayman, Malta, Cyprus triggers automatic additional investigation

### RISK CLASSIFICATION
- HIGH (Do Not Transact): Direct sanctions hit, 50% rule trigger, confirmed fraud, active investigation, 1-hop graph connection
- ELEVATED (EDD Required): Near-match on sanctions, enforcement history, credible adverse media, leaked database appearance, structural red flags, 2-hop graph
- MEDIUM (Standard DD): High-risk jurisdiction/industry, limited public profile, resolved regulatory matter
- LOW (Clear): All 5 dimensions clean, no graph connections, verifiable identity and ownership

## THE STANDARD

A standard screening of a sophisticated subject returns 5–10 entities. A proper Katharos investigation following this protocol returns 20–150+. The entities that standard screening misses are where the actual compliance exposure lives. That gap is the entire reason this product exists.

You are not done when you have checked the lists. You are done when every branch is closed, every entity has been classified to a tier, the FOUND LIST matches the INVESTIGATED LIST, the reflection pass has been run and passed, and the coverage gap has been stated.

That is the bar. Meet it on every search.`;

// ── Main Handler ──
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { messages = [], caseContext } = req.body;

  // Build system prompt with optional case context
  let systemPrompt = AGENT_SYSTEM_PROMPT;
  if (caseContext) {
    systemPrompt += `\n\nCURRENT CASE CONTEXT:\n- Case: ${caseContext.name || 'Unknown'}\n- Subject: ${caseContext.subject || 'Not specified'}\n- Type: ${caseContext.type || 'Not specified'}`;
    if (caseContext.previousFindings) {
      systemPrompt += `\n- Previous findings available in conversation history`;
    }
  }

  // Claude tools = our custom tools + web search
  const tools = [...AGENT_TOOLS, WEB_SEARCH_TOOL];

  // Agentic loop — max 25 iterations to allow deep investigations
  const MAX_ITERATIONS = 25;
  let conversationMessages = [...messages];
  let iteration = 0;

  try {
    sendSSE(res, 'agent_status', { message: 'Agent starting...' });

    while (iteration < MAX_ITERATIONS) {
      iteration++;

      // Call Claude API (non-streaming to get full tool_use blocks)
      const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 16000,
          system: systemPrompt,
          messages: conversationMessages,
          tools,
        })
      });

      if (!apiResponse.ok) {
        const errText = await apiResponse.text();
        sendSSE(res, 'agent_error', { message: `API error: ${errText}` });
        break;
      }

      const result = await apiResponse.json();
      const { content, stop_reason } = result;

      // Process each content block
      let hasToolUse = false;
      let askUserBlock = null;
      const toolResults = [];
      let iterationText = '';

      // First pass: collect text and detect tool use
      for (const block of content) {
        if (block.type === 'text' && block.text) {
          iterationText += block.text;
        }
        if (block.type === 'tool_use') {
          hasToolUse = true;
        }
      }

      // Check if the text contains a JSON report code block
      const jsonMatch = iterationText.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const reportData = JSON.parse(jsonMatch[1].trim());
          sendSSE(res, 'report_json', reportData);
        } catch (e) {
          // JSON parse failed — send as text fallback
          sendSSE(res, 'agent_text', { text: iterationText });
        }
      } else if (iterationText && (iterationText.includes('## ') || !hasToolUse)) {
        // Stream status updates and any non-JSON text
        sendSSE(res, 'agent_text', { text: iterationText });
      }

      // Second pass: execute tool calls
      hasToolUse = false;
      for (const block of content) {
        if (block.type === 'tool_use') {
          hasToolUse = true;

          // Special case: ask_user pauses the loop
          if (block.name === 'ask_user') {
            askUserBlock = block;
            continue;
          }

          // Emit tool call event
          sendSSE(res, 'agent_tool_call', {
            tool_use_id: block.id,
            name: block.name,
            input: block.input,
          });

          // Execute the tool
          try {
            const toolResult = await executeTool(block.name, block.input);

            // Emit tool result event (truncated summary for UI)
            const parsed = JSON.parse(toolResult);
            sendSSE(res, 'agent_tool_result', {
              tool_use_id: block.id,
              name: block.name,
              summary: summarizeToolResult(block.name, parsed),
            });

            // Send full screening data to frontend for KYC card rendering
            if (block.name === 'screen_entity') {
              sendSSE(res, 'screening_data', {
                subject: block.input.name,
                type: block.input.type || 'individual',
                result: parsed,
              });
            }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: toolResult,
            });
          } catch (err) {
            sendSSE(res, 'agent_tool_result', {
              tool_use_id: block.id,
              name: block.name,
              summary: `Error: ${err.message}`,
              error: true,
            });

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify({ error: err.message }),
              is_error: true,
            });
          }
        }
      }

      // If ask_user was called, pause the loop
      if (askUserBlock) {
        // Execute any other tool results first
        if (toolResults.length > 0) {
          conversationMessages.push({ role: 'assistant', content });
          conversationMessages.push({ role: 'user', content: toolResults });
        }

        sendSSE(res, 'agent_question', {
          tool_use_id: askUserBlock.id,
          question: askUserBlock.input.question,
          options: askUserBlock.input.options || null,
          checkpoint_data: askUserBlock.input.checkpoint_data || null,
          // Send conversation state so frontend can resume
          conversation_state: conversationMessages,
          pending_assistant_content: content,
        });

        sendSSE(res, 'agent_paused', { reason: 'Waiting for user response' });
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      // If there were tool calls, append results and continue the loop
      if (hasToolUse && toolResults.length > 0) {
        conversationMessages.push({ role: 'assistant', content });
        conversationMessages.push({ role: 'user', content: toolResults });
        continue;
      }

      // If stop_reason is end_turn or no tool use, we're done
      if (stop_reason === 'end_turn' || !hasToolUse) {
        break;
      }
    }

    if (iteration >= MAX_ITERATIONS) {
      sendSSE(res, 'agent_text', { text: '\n\n---\n*Agent reached maximum iteration limit. Please continue with a follow-up message if more analysis is needed.*' });
    }

    sendSSE(res, 'agent_done', { iterations: iteration });
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error('[Agent] Error:', err);
    sendSSE(res, 'agent_error', { message: err.message });
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

// ── Tool Result Summarizer (for compact UI cards) ──
// Uses the corrected field names from service response shapes
function summarizeToolResult(toolName, result) {
  switch (toolName) {
    case 'screen_entity': {
      const parts = [];
      if (result.sanctions?.isMatch) parts.push('SANCTIONS HIT');
      else if (result.sanctions?.matches > 0) parts.push(`${result.sanctions.matches} potential sanctions match(es)`);
      if (result.pep?.matches > 0) parts.push(`${result.pep.matches} PEP match(es)`);
      // Use relevantArticles count (only HIGH/MEDIUM relevance), not raw total
      if (result.adverseMedia?.relevantArticles > 0) parts.push(`${result.adverseMedia.relevantArticles} adverse media finding(s)`);
      else if (result.adverseMedia?.status === 'FINDINGS') parts.push('Adverse media findings');
      // Use summary counts from court records service
      if (result.courtRecords?.criminalCases > 0) parts.push(`${result.courtRecords.criminalCases} criminal case(s)`);
      else if (result.courtRecords?.totalCases > 0) parts.push(`${result.courtRecords.totalCases} court case(s)`);
      // Use risk level from regulatory service, not raw action count
      if (result.regulatory?.riskLevel === 'CRITICAL' || result.regulatory?.riskLevel === 'HIGH') {
        parts.push(`Regulatory risk: ${result.regulatory.riskLevel}`);
      } else if (result.regulatory?.totalActions > 0 && result.regulatory?.riskScore > 0) {
        parts.push(`${result.regulatory.flags?.length || 0} regulatory flag(s)`);
      }
      if (result.occrp?.matches > 0) parts.push(`${result.occrp.matches} OCCRP match(es)`);
      return parts.length > 0 ? parts.join(' · ') : 'No significant findings';
    }
    case 'search_sanctions': {
      const parts = [];
      if (result.sanctions?.isMatch) parts.push('SANCTIONS MATCH');
      if (result.pep?.pepMatches?.length > 0 || result.pep?.matches?.length > 0) parts.push('PEP match found');
      return parts.length > 0 ? parts.join(' · ') : 'No sanctions/PEP matches';
    }
    case 'search_adverse_media': {
      // adverseMedia.screen() returns { adverseMedia: { status }, ... }
      const status = result.adverseMedia?.status;
      const articles = result.adverseMedia?.articles || result.articles || [];
      const relevant = articles.filter(a => a.relevance === 'HIGH' || a.relevance === 'MEDIUM');
      if (status === 'FINDINGS' || relevant.length > 0) return `${relevant.length} relevant article(s) found`;
      return 'No adverse media found';
    }
    case 'search_corporate_records': {
      const parts = [];
      if (result.openCorporates?.companies?.length > 0) parts.push(`${result.openCorporates.companies.length} company record(s)`);
      if (result.occrp?.results?.length > 0) parts.push(`${result.occrp.results.length} OCCRP match(es)`);
      return parts.length > 0 ? parts.join(' · ') : 'No corporate records found';
    }
    case 'search_court_records': {
      // courtRecords.screenEntity() returns { summary: { totalCases, criminalCases, ... }, cases: [...] }
      const total = result.summary?.totalCases || result.cases?.length || 0;
      const criminal = result.summary?.criminalCases || 0;
      if (criminal > 0) return `${total} case(s) found (${criminal} criminal)`;
      return total > 0 ? `${total} court case(s) found` : 'No court records found';
    }
    case 'knowledge_base_search': {
      return result.results?.length > 0 ? `${result.results.length} regulatory document(s) found` : 'No knowledge base matches';
    }
    case 'search_entity_investigations': {
      if (result.error) return `Error: ${result.error}`;
      const total = result.totalMatches || 0;
      const invs = result.investigations || [];
      if (total === 0) return 'No matches in entity investigation database';
      const sanctioned = (result.entities || []).filter(e => e.sanctioned === 'true').length;
      const parts = [`${total} entity/ies found`];
      if (sanctioned > 0) parts.push(`${sanctioned} sanctioned`);
      if (invs.length > 0) parts.push(invs.join(', '));
      return parts.join(' · ');
    }
    case 'trace_ownership': {
      if (result.error) return `Error: ${result.error}`;
      const parts = [];
      if (result.subject?.sanctionStatus === 'MATCH') parts.push('SANCTIONED');
      if (result.fiftyPercentRuleTriggered) parts.push('50% RULE TRIGGERED');
      else if (result.aggregateBlockedOwnership > 0) parts.push(`${result.aggregateBlockedOwnership.toFixed(1)}% sanctioned ownership`);
      if (result.beneficialOwners?.length > 0) parts.push(`${result.beneficialOwners.length} beneficial owner(s)`);
      if (result.ownedCompanies?.length > 0) parts.push(`${result.ownedCompanies.length} owned company/ies`);
      if (result.riskLevel) parts.push(`Risk: ${result.riskLevel}`);
      return parts.length > 0 ? parts.join(' · ') : 'No ownership data found';
    }
    case 'find_precedents': {
      if (result.error) return `Error: ${result.error}`;
      const parts = [];
      const pr = result.precedent_risk;
      if (pr?.level) parts.push(`Precedent risk: ${pr.level} (${pr.score}/100)`);
      const stats = result.screening_precedents?.statistics;
      if (stats?.total_similar > 0) parts.push(`${stats.total_similar} similar entities`);
      if (stats?.later_sanctioned_count > 0) parts.push(`${stats.later_sanctioned_count} later sanctioned`);
      if (result.enforcement_precedents?.length > 0) parts.push(`${result.enforcement_precedents.length} enforcement match(es)`);
      return parts.length > 0 ? parts.join(' · ') : 'No precedent matches';
    }
    case 'get_related_entities': {
      if (result.error) return `Error: ${result.error}`;
      const parts = [];
      if (result.variants?.length > 0) parts.push(`${result.variants.length} known variant(s)`);
      if (result.related_entities?.length > 0) parts.push(`${result.related_entities.length} related entity/ies`);
      const highRisk = (result.related_entities || []).filter(e => e.risk_level === 'HIGH' || e.risk_level === 'CRITICAL');
      if (highRisk.length > 0) parts.push(`${highRisk.length} high-risk connection(s)`);
      return parts.length > 0 ? parts.join(' · ') : 'No entity graph data';
    }
    case 'save_discovered_entities': {
      if (result.error) return `Error: ${result.error}`;
      return `${result.saved} entities saved to knowledge base (${result.investigation})`;
    }
    default:
      return 'Completed';
  }
}
