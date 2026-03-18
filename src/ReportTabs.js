// ReportTabs.js — 5-tab report view combining agent investigation + structured KYC data
import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Network,
  Lightbulb,
  Shield,
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import {
  KYCRiskHeader,
  KYCSanctionsCard,
  KYCPEPCard,
  KYCAdverseMediaCard,
  KYCOwnershipSection,
  KYCRegulatoryCard,
  KYCRecommendationsCard,
} from './KYCCards';

// Tab configuration — maps sections to tabs by H2 heading keywords
const TAB_CONFIG = [
  {
    id: 'summary',
    label: 'Summary',
    icon: FileText,
    sections: ['SUBJECT IDENTITY', 'PEP STATUS', 'OVERALL RISK', 'MATCH CONFIDENCE', 'RISK SCORE BREAKDOWN'],
  },
  {
    id: 'evidence',
    label: 'Evidence',
    icon: Search,
    sections: ['CRITICAL FINDINGS', 'ADVERSE MEDIA', 'DESIGNATION TIMELINE', 'GENERAL LICENSES', 'OWNERSHIP HISTORY'],
  },
  {
    id: 'network',
    label: 'Network',
    icon: Network,
    sections: ['ENTITY NETWORK', 'CORPORATE NETWORK', 'CORPORATE STRUCTURE', 'REGULATORY CONTEXT'],
  },
  {
    id: 'actions',
    label: 'Actions',
    icon: Lightbulb,
    sections: ['RECOMMENDED ACTIONS', 'FINANCIAL EXPOSURE', 'MONITORING SCHEDULE', 'PROGRAMS AND AUTHORITIES'],
  },
  {
    id: 'audit',
    label: 'Audit',
    icon: Shield,
    sections: ['COVERAGE GAP', 'GAPS AND LIMITATIONS'],
  },
];

