// ReportTabs.js — Tabbed report view rendering structured JSON from agent investigations
import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Network,
  Lightbulb,
  Shield,
  Fingerprint,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import MarkdownRenderer from './MarkdownRenderer';
import {
  KYCRiskHeader,
  KYCSanctionsCard,
  KYCPEPCard,
  KYCAdverseMediaCard,
  KYCOwnershipSection,
  KYCRegulatoryCard,
  KYCRecommendationsCard,
} from './KYCCards';

// ── Style constants ──
const RISK_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};
const CARD_BG = '#1e1e1e';
const CARD_BORDER = '#2a2a2a';
const TEXT_PRIMARY = '#e5e5e5';
const TEXT_MUTED = '#6b7280';
const TEXT_WHITE = '#ffffff';
const AMBER = '#f59e0b';

const getRiskColor = (level) => RISK_COLORS[level?.toUpperCase()] || TEXT_MUTED;

// ── Section heading ──
const SectionHeading = ({ children, forPdf }) => (
  <h2 style={{
    fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
    color: forPdf ? '#111' : TEXT_WHITE, marginTop: 32, marginBottom: 16, fontFamily: 'inherit',
  }}>{children}</h2>
);

// ── Card wrapper ──
const Card = ({ children, style }) => (
  <div style={{
    background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 8,
    padding: '16px 20px', marginBottom: 16, ...style,
  }}>{children}</div>
);

// ── Key/Value row ──
const KVRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 8, lineHeight: 1.6 }}>
      <span style={{ color: TEXT_WHITE, fontWeight: 600, fontSize: 14 }}>{label}: </span>
      <span style={{ color: TEXT_PRIMARY, fontSize: 14 }}>{value}</span>
    </div>
  );
};

