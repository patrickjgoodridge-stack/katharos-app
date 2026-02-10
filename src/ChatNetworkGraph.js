// ChatNetworkGraph.js — Interactive D3 force-directed network graph for entity relationships
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { X, Download, Maximize2, Minimize2, Tag, EyeOff, RotateCcw, ArrowLeft } from 'lucide-react';

// ─── Node type colors ───
const NODE_COLORS = {
  entity: '#ef4444',
  individual: '#f59e0b',
  vessel: '#3b82f6',
  prior_designee: '#8b5cf6',
  country: '#22c55e',
};

// ─── Link type colors ───
const LINK_COLORS = {
  manages: '#ef4444',
  owns: '#ef4444',
  director: '#c2410c',
  traded_with: '#8b5cf6',
  transports: '#06b6d4',
  related: '#6b7280',
};

// ─── Link type labels ───
const LINK_LABELS = {
  manages: 'Manages / Owns',
  owns: 'Manages / Owns',
  director: 'Director / Manager',
  traded_with: 'Traded With',
  transports: 'Transports From',
  related: 'Related',
};

const getNodeRadius = (node) => {
  if (node.type === 'country') return 28;
  if (node._connections > 4) return 22;
  if (node._connections > 2) return 18;
  return 14;
};

const getNodeColor = (node) => NODE_COLORS[node.type] || '#6b7280';
const getLinkColor = (link) => LINK_COLORS[link.type] || '#6b7280';


/**
 * Classify entity type string → graph node type
 */
function classifyEntityType(typeStr) {
  const t = (typeStr || '').toUpperCase();
  if (t.includes('PERSON') || t.includes('INDIVIDUAL')) return 'individual';
  if (t.includes('VESSEL') || t.includes('SHIP') || t.includes('TANKER')) return 'vessel';
  if (t.includes('COUNTRY') || t.includes('JURISDICTION') || t.includes('STATE')) return 'country';
  return 'entity';
}

/**
 * Classify relationship string → link type
 */
function classifyLinkType(relStr) {
  const r = (relStr || '').toLowerCase();
  if (r.includes('own') || r.includes('manag') || r.includes('control') || r.includes('parent') || r.includes('subsidiary') || r.includes('beneficial')) return 'manages';
  if (r.includes('director') || r.includes('officer') || r.includes('ceo') || r.includes('board') || r.includes('employ')) return 'director';
  if (r.includes('trade') || r.includes('transaction') || r.includes('business') || r.includes('financial') || r.includes('transfer')) return 'traded_with';
  if (r.includes('transport') || r.includes('ship') || r.includes('vessel')) return 'transports';
  return 'related';
}

/**
 * Extract graph data from the full analysis object.
 * Parses: entities[] (with ownedCompanies, beneficialOwners, corporateNetwork, connections),
 *         relationships[] (entity1/entity2 or source/target format)
 * Always returns { nodes, links } — never null, never sample data.
 */
