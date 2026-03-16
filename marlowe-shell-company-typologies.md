# Shell Company Typologies — Detection and Risk Assessment

Add this document to Katharos's RAG knowledge base. Chunk by section. Category: "typologies". Embed and upsert to vector store under namespace "shell-companies".

---

## What Is a Shell Company

A shell company is a legal entity that has no active business operations, no significant assets, and no employees. Shell companies are not inherently illegal — they are used legitimately for holding assets, facilitating mergers, or structuring investments. They become instruments of financial crime when used to obscure beneficial ownership, layer illicit funds, or evade sanctions, taxes, or regulatory oversight.

The critical question is never "is this a shell company?" but rather "why does this entity exist, who controls it, and what purpose does it serve?"

---

## Shell Company Risk Tiers

### TIER 1: CRITICAL RISK INDICATORS (Any Single Indicator Warrants Escalation)

| Indicator | Risk Score | Why |
|-----------|-----------|-----|
| Beneficial owner is sanctioned or blocked | +60 | OFAC 50% rule: entity is blocked if 50%+ owned by SDN |
| Entity appears in ICIJ leaks (Panama Papers, Paradise Papers, Pandora Papers) | +50 | Confirmed association with offshore secrecy infrastructure |
| Nominee directors from known nominee service providers | +40 | Deliberate concealment of beneficial ownership |
| Entity registered at address shared by 100+ other companies | +40 | Formation agent address, no physical presence |
| Bearer shares or bearer instruments | +45 | Anonymous ownership by design |
| Registered in jurisdiction with no beneficial ownership registry | +35 | Cannot verify who controls the entity |
| Entity created days or weeks before a large transaction | +40 | Purpose-built for a single transaction |

### TIER 2: HIGH RISK INDICATORS (Two or More Warrant Escalation)

| Indicator | Risk Score | Why |
|-----------|-----------|-----|
| No website, phone number, or physical office | +20 | No evidence of real operations |
| Registered agent address only (no operating address) | +15 | Exists on paper only |
| Directors are other corporate entities, not natural persons | +20 | Layered ownership obscuring real control |
| Company formed by known offshore service provider | +15 | Mossack Fonseca, Formations House, Trident Trust, etc. |
| Revenue reported but no employees | +15 | Revenue without operations |
| Single-purpose entity with generic name | +10 | "Global Trading Ltd", "Horizon Investments Inc" |
| Jurisdictional mismatch: registered in one country, operates in another, banks in a third | +20 | Geographic complexity without business justification |
| Frequent changes in directors or registered agent | +15 | Rotating ownership to avoid detection |
| Company dormant for years then suddenly active | +15 | Shelf company activated for a specific transaction |

### TIER 3: MODERATE RISK INDICATORS (Context-Dependent)

| Indicator | Risk Score | Why |
|-----------|-----------|-----|
| Holding company structure with no operating subsidiaries | +10 | May be legitimate, needs verification |
| SPV (Special Purpose Vehicle) for a single asset | +5 | Common in real estate and finance, but can obscure ownership |
| Trust with corporate trustee in secrecy jurisdiction | +10 | Legitimate estate planning or ownership concealment |
| Recently incorporated (< 12 months) | +5 | New entities need more scrutiny |
| Minimal capitalization relative to transaction size | +10 | Entity too small for the money flowing through it |

---

## Shell Company Structures by Purpose

### 1. OWNERSHIP CONCEALMENT

**Purpose**: Hide the identity of the true beneficial owner.

**Structure**:
```
Beneficial Owner (hidden)
  → Trust (Cayman Islands, trustee is a corporate entity)
    → Holding Company (BVI)
      → Operating Company or Asset (any jurisdiction)
```

**Detection Method**:
- Trace corporate chain to natural person
- Check ICIJ Offshore Leaks for entity names and addresses
- Verify directors are natural persons, not nominee companies
- Check if registered address is a formation agent
- Cross-reference beneficial owner across multiple databases

**Red Flags**:
- Corporate directors at every layer
- Trust in secrecy jurisdiction with no disclosed beneficiaries
- More than 3 corporate layers between asset and natural person
- Same registered agent at multiple layers

**Enforcement Precedent**: Prevezon Holdings (2017) — Russian funds laundered through BVI/Cyprus shell chain into NYC real estate. Danske Bank Estonia (2018) — 15,000 non-resident shell companies used UK LLPs and BVI IBCs.

---

### 2. SANCTIONS EVASION

**Purpose**: Allow a sanctioned person or entity to access the financial system.

**Structure**:
```
Sanctioned Person (SDN)
  → Family Member or Associate (not sanctioned)
    → Shell Company (jurisdiction without OFAC reach)
      → Bank Account (in non-US bank)
        → Transactions with US financial system via correspondent banking
```

**Detection Method**:
- OFAC 50% Rule: entity is blocked if owned 50%+ (individually or aggregate) by one or more SDNs
- Check all directors, officers, shareholders against SDN list
- Check family members and known associates of SDNs
- Trace ownership chains through all layers
- Check for address matches with known SDN addresses
- Check for patterns: entity created shortly after designation of an SDN

**Red Flags**:
- Entity shares address, phone, or registered agent with designated entity
- Director or shareholder shares surname with SDN
- Entity created within 6 months of a related OFAC designation
- Entity in same industry/geography as sanctioned entity
- Transactions structured to avoid US nexus

**Enforcement Precedent**: BNP Paribas (2014, $8.9B) — processed transactions through shell entities to strip identifying information for sanctioned countries. ZTE (2017, $1.19B) — used shell companies to export US technology to Iran.

---

### 3. MONEY LAUNDERING (LAYERING)

**Purpose**: Create distance between criminal proceeds and their source through multiple transfers and corporate layers.

**Structure**:
```
Criminal Proceeds
  → Shell Company A (receives initial funds via invoice for "consulting")
    → Shell Company B (transfers as "intercompany loan")
      → Shell Company C (transfers as "trade payment")
        → Real Estate Purchase or Legitimate Business (integration)
```

**Detection Method**:
- Follow the money: map all transfers between related entities
- Check for circular transactions (money returning to origin through different path)
- Verify commercial substance of intercompany transactions
- Check if invoiced services were actually delivered
- Compare transaction volume to company size and operations

**Red Flags**:
- Round-dollar transfers between related shell companies
- "Consulting fees" or "management fees" between entities with no employees
- Intercompany loans that are never repaid
- Transaction chain crosses 3+ jurisdictions without commercial justification
- Funds arrive and depart within days (rapid movement)
- Total transaction volume vastly exceeds company's reported revenue

**Enforcement Precedent**: TD Bank (2024, $3.09B) — shell companies used to layer drug proceeds. Deutsche Bank (2017, $630M) — Russian mirror trading used shell companies to convert rubles to dollars.

---

### 4. TAX EVASION AND PROFIT SHIFTING

**Purpose**: Artificially shift profits to low-tax jurisdictions through intercompany transactions with no economic substance.

**Structure**:
```
Operating Company (high-tax country, generates revenue)
  → IP Holding Company (Ireland/Luxembourg/Netherlands)
    → Licensing Shell (Bermuda/Cayman, owns the IP)

Operating Company pays inflated royalties to IP Holding Company
IP Holding Company pays licensing fees to Bermuda Shell
Profits accumulate in zero-tax jurisdiction
```

**Detection Method**:
- Compare transfer pricing to arm's-length benchmarks
- Check for IP transfers to low-tax jurisdictions
- Verify economic substance of entities receiving payments
- Check if entity has employees, office, or operations in its jurisdiction
- Compare entity's reported income to transaction flow

**Red Flags**:
- Large royalty or licensing payments to entities in zero-tax jurisdictions
- IP transferred to offshore entity at below-market value
- Management fees paid to entity with no employees
- Entity in low-tax jurisdiction with revenue but no operations
- "Double Irish" or "Dutch Sandwich" structures

**Enforcement Precedent**: UBS (2009, $780M) — shell entities used to hide US taxpayer accounts. Panama Papers (2016) — Mossack Fonseca created 214,000+ shells for tax evasion.

---

### 5. TRADE-BASED MONEY LAUNDERING (TBML)

**Purpose**: Use shell companies on both sides of a fake or mispriced trade to move value across borders.

