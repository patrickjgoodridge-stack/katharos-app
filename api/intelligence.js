// Vercel Serverless Function — Intelligence API
// POST /api/intelligence { entity_name, entity_details? }  → Entity intelligence
// GET  /api/intelligence?type=platform                      → Platform trends/alerts
// POST /api/intelligence { action: 'process_screening', ... } → Post-screening processing

import { getEntityIntelligence, getPlatformIntelligence, processScreeningEvent, runDailyIntelligenceJobs } from '../services/intelligenceService.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  // GET: Platform intelligence
  if (req.method === 'GET') {
    const { type } = req.query;

    if (type === 'platform') {
      try {
        const result = await getPlatformIntelligence();
        return res.status(200).json(result);
      } catch (error) {
        console.error('[Intelligence API]', error);
        return res.status(500).json({ error: 'Platform intelligence failed' });
      }
    }

    if (type === 'daily-job') {
      try {
        await runDailyIntelligenceJobs();
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('[Intelligence API] Daily job failed:', error);
        return res.status(500).json({ error: 'Daily job failed' });
      }
    }

    return res.status(400).json({ error: 'Unknown type. Use ?type=platform or ?type=daily-job' });
  }

  // POST: Entity intelligence or screening processing
  if (req.method === 'POST') {
    const { action, entity_name, entity_details, session_id, risk_level, screening_id } = req.body;

    // Post-screening processing (fire-and-forget from frontend)
    if (action === 'process_screening') {
      if (!entity_name || !session_id) {
        return res.status(400).json({ error: 'entity_name and session_id required' });
      }

      try {
        const entityNode = await processScreeningEvent(
          session_id,
          entity_name,
          risk_level || 'UNKNOWN',
          screening_id || `scr_${Date.now()}`
        );
        return res.status(200).json({
          success: true,
          entity_node_id: entityNode?.id || null,
        });
      } catch (error) {
        console.error('[Intelligence API] Processing failed:', error);
        return res.status(500).json({ error: 'Screening processing failed' });
      }
    }

    // Entity intelligence query
    if (!entity_name) {
      return res.status(400).json({ error: 'entity_name required' });
    }

    try {
      const result = await getEntityIntelligence(entity_name, entity_details || {});
      return res.status(200).json(result);
    } catch (error) {
      console.error('[Intelligence API]', error);
      return res.status(500).json({ error: 'Intelligence generation failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