export function extractGraphData(analysis) {
  if (!analysis) return { nodes: [], links: [] };

  const nodes = [];
  const links = [];
  const nodeMap = new Map();
  const linkKeys = new Set();

  const addNode = (id, name, type, metadata = {}) => {
    const cleanId = String(id).trim();
    if (!cleanId || nodeMap.has(cleanId)) return cleanId;
    const node = { id: cleanId, name: name || cleanId, type, metadata };
    nodeMap.set(cleanId, node);
    nodes.push(node);
    return cleanId;
  };

  const addLink = (sourceId, targetId, type, label) => {
    const s = String(sourceId).trim();
    const t = String(targetId).trim();
    if (!s || !t || s === t) return;
    const key = `${s}->${t}:${type}`;
    if (linkKeys.has(key)) return;
    linkKeys.add(key);
    links.push({ source: s, target: t, type, label: label || '' });
  };

  // Name→ID lookup for resolving relationships
  const entityNameToId = new Map();

  // ─── 1. Parse entities ───
  if (analysis.entities?.length) {
    analysis.entities.forEach((entity, idx) => {
      const id = entity.id || `entity_${idx}`;
      const name = entity.name || 'Unknown';
      const nodeType = classifyEntityType(entity.type);
      const isSanctioned = entity.sanctionStatus === 'MATCH' || entity.riskLevel === 'CRITICAL';

      addNode(id, name, nodeType, {
        ...(entity.role ? { role: entity.role } : {}),
        ...(entity.riskLevel ? { risk_level: entity.riskLevel } : {}),
        ...(entity.sanctionStatus && entity.sanctionStatus !== 'CLEAR' ? { sanction_status: entity.sanctionStatus } : {}),
        ...(entity.sanctionDetails?.programs?.length ? { sanctions_program: entity.sanctionDetails.programs.join(', ') } : {}),
        ...(entity.sanctionDetails?.listingDate ? { designation_date: entity.sanctionDetails.listingDate } : {}),
        ...(entity.jurisdiction || entity.country ? { jurisdiction: entity.jurisdiction || entity.country } : {}),
        ...(isSanctioned ? { sanctioned: 'YES' } : {}),
      });

      entityNameToId.set(name.toLowerCase(), id);

      // ─── Owned companies ───
      (entity.ownedCompanies || []).forEach((co, ci) => {
        const coName = co.company || co.name || 'Unknown Company';
        const coId = addNode(`owned_${id}_${ci}`, coName, 'entity', {
          ...(co.jurisdiction ? { jurisdiction: co.jurisdiction } : {}),
          ...(co.ownershipType ? { ownership_type: co.ownershipType } : {}),
          ...(co.ownershipPercent ? { ownership_percent: `${co.ownershipPercent}%` } : {}),
        });
        addLink(id, coId, 'manages', co.ownershipPercent ? `Owns (${co.ownershipPercent}%)` : 'Owns');
      });

      // ─── Beneficial owners ───
      (entity.beneficialOwners || []).forEach((bo, bi) => {
        const boName = bo.name || 'Unknown Owner';
        const pct = bo.ownershipPercent || bo.percent;
        const boId = addNode(`bo_${id}_${bi}`, boName, 'individual', {
          ...(pct ? { ownership_percent: `${pct}%` } : {}),
          ...(bo.sanctionStatus ? { sanction_status: bo.sanctionStatus } : {}),
        });
        addLink(boId, id, 'manages', pct ? `Beneficial Owner (${pct}%)` : 'Beneficial Owner');
      });

      // ─── Corporate network ───
      (entity.corporateNetwork || []).forEach((cn, ci) => {
        const cnName = cn.entity || cn.name || 'Unknown';
        const cnId = addNode(`corp_${id}_${ci}`, cnName, 'entity', {
          ...(cn.jurisdiction ? { jurisdiction: cn.jurisdiction } : {}),
          ...(cn.sanctionExposure ? { sanction_exposure: cn.sanctionExposure } : {}),
        });
        addLink(id, cnId, classifyLinkType(cn.relationship), cn.relationship || '');
      });
    });

    // ─── Resolve entity.connections[] references ───
    analysis.entities.forEach((entity, idx) => {
      const id = entity.id || `entity_${idx}`;
      (entity.connections || []).forEach(connId => {
        const connStr = String(connId).trim();
        if (nodeMap.has(connStr) && connStr !== id) {
          addLink(id, connStr, 'related', '');
        }
      });
    });
  }

  // ─── 2. Parse relationships[] ───
  if (analysis.relationships?.length) {
    analysis.relationships.forEach((rel, ri) => {
      const rawSource = rel.entity1 || rel.source || rel.from;
      const rawTarget = rel.entity2 || rel.target || rel.to;
      if (!rawSource || !rawTarget) return;

      const sourceStr = String(rawSource).trim();
      const targetStr = String(rawTarget).trim();

      // Resolve by ID first, then by name
      let sourceId = nodeMap.has(sourceStr) ? sourceStr : entityNameToId.get(sourceStr.toLowerCase());
      let targetId = nodeMap.has(targetStr) ? targetStr : entityNameToId.get(targetStr.toLowerCase());

      // Create nodes for unresolved references
      if (!sourceId) sourceId = addNode(`rel_src_${ri}`, sourceStr, 'entity');
      if (!targetId) targetId = addNode(`rel_tgt_${ri}`, targetStr, 'entity');

      const relTypeStr = rel.relationshipType || rel.type || rel.relationship || '';
      const pct = rel.percentage ? ` (${rel.percentage}%)` : rel.ownership ? ` ${rel.ownership}` : '';
      addLink(sourceId, targetId, classifyLinkType(relTypeStr), (rel.description || relTypeStr) + pct);
    });
  }

  // ─── 3. Single entity: add jurisdiction as a connection ───
  if (nodes.length === 1 && nodes[0].metadata?.jurisdiction) {
    const subj = nodes[0];
    addNode('jurisdiction_0', subj.metadata.jurisdiction, 'country', { jurisdiction: subj.metadata.jurisdiction });
    addLink(subj.id, 'jurisdiction_0', 'related', 'Jurisdiction');
  }

  return { nodes, links };
}

/**
 * Build graph data from a KYC screening result (kycResults from /api/screening/unified).
 * Comprehensively parses ALL structured fields: subject, sanctions, ownership, PEP, ICIJ,
 * court records, adverse media, risk factors, and recommendations.
 * Always returns { nodes, links } — never null.
 */
