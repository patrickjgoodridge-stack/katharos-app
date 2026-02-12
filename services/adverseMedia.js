// AdverseMediaService - Multi-source adverse media screening
// Sources: GDELT (free), Google News RSS (free), NewsAPI (optional), Bing News (optional)
// Comprehensive keyword detection across 8 risk categories

// ── KEYWORD TAXONOMY ──
// Each entry: { patterns: [regex], severity: 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW', weight: number }
// Patterns are case-insensitive and support phrase/variation matching

const KEYWORD_CATEGORIES = {
  FINANCIAL_CRIME: {
    label: 'Financial Crime',
    keywords: [
      // Money laundering
      { patterns: [/money\s*launder/i, /launder(?:ed|ing|s)?\b/i, /layering/i, /structuring/i, /smurfing/i], severity: 'CRITICAL', weight: 30 },
      // Embezzlement & theft
      { patterns: [/embezzle/i, /misappropriat/i, /theft\b/i, /stole\b/i, /stolen\b/i], severity: 'HIGH', weight: 25 },
      // Fraud variants
      { patterns: [/\bfraud\b/i, /defraud/i, /fraudulent/i], severity: 'HIGH', weight: 25 },
      { patterns: [/wire\s*fraud/i, /bank\s*fraud/i, /accounting\s*fraud/i, /securities\s*fraud/i, /insurance\s*fraud/i, /mortgage\s*fraud/i], severity: 'CRITICAL', weight: 30 },
      { patterns: [/financial\s*irregularit/i, /financial\s*misconduct/i, /falsif(?:ied|y|ying)/i, /fabricat(?:ed|ing)/i], severity: 'HIGH', weight: 20 },
      // Bribery & corruption
      { patterns: [/bribe/i, /bribery/i, /kickback/i, /corrupt(?:ion)?\b/i, /\bgraft\b/i], severity: 'CRITICAL', weight: 30 },
      // Tax crimes
      { patterns: [/tax\s*evasion/i, /tax\s*fraud/i], severity: 'HIGH', weight: 25 },
      { patterns: [/offshore\s*account/i, /shell\s*compan/i, /shell\s*corporat/i], severity: 'MEDIUM', weight: 15 },
      // Schemes
      { patterns: [/ponzi/i, /pyramid\s*scheme/i, /insider\s*trading/i, /market\s*manipulation/i], severity: 'CRITICAL', weight: 30 },
      { patterns: [/front\s*company/i, /pass[\s-]*through/i, /nominee/i], severity: 'MEDIUM', weight: 15 },
    ]
  },

  SANCTIONS_EXPORT: {
    label: 'Sanctions & Export Control',
    keywords: [
      { patterns: [/\bsanctioned\b/i, /\bsanctions\b/i, /\bOFAC\b/i, /\bSDN\b/i, /blocked\s*person/i, /designated\s*national/i], severity: 'CRITICAL', weight: 35 },
      { patterns: [/\bembargo(?:ed)?\b/i, /export\s*control/i, /\bITAR\b/i, /\bEAR\b/i], severity: 'HIGH', weight: 25 },
      { patterns: [/proliferation/i, /\bWMD\b/i, /dual[\s-]*use/i, /restricted\s*party/i], severity: 'CRITICAL', weight: 30 },
      { patterns: [/blocked\s*property/i, /specially\s*designated/i], severity: 'CRITICAL', weight: 35 },
      { patterns: [/sanctions?\s*evasion/i, /sanctions?\s*violat/i, /sanctions?\s*bust/i], severity: 'CRITICAL', weight: 35 },
    ]
  },

  ORGANIZED_CRIME: {
    label: 'Organized Crime & Terrorism',
    keywords: [
      // Organized crime
      { patterns: [/organized\s*crime/i, /criminal\s*organi[sz]ation/i, /criminal\s*enterprise/i], severity: 'CRITICAL', weight: 30 },
      { patterns: [/\bcartel\b/i, /\bmafia\b/i, /\bclan\b.*\bcriminal/i, /crime\s*family/i, /criminal\s*syndicate/i], severity: 'CRITICAL', weight: 30 },
      // Trafficking
      { patterns: [/human\s*traffick/i, /sex\s*traffick/i, /labor\s*traffick/i], severity: 'CRITICAL', weight: 35 },
      { patterns: [/drug\s*traffick/i, /narco/i, /narcotic/i, /drug\s*smuggl/i], severity: 'CRITICAL', weight: 30 },
      { patterns: [/\btraffick(?:er|ing|ed)?\b/i, /\bsmuggl(?:er|ing|ed)?\b/i, /contraband/i], severity: 'HIGH', weight: 25 },
      // Terrorism
      { patterns: [/\bterroris[mt]/i, /terror\s*financ/i, /\bextremis[mt]/i, /\bmilitant\b/i], severity: 'CRITICAL', weight: 35 },
      // Gang / RICO
      { patterns: [/\bgang\b/i, /criminal\s*network/i, /racketeer/i, /\bRICO\b/i], severity: 'HIGH', weight: 25 },
      // Prostitution / exploitation
      { patterns: [/prostitut/i, /sex\s*work/i, /sexual\s*exploit/i, /\bpimp(?:ing)?\b/i], severity: 'HIGH', weight: 25 },
      // Violence
      { patterns: [/\bhomicide\b/i, /\bmurder\b/i, /\bassault\b/i, /\bshooting\b/i, /\bstabbing\b/i], severity: 'HIGH', weight: 20 },
      { patterns: [/\bviolence\b/i, /violent\s*crime/i, /armed\s*robbery/i], severity: 'HIGH', weight: 20 },
    ]
  },

  REGULATORY_LEGAL: {
    label: 'Regulatory & Legal',
    keywords: [
      // Criminal proceedings — highest severity
      { patterns: [/\bindicted\b/i, /\bindictment\b/i, /\bcharged\b/i, /criminal\s*complaint/i], severity: 'CRITICAL', weight: 30 },
      { patterns: [/\barrested\b/i, /\bconvicted\b/i, /\bsentenced\b/i, /\bimprisoned\b/i, /\bjailed\b/i], severity: 'CRITICAL', weight: 30 },
      { patterns: [/guilty\s*plea/i, /plea\s*deal/i, /plea\s*agreement/i, /plead(?:ed)?\s*guilty/i], severity: 'CRITICAL', weight: 30 },
      // Investigation — high severity
      { patterns: [/under\s*investigation/i, /\binvestigated\b/i, /\bprobe\b/i, /\binquiry\b/i, /under\s*scrutiny/i], severity: 'HIGH', weight: 20 },
      // Enforcement
      { patterns: [/enforcement\s*action/i, /cease\s*and\s*desist/i, /consent\s*order/i], severity: 'HIGH', weight: 20 },
      { patterns: [/\bdebarred\b/i, /\bsuspended\b/i, /\bexcluded\b/i, /\bbanned\b/i, /\bblacklisted\b/i, /\bprohibited\b/i], severity: 'HIGH', weight: 25 },
      // Legal process
      { patterns: [/\bsubpoena/i, /search\s*warrant/i, /\braided?\b/i, /\bseized?\b/i, /\bforfeiture\b/i, /\bconfiscated?\b/i], severity: 'HIGH', weight: 20 },
      { patterns: [/nuisance\s*property/i, /chronic\s*nuisance/i, /code\s*violation/i], severity: 'MEDIUM', weight: 15 },
      // Civil/regulatory
      { patterns: [/\bpenalty\b/i, /\bfine[ds]?\b/i, /\bsettlement\b/i, /\bviolation\b/i], severity: 'MEDIUM', weight: 10 },
      { patterns: [/\bprosecutio/i, /\bprosecuted\b/i], severity: 'HIGH', weight: 25 },
    ]
  },

  CORPORATE_MISCONDUCT: {
    label: 'Corporate Misconduct',
    keywords: [
      { patterns: [/\bscandal\b/i, /\bcontroversy\b/i, /\bmisconduct\b/i], severity: 'MEDIUM', weight: 10 },
      { patterns: [/\ballegation/i, /\baccused\b/i, /\balleged\b/i], severity: 'MEDIUM', weight: 8 },
      { patterns: [/whistleblower/i, /\bcomplaint\b/i], severity: 'MEDIUM', weight: 10 },
      { patterns: [/\blawsuit\b/i, /\blitigation\b/i, /\bsued\b/i], severity: 'LOW', weight: 5 },
      { patterns: [/\bbankruptcy\b/i, /\binsolven[ct]/i, /\bdefault(?:ed)?\b/i, /\bcollapse[ds]?\b/i], severity: 'MEDIUM', weight: 10 },
      { patterns: [/non[\s-]*compliance/i, /\bbreach\b/i, /\bviolat/i], severity: 'MEDIUM', weight: 10 },
      { patterns: [/\bforged?\b/i, /\bfake[ds]?\b/i, /\bcounterfe/i], severity: 'HIGH', weight: 20 },
    ]
  },

  AML_SPECIFIC: {
    label: 'AML-Specific',
    keywords: [
      { patterns: [/suspicious\s*activit/i, /suspicious\s*transact/i, /\bSAR\b/, /\bCTR\b/], severity: 'HIGH', weight: 25 },
      { patterns: [/KYC\s*failure/i, /due\s*diligence\s*failure/i, /compliance\s*failure/i, /AML\s*violation/i], severity: 'HIGH', weight: 25 },
      { patterns: [/beneficial\s*owner/i], severity: 'LOW', weight: 3 },
      { patterns: [/cash\s*intensive/i, /unusual\s*transact/i, /structured?\s*transact/i], severity: 'MEDIUM', weight: 15 },
      { patterns: [/correspondent\s*bank/i, /nested\s*account/i, /payable[\s-]*through/i], severity: 'MEDIUM', weight: 15 },
    ]
  },

  HIGH_RISK_INDICATORS: {
    label: 'High-Risk Indicators',
    keywords: [
      { patterns: [/politically\s*exposed/i, /\bPEP\b/], severity: 'MEDIUM', weight: 10 },
      { patterns: [/\boligarch\b/i, /kleptocra/i, /illicit\s*wealth/i, /unexplained\s*wealth/i], severity: 'HIGH', weight: 25 },
      { patterns: [/\btax\s*haven\b/i, /secrecy\s*jurisdiction/i], severity: 'MEDIUM', weight: 10 },
      { patterns: [/state[\s-]*owned/i, /government[\s-]*controlled/i], severity: 'LOW', weight: 5 },
      { patterns: [/\bopaque\b/i, /\bconcealed\b/i, /\bhidden\b.*(?:asset|account|owner)/i], severity: 'MEDIUM', weight: 15 },
    ]
  },

  CYBER_MODERN: {
    label: 'Cyber & Modern Crimes',
    keywords: [
      { patterns: [/\bransomware\b/i, /cyber\s*attack/i, /\bhacking\b/i, /\bhacked\b/i, /data\s*breach/i], severity: 'HIGH', weight: 25 },
      { patterns: [/crypto(?:currency)?\s*fraud/i, /crypto\s*scam/i, /rug\s*pull/i, /pig\s*butcher/i], severity: 'HIGH', weight: 25 },
      { patterns: [/dark\s*web/i, /darknet/i, /illicit\s*marketplace/i], severity: 'HIGH', weight: 25 },
      { patterns: [/identity\s*theft/i, /synthetic\s*identity/i, /account\s*takeover/i], severity: 'HIGH', weight: 20 },
      { patterns: [/phishing/i, /social\s*engineer/i], severity: 'MEDIUM', weight: 10 },
    ]
  },
};

