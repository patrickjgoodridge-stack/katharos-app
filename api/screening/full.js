// Vercel Serverless Function — Full Screening Pipeline
// POST /api/screening/full
// Runs all 7 screening layers and returns unified results

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

// Lazy-init singletons
let pipeline = null;
function getPipeline() {
  if (!pipeline) {
    // We can't import the CommonJS ScreeningPipeline directly in ESM Vercel,
    // so we inline the orchestration here
    pipeline = {
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
  return pipeline;
}

function detectWallet(input) {
  const t = input.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(t)) return { address: t, chain: 'ETH' };
  if (/^(bc1)[a-zA-HJ-NP-Z0-9]{25,90}$/.test(t)) return { address: t, chain: 'BTC' };
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(t)) return { address: t, chain: 'BTC' };
  if (/^T[a-zA-Z0-9]{33}$/.test(t)) return { address: t, chain: 'TRX' };
  return null;
}

function riskLevel(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}

const TIMEOUT = 25000;
function race(promise, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), TIMEOUT))
  ]).catch(e => ({ error: e.message }));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, type = 'auto', layers: requestedLayers } = req.body;
  if (!query) return res.status(400).json({ error: 'query is required' });

  const startTime = Date.now();
  const p = getPipeline();
  const wallet = detectWallet(query);
  const isWallet = !!wallet;
  const name = isWallet ? null : query.trim();
  const shouldRun = (l) => !requestedLayers || requestedLayers.includes(l);

  const result = { query, entityType: isWallet ? 'wallet' : type, isWallet, layers: {}, overallRisk: { score: 0, level: 'LOW', flags: [] }, sourcesChecked: [], screenedAt: new Date().toISOString() };

  try {
    if (isWallet) {
      const [walletRes, ofacRes, blockchainRes] = await Promise.all([
        shouldRun('wallet') ? race(p.wallet.screenWallet(wallet.address), 'wallet') : null,
        shouldRun('ofac') ? race(p.ofac.screenWallet(wallet.address), 'ofac') : null,
        shouldRun('blockchain') ? race(p.blockchain.screenAddress({ address: wallet.address, blockchain: wallet.chain }), 'blockchain') : null,
      ]);
      if (walletRes && !walletRes.error) result.layers.wallet = walletRes;
      if (ofacRes && !ofacRes.error) result.layers.ofacWallet = ofacRes;
      if (blockchainRes && !blockchainRes.error) result.layers.blockchain = blockchainRes;
    } else {
      // All layers in parallel
      const [ofacRes, annRes, wiRes, pepRes, regRes, amRes, courtRes, occrpRes, corpRes, shipRes] = await Promise.all([
        shouldRun('sanctions') ? race(p.ofac.screenEntity({ name, type: type === 'auto' ? 'ALL' : type.toUpperCase() }), 'ofac') : null,
        shouldRun('sanctions') ? race(p.announcements.screen(name), 'announcements') : null,
        shouldRun('sanctions') ? race(p.webIntel.search(name), 'webintel') : null,
        shouldRun('pep') ? race(p.pep.screenEntity({ name, type: type === 'auto' ? 'individual' : type }), 'pep') : null,
        shouldRun('regulatory') ? race(p.regulatory.screenEntity({ name, type: type === 'auto' ? 'ALL' : type.toUpperCase() }), 'regulatory') : null,
        shouldRun('adverseMedia') ? race(p.adverseMedia.screen(name, type === 'auto' ? 'INDIVIDUAL' : type.toUpperCase()), 'adverse-media') : null,
        shouldRun('litigation') ? race(p.courtRecords.screenEntity({ name, type: type === 'auto' ? 'individual' : type }), 'court') : null,
        shouldRun('litigation') ? race(p.occrp.screenEntity({ name, type: type === 'auto' ? 'individual' : type }), 'occrp') : null,
        shouldRun('corporate') ? race(p.openCorporates.screenEntity({ name }), 'opencorporates') : null,
        shouldRun('shipping') ? race(p.shipping.screenEntity({ name, type }), 'shipping') : null,
      ]);

      if (ofacRes && !ofacRes.error) result.layers.ofac = ofacRes;
      if (annRes && !annRes.error) result.layers.announcements = annRes;
      if (wiRes && !wiRes.error) result.layers.webIntelligence = wiRes;
      if (pepRes && !pepRes.error) result.layers.pep = pepRes;
      if (regRes && !regRes.error) result.layers.regulatory = regRes;
      if (amRes && !amRes.error) result.layers.adverseMedia = amRes;
      if (courtRes && !courtRes.error) result.layers.courtRecords = courtRes;
      if (occrpRes && !occrpRes.error) result.layers.occrp = occrpRes;
      if (corpRes && !corpRes.error) result.layers.corporate = corpRes;
      if (shipRes && !shipRes.error) result.layers.shipping = shipRes;
    }

    // Simple risk aggregation (mirrors screeningPipeline.js)
    let score = 0;
    const flags = [];
    const l = result.layers;

    if (l.wallet?.status === 'BLOCKED' || l.ofacWallet?.isSanctioned) { score = 100; flags.push({ severity: 'CRITICAL', type: 'SANCTIONED_WALLET', message: 'Wallet is on OFAC sanctions list' }); }
    if (l.ofac?.matches?.[0]?.matchConfidence >= 0.85) { score = Math.max(score, 80); flags.push({ severity: 'CRITICAL', type: 'OFAC_SDN_MATCH', message: `OFAC SDN: ${l.ofac.matches[0].name} (${(l.ofac.matches[0].matchConfidence * 100).toFixed(0)}%)` }); }
    if (l.announcements?.hasSanctionsAnnouncement) { score = Math.max(score, 90); flags.push({ severity: 'CRITICAL', type: 'SANCTIONS_ANNOUNCEMENT', message: `${l.announcements.totalFindings} sanctions announcements` }); }
    if (l.webIntelligence?.sanctioned && l.webIntelligence?.confidence === 'high') { score = Math.max(score, 95); flags.push({ severity: 'CRITICAL', type: 'WEB_INTEL', message: `Web intel: ${l.webIntelligence.summary}` }); }
    if (l.pep?.riskAssessment?.isPEP) { score = Math.max(score, score + 30); flags.push({ severity: 'HIGH', type: 'PEP', message: 'Politically Exposed Person' }); }
    if (l.regulatory?.riskAssessment?.score > 0) { score = Math.max(score, score + Math.round(l.regulatory.riskAssessment.score * 0.5)); flags.push(...(l.regulatory.riskAssessment.flags || []).slice(0, 3)); }
    if (l.adverseMedia?.riskDelta?.score > 0) { score = Math.max(score, score + Math.round(l.adverseMedia.riskDelta.score * 0.4)); flags.push(...(l.adverseMedia.riskDelta.flags || []).slice(0, 3)); }

    result.overallRisk = { score: Math.min(score, 100), level: riskLevel(Math.min(score, 100)), flags };
    result.durationMs = Date.now() - startTime;
    res.json(result);
  } catch (error) {
    console.error('Full screening error:', error);
    res.status(500).json({ error: error.message, durationMs: Date.now() - startTime });
  }
}
