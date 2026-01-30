// ChatNetworkGraph.js — D3 force-directed network graph for chat inline rendering
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { X, Download, Maximize2, Minimize2 } from 'lucide-react';

// Status colors
const STATUS_COLORS = {
  SANCTIONED: '#ef4444',
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  PEP: '#a855f7',
  DELISTED: '#f59e0b',
  LOW: '#22c55e',
  CLEAR: '#22c55e',
  UNKNOWN: '#64748b',
};

const getNodeColor = (entity) => {
  if (entity.sanctionStatus === 'SANCTIONED') return STATUS_COLORS.SANCTIONED;
  if (entity.sanctionStatus === 'PEP') return STATUS_COLORS.PEP;
  return STATUS_COLORS[entity.riskLevel] || STATUS_COLORS.UNKNOWN;
};

const getStatusLabel = (entity) => {
  if (entity.sanctionStatus === 'SANCTIONED') return 'SANCTIONED';
  if (entity.sanctionStatus === 'PEP') return 'PEP';
  if (entity.riskLevel) return entity.riskLevel;
  return 'UNKNOWN';
};

const getNodeRadius = (node, linkCount) => {
  const connections = linkCount[node.id] || 0;
  const base = node._isPrimary ? 32 : 18;
  return base + Math.min(connections * 3, 12);
};

const getNodeIcon = (type) => {
  if (!type) return '?';
  const t = type.toUpperCase();
  if (t === 'PERSON' || t === 'INDIVIDUAL') return '\u{1F464}';
  if (t === 'ORGANIZATION' || t === 'COMPANY') return '\u{1F3E2}';
  if (t === 'HOLDING') return '\u{1F3DB}';
  if (t === 'ASSET') return '\u{1F3ED}';
  return '\u{1F4C4}';
};

