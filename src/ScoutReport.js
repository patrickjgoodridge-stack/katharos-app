import React, { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
// SCOUT REPORT v2 — all features:
//   fade-in, count-up score, copy to clipboard, expandable rows,
//   flag for review, redline mode, print stylesheet,
//   confidence pulse, audit trail footer
// ═══════════════════════════════════════════════════════════════

const CARD_BG = '#1a1a1a';
const CARD_BORDER = '#2a2a2a';
const TEXT_PRIMARY = '#ffffff';
const TEXT_SECONDARY = '#d1d5db';
const TEXT_MUTED = '#6b7280';
const FONT = "'Inter', system-ui, -apple-system, sans-serif";

const RISK_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' };
const RISK_BG     = { CRITICAL: '#7f1d1d', HIGH: '#422006', MEDIUM: '#422006', LOW: 'rgba(34,197,94,0.12)' };
const RISK_BORDER = { CRITICAL: '#dc2626', HIGH: '#d97706', MEDIUM: '#ca8a04', LOW: '#166534' };

const URGENCY = {
  IMMEDIATE:    { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',    border: '#7f1d1d' },
  'SHORT-TERM': { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   border: '#78350f' },
  ONGOING:      { color: '#6b7280', bg: 'rgba(107,114,128,0.06)',  border: '#374151' },
};

// SDN / offshore / date patterns for redline highlighting
const REDLINE_PATTERNS = [
  { re: /\b(SDN|OFAC|FTO|SDGT|EO\s*\d{4,5}|Executive Order \d{4,5})\b/g,                                      color: '#ef4444' },
  { re: /\b(BVI|British Virgin Islands|Cayman Islands|Panama|Cyprus|Isle of Man|Liechtenstein|Jersey|Bermuda|Seychelles|Malta|Luxembourg|Delaware)\b/g, color: '#f97316' },
  { re: /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g, color: '#a78bfa' },
];

// —— Helpers ——————————————————————————————————————————————————
const detectRiskLevel = (text) => {
  if (!text) return null;
  if (/\b(BLOCKED|REJECT|DO\s+NOT\s+TRANSACT)\b/i.test(text)) return 'CRITICAL';
  const m = text.match(/\b(CRITICAL|HIGH|MEDIUM|LOW)\b/i);
  return m ? m[1].toUpperCase() : null;
};

const extractScore = (text) => {
  if (!text) return null;
  const m = text.match(/(\d{1,3})\s*\/\s*100|\bscore[:\s]+(\d{1,3})\b/i);
  return m ? parseInt(m[1] || m[2]) : null;
};

// —— One-time DOM injections —————————————————————————————————
const injectStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('scout-styles')) return;
  const s = document.createElement('style');
  s.id = 'scout-styles';
  s.textContent = `
    @keyframes scoutFadeIn {
      from { opacity:0; transform:translateY(8px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes scoutPing {
      0%  { box-shadow: 0 0 0 0px rgba(34,197,94,0.55); }
      70% { box-shadow: 0 0 0 9px rgba(34,197,94,0); }
      100%{ box-shadow: 0 0 0 0px rgba(34,197,94,0); }
    }
    [data-scout-card]:hover .scout-copy-btn { opacity:1 !important; }
    [data-scout-card]:hover .scout-flag-btn { opacity:1 !important; }
    @media print {
      body { background:#fff !important; color:#111 !important; }
      [data-scout-no-print]  { display:none !important; }
      [data-scout-card] { background:#fff !important; border:1px solid #ccc !important; break-inside:avoid; }
      [data-scout-label]{ color:#555 !important; }
      [data-scout-body] { color:#222 !important; }
      [data-scout-audit]{ color:#888 !important; border-top:1px solid #ddd !important; }
    }
  `;
  document.head.appendChild(s);
};

