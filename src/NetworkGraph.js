// NetworkGraph.js - Reusable D3 Force-Directed Network Graph Component
import React, { useRef, useMemo, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

// Risk level color mapping
const RISK_COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#f43f5e',
  MEDIUM: '#374151',
  LOW: '#10b981',
  UNKNOWN: '#6b7280',
  SUBJECT: '#374151',
};

const getNodeColor = (node) => {
  if (node.sanctionStatus === 'MATCH' || node.sanctioned) return '#dc2626';
  return RISK_COLORS[node.riskLevel] || RISK_COLORS.UNKNOWN;
};

const getLinkColor = (link) => {
  if (link.sanctioned) return '#dc2626';
  if (link.isOwnership && link.strength >= 4) return '#374151';
  if (link.isOwnership) return '#06b6d4';
  if (link.ownershipPercent >= 50) return '#dc2626';
  if (link.ownershipPercent >= 25) return '#374151';
  return '#94a3b8';
};

/**
 * Build graph data from entities + relationships arrays (full network mode)
 */
const buildFullGraphData = (entities, relationships) => {
  const nodes = [];
  const links = [];
  const nodeIdMap = new Map();

  if (entities) {
    entities.forEach(entity => {
      nodes.push({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        riskLevel: entity.riskLevel || 'LOW',
        sanctionStatus: entity.sanctionStatus,
        role: entity.role,
      });
      nodeIdMap.set(entity.name?.toLowerCase(), entity.id);
    });
  }

  const validNodeIds = new Set(nodes.map(n => n.id));

  // Explicit relationships
  if (relationships) {
    relationships.forEach(rel => {
      const entity1 = rel.from || rel.entity1;
      const entity2 = rel.to || rel.entity2;
      const relType = rel.type || rel.relationshipType || 'connected to';

      let sourceId = validNodeIds.has(entity1) ? entity1 : nodeIdMap.get(entity1?.toLowerCase());
      let targetId = validNodeIds.has(entity2) ? entity2 : nodeIdMap.get(entity2?.toLowerCase());

      if (sourceId && targetId && validNodeIds.has(sourceId) && validNodeIds.has(targetId)) {
        links.push({
          source: sourceId,
          target: targetId,
          label: relType + (rel.percentage ? ` (${rel.percentage}%)` : ''),
          relationship: relType + (rel.percentage ? ` (${rel.percentage}%)` : ''),
          description: rel.description,
          strength: relType?.includes('owns') || relType?.includes('control') || rel.percentage >= 50 ? 3 : 1,
        });
      }
    });
  }

  // Implicit links from entity data
  if (entities) {
    entities.forEach(entity => {
      if (entity.ownedCompanies?.length > 0) {
        entity.ownedCompanies.forEach(company => {
          const targetId = nodeIdMap.get(company.company?.toLowerCase());
          if (targetId && validNodeIds.has(entity.id)) {
            links.push({
              source: entity.id,
              target: targetId,
              label: `owns ${company.ownershipPercent}%`,
              relationship: `owns ${company.ownershipPercent}%`,
              description: `Ownership: ${company.ownershipPercent}%`,
              strength: company.ownershipPercent >= 50 ? 4 : 2,
              isOwnership: true,
              ownershipPercent: company.ownershipPercent,
            });
          }
        });
      }

      if (entity.beneficialOwners?.length > 0) {
        entity.beneficialOwners.forEach(owner => {
          const sourceId = nodeIdMap.get(owner.name?.toLowerCase());
          if (sourceId && validNodeIds.has(entity.id)) {
            const pct = owner.ownershipPercent || owner.percent || 0;
            links.push({
              source: sourceId,
              target: entity.id,
              label: `owns ${pct}%`,
              relationship: `owns ${pct}%`,
              description: `Beneficial owner: ${pct}%`,
              strength: pct >= 50 ? 4 : 2,
              isOwnership: true,
              ownershipPercent: pct,
              sanctioned: owner.sanctionStatus === 'MATCH',
            });
          }
        });
      }

      if (entity.corporateNetwork?.length > 0) {
        entity.corporateNetwork.forEach(related => {
          const targetId = nodeIdMap.get(related.entity?.toLowerCase());
          if (targetId && validNodeIds.has(entity.id) && validNodeIds.has(targetId)) {
            links.push({
              source: entity.id,
              target: targetId,
              label: related.relationship || 'related to',
              relationship: related.relationship || 'related to',
              description: `Common owner: ${related.commonOwner || 'Unknown'}`,
              strength: related.sanctionExposure === 'DIRECT' ? 4 : 2,
              sanctioned: related.sanctionExposure === 'DIRECT',
            });
          }
        });
      }
    });
  }

  // Deduplicate links
  const linkMap = new Map();
  links.forEach(link => {
    const key = `${typeof link.source === 'object' ? link.source.id : link.source}-${typeof link.target === 'object' ? link.target.id : link.target}`;
    if (!linkMap.has(key) || link.strength > linkMap.get(key).strength) {
      linkMap.set(key, link);
    }
  });

  return { nodes, links: Array.from(linkMap.values()) };
};

