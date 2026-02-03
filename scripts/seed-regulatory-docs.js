#!/usr/bin/env node

/**
 * Seed Marlowe knowledge base into Pinecone RAG.
 * Covers: sanctions, AML typologies, fraud typologies, risk scoring,
 * transaction monitoring, data sources, and enforcement actions.
 *
 * Usage: PINECONE_API_KEY=... node scripts/seed-regulatory-docs.js
 */

const { RAGService } = require('../services/ragService');

// ========== SANCTIONS SCREENING (01) ==========
const SANCTIONS_CHUNKS = [
  {
    id: 'sanctions-ofac-sdn',
    text: 'OFAC SDN List. Source: US Treasury Department. Updated daily. Contains Specially Designated Nationals and blocked persons/entities. US persons are prohibited from any dealings with SDN-listed parties. Available in XML, CSV, JSON formats. OFAC Consolidated Sanctions list combines all programs (SDN, SSI, FSE) into a single searchable list.',
    metadata: { source: 'Marlowe KB', category: 'sanctions', title: 'OFAC SDN List' }
  },
  {
    id: 'sanctions-50pct-rule',
    text: 'The 50 Percent Rule (CRITICAL). Under OFAC guidance, any entity owned 50% or more (individually or in aggregate) by one or more SDN is itself considered blocked, even if not specifically listed. How to apply: 1) Identify all owners of target entity, 2) Check each owner against SDN list, 3) Calculate aggregate SDN ownership percentage, 4) If >= 50%, entity is blocked by operation of law. This applies recursively through ownership chains. Common evasion tactics: diluting ownership to 49.9%, using nominees, complex corporate structures across jurisdictions, trusts and foundations obscuring ownership. Example: If Oleg Deripaska (SDN) owns 60% of Company X, Company X is blocked even if not on SDN list.',
    metadata: { source: 'Marlowe KB', category: 'sanctions', title: '50 Percent Rule' }
  },
  {
    id: 'sanctions-match-confidence',
    text: 'Sanctions Match Confidence Assessment. Exact Match (95-100%): Name matches exactly, DOB matches, nationality matches, at least one identifier matches. High Confidence (85-94%): Name with minor variations, DOB matches, nationality consistent. Medium Confidence (70-84%): Name phonetically similar, some identifiers match, requires manual review. Low Confidence (<70%): Name similar but common, limited corroborating data, likely false positive.',
    metadata: { source: 'Marlowe KB', category: 'sanctions', title: 'Match Confidence Levels' }
  },
  {
    id: 'sanctions-lists-global',
    text: 'Global Sanctions Lists. UN Security Council: Global obligation for all UN member states. EU Consolidated List: EU persons prohibited from dealings. UK OFSI: UK persons prohibited from dealings. Secondary Sanctions: Non-US persons face secondary sanctions for significant transactions with SDNs, facilitating evasion, or providing material support to sanctioned parties. Sectors at risk: financial services, energy, defense, technology transfers.',
    metadata: { source: 'Marlowe KB', category: 'sanctions', title: 'Global Sanctions Lists' }
  },
  {
    id: 'sanctions-high-risk-jurisdictions',
    text: 'High-Risk Jurisdictions for Sanctions. FATF Blacklist (Highest Risk): North Korea (DPRK), Iran, Myanmar. Comprehensively Sanctioned: Russia (sectoral + individual), Belarus, Cuba, Venezuela, Syria. FATF Greylist: Pakistan, Nigeria, South Africa, Panama, Philippines, Vietnam, Jamaica, Haiti. Screening process: 1) Normalize name, 2) Search all lists (exact + fuzzy), 3) Review matches comparing identifiers, 4) Apply 50% Rule on ownership, 5) Document results with lists checked and confidence assessment.',
    metadata: { source: 'Marlowe KB', category: 'sanctions', title: 'High-Risk Jurisdictions' }
  },
];

