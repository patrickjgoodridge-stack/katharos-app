// ComplianceResultsPage.js - Structured results view with left navigation
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertTriangle,
  Shield,
  FileText,
  Flag,
  AlertCircle,
  Users,
  Building2,
  Network,
  Search,
  Gavel,
  Lightbulb,
  Download,
  Plus,
  MessageCircle,
  X,
  Globe,
  ChevronRight,
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

// Section icon mapping (mirrors MarkdownRenderer)
const sectionIconMap = {
  'OVERALL RISK': AlertTriangle,
  'ONBOARDING': Gavel,
  'MATCH CONFIDENCE': Shield,
  'ENTITY SUMMARY': Users,
  'KEY ASSOCIATES': Users,
  'RELATED ENTITIES': Network,
  'RED FLAG': Flag,
  'SANCTIONS': Shield,
  'CORPORATE STRUCTURE': Building2,
  'BENEFICIAL OWNERSHIP': Network,
  'PEP': Building2,
  'ADVERSE MEDIA': AlertCircle,
  'TYPOLOG': Network,
  'DOCUMENTS TO REQUEST': FileText,
  'SOURCES': FileText,
  'KEEP EXPLORING': Search,
  'RECOMMEND': Lightbulb,
};

const getIconForTitle = (title) => {
  const upper = (title || '').toUpperCase();
  for (const [key, Icon] of Object.entries(sectionIconMap)) {
    if (upper.includes(key)) return Icon;
  }
  return FileText;
};

// Extract risk level from title text
const extractRiskLevel = (text) => {
  const upper = (text || '').toUpperCase();
  if (upper.includes('CRITICAL')) return 'CRITICAL';
  if (upper.includes('IMMEDIATE REJECT') || upper.includes('DO NOT PROCEED')) return 'CRITICAL';
  if (upper.includes('HIGH')) return 'HIGH';
  if (upper.includes('ENHANCED DUE DILIGENCE')) return 'HIGH';
  if (upper.includes('MEDIUM') || upper.includes('PROCEED WITH CAUTION')) return 'MEDIUM';
  if (upper.includes('LOW') || upper.includes('STANDARD ONBOARDING') || upper.includes('APPROVE')) return 'LOW';
  return null;
};

// Short nav label from full section title
const getNavLabel = (title) => {
  const upper = (title || '').toUpperCase();
  if (upper.includes('OVERALL RISK')) return 'Summary';
  if (upper.includes('ONBOARDING')) return 'Recommendation';
  if (upper.includes('MATCH CONFIDENCE')) return 'Confidence';
  if (upper.includes('ENTITY SUMMARY')) return 'Entity';
  if (upper.includes('KEY ASSOCIATES')) return 'Associates';
  if (upper.includes('RED FLAG')) return 'Red Flags';
  if (upper.includes('SANCTIONS')) return 'Sanctions';
  if (upper.includes('CORPORATE') || upper.includes('OWNERSHIP')) return 'Ownership';
  if (upper.includes('PEP')) return 'PEP Status';
  if (upper.includes('ADVERSE MEDIA')) return 'Media';
  if (upper.includes('TYPOLOG')) return 'Typologies';
  if (upper.includes('DOCUMENTS')) return 'Documents';
  if (upper.includes('SOURCES')) return 'Sources';
  if (upper.includes('KEEP EXPLORING')) return 'Next Steps';
  if (upper.includes('RECOMMEND')) return 'Actions';
  // Fallback: first 2 words
  return title.split(/\s+/).slice(0, 2).join(' ');
};

// Count items in section content (bullet points or numbered items)
const countItems = (content) => {
  const lines = content.split('\n');
  let count = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\d+\.\s/.test(trimmed) || /^[-*]\s/.test(trimmed) || /^>\s/.test(trimmed)) {
      count++;
    }
  }
  return count > 0 ? count : null;
};

