// Vercel Serverless Function — Unified Screening Pipeline
// POST /api/screening/unified
// Runs ALL screening layers + Claude AI analysis in a single serverless invocation.
// This avoids cold-starting 13+ separate functions.

import { OFACScreeningService } from '../../services/ofacScreening.js';
import { SanctionsAnnouncementService } from '../../services/sanctionsAnnouncements.js';
import { WebIntelligenceService } from '../../services/webIntelligence.js';
import { WalletScreeningService } from '../../services/walletScreening.js';
import { PEPScreeningService } from '../../services/pepScreening.js';
import { RegulatoryEnforcementService } from '../../services/regulatoryEnforcement.js';
import { AdverseMediaService } from '../../services/adverseMedia.js';
import { CourtRecordsService } from '../../services/courtRecords.js';
import { OCCRPAlephService } from '../../services/occrpAleph.js';
import { OpenCorporatesService } from '../../services/openCorporates.js';
import { BlockchainScreeningService } from '../../services/blockchainScreening.js';
import { ShippingTradeService } from '../../services/shippingTrade.js';
import { SANCTIONED_INDIVIDUALS, SANCTIONED_ENTITIES, screenEntity as screenSanctionsEntity } from '../screen-sanctions.js';
import { Pinecone } from '@pinecone-database/pinecone';

export const config = { maxDuration: 300 };

// ── Pinecone Knowledge Base (RAG) ──
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

const KNOWLEDGE_BASE_TOOL = {
  name: 'knowledge_base_search',
  description: 'Search Katharos curated knowledge base of regulatory documents from OFAC, FinCEN, DOJ, SEC, FBI, FTC, CFTC, FINRA, HHS-OIG, OCC, IRS, Secret Service, CFPB, FATF, OECD, UNODC, BIS (EAR), DDTC (ITAR), NRC, DOE, Wassenaar, NSG, MTCR, and Australia Group. Use for established guidance, frameworks, typologies, red flags, enforcement patterns, export control classifications, statutory references, and compliance obligations relevant to the screening.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query — describe the regulatory guidance, typology, enforcement pattern, or export control classification you want to find'
      }
    },
    required: ['query']
  }
};

const WEB_SEARCH_TOOL = { type: 'web_search_20250305', name: 'web_search' };

async function executeKnowledgeBaseSearch(query) {
  if (!process.env.PINECONE_API_KEY) return { results: [], error: 'Pinecone not configured' };
  try {
    const queryVector = await embedQuery(query);
    const idx = getPineconeIndex();
    const result = await idx.namespace('regulatory_docs').query({
      vector: queryVector,
      topK: 5,
      includeMetadata: true
    });
    return {
      results: (result.matches || [])
        .filter(m => m.score >= 0.65)
        .map(m => ({
          title: m.metadata.source || m.id,
          category: m.metadata.category || '',
          subcategory: m.metadata.subcategory || '',
          documentType: m.metadata.documentType || '',
          url: m.metadata.url || '',
          relevance: m.score,
          excerpt: m.metadata.text || ''
        }))
    };
  } catch (err) {
    console.error('[KnowledgeBase] Search error:', err.message);
    return { results: [], error: err.message };
  }
}