// ========== AML TYPOLOGIES (03) ==========
const AML_CHUNKS = [
  {
    id: 'aml-overview-stages',
    text: 'Money laundering follows three stages: 1) PLACEMENT — Introducing illicit cash into the financial system. 2) LAYERING — Obscuring the trail through complex transactions. 3) INTEGRATION — Reintroducing "clean" money into legitimate economy.',
    metadata: { source: 'Marlowe KB', category: 'aml', title: 'ML Three Stages' }
  },
  {
    id: 'aml-structuring',
    text: 'Structuring (Smurfing). Stage: Placement. Risk Score: +40. Breaking large cash amounts into smaller deposits below reporting thresholds. Thresholds: USA $10K, EU €10K, UK £10K, Australia/Canada $10K. Indicators: Multiple deposits $9,000-$9,999 within 24-48 hours, same depositor multiple accounts/branches, multiple depositors same beneficiary, deposits timed to avoid aggregation, customer aware of thresholds.',
    metadata: { source: 'Marlowe KB', category: 'aml', typology: 'structuring', title: 'Structuring/Smurfing' }
  },
  {
    id: 'aml-cash-intensive',
    text: 'Cash-Intensive Business Laundering. Stage: Placement. Risk Score: +35. High-Risk Businesses: restaurants, bars, car washes, parking lots, laundromats, convenience stores, casinos, check cashing. Indicators: revenue inconsistent with capacity, cash deposits disproportionate to card sales, consistent daily deposits (too consistent), no seasonal variation.',
    metadata: { source: 'Marlowe KB', category: 'aml', typology: 'cash_business', title: 'Cash-Intensive Business Laundering' }
  },
  {
    id: 'aml-shell-company',
    text: 'Shell Company Layering. Stage: Layering. Risk Score: +45. Entity Red Flags: no physical office (registered agent only), no employees or website, generic description ("consulting", "trading"), bearer shares or nominee shareholders, recently incorporated with immediate high volume, ownership by another shell company. Secrecy Jurisdictions Tier 1: BVI, Cayman, Panama, Seychelles, Belize, Nevis, Samoa, Vanuatu, Marshall Islands. Tier 2: Delaware, Nevada, Wyoming, Jersey, Guernsey, Isle of Man, Liechtenstein. Transaction Red Flags: payments for undefined "services", loans with no repayment terms, circular transactions (A→B→C→A).',
    metadata: { source: 'Marlowe KB', category: 'aml', typology: 'shell_company', title: 'Shell Company Layering' }
  },
  {
    id: 'aml-layered-ownership',
    text: 'Layered Ownership Structures. Stage: Layering. Risk Score: +40. Indicators: ownership chain exceeds 3 layers, multiple jurisdictions in chain, trust holds company holds trust, foundation as owner, ownership at 24.9% (avoids disclosure).',
    metadata: { source: 'Marlowe KB', category: 'aml', typology: 'layered_ownership', title: 'Layered Ownership' }
  },
  {
    id: 'aml-tbml',
    text: 'Trade-Based Money Laundering (TBML). Over-Invoicing (Risk +40): Invoice price significantly above market, luxury goods at extreme premiums, IP licenses at inflated rates. Under-Invoicing (Risk +40): Invoice price below market/manufacturing cost, declared value inconsistent with shipping costs. Phantom Shipments (Risk +45): Payment without bill of lading, no customs records, Free Trade Zone transactions without inspection. Black Market Peso Exchange (Risk +50): US cash buys goods for Latin America export, third-party payments for imports, broker arranges payment from unrelated party.',
    metadata: { source: 'Marlowe KB', category: 'aml', typology: 'tbml', title: 'Trade-Based Money Laundering' }
  },
  {
    id: 'aml-real-estate',
    text: 'Real Estate Money Laundering. All-Cash Purchases (Risk +40): Full purchase price in cash, buyer income doesn\'t support purchase, source of funds unclear. Anonymous Purchases via LLCs (Risk +35): High-risk markets: Miami, NYC, LA, London, Vancouver, Dubai, Singapore. Recently formed LLC purchaser, multiple properties owned by related LLCs. Rapid Flipping (Risk +35): Property resold within 6 months, significant price change without improvements, related party transactions.',
    metadata: { source: 'Marlowe KB', category: 'aml', typology: 'real_estate', title: 'Real Estate ML' }
  },
  {
    id: 'aml-correspondent-banking',
    text: 'Correspondent Banking Abuse. Risk Score: +45. Indicators: nested accounts, payable-through accounts, lack of originator/beneficiary info. Wire Stripping (Risk +45): Incomplete originator information, beneficiary info missing, cover payments lacking detail. Private Banking Abuse (Risk +40): PEP with unexplained wealth, numbered accounts, hold mail requests, power of attorney to third party.',
    metadata: { source: 'Marlowe KB', category: 'aml', typology: 'correspondent_banking', title: 'Correspondent Banking Abuse' }
  },
  {
    id: 'aml-hawala-msb',
    text: 'Hawala / Informal Value Transfer Systems. Risk Score: +45. High-Risk Corridors: Middle East, South Asia, East Africa, Southeast Asia. Indicators: cash to local broker received from distant broker, no formal banking, settlement through trade or reverse transactions, coded messages. MSB Nesting (Risk +40): sub-agents not disclosed, volume exceeds licensed capacity, geographic spread inconsistent with license.',
    metadata: { source: 'Marlowe KB', category: 'aml', typology: 'hawala', title: 'Hawala/IVTS' }
  },
  {
    id: 'aml-crypto',
    text: 'Cryptocurrency Money Laundering. Mixing/Tumbling (Risk +50): Known mixers — Tornado Cash (sanctioned), Blender.io (sanctioned), ChipMixer, Wasabi Wallet, Samourai Whirlpool. Indicators: transactions with known mixer addresses, time delay between deposit and withdrawal, multiple small outputs. Chain Hopping (Risk +40): BTC→ETH→stablecoin→BTC, DEX usage, bridge protocols, privacy coin as intermediate. Peel Chain (Risk +40): Chain of wallets with decreasing balances, multiple endpoints receive small amounts, new wallets for each hop. Privacy Coins (Risk +45): Monero (XMR), Zcash (ZEC), Dash, Grin, Beam.',
    metadata: { source: 'Marlowe KB', category: 'aml', typology: 'crypto', title: 'Crypto ML Patterns' }
  },
  {
    id: 'aml-corruption-pep',
    text: 'Corruption & PEP Laundering. Bribery & Kickbacks (Risk +50): Payments to government officials or family, consulting fees to connected persons, success fees tied to government decisions, payments through intermediaries. PEP Wealth Concealment (Risk +45): Wealth inconsistent with official salary, assets through family members, offshore structures, luxury real estate in foreign markets, golden visas.',
    metadata: { source: 'Marlowe KB', category: 'aml', typology: 'corruption', title: 'Corruption & PEP' }
  },
  {
    id: 'aml-sanctions-evasion',
    text: 'Sanctions Evasion Typologies. Front Companies (Risk +55): Company formed after sanctions designation, same address as sanctioned entity, former employees, trading same goods/services. Ship-to-Ship Transfers (Risk +50): AIS transponder off, meeting at sea, flag/name changes, documents showing false origin. False Documentation (Risk +50): Certificates of origin from third countries, bills of lading with false port, transshipment through non-sanctioned countries.',
    metadata: { source: 'Marlowe KB', category: 'aml', typology: 'sanctions_evasion', title: 'Sanctions Evasion Methods' }
  },
  {
    id: 'aml-terrorism-financing',
    text: 'Terrorism Financing. NPO/Charity Abuse (Risk +50): Charity in conflict zone, funds diverted from charitable purpose, donors are designated persons, cash-based operations. Hawala for Terrorism (Risk +50): Transfers to conflict zones, transactions with designated persons, "humanitarian" funds to high-risk areas.',
    metadata: { source: 'Marlowe KB', category: 'aml', typology: 'terrorism_financing', title: 'Terrorism Financing' }
  },
];

