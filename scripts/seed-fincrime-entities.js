#!/usr/bin/env node
/**
 * Seed Financial Crime Database into Pinecone RAG knowledge base.
 *
 * Parses katharos-fincrime-database.md, extracts entities from:
 * - Full subject entries with tables (ML-001 through ML-016, IND-001–010, etc.)
 * - Compact entries (**PREFIX-NNN — Name** followed by paragraph)
 * - Ultra-compact entries (AF-026: Name — description)
 *
 * Categories: ML (Convicted Money Launderers), IND (Indicted), FRD (Fraud),
 *             RICO, AF (Asset Forfeiture), CRT (Cartel), CF (Crypto Fraud)
 * Total: ~2,260 entities across 350 subjects (7 categories × 50)
 *
 * Usage: PINECONE_API_KEY=pcsk_... node scripts/seed-fincrime-entities.js
 */

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'entity_investigations';
const INVESTIGATION_ID = 'KATHAROS-2026-FINCRIME-001';

// ── Category metadata ──

const CATEGORIES = {
  'ML':   { name: 'Convicted Money Launderers', prefix: 'fincrime-ml' },
  'IND':  { name: 'Indicted / Pending', prefix: 'fincrime-ind' },
  'FRD':  { name: 'Fraud Defendants', prefix: 'fincrime-frd' },
  'RICO': { name: 'RICO Defendants', prefix: 'fincrime-rico' },
  'AF':   { name: 'Asset Forfeiture Targets', prefix: 'fincrime-af' },
  'CRT':  { name: 'Cartel-Linked Entities', prefix: 'fincrime-crt' },
  'CF':   { name: 'Crypto Fraud Actors', prefix: 'fincrime-cf' },
};

// ── Parse the markdown ──

