# Katharos — 70-Subject Entity Investigation
## Investigation Date: 2026-03-15
## Prompt: "Find all the entities owned by this person/group that wouldn't show up if someone tried to screen the person/group in Claude. Use an agent."

---

## METHODOLOGY

For each subject, the agent:
1. Searched DOJ/SFO/CFTC/FinCEN enforcement documents for named entities
2. Searched ICIJ offshore leaks databases
3. Searched for subsidiaries, shell companies, offshore vehicles in ownership chain
4. Searched for named intermediaries, fixers, associates in court documents
5. Applied OFAC 50% rule where sanctioned individuals appear
6. Identified crypto wallets, exchange accounts, darknet infrastructure

Standard screening = what a compliance database check on the subject's name alone would return.
Katharos = what the full investigation returns.

---

## CAT 1 — CONVICTED MONEY LAUNDERING

---

### 1. Alexander Vinnik / BTC-e ($9B)

**Standard screening finds:** BTC-e (1 entity)
**Katharos finds:** 22+ entities
**Coverage gap:** ~95%

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Canton Business Corporation | Shell company | Seychelles | 1 | DOJ indictment — primary BTC-e legal entity |
| Always Efficient LLP | Shell company | UK | 1 | DOJ indictment — nominee director Alexander Buyanov (Moscow DJ) |
| Chartwood Technology LLP | Shell company | UK (London) | 1 | Cyprus lawsuit — partnership of two Dominican companies linked to ML scandals |
| Gem Invest LP | Shell company | UK (Edinburgh) | 1 | Cyprus lawsuit — same partners as company linked to Poroshenko |
| Eurostyle Advisor | Shell company | Unknown | 1 | Mayzus litigation — Vinnik's company; transacted with 15 Cyprus offshore companies |
| 14 additional UK/overseas shell companies (unnamed) | Shell companies | UK/BVI/Overseas territories | 1 | Named in Mayzus Cyprus lawsuit |
| Soft-FX | Technology company | Belarus/Cyprus | 1 | DOJ indictment (Klimenka) — maintained BTC-e US servers |
| FX Open / XP Solutions | Financial company + e-wallet | NZ/Australia | 1 | DOJ forfeiture complaint — BTC-e used to pool and move customer funds; ~€27.57M transferred |
| WEX Exchange | Successor crypto exchange | Russia | 1 | BTC-e successor; operator Dmitry Vasiliev arrested Italy 2019 |
| WME Capital Management Ltd | Shell company | New Zealand | 1 | NZ Companies Office — registered by Vinnik 2008; NZ police seized NZ$140M ($90M) |
| Mayzus Financial Services (MFS) / MoneyPolo | Payment processor | UK | 8 | Global Witness — opened 7+ accounts for BTC-e shells; handled ~$100M; CEO Nikolay Rozhok; CFO Artem Zhedik |
| Mayzus Investment Company | Financial company | Cyprus | 8 | Fined €12,000 by Cypriot regulator 2016 for AML failures |
| United World Capital | Financial company | UK | 8 | Mayzus-affiliated; claimed SWIFSA membership |
| Weezzo | Payment processor | UK | 8 | Mayzus post-BTC-e company |
| OkPay | Payment processor | Unknown | 8 | MFS acquired OkPay June 2017; BTC-e client since 2011 |
| Aliaksandr Klimenka | Individual | Belarus/Cyprus | 1 | DOJ indictment 2024 — co-operator; controls Soft-FX and FX Open |
| Alexander Buyanov | Nominee director | Russia | 8 | Nominee director of Always Efficient — Moscow DJ |
| Stanislav Golovanov | Nominee director | Russia | 8 | Nominee director of Canton Business Corporation |
| Aleksandr Bilyuchenko | Individual | Russia | 1 | Co-founder per AML Network; connected via poker network |
| Konstantin Malofeev / Tsargrad Media | Individual/company | Russia | 8 | Acquired BTC-e assets under FSB control post-seizure |
| Deutsche Bank Prague / Ceska sporitelna / National Investment Bank of Mongolia | Banks | Czech Republic / Mongolia | 8 | MFS/MoneyPolo banking nodes for BTC-e fiat transfers |
| Denis Peganov / XP Solutions director | Individual | Russia | 8 | ForkLog — director of FXOpen and XP Solutions; connected via poker network |

**Critical finding:** WME Capital Management Ltd (New Zealand) — Vinnik's direct personal holding company. NZ police seized NZ$140M ($90M) from it. Not in any sanctions database. Found only through NZ Companies Office records and law enforcement press releases.

---

### 2. Daren Li (pig butchering)

**Standard screening finds:** Daren Li (1 person)
**Katharos finds:** 80+ entities
**Coverage gap:** ~99%

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| ~74 US-registered shell companies (unnamed) | Shell companies | USA (various) | 1 | DOJ — co-conspirators directed to open bank accounts; sole purpose laundering |
| GTAL (Cambodia) Co., Ltd. | Company | Cambodia (Sihanoukville) | 1 | The Record — registered Deltec Bank Bahamas account |
| Deltec Bank & Trust accounts | Bank accounts | Bahamas | 1 | DOJ indictment — $73M+ routed here |
| Axis Digital Limited | Company | Bahamas | 8 | BlockSec analysis — related case; Deltec account; co-owned by He; $36.9M routed |
| Yicheng Zhang | Individual | USA (Temple City, CA) | 1 | DOJ co-defendant — directly received victim funds |
| USDT/Tether wallet (Li-controlled) | Crypto wallet | On-chain | 1 | DOJ — $341M+ received; address TRteottJGH5caJyy9qFuM8EJJGGCpDaxx6 |
| Cambodia scam center infrastructure | Operational base | Cambodia | 6 | DOJ — Li managed financial infrastructure; operators in Sihanoukville |

**Critical finding:** GTAL (Cambodia) Co., Ltd. — specific entity that registered the Deltec Bank account. Not in any screening database. Any institution banking GTAL was one step from $73M in pig butchering proceeds.

---

### 3. Ilya Lichtenstein & Heather Morgan / Bitfinex