**Structure**:
```
Shell Company A (Country 1, "exporter")
  → Invoices Shell Company B for goods at inflated price
Shell Company B (Country 2, "importer")
  → Pays inflated invoice via wire transfer

Value transferred = Invoice Amount - Actual Goods Value
No goods may actually ship, or goods are worth far less than invoiced.
```

**Detection Method**:
- Compare invoice values to market prices for stated goods
- Verify goods actually shipped (bills of lading, customs records)
- Check if both parties are shell companies
- Look for patterns: same goods, same route, recurring invoices
- Check UN Comtrade for trade flow anomalies between countries

**Red Flags**:
- Over-invoicing or under-invoicing relative to market value
- Multiple invoices for identical amounts
- Goods descriptions vague ("miscellaneous equipment", "consulting materials")
- Trade route makes no commercial sense
- Shell companies on both sides of the transaction
- No evidence of goods delivery

**Enforcement Precedent**: Lebanese Canadian Bank (2011, $102M) — used car TBML chain: US → West Africa → consumer goods → Lebanon. HSBC (2012, $1.9B) — trade finance for cartels.

---

### 6. REAL ESTATE LAUNDERING

**Purpose**: Convert illicit funds into real property through anonymous shell company purchases.

**Structure**:
```
Illicit Funds
  → Shell Company (LLC, registered in Delaware/Nevada/Wyoming)
    → Purchases luxury real estate in cash (no mortgage)
      → Property generates "legitimate" rental income
        → Or resold, producing "clean" capital gains
```

**Detection Method**:
- Check if property was purchased by a shell company
- Check if purchase was all-cash (no mortgage = no bank due diligence)
- Verify beneficial owner of purchasing entity
- Compare purchase price to market value
- Check FinCEN Geographic Targeting Order (GTO) cities

**Red Flags**:
- All-cash purchase of luxury real estate by LLC
- LLC formed shortly before purchase
- No mortgage (avoids bank KYC)
- Property purchased in GTO cities: Manhattan, Miami, Los Angeles, San Francisco, San Antonio, San Diego, Honolulu, Las Vegas
- Property value inconsistent with buyer's known income
- Rapid resale at inflated price
- Foreign-sourced funds with no clear origin

**Enforcement Precedent**: Prevezon Holdings (2017, $5.9M) — Magnitsky-linked funds into NYC real estate. Trump SoHo/Bayrock — opaque capital sources into luxury development. FinCEN GTO program created specifically for this pattern.

---

### 7. PROLIFERATION FINANCE

**Purpose**: Procure controlled technology or materials for weapons programs through front companies.

**Structure**:
```
Government Weapons Program (Iran/DPRK)
  → Procurement Agent (individual with cover identity)
    → Front Company (UAE/Turkey/Malaysia/China)
      → Places orders for dual-use technology with Western suppliers
        → Goods shipped to front company
          → Re-exported to sanctioned country via intermediaries
```

**Detection Method**:
- Check if company is on BIS Entity List or OFAC SDN list
- Check if goods ordered are dual-use (controlled items)
- Verify end-user statements
- Check if company has operations consistent with ordered goods
- Check for geographic red flags (registration in transshipment countries)

**Red Flags**:
- Recently formed company ordering sophisticated technology
- Company has no visible operations in the field of goods ordered
- End-user statement inconsistent with company profile
- Shipping through known transshipment hubs
- Beneficial owner from sanctioned country
- Payment from third country (not buyer or seller jurisdiction)

**Enforcement Precedent**: ZTE (2017, $1.19B) — front companies exporting US tech to Iran. Huawei/Skycom — subsidiary used as front for Iran technology transfers. DPRK procurement networks — dozens of front companies across Asia.

---

### 8. CORRUPTION AND BRIBERY

**Purpose**: Channel bribes through shell companies to create plausible deniability.

**Structure**:
```
Company Seeking Government Contract
  → "Consulting Agreement" with Shell Company A
    → Shell Company A transfers to Shell Company B (offshore)
      → Shell Company B pays PEP's family member or associate
        → PEP awards contract to original company
```

**Detection Method**:
- Check for consulting agreements with shell companies around the time of government contract awards
- Verify consulting company has employees and delivers real services
- Check if payment recipients are PEPs or PEP associates
- Map relationship between government officials and contract recipients

**Red Flags**:
- Consulting fees coinciding with contract awards
- "Consultant" is a shell company with no employees
- Payments routed through offshore jurisdictions
- Recipient is a PEP family member or known associate
- Fees disproportionate to services described
- Multiple intermediaries between payer and ultimate recipient

**Enforcement Precedent**: Odebrecht (2016, $3.5B) — paid $788M in bribes through shell companies across 12 countries. Goldman Sachs/1MDB (2020, $2.9B) — bribes channeled through shell entities. Siemens (2008, $1.6B) — systematic bribery through shell companies.

---

## Shell Company Jurisdiction Risk Matrix

### CRITICAL RISK JURISDICTIONS (Secrecy + No Beneficial Ownership Registry)

| Jurisdiction | Entity Type | Why High Risk |
|-------------|-------------|---------------|
| British Virgin Islands (BVI) | IBC | 400,000+ companies, historically minimal disclosure, bearer shares until 2006 |
| Panama | S.A., Foundation | Bearer shares until 2015, foundation structure allows asset concealment |
| Seychelles | IBC | Minimal filing requirements, difficult to obtain company information |
| Marshall Islands | LLC, Corporation | Shipping registries, minimal disclosure, remote jurisdiction |
| Vanuatu | Corporation | No income tax, minimal regulation, difficult enforcement |
| Samoa | International Company | Tax haven, limited information exchange |

### HIGH RISK JURISDICTIONS (Used in Layering Chains)

| Jurisdiction | Entity Type | Why High Risk |
|-------------|-------------|---------------|
| Delaware (US) | LLC | No disclosure of beneficial owners (until CTA enforcement), low cost, rapid formation |
| Nevada (US) | LLC | No state income tax, minimal disclosure, nominee officers allowed |
| Wyoming (US) | LLC | Privacy protections, no state income tax, asset protection trusts |
| Cyprus | Company | EU access + historically lax enforcement, gateway for Russian money |
| Malta | Company | EU passporting, small jurisdiction, limited enforcement capacity |
| Labuan (Malaysia) | Offshore Company | Low tax, minimal disclosure, transshipment hub |
| Dubai/UAE Free Zones | FZE, FZCO | Multiple free zones with different rules, rapid formation, foreign ownership |
| Hong Kong | Limited | Gateway to China, rapid formation, nominee directors common |
| Singapore | Pte Ltd | Asia-Pacific financial hub, corporate secrecy protections |

### MODERATE RISK JURISDICTIONS (Legitimate But Watch for Misuse)

| Jurisdiction | Entity Type | Why Moderate Risk |
|-------------|-------------|-------------------|
| UK | LLP, LP, Ltd | Companies House data is public but historically allowed minimal verification. Scottish LPs exploited in Danske Bank laundering. |
| Ireland | Ltd | Low corporate tax, IP holding structures, but improving transparency |
| Luxembourg | Sarl, SA | Fund structures, holding companies, but EU-regulated |
| Netherlands | BV | Holding company structures, but improving beneficial ownership transparency |
| Switzerland | AG, GmbH | Banking secrecy tradition, but now shares info under CRS |
| Cayman Islands | Exempted Company | Fund structures, but improving regulation |
| Jersey/Guernsey | Company | Trust structures, improving transparency |

---

## Shell Company Detection Checklist for Katharos

When screening any entity, check:

### IDENTITY VERIFICATION
- [ ] Is the entity registered? (Check Companies House, OpenCorporates, SEC EDGAR, local registry)
- [ ] When was it formed? (Recently formed = higher risk)
- [ ] Where is it registered? (Cross-reference jurisdiction risk matrix)
- [ ] Who are the directors? (Natural persons or corporate entities?)
- [ ] Who is the beneficial owner? (Can you trace to a natural person?)
- [ ] Is the registered address shared with many other companies?
- [ ] Does the entity appear in ICIJ Offshore Leaks database?

### OPERATIONAL SUBSTANCE
- [ ] Does the entity have a website?
- [ ] Does it have employees?
- [ ] Does it have a physical office (not just registered agent address)?
- [ ] Does it have revenue consistent with its claimed business?
- [ ] Does its business activity match its stated purpose?

