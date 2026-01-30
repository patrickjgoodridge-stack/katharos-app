// MonitoringCenter.js - Real-time monitoring dashboard for Marlowe
import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Radio,
  RefreshCw,
  Shield,
  X,
  XCircle,
} from 'lucide-react';

// Relative time display
const timeAgo = (dateStr) => {
  if (!dateStr) return 'Never';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

// Risk level sort order
const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, UNKNOWN: 4 };

// Severity styling
const severityConfig = {
  critical: { dot: 'bg-red-500', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', darkBg: 'bg-red-900/30', darkBorder: 'border-red-800', darkText: 'text-red-300' },
  high: { dot: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', darkBg: 'bg-orange-900/30', darkBorder: 'border-orange-800', darkText: 'text-orange-300' },
  medium: { dot: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', darkBg: 'bg-amber-900/30', darkBorder: 'border-amber-800', darkText: 'text-amber-300' },
  low: { dot: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', darkBg: 'bg-blue-900/30', darkBorder: 'border-blue-800', darkText: 'text-blue-300' },
};

// Alert type labels and icons
const alertTypeConfig = {
  risk_change: { label: 'RISK CHANGE', icon: AlertTriangle, color: 'bg-orange-100 text-orange-700', darkColor: 'bg-orange-900/40 text-orange-300' },
  sanctions_hit: { label: 'SANCTIONS', icon: Shield, color: 'bg-red-100 text-red-700', darkColor: 'bg-red-900/40 text-red-300' },
  adverse_media: { label: 'ADVERSE MEDIA', icon: FileText, color: 'bg-purple-100 text-purple-700', darkColor: 'bg-purple-900/40 text-purple-300' },
  corporate_change: { label: 'CORPORATE', icon: Activity, color: 'bg-blue-100 text-blue-700', darkColor: 'bg-blue-900/40 text-blue-300' },
};

// Risk color utility (matches AppEnhanced pattern)
const getRiskColorLocal = (level) => {
  const l = (level || '').toUpperCase();
  if (l === 'CRITICAL') return 'bg-red-600/20 text-red-600';
  if (l === 'HIGH') return 'bg-orange-100 text-orange-700';
  if (l === 'MEDIUM') return 'bg-amber-100 text-amber-700';
  if (l === 'LOW') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-600';
};

const getRiskColorDark = (level) => {
  const l = (level || '').toUpperCase();
  if (l === 'CRITICAL') return 'bg-red-900/40 text-red-300';
  if (l === 'HIGH') return 'bg-orange-900/40 text-orange-300';
  if (l === 'MEDIUM') return 'bg-amber-900/40 text-amber-300';
  if (l === 'LOW') return 'bg-green-900/40 text-green-300';
  return 'bg-gray-700 text-gray-400';
};

// ─── Alert Detail Modal ───────────────────────────────────────────────
const AlertDetailModal = ({ alert, onClose, onAcknowledge, onResolve, onDismiss, onViewCase, darkMode }) => {
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolutionOutcome, setResolutionOutcome] = useState('confirmed_hit');
  const [resolutionNotes, setResolutionNotes] = useState('');

  if (!alert) return null;

  const severity = severityConfig[alert.severity || 'medium'] || severityConfig.medium;
  const typeConf = alertTypeConfig[alert.type || 'risk_change'] || alertTypeConfig.risk_change;
  const TypeIcon = typeConf.icon;

  const handleResolve = () => {
    onResolve(alert.id, alert.caseId, { outcome: resolutionOutcome, notes: resolutionNotes });
    setShowResolveForm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${severity.dot}`} />
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${darkMode ? typeConf.darkColor : typeConf.color}`}>
                <TypeIcon className="w-3 h-3 inline mr-1" />
                {typeConf.label}
              </span>
            </div>
            <button onClick={onClose} className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          <h3 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{alert.caseName}</h3>
          <p className={`text-xs mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(alert.timestamp).toLocaleString()}</p>

          {/* Risk change visualization */}
          {alert.previousRisk && alert.newRisk && (
            <div className="flex items-center gap-3 mb-5">
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${darkMode ? getRiskColorDark(alert.previousRisk) : getRiskColorLocal(alert.previousRisk)}`}>
                {alert.previousRisk}
              </span>
              <ArrowRight className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${darkMode ? getRiskColorDark(alert.newRisk) : getRiskColorLocal(alert.newRisk)}`}>
                {alert.newRisk}
              </span>
            </div>
          )}

          {/* Alert content */}
          <div className={`text-sm leading-relaxed mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {alert.fullText || alert.summary}
          </div>

          {/* Status */}
          {alert.status && alert.status !== 'new' && (
            <div className={`text-xs px-3 py-2 rounded-lg mb-4 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              Status: <span className="font-bold capitalize">{alert.status}</span>
              {alert.acknowledgedAt && <span className="ml-2">- Acknowledged {timeAgo(alert.acknowledgedAt)}</span>}
              {alert.resolvedAt && <span className="ml-2">- Resolved {timeAgo(alert.resolvedAt)}</span>}
              {alert.resolutionNotes && <p className="mt-1 italic">{alert.resolutionNotes}</p>}
            </div>
          )}

          {/* Resolution form */}
          {showResolveForm && (
            <div className={`p-4 rounded-lg border mb-4 ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Outcome</label>
              <select
                value={resolutionOutcome}
                onChange={(e) => setResolutionOutcome(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm mb-3 border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="confirmed_hit">Confirmed Hit</option>
                <option value="false_positive">False Positive</option>
                <option value="inconclusive">Inconclusive</option>
                <option value="no_action_required">No Action Required</option>
              </select>
              <label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Notes</label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Resolution notes..."
                rows={3}
                className={`w-full px-3 py-2 rounded-lg text-sm border resize-none ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
              <div className="flex gap-2 mt-3">
                <button onClick={handleResolve} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg">
                  Resolve
                </button>
                <button onClick={() => setShowResolveForm(false)} className={`px-4 py-2 text-sm font-medium rounded-lg ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`px-6 py-4 border-t flex items-center gap-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {(!alert.status || alert.status === 'new') && (
            <button
              onClick={() => { onAcknowledge(alert.id, alert.caseId); onClose(); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
            >
              <Check className="w-3.5 h-3.5" /> Acknowledge
            </button>
          )}
          {alert.status !== 'resolved' && alert.status !== 'dismissed' && (
            <button
              onClick={() => setShowResolveForm(true)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg ${darkMode ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
            >
              <Check className="w-3.5 h-3.5" /> Resolve
            </button>
          )}
          <button
            onClick={() => { onViewCase(alert.caseId); onClose(); }}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg ${darkMode ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-gray-900'}`}
          >
            <Eye className="w-3.5 h-3.5" /> View Case
          </button>
          {alert.status !== 'dismissed' && alert.status !== 'resolved' && (
            <button
              onClick={() => { onDismiss(alert.id, alert.caseId); onClose(); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg ml-auto ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <XCircle className="w-3.5 h-3.5" /> Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main MonitoringCenter Component ──────────────────────────────────
const MonitoringCenter = ({
  cases,
  allMonitoringAlerts,
  unreadAlertCount,
  monitoringInProgress,
  onToggleMonitoring,
  onRescreen,
  onViewCase,
  onAcknowledgeAlert,
  onResolveAlert,
  onDismissAlert,
  onGoHome,
  darkMode,
}) => {
  const [filter, setFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [sortBy, setSortBy] = useState('risk'); // 'risk', 'lastScreened', 'alerts'
  const [showCount, setShowCount] = useState(20);

  // Monitored cases
  const monitoredCases = useMemo(() => {
    return cases.filter(c => c.monitoringEnabled);
  }, [cases]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return allMonitoringAlerts;
    return allMonitoringAlerts.filter(a => (a.type || 'risk_change') === filter);
  }, [allMonitoringAlerts, filter]);

  const displayedAlerts = filteredAlerts.slice(0, showCount);

  // Stats
  const stats = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const COOLDOWN_HOURS = 24;

    const recentAlerts = allMonitoringAlerts.filter(a => new Date(a.timestamp).getTime() > sevenDaysAgo);
    const todayAlerts = allMonitoringAlerts.filter(a => new Date(a.timestamp).getTime() > todayStart.getTime());

    const byRisk = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    let rescreensDue = 0;
    let lastRun = null;

    for (const c of monitoredCases) {
      const r = (c.riskLevel || 'UNKNOWN').toUpperCase();
      if (byRisk[r] !== undefined) byRisk[r]++;
      if (c.monitoringLastRun) {
        const runTime = new Date(c.monitoringLastRun).getTime();
        if (!lastRun || runTime > lastRun) lastRun = runTime;
        const hoursSince = (now - runTime) / (1000 * 60 * 60);
        if (hoursSince >= COOLDOWN_HOURS) rescreensDue++;
      } else {
        rescreensDue++;
      }
    }

    const resolved = recentAlerts.filter(a => a.status === 'resolved').length;

    return {
      total: monitoredCases.length,
      byRisk,
      rescreensDue,
      alertsToday: todayAlerts.length,
      lastRun,
      weeklyTotal: recentAlerts.length,
      weeklyResolved: resolved,
      resolutionRate: recentAlerts.length > 0 ? Math.round((resolved / recentAlerts.length) * 100) : 0,
    };
  }, [monitoredCases, allMonitoringAlerts]);

  // Sorted watchlist
  const sortedWatchlist = useMemo(() => {
    const list = [...monitoredCases];
    if (sortBy === 'risk') {
      list.sort((a, b) => (riskOrder[a.riskLevel] || 4) - (riskOrder[b.riskLevel] || 4));
    } else if (sortBy === 'lastScreened') {
      list.sort((a, b) => {
        const aT = a.monitoringLastRun ? new Date(a.monitoringLastRun).getTime() : 0;
        const bT = b.monitoringLastRun ? new Date(b.monitoringLastRun).getTime() : 0;
        return aT - bT; // oldest first (most overdue)
      });
    } else if (sortBy === 'alerts') {
      list.sort((a, b) => (b.monitoringAlerts || []).length - (a.monitoringAlerts || []).length);
    }
    return list;
  }, [monitoredCases, sortBy]);

  // Simulated feed statuses
  const feedStatuses = useMemo(() => {
    const lastRun = stats.lastRun;
    return [
      { name: 'OFAC SDN', lastChecked: lastRun, status: 'ok' },
      { name: 'OFAC Consolidated', lastChecked: lastRun, status: 'ok' },
      { name: 'EU Consolidated', lastChecked: lastRun ? lastRun - 3600000 : null, status: 'ok' },
      { name: 'UN Consolidated', lastChecked: lastRun ? lastRun - 7200000 : null, status: 'ok' },
      { name: 'UK OFSI', lastChecked: lastRun ? lastRun - 3600000 : null, status: 'ok' },
    ];
  }, [stats.lastRun]);

  const filterOptions = [
    { id: 'all', label: 'All Alerts' },
    { id: 'risk_change', label: 'Risk Changes' },
    { id: 'sanctions_hit', label: 'Sanctions Hits' },
    { id: 'adverse_media', label: 'Adverse Media' },
    { id: 'corporate_change', label: 'Corporate Changes' },
  ];

  const bg = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const cardBorder = darkMode ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const textMuted = darkMode ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className={`min-h-screen ${bg} px-6 py-8 lg:px-12`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onGoHome} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`}>
            <X className={`w-5 h-5 ${textSecondary}`} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <Radio className={`w-6 h-6 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              <h1 className={`text-2xl font-bold tracking-tight ${textPrimary}`}>Monitoring Center</h1>
            </div>
            <p className={`text-sm mt-1 ${textSecondary}`}>Real-time compliance monitoring across all watched entities</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {unreadAlertCount > 0 && (
            <span className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-full">
              <Bell className="w-4 h-4" /> {unreadAlertCount} Unread
            </span>
          )}
          <button
            onClick={() => onRescreen(monitoredCases)}
            disabled={monitoringInProgress || monitoredCases.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {monitoringInProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {monitoringInProgress ? 'Screening...' : 'Re-screen All'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Watchlist Status */}
        <div className={`${cardBg} border ${cardBorder} rounded-xl p-5`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${textSecondary}`}>Watchlist Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={`text-sm ${textSecondary}`}>Total monitored</span>
              <span className={`text-sm font-bold ${textPrimary}`}>{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${textSecondary}`}>Critical risk</span>
              <span className="text-sm font-bold text-red-500">{stats.byRisk.CRITICAL}</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${textSecondary}`}>High risk</span>
              <span className="text-sm font-bold text-orange-500">{stats.byRisk.HIGH}</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${textSecondary}`}>Rescreens due</span>
              <span className={`text-sm font-bold ${stats.rescreensDue > 0 ? 'text-amber-500' : textPrimary}`}>{stats.rescreensDue}</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${textSecondary}`}>Alerts today</span>
              <span className={`text-sm font-bold ${textPrimary}`}>{stats.alertsToday}</span>
            </div>
          </div>
        </div>

        {/* Sanctions Feed Status */}
        <div className={`${cardBg} border ${cardBorder} rounded-xl p-5`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${textSecondary}`}>Sanctions Feeds</h3>
          <div className="space-y-2">
            {feedStatuses.map((feed, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>{feed.name}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${feed.lastChecked ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className={`text-xs ${textMuted}`}>{feed.lastChecked ? timeAgo(new Date(feed.lastChecked).toISOString()) : 'Pending'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7-Day Summary */}
        <div className={`${cardBg} border ${cardBorder} rounded-xl p-5`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${textSecondary}`}>Last 7 Days</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={`text-sm ${textSecondary}`}>Total alerts</span>
              <span className={`text-sm font-bold ${textPrimary}`}>{stats.weeklyTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${textSecondary}`}>Resolved</span>
              <span className="text-sm font-bold text-green-500">{stats.weeklyResolved}</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${textSecondary}`}>Unresolved</span>
              <span className={`text-sm font-bold ${stats.weeklyTotal - stats.weeklyResolved > 0 ? 'text-amber-500' : textPrimary}`}>{stats.weeklyTotal - stats.weeklyResolved}</span>
            </div>
            <div className={`pt-2 mt-2 border-t ${cardBorder}`}>
              <div className="flex justify-between">
                <span className={`text-sm ${textSecondary}`}>Resolution rate</span>
                <span className={`text-sm font-bold ${stats.resolutionRate >= 80 ? 'text-green-500' : stats.resolutionRate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                  {stats.resolutionRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Feed */}
      <div className={`${cardBg} border ${cardBorder} rounded-xl mb-8`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${cardBorder}`}>
          <div className="flex items-center gap-3">
            <Activity className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <h2 className={`text-lg font-bold ${textPrimary}`}>Live Feed</h2>
            <span className={`text-xs ${textMuted}`}>{filteredAlerts.length} alerts</span>
          </div>
          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              {filterOptions.find(f => f.id === filter)?.label || 'All'}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showFilterMenu && (
              <div className={`absolute right-0 top-full mt-1 w-44 rounded-lg border shadow-lg z-10 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                {filterOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setFilter(opt.id); setShowFilterMenu(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm ${filter === opt.id ? (darkMode ? 'bg-gray-700 text-amber-400' : 'bg-amber-50 text-amber-700') : (darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50')}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alert list */}
        <div className="divide-y divide-gray-100">
          {monitoringInProgress && (
            <div className={`flex items-center gap-3 px-6 py-4 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <Loader2 className={`w-4 h-4 animate-spin ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Re-screening monitored entities...</span>
            </div>
          )}

          {displayedAlerts.length === 0 && !monitoringInProgress && (
            <div className={`text-center py-16 ${textMuted}`}>
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No alerts</p>
              <p className="text-xs mt-1">Enable monitoring on cases to receive alerts when risk levels change.</p>
            </div>
          )}

          {displayedAlerts.map(alert => {
            const severity = severityConfig[alert.severity || 'medium'] || severityConfig.medium;
            const typeConf = alertTypeConfig[alert.type || 'risk_change'] || alertTypeConfig.risk_change;
            const isResolved = alert.status === 'resolved' || alert.status === 'dismissed';

            return (
              <div
                key={alert.id}
                className={`px-6 py-4 flex items-start gap-4 ${isResolved ? 'opacity-50' : ''} ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${severity.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${textMuted}`}>{timeAgo(alert.timestamp)}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${darkMode ? typeConf.darkColor : typeConf.color}`}>
                      {typeConf.label}
                    </span>
                    {alert.status && alert.status !== 'new' && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                        {alert.status}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm font-semibold mb-0.5 ${textPrimary}`}>{alert.caseName}</p>
                  {alert.previousRisk && alert.newRisk && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${darkMode ? getRiskColorDark(alert.previousRisk) : getRiskColorLocal(alert.previousRisk)}`}>{alert.previousRisk}</span>
                      <ArrowRight className={`w-3 h-3 ${textMuted}`} />
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${darkMode ? getRiskColorDark(alert.newRisk) : getRiskColorLocal(alert.newRisk)}`}>{alert.newRisk}</span>
                    </div>
                  )}
                  <p className={`text-xs line-clamp-2 ${textSecondary}`}>{alert.summary}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {(!alert.status || alert.status === 'new') && (
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id, alert.caseId)}
                      className={`p-1.5 rounded-lg text-xs ${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                      title="Acknowledge"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onViewCase(alert.caseId)}
                    className={`p-1.5 rounded-lg text-xs ${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                    title="View Case"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAlerts.length > showCount && (
          <div className={`px-6 py-3 border-t ${cardBorder} text-center`}>
            <button
              onClick={() => setShowCount(s => s + 20)}
              className={`text-sm font-medium ${darkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-500'}`}
            >
              Load more ({filteredAlerts.length - showCount} remaining)
            </button>
          </div>
        )}
      </div>

      {/* Monitored Entities Table */}
      <div className={`${cardBg} border ${cardBorder} rounded-xl`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${cardBorder}`}>
          <div className="flex items-center gap-3">
            <Shield className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <h2 className={`text-lg font-bold ${textPrimary}`}>Monitored Entities</h2>
            <span className={`text-xs ${textMuted}`}>{monitoredCases.length} entities</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${textMuted}`}>Sort:</span>
            {[{ id: 'risk', label: 'Risk' }, { id: 'lastScreened', label: 'Last Screened' }, { id: 'alerts', label: 'Alerts' }].map(s => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={`text-xs px-2 py-1 rounded ${sortBy === s.id ? (darkMode ? 'bg-amber-600/30 text-amber-400' : 'bg-amber-100 text-amber-700') : (darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {monitoredCases.length === 0 ? (
          <div className={`text-center py-16 ${textMuted}`}>
            <EyeOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No entities being monitored</p>
            <p className="text-xs mt-1">Enable monitoring on a case from the Case Management page to start tracking changes.</p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className={`grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold uppercase tracking-wider ${textMuted} border-b ${cardBorder}`}>
              <div className="col-span-4">Entity</div>
              <div className="col-span-2">Risk Level</div>
              <div className="col-span-2">Last Screened</div>
              <div className="col-span-1">Alerts</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>

            {/* Table rows */}
            {sortedWatchlist.map((caseItem, i) => {
              const alertCount = (caseItem.monitoringAlerts || []).length;
              const unreadCount = (caseItem.monitoringAlerts || []).filter(a => !a.read).length;
              return (
                <div
                  key={caseItem.id}
                  className={`grid grid-cols-12 gap-4 px-6 py-3 items-center ${i % 2 === 0 ? '' : (darkMode ? 'bg-gray-700/20' : 'bg-gray-50/50')} ${darkMode ? 'hover:bg-gray-700/40' : 'hover:bg-gray-100'} transition-colors`}
                >
                  <div className="col-span-4">
                    <p className={`text-sm font-semibold truncate ${textPrimary}`}>{caseItem.name}</p>
                    <p className={`text-xs ${textMuted}`}>{caseItem.files?.length || 0} docs</p>
                  </div>
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${darkMode ? getRiskColorDark(caseItem.riskLevel) : getRiskColorLocal(caseItem.riskLevel)}`}>
                      {caseItem.riskLevel || 'UNKNOWN'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-xs ${textSecondary}`}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {timeAgo(caseItem.monitoringLastRun)}
                    </span>
                  </div>
                  <div className="col-span-1">
                    {alertCount > 0 ? (
                      <span className="flex items-center gap-1">
                        <span className={`text-xs font-bold ${textPrimary}`}>{alertCount}</span>
                        {unreadCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                        )}
                      </span>
                    ) : (
                      <span className={`text-xs ${textMuted}`}>0</span>
                    )}
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onRescreen([caseItem])}
                      disabled={monitoringInProgress}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} disabled:opacity-50`}
                      title="Re-screen now"
                    >
                      <RefreshCw className="w-3 h-3 inline mr-1" />
                      Re-screen
                    </button>
                    <button
                      onClick={() => onViewCase(caseItem.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium ${darkMode ? 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-300' : 'bg-amber-100 hover:bg-amber-200 text-amber-700'}`}
                    >
                      View
                    </button>
                    <button
                      onClick={() => onToggleMonitoring(caseItem.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium ${darkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                      title="Stop monitoring"
                    >
                      <EyeOff className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={onAcknowledgeAlert}
          onResolve={onResolveAlert}
          onDismiss={onDismissAlert}
          onViewCase={onViewCase}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default MonitoringCenter;