// ── Dark table ──
const DarkTable = ({ columns, rows, colorRules }) => {
  if (!rows?.length) return null;
  return (
    <div style={{ overflowX: 'auto', marginBottom: 16 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{
                textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${CARD_BORDER}`,
                color: AMBER, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
                background: '#161616',
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {columns.map((col, ci) => {
                const val = row[col.key];
                let color = TEXT_PRIMARY;
                if (colorRules?.[col.key]) color = colorRules[col.key](val, row);
                return (
                  <td key={ci} style={{
                    padding: '10px 12px', borderBottom: `1px solid ${CARD_BORDER}`,
                    color, fontWeight: col.bold ? 600 : 400,
                  }}>{val ?? ''}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ══════════════════════════════════════
// SECTION RENDERERS
// ══════════════════════════════════════

// ── Entity Summary ──
const EntitySummarySection = ({ data }) => {
  if (!data) return null;
  return (
    <>
      <SectionHeading>Entity Summary</SectionHeading>
      <Card>
        <KVRow label="Legal Name" value={data.legalName} />
        <KVRow label="Type" value={data.type} />
        <KVRow label="Status" value={data.status} />
        <KVRow label="Nationality/Citizenship" value={data.nationality} />
        <KVRow label="Jurisdiction" value={data.jurisdiction} />
        <KVRow label="Key Business" value={data.keyBusiness} />
        <KVRow label="Parent Company" value={data.parentCompany} />
        <KVRow label="Designation Details" value={data.designationDetails} />
        <KVRow label="PEP Status" value={data.pepStatus} />
        <KVRow label="EDD Obligations" value={data.eddObligations} />
      </Card>
    </>
  );
};

// ── Match Confidence ──
const MatchConfidenceSection = ({ data }) => {
  if (!data) return null;
  const color = getRiskColor(data.level === 'HIGH' ? 'LOW' : data.level === 'LOW' ? 'HIGH' : 'MEDIUM');
  return (
    <div style={{
      background: `${color}10`, border: `1px solid ${color}40`, borderRadius: 8,
      padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <ShieldCheck style={{ width: 20, height: 20, color, flexShrink: 0 }} />
      <span style={{ color, fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>
        Match Confidence: {data.level}
      </span>
      <span style={{ color, fontSize: 16, fontWeight: 600, marginLeft: 4 }}>{data.percentage}%</span>
    </div>
  );
};

const MatchConfidenceDetails = ({ data }) => {
  if (!data) return null;
  return (
    <div style={{ marginBottom: 16, fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.7 }}>
      {data.factorsSupporting?.length > 0 && (
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: TEXT_WHITE, fontWeight: 500 }}>Factors supporting: </span>
          {data.factorsSupporting.join(', ')}
        </div>
      )}
      {data.factorsReducing?.length > 0 && (
        <div>
          <span style={{ color: TEXT_WHITE, fontWeight: 500 }}>Factors reducing: </span>
          {data.factorsReducing.join(', ')}
        </div>
      )}
    </div>
  );
};

// ── Overall Risk (with Recharts gauge) ──
const OverallRiskSection = ({ data }) => {
  if (!data) return null;
  const color = getRiskColor(data.level);
  const score = data.score || 0;
  // Gauge: half-donut with score needle
  const gaugeData = [{ value: score }, { value: 100 - score }];
  const needleAngle = 180 - (score / 100) * 180;
  const needleRad = (needleAngle * Math.PI) / 180;
  // Needle coordinates (cx=90, cy=80, radius=60)
  const nx = 90 + 55 * Math.cos(needleRad);
  const ny = 80 - 55 * Math.sin(needleRad);
  return (
    <>
      <div style={{
        background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 8,
        padding: '16px 20px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ width: 180, height: 100, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="80%"
                startAngle={180}
                endAngle={0}
                innerRadius={45}
                outerRadius={65}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={color} />
                <Cell fill="#2a2a2a" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Needle + score overlay */}
          <svg viewBox="0 0 180 100" style={{ position: 'relative', marginTop: -100, display: 'block' }}>
            <line x1="90" y1="80" x2={nx} y2={ny} stroke={TEXT_WHITE} strokeWidth="2" strokeLinecap="round" />
            <circle cx="90" cy="80" r="4" fill={TEXT_WHITE} />
            <text x="90" y="72" textAnchor="middle" fill={color} fontSize="20" fontWeight="700">{score}</text>
          </svg>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <AlertTriangle style={{ width: 18, height: 18, color, flexShrink: 0 }} />
            <span style={{ color, fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>
              Overall Risk: {data.level}
            </span>
          </div>
          {data.summary && (
            <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, marginTop: 4 }}>
              <span style={{ fontWeight: 700, color: TEXT_WHITE }}>{data.recommendation}</span>
              {' — '}{data.summary}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ── Critical Findings ──
const CriticalFindingsSection = ({ data }) => {
  if (!data?.length) return null;
  return (
    <>
      <SectionHeading>Critical Findings</SectionHeading>
      {data.map((f, i) => {
        const color = getRiskColor(f.severity);
        return (
          <div key={i} style={{ marginBottom: 16, lineHeight: 1.7 }}>
            <div style={{ fontSize: 14 }}>
              <span style={{ color, fontWeight: 700 }}>{f.severity}</span>
              {' '}
              <span style={{ color: TEXT_WHITE, fontWeight: 600 }}>{f.title}</span>
              {' — '}
              <span style={{ color: TEXT_PRIMARY }}>{f.description}</span>
            </div>
            {f.source && (
              <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
                Source: <span style={{ color: AMBER }}>{f.source}</span>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

// ── Risk Score Breakdown (with Recharts bar chart) ──
const getScoreColor = (score) => {
  if (score >= 20) return RISK_COLORS.CRITICAL;
  if (score >= 10) return RISK_COLORS.HIGH;
  if (score >= 5) return RISK_COLORS.MEDIUM;
  return RISK_COLORS.LOW;
};
const RiskBreakdownSection = ({ data, totalScore, totalLevel }) => {
  if (!data?.length) return null;
  const chartData = data.map(d => ({
    ...d,
    score: typeof d.score === 'number' ? d.score : parseInt(d.score) || 0,
    fill: getScoreColor(typeof d.score === 'number' ? d.score : parseInt(d.score) || 0),
  }));
  return (
    <>
      <SectionHeading>Risk Score Breakdown</SectionHeading>
      <Card style={{ padding: '20px 20px 12px' }}>
        <div style={{ width: '100%', height: Math.max(chartData.length * 44, 180) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
              <XAxis type="number" domain={[0, 50]} hide />
              <YAxis
                type="category"
                dataKey="factor"
                width={160}
                tick={{ fill: TEXT_PRIMARY, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: '#ffffff08' }}
                contentStyle={{ background: '#252525', border: `1px solid ${CARD_BORDER}`, borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: TEXT_WHITE, fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: TEXT_PRIMARY }}
                formatter={(value, _name, props) => [
                  `${value} pts (${props.payload.weight})`,
                  'Score',
                ]}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Reasoning list below chart */}
        <div style={{ marginTop: 12, borderTop: `1px solid ${CARD_BORDER}`, paddingTop: 12 }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12, lineHeight: 1.5 }}>
              <span style={{
                color: getScoreColor(typeof d.score === 'number' ? d.score : parseInt(d.score) || 0),
                fontWeight: 600, minWidth: 28, textAlign: 'right',
              }}>
                {d.score}
              </span>
              <span style={{ color: TEXT_MUTED }}>{d.weight}</span>
              <span style={{ color: TEXT_PRIMARY }}>{d.reasoning}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${CARD_BORDER}`, fontSize: 13, fontWeight: 600 }}>
            <span style={{ color: TEXT_WHITE, minWidth: 28, textAlign: 'right' }}>{totalScore}</span>
            <span style={{ color: TEXT_MUTED }}>100%</span>
            <span style={{ color: getRiskColor(totalLevel) }}>TOTAL — {totalLevel}</span>
          </div>
        </div>
      </Card>
    </>
  );
};

// ── Red Flags ──
const RedFlagsSection = ({ data }) => {
  if (!data?.length) return null;
  return (
    <>
      <SectionHeading>Red Flags</SectionHeading>
      {data.map((flag, i) => (
        <Card key={i} style={{ borderLeft: `3px solid ${RISK_COLORS.CRITICAL}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: TEXT_WHITE, marginBottom: 8, marginTop: 0 }}>
            {flag.title}
          </h3>
          <p style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.7, margin: '0 0 12px 0' }}>
            {flag.description}
          </p>
          <div style={{
            borderLeft: `2px solid #3a3a3a`, background: '#2d2d2d', padding: '12px 16px', borderRadius: 4,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: AMBER, marginBottom: 4 }}>
              Impact
            </div>
            <div style={{ fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.6 }}>{flag.impact}</div>
          </div>
        </Card>
      ))}
    </>
  );
};

// ── Entity Network (react-flow graph + table) ──
const NetworkNode = ({ data: d }) => {
  const riskColor = d.risk ? getRiskColor(d.risk) : TEXT_MUTED;
  const isSanctioned = d.sanctioned?.toLowerCase() === 'yes';
  const badges = d.badges || [];
  return (
    <div style={{
      border: `${isSanctioned || d.flagged ? 2 : 1}px solid ${isSanctioned || d.flagged ? RISK_COLORS.CRITICAL : riskColor}`,
      borderRadius: 8, padding: '8px 14px', minWidth: 120, maxWidth: 180, textAlign: 'center',
      background: isSanctioned || d.flagged ? `${RISK_COLORS.CRITICAL}10` : '#1e1e1e',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: CARD_BORDER, width: 6, height: 6, border: 'none' }} />
      <div style={{ fontSize: 11, fontWeight: 600, color: isSanctioned || d.flagged ? RISK_COLORS.CRITICAL : TEXT_WHITE, marginBottom: 2 }}>{d.label}</div>
      {d.type && <div style={{ fontSize: 9, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.5 }}>{d.type}</div>}
      {d.jurisdiction && <div style={{ fontSize: 9, color: TEXT_MUTED }}>{d.jurisdiction}</div>}
      {isSanctioned && (
        <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, fontWeight: 700, background: `${RISK_COLORS.CRITICAL}20`, color: RISK_COLORS.CRITICAL, marginTop: 3, display: 'inline-block' }}>SANCTIONED</span>
      )}
      {badges.length > 0 && (
        <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 3, flexWrap: 'wrap' }}>
          {badges.map((badge, i) => (
            <span key={i} style={{
              fontSize: 7, padding: '1px 4px', borderRadius: 3, fontWeight: 700, letterSpacing: 0.5,
              background: `${BADGE_COLORS[badge] || TEXT_MUTED}20`,
              color: BADGE_COLORS[badge] || TEXT_MUTED,
              textTransform: 'uppercase',
            }}>{badge}</span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: CARD_BORDER, width: 6, height: 6, border: 'none' }} />
    </div>
  );
};

const networkNodeTypes = { network: NetworkNode };

const buildNetworkGraph = (entities, ownership) => {
  const nodes = [];
  const edges = [];
  const GAP_X = 220;
  const GAP_Y = 130;
  const usedNames = new Set();

  // --- Ownership layer (top) ---
  const owners = ownership?.owners || [];
  const subsidiaries = ownership?.subsidiaries || [];
  const parentName = ownership?.parentEntity || '';
  let ownershipRows = 0;

  if (parentName) {
    const totalOwners = Math.max(owners.length, 1);
    const parentX = ((totalOwners - 1) * GAP_X) / 2;
    nodes.push({
      id: 'own-parent',
      type: 'network',
      position: { x: parentX, y: 0 },
      data: { label: parentName, type: 'Parent', jurisdiction: '', risk: '', sanctioned: '' },
    });
    usedNames.add(parentName.toLowerCase());
    ownershipRows = 1;

    owners.forEach((owner, i) => {
      const id = `own-o-${i}`;
      const subtitle = owner.percentage != null ? `${owner.percentage}%` : owner.description || '';
      nodes.push({
        id,
        type: 'network',
        position: { x: i * GAP_X, y: GAP_Y },
        data: {
          label: owner.name,
          type: 'Owner',
          jurisdiction: '',
          risk: owner.flagged ? 'HIGH' : '',
          sanctioned: '',
          flagged: owner.flagged,
        },
      });
      usedNames.add(owner.name.toLowerCase());
      edges.push({
        id: `e-own-p-${i}`,
        source: 'own-parent',
        target: id,
        label: subtitle,
        style: { stroke: owner.flagged ? RISK_COLORS.CRITICAL : CARD_BORDER, strokeWidth: 1.5 },
        labelStyle: { fill: TEXT_MUTED, fontSize: 9 },
        labelBgStyle: { fill: '#141414', fillOpacity: 0.9 },
        labelBgPadding: [3, 5],
        labelBgBorderRadius: 3,
      });
    });
    if (owners.length > 0) ownershipRows = 2;

    subsidiaries.forEach((sub, i) => {
      const id = `own-s-${i}`;
      const subY = (ownershipRows) * GAP_Y;
      nodes.push({
        id,
        type: 'network',
        position: { x: i * GAP_X, y: subY },
        data: {
          label: sub.name,
          type: 'Subsidiary',
          jurisdiction: sub.jurisdiction || '',
          risk: sub.risk || '',
          sanctioned: '',
          badges: sub.badges || [],
        },
      });
      usedNames.add(sub.name.toLowerCase());
      edges.push({
        id: `e-own-ps-${i}`,
        source: 'own-parent',
        target: id,
        label: sub.ownership || '',
        style: { stroke: CARD_BORDER, strokeWidth: 1 },
        labelStyle: { fill: TEXT_MUTED, fontSize: 9 },
        labelBgStyle: { fill: '#141414', fillOpacity: 0.9 },
        labelBgPadding: [3, 5],
        labelBgBorderRadius: 3,
      });
    });
    if (subsidiaries.length > 0) ownershipRows++;
  }

  // --- Entity network layer (below ownership) ---
  const networkEntities = (entities || []).filter(ent => !usedNames.has((ent.entity || '').toLowerCase()));
  const startY = ownershipRows * GAP_Y + (ownershipRows > 0 ? 40 : 0);
  const cols = Math.min(networkEntities.length || 1, 4);

  networkEntities.forEach((ent, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const totalInRow = Math.min(networkEntities.length - row * cols, cols);
    const offsetX = ((cols - totalInRow) * GAP_X) / 2;
    nodes.push({
      id: `net-${i}`,
      type: 'network',
      position: { x: offsetX + col * GAP_X, y: startY + row * GAP_Y },
      data: {
        label: ent.entity,
        type: ent.type,
        jurisdiction: ent.jurisdiction,
        risk: ent.risk,
        sanctioned: ent.sanctioned,
      },
    });
    // Connect to parent node or first entity
    const sourceId = parentName ? 'own-parent' : (i > 0 ? 'net-0' : null);
    if (sourceId && ent.connection) {
      edges.push({
        id: `e-net-${sourceId}-${i}`,
        source: sourceId,
        target: `net-${i}`,
        label: ent.connection?.length > 30 ? ent.connection.substring(0, 30) + '...' : ent.connection,
        style: { stroke: getRiskColor(ent.risk) || CARD_BORDER, strokeWidth: 1 },
        labelStyle: { fill: TEXT_MUTED, fontSize: 9 },
        labelBgStyle: { fill: '#141414', fillOpacity: 0.9 },
        labelBgPadding: [3, 5],
        labelBgBorderRadius: 3,
      });
    }
  });

  return { nodes, edges };
};

const EntityNetworkSection = ({ data, forPdf, ownership }) => {
  const [viewMode, setViewMode] = useState('graph');
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildNetworkGraph(data?.length ? data : [], ownership), [data, ownership]);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const hasOwnership = ownership?.parentEntity || ownership?.owners?.length || ownership?.subsidiaries?.length;
  if (!data?.length && !hasOwnership) return null;

  const totalNodes = (data?.length || 0) + (ownership?.owners?.length || 0) + (ownership?.subsidiaries?.length || 0) + (ownership?.parentEntity ? 1 : 0);
  const rows = Math.ceil(totalNodes / 4);
  const graphHeight = Math.max(rows * 140 + 60, 350);
  const showTable = forPdf || viewMode === 'table';

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, marginBottom: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: forPdf ? '#111' : TEXT_WHITE, margin: 0, fontFamily: 'inherit' }}>Entity Network & Ownership</h2>
        {!forPdf && (
          <div style={{ display: 'flex', gap: 2, background: '#252525', borderRadius: 6, padding: 2 }}>
            {['graph', 'table'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
                background: viewMode === mode ? '#3a3a3a' : 'transparent',
                color: viewMode === mode ? TEXT_WHITE : TEXT_MUTED,
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'inherit',
              }}>{mode}</button>
            ))}
          </div>
        )}
      </div>
      {!showTable ? (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ height: graphHeight, background: '#141414' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={networkNodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              minZoom={0.3}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={true}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={true}
              zoomOnScroll={true}
            >
              <Background color="#2a2a2a" gap={20} size={1} />
              <Controls showInteractive={false} style={{ background: '#252525', border: `1px solid ${CARD_BORDER}`, borderRadius: 6 }} />
            </ReactFlow>
          </div>
        </Card>
      ) : (
        <DarkTable
          columns={[
            { key: 'entity', label: 'Entity', bold: true },
            { key: 'type', label: 'Type' },
            { key: 'jurisdiction', label: 'Jurisdiction' },
            { key: 'risk', label: 'Risk' },
            { key: 'sanctioned', label: 'Sanctioned' },
            { key: 'matchPercent', label: 'Match %' },
            { key: 'connection', label: 'Connection' },
            { key: 'source', label: 'Source' },
          ]}
          colorRules={{
            risk: (val) => getRiskColor(val),
            sanctioned: (val) => val?.toLowerCase() === 'yes' ? RISK_COLORS.CRITICAL : TEXT_PRIMARY,
            matchPercent: (val) => {
              const n = typeof val === 'number' ? val : parseInt(val);
              if (n < 50) return RISK_COLORS.CRITICAL;
              if (n < 70) return RISK_COLORS.MEDIUM;
              return RISK_COLORS.LOW;
            },
            source: () => AMBER,
          }}
          rows={[
            ...(ownership?.parentEntity ? [{ entity: ownership.parentEntity, type: 'Parent', jurisdiction: '', risk: '', sanctioned: '', matchPercent: '', connection: '', source: '' }] : []),
            ...(ownership?.owners || []).map(o => ({ entity: o.name, type: 'Owner', jurisdiction: '', risk: o.flagged ? 'HIGH' : '', sanctioned: '', matchPercent: o.percentage != null ? o.percentage : '', connection: o.description || '', source: '' })),
            ...(ownership?.subsidiaries || []).map(s => ({ entity: s.name, type: 'Subsidiary', jurisdiction: s.jurisdiction || '', risk: s.risk || '', sanctioned: '', matchPercent: '', connection: s.ownership || '', source: '' })),
            ...(data || []).filter(ent => {
              const ownerNames = new Set([
                ...(ownership?.parentEntity ? [ownership.parentEntity.toLowerCase()] : []),
                ...(ownership?.owners || []).map(o => o.name.toLowerCase()),
                ...(ownership?.subsidiaries || []).map(s => s.name.toLowerCase()),
              ]);
              return !ownerNames.has((ent.entity || '').toLowerCase());
            }),
          ]}
        />
      )}
    </>
  );
};

