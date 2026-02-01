// Vercel Serverless Function - Adverse Media Screening
// POST /api/screening/adverse-media

class AdverseMediaService {
  constructor() {
    this.anthropicKey = process.env.REACT_APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    this.newsApiKey = process.env.NEWS_API_KEY || null;
    this.bingApiKey = process.env.BING_NEWS_API_KEY || null;
  }

  async screen(name, type = 'INDIVIDUAL', options = {}) {
    const { country, additionalTerms = [] } = options;
    const searchTerms = this.buildSearchTerms(name, type, country, additionalTerms);

    const sourcePromises = [
      this.searchGDELT(searchTerms).catch(e => ({ source: 'GDELT', articles: [], error: e.message })),
      this.searchGoogleNewsRSS(searchTerms).catch(e => ({ source: 'Google News', articles: [], error: e.message })),
    ];

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

    sourcePromises.push(
      this.searchGDELTDomain(name, ['sec.gov', 'justice.gov', 'treasury.gov', 'fincen.gov'])
        .catch(e => ({ source: 'Government', articles: [], error: e.message }))
    );

    const results = await Promise.all(sourcePromises);

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

    let analyzedArticles = allArticles;
    if (allArticles.length > 0 && this.anthropicKey) {
      analyzedArticles = await this.analyzeWithAI(name, type, allArticles);
    }

    const riskAssessment = this.calculateRisk(analyzedArticles);

    return {
      subject: name,
      type,
      screeningDate: new Date().toISOString(),
      adverseMedia: {
        status: analyzedArticles.some(a => a.relevance === 'HIGH' || a.category !== 'OTHER') ? 'FINDINGS' : 'CLEAR',
        totalArticles: analyzedArticles.length,
        categories: this.countCategories(analyzedArticles),
        articles: analyzedArticles.slice(0, 20),
      },
      riskScore: riskAssessment.score,
      riskLevel: riskAssessment.level,
      severityCounts: riskAssessment.severityCounts,
      sourcesSearched: sourceSummary,
      suggestedSearchTerms: searchTerms,
    };
  }

  buildSearchTerms(name, type, country, additionalTerms) {
    const complianceTerms = ['sanctions', 'fraud', 'money laundering', 'corruption', 'indictment', 'prosecution', 'investigation', 'enforcement'];
    const baseQuery = `"${name}"`;
    const terms = [baseQuery, ...complianceTerms.slice(0, 4).map(t => `${baseQuery} ${t}`), ...additionalTerms.map(t => `${baseQuery} ${t}`)];
    if (country) terms.push(`${baseQuery} ${country} sanctions`);
    return terms;
  }

