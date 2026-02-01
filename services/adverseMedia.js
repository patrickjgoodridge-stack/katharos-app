// AdverseMediaService - Multi-source adverse media screening
// Sources: GDELT (free), Google News RSS (free), NewsAPI (optional), Bing News (optional)

class AdverseMediaService {
  constructor() {
    this.anthropicKey = process.env.REACT_APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    this.newsApiKey = process.env.NEWS_API_KEY || null;
    this.bingApiKey = process.env.BING_NEWS_API_KEY || null;
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
      this.searchGDELTDomain(name, ['sec.gov', 'justice.gov', 'treasury.gov', 'fincen.gov'])
        .catch(e => ({ source: 'Government', articles: [], error: e.message }))
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

    // AI analysis of articles
    let analyzedArticles = allArticles;
    if (allArticles.length > 0 && this.anthropicKey) {
      analyzedArticles = await this.analyzeWithAI(name, type, allArticles);
    }

    // Calculate risk score
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
      sourcesSearched: sourceSummary,
      suggestedSearchTerms: searchTerms,
    };
  }

  buildSearchTerms(name, type, country, additionalTerms) {
    const complianceTerms = [
      'sanctions', 'fraud', 'money laundering', 'corruption',
      'indictment', 'prosecution', 'investigation', 'enforcement',
      'penalty', 'fine', 'settlement', 'violation',
    ];
    const baseQuery = `"${name}"`;
    const terms = [
      baseQuery,
      ...complianceTerms.slice(0, 4).map(t => `${baseQuery} ${t}`),
      ...additionalTerms.map(t => `${baseQuery} ${t}`),
    ];
    if (country) {
      terms.push(`${baseQuery} ${country} sanctions`);
    }
    return terms;
  }

  // GDELT DOC API - free, no key needed
  async searchGDELT(searchTerms) {
    const articles = [];
    // Use the first 3 search terms to avoid overloading
    for (const term of searchTerms.slice(0, 3)) {
      const query = encodeURIComponent(term);
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=10&format=json&timespan=2y`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) continue;
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
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
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

  // Google News RSS - free, no key needed
  async searchGoogleNewsRSS(searchTerms) {
    const articles = [];
    for (const term of searchTerms.slice(0, 3)) {
      const query = encodeURIComponent(term);
      const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) continue;
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
    }
    return { source: 'Google News', articles };
  }

  // NewsAPI - requires API key
  async searchNewsAPI(searchTerms) {
    const articles = [];
    const query = searchTerms[0]; // Use primary search term
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=20&apiKey=${this.newsApiKey}`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
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
        signal: AbortSignal.timeout(10000),
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
      'fincen.gov', 'ofac', 'economist', 'politico',
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

    // Batch articles for analysis (max 20)
    const batch = articles.slice(0, 20);
    const articleList = batch.map((a, i) =>
      `[${i}] "${a.headline}" - ${a.source} (${a.date})`
    ).join('\n');

    const prompt = `Analyze these news articles about "${name}" (${type}) for compliance adverse media screening.

For each article, determine:
1. category: FINANCIAL_CRIME, CORRUPTION, FRAUD, SANCTIONS_EVASION, MONEY_LAUNDERING, or OTHER
2. relevance: HIGH (directly names subject in negative context), MEDIUM (mentions subject, possibly negative), LOW (tangential or neutral mention)
3. summary: One sentence describing the adverse finding (or "Not relevant" if the article is not adverse media)

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
        signal: AbortSignal.timeout(30000),
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
          batch[idx].category = analysis.category || batch[idx].category;
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
      if (['SANCTIONS_EVASION', 'MONEY_LAUNDERING'].includes(cat)) score += 15;
      else if (['FINANCIAL_CRIME', 'FRAUD', 'CORRUPTION'].includes(cat)) score += 10;

      // High-credibility source bonus
      if (article.sourceCredibility === 'HIGH') score += 5;
    }

    // Cap at 100
    score = Math.min(score, 100);

    let level;
    if (score >= 70) level = 'CRITICAL';
    else if (score >= 40) level = 'HIGH';
    else if (score >= 15) level = 'MEDIUM';
    else level = 'LOW';

    return { score, level, severityCounts };
  }

  countCategories(articles) {
    const counts = {
      FINANCIAL_CRIME: 0,
      CORRUPTION: 0,
      FRAUD: 0,
      SANCTIONS_EVASION: 0,
      MONEY_LAUNDERING: 0,
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

module.exports = { AdverseMediaService };
