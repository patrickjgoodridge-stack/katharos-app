#!/usr/bin/env node
/**
 * Seed Expansion Batch into Pinecone RAG knowledge base.
 *
 * Parses katharos-expansion-batch.md, extracts entities from:
 * - Full subject entries with tables (ML-051 through CF-060)
 * - Compact bold entries (**SUBJECT NNN — Name**)
 * - SDN Batch 5 compact entries (SUBJECT 310–409)
 *
 * Categories: ML (Convicted Money Launderers), IND (Indicted), FRD (Fraud),
 *             RICO, AF (Asset Forfeiture), CRT (Cartel), CF (Crypto Fraud)
 * Programs: RUSSIA, IRAN, DPRK, CARTELS, CRYPTO, EVASION
 * Total: ~1,450 entities across 170 subjects (70 category + 100 SDN)
 *
 * Usage: PINECONE_API_KEY=pcsk_... node scripts/seed-expansion-batch-entities.js
 */

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'entity_investigations';
const INVESTIGATION_ID = 'KATHAROS-2026-EXPANSION-001';

// ── Category metadata (Category Batch 2) ──

const CATEGORIES = {
  'ML':   { name: 'Convicted Money Launderers', prefix: 'exp-ml' },
  'IND':  { name: 'Indicted / Pending', prefix: 'exp-ind' },
  'FRD':  { name: 'Fraud Defendants', prefix: 'exp-frd' },
  'RICO': { name: 'RICO Defendants', prefix: 'exp-rico' },
  'AF':   { name: 'Asset Forfeiture Targets', prefix: 'exp-af' },
  'CRT':  { name: 'Cartel-Linked Entities', prefix: 'exp-crt' },
  'CF':   { name: 'Crypto Fraud Actors', prefix: 'exp-cf' },
};

// ── SDN Batch 5 program metadata ──

const SDN_PROGRAMS = {
  'RUSSIA':  { name: 'Russia Oligarchs / State Entities', prefix: 'sdn5-russia' },
  'IRAN':    { name: 'Iran / Proxy Networks', prefix: 'sdn5-iran' },
  'DPRK':    { name: 'DPRK Cyber / Proliferation', prefix: 'sdn5-dprk' },
  'CARTELS': { name: 'Cartels / Narco Networks', prefix: 'sdn5-cartels' },
  'CRYPTO':  { name: 'Crypto / Digital Asset Threats', prefix: 'sdn5-crypto' },
  'EVASION': { name: 'Sanctions Evasion / Enablers', prefix: 'sdn5-evasion' },
};

// Detect SDN program from subject number
function detectSDNProgram(num) {
  if (num >= 310 && num <= 325) return 'RUSSIA';
  if (num >= 326 && num <= 335) return 'IRAN';
  if (num >= 336 && num <= 345) return 'DPRK';
  if (num >= 346 && num <= 360) return 'CARTELS';
  if (num >= 361 && num <= 375) return 'CRYPTO';
  if (num >= 376 && num <= 409) return 'EVASION';
  return 'EVASION';
}

// ── Parse the markdown ──

