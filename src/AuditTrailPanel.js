import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Filter, ChevronDown, Clock, User, Search, Printer } from 'lucide-react';
import { fetchAuditLogs } from './auditService';

const ACTION_LABELS = {
  screening_started: 'Screening Started',
  screening_completed: 'Screening Completed',
  case_created: 'Case Created',
  case_updated: 'Case Updated',
  case_deleted: 'Case Deleted',
  case_viewed: 'Case Viewed',
  report_generated: 'Report Generated',
  alert_acknowledged: 'Alert Acknowledged',
  alert_resolved: 'Alert Resolved',
  user_login: 'User Login',
  user_logout: 'User Logout',
  export_performed: 'Export Performed',
  match_confirmed: 'Match Confirmed',
  match_dismissed: 'Match Dismissed',
};

const ACTION_COLORS = {
  screening_started: '#2196f3',
  screening_completed: '#4caf50',
  case_created: '#9c27b0',
  case_updated: '#ff9800',
  case_deleted: '#f44336',
  case_viewed: '#607d8b',
  report_generated: '#00bcd4',
  alert_acknowledged: '#ff9800',
  alert_resolved: '#4caf50',
  user_login: '#2196f3',
  user_logout: '#9e9e9e',
  export_performed: '#795548',
  match_confirmed: '#4caf50',
  match_dismissed: '#f44336',
};

const formatTime = (ts) => {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  .audit-print-area, .audit-print-area * { visibility: visible !important; }
  .audit-print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .audit-no-print { display: none !important; }
  .audit-print-area table {
    width: 100% !important;
    font-size: 11px !important;
    border-collapse: collapse !important;
  }
  .audit-print-area th, .audit-print-area td {
    border: 1px solid #ccc !important;
    padding: 6px 8px !important;
    color: #000 !important;
  }
  .audit-print-area th { background: #f0f0f0 !important; }
  .audit-print-area tr { background: white !important; }
  .audit-print-area span { color: #000 !important; background: none !important; }
  .audit-print-header { display: block !important; }
  .audit-print-time { display: inline !important; }
}
`;

const AuditTrailPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ userEmail: '', action: '', dateFrom: '', dateTo: '' });
  const printRef = useRef(null);

  const loadLogs = useCallback(async (p = 1, f = filters) => {
    setLoading(true);
    const activeFilters = {};
    if (f.userEmail) activeFilters.userEmail = f.userEmail;
    if (f.action) activeFilters.action = f.action;
    if (f.dateFrom) activeFilters.dateFrom = new Date(f.dateFrom).toISOString();
    if (f.dateTo) activeFilters.dateTo = new Date(f.dateTo + 'T23:59:59').toISOString();

    const { data, count } = await fetchAuditLogs({ page: p, pageSize: 50, filters: activeFilters });
    if (p === 1) {
      setLogs(data);
    } else {
      setLogs(prev => [...prev, ...data]);
    }
    setTotal(count);
    setPage(p);
    setLoading(false);
  }, [filters]);

  useEffect(() => { loadLogs(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = () => { loadLogs(1, filters); };

  const handlePrint = () => { window.print(); };

  const formatTimeAbsolute = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div ref={printRef} className="audit-print-area" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <style>{PRINT_STYLES}</style>
      <div className="audit-print-header" style={{ display: 'none', marginBottom: '12px' }}>
        <h1 style={{ fontSize: '16px', margin: '0 0 4px 0' }}>Katharos Audit Trail</h1>
        <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Printed {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} &mdash; {logs.length} of {total} entries</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }} className="audit-no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield style={{ width: '20px', height: '20px', color: '#2196f3' }} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>Audit Trail</h2>
          <span style={{ fontSize: '12px', color: '#888', background: '#f0f0f0', padding: '2px 8px', borderRadius: '10px' }}>{total} entries</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid #ddd', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '13px', color: '#555' }}
            title="Print audit trail"
          >
            <Printer style={{ width: '14px', height: '14px' }} />
            Print
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid #ddd', borderRadius: '6px', background: showFilters ? '#f0f4ff' : 'white', cursor: 'pointer', fontSize: '13px', color: '#555' }}
          >
            <Filter style={{ width: '14px', height: '14px' }} />
            Filters
            <ChevronDown style={{ width: '12px', height: '12px', transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="audit-no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', padding: '14px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#666', marginBottom: '4px', display: 'block' }}>User</label>
            <input
              type="text" placeholder="Email..." value={filters.userEmail}
              onChange={e => setFilters(f => ({ ...f, userEmail: e.target.value }))}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#666', marginBottom: '4px', display: 'block' }}>Action</label>
            <select
              value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
            >
              <option value="">All actions</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#666', marginBottom: '4px', display: 'block' }}>From</label>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#666', marginBottom: '4px', display: 'block' }}>To</label>
            <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={applyFilters} style={{ padding: '6px 16px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Search style={{ width: '13px', height: '13px' }} /> Apply
            </button>
          </div>
        </div>
      )}

      <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase' }}>Time</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase' }}>User</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase' }}>Action</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase' }}>Entity</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '10px 12px', color: '#888', whiteSpace: 'nowrap' }}>
                  <div className="audit-no-print" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock style={{ width: '12px', height: '12px' }} />
                    {formatTime(log.created_at)}
                  </div>
                  <span className="audit-print-time" style={{ display: 'none' }}>{formatTimeAbsolute(log.created_at)}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User style={{ width: '12px', height: '12px', color: '#999' }} />
                    <span style={{ color: '#333' }}>{log.user_name || log.user_email}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                    background: (ACTION_COLORS[log.action] || '#9e9e9e') + '20',
                    color: ACTION_COLORS[log.action] || '#9e9e9e',
                  }}>
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', color: '#555' }}>
                  {log.entity_type && <span style={{ fontSize: '11px', color: '#888' }}>{log.entity_type}: </span>}
                  {log.entity_id ? log.entity_id.substring(0, 12) + (log.entity_id.length > 12 ? '...' : '') : '—'}
                </td>
                <td style={{ padding: '10px 12px', color: '#666', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.details && Object.keys(log.details).length > 0
                    ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')
                    : '—'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && !loading && (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No audit entries found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {loading && <div className="audit-no-print" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Loading...</div>}

      {logs.length < total && !loading && (
        <div className="audit-no-print" style={{ textAlign: 'center', marginTop: '16px' }}>
          <button onClick={() => loadLogs(page + 1)} style={{ padding: '8px 24px', border: '1px solid #ddd', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '13px', color: '#555' }}>
            Load More ({total - logs.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditTrailPanel;