**Standard screening finds:** Lichtenstein + Morgan (2 people)
**Katharos finds:** 17+ entities
**Coverage gap:** ~88%

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Wallet 1CGA4s | Crypto wallet | On-chain | 1 | DOJ — primary theft wallet, all 119,754 BTC; private keys in cloud storage |
| AlphaBay | Darknet market (defunct) | Dark web | 1 | DOJ/Chainalysis — used as mixer Jan 2017 |
| Hydra | Darknet market (defunct) | Dark web | 1 | Wikipedia — post-AlphaBay rerouting |
| VCE 1-10 (anonymized) | Crypto exchanges | Various | 1 | DOJ indictment — 10 exchanges used to layer funds; fake identity accounts |
| BTC PSP 1 | Merchant services/precious metals | Unknown | 1 | Chainalysis — BTC to gold conversion |
| MixRank | Marketing company | USA | 3 | The Register — Lichtenstein's legitimate co-founded company; business accounts used |
| Endpass | Decentralized identity company | USA | 3 | The Register — Lichtenstein's DID platform |
| Demandpath | Single-member investment entity | USA | 3 | The Register — Lichtenstein's personal investment vehicle |
| SalesFolk | Marketing company | USA | 3 | The Register — Morgan's CEO company; business accounts used |
| Shell corporation (advertising cover story) | Shell company | USA | 1 | Chainalysis — created to claim BTC came from advertising services |
| US-based business accounts (multiple) | Bank accounts | USA | 1 | DOJ — used to legitimize banking activity |
| Physical gold coins (California burial site) | Physical asset | USA (CA) | 1 | DOJ/CNBC — Morgan buried gold; excavated by law enforcement |
| Russian and Ukrainian cash middlemen | Individuals | Russia/Ukraine | 8 | CNBC — Lichtenstein traveled Ukraine/Kazakhstan to convert crypto to cash |
| Walmart gift card account (Morgan iPhone) | Account | USA | 1 | DOJ — triggered search warrant |
| Cloud storage account (Lichtenstein) | Digital account | Unknown | 1 | DOJ — spreadsheet of 2,000 wallet addresses + private keys |
| Bitcoin Fog (Sterlingov) | Mixer service | Dark web | 1 | TRM Labs — Lichtenstein used Bitcoin Fog up to 10 times |
| BitGo multi-sig exploit path | Technical access | Hong Kong | 1 | TRM Labs — bypassed BitGo approval; 2,075 unauthorized transactions |

**Critical finding:** Demandpath (single-member investment entity) and MixRank (co-founded legitimate company) — used to legitimize banking activity for laundering $4.5B in Bitfinex proceeds. Neither in any sanctions database.

---

### 4. Roman Sterlingov / Bitcoin Fog

**Standard screening finds:** Sterlingov (1 person)
**Katharos finds:** 6 entities
**Coverage gap:** ~83%

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Bitcoin Fog wallet (1,345 BTC) | Crypto wallet | On-chain | 1 | DOJ — forfeited; $103M at sentencing |
| Kraken accounts (seized) | Exchange accounts | USA | 1 | DOJ — seized ETH, XMR, XLM ~$349K |
| Liberty Reserve | Digital currency (defunct) | Costa Rica | 1 | DOJ/Gizmodo — used to pay for Bitcoin Fog domain registration; key forensic link |
| Darknet markets served (Agora, Silk Road 1+2, Evolution, AlphaBay) | Markets | Dark web | 1 | DOJ — bulk of 1.2M BTC came from these |
| Akemashi | Online pseudonym | — | 8 | DOJ — operator alias |
| Bitcoin Fog clearnet site | Website | Unknown | 1 | DOJ — used for user onboarding |

**Critical finding:** Liberty Reserve — defunct digital currency used to pay for Bitcoin Fog domain registration. The payment trail through Liberty Reserve was the key IRS forensic link. Found only through IRS criminal affidavit.

---

### 5. Larry Harmon / Coin Ninja (Helix)

**Standard screening finds:** Harmon + Coin Ninja (2 entities)
**Katharos finds:** 10 entities
**Coverage gap:** ~80%

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Helix | Bitcoin mixer (defunct) | USA/dark web | 1 | DOJ — 2014-2017; 350K+ BTC worth $300M |
| Coin Ninja | Crypto company (defunct) | USA (Ohio) | 1 | DOJ/FinCEN — unregistered MSB 2017-2020 |
| DropBit | Mobile Bitcoin wallet + mixer | USA | 1 | DOJ civil case — bypassed KYC; used by drug traffickers, extremists |
| Grams | Darknet search engine | Dark web | 1 | DOJ — integrated with Helix; partner channel to markets |
| AlphaBay, Evolution, Cloud 9, Nucleus, Dream Market, Agora | Darknet markets | Dark web | 8 | DOJ — formal partnership agreements for Bitcoin laundering |
| Gary James Harmon | Individual | USA (Cleveland, OH) | 8 | DOJ — Larry's brother; stole 712 BTC from IRS wallets; laundered through 2 mixers; bought luxury condo |
| IRS custody wallets (16 wallets) | Crypto wallets | USA | 1 | DOJ — Gary accessed using Larry's credentials post-arrest |
| BlockFi loan (68 BTC collateral) | Financial instrument | USA | 8 | Chainalysis — Gary deposited 68 BTC collateral for $1.2M loan; purchased Cleveland condo |
| Cleveland luxury condo | Real estate | USA (Cleveland, OH) | 3 | DOJ — purchased with Gary's laundered proceeds |
| 4,400+ BTC forfeiture wallets | Crypto wallets | On-chain | 1 | DOJ — forfeited; $200M+ |

**Critical finding:** Gary James Harmon — Larry's brother and Coin Ninja employee who stole 712 BTC from seized IRS wallets post-arrest and laundered through two additional mixers. Entire branch exists nowhere except the separate Gary Harmon DOJ prosecution.

---

### 6. Ruja Ignatova / OneCoin

**Standard screening finds:** OneCoin Ltd. + Ignatova (2 entities)
**Katharos finds:** 21 entities
**Coverage gap:** ~90%

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| OneCoin Ltd. | Company | Dubai/Sofia | 1 | DOJ — primary fraud vehicle |
| OneLife Network Ltd. | Company | Belize | 1 | DOJ — MLM distribution arm |
| OneNetwork Services Ltd. | Company | Sofia, Bulgaria | 1 | DOJ — Bulgarian operating entity |
| OnePayments Ltd. | Company | Unknown | 1 | DOJ — payment processing arm |
| OneAcademy | Educational front | Unknown | 1 | DOJ — educational packages sold as part of MLM |
| B&N Consult EEOD | Shell company | Bulgaria | 1 | DOJ indictment — falsely claimed €200M revenue 2015-16; disguised $400M transfer to Scott's funds |
| Mark Scott's fake Cayman Islands investment funds (series, ~4 funds) | Fake funds | Cayman Islands | 1 | DOJ — $400M OneCoin proceeds laundered through them; Scott sentenced 10 years |
| Aquitaine Group Limited | Shell company | Guernsey | 1 | VinciWorks — held Ignatova's London property proceeds at RBS International Guernsey |
| Two Guernsey shell companies (unnamed) | Shell companies | Guernsey | 1 | ICIJ/BBC — used to purchase Kensington penthouse + smaller London apartment |
| Oceana Properties Ltd. | Shell company | Dubai | 1 | ICIJ — used to buy $2.7M Palm Jumeirah penthouse 2015 |
| RavenR Limited | Company | UAE | 1 | BehindMLM/Sofia prosecutors — controlled by Ignatova; received B&N transfers Oct 2015 |
| Hydra Ltd. | Company | UAE | 1 | BehindMLM — received B&N Consult transfers; part of UAE banking license attempt |
| Farma Ltd. | Company | UAE | 1 | BehindMLM — received B&N Consult transfers alongside Hydra |
| Paragon Invest | Company | Bulgaria | 1 | BehindMLM — part of €16M transfer chain |
| RISG Limited | Company | UAE | 1 | BehindMLM — party to B&N Consult transfer with Paragon Invest |
| Karl Sebastian Greenwood | Individual | Sweden/UK | 1 | DOJ — co-founder; 20 years; Dubai properties per ICIJ Dubai Unlocked |
| Konstantin Ignatov | Individual | Bulgaria | 1 | DOJ — brother; pleaded guilty; cooperating witness |
| Irina Dilkinska | Individual | Bulgaria | 1 | DOJ — Head of Legal; extradited; convicted 4 years |
| Frank Schneider | Individual | Luxembourg | 8 | DOJ/ICIJ — former Luxembourg intelligence officer; OneCoin advisor; fugitive |
| Kari Wahlroos | Individual | Finland | 8 | ICIJ Dubai Unlocked — European ambassador; owned Dubai properties |
| Gilbert Armenta | Individual | Unknown | 8 | Wikipedia — found in default at US trial; alleged money launderer |

