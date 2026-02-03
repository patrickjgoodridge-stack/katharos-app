#!/usr/bin/env node
/**
 * Seed enforcement case studies into Pinecone RAG knowledge base.
 *
 * Parses marlowe-case-studies.md, extracts each case, generates embeddings
 * via Pinecone Inference, and upserts to the "enforcement_cases" namespace.
 *
 * Usage: PINECONE_API_KEY=pcsk_... node scripts/seed-case-studies.js
 */

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'enforcement_cases';

// ─── Parse a single case section into structured data ────────────────────────

function parseCase(markdown) {
  const lines = markdown.trim().split('\n');

  // Title line: "## TD Bank — 2024"
  const titleLine = lines[0].replace(/^##\s*/, '').trim();
  const titleMatch = titleLine.match(/^(.+?)\s*[—–-]\s*(\d{4})$/);
  const name = titleMatch ? titleMatch[1].trim() : titleLine;
  const year = titleMatch ? parseInt(titleMatch[2]) : 0;

  // Extract fields
  const entity = extract(markdown, /\*\*Entity\*\*:\s*(.+)/);
  const regulatorStr = extract(markdown, /\*\*Regulator\*\*:\s*(.+)/);
  const penalty = extract(markdown, /\*\*Penalty\*\*:\s*(.+)/);
  const typologiesStr = extract(markdown, /\*\*Typologies\*\*:\s*(.+)/);

  const regulators = regulatorStr ? regulatorStr.split(/,\s*/) : [];
  const typologies = typologiesStr
    ? typologiesStr.split(/,\s*/).map(t => t.toLowerCase().replace(/\s+/g, '-'))
    : [];

  // Extract sections
  const whatHappened = extractSection(markdown, 'What Happened');
  const howCaught = extractSection(markdown, 'How It Was Caught');
  const redFlags = extractSection(markdown, 'Red Flags That Were Missed');
  const keyIndicators = extractSection(markdown, 'Key Indicators');
  const lesson = extractSection(markdown, 'Lesson for Screening');

  // Parse key indicators as array
  const indicatorList = keyIndicators
    ? keyIndicators.split('\n').filter(l => l.startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
    : [];

  const id = `case-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}-${year}`;

  return {
    id,
    name,
    year,
    entity: entity || name,
    regulators,
    penalty: penalty || 'Unknown',
    typologies,
    keyIndicators: indicatorList,
    lessonForScreening: lesson || '',
    whatHappened: whatHappened || '',
    howCaught: howCaught || '',
    redFlags: redFlags || '',
    content: markdown
  };
}

function extract(text, regex) {
  const m = text.match(regex);
  return m ? m[1].trim() : null;
}

function extractSection(markdown, sectionName) {
  const regex = new RegExp(`### ${sectionName}\\s*\\n([\\s\\S]*?)(?=###|$)`);
  const m = markdown.match(regex);
  return m ? m[1].trim() : null;
}

// ─── Build embedding text (captures entity + patterns for semantic search) ───

function buildEmbeddingText(c) {
  const parts = [
    c.name,
    c.year.toString(),
    c.entity,
    `Regulators: ${c.regulators.join(', ')}`,
    `Typologies: ${c.typologies.join(', ')}`,
    `Key Indicators: ${c.keyIndicators.join(', ')}`,
    c.lessonForScreening,
    c.whatHappened ? c.whatHappened.substring(0, 500) : ''
  ];
  return parts.filter(Boolean).join(' | ');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.PINECONE_API_KEY) {
    console.error('Error: PINECONE_API_KEY environment variable not set');
    process.exit(1);
  }

  // Read and parse the case studies file
  const defaultFile = path.resolve(__dirname, '..', 'marlowe-case-studies.md');
  const mdPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultFile;
  if (!fs.existsSync(mdPath)) {
    console.error(`Error: ${mdPath} not found. Place marlowe-case-studies.md in the project root.`);
    process.exit(1);
  }

  const md = fs.readFileSync(mdPath, 'utf-8');
  const caseSections = md.split(/\n(?=## [A-Za-z0-9])/).filter(s => s.trim().startsWith('## '));
  console.log(`Parsed ${caseSections.length} case studies`);

  const cases = caseSections.map(parseCase);

  // Init Pinecone
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index(INDEX_NAME);
  const ns = index.namespace(NAMESPACE);

  // Process in batches of 5 (rate limiting)
  const BATCH = 5;
  let upserted = 0;

  for (let i = 0; i < cases.length; i += BATCH) {
    const batch = cases.slice(i, i + BATCH);

    // Generate embeddings for this batch
    const texts = batch.map(buildEmbeddingText);
    const embedResult = await pc.inference.embed('multilingual-e5-large', texts, {
      inputType: 'passage',
      truncate: 'END'
    });

    // Build vectors
    const vectors = batch.map((c, j) => ({
      id: c.id,
      values: embedResult.data[j].values,
      metadata: {
        name: c.name,
        year: c.year,
        entity: c.entity,
        regulators: c.regulators.join(', '),
        penalty: c.penalty,
        typologies: c.typologies.join(', '),
        keyIndicators: c.keyIndicators.join(', '),
        lessonForScreening: c.lessonForScreening.substring(0, 900),
        whatHappened: c.whatHappened.substring(0, 500),
        category: 'enforcement',
        source: 'marlowe-knowledge-base',
        type: 'case-study',
        text: buildEmbeddingText(c).substring(0, 1000),
        timestamp: new Date().toISOString()
      }
    }));

    await ns.upsert(vectors);
    upserted += vectors.length;
    console.log(`  Upserted ${upserted}/${cases.length}: ${batch.map(c => c.name).join(', ')}`);
  }

  console.log(`\nDone. ${upserted} enforcement cases seeded to namespace "${NAMESPACE}".`);
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