// ========== FRAUD TYPOLOGIES (04) ==========
const FRAUD_CHUNKS = [
  {
    id: 'fraud-financial-statement',
    text: 'Financial Statement Fraud. Revenue Recognition Fraud (Risk +45): Schemes include premature revenue, bill-and-hold, channel stuffing, round-tripping, fictitious sales. Financial red flags: revenue growth outpacing cash flow, DSO increasing, revenue spikes at quarter/year end, large credit memos after period close. Expense Manipulation (Risk +40): Improper capitalization, extended depreciation, understated reserves. Asset Overstatement (Risk +40): Inventory growing faster than sales, receivables growing faster than sales, aging worsening.',
    metadata: { source: 'Marlowe KB', category: 'fraud', typology: 'financial_statement', title: 'Financial Statement Fraud' }
  },
  {
    id: 'fraud-asset-misappropriation',
    text: 'Asset Misappropriation. Cash Theft — Skimming, Lapping, Larceny (Risk +35): Sales below expectations, customer complaints of unrecorded payments, register shortages, reluctance to take vacation, bank reconciliation discrepancies. Fraudulent Disbursements (Risk +40): Billing scheme indicators — vendors with PO Box only, vendor address matches employee, invoices just below approval threshold, sequential invoice numbers, single approver. Payroll scheme indicators — employees with same address/bank, terminated employees still paid, direct deposit to prepaid cards.',
    metadata: { source: 'Marlowe KB', category: 'fraud', typology: 'asset_misappropriation', title: 'Asset Misappropriation' }
  },
  {
    id: 'fraud-corruption-bribery',
    text: 'Corruption & Bribery Fraud. Bribery (Risk +50, CRITICAL): High-risk jurisdictions: Somalia, South Sudan, Syria, Venezuela, North Korea, Afghanistan, Libya, Haiti, Cambodia, Myanmar. Payment red flags: payments to government officials or family, success fees tied to government decisions, payments through intermediaries, cash payments in high-corruption countries. Contract red flags: single-source without justification, awards without competitive bidding, agent commissions above market. Kickbacks (Risk +45): Vendor selected despite higher prices, employee owns vendor, change orders increasing payment, lifestyle inconsistent with salary.',
    metadata: { source: 'Marlowe KB', category: 'fraud', typology: 'corruption', title: 'Corruption & Bribery Fraud' }
  },
  {
    id: 'fraud-banking-lending',
    text: 'Banking & Lending Fraud. Loan Fraud (Risk +45): Income inconsistent with tax returns, employment unverifiable, bank statements altered, multiple applications in short period, collateral previously pledged. Mortgage Fraud (Risk +45): For housing — occupancy fraud, income fraud, down payment fraud. For profit — property flipping, equity skimming, foreclosure rescue, short sale fraud. Check Kiting: circular deposits, withdrawals before clearing. Account Takeover: contact info changed, login from unusual locations, large transactions after profile change.',
    metadata: { source: 'Marlowe KB', category: 'fraud', typology: 'banking', title: 'Banking & Lending Fraud' }
  },
  {
    id: 'fraud-insurance',
    text: 'Insurance Fraud. Claims Fraud (Risk +40): Staged accidents — multiple claimants from same accident, all treated by same provider, soft tissue injuries only, prior similar claims. Arson — financial difficulties before fire, recent coverage increase, valuables removed, multiple points of origin. Provider Fraud (Risk +45): Unbundling, upcoding, phantom billing, duplicate billing. Services billed on impossible dates, volume exceeds capacity, all patients receive same treatments.',
    metadata: { source: 'Marlowe KB', category: 'fraud', typology: 'insurance', title: 'Insurance Fraud' }
  },
  {
    id: 'fraud-securities',
    text: 'Securities Fraud. Ponzi Schemes (Risk +50, CRITICAL): Consistent returns regardless of market, returns too good to be true, no independent custodian/auditor, difficulty withdrawing, affinity fraud targeting specific groups. Pump and Dump (Risk +45): Unsolicited stock tips, unusual volume in thin stock, price increase without news, insider selling during promotion. Insider Trading (Risk +50, CRITICAL): Large trades before announcements, options trades before news, new positions just before news. Market Manipulation (Risk +45): Spoofing, wash trading, marking the close, front running.',
    metadata: { source: 'Marlowe KB', category: 'fraud', typology: 'securities', title: 'Securities Fraud' }
  },
  {
    id: 'fraud-procurement',
    text: 'Procurement Fraud. Bid Rigging (Risk +50, CRITICAL): Same companies always bid together, rotation of winners, losing bids similar to winner, bids from same location, losing bidders subcontract with winners. Shell Vendor Schemes (Risk +45): Vendor setup red flags — PO Box only, cell phone, free email, no website, recently incorporated, address matches employee. Invoice red flags — just below approval threshold, vague services, sequential numbers, round dollar amounts.',
    metadata: { source: 'Marlowe KB', category: 'fraud', typology: 'procurement', title: 'Procurement Fraud' }
  },
  {
    id: 'fraud-identity-cyber',
    text: 'Identity & Cyber Fraud. Business Email Compromise/BEC (Risk +45): Lookalike domain, reply-to different from sender, request to bypass approval, urgency tied to executive travel, request to change vendor payment details. Synthetic Identity (Risk +45): SSN not issued to applicant or recently issued, credit profile recently established, address is mail drop, bust-out pattern after credit built. Account Takeover (Risk +40): Login from new device/location, password/contact info changed, large transactions after profile change.',
    metadata: { source: 'Marlowe KB', category: 'fraud', typology: 'identity_cyber', title: 'Identity & Cyber Fraud' }
  },
  {
    id: 'fraud-crypto',
    text: 'Cryptocurrency Fraud. Rug Pulls (Risk +50, CRITICAL): Anonymous team, no working product, heavy marketing light substance, admin can drain liquidity, team holds large token percentage. Crypto Pump and Dump (Risk +45): Coordinated social media, Telegram pump groups, sudden volume spike, whale selling during promotion. Investment Fraud (Risk +50, CRITICAL): Guaranteed returns, celebrity endorsements (often fake), difficulty withdrawing, "tax" required to access funds, romance scam pattern.',
    metadata: { source: 'Marlowe KB', category: 'fraud', typology: 'crypto_fraud', title: 'Cryptocurrency Fraud' }
  },
];

