// Transaction Monitoring & Fraud Typology Detection Engine
// Comprehensive AML/CFT detection rules across 16 categories with 36 rules

class TransactionMonitoringService {
  constructor() {
    this.rules = this._initRules();
    this.highRiskCountries = new Set([
      'AF','BY','MM','CF','CD','CU','GQ','ER','IR','IQ','LB','LY','ML',
      'NI','KP','SO','SS','SD','SY','VE','YE','ZW','RU'
    ]);
    this.taxHavens = new Set([
      'VG','KY','BM','PA','SC','BS','JE','GG','IM','LI','MC','GI','AI',
      'TC','WS','VU','MH','BZ','AG','DM','KN','LC','VC','CK','NR','NU','SM'
    ]);
    this.highRiskMCCs = new Set([
      '6051','6211','6012','7995','5933','5944','5094','7273','4829',
      '6050','6010','6540','7801','7802','7800'
    ]);
  }

  // Main entry: analyze a set of transactions for an entity
  async analyzeTransactions(params) {
    const { transactions, entityProfile, options = {} } = params;
    if (!transactions || transactions.length === 0) {
      return { alerts: [], riskScore: 0, summary: 'No transactions to analyze' };
    }

    const normalized = transactions.map(tx => this._normalize(tx));
    const profile = entityProfile || this._buildProfile(normalized);
    const alerts = [];

    for (const rule of this.rules) {
      if (options.categories && !options.categories.includes(rule.category)) continue;
      try {
        const ruleAlerts = rule.detect(normalized, profile);
        alerts.push(...ruleAlerts);
      } catch (e) {
        // Skip failed rules silently
      }
    }

    // Deduplicate and sort by score
    alerts.sort((a, b) => b.score - a.score);

    const compositeRisk = this.computeCompositeRiskScore(alerts, profile);

    return {
      entityProfile: profile,
      transactionCount: normalized.length,
      alerts,
      riskAssessment: {
        score: compositeRisk.compositeScore,
        level: compositeRisk.level,
        alertCount: alerts.length,
        priority: compositeRisk.priority,
        sla: compositeRisk.sla,
        sarRequired: compositeRisk.sarRequired,
        recommendedActions: compositeRisk.recommendedActions
      },
      compositeScoring: compositeRisk,
      categorySummary: this._categorySummary(alerts),
      screenedAt: new Date().toISOString()
    };
  }

  _normalize(tx) {
    return {
      id: tx.id || tx.transactionId || crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      date: new Date(tx.date || tx.timestamp || tx.transactionDate),
      amount: parseFloat(tx.amount || 0),
      currency: (tx.currency || 'USD').toUpperCase(),
      type: (tx.type || tx.transactionType || 'UNKNOWN').toUpperCase(),
      direction: (tx.direction || (tx.amount > 0 ? 'CREDIT' : 'DEBIT')).toUpperCase(),
      counterparty: tx.counterparty || tx.counterpartyName || tx.beneficiary || '',
      counterpartyCountry: (tx.counterpartyCountry || tx.country || '').toUpperCase(),
      counterpartyAccount: tx.counterpartyAccount || tx.beneficiaryAccount || '',
      channel: (tx.channel || 'UNKNOWN').toUpperCase(),
      mcc: tx.mcc || tx.merchantCategoryCode || '',
      description: tx.description || tx.narrative || '',
      reference: tx.reference || '',
      cryptoAddress: tx.cryptoAddress || tx.walletAddress || '',
      blockchain: tx.blockchain || '',
      ...tx._raw
    };
  }

