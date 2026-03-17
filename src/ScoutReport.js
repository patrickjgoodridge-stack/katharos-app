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
  const m = text.match(/\b(CRITICAL|HIGH|MEDIUM|LOW)\b/i);
  return m ? m[1].toUpperCase() : null;
};

// Color score values: positive = red, zero/dash = muted
const colorScore = (text) => {
  if (!text) return TEXT_MUTED;
  const num = parseInt(text.replace(/[^0-9-]/g, ''));
  if (isNaN(num) || num === 0) return TEXT_MUTED;
  return '#ef4444';
};

const cardStyle = {
  background: CARD_BG,
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '12px',
};

// ── Color risk words in plain text fragments ──
const colorRiskWords = (text, baseKey) => {
  if (!text) return null;
  const parts = [];
  let remaining = text;
  let key = baseKey || 0;

  while (remaining.length > 0) {
    const m = remaining.match(/\b(CRITICAL|HIGH|MEDIUM|LOW)\b/);
    if (!m) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
    if (m.index > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, m.index)}</span>);
    }
    const level = m[1].toUpperCase();
    parts.push(
      <span key={key++} style={{ color: RISK_COLORS[level], fontWeight: 600 }}>{m[1]}</span>
    );
    remaining = remaining.slice(m.index + m[0].length);
  }
  return parts;
};