// ── NEGATIVE KEYWORDS — reduce false positive scores ──
const NEGATIVE_KEYWORDS = [
  { patterns: [/no\s*evidence\s*of/i], weight: -20 },
  { patterns: [/cleared\s*of/i, /\bacquitted\b/i], weight: -30 },
  { patterns: [/\bdismissed\b/i, /\bunfounded\b/i, /\bexonerat/i], weight: -25 },
  { patterns: [/denied\s*allegation/i, /denies\s*allegation/i], weight: -10 },
  { patterns: [/settled\s*without\s*admiss/i, /no\s*wrongdoing/i, /without\s*admitting/i], weight: -15 },
  { patterns: [/charges?\s*dropped/i, /charges?\s*withdrawn/i, /not\s*guilty/i], weight: -25 },
  { patterns: [/no\s*charges?\s*filed/i, /declined\s*to\s*prosecute/i], weight: -20 },
];

// ── SEARCH TERM BUCKETS — used to build GDELT/Google queries ──
const SEARCH_BUCKETS = {
  financial: ['fraud', 'money laundering', 'embezzlement', 'bribery', 'corruption', 'Ponzi', 'insider trading'],
  sanctions: ['sanctions', 'OFAC', 'sanctioned', 'embargo', 'designated'],
  criminal: ['indicted', 'arrested', 'convicted', 'criminal', 'trafficking', 'cartel'],
  violence: ['human trafficking', 'drug trafficking', 'prostitution', 'shooting', 'homicide', 'violence'],
  regulatory: ['enforcement action', 'investigation', 'penalty', 'fine', 'violation', 'debarred'],
  cyber: ['ransomware', 'hacking', 'data breach', 'crypto fraud', 'scam'],
  misconduct: ['scandal', 'misconduct', 'whistleblower', 'lawsuit', 'bankruptcy'],
};


