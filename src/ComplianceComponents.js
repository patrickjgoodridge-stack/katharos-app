// ComplianceComponents.js - Styled components for compliance screening results
import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Gavel,
  Building2,
  Lock,
  User,
  Calendar,
  Globe,
  Clock,
  FileText,
  Flag,
  Download,
  ExternalLink,
  ShieldX,
  FileX,
  Search,
  Users,
  Network,
  CheckCircle2,
  ChevronRight,
  Eye,
  Copy,
  Check,
  CheckCircle,
} from 'lucide-react';

// ============================================
// RISK BADGE COMPONENT
// ============================================
export const RiskBadge = ({ level }) => {
  const normalizedLevel = (level || 'unknown').toLowerCase();
  const config = {
    critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: 'text-red-600' },
    high: { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-400', icon: 'text-gray-600' },
    medium: { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-400', icon: 'text-gray-600' },
    low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: 'text-green-600' },
    unknown: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', icon: 'text-slate-600' },
  };
  const styles = config[normalizedLevel] || config.unknown;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${styles.bg} ${styles.border} border shadow-sm`}>
      <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
      <span className={`font-semibold uppercase tracking-wide text-sm ${styles.text}`}>
        {level || 'Unknown'} Risk
      </span>
    </div>
  );
};

// ============================================
// ALERT BANNER COMPONENT
// ============================================
export const AlertBanner = ({ level, title, subtitle }) => {
  const normalizedLevel = (level || 'medium').toLowerCase();
  const config = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', title: 'text-red-900', text: 'text-red-800' },
    high: { bg: 'bg-gray-100', border: 'border-gray-300', icon: 'text-gray-600', title: 'text-gray-900', text: 'text-gray-800' },
    medium: { bg: 'bg-gray-100', border: 'border-gray-300', icon: 'text-gray-600', title: 'text-gray-900', text: 'text-gray-800' },
    low: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', title: 'text-green-900', text: 'text-green-800' },
  };
  const styles = config[normalizedLevel] || config.medium;

  const defaultTitle = normalizedLevel === 'critical' || normalizedLevel === 'high'
    ? 'High-Profile Screening Hit — Immediate Escalation Required'
    : 'Screening Complete — Review Required';
  const defaultSubtitle = normalizedLevel === 'critical' || normalizedLevel === 'high'
    ? 'This entity requires senior compliance review before any transaction processing.'
    : 'Please review the findings below and take appropriate action.';

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-xl p-4 flex items-start gap-3`}>
      <AlertTriangle className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`} />
      <div>
        <p className={`font-semibold ${styles.title}`}>{title || defaultTitle}</p>
        <p className={`text-sm ${styles.text} mt-1`}>{subtitle || defaultSubtitle}</p>
      </div>
    </div>
  );
};

// ============================================
// ENTITY CARD COMPONENT
// ============================================
export const EntityCard = ({ entity }) => {
  if (!entity) return null;
  const { name, type, status, jurisdiction } = entity;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-slate-900 truncate">{name || 'Unknown Entity'}</h2>
          <p className="text-sm text-slate-600 mt-1">{type || 'Entity'}</p>
          {(status || jurisdiction) && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {status && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {status}
                </span>
              )}
              {jurisdiction && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                  <Globe className="w-3.5 h-3.5" />
                  {jurisdiction}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// METADATA GRID COMPONENT
// ============================================
export const MetadataGrid = ({ items }) => {
  if (!items || items.length === 0) return null;

  const iconMap = {
    risk: AlertTriangle,
    designation: Gavel,
    jurisdiction: Globe,
    updated: Clock,
    calendar: Calendar,
    building: Building2,
    lock: Lock,
    flag: Flag,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item, index) => {
        const IconComponent = iconMap[item.icon] || AlertTriangle;
        return (
          <div key={index} className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <IconComponent className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">{item.label}</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// RED FLAG CARD COMPONENT
// ============================================
export const RedFlagCard = ({ flag }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { icon, title, fact, complianceImpact, sources } = flag;

  const iconMap = {
    gavel: Gavel,
    building: Building2,
    lock: Lock,
    flag: Flag,
    network: Network,
    eye: Eye,
    alert: AlertTriangle,
    shield: ShieldX,
  };
  const IconComponent = iconMap[icon] || Flag;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="font-semibold text-slate-900 text-left">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-4">
          <div className="pl-[52px]">
            <p className="text-slate-700 leading-relaxed">{fact}</p>

            {sources && sources.length > 0 && (
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {sources.map((source, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs text-blue-600"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {source}
                  </span>
                ))}
              </div>
            )}
          </div>

          {complianceImpact && (
            <div className="ml-[52px] bg-gray-100 border-l-4 border-gray-500 rounded-r-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-800 mb-1">
                Impact
              </p>
              <p className="text-sm text-gray-900 leading-relaxed">{complianceImpact}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// TYPOLOGIES CARD
// ============================================
export const TypologiesCard = ({ typologies }) => {
  if (!typologies || typologies.length === 0) return null;

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 bg-purple-100 border-b border-purple-200">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-purple-700" />
          <h3 className="font-semibold text-purple-900">Typologies Present</h3>
        </div>
      </div>
      <div className="p-5">
        <ul className="space-y-3">
          {typologies.map((typology, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Network className="w-3.5 h-3.5 text-purple-700" />
              </div>
              <span className="text-sm text-purple-900">{typology}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ============================================
// DECISION BANNER
// ============================================
export const DecisionBanner = ({ decision }) => {
  if (!decision) return null;
  const { status, reason } = decision;

  const normalizedStatus = (status || '').toUpperCase();
  const isReject = normalizedStatus.includes('REJECT') || normalizedStatus.includes('BLOCK');
  const isEDD = normalizedStatus.includes('ENHANCED') || normalizedStatus.includes('EDD') || normalizedStatus.includes('CAUTION');

  let bgColor = 'bg-emerald-600';
  let Icon = CheckCircle;
  let displayStatus = status || 'PROCEED';

  if (isReject) {
    bgColor = 'bg-red-600';
    Icon = ShieldX;
    displayStatus = 'IMMEDIATE REJECT';
  } else if (isEDD) {
    bgColor = 'bg-gray-600';
    Icon = AlertTriangle;
    displayStatus = 'ENHANCED DUE DILIGENCE REQUIRED';
  }

  return (
    <div className={`rounded-xl overflow-hidden shadow-lg ${bgColor}`}>
      <div className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium uppercase tracking-wide">Onboarding Decision</p>
            <p className="text-white text-2xl font-bold tracking-tight">{displayStatus}</p>
          </div>
        </div>
        {reason && (
          <div className="bg-white/10 rounded-lg px-4 py-3 mt-4">
            <p className="text-white/95 text-sm leading-relaxed">{reason}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// DOCUMENTS CARD
// ============================================
export const DocumentsCard = ({ documents }) => {
  const isEmpty = !documents || (Array.isArray(documents) && documents.length === 0);

  return (
    <div className={`rounded-xl border ${isEmpty ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}`}>
      <div className="px-5 py-4 flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isEmpty ? 'bg-slate-200' : 'bg-blue-100'}`}>
          {isEmpty ? (
            <FileX className="w-5 h-5 text-slate-400" />
          ) : (
            <FileText className="w-5 h-5 text-blue-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${isEmpty ? 'text-slate-500' : 'text-slate-900'}`}>
            Documents to Request
          </h3>
          {isEmpty ? (
            <p className="text-sm mt-1 text-slate-400 italic">
              N/A — No documentation could overcome prohibitions
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {documents.map((doc, index) => (
                <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  {doc}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MEMO CARD
// ============================================
export const MemoCard = ({ memo }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(memo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!memo) return null;

  return (
    <div className="bg-slate-900 text-white rounded-xl overflow-hidden shadow-lg">
      <div className="px-5 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-400 text-sm uppercase tracking-wider">The Memo</h3>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="p-5">
        <p className="text-slate-200 leading-relaxed">{memo}</p>
      </div>
    </div>
  );
};

// ============================================
// KEEP EXPLORING CARD
// ============================================
export const KeepExploringCard = ({ actions, onActionClick }) => {
  if (!actions || actions.length === 0) return null;

  const iconMap = {
    search: Search,
    users: Users,
    network: Network,
    check: CheckCircle2,
    file: FileText,
    globe: Globe,
    building: Building2,
    gavel: Gavel,
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-slate-900">Keep Exploring</h3>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {actions.map((action, index) => {
          const actionLabel = typeof action === 'string' ? action : action.label;
          const actionIcon = typeof action === 'string' ? 'search' : (action.icon || 'search');
          const IconComponent = iconMap[actionIcon] || Search;
          return (
            <button
              key={index}
              onClick={() => onActionClick && onActionClick(actionLabel)}
              className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-100 transition-colors text-left group"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                <IconComponent className="w-5 h-5 text-gray-600" />
              </div>
              <span className="flex-1 text-sm text-slate-700 group-hover:text-gray-900">
                {actionLabel}
              </span>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-gray-600 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// MAIN SCREENING RESULTS COMPONENT
// ============================================
export const ScreeningResults = ({ data, onExportPDF, onExploreAction }) => {
  if (!data) return null;

  const {
    riskLevel,
    entity,
    alertBanner,
    metadata,
    redFlags,
    typologies,
    decision,
    documentsToRequest,
    memo,
    keepExploring,
  } = data;

  const normalizedRisk = (riskLevel || '').toLowerCase();

  return (
    <div className="space-y-5">
      {/* Alert Banner */}
      {alertBanner?.show !== false && (normalizedRisk === 'critical' || normalizedRisk === 'high') && (
        <AlertBanner
          level={normalizedRisk}
          title={alertBanner?.title}
          subtitle={alertBanner?.subtitle}
        />
      )}

      {/* Risk Badge */}
      <div className="flex items-center justify-between">
        <RiskBadge level={riskLevel} />
      </div>

      {/* Entity Card */}
      {entity && <EntityCard entity={entity} />}

      {/* Metadata Grid */}
      {metadata && metadata.length > 0 && <MetadataGrid items={metadata} />}

      {/* Red Flags Section */}
      {redFlags && redFlags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
            Critical Red Flags ({redFlags.length})
          </h3>
          <div className="space-y-4">
            {redFlags.map((flag, index) => (
              <RedFlagCard key={index} flag={flag} />
            ))}
          </div>
        </div>
      )}

      {/* Typologies */}
      {typologies && typologies.length > 0 && <TypologiesCard typologies={typologies} />}

      {/* Decision Banner */}
      {decision && <DecisionBanner decision={decision} />}

      {/* Documents Card */}
      <DocumentsCard documents={documentsToRequest} />

      {/* Memo Card */}
      {memo && <MemoCard memo={memo} />}

      {/* Keep Exploring */}
      {keepExploring && keepExploring.length > 0 && (
        <KeepExploringCard actions={keepExploring} onActionClick={onExploreAction} />
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <button
          onClick={onExportPDF}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm text-sm"
        >
          <Download className="w-4 h-4" />
          Export PDF Report
        </button>
      </div>
    </div>
  );
};

// ============================================
// HELPER: Parse JSON from message content
// ============================================
export const parseScreeningJSON = (content) => {
  if (!content) return null;

  try {
    // Try to extract JSON from code block
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim());
    }

    // Try to find raw JSON object
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('Failed to parse screening JSON:', e);
  }

  return null;
};

// ============================================
// HELPER: Check if content is screening JSON
// ============================================
export const isScreeningJSON = (content) => {
  if (!content) return false;

  // Check for JSON code block with screening fields
  if (content.includes('```json') && content.includes('"riskLevel"')) {
    return true;
  }

  // Check for raw JSON with screening fields
  if (content.includes('"riskLevel"') && content.includes('"redFlags"')) {
    return true;
  }

  return false;
};

export default ScreeningResults;