// ========== RISK SCORING (05) ==========
const RISK_SCORING_CHUNKS = [
  {
    id: 'risk-sanctions-scoring',
    text: 'Sanctions Risk Scoring. OFAC SDN exact match: 100 (BLOCK). OFAC SDN fuzzy match ≥95%: 90 (CRITICAL). OFAC SDN fuzzy 85-94%: 70 (CRITICAL). UN Security Council: 80 (CRITICAL). EU Consolidated: 75 (CRITICAL). UK OFSI: 75 (CRITICAL). OFAC 50% Rule applies: 100 (BLOCK). OFAC Sectoral/SSI: 60 (HIGH). World Bank Debarment: 25 (MEDIUM). INTERPOL Red Notice: 40 (HIGH). Sanctions scores take highest match only (no stacking).',
    metadata: { source: 'Marlowe KB', category: 'risk_scoring', title: 'Sanctions Scoring' }
  },
  {
    id: 'risk-pep-scoring',
    text: 'PEP Risk Scoring. Current head of state: 50 (HIGH). Current cabinet minister: 45 (HIGH). Current senior military/law enforcement: 40 (HIGH). Current legislator: 35 (HIGH). Current central bank governor: 40 (HIGH). Former official <2 years: 30 (MEDIUM). Former 2-5 years: 20. Former >5 years: 10 (LOW). Family member of current PEP: 30 (MEDIUM). Close associate: 25 (MEDIUM). Take highest position only.',
    metadata: { source: 'Marlowe KB', category: 'risk_scoring', title: 'PEP Scoring' }
  },
  {
    id: 'risk-criminal-scoring',
    text: 'Criminal/Enforcement Risk Scoring. Criminal conviction: 60 (CRITICAL). Criminal charges pending: 50 (HIGH). Criminal defendant open case: 40 (HIGH). SEC enforcement action: 40 (HIGH). DOJ enforcement action: 40 (HIGH). FTC/CFPB enforcement: 30 (MEDIUM). Civil fraud defendant: 25 (MEDIUM). RICO defendant: 35 (HIGH). Bankruptcy: 15 (LOW).',
    metadata: { source: 'Marlowe KB', category: 'risk_scoring', title: 'Criminal/Enforcement Scoring' }
  },
  {
    id: 'risk-corporate-scoring',
    text: 'Corporate Structure Risk Scoring. Bearer shares: 25 (MEDIUM). Ownership via Tier 1 secrecy jurisdiction: 20 (MEDIUM). Tier 2 secrecy: 10. 4+ layers in ownership chain: 15. Nominee directors: 15. Trust in chain: 15. Foundation in chain: 20. Formation agent address only: 10. Company <2 years old: 10. Recent ownership change: 10. Corporate structure score capped at 50.',
    metadata: { source: 'Marlowe KB', category: 'risk_scoring', title: 'Corporate Structure Scoring' }
  },
  {
    id: 'risk-aggregation',
    text: 'Risk Score Aggregation. Sanctions and criminal are NOT capped. Other categories (PEP, corporate, media, geographic, crypto) capped collectively at 60. Final score = min(uncapped + capped, 100). Risk Levels: 0-25 LOW (standard DD), 26-50 MEDIUM (enhanced DD), 51-75 HIGH (senior approval required), 76-99 CRITICAL (recommend decline), 100 BLOCKED (prohibited party). Adverse media capped at 50. Geographic scoring: FATF Blacklist +30, comprehensively sanctioned +30, FATF Greylist +20, tax haven +10.',
    metadata: { source: 'Marlowe KB', category: 'risk_scoring', title: 'Score Aggregation Rules' }
  },
  {
    id: 'risk-crypto-scoring',
    text: 'Cryptocurrency Risk Scoring. OFAC sanctioned wallet: 100 (BLOCK). Transacted with sanctioned address: 50 (CRITICAL). Mixer/tumbler interaction: 40 (HIGH). Privacy coin transactions: 15 (MEDIUM). High-risk exchange usage: 20 (MEDIUM). New wallet <30 days: 10 (LOW). Dormant reactivation: 10 (LOW).',
    metadata: { source: 'Marlowe KB', category: 'risk_scoring', title: 'Crypto Risk Scoring' }
  },
];

