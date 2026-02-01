// Vercel Serverless Function — Blockchain address screening
// POST /api/screening/blockchain

class BlockchainScreeningService {
  constructor() {
    this.etherscanKey = process.env.ETHERSCAN_API_KEY || null;
    this.bscscanKey = process.env.BSCSCAN_API_KEY || null;
    this.polygonscanKey = process.env.POLYGONSCAN_API_KEY || null;
  }

  async screenAddress(query) {
    const { address, blockchain } = query;
    const chain = blockchain || this.detectBlockchain(address);
    const promises = [];
    if (chain === 'Ethereum' || chain === 'Unknown') promises.push(this._etherscanScreen(address, 'https://api.etherscan.io/api', this.etherscanKey || 'YourApiKeyToken', 'etherscan').catch(e => ({ source: 'etherscan', data: null, error: e.message })));
    if (chain === 'Bitcoin' || chain === 'Unknown') promises.push(this.screenBitcoin(address).catch(e => ({ source: 'bitcoin', data: null, error: e.message })));
    if (chain === 'Tron' || chain === 'Unknown') promises.push(this.screenTron(address).catch(e => ({ source: 'tronscan', data: null, error: e.message })));
    if (chain === 'Solana' || chain === 'Unknown') promises.push(this.screenSolana(address).catch(e => ({ source: 'solscan', data: null, error: e.message })));
    if (chain === 'BSC' || chain === 'Unknown') promises.push(this._etherscanScreen(address, 'https://api.bscscan.com/api', this.bscscanKey || 'YourApiKeyToken', 'bscscan').catch(e => ({ source: 'bscscan', data: null, error: e.message })));
    if (chain === 'Polygon' || chain === 'Unknown') promises.push(this._etherscanScreen(address, 'https://api.polygonscan.com/api', this.polygonscanKey || 'YourApiKeyToken', 'polygonscan').catch(e => ({ source: 'polygonscan', data: null, error: e.message })));
    promises.push(this.searchBlockchair(address, chain).catch(e => ({ source: 'blockchair', data: null, error: e.message })));
    const results = await Promise.all(promises);
    const sources = {}; for (const r of results) sources[r.source] = { data: r.data, error: r.error || null };
    const info = { balances: {}, transactions: [], totalTxCount: 0, tokens: [] };
    for (const r of results) { if (!r.data) continue; if (r.data.balance) info.balances[r.source] = r.data.balance; if (r.data.recentTransactions) info.transactions.push(...r.data.recentTransactions); if (r.data.transactionCount) info.totalTxCount = Math.max(info.totalTxCount, r.data.transactionCount); if (r.data.tokens) info.tokens.push(...r.data.tokens); }
    let score = 0; const flags = [];
    if (info.totalTxCount > 10000) { score += 15; flags.push({ severity: 'MEDIUM', type: 'HIGH_TX_VOLUME', message: `${info.totalTxCount} transactions` }); }
    return { query: { address, blockchain: chain }, addressInfo: info, riskAssessment: { score: Math.min(score, 100), level: score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW', flags }, sources, screenedAt: new Date().toISOString() };
  }

  detectBlockchain(address) {
    if (/^T[A-Za-z1-9]{33}$/.test(address)) return 'Tron';
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'Ethereum';
    if (/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address)) return 'Bitcoin';
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return 'Solana';
    return 'Unknown';
  }

  async _etherscanScreen(address, baseUrl, apiKey, source) {
    const [balRes, txRes] = await Promise.all([
      fetch(`${baseUrl}?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`, { signal: AbortSignal.timeout(10000) }).catch(() => null),
      fetch(`${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`, { signal: AbortSignal.timeout(10000) }).catch(() => null),
    ]);
    let balance = null, txs = [];
    if (balRes?.ok) { const d = await balRes.json(); if (d.status === '1') balance = parseInt(d.result) / 1e18; }
    if (txRes?.ok) { const d = await txRes.json(); if (Array.isArray(d.result)) txs = d.result.slice(0, 10).map(tx => ({ hash: tx.hash, from: tx.from, to: tx.to, value: parseInt(tx.value) / 1e18, timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString() })); }
    return { source, data: { address, blockchain: source === 'etherscan' ? 'Ethereum' : source === 'bscscan' ? 'BSC' : 'Polygon', balance: balance !== null ? `${balance.toFixed(4)}` : null, transactionCount: txs.length, recentTransactions: txs } };
  }

  async screenBitcoin(address) {
    const res = await fetch(`https://blockchain.info/rawaddr/${address}?limit=10`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { source: 'bitcoin', data: { address, blockchain: 'Bitcoin' } };
    const bc = await res.json();
    return { source: 'bitcoin', data: { address, blockchain: 'Bitcoin', balance: `${(bc.final_balance / 1e8).toFixed(8)} BTC`, transactionCount: bc.n_tx || 0, recentTransactions: (bc.txs || []).slice(0, 10).map(tx => ({ hash: tx.hash, time: new Date(tx.time * 1000).toISOString() })) } };
  }

  async screenTron(address) {
    const res = await fetch(`https://apilist.tronscanapi.com/api/accountv2?address=${address}`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { source: 'tronscan', data: { address, blockchain: 'Tron' } };
    const acct = await res.json();
    return { source: 'tronscan', data: { address, blockchain: 'Tron', balance: `${((acct.balance || 0) / 1e6).toFixed(2)} TRX`, transactionCount: acct.totalTransactionCount || 0, tokens: (acct.withPriceTokens || []).slice(0, 10).map(t => ({ name: t.tokenAbbr, balance: t.balance })) } };
  }

  async screenSolana(address) {
    const res = await fetch(`https://public-api.solscan.io/account/${address}`, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { source: 'solscan', data: { address, blockchain: 'Solana' } };
    const acct = await res.json();
    return { source: 'solscan', data: { address, blockchain: 'Solana', balance: acct.lamports !== undefined ? `${(acct.lamports / 1e9).toFixed(4)} SOL` : null } };
  }

  async searchBlockchair(address, chain) {
    const m = { 'Bitcoin': 'bitcoin', 'Ethereum': 'ethereum', 'BSC': 'binance-smart-chain', 'Tron': 'tron' };
    const res = await fetch(`https://api.blockchair.com/${m[chain] || 'bitcoin'}/dashboards/address/${address}`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { source: 'blockchair', data: null };
    const data = await res.json();
    const info = data.data?.[address]?.address || data.data?.[address.toLowerCase()]?.address || {};
    return { source: 'blockchair', data: { address, balance: info.balance, balanceUSD: info.balance_usd, transactionCount: info.transaction_count, firstSeen: info.first_seen_receiving, lastSeen: info.last_seen_receiving } };
  }
}

const service = new BlockchainScreeningService();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { address, blockchain } = req.body;
    if (!address) return res.status(400).json({ error: 'Address is required' });
    const result = await service.screenAddress({ address, blockchain });
    res.json(result);
  } catch (error) {
    console.error('Blockchain screening error:', error);
    res.status(500).json({ error: error.message });
  }
}
