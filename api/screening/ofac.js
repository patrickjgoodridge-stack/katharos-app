// Vercel Serverless Function — OFAC SDN screening
// POST /api/screening/ofac

class OFACScreeningService {
  constructor() {
    this.sdnListUrl = 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV';
    this.consolidatedUrl = 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/CONS_PRIM.CSV';
    this.cache = { sdn: null, timestamp: 0 };
    this.cacheTTL = 6 * 60 * 60 * 1000;
    this.loading = null;
  }

  async loadSDNList() {
    if (this.cache.sdn && Date.now() - this.cache.timestamp < this.cacheTTL) return this.cache.sdn;
    if (this.loading) return this.loading;
    this.loading = this._fetchAndParse();
    try { const r = await this.loading; this.cache = { sdn: r, timestamp: Date.now() }; return r; } finally { this.loading = null; }
  }

  async _fetchAndParse() {
    const entries = [];
    const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; Katharos-AML/1.0)', 'Accept': 'text/csv, text/plain, */*' };
    for (const url of [this.sdnListUrl, this.consolidatedUrl, 'https://www.treasury.gov/ofac/downloads/sdn.csv']) {
      if (entries.length > 0) break;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(60000), headers, redirect: 'follow' });
        if (res.ok) { const text = await res.text(); entries.push(...this.parseSDNCSV(text)); }
      } catch (e) { console.error(`OFAC fetch error (${url}):`, e.message); }
    }
    return entries;
  }

  parseSDNCSV(csvText) {
    const entries = [];
    for (const line of csvText.split('\n')) {
      if (!line.trim()) continue;
      const f = this.parseCSVLine(line);
      if (f.length < 3) continue;
      const name = (f[1] || '').trim();
      if (!name || name === 'SDN_Name') continue;
      const entry = { id: (f[0] || '').trim(), name, type: this.normalizeType((f[2] || '').trim()), programs: (f[3] || '').split(';').map(p => p.trim()).filter(Boolean), remarks: (f[11] || f[f.length - 1] || '').trim(), aliases: [], cryptoAddresses: [], dateOfBirth: null, nationality: null };
      this.parseRemarks(entry);
      entries.push(entry);
    }
    return entries;
  }

  parseCSVLine(line) {
    const fields = []; let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (ch === ',' && !inQ) { fields.push(cur); cur = ''; }
      else cur += ch;
    }
    fields.push(cur); return fields;
  }

  normalizeType(t) {
    t = t.toLowerCase();
    if (t.includes('individual')) return 'individual';
    if (t.includes('entity') || t.includes('company')) return 'entity';
    if (t.includes('vessel')) return 'vessel';
    if (t.includes('aircraft')) return 'aircraft';
    return 'unknown';
  }

  parseRemarks(entry) {
    const r = entry.remarks; if (!r) return;
    const dob = r.match(/DOB\s+(\d{1,2}\s+\w{3}\s+\d{4}|\d{4})/i); if (dob) entry.dateOfBirth = dob[1];
    const nat = r.match(/nationality\s+(\w+)/i); if (nat) entry.nationality = nat[1];
    for (const m of r.matchAll(/Digital Currency Address\s*-\s*(\w+)\s+([\w]+)/gi)) entry.cryptoAddresses.push({ blockchain: m[1], address: m[2] });
    for (const m of r.matchAll(/(?:XBT|ETH|USDT|TRX|LTC|ZEC|DASH|BSC|XRP)\s+([\w]{20,})/gi)) entry.cryptoAddresses.push({ blockchain: m[0].split(/\s/)[0], address: m[1] });
    for (const m of r.matchAll(/a\.k\.a\.\s+'([^']+)'/gi)) entry.aliases.push(m[1]);
  }

  async screenEntity(query) {
    const { name, type } = query;
    const sdnList = await this.loadSDNList();
    const qLower = name.toLowerCase().trim();
    const matches = [];
    for (const entry of sdnList) {
      if (type && type !== 'ALL') {
        const nt = type.toLowerCase();
        if (nt === 'wallet') { const wm = this.matchWallet(name, entry); if (wm) matches.push({ ...wm, entry }); continue; }
        if (nt === 'individual' && entry.type !== 'individual') continue;
        if (nt === 'entity' && entry.type !== 'entity') continue;
      }
      const score = this.matchName(qLower, entry);
      if (score >= 0.75) matches.push({ matchType: 'name', confidence: score, entry });
    }
    matches.sort((a, b) => b.confidence - a.confidence);
    const top = matches.slice(0, 25).map(m => ({ id: m.entry.id, name: m.entry.name, type: m.entry.type, programs: m.entry.programs, matchConfidence: m.confidence, matchType: m.matchType, dateOfBirth: m.entry.dateOfBirth, nationality: m.entry.nationality, remarks: m.entry.remarks, cryptoAddresses: m.entry.cryptoAddresses, aliases: m.entry.aliases }));
    return { query: { name, type: type || 'ALL' }, totalSDNEntries: sdnList.length, matchCount: matches.length, matches: top, riskAssessment: this.calculateRisk(top), source: 'OFAC SDN List (live)', screenedAt: new Date().toISOString() };
  }

  async screenWallet(address) {
    const sdnList = await this.loadSDNList();
    const addrLower = address.toLowerCase().trim();
    const matches = [];
    for (const entry of sdnList) {
      for (const c of entry.cryptoAddresses) { if (c.address.toLowerCase() === addrLower) matches.push({ matchType: 'crypto_address_exact', confidence: 1.0, blockchain: c.blockchain, entry }); }
      if (entry.remarks && entry.remarks.toLowerCase().includes(addrLower) && !matches.some(m => m.entry.id === entry.id)) matches.push({ matchType: 'remarks_mention', confidence: 0.95, entry });
    }
    matches.sort((a, b) => b.confidence - a.confidence);
    const top = matches.slice(0, 10).map(m => ({ id: m.entry.id, name: m.entry.name, type: m.entry.type, programs: m.entry.programs, matchConfidence: m.confidence, matchType: m.matchType, blockchain: m.blockchain || null, remarks: m.entry.remarks, cryptoAddresses: m.entry.cryptoAddresses }));
    return { query: { address, type: 'WALLET' }, totalSDNEntries: sdnList.length, matchCount: matches.length, matches: top, isSanctioned: matches.some(m => m.confidence >= 0.95), riskAssessment: { score: matches.length > 0 ? (matches[0].confidence >= 0.95 ? 100 : 75) : 0, level: matches.length > 0 ? 'CRITICAL' : 'LOW', flags: matches.length > 0 ? [{ severity: 'CRITICAL', type: 'OFAC_WALLET_MATCH', message: `Wallet address on OFAC SDN list (${matches.length} match(es))` }] : [] }, source: 'OFAC SDN List (live)', screenedAt: new Date().toISOString() };
  }

  matchWallet(address, entry) {
    const a = address.toLowerCase().trim();
    for (const c of entry.cryptoAddresses) { if (c.address.toLowerCase() === a) return { matchType: 'crypto_address_exact', confidence: 1.0, blockchain: c.blockchain }; }
    if (entry.remarks && entry.remarks.toLowerCase().includes(a)) return { matchType: 'remarks_mention', confidence: 0.95 };
    return null;
  }

  matchName(qLower, entry) {
    const eName = entry.name.toLowerCase();
    if (qLower === eName) return 1.0;
    const qVars = this.nameVariants(qLower);
    const eVars = this.nameVariants(eName);
    for (const q of qVars) for (const e of eVars) { if (q === e) return 1.0; }
    for (const q of qVars) for (const e of eVars) { if (e.includes(q) || q.includes(e)) return 0.9; }
    for (const alias of entry.aliases) { const a = alias.toLowerCase(); for (const q of qVars) { if (q === a) return 0.95; if (a.includes(q) || q.includes(a)) return 0.85; } }
    let best = 0;
    for (const q of qVars) for (const e of eVars) { best = Math.max(best, this.similarity(q, e)); }
    if (eName.includes(',')) { const last = eName.split(',')[0].trim(); best = Math.max(best, this.similarity(qLower, last) * 0.85); }
    return best;
  }

  nameVariants(name) {
    const v = [name];
    if (name.includes(',')) { const p = name.split(',').map(s => s.trim()); if (p.length === 2 && p[0] && p[1]) v.push(`${p[1]} ${p[0]}`); }
    else { const p = name.trim().split(/\s+/); if (p.length === 2) v.push(`${p[1]}, ${p[0]}`); }
    return v;
  }

  calculateRisk(matches) {
    if (matches.length === 0) return { score: 0, level: 'LOW', flags: [] };
    let score = 0; const flags = []; const top = matches[0];
    if (top.matchConfidence >= 0.95) { score += 80; flags.push({ severity: 'CRITICAL', type: 'OFAC_SDN_MATCH', message: `High-confidence OFAC SDN match: "${top.name}" (${(top.matchConfidence*100).toFixed(0)}%)` }); }
    else if (top.matchConfidence >= 0.85) { score += 50; flags.push({ severity: 'HIGH', type: 'OFAC_SDN_POSSIBLE_MATCH', message: `Possible OFAC SDN match: "${top.name}" (${(top.matchConfidence*100).toFixed(0)}%)` }); }
    else { score += 25; flags.push({ severity: 'MEDIUM', type: 'OFAC_SDN_PARTIAL_MATCH', message: `Partial OFAC SDN match: "${top.name}" (${(top.matchConfidence*100).toFixed(0)}%)` }); }
    if (matches.length >= 3) { score += 10; flags.push({ severity: 'MEDIUM', type: 'MULTIPLE_SDN_MATCHES', message: `${matches.length} potential SDN matches` }); }
    const crit = ['SDGT','CYBER2','DPRK','IRAN','SYRIA','UKRAINE-EO13661','RUSSIA-EO14024'];
    const mp = new Set(); for (const m of matches) for (const p of m.programs) { if (crit.some(c => p.includes(c))) mp.add(p); }
    if (mp.size > 0) { score += 10; flags.push({ severity: 'HIGH', type: 'CRITICAL_PROGRAM', message: `Critical sanctions program(s): ${[...mp].join(', ')}` }); }
    if (matches.some(m => m.matchType === 'crypto_address_exact')) { score = 100; flags.unshift({ severity: 'CRITICAL', type: 'OFAC_CRYPTO_MATCH', message: 'Exact crypto address match on OFAC SDN list' }); }
    return { score: Math.min(score, 100), level: score >= 80 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW', flags: flags.sort((a,b) => ({CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3})[a.severity] - ({CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3})[b.severity]) };
  }

  similarity(s1, s2) { const l = s1.length > s2.length ? s1 : s2, s = s1.length > s2.length ? s2 : s1; if (l.length === 0) return 1.0; return (l.length - this.lev(l, s)) / l.length; }
  lev(a, b) { const m = []; for (let i = 0; i <= b.length; i++) m[i] = [i]; for (let j = 0; j <= a.length; j++) m[0][j] = j; for (let i = 1; i <= b.length; i++) for (let j = 1; j <= a.length; j++) { if (b[i-1]===a[j-1]) m[i][j]=m[i-1][j-1]; else m[i][j]=Math.min(m[i-1][j-1]+1,m[i][j-1]+1,m[i-1][j]+1); } return m[b.length][a.length]; }
}

const service = new OFACScreeningService();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name, type, address, action } = req.body;
    if (action === 'wallet' || type === 'WALLET') {
      if (!address && !name) return res.status(400).json({ error: 'Address is required for wallet screening' });
      const result = await service.screenWallet(address || name);
      return res.json(result);
    }
    if (action === 'status') return res.json(service.getStatus ? service.getStatus() : { loaded: !!service.cache.sdn });
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await service.screenEntity({ name, type: type || 'ALL' });
    res.json(result);
  } catch (error) {
    console.error('OFAC screening error:', error);
    res.status(500).json({ error: error.message });
  }
}
