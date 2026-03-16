import React, { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Download, Share2, FolderPlus } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// INVESTIGATION REPORT — Scout Mode Report Renderer
// ═══════════════════════════════════════════════════════════════

const GOLD = '#c9a84c';
const CRIT_BG = '#7f1d1d';
const CRIT_TEXT = '#ef4444';
const CRIT_BORDER = '#dc2626';
const CARD_BG = '#1a1a1a';
const CARD_BORDER = '#2a2a2a';
const TEXT_PRIMARY = '#ffffff';
const TEXT_SECONDARY = '#9ca3af';
const TABLE_HEADER = '#6b7280';

const TIER_COLORS = {
  1: { label: 'Critical', border: CRIT_BORDER, bg: 'rgba(220, 38, 38, 0.08)' },
  2: { label: 'High Risk', border: '#f97316', bg: 'rgba(249, 115, 22, 0.08)' },
  3: { label: 'Elevated', border: '#eab308', bg: 'rgba(234, 179, 8, 0.08)' },
  4: { label: 'Monitor', border: '#6b7280', bg: 'rgba(107, 114, 128, 0.08)' },
};

// ── Fade-in section with stagger ──
const FadeSection = ({ children, index, visible }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setShow(true), 100 + index * 120);
    return () => clearTimeout(t);
  }, [visible, index]);
  return (
    <div style={{
      opacity: show ? 1 : 0,
      transform: show ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.6s ease-in-out, transform 0.6s ease-in-out',
    }}>
      {children}
    </div>
  );
};

// ── Risk level helpers ──
const getRiskColor = (level) => {
  const l = (level || '').toUpperCase();
  if (l === 'CRITICAL') return CRIT_TEXT;
  if (l === 'HIGH') return '#f97316';
  if (l === 'MEDIUM') return '#eab308';
  return '#22c55e';
};

const getRiskBg = (level) => {
  const l = (level || '').toUpperCase();
  if (l === 'CRITICAL') return CRIT_BG;
  if (l === 'HIGH') return 'rgba(249, 115, 22, 0.15)';
  if (l === 'MEDIUM') return 'rgba(234, 179, 8, 0.15)';
  return 'rgba(34, 197, 94, 0.15)';
};

