# Enforcement Case Studies for Katharos RAG

Add all of these enforcement case studies to the Katharos RAG knowledge base. Chunk each case as a single document. Category: "enforcement". Embed and upsert to Pinecone.

---

## TD Bank — 2024

**Entity**: TD Bank N.A.
**Regulator**: DOJ, FinCEN, OCC
**Penalty**: $3.09 billion
**Typologies**: Structuring, BSA/AML failures, willful blindness

### What Happened
TD Bank failed to monitor $18.3 trillion in customer activity over 6 years. Employees facilitated money laundering by drug traffickers who deposited cash through multiple branches. The bank had known gaps in its transaction monitoring system and chose not to fix them.

### How It Was Caught
FinCEN investigation triggered by suspicious activity reports from other banks flagging TD customers. DOJ criminal investigation followed.

### Red Flags That Were Missed
- Customers depositing $1M+ in cash over months across branches
- Same customers structuring deposits below $10K threshold
- Employees coaching customers on how to avoid reporting
- Transaction monitoring system had known blind spots
- Over 90% of transactions went unmonitored

### Key Indicators
- High-volume cash deposits across multiple branches
- Structuring patterns (deposits just below $10K)
- Employee complicity or willful blindness
- Transaction monitoring system gaps
- Rapid movement of deposited cash to foreign accounts

### Lesson for Screening
Flag any financial institution where cash deposit volume is disproportionate to business type, where structuring patterns appear across branches, or where transaction monitoring coverage has known gaps. TD Bank's failure was not that the laundering was sophisticated — it was that the bank chose not to look.

---

## Danske Bank — 2018

**Entity**: Danske Bank Estonia Branch
**Regulator**: Danish FSA, DOJ, SEC, Estonian regulators
**Penalty**: $2 billion (DOJ settlement)
**Typologies**: Correspondent banking abuse, shell company layering, non-resident account abuse, PEP laundering

### What Happened
Between 2007-2015, approximately $230 billion in suspicious transactions flowed through Danske Bank's Estonian branch from non-resident customers, primarily from Russia and former Soviet states. Many customers were shell companies with no real business activity.

### How It Was Caught
Internal whistleblower Howard Wilkinson raised concerns in 2013. Danish newspaper Berlingske published investigation in 2017. Regulators acted after media exposure.

### Red Flags That Were Missed
- 15,000 non-resident customers with minimal KYC
- Customers were shell companies in secrecy jurisdictions
- Transaction volumes grossly disproportionate to stated business
- Multiple PEPs among customer base
- Correspondent banks raising concerns ignored
- Branch operating essentially as a separate bank with no oversight

### Key Indicators
- Non-resident accounts with high transaction volumes
- Shell company customers with nominee structures
- Transactions flowing from high-risk jurisdictions (Russia, Azerbaijan)
- PEP connections
- Correspondent bank warnings
- Branch-level autonomy without group oversight

### Lesson for Screening
Flag any entity with non-resident accounts showing transaction volumes disproportionate to business profile, especially when connected to Russian or CIS shell companies. The Danske case shows how a single branch can become a laundering pipeline when KYC is neglected for non-resident customers.

---

## 1MDB — 2015

**Entity**: 1Malaysia Development Berhad
**Regulator**: DOJ, Swiss AG, Singapore MAS, multiple
**Penalty**: $4.5 billion+ in assets sought by DOJ
**Typologies**: PEP corruption, shell company layering, misappropriation of sovereign funds, real estate laundering

### What Happened
Malaysian sovereign wealth fund 1MDB was looted of $4.5 billion by officials including PM Najib Razak. Funds were laundered through shell companies, Swiss bank accounts, and used to purchase luxury real estate, a superyacht, and finance the film "The Wolf of Wall Street."

### How It Was Caught
Investigative journalists (Sarawak Report, Wall Street Journal) traced fund flows. Swiss AG opened investigation. DOJ filed civil forfeiture complaints.

### Red Flags That Were Missed
- Sovereign fund with minimal oversight
- Funds routed through BVI and Seychelles shell companies
- Goldman Sachs earned $600M in fees for bond offerings (unusually high)
- Immediate transfers to personal accounts after bond issuance
- Luxury asset purchases by associates of PM
- PEP (sitting PM) with direct access to fund

### Key Indicators
- Government fund with opaque governance
- Immediate layering through offshore shells post-fundraise
- Luxury real estate purchases in NYC, LA, London
- Connected PEPs with unexplained wealth
- Unusually high intermediary fees
- Cross-border flows with no business rationale

### Lesson for Screening
Flag any sovereign wealth fund or government-linked entity where funds flow immediately to offshore structures, where PEPs have direct control, or where luxury asset purchases appear connected to fund disbursements. The 1MDB case demonstrates how PEP corruption and shell company layering combine at sovereign scale.

---

## HSBC — 2012

**Entity**: HSBC Holdings
**Regulator**: DOJ, OCC
**Penalty**: $1.9 billion
**Typologies**: Mexican drug cartel laundering, sanctions evasion, BSA/AML failures, bulk cash smuggling

### What Happened
HSBC Mexico moved $881 million in drug proceeds for cartels including Sinaloa. The bank also processed transactions for sanctioned entities in Iran, Libya, Sudan, Burma, and Cuba by stripping wire transfer information to bypass OFAC filters.

### How It Was Caught
OCC examination identified AML deficiencies. Senate Permanent Subcommittee on Investigations conducted yearlong investigation.

### Red Flags That Were Missed
- Mexican branch cash volumes exceeded all other Mexican banks
- Bulk cash deposits from casas de cambio
- Wire stripping to remove sanctioned country references
- Correspondent banking with Al Rajhi Bank (terror financing links)
- Internal compliance warnings ignored by management
- Compliance staff insufficient for bank's risk profile

### Key Indicators
- Cash volumes disproportionate to market
- Casas de cambio as customers
- Wire stripping (removing originator/beneficiary info)
- Correspondent relationships with high-risk banks
- Sanctions filter manipulation
- Compliance understaffing

### Lesson for Screening
Flag any financial institution with disproportionate cash volumes, especially in high-risk corridors (Mexico, Colombia). Wire stripping is a critical indicator — any evidence of sanitizing payment messages to avoid sanctions filters should be treated as CRITICAL severity.

---

## Wirecard — 2020

**Entity**: Wirecard AG
**Regulator**: German BaFin, DOJ, Philippine authorities
**Penalty**: Company collapsed, CEO arrested
**Typologies**: Financial statement fraud, fictitious revenue, phantom customers, regulatory capture

### What Happened
German payments company fabricated €1.9 billion in cash balances that did not exist. Revenue from "third-party acquiring" partnerships in Asia was largely fictitious. The fraud sustained a €24 billion market cap.

### How It Was Caught
Financial Times journalist Dan McCrum investigated from 2015. Short sellers (Zatarra Research) published reports. EY audit finally could not confirm cash balances in 2020.

### Red Flags That Were Missed
- Cash balances held in obscure Philippine banks
- Revenue from unverifiable third-party partners
- Aggressive response to journalist investigations
- BaFin investigated the short sellers instead of Wirecard
- Round-trip transactions to inflate revenue
- Acquisitions used to justify growth

### Key Indicators
- Cash in banks that cannot be independently verified
- Revenue dependent on opaque third-party arrangements
- Management attacking critics instead of addressing concerns
- Regulator defending company against investigations
- Acquisition-driven growth masking organic weakness

### Lesson for Screening
Flag any company where significant cash balances are held in jurisdictions that resist independent verification, where revenue depends on opaque partnerships, or where management responds aggressively to legitimate scrutiny. Wirecard shows how financial statement fraud can persist when regulators fail to act.

---

## BNP Paribas — 2014

**Entity**: BNP Paribas S.A.
**Regulator**: DOJ, OFAC, New York DFS
**Penalty**: $8.9 billion
**Typologies**: Sanctions evasion, wire stripping, concealment

### What Happened
BNP processed $30 billion in transactions for sanctioned entities in Sudan, Iran, and Cuba over a decade. The bank used satellite banks, stripped wire messages, and routed transactions through non-US affiliates to hide the sanctioned parties.

### How It Was Caught
New York DFS investigation. Internal compliance officers had raised concerns that were overridden by senior management.

### Red Flags That Were Missed
- Wire messages altered to remove references to sanctioned countries
- Transactions routed through intermediary banks to avoid US filters
- Compliance objections overridden by business units
- Use of cover payments to obscure originator
- Decade-long pattern of deliberate evasion

### Key Indicators
- Wire stripping and message manipulation
- Use of intermediary/satellite banks
- Cover payments hiding true parties
- Compliance overrides by business management
- Concentrated transactions in sanctioned jurisdictions

### Lesson for Screening
Flag any institution where wire messages are incomplete, where cover payments are used extensively, or where transaction routing appears designed to avoid specific jurisdictions' filters. BNP shows that sanctions evasion can be systematic and management-driven.

---

## FTX — 2022

**Entity**: FTX Trading Ltd, Alameda Research
**Regulator**: DOJ, SEC, CFTC
**Penalty**: CEO sentenced to 25 years, $11B+ in losses
**Typologies**: Misappropriation of customer funds, financial statement fraud, commingling, wire fraud

### What Happened
FTX CEO Sam Bankman-Fried directed the transfer of billions in customer deposits to Alameda Research, his trading firm. Alameda used customer funds for risky trades, venture investments, real estate, and political donations. FTX had no proper accounting and used QuickBooks for a $32B company.

### How It Was Caught
CoinDesk article revealed Alameda's balance sheet was mostly FTT tokens. Binance CEO announced intent to sell FTT holdings. Bank run followed. FTX could not honor withdrawals.

### Red Flags That Were Missed
- No independent board or audit committee
- Customer funds and trading firm commingled
- CEO controlled both exchange and largest trading counterparty
- No CFO for extended periods
- Headquartered in Bahamas for regulatory arbitrage
- Related-party transactions between FTX and Alameda
- Extraordinary political donations from company funds

### Key Indicators
- Commingled customer and operating funds
- Related-party transactions with affiliated trading firm
- No independent governance
- Regulatory arbitrage (offshore jurisdiction)
- Token-based balance sheet (FTT as collateral)
- Lifestyle spending from company funds

### Lesson for Screening
Flag any crypto entity where customer funds lack segregation, where the operator also runs a major trading counterparty, or where governance structures are absent. FTX demonstrates how crypto-specific risks (token-based collateral, offshore jurisdiction) amplify traditional fraud patterns.

---

## Binance — 2023

**Entity**: Binance Holdings Ltd
**Regulator**: DOJ, FinCEN, OFAC, CFTC
**Penalty**: $4.3 billion, CEO resigned and pleaded guilty
**Typologies**: BSA/AML violations, sanctions evasion, unlicensed money transmission

### What Happened
Binance operated the world's largest crypto exchange without adequate AML controls. The platform facilitated transactions with sanctioned jurisdictions including Iran, Cuba, and Syria. Binance deliberately structured operations to avoid US regulatory requirements while serving US customers.