// ── Inline DataSourceManager (ICIJ, SEC, World Bank) to avoid extra cold start ──
class DataSourceManager {
  constructor() {
    this.courtListenerKey = process.env.COURTLISTENER_API_KEY || process.env.COURTLISTENER_KEY || null;
  }
  async screenEntity(name, type = 'INDIVIDUAL') {
    const promises = [
      this.searchOffshoreLeaks(name).catch(e => ({ source: 'icij', data: null, error: e.message })),
      this.searchSEC(name).catch(e => ({ source: 'sec', data: null, error: e.message })),
      this.searchWorldBankDebarred(name).catch(e => ({ source: 'worldBank', data: null, error: e.message })),
    ];
    if (this.courtListenerKey) {
      promises.push(this.searchCourtListener(name).catch(e => ({ source: 'courtListener', data: null, error: e.message })));
    }
    const results = await Promise.all(promises);
    const output = { subject: name, type, screeningDate: new Date().toISOString(), sources: {}, riskScore: 0, riskFactors: [] };
    for (const r of results) { output.sources[r.source] = { data: r.data, error: r.error || null, matchCount: r.data?.matches?.length || r.data?.results?.length || 0 }; }
    const risk = this.calculateRiskScore(output.sources);
    output.riskScore = risk.score;
    output.riskFactors = risk.factors;
    return output;
  }
  async searchOffshoreLeaks(query) {
    const response = await fetch(`https://offshoreleaks.icij.org/api/v1/search?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`ICIJ API error: ${response.status}`);
    const data = await response.json();
    const matches = [];
    for (const category of ['entities', 'officers', 'intermediaries', 'addresses']) {
      if (data[category]) { for (const item of data[category]) { matches.push({ type: category.replace(/s$/, ''), name: item.name || item.entity || '', jurisdiction: item.jurisdiction || item.country || '', sourceDataset: item.source || item.dataset || '', linkedTo: item.linked_to || item.intermediary || '', nodeId: item.node_id || item.id || '' }); } }
    }
    const seen = new Set();
    const deduped = matches.filter(m => { const k = `${m.name}|${m.type}`; if (seen.has(k)) return false; seen.add(k); return true; });
    return { source: 'icij', data: { matches: deduped.slice(0, 20), totalResults: matches.length, datasetsFound: [...new Set(matches.map(m => m.sourceDataset).filter(Boolean))] } };
  }
  async searchSEC(query) {
    const url = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(`"${query}"`)}&dateRange=custom&startdt=2019-01-01&enddt=2026-01-31&forms=10-K,10-Q,8-K,DEF+14A,13F-HR,SC+13D,SC+13G,4`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Katharos Compliance App support@marlowe.app' }, signal: AbortSignal.timeout(15000) });
    let filings = [], enforcement = [];
    if (response.ok) { const data = await response.json(); if (data.hits?.hits) { for (const hit of data.hits.hits.slice(0, 15)) { const s = hit._source || {}; filings.push({ form: s.form_type || '', filingDate: s.file_date || '', companyName: s.display_names?.[0] || '', cik: s.entity_id || '' }); } } }
    try {
      const enfUrl = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(`"${query}"`)}&dateRange=custom&startdt=2019-01-01&enddt=2026-01-31&forms=LR,AAER,AP`;
      const enfRes = await fetch(enfUrl, { headers: { 'User-Agent': 'Katharos Compliance App support@marlowe.app' }, signal: AbortSignal.timeout(10000) });
      if (enfRes.ok) { const d = await enfRes.json(); if (d.hits?.hits) { for (const h of d.hits.hits.slice(0, 10)) { const s = h._source || {}; enforcement.push({ type: s.form_type || 'Enforcement', date: s.file_date || '', description: s.display_names?.[0] || '' }); } } }
    } catch { /* non-critical */ }
    return { source: 'sec', data: { results: filings, enforcement, totalFilings: filings.length, hasEnforcement: enforcement.length > 0 } };
  }
  async searchWorldBankDebarred(query) {
    const response = await fetch('https://apigwext.worldbank.org/dvsvc/v1.0/json/APPLICATION/ADOBE_EXPRNC/FIRM_LIST', { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`World Bank API error: ${response.status}`);
    const data = await response.json();
    const q = query.toLowerCase();
    const matches = [];
    if (Array.isArray(data)) { for (const f of data) { const fn = (f.FIRM_NAME || '').toLowerCase(), in_ = (f.INDIVIDUAL_NAME || '').toLowerCase(); if (fn.includes(q) || in_.includes(q) || q.includes(fn) || q.includes(in_)) { matches.push({ firmName: f.FIRM_NAME || null, individualName: f.INDIVIDUAL_NAME || null, country: f.COUNTRY || '', sanctionType: f.SANCTION_TYPE || '', fromDate: f.FROM_DATE || '', toDate: f.TO_DATE || '', grounds: f.GROUNDS || '' }); } } }
    return { source: 'worldBank', data: { matches: matches.slice(0, 20), totalResults: matches.length } };
  }
  async searchCourtListener(query) {
    const response = await fetch(`https://www.courtlistener.com/api/rest/v3/search/?q=${encodeURIComponent(`"${query}"`)}&type=r&order_by=score+desc`, { headers: { 'Authorization': `Token ${this.courtListenerKey}` }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`CourtListener API error: ${response.status}`);
    const data = await response.json();
    const results = (data.results || []).slice(0, 15).map(r => ({ caseName: r.caseName || r.case_name || '', court: r.court || r.court_id || '', dateFiled: r.dateFiled || r.date_filed || '', docketNumber: r.docketNumber || r.docket_number || '', suitNature: r.suitNature || r.nature_of_suit || '', status: r.status || '' }));
    return { source: 'courtListener', data: { results, totalResults: data.count || results.length } };
  }
  calculateRiskScore(sources) {
    let score = 0; const factors = [];
    const icij = sources.icij?.data;
    if (icij?.matches?.length > 0) { score += 20; factors.push({ source: 'ICIJ Offshore Leaks', detail: `${icij.matches.length} match(es)`, points: 20 }); }
    const sec = sources.sec?.data;
    if (sec?.hasEnforcement) { score += 20; factors.push({ source: 'SEC', detail: `${sec.enforcement.length} enforcement action(s)`, points: 20 }); }
    const wb = sources.worldBank?.data;
    if (wb?.matches?.length > 0) { const active = wb.matches.filter(m => !m.toDate || new Date(m.toDate) > new Date()); if (active.length > 0) { score += 20; factors.push({ source: 'World Bank', detail: `${active.length} active debarment(s)`, points: 20 }); } }
    const cl = sources.courtListener?.data;
    if (cl?.results?.length > 0) { const crim = cl.results.filter(r => (r.suitNature || '').toLowerCase().includes('criminal')); if (crim.length > 0) { score += 25; factors.push({ source: 'Federal Courts', detail: `${crim.length} criminal case(s)`, points: 25 }); } }
    return { score: Math.min(score, 100), factors };
  }
}

// ── Inline ownership analysis ──
function analyzeOwnership(entityName, kycType) {
  const normalizedName = entityName.toUpperCase().trim();
  const individual = SANCTIONED_INDIVIDUALS[normalizedName];
  const ownedCompanies = [];

  if (individual?.ownership) {
    for (const [company, percentage] of Object.entries(individual.ownership)) {
      ownedCompanies.push({ company, ownershipPercent: typeof percentage === 'number' ? percentage : 0, ownershipType: typeof percentage === 'string' ? percentage : 'DIRECT', sanctionedOwner: true });
    }
  }
  for (const [entityN, entityData] of Object.entries(SANCTIONED_ENTITIES)) {
    if (entityData.beneficialOwners?.[normalizedName]) {
      ownedCompanies.push({ company: entityN, ownershipPercent: typeof entityData.beneficialOwners[normalizedName] === 'number' ? entityData.beneficialOwners[normalizedName] : 0, ownershipType: 'BENEFICIAL', sanctionedOwner: true });
    }
  }

  if (kycType === 'entity') {
    const entityScreening = screenSanctionsEntity(entityName, 'ENTITY');
    const knownEntity = SANCTIONED_ENTITIES[normalizedName];
    const beneficialOwners = [];
    let aggregateBlockedOwnership = 0;

    if (knownEntity?.beneficialOwners) {
      for (const [ownerName, percentage] of Object.entries(knownEntity.beneficialOwners)) {
        const ownerScreening = screenSanctionsEntity(ownerName, 'INDIVIDUAL');
        const isBlocked = ownerScreening.isMatch;
        const ownershipPercent = typeof percentage === 'number' ? percentage : 0;
        beneficialOwners.push({ name: ownerName, ownershipPercent, ownershipType: 'DIRECT', sanctionStatus: isBlocked ? 'SANCTIONED' : 'CLEAR', sanctionDetails: isBlocked ? { lists: ownerScreening.lists || [] } : null });
        if (isBlocked && ownershipPercent > 0) aggregateBlockedOwnership += ownershipPercent;
      }
    }

    return {
      beneficialOwners,
      corporateStructure: [],
      fiftyPercentRuleTriggered: aggregateBlockedOwnership >= 50,
      aggregateBlockedOwnership,
      riskLevel: aggregateBlockedOwnership >= 50 ? 'CRITICAL' : aggregateBlockedOwnership > 0 ? 'HIGH' : entityScreening.isMatch ? 'CRITICAL' : 'LOW',
      summary: aggregateBlockedOwnership >= 50 ? `${aggregateBlockedOwnership.toFixed(1)}% aggregate ownership by sanctioned persons detected` : 'No sanctioned beneficial ownership identified',
      ownedCompanies,
      totalCompanies: ownedCompanies.length,
      highRiskOwnership: ownedCompanies.filter(c => c.ownershipPercent >= 50).length
    };
  }

  return { ownedCompanies, totalCompanies: ownedCompanies.length, highRiskOwnership: ownedCompanies.filter(c => c.ownershipPercent >= 50).length, beneficialOwners: [], corporateStructure: [], fiftyPercentRuleTriggered: false, aggregateBlockedOwnership: 0, riskLevel: 'LOW', summary: 'No sanctioned beneficial ownership identified' };
}

let services = null;
function getServices() {
  if (!services) {
    services = {
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
      dataSources: new DataSourceManager(),
    };
  }
  return services;
}

const TIMEOUT = 15000;
function race(promise, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} timeout`)), TIMEOUT); })
  ]).then(v => { clearTimeout(timer); return v; }, e => { clearTimeout(timer); return { _error: e.message }; });
}

// Balanced-brace JSON extractor (handles nested objects and strings with braces)
function extractJsonObject(text) {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0, inString = false, escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return text.substring(start, i + 1); }
  }
  return null;
}

function isOk(r) { return r && !r._error; }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, type = 'individual', country, yearOfBirth } = req.body;
  if (!query) return res.status(400).json({ error: 'query is required' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const startTime = Date.now();
  const s = getServices();
  const kycType = type;
  const kycQuery = query.trim();
  const screeningType = kycType === 'individual' ? 'INDIVIDUAL' : kycType === 'entity' ? 'ENTITY' : 'WALLET';
  const isWallet = kycType === 'wallet';

  try {
    // ── Step 1-3: All data gathering in parallel (single function, no cold starts) ──
    const [
      ofacRes, ownershipRes,
      dataSourceRes, adverseMediaRes, courtRecordsRes,
      occrpRes, pepRes, regulatoryRes, openCorporatesRes,
      blockchainRes, shippingRes, webIntelRes, walletRes
    ] = await Promise.all([
      race(s.ofac.screenEntity({ name: isWallet ? undefined : kycQuery, type: screeningType, address: isWallet ? kycQuery : undefined }), 'ofac'),
      !isWallet ? Promise.resolve(analyzeOwnership(kycQuery, kycType)) : Promise.resolve({}),
      race(s.dataSources.screenEntity(kycQuery, screeningType), 'data-sources'),
      race(s.adverseMedia.screen(kycQuery, screeningType, country || null), 'adverse-media'),
      race(s.courtRecords.screenEntity({ name: kycQuery, type: kycType }), 'court-records'),
      race(s.occrp.screenEntity({ name: kycQuery, type: kycType }), 'occrp'),
      race(s.pep.screenEntity({ name: kycQuery, type: kycType, country: country || null }), 'pep'),
      race(s.regulatory.screenEntity({ name: kycQuery, type: screeningType }), 'regulatory'),
      race(s.openCorporates.screenEntity({ name: kycQuery }), 'opencorporates'),
      isWallet ? race(s.blockchain.screenAddress({ address: kycQuery }), 'blockchain') : Promise.resolve(null),
      kycType === 'entity' ? race(s.shipping.screenEntity({ name: kycQuery, type: 'entity' }), 'shipping') : Promise.resolve(null),
      race(s.webIntel.search(kycQuery), 'web-intelligence'),
      isWallet ? race(s.wallet.screenWallet(kycQuery), 'wallet-screening') : Promise.resolve(null),
    ]);

    // Parse OFAC results into sanctionsData
    let sanctionsData = { status: 'NO_MATCH', totalEntries: 0 };
    if (isOk(ofacRes)) {
      const liveOfac = ofacRes;
      const topMatch = liveOfac.matches?.[0];
      if (topMatch && topMatch.matchConfidence >= 0.95) {
        sanctionsData = {
          status: 'MATCH',
          match: {
            name: topMatch.name,
            listingDate: topMatch.dateOfBirth ? `DOB: ${topMatch.dateOfBirth}` : 'See remarks',
            lists: ['OFAC SDN'],
            programs: topMatch.programs || [],
            details: topMatch.remarks || `${topMatch.type} — ${(topMatch.programs || []).join(', ')}`,
            entities: [], ownership: null
          },
          totalEntries: liveOfac.totalSDNEntries, confidence: topMatch.matchConfidence
        };
      } else if (topMatch && topMatch.matchConfidence >= 0.80) {
        sanctionsData = {
          status: 'POTENTIAL_MATCH',
          potentialMatches: liveOfac.matches.filter(m => m.matchConfidence >= 0.80).map(m => ({
            name: m.name, lists: ['OFAC SDN'], confidence: m.matchConfidence, programs: m.programs || []
          })),
          totalEntries: liveOfac.totalSDNEntries
        };
      } else {
        sanctionsData = { status: 'NO_MATCH', totalEntries: liveOfac.totalSDNEntries || 0 };
      }
    }

    const ownershipNetwork = isOk(ownershipRes) ? ownershipRes : {};
    const ownershipData = kycType === 'entity' ? ownershipNetwork : null;
    const dataSourceResults = isOk(dataSourceRes) ? dataSourceRes : null;
    const adverseMediaResults = isOk(adverseMediaRes) ? adverseMediaRes : null;
    const courtRecordsResults = isOk(courtRecordsRes) ? courtRecordsRes : null;
    const ofacResults = isOk(ofacRes) ? ofacRes : null;
    const occrpResults = isOk(occrpRes) ? occrpRes : null;
    const pepResults = isOk(pepRes) ? pepRes : null;
    const regulatoryResults = isOk(regulatoryRes) ? regulatoryRes : null;
    const openCorporatesResults = isOk(openCorporatesRes) ? openCorporatesRes : null;
    const blockchainResults = isOk(blockchainRes) ? blockchainRes : null;
    const shippingResults = isOk(shippingRes) ? shippingRes : null;
    const walletResults = isOk(walletRes) ? walletRes : null;

    // If wallet screening found a BLOCKED result, upgrade sanctionsData
    if (walletResults && walletResults.status === 'BLOCKED') {
      sanctionsData = {
        status: 'MATCH',
        match: {
          name: walletResults.sdnEntry || kycQuery,
          listingDate: walletResults.matches?.[0]?.designationDate || 'See SDN entry',
          lists: ['OFAC SDN'],
          programs: [walletResults.program || 'See SDN entry'],
          details: `Wallet matched: ${walletResults.matchSource || 'OFAC sanctioned address'}`,
          entities: [], ownership: null
        },
        blockchain: walletResults.chain,
        totalEntries: walletResults.totalSanctionedAddresses || 0,
        confidence: 1.0
      };
    }

    // ── Step 4: Build context ──
    const webIntelResults = isOk(webIntelRes) ? webIntelRes : null;
    const realDataContext = buildDataContext({
      kycType, kycQuery, sanctionsData, ownershipData, ownershipNetwork,
      dataSourceResults, adverseMediaResults, courtRecordsResults, ofacResults,
      occrpResults, pepResults, regulatoryResults, openCorporatesResults,
      blockchainResults, shippingResults, webIntelResults, walletResults
    });

    const systemPrompt = getSystemPrompt();
    const tools = [
      WEB_SEARCH_TOOL,
      ...(process.env.PINECONE_API_KEY ? [KNOWLEDGE_BASE_TOOL] : [])
    ];
    const toolsHint = '\n\nYou have access to a web_search tool for live internet searches' +
      (process.env.PINECONE_API_KEY
        ? ' and a knowledge_base_search tool for curated regulatory guidance. Use web_search for current news, recent sanctions designations, adverse media, and entity-specific intelligence. Use knowledge_base_search for established regulatory frameworks, FinCEN advisories, OFAC guidance, DOJ enforcement patterns, fraud typologies, and compliance obligations. Search for specific topics like "FCPA bribery red flags", "pig butchering advisory", "TBML indicators", "elder financial exploitation", etc.'
        : '. Use it for current news, recent sanctions designations, adverse media, regulatory actions, and entity-specific intelligence during your analysis.');

    const userPrompt = isWallet
      ? `${realDataContext}\n\nScreen this crypto wallet address for sanctions compliance and risk: ${kycQuery} (${sanctionsData.blockchain || 'Unknown'} blockchain)\n\nUsing the sanctions screening data above, provide a complete compliance analysis including:\n- Who owns/controls this wallet (entity attribution)\n- OFAC sanctions status and specific designations\n- Association with mixers (Tornado Cash, Blender.io, Sinbad.io), darknet markets (Hydra), or ransomware operations\n- DPRK/Lazarus Group nexus if applicable\n- Transaction risk patterns (cross-chain laundering, structured transfers)\n- Adverse media about the associated entity\n- Regulatory guidance for financial institutions encountering this address\n- Whether to block transactions involving this wallet\n\nSet subject.type to "WALLET" and include the wallet address and blockchain.${toolsHint}`
      : `${realDataContext}\n\nBased on the REAL sanctions and ownership data above, complete the KYC screening for: ${kycQuery}${yearOfBirth ? ', Year of Birth: ' + yearOfBirth : ''}${country ? ', Country: ' + country : ''} (${kycType === 'individual' ? 'INDIVIDUAL' : 'ENTITY'})\n\nUse the verified sanctions data and external source results (ICIJ, SEC, World Bank, court records, adverse media) provided above. Add additional analysis for:\n- PEP (Politically Exposed Person) status\n- Adverse media findings (incorporate the real articles provided above with their source URLs)\n- Risk assessment incorporating ALL data sources\n- Regulatory guidance\n\n${kycType === 'entity' ? 'Include corporate structure with parent companies, subsidiaries, and affiliates.' : 'Include any corporate affiliations in corporateStructure.'}${toolsHint}`;

    // ── Step 5: Claude AI analysis with knowledge_base_search tool (multi-turn) ──
    let aiMessages = [{ role: 'user', content: userPrompt }];
    let text = '';

    for (let turn = 0; turn < 4; turn++) {
      const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        signal: AbortSignal.timeout(120000),
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 16000,
          system: systemPrompt,
          ...(tools.length > 0 ? { tools } : {}),
          messages: aiMessages
        })
      });

      if (!aiResponse.ok) {
        const err = await aiResponse.json().catch(() => ({}));
        throw new Error(`Anthropic API error: ${aiResponse.status} ${err.error?.message || ''}`);
      }

      const aiData = await aiResponse.json();

      // If Claude finished (end_turn or no tool use), extract text and break
      if (aiData.stop_reason !== 'tool_use') {
        text = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
        break;
      }

      // Handle tool_use blocks
      const toolUseBlocks = (aiData.content || []).filter(b => b.type === 'tool_use');
      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        if (toolUse.name === 'knowledge_base_search') {
          console.log(`[KnowledgeBase] Searching: "${toolUse.input.query}"`);
          const searchResult = await executeKnowledgeBaseSearch(toolUse.input.query);
          console.log(`[KnowledgeBase] Found ${searchResult.results?.length || 0} results`);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(searchResult)
          });
        } else {
          // Built-in tools (web_search) are handled server-side by Anthropic.
          // Return acknowledgment to prevent missing tool_result errors.
          console.log(`[Tools] Skipping server-handled tool: ${toolUse.name}`);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: 'Server-handled tool — results already included in response.'
          });
        }
      }

      // Append assistant response + tool results for next turn
      aiMessages.push({ role: 'assistant', content: aiData.content });
      aiMessages.push({ role: 'user', content: toolResults });
    }

    // ── Step 6: Parse result ──
    const jsonStr = extractJsonObject(text);
    if (!jsonStr) {
      return res.status(500).json({ error: 'No JSON in AI response', durationMs: Date.now() - startTime });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr.message, 'Raw text (first 500):', jsonStr.substring(0, 500));
      return res.status(500).json({ error: 'Failed to parse AI response as JSON', durationMs: Date.now() - startTime });
    }

    const isLowRisk = parsed.overallRisk === 'LOW' &&
      parsed.sanctions?.status === 'CLEAR' &&
      parsed.pep?.status === 'CLEAR' &&
      parsed.adverseMedia?.status === 'CLEAR';

    const finalResult = isLowRisk ? { ...parsed, noRisksIdentified: true } : parsed;

    if (ownershipNetwork.ownedCompanies) {
      finalResult.ownedCompanies = ownershipNetwork.ownedCompanies;
      finalResult.totalCompanies = ownershipNetwork.totalCompanies;
      finalResult.highRiskOwnership = ownershipNetwork.highRiskOwnership;
    }
    if (ownershipNetwork.corporateStructure) {
      if (!finalResult.ownershipAnalysis) finalResult.ownershipAnalysis = {};
      finalResult.ownershipAnalysis.corporateStructure = ownershipNetwork.corporateStructure;
    }
    if (dataSourceResults) {
      finalResult.externalSources = dataSourceResults.sources;
      finalResult.externalRiskScore = dataSourceResults.riskScore;
      finalResult.externalRiskFactors = dataSourceResults.riskFactors;
    }
    if (adverseMediaResults) finalResult.adverseMediaRaw = adverseMediaResults;
    if (courtRecordsResults) finalResult.courtRecords = courtRecordsResults;

    finalResult._durationMs = Date.now() - startTime;
    return res.status(200).json(finalResult);

  } catch (error) {
    console.error('Unified screening error:', error);
    return res.status(500).json({ error: error.message, durationMs: Date.now() - startTime });
  }
}

// ── Context builder (mirrors frontend logic exactly) ──
function buildDataContext(d) {
  const { kycType, kycQuery, sanctionsData, ownershipData, ownershipNetwork,
    dataSourceResults, adverseMediaResults, courtRecordsResults, ofacResults,
    occrpResults, pepResults, regulatoryResults, openCorporatesResults,
    blockchainResults, shippingResults, webIntelResults, walletResults } = d;

  let ctx = '';

  if (kycType === 'wallet') {
    ctx += `CRYPTO WALLET SANCTIONS SCREENING RESULTS:\nWallet Address: ${kycQuery}\nBlockchain: ${sanctionsData.blockchain || 'Unknown'}\n`;
    if (sanctionsData.status === 'MATCH') {
      ctx += `🚨 DIRECT OFAC SANCTIONS MATCH\n- Listed Date: ${sanctionsData.match.listingDate}\n- Lists: ${sanctionsData.match.lists.join(', ')}\n- Programs: ${sanctionsData.match.programs.join(', ')}\n- Details: ${sanctionsData.match.details}\n`;
    } else {
      ctx += '✓ NO DIRECT SANCTIONS MATCH FOUND - wallet not on OFAC SDN list\n';
    }
  } else {
    ctx += 'REAL SANCTIONS SCREENING RESULTS:\n';
    if (sanctionsData.status === 'MATCH') {
      ctx += `🚨🚨🚨 CONFIRMED OFAC SDN LIST MATCH — SANCTIONED INDIVIDUAL 🚨🚨🚨\nCRITICAL: This is a REAL, CONFIRMED match from the LIVE U.S. Treasury OFAC SDN list.\nThe risk score MUST be 100 (BLOCKED) and overallRisk MUST be "CRITICAL".\nThe sanctions.status MUST be "MATCH".\n- Matched Name: ${sanctionsData.match.name}\n- Listing Date: ${sanctionsData.match.listingDate}\n- Lists: ${sanctionsData.match.lists.join(', ')}\n- Programs: ${sanctionsData.match.programs.join(', ')}\n- Details: ${sanctionsData.match.details}\n${sanctionsData.match.entities?.length ? `- Associated Entities: ${sanctionsData.match.entities.join(', ')}\n` : ''}THIS PERSON IS ON THE OFAC SDN LIST. ALL TRANSACTIONS ARE PROHIBITED. AUTOMATIC BLOCK REQUIRED.\n`;
    } else if (sanctionsData.status === 'POTENTIAL_MATCH') {
      ctx += `⚠ POTENTIAL MATCHES FOUND:\n${sanctionsData.potentialMatches.map(m => `- ${m.name} (${m.lists.join(', ')})`).join('\n')}\n`;
    } else {
      ctx += `✓ NO SANCTIONS MATCH on OFAC SDN List (${sanctionsData.totalEntries || 0} entries checked)\n`;
    }
  }

  if (ownershipData) {
    ctx += `\nREAL BENEFICIAL OWNERSHIP ANALYSIS:\n- OFAC 50% Rule Triggered: ${ownershipData.fiftyPercentRuleTriggered ? 'YES - ENTITY IS BLOCKED' : 'NO'}\n- Aggregate Blocked Ownership: ${ownershipData.aggregateBlockedOwnership}%\n- Risk Level: ${ownershipData.riskLevel}\n- Summary: ${ownershipData.summary}\n`;
    if (ownershipData.beneficialOwners?.length > 0) {
      ctx += `\nBeneficial Owners:\n${ownershipData.beneficialOwners.map(o => `- ${o.name}: ${o.ownershipPercent}% (${o.ownershipType}) - ${o.sanctionStatus}${o.sanctionDetails ? ` [${o.sanctionDetails.lists.join(', ')}]` : ''}`).join('\n')}\n`;
    }
  }

  if (ownershipNetwork?.ownedCompanies?.length > 0) {
    ctx += `\nOWNERSHIP PORTFOLIO (Companies Owned by ${kycQuery}):\nTotal Companies: ${ownershipNetwork.totalCompanies}\nHigh-Risk Ownership (≥50%): ${ownershipNetwork.highRiskOwnership}\n\nCompanies:\n${ownershipNetwork.ownedCompanies.map(c => `- ${c.company}: ${c.ownershipPercent}% (${c.ownershipType})${c.sanctionedOwner ? ' [SANCTIONED OWNER]' : ''}`).join('\n')}\n`;
  }

  if (ownershipNetwork?.corporateStructure?.length > 0) {
    ctx += `\nCORPORATE NETWORK (Related Entities):\n${ownershipNetwork.corporateStructure.map(s => `- ${s.entity} (${s.relationship}) - Common Owner: ${s.commonOwner} (${s.ownershipPercent}%) - Sanction Exposure: ${s.sanctionExposure}`).join('\n')}\n`;
  }

  if (dataSourceResults) {
    ctx += `\nEXTERNAL DATA SOURCE SCREENING RESULTS:\nRisk Score: ${dataSourceResults.riskScore}/100\n`;
    if (dataSourceResults.riskFactors?.length > 0) {
      ctx += `Risk Factors:\n${dataSourceResults.riskFactors.map(f => `- ${f.source}: ${f.detail} (+${f.points} points)`).join('\n')}\n`;
    }
    if (dataSourceResults.sources?.icij?.data?.matches?.length > 0) {
      ctx += `\nICIJ OFFSHORE LEAKS:\n${dataSourceResults.sources.icij.data.matches.slice(0, 10).map(m => `- ${m.type}: ${m.name} (${m.jurisdiction || 'Unknown'}) — Dataset: ${m.sourceDataset || 'Unknown'}${m.linkedTo ? ', Linked to: ' + m.linkedTo : ''}`).join('\n')}\n`;
    }
    if (dataSourceResults.sources?.sec?.data) {
      ctx += `\nSEC EDGAR:\n${dataSourceResults.sources.sec.data.results?.length > 0 ? dataSourceResults.sources.sec.data.results.slice(0, 5).map(f => `- ${f.form} filed ${f.filingDate} by ${f.companyName}`).join('\n') : 'No SEC filings found.'}\n`;
      if (dataSourceResults.sources.sec.data.hasEnforcement) {
        ctx += `⚠️ SEC ENFORCEMENT ACTIONS:\n${dataSourceResults.sources.sec.data.enforcement.map(e => `- ${e.type} (${e.date}): ${e.description}`).join('\n')}\n`;
      }
    }
    if (dataSourceResults.sources?.worldBank?.data?.matches?.length > 0) {
      ctx += `\nWORLD BANK DEBARMENT:\n${dataSourceResults.sources.worldBank.data.matches.slice(0, 5).map(m => `- ${m.firmName || m.individualName} (${m.country}) — ${m.sanctionType}`).join('\n')}\n`;
    }
    if (dataSourceResults.sources?.courtListener?.data?.results?.length > 0) {
      ctx += `\nFEDERAL COURT RECORDS:\n${dataSourceResults.sources.courtListener.data.results.slice(0, 5).map(r => `- ${r.caseName} (${r.court}) — Filed: ${r.dateFiled}`).join('\n')}\n`;
    }
  }

  if (adverseMediaResults) {
    ctx += `\nADVERSE MEDIA SCREENING RESULTS:\nRisk Score: ${adverseMediaResults.riskScore || 0}/100\nTotal Articles Found: ${adverseMediaResults.totalArticles || 0}\n`;
    if (adverseMediaResults.articles?.length > 0) {
      ctx += `Articles:\n${adverseMediaResults.articles.slice(0, 10).map(a => `- [${a.category || 'GENERAL'}] "${a.title}" (${a.source}, ${a.date || 'undated'}) — Relevance: ${a.relevance || 'UNKNOWN'}${a.url ? ' — Source: ' + a.url : ''}`).join('\n')}\n`;
    }
  }

  if (courtRecordsResults?.cases?.length > 0) {
    ctx += `\nFEDERAL COURT RECORDS (CourtListener):\nTotal Cases: ${courtRecordsResults.summary?.totalCases || 0}\nAs Defendant: ${courtRecordsResults.summary?.asDefendant || 0}\nCriminal Cases: ${courtRecordsResults.summary?.criminalCases || 0}\nCourt Records Risk Score: ${courtRecordsResults.summary?.riskScore || 0}/100\n`;
    if (courtRecordsResults.riskFlags?.length > 0) {
      ctx += `Risk Flags:\n${courtRecordsResults.riskFlags.map(f => `- [${f.severity}] ${f.type}: ${f.message}`).join('\n')}\n`;
    }
    ctx += `Cases:\n${courtRecordsResults.cases.slice(0, 10).map(c => `- [${c.riskSeverity?.toUpperCase()}] ${c.caseName} (${c.court})\n  Case #: ${c.caseNumber} | Type: ${c.caseType} | Role: ${c.partyRole}\n  Filed: ${c.dateFiled || 'Unknown'} | Status: ${c.status}${c.url ? '\n  URL: ' + c.url : ''}`).join('\n')}\n`;
  }

  if (ofacResults) {
    const highConfidenceMatches = (ofacResults.matches || []).filter(m => m.matchConfidence >= 0.95);
    ctx += `\nOFAC SDN LIST (LIVE):\nTotal SDN Entries Checked: ${ofacResults.totalSDNEntries || 0}\nMatches Found: ${highConfidenceMatches.length}\n`;
    if (highConfidenceMatches.length > 0) {
      ctx += `Top Matches:\n${highConfidenceMatches.slice(0, 5).map(m => `- ${m.name} (${m.type}) — Confidence: ${(m.matchConfidence * 100).toFixed(0)}%, Programs: ${(m.programs || []).join(', ')}`).join('\n')}\n`;
    } else {
      ctx += `No high-confidence matches found (threshold: 95%).\n`;
    }
  }

  if (occrpResults) {
    ctx += `\nOCCRP ALEPH INVESTIGATIVE DATA:\nTotal Results: ${occrpResults.summary?.totalResults || 0}\nRisk Score: ${occrpResults.summary?.riskScore || 0}/100\n`;
    if (occrpResults.entities?.length > 0) {
      ctx += `Top Entity Matches:\n${occrpResults.entities.slice(0, 5).map(e => `- ${e.name} (${e.type}) — Confidence: ${(e.matchConfidence * 100).toFixed(0)}%, URL: ${e.url}`).join('\n')}\n`;
    }
  }

  if (pepResults) {
    ctx += `\nPEP (POLITICALLY EXPOSED PERSON) SCREENING:\nIs PEP: ${pepResults.isPEP ? 'YES' : 'NO'}\nPEP Level: ${pepResults.pepLevel || 'NOT_PEP'}\nRisk Level: ${pepResults.riskAssessment?.level || 'LOW'} (Score: ${pepResults.riskAssessment?.score || 0}/100)\n`;
    if (pepResults.matches?.length > 0) {
      ctx += `PEP Matches:\n${pepResults.matches.slice(0, 10).map(m => `- ${m.name}${m.pepPosition ? ' — Position: ' + m.pepPosition : ''}${m.country?.length ? ' — Country: ' + m.country.join(', ') : ''}${m.sanctions?.length ? ' — SANCTIONS: ' + m.sanctions.join(', ') : ''} (Source: ${m.source})${m.url ? ' URL: ' + m.url : ''}`).join('\n')}\n`;
    }
  }

  if (regulatoryResults) {
    ctx += `\nREGULATORY ENFORCEMENT SCREENING:\nTotal Actions Found: ${regulatoryResults.totalActions || 0}\nRisk Level: ${regulatoryResults.riskAssessment?.level || 'LOW'} (Score: ${regulatoryResults.riskAssessment?.score || 0}/100)\n`;
    if (regulatoryResults.actions?.length > 0) {
      ctx += `Enforcement Actions:\n${regulatoryResults.actions.slice(0, 10).map(a => `- [${a.agency}] ${a.title} (${a.date || 'undated'}) — Type: ${a.type}${a.url ? ' — URL: ' + a.url : ''}`).join('\n')}\n`;
    }
  }

  if (openCorporatesResults) {
    ctx += `\nOPENCORPORATES GLOBAL CORPORATE REGISTRY:\nCompanies Found: ${openCorporatesResults.totalCompanies || 0}\nOfficer Positions: ${openCorporatesResults.totalOfficers || 0}\nRisk Level: ${openCorporatesResults.riskAssessment?.level || 'LOW'}\n`;
    if (openCorporatesResults.companies?.length > 0) {
      ctx += `Companies:\n${openCorporatesResults.companies.slice(0, 10).map(c => `- ${c.name} (#${c.companyNumber}) — ${c.jurisdictionCode}, Status: ${c.status || 'Unknown'}`).join('\n')}\n`;
    }
  }

  if (blockchainResults) {
    ctx += `\nBLOCKCHAIN ADDRESS SCREENING:\nRisk Level: ${blockchainResults.riskAssessment?.level || 'LOW'} (Score: ${blockchainResults.riskAssessment?.score || 0}/100)\nTotal Transactions: ${blockchainResults.addressInfo?.totalTxCount || 0}\n`;
  }

  if (shippingResults) {
    ctx += `\nSHIPPING & TRADE SCREENING:\nRisk Level: ${shippingResults.riskAssessment?.level || 'LOW'} (Score: ${shippingResults.riskAssessment?.score || 0}/100)\n`;
    if (shippingResults.findings?.vessels?.length > 0) {
      ctx += `Vessels:\n${shippingResults.findings.vessels.slice(0, 5).map(v => `- ${v.name} (IMO: ${v.imo || 'N/A'}) — Flag: ${v.flag || 'Unknown'}`).join('\n')}\n`;
    }
  }

  if (walletResults) {
    ctx += `\nWALLET SANCTIONS SCREENING (OFAC ADDRESS LISTS):\nStatus: ${walletResults.status}\nChain: ${walletResults.chain || 'Unknown'}\nRisk Score: ${walletResults.riskScore || 0}/100\n`;
    if (walletResults.matches?.length > 0) {
      ctx += `Matches:\n${walletResults.matches.map(m => `- ${m.source}: ${m.service || m.entity || 'OFAC listed'} (${m.chain}, confidence: ${m.confidence})`).join('\n')}\n`;
    }
    if (walletResults.status === 'BLOCKED') {
      ctx += `ACTION: ${walletResults.action}\n`;
    }
  }

  if (webIntelResults) {
    ctx += `\nWEB INTELLIGENCE (LIVE SEARCH):\nFound: ${webIntelResults.found ? 'YES' : 'NO'}\nSanctioned: ${webIntelResults.sanctioned ? 'YES' : 'NO'}\nCriminal Activity: ${webIntelResults.criminalActivity ? 'YES' : 'NO'}\nConfidence: ${webIntelResults.confidence || 'low'}\nAuthority: ${webIntelResults.authority || 'None'}\nSummary: ${webIntelResults.summary || 'No findings'}\n`;
    if (webIntelResults.sources?.length > 0) {
      ctx += `Sources:\n${webIntelResults.sources.slice(0, 10).map(s => `- ${s.title}${s.url ? ' — ' + s.url : ''}`).join('\n')}\n`;
    }
  }

  return ctx;
}

// ── System prompt (kept server-side to reduce payload) ──
function getSystemPrompt() {
  return `You are Katharos, the world's most advanced AI-powered financial crimes investigation platform. You combine deep regulatory expertise with comprehensive data access to deliver institutional-grade due diligence that surpasses traditional screening tools.

You are not a chatbot. You are a senior financial crimes investigator with:
- Deep expertise in OFAC sanctions, AML regulations, anti-corruption laws, and global compliance frameworks
- Access to real-time sanctions lists, corporate registries, court records, adverse media, and leaked databases
- The analytical capabilities of a Big 4 forensic team combined with the speed of automated screening
- The judgment to distinguish true risks from false positives

Your users are compliance officers, investigators, lawyers, and risk professionals who need accurate, actionable intelligence — not generic summaries.

## INVESTIGATION METHODOLOGY

When screening any entity, you conduct a systematic multi-layer investigation:

LAYER 1 — IDENTIFICATION & DISAMBIGUATION:
Establish exactly who you're investigating. Full legal name, aliases, DOB/incorporation date, nationality/jurisdiction, unique identifiers, known associates. Disambiguate aggressively — "John Smith" in sanctions results may not be the subject.

LAYER 2 — SANCTIONS & WATCHLIST SCREENING:
Check against ALL major sanctions and watchlist sources:
- OFAC SDN List, Consolidated Sanctions List, Sectoral Sanctions (SSI), OFAC Penalties
- OFAC 50% Rule analysis (entities owned 50%+ by sanctioned persons)
- UN Security Council, EU Consolidated List, UK OFSI, Canada SEMA, Australia DFAT, Switzerland SECO
- World Bank Debarment List, Interpol, FBI Most Wanted, FinCEN 311 Special Measures
- OpenSanctions aggregated PEP and sanctions data

SANCTIONED RUSSIAN BANKS (ALL SDN-listed): Sberbank, VTB, Gazprombank, Alfa-Bank, Bank Rossiya, Promsvyazbank, VEB.RF, Sovcombank, Novikombank, Otkritie, Rosselkhozbank, Moscow Credit Bank, Transkapitalbank, Tinkoff Bank (restricted)

SANCTIONED SECTORS: Russian SOEs (Rosneft, Gazprom, Rostec, Transneft, Sovcomflot), Iranian IRGC-linked entities, DPRK (comprehensive blocking), Venezuelan PDVSA, Chinese military-linked (Entity List, NDAA 1260H), Belarus state enterprises

LAYER 3 — PEP & GOVERNMENT CONNECTIONS
LAYER 4 — CORPORATE STRUCTURE & BENEFICIAL OWNERSHIP
LAYER 5 — LITIGATION & REGULATORY ACTIONS
LAYER 6 — ADVERSE MEDIA SCREENING
LAYER 7 — CRYPTOCURRENCY & BLOCKCHAIN ANALYSIS
LAYER 7b — SHIPPING & TRADE ANALYSIS
LAYER 8 — NETWORK ANALYSIS

## RISK SCORING FRAMEWORK

| Factor | Max Points | Severity |
|--------|-----------|----------|
| OFAC SDN Match | 100 (automatic block) | CRITICAL |
| Other primary sanctions match | 80 | CRITICAL |
| Criminal conviction | 60 | CRITICAL |
| Criminal charges pending | 50 | HIGH |
| Secondary sanctions exposure | 45 | HIGH |
| PEP status (current) | 40 | HIGH |
| SEC/DOJ enforcement action | 40 | HIGH |
| Sanctioned counterparty transactions | 35 | HIGH |
| Mixer/tumbler crypto interactions | 35 | HIGH |
| Offshore leaks database match | 30 | MEDIUM |
| Civil litigation as defendant | 25 | MEDIUM |
| Adverse media (critical severity) | 25 | MEDIUM |
| World Bank debarment | 25 | MEDIUM |
| High-risk jurisdiction | 20 | MEDIUM |
| PEP status (former) | 20 | MEDIUM |
| Complex ownership structure | 15 | MEDIUM |
| Adverse media (high severity) | 15 | MEDIUM |
| New entity (<2 years) | 10 | LOW |

Risk Levels: 0-25 LOW, 26-50 MEDIUM, 51-75 HIGH, 76-99 CRITICAL, 100 BLOCKED (prohibited party).

## HIGH-RISK INDUSTRIES FOR MONEY LAUNDERING

When analyzing an entity, check their occupation, business type, and source of funds against this list. If matched, add the risk score points and explain why the industry is high-risk.

| Industry | Risk Score | Key Risk Factors |
|----------|-----------|------------------|
| Arms and Defense | +25 | Government corruption, export controls, sanctioned end-users |
| Art and Antiquities | +20 | No price transparency, subjective valuations, anonymous buyers, freeport storage |
| Gambling and Casinos | +20 | Cash in/out, chips as currency, minimal ID requirements |
| Cryptocurrency/Virtual Assets | +20 | Pseudonymous, cross-border, mixers, DeFi |
| Money Services Businesses | +20 | Cash transmission, hawala, remittances outside banking |
| Real Estate | +15 | High-value assets, cash purchases, shell company buyers |
| Precious Metals/Jewelry | +15 | Portable, high-value, subjective pricing |
| Cash-Intensive Businesses | +15 | Easy to commingle illicit funds (restaurants, nightclubs, car washes, casinos, ATMs, laundromats) |
| High-Value Goods | +15 | Luxury cars, yachts, aircraft, watches - portable value |
| Trade and Commodities | +15 | Trade misinvoicing, commodity price manipulation |
| Legal/Professional Services | +10 | Trust/company formation, client account pooling, nominee services |
| Private Banking/Wealth Management | +10 | Complex structures, secrecy culture, PEP clients |
| Construction/Infrastructure | +10 | Large cash flows, subcontractor chains, government contracts |
| Nonprofit/Charity | +10 | Donor anonymity, cross-border transfers, limited oversight |

INDUSTRY SCREENING INSTRUCTIONS:
1. Match occupation/business description against categories above
2. Add risk score points when matched
3. Include in report: "HIGH-RISK INDUSTRY: [Category]. [Reason for AML risk]. Enhanced due diligence recommended."
4. Example: Art dealer → "HIGH-RISK INDUSTRY: Art and Antiquities. FinCEN and FATF identify art market as high-risk due to lack of price transparency, subjective valuations, and minimal regulation."

## INVESTIGATION REASONING FRAMEWORK

For every screening, follow these 8 analytical steps. Reflect your reasoning in the JSON output fields (riskFactors, adverseMedia, sanctions.matches, recommendations, etc.).

STEP 1 — IDENTIFY: Establish the subject precisely. Full legal name, aliases, transliterations, DOB, nationality, unique identifiers. If ambiguous, list all possible matches.
STEP 2 — CONTEXTUALIZE: What is this person/entity's role, industry, jurisdiction? What risk factors are inherent to their profile?
STEP 3 — SEARCH: Document every source checked. A source checked with no hits narrows the risk picture — it's just as important as a hit.
STEP 4 — DISAMBIGUATE: For every potential match, compare name, DOB, nationality, associates. Assign match confidence percentage. Never assume a match without corroborating evidence.
STEP 5 — CONNECT: Map relationships — associates, family, business partners, co-directors. Follow ownership chains to natural persons. Identify patterns: shared addresses, shared registered agents, circular ownership.
STEP 6 — WEIGH: Assess each finding on SEVERITY (sanctions vs. minor media), RELIABILITY (government source vs. blog), RECENCY (2024 designation vs. 2005 resolved case). Distinguish confirmed facts from allegations.
STEP 7 — CONCLUDE: Synthesize into clear risk assessment. State what drives the score. Identify the single most important risk factor. State what would change your assessment.
STEP 8 — RECOMMEND: Specific, actionable recommendations. Not "conduct EDD" but "obtain certified beneficial ownership declaration, verify 2019 property sale proceeds." Include regulatory basis. Prioritize by urgency.

## RAG-ENHANCED REASONING

When using the knowledge_base_search tool, use retrieved context to REASON about findings:

TYPOLOGY MATCHING: After gathering findings, ask "What AML or fraud typology does this pattern match?" Reference specific typologies by name: "This pattern is consistent with SHELL COMPANY LAYERING: entity registered in BVI, no physical office, nominee directors, payments for undefined consulting services."

ENFORCEMENT CASE PATTERN MATCHING: When findings resemble known enforcement cases, reference them: "This pattern resembles the DANSKE BANK case: high-volume transfers through a branch in a high-risk jurisdiction with inadequate KYC" or "Similar to 1MDB: funds flowing through multiple shell companies across jurisdictions with no apparent business purpose."

CONNECTING THE DOTS: Cross-reference findings across sources — this is what makes Katharos valuable. "Entity cleared on OFAC SDN, but ICIJ Offshore Leaks shows they co-own a BVI company with [Person X] who IS on the SDN list with 55% ownership. Under the 50% rule, this BVI entity may be blocked property."

When typologies or enforcement patterns are detected, include them as riskFactor entries with the typology name, ML stage, risk score contribution, and specific indicators observed.

## DETAILED RISK SCORING

CRITICAL FACTORS (Automatic Escalation):
- Direct sanctions designation (OFAC SDN, EU, UN): Score 95-100, REJECT
- Criminal conviction (financial crime): Score 90+, REJECT or Senior Approval
- Active law enforcement investigation: Score 85+, ESCALATE
- Terrorist financing links: Score 100, REJECT

HIGH-WEIGHT FACTORS (+15 to +25 each):
- Current foreign PEP: +25 | Former PEP within 5 years: +18 | Former PEP 5+ years: +12
- FATF blacklist jurisdiction (DPRK, Iran, Myanmar): +22 | FATF greylist: +14
- Source of funds unverifiable/implausible: +20 | Sanctions evasion indicators: +20

MEDIUM-WEIGHT FACTORS (+8 to +15 each):
- PEP family/close associate: +12 | Offshore structure no clear purpose: +15
- Opacity jurisdiction (BVI, Seychelles, Panama): +12 | Complex multi-layered ownership: +12
- Cash-intensive business: +10 | High-risk industry: +10
- Adverse media credible/recent/serious: +10 per issue | Nominee directors/shareholders: +12

MITIGATING FACTORS (Reduce score):
- Regulated entity in good standing: -10 | Publicly traded: -8 | Transparent ownership to UBO: -8
- Long-established business 10+ years clean: -5 | Previously cleared with documented EDD: -10

COMBINATION MULTIPLIERS:
- PEP + high-risk jurisdiction: 1.3x | Offshore + unclear source of funds: 1.25x
- Multiple credible adverse media: 1.2x | Sanctions-adjacent + complex structure: 1.25x

Show the score breakdown. Never just give a number without explanation.

## AML TYPOLOGY DETECTION FRAMEWORK

Money laundering follows three stages: PLACEMENT (introducing illicit cash), LAYERING (obscuring the trail), INTEGRATION (reintroducing "clean" money). Evaluate entity/transaction against these typologies:

CAT 1 — STRUCTURING & CASH-BASED: Structuring/Smurfing [Placement, +40]: deposits $9K-$9,999, same depositor across branches. Cash-Intensive Business [Placement, +35]: revenue inconsistent with capacity. Cuckoo Smurfing [+45]: cash deposit matching expected wire.

CAT 2 — SHELL COMPANY & CORPORATE: Shell Company Layering [Layering, +45]: no office/employees, generic description, bearer/nominee shares, secrecy jurisdictions (BVI, Cayman, Panama, Seychelles). Layered Ownership [+40]: chain >3 layers, multiple jurisdictions, circular ownership. Shelf Company Abuse [+35]: dormant then suddenly active.

CAT 3 — TRADE-BASED ML (TBML): Over/Under-Invoicing [+40]: prices significantly above/below market. Phantom Shipments [+45]: payment without bill of lading. Multiple Invoicing [+40]. Black Market Peso Exchange [+50].

CAT 4 — REAL ESTATE: All-Cash Purchases [Integration, +40]: no mortgage, income doesn't support. Anonymous LLC/Trust [+35]: UBO not disclosed. Rapid Flipping [+35]: resold within 6 months. Loan-Back/Mortgage [+40].

CAT 5 — FINANCIAL INSTITUTION ABUSE: Correspondent Banking Abuse [+45]: nested accounts. Wire Stripping [+45]. Private Banking Abuse [+40]: PEP with unexplained wealth.

CAT 6 — MSB & INFORMAL VALUE TRANSFER: Unlicensed Money Transmission [+50]. Hawala/IVTS [+45]: high-risk corridors Middle East, South Asia, East Africa, SE Asia. MSB Nesting [+40].

CAT 7 — SECURITIES & INVESTMENT: Pump-and-Dump/Wash Trading [+45]. Mirror Trading [+45]. Insurance Product Abuse [+35].

CAT 8 — GAMING & GAMBLING: Casino Laundering [+40]: large cash buy-in minimal play. Online Gambling [+35].

CAT 9 — CRYPTOCURRENCY: Mixing/Tumbling [+50]: Tornado Cash, Blender.io, ChipMixer. Chain Hopping [+40]. Privacy Coins [+45]: Monero, Zcash. Peel Chain [+40]. Nested Exchange/OTC [+45]: Garantex, Suex, Bitzlato. Ransomware [+60]. Darknet [+55]. DeFi Abuse [+35]. NFT Laundering [+35].

CAT 10 — PROFESSIONAL ENABLERS: Lawyer/Notary [+40]: client funds through IOLTA, forms shells. Accountant [+35]: falsified financials. TCSP [+40]: many companies same address, nominee directors.

CAT 11 — CORRUPTION & PEP: Bribery/Kickbacks [+50]. Embezzlement [+45]. PEP Wealth Concealment [+45]: wealth inconsistent with salary. State Capture [+50].

CAT 12 — TAX EVASION: Offshore [+35]: unreported foreign accounts, transfer pricing abuse. Tax Refund Fraud [+35].

CAT 13 — TERRORISM FINANCING: NPO/Charity Abuse [+50]. Self-Funding [+40]. Hawala for Terrorism [+50].

CAT 14 — HUMAN TRAFFICKING: Trafficking Proceeds [+50]: cash from massage parlors/nail salons. Migrant Smuggling [+45].

CAT 15 — DRUG TRAFFICKING: Drug Proceeds [+50]: structured deposits, cash vehicle/property purchases, wires to source countries.

CAT 16 — SANCTIONS EVASION: Front Companies [+55]: formed after designation, same address. Ship-to-Ship Transfers [+50]: AIS transponder off. False Documentation [+50]. Aliases/Name Changes [+45].

Only flag typologies when specific indicators from the data match. Do not speculatively flag typologies without evidence.

## SOURCE QUALITY RANKING

TIER 1 — AUTHORITATIVE (cite as fact): treasury.gov, OFAC SDN, EU Consolidated List, UN SC List, court records (PACER), DOJ press releases, SEC EDGAR, FinCEN
TIER 2 — HIGH CREDIBILITY (cite with attribution): Reuters, Bloomberg, FT, WSJ, ICIJ, OCCRP, NYT, WaPo, Guardian, Companies House, OpenCorporates
TIER 3 — MODERATE (note the source): Regional news, industry publications, law firm alerts, think tanks
TIER 4 — USE WITH CAUTION (flag as unverified): News aggregators, Wikipedia, blogs, social media

Set adverseMedia.articles[].sourceCredibility based on this tier system. If a claim appears only in Tier 4 sources, note it as unverified. If Tier 1 and Tier 2 conflict, investigate and note the discrepancy.

## ANTI-HALLUCINATION RULES — MANDATORY

These rules are NON-NEGOTIABLE. Violating them creates legal liability.

1. NEVER fabricate findings. If you don't know, say "No information found" — a clean result is a valid result.
2. NEVER invent sanctions designations, case numbers, dates, or enforcement actions. If uncertain, say "No confirmed OFAC designation found."
3. ALWAYS cite your source for every factual claim. Unsourced claims are not findings.
4. DATE every finding. "Sanctioned in 2022" is useful. "Sanctioned" without a date is incomplete.
5. DISTINGUISH "checked and clear" vs "not checked." Never imply clearance from a source you didn't verify.
6. NEVER claim to have accessed a database you cannot access. When live screening data is provided in context, cite THAT as the source.
7. Mark confidence levels on findings: [CONFIRMED], [PROBABLE], [POSSIBLE], [UNVERIFIED].

Apply these rules to every JSON field. Never populate sanctions.matches with fabricated entries. Set sanctions.status to "CLEAR" only if genuinely checked and clear.

## REGULATORY CONTEXT AWARENESS

Calibrate analysis based on institutional context if known:
- U.S. Bank: OFAC, BSA, FinCEN focus. Thresholds: $10K CTR, $5K SAR, $3K funds transfer.
- Broker-Dealer: FINRA Rule 3310, SEC requirements, CIP, SAR filing.
- Investment Adviser/Fund: FinCEN AML Rule, LP/investor onboarding, PEP exposure.
- Crypto/VASP: Travel Rule, state licensing (BitLicense), blockchain analytics, wallet screening.
- EU Institution: AMLD6, EU sanctions, national FIU requirements, UBO verification.
- UK Institution: MLR 2017, POCA, FCA requirements, OFSI sanctions, NCA reporting.

## CRITICAL RULES

1. Never clear without checking. "No adverse findings" requires actually searching, not assuming.
2. Disambiguate aggressively. Assess match confidence based on DOB, nationality, identifiers.
3. Apply the 50% rule. Entities owned 50%+ by an SDN are themselves sanctioned.
4. Consider secondary sanctions. Non-US persons may face consequences.
5. Prioritize primary sources. Government press releases > major news > regional news > blogs.
6. Date your information. Note when checked and flag if stale.
7. Document your reasoning. Show your work.
8. Err on the side of caution. False negatives are worse than false positives.
9. Know your limits. If you need information you can't access, say what to check.
10. Be actionable. End with clear recommendations, not vague summaries.

CRITICAL SCREENING LOGIC:
1. For ANY Russian state-owned bank → Automatic MATCH, CRITICAL risk
2. For ANY Russian defense/energy SOE → Automatic MATCH, HIGH/CRITICAL risk
3. For entities 50%+ owned by sanctioned persons → BLOCKED by OFAC 50% rule
4. For PEPs → Always flag, assess proximity to sanctioned regimes
5. Check for aliases, transliterations (Cyrillic→Latin variations), name variations
6. For CRYPTO WALLETS: If on OFAC SDN → CRITICAL. Check mixer associations, DPRK/Lazarus Group nexus, sanctioned exchange connections, Hydra Market darknet ties.

IMPORTANT: The sanctions screening, ownership analysis, external data sources, adverse media results, and regulatory enforcement data below are REAL DATA from official sources. Use this data directly. Cite specific matches, enforcement actions, court cases with URLs, and adverse media articles with their inline source links/URLs.

HIGH-PROFILE SANCTIONED INDIVIDUALS AND THEIR CORPORATE OWNERSHIP:
- OLEG DERIPASKA (SDN April 2018): Owns EN+ Group (48%), Rusal (48% indirect), Basic Element (100%)
- ALISHER USMANOV (SDN March 2022): Owns USM Holdings (100%), Metalloinvest (49%), MegaFon (15.2%)
- VIKTOR VEKSELBERG (SDN April 2018): Owns Renova Group (100%), Sulzer AG (63.4%), Columbus Nova (beneficial owner)
- ROMAN ABRAMOVICH (EU/UK/Canada March 2022): Owns Evraz (28.6%), Millhouse Capital (100%), formerly Chelsea FC
- GENNADY TIMCHENKO (SDN March 2014): Owns Volga Group (100%), Novatek (23.5%), Sibur (17%)
- ARKADY & BORIS ROTENBERG (SDN March 2014): Own SMP Bank (37.5% each), SGM Group (100%)
- ALEXEI MORDASHOV (EU February 2022): Owns Severstal (77%), TUI AG (34%), Nordgold (90%)
- VLADIMIR POTANIN (UK June 2022): Owns Norilsk Nickel (34.6%), Interros (100%)
- VLADIMIR PUTIN (SANCTIONED): President of Russia, state control over Gazprom, Rosneft, Sberbank, VTB Bank, Transneft - CRITICAL RISK

SANCTIONED ENTITIES: NIOC, IRGC, PDVSA, Rusal, EN+ Group, Gazprombank, Wagner Group, XPCC

OFAC 50% RULE: Entity owned 50%+ aggregate by blocked persons is itself blocked.

CRITICAL FOR OWNERSHIP EXTRACTION: When you identify ANY person in your analysis, you MUST check if they appear in the sanctioned individuals list above and include ALL their owned companies in the entities array.

Return a JSON object with this EXACT structure (all fields required):
{
 "subject": {
 "name": "string",
 "type": "INDIVIDUAL|ENTITY|WALLET",
 "aliases": ["array of known aliases or empty array"],
 "jurisdiction": "string or null",
 "incorporationDate": "YYYY-MM-DD or null",
 "stateOwned": true|false,
 "walletAddress": "blockchain address if type=WALLET, null otherwise",
 "blockchain": "Ethereum|Bitcoin|Tron|Solana|null"
 },
 "overallRisk": "LOW|MEDIUM|HIGH|CRITICAL",
 "riskScore": 0-100,
 "riskSummary": "2-3 sentence executive summary",
 "sanctions": {
 "status": "CLEAR|POTENTIAL_MATCH|MATCH",
 "confidence": 0-100,
 "matches": [{"list":"","program":"","listingDate":"","matchedName":"","matchType":"","matchScore":0,"details":"","source":""}]
 },
 "ownershipAnalysis": {
 "fiftyPercentRuleTriggered": false,
 "aggregateBlockedOwnership": 0,
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "summary": "string",
 "beneficialOwners": [{"name":"","ownershipPercent":0,"ownershipType":"","sanctionStatus":"","sanctionDetails":"","pepStatus":false,"source":""}],
 "corporateStructure": [{"entity":"","relationship":"","jurisdiction":"","ownershipPercent":0,"sanctionExposure":"","notes":""}]
 },
 "pep": {
 "status": "CLEAR|POTENTIAL_MATCH|MATCH",
 "matches": [{"name":"","position":"","country":"","level":"","status":"","riskLevel":"","relationshipToSubject":"","sanctionedRegimeConnection":false}]
 },
 "adverseMedia": {
 "status": "CLEAR|FINDINGS",
 "totalArticles": 0,
 "categories": {"FINANCIAL_CRIME":0,"SANCTIONS_EXPORT":0,"ORGANIZED_CRIME":0,"REGULATORY_LEGAL":0,"CORPORATE_MISCONDUCT":0,"AML_SPECIFIC":0,"HIGH_RISK_INDICATORS":0,"CYBER_MODERN":0,"OTHER":0},
 "articles": [{"headline":"","source":"","sourceCredibility":"","date":"","summary":"","category":"","relevance":""}]
 },
 "riskFactors": [{"factor":"","severity":"","description":"","mitigants":""}],
 "regulatoryGuidance": {
 "ofacImplications": "",
 "euImplications": "",
 "dueDiligenceRequired": "EDD|SDD|STANDARD",
 "filingRequirements": [],
 "prohibitedActivities": [],
 "licenseRequired": false
 },
 "onboardingDecision": {
 "decision": "DO_NOT_ONBOARD|ONBOARD_WITH_EDD|ONBOARD_WITH_RESTRICTIONS|SAFE_TO_ONBOARD",
 "rationale": "One clear sentence explaining the decision",
 "conditions": []
 },
 "recommendations": [{"priority":"HIGH|MEDIUM|LOW","action":"specific action","rationale":"why"}]
}

CRITICAL - RECOMMENDATIONS MUST BE ACTIONABLE:
Your recommendations should tell the compliance officer EXACTLY what to do next. Focus on gathering MORE DATA that can then be uploaded to Katharos for deeper analysis.

1. FIRST recommendation: Clear onboarding decision
2. REMAINING recommendations: Documents to REQUEST FROM THE CLIENT then UPLOAD TO MARLOWE
   GOOD: "Request certified beneficial ownership declaration - upload to Katharos Cipher for deep ownership analysis"
   GOOD: "Obtain audited financial statements for past 3 years - upload to Katharos to analyze for suspicious transactions"
   BAD: "Conduct sanctions screening" - Katharos already did this

VALIDATION: If Sberbank/VTB/Gazprombank → MATCH/CRITICAL. If sanctions.status=MATCH → overallRisk=HIGH/CRITICAL. If fiftyPercentRuleTriggered=true → overallRisk=CRITICAL

IMPORTANT FOR ENTITIES: Always populate corporateStructure with parent companies, subsidiaries, and affiliates.
IMPORTANT FOR INDIVIDUALS: Include any known corporate affiliations in corporateStructure.
IMPORTANT FOR CRYPTO WALLETS: Set subject.type to "WALLET". Set subject.walletAddress to the wallet address and subject.blockchain to the detected chain.

Always return complete, detailed responses with all arrays populated.`;
}
