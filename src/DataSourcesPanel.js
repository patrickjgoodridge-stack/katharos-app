import React, { useState, useCallback } from 'react';
import { Database, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

const API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '';

const DataSourcesPanel = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/health-check`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSources(data.sources || []);
      setLastChecked(data.checkedAt);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  const connected = sources.filter(s => s.status === 'connected').length;
  const degraded = sources.filter(s => s.status === 'degraded').length;
  const disconnected = sources.filter(s => s.status === 'disconnected').length;

  const StatusIcon = ({ status }) => {
    if (status === 'connected') return <CheckCircle2 style={{ width: '16px', height: '16px', color: '#4caf50' }} />;
    if (status === 'degraded') return <AlertTriangle style={{ width: '16px', height: '16px', color: '#ff9800' }} />;
    return <XCircle style={{ width: '16px', height: '16px', color: '#f44336' }} />;
  };

  const statusColor = (status) => {
    if (status === 'connected') return '#4caf50';
    if (status === 'degraded') return '#ff9800';
    return '#f44336';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database style={{ width: '20px', height: '20px', color: '#2196f3' }} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>Data Sources</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {lastChecked && (
            <span style={{ fontSize: '12px', color: '#999', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock style={{ width: '12px', height: '12px' }} />
              Last checked: {new Date(lastChecked).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={checkHealth}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
              border: '1px solid #ddd', borderRadius: '6px', background: 'white', cursor: loading ? 'wait' : 'pointer',
              fontSize: '13px', color: '#555',
            }}
          >
            <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Checking...' : 'Check Health'}
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {sources.length > 0 && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', padding: '12px 16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 style={{ width: '14px', height: '14px', color: '#4caf50' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4caf50' }}>{connected} Connected</span>
          </div>
          {degraded > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle style={{ width: '14px', height: '14px', color: '#ff9800' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ff9800' }}>{degraded} Degraded</span>
            </div>
          )}
          {disconnected > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <XCircle style={{ width: '14px', height: '14px', color: '#f44336' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f44336' }}>{disconnected} Disconnected</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#fff5f5', border: '1px solid #ffcdd2', borderRadius: '8px', marginBottom: '16px', color: '#c62828', fontSize: '13px' }}>
          Failed to check health: {error}
        </div>
      )}

      {sources.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <Database style={{ width: '40px', height: '40px', color: '#ddd', marginBottom: '12px' }} />
          <p style={{ fontSize: '14px', marginBottom: '4px' }}>Click "Check Health" to test all data source connections</p>
          <p style={{ fontSize: '12px', color: '#bbb' }}>This will ping each API and report status</p>
        </div>
      )}

      {/* Source grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {sources.map(source => (
          <div key={source.id} style={{
            padding: '14px 16px', background: 'white', border: `1px solid ${statusColor(source.status)}30`,
            borderRadius: '8px', borderLeft: `3px solid ${statusColor(source.status)}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StatusIcon status={source.status} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{source.name}</span>
              </div>
              {source.responseTime != null && (
                <span style={{ fontSize: '11px', color: '#999', fontFamily: 'monospace' }}>{source.responseTime}ms</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
                color: statusColor(source.status),
              }}>
                {source.status}
              </span>
              {source.category && (
                <span style={{ fontSize: '10px', color: '#aaa', background: '#f5f5f5', padding: '1px 6px', borderRadius: '4px' }}>{source.category}</span>
              )}
            </div>
            {source.error && (
              <div style={{ fontSize: '11px', color: '#c62828', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {source.error}
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DataSourcesPanel;