### TRANSACTION PATTERNS
- [ ] Are transactions consistent with the entity's stated business?
- [ ] Are there round-dollar transfers?
- [ ] Is money moving through the entity rapidly (in and out within days)?
- [ ] Are there circular transactions?
- [ ] Is transaction volume disproportionate to entity size?

### OWNERSHIP CHAIN
- [ ] Can beneficial ownership be traced to a natural person within 3 layers?
- [ ] Are nominee directors or shareholders used?
- [ ] Are there bearer shares or bearer instruments?
- [ ] Does the ownership chain cross secrecy jurisdictions?
- [ ] Do any owners, directors, or shareholders appear on sanctions lists?
- [ ] Does the OFAC 50% rule apply? (Aggregate SDN ownership ≥ 50%)

### CROSS-REFERENCING
- [ ] Check entity name, directors, and address against OFAC SDN
- [ ] Check ICIJ Offshore Leaks (Panama Papers, Paradise Papers, Pandora Papers)
- [ ] Check OpenSanctions for PEP connections
- [ ] Check corporate registry for shared addresses and directors
- [ ] Check adverse media for entity name and directors
- [ ] Check enforcement case database for matching typology patterns

---

## Report Language for Shell Company Findings

When Katharos identifies shell company indicators, use this language:

**CONFIRMED SHELL (Critical)**:
"[Entity Name] exhibits characteristics of a shell company used for [purpose]. The entity is registered in [jurisdiction], has no identifiable business operations, [additional indicators]. This structure is consistent with [typology] as seen in [enforcement case reference]. RECOMMENDATION: Enhanced due diligence required. Do not proceed without verified beneficial ownership."

**SUSPECTED SHELL (High)**:
"[Entity Name] has characteristics associated with shell company structures: [list indicators]. While shell companies can serve legitimate purposes, the combination of [specific risk factors] warrants further investigation. RECOMMENDATION: Verify beneficial ownership and commercial substance before proceeding."

**POSSIBLE SHELL (Moderate)**:
"[Entity Name] is a [entity type] registered in [jurisdiction] with limited publicly available information about its operations. This does not necessarily indicate illicit purpose, but [specific concern]. RECOMMENDATION: Request additional documentation on beneficial ownership and business purpose."

---

## Corporate Transparency Act (CTA) Impact

As of January 1, 2024, most US companies must report beneficial ownership information to FinCEN. This changes Katharos's US entity screening:

- New companies must file within 30 days of formation
- Existing companies had until January 1, 2025
- Beneficial owners (25%+ ownership or substantial control) must be disclosed
- Reporting to FinCEN BOI database (not yet publicly accessible)
- Exemptions: Large operating companies (20+ employees, $5M+ revenue, physical US office), banks, registered investment companies, and other already-regulated entities

**Screening Implication**: US LLCs that previously offered anonymous ownership now have disclosure requirements. Failure to file is itself a red flag. However, the BOI database is not publicly searchable — Katharos should note when US entity beneficial ownership cannot be independently verified.

---

## Mirror Trading and Shell Company Networks

Mirror trading is a money laundering technique in which coordinated buy and sell orders are placed through pairs of shell companies to convert currency across borders without traditional wire transfers. The definitive case is the Deutsche Bank Moscow mirror trading scandal (2011–2015), in which Russian clients used the bank's Moscow and London desks to move an estimated $10 billion out of Russia. The scheme worked as follows: a Russian-domiciled shell company would buy Russian blue-chip equities (typically Gazprom, Lukoil, or Sberbank shares) in rubles through Deutsche Bank's Moscow branch, while a related offshore shell company — often registered in the British Virgin Islands or Cyprus — would simultaneously sell the identical securities in US dollars or euros through Deutsche Bank's London branch. The trades were economically offsetting, producing no market risk, but the effect was a conversion of rubles into hard currency outside Russia's capital controls.

The NYDFS Consent Order (January 2017) found Deutsche Bank processed approximately 12,000 mirror trades totaling $10+ billion. The FCA Final Notice (January 2017) imposed a £163 million fine, finding the London branch had failed to identify the suspicious pattern despite clear red flags. NYDFS imposed a $425 million penalty on the New York branch.

**Structure**:
```
Russian Client (hidden beneficial owner)
  → Shell Company A (Moscow, ruble account at Deutsche Bank)
      Buys 100,000 shares of Gazprom in RUB
  → Shell Company B (BVI/Cyprus, USD account at Deutsche Bank London)
      Simultaneously sells 100,000 shares of Gazprom in USD
  → Net effect: RUB converted to USD, moved offshore
```

**Detection Method**:
- Flag synchronized buy/sell orders in the same security across different currencies or branches
- Identify pairs of entities with matching trade sizes, timestamps, and offsetting positions
- Check whether trading entities share beneficial owners, registered agents, or addresses
- Monitor for entities with no economic rationale for equity trading (no investment mandate, no portfolio)

**Red Flags**:
- Two or more entities placing identical but offsetting trades within the same session (+40 points)
- Shell companies with no investment business engaging in high-volume equity trades (+30 points)
- Trades that produce no market risk or profit — pure currency conversion via securities (+40 points)
- Entities registered in different jurisdictions but sharing the same beneficial owner or corporate service provider (+25 points)
- Disproportionate trading volume relative to entity capitalization (+20 points)

**Enforcement Precedent**:
- Deutsche Bank AG — NYDFS $425M penalty (2017), FCA £163M fine (2017) for AML control failures over Moscow mirror trades
- Multiple Deutsche Bank employees terminated; Russian broker Georgy Buznik and others connected to the scheme

**Source References**:
- NYDFS Consent Order (2017)
- FCA Final Notice — Deutsche Bank AG (2017)

---

## Shell Companies in Crypto and DeFi

Traditional shell company structures have adapted to the cryptocurrency ecosystem, creating new laundering architectures that exploit regulatory gaps between traditional finance and decentralized protocols. Unhosted wallets function as the digital equivalent of bearer shares — ownership is anonymous by default and controlled by whoever holds the private key. Shell LLCs registered in permissive jurisdictions operate over-the-counter (OTC) crypto desks that convert large volumes of cryptocurrency to fiat without meaningful KYC, functioning as unlicensed money services businesses.

The OFAC designation of Tornado Cash (August 8, 2022) marked a watershed: for the first time, the US government sanctioned a smart contract protocol. OFAC found Tornado Cash had been used to launder more than $7 billion in virtual currency since its creation in 2019, including $455 million stolen by the Lazarus Group (North Korea). The protocol's mixing function broke the on-chain transaction trail, making it functionally equivalent to layering through shell companies. Per FinCEN's 2019 CVC Guidance, persons who provide anonymizing services are money transmitters subject to BSA obligations regardless of whether they operate through a legal entity or smart contract. The FATF's Updated Guidance for VASPs (2021) explicitly extends AML obligations to decentralized exchanges and DeFi protocols where an identifiable person or entity maintains control or sufficient influence.

**Structure**:
```
Illicit Source (ransomware, theft, sanctions evasion)
  → Unhosted wallet (anonymous, self-custodied)
    → Mixer/tumbler (Tornado Cash, Sinbad, etc.)
      → Chain-hopping (BTC → ETH → stablecoin via DEX)
        → OTC desk (shell LLC, minimal KYC)
          → Fiat off-ramp (bank account in nominee's name)
```

**Detection Method**:
- Trace blockchain transactions through known mixer contract addresses (Tornado Cash, Sinbad, Blender.io)
- Flag OTC desks or VASPs registered as shell entities with no employees or physical presence
- Identify chain-hopping patterns: rapid conversion across multiple blockchains without economic rationale
- Check VASP registration status against FinCEN MSB registry and jurisdiction-specific registries

**Red Flags**:
- Funds transiting through OFAC-designated mixer addresses (Tornado Cash) (+50 points)
- Entity operating as VASP/OTC desk with shell company characteristics (no employees, registered agent address only) (+35 points)
- Large crypto-to-fiat conversions through entities with no verifiable business operations (+30 points)
- Wallet addresses associated with known ransomware, darknet, or theft clusters (+45 points)
- Rapid chain-hopping across 3+ blockchains within 24 hours (+25 points)
- VASP registered in jurisdiction with no AML framework (pre-2022 Estonia, Seychelles, BVI) (+20 points)