### How It Was Caught
DOJ and FinCEN multi-year investigation. Internal communications showed deliberate compliance avoidance.

### Red Flags That Were Missed
- No formal KYC until 2021
- Internal messages discussing sanctions evasion
- VPN usage encouraged to bypass geo-restrictions
- Transactions with Iranian, Cuban, Syrian users
- Corporate structure designed to obscure jurisdiction
- No clear headquarters or regulatory home

### Key Indicators
- Crypto exchange without KYC program
- Deliberately opaque corporate structure
- No regulatory registration despite serving regulated markets
- Internal communications showing awareness of violations
- Geographic restrictions easily circumvented

### Lesson for Screening
Flag any crypto exchange or financial service that lacks clear jurisdictional registration, has minimal KYC requirements, or uses opaque corporate structures. Binance shows that deliberate regulatory avoidance at scale eventually results in massive enforcement action.

---

## Standard Chartered — 2012/2019

**Entity**: Standard Chartered Bank
**Regulator**: New York DFS, DOJ, OFAC, UK FCA
**Penalty**: $1.1 billion (2019), $667 million (2012)
**Typologies**: Sanctions evasion (Iran, Myanmar, Zimbabwe, Cuba, Syria), wire stripping, AML failures

### What Happened
Standard Chartered processed $265 billion in transactions for Iranian clients over a decade by stripping wire messages of references to Iran. After the 2012 settlement, the bank continued to violate sanctions through its UAE operations, leading to a second enforcement action in 2019.

### How It Was Caught
New York DFS investigation led by Benjamin Lawsky. Whistleblower complaints. Continued monitoring after 2012 settlement revealed ongoing violations.

### Red Flags That Were Missed
- Wire messages deliberately altered to remove Iranian bank references
- U-turn transactions routed to avoid detection
- UAE branch processing Iranian transactions after first settlement
- Compliance department underfunded relative to risk
- Repeat violations after first enforcement

### Key Indicators
- Wire stripping and message alteration
- U-turn transactions
- Repeat offender behavior
- UAE as conduit for sanctioned jurisdiction transactions
- Compliance remediation failure

### Lesson for Screening
Flag any institution with prior sanctions enforcement history that continues operating in high-risk corridors. Standard Chartered demonstrates that repeat violations carry significantly higher penalties. Any entity with a prior OFAC settlement should receive enhanced scrutiny on all Middle East and sanctioned jurisdiction transactions.

---

## Swedbank — 2020

**Entity**: Swedbank AB
**Regulator**: Swedish FSA, Estonian FSA, New York DFS
**Penalty**: $386 million (Swedish FSA), additional penalties pending
**Typologies**: Non-resident account abuse, shell company laundering, PEP connections, correspondent banking abuse

### What Happened
Swedbank's Estonian branch processed approximately $37 billion in suspicious transactions from high-risk non-resident clients between 2007-2019. Many of the same Russian and CIS shell companies that used Danske Bank also used Swedbank. The bank's CEO was fired for misleading the board about the extent of the problems.

### How It Was Caught
Swedish Television (SVT) investigative report. Connection to Danske Bank scandal triggered parallel investigations.

### Red Flags That Were Missed
- Same shell company customers as Danske Bank Estonia
- Non-resident accounts with volumes exceeding local business
- PEP connections among Baltic branch customers
- Transactions flowing to and from sanctioned jurisdictions
- CEO misrepresenting AML risk to board
- Overlapping customer base with bank already under investigation

### Key Indicators
- Shared customers with other banks under AML investigation
- Non-resident account volumes disproportionate to market
- Baltic branch as conduit for Russian money flows
- Management misrepresentation of compliance status
- PEP connections in customer base

### Lesson for Screening
Flag any entity that shares customers, counterparties, or transaction patterns with institutions already under AML investigation. Swedbank shows that laundering networks use multiple banks simultaneously. Cross-referencing customers across institutions is critical.

---

## Wachovia — 2010

**Entity**: Wachovia Bank (now Wells Fargo)
**Regulator**: DOJ, FinCEN
**Penalty**: $160 million
**Typologies**: Mexican drug cartel laundering, casa de cambio transfers, bulk cash, trade-based money laundering

### What Happened
Wachovia failed to apply AML controls to $378.4 billion in transactions from Mexican casas de cambio (currency exchange houses). Drug cartels used these exchanges to move bulk cash into the US banking system. Funds were used to purchase aircraft for drug transportation.

### How It Was Caught
DEA investigation into drug trafficking. Wachovia compliance officer Martin Woods raised internal alarms and was ignored, eventually becoming a whistleblower.

### Red Flags That Were Missed
- $378.4 billion in transactions with minimal monitoring
- Casas de cambio with no effective KYC
- Bulk cash shipments from Mexico
- Wire transfers with no apparent business purpose
- Traveler's checks used to structure payments
- Whistleblower warnings ignored

### Key Indicators
- High-volume transactions from casas de cambio
- Bulk cash transfers from Mexico
- Wire transfers with no business rationale
- Traveler's check purchases in structured amounts
- Whistleblower retaliation

### Lesson for Screening
Flag any financial institution with significant casa de cambio or money service business relationships in high-risk corridors. The Wachovia case established that banks cannot outsource AML responsibility to their correspondents. Whistleblower retaliation is itself a red flag for systemic compliance failure.

---

## Goldman Sachs — 2020

**Entity**: Goldman Sachs Group Inc.
**Regulator**: DOJ, SEC, MAS, UK FCA, multiple
**Penalty**: $2.9 billion (global settlement)
**Typologies**: FCPA violations, bribery of foreign officials, 1MDB-related corruption, failure of internal controls

### What Happened
Goldman Sachs underwrote $6.5 billion in bonds for 1MDB, earning approximately $600 million in fees — far above market rates. Goldman bankers bribed Malaysian and Abu Dhabi officials to secure the deals. Senior banker Tim Leissner pleaded guilty to conspiracy to launder money and violate the FCPA.

### How It Was Caught
Part of broader 1MDB investigation. DOJ traced bond proceeds to personal accounts and luxury purchases. Leissner cooperated with prosecutors.

### Red Flags That Were Missed
- Fees of $600M on $6.5B in bonds (approximately 9%, vs typical 1-2%)
- Bond proceeds immediately transferred to offshore accounts
- Sovereign wealth fund with opaque governance
- Sitting PM as direct beneficiary
- Bankers with undisclosed conflicts of interest
- Due diligence failures on use of proceeds

### Key Indicators
- Abnormally high intermediary fees
- Sovereign fund transactions with immediate offshore transfers
- PEP involvement at highest level
- Banker personal enrichment from deals
- FCPA red flags (foreign official payments)
- Use of proceeds inconsistent with stated purpose

### Lesson for Screening
Flag any transaction where intermediary fees significantly exceed market norms, where sovereign fund proceeds are immediately layered through offshore structures, or where PEPs at the highest level have direct access. Goldman Sachs shows that even the most sophisticated institutions can become vehicles for corruption when fee incentives override compliance controls.

---

## Credit Suisse — 2023/2024

**Entity**: Credit Suisse Group AG
**Regulator**: Swiss FINMA, DOJ, UK FCA, multiple
**Penalty**: Multiple settlements, bank collapsed and acquired by UBS
**Typologies**: Tax evasion facilitation, sanctions evasion, cocaine trafficking money laundering, Mozambique hidden debt scandal, Greensill Capital fraud, Archegos risk management failure

### What Happened
Credit Suisse accumulated decades of compliance failures across multiple scandals: helping US clients evade taxes ($2.6B penalty in 2014), laundering cocaine trafficking proceeds through its Bulgarian operations, facilitating hidden debt in Mozambique ($547M settlement), massive losses from Archegos ($5.5B) and Greensill Capital, and ongoing sanctions compliance failures. The accumulated reputational damage triggered a bank run and forced merger with UBS in 2023.

### How It Was Caught
Multiple investigations over decades. Senate investigations on tax evasion. Investigative journalism. Archegos and Greensill losses triggered existential crisis.

### Red Flags That Were Missed
- Serial compliance failures across decades
- Multiple business lines involved in separate scandals
- Cocaine proceeds processed through subsidiary
- Hidden sovereign debt structured through bank
- No meaningful culture change after each penalty
- Risk management failures allowing concentrated counterparty exposure

### Key Indicators
- Serial enforcement history across multiple regulators
- Multiple simultaneous compliance failures
- Tax evasion facilitation (numbered accounts, offshore structures)
- Sovereign debt concealment
- Catastrophic risk management (single counterparty concentration)
- Cultural impunity — penalties treated as cost of business

### Lesson for Screening
Flag any institution with multiple prior enforcement actions across different violation types. Credit Suisse demonstrates that serial compliance failure is itself the strongest risk indicator. When an institution has been penalized for tax evasion, money laundering, and sanctions violations across different business lines over decades, the problem is cultural and systemic. A single prior violation is a yellow flag; multiple violations across categories is CRITICAL.

---

## Deutsche Bank — 2017

**Entity**: Deutsche Bank AG
**Regulator**: New York DFS, UK FCA, DOJ, BaFin
**Penalty**: $630 million (mirror trading), $7.2 billion (RMBS settlement), additional fines
**Typologies**: Russian mirror trading, sanctions evasion, RMBS fraud, Epstein-related compliance failures

### What Happened
Deutsche Bank's Moscow branch executed $10 billion in "mirror trades" — simultaneously buying Russian securities in rubles and selling identical securities in dollars through London, effectively converting rubles to dollars and moving them out of Russia. The bank also maintained a banking relationship with Jeffrey Epstein years after his first conviction.

### How It Was Caught
Internal investigation discovered mirror trading pattern. New York DFS and UK FCA investigated. Media reporting on Epstein relationship triggered separate scrutiny.

### Red Flags That Were Missed
- Identical buy and sell orders executed simultaneously in Moscow and London
- Transactions had no legitimate business purpose
- Pattern sustained over 4 years (2011-2015)
- Russian customers were shell companies
- Compliance warnings about the pattern ignored
- Maintained Epstein relationship despite known criminal history

### Key Indicators
- Mirror trades (simultaneous opposite transactions in two markets)
- Transactions with no business rationale
- Shell company customers executing complex trades
- Capital flight pattern (rubles to dollars to offshore)
- Client retention despite known criminal history
- Compliance override by relationship managers

### Lesson for Screening
Flag any pattern of simultaneous equal-and-opposite transactions across markets or currencies, especially involving Russian entities. Mirror trading is a specific money laundering typology that Katharos should detect. Also flag any entity that maintains financial relationships with persons who have prior criminal convictions — the Epstein relationship shows how reputational risk compounds.

---

## Pilatus Bank — 2018

**Entity**: Pilatus Bank plc (Malta)
**Regulator**: ECB, Malta FIAU, DOJ
**Penalty**: License revoked, chairman indicted
**Typologies**: Sanctions evasion (Iran), money laundering, PEP facilitation, journalist assassination connection

