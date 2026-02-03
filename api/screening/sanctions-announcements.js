// Vercel Serverless Function — Sanctions Announcement Screening
// POST /api/screening/sanctions-announcements
// Checks official government announcement pages, OpenSanctions, and news
// for entity mentions alongside sanctions keywords

class SanctionsAnnouncementService {
  constructor() {
    this.cache = new Map();
    this.sanctionsKeywords = [
      'sanctioned', 'designated', 'blocked', 'frozen', 'prohibited',
      'restricted', 'specially designated', 'SDN', 'OFAC', 'asset freeze',
      'travel ban', 'arms embargo', 'executive order', 'listed',
      'sanctions evasion', 'sectoral sanctions', 'secondary sanctions'
    ];
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

  async screen(entityName) {
    const startTime = Date.now();
    const variants = this.generateNameVariants(entityName);
    const results = [];
    const sourceSummary = {};

    const checks = [
      this.searchOpenSanctions(entityName, variants).then(r => { sourceSummary['OpenSanctions'] = { count: r.length }; return r; }).catch(e => { sourceSummary['OpenSanctions'] = { count: 0, error: e.message }; return []; }),
      this.searchOFACRSS(variants).then(r => { sourceSummary['OFAC RSS'] = { count: r.length }; return r; }).catch(e => { sourceSummary['OFAC RSS'] = { count: 0, error: e.message }; return []; }),
      this.searchGDELTGov(entityName, variants).then(r => { sourceSummary['Government'] = { count: r.length }; return r; }).catch(e => { sourceSummary['Government'] = { count: 0, error: e.message }; return []; }),
      this.searchGDELTEU(variants).then(r => { sourceSummary['EU'] = { count: r.length }; return r; }).catch(e => { sourceSummary['EU'] = { count: 0, error: e.message }; return []; }),
      this.searchSanctionsNews(entityName, variants).then(r => { sourceSummary['News'] = { count: r.length }; return r; }).catch(e => { sourceSummary['News'] = { count: 0, error: e.message }; return []; }),
    ];

    const allResults = await Promise.all(checks);
    for (const batch of allResults) results.push(...batch);

    // Deduplicate
    const seen = new Set();
    const unique = [];
    for (const r of results) {
      const key = r.url || r.title;
      if (!seen.has(key)) { seen.add(key); unique.push(r); }
    }

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

  async searchOpenSanctions(name, variants) {
    const results = [];
    try {
      const response = await fetch('https://api.opensanctions.org/match/default?algorithm=best&limit=5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ schema: 'Person', properties: { name: [name, ...variants.slice(0, 3)] } }),
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
                  const isSanctioned = datasets.toLowerCase().includes('sanction') || (r.properties?.topics || []).some(t => t.includes('sanction'));
                  results.push({ source: 'OpenSanctions', sourceType: 'API', title: r.caption || name, url: `https://opensanctions.org/entities/${r.id}/`, confidence: r.score, severity: r.score >= 0.9 && isSanctioned ? 'CRITICAL' : r.score >= 0.7 ? 'HIGH' : 'MEDIUM', details: `Datasets: ${datasets}`, sanctioned: isSanctioned });
                }
              }
            }
          }
        }
      }
    } catch (e) { console.error('OpenSanctions error:', e.message); }
    return results;
  }

  async searchOFACRSS(variants) {
    const results = [];
    try {
      const response = await fetch('https://ofac.treasury.gov/recent-actions/rss.xml', { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Marlowe-AML/1.0)' }, signal: AbortSignal.timeout(10000) });
      if (response.ok) {
        const xml = await response.text();
        const items = this.parseRSS(xml);
        const lv = variants.map(v => v.toLowerCase());
        for (const item of items) {
          const text = `${item.title} ${item.description}`.toLowerCase();
          if (lv.some(v => text.includes(v))) {
            const hasSanctionsKw = this.sanctionsKeywords.some(kw => text.includes(kw));
            results.push({ source: 'OFAC Recent Actions', sourceType: 'Government', title: item.title, url: item.link, date: item.pubDate ? new Date(item.pubDate).toISOString().substring(0, 10) : '', confidence: hasSanctionsKw ? 0.95 : 0.75, severity: hasSanctionsKw ? 'CRITICAL' : 'HIGH', details: 'Found in OFAC Recent Actions RSS feed' });
          }
        }
      }
    } catch (e) { console.error('OFAC RSS error:', e.message); }
    return results;
  }

  async searchGDELTGov(name, variants) {
    const results = [];
    const domains = ['treasury.gov', 'state.gov', 'justice.gov', 'bis.doc.gov', 'fincen.gov', 'sec.gov'];
    const domainFilter = domains.map(d => `domain:${d}`).join(' OR ');
    for (const variant of variants.slice(0, 2)) {
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`"${variant}" (${domainFilter})`)}&mode=ArtList&maxrecords=10&format=json&timespan=2y`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) continue;
        const data = await response.json();
        if (data.articles) {
          for (const a of data.articles) {
            const title = (a.title || '').toLowerCase();
            const hasSanctionsKw = this.sanctionsKeywords.some(kw => title.includes(kw));
            results.push({ source: `Government (${a.domain || 'gov'})`, sourceType: 'Government', title: a.title || '', url: a.url || '', date: a.seendate ? a.seendate.substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '', confidence: hasSanctionsKw ? 0.9 : 0.65, severity: hasSanctionsKw ? 'CRITICAL' : 'MEDIUM', details: `${a.domain}${hasSanctionsKw ? ' — sanctions keywords present' : ''}` });
          }
        }
      } catch { /* skip */ }
    }
    return results;
  }

  async searchGDELTEU(variants) {
    const results = [];
    for (const variant of variants.slice(0, 2)) {
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`"${variant}" (domain:consilium.europa.eu OR domain:ec.europa.eu OR domain:gov.uk)`)}&mode=ArtList&maxrecords=5&format=json&timespan=2y`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) continue;
        const data = await response.json();
        if (data.articles) {
          for (const a of data.articles) {
            const title = (a.title || '').toLowerCase();
            const hasSanctionsKw = this.sanctionsKeywords.some(kw => title.includes(kw)) || title.includes('restrictive measures');
            results.push({ source: `EU/UK (${a.domain})`, sourceType: 'Government', title: a.title || '', url: a.url || '', date: a.seendate ? a.seendate.substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '', confidence: hasSanctionsKw ? 0.85 : 0.6, severity: hasSanctionsKw ? 'HIGH' : 'MEDIUM', details: a.domain });
          }
        }
      } catch { /* skip */ }
    }
    return results;
  }

  async searchSanctionsNews(name, variants) {
    const results = [];
    for (const variant of variants.slice(0, 2)) {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`"${variant}" sanctions OR designated OR OFAC`)}&hl=en-US&gl=US&ceid=US:en`;
      try {
        const response = await fetch(rssUrl, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) continue;
        const xml = await response.text();
        const items = this.parseRSS(xml);
        const lv = variants.map(v => v.toLowerCase());
        for (const item of items.slice(0, 5)) {
          const title = (item.title || '').toLowerCase();
          if (lv.some(v => title.includes(v))) {
            results.push({ source: item.source || 'News', sourceType: 'News', title: item.title || '', url: item.link || '', date: item.pubDate ? new Date(item.pubDate).toISOString().substring(0, 10) : '', confidence: 0.8, severity: 'HIGH', details: `Sanctions-related news` });
          }
        }
      } catch { /* skip */ }
    }
    return results;
  }

  parseRSS(xml) {
    const items = [];
    const re = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      const x = m[1];
      items.push({ title: this.tag(x, 'title'), link: this.tag(x, 'link'), pubDate: this.tag(x, 'pubDate'), description: this.tag(x, 'description'), source: this.tag(x, 'source') });
    }
    return items;
  }

  tag(xml, t) { const m = new RegExp(`<${t}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${t}>`, 's').exec(xml); return m ? m[1].trim() : ''; }

  calculateRiskDelta(findings) {
    if (findings.length === 0) return { score: 0, level: 'NONE', flags: [] };
    let score = 0; const flags = [];
    const critical = findings.filter(f => f.severity === 'CRITICAL');
    const high = findings.filter(f => f.severity === 'HIGH');
    if (critical.length > 0) { score += 80; flags.push({ severity: 'CRITICAL', type: 'SANCTIONS_ANNOUNCEMENT', message: `Sanctions announcement: ${critical[0].title.substring(0, 100)}`, source: critical[0].source, url: critical[0].url }); }
    if (high.length > 0) { score += Math.min(high.length * 15, 30); flags.push({ severity: 'HIGH', type: 'SANCTIONS_MENTION', message: `${high.length} sanctions-related mention(s)` }); }
    const osMatch = findings.find(f => f.source === 'OpenSanctions' && f.sanctioned && f.confidence >= 0.8);
    if (osMatch) { score = Math.max(score, 90); flags.unshift({ severity: 'CRITICAL', type: 'OPENSANCTIONS_MATCH', message: `OpenSanctions: ${osMatch.title} (${(osMatch.confidence * 100).toFixed(0)}%)`, url: osMatch.url }); }
    return { score: Math.min(score, 100), level: score >= 80 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW', flags };
  }
}

const service = new SanctionsAnnouncementService();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await service.screen(name);
    res.json(result);
  } catch (error) {
    console.error('Sanctions announcement screening error:', error);
    res.status(500).json({ error: error.message });
  }
}