/**
 * Build graph data for a single entity's ownership view
 */
const buildOwnershipGraphData = (centralEntity, ownedCompanies, beneficialOwners, corporateNetwork) => {
  const nodes = [];
  const links = [];
  const centralId = 'central';
  const isPerson = ownedCompanies && ownedCompanies.length > 0;

  nodes.push({
    id: centralId,
    name: centralEntity || 'Subject',
    type: isPerson ? 'PERSON' : 'ORGANIZATION',
    isCentral: true,
    riskLevel: 'SUBJECT',
  });

  if (ownedCompanies?.length > 0) {
    ownedCompanies.forEach((company, idx) => {
      const nodeId = `owned-${idx}`;
      nodes.push({
        id: nodeId,
        name: company.company,
        type: 'ORGANIZATION',
        ownershipPercent: company.ownershipPercent,
        sanctioned: company.sanctionedOwner,
        riskLevel: company.sanctionedOwner ? 'CRITICAL' :
                   company.ownershipPercent >= 50 ? 'HIGH' :
                   company.ownershipPercent >= 25 ? 'MEDIUM' : 'LOW',
      });
      links.push({
        source: centralId,
        target: nodeId,
        label: `${company.ownershipPercent}%`,
        ownershipPercent: company.ownershipPercent,
        ownershipType: company.ownershipType,
      });
    });
  }

  if (beneficialOwners?.length > 0) {
    beneficialOwners.forEach((owner, idx) => {
      const nodeId = `owner-${idx}`;
      const pct = owner.ownershipPercent || owner.percent || 0;
      nodes.push({
        id: nodeId,
        name: owner.name,
        type: 'PERSON',
        ownershipPercent: pct,
        sanctioned: owner.sanctionStatus === 'SANCTIONED',
        riskLevel: owner.sanctionStatus === 'SANCTIONED' ? 'CRITICAL' :
                   pct >= 50 ? 'HIGH' : pct >= 25 ? 'MEDIUM' : 'LOW',
      });
      links.push({
        source: nodeId,
        target: centralId,
        label: `${pct}%`,
        ownershipPercent: pct,
      });
    });
  }

  if (corporateNetwork?.length > 0) {
    corporateNetwork.forEach((related, idx) => {
      const nodeId = `corp-${idx}`;
      nodes.push({
        id: nodeId,
        name: related.entity,
        type: 'ORGANIZATION',
        relationship: related.relationship,
        sanctioned: related.sanctionExposure === 'DIRECT',
        riskLevel: related.sanctionExposure === 'DIRECT' ? 'CRITICAL' :
                   related.sanctionExposure === 'INDIRECT' ? 'HIGH' : 'LOW',
      });
      links.push({
        source: centralId,
        target: nodeId,
        label: related.relationship,
        relationship: related.relationship,
        ownershipPercent: related.ownershipPercent,
      });
    });
  }

  return { nodes, links };
};