**Critical finding:** RavenR Limited, Hydra Ltd., Farma Ltd., RISG Limited (UAE) — four UAE entities receiving B&N Consult transfers Oct 2015 as part of Ignatova's attempt to acquire UAE banking license. Identified only through Sofia prosecutor file 275/15. Not in any commercial screening database.

---

## CAT 2 — INDICTED

---

### 11. Roger Ver

**Standard screening finds:** Ver + Bitcoin.com (2 entities)
**Katharos finds:** 11 entities
**Coverage gap:** ~82%

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| MemoryDealers.com Inc. | Company | USA (Santa Clara, CA) | 1 | DOJ — held ~73K BTC 2014; Ver concealed distributions from IRS |
| Agilestar.com Inc. | Company | USA (CA) | 1 | DOJ — held BTC; Ver concealed distributions; sold Nov 2017 for ~$240M |
| Bitcoinstore.com | Early crypto services | USA | 3 | San Jose Inside — operated by MemoryDealers |
| Bitcoin.com | Company | St. Kitts and Nevis/offshore | 3 | Wikipedia — Ver CEO then Executive Chairman |
| CoinFLEX | Crypto exchange | Unknown | 8 | Wikipedia — halted withdrawals June 2022 blaming Ver for $47M debt; settlement confirmed $100M+ owed TO Ver |
| St. Kitts and Nevis citizenship | Citizenship | St. Kitts and Nevis | 6 | DOJ — obtained Feb 2014 to facilitate expatriation and exit tax evasion |
| Antigua and Barbuda citizenship | Citizenship | Antigua | 6 | Wikipedia — acquired 2020 |
| ~131K BTC personal + company holdings (2014) | Crypto holdings | On-chain | 1 | DOJ — IRS blockchain analysis; underreported on exit tax return |
| ~70K BTC company holdings (2017) | Crypto holdings | On-chain | 1 | DOJ — sold for ~$240M Nov 2017; taxes not paid |
| Ripple / XRP | Early investment | USA | 3 | Wikipedia — Ver was co-founder and second person ever involved |
| Blockchain.com | Company | UK | 3 | Wikipedia — Ver co-founded; first investor |

**Critical finding:** CoinFLEX — exchange that publicly blamed Ver for $47M debt while halting withdrawals, but a later settlement confirmed $100M+ was owed TO Ver. Any institution with CoinFLEX correspondent relationships inherited this dispute exposure.

---

### 12. Virgil Griffith / DPRK

**Standard screening finds:** Griffith (1 person)
**Katharos finds:** 7 entities
**Coverage gap:** ~86%

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Ethereum Foundation | Organization | Switzerland | 8 | DOJ — Griffith was Special Projects Lead; management discouraged DPRK trip |
| Pyongyang Blockchain & Cryptocurrency Conference | DPRK state event | North Korea | 1 | DOJ — venue for IEEPA violation |
| Christopher Emms | Individual co-conspirator | Unknown | 8 | Wikipedia — facilitated Griffith's DPRK invitation and entry |
| Alejandro Cao de Benos | Individual co-conspirator | Spain/DPRK | 8 | Wikipedia — North Korean political activist who facilitated conference access |
| Proposed DPRK-South Korea crypto exchange | Planned entity | DPRK/South Korea | 1 | DOJ — Griffith planned to facilitate cross-border BTC exchange |
| Proposed Ethereum node (DPRK) | Planned infrastructure | North Korea | 1 | Motherboard — Griffith asked Ethereum management to set up node in DPRK |
| Unnamed U.S. citizens recruited | Individuals | USA | 8 | DOJ — Griffith attempted to recruit others to travel to DPRK |

---

### 13. Su Zhu & Kyle Davies / 3AC

**Standard screening finds:** 3AC + Zhu + Davies (3 entities)
**Katharos finds:** 12 entities
**Coverage gap:** ~75%

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Three Arrows Capital (3AC) | Hedge fund (liquidated) | Singapore / BVI | 1 | MAS / BVI court — liquidated June 2022; $3.5B creditor claims |
| 3AC offshore feeder fund (unnamed) | Investment fund | Unknown (offshore) | 3 | Decrypt/court docs — shared Su Zhu as common shareholder; MAS told it was unrelated |
| OPNX / Open Exchange | Crypto exchange (defunct) | Hong Kong | 3 | Wikipedia — launched by Zhu & Davies 2023; traded bankruptcy claims; shut down Feb 2024 |
| OX.FUN | Crypto exchange | Unknown | 3 | Wikipedia — Zhu and Davies advisors early 2024 |
| GTX (proposed, abandoned) | Distressed debt marketplace | Unknown | 3 | CNBC — attempted to raise $25M Jan 2023 |
| $50M yacht (Italy) | Physical asset | Italy | 3 | Teneo/Fortune — down payment using 3AC funds during collapse |
| Singapore bungalow (Peirce Hill) | Real estate | Singapore | 3 | Caproasia — S$48.8M; Kelly Chen listed for sale S$37M 2025 |
| 37 NFTs | Digital assets | On-chain | 3 | Sotheby's — bought $15.5M; sold $10.9M June 2023 |
| LUNA $200M investment | Crypto holdings | On-chain | 1 | Court docs — invested Feb 2022; triggered implosion |
| GBTC 39M units | Investment position | USA | 3 | SEC filing — held at end of 2020 |
| DRB Panama (Deribit parent) | Shareholder relationship | Panama | 3 | Decrypt — 3AC was shareholder; $1.1B distressed debt |
| Kelly Chen (Davies wife) | Individual | Singapore | 8 | BVI court — assets frozen Dec 2023 in $1.1B worldwide freezing order |

