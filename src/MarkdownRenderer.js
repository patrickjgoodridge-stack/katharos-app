// MarkdownRenderer.js - Custom markdown renderer with styled components
import React, { createContext, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertTriangle,
  Shield,
  FileText,
  Flag,
  AlertCircle,
  Search,
  Users,
  Building2,
  Globe,
  Gavel,
  Network,
  Lightbulb,
} from 'lucide-react';

// Context for passing click handler to nested components
const ExploreContext = createContext(null);
// Context for dark mode
const DarkModeContext = createContext(false);

// Icon mapping for different section types
const sectionIcons = {
  'OVERALL RISK': AlertTriangle,
  'RED FLAGS': Flag,
  'CRITICAL RED FLAGS': Flag,
  'ONBOARDING DECISION': Gavel,
  'TYPOLOGIES': Network,
  'TYPOLOGIES PRESENT': Network,
  'THE MEMO': FileText,
  'MEMO': FileText,
  'DOCUMENTS TO REQUEST': FileText,
  'KEEP EXPLORING': Search,
  'ENTITY': Users,
  'ENTITY SUMMARY': Users,
  'SUBJECT': Users,
  'POLITICAL EXPOSURE': Building2,
  'JURISDICTION': Globe,
  'SANCTIONS': Shield,
  'SANCTIONS EXPOSURE': Shield,
  'BENEFICIAL OWNERSHIP': Network,
  'CORPORATE STRUCTURE': Building2,
  'ADVERSE MEDIA': AlertCircle,
  'ADVERSE MEDIA SUMMARY': AlertCircle,
  'KEY ASSOCIATES': Users,
  'RELATED ENTITIES': Network,
  'RECOMMENDED ACTIONS': Lightbulb,
};

