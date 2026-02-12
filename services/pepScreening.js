// PEPScreeningService — Politically Exposed Persons screening
// Sources: OpenSanctions API (free), Wikidata SPARQL, EveryPolitician (GitHub archive)

const { BoundedCache } = require('./boundedCache');

class PEPScreeningService {

  constructor() {
    this.openSanctionsKey = process.env.OPENSANCTIONS_API_KEY || null;
    this.cache = new BoundedCache({ maxSize: 200, ttlMs: 60 * 60 * 1000 });
  }

  // ============================================
  // MAIN ENTRY
  // ============================================

  async screenEntity(query) {
    const { name, type, country, dateOfBirth } = query;

    const results = await Promise.all([
      this.searchOpenSanctions(name, { type, country, dateOfBirth }).catch(e => ({ source: 'opensanctions', data: null, error: e.message })),
      this.searchWikidata(name, { type, country }).catch(e => ({ source: 'wikidata', data: null, error: e.message })),
      this.searchEveryPolitician(name, { country }).catch(e => ({ source: 'everypolitician', data: null, error: e.message })),
      this.searchCIAWorldLeaders(name).catch(e => ({ source: 'cia_world_leaders', data: null, error: e.message })),
    ]);

    const sources = {};
    for (const r of results) {
      sources[r.source] = { data: r.data, error: r.error || null, matchCount: r.data?.matches?.length || r.data?.results?.length || 0 };
    }

    const allMatches = this.consolidateMatches(results);
    const risk = this.calculateRisk(allMatches);

    return {
      query: { name, type: type || 'individual', country },
      isPEP: allMatches.some(m => m.isPEP),
      pepLevel: this.determinePEPLevel(allMatches),
      matchCount: allMatches.length,
      matches: allMatches.slice(0, 30),
      riskAssessment: risk,
      sources,
      screenedAt: new Date().toISOString()
    };
  }

  // ============================================
  // OPENSANCTIONS API — Primary PEP source
  // ============================================

  async searchOpenSanctions(name, options = {}) {
    const cacheKey = `os:${name}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({ q: name, limit: '50' });
    if (options.country) params.append('countries', options.country);

    const headers = { 'Accept': 'application/json' };
    if (this.openSanctionsKey) headers['Authorization'] = `ApiKey ${this.openSanctionsKey}`;

    // OpenSanctions free API (yente)
    const urls = [
      `https://api.opensanctions.org/search/default?${params}`,
      `https://api.opensanctions.org/search/peps?${params}`,
    ];

    const allResults = [];
    for (const url of urls) {
      try {
        const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
        if (!response.ok) continue;
        const data = await response.json();
        if (data.results) allResults.push(...data.results);
      } catch (e) {
        console.error('OpenSanctions search error:', e.message);
      }
    }