// ========== TRANSACTION MONITORING (06) ==========
const TM_CHUNKS = [
  {
    id: 'tm-structuring-rules',
    text: 'Transaction Monitoring — Structuring Rules. STR-001 Single Day Structuring: Multiple cash deposits $3K-$9,999 totaling ≥$10K in 24 hours. Base Score 40. Modifiers: amount variance <$500 (+15), multiple branches (+10), account age <90 days (+10). STR-002 Multi-Day: 3+ deposits $5K-$9,999 totaling ≥$25K over 10 days. Base 45. STR-003 Coordinated: 3+ different depositors to same account ≥$15K in 24 hours. Score 60 (CRITICAL).',
    metadata: { source: 'Marlowe KB', category: 'transaction_monitoring', title: 'Structuring Rules' }
  },
  {
    id: 'tm-velocity-rules',
    text: 'Transaction Monitoring — Velocity Rules. VEL-001 Unusual Volume: Daily volume exceeds 3 standard deviations or 5x baseline. Base 25. VEL-002 Rapid Movement: 80%+ inbound sent out within 24 hours. Base 45. Time gap <1hr (+20), <4hrs (+10), different beneficiary (+15), international (+10). VEL-003 Dormant Reactivation: Activity after 180+ days dormancy. Base 40. VEL-004 Velocity Spike: Transaction count 5x+ daily average. Base 30.',
    metadata: { source: 'Marlowe KB', category: 'transaction_monitoring', title: 'Velocity Rules' }
  },
  {
    id: 'tm-geographic-rules',
    text: 'Transaction Monitoring — Geographic Rules. GEO-001 High-Risk Country: FATF Blacklist (North Korea, Iran, Myanmar) score 70 CRITICAL. Sanctioned (Russia, Belarus, Cuba, Venezuela, Syria) score 70 CRITICAL. FATF Greylist score 40 HIGH. Tax Havens (BVI, Cayman, Panama, Seychelles, Jersey, etc.) score 25 MEDIUM. GEO-002 Unusual Geography: Transaction to country not in pattern, base 20. GEO-003 Geographic Layering: Funds through 3+ countries within 72 hours, base 45.',
    metadata: { source: 'Marlowe KB', category: 'transaction_monitoring', title: 'Geographic Rules' }
  },
  {
    id: 'tm-counterparty-rules',
    text: 'Transaction Monitoring — Counterparty Rules. CTY-001 Sanctioned Party: Score 100 AUTOMATIC BLOCK. CTY-002 PEP Transaction ≥$10K: Current official 45, former 30, family 30, associate 20. CTY-003 Adverse Media: Transaction ≥$25K with counterparty having negative news, base 35. CTY-004 New Counterparty Large: ≥$50K with first-time counterparty, base 25.',
    metadata: { source: 'Marlowe KB', category: 'transaction_monitoring', title: 'Counterparty Rules' }
  },
  {
    id: 'tm-behavioral-rules',
    text: 'Transaction Monitoring — Behavioral Rules. BEH-001 Outside Business Hours: 50%+ large transactions outside hours, base 15. BEH-002 Rounding Patterns: 70%+ round numbers, base 25. BEH-003 Inconsistent Purpose: Purpose doesn\'t match profile, base 20. BEH-004 Funnel Account: 10+ inbound sources, ≤3 outbound destinations, 80%+ to single destination, base 50. BEH-005 Pass-Through: Keeps <10% of inbound over 7 days, base 45.',
    metadata: { source: 'Marlowe KB', category: 'transaction_monitoring', title: 'Behavioral Rules' }
  },
  {
    id: 'tm-crypto-rules',
    text: 'Transaction Monitoring — Crypto Rules. CRY-001 Mixer Interaction: Transaction with known mixer address (Tornado Cash sanctioned, Blender.io sanctioned, ChipMixer, Wasabi Wallet), score 70 CRITICAL. CRY-002 Sanctioned Wallet: Score 100 AUTOMATIC BLOCK. CRY-003 Peel Chain: 3+ sequential transactions peeling ≤20%, base 45. CRY-004 Privacy Coin: Conversion to/from Monero, Zcash, Dash, score 40.',
    metadata: { source: 'Marlowe KB', category: 'transaction_monitoring', title: 'Crypto Detection Rules' }
  },
  {
    id: 'tm-network-rules',
    text: 'Transaction Monitoring — Network Analysis. NET-001 High-Risk Connection: Entity connected to party with risk score ≥70 within 2 degrees, base 35. Direct connection +15, indirect +5, sanctioned +30. NET-002 Circular Transactions: Funds return to originator within 5 hops, score 60 CRITICAL. Alert Priority: ≥80 or CRITICAL = P1 (4hr SLA), ≥50 HIGH = P2 (24hr), ≥30 MEDIUM = P3 (48hr), <30 = P4 (5 days).',
    metadata: { source: 'Marlowe KB', category: 'transaction_monitoring', title: 'Network Analysis Rules' }
  },
];