### What Happened
Pilatus Bank, a small Maltese bank, was used to launder proceeds from corruption involving Maltese PEPs and to evade Iranian sanctions. The bank's chairman, Ali Sadr Hasheminejad, was indicted in the US for evading sanctions on Iran through a Venezuelan housing project. Journalist Daphne Caruana Galizia was assassinated after investigating corruption connected to the bank.

### How It Was Caught
Daphne Caruana Galizia's investigations published on her blog. After her assassination in 2017, international pressure forced Maltese authorities to act. FIAU whistleblower report. US DOJ indictment of chairman.

### Red Flags That Were Missed
- Bank chairman was Iranian national with sanctions exposure
- Tiny bank with outsized PEP customer base
- Maltese officials among customers
- Bank used for corruption proceeds from Maltese energy deals
- Aggressive legal action against journalist investigating the bank
- FIAU (Malta's FIU) findings initially suppressed

### Key Indicators
- Small bank with disproportionate PEP clientele
- Bank ownership by national of sanctioned country
- Legal threats against investigators
- Regulatory capture in small jurisdiction
- Connection to political corruption
- Suppressed compliance findings

### Lesson for Screening
Flag any small bank in a small jurisdiction with a disproportionate number of PEP clients or connections to sanctioned country nationals. Pilatus shows how small jurisdictions can be exploited when regulatory capacity is limited and political influence is concentrated. The assassination of an investigating journalist is the most extreme red flag possible.

---

## Westpac — 2020

**Entity**: Westpac Banking Corporation
**Regulator**: AUSTRAC (Australian Transaction Reports and Analysis Centre)
**Penalty**: AUD $1.3 billion ($900M USD)
**Typologies**: Child exploitation facilitation, AML failures, international funds transfer instruction reporting failures

### What Happened
Westpac failed to report 19.5 million international funds transfer instructions (IFTIs) to AUSTRAC. Among the unreported transactions were payments to the Philippines and Southeast Asia consistent with child exploitation. The bank failed to conduct due diligence on transactions to known child exploitation risk countries.

### How It Was Caught
AUSTRAC investigation identified systemic failures in transaction reporting. Analysis revealed patterns consistent with child exploitation payments.

### Red Flags That Were Missed
- 19.5 million unreported international transfers
- Small, frequent payments to Philippines and Southeast Asia
- Payments to known child exploitation corridors
- Correspondent banking relationships without adequate due diligence
- LitePay system lacked proper monitoring
- Multiple customers with patterns consistent with child exploitation

### Key Indicators
- Unreported international fund transfers at scale
- Small frequent payments to high-risk countries for child exploitation
- Correspondent banking without proper due diligence
- Automated payment systems without monitoring
- Pattern of transactions to Southeast Asian countries

### Lesson for Screening
Flag any pattern of small, frequent international transfers to countries identified as child exploitation risk corridors (Philippines, Thailand, Cambodia, Myanmar). Westpac demonstrates that AML failures can facilitate the most serious crimes. Transaction monitoring must specifically include typologies for child exploitation payment patterns.

---

## Commerzbank — 2015/2020

**Entity**: Commerzbank AG
**Regulator**: DOJ, New York DFS, UK FCA
**Penalty**: $1.45 billion (2015), additional penalties (2020)
**Typologies**: Sanctions evasion (Iran, Sudan), BSA/AML failures, wire stripping

### What Happened
Commerzbank processed more than $253 billion in transactions through its US operations that did not comply with BSA requirements. The bank also helped Iranian and Sudanese entities evade US sanctions by stripping identifying information from wire transfers and using non-transparent methods to move funds.

### How It Was Caught
DOJ and New York DFS investigation. Deferred prosecution agreement in 2015.

### Red Flags That Were Missed
- Wire messages stripped of sanctioned country references
- Non-transparent payment methods for Iranian clients
- BSA compliance program inadequate for transaction volume
- Sanctions filter evasion through message manipulation
- $253 billion in transactions without proper monitoring

### Key Indicators
- Wire stripping
- Non-transparent payment routing
- Sanctions filter evasion
- BSA program deficiencies
- High-volume unmonitored transactions

### Lesson for Screening
Flag institutions where wire messages show evidence of alteration or where payment routing appears designed to avoid sanctions jurisdiction touchpoints. Commerzbank reinforces that wire stripping is one of the most common and detectable sanctions evasion techniques.

---

## ING Bank — 2018

**Entity**: ING Bank N.V.
**Regulator**: Dutch Public Prosecution Service
**Penalty**: €775 million ($900M)
**Typologies**: Money laundering facilitation, structuring, corruption payments, AML failures

### What Happened
ING's Dutch retail banking operations failed to adequately vet customers, allowing criminal clients to use accounts for money laundering. The bank failed to detect structuring, did not investigate unusual transaction patterns, and allowed corruption payments to flow through its accounts. ING was used to launder bribes in a Uzbekistan telecom scandal (VimpelCom/VEON case).

### How It Was Caught
Dutch prosecution investigation. Connection to VimpelCom bribery case in Uzbekistan.

### Red Flags That Were Missed
- Customers with unexplained high-volume transactions
- Structuring patterns undetected
- Bribery payments for telecom licenses in Uzbekistan
- Inadequate customer due diligence
- Transaction monitoring alerts not investigated

### Key Indicators
- Structuring in retail accounts
- Payments connected to foreign bribery schemes
- Transaction monitoring alerts uninvestigated
- CDD failures on high-risk customers
- Corruption payments through normal banking channels

### Lesson for Screening
Flag any entity where transaction monitoring alerts are generated but not investigated, or where structuring patterns are present in retail accounts. ING demonstrates that AML failures in retail banking can facilitate corruption at international scale. The connection to the VimpelCom bribery case shows how corruption payments often flow through mainstream banking channels.

---

## ABLV Bank — 2018

**Entity**: ABLV Bank (Latvia)
**Regulator**: FinCEN, ECB, Latvian FCMC
**Penalty**: Bank liquidated
**Typologies**: Money laundering for North Korean sanctions evasion, shell company laundering, bribery, illicit financial flows from CIS

### What Happened
FinCEN proposed ABLV as a "primary money laundering concern" under Section 311 of the USA PATRIOT Act. The bank had institutionalized money laundering, facilitating transactions for shell companies, sanctioned entities including parties connected to North Korea's weapons program, and corrupt PEPs. The designation triggered a bank run and forced liquidation.

### How It Was Caught
FinCEN Section 311 action. Intelligence indicating North Korea sanctions evasion through the bank.

### Red Flags That Were Missed
- Majority of customers were non-resident shell companies
- Transactions connected to North Korean weapons procurement
- Bribery of Latvian officials to protect the bank
- Shell company customers with no real business
- Correspondent banking used to access US dollar system
- Bank leadership complicit in money laundering

### Key Indicators
- Non-resident shell company customer base
- Connections to WMD proliferation financing
- Political corruption to maintain banking license
- Section 311 designation (nuclear option for US correspondent access)
- Bank leadership involvement in illicit activity

### Lesson for Screening
Flag any bank where the majority of customers are non-resident entities, especially shell companies from CIS jurisdictions. ABLV demonstrates that FinCEN's Section 311 power can destroy a bank overnight. Any entity connected to WMD proliferation financing should be treated as BLOCKED regardless of other factors.

---

## Societe Generale — 2018

**Entity**: Societe Generale S.A.
**Regulator**: DOJ, OFAC, New York DFS
**Penalty**: $1.3 billion
**Typologies**: Sanctions evasion (Cuba, Iran, Libya), LIBOR manipulation, wire stripping

### What Happened
Societe Generale processed billions in transactions for entities in Cuba, Iran, and Libya by stripping and manipulating wire transfer messages to conceal the involvement of sanctioned parties. The bank also participated in LIBOR benchmark manipulation.

### How It Was Caught
DOJ and OFAC investigation. Part of broader industry-wide LIBOR investigation.

### Red Flags That Were Missed
- Wire messages altered to remove sanctioned country references
- Transactions routed to avoid US sanctions filters
- LIBOR submissions manipulated for trading profit
- Dual violations (sanctions and market manipulation)
- French bank believing US sanctions did not apply

### Key Indicators
- Wire stripping
- Sanctions filter avoidance
- LIBOR manipulation
- Multiple violation categories simultaneously
- Jurisdictional arbitrage (claiming US law doesn't apply)

### Lesson for Screening
Flag institutions that claim foreign jurisdiction exempts them from US sanctions. Societe Generale reinforces that any bank touching the US dollar system is subject to US sanctions regardless of where it is headquartered. Wire stripping remains the most common detection indicator.

---

## BitMEX — 2022

**Entity**: HDR Global Trading (BitMEX)
**Regulator**: DOJ, CFTC, FinCEN
**Penalty**: $100 million, founders charged
**Typologies**: BSA/AML violations, failure to implement KYC, sanctions evasion facilitation

### What Happened
BitMEX operated one of the largest cryptocurrency derivatives exchanges without implementing basic AML/KYC procedures. The platform knowingly served US customers while claiming to be offshore, and allowed users from sanctioned jurisdictions including Iran to trade. Co-founder Arthur Hayes pleaded guilty to BSA violations.

### How It Was Caught
CFTC and DOJ investigation. Analysis of platform's user base revealed sanctioned jurisdiction access.

### Red Flags That Were Missed
- No KYC verification for any users
- Platform accessible from sanctioned jurisdictions
- US customers actively served despite claims of offshore-only operation
- Founders publicly discussed avoiding regulation
- Email verification only requirement to trade derivatives

### Key Indicators
- Crypto platform without KYC
- Accessible from sanctioned jurisdictions
- Founder statements about regulatory avoidance
- US customer access despite offshore claims
- Derivatives trading without proper licensing

### Lesson for Screening
Flag any crypto platform that operates without KYC, especially if it offers derivatives or leverage. BitMEX shows that "offshore" structures do not protect against US enforcement when US customers or US dollar transactions are involved.

---

## Nordea Bank — 2019

**Entity**: Nordea Bank Abp
**Regulator**: Danish FSA, Finnish FSA, Swedish FSA, Norwegian FSA
**Penalty**: €34.5 million (Nordic joint action), ongoing investigations
**Typologies**: Panama Papers connections, shell company facilitation, AML failures, PEP facilitation

### What Happened
Nordea was implicated in the Panama Papers for helping customers create shell companies through Mossack Fonseca. The bank's Danish, Norwegian, Swedish, and Finnish operations all showed AML deficiencies. Nordea Luxembourg facilitated structures for PEPs and high-risk clients.

### How It Was Caught
Panama Papers leak (2016). Nordic joint supervisory investigation. Investigative journalism.

### Red Flags That Were Missed
- Active relationship with Mossack Fonseca for shell company creation
- Shell companies created for customers in secrecy jurisdictions
- PEP customers without enhanced due diligence
- Cross-border structures designed to obscure beneficial ownership
- Multiple Nordic jurisdictions affected simultaneously

### Key Indicators
- Relationship with known offshore service providers
- Shell company creation assistance
- Panama Papers connections
- PEP facilitation without EDD
- Multi-jurisdiction AML failures

### Lesson for Screening
Flag any entity appearing in the Panama Papers, Paradise Papers, or Pandora Papers. Nordea demonstrates that facilitating shell company creation — even through third parties like Mossack Fonseca — creates massive regulatory and reputational risk. ICIJ leak database matches should always trigger enhanced due diligence.

---

## Crypto.com / Cronos — 2022

**Entity**: Crypto.com
**Regulator**: Multiple (ongoing regulatory scrutiny)
**Penalty**: Not yet formally penalized, but $400M mistakenly sent to wrong exchange
**Typologies**: Internal controls failure, custody risk, operational risk

### What Happened
Crypto.com accidentally sent $400 million in Ethereum to Gate.io instead of its cold storage. While the funds were eventually returned, the incident revealed severe internal controls failures at one of the largest crypto exchanges. Combined with proof-of-reserves concerns and workforce reductions, the incident raised questions about operational integrity.

### How It Was Caught
On-chain analysis by crypto researchers identified the large transfer to Gate.io. Crypto.com CEO confirmed the error publicly.

### Red Flags That Were Missed
- $400M transfer without proper verification controls
- No multi-signature requirement for large transfers
- Proof of reserves audit methodology questioned
- Large workforce reductions suggesting financial pressure
- CEO initially dismissive of concerns

### Key Indicators
- Large accidental transfers indicating weak controls
- Absence of multi-sig for significant movements
- Proof-of-reserves concerns
- Workforce instability
- Management dismissiveness of operational issues

### Lesson for Screening
Flag any crypto exchange or custodian that has experienced operational failures involving customer funds. While not fraud, operational control failures indicate that the entity may not be able to safeguard assets. For crypto entities, proof-of-reserves quality, custody controls, and transfer verification procedures are critical screening factors.

---

## Odebrecht — 2016

**Entity**: Odebrecht S.A.
**Regulator**: DOJ, Swiss AG, Brazilian MPF, 12 countries total
**Penalty**: $3.5 billion (largest FCPA penalty ever at time)
**Typologies**: FCPA violations, bribery of foreign officials at massive scale, shell company laundering, political corruption across 12 countries

### What Happened
Brazilian construction giant Odebrecht operated a dedicated bribery department ("Division of Structured Operations") that paid approximately $788 million in bribes to government officials in 12 countries to win construction contracts. The company used offshore shell companies, coded communications, and a parallel banking system to make payments.

### How It Was Caught
Brazilian Operation Car Wash (Lava Jato) investigation. Executives cooperated with prosecutors in plea deals.

### Red Flags That Were Missed
- Dedicated internal department for bribery
- Offshore shell companies used exclusively for illicit payments
- Coded communications for bribe discussions
- Parallel internal banking system outside normal accounting
- $788M in payments with no legitimate business purpose
- Winning government contracts at unusually high rates across multiple countries

### Key Indicators
- Construction company winning government contracts in multiple countries simultaneously
- Offshore shell companies with no business operations
- Internal parallel payment systems
- Coded communications
- Payments to government officials or their intermediaries
- Unusual success rate in competitive government tenders

### Lesson for Screening
Flag any construction, infrastructure, or government contracting company operating in multiple high-corruption countries with significant government contract revenue. Odebrecht demonstrates that bribery can be industrialized with dedicated internal departments. Unusual competitive success in government tenders is a red flag for corruption.

---

## ZTE Corporation — 2017

**Entity**: ZTE Corporation
**Regulator**: DOJ, BIS, OFAC
**Penalty**: $1.19 billion
**Typologies**: Sanctions evasion (Iran, North Korea), export control violations, obstruction of justice

### What Happened
Chinese telecom manufacturer ZTE illegally shipped US technology to Iran and North Korea in violation of US sanctions and export controls. When caught, ZTE created a scheme to obstruct the DOJ investigation by coaching witnesses and destroying evidence.

### How It Was Caught
BIS investigation into export control violations. Discovery of internal documents showing deliberate sanctions evasion scheme.

### Red Flags That Were Missed
- Technology shipments to sanctioned countries via intermediaries
- Use of shell companies to obscure end destination
- Internal documents outlining sanctions evasion methodology
- Comparison documents analyzing how other companies were caught
- Coaching of witnesses during investigation
- Evidence destruction after investigation began

### Key Indicators
- Technology exports through third-country intermediaries
- Shell companies in supply chain
- Products appearing in sanctioned countries
- Obstruction after investigation initiated
- Internal planning documents for sanctions evasion
- Chinese tech company with Iran/North Korea connections

### Lesson for Screening
Flag any technology company with supply chains routing through intermediary countries to sanctioned destinations. ZTE demonstrates that sanctions evasion in the technology sector often involves deliberate planning and documentation. Obstruction of investigation (witness coaching, evidence destruction) should elevate any case to CRITICAL immediately.

---

## Huawei / Meng Wanzhou — 2018

**Entity**: Huawei Technologies, Skycom Tech
**Regulator**: DOJ, BIS
**Penalty**: CFO arrested, ongoing prosecution, entity placed on BIS Entity List
**Typologies**: Sanctions evasion (Iran), bank fraud, wire fraud, trade secret theft, obstruction

### What Happened
Huawei CFO Meng Wanzhou was arrested in Canada on US charges that Huawei used subsidiary Skycom to sell equipment to Iran in violation of US sanctions, then lied to banks about the Skycom relationship to maintain banking access. Huawei also allegedly stole trade secrets from T-Mobile.

### How It Was Caught
US intelligence investigation. Bank compliance reviews identified Skycom-Iran connection. DOJ indictment and Canadian arrest.

### Red Flags That Were Missed
- Subsidiary (Skycom) operating in Iran
- Huawei misrepresenting Skycom as independent third party
- Skycom employees using Huawei email addresses
- Financial transactions with Iranian entities routed through Skycom
- Equipment appearing in Iran with Huawei branding
- Banks relying on Huawei representations without independent verification

### Key Indicators
- Subsidiary operating in sanctioned country
- Misrepresentation of corporate relationships to banks
- Employee crossover between parent and subsidiary
- Equipment in sanctioned country bearing parent company branding
- BIS Entity List placement

### Lesson for Screening
Flag any entity on the BIS Entity List or any entity whose subsidiaries operate in sanctioned jurisdictions while the parent denies the relationship. Huawei/Skycom is the textbook case of using corporate structure to evade sanctions while maintaining banking access through misrepresentation.

---

## Suex — 2021

**Entity**: SUEX OTC, s.r.o.
**Regulator**: OFAC
**Penalty**: First-ever OFAC designation of a crypto exchange
**Typologies**: Ransomware facilitation, sanctions evasion, money laundering through crypto

### What Happened
SUEX was a Russia-linked OTC crypto exchange that facilitated ransomware payments and other illicit transactions. OFAC analysis showed that over 40% of SUEX's known transaction history was associated with illicit actors. SUEX became the first virtual currency exchange designated under OFAC sanctions.

### How It Was Caught
Chainalysis blockchain analysis. OFAC investigation into ransomware payment flows.

### Red Flags That Were Missed
- 40%+ of transactions associated with illicit actors
- OTC desk operating without proper licensing
- Russia-linked operations
- Facilitated ransomware payments
- No meaningful KYC
- High percentage of transactions from darknet markets

### Key Indicators
- Crypto exchange with high percentage of illicit transaction volume
- OTC operations without licensing
- Ransomware payment facilitation
- Russia nexus
- OFAC designation of exchange itself (all addresses blocked)

### Lesson for Screening
Flag any crypto OTC desk or exchange with known connections to ransomware payments or with a significant percentage of transactions from illicit sources. SUEX established that OFAC will designate entire exchanges, not just individual wallets. Any transaction with a designated exchange is prohibited.

---

## Tornado Cash — 2022

**Entity**: Tornado Cash (smart contract protocol)
**Regulator**: OFAC
**Penalty**: Designated as SDN, developer arrested
**Typologies**: Money laundering through crypto mixing, sanctions evasion, North Korean laundering (Lazarus Group)

### What Happened
OFAC designated Tornado Cash, an Ethereum-based mixing service, for being used to launder over $7 billion in cryptocurrency since 2019, including $455 million stolen by North Korea's Lazarus Group. This was the first time OFAC sanctioned a decentralized software protocol rather than a person or company. Developer Alexey Pertsev was arrested in the Netherlands.

### How It Was Caught
Chainalysis and Elliptic blockchain analysis traced Lazarus Group stolen funds through Tornado Cash. OFAC investigation.

### Red Flags That Were Missed
- $7 billion laundered through the protocol
- North Korean state hacking group (Lazarus) as primary user
- No KYC or compliance controls by design
- Used to launder proceeds from Ronin Bridge hack ($625M)
- Used to launder proceeds from Harmony Bridge hack ($100M)
- Protocol designed specifically to obscure transaction origins

### Key Indicators
- Any interaction with Tornado Cash contract addresses (BLOCKED)
- Mixing service usage
- Funds originating from known hack addresses
- Deposits followed by time-delayed withdrawals in different amounts
- Connection to Lazarus Group addresses

### OFAC Sanctioned Addresses (Partial)
- 0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b (Router)
- 0x722122dF12D4e14e13Ac3b6895a86e84145b6967 (0.1 ETH)
- 0xDD4c48C0B24039969fC16D1cdF626eaB821d3384 (1 ETH)
- 0xd96f2B1c14Db8458374d9Aca76E26c3D18364307 (10 ETH)
- 0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF (100 ETH)

### Lesson for Screening
Any transaction touching Tornado Cash addresses is BLOCKED. Katharos should maintain a complete list of all designated Tornado Cash contract addresses and flag any wallet that has interacted with them. This case established that decentralized protocols can be sanctioned and that interacting with them carries the same legal risk as transacting with any other SDN.

---

## Garantex — 2022

**Entity**: Garantex Europe OU
**Regulator**: OFAC, FinCEN
**Penalty**: OFAC SDN designation, FinCEN Section 311 action
**Typologies**: Ransomware facilitation, sanctions evasion, illicit crypto exchange

### What Happened
Russia-based crypto exchange Garantex was designated by OFAC after analysis showed it processed $100 million+ in transactions associated with illicit actors and darknet markets, including $6 million from Conti ransomware group. Despite being registered in Estonia, Garantex operated primarily in Moscow.

### How It Was Caught
FinCEN and OFAC investigation. Blockchain analysis showing ransomware and darknet market connections.

### Red Flags That Were Missed
- Registered in Estonia but operating in Moscow
- $100M+ in illicit transaction volume
- Conti ransomware group connections
- Darknet market transaction processing
- Estonian license revoked but continued operating
- Hydra marketplace connections

### Key Indicators
- Crypto exchange designated by OFAC (all addresses blocked)
- Registration jurisdiction different from operational jurisdiction
- Ransomware group connections
- Continued operation after license revocation
- Russia-based operations

### Lesson for Screening
Flag any crypto exchange operating in a jurisdiction different from its registration, especially if Russia-based. Garantex shows that OFAC will designate exchanges facilitating ransomware payments. Any transaction with Garantex addresses is BLOCKED.

---

## ABN AMRO — 2021

**Entity**: ABN AMRO Bank N.V.
**Regulator**: Dutch Public Prosecution Service (OM), DNB (De Nederlandsche Bank)
**Penalty**: €480 million ($574M)
**Typologies**: BSA/AML failures, client screening failures, inadequate transaction monitoring, trade finance laundering

### What Happened
ABN AMRO failed to adequately vet clients, monitor transactions, and report suspicious activity across multiple business lines from 2014 to 2020. DNB found serious deficiencies in the bank's KYC/CDD processes — including thousands of client files with missing or outdated information — and in its transaction monitoring systems, which failed to flag suspicious patterns. The failures spanned retail, private banking, and trade finance. The Dutch prosecution service reached a €480M settlement, the largest AML penalty in Dutch history at the time, finding that ABN AMRO's compliance infrastructure was systematically under-resourced relative to its risk profile.

### How It Was Caught
DNB (Dutch central bank) conducted on-site examinations beginning in 2019 and found widespread KYC deficiencies. Concurrent criminal investigation by the Dutch OM confirmed systemic failures across business lines.

### Red Flags That Were Missed
- Thousands of customer files with incomplete or outdated KYC information
- Private banking clients with unclear source of wealth
- Trade finance transactions with incomplete documentation on counterparties
- Transaction monitoring system alerts backlog growing unchecked
- High-risk clients not subject to enhanced due diligence
- Suspicious transactions not reported or reported with significant delays
- Compliance staffing levels inadequate for the bank's risk profile

### Key Indicators
- Bank with known regulatory remediation orders still processing high-risk transactions
- Incomplete KYC files for >10% of client base
- Transaction monitoring alert backlog exceeding 90 days
- Private banking division with unclear source-of-wealth documentation
- Multiple DNB warnings preceding formal enforcement action

### Lesson for Screening
Flag any financial institution operating under active regulatory remediation for AML deficiencies. ABN AMRO demonstrates that KYC failures at scale — not sophisticated laundering schemes — create massive regulatory exposure. Any entity banking with an institution under AML consent orders warrants enhanced scrutiny of the banking relationship itself.

---

## NatWest — 2021

**Entity**: National Westminster Bank Plc (NatWest Group)
**Regulator**: FCA (UK Financial Conduct Authority)
**Penalty**: £264.8 million ($355M)
**Typologies**: Cash deposit structuring, failure to monitor, willful blindness, gold dealer money laundering

### What Happened
NatWest failed to monitor the account of Fowler Oldfield, a Bradford-based gold dealer, which deposited approximately £365 million in cash over five years (2012–2016), vastly exceeding the company's expected annual turnover of £15 million. Cash was deposited in bin bags, holdalls, and carrier bags across NatWest branches. Despite the account being flagged internally as high-risk, automated monitoring systems failed to detect the pattern and manual reviews were inadequate. NatWest became the first UK bank prosecuted under the Money Laundering Regulations, pleading guilty to three offences of failing to comply with AML requirements.

### How It Was Caught
NatWest's own internal systems eventually flagged the deposits, leading to a SAR filing and NCA investigation. The FCA subsequently brought criminal charges — the first criminal prosecution of a bank under the Money Laundering Regulations 2007.

### Red Flags That Were Missed
- Cash deposits of £365M against expected turnover of £15M (24x expected volume)
- Cash physically delivered in bin bags and holdalls to multiple branches
- Deposits rapidly escalating from £500K/month to £2M+/month within one year
- Internal risk rating of "high" not triggering adequate enhanced monitoring
- Staff at branches failing to escalate concerns about cash volumes
- Source of cash never satisfactorily explained by the customer
- Gold dealer business model inconsistent with the volume of physical cash handled

### Key Indicators
- Cash deposits exceeding stated business turnover by >5x
- Physical cash in non-standard containers (bags, boxes vs. bank-standard bundles)
- Rapid escalation of deposit volumes over short periods
- Customer classified as high-risk but not subject to commensurate monitoring
- Gold/precious metals dealer with disproportionate cash volumes

### Lesson for Screening
Flag any precious metals dealer, money services business, or cash-intensive business where deposit volumes exceed stated business turnover by more than 3x. NatWest's case proves that even obvious, physically observable laundering — bin bags of cash — can go undetected when transaction monitoring systems are poorly calibrated and branch staff lack escalation procedures.

---

## Capital One — 2021

**Entity**: Capital One, N.A.
**Regulator**: FinCEN, OCC
**Penalty**: $390 million (FinCEN assessment)
**Typologies**: BSA/AML program failures, suspicious activity reporting failures, check cashing network monitoring

### What Happened
Capital One willfully failed to file thousands of suspicious activity reports (SARs) and currency transaction reports (CTRs) for transactions involving several check cashing businesses over multiple years. FinCEN found that Capital One's AML compliance program had significant, systemic deficiencies: the bank failed to adequately monitor approximately $16 billion in transactions processed by its check cashing customers, many of whom had characteristics consistent with money laundering. Capital One also failed to timely file SARs after identifying suspicious activity, and in some cases failed to file at all.

### How It Was Caught
FinCEN examination and OCC supervisory review identified systemic deficiencies in Capital One's BSA/AML program, particularly related to its check cashing and MSB customer segment.

### Red Flags That Were Missed
- Check cashing businesses processing volumes far exceeding their stated business profiles
- Currency transaction report filing obligations not met
- Internal suspicious activity alerts not investigated or resolved
- SAR filing delays of months or years after suspicious activity identification
- Repeat findings from prior regulatory examinations not remediated
- Check cashing customers with transaction volumes inconsistent with their business size
- Correspondent account activity not subject to adequate monitoring

### Key Indicators
- Financial institution with prior AML consent orders or enforcement actions
- Check cashing or MSB customers with transaction volumes exceeding business profile
- SAR filing backlogs or systematic delays in suspicious activity reporting
- Failure to remediate deficiencies identified in prior regulatory examinations
- Transaction monitoring systems with known gaps in coverage

### Lesson for Screening
Flag any entity banking through an institution with known AML compliance orders, particularly involving MSB or check cashing monitoring. Capital One's $390M penalty demonstrates that willful failure to file SARs — not just inadequate monitoring — triggers the most severe FinCEN enforcement actions.

---

## Julius Baer — 2020

**Entity**: Julius Baer Group AG
**Regulator**: DOJ, FINMA (Swiss Financial Market Supervisory Authority)
**Penalty**: $79.7 million (DOJ), additional FINMA enforcement
**Typologies**: FIFA corruption, 1MDB-related laundering, bribery, PEP failures, private banking abuse

### What Happened
Julius Baer admitted to conspiring to launder approximately $36 million in bribes paid to FIFA officials and Venezuelan government officials. The bank's private bankers maintained accounts for and facilitated transactions on behalf of high-risk PEPs without adequate enhanced due diligence. Separately, FINMA found serious AML deficiencies related to 1MDB-connected accounts, including relationships with individuals and entities linked to Jho Low and the 1MDB fraud. FINMA concluded that Julius Baer had "seriously violated" AML regulations through inadequate risk management in its private banking division, where relationship managers prioritized revenue over compliance.

### How It Was Caught
DOJ investigation into FIFA corruption (Operation FIFA, 2015) identified Julius Baer accounts used to process bribes. FINMA launched a parallel investigation into the bank's 1MDB relationships following the global 1MDB enforcement sweep.

### Red Flags That Were Missed
- Accounts held by FIFA officials receiving large unexplained wire transfers
- PEP clients with source of wealth inconsistent with their public-sector salaries
- Wire transfers from entities connected to 1MDB without adequate due diligence
- Relationship managers overriding compliance objections to onboard high-risk clients
- Large cash withdrawals by PEP clients
- Transactions involving Venezuelan state oil company (PDVSA) officials
- Private banking accounts with no economic rationale for the transaction patterns observed

### Key Indicators
- Private bank with PEP clients receiving funds from state-owned enterprises
- Wire transfers matching known bribery or kickback patterns (round numbers, no invoices)
- FIFA, PDVSA, or 1MDB-connected entities in transaction chains
- Relationship manager compensation tied to client revenue without compliance weighting
- Swiss private bank accounts for individuals under investigation in other jurisdictions

### Lesson for Screening
Flag any entity or individual with connections to FIFA, PDVSA, or 1MDB-linked entities. Julius Baer illustrates how private banking's revenue-driven culture creates systemic AML failures when relationship managers control client onboarding. Screen for PEPs whose transaction volumes are inconsistent with their known legitimate income.

---

## US Bancorp — 2018

**Entity**: U.S. Bancorp (U.S. Bank National Association)
**Regulator**: DOJ, FinCEN, OCC
**Penalty**: $613 million ($453M DOJ forfeiture, $70M FinCEN civil penalty, $90M OCC penalty)
**Typologies**: BSA/AML program failures, payday lending facilitation, failure to file SARs, willful blindness

### What Happened
US Bancorp maintained banking relationships with Scott Tucker's payday lending operation, which was itself a massive consumer fraud scheme that illegally charged over $3.5 billion in undisclosed fees to millions of borrowers. US Bancorp processed billions of dollars in transactions for Tucker's companies despite numerous red flags indicating fraud and money laundering. The bank's AML compliance program was found to have been deliberately weakened: a former chief compliance officer was charged with intentionally understaffing the AML program and concealing its deficiencies from regulators. US Bancorp also failed to implement adequate transaction monitoring across multiple business lines.

### How It Was Caught
DOJ investigation into Scott Tucker's payday lending fraud led to examination of his banking relationships. Concurrent OCC and FinCEN examinations found systemic BSA/AML deficiencies.

### Red Flags That Were Missed
- Customer (Scott Tucker) processing billions in payday lending transactions with extensive consumer complaints
- Multiple state attorney general actions against the customer's businesses
- Chief compliance officer deliberately understaffing AML program
- SAR filing obligations systematically unmet
- Transaction volumes for payday lending customers inconsistent with declared business model
- Compliance program deficiencies concealed from board and regulators
- Customer under active federal investigation while maintaining accounts

### Key Indicators
- Banking relationship with entity subject to multiple state enforcement actions
- Chief compliance officer or AML leadership changes following regulatory examination
- Transaction monitoring program with known coverage gaps concealed from regulators
- Payday lending or MSB customers with transaction volumes exceeding business justification
- Internal compliance audit findings not reported to board or regulators

### Lesson for Screening
Flag any entity associated with the payday lending industry or with principal officers who have consumer fraud histories. US Bancorp's case is unique: the compliance failure was not passive negligence but active concealment — the CCO deliberately weakened the program. Screen for institutions where compliance leadership has been recently replaced or where regulatory examinations have resulted in management changes.

---

## Rabobank — 2018

**Entity**: Rabobank, N.A. (US subsidiary of Coöperatieve Rabobank U.A.)
**Regulator**: DOJ, FinCEN, OCC
**Penalty**: $369 million ($298M DOJ, $50M FinCEN, $21M OCC)
**Typologies**: Mexican drug cartel money laundering, BSA/AML failures, cash structuring, cross-border bulk cash smuggling

### What Happened
Rabobank's Southern California branches were used by Mexican drug cartels and money launderers to deposit and move hundreds of millions of dollars in illicit proceeds. Bank employees at multiple branches facilitated structured cash deposits — breaking large sums into amounts below the $10,000 CTR threshold — and failed to file SARs on clearly suspicious transactions. The bank's Compliance Director and a branch manager were individually charged and convicted for their roles in concealing the activity. Rabobank admitted that its AML program was inadequate and that it processed over $11 billion in suspicious transactions related to Mexican and other foreign nationals.

### How It Was Caught
DEA and IRS-CI investigation into drug cartel money flows identified Rabobank branches as deposit locations. FinCEN examination confirmed systemic BSA/AML failures.

### Red Flags That Were Missed
- Large-scale structured cash deposits at multiple Southern California branches
- Deposits by non-customers and walk-in customers with no established banking relationship
- Cash deposits frequently just below $10,000 threshold (structuring)
- Customers crossing the US-Mexico border to make deposits
- Branch employees coaching customers on how to avoid CTR filing
- Compliance Director obstructing internal investigation
- Transactions involving Mexican nationals with no legitimate business in the US

### Key Indicators
- Financial institution branches within 100 miles of the US-Mexico border with disproportionate cash deposit volumes
- Structured cash deposits below $10,000 across multiple branches by the same individuals
- Bank employees providing guidance on reporting thresholds to customers
- Compliance officers or management charged with obstruction or concealment
- Cross-border banking customers with transaction volumes inconsistent with stated occupation

### Lesson for Screening
Flag any entity or individual making structured cash deposits at bank branches near international borders, particularly the US-Mexico border. Rabobank demonstrates that branch-level employee complicity — not just system failures — enables cartel money laundering. Screen for banks with prior enforcement actions related to structuring at border-region branches.

---

## Banca Privada d'Andorra (BPA) — 2015

**Entity**: Banca Privada d'Andorra, SA
**Regulator**: FinCEN (Section 311), Andorran INAF
**Penalty**: Bank seized by Andorran government, license revoked
**Typologies**: Third-party money laundering, PEP corruption, Venezuelan PDVSA laundering, Chinese underground banking, Russian organized crime

### What Happened
FinCEN designated BPA as a foreign financial institution of "primary money laundering concern" under Section 311 of the USA PATRIOT Act — only the fourth bank ever to receive this designation. FinCEN found that BPA's high-ranking managers and employees acted as money launderers for international criminal organizations, accepting and laundering proceeds from criminal networks in China, Venezuela, and Russia. Venezuelan PEPs connected to PDVSA used BPA to launder billions in corruption proceeds. Chinese criminal networks used BPA to process funds from human smuggling and underground banking operations. Russian organized crime figures used the bank to move proceeds from tax fraud and bribery. BPA's management was found to have been complicit — actively facilitating the laundering rather than merely failing to detect it.

### How It Was Caught
FinCEN investigation and intelligence sharing with Spanish and Andorran authorities. The Andorran government seized BPA within days of the Section 311 designation and nationalized the bank.

### Red Flags That Were Missed
- PEP clients from Venezuela, China, and Russia with no legitimate source of wealth verification
- Wire transfers connected to PDVSA corruption and embezzlement schemes
- Chinese underground banking transactions processed through personal accounts
- Bank management personally involved in structuring transactions for criminal clients
- No meaningful enhanced due diligence on high-risk non-resident clients
- Correspondent banking used to access US dollar clearing for sanctioned or high-risk flows
- Bank operating in a small jurisdiction (Andorra) with disproportionately large international flows

### Key Indicators
- Small-jurisdiction private bank with international client base dominated by PEPs and non-residents
- Bank management personally facilitating transactions for high-risk clients
- Wire transfers connected to Venezuelan, Chinese, or Russian organized crime networks
- FinCEN Section 311 designation (most severe AML enforcement action)
- Banking relationships terminated by correspondent banks due to AML concerns

### Lesson for Screening
Flag any entity banking through small-jurisdiction private banks, particularly those with a disproportionate share of non-resident PEP clients. BPA's case shows that when bank management is complicit, the institution becomes a laundering platform rather than merely a negligent one. The FinCEN Section 311 designation is a de facto death sentence for any bank it touches.

---

## Ericsson — 2019

**Entity**: Telefonaktiebolaget LM Ericsson (Ericsson)
**Regulator**: DOJ, SEC
**Penalty**: $1.06 billion ($520M DOJ, $540M SEC)
**Typologies**: FCPA bribery, corruption, slush funds, shell company payments, government contract fraud

### What Happened
Ericsson engaged in a decades-long pattern of bribery and corruption across multiple countries — including Djibouti, China, Vietnam, Indonesia, and Kuwait — to win telecommunications contracts. The company used shell companies, third-party agents, and slush funds to funnel bribes to government officials and telecom executives. In Djibouti, Ericsson made payments through a shell company to a government official who controlled the country's sole telecom operator. In China, Ericsson funded travel, gifts, and entertainment for government officials through agents and intermediary entities. The company's compliance program was found to have been inadequate to detect or prevent the bribery, despite operating in high-risk countries where corruption is endemic.

### How It Was Caught
DOJ and SEC investigation under the Foreign Corrupt Practices Act (FCPA). Internal investigation by Ericsson's outside counsel also identified misconduct. The investigation was triggered in part by press reporting on suspicious payments in several countries.

### Red Flags That Were Missed
- Payments to third-party agents and consultants with no clear services rendered
- Shell companies used to channel payments to government-connected individuals
- Slush funds maintained outside normal accounting controls
- Large entertainment and travel expenditures for government officials
- Agent commissions disproportionate to services provided (20-30% of contract value)
- Operations in multiple FCPA high-risk countries without adequate compliance controls
- Contracts awarded shortly after payments to intermediaries

### Key Indicators
- Telecom company making payments through agents or intermediaries in countries ranked below 100 on Transparency International CPI
- Third-party payments with vague service descriptions ("consulting," "advisory," "market research")
- Shell company intermediaries in payment chains for government contracts
- Agent commissions exceeding 10% of contract value in high-corruption jurisdictions
- Slush funds or off-book accounts outside normal financial controls

### Lesson for Screening
Flag any entity making large payments to third-party agents, consultants, or shell company intermediaries in connection with government contracts in high-corruption jurisdictions. Ericsson's case demonstrates that FCPA exposure is not limited to extractive industries — telecom, infrastructure, and technology companies operating in developing markets face equivalent bribery risks.

---

## Glencore — 2022

**Entity**: Glencore International AG
**Regulator**: DOJ, CFTC, UK SFO, Brazilian MPF
**Penalty**: $1.1 billion ($700M DOJ, $486M CFTC) plus UK and Brazilian settlements
**Typologies**: FCPA bribery, commodity market manipulation, corruption across Africa and South America, shell company payments

### What Happened
Glencore, the world's largest commodity trading firm, bribed government officials across multiple African and South American countries — including Nigeria, Cameroon, Ivory Coast, Equatorial Guinea, Brazil, and Venezuela — to secure preferential access to oil and mining contracts. The company used shell company intermediaries and third-party agents to funnel approximately $100 million in bribes over a decade (2007–2018). Separately, the CFTC found Glencore engaged in market manipulation of fuel oil benchmarks. The DOJ found that Glencore's culture tolerated corruption: compliance was subordinated to commercial objectives, and senior traders maintained relationships with corrupt intermediaries for years.

### How It Was Caught
DOJ and CFTC investigations, with parallel probes by the UK Serious Fraud Office and Brazilian prosecutors. Initially triggered by whistleblower reports and media investigations into Glencore's African operations.

### Red Flags That Were Missed
- $100M+ in payments to shell company intermediaries over a decade
- Third-party agents in Nigeria and West Africa with known connections to government officials
- Agent commissions far exceeding market rates for legitimate brokerage services
- Cash payments to intermediaries in jurisdictions with endemic corruption
- Commodity trades at non-market prices benefiting government-connected counterparties
- Corporate culture that tolerated non-compliance — traders managed agent relationships directly
- Compliance objections overridden by commercial teams

### Key Indicators
- Commodity trading firm making payments to intermediaries in oil-producing African nations
- Shell company intermediaries receiving commissions for "facilitation" of government contracts
- Trades executed at non-market prices with government-controlled commodity companies
- Entity operating in multiple countries ranked in the bottom quartile of Transparency International CPI
- Prior adverse media about corruption or bribery in the entity's operations

### Lesson for Screening
Flag any commodity trading firm making payments to intermediaries in Africa, particularly in oil-producing nations with low transparency scores. Glencore demonstrates that commodity trading firms' bribery risk is concentrated in the agent/intermediary layer — screen for shell companies receiving commissions in connection with government-controlled commodity trades.

---

## Halkbank — 2020

**Entity**: Türkiye Halk Bankası A.S. (Halkbank)
**Regulator**: DOJ (SDNY)
**Penalty**: Criminal indictment (2019), $3.7 billion sought; conviction pending appeal
**Typologies**: Iran sanctions evasion, gold-for-gas scheme, state-sponsored sanctions evasion, sham humanitarian transactions

### What Happened
Halkbank, a Turkish state-owned bank, facilitated a scheme to evade US sanctions against Iran by processing billions of dollars in transactions disguised as humanitarian goods payments. At the center was the "gold-for-gas" scheme: Turkey purchased Iranian natural gas, and rather than making direct payments (which would violate sanctions), Iranian funds held at Halkbank were used to purchase gold, which was physically transported to Iran or converted to cash. Halkbank processed approximately $20 billion in transactions on behalf of Iran's government and Iranian entities. Reza Zarrab, a Turkish-Iranian gold trader, was the key intermediary; he was arrested by US authorities in 2016 and became a cooperating witness. Halkbank's deputy general manager, Mehmet Hakan Atilla, was convicted in 2018 of conspiracy to violate US sanctions.

### How It Was Caught
Reza Zarrab's arrest in Miami (2016) on sanctions evasion charges. Zarrab cooperated with DOJ and provided detailed testimony about the Halkbank scheme. Concurrent investigation by SDNY prosecutors.

### Red Flags That Were Missed
- Turkish bank processing large gold purchases on behalf of Iranian entities
- Transactions labeled as "humanitarian goods" (food, medicine) but actual commodity was gold and cash
- Physical gold shipments from Turkey to Iran and UAE
- Bank deputy GM personally facilitating sanctions-evasive transactions
- State-owned bank in a NATO ally country processing transactions for sanctioned Iranian government entities
- Sham invoices for "food" and "medicine" used to justify wire transfers
- Multiple intermediaries including gold dealers and currency exchange houses

### Key Indicators
- State-owned bank processing transactions involving sanctioned countries (Iran, Cuba, Syria, DPRK, Russia)
- Gold purchases or shipments with nexus to sanctioned jurisdictions
- Transactions labeled as "humanitarian" or "food/medicine" with unusual routing or intermediaries
- Individual bank employees facilitating sanctions-evasive structures
- Entity connected to individuals arrested or convicted for sanctions evasion

### Lesson for Screening
Flag any entity involved in gold transactions with a nexus to Iran, Turkey, or UAE, particularly when labeled as humanitarian goods. Halkbank demonstrates that state-owned banks in allied countries can be instrumentalized for sanctions evasion at the highest levels of government. The gold-for-gas scheme exploited the humanitarian exemption in sanctions frameworks.

---

## Al Rajhi Bank — Ongoing

**Entity**: Al Rajhi Bank (Saudi Arabia)
**Regulator**: US Treasury, multiple
**Penalty**: Various restrictions; ongoing monitoring
**Typologies**: Terrorist financing allegations, hawala networks, charity front organizations, PEP banking

### What Happened
Al Rajhi Bank, Saudi Arabia's largest private bank, has been the subject of longstanding allegations regarding terrorist financing connections. US government documents and 9/11 Commission materials identified Al Rajhi family members as significant donors to charities later designated by OFAC for connections to Al-Qaeda. The bank's founders and major shareholders have been named in lawsuits by 9/11 victims' families. While the bank has not been sanctioned by OFAC, it has faced correspondent banking restrictions and enhanced scrutiny from US and European banks. Al Rajhi operates as an Islamic bank using Sharia-compliant financial structures, which can create additional complexity for transaction monitoring (e.g., murabaha, sukuk, and ijara structures that differ from conventional banking products).

### How It Was Caught
9/11 Commission investigation, congressional inquiries, and civil lawsuits by victims' families. US government intelligence documents linking Al Rajhi family members to Al-Qaeda-connected charities.

### Red Flags That Were Missed
- Bank founders and shareholders named in connection with Al-Qaeda financing
- Charitable donations to organizations later designated by OFAC
- Large-volume hawala-style transfers to high-risk jurisdictions
- Islamic banking structures adding complexity to transaction monitoring
- Correspondent banking relationships under enhanced scrutiny or terminated
- Connections between bank leadership and designated terrorist financing entities
- Operating in a jurisdiction (Saudi Arabia) that has historically faced criticism for inadequate terrorist financing enforcement

### Key Indicators
- Entity banking through Al Rajhi or receiving wire transfers from Al Rajhi accounts
- Saudi-origin financial institutions with historical terrorist financing allegations
- Transactions involving Islamic banking structures (murabaha, sukuk) with entities in high-risk jurisdictions
- Wire transfers to charities or NPOs operating in conflict zones
- Entities with connections to individuals named in 9/11 Commission materials

### Lesson for Screening
Flag any significant transaction involving Al Rajhi Bank or Al Rajhi family-connected entities for enhanced due diligence. While the bank has not been formally sanctioned, the density of alleged connections to terrorist financing networks warrants elevated scrutiny. Screen for Islamic banking structures used to transfer funds to high-risk jurisdictions, particularly where the economic rationale is unclear.

---

## Hawala Networks — Kabul/Dubai Corridor — Pattern Case

**Entity**: Informal value transfer systems (hawala/hundi networks)
**Regulator**: FinCEN, FATF, UAE Central Bank
**Penalty**: Pattern case — multiple enforcement actions
**Typologies**: Informal value transfer, trade-based money laundering, terrorist financing, drug proceeds laundering, sanctions evasion

### What Happened
The Kabul-Dubai hawala corridor represents one of the world's largest informal value transfer systems, processing an estimated $5–10 billion annually — a figure that at times exceeded Afghanistan's formal GDP. Hawala networks operate by transferring value without moving money across borders: a customer gives cash to a hawaladar in Kabul, who contacts a counterpart hawaladar in Dubai, who pays out the equivalent amount (minus commission) to the beneficiary. The system settles through reciprocal transactions, trade invoicing, or physical cash transfers. While hawala serves legitimate purposes for diaspora remittances in regions with limited banking infrastructure, the Kabul-Dubai corridor has been extensively documented as a laundering channel for Afghan opium proceeds, Taliban tax revenues, and corruption payments from Afghan government officials. After the Taliban takeover (August 2021), hawala became the primary financial channel in and out of Afghanistan, complicating sanctions compliance for entities with Afghan operations.

### How It Was Caught
FinCEN investigations, FATF mutual evaluations of Afghanistan and UAE, DEA drug trafficking investigations, and UN Monitoring Team reports on Taliban financing. The corridor has been documented by SIGAR (Special Inspector General for Afghanistan Reconstruction) as a channel for corruption proceeds.

### Red Flags That Were Missed
- Cash-intensive businesses in Dubai (gold souks, electronics dealers, used car exporters) serving as hawala settlement mechanisms
- Trade invoices between Kabul/Afghan entities and Dubai companies with values inconsistent with actual goods
- Real estate purchases in Dubai by Afghan nationals with no documented source of wealth
- MSBs/currency exchanges in UAE processing high volumes of Afghan-origin transactions
- Round-dollar wire transfers between UAE-based and Afghanistan-based entities
- Entities in Dubai receiving multiple small deposits from different Afghan senders (aggregation)
- Used car exports from Dubai to Afghanistan at inflated invoice values (TBML settlement)

### Key Indicators
- Transactions involving Afghan nationals or Afghan-registered entities through UAE financial system
- Cash-intensive businesses in UAE receiving funds from or sending funds to conflict zones
- Trade invoice anomalies between UAE and Afghanistan, Pakistan, or East Africa
- MSB or currency exchange with high volume of transactions involving South/Central Asian counterparties
- Real estate purchases in Dubai/UAE by individuals from conflict-affected countries with unclear source of funds

### Lesson for Screening
Flag any entity involved in cash-intensive trade between UAE and Afghanistan/Pakistan, particularly gold dealers, used car exporters, and electronics traders. Hawala networks are not inherently illegal, but the Kabul-Dubai corridor's concentration of opium proceeds, Taliban revenues, and corruption payments makes any significant transaction along this route a candidate for enhanced due diligence. Screen for trade invoice anomalies and aggregated cash deposits consistent with hawala settlement patterns.

---

## North Korea Crypto Theft Operations — Pattern Case

**Entity**: Lazarus Group / APT38 / DPRK Bureau 121
**Regulator**: OFAC, DOJ, FBI, UN Security Council Panel of Experts
**Penalty**: Pattern case — OFAC designations, ongoing
**Typologies**: State-sponsored crypto theft, DeFi exploitation, sanctions evasion, cyber-enabled financial crime, mixer laundering

### What Happened
North Korea's state-sponsored hacking units — primarily the Lazarus Group (also designated as APT38) operating under the Reconnaissance General Bureau — have stolen an estimated $3+ billion in cryptocurrency since 2017, making DPRK the most prolific nation-state crypto thief. Major thefts include: Ronin Bridge / Axie Infinity ($620M, March 2022), Harmony Horizon Bridge ($100M, June 2022), and Atomic Wallet ($100M, June 2023). The stolen funds finance DPRK's nuclear and ballistic missile programs. The laundering methodology follows a consistent pattern: stolen crypto is quickly swapped across multiple blockchains (chain-hopping), routed through mixers (Tornado Cash, Sinbad, Blender.io — all subsequently OFAC-designated), converted to Bitcoin, then cashed out through complicit OTC desks in China and Southeast Asia. The UN Panel of Experts on DPRK has documented these operations in detail, finding that crypto theft has become DPRK's primary source of foreign currency, surpassing traditional revenue sources like coal and textile exports.

### How It Was Caught
FBI blockchain analysis, coordination with blockchain analytics firms (Chainalysis, Elliptic, TRM Labs), UN Panel of Experts investigations, and OFAC tracing of wallet addresses. Attribution is based on code reuse, operational patterns, and infrastructure overlapping with known Lazarus Group tools.

### Red Flags That Were Missed
- DeFi bridge contracts exploited through smart contract vulnerabilities
- Stolen funds immediately chain-hopped across Ethereum, BSC, Avalanche, and Bitcoin
- Large volumes routed through OFAC-designated mixers (Tornado Cash, Sinbad, Blender.io)
- Funds consolidated into wallets with known Lazarus Group patterns
- OTC desks in China processing large BTC-to-fiat conversions with no KYC
- Peel chain transactions: small amounts sent to hundreds of wallets to obscure the trail
- Mixer output addresses funded within hours of major DeFi hacks

### Key Indicators
- Wallet addresses appearing on OFAC SDN list or flagged by blockchain analytics firms
- Funds originating from or passing through OFAC-designated mixer contracts
- Transaction patterns consistent with "peel chain" laundering (many small outputs from one large input)
- DeFi protocol exploit followed by rapid chain-hopping across 3+ blockchains
- OTC desk or exchange processing large conversions from wallets with nexus to known theft proceeds
- Entity or wallet with connections to known Lazarus Group infrastructure (identified by TRM, Chainalysis, Elliptic)

### Lesson for Screening
Flag any crypto transaction involving wallet addresses connected to known DPRK theft events or OFAC-designated mixers. The Lazarus Group's operational pattern is highly consistent: exploit → chain-hop → mix → OTC cash-out. Any entity receiving funds that transited through Tornado Cash, Sinbad, or Blender.io after a major DeFi bridge hack should be treated as high-risk for DPRK sanctions nexus. Screen for peel chain patterns and rapid cross-chain swaps following large exploit events.

---

## Russian Oligarch Sanctions Evasion — 2022+ Pattern Case

**Entity**: Pattern case — Russian oligarchs and elites post-Ukraine invasion
**Regulator**: OFAC, EU Council, UK OFSI, DOJ KleptoCapture Task Force
**Penalty**: Pattern case — ongoing asset seizures, $30B+ in assets frozen globally
**Typologies**: Sanctions evasion, shell company asset concealment, yacht/aircraft/real estate laundering, proxy ownership, professional enabler networks

### What Happened
Following Russia's full-scale invasion of Ukraine in February 2022, the US, EU, UK, and allied nations imposed unprecedented sanctions on Russian oligarchs, state-owned enterprises, and the Russian financial system. Sanctioned individuals scrambled to move and hide assets through pre-existing and rapidly constructed shell company networks. The DOJ established the KleptoCapture Task Force specifically to enforce sanctions against Russian oligarchs. Major asset seizures revealed the typical concealment architecture: yachts (worth $50M-$700M each) registered through chains of shell companies in Marshall Islands, Cayman Islands, and BVI, with management companies in Monaco and Dubai; real estate portfolios in London, New York, Miami, and the French Riviera held through trusts and nominee-owned LLCs; aircraft registered to shell companies in Isle of Man, San Marino, and Aruba; and financial assets held through family members and trusted associates (proxies) who were not themselves sanctioned.

Per FinCEN Alert FIN-2022-Alert001, the primary red flags include: use of corporate vehicles to obscure ownership of assets, third-party intermediaries and proxies, all-cash luxury real estate purchases, high-value asset acquisition (yachts, jets, art), cryptocurrency for value transfer, and transactions through non-sanctioned financial institutions in jurisdictions not aligned with Russia sanctions.

### How It Was Caught
Coordinated intelligence sharing between US, EU, and UK authorities. DOJ KleptoCapture Task Force. Blockchain analytics for crypto tracking. Yacht tracking by open-source intelligence (OSINT) communities (e.g., MarineTraffic, tracking AIS transponders). Investigative journalism (ICIJ, OCCRP). FinCEN SAR filings referencing "FIN-2022-RUSSIASANCTIONS."

### Red Flags That Were Missed
- Yachts and aircraft rapidly changing registration and flag state following sanctions announcement
- AIS transponders on yachts turned off or spoofed to avoid tracking
- Rapid transfer of luxury real estate from sanctioned individuals to family members or associates
- Shell companies in BVI, Cayman, and Marshall Islands with ownership trails leading to Russian PEPs
- Art and jewelry purchased through intermediaries and stored in Geneva freeports
- Large wire transfers to UAE, Turkey, and Central Asian countries immediately after sanctions announcement
- Cryptocurrency purchases and transfers spiking among Russian-connected wallets
- Professional enablers (lawyers, wealth managers, yacht brokers) facilitating asset transfers

### Key Indicators
- Entity with beneficial owner who is a Russian PEP or on the SDN/EU/UK sanctions lists
- Shell company in typical concealment jurisdictions (BVI, Cayman, Marshall Islands) with Russian nexus
- High-value asset (yacht, aircraft, property >$5M) with ownership chain leading to Russia-connected persons
- Transactions involving Russian financial institutions (Sberbank, VTB, VEB, Gazprombank) or their subsidiaries
- Rapid asset transfers or ownership changes coinciding with sanctions designation dates
- Entity or individual appearing on DOJ KleptoCapture Task Force enforcement actions
- Proxy ownership: family members or associates of sanctioned persons holding assets

### Lesson for Screening
Flag any entity with ownership connections to Russian PEPs, particularly those with assets in typical concealment jurisdictions. The post-2022 sanctions regime requires screening not just against the SDN list but against the extended networks of sanctioned persons — family members, associates, professional enablers, and shell companies. Apply the OFAC 50% Rule aggressively: aggregate ownership across all related persons and entities. Screen for rapid asset movements coinciding with sanctions designation dates.

---

## Robinhood — 2022

**Entity**: Robinhood Financial LLC / Robinhood Crypto LLC
**Regulator**: NYDFS
**Penalty**: $30 million
**Typologies**: AML program failures, crypto compliance failures, inadequate transaction monitoring, cybersecurity deficiencies

### What Happened
NYDFS found significant deficiencies in Robinhood Crypto's BSA/AML compliance program and cybersecurity practices. The company's transaction monitoring system was inadequate — relying on a manual process to flag suspicious activity that was insufficient given the volume and velocity of transactions on the platform. Robinhood failed to transition from a manual suspicious activity monitoring system to an automated one as its user base and transaction volume grew exponentially. The company also had insufficient KYC procedures, particularly for its crypto trading operations, and cybersecurity controls that did not meet NYDFS standards for licensed crypto businesses.

### How It Was Caught
NYDFS examination of Robinhood Crypto as part of its BitLicense supervisory framework. The examination found multiple compliance deficiencies.

### Red Flags That Were Missed
- Manual AML monitoring process inadequate for platform transaction volume
- Crypto trading without automated transaction monitoring
- Rapid user growth without corresponding compliance infrastructure scaling
- KYC procedures insufficient for crypto trading activity
- BSA/AML officer lacked adequate authority and resources
- Cybersecurity incident response procedures inadequate
- Transaction monitoring system unable to detect structuring or layering patterns in crypto trades

### Key Indicators
- Crypto platform or fintech with user growth outpacing compliance infrastructure
- Manual AML monitoring processes at high-volume financial institutions
- Platform offering crypto trading without OFAC screening of wallet addresses
- Fintech with BSA/AML program built for a smaller scale and not updated
- Entity operating under crypto-specific license (BitLicense) with examination findings

### Lesson for Screening
Flag any fintech or crypto platform where transaction volume has grown significantly faster than compliance infrastructure. Robinhood's case demonstrates that rapid growth without proportionate compliance investment creates systemic AML exposure, particularly in crypto where transaction velocity and pseudonymity amplify risk.

---

## HIGH-RISK INDUSTRIES FOR MONEY LAUNDERING

**Category**: Reference Guide
**Source**: FinCEN, FATF, EU 6AMLD

### Overview
Certain industries are inherently higher risk for money laundering due to characteristics like cash intensity, subjective valuations, limited regulation, or cross-border complexity. When screening any entity, check their occupation, business type, and source of funds against this classification.

### Industry Risk Classification

#### TIER 1 — HIGHEST RISK (+20-25 points)

**1. Arms and Defense (+25)**
- Risk factors: Government corruption, export controls, sanctioned end-users
- Occupations: Arms dealer, defense contractor, military equipment broker
- Red flags: Exports to embargoed countries, intermediary chains, end-user certificate issues
- Reference: ITAR, EAR, EU Dual-Use Regulation

**2. Art and Antiquities (+20)**
- Risk factors: No price transparency, subjective valuations, anonymous buyers, freeport storage, minimal regulation
- Occupations: Art dealer, gallery owner, auction house, art advisor, antiquities dealer
- Red flags: Large cash transactions, private sales with no public record, freeport storage, rapid resale at inflated prices
- Reference: FinCEN 2021 Art Market Study, EU 6AMLD

**3. Gambling and Casinos (+20)**
- Risk factors: Cash in/cash out, chips as currency substitute, minimal ID requirements in some jurisdictions
- Occupations: Casino operator, online gambling platform, sports betting operator
- Red flags: Buy-in with cash and cash-out with check, minimal actual gambling, junket operators

**4. Cryptocurrency and Virtual Assets (+20)**
- Risk factors: Pseudonymous, cross-border, mixers/tumblers, DeFi protocols
- Occupations: Crypto exchange operator, DeFi protocol developer, OTC crypto dealer, mining operation
- Red flags: Unregistered exchange, no KYC, mixing service usage, privacy coins
- Reference: FATF Virtual Assets Guidance 2021

**5. Money Services Businesses (+20)**
- Risk factors: Cash transmission, remittances, currency exchange outside banking system
- Occupations: MSB operator, hawala broker, remittance agent, currency exchange operator, check casher
- Red flags: Unlicensed operation, high-risk corridors, structuring

#### TIER 2 — HIGH RISK (+15 points)

**6. Real Estate (+15)**
- Risk factors: High-value assets, cash purchases, shell company buyers, opaque pricing
- Occupations: Real estate developer, property investor, real estate agent (when principal)
- Red flags: All-cash purchases, shell company buyers, rapid flipping, pricing above market value
- Reference: FinCEN Geographic Targeting Orders, FATF 2007 report

**7. Precious Metals, Stones, and Jewelry (+15)**
- Risk factors: Portable, high-value, easy to smuggle, subjective pricing
- Occupations: Jeweler, gem dealer, precious metals trader, gold dealer
- Red flags: Cash purchases, cross-border movement, trade-based laundering

**8. Cash-Intensive Businesses (+15)**
- Risk factors: Easy to commingle illicit funds with legitimate revenue
- Occupations: Restaurant owner, nightclub owner, car wash operator, parking lot operator, casino operator, ATM operator, vending machine operator, laundromat owner, convenience store owner
- Red flags: Revenue inconsistent with foot traffic, abnormally high profit margins, multiple cash-intensive businesses

**9. High-Value Goods (+15)**
- Risk factors: Portable value, subjective pricing, luxury goods as value store
- Occupations: Luxury car dealer, yacht broker, private aircraft dealer, high-end watch dealer
- Red flags: Cash purchases of luxury goods, purchases by shell companies, rapid resale

**10. Trade and Commodities (+15)**
- Risk factors: Trade misinvoicing, commodity price manipulation, complex supply chains
- Occupations: Commodity trader, import/export business, freight forwarder, customs broker
- Red flags: Over/under invoicing, goods transiting through free trade zones, mismatched trade documents

#### TIER 3 — ELEVATED RISK (+10 points)

**11. Legal and Professional Services (+10)**
- Risk factors: Client confidentiality, trust/company formation, client account pooling
- Occupations: Lawyer (when forming entities or managing client funds), accountant, company formation agent, trust administrator, nominee director
- Red flags: Creating shell companies, managing client money accounts, providing nominee services

**12. Private Banking and Wealth Management (+10)**
- Risk factors: High-value clients, complex structures, secrecy culture
- Occupations: Private banker, wealth manager, family office (when managing third-party funds)
- Red flags: PEP clients, shell company structures, secrecy jurisdiction accounts

**13. Construction and Infrastructure (+10)**
- Risk factors: Large cash flows, subcontractor chains, invoice fraud, government contracts
- Occupations: Construction company owner, government contractor, infrastructure developer
- Red flags: Subcontractor layering, inflated invoices, PEP connections to government contracts

**14. Nonprofit and Charity (+10)**
- Risk factors: Donor anonymity, cross-border transfers, limited oversight in some jurisdictions
- Occupations: Charity operator, NGO director, foundation trustee (when operating in high-risk regions)
- Red flags: Operating in conflict zones, opaque funding sources, transfers to high-risk jurisdictions

### Screening Instructions

When screening any entity:

1. **Identify industry match**: Check occupation, business description, and source of funds against categories above
2. **Add risk points**: Apply the appropriate risk score based on tier
3. **Document in report**: State "HIGH-RISK INDUSTRY: [Category]. [One sentence explaining why this industry is high-risk for money laundering]. Enhanced due diligence recommended."
4. **Apply industry-specific EDD**: Recommend enhanced due diligence measures appropriate to the specific industry

### Example Application

**Subject**: Catherine Dubois, French art dealer
**Industry Match**: Art and Antiquities (+20 points)
**Report Language**: "HIGH-RISK INDUSTRY: Art and Antiquities. The art market is identified by FinCEN and FATF as high-risk for money laundering due to lack of price transparency, subjective valuations, anonymous buyers, and minimal regulatory oversight. Enhanced due diligence recommended on source of funds, transaction history, and buyer/seller identities."