// Parse markdown into sections
const parseMarkdownSections = (markdown) => {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const sections = [];
  let currentSection = null;
  let preamble = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) {
        currentSection.content = currentSection.contentLines.join('\n').trim();
        currentSection.itemCount = countItems(currentSection.content);
        delete currentSection.contentLines;
        sections.push(currentSection);
      }
      const title = line.replace(/^##\s+/, '').trim();
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      currentSection = {
        id,
        title,
        contentLines: [],
        icon: getIconForTitle(title),
        navLabel: getNavLabel(title),
        riskLevel: extractRiskLevel(title),
      };
    } else if (currentSection) {
      currentSection.contentLines.push(line);
    } else {
      preamble.push(line);
    }
  }

  if (currentSection) {
    currentSection.content = currentSection.contentLines.join('\n').trim();
    currentSection.itemCount = countItems(currentSection.content);
    delete currentSection.contentLines;
    sections.push(currentSection);
  }

  // If there's preamble text before first ##, prepend to first section
  if (preamble.length > 0 && preamble.join('').trim() && sections.length > 0) {
    sections[0].content = preamble.join('\n').trim() + '\n\n' + sections[0].content;
  }

  return sections;
};

// Extract subject info from sections
const extractSubjectInfo = (sections) => {
  let name = 'Subject';
  let riskLevel = null;
  let riskScore = null;

  // Try OVERALL RISK section
  const riskSection = sections.find(s => s.title.toUpperCase().includes('OVERALL RISK'));
  if (riskSection) {
    riskLevel = extractRiskLevel(riskSection.title);
    const scoreMatch = riskSection.title.match(/(\d+)\s*\/\s*100/);
    if (scoreMatch) riskScore = parseInt(scoreMatch[1]);
  }

  // Try ENTITY SUMMARY for name
  const entitySection = sections.find(s => s.title.toUpperCase().includes('ENTITY SUMMARY'));
  if (entitySection) {
    const nameMatch = entitySection.content.match(/\*\*Name:\*\*\s*(.+?)(?:\n|$)/i);
    if (nameMatch) name = nameMatch[1].trim();
  }

  return { name, riskLevel, riskScore };
};

// Risk badge component
const RiskBadge = ({ level, score }) => {
  const colors = {
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW: 'bg-green-100 text-green-700 border-green-200',
  };
  if (!level) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colors[level] || colors.MEDIUM}`}>
      {level} RISK{score != null && ` — ${score}/100`}
    </span>
  );
};

// Dark mode risk badge
const RiskBadgeDark = ({ level, score }) => {
  const colors = {
    CRITICAL: 'bg-red-900/40 text-red-300 border-red-700',
    HIGH: 'bg-orange-900/40 text-orange-300 border-orange-700',
    MEDIUM: 'bg-amber-900/40 text-amber-300 border-amber-700',
    LOW: 'bg-green-900/40 text-green-300 border-green-700',
  };
  if (!level) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colors[level] || colors.MEDIUM}`}>
      {level} RISK{score != null && ` — ${score}/100`}
    </span>
  );
};

