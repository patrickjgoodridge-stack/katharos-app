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
import { screenEntity as screenSanctionsEntity } from './screen-sanctions.js';
import { Pinecone } from '@pinecone-database/pinecone';

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

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// ── SSE Helper ──
function sendSSE(res, event, data) {
  res.write(`data: ${JSON.stringify({ type: event, ...data })}\n\n`);
}

// ── Agent System Prompt ──
const AGENT_SYSTEM_PROMPT = `You are Marlowe, a senior compliance analyst AI agent working within the Katharos compliance platform. You work autonomously to complete compliance tasks — screening entities, investigating risks, drafting Suspicious Activity Reports (SARs), and preparing due diligence reports.

WORKFLOW:
1. Analyze the user's request and briefly explain your planned approach
2. Use your tools to gather information systematically (run screenings, search records, check knowledge base, search the web)
3. At key checkpoints, use ask_user to present intermediate findings and get direction
4. Produce a comprehensive final output with citations

GUIDELINES:
- Always explain what you're about to do before doing it
- Use ask_user when you need clarification, when there are multiple possible subjects, or when presenting significant intermediate findings
- Be thorough — check multiple sources before drawing conclusions
- Cite your sources with specifics (database name, date, match details)
- For SAR drafting: include all FinCEN-required fields, narrative sections, and supporting evidence
- For due diligence: cover beneficial ownership, sanctions exposure, adverse media, litigation, and regulatory history
- Keep responses focused and professional — you are a compliance expert

AVAILABLE TOOLS:
- screen_entity: Full comprehensive screening (sanctions, PEP, adverse media, corporate records, courts, OCCRP, regulatory, blockchain, web intelligence)
- search_sanctions: Targeted OFAC + PEP check
- search_adverse_media: Negative news and media search
- search_corporate_records: OpenCorporates + OCCRP corporate data
- search_court_records: Federal court cases via CourtListener
- knowledge_base_search: Katharos regulatory knowledge base (OFAC, FinCEN, DOJ, SEC, FATF, etc.)
- web_search: Live web search for current information
- ask_user: Pause to ask the user a question or present checkpoint findings`;

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

  // Agentic loop — max 15 iterations to prevent runaway
  const MAX_ITERATIONS = 15;
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

      for (const block of content) {
        if (block.type === 'text' && block.text) {
          // Stream text to the client
          sendSSE(res, 'agent_text', { text: block.text });
        }

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
    default:
      return 'Completed';
  }
}