// Transform analysis entities/relationships into D3 graph data
function buildGraphData(entities, relationships) {
  if (!entities?.length) return { nodes: [], links: [] };

  const nodeMap = new Map();

  // Build nodes from entities
  entities.forEach((entity, idx) => {
    nodeMap.set(entity.id || `entity_${idx}`, {
      id: entity.id || `entity_${idx}`,
      name: entity.name,
      type: entity.type || 'UNKNOWN',
      status: getStatusLabel(entity),
      riskLevel: entity.riskLevel || 'UNKNOWN',
      sanctionStatus: entity.sanctionStatus || 'CLEAR',
      details: entity.description || entity.role || '',
      aliases: entity.aliases || [],
      ownedCompanies: entity.ownedCompanies || [],
      beneficialOwners: entity.beneficialOwners || [],
      corporateNetwork: entity.corporateNetwork || [],
      _isPrimary: idx === 0,
      _entity: entity,
    });
  });

  const links = [];
  const linkSet = new Set();

  // Build links from relationships
  if (relationships?.length) {
    relationships.forEach(rel => {
      const sourceId = rel.source || rel.from || rel.entity1;
      const targetId = rel.target || rel.to || rel.entity2;
      if (!sourceId || !targetId) return;
      const key = `${sourceId}->${targetId}`;
      if (linkSet.has(key)) return;
      linkSet.add(key);

      // Ensure nodes exist for relationship endpoints
      if (!nodeMap.has(sourceId)) {
        nodeMap.set(sourceId, {
          id: sourceId, name: sourceId, type: 'UNKNOWN', status: 'UNKNOWN',
          riskLevel: 'UNKNOWN', sanctionStatus: 'CLEAR', details: '', aliases: [],
          ownedCompanies: [], beneficialOwners: [], corporateNetwork: [], _isPrimary: false, _entity: null,
        });
      }
      if (!nodeMap.has(targetId)) {
        nodeMap.set(targetId, {
          id: targetId, name: targetId, type: 'UNKNOWN', status: 'UNKNOWN',
          riskLevel: 'UNKNOWN', sanctionStatus: 'CLEAR', details: '', aliases: [],
          ownedCompanies: [], beneficialOwners: [], corporateNetwork: [], _isPrimary: false, _entity: null,
        });
      }

      links.push({
        source: sourceId,
        target: targetId,
        relationship: rel.type || rel.relationship || 'RELATED',
        description: rel.description || '',
        ownership: rel.ownership || null,
      });
    });
  }

  // Build implicit links from entity properties
  entities.forEach(entity => {
    const entityId = entity.id || `entity_${entities.indexOf(entity)}`;

    // Owned companies
    (entity.ownedCompanies || []).forEach(company => {
      const compName = typeof company === 'string' ? company : company.name;
      if (!compName) return;
      let compId = null;
      for (const [id, node] of nodeMap) {
        if (node.name.toLowerCase() === compName.toLowerCase()) { compId = id; break; }
      }
      if (!compId) {
        compId = `owned_${compName.replace(/\s+/g, '_').toLowerCase()}`;
        nodeMap.set(compId, {
          id: compId, name: compName, type: 'ORGANIZATION', status: 'UNKNOWN',
          riskLevel: 'UNKNOWN', sanctionStatus: 'CLEAR', details: typeof company === 'object' ? company.role || '' : '',
          aliases: [], ownedCompanies: [], beneficialOwners: [], corporateNetwork: [], _isPrimary: false, _entity: null,
        });
      }
      const key = `${entityId}->${compId}`;
      if (!linkSet.has(key)) {
        linkSet.add(key);
        links.push({ source: entityId, target: compId, relationship: 'OWNERSHIP', description: 'Owns', ownership: typeof company === 'object' ? company.ownership : null });
      }
    });

    // Corporate network
    (entity.corporateNetwork || []).forEach(corp => {
      const corpName = typeof corp === 'string' ? corp : corp.name;
      if (!corpName) return;
      let corpId = null;
      for (const [id, node] of nodeMap) {
        if (node.name.toLowerCase() === corpName.toLowerCase()) { corpId = id; break; }
      }
      if (!corpId) {
        corpId = `corp_${corpName.replace(/\s+/g, '_').toLowerCase()}`;
        nodeMap.set(corpId, {
          id: corpId, name: corpName, type: 'ORGANIZATION', status: 'UNKNOWN',
          riskLevel: 'UNKNOWN', sanctionStatus: 'CLEAR', details: typeof corp === 'object' ? corp.role || '' : '',
          aliases: [], ownedCompanies: [], beneficialOwners: [], corporateNetwork: [], _isPrimary: false, _entity: null,
        });
      }
      const key = `${entityId}->${corpId}`;
      if (!linkSet.has(key)) {
        linkSet.add(key);
        links.push({ source: entityId, target: corpId, relationship: 'ASSOCIATE', description: typeof corp === 'object' ? corp.relationship || 'Corporate network' : 'Corporate network' });
      }
    });
  });

  return { nodes: Array.from(nodeMap.values()), links };
}

