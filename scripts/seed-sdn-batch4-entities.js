#!/usr/bin/env node
/**
 * Seed SDN Batch 4 Entity Investigation into Pinecone RAG knowledge base.
 *
 * Parses katharos-sdn-batch4-investigation.md, extracts entities from multiple
 * table formats including:
 * - | # | Entity | Jurisdiction | Type | Sanctions Link | SDN? | Source |
 * - | # | Entity/Corridor | Jurisdiction | Type | Risk Level | Source |
 * - | # | Asset/Entity | Jurisdiction | Type | Owner | SDN? | Status |
 * - | # | System/Entity | Jurisdiction | Type | Sanctions Risk | Source |
 * - | # | Structure/Entity | Jurisdiction | Type | SDN Link | Source |
 * - | # | Program/Entity | Jurisdiction | Type | SDN Link | Source |
 *
 * Programs: RUSSIA (Oligarchs/Defense/Energy/Cyber/Media), IRAN (Oil/Proxy),
 *           CRYPTO (Digital Asset Sanctions), MAGNITSKY (Regional/Cartels),
 *           FINANCIAL (Infrastructure/Enablers/Evasion)
 * Total: ~634 entities across ~91 subjects (210–309)
 *
 * Usage: PINECONE_API_KEY=pcsk_... node scripts/seed-sdn-batch4-entities.js
 */

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'entity_investigations';

// ── Program metadata ──

const PROGRAMS = {
  'RUSSIA': { name: 'Russia Oligarchs / Defense / Energy / Cyber', prefix: 'sdn4-russia' },
  'IRAN': { name: 'Iran / Proxy Networks', prefix: 'sdn4-iran' },
  'CRYPTO': { name: 'Crypto / Digital Asset Sanctions', prefix: 'sdn4-crypto' },
  'MAGNITSKY': { name: 'Regional Threats / Cartels / Global Magnitsky', prefix: 'sdn4-magnitsky' },
  'FINANCIAL': { name: 'Financial Infrastructure / Evasion / Enablers', prefix: 'sdn4-fininfra' },
};

// Detect program from section header (## SECTION NAME)
function detectProgramFromSection(text) {
  const t = text.toUpperCase();
  if (t.includes('RUSSIA OLIGARCH') || t.includes('RUSSIA CYBER') || t.includes('RUSSIA DEFENSE') ||
      t.includes('WAGNER') || t.includes('AFRICA CORPS') || t.includes('RUSSIA SHIPPING') ||
      t.includes('RUSSIA MEDIA') || t.includes('RUSSIA ENERGY')) return 'RUSSIA';
  if (t.includes('IRAN') || t.includes('MIDDLE EAST PROXY')) return 'IRAN';
  if (t.includes('CRYPTO') || t.includes('DIGITAL ASSET') || t.includes('NORTH KOREA IT')) return 'CRYPTO';
  if (t.includes('REGIONAL THREAT') || t.includes('CARTEL')) return 'MAGNITSKY';
  if (t.includes('PROFESSIONAL ENABLER') || t.includes('SANCTIONS EVASION') || t.includes('LUXURY ASSET') ||
      t.includes('FINANCIAL INFRASTRUCTURE') || t.includes('OLIGARCH INTELLIGENCE') ||
      t.includes('GOLDEN PASSPORT')) return 'FINANCIAL';
  if (t.includes('MISCELLANEOUS')) return 'RUSSIA'; // default for misc subjects
  return null;
}