  async searchGDELT(searchTerms) {
    const articles = [];
    for (const term of searchTerms.slice(0, 3)) {
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(term)}&mode=ArtList&maxrecords=10&format=json&timespan=2y`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) continue;
        const data = await response.json();
        if (data.articles) {
          for (const a of data.articles) {
            articles.push({
              headline: a.title || '', source: a.domain || 'Unknown',
              sourceCredibility: this.assessSourceCredibility(a.domain || ''),
              date: a.seendate ? a.seendate.substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '',
              summary: a.title || '', url: a.url || '', category: 'OTHER', relevance: 'MEDIUM', rawSource: 'GDELT',
            });
          }
        }
      } catch { /* skip */ }
    }
    return { source: 'GDELT', articles };
  }

  async searchGDELTDomain(name, domains) {
    const articles = [];
    const domainFilter = domains.map(d => `domain:${d}`).join(' OR ');
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`"${name}" (${domainFilter})`)}&mode=ArtList&maxrecords=10&format=json&timespan=5y`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (response.ok) {
        const data = await response.json();
        if (data.articles) {
          for (const a of data.articles) {
            articles.push({
              headline: a.title || '', source: a.domain || 'Government', sourceCredibility: 'HIGH',
              date: a.seendate ? a.seendate.substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '',
              summary: a.title || '', url: a.url || '', category: 'OTHER', relevance: 'HIGH', rawSource: 'Government',
            });
          }
        }
      }
    } catch { /* skip */ }
    return { source: 'Government', articles };
  }

  async searchGoogleNewsRSS(searchTerms) {
    const articles = [];
    for (const term of searchTerms.slice(0, 3)) {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(term)}&hl=en-US&gl=US&ceid=US:en`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) continue;
        const xml = await response.text();
        const items = this.parseRSSItems(xml);
        for (const item of items) {
          articles.push({
            headline: item.title || '', source: item.source || 'Google News',
            sourceCredibility: this.assessSourceCredibility(item.source || ''),
            date: item.pubDate ? new Date(item.pubDate).toISOString().substring(0, 10) : '',
            summary: item.description || item.title || '', url: item.link || '',
            category: 'OTHER', relevance: 'MEDIUM', rawSource: 'Google News',
          });
        }
      } catch { /* skip */ }
    }
    return { source: 'Google News', articles };
  }

  async searchNewsAPI(searchTerms) {
    const articles = [];
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchTerms[0])}&sortBy=relevancy&pageSize=20&apiKey=${this.newsApiKey}`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (response.ok) {
        const data = await response.json();
        if (data.articles) {
          for (const a of data.articles) {
            articles.push({
              headline: a.title || '', source: a.source?.name || 'Unknown',
              sourceCredibility: this.assessSourceCredibility(a.source?.name || ''),
              date: a.publishedAt ? a.publishedAt.substring(0, 10) : '',
              summary: a.description || '', url: a.url || '', category: 'OTHER', relevance: 'MEDIUM', rawSource: 'NewsAPI',
            });
          }
        }
      }
    } catch { /* skip */ }
    return { source: 'NewsAPI', articles };
  }

  async searchBingNews(searchTerms) {
    const articles = [];
    const url = `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(searchTerms[0])}&count=20&mkt=en-US`;
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
              headline: a.name || '', source: a.provider?.[0]?.name || 'Unknown',
              sourceCredibility: this.assessSourceCredibility(a.provider?.[0]?.name || ''),
              date: a.datePublished ? a.datePublished.substring(0, 10) : '',
              summary: a.description || '', url: a.url || '', category: 'OTHER', relevance: 'MEDIUM', rawSource: 'Bing News',
            });
          }
        }
      }
    } catch { /* skip */ }
    return { source: 'Bing News', articles };
  }

  parseRSSItems(xml) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const x = match[1];
      items.push({
        title: this.extractTag(x, 'title'),
        link: this.extractTag(x, 'link'),
        pubDate: this.extractTag(x, 'pubDate'),
        description: this.extractTag(x, 'description'),
        source: this.extractTag(x, 'source'),
      });
    }
    return items;
  }

  extractTag(xml, tag) {
    const m = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, 's').exec(xml);
    return m ? m[1].trim() : '';
  }

  assessSourceCredibility(source) {
    const s = (source || '').toLowerCase();
    const high = ['reuters', 'associated press', 'ap news', 'bbc', 'financial times', 'ft.com', 'wall street journal', 'wsj', 'new york times', 'nytimes', 'bloomberg', 'washington post', 'the guardian', 'sec.gov', 'justice.gov', 'treasury.gov', 'fincen.gov', 'economist', 'politico'];
    const low = ['blog', 'wordpress', 'medium.com', 'substack', 'reddit', 'twitter', 'x.com'];
    if (high.some(h => s.includes(h))) return 'HIGH';
    if (low.some(l => s.includes(l))) return 'LOW';
    return 'MEDIUM';
  }

  deduplicateArticles(articles) {
    const seen = new Map();
    for (const a of articles) {
      const key = a.headline.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 80);
      if (key && !seen.has(key)) seen.set(key, a);
    }
    return Array.from(seen.values());
  }

  async analyzeWithAI(name, type, articles) {
    const batch = articles.slice(0, 20);
    const articleList = batch.map((a, i) => `[${i}] "${a.headline}" - ${a.source} (${a.date})`).join('\n');
    const prompt = `Analyze these news articles about "${name}" (${type}) for compliance adverse media screening.\n\nFor each article, determine:\n1. category: FINANCIAL_CRIME, CORRUPTION, FRAUD, SANCTIONS_EVASION, MONEY_LAUNDERING, or OTHER\n2. relevance: HIGH (directly names subject in negative context), MEDIUM (mentions subject, possibly negative), LOW (tangential or neutral mention)\n3. summary: One sentence describing the adverse finding (or "Not relevant" if not adverse)\n\nArticles:\n${articleList}\n\nRespond with ONLY a JSON array. Each element: {"index": number, "category": "string", "relevance": "string", "summary": "string"}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': this.anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) return batch;
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return batch;
      const analyses = JSON.parse(jsonMatch[0]);
      for (const a of analyses) {
        if (a.index >= 0 && a.index < batch.length) {
          batch[a.index].category = a.category || batch[a.index].category;
          batch[a.index].relevance = a.relevance || batch[a.index].relevance;
          if (a.summary && a.summary !== 'Not relevant') batch[a.index].summary = a.summary;
        }
      }
      return batch;
    } catch { return batch; }
  }

  calculateRisk(articles) {
    const severityCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    let score = 0;
    for (const a of articles) {
      const rel = a.relevance || 'LOW';
      severityCounts[rel] = (severityCounts[rel] || 0) + 1;
      if (rel === 'HIGH') score += 25; else if (rel === 'MEDIUM') score += 10; else score += 3;
      const cat = a.category || 'OTHER';
      if (['SANCTIONS_EVASION', 'MONEY_LAUNDERING'].includes(cat)) score += 15;
      else if (['FINANCIAL_CRIME', 'FRAUD', 'CORRUPTION'].includes(cat)) score += 10;
      if (a.sourceCredibility === 'HIGH') score += 5;
    }
    score = Math.min(score, 100);
    let level;
    if (score >= 70) level = 'CRITICAL'; else if (score >= 40) level = 'HIGH'; else if (score >= 15) level = 'MEDIUM'; else level = 'LOW';
    return { score, level, severityCounts };
  }

  countCategories(articles) {
    const c = { FINANCIAL_CRIME: 0, CORRUPTION: 0, FRAUD: 0, SANCTIONS_EVASION: 0, MONEY_LAUNDERING: 0, OTHER: 0 };
    for (const a of articles) { const cat = a.category || 'OTHER'; if (cat in c) c[cat]++; else c.OTHER++; }
    return c;
  }
}

const service = new AdverseMediaService();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, type, country, additionalTerms } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await service.screen(name, type || 'INDIVIDUAL', { country, additionalTerms });
    res.json(result);
  } catch (error) {
    console.error('Adverse media screening error:', error);
    res.status(500).json({ error: error.message });
  }
}
