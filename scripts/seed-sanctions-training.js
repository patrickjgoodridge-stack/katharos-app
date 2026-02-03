#!/usr/bin/env node

/**
 * Seed Marlowe RAG with comprehensive sanctions compliance training data.
 * Covers: sanctions governance, frameworks, evasion techniques, compliance programs,
 * screening, investigations, asset freezing, licensing, and delisting.
 *
 * Usage: node -r dotenv/config scripts/seed-sanctions-training.js
 */

const { RAGService } = require('../services/ragService');

const CHUNKS = [
  // ===== SANCTIONS FUNDAMENTALS =====
  {
    id: 'sanctions-training-what-are-sanctions',
    text: 'What Are Sanctions? Sanctions are measures or actions taken against a target to influence its behavior, policy, or actions. Three essential components: 1) An economic action, 2) Taken against a target (state, class of persons, individual, or function), 3) To influence the target\'s actions. Sanctions can restrict trade, financial transactions, diplomatic relations, and movement. Also called "restrictive measures" (EU terminology). Sanctions compliance is adhering to sanctions-related legislation, regulations, rules, and norms. Purpose: Deterrence (discouraging future prohibited actions), Prevention (stopping ongoing harmful activities), Punishment (penalizing past violations). Targeting approaches: Geographic sanctions (specific countries/regions like North Korea, Crimea) and Thematic/Activity-based sanctions (counter-narcotics, human rights). Sanctions are most effective when tied to incentives for change rather than being purely punitive.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'fundamentals', title: 'What Are Sanctions' }
  },
  {
    id: 'sanctions-training-history',
    text: 'Sanctions Historical Context. First recorded sanctions: Megarian Decree (432 BC) — Athens banned Megara from markets. Post-WWI: President Wilson advocated "economic, peaceful, silent, deadly remedy." League of Nations Article 16 established sanctions power. Post-WWII: UN formed 1945, sanctions formally recognized as foreign policy tool. Cold War: US imposed sanctions significantly more than any other country, unilateral approach dominated. Post-Cold War shift toward multilateral coalitions. Most high-profile: UN sanctions against Iraq (1990-2003), cost Iraq estimated 48% GNP, greatest impact on poorest residents, led to shift toward targeted sanctions. Modern era: Sanctions increasingly targeted at political leaders, drug lords, terrorists to minimize humanitarian impact.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'history', title: 'Sanctions History' }
  },
  {
    id: 'sanctions-training-purpose',
    text: 'Purpose of Sanctions. Sanctions serve as alternatives to military force and extensions of foreign policy. Specific objectives: Preventing war, promoting democratic values, punishing human rights abusers, preventing nuclear proliferation and WMD spread, freeing captured citizens, restoring sovereign lands, protecting financial systems from international criminals, reducing money laundering and terrorist financing, reducing trafficking in illegal goods, demonstrating moral resolve. A sanctions regime is a set of sanctions with a common theme, referred to by issuer (e.g., "OFAC sanctions regime") or purpose (e.g., "North Korea sanctions regime"). Political leaders targeted by sanctions rarely suffer as much as those in lowest economic situations — Kim Jong-un regularly seen in luxury vehicles despite UN prohibition on luxury goods to North Korea.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'fundamentals', title: 'Purpose of Sanctions' }
  },

  // ===== KEY FRAMEWORKS =====
  {
    id: 'sanctions-training-npt',
    text: 'Non-Proliferation Treaty (NPT). Signed 1968, effective March 1970, extended indefinitely May 11, 1995. Goals: binding disarmament commitment by five declared nuclear-weapon states, promote peaceful nuclear technology, prevent spread of nuclear weapons. Established IAEA for compliance monitoring. Case Study — Libya: Ratified NPT 1975. US sanctioned as state sponsor of terrorism. Additional US sanctions 1986, UN sanctions 1992. Iran and Libya Sanctions Act (ILSA) 1996 enabled sanctions against foreign companies investing $40M+ in Libyan oil (lowered to $20M in 2002). December 2003: Gaddafi renounced WMD program. Libya allowed IAEA access; 55,000 pounds of documents and uranium enrichment components removed. Relations normalized within a year. Key takeaways: Sanctions are often long-term strategies, multilateral more effective than unilateral, work best paired with incentives.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'frameworks', title: 'Non-Proliferation Treaty' }
  },
  {
    id: 'sanctions-training-magnitsky-hr',
    text: 'Human Rights Sanctions — Magnitsky Act. Formal name: Russia and Moldova Jackson-Vanik Repeal and Sergei Magnitsky Rule of Law Accountability Act of 2012. Origin: Mistreatment of attorney/auditor Sergei Magnitsky by Russian officials while imprisoned for investigating fraud by Russian tax officials. Allows unilateral global sanctions on human rights offenders and corrupt actors. Penalties: Asset freezes, US entry bans. Applied to those involved in Jamal Khashoggi assassination (2018). Similar laws adopted by: Canada, Estonia, Lithuania, United Kingdom, Latvia. January 2019: EU Parliamentary Assembly urged more countries to adopt. Conflict Diamonds — Kimberley Process: Beginning 1998, UN recognized need for trade controls over rough diamonds linked to conflicts in West Africa (Angola, Côte d\'Ivoire, Liberia, Sierra Leone). 2003: UN established Kimberley Process Certification Scheme requiring import/export controls, certification, documentary trail.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'frameworks', title: 'Magnitsky Act & Human Rights Sanctions' }
  },
  {
    id: 'sanctions-training-terrorism',
    text: 'Terrorism-Related Sanctions. UNSCR 1267 (1999): Response to US Embassy bombings in Kenya/Tanzania, targeted Al-Qaeda and Taliban affiliates, expanded 2014 to include ISIS/ISIL/Da\'esh. International Convention for Suppression of Financing of Terrorism (1999): Criminalizes terrorism financing, requires international cooperation in detecting and freezing terrorist assets, signatories must penalize/prosecute/extradite offenders. UNSCR 1373 (2001): Post-September 11, obliged all UN Member States to sanction terrorist activity. Case Study — Sudan (1996-2001): UNSCR 1054 imposed sanctions for hosting Osama bin Laden. Restrictions: diplomatic limits, movement restrictions, flight restrictions. Result: Economic losses, inability to attract petroleum investment. Sanctions lifted 2001 after Sudan acceded to counterterrorism treaties and expelled bin Laden. Takeaway: Sanctions can incentivize reduced state support of terrorism but impact is not always immediate.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'frameworks', title: 'Terrorism Sanctions' }
  },

  // ===== WHO IMPOSES SANCTIONS =====
  {
    id: 'sanctions-training-un',
    text: 'United Nations Sanctions. Legal Basis: Article 41 of Chapter VII of UN Charter. First sanctions: 1963 (South Africa), 1965 (Southern Rhodesia) — both against apartheid. Security Council: 15 members, 5 permanent (P5: Russia, US, UK, China, France). Each P5 has veto power. Sanctions require at least 9 affirmative votes including all P5. Resolutions legally binding under Articles 25 and 48 of UN Charter. Article 42: If resolution insufficient, Council may take military action. Preference for targeted sanctions over comprehensive (humanitarian impact). Implementation: UN establishes sanctions committee, Member States pass own laws and create enforcement bodies. Cold War made UN sanctions difficult due to US-Russia opposition; thawing enabled cooperation.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'imposing_bodies', title: 'United Nations' }
  },
  {
    id: 'sanctions-training-us-sanctions',
    text: 'United States Sanctions — The Most Extensive Regime Globally. Legal authorities: International Emergency Economic Powers Act (IEEPA), Trading with the Enemy Act (TWEA). President imposes by Executive Order. Key Agencies: OFAC (Treasury) — implements financial sanctions, maintains SDN List. BIS (Commerce) — maintains Denied Persons List, administers Export Administration Regulations (EAR). Section 311 of USA PATRIOT Act: Treasury designates institutions/jurisdictions as "primary money laundering concern." Effectively cuts target off from US dollar payment system. Case Study — Banco Delta Asia (2005): Designated for allegedly violating North Korea sanctions. Before designation became effective, threat alone triggered bank run — deposits depleted 34% within days, bank went into receivership. OFAC "Framework for Compliance Commitments" provides guidance (not regulations).',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'imposing_bodies', title: 'United States Sanctions' }
  },
  {
    id: 'sanctions-training-eu-sanctions',
    text: 'European Union Sanctions ("Restrictive Measures"). Prepared by European External Action Service. Requires unanimous adoption by CFSP. Adoption process: Regional preparatory body → RELEX → PSC → COREPER II → Unanimous CFSP adoption → Published in Official Journal. EU implements all UN Security Council sanctions as matter of policy. Key principle: EU sanctions apply ONLY where links to EU are present (no extraterritoriality). EU vs US differences: EU review period ≤1 year (US generally open-ended); EU scope narrower; EU ownership threshold >50% (US ≥50%); EU includes control test (US does not). EU may respond faster to positive developments — lifted most Myanmar sanctions in 2012; US eased some in December 2016 (4 years later).',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'imposing_bodies', title: 'EU Sanctions' }
  },
  {
    id: 'sanctions-training-fatf',
    text: 'Financial Action Task Force (FATF). Formed July 1989 at G7 summit in Paris. Original purpose: develop international AML standards. Post-9/11: added counter-terrorist financing. Now 35+ countries. No formal power but influence through widespread adoption of recommendations. FATF Blacklist: Countries non-cooperative in fighting ML/TF — Iran, North Korea. Members expected to apply countermeasures. FATF Greylist: Countries with strategic AML/CFT deficiencies. Case Study — Pakistan: India sought blacklist placement. FATF kept on greylist with warning. Consequence: estimated $10 billion annual losses as organizations avoid reputational/operational risks. Mutual Evaluation Reports (MERs): Evaluate country compliance with FATF recommendations. Recommendation 6 requires targeted sanctions regimes to comply with relevant UN resolutions. MERs may affect financial institutions\' country risk ratings.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'imposing_bodies', title: 'FATF' }
  },

  // ===== JURISDICTIONS =====
  {
    id: 'sanctions-training-jurisdictions-1',
    text: 'Sanctions Jurisdictions Part 1. United Kingdom: Policy by Foreign and Commonwealth Office, implementation by OFSI (including licensing), regulation by FCA. Canada: Autonomous sanctions via Special Economic Measures Act (SEMA), regulation by OSFI, intelligence by FINTRAC. Australia: UN + limited autonomous sanctions (Autonomous Sanctions Act 2011), policy by DFAT, regulation by AUSTRAC. Generally NO extraterritorial effects. China: Permanent UN Security Council member. Implements through domestic laws. Limited autonomous sanctions (terrorism-related). Oversight by MFA, PBOC, MPS. May exert informal pressure through directives to state-owned enterprises. Generally NO extraterritorial effects.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'jurisdictions', title: 'UK, Canada, Australia, China' }
  },
  {
    id: 'sanctions-training-jurisdictions-2',
    text: 'Sanctions Jurisdictions Part 2. France: EU/UN + autonomous sanctions. Authority: French Treasury Directorate. "Code de Bonne Conduite" guidance. Germany: UN/EU + autonomous. Framework: Foreign Trade and Payments Act. BIS export controls by BAFA. Hong Kong: UN sanctions under Chinese MFA direction. No autonomous sanctions. HKMA increased oversight including thematic review of sanctions screening technology. Many foreign FIs in HK also comply with US/EU sanctions. India: Less extensive framework. Strong ties to sanctioned countries (e.g., Iran). UN Security Council resolutions only. No autonomous sanctions. Reserve Bank of India (RBI) primary AML/CFT regulator. Japan: UN + autonomous sanctions. Unilateral North Korea sanctions. MOF and METI oversight. Law enforcement compiles "anti-social forces" lists for financial institution screening.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'jurisdictions', title: 'France, Germany, HK, India, Japan' }
  },
  {
    id: 'sanctions-training-jurisdictions-3',
    text: 'Sanctions Jurisdictions Part 3. Singapore: UN + limited autonomous. MAS for financial sanctions. No extraterritorial effects but influenced by many international regimes as regional trading hub. South Korea: Autonomous via Prohibition on Financing of Offences of Public Intimidation Act. FSC may designate terrorist financing entities. Switzerland: UN + autonomous. Federal Embargo Act (EmbA) enables sanctions ordered by UN, EU, or significant trading partners. Inspection without prior notice during working hours. Taiwan: Not a UN member but generally implements UN sanctions. Total ban on North Korea trade (September 2017). Member of Asia Pacific Group (APG). New Zealand: UN sanctions only through MFAT. No autonomous sanctions except travel bans. No extraterritorial effects.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'jurisdictions', title: 'Singapore, S.Korea, Switzerland, Taiwan, NZ' }
  },

  // ===== WHO IS SUBJECT =====
  {
    id: 'sanctions-training-subject-to',
    text: 'Who Is Subject to Sanctions? Sanctions apply to EVERYONE. Jurisdictional principles: Citizens/permanent residents must comply regardless of location. Any individual physically in a jurisdiction must comply. OFAC applies to: US citizens/permanent residents wherever located, companies organized under US law, all persons/organizations physically in US, all branches of US companies worldwide. EU applies to: Within EU territory/airspace, on aircraft/vessels under Member State jurisdiction, any EU national inside or outside EU, any legal entity incorporated under Member State law, any entity doing business in EU. Branch vs. Subsidiary: EU branches subject to EU sanctions. Subsidiaries outside EU generally NOT subject. Financial institutions invest heavily because sanctions violations result in fines and imprisonment — same penalties for coffee shop and large bank, but exposure differs enormously.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'applicability', title: 'Who Is Subject to Sanctions' }
  },
  {
    id: 'sanctions-training-facilitation',
    text: 'Facilitation. 31 CFR 506.208: No US person, wherever located, may approve, finance, facilitate, or guarantee any transaction by a foreign person where the transaction would be prohibited if performed by a US person. Core principle: A US person cannot do indirectly what they are directly prohibited from doing. Applies to US persons anywhere in the world. Particular concern: US persons in senior management of foreign companies, US consultants overseas. Prohibited facilitation: approving/financing/guaranteeing prohibited transactions, providing merchandise, making purchases benefiting prohibited activity, providing guidance, altering corporate policies to allow prohibited transactions, referring business. NOT facilitation: purely clerical or reporting activities. Case Study — Schlumberger: BVI incorporation, Houston HQ. Systematically approved and disguised capital expenditure requests from Iran/Sudan, directed equipment transfers, provided technical services. Houston operations didn\'t directly engage but provided support.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'applicability', title: 'Facilitation' }
  },
  {
    id: 'sanctions-training-extraterritoriality',
    text: 'Extraterritoriality. Definition: Ability of a state to make, apply, and enforce laws beyond its territory. US is primary government applying extraterritoriality, justified by globalization weakening primary sanctions. EU believes extraterritoriality violates international law — does NOT allow it. Primary sanctions: Apply to persons/entities within jurisdiction. Secondary sanctions: Non-citizens/companies outside jurisdiction expected to comply (extraterritorial). US Re-Export Prohibition: Non-US persons forbidden from exporting goods of US origin or containing US-origin content to embargoed countries. Case Study — Honda Finance (2017): Honda Canada Finance financed 13 leases for Embassy of Cuba. $87,255 settlement. Case Study — Epsilon Electronics (2014): $1.5M settlement. OFAC found Epsilon "knew or had reason to know" distributor Asra distributed products to Iran — Asra\'s website touted Iranian market success with Tehran addresses.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'applicability', title: 'Extraterritoriality' }
  },
  {
    id: 'sanctions-training-blocking-statutes',
    text: 'Blocking Statutes. EU Blocking Regulation (EC No. 2271/96, 1996): Countermeasure to US extraterritorial sanctions. Bans Member States from complying with US extraterritorial sanctions. Largely ignored until May 2018 when US withdrew from JCPOA and re-imposed Iran sanctions. Requirements for EU companies: Notify European Commission within 30 days when US sanctions affect interests, do NOT comply with listed US sanctions, do NOT enforce US court judgments based on reinstated sanctions. Article 5: Companies may request exemption if compliance would "seriously damage their interests." Practical reality: EU blocking regulation has not been enforced because US is willing to impose secondary sanctions. Case Study — Walmart Canada (1997): Removed Cuban pajamas from shelves per US demands. Canada\'s blocking regulation prohibited removal (C$1.5M penalty threat). Walmart restocked Cuban pajamas, ultimately paid $50,000 OFAC fine. Blocking regulations show moral opposition but place companies in no-win situations.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'applicability', title: 'Blocking Statutes' }
  },

  // ===== SANCTIONS LISTS AND DATABASES =====
  {
    id: 'sanctions-training-lists-databases',
    text: 'Major Sanctions Lists and Databases. UN Consolidated List: All persons/entities subject to UN sanctions with name (including transliterations), title, DOB, POB, aliases (good/low quality), nationality, address, listing date, INTERPOL links. US OFAC Lists: SDN List (individuals/companies owned/controlled by targeted countries, terrorists, narcotics traffickers), frequently updated. Identifiers include surname, first name, transliterations, aliases, DOB, POB, nationality, passport numbers. Detailed identifiers avoid false positives from homonyms. EU Consolidated List: UN-issued + autonomous EU sanctions. EU has second-highest number of active programs after US. Key differences from US: EU review period ≤1 year (US open-ended), EU narrower scope, EU >50% threshold (US ≥50%), EU control test, EU no extraterritoriality. Other country lists: UK HM Treasury (published by OFSI), Australia AUSTRAC with UN 1267 references.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'lists', title: 'Sanctions Lists and Databases' }
  },
  {
    id: 'sanctions-training-licenses',
    text: 'Exemptions, Exceptions, and Licenses. A license is written authorization from sanctions regulator permitting otherwise prohibited activity. General Licenses (Exemptions): Available to all persons, authorize certain transaction categories, no prior approval needed. Example: Pistachios and carpets from Iran historically under general license. Specific Licenses (Exceptions): Case-by-case, must be requested, few months to 1+ year processing. Common categories: Legal services (compliance with US law, representation before agencies), Emergency services, Insurance issuance to targets (UK). EU exemptions: Consumptive use not prohibited (gas, electricity, telephone, utilities). Licensing objectives: Balance minimizing restricted activity risk, meeting human rights/basic needs, avoiding unintended economic consequences.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'licenses', title: 'Licenses and Exemptions' }
  },

  // ===== TYPES OF SANCTIONS =====
  {
    id: 'sanctions-training-types-trade',
    text: 'Types of Sanctions — Trade Sanctions. Limit target country exports or restrict imports. Total embargoes rare due to civilian consequences — most are selective (energy, gas, finance, luxury goods). Trade often diverted rather than stopped, rarely impacts political elite. Transshipment: Shipment through intermediate countries. Risk: intermediate country may be sanctioned. Arms Embargoes: Specific type applying to weapons and dual-use goods. Wassenaar Arrangement: 42 states committed to export responsibility and transparency, voluntary reporting on conventional weapons. Financial Sanctions: Prohibiting government loans, labeling as non-cooperative, asset freezing. Effects: Higher interest rates, dried-up funding, more difficult to avoid than trade sanctions due to global payment system interconnectivity, more likely to impact targeted individuals vs. general population.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'types', title: 'Trade and Financial Sanctions' }
  },
  {
    id: 'sanctions-training-types-comprehensive-targeted',
    text: 'Comprehensive vs Targeted vs Sectoral Sanctions. Comprehensive: Prevent ALL transactions between sanctioning and sanctioned country. Allow humanitarian/medical exemptions under general license. No imports, exports, financing, technology exchange. Criticized as unhumanitarian. Example: UN Iraq embargo 1990 — harshly criticized for civilian impact. Targeted (Smart) Sanctions: Emerged from 1990s concern over civilian impact. Allow greater discrimination, reject philosophy that civilian pain leads to political change. Sectoral Sanctions: New since 2014, even narrower than targeted. SSI List (Sectoral Sanctions Identifications) published by OFAC. Target key entities in specific economic sectors. First use: Russia (Crimea) — blocked new long-term debt and equity issuance for state-owned banks, energy companies, defense companies. SSI list is separate from SDN list. Case Study — Haverly Systems (2019): $75,375 for invoices to Rosneft where tax delays extended payment beyond 90-day debt prohibition. Travel Bans: Limit where individuals can travel, deny visas, undermine legitimacy.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'types', title: 'Comprehensive, Targeted, Sectoral Sanctions' }
  },

  // ===== CONSEQUENCES =====
  {
    id: 'sanctions-training-consequences',
    text: 'Consequences for Noncompliance. Core: Civil penalties and criminal punishments (including prison). OFAC considers: willful/reckless conduct, harm to program objectives, compliance program sophistication, remedial measures, voluntary self-disclosure, egregious factors. Possible responses: No action, caution, civil monetary penalty, criminal prosecution referral. Individual consequences: US — Fine up to $1M, up to 20 years imprisonment. Australia — up to 10 years, fines up to AU$450,000 or 3x transaction value. Case Study — Bobby Fischer (1992): Played chess in sanctioned Yugoslavia, US indictment, faced 10 years, never returned to US. Organizational: Strict liability — liable even without intent or knowledge. Case Study — ITW/AppliChem (2019): $5.5M penalty for 304 Cuba sanctions violations. Former owners created scheme to continue Cuba sales through intermediary. Reputational damage: Standard Chartered shares fell 23% after Iran allegations ($250B over 10 years). Major penalties: BNP Paribas $8.9B (2014), UniCredit $1.3B (2019), ING $619M (2012).',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'consequences', title: 'Noncompliance Consequences' }
  },

  // ===== COMPLIANCE PROGRAMS =====
  {
    id: 'sanctions-training-scp-framework',
    text: 'Sanctions Compliance Programs (SCPs) — OFAC Framework (May 2, 2019). Five essential components: 1) Management Commitment — adequate resources, full integration into daily operations, culture of compliance. Board must voice and demonstrate commitment. 2) Risk Assessment — identify general/specific risks, mitigating controls, residual risk. Generally every 12-18 months. 3) Internal Controls — policies, procedures, technology ensuring SCP functions. 4) Testing and Auditing — performed by people not involved with compliance, report to board. 5) Training — provided to all appropriate employees periodically, minimum annually. FinCEN Guidelines (August 2014): Leadership must actively support compliance, not compromised by revenue interests, relevant information shared across departments, adequate resources, independent testing. NYDFS Part 504 (effective January 2017): Requires Transaction Monitoring and Filtering Programs. Annual board/senior officer certification.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'compliance', title: 'SCP Framework' }
  },
  {
    id: 'sanctions-training-scp-management',
    text: 'SCP Management Commitment and Independence. OFAC: "Senior Management\'s commitment to, and support of, an organization\'s risk-based SCP is one of the most important factors in determining its success." Requirements: adequate resources, program legitimization, personnel empowerment, culture of compliance. Compliance independence: Staff sufficiently independent from lines of business, compensation structures must not compromise autonomy, comfortable escalating without fear of recrimination. Whistleblower programs: Anonymous channel, non-retaliation policy, part of code of conduct. Case Study — BSI Bank Singapore (2016): MAS ordered shutdown for serious AML breaches, SG$13.3M penalties. Six senior management including CEO referred to prosecutor. Case Study — U.S. Bancorp (2018): $600M+ in fines. Compliance team under-resourced despite identified risk. Alert caps regardless of volume. Testing showed monitoring thresholds missing suspicious activity — bank halted testing rather than fixing thresholds.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'compliance', title: 'Management Commitment & Independence' }
  },
  {
    id: 'sanctions-training-scp-controls',
    text: 'SCP Policies, Procedures, and Internal Controls. Policies: Clear, simple, high-level statements; uniform across organization; board/executive approved. Procedures: Translate policies into workable practice; operational level; regularly reviewed. Internal Controls: Technology/tools ensuring SCP functions — identify, interdict, escalate, report, maintain records. SCPs must include: High-risk operation identification, regular risk profile updates, immediate action on sanctions regime changes, board reporting on compliance initiatives/deficiencies/blocked transactions, metrics reporting, clear accountability, regulatory compliance, risk-based CDD. Dynamic adaptation: SCPs must adjust rapidly to SDN/SSI/EU list updates, new legislation, executive orders, guidance. Enterprise-wide approach for large institutions with consistency across regions while accommodating local requirements. Case Study — State Street Bank (2019): Finding of Violation for 45 pension payments to US citizen residing in Tehran. Retiree services used separate screening tool from centralized system. Remediation: All retirement plan payments now through centralized screening.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'compliance', title: 'Policies, Procedures, Controls' }
  },
  {
    id: 'sanctions-training-scp-testing',
    text: 'SCP Testing, Auditing, and Training. Testing and Auditing: Assess effectiveness, identify inconsistencies, rectify weaknesses. Performed by independent staff reporting to board. Audit objectives: Overall SCP integrity, risk assessment adequacy, policy/procedure adherence, transaction testing emphasizing high-risk operations, training adequacy, screening/filtering software evaluation, data completeness/accuracy/timeliness. Case Study — UniCredit Bank AG (2019): Fined for moving hundreds of millions for sanctioned entities (Iran, Libya, Cuba). Disguised transactions 2002-2011 by stripping words like "Sudan" and "Tehran" from payment messages. Training requirements: All employees annually, job-specific, stress compliance importance, hold employees accountable. Target audiences: Customer-facing (deepest practical understanding), Operations (red flag recognition), Compliance staff (advanced ongoing), Testing staff (regulatory changes, evasion methods), Senior management/Board (regulatory requirements, penalties, personal liability). Case Study — Standard Chartered (2019): $1.1B penalty. "Compliance staff was poorly trained and unconcerned with US sanctions regulations." Multiple systemic deficiencies, failure to respond to warning signs.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'compliance', title: 'Testing, Auditing, Training' }
  },

  // ===== RISK ASSESSMENT =====
  {
    id: 'sanctions-training-risk-assessment',
    text: 'Sanctions Risk Assessment. Foundation of sound compliance. Formula: Inherent Risk - Control Effectiveness = Residual Risk. Four main inherent risk categories: 1) Customers — ease of identifying business nature, concealment of identity, complex legal structures, shell companies/bearer shares. 2) Products/Services — international/cross-border features, virtual currencies (anonymity, encryption), trade financing, dual-use goods. 3) Countries — North Korea obvious red flag, Turkey entry point for Syria, China border provinces for NK smuggling, UAE short boat trip from Iran. 4) Delivery Channels — reliance on brokers/intermediaries, non-face-to-face onboarding, fast payment processing. Risk appetite: Amount of risk firm willing to accept. AML risk ratings ≠ sanctions risk ratings. Residual risk options: Transfer (limited for sanctions), Avoid (discontinue products/decline customers), Further mitigate (decrease thresholds, increase monitoring), Accept.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'risk_assessment', title: 'Risk Assessment Framework' }
  },

  // ===== EVASION TECHNIQUES =====
  {
    id: 'sanctions-training-evasion-stripping',
    text: 'Sanctions Evasion — Stripping. Definition: Intentional removal or modification of information from a record to avoid sanctions list detection. Major cases: BNP Paribas (2014) $9B fine — dollar-clearing for Sudan, Iran, Cuba. Staff stripped sanctioned country references from SWIFT messages. Internal instructions: "guarantee confidentiality...avoid disclosure to regulatory authorities." Compliance head commented after ABN AMRO settlement: "the dirty little secret isn\'t so secret anymore, oui?" Crédit Agricole (2015) $780M+ — stripped 4,000+ USD SWIFT messages. NYDFS ordered specific employee termination. Commerzbank (2015) $1.45B — Frankfurt office established department to amend Iran payments. Custom solution: Checks with London address only. Wire stripping: International wires use RTGS systems and correspondent accounts. Multiple parties = multiple opportunities for information alteration. Most jurisdictions require basic sender/recipient info. U-Turn Payments: Transaction using offshore intermediaries to avoid direct processing for sanctioned entity. OFAC revoked Iran U-turn exemption in 2008.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'evasion', title: 'Stripping and Wire Evasion' }
  },
  {
    id: 'sanctions-training-evasion-messages-payments',
    text: 'Sanctions Evasion — Message Separation and Payment Tactics. SWIFT Message Types: MT103 (single payment between banks), MT202 (bank-to-bank covering instructions), MT202COV (includes originator/beneficiary info for screening). Cover Method evasion: Send MT103 to beneficiary bank, send MT202 (not MT202COV) to intermediary — intermediary blind to transaction details. Deutsche Bank (2015) fined for ensuring NY didn\'t receive originator/beneficiary info. Payment screening evasion tactics: Rearrange data to unscreened fields, replace with false data or unusual characters ("%&%$%"), use red-flag phrases ("No name," "On behalf of..."), alter/abbreviate names, manually alter messages before forwarding. Nested accounts: Foreign FI accesses US system through account with another foreign FI without US parties understanding. Case Study — BNP Paribas Sudanese: $6.4B through US system for Sudanese entities. Network of satellite banks with nested accounts. Flagged internally August 2005 but senior compliance was ignored.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'evasion', title: 'Message Separation & Payment Evasion' }
  },
  {
    id: 'sanctions-training-evasion-trade',
    text: 'Sanctions Evasion — Trade-Related. Concealment: Disguise origin/receiver, structure so exporter unaware of destination, use straw buyer, falsify end-user certificates. Transshipment: Ship through intermediate destination. Some regimes treat transshipped goods as originating from sanctioned jurisdiction. Case Study — Ali Asghar Manzarpour (2007): 20-year export denial for coordinating aircraft export US→UK→Iran. Consolidation: Mix restricted items with other goods. Case Study — David Wu (2015): 10 months for concealing equipment in construction supplies to China. Document falsification: False commercial invoices, bills of lading, cargo manifests. Case Study — Access USA Shipping (2017): $27M BIS fine, 150 violations. Changed descriptions: rifle scopes → "sporting goods", rifle stocks → "toy accessories". CEO knew: "I know we are WILLINGLY AND INTENTIONALLY breaking the law." Back-to-Back Letters of Credit: Removes sanctioned bank\'s name from documentation. Red flags: instructions to amend terms, change destination, remove bank/applicant name.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'evasion', title: 'Trade-Related Evasion' }
  },
  {
    id: 'sanctions-training-evasion-front-shell',
    text: 'Sanctions Evasion — Front Companies, Shell Companies, and Identity Concealment. Front Company: Entity meant to shield another from scrutiny. Shell Company: No active business or significant assets. Shelf/Aged Companies: Created months/years ahead, shelved until needed for "clean" business record. Case Study — Trans Merits (2014): Taiwan-based, procured dual-use equipment for North Korea\'s KOMID. Gary Tsai established US front company after father SDN-designated, removed father\'s name, falsified invoices. Case Study — ZTE (2018): $1B fine + $400M escrow. Used "isolation company" to purchase US goods, resell to ZTE, transfer to Iran. Created project team to study export control risks, proposed establishing new isolation companies. Employees signed NDAs, auto-deleted emails nightly, created department to remove Iran-related info. Case Study — Ocean Maritime Management (2014): North Korea. Vessel contained SAM components, MiG-21 parts, ammunition concealed under sugar bags. Falsely declared as "spare plastic sacks." After listing, renamed 13 of 14 ships and transferred to shell corporations. Screen IMO numbers (don\'t change) for ship transactions.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'evasion', title: 'Front/Shell Companies & Identity Concealment' }
  },
  {
    id: 'sanctions-training-evasion-beneficial-ownership',
    text: 'Concealment of Beneficial Ownership. Most challenging evasion method. Using different names: Change spelling, vary name order, use completely different alias, provide false address, act through nominee/relative/representative. Complex corporate ownership: 50% Rule (US: ≥50% = sanctioned; EU: >50%). Aggregate rule cascades through ownership chains. Challenges: Some jurisdictions lack public company registers, some don\'t include beneficial ownership. Bearer shares decline since 2015 (Swiss require holder identification). Dilution: Complex structures across jurisdictions reduce sanctioned ownership below thresholds. Proxies/Front Parties: Nominee directors/shareholders hide true owners. Straw men: Non-sanctioned person with low profile acting for target. Restructuring: Sham divestments — sell assets to close associates while maintaining control. Case Study — Rotenberg Brothers: Boris sold 50% to son Roman but planned to continue full control. OFAC FAQ 402: Even if ownership falls below 50%, property remains blocked if it was blocked when ownership was higher. Divestment must occur outside US jurisdiction without US persons.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'evasion', title: 'Beneficial Ownership Concealment' }
  },

  // ===== SANCTIONS DUE DILIGENCE =====
  {
    id: 'sanctions-training-sdd-governance',
    text: 'Sanctions Due Diligence (SDD) Governance. SDD is related to KYC but focused on sanctions-specific risks: establishing identity, determining beneficial ownership, determining controlling influences, understanding end user and supply chain. Application points: Start of relationship, new product introduction, trigger events, periodic reviews, relationship end. Three Lines of Defense: 1st Line (Business/Front): Relationship managers collect SDD, detect unusual activity. 2nd Line (Compliance): Sanctions compliance officer, ongoing monitoring, escalate noncompliance, suspicious transaction reporting, sufficient independence. 3rd Line (Internal Audit): Independent reviews, report to audit committee. Dual controls ("four-eyes"): At least two employees required for internal control tasks. FATF Recommendation 10: Identify/verify customer, identify beneficial owners, understand business purpose, conduct ongoing due diligence.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'due_diligence', title: 'SDD Governance' }
  },
  {
    id: 'sanctions-training-sdd-kyc',
    text: 'Sanctions Due Diligence — KYC and Beneficial Ownership. Key information: Customer identity, owners/controllers/beneficial owners, assets (direct and indirect), goods/products/services, activities, potential military purpose, operating jurisdictions. Ultimate Beneficial Owner (UBO): Natural person(s) who ultimately owns or controls customer. EU control criteria: Right to appoint/remove majority of management, having appointed majority through voting rights, controlling majority voting alone, power to exercise dominant influence. Two approaches: Centralized repository (UK, Australia) or Independent collection (US). Operational challenges: Limited transparency, unfamiliarity with overseas structures, calculating aggregate ownership, customer cooperation issues. Case Study — Barclays Bank (2016): $2.5M for 159 Zimbabwe violations. Couldn\'t screen beneficial owner information electronically. For some customers, didn\'t know beneficial owners were SDNs. CDD system held ownership in paper only.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'due_diligence', title: 'KYC and Beneficial Ownership' }
  },
  {
    id: 'sanctions-training-sdd-business-geography',
    text: 'SDD — Nature of Business and Geography. Common error: Assuming low AML risk = low sanctions risk. Case Study — PanAmerican Seed Company (2016): $12M fine. Indirectly exported flower seeds to Iranian distributors through European/Middle East consignees. Managers knew about sanctions but didn\'t apply. Case Study — e.l.f. Beauty (2019): ~$1M settlement for North Korea violations. 156 shipments of false eyelash kits from Chinese suppliers sourcing materials from North Korea. Nobody at e.l.f. knew. Penalties reduced due to self-disclosure. Individual geographic footprint: nationalities, place of birth, residence, employment, tax residency. Entity: business locations, customer/supplier/affiliate locations, UBO nationality, direct/indirect fund flows to sanctioned countries. Assess whether entity borders sanctioned jurisdiction or on main transit route. SDD methods: Four-step model — Assess (what do we need to know?), Explore (where to find answers?), Organize (make information meaningful), Present (aid suspicious activity detection). Customer questionnaires, databases, expert investigators.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'due_diligence', title: 'Business and Geographic Due Diligence' }
  },

  // ===== HIGH-RISK LINES OF BUSINESS =====
  {
    id: 'sanctions-training-high-risk-business',
    text: 'High-Risk Lines of Business. Retail Banking: Screen all data against sanctions lists, identify inconsistent activity, review occupation/business. Case Study — Saadi Gaddafi: Opened Canadian accounts using "Kaddafi" instead of "Gaddafi." Wealth Management/Private Banking: Complex structures, multiple jurisdictions, intermediaries, culture of secrecy. Screen intermediaries acting as nominee directors, shareholders, settlors, authorized signatories. Case Study — Riggs Bank (2004): Serviced Pinochet 1994-2002, transferred millions. Reputational damage led to acquisition by PNC. Commercial/Investment Banking: Similar risks — complex ownership, debt/equity restrictions (Russian sectoral, Venezuelan). Trade-Related Activity: Prevent payments related to prohibited trade. Screen vessel names/owners, shipping routes, transshipment jurisdictions. Correspondent Banking: Respondent bank uses correspondent as agent/conduit. Wolfsberg Group questionnaire. Nested account risk: Shell entities in UAE, Turkey can facilitate sanctioned country transactions. Case Study — DHID/North Korea (2016): 22+ front companies across BVI, Hong Kong, England, Seychelles, 43 total entities across four continents.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'high_risk', title: 'High-Risk Lines of Business' }
  },
  {
    id: 'sanctions-training-high-risk-special',
    text: 'High-Risk Industries — Special Sectors. Insurance: Brokers in high-risk jurisdictions, unknown beneficiaries (life insurance payout to sanctioned individual), coverage in sanctioned jurisdictions. Real Estate: Cash purchases by LLCs/trusts enable anonymity. 2018 UAE study: 44 properties (~$28.2M) directly associated with sanctioned individuals, 37 properties (~$78.8M) within expanded networks. Red flags: properties connected to designation info, unsanctioned corporate networks, extensive family/third-party networks. Luxury Goods: Cash-rich sanctioned jurisdictions are key consumers. Case Study — Richemont/Cartier (2017): $335K fine for shipping jewelry to SDN\'s address. Free Trade Zones: 4,000+ in 135+ countries. Common deficiencies: inadequate sanctions safeguards, minimal oversight, weak inspection, inadequate record-keeping. Jebel Ali (Dubai) world\'s largest FTZ, attractive to Iranian entities. Cryptocurrency: North Korea using crypto to evade sanctions and fund WMD. RUSI study revealed bitcoin as "financial lifeline." North Korean labor export spans: apparel, construction, IT services, restaurants, shipbuilding across China, Russia, UAE, Singapore.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'high_risk', title: 'Insurance, Real Estate, FTZs, Crypto' }
  },

  // ===== SANCTIONS SCREENING =====
  {
    id: 'sanctions-training-screening-overview',
    text: 'Sanctions Screening Overview. Key control of effective sanctions compliance. Checking information about person, entity, goods, or services against sanctions lists. Alert: Hit(s) of internal record against sanctions lists including percentage match. Unlike AML (limited to customers), sanctions restrictions apply to ALL business activities and third parties: brokers, agents, vendors, intermediaries, trade finance, beneficial owners. Screen joint ventures/mergers (beneficial owners, goods types, party identity). M&A: "Inherit" acquired company\'s violations — check sanctions compliance history before purchase. Name Screening: Matching internal record against sanctioned list, manual or automated. Batch screening periodically. Real-time at onboarding. Payment Screening: Before payment processed, with current customers, real-time/ex-ante. Faster processing creates screening challenges. Apply human judgment. Common lists: UN Consolidated, EU Consolidated Financial Sanctions, OFAC SDN, BIS Denied Persons, FATF High-Risk Jurisdictions, UK HM Treasury.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'screening', title: 'Screening Overview' }
  },
  {
    id: 'sanctions-training-screening-ast',
    text: 'Automated Screening Tools (ASTs). Software facilitating screening process, generating hits against sanctions lists consolidated into alerts. Wolfsberg Group considerations: Matching software sophistication, screening rule availability, non-Latin character support, workflow configurability, data volume, technology integration. AST is just a tool — does not substitute for sound understanding of customer relationship. Benefits: Continuous screening, minimizes human error, quick document screening, case management. Costs: Licensing, training, threshold calibration, false negatives, model validation. Fuzzy Logic: "Degrees of similarity" to match misspelled/incomplete names. Common algorithms: Phonetic (Bougourd=Bugourd), Edit Distance/Levenshtein (character changes), Equivalence (Gaddafi=Kaddafi=Qadhafi), Non-Equivalence (Cuba Gooding Jr ≠ Cuba country), Noisy Words (lower weighting for "the","and","of"), Word Order Swapping, Missing Names. Case Study — Citigroup (2014): Failed to match "for" and "of" — processed payment to Higher Institute OF vs FOR Applied Sciences (Syria). AST didn\'t generate alert.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'screening', title: 'Automated Screening Tools' }
  },
  {
    id: 'sanctions-training-screening-calibration',
    text: 'Screening Threshold Calibration and Data Quality. Threshold: Percentage of match to algorithm. Too high: Few matches, increased false negatives. Too low: Excess results, many false positives. Base on data control level — customer base (high quality, higher thresholds), third-party data (lower thresholds). Customer screening (static data): Higher quality, verified against legal documents, dual controls — higher thresholds appropriate. Payment screening (unstructured data): Typographical errors, third-party entry, abbreviations — lower thresholds appropriate. Inequalities lists: Organization-compiled list of confirmed false positives for AST suppression. Require dual controls, periodic review. Whitelists: Confirmed non-matches. Regulators require proof of routine screening and control procedures. Internal blacklists: Names screened in addition to government/vendor lists, from OFAC advisories, media, UN reports. SWIFT message screening: Field 50/59 (sender/receiver), Field 70/72 (free text), Field 52 (SWIFT code — "CU" indicates Cuba). Red flag: "FOR BENEFIT OF JOQUIN GUZMAN LOERA" — concealed true beneficiary (El Chapo).',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'screening', title: 'Threshold Calibration & Data Quality' }
  },
  {
    id: 'sanctions-training-screening-trade',
    text: 'Trade Activity Screening. US BIS Consolidated Screening List (CSL): Trading restriction targets with varying severity. Screen ALL parties: vessel (name, owners, consigner, consignee), shipping company, routes, agents, ports of call, voyage history. Documents: SWIFT messages, letters of credit, bills of exchange, bills of lading, commercial invoices, insurance certificates, ship manifests, certificates of origin. Dual-use goods: Products usable for civilian and military purposes (computers, lasers, magnets, SCUBA gear). Wassenaar Arrangement controls list. Language challenges: Hafnium = Hafnio (Spanish), Háfnio (Portuguese). Non-digital documents require manual review. Case Study — Cobham Holdings (2018): $87,507. AST found inequality between "JSC Almaz-Antey" and "Almaz Antey Telecommunications LLC" — relied on all-words match despite fuzzy setting. Continued shipments until self-discovery. Vessel detection avoidance: AIS tracking turned off. Spoofing: Ship transmits false AIS data. Seven countries provide monitoring ships/planes. North Korea imported 7x its petroleum limit in 2018 per UN report.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'screening', title: 'Trade Activity Screening' }
  },

  // ===== INVESTIGATIONS =====
  {
    id: 'sanctions-training-investigations',
    text: 'Sanctions Investigations — Decision Tree. Five-step process: Step 1: Is there an applicable sanctions restriction? (UN, EU, OFAC, other national?) Step 2: What is this restriction about? (Asset freeze, general prohibition, export ban, licensing requirement?) Step 3: Has this restriction been violated? (Relationship with target? Funds made available? Facilitated transaction? Facilitated prohibited trade?) Step 4: How has the violation occurred? Mechanical causes (AST calibration) vs. Human causes (stripping, criminal behavior). Step 5: Record and document — create clear, thorough, orderly record while case is fresh. Indicate dates/times for each step. Minimum report: explanation of alert trigger, step-by-step investigation description, review process with dates/names, additional research, final review and decisions. OFAC Name Match Process: Q1) Hitting against SDN list? Q2) Individual vs entity mismatch? Q3) Only one name matching? Q4) Similarities/exact matches comparing complete entry? If YES to Q4 → escalate. Case Study — Mr. Timtchenko: Spelling variations (Timtchenko/Timchenko), Armenia born (match), year 1952 (match), Hamburg vs Geneva (different) → escalated.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'investigations', title: 'Investigation Decision Tree' }
  },
  {
    id: 'sanctions-training-investigations-matches',
    text: 'Sanctions Investigation — Match Types. Entity name matches: Compare jurisdiction, associated individuals, activities. May need event-triggered review with SDD update. Put hold on accounts while investigating. Jurisdiction/nature of business matches: Routine review discovers sanctions connection (e.g., consultant to Libyan officials). Requires: Who are clients? Are they targets? Payments from targets? Oil sector involvement? Associates? Transaction matches: Effective investigation depends on complete customer data. Case Study — Deutsche Bank Mirror Trades (2017): Method of moving rubles out of Russia. Russian customer buys Russian securities in Moscow (rubles), non-Russian customer sells same securities in London (USD). Bank operated in silos — each unit own due diligence without consolidating. Didn\'t know Moscow and London customers were connected through common directors, owners, addresses. 2,400 suspicious trades, $630M fine. Case Study — Danske Bank (2018): €200B+ illegally transferred (2007-2015) through Estonian branch. Failed to integrate compliance after acquisition. 6,200 accounts examined, "vast majority" suspicious. CEO resigned.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'investigations', title: 'Investigation Match Types' }
  },

  // ===== ASSET FREEZING =====
  {
    id: 'sanctions-training-asset-freezing',
    text: 'Identifying and Blocking/Freezing Assets. Assets broadly defined: cash, checks, bank deposits, securities, bonds, letters of credit, dividends, cars, planes, boats, works of art, real estate, virtual assets. Timing: Must occur quickly — immediately after legislative act comes into force. UNSCR standard: "without delay" to prevent asset flight. UK threshold: Must know with certainty OR have "reasonable cause to suspect." Netherlands: Freeze immediately, remain frozen until sanction changed, exemption granted, or notice from Ministry of Finance. Disclosure: Generally not prohibited to tell target assets are frozen. Reporting: Initial reporting immediately when freeze activated (OFAC: 10 business days). Periodic reporting (OFAC: annual). All records kept minimum five years. Interest: EU does not require interest-bearing account. OFAC requires interest-bearing account at commercially reasonable rate. Routine fees generally can be debited. Dealing in funds: Any change to volume, amount, location, ownership, possession, character, or destination. Frozen assets must be segregated.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'asset_freezing', title: 'Asset Freezing Procedures' }
  },

  // ===== LICENSING DETAILS =====
  {
    id: 'sanctions-training-licensing-detail',
    text: 'Licensing — Detailed Requirements. General licenses: Authorize transaction types for a class of persons, no application needed. UK terrorism-related: insurance provision, temporary provisions, legal aid, third-party legal expenses. Specific licenses: Prescriptive requirements, adequate evidence needed. Information required: All party identification, all FIs involved, account details, proposed amount. Not transferable, limited to facts in application. Licensing authorities: France (DG Trésor), Netherlands (CDIU), UK (OFSI), US (OFAC and BIS). Multi-jurisdiction: License from where frozen funds held. If funds sent outside jurisdiction, recipient may also need license. Even within EU, cannot assume single license covers transfer between Member States. Common errors: Confusion about who must obtain license, not understanding scope, assuming customers confirmed all supply chain licenses. Consequences: Serious offense to conduct prohibited activity without license, to fail to comply with conditions, or to provide false information. Case Study — Syria Property Ltd: UK property management company owned by Assad family. Bank must freeze accounts, cannot process any payments without license. Customer (not bank) must apply for license.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'licensing', title: 'Licensing Requirements' }
  },

  // ===== DELISTING =====
  {
    id: 'sanctions-training-delisting',
    text: 'Delisting Process. Three methods: 1) Death — Does not universally result in immediate removal. Estate may have assets subject to sanctions. 2) Legal dissolution — Similar to death for entities. 3) Request by target — Written application to imposing authority. By jurisdiction: UN — Petition to Focal Point for Delisting (established 2006). ISIL/Al-Qaeda list goes through Office of the Ombudsperson. EU — Apply to EU General Court, only for autonomous sanctions, only when listing criteria no longer met. US — SDN List via administrative process (not court). BIS Denied Parties: removal only when prohibition expires. UK — Appeal to High Court. Delisting impact on KYC: If person currently listed, that is sufficient reason to decline — reason for listing is irrelevant to account decision. No OFAC report needed if only screened (no transaction processed). Case Study — Oleg Deripaska (2019): Designated April 2018. Sued Treasury in March 2019. Successfully got En+ to decrease his control and add Western board members (company delisted). Personal delisting unsuccessful. Treasury released 161-page evidentiary memorandum.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'delisting', title: 'Delisting Process' }
  },

  // ===== MAJOR ENFORCEMENT CASES =====
  {
    id: 'sanctions-training-enforcement-bnp',
    text: 'Enforcement Case — BNP Paribas (2014). $9 billion fine (largest sanctions penalty in history). Dollar-clearing services for Sudan, Iran, Cuba. Staff stripped sanctioned country references from SWIFT messages, replaced with bank\'s name or code words. "Long-term, multi-jurisdictional conspiracy" involving senior levels. Internal instructions: "Do not stipulate...name of Iranian entities on messages transmitted to American banks." Senior lawyer expressed doubts in 2006 — business continued due to "long relationships" and "cost of conversion." Compliance staff raised concerns, dismissed by senior executives. 2004 MOU with NY regulators; developed workaround to insulate NY branch. Compliance coordinator kept silent. After ABN AMRO settlement (2005), compliance head: "the dirty little secret isn\'t so secret anymore, oui?" $6.4B processed for Sudanese entities alone (July 2006-June 2007). Root causes: Lacked compliance culture, commercial gain prioritized, internal alarms met with indifference.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'enforcement', title: 'BNP Paribas $9B' }
  },
  {
    id: 'sanctions-training-enforcement-standard-chartered',
    text: 'Enforcement Case — Standard Chartered Bank. 2012: $667M fine for Iran sanctions violations ($250B in transactions over 10 years), shares fell 23%. 2014: $300M for surveillance shortcomings. 2019: $1.1B global penalty (DOJ, OFAC, NYDFS, UK FCA). Thousands of illicit transactions (Iran, Sudan, Syria). Breached prior deferred prosecution agreement. UAE compliance "woefully inadequate." "Compliance staff was poorly trained and unconcerned with US sanctions regulations." Two Dubai employees knew sanctions and Iranian connections, conspired with customers despite training. One employee received gift (car payment) from Iranian money-exchange front company. Employees advised customers on avoiding detection and opening accounts without triggering blocks. Root causes: Multiple systemic deficiencies, failure to respond to warning signs, inadequate training, lack of compliance culture in overseas operations.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'enforcement', title: 'Standard Chartered $2B+' }
  },
  {
    id: 'sanctions-training-enforcement-zte-others',
    text: 'Enforcement Cases — ZTE, Commerzbank, and Others. ZTE (2018): $1B fine + $400M escrow. Used isolation companies to transfer US goods to Iran 2010-2016. Created project team to study export control risks, proposed new isolation companies. Employees signed NDAs, auto-deleted emails, created department to remove Iran data. Commerzbank (2015): $1.45B. Frankfurt department to amend Iran payments. Custom checks with London address only. US offices tried to block, non-US offices worked to avoid detection. Nobody reported suspicious activity. UniCredit (2019): $1.3B for moving hundreds of millions for sanctioned entities. Disguised transactions 2002-2011 by stripping "Sudan" and "Tehran." Five-year senior executive certification requirement. ING (2012): $619M. Credit Suisse (2009): $536M. Haverly Systems (2019): $75K for invoices to Rosneft where tax delays created >90-day debt. Cobham Holdings (2018): $87K — AST couldn\'t match similar entity names due to all-words matching. e.l.f. Beauty (2019): ~$1M for North Korea supply chain violations.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'enforcement', title: 'ZTE, Commerzbank, and Others' }
  },

  // ===== SWIFT MESSAGE SCREENING =====
  {
    id: 'sanctions-training-swift-screening',
    text: 'SWIFT Message Screening for Sanctions. MT103 key fields: Field 20 (Transaction Reference), Field 23B (Bank Operation Code), Field 32A (Value Date/Currency/Amount), Field 50A/F/K (Ordering Customer/Payer), Field 52A/D (Ordering Institution/Payer\'s Bank), Field 53-54 (Correspondent Banks), Field 56A/C/D (Intermediary Bank), Field 57A-D (Account with Institution/Beneficiary\'s Bank), Field 59/59A (Beneficiary), Field 70 (Remittance Information), Field 72 (Sender to Receiver Info), Field 77B (Regulatory Reporting). Screening focus: Ordering customer and beneficiary against all relevant sanctions lists. Red flag examples: Field 50 "AVENIDA CUBA" (Panama avenue, not Cuba) — false positive. Field 52 SWIFT code "BDCRCUHH" — CU indicates Cuba. Field 59 exchange house as beneficiary. Field 72 "FOR BENEFIT OF JOQUIN GUZMAN LOERA" — concealed true beneficiary with spelling variation of El Chapo. MT500 series: Elevated sanctions risk for sectoral sanctions, significant unstructured data generates false positives. BSA Rule 31 Travel Rule: FIs must pass transmitter name, account, address, amount, date, recipient info for $3,000+ transmittals. Sanctions apply to ALL transactions regardless of value.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'screening', title: 'SWIFT Message Screening' }
  },

  // ===== SANCTIONS REGIME REFERENCE =====
  {
    id: 'sanctions-training-major-bodies-reference',
    text: 'Major Sanctioning Bodies Quick Reference. UN: Multilateral, requires P5 consensus, legally binding on members, UN Charter Article 41. US: Unilateral, most extensive, extraterritorial reach, IEEPA/TWEA/various statutes. EU: Multilateral, no extraterritoriality, requires unanimity, CFSP decisions. FATF: Influential (not imposing), no formal power, influence through recommendations and blacklist/greylist. US Key Agencies: OFAC (Treasury, financial sanctions, SDN List), BIS (Commerce, export controls, Denied Persons List, EAR), FinCEN (Treasury, AML/Section 311 designations). Sanctions effectiveness factors: Multilateral > unilateral; most effective when imposer GDP ≥10x target; geographic proximity increases effectiveness; incentives for change increase effectiveness; globalization weakens unilateral sanctions. Case Study — Queensland Mines (1983-86): Australia unilaterally stopped uranium to France. Ineffective — uranium price dropped 50%, France replaced supply cheaply, Australia paid AU$26M in losses.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'reference', title: 'Major Bodies Reference' }
  },
  {
    id: 'sanctions-training-investigation-sources',
    text: 'Investigation Information Sources. Primary sources: UN Security Council Resolutions, EU Council Regulations/Decisions, US Executive Orders, all sanctions lists, trade activity lists (EU Common Military List, BIS Denied Persons, NRC Controls, UK Strategic Export Lists), internal customer records/transaction activity. Transaction "look backs": Review over specific time period to verify activity and identify red flags. Common: past 12 months first, extend if violation found. Red flag transaction types: Online purchases (made from anywhere), cross-border payments near sanctioned territories, MSB transactions. Customer outreach: Relationship managers conduct, communicate findings to compliance. Observe behavior — normal response: cooperation. Red flags: evasive, defensive, confrontational responses. Secondary sources: Google (document screenshots for file), social media (not reliable but useful for connections), corporate registers (Secretary of State), third-party databases (PEP coverage, sanctions lists, adverse media, vessel info), media publications (vary in accuracy), specialist teams (internal advisory, external legal, intelligence search providers).',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'investigations', title: 'Investigation Information Sources' }
  },
  {
    id: 'sanctions-training-confiscation-vs-freezing',
    text: 'Confiscation, Seizure, and Forfeiture vs. Freezing. Key difference: Frozen/blocked assets — target cannot control while sanctions in effect BUT still owns assets; once sanctions lifted, can access. Confiscation (after court order): Permanently deprive of criminal activity proceeds. Seizure (before court order): Law enforcement takes control. Civil Asset Forfeiture: Defund organized crime; assets unrelated to crime can be taken. Case Study — Mr. Ahmed Ezz (2011): Former Egyptian government member under Mubarak. Named on EU sanctions list during Arab Spring. Suspected of stealing government funds. Criminal confiscation proceedings in Egypt, Switzerland, EU simultaneously — overlapping and sometimes contradictory court decisions. Swiss Article 305 obligated freeze of money raising laundering suspicions. Resolution (early 2018): Swiss handed Egypt $24.2M from blocked accounts. New Egyptian government dropped charges. Management reporting obligations: Vary by jurisdiction. EU: Report without delay — all information guiding decision, nature/quantity of economic resources held. UK: Report when reasonable cause to suspect sanctions breach. US: Voluntary disclosure encouraged (mitigating factor), blocked/rejected funds reported within 10 business days.',
    metadata: { source: 'Sanctions Training', category: 'sanctions', section: 'asset_freezing', title: 'Confiscation vs Freezing & Reporting' }
  },
];

async function seed() {
  const rag = new RAGService();
  console.log(`\nSeeding Sanctions Training Data (${CHUNKS.length} chunks)...\n`);

  let total = 0;
  let failed = 0;

  for (const doc of CHUNKS) {
    try {
      await rag.index('regulatory_docs', doc.id, doc.text, doc.metadata);
      console.log(`  ✓ ${doc.id}`);
      total++;
    } catch (err) {
      console.error(`  ✗ ${doc.id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone! Seeded ${total}/${CHUNKS.length} chunks. ${failed} failed.`);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
