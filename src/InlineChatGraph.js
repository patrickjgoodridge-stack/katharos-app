import React, { useState, useCallback } from 'react';
import { Maximize2, Minimize2, Download, Network, Clock, ShieldAlert, UserSearch, Table2, LayoutDashboard, GitBranch, Globe, FileText, BarChart3 } from 'lucide-react';

const ICON_MAP = {
  network: Network,
  timeline: Clock,
  risk: ShieldAlert,
  screening: UserSearch,
  comparison: Table2,
  datatable: BarChart3,
  dashboard: LayoutDashboard,
  processflow: GitBranch,
  geomap: Globe,
  document: FileText,
};

const InlineChatGraph = ({ html, label = 'Network Graph', type = 'network', filename = 'visualization' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = ICON_MAP[type] || Network;

  const handleDownload = useCallback(() => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [html, filename]);

  return (
    <div style={{
      marginTop: '16px',
      marginBottom: '16px',
      borderRadius: '12px',
      border: '1px solid #2d2d2d',
      overflow: 'hidden',
      background: '#0a0a0a',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid #2d2d2d',
        background: '#111111',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon style={{ width: '14px', height: '14px', color: '#858585' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
            {label}
          </span>
          <span style={{ fontSize: '11px', color: '#6b6b6b' }}>Interactive</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handleDownload}
            style={{ padding: '5px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#a1a1a1' }}
            title="Download as HTML"
          >
            <Download style={{ width: '14px', height: '14px' }} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ padding: '5px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#a1a1a1' }}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded
              ? <Minimize2 style={{ width: '14px', height: '14px' }} />
              : <Maximize2 style={{ width: '14px', height: '14px' }} />}
          </button>
        </div>
      </div>
      <iframe
        srcDoc={html}
        sandbox="allow-scripts"
        style={{
          width: '100%',
          height: isExpanded ? 700 : 500,
          border: 'none',
          display: 'block',
          transition: 'height 0.3s ease',
        }}
        title={label}
      />
    </div>
  );
};

export default React.memo(InlineChatGraph);
