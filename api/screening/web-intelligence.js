// Vercel Serverless Function — Web Intelligence Screening
// POST /api/screening/web-intelligence
// Uses Claude web search to find live sanctions intelligence

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'API key not configured' });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const cacheKey = name.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json({ ...cached.result, fromCache: true });
  }

  const startTime = Date.now();

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `You are a sanctions screening tool. Search for sanctions information about: "${name}"

Search for:
1. OFAC designations or SDN list additions
2. Treasury.gov press releases mentioning this name
3. EU, UK, UN sanctions mentions
4. Any enforcement actions or indictments
5. If this is a crypto address, search for it specifically

Respond ONLY with this JSON, no other text:
{
  "found": true or false,
  "sanctioned": true or false,
  "confidence": "high" or "medium" or "low",
  "authority": "OFAC" or "EU" or "UK" or "UN" or null,
  "program": "program name if found" or null,
  "date": "designation date if found" or null,
  "summary": "one sentence summary",
  "sources": [{"title": "...", "url": "..."}]
}`
        }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Claude API error: ${response.status}` });
    }

    const data = await response.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const usage = data.usage || {};
    const durationMs = Date.now() - startTime;

    let result;
    try {
      const cleaned = text.replace(/```json|```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { found: false, sanctioned: false, confidence: 'low', summary: 'No structured response', sources: [] };
    } catch {
      result = { found: false, sanctioned: false, confidence: 'low', summary: text.substring(0, 200), sources: [] };
    }

    result.durationMs = durationMs;
    result.tokensUsed = (usage.input_tokens || 0) + (usage.output_tokens || 0);
    result.fromCache = false;

    cache.set(cacheKey, { result, timestamp: Date.now() });
    res.json(result);
  } catch (error) {
    console.error('Web intelligence error:', error);
    res.status(500).json({ error: error.message, durationMs: Date.now() - startTime });
  }
}