// ── Corporate Structure (react-flow ownership graph) ──
const BADGE_COLORS = {
  SANCTIONED: RISK_COLORS.CRITICAL, SDN: RISK_COLORS.CRITICAL, CONVICTED: RISK_COLORS.CRITICAL,
  DPA: RISK_COLORS.HIGH, DESIGNATED: RISK_COLORS.HIGH, BLOCKED: RISK_COLORS.CRITICAL,
  'HIGH RISK': RISK_COLORS.HIGH,
};

// Custom node for react-flow ownership graph
const OwnershipNode = ({ data: d }) => {
  const borderColor = d.flagged ? RISK_COLORS.CRITICAL : CARD_BORDER;
  const bg = d.flagged ? `${RISK_COLORS.CRITICAL}10` : d.isParent ? '#252525' : '#1e1e1e';
  const riskColor = d.risk ? getRiskColor(d.risk) : null;
  return (
    <div style={{
      border: `${d.isParent ? 2 : 1}px solid ${borderColor}`,
      borderRadius: 8,
      padding: '10px 16px',
      minWidth: d.isParent ? 180 : 140,
      textAlign: 'center',
      background: bg,
      position: 'relative',
    }}>
      {d.hasParent && <Handle type="target" position={Position.Top} style={{ background: CARD_BORDER, width: 6, height: 6, border: 'none' }} />}
      <div style={{
        fontSize: d.isParent ? 14 : 12,
        fontWeight: 600,
        color: d.flagged ? RISK_COLORS.CRITICAL : TEXT_WHITE,
        marginBottom: d.subtitle ? 4 : 0,
      }}>{d.label}</div>
      {d.subtitle && (
        <div style={{ fontSize: 10, color: d.flagged ? RISK_COLORS.CRITICAL : TEXT_MUTED, marginTop: 2 }}>
          {d.subtitle}
        </div>
      )}
      {d.badges?.length > 0 && (
        <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 4, flexWrap: 'wrap' }}>
          {d.badges.map((badge, i) => (
            <span key={i} style={{
              fontSize: 8, padding: '1px 5px', borderRadius: 3, fontWeight: 700, letterSpacing: 0.5,
              background: `${BADGE_COLORS[badge] || TEXT_MUTED}20`,
              color: BADGE_COLORS[badge] || TEXT_MUTED,
              textTransform: 'uppercase',
            }}>{badge}</span>
          ))}
        </div>
      )}
      {riskColor && (
        <div style={{
          position: 'absolute', top: -3, right: -3, width: 8, height: 8,
          borderRadius: '50%', background: riskColor,
        }} />
      )}
      {d.hasChildren && <Handle type="source" position={Position.Bottom} style={{ background: CARD_BORDER, width: 6, height: 6, border: 'none' }} />}
    </div>
  );
};

