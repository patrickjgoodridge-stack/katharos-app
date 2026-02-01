// BlockchainScreeningService — Multi-chain wallet/address screening
// Sources: Etherscan, Blockchair, Blockchain.com, BTC.com, Solscan, Tronscan, Polygonscan, BSCScan

class BlockchainScreeningService {

  constructor() {
    this.etherscanKey = process.env.ETHERSCAN_API_KEY || null;
    this.bscscanKey = process.env.BSCSCAN_API_KEY || null;
    this.polygonscanKey = process.env.POLYGONSCAN_API_KEY || null;
  }

  // ============================================
  // MAIN ENTRY
  // ============================================

  async screenAddress(query) {
    const { address, blockchain } = query;
    const chain = blockchain || this.detectBlockchain(address);

    const promises = [];
    if (chain === 'Ethereum' || chain === 'Unknown') {
      promises.push(this.screenEthereum(address).catch(e => ({ source: 'etherscan', data: null, error: e.message })));
    }
    if (chain === 'Bitcoin' || chain === 'Unknown') {
      promises.push(this.screenBitcoin(address).catch(e => ({ source: 'bitcoin', data: null, error: e.message })));
    }
    if (chain === 'Tron' || chain === 'Unknown') {
      promises.push(this.screenTron(address).catch(e => ({ source: 'tronscan', data: null, error: e.message })));
    }
    if (chain === 'Solana' || chain === 'Unknown') {
      promises.push(this.screenSolana(address).catch(e => ({ source: 'solscan', data: null, error: e.message })));
    }
    if (chain === 'BSC' || chain === 'Unknown') {
      promises.push(this.screenBSC(address).catch(e => ({ source: 'bscscan', data: null, error: e.message })));
    }
    if (chain === 'Polygon' || chain === 'Unknown') {
      promises.push(this.screenPolygon(address).catch(e => ({ source: 'polygonscan', data: null, error: e.message })));
    }

    // Always check Blockchair (multi-chain)
    promises.push(this.searchBlockchair(address, chain).catch(e => ({ source: 'blockchair', data: null, error: e.message })));

    const results = await Promise.all(promises);
    const sources = {};
    for (const r of results) {
      sources[r.source] = { data: r.data, error: r.error || null };
    }

    const addressInfo = this.consolidateAddressInfo(results);
    const risk = this.calculateRisk(addressInfo, chain);

    return {
      query: { address, blockchain: chain },
      addressInfo,
      riskAssessment: risk,
      sources,
      screenedAt: new Date().toISOString()
    };
  }

