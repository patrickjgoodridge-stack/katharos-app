#!/usr/bin/env node
/**
 * Seed SDN Batch 3 Entity Investigation into Pinecone RAG knowledge base.
 *
 * Parses katharos-sdn-batch3-investigation.md, extracts entities from both:
 * - Full markdown tables (| # | Entity | Jurisdiction | Type | Connection | SDN? | Source |)
 * - Alt table format (| # | Entity Category | Entities | Type | Notes | SDN? | Source |)
 * - Alt table format (| # | Entity | Jurisdiction | Type | SDN? | Notes |)
 * - Compact paragraph format (bold entity names in ** **)
 *
 * Programs: RUSSIA DEEP STATE, IRAN EXPANDED, CRYPTO CRIME EXT,
 *           GLOBAL CORRUPTION/MAGNITSKY, FINANCIAL INFRASTRUCTURE
 * Total: ~715 entities across ~34 subjects (176–225)
 *
 * Usage: PINECONE_API_KEY=pcsk_... node scripts/seed-sdn-batch3-entities.js
 */

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'entity_investigations';

// ── Program metadata ──

const PROGRAMS = {
  'RUSSIA': { name: 'Russia Deep State / Shadow Fleet', prefix: 'sdn3-russia' },
  'IRAN': { name: 'Iran Expanded', prefix: 'sdn3-iran' },
  'CRYPTO': { name: 'Crypto Crime / Ransomware', prefix: 'sdn3-crypto' },
  'MAGNITSKY': { name: 'Global Corruption / Magnitsky', prefix: 'sdn3-magnitsky' },
  'FINANCIAL': { name: 'Sanctioned Financial Infrastructure', prefix: 'sdn3-finint' },
};

// Detect program from **Program:** line text
function detectProgramFromLine(text) {
  const t = text.toUpperCase();
  if (t.includes('RUSSIA') || t.includes('EO14024') || t.includes('EO13661') || t.includes('EO13662')) return 'RUSSIA';
  if (t.includes('GLOMAG') || t.includes('EO13818') || t.includes('GLOBAL MAGNITSKY')) return 'MAGNITSKY';
  if (t.includes('IRAN') || t.includes('IRGC') || t.includes('IRISL')) return 'IRAN';
  if (t.includes('CYBER') || t.includes('EO13694') || t.includes('RANSOMWARE')) return 'CRYPTO';
  if (t.includes('FINANCIAL') || t.includes('INSTITUTION')) return 'FINANCIAL';
  if (t.includes('STATE DEPT') || t.includes('CORRUPTION')) return 'MAGNITSKY';
  return null;
}

// Detect program from subject name
function detectProgramFromName(name) {
  const n = name.toUpperCase();
  // Crypto / Ransomware
  if (n.includes('LOCKBIT') || n.includes('EVIL CORP') || n.includes('RANSOMWARE') || n.includes('YAKUBETS') ||
      n.includes('KHOROSHEV') || n.includes('ALPHV') || n.includes('REVIL') || n.includes('LAZARUS') ||
      n.includes('TORNADO') || n.includes('SAMOURAI') || n.includes('CHIPMIXER') || n.includes('DO KWON') ||
      n.includes('BANKMAN') || n.includes('FTX') || n.includes('TERRAFORM') || n.includes('HYDRA') ||
      n.includes('SUEX') || n.includes('CHATEX')) return 'CRYPTO';
  // Iran
  if (n.includes('QAANI') || n.includes('SHAMKHANI') || n.includes('UAV') || n.includes('HEZBOLLAH') ||
      n.includes('HAMAS') || n.includes('HOUTHI') || n.includes('IRGC') || n.includes('NUCLEAR PROCUREMENT')) return 'IRAN';
  // Magnitsky / Global corruption
  if (n.includes('OBIANG') || n.includes('DOS SANTOS') || n.includes('KARIMOVA') || n.includes('ABLYAZOV') ||
      n.includes('MANAFORT') || n.includes('KOLOMOISKY') || n.includes('FIRTASH') || n.includes('ALIYEV') ||
      n.includes('NAZARBAYEV') || n.includes('YANUKOVYCH') || n.includes('NG LAP') || n.includes('JHO LOW') ||
      n.includes('TROOST')) return 'MAGNITSKY';
  // Financial infrastructure
  if (n.includes('BANK ROSSIYA') || n.includes('PROMSVYAZ') || n.includes('SMP BANK') || n.includes('NOVIKOMBANK') ||
      n.includes('MOSCOW EXCHANGE') || n.includes('SETTLEMENT DEPOSITORY') || n.includes('ROSSELKHOZBANK')) return 'FINANCIAL';
  // Default: Russian state/officials/shadow fleet
  return 'RUSSIA';
}

