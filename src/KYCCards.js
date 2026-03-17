// KYCCards.js — Dark-mode structured KYC card components for ReportTabs
// Renders structured screening data (from /api/screening/unified) alongside agent markdown
import React from 'react';
import NetworkGraph from './NetworkGraph';

// ── Style constants (matching ScoutReport.js) ──
const CARD_BG = '#1a1a1a';
const CARD_BORDER = '#2a2a2a';
const TEXT_PRIMARY = '#e5e5e5';
const TEXT_SECONDARY = '#d1d5db';
const TEXT_MUTED = '#6b7280';

const RISK_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

const RISK_BG = {
  CRITICAL: 'rgba(239, 68, 68, 0.12)',
  HIGH: 'rgba(249, 115, 22, 0.12)',
  MEDIUM: 'rgba(234, 179, 8, 0.12)',
  LOW: 'rgba(34, 197, 94, 0.12)',
};

const cardStyle = {
  background: CARD_BG,
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: '8px',
  padding: '20px 24px',
  marginBottom: '12px',
};

const sectionLabel = {
  fontSize: '10px', fontWeight: 600, color: TEXT_MUTED,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  marginBottom: '6px',
};

const stripMd = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  return str
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .trim();
};

const riskColor = (level) => RISK_COLORS[level] || TEXT_MUTED;
const riskBg = (level) => RISK_BG[level] || 'rgba(107,114,128,0.12)';

