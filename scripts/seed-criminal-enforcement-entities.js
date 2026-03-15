#!/usr/bin/env node
/**
 * Seed Criminal Enforcement entity database into Pinecone RAG knowledge base.
 *
 * Parses katharos-criminal-enforcement-entity-database.md, extracts entities from
 * markdown tables (not JSON blocks), generates embeddings via Pinecone Inference,
 * and upserts to the "entity_investigations" namespace.
 *
 * 7 Categories: Prince Group/Huione (144), Terraform (11), FTX (149),
 *               SE Enterprise (16), Forfeiture (6), Sinaloa Cartel (47), Binance (32)
 * Total: ~359 unique entities
 *
 * Usage: PINECONE_API_KEY=pcsk_... node scripts/seed-criminal-enforcement-entities.js
 */

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'entity_investigations';

// ── Category metadata ──

const CATEGORIES = {
  1: { name: 'Convicted Money Launderers', subject: 'Chen Zhi / Prince Group / Huione', prefix: 'prince' },
  2: { name: 'Indicted But Not Convicted', subject: 'Do Kwon / Terraform Labs', prefix: 'terra' },
  3: { name: 'Fraud Defendants', subject: 'Sam Bankman-Fried / FTX', prefix: 'ftx' },
  4: { name: 'RICO Defendants', subject: 'Malone Lam / SE Enterprise', prefix: 'se' },
  5: { name: 'Asset Forfeiture Target', subject: 'Chen Zhi / Prince Group BTC', prefix: 'forfeit' },
  6: { name: 'Cartel-Linked Entities', subject: 'Los Chapitos / Sinaloa Cartel', prefix: 'cartel' },
  7: { name: 'Crypto Fraud Actors', subject: 'Binance / Changpeng Zhao', prefix: 'binance' },
};

// ── Parse table rows into entities ──

function parseTableRow(row) {
  // Split on | and trim, removing empty first/last elements
  const cells = row.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length);
  return cells;
}

function isTableRow(line) {
  return line.trim().startsWith('|') && !line.trim().startsWith('|---') && !line.trim().startsWith('| ID') && !line.trim().startsWith('| Category');
}

function isHeaderRow(line) {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && (
    trimmed.includes('| ID ') || trimmed.includes('| Name ') ||
    trimmed.includes('| ID |') || trimmed.startsWith('| **TOTAL**')
  );
}

function isSeparatorRow(line) {
  return line.trim().startsWith('|---');
}

