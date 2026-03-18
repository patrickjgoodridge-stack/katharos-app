// ReportTabs.js — Tabbed report view rendering structured JSON from agent investigations
import React, { useState } from 'react';
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
const SectionHeading = ({ children }) => (
  <h2 style={{
    fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
    color: TEXT_WHITE, marginTop: 32, marginBottom: 16, fontFamily: 'inherit',
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

// ── Overall Risk ──
const OverallRiskSection = ({ data }) => {
  if (!data) return null;
  const color = getRiskColor(data.level);
  return (
    <>
      <div style={{
        background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 8,
        padding: '14px 20px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <AlertTriangle style={{ width: 20, height: 20, color, flexShrink: 0 }} />
        <span style={{ color, fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>
          Overall Risk: {data.level}
        </span>
        <span style={{ color, fontSize: 16, fontWeight: 600, marginLeft: 4 }}>{data.score} / 100</span>
      </div>
      {data.summary && (
        <div style={{ fontSize: 14, color: TEXT_PRIMARY, marginBottom: 16, lineHeight: 1.7 }}>
          <span style={{ fontWeight: 700, color: TEXT_WHITE }}>{data.recommendation}</span>
          {' — '}{data.summary}
        </div>
      )}
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

// ── Risk Score Breakdown ──
const RiskBreakdownSection = ({ data, totalScore, totalLevel }) => {
  if (!data?.length) return null;
  return (
    <>
      <SectionHeading>Risk Score Breakdown</SectionHeading>
      <DarkTable
        columns={[
          { key: 'factor', label: 'Factor', bold: true },
          { key: 'weight', label: 'Weight' },
          { key: 'score', label: 'Score' },
          { key: 'reasoning', label: 'Reasoning' },
        ]}
        rows={[
          ...data,
          { factor: 'Final Score', weight: '100%', score: `${totalScore}/100`, reasoning: totalLevel, _summary: true },
        ]}
        colorRules={{
          weight: () => TEXT_MUTED,
          score: (val, row) => {
            if (row._summary) return TEXT_WHITE;
            const n = typeof val === 'number' ? val : parseInt(val);
            if (n >= 20) return RISK_COLORS.CRITICAL;
            if (n >= 10) return RISK_COLORS.HIGH;
            if (n >= 5) return RISK_COLORS.MEDIUM;
            return RISK_COLORS.LOW;
          },
          factor: (_, row) => row._summary ? TEXT_WHITE : TEXT_PRIMARY,
          reasoning: (_, row) => row._summary ? getRiskColor(row.reasoning) : TEXT_PRIMARY,
        }}
      />
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

// ── Entity Network table ──
const EntityNetworkSection = ({ data }) => {
  if (!data?.length) return null;
  return (
    <>
      <SectionHeading>Entity Network</SectionHeading>
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
        rows={data}
      />
    </>
  );
};

// ── Corporate Structure (visual ownership diagram) ──
const CorporateStructureSection = ({ data }) => {
  if (!data) return null;
  const owners = data.owners || [];
  const subsidiaries = data.subsidiaries || [];
  const BADGE_COLORS = {
    SANCTIONED: RISK_COLORS.CRITICAL, SDN: RISK_COLORS.CRITICAL, CONVICTED: RISK_COLORS.CRITICAL,
    DPA: RISK_COLORS.HIGH, DESIGNATED: RISK_COLORS.HIGH, BLOCKED: RISK_COLORS.CRITICAL,
    'HIGH RISK': RISK_COLORS.HIGH,
  };

  return (
    <>
      <SectionHeading>Ownership Structure</SectionHeading>
      <Card style={{ padding: '24px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: AMBER }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_WHITE }}>Ultimate beneficial owners</span>
          {data.structureType && (
            <span style={{
              fontSize: 11, padding: '2px 10px', borderRadius: 4,
              background: '#2a2a2a', color: TEXT_MUTED, fontWeight: 500,
            }}>{data.structureType}</span>
          )}
        </div>

        {/* Parent entity box */}
        {data.parentEntity && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
            <div style={{
              border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: '10px 24px',
              fontSize: 14, fontWeight: 600, color: TEXT_WHITE, background: '#252525',
            }}>{data.parentEntity}</div>
            {owners.length > 0 && (
              <div style={{ width: 1, height: 24, background: CARD_BORDER }} />
            )}
          </div>
        )}

        {/* Owner boxes */}
        {owners.length > 0 && (
          <>
            {/* Horizontal connector line */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 0 }}>
              <div style={{
                height: 1, background: CARD_BORDER,
                width: `${Math.min(owners.length * 180, 600)}px`,
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 24,
              flexWrap: 'wrap', marginBottom: 16,
            }}>
              {owners.map((owner, i) => {
                const isFlagged = owner.flagged;
                const borderColor = isFlagged ? RISK_COLORS.CRITICAL : CARD_BORDER;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Vertical tick from horizontal line */}
                    <div style={{ width: 1, height: 16, background: CARD_BORDER }} />
                    <div style={{
                      border: `1px solid ${borderColor}`, borderRadius: 8, padding: '12px 20px',
                      minWidth: 140, textAlign: 'center',
                      background: isFlagged ? `${RISK_COLORS.CRITICAL}10` : '#252525',
                    }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600,
                        color: isFlagged ? RISK_COLORS.CRITICAL : TEXT_WHITE,
                      }}>{owner.name}</div>
                    </div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 6, textAlign: 'center' }}>
                      {owner.percentage != null && <span style={{ color: TEXT_PRIMARY }}>{owner.percentage}%</span>}
                      {owner.percentage != null && owner.description && ' — '}
                      {owner.description && (
                        <span style={{ color: isFlagged ? RISK_COLORS.CRITICAL : TEXT_MUTED }}>
                          {owner.description}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Subsidiaries */}
        {subsidiaries.length > 0 && (
          <>
            <div style={{
              borderTop: `1px solid ${CARD_BORDER}`, marginTop: 16, paddingTop: 16,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
                color: TEXT_MUTED, marginBottom: 12,
              }}>Subsidiaries</div>
              {subsidiaries.map((sub, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                  fontSize: 13, color: TEXT_PRIMARY,
                }}>
                  <span style={{ color: TEXT_WHITE, fontWeight: 500 }}>{sub.name}</span>
                  <span style={{ color: TEXT_MUTED }}>({sub.jurisdiction})</span>
                  {sub.ownership && <span style={{ color: TEXT_MUTED }}>· {sub.ownership}</span>}
                  {sub.badges?.map((badge, bi) => (
                    <span key={bi} style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 3, fontWeight: 600,
                      background: `${BADGE_COLORS[badge] || TEXT_MUTED}20`,
                      color: BADGE_COLORS[badge] || TEXT_MUTED,
                    }}>{badge}</span>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Notes */}
        {data.notes && (
          <div style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 6,
            background: '#2d2d2d', fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.6,
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
const ProgramsSection = ({ data }) => {
  if (!data?.length) return null;
  return (
    <>
      <SectionHeading>Programs and Authorities</SectionHeading>
      <DarkTable
        columns={[
          { key: 'reference', label: 'Reference', bold: true },
          { key: 'program', label: 'Program' },
          { key: 'authority', label: 'Authority' },
          { key: 'description', label: 'Description' },
        ]}
        rows={data}
        colorRules={{ reference: () => AMBER }}
      />
    </>
  );
};

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
const MonitoringScheduleSection = ({ data }) => {
  if (!data) return null;
  return (
    <>
      <SectionHeading>Monitoring Schedule</SectionHeading>
      <Card>
        <KVRow label="Next review" value={data.nextReview} />
        <KVRow label="Trigger events" value={data.triggerEvents} />
        <KVRow label="Assigned to" value={data.assignedTo || '—'} />
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
const ReportTabs = React.memo(({ content, darkMode = true, networkGraphs, kycData, reportData }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const r = reportData || {};

  // Count non-empty sections per tab for badges
  const tabCounts = {};
  tabCounts.summary = [r.entitySummary, r.matchConfidence, r.overallRisk, r.criticalFindings?.length, r.riskScoreBreakdown?.length].filter(Boolean).length;
  tabCounts.evidence = [r.redFlags?.length, r.adverseMedia?.length, r.designationTimeline?.length, r.generalLicenses?.length, r.ownershipHistory?.length].filter(Boolean).length;
  tabCounts.network = [r.entityNetwork?.length, r.corporateStructure, r.regulatoryContext?.length].filter(Boolean).length;
  tabCounts.patterns = [r.typologies?.length].filter(Boolean).length;
  tabCounts.actions = [r.recommendedActions, r.financialExposure, r.monitoringSchedule, r.programsAndAuthorities?.length].filter(Boolean).length;
  tabCounts.audit = [r.coverageGap, r.gapsAndLimitations].filter(Boolean).length;

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
            <GeneralLicensesSection data={r.generalLicenses} />
            <OwnershipHistorySection data={r.ownershipHistory} />
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
            <EntityNetworkSection data={r.entityNetwork} />
            <CorporateStructureSection data={r.corporateStructure} />
            <RegulatoryContextSection data={r.regulatoryContext} />
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
            <MonitoringScheduleSection data={r.monitoringSchedule} />
            <ProgramsSection data={r.programsAndAuthorities} />
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