function parseMarkdown(markdown) {
  const subjects = [];
  const lines = markdown.split('\n');

  let currentSubject = null;
  let currentCategory = null;
  let inTable = false;
  let tableHeaders = [];
  let inCompactSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Stop at summary sections
    if (line.startsWith('## CATEGORY SUMMARY TABLE') ||
        line.startsWith('## CROSS-CATEGORY COMPLIANCE PATTERNS')) {
      if (currentSubject && currentSubject.entities.length > 0) subjects.push(currentSubject);
      currentSubject = null;
      break;
    }

    // Track category headers: # CATEGORY N — NAME or ## Category Name
    const catHeaderMatch = line.match(/^# CATEGORY (\d+) — (.+)/);
    if (catHeaderMatch) {
      if (currentSubject && currentSubject.entities.length > 0) subjects.push(currentSubject);
      currentSubject = null;
      inTable = false;
      inCompactSection = false;
      // Detect category from header text
      const headerText = catHeaderMatch[2].toUpperCase();
      if (headerText.includes('CONVICTED MONEY LAUNDERER')) currentCategory = 'ML';
      else if (headerText.includes('INDICTED')) currentCategory = 'IND';
      else if (headerText.includes('FRAUD')) currentCategory = 'FRD';
      else if (headerText.includes('RICO')) currentCategory = 'RICO';
      else if (headerText.includes('ASSET FORFEITURE')) currentCategory = 'AF';
      else if (headerText.includes('CARTEL')) currentCategory = 'CRT';
      else if (headerText.includes('CRYPTO FRAUD')) currentCategory = 'CF';
      continue;
    }

    // Also detect category from section headers like ## Convicted Money Launderers
    const sectionCatMatch = line.match(/^## (.+)/);
    if (sectionCatMatch) {
      const t = sectionCatMatch[1].toUpperCase();
      if (t.includes('CONVICTED MONEY LAUNDERER')) currentCategory = 'ML';
      else if (t.includes('INDICTED') && !t.includes('SUMMARY')) currentCategory = 'IND';
      else if (t.includes('FRAUD DEFENDANT') && !t.includes('SUMMARY')) currentCategory = 'FRD';
      else if (t.includes('RICO DEFENDANT') && !t.includes('SUMMARY')) currentCategory = 'RICO';
      else if (t.includes('ASSET FORFEITURE') && !t.includes('SUMMARY')) currentCategory = 'AF';
      else if (t.includes('CARTEL') && !t.includes('SUMMARY')) currentCategory = 'CRT';
      else if (t.includes('CRYPTO FRAUD') && !t.includes('SUMMARY')) currentCategory = 'CF';
      // Handle summary sections within categories
      if (t.includes('CATEGORY 1 SUMMARY') || t.includes('SUMMARY')) {
        if (currentSubject && currentSubject.entities.length > 0) subjects.push(currentSubject);
        currentSubject = null;
        inTable = false;
        inCompactSection = false;
      }
      continue;
    }

    // Track full subject headers: ### ML-001 — Name
    const fullSubjectMatch = line.match(/^### (ML|IND|FRD|RICO|AF|CRT|CF)-(\d+) — (.+)/);
    if (fullSubjectMatch) {
      if (currentSubject && currentSubject.entities.length > 0) subjects.push(currentSubject);
      const cat = fullSubjectMatch[1];
      const num = fullSubjectMatch[2];
      const name = fullSubjectMatch[3].trim();
      currentCategory = cat;
      inCompactSection = false;

      currentSubject = {
        id: `${cat}-${num}`,
        category: cat,
        number: parseInt(num),
        name,
        status: '',
        charges: '',
        keyFinding: '',
        entities: [],
      };
      inTable = false;
      continue;
    }

    // Track compact range headers: ### ML-017–050 — Additional ... (Compact Entries)
    const rangeSubjectMatch = line.match(/^### (ML|IND|FRD|RICO|AF|CRT|CF)-(\d+)[–\-](\d+) — (.+)/);
    if (rangeSubjectMatch) {
      if (currentSubject && currentSubject.entities.length > 0) subjects.push(currentSubject);
      currentSubject = null;
      currentCategory = rangeSubjectMatch[1];
      inTable = false;
      inCompactSection = true;
      continue;
    }

    // Parse compact bold entries: **ML-017 — Viktor Khrapunov / Kazakhstan (BVI/Switzerland)**
    const compactBoldMatch = line.match(/^\*\*(ML|IND|FRD|RICO|AF|CRT|CF)-(\d+) — (.+?)\*\*/);
    if (compactBoldMatch) {
      if (currentSubject && currentSubject.entities.length > 0) subjects.push(currentSubject);
      const cat = compactBoldMatch[1];
      const num = compactBoldMatch[2];
      const name = compactBoldMatch[3].trim();
      currentCategory = cat;

      // Get description from next line(s)
      let description = '';
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== '' &&
             !lines[j].startsWith('**') && !lines[j].startsWith('###') &&
             !lines[j].startsWith('---') && !lines[j].startsWith('## ') &&
             !lines[j].startsWith('# ')) {
        description += (description ? ' ' : '') + lines[j].trim();
        j++;
      }

      // Determine SDN status from description
      const descLower = description.toLowerCase();
      const isSdn = descLower.includes('sdn') && !descLower.includes('not sdn') && !descLower.includes('no sdn');
      const isConvicted = descLower.includes('convicted') || descLower.includes('pleaded guilty') || descLower.includes('sentenced');
      const isIndicted = descLower.includes('indicted') || descLower.includes('charged');
      const isFugitive = descLower.includes('fugitive') || descLower.includes('at large') || descLower.includes('disappeared');

      // Determine entity type from name and description
      let type = 'Individual';
      const nameLower = name.toLowerCase();
      if (nameLower.includes('bank') || nameLower.includes('financial') || nameLower.includes('exchange')) type = 'Financial Institution';
      else if (nameLower.includes('cartel') || nameLower.includes('gang') || nameLower.includes('crime family') || nameLower.includes('organization') || nameLower.includes('network')) type = 'Criminal Organization';
      else if (nameLower.includes('corp') || nameLower.includes('ltd') || nameLower.includes('inc') || nameLower.includes('llc') || nameLower.includes('group') || nameLower.includes('holdings')) type = 'Corporate';
      else if (nameLower.includes('operation') || nameLower.includes('task force')) type = 'Enforcement';

      currentSubject = {
        id: `${cat}-${num}`,
        category: cat,
        number: parseInt(num),
        name,
        status: isConvicted ? 'Convicted' : isIndicted ? 'Indicted' : isFugitive ? 'Fugitive' : '',
        charges: '',
        keyFinding: '',
        entities: [{
          name,
          jurisdiction: '',
          type,
          connection: description.substring(0, 500),
          sdn: isSdn ? 'Y' : 'N',
          source: 'DOJ/Katharos',
        }],
      };
      continue;
    }

    // Parse ultra-compact colon entries: AF-026: Viktor Bout ... — description
    const compactColonMatch = line.match(/^(ML|IND|FRD|RICO|AF|CRT|CF)-(\d+):\s*(.+?) — (.+)/);
    if (compactColonMatch) {
      if (currentSubject && currentSubject.entities.length > 0) subjects.push(currentSubject);
      const cat = compactColonMatch[1];
      const num = compactColonMatch[2];
      const name = compactColonMatch[3].trim();
      const description = compactColonMatch[4].trim();
      currentCategory = cat;

      const descLower = description.toLowerCase();
      const isSdn = descLower.includes('sdn') && !descLower.includes('not sdn');

      currentSubject = {
        id: `${cat}-${num}`,
        category: cat,
        number: parseInt(num),
        name,
        status: '',
        charges: '',
        keyFinding: '',
        entities: [{
          name,
          jurisdiction: '',
          type: 'entity',
          connection: description.substring(0, 500),
          sdn: isSdn ? 'Y' : 'N',
          source: 'DOJ/Katharos',
        }],
      };
      continue;
    }

    if (!currentSubject) continue;

    // Track Status
    const statusMatch = line.match(/\*\*Status:\*\*\s*(.+)/);
    if (statusMatch) {
      currentSubject.status = statusMatch[1].trim();
      continue;
    }

    // Track Charges
    const chargesMatch = line.match(/\*\*Charges:\*\*\s*(.+)/);
    if (chargesMatch) {
      currentSubject.charges = chargesMatch[1].trim();
      continue;
    }

    // Track key findings
    const keyMatch = line.match(/\*\*Key finding:\*\*\s*(.+)/);
    if (keyMatch) {
      currentSubject.keyFinding = keyMatch[1].trim();
      continue;
    }

    // Detect table header — flexible for all category formats
    if (line.trim().startsWith('|') &&
        (line.includes('Entity') || line.includes('Asset') || line.includes('System')) &&
        !line.trim().startsWith('|---')) {
      tableHeaders = line.split('|').map(c => c.trim()).filter(Boolean);
      inTable = true;
      continue;
    }

    // Skip separator rows
    if (line.trim().startsWith('|---') || line.trim().startsWith('| ---')) continue;

    // Parse table data rows
    if (inTable && line.trim().startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length < 2) continue;

      // Map to headers
      const entity = {};
      tableHeaders.forEach((header, idx) => {
        if (idx < cells.length) {
          const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
          entity[key] = cells[idx];
        }
      });

      // Extract entity name from various header formats
      const entityName = entity.entity || entity.asset_entity || entity.system_entity || '';
      if (!entityName || entityName === '---' || entityName === '#') continue;

      // Extract connection/notes from various columns
      const connection = entity.role || entity.notes || entity.connection || '';
      // Extract SDN status
      const sdnField = entity.sdn_ || entity.sdn || entity.status || '';
      // Extract source
      const source = entity.source || '';
      // Extract value (AF tables)
      const value = entity.value || '';
      // Extract asset (AF tables)
      const asset = entity.asset || '';

      currentSubject.entities.push({
        name: entityName,
        jurisdiction: entity.jurisdiction || '',
        type: entity.type || 'entity',
        connection: [connection, asset, value].filter(Boolean).join('; ').substring(0, 500),
        sdn: sdnField,
        source,
      });
      continue;
    }

    // End table on empty/non-table line
    if (inTable && !line.trim().startsWith('|')) {
      inTable = false;
    }

    // Parse bullet-point entities: - Entity Name — description
    if (currentSubject && line.trim().startsWith('- ') && line.includes('—')) {
      const bulletMatch = line.trim().match(/^- (.+?) — (.+)/);
      if (bulletMatch) {
        currentSubject.entities.push({
          name: bulletMatch[1].trim(),
          jurisdiction: '',
          type: 'entity',
          connection: bulletMatch[2].trim().substring(0, 500),
          sdn: 'N',
          source: 'DOJ/Katharos',
        });
      }
    }
  }

  if (currentSubject && currentSubject.entities.length > 0) subjects.push(currentSubject);
  return subjects;
}

// ── Build embedding text ──

function buildEntityEmbeddingText(entity, subject, catMeta) {
  const parts = [
    `Financial Crime Entity: ${entity.name}`,
    entity.type && entity.type !== 'entity' ? `Type: ${entity.type}` : '',
    entity.jurisdiction ? `Jurisdiction: ${entity.jurisdiction}` : '',
    entity.connection ? `Connection: ${entity.connection}` : '',
    entity.sdn ? `SDN status: ${entity.sdn}` : '',
    entity.source ? `Source: ${entity.source}` : '',
    `Subject: ${subject.name} (${subject.id})`,
    `Category: ${catMeta.name}`,
    subject.status ? `Status: ${subject.status}` : '',
    subject.charges ? `Charges: ${subject.charges}` : '',
    subject.keyFinding ? `Key finding: ${subject.keyFinding}` : '',
    `Investigation: Katharos Financial Crime Database — 350 subjects, ~2,260 entities`,
  ];
  return parts.filter(Boolean).join(' | ');
}

function buildSubjectEmbeddingText(subject, catMeta) {
  const entityNames = subject.entities.map(e => e.name).slice(0, 30).join(', ');
  const parts = [
    `Financial Crime Subject: ${subject.name} (${subject.id})`,
    `Category: ${catMeta.name}`,
    subject.status ? `Status: ${subject.status}` : '',
    subject.charges ? `Charges: ${subject.charges}` : '',
    `Entities: ${entityNames}`.substring(0, 800),
    subject.keyFinding ? `Key finding: ${subject.keyFinding}` : '',
    `Investigation: Katharos Financial Crime Database — 350 subjects across 7 categories`,
  ];
  return parts.filter(Boolean).join(' | ');
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '').substring(0, 60);
}