class AdverseMediaService {
  constructor() {
    this.anthropicKey = process.env.REACT_APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    this.newsApiKey = process.env.NEWS_API_KEY || null;
    this.bingApiKey = process.env.BING_NEWS_API_KEY || null;
  }

  // ── KEYWORD SCANNER ──
  // Scans text against the full taxonomy. Returns { matches, categories, totalWeight, negativeWeight, netWeight }
  scanKeywords(text) {
    if (!text) return { matches: [], categories: {}, totalWeight: 0, negativeWeight: 0, netWeight: 0 };

    const normalizedText = text.toLowerCase();
    const matches = [];
    const categories = {};
    let totalWeight = 0;

    // Scan all keyword categories
    for (const [catKey, catDef] of Object.entries(KEYWORD_CATEGORIES)) {
      for (const kw of catDef.keywords) {
        for (const pattern of kw.patterns) {
          const match = pattern.exec(normalizedText);
          if (match) {
            matches.push({
              keyword: match[0],
              category: catKey,
              categoryLabel: catDef.label,
              severity: kw.severity,
              weight: kw.weight,
            });
            totalWeight += kw.weight;
            categories[catKey] = (categories[catKey] || 0) + 1;
            break; // Only count each keyword group once per text
          }
        }
      }
    }

    // Check negative keywords
    let negativeWeight = 0;
    for (const neg of NEGATIVE_KEYWORDS) {
      for (const pattern of neg.patterns) {
        if (pattern.test(normalizedText)) {
          negativeWeight += neg.weight; // neg.weight is already negative
          break;
        }
      }
    }

    return {
      matches,
      categories,
      totalWeight,
      negativeWeight,
      netWeight: Math.max(0, totalWeight + negativeWeight),
    };
  }