// Split markdown content into sections by ## headers
const splitMarkdownSections = (markdown) => {
  if (!markdown) return [];

  const sections = [];
  // Split on lines starting with ## (but not ### or more)
  const parts = markdown.split(/^(?=## )/m);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Extract heading from the first line if it starts with ##
    const headingMatch = trimmed.match(/^## (.+)/);
    if (headingMatch) {
      sections.push({
        heading: headingMatch[1].trim(),
        content: trimmed,
      });
    } else {
      // Preamble content (before first H2) — assign to summary
      sections.push({
        heading: '__preamble__',
        content: trimmed,
      });
    }
  }

  return sections;
};

// Determine which tab a section belongs to
const getTabForSection = (heading) => {
  const upper = heading.toUpperCase();
  for (const tab of TAB_CONFIG) {
    for (const keyword of tab.sections) {
      if (upper.includes(keyword)) {
        return tab.id;
      }
    }
  }
  // Default unmatched sections to summary
  return 'summary';
};

// Main ReportTabs component
const ReportTabs = React.memo(({ content, darkMode = true, networkGraphs, kycData }) => {
  const [activeTab, setActiveTab] = useState('summary');

  // Parse sections and assign to tabs
  const tabSections = useMemo(() => {
    const sections = splitMarkdownSections(content);
    const grouped = {};
    for (const tab of TAB_CONFIG) {
      grouped[tab.id] = [];
    }

    for (const section of sections) {
      const tabId = getTabForSection(section.heading);
      if (grouped[tabId]) {
        grouped[tabId].push(section);
      } else {
        grouped.summary.push(section);
      }
    }

    // Pin SUBJECT IDENTITY to the top of the summary tab
    if (grouped.summary.length > 1) {
      grouped.summary.sort((a, b) => {
        const aIsIdentity = a.heading.toUpperCase().includes('SUBJECT IDENTITY');
        const bIsIdentity = b.heading.toUpperCase().includes('SUBJECT IDENTITY');
        if (aIsIdentity && !bIsIdentity) return -1;
        if (!aIsIdentity && bIsIdentity) return 1;
        return 0;
      });
    }

    return grouped;
  }, [content]);

  // Count sections per tab (for badges) — include KYC data presence
  const tabCounts = useMemo(() => {
    const counts = {};
    for (const tab of TAB_CONFIG) {
      counts[tab.id] = tabSections[tab.id]?.length || 0;
    }
    // Add KYC data indicators to counts
    if (kycData) {
      if (kycData.subject) counts.summary = Math.max(counts.summary, 1);
      if (kycData.sanctions?.matches?.length || kycData.pep?.matches?.length || kycData.adverseMedia?.articles?.length) {
        counts.evidence = Math.max(counts.evidence, 1);
      }
      if (kycData.ownershipAnalysis) counts.network = Math.max(counts.network, 1);
      if (kycData.regulatoryGuidance || kycData.recommendations?.length) {
        counts.actions = Math.max(counts.actions, 1);
      }
    }
    return counts;
  }, [tabSections, kycData]);

  // Build markdown for active tab, separating pinned sections
  const { subjectIdentityContent, matchConfidenceContent, overallRiskContent, activeContent } = useMemo(() => {
    const sections = tabSections[activeTab] || [];
    if (activeTab === 'summary') {
      const isPinned = (s) => {
        const h = s.heading.toUpperCase();
        return h.includes('SUBJECT IDENTITY') || h.includes('MATCH CONFIDENCE') || h.includes('OVERALL RISK') || h.includes('RISK SCORE BREAKDOWN');
      };
      const identity = sections.filter(s => s.heading.toUpperCase().includes('SUBJECT IDENTITY'));
      const confidence = sections.filter(s => s.heading.toUpperCase().includes('MATCH CONFIDENCE'));
      const overallRisk = sections.filter(s => {
        const h = s.heading.toUpperCase();
        return h.includes('OVERALL RISK') || h.includes('RISK SCORE BREAKDOWN');
      });
      const rest = sections.filter(s => !isPinned(s));
      return {
        subjectIdentityContent: identity.map(s => s.content).join('\n\n'),
        matchConfidenceContent: confidence.map(s => s.content).join('\n\n'),
        overallRiskContent: overallRisk.map(s => s.content).join('\n\n'),
        activeContent: rest.map(s => s.content).join('\n\n'),
      };
    }
    return {
      subjectIdentityContent: '',
      matchConfidenceContent: '',
      overallRiskContent: '',
      activeContent: sections.map(s => s.content).join('\n\n'),
    };
  }, [tabSections, activeTab]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Tab Bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#1a1a1a',
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        gap: '0',
        padding: '0 4px',
        marginBottom: '8px',
      }}>
        {TAB_CONFIG.map(tab => {
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id];
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #f59e0b' : '2px solid transparent',
                color: isActive ? '#f59e0b' : '#6b7280',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = '#a1a1a1';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = '#6b7280';
              }}
            >
              <Icon style={{ width: '14px', height: '14px', flexShrink: 0 }} />
              <span>{tab.label}</span>
              {count > 0 && (
                <span style={{
                  fontSize: '10px',
                  color: isActive ? 'rgba(245, 158, 11, 0.6)' : '#4a4a4a',
                  fontWeight: 500,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '200px' }}>
        {/* Subject Identity pinned to top of summary tab */}
        {activeTab === 'summary' && subjectIdentityContent && (
          <MarkdownRenderer content={subjectIdentityContent} darkMode={darkMode} />
        )}

        {/* Match Confidence pinned below Subject Identity */}
        {activeTab === 'summary' && matchConfidenceContent && (
          <MarkdownRenderer content={matchConfidenceContent} darkMode={darkMode} />
        )}

        {/* Overall Risk + Risk Score Breakdown pinned below Match Confidence */}
        {activeTab === 'summary' && overallRiskContent && (
          <MarkdownRenderer content={overallRiskContent} darkMode={darkMode} />
        )}

        {/* KYC structured data — below pinned sections, above other markdown */}
        {kycData && activeTab === 'summary' && (
          <KYCRiskHeader data={kycData} />
        )}

        {/* Agent markdown content */}
        {activeContent ? (
          <MarkdownRenderer content={activeContent} darkMode={darkMode} />
        ) : (
          !kycData && !subjectIdentityContent && (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#4a4a4a',
              fontSize: '13px',
              fontStyle: 'italic',
            }}>
              Waiting for data...
            </div>
          )
        )}

        {/* KYC structured data — BELOW markdown for evidence tab */}
        {kycData && activeTab === 'evidence' && (
          <>
            <KYCSanctionsCard data={kycData} />
            <KYCPEPCard data={kycData} />
            <KYCAdverseMediaCard data={kycData} />
          </>
        )}

        {/* KYC structured data — BELOW markdown for network tab */}
        {kycData && activeTab === 'network' && (
          <KYCOwnershipSection data={kycData} />
        )}

        {/* KYC structured data — BELOW markdown for actions tab */}
        {kycData && activeTab === 'actions' && (
          <>
            <KYCRegulatoryCard data={kycData} />
            <KYCRecommendationsCard data={kycData} />
          </>
        )}

        {/* Network tab: render graph visualizations */}
        {activeTab === 'network' && networkGraphs && networkGraphs.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            {networkGraphs}
          </div>
        )}
      </div>
    </div>
  );
});

ReportTabs.displayName = 'ReportTabs';

export default ReportTabs;