**Enforcement Precedent**:
- Tornado Cash — OFAC SDN designation (August 2022), $7B+ laundered, including $455M for Lazarus Group (DPRK)
- BitMEX — DOJ criminal charges (2020), founders charged with BSA violations for deliberately structuring the exchange to avoid US AML requirements via Seychelles shell entity
- Binance — $4.3B settlement (2023) with DOJ/FinCEN/OFAC for AML failures and sanctions violations

**Source References**:
- OFAC Tornado Cash Designation (August 8, 2022)
- FinCEN Convertible Virtual Currency Guidance (May 2019)
- FATF Updated Guidance for a Risk-Based Approach to Virtual Assets and VASPs (October 2021)

---

## Free Trade Zone Shell Companies

Free Trade Zones (FTZs) create concentrated money laundering risk because they combine reduced customs oversight, simplified corporate registration, tax exemptions, and minimal beneficial ownership disclosure. The FATF's report on ML vulnerabilities in FTZs identifies these zones as ideal environments for trade-based money laundering (TBML), where shell companies exploit the gap between trade documentation and actual goods movement. FTZ-registered entities often face lighter regulatory scrutiny than onshore businesses, and multiple jurisdictions' FTZs allow company formation with minimal capital, no local director requirements, and limited ongoing reporting.

Key high-risk FTZs include: Dubai's Jebel Ali Free Zone (JAFZA) and DAFZA, which host thousands of trading companies with opaque ownership; Panama's Colón Free Zone, the second-largest FTZ globally and a documented hub for Black Market Peso Exchange (BMPE) and narcotics-related TBML per the FATF's 2006 Trade-Based ML report; Labuan IBFC (Malaysia), which offers holding company structures with confidential beneficial ownership; and Singapore's FTZs, which process high-value transshipments with limited customs inspection. Shell companies in these zones typically conduct "re-invoicing" — purchasing goods at one price and re-selling to a related entity at an inflated or deflated price, with the difference siphoned off as laundered funds.

**Structure**:
```
Shell Company A (Colón Free Zone, Panama)
  Purchases goods at $1M (under-invoice)
    → Ships to Shell Company B (JAFZA, Dubai)
      Re-invoices at $3M (over-invoice)
        → Sells to End Buyer at $3M
          → $2M difference = laundered funds in Dubai
```

**Detection Method**:
- Compare declared trade values against global commodity price indices for the same goods
- Flag entities registered in FTZs that transact with related-party entities in other FTZs
- Check whether FTZ entity has physical warehouse, inventory, or actual goods handling capacity
- Verify trade documentation: bills of lading, customs declarations, and shipping records

**Red Flags**:
- Entity registered in FTZ with no physical warehouse or goods handling operations (+25 points)
- Trade values significantly above or below market benchmarks for the declared commodity (+30 points)
- Circular trade patterns: goods shipped between related FTZ entities across multiple jurisdictions (+35 points)
- Re-invoicing through intermediary shell with no value-added activity (+30 points)
- FTZ entity with nominee directors and no identifiable beneficial owner (+25 points)
- Multiple FTZ entities sharing the same registered agent across different zones (+20 points)

**Enforcement Precedent**:
- Multiple FATF/APG mutual evaluations have cited FTZ vulnerabilities in UAE, Panama, and Malaysia
- Colón Free Zone entities linked to Hezbollah-connected TBML networks (DEA Project Cassandra)
- Dubai-based FTZ companies cited in ICIJ Pandora Papers for facilitating opaque gold and commodity trades

**Source References**:
- FATF Report: Money Laundering Vulnerabilities of Free Trade Zones (2010)
- FATF Report: Trade-Based Money Laundering (2006)

---

## Shell Banks and Nested Correspondent Accounts

A shell bank is a bank that has no physical presence in the country where it is incorporated and licensed, and is not affiliated with a regulated financial group subject to consolidated supervision. The USA PATRIOT Act (Section 313) prohibits US financial institutions from maintaining correspondent accounts for foreign shell banks. However, the prohibition is circumvented through "nesting" — where a shell bank or high-risk entity opens an account at a legitimate foreign bank, which in turn has a correspondent account at a US bank. The US bank unknowingly processes transactions for the shell bank through the intermediary.

The FinCEN Section 311 action against ABLV Bank (February 2018) is the definitive case. FinCEN found ABLV Bank of Latvia to be a "financial institution of primary money laundering concern," citing institutionalized money laundering involving shell company accounts, non-resident deposits constituting over 50% of the bank's deposit base, transactions connected to North Korea's ballistic missile procurement program, and management complicity including bribery of Latvian regulators. ABLV's shell company clients used its US dollar correspondent accounts to access the American financial system. The Section 311 designation — the most severe measure available — severed ABLV from US dollar clearing and caused the bank's collapse within weeks. Similarly, FinCEN's 2014 Section 311 action against FBME Bank (Tanzania/Cyprus) cited the bank's use of correspondent relationships to process transactions for shell companies and entities connected to Hezbollah, sanctions evasion, and fraud.

**Structure**:
```
Shell Bank or Shell Company (no physical presence)
  → Account at Foreign Bank (weak AML, nested)
    → Foreign Bank's Correspondent Account at US Bank
      → US Dollar clearing system (Fedwire/CHIPS)
        → Funds reach US financial system
```

**Detection Method**:
- Request and verify correspondent banking certifications (PATRIOT Act Section 313 certifications)
- Monitor for sudden increases in transaction volume through respondent bank accounts
- Identify transactions where the originator or beneficiary is an entity with no verifiable physical presence
- Review KYC information on downstream respondent banks for non-resident deposit concentration

**Red Flags**:
- Respondent bank with >40% non-resident deposits (+35 points)
- Transactions through correspondent accounts where originator/beneficiary is a shell entity (+30 points)
- Foreign bank unable or unwilling to provide PATRIOT Act Section 313 certification (+40 points)
- Correspondent account transaction volume disproportionate to respondent bank's known business (+25 points)
- Payments involving jurisdictions subject to FinCEN Section 311 actions or advisories (+30 points)
- Nested transactions — third-party banks or entities routing through a respondent bank's correspondent account (+35 points)

**Enforcement Precedent**:
- ABLV Bank, AS (Latvia) — FinCEN Section 311 designation (2018), institutionalized money laundering, DPRK proliferation finance, bank collapsed within weeks
- FBME Bank (Tanzania/Cyprus) — FinCEN Section 311 Final Rule (2016), Hezbollah connections, sanctions evasion
- Banca Privada d'Andorra (BPA) — FinCEN Section 311 designation (2015), third-party money laundering for Chinese, Russian, and Venezuelan clients

**Source References**:
- FinCEN NPRM: ABLV Bank Section 311 (83 FR 6988, February 2018)
- FinCEN Final Rule: FBME Bank Section 311
- Basel Committee on Banking Supervision: Sound Management of Risks Related to Money Laundering and Financing of Terrorism (BCBS d490)

---

## Layered Nominee Structures: The Russian Laundromat

The "Russian Laundromat" refers to a massive money laundering scheme exposed by the OCCRP (Organized Crime and Corruption Reporting Project) in which approximately $20–80 billion was moved out of Russia between 2010 and 2014 through a network of shell companies and fabricated court judgments. The scheme exploited a loophole in Moldova's legal system: Russian shell companies would create fictitious loan agreements between each other, then a Moldovan entity would guarantee the "debt." When the "debtor" deliberately defaulted, the "creditor" would obtain an enforceable court judgment in Moldova. Moldovan judges — later found to have been bribed — would rubber-stamp these fictitious debt judgments, which were then used to justify large wire transfers from Moldovan banks to shell company accounts at banks across the EU, primarily in Latvia (Trasta Komercbanka, ABLV, and others).

