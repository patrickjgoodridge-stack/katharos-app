// ComplianceReportPDF.js - Structured compliance screening report
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';

const colors = {
  CRITICAL: { bg: '#DC2626', light: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
  HIGH: { bg: '#EA580C', light: '#FFF7ED', border: '#FED7AA', text: '#9A3412' },
  MEDIUM: { bg: '#D97706', light: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
  LOW: { bg: '#16A34A', light: '#F0FDF4', border: '#BBF7D0', text: '#166534' },
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerBrand: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#94A3B8',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerSubject: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  headerMeta: {
    fontSize: 8,
    color: '#64748B',
    textAlign: 'right',
  },
  headerDivider: {
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
    marginBottom: 16,
    marginTop: 10,
  },
  // Risk banner
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 6,
    marginBottom: 10,
  },
  riskLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  riskScore: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  // Onboarding banner
  onboardingBanner: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 16,
  },
  onboardingLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  onboardingValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  // Section
  sectionContainer: {
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 5,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748B',
    marginLeft: 6,
  },
  // Key-value row
  kvRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingVertical: 2,
  },
  kvLabel: {
    width: 120,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748B',
  },
  kvValue: {
    flex: 1,
    fontSize: 9,
    color: '#1E293B',
  },
  // List items
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 4,
  },
  listBullet: {
    width: 14,
    fontSize: 9,
    color: '#94A3B8',
  },
  listContent: {
    flex: 1,
    fontSize: 9,
    color: '#1E293B',
    lineHeight: 1.5,
  },
  // Numbered items (red flags)
  numberedItem: {
    marginBottom: 8,
    paddingLeft: 4,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  numberedHeader: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  numberedNum: {
    width: 18,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#EA580C',
  },
  numberedTitle: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  numberedBody: {
    paddingLeft: 18,
    fontSize: 8.5,
    color: '#475569',
    lineHeight: 1.5,
  },
  // Paragraph text
  paragraph: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 1.6,
    marginBottom: 6,
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
  },
  // Appendix table
  table: {
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 3,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 3,
    backgroundColor: '#F8FAFC',
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCell: {
    fontSize: 8,
    color: '#334155',
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
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerText: {
    fontSize: 7,
    color: '#94A3B8',
  },
  footerLink: {
    fontSize: 7,
    color: '#94A3B8',
  },
});

// Render rich text with bold segments
const RichText = ({ segments, style }) => {
  if (!segments || segments.length === 0) return null;
  return (
    <Text style={style}>
      {segments.map((seg, i) =>
        seg.bold
          ? <Text key={i} style={styles.boldText}>{seg.text}</Text>
          : <Text key={i}>{seg.text}</Text>
      )}
    </Text>
  );
};

// Bottom Line callout
const BottomLineCallout = ({ items }) => {
  if (!items || items.length === 0) return null;
  return items.map((item, i) => (
    <View key={i} style={{ backgroundColor: '#EFF6FF', borderLeftWidth: 4, borderLeftColor: '#3B82F6', borderRadius: 4, padding: 10, marginTop: 8, marginBottom: 4 }}>
      <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#1D4ED8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>Bottom Line</Text>
      <Text style={{ fontSize: 9, color: '#1E3A5F', lineHeight: 1.6 }}>{item.text}</Text>
    </View>
  ));
};

// Score color helper
const getScoreColor = (text) => {
  const match = (text || '').match(/^\+?(\d+)/);
  if (!match) return '#334155';
  const val = parseInt(match[1]);
  if (val >= 50) return '#DC2626';
  if (val >= 20) return '#D97706';
  return '#16A34A';
};

// Block renderer — renders a single content block
const ContentBlock = ({ block, index }) => {
  if (!block) return null;
  const { type } = block;

  if (type === 'table' && block.headers && block.rows) {
    return (
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          {block.headers.map((h, i) => (
            <Text key={i} style={[styles.tableHeaderCell, { width: `${100 / block.headers.length}%` }]}>{h}</Text>
          ))}
        </View>
        {block.rows.map((row, i) => {
          const rowText = row.join(' ').toLowerCase();
          const isTotal = /\b(total|final)\b/.test(rowText);
          return (
            <View key={i} style={[i % 2 === 0 ? styles.tableRowAlt : styles.tableRow, isTotal && { backgroundColor: '#E2E8F0' }]}>
              {row.map((cell, j) => (
                <Text key={j} style={[
                  styles.tableCell,
                  { width: `${100 / block.headers.length}%` },
                  isTotal && { fontFamily: 'Helvetica-Bold' },
                  j > 0 && { color: getScoreColor(cell) },
                ]}>{cell}</Text>
              ))}
            </View>
          );
        })}
      </View>
    );
  }

  if (type === 'key-value' && block.items) {
    return block.items.map((item, i) => (
      <View key={`kv-${index}-${i}`} style={styles.kvRow}>
        <Text style={styles.kvLabel}>{item.label}</Text>
        <RichText segments={item.valueSegments || [{ text: item.value || '' }]} style={styles.kvValue} />
      </View>
    ));
  }

  if (type === 'numbered' && block.items) {
    return block.items.map((item, i) => (
      <View key={`num-${index}-${i}`} style={styles.numberedItem}>
        <View style={styles.numberedHeader}>
          <Text style={styles.numberedNum}>{i + 1}.</Text>
          <RichText segments={item.titleSegments || [{ text: item.title || '' }]} style={styles.numberedTitle} />
        </View>
        {item.body && <Text style={styles.numberedBody}>{item.body}</Text>}
      </View>
    ));
  }

  if (type === 'list' && block.items) {
    return block.items.map((item, i) => (
      <View key={`list-${index}-${i}`} style={styles.listItem}>
        <Text style={styles.listBullet}>•</Text>
        <RichText segments={item.segments || [{ text: item.text || '' }]} style={styles.listContent} />
      </View>
    ));
  }

  if (type === 'paragraph' && block.content) {
    return block.content.map((para, i) => (
      <RichText key={`p-${index}-${i}`} segments={para.segments || [{ text: para.text || '' }]} style={styles.paragraph} />
    ));
  }

  return null;
};

