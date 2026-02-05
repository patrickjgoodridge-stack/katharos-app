// metricsService.js - Katharos Product Metrics Instrumentation
// Tracks: retrieval accuracy, sanctions precision, investigation time, concurrent users

class MetricsService {
  constructor() {
    this.activeSessions = new Map(); // userId -> { startTime, caseId }
    this.investigationTimings = new Map(); // caseId -> { startTime, events[] }
  }

  // ============================================
  // INVESTIGATION TIME TRACKING
  // ============================================

  /**
   * Start timing an investigation
   * Call when user opens/starts a case
   */
  startInvestigation(caseId, userId, metadata = {}) {
    const startTime = Date.now();
    this.investigationTimings.set(caseId, {
      startTime,
      userId,
      events: [{ type: 'start', timestamp: startTime }],
      metadata
    });

    console.log(`[Metrics] Investigation started: ${caseId}`);
    return { caseId, startTime };
  }

  /**
   * Record an event during investigation (query, document upload, etc.)
   */
  recordInvestigationEvent(caseId, eventType, data = {}) {
    const investigation = this.investigationTimings.get(caseId);
    if (!investigation) return;

    investigation.events.push({
      type: eventType,
      timestamp: Date.now(),
      ...data
    });
  }

  /**
   * End investigation timing
   * Call when user reaches a decision (risk assessment generated)
   */
  endInvestigation(caseId, outcome = {}) {
    const investigation = this.investigationTimings.get(caseId);
    if (!investigation) return null;

    const endTime = Date.now();
    const durationMs = endTime - investigation.startTime;
    const durationMinutes = durationMs / 60000;

    const result = {
      caseId,
      userId: investigation.userId,
      startTime: new Date(investigation.startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      durationMs,
      durationMinutes: Math.round(durationMinutes * 10) / 10,
      eventCount: investigation.events.length,
      outcome,
      metadata: investigation.metadata
    };

    console.log(`[Metrics] Investigation completed: ${caseId} in ${result.durationMinutes} min`);

    // Clean up
    this.investigationTimings.delete(caseId);

    return result;
  }

  // ============================================
  // RETRIEVAL ACCURACY (RAG)
  // ============================================

  /**
   * Log a RAG retrieval for later accuracy assessment
   * @param {string} queryId - Unique ID for this query
   * @param {string} query - The search query
   * @param {Array} results - Retrieved chunks with scores
   * @param {number} topK - Number of results requested
   */
  logRetrieval(queryId, query, results, topK = 10) {
    const retrieval = {
      queryId,
      query,
      timestamp: new Date().toISOString(),
      topK,
      resultCount: results.length,
      results: results.slice(0, topK).map((r, i) => ({
        rank: i + 1,
        id: r.id,
        score: r.score,
        namespace: r.namespace,
        // Feedback fields - populated later
        wasRelevant: null,
        wasUsed: null
      }))
    };

    console.log(`[Metrics] Retrieval logged: ${queryId} (${results.length} results)`);
    return retrieval;
  }

  /**
   * Record user feedback on retrieval relevance
   * Call when user clicks/uses a retrieved result
   */
  recordRetrievalFeedback(queryId, resultId, feedback) {
    // In production, update the stored retrieval record
    console.log(`[Metrics] Retrieval feedback: ${queryId}/${resultId} - ${JSON.stringify(feedback)}`);
    return { queryId, resultId, feedback, timestamp: new Date().toISOString() };
  }

  /**
   * Calculate Recall@K from logged retrievals
   * @param {Array} retrievals - Array of retrieval logs with relevance feedback
   * @param {number} k - K value for Recall@K
   */
  calculateRecallAtK(retrievals, k = 10) {
    const withFeedback = retrievals.filter(r =>
      r.results.some(res => res.wasRelevant !== null)
    );

    if (withFeedback.length === 0) return null;

    let totalRelevant = 0;
    let foundInTopK = 0;

    for (const retrieval of withFeedback) {
      const topKResults = retrieval.results.slice(0, k);
      const relevantInTopK = topKResults.filter(r => r.wasRelevant === true).length;
      const totalRelevantForQuery = retrieval.results.filter(r => r.wasRelevant === true).length;

      if (totalRelevantForQuery > 0) {
        totalRelevant += totalRelevantForQuery;
        foundInTopK += relevantInTopK;
      }
    }

    return totalRelevant > 0 ? foundInTopK / totalRelevant : null;
  }

  // ============================================
  // SANCTIONS MATCH PRECISION
  // ============================================

  /**
   * Log a sanctions screening result
   * @param {string} screeningId - Unique ID
   * @param {object} query - { name, type }
   * @param {Array} matches - OFAC matches found
   */
  logSanctionsScreening(screeningId, query, matches) {
    const screening = {
      screeningId,
      query,
      timestamp: new Date().toISOString(),
      matchCount: matches.length,
      matches: matches.map(m => ({
        sdnId: m.id,
        name: m.name,
        confidence: m.matchConfidence,
        matchType: m.matchType,
        // Feedback - populated by analyst
        isTruePositive: null,
        analystNote: null
      }))
    };

    console.log(`[Metrics] Sanctions screening: ${screeningId} (${matches.length} matches)`);
    return screening;
  }

  /**
   * Record analyst feedback on sanctions match
   * @param {string} screeningId
   * @param {string} sdnId
   * @param {boolean} isTruePositive
   * @param {string} note
   */
  recordSanctionsFeedback(screeningId, sdnId, isTruePositive, note = '') {
    console.log(`[Metrics] Sanctions feedback: ${screeningId}/${sdnId} - TP: ${isTruePositive}`);
    return {
      screeningId,
      sdnId,
      isTruePositive,
      note,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate sanctions precision from logged screenings
   */
  calculateSanctionsPrecision(screenings) {
    const withFeedback = screenings.filter(s =>
      s.matches.some(m => m.isTruePositive !== null)
    );

    if (withFeedback.length === 0) return null;

    let totalMatches = 0;
    let truePositives = 0;

    for (const screening of withFeedback) {
      for (const match of screening.matches) {
        if (match.isTruePositive !== null) {
          totalMatches++;
          if (match.isTruePositive) truePositives++;
        }
      }
    }

    return totalMatches > 0 ? truePositives / totalMatches : null;
  }

  // ============================================
  // CONCURRENT USERS
  // ============================================

  /**
   * Register an active user session
   */
  startSession(userId, metadata = {}) {
    this.activeSessions.set(userId, {
      startTime: Date.now(),
      lastActivity: Date.now(),
      ...metadata
    });
    console.log(`[Metrics] Session started: ${userId} (${this.activeSessions.size} active)`);
    return this.activeSessions.size;
  }

  /**
   * Update session activity (call on any user action)
   */
  updateSessionActivity(userId) {
    const session = this.activeSessions.get(userId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  /**
   * End a user session
   */
  endSession(userId) {
    this.activeSessions.delete(userId);
    console.log(`[Metrics] Session ended: ${userId} (${this.activeSessions.size} active)`);
    return this.activeSessions.size;
  }

  /**
   * Get count of concurrent users (active in last N minutes)
   */
  getConcurrentUsers(activeWindowMinutes = 5) {
    const cutoff = Date.now() - (activeWindowMinutes * 60 * 1000);
    let activeCount = 0;

    for (const [userId, session] of this.activeSessions) {
      if (session.lastActivity >= cutoff) {
        activeCount++;
      } else {
        // Clean up stale sessions
        this.activeSessions.delete(userId);
      }
    }

    return activeCount;
  }

  // ============================================
  // AGGREGATED METRICS SNAPSHOT
  // ============================================

  /**
   * Get current metrics snapshot for dashboard/reporting
   */
  getMetricsSnapshot() {
    return {
      timestamp: new Date().toISOString(),
      concurrentUsers: this.getConcurrentUsers(),
      activeInvestigations: this.investigationTimings.size,
      // These would come from stored data in production:
      // retrievalAccuracy: this.calculateRecallAtK(storedRetrievals, 10),
      // sanctionsPrecision: this.calculateSanctionsPrecision(storedScreenings),
      // avgInvestigationTimeMinutes: calculated from stored completions
    };
  }
}

// Singleton instance
const metricsService = new MetricsService();

module.exports = { MetricsService, metricsService };