The shell company architecture relied heavily on UK-registered Limited Liability Partnerships (LLPs), which at the time required no disclosure of beneficial ownership if the partners were themselves corporate entities. The OCCRP investigation identified over 20 core shell companies, many registered at the same London addresses, with nominee partners that were themselves offshore companies in Belize, the Seychelles, and other secrecy jurisdictions. The Danske Bank Estonia branch was also implicated: its non-resident portfolio (approximately $230 billion in suspicious flows from 2007–2015) overlapped significantly with Laundromat-connected entities. The Danish FSA's 2018 report on Danske Bank confirmed systemic failures in KYC for non-resident customers, many of whom were shell companies with nominee structures.

**Structure**:
```
Russian Entity A (the "debtor")
  ← Fictitious loan agreement →
Russian Entity B (the "creditor")
  ← Moldovan Entity C guarantees the debt →
    → Entity A "defaults" on the fictitious loan
      → Entity B obtains court judgment in Moldova
        → Moldovan bank executes judgment, wires funds to:
          → UK LLP (nominee partners = BVI/Belize shells)
            → Latvian bank correspondent account
              → EU banking system
```

**Detection Method**:
- Flag UK LLPs or Scottish LPs with corporate partners registered in secrecy jurisdictions
- Identify entities involved in court-judgment-based fund transfers, particularly from CIS/Moldovan courts
- Check for shared registered addresses across multiple entities (formation agent addresses)
- Cross-reference entity names and addresses against OCCRP and ICIJ leaked databases

**Red Flags**:
- UK LLP with partners that are corporate entities in BVI, Belize, or Seychelles (+40 points)
- Fund transfers justified by foreign court judgments involving entities with no real commercial relationship (+45 points)
- Multiple entities registered at the same London address used by known formation agents (+30 points)
- Transactions flowing through Latvian, Estonian, or Lithuanian banks from CIS-origin entities (+25 points)
- Entity appears in OCCRP Russian Laundromat, Azerbaijani Laundromat, or Troika Laundromat databases (+50 points)
- Non-resident bank account with transaction volumes grossly disproportionate to stated business (+30 points)

**Enforcement Precedent**:
- Danske Bank Estonia — $2B DOJ settlement (2022), $230B in suspicious flows through non-resident shell company accounts
- Trasta Komercbanka (Latvia) — License revoked by ECB (2016), primary Laundromat conduit
- ABLV Bank (Latvia) — FinCEN Section 311 designation (2018), overlapping Laundromat networks
- Multiple Moldovan judges convicted of facilitating fictitious debt judgments

**Source References**:
- OCCRP: The Russian Laundromat Exposed (2014/2017)
- European Parliament Research Service: Danske Bank Money Laundering Scandal (EPRS_BRI(2019)635513)
- Danish FSA: Report on Danske Bank's Estonian Branch (October 2018)

---

## Real Estate Shell Companies

Real estate is one of the highest-risk asset classes for money laundering through shell companies. The core vulnerability is that legal entities — LLCs, trusts, and limited partnerships — can purchase property without disclosing beneficial ownership, particularly in all-cash transactions that bypass bank-level AML scrutiny. FinCEN's Geographic Targeting Orders (GTOs), first issued in 2016 for Manhattan and Miami-Dade County and subsequently expanded nationwide, require title insurance companies to identify the natural persons behind legal entities purchasing residential real estate above specified thresholds in all-cash transactions. The GTOs revealed that approximately 30% of covered transactions involved a beneficial owner who was the subject of a previous suspicious activity report.

Per FinCEN's 2017 Advisory on Residential Real Estate, the following pattern is pervasive: an individual with illicit funds creates an LLC (often in a state with no beneficial ownership disclosure, such as Delaware, Nevada, or Wyoming), uses the LLC to purchase luxury residential property in cash, and thereby converts illicit funds into a stable, appreciating, and potentially income-generating asset without any financial institution filing a SAR. The FATF's report on Money Laundering Through Real Estate identifies similar patterns internationally, particularly in London (via UK offshore-territory LLCs), Vancouver (via trust structures), Dubai (via DIFC entities), and Sydney/Melbourne (via nominee purchases). The pattern extends beyond residential — commercial real estate, hotel investments, and development projects are also used, often through multi-layered holding structures across jurisdictions.

**Structure**:
```
Beneficial Owner (PEP, sanctioned person, or criminal)
  → LLC formed in Delaware/Nevada/Wyoming (no BO disclosure)
    → All-cash purchase of luxury property ($3M+ condo in Miami)
      → No mortgage = no bank SAR filing
        → Property held, rented, or resold
          → Funds integrated into legitimate economy
```

**Detection Method**:
- Check entity name against FinCEN GTO filings and title insurance records
- Identify all-cash real estate purchases by entities with no operating business
- Verify whether the purchasing entity is a recently formed single-purpose LLC
- Cross-reference property ownership records against sanctions lists and PEP databases
- Check for multiple properties purchased through separate LLCs with the same registered agent

**Red Flags**:
- All-cash real estate purchase by LLC or trust above $300K (+30 points)
- Purchasing entity formed within 90 days of transaction (+25 points)
- Single-purpose LLC with no business operations, employees, or website (+20 points)
- Multiple properties purchased through separate LLCs sharing the same registered agent or address (+35 points)
- Purchaser connected to a PEP or individual from a high-risk jurisdiction (+25 points)
- Property purchased significantly above or below market value (+20 points)
- Rapid resale of property within 12 months of purchase (+15 points)

**Enforcement Precedent**:
- FinCEN GTOs revealed ~30% of covered all-cash purchases involved beneficial owners with prior SARs
- Paul Manafort — used shell company real estate purchases to launder $18M+ in Ukrainian consulting income (DOJ 2018)
- Ihor Kolomoisky (Ukrainian oligarch) — used network of shell companies to purchase commercial real estate in Cleveland, Dallas, and other US cities with laundered funds (DOJ 2022 civil forfeiture)

**Source References**:
- FinCEN Geographic Targeting Orders for Real Estate
- FinCEN Advisory: Risks and Trends in Residential Real Estate (August 2017)
- FATF Report: Money Laundering Through Real Estate

---

## Trade-Based Money Laundering via Shell Companies

Trade-based money laundering (TBML) exploits the complexity and volume of international trade to move value across borders through the deliberate misrepresentation of the price, quantity, or quality of goods and services. The FATF's 2006 report identified TBML as one of the three main methods of laundering money (alongside the financial system and physical bulk cash movement), and the 2020 update confirmed it remains the least understood and most difficult to detect. Shell companies are the essential infrastructure of TBML — they exist solely to generate paper trails (invoices, contracts, bills of lading) that justify wire transfers with no underlying commercial substance.

Per FinCEN Advisory FIN-2014-A005, the primary TBML typologies are: (1) over-invoicing — goods are invoiced at inflated values, allowing excess payment to flow to the exporter's account as "legitimate" trade revenue; (2) under-invoicing — goods are invoiced below market value, allowing the importer to resell at market price and pocket the difference; (3) multiple invoicing — the same goods are invoiced multiple times through different shell intermediaries, multiplying the justification for fund transfers; (4) phantom shipments — invoices are created for goods that don't exist, with falsified or no shipping documentation; and (5) misrepresentation of quality/type — low-value goods are described as high-value goods on invoices. The Black Market Peso Exchange (BMPE) is a TBML variant in which drug proceeds in US dollars are used by peso brokers to purchase goods that are shipped to Latin America and sold for local currency, converting drug dollars into clean pesos.

**Structure**:
```
Shell Company A (China/Hong Kong)
  Invoices Shell Company B (Dubai FTZ) for "$5M in electronics"
    → Actual goods value: $500K (over-invoiced 10x)
      → Shell Company B pays $5M via wire transfer
        → $4.5M excess = laundered funds in Hong Kong account
          OR
    → No goods shipped at all (phantom shipment)
      → Wire transfer justified by fabricated invoice and bill of lading
```

**Detection Method**:
- Compare invoice values against global trade databases (UN Comtrade, Import Genius, Panjiva) for price anomalies
- Flag shell company intermediaries in trade chains that add no value (no warehouse, no transformation, no logistics)
- Identify circular trade patterns where goods return to the country of origin through intermediaries
- Check for mismatches between declared goods descriptions and HS codes, shipping weights, or container sizes
- Monitor for entities with high trade volumes but no customs broker, freight forwarder, or logistics contracts

