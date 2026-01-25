// ComplianceReportPDF.js - Professional Compliance Screening Report PDF
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts (using built-in Helvetica)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
  ]
});

// Color palette matching the UI
const colors = {
  critical: '#DC2626',
  criticalBg: '#FEE2E2',
  high: '#EA580C',
  highBg: '#FFEDD5',
  medium: '#D97706',
  mediumBg: '#FEF3C7',
  low: '#16A34A',
  lowBg: '#DCFCE7',
  unknown: '#6B7280',
  unknownBg: '#F3F4F6',
  slate900: '#0F172A',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  amber500: '#F59E0B',
  amberBg: '#FFFBEB',
  amberBorder: '#FCD34D',
  white: '#FFFFFF',
};

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: colors.white,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.slate200,
  },
  logoPlaceholder: {
    width: 60,
    height: 24,
    backgroundColor: colors.slate900,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  logoText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.slate900,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 8,
    color: colors.slate500,
  },
  // Case info bar
  caseInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.slate100,
    padding: 10,
    borderRadius: 4,
    marginBottom: 20,
  },
  caseNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.slate700,
  },
  confidential: {
    fontSize: 8,
    color: colors.critical,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  // Risk Badge
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  // Entity Summary Box
  entityBox: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 6,
    padding: 15,
    marginBottom: 20,
  },
  entityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.slate900,
    marginBottom: 4,
  },
  entityType: {
    fontSize: 10,
    color: colors.slate600,
    marginBottom: 8,
  },
  entityMetaRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  entityMetaItem: {
    marginRight: 20,
  },
  entityMetaLabel: {
    fontSize: 8,
    color: colors.slate500,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  entityMetaValue: {
    fontSize: 10,
    color: colors.slate700,
    fontWeight: 'bold',
  },
  // Section
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.slate900,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  // Red Flag Card
  redFlagCard: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  redFlagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: colors.criticalBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  redFlagIcon: {
    width: 20,
    height: 20,
    backgroundColor: colors.critical,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  redFlagIconText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  redFlagCategory: {
    fontSize: 8,
    color: colors.critical,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  redFlagContent: {
    padding: 12,
  },
  redFlagTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.slate900,
    marginBottom: 8,
  },
  redFlagFact: {
    fontSize: 9,
    color: colors.slate700,
    lineHeight: 1.5,
    marginBottom: 10,
  },
  // Compliance Impact Box
  complianceImpact: {
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  translationLabel: {
    fontSize: 8,
    color: colors.amber500,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  translationText: {
    fontSize: 9,
    color: colors.slate700,
    lineHeight: 1.4,
  },
  // Sources
  sourcesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  sourceLabel: {
    fontSize: 8,
    color: colors.slate500,
    marginRight: 5,
  },
  sourceTag: {
    backgroundColor: colors.slate200,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 5,
    marginBottom: 3,
  },
  sourceTagText: {
    fontSize: 7,
    color: colors.slate600,
  },
  // Summary section
  summaryBox: {
    backgroundColor: colors.slate900,
    borderRadius: 6,
    padding: 15,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 9,
    color: colors.slate200,
    lineHeight: 1.5,
  },
  summaryStats: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.slate700,
  },
  summaryStat: {
    marginRight: 25,
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  summaryStatLabel: {
    fontSize: 8,
    color: colors.slate400,
    textTransform: 'uppercase',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
  },
  footerLeft: {
    fontSize: 7,
    color: colors.slate500,
  },
  footerCenter: {
    fontSize: 8,
    color: colors.critical,
    fontWeight: 'bold',
  },
  footerRight: {
    fontSize: 7,
    color: colors.slate500,
  },
  // Disclaimer
  disclaimer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: colors.slate100,
    borderRadius: 4,
  },
  disclaimerTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.slate700,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 7,
    color: colors.slate600,
    lineHeight: 1.4,
  },
  // Analyst info
  analystBox: {
    marginTop: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 4,
  },
  analystLabel: {
    fontSize: 8,
    color: colors.slate500,
    marginBottom: 2,
  },
  analystValue: {
    fontSize: 10,
    color: colors.slate700,
  },
});

// Helper to get risk colors
const getRiskColors = (level) => {
  const riskLevel = level?.toLowerCase() || 'unknown';
  switch (riskLevel) {
    case 'critical':
      return { bg: colors.criticalBg, text: colors.critical };
    case 'high':
      return { bg: colors.highBg, text: colors.high };
    case 'medium':
      return { bg: colors.mediumBg, text: colors.medium };
    case 'low':
      return { bg: colors.lowBg, text: colors.low };
    default:
      return { bg: colors.unknownBg, text: colors.unknown };
  }
};

