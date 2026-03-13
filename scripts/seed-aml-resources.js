#!/usr/bin/env node

/**
 * Seed AML/KYC resource knowledge into Pinecone RAG.
 * Covers: FATF typology reports, UK/EU regulatory frameworks, OSINT databases,
 * international bodies, country/sector risk, crypto intelligence, and beneficial
 * ownership registries.
 *
 * Usage: PINECONE_API_KEY=... node scripts/seed-aml-resources.js
 */

const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'marlowe-financial-crimes';
const NAMESPACE = 'regulatory_docs';

// ─── Curated content chunks ─────────────────────────────────────────────────

const CURATED_CHUNKS = [

  // ═══════════════════════════════════════════════════════════════════════════
  // FATF TYPOLOGY REPORTS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'fatf-tbml-typologies',
    title: 'FATF Trade-Based Money Laundering Typologies',
    category: 'fatf_typologies',
    subcategory: 'tbml',
    content: `FATF Trade-Based Money Laundering (2006, updated 2020). TBML exploits international trade to transfer value and disguise criminal proceeds. Core techniques: (1) Over-invoicing — goods invoiced above market value, excess payment transmitted as laundered funds. (2) Under-invoicing — goods invoiced below market value, importer resells at market price and retains difference. (3) Multiple invoicing — same shipment invoiced multiple times through different intermediary shell companies. (4) Phantom shipments — invoices generated for goods that never existed, supported by falsified bills of lading and certificates of origin. (5) Misrepresentation of quality/type — low-value goods described as high-value on commercial documents. (6) Black Market Peso Exchange (BMPE) — drug proceeds in US dollars used by peso brokers to purchase goods shipped to Latin America, sold for local currency. Red flags: significant discrepancies between goods description and HS codes; prices substantially above/below market; counterparties in high-risk jurisdictions with no prior trade history; circular shipping routes; front companies with no physical operations; trade volumes inconsistent with company size; payment from unrelated third parties. FATF found TBML is the primary value transfer method for drug trafficking organizations and a significant sanctions evasion vector. Source: FATF (2006) "Trade-Based Money Laundering"; FATF (2020) "Trade-Based Money Laundering: Trends and Developments".`
  },
  {
    id: 'fatf-professional-ml',
    title: 'FATF Professional Money Laundering Networks',
    category: 'fatf_typologies',
    subcategory: 'professional_ml',
    content: `FATF Professional Money Laundering (2018). Professional money launderers (PMLs) offer laundering as a service to multiple criminal organizations. They operate independently from the predicate offense and specialize in moving and concealing illicit funds. Key characteristics: (1) Third-party laundering — PMLs are not involved in the underlying crime; they provide expertise in financial systems, corporate structures, and regulatory gaps. (2) Gatekeepers — lawyers, accountants, trust and company service providers (TCSPs), real estate agents who facilitate laundering through their professional roles. (3) Underground banking — hawala, fei-ch'ien, and informal value transfer systems operating outside regulated channels. (4) Trade-based networks — PMLs who specialize in TBML, operating import/export businesses as fronts. (5) Crypto laundering services — mixing services, OTC brokers, and nested exchanges. Typologies: PMLs create layered corporate structures across multiple jurisdictions; use nominees and proxies; maintain networks of shell companies ready for immediate use; exploit attorney-client privilege to shield transactions; use real estate for integration; employ funnel accounts. Red flags: same professional forming multiple entities for unrelated clients; complex structures with no clear business purpose; professionals declining to provide beneficial ownership information; payments to professionals from third parties or offshore accounts. Source: FATF (2018) "Professional Money Laundering".`
  },
  {
    id: 'fatf-free-trade-zones',
    title: 'FATF Money Laundering Through Free Trade Zones',
    category: 'fatf_typologies',
    subcategory: 'free_trade_zones',
    content: `FATF Free Trade Zone Vulnerabilities (2010). Free trade zones (FTZs) are geographic areas where goods can be imported, stored, manufactured, and re-exported with reduced customs oversight. Over 4,000 FTZs exist in 135+ countries. ML/TF vulnerabilities: (1) Reduced regulatory oversight — FTZs often operate under different customs and AML regimes than the host country. (2) Opacity of transactions — goods can be re-invoiced, relabeled, and transshipped within FTZs without external scrutiny. (3) Shell company proliferation — easy company formation within FTZs with minimal beneficial ownership requirements. (4) Trade-based laundering — FTZs facilitate over/under-invoicing by providing a location where goods change hands between related parties. (5) Sanctions evasion — goods can be re-exported from FTZs to sanctioned destinations after removing origin markings. High-risk FTZs: Jebel Ali (UAE), Colon Free Zone (Panama), Labuan (Malaysia), various Chinese FTZs. Red flags: goods entering and leaving FTZs without physical inspection; significant price changes between import and re-export invoices; companies registered in FTZ with no physical presence; frequent changes in consignee or destination; use of generic product descriptions. Source: FATF (2010) "Money Laundering Vulnerabilities of Free Trade Zones".`
  },
  {
    id: 'fatf-real-estate-bo',
    title: 'FATF Real Estate ML and Beneficial Ownership Concealment',
    category: 'fatf_typologies',
    subcategory: 'real_estate',
    content: `FATF Real Estate Money Laundering and Beneficial Ownership Concealment (2022). Real estate is one of the most commonly exploited sectors for money laundering globally. Key typologies: (1) All-cash purchases through anonymous LLCs — eliminates bank scrutiny and mortgage underwriting KYC. (2) Layered ownership — property held by a trust that owns an LLC that is owned by an offshore company, concealing the UBO. (3) Rapid flipping — purchasing property at below-market value, performing minimal improvements, selling at inflated price to a related party to generate "clean" sale proceeds. (4) Renovation-based laundering — using cash-intensive renovation to inject illicit funds into property value. (5) Mortgage fraud as laundering — obtaining mortgages with fabricated income documentation, using loan proceeds. (6) Third-party straw buyers — using individuals with clean backgrounds to purchase property on behalf of criminals/PEPs. (7) Luxury property as store of value — PEPs and kleptocrats purchasing high-end properties in global cities (London, NYC, Miami, Vancouver, Dubai) as safe haven assets. FinCEN Geographic Targeting Orders (GTOs) require reporting of all-cash real estate purchases above thresholds in major US metro areas. Red flags: purchases significantly above/below market value; buyer has no connection to property location; immediate re-listing after purchase; complex corporate ownership with no clear business rationale; source of funds from high-risk jurisdictions. Source: FATF (2022) "Concealment of Beneficial Ownership".`
  },
  {
    id: 'fatf-vasp-guidance',
    title: 'FATF Virtual Asset Service Provider Guidance',
    category: 'fatf_typologies',
    subcategory: 'vasp',
    content: `FATF Updated Guidance for Virtual Assets and VASPs (2021). Virtual assets (VAs) present unique ML/TF risks due to speed, global reach, and potential anonymity. Key requirements: (1) VASPs must be licensed/registered and subject to AML/CFT supervision. (2) Travel Rule — VASPs must transmit originator and beneficiary information for VA transfers above applicable thresholds (Recommendation 16). (3) Risk-based approach — countries must assess VA/VASP risks and apply appropriate mitigation. FATF-identified typologies: (a) Mixing/tumbling services — pooling and redistributing funds to break transaction trails (Tornado Cash, Wasabi Wallet, Samourai Whirlpool). (b) Chain-hopping — converting between different virtual assets across multiple blockchains to obscure origin. (c) Privacy coins — Monero (XMR), Zcash (ZEC), Dash with enhanced privacy features that resist blockchain analysis. (d) Unhosted/self-hosted wallets — transfers to wallets not controlled by a VASP, bypassing KYC requirements. (e) Peer-to-peer exchanges — direct trades between individuals without VASP intermediation. (f) DeFi protocols — decentralized exchanges, lending platforms, and bridges that operate without centralized KYC. (g) Peel chains — sending progressively smaller amounts through a series of wallets to disperse funds. Red flag indicators: transactions involving mixing services; multiple rapid conversions between VAs; transactions from/to darknet marketplaces; use of VASPs registered in jurisdictions with weak AML; structuring below travel rule thresholds; newly created wallets receiving large deposits. Source: FATF (2021) "Updated Guidance for a Risk-Based Approach to Virtual Assets and VASPs".`
  },
  {
    id: 'fatf-crypto-red-flags',
    title: 'FATF Virtual Asset Red Flag Indicators',
    category: 'fatf_typologies',
    subcategory: 'crypto_red_flags',
    content: `FATF Virtual Assets Red Flag Indicators (2020). Comprehensive catalog of red flags for VA transactions organized by category. Transaction patterns: (a) Structuring — multiple transactions just below reporting/identification thresholds. (b) Rapid movement — funds deposited and immediately withdrawn or converted with no apparent business purpose. (c) Round-trip transactions — VAs sent to an external wallet and returned in a different form. (d) High-risk jurisdiction — transactions involving VASPs/wallets in countries with weak AML frameworks. (e) Darknet — transactions linked to known darknet marketplace addresses. Anonymity-seeking behavior: (a) Using mixing/tumbling services. (b) Converting to privacy coins. (c) Using multiple wallets for no apparent reason. (d) Refusing to provide identity documentation. (e) Using VPN or Tor to access VASP. Sender/recipient patterns: (a) Newly created accounts funding large transactions. (b) Dormant accounts suddenly activated with high-volume activity. (c) Transactions with wallets flagged by blockchain analytics firms. (d) Funds from known ransomware, fraud, or theft addresses. (e) Interactions with OFAC-designated addresses (Tornado Cash, Blender.io, etc.). Source-of-funds concerns: (a) Funds originating from initial coin offerings (ICOs) with no legitimate project. (b) Funds from gambling platforms used to obscure origin. (c) Deposits from crypto ATMs in high-crime areas. Source: FATF (2020) "Virtual Assets Red Flag Indicators of Money Laundering and Terrorist Financing".`
  },
  {
    id: 'fatf-npo-tf-guidance',
    title: 'FATF Non-Profit Organization Terrorist Financing Guidance',
    category: 'fatf_typologies',
    subcategory: 'npo',
    content: `FATF NPO Guidance and Terrorist Financing Risk (Recommendation 8, updated 2023). Non-profit organizations can be exploited for terrorist financing through three vectors: (1) Diversion — legitimate NPO funds diverted by insiders to terrorist organizations. (2) Affiliation — NPO used as cover to transfer funds to conflict zones under humanitarian pretexts. (3) Sham NPO — organization created solely to collect and channel funds to designated entities. Risk indicators: NPOs operating in or near conflict zones; organizations with minimal charitable output relative to funds raised; donors who are designated persons or entities; lack of transparent financial reporting; unusual international wire transfers inconsistent with stated charitable mission; organizations that change names, locations, or leadership frequently; NPOs registered in countries with weak oversight. FATF emphasizes risk-based approach — not all NPOs are high-risk. Those involved in service delivery (operating programs) generally pose lower risk than those primarily involved in financial intermediation (raising and transferring funds). Countries should: identify NPO subset at risk; conduct outreach to the sector; supervise or monitor at-risk NPOs; investigate and prosecute TF through NPOs. Source: FATF (2023) "Risk-Based Approach for NPOs" and Recommendation 8 Interpretive Note.`
  },
  {
    id: 'fatf-correspondent-banking',
    title: 'FATF Correspondent Banking Due Diligence',
    category: 'fatf_typologies',
    subcategory: 'correspondent_banking',
    content: `FATF Correspondent Banking Guidance (2016). Correspondent banking relationships create ML/TF risk because the correspondent bank processes transactions on behalf of the respondent bank's customers without direct KYC on those customers. Key risks: (1) Nested accounts — respondent bank allows other institutions to use its correspondent account, creating layers of opacity. (2) Payable-through accounts — respondent bank's customers directly access the correspondent's payment system. (3) Wire stripping — respondent bank removes originator/beneficiary information from SWIFT messages before forwarding to correspondent. (4) Shell bank relationships — correspondent bank unknowingly processes transactions for a shell bank with no physical presence. FATF Recommendation 13 requires: respondent bank must have adequate AML controls; correspondent must assess respondent's AML program; correspondent must obtain senior management approval for new relationships; correspondent must understand respective AML responsibilities. Due diligence requirements: understand respondent's ownership/management structure; assess respondent's AML/CFT controls; determine whether respondent provides correspondent services to other banks (downstream or nested); assess the regulatory environment in respondent's jurisdiction; ongoing monitoring of the relationship. Wolfsberg Group Correspondent Banking Due Diligence Questionnaire (CBDDQ) provides standardized assessment framework. Red flags: respondent bank in FATF high-risk jurisdiction; respondent with known regulatory issues; high volume of transactions with no clear business rationale; respondent declining to complete CBDDQ. Source: FATF (2016) "Guidance on Correspondent Banking Services".`
  },
  {
    id: 'fatf-cbi-rbi-risks',
    title: 'FATF Citizenship/Residency by Investment Risks',
    category: 'fatf_typologies',
    subcategory: 'cbi',
    content: `FATF Citizenship and Residency by Investment (CBI/RBI) Guidance (2022). CBI/RBI programs allow individuals to obtain citizenship or residency in exchange for investment, typically in real estate, government bonds, or business ventures. ML/TF risks: (1) Identity laundering — criminals, PEPs, or sanctioned persons obtaining new identity documents in a new jurisdiction. (2) Sanctions circumvention — designated individuals using CBI passport to access financial systems they would otherwise be blocked from. (3) Tax evasion — obtaining residence in low/no-tax jurisdictions to avoid home country taxation. (4) Shell company formation — using CBI-obtained nationality to form companies in the new jurisdiction, obscuring beneficial ownership. High-risk CBI programs (historically): Cyprus (terminated 2020 after corruption scandals), Malta, St. Kitts and Nevis, Dominica, Antigua and Barbuda, Vanuatu, Turkey, Montenegro. FATF-identified red flags: applicants from high-risk jurisdictions or under sanctions; applicants who have been refused citizenship/residency elsewhere; use of intermediaries/agents to obscure the applicant's identity; investment funds originating from high-risk jurisdictions; applicants with adverse media or criminal records; renouncing original citizenship immediately after obtaining CBI; applicants with no genuine connection to the country. OECD has flagged CBI/RBI programs as potential conduits for CRS (Common Reporting Standard) avoidance. Source: FATF (2022) "Misuse of Citizenship and Residency by Investment Programmes".`
  },
  {
    id: 'fatf-insurance-ml',
    title: 'FATF Money Laundering in the Insurance Sector',
    category: 'fatf_typologies',
    subcategory: 'insurance',
    content: `FATF Money Laundering in the Insurance Sector (2005, ongoing relevance). Insurance products can be exploited for ML through multiple mechanisms: (1) Single-premium life insurance — criminal purchases policy with lump sum, then surrenders it early, receiving a "clean" check from the insurer minus surrender charges. (2) Overpayment of premiums — paying excess premiums and requesting refund by check, converting cash to clean funds. (3) Policy loans — borrowing against the cash value of a policy funded with illicit proceeds. (4) Reinsurance fronting — ceding premiums to a shell reinsurer offshore, moving funds internationally. (5) Captive insurance abuse — creating a captive insurer, paying inflated premiums that accumulate tax-free, then liquidating. (6) Third-party premium payments — having unrelated parties pay premiums to introduce illicit funds. (7) Free-look period exploitation — purchasing and canceling policies within free-look period to receive a refund. Red flags: customer more interested in cancellation terms than coverage; source of premium payments unclear or from high-risk jurisdiction; customer overpays premium and requests refund; customer purchases annuity with cash near threshold amounts; frequent policy replacements or early surrenders; complex reinsurance arrangements with offshore entities; customer is a PEP with no clear need for the product. Source: FATF (2005) "ML in the Insurance Sector"; IAIS AML/CFT guidance.`
  },
  {
    id: 'fatf-hawala-ivts',
    title: 'FATF Hawala and Informal Value Transfer Systems',
    category: 'fatf_typologies',
    subcategory: 'hawala',
    content: `FATF Hawala and Other Similar Service Providers (2013). Hawala is an informal value transfer system where money is transferred without physically moving it, using a network of brokers (hawaladars). Process: (1) Sender gives cash to hawaladar A in country X. (2) Hawaladar A contacts hawaladar B in country Y via phone/messaging. (3) Hawaladar B pays recipient in local currency. (4) Settlement between hawaladars occurs later through trade, reverse transactions, or formal banking. ML/TF risks: minimal record-keeping; no KYC requirements; difficult to detect and monitor; commonly used in regions with limited banking infrastructure (Somalia, Afghanistan, parts of South Asia). Legitimate uses: migrant remittances to underbanked regions; faster and cheaper than formal channels; trusted within diaspora communities. Red flag indicators: structuring of wire transfers to hawala hub countries (UAE, Pakistan, India); customers sending frequent small amounts to the same country; business accounts used for apparent personal remittances; cash-intensive businesses (convenience stores, gas stations) with unexplained wire activity; sudden spikes in remittance activity to conflict zones. Regulatory approach: FATF recommends licensing/registration of hawala operators (Recommendation 14); applying AML/CFT obligations proportionate to risk; understanding that prohibition drives activity further underground. Source: FATF (2013) "The Role of Hawala and Other Similar Service Providers in Money Laundering and Terrorist Financing".`
  },
  {
    id: 'fatf-art-antiquities-ml',
    title: 'FATF Money Laundering Through Art and Antiquities',
    category: 'fatf_typologies',
    subcategory: 'art',
    content: `FATF Money Laundering and Terrorist Financing in the Art and Antiquities Market (2023). The art market's opacity, high values, and subjective pricing make it attractive for ML. Key vulnerabilities: (1) Subjective valuation — no objective pricing mechanism, enabling manipulation of transaction values. (2) Anonymous transactions — historically, art sales did not require buyer identification; private sales remain largely unregulated. (3) Freeport storage — art stored in tax-free, duty-free facilities (Geneva, Luxembourg, Singapore, Delaware) can change ownership without physical movement or customs scrutiny. (4) High value, portable — paintings, sculptures, and antiquities can represent millions in value while being physically compact. Typologies: (a) Shell company purchases — anonymous LLC buys art at auction, concealing the true buyer. (b) Over/under-valuation — art donated to charities at inflated appraisals for tax deductions; or purchased at suppressed prices from insiders. (c) Circular transactions — same artwork sold repeatedly between related parties at increasing prices to create appearance of appreciation and clean funds. (d) Freeport laundering — art purchased and stored in freeport, ownership transferred through private contracts without public record. (e) Looted antiquities — trafficking in stolen cultural property, particularly from conflict zones (Syria, Iraq, Libya), proceeds flowing to armed groups. AMLD6 brings art dealers under AML obligations for transactions above EUR 10,000. US AMLA 2020 directed Treasury to study antiquities market ML risks. Red flags: buyer shows no interest in the art itself; payment from offshore accounts or third parties; immediate resale at significantly different price; complex ownership structures for art purchases; purchases at auction using agents or nominees. Source: FATF (2023) "ML/TF in the Art and Antiquities Market".`
  },
  {
    id: 'fatf-football-ml',
    title: 'FATF Money Laundering Through Football',
    category: 'fatf_typologies',
    subcategory: 'football',
    content: `FATF Money Laundering Through the Football Sector (2009). Professional football's massive financial flows, complex transfer system, and international reach create ML opportunities. Key typologies: (1) Player transfer fee manipulation — inflated or fictitious transfer fees paid through intermediary companies to launder funds. (2) Third-party ownership (TPO) — investors acquire economic rights to a player's future transfer value, enabling opaque cross-border payments and potential match-fixing incentives. (3) Club acquisition — purchasing football clubs to gain access to their financial infrastructure, banking relationships, and media visibility, while using the club to process illicit funds through ticket sales, merchandise, and broadcasting contracts. (4) Image rights exploitation — channeling payments through offshore companies that hold a player's image rights, enabling tax evasion and fund movement. (5) Betting-related laundering — using football betting markets to launder money through coordinated placing and laying of bets, particularly on manipulated matches. (6) Agent/intermediary abuse — football agents receiving and distributing payments through multiple jurisdictions with limited oversight. Red flags: transfer fees significantly above/below player's market value; payments to intermediaries in secrecy jurisdictions; club with financial performance inconsistent with sporting performance; complex chains of intermediary companies in player transfers; undisclosed beneficial ownership of clubs. FIFA, UEFA, and national FAs have introduced financial fair play and agent regulations, but enforcement remains inconsistent. Source: FATF (2009) "Money Laundering Through the Football Sector".`
  },
  {
    id: 'fatf-proliferation-financing',
    title: 'FATF Proliferation Financing Risk Assessment',
    category: 'fatf_typologies',
    subcategory: 'proliferation',
    content: `FATF Guidance on Proliferation Financing Risk Assessment and Mitigation (2021). Proliferation financing (PF) involves providing funds or financial services for the transfer/export of nuclear, chemical, or biological weapons, their means of delivery, and related materials. FATF Recommendations 1 and 2 require countries to assess PF risks. Key proliferation actors: Iran, DPRK (North Korea). DPRK procurement methods: (1) Front companies — entities created in third countries (China, Russia, UAE, Malaysia, Singapore) to procure dual-use goods. (2) Diplomatic channels — using diplomatic pouches and embassies for procurement and financial transfers. (3) Shipping networks — complex vessel ownership chains, flag-hopping, AIS manipulation, ship-to-ship transfers. (4) Cyber theft — DPRK-linked groups (Lazarus Group) stealing cryptocurrency to fund WMD programs ($1.7B+ estimated). (5) IT worker revenue — DPRK nationals working remotely under false identities, sending wages back to regime. (6) Arms brokering — DPRK entities selling weapons and military training to African and Middle Eastern countries. Iran procurement methods: front companies in Turkey, UAE, China purchasing dual-use items; exploitation of free trade zones; academic/research institution cover for military procurement; use of hawala and informal banking for payments. Financial institution obligations: screen against relevant UN, OFAC, and EU proliferation-related lists; assess customers against proliferation indicators; file suspicious activity reports for potential PF activity; implement targeted financial sanctions (asset freezing) against designated proliferators. Source: FATF (2021) "Proliferation Financing Risk Assessment Guidance".`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UK REGULATORY FRAMEWORK
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'uk-fca-financial-crime-guide',
    title: 'UK FCA Financial Crime Guide',
    category: 'uk_regulation',
    subcategory: 'fca',
    content: `UK Financial Conduct Authority (FCA) Financial Crime Guide (FCG). The FCG sets out the FCA's expectations for firms' systems and controls against financial crime, covering money laundering, terrorist financing, sanctions, bribery, corruption, and fraud. Key requirements: (1) Governance — firms must have a designated Money Laundering Reporting Officer (MLRO) with sufficient seniority and resources. (2) Risk assessment — firms must conduct enterprise-wide risk assessments covering customer, product, delivery channel, and geographic risks. (3) Customer due diligence (CDD) — standard, simplified, and enhanced DD depending on risk level; enhanced DD mandatory for PEPs and high-risk business relationships. (4) Suspicious Activity Reports (SARs) — firms must file SARs with the National Crime Agency (NCA) via the SAR Online system; ~900,000+ SARs filed annually. (5) Transaction monitoring — automated systems expected for firms above certain thresholds; must be calibrated and regularly reviewed. (6) Sanctions screening — real-time screening against OFSI (Office of Financial Sanctions Implementation) consolidated list; breaches are strict liability criminal offenses in the UK. (7) Record keeping — 5 years after relationship ends. FCA enforcement powers: fines (unlimited), public censure, prohibition orders, criminal prosecution. Notable FCA AML fines: HSBC (£63.9M, 2021), NatWest (£264.8M, 2021), Deutsche Bank (£163M, 2017), Standard Chartered (£102M, 2019). Source: FCA Handbook FCG; Proceeds of Crime Act 2002 (POCA); Money Laundering Regulations 2017 (MLR 2017).`
  },
  {
    id: 'uk-unexplained-wealth-orders',
    title: 'UK Unexplained Wealth Orders',
    category: 'uk_regulation',
    subcategory: 'uwo',
    content: `UK Unexplained Wealth Orders (UWOs). Introduced by the Criminal Finances Act 2017. UWOs are civil court orders requiring the respondent to explain how they obtained property worth over £50,000 if there are reasonable grounds to suspect the respondent's known lawfully obtained income would be insufficient. Key features: (1) Reversal of burden of proof — respondent must explain the source of wealth, rather than enforcement proving criminal origin. (2) Applicable to PEPs — can be issued against any PEP (foreign or domestic) or person suspected of involvement in serious crime. (3) Interim freezing orders — property can be frozen pending the UWO response. (4) Failure to comply — property is presumed to be recoverable (proceeds of crime) and can be subject to civil recovery proceedings under POCA Part 5. Notable UWO cases: Zamira Hajiyeva (wife of Azerbaijani banker, £22M Harrods spending, Knightsbridge property); NCA v three London properties linked to Kazakh officials. Challenges: NCA lost the Baker Street UWO case (2020), leading to concerns about NCA's capacity and risk appetite. Economic Crime (Transparency and Enforcement) Act 2022 reformed UWOs: removed cost liability for enforcement agencies in unsuccessful cases; extended scope to property held by trusts. UWOs are a key tool for addressing kleptocracy and PEP wealth concealment in UK real estate. Source: Criminal Finances Act 2017 s.1; ECTE Act 2022.`
  },
  {
    id: 'uk-companies-house-reform',
    title: 'UK Companies House Reform — Economic Crime Act 2022',
    category: 'uk_regulation',
    subcategory: 'companies_house',
    content: `UK Companies House Reform under the Economic Crime and Corporate Transparency Act 2023 (ECCTA). Historically, UK Companies House was a passive registry — it accepted filings without verification, making the UK a favored jurisdiction for shell company formation. Key reforms: (1) Identity verification — all directors, PSCs (persons of significant control), and those filing on behalf of companies must verify their identity with Companies House. (2) Registered office address — must be an "appropriate" address where documents can be acknowledged; PO boxes and some virtual offices will no longer qualify. (3) Enhanced powers — Companies House gains power to query, refuse, and remove filings that appear fraudulent or incorrect. (4) Cross-referencing — Companies House will share data with law enforcement and AML supervisors in real time. (5) Corporate directors — tightening rules on use of corporate directors (entities serving as directors of other entities), which enable opacity. (6) Limited partnerships — reforms to Scottish Limited Partnerships (SLPs) and English Limited Partnerships, which were heavily exploited in laundering schemes (e.g., Russian Laundromat used UK LLPs). (7) Registered Email Address — mandatory verified email for all companies. Context: Global Witness reported that over 4,000 UK companies involved in 52 money laundering and corruption cases between 2004-2021. The Pandora Papers and Panama Papers exposed extensive use of UK corporate structures for illicit purposes. Formations House case: UK company formation agent facilitated creation of hundreds of shell companies used for fraud and money laundering. Source: ECCTA 2023; Companies House strategic plan 2024-2029.`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EU REGULATORY FRAMEWORK
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'eu-amld6-framework',
    title: 'EU Anti-Money Laundering Directive 6 (AMLD6)',
    category: 'eu_regulation',
    subcategory: 'amld',
    content: `EU Sixth Anti-Money Laundering Directive (AMLD6 / Directive 2018/1673). AMLD6 strengthened the EU's AML framework in several ways: (1) Harmonized predicate offenses — established 22 predicate offenses that must be criminalized across all member states, including cybercrime, environmental crime, and tax crimes. (2) Extended criminal liability — ML offenses can now be prosecuted in the country where the predicate offense occurred, where the laundering occurred, or where the offender is a national. (3) Corporate criminal liability — legal persons (companies) can be held criminally liable for ML committed for their benefit by persons in leading positions. (4) Self-laundering — criminalized laundering of proceeds of one's own criminal conduct (previously not a crime in some jurisdictions). (5) Enhanced penalties — minimum 4-year maximum imprisonment for ML offenses; aggravating factors for criminal organizations and professional enablers. (6) Aiding and abetting — participation in, facilitation of, and conspiracy to commit ML are all criminal offenses. EU AML Authority (AMLA) established in Frankfurt (2024) — new supranational authority for direct AML/CFT supervision of the highest-risk cross-border financial institutions. AMLA will: directly supervise ~40 highest-risk entities; coordinate national FIU cooperation; issue binding technical standards. EU Anti-Money Laundering Regulation (AMLR) — single, directly applicable rulebook replacing patchwork of national transpositions. Brings crypto-asset service providers, luxury goods dealers, football clubs, and professional football under AML obligations. Source: Directive 2018/1673 (AMLD6); Regulation 2024/1624 (AMLR).`
  },
  {
    id: 'eu-eba-risk-factors',
    title: 'EBA ML/TF Risk Factor Guidelines',
    category: 'eu_regulation',
    subcategory: 'eba',
    content: `European Banking Authority (EBA) Guidelines on ML/TF Risk Factors (EBA/GL/2021/02). These guidelines set out factors financial institutions should consider when assessing ML/TF risks and the extent of CDD measures. Customer risk factors: (a) Non-resident customers. (b) Complex ownership structures with no apparent legitimate purpose. (c) Cash-intensive businesses. (d) PEPs, family members, and close associates. (e) Customers in high-risk third countries. (f) Legal arrangements (trusts, foundations). Product/service risk factors: (a) Private banking. (b) Anonymous or bearer-share products. (c) Correspondent banking. (d) New products with untested AML controls. (e) Cash-heavy services. Geographic risk factors: (a) FATF high-risk jurisdictions. (b) Countries with high levels of corruption (TI CPI below 40). (c) Countries subject to sanctions or embargoes. (d) Countries identified as having significant levels of organized crime. (e) Tax havens / financial secrecy jurisdictions (Tax Justice Network FSI). Delivery channel risk factors: (a) Non-face-to-face business relationships. (b) Payments from unknown third parties. (c) Transactions involving new technologies. Sector-specific annexes cover: credit institutions, money remitters, wealth management, retail banking, trade finance, life insurance, investment firms, payment institutions, crypto-asset service providers. Enhanced Due Diligence (EDD) measures: deeper investigation of source of wealth and funds; additional identity verification; more frequent reviews; senior management approval; enhanced ongoing monitoring. Source: EBA/GL/2021/02; EBA AML/CFT Policy page.`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OSINT & OPEN DATABASES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'osint-icij-investigations',
    title: 'ICIJ Investigations and Offshore Leaks Database',
    category: 'osint',
    subcategory: 'icij',
    content: `International Consortium of Investigative Journalists (ICIJ) — Major Investigations and Offshore Leaks Database. The ICIJ Offshore Leaks Database is the world's largest freely searchable repository of offshore financial data, compiled from multiple leaked datasets. Key investigations: (1) Panama Papers (2016) — 11.5 million files from Mossack Fonseca, exposing shell companies and offshore accounts of world leaders, PEPs, and their associates. Revealed structures used by Putin associates, Icelandic PM, Pakistani PM, and hundreds of other PEPs. (2) Paradise Papers (2017) — 13.4 million files from Appleby and Asiaciti Trust, exposing offshore investments by Queen Elizabeth II, US Commerce Secretary Wilbur Ross, and major multinationals. (3) Pandora Papers (2021) — 11.9 million files from 14 offshore service providers, exposing assets of 35 current/former heads of state, 300+ public officials. Largest-ever leak of offshore financial data. (4) FinCEN Files (2020) — 2,100+ suspicious activity reports (SARs) filed with FinCEN, revealing $2 trillion in suspicious transactions flagged by global banks between 1999-2017. Exposed how major banks continued processing suspicious payments despite filing SARs. (5) Luanda Leaks (2020) — exposed how Isabel dos Santos, Africa's richest woman, built her fortune through exploitation of Angolan state assets. Offshore Leaks Database: searchable at offshoreleaks.icij.org; contains 800,000+ entities; searchable by name, jurisdiction, intermediary, address; free public access. Use in compliance: cross-reference subjects against ICIJ data during enhanced due diligence; flag connections to known offshore structures; verify corporate ownership chains. Source: ICIJ.org.`
  },
  {
    id: 'osint-occrp-aleph',
    title: 'OCCRP Aleph — Cross-Referenced Investigation Database',
    category: 'osint',
    subcategory: 'occrp',
    content: `Organized Crime and Corruption Reporting Project (OCCRP) Aleph. Aleph is an open-source data platform that cross-references corporate records, court filings, sanctions lists, leaks databases, and investigative journalism findings. Data sources include: ICIJ leaks (Panama Papers, Paradise Papers, Pandora Papers), national corporate registries (100+ countries), sanctions lists (OFAC, EU, UN, UK), court records, land registries, procurement databases, and OCCRP's own investigative findings. Key OCCRP investigations: (1) Russian Laundromat — $20.8 billion laundered out of Russia through Moldovan and Latvian banks using UK and Scots law shell structures (LLPs), 2010-2014. Scheme used fabricated loan agreements and corrupt Moldovan court judgments to authorize wire transfers. (2) Azerbaijani Laundromat — $2.9 billion laundered through four UK-registered shell companies using Danske Bank's Estonian branch, funding lobbying of European politicians. (3) Troika Laundromat — $4.6 billion moved through Lithuanian banks using Russian shell companies. Aleph capabilities: entity search across 1B+ records; network visualization showing connections between entities; cross-dataset matching; free API access for registered journalists and researchers. Use in compliance: search subjects during EDD; identify undisclosed corporate relationships; discover adverse media; trace corporate ownership across jurisdictions. Source: aleph.occrp.org; OCCRP.org.`
  },
  {
    id: 'osint-opensanctions-opencorporates',
    title: 'OpenSanctions and OpenCorporates Data Sources',
    category: 'osint',
    subcategory: 'open_data',
    content: `OpenSanctions and OpenCorporates — Open-Source Compliance Data. OpenSanctions (opensanctions.org): Aggregates sanctions lists, PEP databases, and enforcement data from 100+ sources into a unified, deduplicated dataset. Covers: OFAC SDN/SSI/CAPTA, UN Consolidated List, EU Consolidated List, UK OFSI, Australian DFAT, Canadian OSFI, plus national lists from 40+ countries. Also includes: Interpol Red/Yellow Notices, World Bank debarment list, crime watchlists, PEP registries. Updated daily. Free for non-commercial use; API available. Key advantage over raw OFAC data: cross-referencing between lists, alias normalization, entity deduplication, relationship mapping (family members, associates, owned entities). OpenCorporates (opencorporates.com): World's largest open database of companies, with 200M+ company records from 140+ jurisdictions. Data includes: company name, registration number, status (active/dissolved/struck off), registered address, directors, filing history. Use in compliance: verify corporate existence; identify directors and related entities; detect nominee directors appearing across multiple entities; identify recently formed companies; cross-reference against sanctions/PEP hits. OpenOwnership Register (register.openownership.org): Beneficial ownership data using the Beneficial Ownership Data Standard (BODS). Aggregates disclosed UBO data from countries implementing BO transparency requirements. GLEIF LEI Database: Legal Entity Identifier system covering 2.4M+ entities globally; provides standardized entity identification and parent/subsidiary relationships. Source: opensanctions.org; opencorporates.com; register.openownership.org; gleif.org.`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNATIONAL BODIES & FRAMEWORKS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'intl-wolfsberg-principles',
    title: 'Wolfsberg Group Anti-Financial Crime Principles',
    category: 'international',
    subcategory: 'wolfsberg',
    content: `Wolfsberg Group — Anti-Financial Crime Principles. The Wolfsberg Group is an association of 13 global banks (including Barclays, Citi, Deutsche Bank, Goldman Sachs, HSBC, JPMorgan, UBS) that develops frameworks and guidance for managing financial crime risks. Key publications: (1) Wolfsberg AML Principles (2012, revised 2023) — establishes baseline expectations for AML programs including risk assessment, KYC/CDD, transaction monitoring, and suspicious activity reporting. (2) Correspondent Banking Due Diligence Questionnaire (CBDDQ) — standardized questionnaire used globally by banks to assess AML/CFT controls of correspondent banking partners. De facto industry standard. (3) Trade Finance Principles — guidance on AML risks in trade finance, covering letters of credit, documentary collections, and open account transactions. (4) Payment Transparency Standards — requirements for complete and accurate originator/beneficiary information in wire transfers. (5) Sanctions Screening Guidance — best practices for sanctions screening including name matching algorithms, threshold calibration, alert disposition, and list management. (6) Beneficial Ownership Guidance — approaches to identifying and verifying UBOs, including complex structures. (7) Negative News Screening Guidance — framework for using adverse media as part of CDD. While not legally binding, Wolfsberg principles are widely adopted by global banks and referenced by regulators as industry best practice. Source: wolfsberg-principles.com.`
  },
  {
    id: 'intl-egmont-fiu-network',
    title: 'Egmont Group — Financial Intelligence Unit Network',
    category: 'international',
    subcategory: 'egmont',
    content: `Egmont Group of Financial Intelligence Units. The Egmont Group is a network of 166 Financial Intelligence Units (FIUs) facilitating international cooperation in combating money laundering and terrorist financing. Key functions: (1) Egmont Secure Web (ESW) — encrypted communication network for FIU-to-FIU information exchange. Enables rapid sharing of financial intelligence across borders without formal mutual legal assistance treaty (MLAT) requests. (2) Operational analysis — FIUs receive, analyze, and disseminate financial disclosures (SARs/STRs) from reporting entities. (3) Strategic analysis — FIUs produce typology reports identifying emerging ML/TF trends and methods. (4) Spontaneous dissemination — FIUs can proactively share information with foreign counterparts when they identify cross-border ML/TF concerns. FIU types: administrative (most common, e.g., FinCEN, AUSTRAC, FIU-NL), law enforcement (e.g., UK NCA/UKFIU), judicial/prosecutorial, or hybrid. FATF Recommendation 29 requires countries to establish an FIU as the national center for receiving, analyzing, and disseminating financial disclosures. Common challenges: FIU capacity and resourcing; quality of SARs/STRs from private sector; delays in cross-border information sharing; privacy/data protection constraints. Source: egmontgroup.org.`
  },
  {
    id: 'intl-worldbank-star',
    title: 'World Bank StAR — Stolen Asset Recovery Initiative',
    category: 'international',
    subcategory: 'star',
    content: `World Bank / UNODC Stolen Asset Recovery Initiative (StAR). StAR supports developing countries in recovering assets stolen through corruption and hidden in foreign jurisdictions. Estimated $20-40 billion stolen from developing countries annually through corruption. Key findings: (1) Asset concealment methods — stolen assets typically laundered through shell companies in secrecy jurisdictions, invested in real estate (London, NYC, Dubai, Paris), luxury goods, and financial instruments. (2) Recovery challenges — mutual legal assistance (MLA) requests take 2-5 years; legal systems differ in standards of proof; some jurisdictions refuse cooperation; political will varies. (3) Recovery statistics — only $5 billion in assets recovered between 2010-2020 despite estimates of hundreds of billions stolen. (4) Key secrecy jurisdictions for asset concealment — BVI, Cayman Islands, Jersey, Guernsey, Panama, Switzerland, Luxembourg, Singapore, Hong Kong, UAE, US (Delaware, Nevada, Wyoming). StAR Asset Recovery database tracks major recovery cases globally. UNCAC (UN Convention Against Corruption) Chapter V provides the framework for asset recovery, including provisions for: direct recovery by states; international cooperation for confiscation; return and disposal of assets. Source: star.worldbank.org; UNODC.org.`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COUNTRY & SECTOR RISK
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'risk-basel-aml-index',
    title: 'Basel AML Index — Country Risk Scoring',
    category: 'country_risk',
    subcategory: 'basel',
    content: `Basel AML Index — Country Money Laundering and Terrorist Financing Risk Scoring. Published annually by the Basel Institute on Governance. Covers 203 jurisdictions. Methodology: composite index combining 18 indicators across 5 domains: (1) Quality of AML/CFT Framework — FATF mutual evaluation scores for technical compliance and effectiveness. (2) Bribery and Corruption — Transparency International CPI, World Bank governance indicators. (3) Financial Transparency and Standards — OECD Global Forum tax transparency ratings, adherence to CRS. (4) Public Transparency and Accountability — budget transparency, judicial independence, press freedom. (5) Legal and Political Risks — rule of law, political stability, regulatory quality. Scoring: 0 (lowest risk) to 10 (highest risk). High-risk countries consistently scoring above 6.0: Myanmar, Haiti, Mozambique, Madagascar, Sierra Leone, Guinea-Bissau, Laos, Cambodia, Tanzania. Lower-risk countries scoring below 3.0: Finland, Estonia, Lithuania, New Zealand, Sweden. Use in compliance: country risk scoring feeds into customer risk assessment; high-risk country triggers enhanced due diligence; very high-risk may trigger senior management approval or relationship decline. Limitation: composite scores may mask specific risks (a country may have strong AML laws but weak enforcement). Source: index.baselgovernance.org.`
  },
  {
    id: 'risk-ti-cpi',
    title: 'Transparency International Corruption Perceptions Index',
    category: 'country_risk',
    subcategory: 'transparency',
    content: `Transparency International Corruption Perceptions Index (CPI). Published annually since 1995. Ranks 180 countries by perceived levels of public sector corruption. Methodology: aggregate of 13 surveys and assessments from 12 institutions (World Bank, World Economic Forum, African Development Bank, Bertelsmann Foundation, etc.). Scoring: 0 (highly corrupt) to 100 (very clean). 2024 highlights: Top scores (least corrupt) — Denmark (90), Finland (87), New Zealand (87), Norway (84), Singapore (83), Sweden (82), Switzerland (82). Bottom scores (most corrupt) — Somalia (11), South Sudan (12), Syria (13), Venezuela (13), Yemen (16), Libya (18), Equatorial Guinea (17). Use in compliance: CPI score below 40 is commonly used threshold for "high corruption risk" triggering enhanced due diligence for PEPs and business relationships. CPI correlates with but is not identical to ML risk — some low-CPI countries have sophisticated ML controls, while some high-CPI countries may be used as laundering destinations. Limitations: measures perception, not actual corruption; focuses on public sector; survey-based methodology has inherent limitations. Source: transparency.org/cpi.`
  },
  {
    id: 'risk-fatf-jurisdictions',
    title: 'FATF High-Risk and Monitored Jurisdictions',
    category: 'country_risk',
    subcategory: 'fatf_lists',
    content: `FATF High-Risk Jurisdictions and Jurisdictions Under Increased Monitoring. FATF maintains two public lists updated at each plenary (three times per year). (1) High-Risk Jurisdictions Subject to a Call for Action ("Blacklist") — countries with strategic deficiencies in their AML/CFT regimes where FATF calls on all countries to apply enhanced due diligence and, in the most serious cases, countermeasures. Current blacklist: DPRK (North Korea), Iran, Myanmar. Countermeasures may include: limiting or prohibiting financial transactions; restricting or prohibiting correspondent banking; enhanced scrutiny of the country's financial sector. (2) Jurisdictions Under Increased Monitoring ("Greylist") — countries that have committed to address strategic deficiencies within agreed timeframes, with FATF monitoring progress. Being greylisted can significantly impact a country's ability to attract foreign investment and access the global financial system. Recent greylist: included countries like Nigeria, South Africa, Turkey, UAE (removed 2024), Philippines (removed 2024), and others. Impact on compliance programs: blacklist countries require enhanced due diligence, countermeasures, and often outright prohibition of certain business; greylist countries require enhanced monitoring and may trigger additional CDD. Countries can exit the greylist by demonstrating effective implementation of FATF-recommended reforms. Source: fatf-gafi.org/en/topics/high-risk-and-other-monitored-jurisdictions.html.`
  },
  {
    id: 'risk-tax-justice-fsi',
    title: 'Tax Justice Network Financial Secrecy Index',
    category: 'country_risk',
    subcategory: 'secrecy',
    content: `Tax Justice Network Financial Secrecy Index (FSI). Published biennially. Ranks jurisdictions by financial secrecy and scale of offshore financial activity. Unique methodology combines: (1) Secrecy Score (0-100) — 20 indicators covering ownership registration, legal entity transparency, tax reporting, international cooperation, anti-money laundering. (2) Global Scale Weight — share of global cross-border financial services activity routed through the jurisdiction. FSI = Secrecy Score × Global Scale Weight, identifying jurisdictions that combine high secrecy with significant financial flows. Top FSI jurisdictions (2022): United States (#1), Switzerland (#2), Singapore (#3), Hong Kong (#4), Luxembourg (#5), Japan (#6), Germany (#7), UAE (#8), UK (#9), Cayman Islands (#10). Notable finding: the US ranks #1 overall due to combination of moderate secrecy score with massive financial scale; states like Delaware, Nevada, South Dakota, and Wyoming enable anonymous shell companies and trusts. Use in compliance: FSI supplements Basel AML Index and FATF lists by focusing specifically on secrecy infrastructure; high-FSI jurisdictions may be used for legitimate purposes but warrant enhanced scrutiny when appearing in complex ownership structures; particularly relevant for assessing layered corporate structures and trust arrangements. Limitation: biennial publication means data may lag; combines two very different metrics (secrecy and scale) which can produce counterintuitive rankings. Source: fsi.taxjustice.net.`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CRYPTO INTELLIGENCE
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'crypto-chainalysis-typologies',
    title: 'Chainalysis Crypto Crime Typologies',
    category: 'crypto_intelligence',
    subcategory: 'chainalysis',
    content: `Chainalysis Crypto Crime Report — Key Typologies and Trends (annual publication). Chainalysis is the leading blockchain analytics firm providing transaction tracing and risk scoring for cryptocurrency compliance. Key findings from recent reports: (1) Ransomware — $1.1B paid in ransom in 2023 (up from $567M in 2022); top variants: LockBit, ALPHV/BlackCat, Cl0p, Play, Royal, Akira; payments increasingly flow through cross-chain bridges and mixing services. (2) Stolen funds — $1.7B stolen in 2023, down from $3.7B in 2022; DeFi protocol exploits remain primary vector; bridge hacks (Ronin, Wormhole, Nomad) represent single-point-of-failure risks. (3) Darknet markets — shifted from centralized markets (Silk Road, AlphaBay, Hydra) to decentralized alternatives; Hydra Market takedown (2022) disrupted but did not eliminate Russian-language darknet commerce. (4) Scams — pig butchering / romance scams growing rapidly; victims directed to fraudulent investment platforms showing fake profits; average victim loss exceeding $100K. (5) Sanctions evasion — Tornado Cash processed $7.6B+ before OFAC designation (2022); DPRK-linked Lazarus Group stole $1.7B+ in crypto (2022); sanctioned entities increasingly using privacy coins and DEXs. (6) CSAM — cryptocurrency payments for child sexual exploitation material on darknet; blockchain tracing enabling law enforcement identification. Chainalysis tools: Reactor (investigation/tracing), KYT (Know Your Transaction for real-time monitoring), Kryptos (research). Source: chainalysis.com/reports/crypto-crime-report.`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BENEFICIAL OWNERSHIP REGISTRIES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'bo-registries-global',
    title: 'Global Beneficial Ownership Registry Landscape',
    category: 'beneficial_ownership',
    subcategory: 'registries',
    content: `Global Beneficial Ownership Registry Landscape. Beneficial ownership transparency is a cornerstone of modern AML/CFT frameworks. FATF Recommendations 24-25 require countries to ensure adequate, accurate, and timely beneficial ownership information is available. Key registries and their capabilities: (1) FinCEN Beneficial Ownership Information (BOI) Registry — established under the Corporate Transparency Act (2021); requires most US entities to report beneficial owners (25%+ ownership or substantial control) to FinCEN; penalties up to $500/day for non-compliance; rolling implementation began 2024. (2) UK Persons of Significant Control (PSC) Register — mandatory since 2016; requires UK companies to identify and publicly disclose PSCs (25%+ ownership/voting rights or significant control); publicly accessible via Companies House; ECCTA 2023 strengthens verification requirements. (3) EU Central Registers of Beneficial Ownership — required by AMLD4/5; each member state must maintain a central register; access varies (some public, some restricted after CJEU ruling in Nov 2022 that unlimited public access violates privacy rights). (4) SEC EDGAR — 13D/13G filings for 5%+ ownership of public companies; Form 4 for insider transactions; 13F for institutional holdings. (5) OpenOwnership Register — aggregates disclosed BO data using Beneficial Ownership Data Standard (BODS); enables cross-border BO searches. Compliance use: verify disclosed UBOs against registry data; identify discrepancies between customer declarations and public filings; detect nominee arrangements where registry directors differ from disclosed UBOs; flag entities in jurisdictions without BO registries. Source: boiefiling.fincen.gov; Companies House; openownership.org.`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOJ / BANK ENFORCEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'doj-kleptocracy-initiative',
    title: 'DOJ Kleptocracy Asset Recovery Initiative',
    category: 'enforcement',
    subcategory: 'kleptocracy',
    content: `DOJ Kleptocracy Asset Recovery Initiative. Established 2010 within DOJ's Money Laundering and Asset Recovery Section (MLARS). Mission: recover proceeds of foreign corruption found in or laundered through the United States. Key cases: (1) 1MDB — $1.7B in assets recovered/restrained, including NYC real estate, a superyacht, a Picasso, Van Gogh, and Monet paintings, and proceeds from the film "The Wolf of Wall Street." Largest kleptocracy recovery in DOJ history. (2) Equatorial Guinea — $30M in assets of VP Teodoro Nguema Obiang Mangue (luxury Malibu mansion, Ferrari collection, Michael Jackson memorabilia). (3) Ukraine / Lazarenko — $250M+ in assets of former PM Pavlo Lazarenko laundered through US real estate and bank accounts. (4) Nigeria / Abacha — $480M in assets of former dictator Sani Abacha's family recovered from UK, Jersey, France, and the US. (5) Uzbekistan / Karimova — $850M in corruption proceeds from telecom bribery scheme involving Gulnara Karimova, daughter of former president. Mechanisms: civil forfeiture (in rem) under 18 USC 981(a)(1)(C); criminal forfeiture; restraining orders; cooperation with foreign counterparts. Asset concealment methods encountered: layered shell companies in BVI/Panama/Liechtenstein; nominee trustees; real estate via anonymous LLCs; luxury assets (yachts, jets, art); US bank accounts opened through correspondent banking. Source: justice.gov/criminal/criminal-afmls/kleptocracy-asset-recovery-initiative.`
  },
  {
    id: 'bank-enforcement-occ-fdic-fed',
    title: 'US Bank Regulator AML Enforcement Framework',
    category: 'enforcement',
    subcategory: 'bank_regulators',
    content: `US Bank Regulator AML Enforcement — OCC, FDIC, Federal Reserve. US bank regulators have independent authority to take AML/BSA enforcement actions against supervised institutions. OCC (Office of the Comptroller of the Currency) — supervises national banks and federal savings associations. Enforcement tools: consent orders, cease and desist orders, civil money penalties (CMPs), formal agreements, removal/prohibition of individuals. Notable actions: TD Bank ($1.3B CMP, 2024); Capital One ($390M CMP, 2021); USAA ($140M CMP, 2022). Common BSA/AML deficiencies cited: inadequate suspicious activity monitoring; failure to file SARs/CTRs; insufficient KYC/CDD; inadequate staffing; failure to maintain effective BSA officer; deficient independent testing. FDIC — supervises state-chartered banks that are not Fed members. Similar enforcement toolkit. Coordinates with FinCEN on parallel enforcement actions. Federal Reserve — supervises bank holding companies and state-chartered Fed member banks. Notable actions: Deutsche Bank ($186M, 2023 — Epstein-related AML failures); Goldman Sachs ($154M, 2020 — 1MDB). FFIEC BSA/AML Examination Manual — shared examination procedures used by all federal bank regulators for BSA/AML examinations. Covers: BSA/AML compliance program; BSA reporting (CTRs, SARs, CMIRs, FBARs); CDD/EDD; OFAC compliance; information sharing (314(a) and 314(b)); special measures. Examination cycle: typically 12-18 months; accelerated for institutions with prior MRAs or consent orders. Source: occ.gov; fdic.gov; federalreserve.gov; ffiec.gov/bsa_aml_infobase.`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INVESTIGATIVE JOURNALISM SOURCES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'journalism-investigation-sources',
    title: 'Investigative Journalism Sources for Financial Crime',
    category: 'osint',
    subcategory: 'journalism',
    content: `Investigative Journalism Sources for Financial Crime Intelligence. Key organizations and their contributions to financial crime detection: (1) OCCRP (Organized Crime and Corruption Reporting Project) — network of 80+ investigative centers in 40+ countries; broke Russian Laundromat, Azerbaijani Laundromat, and Troika Laundromat stories; maintains Aleph cross-referencing database; source for adverse media screening. (2) ICIJ (International Consortium of Investigative Journalists) — coordinated Panama Papers, Paradise Papers, Pandora Papers, FinCEN Files, and Luanda Leaks investigations; maintains Offshore Leaks database; fundamentally changed global approach to beneficial ownership transparency. (3) Global Witness — campaigns on corruption, land rights, and natural resource exploitation; investigated role of UK shell companies in global corruption; exposed London property purchases by kleptocrats; pioneered beneficial ownership transparency advocacy. (4) Bellingcat — open-source intelligence (OSINT) investigations; financial tracking of sanctioned oligarchs' assets; yacht and aircraft tracking; innovative use of publicly available data for investigations. (5) Finance Uncovered — UK-based investigative journalism center focused on financial crime and tax abuse; training for journalists globally; investigations into tax havens and money laundering. (6) Follow the Money (FTM, Netherlands) — investigative journalism on financial-economic crime; investigated Dutch trust sector and professional enablers; covered Wirecard fraud. Use in compliance: adverse media screening should incorporate findings from these organizations; ICIJ and OCCRP databases are primary EDD tools; Global Witness reports inform country risk assessments. Source: occrp.org; icij.org; globalwitness.org; bellingcat.com; financeuncovered.org; ftm.eu.`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // IRS / TAX ENFORCEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'irs-offshore-enforcement',
    title: 'IRS Offshore Tax Enforcement and Captive Insurance',
    category: 'enforcement',
    subcategory: 'irs',
    content: `IRS Offshore Tax Enforcement and Captive Insurance Abuse. IRS Criminal Investigation (IRS-CI) is the criminal enforcement arm of the IRS, investigating tax fraud, money laundering, public corruption, cybercrime, and terrorist financing. Key programs: (1) Offshore Compliance — FATCA (Foreign Account Tax Compliance Act) requires foreign financial institutions to report US account holders to IRS; FBAR (FinCEN Form 114) requires US persons to report foreign bank accounts exceeding $10,000 aggregate; Offshore Voluntary Disclosure Program (OVDP, now closed) allowed taxpayers to come into compliance; Swiss bank program resulted in $1.36B in penalties from 80 Swiss banks. (2) Captive Insurance Abuse (Notice 2016-66) — IRS identified micro-captive insurance arrangements as transactions of interest; scheme involves: company creates a wholly-owned captive insurer offshore; pays inflated premiums to the captive; deducts premiums as business expense; captive faces few/no actual claims; funds accumulate tax-free. IRS-CI enforcement: 2,676 investigations initiated in FY2023; 1,423 prosecution recommendations; 88.4% conviction rate; $5.5B identified from tax fraud and financial crimes. Cryptocurrency tax enforcement: IRS obtained John Doe summons against Coinbase (2016), Kraken (2021), Circle (2021); virtual currency is property for tax purposes (Notice 2014-21); failure to report crypto gains is tax evasion. Source: irs.gov/compliance/criminal-investigation; IRS-CI Annual Report.`
  }
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.PINECONE_API_KEY) {
    console.error('Error: PINECONE_API_KEY environment variable not set');
    process.exit(1);
  }

  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index(INDEX_NAME);
  const ns = index.namespace(NAMESPACE);

  console.log(`Seeding ${CURATED_CHUNKS.length} AML/KYC resource chunks to "${NAMESPACE}" namespace...`);

  const batchSize = 5;
  for (let i = 0; i < CURATED_CHUNKS.length; i += batchSize) {
    const batch = CURATED_CHUNKS.slice(i, i + batchSize);

    const texts = batch.map(chunk => {
      return [chunk.title, chunk.category, chunk.subcategory, chunk.content.substring(0, 1200)].join(' | ');
    });

    const embeddingResponse = await pc.inference.embed(
      'multilingual-e5-large',
      texts,
      { inputType: 'passage', truncate: 'END' }
    );

    const vectors = batch.map((chunk, idx) => ({
      id: chunk.id,
      values: embeddingResponse[idx].values,
      metadata: {
        title: chunk.title,
        category: chunk.category,
        subcategory: chunk.subcategory,
        content: chunk.content.substring(0, 30000),
        source: 'aml-rag-resources'
      }
    }));

    await ns.upsert(vectors);
    console.log(`  Upserted ${i + batch.length}/${CURATED_CHUNKS.length}: ${batch.map(c => c.title.substring(0, 40)).join(', ')}`);
  }

  console.log(`\nDone. ${CURATED_CHUNKS.length} AML/KYC resource chunks seeded to namespace "${NAMESPACE}".`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