const ownershipNodeTypes = { ownership: OwnershipNode };

const buildOwnershipGraph = (data) => {
  const nodes = [];
  const edges = [];
  const owners = data.owners || [];
  const subsidiaries = data.subsidiaries || [];
  const NODE_W = 180;
  const GAP_X = 40;
  const GAP_Y = 100;

  // Parent node at top center
  if (data.parentEntity) {
    const totalOwners = Math.max(owners.length, 1);
    const parentX = ((totalOwners - 1) * (NODE_W + GAP_X)) / 2;
    nodes.push({
      id: 'parent',
      type: 'ownership',
      position: { x: parentX, y: 0 },
      data: {
        label: data.parentEntity,
        isParent: true,
        hasParent: false,
        hasChildren: owners.length > 0 || subsidiaries.length > 0,
      },
    });
  }

  // Owner nodes below parent
  owners.forEach((owner, i) => {
    const id = `owner-${i}`;
    nodes.push({
      id,
      type: 'ownership',
      position: { x: i * (NODE_W + GAP_X), y: GAP_Y },
      data: {
        label: owner.name,
        subtitle: [
          owner.percentage != null ? `${owner.percentage}%` : null,
          owner.description,
        ].filter(Boolean).join(' — '),
        flagged: owner.flagged,
        hasParent: !!data.parentEntity,
        hasChildren: false,
      },
    });
    if (data.parentEntity) {
      edges.push({
        id: `e-parent-${id}`,
        source: 'parent',
        target: id,
        label: owner.percentage != null ? `${owner.percentage}%` : '',
        style: { stroke: owner.flagged ? RISK_COLORS.CRITICAL : CARD_BORDER, strokeWidth: 1.5 },
        labelStyle: { fill: TEXT_MUTED, fontSize: 10, fontWeight: 600 },
        labelBgStyle: { fill: '#1a1a1a', fillOpacity: 0.9 },
        labelBgPadding: [4, 6],
        labelBgBorderRadius: 3,
      });
    }
  });

  // Subsidiary nodes below parent (if no owners, or offset below owners)
  const subY = owners.length > 0 ? GAP_Y * 2 : GAP_Y;
  subsidiaries.forEach((sub, i) => {
    const id = `sub-${i}`;
    nodes.push({
      id,
      type: 'ownership',
      position: { x: i * (NODE_W + GAP_X), y: subY },
      data: {
        label: sub.name,
        subtitle: [sub.jurisdiction, sub.ownership].filter(Boolean).join(' · '),
        flagged: false,
        risk: sub.risk,
        badges: sub.badges,
        hasParent: !!data.parentEntity,
        hasChildren: false,
      },
    });
    if (data.parentEntity) {
      edges.push({
        id: `e-parent-${id}`,
        source: 'parent',
        target: id,
        label: sub.ownership || '',
        style: { stroke: CARD_BORDER, strokeWidth: 1 },
        labelStyle: { fill: TEXT_MUTED, fontSize: 10 },
        labelBgStyle: { fill: '#1a1a1a', fillOpacity: 0.9 },
        labelBgPadding: [4, 6],
        labelBgBorderRadius: 3,
      });
    }
  });

  return { nodes, edges };
};