// The PDF Document Component
const ComplianceReportPDF = ({ data }) => {
  const {
    caseNumber = 'SCR-2026-00000',
    riskLevel = 'unknown',
    entity = {},
    metadata = {},
    redFlags = [],
    summary = '',
    analystName = 'Compliance Analyst',
    generatedAt = new Date().toISOString(),
  } = data || {};

  const riskColors = getRiskColors(riskLevel);
  const formattedDate = new Date(generatedAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>COMPLIANCE SCREENING REPORT</Text>
            <Text style={styles.timestamp}>Generated: {formattedDate}</Text>
          </View>
        </View>

        {/* Case Info Bar */}
        <View style={styles.caseInfoBar}>
          <Text style={styles.caseNumber}>Case Reference: {caseNumber}</Text>
          <Text style={styles.confidential}>Confidential - Internal Use Only</Text>
        </View>

        {/* Risk Level Badge */}
        <View style={[styles.riskBadge, { backgroundColor: riskColors.bg }]}>
          <Text style={[styles.riskBadgeText, { color: riskColors.text }]}>
            {riskLevel.toUpperCase()} RISK
          </Text>
        </View>

        {/* Entity Summary Box */}
        <View style={styles.entityBox}>
          <Text style={styles.entityName}>{entity.name || 'Unknown Entity'}</Text>
          <Text style={styles.entityType}>{entity.type || 'Entity Type Unknown'}</Text>

          <View style={styles.entityMetaRow}>
            {entity.status && (
              <View style={styles.entityMetaItem}>
                <Text style={styles.entityMetaLabel}>Status</Text>
                <Text style={styles.entityMetaValue}>{entity.status}</Text>
              </View>
            )}
            {metadata.designation && (
              <View style={styles.entityMetaItem}>
                <Text style={styles.entityMetaLabel}>Designation</Text>
                <Text style={styles.entityMetaValue}>{metadata.designation}</Text>
              </View>
            )}
            {metadata.jurisdiction && (
              <View style={styles.entityMetaItem}>
                <Text style={styles.entityMetaLabel}>Jurisdiction</Text>
                <Text style={styles.entityMetaValue}>{metadata.jurisdiction}</Text>
              </View>
            )}
            {metadata.lastUpdated && (
              <View style={styles.entityMetaItem}>
                <Text style={styles.entityMetaLabel}>Last Updated</Text>
                <Text style={styles.entityMetaValue}>{metadata.lastUpdated}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Summary Box */}
        {summary && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Executive Summary</Text>
            <Text style={styles.summaryText}>{summary}</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{redFlags.length}</Text>
                <Text style={styles.summaryStatLabel}>Red Flags</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{riskLevel.toUpperCase()}</Text>
                <Text style={styles.summaryStatLabel}>Risk Level</Text>
              </View>
            </View>
          </View>
        )}

        {/* Red Flags Section */}
        {redFlags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>COMPLIANCE RED FLAGS ({redFlags.length})</Text>

            {redFlags.map((flag, index) => (
              <View key={index} style={styles.redFlagCard} wrap={false}>
                {/* Flag Header */}
                <View style={styles.redFlagHeader}>
                  <View style={styles.redFlagIcon}>
                    <Text style={styles.redFlagIconText}>!</Text>
                  </View>
                  <Text style={styles.redFlagCategory}>{flag.category || 'Red Flag'}</Text>
                </View>

                {/* Flag Content */}
                <View style={styles.redFlagContent}>
                  <Text style={styles.redFlagTitle}>{flag.title}</Text>

                  {flag.fact && (
                    <Text style={styles.redFlagFact}>{flag.fact}</Text>
                  )}

                  {/* Compliance Impact */}
                  {flag.complianceImpact && (
                    <View style={styles.complianceImpact}>
                      <Text style={styles.translationLabel}>Translation</Text>
                      <Text style={styles.translationText}>{flag.complianceImpact}</Text>
                    </View>
                  )}

                  {/* Sources */}
                  {flag.sources && flag.sources.length > 0 && (
                    <View style={styles.sourcesContainer}>
                      <Text style={styles.sourceLabel}>Sources:</Text>
                      {flag.sources.map((source, sIndex) => (
                        <View key={sIndex} style={styles.sourceTag}>
                          <Text style={styles.sourceTagText}>{source}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Analyst Info */}
        <View style={styles.analystBox}>
          <Text style={styles.analystLabel}>Report Generated By</Text>
          <Text style={styles.analystValue}>{analystName}</Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            This compliance screening report is generated for internal compliance purposes only.
            The information contained herein is based on available data sources and should be
            verified independently before making any compliance decisions. This report does not
            constitute legal advice. The screening results should be reviewed by qualified
            compliance personnel in accordance with applicable regulations and internal policies.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>Marlowe Compliance Platform</Text>
          <Text style={styles.footerCenter}>CONFIDENTIAL</Text>
          <Text style={styles.footerRight} render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
};

export default ComplianceReportPDF;