/**
 * NetworkGraph - Reusable force-directed network graph component
 *
 * Full network mode (entities + relationships):
 *   <NetworkGraph entities={[]} relationships={[]} onNodeClick={fn} />
 *
 * Ownership mode (single entity):
 *   <NetworkGraph centralEntity="Name" ownedCompanies={[]} />
 */
const NetworkGraph = ({
  // Full network mode props
  entities,
  relationships,
  selectedEntityId,
  onNodeClick,
  // Ownership mode props
  centralEntity,
  ownedCompanies,
  beneficialOwners,
  corporateNetwork,
  // Common props
  height = 500,
  darkMode = false,
}) => {
  const graphRef = useRef();
  const [hoveredNode, setHoveredNode] = useState(null);

  // Determine mode
  const isOwnershipMode = !!centralEntity;

  const graphData = useMemo(() => {
    if (isOwnershipMode) {
      return buildOwnershipGraphData(centralEntity, ownedCompanies, beneficialOwners, corporateNetwork);
    }
    return buildFullGraphData(entities, relationships);
  }, [isOwnershipMode, centralEntity, ownedCompanies, beneficialOwners, corporateNetwork, entities, relationships]);

  // Count connections per node for sizing
  const connectionCounts = useMemo(() => {
    const counts = {};
    graphData.links.forEach(link => {
      const srcId = typeof link.source === 'object' ? link.source.id : link.source;
      const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
      counts[srcId] = (counts[srcId] || 0) + 1;
      counts[tgtId] = (counts[tgtId] || 0) + 1;
    });
    return counts;
  }, [graphData.links]);

  const handleNodeClick = useCallback((node) => {
    if (onNodeClick) {
      // In full mode, find the original entity object
      if (!isOwnershipMode && entities) {
        const entity = entities.find(e => e.id === node.id);
        if (entity) {
          onNodeClick(entity);
          return;
        }
      }
      onNodeClick(node);
    }
  }, [onNodeClick, isOwnershipMode, entities]);

  const bgColor = darkMode ? '#1f2937' : '#f9fafb';
  const labelColor = darkMode ? '#e5e7eb' : '#475569';
  const labelBoldColor = darkMode ? '#f9fafb' : '#0f172a';
  const linkLabelBg = darkMode ? '#374151' : '#f8fafc';

  // Don't render if insufficient data
  if (graphData.nodes.length <= 1 && isOwnershipMode) return null;
  if (graphData.nodes.length === 0) return null;

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`} style={{ height }}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={node => {
          const parts = [node.name];
          if (node.type) parts.push(node.type);
          if (node.riskLevel && node.riskLevel !== 'SUBJECT') parts.push(`Risk: ${node.riskLevel}`);
          if (node.sanctionStatus === 'MATCH') parts.push('SANCTIONED');
          if (node.ownershipPercent) parts.push(`${node.ownershipPercent}%`);
          return parts.join('\n');
        }}
        nodeColor={getNodeColor}
        nodeVal={node => {
          if (node.isCentral) return 12;
          const connections = connectionCounts[node.id] || 1;
          const baseSize = isOwnershipMode ? 8 : (
            node.sanctionStatus === 'MATCH' ? 6 :
            node.riskLevel === 'CRITICAL' ? 5 :
            node.riskLevel === 'HIGH' ? 4 :
            node.riskLevel === 'MEDIUM' ? 3 : 2
          );
          return baseSize + Math.min(connections, 5);
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const isSelected = selectedEntityId && node.id === selectedEntityId;
          const isHovered = hoveredNode === node.id;
          const connections = connectionCounts[node.id] || 1;

          // Calculate node radius based on connections
          let nodeRadius;
          if (node.isCentral) {
            nodeRadius = 12;
          } else if (isOwnershipMode) {
            nodeRadius = 8;
          } else {
            const baseRadius = node.sanctionStatus === 'MATCH' ? 5 :
              node.riskLevel === 'CRITICAL' ? 5 :
              node.riskLevel === 'HIGH' ? 4 :
              node.riskLevel === 'MEDIUM' ? 3.5 : 3;
            nodeRadius = baseRadius + Math.min(connections * 0.5, 3);
          }

          // Glow effect for selected/hovered nodes
          if (isSelected || isHovered) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeRadius + 4, 0, 2 * Math.PI);
            ctx.fillStyle = isSelected ? 'rgba(55, 65, 81, 0.25)' : 'rgba(55, 65, 81, 0.15)';
            ctx.fill();
          }

          // Draw node circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
          ctx.fillStyle = getNodeColor(node);
          ctx.fill();

          // Border for sanctioned or selected nodes
          if (node.sanctioned || node.sanctionStatus === 'MATCH') {
            ctx.strokeStyle = '#7f1d1d';
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
          } else if (isSelected) {
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
          }

          // Person icon
          if (node.type === 'PERSON') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(node.x, node.y - 2, 3 / globalScale, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(node.x, node.y + 4, 5 / globalScale, Math.PI, 0);
            ctx.fill();
          }

          // Building icon for organizations
          if (node.type === 'ORGANIZATION' && !node.isCentral) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(node.x - 3, node.y - 4, 6, 8);
          }

          // Label below node
          const fontSize = (node.isCentral ? 12 : 10) / globalScale;
          ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = node.isCentral ? labelBoldColor : labelColor;

          const maxLen = 18;
          const displayLabel = label.length > maxLen ? label.substring(0, maxLen) + '...' : label;
          ctx.fillText(displayLabel, node.x, node.y + nodeRadius + 4);
        }}
        linkColor={getLinkColor}
        linkWidth={link => {
          if (link.strength) return link.strength;
          if (link.ownershipPercent >= 50) return 3;
          if (link.ownershipPercent >= 25) return 2;
          return 1;
        }}
        linkDirectionalArrowLength={isOwnershipMode ? 6 : 4}
        linkDirectionalArrowRelPos={isOwnershipMode ? 0.9 : 1}
        linkDirectionalParticles={link => (link.strength >= 3 || link.ownershipPercent >= 50) ? 1 : 0}
        linkDirectionalParticleWidth={2}
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={(link, ctx, globalScale) => {
          const label = link.label || link.relationship;
          if (!label) return;
          const fontSize = 9 / globalScale;
          ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const midX = (link.source.x + link.target.x) / 2;
          const midY = (link.source.y + link.target.y) / 2;

          // Background
          const textWidth = ctx.measureText(label).width;
          ctx.fillStyle = linkLabelBg;
          ctx.fillRect(midX - textWidth / 2 - 2, midY - fontSize / 2 - 1, textWidth + 4, fontSize + 2);

          // Text
          ctx.fillStyle = (link.ownershipPercent >= 50 || link.sanctioned) ? '#dc2626' : '#64748b';
          ctx.fillText(label, midX, midY);
        }}
        linkLabel={link => link.relationship || link.description || ''}
        onNodeClick={handleNodeClick}
        onNodeHover={node => setHoveredNode(node ? node.id : null)}
        d3VelocityDecay={0.4}
        d3AlphaDecay={0.05}
        cooldownTime={1500}
        cooldownTicks={100}
        height={height}
        backgroundColor={bgColor}
        onEngineStop={() => {}}
      />
    </div>
  );
};

/**
 * NetworkGraphLegend - Color legend for the network graph
 */
export const NetworkGraphLegend = ({ darkMode = false }) => (
  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
    {[
      { color: 'bg-red-600', label: 'Critical Risk' },
      { color: 'bg-gray-600', label: 'High Risk' },
      { color: 'bg-gray-500', label: 'Medium Risk' },
      { color: 'bg-gray-400', label: 'Low Risk' },
    ].map(({ color, label }) => (
      <div key={label} className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
      </div>
    ))}
  </div>
);

export default NetworkGraph;
