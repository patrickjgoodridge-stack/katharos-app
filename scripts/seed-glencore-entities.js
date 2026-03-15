#!/usr/bin/env node
/**
 * Seed Glencore corporate network entity database into Pinecone RAG knowledge base.
 *
 * Parses katharos-glencore-entity-database.md, extracts each entity + the
 * relationship map + compliance recommendation, generates embeddings via
 * Pinecone Inference, and upserts to the "entity_investigations" namespace.
 *
 * Usage: PINECONE_API_KEY=pcsk_... node scripts/seed-glencore-entities.js
 */

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'entity_investigations';

// ── Parse individual entity sections ──

function parseEntities(markdown) {
  const entities = [];

  // Split on ### N. EntityName pattern (numbered entity headers)
  const entitySections = markdown.split(/\n(?=### \d+\.\s)/);

  for (const section of entitySections) {
    const headerMatch = section.match(/^### \d+\.\s+(.+)/);
    if (!headerMatch) continue;

    const name = headerMatch[1].trim();
    const entity = extract(section, /\*\*Entity\*\*:\s*(.+)/);
    const type = extract(section, /\*\*Type\*\*:\s*(.+)/);
    const jurisdiction = extract(section, /\*\*Jurisdiction(?:s)?\*\*:\s*(.+)/);
    const riskLevel = extract(section, /\*\*Risk Level\*\*:\s*(.+)/);
    const relationship = extract(section, /\*\*Relationship\*\*:\s*(.+)/);
    const conviction = extract(section, /\*\*Criminal Conviction\*\*:\s*(.+)/);
    const penalty = extract(section, /\*\*Penalty\*\*:\s*(.+)/);
    const sanctioned = extract(section, /\*\*Is Sanctioned\*\*:\s*(.+)/);
    const aliases = extract(section, /\*\*Aliases\*\*:\s*(.+)/);
    const operationalRole = extract(section, /\*\*Operational Role\*\*:\s*(.+)/);
    const complianceImplication = extract(section, /\*\*Compliance Implication\*\*:\s*(.+)/);
    const note = extract(section, /\*\*Note\*\*:\s*(.+)/);
    const beneficialOwner = extract(section, /\*\*Beneficial Owner\*\*:\s*(.+)/);

    // Extract all risk signals
    const riskSignals = [];
    const riskSignalMatches = section.matchAll(/\*\*Risk Signal(?:\s*\d+)?\*\*:\s*(.+)/g);
    for (const m of riskSignalMatches) {
      riskSignals.push(m[1].trim());
    }

    const id = `glencore-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;

    entities.push({
      id,
      name: entity || name,
      aliases: aliases || '',
      type: type || 'Company',
      jurisdiction: jurisdiction || '',
      riskLevel: riskLevel || '',
      relationship: relationship || '',
      conviction: conviction || '',
      penalty: penalty || '',
      sanctioned: sanctioned || '',
      operationalRole: operationalRole || '',
      complianceImplication: complianceImplication || '',
      note: note || '',
      beneficialOwner: beneficialOwner || '',
      riskSignals,
      content: section.trim(),
    });
  }

  return entities;
}

function extract(text, regex) {
  const m = text.match(regex);
  return m ? m[1].trim() : null;
}

// ── Build embedding text for semantic search ──

function buildEntityEmbeddingText(e) {
  const parts = [
    `Entity: ${e.name}`,
    e.aliases ? `Aliases: ${e.aliases}` : '',
    `Type: ${e.type}`,
    `Jurisdiction: ${e.jurisdiction}`,
    `Risk Level: ${e.riskLevel}`,
    e.relationship ? `Relationship to Glencore: ${e.relationship}` : '',
    e.conviction ? `Criminal conviction: ${e.conviction}` : '',
    e.penalty ? `Penalty: ${e.penalty}` : '',
    e.sanctioned ? `Sanctioned: ${e.sanctioned}` : '',
    e.operationalRole ? `Role: ${e.operationalRole}` : '',
    e.beneficialOwner ? `Beneficial owner: ${e.beneficialOwner}` : '',
    ...e.riskSignals.map(s => `Risk: ${s}`),
    e.complianceImplication ? `Compliance: ${e.complianceImplication}` : '',
    e.note ? `Note: ${e.note}` : '',
    'Investigation: Glencore plc corporate network — 33 entities across 8 tiers',
    'Parent subject: Glencore plc, Glencore International AG',
  ];
  return parts.filter(Boolean).join(' | ');
}

// ── Extract tier-level sections for additional context vectors ──

function extractTierSections(markdown) {
  const tiers = [];
  const tierRegex = /\n## (TIER \d+ — .+)\n([\s\S]*?)(?=\n## TIER |\n## RELATIONSHIP MAP|\n## COMPLIANCE RECOMMENDATION|$)/g;
  let match;
  while ((match = tierRegex.exec(markdown)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    const id = `glencore-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;
    tiers.push({ id, title, content: content.substring(0, 2000) });
  }
  return tiers;
}

// ── Main ──

async function main() {
  if (!process.env.PINECONE_API_KEY) {
    console.error('Error: PINECONE_API_KEY environment variable not set');
    process.exit(1);
  }

  const mdPath = path.resolve(__dirname, '..', 'katharos-glencore-entity-database.md');
  if (!fs.existsSync(mdPath)) {
    console.error(`Error: ${mdPath} not found.`);
    process.exit(1);
  }

  const md = fs.readFileSync(mdPath, 'utf-8');

  // Parse entities
  const entities = parseEntities(md);
  console.log(`Parsed ${entities.length} entities from Glencore investigation`);

  // Extract tier overviews
  const tiers = extractTierSections(md);
  console.log(`Extracted ${tiers.length} tier overview sections`);

  // Extract relationship map and compliance recommendation
  const relMapMatch = md.match(/## RELATIONSHIP MAP\n([\s\S]*?)(?=\n## COMPLIANCE RECOMMENDATION|$)/);
  const compRecMatch = md.match(/## COMPLIANCE RECOMMENDATION\n([\s\S]*?)$/);
  const metadataMatch = md.match(/## INVESTIGATION METADATA\n([\s\S]*?)(?=\n## PRIMARY SUBJECT)/);

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
      allVectors.push({
        id: e.id,
        values: embedResult.data[j].values,
        metadata: {
          name: e.name,
          aliases: e.aliases,
          type: e.type,
          jurisdiction: e.jurisdiction,
          riskLevel: e.riskLevel,
          relationship: e.relationship,
          conviction: e.conviction.substring(0, 500),
          penalty: e.penalty,
          sanctioned: e.sanctioned,
          operationalRole: e.operationalRole.substring(0, 500),
          complianceImplication: e.complianceImplication.substring(0, 500),
          riskSignals: e.riskSignals.join(' | ').substring(0, 900),
          category: 'entity_investigation',
          investigation: 'KATHAROS-2026-GLENCORE-001',
          parentSubject: 'Glencore plc',
          source: 'katharos-investigation',
          type_tag: 'entity',
          text: buildEntityEmbeddingText(e).substring(0, 1000),
          timestamp: new Date().toISOString()
        }
      });
    });

    console.log(`  Embedded entities ${i + 1}-${Math.min(i + BATCH, entities.length)} of ${entities.length}`);
  }

  // 2. Tier overview vectors
  const tierTexts = tiers.map(t => `Glencore investigation ${t.title}: ${t.content.substring(0, 800)}`);
  if (tierTexts.length > 0) {
    const tierEmbed = await pc.inference.embed('multilingual-e5-large', tierTexts, {
      inputType: 'passage',
      truncate: 'END'
    });
    tiers.forEach((t, i) => {
      allVectors.push({
        id: t.id,
        values: tierEmbed.data[i].values,
        metadata: {
          name: t.title,
          category: 'entity_investigation',
          investigation: 'KATHAROS-2026-GLENCORE-001',
          parentSubject: 'Glencore plc',
          source: 'katharos-investigation',
          type_tag: 'tier_overview',
          text: t.content.substring(0, 1000),
          timestamp: new Date().toISOString()
        }
      });
    });
    console.log(`  Embedded ${tiers.length} tier overviews`);
  }

  // 3. Relationship map vector
  if (relMapMatch) {
    const relText = `Glencore plc corporate network relationship map showing all 33 entities across 8 tiers: convicted subsidiaries, OFAC 50% rule entities, Dan Gertler sanctioned network, offshore entities in Bermuda BVI Panama Anguilla, Paradise Papers entities, hidden shipping fleet SwissMarine, bribery intermediaries, and predecessor entity Marc Rich. ${relMapMatch[1].substring(0, 600)}`;
    const relEmbed = await pc.inference.embed('multilingual-e5-large', [relText], {
      inputType: 'passage',
      truncate: 'END'
    });
    allVectors.push({
      id: 'glencore-relationship-map',
      values: relEmbed.data[0].values,
      metadata: {
        name: 'Glencore Corporate Network Relationship Map',
        category: 'entity_investigation',
        investigation: 'KATHAROS-2026-GLENCORE-001',
        parentSubject: 'Glencore plc',
        source: 'katharos-investigation',
        type_tag: 'relationship_map',
        text: relMapMatch[1].substring(0, 1000),
        timestamp: new Date().toISOString()
      }
    });
    console.log('  Embedded relationship map');
  }

  // 4. Compliance recommendation vector
  if (compRecMatch) {
    const compText = `Glencore plc compliance recommendation: DO NOT TRANSACT WITHOUT ENHANCED DUE DILIGENCE. Four convicted subsidiaries totaling $1.5B+ penalties. Active payments to OFAC SDN Dan Gertler. Seven active offshore entities. Bribery intermediary network in 7 countries. ${compRecMatch[1].substring(0, 500)}`;
    const compEmbed = await pc.inference.embed('multilingual-e5-large', [compText], {
      inputType: 'passage',
      truncate: 'END'
    });
    allVectors.push({
      id: 'glencore-compliance-recommendation',
      values: compEmbed.data[0].values,
      metadata: {
        name: 'Glencore Compliance Recommendation',
        category: 'entity_investigation',
        investigation: 'KATHAROS-2026-GLENCORE-001',
        parentSubject: 'Glencore plc',
        source: 'katharos-investigation',
        type_tag: 'compliance_recommendation',
        text: compRecMatch[1].substring(0, 1000),
        timestamp: new Date().toISOString()
      }
    });
    console.log('  Embedded compliance recommendation');
  }

  // 5. Investigation metadata vector
  if (metadataMatch) {
    const metaText = `Glencore plc full entity investigation KATHAROS-2026-GLENCORE-001: 33 entities across 8 tiers including convicted subsidiaries Glencore International AG and Glencore Ltd, OFAC 50% rule entities Kamoto Copper Company and Mutanda Mining, sanctioned Dan Gertler network, active offshore entities in Bermuda BVI Panama, Paradise Papers Appleby entities, hidden SwissMarine shipping fleet, bribery intermediaries across Nigeria Cameroon Equatorial Guinea Ivory Coast South Sudan DRC, and predecessor Marc Rich criminal entity. Basic screening returns 1 clean entity. This investigation returns 33.`;
    const metaEmbed = await pc.inference.embed('multilingual-e5-large', [metaText], {
      inputType: 'passage',
      truncate: 'END'
    });
    allVectors.push({
      id: 'glencore-investigation-metadata',
      values: metaEmbed.data[0].values,
      metadata: {
        name: 'Glencore Investigation Overview',
        category: 'entity_investigation',
        investigation: 'KATHAROS-2026-GLENCORE-001',
        parentSubject: 'Glencore plc',
        source: 'katharos-investigation',
        type_tag: 'investigation_metadata',
        text: metaText.substring(0, 1000),
        totalEntities: '33',
        riskLevel: 'CRITICAL',
        timestamp: new Date().toISOString()
      }
    });
    console.log('  Embedded investigation metadata');
  }

  // Upsert all vectors
  console.log(`\nUpserting ${allVectors.length} total vectors...`);
  for (let i = 0; i < allVectors.length; i += 10) {
    const batch = allVectors.slice(i, i + 10);
    await ns.upsert(batch);
    console.log(`  Upserted ${Math.min(i + 10, allVectors.length)}/${allVectors.length}`);
  }

  console.log(`\nDone. ${allVectors.length} vectors seeded to namespace "${NAMESPACE}".`);
  console.log('Entities:', entities.length);
  console.log('Tier overviews:', tiers.length);
  console.log('Relationship map: 1');
  console.log('Compliance recommendation: 1');
  console.log('Investigation metadata: 1');
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