const CorporateStructureSection = ({ data, forPdf }) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildOwnershipGraph(data || { parentEntity: '', owners: [], subsidiaries: [] }), [data]);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  if (!data) return null;

  const owners = data.owners || [];
  const subsidiaries = data.subsidiaries || [];

  if (forPdf) {
    const rows = [
      ...owners.map(o => ({ name: o.name, role: 'Owner', detail: o.percentage != null ? `${o.percentage}%` : o.description || '', flagged: o.flagged ? 'Yes' : '' })),
      ...subsidiaries.map(s => ({ name: s.name, role: 'Subsidiary', detail: [s.jurisdiction, s.ownership].filter(Boolean).join(' · '), flagged: '' })),
    ];
    return (
      <>
        <SectionHeading forPdf>Ownership Structure — {data.parentEntity}</SectionHeading>
        <DarkTable
          columns={[
            { key: 'name', label: 'Entity', bold: true },
            { key: 'role', label: 'Role' },
            { key: 'detail', label: 'Detail' },
            { key: 'flagged', label: 'Flagged' },
          ]}
          rows={rows}
          forPdf={forPdf}
          colorRules={{ flagged: (v) => v === 'Yes' ? RISK_COLORS.CRITICAL : undefined }}
        />
      </>
    );
  }

  const layers = 1 + (owners.length > 0 ? 1 : 0) + (subsidiaries.length > 0 ? 1 : 0);
  const graphHeight = Math.max(layers * 120 + 40, 200);

  return (
    <>
      <SectionHeading>Ownership Structure</SectionHeading>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: `1px solid ${CARD_BORDER}` }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: AMBER }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_WHITE }}>Ultimate beneficial owners</span>
          {data.structureType && (
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 4,
              background: '#2a2a2a', color: TEXT_MUTED, fontWeight: 500,
            }}>{data.structureType}</span>
          )}
        </div>
        {/* React Flow graph */}
        <div style={{ height: graphHeight, background: '#141414' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={ownershipNodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.5}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={true}
            zoomOnScroll={true}
          >
            <Background color="#2a2a2a" gap={20} size={1} />
            <Controls
              showInteractive={false}
              style={{ background: '#252525', border: `1px solid ${CARD_BORDER}`, borderRadius: 6 }}
            />
          </ReactFlow>
        </div>
        {/* Notes */}
        {data.notes && (
          <div style={{
            padding: '12px 20px', borderTop: `1px solid ${CARD_BORDER}`,
            fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.6,
          }}>{data.notes}</div>
        )}
      </Card>
    </>
  );
};