function parseMarkdown(markdown) {
  const subjects = [];
  const lines = markdown.split('\n');

  let currentSubject = null;
  let currentCategory = null;
  let inTable = false;
  let tableHeaders = [];
  let inSDNBatch = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Stop at summary sections
    if (line.startsWith('## BATCH SUMMARY') || line.startsWith('## CUMULATIVE DATABASE')) {
      if (currentSubject && currentSubject.entities.length > 0) subjects.push(currentSubject);
      currentSubject = null;
      break;
    }

    // Detect SDN batch section
    if (line.startsWith('# SDN BATCH 5')) {
      if (currentSubject && currentSubject.entities.length > 0) subjects.push(currentSubject);
      currentSubject = null;
      inSDNBatch = true;
      inTable = false;
      continue;
    }

    // Track category headers: # CATEGORY N — NAME
    const catHeaderMatch = line.match(/^# CATEGORY (\d+) — (.+)/);
    if (catHeaderMatch) {
      if (currentSubject && currentSubject.entities.length > 0) subjects.push(currentSubject);
      currentSubject = null;
      inTable = false;
      inSDNBatch = false;
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

    // Track full subject headers: ### ML-051 — Name
    const fullSubjectMatch = line.match(/^### (ML|IND|FRD|RICO|AF|CRT|CF)-(\d+) — (.+)/);
    if (fullSubjectMatch) {
      if (currentSubject && currentSubject.entities.length > 0) subjects.push(currentSubject);
      const cat = fullSubjectMatch[1];
      const num = fullSubjectMatch[2];
      const name = fullSubjectMatch[3].trim();
      currentCategory = cat;

      currentSubject = {
        id: `${cat}-${num}`,
        category: cat,
        number: parseInt(num),
        name,
        status: '',
        keyFinding: '',
        entities: [],
        isSDN: false,
      };
      inTable = false;
      continue;
    }

    // Track SDN subject headers: **SUBJECT NNN — Name**
    const sdnSubjectMatch = line.match(/^\*\*SUBJECT (\d+) — (.+?)\*\*/);
    if (sdnSubjectMatch) {
      if (currentSubject && currentSubject.entities.length > 0) subjects.push(currentSubject);
      const num = parseInt(sdnSubjectMatch[1]);
      const name = sdnSubjectMatch[2].trim();
      const program = detectSDNProgram(num);

      // Get description from rest of line or next lines
      let description = '';
      const afterBold = line.replace(/^\*\*SUBJECT \d+ — .+?\*\*/, '').trim();
      if (afterBold) description = afterBold;

      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== '' &&
             !lines[j].startsWith('**SUBJECT') && !lines[j].startsWith('###') &&
             !lines[j].startsWith('---') && !lines[j].startsWith('## ') &&
             !lines[j].startsWith('# ')) {
        description += (description ? ' ' : '') + lines[j].trim();
        j++;
      }

      // Parse entities from description (semicolon-separated)
      const entityNames = [];
      const descParts = description.split(';');
      for (const part of descParts) {
        const trimmed = part.trim();
        if (trimmed.length > 3 && trimmed.length < 200) {
          entityNames.push(trimmed);
        }
      }

      const descLower = description.toLowerCase();
      const isSdn = descLower.includes('sdn') && !descLower.includes('not sdn') && !descLower.includes('not us sdn');
      const isEuOnly = descLower.includes('eu-sanctioned') || descLower.includes('eu/uk sanctioned');

      currentSubject = {
        id: `SDN5-${num}`,
        category: program,
        number: num,
        name,
        status: isSdn ? 'SDN' : isEuOnly ? 'EU-Sanctioned' : '',
        keyFinding: '',
        entities: entityNames.map(en => ({
          name: en.substring(0, 200),
          jurisdiction: '',
          type: 'entity',
          connection: description.substring(0, 500),
          sdn: isSdn ? 'Y' : 'N',
          source: 'OFAC/DOJ/Katharos',
        })),
        isSDN: true,
      };

      // If no entities parsed from semicolons, add the subject itself
      if (currentSubject.entities.length === 0) {
        currentSubject.entities.push({
          name,
          jurisdiction: '',
          type: 'entity',
          connection: description.substring(0, 500),
          sdn: isSdn ? 'Y' : 'N',
          source: 'OFAC/DOJ/Katharos',
        });
      }

      inTable = false;
      continue;
    }

    // Track compact bold entries for category batch: **AF-051 — Name**
    const compactBoldMatch = line.match(/^\*\*(ML|IND|FRD|RICO|AF|CRT|CF)-(\d+) — (.+?)\*\*/);
    if (compactBoldMatch) {
      if (currentSubject && currentSubject.entities.length > 0) subjects.push(currentSubject);
      const cat = compactBoldMatch[1];
      const num = compactBoldMatch[2];
      const name = compactBoldMatch[3].trim();
      currentCategory = cat;

      let description = '';
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== '' &&
             !lines[j].startsWith('**') && !lines[j].startsWith('###') &&
             !lines[j].startsWith('---') && !lines[j].startsWith('## ') &&
             !lines[j].startsWith('# ')) {
        description += (description ? ' ' : '') + lines[j].trim();
        j++;
      }

      const descLower = description.toLowerCase();
      const isSdn = descLower.includes('sdn') && !descLower.includes('not sdn');
      const isConvicted = descLower.includes('convicted') || descLower.includes('sentenced');

      // Parse entities from description (semicolon-separated)
      const entityNames = [];
      const descParts = description.split(';');
      for (const part of descParts) {
        const trimmed = part.trim();
        if (trimmed.length > 3 && trimmed.length < 200) {
          entityNames.push(trimmed);
        }
      }

      currentSubject = {
        id: `${cat}-${num}`,
        category: cat,
        number: parseInt(num),
        name,
        status: isConvicted ? 'Convicted' : '',
        keyFinding: '',
        entities: entityNames.length > 0 ? entityNames.map(en => ({
          name: en.substring(0, 200),
          jurisdiction: '',
          type: 'entity',
          connection: description.substring(0, 500),
          sdn: isSdn ? 'Y' : 'N',
          source: 'DOJ/Katharos',
        })) : [{
          name,
          jurisdiction: '',
          type: 'entity',
          connection: description.substring(0, 500),
          sdn: isSdn ? 'Y' : 'N',
          source: 'DOJ/Katharos',
        }],
        isSDN: false,
      };
      inTable = false;
      continue;
    }

    if (!currentSubject) continue;

    // Track Status
    const statusMatch = line.match(/\*\*Status:\*\*\s*(.+)/);
    if (statusMatch) {
      currentSubject.status = statusMatch[1].trim();
      continue;
    }

    // Track key findings
    const keyMatch = line.match(/\*\*Key finding:\*\*\s*(.+)/);
    if (keyMatch) {
      currentSubject.keyFinding = keyMatch[1].trim();
      continue;
    }

    // Detect table header
    if (line.trim().startsWith('|') &&
        (line.includes('Entity') || line.includes('Asset')) &&
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

      const entity = {};
      tableHeaders.forEach((header, idx) => {
        if (idx < cells.length) {
          const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
          entity[key] = cells[idx];
        }
      });

      const entityName = entity.entity || entity.asset_entity || '';
      if (!entityName || entityName === '---' || entityName === '#') continue;

      const connection = entity.role || entity.notes || entity.connection || '';
      const sdnField = entity.sdn_ || entity.sdn || '';
      const source = entity.source || '';

      currentSubject.entities.push({
        name: entityName,
        jurisdiction: entity.jurisdiction || '',
        type: entity.type || 'entity',
        connection: connection.substring(0, 500),
        sdn: sdnField,
        source,
      });
      continue;
    }

    // End table on empty/non-table line
    if (inTable && !line.trim().startsWith('|')) {
      inTable = false;
    }
  }

  if (currentSubject && currentSubject.entities.length > 0) subjects.push(currentSubject);
  return subjects;
}