// Left Navigation
const LeftNav = ({ sections, activeSectionId, onSectionClick, onChatToggle, chatOpen, darkMode }) => {
  const bgClass = darkMode ? 'bg-gray-900 border-gray-700' : 'bg-slate-50 border-slate-200';
  const activeClass = darkMode
    ? 'bg-gray-800 text-amber-400 border-l-amber-400'
    : 'bg-white text-amber-700 border-l-amber-500 shadow-sm';
  const inactiveClass = darkMode
    ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border-l-transparent'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-transparent';

  return (
    <div className={`w-60 border-r ${bgClass} flex flex-col flex-shrink-0`}>
      <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
          Screening Report
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSectionId === section.id;
          const upper = section.title.toUpperCase();
          const isRisk = upper.includes('OVERALL RISK');
          const isOnboarding = upper.includes('ONBOARDING');

          return (
            <button
              key={section.id}
              onClick={() => onSectionClick(section.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-r-lg mb-0.5 text-left border-l-[3px] transition-all text-sm ${
                isActive ? activeClass : inactiveClass
              }`}
            >
              {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? (darkMode ? 'text-amber-400' : 'text-amber-600') : ''}`} />}
              <span className="flex-1 font-medium leading-tight">{section.navLabel}</span>
              {section.itemCount && !isRisk && !isOnboarding && (
                <span className={`text-[10px] min-w-[20px] text-center px-1.5 py-0.5 rounded-full font-semibold ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-slate-200 text-slate-600'
                }`}>
                  {section.itemCount}
                </span>
              )}
              {section.riskLevel && isRisk && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  section.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                  section.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                  section.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {section.riskLevel}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <button
          onClick={onChatToggle}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            chatOpen
              ? (darkMode ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white')
              : (darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200')
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          {chatOpen ? 'Close Chat' : 'Ask Questions'}
        </button>
      </div>
    </div>
  );
};

// Section Card
const SectionCard = React.forwardRef(({ section, darkMode, index }, ref) => {
  const Icon = section.icon;
  const upper = section.title.toUpperCase();
  const isRisk = upper.includes('OVERALL RISK');
  const isOnboarding = upper.includes('ONBOARDING');

  // Summary/Risk section gets special banner treatment
  if (isRisk || isOnboarding) {
    const riskLevel = extractRiskLevel(section.title);
    const borderColor = {
      CRITICAL: 'border-red-400',
      HIGH: 'border-orange-400',
      MEDIUM: 'border-amber-400',
      LOW: 'border-green-400',
    }[riskLevel] || 'border-slate-300';

    const bgColor = darkMode
      ? (riskLevel === 'CRITICAL' ? 'bg-red-950/30' : riskLevel === 'HIGH' ? 'bg-orange-950/30' : riskLevel === 'MEDIUM' ? 'bg-amber-950/30' : 'bg-green-950/30')
      : (riskLevel === 'CRITICAL' ? 'bg-red-50' : riskLevel === 'HIGH' ? 'bg-orange-50' : riskLevel === 'MEDIUM' ? 'bg-amber-50' : 'bg-green-50');

    return (
      <div
        ref={ref}
        id={section.id}
        className={`rounded-xl border-l-4 ${borderColor} ${bgColor} ${darkMode ? 'border border-l-4 border-gray-700' : 'border border-l-4 border-slate-200'} p-6 shadow-sm`}
        style={{ animationDelay: `${index * 40}ms` }}
      >
        <div className="flex items-center gap-3 mb-3">
          {Icon && <Icon className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`} />}
          <h2 className={`text-lg font-bold tracking-wide uppercase ${darkMode ? 'text-gray-100' : 'text-slate-800'}`}>
            {isRisk ? 'Overall Risk Assessment' : isOnboarding ? 'Recommendation' : section.title}
          </h2>
          {riskLevel && (darkMode
            ? <RiskBadgeDark level={riskLevel} score={isRisk ? (section.title.match(/(\d+)\s*\/\s*100/)?.[1] ? parseInt(section.title.match(/(\d+)\s*\/\s*100/)[1]) : null) : null} />
            : <RiskBadge level={riskLevel} score={isRisk ? (section.title.match(/(\d+)\s*\/\s*100/)?.[1] ? parseInt(section.title.match(/(\d+)\s*\/\s*100/)[1]) : null) : null} />
          )}
        </div>
        <div className="prose max-w-none">
          <MarkdownRenderer content={section.content} darkMode={darkMode} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      id={section.id}
      className={`rounded-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} border p-6 shadow-sm`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className={`flex items-center gap-3 mb-4 pb-3 border-b ${darkMode ? 'border-gray-700' : 'border-slate-100'}`}>
        {Icon && <Icon className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />}
        <h2 className={`text-base font-bold tracking-wide uppercase ${darkMode ? 'text-gray-100' : 'text-slate-800'}`}>
          {section.title.replace(/:\s*.+$/, '')}
        </h2>
        {section.itemCount && (
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${
            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-500'
          }`}>
            {section.itemCount}
          </span>
        )}
      </div>
      <div className="prose max-w-none">
        <MarkdownRenderer content={section.content} darkMode={darkMode} />
      </div>
    </div>
  );
});

// Main Component
const ComplianceResultsPage = ({
  markdownContent,
  subjectName: propSubjectName,
  onNewSearch,
  onExportPdf,
  onChatSend,
  chatMessages = [],
  chatInput,
  setChatInput,
  isChatLoading,
  darkMode = false,
}) => {
  const [sections, setSections] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [subjectInfo, setSubjectInfo] = useState({ name: '', riskLevel: null, riskScore: null });
  const sectionRefs = useRef({});
  const contentRef = useRef(null);

  // Parse markdown on mount/change
  useEffect(() => {
    const parsed = parseMarkdownSections(markdownContent);
    setSections(parsed);
    if (parsed.length > 0) {
      setActiveSectionId(parsed[0].id);
    }
    const info = extractSubjectInfo(parsed);
    setSubjectInfo(info);
  }, [markdownContent]);

  // Scroll spy with IntersectionObserver
  useEffect(() => {
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let topEntry = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!topEntry || entry.boundingClientRect.top < topEntry.boundingClientRect.top) {
              topEntry = entry;
            }
          }
        }
        if (topEntry) {
          setActiveSectionId(topEntry.target.id);
        }
      },
      {
        root: contentRef.current,
        rootMargin: '-10% 0px -70% 0px',
        threshold: 0,
      }
    );

    // Small delay to ensure refs are populated
    const timer = setTimeout(() => {
      Object.values(sectionRefs.current).forEach((el) => {
        if (el) observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [sections]);

  const handleSectionClick = useCallback((sectionId) => {
    setActiveSectionId(sectionId);
    const el = sectionRefs.current[sectionId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Prefer parsed subject name from ENTITY SUMMARY over prop (which may be truncated case description)
  const displayName = (subjectInfo.name && subjectInfo.name !== 'Subject') ? subjectInfo.name : (propSubjectName || 'Subject');

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Navigation */}
      <LeftNav
        sections={sections}
        activeSectionId={activeSectionId}
        onSectionClick={handleSectionClick}
        onChatToggle={() => setChatOpen(!chatOpen)}
        chatOpen={chatOpen}
        darkMode={darkMode}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <div className={`flex items-center justify-between px-6 py-3 border-b flex-shrink-0 ${
          darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {displayName}
            </h1>
            {darkMode
              ? <RiskBadgeDark level={subjectInfo.riskLevel} score={subjectInfo.riskScore} />
              : <RiskBadge level={subjectInfo.riskLevel} score={subjectInfo.riskScore} />
            }
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onExportPdf && (
              <button
                onClick={onExportPdf}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? 'text-gray-300 hover:bg-gray-800 border border-gray-600'
                    : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            )}
            {onNewSearch && (
              <button
                onClick={onNewSearch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Search
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          ref={contentRef}
          className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-950' : 'bg-slate-50'}`}
        >
          <div className="max-w-4xl mx-auto p-6 space-y-4">
            {sections.map((section, idx) => (
              <SectionCard
                key={section.id}
                section={section}
                darkMode={darkMode}
                index={idx}
                ref={(el) => { sectionRefs.current[section.id] = el; }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {chatOpen && (
        <div className={`w-96 border-l flex flex-col flex-shrink-0 ${
          darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'
        }`}>
          <div className={`flex items-center justify-between px-4 py-3 border-b ${
            darkMode ? 'border-gray-700' : 'border-slate-200'
          }`}>
            <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Ask about this screening
            </h3>
            <button
              onClick={() => setChatOpen(false)}
              className={`p-1 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-100 text-slate-400'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${darkMode ? 'bg-gray-950' : 'bg-slate-50'}`}>
            {chatMessages.length === 0 && (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ask questions about this screening result</p>
              </div>
            )}
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-amber-500 text-white'
                    : (darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-slate-700 border border-slate-200')
                }`}>
                  {msg.role === 'assistant' ? (
                    <MarkdownRenderer content={msg.content} darkMode={darkMode} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Thinking...
              </div>
            )}
          </div>

          <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput || ''}
                onChange={(e) => setChatInput && setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onChatSend && onChatSend()}
                placeholder="Ask a follow-up about this screening..."
                className={`flex-1 px-3 py-2 rounded-lg text-sm border outline-none ${
                  darkMode
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-400'
                }`}
              />
              <button
                onClick={() => onChatSend && onChatSend()}
                disabled={!chatInput?.trim() || isChatLoading}
                className="px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceResultsPage;