// Detect program from subject name (override)
function detectProgramFromName(name) {
  const n = name.toUpperCase();
  // Crypto
  if (n.includes('TORNADO CASH') || n.includes('LAZARUS') || n.includes('BYBIT') ||
      n.includes('CRYPTO EXCHANGE') || n.includes('DPRK IT') || n.includes('BITZLATO') ||
      n.includes('GARANTEX') || n.includes('SUEX') || n.includes('CHATEX') ||
      n.includes('HUIONE')) return 'CRYPTO';
  // Iran / Middle East proxy
  if (n.includes('IRGC') || n.includes('CHARMING KITTEN') || n.includes('APT35') ||
      n.includes('NIOC') || n.includes('NITC') || n.includes('IRAN OIL') ||
      n.includes('HEZBOLLAH') || n.includes('TALIBAN')) return 'IRAN';
  // Regional / Magnitsky / Cartels
  if (n.includes('HEMEDTI') || n.includes('RSF') || n.includes('SUDAN') ||
      n.includes('MYANMAR') || n.includes('PDVSA') || n.includes('ALEX SAAB') ||
      n.includes('VENEZUELA') || n.includes('NICARAGUA') || n.includes('ORTEGA') ||
      n.includes('CUBA') || n.includes('GAESA') || n.includes('BELARUS') ||
      n.includes('LUKASHENKO') || n.includes('CJNG') || n.includes('JALISCO') ||
      n.includes('FENTANYL') || n.includes('PRECURSOR')) return 'MAGNITSKY';
  // Financial infrastructure / enablers
  if (n.includes('ENABLER') || n.includes('EVASION') || n.includes('CORRIDOR') ||
      n.includes('LUXURY ASSET') || n.includes('SWIFT') || n.includes('SPFS') ||
      n.includes('PANDORA') || n.includes('CYPRUS CONFIDENTIAL') || n.includes('SUISSE SECRETS') ||
      n.includes('GOLDEN PASSPORT') || n.includes('ALFA BANK') && n.includes('EXPANDED')) return 'FINANCIAL';
  // Russia (oligarchs, defense, energy, cyber, media)
  if (n.includes('RASHNIKOV') || n.includes('MMK') || n.includes('CHEMEZOV') || n.includes('ROSTEC') ||
      n.includes('TIMCHENKO') || n.includes('VOLGA GROUP') || n.includes('KOVALCHUK') ||
      n.includes('ROTENBERG') || n.includes('MELNICHENKO') || n.includes('EUROCHEM') ||
      n.includes('FRIDMAN') || n.includes('AVEN') || n.includes('KHAN') || n.includes('ALFA GROUP') ||
      n.includes('GAZPROM') || n.includes('TRANSNEFT') || n.includes('TOKAREV') ||
      n.includes('KILLNET') || n.includes('SANDWORM') || n.includes('GRU') ||
      n.includes('APT29') || n.includes('COZY BEAR') || n.includes('SVR') ||
      n.includes('APT41') || n.includes('HAFNIUM') || n.includes('CHINA STATE CYBER') ||
      n.includes('ROSOBORONEXPORT') || n.includes('WAGNER') || n.includes('AFRICA CORPS') ||
      n.includes('SOVCOMFLOT') || n.includes('FESCO') || n.includes('NOVATEK') ||
      n.includes('ARCTIC LNG') || n.includes('MOGILEVICH') || n.includes('ROSUKR') ||
      n.includes('ROSNEFT') || n.includes('SECHIN') || n.includes('YANDEX') ||
      n.includes('RT ') || n.includes('RUSSIA TODAY') || n.includes('ROSSIYA SEGODNYA') ||
      n.includes('STATE MEDIA')) return 'RUSSIA';
  return null;
}

// ── Parse the markdown ──