// ========== DATA SOURCES (02) ==========
const DATA_SOURCE_CHUNKS = [
  {
    id: 'ds-sanctions-apis',
    text: 'Sanctions Data Sources. OFAC SDN: treasury.gov/ofac/downloads, daily updates, no auth required. OpenSanctions API: api.opensanctions.org, 1000 req/month free, covers OFAC + UN + EU + UK + 100 other lists. World Bank Debarment: worldbank.org/debarred-firms, no auth.',
    metadata: { source: 'Marlowe KB', category: 'data_sources', title: 'Sanctions APIs' }
  },
  {
    id: 'ds-corporate-registries',
    text: 'Corporate Registry Data Sources. UK Companies House: REST API at api.company-information.service.gov.uk, Streaming API. Endpoints: company search, officers, PSC (persons with significant control), filing history, charges, insolvency, disqualified officers. Free API key, 600 requests/5min. OpenCorporates: api.opencorporates.com, 500 req/month free, 200M+ companies globally. SEC EDGAR: Public company filings, beneficial ownership (13D/13G), insider transactions.',
    metadata: { source: 'Marlowe KB', category: 'data_sources', title: 'Corporate Registries' }
  },
  {
    id: 'ds-leaked-databases',
    text: 'Leaked Database Sources. ICIJ Offshore Leaks: offshoreleaks.icij.org. Contains Panama Papers (2016), Paradise Papers (2017), Pandora Papers (2021), Offshore Leaks (2013), Bahamas Leaks (2016). No auth required. Risk Score: +25-30 for any match. OCCRP Aleph: aleph.occrp.org. Contains all ICIJ leaks + corporate registries + court records + investigative journalism data + sanctions lists. Free API key.',
    metadata: { source: 'Marlowe KB', category: 'data_sources', title: 'Leaked Databases' }
  },
  {
    id: 'ds-court-media',
    text: 'Court Records & Media Sources. CourtListener (US Federal): courtlistener.com API. Search dockets by party name, opinions by keyword. Free API key. GDELT (Global News): api.gdeltproject.org, 2B+ articles, 65+ languages, unlimited rate. Risk search queries should include: "{name}" fraud, money laundering, sanctions, indicted, corruption, investigation, convicted.',
    metadata: { source: 'Marlowe KB', category: 'data_sources', title: 'Court Records & Media' }
  },
  {
    id: 'ds-crypto-pep',
    text: 'Crypto & PEP Data Sources. OFAC sanctioned wallets included in SDN list with "Digital Currency Address" identifier. Sanctioned services: Tornado Cash, Blender.io, Garantex, Suex, Hydra Market. Blockchain explorers: Etherscan (5 calls/sec free), Blockchair (1440/day free), blockchain.info. PEP sources: Every Politician, Wikidata SPARQL, CIA World Leaders.',
    metadata: { source: 'Marlowe KB', category: 'data_sources', title: 'Crypto & PEP Sources' }
  },
];