  // Scan an article's headline + summary and annotate it with keyword matches
  annotateArticle(article) {
    const combinedText = `${article.headline || ''} ${article.summary || ''}`;
    const scan = this.scanKeywords(combinedText);

    if (scan.matches.length > 0) {
      article.keywordMatches = scan.matches;
      article.keywordCategories = scan.categories;
      article.keywordWeight = scan.netWeight;

      // Determine the highest severity keyword match
      const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      let maxSeverity = 'LOW';
      for (const m of scan.matches) {
        if ((severityOrder[m.severity] || 0) > (severityOrder[maxSeverity] || 0)) {
          maxSeverity = m.severity;
        }
      }
      article.keywordSeverity = maxSeverity;

      // Override category if keyword scan found a specific one (before AI analysis)
      if (scan.matches.length > 0 && article.category === 'OTHER') {
        // Use the highest-weight match's category
        const topMatch = scan.matches.reduce((a, b) => a.weight > b.weight ? a : b);
        article.category = topMatch.category;
      }

      // Upgrade relevance based on keyword severity
      if (maxSeverity === 'CRITICAL' && article.relevance !== 'HIGH') {
        article.relevance = 'HIGH';
      } else if (maxSeverity === 'HIGH' && article.relevance === 'LOW') {
        article.relevance = 'MEDIUM';
      }
    }

    return article;
  }

