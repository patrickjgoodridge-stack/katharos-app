// ComplianceReportPDF.js - Raw JSON Data Export
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Simple styles for JSON display
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: 'Courier',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 8,
    color: '#64748B',
  },
  jsonContainer: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  jsonText: {
    fontSize: 8,
    fontFamily: 'Courier',
    color: '#334155',
    lineHeight: 1.4,
  },
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
    borderTopColor: '#E2E8F0',
  },
  footerLeft: {
    fontSize: 7,
    color: '#64748B',
  },
  footerRight: {
    fontSize: 7,
    color: '#64748B',
  },
});

// The PDF Document Component - Raw JSON Export
const ComplianceReportPDF = ({ data }) => {
  const generatedAt = data?.generatedAt || new Date().toISOString();
  const formattedDate = new Date(generatedAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Pretty-print the JSON data
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Compliance Screening Data Export</Text>
          <Text style={styles.timestamp}>Generated: {formattedDate}</Text>
        </View>

        {/* JSON Content */}
        <View style={styles.jsonContainer}>
          <Text style={styles.jsonText}>{jsonString}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>Marlowe Compliance Platform</Text>
          <Text style={styles.footerRight} render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
};

export default ComplianceReportPDF;