// ========== ENFORCEMENT ACTIONS ==========
const ENFORCEMENT_ACTIONS = [
  {
    id: 'enforce-deutsche-bank-mirror-trading',
    text: 'Deutsche Bank Mirror Trading Scheme (2017). $630M combined penalties (US DOJ $425M, UK FCA £163M). Russian clients used mirror trades to move $10 billion out of Russia. Clients would buy Russian securities through Deutsche Bank Moscow in rubles, then simultaneously sell identical securities through Deutsche Bank London in USD/GBP. The scheme exploited gaps in Deutsche Bank\'s AML controls and transaction monitoring across jurisdictions.',
    metadata: { source: 'DOJ/FCA', docType: 'enforcement', agency: 'DOJ', entityName: 'Deutsche Bank AG', penaltyAmount: 630000000, year: 2017, title: 'Mirror Trading Scheme' }
  },
  {
    id: 'enforce-danske-bank-estonia',
    text: 'Danske Bank Estonia Branch Scandal (2018-2022). Approximately €200 billion in suspicious transactions flowed through Danske Bank\'s Estonian branch between 2007-2015. Non-resident customers, primarily from Russia and former Soviet states, used the branch for suspicious transactions. Failures included: inadequate KYC, no beneficial ownership verification, ignored whistleblower warnings, and regulatory arbitrage between Danish and Estonian regulators. Resulted in $2B DOJ settlement (2022).',
    metadata: { source: 'DOJ', docType: 'enforcement', agency: 'DOJ', entityName: 'Danske Bank', penaltyAmount: 2000000000, year: 2022, title: 'Estonia Branch Money Laundering' }
  },
  {
    id: 'enforce-hsbc-mexico',
    text: 'HSBC Mexico Money Laundering (2012). $1.9 billion settlement with DOJ. HSBC failed to monitor over $670 billion in wire transfers and over $9.4 billion in purchases of US currency from HSBC Mexico. Drug traffickers used HSBC Mexico to launder proceeds, including Sinaloa cartel. Bank provided correspondent banking services to banks in jurisdictions of primary money laundering concern including Iran, Libya, Sudan, Burma.',
    metadata: { source: 'DOJ', docType: 'enforcement', agency: 'DOJ', entityName: 'HSBC', penaltyAmount: 1900000000, year: 2012, title: 'Mexico Drug Money Laundering' }
  },
  {
    id: 'enforce-bnp-paribas-sanctions',
    text: 'BNP Paribas Sanctions Violations (2014). $8.9 billion penalty — largest sanctions-related fine in history. BNP processed billions in transactions through the US financial system on behalf of Sudanese, Iranian, and Cuban sanctioned parties. Bank deliberately concealed the origin of transactions by stripping wire transfer messages of references to sanctioned entities. Compliance staff were aware but pressured to continue.',
    metadata: { source: 'DOJ', docType: 'enforcement', agency: 'DOJ', entityName: 'BNP Paribas', penaltyAmount: 8900000000, year: 2014, title: 'Sanctions Violations' }
  },
  {
    id: 'enforce-wirecard-fraud',
    text: 'Wirecard Accounting Fraud (2020). €1.9 billion in cash balances did not exist. German payment processor fabricated revenue from third-party acquiring partners in Asia. Auditor EY failed to independently verify bank confirmations for years. CEO Markus Braun arrested, COO Jan Marsalek fled and is fugitive. Exposed failures in German financial supervision (BaFin).',
    metadata: { source: 'German Prosecutors', docType: 'enforcement', agency: 'BaFin', entityName: 'Wirecard AG', penaltyAmount: 0, year: 2020, title: 'Accounting Fraud' }
  },
  {
    id: 'enforce-1mdb-goldman',
    text: '1MDB Goldman Sachs (2020). Goldman Sachs paid $2.9 billion to settle charges related to 1Malaysia Development Berhad (1MDB) scandal. Goldman arranged three bond offerings that raised $6.5 billion for 1MDB, of which $2.7 billion was misappropriated by Jho Low and associates. Former Goldman partner Tim Leissner pled guilty to conspiracy. Funds used for luxury real estate, art, yachts, and financing "The Wolf of Wall Street."',
    metadata: { source: 'DOJ', docType: 'enforcement', agency: 'DOJ', entityName: 'Goldman Sachs', penaltyAmount: 2900000000, year: 2020, title: '1MDB Bond Fraud' }
  },
  {
    id: 'enforce-binance-aml',
    text: 'Binance AML Failures (2023). $4.3 billion settlement with DOJ, FinCEN, OFAC, and CFTC. CEO Changpeng Zhao (CZ) pled guilty and resigned. Binance processed transactions for sanctioned jurisdictions including Iran, Cuba, Syria. Failed to register as money transmitter in US. Allowed users to circumvent KYC requirements. Processed transactions for Hamas, al-Qaeda, and ISIS-affiliated groups.',
    metadata: { source: 'DOJ/FinCEN', docType: 'enforcement', agency: 'DOJ', entityName: 'Binance', penaltyAmount: 4300000000, year: 2023, title: 'AML/Sanctions Failures' }
  },
  {
    id: 'enforce-td-bank-aml',
    text: 'TD Bank AML Failures (2024). $3.09 billion in penalties from DOJ and FinCEN. TD Bank failed to monitor $18.3 trillion in customer transactions. Bank employees facilitated money laundering by drug trafficking networks. AML program was deliberately under-resourced — bank set internal budget caps that limited monitoring capabilities. Three separate criminal networks laundered over $670 million through TD Bank accounts.',
    metadata: { source: 'DOJ/FinCEN', docType: 'enforcement', agency: 'DOJ', entityName: 'TD Bank', penaltyAmount: 3090000000, year: 2024, title: 'AML Program Failures' }
  },
  {
    id: 'enforce-standard-chartered',
    text: 'Standard Chartered Sanctions Violations (2019). $1.1 billion combined penalties from DOJ, OFAC, NY DFS, FCA. Bank processed transactions for Iranian, Sudanese, Libyan, and Myanmar entities in violation of US sanctions. Concealed approximately 60,000 transactions totaling $240 billion. Wire stripping — removing originator information that would reveal sanctioned party involvement. Second major sanctions penalty after $667M in 2012.',
    metadata: { source: 'DOJ/OFAC', docType: 'enforcement', agency: 'DOJ', entityName: 'Standard Chartered', penaltyAmount: 1100000000, year: 2019, title: 'Sanctions Violations' }
  },
  {
    id: 'enforce-swedbank-aml',
    text: 'Swedbank AML Failures (2020). $400M penalty from NY DFS and Swedish FSA. Swedbank\'s Estonian branch processed suspicious transactions totaling approximately $37 billion from 2014-2019. Many of the same Russian clients as Danske Bank. CEO fired for misleading statements. Bank failed to disclose known compliance deficiencies to regulators.',
    metadata: { source: 'NY DFS', docType: 'enforcement', agency: 'NY DFS', entityName: 'Swedbank', penaltyAmount: 400000000, year: 2020, title: 'Baltic AML Failures' }
  },
  {
    id: 'enforce-wachovia-drug',
    text: 'Wachovia Bank Drug Money Laundering (2010). $160M settlement. Wachovia failed to apply AML controls to $378.4 billion in transactions from Mexican exchange houses (casas de cambio) between 2004-2007. Mexican drug cartels used Wachovia to launder narcotics proceeds. Traveler\'s checks from Mexico with no AML review. Bank lacked adequate transaction monitoring systems.',
    metadata: { source: 'DOJ', docType: 'enforcement', agency: 'DOJ', entityName: 'Wachovia', penaltyAmount: 160000000, year: 2010, title: 'Drug Money Laundering' }
  },
  {
    id: 'enforce-crypto-ftx',
    text: 'FTX Cryptocurrency Fraud (2022-2023). Founder Sam Bankman-Fried convicted of fraud and sentenced to 25 years. FTX misappropriated billions in customer deposits to fund sister hedge fund Alameda Research. $8 billion in customer funds missing. Commingled customer and corporate funds. No independent board or proper financial controls. Celebrity endorsements used to attract retail investors.',
    metadata: { source: 'DOJ', docType: 'enforcement', agency: 'DOJ', entityName: 'FTX', penaltyAmount: 0, year: 2023, title: 'Crypto Exchange Fraud' }
  },
];

