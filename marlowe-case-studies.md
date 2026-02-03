# Enforcement Case Studies for Marlowe RAG

Add all of these enforcement case studies to the Marlowe RAG knowledge base. Chunk each case as a single document. Category: "enforcement". Embed and upsert to Pinecone.

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
Flag any pattern of simultaneous equal-and-opposite transactions across markets or currencies, especially involving Russian entities. Mirror trading is a specific money laundering typology that Marlowe should detect. Also flag any entity that maintains financial relationships with persons who have prior criminal convictions — the Epstein relationship shows how reputational risk compounds.

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
Any transaction touching Tornado Cash addresses is BLOCKED. Marlowe should maintain a complete list of all designated Tornado Cash contract addresses and flag any wallet that has interacted with them. This case established that decentralized protocols can be sanctioned and that interacting with them carries the same legal risk as transacting with any other SDN.

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
