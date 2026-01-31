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
  ChevronRight,
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

// Get risk level styling
const getRiskStyles = (text) => {
  const upperText = (text || '').toUpperCase();
  if (upperText.includes('CRITICAL') || upperText.includes('IMMEDIATE REJECT')) {
    return {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
      badgeBg: 'bg-red-600',
      badgeText: 'text-white',
    };
  }
  if (upperText.includes('HIGH') || upperText.includes('ENHANCED DUE DILIGENCE')) {
    return {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      icon: 'text-orange-600',
      badgeBg: 'bg-orange-500',
      badgeText: 'text-white',
    };
  }
  if (upperText.includes('MEDIUM') || upperText.includes('STANDARD') || upperText.includes('PROCEED WITH MONITORING')) {
    return {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: 'text-amber-600',
      badgeBg: 'bg-amber-500',
      badgeText: 'text-white',
    };
  }
  if (upperText.includes('LOW') || upperText.includes('PROCEED') || upperText.includes('APPROVED')) {
    return {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-600',
      badgeBg: 'bg-green-600',
      badgeText: 'text-white',
    };
  }
  return {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-800',
    icon: 'text-slate-600',
    badgeBg: 'bg-slate-600',
    badgeText: 'text-white',
  };
};

// Get icon for section header
const getIconForSection = (text) => {
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
  return upperText.includes('ONBOARDING') || upperText.includes('RECOMMENDATION');
};

// Detect if text is a decision/banner type
const isDecisionSection = (text) => { // eslint-disable-line no-unused-vars
  return isOverallRiskSection(text) || isOnboardingSection(text);
};

// Detect if text is the memo section
const isMemoSection = (text) => {
  const upperText = (text || '').toUpperCase();
  return upperText.includes('THE MEMO') || upperText === 'MEMO';
};

// Detect if text is typologies section
const isTypologiesSection = (text) => {
  const upperText = (text || '').toUpperCase();
  return upperText.includes('TYPOLOGIES');
};