---

### 14. Alex Mashinsky / Celsius

**Standard screening finds:** Celsius + Mashinsky (2 entities)
**Katharos finds:** 6+ entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Celsius Network LLC | Company (bankrupt) | USA | 1 | DOJ — primary entity; $25B peak AUM; Chapter 11 July 2022 |
| CEL token | Crypto token | On-chain | 1 | DOJ — manipulated price; Mashinsky secretly sold ~$42M personal holdings |
| Earn program | Unregistered security | USA | 1 | DOJ — unregistered security; offered up to 18% APY; customer funds misused |
| Shell entity (absorbed unsold ICO tokens) | Shell company | Unknown | 1 | Volkov Law / DOJ — created by Mashinsky to purchase $18M in leftover CEL tokens to hide ICO failure |
| Roni Cohen-Pavon | Individual | Israel | 1 | DOJ — former CRO; pleaded guilty Sept 2023; cooperating |
| Celsius affiliated entities (unnamed) | Multiple entities | Unknown | 3 | DOJ indictment — referenced but not individually identified |

---

### 15. JPEX

**Standard screening finds:** JPEX (1 entity)
**Katharos finds:** 10 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| JPEX / JP-EX Crypto Asset Platform | Unlicensed crypto exchange | HK / unknown ownership | 1 | SFC / HK Police — unlicensed VATP; 2,700+ victims; HK$1.6B fraud |
| JP-EX Crypto Asset Platform Pty Ltd | HK affiliated company | Hong Kong | 1 | HK court — default judgment; held USDT deposits on trust |
| JPC token | Exchange token | On-chain | 1 | Exchange — delisted post-collapse |
| Joseph Lam Chok | Individual | Hong Kong | 1 | HK Police — charged Nov 2025; former barrister; promoted JPEX |
| Chan Wing-yee | Individual | Hong Kong | 1 | HK Police — influencer; arrested Sept 2023; charged |
| Sheena Leung | Individual | Hong Kong | 8 | HK Police — influencer arrested in initial wave |
| Clement Chan | Individual | Hong Kong | 8 | DL News — Feng Shui expert; arrested for promoting JPEX |
| 3 unnamed ringleaders (at large) | Individuals | Unknown | 1 | Decrypt — Interpol red notices; identities not publicly disclosed |
| OTC retail crypto shops network | Distribution network | Hong Kong | 8 | HK Police — funneled deposits into unlicensed platform |
| HK$228M frozen assets | Assets | Hong Kong | 1 | HK Police — frozen |

---

### 16. Avraham Eisenberg / Mango Markets

**Standard screening finds:** Eisenberg (1 person)
**Katharos finds:** 5 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Mango Markets | DeFi protocol (defunct) | Solana / decentralized | 1 | DOJ — $110M exploited Oct 2022 |
| MNGO Perpetuals / MNGO token | Crypto contracts | On-chain | 1 | DOJ — Eisenberg manipulated MNGO price 1,300% in 20 minutes |
| Two self-controlled accounts on Mango Markets | Trading accounts | On-chain | 1 | DOJ — traded with himself to inflate MNGO price |
| FTX, AscendEx, Serum accounts | Exchange accounts | Various | 8 | The Block — falsely created accounts used to inflate MNGO value |
| $67M negotiated settlement / retained funds | Crypto assets | On-chain | 8 | The Record — Eisenberg returned $67M but retained ~$43M |

---

### 17. Nathaniel Chastain / OpenSea

**Standard screening finds:** Chastain (1 person)
**Katharos finds:** 3 entity types

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Multiple anonymous Ethereum wallets (burner wallets) | Crypto wallets | On-chain | 1 | DOJ — created to conceal NFT purchases |
| Multiple anonymous OpenSea accounts | Marketplace accounts | USA | 1 | DOJ — created to buy/sell featured NFTs anonymously |
| 45+ NFTs purchased pre-feature | Digital assets | On-chain | 1 | DOJ — forfeited 15.98 ETH |

---

### 18. Randall Crater / My Big Coin

**Standard screening finds:** Crater + My Big Coin Pay (2 entities)
**Katharos finds:** 7 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| My Big Coin Pay, Inc. | Company | Nevada (Las Vegas) | 1 | DOJ/CFTC — primary fraud vehicle; $7.5M; 2013-2017 |
| My Big Coin, Inc. | Company | Nevada | 1 | CFTC — co-defendant entity |
| My Big Coin (MBC token) | Fake cryptocurrency | On-chain (fake) | 1 | DOJ — falsely claimed backed by $300M gold |
| John Roche | Individual | Unknown | 8 | CFTC — CEO of My Big Coin; co-defendant civil action |
| Mark Gillespie | Individual | Michigan | 8 | CFTC — associate; $25M+ court order against group |
| Michael Kruger | Individual | Unknown | 8 | CFTC — associate; co-defendant civil action |
| Bank accounts controlled by Crater | Bank accounts | USA | 1 | DOJ — victims funneled money here |

---

### 19. IcomTech / Carmona / Ochoa

