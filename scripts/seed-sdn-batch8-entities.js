#!/usr/bin/env node
/**
 * Seed SDN Batch 8 Entity Investigation into Pinecone RAG knowledge base.
 *
 * Parses katharos-sdn-batch8-investigation.md, extracts entities from multiple
 * table formats and compact entries including:
 * - | # | Entity | Jurisdiction | Type | Role | SDN? | Claude misses? |
 * - | # | Entity | Jurisdiction | Type | Status | Priority |
 * - | # | Entity | Designation Date | Role | SDN? |
 * - | # | Exchange | Claude Says | Reality | Claude gap? |
 * - Compact entries: **SUBJECT N — Name** followed by paragraph text
 *
 * FOCUS: Entities that standard screening AND raw Claude would miss
 * Programs: IRAN (Protest crackdown/Zanjani/Procurement), MAGNITSKY (Colombia/FTO/Honduras),
 *           RUSSIA (A7A5/LIG/Nayara), CRYPTO (DPRK IT/Zedcex/exchanges),
 *           FINANCIAL (Compliance gaps/ICC/Gatekeepers)
 * Total: ~415 entities across 50 subjects (610–659)
 *
 * Usage: PINECONE_API_KEY=pcsk_... node scripts/seed-sdn-batch8-entities.js
 */

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'entity_investigations';

// ── Program metadata ──

const PROGRAMS = {
  'RUSSIA': { name: 'Russia Hidden Networks 2025-2026 / A7A5 / LIG / Nayara', prefix: 'sdn8-russia' },
  'IRAN': { name: 'Iran Protest Crackdown / Zanjani-Zedcex / Weapons Procurement', prefix: 'sdn8-iran' },
  'CRYPTO': { name: 'DPRK IT Workers / Crypto Exchange Gaps / Sanctions-Busting', prefix: 'sdn8-crypto' },
  'MAGNITSKY': { name: 'Colombia Petro SDN / FTO Cartels / South America', prefix: 'sdn8-magnitsky' },
  'FINANCIAL': { name: 'Compliance Gaps / ICC / Gatekeepers / India OFAC', prefix: 'sdn8-fininfra' },
};

// Detect program from section header (## SECTION NAME)
function detectProgramFromSection(text) {
  const t = text.toUpperCase();
  if (t.includes('IRAN PROTEST') || t.includes('IRAN WEAPONS') || t.includes('IRAN INTERNET')) return 'IRAN';
  if (t.includes('COLOMBIA') || t.includes('SOUTH AMERICA')) return 'MAGNITSKY';
  if (t.includes('RUSSIA') || t.includes('HIDDEN NETWORK')) return 'RUSSIA';
  if (t.includes('DPRK')) return 'CRYPTO';
  if (t.includes('GLOBAL COMPLIANCE') || t.includes('COMPACT')) return 'FINANCIAL';
  return null;
}

