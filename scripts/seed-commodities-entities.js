#!/usr/bin/env node
/**
 * Seed Commodities Trading Houses entity database into Pinecone RAG knowledge base.
 *
 * Parses katharos-commodities-entity-database.md, extracts each entity's JSON block
 * + shared intermediary network + compliance recommendation, generates embeddings via
 * Pinecone Inference, and upserts to the "entity_investigations" namespace.
 *
 * Covers: Vitol, Trafigura, Gunvor, Freepoint Commodities, Mercuria
 *
 * Usage: PINECONE_API_KEY=pcsk_... node scripts/seed-commodities-entities.js
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

  // Split on ### N. EntityName pattern (numbered entity headers)
  const entitySections = markdown.split(/\n(?=### \d+\.\s)/);

  // Track which section (company) we're in
  let currentCompany = '';
  const sectionRegex = /## SECTION \d+: (.+)/;

  for (const section of entitySections) {
    // Check if this section starts a new company section
    const companyMatch = section.match(sectionRegex);
    if (companyMatch) {
      currentCompany = companyMatch[1].trim();
    }

    const headerMatch = section.match(/^### \d+\.\s+(.+)/);
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
    const id = `commodities-${entityId.toLowerCase() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;

    // Determine parent company from entity_id prefix or section
    let parentCompany = currentCompany;
    if (entityId.startsWith('VIT')) parentCompany = 'Vitol Group';
    else if (entityId.startsWith('TRA')) parentCompany = 'Trafigura Group';
    else if (entityId.startsWith('GUN')) parentCompany = 'Gunvor Group';
    else if (entityId.startsWith('FRP')) parentCompany = 'Freepoint Commodities';
    else if (entityId.startsWith('MER')) parentCompany = 'Mercuria Energy Group';
    else if (entityId.startsWith('NET')) parentCompany = 'Shared Intermediary Network';

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
      convicted: data.convicted || false,
      dpa: data.dpa || false,
      convictionDetail: data.conviction_detail || data.dpa_detail || '',
      briberyConduit: data.bribery_conduit || false,
      crossCompanyExposure: data.cross_company_exposure || '',
      networkRole: data.network_role || '',
      beneficialOwner: data.beneficial_owner || '',
      role: data.role || data.operational_role || '',
      note: data.note || '',
      parentCompany,
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
    e.parentCompany ? `Parent company: ${e.parentCompany}` : '',
    e.sanctioned ? 'SANCTIONED: Yes' : '',
    e.convicted ? 'CONVICTED: Yes' : '',
    e.dpa ? 'DEFERRED PROSECUTION AGREEMENT: Yes' : '',
    e.convictionDetail ? `Conviction/DPA: ${e.convictionDetail}` : '',
    e.briberyConduit ? 'BRIBERY CONDUIT: Yes — shell company used to route corrupt payments' : '',
    e.crossCompanyExposure ? `Cross-company exposure: ${e.crossCompanyExposure}` : '',
    e.networkRole ? `Network role: ${e.networkRole}` : '',
    e.beneficialOwner ? `Beneficial owner: ${e.beneficialOwner}` : '',
    e.role ? `Role: ${e.role}` : '',
    e.note ? `Note: ${e.note}` : '',
    e.sourcePrimary ? `Source: ${e.sourcePrimary}` : '',
    'Investigation: Commodities Trading Houses — 54 entities across 5 companies',
    'Companies: Vitol, Trafigura, Gunvor, Freepoint, Mercuria',
    'Total FCPA penalties: $2.23 billion (2020-2024)',
  ];
  return parts.filter(Boolean).join(' | ');
}

// ── Extract company section overviews ──

function extractSectionOverviews(markdown) {
  const sections = [];
  const sectionRegex = /\n## (SECTION \d+: .+)\n([\s\S]*?)(?=\n## SECTION |\n## SHARED INTERMEDIARY|\n## COMPLIANCE RECOMMENDATION|$)/g;
  let match;
  while ((match = sectionRegex.exec(markdown)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    const id = `commodities-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;
    sections.push({ id, title, content: content.substring(0, 2000) });
  }
  return sections;
}

// ── Main ──

async function main() {
  if (!process.env.PINECONE_API_KEY) {
    console.error('Error: PINECONE_API_KEY environment variable not set');
    process.exit(1);
  }

  const mdPath = path.resolve(__dirname, '..', 'katharos-commodities-entity-database.md');
  if (!fs.existsSync(mdPath)) {
    console.error(`Error: ${mdPath} not found.`);
    process.exit(1);
  }

  const md = fs.readFileSync(mdPath, 'utf-8');

  // Parse entities
  const entities = parseEntities(md);
  console.log(`Parsed ${entities.length} entities from Commodities investigation`);

  // Extract section overviews
  const sections = extractSectionOverviews(md);
  console.log(`Extracted ${sections.length} section overviews`);

  // Extract shared intermediary and compliance sections
  const sharedMatch = md.match(/## SHARED INTERMEDIARY NETWORK\n([\s\S]*?)(?=\n## COMPLIANCE RECOMMENDATION|$)/);
  const compRecMatch = md.match(/## COMPLIANCE RECOMMENDATION\n([\s\S]*?)$/);
  const metadataMatch = md.match(/## INVESTIGATION METADATA\n([\s\S]*?)(?=\n## SECTION 1)/);

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
          convicted: String(e.convicted),
          dpa: String(e.dpa),
          briberyConduit: String(e.briberyConduit),
          convictionDetail: (e.convictionDetail || '').substring(0, 500),
          crossCompanyExposure: e.crossCompanyExposure || '',
          networkRole: e.networkRole || '',
          beneficialOwner: e.beneficialOwner || '',
          parentCompany: e.parentCompany,
          sourcePrimary: (e.sourcePrimary || '').substring(0, 300),
          sourceUrl: e.sourceUrl || '',
          sourceType: e.sourceType || '',
          sourceDate: e.sourceDate || '',
          confidence: e.confidence,
          category: 'entity_investigation',
          investigation: 'KATHAROS-2026-COMMODITIES-001',
          source: 'katharos-investigation',
          type_tag: 'entity',
          text: buildEntityEmbeddingText(e).substring(0, 1000),
          timestamp: new Date().toISOString()
        }
      });
    });

    console.log(`  Embedded entities ${i + 1}-${Math.min(i + BATCH, entities.length)} of ${entities.length}`);
  }

  // 2. Section overview vectors
  if (sections.length > 0) {
    const sectionTexts = sections.map(s => `Commodities investigation ${s.title}: ${s.content.substring(0, 800)}`);
    const sectionEmbed = await pc.inference.embed('multilingual-e5-large', sectionTexts, {
      inputType: 'passage',
      truncate: 'END'
    });
    sections.forEach((s, i) => {
      allVectors.push({
        id: s.id,
        values: sectionEmbed.data[i].values,
        metadata: {
          name: s.title,
          category: 'entity_investigation',
          investigation: 'KATHAROS-2026-COMMODITIES-001',
          source: 'katharos-investigation',
          type_tag: 'section_overview',
          text: s.content.substring(0, 1000),
          timestamp: new Date().toISOString()
        }
      });
    });
    console.log(`  Embedded ${sections.length} section overviews`);
  }

  // 3. Shared intermediary network vector
  if (sharedMatch) {
    const sharedText = `Commodities trading houses shared intermediary network: Pere Ycaza brothers operated across Vitol and Gunvor Ecuador schemes. Nilsen Arias Sandoval Petroecuador official bribed by both Vitol and Gunvor. Rodrigo Berkowitz Petrobras trader bribed by Vitol Freepoint connected to Trafigura as agent. Lionel Hanst previously employed at Mercuria convicted in Vitol Ecuador scheme. Cross-firm contamination means standard screening of any single trading house misses the network. ${sharedMatch[1].substring(0, 500)}`;
    const sharedEmbed = await pc.inference.embed('multilingual-e5-large', [sharedText], {
      inputType: 'passage',
      truncate: 'END'
    });
    allVectors.push({
      id: 'commodities-shared-intermediary-network',
      values: sharedEmbed.data[0].values,
      metadata: {
        name: 'Commodities Shared Intermediary Network',
        category: 'entity_investigation',
        investigation: 'KATHAROS-2026-COMMODITIES-001',
        source: 'katharos-investigation',
        type_tag: 'relationship_map',
        text: sharedMatch[1].substring(0, 1000),
        timestamp: new Date().toISOString()
      }
    });
    console.log('  Embedded shared intermediary network');
  }

  // 4. Compliance recommendation vector
  if (compRecMatch) {
    const compText = `Commodities trading houses compliance recommendation: HIGH RISK concentrated sector exposure. Five trading houses share $2.23 billion in combined FCPA penalties 2020-2024. Same bribery intermediaries across multiple traders. Same state oil company officials accepting bribes from competing traders. Institutional origin connections Marc Rich alumni. Cross-contamination via employee movement. Sanctioned founder Timchenko Gunvor. ${compRecMatch[1].substring(0, 500)}`;
    const compEmbed = await pc.inference.embed('multilingual-e5-large', [compText], {
      inputType: 'passage',
      truncate: 'END'
    });
    allVectors.push({
      id: 'commodities-compliance-recommendation',
      values: compEmbed.data[0].values,
      metadata: {
        name: 'Commodities Trading Houses Compliance Recommendation',
        category: 'entity_investigation',
        investigation: 'KATHAROS-2026-COMMODITIES-001',
        source: 'katharos-investigation',
        type_tag: 'compliance_recommendation',
        text: compRecMatch[1].substring(0, 1000),
        timestamp: new Date().toISOString()
      }
    });
    console.log('  Embedded compliance recommendation');
  }

  // 5. Investigation metadata vector
  const metaText = `Commodities trading houses full entity investigation KATHAROS-2026-COMMODITIES-001: 54 entities across 5 major commodities trading companies — Vitol Group (DPA $163.7M), Trafigura Beheer BV (guilty plea $127M plus $76M Brazil), Gunvor SA (guilty plea $661M largest single FCPA penalty), Freepoint Commodities LLC (DPA $98.6M), Mercuria Energy Group (no FCPA but J&S origin and ChemChina 12% state ownership). Shared intermediary network includes Pere Ycaza brothers across Vitol and Gunvor, Nilsen Arias Sandoval bribed by multiple traders, Rodrigo Berkowitz across Vitol Freepoint Trafigura. Total combined penalties $2.23 billion. Gennady Timchenko OFAC SDN Gunvor founder. Basic screening returns clean parent entities. This investigation returns 54 entities with cross-firm contamination analysis.`;
  const metaEmbed = await pc.inference.embed('multilingual-e5-large', [metaText], {
    inputType: 'passage',
    truncate: 'END'
  });
  allVectors.push({
    id: 'commodities-investigation-metadata',
    values: metaEmbed.data[0].values,
    metadata: {
      name: 'Commodities Trading Houses Investigation Overview',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-COMMODITIES-001',
      source: 'katharos-investigation',
      type_tag: 'investigation_metadata',
      text: metaText.substring(0, 1000),
      totalEntities: '54',
      riskLevel: 'HIGH',
      companies: 'Vitol, Trafigura, Gunvor, Freepoint, Mercuria',
      totalPenalties: '$2.23 billion',
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
  console.log('Section overviews:', sections.length);
  console.log('Shared intermediary network: 1');
  console.log('Compliance recommendation: 1');
  console.log('Investigation metadata: 1');
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
