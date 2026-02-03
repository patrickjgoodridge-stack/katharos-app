// Wallet Screening Service
// Checks crypto wallet addresses against OFAC sanctioned addresses
// Sources: GitHub mirror of OFAC lists, SDN CSV crypto addresses, known sanctioned services

class WalletScreeningService {
  constructor() {
    this.sanctionedAddresses = new Map(); // lowercase address -> { chain, sdnEntry, program }
    this.cache = { loaded: false, timestamp: 0 };
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
    this.loading = null;

    // Known sanctioned service addresses (hardcoded for instant matching)
    this.knownSanctionedServices = new Map([
      // Tornado Cash (OFAC designated Aug 8, 2022)
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
      ['0x178169b423a011fff22b9e3f3abea13414ddd0f1', { service: 'Tornado Cash Governance', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      ['0x610b717796ad172b316836ac95a2ffad065ceab4', { service: 'Tornado Cash Governance', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      ['0xba214c1c1928a32bffe790263e38b4af9bfcd659', { service: 'Tornado Cash Governance', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      ['0xb1c8094b234dce6e03f10a5b673c1d8c69739a00', { service: 'Tornado Cash Governance', chain: 'ETH', program: 'CYBER2', date: '2022-08-08' }],
      // Garantex (OFAC designated Apr 5, 2022)
      ['0x6f1ca141a28907f78ebaa64f83d4e6f1da97e63c', { service: 'Garantex', chain: 'ETH', program: 'RUSSIA-EO14024', date: '2022-04-05' }],
      // Blender.io (OFAC designated May 6, 2022)
      ['0x94a1b5cdb22c43faab4abeb5c74999895464ddba', { service: 'Blender.io', chain: 'ETH', program: 'CYBER2', date: '2022-05-06' }],
      // Sinbad.io (OFAC designated Nov 29, 2023)
      ['0x72a5843cc08275c8171e582972aa4fda8c397b2a', { service: 'Sinbad.io', chain: 'ETH', program: 'CYBER2', date: '2023-11-29' }],
    ]);
  }

  // Detect wallet address type from input
  detectChain(input) {
    const trimmed = input.trim();
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return 'ETH';
    if (/^(bc1)[a-zA-HJ-NP-Z0-9]{25,90}$/.test(trimmed)) return 'XBT'; // bech32
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmed)) return 'XBT'; // legacy
    if (/^T[a-zA-Z0-9]{33}$/.test(trimmed)) return 'TRX';
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) return 'SOL';
    if (/^r[0-9a-zA-Z]{24,34}$/.test(trimmed)) return 'XRP';
    if (/^L[a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(trimmed)) return 'LTC';
    if (/^X[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmed)) return 'DASH';
    if (/^t1[a-km-zA-HJ-NP-Z1-9]{33}$/.test(trimmed)) return 'ZEC';
    if (/^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/.test(trimmed)) return 'XMR';
    return null;
  }

  isWalletAddress(input) {
    return this.detectChain(input) !== null;
  }

  async loadSanctionedAddresses() {
    if (this.cache.loaded && Date.now() - this.cache.timestamp < this.cacheTTL) return;
    if (this.loading) return this.loading;
    this.loading = this._fetchAllLists();
    try {
      await this.loading;
      this.cache = { loaded: true, timestamp: Date.now() };
    } finally {
      this.loading = null;
    }
  }

  async _fetchAllLists() {
    const chains = ['ETH', 'XBT', 'USDT', 'USDC', 'TRX', 'ARB', 'BSC', 'XMR', 'ZEC', 'LTC', 'DASH', 'XRP'];
    const baseUrl = 'https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists';

    const fetches = chains.map(async (chain) => {
      const url = `${baseUrl}/sanctioned_addresses_${chain}.txt`;
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Marlowe-AML/1.0)' },
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) return 0;
        const text = await response.text();
        let count = 0;
        for (const line of text.split('\n')) {
          const addr = line.trim();
          if (addr && !addr.startsWith('#')) {
            this.sanctionedAddresses.set(addr.toLowerCase(), { chain, source: 'OFAC_GITHUB' });
            count++;
          }
        }
        return count;
      } catch (e) {
        console.error(`[WalletScreening] Failed to fetch ${chain} list:`, e.message);
        return 0;
      }
    });

    const counts = await Promise.all(fetches);
    const total = counts.reduce((a, b) => a + b, 0);
    console.log(`[WalletScreening] Loaded ${total} sanctioned addresses across ${chains.length} chains`);

    // Also add known services
    for (const [addr, info] of this.knownSanctionedServices) {
      if (!this.sanctionedAddresses.has(addr)) {
        this.sanctionedAddresses.set(addr, { chain: info.chain, source: 'KNOWN_SERVICE', service: info.service, program: info.program });
      }
    }
  }

  async screenWallet(address) {
    const chain = this.detectChain(address);
    if (!chain) {
      return { status: 'INVALID', riskScore: 0, error: 'Not a recognized wallet address format' };
    }

    await this.loadSanctionedAddresses();

    const addrLower = address.toLowerCase().trim();
    const results = [];

    // 1. Check against OFAC GitHub lists
    const ofacMatch = this.sanctionedAddresses.get(addrLower);
    if (ofacMatch) {
      results.push({
        source: ofacMatch.source === 'KNOWN_SERVICE' ? `Known Sanctioned Service (${ofacMatch.service})` : 'OFAC SDN List',
        matchType: 'exact',
        chain: ofacMatch.chain,
        program: ofacMatch.program || 'See SDN entry',
        service: ofacMatch.service || null,
        confidence: 1.0,
      });
    }

    // 2. Check against known sanctioned services
    const serviceMatch = this.knownSanctionedServices.get(addrLower);
    if (serviceMatch && !ofacMatch) {
      results.push({
        source: `Known Sanctioned Service`,
        matchType: 'exact',
        chain: serviceMatch.chain,
        program: serviceMatch.program,
        service: serviceMatch.service,
        designationDate: serviceMatch.date,
        confidence: 1.0,
      });
    }

    // 3. Check against OFAC SDN CSV crypto addresses (from the OFAC screening service)
    // This is handled by the existing ofac endpoint with action=wallet

    // 4. Check OpenSanctions
    let openSanctionsResult = null;
    try {
      const osRes = await fetch('https://api.opensanctions.org/match/default?algorithm=best&limit=3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          schema: 'CryptoWallet',
          properties: { publicKey: [address], currency: [chain] }
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (osRes.ok) {
        const data = await osRes.json();
        if (data.responses) {
          for (const match of Object.values(data.responses)) {
            if (match.results) {
              for (const r of match.results) {
                if (r.score >= 0.7) {
                  openSanctionsResult = {
                    source: 'OpenSanctions',
                    matchType: 'api',
                    entity: r.caption || r.name,
                    datasets: r.datasets || [],
                    score: r.score,
                    url: `https://opensanctions.org/entities/${r.id}/`,
                  };
                  results.push({
                    source: 'OpenSanctions',
                    matchType: 'api',
                    chain,
                    entity: r.caption,
                    confidence: r.score,
                  });
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[WalletScreening] OpenSanctions check failed:', e.message);
    }

    const isSanctioned = results.length > 0;
    const topResult = results[0];

    if (isSanctioned) {
      return {
        status: 'BLOCKED',
        riskScore: 100,
        address,
        chain,
        matchCount: results.length,
        matches: results,
        matchSource: topResult.source,
        sdnEntry: topResult.service || topResult.entity || 'See OFAC SDN List',
        program: topResult.program || 'See SDN entry',
        designationDate: topResult.designationDate || null,
        action: 'DO NOT TRANSACT — Report to compliance immediately',
        openSanctions: openSanctionsResult,
        totalSanctionedAddresses: this.sanctionedAddresses.size,
        screenedAt: new Date().toISOString(),
      };
    }

    return {
      status: 'NO_MATCH',
      riskScore: 0,
      address,
      chain,
      note: 'Not found on OFAC SDN, OpenSanctions, or known sanctioned service lists',
      checkedSources: ['OFAC SDN (GitHub mirror)', 'Known Sanctioned Services', 'OpenSanctions API'],
      totalSanctionedAddresses: this.sanctionedAddresses.size,
      screenedAt: new Date().toISOString(),
    };
  }

  getStatus() {
    return {
      loaded: this.cache.loaded,
      addressCount: this.sanctionedAddresses.size,
      knownServicesCount: this.knownSanctionedServices.size,
      lastFetched: this.cache.timestamp ? new Date(this.cache.timestamp).toISOString() : null,
    };
  }
}

module.exports = { WalletScreeningService };