// ── Regulatory Context ──
const RegulatoryContextSection = ({ data }) => {
  if (!data?.length) return null;
  return (
    <>
      <SectionHeading>Regulatory Context</SectionHeading>
      <DarkTable
        columns={[
          { key: 'jurisdiction', label: 'Jurisdiction', bold: true },
          { key: 'opacity', label: 'Opacity' },
          { key: 'fatfStatus', label: 'FATF Status' },
          { key: 'keyRisk', label: 'Key Risk' },
          { key: 'notes', label: 'Notes' },
        ]}
        rows={data}
        colorRules={{
          opacity: (val) => val?.toLowerCase() === 'high' ? RISK_COLORS.CRITICAL : val?.toLowerCase() === 'medium' ? RISK_COLORS.MEDIUM : RISK_COLORS.LOW,
          fatfStatus: (val) => val?.toLowerCase() === 'listed' ? RISK_COLORS.CRITICAL : val?.toLowerCase() === 'grey' ? RISK_COLORS.MEDIUM : RISK_COLORS.LOW,
        }}
      />
    </>
  );
};

// ── Typologies ──
const TypologiesSection = ({ data }) => {
  if (!data?.length) return null;
  return (
    <>
      <SectionHeading>Typologies</SectionHeading>
      {data.map((t, i) => (
        <Card key={i}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: TEXT_WHITE, marginBottom: 12, marginTop: 0 }}>
            {t.name}
          </h3>
          <KVRow label="Pattern" value={t.pattern} />
          <KVRow label="Evidence in this case" value={t.evidence} />
          <KVRow label="Compliance implication" value={t.complianceImplication} />
        </Card>
      ))}
    </>
  );
};

// ── Adverse Media ──
const AdverseMediaSection = ({ data }) => {
  if (!data?.length) return null;
  return (
    <>
      <SectionHeading>Adverse Media</SectionHeading>
      <DarkTable
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'outlet', label: 'Outlet' },
          { key: 'headline', label: 'Headline', bold: true },
          { key: 'relevance', label: 'Relevance' },
          { key: 'source', label: 'Source' },
        ]}
        rows={data}
        colorRules={{
          relevance: (val) => val?.toLowerCase() === 'high' ? RISK_COLORS.CRITICAL : val?.toLowerCase() === 'medium' ? RISK_COLORS.MEDIUM : TEXT_MUTED,
        }}
      />
    </>
  );
};

// ── Designation Timeline ──
const DesignationTimelineSection = ({ data }) => {
  if (!data?.length) return null;
  return (
    <>
      <SectionHeading>Designation Timeline</SectionHeading>
      <DarkTable
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'program', label: 'Program' },
          { key: 'authority', label: 'Authority' },
          { key: 'entityDesignated', label: 'Entity', bold: true },
          { key: 'gl', label: 'GL?' },
          { key: 'glExpiry', label: 'GL Expiry' },
        ]}
        rows={data}
      />
    </>
  );
};

// ── General Licenses ──
const GeneralLicensesSection = ({ data }) => {
  if (!data?.length) return null;
  return (
    <>
      <SectionHeading>General Licenses</SectionHeading>
      <DarkTable
        columns={[
          { key: 'gl', label: 'GL', bold: true },
          { key: 'scope', label: 'Scope' },
          { key: 'issued', label: 'Issued' },
          { key: 'expires', label: 'Expires' },
          { key: 'actionRequired', label: 'Action Required' },
        ]}
        rows={data}
      />
    </>
  );
};

// ── Ownership History ──
const OwnershipHistorySection = ({ data }) => {
  if (!data?.length) return null;
  return (
    <>
      <SectionHeading>Ownership History</SectionHeading>
      <DarkTable
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'event', label: 'Event' },
          { key: 'entity', label: 'Entity', bold: true },
          { key: 'detail', label: 'Detail' },
          { key: 'complianceNote', label: 'Compliance Note' },
        ]}
        rows={data}
      />
    </>
  );
};

