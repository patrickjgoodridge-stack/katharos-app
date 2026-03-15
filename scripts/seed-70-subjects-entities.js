#!/usr/bin/env node
/**
 * Seed 70-Subjects Entity Investigation database into Pinecone RAG knowledge base.
 *
 * Parses katharos-70-subjects-entity-database.md, extracts entities from
 * markdown tables (| Entity | Type | Jurisdiction | Tier | Source |),
 * generates embeddings via Pinecone Inference, and upserts to the
 * "entity_investigations" namespace.
 *
 * 7 Categories: Convicted ML (10 subjects), Indicted (9), Fraud (8),
 *               RICO (2), Forfeiture (5), Cartel (1), Crypto Fraud (9),
 *               plus Cheng Hung Man
 * Total: ~415+ unique entities across 70 subjects
 *
 * Usage: PINECONE_API_KEY=pcsk_... node scripts/seed-70-subjects-entities.js
 */

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'entity_investigations';

// ── Category metadata ──

const CATEGORIES = {
  'CAT 1': { name: 'Convicted Money Laundering', prefix: '70s-cat1' },
  'CAT 2': { name: 'Indicted', prefix: '70s-cat2' },
  'CAT 3': { name: 'Fraud', prefix: '70s-cat3' },
  'CAT 4': { name: 'RICO', prefix: '70s-cat4' },
  'CAT 5': { name: 'Forfeiture', prefix: '70s-cat5' },
  'CAT 6': { name: 'Cartel', prefix: '70s-cat6' },
  'CAT 7': { name: 'Crypto Fraud', prefix: '70s-cat7' },
  'OTHER': { name: 'Other', prefix: '70s-other' },
};

// ── Parse the markdown ──

function parseMarkdown(markdown) {
  const subjects = [];
  const lines = markdown.split('\n');

  let currentCategory = 'OTHER';
  let currentSubject = null;
  let inTable = false;
  let tableHeaders = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track category headers: ## CAT N — ...
    const catMatch = line.match(/^## (CAT \d+)\s*—\s*(.+)/);
    if (catMatch) {
      currentCategory = catMatch[1];
      inTable = false;
      continue;
    }

    // Track subject headers: ### N. Subject Name
    const subjectMatch = line.match(/^### (\d+)\.\s+(.+)/);
    if (subjectMatch) {
      // Save previous subject
      if (currentSubject) subjects.push(currentSubject);

      currentSubject = {
        number: parseInt(subjectMatch[1]),
        name: subjectMatch[2].trim(),
        category: currentCategory,
        standardFinds: '',
        katharosFinds: '',
        coverageGap: '',
        criticalFinding: '',
        entities: [],
      };
      inTable = false;
      continue;
    }

    if (!currentSubject) continue;

    // Track screening stats
    const stdMatch = line.match(/\*\*Standard screening finds:\*\*\s*(.+)/);
    if (stdMatch) {
      currentSubject.standardFinds = stdMatch[1].trim();
      continue;
    }
    const kathMatch = line.match(/\*\*Katharos finds:\*\*\s*(.+)/);
    if (kathMatch) {
      currentSubject.katharosFinds = kathMatch[1].trim();
      continue;
    }
    const gapMatch = line.match(/\*\*Coverage gap:\*\*\s*(.+)/);
    if (gapMatch) {
      currentSubject.coverageGap = gapMatch[1].trim();
      continue;
    }
    const critMatch = line.match(/\*\*Critical finding:\*\*\s*(.+)/);
    if (critMatch) {
      currentSubject.criticalFinding = critMatch[1].trim();
      continue;
    }

    // Summary section — stop parsing
    if (line.startsWith('## INVESTIGATION SUMMARY')) {
      if (currentSubject) subjects.push(currentSubject);
      currentSubject = null;
      break;
    }

    // Detect table header: | Entity | Type | ...
    if (line.trim().startsWith('|') && line.includes('Entity') && line.includes('Type')) {
      tableHeaders = line.split('|').map(c => c.trim()).filter(Boolean);
      inTable = true;
      continue;
    }

    // Skip separator rows
    if (line.trim().startsWith('|---') || line.trim().startsWith('| ---')) {
      continue;
    }

    // Parse data rows
    if (inTable && line.trim().startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length < 3) continue;

      // Map cells to header names
      const entity = {};
      tableHeaders.forEach((header, idx) => {
        if (idx < cells.length) {
          entity[header.toLowerCase()] = cells[idx];
        }
      });

      if (!entity.entity || entity.entity === '---') continue;

      currentSubject.entities.push({
        name: entity.entity,
        type: entity.type || 'entity',
        jurisdiction: entity.jurisdiction || '',
        tier: entity.tier || '',
        source: entity.source || '',
      });
      continue;
    }

    // End table on empty line or non-table content
    if (inTable && !line.trim().startsWith('|')) {
      inTable = false;
    }
  }

  // Push last subject
  if (currentSubject) subjects.push(currentSubject);

  return subjects;
}