  // Main screening method
  async screen(name, type = 'INDIVIDUAL', options = {}) {
    const { country, additionalTerms = [] } = options;
    const searchTerms = this.buildSearchTerms(name, type, country, additionalTerms);

    // Search all available sources in parallel
    const sourcePromises = [
      this.searchGDELT(searchTerms).catch(e => ({ source: 'GDELT', articles: [], error: e.message })),
      this.searchGoogleNewsRSS(searchTerms).catch(e => ({ source: 'Google News', articles: [], error: e.message })),
    ];

    // Add optional sources if API keys are configured
    if (this.newsApiKey) {
      sourcePromises.push(
        this.searchNewsAPI(searchTerms).catch(e => ({ source: 'NewsAPI', articles: [], error: e.message }))
      );
    }
    if (this.bingApiKey) {
      sourcePromises.push(
        this.searchBingNews(searchTerms).catch(e => ({ source: 'Bing News', articles: [], error: e.message }))
      );
    }

    // Add government/regulatory source searches
    sourcePromises.push(
      this.searchGDELTDomain(name, ['sec.gov', 'justice.gov', 'treasury.gov', 'fincen.gov', 'fbi.gov', 'dea.gov', 'ice.gov', 'atf.gov', 'seattle.gov', 'nyc.gov', 'lapd.com', 'chicagopolice.org'])
        .catch(e => ({ source: 'Government', articles: [], error: e.message }))
    );

    // Wayback Machine — historical web captures
    sourcePromises.push(
      this.searchWaybackMachine(name).catch(e => ({ source: 'Wayback Machine', articles: [], error: e.message }))
    );

    // MediaCloud — open-source media analysis
    sourcePromises.push(
      this.searchMediaCloud(name).catch(e => ({ source: 'MediaCloud', articles: [], error: e.message }))
    );

    const results = await Promise.all(sourcePromises);

    // Flatten and deduplicate articles
    let allArticles = [];
    const sourceSummary = {};
    for (const result of results) {
      sourceSummary[result.source] = {
        count: result.articles?.length || 0,
        error: result.error || null,
      };
      if (result.articles?.length) {
        allArticles.push(...result.articles);
      }
    }

    allArticles = this.deduplicateArticles(allArticles);

    // ── Step 1: Keyword scan all articles ──
    allArticles = allArticles.map(a => this.annotateArticle(a));

    // ── Step 2: AI analysis of articles ──
    let analyzedArticles = allArticles;
    if (allArticles.length > 0 && this.anthropicKey) {
      analyzedArticles = await this.analyzeWithAI(name, type, allArticles);
    }

    // Calculate risk score (uses both keyword weights and AI categories)
    const riskAssessment = this.calculateRisk(analyzedArticles);

    return {
      subject: name,
      type,
      screeningDate: new Date().toISOString(),
      adverseMedia: {
        status: analyzedArticles.some(a => a.relevance === 'HIGH' || a.category !== 'OTHER') ? 'FINDINGS' : 'CLEAR',
        totalArticles: analyzedArticles.length,
        categories: this.countCategories(analyzedArticles),
        articles: analyzedArticles.slice(0, 20), // Cap at 20
      },
      riskScore: riskAssessment.score,
      riskLevel: riskAssessment.level,
      severityCounts: riskAssessment.severityCounts,
      keywordSummary: riskAssessment.keywordSummary,
      sourcesSearched: sourceSummary,
      suggestedSearchTerms: searchTerms,
    };
  }

  buildSearchTerms(name, type, country, additionalTerms) {
    const baseQuery = `"${name}"`;
    const terms = [baseQuery];

    // Pick 2 terms from each bucket for broad coverage (14 search queries total)
    for (const bucket of Object.values(SEARCH_BUCKETS)) {
      for (const term of bucket.slice(0, 2)) {
        terms.push(`${baseQuery} ${term}`);
      }
    }

    // Generate name variants for "LAST, First" format (common in OFAC/sanctions data)
    const nameVariants = this.generateNameVariants(name);
    for (const variant of nameVariants) {
      if (variant !== name) {
        terms.push(`"${variant}" sanctions`, `"${variant}" criminal`, `"${variant}"`);
      }
    }

    terms.push(...additionalTerms.map(t => `${baseQuery} ${t}`));
    if (country) {
      terms.push(`${baseQuery} ${country} sanctions`, `${baseQuery} ${country} criminal`);
    }
    return terms;
  }

