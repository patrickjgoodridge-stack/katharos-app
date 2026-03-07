// eventLogger.js - Buffered event logging service for Katharos intelligence systems
// Collects events client-side and flushes in batches to /api/events

const FLUSH_INTERVAL_MS = 5000;    // Flush every 5 seconds
const MAX_BUFFER_SIZE = 50;        // Flush if buffer exceeds this
const MAX_RETRY_ATTEMPTS = 2;

class EventLogger {
  constructor() {
    this.buffer = [];
    this.sessionId = this._generateSessionId();
    this.userEmail = null;
    this.emailDomain = null;
    this.flushTimer = null;
    this.isFlushing = false;
  }

  /**
   * Initialize with user context. Call once on login/app load.
   */
  init({ userEmail, emailDomain }) {
    this.userEmail = userEmail || null;
    this.emailDomain = emailDomain || (userEmail ? userEmail.split('@')[1] : null);

    // Start periodic flush
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush(true));
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.flush(true);
      });
    }

    this.log('session.started', 'session', {});
  }

  /**
   * Log an event. Buffered — will be sent in next flush cycle.
   *
   * @param {string} eventType - e.g. 'screening.completed', 'case.created'
   * @param {string} category - e.g. 'screening', 'case', 'document', 'search'
   * @param {object} opts - { entityName, entityType, caseId, payload }
   */
  log(eventType, category, opts = {}) {
    const event = {
      event_type: eventType,
      event_category: category,
      session_id: this.sessionId,
      user_email: this.userEmail,
      email_domain: this.emailDomain,
      entity_name: opts.entityName || null,
      entity_type: opts.entityType || null,
      case_id: opts.caseId || null,
      payload: opts.payload || {},
      client_timestamp: new Date().toISOString(),
    };

    this.buffer.push(event);

    // Flush immediately if buffer is full
    if (this.buffer.length >= MAX_BUFFER_SIZE) {
      this.flush();
    }
  }

  /**
   * Flush buffered events to the server.
   * @param {boolean} sync - If true, use sendBeacon for reliability on page unload
   */
  async flush(sync = false) {
    if (this.buffer.length === 0 || this.isFlushing) return;

    const events = [...this.buffer];
    this.buffer = [];
    this.isFlushing = true;

    try {
      if (sync && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/events', JSON.stringify({ events }));
      } else {
        await this._sendWithRetry(events);
      }
    } catch (err) {
      // Put failed events back at the front of the buffer (up to max)
      this.buffer = [...events, ...this.buffer].slice(0, MAX_BUFFER_SIZE * 2);
      console.warn('[EventLogger] Flush failed, events re-buffered:', err.message);
    } finally {
      this.isFlushing = false;
    }
  }

  async _sendWithRetry(events, attempt = 0) {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
      if (!res.ok && attempt < MAX_RETRY_ATTEMPTS) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        return this._sendWithRetry(events, attempt + 1);
      }
    } catch (err) {
      if (attempt < MAX_RETRY_ATTEMPTS) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        return this._sendWithRetry(events, attempt + 1);
      }
      throw err;
    }
  }

  /**
   * Stop the logger and flush remaining events.
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush(true);
  }

  _generateSessionId() {
    return 'ses_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  // =============================================
  // Convenience methods for common event types
  // =============================================

  screeningStarted(entityName, entityType, caseId, payload = {}) {
    this.log('screening.started', 'screening', { entityName, entityType, caseId, payload });
  }

  screeningCompleted(entityName, entityType, caseId, payload = {}) {
    this.log('screening.completed', 'screening', { entityName, entityType, caseId, payload });
  }

  caseCreated(caseId, entityName, payload = {}) {
    this.log('case.created', 'case', { caseId, entityName, payload });
  }

  documentUploaded(caseId, payload = {}) {
    this.log('document.uploaded', 'document', { caseId, payload });
  }

  reportGenerated(caseId, entityName, payload = {}) {
    this.log('report.generated', 'report', { caseId, entityName, payload });
  }

  searchExecuted(query, caseId, payload = {}) {
    this.log('search.executed', 'search', { entityName: query, caseId, payload });
  }

  riskAssessed(entityName, caseId, payload = {}) {
    this.log('risk.assessed', 'screening', { entityName, caseId, payload });
  }

  feedbackProvided(entityName, caseId, payload = {}) {
    this.log('feedback.provided', 'feedback', { entityName, caseId, payload });
  }

  messagesSent(caseId, payload = {}) {
    this.log('message.sent', 'chat', { caseId, payload });
  }

  keepExploreClicked(query, caseId, payload = {}) {
    this.log('explore.clicked', 'search', { entityName: query, caseId, payload });
  }
}

// Singleton
const eventLogger = new EventLogger();

export { EventLogger };
export default eventLogger;