**Red Flags**:
- Invoice prices deviating >30% from global commodity benchmarks for the same HS code (+30 points)
- Shell company intermediary in trade chain with no warehouse, logistics, or value-added operations (+35 points)
- Multiple invoices for the same shipment routed through different shell entities (+40 points)
- Trade between related parties in different jurisdictions with no arm's-length pricing evidence (+25 points)
- Phantom shipment indicators: no bill of lading, no customs declaration, or falsified shipping documents (+45 points)
- Rapid succession of trade transactions between the same pair of shell entities (+20 points)
- Goods routed through FTZs with minimal customs inspection (+15 points)

**Enforcement Precedent**:
- Lebanese Canadian Bank — $102M DOJ forfeiture (2013), Hezbollah TBML network using used car dealerships and consumer goods
- Altaf Khanani Money Laundering Organization — DOJ (2015), $16B+ laundered through BMPE and TBML networks across Pakistan, UAE, and US
- FinCEN Advisory FIN-2014-A005 documented systemic TBML through Chinese underground banking and Latin American trade corridors

**Source References**:
- FATF Report: Trade-Based Money Laundering (2006)
- FinCEN Advisory FIN-2014-A005: Trade-Based Money Laundering (February 2014)
- FATF Report: Trade-Based Money Laundering — Trends and Developments (2020)

---

## Professional Enablers: Formation Agents and Gatekeepers

Shell company networks do not build themselves. Behind every complex layered structure is a professional enabler — a corporate service provider (CSP), law firm, accounting firm, or trust company — that creates and maintains the entities, provides nominee directors, opens bank accounts, and manages ongoing compliance filings. The FATF's 2018 report on Professional Money Laundering identifies these gatekeepers as critical facilitators, finding that "professional money launderers offer bespoke services including the creation of complex multi-jurisdictional corporate structures designed to obscure beneficial ownership."

Mossack Fonseca, the Panamanian law firm at the center of the 2016 Panama Papers leak (11.5 million documents, 214,000+ offshore entities, connections to 140+ politicians), epitomized the industrial-scale CSP model. The firm created shell companies in BVI, Panama, Seychelles, and other secrecy jurisdictions on demand, provided nominee directors drawn from a pool of employees, and opened bank accounts at correspondent banks worldwide. But Mossack Fonseca was not unique — Formations House, a UK-based corporate service provider, was found by the UK National Crime Agency to have created over 29,000 companies, many of which were used for fraud, money laundering, and sanctions evasion. Asiaciti Trust (Singapore), exposed in the Pandora Papers, created complex trust-and-company structures for PEPs and individuals under investigation. Trident Trust (BVI) appeared repeatedly in the Panama Papers as a provider of nominee services for high-risk clients.

**Detection Method**:
- Identify the formation agent or registered agent for every entity in a corporate chain
- Cross-reference formation agents against known high-risk CSPs (ICIJ Panama Papers, Pandora Papers databases)
- Check for nominee directors who appear as directors of 50+ entities (professional nominee indicators)
- Verify whether the entity's registered address is a formation agent's office (mail forwarding address)
- Flag law firms and trust companies that appear repeatedly across unrelated client structures

**Red Flags**:
- Entity formed by a CSP named in ICIJ leaked databases (Mossack Fonseca, Alcogal, Asiaciti Trust, Trident Trust) (+40 points)
- Formation agent address shared by 100+ registered entities (+35 points)
- Nominee directors who serve on 50+ corporate boards across multiple jurisdictions (+30 points)
- Entity directors are themselves corporate entities (not natural persons) at every layer (+25 points)
- Registered agent recently changed or entity recently transferred between formation agents (+15 points)
- Professional enabler previously sanctioned, investigated, or charged with facilitating money laundering (+45 points)

**Enforcement Precedent**:
- Mossack Fonseca — Panama Papers (2016), firm closed 2018, founders convicted of money laundering (2024)
- Formations House (UK) — NCA prosecution, director sentenced for money laundering, 29,000+ companies created for criminals
- Asiaciti Trust — Pandora Papers (2021), complex structures for PEPs and individuals under investigation
- NatWest fined £264M (2021) partly for failures related to accounts opened through professional intermediaries

**Source References**:
- FATF Report: Professional Money Laundering (2018)
- ICIJ: Panama Papers Investigation (2016)
- UK National Crime Agency: Formations House Case

---

## Aging and Shelf Company Schemes

Shelf companies — also called "aged companies" — are pre-formed corporate entities that have been kept dormant for months or years, then sold to buyers who want the appearance of an established business history. The aging of a company is itself a product: formation agents maintain inventories of dormant LLCs and corporations across multiple jurisdictions, selling them at premiums based on age (a 5-year-old Delaware LLC might sell for $3,000–$10,000). Buyers use aged companies to open bank accounts (banks are more likely to approve accounts for entities with a multi-year registration history), obtain credit lines, qualify for government contracts with minimum business age requirements, or create the appearance of a legitimate long-standing business relationship.

The scheme works because automated compliance systems and manual KYC reviews both use incorporation date as a risk factor — recently formed entities trigger enhanced scrutiny, while entities with a 3–5 year history are presumed to be lower risk. The FATF's report on Concealment of Beneficial Ownership identifies shelf company purchases as a key red flag, noting that the sudden reactivation of a dormant entity with immediate large transactions is a strong indicator of misuse. The UK's Economic Crime and Corporate Transparency Act 2022 (ECTE Act) introduced new powers for Companies House to challenge and remove directors, verify identities, and flag dormant companies that suddenly become active — a direct response to the abuse of UK shelf companies in laundering schemes including the Russian Laundromat.

**Detection Method**:
- Flag entities with a gap of 2+ years between incorporation and first significant transaction
- Identify sudden changes in directors, officers, or registered agent after a period of dormancy
- Check for corporate registry filings showing a transfer of ownership or change of control
- Monitor for immediate large transactions or bank account openings following reactivation
- Verify whether the entity was purchased from a known shelf company provider

**Red Flags**:
- Entity dormant for 2+ years then suddenly active with large transactions (+30 points)
- Complete change of directors and registered agent within 30 days of first transaction (+35 points)
- Entity formation date significantly predates any business activity or revenue (+20 points)
- Entity purchased from a known shelf company vendor or formation agent (+25 points)
- Immediate application for bank accounts, credit lines, or trade finance upon reactivation (+25 points)
- Generic company name consistent with shelf company inventories ("Global Solutions Inc", "Premier Holdings LLC") (+10 points)

**Enforcement Precedent**:
- UK Companies House reported thousands of dormant companies reactivated and used in fraud, prompting the ECTE Act 2022
- Russian Laundromat scheme used aged UK LLPs purchased from formation agents to add legitimacy to fund transfers
- Multiple SAR filings cite aged/shelf companies used to fraudulently obtain PPP loans (COVID-era, 2020–2021)

**Source References**:
- UK Economic Crime and Corporate Transparency Act 2022
- FATF Report: Concealment of Beneficial Ownership (Best Practices on Beneficial Ownership for Legal Persons)

---

## Golden Visa and Citizenship-by-Investment Shell Structures

Citizenship-by-Investment (CBI) and Residency-by-Investment (RBI) programs — commonly known as "golden visa" programs — create a specific shell company typology: entities formed solely to meet the minimum investment threshold required for immigration benefits. The FATF's guidance on CBI/RBI programs identifies risks including inadequate due diligence on applicants, investment through opaque corporate structures, and the use of CBI-obtained nationality to circumvent sanctions or travel restrictions. The OECD's analysis warns that CBI programs can undermine the Common Reporting Standard (CRS) for automatic exchange of tax information, as individuals use new citizenships to misrepresent their tax residency.

The Cyprus "golden passport" scandal (2020) is the defining case. An Al Jazeera undercover investigation and subsequent EU Anti-Fraud Office (OLAF) probe revealed that Cyprus had granted citizenship to convicted criminals, sanctioned individuals, and PEPs from Russia, China, and the Middle East in exchange for investments of €2.15 million+ (typically €2M in real estate plus €150K donation). Many applicants used shell companies to channel investments, obscuring the source of funds. Cyprus revoked 45 passports and eventually shut down the CBI program in November 2020 under EU pressure. Malta's Individual Investor Programme and Portugal's Golden Visa have faced similar scrutiny, with concerns about Russian oligarchs and Chinese PEPs obtaining EU residency through shell company investments. In the Caribbean, programs in St. Kitts and Nevis, Dominica, and Antigua and Barbuda have been flagged by the US Treasury for potential abuse by sanctioned individuals and Iranian nationals.