// ── Tier Accordion ──
const TierAccordion = ({ tier, entities }) => {
  const config = TIER_COLORS[tier] || TIER_COLORS[4];
  const [open, setOpen] = useState(tier === 1);
  if (!entities || entities.length === 0) return null;

  return (
    <div style={{ border: `1px solid ${CARD_BORDER}`, borderLeft: `3px solid ${config.border}`, borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: config.bg, border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', system-ui" }}>
          Tier {tier} — {config.label} <span style={{ fontWeight: 400, color: TEXT_SECONDARY }}>({entities.length} {entities.length === 1 ? 'entity' : 'entities'})</span>
        </span>
        {open ? <ChevronDown style={{ width: 14, height: 14, color: TEXT_SECONDARY }} /> : <ChevronRight style={{ width: 14, height: 14, color: TEXT_SECONDARY }} />}
      </button>
      {open && (
        <div style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name', 'Jurisdiction', 'Type', 'Role', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 600, color: TABLE_HEADER, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', borderBottom: `1px solid ${CARD_BORDER}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entities.map((e, i) => (
                <tr key={i} style={{ borderBottom: i < entities.length - 1 ? `1px solid ${CARD_BORDER}` : 'none' }}>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: TEXT_PRIMARY, fontWeight: 500 }}>{e.name}</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: TEXT_SECONDARY }}>{e.jurisdiction || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: TEXT_SECONDARY }}>{e.type || e.entity_type || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: TEXT_SECONDARY }}>{e.role || e.connection || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em',
                      background: e.sanctioned || e.sdn ? 'rgba(239, 68, 68, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                      color: e.sanctioned || e.sdn ? CRIT_TEXT : TEXT_SECONDARY,
                    }}>
                      {e.sanctioned || e.sdn ? 'SDN' : 'CLEAN'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Action Checkbox Row ──
const ActionRow = ({ text, color }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0' }}>
    <div style={{
      width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, marginTop: '2px',
      border: `2px solid ${color}`, background: `${color}22`,
    }} />
    <span style={{ fontSize: '13px', color: TEXT_PRIMARY, lineHeight: 1.5 }}>{text}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const InvestigationReport = ({ reportData, investigationComplete, subjectName }) => {
  const [notesOpen, setNotesOpen] = useState(false);

  if (!reportData) return null;

  const {
    riskLevel = 'CRITICAL',
    riskScore = 100,
    bottomLine = '',
    bottomLineHeader = '',
    summary = '',
    scoreBreakdown = [],
    entities = [],
    findings = [],
    actions = {},
    notes = '',
  } = reportData;

  // Group entities by tier
  const tiers = {};
  for (const e of entities) {
    const t = e.tier || 4;
    if (!tiers[t]) tiers[t] = [];
    tiers[t].push(e);
  }

  // Default score breakdown factors
  const defaultFactors = [
    'OFAC SDN Designation', 'Secondary Sanctions Risk', 'DoD / Entity List Designation',
    'Entity Complexity', 'Adverse Media', 'Enforcement History', 'PEP Exposure', 'Crypto Address Flags',
  ];

  const finalBreakdown = defaultFactors.map(factor => {
    const found = scoreBreakdown.find(s => s.factor === factor);
    return found || { factor, score: '—', reasoning: 'Not applicable' };
  });

  // Score subtotal
  const numericScores = finalBreakdown.filter(r => typeof r.score === 'number' && r.score > 0);
  const subtotal = numericScores.reduce((sum, r) => sum + r.score, 0);

  let sectionIdx = 0;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: '720px', width: '100%' }}>

      {/* 1. Subject Chip */}
      <FadeSection index={sectionIdx++} visible={investigationComplete}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <span style={{
            padding: '6px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: 500,
            background: '#242424', border: `1px solid ${CARD_BORDER}`, color: TEXT_PRIMARY,
          }}>
            {subjectName}
          </span>
        </div>
      </FadeSection>

      {/* 2. Risk Banner */}
      <FadeSection index={sectionIdx++} visible={investigationComplete}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px',
          background: getRiskBg(riskLevel), border: `1px solid ${getRiskColor(riskLevel)}`,
          borderRadius: '8px', marginBottom: '12px',
        }}>
          <AlertTriangle style={{ width: 20, height: 20, color: getRiskColor(riskLevel), flexShrink: 0 }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: getRiskColor(riskLevel), letterSpacing: '1px', textTransform: 'uppercase' }}>
            OVERALL RISK: {riskLevel}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '20px', fontWeight: 700, color: getRiskColor(riskLevel) }}>
            {riskScore} / 100
          </span>
        </div>
      </FadeSection>

      {/* 3. Bottom Line Card */}
      {bottomLine && (
        <FadeSection index={sectionIdx++} visible={investigationComplete}>
          <div style={{
            padding: '16px 20px', background: CRIT_BG,
            border: `1px solid ${CRIT_BORDER}`, borderRadius: '8px', marginBottom: '16px',
          }}>
            {bottomLineHeader && (
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '6px', letterSpacing: '0.5px' }}>
                {bottomLineHeader}
              </div>
            )}
            <div style={{ fontSize: '13px', color: '#fca5a5', lineHeight: 1.6 }}>
              {bottomLine}
            </div>
          </div>
        </FadeSection>
      )}

      {/* 4. Investigation Summary */}
      {summary && (
        <FadeSection index={sectionIdx++} visible={investigationComplete}>
          <div style={{
            padding: '16px 20px', background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`, borderRadius: '8px', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '13px', color: TEXT_SECONDARY, lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: summary }}
            />
          </div>
        </FadeSection>
      )}

      {/* 5. Risk Score Breakdown */}
      {finalBreakdown.length > 0 && (
        <FadeSection index={sectionIdx++} visible={investigationComplete}>
          <div style={{
            background: CARD_BG, border: `1px solid ${CARD_BORDER}`,
            borderRadius: '8px', marginBottom: '16px', overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${CARD_BORDER}` }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Risk Score Breakdown</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Factor', 'Score', 'Reasoning'].map(h => (
                    <th key={h} style={{ padding: '8px 16px', fontSize: '10px', fontWeight: 600, color: TABLE_HEADER, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', borderBottom: `1px solid ${CARD_BORDER}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {finalBreakdown.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: TEXT_PRIMARY, fontWeight: 500 }}>{row.factor}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: typeof row.score === 'number' && row.score > 0 ? CRIT_TEXT : TEXT_SECONDARY }}>
                      {typeof row.score === 'number' && row.score > 0 ? `+${row.score}` : row.score}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: TEXT_SECONDARY }}>{row.reasoning}</td>
                  </tr>
                ))}
                {/* Subtotal */}
                <tr style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
                  <td style={{ padding: '10px 16px', fontSize: '13px', color: TEXT_SECONDARY, fontWeight: 600 }}>Subtotal</td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY }}>{subtotal}</td>
                  <td />
                </tr>
                {/* Cap row */}
                {subtotal > 100 && (
                  <tr style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: TEXT_SECONDARY }}>Cap Applied</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: TEXT_SECONDARY }}>100</td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: TEXT_SECONDARY }}>Maximum score capped at 100</td>
                  </tr>
                )}
                {/* Final Score */}
                <tr>
                  <td style={{ padding: '10px 16px', fontSize: '13px', color: TEXT_PRIMARY, fontWeight: 700 }}>Final Score</td>
                  <td style={{ padding: '10px 16px', fontSize: '14px', fontWeight: 700, color: getRiskColor(riskLevel) }}>{riskScore}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </FadeSection>
      )}

      {/* 6. Entity Network by Tier */}
      {Object.keys(tiers).length > 0 && (
        <FadeSection index={sectionIdx++} visible={investigationComplete}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ padding: '0 0 10px 0' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Entity Network by Tier</span>
            </div>
            {[1, 2, 3, 4].map(t => tiers[t] ? <TierAccordion key={t} tier={t} entities={tiers[t]} /> : null)}
          </div>
        </FadeSection>
      )}

      {/* 7. Key Findings */}
      {findings.length > 0 && (
        <FadeSection index={sectionIdx++} visible={investigationComplete}>
          <div style={{
            padding: '16px 20px', background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`, borderRadius: '8px', marginBottom: '16px',
          }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Key Findings</span>
            </div>
            {findings.map((f, i) => (
              <div key={i} style={{ marginBottom: i < findings.length - 1 ? '12px' : 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY, marginBottom: '2px' }}>{i + 1}. {f.title}</div>
                {f.detail && <div style={{ fontSize: '12px', color: TEXT_SECONDARY, lineHeight: 1.6, paddingLeft: '18px' }}>{f.detail}</div>}
              </div>
            ))}
          </div>
        </FadeSection>
      )}

      {/* 8. Recommended Actions */}
      {(actions.immediate?.length > 0 || actions.shortTerm?.length > 0 || actions.ongoing?.length > 0) && (
        <FadeSection index={sectionIdx++} visible={investigationComplete}>
          <div style={{
            padding: '16px 20px', background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`, borderRadius: '8px', marginBottom: '16px',
          }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recommended Actions</span>
            </div>
            {actions.immediate?.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: CRIT_TEXT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Immediate</span>
                {actions.immediate.map((a, i) => <ActionRow key={i} text={a} color={CRIT_TEXT} />)}
              </div>
            )}
            {actions.shortTerm?.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Short-Term</span>
                {actions.shortTerm.map((a, i) => <ActionRow key={i} text={a} color="#f97316" />)}
              </div>
            )}
            {actions.ongoing?.length > 0 && (
              <div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ongoing</span>
                {actions.ongoing.map((a, i) => <ActionRow key={i} text={a} color={TEXT_SECONDARY} />)}
              </div>
            )}
          </div>
        </FadeSection>
      )}

      {/* 9. Investigation Notes (collapsible) */}
      {notes && (
        <FadeSection index={sectionIdx++} visible={investigationComplete}>
          <div style={{ marginBottom: '80px' }}>
            <button
              onClick={() => setNotesOpen(!notesOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '12px', color: TEXT_SECONDARY,
              }}
            >
              {notesOpen ? 'Hide' : 'Show'} investigation notes
              <ChevronDown style={{ width: 12, height: 12, transform: notesOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {notesOpen && (
              <div style={{
                padding: '14px 16px', background: '#111', border: `1px solid ${CARD_BORDER}`,
                borderRadius: '8px', fontSize: '12px', color: '#777', lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}>
                {notes}
              </div>
            )}
          </div>
        </FadeSection>
      )}

      {/* 10. Sticky Export Bar */}
      {investigationComplete && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          padding: '12px 24px',
          background: 'rgba(13, 13, 13, 0.85)',
          backdropFilter: 'blur(12px)',
          borderTop: `1px solid ${CARD_BORDER}`,
        }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: GOLD, color: '#000', fontSize: '13px', fontWeight: 600,
          }}>
            <Download style={{ width: 14, height: 14 }} /> Export PDF
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 20px', borderRadius: '8px', cursor: 'pointer',
            background: 'transparent', border: `1px solid ${CARD_BORDER}`, color: TEXT_SECONDARY, fontSize: '13px', fontWeight: 500,
          }}>
            <FolderPlus style={{ width: 14, height: 14 }} /> Save to Cases
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer',
            background: 'transparent', border: `1px solid ${CARD_BORDER}`, color: TEXT_SECONDARY,
          }}>
            <Share2 style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}
    </div>
  );
};

export default InvestigationReport;