// ════════════════════════════════════════════════════════
// SUMMARY TAB — Risk header, score, risk factors
// ════════════════════════════════════════════════════════
export const KYCRiskHeader = ({ data }) => {
  if (!data) return null;
  const risk = data.overallRisk;
  const score = data.riskScore;

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Subject + Risk Badge */}
      <div style={{
        ...cardStyle,
        borderLeft: `3px solid ${riskColor(risk)}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ fontSize: '10px', ...sectionLabel, marginBottom: '8px' }}>SCREENING DATA</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: TEXT_PRIMARY, letterSpacing: '-0.01em' }}>
            {stripMd(data.subject?.name)}
          </div>
          <div style={{ fontSize: '13px', color: TEXT_MUTED, marginTop: '2px', fontFamily: "'JetBrains Mono', monospace" }}>
            {stripMd(data.subject?.type)}
            {data.subject?.jurisdiction && ` · ${stripMd(data.subject.jurisdiction)}`}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {typeof score === 'number' && (
            <div style={{
              fontSize: '28px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
              color: riskColor(risk), lineHeight: 1,
            }}>
              {score}
            </div>
          )}
          <div style={{
            padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
            letterSpacing: '0.08em', color: riskColor(risk),
            background: riskBg(risk),
          }}>
            {risk} RISK
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      {data.riskFactors && data.riskFactors.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '-4px', marginBottom: '12px' }}>
          {data.riskFactors.map((rf, i) => (
            <span key={i} style={{
              padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
              color: rf.severity === 'CRITICAL' ? '#ef4444' : TEXT_SECONDARY,
              background: rf.severity === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : '#252525',
              border: `1px solid ${rf.severity === 'CRITICAL' ? 'rgba(239,68,68,0.3)' : CARD_BORDER}`,
            }}>
              {stripMd(rf.factor)}
            </span>
          ))}
        </div>
      )}

      {/* Risk Summary */}
      {data.riskSummary && (
        <div style={{ ...cardStyle, padding: '16px 20px' }}>
          <div style={sectionLabel}>RISK SUMMARY</div>
          <div style={{ fontSize: '13px', color: TEXT_SECONDARY, lineHeight: 1.7 }}>
            {stripMd(data.riskSummary)}
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════
// EVIDENCE TAB — Sanctions, PEP, Adverse Media
// ════════════════════════════════════════════════════════
export const KYCSanctionsCard = ({ data }) => {
  if (!data?.sanctions) return null;
  const s = data.sanctions;

  return (
    <div style={{ ...cardStyle, marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: s.status === 'MATCH' ? 'rgba(239,68,68,0.15)' : '#252525',
          border: `1px solid ${s.status === 'MATCH' ? 'rgba(239,68,68,0.3)' : CARD_BORDER}`,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.status === 'CLEAR' ? TEXT_MUTED : '#ef4444'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT_PRIMARY }}>Sanctions Screening</div>
          <div style={{ fontSize: '12px', color: s.status === 'CLEAR' ? '#6b7280' : '#ef4444' }}>
            {s.status === 'CLEAR' ? 'No direct matches found' :
             s.status === 'POTENTIAL_MATCH' ? 'Potential matches found' : 'Direct match found'}
          </div>
        </div>
        {s.status !== 'CLEAR' && (
          <span style={{
            padding: '3px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
            color: '#fff', background: s.status === 'MATCH' ? '#ef4444' : '#f97316',
            letterSpacing: '0.06em',
          }}>
            {s.status}
          </span>
        )}
      </div>

      {s.matches && s.matches.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {s.matches.map((m, i) => (
            <div key={i} style={{
              background: '#252525', borderRadius: '6px', padding: '14px',
              border: `1px solid ${CARD_BORDER}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>{m.list}</span>
                {m.matchScore != null && (
                  <span style={{
                    fontSize: '11px', fontFamily: "'JetBrains Mono', monospace",
                    color: TEXT_MUTED, background: '#1a1a1a', padding: '2px 8px', borderRadius: '4px',
                  }}>
                    {m.matchScore}% match
                  </span>
                )}
              </div>
              {m.matchedName && (
                <div style={{ fontSize: '13px', color: TEXT_SECONDARY, marginBottom: '4px' }}>
                  Listed as: <span style={{ fontWeight: 600, color: TEXT_PRIMARY }}>{stripMd(m.matchedName)}</span>
                </div>
              )}
              {m.details && (
                <div style={{ fontSize: '12px', color: TEXT_MUTED, lineHeight: 1.6 }}>{stripMd(m.details)}</div>
              )}
              {m.listingDate && (
                <div style={{ fontSize: '11px', color: TEXT_MUTED, marginTop: '6px', fontFamily: "'JetBrains Mono', monospace" }}>
                  Listed: {m.listingDate}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const KYCPEPCard = ({ data }) => {
  if (!data?.pep) return null;
  const p = data.pep;

  return (
    <div style={{ ...cardStyle, marginTop: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#252525', border: `1px solid ${CARD_BORDER}`,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT_PRIMARY }}>PEP Status</div>
          <div style={{ fontSize: '12px', color: p.status === 'CLEAR' ? '#6b7280' : '#f97316' }}>
            {p.status === 'CLEAR' ? 'Not a PEP' : 'PEP indicators found'}
          </div>
        </div>
      </div>

      {p.matches && p.matches.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {p.matches.map((m, i) => (
            <div key={i} style={{
              background: '#252525', borderRadius: '6px', padding: '14px',
              border: `1px solid ${CARD_BORDER}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY }}>
                  {stripMd(m.position || m.name)}
                </span>
                {m.riskLevel && (
                  <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                    color: riskColor(m.riskLevel), background: riskBg(m.riskLevel),
                  }}>
                    {m.riskLevel}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: TEXT_MUTED }}>
                {m.country} {m.status && `· ${m.status}`}
                {m.relationshipToSubject && m.relationshipToSubject !== 'Self' && (
                  <span style={{ color: '#f97316' }}> · {m.relationshipToSubject}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const KYCAdverseMediaCard = ({ data }) => {
  if (!data?.adverseMedia) return null;
  const am = data.adverseMedia;

  return (
    <div style={{ ...cardStyle, marginTop: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#252525', border: `1px solid ${CARD_BORDER}`,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
            <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6z"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT_PRIMARY }}>Adverse Media</div>
          <div style={{ fontSize: '12px', color: am.status === 'CLEAR' ? '#6b7280' : '#f97316' }}>
            {am.status === 'CLEAR' ? 'No adverse media found' :
             `${am.totalArticles || am.articles?.length || 0} article(s) found`}
          </div>
        </div>
        {/* Category breakdown */}
        {am.categories && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {Object.entries(am.categories).filter(([, c]) => c > 0).slice(0, 3).map(([cat, count]) => (
              <span key={cat} style={{
                fontSize: '10px', padding: '2px 6px', borderRadius: '3px',
                background: '#252525', color: TEXT_MUTED, fontFamily: "'JetBrains Mono', monospace",
              }}>
                {cat.replace(/_/g, ' ')}: {count}
              </span>
            ))}
          </div>
        )}
      </div>

      {am.articles && am.articles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {am.articles.map((a, i) => (
            <div key={i} style={{
              background: '#252525', borderRadius: '6px', padding: '14px',
              border: `1px solid ${CARD_BORDER}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY, flex: 1 }}>
                  {stripMd(a.headline)}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, marginLeft: '8px' }}>
                  {a.relevance && (
                    <span style={{
                      fontSize: '10px', padding: '2px 6px', borderRadius: '3px', fontWeight: 600,
                      color: a.relevance === 'HIGH' ? '#ef4444' : a.relevance === 'MEDIUM' ? '#f97316' : TEXT_MUTED,
                      background: a.relevance === 'HIGH' ? 'rgba(239,68,68,0.12)' : '#1a1a1a',
                    }}>
                      {a.relevance}
                    </span>
                  )}
                  {a.date && (
                    <span style={{ fontSize: '10px', color: TEXT_MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
                      {a.date}
                    </span>
                  )}
                </div>
              </div>
              {a.summary && (
                <div style={{ fontSize: '12px', color: TEXT_MUTED, lineHeight: 1.6, marginBottom: '6px' }}>
                  {stripMd(a.summary)}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', color: TEXT_MUTED }}>
                {a.source && <span>{a.source}</span>}
                {a.category && (
                  <span style={{
                    padding: '1px 6px', borderRadius: '3px', background: '#1a1a1a',
                    fontSize: '10px',
                  }}>
                    {a.category}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════
// NETWORK TAB — Ownership analysis, beneficial owners, corporate structure
// ════════════════════════════════════════════════════════
export const KYCOwnershipSection = ({ data }) => {
  if (!data?.ownershipAnalysis) return null;
  const oa = data.ownershipAnalysis;

  return (
    <div style={{ marginTop: '16px' }}>
      {/* OFAC 50% Rule Analysis */}
      <div style={{
        ...cardStyle,
        borderLeft: oa.fiftyPercentRuleTriggered ? '3px solid #ef4444' : `3px solid ${CARD_BORDER}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: oa.fiftyPercentRuleTriggered ? 'rgba(239,68,68,0.15)' : '#252525',
            border: `1px solid ${oa.fiftyPercentRuleTriggered ? 'rgba(239,68,68,0.3)' : CARD_BORDER}`,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={oa.fiftyPercentRuleTriggered ? '#ef4444' : TEXT_MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <path d="M18 9a9 9 0 0 1-9 9"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT_PRIMARY }}>OFAC 50% Rule Analysis</span>
              {oa.fiftyPercentRuleTriggered && (
                <span style={{
                  padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 700,
                  color: '#fff', background: '#ef4444', letterSpacing: '0.06em',
                }}>
                  BLOCKED BY OWNERSHIP
                </span>
              )}
            </div>
            {oa.summary && (
              <div style={{ fontSize: '12px', color: TEXT_MUTED, marginTop: '4px', lineHeight: 1.5 }}>
                {stripMd(oa.summary)}
              </div>
            )}
          </div>
        </div>

        {/* Aggregate Blocked Ownership Meter */}
        {typeof oa.aggregateBlockedOwnership === 'number' && (
          <div style={{
            padding: '14px 16px', background: '#252525', borderRadius: '6px', marginBottom: '14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY }}>Aggregate Blocked Ownership</span>
              <span style={{
                fontSize: '14px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                color: oa.aggregateBlockedOwnership >= 50 ? '#ef4444' : oa.aggregateBlockedOwnership > 0 ? '#f97316' : TEXT_MUTED,
              }}>
                {oa.aggregateBlockedOwnership}%
              </span>
            </div>
            <div style={{ height: '8px', background: '#1a1a1a', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '4px', transition: 'width 0.5s',
                width: `${Math.min(oa.aggregateBlockedOwnership, 100)}%`,
                background: oa.aggregateBlockedOwnership >= 50 ? '#ef4444' : oa.aggregateBlockedOwnership > 0 ? '#f97316' : TEXT_MUTED,
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: TEXT_MUTED }}>
              <span>0%</span>
              <span style={{ color: TEXT_SECONDARY, fontWeight: 500 }}>50% Threshold</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Beneficial Owners */}
        {oa.beneficialOwners && oa.beneficialOwners.length > 0 && (
          <div>
            <div style={{ ...sectionLabel, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Beneficial Owners
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {oa.beneficialOwners.map((owner, i) => (
                <div key={i} style={{
                  padding: '14px', borderRadius: '6px',
                  background: owner.sanctionStatus === 'SANCTIONED' ? 'rgba(239,68,68,0.08)' : '#252525',
                  border: `1px solid ${owner.sanctionStatus === 'SANCTIONED' ? 'rgba(239,68,68,0.3)' : CARD_BORDER}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY }}>{stripMd(owner.name)}</span>
                      {owner.pepStatus && (
                        <span style={{
                          padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 600,
                          color: '#f97316', background: 'rgba(249,115,22,0.12)',
                        }}>PEP</span>
                      )}
                      {owner.sanctionStatus === 'SANCTIONED' && (
                        <span style={{
                          padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 700,
                          color: '#fff', background: '#ef4444',
                        }}>SANCTIONED</span>
                      )}
                    </div>
                    <span style={{
                      fontSize: '16px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                      color: owner.sanctionStatus === 'SANCTIONED' ? '#ef4444' : TEXT_PRIMARY,
                    }}>
                      {owner.ownershipPercent}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: TEXT_MUTED }}>
                    {owner.ownershipType && <span>{owner.ownershipType}</span>}
                    {owner.sanctionDetails && <span style={{ color: TEXT_SECONDARY }}>{owner.sanctionDetails}</span>}
                    {owner.source && <span>Source: {owner.source}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ownership Portfolio (individuals) */}
        {data.ownedCompanies && data.ownedCompanies.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ ...sectionLabel, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/>
              </svg>
              Ownership Network ({data.ownedCompanies.length} {data.ownedCompanies.length === 1 ? 'Company' : 'Companies'})
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
              padding: '12px', background: '#252525', borderRadius: '6px', marginBottom: '10px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'JetBrains Mono', monospace" }}>
                  {data.ownedCompanies.length}
                </div>
                <div style={{ fontSize: '10px', color: TEXT_MUTED }}>Total Entities</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#f97316', fontFamily: "'JetBrains Mono', monospace" }}>
                  {data.ownedCompanies.filter(c => c.ownershipPercent >= 50).length}
                </div>
                <div style={{ fontSize: '10px', color: TEXT_MUTED }}>Controlling (≥50%)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>
                  {data.ownedCompanies.filter(c => c.sanctionedOwner).length}
                </div>
                <div style={{ fontSize: '10px', color: TEXT_MUTED }}>Sanctioned</div>
              </div>
            </div>
            <NetworkGraph
              centralEntity={data.subject?.name || ''}
              ownedCompanies={data.ownedCompanies}
              height={350}
              darkMode={true}
            />
          </div>
        )}

        {/* Corporate Structure */}
        {oa.corporateStructure && oa.corporateStructure.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ ...sectionLabel, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/>
              </svg>
              Corporate Network ({oa.corporateStructure.length} Entities)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {oa.corporateStructure.map((entity, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '6px', background: '#252525',
                  border: `1px solid ${entity.sanctionExposure && entity.sanctionExposure !== 'None' ? 'rgba(239,68,68,0.3)' : CARD_BORDER}`,
                }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: TEXT_PRIMARY }}>{stripMd(entity.entity)}</span>
                    <span style={{ fontSize: '11px', color: TEXT_MUTED, marginLeft: '8px' }}>{entity.jurisdiction}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {entity.relationship && (
                      <span style={{ fontSize: '10px', color: TEXT_MUTED }}>{entity.relationship}</span>
                    )}
                    {entity.ownershipPercent != null && (
                      <span style={{
                        fontSize: '12px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                        color: TEXT_SECONDARY,
                      }}>
                        {entity.ownershipPercent}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaks Database Exposure */}
        {oa.leaksExposure && oa.leaksExposure.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ ...sectionLabel, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
              Offshore Leaks Database Matches
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {oa.leaksExposure.map((leak, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: '6px', background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#f97316' }}>{leak.database}</span>
                    {leak.date && (
                      <span style={{ fontSize: '10px', color: TEXT_MUTED, fontFamily: "'JetBrains Mono', monospace" }}>{leak.date}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: TEXT_SECONDARY, lineHeight: 1.6 }}>{stripMd(leak.finding)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════
// ACTIONS TAB — Regulatory guidance, recommendations
// ════════════════════════════════════════════════════════
export const KYCRegulatoryCard = ({ data }) => {
  if (!data?.regulatoryGuidance) return null;
  const rg = data.regulatoryGuidance;

  return (
    <div style={{ ...cardStyle, marginTop: '16px' }}>
      <div style={{ ...sectionLabel, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
          <path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
        </svg>
        REGULATORY GUIDANCE
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <div style={{ padding: '12px', background: '#252525', borderRadius: '6px' }}>
          <div style={{ fontSize: '10px', color: TEXT_MUTED, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>OFAC IMPLICATIONS</div>
          <div style={{ fontSize: '12px', color: TEXT_SECONDARY, lineHeight: 1.5 }}>{stripMd(rg.ofacImplications)}</div>
        </div>
        <div style={{ padding: '12px', background: '#252525', borderRadius: '6px' }}>
          <div style={{ fontSize: '10px', color: TEXT_MUTED, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>DUE DILIGENCE LEVEL</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: rg.dueDiligenceRequired === 'EDD' ? '#ef4444' : TEXT_SECONDARY }}>
            {rg.dueDiligenceRequired === 'EDD' ? 'Enhanced Due Diligence' :
             rg.dueDiligenceRequired === 'SDD' ? 'Simplified Due Diligence' :
             'Standard Due Diligence'}
          </div>
        </div>
        <div style={{ padding: '12px', background: '#252525', borderRadius: '6px' }}>
          <div style={{ fontSize: '10px', color: TEXT_MUTED, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>FILING REQUIREMENTS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {rg.filingRequirements?.length > 0 ? rg.filingRequirements.map((req, i) => (
              <span key={i} style={{
                fontSize: '10px', padding: '2px 6px', borderRadius: '3px',
                background: '#1a1a1a', color: TEXT_SECONDARY, border: `1px solid ${CARD_BORDER}`,
              }}>
                {stripMd(req)}
              </span>
            )) : (
              <span style={{ fontSize: '12px', color: TEXT_MUTED }}>None required</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const KYCRecommendationsCard = ({ data }) => {
  if (!data?.recommendations || data.recommendations.length === 0) return null;

  const priorityColors = {
    HIGH: { border: '#ef4444', bg: 'rgba(239,68,68,0.06)', text: '#ef4444' },
    MEDIUM: { border: '#f97316', bg: 'rgba(249,115,22,0.06)', text: '#f97316' },
    LOW: { border: CARD_BORDER, bg: '#252525', text: TEXT_MUTED },
  };

  return (
    <div style={{ ...cardStyle, marginTop: '12px' }}>
      <div style={{ ...sectionLabel, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
        </svg>
        RECOMMENDATIONS
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.recommendations.map((rec, i) => {
          const pc = priorityColors[rec.priority] || priorityColors.LOW;
          return (
            <div key={i} style={{
              padding: '14px', borderRadius: '6px', borderLeft: `3px solid ${pc.border}`,
              background: pc.bg,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                  color: pc.text, letterSpacing: '0.06em',
                }}>
                  {rec.priority}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY }}>
                  {stripMd(rec.action)}
                </span>
              </div>
              {rec.rationale && (
                <div style={{ fontSize: '12px', color: TEXT_MUTED, lineHeight: 1.6 }}>
                  {stripMd(rec.rationale)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
