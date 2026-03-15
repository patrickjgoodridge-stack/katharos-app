#!/usr/bin/env node
/**
 * Seed SDN Batch 2 Entity Investigation into Pinecone RAG knowledge base.
 *
 * Parses katharos-sdn-batch2-investigation.md, extracts entities from both:
 * - Full markdown tables (| # | Entity | Jurisdiction | Type | Connection | SDN? | Source |)
 * - Compact paragraph format (bold entity names in ** **)
 *
 * 6 Programs: RUSSIA EXTENDED (35), IRAN EXTENDED (15), VENEZUELA (5),
 *             CRYPTO CRIME EXT (10), GLOBAL MAGNITSKY EXT (10),
 *             SANCTIONED FINANCIAL INSTITUTIONS (10)
 * Total: ~871 entities across 100 subjects (76–175)
 *
 * Usage: PINECONE_API_KEY=pcsk_... node scripts/seed-sdn-batch2-entities.js
 */

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'entity_investigations';

// ── Program metadata ──

const PROGRAMS = {
  'RUSSIA': { name: 'Russia Sanctions Extended', prefix: 'sdn2-russia' },
  'IRAN': { name: 'Iran Sanctions Extended', prefix: 'sdn2-iran' },
  'VENEZUELA': { name: 'Venezuela / Corruption', prefix: 'sdn2-venezuela' },
  'CRYPTO': { name: 'Crypto Crime Extended', prefix: 'sdn2-crypto' },
  'MAGNITSKY': { name: 'Global Magnitsky Extended', prefix: 'sdn2-magnitsky' },
  'FINANCIAL': { name: 'Sanctioned Financial Institutions', prefix: 'sdn2-finint' },
};

// Detect program from **Program:** line text (EO numbers, agency names)
function detectProgramFromLine(text) {
  const t = text.toUpperCase();
  if (t.includes('RUSSIA') || t.includes('EO14024') || t.includes('EO13661') || t.includes('EO13662')) return 'RUSSIA';
  if (t.includes('GLOMAG') || t.includes('EO13818') || t.includes('GLOBAL MAGNITSKY')) return 'MAGNITSKY';
  if (t.includes('IRAN') || t.includes('IRGC') || t.includes('IRISL')) return 'IRAN';
  if (t.includes('VENEZUELA') || t.includes('PDVSA')) return 'VENEZUELA';
  if (t.includes('CRYPTO') || t.includes('BSA') || t.includes('FINCEN')) return 'CRYPTO';
  if (t.includes('FINANCIAL') || t.includes('INSTITUTION')) return 'FINANCIAL';
  return null; // unknown
}

// Detect program from subject name when no **Program:** line is available
function detectProgramFromName(name) {
  const n = name.toUpperCase();
  // Venezuela
  if (n.includes('MADURO') || n.includes('SAAB') || n.includes('PDVSA') || n.includes('CABELLO') || n.includes('EL AISSAMI')) return 'VENEZUELA';
  // Crypto
  if (n.includes('BINANCE') || n.includes('FTX') || n.includes('TERRAFORM') || n.includes('TERRA-LUNA') ||
      n.includes('TORNADO') || n.includes('TETHER') || n.includes('CELSIUS') || n.includes('SAMOURAI') ||
      n.includes('CHIPMIXER') || n.includes('3AC') || n.includes('DO KWON') || n.includes('BANKMAN')) return 'CRYPTO';
  // Magnitsky
  if (n.includes('1MDB') || n.includes('JHO LOW') || n.includes('OBIANG') || n.includes('ABLYAZOV') ||
      n.includes('MANAFORT') || n.includes('BIYA') || n.includes('ALIYEV') || n.includes('NAZARBAYEV') ||
      n.includes('YANUKOVY') || n.includes('MOSHIRI') || n.includes('NG LAP')) return 'MAGNITSKY';
  // Financial institutions
  if (n.includes('GAZPROMBANK') || n.includes('MOSCOW EXCHANGE') || n.includes('ROSSELKHOZBANK') ||
      n.includes('PROMSVYAZ') || n.includes('NOVIKOMBANK') || n.includes('SMP BANK') ||
      n.includes('BANK ROSSIYA') || n.includes('MBANK') || n.includes('BELAGRO')) return 'FINANCIAL';
  // Iran
  if (n.includes('KHAMENEI') || n.includes('IRGC') || n.includes('QAANI') || n.includes('HEZBOLLAH') ||
      n.includes('HAMAS') || n.includes('SHAMKHANI') || n.includes('UAV')) return 'IRAN';
  // Default: Russian oligarchs
  return 'RUSSIA';
}