// ========== SYSTEM PROMPT / METHODOLOGY ==========
const METHODOLOGY_CHUNKS = [
  {
    id: 'methodology-8-layers',
    text: 'Marlowe Investigation Methodology — 8 Layers. For every screening: 1) IDENTIFICATION — full legal name, aliases, DOB, nationality, unique identifiers. 2) SANCTIONS — OFAC SDN, UN, EU, UK, 50% Rule. 3) PEP STATUS — current/former positions, family, associates, source of wealth. 4) CORPORATE STRUCTURE — trace to UBO, shell company indicators, secrecy jurisdictions. 5) LITIGATION — criminal cases, SEC/DOJ enforcement, civil fraud. 6) ADVERSE MEDIA — criminal allegations, investigations, fraud/corruption/ML mentions. 7) CRYPTOCURRENCY — sanctioned wallets, mixers, privacy coins. 8) NETWORK ANALYSIS — business partners, shared directorships, links to sanctioned parties.',
    metadata: { source: 'Marlowe KB', category: 'methodology', title: 'Investigation Methodology' }
  },
  {
    id: 'methodology-risk-levels',
    text: 'Risk Level Recommendations. 0-25 LOW: Standard due diligence sufficient. 26-50 MEDIUM: Enhanced due diligence recommended. 51-75 HIGH: Senior approval required, enhanced monitoring. 76-99 CRITICAL: Recommend decline unless compelling justification. 100 BLOCKED: Prohibited party, no business permitted. Critical rules: never clear without checking sources, disambiguate using DOB/nationality/identifiers, apply 50% Rule, prioritize primary sources, date all information, document match/no-match reasoning, when in doubt escalate.',
    metadata: { source: 'Marlowe KB', category: 'methodology', title: 'Risk Levels & Recommendations' }
  },
];

async function seed() {
  const rag = new RAGService();

  const sections = [
    { name: 'Sanctions Screening', namespace: 'regulatory_docs', docs: SANCTIONS_CHUNKS },
    { name: 'AML Typologies', namespace: 'regulatory_docs', docs: AML_CHUNKS },
    { name: 'Fraud Typologies', namespace: 'regulatory_docs', docs: FRAUD_CHUNKS },
    { name: 'Risk Scoring', namespace: 'regulatory_docs', docs: RISK_SCORING_CHUNKS },
    { name: 'Transaction Monitoring', namespace: 'regulatory_docs', docs: TM_CHUNKS },
    { name: 'Data Sources', namespace: 'regulatory_docs', docs: DATA_SOURCE_CHUNKS },
    { name: 'Methodology', namespace: 'regulatory_docs', docs: METHODOLOGY_CHUNKS },
    { name: 'Enforcement Actions', namespace: 'enforcement_actions', docs: ENFORCEMENT_ACTIONS },
  ];

  let total = 0;
  let failed = 0;

  for (const section of sections) {
    console.log(`\nSeeding ${section.name} (${section.docs.length} chunks)...`);
    for (const doc of section.docs) {
      try {
        await rag.index(section.namespace, doc.id, doc.text, doc.metadata);
        console.log(`  ✓ ${doc.id}`);
        total++;
      } catch (err) {
        console.error(`  ✗ ${doc.id}: ${err.message}`);
        failed++;
      }
    }
  }

  const totalDocs = sections.reduce((s, sec) => s + sec.docs.length, 0);
  console.log(`\nDone! Seeded ${total}/${totalDocs} chunks. ${failed} failed.`);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