// Get risk level styling - Katharos dark theme (from screen-3-investigation.html)
const getRiskStyles = (text, darkMode = true) => {
  const upperText = (text || '').toUpperCase();
  // CRITICAL: red bg rgba(239,68,68,0.1), border rgba(239,68,68,0.25), text #ef4444
  if (upperText.includes('CRITICAL') || upperText.includes('IMMEDIATE REJECT')) {
    return {
      bgStyle: { background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', padding: '18px 22px', marginBottom: '28px' },
      iconBgStyle: { width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
      textStyle: { fontSize: '14px', fontWeight: 600, color: '#ef4444', letterSpacing: '0.5px' },
      scoreStyle: { fontWeight: 400, color: 'rgba(239, 68, 68, 0.7)', marginLeft: '8px' },
      iconColor: '#ef4444',
    };
  }
  // HIGH/MEDIUM/LOW - gray styling
  return {
    bgStyle: { background: 'rgba(133, 133, 133, 0.1)', border: '1px solid rgba(133, 133, 133, 0.25)', borderRadius: '6px', padding: '18px 22px', marginBottom: '28px' },
    iconBgStyle: { width: '40px', height: '40px', background: 'rgba(133, 133, 133, 0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    textStyle: { fontSize: '14px', fontWeight: 600, color: '#858585', letterSpacing: '0.5px' },
    scoreStyle: { fontWeight: 400, color: 'rgba(133, 133, 133, 0.7)', marginLeft: '8px' },
    iconColor: '#858585',
  };
};

// Get icon for section header
const getIconForSection = (text) => { // eslint-disable-line no-unused-vars
  const upperText = (text || '').toUpperCase();
  for (const [key, Icon] of Object.entries(sectionIcons)) {
    if (upperText.includes(key)) {
      return Icon;
    }
  }
  return null;
};

// Detect if text is the overall risk section
const isOverallRiskSection = (text) => {
  const upperText = (text || '').toUpperCase();
  return upperText.includes('OVERALL RISK');
};

// Detect if text is onboarding recommendation/decision
const isOnboardingSection = (text) => {
  const upperText = (text || '').toUpperCase();
  return upperText.includes('ONBOARDING') || (upperText.includes('RECOMMENDATION') && !upperText.includes('RECOMMENDED ACTIONS'));
};

// Detect if text is a decision/banner type
const isDecisionSection = (text) => { // eslint-disable-line no-unused-vars
  return isOverallRiskSection(text) || isOnboardingSection(text);
};

// Detect if text is the memo section
const isMemoSection = (text) => { // eslint-disable-line no-unused-vars
  const upperText = (text || '').toUpperCase();
  return upperText.includes('THE MEMO') || upperText === 'MEMO';
};

// Detect if text is typologies section
const isTypologiesSection = (text) => { // eslint-disable-line no-unused-vars
  const upperText = (text || '').toUpperCase();
  return upperText.includes('TYPOLOGIES');
};

// Detect if text is keep exploring section
const isKeepExploringSection = (text) => { // eslint-disable-line no-unused-vars
  const upperText = (text || '').toUpperCase();
  return upperText.includes('KEEP EXPLORING') || upperText.includes('EXPLORE FURTHER');
};

// Extract plain text from React children
const getPlainText = (children) => {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children.map(getPlainText).join('');
  }
  if (children?.props?.children) {
    return getPlainText(children.props.children);
  }
  return '';
};

// Custom heading component - Katharos dark theme (from screen-3-investigation.html)
const CustomHeading = ({ level, children }) => {
  const text = getPlainText(children);
  const darkMode = useContext(DarkModeContext);
  const styles = getRiskStyles(text, darkMode);

  // H2 - Major section headers
  if (level === 2) {
    // Overall Risk banner - exact mockup: .risk-alert
    if (isOverallRiskSection(text) || isOnboardingSection(text)) {
      const riskMatch = text.match(/OVERALL\s+RISK\s*:\s*(CRITICAL|HIGH|MEDIUM|LOW)/i);
      const scoreMatch = text.match(/(\d+)\s*\/\s*100/);
      const riskLabel = riskMatch ? riskMatch[1].toUpperCase() : null;
      const riskScore = scoreMatch ? scoreMatch[1] : null;
      const displayText = riskLabel ? `OVERALL RISK: ${riskLabel}` : text;

      return (
        <div style={styles.bgStyle} className="flex items-center gap-3.5">
          <div style={styles.iconBgStyle}>
            <AlertTriangle style={{ width: '20px', height: '20px', color: styles.iconColor }} />
          </div>
          <div>
            <span style={styles.textStyle}>{displayText}</span>
            {riskScore && <span style={styles.scoreStyle}>{riskScore} / 100</span>}
          </div>
        </div>
      );
    }

    // All other H2 section labels - exact mockup: .report-label
    // font-size: 11px, font-weight: 600, letter-spacing: 2px, uppercase, color: #6b6b6b, margin-bottom: 12px
    return (
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#ffffff', marginBottom: '12px' }}>
          {children}
        </div>
      </div>
    );
  }

  // H3 - Sub-section headers
  if (level === 3) {
    return (
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginTop: '16px', marginBottom: '8px' }}>
        {children}
      </h3>
    );
  }

  // H4 and below
  return (
    <h4 style={{ fontSize: '14px', fontWeight: 500, color: '#d4d4d4', marginTop: '12px', marginBottom: '4px' }}>
      {children}
    </h4>
  );
};

// Custom list component
const CustomList = ({ ordered, children }) => {
  if (ordered) {
    return (
      <ol style={{ marginLeft: '16px', marginTop: '12px', marginBottom: '12px' }}>
        {children}
      </ol>
    );
  }
  return (
    <ul style={{ marginTop: '12px', marginBottom: '12px' }}>
      {children}
    </ul>
  );
};

// Custom list item component
const CustomListItem = ({ children, ordered, index }) => {
  const onExploreClick = useContext(ExploreContext);
  const text = getPlainText(children);

  const handleClick = () => {
    if (onExploreClick && text) {
      onExploreClick(text);
    }
  };

  if (ordered) {
    return (
      <li
        style={{ display: 'flex', gap: '12px', cursor: 'pointer', padding: '8px', marginLeft: '-8px', borderRadius: '4px' }}
        onClick={handleClick}
      >
        <span style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', background: '#2d2d2d', color: '#a1a1a1', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {index + 1}
        </span>
        <div style={{ flex: 1, fontSize: '15px', color: '#d4d4d4', lineHeight: 1.6, fontWeight: 300 }}>
          {children}
        </div>
      </li>
    );
  }

  return (
    <li
      style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', padding: '8px', marginLeft: '-8px', borderRadius: '4px' }}
      onClick={handleClick}
    >
      <span style={{ fontSize: '12px', marginTop: '6px', color: '#6b6b6b' }}>•</span>
      <span style={{ flex: 1, fontSize: '15px', color: '#d4d4d4', lineHeight: 1.6, fontWeight: 300 }}>{children}</span>
    </li>
  );
};