**Detection Method**:
- Flag individuals holding passports from known CBI jurisdictions (Cyprus, Malta, St. Kitts, Dominica, Antigua, Vanuatu, Turkey)
- Check whether the individual's nationality was obtained via investment program (CBI databases, public revocation lists)
- Identify shell companies formed specifically to channel CBI/RBI investment amounts matching program thresholds
- Cross-reference CBI holders against sanctions lists, PEP databases, and adverse media

**Red Flags**:
- Individual holds passport from CBI jurisdiction but has no personal, family, or business ties to that country (+25 points)
- Shell company investment of exactly the CBI threshold amount (e.g., €2.15M for Cyprus, $100K–$400K for Caribbean programs) (+20 points)
- Individual changed nationality or acquired second citizenship within 2 years of sanctions designation or criminal investigation (+40 points)
- Investment channeled through a chain of shell entities rather than directly from the individual (+30 points)
- CBI-country passport used alongside a different country's address, phone number, and business operations (+20 points)
- Individual appears on a CBI revocation list or was flagged in OLAF/EU investigations (+45 points)

**Enforcement Precedent**:
- Cyprus CBI program shut down (2020), 45 passports revoked, OLAF investigation into systemic due diligence failures
- Malta IIP — EU infringement proceedings (2022), concerns about inadequate vetting of Russian and Libyan applicants
- St. Kitts and Nevis — US Treasury advisory (2014) warning that CBI-obtained passports were being used by Iranian nationals for sanctions evasion
- Jho Low (1MDB) — obtained CBI passport from St. Kitts and Nevis, used to evade arrest warrants

**Source References**:
- European Parliament Question: Cyprus CBI OLAF Investigation (E-9-2021-000286)
- FATF Guidance: Citizenship and Residency by Investment Programmes
- OECD: Residence/Citizenship by Investment Schemes — Potential for Abuse

---

## NPO and Charity Shell Structures

Non-profit organizations (NPOs) present a distinct shell company risk because they combine cross-border fund transfers, donor anonymity, limited financial oversight, and a humanitarian narrative that discourages scrutiny. FATF Recommendation 8 and its 2023 Best Practices guidance recognize that NPOs can be abused for terrorist financing and sanctions evasion through three vectors: (1) diversion of funds from a legitimate charity to illicit actors; (2) use of a legitimate charity as a cover for fund transfers to conflict zones; and (3) creation of a purpose-built front organization with no genuine charitable activity.

FinCEN Advisory FIN-2014-A008 identifies specific red flags for NPO abuse in the context of terrorist financing, including: operating in or near conflict zones or areas with active terrorist organizations; transferring large sums to jurisdictions with weak AML controls under humanitarian pretexts; maintaining minimal program activity relative to funds raised; and having leadership with known connections to designated entities. OFAC's sanctions designations have targeted numerous charities found to be fronts for terrorist organizations, including entities linked to Hamas, Hezbollah, and Al-Qaeda. The distinction between a legitimate charity operating in a high-risk environment and a purpose-built shell charity is often difficult to discern without field-level investigation, but financial patterns provide screening-relevant indicators.

**Structure**:
```
Front Charity (registered in US/EU as 501(c)(3) or equivalent)
  ← Donations from sympathizers (tax-deductible, anonymous above small thresholds)
    → Claimed purpose: "humanitarian aid" or "educational programs"
      → Funds wired to partner NPO in conflict zone (Turkey, Lebanon, Somalia, Pakistan)
        → Funds diverted to designated organization or procurement network
          → No verifiable program delivery or beneficiary records
```

**Detection Method**:
- Verify NPO registration and tax-exempt status against government registries (IRS 990s, Charity Commission)
- Compare program expenditures to total revenue — legitimate charities typically spend 65–85% on programs
- Check whether the NPO or its leadership appears on OFAC SDN list, UN sanctions lists, or EU consolidated list
- Review wire transfer destinations against high-risk jurisdictions and conflict zones
- Verify that the NPO has identifiable programs, staff, and beneficiaries at its stated areas of operation

**Red Flags**:
- NPO with <30% of revenue spent on stated charitable programs (+30 points)
- Wire transfers from NPO to jurisdictions with active conflict or known terrorist organization presence (+25 points)
- NPO leadership or board members with connections to OFAC-designated entities (+45 points)
- Charity registered within 12 months of beginning to process large fund transfers (+20 points)
- No verifiable program delivery: no beneficiary records, no field staff, no partner organizations (+35 points)
- NPO receiving large anonymous donations and immediately wiring funds overseas (+30 points)
- Charity operates in a conflict zone but has no presence in recognized humanitarian coordination mechanisms (UN OCHA, ICRC) (+20 points)

**Enforcement Precedent**:
- Holy Land Foundation — $12.4M conviction (2008), DOJ found foundation was primary US fundraising arm for Hamas
- Al-Haramain Islamic Foundation — OFAC SDN designation (2004), designated for supporting Al-Qaeda
- Benevolence International Foundation — OFAC designation and DOJ prosecution (2002), terrorist financing through charitable donations
- OFAC has designated dozens of NPOs under Executive Orders 13224 and 13886

**Source References**:
- FATF Recommendation 8: Best Practices — Combating the Abuse of NPOs (2023)
- FinCEN Advisory FIN-2014-A008: Advisory to Financial Institutions on Filing SARs Regarding Terrorist Financing
- OFAC FAQ Topic 1626: NPO-Related Sanctions Designations

---

## Sanctions Evasion Shell Networks