// —— Count-up hook ———————————————————————————————————————————
const useCountUp = (target, duration = 900, delay = 200) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === null) return;
    let raf;
    const t = setTimeout(() => {
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return val;
};

const AnimatedScore = ({ text }) => {
  const score = extractScore(text);
  const shown = useCountUp(score);
  if (score === null) return <span>{text}</span>;
  return <span>{text.replace(/\d{1,3}(?=\s*\/\s*100)/, shown)}</span>;
};

// —— Copy button —————————————————————————————————————————————
const CopyBtn = ({ getText }) => {
  const [ok, setOk] = useState(false);
  return (
    <button
      className="scout-copy-btn"
      data-scout-no-print
      title="Copy section"
      onClick={async () => {
        try { await navigator.clipboard.writeText(getText()); setOk(true); setTimeout(() => setOk(false), 1800); } catch {} // eslint-disable-line no-empty
      }}
      style={{
        position: 'absolute', top: 14, right: 14,
        background: 'transparent', border: 'none', cursor: 'pointer',
        padding: '3px 7px', borderRadius: 4,
        color: ok ? '#22c55e' : TEXT_MUTED,
        fontSize: 11, fontFamily: FONT, opacity: 0,
        transition: 'opacity .15s, color .2s', letterSpacing: '.05em',
      }}
    >{ok ? '\u2713 copied' : '\u2398'}</button>
  );
};

// —— Flag button —————————————————————————————————————————————
const FlagBtn = ({ id, flagged, onToggle }) => (
  <button
    className="scout-flag-btn"
    data-scout-no-print
    title={flagged ? 'Remove flag' : 'Flag for review'}
    onClick={() => onToggle(id)}
    style={{
      background: 'transparent', border: 'none', cursor: 'pointer',
      padding: '1px 4px', borderRadius: 3,
      color: flagged ? '#f59e0b' : TEXT_MUTED,
      fontSize: 13, lineHeight: 1, flexShrink: 0,
      opacity: flagged ? 1 : 0, transition: 'opacity .15s, color .2s',
    }}
  >{'\u2691'}</button>
);

// —— Flagged summary panel ———————————————————————————————————
const FlaggedPanel = ({ flagged, onClear }) => {
  if (!flagged.size) return null;
  return (
    <div data-scout-no-print style={{
      background: '#111', border: '1px solid rgba(245,158,11,0.3)',
      borderRadius: 8, padding: '14px 18px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', letterSpacing: '.12em', textTransform: 'uppercase' }}>
          {'\u2691'} Flagged for review ({flagged.size})
        </span>
        <button onClick={onClear} style={{ background: 'transparent', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontSize: 12, fontFamily: FONT }}>
          clear all
        </button>
      </div>
      {[...flagged].map((id, i) => (
        <div key={i} style={{ fontSize: 12, color: TEXT_SECONDARY, padding: '3px 0', borderBottom: i < flagged.size - 1 ? '1px solid #1f1f1f' : 'none' }}>
          {id.replace('finding-', 'Finding ')}
        </div>
      ))}
    </div>
  );
};

// —— Redline: wraps matched patterns in colored marks ————————
const applyRedline = (text) => {
  if (!text) return text;
  let parts = [text];
  for (const { re, color } of REDLINE_PATTERNS) {
    parts = parts.flatMap((p) => {
      if (typeof p !== 'string') return [p];
      const out = []; let last = 0; let m;
      const rx = new RegExp(re.source, re.flags);
      while ((m = rx.exec(p)) !== null) {
        if (m.index > last) out.push(p.slice(last, m.index));
        out.push(<mark key={`rl${m.index}`} style={{ background: `${color}22`, color, borderRadius: 2, padding: '0 2px', fontWeight: 600 }}>{m[0]}</mark>);
        last = m.index + m[0].length;
      }
      if (last < p.length) out.push(p.slice(last));
      return out.length ? out : [p];
    });
  }
  return parts;
};

// —— Inline markdown parser ——————————————————————————————————
const renderInline = (text, redline = false) => {
  if (!text) return null;
  const parts = []; let rem = text; let k = 0;
  while (rem.length > 0) {
    const bm = rem.match(/^(.*?)\*\*(.+?)\*\*/s) || rem.match(/^(.*?)__(.+?)__/s);
    const lm = rem.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)/);
    const cm = rem.match(/^(.*?)`([^`]+)`/);
    const matches = [
      bm && { type: 'bold', idx: bm[1].length, m: bm },
      lm && { type: 'link', idx: lm[1].length, m: lm },
      cm && { type: 'code', idx: cm[1].length, m: cm },
    ].filter(Boolean).sort((a, b) => a.idx - b.idx);

    if (!matches.length) { parts.push(<span key={k++}>{redline ? applyRedline(rem) : rem}</span>); break; }
    const first = matches[0];
    if (first.m[1]) parts.push(<span key={k++}>{redline ? applyRedline(first.m[1]) : first.m[1]}</span>);

    if (first.type === 'bold') {
      parts.push(<span key={k++} style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>{redline ? applyRedline(first.m[2]) : first.m[2]}</span>);
    } else if (first.type === 'link') {
      parts.push(<a key={k++} href={first.m[3]} target="_blank" rel="noopener noreferrer" style={{ color: '#d97706', textDecoration: 'underline', textUnderlineOffset: 2 }}>{first.m[2]}</a>);
    } else if (first.type === 'code') {
      parts.push(<code key={k++} style={{ background: '#2a2a2a', padding: '2px 6px', borderRadius: 3, fontSize: 12, fontFamily: 'monospace', color: TEXT_SECONDARY }}>{first.m[2]}</code>);
    }
    rem = rem.slice(first.m[0].length);
  }
  return parts;
};

// —— Block parser ————————————————————————————————————————————
const parseBlocks = (md) => {
  if (!md) return [];
  const lines = md.split('\n'); const blocks = []; let i = 0;
  while (i < lines.length) {
    const line = lines[i]; const tr = line.trim();
    if (!tr) { i++; continue; }

    const hm = tr.match(/^(#{1,4})\s+(.+)/);
    if (hm) {
      const content = []; i++;
      while (i < lines.length) {
        const nl = lines[i].trim();
        if (nl.match(/^#{1,4}\s+/)) break;
        content.push(nl ? lines[i] : (content.length ? '' : null));
        i++;
      }
      blocks.push({ type: 'section', level: hm[1].length, title: hm[2].replace(/[*_]/g, ''), content: content.filter(x => x !== null).join('\n').trim() });
      continue;
    }
    if (tr.startsWith('|')) {
      const tl = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) tl.push(lines[i++].trim());
      blocks.push({ type: 'table', lines: tl }); continue;
    }
    if (tr.match(/^\d+[.)]\s/)) {
      const items = [];
      while (i < lines.length) {
        const cur = lines[i].trim(); const nm = cur.match(/^\d+[.)]\s(.*)/);
        if (!nm) break;
        const il = [nm[1]]; i++;
        while (i < lines.length) {
          const nx = lines[i].trim();
          if (nx.match(/^\d+[.)]\s/) || nx.match(/^#{1,4}\s+/) || nx.startsWith('|')) break;
          if (nx) il.push(nx); else if (il.length > 1) il.push('');
          i++;
        }
        items.push(il.join('\n').trim());
      }
      blocks.push({ type: 'numbered', items }); continue;
    }
    if (tr.match(/^[-*]\s/)) {
      const items = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s/)) items.push(lines[i++].trim().replace(/^[-*]\s*/, ''));
      blocks.push({ type: 'bullets', items }); continue;
    }
    if (tr.match(/(?:IMMEDIATE\s+REJECT|DO\s+NOT\s+TRANSACT|BLOCKED|CRITICAL\s+RISK|APPROVE\s+WITH\s+CAUTION)/i) && !tr.startsWith('#')) {
      const cl = [tr]; i++;
      while (i < lines.length && lines[i].trim() && !lines[i].trim().match(/^#{1,4}\s+/) && !lines[i].trim().startsWith('|')) cl.push(lines[i++].trim());
      blocks.push({ type: 'callout', text: cl.join('\n') }); continue;
    }
    if (tr.match(/^[-*_]{3,}$/)) { i++; blocks.push({ type: 'hr' }); continue; }
    if (/^bottom\s+line:?\s*/i.test(tr)) {
      const bl = [tr.replace(/^bottom\s+line:?\s*/i, '')]; i++;
      while (i < lines.length && lines[i].trim() && !lines[i].trim().match(/^#{1,4}\s+/) && !lines[i].trim().startsWith('|')) bl.push(lines[i++].trim());
      blocks.push({ type: 'bottomLine', text: bl.join(' ').trim() }); continue;
    }
    const pl = [];
    while (i < lines.length && lines[i].trim() && !lines[i].trim().match(/^#{1,4}\s+/) && !lines[i].trim().startsWith('|') && !lines[i].trim().match(/^[-*]\s/) && !lines[i].trim().match(/^\d+[.)]\s/) && !lines[i].trim().match(/^[-*_]{3,}$/)) pl.push(lines[i++].trim());
    if (pl.length) blocks.push({ type: 'paragraph', text: pl.join(' ') });
  }
  return blocks;
};

const parseTable = (tl) => {
  if (tl.length < 2) return { headers: [], rows: [] };
  const pl = (l) => l.split('|').map(c => c.trim()).filter(Boolean);
  return { headers: pl(tl[0]), rows: tl.slice(tl[1].match(/^[\s|:-]+$/) ? 2 : 1).map(pl) };
};

const isSummaryRow = (row) => /^(subtotal|total|cap applied|final score|overall|net score|base)/.test((row[0] || '').replace(/\*{1,2}/g, '').trim().toLowerCase());

// —— Expandable table row ————————————————————————————————————
const ExpandableRow = ({ row, headers, isSummary, redline }) => {
  const [open, setOpen] = useState(false);
  const primary = row.slice(0, 3);
  const extra   = row.slice(3);
  return (
    <>
      <tr onClick={extra.length ? () => setOpen(o => !o) : undefined}
        style={{ borderBottom: '1px solid #1f1f1f', background: isSummary ? 'rgba(255,255,255,0.02)' : 'transparent', cursor: extra.length ? 'pointer' : 'default' }}>
        {primary.map((cell, ci) => {
          const cl = cell.replace(/\*{1,2}/g, '');
          const isScore = /^[+]?\d+$/.test(cl.trim());
          const sv = isScore ? parseInt(cl.trim().replace('+', '')) : 0;
          const risk = detectRiskLevel(cl);
          let color = ci === 0 ? '#e5e7eb' : TEXT_SECONDARY;
          if (isScore && sv > 0) color = '#fff';
          if (risk) color = RISK_COLORS[risk];
          return (
            <td key={ci} style={{ padding: '14px 12px 14px 0', fontSize: 13, color, fontWeight: (isSummary && ci === 0) || risk ? 600 : ci === 0 || isScore ? 500 : 400, letterSpacing: isSummary && ci === 0 ? '.04em' : '.01em', textTransform: isSummary && ci === 0 ? 'uppercase' : 'none' }}>
              {renderInline(cl, redline)}
              {ci === 0 && extra.length > 0 && <span style={{ color: TEXT_MUTED, fontSize: 10, marginLeft: 6 }}>{open ? '\u25B2' : '\u25BC'}</span>}
            </td>
          );
        })}
        {primary.length < 3 && [...Array(3 - primary.length)].map((_, i) => <td key={`p${i}`} />)}
      </tr>
      {open && extra.map((cell, ei) => (
        <tr key={ei} style={{ background: '#141414', borderBottom: '1px solid #1f1f1f' }}>
          <td colSpan={3} style={{ padding: '8px 12px 8px 20px' }}>
            <span style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '.08em', marginRight: 8 }}>{headers[ei + 3] || `Field ${ei + 4}`}</span>
            <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>{renderInline(cell.replace(/\*{1,2}/g, ''), redline)}</span>
          </td>
        </tr>
      ))}
    </>
  );
};

// —— Block renderer ——————————————————————————————————————————
const cardStyle = { background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: '20px 24px', marginBottom: 12, position: 'relative' };
const labelStyle = { fontSize: 10, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 14 };
const bodyStyle  = { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.7, letterSpacing: '.01em' };
const fadeIn = (i) => ({ opacity: 0, animation: 'scoutFadeIn .5s ease-out forwards', animationDelay: `${i * 80}ms` });

const renderBlock = (block, idx, redline, flagged, onFlag) => {
  switch (block.type) {
    case 'section': return (
      <div key={idx} data-scout-card style={cardStyle}>
        <div style={labelStyle} data-scout-label>{block.title}</div>
        {block.content && renderContent(block.content, redline, flagged, onFlag)}
      </div>
    );

    case 'table': {
      const { headers, rows } = parseTable(block.lines);
      return (
        <table key={idx} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
          <thead><tr>{headers.slice(0, 3).map((h, hi) => (
            <th key={hi} style={{ padding: '10px 12px 10px 0', fontSize: 10, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '.1em', textTransform: 'uppercase', textAlign: 'left', borderBottom: `1px solid ${CARD_BORDER}` }}>{h.replace(/\*{1,2}/g, '')}</th>
          ))}</tr></thead>
          <tbody>{rows.map((row, ri) => <ExpandableRow key={ri} row={row} headers={headers} isSummary={isSummaryRow(row)} redline={redline} />)}</tbody>
        </table>
      );
    }

    case 'bullets': return (
      <div key={idx} style={{ marginBottom: 8 }}>
        {block.items.map((item, ii) => (
          <div key={ii} style={{ padding: '8px 0 8px 16px', ...bodyStyle, borderBottom: ii < block.items.length - 1 ? '1px solid #1f1f1f' : 'none' }} data-scout-body>
            {renderInline(item, redline)}
          </div>
        ))}
      </div>
    );

    case 'numbered': return (
      <div key={idx} style={{ marginBottom: 4 }}>
        {block.items.map((item, ii) => {
          const fid = `finding-${idx}-${ii}`;
          const fl = flagged && flagged.has(fid);
          const bs = item.match(/^\*\*(.+?)\*\*[:\s\u2014-]*([\s\S]*)/);
          const title = bs ? bs[1] : null;
          const body = bs ? bs[2].trim() : item;
          const paras = body ? body.split(/\n\n|\n(?=\S)/).filter(p => p.trim()) : [];
          return (
            <div key={ii}
              style={{ display: 'flex', gap: 12, padding: '14px 0', borderLeft: `3px solid ${fl ? '#f59e0b' : '#d97706'}`, marginBottom: 8, paddingLeft: 16, background: fl ? 'rgba(245,158,11,0.05)' : 'transparent', transition: 'background .2s, border-color .2s' }}
              onMouseEnter={e => { const b = e.currentTarget.querySelector('.scout-flag-btn'); if (b) b.style.opacity = '1'; }}
              onMouseLeave={e => { const b = e.currentTarget.querySelector('.scout-flag-btn'); if (b && !fl) b.style.opacity = '0'; }}
            >
              <span style={{ minWidth: 24, color: fl ? '#f59e0b' : '#d97706', fontWeight: 600, fontSize: 15, flexShrink: 0 }}>{ii + 1}</span>
              <div style={{ flex: 1 }}>
                {title && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: paras.length ? 6 : 0 }}>
                    <div style={{ color: TEXT_PRIMARY, fontWeight: 500, fontSize: 14, flex: 1 }}>{renderInline(title, redline)}</div>
                    {onFlag && <FlagBtn id={fid} flagged={fl} onToggle={onFlag} />}
                  </div>
                )}
                {paras.map((p, pi) => {
                  const im = p.match(/^(Impact|Implication|Consequence|Note|Source|Risk|Significance):?\s*(.*)/is);
                  return im
                    ? <div key={pi} style={{ marginBottom: pi < paras.length - 1 ? 4 : 0 }}><span style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginRight: 8 }}>{im[1]}</span><span style={{ ...bodyStyle, fontSize: 13 }}>{renderInline(im[2], redline)}</span></div>
                    : <div key={pi} style={{ ...bodyStyle, fontSize: 13, marginBottom: pi < paras.length - 1 ? 4 : 0 }} data-scout-body>{renderInline(p.trim(), redline)}</div>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    );

    case 'callout': {
      const risk = detectRiskLevel(block.text);
      return (
        <div key={idx} style={{ background: risk ? RISK_BG[risk] : '#222', border: `1px solid ${risk ? RISK_BORDER[risk] : '#333'}`, borderRadius: 8, padding: '16px 24px', marginBottom: 12 }}>
          <div style={{ fontSize: 15, color: risk ? RISK_COLORS[risk] : TEXT_PRIMARY, lineHeight: 1.7, fontWeight: 600, letterSpacing: '.02em' }}>{renderInline(block.text, redline)}</div>
        </div>
      );
    }

    case 'bottomLine': return (
      <div key={idx} data-scout-card style={cardStyle}>
        <div style={labelStyle} data-scout-label>Bottom Line</div>
        <p style={{ ...bodyStyle, margin: 0 }} data-scout-body>{renderInline(block.text, redline)}</p>
      </div>
    );

    case 'paragraph': return <p key={idx} style={{ ...bodyStyle, margin: '0 0 8px 0' }} data-scout-body>{renderInline(block.text, redline)}</p>;
    case 'hr': return <hr key={idx} style={{ border: 'none', borderTop: `1px solid ${CARD_BORDER}`, margin: '8px 0' }} />;
    default: return null;
  }
};

const renderContent = (content, redline, flagged, onFlag) => {
  if (!content) return null;
  return parseBlocks(content).map((b, i) => renderBlock(b, i, redline, flagged, onFlag));
};

// —— Actions section with urgency tiers ——————————————————————
const ActionsSection = ({ content, redline }) => {
  const blocks = parseBlocks(content);
  const nb = blocks.find(b => b.type === 'numbered');
  const other = blocks.filter(b => b.type !== 'numbered');
  if (!nb) return renderContent(content, redline);
  const tiers = [
    { label: 'IMMEDIATE',   items: nb.items.slice(0, 3) },
    { label: 'SHORT-TERM',  items: nb.items.slice(3, 5) },
    { label: 'ONGOING',     items: nb.items.slice(5) },
  ].filter(t => t.items.length);
  return (
    <>
      {other.map((b, i) => renderBlock(b, i, redline))}
      {tiers.map((tier, ti) => {
        const u = URGENCY[tier.label] || URGENCY.ONGOING;
        return (
          <div key={ti} style={{ marginBottom: ti < tiers.length - 1 ? 12 : 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: u.color, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>{tier.label}</div>
            {tier.items.map((item, ii) => {
              const bs = item.match(/^\*\*(.+?)\*\*[:\s\u2014-]*(.*)/s);
              return (
                <div key={ii} style={{ background: u.bg, borderLeft: `3px solid ${u.color}`, borderRadius: 4, padding: '10px 16px', marginBottom: 6 }}>
                  {bs ? <><div style={{ color: TEXT_PRIMARY, fontWeight: 500, fontSize: 13 }}>{bs[1]}</div>{bs[2] && <div style={{ ...bodyStyle, fontSize: 12, marginTop: 2 }}>{renderInline(bs[2], redline)}</div>}</> : <div style={{ ...bodyStyle, fontSize: 13 }}>{renderInline(item, redline)}</div>}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
};

// —— Confidence section with pulse ———————————————————————————
const ConfidenceSection = ({ title, content, redline }) => {
  const cm = title.match(/match\s+confidence:?\s*(HIGH|MEDIUM|LOW)\s*(?:[\u2014-]\s*)?(\d+%?)?/i);
  const level = cm ? cm[1].toUpperCase() : null;
  const pct   = cm ? cm[2] : null;
  const color = level === 'HIGH' ? '#22c55e' : level === 'MEDIUM' ? '#eab308' : level === 'LOW' ? '#ef4444' : TEXT_SECONDARY;
  const blocks = parseBlocks(content);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={labelStyle} data-scout-label>Match Confidence</div>
        {level && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color, padding: '2px 8px', borderRadius: 4, animation: level === 'HIGH' ? 'scoutPing 1.2s ease-out .6s 1' : 'none' }}>{level}</span>
            {pct && <span style={{ fontSize: 14, color: TEXT_MUTED }}>{'\u2014'} {pct}</span>}
          </div>
        )}
      </div>
      {blocks.map((block, bi) => {
        if (block.type === 'section' && /factors?\s+(supporting|reducing|against)/i.test(block.title)) {
          const sub = block.content ? parseBlocks(block.content) : [];
          return (
            <div key={bi} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>{block.title}</div>
              {sub.map((sb, si) => sb.type === 'bullets'
                ? <div key={si}>{sb.items.map((item, ii) => <div key={ii} style={{ padding: '8px 0 8px 12px', ...bodyStyle, fontSize: 13, borderLeft: `2px solid ${CARD_BORDER}`, marginBottom: ii < sb.items.length - 1 ? 4 : 0 }}>{renderInline(item, redline)}</div>)}</div>
                : renderBlock(sb, si, redline)
              )}
            </div>
          );
        }
        if (block.type === 'bullets') return (
          <div key={bi}>{block.items.map((item, ii) => <div key={ii} style={{ padding: '8px 0 8px 12px', ...bodyStyle, fontSize: 13, borderLeft: `2px solid ${CARD_BORDER}`, marginBottom: ii < block.items.length - 1 ? 4 : 0 }}>{renderInline(item, redline)}</div>)}</div>
        );
        return renderBlock(block, bi, redline);
      })}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const ScoutReport = ({ content }) => {
  const [redline, setRedline] = useState(false);
  const [flagged, setFlagged] = useState(new Set());

  useEffect(() => { injectStyles(); }, []);

  if (!content) return null;

  const toggleFlag = (id) => setFlagged(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const clearFlags = () => setFlagged(new Set());

  const cleaned = content.replace(/<!--REPORT_JSON:[\s\S]*?-->/g, '').trim();
  const allBlocks = parseBlocks(cleaned);
  const blocks = allBlocks.filter(b => !(b.type === 'section' && /adverse\s+media|sources\s*[&and]*\s*references|references\s*[&and]*\s*sources|^sources$/i.test(b.title)));

  const riskSection = blocks.find(b => b.type === 'section' && /overall\s+risk/i.test(b.title));
  const calloutBlocks = blocks.filter(b => b.type === 'callout');

  let bottomLineText = null;
  const blb = blocks.find(b => b.type === 'bottomLine');
  if (blb) { bottomLineText = blb.text; }
  else {
    for (const b of blocks) {
      if (b.type === 'section' && b.content) {
        const m = b.content.match(/(?:^|\n)\*?\*?Bottom\s+Line:?\*?\*?\s*(.+?)(?:\n\n|\n(?=##)|$)/is);
        if (m) { bottomLineText = m[1].trim(); b.content = b.content.replace(/(?:^|\n)\*?\*?Bottom\s+Line:?\*?\*?\s*.+?(?:\n\n|\n(?=##)|$)/is, '\n').trim(); }
      }
    }
  }

  const firstSecIdx = blocks.findIndex(b => b.type === 'section' && !/overall\s+risk/i.test(b.title));
  const summaryBlocks = blocks.slice(0, firstSecIdx >= 0 ? firstSecIdx : blocks.length).filter(b => b.type === 'paragraph');
  const sectionBlocks = blocks.filter(b => b.type === 'section' && !/overall\s+risk/i.test(b.title));

  const auditTime = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  return (
    <div style={{ fontFamily: FONT, maxWidth: 900, width: '100%' }}>

      {/* TOOLBAR */}
      <div data-scout-no-print style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setRedline(r => !r)} style={{ background: redline ? 'rgba(239,68,68,0.1)' : 'transparent', border: `1px solid ${redline ? '#dc2626' : CARD_BORDER}`, borderRadius: 6, padding: '5px 12px', color: redline ? '#ef4444' : TEXT_MUTED, fontSize: 11, fontFamily: FONT, cursor: 'pointer', letterSpacing: '.06em', fontWeight: 600 }}>
          {redline ? '\u25C9 REDLINE ON' : '\u25CB REDLINE'}
        </button>
        <button onClick={() => window.print()} style={{ background: 'transparent', border: `1px solid ${CARD_BORDER}`, borderRadius: 6, padding: '5px 12px', color: TEXT_MUTED, fontSize: 11, fontFamily: FONT, cursor: 'pointer', letterSpacing: '.06em' }}>
          {'\u2399'} PRINT
        </button>
      </div>

      {/* FLAGGED PANEL */}
      <FlaggedPanel flagged={flagged} onClear={clearFlags} />

      {/* RISK BANNER */}
      {riskSection && (() => {
        const risk = detectRiskLevel(riskSection.title);
        const rc = risk ? RISK_COLORS[risk] : '#ef4444';
        const riskContent = (riskSection.content || '').replace(/(?:^|\n)\*?\*?Bottom\s+Line:?\*?\*?\s*.+?(?:\n\n|\n(?=##)|$)/is, '\n').trim();
        const rSubBlocks = riskContent ? parseBlocks(riskContent) : [];
        const prose = rSubBlocks.filter(b => ['paragraph', 'callout', 'bullets'].includes(b.type));
        const tables = rSubBlocks.filter(b => b.type === 'table');
        return (
          <>
            <div data-scout-card style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 8, marginBottom: 12, overflow: 'hidden', position: 'relative', ...fadeIn(0) }}>
              <div style={{ background: risk === 'CRITICAL' ? 'rgba(239,68,68,0.12)' : risk === 'HIGH' ? 'rgba(249,115,22,0.10)' : risk === 'MEDIUM' ? 'rgba(234,179,8,0.08)' : 'rgba(34,197,94,0.08)', borderBottom: `2px solid ${rc}`, padding: '16px 24px' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: rc, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                  <AnimatedScore text={riskSection.title} />
                </div>
              </div>
              <CopyBtn getText={() => riskSection.title} />
            </div>

            {calloutBlocks.map((blk, ci) => {
              const cr = detectRiskLevel(blk.text);
              return (
                <div key={`co${ci}`} data-scout-card style={{ background: '#111', borderLeft: `4px solid ${cr ? RISK_COLORS[cr] : TEXT_PRIMARY}`, borderRadius: 4, padding: '14px 20px', marginBottom: 12, position: 'relative', ...fadeIn(ci + 1) }}>
                  <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, fontWeight: 600, letterSpacing: '.03em' }}>{renderInline(blk.text, redline)}</div>
                  <CopyBtn getText={() => blk.text} />
                </div>
              );
            })}

            {prose.length > 0 && (
              <div data-scout-card style={{ ...cardStyle, ...fadeIn(2) }}>
                <div style={labelStyle} data-scout-label>Entity Summary</div>
                {prose.map((b, bi) => renderBlock(b, bi, redline, flagged, toggleFlag))}
                <CopyBtn getText={() => prose.map(b => b.text || '').join('\n')} />
              </div>
            )}

            {tables.length > 0 && (
              <div data-scout-card style={{ ...cardStyle, ...fadeIn(3) }}>
                <div style={labelStyle} data-scout-label>Risk Scoring</div>
                {tables.map((b, bi) => renderBlock(b, bi, redline, flagged, toggleFlag))}
                <CopyBtn getText={() => tables.map(b => (b.lines || []).join('\n')).join('\n')} />
              </div>
            )}
          </>
        );
      })()}

      {/* BOTTOM LINE */}
      {bottomLineText && (
        <div data-scout-card style={{ ...cardStyle, ...fadeIn(4) }}>
          <div style={labelStyle} data-scout-label>Bottom Line</div>
          <p style={{ ...bodyStyle, margin: 0 }} data-scout-body>{renderInline(bottomLineText, redline)}</p>
          <CopyBtn getText={() => `Bottom Line: ${bottomLineText}`} />
        </div>
      )}

      {/* SUMMARY */}
      {summaryBlocks.length > 0 && (
        <div data-scout-card style={{ ...cardStyle, ...fadeIn(5) }}>
          {summaryBlocks.map((b, si) => (
            <p key={si} style={{ ...bodyStyle, margin: si < summaryBlocks.length - 1 ? '0 0 12px 0' : 0 }} data-scout-body>
              {renderInline(b.text, redline)}
            </p>
          ))}
          <CopyBtn getText={() => summaryBlocks.map(b => b.text).join('\n\n')} />
        </div>
      )}

      {/* SECTIONS */}
      {sectionBlocks.map((section, si) => {
        const hasContent = section.content && section.content.trim();
        const isActions    = /recommended\s+actions?|action\s+items?/i.test(section.title);
        const isConfidence = /match\s+confidence/i.test(section.title);

        if (isConfidence) return (
          <div key={`s${si}`} data-scout-card style={{ ...cardStyle, ...fadeIn(si + 6) }}>
            <ConfidenceSection title={section.title} content={section.content} redline={redline} />
            <CopyBtn getText={() => `${section.title}\n${section.content || ''}`} />
          </div>
        );

        if (isActions) return (
          <div key={`s${si}`} data-scout-card style={{ ...cardStyle, ...fadeIn(si + 6) }}>
            <div style={labelStyle} data-scout-label>{section.title}</div>
            {hasContent && <ActionsSection content={section.content} redline={redline} />}
            <CopyBtn getText={() => `${section.title}\n${section.content || ''}`} />
          </div>
        );

        return (
          <div key={`s${si}`} data-scout-card style={{ ...cardStyle, ...fadeIn(si + 6) }}>
            <div style={labelStyle} data-scout-label>{section.title}</div>
            {hasContent && renderContent(section.content, redline, flagged, toggleFlag)}
            <CopyBtn getText={() => `${section.title}\n${section.content || ''}`} />
          </div>
        );
      })}

      {/* AUDIT TRAIL */}
      <div data-scout-audit style={{ marginTop: 24, padding: '12px 0 4px', borderTop: '1px solid #1f1f1f', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
        <span style={{ fontSize: 11, color: TEXT_MUTED, letterSpacing: '.04em' }}>Katharos {'\u00B7'} Investigation report</span>
        <span style={{ fontSize: 11, color: TEXT_MUTED, fontFamily: 'monospace' }}>{auditTime}</span>
      </div>

    </div>
  );
};

export default ScoutReport;