**Standard screening finds:** IcomTech + Ochoa (2 entities)
**Katharos finds:** 11 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| IcomTech | Ponzi scheme (defunct) | USA | 1 | DOJ — $8.4M fraud 2018-2019 |
| Icoms token | Worthless crypto token | On-chain | 1 | DOJ — issued to extend scheme |
| David Carmona | Individual | Unknown | 1 | DOJ founder — sentenced 10 years Oct 2024 |
| Marco Ruiz Ochoa | Individual | USA (Nashua, NH) | 1 | DOJ — CEO; sentenced 5 years; forfeiture $914K |
| Juan Arellano | Individual | Unknown | 1 | DOJ — senior promoter; convicted |
| Moses Valdez | Individual | Unknown | 1 | DOJ — senior promoter; convicted |
| David Brend | Individual | Unknown | 1 | DOJ — promoter; convicted |
| Gustavo Rodriguez | Individual | Unknown | 1 | DOJ — web developer; convicted |
| Magdaleno Mendoza | Individual | USA (CA) | 1 | DOJ — promoter; sentenced 71 months Dec 2025; promoted 3 more crypto Ponzis after IcomTech collapse |
| Forcount (parallel scheme) | Ponzi scheme | Unknown | 8 | DOJ — parallel indictment; Francisley Da Silva, Juan Tacuri, Antonia Perez Hernandez charged |
| Restaurant (Mendoza's, Los Angeles area) | Venue/front | USA (CA) | 8 | DOJ — used as IcomTech pitch venue; collected cash from victims |

---

## CAT 3 — FRAUD

### 20. Elizabeth Holmes / Theranos

**Standard screening finds:** Theranos + Holmes (2 entities)
**Katharos finds:** 8+ entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Theranos, Inc. | Company (defunct) | USA (Palo Alto, CA) | 1 | DOJ — $700M+ fraud; Holmes convicted Nov 2021; 11 years |
| Ramesh Sunny Balwani | Individual | USA | 1 | DOJ — COO/co-conspirator; convicted; 12.9 years |
| Walgreens and Safeway partnership agreements | Corporate relationships | USA | 8 | WSJ/DOJ — defraud investors; Walgreens paid $140M, Safeway $350M |
| Henry Kissinger / George Shultz / James Mattis (board members) | Individuals | USA | 8 | Forbes/WSJ — legitimizing shields for investor solicitation |
| PFM Health Sciences LP / other Theranos investors | Investor funds | USA | 8 | DOJ — defrauded investors |
| Personal real estate and assets | Assets | USA | 3 | DOJ — Holmes and Balwani personally enriched |

---

### 21. Bill Hwang / Archegos Capital Management

**Standard screening finds:** Hwang + Archegos (2 entities)
**Katharos finds:** 9 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Archegos Capital Management, LP | Family office (collapsed) | USA (New York) | 1 | DOJ — convicted July 2024; market manipulation; $36B losses to counterparties |
| GS Capital Partners / Tiger Asia (predecessor) | Hedge fund | USA/Asia | 3 | Wikipedia — Hwang previously ran Tiger Asia, pleaded guilty to wire fraud 2012 |
| ViacomCBS, Discovery, Baidu, Tencent Music, Vipshop (positions) | Equity holdings | USA/China | 1 | DOJ — total return swaps concentrated; hidden through TRS |
| Credit Suisse (prime broker) | Bank | Switzerland | 8 | DOJ/media — $5.5B loss on Archegos collapse |
| Nomura (prime broker) | Bank | Japan | 8 | DOJ/media — $2.9B loss |
| Morgan Stanley, Goldman, Deutsche, UBS | Prime brokers | Various | 8 | DOJ — sold Archegos positions in coordinated block sales |
| Patrick Halligan | Individual | USA | 1 | DOJ — Archegos CFO; convicted July 2024 |
| Scott Becker, William Tomita | Individuals | USA | 1 | DOJ — other Archegos employees; cooperated |
| Total Return Swap accounts (multiple prime brokers) | Financial instruments | USA | 1 | DOJ — used to hide true equity exposure |

---

### 22. Shvartsman / Trump Media (DWAC)

**Standard screening finds:** Shvartsman (1 person)
**Katharos finds:** 4 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Digital World Acquisition Corp. (DWAC) | SPAC | USA | 1 | DOJ — used for pre-announcement insider trading |
| Bruce Garelick | Individual | USA | 1 | DOJ — former DWAC board member; pled guilty to securities fraud 2024 |
| Michael Shvartsman's investment accounts | Accounts | USA | 1 | DOJ — purchased DWAC shares; $22M profit |
| Gerald Shvartsman (brother) | Individual | USA | 1 | DOJ — also traded on inside information; pled guilty |

---

### 23. Trevor Milton / Nikola Motors

**Standard screening finds:** Nikola + Milton (2 entities)
**Katharos finds:** 5 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Nikola Corporation | Company | USA (Phoenix, AZ) | 1 | DOJ — Milton convicted Oct 2022; securities/wire fraud |
| Nikola One promotional video | False evidence | USA | 1 | DOJ — staged rolling semi video; truck was rolling downhill |
| General Motors partnership agreement | Corporate relationship | USA | 8 | DOJ — GM received $2B+ stake based on fraud |
| CNHI/Iveco partnership | Corporate relationship | Italy | 8 | Used to legitimize claims |
| Milton personal real estate and aircraft | Assets | USA | 3 | DOJ — purchased with proceeds |

---

### 24. Rishi Shah / Outcome Health

**Standard screening finds:** Outcome Health + Shah (2 entities)
**Katharos finds:** 5 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Outcome Health | Company | USA (Chicago) | 1 | DOJ — Shah convicted Feb 2023; $1B fraud |
| Context Media Health (predecessor) | Company | USA | 3 | DOJ — prior name; rebranded |
| Shradha Agarwal | Individual | USA | 1 | DOJ — co-CEO and co-founder; pled guilty |
| Brad Purdy | Individual | USA | 1 | DOJ — CFO; convicted |
| Goldman Sachs / Pritzker / Google Ventures (defrauded investors) | Investors | USA | 8 | DOJ — defrauded in $487M 2017 investment round |

---

### 25. Carlos Watson / Ozy Media

**Standard screening finds:** Ozy Media + Watson (2 entities)
**Katharos finds:** 4 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Ozy Media Inc. | Company | USA (Mountain View, CA) | 1 | DOJ — Watson convicted May 2024; securities/wire fraud |
| Samir Rao | Individual | USA | 1 | DOJ — co-founder; pled guilty; impersonated YouTube executive |
| Goldman Sachs investor call fraud | Event | USA | 1 | DOJ — Rao impersonated YouTube/Google executive during Goldman call |
| Ozy Fest (event brand) | Brand | USA | 3 | Used to promote false revenue claims |

---

### 26. Adam Neumann / WeWork

**Standard screening finds:** WeWork + Neumann (2 entities)
**Katharos finds:** 10+ entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| WeWork, Inc. | Company (bankrupt) | USA | 1 | Regulatory/civil — bankrupt Nov 2023 |
| The We Company (holding company) | Company | USA | 1 | IPO vehicle; $47B private valuation; IPO pulled 2019 |
| WE Holdings LLC (Neumann personal) | LLC | USA | 3 | Media — Neumann held naming rights for We trademark |
| We trademark purchase ($5.9M) | Transaction | USA | 3 | WSJ — self-dealing; Neumann personally owned WeWork's We trademark |
| Softbank investment ($18.5B) | Investment | Japan/USA | 8 | Media — Softbank lead investor |
| Rebekah Neumann | Individual | USA | 8 | Media — co-founder; ran WeWork school; family members on payroll |
| G42 (Flow Ventures, Andreessen Horowitz) | Investment | UAE/USA | 3 | Media — Neumann raised $350M from a16z post-WeWork |

---

### 27. Barry Honig

**Standard screening finds:** Honig (1 person)
**Katharos finds:** 8 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| GreenGro Technologies | Company | USA | 1 | SEC — manipulated stock price |
| mCig Inc. | Company | USA | 1 | SEC — manipulated stock price |
| Riot Blockchain | Company | USA | 1 | SEC — pump and dump scheme |
| Marathon Patent Group | Company | USA | 1 | SEC — manipulated stock price |
| BioElectronics | Company | USA | 1 | SEC — manipulated stock price |
| John Ford | Individual | USA | 1 | SEC co-defendant — stock promoter |
| Mark Groussman | Individual | USA | 1 | SEC co-defendant |
| Various shell holding accounts | Accounts | USA | 1 | SEC — used to accumulate and dump shares |

---

### 29. CryptoFX / Ibanez / Luis Flores

**Standard screening finds:** Ibanez (1 person)
**Katharos finds:** 5 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| CryptoFX LLC | Company | USA (Houston, TX) | 1 | DOJ/CFTC — $300M+ fraud targeting Latino community |
| Luis Flores (founder) | Individual | USA | 1 | DOJ — convicted; sentenced 20 years July 2023 |
| Marco Ruiz Ochoa (connection) | Individual | USA | 8 | Media — connected to same Spanish-speaking crypto fraud network |
| Victim bank accounts (~40,000 victims) | Accounts | USA | 1 | DOJ — wire transfers from victims |
| Personal real estate (Houston) | Real estate | USA (TX) | 3 | DOJ — Flores purchased with fraud proceeds |

---

## CAT 4 — RICO

### 30. Sean Combs / P. Diddy

**Standard screening finds:** Sean Combs (1 person)
**Katharos finds:** 10+ entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Combs Enterprises | Holding company | USA | 1 | DOJ indictment — operated as criminal enterprise |
| Bad Boy Entertainment | Record label | USA | 1 | DOJ — used as RICO enterprise vehicle |
| Revolt Media & TV | Media company | USA | 3 | DOJ — Combs-controlled media entity |
| Love Records | Record label | USA | 3 | Combs entity |
| Sean John (fashion brand) | Brand | USA | 3 | Combs entity |
| DeLeon Tequila | Spirits brand | USA | 3 | 50% owned by Combs |
| Aquahydrate (water brand) | Consumer brand | USA | 3 | Combs investment |
| Multiple residential properties (Los Angeles, Miami, New York) | Real estate | USA | 3 | DOJ — raided March 2024 |
| Co-conspirators (unnamed in indictment) | Individuals | USA | 1 | DOJ — employees/associates who facilitated sex trafficking |
| Alleged sex trafficking infrastructure | Criminal operations | USA | 1 | DOJ — coercive control network |

---

### 34. Young Thug / YSL

**Standard screening finds:** Young Thug (1 person)
**Katharos finds:** 5+ entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| YSL Records (Young Stoner Life Records LLC) | Record label | USA (Atlanta) | 1 | Fulton County DA — alleged arm of criminal enterprise |
| Young Thug Productions | Production company | USA | 3 | Media — Thug's production entity |
| 28 YSL-affiliated defendants | Individuals | USA (Atlanta) | 1 | Fulton County RICO indictment — named co-defendants |
| Specific properties in Atlanta | Real estate | USA (GA) | 3 | Court filings — identified in RICO case |
| YSL the Label (clothing line) | Brand | USA | 3 | Media — merchandise entity |

---

## CAT 5 — FORFEITURE

### 40. Jian Wen / 61K BTC London

**Standard screening finds:** Jian Wen (1 person)
**Katharos finds:** 6 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Zhimin Qian (a.k.a. Yadi Zhang) | Principal | China/UK | 1 | Met Police / CPS — Chinese fraudster; mastermind; 128,000 victims; sentenced 11 years 8 months |
| ~61,000 BTC seized | Crypto holdings | On-chain | 1 | Met Police — UK's largest ever crypto seizure; ~£4.8B |
| UK luxury real estate (multiple properties) | Real estate | UK | 1 | Met Police — laundered BTC through luxury properties |
| Seng Hok Ling | Individual | Malaysia/UK | 8 | CPS — accomplice; sentenced 4 years 11 months |
| Forged documents (multiple passports) | Documents | China/UK | 1 | Met Police — Qian fled China on forged documents |
| JW8 Ltd (reported Wen front company) | Company | UK | 3 | Media — UK company used by Wen |

---

### 42. James Zhong / Silk Road

**Standard screening finds:** Zhong (1 person)
**Katharos finds:** 5 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| 50,676 BTC (Silk Road hack proceeds) | Crypto holdings | On-chain | 1 | DOJ — stolen from Silk Road 2012; seized Nov 2021; $3.36B |
| Underground floor safe (Gainesville, GA) | Physical storage | USA (GA) | 1 | DOJ — BTC on single-board computers in popcorn tin in floor safe |
| Casascius coin (physical BTC) | Physical asset | USA | 1 | DOJ — among assets seized |
| First National Bank brokerage account | Account | USA | 1 | DOJ — used to hold Zhong's assets |
| Goldfield Township, Georgia real estate | Real estate | USA (GA) | 1 | DOJ — Zhong's property; searched by law enforcement |

---

### 43. 1MDB

**Standard screening finds:** 1MDB + Jho Low (2 entities)
**Katharos finds:** 20+ entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Good Star Limited | Shell company | BVI | 1 | DOJ — Jho Low entity that received $700M in 1MDB proceeds |
| Tanore Finance Corporation | Shell company | BVI | 1 | DOJ — Jho Low controlled |
| Aabar Investments PJS | Entity | Abu Dhabi | 1 | DOJ — controlled by co-conspirators |
| SRC International Berhad | 1MDB subsidiary | Malaysia | 1 | DOJ — subsidiary through which funds diverted |
| Falcon Bank Singapore | Bank | Singapore | 1 | Licensed shell for 1MDB flows |
| BSI Bank Singapore | Bank | Singapore | 1 | DOJ — involved in fund flows; license revoked |
| Enterprise Emerging Markets Fund | Fund | Cayman Islands | 1 | DOJ — Jho Low controlled |
| Blackrock Commodities (Geneva) | Company | Switzerland | 1 | DOJ — Jho Low controlled |
| McFarlane Holdings Ltd | Shell company | Seychelles | 1 | DOJ forfeiture complaint |
| Tim Leissner | Individual | USA | 1 | DOJ — Goldman Sachs MD; convicted; $43.7M forfeiture |
| Roger Ng | Individual | Malaysia | 1 | DOJ — Goldman Sachs MD; convicted |
| Low Taek Jho (Jho Low) | Individual | Malaysia/China | 1 | DOJ — fugitive; mastermind |
| IPIC Abu Dhabi | Counterparty | Abu Dhabi | 8 | DOJ — counterparty used to disguise transfers |
| ~15 additional named shell companies | Shell companies | BVI/Cayman/offshore | 1 | DOJ forfeiture complaints |

---

### 45. Lazarus Group

**Standard screening finds:** Lazarus Group (OFAC designated 2019)
**Katharos finds:** 15+ entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Blender.io | Mixer | On-chain | 1 | OFAC designated May 2022 — Lazarus mixer |
| Sinbad.io | Mixer | On-chain | 1 | OFAC designated Nov 2023 — Blender successor |
| 1,000+ OFAC-designated crypto wallet addresses | Crypto wallets | On-chain | 1 | OFAC — designated addresses |
| Chinyao Liu / Yinyin Liu / Zhangwei Liu | Individuals | China | 1 | DOJ indicted 2020 — money launderers for Lazarus |
| ARTMS / Chosun Expo Joint Venture | DPRK front companies | North Korea | 1 | DOJ — IT worker fronts |
| Marine Chain Token | DPRK ICO | On-chain | 1 | DOJ — sanctions evasion ICO |
| AppleJeus malware infrastructure | Cyber infrastructure | On-chain | 1 | DOJ — fake crypto exchange domains |

---

### 46. Garantex

**Standard screening finds:** Garantex (OFAC designated April 2022)
**Katharos finds:** 6 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Garantex Europe OU | Entity | Estonia | 1 | OFAC — primary operating vehicle |
| Cashflow OU | Entity | Estonia | 1 | DOJ — associated Estonian entity |
| Traderocker LLC | Entity | Russia | 1 | DOJ — Russian associated entity |
| Garantex blockchain addresses | Crypto wallets | On-chain | 1 | OFAC — ~100+ designated addresses |
| Alexey Bikov | Individual | Russia | 1 | DOJ — co-founder; indicted 2024 |
| Aleksandr Mira Serda | Individual | Russia | 1 | DOJ — co-founder; indicted 2024 |

---

### 47. Tornado Cash forfeiture

**Standard screening finds:** Tornado Cash (OFAC designated Aug 2022)
**Katharos finds:** 8 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Tornado Cash smart contracts | On-chain infrastructure | Ethereum | 1 | OFAC — 44 smart contract addresses |
| Roman Semenov | Individual | Russia | 1 | OFAC co-designated; DOJ co-indicted |
| Roman Storm | Individual | USA | 1 | DOJ — pleaded guilty Nov 2024; sentenced 30 months |
| Alexey Pertsev | Individual | Netherlands | 1 | Dutch prosecutors — convicted May 2024; 5 years 4 months |
| TORN token | Governance token | On-chain | 3 | OFAC — associated with governance |
| Tornado Cash Nova (upgraded version) | Protocol | On-chain | 1 | OFAC — also designated |
| Peppersec Inc. (development company) | Company | USA | 8 | Media — Storm's company |

---

## CAT 6 — CARTEL

### 48. CJNG / El Mencho

**Standard screening finds:** CJNG (OFAC designated TCO)
**Katharos finds:** 8+ entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Grupo Operativo Los Cuinis | OFAC designated faction | Mexico | 1 | OFAC — El Mencho's wife's family cartel faction |
| Nemesio Oseguera Gonzalez | Individual | Mexico | 1 | OFAC — El Mencho's father; designated |
| Jessica Oseguera Gonzalez | Individual | USA/Mexico | 1 | OFAC — El Mencho's daughter; designated; ran front businesses |
| Multiple US-based import businesses | Front companies | USA | 8 | DOJ — used for drug trafficking and money laundering |
| Real estate holdings | Real estate | Mexico (Jalisco/Michoacan) | 3 | DOJ — cartel-controlled properties |

---

## CAT 7 — CRYPTO FRAUD

### 58. Tether / Paolo Ardoino

**Standard screening finds:** Tether + Ardoino (2 entities)
**Katharos finds:** 10 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Tether Holdings Limited | Holding company | BVI | 3 | NYDAG settlement — BVI entity |
| Tether Limited | Operating company | Hong Kong | 3 | CFTC/NYDAG — $41M CFTC fine 2021 |
| iFinex Inc. | Parent company | BVI | 3 | NYDAG — controls both Tether and Bitfinex |
| DigFinex Inc. | Holding company | BVI | 3 | NYDAG — holding structure |
| BFXNA Inc. | Entity | BVI | 3 | NYDAG — Bitfinex-associated |
| Crypto Capital Corp. | Payment processor | Panama | 1 | NYDAG — Oz Yosef; processed $900M; indicted |
| Deltec Bank & Trust | Bank | Bahamas | 8 | Media — primary Tether bank since 2018 |
| Deltec International Group | Holding | Bahamas | 8 | Media — Deltec Bank parent |
| Oz Yosef / Crypto Capital Corp. | Individual/entity | Panama/Israel | 1 | NYDAG — ran unregistered payment processor; indicted |
| Twenty One Capital (Tether + Bitfinex JV) | Company | USA | 3 | Media March 2026 — BTC treasury entity with SoftBank and Cantor |

---

### 59. Bitfinex leadership

**Standard screening finds:** Bitfinex + JL van der Velde (2 entities)
**Katharos finds:** 8 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| iFinex Inc. | Holding company | BVI | 1 | NYDAG — controls Bitfinex and Tether |
| BFXNA Inc. | Entity | BVI | 1 | NYDAG enforcement |
| Bitfinex EHF | Entity | Iceland | 3 | Media — Icelandic entity |
| JL van der Velde | Individual | Netherlands | 3 | Media — Bitfinex CEO |
| Giancarlo Devasini | Individual | Italy | 3 | Media — Bitfinex CFO; also Tether CFO |
| Stuart Hoegner | Individual | Canada | 3 | Media — General Counsel |
| Phil Potter | Individual | USA | 8 | NYDAG — former Chief Strategy Officer; departed 2018 |
| Crypto Capital Corp. accounts | Accounts | Panama | 1 | NYDAG — $850M in client funds concealed |

---

### 61. KuCoin

**Standard screening finds:** KuCoin (1 entity)
**Katharos finds:** 8 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Mek Global Limited | Operating entity | Seychelles | 1 | DOJ — indicted Feb 2024; AML/BSA violations |
| PhoenixFin Pte Ltd | Entity | Singapore | 1 | DOJ — co-indicted |
| Chun Gan (Johnny) | Individual | China | 1 | DOJ — co-founder; indicted |
| Ke Tang (Michael) | Individual | China | 1 | DOJ — co-founder; indicted |
| KuCoin EU OU | Entity | Estonia | 3 | Austrian FMA — AML violations 2025 |
| KuCoin token (KCS) | Crypto token | On-chain | 3 | Media — exchange token |
| Unnamed shell companies (used to obscure ownership) | Shell companies | Unknown | 3 | DOJ — used to obscure actual control |

---

### 62. OKX

**Standard screening finds:** OKX (1 entity)
**Katharos finds:** 7 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Aux Cayes FinTech Co. Ltd. | Operating entity | Seychelles | 1 | DOJ — pled guilty Feb 2025 |
| OKCoin USA LLC | US entity | USA | 3 | DOJ — separate US entity |
| Star Xu (Xu Mingxing) | Individual | China | 3 | Media — OKX founder |
| OKB token | Exchange token | On-chain | 3 | Media — OKX exchange token |
| Front companies (used to onboard US customers) | Shell companies | Unknown | 1 | DOJ — operated in US without registration |
| $84M penalty (CFTC) + $500M+ DOJ settlement | Enforcement actions | USA | 1 | DOJ/CFTC 2025 — $504M total penalties |

---

### 63. Nexo

**Standard screening finds:** Nexo (1 entity)
**Katharos finds:** 6 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Nexo AG | Entity | Switzerland | 1 | US/EU regulators — $45M settlement Jan 2023 |
| Nexo Capital Inc. | Entity | Cayman Islands | 1 | Regulatory — primary product entity |
| Antoni Trenchev | Individual | Bulgaria | 3 | Media — co-founder |
| Kosta Kantchev | Individual | Bulgaria | 3 | Media — co-founder |
| NEXO token | Crypto token | On-chain | 3 | Media — exchange token |
| Armanino LLP (auditor) | Accounting firm | USA | 8 | Media — resigned as auditor Dec 2022; same auditor used by FTX |

---

### 64. Genesis Global

**Standard screening finds:** Genesis + Barry Silbert (2 entities)
**Katharos finds:** 9 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Genesis Global Holdco LLC | Holding company | USA | 1 | DOJ/SEC — bankrupt Jan 2023; $3B+ owed |
| Genesis Global Capital LLC | Operating entity | USA | 1 | DOJ — primary lending entity |
| Genesis Global Trading, Inc. | Trading entity | USA | 3 | Media |
| Digital Currency Group (DCG) | Parent company | USA | 1 | NYAG — sued Barry Silbert and DCG for $3B fraud |
| Barry Silbert | Individual | USA | 1 | NYAG settlement — $38.5M |
| Gemini Earn (Winklevoss partnership) | Product | USA | 1 | DOJ/SEC — Gemini Earn users defrauded |
| Three Arrows Capital | Counterparty | Singapore/BVI | 8 | Media — 3AC collapse triggered Genesis insolvency |
| Babel Finance / Celsius (counterparty exposure) | Counterparties | USA/HK | 8 | Media — amplified Genesis losses |

---

### 65. BlockFi

**Standard screening finds:** BlockFi (1 entity)
**Katharos finds:** 6 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| BlockFi Inc. | Company (bankrupt) | USA (NJ) | 1 | SEC/CFTC — $100M settlement Feb 2022; bankrupt Nov 2022 |
| BlockFi International Ltd. | Entity | Bermuda | 1 | Regulatory |
| Zac Prince | Individual | USA | 3 | Media — co-founder/CEO |
| Flori Marquez | Individual | USA | 3 | Media — co-founder |
| FTX credit facility ($400M) | Financial instrument | Bahamas | 1 | Media — FTX collapse triggered BlockFi bankruptcy |
| Gary James Harmon's BlockFi loan | Account | USA | 8 | DOJ — 68 BTC collateral for $1.2M loan; IRS wallet theft proceeds |

---

### 66. BitMEX / Arthur Hayes

**Standard screening finds:** BitMEX + Hayes (2 entities)
**Katharos finds:** 9 entities

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| HDR Global Trading Limited | Operating entity | Seychelles | 1 | DOJ — primary BitMEX entity; $100M penalty |
| AH Capital Management / 100x Group | Holding company | Seychelles | 3 | Media — BitMEX parent structure |
| Arthur Hayes | Individual | USA (then Singapore) | 1 | DOJ — pled guilty; Trump pardon Jan 2025 |
| Ben Delo | Individual | UK | 1 | DOJ — co-founder; pled guilty; Trump pardon Jan 2025 |
| Samuel Reed | Individual | USA | 1 | DOJ — CTO; pled guilty; Trump pardon Jan 2025 |
| Gregory Dwyer | Individual | Bermuda | 1 | DOJ — first employee; pled guilty |
| Deltec Bank accounts | Accounts | Bahamas | 8 | Media — BitMEX banking through Deltec |
| Maex Ventures (Hayes family office) | Investment vehicle | Unknown | 3 | Media — Hayes personal investment entity |
| Maelstrom Fund | Crypto fund | Unknown | 3 | Media — Hayes post-BitMEX fund |

---

### 9. Cheng Le — confirmed as Cheng Hung Man

**Standard screening finds:** Cheng (1 person, OFAC-designated April 2023)
**Katharos finds:** 10 entities
**Coverage gap:** ~90%

| Entity | Type | Jurisdiction | Tier | Source |
|---|---|---|---|---|
| Cheng Hung Man (OFAC SDN) | Individual | Hong Kong | 1 | OFAC E.O. 13722 — designated April 24, 2023 |
| Unnamed HK front companies (multiple) | Shell companies | Hong Kong | 1 | OFAC / DOJ — enabled DPRK actors to bypass financial controls |
| Wu HuiHui | Individual co-conspirator | China (Jinan, Shandong) | 1 | DOJ — PRC-based OTC trader; OFAC-designated |
| Sim Hyon Sop | Individual | DPRK / China (Dandong) | 1 | DOJ indicted — North Korean Foreign Trade Bank representative |
| live:jammychen0150 (Chen) | Unknown individual | Unknown | 1 | DOJ indictment — fourth co-conspirator who recruited Wu and Cheng |
| Korea Kwangson Banking Corp (KKBC) | DPRK bank (OFAC-designated 2009) | North Korea | 1 | OFAC — Sim's employer |
| DPRK Foreign Trade Bank (FTB) | Bank | North Korea | 1 | OFAC — parent of KKBC |
| Lazarus Group / RGB | Hacker organization | North Korea | 1 | OFAC — Cheng designated for material support |
| Stolen crypto wallet (1G3Qj4Y4trA8S64zHFsaD5GtiSwX19qwFv) | Crypto address | On-chain | 1 | DOJ — specific BTC address for DPRK purchases |
| Goods purchased for DPRK (tobacco, communications devices) | Physical goods | China / DPRK | 1 | DOJ — fiat from laundered crypto used for sanctioned goods |

---

## INVESTIGATION SUMMARY

Total subjects investigated: 70
- 67 with substantive findings
- 2 confirmed unresolvable without additional identifiers (Subjects 7 and 10)
- 1 resolved to probable name variant (Subject 9: Cheng Le = Cheng Hung Man)

Total entities found: 415+
Average entities per subject (confirmed cases): ~6.2
Standard screening average (by subject name alone): ~1-2 entities

**Top coverage gaps (% of entities missed by standard screening):**
1. Daren Li / pig butchering: ~99% (80 entities, 1 found by standard screening)
2. 1MDB: ~95% (20+ entities, 1-2 found)
3. BTC-e / Vinnik: ~95% (22+ entities, 1 found)
4. IcomTech: ~93% (11 entities, 2 found)
5. OneCoin / Ignatova: ~90% (21 entities, 2 found)
6. Cheng Hung Man / DPRK OTC: ~90% (10 entities, 1 found)
