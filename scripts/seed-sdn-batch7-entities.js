#!/usr/bin/env node
/**
 * Seed SDN Batch 7 Entity Investigation into Pinecone RAG knowledge base.
 *
 * Parses katharos-sdn-batch7-investigation.md, extracts entities from multiple
 * table formats and compact (paragraph) entries including:
 * - | # | Entity | Jurisdiction | Type | Role | SDN? |
 * - Compact entries: **SUBJECT N — Name** followed by semicolon-delimited text
 *
 * Programs: IRAN (Hamas/Hezbollah/MB), MAGNITSKY (DRC/Africa/Central America),
 *           RUSSIA (Oligarchs 2025-2026/SE Asia), CRYPTO (DPRK/crypto),
 *           FINANCIAL (Intelligence/Typology/Compact)
 * Total: ~775 entities across 100 subjects (510–609)
 *
 * Usage: PINECONE_API_KEY=pcsk_... node scripts/seed-sdn-batch7-entities.js
 */

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'entity_investigations';

// ── Program metadata ──

const PROGRAMS = {
  'RUSSIA': { name: 'Russia Oligarchs 2025-2026 / Extended Networks', prefix: 'sdn7-russia' },
  'IRAN': { name: 'Hamas / Hezbollah / Muslim Brotherhood / Iran Proxy', prefix: 'sdn7-iran' },
  'CRYPTO': { name: 'DPRK IT Workers / Crypto Sanctions', prefix: 'sdn7-crypto' },
  'MAGNITSKY': { name: 'DRC / Africa / Central America / Regional Threats', prefix: 'sdn7-magnitsky' },
  'FINANCIAL': { name: 'Financial Intelligence / Typology / Compliance', prefix: 'sdn7-fininfra' },
};

// Detect program from section header (## SECTION NAME)
function detectProgramFromSection(text) {
  const t = text.toUpperCase();
  if (t.includes('MARCH 2026 OFAC')) return null; // mixed — use name detection
  if (t.includes('HAMAS') || t.includes('HEZBOLLAH') || t.includes('MUSLIM BROTHERHOOD') ||
      t.includes('IRAN-IRAQ')) return 'IRAN';
  if (t.includes('DRC') || t.includes('AFRICA') || t.includes('CENTRAL AMERICA') ||
      t.includes('CARIBBEAN')) return 'MAGNITSKY';
  if (t.includes('RUSSIA') || t.includes('OLIGARCH')) return 'RUSSIA';
  if (t.includes('SOUTHEAST ASIA') || t.includes('PACIFIC')) return 'RUSSIA'; // SE Asia mapped to RUSSIA for consistency
  if (t.includes('FINANCIAL INTELLIGENCE') || t.includes('TYPOLOGY')) return 'FINANCIAL';
  if (t.includes('COMPACT ENTRIES')) return 'FINANCIAL';
  return null;
}