// ── Build embedding text ──

function buildEntityEmbeddingText(entity, subject) {
  const program = subject.isSDN
    ? (SDN_PROGRAMS[subject.category] || {}).name || subject.category
    : (CATEGORIES[subject.category] || {}).name || subject.category;

  const parts = [
    `Financial Crime Entity: ${entity.name}`,
    entity.type && entity.type !== 'entity' ? `Type: ${entity.type}` : '',
    entity.jurisdiction ? `Jurisdiction: ${entity.jurisdiction}` : '',
    entity.connection ? `Connection: ${entity.connection}` : '',
    entity.sdn ? `SDN status: ${entity.sdn}` : '',
    entity.source ? `Source: ${entity.source}` : '',
    `Subject: ${subject.name} (${subject.id})`,
    `Program: ${program}`,
    subject.status ? `Status: ${subject.status}` : '',
    subject.keyFinding ? `Key finding: ${subject.keyFinding}` : '',
    `Investigation: Katharos Expansion Batch — 170 subjects, ~1,450 entities`,
  ];
  return parts.filter(Boolean).join(' | ');
}

function buildSubjectEmbeddingText(subject) {
  const program = subject.isSDN
    ? (SDN_PROGRAMS[subject.category] || {}).name || subject.category
    : (CATEGORIES[subject.category] || {}).name || subject.category;

  const entityNames = subject.entities.map(e => e.name).slice(0, 30).join(', ');
  const parts = [
    `Financial Crime Subject: ${subject.name} (${subject.id})`,
    `Program: ${program}`,
    subject.status ? `Status: ${subject.status}` : '',
    `Entities: ${entityNames}`.substring(0, 800),
    subject.keyFinding ? `Key finding: ${subject.keyFinding}` : '',
    `Investigation: Katharos Expansion Batch — 170 subjects across 13 programs`,
  ];
  return parts.filter(Boolean).join(' | ');
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '').substring(0, 60);
}