// ── Parse the markdown ──

function parseMarkdown(markdown) {
  const subjects = [];
  const lines = markdown.split('\n');

  let currentSubject = null;
  let inTable = false;
  let tableHeaders = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip roster program headers
    if (line.match(/^### PROGRAM \d+ /)) {
      inTable = false;
      continue;
    }

    // Track subject headers: ### SUBJECT N — Name
    const subjectMatch = line.match(/^### SUBJECT (\d+) — (.+)/);
    if (subjectMatch) {
      if (currentSubject) subjects.push(currentSubject);
      const name = subjectMatch[2].trim();
      currentSubject = {
        number: parseInt(subjectMatch[1]),
        name,
        program: detectProgramFromName(name),
        programLine: '',
        standardFinds: '',
        katharosFinds: '',
        keyFinding: '',
        entities: [],
      };
      inTable = false;
      continue;
    }

    // Track compact subjects: **SUBJECT N — Name**
    const compactMatch = line.match(/^\*\*SUBJECT (\d+) — (.+?)\*\*/);
    if (compactMatch) {
      if (currentSubject) subjects.push(currentSubject);
      const name = compactMatch[2].trim();
      currentSubject = {
        number: parseInt(compactMatch[1]),
        name,
        program: detectProgramFromName(name),
        programLine: '',
        standardFinds: '',
        katharosFinds: '',
        keyFinding: '',
        entities: [],
        isCompact: true,
      };
      inTable = false;
    }

    if (!currentSubject) continue;

    // Track program line
    const progLineMatch = line.match(/^\*\*Program:\*\*\s*(.+)/);
    if (progLineMatch) {
      currentSubject.programLine = progLineMatch[1].trim();
      const detected = detectProgramFromLine(progLineMatch[1]);
      if (detected) currentSubject.program = detected;
      continue;
    }

    // Track screening stats
    const stdMatch = line.match(/\*\*Standard screening finds:\*\*\s*(.+)/);
    if (stdMatch) { currentSubject.standardFinds = stdMatch[1].trim(); continue; }
    const stdMatch2 = line.match(/Standard(?:\s+screening finds)?:\s*(\d+)/);
    if (stdMatch2 && !currentSubject.standardFinds) currentSubject.standardFinds = stdMatch2[1] + ' entities';

    const kathMatch = line.match(/\*\*Katharos finds:\*\*\s*(.+)/);
    if (kathMatch) { currentSubject.katharosFinds = kathMatch[1].trim(); continue; }
    const kathMatch2 = line.match(/Katharos(?:\s+finds)?:\s*(\d+\+?)/);
    if (kathMatch2 && !currentSubject.katharosFinds) currentSubject.katharosFinds = kathMatch2[1] + ' entities';

    // Track key compliance finding
    const keyMatch = line.match(/\*\*Key compliance finding:\*\*\s*(.+)/);
    if (keyMatch) { currentSubject.keyFinding = keyMatch[1].trim(); continue; }
    const compNote = line.match(/\*\*Compliance note:\*\*\s*(.+)/);
    if (compNote && !currentSubject.keyFinding) currentSubject.keyFinding = compNote[1].trim();

    // Summary section — stop
    if (line.startsWith('## MASTER ENTITY COUNT') || line.startsWith('## CUMULATIVE DATABASE')) {
      if (currentSubject) subjects.push(currentSubject);
      currentSubject = null;
      break;
    }

    // Detect full table header (multiple formats)
    if (line.trim().startsWith('|') && (line.includes('Entity') || line.includes('entity')) &&
        (line.includes('Jurisdiction') || line.includes('Type') || line.includes('Notes'))) {
      tableHeaders = line.split('|').map(c => c.trim()).filter(Boolean);
      inTable = true;
      continue;
    }

    // Skip separator rows
    if (line.trim().startsWith('|---') || line.trim().startsWith('| ---')) continue;

    // Parse full table data rows
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

      // Skip header/summary rows and phase markers
      if (!entity.entity && !entity.entity_category) continue;
      const entityName = entity.entity || entity.entity_category || '';
      if (entityName === '---' || entityName === '#') continue;
      if (entityName.startsWith('**PHASE') || entityName.startsWith('**LIFESTYLE')) continue;
      if (cells[0]?.startsWith('**PHASE') || cells[0]?.startsWith('**LIFESTYLE')) continue;

      // Skip bulk import placeholders
      if (entityName.startsWith('[BULK')) continue;

      currentSubject.entities.push({
        name: entityName,
        jurisdiction: entity.jurisdiction || '',
        type: entity.type || 'entity',
        connection: entity.connection || entity.notes || '',
        sdn: entity.sdn_ || entity.sdn || '',
        source: entity.source || '',
      });
      continue;
    }

    // End table on empty/non-table line
    if (inTable && !line.trim().startsWith('|')) {
      inTable = false;
    }

    // Parse compact format: bold entity names
    if (currentSubject?.isCompact && line.startsWith('Key hidden entities')) {
      const boldEntities = line.match(/\*\*([^*]+)\*\*/g);
      if (boldEntities) {
        for (const be of boldEntities) {
          const name = be.replace(/\*\*/g, '').trim();
          if (name.length < 2 || name.startsWith('Subject') || name.startsWith('SUBJECT')) continue;
          const afterBold = line.substring(line.indexOf(be) + be.length, line.indexOf(be) + be.length + 300);
          const parenMatch = afterBold.match(/^\s*\(([^)]+)\)/);
          const desc = parenMatch ? parenMatch[1] : '';
          currentSubject.entities.push({
            name, jurisdiction: '', type: 'entity',
            connection: desc, sdn: '', source: 'Compact investigation entry',
          });
        }
      }
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
    `SDN Subject: ${subject.name}`,
    progMeta.name ? `Program: ${progMeta.name}` : '',
    subject.programLine ? `Designation: ${subject.programLine}` : '',
    subject.keyFinding ? `Key finding: ${subject.keyFinding}` : '',
    'Investigation: Katharos SDN Batch 3 — Subjects 176–275',
    `Standard screening: ${subject.standardFinds || '1 entity'}`,
    `Katharos screening: ${subject.katharosFinds || 'expanded'}`,
  ];
  return parts.filter(Boolean).join(' | ');
}

