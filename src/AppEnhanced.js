// Marlowe v1.2 - Screening mode with knowledge-based analysis
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileText, Clock, Users, AlertTriangle, ChevronRight, ChevronDown, ChevronLeft, Search, Zap, Eye, Link2, X, Loader2, Shield, Network, FileWarning, CheckCircle2, XCircle, HelpCircle, BookOpen, Target, Lightbulb, ArrowRight, MessageCircle, MessageSquare, Send, Minimize2, Folder, Plus, Trash2, ArrowLeft, FolderOpen, Calendar, Pencil, Check, UserSearch, Building2, Globe, Newspaper, ShieldCheck, ShieldAlert, Home, GitBranch, Share2, Database, Scale, Flag, Download, FolderPlus, History, Tag, Moon, Sun, Briefcase, LogOut, User } from 'lucide-react';
import * as mammoth from 'mammoth';
import { jsPDF } from 'jspdf'; // eslint-disable-line no-unused-vars
import * as pdfjsLib from 'pdfjs-dist';
import ForceGraph2D from 'react-force-graph-2d';
import { pdf } from '@react-pdf/renderer';
import ComplianceReportPDF from './ComplianceReportPDF';
import { useAuth } from './AuthContext';
import AuthPage from './AuthPage';
import { fetchUserCases, syncCase, deleteCase as deleteCaseFromDb } from './casesService';
import { isSupabaseConfigured } from './supabaseClient';

// Configure PDF.js worker - use local file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// API base URL - uses local server in development, relative paths in production
const API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '';

// ============================================================================
// PDF REPORT STYLES - Professional Compliance Screening Report
// ============================================================================
const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  // Header
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#f59e0b',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
  },
  headerRight: {
    textAlign: 'right',
  },
  reportTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  caseInfo: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  confidentialBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    marginTop: 6,
  },
  confidentialText: {
    fontSize: 7,
    color: '#92400e',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Risk Badge
  riskBadgeContainer: {
    marginBottom: 20,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  riskBadgeCritical: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  riskBadgeHigh: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  riskBadgeMedium: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  riskBadgeLow: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  riskBadgeText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  riskTextCritical: { color: '#991b1b' },
  riskTextHigh: { color: '#9a3412' },
  riskTextMedium: { color: '#92400e' },
  riskTextLow: { color: '#166534' },
  // Alert Banner
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  alertIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertIconText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#991b1b',
    marginBottom: 2,
  },
  alertText: {
    fontSize: 9,
    color: '#7f1d1d',
  },
  // Entity Card
  entityCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
  },
  entityAvatar: {
    width: 50,
    height: 50,
    backgroundColor: '#1e293b',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  entityAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
  },
  entityInfo: {
    flex: 1,
  },
  entityName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 3,
  },
  entityType: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 6,
  },
  entityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entityStatusBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  entityStatusText: {
    fontSize: 8,
    color: '#475569',
  },
  // Metadata Grid
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 10,
  },
  metadataItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 12,
    width: '48%',
  },
  metadataLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 10,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#fee2e2',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconText: {
    color: '#dc2626',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  sectionCount: {
    fontSize: 10,
    color: '#64748b',
    marginLeft: 6,
  },
  // Red Flag Card
  redFlagCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  redFlagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  redFlagNumber: {
    width: 28,
    height: 28,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  redFlagNumberText: {
    color: '#dc2626',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  redFlagTitle: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  redFlagBody: {
    padding: 12,
  },
  redFlagFact: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.5,
    marginBottom: 10,
  },
  // Compliance Impact Box
  complianceImpact: {
    backgroundColor: '#fffbeb',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    borderRadius: 4,
    padding: 12,
    marginTop: 8,
  },
  complianceImpactLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  complianceImpactText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.5,
  },
  // Sources
  sourcesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  sourceTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sourceText: {
    fontSize: 8,
    color: '#475569',
  },
  // Summary Section
  summarySection: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.6,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerConfidential: {
    fontSize: 8,
    color: '#94a3b8',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerRight: {
    textAlign: 'right',
  },
  footerPageNumber: {
    fontSize: 8,
    color: '#64748b',
  },
  footerGenerated: {
    fontSize: 7,
    color: '#94a3b8',
  },
  // Disclaimer
  disclaimer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  disclaimerText: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  // Analyst Section
  analystSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 12,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analystLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  analystValue: {
    fontSize: 9,
    color: '#0f172a',
    marginTop: 2,
  },
});

// ============================================================================
// PDF DOCUMENT COMPONENT
// ============================================================================
const ComplianceReportPDF = ({ data }) => {
  const getRiskBadgeStyle = (level) => {
    const styles = {
      critical: { badge: pdfStyles.riskBadgeCritical, text: pdfStyles.riskTextCritical },
      high: { badge: pdfStyles.riskBadgeHigh, text: pdfStyles.riskTextHigh },
      medium: { badge: pdfStyles.riskBadgeMedium, text: pdfStyles.riskTextMedium },
      low: { badge: pdfStyles.riskBadgeLow, text: pdfStyles.riskTextLow },
    };
    return styles[level?.toLowerCase()] || styles.medium;
  };

  const riskStyles = getRiskBadgeStyle(data.riskLevel);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerTop}>
            <View style={pdfStyles.logoPlaceholder}>
              <Text style={pdfStyles.logoText}>M</Text>
            </View>
            <View style={pdfStyles.headerRight}>
              <Text style={pdfStyles.reportTitle}>COMPLIANCE SCREENING REPORT</Text>
              <Text style={pdfStyles.reportSubtitle}>Confidential — Internal Use Only</Text>
              <Text style={pdfStyles.caseInfo}>Case #{data.caseNumber}</Text>
              <Text style={pdfStyles.caseInfo}>Generated: {data.generatedDate}</Text>
            </View>
          </View>
        </View>

        {/* Risk Badge */}
        <View style={pdfStyles.riskBadgeContainer}>
          <View style={[pdfStyles.riskBadge, riskStyles.badge]}>
            <Text style={[pdfStyles.riskBadgeText, riskStyles.text]}>
              ⚠ {data.riskLevel?.toUpperCase()} RISK
            </Text>
          </View>
        </View>

        {/* Alert Banner for Critical/High Risk */}
        {(data.riskLevel === 'critical' || data.riskLevel === 'high') && (
          <View style={pdfStyles.alertBanner}>
            <View style={pdfStyles.alertIcon}>
              <Text style={pdfStyles.alertIconText}>!</Text>
            </View>
            <View style={pdfStyles.alertContent}>
              <Text style={pdfStyles.alertTitle}>
                {data.riskLevel === 'critical'
                  ? 'High-Profile Screening Hit — Immediate Escalation Required'
                  : 'Elevated Risk Alert — Enhanced Due Diligence Required'}
              </Text>
              <Text style={pdfStyles.alertText}>
                {data.riskLevel === 'critical'
                  ? 'This entity requires senior compliance review before any transaction processing.'
                  : 'This entity has significant risk indicators requiring additional review.'}
              </Text>
            </View>
          </View>
        )}

        {/* Entity Card */}
        <View style={pdfStyles.entityCard}>
          <View style={pdfStyles.entityAvatar}>
            <Text style={pdfStyles.entityAvatarText}>
              {data.entity?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={pdfStyles.entityInfo}>
            <Text style={pdfStyles.entityName}>{data.entity?.name || 'Unknown Entity'}</Text>
            <Text style={pdfStyles.entityType}>{data.entity?.type || 'Entity Type Unknown'}</Text>
            {data.entity?.status && (
              <View style={pdfStyles.entityStatus}>
                <View style={pdfStyles.entityStatusBadge}>
                  <Text style={pdfStyles.entityStatusText}>
                    {data.entity.status} — {data.entity.statusDate || 'Date Unknown'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Metadata Grid */}
        {data.metadata && (
          <View style={pdfStyles.metadataGrid}>
            {data.metadata.riskLevel && (
              <View style={pdfStyles.metadataItem}>
                <Text style={pdfStyles.metadataLabel}>Risk Level</Text>
                <Text style={pdfStyles.metadataValue}>{data.metadata.riskLevel}</Text>
              </View>
            )}
            {data.metadata.designation && (
              <View style={pdfStyles.metadataItem}>
                <Text style={pdfStyles.metadataLabel}>Designation</Text>
                <Text style={pdfStyles.metadataValue}>{data.metadata.designation}</Text>
              </View>
            )}
            {data.metadata.jurisdiction && (
              <View style={pdfStyles.metadataItem}>
                <Text style={pdfStyles.metadataLabel}>Jurisdiction</Text>
                <Text style={pdfStyles.metadataValue}>{data.metadata.jurisdiction}</Text>
              </View>
            )}
            {data.metadata.lastUpdated && (
              <View style={pdfStyles.metadataItem}>
                <Text style={pdfStyles.metadataLabel}>Last Updated</Text>
                <Text style={pdfStyles.metadataValue}>{data.metadata.lastUpdated}</Text>
              </View>
            )}
          </View>
        )}

        {/* Summary Section */}
        {data.summary && (
          <View style={pdfStyles.summarySection}>
            <Text style={pdfStyles.summaryTitle}>Executive Summary</Text>
            <Text style={pdfStyles.summaryText}>{data.summary}</Text>
          </View>
        )}

        {/* Red Flags Section */}
        {data.redFlags && data.redFlags.length > 0 && (
          <>
            <View style={pdfStyles.sectionHeader}>
              <View style={pdfStyles.sectionIcon}>
                <Text style={pdfStyles.sectionIconText}>⚑</Text>
              </View>
              <Text style={pdfStyles.sectionTitle}>Critical Red Flags</Text>
              <Text style={pdfStyles.sectionCount}>({data.redFlags.length})</Text>
            </View>

            {data.redFlags.map((flag, index) => (
              <View key={index} style={pdfStyles.redFlagCard} wrap={false}>
                <View style={pdfStyles.redFlagHeader}>
                  <View style={pdfStyles.redFlagNumber}>
                    <Text style={pdfStyles.redFlagNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={pdfStyles.redFlagTitle}>{flag.title}</Text>
                </View>
                <View style={pdfStyles.redFlagBody}>
                  <Text style={pdfStyles.redFlagFact}>{flag.fact}</Text>

                  {flag.complianceImpact && (
                    <View style={pdfStyles.complianceImpact}>
                      <Text style={pdfStyles.complianceImpactLabel}>Compliance Impact</Text>
                      <Text style={pdfStyles.complianceImpactText}>{flag.complianceImpact}</Text>
                    </View>
                  )}

                  {flag.sources && flag.sources.length > 0 && (
                    <View style={pdfStyles.sourcesContainer}>
                      {flag.sources.map((source, sIdx) => (
                        <View key={sIdx} style={pdfStyles.sourceTag}>
                          <Text style={pdfStyles.sourceText}>{source}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Analyst Section */}
        <View style={pdfStyles.analystSection}>
          <View>
            <Text style={pdfStyles.analystLabel}>Report Generated By</Text>
            <Text style={pdfStyles.analystValue}>Marlowe AI Screening System</Text>
          </View>
          <View>
            <Text style={pdfStyles.analystLabel}>Reviewed By</Text>
            <Text style={pdfStyles.analystValue}>_________________________</Text>
          </View>
          <View>
            <Text style={pdfStyles.analystLabel}>Date</Text>
            <Text style={pdfStyles.analystValue}>_____________</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={pdfStyles.disclaimer}>
          <Text style={pdfStyles.disclaimerText}>
            This screening result is for compliance purposes only. Data sourced from official government registries,
            recognized watchlists, and public records. This report does not constitute legal advice.
            All findings should be verified through appropriate due diligence procedures.
          </Text>
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer} fixed>
          <View style={pdfStyles.footerLeft}>
            <Text style={pdfStyles.footerConfidential}>CONFIDENTIAL</Text>
          </View>
          <View style={pdfStyles.footerRight}>
            <Text style={pdfStyles.footerPageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
            <Text style={pdfStyles.footerGenerated}>Generated by Marlowe</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// ============================================================================
// PARSE MESSAGE TO PDF DATA
// ============================================================================
const parseMessageToPdfData = (messageContent) => {
  const data = {
    caseNumber: `SCR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
    generatedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    riskLevel: 'medium',
    entity: {
      name: 'Unknown Entity',
      type: 'Individual',
      status: null,
      statusDate: null,
    },
    metadata: {
      riskLevel: null,
      designation: null,
      jurisdiction: null,
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    summary: null,
    redFlags: [],
  };

  if (!messageContent) return data;

  // Extract risk level
  const riskMatch = messageContent.match(/OVERALL RISK:?\s*(CRITICAL|HIGH|MEDIUM|LOW)/i);
  if (riskMatch) {
    data.riskLevel = riskMatch[1].toLowerCase();
    data.metadata.riskLevel = riskMatch[1].charAt(0) + riskMatch[1].slice(1).toLowerCase();
  }

  // Extract entity name - try multiple patterns
  const entityPatterns = [
    /(?:Subject|Entity|Individual|Person):\s*\*?\*?([^*\n]+)\*?\*?/i,
    /screening (?:of|for)\s+\*?\*?([^*\n,.]+)\*?\*?/i,
    /(?:regarding|about)\s+\*?\*?([^*\n,.]+)\*?\*?/i,
  ];
  for (const pattern of entityPatterns) {
    const match = messageContent.match(pattern);
    if (match) {
      data.entity.name = match[1].trim().replace(/\*\*/g, '');
      break;
    }
  }

  // Extract entity type
  const typeMatch = messageContent.match(/(?:PEP|Politically Exposed Person|Religious Leader|Business Entity|Corporation|Individual|Organization)[^.]*?(?=[.\n])/i);
  if (typeMatch) {
    data.entity.type = typeMatch[0].trim();
  }

  // Extract status (deceased, active, etc.)
  const statusMatch = messageContent.match(/(?:deceased|died|active|wanted|fugitive)\s*(?:[-—]\s*)?(?:(?:in\s+)?(\w+\s+\d{4}|\d{4}))?/i);
  if (statusMatch) {
    data.entity.status = statusMatch[0].split(/[-—]/)[0].trim();
    if (statusMatch[1]) {
      data.entity.statusDate = statusMatch[1];
    }
  }

  // Extract designation
  const designationMatch = messageContent.match(/(?:designated as|designation:?)\s*([^.\n]+)/i);
  if (designationMatch) {
    data.metadata.designation = designationMatch[1].trim();
  }

  // Extract jurisdiction
  const jurisdictionMatch = messageContent.match(/(?:jurisdiction:?|operates in|active in)\s*([^.\n]+)/i);
  if (jurisdictionMatch) {
    data.metadata.jurisdiction = jurisdictionMatch[1].trim().substring(0, 30);
  } else {
    data.metadata.jurisdiction = 'Global';
  }

  // Extract summary (first paragraph or THE MEMO section)
  const summaryMatch = messageContent.match(/(?:THE MEMO|SUMMARY|EXECUTIVE SUMMARY)[:\s]*\n?([^\n]+(?:\n[^\n]+)?)/i);
  if (summaryMatch) {
    data.summary = summaryMatch[1].trim().replace(/\*\*/g, '');
  } else {
    // Use first substantial paragraph as summary
    const paragraphs = messageContent.split(/\n\n+/);
    for (const p of paragraphs) {
      if (p.length > 100 && !p.match(/^[A-Z\s]+$/)) {
        data.summary = p.trim().substring(0, 500).replace(/\*\*/g, '');
        break;
      }
    }
  }

  // Extract red flags
  const redFlagSection = messageContent.match(/(?:RED FLAGS?|CRITICAL RED FLAGS?)[:\s]*\n([\s\S]*?)(?=\n(?:[A-Z][A-Z\s]+:|\n\n\n|$))/i);
  if (redFlagSection) {
    const flagContent = redFlagSection[1];

    // Match numbered items with bold titles
    const flagPattern = /(\d+)\.\s*\*\*([^*]+)\*\*:?\s*([^]*?)(?=\n\d+\.\s*\*\*|$)/g;
    let match;

    while ((match = flagPattern.exec(flagContent)) !== null) {
      const title = match[2].trim();
      let factText = match[3].trim();
      let complianceImpact = null;

      // Extract translation/compliance impact
      const translationMatch = factText.match(/(?:Translation|Compliance Impact|What this means):?\s*([^]*?)(?=\n\n|$)/i);
      if (translationMatch) {
        complianceImpact = translationMatch[1].trim().replace(/\*\*/g, '');
        factText = factText.replace(translationMatch[0], '').trim();
      }

      // Extract sources (look for common source patterns)
      const sources = [];
      const sourcePatterns = [
        /Source:?\s*([^,\n]+)/gi,
        /\(([^)]*(?:report|ministry|registry|database|interpol)[^)]*)\)/gi,
      ];
      for (const sp of sourcePatterns) {
        let sourceMatch;
        while ((sourceMatch = sp.exec(factText)) !== null) {
          sources.push(sourceMatch[1].trim());
        }
      }

      data.redFlags.push({
        category: 'Red Flag',
        title,
        fact: factText.replace(/\*\*/g, '').substring(0, 500),
        complianceImpact,
        sources: sources.slice(0, 3),
      });
    }
  }

  // If no red flags found with the pattern, try simpler extraction
  if (data.redFlags.length === 0) {
    const simpleFlags = messageContent.match(/\d+\.\s*\*\*([^*]+)\*\*/g);
    if (simpleFlags) {
      simpleFlags.slice(0, 5).forEach((flag, idx) => {
        const titleMatch = flag.match(/\d+\.\s*\*\*([^*]+)\*\*/);
        if (titleMatch) {
          data.redFlags.push({
            category: 'Finding',
            title: titleMatch[1].trim(),
            fact: 'See full analysis for details.',
            complianceImpact: null,
            sources: [],
          });
        }
      });
    }
  }

  return data;
};

// ============================================================================
// OWNERSHIP NETWORK GRAPH COMPONENT - Visual network representation
// ============================================================================
const OwnershipNetworkGraph = ({ centralEntity, ownedCompanies, beneficialOwners, corporateNetwork, height = 350 }) => {
  const graphRef = useRef();

  // Build graph data
  const graphData = React.useMemo(() => {
    const nodes = [];
    const links = [];

    // Add central entity node
    const centralId = 'central';
    const isPerson = ownedCompanies && ownedCompanies.length > 0;
    nodes.push({
      id: centralId,
      name: centralEntity || 'Subject',
      type: isPerson ? 'PERSON' : 'ORGANIZATION',
      isCentral: true,
      riskLevel: 'SUBJECT'
    });

    // For individuals: show owned companies
    if (ownedCompanies && ownedCompanies.length > 0) {
      ownedCompanies.forEach((company, idx) => {
        const nodeId = `owned-${idx}`;
        nodes.push({
          id: nodeId,
          name: company.company,
          type: 'ORGANIZATION',
          ownershipPercent: company.ownershipPercent,
          sanctioned: company.sanctionedOwner,
          riskLevel: company.sanctionedOwner ? 'CRITICAL' :
                     company.ownershipPercent >= 50 ? 'HIGH' :
                     company.ownershipPercent >= 25 ? 'MEDIUM' : 'LOW'
        });
        links.push({
          source: centralId,
          target: nodeId,
          label: `${company.ownershipPercent}%`,
          ownershipPercent: company.ownershipPercent,
          ownershipType: company.ownershipType
        });
      });
    }

    // For organizations: show beneficial owners
    if (beneficialOwners && beneficialOwners.length > 0) {
      beneficialOwners.forEach((owner, idx) => {
        const nodeId = `owner-${idx}`;
        const pct = owner.ownershipPercent || owner.percent || 0;
        nodes.push({
          id: nodeId,
          name: owner.name,
          type: 'PERSON',
          ownershipPercent: pct,
          sanctioned: owner.sanctionStatus === 'SANCTIONED',
          riskLevel: owner.sanctionStatus === 'SANCTIONED' ? 'CRITICAL' :
                     pct >= 50 ? 'HIGH' : pct >= 25 ? 'MEDIUM' : 'LOW'
        });
        links.push({
          source: nodeId,
          target: centralId,
          label: `${pct}%`,
          ownershipPercent: pct
        });
      });
    }

    // Add corporate network entities
    if (corporateNetwork && corporateNetwork.length > 0) {
      corporateNetwork.forEach((related, idx) => {
        const nodeId = `corp-${idx}`;
        nodes.push({
          id: nodeId,
          name: related.entity,
          type: 'ORGANIZATION',
          relationship: related.relationship,
          sanctioned: related.sanctionExposure === 'DIRECT',
          riskLevel: related.sanctionExposure === 'DIRECT' ? 'CRITICAL' :
                     related.sanctionExposure === 'INDIRECT' ? 'HIGH' : 'LOW'
        });
        links.push({
          source: centralId,
          target: nodeId,
          label: related.relationship,
          relationship: related.relationship,
          ownershipPercent: related.ownershipPercent
        });
      });
    }

    return { nodes, links };
  }, [centralEntity, ownedCompanies, beneficialOwners, corporateNetwork]);

  // Get node color based on risk/status
  const getNodeColor = (node) => {
    if (node.isCentral) return '#f59e0b'; // Amber for central entity
    if (node.sanctioned) return '#dc2626'; // Red for sanctioned
    if (node.riskLevel === 'CRITICAL') return '#dc2626';
    if (node.riskLevel === 'HIGH') return '#f43f5e';
    if (node.riskLevel === 'MEDIUM') return '#f59e0b';
    return '#10b981'; // Green for low risk
  };

  // Get link color based on ownership percentage
  const getLinkColor = (link) => {
    if (link.ownershipPercent >= 50) return '#dc2626'; // Red for controlling interest
    if (link.ownershipPercent >= 25) return '#f59e0b'; // Amber for significant
    return '#94a3b8'; // Gray for minor
  };

  if (graphData.nodes.length <= 1) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden" style={{ height }}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={node => `${node.name}${node.ownershipPercent ? `\n${node.ownershipPercent}%` : ''}`}
        nodeColor={getNodeColor}
        nodeVal={node => node.isCentral ? 12 : 8}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = node.isCentral ? 12 / globalScale : 10 / globalScale;
          const nodeSize = node.isCentral ? 12 : 8;

          // Draw node circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
          ctx.fillStyle = getNodeColor(node);
          ctx.fill();

          // Draw border for sanctioned nodes
          if (node.sanctioned) {
            ctx.strokeStyle = '#7f1d1d';
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
          }

          // Draw person icon for individuals
          if (node.type === 'PERSON') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(node.x, node.y - 2, 3 / globalScale, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(node.x, node.y + 4, 5 / globalScale, Math.PI, 0);
            ctx.fill();
          }

          // Draw building icon for organizations
          if (node.type === 'ORGANIZATION' && !node.isCentral) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(node.x - 3, node.y - 4, 6, 8);
          }

          // Draw label below node
          ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = node.isCentral ? '#0f172a' : '#475569';

          // Truncate long names
          const maxLen = 18;
          const displayLabel = label.length > maxLen ? label.substring(0, maxLen) + '...' : label;
          ctx.fillText(displayLabel, node.x, node.y + nodeSize + 4);
        }}
        linkColor={getLinkColor}
        linkWidth={link => link.ownershipPercent >= 50 ? 3 : link.ownershipPercent >= 25 ? 2 : 1}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={0.9}
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={(link, ctx, globalScale) => {
          if (!link.label) return;
          const fontSize = 9 / globalScale;
          ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
          ctx.fillStyle = '#64748b';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Position label at midpoint
          const midX = (link.source.x + link.target.x) / 2;
          const midY = (link.source.y + link.target.y) / 2;

          // Draw background
          const textWidth = ctx.measureText(link.label).width;
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(midX - textWidth/2 - 2, midY - fontSize/2 - 1, textWidth + 4, fontSize + 2);

          // Draw text
          ctx.fillStyle = link.ownershipPercent >= 50 ? '#dc2626' : '#64748b';
          ctx.fillText(link.label, midX, midY);
        }}
        d3VelocityDecay={0.4}
        d3AlphaDecay={0.05}
        cooldownTime={1500}
        width={undefined}
        height={height}
        backgroundColor="#f9fafb"
      />
    </div>
  );
};

// Main Marlowe Component
export default function Marlowe() {
 // Auth state - must be called before any conditional returns
 const { user, loading: authLoading, isAuthenticated, isConfigured, signOut, trackQuery } = useAuth();

 const [currentPage, setCurrentPage] = useState('noirLanding'); // 'noirLanding', 'newCase', 'existingCases', 'activeCase'
 const [cases, setCases] = useState([]);
 const [activeCase, setActiveCase] = useState(null);
 const [currentCaseId, setCurrentCaseId] = useState(null); // Track current case for auto-save
 const [files, setFiles] = useState([]);
 const [analysis, setAnalysis] = useState(null);
 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const [activeTab, setActiveTab] = useState('overview');
 const [selectedEvent, setSelectedEvent] = useState(null);
 const [selectedEntity, setSelectedEntity] = useState(null);
 const [entityImages, setEntityImages] = useState({}); // eslint-disable-line no-unused-vars
 const [dragActive, setDragActive] = useState(false);
 const [expandedHypotheses, setExpandedHypotheses] = useState({});
 const [expandedInvestigations, setExpandedInvestigations] = useState({}); // eslint-disable-line no-unused-vars
 const [chatOpen, setChatOpen] = useState(false);
 const [chatMessages, setChatMessages] = useState([]);
 const [chatInput, setChatInput] = useState('');
 const [isChatLoading, setIsChatLoading] = useState(false);
 const [caseName, setCaseName] = useState('');
 const [caseDescription, setCaseDescription] = useState('');
 const [placeholderIndex, setPlaceholderIndex] = useState(0);
 const [editingCaseId, setEditingCaseId] = useState(null);
 const [editingCaseName, setEditingCaseName] = useState('');
 const [isEditingCaseName, setIsEditingCaseName] = useState(false);
 const [tempCaseName, setTempCaseName] = useState('');
 
 const [analysisError, setAnalysisError] = useState(null); // eslint-disable-line no-unused-vars

 // Document preview modal state
 const [docPreview, setDocPreview] = useState({ open: false, docIndex: null, docName: '', content: '' });

 // Background analysis state - allows navigation while processing
 const [backgroundAnalysis, setBackgroundAnalysis] = useState({
   isRunning: false,
   isComplete: false,
   caseId: null,
   caseName: '',
   currentStep: '',
   stepNumber: 0,
   totalSteps: 10,
   progress: 0,
   pendingAnalysis: null // Stores completed analysis until user clicks to view
 });

 // Track if floating notification has been dismissed (separate from completion card)
 const [notificationDismissed, setNotificationDismissed] = useState(false);

 // Email gate modal state - shows when user tries to enter without email
 const [showEmailModal, setShowEmailModal] = useState(false);

 // Investigation mode state
 const [investigationMode, setInvestigationMode] = useState('cipher'); // 'cipher' or 'scout'
 const [showModeDropdown, setShowModeDropdown] = useState(false);

 // Scout state
 const [kycPage, setKycPage] = useState('landing'); // 'landing', 'newSearch', 'history', 'projects', 'results'
 const [kycQuery, setKycQuery] = useState('');
 const [kycType, setKycType] = useState('individual'); // 'individual' or 'entity'
 const [kycResults, setKycResults] = useState(null);
 const [isScreening, setIsScreening] = useState(false);
 const [screeningStep, setScreeningStep] = useState('');
 const [screeningProgress, setScreeningProgress] = useState(0);
 const [kycHistory, setKycHistory] = useState([]);
 const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
 
 // Individual screening fields
 const [kycClientRef, setKycClientRef] = useState('');
 const [kycYearOfBirth, setKycYearOfBirth] = useState('');
 const [kycCountry, setKycCountry] = useState('');
 
 // Projects
 const [kycProjects, setKycProjects] = useState([]);
 const [selectedProject, setSelectedProject] = useState(null);
 const [newProjectName, setNewProjectName] = useState('');
 const [assigningToProject, setAssigningToProject] = useState(null); // screening ID being assigned
 const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
 const [isGeneratingCaseReport, setIsGeneratingCaseReport] = useState(false);
 const [viewingCaseId, setViewingCaseId] = useState(null); // For Case Detail page view

 // KYC Chat state
 const [kycChatOpen, setKycChatOpen] = useState(false);
 const [kycChatMessages, setKycChatMessages] = useState([]);
 const [kycChatInput, setKycChatInput] = useState('');

 // Upload dropdown state
 const [showUploadDropdown, setShowUploadDropdown] = useState(false);
 const [isKycChatLoading, setIsKycChatLoading] = useState(false);

 // Conversational interface state
 const [conversationMessages, setConversationMessages] = useState([]);
 const [conversationInput, setConversationInput] = useState('');
 const [isStreaming, setIsStreaming] = useState(false);
 const [streamingText, setStreamingText] = useState('');
 const [conversationStarted, setConversationStarted] = useState(false); // Input centered until first message
 const [sidebarOpen, setSidebarOpen] = useState(true); // eslint-disable-line no-unused-vars
 const conversationEndRef = useRef(null);
 const mainInputRef = useRef(null);
 const bottomInputRef = useRef(null);

 const kycChatEndRef = useRef(null);

 const chatEndRef = useRef(null);
 const fileInputRef = useRef(null);
 const editInputRef = useRef(null);
 const analysisAbortRef = useRef(null); // AbortController for cancelling analysis
 const modeDropdownRef = useRef(null);
 const uploadDropdownRef = useRef(null);

 // Landing page state
 const [showLandingCards, setShowLandingCards] = useState(false); // eslint-disable-line no-unused-vars
 const [hoveredCard, setHoveredCard] = useState(null); // eslint-disable-line no-unused-vars
 const [showLandingContent, setShowLandingContent] = useState(false); // eslint-disable-line no-unused-vars
 const [hasVisitedLanding, setHasVisitedLanding] = useState(false);
 const [marloweAnimationPhase, setMarloweAnimationPhase] = useState('large'); // eslint-disable-line no-unused-vars
 const [darkMode, setDarkMode] = useState(false);
 const [hasScrolled, setHasScrolled] = useState(false);

 // Rotating headers for the main input page
 const investigateHeaders = [
 "What can I help you investigate?",
 "Where should we begin?",
 "What are we working on?",
 "Marlowe's on the case",
 "What do you have for me?",
 "Let's get started"
 ];
 const [currentHeader] = useState(() => investigateHeaders[Math.floor(Math.random() * investigateHeaders.length)]);

 // Rotating placeholder examples - different for each mode
 const cipherPlaceholderExamples = [
 "Evaluate possible signs of fraud in these quarterly financials...",
 "What are the money laundering risks of the entities mentioned in this email chain...",
 "Analyze these cap tables for possible sanctions exposure...",
 "Identify potential red flags in this employee expense report...",
 "Describe any irregularities in these inventory records suggesting potential theft or mismanagement...",
 "What anomalies in this payroll data could indicate ghost employees...",
 "What warning signs indicate this insurance claim might be fraudulent..."
 ];

 const scoutPlaceholderExamples = [
 "Screen an individual (Try \"Oleg Deripaska\" or \"Fetullah Gulen\")",
 "Check an entity (Try \"EN+ Group\" or \"COSCO Shipping\")"
 ];

 const placeholderExamples = investigationMode === 'scout' ? scoutPlaceholderExamples : cipherPlaceholderExamples;

 // Reset placeholder index when mode changes to avoid out-of-bounds
 useEffect(() => {
 setPlaceholderIndex(0);
 }, [investigationMode]);

 // Rotate placeholder with fade timing - synchronized with CSS animation
 useEffect(() => {
 // Start interval immediately to sync with CSS animation
 const interval = setInterval(() => {
 setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
 }, 7000); // Change every 7 seconds to match CSS animation duration
 return () => clearInterval(interval);
 }, [placeholderExamples.length]);

 // Load cases from Supabase when user logs in
 useEffect(() => {
 const loadCases = async () => {
   if (isSupabaseConfigured() && user) {
     const { data, error } = await fetchUserCases();
     if (data && !error) {
       setCases(data);
     }
   }
 };
 loadCases();
 }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

 // Landing page fade-in animation
 useEffect(() => {
 if (currentPage === 'noirLanding') {
 if (!hasVisitedLanding) {
 // First visit - fade in after delay
 setHasVisitedLanding(true);
 const timer = setTimeout(() => {
 setShowLandingContent(true);
 }, 500);
 return () => clearTimeout(timer);
 } else {
 // Subsequent visits - show immediately
 setShowLandingContent(true);
 }
 }
 }, [currentPage, hasVisitedLanding]);

 // Hide scroll indicator once user has scrolled
 useEffect(() => {
 const handleScroll = () => {
 if (window.scrollY > 100) {
 setHasScrolled(true);
 }
 };
 window.addEventListener('scroll', handleScroll);
 return () => window.removeEventListener('scroll', handleScroll);
 }, []);

 // Reset scroll indicator when returning to landing page
 useEffect(() => {
 if (currentPage === 'noirLanding') {
 setHasScrolled(false);
 }
 }, [currentPage]);

 // Close mode dropdown when clicking outside
 useEffect(() => {
 const handleClickOutside = (event) => {
 if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target)) {
 setShowModeDropdown(false);
 }
 if (uploadDropdownRef.current && !uploadDropdownRef.current.contains(event.target)) {
 setShowUploadDropdown(false);
 }
 };

 if (showModeDropdown || showUploadDropdown) {
 document.addEventListener('mousedown', handleClickOutside);
 return () => {
 document.removeEventListener('mousedown', handleClickOutside);
 };
 }
 }, [showModeDropdown, showUploadDropdown]);

 // Global click handler for clickable text in responses
 useEffect(() => {
   const handleExploreClick = (e) => {
     // First try data-explore-point attribute
     const explorePoint = e.target.closest('[data-explore-point]');
     if (explorePoint) {
       const pointText = explorePoint.getAttribute('data-explore-point');
       if (pointText) {
         e.preventDefault();
         e.stopPropagation();
         setConversationInput(`Tell me more about: ${pointText}`);
         if (bottomInputRef.current) bottomInputRef.current.focus();
         return;
       }
     }

     // Fallback: if clicking on li, div, or span inside the prose container, use text content
     const proseContainer = e.target.closest('.prose');
     if (proseContainer) {
       const clickedElement = e.target.closest('li, div, span, strong');
       if (clickedElement && clickedElement !== proseContainer) {
         const text = clickedElement.textContent?.trim();
         // Only use if it's a reasonable length (not the whole document)
         if (text && text.length > 5 && text.length < 200) {
           e.preventDefault();
           e.stopPropagation();
           setConversationInput(`Tell me more about: ${text}`);
           if (bottomInputRef.current) bottomInputRef.current.focus();
         }
       }
     }
   };

   document.addEventListener('click', handleExploreClick);
   return () => document.removeEventListener('click', handleExploreClick);
 }, []);

 // Save case after analysis completes (does NOT navigate - user clicks popup to view)
 // Pass caseNameOverride to avoid React state timing issues
 const saveCase = (analysisData, caseNameOverride = null) => {
 const newCase = {
 id: Math.random().toString(36).substr(2, 9),
 name: caseNameOverride || caseName || `Case ${cases.length + 1}`,
 createdAt: new Date().toISOString(),
 updatedAt: new Date().toISOString(),
 files: files,
 analysis: analysisData,
 chatHistory: [],
 riskLevel: analysisData?.executiveSummary?.riskLevel || 'UNKNOWN'
 };
 setCases(prev => [newCase, ...prev]);
 setActiveCase(newCase);
 // Don't navigate here - user will click popup to view results

 // Sync to Supabase if configured
 if (isSupabaseConfigured() && user) {
   syncCase(newCase).catch(console.error);
 }

 // Save to reference database for AI learning (HIGH or CRITICAL cases only)
 if (analysisData?.executiveSummary?.riskLevel === 'HIGH' ||
 analysisData?.executiveSummary?.riskLevel === 'CRITICAL') {
 saveToReferenceDatabase(newCase);
 }
 };

 // Save high-quality analyses to reference database
 const saveToReferenceDatabase = async (caseData) => {
 try {
 // Create a sanitized reference entry (remove file contents for size)
 const referenceEntry = {
 id: caseData.id,
 name: caseData.name,
 createdAt: caseData.createdAt,
 riskLevel: caseData.riskLevel,
 fileTypes: caseData.files.map(f => ({ name: f.name, type: f.type })),
 analysis: {
 executiveSummary: caseData.analysis.executiveSummary,
 entities: caseData.analysis.entities?.slice(0, 10), // First 10 entities
 relationships: caseData.analysis.relationships?.slice(0, 15), // First 15 relationships
 timeline: caseData.analysis.timeline?.slice(0, 20), // First 20 events
 typologies: caseData.analysis.typologies,
 hypotheses: caseData.analysis.hypotheses,
 patterns: caseData.analysis.patterns,
 redFlags: caseData.analysis.redFlags
 }
 };

 // In a real app, this would POST to backend
 // For now, just log it (could save to localStorage)
 console.log('📚 Saving to reference database:', referenceEntry);

 // Save to localStorage as reference examples
 const existingReferences = JSON.parse(localStorage.getItem('marlowe_references') || '[]');
 existingReferences.push(referenceEntry);

 // Keep only last 50 reference cases
 const recentReferences = existingReferences.slice(-50);
 localStorage.setItem('marlowe_references', JSON.stringify(recentReferences));

 console.log(`✅ Reference database now contains ${recentReferences.length} cases`);
 } catch (error) {
 console.error('Failed to save to reference database:', error);
 }
 };

 // Load an existing case
 const loadCase = (caseData) => {
 setActiveCase(caseData);
 setFiles(caseData.files || []);
 setAnalysis(caseData.analysis);
 setChatMessages(caseData.chatHistory || []);
 setConversationMessages(caseData.conversationTranscript || []);
 setCaseName(caseData.name);
 setCurrentCaseId(caseData.id);
 setConversationStarted((caseData.conversationTranscript?.length || 0) > 0);
 setCurrentPage('newCase'); // Go to conversation view
 };

 // Start a new case (with email gate check)
 const startNewCase = () => {
   // Reset state for new case
   setFiles([]);
   setAnalysis(null);
   setAnalysisError(null);
   setChatMessages([]);
   setCaseName('');
   setCaseDescription('');
   setActiveCase(null);
   setActiveTab('overview');
   setSelectedEvent(null);
   setSelectedEntity(null);
   setChatOpen(false);
   setCurrentCaseId(null);
   setConversationMessages([]);
   setConversationStarted(false);
   setCurrentPage('newCase');

   // Check if user needs to enter email first
   if (!isAuthenticated) {
     setShowEmailModal(true);
   }
 };

 // Called after email is submitted - proceed to app
 const handleEmailSubmitted = () => {
   setShowEmailModal(false);
   // Page is already set to 'newCase' - just close the modal
 };

 // Auto-create a case when the first message is sent
 const createCaseFromFirstMessage = (userInput, attachedFiles) => {
   const generatedName = extractEntityName(userInput) || 'New Investigation';
   const newCaseId = Math.random().toString(36).substr(2, 9);

   const newCase = {
     id: newCaseId,
     name: generatedName,
     createdAt: new Date().toISOString(),
     updatedAt: new Date().toISOString(),
     files: attachedFiles || [],
     analysis: null,
     chatHistory: [],
     conversationTranscript: [], // Store full conversation
     pdfReports: [], // Store generated PDF reports
     networkArtifacts: [], // Store network graph snapshots
     riskLevel: 'UNKNOWN'
   };

   setCases(prev => [newCase, ...prev]);
   setCurrentCaseId(newCaseId);
   setCaseName(generatedName);

   // Sync to Supabase if configured
   if (isSupabaseConfigured() && user) {
     syncCase(newCase).catch(console.error);
   }

   return newCaseId;
 };

 // Update case with new conversation messages
 const updateCaseTranscript = (caseId, messages) => {
   setCases(prev => prev.map(c =>
     c.id === caseId
       ? { ...c, conversationTranscript: messages, updatedAt: new Date().toISOString() }
       : c
   ));
   // Sync update to Supabase
   if (isSupabaseConfigured() && user) {
     const updatedCase = cases.find(c => c.id === caseId);
     if (updatedCase) {
       syncCase({ ...updatedCase, conversationTranscript: messages }).catch(console.error);
     }
   }
 };

 // Add PDF report to case
 const addPdfReportToCase = (caseId, reportData) => {
   setCases(prev => {
     const updated = prev.map(c =>
       c.id === caseId
         ? { ...c, pdfReports: [...(c.pdfReports || []), reportData], updatedAt: new Date().toISOString() }
         : c
     );
     // Sync to Supabase
     if (isSupabaseConfigured() && user) {
       const updatedCase = updated.find(c => c.id === caseId);
       if (updatedCase) syncCase(updatedCase).catch(console.error);
     }
     return updated;
   });
 };

 // Add network artifact to case
 const addNetworkArtifactToCase = (caseId, artifactData) => { // eslint-disable-line no-unused-vars
   setCases(prev => {
     const updated = prev.map(c =>
       c.id === caseId
         ? { ...c, networkArtifacts: [...(c.networkArtifacts || []), artifactData], updatedAt: new Date().toISOString() }
         : c
     );
     // Sync to Supabase
     if (isSupabaseConfigured() && user) {
       const updatedCase = updated.find(c => c.id === caseId);
       if (updatedCase) syncCase(updatedCase).catch(console.error);
     }
     return updated;
   });
 };

 // Get case by ID helper
 const getCaseById = (caseId) => cases.find(c => c.id === caseId);

 // View completed analysis results
 const viewAnalysisResults = () => {
   if (backgroundAnalysis.pendingAnalysis) {
     setAnalysis(backgroundAnalysis.pendingAnalysis);
     setActiveTab('overview');
     // Reset the background analysis state
     setBackgroundAnalysis({
       isRunning: false,
       isComplete: false,
       caseId: null,
       caseName: '',
       currentStep: '',
       stepNumber: 0,
       totalSteps: 10,
       progress: 0,
       pendingAnalysis: null
     });
   }
 };

 // Cancel in-progress analysis
 const cancelAnalysis = () => {
   if (analysisAbortRef.current) {
     analysisAbortRef.current.abort();
     analysisAbortRef.current = null;
   }
   setIsAnalyzing(false);
   setBackgroundAnalysis({
     isRunning: false,
     isComplete: false,
     caseId: null,
     caseName: '',
     currentStep: '',
     stepNumber: 0,
     totalSteps: 10,
     progress: 0,
     pendingAnalysis: null
   });
 };

 // Extract entity name from description like "Tim Allen who is an actor" -> "Tim Allen"
 // or "Tell me the financial crime risks of investing in SuperHuman" -> "SuperHuman"
 const extractEntityName = (description) => {
   if (!description) return null;
   const desc = description.trim();

   // First, try to extract entity AFTER common prefixes (for question-style inputs)
   const prefixPatterns = [
     // "Tell me about X", "What about X"
     /(?:tell me about|what about|info on|information on|look up|lookup)\s+(.+)/i,
     // "risks of investing in X", "risks of X", "risk of X"
     /risks?\s+(?:of\s+)?(?:investing\s+in\s+|onboarding\s+|dealing\s+with\s+|working\s+with\s+)?(.+)/i,
     // "screen X", "check X", "analyze X"
     /(?:screen|check|analyze|investigate|review|assess|evaluate)\s+(.+)/i,
     // "due diligence on X"
     /(?:due\s+diligence|dd|kyc|aml\s+check)\s+(?:on|for)\s+(.+)/i,
     // "is X safe/risky"
     /(?:is|are)\s+(.+?)\s+(?:safe|risky|sanctioned|a\s+pep|high\s+risk).*$/i,
     // Last word(s) after "in" or "on" at end - "investing in X"
     /(?:investing|invest)\s+in\s+(.+)/i,
     /(?:onboarding|onboard)\s+(.+)/i,
   ];

   for (const pattern of prefixPatterns) {
     const match = desc.match(pattern);
     if (match && match[1]) {
       let extracted = match[1].trim();
       // Clean up trailing phrases and punctuation
       extracted = extracted.replace(/\s+(who|which|that|is\s+a|is\s+an|is\s+the|\(|,).*$/i, '').trim();
       extracted = extracted.replace(/[?.!]+$/, '').trim();
       if (extracted.length >= 2 && extracted.length <= 60) {
         return extracted;
       }
     }
   }

   // Fallback: patterns that indicate where the name ends (for "Name who is X" style)
   const separators = [/ who /i, / which /i, / that /i, / is a /i, / is an /i, / is the /i, / - /, /, /, / \(/];
   let entityName = desc;
   for (const sep of separators) {
     const match = desc.match(sep);
     if (match && match.index > 2) {
       entityName = desc.substring(0, match.index).trim();
       break;
     }
   }

   // Clean up common prefixes and limit length
   entityName = entityName.replace(/^(screen|check|analyze|investigate|review|tell\s+me\s+about|what\s+is|who\s+is|tell\s+me\s+the)\s+/i, '').trim();
   entityName = entityName.replace(/[?.!]+$/, '').trim();
   if (entityName.length > 50) {
     entityName = entityName.substring(0, 50).replace(/\s+\S*$/, '');
   }

   return entityName || desc.substring(0, 50);
 };

 // Extract clickable options from assistant message
 const extractClickableOptions = (text) => {
   if (!text) return { mainText: '', options: [] };

   const options = [];

   // Helper to strip markdown formatting from option text
   const stripMarkdown = (str) => str
     .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove **bold**
     .replace(/\*([^*]+)\*/g, '$1')       // Remove *italic*
     .replace(/_([^_]+)_/g, '$1')         // Remove _italic_
     .replace(/`([^`]+)`/g, '$1')         // Remove `code`
     .replace(/^["']|["']$/g, '')          // Remove surrounding quotes
     .trim();

   // Pattern 1: Bullet points with question marks (• or - followed by text ending in ?)
   // eslint-disable-next-line no-useless-escape
   const bulletOptionPattern = /^[•\-]\s*(.+\?)\s*$/gm;
   let match;
   while ((match = bulletOptionPattern.exec(text)) !== null) {
     options.push(stripMarkdown(match[1]));
   }

   // Pattern 2: Numbered options (1. Option text?)
   const numberedOptionPattern = /^\d+\.\s*(.+\?)\s*$/gm;
   while ((match = numberedOptionPattern.exec(text)) !== null) {
     const optionText = stripMarkdown(match[1]);
     if (!options.includes(optionText)) {
       options.push(optionText);
     }
   }

   // Pattern 3: Suggestions after "Need more information?" header
   // Look for bullet points following this header, even without question marks
   const needMoreInfoMatch = text.match(/\*?\*?Need more information\??\*?\*?\s*(?:Consider:?)?\s*\n([\s\S]*?)(?:\n\n|\n(?=[A-Z])|$)/i);
   if (needMoreInfoMatch) {
     const suggestionBlock = needMoreInfoMatch[1];
     const suggestionLines = suggestionBlock.split('\n');
     for (const line of suggestionLines) {
       // eslint-disable-next-line no-useless-escape
       const suggestionMatch = line.match(/^[•\-]\s*["']?(.+?)["']?\s*$/);
       if (suggestionMatch) {
         const optionText = stripMarkdown(suggestionMatch[1]);
         if (optionText.length > 10 && !options.includes(optionText)) {
           options.push(optionText);
         }
       }
     }
   }

   // If we found options, remove them from main text for separate rendering
   let mainText = text;
   if (options.length > 0) {
     mainText = text
       // eslint-disable-next-line no-useless-escape
       .replace(/^[•\-]\s*.+\?\s*$/gm, '')
       .replace(/^\d+\.\s*.+\?\s*$/gm, '')
       .replace(/\*?\*?Need more information\??\*?\*?\s*(?:Consider:?)?\s*\n[\s\S]*?(?:\n\n|\n(?=[A-Z])|$)/gi, '')
       .replace(/\n{3,}/g, '\n\n')
       .trim();
   }

   return { mainText, options };
 };

 // Generate dynamic follow-up suggestions based on analysis content
 const generateFollowUpSuggestions = (content) => {
   const suggestions = [];
   const lowerContent = content.toLowerCase();

   // Check for network/relationship mapping opportunities
   if (lowerContent.includes('entities') || lowerContent.includes('companies') || lowerContent.includes('ownership') ||
       lowerContent.includes('subsidiary') || lowerContent.includes('related parties') || lowerContent.includes('connections') ||
       lowerContent.includes('beneficial owner') || lowerContent.includes('shell compan') || lowerContent.includes('corporate structure')) {
     suggestions.push("Build a network map");
   }

   // Check risk level and add relevant follow-ups
   if (lowerContent.includes('critical') || lowerContent.includes('high risk')) {
     suggestions.push("List immediate actions for this risk level");
     suggestions.push("Show the strongest evidence for this assessment");
   }

   // Check for specific typologies
   if (lowerContent.includes('money laundering') || lowerContent.includes('layering') || lowerContent.includes('structuring')) {
     suggestions.push("Trace the flow of funds in detail");
     suggestions.push("Identify money laundering patterns");
   }
   if (lowerContent.includes('fraud') || lowerContent.includes('misrepresentation')) {
     suggestions.push("List specific misrepresentations identified");
     suggestions.push("Analyze evidence of intentional deception");
   }
   if (lowerContent.includes('sanction') || lowerContent.includes('ofac') || lowerContent.includes('pep')) {
     suggestions.push("Detail the exact sanctions exposure");
     suggestions.push("Check for indirect connections to sanctioned parties");
   }

   // Check for timeline/transaction mentions
   if (lowerContent.includes('timeline') || lowerContent.includes('transaction') || lowerContent.includes('transfer')) {
     suggestions.push("Build a chronological timeline of key events");
   }

   // Check for document requests
   if (lowerContent.includes('document') || lowerContent.includes('evidence')) {
     suggestions.push("List additional documents needed to strengthen the case");
   }

   // Always useful follow-ups
   if (suggestions.length < 3) {
     suggestions.push("Summarize key facts for my report");
   }
   if (suggestions.length < 4) {
     suggestions.push("Draft questions to ask the client");
   }

   // Return top 4 unique suggestions
   return [...new Set(suggestions)].slice(0, 4);
 };

 // Format analysis text as styled HTML with proper typography
 const formatAnalysisAsHtml = (text) => {
   if (!text) return '';

   // SVG icons for inline use
   const warningIcon = '<svg class="w-4 h-4 inline-block mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>';
   const alertIcon = '<svg class="w-4 h-4 inline-block mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>';
   const checkIcon = '<svg class="w-4 h-4 inline-block mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>';
   const gavelIcon = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>';
   const bankIcon = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>';
   const lockIcon = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>';
   const flagIcon = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/></svg>';

   // First, normalize whitespace
   let html = text
     .replace(/\n{3,}/g, '\n\n')
     .replace(/[ \t]+$/gm, '')
     .replace(/^[ \t]+/gm, '')
     .trim();

   // Risk level badges with icons and alert banners for high-risk cases
   html = html
     .replace(/^(OVERALL RISK:?\s*)(CRITICAL)/gm, `<div class="mb-6 space-y-4">
       <div class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
         ${warningIcon.replace('w-4 h-4', 'w-5 h-5 text-red-600 flex-shrink-0 mt-0.5')}
         <div>
           <p class="font-semibold text-red-900">High-Profile Screening Hit — Immediate Escalation Required</p>
           <p class="text-sm text-red-800 mt-1">This entity requires senior compliance review before any transaction processing.</p>
         </div>
       </div>
       <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-300 shadow-sm">${warningIcon}Critical Risk</span>
     </div>`)
     .replace(/^(OVERALL RISK:?\s*)(HIGH)/gm, `<div class="mb-6 space-y-4">
       <div class="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
         ${alertIcon.replace('w-4 h-4', 'w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5')}
         <div>
           <p class="font-semibold text-orange-900">Elevated Risk Alert — Enhanced Due Diligence Required</p>
           <p class="text-sm text-orange-800 mt-1">This entity has significant risk indicators requiring additional review.</p>
         </div>
       </div>
       <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-orange-100 text-orange-800 border border-orange-300 shadow-sm">${alertIcon}High Risk</span>
     </div>`)
     .replace(/^(OVERALL RISK:?\s*)(MEDIUM)/gm, `<div class="mb-6"><span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">${alertIcon}Medium Risk</span></div>`)
     .replace(/^(OVERALL RISK:?\s*)(LOW)/gm, `<div class="mb-6"><span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">${checkIcon}Low Risk</span></div>`);

   // Entity cards - detect patterns like "Name: Fetullah Gulen" or subject names
   html = html
     .replace(/^(Subject|Entity|Individual|Person):\s*\*?\*?([^*\n]+)\*?\*?/gim, (match, type, name) => {
       const initial = name.trim().charAt(0).toUpperCase();
       return `<div class="mb-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
         <div class="flex items-start gap-4">
           <div class="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white font-semibold text-xl flex-shrink-0">${initial}</div>
           <div class="flex-1 min-w-0">
             <h4 class="text-xl font-semibold text-slate-900 truncate">${name.trim()}</h4>
             <p class="text-sm text-slate-600 mt-1">${type}</p>
           </div>
         </div>
       </div>`;
     });

   // Section headers with icons and better styling
   html = html
     .replace(/^(CRITICAL RED FLAGS|RED FLAGS)/gm, `<div class="mt-8 mb-4 flex items-center gap-2"><span class="flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-lg">${flagIcon}</span><h3 class="text-lg font-semibold text-gray-900">Red Flags</h3></div>`)
     .replace(/^(THE MEMO|SUMMARY|EXECUTIVE SUMMARY)/gm, '<div class="mt-8 mb-4"><h3 class="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Summary</h3></div>')
     .replace(/^(TYPOLOGIES PRESENT|TYPOLOGIES)/gm, '<div class="mt-8 mb-4"><h3 class="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Typologies</h3></div>')
     .replace(/^(ONBOARDING DECISION|DECISION|RECOMMENDATION)/gm, '<div class="mt-8 mb-4"><h3 class="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Decision</h3></div>')
     .replace(/^(DOCUMENTS TO REQUEST|NEXT STEPS|RECOMMENDED ACTIONS)/gm, '<div class="mt-8 mb-4"><h3 class="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Next Steps</h3></div>')
     .replace(/^(KEY FINDINGS|FINDINGS)/gm, '<div class="mt-8 mb-4"><h3 class="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Key Findings</h3></div>')
     .replace(/^(DESIGNATIONS?|SANCTIONS?)/gm, `<div class="mt-8 mb-4 flex items-center gap-2"><span class="flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-600 rounded-lg">${bankIcon}</span><h3 class="text-lg font-semibold text-gray-900">Designations</h3></div>`)
     .replace(/^(ASSET FREEZE|FROZEN ASSETS)/gm, `<div class="mt-8 mb-4 flex items-center gap-2"><span class="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-lg">${lockIcon}</span><h3 class="text-lg font-semibold text-gray-900">Asset Freeze</h3></div>`)
     .replace(/^(LEGAL STATUS|CRIMINAL|TERRORIST DESIGNATION)/gm, `<div class="mt-8 mb-4 flex items-center gap-2"><span class="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-lg">${gavelIcon}</span><h3 class="text-lg font-semibold text-gray-900">Legal Status</h3></div>`);

   // Red flag cards with better styling and shadow
   html = html
     .replace(/^\s*(\d+)\.\s+\*\*([^*]+)\*\*:?\s*$/gm, '<div class="mb-4 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"><div class="px-5 py-4 flex items-center gap-3"><div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"><span class="text-red-600 font-semibold">$1</span></div><h4 class="font-semibold text-slate-900">$2</h4></div></div>')
     .replace(/^\s*(\d+)\.\s+\*\*([^*]+)\*\*:?\s+(.+)$/gm, '<div class="mb-4 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"><div class="px-5 py-4"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"><span class="text-red-600 font-semibold">$1</span></div><h4 class="font-semibold text-slate-900">$2</h4></div><p class="text-slate-700 leading-relaxed pl-[52px]">$3</p></div></div>');

   // Numbered items - clean interactive style
   html = html
     .replace(/^\s*(\d+)\.\s+([A-Z][^:\n]+)$/gm, '<div class="py-2 px-3 -mx-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group" data-explore-point="$2"><span class="text-gray-900"><span class="text-amber-600 font-medium mr-2">$1.</span>$2</span><span class="ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm">Click to explore</span></div>');

   // Translation/Compliance Impact callout boxes
   html = html
     .replace(/^(Translation|Compliance Impact|What this means):\s*(.+)$/gm, '<div class="ml-4 mt-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4"><p class="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-1">Compliance Impact</p><p class="text-sm text-amber-900 leading-relaxed">$2</p></div>');

   // Blockquotes - evidence quotes with better styling
   html = html
     .replace(/^>\s*\*?"([^"]+)"\*?/gm, '<blockquote class="my-4 bg-slate-50 border-l-4 border-slate-400 rounded-r-lg pl-4 pr-4 py-3"><span class="text-gray-700 italic">"$1"</span></blockquote>')
     .replace(/^>\s*\*?'([^']+)'\*?/gm, '<blockquote class="my-4 bg-slate-50 border-l-4 border-slate-400 rounded-r-lg pl-4 pr-4 py-3"><span class="text-gray-700 italic">"$1"</span></blockquote>')
     .replace(/^"([^"]+)"$/gm, '<blockquote class="my-4 bg-slate-50 border-l-4 border-slate-400 rounded-r-lg pl-4 pr-4 py-3"><span class="text-gray-700 italic">"$1"</span></blockquote>');

   // Document citations - styled pill buttons
   html = html
     .replace(/\[Doc\s*(\d+)[^\]]*\]/g, '<button data-doc-index="$1" class="inline-flex items-center gap-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium cursor-pointer transition-colors"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>Doc $1</button>');

   // Bold text - proper typography instead of asterisks
   html = html
     .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');

   // Italic text
   html = html
     .replace(/\*([^*]+)\*/g, '<em class="text-gray-700">$1</em>');

   // Bullet points - cleaner styling
   html = html
     .replace(/^\s*[-•]\s+(.+)$/gm, '<li class="text-gray-700 py-1.5 px-3 -mx-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" data-explore-point="$1">$1</li>');

   // Wrap consecutive list items
   html = html
     .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="my-3 space-y-1">$&</ul>');

   // Paragraph breaks
   html = html
     .replace(/\n\n+/g, '</p><p class="text-slate-700">')
     .replace(/\n/g, ' ');

   // Wrap in container with proper spacing
   return `<div class="text-base text-slate-700 leading-relaxed max-w-none font-sans space-y-4"><div>${html}</div></div>`;
 };


 // Go back to Noir landing
 const goToLanding = () => {
 // Save chat history if we have an active case
 if (activeCase && chatMessages.length > 0) {
 setCases(prev => prev.map(c =>
 c.id === activeCase.id
 ? { ...c, chatHistory: chatMessages, updatedAt: new Date().toISOString() }
 : c
 ));
 }
 // Go to landing page with cards showing (not the initial state)
 setShowLandingCards(true);
 setHoveredCard(null);
 setMarloweAnimationPhase('small');
 setCurrentPage('noirLanding');
 };

 // Go back to product selection
 const goToProductSelect = () => { // eslint-disable-line no-unused-vars
 if (activeCase && chatMessages.length > 0) {
 setCases(prev => prev.map(c => 
 c.id === activeCase.id 
 ? { ...c, chatHistory: chatMessages, updatedAt: new Date().toISOString() }
 : c
 ));
 }
 setCurrentPage('noirLanding');
 };

 // Delete a case
 const deleteCase = (caseId, e) => {
 e.stopPropagation();
 setCases(prev => prev.filter(c => c.id !== caseId));
 // Also delete from Supabase if configured
 if (isSupabaseConfigured() && user) {
   deleteCaseFromDb(caseId).catch(console.error);
 }
 };

 // Start editing a case name
 const startEditingCase = (caseItem, e) => {
 e.stopPropagation();
 setEditingCaseId(caseItem.id);
 setEditingCaseName(caseItem.name);
 setTimeout(() => editInputRef.current?.focus(), 0);
 };

 // Save edited case name
 const saveEditedCaseName = (e) => {
 e?.stopPropagation();
 if (editingCaseName.trim()) {
 setCases(prev => prev.map(c => 
 c.id === editingCaseId 
 ? { ...c, name: editingCaseName.trim(), updatedAt: new Date().toISOString() }
 : c
 ));
 // Also update active case if it's the one being edited
 if (activeCase?.id === editingCaseId) {
 setActiveCase(prev => ({ ...prev, name: editingCaseName.trim() }));
 setCaseName(editingCaseName.trim());
 }
 }
 setEditingCaseId(null);
 setEditingCaseName('');
 };

 // Handle edit input key press
 const handleEditKeyPress = (e) => {
 if (e.key === 'Enter') {
 saveEditedCaseName(e);
 } else if (e.key === 'Escape') {
 setEditingCaseId(null);
 setEditingCaseName('');
 }
 };

 // Scout function
 const runKycScreening = async () => {
 if (!kycQuery.trim()) return;

 setIsScreening(true);
 setKycResults(null);
 setScreeningStep('Initializing screening...');
 setScreeningProgress(5);

 try {
 // Step 1: Get REAL sanctions screening data from backend
 setScreeningStep('Step 1/5: Querying global sanctions databases...');
 setScreeningProgress(15);
 const sanctionsResponse = await fetch(`${API_BASE}/api/screen-sanctions`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 name: kycQuery,
 type: kycType === 'individual' ? 'INDIVIDUAL' : 'ENTITY'
 })
 });

 const sanctionsData = await sanctionsResponse.json();
 setScreeningProgress(30);

 // Step 2: Get ownership network (bidirectional)
 setScreeningStep('Step 2/5: Analyzing beneficial ownership structure...');
 setScreeningProgress(35);
 const networkResponse = await fetch(`${API_BASE}/api/ownership-network`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 name: kycQuery,
 type: kycType === 'individual' ? 'INDIVIDUAL' : 'ENTITY'
 })
 });
 const ownershipNetwork = await networkResponse.json();
 setScreeningProgress(50);

 // Also get traditional ownership analysis for entities
 let ownershipData = null;
 if (kycType === 'entity') {
 ownershipData = ownershipNetwork; // Network already contains ownership analysis for entities
 }

 // Step 3: Build context with REAL data for Claude to analyze
 setScreeningStep('Step 3/5: Building compliance context...');
 setScreeningProgress(55);
 const realDataContext = `
REAL SANCTIONS SCREENING RESULTS:
${sanctionsData.status === 'MATCH' ? `
✓ DIRECT MATCH FOUND
- Matched Name: ${sanctionsData.match.name}
- Listing Date: ${sanctionsData.match.listingDate}
- Lists: ${sanctionsData.match.lists.join(', ')}
- Programs: ${sanctionsData.match.programs.join(', ')}
- Details: ${sanctionsData.match.details}
${sanctionsData.match.entities ? `- Associated Entities: ${sanctionsData.match.entities.join(', ')}` : ''}
${sanctionsData.match.ownership ? `- Known Ownership: ${JSON.stringify(sanctionsData.match.ownership, null, 2)}` : ''}
` : sanctionsData.status === 'POTENTIAL_MATCH' ? `
⚠ POTENTIAL MATCHES FOUND:
${sanctionsData.potentialMatches.map(m => `- ${m.name} (${m.lists.join(', ')})`).join('\n')}
` : '✓ NO SANCTIONS MATCH FOUND'}

${ownershipData ? `
REAL BENEFICIAL OWNERSHIP ANALYSIS:
- OFAC 50% Rule Triggered: ${ownershipData.fiftyPercentRuleTriggered ? 'YES - ENTITY IS BLOCKED' : 'NO'}
- Aggregate Blocked Ownership: ${ownershipData.aggregateBlockedOwnership}%
- Risk Level: ${ownershipData.riskLevel}
- Summary: ${ownershipData.summary}

Beneficial Owners:
${ownershipData.beneficialOwners.map(o =>
 `- ${o.name}: ${o.ownershipPercent}% (${o.ownershipType}) - ${o.sanctionStatus}${o.sanctionDetails ? ` [${o.sanctionDetails.lists.join(', ')}]` : ''}`
).join('\n')}
` : ''}

${ownershipNetwork.ownedCompanies && ownershipNetwork.ownedCompanies.length > 0 ? `
OWNERSHIP PORTFOLIO (Companies Owned by ${kycQuery}):
Total Companies: ${ownershipNetwork.totalCompanies}
High-Risk Ownership (≥50%): ${ownershipNetwork.highRiskOwnership}

Companies:
${ownershipNetwork.ownedCompanies.map(c =>
 `- ${c.company}: ${c.ownershipPercent}% (${c.ownershipType})${c.sanctionedOwner ? ' [SANCTIONED OWNER]' : ''}`
).join('\n')}
` : ''}

${ownershipNetwork.corporateStructure && ownershipNetwork.corporateStructure.length > 0 ? `
CORPORATE NETWORK (Related Entities):
${ownershipNetwork.corporateStructure.map(s =>
 `- ${s.entity} (${s.relationship}) - Common Owner: ${s.commonOwner} (${s.ownershipPercent}%) - Sanction Exposure: ${s.sanctionExposure}`
).join('\n')}
` : ''}`;

 const systemPrompt = `You are an expert compliance analyst with deep knowledge of AML/KYC regulations and sanctions programs.

SANCTIONS PROGRAMS (comprehensive knowledge required):
- OFAC SDN List (Specially Designated Nationals) - US Treasury blocking sanctions
- OFAC Sectoral Sanctions (SSI) - Russian energy, finance, defense sectors
- EU Consolidated Sanctions List - European Union sanctions
- UK Sanctions List (OFSI) - UK Office of Financial Sanctions Implementation
- UN Security Council Consolidated List - International sanctions
- CAATSA (Countering America's Adversaries Through Sanctions Act)

SANCTIONED RUSSIAN BANKS (ALL are SDN-listed as of 2024):
Sberbank, VTB, Gazprombank, Alfa-Bank, Bank Rossiya, Promsvyazbank, VEB.RF, Sovcombank,
Novikombank, Otkritie, Rosselkhozbank, Moscow Credit Bank, Transkapitalbank, Tinkoff Bank (restricted)

SANCTIONED SECTORS:
- Russian state-owned enterprises: Rosneft, Gazprom, Rostec, Transneft, Sovcomflot
- Iranian financial institutions and IRGC-linked entities
- North Korean entities (comprehensive blocking)
- Venezuelan PDVSA and government entities
- Chinese military-linked companies (Entity List, NDAA 1260H)
- Belarus state enterprises

CRITICAL SCREENING LOGIC:
1. For ANY Russian state-owned bank → Automatic MATCH, CRITICAL risk
2. For ANY Russian defense/energy SOE → Automatic MATCH, HIGH/CRITICAL risk
3. For entities 50%+ owned by sanctioned persons → BLOCKED by OFAC 50% rule
4. For PEPs → Always flag, assess proximity to sanctioned regimes
5. Check for aliases, transliterations (Cyrillic→Latin variations), name variations

RISK SCORING CRITERIA:
- CRITICAL: Direct SDN match, 50% rule triggered, active comprehensive sanctions
- HIGH: Sectoral sanctions, close PEP ties to sanctioned regime, significant adverse media
- MEDIUM: PEP status, indirect ownership exposure (25-49%), historical sanctions (delisted)
- LOW: No matches, no adverse findings, low-risk jurisdiction

IMPORTANT: The sanctions screening and ownership analysis below are REAL DATA from official sources. Use this data directly.

HIGH-PROFILE SANCTIONED INDIVIDUALS AND THEIR CORPORATE OWNERSHIP:
- OLEG DERIPASKA (SDN April 2018): Owns EN+ Group (48%), Rusal (48% indirect), Basic Element (100%)
- ALISHER USMANOV (SDN March 2022): Owns USM Holdings (100%), Metalloinvest (49%), MegaFon (15.2%)
- VIKTOR VEKSELBERG (SDN April 2018): Owns Renova Group (100%), Sulzer AG (63.4%), Columbus Nova (beneficial owner)
- ROMAN ABRAMOVICH (EU/UK/Canada March 2022): Owns Evraz (28.6%), Millhouse Capital (100%), formerly Chelsea FC
- GENNADY TIMCHENKO (SDN March 2014): Owns Volga Group (100%), Novatek (23.5%), Sibur (17%)
- ARKADY & BORIS ROTENBERG (SDN March 2014): Own SMP Bank (37.5% each), SGM Group (100%), Stroygazmontazh (51%)
- ALEXEI MORDASHOV (EU February 2022): Owns Severstal (77%), TUI AG (34%), Nordgold (90%)
- VLADIMIR POTANIN (UK June 2022): Owns Norilsk Nickel (34.6%), Interros (100%), Rosa Khutor (50%)
- VLADIMIR PUTIN (SANCTIONED - EU/UK/Canada/Australia/Japan/Switzerland Feb 2022, US EO 14024): President of Russia, state control over Gazprom (50%+), Rosneft (50%+), Sberbank (50%+), VTB Bank (60.9%), Transneft (100%) - CRITICAL RISK

SANCTIONED ENTITIES: NIOC, IRGC, PDVSA, Rusal, EN+ Group, Gazprombank, Wagner Group, XPCC

OFAC 50% RULE: Entity owned 50%+ aggregate by blocked persons is itself blocked.

CRITICAL FOR OWNERSHIP EXTRACTION: When you identify ANY person in your analysis, you MUST check if they appear in the sanctioned individuals list above and include ALL their owned companies in the entities array. This is essential for complete sanctions risk assessment.

Return a JSON object with this EXACT structure (all fields required):
{
 "subject": {
 "name": "string",
 "type": "INDIVIDUAL|ENTITY",
 "aliases": ["array of known aliases or empty array"],
 "jurisdiction": "string or null",
 "incorporationDate": "YYYY-MM-DD or null",
 "stateOwned": true|false
 },
 "overallRisk": "LOW|MEDIUM|HIGH|CRITICAL",
 "riskScore": 0-100,
 "riskSummary": "2-3 sentence executive summary",
 "sanctions": {
 "status": "CLEAR|POTENTIAL_MATCH|MATCH",
 "confidence": 0-100,
 "matches": [{
 "list": "OFAC SDN|OFAC SSI|EU|UK|UN",
 "program": "RUSSIA-EO14024|UKRAINE-EO13662|etc",
 "listingDate": "YYYY-MM-DD",
 "matchedName": "exact name",
 "matchType": "EXACT|ALIAS|FUZZY",
 "matchScore": 0-100,
 "details": "reason",
 "source": "URL/reference"
 }]
 },
 "ownershipAnalysis": {
 "fiftyPercentRuleTriggered": boolean,
 "aggregateBlockedOwnership": 0-100,
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "summary": "plain language explanation",
 "beneficialOwners": [{
 "name": "string",
 "ownershipPercent": number,
 "ownershipType": "DIRECT|INDIRECT|BENEFICIAL",
 "sanctionStatus": "CLEAR|SANCTIONED|POTENTIAL",
 "sanctionDetails": "if sanctioned, list and program",
 "pepStatus": boolean,
 "source": "where from"
 }],
 "corporateStructure": [{
 "entity": "string",
 "relationship": "PARENT|SUBSIDIARY|AFFILIATE|SHAREHOLDER",
 "jurisdiction": "string",
 "ownershipPercent": number,
 "sanctionExposure": "NONE|INDIRECT|DIRECT",
 "notes": "string"
 }]
 },
 "pep": {
 "status": "CLEAR|POTENTIAL_MATCH|MATCH",
 "matches": [{
 "name": "string",
 "position": "role",
 "country": "string",
 "level": "NATIONAL|REGIONAL|LOCAL",
 "status": "CURRENT|FORMER",
 "riskLevel": "HIGH|MEDIUM|LOW",
 "relationshipToSubject": "SELF|FAMILY|CLOSE_ASSOCIATE",
 "sanctionedRegimeConnection": boolean
 }]
 },
 "adverseMedia": {
 "status": "CLEAR|FINDINGS",
 "totalArticles": number,
 "categories": {
 "FINANCIAL_CRIME": number,
 "CORRUPTION": number,
 "FRAUD": number,
 "SANCTIONS_EVASION": number,
 "MONEY_LAUNDERING": number,
 "OTHER": number
 },
 "articles": [{
 "headline": "string",
 "source": "publication",
 "sourceCredibility": "HIGH|MEDIUM|LOW",
 "date": "YYYY-MM-DD",
 "summary": "string",
 "category": "FINANCIAL_CRIME|CORRUPTION|FRAUD|SANCTIONS_EVASION|MONEY_LAUNDERING|OTHER",
 "relevance": "HIGH|MEDIUM|LOW"
 }]
 },
 "riskFactors": [{
 "factor": "short name",
 "severity": "CRITICAL|HIGH|MEDIUM|LOW",
 "description": "detailed explanation",
 "mitigants": "if any or empty"
 }],
 "regulatoryGuidance": {
 "ofacImplications": "detailed guidance",
 "euImplications": "if relevant or empty",
 "dueDiligenceRequired": "EDD|SDD|STANDARD",
 "filingRequirements": ["SAR", "CTR", "FBAR"],
 "prohibitedActivities": ["list"],
 "licenseRequired": boolean
 },
 "onboardingDecision": {
 "decision": "DO_NOT_ONBOARD|ONBOARD_WITH_EDD|ONBOARD_WITH_RESTRICTIONS|SAFE_TO_ONBOARD",
 "rationale": "One clear sentence explaining the decision",
 "conditions": ["If onboarding, list specific conditions that must be met"]
 },
 "recommendations": [{
 "priority": "HIGH|MEDIUM|LOW",
 "action": "MUST be a specific document to request or a clear action (e.g., 'Request beneficial ownership declaration from the client', 'Obtain 12 months bank statements', 'Require board resolution authorizing this relationship')",
 "rationale": "Why this document/action is needed for the risk assessment"
 }]
}

CRITICAL - RECOMMENDATIONS MUST BE ACTIONABLE:
Your recommendations should tell the compliance officer EXACTLY what to do next. Focus on gathering MORE DATA that can then be uploaded to Marlowe for deeper analysis.

1. FIRST recommendation: Clear onboarding decision
   - "DO NOT ONBOARD: [specific reason - e.g., 'Direct SDN sanctions match on OFAC list']"
   - "ONBOARD WITH EDD: [what enhanced monitoring is needed]"
   - "SAFE TO ONBOARD: Standard due diligence is sufficient"

2. REMAINING recommendations: Documents to REQUEST FROM THE CLIENT then UPLOAD TO MARLOWE
   GOOD: "Request certified beneficial ownership declaration - upload to Marlowe Cipher for deep ownership analysis"
   GOOD: "Obtain audited financial statements for past 3 years - upload to Marlowe to analyze for suspicious transactions"
   GOOD: "Request source of funds documentation - upload to Marlowe Cipher for flow-of-funds analysis"
   GOOD: "Obtain corporate registry extract - upload to Marlowe to map hidden ownership connections"
   GOOD: "Request bank statements showing transaction history - upload to Marlowe for pattern detection"
   GOOD: "Obtain organizational chart with all subsidiaries - upload to Marlowe to screen each entity"

   BAD: "Conduct sanctions screening" - Marlowe already did this
   BAD: "Map the ownership network" - tell them to GET the ownership docs, then Marlowe will map it
   BAD: "Analyze financial flows" - tell them to GET bank statements, then Marlowe will analyze
   BAD: "Interview the subject" - not a compliance officer function

VALIDATION: If Sberbank/VTB/Gazprombank → MATCH/CRITICAL. If sanctions.status=MATCH → overallRisk=HIGH/CRITICAL. If fiftyPercentRuleTriggered=true → overallRisk=CRITICAL

IMPORTANT FOR ENTITIES: Always populate corporateStructure with parent companies, subsidiaries, and affiliates. Include their jurisdiction, ownership percentage, and sanction exposure level.

IMPORTANT FOR INDIVIDUALS: Include any known corporate affiliations in corporateStructure showing companies they own or control.

Always return complete, detailed responses with all arrays populated.`;

 const userPrompt = `${realDataContext}

Based on the REAL sanctions and ownership data above, complete the KYC screening for: ${kycQuery}${kycYearOfBirth ? ', Year of Birth: ' + kycYearOfBirth : ''}${kycCountry ? ', Country: ' + kycCountry : ''} (${kycType === 'individual' ? 'INDIVIDUAL' : 'ENTITY'})

Use the verified sanctions data provided. Add additional analysis for:
- PEP (Politically Exposed Person) status
- Adverse media findings
- Risk assessment
- Regulatory guidance

${kycType === 'entity' ? 'Include corporate structure with parent companies, subsidiaries, and affiliates.' : 'Include any corporate affiliations in corporateStructure.'}`;

 // Step 4: AI-powered risk analysis
 setScreeningStep('Step 4/5: Running AI-powered risk analysis...');
 setScreeningProgress(65);

 const response = await fetch(`${API_BASE}/api/messages`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "claude-sonnet-4-20250514",
 max_tokens: 4000,
 messages: [
 { role: "user", content: systemPrompt + "\n\n" + userPrompt }
 ]
 })
 });

 if (!response.ok) {
 throw new Error("API error: " + response.status);
 }

 const data = await response.json();
 setScreeningProgress(85);
 const text = data.content && data.content[0] && data.content[0].text ? data.content[0].text : "";

 // Step 5: Compiling results
 setScreeningStep('Step 5/5: Compiling screening report...');
 setScreeningProgress(90);

 const jsonMatch = text.match(/\{[\s\S]*\}/);
 if (jsonMatch) {
 const parsed = JSON.parse(jsonMatch[0]);
 
 const isLowRisk = parsed.overallRisk === 'LOW' &&
 parsed.sanctions && parsed.sanctions.status === 'CLEAR' &&
 parsed.pep && parsed.pep.status === 'CLEAR' &&
 parsed.adverseMedia && parsed.adverseMedia.status === 'CLEAR';

 // Add ownership network data to results
 const finalResult = isLowRisk ? Object.assign({}, parsed, { noRisksIdentified: true }) : parsed;

 // Add owned companies for individuals
 if (ownershipNetwork.ownedCompanies) {
 finalResult.ownedCompanies = ownershipNetwork.ownedCompanies;
 finalResult.totalCompanies = ownershipNetwork.totalCompanies;
 finalResult.highRiskOwnership = ownershipNetwork.highRiskOwnership;
 }

 // Add corporate network for entities
 if (ownershipNetwork.corporateStructure) {
 if (!finalResult.ownershipAnalysis) finalResult.ownershipAnalysis = {};
 finalResult.ownershipAnalysis.corporateStructure = ownershipNetwork.corporateStructure;
 }

 setKycResults(finalResult);
 
 const historyItem = {
 id: Math.random().toString(36).substr(2, 9),
 query: kycQuery,
 type: kycType,
 clientRef: kycClientRef,
 yearOfBirth: kycYearOfBirth,
 country: kycCountry,
 result: finalResult,
 timestamp: new Date().toISOString()
 };
 
 setKycHistory(function(prev) { return [historyItem].concat(prev).slice(0, 50); });
 setSelectedHistoryItem(historyItem);
 setScreeningProgress(100);
 setScreeningStep('Complete!');
 setTimeout(() => {
 setKycPage('results');
 setIsScreening(false);
 setScreeningStep('');
 setScreeningProgress(0);
 }, 500);
 } else {
 alert('No results returned. Please try again.');
 setIsScreening(false);
 setScreeningStep('');
 setScreeningProgress(0);
 }
 } catch (error) {
 console.error('Sanctions API error:', error);
 alert('Error: ' + error.message);
 setIsScreening(false);
 setScreeningStep('');
 setScreeningProgress(0);
 }
 };

 const clearKycResults = () => {
 setKycResults(null);
 setKycQuery('');
 setKycClientRef('');
 setKycYearOfBirth('');
 setKycCountry('');
 setSelectedHistoryItem(null);
 setKycChatMessages([]);
 setKycChatOpen(false);
 };

 // View a historical screening result
 const viewHistoryItem = (item) => {
 setSelectedHistoryItem(item);
 setKycResults(item.result);
 setKycQuery(item.query);
 setKycClientRef(item.clientRef || '');
 setKycYearOfBirth(item.yearOfBirth || '');
 setKycCountry(item.country || '');
 setKycType(item.type);
 setKycPage('results');
 };

 // Create a new project
 const createProject = () => {
 if (!newProjectName.trim()) return;
 const project = {
 id: Math.random().toString(36).substr(2, 9),
 name: newProjectName.trim(),
 createdAt: new Date().toISOString(),
 screenings: []
 };
 setKycProjects(prev => [project, ...prev]);
 setNewProjectName('');
 };

 // Add screening to project
 const addToProject = (screeningId, projectId) => {
 setKycProjects(prev => prev.map(p => {
 if (p.id === projectId) {
 if (!p.screenings.includes(screeningId)) {
 return { ...p, screenings: [...p.screenings, screeningId] };
 }
 }
 return p;
 }));
 setAssigningToProject(null);
 };

 // Remove screening from project
 const removeFromProject = (screeningId, projectId) => {
 setKycProjects(prev => prev.map(p => {
 if (p.id === projectId) {
 return { ...p, screenings: p.screenings.filter(s => s !== screeningId) };
 }
 return p;
 }));
 };

 // Delete project
 const deleteProject = (projectId) => {
 setKycProjects(prev => prev.filter(p => p.id !== projectId));
 if (selectedProject?.id === projectId) {
 setSelectedProject(null);
 }
 };

 // Generate PDF report using @react-pdf/renderer
 const generatePdfReport = async (screening) => {
 setIsGeneratingPdf(true);

 try {
 const result = screening.result;

 // Transform screening data into the format expected by ComplianceReportPDF
 const pdfData = {
 caseNumber: `SCR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
 riskLevel: result.overallRisk || 'unknown',
 entity: {
 name: result.subject?.name || 'Unknown Entity',
 type: result.subject?.type || 'Entity',
 status: result.subject?.status || null,
 statusDate: result.subject?.statusDate || null,
 },
 metadata: {
 designation: result.subject?.designation || null,
 jurisdiction: screening.country || 'Global',
 lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
 },
 summary: result.summary || `Compliance screening completed for ${result.subject?.name}. Risk level assessed as ${result.overallRisk?.toUpperCase() || 'UNKNOWN'}.`,
 redFlags: (result.redFlags || []).map(flag => ({
 category: flag.category || 'Compliance Alert',
 title: flag.title || flag.headline || 'Red Flag Identified',
 fact: flag.fact || flag.description || flag.finding || '',
 complianceImpact: flag.translation || flag.complianceImpact || flag.impact || '',
 sources: flag.sources || flag.citations || [],
 })),
 analystName: 'Compliance Analyst',
 generatedAt: new Date().toISOString(),
 };

 // Generate PDF blob
 const pdfBlob = await pdf(<ComplianceReportPDF data={pdfData} />).toBlob();

 // Create download link
 const url = URL.createObjectURL(pdfBlob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `compliance-report-${result.subject?.name?.replace(/\s+/g, '-').toLowerCase() || 'entity'}-${new Date().toISOString().split('T')[0]}.pdf`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 } catch (error) {
 console.error('PDF generation error:', error);
 alert('Error generating PDF report. Please try again.');
 } finally {
 setIsGeneratingPdf(false);
 }
 };

 // Generate full case investigation report
 const generateCaseReport = async () => { // eslint-disable-line no-unused-vars
 if (!analysis || !activeCase) return;
 
 setIsGeneratingCaseReport(true);
 
 const caseData = {
 caseName: activeCase.name,
 createdAt: activeCase.createdAt,
 riskLevel: analysis.executiveSummary?.riskLevel,
 executiveSummary: analysis.executiveSummary,
 entities: analysis.entities,
 timeline: analysis.timeline,
 typologies: analysis.typologies,
 hypotheses: analysis.hypotheses,
 patterns: analysis.patterns,
 contradictions: analysis.contradictions,
 relationships: analysis.relationships,
 nextSteps: analysis.nextSteps,
 documents: files.map(f => f.name)
 };

 const reportPrompt = `Generate a comprehensive investigation report in professional format. This is for a financial crime/fraud investigation case file.

CASE DATA:
${JSON.stringify(caseData, null, 2)}

Create a detailed report with these sections:

1. CASE INFORMATION
 - Case Name, Date, Risk Classification

2. EXECUTIVE SUMMARY
 - Overview of findings
 - Primary concerns
 - Risk assessment
 - Recommended actions

3. ENTITIES OF INTEREST
 - For each entity: name, type, role, risk level, indicators, evidence citations

4. TYPOLOGIES IDENTIFIED
 - Financial crime typologies detected (money laundering, fraud, etc.)
 - Red flags and indicators for each
 - Regulatory implications

5. CHRONOLOGICAL TIMELINE (ONLY include this section if timeline events exist in the data)
 - Date-ordered events with significance and risk levels
 - Evidence citations for each event

6. HYPOTHESES & ANALYSIS
 - Each hypothesis with confidence score
 - Supporting evidence
 - Contradicting evidence
 - Investigative gaps

7. CONTRADICTIONS & DISCREPANCIES
 - Conflicting claims identified
 - Impact on investigation

8. RELATIONSHIP MAPPING
 - Connections between entities
 - Nature of relationships
 - Evidence supporting connections

9. RECOMMENDED NEXT STEPS
 - Prioritized investigative actions
 - Rationale for each

10. EVIDENCE INDEX
 - List of source documents analyzed

11. AUDIT TRAIL
 - Report generation timestamp
 - Analysis methodology note

Format the report professionally with clear headers, bullet points where appropriate, and maintain all evidence citations in [Doc X] format. This report should be suitable for regulatory submission or law enforcement referral.`;

 try {
 const response = await fetch(`${API_BASE}/api/messages`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "claude-sonnet-4-20250514",
 max_tokens: 8000,
 messages: [{ role: "user", content: reportPrompt }]
 })
 });

 if (!response.ok) {
 throw new Error(`API error: ${response.status}`);
 }

 const data = await response.json();
 const reportText = data.content?.map(item => item.text || "").join("\n") || "";
 
 if (!reportText) {
 throw new Error('Empty response');
 }
 
 // Create downloadable file
 const blob = new Blob([reportText], { type: 'text/plain' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `Investigation_Report_${activeCase.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 } catch (error) {
 console.error('Case report generation error:', error);
 alert('Error generating report. Please try again.');
 } finally {
 setIsGeneratingCaseReport(false);
 }
 };

 // Generate actual PDF report with Marlowe visual style
 const generateCaseReportPdf = () => {
 if (!analysis || !activeCase) return;

 setIsGeneratingCaseReport(true);

 try {
 const pdf = new jsPDF();
 const pageWidth = pdf.internal.pageSize.getWidth();
 const pageHeight = pdf.internal.pageSize.getHeight();
 const margin = 20;
 const contentWidth = pageWidth - 2 * margin;
 let yPos = margin;

 // Helper function to add new page if needed
 const checkPageBreak = (requiredSpace = 20) => {
 if (yPos + requiredSpace > pageHeight - margin) {
 pdf.addPage();
 yPos = margin;
 return true;
 }
 return false;
 };

 // Helper to add text with word wrap
 const addText = (text, fontSize = 10, fontStyle = 'normal', color = [0, 0, 0]) => {
 pdf.setFontSize(fontSize);
 pdf.setFont('helvetica', fontStyle);
 pdf.setTextColor(...color);
 const lines = pdf.splitTextToSize(text, contentWidth);
 lines.forEach(line => {
 checkPageBreak();
 pdf.text(line, margin, yPos);
 yPos += fontSize * 0.5;
 });
 yPos += 3;
 };

 // Light background color for headers (Light theme: #f8f8f8)
 const lightBg = [248, 248, 248];
 // Cyan accent for light theme
 const accentColor = [6, 182, 212]; // cyan-500
 // Dark text for light theme
 const darkText = [17, 24, 39]; // gray-900

 // HEADER - Light background with accent text
 pdf.setFillColor(...lightBg);
 pdf.rect(0, 0, pageWidth, 50, 'F');
 pdf.setTextColor(...accentColor);
 pdf.setFontSize(24);
 pdf.setFont('helvetica', 'bold');
 pdf.text('CIPHER INVESTIGATION REPORT', pageWidth / 2, 20, { align: 'center' });
 pdf.setFontSize(10);
 pdf.setTextColor(...darkText);
 pdf.text('Financial Crimes Analysis', pageWidth / 2, 30, { align: 'center' });

 // Risk badge
 const getRiskColor = (risk) => {
 switch (risk) {
 case 'CRITICAL': return [220, 38, 38]; // red-600
 case 'HIGH': return [244, 63, 94]; // rose-500
 case 'MEDIUM': return [245, 158, 11]; // amber-500
 case 'LOW': return [16, 185, 129]; // emerald-500
 default: return [148, 163, 184]; // slate
 }
 };
 const riskLevel = analysis.executiveSummary?.riskLevel || 'UNKNOWN';
 pdf.setFillColor(...getRiskColor(riskLevel));
 pdf.roundedRect(pageWidth / 2 - 20, 35, 40, 8, 2, 2, 'F');
 pdf.setTextColor(0, 0, 0);
 pdf.setFontSize(8);
 pdf.setFont('helvetica', 'bold');
 pdf.text(riskLevel, pageWidth / 2, 40, { align: 'center' });

 yPos = 60;

 // CASE INFORMATION
 pdf.setDrawColor(...accentColor);
 pdf.setLineWidth(0.5);
 pdf.line(margin, yPos, pageWidth - margin, yPos);
 yPos += 5;

 pdf.setTextColor(...accentColor);
 pdf.setFontSize(14);
 pdf.setFont('helvetica', 'bold');
 pdf.text('CASE INFORMATION', margin, yPos);
 yPos += 8;

 pdf.setTextColor(0, 0, 0);
 pdf.setFontSize(10);
 pdf.setFont('helvetica', 'normal');
 addText(`Case Name: ${activeCase.name}`);
 addText(`Date Created: ${new Date(activeCase.createdAt).toLocaleString()}`);
 addText(`Report Generated: ${new Date().toLocaleString()}`);
 addText(`Documents Analyzed: ${files.length}`);
 yPos += 5;

 // EXECUTIVE SUMMARY
 checkPageBreak(30);
 pdf.setDrawColor(...accentColor);
 pdf.line(margin, yPos, pageWidth - margin, yPos);
 yPos += 5;
 pdf.setTextColor(...accentColor);
 pdf.setFontSize(14);
 pdf.setFont('helvetica', 'bold');
 pdf.text('EXECUTIVE SUMMARY', margin, yPos);
 yPos += 8;

 pdf.setTextColor(0, 0, 0);
 if (analysis.executiveSummary?.overview) {
 addText(analysis.executiveSummary.overview, 10);
 }
 if (analysis.executiveSummary?.primaryConcerns) {
 pdf.setFont('helvetica', 'bold');
 addText('Primary Concerns:', 10);
 pdf.setFont('helvetica', 'normal');
 analysis.executiveSummary.primaryConcerns.forEach(concern => {
 addText(`• ${concern}`, 9);
 });
 }
 if (analysis.executiveSummary?.recommendedActions) {
 yPos += 3;
 pdf.setFont('helvetica', 'bold');
 addText('Recommended Actions:', 10);
 pdf.setFont('helvetica', 'normal');
 analysis.executiveSummary.recommendedActions.forEach(action => {
 addText(`• ${action}`, 9);
 });
 }
 yPos += 5;

 // ENTITIES OF INTEREST
 if (analysis.entities && analysis.entities.length > 0) {
 checkPageBreak(30);
 pdf.setDrawColor(...accentColor);
 pdf.line(margin, yPos, pageWidth - margin, yPos);
 yPos += 5;
 pdf.setTextColor(...accentColor);
 pdf.setFontSize(14);
 pdf.setFont('helvetica', 'bold');
 pdf.text(`ENTITIES OF INTEREST (${analysis.entities.length})`, margin, yPos);
 yPos += 8;

 analysis.entities.slice(0, 10).forEach((entity, idx) => {
 checkPageBreak(25);
 pdf.setTextColor(...darkText);
 pdf.setFontSize(11);
 pdf.setFont('helvetica', 'bold');
 addText(`${idx + 1}. ${entity.name}`, 11);
 pdf.setTextColor(0, 0, 0);
 pdf.setFontSize(9);
 pdf.setFont('helvetica', 'normal');
 addText(`Type: ${entity.type}`, 9);
 if (entity.role) addText(`Role: ${entity.role}`, 9);
 if (entity.riskLevel) {
 pdf.setTextColor(...getRiskColor(entity.riskLevel));
 addText(`Risk: ${entity.riskLevel}`, 9, 'bold');
 pdf.setTextColor(0, 0, 0);
 }
 yPos += 3;
 });
 }

 // TIMELINE
 if (analysis.timeline && analysis.timeline.length > 0) {
 checkPageBreak(30);
 pdf.setDrawColor(...accentColor);
 pdf.line(margin, yPos, pageWidth - margin, yPos);
 yPos += 5;
 pdf.setTextColor(...accentColor);
 pdf.setFontSize(14);
 pdf.setFont('helvetica', 'bold');
 pdf.text(`TIMELINE (${analysis.timeline.length} Events)`, margin, yPos);
 yPos += 8;

 analysis.timeline.slice(0, 15).forEach((event, idx) => {
 checkPageBreak(20);
 pdf.setTextColor(...darkText);
 pdf.setFontSize(10);
 pdf.setFont('helvetica', 'bold');
 addText(`${event.date || 'Date Unknown'}`, 10);
 pdf.setTextColor(0, 0, 0);
 pdf.setFontSize(9);
 pdf.setFont('helvetica', 'normal');
 addText(event.description, 9);
 if (event.significance) {
 pdf.setFont('helvetica', 'italic');
 addText(`Significance: ${event.significance}`, 8, 'italic', darkText);
 }
 yPos += 2;
 });
 }

 // TYPOLOGIES
 if (analysis.typologies && analysis.typologies.length > 0) {
 checkPageBreak(30);
 pdf.setDrawColor(...accentColor);
 pdf.line(margin, yPos, pageWidth - margin, yPos);
 yPos += 5;
 pdf.setTextColor(...accentColor);
 pdf.setFontSize(14);
 pdf.setFont('helvetica', 'bold');
 pdf.text('FINANCIAL CRIME TYPOLOGIES', margin, yPos);
 yPos += 8;

 analysis.typologies.forEach((typo, idx) => {
 checkPageBreak(20);
 pdf.setTextColor(...darkText);
 pdf.setFontSize(11);
 pdf.setFont('helvetica', 'bold');
 addText(`${idx + 1}. ${typo.name}`, 11);
 pdf.setTextColor(0, 0, 0);
 pdf.setFontSize(9);
 pdf.setFont('helvetica', 'normal');
 if (typo.description) addText(typo.description, 9);
 if (typo.confidence) addText(`Confidence: ${typo.confidence}%`, 9);
 yPos += 3;
 });
 }

 // HYPOTHESES
 if (analysis.hypotheses && analysis.hypotheses.length > 0) {
 checkPageBreak(30);
 pdf.setDrawColor(...accentColor);
 pdf.line(margin, yPos, pageWidth - margin, yPos);
 yPos += 5;
 pdf.setTextColor(...accentColor);
 pdf.setFontSize(14);
 pdf.setFont('helvetica', 'bold');
 pdf.text('INVESTIGATIVE HYPOTHESES', margin, yPos);
 yPos += 8;

 analysis.hypotheses.slice(0, 8).forEach((hyp, idx) => {
 checkPageBreak(25);
 pdf.setTextColor(...darkText);
 pdf.setFontSize(11);
 pdf.setFont('helvetica', 'bold');
 addText(`${idx + 1}. ${hyp.title}`, 11);
 pdf.setTextColor(0, 0, 0);
 pdf.setFontSize(9);
 pdf.setFont('helvetica', 'normal');
 if (hyp.description) addText(hyp.description, 9);
 if (hyp.confidence !== undefined) {
 pdf.setTextColor(...accentColor);
 addText(`Confidence: ${Math.round((hyp.confidence || 0) * 100)}%`, 9, 'bold');
 pdf.setTextColor(0, 0, 0);
 }
 yPos += 3;
 });
 }

 // NEXT STEPS
 if (analysis.nextSteps && analysis.nextSteps.length > 0) {
 checkPageBreak(30);
 pdf.setDrawColor(...accentColor);
 pdf.line(margin, yPos, pageWidth - margin, yPos);
 yPos += 5;
 pdf.setTextColor(...accentColor);
 pdf.setFontSize(14);
 pdf.setFont('helvetica', 'bold');
 pdf.text('RECOMMENDED NEXT STEPS', margin, yPos);
 yPos += 8;

 analysis.nextSteps.forEach((step, idx) => {
 checkPageBreak(15);
 pdf.setTextColor(0, 0, 0);
 pdf.setFontSize(9);
 pdf.setFont('helvetica', 'normal');
 addText(`${idx + 1}. ${typeof step === 'string' ? step : step.action || step.description}`, 9);
 });
 }

 // FOOTER on last page
 const totalPages = pdf.internal.pages.length - 1;
 for (let i = 1; i <= totalPages; i++) {
 pdf.setPage(i);
 pdf.setFillColor(...lightBg);
 pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
 pdf.setTextColor(...darkText);
 pdf.setFontSize(8);
 pdf.text(`Marlowe Investigation Report | ${activeCase.name}`, margin, pageHeight - 8);
 pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
 }

 // Save the PDF
 const pdfFileName = `Marlowe_Investigation_${activeCase.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
 pdf.save(pdfFileName);

 // Save PDF report reference to the case
 const caseIdToUpdate = currentCaseId || activeCase?.id;
 if (caseIdToUpdate) {
 addPdfReportToCase(caseIdToUpdate, {
   name: pdfFileName,
   generatedAt: new Date().toISOString(),
   type: 'investigation'
 });
 }

 } catch (error) {
 console.error('PDF generation error:', error);
 alert('Error generating PDF. Please try again.');
 } finally {
 setIsGeneratingCaseReport(false);
 }
 };

 // Export conversation message as simple PDF
 const exportMessageAsPdf = async (messageContent) => {
 if (!messageContent) return;

 setIsGeneratingCaseReport(true);

 try {
 // Parse message content into structured data
 const pdfData = parseMessageToPdfData(messageContent);

 // Generate entity name for filename
 const entitySlug = pdfData.entity?.name
   ? pdfData.entity.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30)
   : 'entity';
 const dateStr = new Date().toISOString().split('T')[0];
 const fileName = `compliance-report-${entitySlug}-${dateStr}.pdf`;

 // Generate PDF using @react-pdf/renderer
 const blob = await pdf(<ComplianceReportPDF data={pdfData} />).toBlob();

 // Create download link
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = url;
 link.download = fileName;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 URL.revokeObjectURL(url);

 // Also save to current case if one exists
 if (currentCaseId) {
   // Convert blob to data URI for storage
   const reader = new FileReader();
   reader.onloadend = () => {
     const dataUri = reader.result;
     addPdfReportToCase(currentCaseId, {
       id: Math.random().toString(36).substr(2, 9),
       name: fileName,
       createdAt: new Date().toISOString(),
       dataUri: dataUri,
       riskLevel: pdfData.riskLevel?.toUpperCase() || 'UNKNOWN',
       entityName: pdfData.entity?.name || 'Unknown',
     });
   };
   reader.readAsDataURL(blob);
 }

 } catch (error) {
 console.error('PDF export error:', error);
 alert('Error generating PDF. Please try again.');
 } finally {
 setIsGeneratingCaseReport(false);
 }
 };

 // Scroll KYC chat to bottom when new messages arrive
 useEffect(() => {
 if (kycChatEndRef.current) {
 kycChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
 }
 }, [kycChatMessages]);

 // KYC Chat function
 const sendKycChatMessage = async () => {
 if (!kycChatInput.trim() || isKycChatLoading || !kycResults) return;

 const userMessage = kycChatInput.trim();
 setKycChatInput('');
 setKycChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
 setIsKycChatLoading(true);

 const screeningContext = JSON.stringify(kycResults, null, 2);

 const conversationHistory = kycChatMessages.map(msg => ({
 role: msg.role,
 content: msg.content
 }));

 const systemPrompt = `You are a KYC compliance expert assistant. You have just completed a screening on "${kycResults.subject?.name}" and are now answering follow-up questions from the compliance analyst.

You have access to the complete screening results including:
- Sanctions screening results
- PEP (Politically Exposed Person) status
- Adverse media findings
- Ownership analysis and OFAC 50% Rule assessment
- Risk factors and recommendations

Always be specific and reference the screening data when making claims. Be concise but thorough.
Help the analyst understand the findings, suggest additional due diligence steps, and explain regulatory implications.

SCREENING RESULTS:
${screeningContext}

Subject Details:
- Name: ${kycResults.subject?.name}
- Type: ${kycResults.subject?.type}
- Overall Risk: ${kycResults.overallRisk}
${selectedHistoryItem?.clientRef ? `- Client Reference: ${selectedHistoryItem.clientRef}` : ''}
${selectedHistoryItem?.country ? `- Country: ${selectedHistoryItem.country}` : ''}
${selectedHistoryItem?.yearOfBirth ? `- Year of Birth: ${selectedHistoryItem.yearOfBirth}` : ''}`;

 try {
 const response = await fetch(`${API_BASE}/api/messages`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "claude-sonnet-4-20250514",
 max_tokens: 2000,
 messages: [
 ...conversationHistory,
 { role: "user", content: `${systemPrompt}\n\nAnalyst question: ${userMessage}` }
 ]
 })
 });

 if (!response.ok) {
 throw new Error(`API error: ${response.status}`);
 }

 const data = await response.json();
 const assistantMessage = data.content?.map(item => item.text || "").join("\n") || "I couldn't process that request.";
 
 setKycChatMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
 } catch (error) {
 console.error('KYC chat error:', error);
 setKycChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
 } finally {
 setIsKycChatLoading(false);
 }
 };

 const handleDrag = useCallback((e) => {
 e.preventDefault();
 e.stopPropagation();
 if (e.type === "dragenter" || e.type === "dragover") {
 setDragActive(true);
 } else if (e.type === "dragleave") {
 setDragActive(false);
 }
 }, []);

 const processFiles = async (newFiles) => {
 const processedFiles = await Promise.all(
 Array.from(newFiles).map(async (file) => {
 let text = '';
 const fileName = file.name.toLowerCase();
 
 try {
 if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
 // Handle Word documents with mammoth
 const arrayBuffer = await file.arrayBuffer();
 const result = await mammoth.extractRawText({ arrayBuffer });
 text = result.value;
 } else if (fileName.endsWith('.pdf')) {
 // Handle PDF files with pdfjs-dist (client-side)
 const arrayBuffer = await file.arrayBuffer();
 const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
 const textParts = [];

 for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
 const page = await pdf.getPage(pageNum);
 const textContent = await page.getTextContent();
 const pageText = textContent.items.map(item => item.str).join(' ');
 textParts.push(pageText);
 }

 text = textParts.join('\n\n');
 console.log(`PDF extracted (${pdf.numPages} pages, ${text.length} chars):`, text.substring(0, 500));

 // Check if extraction yielded minimal text (likely scanned image PDF)
 if (!text || text.trim().length < 50) {
 text = `[PDF Processing Warning: ${file.name}]

This PDF appears to contain scanned images without a text layer, or the text extraction yielded minimal content.

File: ${file.name}
Size: ${(file.size / 1024).toFixed(1)} KB
Pages: ${pdf.numPages}

If this is a scanned document, please use OCR software to convert it to searchable PDF or text format.`;
 }
 } else {
 // Plain text files (txt, csv, json, xml, etc.)
 text = await file.text();
 }
 } catch (error) {
 console.error(`Error processing ${file.name}:`, error);
 text = `[Error reading file: ${file.name}]\n\nThe file could not be processed. Please try a different format.`;
 }
 
 return {
 id: Math.random().toString(36).substr(2, 9),
 name: file.name,
 type: file.type || 'text/plain',
 size: file.size,
 content: text,
 uploadedAt: new Date().toISOString()
 };
 })
 );
 setFiles(prev => [...prev, ...processedFiles]);
 };

 const handleDrop = useCallback((e) => {
 e.preventDefault();
 e.stopPropagation();
 setDragActive(false);
 if (e.dataTransfer.files && e.dataTransfer.files[0]) {
 processFiles(e.dataTransfer.files);
 }
 }, []);

 const handleFileInput = (e) => {
 if (e.target.files && e.target.files[0]) {
 processFiles(e.target.files);
 }
 };

 const removeFile = (id) => {
 setFiles(prev => prev.filter(f => f.id !== id));
 };

 // Google Drive file picker handler
 const handleGoogleDrivePicker = () => {
 // Load Google Picker API
 const loadPicker = () => {
 const script = document.createElement('script');
 script.src = 'https://apis.google.com/js/api.js';
 script.onload = () => {
 window.gapi.load('picker', () => {
 createPicker();
 });
 };
 document.body.appendChild(script);
 };

 const createPicker = () => {
 // Note: In production, you'll need to set up Google Cloud project and get API credentials
 // For now, we'll show a simple file URL input as a placeholder
 const driveUrl = prompt('Enter Google Drive file sharing link:\n(In production, this will use Google Picker API)');

 if (driveUrl) {
 // Extract file ID from Drive URL
 const fileIdMatch = driveUrl.match(/[-\w]{25,}/);
 if (fileIdMatch) {
 const fileId = fileIdMatch[0];
 // In production, you would fetch the file here using Google Drive API
 alert(`File ID extracted: ${fileId}\n\nTo complete Google Drive integration:\n1. Set up Google Cloud project\n2. Enable Google Drive API\n3. Get OAuth 2.0 credentials\n4. Implement file download from Drive`);
 } else {
 alert('Invalid Google Drive link. Please use a valid sharing link.');
 }
 }
 };

 // Check if Google API is already loaded
 if (window.gapi) {
 window.gapi.load('picker', () => {
 createPicker();
 });
 } else {
 loadPicker();
 }
 };

 // Robust JSON repair function
 const repairJSON = (text) => {
 let str = text;

 // Step 1: Remove markdown code fences
 str = str.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

 // Step 2: Find JSON boundaries (outermost braces)
 const start = str.indexOf('{');
 const end = str.lastIndexOf('}');
 if (start === -1 || end === -1) {
 throw new Error('No valid JSON object found in response');
 }
 str = str.slice(start, end + 1);

 // Step 3: Remove comments
 str = str.replace(/\/\*[\s\S]*?\*\//g, '');
 str = str.replace(/\/\/.*/g, '');

 // Step 4: Fix trailing commas (most common LLM error)
 // Multiple passes to handle nested structures
 for (let pass = 0; pass < 15; pass++) {
 str = str.replace(/,(\s*[}\]])/g, '$1');
 str = str.replace(/,(\s*,)+/g, ',');
 str = str.replace(/([{[])\s*,/g, '$1');
 }

 // Step 5: Fix missing commas between elements
 str = str.replace(/}(\s*)\{/g, '},$1{');
 str = str.replace(/](\s*)\[/g, '],$1[');
 str = str.replace(/"(\s+)"/g, '",$1"');
 str = str.replace(/}(\s*)"([^"]+)":/g, '},$1"$2":');
 str = str.replace(/](\s*)"([^"]+)":/g, '],$1"$2":');
 str = str.replace(/([0-9]|\btrue\b|\bfalse\b|\bnull\b)(\s*)"([^"]+)":/g, '$1,$2"$3":');

 // Step 6: Fix property values that are split across lines
 str = str.replace(/"\s*\n\s*"/g, '",\n"');

 // Step 7: Handle unescaped quotes inside strings (best effort)
 // This is tricky - we'll try to fix obvious cases
 str = str.replace(/: "([^"]*)"([^"]*)"([^"]*)",/g, (match, p1, p2, p3) => {
 if (p2.includes(':') || p2.includes('{') || p2.includes('[')) {
 return match; // Don't modify - likely valid JSON structure
 }
 return `: "${p1}\\"${p2}\\"${p3}",`;
 });

 return str;
 };

 // Extract and parse JSON from LLM response with repair
 const extractJSON = (text) => {
 try {
 // Try direct parse first (fastest path)
 return JSON.parse(text);
 } catch (e) {
 // Try repairing
 try {
 const repaired = repairJSON(text);
 const parsed = JSON.parse(repaired);
 console.log('✅ JSON successfully repaired and parsed');
 return parsed;
 } catch (repairError) {
 console.error('❌ JSON repair failed:', repairError);
 console.error('Problematic text (first 500 chars):', text.substring(0, 500));
 console.error('Problematic text (last 500 chars):', text.substring(Math.max(0, text.length - 500)));

 // Try to identify the error location in repaired string
 const errorMatch = repairError.message.match(/position (\d+)/);
 if (errorMatch) {
 const repairedStr = repairJSON(text);
 const position = parseInt(errorMatch[1]);
 const contextStart = Math.max(0, position - 150);
 const contextEnd = Math.min(repairedStr.length, position + 150);
 console.error('Context around error:', repairedStr.substring(contextStart, contextEnd));
 }

 throw repairError;
 }
 }
 };

 // Retry wrapper for API calls with JSON parsing
 const callClaudeWithRetry = async (prompt, maxRetries = 2) => {
 let lastError = null;

 for (let attempt = 1; attempt <= maxRetries; attempt++) {
 try {
 console.log(`🔄 API attempt ${attempt}/${maxRetries}`);

 // Modify prompt for retries to emphasize valid JSON
 const enhancedPrompt = attempt > 1
 ? `${prompt}\n\n⚠️ CRITICAL: Your previous response had invalid JSON. Return ONLY a valid JSON object with NO trailing commas, NO comments, NO text before or after the JSON. Start with { and end with }.`
 : prompt;

 const response = await fetch('/api/messages', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 model: 'claude-sonnet-4-20250514',
 max_tokens: attempt === maxRetries ? 12000 : 16000, // Reduce tokens on final retry
 temperature: 0.3,
 messages: [{ role: 'user', content: enhancedPrompt }]
 })
 });

 if (!response.ok) {
 throw new Error(`API error: ${response.status}`);
 }

 const data = await response.json();
 const content = data.content[0].text;

 // Try to parse JSON
 const parsed = extractJSON(content);
 console.log(`✅ API call succeeded on attempt ${attempt}`);
 return parsed;

 } catch (error) {
 lastError = error;
 console.error(`❌ Attempt ${attempt} failed:`, error.message);

 if (attempt < maxRetries) {
 console.log(`🔄 Retrying with enhanced JSON instructions...`);
 await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
 }
 }
 }

 // All retries failed
 throw new Error(`API call failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
 };

 // Multi-step analysis pipeline
 const runAnalysisPipeline = async (files, caseDescription, onProgress) => { // eslint-disable-line no-unused-vars
 const steps = [
 { name: 'Extracting entities', progress: 10 },
 { name: 'Analyzing documents', progress: 20 },
 { name: 'Screening sanctions', progress: 30 },
 { name: 'Resolving identities', progress: 40 },
 { name: 'Mapping relationships', progress: 50 },
 { name: 'Building timeline', progress: 60 },
 { name: 'Identifying patterns', progress: 70 },
 { name: 'Generating hypotheses', progress: 80 },
 { name: 'Synthesizing findings', progress: 90 },
 { name: 'Finalizing analysis', progress: 100 }
 ];

 // Helper to update progress
 const updateProgress = (stepIndex) => {
   if (onProgress) {
     onProgress({
       currentStep: steps[stepIndex].name,
       stepNumber: stepIndex + 1,
       totalSteps: steps.length,
       progress: steps[stepIndex].progress
     });
   }
 };

 // JSON formatting reminder for all prompts
 const jsonReminder = `

CRITICAL: Return ONLY valid JSON. NO trailing commas. NO comments. Follow these rules:
- Every array element except the last must be followed by a comma
- The last element in an array must NOT have a trailing comma
- The last property in an object must NOT have a trailing comma
- All strings must use double quotes, not single quotes
- No comments (//) or (/* */)`;

 let pipelineData = {};

 // STEP 1: Extracting entities

 const evidenceContext = files.map((f, idx) => {
 const truncatedContent = f.content.length > 3000
 ? f.content.substring(0, 3000) + '\n\n[... content truncated ...]'
 : f.content;
 return `[DOCUMENT ${idx + 1}: "${f.name}"]\n${truncatedContent}\n[END DOCUMENT ${idx + 1}]`;
 }).join('\n\n');

 const step1Prompt = `STEP 1: DOCUMENT UNDERSTANDING

You are the world's leading financial crimes investigator with 30+ years of experience at FinCEN, OFAC, the FBI Financial Crimes Unit, and the Financial Action Task Force (FATF). You've investigated major cases including HSBC's $1.9B cartel money laundering, 1MDB ($4.5B embezzlement), Danske Bank's €200B Russian laundering scandal, and the Panama Papers.

CRITICAL REQUIREMENT: You MUST be crystal-clear and specific in ALL your findings. Never use vague language like "suspicious entities" or "concerning transactions." Instead:
- Name the EXACT entity type: "SPV", "shell company", "front company", "nominee arrangement", "brass plate company"
- State SPECIFIC red flags: "Formed 3 days before $5M transfer", "Registered at known corporate service provider address", "No employees, no operations"
- Quantify everything: "$2.5M mismatch", "48 hours between formation and transaction", "shares 1 address with 247 other companies"
- Be definitive in your reasoning: "This IS an SPV because..." not "This may be suspicious"

You are analyzing ${files.length} document(s) for a financial crimes investigation. Apply your deep expertise to identify:
- Money laundering typologies (placement, layering, integration) - STATE WHICH STAGE
- Trade-Based Money Laundering (TBML) red flags - SPECIFY the scheme (over/under invoicing, phantom shipments, etc.)
- Shell companies, SPVs, brass plate companies - IDENTIFY SPECIFICALLY
- Sanctions evasion schemes and front companies - NAME the evasion technique
- Beneficial ownership obfuscation - DETAIL the concealment method
- Invoice manipulation - QUANTIFY discrepancies
- Correspondent banking vulnerabilities - SPECIFY the weakness exploited
- Real estate and luxury goods laundering - NAME the asset types

For each document, identify with PRECISION:
- Document type (bank statement, invoice, contract, email, corporate registry, wire transfer, trade document, etc.)
- Date range covered (EXACT dates)
- Key parties mentioned (DISTINGUISH: legal owner vs. beneficial owner vs. nominee director)
- Primary purpose/content (BE SPECIFIC)
- **CRITICAL**: Red flags that indicate potential financial crime - BE EXPLICIT:
 * "Company X is a Special Purpose Vehicle (SPV) formed solely to receive this transfer"
 * "Invoice shows $500K for 'consulting services' with no deliverables = likely sham transaction"
 * "Wire transfer routed through 3 jurisdictions in 24 hours = layering"

${evidenceContext}

Respond with JSON:
{
 "documentSummaries": [
 {
 "docId": 1,
 "docName": "filename",
 "type": "document type",
 "dateRange": "date range or N/A",
 "keyParties": ["party1", "party2"],
 "purpose": "brief description of document purpose",
 "keyFindings": ["notable finding 1", "finding 2"]
 }
 ]
}${jsonReminder}`;

 updateProgress(0); // Extracting entities
 const step1JSON = await callClaudeWithRetry(step1Prompt);
 pipelineData.documentSummaries = step1JSON.documentSummaries || [];

 // STEP 2: Analyzing documents
 updateProgress(1);

 const step2Prompt = `STEP 2: ENTITY EXTRACTION & INTELLIGENCE GATHERING

You are an expert financial intelligence analyst trained in entity extraction for money laundering and sanctions evasion investigations. Your extraction techniques have identified hidden beneficial owners, uncovered nominee structures, and connected seemingly unrelated shell companies in major investigations.

CRITICAL REQUIREMENT: Be SPECIFIC about entity characteristics. For each entity extracted, identify:
- EXACT entity type: "SPV (Special Purpose Vehicle)", "Shell company", "Operating company", "Brass plate entity", "Nominee director", "Beneficial owner", "Front company"
- SPECIFIC red flags: "Formed [date] - only [X] days before [transaction]", "Shares address with [Y] other companies", "No physical office", "No employees visible", "Registered at [specific corporate service provider]"
- QUANTIFIED concerns: "Formed in [jurisdiction] known for 0% corporate tax", "Same nominee director on [X] unrelated companies"

You recognize sophisticated concealment techniques - NAME THEM SPECIFICALLY:
- **Nominee arrangements**: STATE "This is a nominee director arrangement" and list ALL companies where this person serves
- **Name variations**: IDENTIFY "Intentional misspelling to evade sanctions screening: [Example]"
- **Layered structures**: MAP the chain: "A owns 60% of B, B owns 75% of C = A has indirect 45% control of C"
- **High-risk jurisdictions**: NAME them: "BVI SPV", "Seychelles IBC", "Panama foundation", "Delaware LLC with anonymous ownership"
- **Recently formed entities**: QUANTIFY: "Formed [date], first transaction [date] = [X] day gap - indicates SPV created for this transaction"
- **Professional enablers**: NAME them: "Registered agent: [Company] at [Address] - appears on 500+ other entities"

Extract ONLY specific named entities from the documents.

DOCUMENT SUMMARIES:
${JSON.stringify(pipelineData.documentSummaries, null, 2)}

FULL EVIDENCE:
${evidenceContext}

Extract every:
- Person (including nominee directors, hidden beneficial owners)
- Organization (including shell companies, front companies)
- Bank account (for transaction analysis)
- Address (especially PO boxes, registered agent addresses)
- Date (for timeline construction)
- Transaction amount (for financial analysis)

CRITICAL RULES:
- PERSON: Specific named individuals (e.g., "John Smith", "Vladimir Putin")
 * DO NOT extract: job titles alone, roles, or generic references like "the CEO"
- ORGANIZATION: Specific named companies or entities (e.g., "Acme Corp", "Bank of America")
 * DO NOT extract: countries, regions, industries, or generic terms like "the bank" or "the government"
- ACCOUNT/ADDRESS/DATE/AMOUNT: Extract these for analysis purposes
 * These help build timelines, track transactions, and establish patterns

DO NOT EXTRACT:
- Countries or regions as entities (e.g., "Russia", "Middle East", "Europe")
- Industries or sectors (e.g., "the oil industry", "financial sector")
- Generic references (e.g., "the company", "the individual", "government officials")
- Job titles without names (e.g., "CEO", "Director", "Agent")
- Abstract concepts or categories

RED FLAGS TO WATCH:
- Nominee directors (same person on multiple unrelated companies)
- Layered ownership (A owns B owns C owns D)
- Secrecy jurisdictions (BVI, Cayman, Panama, Cyprus, UAE)
- Recently formed entities with large transactions
- PO Box / registered agent addresses
- Bearer shares

Respond with JSON:
{
 "rawEntities": [
 {
 "id": "e1",
 "name": "Entity Name",
 "type": "PERSON|ORGANIZATION|ACCOUNT|ADDRESS|DATE|AMOUNT",
 "mentions": [
 {"docId": 1, "context": "How entity appears in Doc 1"},
 {"docId": 2, "context": "How entity appears in Doc 2"}
 ],
 "redFlags": ["Any red flags observed"],
 "potentialDuplicates": ["e2", "e5"]
 }
 ]
}${jsonReminder}`;

 const step2JSON = await callClaudeWithRetry(step2Prompt);
 pipelineData.rawEntities = step2JSON.rawEntities || [];

 // STEP 2B: Screen all extracted entities for sanctions
 updateProgress(2);

 const sanctionsPrompt = `You are a sanctions compliance expert with comprehensive knowledge of:
- OFAC SDN List (US Treasury)
- EU Consolidated Sanctions List
- UK HM Treasury Sanctions List
- UN Security Council Sanctions
- FATF High-Risk Jurisdictions
- All other international sanctions regimes

ENTITIES TO SCREEN:
${JSON.stringify(step2JSON.rawEntities, null, 2)}

For EACH entity, determine:
1. **Sanctions Status**: Are they currently sanctioned by any jurisdiction? (MATCH/POTENTIAL_MATCH/CLEAR)
2. **Sanctioning Bodies**: Which lists? (e.g., "OFAC SDN", "EU", "UK", "UN")
3. **Listing Date**: When were they added?
4. **Programs**: What programs? (e.g., "RUSSIA", "IRAN", "NORTH KOREA", "COUNTER-NARCOTICS")
5. **Owned Entities**: What companies/entities do they own or control? (with ownership %)
6. **Beneficial Owners**: Who are the beneficial owners (if entity is a company)?

CRITICAL: If an entity is sanctioned and owns companies, AUTOMATICALLY ADD all their owned companies as additional entities in the "additionalEntities" array. Each additional entity must be a full entity object with all required fields.

For example, if Vladimir Putin is sanctioned and owns Gazprom, Rosneft, and Sberbank, you MUST include those companies in additionalEntities like this:

"additionalEntities": [
  {
    "id": "entity-gazprom",
    "name": "Gazprom",
    "type": "ORGANIZATION",
    "sanctionStatus": "CLEAR",
    "role": "State-owned gas company controlled by sanctioned individual",
    "riskLevel": "HIGH",
    "sanctionDetails": null,
    "ownedCompanies": [],
    "beneficialOwners": [
      {"name": "Vladimir Putin", "ownershipPercent": 50, "sanctionStatus": "MATCH"}
    ]
  }
]

Return JSON:
{
  "entities": [
    {
      "id": "entity-1",
      "name": "Entity Name",
      "type": "PERSON|ORGANIZATION",
      "sanctionStatus": "MATCH|POTENTIAL_MATCH|CLEAR",
      "sanctionDetails": {
        "lists": ["OFAC SDN", "EU"],
        "listingDate": "2022-02-24",
        "programs": ["RUSSIA"],
        "details": "Brief description"
      },
      "ownedCompanies": [
        {"company": "Company A", "ownershipPercent": 51.0, "ownershipType": "DIRECT"},
        {"company": "Company B", "ownershipPercent": 100.0, "ownershipType": "BENEFICIAL"}
      ],
      "beneficialOwners": [
        {"name": "Owner Name", "ownershipPercent": 60.0, "sanctionStatus": "MATCH"}
      ]
    }
  ],
  "additionalEntities": [
    // Full entity objects for all owned companies of sanctioned individuals
    // MUST include: id, name, type, role, riskLevel, sanctionStatus, sanctionDetails, ownedCompanies, beneficialOwners
  ]
}${jsonReminder}`;

 const sanctionsJSON = await callClaudeWithRetry(sanctionsPrompt);

 // Merge sanctions data into entities
 if (sanctionsJSON.entities && sanctionsJSON.entities.length > 0) {
   // Create a map of original entities by ID for merging
   const entityMap = new Map();
   pipelineData.rawEntities.forEach(entity => {
     entityMap.set(entity.id, entity);
   });

   // Merge sanctions data into original entities
   sanctionsJSON.entities.forEach(sanctionedEntity => {
     const originalEntity = entityMap.get(sanctionedEntity.id);
     if (originalEntity) {
       originalEntity.sanctionStatus = sanctionedEntity.sanctionStatus;
       originalEntity.sanctionDetails = sanctionedEntity.sanctionDetails;
       originalEntity.ownedCompanies = sanctionedEntity.ownedCompanies;
       originalEntity.beneficialOwners = sanctionedEntity.beneficialOwners;
     }
   });
 }

 // Add owned companies as new entities
 if (sanctionsJSON.additionalEntities && sanctionsJSON.additionalEntities.length > 0) {
   pipelineData.rawEntities.push(...sanctionsJSON.additionalEntities);
 }

 // STEP 3: Resolving identities
 updateProgress(3);

 const step3Prompt = `STEP 3: ENTITY RESOLUTION & IDENTITY ANALYSIS

You are a master entity resolution specialist with deep experience in financial intelligence databases, corporate registries, and sanctions list matching. Your fuzzy matching algorithms have connected aliases across multiple jurisdictions, identified beneficial owners hiding behind nominees, and linked shell companies to their controllers.

Apply sophisticated resolution techniques:
- **Name matching**: Handle transliteration variants (Russian/Arabic names), cultural naming conventions, nicknames, married names
- **Corporate entity matching**: Recognize legal entity suffixes (Ltd/Limited, Corp/Corporation, AG/GmbH, SA/SAS), DBA names, holding company relationships
- **Address normalization**: Same addresses with variations in formatting (registered agent addresses are common among shell companies)
- **Temporal consistency**: Consider whether the same person could reasonably be involved in events at different times/locations
- **Contextual clues**: Business relationships, shared contact details, overlapping board memberships
- **Suspicious patterns**: Multiple entities with nearly identical names (indicates structuring or concealment)

Red flags in entity resolution:
- Intentional name variations to evade sanctions screening
- Use of professional nominee directors (same person on 50+ companies)
- Rapid formation and dissolution of similar-named entities
- Entities sharing exact addresses but claiming independence

EXTRACTED ENTITIES:
${JSON.stringify(pipelineData.rawEntities, null, 2)}

Critical questions:
- Is "John Smith" in Doc 1 the same as "J. Smith" in Doc 3? Check context, dates, relationships.
- Is "ABC Corp" and "ABC Corporation Ltd" the same entity? Check jurisdiction, addresses, business activities.
- Are spelling variations intentional evasion tactics or innocent differences?
- Do multiple entities with similar names represent a single beneficial owner's network?

Build unified entity profiles by intelligently merging duplicates.

Respond with JSON:
{
 "resolvedEntities": [
 {
 "id": "resolved_e1",
 "canonicalName": "Official Entity Name",
 "aliases": ["variant 1", "variant 2"],
 "type": "PERSON|ORGANIZATION|ACCOUNT",
 "role": "role in investigation",
 "allMentions": [
 {"docId": 1, "context": "mention context", "name": "John Smith"},
 {"docId": 3, "context": "mention context", "name": "J. Smith"}
 ],
 "riskIndicators": ["red flags from extraction"],
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL"
 }
 ],
 "resolutionNotes": "Any ambiguous cases or assumptions made"
}${jsonReminder}`;

 const step3JSON = await callClaudeWithRetry(step3Prompt);
 pipelineData.resolvedEntities = step3JSON.resolvedEntities || [];

 // STEP 4: Mapping relationships
 updateProgress(4);

 const step4Prompt = `STEP 4: RELATIONSHIP MAPPING & NETWORK ANALYSIS

You are an elite network analyst specializing in unraveling complex ownership structures and hidden control mechanisms. Your expertise has exposed layered shell company networks in the Panama Papers, traced oligarch assets through nominee structures, and mapped cartel money flows through trade-based laundering schemes.

Apply your advanced techniques:
- **Beneficial ownership unmasking**: Identify ultimate beneficial owners (UBOs) behind nominee and strawman arrangements
- **Control without ownership**: Detect de facto control through board seats, voting agreements, management contracts, and loan covenants
- **Network centrality analysis**: Identify key nodes and critical chokepoints in financial networks
- **Indirect ownership calculations**: Trace ownership chains (if A owns 60% of B, and B owns 50% of C, then A indirectly owns 30% of C)
- **Time-based analysis**: Track ownership changes, especially around sanctions announcements or regulatory inquiries
- **Red flag patterns**: Circular ownership, cross-shareholdings, opaque intermediaries

Draw on your knowledge of concealment techniques:
- Liechtenstein anstalts and Panama foundations
- Seychelles IBCs and BVI trusts
- Bearer share instruments
- Nominee director services in secrecy jurisdictions
- Dutch sandwich and Irish double structures (corporate tax evasion patterns that mirror ML structures)

RESOLVED ENTITIES:
${JSON.stringify(pipelineData.resolvedEntities, null, 2)}

DOCUMENTS:
${evidenceContext}

Map ALL connections:
- **Ownership**: Direct and indirect percentages, legal vs. beneficial ownership
- **Control**: Board seats, signatory authority, management agreements, voting rights
- **Family/Associate networks**: Relatives, close associates, known criminal affiliates
- **Business relationships**: Supplier, customer, partner, competitor
- **Financial flows**: Lender, borrower, guarantor, investor, fund transfers
- **Transactional**: Wire transfers, payments, invoices, contracts

Respond with JSON:
{
 "relationships": [
 {
 "entity1": "resolved_e1",
 "entity2": "resolved_e2",
 "relationshipType": "ownership|control|family|business|financial|transaction",
 "description": "Nature of relationship",
 "percentage": 0,
 "direct": true,
 "citations": ["Doc 1", "Doc 2"]
 }
 ],
 "ownershipChains": [
 {
 "ultimateBeneficialOwner": "Person X",
 "controlledEntity": "Company Y",
 "ownershipPercent": 45.5,
 "chain": "Person X -> (90%) -> Company A -> (50.5%) -> Company Y",
 "significantControl": true
 }
 ]
}${jsonReminder}`;

 const step4JSON = await callClaudeWithRetry(step4Prompt);
 pipelineData.relationships = step4JSON.relationships || [];
 pipelineData.ownershipChains = step4JSON.ownershipChains || [];

 // STEP 5: Building timeline
 updateProgress(5);

 const step5Prompt = `STEP 5: TIMELINE CONSTRUCTION

Extract ALL dated events and build a chronological timeline.

DOCUMENTS:
${evidenceContext}

RESOLVED ENTITIES:
${JSON.stringify(pipelineData.resolvedEntities.slice(0, 10), null, 2)}

Extract every date and event. Look for:
- Transaction dates
- Corporate formation dates
- Changes in ownership/control
- Sanctions listing dates
- Document signing dates
- Timing clusters (many events in short period)
- Suspicious gaps (periods with no activity)

Respond with JSON:
{
 "timeline": [
 {
 "id": "tl1",
 "date": "YYYY-MM-DD or description",
 "event": "What happened",
 "entitiesInvolved": ["resolved_e1", "resolved_e2"],
 "significance": "Why this matters",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "citations": ["Doc 1"]
 }
 ],
 "timelineAnalysis": {
 "timelineClusters": ["2022-03: 5 events in 2 weeks (unusual velocity)"],
 "suspiciousGaps": ["2021-06 to 2021-12: No activity despite ongoing business operations"],
 "keyMilestones": ["2020-01: Company formation", "2022-03: Sanctions listing"]
 }
}${jsonReminder}`;

 const step5JSON = await callClaudeWithRetry(step5Prompt);
 pipelineData.timeline = step5JSON.timeline || [];
 pipelineData.timelineAnalysis = step5JSON.timelineAnalysis || {};

 // STEP 6: Identifying patterns
 updateProgress(6);

 const step6Prompt = `STEP 6: PATTERN DETECTION & TYPOLOGY ANALYSIS

You are the world's foremost expert on financial crime typologies, having written the definitive guides on money laundering, sanctions evasion, and fraud detection used by global regulators. You've trained investigators at FATF, Europol, OFAC, and the Egmont Group. Your pattern recognition capabilities rival the best AI systems used by major banks' financial intelligence units.

CRITICAL REQUIREMENT FOR CRYSTAL-CLEAR ANALYSIS:
- NAME the specific typology: "Trade-Based Money Laundering via Over-Invoicing", NOT "suspicious trade activity"
- NAME the specific scheme: "Loan-Back Scheme", "Mirror Trading", "Smurfing", "SPV Layering", NOT "complex transactions"
- QUANTIFY everything: "$2.5M over-invoiced by 300%", "5 wire transfers totaling $10M in 48 hours", "SPV formed 72 hours before receiving $8M"
- STATE the exact mechanism: "Funds placed via cash deposits, layered through 3 SPVs in BVI/Cayman/Cyprus, integrated via UK real estate purchase"
- BE DEFINITIVE: "This IS trade-based laundering via phantom shipping" NOT "This appears suspicious"
- CITE evidence: "[Doc 3, page 5: Invoice #12345 shows $500K for 100 laptops = $5,000/unit vs. market price $800/unit = 525% overpricing]"

Draw on your encyclopedic knowledge of real-world case structures:
- Black Market Peso Exchange: Colombian cartels laundering via over-invoiced exports
- Russian Laundromat: $20B through Baltic mirror trades (simultaneous buy/sell)
- 1MDB: SPV networks in Seychelles/Cayman funneling funds through Singapore/Switzerland
- Real estate laundering: Anonymous LLC purchases of luxury condos
- Sanctions evasion: Front companies re-flagging vessels, transshipment via third countries
- 50% Rule circumvention: Nested ownership (SPV owns SPV owns target = diluted control)
- Mirror trading: Buy in rubles, sell in USD = capital flight
- Correspondent banking: Nested accounts masking true originators

Conduct a COMPREHENSIVE analysis identifying ALL typologies present with SPECIFIC NAMES AND MECHANISMS.

PIPELINE DATA SO FAR:
- Documents: ${pipelineData.documentSummaries.length}
- Entities: ${pipelineData.resolvedEntities.length}
- Relationships: ${pipelineData.relationships.length}
- Timeline Events: ${pipelineData.timeline.length}

ENTITIES:
${JSON.stringify(pipelineData.resolvedEntities, null, 2)}

RELATIONSHIPS:
${JSON.stringify(pipelineData.relationships, null, 2)}

TIMELINE:
${JSON.stringify(pipelineData.timeline, null, 2)}

COMPREHENSIVE TYPOLOGY ANALYSIS - Examine the evidence for ALL of these:

SANCTIONS EVASION:
- 50% Rule exposure (aggregate blocked ownership ≥50%)
- Front companies (recently formed entities acting for blocked persons)
- Shell companies in secrecy jurisdictions
- Nominee directors/straw owners
- Falsified shipping documents
- Transshipment through third countries
- Ownership changes timed with sanctions announcements
- Use of cutouts and intermediaries
- Asset concealment through layered structures

MONEY LAUNDERING (3 stages):
PLACEMENT:
- Structuring (smurfing) - transactions just below $10k threshold
- Cash-intensive businesses
- Bulk cash smuggling
- Currency exchanges

LAYERING:
- Rapid fund movement between accounts
- Round-dollar wire transfers
- Complex ownership chains
- Use of shell companies
- International wire transfers to high-risk jurisdictions
- Trade-based laundering (over/under invoicing)
- Loan-back schemes

INTEGRATION:
- Funnel accounts (many in → one out, or one in → many out)
- Commingling with legitimate funds
- Real estate purchases
- Luxury goods acquisition

FRAUD:
- Document inconsistencies (dates, signatures, amounts don't match)
- Phantom entities (exist on paper only, no real operations)
- Conflicts of interest (same person on both sides of transaction)
- Altered financial statements
- Invoice fraud (over-billing, phantom invoicing)
- Kickback schemes
- False representations

CORRUPTION & BRIBERY:
- Politically Exposed Persons (PEPs) involvement
- Government contracts with unusual terms
- Consulting agreements with no deliverables
- Family members of officials receiving payments
- Offshore accounts in PEP networks

TERRORIST FINANCING:
- Small transactions to high-risk regions
- Charity front organizations
- Hawala/informal value transfer
- Prepaid cards, gift cards

OTHER RED FLAGS:
- Inconsistent business profiles (small company, huge transactions)
- Jurisdictional arbitrage (entities in tax havens, secrecy jurisdictions)
- Recently formed entities with immediate large activity
- Missing documentation
- Unusual transaction timing
- PO Box addresses, registered agent addresses
- Bearer shares or undisclosed ownership
- Related party transactions without economic rationale

INSTRUCTIONS:
1. Identify ALL typologies that match the evidence (don't limit to just 3)
2. For each typology, cite SPECIFIC evidence from documents
3. Include both definitive patterns AND suspicious indicators worth noting
4. Differentiate between HIGH-CONFIDENCE typologies (clear evidence) and MODERATE-CONFIDENCE ones (indicators present)

Respond with JSON:
{
 "patterns": [
 {
 "name": "Pattern name",
 "category": "SANCTIONS_EVASION|MONEY_LAUNDERING|FRAUD|OTHER",
 "description": "Detailed pattern description",
 "instances": ["Instance 1 [Doc X]", "Instance 2 [Doc Y]"],
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL"
 }
 ],
 "typologies": [
 {
 "id": "t1",
 "name": "Specific typology name (e.g., 'Layering Through Shell Companies', 'Structuring to Avoid CTR Reporting')",
 "category": "MONEY_LAUNDERING_PLACEMENT|MONEY_LAUNDERING_LAYERING|MONEY_LAUNDERING_INTEGRATION|FRAUD|SANCTIONS_EVASION|CORRUPTION|TERRORIST_FINANCING|OTHER",
 "confidence": "HIGH|MODERATE|LOW",
 "description": "How this specific typology manifests in this case with concrete examples",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "indicators": ["Specific indicator 1 [Doc X, page Y]", "Indicator 2 [Doc Z]"],
 "redFlags": ["Concrete red flag 1", "Red flag 2"],
 "entitiesInvolved": ["entity_id_1", "entity_id_2"],
 "regulatoryRelevance": "BSA Section 314(a)|OFAC 50% Rule|EU Sanctions Regulation|SAR reporting required|etc",
 "evidenceStrength": "STRONG|MODERATE|WEAK"
 }
 ],
 "investigatorNotes": "Brief summary: X typologies identified with high confidence, Y with moderate confidence. Most concerning: [brief note]"
}${jsonReminder}`;

 const step6JSON = await callClaudeWithRetry(step6Prompt);
 pipelineData.patterns = step6JSON.patterns || [];
 pipelineData.typologies = step6JSON.typologies || [];

 // STEP 7: Generating hypotheses
 updateProgress(7);

 const step7Prompt = `STEP 7: HYPOTHESIS GENERATION & INVESTIGATIVE THEORIZATION

You are a master investigative strategist, having led complex multi-jurisdictional investigations that resulted in landmark prosecutions and regulatory actions. Your hypothesis generation methodology has been adopted by the FBI, Interpol, and major financial institutions' investigative units.

Apply your proven framework for building prosecutable cases:
1. **Alternative hypothesis testing**: Consider multiple competing theories, including innocent explanations
2. **Bayesian reasoning**: Assign confidence based on evidence strength and prior probabilities
3. **Investigative gap analysis**: Identify exactly what evidence would definitively prove/disprove each theory
4. **Prosecutorial viability**: Assess what would convince a jury or regulatory body
5. **Defense counter-arguments**: Anticipate how each hypothesis could be challenged

Draw on your experience with:
- Building RICO cases against transnational criminal organizations
- Financial intelligence analysis for national security investigations
- Asset forfeiture cases requiring clear beneficial ownership proof
- SAR-to-prosecution pipelines at major enforcement agencies

TYPOLOGIES DETECTED:
${JSON.stringify(pipelineData.typologies, null, 2)}

Generate 3-5 competing hypotheses explaining the evidence. For each:
- What is the theory?
- What evidence supports it?
- What evidence contradicts it?
- What additional evidence would prove/disprove it?
- Confidence level (0-1)

Respond with JSON:
{
 "hypotheses": [
 {
 "id": "h1",
 "title": "Clear hypothesis statement",
 "description": "Detailed 2-3 sentence explanation",
 "confidence": 0.75,
 "supportingEvidence": ["Evidence 1 [Doc X]", "Evidence 2 [Doc Y]"],
 "contradictingEvidence": ["Counter-evidence 1 [Doc Z]"],
 "investigativeGaps": ["What data would prove/disprove this", "Gap 2"],
 "implications": "What this would mean if true"
 }
 ],
 "contradictions": [
 {
 "description": "Contradiction in evidence",
 "source1": "Evidence piece 1 [Doc X]",
 "source2": "Conflicting evidence [Doc Y]",
 "resolution": "Possible explanation"
 }
 ]
}${jsonReminder}`;

 const step7JSON = await callClaudeWithRetry(step7Prompt);
 pipelineData.hypotheses = step7JSON.hypotheses || [];
 pipelineData.contradictions = step7JSON.contradictions || [];

 // STEP 8: Synthesis
 updateProgress(8);

 const investigationContext = caseDescription.trim()
 ? `INVESTIGATION CONTEXT:\n${caseDescription}\n\n`
 : '';

 const step8Prompt = `STEP 8: SYNTHESIS & STRATEGIC INTELLIGENCE ASSESSMENT

You are now synthesizing all findings into an actionable intelligence report that will guide high-stakes decisions by compliance officers, law enforcement, prosecutors, and regulators.

CRITICAL REQUIREMENT FOR CRYSTAL-CLEAR REPORTING:

**Executive Summary MUST include:**
- SPECIFIC entity types identified: "3 SPVs", "2 shell companies", "1 nominee director arrangement", NOT "several suspicious entities"
- EXACT typologies detected: "Trade-Based Money Laundering via 325% Over-Invoicing", "SPV Layering Scheme", NOT "money laundering indicators"
- QUANTIFIED concerns: "$8.5M transferred through 4 jurisdictions in 72 hours", "Company formed March 1, first transaction March 4 = 3-day gap indicating purpose-built SPV"
- DEFINITIVE risk assessment: "HIGH risk due to: (1) SPV structure, (2) $5M mismatch, (3) sanctioned party connection" NOT "elevated concerns"
- SPECIFIC recommended actions: "Issue subpoena for XYZ Bank records covering Jan-Mar 2024", "Request corporate registry docs for ABC Ltd (BVI IBC #12345)", NOT "gather additional information"

**Primary Concerns MUST be specific:**
❌ VAGUE: "Suspicious corporate structures identified"
✅ SPECIFIC: "Three Special Purpose Vehicles (SPVs) formed in BVI/Cayman/Seychelles within 30-day period, all sharing registered agent at Trident Trust, collectively received $12.5M with no apparent business purpose"

❌ VAGUE: "Unusual transaction patterns detected"
✅ SPECIFIC: "Wire transfer of $8.5M routed: Cyprus → Latvia → UK → Cayman in 48 hours, with intermediate stops at known high-risk correspondent banks = classic layering technique"

❌ VAGUE: "Possible sanctions exposure"
✅ SPECIFIC: "ABC Trading Ltd is 68% beneficially owned by Oleg Deripaska (OFAC SDN listed April 6, 2018), triggering OFAC 50% Rule - entity should be treated as blocked"

Your reports have directly informed:
- DOJ criminal prosecutions and consent decrees
- OFAC enforcement actions and civil penalties
- Bank de-risking and customer exit decisions
- Congressional testimony on systemic vulnerabilities
- Interpol Red Notices and asset freezing orders

**Understand the Context - Tailor Your Analysis:**
Your analysis serves different purposes depending on the use case:

📋 **Due Diligence / KYC/AML** (onboarding decision):
- Risk rating: ACCEPT / ENHANCED DUE DILIGENCE / REJECT
- Recommended monitoring: Transaction thresholds, periodic reviews, source of funds verification
- Risk mitigation: EDD measures, senior management approval, exit strategy

💼 **M&A / Investment / Commercial Due Diligence**:
- Deal recommendation: PROCEED / PROCEED WITH CONDITIONS / ABORT
- Risk quantification: Potential financial exposure, reputational risk, regulatory penalties
- Mitigation: Reps & warranties, indemnities, escrow provisions, post-closing audits

🚨 **Internal Investigation / Compliance Review**:
- SAR filing determination: FILE SAR / MONITOR / CLEAR
- Customer relationship: MAINTAIN / ENHANCED MONITORING / EXIT
- Remediation: Account restrictions, transaction limits, documentation requirements

⚖️ **Law Enforcement / Regulatory Support**:
- Criminal liability: Statutes violated (18 USC 1956, 31 USC 5318(k), 50 USC 1705)
- Evidence quality: Sufficient for prosecution / needs strengthening / insufficient
- Next investigative steps: Subpoenas, search warrants, witness interviews

${investigationContext}

**READ THE INVESTIGATION CONTEXT ABOVE and determine which use case applies. Adjust your tone, risk assessment, and recommendations accordingly.**

For example:
- If context mentions "client onboarding" → Focus on KYC/AML risk rating and EDD recommendations
- If context mentions "potential investment" → Focus on deal risk and transaction structuring
- If context mentions "suspicious activity" → Focus on SAR filing criteria and regulatory reporting
- If context mentions "prosecution" or "enforcement" → Focus on criminal statutes and evidence sufficiency

Apply your synthesis methodology with PRECISION:
1. **Risk calibration**: State EXACT risk level with SPECIFIC justification (calibrate based on use case)
2. **Use case-appropriate analysis**:
 - For onboarding: "ENHANCED DUE DILIGENCE required: beneficial ownership verification, source of funds documentation"
 - For prosecution: "Potential violations: 18 USC 1956(a)(1) - money laundering, OFAC violations under 50 USC 1705"
3. **Context-aware recommendations**: Match recommendations to the decision being made
4. **Strategic intelligence**: CONNECT to broader patterns relevant to stakeholder concerns
5. **Actionable next steps**: BE SPECIFIC to the use case

Remember: Be thorough, precise, definitive, and confident. NO VAGUE LANGUAGE. Context-aware precision is key.

PIPELINE RESULTS:
- Documents Analyzed: ${pipelineData.documentSummaries.length}
- Entities Identified: ${pipelineData.resolvedEntities.length}
- Relationships Mapped: ${pipelineData.relationships.length}
- Timeline Events: ${pipelineData.timeline.length}
- Patterns Found: ${pipelineData.patterns.length}
- Typologies Identified: ${pipelineData.typologies.length}
- Hypotheses Generated: ${pipelineData.hypotheses.length}

RESOLVED ENTITIES:
${JSON.stringify(pipelineData.resolvedEntities, null, 2)}

TYPOLOGIES:
${JSON.stringify(pipelineData.typologies, null, 2)}

HYPOTHESES:
${JSON.stringify(pipelineData.hypotheses, null, 2)}

Generate executive summary and consolidate findings.

Respond with JSON matching the full investigation format:
{
 "executiveSummary": {
 "overview": "Comprehensive 4-6 sentence executive summary",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "primaryConcerns": ["Concern 1", "Concern 2", "Concern 3"],
 "recommendedActions": ["Action 1", "Action 2", "Action 3"]
 },
 "entities": [
 {
 "id": "entity_id_from_resolvedEntities",
 "name": "Entity Name",
 "type": "PERSON|ORGANIZATION",
 "role": "Their role in the case",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "sanctionStatus": "CLEAR|MATCH|POTENTIAL_MATCH",
 "mentions": [{"docId": 1, "context": "How mentioned"}],
 "connections": ["connected_entity_id_1", "connected_entity_id_2"]
 }
 ],
 "note": "ONLY include PERSON and ORGANIZATION types in entities array. Do NOT include ACCOUNT, ADDRESS, DATE, or AMOUNT - those are used internally for analysis but are not displayed entities.",
 "typologies": ${JSON.stringify(pipelineData.typologies)},
 "timeline": ${JSON.stringify(pipelineData.timeline)},
 "hypotheses": ${JSON.stringify(pipelineData.hypotheses)},
 "patterns": ${JSON.stringify(pipelineData.patterns)},
 "contradictions": ${JSON.stringify(pipelineData.contradictions || [])},
 "relationships": ${JSON.stringify(pipelineData.relationships)},
 "nextSteps": [
 {
 "priority": "HIGH|MEDIUM|LOW",
 "action": "Specific action requiring human intervention",
 "rationale": "Why this is important",
 "expectedOutcome": "What we hope to learn"
 }
 ]
}

IMPORTANT: DO NOT suggest database screening, sanctions checking, or ownership verification as next steps - these are automated. Only suggest: document requests, interviews, legal consultations, subpoenas, registry filings, transaction analysis.`;

 updateProgress(8); // Synthesizing findings in progress
 const finalAnalysis = await callClaudeWithRetry(step8Prompt);

 updateProgress(9); // Finalizing analysis
 return finalAnalysis;
 };

 // Post-process analysis to add automated investigations
 const postProcessAnalysis = async (parsed) => {
 const automatedFindings = [];

 // Filter entities to ONLY include PERSON and ORGANIZATION types
 // ACCOUNT, ADDRESS, DATE, AMOUNT are used internally but not displayed
 if (parsed.entities) {
 parsed.entities = parsed.entities.filter(e =>
 e.type === 'PERSON' || e.type === 'ORGANIZATION'
 );
 }

 // For each sanctioned or high-risk entity, automatically investigate their network
 if (parsed.entities) {
 for (const entity of parsed.entities) {
 if (entity.sanctionStatus === 'MATCH' || entity.riskLevel === 'CRITICAL' || entity.riskLevel === 'HIGH') {

 // For individuals: Map their complete ownership portfolio
 if (entity.type === 'PERSON' && entity.ownedCompanies && entity.ownedCompanies.length > 0) {
 automatedFindings.push({
 entityId: entity.id,
 entityName: entity.name,
 findingType: 'OWNERSHIP_MAPPING',
 title: `Complete Ownership Portfolio Mapped for ${entity.name}`,
 description: `Automated investigation identified ${entity.ownedCompanies.length} entities in ownership portfolio. ${entity.ownedCompanies.filter(c => c.ownershipPercent >= 50).length} entities with controlling interest (≥50%).`,
 data: {
 totalEntities: entity.ownedCompanies.length,
 controllingInterest: entity.ownedCompanies.filter(c => c.ownershipPercent >= 50).length,
 significantInterest: entity.ownedCompanies.filter(c => c.ownershipPercent >= 25 && c.ownershipPercent < 50).length,
 companies: entity.ownedCompanies.map(c => ({
 name: c.company,
 ownership: c.ownershipPercent,
 type: c.ownershipType
 }))
 }
 });
 }

 // For organizations: Map beneficial ownership structure
 if (entity.type === 'ORGANIZATION' && entity.beneficialOwners && entity.beneficialOwners.length > 0) {
 const sanctionedOwners = entity.beneficialOwners.filter(o => o.sanctionStatus === 'SANCTIONED');

 if (sanctionedOwners.length > 0) {
 const totalSanctionedOwnership = sanctionedOwners.reduce((sum, o) => sum + (o.percent || 0), 0);

 automatedFindings.push({
 entityId: entity.id,
 entityName: entity.name,
 findingType: 'SANCTIONED_OWNERSHIP',
 title: `Sanctioned Beneficial Ownership Detected in ${entity.name}`,
 description: `${sanctionedOwners.length} sanctioned individual(s) identified in beneficial ownership structure. Total sanctioned ownership: ${totalSanctionedOwnership.toFixed(1)}%.`,
 data: {
 aggregateOwnership: totalSanctionedOwnership.toFixed(1),
 sanctionedOwners: sanctionedOwners.map(o => ({
 name: o.name,
 ownership: o.percent,
 lists: o.sanctionDetails?.lists || (o.sanctionDetails ? [o.sanctionDetails] : ['Sanctioned']),
 details: o.sanctionDetails
 })),
 ofacRuleTriggered: totalSanctionedOwnership >= 50
 }
 });
 }
 }

 // For organizations: Map corporate network
 if (entity.type === 'ORGANIZATION' && entity.corporateNetwork && entity.corporateNetwork.length > 0) {
 const highRiskRelated = entity.corporateNetwork.filter(r => r.sanctionExposure === 'DIRECT');

 automatedFindings.push({
 entityId: entity.id,
 entityName: entity.name,
 findingType: 'CORPORATE_NETWORK',
 title: `Corporate Network Mapped for ${entity.name}`,
 description: `Identified ${entity.corporateNetwork.length} related ${entity.corporateNetwork.length === 1 ? 'entity' : 'entities'} via common ownership. ${highRiskRelated.length > 0 ? `${highRiskRelated.length} with direct sanctions exposure.` : 'No direct sanctions exposure identified.'}`,
 data: {
 totalRelated: entity.corporateNetwork.length,
 directExposure: highRiskRelated.length,
 relatedEntities: entity.corporateNetwork.map(r => ({
 name: r.entity || r.name,
 relationship: r.relationship || 'RELATED',
 commonOwner: r.commonOwner,
 sanctionExposure: r.sanctionExposure || r.exposure || 'NONE'
 }))
 }
 });
 }
 }
 }
 }

 // Add automated findings to the analysis
 if (automatedFindings.length > 0) {
 parsed.automatedInvestigations = automatedFindings;
 }

 return parsed;
 };

 // Streaming conversation function - Claude-like interface
 const sendConversationMessage = async (userMessage, attachedFiles = []) => {
   if (!userMessage.trim() && attachedFiles.length === 0) return;

   // Track this query for analytics
   trackQuery();

   // Add user message to conversation
   const newUserMessage = {
     role: 'user',
     content: userMessage,
     files: attachedFiles.map(f => f.name),
     timestamp: new Date().toISOString()
   };
   setConversationMessages(prev => [...prev, newUserMessage]);
   setConversationInput('');
   setIsStreaming(true);
   setStreamingText('');

   // Build context from files - use attachedFiles passed to this function
   let evidenceContext = '';
   const filesToUse = attachedFiles.length > 0 ? attachedFiles : [];
   if (filesToUse.length > 0) {
     evidenceContext = filesToUse.map((file, idx) =>
       `[Doc ${idx + 1}: ${file.name}]\n${file.content?.substring(0, 8000) || ''}`
     ).join('\n\n---\n\n');
     // Clear files after adding to context
     setFiles([]);
   }

   // Build conversation history - filter out any empty messages
   const history = conversationMessages
     .filter(msg => msg.content && msg.content.trim())
     .map(msg => ({
       role: msg.role,
       content: msg.content.trim()
     }));

   const systemPrompt = `You are Marlowe, an expert financial crimes investigator.

⚠️ CRITICAL INSTRUCTION - READ FIRST ⚠️
You have TWO modes based on whether documents are uploaded:

${!evidenceContext ? `
🔍 YOU ARE IN SCREENING MODE (No documents uploaded)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The user is asking you to SCREEN a name using YOUR KNOWLEDGE.

YOU MUST:
✓ Use your training knowledge of sanctions lists (OFAC, UK, EU, UN)
✓ Use your knowledge of PEPs (Politically Exposed Persons)
✓ Use your knowledge of major adverse media and public information
✓ Provide a COMPLETE risk assessment based on what you know
✓ Cite authoritative sources by name (e.g., "UK Sanctions List", "Reuters", "OFAC SDN")

YOU MUST NOT:
✗ Ask for documents - the user wants a screening, not document analysis
✗ Say "I don't see any documents" or "please upload documents"
✗ Refuse to answer or claim you lack access to data
✗ Use [Doc 1] format - there are no documents to cite

EXAMPLE - If user asks "Screen Vladimir Potanin":
Provide his UK sanctions status (added June 2022), his role as owner of Norilsk Nickel, his net worth ranking in Russia, adverse media about Kremlin ties, etc. ALL FROM YOUR KNOWLEDGE.

Cite sources like: "Added to UK sanctions list in June 2022 (UK HM Treasury)", "Owner of Norilsk Nickel (OpenCorporates, public filings)", "Covered extensively in Reuters, Financial Times"
` : `
📄 YOU ARE IN INVESTIGATION MODE (Documents uploaded)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The user has uploaded documents for analysis.

YOU MUST:
✓ Cite every claim using [Doc 1], [Doc 2] format
✓ Only make claims supported by the uploaded documents
✓ Quote directly when possible: "quoted text" [Doc 1]

Citation rules:
1. EVERY factual claim needs [Doc X] citation
2. Direct quotes: "quoted text" [Doc 1]
3. Paraphrasing: cite at end of sentence [Doc 1]
4. Multiple sources: [Doc 1, Doc 3]

At end, list: Sources: [Doc 1] - filename, etc.
`}

Your personality:
- Direct and clear, never hedge when you're confident
- You think out loud: "The concerning part is..." "What this tells me is..." "Notice how..."
- You quote evidence directly and explain what it means in plain terms
- You're helpful but honest about limitations

OUTPUT FORMAT:
When analyzing documents or entities for risks, structure your response like this:

OVERALL RISK: [CRITICAL/HIGH/MEDIUM/LOW]

[Opening paragraph explaining your overall assessment conversationally]

CRITICAL RED FLAGS

For each red flag, use this exact format:

1. **[Descriptive Title - e.g., "Zero Beneficial Ownership Controls"]**
> *"[Exact quote from the transcript or document in italics]"*

Translation: [Direct, blunt explanation of what this red flag actually means from a compliance/AML perspective. Don't soften it - explain the real risk.]

2. **[Second Red Flag Title]**
> *"[Another exact quote]"*

Translation: [Plain language explanation of the compliance failure or money laundering risk]

[Continue numbering for each significant red flag]

Focus on identifying:
- Lack of beneficial ownership verification
- Payment layering indicators
- Sanctions exposure risks
- KYC/AML control weaknesses
- Unusual transaction patterns
- Documentation gaps

Be DIRECT and BLUNT in translations - explain what each response really signals from a money laundering or compliance failure perspective. Don't hedge.

TYPOLOGIES PRESENT
[List the specific financial crime patterns you identified: Money laundering indicators, Fraud markers, Sanctions exposure, Shell company risks, etc.]

ONBOARDING DECISION
[Your clear recommendation: REJECT, ENHANCED DUE DILIGENCE, or PROCEED WITH CAUTION, with brief rationale]

DOCUMENTS TO REQUEST
- [Specific document that would help clarify a red flag]
- [Another document request]

THE MEMO
[A brief 2-3 sentence summary suitable for escalation to senior compliance - what's the core issue and recommended action?]

=== FOLLOW-UP SUGGESTIONS ===
If you can dig deeper or need more information, ALWAYS end your response with 2-4 clickable follow-up prompts. Frame these as IMPERATIVE STATEMENTS (commands/actions), NOT questions.

Format these as a clear list at the end of your response:

**Keep exploring:**
- [Imperative statement suggesting next action]
- [Command to upload or provide documents]
- [Action to take on the entity or transaction]

Examples of good follow-up prompts (IMPERATIVE, not questions):
- "Check sanctions exposure on related entities"
- "Upload ownership documents or corporate registry filings"
- "Analyze the source of funds for these transactions"
- "Show me the beneficial ownership structure"
- "Identify any PEP connections"
- "Map the corporate hierarchy"

NEVER phrase as questions like "Would you like..." or "Can you provide...". Always use direct imperatives.

Always include these prompts when:
- You can dig deeper into the analysis
- Key documents are missing
- The user's question is broad or could benefit from more detail
- There are obvious next steps in the investigation

When conversing casually or answering follow-up questions, just respond naturally without the full structured format, but still include follow-up suggestions if you need more information.

Current case context:
${caseDescription ? `Case description: ${caseDescription}` : 'No case description yet.'}
${evidenceContext ? `\n\nEvidence documents:\n${evidenceContext}` : ''}`;

   try {
     // Use streaming endpoint for real-time text display
     const response = await fetch(`${API_BASE}/api/stream`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         model: 'claude-sonnet-4-20250514',
         max_tokens: 4096,
         system: systemPrompt,
         messages: [...history, { role: 'user', content: userMessage.trim() || 'Please analyze the attached documents.' }]
       })
     });

     if (!response.ok) {
       const errorText = await response.text();
       throw new Error(`Request failed (${response.status}): ${errorText}`);
     }

     // Process the stream
     const reader = response.body.getReader();
     const decoder = new TextDecoder();
     let fullText = '';
     let chunkCount = 0;

     console.log('Starting to read stream...');

     while (true) {
       const { done, value } = await reader.read();
       if (done) {
         console.log('Stream done. Total chunks:', chunkCount, 'Final text length:', fullText.length);
         break;
       }

       chunkCount++;
       const chunk = decoder.decode(value, { stream: true });
       console.log(`Chunk ${chunkCount} received (${chunk.length} chars):`, chunk.substring(0, 200));
       const lines = chunk.split('\n');

       for (const line of lines) {
         if (line.startsWith('data: ')) {
           const data = line.slice(6);
           if (data === '[DONE]') continue;

           try {
             const parsed = JSON.parse(data);
             // Check for error responses
             if (parsed.error) {
               console.error('API error in stream:', parsed.error);
               fullText = `Error from API: ${parsed.error.message || JSON.stringify(parsed.error)}`;
               setStreamingText(fullText);
               break;
             }
             // Handle both Vercel stream format and raw Anthropic format
             if (parsed.text) {
               fullText += parsed.text;
               setStreamingText(fullText);
             } else if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
               fullText += parsed.delta.text;
               setStreamingText(fullText);
             }
           } catch (e) {
             // Skip non-JSON lines
             console.log('Non-JSON line:', line.substring(0, 100));
           }
         }
       }
     }

     // Add completed message to conversation
     if (fullText) {
       setConversationMessages(prev => [...prev, {
         role: 'assistant',
         content: fullText,
         timestamp: new Date().toISOString()
       }]);
     } else {
       // No text received - show error
       console.error('No text received from API');
       setConversationMessages(prev => [...prev, {
         role: 'assistant',
         content: 'No response received from the API. This may be due to the file content being too large or containing unsupported characters. Please try with a smaller file or different format.',
         timestamp: new Date().toISOString()
       }]);
     }
     setStreamingText('');

   } catch (error) {
     console.error('Streaming error:', error);
     setConversationMessages(prev => [...prev, {
       role: 'assistant',
       content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
       timestamp: new Date().toISOString()
     }]);
   } finally {
     setIsStreaming(false);
   }
 };

 // Scroll conversation to bottom
 useEffect(() => {
   conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [conversationMessages, streamingText]);

 // Sync conversation transcript to current case
 useEffect(() => {
   if (currentCaseId && conversationMessages.length > 0) {
     updateCaseTranscript(currentCaseId, conversationMessages);
   }
 }, [conversationMessages, currentCaseId]); // eslint-disable-line react-hooks/exhaustive-deps

 const analyzeEvidence = async () => {
 console.log('analyzeEvidence called', { files: files.length, caseDescription: caseDescription.substring(0, 50) });
 if (files.length === 0 && !caseDescription.trim()) {
   console.log('No files or description, returning early');
   return;
 }

 console.log('Starting analysis...');
 setIsAnalyzing(true);
 setAnalysis(null); // Clear previous analysis

 // Check if this is a screening request
 const isScreening = caseDescription.startsWith('[SCREENING]');
 
 if (isScreening) {
 // Extract the screening subject
 const screeningSubject = caseDescription.replace('[SCREENING]', '').trim();
 
 if (!screeningSubject) {
 setAnalysisError('Please enter a subject to screen');
 setIsAnalyzing(false);
 return;
 }

 const systemPrompt = `You are a KYC screening specialist. Screen individuals and entities against sanctions lists, PEP databases, and adverse media.

HIGH-PROFILE SANCTIONED INDIVIDUALS AND THEIR CORPORATE OWNERSHIP:
- OLEG DERIPASKA (SDN April 2018): Owns EN+ Group (48%), Rusal (48% indirect), Basic Element (100%)
- ALISHER USMANOV (SDN March 2022): Owns USM Holdings (100%), Metalloinvest (49%), MegaFon (15.2%)
- VIKTOR VEKSELBERG (SDN April 2018): Owns Renova Group (100%), Sulzer AG (63.4%), Columbus Nova (beneficial owner)
- ROMAN ABRAMOVICH (EU/UK/Canada March 2022): Owns Evraz (28.6%), Millhouse Capital (100%), formerly Chelsea FC
- GENNADY TIMCHENKO (SDN March 2014): Owns Volga Group (100%), Novatek (23.5%), Sibur (17%)
- ARKADY & BORIS ROTENBERG (SDN March 2014): Own SMP Bank (37.5% each), SGM Group (100%), Stroygazmontazh (51%)
- ALEXEI MORDASHOV (EU February 2022): Owns Severstal (77%), TUI AG (34%), Nordgold (90%)
- VLADIMIR POTANIN (UK June 2022): Owns Norilsk Nickel (34.6%), Interros (100%), Rosa Khutor (50%)
- VLADIMIR PUTIN (SANCTIONED - EU/UK/Canada/Australia/Japan/Switzerland Feb 2022, US EO 14024): President of Russia, state control over Gazprom (50%+), Rosneft (50%+), Sberbank (50%+), VTB Bank (60.9%), Transneft (100%) - CRITICAL RISK

SANCTIONED ENTITIES: NIOC, IRGC, PDVSA, Rusal, EN+ Group, Gazprombank, Wagner Group, XPCC

OFAC 50% RULE: Entity owned 50%+ aggregate by blocked persons is itself blocked.

CRITICAL FOR OWNERSHIP EXTRACTION: When you identify ANY person in your analysis, you MUST check if they appear in the sanctioned individuals list above and include ALL their owned companies in the entities array. This is essential for complete sanctions risk assessment.

You must respond with a JSON object that will be converted into an investigative case format. Structure:
{
 "executiveSummary": {
 "overview": "Comprehensive 4-6 sentence executive summary providing: (1) Subject identification and business/political context, (2) Exact sanctions/regulatory status with specific designation details (listing dates, programs like 'Executive Order 13662', jurisdictions like OFAC/EU/UK), (3) Key ownership structures, government connections, or PEP status, (4) Material compliance implications and transaction restrictions, (5) Critical risk factors requiring enhanced due diligence or rejection. Write in authoritative, professional tone for senior compliance officers. Include specific regulatory citations and percentages where applicable.",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "primaryConcerns": ["Detailed concern with specific sanctions programs/dates/implications", "Concern with exact ownership percentages or government connections", "Concern with clear legal/compliance consequences"],
 "recommendedActions": ["Specific action with regulatory basis (e.g., 'REJECT transactions under OFAC sanctions', 'ESCALATE for licensing determination', 'PROHIBIT dealings per 50% rule')", "Action with compliance outcome", "Action with documentation requirement"]
 },
 "entities": [
 {
 "id": "e1",
 "name": "subject name",
 "type": "PERSON or ORGANIZATION",
 "role": "Screening Subject",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "riskIndicators": ["sanctions match", "PEP status", etc],
 "citations": ["Screening Results"]
 }
 ],
 "typologies": [
 {
 "id": "t1",
 "name": "Sanctions Exposure" or "PEP Risk" etc,
 "category": "SANCTIONS_EVASION",
 "description": "details",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "indicators": ["specific findings"],
 "redFlags": ["red flags found"]
 }
 ],
 "timeline": [
 {
 "id": "tl1",
 "date": "date if known",
 "event": "sanctions listing, PEP appointment, adverse media event",
 "significance": "why this matters",
 "riskLevel": "HIGH",
 "citations": ["Source"]
 }
 ],
 "patterns": [
 {
 "name": "pattern type",
 "description": "what was found",
 "instances": ["example 1", "example 2"]
 }
 ],
 "nextSteps": [
 {
 "priority": "HIGH|MEDIUM|LOW",
 "action": "Short action (max 15 words)",
 "source": "https://... (optional URL to OFAC announcement or regulatory guidance)"
 }
 ]
}

Perform comprehensive screening checking: sanctions lists (OFAC, UN, EU, UK), PEP status, adverse media, and ownership analysis. Return detailed findings.

NEXT STEPS must be SHORT (max 15 words). Include source URLs when available.`;

 const userPrompt = `Screen this subject: ${screeningSubject}`;

 try {
 setAnalysisError(null);
 const response = await fetch(`${API_BASE}/api/messages`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "claude-sonnet-4-20250514",
 max_tokens: 8000,
 messages: [
 { role: "user", content: `${systemPrompt}\n\n${userPrompt}` }
 ]
 })
 });

 if (!response.ok) {
 const errorText = await response.text();
 throw new Error(`API error: ${response.status} - ${errorText}`);
 }

 const data = await response.json();
 const text = data.content?.map(item => item.text || "").join("\n") || "";
 
 let jsonStr = text;
 const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
 if (codeBlockMatch) {
 jsonStr = codeBlockMatch[1].trim();
 } else {
 const jsonMatch = text.match(/\{[\s\S]*\}/);
 if (jsonMatch) {
 jsonStr = jsonMatch[0];
 }
 }
 
 if (jsonStr && jsonStr.startsWith('{')) {
 try {
 const parsed = JSON.parse(jsonStr);

 // Auto-generate case name based on analysis
 const primaryEntities = parsed.entities?.slice(0, 2).map(e => e.name).join(', ') || 'Unknown';
 const riskLevel = parsed.executiveSummary?.riskLevel || 'UNKNOWN';
 const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
 const autoName = `${primaryEntities} - ${riskLevel} - ${dateStr}`;
 setCaseName(autoName);

 setAnalysis(parsed);
 setActiveTab('overview');
 saveCase(parsed, autoName);
 } catch (parseError) {
 console.error('JSON parse error:', parseError);
 setAnalysisError(`Error parsing screening results: ${parseError.message}`);
 }
 } else {
 setAnalysisError('No structured results returned from screening.');
 }
 } catch (error) {
 console.error('Screening error:', error);
 setAnalysisError(`Error during screening: ${error.message}`);
 } finally {
 setIsAnalyzing(false);
 }
 
 return;
 }

 // OTHERWISE PROCEED WITH NORMAL INVESTIGATION ANALYSIS

 // Both Scout and Cipher now use the same investigation pipeline
 // Scout uses Sonnet, Cipher uses Opus
 if (false) { // Scout-specific pipeline disabled - uses unified pipeline below
 // SCOUT MODE: Multi-step screening pipeline (DISABLED)
 try {
 setAnalysisError(null);

 // Generate case name from user input for Scout - extract entity name
 let displayCaseName = caseName;
 if (!displayCaseName) {
   if (caseDescription.trim()) {
     // Extract entity name from description (e.g., "Tim Allen who is an actor" -> "Tim Allen")
     displayCaseName = extractEntityName(caseDescription);
   } else if (files.length > 0) {
     displayCaseName = files.map(f => f.name.replace(/\.[^/.]+$/, '')).join(', ');
     if (displayCaseName.length > 60) {
       displayCaseName = displayCaseName.substring(0, 60) + '...';
     }
   } else {
     displayCaseName = `Scout Screening ${new Date().toLocaleDateString()}`;
   }
 }

 // Initialize background analysis state for Scout
 setBackgroundAnalysis({
   isRunning: true,
   isComplete: false,
   caseId: null,
   caseName: displayCaseName,
   currentStep: 'Initializing screening...',
   stepNumber: 0,
   totalSteps: 6,
   progress: 0,
   pendingAnalysis: null
 });
 setNotificationDismissed(false);
 setIsAnalyzing(false); // Hide full-screen loader, show progress card instead

 // Scout Pipeline Steps
 const scoutSteps = [
   { name: 'Analyzing documents', progress: 15 },
   { name: 'Extracting entities', progress: 30 },
   { name: 'Screening sanctions', progress: 50 },
   { name: 'Assessing risk levels', progress: 70 },
   { name: 'Generating recommendations', progress: 85 },
   { name: 'Compiling report', progress: 100 }
 ];

 const updateScoutProgress = (stepIndex) => {
   setBackgroundAnalysis(prev => ({
     ...prev,
     currentStep: scoutSteps[stepIndex].name + '...',
     stepNumber: stepIndex + 1,
     totalSteps: scoutSteps.length,
     progress: Math.round(scoutSteps[stepIndex].progress * 0.9)
   }));
 };

 const evidenceContext = files.map((f, idx) => {
   const truncatedContent = f.content.length > 5000
     ? f.content.substring(0, 5000) + '\n\n[... content truncated ...]'
     : f.content;
   return `[DOCUMENT ${idx + 1}: "${f.name}"]\n${truncatedContent}\n[END DOCUMENT ${idx + 1}]`;
 }).join('\n\n');

 const jsonReminder = `

CRITICAL: Return ONLY valid JSON. NO trailing commas. NO comments. Follow these rules:
- Every array element except the last must be followed by a comma
- The last element in an array must NOT have a trailing comma
- All strings must use double quotes`;

 let scoutPipelineData = {};

 // SCOUT STEP 1: Document Analysis
 updateScoutProgress(0);

 const step1Prompt = `You are a KYC/AML document analyst. Analyze these documents and summarize what they contain.

DOCUMENTS:
${evidenceContext}

For each document, identify:
- Document type (bank statement, invoice, contract, email, corporate registry, etc.)
- Key parties mentioned
- Relevant dates and amounts
- Any immediate red flags

Respond with JSON:
{
  "documentAnalysis": [
    {
      "docId": 1,
      "docName": "filename",
      "type": "document type",
      "keyParties": ["party1", "party2"],
      "keyDates": ["date1"],
      "keyAmounts": ["$X"],
      "initialRedFlags": ["any immediate concerns"]
    }
  ]
}${jsonReminder}`;

 const step1Response = await fetch(`${API_BASE}/api/messages`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
     model: "claude-sonnet-4-20250514",
     max_tokens: 4000,
     messages: [{ role: "user", content: step1Prompt }]
   })
 });

 if (!step1Response.ok) throw new Error(`Step 1 failed: ${step1Response.status}`);
 const step1Data = await step1Response.json();
 const step1Text = step1Data.content?.map(item => item.text || "").join("\n") || "";
 const step1Match = step1Text.match(/\{[\s\S]*\}/);
 if (step1Match) {
   try {
     scoutPipelineData.documentAnalysis = JSON.parse(step1Match[0]).documentAnalysis || [];
   } catch (e) {
     scoutPipelineData.documentAnalysis = [];
   }
 }

 // SCOUT STEP 2: Entity Extraction
 updateScoutProgress(1);

 const step2Prompt = `You are an expert entity extraction specialist for KYC/AML screening.

DOCUMENT ANALYSIS:
${JSON.stringify(scoutPipelineData.documentAnalysis, null, 2)}

FULL DOCUMENTS:
${evidenceContext}

Extract ALL named entities:
- PERSON: Named individuals only (e.g., "John Smith", "Vladimir Putin")
- ORGANIZATION: Named companies/entities (e.g., "Acme Corp", "Gazprom")

DO NOT extract countries, industries, or generic terms.

Respond with JSON:
{
  "entities": [
    {
      "id": "e1",
      "name": "Entity Name",
      "type": "PERSON|ORGANIZATION",
      "role": "their role in the documents",
      "mentions": ["Doc 1: context", "Doc 2: context"],
      "initialRiskIndicators": ["any concerns"]
    }
  ]
}${jsonReminder}`;

 const step2Response = await fetch(`${API_BASE}/api/messages`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
     model: "claude-sonnet-4-20250514",
     max_tokens: 6000,
     messages: [{ role: "user", content: step2Prompt }]
   })
 });

 if (!step2Response.ok) throw new Error(`Step 2 failed: ${step2Response.status}`);
 const step2Data = await step2Response.json();
 const step2Text = step2Data.content?.map(item => item.text || "").join("\n") || "";
 const step2Match = step2Text.match(/\{[\s\S]*\}/);
 if (step2Match) {
   try {
     scoutPipelineData.entities = JSON.parse(step2Match[0]).entities || [];
   } catch (e) {
     scoutPipelineData.entities = [];
   }
 }

 // SCOUT STEP 3: Sanctions Screening
 updateScoutProgress(2);

 const step3Prompt = `You are a sanctions compliance expert with comprehensive knowledge of OFAC SDN, EU, UK, UN sanctions lists.

HIGH-PROFILE SANCTIONED INDIVIDUALS AND THEIR CORPORATE OWNERSHIP:
- OLEG DERIPASKA (SDN April 2018): Owns EN+ Group (48%), Rusal (48% indirect), Basic Element (100%)
- ALISHER USMANOV (SDN March 2022): Owns USM Holdings (100%), Metalloinvest (49%), MegaFon (15.2%)
- VIKTOR VEKSELBERG (SDN April 2018): Owns Renova Group (100%), Sulzer AG (63.4%), Columbus Nova (beneficial owner)
- ROMAN ABRAMOVICH (EU/UK/Canada March 2022): Owns Evraz (28.6%), Millhouse Capital (100%), formerly Chelsea FC
- GENNADY TIMCHENKO (SDN March 2014): Owns Volga Group (100%), Novatek (23.5%), Sibur (17%)
- ARKADY & BORIS ROTENBERG (SDN March 2014): Own SMP Bank (37.5% each), SGM Group (100%), Stroygazmontazh (51%)
- ALEXEI MORDASHOV (EU February 2022): Owns Severstal (77%), TUI AG (34%), Nordgold (90%)
- VLADIMIR POTANIN (UK June 2022): Owns Norilsk Nickel (34.6%), Interros (100%), Rosa Khutor (50%)
- VLADIMIR PUTIN (SANCTIONED - EU/UK/Canada/Australia/Japan/Switzerland Feb 2022, US EO 14024): President of Russia, state control over Gazprom (50%+), Rosneft (50%+), Sberbank (50%+), VTB Bank (60.9%), Transneft (100%) - CRITICAL RISK

SANCTIONED ENTITIES: NIOC, IRGC, PDVSA, Rusal, EN+ Group, Gazprombank, Wagner Group, XPCC

OFAC 50% RULE: Entity owned 50%+ aggregate by blocked persons is itself blocked.

ENTITIES TO SCREEN:
${JSON.stringify(scoutPipelineData.entities, null, 2)}

For EACH entity, determine sanctions status. If a sanctioned person owns companies, add those companies to additionalEntities.

Respond with JSON:
{
  "screeningResults": [
    {
      "entityId": "e1",
      "sanctionStatus": "MATCH|POTENTIAL_MATCH|CLEAR",
      "sanctionDetails": {
        "lists": ["OFAC SDN", "EU"],
        "listingDate": "2022-02-24",
        "programs": ["RUSSIA"],
        "reason": "brief reason"
      },
      "ownedCompanies": [
        {"name": "Company A", "ownershipPercent": 51}
      ]
    }
  ],
  "additionalEntities": [
    {
      "id": "ae1",
      "name": "Owned Company Name",
      "type": "ORGANIZATION",
      "role": "Owned by sanctioned individual",
      "sanctionStatus": "BLOCKED_BY_50_PERCENT_RULE",
      "beneficialOwner": "Sanctioned Person Name",
      "ownershipPercent": 51
    }
  ]
}${jsonReminder}`;

 const step3Response = await fetch(`${API_BASE}/api/messages`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
     model: "claude-sonnet-4-20250514",
     max_tokens: 6000,
     messages: [{ role: "user", content: step3Prompt }]
   })
 });

 if (!step3Response.ok) throw new Error(`Step 3 failed: ${step3Response.status}`);
 const step3Data = await step3Response.json();
 const step3Text = step3Data.content?.map(item => item.text || "").join("\n") || "";
 const step3Match = step3Text.match(/\{[\s\S]*\}/);
 if (step3Match) {
   try {
     const step3Parsed = JSON.parse(step3Match[0]);
     scoutPipelineData.screeningResults = step3Parsed.screeningResults || [];
     scoutPipelineData.additionalEntities = step3Parsed.additionalEntities || [];
   } catch (e) {
     scoutPipelineData.screeningResults = [];
     scoutPipelineData.additionalEntities = [];
   }
 }

 // SCOUT STEP 4: Risk Assessment
 updateScoutProgress(3);

 const step4Prompt = `You are a risk assessment specialist. Based on the entity extraction and sanctions screening results, assess the overall risk.

ENTITIES:
${JSON.stringify(scoutPipelineData.entities, null, 2)}

SANCTIONS SCREENING RESULTS:
${JSON.stringify(scoutPipelineData.screeningResults, null, 2)}

ADDITIONAL ENTITIES (owned companies):
${JSON.stringify(scoutPipelineData.additionalEntities, null, 2)}

DOCUMENT ANALYSIS:
${JSON.stringify(scoutPipelineData.documentAnalysis, null, 2)}

For each entity, provide a comprehensive risk assessment. Identify any financial crime typologies present.

Respond with JSON:
{
  "entityRiskAssessments": [
    {
      "entityId": "e1",
      "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
      "riskIndicators": ["indicator 1", "indicator 2"],
      "riskRationale": "explanation of risk assessment"
    }
  ],
  "typologies": [
    {
      "id": "t1",
      "name": "Typology name",
      "category": "SANCTIONS_EVASION|MONEY_LAUNDERING|FRAUD|OTHER",
      "description": "description",
      "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
      "indicators": ["indicator 1"],
      "redFlags": ["red flag 1"],
      "involvedEntities": ["e1", "e2"]
    }
  ],
  "overallRiskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "overallRiskRationale": "explanation"
}${jsonReminder}`;

 const step4Response = await fetch(`${API_BASE}/api/messages`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
     model: "claude-sonnet-4-20250514",
     max_tokens: 6000,
     messages: [{ role: "user", content: step4Prompt }]
   })
 });

 if (!step4Response.ok) throw new Error(`Step 4 failed: ${step4Response.status}`);
 const step4Data = await step4Response.json();
 const step4Text = step4Data.content?.map(item => item.text || "").join("\n") || "";
 const step4Match = step4Text.match(/\{[\s\S]*\}/);
 if (step4Match) {
   try {
     const step4Parsed = JSON.parse(step4Match[0]);
     scoutPipelineData.entityRiskAssessments = step4Parsed.entityRiskAssessments || [];
     scoutPipelineData.typologies = step4Parsed.typologies || [];
     scoutPipelineData.overallRiskLevel = step4Parsed.overallRiskLevel || 'MEDIUM';
     scoutPipelineData.overallRiskRationale = step4Parsed.overallRiskRationale || '';
   } catch (e) {
     scoutPipelineData.entityRiskAssessments = [];
     scoutPipelineData.typologies = [];
     scoutPipelineData.overallRiskLevel = 'MEDIUM';
   }
 }

 // SCOUT STEP 5: Generate Recommendations
 updateScoutProgress(4);

 const step5Prompt = `You are a compliance advisory specialist. Based on the screening results and risk assessment, provide actionable recommendations.

OVERALL RISK: ${scoutPipelineData.overallRiskLevel}
RISK RATIONALE: ${scoutPipelineData.overallRiskRationale}

ENTITIES WITH RISK ASSESSMENTS:
${JSON.stringify(scoutPipelineData.entityRiskAssessments, null, 2)}

TYPOLOGIES IDENTIFIED:
${JSON.stringify(scoutPipelineData.typologies, null, 2)}

SANCTIONS HITS:
${JSON.stringify(scoutPipelineData.screeningResults?.filter(r => r.sanctionStatus !== 'CLEAR'), null, 2)}

Provide:
1. Executive summary (2-3 sentences)
2. Primary concerns (top 3-5)
3. Recommended next steps with priority

Respond with JSON:
{
  "executiveSummary": {
    "overview": "2-3 sentence summary",
    "primaryConcerns": ["concern 1", "concern 2", "concern 3"],
    "recommendedActions": ["action 1", "action 2"]
  },
  "nextSteps": [
    {
      "priority": "HIGH|MEDIUM|LOW",
      "action": "specific action",
      "rationale": "why this is important"
    }
  ]
}${jsonReminder}`;

 const step5Response = await fetch(`${API_BASE}/api/messages`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
     model: "claude-sonnet-4-20250514",
     max_tokens: 4000,
     messages: [{ role: "user", content: step5Prompt }]
   })
 });

 if (!step5Response.ok) throw new Error(`Step 5 failed: ${step5Response.status}`);
 const step5Data = await step5Response.json();
 const step5Text = step5Data.content?.map(item => item.text || "").join("\n") || "";
 const step5Match = step5Text.match(/\{[\s\S]*\}/);
 if (step5Match) {
   try {
     const step5Parsed = JSON.parse(step5Match[0]);
     scoutPipelineData.executiveSummary = step5Parsed.executiveSummary || {};
     scoutPipelineData.nextSteps = step5Parsed.nextSteps || [];
   } catch (e) {
     scoutPipelineData.executiveSummary = { overview: 'Analysis complete', primaryConcerns: [], recommendedActions: [] };
     scoutPipelineData.nextSteps = [];
   }
 }

 // SCOUT STEP 6: Compile Final Report
 updateScoutProgress(5);

 // Merge entities with their risk assessments and sanctions results
 const finalEntities = scoutPipelineData.entities.map(entity => {
   const riskAssessment = scoutPipelineData.entityRiskAssessments?.find(r => r.entityId === entity.id) || {};
   const sanctionResult = scoutPipelineData.screeningResults?.find(r => r.entityId === entity.id) || {};
   return {
     ...entity,
     riskLevel: riskAssessment.riskLevel || 'MEDIUM',
     riskIndicators: riskAssessment.riskIndicators || entity.initialRiskIndicators || [],
     sanctionStatus: sanctionResult.sanctionStatus || 'CLEAR',
     sanctionDetails: sanctionResult.sanctionDetails || null,
     ownedCompanies: sanctionResult.ownedCompanies || [],
     citations: entity.mentions || []
   };
 });

 // Add additional entities (owned companies of sanctioned individuals)
 if (scoutPipelineData.additionalEntities?.length > 0) {
   scoutPipelineData.additionalEntities.forEach(ae => {
     finalEntities.push({
       id: ae.id,
       name: ae.name,
       type: ae.type,
       role: ae.role,
       riskLevel: 'HIGH',
       riskIndicators: [`Owned ${ae.ownershipPercent}% by ${ae.beneficialOwner}`, 'Subject to OFAC 50% Rule'],
       sanctionStatus: ae.sanctionStatus,
       citations: []
     });
   });
 }

 // Build final analysis object
 const finalAnalysis = {
   executiveSummary: {
     ...scoutPipelineData.executiveSummary,
     riskLevel: scoutPipelineData.overallRiskLevel || 'MEDIUM'
   },
   entities: finalEntities,
   typologies: scoutPipelineData.typologies || [],
   nextSteps: scoutPipelineData.nextSteps || []
 };

 // Auto-generate case name based on analysis if not already set
 let finalCaseName = displayCaseName;
 if (!caseName || caseName === '') {
   const primaryEntities = finalAnalysis.entities?.slice(0, 2).map(e => e.name).join(', ') || 'Unknown';
   const riskLevel = finalAnalysis.executiveSummary?.riskLevel || 'UNKNOWN';
   const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
   finalCaseName = `${primaryEntities} - ${riskLevel} - ${dateStr}`;
   setCaseName(finalCaseName);
 }

 await new Promise(resolve => setTimeout(resolve, 300));

 // Complete - show "Results ready" popup and store pending analysis
 setBackgroundAnalysis(prev => ({
   ...prev,
   isRunning: false,
   isComplete: true,
   progress: 100,
   currentStep: 'Screening complete',
   caseName: finalCaseName,
   pendingAnalysis: finalAnalysis
 }));

 // Save the case but don't navigate yet
 saveCase(finalAnalysis, finalCaseName);

 } catch (error) {
 console.error('Scout pipeline error:', error);
 setAnalysisError(`Scout screening error: ${error.message}`);
 setBackgroundAnalysis(prev => ({ ...prev, isRunning: false, isComplete: false }));
 } finally {
 setIsAnalyzing(false);
 }
 return;
 }

 // CIPHER MODE: Run analysis
 console.log('CIPHER MODE: Starting analysis');

 // Generate initial case name from user input - extract entity name
 let displayCaseName = caseName;
 if (!displayCaseName) {
   if (caseDescription.trim()) {
     // Extract entity name from description (e.g., "Tim Allen who is an actor" -> "Tim Allen")
     displayCaseName = extractEntityName(caseDescription);
   } else if (files.length > 0) {
     // Use file names
     displayCaseName = files.slice(0, 2).map(f => f.name.replace(/\.[^.]+$/, '')).join(', ');
   } else {
     displayCaseName = 'New Investigation';
   }
 }

 // Start progress tracking
 setBackgroundAnalysis({
   isRunning: true,
   isComplete: false,
   caseId: `case_${Date.now()}`,
   caseName: displayCaseName,
   currentStep: 'Initializing analysis...',
   stepNumber: 1,
   totalSteps: 5,
   progress: 5,
   pendingAnalysis: null
 });
 setNotificationDismissed(false); // Reset notification dismissed state for new analysis
 setIsAnalyzing(false); // Hide full-screen loader, show progress card instead

 // Use multi-step pipeline for files with substantial content
 if (files.length > 0 && files.some(f => f.content.length > 500)) {
try {
setAnalysisError(null);

// Progress callback for precise pipeline step updates
const handlePipelineProgress = (progressInfo) => {
  setBackgroundAnalysis(prev => ({
    ...prev,
    currentStep: progressInfo.currentStep + '...',
    stepNumber: progressInfo.stepNumber,
    totalSteps: progressInfo.totalSteps,
    progress: Math.round(progressInfo.progress * 0.85) // Pipeline is 85% of total
  }));
};

const finalAnalysis = await runAnalysisPipeline(files, caseDescription, handlePipelineProgress);

// Update progress: Post-processing
setBackgroundAnalysis(prev => ({
  ...prev,
  currentStep: 'Compiling results...',
  stepNumber: 10,
  progress: 88
}));

// Process the analysis through automated investigation
const enhancedAnalysis = await postProcessAnalysis(finalAnalysis);

// Auto-generate case name: use extracted entity name + risk level + date
const riskLevel = enhancedAnalysis.executiveSummary?.riskLevel || 'UNKNOWN';
const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
let finalCaseName = `${displayCaseName} - ${riskLevel} - ${dateStr}`;
setCaseName(finalCaseName);

// Update progress: Finalizing
setBackgroundAnalysis(prev => ({
  ...prev,
  caseName: finalCaseName,
  currentStep: 'Preparing report...',
  stepNumber: 11,
  progress: 95
}));

await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause before showing results

// Complete - show "Results ready" and store pending analysis
setBackgroundAnalysis(prev => ({
  ...prev,
  isRunning: false,
  isComplete: true,
  progress: 100,
  currentStep: 'Analysis complete',
  pendingAnalysis: enhancedAnalysis
}));

// Save the case but don't navigate yet - user will click to view
saveCase(enhancedAnalysis, finalCaseName);

return; // Pipeline succeeded, exit

} catch (error) {
 console.error('Pipeline analysis error:', error);
 setAnalysisError(`Analysis pipeline error: ${error.message}. Falling back to single-step analysis.`);
 // Fall through to traditional analysis below
 }
 }

 // Text-only or fallback: Single-step analysis
 console.log('Starting single-step analysis...');

 // Update progress for single-step
 setBackgroundAnalysis(prev => ({
   ...prev,
   currentStep: 'Analyzing content...',
   stepNumber: 1,
   progress: 20
 }));

 // Traditional single-step analysis
 // Limit content to avoid context overflow - truncate each file to ~8000 chars
 const evidenceContext = files.map((f, idx) => {
 const truncatedContent = f.content.length > 8000
 ? f.content.substring(0, 8000) + '\n\n[... content truncated for analysis ...]'
 : f.content;
 return `[DOCUMENT ${idx + 1}: "${f.name}"]\n${truncatedContent}\n[END DOCUMENT ${idx + 1}]`;
 }).join('\n\n');

 const systemPrompt = `You are Marlowe, a senior financial crimes investigator with 15 years of experience at FinCEN, OFAC, and major financial institutions. You've worked hundreds of money laundering, sanctions evasion, and fraud cases. You have deep expertise equivalent to Certified Fraud Examiners (CFE) and ACAMS-certified professionals.

HIGH-PROFILE SANCTIONED INDIVIDUALS AND THEIR CORPORATE OWNERSHIP:
- OLEG DERIPASKA (SDN April 2018): Owns EN+ Group (48%), Rusal (48% indirect), Basic Element (100%)
- ALISHER USMANOV (SDN March 2022): Owns USM Holdings (100%), Metalloinvest (49%), MegaFon (15.2%)
- VIKTOR VEKSELBERG (SDN April 2018): Owns Renova Group (100%), Sulzer AG (63.4%), Columbus Nova (beneficial owner)
- ROMAN ABRAMOVICH (EU/UK/Canada March 2022): Owns Evraz (28.6%), Millhouse Capital (100%), formerly Chelsea FC
- GENNADY TIMCHENKO (SDN March 2014): Owns Volga Group (100%), Novatek (23.5%), Sibur (17%)
- ARKADY & BORIS ROTENBERG (SDN March 2014): Own SMP Bank (37.5% each), SGM Group (100%), Stroygazmontazh (51%)
- ALEXEI MORDASHOV (EU February 2022): Owns Severstal (77%), TUI AG (34%), Nordgold (90%)
- VLADIMIR POTANIN (UK June 2022): Owns Norilsk Nickel (34.6%), Interros (100%), Rosa Khutor (50%)
- VLADIMIR PUTIN (SANCTIONED - EU/UK/Canada/Australia/Japan/Switzerland Feb 2022, US EO 14024): President of Russia, state control over Gazprom (50%+), Rosneft (50%+), Sberbank (50%+), VTB Bank (60.9%), Transneft (100%) - CRITICAL RISK

SANCTIONED ENTITIES: NIOC, IRGC, PDVSA, Rusal, EN+ Group, Gazprombank, Wagner Group, XPCC

OFAC 50% RULE: Entity owned 50%+ aggregate by blocked persons is itself blocked.

CRITICAL FOR OWNERSHIP EXTRACTION: When you identify ANY person in your analysis, you MUST check if they appear in the sanctioned individuals list above and include ALL their owned companies in the entities array. This is essential for complete sanctions risk assessment.

ENTITY EXTRACTION - THINK LIKE AN INVESTIGATOR:

When extracting entities, watch for RED FLAGS:
- Nominee directors (people who appear on many unrelated companies)
- Layered ownership structures (Company A owns B owns C owns D)
- Jurisdictional arbitrage (entities in secrecy havens: BVI, Cayman, Panama, Cyprus, UAE, Malta)
- Mismatched profiles (small company, huge transactions)
- Recently formed entities involved in large deals
- PO Box addresses, registered agent addresses
- Bearer shares or undisclosed ownership

ENTITY RELATIONSHIPS THAT MATTER:
- Beneficial ownership (direct and indirect)
- Control relationships (board seats, signing authority)
- Family connections (often used to obscure ownership)
- Business relationships (supplier, customer, partner)
- Financial relationships (lender, guarantor, investor)

For each entity, ask yourself:
- Why would this entity exist in this structure?
- What legitimate purpose does it serve?
- What could it be hiding?

SPECIALIZED INVESTIGATION FRAMEWORKS:

SANCTIONS EVASION INDICATORS:
- 50% Rule exposure (aggregate ownership by blocked persons)
- Front companies (recently formed, minimal operations, high transaction volume)
- Falsified shipping documents
- Transshipment through third countries
- Use of shell companies to obscure blocked party involvement
- Changes in ownership structure timed with sanctions announcements
- Multiple intermediaries in supply chain
- Discrepancies in stated end-users

MONEY LAUNDERING INDICATORS (Three stages: Placement, Layering, Integration):
- Structuring patterns (transactions just below reporting thresholds)
- Round-dollar transactions (unusual in legitimate business)
- Rapid movement of funds (in and out quickly)
- Funnel accounts (many sources, one destination)
- Trade-based laundering (over/under invoicing)
- Commingling of funds
- Use of cash-intensive businesses
- Complex wire transfer patterns obscuring origin/destination

FRAUD INVESTIGATION INDICATORS:
- Document inconsistencies (dates, signatures, amounts)
- Phantom entities (exist on paper only)
- Conflicts of interest (same person on both sides of transaction)
- Unusual timing patterns
- Missing documentation
- Altered financial statements
- Invoice manipulation
- Shell company involvement

Your role is to analyze evidence and produce structured investigative findings. You must:
1. Extract ALL entities (people, organizations, accounts, addresses, dates, amounts)
2. Screen entities against sanctions lists and identify PEP/adverse media exposure
3. **CRIMINAL HISTORY CHECK**: For EVERY person identified, search your knowledge for any criminal history including:
   - Arrests, indictments, and convictions (even decades old)
   - Drug charges, fraud, tax evasion, money laundering
   - Federal and state criminal cases
   - Plea deals and cooperation agreements
   - Prison sentences served
   THIS IS CRITICAL - historical criminal records are directly relevant to financial crime risk assessment
4. Analyze beneficial ownership structures and apply OFAC 50% Rule
5. For EACH person/individual entity, identify ALL companies they own or control (with ownership percentages)
6. For EACH company entity, identify ALL beneficial owners (with ownership percentages)
7. Build a chronological timeline of events
8. Identify patterns, red flags, and potential violations
9. Generate and score multiple hypotheses
10. Find contradictions and gaps in the evidence
11. ALWAYS cite specific documents for every claim using [Doc X] format

=== CITATION REQUIREMENTS (MANDATORY) ===

CRITICAL: You must cite every factual claim. No exceptions.

Format: [Doc 1], [Doc 2], etc. based on document upload order.

Rules:
1. EVERY factual claim must include a citation in [Doc X] format
2. If quoting directly, use: "quoted text" [Doc 1]
3. If paraphrasing, cite at end of sentence [Doc 1]
4. If a claim spans multiple documents: [Doc 1, Doc 3]
5. If something is an inference (not directly stated), say: "This suggests..." or "This implies..." (no citation needed for inferences)
6. If no document supports a claim, DO NOT make the claim

Examples:
- "The CFO stated they 'don't get too hung up on form' regarding third-party payments [Doc 1]."
- "Wire transfers totaling $14.7M were sent to Horizon Pacific [Doc 2, Doc 3]."
- "No KYC process exists for non-regulated customers [Doc 1]."
- "This suggests possible structuring to avoid reporting thresholds." (inference - no citation)

At the end of your analysis, list all documents referenced:
Sources:
[Doc 1] - filename
[Doc 2] - filename

VALIDATION - Before submitting, verify:
- Does every red flag have a citation?
- Does every entity reference cite where it appeared?
- Does every timeline event cite its source?
- Are direct quotes attributed?

If citations are missing, your output is incomplete. Go back and add them.

=== END CITATION REQUIREMENTS ===

CRITICAL: When you identify a person as a subject of investigation, you MUST also extract and include:
- All companies they own (direct ownership)
- All companies they control (indirect ownership through other entities)
- All companies where they have beneficial ownership
- Ownership percentages for each relationship
This information is essential for sanctions screening and OFAC 50% Rule analysis.

Red Flag Indicators to Watch:
- Structuring (transactions just below reporting thresholds)
- Round-dollar transactions
- Rapid movement of funds
- Shell company indicators
- Beneficial ownership opacity
- Unusual transaction patterns
- Geographic risk factors (high-risk jurisdictions)
- Timing anomalies
- Inconsistent documentation
- Sanctions evasion indicators
- PEP involvement
- Complex corporate structures hiding ownership`;

 const investigationContext = caseDescription.trim() 
 ? `INVESTIGATION CONTEXT:\n${caseDescription}\n\n`
 : '';

 const userPrompt = files.length > 0
 ? `${investigationContext}Analyze the following evidence materials and produce an investigative analysis.

${evidenceContext}

DOCUMENT INTELLIGENCE REQUIREMENTS:
1. CROSS-REFERENCE DOCUMENTS: Compare information across all documents. Look for:
   - Dates that don't match (invoice dated March but wire transfer in January)
   - Amounts that don't reconcile (contract says $100K but payment was $150K)
   - Names/entities that appear differently (Company A in one doc, Company A Ltd in another)
   - Conflicting statements about ownership, roles, or relationships

2. ENTITY RESOLUTION: When the same person/company appears with different names:
   - "J. Smith", "John Smith", "J.S.", "Smith, John" → consolidate as one entity
   - Track all aliases/variations found across documents
   - Note which documents use which name variation

3. TIMELINE RECONSTRUCTION: Extract ALL dates from documents and build a chronology:
   - Contract signing dates, payment dates, incorporation dates
   - Email timestamps, meeting dates, filing dates
   - Flag timeline gaps or suspicious timing (payment before contract, etc.)

4. CONTRADICTIONS: Actively look for information that doesn't add up:
   - Different ownership percentages in different docs
   - Conflicting addresses or jurisdictions
   - Statements that contradict each other

Respond with a JSON object in this exact structure:
{
 "executiveSummary": {
 "oneLiner": "Single direct sentence a senior executive can read and immediately understand. Be blunt: 'This company is controlled by a sanctioned oligarch.' not 'There may be potential exposure.'",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "analysis": "Write 3-5 paragraphs in CONVERSATIONAL PROSE (not bullet points). Think out loud like an experienced investigator briefing a colleague. Start with what jumps out: 'The first thing that stands out here is...' or 'What immediately concerns me is...'. Quote directly from documents: 'The agreement states [exact quote], which is a classic red flag for...' Be opinionated: 'This is textbook layering.' not 'This may be consistent with layering typologies.' Use plain English: 'They're hiding who really owns this company' not 'The beneficial ownership structure exhibits opacity.' End with what's missing: 'What I'd want to see next is...' or 'The big question this doesn't answer is...'"
 },
 "redFlags": [
 {
   "id": "rf1",
   "title": "Short punchy title (e.g., 'No Real KYC', 'Hidden Ownership', 'Shell Company Red Flags')",
   "quote": "Exact quote from the document that proves this. Pull the actual words.",
   "citation": "Doc X",
   "translation": "Plain English: what does this actually mean? 'They're basically saying they don't verify who their customers are.' Be direct and slightly informal."
 }
 ],
 "typologies": [
 {
   "name": "Plain English typology (e.g., 'Money Laundering', 'Sanctions Evasion', 'Bribery')",
   "indicators": ["Specific indicator in plain English [Doc X]", "Another indicator [Doc Y]"]
 }
 ],
 "entities": [
 {
 "id": "e1",
 "name": "Entity Name (canonical/most complete form)",
 "aliases": ["J. Smith", "John S.", "JS", "other variations found in documents"],
 "type": "PERSON|ORGANIZATION|ACCOUNT",
 "role": "Brief role in the case",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "sanctionStatus": "CLEAR|POTENTIAL_MATCH|SANCTIONED",
 "pepStatus": false,
 "criminalHistory": [{"offense": "Description of offense", "date": "Year or date", "jurisdiction": "Federal/State/Country", "outcome": "Convicted/Acquitted/Plea deal", "sentence": "Prison time or fine if applicable"}],
 "beneficialOwners": [{"name": "owner", "percent": 0, "sanctionStatus": "CLEAR|SANCTIONED"}],
 "ownedCompanies": [{"company": "Company Name", "ownershipPercent": 0, "ownershipType": "DIRECT|INDIRECT|BENEFICIAL"}],
 "riskIndicators": ["specific risk indicators with [Doc X] citations"],
 "citations": ["Doc 1", "Doc 2"]
 }
 ],
 "timeline": [
 {
 "id": "tl1",
 "date": "YYYY-MM-DD or description",
 "event": "What happened with specific details",
 "significance": "Why this event matters to the investigation",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "citations": ["Doc 1"]
 }
 ],
 "hypotheses": [
 {
 "id": "h1",
 "title": "Clear, specific hypothesis statement",
 "description": "Detailed 2-3 sentence explanation of the hypothesis and its implications",
 "confidence": 0.75,
 "supportingEvidence": ["Specific supporting evidence point 1 with detailed citation [Doc X]", "Evidence point 2 [Doc Y]", "Evidence point 3 [Doc Z]"],
 "contradictingEvidence": ["Contradicting evidence 1 [Doc X]", "Counter-evidence 2 [Doc Y]"],
 "investigativeGaps": ["Document or information that would clarify this"]
 }
 ],
 "patterns": [
 {
 "name": "Pattern name",
 "description": "Detailed description of the pattern and its significance",
 "instances": ["Specific instance 1 [Doc X]", "Instance 2 [Doc Y]", "Instance 3 [Doc Z]"]
 }
 ],
 "documentCrossReferences": [
 {
 "id": "dcr1",
 "finding": "What the cross-reference reveals (e.g., 'Invoice date doesn't match wire transfer')",
 "doc1": {"name": "Doc 1 name", "quote": "Exact quote from doc 1", "citation": "Doc 1"},
 "doc2": {"name": "Doc 2 name", "quote": "Exact quote from doc 2", "citation": "Doc 2"},
 "significance": "Why this matters - what it suggests about the case",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL"
 }
 ],
 "contradictions": [
 {
 "id": "c1",
 "title": "Short title (e.g., 'Conflicting ownership claims')",
 "description": "Specific contradiction in the evidence",
 "source1": {"quote": "Exact quote", "citation": "Doc X", "context": "What this document claims"},
 "source2": {"quote": "Conflicting quote", "citation": "Doc Y", "context": "What this document claims"},
 "significance": "Why this contradiction matters",
 "resolution": "Possible explanation or what's needed to resolve"
 }
 ],
 "relationships": [
 {
 "entity1": "e1",
 "entity2": "e2",
 "relationshipType": "ownership|transaction|employment|family|beneficial_owner|other",
 "description": "Nature of the relationship",
 "citations": ["Doc 1"]
 }
 ],
 "nextSteps": [
 {
 "priority": "HIGH|MEDIUM|LOW",
 "action": "Short action (max 15 words) - link to Marlowe if data needed",
 "source": "https://... (optional URL to relevant OFAC announcement, press release, or regulatory guidance)"
 }
 ]
}

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON, nothing else
- Start with { and end with }

WRITING STYLE - THIS IS ESSENTIAL:
You are an experienced financial crimes investigator briefing a colleague. Write like you talk.

1. PROSE, NOT BULLETS: The analysis field should read like a written briefing, not a PowerPoint. Use paragraphs.

2. THINK OUT LOUD:
   - "The first thing that jumps out here is..."
   - "This is concerning because..."
   - "What's missing from this picture is..."
   - "If I were the regulator looking at this, I'd ask..."

3. BE DIRECT AND OPINIONATED:
   - YES: "This is a red flag."
   - NO: "There may be potential risk indicators that warrant further review."
   - YES: "They're hiding who owns this company."
   - NO: "The beneficial ownership structure exhibits characteristics of opacity."

4. QUOTE THE EVIDENCE: Pull actual quotes from documents, then explain what they mean.
   - "The contract states 'payment may be routed through intermediary accounts at the discretion of the service provider.' That's code for 'we'll move your money wherever we want and you won't know where it went.'"

5. PLAIN ENGLISH: Write for a smart person who isn't a compliance expert.
   - YES: "They're moving money through shell companies to hide where it came from"
   - NO: "The counterparty exhibits characteristics consistent with layering typologies"

NEXT STEPS - Keep them SHORT (max 15 words each):
- "REJECT: SDN-listed entity" + source URL
- "Request beneficial ownership docs → upload to Marlowe"
- "ESCALATE: PEP with corruption allegations"

NEVER SUGGEST what Marlowe already did (sanctions screening, ownership mapping, etc.)`
 : `${investigationContext}Based on the investigation description provided, create an initial investigative framework with preliminary analysis.

Since no evidence documents have been uploaded yet, focus on:
1. Identifying key entities mentioned or implied
2. Potential typologies based on the description
3. Recommended investigative steps
4. Data collection priorities

Respond with a JSON object in this exact structure:
{
 "executiveSummary": {
 "overview": "Summary of the investigation scope",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "primaryConcerns": ["based on description"],
 "recommendedActions": ["next steps"]
 },
 "entities": [
 {
 "id": "e1",
 "name": "Entity name from description",
 "type": "PERSON|ORGANIZATION|ACCOUNT",
 "role": "Role in investigation",
 "riskLevel": "UNKNOWN",
 "sanctionStatus": "UNKNOWN",
 "pepStatus": false,
 "beneficialOwners": [],
 "riskIndicators": [],
 "citations": ["Investigation Scope"]
 }
 ],
 "typologies": [
 {
 "id": "t1",
 "name": "Potential typology",
 "category": "MONEY_LAUNDERING|FRAUD|SANCTIONS_EVASION|OTHER",
 "description": "Based on description",
 "riskLevel": "MEDIUM",
 "indicators": ["indicators to look for"],
 "redFlags": ["red flags to watch"]
 }
 ],
 "timeline": [],
 "hypotheses": [
 {
 "id": "h1",
 "title": "Initial hypothesis",
 "description": "Based on description",
 "confidence": 0.5,
 "supportingEvidence": ["investigation scope"],
 "contradictingEvidence": [],
 "investigativeGaps": ["evidence needed"]
 }
 ],
 "patterns": [],
 "nextSteps": [
 {
 "priority": "HIGH",
 "action": "Short action (max 15 words)",
 "source": "https://... (optional URL)"
 }
 ]
}`;

 // Simulated progress updates during API call
 const progressSteps = [
   { step: 'Extracting entities...', progress: 25 },
   { step: 'Building timeline...', progress: 35 },
   { step: 'Identifying patterns...', progress: 45 },
   { step: 'Generating hypotheses...', progress: 55 }
 ];

 let progressIndex = 0;
 let progressInterval = null;

 try {
 setAnalysisError(null);

 progressInterval = setInterval(() => {
   if (progressIndex < progressSteps.length) {
     const currentStep = progressSteps[progressIndex];
     if (currentStep) {
       setBackgroundAnalysis(prev => ({
         ...prev,
         currentStep: currentStep.step,
         progress: currentStep.progress
       }));
     }
     progressIndex++;
   } else {
     clearInterval(progressInterval);
   }
 }, 3000); // Update every 3 seconds

 // Scout uses Sonnet, Cipher uses Opus
 // Higher tokens for Cipher (deep investigations), lower for Scout (quick screenings)
 const analysisModel = investigationMode === 'scout' ? 'claude-sonnet-4-20250514' : 'claude-opus-4-20250514';
 const maxTokens = investigationMode === 'scout' ? 8000 : 16000;

 // Create abort controller for timeout and cancellation
 const controller = new AbortController();
 analysisAbortRef.current = controller; // Store for cancel button
 const timeoutMs = investigationMode === 'scout' ? 180000 : 300000;
 const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

 const response = await fetch(`${API_BASE}/api/messages`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 signal: controller.signal,
 body: JSON.stringify({
 model: analysisModel,
 max_tokens: maxTokens,
 messages: [
 { role: "user", content: `${systemPrompt}\n\n${userPrompt}` }
 ]
 })
 });

 clearTimeout(timeoutId);

 // Clear the progress interval once API call completes
 clearInterval(progressInterval);

 if (!response.ok) {
 const errorText = await response.text();

 // Check for rate limit error
 if (response.status === 429) {
 throw new Error(`Rate limit exceeded. Please wait a moment and try again. The analysis uses many tokens - try uploading fewer documents or smaller files.`);
 }

 throw new Error(`API error: ${response.status} - ${errorText}`);
 }

 const data = await response.json();
 const text = data.content?.map(item => item.text || "").join("\n") || "";

 // Update progress - processing response
 setBackgroundAnalysis(prev => ({
   ...prev,
   currentStep: 'Processing results...',
   stepNumber: 2,
   progress: 66
 }));

 // Extract JSON from response - handle markdown code blocks
 let jsonStr = text;

 // Remove markdown code blocks if present
 const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
 if (codeBlockMatch) {
 jsonStr = codeBlockMatch[1].trim();
 } else {
 // Try to find raw JSON object
 const jsonMatch = text.match(/\{[\s\S]*\}/);
 if (jsonMatch) {
 jsonStr = jsonMatch[0];
 }
 }

 if (jsonStr && jsonStr.startsWith('{')) {
 // Clean common JSON syntax errors before parsing
 try {
 // Remove comments (shouldn't be in JSON but sometimes appear)
 jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');
 jsonStr = jsonStr.replace(/\/\/.*/g, '');

 // Remove trailing commas in objects and arrays (common LLM error)
 // This handles cases like: {"key": "value",} and ["item1", "item2",]
 jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

 // Fix multiple consecutive commas
 jsonStr = jsonStr.replace(/,(\s*,)+/g, ',');

 // Remove commas before closing brackets that might have been missed
 jsonStr = jsonStr.replace(/,(\s*[\]}])/g, '$1');

 const parsed = JSON.parse(jsonStr);

 // Enrich entities with REAL sanctions screening data
 try {
 if (parsed.entities && parsed.entities.length > 0) {
 const enrichedEntities = await Promise.all(parsed.entities.map(async (entity) => {
 try {
 // Screen entity against real sanctions database
 const sanctionsResponse = await fetch(`${API_BASE}/api/screen-sanctions`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 name: entity.name,
 type: entity.type === 'PERSON' ? 'INDIVIDUAL' : 'ENTITY'
 })
 });

 const sanctionsData = await sanctionsResponse.json();

 // Update entity with real sanctions status
 entity.sanctionStatus = sanctionsData.status;

 // Get ownership network for this entity (bidirectional)
 const networkResponse = await fetch(`${API_BASE}/api/ownership-network`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 name: entity.name,
 type: entity.type === 'PERSON' ? 'INDIVIDUAL' : 'ENTITY'
 })
 });
 const ownershipNetwork = await networkResponse.json();

 // For PERSON entities, add owned companies
 if (entity.type === 'PERSON' && ownershipNetwork.ownedCompanies) {
 entity.ownedCompanies = ownershipNetwork.ownedCompanies;
 }

 // For ORGANIZATION entities, add corporate network
 if (entity.type === 'ORGANIZATION' && ownershipNetwork.corporateStructure) {
 entity.corporateNetwork = ownershipNetwork.corporateStructure;
 }

 // If it's an organization, get real ownership analysis
 if (entity.type === 'ORGANIZATION') {
 const ownershipResponse = await fetch(`${API_BASE}/api/analyze-ownership`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ entityName: entity.name })
 });

 const ownershipData = await ownershipResponse.json();

 // Add real beneficial owners
 if (ownershipData.beneficialOwners && ownershipData.beneficialOwners.length > 0) {
 entity.beneficialOwners = ownershipData.beneficialOwners.map(owner => ({
 name: owner.name,
 percent: owner.ownershipPercent,
 sanctionStatus: owner.sanctionStatus
 }));
 }

 // Add OFAC 50% rule info to risk indicators
 if (ownershipData.fiftyPercentRuleTriggered) {
 entity.riskIndicators = entity.riskIndicators || [];
 entity.riskIndicators.unshift(`BLOCKED under OFAC 50% Rule: ${ownershipData.aggregateBlockedOwnership}% owned by sanctioned persons`);
 entity.riskLevel = 'CRITICAL';
 } else if (ownershipData.aggregateBlockedOwnership > 0) {
 entity.riskIndicators = entity.riskIndicators || [];
 entity.riskIndicators.unshift(`${ownershipData.aggregateBlockedOwnership}% aggregate ownership by sanctioned persons`);
 }
 }

 // Add sanctions match details to risk indicators
 if (sanctionsData.status === 'MATCH' && sanctionsData.match) {
 entity.riskIndicators = entity.riskIndicators || [];
 entity.riskIndicators.unshift(`SANCTIONED: ${sanctionsData.match.lists.join(', ')} - Listed ${sanctionsData.match.listingDate}`);
 entity.riskLevel = 'CRITICAL';
 } else if (sanctionsData.status === 'POTENTIAL_MATCH') {
 entity.riskIndicators = entity.riskIndicators || [];
 entity.riskIndicators.unshift(`Potential sanctions match - requires further review`);
 }

 return entity;
 } catch (screenError) {
 console.error(`Error screening entity ${entity.name}:`, screenError);
 return entity; // Return original entity if screening fails
 }
 }));

 parsed.entities = enrichedEntities;
 }
 } catch (enrichError) {
 console.error('Entity enrichment error:', enrichError);
 // Continue with original entities if enrichment fails
 }

 // AUTO-INVESTIGATION: Generate automated investigative findings
 try {
 const automatedFindings = [];

 // For each sanctioned or high-risk entity, automatically investigate their network
 if (parsed.entities) {
 for (const entity of parsed.entities) {
 // If entity is sanctioned or high risk, add automated investigation findings
 if (entity.sanctionStatus === 'MATCH' || entity.riskLevel === 'CRITICAL' || entity.riskLevel === 'HIGH') {

 // For individuals: Map their complete ownership portfolio
 if (entity.type === 'PERSON' && entity.ownedCompanies && entity.ownedCompanies.length > 0) {
 automatedFindings.push({
 entityId: entity.id,
 entityName: entity.name,
 findingType: 'OWNERSHIP_MAPPING',
 title: `Complete Ownership Portfolio Mapped for ${entity.name}`,
 description: `Automated investigation identified ${entity.ownedCompanies.length} entities in ownership portfolio. ${entity.ownedCompanies.filter(c => c.ownershipPercent >= 50).length} entities with controlling interest (≥50%).`,
 data: {
 totalEntities: entity.ownedCompanies.length,
 controllingInterest: entity.ownedCompanies.filter(c => c.ownershipPercent >= 50).length,
 significantInterest: entity.ownedCompanies.filter(c => c.ownershipPercent >= 25 && c.ownershipPercent < 50).length,
 companies: entity.ownedCompanies.map(c => ({
 name: c.company,
 ownership: c.ownershipPercent,
 type: c.ownershipType
 }))
 }
 });
 }

 // For organizations: Map beneficial ownership structure
 if (entity.type === 'ORGANIZATION' && entity.beneficialOwners && entity.beneficialOwners.length > 0) {
 const sanctionedOwners = entity.beneficialOwners.filter(o => o.sanctionStatus === 'SANCTIONED');

 if (sanctionedOwners.length > 0) {
 const totalSanctionedOwnership = sanctionedOwners.reduce((sum, o) => sum + (o.percent || 0), 0);

 automatedFindings.push({
 entityId: entity.id,
 entityName: entity.name,
 findingType: 'SANCTIONED_OWNERSHIP',
 title: `Sanctioned Beneficial Ownership Detected in ${entity.name}`,
 description: `${sanctionedOwners.length} sanctioned individual(s) identified in beneficial ownership structure. Total sanctioned ownership: ${totalSanctionedOwnership.toFixed(1)}%.`,
 data: {
 aggregateOwnership: totalSanctionedOwnership.toFixed(1),
 sanctionedOwners: sanctionedOwners.map(o => ({
 name: o.name,
 ownership: o.percent,
 lists: o.sanctionDetails?.lists || (o.sanctionDetails ? [o.sanctionDetails] : ['Sanctioned']),
 details: o.sanctionDetails
 })),
 ofacRuleTriggered: totalSanctionedOwnership >= 50
 }
 });
 }
 }

 // For organizations: Map corporate network via common ownership
 if (entity.type === 'ORGANIZATION' && entity.corporateNetwork && entity.corporateNetwork.length > 0) {
 const highRiskRelated = entity.corporateNetwork.filter(r => r.sanctionExposure === 'DIRECT');

 automatedFindings.push({
 entityId: entity.id,
 entityName: entity.name,
 findingType: 'CORPORATE_NETWORK',
 title: `Corporate Network Mapped for ${entity.name}`,
 description: `Identified ${entity.corporateNetwork.length} related ${entity.corporateNetwork.length === 1 ? 'entity' : 'entities'} via common ownership. ${highRiskRelated.length > 0 ? `${highRiskRelated.length} with direct sanctions exposure.` : 'No direct sanctions exposure identified.'}`,
 data: {
 totalRelated: entity.corporateNetwork.length,
 directExposure: highRiskRelated.length,
 relatedEntities: entity.corporateNetwork.map(r => ({
 name: r.entity || r.name,
 relationship: r.relationship || 'RELATED',
 commonOwner: r.commonOwner,
 sanctionExposure: r.sanctionExposure || r.exposure || 'NONE'
 }))
 }
 });
 }
 }
 }
 }

 // Add automated findings to the analysis
 if (automatedFindings.length > 0) {
 parsed.automatedInvestigations = automatedFindings;

 // Enhance next steps with specific automated investigation results
 parsed.nextSteps = parsed.nextSteps || [];

 // Generate detailed investigative next steps based on automated findings
 const enhancedSteps = [];

 for (const finding of automatedFindings) {
 if (finding.findingType === 'OWNERSHIP_MAPPING') {
 // Generate detailed steps for each owned entity
 enhancedSteps.push({
 priority: 'CRITICAL',
 action: `Request complete corporate registry filings, articles of incorporation, and beneficial ownership documentation for all ${finding.data.totalEntities} entities in ${finding.entityName}'s portfolio: ${finding.data.companies.map(c => c.name).join(', ')}`,
 rationale: `Automated screening identified ${finding.data.controllingInterest} entities with controlling interest (≥50%) and ${finding.data.significantInterest} with significant interest (25-49%). Corporate documentation will reveal nominee arrangements, shell company indicators, beneficial ownership chains, and timing of ownership transfers relative to sanctions events.`,
 expectedOutcome: `Complete corporate structure mapped with formation dates, registered agents, shareholder registries, and board composition. Identifies potential asset concealment mechanisms and sanctions evasion structures.`
 });

 if (finding.data.controllingInterest > 0) {
 enhancedSteps.push({
 priority: 'HIGH',
 action: `Collect banking records, financial statements, and transaction data for all entities where ${finding.entityName} holds controlling interest: ${finding.data.companies.filter(c => c.ownership >= 50).map(c => c.name).join(', ')}`,
 rationale: `Controlling ownership (≥50%) suggests operational control and decision-making authority. Banking records will reveal fund flows between entities, suspicious transaction patterns, SWIFT message trails, correspondent banking relationships, and whether institutions have filed SARs/STRs.`,
 expectedOutcome: `Transaction patterns mapped, counterparties identified, fund flow diagrams created. Reveals layering schemes, trade-based money laundering indicators, and connections to high-risk jurisdictions or entities.`
 });
 }

 enhancedSteps.push({
 priority: 'HIGH',
 action: `Analyze timing of all ownership transfers, corporate restructuring, or asset movements involving ${finding.entityName}'s portfolio entities relative to sanctions designation dates and geopolitical events`,
 rationale: `Temporal patterns often reveal reactive measures to avoid sanctions. Need to determine if assets were transferred to nominees, restructured through additional layers, or moved to non-sanctioned jurisdictions following designation announcements.`,
 expectedOutcome: `Timeline of ownership changes mapped against sanctions events. Identifies pre-emptive asset protection, post-designation evasion attempts, or suspicious timing that suggests foreknowledge of sanctions action.`
 });
 }

 if (finding.findingType === 'SANCTIONED_OWNERSHIP') {
 const totalSanctionedOwnership = finding.data.sanctionedOwners.reduce((sum, o) => sum + (o.ownership || 0), 0);

 enhancedSteps.push({
 priority: 'CRITICAL',
 action: `Obtain current sanctions designation documentation from OFAC, EU, UK OFSI, UN, and other relevant jurisdictions for all beneficial owners: ${finding.data.sanctionedOwners.map(o => o.name).join(', ')}`,
 rationale: `${finding.data.ofacRuleTriggered ? `OFAC 50% Rule is triggered - ${finding.entityName} is itself blocked due to ${totalSanctionedOwnership.toFixed(1)}% aggregate ownership by sanctioned persons.` : `Sanctioned beneficial ownership of ${totalSanctionedOwnership.toFixed(1)}% creates significant sanctions risk and reputational exposure.`} Need complete designation details, asset freeze provisions, licensing procedures, and enforcement actions.`,
 expectedOutcome: `Legal framework established for ${finding.entityName}. Determines whether entity is prohibited, requires OFAC license, or falls under general license provisions. Identifies enforcement risk and compliance obligations.`
 });

 enhancedSteps.push({
 priority: 'CRITICAL',
 action: `Request historical beneficial ownership records, shareholder registries, and corporate governance documents for ${finding.entityName} covering period from 2 years before to present date`,
 rationale: `Beneficial ownership structures may have changed to evade sanctions. Historical records reveal whether sanctioned individuals divested holdings post-designation, transferred shares to nominees or family members, or obscured ownership through additional corporate layers. Critical for understanding evasion schemes.`,
 expectedOutcome: `Ownership timeline mapped showing changes in beneficial ownership structure. Identifies potential nominee arrangements, divestment timing relative to sanctions events, and shell company indicators.`
 });

 enhancedSteps.push({
 priority: 'HIGH',
 action: `Map complete family networks, known associates, and potential nominees for all sanctioned beneficial owners; cross-reference against asset ownership records and corporate directorships`,
 rationale: `Sanctioned individuals commonly use family members, close associates, and professional nominees to maintain control while obscuring beneficial ownership. Need to identify potential strawmen and verify whether ownership transfers represent genuine divestment or continued control.`,
 expectedOutcome: `Network diagram showing relationships between sanctioned individuals and potential nominees. Identifies shell company patterns, nominee director arrangements, and beneficial ownership chains designed to evade sanctions.`
 });
 }

 if (finding.findingType === 'CORPORATE_NETWORK') {
 enhancedSteps.push({
 priority: 'HIGH',
 action: `Request corporate registry filings, financial statements, and transactional data for all related entities in corporate network: ${finding.data.relatedEntities.map(r => r.entity).join(', ')}`,
 rationale: `Corporate network of ${finding.data.totalRelated} related entities via common ownership suggests integrated business operations. ${finding.data.directExposure > 0 ? `${finding.data.directExposure} entities have direct sanctions exposure requiring immediate investigation.` : ''} Inter-company transactions, shared infrastructure, and operational integration may indicate evasion structures.`,
 expectedOutcome: `Complete subsidiary map with ownership percentages, operational relationships, shared management, common bank accounts, and inter-company transaction flows. Reveals consolidated enterprise structure and control mechanisms.`
 });

 if (finding.data.directExposure > 0) {
 enhancedSteps.push({
 priority: 'CRITICAL',
 action: `Analyze all inter-company transactions, fund transfers, and commercial relationships between ${finding.entityName} and entities with direct sanctions exposure`,
 rationale: `Direct sanctions exposure in related entities creates compliance risk for the entire corporate network. Need to determine if sanctioned entities are providing financing, conducting transactions as intermediaries, or facilitating sanctions evasion through the corporate structure.`,
 expectedOutcome: `Transaction flows mapped showing fund movements between entities. Identifies potential sanctions violations, prohibited transactions, and whether non-sanctioned entities are serving as conduits for sanctioned parties.`
 });
 }
 }
 }

 // Filter out any AI-generated steps that Marlowe has already done automatically
 const filteredAISteps = (parsed.nextSteps || []).filter(step => {
 const action = step.action.toLowerCase();
 // Remove steps about screening databases, checking sanctions lists, or verifying status
 // These are all done automatically by Marlowe
 return !(
 action.includes('sanctions database') ||
 (action.includes('screen') && (action.includes('sanctions') || action.includes('database'))) ||
 action.includes('verify sanctions') ||
 action.includes('check sanctions') ||
 action.includes('monitor sanctions') ||
 action.includes('ofac screening') ||
 action.includes('sanctions list') ||
 (action.includes('verify current') && action.includes('status'))
 );
 });

 // Add enhanced steps to beginning of filtered next steps array
 parsed.nextSteps = [...enhancedSteps, ...filteredAISteps];
 }
 } catch (autoInvestError) {
 console.error('Automated investigation error:', autoInvestError);
 // Continue even if automated investigation fails
 }

 // Update progress: Building timeline
 setBackgroundAnalysis(prev => ({
   ...prev,
   currentStep: 'Building timeline...',
   stepNumber: 2,
   progress: 50
 }));

 await new Promise(resolve => setTimeout(resolve, 200));

 // Update progress: Generating hypotheses
 setBackgroundAnalysis(prev => ({
   ...prev,
   currentStep: 'Generating hypotheses...',
   stepNumber: 3,
   progress: 70
 }));

 await new Promise(resolve => setTimeout(resolve, 200));

 // Auto-generate case name: use extracted entity name + risk level + date
 const riskLevel = parsed.executiveSummary?.riskLevel || 'UNKNOWN';
 const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
 let finalCaseName = `${displayCaseName} - ${riskLevel} - ${dateStr}`;
 setCaseName(finalCaseName);

 // Update progress: Finalizing
 setBackgroundAnalysis(prev => ({
   ...prev,
   caseName: finalCaseName,
   currentStep: 'Finalizing analysis...',
   stepNumber: 4,
   progress: 90
 }));

 await new Promise(resolve => setTimeout(resolve, 300));

 // Complete - show "Results ready" and store pending analysis
 setBackgroundAnalysis(prev => ({
   ...prev,
   isRunning: false,
   isComplete: true,
   progress: 100,
   currentStep: 'Analysis complete',
   pendingAnalysis: parsed
 }));

 // Save the case but don't navigate yet - user will click to view
 saveCase(parsed, finalCaseName);
 } catch (parseError) {
 console.error('JSON parse error:', parseError);
 console.error('First 1000 chars of JSON:', jsonStr.substring(0, 1000));
 console.error('Last 500 chars of JSON:', jsonStr.substring(Math.max(0, jsonStr.length - 500)));

 // Try to identify the problematic location
 const errorMatch = parseError.message.match(/position (\d+)/);
 if (errorMatch) {
 const position = parseInt(errorMatch[1]);
 const contextStart = Math.max(0, position - 100);
 const contextEnd = Math.min(jsonStr.length, position + 100);
 console.error('Context around error position:', jsonStr.substring(contextStart, contextEnd));
 }

 setAnalysisError(`Error parsing analysis results. ${parseError.message}. Please try again or simplify your investigation scope.`);
 
 }
 } else {
 console.error('No JSON found in response:', text.substring(0, 500));
 setAnalysisError('No structured results returned. The AI did not return valid JSON.');
 
 }
 } catch (error) {
 console.error('Analysis error:', error);

 // Handle timeout/abort errors specifically
 if (error.name === 'AbortError') {
   setAnalysisError('Analysis timed out. Complex documents may take longer - try uploading fewer files or smaller documents.');
 } else {
   setAnalysisError(`Error connecting to analysis service: ${error.message}`);
 }

 } finally {
if (progressInterval) clearInterval(progressInterval);
setIsAnalyzing(false);
}
};

 // Risk level color utilities
 const getRiskColor = (level) => {
 switch (level?.toUpperCase()) {
 case 'CRITICAL': return 'bg-red-500 text-white';
 case 'HIGH': return 'bg-orange-500 text-white';
 case 'MEDIUM': return 'bg-amber-500 text-gray-900';
 case 'LOW': return 'bg-emerald-500 text-white';
 default: return 'bg-gray-500 text-white';
 }
 };

 const getRiskBorder = (level) => {
 switch (level?.toUpperCase()) {
 case 'CRITICAL': return 'border-l-4 border-red-500';
 case 'HIGH': return 'border-l-4 border-orange-500';
 case 'MEDIUM': return 'border-l-4 border-amber-500';
 case 'LOW': return 'border-l-4 border-emerald-500';
 default: return 'border-l-4 border-gray-400';
 }
 };

 // eslint-disable-next-line no-unused-vars
const getRiskBg = (level) => {
 switch (level?.toUpperCase()) {
 case 'CRITICAL': return 'bg-red-50';
 case 'HIGH': return 'bg-orange-50';
 case 'MEDIUM': return 'bg-amber-50';
 case 'LOW': return 'bg-emerald-50';
 default: return 'bg-gray-50';
 }
 };

// eslint-disable-next-line no-unused-vars
 const getRiskDot = (level) => {
 switch (level?.toUpperCase()) {
 case 'CRITICAL': return 'bg-red-500 ring-red-200';
 case 'HIGH': return 'bg-orange-500 ring-orange-200';
 case 'MEDIUM': return 'bg-amber-500 ring-amber-200';
 case 'LOW': return 'bg-emerald-500 ring-emerald-200';
 default: return 'bg-gray-400 ring-gray-200';
 }
 };

 // Section accent colors
 const sectionColors = {
 summary: { border: 'border-l-4 border-blue-500', bg: 'bg-blue-50', icon: 'text-blue-500', header: 'text-blue-700' },
 redFlags: { border: 'border-l-4 border-red-500', bg: 'bg-red-50', icon: 'text-red-500', header: 'text-red-700' },
 entities: { border: 'border-l-4 border-purple-500', bg: 'bg-purple-50', icon: 'text-purple-500', header: 'text-purple-700' },
 timeline: { border: 'border-l-4 border-cyan-500', bg: 'bg-cyan-50', icon: 'text-cyan-500', header: 'text-cyan-700' },
 hypotheses: { border: 'border-l-4 border-amber-500', bg: 'bg-amber-50', icon: 'text-amber-500', header: 'text-amber-700' },
 documents: { border: 'border-l-4 border-emerald-500', bg: 'bg-emerald-50', icon: 'text-emerald-500', header: 'text-emerald-700' },
 crossRefs: { border: 'border-l-4 border-pink-500', bg: 'bg-pink-50', icon: 'text-pink-500', header: 'text-pink-700' },
 contradictions: { border: 'border-l-4 border-orange-500', bg: 'bg-orange-50', icon: 'text-orange-500', header: 'text-orange-700' },
 typologies: { border: 'border-l-4 border-indigo-500', bg: 'bg-indigo-50', icon: 'text-indigo-500', header: 'text-indigo-700' }
 };

 // Confidence bar color
 const getConfidenceColor = (confidence) => {
 const pct = confidence * 100;
 if (pct <= 25) return 'bg-red-500';
 if (pct <= 50) return 'bg-orange-500';
 if (pct <= 75) return 'bg-amber-500';
 return 'bg-emerald-500';
 };

 // Scroll chat to bottom when new messages arrive
 useEffect(() => {
 if (chatEndRef.current) {
 chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
 }
 }, [chatMessages]);

 // Chat with Marlowe about the case
 const sendChatMessage = async () => {
 if (!chatInput.trim() || isChatLoading) return;

 const userMessage = chatInput.trim();
 setChatInput('');
 setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
 setIsChatLoading(true);

 // Build context from evidence and analysis
 const evidenceContext = files.map((f, idx) => 
 `[DOCUMENT ${idx + 1}: "${f.name}"]\n${f.content}\n[END DOCUMENT ${idx + 1}]`
 ).join('\n\n');

 const analysisContext = analysis ? JSON.stringify(analysis, null, 2) : 'No analysis available yet.';

 const conversationHistory = chatMessages.map(msg => ({
 role: msg.role,
 content: msg.content
 }));

 const systemPrompt = `You are Marlowe, an expert AI investigative analyst. You have analyzed a case and are now answering follow-up questions from the investigator.

You have access to:
1. The original evidence documents
2. Your previous analysis of the case

CITATION REQUIREMENTS (MANDATORY):
CRITICAL: You must cite every factual claim.

Format: [Doc 1], [Doc 2], etc. based on document upload order.

Rules:
1. EVERY factual claim must include a citation in [Doc X] format
2. If quoting directly, use: "quoted text" [Doc 1]
3. If paraphrasing, cite at end of sentence [Doc 1]
4. If a claim spans multiple documents: [Doc 1, Doc 3]
5. If something is an inference (not directly stated), say: "This suggests..." or "This implies..." (no citation needed)
6. If no document supports a claim, don't make the claim

Examples:
- "The CFO stated they 'don't get too hung up on form' regarding third-party payments [Doc 1]."
- "Wire transfers totaling $14.7M were sent to Horizon Pacific [Doc 2, Doc 3]."

DO NOT make claims without citations. If you cannot cite it, do not say it.

Be concise but thorough. If you don't know something or it's not in the evidence, say so.
Think like a seasoned investigator - look for connections, inconsistencies, and implications.

EVIDENCE DOCUMENTS:
${evidenceContext}

YOUR PREVIOUS ANALYSIS:
${analysisContext}`;

 try {
 const response = await fetch(`${API_BASE}/api/messages`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "claude-sonnet-4-20250514",
 max_tokens: 2000,
 messages: [
 ...conversationHistory,
 { role: "user", content: `${systemPrompt}\n\nUser question: ${userMessage}` }
 ]
 })
 });

 if (!response.ok) {
 throw new Error(`API error: ${response.status}`);
 }

 const data = await response.json();
 const assistantMessage = data.content?.map(item => item.text || "").join("\n") || "I couldn't process that request.";
 
 setChatMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
 } catch (error) {
 console.error('Chat error:', error);
 setChatMessages(prev => [...prev, { 
 role: 'assistant', 
 content: "I encountered an error processing your question. Please try again." 
 }]);
 } finally {
 setIsChatLoading(false);
 }
 };

 const handleChatKeyPress = (e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 sendChatMessage();
 }
 };

 // Show loading state while checking auth
 if (isConfigured && authLoading) {
   return (
     <div className="min-h-screen bg-gray-900 flex items-center justify-center">
       <div className="text-center">
         <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-4 animate-pulse">
           <span className="text-3xl font-bold text-white">M</span>
         </div>
         <p className="text-gray-400">Loading...</p>
       </div>
     </div>
   );
 }

 return (
 <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900 text-gray-100" : "text-gray-900"}`} style={{ fontFamily: "'Inter', -apple-system, sans-serif", backgroundColor: darkMode ? undefined : '#f8f8f8' }}>

 {/* Email Gate Modal - Shows when user clicks Enter without email */}
 {showEmailModal && (
   <AuthPage onSuccess={handleEmailSubmitted} />
 )}
 {/* Import fonts */}
 <style>{`
 @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
 
 .mono {  font-family: 'JetBrains Mono', monospace; }
 
 .grid-bg {
 background-image: 
 radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.08) 1px, transparent 1px);
 background-size: 24px 24px;
 }
 
 .glow-cyan {
 box-shadow: 0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.2);
 }

 .glow-amber {
 box-shadow: 0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(245, 158, 11, 0.15);
 }

 .glow-red {
 box-shadow: 0 0 20px rgba(244, 63, 94, 0.4), 0 0 40px rgba(244, 63, 94, 0.2);
 }
 
 .glass-card {
 background: rgba(15, 23, 42, 0.7);
 backdrop-filter: blur(20px) saturate(180%);
 border: 1px solid rgba(6, 182, 212, 0.2);
 }
 
 .glass-strong {
 background: rgba(255, 255, 255, 0.95);
 backdrop-filter: blur(24px) saturate(200%);
 border: 1px solid rgba(6, 182, 212, 0.2);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
 }
 
 .gradient-border {
 position: relative;
 background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1));
 border: 1px solid transparent;
 }
 
 .gradient-border::before {
 content: '';
 position: absolute;
 inset: 0;
 border-radius: inherit;
 padding: 1px;
 background: linear-gradient(135deg, rgba(6, 182, 212, 0.5), rgba(59, 130, 246, 0.5));
 -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
 -webkit-mask-composite: xor;
 mask-composite: exclude;
 pointer-events: none;
 }
 
 .scan-line {
 background: linear-gradient(
 transparent 0%,
 rgba(6, 182, 212, 0.05) 50%,
 transparent 100%
 );
 animation: scan 8s ease-in-out infinite;
 }
 
 @keyframes scan {
 0%, 100% { transform: translateY(-100%); opacity: 0; }
 50% { transform: translateY(100%); opacity: 1; }
 }
 
 .pulse-ring {
 animation: pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
 }
 
 @keyframes pulse-ring {
 0%, 100% { transform: scale(1); opacity: 0.5; }
 50% { transform: scale(1.05); opacity: 0.3; }
 }
 
 .fade-in {
 animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
 }
 
 @keyframes fadeIn {
 from { opacity: 0; transform: translateY(24px); }
 to { opacity: 1; transform: translateY(0); }
 }
 
 .slide-in {
 animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
 }
 
 @keyframes slideIn {
 from { opacity: 0; transform: translateX(-24px); }
 to { opacity: 1; transform: translateX(0); }
 }
 
 .confidence-bar {
 background: linear-gradient(90deg, 
 #10b981 0%, 
 #3b82f6 33%,
 #f59e0b 66%, 
 #ef4444 100%
 );
 }
 
 .shimmer {
 position: relative;
 overflow: hidden;
 }
 
 .shimmer::before {
 content: '';
 position: absolute;
 inset: 0;
 background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent);
 animation: shimmer 2.5s infinite;
 }
 
 @keyframes shimmer {
 0% { transform: translateX(-100%); }
 100% { transform: translateX(100%); }
 }
 
 .animate-fadeInOut {
            animation: fadeInOut 7s ease-in-out forwards;
 }

 @keyframes fadeInOut {
 0% { opacity: 0; }
 10% { opacity: 1; }
 90% { opacity: 1; }
 100% { opacity: 0; }
 }

 @keyframes slideUp {
 0% { opacity: 0; transform: translateY(20px); }
 100% { opacity: 1; transform: translateY(0); }
 }

 .animate-slideUp {
 animation: slideUp 0.3s ease-out forwards;
 }
 `}</style>

 {/* Modern background effects */}
 <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
 <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
 <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
 <div className="grid-bg absolute inset-0 opacity-60" />
 </div>


 <main className="max-w-full mx-auto p-6 relative z-10 min-h-screen bg-[#f8f8f8]">


 {/* Scout Page */}
 {currentPage === 'kycScreening' && (
 <div className="fade-in max-w-6xl mx-auto pt-16 px-36">
 
 {/* KYC Landing - Choose Action */}
 {kycPage === 'landing' && (
 <div>
 <div className="mb-8 text-center">
 <h2 className="text-2xl font-bold tracking-tight leading-tight mb-2">Scout</h2>
 <p className="text-base text-gray-600 leading-relaxed">Sanctions, PEP, and adverse media screening</p>
 </div>

 <div className="grid md:grid-cols-3 gap-4">
 {/* New Search */}
 <button
 onClick={() => setKycPage('newSearch')}
 className="group bg-white border-2 border-gray-300 hover:border-emerald-500 rounded-xl p-8 text-left transition-all"
 >
 <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/30">
 <Search className="w-6 h-6 text-emerald-500" />
 </div>
 <h3 className="text-lg font-semibold leading-tight mb-2">New Search</h3>
 <p className="text-base text-gray-600 leading-relaxed">Screen an individual or entity against global watchlists</p>
 </button>

 {/* Case History */}
 <button
 onClick={() => setKycPage('history')}
 className="group bg-white border-2 border-gray-300 hover:border-amber-500 rounded-xl p-8 text-left transition-all relative"
 >
 <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-500/30">
 <History className="w-6 h-6 text-amber-500" />
 </div>
 <h3 className="text-lg font-semibold leading-tight mb-2">Case History</h3>
 <p className="text-base text-gray-600 leading-relaxed">View previous screenings and download reports</p>
 {kycHistory.length > 0 && (
 <span className="absolute top-4 right-4 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold tracking-wide text-gray-900">
 {kycHistory.length}
 </span>
 )}
 </button>

 {/* Projects */}
 <button
 onClick={() => setKycPage('projects')}
 className="group bg-white border-2 border-gray-300 hover:border-purple-500 rounded-xl p-8 text-left transition-all relative"
 >
 <div className="w-12 h-12 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/30">
 <FolderPlus className="w-6 h-6 text-purple-500" />
 </div>
 <h3 className="text-lg font-semibold leading-tight mb-2">Projects</h3>
 <p className="text-base text-gray-600 leading-relaxed">Organize screenings by client, deal, or review</p>
 {kycProjects.length > 0 && (
 <span className="absolute top-4 right-4 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold tracking-wide text-gray-900">
 {kycProjects.length}
 </span>
 )}
 </button>
 </div>

 {/* Quick Stats */}
 <div className="mt-8 grid grid-cols-3 gap-4">
 <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
 <p className="text-2xl font-bold tracking-tight leading-tight">{kycHistory.length}</p>
 <p className="text-xs font-medium text-gray-500 mono uppercase tracking-wider">Total Screenings</p>
 </div>
 <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
 <p className="text-2xl font-bold tracking-tight text-rose-4 leading-tight00">
 {kycHistory.filter(h => h.result.overallRisk === 'HIGH' || h.result.overallRisk === 'CRITICAL').length}
 </p>
 <p className="text-xs font-medium text-gray-500 mono uppercase tracking-wider">High Risk Hits</p>
 </div>
 <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
 <p className="text-2xl font-bold tracking-tight leading-tight">{kycProjects.length}</p>
 <p className="text-xs text-gray-500 tracking-wide mono">Active Projects</p>
 </div>
 </div>
 </div>
 )}

 {/* KYC History Page */}
 {kycPage === 'history' && (
 <div>
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <button onClick={() => setKycPage('landing')} className="p-2 hover:bg-gray-100 rounded-lg">
 <ArrowLeft className="w-5 h-5 text-gray-600" />
 </button>
 <div>
 <h2 className="text-2xl font-bold tracking-tight leading-tight">Case History</h2>
 <p className="text-sm text-gray-600 leading-relaxed">{kycHistory.length} screening{kycHistory.length !== 1 ? 's' : ''} on record</p>
 </div>
 </div>
 <button
 onClick={() => setKycPage('newSearch')}
 className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold tracking-wide px-4 py-2 rounded-xl"
 >
 <Plus className="w-4 h-4" />
 New Search
 </button>
 </div>

 {kycHistory.length === 0 ? (
 <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
 <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <h3 className="text-lg font-semibold leading-tight mb-2">No Screenings Yet</h3>
 <p className="text-base text-gray-600 leading-relaxed mb-4">Run your first KYC screening to see results here</p>
 <button
 onClick={() => setKycPage('newSearch')}
 className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold tracking-wide px-4 py-2 rounded-xl"
 >
 <Search className="w-4 h-4" />
 Start Screening
 </button>
 </div>
 ) : (
 <div className="space-y-3">
 {kycHistory.map((item) => (
 <div
 key={item.id}
 className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-8 transition-all"
 >
 <div className="flex items-center gap-4">
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
 item.result.overallRisk === 'LOW' || item.result.overallRisk === 'CLEAR' ? 'bg-emerald-50 border border-emerald-200' :
 item.result.overallRisk === 'MEDIUM' ? 'bg-amber-50 border border-amber-200' :
 'bg-rose-50 border border-rose-200'
 }`}>
 {item.type === 'individual' ? (
 <UserSearch className={`w-6 h-6 ${
 item.result.overallRisk === 'LOW' || item.result.overallRisk === 'CLEAR' ? 'text-emerald-500' :
 item.result.overallRisk === 'MEDIUM' ? 'text-amber-500' :
 'text-rose-500'
 }`} />
 ) : (
 <Building2 className={`w-6 h-6 ${
 item.result.overallRisk === 'LOW' || item.result.overallRisk === 'CLEAR' ? 'text-emerald-500' :
 item.result.overallRisk === 'MEDIUM' ? 'text-amber-500' :
 'text-rose-500'
 }`} />
 )}
 </div>
 
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <p className="font-semibold tracking-wide truncate">{item.query}</p>
 <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide shrink-0 ${getRiskColor(item.result.overallRisk)}`}>
 {item.result.overallRisk}
 </span>
 </div>
 <div className="flex items-center gap-3 text-xs text-gray-500">
 <span className="mono tracking-wide">{new Date(item.timestamp).toLocaleString()}</span>
 {item.clientRef && <span>Ref: {item.clientRef}</span>}
 {item.country && <span>{item.country}</span>}
 {/* Show which projects this is in */}
 {kycProjects.filter(p => p.screenings.includes(item.id)).map(p => (
 <span key={p.id} className="px-1.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-600 rounded">
 {p.name}
 </span>
 ))}
 </div>
 </div>

 <div className="flex items-center gap-2">
 {/* Assign to Project */}
 <div className="relative">
 <button
 onClick={() => setAssigningToProject(assigningToProject === item.id ? null : item.id)}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 title="Add to Project"
 >
 <Tag className="w-4 h-4 text-gray-500" />
 </button>
 {assigningToProject === item.id && (
 <div className="absolute right-0 top-full mt-2 w-48 bg-gray-100 border border-gray-300 rounded-lg shadow-xl z-10 p-2">
 <p className="text-xs text-gray-500 px-2 mb-2">Add to project:</p>
 {kycProjects.length === 0 ? (
 <p className="text-xs text-gray-600 px-2">No projects yet</p>
 ) : (
 kycProjects.map(p => (
 <button
 key={p.id}
 onClick={() => addToProject(item.id, p.id)}
 className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${
 p.screenings.includes(item.id) ? 'text-purple-600' : 'text-gray-700'
 }`}
 >
 {p.name} {p.screenings.includes(item.id) && '✓'}
 </button>
 ))
 )}
 </div>
 )}
 </div>
 
 {/* Download PDF */}
 <button
 onClick={() => generatePdfReport(item)}
 disabled={isGeneratingPdf}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 title="Download Report"
 >
 <Download className="w-4 h-4 text-gray-500" />
 </button>
 
 {/* View Details */}
 <button
 onClick={() => viewHistoryItem(item)}
 className="p-2 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors"
 title="View Details"
 >
 <Eye className="w-4 h-4 text-emerald-500" />
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* KYC Projects Page */}
 {kycPage === 'projects' && !selectedProject && (
 <div>
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <button onClick={() => setKycPage('landing')} className="p-2 hover:bg-gray-100 rounded-lg">
 <ArrowLeft className="w-5 h-5 text-gray-600" />
 </button>
 <div>
 <h2 className="text-2xl font-bold tracking-tight leading-tight">Projects</h2>
 <p className="text-base text-gray-600 leading-relaxed">Organize screenings by client, deal, or review</p>
 </div>
 </div>
 </div>

 {/* Create Project Form */}
 <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6">
 <div className="flex gap-3">
 <input
 type="text"
 value={newProjectName}
 onChange={(e) => setNewProjectName(e.target.value)}
 onKeyPress={(e) => e.key === 'Enter' && createProject()}
 placeholder="New project name (e.g., 'Acme Corp Due Diligence', 'Q1 2024 Client Onboarding')"
 className="flex-1 bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-400"
 />
 <button
 onClick={createProject}
 disabled={!newProjectName.trim()}
 className="bg-purple-500 hover:bg-purple-400 disabled:bg-gray-300 text-white disabled:text-gray-500 font-semibold tracking-wide px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
 >
 <Plus className="w-4 h-4" />
 Create
 </button>
 </div>
 </div>

 {/* Projects List */}
 {kycProjects.length === 0 ? (
 <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
 <FolderPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <h3 className="text-lg font-semibold leading-tight mb-2">No Projects Yet</h3>
 <p className="text-base text-gray-600 leading-relaxed">Create a project to organize related screenings together</p>
 </div>
 ) : (
 <div className="space-y-3">
 {kycProjects.map((project) => (
 <div
 key={project.id}
 className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-8 transition-all cursor-pointer group"
 onClick={() => setSelectedProject(project)}
 >
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-center">
 <Folder className="w-6 h-6 text-purple-500" />
 </div>
 <div className="flex-1">
 <p className="font-semibold">{project.name}</p>
 <p className="text-sm text-gray-500 leading-relaxed">
 {project.screenings.length} screening{project.screenings.length !== 1 ? 's' : ''} • 
 Created {new Date(project.createdAt).toLocaleDateString()}
 </p>
 </div>
 <button
 onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
 className="p-2 hover:bg-rose-50 border border-rose-200 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
 >
 <Trash2 className="w-4 h-4 text-rose-500" />
 </button>
 <ChevronRight className="w-5 h-5 text-gray-400" />
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Single Project View */}
 {kycPage === 'projects' && selectedProject && (
 <div>
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-gray-100 rounded-lg">
 <ArrowLeft className="w-5 h-5 text-gray-600" />
 </button>
 <div>
 <h2 className="text-xl font-bold tracking-tight leading-tight">{selectedProject.name}</h2>
 <p className="text-sm text-gray-600 leading-relaxed">
 {selectedProject.screenings.length} screening{selectedProject.screenings.length !== 1 ? 's' : ''} in project
 </p>
 </div>
 </div>
 <button
 onClick={() => setKycPage('newSearch')}
 className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold tracking-wide px-4 py-2 rounded-xl"
 >
 <Plus className="w-4 h-4" />
 Add Screening
 </button>
 </div>

 {selectedProject.screenings.length === 0 ? (
 <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
 <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <h3 className="text-lg font-semibold leading-tight mb-2">No Screenings in Project</h3>
 <p className="text-base text-gray-600 leading-relaxed mb-4">Add screenings from Case History or run new searches</p>
 </div>
 ) : (
 <div className="space-y-3">
 {selectedProject.screenings.map(screeningId => {
 const item = kycHistory.find(h => h.id === screeningId);
 if (!item) return null;
 return (
 <div
 key={item.id}
 className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-8 transition-all"
 >
 <div className="flex items-center gap-4">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
 item.result.overallRisk === 'LOW' ? 'bg-emerald-50 border border-emerald-200' :
 item.result.overallRisk === 'MEDIUM' ? 'bg-amber-50 border border-amber-200' :
 'bg-rose-50 border border-rose-200'
 }`}>
 {item.type === 'individual' ? (
 <UserSearch className={`w-5 h-5 ${
 item.result.overallRisk === 'LOW' ? 'text-emerald-500' :
 item.result.overallRisk === 'MEDIUM' ? 'text-amber-500' :
 'text-rose-500'
 }`} />
 ) : (
 <Building2 className={`w-5 h-5 ${
 item.result.overallRisk === 'LOW' ? 'text-emerald-500' :
 item.result.overallRisk === 'MEDIUM' ? 'text-amber-500' :
 'text-rose-500'
 }`} />
 )}
 </div>
 <div className="flex-1">
 <p className="font-medium tracking-wide">{item.query}</p>
 <p className="text-xs text-gray-500 mono tracking-wide">{new Date(item.timestamp).toLocaleString()}</p>
 </div>
 <span className={`px-2 py-1 rounded text-xs font-bold tracking-wide ${getRiskColor(item.result.overallRisk)}`}>
 {item.result.overallRisk}
 </span>
 <button
 onClick={() => removeFromProject(item.id, selectedProject.id)}
 className="p-2 hover:bg-rose-50 border border-rose-200 rounded-lg"
 title="Remove from project"
 >
 <X className="w-4 h-4 text-rose-500" />
 </button>
 <button
 onClick={() => generatePdfReport(item)}
 className="p-2 hover:bg-gray-100 rounded-lg"
 title="Download Report"
 >
 <Download className="w-4 h-4 text-gray-500" />
 </button>
 <button
 onClick={() => viewHistoryItem(item)}
 className="p-2 hover:bg-emerald-50 border border-emerald-200 rounded-lg"
 >
 <Eye className="w-4 h-4 text-emerald-500" />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}

 {/* New Search Page */}
 {kycPage === 'newSearch' && (
 <div>
 <div className="flex items-center gap-3 mb-6">
 <button onClick={() => setKycPage('landing')} className="p-2 hover:bg-gray-100 rounded-lg">
 <ArrowLeft className="w-5 h-5 text-gray-600" />
 </button>
 <div>
 <h2 className="text-2xl font-bold tracking-tight leading-tight">New Screening</h2>
 <p className="text-sm text-gray-600 leading-relaxed">Screen against sanctions, PEP, and adverse media</p>
 </div>
 </div>

 {/* Search Form */}
 <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
 <div className="flex gap-4 mb-6">
 <button
 onClick={() => setKycType('individual')}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium tracking-wide transition-all ${
 kycType === 'individual' 
 ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 border border-emerald-500' 
 : 'bg-gray-100 text-gray-600 border border-gray-300 hover:border-gray-400'
 }`}
 >
 <UserSearch className="w-4 h-4" />
 Individual
 </button>
 <button
 onClick={() => setKycType('entity')}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium tracking-wide transition-all ${
 kycType === 'entity' 
 ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 border border-emerald-500' 
 : 'bg-gray-100 text-gray-600 border border-gray-300 hover:border-gray-400'
 }`}
 >
 <Building2 className="w-4 h-4" />
 Entity
 </button>
 </div>

 {kycType === 'individual' ? (
 <div className="space-y-4">
 {/* Individual Form */}
 <div className="grid md:grid-cols-2 gap-4">
 <div className="md:col-span-2">
 <label className="block text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-2">
 Full Name <span className="text-rose-600">*</span>
 </label>
 <input
 type="text"
 value={kycQuery}
 onChange={(e) => setKycQuery(e.target.value)}
 onKeyPress={(e) => e.key === 'Enter' && runKycScreening()}
 placeholder="e.g., Viktor Vekselberg, Alisher Usmanov"
 className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-400"
 />
 </div>
 
 <div>
 <label className="block text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-2">
 Year of Birth <span className="text-gray-400 font-normal">(optional)</span>
 </label>
 <input
 type="text"
 value={kycYearOfBirth}
 onChange={(e) => setKycYearOfBirth(e.target.value.replace(/\D/g, '').slice(0, 4))}
 placeholder="e.g., 1965"
 maxLength={4}
 className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-400 mono"
 />
 </div>
 
 <div>
 <label className="block text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-2">
 Country <span className="text-gray-400 font-normal">(optional)</span>
 </label>
 <input
 type="text"
 value={kycCountry}
 onChange={(e) => setKycCountry(e.target.value)}
 placeholder="e.g., Russia, United States"
 className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-400"
 />
 </div>
 
 <div className="md:col-span-2">
 <label className="block text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-2">
 Client Reference <span className="text-gray-400 font-normal">(optional)</span>
 </label>
 <input
 type="text"
 value={kycClientRef}
 onChange={(e) => setKycClientRef(e.target.value)}
 placeholder="Internal ID or reference number"
 className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-400"
 />
 </div>
 </div>
 
 <p className="text-xs text-gray-500">
 Optional fields help reduce false positives by filtering matches that don't align with the subject's age or geographic nexus.
 </p>
 
 <button
 onClick={runKycScreening}
 disabled={!kycQuery.trim() || isScreening}
 className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-300 text-gray-900 disabled:text-gray-500 font-semibold tracking-wide px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
 >
 {isScreening ? (
 <>
 <Loader2 className="w-5 h-5 animate-spin" />
 Screening...
 </>
 ) : (
 <>
 <Search className="w-5 h-5" />
 Screen Individual
 </>
 )}
 </button>
 </div>
 ) : (
 <div className="flex gap-3">
 <input
 type="text"
 value={kycQuery}
 onChange={(e) => setKycQuery(e.target.value)}
 onKeyPress={(e) => e.key === 'Enter' && runKycScreening()}
 placeholder="Enter company name (e.g., Rusal, EN+ Group, PDVSA)"
 className="flex-1 bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-400"
 />
 <button
 onClick={runKycScreening}
 disabled={!kycQuery.trim() || isScreening}
 className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-300 text-gray-900 disabled:text-gray-500 font-semibold tracking-wide px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
 >
 {isScreening ? (
 <Loader2 className="w-5 h-5 animate-spin" />
 ) : (
 <Search className="w-5 h-5" />
 )}
 Screen
 </button>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Results Page */}
 {kycPage === 'results' && kycResults && (
 <div className="fade-in space-y-6">
 {/* Results Header with Actions */}
 <div className="flex items-center justify-between mb-4">
 <button 
 onClick={() => { clearKycResults(); setKycPage('newSearch'); }} 
 className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
 >
 <ArrowLeft className="w-4 h-4" />
 Back to Search
 </button>
 <div className="flex items-center gap-2">
 {/* Add to Project dropdown */}
 <div className="relative">
 <button
 onClick={() => setAssigningToProject(assigningToProject === 'results' ? null : 'results')}
 className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm transition-colors"
 >
 <Tag className="w-4 h-4" />
 Add to Project
 </button>
 {assigningToProject === 'results' && selectedHistoryItem && (
 <div className="absolute right-0 top-full mt-2 w-64 bg-gray-100 border border-gray-300 rounded-xl shadow-xl z-20 p-3">
 <p className="text-xs text-gray-500 mb-2 px-2">Add to project:</p>
 {kycProjects.length === 0 ? (
 <div className="px-2 py-3 text-center">
 <p className="text-sm text-gray-600 leading-relaxed mb-2">No projects yet</p>
 <button
 onClick={() => { setAssigningToProject(null); setKycPage('projects'); }}
 className="text-xs text-purple-600 hover:text-purple-300"
 >
 Create a project →
 </button>
 </div>
 ) : (
 <div className="space-y-1">
 {kycProjects.map(p => {
 const isInProject = p.screenings.includes(selectedHistoryItem.id);
 return (
 <button
 key={p.id}
 onClick={() => {
 if (isInProject) {
 removeFromProject(selectedHistoryItem.id, p.id);
 } else {
 addToProject(selectedHistoryItem.id, p.id);
 }
 }}
 className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${
 isInProject 
 ? 'bg-purple-50 border border-purple-200 text-purple-600' 
 : 'hover:bg-gray-200 text-gray-700'
 }`}
 >
 <span className="flex items-center gap-2">
 <Folder className="w-4 h-4" />
 {p.name}
 </span>
 {isInProject && <Check className="w-4 h-4" />}
 </button>
 );
 })}
 <div className="border-t border-gray-300 mt-2 pt-2">
 <button
 onClick={() => { setAssigningToProject(null); setKycPage('projects'); }}
 className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-600 hover:bg-gray-200 rounded-lg flex items-center gap-2"
 >
 <Plus className="w-4 h-4" />
 Create new project
 </button>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 <button
 onClick={() => selectedHistoryItem && generatePdfReport(selectedHistoryItem)}
 disabled={isGeneratingPdf || !selectedHistoryItem}
 className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm transition-colors"
 >
 {isGeneratingPdf ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <Download className="w-4 h-4" />
 )}
 Download Report
 </button>
 <button
 onClick={() => { clearKycResults(); setKycPage('newSearch'); }}
 className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-gray-900 px-4 py-2 rounded-xl text-sm font-medium tracking-wide transition-colors"
 >
 <Plus className="w-4 h-4" />
 New Search
 </button>
 </div>
 </div>

 {/* No Risks Identified - Simplified View */}
 {kycResults.noRisksIdentified ? (
 <div className="bg-white border-2 border-emerald-500 rounded-2xl p-8 text-center">
 <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6">
 <ShieldCheck className="w-10 h-10 text-emerald-500" />
 </div>
 <h3 className="text-2xl font-bold tracking-tight leading-tight text-emerald-600 mb-2 leading-tight">No Risks Identified</h3>
 <p className="text-base text-gray-600 leading-relaxed mb-6 max-w-md mx-auto">
 Screening of <span className="font-semibold tracking-wide text-gray-900">{kycResults.subject?.name}</span> returned no matches against sanctions lists, PEP databases, or adverse media sources.
 </p>
 
 <div className="inline-flex items-center gap-6 bg-gray-100/50 rounded-xl px-6 py-4 mb-6">
 <div className="text-center">
 <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
 <p className="text-xs text-gray-500">Sanctions</p>
 <p className="text-sm font-medium tracking-wide text-emerald-600">Clear</p>
 </div>
 <div className="w-px h-10 bg-gray-200" />
 <div className="text-center">
 <Users className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
 <p className="text-xs text-gray-500">PEP</p>
 <p className="text-sm font-medium tracking-wide text-emerald-600">Clear</p>
 </div>
 <div className="w-px h-10 bg-gray-200" />
 <div className="text-center">
 <Newspaper className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
 <p className="text-xs text-gray-500">Adverse Media</p>
 <p className="text-sm font-medium tracking-wide text-emerald-600">Clear</p>
 </div>
 {kycType === 'entity' && (
 <>
 <div className="w-px h-10 bg-gray-200" />
 <div className="text-center">
 <GitBranch className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
 <p className="text-xs text-gray-500">50% Rule</p>
 <p className="text-sm font-medium tracking-wide text-emerald-600">Clear</p>
 </div>
 </>
 )}
 </div>

 <div className="text-xs text-gray-500 space-y-1">
 <p>Screened: {new Date(selectedHistoryItem?.timestamp).toLocaleString()}</p>
 {kycClientRef && <p>Client Ref: {kycClientRef}</p>}
 {kycCountry && <p>Country: {kycCountry}</p>}
 {kycYearOfBirth && <p>Year of Birth: {kycYearOfBirth}</p>}
 </div>
 </div>
 ) : (
 <>
 {/* Results Header */}
 <div className={`bg-white border-l-4 ${getRiskBorder(kycResults.overallRisk)} rounded-xl p-6`}>
 <div className="flex items-start justify-between mb-4">
 <div>
 <h3 className="text-xl font-bold tracking-tight leading-tight">{kycResults.subject?.name}</h3>
 <p className="text-sm text-gray-600 mono tracking-wide">{kycResults.subject?.type}</p>
 {kycResults.subject?.jurisdiction && (
 <p className="text-sm text-gray-500 mt-1">
 <Globe className="w-3 h-3 inline mr-1" />
 {kycResults.subject.jurisdiction}
 </p>
 )}
 {/* Show screening parameters */}
 <div className="flex flex-wrap gap-2 mt-2">
 {kycClientRef && (
 <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded mono">
 Ref: {kycClientRef}
 </span>
 )}
 {kycYearOfBirth && (
 <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded mono">
 DOB: {kycYearOfBirth}
 </span>
 )}
 {kycCountry && (
 <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded mono">
 {kycCountry}
 </span>
 )}
 </div>
 </div>
 <div className="flex items-center gap-3">
 <span className={`px-4 py-2 rounded-xl text-sm font-bold ${getRiskColor(kycResults.overallRisk)}`}>
 {kycResults.overallRisk} RISK
 </span>
 <button
 onClick={clearKycResults}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <X className="w-5 h-5 text-gray-500" />
 </button>
 </div>
 </div>
 
 {/* Quick Risk Factors */}
 {kycResults.riskFactors && kycResults.riskFactors.length > 0 && (
 <div className="flex flex-wrap gap-2 mt-4">
 {kycResults.riskFactors.map((rf, idx) => (
 <span key={idx} className={`px-2 py-1 rounded text-xs font-medium ${
 rf.severity === 'CRITICAL' ? 'bg-red-600/20 text-red-600' :
 rf.severity === 'HIGH' ? 'bg-rose-50 border border-rose-200 text-rose-600' :
 rf.severity === 'MEDIUM' ? 'bg-amber-50 border border-amber-200 text-amber-600' :
 'bg-gray-200 text-gray-600'
 }`}>
 {rf.factor}
 </span>
 ))}
 </div>
 )}
 </div>

 {/* 50% Rule / Ownership Analysis - PROMINENT PLACEMENT */}
 {kycResults.ownershipAnalysis && (
 <div className={`bg-white border-2 ${
 kycResults.ownershipAnalysis.fiftyPercentRuleTriggered 
 ? 'border-rose-500 bg-rose-500/5' 
 : 'border-gray-200'
 } rounded-xl p-6`}>
 <div className="flex items-center gap-3 mb-4">
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
 kycResults.ownershipAnalysis.fiftyPercentRuleTriggered
 ? 'bg-red-600/20'
 : kycResults.ownershipAnalysis.riskLevel === 'HIGH' ? 'bg-rose-50 border border-rose-200'
 : kycResults.ownershipAnalysis.riskLevel === 'MEDIUM' ? 'bg-amber-50 border border-amber-200'
 : 'bg-emerald-50 border border-emerald-200'
 }`}>
 <GitBranch className={`w-6 h-6 ${
 kycResults.ownershipAnalysis.fiftyPercentRuleTriggered
 ? 'text-red-600'
 : kycResults.ownershipAnalysis.riskLevel === 'HIGH' ? 'text-rose-500'
 : kycResults.ownershipAnalysis.riskLevel === 'MEDIUM' ? 'text-amber-500'
 : 'text-emerald-500'
 }`} />
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-3">
 <h4 className="font-semibold tracking-wide text-lg">OFAC 50% Rule Analysis</h4>
 {kycResults.ownershipAnalysis.fiftyPercentRuleTriggered && (
 <span className="px-3 py-1 bg-rose-500 text-white text-xs font-bold tracking-wide rounded-full animate-pulse">
 BLOCKED BY OWNERSHIP
 </span>
 )}
 </div>
 <p className="text-sm text-gray-600 leading-relaxed">{kycResults.ownershipAnalysis.summary}</p>
 </div>
 </div>

 {/* Aggregate Blocked Ownership Meter */}
 {typeof kycResults.ownershipAnalysis.aggregateBlockedOwnership === 'number' && (
 <div className="mb-6 p-5 bg-gray-100/50 rounded-lg">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm font-medium tracking-wide">Aggregate Blocked Ownership</span>
 <span className={`mono tracking-wide font-bold ${
 kycResults.ownershipAnalysis.aggregateBlockedOwnership >= 50 ? 'text-red-600' :
 kycResults.ownershipAnalysis.aggregateBlockedOwnership >= 25 ? 'text-rose-500' :
 kycResults.ownershipAnalysis.aggregateBlockedOwnership > 0 ? 'text-amber-500' :
 'text-emerald-500'
 }`}>
 {kycResults.ownershipAnalysis.aggregateBlockedOwnership}%
 </span>
 </div>
 <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
 <div
 className={`h-full transition-all duration-500 ${
 kycResults.ownershipAnalysis.aggregateBlockedOwnership >= 50 ? 'bg-red-600' :
 kycResults.ownershipAnalysis.aggregateBlockedOwnership >= 25 ? 'bg-rose-500' :
 kycResults.ownershipAnalysis.aggregateBlockedOwnership > 0 ? 'bg-amber-500' :
 'bg-emerald-500'
 }`}
 style={{ width: `${Math.min(kycResults.ownershipAnalysis.aggregateBlockedOwnership, 100)}%` }}
 />
 </div>
 <div className="flex justify-between mt-1 text-xs text-gray-500">
 <span>0%</span>
 <span className="text-rose-500 font-medium tracking-wide">50% Threshold</span>
 <span>100%</span>
 </div>
 </div>
 )}

 {/* Beneficial Owners */}
 {kycResults.ownershipAnalysis.beneficialOwners && kycResults.ownershipAnalysis.beneficialOwners.length > 0 && (
 <div className="mb-6">
 <h5 className="text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-3 flex items-center gap-2">
 <Users className="w-4 h-4" />
 Beneficial Owners
 </h5>
 <div className="space-y-2">
 {kycResults.ownershipAnalysis.beneficialOwners.map((owner, idx) => (
 <div key={idx} className={`p-5 rounded-lg border ${
 owner.sanctionStatus === 'SANCTIONED' ? 'bg-red-600/10 border-red-600/50' :
 owner.sanctionStatus === 'POTENTIAL_MATCH' ? 'bg-rose-500/10 border-rose-500/50' :
 'bg-gray-100/50 border-gray-300'
 }`}>
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-3">
 <span className="font-medium tracking-wide">{owner.name}</span>
 {owner.pepStatus && (
 <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-600 text-xs rounded">PEP</span>
 )}
 {owner.sanctionStatus === 'SANCTIONED' && (
 <span className="px-2 py-0.5 bg-rose-500 text-white text-xs rounded font-bold">SANCTIONED</span>
 )}
 </div>
 <span className={`mono tracking-wide font-bold text-lg ${
 owner.sanctionStatus === 'SANCTIONED' ? 'text-rose-500' : 'text-gray-700'
 }`}>
 {owner.ownershipPercent}%
 </span>
 </div>
 <div className="flex items-center gap-4 text-xs text-gray-500">
 <span className="flex items-center gap-1">
 <Share2 className="w-3 h-3" />
 {owner.ownershipType}
 </span>
 {owner.sanctionDetails && (
 <span className="text-rose-600">{owner.sanctionDetails}</span>
 )}
 <span className="text-gray-400">Source: {owner.source}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Ownership Portfolio Network Graph (for individuals) */}
 {kycResults.ownedCompanies && kycResults.ownedCompanies.length > 0 && (
 <div className="mb-6">
 <h5 className="text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-3 flex items-center gap-2">
 <Network className="w-4 h-4" />
 Ownership Network ({kycResults.ownedCompanies.length} {kycResults.ownedCompanies.length === 1 ? 'Company' : 'Companies'})
 </h5>
 <div className="mb-3 p-4 bg-gray-100/50 rounded-lg">
 <div className="grid grid-cols-3 gap-4 text-sm">
 <div className="text-center">
 <span className="block text-2xl font-bold text-gray-900">{kycResults.ownedCompanies.length}</span>
 <span className="text-xs text-gray-500">Total Entities</span>
 </div>
 <div className="text-center">
 <span className="block text-2xl font-bold text-rose-600">
 {kycResults.ownedCompanies.filter(c => c.ownershipPercent >= 50).length}
 </span>
 <span className="text-xs text-gray-500">Controlling (≥50%)</span>
 </div>
 <div className="text-center">
 <span className="block text-2xl font-bold text-red-600">
 {kycResults.ownedCompanies.filter(c => c.sanctionedOwner).length}
 </span>
 <span className="text-xs text-gray-500">Sanctioned</span>
 </div>
 </div>
 </div>
 <OwnershipNetworkGraph
 centralEntity={kycResults.subject?.name || kycQuery}
 ownedCompanies={kycResults.ownedCompanies}
 height={350}
 />
 <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
 <div className="flex items-center gap-1">
 <span className="w-3 h-3 rounded-full bg-amber-500"></span>
 <span>Subject</span>
 </div>
 <div className="flex items-center gap-1">
 <span className="w-3 h-3 rounded-full bg-red-600"></span>
 <span>Controlling (≥50%)</span>
 </div>
 <div className="flex items-center gap-1">
 <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
 <span>Minority</span>
 </div>
 </div>
 </div>
 )}

 {/* Corporate Structure */}
 {kycResults.ownershipAnalysis && kycResults.ownershipAnalysis.corporateStructure && kycResults.ownershipAnalysis.corporateStructure.length > 0 && (
 <div className="mb-6">
 <h5 className="text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-3 flex items-center gap-2">
 <Network className="w-4 h-4" />
 Corporate Network ({kycResults.ownershipAnalysis.corporateStructure.length} Related {kycResults.ownershipAnalysis.corporateStructure.length === 1 ? 'Entity' : 'Entities'})
 </h5>
 <OwnershipNetworkGraph
 centralEntity={kycResults.subject?.name || kycQuery}
 corporateNetwork={kycResults.ownershipAnalysis.corporateStructure}
 height={300}
 />
 <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
 <div className="flex items-center gap-1">
 <span className="w-3 h-3 rounded-full bg-amber-500"></span>
 <span>Subject</span>
 </div>
 <div className="flex items-center gap-1">
 <span className="w-3 h-3 rounded-full bg-red-600"></span>
 <span>Direct Exposure</span>
 </div>
 <div className="flex items-center gap-1">
 <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
 <span>No Exposure</span>
 </div>
 </div>
 </div>
 )}

 {/* Leaks Database Exposure */}
 {kycResults.ownershipAnalysis.leaksExposure && kycResults.ownershipAnalysis.leaksExposure.length > 0 && (
 <div>
 <h5 className="text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-3 flex items-center gap-2">
 <Database className="w-4 h-4" />
 Offshore Leaks Database Matches
 </h5>
 <div className="space-y-2">
 {kycResults.ownershipAnalysis.leaksExposure.map((leak, idx) => (
 <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
 <div className="flex items-center gap-2 mb-1">
 <span className="font-medium tracking-wide text-amber-600">{leak.database}</span>
 <span className="text-xs text-gray-500 mono tracking-wide">{leak.date}</span>
 </div>
 <p className="text-base text-gray-900 leading-relaxed">{leak.finding}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 {/* Sanctions */}
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <div className="flex items-center gap-3 mb-4">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
 kycResults.sanctions?.status === 'CLEAR' ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
 }`}>
 {kycResults.sanctions?.status === 'CLEAR' ? (
 <ShieldCheck className="w-5 h-5 text-emerald-500" />
 ) : (
 <ShieldAlert className="w-5 h-5 text-rose-500" />
 )}
 </div>
 <div>
 <h4 className="font-semibold">Direct Screening sanctions</h4>
 <p className={`text-sm ${
 kycResults.sanctions?.status === 'CLEAR' ? 'text-emerald-600' : 'text-rose-600'
 }`}>
 {kycResults.sanctions?.status === 'CLEAR' ? 'No direct matches found' : 
 kycResults.sanctions?.status === 'POTENTIAL_MATCH' ? 'Potential matches found' : 'Direct match found'}
 </p>
 </div>
 </div>
 
 {kycResults.sanctions?.matches && kycResults.sanctions.matches.length > 0 && (
 <div className="space-y-3 mt-4">
 {kycResults.sanctions.matches.map((match, idx) => (
 <div key={idx} className="bg-gray-100/50 rounded-lg p-4">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <Flag className="w-4 h-4 text-rose-500" />
 <span className="font-medium tracking-wide text-rose-600">{match.list}</span>
 </div>
 <span className="mono text-xs tracking-wide bg-rose-50 border border-rose-200 text-rose-600 px-2 py-1 rounded">
 {match.matchScore}% match
 </span>
 </div>
 {match.matchedName && (
 <p className="text-base text-gray-900 leading-relaxed mb-1">Listed as: <span className="font-medium tracking-wide">{match.matchedName}</span></p>
 )}
 <p className="text-sm text-gray-600 leading-relaxed">{match.details}</p>
 {match.listingDate && (
 <p className="text-xs text-gray-500 mt-2">Listed: {match.listingDate}</p>
 )}
 </div>
 ))}
 </div>
 )}
 </div>

 {/* PEP */}
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <div className="flex items-center gap-3 mb-4">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
 kycResults.pep?.status === 'CLEAR' ? 'bg-emerald-50 border border-emerald-200' : 'bg-purple-50 border border-purple-200'
 }`}>
 <Users className={`w-5 h-5 ${
 kycResults.pep?.status === 'CLEAR' ? 'text-emerald-500' : 'text-purple-500'
 }`} />
 </div>
 <div>
 <h4 className="font-semibold">PEP Status</h4>
 <p className={`text-sm ${
 kycResults.pep?.status === 'CLEAR' ? 'text-emerald-600' : 'text-purple-600'
 }`}>
 {kycResults.pep?.status === 'CLEAR' ? 'Not a PEP' : 'PEP indicators found'}
 </p>
 </div>
 </div>
 
 {kycResults.pep?.matches && kycResults.pep.matches.length > 0 && (
 <div className="space-y-3 mt-4">
 {kycResults.pep.matches.map((match, idx) => (
 <div key={idx} className="bg-gray-100/50 rounded-lg p-4">
 <div className="flex items-center gap-3 mb-2">
 <Globe className="w-4 h-4 text-gray-500" />
 <span className="font-medium tracking-wide">{match.position || match.name}</span>
 <span className={`px-2 py-0.5 rounded text-xs ${getRiskColor(match.riskLevel)}`}>
 {match.riskLevel}
 </span>
 </div>
 <p className="text-sm text-gray-600 leading-relaxed">
 {match.country} • {match.status}
 {match.relationshipToSubject && match.relationshipToSubject !== 'Self' && (
 <span className="text-purple-600"> • {match.relationshipToSubject}</span>
 )}
 </p>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Adverse Media */}
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <div className="flex items-center gap-3 mb-4">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
 kycResults.adverseMedia?.status === 'CLEAR' ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
 }`}>
 <Newspaper className={`w-5 h-5 ${
 kycResults.adverseMedia?.status === 'CLEAR' ? 'text-emerald-500' : 'text-amber-500'
 }`} />
 </div>
 <div className="flex-1">
 <h4 className="font-semibold">Adverse Media</h4>
 <p className={`text-sm ${
 kycResults.adverseMedia?.status === 'CLEAR' ? 'text-emerald-600' : 'text-amber-600'
 }`}>
 {kycResults.adverseMedia?.status === 'CLEAR' ? 'No adverse media found' : 
 `${kycResults.adverseMedia?.totalArticles || kycResults.adverseMedia?.articles?.length || 0} article(s) found`}
 </p>
 </div>
 
 {/* Category breakdown */}
 {kycResults.adverseMedia?.categories && (
 <div className="flex gap-2">
 {Object.entries(kycResults.adverseMedia.categories).map(([cat, count]) => (
 count > 0 && (
 <span key={cat} className="text-xs px-2 py-1 bg-gray-100 rounded mono">
 {cat}: {count}
 </span>
 )
 ))}
 </div>
 )}
 </div>
 
 {kycResults.adverseMedia?.articles && kycResults.adverseMedia.articles.length > 0 && (
 <div className="space-y-3 mt-4">
 {kycResults.adverseMedia.articles.map((article, idx) => (
 <div key={idx} className="bg-gray-100/50 rounded-lg p-4">
 <div className="flex items-start justify-between mb-2">
 <h5 className="font-medium tracking-wide text-amber-600 flex-1">{article.headline}</h5>
 <div className="flex items-center gap-2 shrink-0 ml-2">
 {article.relevance && (
 <span className={`text-xs px-2 py-0.5 rounded ${
 article.relevance === 'HIGH' ? 'bg-rose-50 border border-rose-200 text-rose-600' :
 article.relevance === 'MEDIUM' ? 'bg-amber-50 border border-amber-200 text-amber-600' :
 'bg-gray-200 text-gray-600'
 }`}>
 {article.relevance}
 </span>
 )}
 <span className="text-xs text-gray-500 mono tracking-wide">{article.date}</span>
 </div>
 </div>
 <p className="text-sm text-gray-600 leading-relaxed mb-2">{article.summary}</p>
 <div className="flex items-center gap-3 text-xs text-gray-500">
 <span>{article.source}</span>
 <span className="px-2 py-0.5 bg-gray-200 rounded">{article.category}</span>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Regulatory Guidance */}
 {kycResults.regulatoryGuidance && (
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <h4 className="font-semibold tracking-wide mb-4 flex items-center gap-2">
 <Scale className="w-5 h-5 text-blue-500" />
 Regulatory Guidance
 </h4>
 <div className="grid md:grid-cols-3 gap-4">
 <div className="bg-gray-100/50 rounded-lg p-4">
 <p className="text-xs font-medium text-gray-500 mono uppercase tracking-wider mb-1">OFAC IMPLICATIONS</p>
 <p className="text-base text-gray-900 leading-relaxed">{kycResults.regulatoryGuidance.ofacImplications}</p>
 </div>
 <div className="bg-gray-100/50 rounded-lg p-4">
 <p className="text-xs font-medium text-gray-500 mono uppercase tracking-wider mb-1">DUE DILIGENCE LEVEL</p>
 <p className={`text-sm font-medium ${
 kycResults.regulatoryGuidance.dueDiligenceRequired === 'EDD' ? 'text-rose-600' :
 kycResults.regulatoryGuidance.dueDiligenceRequired === 'SDD' ? 'text-emerald-600' :
 'text-gray-700'
 }`}>
 {kycResults.regulatoryGuidance.dueDiligenceRequired === 'EDD' ? 'Enhanced Due Diligence' :
 kycResults.regulatoryGuidance.dueDiligenceRequired === 'SDD' ? 'Simplified Due Diligence' :
 'Standard Due Diligence'}
 </p>
 </div>
 <div className="bg-gray-100/50 rounded-lg p-4">
 <p className="text-xs font-medium text-gray-500 mono uppercase tracking-wider mb-1">FILING REQUIREMENTS</p>
 <div className="flex flex-wrap gap-1">
 {kycResults.regulatoryGuidance.filingRequirements?.map((req, idx) => (
 <span key={idx} className="text-xs px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-600 rounded">
 {req}
 </span>
 )) || <span className="text-sm text-gray-600 leading-relaxed">None required</span>}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Recommendations */}
 {kycResults.recommendations && kycResults.recommendations.length > 0 && (
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <h4 className="font-semibold tracking-wide mb-4 flex items-center gap-2">
 <Target className="w-5 h-5 text-amber-500" />
 Recommendations
 </h4>
 <div className="space-y-3">
 {kycResults.recommendations.map((rec, idx) => (
 <div key={idx} className={`p-5 rounded-lg border-l-4 ${
 rec.priority === 'HIGH' ? 'border-rose-500 bg-rose-500/5' :
 rec.priority === 'MEDIUM' ? 'border-amber-500 bg-amber-500/5' :
 'border-gray-400 bg-gray-100/50'
 }`}>
 <div className="flex items-center gap-2 mb-1">
 <span className={`text-xs font-bold tracking-wide mono ${
 rec.priority === 'HIGH' ? 'text-rose-600' :
 rec.priority === 'MEDIUM' ? 'text-amber-600' :
 'text-gray-600'
 }`}>
 {rec.priority}
 </span>
 <span className="font-medium tracking-wide text-gray-900">{rec.action}</span>
 </div>
 <p className="text-sm text-gray-600 leading-relaxed">{rec.rationale}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </>
 )}
 </div>
 )}

 {/* Cipher Loading Overlay */}
 {isScreening && (
 <div className="fixed inset-0 bg-gray-50/95 backdrop-blur-sm z-50 flex items-start justify-center pt-32">
 <div className="text-center">
 <div className="relative w-24 h-24 mx-auto mb-6">
 <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full animate-ping" />
 <div className="absolute inset-2 border-4 border-emerald-500/50 rounded-full animate-pulse" />
 <div className="absolute inset-4 bg-emerald-500 rounded-full flex items-center justify-center">
 <Shield className="w-8 h-8 text-white animate-pulse" />
 </div>
 </div>
 <h3 className="text-xl font-bold tracking-tight mb-2 leading-tight">Screening in Progress</h3>

 <div className="space-y-4 w-full max-w-2xl mx-auto px-4">
 <p className="text-emerald-600 font-medium tracking-wide text-lg">{screeningStep}</p>

 {/* Progress bar */}
 <div className="space-y-2">
 <div className="flex justify-between text-xs text-gray-600">
 <span>Screening Progress</span>
 <span>{screeningProgress.toFixed(0)}% Complete</span>
 </div>
 <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
 <div
 className="h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 transition-all duration-500"
 style={{ width: `${screeningProgress}%` }}
 />
 </div>
 </div>

 {/* Pipeline steps */}
 <div className="grid grid-cols-5 gap-2 text-xs mt-8">
 <div className={`p-3 rounded text-center transition-all duration-300 ${screeningProgress >= 15 ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-gray-100/50 text-gray-500'}`}>
 <div className="font-medium tracking-wide">1. Sanctions Check</div>
 </div>
 <div className={`p-3 rounded text-center transition-all duration-300 ${screeningProgress >= 35 ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-gray-100/50 text-gray-500'}`}>
 <div className="font-medium tracking-wide">2. Ownership Analysis</div>
 </div>
 <div className={`p-3 rounded text-center transition-all duration-300 ${screeningProgress >= 55 ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-gray-100/50 text-gray-500'}`}>
 <div className="font-medium tracking-wide">3. Context Building</div>
 </div>
 <div className={`p-3 rounded text-center transition-all duration-300 ${screeningProgress >= 65 ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-gray-100/50 text-gray-500'}`}>
 <div className="font-medium tracking-wide">4. AI Risk Analysis</div>
 </div>
 <div className={`p-3 rounded text-center transition-all duration-300 ${screeningProgress >= 90 ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-gray-100/50 text-gray-500'}`}>
 <div className="font-medium tracking-wide">5. Report Generation</div>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 </div>
 )}

 {/* Noir Landing Page */}
 {currentPage === 'noirLanding' && (
 <div className="fade-in min-h-screen -mt-24">
 {/* User Menu - Top Right Corner */}
 {isConfigured && user && (
 <div className="fixed top-4 right-4 z-50">
 <div className="relative group">
 <button className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full pl-3 pr-4 py-2 shadow-sm hover:shadow-md transition-all">
 <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center">
 <span className="text-white text-sm font-semibold">{user.email?.charAt(0).toUpperCase()}</span>
 </div>
 <span className="text-sm text-gray-700 hidden sm:block">{user.email?.split('@')[0]}</span>
 <ChevronDown className="w-4 h-4 text-gray-400" />
 </button>
 <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
 <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-48">
 <div className="px-3 py-2 border-b border-gray-100">
 <p className="text-xs text-gray-500">Signed in as</p>
 <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
 </div>
 <button
 onClick={signOut}
 className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
 >
 <LogOut className="w-4 h-4" />
 Sign Out
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 {/* Hero Section - Full viewport height */}
 <div className="min-h-screen flex flex-col justify-center px-6 relative">
 <div className="max-w-4xl mx-auto text-center">
 {/* Marlowe Logo */}
 <div className="mb-8">
 <span
 className="text-5xl md:text-6xl font-bold tracking-tight text-amber-500"
 style={{
 textShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
 }}
 >
 Marlowe
 </span>
 </div>

 {/* Headline */}
 <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 text-gray-900 leading-tight">
 The AI investigator for<br />
 <span className="text-amber-500" style={{textShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'}}>
 financial crime
 </span>
 </h1>

 <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
 Reduce investigation time from hours to minutes
 </p>
 <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
 Close up to 10x more cases per week
 </p>

 {/* CTAs */}
 <div className="flex items-center justify-center">
 <button
 onClick={startNewCase}
 className="group bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/20 flex items-center gap-2"
 >
 <span>Enter</span>
 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
 </button>
 </div>
 </div>

 {/* Scroll indicator - hides after scrolling */}
 {!hasScrolled && (
 <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 text-gray-400 animate-bounce transition-opacity duration-500">
 <span className="text-sm font-medium">Learn more</span>
 <ChevronDown className="w-5 h-5" />
 </div>
 )}
 </div>

 {/* Now There's Marlowe Section */}
 <div className="py-20 px-6 bg-gray-900">
 <div className="max-w-4xl mx-auto">
 <div className="text-center mb-12">
 <h2 className="text-4xl font-bold tracking-tight mb-2 text-white">Investigations Are Stuck at Human Speed</h2>
 <p className="text-lg text-gray-400">Marlowe Makes Them Faster, Deeper, Better</p>
 </div>
 <div className="grid md:grid-cols-2 gap-8 mb-12">
 <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
 <div className="text-gray-400 text-sm font-semibold mb-3">BEFORE</div>
 <p className="text-gray-300 leading-relaxed mb-4">
 An analyst spends <span className="text-white font-semibold">6-8 hours</span> manually reviewing documents, tracking entities in a spreadsheet, building a timeline by hand, cross-referencing corporate structures, and writing up findings.
 </p>
 <div className="flex items-center gap-2 text-rose-400">
 <div className="w-2 h-2 rounded-full bg-rose-400" />
 <span className="text-sm font-semibold">6-8 hours per case</span>
 </div>
 </div>
 <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-8">
 <div className="text-amber-500 text-sm font-semibold mb-3">WITH MARLOWE</div>
 <p className="text-gray-300 leading-relaxed mb-4">
 Marlowe processes the same documents <span className="text-white font-semibold">in seconds</span> and outputs <span className="text-white font-semibold">3x the conclusions</span> the analyst would've reached. The analyst reviews, asks follow-up questions, and gets straight to judgment calls that require human expertise.
 </p>
 <div className="flex items-center gap-2 text-emerald-400">
 <div className="w-2 h-2 rounded-full bg-emerald-400" />
 <span className="text-sm font-semibold">30 minutes per case</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Investigation Pipeline Graphic */}
 <div className="py-20 px-6 bg-gray-100">
 <div className="max-w-5xl mx-auto">
 <div className="text-center mb-12">
 <h2 className="text-4xl font-bold tracking-tight mb-4">The Investigation Pipeline</h2>
 </div>

 {/* Pipeline Graphic */}
 <div className="relative">
 {/* Connection line */}
 <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-300 via-emerald-300 to-amber-400 -translate-y-1/2 hidden md:block" style={{left: '8%', right: '8%'}} />

 <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative">
 {/* Already Automated - Collection */}
 <div className="flex flex-col items-center">
 <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center mb-3 relative z-10">
 <CheckCircle2 className="w-8 h-8 text-emerald-500" />
 </div>
 <span className="text-sm font-semibold text-gray-900 text-center">Collection</span>
 </div>

 {/* Already Automated - Processing */}
 <div className="flex flex-col items-center">
 <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center mb-3 relative z-10">
 <CheckCircle2 className="w-8 h-8 text-emerald-500" />
 </div>
 <span className="text-sm font-semibold text-gray-900 text-center">Processing</span>
 </div>

 {/* Already Automated - Basic Analysis */}
 <div className="flex flex-col items-center">
 <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center mb-3 relative z-10">
 <CheckCircle2 className="w-8 h-8 text-emerald-500" />
 </div>
 <span className="text-sm font-semibold text-gray-900 text-center">Basic Analysis</span>
 </div>

 {/* Marlowe - Advanced Analysis */}
 <div className="flex flex-col items-center">
 <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center mb-3 relative z-10 shadow-lg shadow-amber-500/20">
 <Zap className="w-8 h-8 text-amber-500" />
 </div>
 <span className="text-sm font-semibold text-gray-900 text-center">Advanced Analysis</span>
 </div>

 {/* Marlowe - Synthesis */}
 <div className="flex flex-col items-center">
 <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center mb-3 relative z-10 shadow-lg shadow-amber-500/20">
 <Zap className="w-8 h-8 text-amber-500" />
 </div>
 <span className="text-sm font-semibold text-gray-900 text-center">Synthesis</span>
 </div>

 {/* Marlowe - Interpretation */}
 <div className="flex flex-col items-center">
 <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center mb-3 relative z-10 shadow-lg shadow-amber-500/20">
 <Zap className="w-8 h-8 text-amber-500" />
 </div>
 <span className="text-sm font-semibold text-gray-900 text-center">Interpretation</span>
 </div>
 </div>
 </div>

 {/* Legend */}
 <div className="flex justify-center gap-8 mt-10">
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 rounded-full bg-emerald-400" />
 <span className="text-sm text-gray-600">Already automated by existing tools</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 rounded-full bg-amber-500" />
 <span className="text-sm text-gray-600">Now automated by Marlowe</span>
 </div>
 </div>
 </div>
 </div>

 {/* Features Section */}
 <div className="py-20 px-6 bg-gray-50">
 <div className="max-w-7xl mx-auto">
 <div className="text-center mb-16">
 <h2 className="text-4xl font-bold tracking-tight mb-4">How Marlowe works</h2>
 <p className="text-lg text-gray-600">Upload documents, ask questions, get answers with evidence</p>
 </div>

 <div className="grid md:grid-cols-2 gap-6 mb-12">
 {/* Cipher Card */}
 <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-500/50 transition-all duration-300 group">
 <div className="w-16 h-16 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-amber-200/50 group-hover:scale-105 transition-transform">
 <Shield className="w-8 h-8 text-amber-500" />
 </div>
 <h3 className="text-2xl font-bold mb-3">Upload & Analyze</h3>
 <p className="text-gray-600 leading-relaxed">
 Drop in PDFs, emails, financials, or any documents. Marlowe reads everything and surfaces what matters.
 </p>
 </div>

 {/* Scout Card */}
 <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/50 transition-all duration-300 group">
 <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-emerald-200/50 group-hover:scale-105 transition-transform">
 <Search className="w-8 h-8 text-emerald-500" />
 </div>
 <h3 className="text-2xl font-bold mb-3">Ask & Investigate</h3>
 <p className="text-gray-600 leading-relaxed">
 Chat naturally about your case. Follow up on findings, request deeper analysis, explore leads.
 </p>
 </div>
 </div>

 {/* Additional Feature Cards */}
 <div className="grid md:grid-cols-4 gap-6">
 {/* Analyzing documents Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Users className="w-6 h-6 text-blue-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Analyzing documents</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Automatically identify people, companies, and relationships from unstructured documents</p>
 </div>

 {/* Typology Detection Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-purple-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Target className="w-6 h-6 text-purple-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Typology Detection</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Identify financial crime patterns hidden in any data format</p>
 </div>

 {/* Network Mapping Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-cyan-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Network className="w-6 h-6 text-cyan-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Network Mapping</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Visualize corporate structures and ownership chains to uncover hidden connections</p>
 </div>

 {/* Risk Scoring Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-rose-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <AlertTriangle className="w-6 h-6 text-rose-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Risk Scoring</h4>
 <p className="text-sm text-gray-600 leading-relaxed">AI-powered risk assessment with confidence scores and supporting evidence</p>
 </div>

 {/* Document Intelligence Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-orange-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <FileText className="w-6 h-6 text-orange-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Document Intelligence</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Process emails, financials, contracts, and corporate filings in any format</p>
 </div>

 {/* Generating hypotheses Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-yellow-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Lightbulb className="w-6 h-6 text-yellow-600" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Generating hypotheses</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Generate investigative leads and theories based on pattern analysis</p>
 </div>

 {/* Screening sanctions Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-red-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Globe className="w-6 h-6 text-red-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Global Sanctions</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Screen against OFAC, EU, UK, UN sanctions lists with alias matching</p>
 </div>

 {/* Report Generation Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-indigo-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Download className="w-6 h-6 text-indigo-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Export Reports</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Generate comprehensive PDF reports ready for regulatory submission</p>
 </div>
 </div>
 </div>
 </div>

 {/* Customer Types Section */}
 <div className="py-20 px-6">
 <div className="max-w-6xl mx-auto">
 <div className="text-center mb-12">
 <h2 className="text-4xl font-bold tracking-tight mb-4">Designed by Investigators, for Investigators</h2>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
 {/* Fintech */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Zap className="w-6 h-6 text-violet-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Fintech</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Payment processors, neobanks, and crypto platforms scaling compliance operations</p>
 </div>

 {/* Risk Consulting */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Scale className="w-6 h-6 text-blue-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Risk Consulting</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Advisory firms conducting due diligence and forensic investigations for clients</p>
 </div>

 {/* Banking */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Building2 className="w-6 h-6 text-emerald-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Banking</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Financial institutions managing AML compliance and fraud investigation teams</p>
 </div>

 {/* Corporates */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Briefcase className="w-6 h-6 text-slate-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Corporates</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Internal audit and corporate security teams investigating misconduct and fraud</p>
 </div>

 {/* Public Sector */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Flag className="w-6 h-6 text-amber-600" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Public Sector</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Government agencies and regulators enforcing financial crime laws</p>
 </div>

 {/* Private Investigators */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <UserSearch className="w-6 h-6 text-gray-600" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Private Investigators</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Licensed investigators conducting asset traces and background research</p>
 </div>
 </div>
 </div>
 </div>

 {/* CTA Section */}
 <div className="py-24 px-6 bg-gray-900">
 <div className="max-w-4xl mx-auto text-center">
 <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-10 text-white leading-tight">
 Ready to accelerate your investigations?
 </h2>
 <button
 onClick={startNewCase}
 className="group bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/20 inline-flex items-center gap-2"
 >
 <span>Get Started</span>
 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Case Management Page */}
 {currentPage === 'existingCases' && (
 <>
 {/* Navigation Buttons - Upper Left Corner */}
 <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
 {/* Home Button with tooltip */}
 <div className="relative group">
 <button
 onClick={goToLanding}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <Home className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">Home</div>
 </div>
 </div>

 {/* New Case Button with tooltip */}
 <div className="relative group">
 <button
 onClick={() => setCurrentPage('newCase')}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <Plus className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">New Case</div>
 </div>
 </div>
 </div>

 {!viewingCaseId ? (
 <div className="fade-in pt-6 px-36">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h2 className="text-2xl font-bold tracking-tight leading-tight">Case Management</h2>
 <p className="text-gray-600">{cases.length} investigation{cases.length !== 1 ? 's' : ''} on file</p>
 </div>
 <button
 onClick={startNewCase}
 className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold tracking-wide px-4 py-2 rounded-xl transition-colors"
 >
 <Plus className="w-4 h-4" />
 New Case
 </button>
 </div>

 {cases.length === 0 ? (
 <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
 <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
 <FolderOpen className="w-10 h-10 text-gray-400" />
 </div>
 <h3 className="text-xl font-bold tracking-tight mb-2 leading-tight">No Cases Yet</h3>
 <p className="text-base text-gray-600 leading-relaxed mb-6 max-w-md mx-auto">
 Start your first investigation by uploading evidence documents. 
 Marlowe will analyze and organize your findings.
 </p>
 <button
 onClick={startNewCase}
 className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold tracking-wide px-6 py-3 rounded-xl transition-colors"
 >
 <Plus className="w-5 h-5" />
 Start First Case
 </button>
 </div>
 ) : (
 <div className="grid gap-4">
 {cases.map((caseItem) => (
 <div key={caseItem.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all">
 {/* Case Header - Click to view case details */}
 <div
 onClick={() => editingCaseId !== caseItem.id && setViewingCaseId(caseItem.id)}
 className="p-6 cursor-pointer hover:bg-gray-50 transition-all group"
 >
 <div className="flex items-start gap-4">
 <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
 caseItem.riskLevel === 'CRITICAL' ? 'bg-red-600/20' :
 caseItem.riskLevel === 'HIGH' ? 'bg-rose-50 border border-rose-200' :
 caseItem.riskLevel === 'MEDIUM' ? 'bg-amber-50 border border-amber-200' :
 'bg-emerald-50 border border-emerald-200'
 }`}>
 <Folder className={`w-7 h-7 ${
 caseItem.riskLevel === 'CRITICAL' ? 'text-red-600' :
 caseItem.riskLevel === 'HIGH' ? 'text-rose-500' :
 caseItem.riskLevel === 'MEDIUM' ? 'text-amber-500' :
 'text-emerald-500'
 }`} />
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-3 mb-2">
 {editingCaseId === caseItem.id ? (
 <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
 <input
 ref={editInputRef}
 type="text"
 value={editingCaseName}
 onChange={(e) => setEditingCaseName(e.target.value)}
 onKeyDown={handleEditKeyPress}
 onBlur={saveEditedCaseName}
 className="flex-1 bg-gray-100 border border-amber-500 rounded-lg px-3 py-1.5 text-gray-900 text-lg font-semibold leading-tight focus:outline-none"
 />
 <button
 onClick={saveEditedCaseName}
 className="p-2 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors"
 >
 <Check className="w-4 h-4 text-gray-900" />
 </button>
 </div>
 ) : (
 <>
 <h3 className="text-lg font-semibold leading-tight">{caseItem.name}</h3>
 <button
 onClick={(e) => startEditingCase(caseItem, e)}
 className="p-1.5 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
 >
 <Pencil className="w-4 h-4 text-gray-500 hover:text-amber-500" />
 </button>
 <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide ${getRiskColor(caseItem.riskLevel)}`}>
 {caseItem.riskLevel} RISK
 </span>
 </>
 )}
 </div>

 <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">
 {caseItem.analysis?.executiveSummary?.overview || 'No summary available'}
 </p>

 <div className="flex items-center gap-4 text-xs text-gray-500">
 <span className="flex items-center gap-1">
 <FileText className="w-3.5 h-3.5" />
 {caseItem.files.length} docs
 </span>
 <span className="flex items-center gap-1">
 <MessageCircle className="w-3.5 h-3.5" />
 {caseItem.conversationTranscript?.length || 0} messages
 </span>
 <span className="flex items-center gap-1">
 <Download className="w-3.5 h-3.5" />
 {caseItem.pdfReports?.length || 0} reports
 </span>
 <span className="flex items-center gap-1">
 <Calendar className="w-3.5 h-3.5" />
 {new Date(caseItem.createdAt).toLocaleDateString()}
 </span>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={(e) => deleteCase(caseItem.id, e)}
 className="p-2 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
 >
 <Trash2 className="w-4 h-4 text-rose-500" />
 </button>
 <ChevronRight className="w-5 h-5 text-gray-400" />
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 ) : (
 /* Case Detail View */
 (() => {
   const viewingCase = getCaseById(viewingCaseId);
   if (!viewingCase) return null;
   return (
     <div className="fade-in pt-6 px-8 max-w-6xl mx-auto">
       {/* Back button and header */}
       <div className="flex items-center gap-4 mb-6">
         <button
           onClick={() => setViewingCaseId(null)}
           className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
         >
           <ChevronLeft className="w-5 h-5 text-gray-600" />
         </button>
         <div className="flex-1">
           <h2 className="text-2xl font-bold tracking-tight leading-tight">{viewingCase.name}</h2>
           <p className="text-gray-500 text-sm">Created {new Date(viewingCase.createdAt).toLocaleDateString()}</p>
         </div>
         <div className="flex items-center gap-3">
           <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${getRiskColor(viewingCase.riskLevel)}`}>
             {viewingCase.riskLevel} RISK
           </span>
           <button
             onClick={() => loadCase(viewingCase)}
             className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors"
           >
             <MessageCircle className="w-4 h-4" />
             Continue Investigation
           </button>
         </div>
       </div>

       {/* Stats Cards */}
       <div className="grid grid-cols-4 gap-4 mb-8">
         <div className="bg-white border border-gray-200 rounded-xl p-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
               <FileText className="w-5 h-5 text-blue-500" />
             </div>
             <div>
               <p className="text-2xl font-bold">{viewingCase.files?.length || 0}</p>
               <p className="text-xs text-gray-500">Documents</p>
             </div>
           </div>
         </div>
         <div className="bg-white border border-gray-200 rounded-xl p-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
               <MessageCircle className="w-5 h-5 text-amber-500" />
             </div>
             <div>
               <p className="text-2xl font-bold">{viewingCase.conversationTranscript?.length || 0}</p>
               <p className="text-xs text-gray-500">Messages</p>
             </div>
           </div>
         </div>
         <div className="bg-white border border-gray-200 rounded-xl p-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
               <Download className="w-5 h-5 text-emerald-500" />
             </div>
             <div>
               <p className="text-2xl font-bold">{viewingCase.pdfReports?.length || 0}</p>
               <p className="text-xs text-gray-500">Reports</p>
             </div>
           </div>
         </div>
         <div className="bg-white border border-gray-200 rounded-xl p-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
               <Network className="w-5 h-5 text-purple-500" />
             </div>
             <div>
               <p className="text-2xl font-bold">{viewingCase.networkArtifacts?.length || 0}</p>
               <p className="text-xs text-gray-500">Network Maps</p>
             </div>
           </div>
         </div>
       </div>

       {/* Main Content Grid */}
       <div className="grid grid-cols-3 gap-6">
         {/* Left Column - Chat History */}
         <div className="col-span-2 space-y-6">
           {/* Chat History */}
           <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
             <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
               <h3 className="font-semibold flex items-center gap-2">
                 <MessageCircle className="w-4 h-4 text-amber-500" />
                 Conversation History
               </h3>
               {viewingCase.conversationTranscript?.length > 0 && (
                 <span className="text-xs text-gray-500">{viewingCase.conversationTranscript.length} messages</span>
               )}
             </div>
             <div className="max-h-[500px] overflow-y-auto">
               {viewingCase.conversationTranscript?.length > 0 ? (
                 viewingCase.conversationTranscript.map((msg, idx) => (
                   <div key={idx} className={`p-4 border-b border-gray-50 last:border-0 ${msg.role === 'user' ? 'bg-amber-50/30' : ''}`}>
                     <div className="flex items-center gap-2 mb-2">
                       <span className={`text-xs font-semibold ${msg.role === 'user' ? 'text-amber-600' : 'text-gray-600'}`}>
                         {msg.role === 'user' ? 'You' : 'Marlowe'}
                       </span>
                       {msg.timestamp && (
                         <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleString()}</span>
                       )}
                     </div>
                     <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                   </div>
                 ))
               ) : (
                 <div className="p-8 text-center text-gray-500">
                   <MessageCircle className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                   <p className="text-sm">No conversation history yet</p>
                   <p className="text-xs text-gray-400 mt-1">Start an investigation to begin chatting</p>
                 </div>
               )}
             </div>
           </div>

           {/* Network Artifacts */}
           {viewingCase.networkArtifacts?.length > 0 && (
             <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
               <div className="px-5 py-4 border-b border-gray-100">
                 <h3 className="font-semibold flex items-center gap-2">
                   <Network className="w-4 h-4 text-purple-500" />
                   Network Maps
                 </h3>
               </div>
               <div className="p-4 grid gap-4">
                 {viewingCase.networkArtifacts.map((artifact, idx) => (
                   <div key={artifact.id || idx} className="border border-gray-200 rounded-lg p-4">
                     <div className="flex items-center justify-between mb-2">
                       <span className="font-medium text-sm">{artifact.name || `Network Map ${idx + 1}`}</span>
                       <span className="text-xs text-gray-500">{new Date(artifact.createdAt).toLocaleString()}</span>
                     </div>
                     {artifact.imageData && (
                       <img src={artifact.imageData} alt={artifact.name} className="w-full rounded-lg border border-gray-100" />
                     )}
                   </div>
                 ))}
               </div>
             </div>
           )}
         </div>

         {/* Right Column - Reports & Documents */}
         <div className="space-y-6">
           {/* PDF Reports */}
           <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
             <div className="px-5 py-4 border-b border-gray-100">
               <h3 className="font-semibold flex items-center gap-2">
                 <Download className="w-4 h-4 text-emerald-500" />
                 Saved Reports
               </h3>
             </div>
             <div className="p-4">
               {viewingCase.pdfReports?.length > 0 ? (
                 <div className="space-y-3">
                   {viewingCase.pdfReports.map((report, idx) => (
                     <div key={report.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <div className="flex items-center gap-3 min-w-0">
                         <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                           report.riskLevel === 'CRITICAL' ? 'bg-red-100' :
                           report.riskLevel === 'HIGH' ? 'bg-rose-100' :
                           report.riskLevel === 'MEDIUM' ? 'bg-amber-100' :
                           'bg-emerald-100'
                         }`}>
                           <FileText className={`w-4 h-4 ${
                             report.riskLevel === 'CRITICAL' ? 'text-red-600' :
                             report.riskLevel === 'HIGH' ? 'text-rose-500' :
                             report.riskLevel === 'MEDIUM' ? 'text-amber-500' :
                             'text-emerald-500'
                           }`} />
                         </div>
                         <div className="min-w-0">
                           <p className="text-sm font-medium text-gray-900 truncate">{report.name}</p>
                           <p className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleString()}</p>
                         </div>
                       </div>
                       <a
                         href={report.dataUri}
                         download={report.name}
                         className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium shrink-0"
                       >
                         <Download className="w-4 h-4" />
                       </a>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-6 text-gray-500">
                   <Download className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                   <p className="text-sm">No reports generated yet</p>
                   <p className="text-xs text-gray-400 mt-1">Generate reports during your investigation</p>
                 </div>
               )}
             </div>
           </div>

           {/* Uploaded Documents */}
           <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
             <div className="px-5 py-4 border-b border-gray-100">
               <h3 className="font-semibold flex items-center gap-2">
                 <FileText className="w-4 h-4 text-blue-500" />
                 Uploaded Documents
               </h3>
             </div>
             <div className="p-4">
               {viewingCase.files?.length > 0 ? (
                 <div className="space-y-2">
                   {viewingCase.files.map((file, idx) => (
                     <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                       <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                       <span className="text-sm text-gray-700 truncate">{file.name}</span>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-6 text-gray-500">
                   <FileText className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                   <p className="text-sm">No documents uploaded</p>
                 </div>
               )}
             </div>
           </div>

           {/* Case Actions */}
           <div className="bg-white border border-gray-200 rounded-xl p-4">
             <h3 className="font-semibold mb-4">Actions</h3>
             <div className="space-y-2">
               <button
                 onClick={() => loadCase(viewingCase)}
                 className="w-full flex items-center gap-2 justify-center bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2.5 rounded-lg transition-colors"
               >
                 <MessageCircle className="w-4 h-4" />
                 Continue Investigation
               </button>
               <button
                 onClick={() => {
                   if (window.confirm('Are you sure you want to delete this case?')) {
                     deleteCase(viewingCase.id);
                     setViewingCaseId(null);
                   }
                 }}
                 className="w-full flex items-center gap-2 justify-center border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium px-4 py-2.5 rounded-lg transition-colors"
               >
                 <Trash2 className="w-4 h-4" />
                 Delete Case
               </button>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 })()
 )}
 </>
 )}

 {/* Claude-like Conversational Interface */}
 {(currentPage === 'newCase' || currentPage === 'activeCase') && !analysis && (
 <div className="h-screen flex bg-[#f8f8f8]">
 {/* Left Icon Bar */}
 <div className="w-12 border-r border-gray-300 flex flex-col items-center pt-3 gap-2">
 {/* Home icon - at top */}
 <div className="relative group">
 <button
 onClick={goToLanding}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 title="Home"
 >
 <Home className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">Home</div>
 </div>
 </div>
 {/* Case Management folder - below home */}
 <div className="relative group">
 <button
 onClick={() => setCurrentPage('existingCases')}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 title="Case Management"
 >
 <FolderOpen className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">Case Management</div>
 </div>
 </div>
 {conversationStarted && (
 <div className="relative group">
 <button
 onClick={() => {
 setConversationMessages([]);
 setConversationStarted(false);
 setFiles([]);
 setCaseDescription('');
 setAnalysis(null);
 setActiveCase(null);
 setCurrentPage('newCase');
 }}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 title="New Case"
 >
 <Plus className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">New Case</div>
 </div>
 </div>
 )}
 </div>

 {/* Main Content Area */}
 <div className="flex-1 flex flex-col">
 {/* Top Bar */}
 <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300">
 <div className="flex items-center gap-2">
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => setDarkMode(!darkMode)}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 title={darkMode ? 'Light mode' : 'Dark mode'}
 >
 {darkMode ? <Sun className="w-4 h-4 text-gray-500" /> : <Moon className="w-4 h-4 text-gray-500" />}
 </button>

 </div>
 </div>

 {/* Chat Area - Centered input before conversation starts, bottom after */}
 {!conversationStarted ? (
 /* Centered Input - Before Conversation */
 <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
 <div className="w-full max-w-2xl -mt-32">
 <h1
  className="text-3xl font-semibold text-center mb-8 tracking-tight text-amber-600 drop-shadow-sm"
  style={{
    textShadow: '0 2px 8px rgba(217, 119, 6, 0.1)',
    letterSpacing: '-0.02em'
  }}
>{currentHeader}</h1>

 {/* Centered Input Box */}
 <div className="bg-white rounded-lg border-2 border-gray-400 p-4 shadow-sm">
 {files.length > 0 && (
 <div className="flex flex-wrap gap-2 mb-3">
 {files.map((file, idx) => (
 <div key={idx} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm">
 <FileText className="w-4 h-4" />
 <span className="max-w-40 truncate">{file.name}</span>
 <button onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="hover:text-red-500">
 <X className="w-3 h-3" />
 </button>
 </div>
 ))}
 </div>
 )}
 <textarea
 ref={mainInputRef}
 value={conversationInput}
 onChange={(e) => setConversationInput(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter' && !e.shiftKey && (conversationInput.trim() || files.length > 0)) {
 e.preventDefault();
 setConversationStarted(true);
 // Auto-create case on first message
 if (!currentCaseId) {
 createCaseFromFirstMessage(conversationInput, files);
 }
 sendConversationMessage(conversationInput, files);
 }
 }}
 placeholder="Describe what you're investigating, or upload documents..."
 rows={3}
 className="w-full resize-none bg-transparent focus:outline-none text-gray-900 text-lg"
 autoFocus
 />
 <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
 <div className="flex items-center gap-2">
 <input type="file" ref={fileInputRef} onChange={handleFileInput} multiple accept=".pdf,.doc,.docx,.txt,.csv,.xlsx" className="hidden" />
 <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500">
 <Plus className="w-5 h-5" />
 </button>
 </div>
 <button
 onClick={() => {
 if (conversationInput.trim() || files.length > 0) {
 setConversationStarted(true);
 // Auto-create case on first message
 if (!currentCaseId) {
 createCaseFromFirstMessage(conversationInput, files);
 }
 sendConversationMessage(conversationInput, files);
 }
 }}
 disabled={!conversationInput.trim() && files.length === 0}
 className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-colors flex items-center gap-2"
 >
 <Send className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Suggestions */}
 <div className="flex flex-wrap justify-center gap-2 mt-6">
 {[
 "Summarize the risks of this company/person",
 "Make a standard AML/KYC report for:",
 "Screen this entity for sanctions",
 "Analyze this transaction pattern",
 "Identify red flags in these financials",
 "Map the ownership structure"
 ].map((suggestion, idx) => (
 <button
 key={idx}
 onClick={() => setConversationInput(suggestion)}
 className="text-sm bg-white border border-gray-400 hover:border-amber-400 hover:bg-amber-50 px-4 py-2 rounded-full text-gray-600 transition-colors"
 >
 {suggestion}
 </button>
 ))}
 </div>
 </div>
 </div>
 ) : (
 /* After Conversation Started - Messages with Bottom Input */
 <>
 <div className="flex-1 overflow-y-auto px-4 py-3">
 <div className="max-w-3xl mx-auto space-y-3">
 {conversationMessages.map((msg, idx) => (
 <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
 <div className={`max-w-2xl ${msg.role === 'user' ? 'bg-amber-500 text-white rounded-2xl px-5 py-3' : ''}`}>
 {msg.role === 'user' && msg.files && msg.files.length > 0 && (
 <div className="flex flex-wrap gap-2 mb-2">
 {msg.files.map((fileName, fIdx) => (
 <span key={fIdx} className="text-xs bg-white/20 px-2 py-1 rounded flex items-center gap-1">
 <FileText className="w-3 h-3" />
 {fileName}
 </span>
 ))}
 </div>
 )}
 {msg.role === 'assistant' ? (
 <>
 <div className="whitespace-pre-wrap leading-relaxed prose prose-gray max-w-none [&_li]:cursor-pointer [&_div]:cursor-pointer"
 onClick={(e) => {
   console.log('Click detected:', e.target.tagName, e.target.className);
   // Handle document citations
   const docButton = e.target.closest('[data-doc-index]');
   if (docButton) {
     const docIndex = parseInt(docButton.getAttribute('data-doc-index'), 10) - 1;
     if (files[docIndex]) {
       setDocPreview({
         open: true,
         docIndex: docIndex + 1,
         docName: files[docIndex].name,
         content: files[docIndex].content || 'Content not available'
       });
     }
     return;
   }
   // Handle explore point clicks - check for any clickable element
   const explorePoint = e.target.closest('[data-explore-point]');
   console.log('Explore point:', explorePoint, explorePoint?.getAttribute('data-explore-point'));
   if (explorePoint) {
     const pointText = explorePoint.getAttribute('data-explore-point');
     if (pointText) {
       console.log('Setting input to:', pointText);
       setConversationInput(`Tell me more about: ${pointText}`);
       // Focus the input after a short delay to ensure state is updated
       setTimeout(() => {
         if (bottomInputRef.current) {
           bottomInputRef.current.focus();
         } else if (mainInputRef.current) {
           mainInputRef.current.focus();
         }
       }, 50);
     }
   }
 }}
 dangerouslySetInnerHTML={{ __html: formatAnalysisAsHtml(extractClickableOptions(msg.content).mainText) }}>
 </div>
 {/* Show action buttons after analysis responses */}
 {msg.content.includes('OVERALL RISK') && (
 <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
 <div className="flex items-center gap-2">
 <button
 className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm text-sm"
 >
 <Flag className="w-4 h-4" />
 Escalate Case
 </button>
 <button
 className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
 >
 <CheckCircle2 className="w-4 h-4" />
 Mark as Reviewed
 </button>
 <button
 className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
 >
 <MessageSquare className="w-4 h-4" />
 Add Note
 </button>
 <div className="relative group">
 <button
 className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
 >
 Keep Exploring
 <ChevronDown className="w-3 h-3" />
 </button>
 <div className="absolute left-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 min-w-72">
 {generateFollowUpSuggestions(msg.content).map((suggestion, suggIdx) => (
 <button
 key={suggIdx}
 onClick={() => sendConversationMessage(suggestion, [])}
 className="w-full text-left text-sm px-3 py-2 hover:bg-gray-50 rounded-md text-gray-700"
 >
 {suggestion}
 </button>
 ))}
 </div>
 </div>
 </div>
 <button
 onClick={() => exportMessageAsPdf(msg.content)}
 disabled={isGeneratingCaseReport}
 className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isGeneratingCaseReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
 Export PDF
 </button>
 </div>
 )}
 {extractClickableOptions(msg.content).options.length > 0 && (
 <div className="flex flex-wrap gap-2 mt-4">
 {extractClickableOptions(msg.content).options.map((option, optIdx) => (
 <button
 key={optIdx}
 onClick={() => setConversationInput(option)}
 className="text-sm bg-white border border-gray-200 hover:border-amber-400 hover:bg-amber-50 px-4 py-2.5 rounded-xl text-gray-700 transition-all shadow-sm hover:shadow"
 >
 {option}
 </button>
 ))}
 </div>
 )}
 </>
 ) : (
 <div className="whitespace-pre-wrap leading-relaxed">
 {msg.content}
 </div>
 )}
 </div>
 </div>
 ))}

 {isStreaming && (
 <div className="flex justify-start">
 <div className="max-w-2xl">
 <div className="prose prose-gray max-w-none [&_li]:cursor-pointer [&_div]:cursor-pointer whitespace-pre-wrap leading-relaxed"
 onClick={(e) => {
   // Handle document citations
   const docButton = e.target.closest('[data-doc-index]');
   if (docButton) {
     const docIndex = parseInt(docButton.getAttribute('data-doc-index'), 10) - 1;
     if (files[docIndex]) {
       setDocPreview({
         open: true,
         docIndex: docIndex + 1,
         docName: files[docIndex].name,
         content: files[docIndex].content || 'Content not available'
       });
     }
     return;
   }
   // Handle explore point clicks
   const explorePoint = e.target.closest('[data-explore-point]');
   if (explorePoint) {
     const pointText = explorePoint.getAttribute('data-explore-point');
     if (pointText) {
       setConversationInput(`Tell me more about: ${pointText}`);
       // Focus the input after a short delay to ensure state is updated
       setTimeout(() => {
         if (bottomInputRef.current) {
           bottomInputRef.current.focus();
         } else if (mainInputRef.current) {
           mainInputRef.current.focus();
         }
       }, 50);
     }
   }
 }}
 dangerouslySetInnerHTML={{ __html: formatAnalysisAsHtml(streamingText) || '<span class="text-gray-400 flex items-center gap-2"><span class="animate-pulse">●</span> Analyzing...</span>' }}>
 </div>
 </div>
 </div>
 )}
 <div ref={conversationEndRef} />
 </div>
 </div>

 {/* Bottom Input */}
 <div className="border-t border-gray-200 px-4 py-4">
 <div className="max-w-3xl mx-auto">
 {files.length > 0 && (
 <div className="flex flex-wrap gap-2 mb-3">
 {files.map((file, idx) => (
 <div key={idx} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm">
 <FileText className="w-4 h-4" />
 <span className="max-w-32 truncate">{file.name}</span>
 <button onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
 </div>
 ))}
 </div>
 )}
 <div className="flex items-end gap-3 bg-gray-50 rounded-2xl border border-gray-500 p-2">
 <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500">
 <Plus className="w-5 h-5" />
 </button>
 <textarea
 ref={bottomInputRef}
 value={conversationInput}
 onChange={(e) => {
 setConversationInput(e.target.value);
 e.target.style.height = 'auto';
 e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
 }}
 onKeyDown={(e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 sendConversationMessage(conversationInput, files);
 e.target.style.height = 'auto';
 }
 }}
 placeholder=""
 rows={1}
 className="flex-1 resize-none bg-transparent focus:outline-none text-gray-900 py-2"
 style={{ minHeight: '40px', maxHeight: '200px', overflow: 'auto' }}
 />
 <button
 onClick={() => sendConversationMessage(conversationInput, files)}
 disabled={isStreaming || (!conversationInput.trim() && files.length === 0)}
 className="p-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg transition-colors"
 >
 <Send className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 </>
 )}
 </div>
 </div>
 )}

 {/* New Case / Evidence Upload Section - DISABLED: Using Claude-like interface above */}
 {false && (currentPage === 'newCase' || currentPage === 'activeCase') && !analysis && (
          <>
 {/* Home Button and Case Management Button - Upper Left Corner */}
 <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
 {/* Home Button with tooltip */}
 <div className="relative group">
 <button
 onClick={goToLanding}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <Home className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">Home</div>
 </div>
 </div>

 {/* Case Management Button with tooltip */}
 <div className="relative group">
 <button
 onClick={() => setCurrentPage('existingCases')}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 title="Case Management"
 >
 <FolderOpen className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">Case Management</div>
 </div>
 </div>

          {/* Dark Mode Toggle with tooltip */}
          <div className="relative group">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-colors" />
              ) : (
                <Moon className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
              )}
            </button>
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">{darkMode ? 'Light Mode' : 'Dark Mode'}</div>
            </div>
          </div>
 </div>

          <div className="min-h-[calc(100vh-200px)] flex flex-col justify-start pt-6 px-48">
 <section className="mb-8 fade-in">
 {/* Main Prompt Box - Claude-style */}
 <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 mb-6">
 {/* Prompt Input */}
 <div className="relative">
 <textarea
 value={caseDescription}
 onChange={(e) => setCaseDescription(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 if (caseDescription.trim()) {
 analyzeEvidence();
 }
 }
 }}
                placeholder=""
                className="w-full bg-transparent text-gray-900 focus:outline-none resize-none text-base leading-relaxed min-h-[120px]"
 style={{ fontFamily: "'Inter', sans-serif" }}
 />
 {caseDescription.trim() === '' && (
 <div
 key={placeholderIndex}
 className="absolute top-0 left-0 text-gray-500 text-base leading-relaxed pointer-events-none animate-fadeInOut"
 style={{ fontFamily: "'Inter', sans-serif" }}
 >
 {placeholderExamples[placeholderIndex]}
 </div>
 )}
 </div>

 {/* Bottom Toolbar */}
 <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
 <div className="flex items-center gap-2">
 {/* Add Materials Button */}
 <div
 className="relative"
 onDragEnter={handleDrag}
 onDragLeave={handleDrag}
 onDragOver={handleDrag}
 onDrop={handleDrop}
 >
 <input
 ref={fileInputRef}
 type="file"
 multiple
 accept=".txt,.pdf,.doc,.docx,.csv,.json,.xml"
 onChange={handleFileInput}
 className="hidden"
 />
 <div className="relative" ref={uploadDropdownRef}>
 <button
 onClick={() => setShowUploadDropdown(!showUploadDropdown)}
 className="group p-2 hover:bg-gray-100 rounded-lg transition-all relative"
 >
 <Plus className="w-5 h-5 text-gray-600 group-hover:text-amber-500 transition-colors" />
 <span className={`absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-opacity pointer-events-none ${showUploadDropdown ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`}>
 Upload Materials
 </span>
 </button>

 {/* Upload Dropdown Menu */}
 {showUploadDropdown && (
 <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[200px]">
 <button
 onClick={() => {
 fileInputRef.current?.click();
 setShowUploadDropdown(false);
 }}
 className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
 >
 <Upload className="w-4 h-4 text-gray-500" />
 Upload from Computer
 </button>
 <button
 onClick={() => {
 handleGoogleDrivePicker();
 setShowUploadDropdown(false);
 }}
 className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
 >
 <svg className="w-4 h-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
 <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
 <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
 <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
 <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
 <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
 <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
 </svg>
 Import from Google Drive
 </button>
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <div className="flex items-center gap-0">
 {/* Mode Selector Dropdown */}
 <div className="relative group" ref={modeDropdownRef}>
 <button
 onClick={() => setShowModeDropdown(!showModeDropdown)}
 className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-300 text-white disabled:text-gray-500 font-medium tracking-wide px-2 py-2 rounded-l-lg transition-all flex items-center border-r border-amber-700"
 disabled={isAnalyzing}
 >
 <ChevronDown className="w-4 h-4" />
 </button>
 <span className={`absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-opacity pointer-events-none z-50 ${showModeDropdown ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`}>
 Select Mode
 </span>

 {showModeDropdown && (
 <div className="absolute top-full left-0 mt-2 w-48 bg-white/95 backdrop-blur-sm border border-gray-300/50 rounded-lg shadow-sm z-50">
 <button
 onClick={() => {
 setInvestigationMode('cipher');
 setShowModeDropdown(false);
 }}
 className={`w-full text-left px-3 py-2 hover:bg-gray-100/50 transition-colors border-b border-gray-200/50 rounded-t-lg ${
 investigationMode === 'cipher' ? 'bg-amber-50/50' : ''
 }`}
 >
 <div className="text-sm font-medium text-gray-900">Cipher</div>
 <div className="text-[10px] text-gray-500">Deep Investigations</div>
 </button>
 <button
 onClick={() => {
 setInvestigationMode('scout');
 setShowModeDropdown(false);
 }}
 className={`w-full text-left px-3 py-2 hover:bg-gray-100/50 transition-colors rounded-b-lg ${
 investigationMode === 'scout' ? 'bg-emerald-50/50' : ''
 }`}
 >
 <div className="text-sm font-medium text-gray-900">Scout</div>
 <div className="text-[10px] text-gray-500">Lightweight Screenings</div>
 </button>
 </div>
 )}
 </div>

 {/* Start Investigation Button */}
 <div className="relative group">
 <button
 onClick={analyzeEvidence}
 disabled={isAnalyzing || backgroundAnalysis.isRunning || (!caseDescription.trim() && files.length === 0)}
 className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-300 text-white disabled:text-gray-500 font-medium tracking-wide px-3 py-2 rounded-r-lg transition-all flex items-center disabled:opacity-50"
 >
 {(isAnalyzing || backgroundAnalysis.isRunning) ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <ArrowRight className="w-4 h-4" />
 )}
 </button>
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
 {isAnalyzing ? 'Analyzing...' : 'Begin Analysis'}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Uploaded Files */}
 {files.length > 0 && (
 <div className="mt-6">
 <p className="text-sm text-gray-700 leading-relaxed mb-3 mono">
 {files.length} DOCUMENT{files.length > 1 ? 'S' : ''} LOADED
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
 {files.map((file, idx) => (
 <div
 key={file.id}
 className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-3 group hover:border-gray-300 transition-colors"
 >
 <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
 <span className="mono text-xs tracking-wide text-amber-500">{idx + 1}</span>
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-medium text-sm leading-tight truncate">{file.name}</p>
 <p className="text-xs text-gray-600 mono tracking-wide mt-1">
 {(file.size / 1024).toFixed(1)} KB • {file.content.split(/\s+/).length} words
 </p>
 </div>
 <button
 onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
 className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
 >
 <X className="w-4 h-4 text-gray-600" />
 </button>
 </div>
 ))}
 </div>
 </div>
 )}
 </section>

 {/* Progress Card - Shows during analysis AND when complete (on this page) */}
 {(backgroundAnalysis.isRunning || backgroundAnalysis.isComplete) && (
   <div className="mt-4">
     <div className={`bg-white/50 backdrop-blur-sm border rounded-2xl p-6 ${backgroundAnalysis.isComplete ? 'border-emerald-300' : 'border-gray-200'}`}>
       {/* Case Name */}
       <div className="flex items-center gap-3 mb-4">
         <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${backgroundAnalysis.isComplete ? 'bg-emerald-100' : 'bg-amber-100'}`}>
           {backgroundAnalysis.isComplete ? (
             <CheckCircle2 className="w-5 h-5 text-emerald-600" />
           ) : (
             <Briefcase className="w-5 h-5 text-amber-600" />
           )}
         </div>
         <div>
           <h3 className="font-semibold text-gray-900">{backgroundAnalysis.caseName || 'Processing...'}</h3>
           <p className={`text-xs mono tracking-wide ${backgroundAnalysis.isComplete ? 'text-emerald-600' : 'text-gray-500'}`}>
             {backgroundAnalysis.isComplete ? 'ANALYSIS COMPLETE' : 'CASE ANALYSIS IN PROGRESS'}
           </p>
         </div>
       </div>

       {/* Progress Bar */}
       <div className="mb-4">
         <div className="flex justify-between items-center mb-2">
           <span className="text-sm text-gray-600">{backgroundAnalysis.currentStep}</span>
           <span className={`text-sm font-medium ${backgroundAnalysis.isComplete ? 'text-emerald-600' : 'text-amber-600'}`}>{backgroundAnalysis.progress}%</span>
         </div>
         <div className="w-full bg-gray-100 rounded-full h-2">
           <div
             className={`h-2 rounded-full transition-all duration-500 ease-out ${backgroundAnalysis.isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
             style={{ width: `${backgroundAnalysis.progress}%` }}
           />
         </div>
       </div>

       {/* Status / View Results */}
       {backgroundAnalysis.isComplete ? (
         <button
           onClick={() => {
             viewAnalysisResults();
           }}
           className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
         >
           <Eye className="w-4 h-4" />
           View Results
         </button>
       ) : (
         <div className="space-y-3">
           <div className="flex items-center justify-between text-sm">
             <div className="flex items-center gap-2 text-gray-500">
               <Clock className="w-4 h-4" />
               <span>~{Math.max(5, Math.round((100 - backgroundAnalysis.progress) * 0.3))} seconds remaining</span>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
               <span className="text-gray-600 mono text-xs">ANALYZING</span>
             </div>
           </div>
           <button
             onClick={cancelAnalysis}
             className="w-full border border-gray-300 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-600 font-medium py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
           >
             <X className="w-4 h-4" />
             Cancel Analysis
           </button>
         </div>
       )}
     </div>
   </div>
 )}
          </div>
          </>
 )}

 {/* Analysis Results */}
 {(currentPage === 'newCase' || currentPage === 'activeCase') && analysis && (
 <>
 {/* Top Left Navigation Buttons */}
 <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
 {/* Home Button with tooltip */}
 <div className="relative group">
 <button
 onClick={goToLanding}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <Home className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">Home</div>
 </div>
 </div>

 {/* Case Management Button with tooltip */}
 <div className="relative group">
 <button
 onClick={() => setCurrentPage('existingCases')}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 title="Case Management"
 >
 <FolderOpen className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">Case Management</div>
 </div>
 </div>

 {/* Dark Mode Toggle with tooltip */}
 <div className="relative group">
 <button
 onClick={() => setDarkMode(!darkMode)}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 {darkMode ? (
 <Sun className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-colors" />
 ) : (
 <Moon className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
 )}
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">{darkMode ? 'Light Mode' : 'Dark Mode'}</div>
 </div>
 </div>

 {/* User Menu with logout */}
 {isConfigured && user && (
 <div className="relative group">
 <button
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <User className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
 </button>
 <div className="absolute left-full ml-2 top-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
 <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-48">
 <div className="px-3 py-2 border-b border-gray-100">
 <p className="text-xs text-gray-500">Signed in as</p>
 <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
 </div>
 <button
 onClick={signOut}
 className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
 >
 <LogOut className="w-4 h-4" />
 Sign Out
 </button>
 </div>
 </div>
 </div>
 )}
 </div>

 <div className="fade-in flex pt-6 px-36">
 {/* Left Navigation Panel - Scrolls with page */}
 <div className="w-48 flex-shrink-0 pl-2 pr-1 py-8">
 <div className="sticky top-8 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-4">
 <div className="flex flex-col gap-1.5">
 {[
 { id: 'overview', label: 'Overview', icon: Eye },
 { id: 'entities', label: 'Entities', icon: Users },
 { id: 'typologies', label: 'Typologies', icon: Target },
 { id: 'hypotheses', label: 'Hypotheses', icon: Lightbulb },
 { id: 'network', label: 'Network', icon: Network },
 { id: 'timeline', label: 'Timeline', icon: Clock },
 { id: 'crossref', label: 'Cross-References', icon: Link2 },
 { id: 'evidence', label: 'Evidence', icon: FileText },
 ].filter(tab => {
 // Hide Timeline tab if there are no timeline events
 if (tab.id === 'timeline' && (!analysis.timeline || analysis.timeline.length === 0)) {
 return false;
 }
 // Hide Cross-References tab if no cross-refs or contradictions
 if (tab.id === 'crossref' && (!analysis.documentCrossReferences || analysis.documentCrossReferences.length === 0) && (!analysis.contradictions || analysis.contradictions.length === 0)) {
 return false;
 }
 return true;
 }).map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold transition-all ${
 activeTab === tab.id
 ? 'bg-amber-500 text-white shadow-lg'
 : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
 }`}
 >
 <tab.icon className="w-4 h-4 flex-shrink-0" />
 <span className="text-sm">{tab.label}</span>
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="flex-1 max-w-full mx-auto px-2">

 {/* Overview Tab */}
 {activeTab === 'overview' && (
 <div className="space-y-6">
 {/* Editable Case Name */}
 <div className="bg-white rounded-xl border border-gray-200 p-8">
 {isEditingCaseName ? (
 <input
 type="text"
 value={tempCaseName}
 onChange={(e) => setTempCaseName(e.target.value)}
 onBlur={() => {
 if (tempCaseName.trim()) {
 setCaseName(tempCaseName.trim());
 }
 setIsEditingCaseName(false);
 }}
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 if (tempCaseName.trim()) {
 setCaseName(tempCaseName.trim());
 }
 setIsEditingCaseName(false);
 } else if (e.key === 'Escape') {
 setIsEditingCaseName(false);
 }
 }}
 className="w-full text-2xl font-semibold text-gray-900 border-b-2 border-amber-500 focus:outline-none px-2 py-1"
 autoFocus
 />
 ) : (
 <div
 onClick={() => {
 setTempCaseName(caseName);
 setIsEditingCaseName(true);
 }}
 className="flex items-center gap-3 cursor-pointer group"
 >
 <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
 {caseName || 'Untitled Case'}
 </h2>
 <Pencil className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
 </div>
 )}
 <p className="text-sm text-gray-500 mt-2">Click to edit case name</p>
 </div>

 {/* 1. TOP-LEVEL SUMMARY */}
 <div className={`bg-white rounded-xl border-l-4 ${getRiskBorder(analysis.executiveSummary?.riskLevel)} p-8`}>
 <div className="flex items-center gap-3 mb-6">
 <span className={`px-4 py-2 rounded-lg text-sm font-bold tracking-wide mono ${getRiskColor(analysis.executiveSummary?.riskLevel)}`}>
 OVERALL RISK: {analysis.executiveSummary?.riskLevel || 'UNKNOWN'}
 </span>
 <button
 onClick={generateCaseReportPdf}
 disabled={isGeneratingCaseReport}
 className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
 >
 {isGeneratingCaseReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
 {isGeneratingCaseReport ? 'Generating...' : 'Export PDF'}
 </button>
 </div>
 <p className="text-xl font-medium text-gray-900 leading-relaxed mb-6">
 {analysis.executiveSummary?.oneLiner || (analysis.executiveSummary?.analysis ? analysis.executiveSummary.analysis.split('.')[0] + '.' : (analysis.executiveSummary?.overview ? analysis.executiveSummary.overview.split('.')[0] + '.' : ''))}
 </p>
 {(analysis.executiveSummary?.analysis || analysis.executiveSummary?.overview) && (
 <div className="prose prose-gray max-w-none [&_li]:cursor-pointer [&_div]:cursor-pointer">
 <div className="text-gray-700 leading-relaxed text-base whitespace-pre-line">
 {analysis.executiveSummary.analysis || analysis.executiveSummary.overview}
 </div>
 </div>
 )}
 </div>

 {/* 2. RED FLAGS SECTION */}
 {analysis.redFlags && analysis.redFlags.length > 0 && (
 <div className="bg-white rounded-xl border border-slate-200 p-6">
 <div className="flex items-center justify-between mb-3 pb-2 border-b border-red-100">
 <h3 className="text-lg font-semibold text-slate-800">Red Flags</h3>
 <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">{analysis.redFlags.length} identified</span>
 </div>
 <div className="space-y-6">
 {analysis.redFlags.map((flag, idx) => (
 <div key={flag.id || idx} className="pb-2 border-b border-slate-100 last:border-0 last:pb-0">
 <div className="flex items-start gap-2 mb-2">
   <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center font-bold">{idx + 1}</span>
   <h4 className="text-base font-medium text-slate-800">{flag.title}</h4>
 </div>
 {flag.quote && (
   <blockquote className="ml-8 my-2 border-l-3 border-cyan-500 bg-slate-50 pl-3 py-2 rounded-r">
     <p className="text-slate-600 italic text-sm leading-relaxed">"{flag.quote}"</p>
     {flag.citation && <p className="text-xs text-slate-500 mt-2 font-mono">— {flag.citation}</p>}
   </blockquote>
 )}
 {flag.translation && (
   <p className="ml-8 mt-2 text-sm text-slate-700 leading-relaxed">
     <span className="font-semibold text-amber-600">Translation:</span> {flag.translation}
   </p>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* 3. TYPOLOGIES TABLE */}
 {analysis.typologies && analysis.typologies.length > 0 && (
 <div className="bg-white rounded-xl border border-slate-200 p-6">
 <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
 <h3 className="text-lg font-semibold text-slate-800">Typologies</h3>
 <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{analysis.typologies.length} detected</span>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-slate-200">
 <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wide text-slate-500">Typology</th>
 <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wide text-slate-500">Indicators</th>
 </tr>
 </thead>
 <tbody>
 {analysis.typologies.map((typ, idx) => (
 <tr key={idx} className="border-b border-slate-100 last:border-0">
 <td className="py-4 px-4 font-medium text-slate-800 align-top">
   {typ.name}
 </td>
 <td className="py-4 px-4 text-slate-600 leading-relaxed">
 {Array.isArray(typ.indicators) ? typ.indicators.map((ind, i) => (
   <span key={i} className="inline-block mr-2 mb-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">{ind}</span>
 )) : typ.indicators}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Stats Grid */}
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 {[
 { label: 'Entities', value: analysis.entities?.length || 0, icon: Users, color: 'text-blue-600' },
 { label: 'Red Flags', value: analysis.redFlags?.length || 0, icon: AlertTriangle, color: 'text-red-600' },
 { label: 'Timeline Events', value: analysis.timeline?.length || 0, icon: Clock, color: 'text-emerald-600' },
 { label: 'Cross-Refs', value: (analysis.documentCrossReferences?.length || 0) + (analysis.contradictions?.length || 0), icon: Link2, color: 'text-purple-600' },
 { label: 'Hypotheses', value: analysis.hypotheses?.length || 0, icon: Lightbulb, color: 'text-amber-600' },
 ].map(stat => (
 <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
 <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
 <p className="text-4xl font-bold tracking-tight leading-tight">{stat.value}</p>
 <p className="text-xs text-gray-500 mono tracking-wide">{stat.label.toUpperCase()}</p>
 </div>
 ))}
 </div>

 {/* Next Steps */}
 {analysis.nextSteps && analysis.nextSteps.length > 0 && (
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <h3 className="text-lg font-semibold leading-tight mb-4 flex items-center gap-2">
 <ArrowRight className="w-5 h-5 text-amber-500" />
 Next Steps
 </h3>
 <div className="space-y-2">
 {analysis.nextSteps.map((step, idx) => (
 <div key={idx} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
 <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide mono shrink-0 ${getRiskColor(step.priority)}`}>
 {step.priority}
 </span>
 <div className="flex-1 text-sm text-gray-900">
 {step.action}
 {step.source && (
 <a href={step.source} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">[Source]</a>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 {/* Timeline Tab */}
 {activeTab === 'timeline' && (
 <div className="bg-white rounded-xl border border-slate-200 p-6">
 <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
 <h3 className="text-lg font-semibold text-slate-800">Timeline</h3>
 <span className="text-xs font-medium text-slate-500">{analysis.timeline?.length || 0} events</span>
 </div>

 <div className="relative">
 {/* Timeline line */}
 <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />

 <div className="space-y-6">
 {analysis.timeline?.map((event, idx) => (
 <div
 key={event.id || idx}
 className="relative pl-10 cursor-pointer group"
 onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
 >
 {/* Timeline dot */}
 <div className={`absolute left-1 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
   event.riskLevel === 'CRITICAL' || event.riskLevel === 'HIGH' ? 'bg-red-500' :
   event.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
 }`} />

 <div className={`pb-2 border-b border-slate-100 last:border-0 last:pb-0 ${
 selectedEvent?.id === event.id ? 'bg-slate-50 -mx-4 px-4 py-4 rounded-lg' : ''
 }`}>
 <div className="flex items-center gap-3 mb-2">
 <span className="text-xs font-mono text-slate-500">{event.date}</span>
 {event.riskLevel && (
 <span className={`px-2 py-0.5 rounded text-xs font-medium ${
   event.riskLevel === 'CRITICAL' || event.riskLevel === 'HIGH' ? 'bg-red-50 text-red-700' :
   event.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
 }`}>
 {event.riskLevel}
 </span>
 )}
 </div>

 <p className="text-sm text-slate-800 leading-relaxed">{event.event}</p>

 {selectedEvent?.id === event.id && (
 <div className="mt-4 space-y-3 fade-in">
 {event.significance && (
 <div>
 <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Significance</p>
 <p className="text-sm text-slate-700 leading-relaxed">{event.significance}</p>
 </div>
 )}

 {event.citations && event.citations.length > 0 && (
 <div>
 <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Sources</p>
 <div className="flex flex-wrap gap-2">
 {event.citations.map((citation, cidx) => (
 <span key={cidx} className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
 {citation}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* Cross-References Tab - Document Intelligence */}
 {activeTab === 'crossref' && (
 <div className="space-y-6">
 {/* Cross-Document References */}
 {analysis.documentCrossReferences && analysis.documentCrossReferences.length > 0 && (
 <div className="bg-white border border-gray-200 rounded-xl p-6">
 <h3 className="text-lg font-semibold leading-tight mb-4 flex items-center gap-2">
 <Link2 className="w-5 h-5 text-amber-500" />
 Cross-Document Findings
 </h3>
 <p className="text-sm text-gray-600 mb-6">Information that connects or conflicts across multiple documents</p>

 <div className="space-y-4">
 {analysis.documentCrossReferences.map((ref, idx) => (
 <div key={ref.id || idx} className={`border-l-4 ${
   ref.riskLevel === 'CRITICAL' ? 'border-red-500 bg-red-50' :
   ref.riskLevel === 'HIGH' ? 'border-rose-400 bg-rose-50' :
   ref.riskLevel === 'MEDIUM' ? 'border-amber-400 bg-amber-50' :
   'border-blue-400 bg-blue-50'
 } rounded-r-lg p-4`}>
 <div className="flex items-start justify-between mb-3">
   <h4 className="font-semibold text-gray-900">{ref.finding}</h4>
   <span className={`px-2 py-0.5 rounded text-xs font-bold ${getRiskColor(ref.riskLevel)}`}>
     {ref.riskLevel}
   </span>
 </div>

 <div className="grid md:grid-cols-2 gap-4 mb-3">
   <div className="bg-white/70 rounded-lg p-3">
     <p className="text-xs font-medium text-gray-500 mono uppercase tracking-wider mb-1">{ref.doc1?.citation || 'Document 1'}</p>
     <blockquote className="text-sm text-gray-700 italic border-l-2 border-gray-300 pl-3">
       "{ref.doc1?.quote}"
     </blockquote>
   </div>
   <div className="bg-white/70 rounded-lg p-3">
     <p className="text-xs font-medium text-gray-500 mono uppercase tracking-wider mb-1">{ref.doc2?.citation || 'Document 2'}</p>
     <blockquote className="text-sm text-gray-700 italic border-l-2 border-gray-300 pl-3">
       "{ref.doc2?.quote}"
     </blockquote>
   </div>
 </div>

 <p className="text-sm text-gray-700"><span className="font-medium">Significance:</span> {ref.significance}</p>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Contradictions */}
 {analysis.contradictions && analysis.contradictions.length > 0 && (
 <div className="bg-white border border-gray-200 rounded-xl p-6">
 <h3 className="text-lg font-semibold leading-tight mb-4 flex items-center gap-2">
 <AlertTriangle className="w-5 h-5 text-rose-500" />
 Contradictions Detected
 </h3>
 <p className="text-sm text-gray-600 mb-6">Information that directly conflicts between documents</p>

 <div className="space-y-4">
 {analysis.contradictions.map((contradiction, idx) => (
 <div key={contradiction.id || idx} className="border border-rose-200 bg-rose-50 rounded-lg p-4">
 <h4 className="font-semibold text-gray-900 mb-3">{contradiction.title || contradiction.description}</h4>

 <div className="grid md:grid-cols-2 gap-4 mb-3">
   <div className="bg-white rounded-lg p-3 border border-rose-100">
     <p className="text-xs font-medium text-rose-600 mono uppercase tracking-wider mb-1">
       {contradiction.source1?.citation || 'Source 1'}
     </p>
     {contradiction.source1?.context && (
       <p className="text-xs text-gray-500 mb-1">{contradiction.source1.context}</p>
     )}
     <blockquote className="text-sm text-gray-700 italic border-l-2 border-rose-300 pl-3">
       "{contradiction.source1?.quote || contradiction.source1}"
     </blockquote>
   </div>
   <div className="bg-white rounded-lg p-3 border border-rose-100">
     <p className="text-xs font-medium text-rose-600 mono uppercase tracking-wider mb-1">
       {contradiction.source2?.citation || 'Source 2'}
     </p>
     {contradiction.source2?.context && (
       <p className="text-xs text-gray-500 mb-1">{contradiction.source2.context}</p>
     )}
     <blockquote className="text-sm text-gray-700 italic border-l-2 border-rose-300 pl-3">
       "{contradiction.source2?.quote || contradiction.source2}"
     </blockquote>
   </div>
 </div>

 {contradiction.significance && (
   <p className="text-sm text-gray-700 mb-2"><span className="font-medium">Why this matters:</span> {contradiction.significance}</p>
 )}
 {contradiction.resolution && (
   <p className="text-sm text-gray-600"><span className="font-medium">To resolve:</span> {contradiction.resolution}</p>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Entity Aliases - Entity Resolution */}
 {analysis.entities && analysis.entities.some(e => e.aliases && e.aliases.length > 0) && (
 <div className="bg-white border border-gray-200 rounded-xl p-6">
 <h3 className="text-lg font-semibold leading-tight mb-4 flex items-center gap-2">
 <Users className="w-5 h-5 text-blue-500" />
 Entity Resolution
 </h3>
 <p className="text-sm text-gray-600 mb-6">Same entities appearing under different names across documents</p>

 <div className="space-y-3">
 {analysis.entities.filter(e => e.aliases && e.aliases.length > 0).map((entity, idx) => (
 <div key={entity.id || idx} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
   <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
     entity.type === 'PERSON' ? 'bg-blue-100' : 'bg-purple-100'
   }`}>
     {entity.type === 'PERSON' ? (
       <Users className="w-5 h-5 text-blue-600" />
     ) : (
       <Building2 className="w-5 h-5 text-purple-600" />
     )}
   </div>
   <div className="flex-1">
     <p className="font-semibold text-gray-900">{entity.name}</p>
     <div className="flex flex-wrap gap-2 mt-2">
       {entity.aliases.map((alias, aidx) => (
         <span key={aidx} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded">
           {alias}
         </span>
       ))}
     </div>
     {entity.citations && (
       <p className="text-xs text-gray-500 mt-2">Found in: {entity.citations.join(', ')}</p>
     )}
   </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Empty state */}
 {(!analysis.documentCrossReferences || analysis.documentCrossReferences.length === 0) &&
  (!analysis.contradictions || analysis.contradictions.length === 0) && (
 <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
 <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cross-References Detected</h3>
 <p className="text-gray-600">Upload multiple documents to enable cross-document analysis</p>
 </div>
 )}
 </div>
 )}

 {/* Entities Tab */}
 {activeTab === 'entities' && (
 <div className="grid lg:grid-cols-3 gap-6">
 {/* Entity List */}
 <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-4">
 <h3 className="text-xs font-medium text-gray-500 mono uppercase tracking-wider mb-4">
 EXTRACTED ENTITIES ({analysis.entities?.length || 0})
 </h3>
 <div className="space-y-2 max-h-[600px] overflow-y-auto">
 {analysis.entities?.map((entity, idx) => (
 <button
 key={entity.id || idx}
 onClick={() => setSelectedEntity(entity)}
 className={`w-full text-left p-5 rounded-lg transition-all ${
 selectedEntity?.id === entity.id
 ? 'bg-amber-50 border border-amber-200 border border-amber-500'
 : 'bg-gray-100/50 border border-gray-300 hover:border-gray-400'
 }`}
 >
 <div className="flex items-center gap-3">
 {entity.type === 'PERSON' && (
 <img
 src={`https://ui-avatars.com/api/?name=${encodeURIComponent(entity.name)}&background=d4af37&color=0a0a0f&size=64&bold=true`}
 alt={entity.name}
 className="w-10 h-10 rounded-full border border-gray-300"
 />
 )}
 <div className="flex-1 min-w-0">
 <span className="font-medium text-sm leading-tight block">{entity.name}</span>
 <span className="text-xs mono text-gray-500 tracking-wide">{entity.type}</span>
 </div>
 </div>
 </button>
 ))}
 </div>
 </div>

 {/* Entity Detail */}
 <div className="lg:col-span-2">
 {selectedEntity ? (
 <div className={`bg-white border-l-4 ${getRiskBorder(selectedEntity.riskLevel)} rounded-xl p-6 fade-in`}>
 <div className="flex items-start justify-between mb-6">
 <div className="flex items-start gap-4 flex-1">
 {selectedEntity.type === 'PERSON' && (
 <img
 src={`https://logo.clearbit.com/${encodeURIComponent(selectedEntity.name.toLowerCase().replace(/\s+/g, ''))}.com`}
 alt={selectedEntity.name}
 className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
 onError={(e) => {
 e.target.onerror = null;
 e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEntity.name)}&background=d4af37&color=0a0a0f&size=128&bold=true`;
 }}
 />
 )}
 <div>
 <h3 className="text-xl font-bold tracking-tight leading-tight">{selectedEntity.name}</h3>
 <p className="mono tracking-wide text-sm text-gray-600">{selectedEntity.type}</p>
 </div>
 </div>
 <span className={`px-3 py-1 rounded-full text-sm font-bold ${getRiskColor(selectedEntity.riskLevel)}`}>
 {selectedEntity.riskLevel} RISK
 </span>
 </div>

 <div className="space-y-6">
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2">Role in Investigation</h4>
 <p className="text-base text-gray-900 leading-relaxed">{selectedEntity.role}</p>
 </div>

 {/* Sanctions Status */}
 {selectedEntity.sanctionStatus && selectedEntity.sanctionStatus !== 'UNKNOWN' && (
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <Shield className="w-4 h-4" />
 Screening sanctions
 </h4>
 <div className={`p-5 rounded-lg border-2 ${
 selectedEntity.sanctionStatus === 'MATCH' ? 'bg-red-600/10 border-red-600' :
 selectedEntity.sanctionStatus === 'POTENTIAL_MATCH' ? 'bg-rose-500/10 border-rose-500' :
 'bg-emerald-500/10 border-emerald-500'
 }`}>
 <div className="flex items-center gap-2">
 {selectedEntity.sanctionStatus === 'MATCH' ? (
 <>
 <ShieldAlert className="w-5 h-5 text-red-600" />
 <span className="font-bold text-red-600 tracking-wide">SANCTIONED ENTITY</span>
 </>
 ) : selectedEntity.sanctionStatus === 'POTENTIAL_MATCH' ? (
 <>
 <AlertTriangle className="w-5 h-5 text-rose-500" />
 <span className="font-bold text-rose-500 tracking-wide">POTENTIAL SANCTIONS MATCH</span>
 </>
 ) : (
 <>
 <ShieldCheck className="w-5 h-5 text-emerald-500" />
 <span className="font-bold text-emerald-500 tracking-wide">NO SANCTIONS MATCH</span>
 </>
 )}
 </div>
 </div>
 </div>
 )}

 {/* PEP Status */}
 {selectedEntity.pepStatus && (
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <Flag className="w-4 h-4" />
 Political Exposure
 </h4>
 <div className="p-5 rounded-lg bg-purple-500/10 border-2 border-purple-500">
 <div className="flex items-center gap-2">
 <Flag className="w-5 h-5 text-purple-500" />
 <span className="font-bold text-purple-500 tracking-wide">POLITICALLY EXPOSED PERSON (PEP)</span>
 </div>
 </div>
 </div>
 )}

 {/* Ownership Portfolio Network Graph (for individuals) */}
 {selectedEntity.type === 'PERSON' && selectedEntity.ownedCompanies && selectedEntity.ownedCompanies.length > 0 && (
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <Network className="w-4 h-4" />
 Ownership Network ({selectedEntity.ownedCompanies.length} {selectedEntity.ownedCompanies.length === 1 ? 'Company' : 'Companies'})
 </h4>
 <div className="mb-2 p-3 bg-gray-100/50 rounded-lg">
 <div className="grid grid-cols-3 gap-2 text-xs">
 <div className="text-center">
 <span className="block text-lg font-bold text-gray-900">{selectedEntity.ownedCompanies.length}</span>
 <span className="text-gray-500">Total</span>
 </div>
 <div className="text-center">
 <span className="block text-lg font-bold text-rose-600">
 {selectedEntity.ownedCompanies.filter(c => c.ownershipPercent >= 50).length}
 </span>
 <span className="text-gray-500">Controlling</span>
 </div>
 <div className="text-center">
 <span className="block text-lg font-bold text-red-600">
 {selectedEntity.ownedCompanies.filter(c => c.sanctionedOwner).length}
 </span>
 <span className="text-gray-500">Sanctioned</span>
 </div>
 </div>
 </div>
 <OwnershipNetworkGraph
 centralEntity={selectedEntity.name}
 ownedCompanies={selectedEntity.ownedCompanies}
 height={280}
 />
 </div>
 )}

 {/* Beneficial Ownership Network Graph (for organizations) */}
 {selectedEntity.type === 'ORGANIZATION' && selectedEntity.beneficialOwners && selectedEntity.beneficialOwners.length > 0 && (
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <Network className="w-4 h-4" />
 Beneficial Ownership ({selectedEntity.beneficialOwners.length} {selectedEntity.beneficialOwners.length === 1 ? 'Owner' : 'Owners'})
 </h4>
 <div className="mb-2 p-3 bg-gray-100/50 rounded-lg">
 <div className="grid grid-cols-2 gap-2 text-xs">
 <div className="text-center">
 <span className="block text-lg font-bold text-gray-900">{selectedEntity.beneficialOwners.length}</span>
 <span className="text-gray-500">Total Owners</span>
 </div>
 <div className="text-center">
 <span className="block text-lg font-bold text-red-600">
 {selectedEntity.beneficialOwners.filter(o => o.sanctionStatus === 'SANCTIONED').length}
 </span>
 <span className="text-gray-500">Sanctioned</span>
 </div>
 </div>
 </div>
 <OwnershipNetworkGraph
 centralEntity={selectedEntity.name}
 beneficialOwners={selectedEntity.beneficialOwners}
 height={280}
 />
 </div>
 )}

 {/* Corporate Network Graph (for organizations with related entities) */}
 {selectedEntity.type === 'ORGANIZATION' && selectedEntity.corporateNetwork && selectedEntity.corporateNetwork.length > 0 && (
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <Network className="w-4 h-4" />
 Corporate Network ({selectedEntity.corporateNetwork.length} Related {selectedEntity.corporateNetwork.length === 1 ? 'Entity' : 'Entities'})
 </h4>
 <div className="mb-2 p-3 bg-gray-100/50 rounded-lg">
 <div className="grid grid-cols-2 gap-2 text-xs">
 <div className="text-center">
 <span className="block text-lg font-bold text-gray-900">{selectedEntity.corporateNetwork.length}</span>
 <span className="text-gray-500">Related Entities</span>
 </div>
 <div className="text-center">
 <span className="block text-lg font-bold text-red-600">
 {selectedEntity.corporateNetwork.filter(r => r.sanctionExposure === 'DIRECT').length}
 </span>
 <span className="text-gray-500">Direct Exposure</span>
 </div>
 </div>
 </div>
 <OwnershipNetworkGraph
 centralEntity={selectedEntity.name}
 corporateNetwork={selectedEntity.corporateNetwork}
 height={280}
 />
 </div>
 )}

 {selectedEntity.riskIndicators && selectedEntity.riskIndicators.length > 0 && (
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-amber-500" />
 Risk Indicators
 </h4>
 <div className="space-y-2">
 {selectedEntity.riskIndicators.map((indicator, idx) => (
 <div key={idx} className="flex items-start gap-2 bg-amber-500/10 p-5 rounded-lg">
 <FileWarning className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
 <span className="text-sm">{indicator}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {selectedEntity.citations && selectedEntity.citations.length > 0 && (
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <BookOpen className="w-4 h-4 text-amber-500" />
 Evidence Citations
 </h4>
 <div className="space-y-2">
 {selectedEntity.citations.map((citation, idx) => (
 <div key={idx} className="flex items-start gap-2 bg-gray-100 p-5 rounded-lg">
 <Link2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
 <span className="text-sm text-gray-600 leading-relaxed">{citation}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 ) : (
 <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
 <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-500">Select an entity to view details</p>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Typologies Tab */}
 {activeTab === 'typologies' && (
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
 <Target className="w-5 h-5 text-amber-500" />
 Financial Crime Typologies
 </h3>
 {analysis.typologies && analysis.typologies.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="border-b-2 border-gray-200">
 <th className="text-left py-3 px-4 font-semibold text-gray-700 w-1/4">Typology</th>
 <th className="text-left py-3 px-4 font-semibold text-gray-700">Indicators</th>
 </tr>
 </thead>
 <tbody>
 {analysis.typologies.map((typ, idx) => (
 <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
 <td className="py-4 px-4 font-medium text-gray-900 align-top">{typ.name}</td>
 <td className="py-4 px-4 text-gray-600">
 {Array.isArray(typ.indicators) ? (
 <ul className="list-disc list-inside space-y-1">
 {typ.indicators.map((ind, i) => (
 <li key={i}>{ind}</li>
 ))}
 </ul>
 ) : typ.indicators}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="text-center py-12">
 <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <h3 className="text-lg font-semibold leading-tight mb-2">No Typologies Identified</h3>
 <p className="text-gray-600">No specific financial crime typologies were detected in the evidence.</p>
 </div>
 )}
 </div>
 )}

 {/* Hypotheses Tab */}
 {activeTab === 'hypotheses' && (
 <div className={`bg-amber-50/30 ${sectionColors.hypotheses.border} rounded-xl p-6`}>
 <h3 className="text-lg font-bold text-amber-700 mb-4 flex items-center gap-2">
 <Lightbulb className="w-5 h-5 text-amber-500" />
 Investigative Hypotheses
 <span className="ml-auto text-sm font-normal bg-amber-500 text-white px-2 py-0.5 rounded-full">{analysis.hypotheses?.length || 0}</span>
 </h3>
 <div className="space-y-4">
 {analysis.hypotheses?.map((hypothesis, idx) => (
 <div
 key={hypothesis.id || idx}
 className="bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
 >
 <button
 onClick={() => setExpandedHypotheses(prev => ({
 ...prev,
 [hypothesis.id || idx]: !prev[hypothesis.id || idx]
 }))}
 className="w-full p-5 text-left flex items-center gap-4 hover:bg-amber-50/50 transition-colors"
 >
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-2">
 <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">{idx + 1}</span>
 <h3 className="text-base font-semibold leading-tight text-gray-900">{hypothesis.title}</h3>
 </div>
 <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 ml-9">{hypothesis.description}</p>
 </div>

 <div className="flex items-center gap-4">
 {/* Confidence meter - colored by level */}
 <div className="text-right">
 <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Confidence</p>
 <div className="flex items-center gap-2">
 <div className="w-20 h-2.5 bg-gray-200 rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full transition-all duration-500 ${getConfidenceColor(hypothesis.confidence || 0)}`}
 style={{ width: `${(hypothesis.confidence || 0) * 100}%` }}
 />
 </div>
 <span className={`text-sm font-bold ${
   (hypothesis.confidence || 0) >= 0.75 ? 'text-emerald-600' :
   (hypothesis.confidence || 0) >= 0.5 ? 'text-amber-600' :
   (hypothesis.confidence || 0) >= 0.25 ? 'text-orange-600' : 'text-red-600'
 }`}>
 {Math.round((hypothesis.confidence || 0) * 100)}%
 </span>
 </div>
 </div>

 {expandedHypotheses[hypothesis.id || idx]
 ? <ChevronDown className="w-5 h-5 text-amber-500" />
 : <ChevronRight className="w-5 h-5 text-gray-400" />
 }
 </div>
 </button>

 {expandedHypotheses[hypothesis.id || idx] && (
 <div className="px-5 pb-5 border-t border-amber-100 pt-4 fade-in bg-gray-50/50">
 <div className="grid md:grid-cols-3 gap-4">
 {/* Supporting Evidence */}
 <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
 <h4 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4" />
 Supporting Evidence
 </h4>
 <div className="space-y-2">
 {hypothesis.supportingEvidence?.map((evidence, eidx) => (
 <div key={eidx} className="text-sm bg-white p-3 rounded border-l-2 border-emerald-400">
 <span className="text-emerald-600 mr-1">✓</span> {evidence}
 </div>
 ))}
 </div>
 </div>

 {/* Contradicting Evidence */}
 <div className="bg-red-50 rounded-lg p-4 border border-red-200">
 <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
 <XCircle className="w-4 h-4" />
 Contradicting Evidence
 </h4>
 <div className="space-y-2">
 {hypothesis.contradictingEvidence?.map((evidence, eidx) => (
 <div key={eidx} className="text-sm bg-white p-3 rounded border-l-2 border-red-400">
 <span className="text-red-600 mr-1">✗</span> {evidence}
 </div>
 )) || <p className="text-sm text-gray-500 italic">None identified</p>}
 </div>
 </div>

 {/* Investigative Gaps */}
 <div>
 <h4 className="text-sm font-medium tracking-wide text-amber-600 mb-3 flex items-center gap-2">
 <HelpCircle className="w-4 h-4" />
 Investigative Gaps
 </h4>
 <div className="space-y-2">
 {hypothesis.investigativeGaps?.map((gap, gidx) => (
 <div key={gidx} className="text-sm bg-amber-500/10 p-5 rounded-lg">
 {gap}
 </div>
 )) || <p className="text-sm text-gray-500 leading-relaxed">None identified</p>}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Network Tab */}
 {activeTab === 'network' && (
 <div className="space-y-6">
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
 <Network className="w-6 h-6 text-amber-500" />
 Entity Relationship Network
 </h2>
 <p className="text-sm text-gray-600 mb-6">
 Visual representation of all entities and their relationships. Click on any node to select the entity.
 </p>

 <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
 <ForceGraph2D
 graphData={(() => {
 const nodes = [];
 const links = [];
 const nodeIdMap = new Map();

 // Add entity nodes
 if (analysis.entities) {
 analysis.entities.forEach(entity => {
 nodes.push({
 id: entity.id,
 name: entity.name,
 type: entity.type,
 riskLevel: entity.riskLevel || 'LOW',
 sanctionStatus: entity.sanctionStatus,
 role: entity.role
 });
 nodeIdMap.set(entity.name?.toLowerCase(), entity.id);
 });
 }

 const validNodeIds = new Set(nodes.map(n => n.id));

 // Add explicit relationships
 if (analysis.relationships) {
 analysis.relationships.forEach(rel => {
 // Support both old format (from/to) and new format (entity1/entity2)
 const entity1 = rel.from || rel.entity1;
 const entity2 = rel.to || rel.entity2;
 const relType = rel.type || rel.relationshipType || 'connected to';

 // Try to match by ID first, then by name
 let sourceId = validNodeIds.has(entity1) ? entity1 : nodeIdMap.get(entity1?.toLowerCase());
 let targetId = validNodeIds.has(entity2) ? entity2 : nodeIdMap.get(entity2?.toLowerCase());

 if (sourceId && targetId && validNodeIds.has(sourceId) && validNodeIds.has(targetId)) {
 links.push({
 source: sourceId,
 target: targetId,
 relationship: relType + (rel.percentage ? ` (${rel.percentage}%)` : ''),
 description: rel.description,
 strength: relType?.includes('owns') || relType?.includes('control') || rel.percentage >= 50 ? 3 : 1
 });
 }
 });
 }

 // Add ownership connections from entity data
 if (analysis.entities) {
 analysis.entities.forEach(entity => {
 // Ownership links
 if (entity.ownedCompanies?.length > 0) {
 entity.ownedCompanies.forEach(company => {
 const targetId = nodeIdMap.get(company.company?.toLowerCase());
 if (targetId && validNodeIds.has(entity.id)) {
 links.push({
 source: entity.id,
 target: targetId,
 relationship: `owns ${company.ownershipPercent}%`,
 description: `Ownership: ${company.ownershipPercent}%`,
 strength: company.ownershipPercent >= 50 ? 4 : 2,
 isOwnership: true
 });
 }
 });
 }

 // Beneficial ownership
 if (entity.beneficialOwners?.length > 0) {
 entity.beneficialOwners.forEach(owner => {
 const sourceId = nodeIdMap.get(owner.name?.toLowerCase());
 if (sourceId && validNodeIds.has(entity.id)) {
 const pct = owner.ownershipPercent || owner.percent || 0;
 links.push({
 source: sourceId,
 target: entity.id,
 relationship: `owns ${pct}%`,
 description: `Beneficial owner: ${pct}%`,
 strength: pct >= 50 ? 4 : 2,
 sanctioned: owner.sanctionStatus === 'MATCH'
 });
 }
 });
 }

 // Corporate network connections
 if (entity.corporateNetwork?.length > 0) {
 entity.corporateNetwork.forEach(related => {
 const targetId = nodeIdMap.get(related.entity?.toLowerCase());
 if (targetId && validNodeIds.has(entity.id) && validNodeIds.has(targetId)) {
 links.push({
 source: entity.id,
 target: targetId,
 relationship: related.relationship || 'related to',
 description: `Common owner: ${related.commonOwner || 'Unknown'}`,
 strength: related.sanctionExposure === 'DIRECT' ? 4 : 2,
 sanctioned: related.sanctionExposure === 'DIRECT'
 });
 }
 });
 }
 });
 }

 // Add connections from ownershipChains if available
 if (analysis.ownershipChains) {
 analysis.ownershipChains.forEach(chain => {
 const ownerId = nodeIdMap.get(chain.ultimateBeneficialOwner?.toLowerCase());
 const entityId = nodeIdMap.get(chain.controlledEntity?.toLowerCase());
 if (ownerId && entityId && validNodeIds.has(ownerId) && validNodeIds.has(entityId)) {
 links.push({
 source: ownerId,
 target: entityId,
 relationship: `controls ${chain.ownershipPercent}%`,
 description: chain.chain || `Ownership: ${chain.ownershipPercent}%`,
 strength: chain.ownershipPercent >= 50 ? 4 : 2,
 isOwnership: true
 });
 }
 });
 }

 // Remove duplicates
 const linkMap = new Map();
 links.forEach(link => {
 const key = `${link.source}-${link.target}`;
 if (!linkMap.has(key) || link.strength > linkMap.get(key).strength) {
 linkMap.set(key, link);
 }
 });

 return { nodes, links: Array.from(linkMap.values()) };
 })()}
 nodeLabel={node => `${node.name}\n${node.type}\nRisk: ${node.riskLevel}`}
 nodeColor={node => {
 if (node.sanctionStatus === 'MATCH') return '#dc2626';
 if (node.riskLevel === 'CRITICAL') return '#dc2626';
 if (node.riskLevel === 'HIGH') return '#f43f5e';
 if (node.riskLevel === 'MEDIUM') return '#f59e0b';
 return '#10b981';
 }}
 nodeVal={node => {
 if (node.sanctionStatus === 'MATCH') return 6;
 if (node.riskLevel === 'CRITICAL') return 5;
 if (node.riskLevel === 'HIGH') return 4;
 if (node.riskLevel === 'MEDIUM') return 3;
 return 2;
 }}
 linkLabel={link => link.relationship || link.description}
 linkDirectionalArrowLength={4}
 linkDirectionalArrowRelPos={1}
 linkColor={link => {
 if (link.sanctioned) return '#dc2626';
 if (link.isOwnership && link.strength >= 4) return '#f59e0b';
 if (link.isOwnership) return '#06b6d4';
 return '#6b7280';
 }}
 linkWidth={link => link.strength || 1}
 linkDirectionalParticles={link => link.strength >= 3 ? 1 : 0}
 linkDirectionalParticleWidth={2}
 backgroundColor="#f9fafb"
 nodeCanvasObject={(node, ctx, globalScale) => {
 const label = node.name;
 const fontSize = 10/globalScale;
 ctx.font = `${fontSize}px Sans-Serif`;
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';

 // Draw node circle
 const nodeRadius = Math.sqrt(node.riskLevel === 'CRITICAL' ? 5 : node.riskLevel === 'HIGH' ? 4 : node.riskLevel === 'MEDIUM' ? 3 : 2) * 1.5;
 ctx.beginPath();
 ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
 ctx.fillStyle = node.sanctionStatus === 'MATCH' ? '#dc2626' :
 node.riskLevel === 'CRITICAL' ? '#dc2626' :
 node.riskLevel === 'HIGH' ? '#f43f5e' :
 node.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981';
 ctx.fill();

 // Draw label
 ctx.fillStyle = '#111827';
 ctx.fillText(label, node.x, node.y + nodeRadius + 6);
 }}
 onNodeClick={(node) => {
 setSelectedEntity(node.id);
 setActiveTab('entities');
 }}
 cooldownTicks={100}
 onEngineStop={() => {}}
 />
 </div>

 {/* Legend */}
 <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-red-600"></div>
 <span className="text-sm text-gray-700">Critical Risk</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-rose-500"></div>
 <span className="text-sm text-gray-700">High Risk</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-amber-500"></div>
 <span className="text-sm text-gray-700">Medium Risk</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
 <span className="text-sm text-gray-700">Low Risk</span>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Evidence Tab */}
 {activeTab === 'evidence' && (
 <div className="space-y-6">
 {/* Add More Evidence Section */}
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-semibold leading-tight flex items-center gap-2">
 <Upload className="w-5 h-5 text-amber-500" />
 Add More Evidence
 </h3>
 {files.length > (activeCase?.files?.length || 0) && (
 <button
 onClick={analyzeEvidence}
 disabled={isAnalyzing}
 className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-lg font-medium tracking-wide transition-colors disabled:opacity-50"
 >
 {isAnalyzing ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <Zap className="w-4 h-4" />
 )}
 Re-analyze with New Evidence
 </button>
 )}
 </div>
 
 <div
 onDragEnter={handleDrag}
 onDragLeave={handleDrag}
 onDragOver={handleDrag}
 onDrop={handleDrop}
 onClick={() => fileInputRef.current?.click()}
 className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
 dragActive 
 ? 'border-amber-500 bg-amber-500/10' 
 : 'border-gray-300 hover:border-gray-400 hover:bg-gray-100/50'
 }`}
 >
 <input
 ref={fileInputRef}
 type="file"
 multiple
 onChange={handleFileInput}
 className="hidden"
 accept=".txt,.pdf,.doc,.docx,.csv,.json,.xml"
 />
 <Upload className={`w-10 h-10 mx-auto mb-3 ${dragActive ? 'text-amber-500' : 'text-gray-400'}`} />
 <p className="text-base text-gray-600 leading-relaxed mb-1">
 Drop additional files here or click to browse
 </p>
 <p className="text-xs text-gray-400">
 TXT, PDF, DOC, DOCX, CSV, JSON, XML supported
 </p>
 </div>
 
 {files.length > (activeCase?.files?.length || 0) && (
 <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
 <p className="text-sm text-amber-600 flex items-center gap-2">
 <AlertTriangle className="w-4 h-4" />
 {files.length - (activeCase?.files?.length || 0)} new file(s) added. Click "Re-analyze with New Evidence" to update the analysis.
 </p>
 </div>
 )}
 </div>

 {/* Source Documents */}
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <h3 className="text-lg font-semibold leading-tight mb-4 flex items-center gap-2">
 <FileText className="w-5 h-5 text-amber-500" />
 Source Documents ({files.length})
 </h3>
 <div className="space-y-4">
 {files.map((file, idx) => (
 <div key={file.id} className="border border-gray-300 rounded-lg overflow-hidden">
 <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <span className="w-8 h-8 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center mono tracking-wide text-amber-500 text-sm font-bold">
 {idx + 1}
 </span>
 <div>
 <p className="font-medium tracking-wide">{file.name}</p>
 <p className="text-xs text-gray-500 mono tracking-wide">
 {(file.size / 1024).toFixed(1)} KB • Uploaded {new Date(file.uploadedAt).toLocaleString()}
 </p>
 </div>
 </div>
 <button
 onClick={() => removeFile(file.id)}
 className="p-2 text-gray-500 hover:text-rose-600 hover:bg-gray-200 rounded-lg transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 <div className="p-4 bg-white/50">
 <pre className="text-sm text-gray-600 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
 {file.content}
 </pre>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </>
 )}

 </main>

 {/* Chat Panel - Only visible when analysis is complete */}
 {(currentPage === 'newCase' || currentPage === 'activeCase') && analysis && (
 <>
 {/* Chat Toggle Button */}
 {!chatOpen && (
 <button
 onClick={() => setChatOpen(true)}
 className="fixed bottom-6 right-6 w-14 h-14 bg-amber-500 hover:bg-amber-400 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 glow-amber z-50 group"
 >
 <MessageCircle className="w-6 h-6 text-gray-900" />
 <span className="absolute right-full mr-3 bg-gray-100 text-gray-900 text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
 Ask Marlowe
 </span>
 </button>
 )}

 {/* Chat Window */}
 {chatOpen && (
 <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white border border-gray-300 rounded-2xl shadow-2xl flex flex-col z-50 fade-in overflow-hidden">
 {/* Chat Header */}
 <div className="bg-gray-100 px-4 py-3 flex items-center justify-between border-b border-gray-300">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
 <MessageCircle className="w-4 h-4 text-gray-900" />
 </div>
 <div>
 <p className="font-semibold tracking-wide text-sm">Ask Marlowe</p>
 <p className="text-xs text-gray-500">Investigative Assistant</p>
 </div>
 </div>
 <button
 onClick={() => setChatOpen(false)}
 className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
 >
 <Minimize2 className="w-4 h-4 text-gray-600" />
 </button>
 </div>

 {/* Chat Messages */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4">
 {chatMessages.length === 0 && (
 <div className="text-center py-8">
 <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <Shield className="w-6 h-6 text-amber-500" />
 </div>
 <p className="text-gray-600 text-sm mb-4">
 Ask me anything about this case
 </p>
 <div className="space-y-2">
 {[
 "Who are the key suspects?",
 "What's the strongest evidence?",
 "Are there any gaps in the timeline?",
 "What should I investigate next?"
 ].map((suggestion, idx) => (
 <button
 key={idx}
 onClick={() => {
 setChatInput(suggestion);
 }}
 className="block w-full text-left text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-gray-600 transition-colors"
 >
 {suggestion}
 </button>
 ))}
 </div>
 </div>
 )}

 {chatMessages.map((msg, idx) => (
 <div
 key={idx}
 className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
 >
 <div
 className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
 msg.role === 'user'
 ? 'bg-amber-500 text-gray-900'
 : 'bg-gray-100 text-gray-800'
 }`}
 >
 <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
 </div>
 </div>
 ))}

 {isChatLoading && (
 <div className="flex justify-start">
 <div className="bg-gray-100 rounded-2xl px-4 py-3">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
 <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
 <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
 </div>
 </div>
 </div>
 )}

 <div ref={chatEndRef} />
 </div>

 {/* Chat Input */}
 <div className="p-3 border-t border-gray-300">
 <div className="flex items-center gap-2">
 <input
 type="text"
 value={chatInput}
 onChange={(e) => setChatInput(e.target.value)}
 onKeyPress={handleChatKeyPress}
 placeholder="Ask about the case..."
 className="flex-1 bg-gray-100 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder-gray-400"
 />
 <button
 onClick={sendChatMessage}
 disabled={!chatInput.trim() || isChatLoading}
 className="w-10 h-10 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-300 rounded-xl flex items-center justify-center transition-colors"
 >
 <Send className="w-4 h-4 text-gray-900" />
 </button>
 </div>
 </div>
 </div>
 )}
 </>
 )}

 {/* KYC Chat - Fixed Position (only shows on KYC results page) */}
 {currentPage === 'kycScreening' && kycPage === 'results' && kycResults && (
 <>
 {/* KYC Chat Floating Button */}
 {!kycChatOpen && (
 <button
 onClick={() => setKycChatOpen(true)}
 className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-110 z-40"
 >
 <MessageCircle className="w-6 h-6 text-gray-900" />
 </button>
 )}

 {/* KYC Chat Panel */}
 {kycChatOpen && (
 <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white border border-gray-300 rounded-2xl shadow-2xl flex flex-col z-50 fade-in overflow-hidden">
 {/* Chat Header */}
 <div className="flex items-center justify-between p-4 border-b border-gray-200">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
 <MessageCircle className="w-5 h-5 text-emerald-500" />
 </div>
 <div>
 <h3 className="font-semibold">Scout Assistant</h3>
 <p className="text-xs text-gray-500">Ask about the screening</p>
 </div>
 </div>
 <button
 onClick={() => setKycChatOpen(false)}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <Minimize2 className="w-5 h-5 text-gray-600" />
 </button>
 </div>

 {/* Chat Messages */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4">
 {kycChatMessages.length === 0 && (
 <div className="text-center py-8">
 <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
 <p className="text-gray-600 text-sm mb-4">
 Ask questions about this screening
 </p>
 <div className="space-y-2">
 {[
 "What are the main risk factors?",
 "Explain the sanctions findings",
 "What due diligence is recommended?",
 "Are there any ownership concerns?"
 ].map((suggestion, idx) => (
 <button
 key={idx}
 onClick={() => {
 setKycChatInput(suggestion);
 }}
 className="block w-full text-left text-xs bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 text-gray-600 transition-colors"
 >
 {suggestion}
 </button>
 ))}
 </div>
 </div>
 )}
 
 {kycChatMessages.map((msg, idx) => (
 <div
 key={idx}
 className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
 >
 <div
 className={`max-w-[80%] rounded-2xl px-4 py-3 ${
 msg.role === 'user'
 ? 'bg-emerald-500 text-gray-900'
 : 'bg-gray-100 text-gray-800'
 }`}
 >
 <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
 </div>
 </div>
 ))}
 
 {isKycChatLoading && (
 <div className="flex justify-start">
 <div className="bg-gray-100 rounded-2xl px-4 py-3">
 <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
 </div>
 </div>
 )}
 
 <div ref={kycChatEndRef} />
 </div>

 {/* Chat Input */}
 <div className="p-4 border-t border-gray-200">
 <div className="flex gap-2">
 <input
 type="text"
 value={kycChatInput}
 onChange={(e) => setKycChatInput(e.target.value)}
 onKeyPress={(e) => e.key === 'Enter' && sendKycChatMessage()}
 placeholder="Ask about this screening..."
 className="flex-1 bg-gray-100 border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-400"
 />
 <button
 onClick={sendKycChatMessage}
 disabled={!kycChatInput.trim() || isKycChatLoading}
 className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-300 text-gray-900 disabled:text-gray-500 p-2 rounded-xl transition-colors"
 >
 <Send className="w-5 h-5" />
 </button>
 </div>
 </div>
 </div>
 )}
 </>
 )}

 {/* Floating Results Ready Notification - only shows when user is NOT on newCase page */}
 {backgroundAnalysis.isComplete && !notificationDismissed && currentPage !== 'newCase' && (
   <div className="fixed bottom-20 right-6 z-50 animate-slideUp">
     <div className="bg-white border border-emerald-200 rounded-xl shadow-xl p-4 max-w-sm">
       <div className="flex items-start gap-3">
         <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
           <CheckCircle2 className="w-5 h-5 text-emerald-600" />
         </div>
         <div className="flex-1 min-w-0">
           <h4 className="font-semibold text-gray-900 text-sm">Analysis Complete</h4>
           <p className="text-xs text-gray-500 truncate">{backgroundAnalysis.caseName}</p>
         </div>
         <button
           onClick={() => setNotificationDismissed(true)}
           className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
         >
           <X className="w-4 h-4 text-gray-400" />
         </button>
       </div>
       <button
         onClick={() => {
           setCurrentPage('newCase'); // Navigate to results page
           viewAnalysisResults();
           setNotificationDismissed(false); // Reset for next time
         }}
         className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
       >
         <Eye className="w-4 h-4" />
         View Results
       </button>
     </div>
   </div>
 )}

 {/* Document Preview Modal */}
 {docPreview.open && (
 <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDocPreview({ open: false, docIndex: null, docName: '', content: '' })}>
 <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
 <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
 <div>
 <h3 className="text-base font-medium text-gray-800">Document {docPreview.docIndex}</h3>
 <p className="text-sm text-gray-500">{docPreview.docName}</p>
 </div>
 <button onClick={() => setDocPreview({ open: false, docIndex: null, docName: '', content: '' })} className="p-2 hover:bg-gray-100 rounded-md transition-colors">
 <X className="w-4 h-4 text-gray-500" />
 </button>
 </div>
 <div className="flex-1 overflow-y-auto p-6">
 <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">{docPreview.content}</pre>
 </div>
 </div>
 </div>
 )}

 {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white py-3 text-center text-xs text-gray-400">
 <p>Marlowe Investigative Intelligence</p>
 </footer>
 </div>
 );
}