export function buildGraphFromScreeningResult(result) {
  if (!result) return { nodes: [], links: [] };

  const nodes = [];
  const links = [];
  const nodeIds = new Set();
  const linkKeys = new Set();
  const addedNames = new Set(); // Track names to avoid duplicates across sections

  const addNode = (id, name, type, metadata = {}) => {
    if (!id || nodeIds.has(id)) return id;
    nodeIds.add(id);
    nodes.push({ id, name: name || id, type, metadata });
    if (name) addedNames.add(name.toLowerCase());
    return id;
  };

  const addLink = (source, target, type, label = '') => {
    if (!source || !target || source === target) return;
    const key = `${source}->${target}:${type}`;
    if (linkKeys.has(key)) return;
    linkKeys.add(key);
    links.push({ source, target, type, label });
  };

  // Robust subject matching — handles "PUTIN, Vladimir Vladimirovich" vs "Vladimir Putin"
  const subjectName = result.subject?.name || '';
  const subjectLower = subjectName.toLowerCase();
  const subjectParts = subjectLower.split(/[\s,]+/).filter(p => p.length > 2);
  const isSubjectName = (name) => {
    if (!name || !subjectName) return false;
    const nl = name.toLowerCase().trim();
    if (nl === subjectLower) return true;
    if (subjectLower.includes(nl) || nl.includes(subjectLower)) return true;
    const nameParts = nl.split(/[\s,]+/).filter(p => p.length > 2);
    if (nameParts.length === 0) return false;
    const overlap = nameParts.filter(p => subjectParts.some(sp => sp === p));
    return overlap.length >= Math.min(nameParts.length, subjectParts.length) && overlap.length >= 2;
  };

  // ─── Subject node ───
  const subjectType = (result.subject?.type || '').toUpperCase().includes('INDIVIDUAL') ? 'individual' : 'entity';
  addNode('subject', subjectName, subjectType, {
    risk_level: result.overallRisk || '',
    jurisdiction: result.subject?.jurisdiction || '',
    ...(result.sanctions?.status === 'MATCH' ? { sanctioned: 'YES', sanction_status: 'SANCTIONED' } : {}),
  });

  // ─── Jurisdiction node ───
  if (result.subject?.jurisdiction) {
    addNode('jurisdiction', result.subject.jurisdiction, 'country', {});
    addLink('subject', 'jurisdiction', 'related', 'Jurisdiction');
  }

  // ─── Sanctions matches ───
  (result.sanctions?.matches || []).forEach((match, i) => {
    const matchName = match.matchedName || match.name || '';
    if (isSubjectName(matchName)) {
      if (match.program || match.list) {
        const subNode = nodes.find(n => n.id === 'subject');
        if (subNode) subNode.metadata.sanctions_program = match.program || match.list;
      }
      return;
    }
    if (!matchName || addedNames.has(matchName.toLowerCase())) return;
    const id = `sanction_${i}`;
    addNode(id, matchName, classifyEntityType(match.matchType || ''), {
      sanction_status: 'SANCTIONED',
      sanctions_program: match.program || match.list || '',
      designation_date: match.listingDate || '',
    });
    addLink('subject', id, 'related', match.matchType || 'Sanctions Match');
  });

  // ─── Beneficial owners ───
  (result.ownershipAnalysis?.beneficialOwners || []).forEach((owner, i) => {
    if (!owner.name || isSubjectName(owner.name) || addedNames.has(owner.name.toLowerCase())) return;
    const id = `owner_${i}`;
    const pct = owner.ownershipPercent;
    addNode(id, owner.name, 'individual', {
      ...(pct ? { ownership_percent: `${pct}%` } : {}),
      ...(owner.sanctionStatus ? { sanction_status: owner.sanctionStatus } : {}),
      ...(owner.pepStatus ? { pep: 'YES' } : {}),
    });
    addLink(id, 'subject', 'manages', pct ? `Beneficial Owner (${pct}%)` : 'Beneficial Owner');
  });

  // ─── Corporate structure ───
  (result.ownershipAnalysis?.corporateStructure || []).forEach((corp, i) => {
    const name = corp.entity || corp.name;
    if (!name || isSubjectName(name) || addedNames.has(name.toLowerCase())) return;
    const id = `corp_${i}`;
    addNode(id, name, 'entity', {
      ...(corp.jurisdiction ? { jurisdiction: corp.jurisdiction } : {}),
      ...(corp.sanctionExposure ? { sanction_exposure: corp.sanctionExposure } : {}),
    });
    const rel = (corp.relationship || '').toLowerCase();
    const isParent = rel.includes('parent') || rel.includes('shareholder') || rel.includes('holding');
    addLink(isParent ? id : 'subject', isParent ? 'subject' : id, classifyLinkType(corp.relationship), corp.relationship || '');
  });

  // ─── Owned companies ───
  (result.ownedCompanies || []).forEach((co, i) => {
    const name = co.company || co.name;
    if (!name || isSubjectName(name) || addedNames.has(name.toLowerCase())) return;
    const id = `owned_${i}`;
    addNode(id, name, 'entity', {
      ...(co.ownershipPercent ? { ownership_percent: `${co.ownershipPercent}%` } : {}),
      ...(co.sanctionedOwner ? { sanction_exposure: 'DIRECT' } : {}),
    });
    addLink('subject', id, 'manages', co.ownershipPercent ? `Owns (${co.ownershipPercent}%)` : 'Owns');
  });

  // ─── PEP matches ───
  (result.pep?.matches || []).forEach((pep, i) => {
    if (!pep.name || isSubjectName(pep.name) || addedNames.has(pep.name.toLowerCase())) return;
    const id = `pep_${i}`;
    addNode(id, pep.name, 'individual', {
      role: pep.position || '',
      ...(pep.country?.length ? { jurisdiction: Array.isArray(pep.country) ? pep.country.join(', ') : pep.country } : {}),
      pep: 'YES',
    });
    addLink('subject', id, 'related', pep.relationshipToSubject || 'PEP Connection');
  });

  // ─── ICIJ Offshore Leaks matches ───
  const icijMatches = result.externalSources?.icij?.data?.matches || [];
  icijMatches.forEach((m, i) => {
    if (!m.name || isSubjectName(m.name) || addedNames.has(m.name.toLowerCase())) return;
    const id = `icij_${i}`;
    const type = (m.type || '').toLowerCase().includes('officer') ? 'individual' : 'entity';
    addNode(id, m.name, type, {
      ...(m.jurisdiction ? { jurisdiction: m.jurisdiction } : {}),
      ...(m.sourceDataset ? { source: m.sourceDataset } : {}),
    });
    addLink('subject', id, 'related', m.linkedTo ? `Linked (${m.type})` : (m.type || 'ICIJ Match'));
  });

  // ─── Court records — extract parties ───
  const courtCases = result.courtRecords?.cases || [];
  courtCases.slice(0, 5).forEach((c, i) => {
    if (!c.caseName) return;
    const vsMatch = c.caseName.match(/\bv\.?\s+(.+?)(?:\s*$|\s*,)/i);
    if (vsMatch) {
      const party = vsMatch[1].trim();
      if (party.length > 2 && !isSubjectName(party) && !addedNames.has(party.toLowerCase())) {
        const id = `court_party_${i}`;
        addNode(id, party, party.toLowerCase().includes('united states') || party.toLowerCase().includes('government') ? 'country' : 'individual', {});
        addLink(id, 'subject', 'related', `Litigation (${c.court || 'Court'})`);
      }
    }
  });

  // ─── Adverse media — extract entity names from article headlines & summaries ───
  const articles = result.adverseMedia?.articles || [];
  const extractedFromMedia = new Set();
  articles.slice(0, 10).forEach((article) => {
    const text = `${article.headline || ''} ${article.summary || ''}`;
    // Extract person names (Capitalized Firstname Lastname patterns)
    const personMatches = text.matchAll(/\b([A-Z][a-z]{2,}(?:\s+(?:al-|bin\s+|von\s+|de\s+)?[A-Z][a-z]{2,}){1,3})\b/g);
    for (const m of personMatches) {
      const name = m[1].trim();
      if (name.length > 5 && !isSubjectName(name) && !addedNames.has(name.toLowerCase()) && !extractedFromMedia.has(name.toLowerCase())) {
        extractedFromMedia.add(name.toLowerCase());
      }
    }
    // Extract organization names (Name + Bank/Group/Corp etc.)
    const orgMatches = text.matchAll(/\b([A-Z][A-Za-z]+(?:\s+(?:Group|Bank|Corp|Inc|Ltd|Holdings|Capital|Fund|Foundation|Insurance|Energy|Oil|Gas))+)\b/g);
    for (const m of orgMatches) {
      const name = m[1].trim();
      if (name.length > 5 && !isSubjectName(name) && !addedNames.has(name.toLowerCase()) && !extractedFromMedia.has(name.toLowerCase())) {
        extractedFromMedia.add(name.toLowerCase() + '|ORG');
      }
    }
  });
  let mediaIdx = 0;
  for (const entry of [...extractedFromMedia].slice(0, 8)) {
    const isOrg = entry.endsWith('|ORG');
    const rawName = isOrg ? entry.replace('|ORG', '') : entry;
    const displayName = rawName.replace(/\b\w/g, c => c.toUpperCase());
    if (!addedNames.has(rawName)) {
      addNode(`media_${mediaIdx}`, displayName, isOrg ? 'entity' : 'individual', {});
      addLink('subject', `media_${mediaIdx}`, 'related', 'Mentioned in media');
      mediaIdx++;
    }
  }

  // ─── Risk factors — ALWAYS parse (not gated on node count) ───
  (result.riskFactors || []).forEach((rf, i) => {
    const desc = `${rf.description || ''} ${rf.factor || ''} ${rf.mitigants || ''}`;
    const relPatterns = /(?:associated with|linked to|connection to|member of|leader of|operates through|controlled by|affiliated with|ties to|close to|partner of|ally of|daughter|son|wife|husband|family)\s+([A-Z][A-Za-z\s'.-]+?)(?:\s*[,.(;]|\s+(?:who|which|and|is|was|has|have|in|for|at|the))/gi;
    let rfMatch;
    while ((rfMatch = relPatterns.exec(desc)) !== null) {
      const entityName = rfMatch[1].trim().replace(/[.]+$/, '');
      if (entityName.length > 3 && entityName.length < 60 && !isSubjectName(entityName) && !addedNames.has(entityName.toLowerCase())) {
        const id = `rf_${i}_${nodes.length}`;
        addNode(id, entityName, classifyEntityType(''), {});
        addLink('subject', id, 'related', 'Associated');
      }
    }
  });

  // ─── Risk summary — extract person/org names ───
  const summary = result.riskSummary || '';
  if (summary.length > 20) {
    const sumMatches = summary.matchAll(/\b([A-Z][a-z]{2,}(?:\s+(?:al-|bin\s+|von\s+|de\s+)?[A-Z][a-z]{2,}){1,3})\b/g);
    for (const m of sumMatches) {
      const name = m[1].trim();
      if (name.length > 5 && !isSubjectName(name) && !addedNames.has(name.toLowerCase())) {
        const id = `sum_${nodes.length}`;
        addNode(id, name, 'individual', {});
        addLink('subject', id, 'related', 'Mentioned in summary');
      }
    }
  }

  // ─── Recommendations — extract entity names to investigate ───
  (result.recommendations || []).forEach((rec) => {
    const text = `${rec.action || ''} ${rec.rationale || ''}`;
    const recMatches = text.matchAll(/\b([A-Z][a-z]{2,}(?:\s+(?:al-|bin\s+|von\s+|de\s+)?[A-Z][a-z]{2,}){1,3})\b/g);
    for (const m of recMatches) {
      const name = m[1].trim();
      if (name.length > 5 && !isSubjectName(name) && !addedNames.has(name.toLowerCase())) {
        const id = `rec_${nodes.length}`;
        addNode(id, name, 'individual', {});
        addLink('subject', id, 'related', 'Recommended for investigation');
      }
    }
  });

  return { nodes, links };
}


export default function ChatNetworkGraph({ graphData: externalData, analysis, entities, relationships, subjectName, loading, onClose, onNodeClick }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const simulationRef = useRef(null);
  const nodesRef = useRef(null);
  const linksRef = useRef(null);

  const [selectedNode, setSelectedNode] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  // Build graph from: external pre-built data > full analysis object > entities/relationships props > subject fallback
  const graphData = React.useMemo(() => {
    if (externalData?.nodes?.length) return externalData;
    // Extract from full analysis object (has entities, relationships, etc.)
    if (analysis) {
      const extracted = extractGraphData(analysis);
      if (extracted.nodes.length > 0) return extracted;
    }
    // Extract from entities/relationships props
    if (entities?.length) {
      const extracted = extractGraphData({ entities, relationships });
      if (extracted.nodes.length > 0) return extracted;
    }
    // Fallback: at minimum show the subject as a node
    if (subjectName && !loading) {
      return {
        nodes: [{ id: 'subject', name: subjectName, type: 'entity', metadata: {} }],
        links: [],
      };
    }
    return { nodes: [], links: [] };
  }, [externalData, analysis, entities, relationships, subjectName, loading]);

  // Precompute connection counts
  const connectionCounts = React.useMemo(() => {
    const counts = {};
    graphData.links.forEach(l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source;
      const tid = typeof l.target === 'object' ? l.target.id : l.target;
      counts[sid] = (counts[sid] || 0) + 1;
      counts[tid] = (counts[tid] || 0) + 1;
    });
    return counts;
  }, [graphData]);

  const handleDownload = useCallback((format) => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    if (format === 'svg') {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'network-graph.svg';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = '#0a0a0a';
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
  }, []);

  const handleReset = useCallback(() => {
    if (simulationRef.current) {
      // Release all fixed positions
      if (nodesRef.current) {
        nodesRef.current.forEach(n => { n.fx = null; n.fy = null; });
      }
      simulationRef.current.alpha(1).restart();
    }
    setSelectedNode(null);
    // Reset zoom
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(500).call(
        d3.zoom().transform,
        d3.zoomIdentity
      );
    }
  }, []);

  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const container = containerRef.current;
    const width = container ? container.clientWidth : 900;
    const height = isFullscreen ? window.innerHeight - 100 : 600;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height])
      .attr('width', width)
      .attr('height', height)
      .style('background', '#0a0a0a');

    // Zoom behavior
    const zoomBehavior = d3.zoom().scaleExtent([0.2, 5]).on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
    svg.call(zoomBehavior);

    const g = svg.append('g');

    // Arrow markers for each link type
    const defs = svg.append('defs');
    Object.entries(LINK_COLORS).forEach(([type, color]) => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .append('path')
        .attr('d', 'M0,-4L10,0L0,4')
        .attr('fill', color);
    });

    // Deep clone data
    const nodes = graphData.nodes.map(d => ({ ...d, _connections: connectionCounts[d.id] || 0 }));
    const links = graphData.links.map(d => ({ ...d }));
    nodesRef.current = nodes;
    linksRef.current = links;

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 20))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));

    simulationRef.current = simulation;

    // ─── Links ───
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => getLinkColor(d))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', d => `url(#arrow-${d.type || 'related'})`);

    // ─── Link labels ───
    const linkLabel = g.append('g')
      .selectAll('text')
      .data(links)
      .join('text')
      .attr('font-size', '9px')
      .attr('fill', '#6b7280')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .text(d => {
        const lt = LINK_LABELS[d.type] || d.type || '';
        return lt.length > 20 ? lt.slice(0, 18) + '...' : lt;
      });

    // ─── Node groups ───
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'grab')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
          d3.select(event.sourceEvent.target.closest('g')).attr('cursor', 'grabbing');
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          // Keep position fixed after drag
          d3.select(event.sourceEvent.target.closest('g')).attr('cursor', 'grab');
        }));

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Node outer glow
    node.append('circle')
      .attr('r', d => getNodeRadius(d) + 4)
      .attr('fill', 'none')
      .attr('stroke', d => getNodeColor(d))
      .attr('stroke-opacity', 0.2)
      .attr('stroke-width', 3)
      .attr('filter', 'url(#glow)');

    // Node circles
    node.append('circle')
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => getNodeColor(d))
      .attr('fill-opacity', 0.85)
      .attr('stroke', d => getNodeColor(d))
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.4);

    // Node inner icon/text
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', d => d.type === 'country' ? '16px' : '12px')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .attr('font-weight', 'bold')
      .text(d => {
        if (d.type === 'country') return '\u{1F30D}';
        if (d.type === 'individual') return '\u{1F464}';
        if (d.type === 'vessel') return '\u{1F6A2}';
        if (d.type === 'prior_designee') return '\u26A0';
        return '\u{1F3E2}';
      });

    // Node labels (below node)
    const labels = node.append('text')
      .attr('dy', d => getNodeRadius(d) + 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', d => d.type === 'country' ? '12px' : '10px')
      .attr('font-weight', d => d.type === 'country' ? '600' : '400')
      .attr('fill', '#d4d4d4')
      .attr('pointer-events', 'none')
      .text(d => d.name.length > 24 ? d.name.slice(0, 22) + '...' : d.name)
      .attr('opacity', showLabels ? 1 : 0);

    // ─── Hover / Click interactions ───
    node.on('mouseover', function (event, d) {
      // Show tooltip
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltip({
          x: event.clientX - rect.left + 12,
          y: event.clientY - rect.top - 10,
          node: d,
        });
      }

      // Highlight connected
      const connectedIds = new Set();
      connectedIds.add(d.id);
      links.forEach(l => {
        const sid = typeof l.source === 'object' ? l.source.id : l.source;
        const tid = typeof l.target === 'object' ? l.target.id : l.target;
        if (sid === d.id) connectedIds.add(tid);
        if (tid === d.id) connectedIds.add(sid);
      });

      node.select('circle:nth-child(2)').attr('fill-opacity', n => connectedIds.has(n.id) ? 0.95 : 0.2);
      node.select('circle:nth-child(3)').attr('fill-opacity', n => connectedIds.has(n.id) ? 0.95 : 0.2);
      link.attr('stroke-opacity', l => {
        const sid = typeof l.source === 'object' ? l.source.id : l.source;
        const tid = typeof l.target === 'object' ? l.target.id : l.target;
        return sid === d.id || tid === d.id ? 1 : 0.08;
      }).attr('stroke-width', l => {
        const sid = typeof l.source === 'object' ? l.source.id : l.source;
        const tid = typeof l.target === 'object' ? l.target.id : l.target;
        return sid === d.id || tid === d.id ? 3 : 1;
      });
      linkLabel.attr('opacity', l => {
        const sid = typeof l.source === 'object' ? l.source.id : l.source;
        const tid = typeof l.target === 'object' ? l.target.id : l.target;
        return sid === d.id || tid === d.id ? 1 : 0;
      });
    })
    .on('mousemove', function (event) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltip(prev => prev ? { ...prev, x: event.clientX - rect.left + 12, y: event.clientY - rect.top - 10 } : null);
      }
    })
    .on('mouseout', function () {
      setTooltip(null);
      node.select('circle:nth-child(2)').attr('fill-opacity', 0.2);
      node.select('circle:nth-child(3)').attr('fill-opacity', 0.85);
      link.attr('stroke-opacity', 0.6).attr('stroke-width', 2);
      linkLabel.attr('opacity', 1);
    })
    .on('click', function (event, d) {
      event.stopPropagation();
      setSelectedNode(prev => prev?.id === d.id ? null : d);
      if (onNodeClick) onNodeClick(d);

      // Highlight selected node connections
      const connectedIds = new Set();
      connectedIds.add(d.id);
      links.forEach(l => {
        const sid = typeof l.source === 'object' ? l.source.id : l.source;
        const tid = typeof l.target === 'object' ? l.target.id : l.target;
        if (sid === d.id) connectedIds.add(tid);
        if (tid === d.id) connectedIds.add(sid);
      });

      // Pulse effect on selected node
      d3.select(this).select('circle:nth-child(2)')
        .transition().duration(200).attr('stroke-width', 6).attr('stroke-opacity', 0.6)
        .transition().duration(200).attr('stroke-width', 3).attr('stroke-opacity', 0.2);
    });

    // Click background to deselect
    svg.on('click', () => setSelectedNode(null));

    // ─── Tick ───
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      linkLabel
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2 - 8);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Store labels ref for toggle
    svgRef.current._labels = labels;
    svgRef.current._zoomBehavior = zoomBehavior;

    return () => simulation.stop();
  }, [graphData, connectionCounts, isFullscreen, showLabels, onNodeClick]);

  // Toggle labels
  useEffect(() => {
    if (svgRef.current?._labels) {
      svgRef.current._labels.transition().duration(300).attr('opacity', showLabels ? 1 : 0);
    }
  }, [showLabels]);

  if (loading || graphData.nodes.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0a0a0a', color: '#6b6b6b', fontSize: '14px', borderRadius: '12px' }}>
        <div style={{ textAlign: 'center' }}>
          {loading ? (
            <>
              <div style={{ width: '32px', height: '32px', border: '3px solid #2d2d2d', borderTopColor: '#858585', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, color: '#a1a1a1', marginBottom: '4px' }}>Extracting network data...</div>
              <div>Analyzing entities and relationships</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </>
          ) : (
            <>
              <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>{'\u{1F578}'}</div>
              <div style={{ fontWeight: 600, color: '#a1a1a1', marginBottom: '4px' }}>No network data available</div>
              <div>Run a screening to see entity relationships</div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Connected links for side panel
  const connectedLinks = selectedNode
    ? graphData.links.filter(l => {
        const sid = typeof l.source === 'object' ? l.source.id : l.source;
        const tid = typeof l.target === 'object' ? l.target.id : l.target;
        return sid === selectedNode.id || tid === selectedNode.id;
      })
    : [];

  // Unique link types in this graph for legend
  const linkTypesInGraph = [...new Set(graphData.links.map(l => l.type))];
  const nodeTypesInGraph = [...new Set(graphData.nodes.map(n => n.type))];

  const nodeTypeLabels = {
    entity: 'Entity (Company)',
    individual: 'Individual',
    vessel: 'Vessel / Tanker',
    prior_designee: 'Prior Designee',
    country: 'Country / Revenue Source',
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'rounded-xl border border-[#2d2d2d]'}`}
      style={{ background: '#0a0a0a', height: isFullscreen ? '100vh' : 660, position: 'relative' }}
    >
      {/* ─── Toolbar ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #2d2d2d', background: '#111111' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onClose && (
            <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '6px', background: '#1a1a1a', border: '1px solid #2d2d2d', cursor: 'pointer', color: '#a1a1a1', fontSize: '12px', fontWeight: 500 }} title="Back to chat">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Network Graph</span>
          <span style={{ fontSize: '12px', color: '#6b6b6b' }}>
            {graphData.nodes.length} entities &middot; {graphData.links.length} connections
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={() => setShowLabels(!showLabels)} style={{ padding: '6px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: showLabels ? '#ffffff' : '#6b6b6b' }} title={showLabels ? 'Hide Labels' : 'Show Labels'}>
            {showLabels ? <Tag className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button onClick={handleReset} style={{ padding: '6px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#a1a1a1' }} title="Reset Layout">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={() => handleDownload('png')} style={{ padding: '6px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#a1a1a1' }} title="Download PNG">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} style={{ padding: '6px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#a1a1a1' }} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {onClose && (
            <button onClick={onClose} style={{ padding: '6px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#a1a1a1' }} title="Close">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Graph + Side Panel ─── */}
      <div style={{ display: 'flex', height: isFullscreen ? 'calc(100vh - 100px)' : 560 }}>
        {/* SVG Graph */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <svg ref={svgRef} style={{ display: 'block' }} />

          {/* Tooltip */}
          {tooltip && (
            <div style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y,
              background: '#1a1a1a',
              border: '1px solid #3a3a3a',
              borderRadius: '8px',
              padding: '10px 14px',
              pointerEvents: 'none',
              zIndex: 100,
              maxWidth: '260px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>{tooltip.node.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: getNodeColor(tooltip.node) }} />
                <span style={{ fontSize: '11px', color: '#a1a1a1', textTransform: 'capitalize' }}>{(nodeTypeLabels[tooltip.node.type] || tooltip.node.type)}</span>
              </div>
              {tooltip.node.metadata?.jurisdiction && (
                <div style={{ fontSize: '11px', color: '#858585' }}>Jurisdiction: {tooltip.node.metadata.jurisdiction}</div>
              )}
              {tooltip.node.metadata?.designation_date && (
                <div style={{ fontSize: '11px', color: '#858585' }}>Designated: {tooltip.node.metadata.designation_date}</div>
              )}
              {tooltip.node.metadata?.sanctions_program && (
                <div style={{ fontSize: '11px', color: '#858585' }}>Program: {tooltip.node.metadata.sanctions_program}</div>
              )}
            </div>
          )}
        </div>

        {/* ─── Side panel (on node click) ─── */}
        {selectedNode && (
          <div style={{ width: '280px', borderLeft: '1px solid #2d2d2d', background: '#111111', overflowY: 'auto', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Selected Entity</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>{selectedNode.name}</div>
              </div>
              <button onClick={() => setSelectedNode(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b6b6b', padding: '4px' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, color: getNodeColor(selectedNode), background: getNodeColor(selectedNode) + '20', border: `1px solid ${getNodeColor(selectedNode)}40` }}>
                {(nodeTypeLabels[selectedNode.type] || selectedNode.type).toUpperCase()}
              </span>
            </div>

            {/* Metadata */}
            {selectedNode.metadata && Object.entries(selectedNode.metadata).filter(([, v]) => v).length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                {Object.entries(selectedNode.metadata).filter(([, v]) => v).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1f1f1f' }}>
                    <span style={{ fontSize: '11px', color: '#6b6b6b', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: '11px', color: '#d4d4d4' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Connections */}
            {connectedLinks.length > 0 && (
              <div>
                <div style={{ fontSize: '10px', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  Connections ({connectedLinks.length})
                </div>
                {connectedLinks.map((l, i) => {
                  const sid = typeof l.source === 'object' ? l.source.id : l.source;
                  const tid = typeof l.target === 'object' ? l.target.id : l.target;
                  const otherId = sid === selectedNode.id ? tid : sid;
                  const otherNode = graphData.nodes.find(n => n.id === otherId);
                  const direction = sid === selectedNode.id ? '\u2192' : '\u2190';
                  return (
                    <div key={i}
                      onClick={() => {
                        const found = graphData.nodes.find(n => n.id === otherId);
                        if (found) setSelectedNode(found);
                      }}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', marginBottom: '2px', fontSize: '12px' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ color: '#d4d4d4' }}>{direction} {otherNode?.name || otherId}</span>
                      <span style={{ color: getLinkColor(l), fontSize: '10px', fontWeight: 600 }}>{l.type}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Legend ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderTop: '1px solid #2d2d2d', background: '#111111', flexWrap: 'wrap', gap: '8px' }}>
        {/* Node types */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {nodeTypesInGraph.map(type => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: type === 'country' ? '14px' : '10px', height: type === 'country' ? '14px' : '10px', borderRadius: '50%', background: NODE_COLORS[type] || '#6b7280' }} />
              <span style={{ fontSize: '11px', color: '#858585' }}>{nodeTypeLabels[type] || type}</span>
            </div>
          ))}
        </div>

        {/* Link types */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {linkTypesInGraph.map(type => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '16px', height: '2px', background: LINK_COLORS[type] || '#6b7280', borderRadius: '1px' }} />
              <span style={{ fontSize: '11px', color: '#858585' }}>{LINK_LABELS[type] || type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