// ── Programs and Authorities ──
// ── Financial Exposure ──
const FinancialExposureSection = ({ data }) => {
  if (!data) return null;
  return (
    <>
      <SectionHeading>Financial Exposure</SectionHeading>
      <Card>
        <KVRow label="Estimated transaction exposure" value={data.transactionExposure} />
        <KVRow label="Potential OFAC penalty range" value={data.penaltyRange} />
        <KVRow label="Comparable enforcement actions" value={data.comparableEnforcement} />
        <KVRow label="Business impact" value={data.businessImpact} />
      </Card>
    </>
  );
};

// ── Coverage Gap ──
const CoverageGapSection = ({ data }) => {
  if (!data) return null;
  const s = data.standardScreening || {};
  const t = data.thisInvestigation || {};
  return (
    <>
      <SectionHeading>Coverage Gap</SectionHeading>
      <DarkTable
        columns={[
          { key: 'metric', label: '', bold: true },
          { key: 'standard', label: 'Standard Screening' },
          { key: 'investigation', label: 'This Investigation' },
        ]}
        rows={[
          { metric: 'Entities found', standard: s.entities, investigation: t.entities },
          { metric: 'Jurisdictions covered', standard: s.jurisdictions, investigation: t.jurisdictions },
          { metric: 'Programs screened', standard: s.programs, investigation: t.programs },
          { metric: 'Coverage', standard: s.coverage, investigation: t.coverage },
        ]}
        colorRules={{
          investigation: () => RISK_COLORS.LOW,
        }}
      />
    </>
  );
};

// ── Gaps and Limitations ──
const GapsSection = ({ data }) => {
  if (!data) return null;
  return (
    <>
      <SectionHeading>Gaps and Limitations</SectionHeading>
      <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.7 }}>{data}</div>
    </>
  );
};

// ── Recommended Actions ──
const RecommendedActionsSection = ({ data }) => {
  if (!data) return null;
  const tiers = [
    { key: 'immediate', label: 'IMMEDIATE', color: RISK_COLORS.CRITICAL },
    { key: 'shortTerm', label: 'SHORT-TERM', color: RISK_COLORS.MEDIUM },
    { key: 'ongoing', label: 'ONGOING', color: TEXT_MUTED },
  ];
  return (
    <>
      <SectionHeading>Recommended Actions</SectionHeading>
      {tiers.map(tier => {
        const items = data[tier.key];
        if (!items?.length) return null;
        return (
          <div key={tier.key} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
              color: tier.color, marginBottom: 8,
              borderLeft: `2px solid ${tier.color}`, paddingLeft: 12,
            }}>{tier.label}</div>
            <ul style={{ margin: 0, paddingLeft: 28, color: TEXT_PRIMARY, fontSize: 14, lineHeight: 1.8 }}>
              {items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        );
      })}
      {data.bottomLine && (
        <div style={{
          borderLeft: `2px solid ${TEXT_WHITE}`, background: '#2d2d2d',
          padding: '12px 20px', marginTop: 8, borderRadius: 4,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 4 }}>
            Bottom Line
          </div>
          <div style={{ fontSize: 14, color: TEXT_WHITE, lineHeight: 1.6 }}>{data.bottomLine}</div>
        </div>
      )}
    </>
  );
};

// ── Monitoring Schedule ──
const MonitoringScheduleSection = ({ data, userName }) => {
  if (!data) return null;
  return (
    <>
      <SectionHeading>Monitoring Schedule</SectionHeading>
      <Card>
        <KVRow label="Next review" value={data.nextReview} />
        <KVRow label="Trigger events" value={data.triggerEvents} />
        <KVRow label="Assigned to" value={userName || data.assignedTo || 'Unassigned'} />
      </Card>
    </>
  );
};

