// Sanctions Announcement Screening Service
// Checks official government announcement pages for entity mentions
// Catches designations BEFORE official lists update

class SanctionsAnnouncementService {
  constructor() {
    this.cache = new Map(); // key: url -> { data, timestamp }
    this.cacheTTL = {
      rss: 30 * 60 * 1000,        // 30 min for RSS feeds
      press: 0,                     // No cache for press releases
      api: 12 * 60 * 60 * 1000,   // 12 hours for OpenSanctions
      gdelt: 15 * 60 * 1000,      // 15 min for GDELT
    };
    this.sanctionsKeywords = [
      'sanctioned', 'designated', 'blocked', 'frozen', 'prohibited',
      'restricted', 'specially designated', 'SDN', 'OFAC', 'asset freeze',
      'travel ban', 'arms embargo', 'executive order', 'listed',
      'sanctions evasion', 'sectoral sanctions', 'secondary sanctions'
    ];
  }

  getCached(key, ttl) {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < ttl) return entry.data;
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async screen(entityName, options = {}) {
    const startTime = Date.now();
    const nameVariants = this.generateNameVariants(entityName);
    const results = [];
    const sourceSummary = {};

    // Run all source checks in parallel
    const checks = [
      this.searchOpenSanctions(entityName, nameVariants)
        .then(r => { sourceSummary['OpenSanctions'] = { count: r.length, error: null }; return r; })
        .catch(e => { sourceSummary['OpenSanctions'] = { count: 0, error: e.message }; return []; }),

      this.searchOFACRecentActions(nameVariants)
        .then(r => { sourceSummary['OFAC Recent Actions'] = { count: r.length, error: null }; return r; })
        .catch(e => { sourceSummary['OFAC Recent Actions'] = { count: 0, error: e.message }; return []; }),

      this.searchTreasuryPressReleases(nameVariants)
        .then(r => { sourceSummary['Treasury Press'] = { count: r.length, error: null }; return r; })
        .catch(e => { sourceSummary['Treasury Press'] = { count: 0, error: e.message }; return []; }),

      this.searchGovDomains(entityName, nameVariants)
        .then(r => { sourceSummary['Government Sources'] = { count: r.length, error: null }; return r; })
        .catch(e => { sourceSummary['Government Sources'] = { count: 0, error: e.message }; return []; }),

      this.searchEUCouncil(nameVariants)
        .then(r => { sourceSummary['EU Council'] = { count: r.length, error: null }; return r; })
        .catch(e => { sourceSummary['EU Council'] = { count: 0, error: e.message }; return []; }),

      this.searchUKOFSI(nameVariants)
        .then(r => { sourceSummary['UK OFSI'] = { count: r.length, error: null }; return r; })
        .catch(e => { sourceSummary['UK OFSI'] = { count: 0, error: e.message }; return []; }),

      this.searchSanctionsNews(entityName, nameVariants)
        .then(r => { sourceSummary['Sanctions News'] = { count: r.length, error: null }; return r; })
        .catch(e => { sourceSummary['Sanctions News'] = { count: 0, error: e.message }; return []; }),
    ];

    const allResults = await Promise.all(checks);
    for (const batch of allResults) results.push(...batch);

    // Deduplicate by URL
    const seen = new Set();
    const unique = [];
    for (const r of results) {
      const key = r.url || r.title;
      if (!seen.has(key)) { seen.add(key); unique.push(r); }
    }

    // Sort by severity then confidence
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    unique.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3) || b.confidence - a.confidence);

    return {
      entity: entityName,
      totalFindings: unique.length,
      findings: unique.slice(0, 30),
      sourcesChecked: sourceSummary,
      hasSanctionsAnnouncement: unique.some(r => r.severity === 'CRITICAL' || r.confidence >= 0.9),
      riskDelta: this.calculateRiskDelta(unique),
      screenedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  }

  // ============================================
  // SOURCE: OpenSanctions API
  // ============================================
  async searchOpenSanctions(name, variants) {
    const cached = this.getCached(`opensanctions:${name}`, this.cacheTTL.api);
    if (cached) return cached;

    const results = [];
    const url = `https://api.opensanctions.org/match/default?algorithm=best&limit=5`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          schema: 'Person',
          properties: { name: [name, ...variants.slice(0, 3)] }
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.responses) {
          for (const match of Object.values(data.responses)) {
            if (match.results) {
              for (const r of match.results) {
                if (r.score >= 0.5) {
                  const datasets = (r.datasets || []).join(', ');
                  const isSanctioned = datasets.toLowerCase().includes('sanction') ||
                    (r.properties?.topics || []).some(t => t.includes('sanction'));
                  results.push({
                    source: 'OpenSanctions',
                    sourceType: 'API',
                    title: r.caption || r.name || name,
                    url: `https://opensanctions.org/entities/${r.id}/`,
                    confidence: r.score,
                    severity: r.score >= 0.9 && isSanctioned ? 'CRITICAL' : r.score >= 0.7 ? 'HIGH' : 'MEDIUM',
                    details: `Datasets: ${datasets}. Topics: ${(r.properties?.topics || []).join(', ')}`,
                    datasets: r.datasets || [],
                    sanctioned: isSanctioned,
                  });
                }
              }
            }
          }
        }
      } else if (response.status === 429) {
        console.warn('[SanctionsAnnouncements] OpenSanctions rate limited');
      }
    } catch (e) {
      console.error('[SanctionsAnnouncements] OpenSanctions error:', e.message);
    }

    this.setCache(`opensanctions:${name}`, results);
    return results;
  }

  // ============================================
  // SOURCE: OFAC Recent Actions (RSS)
  // ============================================
  async searchOFACRecentActions(variants) {
    const cached = this.getCached('ofac-rss', this.cacheTTL.rss);
    let items = cached;

    if (!items) {
      items = [];
      try {
        const response = await fetch('https://ofac.treasury.gov/recent-actions/rss.xml', {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Marlowe-AML/1.0)' },
          signal: AbortSignal.timeout(10000),
        });
        if (response.ok) {
          const xml = await response.text();
          items = this.parseRSSItems(xml);
          this.setCache('ofac-rss', items);
        }
      } catch (e) {
        console.error('[SanctionsAnnouncements] OFAC RSS error:', e.message);
      }
    }

    return this.matchItemsToEntity(items, variants, 'OFAC Recent Actions', 'RSS');
  }

  // ============================================
  // SOURCE: Treasury Press Releases (GDELT)
  // ============================================
  async searchTreasuryPressReleases(variants) {
    const results = [];
    for (const variant of variants.slice(0, 2)) {
      const query = `"${variant}" (domain:treasury.gov OR domain:home.treasury.gov)`;
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=10&format=json&timespan=1y`;

      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) continue;
        const data = await response.json();
        if (data.articles) {
          for (const a of data.articles) {
            const title = (a.title || '').toLowerCase();
            const hasSanctionsKw = this.sanctionsKeywords.some(kw => title.includes(kw));
            if (hasSanctionsKw || title.includes(variants[0].toLowerCase())) {
              results.push({
                source: 'Treasury Press Release',
                sourceType: 'Government',
                title: a.title || '',
                url: a.url || '',
                date: a.seendate ? a.seendate.substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '',
                confidence: hasSanctionsKw ? 0.9 : 0.7,
                severity: hasSanctionsKw ? 'CRITICAL' : 'HIGH',
                details: `Found on ${a.domain || 'treasury.gov'}`,
              });
            }
          }
        }
      } catch { /* skip */ }
    }
    return results;
  }

  // ============================================
  // SOURCE: Government Domains via GDELT
  // ============================================
  async searchGovDomains(name, variants) {
    const domains = [
      'state.gov', 'justice.gov', 'bis.doc.gov', 'fincen.gov',
      'sec.gov', 'consilium.europa.eu', 'gov.uk'
    ];
    const results = [];
    const domainFilter = domains.map(d => `domain:${d}`).join(' OR ');
    const query = `"${name}" (${domainFilter})`;
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=15&format=json&timespan=2y`;

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (response.ok) {
        const data = await response.json();
        if (data.articles) {
          for (const a of data.articles) {
            const title = (a.title || '').toLowerCase();
            const hasSanctionsKw = this.sanctionsKeywords.some(kw => title.includes(kw));
            results.push({
              source: `Government (${a.domain || 'gov'})`,
              sourceType: 'Government',
              title: a.title || '',
              url: a.url || '',
              date: a.seendate ? a.seendate.substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '',
              confidence: hasSanctionsKw ? 0.85 : 0.6,
              severity: hasSanctionsKw ? 'HIGH' : 'MEDIUM',
              details: `Mentioned on ${a.domain}${hasSanctionsKw ? ' alongside sanctions keywords' : ''}`,
            });
          }
        }
      }
    } catch { /* skip */ }

    return results;
  }

  // ============================================
  // SOURCE: EU Council Announcements (GDELT)
  // ============================================
  async searchEUCouncil(variants) {
    const results = [];
    for (const variant of variants.slice(0, 2)) {
      const query = `"${variant}" (domain:consilium.europa.eu OR domain:ec.europa.eu OR domain:eeas.europa.eu)`;
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=5&format=json&timespan=2y`;

      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) continue;
        const data = await response.json();
        if (data.articles) {
          for (const a of data.articles) {
            const title = (a.title || '').toLowerCase();
            const hasSanctionsKw = this.sanctionsKeywords.some(kw => title.includes(kw)) ||
              title.includes('restrictive measures') || title.includes('asset freeze');
            results.push({
              source: 'EU Council/Commission',
              sourceType: 'Government',
              title: a.title || '',
              url: a.url || '',
              date: a.seendate ? a.seendate.substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '',
              confidence: hasSanctionsKw ? 0.85 : 0.6,
              severity: hasSanctionsKw ? 'HIGH' : 'MEDIUM',
              details: `EU source: ${a.domain}`,
            });
          }
        }
      } catch { /* skip */ }
    }
    return results;
  }

  // ============================================
  // SOURCE: UK OFSI (GDELT)
  // ============================================
  async searchUKOFSI(variants) {
    const results = [];
    for (const variant of variants.slice(0, 2)) {
      const query = `"${variant}" (domain:gov.uk) sanctions OR designated OR frozen`;
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=5&format=json&timespan=2y`;

      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) continue;
        const data = await response.json();
        if (data.articles) {
          for (const a of data.articles) {
            results.push({
              source: 'UK Government',
              sourceType: 'Government',
              title: a.title || '',
              url: a.url || '',
              date: a.seendate ? a.seendate.substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '',
              confidence: 0.8,
              severity: 'HIGH',
              details: `UK government source: ${a.domain}`,
            });
          }
        }
      } catch { /* skip */ }
    }
    return results;
  }

  // ============================================
  // SOURCE: Sanctions-Specific News
  // ============================================
  async searchSanctionsNews(name, variants) {
    const results = [];
    const sanctionsTerms = ['sanctioned', 'designated', 'OFAC', 'sanctions', 'blocked'];

    for (const variant of variants.slice(0, 2)) {
      for (const term of sanctionsTerms.slice(0, 2)) {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`"${variant}" ${term}`)}&hl=en-US&gl=US&ceid=US:en`;
        try {
          const response = await fetch(rssUrl, { signal: AbortSignal.timeout(8000) });
          if (!response.ok) continue;
          const xml = await response.text();
          const items = this.parseRSSItems(xml);
          for (const item of items.slice(0, 5)) {
            const title = (item.title || '').toLowerCase();
            const nameInTitle = variants.some(v => title.includes(v.toLowerCase()));
            if (nameInTitle) {
              results.push({
                source: item.source || 'News',
                sourceType: 'News',
                title: item.title || '',
                url: item.link || '',
                date: item.pubDate ? new Date(item.pubDate).toISOString().substring(0, 10) : '',
                confidence: 0.8,
                severity: 'HIGH',
                details: `Sanctions-related news mentioning ${name}`,
              });
            }
          }
        } catch { /* skip */ }
      }
    }
    return results;
  }

  // ============================================
  // HELPERS
  // ============================================

  matchItemsToEntity(items, variants, sourceName, sourceType) {
    const results = [];
    const lowerVariants = variants.map(v => v.toLowerCase());

    for (const item of items) {
      const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
      const nameMatch = lowerVariants.some(v => text.includes(v));
      if (nameMatch) {
        const hasSanctionsKw = this.sanctionsKeywords.some(kw => text.includes(kw));
        results.push({
          source: sourceName,
          sourceType,
          title: item.title || '',
          url: item.link || '',
          date: item.pubDate ? new Date(item.pubDate).toISOString().substring(0, 10) : '',
          confidence: hasSanctionsKw ? 0.95 : 0.75,
          severity: hasSanctionsKw ? 'CRITICAL' : 'HIGH',
          details: `Entity name found in ${sourceName}${hasSanctionsKw ? ' alongside sanctions keywords' : ''}`,
        });
      }
    }
    return results;
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

  generateNameVariants(name) {
    const variants = [name];
    if (name.includes(',')) {
      const parts = name.split(',').map(p => p.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        variants.push(`${parts[1]} ${parts[0]}`);
        variants.push(`${parts[1]} ${parts[0].charAt(0) + parts[0].slice(1).toLowerCase()}`);
        if (parts[0].length > 4) variants.push(parts[0]);
      }
    } else {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        const last = parts[parts.length - 1];
        const first = parts.slice(0, -1).join(' ');
        variants.push(`${last}, ${first}`);
        variants.push(`${last.toUpperCase()}, ${first}`);
        if (last.length > 4) variants.push(last);
      }
    }
    return variants;
  }

  calculateRiskDelta(findings) {
    if (findings.length === 0) return { score: 0, level: 'NONE', flags: [] };

    let score = 0;
    const flags = [];

    const critical = findings.filter(f => f.severity === 'CRITICAL');
    const high = findings.filter(f => f.severity === 'HIGH');

    if (critical.length > 0) {
      score += 80;
      flags.push({
        severity: 'CRITICAL',
        type: 'SANCTIONS_ANNOUNCEMENT',
        message: `Sanctions announcement detected: ${critical[0].title.substring(0, 100)}`,
        source: critical[0].source,
        url: critical[0].url,
      });
    }

    if (high.length > 0) {
      score += Math.min(high.length * 15, 30);
      flags.push({
        severity: 'HIGH',
        type: 'SANCTIONS_MENTION',
        message: `${high.length} sanctions-related mention(s) across government/news sources`,
      });
    }

    // OpenSanctions match is very strong signal
    const osMatch = findings.find(f => f.source === 'OpenSanctions' && f.sanctioned && f.confidence >= 0.8);
    if (osMatch) {
      score = Math.max(score, 90);
      flags.unshift({
        severity: 'CRITICAL',
        type: 'OPENSANCTIONS_MATCH',
        message: `OpenSanctions match (${(osMatch.confidence * 100).toFixed(0)}%): ${osMatch.title} — ${osMatch.details}`,
        url: osMatch.url,
      });
    }

    score = Math.min(score, 100);
    const level = score >= 80 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW';

    return { score, level, flags };
  }
}

module.exports = { SanctionsAnnouncementService };
