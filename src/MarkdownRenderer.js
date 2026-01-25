// MarkdownRenderer.js - Custom markdown renderer with styled components
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
  'SUBJECT': Users,
  'POLITICAL EXPOSURE': Building2,
  'JURISDICTION': Globe,
  'SANCTIONS': Shield,
  'BENEFICIAL OWNERSHIP': Network,
  'CORPORATE STRUCTURE': Building2,
  'ADVERSE MEDIA': AlertCircle,
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
  if (upperText.includes('MEDIUM') || upperText.includes('STANDARD')) {
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

// Detect if text is a decision/banner type
const isDecisionSection = (text) => {
  const upperText = (text || '').toUpperCase();
  return upperText.includes('ONBOARDING DECISION') ||
         upperText.includes('OVERALL RISK') ||
         upperText.includes('RECOMMENDATION');
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

// Custom heading component
const CustomHeading = ({ level, children }) => {
  const text = typeof children === 'string' ? children :
               (children && children[0]) ? String(children[0]) : '';
  const Icon = getIconForSection(text);
  const styles = getRiskStyles(text);

  // H2 - Major section headers
  if (level === 2) {
    // Decision banner
    if (isDecisionSection(text)) {
      return (
        <div className={`${styles.bg} ${styles.border} border rounded-xl p-4 mb-4 mt-6`}>
          <div className="flex items-center gap-3">
            {Icon && <Icon className={`w-6 h-6 ${styles.icon}`} />}
            <h2 className={`text-lg font-bold ${styles.text} uppercase tracking-wide`}>
              {children}
            </h2>
          </div>
        </div>
      );
    }

    // Memo section
    if (isMemoSection(text)) {
      return (
        <div className="flex items-center gap-2 mt-6 mb-3">
          <FileText className="w-5 h-5 text-slate-600" />
          <h2 className="text-base font-semibold text-slate-900 uppercase tracking-wide">
            {children}
          </h2>
        </div>
      );
    }

    // Typologies section
    if (isTypologiesSection(text)) {
      return (
        <div className="flex items-center gap-2 mt-6 mb-3">
          <Network className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-semibold text-purple-900 uppercase tracking-wide">
            {children}
          </h2>
        </div>
      );
    }

    // Keep exploring section
    if (isKeepExploringSection(text)) {
      return (
        <div className="flex items-center gap-2 mt-6 mb-3">
          <Search className="w-5 h-5 text-amber-600" />
          <h2 className="text-base font-semibold text-slate-900 uppercase tracking-wide">
            {children}
          </h2>
        </div>
      );
    }

    // Default H2
    return (
      <div className="flex items-center gap-2 mt-6 mb-3">
        {Icon && <Icon className="w-5 h-5 text-slate-600" />}
        <h2 className="text-base font-semibold text-slate-900 uppercase tracking-wide">
          {children}
        </h2>
      </div>
    );
  }

  // H3 - Sub-section headers
  if (level === 3) {
    return (
      <h3 className="text-sm font-semibold text-slate-800 mt-4 mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-slate-500" />}
        {children}
      </h3>
    );
  }

  // H4 and below
  return (
    <h4 className="text-sm font-medium text-slate-700 mt-3 mb-1">
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

// Custom list item component
const CustomListItem = ({ children, ordered, index }) => {
  if (ordered) {
    return (
      <li className="flex gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center">
          {index + 1}
        </span>
        <div className="flex-1 text-sm text-slate-700 leading-relaxed">
          {children}
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-2">
      <ChevronRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
      <span className="text-sm text-slate-700 leading-relaxed">{children}</span>
    </li>
  );
};

// Custom paragraph component
const CustomParagraph = ({ children }) => {
  const text = typeof children === 'string' ? children :
               (children && children[0]) ? String(children[0]) : '';

  // Check for impact/translation callouts
  if (text.toLowerCase().startsWith('impact:') ||
      text.toLowerCase().startsWith('translation:') ||
      text.toLowerCase().startsWith('compliance impact:')) {
    const content = text.replace(/^(impact|translation|compliance impact):\s*/i, '');
    return (
      <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4 my-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-1">
          Impact
        </p>
        <p className="text-sm text-amber-900 leading-relaxed">{content}</p>
      </div>
    );
  }

  return (
    <p className="text-sm text-slate-700 leading-relaxed my-2">
      {children}
    </p>
  );
};

// Custom blockquote component
const CustomBlockquote = ({ children }) => {
  return (
    <blockquote className="border-l-4 border-slate-300 pl-4 py-2 my-3 bg-slate-50 rounded-r-lg">
      <div className="text-sm text-slate-600 italic">
        {children}
      </div>
    </blockquote>
  );
};

// Custom strong/bold component
const CustomStrong = ({ children }) => {
  return (
    <strong className="font-semibold text-slate-900">
      {children}
    </strong>
  );
};

// Custom emphasis/italic component
const CustomEmphasis = ({ children }) => {
  return (
    <em className="italic text-slate-600">
      {children}
    </em>
  );
};

// Custom code component (for inline code)
const CustomCode = ({ children }) => {
  return (
    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-slate-800">
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
// eslint-disable-next-line no-unused-vars
const MarkdownRenderer = ({ content, onExploreClick }) => {
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
        <pre className="bg-slate-100 p-4 rounded-lg overflow-x-auto my-3">
          <code className="text-sm font-mono text-slate-800">{children}</code>
        </pre>
      );
    },
    hr: CustomHr,
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-amber-600 hover:text-amber-700 underline"
      >
        {children}
      </a>
    ),
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