export default function ChatNetworkGraph({ entities, relationships, darkMode = false, onClose, onNodeClick }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const simulationRef = useRef(null);

  const graphData = React.useMemo(() => buildGraphData(entities, relationships), [entities, relationships]);

  // Count links per node for sizing
  const linkCount = React.useMemo(() => {
    const counts = {};
    graphData.links.forEach(l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source;
      const tid = typeof l.target === 'object' ? l.target.id : l.target;
      counts[sid] = (counts[sid] || 0) + 1;
      counts[tid] = (counts[tid] || 0) + 1;
    });
    return counts;
  }, [graphData]);

  const handleDownloadPng = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = darkMode ? '#0f172a' : '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = 'network-graph.png';
      a.click();
    };
    img.src = url;
  }, [darkMode]);

  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const container = containerRef.current;
    const width = container ? container.clientWidth - (selectedNode ? 320 : 0) : 800;
    const height = isFullscreen ? window.innerHeight - 120 : 500;

    const bgColor = darkMode ? '#0f172a' : '#f8fafc';
    const textColor = darkMode ? '#e2e8f0' : '#1e293b';
    const linkColor = darkMode ? '#475569' : '#94a3b8';
    const strokeColor = darkMode ? '#1e293b' : '#ffffff';

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height])
      .attr('width', width)
      .attr('height', height)
      .style('background', bgColor);

    // Zoom
    const g = svg.append('g');
    svg.call(d3.zoom().scaleExtent([0.3, 4]).on('zoom', (event) => {
      g.attr('transform', event.transform);
    }));

    // Arrow marker
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', linkColor);

    // Deep clone nodes/links so D3 doesn't mutate our data
    const nodes = graphData.nodes.map(d => ({ ...d }));
    const links = graphData.links.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => getNodeRadius(d, linkCount) + 15));

    simulationRef.current = simulation;

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', linkColor)
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrowhead)');

    // Link labels
    const linkLabel = g.append('g')
      .selectAll('text')
      .data(links)
      .join('text')
      .attr('font-size', '8px')
      .attr('fill', darkMode ? '#64748b' : '#94a3b8')
      .attr('text-anchor', 'middle')
      .text(d => d.ownership || d.description || d.relationship);

    // Node groups
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on('drag', (event) => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on('end', (event) => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }));

    // Node circles
    node.append('circle')
      .attr('r', d => getNodeRadius(d, linkCount))
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', strokeColor)
      .attr('stroke-width', 2.5)
      .on('mouseover', function (event, d) {
        setHoveredNode(d);
        d3.select(this).attr('stroke', '#fbbf24').attr('stroke-width', 3.5);
        // Highlight connected links
        link.attr('stroke-opacity', l =>
          (l.source.id || l.source) === d.id || (l.target.id || l.target) === d.id ? 1 : 0.15
        ).attr('stroke-width', l =>
          (l.source.id || l.source) === d.id || (l.target.id || l.target) === d.id ? 2.5 : 1
        );
      })
      .on('mouseout', function () {
        setHoveredNode(null);
        d3.select(this).attr('stroke', strokeColor).attr('stroke-width', 2.5);
        link.attr('stroke-opacity', 0.5).attr('stroke-width', 1.5);
      })
      .on('click', (event, d) => {
        setSelectedNode(d);
        if (onNodeClick) onNodeClick(d._entity || d);
      });

    // Node icons
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', d => d._isPrimary ? '14px' : '11px')
      .attr('pointer-events', 'none')
      .text(d => getNodeIcon(d.type));

    // Node labels
    node.append('text')
      .attr('dy', d => getNodeRadius(d, linkCount) + 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', d => d._isPrimary ? '11px' : '9px')
      .attr('font-weight', d => d._isPrimary ? 'bold' : 'normal')
      .attr('fill', textColor)
      .attr('pointer-events', 'none')
      .text(d => d.name.length > 22 ? d.name.substring(0, 20) + '...' : d.name);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      linkLabel
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2 - 6);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [graphData, linkCount, darkMode, isFullscreen, selectedNode, onNodeClick]);

  if (graphData.nodes.length === 0) return null;

  const bg = darkMode ? 'bg-slate-950' : 'bg-slate-50';
  const border = darkMode ? 'border-slate-800' : 'border-slate-200';
  const text = darkMode ? 'text-slate-200' : 'text-slate-800';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const panelBg = darkMode ? 'bg-slate-900' : 'bg-white';

  const connectedLinks = selectedNode
    ? graphData.links.filter(l => {
        const sid = typeof l.source === 'object' ? l.source.id : l.source;
        const tid = typeof l.target === 'object' ? l.target.id : l.target;
        return sid === selectedNode.id || tid === selectedNode.id;
      })
    : [];

  return (
    <div
      ref={containerRef}
      className={`${bg} border ${border} rounded-xl overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}
      style={!isFullscreen ? { height: 560 } : {}}
    >
      {/* Toolbar */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${border} ${panelBg}`}>
        <div className={`text-sm font-semibold ${text}`}>
          Network Graph
          <span className={`ml-2 text-xs font-normal ${textMuted}`}>
            {graphData.nodes.length} entities &middot; {graphData.links.length} connections
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleDownloadPng} className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 ${textMuted}`} title="Download PNG">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 ${textMuted}`} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {onClose && (
            <button onClick={onClose} className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 ${textMuted}`}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex" style={{ height: isFullscreen ? 'calc(100% - 80px)' : 500 }}>
        {/* Graph area */}
        <div className="flex-1 overflow-hidden">
          <svg ref={svgRef} />
        </div>

        {/* Side panel */}
        {selectedNode && (
          <div className={`w-72 border-l ${border} ${panelBg} overflow-y-auto p-4`} style={{ maxHeight: '100%' }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className={`text-xs ${textMuted} mb-1`}>SELECTED ENTITY</p>
                <p className={`font-bold text-base ${text}`}>{selectedNode.name}</p>
              </div>
              <button onClick={() => setSelectedNode(null)} className={`${textMuted} hover:${text} p-1`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Status badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  selectedNode.status === 'SANCTIONED' ? 'bg-red-500/20 text-red-500' :
                  selectedNode.status === 'PEP' ? 'bg-purple-500/20 text-purple-500' :
                  selectedNode.status === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                  selectedNode.status === 'HIGH' ? 'bg-orange-500/20 text-orange-500' :
                  selectedNode.status === 'MEDIUM' ? 'bg-amber-500/20 text-amber-600' :
                  selectedNode.status === 'LOW' || selectedNode.status === 'CLEAR' ? 'bg-emerald-500/20 text-emerald-500' :
                  'bg-slate-500/20 text-slate-500'
                }`}>
                  {selectedNode.status}
                </span>
                <span className={`text-xs ${textMuted} capitalize`}>{selectedNode.type?.toLowerCase()}</span>
              </div>

              {/* Details */}
              {selectedNode.details && (
                <p className={`text-sm ${textMuted} leading-relaxed`}>{selectedNode.details}</p>
              )}

              {/* Aliases */}
              {selectedNode.aliases?.length > 0 && (
                <div>
                  <p className={`text-xs ${textMuted} mb-1`}>ALIASES</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.aliases.map((a, i) => (
                      <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected entities */}
              {connectedLinks.length > 0 && (
                <div className={`pt-3 border-t ${border}`}>
                  <p className={`text-xs ${textMuted} mb-2`}>CONNECTIONS ({connectedLinks.length})</p>
                  <div className="space-y-1.5">
                    {connectedLinks.map((link, i) => {
                      const sid = typeof link.source === 'object' ? link.source.id : link.source;
                      const tid = typeof link.target === 'object' ? link.target.id : link.target;
                      const otherId = sid === selectedNode.id ? tid : sid;
                      const otherNode = graphData.nodes.find(n => n.id === otherId);
                      const direction = sid === selectedNode.id ? '\u2192' : '\u2190';
                      return (
                        <div key={i}
                          className={`flex items-center justify-between text-xs p-1.5 rounded cursor-pointer ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                          onClick={() => {
                            const found = graphData.nodes.find(n => n.id === otherId);
                            if (found) setSelectedNode(found);
                          }}
                        >
                          <span className={text}>
                            {direction} {otherNode?.name || otherId}
                          </span>
                          <span className={textMuted}>
                            {link.ownership || link.description || link.relationship}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Owned companies */}
              {selectedNode.ownedCompanies?.length > 0 && (
                <div className={`pt-3 border-t ${border}`}>
                  <p className={`text-xs ${textMuted} mb-2`}>OWNED COMPANIES</p>
                  <div className="space-y-1">
                    {selectedNode.ownedCompanies.map((c, i) => (
                      <div key={i} className={`text-xs ${text}`}>
                        {typeof c === 'string' ? c : `${c.name}${c.ownership ? ` (${c.ownership})` : ''}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className={`flex items-center gap-4 px-4 py-2 border-t ${border} ${panelBg} overflow-x-auto`}>
        {[
          { color: STATUS_COLORS.SANCTIONED, label: 'Sanctioned' },
          { color: STATUS_COLORS.PEP, label: 'PEP' },
          { color: STATUS_COLORS.HIGH, label: 'High Risk' },
          { color: STATUS_COLORS.MEDIUM, label: 'Medium' },
          { color: STATUS_COLORS.CLEAR, label: 'Clear / Low' },
          { color: STATUS_COLORS.UNKNOWN, label: 'Unknown' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 shrink-0">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className={`text-xs ${textMuted}`}>{item.label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <span className={`text-xs ${textMuted}`}>{getNodeIcon('PERSON')} Person</span>
          <span className={`text-xs ${textMuted}`}>{getNodeIcon('ORGANIZATION')} Company</span>
        </div>
      </div>
    </div>
  );
}