// ── Build embedding text ──

function buildEntityEmbeddingText(entity, subject, catMeta) {
  const parts = [
    `Entity: ${entity.name}`,
    `Type: ${entity.type}`,
    entity.jurisdiction ? `Jurisdiction: ${entity.jurisdiction}` : '',
    entity.tier ? `Tier: ${entity.tier}` : '',
    entity.source ? `Source: ${entity.source}` : '',
    `Subject: ${subject.name}`,
    catMeta.name ? `Category: ${catMeta.name}` : '',
    subject.coverageGap ? `Coverage gap: ${subject.coverageGap}` : '',
    subject.criticalFinding ? `Critical finding: ${subject.criticalFinding}` : '',
    `Investigation: Katharos 70-Subject Entity Investigation`,
    `Standard screening: ${subject.standardFinds || 'limited'}`,
    `Katharos screening: ${subject.katharosFinds || 'expanded'}`,
  ];
  return parts.filter(Boolean).join(' | ');
}

function buildSubjectEmbeddingText(subject, catMeta) {
  const entityNames = subject.entities.map(e => e.name).join(', ');
  const parts = [
    `Subject investigation: ${subject.name}`,
    catMeta.name ? `Category: ${catMeta.name}` : '',
    `Standard screening: ${subject.standardFinds || 'limited'}`,
    `Katharos finds: ${subject.katharosFinds || 'expanded'}`,
    subject.coverageGap ? `Coverage gap: ${subject.coverageGap}` : '',
    `Entities found: ${entityNames}`.substring(0, 800),
    subject.criticalFinding ? `Critical finding: ${subject.criticalFinding}` : '',
    'Investigation: Katharos 70-Subject Entity Investigation — 415+ entities across 70 subjects',
  ];
  return parts.filter(Boolean).join(' | ');
}

// ── Generate stable ID ──

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

// ── Main ──

