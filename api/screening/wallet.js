// Vercel Serverless Function — Wallet Address Screening
// POST /api/screening/wallet
// Checks crypto wallet addresses against OFAC sanctioned address lists

class WalletScreeningService {
  constructor() {
    this.sanctionedAddresses = new Map();
    this.cache = { loaded: false, timestamp: 0 };
    this.cacheTTL = 24 * 60 * 60 * 1000;
    this.loading = null;
    this.knownSanctionedServices = new Map([
      ['0xd90e2f925da726b50c4ed8d0fb90ad053324f31b', { service: 'Tornado Cash', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      ['0x722122df12d4e14e13ac3b6895a86e84145b6967', { service: 'Tornado Cash Router', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      ['0xdd4c48c0b24039969fc16d1cdf626eab821d3384', { service: 'Tornado Cash', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      ['0xd4b88df4d29f5cedd6857912842cff3b20c8cfa3', { service: 'Tornado Cash', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      ['0x910cbd523d972eb0a6f4cae4618ad62622b39dbf', { service: 'Tornado Cash', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      ['0xa160cdab225685da1d56aa342ad8841c3b53f291', { service: 'Tornado Cash', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      ['0xfd8610d20aa15b7b2e3be39b396a1bc3516c7144', { service: 'Tornado Cash', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      ['0xf60dd140cff0706bae9cd734ac3683f01fc92926', { service: 'Tornado Cash', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      ['0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc', { service: 'Tornado Cash 0.1 ETH', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      ['0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936', { service: 'Tornado Cash 1 ETH', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      ['0x23773e65ed146a459791799d01336db287f25334', { service: 'Tornado Cash 10 ETH', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      ['0xd21be7248e0197ee08e0c20d4a398dad8926dec7', { service: 'Tornado Cash 100 ETH', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      ['0x6f1ca141a28907f78ebaa64f83d4e6f1da97e63c', { service: 'Garantex', chain: 'ETH', program: 'RUSSIA-EO14024', date: '2022-04-05' }],
      ['0x94a1b5cdb22c43faab4abeb5c74999895464ddba', { service: 'Blender.io', chain: 'ETH', program: 'CYBER2', date: '2022-05-06' }],
    ]);
  }

  detectChain(input) {
    const t = input.trim();
    if (/^0x[a-fA-F0-9]{40}$/.test(t)) return 'ETH';
    if (/^(bc1)[a-zA-HJ-NP-Z0-9]{25,90}$/.test(t)) return 'XBT';
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(t)) return 'XBT';
    if (/^T[a-zA-Z0-9]{33}$/.test(t)) return 'TRX';
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(t)) return 'SOL';
    if (/^r[0-9a-zA-Z]{24,34}$/.test(t)) return 'XRP';
    if (/^L[a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(t)) return 'LTC';
    if (/^X[1-9A-HJ-NP-Za-km-z]{33}$/.test(t)) return 'DASH';
    if (/^t1[a-km-zA-HJ-NP-Z1-9]{33}$/.test(t)) return 'ZEC';
    return null;
  }

  async loadSanctionedAddresses() {
    if (this.cache.loaded && Date.now() - this.cache.timestamp < this.cacheTTL) return;
    if (this.loading) return this.loading;
    this.loading = this._fetch();
    try { await this.loading; this.cache = { loaded: true, timestamp: Date.now() }; } finally { this.loading = null; }
  }

  async _fetch() {
    const chains = ['ETH', 'XBT', 'USDT', 'USDC', 'TRX', 'ARB', 'BSC', 'XMR', 'ZEC', 'LTC', 'DASH', 'XRP'];
    const base = 'https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists';
    const fetches = chains.map(async (chain) => {
      try {
        const res = await fetch(`${base}/sanctioned_addresses_${chain}.txt`, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Katharos-AML/1.0)' }, signal: AbortSignal.timeout(15000) });
        if (!res.ok) return 0;
        const text = await res.text();
        let count = 0;
        for (const line of text.split('\n')) { const a = line.trim(); if (a && !a.startsWith('#')) { this.sanctionedAddresses.set(a.toLowerCase(), { chain, source: 'OFAC_GITHUB' }); count++; } }
        return count;
      } catch { return 0; }
    });
    const counts = await Promise.all(fetches);
    for (const [addr, info] of this.knownSanctionedServices) { if (!this.sanctionedAddresses.has(addr)) this.sanctionedAddresses.set(addr, { chain: info.chain, source: 'KNOWN_SERVICE', service: info.service, program: info.program }); }
    console.log(`Wallet screening: loaded ${counts.reduce((a, b) => a + b, 0)} addresses`);
  }

  async screenWallet(address) {
    const chain = this.detectChain(address);
    if (!chain) return { status: 'INVALID', riskScore: 0, error: 'Not a recognized wallet address format' };
    await this.loadSanctionedAddresses();
    const addrLower = address.toLowerCase().trim();
    const results = [];

    const ofacMatch = this.sanctionedAddresses.get(addrLower);
    if (ofacMatch) results.push({ source: ofacMatch.source === 'KNOWN_SERVICE' ? `Known Sanctioned Service (${ofacMatch.service})` : 'OFAC SDN List', matchType: 'exact', chain: ofacMatch.chain, program: ofacMatch.program || 'See SDN', service: ofacMatch.service || null, confidence: 1.0 });

    const serviceMatch = this.knownSanctionedServices.get(addrLower);
    if (serviceMatch && !ofacMatch) results.push({ source: 'Known Sanctioned Service', matchType: 'exact', chain: serviceMatch.chain, program: serviceMatch.program, service: serviceMatch.service, designationDate: serviceMatch.date, confidence: 1.0 });

    // OpenSanctions
    try {
      const osRes = await fetch('https://api.opensanctions.org/match/default?algorithm=best&limit=3', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema: 'CryptoWallet', properties: { publicKey: [address], currency: [chain] } }),
        signal: AbortSignal.timeout(10000),
      });
      if (osRes.ok) {
        const data = await osRes.json();
        if (data.responses) for (const m of Object.values(data.responses)) if (m.results) for (const r of m.results) if (r.score >= 0.7) results.push({ source: 'OpenSanctions', matchType: 'api', chain, entity: r.caption, confidence: r.score, url: `https://opensanctions.org/entities/${r.id}/` });
      }
    } catch { /* skip */ }

    if (results.length > 0) {
      const top = results[0];
      return { status: 'BLOCKED', riskScore: 100, address, chain, matchCount: results.length, matches: results, matchSource: top.source, sdnEntry: top.service || top.entity || 'See OFAC SDN', program: top.program || 'See SDN', action: 'DO NOT TRANSACT', totalSanctionedAddresses: this.sanctionedAddresses.size, screenedAt: new Date().toISOString() };
    }
    return { status: 'NO_MATCH', riskScore: 0, address, chain, checkedSources: ['OFAC SDN (GitHub)', 'Known Services', 'OpenSanctions'], totalSanctionedAddresses: this.sanctionedAddresses.size, screenedAt: new Date().toISOString() };
  }
}

const service = new WalletScreeningService();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Address is required' });
    const result = await service.screenWallet(address);
    res.json(result);
  } catch (error) {
    console.error('Wallet screening error:', error);
    res.status(500).json({ error: error.message });
  }
}
