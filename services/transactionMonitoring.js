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
      CORRUPTION: 50, NETWORK: 50, FRAUD: 55
    };

    // Category weights (higher = more impactful on final score)
    const categoryWeights = {
      SANCTIONS_EVASION: 1.5, HUMAN_TRAFFICKING: 1.4, CORRUPTION: 1.3,
      CRYPTO: 1.2, STRUCTURING: 1.1, COUNTERPARTY: 1.1, TBML: 1.2,
      NETWORK: 1.2, FRAUD: 1.3
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
      }
    ];
  }
}

module.exports = { TransactionMonitoringService };