async function main() {
  if (!process.env.PINECONE_API_KEY) {
    console.error('Error: PINECONE_API_KEY environment variable not set');
    process.exit(1);
  }

  const mdPath = path.resolve(__dirname, '..', 'katharos-70-subjects-entity-database.md');
  if (!fs.existsSync(mdPath)) {
    console.error(`Error: ${mdPath} not found.`);
    process.exit(1);
  }

  const md = fs.readFileSync(mdPath, 'utf-8');
  const subjects = parseMarkdown(md);

  console.log(`Parsed ${subjects.length} subjects`);
  let totalEntities = 0;
  const catCounts = {};
  for (const s of subjects) {
    totalEntities += s.entities.length;
    catCounts[s.category] = (catCounts[s.category] || 0) + s.entities.length;
  }
  console.log(`Total entities: ${totalEntities}`);
  for (const [cat, count] of Object.entries(catCounts).sort()) {
    const meta = CATEGORIES[cat] || {};
    console.log(`  ${cat} (${meta.name || '?'}): ${count} entities`);
  }

  // Init Pinecone
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index(INDEX_NAME);
  const ns = index.namespace(NAMESPACE);

  const allVectors = [];

  // 1. Entity vectors — batch embed 5 at a time
  const BATCH = 5;
  let entityIdx = 0;
  for (const subject of subjects) {
    const catMeta = CATEGORIES[subject.category] || CATEGORIES['OTHER'];
    const prefix = catMeta.prefix;

    for (let i = 0; i < subject.entities.length; i += BATCH) {
      const batch = subject.entities.slice(i, i + BATCH);
      const texts = batch.map(e => buildEntityEmbeddingText(e, subject, catMeta));

      const embedResult = await pc.inference.embed('multilingual-e5-large', texts, {
        inputType: 'passage',
        truncate: 'END'
      });

      batch.forEach((e, j) => {
        entityIdx++;
        const id = `${prefix}-${slugify(subject.name)}-${slugify(e.name)}`.substring(0, 100);

        // Determine sanctions status from source text
        const allText = `${e.source} ${e.name} ${e.type}`.toLowerCase();
        const sanctioned = allText.includes('ofac') || allText.includes('ofsi') ||
                           allText.includes('fincen') || allText.includes('sdgt') ||
                           allText.includes('kingpin') || allText.includes('tco') ||
                           allText.includes('designated') || allText.includes('sanctioned');

        allVectors.push({
          id,
          values: embedResult.data[j].values,
          metadata: {
            name: e.name,
            type: e.type,
            jurisdiction: e.jurisdiction,
            tier: `Tier ${e.tier}`,
            riskLevel: ['1', '2'].includes(e.tier) ? 'CRITICAL' : ['3', '4'].includes(e.tier) ? 'HIGH' : 'MEDIUM',
            sanctioned: String(sanctioned),
            source: (e.source || '').substring(0, 500),
            subjectName: subject.name,
            subjectNumber: String(subject.number),
            categoryName: catMeta.name,
            category: 'entity_investigation',
            investigation: 'KATHAROS-2026-70SUBJECTS-001',
            coverageGap: subject.coverageGap || '',
            criticalFinding: (subject.criticalFinding || '').substring(0, 500),
            source_tag: 'katharos-investigation',
            type_tag: 'entity',
            text: buildEntityEmbeddingText(e, subject, catMeta).substring(0, 1000),
            timestamp: new Date().toISOString()
          }
        });
      });

      console.log(`  [${subject.name}] Embedded entities ${i + 1}-${Math.min(i + BATCH, subject.entities.length)} of ${subject.entities.length}`);
    }
  }

  // 2. Subject overview vectors
  console.log('\nEmbedding subject overviews...');
  for (let i = 0; i < subjects.length; i += BATCH) {
    const batch = subjects.slice(i, i + BATCH);
    const texts = batch.map(s => {
      const catMeta = CATEGORIES[s.category] || CATEGORIES['OTHER'];
      return buildSubjectEmbeddingText(s, catMeta);
    });

    const embedResult = await pc.inference.embed('multilingual-e5-large', texts, {
      inputType: 'passage',
      truncate: 'END'
    });

    batch.forEach((s, j) => {
      const catMeta = CATEGORIES[s.category] || CATEGORIES['OTHER'];
      const id = `${catMeta.prefix}-subject-${slugify(s.name)}`.substring(0, 100);
      allVectors.push({
        id,
        values: embedResult.data[j].values,
        metadata: {
          name: `Subject: ${s.name}`,
          type: 'subject_overview',
          subjectName: s.name,
          subjectNumber: String(s.number),
          categoryName: catMeta.name,
          category: 'entity_investigation',
          investigation: 'KATHAROS-2026-70SUBJECTS-001',
          standardFinds: s.standardFinds || '',
          katharosFinds: s.katharosFinds || '',
          coverageGap: s.coverageGap || '',
          criticalFinding: (s.criticalFinding || '').substring(0, 500),
          entityCount: String(s.entities.length),
          source_tag: 'katharos-investigation',
          type_tag: 'subject_overview',
          text: buildSubjectEmbeddingText(s, catMeta).substring(0, 1000),
          timestamp: new Date().toISOString()
        }
      });
    });

    console.log(`  Embedded subjects ${i + 1}-${Math.min(i + BATCH, subjects.length)} of ${subjects.length}`);
  }

  // 3. Investigation metadata vector
  const metaText = `Katharos 70-Subject Entity Investigation KATHAROS-2026-70SUBJECTS-001: 415+ entities across 70 subjects in 7 categories. CAT 1 Convicted ML: Vinnik BTC-e 22 entities, Daren Li pig butchering 80 entities, Lichtenstein Bitfinex 17 entities, Sterlingov Bitcoin Fog 6 entities, Harmon Helix 10 entities, Ignatova OneCoin 21 entities. CAT 2 Indicted: Roger Ver 11 entities, Griffith DPRK 7, 3AC 12, Mashinsky Celsius 6, JPEX 10, Eisenberg Mango 5, Chastain OpenSea 3, Crater My Big Coin 7, IcomTech 11. CAT 3 Fraud: Holmes Theranos 8, Hwang Archegos 9, Shvartsman DWAC 4, Milton Nikola 5, Shah Outcome 5, Watson Ozy 4, Neumann WeWork 10, Honig 8. CAT 4 RICO: Combs 10, Young Thug YSL 5. CAT 5 Forfeiture: Jian Wen 6, Zhong Silk Road 5, 1MDB 20, Lazarus 15, Garantex 6, Tornado Cash 8. CAT 6 Cartel: CJNG 8. CAT 7 Crypto Fraud: Tether 10, Bitfinex 8, KuCoin 8, OKX 7, Nexo 6, Genesis 9, BlockFi 6, BitMEX 9. Top coverage gaps: Daren Li 99%, 1MDB 95%, Vinnik 95%, IcomTech 93%, OneCoin 90%, Cheng Hung Man 90%. Standard screening finds 1-2 entities per subject. Katharos finds 6.2 average.`;

  const metaEmbed = await pc.inference.embed('multilingual-e5-large', [metaText], {
    inputType: 'passage',
    truncate: 'END'
  });
  allVectors.push({
    id: '70subjects-investigation-metadata',
    values: metaEmbed.data[0].values,
    metadata: {
      name: '70-Subject Entity Investigation Overview',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-70SUBJECTS-001',
      source_tag: 'katharos-investigation',
      type_tag: 'investigation_metadata',
      text: metaText.substring(0, 1000),
      totalSubjects: '70',
      totalEntities: String(totalEntities),
      riskLevel: 'CRITICAL',
      coverageGap: '85-99%',
      categories: 'Convicted ML, Indicted, Fraud, RICO, Forfeiture, Cartel, Crypto Fraud',
      timestamp: new Date().toISOString()
    }
  });
  console.log('Embedded investigation metadata');

  // Upsert all vectors
  console.log(`\nUpserting ${allVectors.length} total vectors to namespace "${NAMESPACE}"...`);
  for (let i = 0; i < allVectors.length; i += 10) {
    const batch = allVectors.slice(i, i + 10);
    await ns.upsert(batch);
    console.log(`  Upserted ${Math.min(i + 10, allVectors.length)}/${allVectors.length}`);
  }

  console.log(`\nDone. ${allVectors.length} vectors seeded.`);
  console.log(`  Entity vectors: ${entityIdx}`);
  console.log(`  Subject overviews: ${subjects.length}`);
  console.log(`  Investigation metadata: 1`);
  console.log(`  Total: ${allVectors.length}`);
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