// Detect program from subject name (override)
function detectProgramFromName(name) {
  const n = name.toUpperCase();
  // IRAN / Hamas / Hezbollah / Muslim Brotherhood
  if (n.includes('HAMAS') || n.includes('HEZBOLLAH') || n.includes('MUSLIM BROTHERHOOD') ||
      n.includes('IRAN') || n.includes('PCPA') || n.includes('BIRAWI') ||
      n.includes('KHAMENEI') || n.includes('AHMADINEJAD') || n.includes('HALKBANK') ||
      n.includes('MILITIA FINANCIAL')) return 'IRAN';
  // DPRK / Crypto
  if (n.includes('DPRK') || n.includes('NORTH KOREA') || n.includes('TORNADO CASH') ||
      n.includes('LAZARUS') || n.includes('CRYPTO') || n.includes('DEFI') ||
      n.includes('STABLECOIN') || n.includes('NEOBANK') || n.includes('RANSOMWARE') ||
      n.includes('BITCOIN') || n.includes('EXCHANGE COMPLIANCE')) return 'CRYPTO';
  // Russia oligarchs
  if (n.includes('TIMCHENKO') || n.includes('VEKSELBERG') || n.includes('FRIDMAN') ||
      n.includes('AVEN') || n.includes('ABRAMOVICH') || n.includes('MORDASHOV') ||
      n.includes('TRANSNEFT') || n.includes('TOKAREV') || n.includes('KABAEVA') ||
      n.includes('MALOFEEV') || n.includes('KOVALCHUK') || n.includes('LUKOIL') ||
      n.includes('GADDAFI') || n.includes('KOLOMOISKY') || n.includes('AKHMETOV') ||
      n.includes('PUTIN FAMILY')) return 'RUSSIA';
  // Regional / Magnitsky / Africa / Central America
  if (n.includes('RWANDA') || n.includes('RDF') || n.includes('M23') ||
      n.includes('GERTLER') || n.includes('AFRICA CORPS') || n.includes('AL-SHABAAB') ||
      n.includes('CONGO') || n.includes('DRC') || n.includes('BURKINA') ||
      n.includes('NIGER URANIUM') || n.includes('MALI JUNTA') || n.includes('KENYA') ||
      n.includes('ETHIOPIA') || n.includes('HONDURAS') || n.includes('EL SALVADOR') ||
      n.includes('GUATEMALA') || n.includes('DOMINICAN') || n.includes('HAITI') ||
      n.includes('NICARAGUA') || n.includes('SUDAN') || n.includes('VENEZUELA') ||
      n.includes('COUNTER NARCOTICS') || n.includes('LOBO') ||
      n.includes('BRAZIL') || n.includes('ARGENTINA') || n.includes('PERU') ||
      n.includes('BOLIVIA') || n.includes('ECUADOR') || n.includes('COLOMBIA') ||
      n.includes('MYANMAR SAC') || n.includes('LAOS GOLDEN') ||
      n.includes('CAMBODIA SCAM') || n.includes('PHILIPPINES') ||
      n.includes('SAUDI') || n.includes('UAE') || n.includes('QATAR') ||
      n.includes('KUWAIT') || n.includes('BAHRAIN') || n.includes('OMAN') ||
      n.includes('JORDAN') || n.includes('IRAQ')) return 'MAGNITSKY';
  // Financial infrastructure / intelligence / typology
  if (n.includes('MONEY LAUNDERING RISK') || n.includes('CORPORATE TRANSPARENCY') ||
      n.includes('REAL ESTATE AML') || n.includes('PIG BUTCHERING') ||
      n.includes('BEC') || n.includes('BUSINESS EMAIL') ||
      n.includes('PANAMA PAPERS') || n.includes('PANDORA PAPERS') ||
      n.includes('SWISS BANKING') || n.includes('LIECHTENSTEIN') ||
      n.includes('CHANNEL ISLANDS') || n.includes('BVI CORPORATE') ||
      n.includes('CAYMAN') || n.includes('LUXEMBOURG') || n.includes('CYPRUS CONFIDENTIAL') ||
      n.includes('MALTA') || n.includes('GREECE') || n.includes('UKRAINE KLEPTOCAPTURE') ||
      n.includes('CORRESPONDENT BANKING') || n.includes('SWIFT') ||
      n.includes('AI-ENABLED') || n.includes('FINTECH') ||
      n.includes('CHINA FINANCIAL') || n.includes('TAIWAN') ||
      n.includes('PAKISTAN-AFGHAN') || n.includes('BANGLADESH') ||
      n.includes('INDIA FINANCIAL') || n.includes('SINGAPORE') ||
      n.includes('VIETNAM') || n.includes('AUSTRALIA') || n.includes('NEW ZEALAND') ||
      n.includes('INDONESIA FINANCIAL') || n.includes('MALAYSIA FINANCIAL')) return 'FINANCIAL';
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
        !line.startsWith('## CUMULATIVE') && !line.startsWith('## CRITICAL NEW') &&
        !line.startsWith('## Live intelligence')) {
      const sectionProg = detectProgramFromSection(sectionMatch[1]);
      if (sectionProg) currentSectionProgram = sectionProg;
      inTable = false;
      continue;
    }

    // Stop at summary section
    if (line.startsWith('## BATCH 7 SUMMARY') ||
        line.startsWith('## CUMULATIVE DATABASE') ||
        line.startsWith('## CRITICAL NEW FINDINGS')) {
      if (currentSubject) subjects.push(currentSubject);
      currentSubject = null;
      break;
    }

    // Track subject headers: ### SUBJECT N — Name (with optional date/notes)
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
        entities: [],
        compactText: '',
      };
      inTable = false;
      // The next line(s) contain the compact text
      continue;
    }

    if (!currentSubject) continue;

    // Capture compact entry text (non-table subjects)
    if (currentSubject.compactText !== undefined && line.trim() && !line.startsWith('|') &&
        !line.startsWith('**') && !line.startsWith('---') && !line.startsWith('#')) {
      currentSubject.compactText += (currentSubject.compactText ? ' ' : '') + line.trim();
      // Parse semicolon-delimited entities from compact text
      if (!currentSubject._compactParsed) {
        const items = line.split(';').map(s => s.trim()).filter(Boolean);
        items.forEach(item => {
          // Extract entity names from compact text items
          const entityName = item.replace(/\([^)]*\)/g, '').trim();
          if (entityName.length > 2 && entityName.length < 120) {
            currentSubject.entities.push({
              name: entityName,
              jurisdiction: '',
              type: 'entity',
              connection: item,
              sdn: '',
              source: 'Katharos Batch 7 compact entry',
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

    // Track screening stats
    const stdMatch = line.match(/\*\*Standard screening finds:\*\*\s*(.+)/);
    if (stdMatch) { currentSubject.standardFinds = stdMatch[1].trim(); continue; }

    // Track key compliance finding
    const keyMatch = line.match(/\*\*Key finding:\*\*\s*(.+)/);
    if (keyMatch) { currentSubject.keyFinding = keyMatch[1].trim(); continue; }

    // Track entities standard screening misses
    const missMatch = line.match(/\*\*Entities standard screening misses:\s*(.+)\*\*/);
    if (missMatch && !currentSubject.katharosFinds) {
      currentSubject.katharosFinds = missMatch[1].trim();
      continue;
    }

    // Detect table header
    if (line.trim().startsWith('|') &&
        (line.includes('Entity') || line.includes('entity') || line.includes('Asset') ||
         line.includes('System') || line.includes('Program')) &&
        (line.includes('Jurisdiction') || line.includes('Type') || line.includes('Role') ||
         line.includes('Risk') || line.includes('SDN'))) {
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

      const entityName = entity.entity || entity.entity_corridor || entity.asset_entity ||
                         entity.system_entity || entity.structure_entity || entity.program_entity ||
                         entity.entity_category || '';
      if (!entityName || entityName === '---' || entityName === '#') continue;

      const connection = entity.role || entity.sanctions_link || entity.connection || entity.notes ||
                         entity.risk_level || entity.sanctions_risk || entity.sdn_link || '';

      const sdnField = entity.sdn_ || entity.sdn || entity.status || '';
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
    'Investigation: Katharos SDN Batch 7 — Subjects 510–609',
    `Standard screening: ${subject.standardFinds || '1 entity'}`,
  ];
  return parts.filter(Boolean).join(' | ');
}

function buildSubjectEmbeddingText(subject, progMeta) {
  const entityNames = subject.entities.map(e => e.name).slice(0, 30).join(', ');
  const compactInfo = subject.compactText ? ` | Context: ${subject.compactText.substring(0, 400)}` : '';
  const parts = [
    `SDN Subject investigation: ${subject.name}`,
    progMeta.name ? `Program: ${progMeta.name}` : '',
    subject.sdnStatus ? `Designation: ${subject.sdnStatus}` : '',
    `Standard screening: ${subject.standardFinds || '1 entity'}`,
    `Entities found: ${entityNames}`.substring(0, 800),
    subject.keyFinding ? `Key compliance finding: ${subject.keyFinding}` : '',
    `Investigation: Katharos SDN Batch 7 — 775 entities across subjects 510–609${compactInfo}`,
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

  const mdPath = path.resolve(__dirname, '..', 'katharos-sdn-batch7-investigation.md');
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
            investigation: 'KATHAROS-2026-SDN-BATCH7-001',
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
          investigation: 'KATHAROS-2026-SDN-BATCH7-001',
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
  const critText = `SDN Batch 7 Critical Findings KATHAROS-2026-SDN-BATCH7-001: 1. HAMAS SHAM CHARITIES — March 12, 2026 — Four new SDNs (Turkey x3: GDD, Hayat Yolu, White Hands; Indonesia x1: KNRP) — 4 days ago; not in most compliance databases; systematic Trump admin targeting Hamas global charity infrastructure. 2. DPRK IT WORKER FACILITATORS — March 12, 2026 — York Louis Celestino Herrera (Barcelona, Dominican Republic); Sim Hyon-Sop new ETH wallet 0x4f47bc496083c727c5fbe3ce9cdf2b0f6496270c; Spain as DPRK IT worker hub in Western Europe. 3. RWANDA DEFENCE FORCE — March 2, 2026 — Entire Rwandan military SDN; GL-1 wind-down expires April 1, 2026; DRC mineral supply chain (coltan/cobalt/gold); Apple/Tesla/Samsung exposure. 4. MUSLIM BROTHERHOOD EGYPT/JORDAN — January 13, 2026 — First of "ongoing, sustained effort"; OFAC warned foreign banks risk losing US access. 5. HAMAS GAZA SHAM CHARITIES — January 21, 2026 — Seven organizations + Zaher Birawi UK + PCPA; documentary evidence from Hamas offices post-October 7. 6. LUKOIL INTERNATIONAL GMBH — December 2025 SDN; GL 128B expires April 29, 2026; Bulgaria/Romania/Serbia/Croatia gas stations need wind-down. 7. VENEZUELA SDN REMOVALS — March 6, 2026 — Post-Maduro-capture selective delisting; compliance databases need removals not just additions. 8. NICARAGUA DESIGNATIONS — March 2026 — Five senior Ortega officials; expanding network designation. 9. WIKIPEDIA SDN ANOMALY — Subjects 607-609 — Saif al-Islam Gaddafi, Ali Khamenei, Mahmoud Ahmadinejad listed as "died in 2026" on Wikipedia — demonstrates live intelligence value over static databases.`;

  const critEmbed = await pc.inference.embed('multilingual-e5-large', [critText], {
    inputType: 'passage', truncate: 'END'
  });
  allVectors.push({
    id: 'sdn-batch7-critical-findings',
    values: critEmbed.data[0].values,
    metadata: {
      name: 'SDN Batch 7 Critical Compliance Findings',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-SDN-BATCH7-001',
      source_tag: 'katharos-investigation',
      type_tag: 'compliance_recommendation',
      text: critText.substring(0, 1000),
      timestamp: new Date().toISOString()
    }
  });
  console.log('Embedded critical findings');

  // 4. Investigation metadata vector
  const metaText = `Katharos SDN Batch 7 Investigation KATHAROS-2026-SDN-BATCH7-001: 775 entities across subjects 510-609. MARCH 2026 LIVE ACTIONS (510-520): Hamas sham charities March 12 2026 21 entities (GDD, Hayat Yolu, White Hands Turkey, KNRP Indonesia); DPRK IT worker facilitators March 12 10 entities (Herrera Barcelona, Sim Hyon-Sop new ETH address); Rwanda Defence Force March 2 20 entities (entire military SDN, M23, DRC minerals); Muslim Brotherhood Egypt/Jordan January 13 18 entities; Hamas Gaza charities January 21 20 entities (Waed, Al-Nur, Qawafil, Al-Falah, Merciful Hands, Al-Salameh, PCPA, Birawi); Lukoil International GmbH December 2025 14 entities (GL 128B expires April 29); Venezuela removals March 6 14 entities; Nicaragua March 2026 18 entities; Sudan March 9 2026 10 entities; Russia removal March 6 2026; Counter Narcotics removal March 12. HAMAS ECOSYSTEM (521-525): Hamas global fundraising 24 entities; PCPA/Birawi UK 20 entities; Muslim Brotherhood global 20 entities; Hezbollah 2025-2026 20 entities; Iran-Iraq militia 20 entities. DRC/AFRICA (526-535): M23/RDF minerals 25 entities; Gertler cobalt 16 entities; Africa Corps Wagner 22 entities; Al-Shabaab 18 entities; DRC conflict minerals 20 entities; Burkina junta 16; Niger uranium 16; Mali gold 17; Kenya 12; Ethiopia 14. CENTRAL AMERICA/CARIBBEAN (536-540): Honduras Lobo 17; El Salvador Bitcoin 16; Guatemala 16; Dominican Republic 12; Haiti 17. RUSSIA EXTENDED (541-550): Timchenko 20; Vekselberg 18; Fridman LetterOne 17; Aven Alfa 14; Abramovich Evraz Chelsea 20; Mordashov Severstal 18; Transneft 14; Kabaeva Putin family 15; Malofeev Tsargrad 15; Kovalchuk Rossiya 15. SE ASIA/PACIFIC (551-560): Laos Golden Triangle 15; Myanmar SAC 18; Cambodia scam compounds 21; Philippines 17; Vietnam 14; Australia Crown casino 15; New Zealand 13; Singapore 16; Indonesia 15; Malaysia 16. FINANCIAL INTELLIGENCE (561-565): US NMLRA 2026 17; CTA registry 13; Real estate AML 18; Pig butchering 18; BEC 16. COMPACT ENTRIES (566-609): 44 subjects including Brazil/Argentina/Peru/Bolivia/Ecuador, Panama Papers/Pandora Papers active structures, Swiss/Liechtenstein/Channel Islands/BVI/Cayman/Luxembourg/Cyprus/Malta/Greece compliance, Ukraine KleptoCapture, Kolomoisky, Akhmetov, Halkbank, Saudi MBS, UAE post-FATF, Qatar, Gulf states, Pakistan-Afghanistan, Bangladesh, India, China, DPRK nuclear, Taiwan, crypto regulatory arbitrage, fintech/neobank, ransomware 2025, AI-enabled crime, stablecoins, DeFi, exchange compliance ranking, SWIFT/correspondent banking, Wikipedia SDN anomalies (Gaddafi/Khamenei/Ahmadinejad "died 2026"). Standard: ~100. Katharos: ~775. Gap: ~87%.`;

  const metaEmbed = await pc.inference.embed('multilingual-e5-large', [metaText], {
    inputType: 'passage', truncate: 'END'
  });
  allVectors.push({
    id: 'sdn-batch7-investigation-metadata',
    values: metaEmbed.data[0].values,
    metadata: {
      name: 'SDN Batch 7 Investigation Overview (Subjects 510–609)',
      category: 'entity_investigation',
      investigation: 'KATHAROS-2026-SDN-BATCH7-001',
      source_tag: 'katharos-investigation',
      type_tag: 'investigation_metadata',
      text: metaText.substring(0, 1000),
      totalSubjects: String(subjects.length),
      totalEntities: String(totalEntities),
      riskLevel: 'CRITICAL',
      coverageGap: '87%',
      programs: 'IRAN/HAMAS/HEZBOLLAH, RUSSIA OLIGARCHS 2025-2026, DRC/AFRICA/CENTRAL AMERICA, DPRK/CRYPTO, FINANCIAL INTELLIGENCE/TYPOLOGY',
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
