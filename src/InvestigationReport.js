import React, { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown, Download, Share2, FolderPlus } from 'lucide-react';

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

const TIER_CONFIG = {
  1: { label: 'Critical', border: CRIT_BORDER, titleColor: CRIT_TEXT },
  2: { label: 'High Risk', border: '#d97706', titleColor: '#f59e0b' },
  3: { label: 'Elevated', border: '#ca8a04', titleColor: TEXT_SECONDARY },
  4: { label: 'Monitor', border: '#374151', titleColor: TEXT_SECONDARY },
};

const BADGE_STYLES = {
  SDN:   { bg: CRIT_BG, color: CRIT_TEXT, border: CRIT_BORDER },
  '1260H': { bg: '#422006', color: '#f59e0b', border: '#d97706' },
  SANCTIONED: { bg: CRIT_BG, color: CRIT_TEXT, border: CRIT_BORDER },
  CLEAN: { bg: 'transparent', color: '#6b7280', border: '#374151' },
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
  if (l === 'HIGH') return '#422006';
  if (l === 'MEDIUM') return '#422006';
  return 'rgba(34, 197, 94, 0.12)';
};

const getRiskBorder = (level) => {
  const l = (level || '').toUpperCase();
  if (l === 'CRITICAL') return CRIT_BORDER;
  if (l === 'HIGH') return '#d97706';
  if (l === 'MEDIUM') return '#ca8a04';
  return '#166534';
};

// ── Entity status badge ──
const StatusBadge = ({ entity }) => {
  const status = entity.badge || entity.status ||
    (entity.sanctioned || entity.sdn ? 'SDN' : 'CLEAN');
  const s = BADGE_STYLES[status.toUpperCase()] || BADGE_STYLES.CLEAN;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '9999px',
      fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {status.toUpperCase()}
    </span>
  );
};