function buildSubjectEmbeddingText(subject, progMeta) {
  const entityNames = subject.entities.map(e => e.name).slice(0, 30).join(', ');
  const parts = [
    `SDN Subject investigation: ${subject.name}`,
    progMeta.name ? `Program: ${progMeta.name}` : '',
    subject.programLine ? `Designation: ${subject.programLine}` : '',
    `Standard screening: ${subject.standardFinds || '1 entity'}`,
    `Katharos finds: ${subject.katharosFinds || 'expanded'}`,
    `Entities found: ${entityNames}`.substring(0, 800),
    subject.keyFinding ? `Key compliance finding: ${subject.keyFinding}` : '',
    'Investigation: Katharos SDN Batch 3 — 715 entities across subjects 176–275',
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

  const mdPath = path.resolve(__dirname, '..', 'katharos-sdn-batch3-investigation.md');
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

        const sdnText = `${e.sdn} ${e.source} ${e.connection}`.toLowerCase();
        const isSdn = sdnText.includes('y (sdn') || sdnText.includes('y (ofac') ||
                       sdnText.includes('sdn-designated') || sdnText.includes('y (eu)') ||
                       sdnText.includes('y (all sdn') || sdnText.includes('y (sdn jan') ||
                       sdnText.includes('y (sdn oct') || sdnText.includes('y (sdn feb') ||
                       sdnText.includes('y (sdn may');
        const isBlocked = sdnText.includes('blocked') || sdnText.includes('seized') ||
                          sdnText.includes('uk sanctioned') || sdnText.includes('y (seized') ||
                          sdnText.includes('y (wallets') || sdnText.includes('y (various');

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
            investigation: 'KATHAROS-2026-SDN-BATCH3-001',
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
          investigation: 'KATHAROS-2026-SDN-BATCH3-001',
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
  const critText = `SDN Batch 3 Critical Findings KATHAROS-2026-SDN-BATCH3-001: 1. LAVROV-VINOKUROV-ALFA GROUP nexus: Alexander Vinokurov (Lavrov son-in-law) is president of A1 (Alfa Group investment arm) — 4 Alfa founders all US SDN. Vinokurov NOT designated. Compliance chain: Alfa SDN → A1 → Vinokurov → Ekaterina SDN → Lavrov SDN. 2. ABRAMOV/FROLOV 78 entities Cyprus Confidential — NOT US/EU SDN, UK-sanctioned only. PwC Cyprus "URGENT" $100M transfer March 1, 2022. Standard US screening: completely clean. 3. EVIL CORP strategic rebrand: SDN 2019 → WastedLocker → Hades → LockBit affiliate → RansomHub. Deliberately evades ransomware payment SDN screening. Benderskiy (father-in-law) = former FSB Vympel. October 2024 NCA unmasked family structure. 4. SHADOW FLEET January 10 2025: 400+ entities single action. 1,337 vessels tracked, only 183 designated. GL 113 revoked — ALL Sovcomflot blocked. Behavioral indicators only detection method for 1,154 undesignated vessels. 5. KOLOMOISKY $1.9B London High Court fraud ruling July 2025. 22 US properties DOJ forfeiture pending. PrivatBank sham loans via Byzantine shell structure. 6. PROFESSIONAL ENABLERS: PwC Cyprus (62 Abramov/Frolov shells + Mordashov), MeritServus (sanctioned), Cypcodirect (operating). Enablers are the infrastructure.`;

  const critEmbed = await pc.inference.embed('multilingual-e5-large', [critText], {
    inputType: 'passage', truncate: 'END'
  });
  allVectors.push({
    id: 'sdn-batch3-critical-findings',
    values: critEmbed.data[0].values,
    metadata: {
      name: 'SDN Batch 3 Critical Compliance Findings',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-SDN-BATCH3-001',
      source_tag: 'katharos-investigation',
      type_tag: 'compliance_recommendation',
      text: critText.substring(0, 1000),
      timestamp: new Date().toISOString()
    }
  });
  console.log('Embedded critical findings');

  // 4. Investigation metadata vector
  const metaText = `Katharos SDN Batch 3 Investigation KATHAROS-2026-SDN-BATCH3-001: 715 entities across subjects 176-275. RUSSIA DEEP STATE: Lavrov 6 entities Vinokurov-Alfa nexus, Abramov/Frolov Evraz 78 entities Cyprus Confidential PwC, Shadow Fleet January 2025 400+ entities largest maritime action, Shadow Fleet operators 13 facilitator entities, Medvedev 8, Patrushev 4, Gref/Sberbank 10, Mordashov/Severstal 12 expanded. CYBER CRIME: LockBit Khoroshev 15 entities Operation Cronos, Evil Corp Yakubets 18 entities family SDN October 2024 RansomHub migration, Do Kwon Terraform 8, SBF FTX 12, Samourai Wallet 5, ChipMixer 4, Tornado Cash Storm 5. IRAN EXPANDED: Qaani IRGC-QF 6, Shamkhani oil network DOJ March 2026 15, UAV export 15, Hezbollah 10, Hamas 10, Houthi 6. GLOBAL CORRUPTION: Kolomoisky PrivatBank 16 entities London $1.9B fraud, dos Santos Angola 25, Karimova Uzbekistan 10, Ablyazov Kazakhstan 15, Manafort 10, Firtash 8, Aliyev Azerbaijan 8. FINANCIAL: Bank Rossiya 8, PromsvyazBank A7A5 stablecoin 7, Moscow Exchange 5. Standard: 100. Katharos: 715. Gap: 86%.`;

  const metaEmbed = await pc.inference.embed('multilingual-e5-large', [metaText], {
    inputType: 'passage', truncate: 'END'
  });
  allVectors.push({
    id: 'sdn-batch3-investigation-metadata',
    values: metaEmbed.data[0].values,
    metadata: {
      name: 'SDN Batch 3 Investigation Overview (Subjects 176–275)',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-SDN-BATCH3-001',
      source_tag: 'katharos-investigation',
      type_tag: 'investigation_metadata',
      text: metaText.substring(0, 1000),
      totalSubjects: '34',
      totalEntities: String(totalEntities),
      riskLevel: 'CRITICAL',
      coverageGap: '86%',
      programs: 'RUSSIA DEEP STATE, IRAN EXPANDED, CRYPTO/RANSOMWARE, GLOBAL CORRUPTION, FINANCIAL INFRASTRUCTURE',
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