// ── Parse the markdown ──

function parseMarkdown(markdown) {
  const subjects = [];
  const lines = markdown.split('\n');

  let currentSubject = null;
  let inTable = false;
  let tableHeaders = [];
  let inFullInvestigations = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect when we enter the full investigations section
    if (line.startsWith('## FULL INVESTIGATIONS')) {
      inFullInvestigations = true;
      continue;
    }

    // Skip roster program headers (before FULL INVESTIGATIONS)
    if (line.match(/^### PROGRAM \d+ — /)) {
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
      // Don't continue — parse the rest of the line for entities
    }

    if (!currentSubject) continue;

    // Track program line — override program detection if clearer
    const progLineMatch = line.match(/^\*\*Program:\*\*\s*(.+)/);
    if (progLineMatch) {
      currentSubject.programLine = progLineMatch[1].trim();
      const detected = detectProgramFromLine(progLineMatch[1]);
      if (detected) currentSubject.program = detected;
      continue;
    }

    // Track screening stats
    const stdMatch = line.match(/\*\*Standard screening finds:\*\*\s*(.+)/);
    if (stdMatch) {
      currentSubject.standardFinds = stdMatch[1].trim();
      continue;
    }
    const stdMatch2 = line.match(/Standard(?:\s+screening finds)?:\s*(\d+)/);
    if (stdMatch2 && currentSubject && !currentSubject.standardFinds) {
      currentSubject.standardFinds = stdMatch2[1] + ' entities';
    }

    const kathMatch = line.match(/\*\*Katharos finds:\*\*\s*(.+)/);
    if (kathMatch) {
      currentSubject.katharosFinds = kathMatch[1].trim();
      continue;
    }
    const kathMatch2 = line.match(/Katharos(?:\s+finds)?:\s*(\d+\+?)/);
    if (kathMatch2 && currentSubject && !currentSubject.katharosFinds) {
      currentSubject.katharosFinds = kathMatch2[1] + ' entities';
    }

    // Track key compliance finding
    const keyMatch = line.match(/\*\*Key compliance finding:\*\*\s*(.+)/);
    if (keyMatch) {
      currentSubject.keyFinding = keyMatch[1].trim();
      continue;
    }

    // Track compliance note
    const compNote = line.match(/\*\*Compliance note:\*\*\s*(.+)/);
    if (compNote && !currentSubject.keyFinding) {
      currentSubject.keyFinding = compNote[1].trim();
    }

    // Summary section — stop
    if (line.startsWith('## MASTER ENTITY COUNT') || line.startsWith('## INVESTIGATION COMPLETE')) {
      if (currentSubject) subjects.push(currentSubject);
      currentSubject = null;
      break;
    }

    // Detect full table header
    if (line.trim().startsWith('|') && (line.includes('Entity') || line.includes('entity')) && line.includes('Jurisdiction')) {
      tableHeaders = line.split('|').map(c => c.trim()).filter(Boolean);
      inTable = true;
      continue;
    }

    // Skip separator rows
    if (line.trim().startsWith('|---') || line.trim().startsWith('| ---')) continue;

    // Parse full table data rows
    if (inTable && line.trim().startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length < 4) continue;

      // Map to headers
      const entity = {};
      tableHeaders.forEach((header, idx) => {
        if (idx < cells.length) {
          const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
          entity[key] = cells[idx];
        }
      });

      // Skip header/summary rows
      if (!entity.entity || entity.entity === '---' || entity.entity === '#') continue;

      // Skip phase header rows like **PHASE 1 — ...**
      if (entity['_']?.startsWith('**') || entity.entity?.startsWith('**PHASE')) continue;
      // Skip rows where first cell is a phase marker
      if (cells[0]?.startsWith('**PHASE') || cells[0]?.startsWith('**LIFESTYLE')) continue;

      // Skip bulk import placeholders
      if (entity.entity?.startsWith('[BULK')) continue;

      currentSubject.entities.push({
        name: entity.entity || '',
        jurisdiction: entity.jurisdiction || '',
        type: entity.type || 'entity',
        connection: entity.connection || '',
        sdn: entity.sdn_ || entity.sdn || '',
        ofac50: entity.ofac_50_ || entity.ofac_50 || '',
        source: entity.source || entity.notes || '',
      });
      continue;
    }

    // End table on empty line
    if (inTable && !line.trim().startsWith('|')) {
      inTable = false;
    }

    // Parse compact format: bold entity names in **Name** (entity); **Name** (entity)
    if (currentSubject?.isCompact && line.startsWith('Key hidden entities')) {
      const boldEntities = line.match(/\*\*([^*]+)\*\*/g);
      if (boldEntities) {
        for (const be of boldEntities) {
          const name = be.replace(/\*\*/g, '').trim();
          if (name.length < 2 || name.startsWith('Subject') || name.startsWith('SUBJECT')) continue;

          // Try to extract parenthetical info
          const afterBold = line.substring(line.indexOf(be) + be.length, line.indexOf(be) + be.length + 300);
          const parenMatch = afterBold.match(/^\s*\(([^)]+)\)/);
          const desc = parenMatch ? parenMatch[1] : '';

          currentSubject.entities.push({
            name,
            jurisdiction: '',
            type: 'entity',
            connection: desc,
            sdn: '',
            ofac50: '',
            source: 'Compact investigation entry',
          });
        }
      }
    }
  }

  // Push last subject
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
    entity.ofac50 ? `OFAC 50% rule: ${entity.ofac50}` : '',
    entity.source ? `Source: ${entity.source}` : '',
    `SDN Subject: ${subject.name}`,
    progMeta.name ? `Program: ${progMeta.name}` : '',
    subject.programLine ? `Designation: ${subject.programLine}` : '',
    subject.keyFinding ? `Key finding: ${subject.keyFinding}` : '',
    'Investigation: Katharos SDN Batch 2 — Next 100 Highest-Signal Subjects',
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
    'Investigation: Katharos SDN Batch 2 — 871 entities across 100 subjects (76–175)',
  ];
  return parts.filter(Boolean).join(' | ');
}

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

  const mdPath = path.resolve(__dirname, '..', 'katharos-sdn-batch2-investigation.md');
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
        inputType: 'passage',
        truncate: 'END'
      });

      batch.forEach((e, j) => {
        entityIdx++;
        const id = `${prefix}-${slugify(subject.name)}-${slugify(e.name)}`.substring(0, 100);

        // Determine SDN status
        const sdnText = `${e.sdn} ${e.source} ${e.connection}`.toLowerCase();
        const isSdn = sdnText.includes('y (sdn') || sdnText.includes('y (ofac') || sdnText.includes('y (state') ||
                       sdnText.includes('sdn-designated') || sdnText.includes('y (eu)');
        const isBlocked = sdnText.includes('blocked') || sdnText.includes('seized') ||
                          sdnText.includes('uk sanctioned') || sdnText.includes('uk/eu sanctioned');

        allVectors.push({
          id,
          values: embedResult.data[j].values,
          metadata: {
            name: e.name,
            type: e.type,
            jurisdiction: e.jurisdiction,
            connection: (e.connection || '').substring(0, 500),
            sdnStatus: e.sdn || 'Not individually designated',
            ofac50Rule: e.ofac50 || '',
            sanctioned: String(isSdn || isBlocked),
            riskLevel: isSdn ? 'CRITICAL' : isBlocked ? 'CRITICAL' : 'HIGH',
            source: (e.source || '').substring(0, 500),
            subjectName: subject.name,
            subjectNumber: String(subject.number),
            program: progMeta.name,
            category: 'entity_investigation',
            investigation: 'KATHAROS-2026-SDN-BATCH2-001',
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
      inputType: 'passage',
      truncate: 'END'
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
          investigation: 'KATHAROS-2026-SDN-BATCH2-001',
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
  const critText = `SDN Batch 2 Critical Findings KATHAROS-2026-SDN-BATCH2-001: 1. ABRAMOVICH 261+ entities via Cyprus Confidential — NO US SDN designation — standard US screening returns CLEAN. UK/EU sanctioned. $1.7B Evraz share transfer February 15, 2022 (9 days before invasion) textbook pre-designation restructuring. Keygrove-Camberley-Chelsea fund flow. 2. CZ/BINANCE NOT SDN-designated. $4.3B plea agreement. FinCEN 92-page consent order documents deliberate Iran/Russia/DPRK sanctions violations. Sigma Chain AG wash trading. 3. KOSTIN DOJ indictment February 2024 — first criminal indictment of sitting Russian state bank CEO for sanctions violations. Inveqo RAIF Cyprus structure hid Sea Rhapsody and Sea & Us yachts. 4. PRIGOZHIN ESTATE — post-death transfers March-April 2024 to Pavel Prigozhin and GRU Africa Corps. Concord entities renamed and restructured. 5. JHO LOW/1MDB — Najib Razak pardoned August 2024. Aabar-BVI clone shell company pattern — $1.37B processed. Falcon Bank Singapore lost license. 6. GAZPROMBANK — no GL 8K coverage post-November 2024. SPFS membership now explicit OFAC red flag. Roldugin/GPB Switzerland 4 bankers indicted. 7. VEKSELBERG — Columbus Trust-TZ Columbus Services-Renova Holding chain invisible to standard screening. Columbus Nova paid $500K to Michael Cohen April 2018. 8. MELNICHENKO/GURYEV — neither US OFAC SDN. UK/EU sanctioned. OFAC FAQs 1074/1075 confirm EuroChem and PhosAgro NOT blocked.`;

  const critEmbed = await pc.inference.embed('multilingual-e5-large', [critText], {
    inputType: 'passage',
    truncate: 'END'
  });
  allVectors.push({
    id: 'sdn-batch2-critical-findings',
    values: critEmbed.data[0].values,
    metadata: {
      name: 'SDN Batch 2 Critical Compliance Findings',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-SDN-BATCH2-001',
      source_tag: 'katharos-investigation',
      type_tag: 'compliance_recommendation',
      text: critText.substring(0, 1000),
      timestamp: new Date().toISOString()
    }
  });
  console.log('Embedded critical findings');

  // 4. Investigation metadata vector
  const metaText = `Katharos SDN Batch 2 Investigation KATHAROS-2026-SDN-BATCH2-001: 871 entities across 100 SDN subjects (76-175) in 6 programs. RUSSIA EXTENDED 35 subjects: Abramovich 261 entities Cyprus Confidential, Vekselberg Renova 19, Kostin VTB DOJ indictment 25, Prokhorov Onexim 13, Tokarev Transneft 12, Prigozhin estate Concord 31, Khan Kuzmichev Alfa Group, Shuvalov VEB, Kovalchuk NMG, Roldugin Panama Papers, Gutseriev Safmar, Kabaeva NMG, Guryev PhosAgro, Melnichenko EuroChem SUEK. IRAN EXTENDED 15 subjects: Khamenei office, IRGC-QF Qaani, Shamkhani oil network, Hezbollah finance, Hamas finance, UAV procurement. VENEZUELA 5 subjects: Maduro, Cabello, Saab, PDVSA/Rosneft, El Aissami. CRYPTO CRIME 10 subjects: Tornado Cash Storm Pertsev, Tether iFinex, Binance CZ $4.3B plea, SBF FTX estate, Do Kwon Terra, 3AC estate, Celsius Mashinsky, Samourai Wallet, ChipMixer. GLOBAL MAGNITSKY 10 subjects: Biya Cameroon, Obiang EG, Ablyazov BTA $4B, Aliyev Azerbaijan, Nazarbayev Kazakhstan, Yanukovich Ukraine, Manafort, Moshiri, Jho Low 1MDB 29 entities, Ng Lap Seng. FINANCIAL INSTITUTIONS 10 subjects: Gazprombank 17 entities November 2024, Moscow Exchange, SPB Exchange, Rosselkhozbank, PromsvyazBank, Novikombank, SMP Bank Rotenberg, Bank Rossiya Putin, Mbank, Belagroprombank. Standard screening: 100 entities. Katharos: 871. Coverage gap: 87%. Multiplier: 8.7x.`;

  const metaEmbed = await pc.inference.embed('multilingual-e5-large', [metaText], {
    inputType: 'passage',
    truncate: 'END'
  });
  allVectors.push({
    id: 'sdn-batch2-investigation-metadata',
    values: metaEmbed.data[0].values,
    metadata: {
      name: 'SDN Batch 2 Investigation Overview (Subjects 76–175)',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-SDN-BATCH2-001',
      source_tag: 'katharos-investigation',
      type_tag: 'investigation_metadata',
      text: metaText.substring(0, 1000),
      totalSubjects: '100',
      totalEntities: String(totalEntities),
      riskLevel: 'CRITICAL',
      coverageGap: '87%',
      programs: 'RUSSIA EXT, IRAN EXT, VENEZUELA, CRYPTO CRIME, GLOBAL MAGNITSKY, FINANCIAL INSTITUTIONS',
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