function parseMarkdown(markdown) {
  const subjects = [];
  const lines = markdown.split('\n');

  let currentSubject = null;
  let currentSectionProgram = null;
  let inTable = false;
  let tableHeaders = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track section headers for program context
    const sectionMatch = line.match(/^## ([A-Z].+)/);
    if (sectionMatch && !line.startsWith('## Subjects') && !line.startsWith('## BATCH')) {
      const sectionProg = detectProgramFromSection(sectionMatch[1]);
      if (sectionProg) currentSectionProgram = sectionProg;
      inTable = false;
      continue;
    }

    // Stop at summary section
    if (line.startsWith('## BATCH 4 INVESTIGATION SUMMARY') ||
        line.startsWith('## CUMULATIVE DATABASE') ||
        line.startsWith('## MASTER ENTITY COUNT')) {
      if (currentSubject) subjects.push(currentSubject);
      currentSubject = null;
      break;
    }

    // Track subject headers: ### SUBJECT N — Name or ### SUBJECT N–M — Name
    const subjectMatch = line.match(/^### SUBJECT (\d+(?:[–\-]\d+)?) — (.+)/);
    if (subjectMatch) {
      if (currentSubject) subjects.push(currentSubject);
      const name = subjectMatch[2].trim();
      const subjectNum = subjectMatch[1].split(/[–\-]/)[0]; // take first number for ranges
      // Program: prefer name-based detection, fallback to section
      const nameProg = detectProgramFromName(name);
      currentSubject = {
        number: parseInt(subjectNum),
        numberRange: subjectMatch[1],
        name,
        program: nameProg || currentSectionProgram || 'RUSSIA',
        sdnStatus: '',
        standardFinds: '',
        keyFinding: '',
        entities: [],
      };
      inTable = false;
      continue;
    }

    if (!currentSubject) continue;

    // Track SDN Status
    const sdnStatusMatch = line.match(/\*\*SDN Status:\*\*\s*(.+)/);
    if (sdnStatusMatch) {
      currentSubject.sdnStatus = sdnStatusMatch[1].trim();
      continue;
    }

    // Track screening stats
    const stdMatch = line.match(/\*\*Standard screening finds:\*\*\s*(.+)/);
    if (stdMatch) { currentSubject.standardFinds = stdMatch[1].trim(); continue; }

    // Track key compliance finding
    const keyMatch = line.match(/\*\*Key compliance finding:\*\*\s*(.+)/);
    if (keyMatch) { currentSubject.keyFinding = keyMatch[1].trim(); continue; }

    // Track entities standard screening misses
    const missMatch = line.match(/\*\*Entities standard screening misses:\s*(.+)\*\*/);
    if (missMatch && !currentSubject.katharosFinds) {
      currentSubject.katharosFinds = missMatch[1].trim();
      continue;
    }

    // Detect table header (multiple formats)
    // Matches: Entity, Entity/Corridor, Asset/Entity, System/Entity, Structure/Entity, Program/Entity
    if (line.trim().startsWith('|') &&
        (line.includes('Entity') || line.includes('entity') || line.includes('Asset') || line.includes('System') || line.includes('Program')) &&
        (line.includes('Jurisdiction') || line.includes('Type') || line.includes('Notes') || line.includes('Risk'))) {
      tableHeaders = line.split('|').map(c => c.trim()).filter(Boolean);
      inTable = true;
      continue;
    }

    // Skip separator rows
    if (line.trim().startsWith('|---') || line.trim().startsWith('| ---')) continue;

    // Parse table data rows
    if (inTable && line.trim().startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length < 3) continue;

      // Map to headers
      const entity = {};
      tableHeaders.forEach((header, idx) => {
        if (idx < cells.length) {
          const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
          entity[key] = cells[idx];
        }
      });

      // Extract entity name from various header formats
      const entityName = entity.entity || entity.entity_corridor || entity.asset_entity ||
                         entity.system_entity || entity.structure_entity || entity.program_entity ||
                         entity.entity_category || '';
      if (!entityName || entityName === '---' || entityName === '#') continue;

      // Extract connection/description from various columns
      const connection = entity.sanctions_link || entity.connection || entity.notes ||
                         entity.risk_level || entity.sanctions_risk || entity.sdn_link || '';

      // Extract SDN status from various columns
      const sdnField = entity.sdn_ || entity.sdn || entity.status || '';

      // Extract source
      const source = entity.source || '';

      currentSubject.entities.push({
        name: entityName,
        jurisdiction: entity.jurisdiction || '',
        type: entity.type || 'entity',
        connection,
        sdn: sdnField,
        source,
        owner: entity.owner || '',
      });
      continue;
    }

    // End table on empty/non-table line
    if (inTable && !line.trim().startsWith('|')) {
      inTable = false;
    }
  }

  if (currentSubject) subjects.push(currentSubject);
  return subjects;
}

// ── Build embedding text ──

