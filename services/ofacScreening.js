// OFACScreeningService — Live OFAC SDN List screening via Treasury.gov
// Fetches and caches the full SDN list, performs fuzzy name matching

class OFACScreeningService {

  constructor() {
    this.sdnListUrl = 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV';
    this.consolidatedUrl = 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/CONS_PRIM.CSV';
    this.cache = { sdn: null, timestamp: 0 };
    this.cacheTTL = 6 * 60 * 60 * 1000; // 6 hours
    this.loading = null;
  }

  // ============================================
  // DATA LOADING
  // ============================================

  async loadSDNList() {
    if (this.cache.sdn && Date.now() - this.cache.timestamp < this.cacheTTL) {
      return this.cache.sdn;
    }
    if (this.loading) return this.loading;

    this.loading = this._fetchAndParse();
    try {
      const result = await this.loading;
      this.cache = { sdn: result, timestamp: Date.now() };
      return result;
    } finally {
      this.loading = null;
    }
  }

  async _fetchAndParse() {
    const entries = [];
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (compatible; Marlowe-AML/1.0)',
      'Accept': 'text/csv, text/plain, */*'
    };

    // Try each SDN CSV endpoint in order until one works
    const urls = [
      this.sdnListUrl,
      this.consolidatedUrl,
      'https://www.treasury.gov/ofac/downloads/sdn.csv'
    ];