  detectBlockchain(address) {
    if (/^T[A-Za-z1-9]{33}$/.test(address)) return 'Tron';
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'Ethereum'; // Also BSC, Polygon
    if (/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address)) return 'Bitcoin';
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return 'Solana';
    return 'Unknown';
  }

  // ============================================
  // ETHEREUM — Etherscan
  // ============================================

  async screenEthereum(address) {
    if (!this.etherscanKey) {
      // Free tier: limited but works
      return this._etherscanScreen(address, 'https://api.etherscan.io/api', this.etherscanKey || 'YourApiKeyToken', 'etherscan');
    }
    return this._etherscanScreen(address, 'https://api.etherscan.io/api', this.etherscanKey, 'etherscan');
  }

  async _etherscanScreen(address, baseUrl, apiKey, source) {
    const [balanceRes, txRes, tokenRes] = await Promise.all([
      fetch(`${baseUrl}?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`, { signal: AbortSignal.timeout(10000) }).catch(() => null),
      fetch(`${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc&apikey=${apiKey}`, { signal: AbortSignal.timeout(10000) }).catch(() => null),
      fetch(`${baseUrl}?module=account&action=tokentx&address=${address}&page=1&offset=25&sort=desc&apikey=${apiKey}`, { signal: AbortSignal.timeout(10000) }).catch(() => null),
    ]);

    let balance = null, txCount = 0, recentTxs = [], tokenTransfers = [];

    if (balanceRes?.ok) {
      const data = await balanceRes.json();
      if (data.status === '1') balance = parseInt(data.result) / 1e18;
    }
    if (txRes?.ok) {
      const data = await txRes.json();
      if (data.result && Array.isArray(data.result)) {
        txCount = data.result.length;
        recentTxs = data.result.slice(0, 10).map(tx => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: parseInt(tx.value) / 1e18,
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
          isError: tx.isError === '1'
        }));
      }
    }
    if (tokenRes?.ok) {
      const data = await tokenRes.json();
      if (data.result && Array.isArray(data.result)) {
        tokenTransfers = data.result.slice(0, 10).map(tx => ({
          tokenName: tx.tokenName,
          tokenSymbol: tx.tokenSymbol,
          from: tx.from,
          to: tx.to,
          value: parseInt(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal) || 18),
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString()
        }));
      }
    }

    return {
      source,
      data: {
        address,
        blockchain: 'Ethereum',
        balance: balance !== null ? `${balance.toFixed(4)} ETH` : null,
        balanceRaw: balance,
        transactionCount: txCount,
        recentTransactions: recentTxs,
        tokenTransfers,
        explorerUrl: `https://etherscan.io/address/${address}`
      }
    };
  }

  // ============================================
  // BITCOIN — Blockchain.com + BTC.com
  // ============================================

  async screenBitcoin(address) {
    const [bcRes, btcComRes] = await Promise.all([
      fetch(`https://blockchain.info/rawaddr/${address}?limit=10`, { signal: AbortSignal.timeout(15000) }).catch(() => null),
      fetch(`https://chain.api.btc.com/v3/address/${address}`, { signal: AbortSignal.timeout(15000) }).catch(() => null),
    ]);

    let data = { address, blockchain: 'Bitcoin', balance: null, transactionCount: 0, recentTransactions: [], totalReceived: null, totalSent: null };

    if (bcRes?.ok) {
      try {
        const bc = await bcRes.json();
        data.balance = `${(bc.final_balance / 1e8).toFixed(8)} BTC`;
        data.balanceRaw = bc.final_balance / 1e8;
        data.transactionCount = bc.n_tx || 0;
        data.totalReceived = `${(bc.total_received / 1e8).toFixed(8)} BTC`;
        data.totalSent = `${(bc.total_sent / 1e8).toFixed(8)} BTC`;
        data.recentTransactions = (bc.txs || []).slice(0, 10).map(tx => ({
          hash: tx.hash,
          time: new Date(tx.time * 1000).toISOString(),
          inputCount: tx.inputs?.length || 0,
          outputCount: tx.out?.length || 0,
          value: (tx.out || []).reduce((s, o) => s + (o.value || 0), 0) / 1e8
        }));
      } catch { /* parse error */ }
    }

    if (btcComRes?.ok) {
      try {
        const btc = await btcComRes.json();
        if (btc.data) {
          data.btcComData = {
            received: btc.data.received,
            sent: btc.data.sent,
            balance: btc.data.balance,
            txCount: btc.data.tx_count,
            firstSeen: btc.data.first_tx,
            lastSeen: btc.data.last_tx
          };
        }
      } catch { /* parse error */ }
    }

    data.explorerUrl = `https://www.blockchain.com/btc/address/${address}`;
    return { source: 'bitcoin', data };
  }

  // ============================================
  // TRON — Tronscan
  // ============================================

  async screenTron(address) {
    const [acctRes, txRes] = await Promise.all([
      fetch(`https://apilist.tronscanapi.com/api/accountv2?address=${address}`, { signal: AbortSignal.timeout(15000) }).catch(() => null),
      fetch(`https://apilist.tronscanapi.com/api/transaction?address=${address}&limit=10&sort=-timestamp`, { signal: AbortSignal.timeout(15000) }).catch(() => null),
    ]);

    let data = { address, blockchain: 'Tron', balance: null, transactionCount: 0, recentTransactions: [], tokens: [] };

    if (acctRes?.ok) {
      try {
        const acct = await acctRes.json();
        data.balance = `${((acct.balance || 0) / 1e6).toFixed(2)} TRX`;
        data.balanceRaw = (acct.balance || 0) / 1e6;
        data.transactionCount = acct.transactions || acct.totalTransactionCount || 0;
        data.accountCreated = acct.date_created ? new Date(acct.date_created).toISOString() : null;
        data.bandwidth = acct.bandwidth || {};
        if (acct.withPriceTokens) {
          data.tokens = acct.withPriceTokens.slice(0, 10).map(t => ({
            name: t.tokenName || t.tokenAbbr,
            symbol: t.tokenAbbr,
            balance: t.balance,
            tokenId: t.tokenId
          }));
        }
      } catch { /* parse error */ }
    }

    if (txRes?.ok) {
      try {
        const txData = await txRes.json();
        data.recentTransactions = (txData.data || []).slice(0, 10).map(tx => ({
          hash: tx.hash,
          timestamp: tx.timestamp ? new Date(tx.timestamp).toISOString() : null,
          from: tx.ownerAddress,
          to: tx.toAddress,
          value: (tx.amount || 0) / 1e6,
          type: tx.contractType
        }));
      } catch { /* parse error */ }
    }

    data.explorerUrl = `https://tronscan.org/#/address/${address}`;
    return { source: 'tronscan', data };
  }

  // ============================================
  // SOLANA — Solscan
  // ============================================

  async screenSolana(address) {
    const [acctRes, txRes] = await Promise.all([
      fetch(`https://public-api.solscan.io/account/${address}`, {
        headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(15000)
      }).catch(() => null),
      fetch(`https://public-api.solscan.io/account/transactions?account=${address}&limit=10`, {
        headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(15000)
      }).catch(() => null),
    ]);

    let data = { address, blockchain: 'Solana', balance: null, transactionCount: 0, recentTransactions: [] };

    if (acctRes?.ok) {
      try {
        const acct = await acctRes.json();
        if (acct.lamports !== undefined) {
          data.balance = `${(acct.lamports / 1e9).toFixed(4)} SOL`;
          data.balanceRaw = acct.lamports / 1e9;
        }
        data.accountType = acct.type || 'unknown';
        data.executable = acct.executable || false;
      } catch { /* parse error */ }
    }

    if (txRes?.ok) {
      try {
        const txData = await txRes.json();
        if (Array.isArray(txData)) {
          data.transactionCount = txData.length;
          data.recentTransactions = txData.slice(0, 10).map(tx => ({
            signature: tx.txHash || tx.signature,
            slot: tx.slot,
            timestamp: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null,
            fee: tx.fee,
            status: tx.status
          }));
        }
      } catch { /* parse error */ }
    }

    data.explorerUrl = `https://solscan.io/account/${address}`;
    return { source: 'solscan', data };
  }

  // ============================================
  // BSC — BSCScan
  // ============================================

  async screenBSC(address) {
    const apiKey = this.bscscanKey || 'YourApiKeyToken';
    return this._etherscanScreen(address, 'https://api.bscscan.com/api', apiKey, 'bscscan');
  }

  // ============================================
  // POLYGON — Polygonscan
  // ============================================

  async screenPolygon(address) {
    const apiKey = this.polygonscanKey || 'YourApiKeyToken';
    return this._etherscanScreen(address, 'https://api.polygonscan.com/api', apiKey, 'polygonscan');
  }

  // ============================================
  // BLOCKCHAIR — Multi-chain
  // ============================================

  async searchBlockchair(address, chain) {
    const chainMap = { 'Bitcoin': 'bitcoin', 'Ethereum': 'ethereum', 'BSC': 'binance-smart-chain', 'Tron': 'tron' };
    const bcChain = chainMap[chain] || 'bitcoin';

    try {
      const response = await fetch(`https://api.blockchair.com/${bcChain}/dashboards/address/${address}`, {
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) return { source: 'blockchair', data: null, error: `HTTP ${response.status}` };
      const data = await response.json();

      const addrData = data.data?.[address] || data.data?.[address.toLowerCase()];
      if (!addrData) return { source: 'blockchair', data: { address, note: 'No data found' } };

      const info = addrData.address || {};
      return {
        source: 'blockchair',
        data: {
          address,
          blockchain: chain,
          balance: info.balance,
          balanceUSD: info.balance_usd,
          receivedCount: info.received_count || info.transaction_count,
          sentCount: info.sent_count,
          firstSeen: info.first_seen_receiving || info.first_seen,
          lastSeen: info.last_seen_receiving || info.last_seen,
          transactionCount: info.transaction_count,
          explorerUrl: `https://blockchair.com/${bcChain}/address/${address}`
        }
      };
    } catch (e) {
      return { source: 'blockchair', data: null, error: e.message };
    }
  }

  // ============================================
  // CONSOLIDATION & RISK
  // ============================================

  consolidateAddressInfo(results) {
    const info = { balances: {}, transactions: [], totalTxCount: 0, firstSeen: null, lastSeen: null, tokens: [], isContract: false };

    for (const r of results) {
      if (!r.data) continue;
      if (r.data.balance) info.balances[r.source] = r.data.balance;
      if (r.data.recentTransactions) info.transactions.push(...r.data.recentTransactions);
      if (r.data.transactionCount) info.totalTxCount = Math.max(info.totalTxCount, r.data.transactionCount);
      if (r.data.tokens) info.tokens.push(...r.data.tokens);
      if (r.data.executable) info.isContract = true;
      if (r.data.firstSeen && (!info.firstSeen || r.data.firstSeen < info.firstSeen)) info.firstSeen = r.data.firstSeen;
      if (r.data.lastSeen && (!info.lastSeen || r.data.lastSeen > info.lastSeen)) info.lastSeen = r.data.lastSeen;
    }

    return info;
  }

  calculateRisk(addressInfo, chain) {
    let score = 0;
    const flags = [];

    // High transaction volume
    if (addressInfo.totalTxCount > 10000) {
      score += 15;
      flags.push({ severity: 'MEDIUM', type: 'HIGH_TX_VOLUME', message: `${addressInfo.totalTxCount} transactions (high volume)` });
    }

    // Very new address with high activity (potential mixer/tumbler)
    if (addressInfo.firstSeen) {
      const age = Date.now() - new Date(addressInfo.firstSeen).getTime();
      const dayAge = age / (1000 * 60 * 60 * 24);
      if (dayAge < 30 && addressInfo.totalTxCount > 100) {
        score += 20;
        flags.push({ severity: 'HIGH', type: 'NEW_HIGH_ACTIVITY', message: `Address is ${Math.round(dayAge)} days old with ${addressInfo.totalTxCount} transactions` });
      }
    }

    // Contract interaction (for wallets flagged as contracts)
    if (addressInfo.isContract) {
      score += 10;
      flags.push({ severity: 'MEDIUM', type: 'CONTRACT_ADDRESS', message: 'Address is a smart contract' });
    }

    // Multiple token types (potential layering)
    if (addressInfo.tokens.length > 10) {
      score += 10;
      flags.push({ severity: 'LOW', type: 'MANY_TOKENS', message: `${addressInfo.tokens.length} different token types held` });
    }

    return {
      score: Math.min(score, 100),
      level: score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW',
      flags: flags.sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[a.severity] - ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[b.severity])
    };
  }
}

module.exports = { BlockchainScreeningService };