function parseEntities(markdown) {
  const entities = [];
  const lines = markdown.split('\n');

  let currentCategory = 0;
  let currentTier = '';
  let currentSubsection = '';
  let tableHeaders = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track category
    const catMatch = line.match(/^# CATEGORY (\d+)/);
    if (catMatch) {
      currentCategory = parseInt(catMatch[1]);
      currentTier = '';
      currentSubsection = '';
      inTable = false;
      continue;
    }

    // Track final summary section — stop parsing entities
    if (line.startsWith('# FINAL INVESTIGATION SUMMARY')) {
      break;
    }

    // Track tier
    const tierMatch = line.match(/^## (TIER \d+.+)/);
    if (tierMatch) {
      currentTier = tierMatch[1].trim();
      inTable = false;
      continue;
    }

    // Track subsection
    const subMatch = line.match(/^### (.+)/);
    if (subMatch) {
      currentSubsection = subMatch[1].trim();
      inTable = false;
      continue;
    }

    // Detect table header row
    if (line.trim().startsWith('|') && (line.includes('| ID ') || line.includes('| ID|') || line.includes('|ID|'))) {
      tableHeaders = parseTableRow(line).map(h => h.replace(/\*\*/g, '').trim());
      inTable = true;
      continue;
    }

    // Skip separator rows
    if (isSeparatorRow(line)) continue;

    // Parse data rows
    if (inTable && line.trim().startsWith('|') && !isHeaderRow(line)) {
      const cells = parseTableRow(line);
      if (cells.length < 2) continue;

      // Skip summary rows
      if (cells[0] === '**TOTAL**' || cells[0].startsWith('**')) continue;

      const entityId = cells[0] || '';
      // Skip rows without valid entity IDs
      if (!entityId || entityId === '—' || entityId === '-') continue;

      // Build entity from table columns based on available headers
      const entity = { entityId, category: currentCategory, tier: currentTier, subsection: currentSubsection };

      tableHeaders.forEach((header, idx) => {
        if (idx < cells.length) {
          const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
          entity[key] = cells[idx];
        }
      });

      // Normalize name field
      entity.name = entity.name || entity.asset || entity.incident || entityId;

      // Build a stable ID
      const catPrefix = CATEGORIES[currentCategory]?.prefix || `cat${currentCategory}`;
      const idSlug = entityId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-/, '');
      entity.id = `criminal-${catPrefix}-${idSlug}`;

      // Determine entity type
      if (entityId.includes('-I-') || entityId.includes('-P-')) {
        entity.type = 'individual';
      } else if (entityId.includes('-E-') || entityId.includes('-INC-')) {
        entity.type = 'company';
      } else if (['FORFEIT'].some(p => entityId.startsWith(p))) {
        entity.type = 'asset';
      } else {
        entity.type = entity.dob ? 'individual' : 'entity';
      }

      // Determine sanctions status
      const allValues = Object.values(entity).join(' ').toLowerCase();
      entity.sanctioned = allValues.includes('ofac') || allValues.includes('ofsi') ||
                          allValues.includes('fincen') || allValues.includes('sdgt') ||
                          allValues.includes('kingpin') || allValues.includes('tco');

      entities.push(entity);
    }

    // End table on empty line or non-table content
    if (inTable && line.trim() === '') {
      inTable = false;
    }
  }

  // Also parse the FTX Chapter 11 bulk text list
  const ftxBulkMatch = markdown.match(/## TIER 2 — ALL 134 CHAPTER 11 ENTITIES[\s\S]*?(?=## TIER 3 — ADDITIONAL ACTORS)/);
  if (ftxBulkMatch) {
    const ftxSection = ftxBulkMatch[0];
    // Extract entity names from comma-separated lists in bold groups
    const nameListRegex = /\n([A-Z][^|*#\n]+(?:,\s*[A-Z][^|*#\n]+)*)/g;
    let ftxMatch;
    let ftxIdx = 0;
    while ((ftxMatch = nameListRegex.exec(ftxSection)) !== null) {
      const text = ftxMatch[1].trim();
      // Skip non-entity lines
      if (text.startsWith('The following') || text.startsWith('Terraform') || text.startsWith('Note:')) continue;
      const names = text.split(/,\s*/).map(n => n.trim()).filter(n => n.length > 3 && !n.startsWith('**'));
      for (const name of names) {
        // Skip descriptive text
        if (name.match(/^(The |These |Note|This |Banks |Associated )/)) continue;
        ftxIdx++;
        entities.push({
          id: `criminal-ftx-ch11-${ftxIdx}`,
          entityId: `FTX-CH11-${String(ftxIdx).padStart(3, '0')}`,
          name: name.replace(/\(.*?\)/g, '').trim(),
          fullName: name,
          type: 'company',
          category: 3,
          tier: 'TIER 2 — ALL 134 CHAPTER 11 ENTITIES',
          subsection: 'FTX Chapter 11 Debtors',
          sanctioned: false,
          status: 'Chapter 11 debtor',
        });
      }
    }
  }

  return entities;
}

// ── Build embedding text for semantic search ──

function buildEntityEmbeddingText(e) {
  const cat = CATEGORIES[e.category] || {};
  const parts = [
    `Entity: ${e.name}`,
    e.aliases ? `Aliases: ${e.aliases}` : '',
    `Type: ${e.type}`,
    e.jurisdiction ? `Jurisdiction: ${e.jurisdiction}` : '',
    e.nationality ? `Nationality: ${e.nationality}` : '',
    e.dob ? `DOB: ${e.dob}` : '',
    cat.name ? `Category: ${cat.name}` : '',
    cat.subject ? `Subject network: ${cat.subject}` : '',
    e.tier ? `Tier: ${e.tier}` : '',
    e.sanctioned ? 'SANCTIONED: Yes' : '',
    e.sanctions ? `Sanctions: ${e.sanctions}` : '',
    e.sanction ? `Sanction: ${e.sanction}` : '',
    e.uk_sanction ? `UK Sanction: ${e.uk_sanction}` : '',
    e.status ? `Status: ${e.status}` : '',
    e.role ? `Role: ${e.role}` : '',
    e.linked_to ? `Linked to: ${e.linked_to}` : '',
    e.sentence_forfeiture ? `Sentence: ${e.sentence_forfeiture}` : '',
    e.key_facts ? `Key facts: ${e.key_facts}` : '',
    e.regulatory_action ? `Regulatory action: ${e.regulatory_action}` : '',
    e.note ? `Note: ${e.note}` : '',
    e.value ? `Value: ${e.value}` : '',
    e.details ? `Details: ${e.details}` : '',
    e.source ? `Source: ${e.source}` : '',
    'Investigation: Criminal Enforcement — 359 entities across 7 categories',
    'Categories: Convicted ML, Indicted, Fraud, RICO, Forfeiture, Cartel, Crypto Fraud',
    'Standard screening finds ~22 (~6%). This investigation finds 359.',
  ];
  return parts.filter(Boolean).join(' | ');
}

// ── Extract category overview sections ──

function extractCategoryOverviews(markdown) {
  const overviews = [];
  const catRegex = /\n(# CATEGORY \d+ — .+)\n(# Subject: .+)\n([\s\S]*?)(?=\n# CATEGORY |\n# FINAL INVESTIGATION|$)/g;
  let match;
  while ((match = catRegex.exec(markdown)) !== null) {
    const title = match[1].replace(/^# /, '').trim();
    const subject = match[2].replace(/^# Subject: /, '').trim();
    const content = match[3].substring(0, 2000);
    const id = `criminal-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;
    overviews.push({ id, title: `${title} — ${subject}`, content });
  }
  return overviews;
}

// ── Main ──

async function main() {
  if (!process.env.PINECONE_API_KEY) {
    console.error('Error: PINECONE_API_KEY environment variable not set');
    process.exit(1);
  }

  const mdPath = path.resolve(__dirname, '..', 'katharos-criminal-enforcement-entity-database.md');
  if (!fs.existsSync(mdPath)) {
    console.error(`Error: ${mdPath} not found.`);
    process.exit(1);
  }

  const md = fs.readFileSync(mdPath, 'utf-8');

  // Parse entities from tables
  const entities = parseEntities(md);
  console.log(`Parsed ${entities.length} entities from Criminal Enforcement investigation`);

  // Count by category
  const catCounts = {};
  for (const e of entities) {
    catCounts[e.category] = (catCounts[e.category] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(catCounts).sort((a, b) => a[0] - b[0])) {
    console.log(`  Category ${cat} (${CATEGORIES[cat]?.name || '?'}): ${count} entities`);
  }

  // Extract category overviews
  const overviews = extractCategoryOverviews(md);
  console.log(`Extracted ${overviews.length} category overviews`);

  // Extract compliance gaps and summary
  const gapsMatch = md.match(/## Critical Compliance Gaps[\s\S]*?(?=## Bulk Import Queue|$)/);
  const summaryMatch = md.match(/# FINAL INVESTIGATION SUMMARY\n([\s\S]*?)$/);

  // Init Pinecone
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index(INDEX_NAME);
  const ns = index.namespace(NAMESPACE);

  const allVectors = [];

  // 1. Entity vectors
  const BATCH = 5;
  for (let i = 0; i < entities.length; i += BATCH) {
    const batch = entities.slice(i, i + BATCH);
    const texts = batch.map(buildEntityEmbeddingText);
    const embedResult = await pc.inference.embed('multilingual-e5-large', texts, {
      inputType: 'passage',
      truncate: 'END'
    });

    batch.forEach((e, j) => {
      const cat = CATEGORIES[e.category] || {};
      allVectors.push({
        id: e.id,
        values: embedResult.data[j].values,
        metadata: {
          name: e.name,
          entityId: e.entityId,
          aliases: e.aliases || '',
          type: e.type,
          jurisdiction: e.jurisdiction || e.nationality || '',
          tier: e.tier || '',
          sanctioned: String(e.sanctioned || false),
          sanctions: (e.sanctions || e.sanction || e.uk_sanction || '').substring(0, 500),
          status: (e.status || '').substring(0, 500),
          role: (e.role || '').substring(0, 500),
          linkedTo: e.linked_to || '',
          categoryNumber: String(e.category),
          categoryName: cat.name || '',
          subjectNetwork: cat.subject || '',
          category: 'entity_investigation',
          investigation: 'KATHAROS-2026-CRIMINAL-001',
          source: 'katharos-investigation',
          type_tag: 'entity',
          text: buildEntityEmbeddingText(e).substring(0, 1000),
          timestamp: new Date().toISOString()
        }
      });
    });

    console.log(`  Embedded entities ${i + 1}-${Math.min(i + BATCH, entities.length)} of ${entities.length}`);
  }

  // 2. Category overview vectors
  if (overviews.length > 0) {
    const ovTexts = overviews.map(o => `Criminal Enforcement investigation ${o.title}: ${o.content.substring(0, 800)}`);
    const ovEmbed = await pc.inference.embed('multilingual-e5-large', ovTexts, {
      inputType: 'passage',
      truncate: 'END'
    });
    overviews.forEach((o, i) => {
      allVectors.push({
        id: o.id,
        values: ovEmbed.data[i].values,
        metadata: {
          name: o.title,
          category: 'entity_investigation',
          investigation: 'KATHAROS-2026-CRIMINAL-001',
          source: 'katharos-investigation',
          type_tag: 'category_overview',
          text: o.content.substring(0, 1000),
          timestamp: new Date().toISOString()
        }
      });
    });
    console.log(`  Embedded ${overviews.length} category overviews`);
  }

  // 3. Compliance gaps vector
  if (gapsMatch) {
    const gapsText = `Criminal enforcement compliance gaps: Prince Group 17 Singapore entities with ACRA numbers standard screening has 2 of 17. Mighty Divine Cayman SPCs with GIIN numbers zero in commercial databases. FTX North Dimension bank-facing front companies received billions in customer deposits. SE Enterprise Mehta unnamed California LLCs created 2024 for stolen crypto laundering. Mazatlan cell front companies IMB 24 Siete MKT 24 Siete Sea Wa Beach Club appear as legitimate businesses. Sumilab Favela Lopez family precursor chemical network removed signage to evade OFAC. Binance Markets Ltd FCA-prohibited not OFAC-sanctioned US screening misses. Sumi Zhi Chen's wife UK-sanctioned only OFAC screening misses. ${gapsMatch[0].substring(0, 400)}`;
    const gapsEmbed = await pc.inference.embed('multilingual-e5-large', [gapsText], {
      inputType: 'passage',
      truncate: 'END'
    });
    allVectors.push({
      id: 'criminal-compliance-gaps',
      values: gapsEmbed.data[0].values,
      metadata: {
        name: 'Criminal Enforcement Compliance Gaps',
        category: 'entity_investigation',
        investigation: 'KATHAROS-2026-CRIMINAL-001',
        source: 'katharos-investigation',
        type_tag: 'compliance_recommendation',
        text: gapsMatch[0].substring(0, 1000),
        timestamp: new Date().toISOString()
      }
    });
    console.log('  Embedded compliance gaps');
  }

  // 4. Investigation metadata vector
  const metaText = `Criminal Enforcement full entity investigation KATHAROS-2026-CRIMINAL-001: 359 unique entities across 7 categories. Category 1 Convicted Money Launderers: Chen Zhi Prince Group TCO Huione Group 144 entities including 18 core leadership 129 corporate entities across Cambodia BVI Singapore Taiwan Hong Kong Cayman Palau plus Huione FinCEN Section 311 designation $4B laundered. Category 2 Indicted: Do Kwon Terraform Labs 11 entities $45B TerraUSD collapse 15yr sentence. Category 3 Fraud Defendants: SBF FTX 149 entities including 134 Chapter 11 debtors $11B forfeiture North Dimension bank-facing shells. Category 4 RICO: Malone Lam SE Enterprise 16 entities largest single BTC theft 4100 BTC $230M. Category 5 Forfeiture: Chen Zhi 127271 BTC $15B largest DOJ forfeiture. Category 6 Cartel: Los Chapitos Sinaloa Cartel 47 entities Kingpin Act FTO SDGT designations precursor chemical networks Mazatlan cell front companies. Category 7 Crypto Fraud: Binance CZ 32 entities $4.3B settlement 1667153 OFAC violations. Standard screening finds ~22 entities (6%). This investigation finds 359.`;
  const metaEmbed = await pc.inference.embed('multilingual-e5-large', [metaText], {
    inputType: 'passage',
    truncate: 'END'
  });
  allVectors.push({
    id: 'criminal-investigation-metadata',
    values: metaEmbed.data[0].values,
    metadata: {
      name: 'Criminal Enforcement Investigation Overview',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-CRIMINAL-001',
      source: 'katharos-investigation',
      type_tag: 'investigation_metadata',
      text: metaText.substring(0, 1000),
      totalEntities: '359',
      riskLevel: 'CRITICAL',
      coverageGap: '94%',
      categories: 'Convicted ML, Indicted, Fraud, RICO, Forfeiture, Cartel, Crypto Fraud',
      timestamp: new Date().toISOString()
    }
  });
  console.log('  Embedded investigation metadata');

  // Upsert all vectors
  console.log(`\nUpserting ${allVectors.length} total vectors...`);
  for (let i = 0; i < allVectors.length; i += 10) {
    const batch = allVectors.slice(i, i + 10);
    await ns.upsert(batch);
    console.log(`  Upserted ${Math.min(i + 10, allVectors.length)}/${allVectors.length}`);
  }

  console.log(`\nDone. ${allVectors.length} vectors seeded to namespace "${NAMESPACE}".`);
  console.log('Entities:', entities.length);
  console.log('Category overviews:', overviews.length);
  console.log('Compliance gaps: 1');
  console.log('Investigation metadata: 1');
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