function getPrefix(subject) {
  if (subject.isSDN) {
    return (SDN_PROGRAMS[subject.category] || { prefix: 'sdn5-misc' }).prefix;
  }
  return (CATEGORIES[subject.category] || { prefix: 'exp-misc' }).prefix;
}

// ── Main ──

async function main() {
  if (!process.env.PINECONE_API_KEY) {
    console.error('Error: PINECONE_API_KEY environment variable not set');
    process.exit(1);
  }

  const mdPath = path.resolve(__dirname, '..', 'katharos-expansion-batch.md');
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
    const key = s.isSDN ? `SDN5-${s.category}` : s.category;
    catCounts[key] = (catCounts[key] || 0) + s.entities.length;
  }
  console.log(`Total entities parsed: ${totalEntities}`);
  for (const [cat, count] of Object.entries(catCounts).sort()) {
    console.log(`  ${cat}: ${count} entities`);
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
    const prefix = getPrefix(subject);

    for (let i = 0; i < subject.entities.length; i += BATCH) {
      const batch = subject.entities.slice(i, i + BATCH);
      const texts = batch.map(e => buildEntityEmbeddingText(e, subject));

      const embedResult = await pc.inference.embed('multilingual-e5-large', texts, {
        inputType: 'passage', truncate: 'END'
      });

      batch.forEach((e, j) => {
        entityIdx++;
        const id = `${prefix}-${slugify(subject.name)}-${slugify(e.name)}`.substring(0, 100);

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
            program: subject.isSDN
              ? (SDN_PROGRAMS[subject.category] || {}).name || subject.category
              : (CATEGORIES[subject.category] || {}).name || subject.category,
            category: 'entity_investigation',
            investigation: INVESTIGATION_ID,
            keyFinding: (subject.keyFinding || '').substring(0, 500),
            source_tag: 'katharos-investigation',
            type_tag: 'entity',
            text: buildEntityEmbeddingText(e, subject).substring(0, 1000),
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
    const texts = batch.map(s => buildSubjectEmbeddingText(s));

    const embedResult = await pc.inference.embed('multilingual-e5-large', texts, {
      inputType: 'passage', truncate: 'END'
    });

    batch.forEach((s, j) => {
      const prefix = getPrefix(s);
      const id = `${prefix}-subject-${slugify(s.name)}`.substring(0, 100);
      allVectors.push({
        id,
        values: embedResult.data[j].values,
        metadata: {
          name: `Subject: ${s.name} (${s.id})`,
          type: 'subject_overview',
          subjectName: s.name,
          subjectId: s.id,
          program: s.isSDN
            ? (SDN_PROGRAMS[s.category] || {}).name || s.category
            : (CATEGORIES[s.category] || {}).name || s.category,
          category: 'entity_investigation',
          investigation: INVESTIGATION_ID,
          status: (s.status || '').substring(0, 500),
          keyFinding: (s.keyFinding || '').substring(0, 500),
          entityCount: String(s.entities.length),
          source_tag: 'katharos-investigation',
          type_tag: 'subject_overview',
          text: buildSubjectEmbeddingText(s).substring(0, 1000),
          timestamp: new Date().toISOString()
        }
      });
    });

    console.log(`  Embedded subjects ${i + 1}-${Math.min(i + BATCH, subjects.length)} of ${subjects.length}`);
  }

  // 3. Critical findings vector
  const critText = `Expansion Batch Critical Findings ${INVESTIGATION_ID}: 1. DPRK CRYPTO ESCALATION — $2B+ stolen in 2025 alone (Bybit $1.5B, DMM $305M, WazirX $235M, Radiant $50M); Lazarus adopted Railgun post-Tornado Cash delisting; Safe{Wallet} supply chain compromise vector. 2. CARTEL FTO DESIGNATION — Trump designated 8 Latin American OCGs as FTOs January 2025; material support = 15 years; any US business paying extortion now faces terrorism charges. 3. STATE-LEVEL CRYPTO SANCTIONS EVASION — Central Bank of Iran using hired broker to purchase stablecoins; A7A5 ruble-backed stablecoin processed $93B; Russia/Iran/DPRK collaborating across crypto domains. 4. TD BANK BSA CONVICTION — First criminal BSA conviction of US retail bank since HSBC 2012; $3B settlement; employee bribery ($57K gift cards for $670M cartel proceeds); FinCEN largest penalty. 5. ROSNEFT 50% RULE CASCADE — January 2025 Rosneft SDN blocks Nayara Energy India (second-largest Indian private refinery), NIS Serbia (400+ Balkans petrol stations), Bashneft, Rosneft Trading Switzerland. 6. SANCTIONS EVASION CORRIDORS — Turkey ($10B+), UAE, Kazakhstan, Armenia, Georgia, Serbia all documented as parallel import hubs; OFAC warning letters to banks in each jurisdiction. 7. LAZARUS SUPPLY CHAIN — Bybit hack via compromised Safe{Wallet} developer laptop; Radiant via fake job offer PDF; pattern of targeting individual developers to compromise entire protocols. 8. TETHER SYSTEMIC RISK — USDT documented in Iran, Russia, DPRK, cartel, and pig butchering transactions simultaneously; single most important financial infrastructure across all crime categories. 9. mBRIDGE CBDC THREAT — BIS withdrew from mBridge 2024 citing sanctions concerns; first potential sovereign-scale CBDC sanctions evasion infrastructure. 10. COVERAGE GAP 87% — Cumulative database now ~961 subjects, ~7,285 entities; standard screening would find ~961; Katharos maps remaining 87%.`;

  const critEmbed = await pc.inference.embed('multilingual-e5-large', [critText], {
    inputType: 'passage', truncate: 'END'
  });
  allVectors.push({
    id: 'expansion-batch-critical-findings',
    values: critEmbed.data[0].values,
    metadata: {
      name: 'Expansion Batch Critical Findings',
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
  const metaText = `Katharos Expansion Batch ${INVESTIGATION_ID}: 170 subjects, ~1,450 entities. CATEGORY BATCH 2 (70 subjects): ML-051–060 (Ye Gon precursor, Semenko SDN proxy, Windhorst/H2O, Fowler Oldfield gold, Ng Lap Seng, Iran CBI crypto, Klyushin/GRU, TD Bank cartel, Celsius/Mashinsky, Zhevago/Ferrexpo); IND-051–060 (Amnokgang DPRK IT, Garantex/Grinex, Huione $11B, Galaxy/LUNA, Goldman 1MDB, Binance post-CZ, Do Kwon trial, Ozy Media, KuCoin, Richard Heart HEX); FRD-051–060 (Outcome Health, GPB Capital Ponzi, Infinity Q Bloomberg, Nikola Motors, We Build the Wall, Luckin Coffee, HealthSouth, Enron, Archegos $36B, FTX political donations); RICO-051–060 (Sinaloa post-El Mayo, MS-13 FTO, Garcia Luna 38 years, Clan del Golfo, Los Zetas/CDN, Gambino, Ndrangheta $55B, CJNG FTO, Armenian Power Medicare, Yakuza SDN); AF-051–060 (KleptoCapture, FTX $7B recovery, CITGO, Silk Road pardon, OneCoin, Wirecard/Marsalek, Abraaj, Bitfinex $3.6B, GPB receiver, Syria post-Assad); CRT-051–060 (Los Chapitos, CDG West Africa, fentanyl precursors SDN, CJNG avocado, Sinaloa US ML, Houthi FTO, cartel crypto, Hamas, cartel FTO designations, Tren de Aragua); CF-051–060 (A7A5 $93B, Railgun, Bybit $1.5B, DMM $305M, WazirX $235M, Radiant $50M, SafeMoon, Mango Markets, Bitconnect, pig butchering). SDN BATCH 5 (100 subjects 310–409): Russia oligarchs/state (Alekperov/Lukoil, Guryev/PhosAgro, Usmanov GL-15, Prokhorov, Kolbin/Gazprom Neft, Bank Rossiya, Rosneft, Skolkovo, Tkachev agriculture, Minnikhanov/Tatarstan, Medvedev, Patrushev family, Gref/Sberbank, Surgutneftegas, Mordashov/Severstal, Kostin/VTB); Iran (IRISL aliases, Shahed-136 UAVs, IRGC-QF $3B crypto, Triliance, Shamkhani DOJ 2026, Hezbollah extended, Hamas extended, A.Q. Khan, RSF/Hemedti, Alex Saab cooperation); DPRK (Lazarus $2B 2025, weapons procurement, KKBC, diplomatic finance, Kimsuky, luxury goods, RGB, ship-to-ship, Mansudae construction, KNIC); Cartels (CJNG military, Sinaloa financial architecture, Gulf Cartel, FARC dissidents, CDG Europe, fentanyl US domestic, Aryan Brotherhood, Ndrangheta global, Cali successors, MS-13/Bukele, CJNG petroleum, CDN expanded, Trojan Shield, Hezbollah West Africa, darknet markets); Crypto (Tether compliance, Cryptex/PM2BTC, OKX settlement, Tornado Cash delisting, Genesis/DCG, ALPHV/BlackCat, Scattered Spider, Colonial Pipeline, REvil, Conti, Monero, mixer prosecutions, NFT fraud, Multichain collapse, Solana ecosystem); Sanctions evasion (Turkey, UAE, Kazakhstan, Armenia, Georgia, China semiconductors, Serbia, India, Panama Papers, Pandora Papers, MeritServus, golden passports, FTZ evasion, mBridge, SWIFT alternatives, Bout, Prigozhin, Kadyrov, Zolotov, Roldugin, Volozh, Navalny, Putin Palace, Nord Stream, Alfa Belarus, Gazprombank, Surgutneftegas, RT, MOEX/NSD, PSB, SMP Bank, Novatek/Arctic LNG 2). Coverage gap: ~87%.`;

  const metaEmbed = await pc.inference.embed('multilingual-e5-large', [metaText], {
    inputType: 'passage', truncate: 'END'
  });
  allVectors.push({
    id: 'expansion-batch-investigation-metadata',
    values: metaEmbed.data[0].values,
    metadata: {
      name: 'Expansion Batch Investigation Overview (170 subjects)',
      category: 'entity_investigation',
      investigation: INVESTIGATION_ID,
      source_tag: 'katharos-investigation',
      type_tag: 'investigation_metadata',
      text: metaText.substring(0, 1000),
      totalSubjects: String(subjects.length),
      totalEntities: String(totalEntities),
      riskLevel: 'CRITICAL',
      coverageGap: '87%',
      categories: 'ML, IND, FRD, RICO, AF, CRT, CF + RUSSIA, IRAN, DPRK, CARTELS, CRYPTO, EVASION',
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
  console.log('\nBreakdown:');
  for (const [cat, count] of Object.entries(catCounts).sort()) {
    console.log(`  ${cat}: ${count} entities`);
  }
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