    for (const url of urls) {
      if (entries.length > 0) break;
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(60000),
          headers: fetchHeaders,
          redirect: 'follow'
        });
        if (response.ok) {
          const text = await response.text();
          const parsed = this.parseSDNCSV(text);
          entries.push(...parsed);
        }
      } catch (e) {
        console.error(`OFAC fetch error (${url}):`, e.message);
      }
    }

    console.log(`OFAC SDN list loaded: ${entries.length} entries`);
    return entries;
  }

  parseSDNCSV(csvText) {
    const entries = [];
    const lines = csvText.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;
      const fields = this.parseCSVLine(line);
      if (fields.length < 3) continue;

      // SDN CSV format: ent_num, SDN_Name, SDN_Type, Program, Title, Call_Sign, Vess_type, Tonnage, GRT, Vess_flag, Vess_owner, Remarks
      const entNum = (fields[0] || '').trim();
      const name = (fields[1] || '').trim();
      const type = (fields[2] || '').trim();
      const program = (fields[3] || '').trim();
      const remarks = (fields[11] || fields[fields.length - 1] || '').trim();

      if (!name || name === 'SDN_Name') continue; // skip header

      const entry = {
        id: entNum,
        name: name,
        type: this.normalizeType(type),
        rawType: type,
        programs: program ? program.split(';').map(p => p.trim()).filter(Boolean) : [],
        remarks: remarks,
        aliases: [],
        addresses: [],
        ids: [],
        dateOfBirth: null,
        nationality: null,
        citizenship: null,
        cryptoAddresses: []
      };

      // Extract structured data from remarks
      this.parseRemarks(entry, remarks);

      entries.push(entry);
    }

    return entries;
  }

  parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current);
    return fields;
  }

  normalizeType(rawType) {
    const t = (rawType || '').toLowerCase().trim();
    if (t.includes('individual')) return 'individual';
    if (t.includes('entity') || t.includes('company') || t.includes('organization')) return 'entity';
    if (t.includes('vessel')) return 'vessel';
    if (t.includes('aircraft')) return 'aircraft';
    return 'unknown';
  }

  parseRemarks(entry, remarks) {
    if (!remarks) return;

    // Extract DOB
    const dobMatch = remarks.match(/DOB\s+(\d{1,2}\s+\w{3}\s+\d{4}|\d{4})/i);
    if (dobMatch) entry.dateOfBirth = dobMatch[1];

    // Extract nationality
    const natMatch = remarks.match(/nationality\s+(\w+)/i);
    if (natMatch) entry.nationality = natMatch[1];

    // Extract citizenship
    const citMatch = remarks.match(/citizen\s+(\w+)/i);
    if (citMatch) entry.citizenship = citMatch[1];

    // Extract crypto addresses (Digital Currency Address)
    const cryptoMatches = remarks.matchAll(/Digital Currency Address\s*-\s*(\w+)\s+([\w]+)/gi);
    for (const m of cryptoMatches) {
      entry.cryptoAddresses.push({
        blockchain: m[1],
        address: m[2]
      });
    }

    // Also match XBT (Bitcoin), ETH, USDT etc. address patterns
    const altCryptoMatches = remarks.matchAll(/(?:XBT|ETH|USDT|TRX|LTC|ZEC|DASH|BSC|XRP)\s+([\w]{20,})/gi);
    for (const m of altCryptoMatches) {
      entry.cryptoAddresses.push({
        blockchain: m[0].split(/\s/)[0],
        address: m[1]
      });
    }

    // Extract aliases from a.k.a. patterns
    const akaMatches = remarks.matchAll(/a\.k\.a\.\s+'([^']+)'/gi);
    for (const m of akaMatches) {
      entry.aliases.push(m[1]);
    }
  }

  // ============================================
  // SCREENING
  // ============================================

  async screenEntity(query) {
    const { name, type } = query;
    const sdnList = await this.loadSDNList();
    const queryLower = name.toLowerCase().trim();

    const matches = [];

    for (const entry of sdnList) {
      // Type filter if specified
      if (type && type !== 'ALL') {
        const normalizedQueryType = type.toLowerCase();
        if (normalizedQueryType === 'individual' && entry.type !== 'individual') continue;
        if (normalizedQueryType === 'entity' && entry.type !== 'entity') continue;
        if (normalizedQueryType === 'wallet') {
          // For wallet screening, match against crypto addresses
          const walletMatch = this.matchWalletAddress(name, entry);
          if (walletMatch) {
            matches.push({ ...walletMatch, entry });
          }
          continue;
        }
      }

      // Name matching
      const nameScore = this.matchName(queryLower, entry);
      if (nameScore >= 0.75) {
        matches.push({
          matchType: 'name',
          confidence: nameScore,
          entry
        });
      }
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    const topMatches = matches.slice(0, 25).map(m => ({
      id: m.entry.id,
      name: m.entry.name,
      type: m.entry.type,
      programs: m.entry.programs,
      matchConfidence: m.confidence,
      matchType: m.matchType,
      dateOfBirth: m.entry.dateOfBirth,
      nationality: m.entry.nationality,
      citizenship: m.entry.citizenship,
      remarks: m.entry.remarks,
      cryptoAddresses: m.entry.cryptoAddresses,
      aliases: m.entry.aliases
    }));

    const riskAssessment = this.calculateRisk(topMatches, name, type);

    return {
      query: { name, type: type || 'ALL' },
      totalSDNEntries: sdnList.length,
      matchCount: matches.length,
      matches: topMatches,
      riskAssessment,
      source: 'OFAC SDN List (live)',
      lastUpdated: new Date(this.cache.timestamp).toISOString(),
      screenedAt: new Date().toISOString()
    };
  }

  async screenWallet(address) {
    const sdnList = await this.loadSDNList();
    const addressLower = address.toLowerCase().trim();
    const matches = [];

    for (const entry of sdnList) {
      for (const crypto of entry.cryptoAddresses) {
        if (crypto.address.toLowerCase() === addressLower) {
          matches.push({
            matchType: 'crypto_address_exact',
            confidence: 1.0,
            blockchain: crypto.blockchain,
            entry
          });
        }
      }

      // Also check remarks for the address string
      if (entry.remarks && entry.remarks.toLowerCase().includes(addressLower)) {
        const alreadyMatched = matches.some(m => m.entry.id === entry.id);
        if (!alreadyMatched) {
          matches.push({
            matchType: 'remarks_mention',
            confidence: 0.95,
            entry
          });
        }
      }
    }

    matches.sort((a, b) => b.confidence - a.confidence);

    const topMatches = matches.slice(0, 10).map(m => ({
      id: m.entry.id,
      name: m.entry.name,
      type: m.entry.type,
      programs: m.entry.programs,
      matchConfidence: m.confidence,
      matchType: m.matchType,
      blockchain: m.blockchain || null,
      remarks: m.entry.remarks,
      cryptoAddresses: m.entry.cryptoAddresses
    }));

    return {
      query: { address, type: 'WALLET' },
      totalSDNEntries: sdnList.length,
      matchCount: matches.length,
      matches: topMatches,
      isSanctioned: matches.some(m => m.confidence >= 0.95),
      riskAssessment: {
        score: matches.length > 0 ? (matches[0].confidence >= 0.95 ? 100 : 75) : 0,
        level: matches.length > 0 ? (matches[0].confidence >= 0.95 ? 'CRITICAL' : 'HIGH') : 'LOW',
        flags: matches.length > 0 ? [{
          severity: 'CRITICAL',
          type: 'OFAC_WALLET_MATCH',
          message: `Wallet address appears on OFAC SDN list (${matches.length} match(es))`
        }] : []
      },
      source: 'OFAC SDN List (live)',
      screenedAt: new Date().toISOString()
    };
  }

  matchWalletAddress(address, entry) {
    const addrLower = address.toLowerCase().trim();
    for (const crypto of entry.cryptoAddresses) {
      if (crypto.address.toLowerCase() === addrLower) {
        return { matchType: 'crypto_address_exact', confidence: 1.0, blockchain: crypto.blockchain };
      }
    }
    if (entry.remarks && entry.remarks.toLowerCase().includes(addrLower)) {
      return { matchType: 'remarks_mention', confidence: 0.95 };
    }
    return null;
  }

  matchName(queryLower, entry) {
    const entryNameLower = entry.name.toLowerCase();

    // Exact match
    if (queryLower === entryNameLower) return 1.0;

    // Normalize both names for order-independent comparison
    // SDN uses "LAST, First" but users may search "First Last"
    const queryVariants = this.nameVariants(queryLower);
    const entryVariants = this.nameVariants(entryNameLower);

    // Check all variant combinations for exact match
    for (const qv of queryVariants) {
      for (const ev of entryVariants) {
        if (qv === ev) return 1.0;
      }
    }

    // Contains match (check all variants)
    for (const qv of queryVariants) {
      for (const ev of entryVariants) {
        if (ev.includes(qv) || qv.includes(ev)) return 0.9;
      }
    }

    // Check aliases
    for (const alias of entry.aliases) {
      const aliasLower = alias.toLowerCase();
      if (queryLower === aliasLower) return 0.95;
      for (const qv of queryVariants) {
        if (qv === aliasLower) return 0.95;
        if (aliasLower.includes(qv) || qv.includes(aliasLower)) return 0.85;
      }
    }

    // Fuzzy matching via Levenshtein — compare best variant pair
    let bestSim = 0;
    for (const qv of queryVariants) {
      for (const ev of entryVariants) {
        bestSim = Math.max(bestSim, this.calculateSimilarity(qv, ev));
      }
    }

    // Also check against last name only (SDN format is often "LAST, First")
    if (entryNameLower.includes(',')) {
      const lastName = entryNameLower.split(',')[0].trim();
      const lastNameSim = this.calculateSimilarity(queryLower, lastName);
      bestSim = Math.max(bestSim, lastNameSim * 0.85);
    }

    return bestSim;
  }

  // Generate name order variants: "first last" ↔ "last, first"
  nameVariants(name) {
    const variants = [name];
    if (name.includes(',')) {
      const parts = name.split(',').map(p => p.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        variants.push(`${parts[1]} ${parts[0]}`); // "last, first" → "first last"
      }
    } else {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 2) {
        variants.push(`${parts[1]}, ${parts[0]}`); // "first last" → "last, first"
      }
    }
    return variants;
  }

  // ============================================
  // RISK SCORING
  // ============================================

  calculateRisk(matches, name, type) {
    if (matches.length === 0) {
      return { score: 0, level: 'LOW', flags: [] };
    }

    let score = 0;
    const flags = [];
    const topMatch = matches[0];

    // Exact/near-exact match
    if (topMatch.matchConfidence >= 0.95) {
      score += 80;
      flags.push({
        severity: 'CRITICAL',
        type: 'OFAC_SDN_MATCH',
        message: `High-confidence match on OFAC SDN list: "${topMatch.name}" (${(topMatch.matchConfidence * 100).toFixed(0)}% confidence)`
      });
    } else if (topMatch.matchConfidence >= 0.85) {
      score += 50;
      flags.push({
        severity: 'HIGH',
        type: 'OFAC_SDN_POSSIBLE_MATCH',
        message: `Possible match on OFAC SDN list: "${topMatch.name}" (${(topMatch.matchConfidence * 100).toFixed(0)}% confidence)`
      });
    } else {
      score += 25;
      flags.push({
        severity: 'MEDIUM',
        type: 'OFAC_SDN_PARTIAL_MATCH',
        message: `Partial name match on OFAC SDN list: "${topMatch.name}" (${(topMatch.matchConfidence * 100).toFixed(0)}% confidence)`
      });
    }

    // Multiple matches increase risk
    if (matches.length >= 3) {
      score += 10;
      flags.push({
        severity: 'MEDIUM',
        type: 'MULTIPLE_SDN_MATCHES',
        message: `${matches.length} potential matches found on SDN list`
      });
    }

    // High-profile programs
    const criticalPrograms = ['SDGT', 'CYBER2', 'DPRK', 'IRAN', 'SYRIA', 'UKRAINE-EO13661', 'RUSSIA-EO14024'];
    const matchedPrograms = new Set();
    for (const m of matches) {
      for (const p of m.programs) {
        if (criticalPrograms.some(cp => p.includes(cp))) matchedPrograms.add(p);
      }
    }
    if (matchedPrograms.size > 0) {
      score += 10;
      flags.push({
        severity: 'HIGH',
        type: 'CRITICAL_PROGRAM',
        message: `Associated with critical sanctions program(s): ${[...matchedPrograms].join(', ')}`
      });
    }

    // Crypto address match
    const cryptoMatch = matches.some(m => m.matchType === 'crypto_address_exact');
    if (cryptoMatch) {
      score = 100;
      flags.unshift({
        severity: 'CRITICAL',
        type: 'OFAC_CRYPTO_MATCH',
        message: 'Exact cryptocurrency address match on OFAC SDN list'
      });
    }

    const level = score >= 80 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW';

    return {
      score: Math.min(score, 100),
      level,
      flags: flags.sort((a, b) =>
        ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[a.severity] -
        ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[b.severity]
      )
    };
  }

  // ============================================
  // UTILITIES
  // ============================================

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    return (longer.length - this.levenshteinDistance(longer, shorter)) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
        else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[str2.length][str1.length];
  }

  getStatus() {
    return {
      loaded: !!this.cache.sdn,
      entries: this.cache.sdn?.length || 0,
      lastFetched: this.cache.timestamp ? new Date(this.cache.timestamp).toISOString() : null,
      cacheTTL: this.cacheTTL
    };
  }
}

module.exports = { OFACScreeningService };