    // Deduplicate by ID
    const seen = new Set();
    const matches = [];
    for (const r of allResults) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);

      const props = r.properties || {};
      const isPEP = (r.datasets || []).some(d => d.includes('pep')) ||
                    (r.schema === 'Person' && (props.topics || []).some(t => t.includes('role') || t.includes('pep')));

      matches.push({
        id: r.id,
        name: props.name?.[0] || r.caption || 'Unknown',
        aliases: props.alias || [],
        type: r.schema === 'Person' ? 'individual' : 'entity',
        isPEP,
        pepPosition: props.position?.[0] || props.role?.[0] || null,
        country: props.country || [],
        nationality: props.nationality || [],
        dateOfBirth: props.birthDate?.[0] || null,
        datasets: r.datasets || [],
        topics: props.topics || [],
        sanctions: (r.datasets || []).filter(d => d.includes('sanction') || d.includes('ofac') || d.includes('eu_')),
        matchScore: r.score || 0,
        url: `https://opensanctions.org/entities/${r.id}/`,
        source: 'opensanctions'
      });
    }

    const result = { source: 'opensanctions', data: { matches: matches.sort((a, b) => b.matchScore - a.matchScore), total: matches.length } };
    this.cache.set(cacheKey, result);
    return result;
  }

  // ============================================
  // WIKIDATA SPARQL — PEP identification
  // ============================================

  async searchWikidata(name, options = {}) {
    // Wikidata SPARQL query for politicians/officials matching name
    const sparqlQuery = `
SELECT ?person ?personLabel ?positionLabel ?countryLabel ?startDate ?endDate ?dobLabel WHERE {
  ?person wdt:P31 wd:Q5 .
  ?person rdfs:label ?nameLabel .
  FILTER(CONTAINS(LCASE(?nameLabel), "${name.toLowerCase().replace(/"/g, '\\"')}"))
  FILTER(LANG(?nameLabel) = "en")
  {
    ?person wdt:P39 ?position .
    OPTIONAL { ?person p:P39 ?stmt . ?stmt ps:P39 ?position . OPTIONAL { ?stmt pq:P580 ?startDate } OPTIONAL { ?stmt pq:P582 ?endDate } }
  } UNION {
    ?person wdt:P106 ?occupation .
    FILTER(?occupation IN (wd:Q82955, wd:Q372436, wd:Q193391, wd:Q4964182))
  }
  OPTIONAL { ?person wdt:P27 ?country }
  OPTIONAL { ?person wdt:P569 ?dob }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 30`;

    try {
      const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Katharos Compliance App/1.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) return { source: 'wikidata', data: { results: [], total: 0 } };
      const data = await response.json();

      const resultsMap = new Map();
      for (const binding of (data.results?.bindings || [])) {
        const id = binding.person?.value || '';
        if (!resultsMap.has(id)) {
          resultsMap.set(id, {
            id,
            name: binding.personLabel?.value || 'Unknown',
            positions: [],
            country: binding.countryLabel?.value || null,
            dateOfBirth: binding.dobLabel?.value || null,
            source: 'wikidata'
          });
        }
        const entry = resultsMap.get(id);
        const pos = binding.positionLabel?.value;
        if (pos && !entry.positions.some(p => p.title === pos)) {
          entry.positions.push({
            title: pos,
            startDate: binding.startDate?.value?.substring(0, 10) || null,
            endDate: binding.endDate?.value?.substring(0, 10) || null,
            isCurrent: !binding.endDate?.value
          });
        }
      }

      const results = [...resultsMap.values()].map(r => ({
        ...r,
        isPEP: true,
        pepLevel: r.positions.some(p => p.isCurrent) ? 'ACTIVE' : 'FORMER',
        url: r.id
      }));

      return { source: 'wikidata', data: { results, total: results.length } };
    } catch (e) {
      console.error('Wikidata SPARQL error:', e.message);
      return { source: 'wikidata', data: { results: [], total: 0 } };
    }
  }

  // ============================================
  // EVERYPOLITICIAN — GitHub archive
  // ============================================

  async searchEveryPolitician(name, options = {}) {
    // EveryPolitician data is archived on GitHub. Search via the Popolo JSON files.
    // We use the index endpoint that lists all countries/legislatures
    const nameLower = name.toLowerCase();

    try {
      // Search the EveryPolitician countries index
      const response = await fetch('https://raw.githubusercontent.com/everypolitician/everypolitician-data/master/countries.json', {
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) return { source: 'everypolitician', data: { matches: [], total: 0 } };
      const countries = await response.json();

      // If country filter, narrow down; otherwise search broadly
      const targetCountries = options.country
        ? countries.filter(c => c.name.toLowerCase().includes(options.country.toLowerCase()) || c.slug.toLowerCase().includes(options.country.toLowerCase()))
        : countries.slice(0, 10); // Limit to first 10 countries to avoid timeout

      const matches = [];
      const legislatureUrls = [];
      for (const country of targetCountries.slice(0, 5)) {
        for (const legislature of (country.legislatures || [])) {
          if (legislature.popolo_url) {
            legislatureUrls.push({ url: legislature.popolo_url, country: country.name, legislature: legislature.name });
          }
        }
      }

      // Fetch up to 3 legislature files
      for (const leg of legislatureUrls.slice(0, 3)) {
        try {
          const res = await fetch(leg.url, { signal: AbortSignal.timeout(10000) });
          if (!res.ok) continue;
          const data = await res.json();
          for (const person of (data.persons || [])) {
            const pName = (person.name || '').toLowerCase();
            const otherNames = (person.other_names || []).map(n => (n.name || '').toLowerCase());
            if (pName.includes(nameLower) || nameLower.includes(pName) || otherNames.some(n => n.includes(nameLower) || nameLower.includes(n))) {
              matches.push({
                id: person.id || '',
                name: person.name || '',
                otherNames: person.other_names || [],
                country: leg.country,
                legislature: leg.legislature,
                isPEP: true,
                source: 'everypolitician'
              });
            }
          }
        } catch {
          // Skip individual legislature failures
        }
      }

      return { source: 'everypolitician', data: { matches, total: matches.length } };
    } catch (e) {
      console.error('EveryPolitician error:', e.message);
      return { source: 'everypolitician', data: { matches: [], total: 0 } };
    }
  }

  // ============================================
  // CIA WORLD LEADERS
  // ============================================

  async searchCIAWorldLeaders(name) {
    const nameLower = name.toLowerCase();
    try {
      // CIA World Leaders is available via a directory page
      const response = await fetch('https://www.cia.gov/resources/world-leaders/foreign-governments/', {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Katharos Compliance App/1.0' }
      });
      if (!response.ok) return { source: 'cia_world_leaders', data: { matches: [], total: 0 } };
      const html = await response.text();

      // Parse leader names from HTML
      const matches = [];
      const nameRegex = /class="[^"]*leader[^"]*"[^>]*>([^<]+)/gi;
      let match;
      while ((match = nameRegex.exec(html)) !== null) {
        const leaderName = match[1].trim();
        if (leaderName.toLowerCase().includes(nameLower) || nameLower.includes(leaderName.toLowerCase())) {
          matches.push({
            name: leaderName,
            isPEP: true,
            pepLevel: 'HEAD_OF_STATE',
            source: 'cia_world_leaders'
          });
        }
      }

      // Fallback: simple text search
      if (matches.length === 0 && html.toLowerCase().includes(nameLower)) {
        matches.push({
          name: name,
          isPEP: true,
          pepLevel: 'POSSIBLE',
          source: 'cia_world_leaders',
          note: 'Name found in CIA World Leaders page (exact role unresolved)'
        });
      }

      return { source: 'cia_world_leaders', data: { matches, total: matches.length } };
    } catch (e) {
      console.error('CIA World Leaders error:', e.message);
      return { source: 'cia_world_leaders', data: { matches: [], total: 0 } };
    }
  }

  // ============================================
  // CONSOLIDATION & RISK
  // ============================================

  consolidateMatches(results) {
    const all = [];
    for (const r of results) {
      if (!r.data) continue;
      const items = r.data.matches || r.data.results || [];
      all.push(...items);
    }
    return all;
  }

  determinePEPLevel(matches) {
    const pepMatches = matches.filter(m => m.isPEP);
    if (pepMatches.length === 0) return 'NOT_PEP';

    // Check for current/active positions
    const hasActive = pepMatches.some(m =>
      m.pepLevel === 'ACTIVE' ||
      m.pepLevel === 'HEAD_OF_STATE' ||
      (m.positions || []).some(p => p.isCurrent)
    );
    if (hasActive) return 'PEP_ACTIVE';

    const hasFormer = pepMatches.some(m => m.pepLevel === 'FORMER');
    if (hasFormer) return 'PEP_FORMER';

    return 'PEP_ASSOCIATED';
  }

  calculateRisk(matches) {
    if (matches.length === 0) return { score: 0, level: 'LOW', flags: [] };

    let score = 0;
    const flags = [];
    const pepMatches = matches.filter(m => m.isPEP);

    if (pepMatches.length > 0) {
      const active = pepMatches.some(m => m.pepLevel === 'ACTIVE' || m.pepLevel === 'HEAD_OF_STATE' || (m.positions || []).some(p => p.isCurrent));
      if (active) {
        score += 40;
        flags.push({ severity: 'HIGH', type: 'ACTIVE_PEP', message: `Active Politically Exposed Person (${pepMatches.length} source(s))` });
      } else {
        score += 25;
        flags.push({ severity: 'MEDIUM', type: 'FORMER_PEP', message: `Former Politically Exposed Person (${pepMatches.length} source(s))` });
      }
    }

    // Sanctions list matches from OpenSanctions
    const sanctioned = matches.filter(m => m.sanctions && m.sanctions.length > 0);
    if (sanctioned.length > 0) {
      score += 50;
      const lists = [...new Set(sanctioned.flatMap(m => m.sanctions))];
      flags.push({ severity: 'CRITICAL', type: 'SANCTIONS_LIST', message: `Found on sanctions list(s): ${lists.join(', ')}` });
    }

    // Multiple source confirmation
    const sources = new Set(matches.map(m => m.source));
    if (sources.size >= 3) {
      score += 10;
      flags.push({ severity: 'MEDIUM', type: 'MULTI_SOURCE_CONFIRMATION', message: `Confirmed across ${sources.size} sources` });
    }

    return {
      score: Math.min(score, 100),
      level: score >= 70 ? 'CRITICAL' : score >= 40 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW',
      flags: flags.sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[a.severity] - ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[b.severity])
    };
  }
}

module.exports = { PEPScreeningService };