// Detect if text is keep exploring section
const isKeepExploringSection = (text) => {
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

// Custom heading component
const CustomHeading = ({ level, children }) => {
  const text = getPlainText(children);
  const Icon = getIconForSection(text);
  const styles = getRiskStyles(text);
  const darkMode = useContext(DarkModeContext);

  // H2 - Major section headers
  if (level === 2) {
    // Overall Risk & Onboarding Recommendation banners - matching style
    if (isOverallRiskSection(text) || isOnboardingSection(text)) {
      const BannerIcon = isOverallRiskSection(text)
        ? (Icon || AlertTriangle)
        : Gavel;
      // Parse risk level and score from heading text to render cleanly
      const riskMatch = text.match(/OVERALL\s+RISK\s*:\s*(CRITICAL|HIGH|MEDIUM|LOW)/i);
      const scoreMatch = text.match(/(\d+)\s*\/\s*100/);
      const riskLabel = riskMatch ? riskMatch[1].toUpperCase() : null;
      const riskScore = scoreMatch ? scoreMatch[1] : null;
      // For onboarding, extract the recommendation text
      const onboardingMatch = text.match(/(?:ONBOARDING\s+)?RECOMMENDATION\s*:\s*(.+)/i)
        || text.match(/ONBOARDING\s*:\s*(.+)/i);
      const onboardingLabel = onboardingMatch ? `Recommendation: ${onboardingMatch[1].trim()}` : null;
      // Build clean display text
      const displayText = isOverallRiskSection(text)
        ? (riskLabel ? `OVERALL RISK: ${riskLabel}` : text)
        : (onboardingLabel || text);
      return (
        <div className={`${styles.bg} border ${styles.border} rounded-xl mb-4 ${isOverallRiskSection(text) ? 'mt-6' : 'mt-2'} shadow-md`}
             style={{ overflow: 'visible', maxHeight: 'none' }}>
          <div className="flex items-center gap-4 p-5">
            <div className={`w-11 h-11 rounded-lg ${styles.badgeBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <BannerIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-3 flex-1">
              <h2 className={`text-lg font-bold ${styles.text} tracking-wide`} style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                {displayText}
              </h2>
              {riskScore && (
                <span className={`text-base font-bold ${styles.text} opacity-75`}>
                  {riskScore} / 100
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Memo section
    if (isMemoSection(text)) {
      return (
        <div className="flex items-center gap-2 mt-6 mb-3">
          <FileText className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`} />
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-slate-900'} uppercase tracking-wide`}>
            {children}
          </h2>
        </div>
      );
    }

    // Typologies section
    if (isTypologiesSection(text)) {
      return (
        <div className="flex items-center gap-2 mt-6 mb-3">
          <Network className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-900'} uppercase tracking-wide`}>
            {children}
          </h2>
        </div>
      );
    }

    // Keep exploring section
    if (isKeepExploringSection(text)) {
      return (
        <div className="mt-6 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-6 h-6 text-amber-500" />
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-slate-900'} uppercase tracking-wide`}>
              {children}
            </h2>
          </div>
        </div>
      );
    }

    // Default H2
    return (
      <div className="flex items-center gap-2 mt-6 mb-3">
        {Icon && <Icon className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`} />}
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-slate-900'} uppercase tracking-wide`}>
          {children}
        </h2>
      </div>
    );
  }

  // H3 - Sub-section headers
  if (level === 3) {
    return (
      <h3 className={`text-base font-semibold ${darkMode ? 'text-gray-200' : 'text-slate-800'} mt-4 mb-2 flex items-center gap-2`}>
        {Icon && <Icon className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-slate-500'}`} />}
        {children}
      </h3>
    );
  }

  // H4 and below
  return (
    <h4 className={`text-base font-medium ${darkMode ? 'text-gray-300' : 'text-slate-700'} mt-3 mb-1`}>
      {children}
    </h4>
  );
};

// Custom list component
const CustomList = ({ ordered, children }) => {
  if (ordered) {
    return (
      <ol className="space-y-2 my-3 ml-4">
        {children}
      </ol>
    );
  }
  return (
    <ul className="space-y-2 my-3">
      {children}
    </ul>
  );
};

// Custom list item component - CLICKABLE
const CustomListItem = ({ children, ordered, index }) => {
  const onExploreClick = useContext(ExploreContext);
  const darkMode = useContext(DarkModeContext);
  const text = getPlainText(children);

  const handleClick = () => {
    if (onExploreClick && text) {
      onExploreClick(text);
    }
  };

  if (ordered) {
    return (
      <li
        className={`flex gap-3 cursor-pointer ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-50'} rounded-lg p-2.5 -ml-2 transition-colors group`}
        onClick={handleClick}
      >
        <span className={`flex-shrink-0 w-7 h-7 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300 group-hover:bg-amber-900 group-hover:text-amber-400' : 'bg-slate-100 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-700'} text-sm font-semibold flex items-center justify-center transition-colors`}>
          {index + 1}
        </span>
        <div className={`flex-1 text-base ${darkMode ? 'text-gray-300 group-hover:text-gray-100' : 'text-slate-700 group-hover:text-slate-900'} leading-relaxed`}>
          {children}
        </div>
        <ChevronRight className={`w-5 h-5 ${darkMode ? 'text-gray-600' : 'text-slate-300'} group-hover:text-amber-500 transition-colors flex-shrink-0 mt-0.5`} />
      </li>
    );
  }

  return (
    <li
      className={`flex items-start gap-2 cursor-pointer ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-50'} rounded-lg p-2.5 -ml-2 transition-colors group`}
      onClick={handleClick}
    >
      <ChevronRight className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0 group-hover:text-amber-400 transition-colors" />
      <span className={`text-base ${darkMode ? 'text-gray-300 group-hover:text-gray-100' : 'text-slate-700 group-hover:text-slate-900'} leading-relaxed flex-1`}>{children}</span>
    </li>
  );
};

// Custom paragraph component
const CustomParagraph = ({ children }) => {
  const text = getPlainText(children);
  const darkMode = useContext(DarkModeContext);

  // Check for impact/translation callouts
  if (text.toLowerCase().startsWith('impact:') ||
      text.toLowerCase().startsWith('translation:') ||
      text.toLowerCase().startsWith('compliance impact:')) {
    const content = text.replace(/^(impact|translation|compliance impact):\s*/i, '');
    return (
      <div className={`${darkMode ? 'bg-amber-900/30 border-amber-500' : 'bg-amber-50 border-amber-400'} border-l-4 rounded-r-lg p-4 my-3`}>
        <p className={`text-sm font-semibold uppercase tracking-wide ${darkMode ? 'text-amber-400' : 'text-amber-800'} mb-1`}>
          Impact
        </p>
        <p className={`text-base ${darkMode ? 'text-amber-200' : 'text-amber-900'} leading-relaxed`}>{content}</p>
      </div>
    );
  }

  return (
    <p className={`text-base ${darkMode ? 'text-gray-300' : 'text-slate-700'} leading-relaxed my-2`}>
      {children}
    </p>
  );
};

// Custom blockquote component
const CustomBlockquote = ({ children }) => {
  const darkMode = useContext(DarkModeContext);
  return (
    <blockquote className={`border-l-4 ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-slate-300 bg-slate-50'} pl-4 py-3 my-4 rounded-r-lg`}>
      <div className={`text-base ${darkMode ? 'text-gray-400' : 'text-slate-600'} italic`}>
        {children}
      </div>
    </blockquote>
  );
};

// Custom strong/bold component - CLICKABLE
const CustomStrong = ({ children }) => {
  const onExploreClick = useContext(ExploreContext);
  const darkMode = useContext(DarkModeContext);
  const text = getPlainText(children);

  const handleClick = (e) => {
    e.stopPropagation();
    if (onExploreClick && text) {
      onExploreClick(text);
    }
  };

  return (
    <strong
      className={`font-semibold ${darkMode ? 'text-gray-100 hover:text-amber-400' : 'text-slate-900 hover:text-amber-700'} cursor-pointer hover:underline transition-colors`}
      onClick={handleClick}
    >
      {children}
    </strong>
  );
};

// Custom emphasis/italic component
const CustomEmphasis = ({ children }) => {
  const darkMode = useContext(DarkModeContext);
  return (
    <em className={`italic ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
      {children}
    </em>
  );
};

// Custom code component (for inline code)
const CustomCode = ({ children }) => {
  const darkMode = useContext(DarkModeContext);
  return (
    <code className={`${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-slate-100 text-slate-800'} px-1.5 py-0.5 rounded text-base font-mono`}>
      {children}
    </code>
  );
};

// Custom horizontal rule
const CustomHr = () => {
  return <hr className="my-6 border-slate-200" />;
};

// Extract Keep Exploring items from content
const extractKeepExploringItems = (content) => {
  const keepExploringMatch = content.match(/##\s*KEEP EXPLORING[:\s]*([\s\S]*?)(?=##|$)/i);
  if (!keepExploringMatch) return [];

  const section = keepExploringMatch[1];
  const items = [];

  // Match list items (- or * or numbered)
  const listItemRegex = /^[\s]*[-*]\s*(.+)$|^[\s]*\d+\.\s*(.+)$/gm;
  let match;
  while ((match = listItemRegex.exec(section)) !== null) {
    const item = (match[1] || match[2] || '').trim().replace(/\*\*/g, '');
    if (item) {
      items.push(item);
    }
  }

  return items;
};

// Keep Exploring Card Component
const KeepExploringCard = ({ items, onExploreClick, darkMode }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} border rounded-xl overflow-hidden shadow-sm mt-6`}>
      <div className={`px-5 py-4 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-200'} border-b`}>
        <div className="flex items-center gap-2">
          <Search className="w-6 h-6 text-amber-500" />
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-slate-900'}`}>Keep Exploring</h3>
        </div>
      </div>
      <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-slate-100'}`}>
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => onExploreClick && onExploreClick(item)}
            className={`w-full px-5 py-4 flex items-center gap-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-amber-50'} transition-colors text-left group`}
          >
            <div className={`w-11 h-11 ${darkMode ? 'bg-gray-700 group-hover:bg-amber-900/50' : 'bg-amber-50 group-hover:bg-amber-100'} rounded-lg flex items-center justify-center flex-shrink-0 transition-colors`}>
              <Search className="w-5 h-5 text-amber-500" />
            </div>
            <span className={`flex-1 text-base ${darkMode ? 'text-gray-300 group-hover:text-amber-400' : 'text-slate-700 group-hover:text-amber-900'}`}>
              {item}
            </span>
            <ChevronRight className={`w-5 h-5 ${darkMode ? 'text-gray-600' : 'text-slate-300'} group-hover:text-amber-500 transition-colors`} />
          </button>
        ))}
      </div>
    </div>
  );
};

