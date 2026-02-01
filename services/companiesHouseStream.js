const EventSource = require('eventsource');

class CompaniesHouseStreamService {

  constructor() {
    this.apiKey = process.env.COMPANIES_HOUSE_STREAM_KEY;
    this.baseUrl = 'https://stream.companieshouse.gov.uk';
    this.streams = new Map();
    this.watchlist = new Set();
    this.handlers = new Map();
    this.alerts = [];          // In-memory alert storage
    this.disqualifiedOfficers = new Map(); // name -> officer data
    this.eventCallbacks = [];  // External listeners
  }

  // ============================================
  // STREAM CONNECTIONS
  // ============================================

  connectStream(streamType) {
    if (!this.apiKey) {
      console.log(`Skipping ${streamType} stream — no COMPANIES_HOUSE_STREAM_KEY configured`);
      return;
    }

    if (this.streams.has(streamType)) {
      console.log(`Stream ${streamType} already connected`);
      return;
    }

    const url = `${this.baseUrl}/${streamType}`;

    const eventSource = new EventSource(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(this.apiKey + ':').toString('base64')
      }
    });

    eventSource.onopen = () => {
      console.log(`Connected to ${streamType} stream`);
    };

    eventSource.onmessage = (event) => {
      try {
        this.handleStreamEvent(streamType, JSON.parse(event.data));
      } catch (e) {
        console.error(`Error parsing ${streamType} event:`, e.message);
      }
    };

    eventSource.onerror = (error) => {
      console.error(`Stream ${streamType} error:`, error.message || error);
      setTimeout(() => {
        this.streams.delete(streamType);
        this.connectStream(streamType);
      }, 5000);
    };

    this.streams.set(streamType, eventSource);
  }

  disconnectStream(streamType) {
    const stream = this.streams.get(streamType);
    if (stream) {
      stream.close();
      this.streams.delete(streamType);
      console.log(`Disconnected from ${streamType} stream`);
    }
  }

  disconnectAll() {
    for (const [type] of this.streams) {
      this.disconnectStream(type);
    }
  }

  connectAllStreams() {
    const complianceStreams = [
      'companies',
      'officers',
      'persons-with-significant-control',
      'disqualified-officers',
      'insolvency-cases',
      'charges',
      'filings'
    ];

    for (const stream of complianceStreams) {
      this.connectStream(stream);
    }
  }

  // ============================================
  // EVENT HANDLING
  // ============================================

  handleStreamEvent(streamType, data) {
    const companyNumber = this.extractCompanyNumber(streamType, data);

    if (companyNumber && this.watchlist.has(companyNumber)) {
      this.processWatchlistAlert(streamType, data, companyNumber);
    }

    this.checkHighRiskEvent(streamType, data);
  }

  extractCompanyNumber(streamType, data) {
    switch (streamType) {
      case 'companies':
        return data.data?.company_number;
      case 'officers':
        return data.data?.links?.company?.match(/\/company\/([^/]+)/)?.[1];
      case 'persons-with-significant-control':
        return data.data?.links?.company?.match(/\/company\/([^/]+)/)?.[1];
      case 'disqualified-officers':
        return data.data?.company_number;
      case 'insolvency-cases':
        return data.data?.company_number;
      case 'charges':
        return data.data?.links?.company?.match(/\/company\/([^/]+)/)?.[1];
      case 'filings':
        return data.data?.links?.company?.match(/\/company\/([^/]+)/)?.[1];
      default:
        return null;
    }
  }

  // ============================================
  // WATCHLIST ALERTS
  // ============================================

  processWatchlistAlert(streamType, data, companyNumber) {
    const alert = {
      id: `ch_${Date.now()}_${companyNumber}`,
      timestamp: new Date().toISOString(),
      source: 'companies_house_stream',
      streamType,
      companyNumber,
      eventType: this.classifyEvent(streamType, data),
      severity: this.determineSeverity(streamType, data),
      summary: this.generateSummary(streamType, data),
      rawData: data
    };

    this.saveAlert(alert);
    this.emitEvent(alert);

    console.log(`Alert generated: ${alert.eventType} for ${companyNumber} [${alert.severity}]`);
  }

  classifyEvent(streamType, data) {
    switch (streamType) {
      case 'companies':
        if (data.event?.type === 'changed') {
          const fields = data.event?.fields_changed || [];
          if (fields.includes('company_status')) return 'STATUS_CHANGE';
          if (fields.includes('registered_office_address')) return 'ADDRESS_CHANGE';
          if (fields.includes('company_name')) return 'NAME_CHANGE';
          return 'COMPANY_UPDATE';
        }
        return 'COMPANY_EVENT';

      case 'officers':
        if (data.event?.type === 'changed') {
          if (data.data?.resigned_on) return 'OFFICER_RESIGNED';
          return 'OFFICER_APPOINTED';
        }
        return 'OFFICER_CHANGE';

      case 'persons-with-significant-control':
        if (data.event?.type === 'changed') {
          if (data.data?.ceased_on) return 'PSC_CEASED';
          return 'PSC_NOTIFIED';
        }
        return 'PSC_CHANGE';

      case 'disqualified-officers':
        return 'OFFICER_DISQUALIFIED';

      case 'insolvency-cases': {
        const caseType = (data.data?.case_type || '').toLowerCase();
        if (caseType.includes('liquidation')) return 'LIQUIDATION';
        if (caseType.includes('administration')) return 'ADMINISTRATION';
        if (caseType.includes('voluntary')) return 'CVA';
        return 'INSOLVENCY_EVENT';
      }

      case 'charges':
        if (data.data?.status === 'satisfied') return 'CHARGE_SATISFIED';
        return 'CHARGE_CREATED';

      case 'filings': {
        const category = data.data?.category || '';
        if (category === 'accounts') return 'ACCOUNTS_FILED';
        if (category === 'confirmation-statement') return 'CONFIRMATION_STATEMENT';
        if (category === 'resolution') return 'RESOLUTION_FILED';
        return 'FILING_RECEIVED';
      }

      default:
        return 'UNKNOWN_EVENT';
    }
  }

  determineSeverity(streamType, data) {
    const eventType = this.classifyEvent(streamType, data);

    const criticalEvents = ['LIQUIDATION', 'ADMINISTRATION', 'OFFICER_DISQUALIFIED'];
    if (criticalEvents.includes(eventType)) return 'critical';

    const highEvents = ['CVA', 'INSOLVENCY_EVENT', 'PSC_NOTIFIED', 'PSC_CEASED', 'STATUS_CHANGE'];
    if (highEvents.includes(eventType)) return 'high';

    const mediumEvents = ['OFFICER_RESIGNED', 'OFFICER_APPOINTED', 'NAME_CHANGE', 'ADDRESS_CHANGE', 'CHARGE_CREATED'];
    if (mediumEvents.includes(eventType)) return 'medium';

    return 'low';
  }

  generateSummary(streamType, data) {
    const eventType = this.classifyEvent(streamType, data);
    const companyName = data.data?.company_name || 'Unknown Company';

    switch (eventType) {
      case 'LIQUIDATION':
        return `${companyName} has entered liquidation proceedings`;
      case 'ADMINISTRATION':
        return `${companyName} has entered administration`;
      case 'CVA':
        return `${companyName} has entered a Company Voluntary Arrangement`;
      case 'OFFICER_DISQUALIFIED':
        return `An officer of ${companyName} has been disqualified`;
      case 'PSC_NOTIFIED':
        return `New PSC notified for ${companyName}: ${data.data?.name || 'Unknown'}`;
      case 'PSC_CEASED':
        return `PSC ceased for ${companyName}`;
      case 'OFFICER_RESIGNED':
        return `Officer resigned from ${companyName}: ${data.data?.name || 'Unknown'}`;
      case 'OFFICER_APPOINTED':
        return `New officer appointed to ${companyName}`;
      case 'STATUS_CHANGE':
        return `${companyName} status changed to: ${data.data?.company_status || 'unknown'}`;
      case 'ADDRESS_CHANGE':
        return `${companyName} registered office address changed`;
      case 'CHARGE_CREATED':
        return `New charge registered against ${companyName}`;
      default:
        return `Update received for ${companyName}`;
    }
  }

  // ============================================
  // HIGH-RISK EVENT DETECTION (GLOBAL)
  // ============================================

  checkHighRiskEvent(streamType, data) {
    if (streamType === 'disqualified-officers') {
      this.handleDisqualifiedOfficer(data);
    }
    if (streamType === 'insolvency-cases') {
      this.handleInsolvencyEvent(data);
    }
  }

  handleDisqualifiedOfficer(data) {
    const officer = {
      name: data.data?.name,
      companyNumber: data.data?.company_number,
      disqualificationDetails: data.data?.disqualification,
      dateOfBirth: data.data?.date_of_birth,
      detectedAt: new Date().toISOString()
    };

    if (officer.name) {
      this.disqualifiedOfficers.set(officer.name.toLowerCase(), officer);
    }
  }

  handleInsolvencyEvent(data) {
    const companyNumber = data.data?.company_number;
    if (companyNumber && this.watchlist.has(companyNumber)) {
      // Already handled by watchlist alert path
      return;
    }
    // Global insolvency events stored as alerts for cross-reference
    const alert = {
      id: `insolvency_global_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'companies_house_stream',
      streamType: 'insolvency-cases',
      companyNumber,
      eventType: this.classifyEvent('insolvency-cases', data),
      severity: 'high',
      summary: `${data.data?.company_name || 'Unknown'} insolvency event detected`,
      rawData: data
    };
    this.saveAlert(alert);
  }

  // ============================================
  // WATCHLIST MANAGEMENT
  // ============================================

  addToWatchlist(companyNumber) {
    this.watchlist.add(companyNumber);
    console.log(`Added ${companyNumber} to watchlist (total: ${this.watchlist.size})`);
  }

  removeFromWatchlist(companyNumber) {
    this.watchlist.delete(companyNumber);
    console.log(`Removed ${companyNumber} from watchlist (total: ${this.watchlist.size})`);
  }

  getWatchlist() {
    return [...this.watchlist];
  }

  // ============================================
  // PERSISTENCE (IN-MEMORY)
  // ============================================

  saveAlert(alert) {
    this.alerts.push(alert);
    // Keep last 10,000 alerts in memory
    if (this.alerts.length > 10000) {
      this.alerts = this.alerts.slice(-10000);
    }
  }

  getAlerts({ severity, companyNumber, limit = 50, offset = 0 } = {}) {
    let filtered = this.alerts;
    if (severity) {
      filtered = filtered.filter(a => a.severity === severity);
    }
    if (companyNumber) {
      filtered = filtered.filter(a => a.companyNumber === companyNumber);
    }
    // Most recent first
    return filtered.slice().reverse().slice(offset, offset + limit);
  }

  getAlertCounts() {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, total: this.alerts.length };
    for (const a of this.alerts) {
      if (counts[a.severity] !== undefined) counts[a.severity]++;
    }
    return counts;
  }

  // Check if a person name matches any disqualified officers
  checkDisqualifiedOfficer(name) {
    if (!name) return null;
    const key = name.toLowerCase();
    const exact = this.disqualifiedOfficers.get(key);
    if (exact) return exact;

    // Partial match
    for (const [officerName, officer] of this.disqualifiedOfficers) {
      if (officerName.includes(key) || key.includes(officerName)) {
        return officer;
      }
    }
    return null;
  }

  // ============================================
  // EVENT CALLBACKS
  // ============================================

  onAlert(callback) {
    this.eventCallbacks.push(callback);
  }

  emitEvent(alert) {
    for (const cb of this.eventCallbacks) {
      try { cb(alert); } catch (e) { console.error('Alert callback error:', e.message); }
    }
  }

  // ============================================
  // STATUS
  // ============================================

  getStatus() {
    const connected = [];
    for (const [type, es] of this.streams) {
      connected.push({ stream: type, readyState: es.readyState });
    }
    return {
      configured: !!this.apiKey,
      streams: connected,
      watchlistSize: this.watchlist.size,
      alertCount: this.alerts.length,
      disqualifiedOfficersTracked: this.disqualifiedOfficers.size
    };
  }
}

module.exports = { CompaniesHouseStreamService };