Sanctioned states — primarily Russia, Iran, and North Korea (DPRK) — operate sophisticated, state-directed shell company networks designed to circumvent financial sanctions and maintain access to the global economy. FinCEN Alert FIN-2022-Alert001 (March 2022, updated after Russia's invasion of Ukraine) identifies the primary evasion typologies used by Russian elites and oligarchs: use of shell companies and legal arrangements to obscure ownership of assets; third-party intermediaries and proxies (family members, lawyers, trust companies) holding assets on behalf of sanctioned persons; all-cash luxury real estate purchases through LLCs; acquisition of high-value assets (yachts, aircraft, art) registered through offshore entities; and potential use of cryptocurrency to move value outside traditional financial channels.

The OFAC 50% Rule is central to sanctions compliance: if a blocked person owns 50% or more of an entity, that entity is also blocked — even if it doesn't appear on the SDN list. Sanctioned actors circumvent this by dispersing ownership below 50% across multiple shell entities, each held by a different nominee. The UN Panel of Experts reports on DPRK document elaborate networks: North Korean front companies operating in China, Singapore, and Southeast Asia use falsified documentation, multiple identities, and layers of intermediary entities to procure dual-use technology and access the international banking system. Iran's sanctions evasion networks operate primarily through Turkish, Emirati, and Chinese intermediary companies, often using the gold-for-gas scheme (as in the Halkbank case) or falsified end-user certificates for dual-use goods.

**Structure**:
```
Sanctioned Oligarch (SDN-listed)
  → Family Member A (not sanctioned, holds 30% of Entity X)
  → Trusted Associate B (not sanctioned, holds 30% of Entity X)
  → Nominee Lawyer C (holds 25% of Entity X via trust)
  → Charity D (holds 15% of Entity X)
      → No single holder exceeds 50% → Entity X NOT automatically blocked
        → Entity X holds: yacht, London townhouse, Swiss bank account
```

**Detection Method**:
- Apply OFAC 50% Rule analysis: aggregate ownership across all related persons and entities
- Check all directors, shareholders, and beneficial owners against SDN, EU, and UN sanctions lists
- Identify ownership dispersion patterns designed to keep individual holdings below 50%
- Monitor for proxies: family members of sanctioned persons appearing as owners of high-value assets
- Cross-reference entity addresses, formation agents, and bank accounts against prior sanctions designations

**Red Flags**:
- Entity with beneficial owners who are family members or known associates of sanctioned persons (+50 points)
- Ownership structure dispersed across multiple nominees with each holding <50% (+35 points)
- Entity registered in jurisdiction commonly used for sanctions evasion (UAE, Turkey, BVI, Seychelles, China/HK) with nexus to sanctioned country (+30 points)
- High-value asset (yacht, aircraft, real estate) registered to an entity with opaque ownership and nexus to Russia, Iran, or DPRK (+40 points)
- Rapid transfer of assets or change of entity ownership following new sanctions designations (+45 points)
- Wire transfers structured to avoid OFAC screening triggers (e.g., removing sanctioned country references from payment messages) (+35 points)
- Entity name is a transliteration variant of a known sanctioned person's name (+30 points)

**Enforcement Precedent**:
- Halkbank (Turkey) — DOJ indictment (2019), gold-for-gas sanctions evasion scheme on behalf of Iran, $20B+ in transactions
- ZTE Corporation (China) — $892M penalty (2017), sanctions evasion selling US technology to Iran and DPRK
- Viktor Vekselberg — US sanctions (2018), extensive use of Cypriot and BVI shell companies to hold assets
- Russian oligarch yacht seizures (2022–present): Amadea (Kerimov), Scheherazade (linked to Putin), Sy (Mordashov) — all held through layers of shell companies

**Source References**:
- FinCEN Alert FIN-2022-Alert001: Russian Elites, Proxies, and Oligarchs (March 2022)
- OFAC Russia Sanctions Program
- UN Security Council Panel of Experts Reports on DPRK (Resolution 1718)

---

## Shell Companies in Insurance and Reinsurance

The insurance sector offers laundering opportunities through shell companies primarily via three mechanisms: captive insurance companies, single-premium life insurance products, and reinsurance fronting arrangements. The FATF's report on Money Laundering in the Insurance Sector identifies insurance as a vehicle for integrating illicit funds because premiums can be paid with laundered money, policies can be surrendered for clean funds (minus a penalty), and the sector's complexity obscures beneficial ownership.

Captive insurance companies are the most common shell company structure in this context. A captive is an insurance company created solely to insure the risks of its parent company or related entities. While legitimate captives serve valid risk management purposes, the IRS identified widespread abuse through "micro-captive" arrangements (Notice 2016-66, listed transaction). In abusive structures, a business creates a captive insurance company in an offshore jurisdiction (Bermuda, Cayman Islands, Vermont, or other captive-friendly domiciles), pays inflated premiums to the captive for purported insurance coverage, deducts the premiums as business expenses, and the captive — which may face few or no claims — accumulates funds that benefit the owner tax-free. When shell companies are used as the insured entities, the entire structure becomes a laundering mechanism: illicit funds flow in as "premiums" and emerge as "investment returns" or "claim payments" from the captive. Reinsurance fronting extends this further — a shell reinsurer in an offshore jurisdiction accepts premiums ceded from a front insurer, with little intention of paying claims, and the funds are effectively laundered through the reinsurance chain.

**Detection Method**:
- Identify captive insurance companies in corporate structures, especially in offshore domiciles
- Check whether the captive writes coverage only for related entities (no third-party business)
- Compare premium volume to claim history — captives with high premiums and near-zero claims are suspicious
- Flag single-premium life insurance policies purchased by shell companies or entities with no insurable interest
- Review reinsurance arrangements for ceded premiums flowing to shell reinsurers with minimal capitalization

**Red Flags**:
- Captive insurance company in offshore jurisdiction insuring only related-party risks (+25 points)
- Premium-to-claim ratio exceeding 10:1 over multiple years (+30 points)
- Captive insurance company with no licensed actuaries, underwriters, or claims staff (+20 points)
- Single-premium life insurance policy purchased by a shell entity and surrendered within 2 years (+35 points)
- Reinsurance premiums ceded to an entity with minimal capitalization and no independent clients (+30 points)
- Insurance policy beneficiary is a shell company or trust in a secrecy jurisdiction (+25 points)
- Entity appears on IRS listed transaction disclosure (Form 8886) for micro-captive arrangements (+20 points)

**Enforcement Precedent**:
- IRS Notice 2016-66 — classified micro-captive insurance transactions as "transactions of interest," triggering mandatory disclosure
- Multiple IRS Tax Court cases (Avrahami v. Commissioner, 2017; Reserve Mechanical Corp v. Commissioner, 2018) — micro-captive arrangements found to lack economic substance
- FATF identified insurance sector vulnerabilities in Caribbean, Bermuda, and Channel Islands mutual evaluations

**Source References**:
- IRS Notice 2016-66: Micro-Captive Insurance Transactions of Interest
- FATF Report: Money Laundering in the Insurance Sector

---

## Virtual Asset Service Provider (VASP) Shells

Virtual Asset Service Providers operating as shell entities represent a convergence of cryptocurrency's regulatory gaps and traditional shell company opacity. The FATF's 2021 Updated Guidance defines VASPs broadly — any entity that conducts exchange, transfer, safekeeping, or administration of virtual assets — and extends AML obligations to them. However, enforcement lags behind guidance, and many jurisdictions still have no VASP-specific licensing or AML framework, enabling the creation of shell VASPs that process billions in transactions with no meaningful compliance.

The BitMEX case is the defining example. The exchange, incorporated in Seychelles and operated from offices that shifted between Hong Kong, Singapore, and the US, deliberately structured its corporate entity and operations to evade US BSA requirements. DOJ charged its three founders (Arthur Hayes, Benjamin Delo, Samuel Reed) with violating the Bank Secrecy Act by operating an unregistered money services business and failing to implement an AML program. BitMEX processed over $11 billion in cryptocurrency transactions while maintaining "essentially nonexistent" KYC procedures — requiring only an email address to open an account. The Seychelles incorporation was specifically chosen because Seychelles had no AML framework for crypto exchanges at the time. This model — registering a VASP as a shell entity in a permissive jurisdiction while serving global customers — has been replicated by numerous exchanges and OTC desks. Per FinCEN's 2019 CVC Guidance, any entity that accepts and transmits convertible virtual currency is a money transmitter under the BSA, regardless of where it is incorporated. Peer-to-peer OTC desks operating through shell LLCs — often advertising on Telegram or LocalBitcoins — represent the current frontier: they convert large cryptocurrency volumes to fiat for clients with minimal or no identity verification, functioning as unlicensed money services businesses.

**Detection Method**:
- Verify VASP registration status against FinCEN MSB registry, FCA crypto register, and jurisdiction-specific databases
- Check whether the VASP entity has a physical office, licensed compliance officer, and published AML policy
- Identify VASPs registered in jurisdictions with no crypto AML framework (Seychelles, BVI, pre-2022 Estonia)
- Flag crypto transactions flowing through entities with shell company characteristics
- Monitor for OTC desk advertisements on Telegram, Discord, or peer-to-peer platforms offering "no KYC" services

**Red Flags**:
- VASP registered in jurisdiction with no crypto AML requirements (+30 points)
- Exchange or OTC desk with no published KYC/AML policy or compliance team (+35 points)
- VASP entity with shell characteristics: no employees, no physical office, registered agent address only (+25 points)
- Entity processing crypto transactions but not registered as an MSB with FinCEN (if serving US customers) (+40 points)
- OTC desk advertising "no KYC" or "anonymous" conversion services (+45 points)
- VASP previously subject to enforcement action or currently unlicensed/delicensed (+30 points)
- High-volume crypto-to-fiat conversion through an entity with no verifiable business operations (+30 points)

**Enforcement Precedent**:
- BitMEX — DOJ criminal charges (2020), $100M CFTC settlement (2021), founders pleaded guilty to BSA violations
- Suex OTC — first OFAC-designated crypto entity (September 2021), processed ransomware proceeds, operated as shell with no meaningful compliance
- Binance — $4.3B DOJ/FinCEN/OFAC settlement (2023), CEO pleaded guilty, operated without adequate AML controls
- BTC-e/WEX — Alexander Vinnik indicted (2017), $4B+ laundered through exchange with no AML program, operated through shell entities across multiple jurisdictions

**Source References**:
- FATF Updated Guidance for a Risk-Based Approach to Virtual Assets and VASPs (October 2021)
- DOJ Press Release: BitMEX Founders Charged with BSA Violations (SDNY, October 2020)
- FinCEN Guidance: Application of FinCEN's Regulations to Certain Business Models Involving Convertible Virtual Currencies (May 2019)
