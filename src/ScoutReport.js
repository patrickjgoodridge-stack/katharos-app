import React from 'react';

// ═══════════════════════════════════════════════════════════════
// SCOUT REPORT — Greyscale visual formatter for markdown output
// Preserves all content verbatim. Only applies visual formatting.
// ═══════════════════════════════════════════════════════════════

const CARD_BG = '#1a1a1a';
const CARD_BORDER = '#2a2a2a';
const TEXT_PRIMARY = '#ffffff';
const TEXT_SECONDARY = '#d1d5db';
const TEXT_MUTED = '#6b7280';
const FONT = "'Inter', system-ui, -apple-system, sans-serif";

// Risk accent colors
const RISK_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

const RISK_BG = {
  CRITICAL: '#7f1d1d',
  HIGH: '#422006',
  MEDIUM: '#422006',
  LOW: 'rgba(34, 197, 94, 0.12)',
};

const RISK_BORDER = {
  CRITICAL: '#dc2626',
  HIGH: '#d97706',
  MEDIUM: '#ca8a04',
  LOW: '#166534',
};

// Detect risk level from text
const detectRiskLevel = (text) => {
  if (!text) return null;
  if (/\b(BLOCKED|REJECT|DO\s+NOT\s+TRANSACT)\b/i.test(text)) return 'CRITICAL';
  const m = text.match(/\b(CRITICAL|HIGH|MEDIUM|LOW)\b/i);
  return m ? m[1].toUpperCase() : null;
};

const cardStyle = {
  background: CARD_BG,
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: '8px',
  padding: '20px 24px',
  marginBottom: '12px',
};

const sectionLabelStyle = {
  fontSize: '10px', fontWeight: 600, color: TEXT_MUTED,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  marginBottom: '14px',
};

const bodyTextStyle = {
  fontSize: '14px', color: TEXT_SECONDARY, lineHeight: 1.7,
  letterSpacing: '0.01em',
};