// ── Tier Accordion ──
const TierAccordion = ({ tier, entities }) => {
  const config = TIER_CONFIG[tier] || TIER_CONFIG[4];
  const [open, setOpen] = useState(tier === 1);
  if (!entities || entities.length === 0) return null;

  return (
    <div style={{
      paddingLeft: '14px', marginBottom: '10px', cursor: 'pointer',
      borderLeft: `3px solid ${config.border}`,
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ fontSize: '13px', fontWeight: 500, color: config.titleColor }}>
          Tier {tier} — {config.label}{' '}
          <span style={{ fontWeight: 400, color: TEXT_SECONDARY }}>
            ({entities.length} {entities.length === 1 ? 'entity' : 'entities'})
          </span>
        </span>
        <span style={{ color: TABLE_HEADER, fontSize: '12px' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ marginTop: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Entity', 'Jurisdiction', 'Type', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '8px 0', fontSize: '11px', fontWeight: 500, color: TABLE_HEADER,
                    letterSpacing: '0.08em', textAlign: 'left', borderBottom: `1px solid ${CARD_BORDER}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entities.map((e, i) => (
                <tr key={i} style={{ borderBottom: i < entities.length - 1 ? `1px solid #1f1f1f` : 'none' }}>
                  <td style={{ padding: '10px 0', fontSize: '13px', color: '#e5e7eb', fontWeight: 500 }}>{e.name}</td>
                  <td style={{ padding: '10px 0', fontSize: '13px', color: TEXT_SECONDARY }}>{e.jurisdiction || '—'}</td>
                  <td style={{ padding: '10px 0', fontSize: '13px', color: TEXT_SECONDARY }}>{e.type || e.entity_type || '—'}</td>
                  <td style={{ padding: '10px 0' }}><StatusBadge entity={e} /></td>
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
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#e5e7eb', marginBottom: '6px' }}>
    <div style={{
      width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0, marginTop: '1px',
      border: `1px solid ${color}`,
    }} />
    <span>{text}</span>
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
    coverageGap = null,
    gapsAndLimitations = null,
  } = reportData;

  // Group entities by tier
  const tiers = {};
  for (const e of entities) {
    const t = e.tier || 4;
    if (!tiers[t]) tiers[t] = [];
    tiers[t].push(e);
  }

  // Default score breakdown factors — always show all 8
  const defaultFactors = [
    'OFAC SDN Designation', 'Secondary Sanctions Risk', 'DoD / Entity List Designation',
    'Entity Complexity', 'Adverse Media', 'Enforcement History', 'PEP Exposure', 'Crypto Address Flags',
  ];

  const finalBreakdown = defaultFactors.map(factor => {
    const found = scoreBreakdown.find(s => s.factor === factor);
    return found || { factor, score: '—', reasoning: 'Not applicable' };
  });

  const numericScores = finalBreakdown.filter(r => typeof r.score === 'number' && r.score > 0);
  const subtotal = numericScores.reduce((sum, r) => sum + r.score, 0);

  let sectionIdx = 0;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: '900px', width: '100%', paddingBottom: '80px' }}>

      {/* 1. Subject Chip */}
      <FadeSection index={sectionIdx++} visible={investigationComplete}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <span style={{
            padding: '6px 16px', borderRadius: '9999px', fontSize: '13px',
            background: CARD_BG, border: `1px solid ${CARD_BORDER}`, color: TEXT_SECONDARY,
          }}>
            {subjectName}
          </span>
        </div>
      </FadeSection>

      {/* 2. Risk Banner — square icon box matching mockup */}
      <FadeSection index={sectionIdx++} visible={investigationComplete}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px',
          background: getRiskBg(riskLevel), border: `1px solid ${getRiskBorder(riskLevel)}`,
          borderRadius: '8px', marginBottom: '12px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '6px', flexShrink: 0,
            background: getRiskBorder(riskLevel),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle style={{ width: 16, height: 16, color: '#fff' }} />
          </div>
          <div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: getRiskColor(riskLevel), letterSpacing: '0.05em' }}>
              OVERALL RISK: {riskLevel}
            </span>
            <span style={{ color: riskLevel === 'CRITICAL' ? '#fca5a5' : TEXT_SECONDARY, fontSize: '14px', marginLeft: '8px' }}>
              {riskScore} / 100
            </span>
          </div>
        </div>
      </FadeSection>

      {/* 3. Bottom Line Card — red bookend */}
      {bottomLine && (
        <FadeSection index={sectionIdx++} visible={investigationComplete}>
          <div style={{
            padding: '16px 20px', background: CRIT_BG,
            border: `1px solid ${CRIT_BORDER}`, borderRadius: '8px', marginBottom: '20px',
          }}>
            {bottomLineHeader && (
              <div style={{ fontSize: '13px', fontWeight: 500, color: CRIT_TEXT, letterSpacing: '0.08em', marginBottom: '6px' }}>
                {bottomLineHeader}
              </div>
            )}
            <p style={{ fontSize: '14px', color: '#fecaca', lineHeight: 1.6, margin: 0 }}
              dangerouslySetInnerHTML={{ __html: bottomLine }}
            />
          </div>
        </FadeSection>
      )}

      {/* 4. Investigation Summary */}
      {summary && (
        <FadeSection index={sectionIdx++} visible={investigationComplete}>
          <div style={{
            padding: '20px', background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`, borderRadius: '8px', marginBottom: '12px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: TABLE_HEADER, letterSpacing: '0.1em', marginBottom: '12px' }}>
              INVESTIGATION SUMMARY
            </div>
            <p style={{ fontSize: '14px', color: '#e5e7eb', lineHeight: 1.7, margin: 0 }}
              dangerouslySetInnerHTML={{ __html: summary }}
            />
          </div>
        </FadeSection>
      )}

      {/* 5. Risk Score Breakdown */}
      <FadeSection index={sectionIdx++} visible={investigationComplete}>
        <div style={{
          padding: '20px', background: CARD_BG,
          border: `1px solid ${CARD_BORDER}`, borderRadius: '8px', marginBottom: '12px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: TABLE_HEADER, letterSpacing: '0.1em', marginBottom: '12px' }}>
            RISK SCORE BREAKDOWN
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['Factor', 'Score', 'Reasoning'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 0', color: TABLE_HEADER, fontWeight: 500,
                    fontSize: '11px', letterSpacing: '0.08em', borderBottom: `1px solid ${CARD_BORDER}`,
                  }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {finalBreakdown.map((row, i) => {
                const hasScore = typeof row.score === 'number' && row.score > 0;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid #1f1f1f` }}>
                    <td style={{ padding: '10px 0', color: '#e5e7eb' }}>{row.factor}</td>
                    <td style={{ padding: '10px 0', color: hasScore ? CRIT_TEXT : TABLE_HEADER, fontWeight: hasScore ? 500 : 400 }}>
                      {hasScore ? `+${row.score}` : row.score}
                    </td>
                    <td style={{ padding: '10px 0', color: hasScore ? TEXT_SECONDARY : TABLE_HEADER, fontStyle: hasScore ? 'normal' : 'normal' }}>
                      {row.reasoning}
                    </td>
                  </tr>
                );
              })}
              {/* Subtotal */}
              <tr style={{ borderBottom: `1px solid #1f1f1f`, color: TABLE_HEADER, fontStyle: 'italic' }}>
                <td style={{ padding: '10px 0' }}>Subtotal</td>
                <td style={{ padding: '10px 0' }}>{subtotal}</td>
                <td />
              </tr>
              {/* Cap row */}
              {subtotal > 100 && (
                <tr style={{ borderBottom: `1px solid #1f1f1f`, color: TABLE_HEADER, fontStyle: 'italic' }}>
                  <td style={{ padding: '10px 0' }}>Cap Applied</td>
                  <td style={{ padding: '10px 0' }}>100</td>
                  <td style={{ padding: '10px 0' }}>Maximum possible score</td>
                </tr>
              )}
              {/* Final Score */}
              <tr style={{ borderBottom: 'none' }}>
                <td style={{ padding: '10px 0', color: '#fff', fontWeight: 500 }}>Final Score</td>
                <td style={{ padding: '10px 0', color: getRiskColor(riskLevel), fontWeight: 500 }}>{riskScore}</td>
                <td style={{ padding: '10px 0', color: getRiskColor(riskLevel), fontWeight: 500 }}>{riskLevel}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </FadeSection>

      {/* 6. Entity Network by Tier */}
      {Object.keys(tiers).length > 0 && (
        <FadeSection index={sectionIdx++} visible={investigationComplete}>
          <div style={{
            padding: '20px', background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`, borderRadius: '8px', marginBottom: '12px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: TABLE_HEADER, letterSpacing: '0.1em', marginBottom: '12px' }}>
              ENTITY NETWORK BY TIER
            </div>
            {[1, 2, 3, 4].map(t => tiers[t] ? <TierAccordion key={t} tier={t} entities={tiers[t]} /> : null)}
          </div>
        </FadeSection>
      )}

      {/* 7. Key Findings */}
      {findings.length > 0 && (
        <FadeSection index={sectionIdx++} visible={investigationComplete}>
          <div style={{
            padding: '20px', background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`, borderRadius: '8px', marginBottom: '12px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: TABLE_HEADER, letterSpacing: '0.1em', marginBottom: '12px' }}>
              KEY FINDINGS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {findings.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px' }}>
                  <span style={{
                    color: i < 2 ? CRIT_TEXT : (i < 4 ? '#f59e0b' : TEXT_SECONDARY),
                    fontWeight: 500, fontSize: '13px', minWidth: '20px',
                  }}>{i + 1}</span>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 500, fontSize: '13px', marginBottom: '3px' }}>{f.title}</div>
                    {f.detail && <div style={{ color: TEXT_SECONDARY, fontSize: '13px', lineHeight: 1.5 }}>{f.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeSection>
      )}

      {/* 8. Recommended Actions */}
      {(actions.immediate?.length > 0 || actions.shortTerm?.length > 0 || actions.ongoing?.length > 0) && (
        <FadeSection index={sectionIdx++} visible={investigationComplete}>
          <div style={{
            padding: '20px', background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`, borderRadius: '8px', marginBottom: '12px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: TABLE_HEADER, letterSpacing: '0.1em', marginBottom: '12px' }}>
              RECOMMENDED ACTIONS
            </div>
            {actions.immediate?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, color: CRIT_TEXT, letterSpacing: '0.08em', marginBottom: '8px' }}>IMMEDIATE</div>
                {actions.immediate.map((a, i) => <ActionRow key={i} text={a} color={CRIT_BORDER} />)}
              </div>
            )}
            {actions.shortTerm?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, color: '#f59e0b', letterSpacing: '0.08em', marginBottom: '8px' }}>SHORT-TERM</div>
                {actions.shortTerm.map((a, i) => <ActionRow key={i} text={a} color="#d97706" />)}
              </div>
            )}
            {actions.ongoing?.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: TABLE_HEADER, letterSpacing: '0.08em', marginBottom: '8px' }}>ONGOING</div>
                {actions.ongoing.map((a, i) => <ActionRow key={i} text={a} color="#4b5563" />)}
              </div>
            )}
          </div>
        </FadeSection>
      )}

      {/* 9. Coverage Gap (not in mockup, from current report) */}
      {coverageGap && (
        <FadeSection index={sectionIdx++} visible={investigationComplete}>
          <div style={{
            padding: '20px', background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`, borderRadius: '8px', marginBottom: '12px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: TABLE_HEADER, letterSpacing: '0.1em', marginBottom: '12px' }}>
              COVERAGE GAP
            </div>
            <p style={{ fontSize: '13px', color: '#e5e7eb', lineHeight: 1.6, margin: 0 }}
              dangerouslySetInnerHTML={{ __html: coverageGap }}
            />
          </div>
        </FadeSection>
      )}

      {/* 10. Gaps and Limitations (not in mockup, from current report) */}
      {gapsAndLimitations && (
        <FadeSection index={sectionIdx++} visible={investigationComplete}>
          <div style={{
            padding: '20px', background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`, borderRadius: '8px', marginBottom: '12px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: TABLE_HEADER, letterSpacing: '0.1em', marginBottom: '12px' }}>
              GAPS AND LIMITATIONS
            </div>
            <p style={{ fontSize: '13px', color: TEXT_SECONDARY, lineHeight: 1.6, margin: 0 }}
              dangerouslySetInnerHTML={{ __html: gapsAndLimitations }}
            />
          </div>
        </FadeSection>
      )}

      {/* 11. Investigation Notes (collapsible) */}
      {notes && (
        <FadeSection index={sectionIdx++} visible={investigationComplete}>
          <div
            onClick={() => setNotesOpen(!notesOpen)}
            style={{
              background: '#111', border: `1px solid ${CARD_BORDER}`, borderRadius: '8px',
              padding: '14px 20px', cursor: 'pointer', marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: TABLE_HEADER }}>
                {notesOpen ? 'Hide' : 'Show'} investigation notes
              </span>
              <span style={{ color: TABLE_HEADER, fontSize: '12px' }}>{notesOpen ? '▲' : '▼'}</span>
            </div>
            {notesOpen && (
              <div style={{
                marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${CARD_BORDER}`,
                fontSize: '12px', color: TABLE_HEADER, lineHeight: 1.6, whiteSpace: 'pre-wrap',
              }}>
                {notes}
              </div>
            )}
          </div>
        </FadeSection>
      )}

      {/* 12. Sticky Export Bar */}
      {investigationComplete && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', justifyContent: 'flex-end', gap: '10px',
          padding: '12px 24px',
          background: '#111',
          borderTop: `1px solid ${CARD_BORDER}`,
        }}>
          <button style={{
            background: 'transparent', border: `1px solid ${CARD_BORDER}`, color: TEXT_SECONDARY,
            padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
          }}>
            <Share2 style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Share
          </button>
          <button style={{
            background: 'transparent', border: `1px solid ${CARD_BORDER}`, color: TEXT_SECONDARY,
            padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
          }}>
            <FolderPlus style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Save to Cases
          </button>
          <button style={{
            background: GOLD, border: 'none', color: '#000',
            padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}>
            <Download style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default InvestigationReport;