// ── Inline markdown parser (bold, italic, links, code) ──
const renderInline = (text) => {
  if (!text) return null;
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text** or __text__
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/s) || remaining.match(/^(.*?)__(.+?)__/s);
    // Link: [text](url)
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)/);
    // Inline code: `code`
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`/);

    // Find the earliest match
    const matches = [
      boldMatch && { type: 'bold', index: boldMatch[1].length, match: boldMatch },
      linkMatch && { type: 'link', index: linkMatch[1].length, match: linkMatch },
      codeMatch && { type: 'code', index: codeMatch[1].length, match: codeMatch },
    ].filter(Boolean).sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      parts.push(...(colorRiskWords(remaining, key) || []));
      break;
    }

    const first = matches[0];
    if (first.match[1]) {
      parts.push(...(colorRiskWords(first.match[1], key) || []));
      key += 10;
    }

    if (first.type === 'bold') {
      const boldRisk = detectRiskLevel(first.match[2]);
      const boldColor = boldRisk ? RISK_COLORS[boldRisk] : TEXT_PRIMARY;
      parts.push(<span key={key++} style={{ color: boldColor, fontWeight: boldRisk ? 600 : 500 }}>{first.match[2]}</span>);
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

    // Skip empty lines
    if (!trimmed) { i++; continue; }

    // Headers: ## or ###
    const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2].replace(/[*_]/g, '');
      // Collect content until next header or end
      const content = [];
      i++;
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        if (nextLine.match(/^#{1,4}\s+/)) break;
        if (nextLine) content.push(lines[i]);
        else if (content.length > 0) content.push(''); // preserve paragraph breaks
        i++;
      }
      blocks.push({ type: 'section', level, title: text, content: content.join('\n').trim() });
      continue;
    }

    // Table: starts with |
    if (trimmed.startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      blocks.push({ type: 'table', lines: tableLines });
      continue;
    }

    // Numbered list: 1. or 1)
    if (trimmed.match(/^\d+[.)]\s/)) {
      const items = [];
      while (i < lines.length && lines[i].trim().match(/^\d+[.)]\s/)) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s*/, ''));
        i++;
      }
      blocks.push({ type: 'numbered', items });
      continue;
    }

    // Bullet list: - or *
    if (trimmed.match(/^[-*]\s/)) {
      const items = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s/)) {
        items.push(lines[i].trim().replace(/^[-*]\s*/, ''));
        i++;
      }
      blocks.push({ type: 'bullets', items });
      continue;
    }

    // Callout detection: lines with REJECT, CRITICAL, DO NOT TRANSACT, BLOCKED, APPROVE
    if (trimmed.match(/(?:IMMEDIATE\s+REJECT|DO\s+NOT\s+TRANSACT|BLOCKED|CRITICAL\s+RISK|APPROVE\s+WITH\s+CAUTION)/i) && !trimmed.startsWith('#')) {
      // Collect this line and following paragraph
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
  // Skip separator line (---|---|---)
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
          <div style={{
            fontSize: '11px', fontWeight: 500, color: TEXT_MUTED,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: hasContent ? '14px' : 0,
          }}>
            {block.title}
          </div>
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
                  padding: '8px 10px 8px 0', fontSize: '11px', fontWeight: 500, color: TEXT_MUTED,
                  letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left',
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
                  const risk = detectRiskLevel(cleaned);
                  const scoreColor = colorScore(cleaned);
                  const cellColor = risk ? RISK_COLORS[risk] : (scoreColor !== TEXT_MUTED ? scoreColor : (ci === 0 ? '#e5e7eb' : TEXT_SECONDARY));
                  return (
                    <td key={ci} style={{
                      padding: '10px 10px 10px 0', fontSize: '13px',
                      color: cellColor,
                      fontWeight: ci === 0 || risk || scoreColor !== TEXT_MUTED ? 500 : 400,
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
              padding: '6px 0 6px 16px', fontSize: '13px', color: TEXT_SECONDARY, lineHeight: 1.6,
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
          {block.items.map((item, ii) => (
            <div key={ii} style={{
              display: 'flex', gap: '8px', padding: '8px 0', fontSize: '13px',
              borderBottom: ii < block.items.length - 1 ? `1px solid #1f1f1f` : 'none',
            }}>
              <span style={{ minWidth: '24px', color: TEXT_MUTED, fontWeight: 500, flexShrink: 0 }}>{ii + 1}</span>
              <span style={{ color: TEXT_SECONDARY, lineHeight: 1.6 }}>{renderInline(item)}</span>
            </div>
          ))}
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
          padding: '16px 20px', marginBottom: '8px',
        }}>
          <div style={{ fontSize: '14px', color: textColor, lineHeight: 1.7, fontWeight: 500 }}>
            {renderInline(block.text)}
          </div>
        </div>
      );
    }

    case 'paragraph':
      return (
        <p key={idx} style={{ fontSize: '14px', color: TEXT_SECONDARY, lineHeight: 1.7, margin: '0 0 8px 0' }}>
          {renderInline(block.text)}
        </p>
      );

    case 'hr':
      return <hr key={idx} style={{ border: 'none', borderTop: `1px solid ${CARD_BORDER}`, margin: '8px 0' }} />;

    default:
      return null;
  }
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const ScoutReport = ({ content }) => {
  if (!content) return null;

  // Strip any hidden JSON blocks
  const cleaned = content.replace(/<!--REPORT_JSON:[\s\S]*?-->/g, '').trim();

  // Parse top-level blocks, filter out Adverse Media section
  const blocks = parseBlocks(cleaned).filter(b =>
    !(b.type === 'section' && /adverse\s+media/i.test(b.title))
  );

  // Group blocks: sections get their own cards, consecutive non-section blocks get wrapped in a card
  const groups = [];
  let currentGroup = [];

  for (const block of blocks) {
    if (block.type === 'section') {
      // Flush any pending non-section blocks
      if (currentGroup.length > 0) {
        groups.push({ type: 'card', blocks: currentGroup });
        currentGroup = [];
      }
      groups.push({ type: 'section', block });
    } else if (block.type === 'hr') {
      // Don't wrap HRs in cards
      if (currentGroup.length > 0) {
        groups.push({ type: 'card', blocks: currentGroup });
        currentGroup = [];
      }
    } else {
      currentGroup.push(block);
    }
  }
  if (currentGroup.length > 0) {
    groups.push({ type: 'card', blocks: currentGroup });
  }

  return (
    <div style={{ fontFamily: FONT, maxWidth: '900px', width: '100%' }}>
      {groups.map((group, gi) => {
        if (group.type === 'section') {
          const block = group.block;
          const hasContent = block.content && block.content.trim();
          return (
            <div key={gi} style={cardStyle}>
              <div style={{
                fontSize: '11px', fontWeight: 500, color: TEXT_MUTED,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                marginBottom: hasContent ? '14px' : 0,
              }}>
                {block.title}
              </div>
              {hasContent && renderContent(block.content)}
            </div>
          );
        }
        // Card wrapping loose blocks
        return (
          <div key={gi} style={cardStyle}>
            {group.blocks.map((block, bi) => renderBlock(block, bi))}
          </div>
        );
      })}
    </div>
  );
};

export default ScoutReport;