// Detect program from subject name (override)
function detectProgramFromName(name) {
  const n = name.toUpperCase();
  // IRAN
  if (n.includes('ZANJANI') || n.includes('ZEDCEX') || n.includes('MOMENI') ||
      n.includes('LARIJANI') || n.includes('NIKAN PEZHVAK') || n.includes('BANK MELLI') ||
      n.includes('SOLTANMOHAMMADI') || n.includes('PHOENIX SHIP') || n.includes('SHADOW FLEET') ||
      n.includes('IRAN PROTEST') || n.includes('IRAN INTERNET') || n.includes('IRAN BALLISTIC') ||
      n.includes('RAYAN FAN') || n.includes('MODAFL') || n.includes('IRAN 875') ||
      n.includes('IRAN 12-DAY') || n.includes('MOJTABA') || n.includes('KHAMENEI') ||
      n.includes('NIKAN PEZHVAK INVOICE')) return 'IRAN';
  // CRYPTO / DPRK
  if (n.includes('DPRK') || n.includes('SHENYANG') || n.includes('GEUMPUNGRI') ||
      n.includes('HERRERA') || n.includes('SIM HYON') || n.includes('CRYPTO EXCHANGE') ||
      n.includes('CYBER-RELATED') || n.includes('$104B') || n.includes('SANCTIONS-BUSTING') ||
      n.includes('A7A5') && !n.includes('FULL NETWORK')) return 'CRYPTO';
  // Russia
  if (n.includes('OLD VECTOR') || n.includes('A7A5') || n.includes('LUKOIL') ||
      n.includes('NAYARA') || n.includes('ROSNEFT') || n.includes('LIG') ||
      n.includes('KYRGYZ CRYPTO')) return 'RUSSIA';
  // Colombia / FTO / South America / Cartels
  if (n.includes('PETRO') || n.includes('COLOMBIA') || n.includes('EGMONT') ||
      n.includes('FAMILIA MICHOACANA') || n.includes('LNFM') || n.includes('CARTELES UNIDOS') ||
      n.includes('CARTEL DEL NORESTE') || n.includes('CDN') || n.includes('FTO MAP') ||
      n.includes('FARC') || n.includes('VENEZUELA') || n.includes('CUBA') ||
      n.includes('LOBO') || n.includes('HONDURAS')) return 'MAGNITSKY';
  // Financial / Compliance / ICC / Gatekeepers
  if (n.includes('ICC') || n.includes('GATEKEEPER') || n.includes('INDIA OFAC') ||
      n.includes('KARIM KHAN') || n.includes('TURKEY PAYMENT') ||
      n.includes('4-DAY GAP') || n.includes('RAYBEAM') || n.includes('GOLDEN MIST') ||
      n.includes('S M A SHIPPING') || n.includes('RUKBAT') || n.includes('DAYSURIS') ||
      n.includes('GL 50A')) return 'FINANCIAL';
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
    if (sectionMatch && !line.startsWith('## Subjects') && !line.startsWith('## BATCH') &&
        !line.startsWith('## CUMULATIVE') && !line.startsWith('## THE CORE') &&
        !line.startsWith('## FRAMING') && !line.startsWith('## FOCUS')) {
      const sectionProg = detectProgramFromSection(sectionMatch[1]);
      if (sectionProg) currentSectionProgram = sectionProg;
      inTable = false;
      continue;
    }

    // Stop at summary section
    if (line.startsWith('## BATCH 8 SUMMARY') ||
        line.startsWith('## CUMULATIVE DATABASE') ||
        line.startsWith('## THE CORE FINDING')) {
      if (currentSubject) subjects.push(currentSubject);
      currentSubject = null;
      break;
    }

    // Track subject headers: ### SUBJECT N — Name
    const subjectMatch = line.match(/^### SUBJECT (\d+(?:[–\-]\d+)?) — (.+)/);
    if (subjectMatch) {
      if (currentSubject) subjects.push(currentSubject);
      const name = subjectMatch[2].trim();
      const subjectNum = subjectMatch[1].split(/[–\-]/)[0];
      const nameProg = detectProgramFromName(name);
      currentSubject = {
        number: parseInt(subjectNum),
        numberRange: subjectMatch[1],
        name,
        program: nameProg || currentSectionProgram || 'FINANCIAL',
        sdnStatus: '',
        standardFinds: '',
        keyFinding: '',
        claudeSays: '',
        entities: [],
      };
      inTable = false;
      continue;
    }

    // Track compact subject headers: **SUBJECT N — Name**
    const compactMatch = line.match(/^\*\*SUBJECT (\d+) — (.+?)\*\*/);
    if (compactMatch) {
      if (currentSubject) subjects.push(currentSubject);
      const name = compactMatch[2].trim();
      const subjectNum = compactMatch[1];
      const nameProg = detectProgramFromName(name);
      currentSubject = {
        number: parseInt(subjectNum),
        numberRange: subjectNum,
        name,
        program: nameProg || currentSectionProgram || 'FINANCIAL',
        sdnStatus: '',
        standardFinds: '',
        keyFinding: '',
        claudeSays: '',
        entities: [],
        compactText: '',
      };
      inTable = false;
      continue;
    }

    if (!currentSubject) continue;

    // Capture compact entry text (non-table subjects)
    if (currentSubject.compactText !== undefined && line.trim() && !line.startsWith('|') &&
        !line.startsWith('**') && !line.startsWith('---') && !line.startsWith('#')) {
      currentSubject.compactText += (currentSubject.compactText ? ' ' : '') + line.trim();
      if (!currentSubject._compactParsed) {
        const items = line.split(';').map(s => s.trim()).filter(Boolean);
        items.forEach(item => {
          const entityName = item.replace(/\([^)]*\)/g, '').trim();
          if (entityName.length > 2 && entityName.length < 120) {
            currentSubject.entities.push({
              name: entityName,
              jurisdiction: '',
              type: 'entity',
              connection: item,
              sdn: '',
              source: 'Katharos Batch 8 compact entry',
              owner: '',
            });
          }
        });
        currentSubject._compactParsed = true;
      }
      continue;
    }

    // Track SDN Status
    const sdnStatusMatch = line.match(/\*\*SDN Status:\*\*\s*(.+)/);
    if (sdnStatusMatch) {
      currentSubject.sdnStatus = sdnStatusMatch[1].trim();
      continue;
    }

    // Track What Claude says
    const claudeMatch = line.match(/\*\*What Claude says:\*\*\s*(.+)/);
    if (claudeMatch) {
      currentSubject.claudeSays = claudeMatch[1].trim();
      continue;
    }

    // Track screening stats
    const stdMatch = line.match(/\*\*Standard screening finds:\*\*\s*(.+)/);
    if (stdMatch) { currentSubject.standardFinds = stdMatch[1].trim(); continue; }

    // Track key compliance finding
    const keyMatch = line.match(/\*\*Key finding.*?:\*\*\s*(.+)/);
    if (keyMatch) { currentSubject.keyFinding = keyMatch[1].trim(); continue; }

    // Track breaking intelligence
    const breakingMatch = line.match(/\*\*Breaking intelligence:\*\*\s*(.+)/);
    if (breakingMatch) { currentSubject.keyFinding = breakingMatch[1].trim(); continue; }

    // Detect table header (multiple formats)
    if (line.trim().startsWith('|') &&
        (line.includes('Entity') || line.includes('entity') || line.includes('Exchange') ||
         line.includes('Organization') || line.includes('Gatekeeper') || line.includes('Category')) &&
        (line.includes('Jurisdiction') || line.includes('Type') || line.includes('Role') ||
         line.includes('Risk') || line.includes('SDN') || line.includes('Claude') ||
         line.includes('Date') || line.includes('Reality') || line.includes('Count') ||
         line.includes('FTO') || line.includes('Change') || line.includes('Status'))) {
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

      const entity = {};
      tableHeaders.forEach((header, idx) => {
        if (idx < cells.length) {
          const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
          entity[key] = cells[idx];
        }
      });

      // Extract entity name from various header formats
      const entityName = entity.entity || entity.exchange || entity.organization ||
                         entity.gatekeeper_type || entity.category || '';
      if (!entityName || entityName === '---' || entityName === '#' || entityName === '+') continue;

      // Extract connection/description
      const connection = entity.role || entity.reality || entity.material_support_risk ||
                         entity.what_claude_misses || entity.key_ofac_action ||
                         entity.risk || entity.status || '';

      // Extract SDN status
      const sdnField = entity.sdn_ || entity.sdn || entity.claude_gap_ || entity.claude_misses_ || '';

      // Extract source/designation date
      const source = entity.source || entity.designation_date || entity.designation || entity.change || entity.fto_date || '';

      currentSubject.entities.push({
        name: entityName,
        jurisdiction: entity.jurisdiction || '',
        type: entity.type || entity.risk_level || 'entity',
        connection,
        sdn: sdnField,
        source,
        owner: entity.owner || entity.priority || entity.value || '',
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
    `SDN Subject: ${subject.name}`,
    progMeta.name ? `Program: ${progMeta.name}` : '',
    subject.sdnStatus ? `Designation: ${subject.sdnStatus}` : '',
    subject.keyFinding ? `Key finding: ${subject.keyFinding}` : '',
    subject.claudeSays ? `Claude gap: ${subject.claudeSays}` : '',
    'Investigation: Katharos SDN Batch 8 — Subjects 610–659 — Claude blind spots',
    `Standard screening: ${subject.standardFinds || '0 (too recent)'}`,
  ];
  return parts.filter(Boolean).join(' | ');
}

function buildSubjectEmbeddingText(subject, progMeta) {
  const entityNames = subject.entities.map(e => e.name).slice(0, 30).join(', ');
  const compactInfo = subject.compactText ? ` | Context: ${subject.compactText.substring(0, 400)}` : '';
  const claudeGap = subject.claudeSays ? ` | Claude says: ${subject.claudeSays}` : '';
  const parts = [
    `SDN Subject investigation: ${subject.name}`,
    progMeta.name ? `Program: ${progMeta.name}` : '',
    subject.sdnStatus ? `Designation: ${subject.sdnStatus}` : '',
    `Standard screening: ${subject.standardFinds || '0 (too recent)'}`,
    `Entities found: ${entityNames}`.substring(0, 800),
    subject.keyFinding ? `Key compliance finding: ${subject.keyFinding}` : '',
    `Investigation: Katharos SDN Batch 8 — 415 entities across subjects 610–659 — Claude blind spots${compactInfo}${claudeGap}`,
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

  const mdPath = path.resolve(__dirname, '..', 'katharos-sdn-batch8-investigation.md');
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
    const progMeta = PROGRAMS[subject.program] || PROGRAMS['FINANCIAL'];
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

        const sdnText = `${e.sdn} ${e.source} ${e.connection} ${e.owner}`.toLowerCase();
        const isSdn = e.sdn.trim().toUpperCase().startsWith('Y') ||
                       sdnText.includes('sdn') && !sdnText.includes('not sdn') ||
                       sdnText.includes('designated') && !sdnText.includes('not designated');
        const isBlocked = sdnText.includes('blocked') || sdnText.includes('seized') ||
                          sdnText.includes('critical') || sdnText.includes('fto');

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
            investigation: 'KATHAROS-2026-SDN-BATCH8-001',
            keyFinding: (subject.keyFinding || '').substring(0, 500),
            claudeGap: (subject.claudeSays || '').substring(0, 500),
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
      const progMeta = PROGRAMS[s.program] || PROGRAMS['FINANCIAL'];
      return buildSubjectEmbeddingText(s, progMeta);
    });

    const embedResult = await pc.inference.embed('multilingual-e5-large', texts, {
      inputType: 'passage', truncate: 'END'
    });

    batch.forEach((s, j) => {
      const progMeta = PROGRAMS[s.program] || PROGRAMS['FINANCIAL'];
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
          investigation: 'KATHAROS-2026-SDN-BATCH8-001',
          standardFinds: s.standardFinds || '',
          keyFinding: (s.keyFinding || '').substring(0, 500),
          claudeGap: (s.claudeSays || '').substring(0, 500),
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
  const critText = `SDN Batch 8 Critical Findings KATHAROS-2026-SDN-BATCH8-001 — CLAUDE BLIND SPOTS: 1. BABAK ZANJANI RE-DESIGNATED January 30, 2026 — Claude says "delisted 2016, not currently SDN" — WRONG; Zedcex Exchange $94B+ transactions; Zedxion Exchange; 7 live TRX addresses on SDN; 71-75 Shelton Street London mass-registration; IRGC 87% of volume; first OFAC crypto exchange designation under Iran financial sector authority. 2. MOJTABA KHAMENEI became Iran Supreme Leader March 8, 2026 — Claude says "Ali Khamenei is Supreme Leader" — WRONG; Bloomberg reported mansions in north London; property empire worth hundreds of billions; imminent SDN designation. 3. GUSTAVO PETRO SDN October 24, 2025 — sitting President of Colombia SDN; wife Veronica Alcocer SDN; son Nicolas arrested for ML; Interior Minister Benedetti SDN; unprecedented sitting head of state designation. 4. LUKOIL INTERNATIONAL GMBH SDN December 2025 — Claude says "Lukoil not US-sanctioned" — WRONG for LIG Austria subsidiary; 50% rule contaminates Bulgaria/Romania/Serbia/Croatia stations; GL 128B expires April 29, 2026. 5. NAYARA ENERGY BLOCKED via Rosneft 50% rule January 10, 2025 — Claude says "operates independently" — WRONG; India's second-largest private refinery; GL 133 March 2026. 6. IRAN PROTEST CRACKDOWN 30+ new SDNs January-March 2026 — Larijani, Momeni, Khademi, provincial IRGC commanders; 12,000-36,000 protesters killed. 7. SOLTANMOHAMMADI 7 UK PASSPORTS — SDN December 2025; 4 different names; Dubai Marina apartment; Sentosa Cove Singapore; alias explosion defeats name screening. 8. RAYAN FAN GROUP + 38 entities October 2025 — Iran MODAFL missile procurement; Chinese suppliers Hebei Senning/"Sunny International" alias; UN snapback context. 9. A7A5/OLD VECTOR SDN August 2025 — $93B stablecoin; Kyrgyzstan issuer; EU banned October 2025; Russia-Iran trade corridor.`;

  const critEmbed = await pc.inference.embed('multilingual-e5-large', [critText], {
    inputType: 'passage', truncate: 'END'
  });
  allVectors.push({
    id: 'sdn-batch8-critical-findings',
    values: critEmbed.data[0].values,
    metadata: {
      name: 'SDN Batch 8 Critical Compliance Findings — Claude Blind Spots',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-SDN-BATCH8-001',
      source_tag: 'katharos-investigation',
      type_tag: 'compliance_recommendation',
      text: critText.substring(0, 1000),
      timestamp: new Date().toISOString()
    }
  });
  console.log('Embedded critical findings');

  // 4. Investigation metadata vector
  const metaText = `Katharos SDN Batch 8 Investigation KATHAROS-2026-SDN-BATCH8-001: 415 entities across subjects 610-659. FOCUS: Entities that standard screening AND raw Claude would miss. Claude miss rate: ~90%. IRAN PROTEST CRACKDOWN (610-618): Zanjani/Zedcex/Zedxion $94B exchange SDN January 2026 16 entities; Momeni Interior Minister SDN January 2026 8 entities; Larijani SCNS SDN January 2026 10 entities; Nikan Pezhvak Bank Melli/Golden Mist Singapore SDN January 2026 11 entities; Soltanmohammadi 7 UK passports SDN December 2025 8 entities; Phoenix Ship Management Iran shadow fleet 7 entities; A7A5/Old Vector/Grinex August 2025 7 entities; Iran protest full official network 15 entities; Mojtaba Khamenei new Supreme Leader March 8 2026 6 entities. COLOMBIA PETRO (619-622): Petro family SDN October 2025 10 entities; Colombia Egmont suspension 5 entities; LNFM FTO February 2025 8 entities; Carteles Unidos FTO 5 entities. IRAN WEAPONS (623-625): Rayan Fan Group MODAFL procurement 15 entities; Iran ballistic missile UN snapback 7 entities; Iran internet shutdown 5 entities. RUSSIA HIDDEN (626-630): A7A5 Old Vector full network 8 entities; ICC designations December 2025 5 entities; Lukoil International GmbH SDN December 2025 9 entities; Nayara Energy blocked 50% rule 7 entities; CDN/El Huevo updated 5 entities. SOUTH AMERICA (631-634): Colombia coca FARC dissidents 8 entities; Venezuela GL 49/50A 6 entities; Cuba SST reimposed 6 entities; Full FTO map 10 organizations. DPRK (635-638): Shenyang Geumpungri August 2025 5 entities; Herrera Barcelona March 2026 4 entities; Sim Hyon-Sop live ETH March 2026 4 entities; Lobo Honduras March 2026 5 entities. GLOBAL COMPLIANCE (639-659): ICC December 2025 5 entities; Old Vector Kyrgyz 5 entities; Iran 12-day war June 2025 5 entities; OFAC gatekeeper enforcement 8 entities; Iran 875 designations 2025 8 categories; Cyber removal March 13 2026; Crypto exchange gap map 10 exchanges; Cyber landscape 7 entities; India OFAC warning Nayara 5 entities; ICC Khan arrest 4 entities; Turkey Zedcex connection 5 entities; Russia $104B crypto 6 entities; Compact entries 651-659: Mojtaba property empire, Raybeam network, Golden Mist Singapore, SMA Shipping Panama, Rukbat Marine India, Petro son Italian passport, Nikan Pezhvak invoice pattern, Venezuela GL 50A, 4-day gap analysis. Standard: ~42. Katharos: ~415. Gap: ~90%.`;

  const metaEmbed = await pc.inference.embed('multilingual-e5-large', [metaText], {
    inputType: 'passage', truncate: 'END'
  });
  allVectors.push({
    id: 'sdn-batch8-investigation-metadata',
    values: metaEmbed.data[0].values,
    metadata: {
      name: 'SDN Batch 8 Investigation Overview (Subjects 610–659) — Claude Blind Spots',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-SDN-BATCH8-001',
      source_tag: 'katharos-investigation',
      type_tag: 'investigation_metadata',
      text: metaText.substring(0, 1000),
      totalSubjects: String(subjects.length),
      totalEntities: String(totalEntities),
      riskLevel: 'CRITICAL',
      coverageGap: '90%',
      programs: 'IRAN PROTEST/ZANJANI/PROCUREMENT, RUSSIA A7A5/LIG/NAYARA, COLOMBIA PETRO SDN, DPRK IT/CRYPTO, COMPLIANCE GAPS/ICC/GATEKEEPERS',
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