function buildEntityEmbeddingText(entity, subject, progMeta) {
  const parts = [
    `SDN Entity: ${entity.name}`,
    entity.type ? `Type: ${entity.type}` : '',
    entity.jurisdiction ? `Jurisdiction: ${entity.jurisdiction}` : '',
    entity.connection ? `Connection: ${entity.connection}` : '',
    entity.sdn ? `SDN status: ${entity.sdn}` : '',
    entity.source ? `Source: ${entity.source}` : '',
    entity.owner ? `Owner: ${entity.owner}` : '',
    `SDN Subject: ${subject.name}`,
    progMeta.name ? `Program: ${progMeta.name}` : '',
    subject.sdnStatus ? `Designation: ${subject.sdnStatus}` : '',
    subject.keyFinding ? `Key finding: ${subject.keyFinding}` : '',
    'Investigation: Katharos SDN Batch 4 — Subjects 210–309',
    `Standard screening: ${subject.standardFinds || '1 entity'}`,
  ];
  return parts.filter(Boolean).join(' | ');
}

function buildSubjectEmbeddingText(subject, progMeta) {
  const entityNames = subject.entities.map(e => e.name).slice(0, 30).join(', ');
  const parts = [
    `SDN Subject investigation: ${subject.name}`,
    progMeta.name ? `Program: ${progMeta.name}` : '',
    subject.sdnStatus ? `Designation: ${subject.sdnStatus}` : '',
    `Standard screening: ${subject.standardFinds || '1 entity'}`,
    `Entities found: ${entityNames}`.substring(0, 800),
    subject.keyFinding ? `Key compliance finding: ${subject.keyFinding}` : '',
    'Investigation: Katharos SDN Batch 4 — 634 entities across subjects 210–309',
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

  const mdPath = path.resolve(__dirname, '..', 'katharos-sdn-batch4-investigation.md');
  if (!fs.existsSync(mdPath)) {
    console.error(`Error: ${mdPath} not found.`);
    process.exit(1);
  }

  const md = fs.readFileSync(mdPath, 'utf-8');
  const subjects = parseMarkdown(md);

  console.log(`Parsed ${subjects.length} subjects`);
  let totalEntities = 0;
  const progCounts = {};
  for (const s of subjects) {
    totalEntities += s.entities.length;
    progCounts[s.program] = (progCounts[s.program] || 0) + s.entities.length;
  }
  console.log(`Total entities parsed: ${totalEntities}`);
  for (const [prog, count] of Object.entries(progCounts).sort()) {
    const meta = PROGRAMS[prog] || {};
    console.log(`  ${prog} (${meta.name || '?'}): ${count} entities`);
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
    const progMeta = PROGRAMS[subject.program] || PROGRAMS['RUSSIA'];
    const prefix = progMeta.prefix;

    for (let i = 0; i < subject.entities.length; i += BATCH) {
      const batch = subject.entities.slice(i, i + BATCH);
      const texts = batch.map(e => buildEntityEmbeddingText(e, subject, progMeta));

      const embedResult = await pc.inference.embed('multilingual-e5-large', texts, {
        inputType: 'passage', truncate: 'END'
      });

      batch.forEach((e, j) => {
        entityIdx++;
        const id = `${prefix}-${slugify(subject.name)}-${slugify(e.name)}`.substring(0, 100);

        // Determine SDN status
        const sdnText = `${e.sdn} ${e.source} ${e.connection} ${e.owner}`.toLowerCase();
        const isSdn = e.sdn.trim().toUpperCase().startsWith('Y') ||
                       sdnText.includes('sdn') && !sdnText.includes('not sdn') ||
                       sdnText.includes('designated') && !sdnText.includes('not designated');
        const isBlocked = sdnText.includes('blocked') || sdnText.includes('seized') ||
                          sdnText.includes('uk sanctioned') || sdnText.includes('eu-sanctioned') ||
                          sdnText.includes('partial') || sdnText.includes('owner: y');

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
            riskLevel: isSdn ? 'CRITICAL' : isBlocked ? 'CRITICAL' : 'HIGH',
            source: (e.source || '').substring(0, 500),
            subjectName: subject.name,
            subjectNumber: String(subject.number),
            program: progMeta.name,
            category: 'entity_investigation',
            investigation: 'KATHAROS-2026-SDN-BATCH4-001',
            keyFinding: (subject.keyFinding || '').substring(0, 500),
            source_tag: 'katharos-investigation',
            type_tag: 'entity',
            text: buildEntityEmbeddingText(e, subject, progMeta).substring(0, 1000),
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
      const progMeta = PROGRAMS[s.program] || PROGRAMS['RUSSIA'];
      return buildSubjectEmbeddingText(s, progMeta);
    });

    const embedResult = await pc.inference.embed('multilingual-e5-large', texts, {
      inputType: 'passage', truncate: 'END'
    });

    batch.forEach((s, j) => {
      const progMeta = PROGRAMS[s.program] || PROGRAMS['RUSSIA'];
      const id = `${progMeta.prefix}-subject-${slugify(s.name)}`.substring(0, 100);
      allVectors.push({
        id,
        values: embedResult.data[j].values,
        metadata: {
          name: `SDN Subject: ${s.name}`,
          type: 'subject_overview',
          subjectName: s.name,
          subjectNumber: String(s.number),
          program: progMeta.name,
          category: 'entity_investigation',
          investigation: 'KATHAROS-2026-SDN-BATCH4-001',
          standardFinds: s.standardFinds || '',
          katharosFinds: s.katharosFinds || '',
          keyFinding: (s.keyFinding || '').substring(0, 500),
          entityCount: String(s.entities.length),
          source_tag: 'katharos-investigation',
          type_tag: 'subject_overview',
          text: buildSubjectEmbeddingText(s, progMeta).substring(0, 1000),
          timestamp: new Date().toISOString()
        }
      });
    });

    console.log(`  Embedded subjects ${i + 1}-${Math.min(i + BATCH, subjects.length)} of ${subjects.length}`);
  }

  // 3. Critical findings vector
  const critText = `SDN Batch 4 Critical Findings KATHAROS-2026-SDN-BATCH4-001: 1. NAYARA ENERGY (India) — Rosneft 49.13% stake; SDN via January 10, 2025 Rosneft designation; India's second-largest private refinery processing ~20M tonnes/year; trade finance exposure live; one of most significant unresolved commercial compliance questions from January 2025 action. 2. NIS SERBIA (Gazprom Neft 56.15%) — SDN via January 2025 Gazprom Neft designation; Serbia's dominant oil company; Western Balkans petrol stations; Serbia not EU member creating regulatory gap. 3. VSMPO-AVISMA (Rostec subsidiary) — World's largest titanium producer; covered by Rostec SDN (50% rule); OFAC FAQ 1076 confirms; Boeing/Airbus aerospace supply chain exposure. 4. BYBIT HACK ($1.5B February 2025) — Largest crypto theft in history; Lazarus attribution confirmed; Safe{Wallet} developer compromise vector; VASP/DeFi bridge exposure from processing hack proceeds. 5. TORNADO CASH DELISTING (August 2025) — Lazarus immediately resumed use per Chainalysis Feb 2026; VASPs must maintain screening on underlying wallet addresses regardless of protocol status. 6. IRAN OIL GHOST TANKER FLEET — ~100 AIS-spoofing vessels; China purchases 90% of Iran's ~1.5M bpd exports; NIOC SDN but every intermediary non-SDN. 7. AFRICA CORPS GOLD CORRIDOR — Wagner gold from Mali/CAR/Sudan flowing through UAE to global supply chain; uranium access emerging in post-coup Mali/Niger. 8. EUROCHEM US/EU DESIGNATION GAP — OFAC FAQ 1074 confirms NOT blocked under US sanctions; EU-sanctioned; world-scale fertilizer producer; food security implications. 9. GUNVOR GROUP — Timchenko divested 48 hours before OFAC designation; precedent-setting pre-designation transfer; Gunvor not SDN. 10. DPRK IT WORKERS — Infiltration of Western tech/crypto companies; laptop farm prosecutions; FBI advisory on crypto project targeting.`;

  const critEmbed = await pc.inference.embed('multilingual-e5-large', [critText], {
    inputType: 'passage', truncate: 'END'
  });
  allVectors.push({
    id: 'sdn-batch4-critical-findings',
    values: critEmbed.data[0].values,
    metadata: {
      name: 'SDN Batch 4 Critical Compliance Findings',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-SDN-BATCH4-001',
      source_tag: 'katharos-investigation',
      type_tag: 'compliance_recommendation',
      text: critText.substring(0, 1000),
      timestamp: new Date().toISOString()
    }
  });
  console.log('Embedded critical findings');

  // 4. Investigation metadata vector
  const metaText = `Katharos SDN Batch 4 Investigation KATHAROS-2026-SDN-BATCH4-001: 634 entities across subjects 210-309. RUSSIA OLIGARCH TAIL: Rashnikov/MMK 12 entities Turkey steel conduit, Chemezov/Rostec 15 entities VSMPO-AVISMA titanium, Timchenko/Volga 13 entities Gunvor pre-designation divestment, Kovalchuk/Bank Rossiya 13 entities Innopraktika Putin daughter link, Rotenberg brothers 14 entities Crimea Bridge SGM, Igor Rotenberg 7 entities Sitronics AIS shadow fleet irony, Melnichenko/EuroChem 12 entities US/EU gap, Fridman/Aven/Khan/Alfa 16+10 entities LetterOne Pamplona, Gazprom Neft/NIS Serbia 12 entities 50% rule, Transneft/Druzhba 10 entities. RUSSIA CYBER: Killnet/NoName 7, Sandworm/GRU 9 NotPetya $10B, APT29/SVR 8 SolarWinds, IRGC Charming Kitten 8, APT41/China 8 Salt Typhoon. REGIONAL: Hemedti/RSF Sudan 11 UAE gold corridor, Myanmar SAC 11 gems EO14014, Venezuela PDVSA/Saab 12 conviction cooperation, Nicaragua Ortega 8, Cuba GAESA 10, Belarus Lukashenko 10 potash. CRYPTO: Tornado Cash delisted 9 Lazarus resumed, Lazarus 2024-2025 heists 11 Bybit $1.5B WazirX DMM, Bybit hack 7 Safe{Wallet} vector, Exchange lineage 11 Garantex-Grinex OKX, DPRK IT workers 9 laptop farms. IRAN: NIOC/NITC/IRISL 12 ghost tankers China teapots, Hezbollah 10 West Africa drugs, Taliban 9 lithium mining. DEFENSE/WAGNER: Rosoboronexport 10 CAATSA India S-400, Wagner Africa Corps 15 gold uranium Mali CAR Sudan. CARTEL: CJNG 11 avocado supply chain fentanyl, Fentanyl precursors 8 Chinese chemical companies. SHIPPING/ENERGY: Sovcomflot 8 reflagging IMO, FESCO 6 Trans-Siberian, Novatek/Arctic LNG 2 8 strategic exclusion. MEDIA: RT SDN September 2024 11 influence operations. MISC: Mogilevich/Firtash 9, Gazprom partial SDN 12 TurkStream, Rosneft/Nayara Energy 11 India refinery 50% rule, Yandex restructuring 6 Potanin/Interros. ENABLERS: Professional enablers 13 MeritServus PwC Cyprus Henley, Evasion corridors 9 India UAE Turkey, Luxury assets 12 yachts Chelsea KleptoCapture, Leak data 8 ICIJ OpenSanctions, SWIFT alternatives 8 SPFS Iran link, Golden passports 8 CBI KYC bypass. Standard: ~66. Katharos: ~634. Gap: ~90%.`;

  const metaEmbed = await pc.inference.embed('multilingual-e5-large', [metaText], {
    inputType: 'passage', truncate: 'END'
  });
  allVectors.push({
    id: 'sdn-batch4-investigation-metadata',
    values: metaEmbed.data[0].values,
    metadata: {
      name: 'SDN Batch 4 Investigation Overview (Subjects 210–309)',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-SDN-BATCH4-001',
      source_tag: 'katharos-investigation',
      type_tag: 'investigation_metadata',
      text: metaText.substring(0, 1000),
      totalSubjects: String(subjects.length),
      totalEntities: String(totalEntities),
      riskLevel: 'CRITICAL',
      coverageGap: '90%',
      programs: 'RUSSIA OLIGARCHS/DEFENSE/ENERGY/CYBER, IRAN/PROXY, CRYPTO/DIGITAL ASSET, REGIONAL/CARTELS/MAGNITSKY, FINANCIAL INFRASTRUCTURE/ENABLERS',
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
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