  generateNameVariants(name) {
    const variants = [name];
    // Handle "LAST, First" → "First Last"
    if (name.includes(',')) {
      const parts = name.split(',').map(p => p.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        const firstLast = `${parts[1]} ${parts[0].charAt(0) + parts[0].slice(1).toLowerCase()}`;
        variants.push(firstLast);
        variants.push(`${parts[1]} ${parts[0]}`);
        if (parts[0].length > 4) variants.push(parts[0]);
      }
    } else {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 2) {
        variants.push(`${parts[1]}, ${parts[0]}`);
        variants.push(`${parts[1].toUpperCase()}, ${parts[0]}`);
      }
    }
    return variants;
  }

  // Simple delay helper for rate limiting
  _delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  // GDELT DOC API - free, no key needed (sequential with 300ms delay to respect rate limits)
  async searchGDELT(searchTerms) {
    const articles = [];
    for (const term of searchTerms.slice(0, 8)) {
      const query = encodeURIComponent(term);
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=10&format=json&timespan=2y`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) { await this._delay(300); continue; }
        const data = await response.json();
        if (data.articles) {
          for (const a of data.articles) {
            articles.push({
              headline: a.title || '',
              source: a.domain || a.source || 'Unknown',
              sourceCredibility: this.assessSourceCredibility(a.domain || ''),
              date: a.seendate ? a.seendate.substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '',
              summary: a.title || '',
              url: a.url || '',
              category: 'OTHER',
              relevance: 'MEDIUM',
              rawSource: 'GDELT',
            });
          }
        }
      } catch {
        // Skip failed queries
      }
      await this._delay(300);
    }
    return { source: 'GDELT', articles };
  }

  // GDELT domain-filtered search for government/regulatory sources
  async searchGDELTDomain(name, domains) {
    const articles = [];
    const domainFilter = domains.map(d => `domain:${d}`).join(' OR ');
    const query = encodeURIComponent(`"${name}" (${domainFilter})`);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=10&format=json&timespan=5y`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (response.ok) {
        const data = await response.json();
        if (data.articles) {
          for (const a of data.articles) {
            articles.push({
              headline: a.title || '',
              source: a.domain || 'Government',
              sourceCredibility: 'HIGH',
              date: a.seendate ? a.seendate.substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '',
              summary: a.title || '',
              url: a.url || '',
              category: 'OTHER',
              relevance: 'HIGH',
              rawSource: 'Government',
            });
          }
        }
      }
    } catch {
      // Skip
    }
    return { source: 'Government', articles };
  }

  // Google News RSS - free, no key needed (sequential with 300ms delay)
  async searchGoogleNewsRSS(searchTerms) {
    const articles = [];
    for (const term of searchTerms.slice(0, 8)) {
      const query = encodeURIComponent(term);
      const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) { await this._delay(300); continue; }
        const xml = await response.text();
        const items = this.parseRSSItems(xml);
        for (const item of items) {
          articles.push({
            headline: item.title || '',
            source: item.source || 'Google News',
            sourceCredibility: this.assessSourceCredibility(item.source || ''),
            date: item.pubDate ? new Date(item.pubDate).toISOString().substring(0, 10) : '',
            summary: item.description || item.title || '',
            url: item.link || '',
            category: 'OTHER',
            relevance: 'MEDIUM',
            rawSource: 'Google News',
          });
        }
      } catch {
        // Skip failed queries
      }
      await this._delay(300);
    }
    return { source: 'Google News', articles };
  }

  // NewsAPI - requires API key
  async searchNewsAPI(searchTerms) {
    const articles = [];
    const query = searchTerms[0]; // Use primary search term
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=20&apiKey=${this.newsApiKey}`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (response.ok) {
        const data = await response.json();
        if (data.articles) {
          for (const a of data.articles) {
            articles.push({
              headline: a.title || '',
              source: a.source?.name || 'Unknown',
              sourceCredibility: this.assessSourceCredibility(a.source?.name || ''),
              date: a.publishedAt ? a.publishedAt.substring(0, 10) : '',
              summary: a.description || '',
              url: a.url || '',
              category: 'OTHER',
              relevance: 'MEDIUM',
              rawSource: 'NewsAPI',
            });
          }
        }
      }
    } catch {
      // Skip
    }
    return { source: 'NewsAPI', articles };
  }

  // Bing News API - requires API key
  async searchBingNews(searchTerms) {
    const articles = [];
    const query = searchTerms[0];
    const url = `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(query)}&count=20&mkt=en-US`;
    try {
      const response = await fetch(url, {
        headers: { 'Ocp-Apim-Subscription-Key': this.bingApiKey },
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.value) {
          for (const a of data.value) {
            articles.push({
              headline: a.name || '',
              source: a.provider?.[0]?.name || 'Unknown',
              sourceCredibility: this.assessSourceCredibility(a.provider?.[0]?.name || ''),
              date: a.datePublished ? a.datePublished.substring(0, 10) : '',
              summary: a.description || '',
              url: a.url || '',
              category: 'OTHER',
              relevance: 'MEDIUM',
              rawSource: 'Bing News',
            });
          }
        }
      }
    } catch {
      // Skip
    }
    return { source: 'Bing News', articles };
  }

  // Wayback Machine CDX API — historical captures of pages mentioning the subject
  async searchWaybackMachine(name) {
    const articles = [];
    // Search for archived pages from key regulatory/news domains mentioning the name
    const domains = ['reuters.com', 'bbc.co.uk', 'justice.gov', 'sec.gov', 'ft.com'];
    for (const domain of domains) {
      try {
        const url = `https://web.archive.org/cdx/search/cdx?url=${domain}/*&output=json&limit=5&filter=statuscode:200&fl=original,timestamp,mimetype&matchType=domain&collapse=urlkey&query=${encodeURIComponent(name)}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) continue;
        const data = await response.json();
        // First row is headers
        for (const row of data.slice(1)) {
          const [original, timestamp, mimetype] = row;
          if (mimetype && !mimetype.includes('html')) continue;
          const dateStr = timestamp ? `${timestamp.substring(0, 4)}-${timestamp.substring(4, 6)}-${timestamp.substring(6, 8)}` : '';
          articles.push({
            headline: `Archived page from ${domain}`,
            source: domain,
            sourceCredibility: this.assessSourceCredibility(domain),
            date: dateStr,
            summary: `Wayback Machine capture: ${original}`,
            url: `https://web.archive.org/web/${timestamp}/${original}`,
            category: 'OTHER',
            relevance: 'LOW',
            rawSource: 'Wayback Machine',
          });
        }
      } catch {
        // Skip individual domain failures
      }
    }
    return { source: 'Wayback Machine', articles };
  }

  // MediaCloud — open-source news/media analysis platform
  async searchMediaCloud(name) {
    const articles = [];
    try {
      const query = encodeURIComponent(`"${name}"`);
      // MediaCloud search API (public, rate-limited)
      const response = await fetch(`https://search.mediacloud.org/api/search?q=${query}&limit=10`, {
        signal: AbortSignal.timeout(15000),
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) return { source: 'MediaCloud', articles: [] };
      const data = await response.json();
      for (const item of (data.results || data.articles || data.stories || [])) {
        articles.push({
          headline: item.title || item.headline || '',
          source: item.media_name || item.source || 'MediaCloud',
          sourceCredibility: this.assessSourceCredibility(item.media_name || item.source || ''),
          date: item.publish_date ? item.publish_date.substring(0, 10) : '',
          summary: item.snippet || item.title || '',
          url: item.url || item.stories_id ? `https://search.mediacloud.org/stories/${item.stories_id}` : '',
          category: 'OTHER',
          relevance: 'MEDIUM',
          rawSource: 'MediaCloud',
        });
      }
    } catch {
      // Skip
    }
    return { source: 'MediaCloud', articles };
  }

  parseRSSItems(xml) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      const title = this.extractTag(itemXml, 'title');
      const link = this.extractTag(itemXml, 'link');
      const pubDate = this.extractTag(itemXml, 'pubDate');
      const description = this.extractTag(itemXml, 'description');
      const source = this.extractTag(itemXml, 'source');
      items.push({ title, link, pubDate, description, source });
    }
    return items;
  }

  extractTag(xml, tag) {
    const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, 's');
    const match = regex.exec(xml);
    return match ? match[1].trim() : '';
  }

  assessSourceCredibility(source) {
    const highCredibility = [
      'reuters', 'associated press', 'ap news', 'bbc', 'financial times', 'ft.com',
      'wall street journal', 'wsj', 'new york times', 'nytimes', 'bloomberg',
      'washington post', 'the guardian', 'sec.gov', 'justice.gov', 'treasury.gov',
      'fincen.gov', 'ofac', 'economist', 'politico', 'fbi.gov', 'dea.gov',
      'seattle.gov', 'nyc.gov', 'chicagopolice.org',
    ];
    const lowCredibility = [
      'blog', 'wordpress', 'medium.com', 'substack', 'reddit', 'twitter', 'x.com',
    ];
    const s = (source || '').toLowerCase();
    if (highCredibility.some(h => s.includes(h))) return 'HIGH';
    if (lowCredibility.some(l => s.includes(l))) return 'LOW';
    return 'MEDIUM';
  }

  deduplicateArticles(articles) {
    const seen = new Map();
    for (const article of articles) {
      // Normalize headline for dedup
      const key = article.headline.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 80);
      if (!key) continue;
      if (!seen.has(key)) {
        seen.set(key, article);
      }
    }
    return Array.from(seen.values());
  }

  // Use Claude to analyze and categorize articles
  async analyzeWithAI(name, type, articles) {
    if (!this.anthropicKey || articles.length === 0) return articles;

    // Batch articles for analysis (max 15 for thoroughness)
    const batch = articles.slice(0, 15);
    const articleList = batch.map((a, i) =>
      `[${i}] "${a.headline}" - ${a.source} (${a.date})${a.keywordMatches?.length ? ' [Keywords: ' + a.keywordMatches.map(m => m.keyword).join(', ') + ']' : ''}`
    ).join('\n');

    const prompt = `Analyze these news articles about "${name}" (${type}) for compliance and criminal risk screening.

For each article, determine:
1. category: One of: FINANCIAL_CRIME, SANCTIONS_EXPORT, ORGANIZED_CRIME, REGULATORY_LEGAL, CORPORATE_MISCONDUCT, AML_SPECIFIC, HIGH_RISK_INDICATORS, CYBER_MODERN, or OTHER
2. relevance: HIGH (directly names subject in negative context), MEDIUM (mentions subject, possibly negative), LOW (tangential or neutral mention)
3. summary: One sentence describing the adverse finding (or "Not relevant" if neutral)

Important: Look for ALL types of risk, not just financial. Human trafficking, drug trafficking, prostitution, violence, organized crime, nuisance properties, police crackdowns — these are ALL relevant adverse media findings.

Articles:
${articleList}

Respond with ONLY a JSON array. Each element: {"index": number, "category": "string", "relevance": "string", "summary": "string"}
Do not include any text outside the JSON array.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) return batch;

      const data = await response.json();
      const text = data.content?.[0]?.text || '';

      // Extract JSON array from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return batch;

      const analyses = JSON.parse(jsonMatch[0]);
      for (const analysis of analyses) {
        const idx = analysis.index;
        if (idx >= 0 && idx < batch.length) {
          // AI category overrides keyword category if more specific
          if (analysis.category && analysis.category !== 'OTHER') {
            batch[idx].category = analysis.category;
          }
          batch[idx].relevance = analysis.relevance || batch[idx].relevance;
          if (analysis.summary && analysis.summary !== 'Not relevant') {
            batch[idx].summary = analysis.summary;
          }
        }
      }
      return batch;
    } catch {
      return batch;
    }
  }

  calculateRisk(articles) {
    const severityCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    const keywordSummary = {}; // category → count of keyword matches
    let score = 0;

    for (const article of articles) {
      const rel = article.relevance || 'LOW';
      severityCounts[rel] = (severityCounts[rel] || 0) + 1;

      // Points by relevance
      if (rel === 'HIGH') score += 25;
      else if (rel === 'MEDIUM') score += 10;
      else score += 3;

      // Bonus points for serious categories
      const cat = article.category || 'OTHER';
      if (['SANCTIONS_EXPORT', 'ORGANIZED_CRIME'].includes(cat)) score += 20;
      else if (['FINANCIAL_CRIME', 'AML_SPECIFIC'].includes(cat)) score += 15;
      else if (['REGULATORY_LEGAL', 'CYBER_MODERN'].includes(cat)) score += 10;
      else if (['CORPORATE_MISCONDUCT', 'HIGH_RISK_INDICATORS'].includes(cat)) score += 5;

      // Keyword weight bonus (from the scanner)
      if (article.keywordWeight > 0) {
        score += Math.min(article.keywordWeight, 30); // Cap keyword contribution per article
      }

      // High-credibility source bonus
      if (article.sourceCredibility === 'HIGH') score += 5;

      // Track keyword categories
      if (article.keywordMatches?.length) {
        for (const m of article.keywordMatches) {
          keywordSummary[m.categoryLabel] = (keywordSummary[m.categoryLabel] || 0) + 1;
        }
      }
    }

    // Cap at 100
    score = Math.min(score, 100);

    let level;
    if (score >= 70) level = 'CRITICAL';
    else if (score >= 40) level = 'HIGH';
    else if (score >= 15) level = 'MEDIUM';
    else level = 'LOW';

    return { score, level, severityCounts, keywordSummary };
  }

  countCategories(articles) {
    const counts = {
      FINANCIAL_CRIME: 0,
      SANCTIONS_EXPORT: 0,
      ORGANIZED_CRIME: 0,
      REGULATORY_LEGAL: 0,
      CORPORATE_MISCONDUCT: 0,
      AML_SPECIFIC: 0,
      HIGH_RISK_INDICATORS: 0,
      CYBER_MODERN: 0,
      OTHER: 0,
    };
    for (const a of articles) {
      const cat = a.category || 'OTHER';
      if (cat in counts) counts[cat]++;
      else counts.OTHER++;
    }
    return counts;
  }
}

module.exports = { AdverseMediaService, KEYWORD_CATEGORIES, NEGATIVE_KEYWORDS, SEARCH_BUCKETS };