// Pre-process markdown to fix common issues
const preprocessMarkdown = (content) => {
  if (!content) return '';

  let processed = content;

  // Remove any JSON code blocks (in case AI outputs both)
  processed = processed.replace(/```json[\s\S]*?```/g, '');

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

// Remove Keep Exploring section from main content (we'll render it separately)
const removeKeepExploringSection = (content) => {
  return content.replace(/##\s*KEEP EXPLORING[:\s]*([\s\S]*?)(?=##|$)/i, '');
};

// Main MarkdownRenderer component
const MarkdownRenderer = ({ content, onExploreClick, darkMode = false }) => {
  const processedContent = preprocessMarkdown(content);
  const keepExploringItems = extractKeepExploringItems(processedContent);
  const mainContent = removeKeepExploringSection(processedContent);

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
    hr: CustomHr,
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-amber-500 hover:text-amber-400 underline"
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
            {mainContent}
          </ReactMarkdown>

          {/* Render Keep Exploring as special card */}
          {keepExploringItems.length > 0 && (
            <KeepExploringCard
              items={keepExploringItems}
              onExploreClick={onExploreClick}
              darkMode={darkMode}
            />
          )}
        </div>
      </ExploreContext.Provider>
    </DarkModeContext.Provider>
  );
};

export default MarkdownRenderer;