// Custom paragraph component
const CustomParagraph = ({ children }) => {
  const text = getPlainText(children);
  const darkMode = useContext(DarkModeContext); // eslint-disable-line no-unused-vars

  // Check for bottom line callout - exact mockup: .bottom-line
  // border-left: 2px solid #ffffff, padding: 16px 20px, background: #2d2d2d, border-radius: 0 6px 6px 0
  if (text.toLowerCase().startsWith('bottom line:')) {
    const content = text.replace(/^bottom line:\s*/i, '');
    return (
      <div style={{ borderLeft: '2px solid #ffffff', padding: '16px 20px', background: '#2d2d2d', borderRadius: '0 6px 6px 0', marginTop: '28px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#858585', marginBottom: '8px' }}>
          Bottom Line
        </div>
        <div style={{ fontSize: '14px', color: '#d4d4d4', lineHeight: 1.6, fontWeight: 300 }}>{content}</div>
      </div>
    );
  }

  // Check for impact/translation callouts
  if (text.toLowerCase().startsWith('impact:') ||
      text.toLowerCase().startsWith('translation:') ||
      text.toLowerCase().startsWith('compliance impact:')) {
    const content = text.replace(/^(impact|translation|compliance impact):\s*/i, '');
    return (
      <div style={{ borderLeft: '2px solid #858585', padding: '16px 20px', background: '#2d2d2d', borderRadius: '0 6px 6px 0', marginTop: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#858585', marginBottom: '8px' }}>
          Impact
        </div>
        <div style={{ fontSize: '14px', color: '#d4d4d4', lineHeight: 1.6, fontWeight: 300 }}>{content}</div>
      </div>
    );
  }

  // Default paragraph - exact mockup: .report-text
  // font-size: 15px, line-height: 1.75, color: #d4d4d4, font-weight: 300
  return (
    <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#d4d4d4', fontWeight: 300, margin: '0 0 8px 0' }}>
      {children}
    </p>
  );
};

// Custom blockquote component
const CustomBlockquote = ({ children }) => {
  return (
    <blockquote style={{ borderLeft: '2px solid #3a3a3a', background: '#2d2d2d', paddingLeft: '16px', paddingTop: '12px', paddingBottom: '12px', marginTop: '16px', marginBottom: '16px', borderRadius: '0 4px 4px 0' }}>
      <div style={{ fontSize: '14px', color: '#a1a1a1', fontStyle: 'italic' }}>
        {children}
      </div>
    </blockquote>
  );
};

// Custom strong/bold component - exact mockup: .report-text strong
// color: #ffffff, font-weight: 600
const CustomStrong = ({ children }) => {
  const onExploreClick = useContext(ExploreContext);
  const text = getPlainText(children);

  const handleClick = (e) => {
    e.stopPropagation();
    if (onExploreClick && text) {
      onExploreClick(text);
    }
  };

  return (
    <strong
      style={{ color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
      onClick={handleClick}
    >
      {children}
    </strong>
  );
};

// Custom table components - exact mockup: .risk-table
const CustomTable = ({ children }) => {
  return (
    <div style={{ marginTop: '16px', marginBottom: '16px', maxWidth: '640px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {children}
      </table>
    </div>
  );
};

const CustomThead = ({ children }) => {
  return (
    <thead>
      {children}
    </thead>
  );
};

// Table header - exact mockup: .risk-table th
// font-size: 10px, font-weight: 600, letter-spacing: 1.5px, uppercase, color: #6b6b6b, background: #2d2d2d
const CustomTh = ({ children }) => {
  return (
    <th style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6b6b6b', textAlign: 'left', padding: '10px 16px', background: '#2d2d2d', borderBottom: '1px solid #3a3a3a' }}>
      {children}
    </th>
  );
};

// Table row - exact mockup: .risk-table tr
const CustomTr = ({ children }) => {
  const text = getPlainText(children);
  const isTotal = /\b(total|final)\b/i.test(text);
  return (
    <tr style={isTotal ? { fontWeight: 600, color: '#ffffff' } : {}}>
      {children}
    </tr>
  );
};

// Table cell - exact mockup: .risk-table td
// font-size: 14px, padding: 12px 16px, border-bottom: 1px solid #3a3a3a, color: #a1a1a1
// .score-value: color: #ef4444, font-weight: 600, font-family: JetBrains Mono, font-size: 13px
const CustomTd = ({ children }) => {
  const text = getPlainText(children);
  const scoreMatch = text.match(/^\+?(\d+)/);
  let cellStyle = { fontSize: '14px', padding: '12px 16px', borderBottom: '1px solid #3a3a3a', color: '#a1a1a1' };

  if (scoreMatch) {
    const val = parseInt(scoreMatch[1]);
    if (val >= 50) {
      cellStyle = { ...cellStyle, color: '#ef4444', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' };
    }
  }

  // Check if this is the final row
  const isTotal = /\b(total|final|blocked)\b/i.test(text);
  if (isTotal) {
    cellStyle = { ...cellStyle, fontWeight: 600, color: '#ffffff' };
  }

  return (
    <td style={cellStyle}>
      {children}
    </td>
  );
};

// Custom emphasis/italic component
const CustomEmphasis = ({ children }) => {
  return (
    <em style={{ fontStyle: 'italic', color: '#a1a1a1' }}>
      {children}
    </em>
  );
};

// Custom code component (for inline code)
const CustomCode = ({ children }) => {
  return (
    <code style={{ background: '#2d2d2d', color: '#d4d4d4', padding: '2px 6px', borderRadius: '4px', fontSize: '14px', fontFamily: "'JetBrains Mono', monospace" }}>
      {children}
    </code>
  );
};

// Custom horizontal rule
const CustomHr = () => {
  return <hr className="my-6 border-slate-200" />;
};

// Pre-process markdown to fix common issues
const preprocessMarkdown = (content) => {
  if (!content) return '';

  let processed = content;

  // Remove any JSON code blocks (in case AI outputs both)
  processed = processed.replace(/```json[\s\S]*?```/g, '');

  // Remove Keep Exploring section (rendered separately in AppEnhanced.js)
  processed = processed.replace(/##\s*KEEP EXPLORING[:\s]*([\s\S]*?)(?=##|$)/i, '');

  // Fix duplicate content patterns
  // Remove exact duplicate paragraphs
  const paragraphs = processed.split(/\n\n+/);
  const seen = new Set();
  const uniqueParagraphs = paragraphs.filter(p => {
    const trimmed = p.trim();
    if (seen.has(trimmed)) return false;
    seen.add(trimmed);
    return true;
  });
  processed = uniqueParagraphs.join('\n\n');

  // Ensure headers have proper spacing
  processed = processed.replace(/^(#{1,6})\s*([^\n]+)/gm, '\n$1 $2');

  // Clean up excessive newlines
  processed = processed.replace(/\n{4,}/g, '\n\n\n');

  return processed.trim();
};

// Main MarkdownRenderer component
const MarkdownRenderer = ({ content, onExploreClick, darkMode = false }) => {
  const processedContent = preprocessMarkdown(content);

  // Custom components for react-markdown
  const components = {
    h1: (props) => <CustomHeading level={1} {...props} />,
    h2: (props) => <CustomHeading level={2} {...props} />,
    h3: (props) => <CustomHeading level={3} {...props} />,
    h4: (props) => <CustomHeading level={4} {...props} />,
    h5: (props) => <CustomHeading level={5} {...props} />,
    h6: (props) => <CustomHeading level={6} {...props} />,
    ul: (props) => <CustomList ordered={false} {...props} />,
    ol: (props) => <CustomList ordered={true} {...props} />,
    li: (props) => <CustomListItem {...props} />,
    p: CustomParagraph,
    blockquote: CustomBlockquote,
    strong: CustomStrong,
    em: CustomEmphasis,
    code: ({ inline, children, ...props }) => {
      if (inline) {
        return <CustomCode {...props}>{children}</CustomCode>;
      }
      // For code blocks, just render as pre
      return (
        <pre className={`${darkMode ? 'bg-gray-800' : 'bg-slate-100'} p-4 rounded-lg overflow-x-auto my-3`}>
          <code className={`text-base font-mono ${darkMode ? 'text-gray-200' : 'text-slate-800'}`}>{children}</code>
        </pre>
      );
    },
    table: CustomTable,
    thead: CustomThead,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: CustomTr,
    th: CustomTh,
    td: CustomTd,
    hr: CustomHr,
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-600 hover:text-gray-500 underline"
      >
        {children}
      </a>
    ),
  };

  return (
    <DarkModeContext.Provider value={darkMode}>
      <ExploreContext.Provider value={onExploreClick}>
        <div className={`markdown-content ${darkMode ? 'dark-mode' : ''}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
          >
            {processedContent}
          </ReactMarkdown>
        </div>
      </ExploreContext.Provider>
    </DarkModeContext.Provider>
  );
};

export default MarkdownRenderer;
