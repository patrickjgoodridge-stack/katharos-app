#!/usr/bin/env node
/**
 * Seed shell company typologies into Pinecone RAG knowledge base.
 *
 * Parses marlowe-shell-company-typologies.md, extracts each section, generates embeddings
 * via Pinecone Inference, and upserts to the "shell-companies" namespace.
 *
 * Usage: PINECONE_API_KEY=pcsk_... node scripts/seed-shell-companies.js
 */

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'shell-companies';

// ─── Parse markdown into sections ────────────────────────────────────────────

function parseTypologiesDocument(markdown) {
  const sections = [];

  // Split by ## headers (top-level sections)
  const topLevelSections = markdown.split(/\n(?=## [A-Z])/).filter(s => s.trim().startsWith('## '));

  for (const section of topLevelSections) {
    const lines = section.trim().split('\n');
    const titleLine = lines[0].replace(/^##\s*/, '').trim();
    const content = lines.slice(1).join('\n').trim();

    // Create ID from title
    const id = `shell-${titleLine.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').substring(0, 50)}`;

    // Check for subsections (### headers)
    const subsections = content.split(/\n(?=### )/).filter(s => s.trim());

    if (subsections.length > 1 && content.includes('### ')) {
      // Has subsections - create separate entries for each
      for (const subsection of subsections) {
        if (subsection.trim().startsWith('### ')) {
          const subLines = subsection.trim().split('\n');
          const subTitle = subLines[0].replace(/^###\s*/, '').trim();
          const subContent = subLines.slice(1).join('\n').trim();
          const subId = `shell-${titleLine.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30)}-${subTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30)}`;

          sections.push({
            id: subId,
            title: `${titleLine} - ${subTitle}`,
            category: 'typologies',
            subcategory: titleLine,
            content: `## ${titleLine}\n\n### ${subTitle}\n\n${subContent}`
          });
        }
      }
    } else {
      // No subsections - keep as single entry
      sections.push({
        id,
        title: titleLine,
        category: 'typologies',
        subcategory: 'shell-companies',
        content: section.trim()
      });
    }
  }

  return sections;
}

// ─── Build embedding text ────────────────────────────────────────────────────

function buildEmbeddingText(section) {
  // Extract key terms for better semantic search
  const content = section.content;

  // Extract red flags if present
  const redFlagsMatch = content.match(/\*\*Red Flags\*\*:[\s\S]*?(?=\*\*|$)/);
  const redFlags = redFlagsMatch ? redFlagsMatch[0].substring(0, 300) : '';

  // Extract enforcement precedents if present
  const enforcementMatch = content.match(/\*\*Enforcement Precedent\*\*:[\s\S]*?(?=---|$)/);
  const enforcement = enforcementMatch ? enforcementMatch[0].substring(0, 200) : '';

  const parts = [
    section.title,
    section.category,
    section.subcategory,
    redFlags,
    enforcement,
    content.substring(0, 800)
  ];

  return parts.filter(Boolean).join(' | ');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.PINECONE_API_KEY) {
    console.error('Error: PINECONE_API_KEY environment variable not set');
    process.exit(1);
  }

  // Read and parse the shell company typologies file
  const mdPath = path.resolve(__dirname, '..', 'marlowe-shell-company-typologies.md');
  if (!fs.existsSync(mdPath)) {
    console.error(`Error: ${mdPath} not found.`);
    process.exit(1);
  }

  const md = fs.readFileSync(mdPath, 'utf-8');
  const sections = parseTypologiesDocument(md);
  console.log(`Parsed ${sections.length} sections from shell company typologies`);

  // Init Pinecone
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index(INDEX_NAME);
  const ns = index.namespace(NAMESPACE);

  // Batch upsert
  const batchSize = 5;
  for (let i = 0; i < sections.length; i += batchSize) {
    const batch = sections.slice(i, i + batchSize);

    // Generate embeddings using Pinecone Inference
    const texts = batch.map(s => buildEmbeddingText(s));
    const embeddingResponse = await pc.inference.embed(
      'multilingual-e5-large',
      texts,
      { inputType: 'passage', truncate: 'END' }
    );

    const vectors = batch.map((section, idx) => ({
      id: section.id,
      values: embeddingResponse[idx].values,
      metadata: {
        title: section.title,
        category: section.category,
        subcategory: section.subcategory,
        content: section.content.substring(0, 30000), // Pinecone metadata limit
        source: 'marlowe-shell-company-typologies'
      }
    }));

    await ns.upsert(vectors);
    console.log(`  Upserted ${i + batch.length}/${sections.length}: ${batch.map(s => s.title.substring(0, 30)).join(', ')}`);
  }

  console.log(`\nDone. ${sections.length} shell company typology sections seeded to namespace "${NAMESPACE}".`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
