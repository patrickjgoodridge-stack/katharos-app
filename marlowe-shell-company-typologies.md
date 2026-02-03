# Shell Company Typologies — Detection and Risk Assessment

Add this document to Marlowe's RAG knowledge base. Chunk by section. Category: "typologies". Embed and upsert to vector store under namespace "shell-companies".

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

## Shell Company Detection Checklist for Marlowe

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

When Marlowe identifies shell company indicators, use this language:

**CONFIRMED SHELL (Critical)**:
"[Entity Name] exhibits characteristics of a shell company used for [purpose]. The entity is registered in [jurisdiction], has no identifiable business operations, [additional indicators]. This structure is consistent with [typology] as seen in [enforcement case reference]. RECOMMENDATION: Enhanced due diligence required. Do not proceed without verified beneficial ownership."

**SUSPECTED SHELL (High)**:
"[Entity Name] has characteristics associated with shell company structures: [list indicators]. While shell companies can serve legitimate purposes, the combination of [specific risk factors] warrants further investigation. RECOMMENDATION: Verify beneficial ownership and commercial substance before proceeding."

**POSSIBLE SHELL (Moderate)**:
"[Entity Name] is a [entity type] registered in [jurisdiction] with limited publicly available information about its operations. This does not necessarily indicate illicit purpose, but [specific concern]. RECOMMENDATION: Request additional documentation on beneficial ownership and business purpose."

---

## Corporate Transparency Act (CTA) Impact

As of January 1, 2024, most US companies must report beneficial ownership information to FinCEN. This changes Marlowe's US entity screening:

- New companies must file within 30 days of formation
- Existing companies had until January 1, 2025
- Beneficial owners (25%+ ownership or substantial control) must be disclosed
- Reporting to FinCEN BOI database (not yet publicly accessible)
- Exemptions: Large operating companies (20+ employees, $5M+ revenue, physical US office), banks, registered investment companies, and other already-regulated entities

**Screening Implication**: US LLCs that previously offered anonymous ownership now have disclosure requirements. Failure to file is itself a red flag. However, the BOI database is not publicly searchable — Marlowe should note when US entity beneficial ownership cannot be independently verified.