// ── Inline markdown parser (bold, links, code) ──
const renderInline = (text) => {
  if (!text) return null;
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/s) || remaining.match(/^(.*?)__(.+?)__/s);
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)/);
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`/);

    const matches = [
      boldMatch && { type: 'bold', index: boldMatch[1].length, match: boldMatch },
      linkMatch && { type: 'link', index: linkMatch[1].length, match: linkMatch },
      codeMatch && { type: 'code', index: codeMatch[1].length, match: codeMatch },
    ].filter(Boolean).sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    const first = matches[0];
    if (first.match[1]) {
      parts.push(<span key={key++}>{first.match[1]}</span>);
    }

    if (first.type === 'bold') {
      parts.push(<span key={key++} style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>{first.match[2]}</span>);
      remaining = remaining.slice(first.match[0].length);
    } else if (first.type === 'link') {
      parts.push(
        <a key={key++} href={first.match[3]} target="_blank" rel="noopener noreferrer"
          style={{ color: '#9ca3af', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          {first.match[2]}
        </a>
      );
      remaining = remaining.slice(first.match[0].length);
    } else if (first.type === 'code') {
      parts.push(
        <code key={key++} style={{
          background: '#2a2a2a', padding: '2px 6px', borderRadius: '3px',
          fontSize: '12px', fontFamily: 'monospace', color: TEXT_SECONDARY,
        }}>{first.match[2]}</code>
      );
      remaining = remaining.slice(first.match[0].length);
    }
  }

  return parts;
};

// ── Parse markdown into blocks ──
const parseBlocks = (markdown) => {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    // Headers
    const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2].replace(/[*_]/g, '');
      const content = [];
      i++;
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        if (nextLine.match(/^#{1,4}\s+/)) break;
        if (nextLine) content.push(lines[i]);
        else if (content.length > 0) content.push('');
        i++;
      }
      blocks.push({ type: 'section', level, title: text, content: content.join('\n').trim() });
      continue;
    }

    // Table
    if (trimmed.startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      blocks.push({ type: 'table', lines: tableLines });
      continue;
    }

    // Numbered list
    if (trimmed.match(/^\d+[.)]\s/)) {
      const items = [];
      while (i < lines.length && lines[i].trim().match(/^\d+[.)]\s/)) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s*/, ''));
        i++;
      }
      blocks.push({ type: 'numbered', items });
      continue;
    }

    // Bullet list
    if (trimmed.match(/^[-*]\s/)) {
      const items = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s/)) {
        items.push(lines[i].trim().replace(/^[-*]\s*/, ''));
        i++;
      }
      blocks.push({ type: 'bullets', items });
      continue;
    }

    // Callout detection
    if (trimmed.match(/(?:IMMEDIATE\s+REJECT|DO\s+NOT\s+TRANSACT|BLOCKED|CRITICAL\s+RISK|APPROVE\s+WITH\s+CAUTION)/i) && !trimmed.startsWith('#')) {
      const calloutLines = [trimmed];
      i++;
      while (i < lines.length && lines[i].trim() && !lines[i].trim().match(/^#{1,4}\s+/) && !lines[i].trim().startsWith('|')) {
        calloutLines.push(lines[i].trim());
        i++;
      }
      blocks.push({ type: 'callout', text: calloutLines.join('\n') });
      continue;
    }

    // Horizontal rule
    if (trimmed.match(/^[-*_]{3,}$/)) { i++; blocks.push({ type: 'hr' }); continue; }

    // Bottom Line detection
    if (/^bottom\s+line:?\s*/i.test(trimmed)) {
      const blLines = [trimmed.replace(/^bottom\s+line:?\s*/i, '')];
      i++;
      while (i < lines.length && lines[i].trim() && !lines[i].trim().match(/^#{1,4}\s+/) && !lines[i].trim().startsWith('|')) {
        blLines.push(lines[i].trim());
        i++;
      }
      blocks.push({ type: 'bottomLine', text: blLines.join(' ').trim() });
      continue;
    }

    // Plain paragraph
    const paraLines = [];
    while (i < lines.length && lines[i].trim() && !lines[i].trim().match(/^#{1,4}\s+/) && !lines[i].trim().startsWith('|') && !lines[i].trim().match(/^[-*]\s/) && !lines[i].trim().match(/^\d+[.)]\s/) && !lines[i].trim().match(/^[-*_]{3,}$/)) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
    }
  }

  return blocks;
};

// ── Parse table lines into headers + rows ──
const parseTable = (tableLines) => {
  if (tableLines.length < 2) return { headers: [], rows: [] };
  const parseLine = (line) => line.split('|').map(c => c.trim()).filter(Boolean);
  const headers = parseLine(tableLines[0]);
  const dataStart = tableLines[1].match(/^[\s|:-]+$/) ? 2 : 1;
  const rows = tableLines.slice(dataStart).map(parseLine);
  return { headers, rows };
};

// ── Render a content string that may contain tables, lists, paragraphs ──
const renderContent = (content) => {
  if (!content) return null;
  const blocks = parseBlocks(content);
  return blocks.map((block, i) => renderBlock(block, i));
};

// ── Render a single block ──
const renderBlock = (block, idx) => {
  switch (block.type) {
    case 'section': {
      const hasContent = block.content && block.content.trim();
      return (
        <div key={idx} style={cardStyle}>
          <div style={sectionLabelStyle}>{block.title}</div>
          {hasContent && renderContent(block.content)}
        </div>
      );
    }

    case 'table': {
      const { headers, rows } = parseTable(block.lines);
      return (
        <table key={idx} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
          <thead>
            <tr>
              {headers.map((h, hi) => (
                <th key={hi} style={{
                  padding: '10px 12px 10px 0', fontSize: '10px', fontWeight: 600, color: TEXT_MUTED,
                  letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'left',
                  borderBottom: `1px solid ${CARD_BORDER}`,
                }}>{h.replace(/\*{1,2}/g, '')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: ri < rows.length - 1 ? `1px solid #1f1f1f` : 'none' }}>
                {row.map((cell, ci) => {
                  const cleaned = cell.replace(/\*{1,2}/g, '');
                  const isScore = /^[+]?\d+$/.test(cleaned.trim());
                  const scoreVal = isScore ? parseInt(cleaned.trim().replace('+', '')) : 0;
                  const risk = detectRiskLevel(cleaned);
                  let cellColor = ci === 0 ? '#e5e7eb' : TEXT_SECONDARY;
                  if (isScore && scoreVal > 0) cellColor = '#ef4444';
                  if (risk) cellColor = RISK_COLORS[risk];
                  return (
                    <td key={ci} style={{
                      padding: '14px 12px 14px 0', fontSize: '13px',
                      color: cellColor,
                      fontWeight: ci === 0 || isScore || risk ? 500 : 400,
                      letterSpacing: '0.01em',
                    }}>{renderInline(cleaned)}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    case 'bullets':
      return (
        <div key={idx} style={{ marginBottom: '8px' }}>
          {block.items.map((item, ii) => (
            <div key={ii} style={{
              padding: '8px 0 8px 16px', ...bodyTextStyle,
              borderBottom: ii < block.items.length - 1 ? `1px solid #1f1f1f` : 'none',
            }}>
              {renderInline(item)}
            </div>
          ))}
        </div>
      );

    case 'numbered':
      return (
        <div key={idx} style={{ marginBottom: '8px' }}>
          {block.items.map((item, ii) => {
            // Split on first ** bold ** to get title vs body
            const boldSplit = item.match(/^\*\*(.+?)\*\*[:\s—-]*(.*)/s);
            return (
              <div key={ii} style={{
                display: 'flex', gap: '12px', padding: '12px 0',
                borderBottom: ii < block.items.length - 1 ? `1px solid #1f1f1f` : 'none',
              }}>
                <span style={{ minWidth: '28px', color: '#d97706', fontWeight: 600, fontSize: '15px', flexShrink: 0 }}>{ii + 1}</span>
                <div style={{ flex: 1 }}>
                  {boldSplit ? (
                    <>
                      <div style={{ color: TEXT_PRIMARY, fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>{boldSplit[1]}</div>
                      {boldSplit[2] && <div style={{ ...bodyTextStyle, fontSize: '13px' }}>{renderInline(boldSplit[2])}</div>}
                    </>
                  ) : (
                    <div style={{ ...bodyTextStyle }}>{renderInline(item)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );

    case 'callout': {
      const risk = detectRiskLevel(block.text);
      const bg = risk ? RISK_BG[risk] : '#222';
      const border = risk ? RISK_BORDER[risk] : '#333';
      const textColor = risk ? RISK_COLORS[risk] : TEXT_PRIMARY;
      return (
        <div key={idx} style={{
          background: bg, border: `1px solid ${border}`, borderRadius: '8px',
          padding: '16px 24px', marginBottom: '12px',
        }}>
          <div style={{ fontSize: '15px', color: textColor, lineHeight: 1.7, fontWeight: 600, letterSpacing: '0.02em' }}>
            {renderInline(block.text)}
          </div>
        </div>
      );
    }

    case 'bottomLine':
      return (
        <div key={idx} style={cardStyle}>
          <div style={sectionLabelStyle}>Bottom Line</div>
          <p style={{ ...bodyTextStyle, margin: 0 }}>{renderInline(block.text)}</p>
        </div>
      );

    case 'paragraph':
      return (
        <p key={idx} style={{ ...bodyTextStyle, margin: '0 0 8px 0' }}>
          {renderInline(block.text)}
        </p>
      );

    case 'hr':
      return <hr key={idx} style={{ border: 'none', borderTop: `1px solid ${CARD_BORDER}`, margin: '8px 0' }} />;

    default:
      return null;
  }
};

// ── Urgency tier colors for Recommended Actions ──
const URGENCY = {
  IMMEDIATE: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', border: '#7f1d1d' },
  'SHORT-TERM': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', border: '#78350f' },
  ONGOING: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.06)', border: '#374151' },
};

// ── Render Recommended Actions with urgency tiers ──
const renderActionsSection = (content) => {
  if (!content) return null;
  const contentBlocks = parseBlocks(content);
  // Find numbered list
  const numberedBlock = contentBlocks.find(b => b.type === 'numbered');
  const otherBlocks = contentBlocks.filter(b => b.type !== 'numbered');
  if (!numberedBlock) return renderContent(content);

  const items = numberedBlock.items;
  // Split into tiers: 1-3 immediate, 4-5 short-term, 6+ ongoing
  const tiers = [
    { label: 'IMMEDIATE', items: items.slice(0, 3) },
    { label: 'SHORT-TERM', items: items.slice(3, 5) },
    { label: 'ONGOING', items: items.slice(5) },
  ].filter(t => t.items.length > 0);

  return (
    <>
      {otherBlocks.map((b, i) => renderBlock(b, i))}
      {tiers.map((tier, ti) => {
        const u = URGENCY[tier.label] || URGENCY.ONGOING;
        return (
          <div key={ti} style={{ marginBottom: ti < tiers.length - 1 ? '12px' : 0 }}>
            <div style={{
              fontSize: '9px', fontWeight: 700, color: u.color,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              marginBottom: '8px', paddingLeft: '2px',
            }}>{tier.label}</div>
            {tier.items.map((item, ii) => {
              const boldSplit = item.match(/^\*\*(.+?)\*\*[:\s—-]*(.*)/s);
              return (
                <div key={ii} style={{
                  background: u.bg, borderLeft: `3px solid ${u.color}`, borderRadius: '4px',
                  padding: '10px 16px', marginBottom: '6px',
                }}>
                  {boldSplit ? (
                    <>
                      <div style={{ color: TEXT_PRIMARY, fontWeight: 500, fontSize: '13px' }}>{boldSplit[1]}</div>
                      {boldSplit[2] && <div style={{ ...bodyTextStyle, fontSize: '12px', marginTop: '2px' }}>{renderInline(boldSplit[2])}</div>}
                    </>
                  ) : (
                    <div style={{ ...bodyTextStyle, fontSize: '13px' }}>{renderInline(item)}</div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
};

// ── Render Match Confidence with separated label/value and styled sublabels ──
const renderConfidenceSection = (title, content) => {
  if (!content) return null;
  // Extract confidence level and percentage from title
  const confMatch = title.match(/match\s+confidence:?\s*(HIGH|MEDIUM|LOW)\s*(?:[—-]\s*)?(\d+%?)?/i);
  const confLevel = confMatch ? confMatch[1].toUpperCase() : null;
  const confPct = confMatch ? confMatch[2] : null;
  const confColor = confLevel === 'HIGH' ? '#22c55e' : confLevel === 'MEDIUM' ? '#eab308' : confLevel === 'LOW' ? '#ef4444' : TEXT_SECONDARY;

  const contentBlocks = parseBlocks(content);

  return (
    <>
      {/* Header row: label + badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={sectionLabelStyle}>Match Confidence</div>
        {confLevel && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: confColor }}>{confLevel}</span>
            {confPct && <span style={{ fontSize: '14px', color: TEXT_MUTED }}>— {confPct}</span>}
          </div>
        )}
      </div>
      {/* Content with sublabels */}
      {contentBlocks.map((block, bi) => {
        // Detect sublabels like "Factors supporting match" or "Factors reducing confidence"
        if (block.type === 'section' && /factors?\s+(supporting|reducing|against)/i.test(block.title)) {
          const subContent = block.content ? parseBlocks(block.content) : [];
          return (
            <div key={bi} style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '10px', fontWeight: 600, color: TEXT_MUTED,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                marginBottom: '8px',
              }}>{block.title}</div>
              {subContent.map((sb, si) => {
                if (sb.type === 'bullets') {
                  return (
                    <div key={si}>
                      {sb.items.map((item, ii) => (
                        <div key={ii} style={{
                          padding: '8px 0 8px 12px', ...bodyTextStyle, fontSize: '13px',
                          borderLeft: `2px solid ${CARD_BORDER}`,
                          marginBottom: ii < sb.items.length - 1 ? '4px' : 0,
                        }}>
                          {renderInline(item)}
                        </div>
                      ))}
                    </div>
                  );
                }
                return renderBlock(sb, si);
              })}
            </div>
          );
        }
        // Regular sub-content
        if (block.type === 'bullets') {
          return (
            <div key={bi}>
              {block.items.map((item, ii) => (
                <div key={ii} style={{
                  padding: '8px 0 8px 12px', ...bodyTextStyle, fontSize: '13px',
                  borderLeft: `2px solid ${CARD_BORDER}`,
                  marginBottom: ii < block.items.length - 1 ? '4px' : 0,
                }}>
                  {renderInline(item)}
                </div>
              ))}
            </div>
          );
        }
        return renderBlock(block, bi);
      })}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const ScoutReport = ({ content }) => {
  if (!content) return null;

  // Strip hidden JSON blocks
  const cleaned = content.replace(/<!--REPORT_JSON:[\s\S]*?-->/g, '').trim();

  // Parse all top-level blocks
  const allBlocks = parseBlocks(cleaned);

  // Filter out Adverse Media and Sources sections
  const blocks = allBlocks.filter(b =>
    !(b.type === 'section' && /adverse\s+media|sources\s*[&and]*\s*references|references\s*[&and]*\s*sources|^sources$/i.test(b.title))
  );

  // ── Extract special elements for ordered layout ──
  // 1. Overall Risk banner
  const riskSection = blocks.find(b => b.type === 'section' && /overall\s+risk/i.test(b.title));

  // 2. Callout blocks (BLOCKED, REJECT, etc.)
  const calloutBlocks = blocks.filter(b => b.type === 'callout');

  // 3. Bottom Line (can be a standalone block or inside a section's content)
  let bottomLineText = null;
  const bottomLineBlock = blocks.find(b => b.type === 'bottomLine');
  if (bottomLineBlock) {
    bottomLineText = bottomLineBlock.text;
  } else {
    // Check inside section content for "Bottom Line:" pattern
    for (const b of blocks) {
      if (b.type === 'section' && b.content) {
        const blMatch = b.content.match(/(?:^|\n)\*?\*?Bottom\s+Line:?\*?\*?\s*(.+?)(?:\n\n|\n(?=##)|$)/is);
        if (blMatch) {
          bottomLineText = blMatch[1].trim();
          // Remove bottom line from section content so it doesn't render twice
          b.content = b.content.replace(/(?:^|\n)\*?\*?Bottom\s+Line:?\*?\*?\s*.+?(?:\n\n|\n(?=##)|$)/is, '\n').trim();
        }
      }
    }
  }

  // 4. Summary paragraphs (non-section blocks before first section, excluding callouts/bottomLine)
  const firstSectionIdx = blocks.findIndex(b => b.type === 'section' && !/overall\s+risk/i.test(b.title));
  const summaryBlocks = [];
  for (let si = 0; si < (firstSectionIdx >= 0 ? firstSectionIdx : blocks.length); si++) {
    const b = blocks[si];
    if (b.type === 'paragraph') summaryBlocks.push(b);
  }

  // 5. Regular sections (everything except risk header, already-extracted callouts/bottomLine/summary)
  const sectionBlocks = blocks.filter(b =>
    b.type === 'section' && !/overall\s+risk/i.test(b.title)
  );

  // Render
  return (
    <div style={{ fontFamily: FONT, maxWidth: '900px', width: '100%' }}>

      {/* 1. RISK BANNER — full width, colored */}
      {riskSection && (() => {
        const risk = detectRiskLevel(riskSection.title);
        const riskColor = risk ? RISK_COLORS[risk] : '#ef4444';
        const riskBg = risk ? RISK_BG[risk] : '#7f1d1d';
        const riskBorder = risk ? RISK_BORDER[risk] : '#dc2626';
        return (
          <div style={{
            background: riskBg, border: `1px solid ${riskBorder}`, borderRadius: '8px',
            padding: '20px 24px', marginBottom: '12px',
          }}>
            <div style={{
              fontSize: '18px', fontWeight: 700, color: riskColor,
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              {riskSection.title}
            </div>
            {riskSection.content && (() => {
              // Render risk section content (table, etc.) but strip out bottom line
              const riskContent = riskSection.content.replace(/(?:^|\n)\*?\*?Bottom\s+Line:?\*?\*?\s*.+?(?:\n\n|\n(?=##)|$)/is, '\n').trim();
              return riskContent ? <div style={{ marginTop: '14px' }}>{renderContent(riskContent)}</div> : null;
            })()}
          </div>
        );
      })()}

      {/* 2. CALLOUT BLOCKS — full width, edge to edge */}
      {calloutBlocks.map((block, ci) => {
        const risk = detectRiskLevel(block.text);
        const bg = risk ? RISK_BG[risk] : '#222';
        const border = risk ? RISK_BORDER[risk] : '#333';
        const textColor = risk ? RISK_COLORS[risk] : TEXT_PRIMARY;
        return (
          <div key={`callout-${ci}`} style={{
            background: bg, border: `1px solid ${border}`, borderRadius: '8px',
            padding: '16px 24px', marginBottom: '12px',
          }}>
            <div style={{ fontSize: '15px', color: textColor, lineHeight: 1.7, fontWeight: 600, letterSpacing: '0.02em' }}>
              {renderInline(block.text)}
            </div>
          </div>
        );
      })}

      {/* 3. BOTTOM LINE — its own card, right after banners */}
      {bottomLineText && (
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>Bottom Line</div>
          <p style={{ ...bodyTextStyle, margin: 0 }}>{renderInline(bottomLineText)}</p>
        </div>
      )}

      {/* 4. SUMMARY — paragraphs before first section, their own card */}
      {summaryBlocks.length > 0 && (
        <div style={cardStyle}>
          {summaryBlocks.map((b, si) => (
            <p key={si} style={{ ...bodyTextStyle, margin: si < summaryBlocks.length - 1 ? '0 0 12px 0' : 0 }}>
              {renderInline(b.text)}
            </p>
          ))}
        </div>
      )}

      {/* 5. SECTIONS — each in its own card, with special renderers */}
      {sectionBlocks.map((section, si) => {
        const hasContent = section.content && section.content.trim();
        const isActions = /recommended\s+actions?|action\s+items?/i.test(section.title);
        const isConfidence = /match\s+confidence/i.test(section.title);

        if (isConfidence) {
          return (
            <div key={`sec-${si}`} style={cardStyle}>
              {renderConfidenceSection(section.title, section.content)}
            </div>
          );
        }

        if (isActions) {
          return (
            <div key={`sec-${si}`} style={cardStyle}>
              <div style={sectionLabelStyle}>{section.title}</div>
              {hasContent && renderActionsSection(section.content)}
            </div>
          );
        }

        return (
          <div key={`sec-${si}`} style={cardStyle}>
            <div style={sectionLabelStyle}>{section.title}</div>
            {hasContent && renderContent(section.content)}
          </div>
        );
      })}
    </div>
  );
};

export default ScoutReport;