// ══════════════════════════════════════
// TAB CONFIG
// ══════════════════════════════════════
const TAB_CONFIG = [
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'evidence', label: 'Evidence', icon: Search },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'patterns', label: 'Patterns', icon: Fingerprint },
  { id: 'actions', label: 'Actions', icon: Lightbulb },
  { id: 'audit', label: 'Audit', icon: Shield },
];

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════
const ReportTabs = React.memo(({ content, darkMode = true, networkGraphs, kycData, reportData, userName, exportAllAsPdf }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const r = reportData || {};

  // Count non-empty sections per tab for badges
  const tabCounts = {};
  tabCounts.summary = [r.entitySummary, r.matchConfidence, r.overallRisk, r.criticalFindings?.length, r.riskScoreBreakdown?.length].filter(Boolean).length;
  tabCounts.evidence = [r.redFlags?.length, r.adverseMedia?.length, r.designationTimeline?.length, r.regulatoryContext?.length, r.generalLicenses?.length].filter(Boolean).length;
  tabCounts.network = [r.entityNetwork?.length || r.corporateStructure, r.ownershipHistory?.length].filter(Boolean).length;
  tabCounts.patterns = r.typologies?.length || 0;
  tabCounts.actions = [r.recommendedActions, r.financialExposure, r.monitoringSchedule].filter(Boolean).length;
  tabCounts.audit = [r.coverageGap, r.gapsAndLimitations].filter(Boolean).length;

  // PDF export: render all sections sequentially, no tabs
  if (exportAllAsPdf && reportData) {
    const dividerStyle = {
      fontSize: 16, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
      color: '#111', marginTop: 40, marginBottom: 16, paddingBottom: 8,
      borderBottom: '2px solid #d4d4d4', fontFamily: 'inherit',
    };
    const S = ({ children }) => <div data-pdf-section="">{children}</div>;
    return (
      <div style={{ padding: 20, width: 800 }}>
        {/* Summary */}
        <S><h1 style={dividerStyle}>Summary</h1></S>
        <S><EntitySummarySection data={r.entitySummary} /></S>
        <S><MatchConfidenceSection data={r.matchConfidence} /></S>
        <S><MatchConfidenceDetails data={r.matchConfidence} /></S>
        <S><OverallRiskSection data={r.overallRisk} /></S>
        <S><CriticalFindingsSection data={r.criticalFindings} /></S>
        <S><RiskBreakdownSection data={r.riskScoreBreakdown} totalScore={r.overallRisk?.score} totalLevel={r.overallRisk?.level} /></S>

        {/* Evidence */}
        <S><h1 style={dividerStyle}>Evidence</h1></S>
        <S><RedFlagsSection data={r.redFlags} /></S>
        <S><AdverseMediaSection data={r.adverseMedia} /></S>
        <S><DesignationTimelineSection data={r.designationTimeline} /></S>
        <S><RegulatoryContextSection data={r.regulatoryContext} /></S>
        <S><GeneralLicensesSection data={r.generalLicenses} /></S>

        {/* Network */}
        <S><h1 style={dividerStyle}>Network</h1></S>
        <S><EntityNetworkSection data={r.entityNetwork} forPdf ownership={r.corporateStructure} /></S>
        <S><OwnershipHistorySection data={r.ownershipHistory} /></S>

        {/* Patterns */}
        <S><h1 style={dividerStyle}>Patterns</h1></S>
        <S><TypologiesSection data={r.typologies} /></S>

        {/* Actions */}
        <S><h1 style={dividerStyle}>Recommended Actions</h1></S>
        <S><RecommendedActionsSection data={r.recommendedActions} /></S>
        <S><FinancialExposureSection data={r.financialExposure} /></S>
        <S><MonitoringScheduleSection data={r.monitoringSchedule} userName={userName} /></S>

        {/* Audit */}
        <S><h1 style={dividerStyle}>Audit</h1></S>
        <S><CoverageGapSection data={r.coverageGap} /></S>
        <S><GapsSection data={r.gapsAndLimitations} /></S>
      </div>
    );
  }

  // JSON renderer for each tab
  const renderJsonTab = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <>
            <EntitySummarySection data={r.entitySummary} />
            <MatchConfidenceSection data={r.matchConfidence} />
            <MatchConfidenceDetails data={r.matchConfidence} />
            <OverallRiskSection data={r.overallRisk} />
            <CriticalFindingsSection data={r.criticalFindings} />
            <RiskBreakdownSection data={r.riskScoreBreakdown} totalScore={r.overallRisk?.score} totalLevel={r.overallRisk?.level} />
            {kycData && <KYCRiskHeader data={kycData} />}
          </>
        );
      case 'evidence':
        return (
          <>
            <RedFlagsSection data={r.redFlags} />
            <AdverseMediaSection data={r.adverseMedia} />
            <DesignationTimelineSection data={r.designationTimeline} />
            <RegulatoryContextSection data={r.regulatoryContext} />
            <GeneralLicensesSection data={r.generalLicenses} />
            {kycData && (
              <>
                <KYCSanctionsCard data={kycData} />
                <KYCPEPCard data={kycData} />
                <KYCAdverseMediaCard data={kycData} />
              </>
            )}
          </>
        );
      case 'network':
        return (
          <>
            <EntityNetworkSection data={r.entityNetwork} ownership={r.corporateStructure} />
            <OwnershipHistorySection data={r.ownershipHistory} />
            {kycData && <KYCOwnershipSection data={kycData} />}
            {networkGraphs && networkGraphs.length > 0 && (
              <div style={{ marginTop: 16 }}>{networkGraphs}</div>
            )}
          </>
        );
      case 'patterns':
        return <TypologiesSection data={r.typologies} />;
      case 'actions':
        return (
          <>
            <RecommendedActionsSection data={r.recommendedActions} />
            <FinancialExposureSection data={r.financialExposure} />
            <MonitoringScheduleSection data={r.monitoringSchedule} userName={userName} />
            {kycData && (
              <>
                <KYCRegulatoryCard data={kycData} />
                <KYCRecommendationsCard data={kycData} />
              </>
            )}
          </>
        );
      case 'audit':
        return (
          <>
            <CoverageGapSection data={r.coverageGap} />
            <GapsSection data={r.gapsAndLimitations} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Tab Bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: '#1a1a1a',
        borderBottom: '1px solid #2a2a2a', display: 'flex', gap: 0, padding: '0 4px', marginBottom: 8,
      }}>
        {TAB_CONFIG.map(tab => {
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id] || 0;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
                background: 'transparent', border: 'none',
                borderBottom: isActive ? '2px solid #f59e0b' : '2px solid transparent',
                color: isActive ? '#f59e0b' : '#6b7280',
                fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
                cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#a1a1a1'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = '#6b7280'; }}
            >
              <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span>{tab.label}</span>
              {count > 0 && (
                <span style={{
                  fontSize: 10, color: isActive ? 'rgba(245,158,11,0.6)' : '#4a4a4a', fontWeight: 500,
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: 200 }}>
        {reportData ? (
          renderJsonTab()
        ) : content ? (
          <MarkdownRenderer content={content} darkMode={darkMode} />
        ) : (
          <div style={{
            padding: '40px 20px', textAlign: 'center', color: '#4a4a4a',
            fontSize: 13, fontStyle: 'italic',
          }}>Waiting for data...</div>
        )}
      </div>
    </div>
  );
});

ReportTabs.displayName = 'ReportTabs';

export default ReportTabs;
