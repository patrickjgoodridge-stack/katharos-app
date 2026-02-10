// Web Intelligence Service
// Uses Claude's built-in web search to find live sanctions intelligence
// Catches designations that may not yet appear in structured data sources

class WebIntelligenceService {
  constructor() {
    this.apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    this.cache = new Map(); // entityName -> { result, timestamp }
    this.cacheTTL = 60 * 60 * 1000; // 1 hour
  }

  getCached(entity) {
    const key = entity.toLowerCase().trim();
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.cacheTTL) return entry.result;
    return null;
  }

  setCache(entity, result) {
    this.cache.set(entity.toLowerCase().trim(), { result, timestamp: Date.now() });
  }

  async search(entityName) {
    if (!this.apiKey) {
      return { found: false, sanctioned: false, confidence: 'low', summary: 'API key not configured', sources: [], error: 'no_api_key' };
    }

    // Check cache
    const cached = this.getCached(entityName);
    if (cached) {
      console.log(`[WebIntelligence] Cache hit for "${entityName}"`);
      return { ...cached, fromCache: true };
    }

    const startTime = Date.now();

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          tools: [{
            type: 'web_search_20250305',
            name: 'web_search',
          }],
          messages: [{
            role: 'user',
            content: `You are a compliance and criminal risk screening tool. Search for ALL risk-relevant information about: "${entityName}"

Search for:
1. OFAC designations or SDN list additions
2. Treasury.gov, Justice.gov press releases mentioning this name
3. EU, UK, UN sanctions mentions
4. Any enforcement actions, indictments, or criminal charges
5. Human trafficking, drug trafficking, prostitution, or organized crime links
6. Police reports, raids, nuisance property declarations, or crackdowns
7. Violence, shootings, homicides, or other serious criminal activity
8. Local law enforcement actions or news reports about criminal activity
9. If this is a crypto address, search for it specifically

Respond ONLY with this JSON, no other text:
{
  "found": true or false,
  "sanctioned": true or false,
  "criminalActivity": true or false,
  "confidence": "high" or "medium" or "low",
  "authority": "OFAC" or "EU" or "UK" or "UN" or "LAW_ENFORCEMENT" or null,
  "program": "program name or criminal category if found" or null,
  "date": "designation or incident date if found" or null,
  "summary": "one sentence summary",
  "sources": [{"title": "...", "url": "..."}]
}`
          }],
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error(`[WebIntelligence] API error ${response.status}:`, errText.substring(0, 200));
        return { found: false, sanctioned: false, confidence: 'low', summary: `API error: ${response.status}`, sources: [], error: `http_${response.status}` };
      }

      const data = await response.json();
      const durationMs = Date.now() - startTime;

      // Extract text from response (may include tool_use blocks for web search)
      const textBlocks = (data.content || []).filter(block => block.type === 'text');
      const text = textBlocks.map(block => block.text).join('');

      // Log usage for cost monitoring
      const usage = data.usage || {};
      console.log(`[WebIntelligence] "${entityName}" — ${durationMs}ms, input_tokens: ${usage.input_tokens || 0}, output_tokens: ${usage.output_tokens || 0}`);

      // Parse JSON from response
      let result;
      try {
        const cleaned = text.replace(/```json|```/g, '').trim();
        // Find JSON object in the text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          result = { found: false, sanctioned: false, confidence: 'low', summary: 'No structured response', sources: [] };
        }
      } catch (parseErr) {
        console.warn('[WebIntelligence] JSON parse error:', parseErr.message, 'Raw:', text.substring(0, 200));
        result = { found: false, sanctioned: false, confidence: 'low', summary: text.substring(0, 200), sources: [] };
      }

      // Add metadata
      result.durationMs = durationMs;
      result.tokensUsed = (usage.input_tokens || 0) + (usage.output_tokens || 0);
      result.fromCache = false;

      // Cache the result
      this.setCache(entityName, result);

      return result;
    } catch (e) {
      const durationMs = Date.now() - startTime;
      console.error(`[WebIntelligence] Error for "${entityName}" (${durationMs}ms):`, e.message);
      return {
        found: false, sanctioned: false, confidence: 'low',
        summary: `Search failed: ${e.message}`,
        sources: [], error: e.message, durationMs,
      };
    }
  }
}

module.exports = { WebIntelligenceService };