// Section renderer
const Section = ({ section }) => {
  const { title, blocks, bottomLine } = section;
  const upper = (title || '').toUpperCase();

  // Skip risk/onboarding — rendered separately as banners
  if (upper.includes('OVERALL RISK') || upper.includes('ONBOARDING')) return null;
  // Skip onboarding recommendation but NOT "recommended actions"
  if (upper.includes('RECOMMENDATION') && !upper.includes('RECOMMENDED')) return null;
  // Skip "Keep Exploring"
  if (upper.includes('KEEP EXPLORING')) return null;

  // Count items across all blocks for display
  const totalItems = (blocks || []).reduce((sum, b) => sum + (b.items ? b.items.length : 0), 0);

  return (
    <View style={styles.sectionContainer} wrap={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title.replace(/:\s*.+$/, '')}</Text>
        {totalItems > 0 && <Text style={styles.sectionCount}>({totalItems})</Text>}
      </View>

      {(blocks || []).map((block, i) => (
        <ContentBlock key={i} block={block} index={i} />
      ))}

      {/* Bottom Line callout for any section type */}
      <BottomLineCallout items={bottomLine} />
    </View>
  );
};

// Appendix table
const AppendixTable = ({ entities }) => {
  if (!entities || entities.length === 0) return null;
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Appendix: Entities Included in Screening</Text>
      </View>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Entity</Text>
          <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Type</Text>
          <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Category</Text>
          <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Details</Text>
        </View>
        {entities.map((ent, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRowAlt : styles.tableRow}>
            <Text style={[styles.tableCell, { width: '35%' }]}>{ent.name}</Text>
            <Text style={[styles.tableCell, { width: '20%' }]}>{ent.type}</Text>
            <Text style={[styles.tableCell, { width: '20%' }]}>{ent.category}</Text>
            <Text style={[styles.tableCell, { width: '25%' }]}>{ent.detail || '\u2014'}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const ComplianceReportPDF = ({ data }) => {
  const {
    subjectName = 'Unknown Entity',
    riskLevel = 'MEDIUM',
    riskScore,
    onboardingRecommendation,
    onboardingRiskLevel,
    generatedAt,
    caseUrl,
    sections = [],
    entities = [],
  } = data || {};

  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const riskColors = colors[riskLevel] || colors.MEDIUM;
  const onbColors = colors[onboardingRiskLevel] || riskColors;

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.headerRow} fixed>
          <View>
            <Text style={styles.headerBrand}>Marlowe Compliance Platform</Text>
            <Text style={styles.headerSubject}>{subjectName}</Text>
          </View>
          <View>
            <Text style={styles.headerMeta}>Screening Report</Text>
            <Text style={styles.headerMeta}>{formattedDate}</Text>
          </View>
        </View>
        <View style={styles.headerDivider} />

        {/* Risk Banner */}
        <View style={[styles.riskBanner, { backgroundColor: riskColors.bg }]}>
          <Text style={styles.riskLabel}>OVERALL RISK: {riskLevel}</Text>
          {riskScore != null && <Text style={styles.riskScore}>{riskScore} / 100</Text>}
        </View>

        {/* Overall Risk section content (table, bottom line, etc.) */}
        {sections.filter(s => (s.title || '').toUpperCase().includes('OVERALL RISK')).map((sec, i) => (
          <View key={`risk-content-${i}`} style={{ marginBottom: 12 }}>
            {(sec.blocks || []).map((block, bi) => (
              <ContentBlock key={bi} block={block} index={bi} />
            ))}
            <BottomLineCallout items={sec.bottomLine} />
          </View>
        ))}

        {/* Onboarding Banner */}
        {onboardingRecommendation && (
          <View style={[styles.onboardingBanner, { backgroundColor: onbColors.light, borderColor: onbColors.border }]}>
            <Text style={styles.onboardingLabel}>Recommendation</Text>
            <Text style={[styles.onboardingValue, { color: onbColors.text }]}>{onboardingRecommendation}</Text>
          </View>
        )}

        {/* All Sections */}
        {sections.map((section, i) => (
          <Section key={i} section={section} />
        ))}

        {/* Appendix */}
        <AppendixTable entities={entities} />

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Marlowe Compliance Platform  •  Confidential</Text>
          {caseUrl ? (
            <Link src={caseUrl} style={styles.footerLink}>
              <Text style={styles.footerLink}>View in Marlowe</Text>
            </Link>
          ) : (
            <Text style={styles.footerLink}>marlowe-app.vercel.app</Text>
          )}
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
};

export default ComplianceReportPDF;