// ── Main ──

async function main() {
  if (!process.env.PINECONE_API_KEY) {
    console.error('Error: PINECONE_API_KEY environment variable not set');
    process.exit(1);
  }

  const mdPath = path.resolve(__dirname, '..', 'katharos-fincrime-database.md');
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
  console.log(`Total entities parsed: ${totalEntities}`);
  for (const [cat, count] of Object.entries(catCounts).sort()) {
    const meta = CATEGORIES[cat] || {};
    console.log(`  ${cat} (${meta.name || '?'}): ${count} entities`);
  }

  // Init Pinecone
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index(INDEX_NAME);
  const ns = index.namespace(NAMESPACE);

  const allVectors = [];

  // 1. Entity vectors
  const BATCH = 5;
  let entityIdx = 0;
  for (const subject of subjects) {
    const catMeta = CATEGORIES[subject.category] || CATEGORIES['ML'];
    const prefix = catMeta.prefix;

    for (let i = 0; i < subject.entities.length; i += BATCH) {
      const batch = subject.entities.slice(i, i + BATCH);
      const texts = batch.map(e => buildEntityEmbeddingText(e, subject, catMeta));

      const embedResult = await pc.inference.embed('multilingual-e5-large', texts, {
        inputType: 'passage', truncate: 'END'
      });

      batch.forEach((e, j) => {
        entityIdx++;
        const id = `${prefix}-${slugify(subject.name)}-${slugify(e.name)}`.substring(0, 100);

        // Determine SDN/risk status
        const sdnText = `${e.sdn} ${e.source} ${e.connection}`.toLowerCase();
        const isSdn = (e.sdn || '').trim().toUpperCase().startsWith('Y') ||
                       (sdnText.includes('sdn') && !sdnText.includes('not sdn') && !sdnText.includes('n ('));
        const isBlocked = sdnText.includes('blocked') || sdnText.includes('seized') ||
                          sdnText.includes('sanctioned') || sdnText.includes('convicted') ||
                          sdnText.includes('indicted');

        allVectors.push({
          id,
          values: embedResult.data[j].values,
          metadata: {
            name: e.name,
            type: e.type,
            jurisdiction: e.jurisdiction,
            connection: (e.connection || '').substring(0, 500),
            sdnStatus: e.sdn || 'Not individually designated',
            sanctioned: String(isSdn || isBlocked),
            riskLevel: isSdn ? 'CRITICAL' : isBlocked ? 'HIGH' : 'ELEVATED',
            source: (e.source || '').substring(0, 500),
            subjectName: subject.name,
            subjectId: subject.id,
            program: catMeta.name,
            category: 'entity_investigation',
            investigation: INVESTIGATION_ID,
            keyFinding: (subject.keyFinding || '').substring(0, 500),
            source_tag: 'katharos-investigation',
            type_tag: 'entity',
            text: buildEntityEmbeddingText(e, subject, catMeta).substring(0, 1000),
            timestamp: new Date().toISOString()
          }
        });
      });

      console.log(`  [${subject.id} ${subject.name.substring(0, 40)}] Embedded entities ${i + 1}-${Math.min(i + BATCH, subject.entities.length)} of ${subject.entities.length}`);
    }
  }

  // 2. Subject overview vectors
  console.log('\nEmbedding subject overviews...');
  for (let i = 0; i < subjects.length; i += BATCH) {
    const batch = subjects.slice(i, i + BATCH);
    const texts = batch.map(s => {
      const catMeta = CATEGORIES[s.category] || CATEGORIES['ML'];
      return buildSubjectEmbeddingText(s, catMeta);
    });

    const embedResult = await pc.inference.embed('multilingual-e5-large', texts, {
      inputType: 'passage', truncate: 'END'
    });

    batch.forEach((s, j) => {
      const catMeta = CATEGORIES[s.category] || CATEGORIES['ML'];
      const id = `${catMeta.prefix}-subject-${slugify(s.name)}`.substring(0, 100);
      allVectors.push({
        id,
        values: embedResult.data[j].values,
        metadata: {
          name: `Subject: ${s.name} (${s.id})`,
          type: 'subject_overview',
          subjectName: s.name,
          subjectId: s.id,
          program: catMeta.name,
          category: 'entity_investigation',
          investigation: INVESTIGATION_ID,
          status: (s.status || '').substring(0, 500),
          keyFinding: (s.keyFinding || '').substring(0, 500),
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

  // 3. Critical findings vector
  const critText = `Financial Crime Database Critical Findings ${INVESTIGATION_ID}: 1. COVERAGE GAP ~84% — Standard screening catches ~355 of ~2,260 entities; Katharos maps the remaining 84% including shell companies, feeder funds, enablers, real estate, crypto wallets, and nominee structures. 2. SDNY DOMINANCE — ~60% of high-value financial crime cases prosecuted in SDNY; dollar-clearing through NY creates long-arm jurisdiction over virtually any USD transaction. 3. PROFESSIONAL ENABLER RECURRENCE — Same Cyprus enabler networks (MeritServus, Henley & Partners) appear across ML, IND, AF categories; Paul Manafort's Cyprus structure identical to Deripaska-era vehicles. 4. CRYPTO MIXER CROSS-CATEGORY — Tornado Cash used by DPRK Lazarus, ransomware operators, cartel fiat-to-crypto, and individual fraudsters; appears in 15+ subjects across categories. 5. DEFERRED PROSECUTION + NO INDIVIDUAL ACCOUNTABILITY — Wachovia ($160M), HSBC ($1.9B), Deutsche Bank ($2.5B+), Barclays, UBS all paid record fines with no senior individual convictions; pattern changing post-2021 with TD Bank 2024 naming employees. 6. CRYPTO EXCHANGE CONTAGION — FTX→BlockFi→Voyager→Genesis→Gemini Earn: single counterparty failure cascaded; compliance must map crypto counterparty relationships. 7. CARTEL SUPPLY CHAIN — CJNG controls 70%+ Michoacán avocado production; Walmart, Costco implicated through supply chain; DEA briefed major US retailers. 8. 1MDB SCALE — $4.5B embezzled; Goldman Sachs $3.9B settlement (largest DOJ bank penalty); demonstrates SWF fraud + private banking + entertainment companies in single ML scheme. 9. MADOFF RECOVERY MODEL — SIPC trustee Irving Picard recovered $14.5B from $17.5B in net losses; Picower estate $7.2B (largest individual forfeiture in US history). 10. ASSET FORFEITURE INNOVATION — KleptoCapture $700M+ seized; Malofeyev $300M first transfer to Ukraine reconstruction; creates template for frozen Russian central bank reserves.`;

  const critEmbed = await pc.inference.embed('multilingual-e5-large', [critText], {
    inputType: 'passage', truncate: 'END'
  });
  allVectors.push({
    id: 'fincrime-critical-findings',
    values: critEmbed.data[0].values,
    metadata: {
      name: 'Financial Crime Database Critical Findings',
      category: 'entity_investigation',
      investigation: INVESTIGATION_ID,
      source_tag: 'katharos-investigation',
      type_tag: 'compliance_recommendation',
      text: critText.substring(0, 1000),
      timestamp: new Date().toISOString()
    }
  });
  console.log('Embedded critical findings');

  // 4. Investigation metadata vector
  const metaText = `Katharos Financial Crime Database ${INVESTIGATION_ID}: 350 subjects, ~2,260 entities across 7 categories. CATEGORY 1 — CONVICTED MONEY LAUNDERERS (50 subjects, ~380 entities): Alexander Vinnik/BTC-e $9B, Semion Mogilevich FBI wanted, Liberty Reserve $6B, Jho Low/1MDB $4.5B, Troika Laundromat $4.6B, Saldana/textiles, Prevezon/Magnitsky, Fifita/crypto BSA, Gao Yan/Chinese underground banking, Paul Manafort FARA+ML, Ng Lap Seng UN bribery, Firtash, Zarrab/Iran sanctions, Wachovia/cartel, Hezbollah ML, SBF/FTX $8B; compact entries ML-017–050 including Danske Bank €200B, HSBC $1.9B Sinaloa, Wirecard €1.9B, Binance $4.3B. CATEGORY 2 — INDICTED (50 subjects, ~290 entities): Halkbank $20B Iran sanctions, Do Kwon/LUNA $40B, CZ/Binance post-conviction, Abramovich UK investigation, 3AC, Celsius/Mashinsky, Frank/JPM fraud, Guo Wengui, Bitcoin Fog/Helix mixers, pig butchering. CATEGORY 3 — FRAUD (50 subjects, ~340 entities): Madoff $64.5B Ponzi, Stanford $7B, Enron, WorldCom, Theranos, Archegos $36B, Luckin Coffee, WeWork/Neumann, OneCoin $25B, FTX/Genesis/DCG conglomerate. CATEGORY 4 — RICO (50 subjects, ~310 entities): Sinaloa RICO, 'Ndrangheta $55B/year, MS-13 SDN, Hells Angels, Yakuza SDN, Russian Brighton Beach, DarkSide ransomware, Cosa Nostra. CATEGORY 5 — ASSET FORFEITURE (50 subjects, ~280 entities): KleptoCapture $700M+, 1MDB $1.7B recovered, Bitfinex $3.6B, Lazarus seizures, Madoff SIPC $14.5B, FTX $7B+ recovered, Mt. Gox $9B+ BTC. CATEGORY 6 — CARTEL (50 subjects, ~350 entities): Los Chapitos fentanyl, El Mencho/CJNG $10M reward, Zetas horse racing ML, TD Bank $3B cartel ML, avocado supply chain, cartel crypto treasury, Garcia Luna corruption. CATEGORY 7 — CRYPTO FRAUD (50 subjects, ~310 entities): OneCoin $25B, BitConnect $2.4B, Axie/Lazarus $625M, bridge hacks (Wormhole $320M, Ronin $625M), Tornado Cash founders, SafeMoon, HEX/PulseChain, pig butchering infrastructure. Coverage gap: ~84%.`;

  const metaEmbed = await pc.inference.embed('multilingual-e5-large', [metaText], {
    inputType: 'passage', truncate: 'END'
  });
  allVectors.push({
    id: 'fincrime-investigation-metadata',
    values: metaEmbed.data[0].values,
    metadata: {
      name: 'Financial Crime Database Investigation Overview (350 subjects)',
      category: 'entity_investigation',
      investigation: INVESTIGATION_ID,
      source_tag: 'katharos-investigation',
      type_tag: 'investigation_metadata',
      text: metaText.substring(0, 1000),
      totalSubjects: String(subjects.length),
      totalEntities: String(totalEntities),
      riskLevel: 'CRITICAL',
      coverageGap: '84%',
      categories: 'ML (Convicted), IND (Indicted), FRD (Fraud), RICO, AF (Asset Forfeiture), CRT (Cartel), CF (Crypto Fraud)',
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
  console.log(`  Critical findings: 1`);
  console.log(`  Investigation metadata: 1`);
  console.log(`  Total: ${allVectors.length}`);

  // Category breakdown
  console.log('\nCategory breakdown:');
  for (const [cat, count] of Object.entries(catCounts).sort()) {
    const meta = CATEGORIES[cat] || {};
    console.log(`  ${cat} (${meta.name}): ${count} entities`);
  }
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
