#!/usr/bin/env node
/**
 * Seed Top 100 SDN Subjects Entity Investigation into Pinecone RAG knowledge base.
 *
 * Parses katharos-sdn-100-investigation.md, extracts entities from both:
 * - Full markdown tables (| # | Entity | Jurisdiction | Type | ... |)
 * - Compact paragraph format (bold entity names in ** **)
 *
 * 6 Programs: RUSSIA (35), IRAN (20), DPRK (10), CARTELS/TCOs (15),
 *             CYBER/CRYPTO (10), GLOBAL MAGNITSKY (10)
 * Total: ~685 entities across 100 subjects
 *
 * Usage: PINECONE_API_KEY=pcsk_... node scripts/seed-sdn-100-entities.js
 */

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'entity_investigations';

// ── Program metadata ──

const PROGRAMS = {
  'RUSSIA': { name: 'Russia Sanctions', prefix: 'sdn-russia' },
  'IRAN': { name: 'Iran Sanctions', prefix: 'sdn-iran' },
  'DPRK': { name: 'DPRK Sanctions', prefix: 'sdn-dprk' },
  'CARTELS': { name: 'Cartels / TCOs', prefix: 'sdn-cartel' },
  'CYBER': { name: 'Cyber / Crypto', prefix: 'sdn-cyber' },
  'MAGNITSKY': { name: 'Global Magnitsky', prefix: 'sdn-magnitsky' },
};

function detectProgram(text) {
  const t = text.toUpperCase();
  if (t.includes('RUSSIA') || t.includes('EO14024') || t.includes('EO13661')) return 'RUSSIA';
  if (t.includes('IRAN') || t.includes('IRGC') || t.includes('SDGT') || t.includes('IRISL')) return 'IRAN';
  if (t.includes('DPRK') || t.includes('EO13722') || t.includes('LAZARUS') || t.includes('NORTH KOREA')) return 'DPRK';
  if (t.includes('CARTEL') || t.includes('TCO') || t.includes('KINGPIN') || t.includes('SDNTK') || t.includes('CJNG')) return 'CARTELS';
  if (t.includes('CYBER') || t.includes('CRYPTO') || t.includes('EO13694') || t.includes('GARANTEX') || t.includes('RANSOMWARE')) return 'CYBER';
  if (t.includes('MAGNITSKY') || t.includes('GLOMAG') || t.includes('EO13818')) return 'MAGNITSKY';
  return 'RUSSIA'; // default
}

// ── Parse the markdown ──