  _buildProfile(transactions) {
    if (transactions.length === 0) return { avgAmount: 0, totalVolume: 0, txCount: 0 };
    const amounts = transactions.map(t => Math.abs(t.amount));
    const total = amounts.reduce((s, a) => s + a, 0);
    const countries = new Set(transactions.map(t => t.counterpartyCountry).filter(Boolean));
    const channels = new Set(transactions.map(t => t.channel).filter(Boolean));
    const dates = transactions.map(t => t.date).sort((a, b) => a - b);
    const daySpan = Math.max(1, (dates[dates.length - 1] - dates[0]) / 86400000);

    return {
      avgAmount: total / amounts.length,
      medianAmount: amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)],
      maxAmount: Math.max(...amounts),
      totalVolume: total,
      txCount: transactions.length,
      txPerDay: transactions.length / daySpan,
      uniqueCounterparties: new Set(transactions.map(t => t.counterparty).filter(Boolean)).size,
      uniqueCountries: countries.size,
      countries: [...countries],
      channels: [...channels],
      dateRange: { from: dates[0]?.toISOString(), to: dates[dates.length - 1]?.toISOString(), days: daySpan }
    };
  }

  _categorySummary(alerts) {
    const cats = {};
    for (const a of alerts) {
      if (!cats[a.category]) cats[a.category] = { count: 0, maxScore: 0, alerts: [] };
      cats[a.category].count++;
      cats[a.category].maxScore = Math.max(cats[a.category].maxScore, a.score);
      cats[a.category].alerts.push(a.ruleId);
    }
    return cats;
  }

  // Composite Risk Scoring with category caps and weighted aggregation
  computeCompositeRiskScore(alerts, entityProfile = {}) {
    // Category caps prevent any single category from dominating
    const categoryCaps = {
      STRUCTURING: 50, VELOCITY: 45, GEOGRAPHIC: 40, COUNTERPARTY: 50,
      BEHAVIORAL: 35, CRYPTO: 55, TBML: 50, REAL_ESTATE: 45,
      GAMBLING: 35, INTEGRATION: 40, MSB_HAWALA: 45, SECURITIES: 40,
      HUMAN_TRAFFICKING: 55, CASH_BUSINESS: 35, SANCTIONS_EVASION: 60,
      CORRUPTION: 50, NETWORK: 50, FRAUD: 55,
      // New categories
      ELDER_EXPLOITATION: 45, ROMANCE_SCAM: 50, BEC_FRAUD: 55,
      TAX_EVASION: 50, DRUG_TRAFFICKING: 60, TERRORIST_FINANCING: 65,
      PROLIFERATION: 65, ARMS_TRAFFICKING: 60, ENVIRONMENTAL_CRIME: 45,
      ORGANIZED_CRIME: 55, PONZI_SCHEME: 55, ART_LAUNDERING: 40,
      SPORTS_CORRUPTION: 40, CORRESPONDENT_BANKING: 50, PREPAID_ABUSE: 45,
      MOBILE_LAUNDERING: 35, CROWDFUNDING_ABUSE: 35, SHELL_COMPANY: 50,
      PROFESSIONAL_ENABLER: 35, COVID_FRAUD: 50, TRADE_FINANCE: 45,
      SMURFING: 55, INVOICE_FACTORING: 40, LAYERING: 55
    };

    // Category weights (higher = more impactful on final score)
    const categoryWeights = {
      SANCTIONS_EVASION: 1.5, HUMAN_TRAFFICKING: 1.4, CORRUPTION: 1.3,
      CRYPTO: 1.2, STRUCTURING: 1.1, COUNTERPARTY: 1.1, TBML: 1.2,
      NETWORK: 1.2, FRAUD: 1.3,
      // New category weights
      TERRORIST_FINANCING: 1.6, PROLIFERATION: 1.6, DRUG_TRAFFICKING: 1.4,
      ARMS_TRAFFICKING: 1.4, ORGANIZED_CRIME: 1.3, PONZI_SCHEME: 1.2,
      BEC_FRAUD: 1.2, ELDER_EXPLOITATION: 1.2, ROMANCE_SCAM: 1.1,
      LAYERING: 1.3, SMURFING: 1.3, SHELL_COMPANY: 1.2
    };

    // Aggregate scores per category, applying caps
    const catScores = {};
    for (const a of alerts) {
      catScores[a.category] = (catScores[a.category] || 0) + a.score;
    }
    for (const cat of Object.keys(catScores)) {
      const cap = categoryCaps[cat] || 40;
      catScores[cat] = Math.min(catScores[cat], cap);
    }

    // Weighted sum
    let weightedSum = 0;
    let totalWeight = 0;
    for (const [cat, score] of Object.entries(catScores)) {
      const w = categoryWeights[cat] || 1.0;
      weightedSum += score * w;
      totalWeight += w;
    }

    // Normalize to 0-100
    const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Severity multipliers based on alert composition
    const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
    const highCount = alerts.filter(a => a.severity === 'HIGH').length;
    let severityMultiplier = 1.0;
    if (criticalCount >= 3) severityMultiplier = 1.4;
    else if (criticalCount >= 1) severityMultiplier = 1.2;
    else if (highCount >= 5) severityMultiplier = 1.15;

    // Cross-category correlation bonus: multiple categories = higher risk
    const activeCats = Object.keys(catScores).length;
    let correlationBonus = 0;
    if (activeCats >= 5) correlationBonus = 15;
    else if (activeCats >= 3) correlationBonus = 8;
    else if (activeCats >= 2) correlationBonus = 3;

    const finalScore = Math.min(100, Math.round(rawScore * severityMultiplier + correlationBonus));
    const level = finalScore >= 80 ? 'CRITICAL' : finalScore >= 60 ? 'HIGH' : finalScore >= 30 ? 'MEDIUM' : 'LOW';

    // Priority and SLA assignment
    let priority, sla;
    if (finalScore >= 80) { priority = 'P1'; sla = '4 hours'; }
    else if (finalScore >= 60) { priority = 'P2'; sla = '24 hours'; }
    else if (finalScore >= 30) { priority = 'P3'; sla = '72 hours'; }
    else { priority = 'P4'; sla = '5 business days'; }

    // Recommended actions
    const actions = [];
    if (finalScore >= 80) actions.push('IMMEDIATE_ESCALATION', 'SAR_FILING', 'ACCOUNT_FREEZE_REVIEW');
    else if (finalScore >= 60) actions.push('SENIOR_REVIEW', 'SAR_CONSIDERATION', 'ENHANCED_MONITORING');
    else if (finalScore >= 30) actions.push('ANALYST_REVIEW', 'ENHANCED_DUE_DILIGENCE');
    if (catScores.SANCTIONS_EVASION > 0) actions.push('OFAC_COMPLIANCE_REVIEW');
    if (catScores.HUMAN_TRAFFICKING > 0) actions.push('LAW_ENFORCEMENT_REFERRAL');

    return {
      compositeScore: finalScore, level, priority, sla,
      categoryScores: catScores, activeCategoryCount: activeCats,
      severityMultiplier, correlationBonus,
      recommendedActions: [...new Set(actions)],
      sarRequired: finalScore >= 60 || activeCats >= 4
    };
  }

  _initRules() {
    return [
      // ===== STRUCTURING DETECTION (STR) =====
      {
        id: 'STR-001', name: 'Just-Below Threshold Structuring',
        category: 'STRUCTURING', severity: 'HIGH',
        detect: (txs, profile) => {
          const alerts = [];
          const threshold = 10000;
          const justBelow = txs.filter(t => t.amount >= threshold * 0.8 && t.amount < threshold);
          if (justBelow.length >= 3) {
            // Check if within short time window
            const sorted = justBelow.sort((a, b) => a.date - b.date);
            for (let i = 0; i <= sorted.length - 3; i++) {
              const window = sorted.slice(i, i + 3);
              const span = (window[2].date - window[0].date) / 86400000;
              if (span <= 30) {
                alerts.push({
                  ruleId: 'STR-001', category: 'STRUCTURING', severity: 'HIGH',
                  score: 35, message: `${window.length} transactions just below $10,000 threshold within ${Math.ceil(span)} days`,
                  transactions: window.map(t => t.id),
                  details: { amounts: window.map(t => t.amount), totalAmount: window.reduce((s, t) => s + t.amount, 0) }
                });
                break;
              }
            }
          }
          return alerts;
        }
      },
      {
        id: 'STR-002', name: 'Round-Amount Structuring',
        category: 'STRUCTURING', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const round = txs.filter(t => t.amount >= 1000 && t.amount % 1000 === 0);
          if (round.length >= 5 && round.length / txs.length > 0.4) {
            alerts.push({
              ruleId: 'STR-002', category: 'STRUCTURING', severity: 'MEDIUM',
              score: 20, message: `${round.length} of ${txs.length} transactions are round amounts (${(round.length/txs.length*100).toFixed(0)}%)`,
              transactions: round.slice(0, 10).map(t => t.id),
              details: { roundCount: round.length, ratio: round.length / txs.length }
            });
          }
          return alerts;
        }
      },
      {
        id: 'STR-003', name: 'Split-Deposit Structuring',
        category: 'STRUCTURING', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const deposits = txs.filter(t => t.direction === 'CREDIT' && t.type !== 'TRANSFER');
          // Group by date
          const byDate = {};
          for (const d of deposits) {
            const key = d.date.toISOString().slice(0, 10);
            if (!byDate[key]) byDate[key] = [];
            byDate[key].push(d);
          }
          for (const [date, group] of Object.entries(byDate)) {
            if (group.length >= 3) {
              const total = group.reduce((s, t) => s + t.amount, 0);
              if (total >= 10000 && group.every(t => t.amount < 10000)) {
                alerts.push({
                  ruleId: 'STR-003', category: 'STRUCTURING', severity: 'HIGH',
                  score: 40, message: `${group.length} deposits on ${date} totaling $${total.toFixed(2)} — each under $10,000`,
                  transactions: group.map(t => t.id),
                  details: { date, count: group.length, total, amounts: group.map(t => t.amount) }
                });
              }
            }
          }
          return alerts;
        }
      },
      {
        id: 'STR-004', name: 'Incremental Amount Structuring',
        category: 'STRUCTURING', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const cash = txs.filter(t => ['CASH','DEPOSIT'].includes(t.type)).sort((a, b) => a.date - b.date);
          for (let i = 0; i <= cash.length - 4; i++) {
            const window = cash.slice(i, i + 4);
            const diffs = [];
            for (let j = 1; j < window.length; j++) diffs.push(window[j].amount - window[j-1].amount);
            const allIncreasing = diffs.every(d => d > 0 && d < 500);
            const allDecreasing = diffs.every(d => d < 0 && d > -500);
            if (allIncreasing || allDecreasing) {
              alerts.push({
                ruleId: 'STR-004', category: 'STRUCTURING', severity: 'MEDIUM',
                score: 25, message: `${allIncreasing ? 'Incrementally increasing' : 'Incrementally decreasing'} amounts detected across ${window.length} transactions`,
                transactions: window.map(t => t.id),
                details: { amounts: window.map(t => t.amount), pattern: allIncreasing ? 'INCREASING' : 'DECREASING' }
              });
              break;
            }
          }
          return alerts;
        }
      },

      // ===== VELOCITY & VOLUME DETECTION (VEL) =====
      {
        id: 'VEL-001', name: 'Unusual Transaction Volume Spike',
        category: 'VELOCITY', severity: 'HIGH',
        detect: (txs, profile) => {
          const alerts = [];
          // Group by week
          const byWeek = {};
          for (const t of txs) {
            const week = Math.floor(t.date.getTime() / (7 * 86400000));
            if (!byWeek[week]) byWeek[week] = { count: 0, volume: 0, txs: [] };
            byWeek[week].count++;
            byWeek[week].volume += Math.abs(t.amount);
            byWeek[week].txs.push(t.id);
          }
          const weeks = Object.values(byWeek);
          if (weeks.length < 3) return alerts;
          const avgVolume = weeks.reduce((s, w) => s + w.volume, 0) / weeks.length;
          for (const w of weeks) {
            if (w.volume > avgVolume * 3 && w.volume > 50000) {
              alerts.push({
                ruleId: 'VEL-001', category: 'VELOCITY', severity: 'HIGH',
                score: 30, message: `Weekly volume $${w.volume.toFixed(0)} is ${(w.volume/avgVolume).toFixed(1)}x the average ($${avgVolume.toFixed(0)})`,
                transactions: w.txs.slice(0, 10),
                details: { weekVolume: w.volume, avgWeekVolume: avgVolume, multiplier: w.volume / avgVolume }
              });
              break;
            }
          }
          return alerts;
        }
      },
      {
        id: 'VEL-002', name: 'Rapid-Fire Transactions',
        category: 'VELOCITY', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const sorted = [...txs].sort((a, b) => a.date - b.date);
          for (let i = 0; i <= sorted.length - 5; i++) {
            const window = sorted.slice(i, i + 5);
            const span = (window[4].date - window[0].date) / 3600000; // hours
            if (span <= 1) {
              const total = window.reduce((s, t) => s + Math.abs(t.amount), 0);
              alerts.push({
                ruleId: 'VEL-002', category: 'VELOCITY', severity: 'HIGH',
                score: 30, message: `${window.length} transactions within ${span.toFixed(1)} hours totaling $${total.toFixed(0)}`,
                transactions: window.map(t => t.id),
                details: { count: window.length, hours: span, total }
              });
              break;
            }
          }
          return alerts;
        }
      },
      {
        id: 'VEL-003', name: 'Excessive Daily Transaction Count',
        category: 'VELOCITY', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const byDay = {};
          for (const t of txs) {
            const day = t.date.toISOString().slice(0, 10);
            if (!byDay[day]) byDay[day] = [];
            byDay[day].push(t);
          }
          for (const [day, group] of Object.entries(byDay)) {
            if (group.length >= 15) {
              alerts.push({
                ruleId: 'VEL-003', category: 'VELOCITY', severity: 'MEDIUM',
                score: 20, message: `${group.length} transactions on ${day}`,
                transactions: group.slice(0, 10).map(t => t.id),
                details: { date: day, count: group.length }
              });
              break;
            }
          }
          return alerts;
        }
      },
      {
        id: 'VEL-004', name: 'Pass-Through / Flow-Through Activity',
        category: 'VELOCITY', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          const sorted = [...txs].sort((a, b) => a.date - b.date);
          for (let i = 0; i < sorted.length - 1; i++) {
            const inbound = sorted[i];
            if (inbound.direction !== 'CREDIT') continue;
            for (let j = i + 1; j < sorted.length; j++) {
              const outbound = sorted[j];
              if (outbound.direction !== 'DEBIT') continue;
              const timeDiff = (outbound.date - inbound.date) / 3600000;
              if (timeDiff > 48) break;
              const amountRatio = outbound.amount / inbound.amount;
              if (amountRatio >= 0.9 && amountRatio <= 1.0 && inbound.amount > 5000) {
                alerts.push({
                  ruleId: 'VEL-004', category: 'VELOCITY', severity: 'CRITICAL',
                  score: 45, message: `$${inbound.amount.toFixed(0)} in, $${outbound.amount.toFixed(0)} out within ${timeDiff.toFixed(1)} hours — pass-through pattern`,
                  transactions: [inbound.id, outbound.id],
                  details: { inAmount: inbound.amount, outAmount: outbound.amount, hours: timeDiff, ratio: amountRatio }
                });
                return alerts; // One alert sufficient
              }
            }
          }
          return alerts;
        }
      },

      // ===== GEOGRAPHIC RISK DETECTION (GEO) =====
      {
        id: 'GEO-001', name: 'High-Risk Jurisdiction Transactions',
        category: 'GEOGRAPHIC', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const hrj = txs.filter(t => this.highRiskCountries.has(t.counterpartyCountry));
          if (hrj.length > 0) {
            const countries = [...new Set(hrj.map(t => t.counterpartyCountry))];
            const total = hrj.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'GEO-001', category: 'GEOGRAPHIC', severity: 'HIGH',
              score: 35, message: `${hrj.length} transaction(s) involving high-risk jurisdictions: ${countries.join(', ')}`,
              transactions: hrj.slice(0, 10).map(t => t.id),
              details: { countries, count: hrj.length, totalAmount: total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'GEO-002', name: 'Tax Haven Transactions',
        category: 'GEOGRAPHIC', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const th = txs.filter(t => this.taxHavens.has(t.counterpartyCountry));
          if (th.length >= 3) {
            const countries = [...new Set(th.map(t => t.counterpartyCountry))];
            const total = th.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'GEO-002', category: 'GEOGRAPHIC', severity: 'MEDIUM',
              score: 25, message: `${th.length} transaction(s) to/from tax havens: ${countries.join(', ')}`,
              transactions: th.slice(0, 10).map(t => t.id),
              details: { countries, count: th.length, totalAmount: total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'GEO-003', name: 'Unusual Geographic Spread',
        category: 'GEOGRAPHIC', severity: 'MEDIUM',
        detect: (txs, profile) => {
          const alerts = [];
          const countries = new Set(txs.map(t => t.counterpartyCountry).filter(Boolean));
          if (countries.size >= 10 && txs.length < 100) {
            alerts.push({
              ruleId: 'GEO-003', category: 'GEOGRAPHIC', severity: 'MEDIUM',
              score: 20, message: `Transactions span ${countries.size} countries across only ${txs.length} transactions`,
              transactions: [],
              details: { countryCount: countries.size, txCount: txs.length, countries: [...countries] }
            });
          }
          return alerts;
        }
      },

      // ===== COUNTERPARTY RISK DETECTION (CTY) =====
      {
        id: 'CTY-001', name: 'Shell Company Indicators',
        category: 'COUNTERPARTY', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const shellPatterns = /\b(holdings|trading|consulting|services|international|global|ventures|capital|group|investment)\b/i;
          const shellCounterparties = txs.filter(t =>
            shellPatterns.test(t.counterparty) && this.taxHavens.has(t.counterpartyCountry)
          );
          if (shellCounterparties.length >= 2) {
            const names = [...new Set(shellCounterparties.map(t => t.counterparty))];
            alerts.push({
              ruleId: 'CTY-001', category: 'COUNTERPARTY', severity: 'HIGH',
              score: 30, message: `${names.length} counterparty/ies in tax havens with generic names: ${names.slice(0, 3).join(', ')}`,
              transactions: shellCounterparties.slice(0, 10).map(t => t.id),
              details: { counterparties: names, count: shellCounterparties.length }
            });
          }
          return alerts;
        }
      },
      {
        id: 'CTY-002', name: 'Concentration Risk — Single Counterparty',
        category: 'COUNTERPARTY', severity: 'MEDIUM',
        detect: (txs, profile) => {
          const alerts = [];
          const cpVolume = {};
          for (const t of txs) {
            if (!t.counterparty) continue;
            if (!cpVolume[t.counterparty]) cpVolume[t.counterparty] = 0;
            cpVolume[t.counterparty] += Math.abs(t.amount);
          }
          for (const [cp, vol] of Object.entries(cpVolume)) {
            const ratio = vol / (profile.totalVolume || 1);
            if (ratio > 0.6 && vol > 50000) {
              alerts.push({
                ruleId: 'CTY-002', category: 'COUNTERPARTY', severity: 'MEDIUM',
                score: 20, message: `${(ratio * 100).toFixed(0)}% of volume ($${vol.toFixed(0)}) is with single counterparty: ${cp}`,
                transactions: txs.filter(t => t.counterparty === cp).slice(0, 5).map(t => t.id),
                details: { counterparty: cp, volume: vol, ratio }
              });
              break;
            }
          }
          return alerts;
        }
      },
      {
        id: 'CTY-003', name: 'New Counterparty with Large Transaction',
        category: 'COUNTERPARTY', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const sorted = [...txs].sort((a, b) => a.date - b.date);
          const seen = new Set();
          for (const t of sorted) {
            if (!t.counterparty) continue;
            if (!seen.has(t.counterparty) && t.amount > 25000) {
              alerts.push({
                ruleId: 'CTY-003', category: 'COUNTERPARTY', severity: 'MEDIUM',
                score: 20, message: `First transaction with "${t.counterparty}" is $${t.amount.toFixed(0)}`,
                transactions: [t.id],
                details: { counterparty: t.counterparty, amount: t.amount, date: t.date.toISOString() }
              });
              break;
            }
            seen.add(t.counterparty);
          }
          return alerts;
        }
      },
      {
        id: 'CTY-004', name: 'Circular Transaction Pattern',
        category: 'COUNTERPARTY', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          // Look for A->B->A patterns
          const pairs = {};
          for (const t of txs) {
            if (!t.counterparty) continue;
            const key = `${t.direction}:${t.counterparty}`;
            if (!pairs[key]) pairs[key] = [];
            pairs[key].push(t);
          }
          for (const cp of new Set(txs.map(t => t.counterparty).filter(Boolean))) {
            const sent = pairs[`DEBIT:${cp}`] || [];
            const received = pairs[`CREDIT:${cp}`] || [];
            if (sent.length >= 2 && received.length >= 2) {
              const sentTotal = sent.reduce((s, t) => s + t.amount, 0);
              const recvTotal = received.reduce((s, t) => s + t.amount, 0);
              const ratio = Math.min(sentTotal, recvTotal) / Math.max(sentTotal, recvTotal);
              if (ratio > 0.7 && sentTotal > 10000) {
                alerts.push({
                  ruleId: 'CTY-004', category: 'COUNTERPARTY', severity: 'CRITICAL',
                  score: 45, message: `Circular flow with "${cp}": sent $${sentTotal.toFixed(0)}, received $${recvTotal.toFixed(0)}`,
                  transactions: [...sent, ...received].slice(0, 10).map(t => t.id),
                  details: { counterparty: cp, sentTotal, recvTotal, ratio }
                });
                break;
              }
            }
          }
          return alerts;
        }
      },

      // ===== BEHAVIORAL ANOMALY DETECTION (BEH) =====
      {
        id: 'BEH-001', name: 'Dormant Account Reactivation',
        category: 'BEHAVIORAL', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const sorted = [...txs].sort((a, b) => a.date - b.date);
          for (let i = 1; i < sorted.length; i++) {
            const gap = (sorted[i].date - sorted[i-1].date) / 86400000;
            if (gap >= 90 && sorted[i].amount > 10000) {
              alerts.push({
                ruleId: 'BEH-001', category: 'BEHAVIORAL', severity: 'HIGH',
                score: 30, message: `Account dormant for ${Math.floor(gap)} days then $${sorted[i].amount.toFixed(0)} transaction`,
                transactions: [sorted[i].id],
                details: { dormantDays: Math.floor(gap), reactivationAmount: sorted[i].amount }
              });
              break;
            }
          }
          return alerts;
        }
      },
      {
        id: 'BEH-002', name: 'Unusual Transaction Time',
        category: 'BEHAVIORAL', severity: 'LOW',
        detect: (txs) => {
          const alerts = [];
          const offHours = txs.filter(t => {
            const h = t.date.getUTCHours();
            return (h >= 0 && h < 5) || (h >= 23);
          });
          if (offHours.length >= 5 && offHours.length / txs.length > 0.3) {
            alerts.push({
              ruleId: 'BEH-002', category: 'BEHAVIORAL', severity: 'LOW',
              score: 10, message: `${offHours.length} transactions during off-hours (11pm-5am UTC)`,
              transactions: offHours.slice(0, 5).map(t => t.id),
              details: { offHoursCount: offHours.length, ratio: offHours.length / txs.length }
            });
          }
          return alerts;
        }
      },
      {
        id: 'BEH-003', name: 'Channel Switching',
        category: 'BEHAVIORAL', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const sorted = [...txs].sort((a, b) => a.date - b.date);
          let switches = 0;
          for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].channel !== sorted[i-1].channel && sorted[i].channel !== 'UNKNOWN' && sorted[i-1].channel !== 'UNKNOWN') {
              switches++;
            }
          }
          if (switches > txs.length * 0.6 && txs.length > 5) {
            alerts.push({
              ruleId: 'BEH-003', category: 'BEHAVIORAL', severity: 'MEDIUM',
              score: 15, message: `Frequent channel switching: ${switches} changes across ${txs.length} transactions`,
              transactions: [],
              details: { switches, txCount: txs.length }
            });
          }
          return alerts;
        }
      },
      {
        id: 'BEH-004', name: 'Amount Anomaly — Outlier Detection',
        category: 'BEHAVIORAL', severity: 'HIGH',
        detect: (txs, profile) => {
          const alerts = [];
          if (txs.length < 5) return alerts;
          const amounts = txs.map(t => Math.abs(t.amount)).sort((a, b) => a - b);
          const q1 = amounts[Math.floor(amounts.length * 0.25)];
          const q3 = amounts[Math.floor(amounts.length * 0.75)];
          const iqr = q3 - q1;
          const upperFence = q3 + 3 * iqr;
          const outliers = txs.filter(t => Math.abs(t.amount) > upperFence && Math.abs(t.amount) > 10000);
          if (outliers.length > 0) {
            alerts.push({
              ruleId: 'BEH-004', category: 'BEHAVIORAL', severity: 'HIGH',
              score: 25, message: `${outliers.length} extreme outlier transaction(s) — amounts exceed $${upperFence.toFixed(0)} (3×IQR fence)`,
              transactions: outliers.slice(0, 5).map(t => t.id),
              details: { outlierCount: outliers.length, fence: upperFence, maxOutlier: Math.max(...outliers.map(t => Math.abs(t.amount))) }
            });
          }
          return alerts;
        }
      },
      {
        id: 'BEH-005', name: 'High-Risk MCC Activity',
        category: 'BEHAVIORAL', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const risky = txs.filter(t => this.highRiskMCCs.has(t.mcc));
          if (risky.length >= 3) {
            const total = risky.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'BEH-005', category: 'BEHAVIORAL', severity: 'MEDIUM',
              score: 20, message: `${risky.length} transactions with high-risk merchant category codes totaling $${total.toFixed(0)}`,
              transactions: risky.slice(0, 5).map(t => t.id),
              details: { mccs: [...new Set(risky.map(t => t.mcc))], count: risky.length, total }
            });
          }
          return alerts;
        }
      },

      // ===== CRYPTOCURRENCY DETECTION (CRY) =====
      {
        id: 'CRY-001', name: 'Crypto Exchange Fiat On/Off Ramp',
        category: 'CRYPTO', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const cryptoExchanges = /\b(coinbase|binance|kraken|bitfinex|bitstamp|gemini|ftx|huobi|okex|kucoin|bybit|gate\.io|crypto\.com|bittrex|poloniex)\b/i;
          const exchangeTxs = txs.filter(t => cryptoExchanges.test(t.counterparty) || cryptoExchanges.test(t.description));
          if (exchangeTxs.length >= 3) {
            const total = exchangeTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'CRY-001', category: 'CRYPTO', severity: 'MEDIUM',
              score: 20, message: `${exchangeTxs.length} transactions with crypto exchanges totaling $${total.toFixed(0)}`,
              transactions: exchangeTxs.slice(0, 5).map(t => t.id),
              details: { exchanges: [...new Set(exchangeTxs.map(t => t.counterparty))], count: exchangeTxs.length, total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'CRY-002', name: 'Rapid Crypto-Fiat Conversion',
        category: 'CRYPTO', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const cryptoExchanges = /\b(coinbase|binance|kraken|bitfinex|bitstamp|gemini|ftx|huobi|okex|kucoin|bybit|crypto\.com)\b/i;
          const sorted = txs.filter(t => cryptoExchanges.test(t.counterparty) || cryptoExchanges.test(t.description)).sort((a, b) => a.date - b.date);
          for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].direction === 'CREDIT' && sorted[i+1].direction === 'DEBIT') {
              const gap = (sorted[i+1].date - sorted[i].date) / 3600000;
              if (gap <= 24 && sorted[i].amount > 5000) {
                alerts.push({
                  ruleId: 'CRY-002', category: 'CRYPTO', severity: 'HIGH',
                  score: 30, message: `Rapid crypto-fiat conversion: $${sorted[i].amount.toFixed(0)} in, $${sorted[i+1].amount.toFixed(0)} out within ${gap.toFixed(1)} hours`,
                  transactions: [sorted[i].id, sorted[i+1].id],
                  details: { inAmount: sorted[i].amount, outAmount: sorted[i+1].amount, hours: gap }
                });
                break;
              }
            }
          }
          return alerts;
        }
      },
      {
        id: 'CRY-003', name: 'Peer-to-Peer / Mixer Indicators',
        category: 'CRYPTO', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const mixerPatterns = /\b(tornado|mixer|tumbler|wasabi|samourai|chipmixer|blender|helix|bestmixer|coinjoin)\b/i;
          const p2pPatterns = /\b(localbitcoins|paxful|bisq|hodlhodl|peach|robosats)\b/i;
          const mixerTxs = txs.filter(t => mixerPatterns.test(t.counterparty) || mixerPatterns.test(t.description));
          const p2pTxs = txs.filter(t => p2pPatterns.test(t.counterparty) || p2pPatterns.test(t.description));
          if (mixerTxs.length > 0) {
            alerts.push({
              ruleId: 'CRY-003', category: 'CRYPTO', severity: 'CRITICAL',
              score: 50, message: `${mixerTxs.length} transaction(s) linked to crypto mixing/tumbling services`,
              transactions: mixerTxs.map(t => t.id),
              details: { services: [...new Set(mixerTxs.map(t => t.counterparty))] }
            });
          }
          if (p2pTxs.length >= 3) {
            alerts.push({
              ruleId: 'CRY-003', category: 'CRYPTO', severity: 'MEDIUM',
              score: 20, message: `${p2pTxs.length} transaction(s) with P2P crypto platforms`,
              transactions: p2pTxs.slice(0, 5).map(t => t.id),
              details: { platforms: [...new Set(p2pTxs.map(t => t.counterparty))] }
            });
          }
          return alerts;
        }
      },

      // ===== TRADE-BASED MONEY LAUNDERING (TBML) =====
      {
        id: 'TBML-001', name: 'Over/Under Invoicing Indicators',
        category: 'TBML', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const tradeTxs = txs.filter(t => /\b(invoice|trade|import|export|shipment|cargo|freight|goods|merchandise)\b/i.test(t.description));
          if (tradeTxs.length < 2) return alerts;
          // Check for matching pairs with very different amounts to same counterparty
          const byCp = {};
          for (const t of tradeTxs) {
            if (!t.counterparty) continue;
            (byCp[t.counterparty] = byCp[t.counterparty] || []).push(t);
          }
          for (const [cp, group] of Object.entries(byCp)) {
            if (group.length < 2) continue;
            const amounts = group.map(t => t.amount).sort((a, b) => a - b);
            const ratio = amounts[amounts.length - 1] / amounts[0];
            if (ratio > 5 && amounts[amounts.length - 1] > 10000) {
              alerts.push({
                ruleId: 'TBML-001', category: 'TBML', severity: 'HIGH',
                score: 35, message: `Trade invoices to "${cp}" vary ${ratio.toFixed(1)}x ($${amounts[0].toFixed(0)} to $${amounts[amounts.length-1].toFixed(0)}) — possible over/under invoicing`,
                transactions: group.slice(0, 5).map(t => t.id),
                details: { counterparty: cp, minAmount: amounts[0], maxAmount: amounts[amounts.length-1], ratio }
              });
              break;
            }
          }
          return alerts;
        }
      },
      {
        id: 'TBML-002', name: 'Phantom Shipment / No-Goods Payment',
        category: 'TBML', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const tradePayments = txs.filter(t =>
            t.direction === 'DEBIT' && t.amount > 10000 &&
            /\b(consulting|services|advisory|management fee|commission|licensing|royalt|IP)\b/i.test(t.description) &&
            this.taxHavens.has(t.counterpartyCountry)
          );
          if (tradePayments.length >= 2) {
            const total = tradePayments.reduce((s, t) => s + t.amount, 0);
            alerts.push({
              ruleId: 'TBML-002', category: 'TBML', severity: 'HIGH',
              score: 35, message: `${tradePayments.length} vague "services/consulting" payments to tax havens totaling $${total.toFixed(0)} — possible phantom invoicing`,
              transactions: tradePayments.slice(0, 5).map(t => t.id),
              details: { count: tradePayments.length, total, countries: [...new Set(tradePayments.map(t => t.counterpartyCountry))] }
            });
          }
          return alerts;
        }
      },

      // ===== REAL ESTATE LAUNDERING (RE) =====
      {
        id: 'RE-001', name: 'Real Estate / High-Value Purchase Pattern',
        category: 'REAL_ESTATE', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const reTxs = txs.filter(t =>
            t.amount > 50000 &&
            /\b(escrow|title|realty|real estate|property|mortgage|closing|deed|convey|settlement)\b/i.test(t.description || t.counterparty)
          );
          if (reTxs.length === 0) return alerts;
          const cashFunded = reTxs.filter(t => {
            // Check if funded by structured cash deposits in prior 30 days
            const priorDate = new Date(t.date.getTime() - 30 * 86400000);
            const priorCash = txs.filter(p =>
              p.direction === 'CREDIT' && p.date >= priorDate && p.date < t.date &&
              ['CASH','DEPOSIT'].includes(p.type) && p.amount < 10000
            );
            return priorCash.length >= 3;
          });
          if (cashFunded.length > 0) {
            alerts.push({
              ruleId: 'RE-001', category: 'REAL_ESTATE', severity: 'HIGH',
              score: 40, message: `Real estate payment(s) preceded by structured cash deposits — possible integration`,
              transactions: cashFunded.map(t => t.id),
              details: { count: cashFunded.length }
            });
          }
          // Check for LLC/trust purchases
          const llcTxs = reTxs.filter(t => /\b(llc|ltd|trust|holdings|corp|inc|foundation)\b/i.test(t.counterparty));
          if (llcTxs.length > 0 && llcTxs.some(t => t.amount > 200000)) {
            alerts.push({
              ruleId: 'RE-001', category: 'REAL_ESTATE', severity: 'MEDIUM',
              score: 25, message: `High-value real estate transaction(s) involving LLC/trust entities`,
              transactions: llcTxs.slice(0, 5).map(t => t.id),
              details: { entities: [...new Set(llcTxs.map(t => t.counterparty))] }
            });
          }
          return alerts;
        }
      },

      // ===== CASINO & GAMBLING (GAM) =====
      {
        id: 'GAM-001', name: 'Casino / Gambling Activity',
        category: 'GAMBLING', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const gamblingPattern = /\b(casino|wager|bet365|draftkings|fanduel|pokerstars|gambling|slot|poker|sportsbook|betfair|william hill|mgm|caesars|wynn)\b/i;
          const gambTxs = txs.filter(t => gamblingPattern.test(t.counterparty) || gamblingPattern.test(t.description) || t.mcc === '7995');
          if (gambTxs.length < 3) return alerts;
          const total = gambTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
          const credits = gambTxs.filter(t => t.direction === 'CREDIT');
          const debits = gambTxs.filter(t => t.direction === 'DEBIT');
          // Check for buy-in/cash-out pattern (deposit then quick withdrawal)
          if (credits.length > 0 && debits.length > 0) {
            const creditTotal = credits.reduce((s, t) => s + t.amount, 0);
            const debitTotal = debits.reduce((s, t) => s + t.amount, 0);
            if (creditTotal / debitTotal > 0.8 && total > 10000) {
              alerts.push({
                ruleId: 'GAM-001', category: 'GAMBLING', severity: 'HIGH',
                score: 30, message: `Casino buy-in/cash-out pattern: $${debitTotal.toFixed(0)} in, $${creditTotal.toFixed(0)} out — minimal gambling loss`,
                transactions: gambTxs.slice(0, 10).map(t => t.id),
                details: { debitTotal, creditTotal, ratio: creditTotal / debitTotal }
              });
              return alerts;
            }
          }
          if (total > 20000) {
            alerts.push({
              ruleId: 'GAM-001', category: 'GAMBLING', severity: 'MEDIUM',
              score: 20, message: `${gambTxs.length} gambling transactions totaling $${total.toFixed(0)}`,
              transactions: gambTxs.slice(0, 5).map(t => t.id),
              details: { count: gambTxs.length, total }
            });
          }
          return alerts;
        }
      },

      // ===== LOAN-BACK / INTEGRATION SCHEMES (INT) =====
      {
        id: 'INT-001', name: 'Loan-Back / Deposit-as-Collateral',
        category: 'INTEGRATION', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const loanTxs = txs.filter(t =>
            /\b(loan|mortgage|credit|collateral|disbursement|repayment|principal|interest)\b/i.test(t.description)
          );
          if (loanTxs.length < 2) return alerts;
          // Look for large inbound followed by loan-related outbound
          const sorted = [...txs].sort((a, b) => a.date - b.date);
          for (const t of sorted) {
            if (t.direction !== 'CREDIT' || t.amount < 50000) continue;
            const loanFollowing = loanTxs.filter(l =>
              l.date > t.date && (l.date - t.date) / 86400000 < 60 && l.direction === 'CREDIT'
            );
            if (loanFollowing.length > 0) {
              alerts.push({
                ruleId: 'INT-001', category: 'INTEGRATION', severity: 'HIGH',
                score: 35, message: `Large deposit ($${t.amount.toFixed(0)}) followed by loan disbursement within 60 days — possible loan-back scheme`,
                transactions: [t.id, ...loanFollowing.map(l => l.id)],
                details: { depositAmount: t.amount, loanAmounts: loanFollowing.map(l => l.amount) }
              });
              break;
            }
          }
          return alerts;
        }
      },

      // ===== MSB / HAWALA INDICATORS (MSB) =====
      {
        id: 'MSB-001', name: 'Informal Value Transfer / Hawala Indicators',
        category: 'MSB_HAWALA', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const msbPattern = /\b(remit|transfer|money gram|western union|ria|xoom|worldremit|remitly|wise|transferwise|hawala|hundi|fei-ch'ien)\b/i;
          const msbTxs = txs.filter(t =>
            msbPattern.test(t.counterparty) || msbPattern.test(t.description) ||
            ['4829','6051','6050','6540'].includes(t.mcc)
          );
          if (msbTxs.length < 3) return alerts;
          const total = msbTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
          // High-risk corridor detection
          const highRiskCorridors = ['PK','AF','SO','YE','SY','IQ','LB','MM','BD','NP','IN','PH','KE','NG','ET'];
          const corridorTxs = msbTxs.filter(t => highRiskCorridors.includes(t.counterpartyCountry));
          if (corridorTxs.length >= 2) {
            alerts.push({
              ruleId: 'MSB-001', category: 'MSB_HAWALA', severity: 'HIGH',
              score: 35, message: `${corridorTxs.length} remittances to high-risk corridors totaling $${corridorTxs.reduce((s,t) => s + Math.abs(t.amount), 0).toFixed(0)}`,
              transactions: corridorTxs.slice(0, 5).map(t => t.id),
              details: { countries: [...new Set(corridorTxs.map(t => t.counterpartyCountry))], count: corridorTxs.length }
            });
          } else if (total > 20000) {
            alerts.push({
              ruleId: 'MSB-001', category: 'MSB_HAWALA', severity: 'MEDIUM',
              score: 20, message: `${msbTxs.length} MSB/remittance transactions totaling $${total.toFixed(0)}`,
              transactions: msbTxs.slice(0, 5).map(t => t.id),
              details: { count: msbTxs.length, total }
            });
          }
          return alerts;
        }
      },

      // ===== SECURITIES / INVESTMENT (SEC) =====
      {
        id: 'SEC-001', name: 'Securities / Investment Abuse Pattern',
        category: 'SECURITIES', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const secPattern = /\b(brokerage|securities|stock|bond|option|futures|etf|mutual fund|dividend|margin|settlement|custod)\b/i;
          const secTxs = txs.filter(t => secPattern.test(t.counterparty) || secPattern.test(t.description) || ['6211'].includes(t.mcc));
          if (secTxs.length < 3) return alerts;
          // Check for deposits followed by immediate withdrawals (pass-through)
          const deposits = secTxs.filter(t => t.direction === 'CREDIT').sort((a, b) => a.date - b.date);
          const withdrawals = secTxs.filter(t => t.direction === 'DEBIT').sort((a, b) => a.date - b.date);
          for (const dep of deposits) {
            const quickWith = withdrawals.find(w =>
              w.date > dep.date && (w.date - dep.date) / 86400000 < 7 &&
              w.amount / dep.amount >= 0.85 && dep.amount > 25000
            );
            if (quickWith) {
              alerts.push({
                ruleId: 'SEC-001', category: 'SECURITIES', severity: 'HIGH',
                score: 30, message: `Brokerage deposit $${dep.amount.toFixed(0)} followed by $${quickWith.amount.toFixed(0)} withdrawal within 7 days — possible pass-through`,
                transactions: [dep.id, quickWith.id],
                details: { depositAmount: dep.amount, withdrawalAmount: quickWith.amount }
              });
              break;
            }
          }
          return alerts;
        }
      },

      // ===== HUMAN TRAFFICKING INDICATORS (HT) =====
      {
        id: 'HT-001', name: 'Human Trafficking / Exploitation Indicators',
        category: 'HUMAN_TRAFFICKING', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          const htBusinesses = /\b(massage|spa|nail salon|escort|staffing|labor|cleaning|janitorial|hospitality|motel)\b/i;
          const htTxs = txs.filter(t => htBusinesses.test(t.counterparty) || htBusinesses.test(t.description));
          if (htTxs.length < 3) return alerts;
          // Multiple workers paid into single account pattern
          const cashDeposits = htTxs.filter(t => t.direction === 'CREDIT' && ['CASH','DEPOSIT'].includes(t.type));
          if (cashDeposits.length >= 5) {
            const total = cashDeposits.reduce((s, t) => s + t.amount, 0);
            alerts.push({
              ruleId: 'HT-001', category: 'HUMAN_TRAFFICKING', severity: 'CRITICAL',
              score: 45, message: `${cashDeposits.length} cash deposits from high-risk businesses (massage/spa/staffing) totaling $${total.toFixed(0)} — possible trafficking proceeds`,
              transactions: cashDeposits.slice(0, 10).map(t => t.id),
              details: { businesses: [...new Set(htTxs.map(t => t.counterparty))], cashCount: cashDeposits.length, total }
            });
          }
          // Payments to visa/document services
          const docServices = txs.filter(t => /\b(visa|immigration|passport|document|notary|consulate)\b/i.test(t.counterparty) || /\b(visa|immigration|passport|document)\b/i.test(t.description));
          if (docServices.length >= 2 && htTxs.length >= 3) {
            alerts.push({
              ruleId: 'HT-001', category: 'HUMAN_TRAFFICKING', severity: 'HIGH',
              score: 30, message: `Combination of high-risk business transactions + visa/document service payments — trafficking indicator`,
              transactions: [...htTxs, ...docServices].slice(0, 10).map(t => t.id),
              details: { htTxCount: htTxs.length, docServiceCount: docServices.length }
            });
          }
          return alerts;
        }
      },

      // ===== CASH-INTENSIVE BUSINESS (CIB) =====
      {
        id: 'CIB-001', name: 'Cash-Intensive Business Anomaly',
        category: 'CASH_BUSINESS', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const cashTxs = txs.filter(t => ['CASH','DEPOSIT'].includes(t.type) && t.direction === 'CREDIT');
          const cardTxs = txs.filter(t => ['CARD','POS','MERCHANT'].includes(t.type) && t.direction === 'CREDIT');
          if (cashTxs.length < 5) return alerts;
          const cashTotal = cashTxs.reduce((s, t) => s + t.amount, 0);
          const cardTotal = cardTxs.reduce((s, t) => s + t.amount, 0);
          // Cash to card ratio — modern business should have significant card revenue
          if (cardTotal > 0 && cashTotal / cardTotal > 4) {
            alerts.push({
              ruleId: 'CIB-001', category: 'CASH_BUSINESS', severity: 'MEDIUM',
              score: 25, message: `Cash deposits ($${cashTotal.toFixed(0)}) are ${(cashTotal/cardTotal).toFixed(1)}x card revenue ($${cardTotal.toFixed(0)}) — unusual cash intensity`,
              transactions: cashTxs.slice(0, 5).map(t => t.id),
              details: { cashTotal, cardTotal, ratio: cashTotal / cardTotal }
            });
          }
          // Too-consistent deposits (suspiciously uniform daily deposits)
          const byDay = {};
          for (const t of cashTxs) {
            const day = t.date.toISOString().slice(0, 10);
            byDay[day] = (byDay[day] || 0) + t.amount;
          }
          const dailyAmounts = Object.values(byDay);
          if (dailyAmounts.length >= 10) {
            const avg = dailyAmounts.reduce((s, a) => s + a, 0) / dailyAmounts.length;
            const stdDev = Math.sqrt(dailyAmounts.reduce((s, a) => s + (a - avg) ** 2, 0) / dailyAmounts.length);
            const cv = stdDev / avg; // coefficient of variation
            if (cv < 0.1 && avg > 1000) {
              alerts.push({
                ruleId: 'CIB-001', category: 'CASH_BUSINESS', severity: 'HIGH',
                score: 30, message: `Suspiciously consistent daily cash deposits (avg $${avg.toFixed(0)}, CV=${cv.toFixed(3)}) — possible commingling`,
                transactions: cashTxs.slice(0, 5).map(t => t.id),
                details: { avgDaily: avg, coefficientOfVariation: cv, days: dailyAmounts.length }
              });
            }
          }
          return alerts;
        }
      },

      // ===== ADVANCED CRYPTO PATTERNS (CRY) =====
      {
        id: 'CRY-004', name: 'Privacy Coin Conversion',
        category: 'CRYPTO', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const privacyCoins = /\b(monero|xmr|zcash|zec|dash|grin|beam|pirate chain|haven|dero|firo)\b/i;
          const privTxs = txs.filter(t => privacyCoins.test(t.counterparty) || privacyCoins.test(t.description));
          if (privTxs.length > 0) {
            alerts.push({
              ruleId: 'CRY-004', category: 'CRYPTO', severity: 'HIGH',
              score: 35, message: `${privTxs.length} transaction(s) involving privacy coins — funds tracing becomes impossible`,
              transactions: privTxs.map(t => t.id),
              details: { coins: [...new Set(privTxs.map(t => t.description?.match(/\b(monero|xmr|zcash|zec|dash|grin|beam)/i)?.[0] || 'privacy coin'))] }
            });
          }
          return alerts;
        }
      },
      {
        id: 'CRY-005', name: 'Peel Chain Pattern',
        category: 'CRYPTO', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          // Look for chain of decreasing outbound amounts to new addresses
          const outbound = txs.filter(t => t.direction === 'DEBIT' && t.cryptoAddress).sort((a, b) => a.date - b.date);
          if (outbound.length < 4) return alerts;
          const uniqueAddresses = new Set(outbound.map(t => t.cryptoAddress));
          if (uniqueAddresses.size >= outbound.length * 0.8) {
            // Most transactions go to unique addresses
            let decreasing = 0;
            for (let i = 1; i < outbound.length; i++) {
              if (outbound[i].amount < outbound[i-1].amount) decreasing++;
            }
            if (decreasing / (outbound.length - 1) > 0.7) {
              alerts.push({
                ruleId: 'CRY-005', category: 'CRYPTO', severity: 'HIGH',
                score: 35, message: `Peel chain detected: ${outbound.length} outbound transactions to ${uniqueAddresses.size} unique addresses with decreasing amounts`,
                transactions: outbound.slice(0, 10).map(t => t.id),
                details: { txCount: outbound.length, uniqueAddresses: uniqueAddresses.size, decreasingRatio: decreasing / (outbound.length - 1) }
              });
            }
          }
          return alerts;
        }
      },
      {
        id: 'CRY-006', name: 'DeFi / NFT Suspicious Activity',
        category: 'CRYPTO', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const defiPattern = /\b(uniswap|sushiswap|pancakeswap|aave|compound|curve|balancer|1inch|dex|swap|bridge|opensea|rarible|blur|nft|mint)\b/i;
          const defiTxs = txs.filter(t => defiPattern.test(t.counterparty) || defiPattern.test(t.description));
          if (defiTxs.length < 3) return alerts;
          const total = defiTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
          // Check for flash-loan-like patterns (large in/out same block)
          const sorted = defiTxs.sort((a, b) => a.date - b.date);
          for (let i = 0; i < sorted.length - 1; i++) {
            const gap = Math.abs(sorted[i+1].date - sorted[i].date) / 60000; // minutes
            if (gap < 5 && sorted[i].direction !== sorted[i+1].direction && Math.abs(sorted[i].amount) > 50000) {
              alerts.push({
                ruleId: 'CRY-006', category: 'CRYPTO', severity: 'HIGH',
                score: 30, message: `Possible flash loan or DeFi manipulation: $${Math.abs(sorted[i].amount).toFixed(0)} in/out within ${gap.toFixed(0)} minutes`,
                transactions: [sorted[i].id, sorted[i+1].id],
                details: { amount: Math.abs(sorted[i].amount), gapMinutes: gap }
              });
              break;
            }
          }
          if (alerts.length === 0 && total > 50000) {
            alerts.push({
              ruleId: 'CRY-006', category: 'CRYPTO', severity: 'MEDIUM',
              score: 20, message: `${defiTxs.length} DeFi/NFT transactions totaling $${total.toFixed(0)}`,
              transactions: defiTxs.slice(0, 5).map(t => t.id),
              details: { count: defiTxs.length, total }
            });
          }
          return alerts;
        }
      },

      // ===== SANCTIONS EVASION INDICATORS (SAN) =====
      {
        id: 'SAN-001', name: 'Sanctions Evasion — Intermediary Country Pattern',
        category: 'SANCTIONS_EVASION', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          // Known transshipment/intermediary countries for sanctions evasion
          const intermediaries = new Set(['AE','TR','GE','AM','KZ','KG','UZ','TJ','CN','HK','SG','MY']);
          const sanctionedCountries = new Set(['RU','IR','KP','SY','CU','BY','VE']);
          const interTxs = txs.filter(t => intermediaries.has(t.counterpartyCountry));
          const sanctionedTxs = txs.filter(t => sanctionedCountries.has(t.counterpartyCountry));
          // If there are both intermediary and sanctioned country transactions
          if (interTxs.length > 0 && sanctionedTxs.length > 0) {
            alerts.push({
              ruleId: 'SAN-001', category: 'SANCTIONS_EVASION', severity: 'CRITICAL',
              score: 50, message: `Transactions with both sanctioned jurisdictions (${[...new Set(sanctionedTxs.map(t => t.counterpartyCountry))].join(',')}) and known intermediary countries (${[...new Set(interTxs.map(t => t.counterpartyCountry))].join(',')}) — possible sanctions evasion`,
              transactions: [...sanctionedTxs, ...interTxs].slice(0, 10).map(t => t.id),
              details: { sanctionedCountries: [...new Set(sanctionedTxs.map(t => t.counterpartyCountry))], intermediaries: [...new Set(interTxs.map(t => t.counterpartyCountry))] }
            });
          }
          // Triangular pattern: funds from sanctioned → intermediary → back
          if (interTxs.length >= 3 && interTxs.reduce((s, t) => s + Math.abs(t.amount), 0) > 100000) {
            const countries = [...new Set(interTxs.map(t => t.counterpartyCountry))];
            if (countries.some(c => ['AE','TR','GE','AM'].includes(c))) {
              alerts.push({
                ruleId: 'SAN-001', category: 'SANCTIONS_EVASION', severity: 'HIGH',
                score: 35, message: `High-volume transactions with sanctions evasion corridor countries: ${countries.join(', ')}`,
                transactions: interTxs.slice(0, 5).map(t => t.id),
                details: { countries, total: interTxs.reduce((s, t) => s + Math.abs(t.amount), 0) }
              });
            }
          }
          return alerts;
        }
      },

      // ===== CORRUPTION / PEP INDICATORS (PEP) =====
      {
        id: 'PEP-001', name: 'Government / Public Sector Payment Pattern',
        category: 'CORRUPTION', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const govPattern = /\b(government|ministry|municipal|federal|state|public|procurement|tender|contract|grant|subsidy|budget)\b/i;
          const govTxs = txs.filter(t => govPattern.test(t.counterparty) || govPattern.test(t.description));
          if (govTxs.length === 0) return alerts;
          const govInbound = govTxs.filter(t => t.direction === 'CREDIT' && t.amount > 25000).sort((a, b) => a.date - b.date);
          for (const g of govInbound) {
            const suspicious = txs.filter(t =>
              t.direction === 'DEBIT' && t.date > g.date &&
              (t.date - g.date) / 86400000 < 14 &&
              /\b(consult|advis|fee|commission|service|management)\b/i.test(t.description) &&
              t.amount > g.amount * 0.05
            );
            if (suspicious.length > 0) {
              alerts.push({
                ruleId: 'PEP-001', category: 'CORRUPTION', severity: 'HIGH',
                score: 35, message: `Government payment ($${g.amount.toFixed(0)}) followed by consulting/fee payments within 14 days — possible kickback`,
                transactions: [g.id, ...suspicious.map(t => t.id)],
                details: { govAmount: g.amount, feePayments: suspicious.map(t => ({ amount: t.amount, counterparty: t.counterparty })) }
              });
              break;
            }
          }
          return alerts;
        }
      },

      // ===== NETWORK ANALYSIS (NET) =====
      {
        id: 'NET-001', name: 'High-Risk Network Connections',
        category: 'NETWORK', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          // Build counterparty graph and detect entities transacting with multiple high-risk counterparties
          const cpRisk = {};
          for (const t of txs) {
            if (!t.counterparty) continue;
            if (!cpRisk[t.counterparty]) cpRisk[t.counterparty] = { volume: 0, count: 0, riskFlags: new Set() };
            cpRisk[t.counterparty].volume += Math.abs(t.amount);
            cpRisk[t.counterparty].count++;
            if (this.highRiskCountries.has(t.counterpartyCountry)) cpRisk[t.counterparty].riskFlags.add('HIGH_RISK_COUNTRY');
            if (this.taxHavens.has(t.counterpartyCountry)) cpRisk[t.counterparty].riskFlags.add('TAX_HAVEN');
            if (/\b(holdings|trading|consulting|services|international|global|ventures)\b/i.test(t.counterparty)) cpRisk[t.counterparty].riskFlags.add('SHELL_INDICATOR');
          }
          const highRiskCps = Object.entries(cpRisk).filter(([_, v]) => v.riskFlags.size >= 2);
          if (highRiskCps.length >= 3) {
            alerts.push({
              ruleId: 'NET-001', category: 'NETWORK', severity: 'HIGH',
              score: 35, message: `${highRiskCps.length} counterparties with multiple risk flags — high-risk network cluster`,
              transactions: txs.filter(t => highRiskCps.some(([cp]) => cp === t.counterparty)).slice(0, 10).map(t => t.id),
              details: { counterparties: highRiskCps.map(([cp, v]) => ({ name: cp, flags: [...v.riskFlags], volume: v.volume })) }
            });
          }
          return alerts;
        }
      },
      {
        id: 'NET-002', name: 'Circular Transaction Cycle Detection',
        category: 'NETWORK', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          // Build directed graph of fund flows: counterparty → counterparty via timing
          // Detect A→B→C→A cycles using adjacency analysis
          const outbound = txs.filter(t => t.direction === 'DEBIT' && t.counterparty).sort((a, b) => a.date - b.date);
          const inbound = txs.filter(t => t.direction === 'CREDIT' && t.counterparty).sort((a, b) => a.date - b.date);

          // Map: for each inbound, find outbound within 72hrs that could represent funds forwarding
          const flows = []; // {from, to, amount, date}
          for (const inb of inbound) {
            for (const out of outbound) {
              const gap = (out.date - inb.date) / 3600000;
              if (gap > 0 && gap <= 72 && out.amount >= inb.amount * 0.8 && out.amount <= inb.amount * 1.05) {
                flows.push({ from: inb.counterparty, to: out.counterparty, amount: out.amount, inId: inb.id, outId: out.id });
                break;
              }
            }
          }
          // Check for cycles in flows: A→B and B→A (direct cycle)
          const seen = new Set();
          for (const f1 of flows) {
            for (const f2 of flows) {
              if (f1.from === f2.to && f1.to === f2.from && f1.from !== f1.to) {
                const key = [f1.from, f1.to].sort().join('|');
                if (!seen.has(key)) {
                  seen.add(key);
                  alerts.push({
                    ruleId: 'NET-002', category: 'NETWORK', severity: 'CRITICAL',
                    score: 45, message: `Circular fund flow detected: ${f1.from} ↔ ${f1.to} — bidirectional pass-through`,
                    transactions: [f1.inId, f1.outId, f2.inId, f2.outId].filter(Boolean),
                    details: { node1: f1.from, node2: f1.to }
                  });
                }
              }
            }
          }
          // Check for 3-node cycles: A→B→C→A
          if (alerts.length === 0 && flows.length >= 3) {
            const adj = {};
            for (const f of flows) {
              if (!adj[f.from]) adj[f.from] = [];
              adj[f.from].push(f);
            }
            for (const a of Object.keys(adj)) {
              for (const f1 of adj[a] || []) {
                for (const f2 of adj[f1.to] || []) {
                  if (f2.to === a && f1.to !== a) {
                    alerts.push({
                      ruleId: 'NET-002', category: 'NETWORK', severity: 'CRITICAL',
                      score: 50, message: `3-node circular flow: ${a} → ${f1.to} → ${f2.to} → back — layering pattern`,
                      transactions: [f1.inId, f1.outId, f2.inId, f2.outId].filter(Boolean),
                      details: { cycle: [a, f1.to, f2.to, a] }
                    });
                    return alerts;
                  }
                }
              }
            }
          }
          return alerts;
        }
      },
      {
        id: 'NET-003', name: 'Funnel Account Detection',
        category: 'NETWORK', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          // Funnel: many different senders, few receivers (consolidation pattern)
          const senders = new Set(txs.filter(t => t.direction === 'CREDIT' && t.counterparty).map(t => t.counterparty));
          const receivers = new Set(txs.filter(t => t.direction === 'DEBIT' && t.counterparty).map(t => t.counterparty));
          const creditTotal = txs.filter(t => t.direction === 'CREDIT').reduce((s, t) => s + t.amount, 0);
          if (senders.size >= 5 && receivers.size <= 2 && creditTotal > 50000) {
            alerts.push({
              ruleId: 'NET-003', category: 'NETWORK', severity: 'HIGH',
              score: 35, message: `Funnel account pattern: ${senders.size} inbound sources consolidated to ${receivers.size} outbound destination(s) — $${creditTotal.toFixed(0)} total`,
              transactions: txs.filter(t => t.direction === 'CREDIT').slice(0, 10).map(t => t.id),
              details: { senderCount: senders.size, receiverCount: receivers.size, totalVolume: creditTotal }
            });
          }
          // Reverse funnel: few senders, many receivers (distribution pattern)
          if (receivers.size >= 5 && senders.size <= 2) {
            const debitTotal = txs.filter(t => t.direction === 'DEBIT').reduce((s, t) => s + t.amount, 0);
            if (debitTotal > 50000) {
              alerts.push({
                ruleId: 'NET-003', category: 'NETWORK', severity: 'HIGH',
                score: 30, message: `Distribution pattern: ${senders.size} source(s) disbursed to ${receivers.size} recipients — $${debitTotal.toFixed(0)} total`,
                transactions: txs.filter(t => t.direction === 'DEBIT').slice(0, 10).map(t => t.id),
                details: { senderCount: senders.size, receiverCount: receivers.size, totalVolume: debitTotal }
              });
            }
          }
          return alerts;
        }
      },

      // ===== FRAUD DETECTION (FRD) =====
      {
        id: 'FRD-001', name: 'Invoice Fraud — Duplicate Payments',
        category: 'FRAUD', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          // Detect duplicate payments: same amount, same counterparty, within 30 days
          const debits = txs.filter(t => t.direction === 'DEBIT' && t.counterparty && t.amount > 1000);
          const seen = {};
          for (const t of debits) {
            const key = `${t.counterparty}|${t.amount.toFixed(2)}`;
            if (!seen[key]) { seen[key] = []; }
            seen[key].push(t);
          }
          for (const [key, group] of Object.entries(seen)) {
            if (group.length >= 2) {
              const sorted = group.sort((a, b) => a.date - b.date);
              for (let i = 1; i < sorted.length; i++) {
                const gap = (sorted[i].date - sorted[i - 1].date) / 86400000;
                if (gap <= 30 && gap > 0) {
                  alerts.push({
                    ruleId: 'FRD-001', category: 'FRAUD', severity: 'HIGH',
                    score: 30, message: `Duplicate payment to "${sorted[0].counterparty}" for $${sorted[0].amount.toFixed(2)} within ${Math.ceil(gap)} days — possible invoice fraud`,
                    transactions: [sorted[i - 1].id, sorted[i].id],
                    details: { counterparty: sorted[0].counterparty, amount: sorted[0].amount, daysBetween: Math.ceil(gap) }
                  });
                  break;
                }
              }
            }
          }
          return alerts;
        }
      },
      {
        id: 'FRD-002', name: 'Payroll Fraud — Ghost Employees',
        category: 'FRAUD', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const payrollPattern = /\b(payroll|salary|wages|compensation|bonus|commission|stipend)\b/i;
          const payrollTxs = txs.filter(t => t.direction === 'DEBIT' && (payrollPattern.test(t.description) || payrollPattern.test(t.counterparty)));
          if (payrollTxs.length < 3) return alerts;
          // Check for identical amounts to many different recipients (batch payroll to ghosts)
          const amountGroups = {};
          for (const t of payrollTxs) {
            const key = t.amount.toFixed(2);
            if (!amountGroups[key]) amountGroups[key] = new Set();
            amountGroups[key].add(t.counterparty || t.id);
          }
          for (const [amt, recipients] of Object.entries(amountGroups)) {
            if (recipients.size >= 5 && parseFloat(amt) > 500) {
              alerts.push({
                ruleId: 'FRD-002', category: 'FRAUD', severity: 'HIGH',
                score: 30, message: `${recipients.size} identical payroll payments of $${amt} — potential ghost employee scheme`,
                transactions: payrollTxs.filter(t => t.amount.toFixed(2) === amt).slice(0, 10).map(t => t.id),
                details: { amount: parseFloat(amt), recipientCount: recipients.size }
              });
              break;
            }
          }
          // Payroll to same account as vendor payments
          const payrollCps = new Set(payrollTxs.map(t => t.counterparty).filter(Boolean));
          const vendorTxs = txs.filter(t => t.direction === 'DEBIT' && !payrollPattern.test(t.description) && t.counterparty && payrollCps.has(t.counterparty));
          if (vendorTxs.length > 0) {
            alerts.push({
              ruleId: 'FRD-002', category: 'FRAUD', severity: 'MEDIUM',
              score: 25, message: `Payroll recipient "${vendorTxs[0].counterparty}" also receives vendor payments — potential conflict`,
              transactions: vendorTxs.slice(0, 5).map(t => t.id),
              details: { counterparty: vendorTxs[0].counterparty }
            });
          }
          return alerts;
        }
      },
      {
        id: 'FRD-003', name: 'Procurement Fraud — Bid Rigging Indicators',
        category: 'FRAUD', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          // Detect round-trip payments: payment out then similar amount back from same/related party
          const debits = txs.filter(t => t.direction === 'DEBIT' && t.amount > 5000).sort((a, b) => a.date - b.date);
          for (const d of debits) {
            const kickback = txs.find(t =>
              t.direction === 'CREDIT' && t.date > d.date &&
              (t.date - d.date) / 86400000 < 45 &&
              t.amount >= d.amount * 0.05 && t.amount <= d.amount * 0.3 &&
              t.counterparty && t.counterparty !== d.counterparty
            );
            if (kickback) {
              alerts.push({
                ruleId: 'FRD-003', category: 'FRAUD', severity: 'HIGH',
                score: 35, message: `Payment of $${d.amount.toFixed(0)} to "${d.counterparty}" followed by $${kickback.amount.toFixed(0)} (${(kickback.amount/d.amount*100).toFixed(0)}%) receipt from "${kickback.counterparty}" — possible kickback/bid rigging`,
                transactions: [d.id, kickback.id],
                details: { paymentAmount: d.amount, kickbackAmount: kickback.amount, ratio: kickback.amount / d.amount }
              });
              break;
            }
          }
          return alerts;
        }
      },
      {
        id: 'FRD-004', name: 'Asset Misappropriation — Unauthorized Transfers',
        category: 'FRAUD', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          // Large outbound to personal-sounding accounts / new counterparties
          const personalPattern = /\b(personal|savings|self|own|private|family|spouse|wife|husband)\b/i;
          const suspiciousOut = txs.filter(t =>
            t.direction === 'DEBIT' && t.amount > 10000 &&
            (personalPattern.test(t.counterparty) || personalPattern.test(t.description))
          );
          if (suspiciousOut.length > 0) {
            const total = suspiciousOut.reduce((s, t) => s + t.amount, 0);
            alerts.push({
              ruleId: 'FRD-004', category: 'FRAUD', severity: 'CRITICAL',
              score: 40, message: `${suspiciousOut.length} outbound transfer(s) to personal/family accounts totaling $${total.toFixed(0)} — possible asset misappropriation`,
              transactions: suspiciousOut.slice(0, 5).map(t => t.id),
              details: { count: suspiciousOut.length, total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'FRD-005', name: 'Insurance / Claims Fraud Pattern',
        category: 'FRAUD', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const insurancePattern = /\b(insurance|claim|settlement|indemnity|premium|underwriting|adjuster|loss)\b/i;
          const insuranceTxs = txs.filter(t => insurancePattern.test(t.counterparty) || insurancePattern.test(t.description));
          if (insuranceTxs.length < 2) return alerts;
          // Multiple claims in short period
          const claims = insuranceTxs.filter(t => t.direction === 'CREDIT' && t.amount > 5000);
          if (claims.length >= 3) {
            const sorted = claims.sort((a, b) => a.date - b.date);
            const span = (sorted[sorted.length - 1].date - sorted[0].date) / 86400000;
            if (span <= 180) {
              const total = claims.reduce((s, t) => s + t.amount, 0);
              alerts.push({
                ruleId: 'FRD-005', category: 'FRAUD', severity: 'HIGH',
                score: 30, message: `${claims.length} insurance claims totaling $${total.toFixed(0)} within ${Math.ceil(span)} days — excessive claims frequency`,
                transactions: claims.map(t => t.id),
                details: { claimCount: claims.length, total, days: Math.ceil(span) }
              });
            }
          }
          return alerts;
        }
      },
      {
        id: 'FRD-006', name: 'Financial Statement Fraud Indicators',
        category: 'FRAUD', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          // Revenue recognition fraud: large credits at period-end (quarter/year-end) with reversals
          const credits = txs.filter(t => t.direction === 'CREDIT' && t.amount > 25000);
          const periodEndCredits = credits.filter(t => {
            const m = t.date.getMonth();
            const d = t.date.getDate();
            // Quarter-end: last 5 days of Mar, Jun, Sep, Dec
            return [2, 5, 8, 11].includes(m) && d >= 26;
          });
          if (periodEndCredits.length >= 2) {
            // Check for reversals in next 15 days
            const reversed = periodEndCredits.filter(pe => {
              return txs.some(t =>
                t.direction === 'DEBIT' && t.amount >= pe.amount * 0.8 && t.amount <= pe.amount * 1.05 &&
                t.date > pe.date && (t.date - pe.date) / 86400000 <= 15
              );
            });
            if (reversed.length > 0) {
              alerts.push({
                ruleId: 'FRD-006', category: 'FRAUD', severity: 'CRITICAL',
                score: 45, message: `${reversed.length} large period-end credits reversed within 15 days — possible revenue recognition fraud (channel stuffing)`,
                transactions: reversed.map(t => t.id),
                details: { reversedCount: reversed.length, periodEndCreditCount: periodEndCredits.length }
              });
            } else {
              alerts.push({
                ruleId: 'FRD-006', category: 'FRAUD', severity: 'MEDIUM',
                score: 20, message: `${periodEndCredits.length} large credits concentrated at quarter-end — review for revenue manipulation`,
                transactions: periodEndCredits.slice(0, 5).map(t => t.id),
                details: { count: periodEndCredits.length }
              });
            }
          }
          return alerts;
        }
      },

      // ===== ELDER FINANCIAL EXPLOITATION (EFE) =====
      {
        id: 'EFE-001', name: 'Sudden Large Withdrawals by Elderly',
        category: 'ELDER_EXPLOITATION', severity: 'HIGH',
        detect: (txs, profile) => {
          const alerts = [];
          const largeWithdrawals = txs.filter(t => t.direction === 'DEBIT' && t.amount > 5000 && ['CASH','WITHDRAWAL','WIRE'].includes(t.type));
          if (largeWithdrawals.length >= 3) {
            const total = largeWithdrawals.reduce((s, t) => s + t.amount, 0);
            alerts.push({
              ruleId: 'EFE-001', category: 'ELDER_EXPLOITATION', severity: 'HIGH',
              score: 35, message: `${largeWithdrawals.length} large withdrawals totaling $${total.toFixed(0)} — review for elder exploitation`,
              transactions: largeWithdrawals.slice(0, 10).map(t => t.id),
              details: { count: largeWithdrawals.length, total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'EFE-002', name: 'New POA/Authorized Signer Activity',
        category: 'ELDER_EXPLOITATION', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const poaPattern = /\b(poa|power of attorney|authorized|caregiver|guardian|conservator)\b/i;
          const poaTxs = txs.filter(t => poaPattern.test(t.description) && t.amount > 1000);
          if (poaTxs.length >= 2) {
            alerts.push({
              ruleId: 'EFE-002', category: 'ELDER_EXPLOITATION', severity: 'HIGH',
              score: 30, message: `${poaTxs.length} transactions referencing POA/authorized party`,
              transactions: poaTxs.map(t => t.id),
              details: { count: poaTxs.length }
            });
          }
          return alerts;
        }
      },
      {
        id: 'EFE-003', name: 'Lifestyle Inconsistent Spending',
        category: 'ELDER_EXPLOITATION', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const unusualSpend = /\b(luxury|jewelry|electronics|vehicle|boat|vacation|cruise|casino|gaming)\b/i;
          const unusual = txs.filter(t => t.direction === 'DEBIT' && unusualSpend.test(t.description) && t.amount > 2000);
          if (unusual.length >= 2) {
            alerts.push({
              ruleId: 'EFE-003', category: 'ELDER_EXPLOITATION', severity: 'MEDIUM',
              score: 25, message: `${unusual.length} unusual luxury/lifestyle purchases — inconsistent with typical elder spending`,
              transactions: unusual.map(t => t.id),
              details: { purchases: unusual.map(t => ({ amount: t.amount, desc: t.description })) }
            });
          }
          return alerts;
        }
      },

      // ===== ROMANCE SCAM / CONFIDENCE FRAUD (ROM) =====
      {
        id: 'ROM-001', name: 'International Wire to Individual',
        category: 'ROMANCE_SCAM', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const intlWires = txs.filter(t =>
            t.direction === 'DEBIT' && t.type === 'WIRE' && t.amount > 1000 &&
            t.counterpartyCountry && !['US','CA','GB','AU'].includes(t.counterpartyCountry)
          );
          // Look for pattern: multiple wires to same person/country
          const byCountry = {};
          for (const t of intlWires) {
            byCountry[t.counterpartyCountry] = (byCountry[t.counterpartyCountry] || 0) + t.amount;
          }
          for (const [country, total] of Object.entries(byCountry)) {
            if (total > 10000) {
              alerts.push({
                ruleId: 'ROM-001', category: 'ROMANCE_SCAM', severity: 'HIGH',
                score: 35, message: `$${total.toFixed(0)} in wires to ${country} — possible romance scam`,
                transactions: intlWires.filter(t => t.counterpartyCountry === country).map(t => t.id),
                details: { country, total }
              });
            }
          }
          return alerts;
        }
      },
      {
        id: 'ROM-002', name: 'Gift Card / Prepaid Card Purchases',
        category: 'ROMANCE_SCAM', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const giftPattern = /\b(gift card|prepaid|itunes|google play|amazon|steam|ebay|walmart|target|best buy|vanilla|green dot|moneypak)\b/i;
          const giftTxs = txs.filter(t => t.direction === 'DEBIT' && (giftPattern.test(t.description) || giftPattern.test(t.counterparty)));
          if (giftTxs.length >= 3) {
            const total = giftTxs.reduce((s, t) => s + t.amount, 0);
            alerts.push({
              ruleId: 'ROM-002', category: 'ROMANCE_SCAM', severity: 'HIGH',
              score: 40, message: `${giftTxs.length} gift card/prepaid purchases totaling $${total.toFixed(0)} — classic scam payment method`,
              transactions: giftTxs.map(t => t.id),
              details: { count: giftTxs.length, total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'ROM-003', name: 'Escalating Payment Pattern',
        category: 'ROMANCE_SCAM', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          const outbound = txs.filter(t => t.direction === 'DEBIT' && t.amount > 500).sort((a, b) => a.date - b.date);
          if (outbound.length < 4) return alerts;
          let escalating = 0;
          for (let i = 1; i < Math.min(outbound.length, 10); i++) {
            if (outbound[i].amount > outbound[i-1].amount * 1.2) escalating++;
          }
          if (escalating >= 3) {
            alerts.push({
              ruleId: 'ROM-003', category: 'ROMANCE_SCAM', severity: 'CRITICAL',
              score: 45, message: `Escalating payment pattern: amounts increasing over ${outbound.length} transactions — grooming behavior`,
              transactions: outbound.slice(0, 10).map(t => t.id),
              details: { amounts: outbound.slice(0, 10).map(t => t.amount) }
            });
          }
          return alerts;
        }
      },

      // ===== BUSINESS EMAIL COMPROMISE (BEC) =====
      {
        id: 'BEC-001', name: 'Sudden Payee Change for Recurring Payment',
        category: 'BEC_FRAUD', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          const debits = txs.filter(t => t.direction === 'DEBIT' && t.amount > 5000).sort((a, b) => a.date - b.date);
          // Group by similar amounts (possible recurring payments)
          const amountGroups = {};
          for (const t of debits) {
            const key = Math.round(t.amount / 100) * 100; // Round to nearest 100
            if (!amountGroups[key]) amountGroups[key] = [];
            amountGroups[key].push(t);
          }
          for (const [amt, group] of Object.entries(amountGroups)) {
            if (group.length >= 3) {
              const counterparties = [...new Set(group.map(t => t.counterparty).filter(Boolean))];
              if (counterparties.length >= 2) {
                alerts.push({
                  ruleId: 'BEC-001', category: 'BEC_FRAUD', severity: 'CRITICAL',
                  score: 45, message: `Recurring payment (~$${amt}) changed payees: ${counterparties.join(' → ')} — possible BEC attack`,
                  transactions: group.map(t => t.id),
                  details: { amount: parseFloat(amt), counterparties }
                });
              }
            }
          }
          return alerts;
        }
      },
      {
        id: 'BEC-002', name: 'Urgent Wire to New Beneficiary',
        category: 'BEC_FRAUD', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const urgentPattern = /\b(urgent|asap|immediately|time.?sensitive|rush|critical|emergency)\b/i;
          const urgentWires = txs.filter(t =>
            t.direction === 'DEBIT' && t.type === 'WIRE' && t.amount > 10000 &&
            urgentPattern.test(t.description)
          );
          if (urgentWires.length > 0) {
            alerts.push({
              ruleId: 'BEC-002', category: 'BEC_FRAUD', severity: 'HIGH',
              score: 35, message: `${urgentWires.length} urgent wire(s) totaling $${urgentWires.reduce((s,t) => s + t.amount, 0).toFixed(0)}`,
              transactions: urgentWires.map(t => t.id),
              details: { count: urgentWires.length }
            });
          }
          return alerts;
        }
      },
      {
        id: 'BEC-003', name: 'CEO/Executive Impersonation Pattern',
        category: 'BEC_FRAUD', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const execPattern = /\b(ceo|cfo|president|executive|chairman|director|boss|owner|partner)\b/i;
          const execTxs = txs.filter(t => t.direction === 'DEBIT' && t.amount > 25000 && execPattern.test(t.description));
          if (execTxs.length > 0) {
            alerts.push({
              ruleId: 'BEC-003', category: 'BEC_FRAUD', severity: 'HIGH',
              score: 30, message: `${execTxs.length} payments referencing executive titles in description`,
              transactions: execTxs.map(t => t.id),
              details: { count: execTxs.length }
            });
          }
          return alerts;
        }
      },

      // ===== TAX EVASION SCHEMES (TAX) =====
      {
        id: 'TAX-001', name: 'Offshore Account Transfers',
        category: 'TAX_EVASION', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const taxHavens = new Set(['VG','KY','BM','PA','SC','BS','JE','GG','IM','LI','MC','CH','LU','SG','HK','BZ']);
          const offshore = txs.filter(t => t.direction === 'DEBIT' && taxHavens.has(t.counterpartyCountry) && t.amount > 10000);
          if (offshore.length >= 2) {
            const total = offshore.reduce((s, t) => s + t.amount, 0);
            alerts.push({
              ruleId: 'TAX-001', category: 'TAX_EVASION', severity: 'HIGH',
              score: 35, message: `$${total.toFixed(0)} transferred to offshore jurisdictions: ${[...new Set(offshore.map(t => t.counterpartyCountry))].join(', ')}`,
              transactions: offshore.map(t => t.id),
              details: { total, countries: [...new Set(offshore.map(t => t.counterpartyCountry))] }
            });
          }
          return alerts;
        }
      },
      {
        id: 'TAX-002', name: 'Cash Business Over-Reporting',
        category: 'TAX_EVASION', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const cashIn = txs.filter(t => t.direction === 'CREDIT' && ['CASH','DEPOSIT'].includes(t.type));
          const cardIn = txs.filter(t => t.direction === 'CREDIT' && ['CARD','POS','MERCHANT'].includes(t.type));
          if (cashIn.length > 0 && cardIn.length > 0) {
            const cashTotal = cashIn.reduce((s, t) => s + t.amount, 0);
            const cardTotal = cardIn.reduce((s, t) => s + t.amount, 0);
            // Unrealistic cash ratio for modern business
            if (cashTotal > cardTotal * 5 && cashTotal > 50000) {
              alerts.push({
                ruleId: 'TAX-002', category: 'TAX_EVASION', severity: 'MEDIUM',
                score: 25, message: `Cash revenue ($${cashTotal.toFixed(0)}) is ${(cashTotal/cardTotal).toFixed(1)}x card revenue — possible tax scheme`,
                transactions: cashIn.slice(0, 5).map(t => t.id),
                details: { cashTotal, cardTotal, ratio: cashTotal / cardTotal }
              });
            }
          }
          return alerts;
        }
      },
      {
        id: 'TAX-003', name: 'Related Party Loan Scheme',
        category: 'TAX_EVASION', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const loanPattern = /\b(loan|lending|advance|shareholder|related party|intercompany|affiliate)\b/i;
          const loanTxs = txs.filter(t => loanPattern.test(t.description) && t.amount > 50000);
          if (loanTxs.length >= 2) {
            const inbound = loanTxs.filter(t => t.direction === 'CREDIT');
            const outbound = loanTxs.filter(t => t.direction === 'DEBIT');
            if (inbound.length > 0 && outbound.length > 0) {
              alerts.push({
                ruleId: 'TAX-003', category: 'TAX_EVASION', severity: 'HIGH',
                score: 30, message: `Bidirectional related-party loans — possible dividend stripping or thin capitalization`,
                transactions: loanTxs.slice(0, 10).map(t => t.id),
                details: { inboundCount: inbound.length, outboundCount: outbound.length }
              });
            }
          }
          return alerts;
        }
      },
      {
        id: 'TAX-004', name: 'Carousel/VAT Fraud Pattern',
        category: 'TAX_EVASION', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          // Look for rapid import/export cycles with same goods categories
          const tradePattern = /\b(import|export|customs|duty|vat|goods|shipment|consignment)\b/i;
          const tradeTxs = txs.filter(t => tradePattern.test(t.description));
          if (tradeTxs.length < 4) return alerts;
          // Check for EU countries (common carousel jurisdictions)
          const euCountries = new Set(['DE','FR','IT','ES','NL','BE','AT','PL','CZ','HU','RO','BG','IE','PT','GR','SE','DK','FI','SK','SI','HR','LT','LV','EE','CY','MT','LU']);
          const euTrades = tradeTxs.filter(t => euCountries.has(t.counterpartyCountry));
          if (euTrades.length >= 3) {
            const countries = [...new Set(euTrades.map(t => t.counterpartyCountry))];
            if (countries.length >= 2) {
              alerts.push({
                ruleId: 'TAX-004', category: 'TAX_EVASION', severity: 'CRITICAL',
                score: 45, message: `Rapid trade flows between EU jurisdictions: ${countries.join(', ')} — possible carousel/MTIC fraud`,
                transactions: euTrades.slice(0, 10).map(t => t.id),
                details: { countries, tradeCount: euTrades.length }
              });
            }
          }
          return alerts;
        }
      },

      // ===== DRUG TRAFFICKING ORGANIZATION (DTO) =====
      {
        id: 'DTO-001', name: 'Bulk Cash Deposit Pattern',
        category: 'DRUG_TRAFFICKING', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          const cashDeposits = txs.filter(t => t.direction === 'CREDIT' && ['CASH','DEPOSIT'].includes(t.type) && t.amount >= 3000);
          if (cashDeposits.length >= 5) {
            const total = cashDeposits.reduce((s, t) => s + t.amount, 0);
            const avgAmount = total / cashDeposits.length;
            // DTO pattern: frequent mid-sized cash deposits
            if (avgAmount >= 5000 && avgAmount <= 9500 && total > 50000) {
              alerts.push({
                ruleId: 'DTO-001', category: 'DRUG_TRAFFICKING', severity: 'CRITICAL',
                score: 50, message: `${cashDeposits.length} cash deposits averaging $${avgAmount.toFixed(0)} (total $${total.toFixed(0)}) — bulk cash placement pattern`,
                transactions: cashDeposits.slice(0, 10).map(t => t.id),
                details: { count: cashDeposits.length, total, avgAmount }
              });
            }
          }
          return alerts;
        }
      },
      {
        id: 'DTO-002', name: 'Source Country Remittances',
        category: 'DRUG_TRAFFICKING', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const sourceCountries = new Set(['MX','CO','PE','BO','VE','GT','HN','SV','EC','JM','HT','DO','AF','MM','LA','PK']);
          const remits = txs.filter(t => sourceCountries.has(t.counterpartyCountry) && t.amount > 2000);
          if (remits.length >= 3) {
            const total = remits.reduce((s, t) => s + t.amount, 0);
            alerts.push({
              ruleId: 'DTO-002', category: 'DRUG_TRAFFICKING', severity: 'HIGH',
              score: 35, message: `${remits.length} transactions with drug source/transit countries totaling $${total.toFixed(0)}`,
              transactions: remits.slice(0, 10).map(t => t.id),
              details: { countries: [...new Set(remits.map(t => t.counterpartyCountry))], total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'DTO-003', name: 'Black Market Peso Exchange Indicators',
        category: 'DRUG_TRAFFICKING', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          // BMPE: Drug cash used to buy US goods, exported to LatAm, sold for pesos
          const tradePattern = /\b(electronics|appliances|auto parts|machinery|textiles|consumer goods|wholesale)\b/i;
          const latam = new Set(['MX','CO','VE','BR','AR','PE','CL','EC','PA']);
          const tradeTxs = txs.filter(t => t.direction === 'DEBIT' && tradePattern.test(t.description));
          const latamTxs = txs.filter(t => latam.has(t.counterpartyCountry));
          if (tradeTxs.length >= 3 && latamTxs.length >= 2) {
            const tradeTotal = tradeTxs.reduce((s, t) => s + t.amount, 0);
            if (tradeTotal > 50000) {
              alerts.push({
                ruleId: 'DTO-003', category: 'DRUG_TRAFFICKING', severity: 'CRITICAL',
                score: 50, message: `Trade purchases ($${tradeTotal.toFixed(0)}) combined with LatAm transactions — Black Market Peso Exchange pattern`,
                transactions: [...tradeTxs, ...latamTxs].slice(0, 10).map(t => t.id),
                details: { tradeTotal, latamCountries: [...new Set(latamTxs.map(t => t.counterpartyCountry))] }
              });
            }
          }
          return alerts;
        }
      },

      // ===== TERRORIST FINANCING (TF) =====
      {
        id: 'TF-001', name: 'High-Risk Jurisdiction for Terrorism',
        category: 'TERRORIST_FINANCING', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          const tfJurisdictions = new Set(['AF','IQ','SY','YE','SO','LY','PK','LB','PS','ML','NE','NG','SD','SS']);
          const tfTxs = txs.filter(t => tfJurisdictions.has(t.counterpartyCountry));
          if (tfTxs.length > 0) {
            const total = tfTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'TF-001', category: 'TERRORIST_FINANCING', severity: 'CRITICAL',
              score: 55, message: `${tfTxs.length} transaction(s) with terrorism-risk jurisdictions: ${[...new Set(tfTxs.map(t => t.counterpartyCountry))].join(', ')}`,
              transactions: tfTxs.map(t => t.id),
              details: { countries: [...new Set(tfTxs.map(t => t.counterpartyCountry))], total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'TF-002', name: 'Charity/NPO Suspicious Activity',
        category: 'TERRORIST_FINANCING', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const charityPattern = /\b(charity|foundation|relief|humanitarian|orphan|mosque|masjid|islamic|zakat|sadaqah|church|temple|ngo|nonprofit|501c)\b/i;
          const charityTxs = txs.filter(t => charityPattern.test(t.counterparty) || charityPattern.test(t.description));
          if (charityTxs.length < 3) return alerts;
          // Check for unusual patterns: many small donations, or donations to multiple orgs
          const orgs = new Set(charityTxs.map(t => t.counterparty).filter(Boolean));
          const total = charityTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
          if (orgs.size >= 5 || (charityTxs.length >= 10 && total > 20000)) {
            alerts.push({
              ruleId: 'TF-002', category: 'TERRORIST_FINANCING', severity: 'HIGH',
              score: 35, message: `${charityTxs.length} charity transactions to ${orgs.size} organizations totaling $${total.toFixed(0)} — review for TF diversion`,
              transactions: charityTxs.slice(0, 10).map(t => t.id),
              details: { orgCount: orgs.size, txCount: charityTxs.length, total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'TF-003', name: 'Small Value Rapid Transfers',
        category: 'TERRORIST_FINANCING', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          // TF often uses small amounts to avoid detection
          const smallTxs = txs.filter(t => t.amount >= 100 && t.amount <= 3000 && t.type === 'WIRE');
          if (smallTxs.length >= 10) {
            const sorted = smallTxs.sort((a, b) => a.date - b.date);
            const span = (sorted[sorted.length - 1].date - sorted[0].date) / 86400000;
            if (span <= 30) {
              const total = smallTxs.reduce((s, t) => s + t.amount, 0);
              alerts.push({
                ruleId: 'TF-003', category: 'TERRORIST_FINANCING', severity: 'HIGH',
                score: 35, message: `${smallTxs.length} small wires ($100-$3000) within ${Math.ceil(span)} days totaling $${total.toFixed(0)} — micro-financing pattern`,
                transactions: smallTxs.slice(0, 10).map(t => t.id),
                details: { count: smallTxs.length, days: Math.ceil(span), total }
              });
            }
          }
          return alerts;
        }
      },

      // ===== PROLIFERATION FINANCING (PF) =====
      {
        id: 'PF-001', name: 'WMD Proliferation Network Countries',
        category: 'PROLIFERATION', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          const prolifCountries = new Set(['KP','IR','SY','PK']);
          const prolifTxs = txs.filter(t => prolifCountries.has(t.counterpartyCountry));
          if (prolifTxs.length > 0) {
            alerts.push({
              ruleId: 'PF-001', category: 'PROLIFERATION', severity: 'CRITICAL',
              score: 60, message: `Transaction(s) with WMD proliferation concern countries: ${[...new Set(prolifTxs.map(t => t.counterpartyCountry))].join(', ')}`,
              transactions: prolifTxs.map(t => t.id),
              details: { countries: [...new Set(prolifTxs.map(t => t.counterpartyCountry))] }
            });
          }
          return alerts;
        }
      },
      {
        id: 'PF-002', name: 'Dual-Use Goods Transactions',
        category: 'PROLIFERATION', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const dualUsePattern = /\b(centrifuge|nuclear|uranium|plutonium|missile|rocket|guidance|aerospace|satellite|laser|precision|machining|cnc|composite|carbon fiber|maraging|titanium|aluminum alloy|valve|pump|vacuum|frequency converter|oscilloscope|spectrometer)\b/i;
          const dualUseTxs = txs.filter(t => dualUsePattern.test(t.description) && t.amount > 5000);
          if (dualUseTxs.length > 0) {
            alerts.push({
              ruleId: 'PF-002', category: 'PROLIFERATION', severity: 'HIGH',
              score: 45, message: `${dualUseTxs.length} transaction(s) referencing potential dual-use goods/technology`,
              transactions: dualUseTxs.map(t => t.id),
              details: { descriptions: dualUseTxs.map(t => t.description) }
            });
          }
          return alerts;
        }
      },
      {
        id: 'PF-003', name: 'Transshipment Hub Pattern',
        category: 'PROLIFERATION', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          // Common transshipment points for proliferation
          const transshipHubs = new Set(['CN','MY','SG','AE','TR','HK','TW']);
          const hubTxs = txs.filter(t => transshipHubs.has(t.counterpartyCountry) && t.amount > 25000);
          const techPattern = /\b(equipment|machinery|parts|components|materials|technical|engineering|scientific|industrial)\b/i;
          const techHubTxs = hubTxs.filter(t => techPattern.test(t.description));
          if (techHubTxs.length >= 2) {
            alerts.push({
              ruleId: 'PF-003', category: 'PROLIFERATION', severity: 'HIGH',
              score: 35, message: `Technical/equipment payments to transshipment hubs: ${[...new Set(techHubTxs.map(t => t.counterpartyCountry))].join(', ')}`,
              transactions: techHubTxs.map(t => t.id),
              details: { hubs: [...new Set(techHubTxs.map(t => t.counterpartyCountry))] }
            });
          }
          return alerts;
        }
      },

      // ===== ARMS TRAFFICKING (ARMS) =====
      {
        id: 'ARMS-001', name: 'Defense/Arms Industry Transactions',
        category: 'ARMS_TRAFFICKING', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const armsPattern = /\b(weapon|firearm|ammunition|munition|defense|military|tactical|ballistic|armament|ordnance|explosive|rifle|pistol|gun|artillery|armor)\b/i;
          const armsTxs = txs.filter(t => armsPattern.test(t.counterparty) || armsPattern.test(t.description));
          if (armsTxs.length > 0) {
            const total = armsTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'ARMS-001', category: 'ARMS_TRAFFICKING', severity: 'HIGH',
              score: 40, message: `${armsTxs.length} arms/defense-related transaction(s) totaling $${total.toFixed(0)}`,
              transactions: armsTxs.map(t => t.id),
              details: { count: armsTxs.length, total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'ARMS-002', name: 'Conflict Zone Transactions',
        category: 'ARMS_TRAFFICKING', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          const conflictZones = new Set(['UA','RU','YE','SY','LY','SD','SS','ET','MM','AF','ML','CF','CD','SO']);
          const conflictTxs = txs.filter(t => conflictZones.has(t.counterpartyCountry) && t.amount > 5000);
          if (conflictTxs.length > 0) {
            const total = conflictTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'ARMS-002', category: 'ARMS_TRAFFICKING', severity: 'CRITICAL',
              score: 50, message: `${conflictTxs.length} transaction(s) with active conflict zones totaling $${total.toFixed(0)}`,
              transactions: conflictTxs.map(t => t.id),
              details: { countries: [...new Set(conflictTxs.map(t => t.counterpartyCountry))], total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'ARMS-003', name: 'End-User Certificate Jurisdictions',
        category: 'ARMS_TRAFFICKING', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const eucPattern = /\b(end.?user|euc|export license|itar|ear|commerce control|dual.?use|controlled goods|export control)\b/i;
          const eucTxs = txs.filter(t => eucPattern.test(t.description));
          if (eucTxs.length > 0) {
            alerts.push({
              ruleId: 'ARMS-003', category: 'ARMS_TRAFFICKING', severity: 'HIGH',
              score: 30, message: `${eucTxs.length} transaction(s) referencing export controls/end-user certificates`,
              transactions: eucTxs.map(t => t.id),
              details: { count: eucTxs.length }
            });
          }
          return alerts;
        }
      },

      // ===== ENVIRONMENTAL CRIMES (ENV) =====
      {
        id: 'ENV-001', name: 'Illegal Wildlife Trade',
        category: 'ENVIRONMENTAL_CRIME', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const wildlifePattern = /\b(ivory|rhino|horn|pangolin|tiger|leopard|exotic|wildlife|specimen|taxidermy|trophy|cites|endangered|protected species|bushmeat|reptile|parrot|primate)\b/i;
          const wildlifeTxs = txs.filter(t => wildlifePattern.test(t.description) || wildlifePattern.test(t.counterparty));
          if (wildlifeTxs.length > 0) {
            const total = wildlifeTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'ENV-001', category: 'ENVIRONMENTAL_CRIME', severity: 'HIGH',
              score: 40, message: `${wildlifeTxs.length} transaction(s) potentially related to wildlife trade — $${total.toFixed(0)}`,
              transactions: wildlifeTxs.map(t => t.id),
              details: { count: wildlifeTxs.length, total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'ENV-002', name: 'Illegal Logging/Timber',
        category: 'ENVIRONMENTAL_CRIME', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const timberPattern = /\b(timber|lumber|hardwood|rosewood|teak|mahogany|ebony|logging|forestry|sawmill|wood export)\b/i;
          const highRiskTimber = new Set(['BR','ID','MY','PG','CG','CD','CM','GA','MM','LA','KH','VN']);
          const timberTxs = txs.filter(t => timberPattern.test(t.description) && highRiskTimber.has(t.counterpartyCountry));
          if (timberTxs.length >= 2) {
            alerts.push({
              ruleId: 'ENV-002', category: 'ENVIRONMENTAL_CRIME', severity: 'MEDIUM',
              score: 25, message: `Timber transactions with deforestation-risk countries: ${[...new Set(timberTxs.map(t => t.counterpartyCountry))].join(', ')}`,
              transactions: timberTxs.map(t => t.id),
              details: { countries: [...new Set(timberTxs.map(t => t.counterpartyCountry))] }
            });
          }
          return alerts;
        }
      },
      {
        id: 'ENV-003', name: 'Illegal Fishing/IUU',
        category: 'ENVIRONMENTAL_CRIME', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const fishingPattern = /\b(fishing|trawler|vessel|seafood|fish|catch|maritime|fleet|tuna|shark fin|abalone)\b/i;
          const iuuRiskFlags = new Set(['CN','TW','KR','TH','VN','ID','ES','JP']);
          const fishTxs = txs.filter(t => fishingPattern.test(t.description) && iuuRiskFlags.has(t.counterpartyCountry) && t.amount > 10000);
          if (fishTxs.length >= 2) {
            alerts.push({
              ruleId: 'ENV-003', category: 'ENVIRONMENTAL_CRIME', severity: 'MEDIUM',
              score: 25, message: `${fishTxs.length} fishing-related transactions with IUU-risk jurisdictions`,
              transactions: fishTxs.map(t => t.id),
              details: { countries: [...new Set(fishTxs.map(t => t.counterpartyCountry))] }
            });
          }
          return alerts;
        }
      },
      {
        id: 'ENV-004', name: 'Illegal Mining/Conflict Minerals',
        category: 'ENVIRONMENTAL_CRIME', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const miningPattern = /\b(mining|mineral|ore|gold|diamond|coltan|tantalum|tungsten|tin|cobalt|lithium|rare earth|artisanal|smelter)\b/i;
          const conflictMineralCountries = new Set(['CD','RW','UG','BI','CF','SS','ZW','VE','ML','BF','TD']);
          const miningTxs = txs.filter(t => miningPattern.test(t.description) && conflictMineralCountries.has(t.counterpartyCountry));
          if (miningTxs.length > 0) {
            alerts.push({
              ruleId: 'ENV-004', category: 'ENVIRONMENTAL_CRIME', severity: 'HIGH',
              score: 40, message: `Mining transactions with conflict mineral regions: ${[...new Set(miningTxs.map(t => t.counterpartyCountry))].join(', ')}`,
              transactions: miningTxs.map(t => t.id),
              details: { countries: [...new Set(miningTxs.map(t => t.counterpartyCountry))] }
            });
          }
          return alerts;
        }
      },

      // ===== ORGANIZED CRIME (OC) =====
      {
        id: 'OC-001', name: 'Protection Money / Extortion Pattern',
        category: 'ORGANIZED_CRIME', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          // Regular payments to same party, round amounts, cash
          const debits = txs.filter(t => t.direction === 'DEBIT').sort((a, b) => a.date - b.date);
          const byCounterparty = {};
          for (const t of debits) {
            if (!t.counterparty) continue;
            (byCounterparty[t.counterparty] = byCounterparty[t.counterparty] || []).push(t);
          }
          for (const [cp, group] of Object.entries(byCounterparty)) {
            if (group.length >= 4) {
              const amounts = group.map(t => t.amount);
              const allSimilar = amounts.every(a => Math.abs(a - amounts[0]) / amounts[0] < 0.1);
              if (allSimilar && amounts[0] >= 500) {
                alerts.push({
                  ruleId: 'OC-001', category: 'ORGANIZED_CRIME', severity: 'HIGH',
                  score: 35, message: `${group.length} recurring payments of ~$${amounts[0].toFixed(0)} to "${cp}" — possible protection/extortion`,
                  transactions: group.map(t => t.id),
                  details: { counterparty: cp, count: group.length, amount: amounts[0] }
                });
              }
            }
          }
          return alerts;
        }
      },
      {
        id: 'OC-002', name: 'Front Business Activity',
        category: 'ORGANIZED_CRIME', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const frontBusinesses = /\b(laundromat|car wash|nail salon|pizza|restaurant|bar|nightclub|vending|parking|atm|check cashing|pawn|scrap metal|used car|tow|waste|hauling)\b/i;
          const frontTxs = txs.filter(t => frontBusinesses.test(t.counterparty) || frontBusinesses.test(t.description));
          if (frontTxs.length >= 5) {
            const cashTxs = frontTxs.filter(t => ['CASH','DEPOSIT'].includes(t.type));
            if (cashTxs.length >= 3) {
              const total = cashTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
              alerts.push({
                ruleId: 'OC-002', category: 'ORGANIZED_CRIME', severity: 'HIGH',
                score: 35, message: `${cashTxs.length} cash transactions with typical front businesses totaling $${total.toFixed(0)}`,
                transactions: cashTxs.slice(0, 10).map(t => t.id),
                details: { cashCount: cashTxs.length, total }
              });
            }
          }
          return alerts;
        }
      },
      {
        id: 'OC-003', name: 'Loan Sharking Indicators',
        category: 'ORGANIZED_CRIME', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          // Pattern: Large outbound followed by many small inbound from same person
          const debits = txs.filter(t => t.direction === 'DEBIT' && t.amount > 5000).sort((a, b) => a.date - b.date);
          for (const d of debits) {
            const followingCredits = txs.filter(t =>
              t.direction === 'CREDIT' && t.date > d.date &&
              (t.date - d.date) / 86400000 <= 180 &&
              t.counterparty === d.counterparty
            );
            if (followingCredits.length >= 5) {
              const totalRepaid = followingCredits.reduce((s, t) => s + t.amount, 0);
              const effectiveRate = (totalRepaid / d.amount - 1) * 100;
              if (effectiveRate > 50) {
                alerts.push({
                  ruleId: 'OC-003', category: 'ORGANIZED_CRIME', severity: 'HIGH',
                  score: 35, message: `Loan pattern: $${d.amount.toFixed(0)} out, $${totalRepaid.toFixed(0)} repaid in ${followingCredits.length} payments (${effectiveRate.toFixed(0)}% effective rate)`,
                  transactions: [d.id, ...followingCredits.map(t => t.id)],
                  details: { principal: d.amount, repaid: totalRepaid, effectiveRate }
                });
                break;
              }
            }
          }
          return alerts;
        }
      },

      // ===== PONZI / PYRAMID SCHEMES (PON) =====
      {
        id: 'PON-001', name: 'Investor-to-Investor Payments',
        category: 'PONZI_SCHEME', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          const investPattern = /\b(investment|return|dividend|profit|yield|roi|investor|member|participant|bonus)\b/i;
          const investTxs = txs.filter(t => investPattern.test(t.description));
          if (investTxs.length < 5) return alerts;
          const credits = investTxs.filter(t => t.direction === 'CREDIT');
          const debits = investTxs.filter(t => t.direction === 'DEBIT');
          // Ponzi: new investor money used to pay existing investors
          if (credits.length >= 3 && debits.length >= 3) {
            const creditTotal = credits.reduce((s, t) => s + t.amount, 0);
            const debitTotal = debits.reduce((s, t) => s + t.amount, 0);
            // Inflows roughly equal outflows (no real business)
            if (Math.abs(creditTotal - debitTotal) / creditTotal < 0.3) {
              alerts.push({
                ruleId: 'PON-001', category: 'PONZI_SCHEME', severity: 'CRITICAL',
                score: 50, message: `Investment flows in ($${creditTotal.toFixed(0)}) ≈ out ($${debitTotal.toFixed(0)}) — Ponzi scheme pattern`,
                transactions: investTxs.slice(0, 10).map(t => t.id),
                details: { creditTotal, debitTotal }
              });
            }
          }
          return alerts;
        }
      },
      {
        id: 'PON-002', name: 'Guaranteed High Returns',
        category: 'PONZI_SCHEME', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const guaranteedPattern = /\b(guaranteed|fixed return|10%|15%|20%|25%|30%|monthly return|weekly return|daily return|no risk|risk.?free|assured)\b/i;
          const guaranteedTxs = txs.filter(t => guaranteedPattern.test(t.description));
          if (guaranteedTxs.length >= 2) {
            alerts.push({
              ruleId: 'PON-002', category: 'PONZI_SCHEME', severity: 'HIGH',
              score: 35, message: `${guaranteedTxs.length} transactions referencing guaranteed/high returns`,
              transactions: guaranteedTxs.map(t => t.id),
              details: { count: guaranteedTxs.length }
            });
          }
          return alerts;
        }
      },
      {
        id: 'PON-003', name: 'Multi-Level Referral Pattern',
        category: 'PONZI_SCHEME', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const mlmPattern = /\b(referral|commission|downline|upline|level|tier|recruit|sponsor|network marketing|mlm|affiliate|bonus)\b/i;
          const mlmTxs = txs.filter(t => mlmPattern.test(t.description) && t.direction === 'DEBIT');
          if (mlmTxs.length >= 5) {
            const recipients = new Set(mlmTxs.map(t => t.counterparty).filter(Boolean));
            if (recipients.size >= 3) {
              alerts.push({
                ruleId: 'PON-003', category: 'PONZI_SCHEME', severity: 'HIGH',
                score: 35, message: `${mlmTxs.length} referral/commission payments to ${recipients.size} recipients — pyramid structure indicators`,
                transactions: mlmTxs.slice(0, 10).map(t => t.id),
                details: { txCount: mlmTxs.length, recipientCount: recipients.size }
              });
            }
          }
          return alerts;
        }
      },

      // ===== ART & LUXURY GOODS LAUNDERING (ART) =====
      {
        id: 'ART-001', name: 'High-Value Art Transactions',
        category: 'ART_LAUNDERING', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const artPattern = /\b(gallery|auction|sotheby|christie|bonham|phillips|artwork|painting|sculpture|antiquit|artifact|collectible|fine art|art dealer|art advisor)\b/i;
          const artTxs = txs.filter(t => artPattern.test(t.counterparty) || artPattern.test(t.description));
          if (artTxs.length > 0) {
            const total = artTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            if (total > 50000) {
              alerts.push({
                ruleId: 'ART-001', category: 'ART_LAUNDERING', severity: 'MEDIUM',
                score: 25, message: `${artTxs.length} art market transaction(s) totaling $${total.toFixed(0)} — high-risk for value manipulation`,
                transactions: artTxs.map(t => t.id),
                details: { count: artTxs.length, total }
              });
            }
          }
          return alerts;
        }
      },
      {
        id: 'ART-002', name: 'Freeport Storage Transactions',
        category: 'ART_LAUNDERING', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const freeportPattern = /\b(freeport|free port|geneva freeport|luxembourg freeport|delaware freeport|singapore freeport|storage vault|bonded warehouse|duty.?free storage)\b/i;
          const freeportTxs = txs.filter(t => freeportPattern.test(t.description) || freeportPattern.test(t.counterparty));
          if (freeportTxs.length > 0) {
            alerts.push({
              ruleId: 'ART-002', category: 'ART_LAUNDERING', severity: 'HIGH',
              score: 35, message: `${freeportTxs.length} freeport/bonded storage transaction(s) — art/asset concealment risk`,
              transactions: freeportTxs.map(t => t.id),
              details: { count: freeportTxs.length }
            });
          }
          return alerts;
        }
      },
      {
        id: 'ART-003', name: 'Luxury Goods Cash Purchases',
        category: 'ART_LAUNDERING', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const luxuryPattern = /\b(rolex|patek|audemars|cartier|van cleef|tiffany|bulgari|hermes|louis vuitton|chanel|gucci|ferrari|lamborghini|bentley|rolls.?royce|yacht|private jet|diamond|emerald|ruby|sapphire)\b/i;
          const luxuryTxs = txs.filter(t => luxuryPattern.test(t.description) || luxuryPattern.test(t.counterparty));
          const cashLuxury = luxuryTxs.filter(t => ['CASH','DEPOSIT','CHECK'].includes(t.type));
          if (cashLuxury.length > 0) {
            const total = cashLuxury.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'ART-003', category: 'ART_LAUNDERING', severity: 'HIGH',
              score: 35, message: `${cashLuxury.length} cash/check luxury purchases totaling $${total.toFixed(0)}`,
              transactions: cashLuxury.map(t => t.id),
              details: { count: cashLuxury.length, total }
            });
          }
          return alerts;
        }
      },

      // ===== SPORTS CORRUPTION (SPORT) =====
      {
        id: 'SPORT-001', name: 'Match-Fixing Betting Pattern',
        category: 'SPORTS_CORRUPTION', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const bettingPattern = /\b(bet365|betfair|pinnacle|betway|unibet|william hill|ladbrokes|paddy power|draftkings|fanduel|sportsbook|wager|parlay|accumulator|betting|bookmaker)\b/i;
          const bettingTxs = txs.filter(t => bettingPattern.test(t.counterparty) || bettingPattern.test(t.description));
          if (bettingTxs.length >= 5) {
            const credits = bettingTxs.filter(t => t.direction === 'CREDIT');
            const debits = bettingTxs.filter(t => t.direction === 'DEBIT');
            // Unusual win rate
            if (credits.length > 0 && debits.length > 0) {
              const winnings = credits.reduce((s, t) => s + t.amount, 0);
              const stakes = debits.reduce((s, t) => s + t.amount, 0);
              const winRate = winnings / stakes;
              if (winRate > 1.5 && winnings > 20000) {
                alerts.push({
                  ruleId: 'SPORT-001', category: 'SPORTS_CORRUPTION', severity: 'HIGH',
                  score: 40, message: `Unusual betting success: $${stakes.toFixed(0)} staked, $${winnings.toFixed(0)} won (${(winRate*100).toFixed(0)}% return) — match-fixing indicator`,
                  transactions: bettingTxs.slice(0, 10).map(t => t.id),
                  details: { stakes, winnings, winRate }
                });
              }
            }
          }
          return alerts;
        }
      },
      {
        id: 'SPORT-002', name: 'Agent/Representative Payments',
        category: 'SPORTS_CORRUPTION', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const agentPattern = /\b(sports agent|player agent|transfer fee|signing bonus|image rights|appearance fee|endorsement|sponsorship|athlete|player|coach|manager)\b/i;
          const agentTxs = txs.filter(t => agentPattern.test(t.description) && t.amount > 10000);
          if (agentTxs.length >= 2) {
            const total = agentTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'SPORT-002', category: 'SPORTS_CORRUPTION', severity: 'MEDIUM',
              score: 25, message: `${agentTxs.length} sports industry payments totaling $${total.toFixed(0)}`,
              transactions: agentTxs.map(t => t.id),
              details: { count: agentTxs.length, total }
            });
          }
          return alerts;
        }
      },

      // ===== CORRESPONDENT BANKING ABUSE (CORR) =====
      {
        id: 'CORR-001', name: 'Nested Account / Payable-Through',
        category: 'CORRESPONDENT_BANKING', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const corrPattern = /\b(correspondent|nostro|vostro|payable.?through|nested|third.?party bank|respondent bank|foreign bank)\b/i;
          const corrTxs = txs.filter(t => corrPattern.test(t.description));
          if (corrTxs.length >= 2) {
            const total = corrTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'CORR-001', category: 'CORRESPONDENT_BANKING', severity: 'HIGH',
              score: 35, message: `${corrTxs.length} correspondent banking transactions totaling $${total.toFixed(0)}`,
              transactions: corrTxs.map(t => t.id),
              details: { count: corrTxs.length, total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'CORR-002', name: 'Wire Stripping Indicators',
        category: 'CORRESPONDENT_BANKING', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          // Wire stripping: removing originator info from SWIFT messages
          const wires = txs.filter(t => t.type === 'WIRE' && t.amount > 10000);
          const missingInfo = wires.filter(t => !t.counterparty || t.counterparty.length < 5);
          if (missingInfo.length >= 3) {
            alerts.push({
              ruleId: 'CORR-002', category: 'CORRESPONDENT_BANKING', severity: 'CRITICAL',
              score: 50, message: `${missingInfo.length} wire transfers with missing/incomplete originator information — wire stripping indicator`,
              transactions: missingInfo.map(t => t.id),
              details: { count: missingInfo.length }
            });
          }
          return alerts;
        }
      },
      {
        id: 'CORR-003', name: 'U-Turn Transaction Pattern',
        category: 'CORRESPONDENT_BANKING', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          // U-turn: funds from sanctioned country through US bank back to same region
          const sanctionedRegions = new Set(['IR','CU','KP','SY','RU']);
          const wires = txs.filter(t => t.type === 'WIRE').sort((a, b) => a.date - b.date);
          for (let i = 0; i < wires.length - 1; i++) {
            const inbound = wires[i];
            const outbound = wires.find(w =>
              w.direction !== inbound.direction &&
              w.date > inbound.date &&
              (w.date - inbound.date) / 86400000 < 5 &&
              Math.abs(w.amount - inbound.amount) / inbound.amount < 0.1
            );
            if (outbound && (sanctionedRegions.has(inbound.counterpartyCountry) || sanctionedRegions.has(outbound.counterpartyCountry))) {
              alerts.push({
                ruleId: 'CORR-003', category: 'CORRESPONDENT_BANKING', severity: 'HIGH',
                score: 45, message: `Potential U-turn: wire from/to sanctioned region routed through this account`,
                transactions: [inbound.id, outbound.id],
                details: { inboundCountry: inbound.counterpartyCountry, outboundCountry: outbound.counterpartyCountry }
              });
              break;
            }
          }
          return alerts;
        }
      },

      // ===== PREPAID CARD ABUSE (PREP) =====
      {
        id: 'PREP-001', name: 'Bulk Prepaid Card Loading',
        category: 'PREPAID_ABUSE', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const prepaidPattern = /\b(prepaid|reload|green dot|money pak|vanilla|netspend|bluebird|serve|paypal prepaid|venmo card)\b/i;
          const prepaidTxs = txs.filter(t => t.direction === 'DEBIT' && (prepaidPattern.test(t.description) || prepaidPattern.test(t.counterparty)));
          if (prepaidTxs.length >= 5) {
            const total = prepaidTxs.reduce((s, t) => s + t.amount, 0);
            alerts.push({
              ruleId: 'PREP-001', category: 'PREPAID_ABUSE', severity: 'HIGH',
              score: 35, message: `${prepaidTxs.length} prepaid card loads totaling $${total.toFixed(0)}`,
              transactions: prepaidTxs.slice(0, 10).map(t => t.id),
              details: { count: prepaidTxs.length, total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'PREP-002', name: 'Structured Prepaid Loads',
        category: 'PREPAID_ABUSE', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const prepaidPattern = /\b(prepaid|reload|green dot|money pak|vanilla|netspend)\b/i;
          const prepaidTxs = txs.filter(t => t.direction === 'DEBIT' && prepaidPattern.test(t.description));
          // Check for amounts just below reporting threshold ($2,000 for prepaid)
          const structured = prepaidTxs.filter(t => t.amount >= 1500 && t.amount < 2000);
          if (structured.length >= 3) {
            alerts.push({
              ruleId: 'PREP-002', category: 'PREPAID_ABUSE', severity: 'HIGH',
              score: 40, message: `${structured.length} prepaid loads just below $2,000 threshold — structured loading`,
              transactions: structured.map(t => t.id),
              details: { count: structured.length, amounts: structured.map(t => t.amount) }
            });
          }
          return alerts;
        }
      },

      // ===== MOBILE PAYMENT LAUNDERING (MOB) =====
      {
        id: 'MOB-001', name: 'P2P Payment App Abuse',
        category: 'MOBILE_LAUNDERING', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const p2pPattern = /\b(venmo|zelle|cash app|paypal|square cash|apple pay|google pay|samsung pay|mpesa|wechat pay|alipay)\b/i;
          const p2pTxs = txs.filter(t => p2pPattern.test(t.counterparty) || p2pPattern.test(t.description));
          if (p2pTxs.length >= 10) {
            const total = p2pTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            if (total > 20000) {
              alerts.push({
                ruleId: 'MOB-001', category: 'MOBILE_LAUNDERING', severity: 'MEDIUM',
                score: 25, message: `${p2pTxs.length} P2P payment app transactions totaling $${total.toFixed(0)}`,
                transactions: p2pTxs.slice(0, 10).map(t => t.id),
                details: { count: p2pTxs.length, total }
              });
            }
          }
          return alerts;
        }
      },
      {
        id: 'MOB-002', name: 'Rapid P2P Dispersion',
        category: 'MOBILE_LAUNDERING', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const p2pPattern = /\b(venmo|zelle|cash app|paypal)\b/i;
          const p2pOut = txs.filter(t => t.direction === 'DEBIT' && p2pPattern.test(t.counterparty)).sort((a, b) => a.date - b.date);
          if (p2pOut.length >= 5) {
            const recipients = new Set(p2pOut.map(t => t.counterparty));
            const span = (p2pOut[p2pOut.length - 1].date - p2pOut[0].date) / 86400000;
            if (recipients.size >= 4 && span <= 7) {
              const total = p2pOut.reduce((s, t) => s + t.amount, 0);
              alerts.push({
                ruleId: 'MOB-002', category: 'MOBILE_LAUNDERING', severity: 'HIGH',
                score: 35, message: `$${total.toFixed(0)} dispersed to ${recipients.size} recipients via P2P apps within ${Math.ceil(span)} days`,
                transactions: p2pOut.slice(0, 10).map(t => t.id),
                details: { recipients: recipients.size, days: Math.ceil(span), total }
              });
            }
          }
          return alerts;
        }
      },

      // ===== CROWDFUNDING / ICO ABUSE (CROWD) =====
      {
        id: 'CROWD-001', name: 'Crowdfunding Platform Abuse',
        category: 'CROWDFUNDING_ABUSE', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const crowdPattern = /\b(gofundme|kickstarter|indiegogo|patreon|fundrazr|givesendgo|crowdfund|donation|campaign)\b/i;
          const crowdTxs = txs.filter(t => crowdPattern.test(t.counterparty) || crowdPattern.test(t.description));
          if (crowdTxs.length >= 3) {
            const total = crowdTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            if (total > 10000) {
              alerts.push({
                ruleId: 'CROWD-001', category: 'CROWDFUNDING_ABUSE', severity: 'MEDIUM',
                score: 25, message: `${crowdTxs.length} crowdfunding transactions totaling $${total.toFixed(0)}`,
                transactions: crowdTxs.map(t => t.id),
                details: { count: crowdTxs.length, total }
              });
            }
          }
          return alerts;
        }
      },
      {
        id: 'CROWD-002', name: 'ICO/Token Sale Fraud Indicators',
        category: 'CROWDFUNDING_ABUSE', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const icoPattern = /\b(ico|initial coin|token sale|token generation|presale|private sale|seed round|saft|simple agreement|utility token|security token)\b/i;
          const icoTxs = txs.filter(t => icoPattern.test(t.description));
          if (icoTxs.length >= 2) {
            const total = icoTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'CROWD-002', category: 'CROWDFUNDING_ABUSE', severity: 'HIGH',
              score: 35, message: `${icoTxs.length} ICO/token sale transactions totaling $${total.toFixed(0)}`,
              transactions: icoTxs.map(t => t.id),
              details: { count: icoTxs.length, total }
            });
          }
          return alerts;
        }
      },

      // ===== SHELL COMPANY PATTERNS (SHELL) =====
      {
        id: 'SHELL-001', name: 'Aged Shell Company Acquisition',
        category: 'SHELL_COMPANY', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const shellPattern = /\b(shelf company|aged company|ready.?made|dormant company|company acquisition|share purchase|stock purchase)\b/i;
          const shellTxs = txs.filter(t => shellPattern.test(t.description) && t.amount > 5000);
          if (shellTxs.length > 0) {
            alerts.push({
              ruleId: 'SHELL-001', category: 'SHELL_COMPANY', severity: 'HIGH',
              score: 35, message: `${shellTxs.length} transaction(s) potentially involving shell/shelf company acquisition`,
              transactions: shellTxs.map(t => t.id),
              details: { count: shellTxs.length }
            });
          }
          return alerts;
        }
      },
      {
        id: 'SHELL-002', name: 'Nominee Director Services',
        category: 'SHELL_COMPANY', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const nomineePattern = /\b(nominee|proxy|fiduciary|registered agent|company secretary|corporate service|formation agent|incorporat)\b/i;
          const nomineeTxs = txs.filter(t => nomineePattern.test(t.counterparty) || nomineePattern.test(t.description));
          if (nomineeTxs.length >= 2) {
            const total = nomineeTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'SHELL-002', category: 'SHELL_COMPANY', severity: 'HIGH',
              score: 30, message: `${nomineeTxs.length} nominee/corporate service payments totaling $${total.toFixed(0)}`,
              transactions: nomineeTxs.map(t => t.id),
              details: { count: nomineeTxs.length, total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'SHELL-003', name: 'Virtual Office / Mailbox Address',
        category: 'SHELL_COMPANY', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const virtualPattern = /\b(virtual office|mail forwarding|mailbox|registered address|po box|suite \d+|regus|wework|spaces|hq global)\b/i;
          const virtualTxs = txs.filter(t => virtualPattern.test(t.description) || virtualPattern.test(t.counterparty));
          if (virtualTxs.length >= 2) {
            alerts.push({
              ruleId: 'SHELL-003', category: 'SHELL_COMPANY', severity: 'MEDIUM',
              score: 20, message: `${virtualTxs.length} payments to virtual office/mail forwarding services`,
              transactions: virtualTxs.map(t => t.id),
              details: { count: virtualTxs.length }
            });
          }
          return alerts;
        }
      },
      {
        id: 'SHELL-004', name: 'Multi-Jurisdiction Entity Payments',
        category: 'SHELL_COMPANY', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const opaque = new Set(['VG','KY','BM','PA','SC','BS','BZ','WS','VU','MH','LI','GG','JE','IM','CY']);
          const shellNames = /\b(holdings|trading|international|global|ventures|capital|assets|investment|enterprise|group|partners|associates)\b/i;
          const shellTxs = txs.filter(t =>
            shellNames.test(t.counterparty) && opaque.has(t.counterpartyCountry) && t.amount > 10000
          );
          if (shellTxs.length >= 2) {
            const countries = [...new Set(shellTxs.map(t => t.counterpartyCountry))];
            const total = shellTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'SHELL-004', category: 'SHELL_COMPANY', severity: 'HIGH',
              score: 40, message: `$${total.toFixed(0)} to generic-named entities in opaque jurisdictions: ${countries.join(', ')}`,
              transactions: shellTxs.slice(0, 10).map(t => t.id),
              details: { countries, total, entities: [...new Set(shellTxs.map(t => t.counterparty))] }
            });
          }
          return alerts;
        }
      },

      // ===== PROFESSIONAL ENABLERS (GATE) =====
      {
        id: 'GATE-001', name: 'Law Firm Trust Account Activity',
        category: 'PROFESSIONAL_ENABLER', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const lawPattern = /\b(law firm|attorney|solicitor|barrister|legal|escrow|iolta|client trust|client account|settlement)\b/i;
          const lawTxs = txs.filter(t => lawPattern.test(t.counterparty) || lawPattern.test(t.description));
          if (lawTxs.length >= 3) {
            const total = lawTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            if (total > 50000) {
              alerts.push({
                ruleId: 'GATE-001', category: 'PROFESSIONAL_ENABLER', severity: 'MEDIUM',
                score: 25, message: `${lawTxs.length} law firm/trust account transactions totaling $${total.toFixed(0)}`,
                transactions: lawTxs.slice(0, 10).map(t => t.id),
                details: { count: lawTxs.length, total }
              });
            }
          }
          return alerts;
        }
      },
      {
        id: 'GATE-002', name: 'Accountant/Tax Adviser Payments',
        category: 'PROFESSIONAL_ENABLER', severity: 'LOW',
        detect: (txs) => {
          const alerts = [];
          const cpaPattern = /\b(cpa|accountant|tax advisor|tax preparer|bookkeeper|audit|deloitte|pwc|ey|kpmg|bdo|grant thornton|rsm)\b/i;
          const cpaTxs = txs.filter(t => cpaPattern.test(t.counterparty) && t.amount > 25000);
          if (cpaTxs.length >= 2) {
            const total = cpaTxs.reduce((s, t) => s + t.amount, 0);
            alerts.push({
              ruleId: 'GATE-002', category: 'PROFESSIONAL_ENABLER', severity: 'LOW',
              score: 15, message: `${cpaTxs.length} large accounting/tax service payments totaling $${total.toFixed(0)}`,
              transactions: cpaTxs.map(t => t.id),
              details: { count: cpaTxs.length, total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'GATE-003', name: 'Trust and Company Service Provider',
        category: 'PROFESSIONAL_ENABLER', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const tcspPattern = /\b(trust company|trustee|corporate trustee|family office|private trust|asset protection|wealth structur|estate planning|offshore)\b/i;
          const tcspTxs = txs.filter(t => tcspPattern.test(t.counterparty) || tcspPattern.test(t.description));
          if (tcspTxs.length >= 2) {
            const total = tcspTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'GATE-003', category: 'PROFESSIONAL_ENABLER', severity: 'HIGH',
              score: 30, message: `${tcspTxs.length} trust/corporate service provider transactions totaling $${total.toFixed(0)}`,
              transactions: tcspTxs.map(t => t.id),
              details: { count: tcspTxs.length, total }
            });
          }
          return alerts;
        }
      },

      // ===== COVID-19 FRAUD SCHEMES (COVID) =====
      {
        id: 'COVID-001', name: 'PPP/EIDL Loan Fraud Indicators',
        category: 'COVID_FRAUD', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const pppPattern = /\b(ppp|paycheck protection|eidl|sba loan|cares act|covid.?19 loan|disaster loan|economic injury)\b/i;
          const pppTxs = txs.filter(t => t.direction === 'CREDIT' && pppPattern.test(t.description));
          if (pppTxs.length > 0) {
            // Check if followed by personal/luxury spending
            const luxuryPattern = /\b(luxury|jewelry|vehicle|boat|vacation|casino|personal|transfer)\b/i;
            const afterPPP = txs.filter(t =>
              t.direction === 'DEBIT' &&
              (luxuryPattern.test(t.description) || luxuryPattern.test(t.counterparty)) &&
              pppTxs.some(p => t.date > p.date && (t.date - p.date) / 86400000 < 60)
            );
            if (afterPPP.length > 0) {
              alerts.push({
                ruleId: 'COVID-001', category: 'COVID_FRAUD', severity: 'HIGH',
                score: 40, message: `PPP/EIDL loan followed by ${afterPPP.length} non-business expenditures — potential fraud`,
                transactions: [...pppTxs.map(t => t.id), ...afterPPP.map(t => t.id)],
                details: { loanCount: pppTxs.length, suspiciousSpend: afterPPP.length }
              });
            }
          }
          return alerts;
        }
      },
      {
        id: 'COVID-002', name: 'Unemployment Fraud Pattern',
        category: 'COVID_FRAUD', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const uiPattern = /\b(unemployment|ui benefit|edd|pua|pandemic unemployment|jobless|workforce commission)\b/i;
          const uiTxs = txs.filter(t => t.direction === 'CREDIT' && uiPattern.test(t.description));
          // Multiple UI payments from different states
          const states = new Set(uiTxs.map(t => t.description.match(/\b[A-Z]{2}\b/)?.[0]).filter(Boolean));
          if (uiTxs.length >= 3 && states.size >= 2) {
            alerts.push({
              ruleId: 'COVID-002', category: 'COVID_FRAUD', severity: 'HIGH',
              score: 45, message: `Unemployment benefits from ${states.size} states — potential multi-state fraud`,
              transactions: uiTxs.map(t => t.id),
              details: { states: [...states], txCount: uiTxs.length }
            });
          }
          return alerts;
        }
      },
      {
        id: 'COVID-003', name: 'Medical/PPE Supply Fraud',
        category: 'COVID_FRAUD', severity: 'MEDIUM',
        detect: (txs) => {
          const alerts = [];
          const ppePattern = /\b(ppe|mask|n95|ventilator|sanitizer|disinfectant|medical supply|test kit|covid test|rapid test|vaccine)\b/i;
          const ppeTxs = txs.filter(t => ppePattern.test(t.description) && t.amount > 10000);
          if (ppeTxs.length >= 2) {
            const total = ppeTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'COVID-003', category: 'COVID_FRAUD', severity: 'MEDIUM',
              score: 25, message: `${ppeTxs.length} medical/PPE supply transactions totaling $${total.toFixed(0)}`,
              transactions: ppeTxs.map(t => t.id),
              details: { count: ppeTxs.length, total }
            });
          }
          return alerts;
        }
      },

      // ===== TRADE FINANCE FRAUD (TRADE) =====
      {
        id: 'TRADE-001', name: 'Letter of Credit Fraud',
        category: 'TRADE_FINANCE', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const lcPattern = /\b(letter of credit|l\/c|documentary credit|standby lc|sblc|bank guarantee|performance bond|bid bond)\b/i;
          const lcTxs = txs.filter(t => lcPattern.test(t.description));
          if (lcTxs.length >= 2) {
            const total = lcTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'TRADE-001', category: 'TRADE_FINANCE', severity: 'HIGH',
              score: 30, message: `${lcTxs.length} letter of credit/bank guarantee transactions totaling $${total.toFixed(0)}`,
              transactions: lcTxs.map(t => t.id),
              details: { count: lcTxs.length, total }
            });
          }
          return alerts;
        }
      },
      {
        id: 'TRADE-002', name: 'Misrepresented Goods/Services',
        category: 'TRADE_FINANCE', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          // Look for vague descriptions on trade payments
          const vagueTrade = txs.filter(t =>
            t.amount > 25000 && t.direction === 'DEBIT' &&
            /\b(goods|merchandise|products|services|consulting|advisory|management|commission|fee)\b/i.test(t.description) &&
            !/\b(specific|detailed|itemized|per contract|inv|invoice #)\b/i.test(t.description)
          );
          if (vagueTrade.length >= 3) {
            const total = vagueTrade.reduce((s, t) => s + t.amount, 0);
            alerts.push({
              ruleId: 'TRADE-002', category: 'TRADE_FINANCE', severity: 'HIGH',
              score: 30, message: `${vagueTrade.length} large payments with vague descriptions totaling $${total.toFixed(0)}`,
              transactions: vagueTrade.slice(0, 10).map(t => t.id),
              details: { count: vagueTrade.length, total }
            });
          }
          return alerts;
        }
      },

      // ===== SMURFING NETWORKS (SMURF) =====
      {
        id: 'SMURF-001', name: 'Multi-Account Deposit Coordination',
        category: 'SMURFING', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          const cashDeposits = txs.filter(t =>
            t.direction === 'CREDIT' && ['CASH','DEPOSIT'].includes(t.type) &&
            t.amount >= 5000 && t.amount < 10000
          ).sort((a, b) => a.date - b.date);
          if (cashDeposits.length >= 5) {
            // Check for coordination (deposits within same day across locations)
            const byDay = {};
            for (const t of cashDeposits) {
              const day = t.date.toISOString().slice(0, 10);
              (byDay[day] = byDay[day] || []).push(t);
            }
            for (const [day, group] of Object.entries(byDay)) {
              if (group.length >= 3) {
                const total = group.reduce((s, t) => s + t.amount, 0);
                alerts.push({
                  ruleId: 'SMURF-001', category: 'SMURFING', severity: 'CRITICAL',
                  score: 50, message: `${group.length} coordinated cash deposits on ${day} totaling $${total.toFixed(0)} — smurfing network`,
                  transactions: group.map(t => t.id),
                  details: { date: day, count: group.length, total }
                });
                break;
              }
            }
          }
          return alerts;
        }
      },
      {
        id: 'SMURF-002', name: 'Multiple Bank Aggregation',
        category: 'SMURFING', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          // Look for transfers from multiple external banks being consolidated
          const bankTransfers = txs.filter(t =>
            t.direction === 'CREDIT' && t.type === 'TRANSFER' && t.amount > 3000
          );
          const banks = new Set(bankTransfers.map(t => t.counterparty).filter(Boolean));
          if (banks.size >= 4 && bankTransfers.length >= 6) {
            const total = bankTransfers.reduce((s, t) => s + t.amount, 0);
            alerts.push({
              ruleId: 'SMURF-002', category: 'SMURFING', severity: 'HIGH',
              score: 40, message: `Transfers from ${banks.size} different sources consolidated — $${total.toFixed(0)}`,
              transactions: bankTransfers.slice(0, 10).map(t => t.id),
              details: { sourceCount: banks.size, total }
            });
          }
          return alerts;
        }
      },

      // ===== INVOICE FACTORING FRAUD (FACT) =====
      {
        id: 'FACT-001', name: 'Fictitious Invoice Factoring',
        category: 'INVOICE_FACTORING', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const factorPattern = /\b(factor|factoring|invoice financing|receivable|ar financing|invoice discount)\b/i;
          const factorTxs = txs.filter(t => factorPattern.test(t.counterparty) || factorPattern.test(t.description));
          if (factorTxs.length >= 2) {
            const credits = factorTxs.filter(t => t.direction === 'CREDIT');
            const total = credits.reduce((s, t) => s + t.amount, 0);
            if (total > 50000) {
              alerts.push({
                ruleId: 'FACT-001', category: 'INVOICE_FACTORING', severity: 'HIGH',
                score: 30, message: `$${total.toFixed(0)} from invoice factoring — verify underlying receivables exist`,
                transactions: factorTxs.map(t => t.id),
                details: { total, txCount: factorTxs.length }
              });
            }
          }
          return alerts;
        }
      },

      // ===== LAYERING TECHNIQUES (LAYER) =====
      {
        id: 'LAYER-001', name: 'Rapid Multi-Hop Transfers',
        category: 'LAYERING', severity: 'CRITICAL',
        detect: (txs) => {
          const alerts = [];
          const sorted = [...txs].sort((a, b) => a.date - b.date);
          let hops = 0;
          let hopAmount = 0;
          let hopTxs = [];
          for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];
            if (prev.direction === 'CREDIT' && curr.direction === 'DEBIT') {
              const gap = (curr.date - prev.date) / 3600000;
              const ratio = curr.amount / prev.amount;
              if (gap <= 24 && ratio >= 0.85 && ratio <= 1.0 && curr.amount > 5000) {
                hops++;
                hopAmount = Math.max(hopAmount, curr.amount);
                hopTxs.push(prev.id, curr.id);
              }
            }
          }
          if (hops >= 3) {
            alerts.push({
              ruleId: 'LAYER-001', category: 'LAYERING', severity: 'CRITICAL',
              score: 50, message: `${hops} rapid in-out transfer cycles (layering) — amounts up to $${hopAmount.toFixed(0)}`,
              transactions: [...new Set(hopTxs)].slice(0, 10),
              details: { hopCount: hops, maxAmount: hopAmount }
            });
          }
          return alerts;
        }
      },
      {
        id: 'LAYER-002', name: 'Complex Ownership Chain Payments',
        category: 'LAYERING', severity: 'HIGH',
        detect: (txs) => {
          const alerts = [];
          const genericNames = /\b(holdings|trading|consulting|services|international|global|ventures|capital|group|investment|enterprise|partners)\b/i;
          const chainTxs = txs.filter(t => genericNames.test(t.counterparty) && t.amount > 10000);
          const uniqueEntities = new Set(chainTxs.map(t => t.counterparty));
          if (uniqueEntities.size >= 4) {
            const total = chainTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
            alerts.push({
              ruleId: 'LAYER-002', category: 'LAYERING', severity: 'HIGH',
              score: 35, message: `Payments to ${uniqueEntities.size} generic-named entities totaling $${total.toFixed(0)} — ownership chain layering`,
              transactions: chainTxs.slice(0, 10).map(t => t.id),
              details: { entityCount: uniqueEntities.size, total }
            });
          }
          return alerts;
        }
      }
    ];
  }
}

module.exports = { TransactionMonitoringService };
