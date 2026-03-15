#!/usr/bin/env node
/**
 * Seed Russian Oligarch Networks entity database into Pinecone RAG knowledge base.
 *
 * Parses katharos-oligarch-entity-database.md, extracts each entity's JSON block
 * + cross-network connections + subject overviews, generates embeddings via
 * Pinecone Inference, and upserts to the "entity_investigations" namespace.
 *
 * Covers: Putin network (33 entities), Potanin (15), Deripaska (16+),
 *         Abramovich (14+), Cross-network (5), Pass 3 associates (36)
 * Total: 135 entities
 *
 * Usage: PINECONE_API_KEY=pcsk_... node scripts/seed-oligarch-entities.js
 */

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'entity_investigations';

// ── Parse entity JSON blocks from markdown ──

function parseEntities(markdown) {
  const entities = [];

  // Split on ### Entity N: pattern (oligarch database format)
  const entitySections = markdown.split(/\n(?=### Entity \d+:)/);

  // Track which subject network we're in
  let currentSubject = '';
  const subjectRegex = /## SUBJECT \d+: (.+)/;
  const crossNetRegex = /## CROSS-NETWORK CONNECTIONS/;
  const passRegex = /## PASS 3 NEW ENTITIES/;
  const assocRegex = /## ASSOCIATE ENTITIES/;

  for (const section of entitySections) {
    // Check if this section starts a new subject
    const subjectMatch = section.match(subjectRegex);
    if (subjectMatch) {
      currentSubject = subjectMatch[1].trim();
    }
    if (crossNetRegex.test(section)) {
      currentSubject = 'Cross-Network Connections';
    }
    if (passRegex.test(section)) {
      currentSubject = 'Pass 3 New Entities';
    }
    if (assocRegex.test(section)) {
      currentSubject = 'Associate Entities';
    }

    const headerMatch = section.match(/^### Entity \d+:\s+(.+)/);
    if (!headerMatch) continue;

    const headerName = headerMatch[1].trim();

    // Extract JSON block from section
    const jsonMatch = section.match(/```json\s*\n([\s\S]*?)\n```/);
    if (!jsonMatch) continue;

    let data;
    try {
      data = JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.warn(`  Warning: Failed to parse JSON for "${headerName}": ${e.message}`);
      continue;
    }

    const entityId = data.entity_id || '';
    const name = data.full_legal_name || headerName;
    const id = `oligarch-${entityId.toLowerCase() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;

    // Determine parent network from entity_id prefix
    let parentNetwork = currentSubject;
    if (entityId.startsWith('PUT')) parentNetwork = 'Vladimir Putin Network';
    else if (entityId.startsWith('POT')) parentNetwork = 'Vladimir Potanin Network';
    else if (entityId.startsWith('DER')) parentNetwork = 'Oleg Deripaska Network';
    else if (entityId.startsWith('ABR')) parentNetwork = 'Roman Abramovich Network';
    else if (entityId.startsWith('CROSS')) parentNetwork = 'Cross-Network Connections';

    // Flatten sanctions_details if present
    let sanctionsStr = '';
    if (data.sanctions_details && typeof data.sanctions_details === 'object') {
      sanctionsStr = Object.entries(data.sanctions_details)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');
    }

    entities.push({
      id,
      entityId,
      name,
      aliases: Array.isArray(data.aliases) ? data.aliases.join(', ') : (data.aliases || ''),
      type: data.entity_type || 'company',
      jurisdiction: Array.isArray(data.jurisdictions) ? data.jurisdictions.join(', ') : (data.jurisdiction || ''),
      tier: data.tier !== undefined ? data.tier : -1,
      riskLevel: data.risk_level || '',
      sanctioned: data.sanctioned || false,
      sanctionsDetails: sanctionsStr,
      criminalCharges: typeof data.criminal_charges === 'string' ? data.criminal_charges : (data.criminal_charges ? 'Yes' : ''),
      dob: data.dob || '',
      basis: data.basis || '',
      significance: data.significance || '',
      description: data.description || '',
      evasionScheme: data.evasion_scheme || (typeof data.evasion_scheme === 'boolean' ? data.evasion_scheme : false),
      ofac50pct: data.ofac_50pct_rule || false,
      crossNetwork: data.cross_network || false,
      role: data.role || data.operational_role || '',
      note: data.note || '',
      beneficialOwner: data.beneficial_owner || '',
      parentNetwork,
      sourcePrimary: data.source_primary || '',
      sourceUrl: data.source_url || '',
      sourceType: data.source_type || '',
      sourceDate: data.source_date || '',
      confidence: data.confidence || 'high',
      content: section.trim(),
    });
  }

  return entities;
}

// ── Build embedding text for semantic search ──

function buildEntityEmbeddingText(e) {
  const parts = [
    `Entity: ${e.name}`,
    e.aliases ? `Aliases: ${e.aliases}` : '',
    `Type: ${e.type}`,
    `Jurisdiction: ${e.jurisdiction}`,
    `Risk Level: ${e.riskLevel}`,
    e.parentNetwork ? `Network: ${e.parentNetwork}` : '',
    e.sanctioned ? 'SANCTIONED: Yes' : '',
    e.sanctionsDetails ? `Sanctions: ${e.sanctionsDetails}` : '',
    e.criminalCharges ? `Criminal charges: ${e.criminalCharges}` : '',
    e.dob ? `DOB: ${e.dob}` : '',
    e.basis ? `Basis: ${e.basis}` : '',
    e.significance ? `Significance: ${e.significance}` : '',
    e.description ? `Description: ${e.description}` : '',
    e.evasionScheme && e.evasionScheme !== false ? `EVASION SCHEME: ${typeof e.evasionScheme === 'string' ? e.evasionScheme : 'Yes — entity created to circumvent sanctions'}` : '',
    e.ofac50pct ? 'OFAC 50% RULE: Yes — blocked property under OFAC SDN ownership threshold' : '',
    e.crossNetwork ? 'CROSS-NETWORK: Yes — links multiple oligarch networks' : '',
    e.role ? `Role: ${e.role}` : '',
    e.beneficialOwner ? `Beneficial owner: ${e.beneficialOwner}` : '',
    e.note ? `Note: ${e.note}` : '',
    e.sourcePrimary ? `Source: ${e.sourcePrimary}` : '',
    'Investigation: Russian Oligarch Networks — 135 entities across 4 networks',
    'Subjects: Putin, Potanin, Deripaska, Abramovich',
    'Standard screening finds 16. This investigation finds 135. Coverage gap: 87%.',
  ];
  return parts.filter(Boolean).join(' | ');
}

// ── Extract subject overview sections ──

function extractSubjectOverviews(markdown) {
  const subjects = [];
  // Match SUBJECT sections and CROSS-NETWORK section
  const subjectRegex = /\n## (SUBJECT \d+: .+|CROSS-NETWORK CONNECTIONS|ASSOCIATE ENTITIES|PASS 3 NEW ENTITIES)\n([\s\S]*?)(?=\n## SUBJECT |\n## CROSS-NETWORK|\n## SQL-READY|\n## ASSOCIATE|\n## PASS 3|\n## UPDATED SQL|$)/g;
  let match;
  while ((match = subjectRegex.exec(markdown)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    const id = `oligarch-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;
    subjects.push({ id, title, content: content.substring(0, 2000) });
  }
  return subjects;
}

// ── Main ──

async function main() {
  if (!process.env.PINECONE_API_KEY) {
    console.error('Error: PINECONE_API_KEY environment variable not set');
    process.exit(1);
  }

  const mdPath = path.resolve(__dirname, '..', 'katharos-oligarch-entity-database.md');
  if (!fs.existsSync(mdPath)) {
    console.error(`Error: ${mdPath} not found.`);
    process.exit(1);
  }

  const md = fs.readFileSync(mdPath, 'utf-8');

  // Parse entities
  const entities = parseEntities(md);
  console.log(`Parsed ${entities.length} entities from Russian Oligarch Networks investigation`);

  // Extract subject overviews
  const subjects = extractSubjectOverviews(md);
  console.log(`Extracted ${subjects.length} subject overview sections`);

  // Extract cross-network and investigation metadata
  const crossNetMatch = md.match(/## CROSS-NETWORK CONNECTIONS\n([\s\S]*?)(?=\n## SQL-READY|\n## ASSOCIATE|\n## PASS 3|$)/);
  const metadataMatch = md.match(/## INVESTIGATION METADATA\n([\s\S]*?)(?=\n## SUBJECT 1)/);

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
          entityId: e.entityId,
          aliases: e.aliases,
          type: e.type,
          jurisdiction: e.jurisdiction,
          tier: String(e.tier),
          riskLevel: e.riskLevel,
          sanctioned: String(e.sanctioned),
          sanctionsDetails: (e.sanctionsDetails || '').substring(0, 500),
          criminalCharges: (e.criminalCharges || '').substring(0, 500),
          evasionScheme: String(e.evasionScheme),
          ofac50pct: String(e.ofac50pct),
          crossNetwork: String(e.crossNetwork),
          significance: (e.significance || '').substring(0, 500),
          description: (e.description || '').substring(0, 500),
          role: (e.role || '').substring(0, 500),
          beneficialOwner: e.beneficialOwner || '',
          parentNetwork: e.parentNetwork,
          sourcePrimary: (e.sourcePrimary || '').substring(0, 300),
          sourceUrl: e.sourceUrl || '',
          sourceType: e.sourceType || '',
          sourceDate: e.sourceDate || '',
          confidence: e.confidence,
          category: 'entity_investigation',
          investigation: 'KATHAROS-2026-OLIGARCHS-001',
          source: 'katharos-investigation',
          type_tag: 'entity',
          text: buildEntityEmbeddingText(e).substring(0, 1000),
          timestamp: new Date().toISOString()
        }
      });
    });

    console.log(`  Embedded entities ${i + 1}-${Math.min(i + BATCH, entities.length)} of ${entities.length}`);
  }

  // 2. Subject overview vectors
  if (subjects.length > 0) {
    const subjectTexts = subjects.map(s => `Russian Oligarch Networks investigation ${s.title}: ${s.content.substring(0, 800)}`);
    const subjectEmbed = await pc.inference.embed('multilingual-e5-large', subjectTexts, {
      inputType: 'passage',
      truncate: 'END'
    });
    subjects.forEach((s, i) => {
      allVectors.push({
        id: s.id,
        values: subjectEmbed.data[i].values,
        metadata: {
          name: s.title,
          category: 'entity_investigation',
          investigation: 'KATHAROS-2026-OLIGARCHS-001',
          source: 'katharos-investigation',
          type_tag: 'subject_overview',
          text: s.content.substring(0, 1000),
          timestamp: new Date().toISOString()
        }
      });
    });
    console.log(`  Embedded ${subjects.length} subject overviews`);
  }

  // 3. Cross-network connections vector
  if (crossNetMatch) {
    const crossText = `Russian oligarch cross-network connections: Abramovich transferred advertising company stakes to Roldugin (Putin wallet) creating direct financial edge between Abramovich and Putin networks. Gazprombank Zurich held accounts for Roldugin shell companies with four Swiss banking executives indicted. Seqouia Treuhand Trust Zurich manages assets for both Timchenko and Usmanov connecting two separate sanctioned networks. Ozero Dacha Cooperative founding cooperative connecting Putin Kovalchuk Fursenko Myachin Yakunin Shamalov — all later became billionaires or senior officials. McGonigal former FBI counterintelligence chief hired by Deripaska to target rival Potanin — cross-network intelligence operation. ${crossNetMatch[1].substring(0, 400)}`;
    const crossEmbed = await pc.inference.embed('multilingual-e5-large', [crossText], {
      inputType: 'passage',
      truncate: 'END'
    });
    allVectors.push({
      id: 'oligarch-cross-network-connections',
      values: crossEmbed.data[0].values,
      metadata: {
        name: 'Russian Oligarch Cross-Network Connections',
        category: 'entity_investigation',
        investigation: 'KATHAROS-2026-OLIGARCHS-001',
        source: 'katharos-investigation',
        type_tag: 'relationship_map',
        text: crossNetMatch[1].substring(0, 1000),
        timestamp: new Date().toISOString()
      }
    });
    console.log('  Embedded cross-network connections');
  }

  // 4. Investigation metadata vector
  const metaText = `Russian Oligarch Networks full entity investigation KATHAROS-2026-OLIGARCHS-001: 135 entities across 4 oligarch networks — Vladimir Putin (33 entities: Ozero Dacha inner circle, Roldugin Panama Papers shells, Bank Rossiya, Kovalchuk media empire, Rotenberg construction, Timchenko Volga Group OFAC sub-entities), Vladimir Potanin (15 entities: Interros, Norilsk Nickel, Rosbank, 7 post-ICIJ evasion entities designated June 2024), Oleg Deripaska (24 entities: EN+, Rusal, Basic Element, B-Finance, 4 sanctions evasion entities Titul/Iliadis/Rasperia, DOJ co-conspirators including former FBI chief McGonigal), Roman Abramovich (19 entities: Millhouse, Chelsea FC, Evraz, Cyprus Confidential 261 companies, Keygrove trust structure, Shvidler tax evasion). Cross-network connections: Abramovich-to-Roldugin advertising stake, Gazprombank Zurich indictments, Seqouia Treuhand dual-network trust. Standard screening returns 16 entities. This investigation returns 135. Coverage gap: 87%. Key finding: Seven Potanin evasion entities created after all ICIJ datasets, four Deripaska evasion entities to circumvent sanctions, McGonigal FBI-to-oligarch corruption.`;
  const metaEmbed = await pc.inference.embed('multilingual-e5-large', [metaText], {
    inputType: 'passage',
    truncate: 'END'
  });
  allVectors.push({
    id: 'oligarch-investigation-metadata',
    values: metaEmbed.data[0].values,
    metadata: {
      name: 'Russian Oligarch Networks Investigation Overview',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-OLIGARCHS-001',
      source: 'katharos-investigation',
      type_tag: 'investigation_metadata',
      text: metaText.substring(0, 1000),
      totalEntities: '135',
      riskLevel: 'CRITICAL',
      coverageGap: '87%',
      subjects: 'Putin, Potanin, Deripaska, Abramovich',
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
  console.log('Subject overviews:', subjects.length);
  console.log('Cross-network connections: 1');
  console.log('Investigation metadata: 1');
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