function parseMarkdown(markdown) {
  const subjects = [];
  const lines = markdown.split('\n');

  let currentProgram = 'RUSSIA';
  let currentSubject = null;
  let inTable = false;
  let tableHeaders = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track program headers
    const programMatch = line.match(/^## PROGRAM \d+ — (.+)/);
    if (programMatch) {
      currentProgram = detectProgram(programMatch[1]);
      inTable = false;
      continue;
    }

    // Track subject headers: ### SUBJECT N — Name
    const subjectMatch = line.match(/^### SUBJECT (\d+) — (.+)/);
    if (subjectMatch) {
      if (currentSubject) subjects.push(currentSubject);
      currentSubject = {
        number: parseInt(subjectMatch[1]),
        name: subjectMatch[2].trim(),
        program: currentProgram,
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
      currentSubject = {
        number: parseInt(compactMatch[1]),
        name: compactMatch[2].trim(),
        program: currentProgram,
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

    // Track program line
    const progLineMatch = line.match(/^\*\*Program:\*\*\s*(.+)/);
    if (progLineMatch) {
      currentSubject.programLine = progLineMatch[1].trim();
      continue;
    }

    // Track screening stats
    const stdMatch = line.match(/\*\*Standard screening finds:\*\*\s*(.+)/);
    if (stdMatch) {
      currentSubject.standardFinds = stdMatch[1].trim();
      continue;
    }
    const stdMatch2 = line.match(/Standard screening finds:\s*(.+?)\.?\s*Katharos/);
    if (stdMatch2) currentSubject.standardFinds = stdMatch2[1].trim();

    const kathMatch = line.match(/\*\*Katharos finds:\*\*\s*(.+)/);
    if (kathMatch) {
      currentSubject.katharosFinds = kathMatch[1].trim();
      continue;
    }
    const kathMatch2 = line.match(/Katharos finds:\s*(.+?)\.?\s*$/);
    if (kathMatch2 && !kathMatch) currentSubject.katharosFinds = kathMatch2[1].trim();

    // Track key compliance finding
    const keyMatch = line.match(/\*\*Key compliance finding:\*\*\s*(.+)/);
    if (keyMatch) {
      currentSubject.keyFinding = keyMatch[1].trim();
      continue;
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
      if (entity['_'] === '#' || entity.entity?.startsWith('**')) continue;

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
          const afterBold = line.substring(line.indexOf(be) + be.length, line.indexOf(be) + be.length + 200);
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

    // Also parse Standard/Katharos from compact single-line format
    const compactStdMatch = line.match(/Standard(?:\s+screening finds)?:\s*(\d+)/);
    const compactKathMatch = line.match(/Katharos(?:\s+finds)?:\s*(\d+\+?)/);
    if (compactStdMatch && currentSubject && !currentSubject.standardFinds) {
      currentSubject.standardFinds = compactStdMatch[1] + ' entities';
    }
    if (compactKathMatch && currentSubject && !currentSubject.katharosFinds) {
      currentSubject.katharosFinds = compactKathMatch[1] + ' entities';
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
    'Investigation: Katharos Top 100 SDN Subjects Investigation',
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
    'Investigation: Katharos Top 100 SDN Subjects — 685 entities across 100 subjects, 6 programs',
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

  const mdPath = path.resolve(__dirname, '..', 'katharos-sdn-100-investigation.md');
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
        const isSdn = sdnText.includes('y (sdn') || sdnText.includes('y (ofac') || sdnText.includes('y (state') || sdnText.includes('sdn-designated');
        const isBlocked = sdnText.includes('blocked') || sdnText.includes('seized');

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
            investigation: 'KATHAROS-2026-SDN100-001',
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
          investigation: 'KATHAROS-2026-SDN100-001',
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
  const critText = `Top 100 SDN Subjects Critical Findings KATHAROS-2026-SDN100-001: 1. DERIPASKA Rasperia Iliadis Titul evasion scheme May 2024 three fresh SDN designations attempt to unfreeze $1.5B Strabag shares. 2. GARANTEX GRINEX MKAN COIN successor chain $96B processed $41.7M Grinex first weeks Tornado Cash sanctions REMOVED August 2025. 3. USMANOV GL-15 revocation April 2023 all 50%+ entities blocked USM Holdings 49% deliberate threshold. 4. LAZARUS Bybit hack $1.5B February 2025 largest crypto theft OFAC wallet addresses Tornado Cash laundering. 5. GERTLER EUR royalty payments Glencore substituted EUR for USD after SDN designation Swiss courts fined CHF 152M. 6. IRGC-QF Hong Kong front companies Amito Peakway JTU Shelf Cetto SDN July 2025 energy trading cover. 7. CJNG FTO designation February 2025 El Mencho killed February 2026 criminal material support exposure. 8. LETTERONE false clean screening OFAC FAQ 1131 NOT blocked but 4 founders SDNs. 9. POTANIN Yandex 9.95% via Catalytic People Meridian-Servis post-designation May 2025. 10. DPRK IT Worker Network 1000+ posing as freelancers $300M/year zero screening detection.`;

  const critEmbed = await pc.inference.embed('multilingual-e5-large', [critText], {
    inputType: 'passage',
    truncate: 'END'
  });
  allVectors.push({
    id: 'sdn100-critical-findings',
    values: critEmbed.data[0].values,
    metadata: {
      name: 'SDN 100 Critical Compliance Findings',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-SDN100-001',
      source_tag: 'katharos-investigation',
      type_tag: 'compliance_recommendation',
      text: critText.substring(0, 1000),
      timestamp: new Date().toISOString()
    }
  });
  console.log('Embedded critical findings');

  // 4. Investigation metadata vector
  const metaText = `Katharos Top 100 SDN Subjects Entity Investigation KATHAROS-2026-SDN100-001: 685 entities across 100 SDN subjects in 6 programs. RUSSIA 35 subjects: Potanin 19 entities, Usmanov 31, Rotenberg Brothers 24, Timchenko 34, Sechin 15, Deripaska 26, Fridman Aven 15, Garantex 19 plus 25 compact subjects 150 entities. IRAN 20 subjects: IRGC-QF 40+ entities, Mahan Air 8, IRISL 15+, Bank Melli Saderat Sepah, MODAFL, Triliance. DPRK 10 subjects: Lazarus Group 20 entities Bybit $1.5B, Kim Jong Un, KOMID, IT worker network 1000+. CARTELS 15 subjects: CJNG El Mencho 17 entities FTO designation, Sinaloa Zambada Los Chapitos, Gulf Cartel, Zetas, Kinahan, Yamaguchi-gumi. CYBER/CRYPTO 10 subjects: Garantex Grinex MKAN successor chain, Hydra, Suex Chatex, Tornado Cash sanctions removed, Trickbot Conti, Evil Corp. GLOBAL MAGNITSKY 10 subjects: Gertler 29 entities 46+ OFAC count, Ivanishvili, dos Santos, Karimova, El Aissami, Lukashenko. Standard screening finds 100 entities (1 per subject). Katharos finds 685. Coverage gap 85%. Multiplier 6.85x.`;

  const metaEmbed = await pc.inference.embed('multilingual-e5-large', [metaText], {
    inputType: 'passage',
    truncate: 'END'
  });
  allVectors.push({
    id: 'sdn100-investigation-metadata',
    values: metaEmbed.data[0].values,
    metadata: {
      name: 'Top 100 SDN Subjects Investigation Overview',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-SDN100-001',
      source_tag: 'katharos-investigation',
      type_tag: 'investigation_metadata',
      text: metaText.substring(0, 1000),
      totalSubjects: '100',
      totalEntities: String(totalEntities),
      riskLevel: 'CRITICAL',
      coverageGap: '85%',
      programs: 'RUSSIA, IRAN, DPRK, CARTELS, CYBER/CRYPTO, GLOBAL MAGNITSKY',
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
