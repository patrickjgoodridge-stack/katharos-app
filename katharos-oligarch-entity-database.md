# Russian Oligarch Networks â Full Entity Investigation
## Katharos Database Entry | Investigation Date: 2026-03-15 | Version: 1.0

---

## INVESTIGATION METADATA

```json
{
  "investigation_id": "KATHAROS-2026-OLIGARCHS-001",
  "investigation_date": "2026-03-15",
  "schema_version": "1.0",
  "subjects": [
    "Vladimir Vladimirovich Putin",
    "Vladimir Olegovich Potanin",
    "Oleg Vladimirovich Deripaska",
    "Roman Arkadyevich Abramovich"
  ],
  "total_entities_found": 127,
  "standard_screening_would_find": 16,
  "coverage_gap_pct": 87,
  "key_finding": "Standard screening returns 4 names + ~12 directly listed entities. This investigation found 127 entities across all four networks including seven Potanin evasion entities created after all ICIJ datasets, four Deripaska evasion entities created specifically to circumvent sanctions, the Abramovich-to-Roldugin cross-network link, and the full Ozero Dacha Cooperative inner circle structure.",
  "master_sources": [
    {"id": "MS001", "description": "OFAC SDN Designation â Yury Kovalchuk, Bank Rossiya, Rotenbergs", "url": "https://home.treasury.gov/news/press-releases/jl23331", "date": "2014-03-20", "type": "regulatory_filing"},
    {"id": "MS002", "description": "ICIJ Panama Papers â Putin / Roldugin offshore network", "url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/", "date": "2016-04-03", "type": "icij"},
    {"id": "MS003", "description": "ICIJ Cyprus Confidential â Abramovich 261 companies", "url": "https://www.icij.org/investigations/cyprus-confidential/about-cyprus-confidential-investigation/", "date": "2023-11-15", "type": "icij"},
    {"id": "MS004", "description": "OFAC SDN Designation â Vladimir Potanin, Interros, Rosbank", "url": "https://home.treasury.gov/news/press-releases/jy1163", "date": "2022-12-15", "type": "regulatory_filing"},
    {"id": "MS005", "description": "US State Department + OFAC â Potanin evasion scheme, 7 entities designated", "url": "https://www.miragenews.com/us-implements-new-measures-to-cripple-russias-1254551/", "date": "2024-06-12", "type": "regulatory_filing"},
    {"id": "MS006", "description": "OFAC SDN Designation â Oleg Deripaska, B-Finance, Basic Element, EN+, Rusal", "url": "https://home.treasury.gov/news/press-releases/sm0338", "date": "2018-04-06", "type": "regulatory_filing"},
    {"id": "MS007", "description": "OFAC â Deripaska evasion scheme, Beloglazov / Titul / Iliadis / Rasperia designated", "url": "https://home.treasury.gov/news/press-releases/jy2337", "date": "2024-05-14", "type": "regulatory_filing"},
    {"id": "MS008", "description": "EU Council â Deripaska evasion scheme, 14th sanctions package", "url": "https://www.consilium.europa.eu/en/press/press-releases/2024/06/28/russia-s-war-of-aggression-against-ukraine-eu-lists-two-individuals-and-four-entities-for-circumventing-eu-sanctions-and-materially-supporting-the-russian-government/", "date": "2024-06-28", "type": "regulatory_filing"},
    {"id": "MS009", "description": "TBIJ / ICIJ â Abramovich 200+ offshore companies, Cyprus Confidential", "url": "https://www.thebureauinvestigates.com/stories/2023-11-15/how-roman-abramovich-became-the-face-of-russian-wealth", "date": "2023-11-15", "type": "icij"},
    {"id": "MS010", "description": "OCCRP â Bank Rossiya / Roldugin / Panama Papers", "url": "https://www.occrp.org/en/project/the-panama-papers/russia-banking-on-influence", "date": "2016-04-03", "type": "icij"},
    {"id": "MS011", "description": "ICIJ Panama Papers â Roldugin shell companies full list", "url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/", "date": "2016-04-03", "type": "icij"},
    {"id": "MS012", "description": "Wikipedia â Sergei Roldugin, offshore network detail", "url": "https://en.wikipedia.org/wiki/Sergei_Roldugin", "date": "2026-03-01", "type": "news_investigation"},
    {"id": "MS013", "description": "Proekt Media â Putin Ermira Cyprus vehicle investigation", "url": "https://www.proekt.media/en/guide-en/vladimir-putin-ermira-en/", "date": "2023-02-28", "type": "news_investigation"},
    {"id": "MS014", "description": "OCCRP â LLCInvest / Bank Rossiya network", "url": "https://www.occrp.org/en/project/russian-asset-tracker/mysterious-group-of-companies-tied-to-bank-rossiya-unites-billions-of-dollars-in-assets-connected-to-vladimir-putin", "date": "2023-01-01", "type": "news_investigation"},
    {"id": "MS015", "description": "Wikipedia â Yury Kovalchuk full biography and holdings", "url": "https://en.wikipedia.org/wiki/Yury_Kovalchuk", "date": "2026-03-01", "type": "news_investigation"},
    {"id": "MS016", "description": "TBIJ â Abramovich Evraz Greenleas pre-invasion transfer", "url": "https://www.thebureauinvestigates.com/stories/2023-11-15/how-roman-abramovich-became-the-face-of-russian-wealth", "date": "2023-11-15", "type": "icij"},
    {"id": "MS017", "description": "TBIJ â Abramovich / Shvidler tax evasion investigation", "url": "https://www.thebureauinvestigates.com/stories/2025-01-29/roman-abramovich-may-owe-uk-1bn-in-unpaid-tax", "date": "2025-01-29", "type": "news_investigation"},
    {"id": "MS018", "description": "ICIJ Swiss bank indictment â Roldugin / Gazprombank Zurich", "url": "https://www.icij.org/investigations/panama-papers/swiss-bank-employees-indicted-in-connection-to-russia-presidents-vast-fortunes/", "date": "2023-03-02", "type": "icij"},
    {"id": "MS019", "description": "Washington Post â Pandora Papers, Timchenko / LTS Holdings", "url": "https://www.washingtonpost.com/world/interactive/2021/us-russia-sanctions/", "date": "2021-10-05", "type": "icij"}
  ]
}
```

---

## SUBJECT 1: VLADIMIR PUTIN NETWORK

### TIER 1 â PUTIN DIRECT SANCTIONS STATUS

---

### Entity 1: Vladimir Vladimirovich Putin

```json
{
  "entity_id": "PUT-001",
  "full_legal_name": "Vladimir Vladimirovich Putin",
  "aliases": ["Vladimir Putin", "Ð.Ð. ÐÑÑÐ¸Ð½"],
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "dob": "1952-10-07",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "UK": "Full asset freeze, travel ban â HM Treasury consolidated list",
    "EU": "Full designation â EU sanctions list",
    "OFAC": "Not on SDN â sitting head of state. Network sanctioned instead.",
    "Canada": "Designated",
    "Australia": "Designated"
  },
  "note": "Not on OFAC SDN as a sitting head of state. US approach: sanction the network rather than Putin personally. All entities beneficially owned 50%+ are blocked.",
  "source_primary": "UK HM Treasury Consolidated Sanctions List â Putin designation",
  "source_url": "https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets",
  "source_type": "regulatory_filing",
  "source_date": "2022-03-01",
  "confidence": "high"
}
```

---

### TIER 2 â THE PUTIN WALLETS

These individuals hold and manage Putin's wealth on his behalf. Not Putin's
entities in the legal sense. Standard screening of Putin finds none of these.

---

### Entity 2: Sergei Pavlovich Roldugin

```json
{
  "entity_id": "PUT-002",
  "full_legal_name": "Sergei Pavlovich Roldugin",
  "aliases": ["Sergey Roldugin", "Ð¡ÐµÑÐ³ÐµÐ¹ Ð Ð¾Ð»Ð´ÑÐ³Ð¸Ð½"],
  "entity_type": "individual",
  "jurisdiction": "Russia (St. Petersburg)",
  "tier": 2,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "EU": "Sanctioned post-February 2022 invasion",
    "OFAC": "Not on SDN as of investigation date"
  },
  "role": "Primary Putin wealth frontman. Cellist. Godfather to Putin's eldest daughter Maria. Introduced Putin to his first wife Lyudmila.",
  "assets_under_management": "$2B+ moved through his shell network per ICIJ",
  "bank_accounts": "Gazprombank Zurich â Swiss bankers indicted for failing to flag suspicious transactions",
  "source_primary": "ICIJ Panama Papers â Roldugin identified as primary frontman for Putin wealth network",
  "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/",
  "source_type": "icij",
  "source_date": "2016-04-03",
  "confidence": "high",
  "additional_sources": [
    {"description": "ICIJ â Swiss bankers indicted for Roldugin Gazprombank accounts", "url": "https://www.icij.org/investigations/panama-papers/swiss-bank-employees-indicted-in-connection-to-russia-presidents-vast-fortunes/", "date": "2023-03-02"},
    {"description": "OCCRP â Troika Laundromat, Roldugin received $69M", "url": "https://www.occrp.org/en/troikalaundromat/money-for-nothing-putin-friend-sergei-roldugin-enriched-by-troika-laundromat", "date": "2019-03-01"}
  ]
}
```

---

### Entity 3: Sonnette Overseas

```json
{
  "entity_id": "PUT-003",
  "full_legal_name": "Sonnette Overseas",
  "entity_type": "company",
  "jurisdiction": "British Virgin Islands",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Sergei Roldugin (frontman for Putin network)",
  "role": "Roldugin-owned BVI shell. Registered 2007â2012. Received tens of millions in wire transfers. Used in fictitious share transactions generating profits for Putin network.",
  "managed_by": "Oleg Gordin and Aleksander Plekhov (Bank Rossiya-affiliated)",
  "source_primary": "ICIJ Panama Papers â Mossack Fonseca records listing Roldugin as owner of Sonnette Overseas BVI",
  "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/",
  "source_type": "icij",
  "source_date": "2016-04-03",
  "confidence": "high"
}
```

---

### Entity 4: International Media Overseas

```json
{
  "entity_id": "PUT-004",
  "full_legal_name": "International Media Overseas",
  "aliases": ["IMO"],
  "entity_type": "company",
  "jurisdiction": "Panama",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Sergei Roldugin (frontman for Putin network)",
  "role": "Panama-registered Roldugin shell. Used alongside Sonnette Overseas in Bank Rossiya-managed offshore network. Received payments from Bank Rossiya-adjacent companies.",
  "managed_by": "Aleksander Plekhov (Bank Rossiya-affiliated)",
  "source_primary": "ICIJ Panama Papers â Mossack Fonseca records, Roldugin as owner",
  "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/",
  "source_type": "icij",
  "source_date": "2016-04-03",
  "confidence": "high"
}
```

---

### Entity 5: Sandalwood Continental

```json
{
  "entity_id": "PUT-005",
  "full_legal_name": "Sandalwood Continental",
  "entity_type": "company",
  "jurisdiction": "British Virgin Islands",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Oleg Gordin (Roldugin representative) â frontman for Putin network",
  "role": "BVI shell holding billions. Received loans from Cyprus-based RCB Bank (VTB subsidiary) on preferential terms. Invested in Putin-linked assets including Igora ski resort.",
  "igora_connection": "Gave loans to Russian company Ozon which owns Igora ski resort â site of Putin daughter Tikhonova's wedding to Kirill Shamalov",
  "source_primary": "OCCRP â Troika Laundromat investigation, Sandalwood as Roldugin-linked entity",
  "source_url": "https://www.occrp.org/en/project/the-panama-papers/russia-banking-on-influence",
  "source_type": "icij",
  "source_date": "2016-04-03",
  "confidence": "high"
}
```

---

### Entity 6: Sunbarn Limited

```json
{
  "entity_id": "PUT-006",
  "full_legal_name": "Sunbarn Limited",
  "entity_type": "company",
  "jurisdiction": "British Virgin Islands",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Oleg Gordin (Roldugin representative)",
  "role": "BVI shell created by Bank Rossiya manager. Received loans from Rotenberg-connected companies totaling $231M+ with no repayment schedule.",
  "source_primary": "ICIJ Panama Papers â Sunbarn created by Bank Rossiya manager, $231M no-repayment loans from Rotenberg companies",
  "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/",
  "source_type": "icij",
  "source_date": "2016-04-03",
  "confidence": "high"
}
```

---

### Entity 7: Ove Financial Corp

```json
{
  "entity_id": "PUT-007",
  "full_legal_name": "Ove Financial Corp",
  "entity_type": "company",
  "jurisdiction": "British Virgin Islands",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Roldugin network",
  "role": "Fifth BVI shell in Roldugin network. Part of the seven offshore companies registered in Roldugin's name across Panama, Belize, and BVI.",
  "source_primary": "Wikipedia â Sergei Roldugin, listing Ove Financial Corp as Roldugin-linked entity",
  "source_url": "https://en.wikipedia.org/wiki/Sergei_Roldugin",
  "source_type": "news_investigation",
  "source_date": "2026-03-01",
  "confidence": "medium"
}
```

---

### Entity 8: Namiral Trading Ltd

```json
{
  "entity_id": "PUT-008",
  "full_legal_name": "Namiral Trading Ltd",
  "entity_type": "company",
  "jurisdiction": "Cyprus",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Aleksander Plekhov (Bank Rossiya-affiliated, Roldugin network)",
  "role": "Cyprus-registered Plekhov firm. With Norma Group Ltd owns combined 20% stake in Video International, Russia's largest TV advertising firm. Holds accounts with Gazprombank Zurich.",
  "source_primary": "Wikipedia â Sergei Roldugin, Namiral and Norma Group stake in Video International",
  "source_url": "https://en.wikipedia.org/wiki/Sergei_Roldugin",
  "source_type": "news_investigation",
  "source_date": "2026-03-01",
  "confidence": "high"
}
```

---

### Entity 9: Norma Group Ltd

```json
{
  "entity_id": "PUT-009",
  "full_legal_name": "Norma Group Ltd",
  "entity_type": "company",
  "jurisdiction": "British Virgin Islands",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Aleksander Plekhov (Bank Rossiya-affiliated, Roldugin network)",
  "role": "BVI-registered Plekhov firm. With Namiral Trading owns combined 20% of Video International. Both hold accounts at Gazprombank Zurich, managed by Swiss law firm Dietrich, Baumgartner & Partners.",
  "source_primary": "Wikipedia â Sergei Roldugin, Norma Group and Namiral stake in Video International",
  "source_url": "https://en.wikipedia.org/wiki/Sergei_Roldugin",
  "source_type": "news_investigation",
  "source_date": "2026-03-01",
  "confidence": "high"
}
```

---

### Entity 10: Raytar

```json
{
  "entity_id": "PUT-010",
  "full_legal_name": "Raytar",
  "entity_type": "company",
  "jurisdiction": "Cyprus",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Sergei Roldugin holds 15% stake",
  "role": "Cyprus company in which Roldugin holds 15% share. Part of broader Roldugin media and asset portfolio.",
  "source_primary": "Newsweek â Panama Papers coverage listing Roldugin's stakes including 15% of Raytar Cyprus",
  "source_url": "https://www.newsweek.com/panama-papers-what-scandal-how-putin-linked-443630",
  "source_type": "icij",
  "source_date": "2016-06-02",
  "confidence": "high"
}
```

---

### Entity 11: Desmin Holdings

```json
{
  "entity_id": "PUT-011",
  "full_legal_name": "Desmin Holdings",
  "entity_type": "company",
  "jurisdiction": "Offshore (jurisdiction not confirmed)",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Roldugin network",
  "role": "Shell used to acquire Tokido Holdings' debt rights. In Sept 2010 Tokido passed rights to claim 4 billion rubles owed by NTC to Desmin Holdings â enabling Roldugin network to receive $59M+ for $2 payment.",
  "source_primary": "OCCRP â Secret Caretaker investigation, Desmin Holdings in Kerimov/Roldugin transaction",
  "source_url": "https://www.occrp.org/en/project/the-panama-papers/the-secret-caretaker",
  "source_type": "icij",
  "source_date": "2016-04-03",
  "confidence": "high"
}
```

---

### Entity 12: Tokido Holdings

```json
{
  "entity_id": "PUT-012",
  "full_legal_name": "Tokido Holdings",
  "entity_type": "company",
  "jurisdiction": "Offshore",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Roldugin network",
  "role": "Loaned 4 billion rubles to National Telecommunications JSC (Kerimov company). Later transferred rights to receive that 4 billion to Desmin Holdings for essentially nothing â enabling the Roldugin network to receive 4 billion rubles from a Kerimov company.",
  "source_primary": "OCCRP â Secret Caretaker investigation, Tokido Holdings in Kerimov/Roldugin scheme",
  "source_url": "https://www.occrp.org/en/project/the-panama-papers/the-secret-caretaker",
  "source_type": "icij",
  "source_date": "2016-04-03",
  "confidence": "high"
}
```

---

### TIER 3 â BANK ROSSIYA â THE CENTRAL NODE

---

### Entity 13: Bank Rossiya (OJSC AB Rossiya)

```json
{
  "entity_id": "PUT-013",
  "full_legal_name": "Bank Rossiya (OJSC AB Rossiya)",
  "aliases": ["Rossiya Bank", "Ð Ð¾ÑÑÐ¸Ñ ÐÐ°Ð½Ðº"],
  "entity_type": "company",
  "jurisdiction": "Russia (St. Petersburg)",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN since March 2014 â E.O. 13661",
    "EU": "Sanctioned",
    "UK": "Sanctioned"
  },
  "role": "Described by US Treasury as 'personal bank for senior officials of the Russian Federation.' Built and managed the Roldugin offshore network. Shareholders include Ozero Dacha Cooperative members. 17th largest bank in Russia with $10B+ assets at designation. Correspondent relationships with US, European, and other banks.",
  "shareholders": "Yury Kovalchuk (~38%), Nikolai Shamalov, Mikhail Shelomov (Putin relative), Sergei Roldugin (3.2%)",
  "post_sanctions": "Has opened branches across Crimea post-annexation. Through National Media Group controls major Russian TV channels.",
  "source_primary": "OFAC SDN designation March 2014 â Bank Rossiya designated as personal bank for senior Russian officials",
  "source_url": "https://home.treasury.gov/news/press-releases/jl23331",
  "source_type": "regulatory_filing",
  "source_date": "2014-03-20",
  "confidence": "high"
}
```

---

### TIER 4 â THE OZERO DACHA COOPERATIVE INNER CIRCLE

The organizational hub of the Putin network. Founded 1996. All eight
members became billionaires or senior officials.

---

### Entity 14: Ozero Dacha Cooperative

```json
{
  "entity_id": "PUT-014",
  "full_legal_name": "Ozero Dacha Cooperative",
  "aliases": ["ÐÐ·ÐµÑÐ¾", "The Lake"],
  "entity_type": "cooperative",
  "jurisdiction": "Russia (Komsomolskoye Lake, Leningrad Oblast)",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": false,
  "role": "Gated dacha community founded November 10 1996. Members: Putin, Kovalchuk, Rotenbergs, Shamalov, Yakunin, Fursenko, Myachin. US Treasury: 'Bank Rossiya shareholders include members of Putin's inner circle associated with the Ozero Dacha Cooperative.' All members became billionaires or senior officials after Putin took power.",
  "founding_members": ["Vladimir Putin", "Yury Kovalchuk", "Arkady Rotenberg", "Boris Rotenberg", "Nikolai Shamalov", "Vladimir Yakunin", "Andrei Fursenko", "Viktor Myachin"],
  "source_primary": "OFAC SDN designation March 2014 â explicitly references Ozero Dacha Cooperative as hub",
  "source_url": "https://home.treasury.gov/news/press-releases/jl23331",
  "source_type": "regulatory_filing",
  "source_date": "2014-03-20",
  "confidence": "high"
}
```

---

### Entity 15: Yury Valentinovich Kovalchuk

```json
{
  "entity_id": "PUT-015",
  "full_legal_name": "Yury Valentinovich Kovalchuk",
  "aliases": ["Yuri Kovalchuk", "Ð®.Ð. ÐÐ¾Ð²Ð°Ð»ÑÑÑÐº"],
  "entity_type": "individual",
  "jurisdiction": "Russia (St. Petersburg)",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN March 2014 â described as one of Putin's 'cashiers'",
    "EU": "Sanctioned",
    "UK": "Sanctioned"
  },
  "role": "Largest shareholder Bank Rossiya (~38%). Co-founder Ozero. Putin's personal banker. 'Number 2 in Russia' per journalist Mikhail Zygar 2022. Hosted wedding of Putin's daughter Tikhonova at his Igora ski resort 2013. Transferred $1B+ to offshore entity per Panama Papers.",
  "key_assets": ["Bank Rossiya (largest shareholder)", "National Media Group (controls REN-TV, Channel One, Channel Five, Izvestia)", "SOGAZ Insurance (acquired VK stake 2021)", "Igora ski resort", "Novy Svet vineyard Crimea"],
  "family": "Boris Kovalchuk (son) â Chairman of Russia's Accounts Chamber, appointed by Putin May 2024",
  "source_primary": "OFAC SDN designation March 2014 â Kovalchuk as one of Putin's cashiers",
  "source_url": "https://home.treasury.gov/news/press-releases/jl23331",
  "source_type": "regulatory_filing",
  "source_date": "2014-03-20",
  "confidence": "high",
  "additional_sources": [
    {"description": "Wikipedia â Kovalchuk full biography and holdings", "url": "https://en.wikipedia.org/wiki/Yury_Kovalchuk", "date": "2026-03-01"}
  ]
}
```

---

### Entity 16: National Media Group

```json
{
  "entity_id": "PUT-016",
  "full_legal_name": "National Media Group",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Yury Kovalchuk (OFAC SDN) via Bank Rossiya",
  "role": "Kovalchuk-controlled media holding created 2008. Controls: REN-TV, Channel One Russia (50%+), Channel Five, Izvestia newspaper. EU: 'actively supports Russian government policies of destabilisation of Ukraine.' In 2021 acquired VK (Russia's largest social network) stake from Usmanov via SOGAZ.",
  "source_primary": "Wikipedia â Kovalchuk biography, National Media Group creation 2008",
  "source_url": "https://en.wikipedia.org/wiki/Yury_Kovalchuk",
  "source_type": "news_investigation",
  "source_date": "2026-03-01",
  "confidence": "high"
}
```

---

### Entity 17: SOGAZ Insurance

```json
{
  "entity_id": "PUT-017",
  "full_legal_name": "SOGAZ Insurance Group",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Yury Kovalchuk (OFAC SDN) â part-owned via Bank Rossiya network",
  "role": "State-connected insurance group. In December 2021 acquired Alisher Usmanov's stake in VK (Russia's leading internet group) â transaction giving Kovalchuk/state control of Russia's largest social network.",
  "source_primary": "Wikipedia â Kovalchuk, SOGAZ acquisition of VK stake December 2021",
  "source_url": "https://en.wikipedia.org/wiki/Yury_Kovalchuk",
  "source_type": "news_investigation",
  "source_date": "2021-12-01",
  "confidence": "high"
}
```

---

### Entity 18: Igora Ski Resort

```json
{
  "entity_id": "PUT-018",
  "full_legal_name": "Igora Ski Resort (Ozon LLC)",
  "entity_type": "company",
  "jurisdiction": "Russia (Leningrad Oblast)",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Yury Kovalchuk (OFAC SDN)",
  "role": "Kovalchuk-owned ski resort. Hosted wedding of Putin's daughter Katerina Tikhonova to Kirill Shamalov 2013. Russian company Ozon holds title. Received $11.3M in loans from Roldugin network offshore companies at 1% interest 2009-onward per Panama Papers.",
  "panama_papers_connection": "Sandalwood Continental gave loans to Ozon which owns Igora â linking Roldugin shell money to Putin family asset",
  "source_primary": "ICIJ Panama Papers â Sandalwood Continental loans to Ozon / Igora; Roldugin network",
  "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/",
  "source_type": "icij",
  "source_date": "2016-04-03",
  "confidence": "high"
}
```

---

### Entity 19: Boris Kovalchuk

```json
{
  "entity_id": "PUT-019",
  "full_legal_name": "Boris Yuryevich Kovalchuk",
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "role": "Son of Yury Kovalchuk (OFAC SDN). Appointed by Putin as Chairman of Russia's Accounts Chamber (constitutional audit body) May 2024. Previously chaired Inter RAO (major Russian energy export company). Former head of management company Investment Culture 2004-2006.",
  "significance": "Senior official in state financial oversight now. Family nepotism from Ozero network directly into constitutional role.",
  "source_primary": "Grokipedia â Kovalchuk biography citing Boris as son, Accounts Chamber appointment",
  "source_url": "https://grokipedia.com/page/Yury_Kovalchuk",
  "source_type": "news_investigation",
  "source_date": "2024-05-14",
  "confidence": "high"
}
```

---

### Entity 20: Arkady Romanovich Rotenberg

```json
{
  "entity_id": "PUT-020",
  "full_legal_name": "Arkady Romanovich Rotenberg",
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN March 2014 â Putin childhood judo training partner",
    "EU": "Sanctioned",
    "UK": "Sanctioned"
  },
  "role": "Putin childhood friend from judo class. Billionaire through state-sponsored construction projects, oil pipelines. Companies received $7B+ in state contracts 2013-2014.",
  "key_assets": ["Stroygazmontazh (state pipeline construction monopoly)", "SMP Bank (co-owned with brother Boris)"],
  "source_primary": "OFAC SDN designation March 2014 â Rotenberg as Putin childhood friend and beneficiary of state contracts",
  "source_url": "https://home.treasury.gov/news/press-releases/jl23331",
  "source_type": "regulatory_filing",
  "source_date": "2014-03-20",
  "confidence": "high"
}
```

---

### Entity 21: Boris Romanovich Rotenberg

```json
{
  "entity_id": "PUT-021",
  "full_legal_name": "Boris Romanovich Rotenberg",
  "entity_type": "individual",
  "jurisdiction": "Russia / Finland",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN March 2014",
    "EU": "Sanctioned",
    "UK": "Sanctioned"
  },
  "role": "Arkady Rotenberg's brother. Co-owner SMP Bank. Beneficiary of same Putin-linked state contract system.",
  "source_primary": "OFAC SDN designation March 2014",
  "source_url": "https://home.treasury.gov/news/press-releases/jl23331",
  "source_type": "regulatory_filing",
  "source_date": "2014-03-20",
  "confidence": "high"
}
```

---

### Entity 22: Stroygazmontazh

```json
{
  "entity_id": "PUT-022",
  "full_legal_name": "Stroygazmontazh",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Arkady Rotenberg (OFAC SDN)",
  "role": "Arkady Rotenberg's primary asset. State pipeline construction monopoly. Received billions in state contracts from Gazprom and other state companies after Putin took power.",
  "source_primary": "OFAC SDN designation â Rotenberg, Stroygazmontazh identified as primary asset",
  "source_url": "https://home.treasury.gov/news/press-releases/jl23331",
  "source_type": "regulatory_filing",
  "source_date": "2014-03-20",
  "confidence": "high"
}
```

---

### Entity 23: SMP Bank

```json
{
  "entity_id": "PUT-023",
  "full_legal_name": "SMP Bank",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Arkady Rotenberg (OFAC SDN) and Boris Rotenberg (OFAC SDN) â co-owners",
  "role": "Bank co-owned by both Rotenberg brothers. Primary banking vehicle for Rotenberg family wealth.",
  "source_primary": "OFAC SDN designation â Rotenberg brothers, SMP Bank identified",
  "source_url": "https://home.treasury.gov/news/press-releases/jl23331",
  "source_type": "regulatory_filing",
  "source_date": "2014-03-20",
  "confidence": "high"
}
```

---

### Entity 24: Nikolai Terentievich Shamalov

```json
{
  "entity_id": "PUT-024",
  "full_legal_name": "Nikolai Terentievich Shamalov",
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": true,
  "sanctions_details": {
    "EU": "Sanctioned â long-time acquaintance of Putin, benefits from Kremlin links",
    "UK": "Sanctioned"
  },
  "role": "Ozero Dacha Cooperative founding member. Bank Rossiya shareholder. Father of Kirill Shamalov (formerly married to Putin's daughter Katerina Tikhonova). Through Bank Rossiya became major investor in Crimea post-annexation.",
  "source_primary": "EU sanctions designation â Nikolai Shamalov as Putin associate",
  "source_url": "https://www.opensanctions.org/entities/Q4225547/",
  "source_type": "regulatory_filing",
  "source_date": "2022-03-01",
  "confidence": "high"
}
```

---

### Entity 25: Kirill Nikolaevich Shamalov

```json
{
  "entity_id": "PUT-025",
  "full_legal_name": "Kirill Nikolaevich Shamalov",
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "role": "Son of Nikolai Shamalov. Formerly married to Putin's daughter Katerina Tikhonova (divorced circa 2018). Borrowed ~$1.3B from Gazprombank in 2013 to acquire 21% of SIBUR (Russia's largest petrochemical company) worth at least $2B within a year. Classic insider enrichment pattern.",
  "sibur_stake": "Acquired 21% SIBUR for ~$1.3B borrowed, worth $2B+ within a year",
  "source_primary": "ICIJ Panama Papers â Kirill Shamalov SIBUR acquisition via Gazprombank loan",
  "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/",
  "source_type": "icij",
  "source_date": "2016-04-03",
  "confidence": "high"
}
```

---

### Entity 26: Vladimir Ivanovich Yakunin

```json
{
  "entity_id": "PUT-026",
  "full_legal_name": "Vladimir Ivanovich Yakunin",
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN March 2014",
    "EU": "Sanctioned",
    "UK": "Sanctioned"
  },
  "role": "Ozero Dacha Cooperative member. Former head of Russian Railways (state monopoly). Close confidant of Putin. Accompanied Putin on domestic and international visits. Co-founded Ozero on Putin's instructions.",
  "source_primary": "OFAC SDN designation March 2014 â Yakunin as Ozero member and Putin close confidant",
  "source_url": "https://home.treasury.gov/news/press-releases/jl23331",
  "source_type": "regulatory_filing",
  "source_date": "2014-03-20",
  "confidence": "high"
}
```

---

### TIER 5 â PUTIN DIRECT HOLDING VEHICLES AND PROXIES

---

### Entity 27: Ermira (Cyprus)

```json
{
  "entity_id": "PUT-027",
  "full_legal_name": "Ermira",
  "entity_type": "company",
  "jurisdiction": "Cyprus",
  "tier": 5,
  "risk_level": "critical",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "believed_beneficial_owner": "Vladimir Putin",
  "role": "Cyprus company identified by Proekt Media investigation as Putin's personal holding vehicle. In 2013 acquired 7.5% NMG shares for 76 million euros, sold three months later to Timchenko structures for 65.6M more. Managed by Waidelotte Directors (Cyprus firm that also manages Timchenko offshore structures).",
  "note": "Medium confidence â identified by Proekt Media investigative journalism, not confirmed in ICIJ leaked data. Warrants escalation.",
  "source_primary": "Proekt Media â Putin's secret Cyprus company Ermira investigation",
  "source_url": "https://www.proekt.media/en/guide-en/vladimir-putin-ermira-en/",
  "source_type": "news_investigation",
  "source_date": "2023-02-28",
  "confidence": "medium"
}
```

---

### Entity 28: Waidelotte Directors (Cyprus)

```json
{
  "entity_id": "PUT-028",
  "full_legal_name": "Waidelotte Directors",
  "entity_type": "company",
  "jurisdiction": "Cyprus",
  "tier": 5,
  "risk_level": "high",
  "sanctioned": false,
  "role": "Cyprus corporate services firm. Manages Ermira (believed Putin vehicle). Also manages offshore companies of Gennady Timchenko, Dmitry Medvedev's secret business empire (registered under classmate), and other St. Petersburg businessmen from Putin's inner circle.",
  "note": "Registered agent appearing across multiple Putin inner circle entities â classic registered agent risk signal.",
  "source_primary": "Proekt Media â Waidelotte Directors managing Ermira and Timchenko offshore structures",
  "source_url": "https://www.proekt.media/en/guide-en/vladimir-putin-ermira-en/",
  "source_type": "news_investigation",
  "source_date": "2023-02-28",
  "confidence": "medium"
}
```

---

### Entity 29: LLCInvest Network (100+ entities)

```json
{
  "entity_id": "PUT-029",
  "full_legal_name": "LLCInvest Network",
  "entity_type": "network",
  "jurisdiction": "Russia",
  "tier": 5,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "role": "Group of 100+ Russia-registered companies all using 'LLCInvest' in their name. Tied to Bank Rossiya. Some owned directly by Bank Rossiya, others by board members and shareholders (Kovalchuk, Krivonogikh). Some owned by lower-level Bank Rossiya employees as cover. Three LLCInvest companies own parcels of land around Putin's dacha complex northwest of St. Petersburg.",
  "note": "100+ entities. Not individually mapped here â requires OCCRP bulk data import. All are presumed OFAC 50% rule entities given Bank Rossiya (OFAC SDN) connection.",
  "source_primary": "OCCRP Russian Asset Tracker â LLCInvest network tied to Bank Rossiya and Putin dacha",
  "source_url": "https://www.occrp.org/en/project/russian-asset-tracker/mysterious-group-of-companies-tied-to-bank-rossiya-unites-billions-of-dollars-in-assets-connected-to-vladimir-putin",
  "source_type": "news_investigation",
  "source_date": "2023-01-01",
  "confidence": "high"
}
```

---

### TIER 6 â PUTIN FAMILY PROXIES

---

### Entity 30: Maria Vorontsova (Putin)

```json
{
  "entity_id": "PUT-030",
  "full_legal_name": "Maria Vladimirovna Vorontsova",
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "tier": 6,
  "risk_level": "high",
  "sanctioned": false,
  "role": "Putin's eldest daughter. Maintains low public profile. Investigative reports link her to influential positions in medical research and academia. Roldugin is her godfather.",
  "source_primary": "NGO Report â Putin profile, daughters named",
  "source_url": "https://ngoreport.org/sanctions-database/putin-vladimir-vladimirovich/",
  "source_type": "news_investigation",
  "source_date": "2024-08-16",
  "confidence": "high"
}
```

---

### Entity 31: Katerina Vladimirovna Tikhonova

```json
{
  "entity_id": "PUT-031",
  "full_legal_name": "Katerina Vladimirovna Tikhonova",
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "tier": 6,
  "risk_level": "high",
  "sanctioned": false,
  "role": "Putin's younger daughter. Runs Innopraktika technology foundation. Formerly married to Kirill Shamalov (Ozero network son). Wedding held at Kovalchuk's Igora resort 2013.",
  "source_primary": "ICIJ Panama Papers â Tikhonova referenced as Putin daughter married to Kirill Shamalov at Igora",
  "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/",
  "source_type": "icij",
  "source_date": "2016-04-03",
  "confidence": "high"
}
```

---

### Entity 32: Svetlana Krivonogikh

```json
{
  "entity_id": "PUT-032",
  "full_legal_name": "Svetlana Krivonogikh",
  "entity_type": "individual",
  "jurisdiction": "Russia / Monaco",
  "tier": 6,
  "risk_level": "high",
  "sanctioned": false,
  "role": "Reported to have personal relationship with Putin. Bank Rossiya shareholder. A $4M Monaco apartment was purchased through an offshore company for her per Pandora Papers.",
  "source_primary": "ICIJ Pandora Papers â $4M Monaco apartment purchased through offshore company for Krivonogikh",
  "source_url": "https://www.icij.org/investigations/pandora-papers/vladimir-putin-konstantin-ernst-russia-tv-offshore/",
  "source_type": "icij",
  "source_date": "2021-10-03",
  "confidence": "medium"
}
```

---

### Entity 33: Peter Kolbin

```json
{
  "entity_id": "PUT-033",
  "full_legal_name": "Peter Kolbin",
  "entity_type": "individual",
  "jurisdiction": "Russia (deceased, believed recent years)",
  "tier": 6,
  "risk_level": "high",
  "sanctioned": false,
  "role": "Putin childhood friend. US officials suspect Kolbin of holding hundreds of millions in assets for Putin. Connected to LTS Holdings (BVI â Cyprus) alongside Timchenko. Daughter Tatiana Kolbina became sole shareholder of LTS Holdings after restructuring during sanctions pressure.",
  "source_primary": "Washington Post â Pandora Papers, Peter Kolbin suspected Putin asset holder",
  "source_url": "https://www.washingtonpost.com/world/interactive/2021/us-russia-sanctions/",
  "source_type": "icij",
  "source_date": "2021-10-05",
  "confidence": "medium"
}
```

---

## SUBJECT 2: VLADIMIR POTANIN NETWORK

---

### Entity 34: Vladimir Olegovich Potanin

```json
{
  "entity_id": "POT-001",
  "full_legal_name": "Vladimir Olegovich Potanin",
  "aliases": ["Vladimir Potanin", "Ð.Ð. ÐÐ¾ÑÐ°Ð½Ð¸Ð½"],
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN December 15 2022 â E.O. 14024",
    "UK": "Sanctioned including Director Disqualification April 2025",
    "EU": "Sanctioned",
    "Canada": "Sanctioned",
    "NZ": "Sanctioned"
  },
  "source_primary": "OFAC SDN designation December 2022 â Potanin as oligarch and former Deputy PM",
  "source_url": "https://home.treasury.gov/news/press-releases/jy1163",
  "source_type": "regulatory_filing",
  "source_date": "2022-12-15",
  "confidence": "high"
}
```

---

### Entity 35: Interros

```json
{
  "entity_id": "POT-002",
  "full_legal_name": "Interros Company",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN December 2022 â owned/controlled by Potanin"
  },
  "role": "Potanin's primary holding company. Holds stakes in Norilsk Nickel, Rosa Khutor, Petrovaks Farm, and other major Russian assets. Designated alongside Potanin.",
  "source_primary": "OFAC SDN designation December 2022 â Interros designated as Potanin entity",
  "source_url": "https://home.treasury.gov/news/press-releases/jy1163",
  "source_type": "regulatory_filing",
  "source_date": "2022-12-15",
  "confidence": "high"
}
```

---

### Entity 36: Rosbank (Public Joint Stock Company)

```json
{
  "entity_id": "POT-003",
  "full_legal_name": "Public Joint Stock Company Rosbank",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN December 2022 â systemically important Russian bank acquired by Potanin",
    "UK": "Sanctioned",
    "Canada": "Sanctioned"
  },
  "role": "Potanin acquired Rosbank (formerly SociÃ©tÃ© GÃ©nÃ©rale subsidiary) in 2022. Russian Central Bank considers it systemically important. OFAC designated it alongside Potanin.",
  "source_primary": "OFAC â Rosbank designation December 2022 alongside Potanin",
  "source_url": "https://home.treasury.gov/news/press-releases/jy1163",
  "source_type": "regulatory_filing",
  "source_date": "2022-12-15",
  "confidence": "high"
}
```

---

### Entity 37: TCS Group Holding / Tinkoff Bank

```json
{
  "entity_id": "POT-004",
  "full_legal_name": "TCS Group Holding PLC",
  "aliases": ["Tinkoff Bank", "Ð¢Ð¸Ð½ÑÐºÐ¾ÑÑ"],
  "entity_type": "company",
  "jurisdiction": "Cyprus (redomiciling to Russia â Oktyabrsky Island SAR)",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "beneficial_owner": "Vladimir Potanin (OFAC SDN)",
  "role": "Potanin's major fintech/banking asset. TCS Group has been registered in Cyprus since 2006. Announced plans to redomicile to Russian internal offshore zone (Oktyabrsky Island in Kaliningrad) â one of at least 10 major Russian companies leaving Cyprus amid FBI investigation into sanctions evasion 2023.",
  "source_primary": "RBC Ukraine â Russian companies leaving Cyprus amid FBI investigation, TCS Group named",
  "source_url": "https://newsukraine.rbc.ua/news/russian-companies-fleeing-cyprus-amid-fbi-1702662921.html",
  "source_type": "news_investigation",
  "source_date": "2023-12-15",
  "confidence": "high"
}
```

---

### Entity 38: Norilsk Nickel (MMC Norilsk Nickel)

```json
{
  "entity_id": "POT-005",
  "full_legal_name": "MMC Norilsk Nickel PJSC",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": false,
  "note": "Norilsk Nickel was deliberately excluded from OFAC designation in December 2022 alongside Potanin â given its importance to global palladium and nickel supply. Potanin retains significant but not majority control post-delisting. Remains high risk as Potanin is primary controlling shareholder.",
  "role": "World's largest nickel and palladium producer. Potanin owns ~35% via Interros. SUAL (Len Blavatnik / Viktor Vekselberg) is second-largest shareholder. Vekselberg separately sanctioned.",
  "source_primary": "OFAC notification to Congress â Norilsk Nickel excluded from Potanin designation",
  "source_url": "https://www.jdsupra.com/legalnews/ofac-sanctions-potanin-interros-and-2830961/",
  "source_type": "regulatory_filing",
  "source_date": "2022-12-15",
  "confidence": "high"
}
```

---

### THE 2024 POTANIN EVASION SCHEME
### Tier 4 â All Seven Entities Formed/Designated After All ICIJ Datasets

---

### Entity 39: Paloma Foundation

```json
{
  "entity_id": "POT-006",
  "full_legal_name": "Paloma Foundation",
  "entity_type": "foundation",
  "jurisdiction": "Liechtenstein",
  "tier": 4,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "US_STATE": "Designated June 12 2024 â E.O. 14024",
    "OFAC": "Designated June 2024"
  },
  "role": "One of four Liechtenstein foundations used to hold Sentimare Enterprises Ltd on behalf of Potanin's minor children. Structure: Potanin â children as nominal owners of four foundations â foundations jointly own Sentimare Cyprus â Sentimare owns Picotin Holdings (Cyprus) and Sentimare Me (UAE).",
  "note": "Did not exist in any screening database before June 2024. Created specifically to evade Potanin's December 2022 OFAC designation by placing ownership in minor children's names via Liechtenstein foundation structures.",
  "source_primary": "US State Department designation press release June 12 2024 â Paloma Foundation named",
  "source_url": "https://www.miragenews.com/us-implements-new-measures-to-cripple-russias-1254551/",
  "source_type": "regulatory_filing",
  "source_date": "2024-06-12",
  "confidence": "high"
}
```

---

### Entity 40: Spero Foundation

```json
{
  "entity_id": "POT-007",
  "full_legal_name": "Spero Foundation",
  "entity_type": "foundation",
  "jurisdiction": "Liechtenstein",
  "tier": 4,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "US_STATE": "Designated June 12 2024",
    "OFAC": "Designated June 2024"
  },
  "role": "Second of four Liechtenstein foundations in Potanin minor children proxy structure. Jointly owns Sentimare Enterprises Ltd with Paloma, Natwin, and Cafar foundations.",
  "source_primary": "US State Department designation June 12 2024 â Spero Foundation named",
  "source_url": "https://www.miragenews.com/us-implements-new-measures-to-cripple-russias-1254551/",
  "source_type": "regulatory_filing",
  "source_date": "2024-06-12",
  "confidence": "high"
}
```

---

### Entity 41: Natwin Foundation

```json
{
  "entity_id": "POT-008",
  "full_legal_name": "Natwin Foundation",
  "entity_type": "foundation",
  "jurisdiction": "Liechtenstein",
  "tier": 4,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "US_STATE": "Designated June 12 2024",
    "OFAC": "Designated June 2024"
  },
  "role": "Third of four Liechtenstein foundations in Potanin minor children proxy structure.",
  "source_primary": "US State Department designation June 12 2024 â Natwin Foundation named",
  "source_url": "https://www.miragenews.com/us-implements-new-measures-to-cripple-russias-1254551/",
  "source_type": "regulatory_filing",
  "source_date": "2024-06-12",
  "confidence": "high"
}
```

---

### Entity 42: Cafar Foundation

```json
{
  "entity_id": "POT-009",
  "full_legal_name": "Cafar Foundation",
  "entity_type": "foundation",
  "jurisdiction": "Liechtenstein",
  "tier": 4,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "US_STATE": "Designated June 12 2024",
    "OFAC": "Designated June 2024"
  },
  "role": "Fourth of four Liechtenstein foundations in Potanin minor children proxy structure. Together Paloma, Spero, Natwin, Cafar equally own Sentimare Enterprises Ltd.",
  "source_primary": "US State Department designation June 12 2024 â Cafar Foundation named",
  "source_url": "https://www.miragenews.com/us-implements-new-measures-to-cripple-russias-1254551/",
  "source_type": "regulatory_filing",
  "source_date": "2024-06-12",
  "confidence": "high"
}
```

---

### Entity 43: Sentimare Enterprises Limited

```json
{
  "entity_id": "POT-010",
  "full_legal_name": "Sentimare Enterprises Limited",
  "entity_type": "company",
  "jurisdiction": "Cyprus",
  "tier": 4,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "US_STATE": "Designated June 12 2024",
    "OFAC": "Designated June 2024"
  },
  "role": "Cyprus holding entity. Previously directly owned by Potanin. Transferred to minor children's four Liechtenstein foundations. Wholly owns Picotin Holdings (Cyprus) and Sentimare Me (UAE). US State: 'Potanin retains control of the four foundations and thus control of Sentimare Enterprises Ltd.'",
  "structure": "Paloma + Spero + Natwin + Cafar (each 25%) â Sentimare Enterprises Cyprus â Picotin Holdings Cyprus + Sentimare Me UAE",
  "source_primary": "US State Department designation June 12 2024 â Sentimare Enterprises Ltd named, structure described",
  "source_url": "https://www.miragenews.com/us-implements-new-measures-to-cripple-russias-1254551/",
  "source_type": "regulatory_filing",
  "source_date": "2024-06-12",
  "confidence": "high"
}
```

---

### Entity 44: Picotin Holdings Limited

```json
{
  "entity_id": "POT-011",
  "full_legal_name": "Picotin Holdings Limited",
  "entity_type": "company",
  "jurisdiction": "Cyprus",
  "tier": 4,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "US_STATE": "Designated June 12 2024",
    "OFAC": "Designated June 2024 â OFAC-49485"
  },
  "role": "Cyprus entity wholly owned by Sentimare Enterprises Limited. Designated as part of Potanin evasion scheme. OpenSanctions confirmed: oc-companies-cy-he429542.",
  "opencorporates_id": "cy-he429542",
  "lei": "5493006ZW6IZDFO6HK39",
  "source_primary": "US State Department / OFAC designation June 2024 â OFAC ID 49485",
  "source_url": "https://www.opensanctions.org/entities/NK-5bHEDP5w389UXQ3zSjKpF5/",
  "source_type": "regulatory_filing",
  "source_date": "2024-06-12",
  "confidence": "high"
}
```

---

### Entity 45: Sentimare Me Limited

```json
{
  "entity_id": "POT-012",
  "full_legal_name": "Sentimare Me Limited",
  "entity_type": "company",
  "jurisdiction": "United Arab Emirates",
  "tier": 4,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "US_STATE": "Designated June 12 2024",
    "OFAC": "Designated June 2024"
  },
  "role": "UAE entity wholly owned by Sentimare Enterprises Limited. Third leg of Potanin evasion structure. UAE jurisdiction chosen for opacity and distance from Western enforcement.",
  "source_primary": "US State Department designation June 12 2024 â Sentimare Me Ltd named as UAE entity",
  "source_url": "https://www.miragenews.com/us-implements-new-measures-to-cripple-russias-1254551/",
  "source_type": "regulatory_filing",
  "source_date": "2024-06-12",
  "confidence": "high"
}
```

---

### Potanin Operating Assets (Tier 3)

---

### Entity 46: Interros Capital

```json
{
  "entity_id": "POT-013",
  "full_legal_name": "Interros Capital",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Vladimir Potanin (OFAC SDN) via Interros",
  "role": "Investment arm of Interros. Manages Potanin's portfolio investments across Russian economy.",
  "source_primary": "OpenSanctions â Potanin profile listing Interros Capital as associated entity",
  "source_url": "https://www.opensanctions.org/entities/Q739315/",
  "source_type": "regulatory_filing",
  "source_date": "2023-11-03",
  "confidence": "high"
}
```

---

### Entity 47: Rosa Khutor Ski Resort

```json
{
  "entity_id": "POT-014",
  "full_legal_name": "Rosa Khutor",
  "entity_type": "company",
  "jurisdiction": "Russia (Krasnaya Polyana, Sochi)",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Vladimir Potanin (OFAC SDN) via Interros",
  "role": "Major ski resort near Sochi. Owned by Interros / Potanin. One of Russia's most prominent alpine resorts.",
  "source_primary": "OpenSanctions â Potanin profile, Rosa Khutor listed as associated entity",
  "source_url": "https://www.opensanctions.org/entities/Q739315/",
  "source_type": "news_investigation",
  "source_date": "2023-11-03",
  "confidence": "high"
}
```

---

### Entity 48: Petrovaks Farm

```json
{
  "entity_id": "POT-015",
  "full_legal_name": "Petrovaks Farm",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Vladimir Potanin (OFAC SDN) via Interros",
  "role": "Pharmaceutical company in Potanin/Interros portfolio.",
  "source_primary": "OpenSanctions â Potanin profile, Petrovaks Farm listed",
  "source_url": "https://www.opensanctions.org/entities/Q739315/",
  "source_type": "news_investigation",
  "source_date": "2023-11-03",
  "confidence": "high"
}
```

---

## SUBJECT 3: OLEG DERIPASKA NETWORK

---

### Entity 49: Oleg Vladimirovich Deripaska

```json
{
  "entity_id": "DER-001",
  "full_legal_name": "Oleg Vladimirovich Deripaska",
  "aliases": ["ÐÐ»ÐµÐ³ ÐÐµÑÐ¸Ð¿Ð°ÑÐºÐ°"],
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN April 6 2018 â E.O. 13661 and E.O. 13662",
    "EU": "Sanctioned April 2022",
    "UK": "Sanctioned",
    "Australia": "Sanctioned",
    "Canada": "Sanctioned",
    "NZ": "Sanctioned"
  },
  "criminal_charges": "DOJ charged September 29 2022 â conspiracy to violate and evade US sanctions",
  "basis": "Acting on behalf of senior Russian government official. Operating in Russian energy sector.",
  "source_primary": "OFAC SDN designation April 6 2018",
  "source_url": "https://home.treasury.gov/news/press-releases/sm0338",
  "source_type": "regulatory_filing",
  "source_date": "2018-04-06",
  "confidence": "high"
}
```

---

### Entity 50: B-Finance Ltd.

```json
{
  "entity_id": "DER-002",
  "full_legal_name": "B-Finance Ltd.",
  "entity_type": "company",
  "jurisdiction": "British Virgin Islands",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN April 6 2018 â owned/controlled by Deripaska"
  },
  "role": "Primary BVI holding vehicle for Deripaska. Designated alongside Deripaska April 2018.",
  "source_primary": "OFAC SDN designation April 2018 â B-Finance Ltd. designated as Deripaska entity",
  "source_url": "https://home.treasury.gov/news/press-releases/sm0338",
  "source_type": "regulatory_filing",
  "source_date": "2018-04-06",
  "confidence": "high"
}
```

---

### Entity 51: Basic Element Limited

```json
{
  "entity_id": "DER-003",
  "full_legal_name": "Basic Element Limited",
  "entity_type": "company",
  "jurisdiction": "Jersey",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN April 6 2018 â private investment and management company for Deripaska"
  },
  "role": "Jersey-based private investment and management company for Deripaska's various business interests. Owns Russian Machines, GAZ Group, and other major assets. Designated April 2018.",
  "source_primary": "OFAC SDN designation April 2018 â Basic Element as Deripaska's management company",
  "source_url": "https://home.treasury.gov/news/press-releases/sm0338",
  "source_type": "regulatory_filing",
  "source_date": "2018-04-06",
  "confidence": "high"
}
```

---

### Entity 52: EN+ Group PLC

```json
{
  "entity_id": "DER-004",
  "full_legal_name": "EN+ Group PLC",
  "entity_type": "company",
  "jurisdiction": "Jersey (formerly LSE-listed)",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "note": "Delisted from OFAC SDN January 2019 after Barker Plan â Deripaska reduced stake from 70% to below 50%, new independent board installed. Deripaska remains personally sanctioned. Foreign persons still subject to secondary sanctions for significant transactions with Deripaska.",
  "role": "Major energy and aluminum holding company. Controls UC RUSAL. Deripaska's stake reduced to ~44.95% under Barker Plan. VTB Bank (Russian state-owned) acquired portion of released stake.",
  "source_primary": "OFAC notification to Congress â EN+ Group delisting terms, Barker Plan",
  "source_url": "https://home.treasury.gov/news/press-releases/sm576",
  "source_type": "regulatory_filing",
  "source_date": "2018-12-19",
  "confidence": "high"
}
```

---

### Entity 53: UC RUSAL PLC

```json
{
  "entity_id": "DER-005",
  "full_legal_name": "United Company RUSAL PLC",
  "aliases": ["UC Rusal", "Rusal"],
  "entity_type": "company",
  "jurisdiction": "Jersey (formerly listed)",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "note": "Delisted from OFAC SDN alongside EN+ January 2019. World's largest aluminum producer outside China. Responsible for 7% of global aluminum production at time of designation. Second-largest shareholder SUAL (Blavatnik / Vekselberg â Vekselberg separately sanctioned).",
  "source_primary": "OFAC SDN designation April 2018 â Rusal designated as EN+ / Deripaska entity",
  "source_url": "https://home.treasury.gov/news/press-releases/sm0338",
  "source_type": "regulatory_filing",
  "source_date": "2018-04-06",
  "confidence": "high"
}
```

---

### Entity 54: EuroSibEnergo JSC

```json
{
  "entity_id": "DER-006",
  "full_legal_name": "JSC EuroSibEnergo",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "note": "Delisted from OFAC SDN January 2019 alongside EN+ and Rusal. One of Russia's largest independent power companies, operates power plants producing ~9% of Russia's total electricity.",
  "source_primary": "OFAC designation April 2018 â EuroSibEnergo as Deripaska / EN+ entity",
  "source_url": "https://home.treasury.gov/news/press-releases/sm0338",
  "source_type": "regulatory_filing",
  "source_date": "2018-04-06",
  "confidence": "high"
}
```

---

### Entity 55: Russian Machines

```json
{
  "entity_id": "DER-007",
  "full_legal_name": "Russian Machines",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN April 6 2018 â owned/controlled by Deripaska and Basic Element"
  },
  "role": "Established to manage machinery assets of Basic Element Limited. Owns GAZ Group. Designated April 2018.",
  "source_primary": "OFAC SDN designation April 2018 â Russian Machines designated as Deripaska / Basic Element entity",
  "source_url": "https://home.treasury.gov/news/press-releases/sm0338",
  "source_type": "regulatory_filing",
  "source_date": "2018-04-06",
  "confidence": "high"
}
```

---

### Entity 56: GAZ Group

```json
{
  "entity_id": "DER-008",
  "full_legal_name": "GAZ Group",
  "entity_type": "company",
  "jurisdiction": "Russia (Nizhny Novgorod)",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN April 6 2018 â owned/controlled by Deripaska and Russian Machines",
    "EU": "Associated entity"
  },
  "role": "Major Russian automotive manufacturer. Owned by Russian Machines / Deripaska / Basic Element. Produces GAZelle vans, Ural trucks, buses. Designated April 2018.",
  "source_primary": "OFAC SDN designation April 2018 â GAZ Group designated",
  "source_url": "https://home.treasury.gov/news/press-releases/sm0338",
  "source_type": "regulatory_filing",
  "source_date": "2018-04-06",
  "confidence": "high"
}
```

---

### Entity 57: Military Industrial Company LLC

```json
{
  "entity_id": "DER-009",
  "full_legal_name": "Military Industrial Company LLC",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Oleg Deripaska (OFAC SDN) via concealment strategies",
  "role": "Major arms and military equipment provider to Russian armed forces. EU: 'Through concealment strategies, Deripaska remained involved in companies involved in the defence sector, such as the Military Industrial Company LLC.' Produces armored vehicles used in Ukraine war.",
  "source_primary": "OpenSanctions â EU designation citing Deripaska connection to Military Industrial Company via concealment",
  "source_url": "https://www.opensanctions.org/entities/Q315514/",
  "source_type": "regulatory_filing",
  "source_date": "2024-03-28",
  "confidence": "high"
}
```

---

### Entity 58: Arzamas Machine-Building Plant

```json
{
  "entity_id": "DER-010",
  "full_legal_name": "Arzamas Machine-Building Plant",
  "entity_type": "company",
  "jurisdiction": "Russia (Arzamas)",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Deripaska network via Military Industrial Company",
  "role": "Part of Military Industrial Company LLC. Manufactures BTR-80 amphibious armoured personnel carriers used by Russia in Ukraine. Direct link between Deripaska network and Russian war materiel production.",
  "source_primary": "OpenSanctions â EU designation citing Arzamas as part of Deripaska defense sector involvement",
  "source_url": "https://www.opensanctions.org/entities/Q315514/",
  "source_type": "regulatory_filing",
  "source_date": "2024-03-28",
  "confidence": "high"
}
```

---

### THE 2024 DERIPASKA EVASION SCHEME
### Tier 4 â All Four Entities Designated 2024, Created/Activated After Designation

---

### Entity 59: Dmitrii Aleksandrovich Beloglazov

```json
{
  "entity_id": "DER-011",
  "full_legal_name": "Dmitrii Aleksandrovich Beloglazov",
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "tier": 4,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "Designated May 14 2024 â E.O. 14024",
    "EU": "Designated June 28 2024 â 14th sanctions package"
  },
  "role": "Russian national. Owner of OOO Titul. In June 2023 coordinated with Deripaska to design scheme to sell Deripaska's frozen Strabag shares. Created AO Iliadis as OOO Titul subsidiary to acquire MKAO Rasperia â the entity holding those shares.",
  "source_primary": "US Treasury OFAC â Beloglazov designated May 14 2024, evasion scheme described",
  "source_url": "https://home.treasury.gov/news/press-releases/jy2337",
  "source_type": "regulatory_filing",
  "source_date": "2024-05-14",
  "confidence": "high"
}
```

---

### Entity 60: OOO Titul

```json
{
  "entity_id": "DER-012",
  "full_legal_name": "Obshchestvo S Ogranichennoi Otvetstvennostiu Titul (OOO Titul)",
  "aliases": ["LLC Titul", "OOO Titul"],
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 4,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "Designated May 14 2024",
    "EU": "Designated June 28 2024"
  },
  "role": "Russia-based financial services firm owned by Beloglazov. Created AO Iliadis as subsidiary to execute Deripaska Strabag share evasion scheme.",
  "source_primary": "US Treasury OFAC â OOO Titul designated May 14 2024",
  "source_url": "https://home.treasury.gov/news/press-releases/jy2337",
  "source_type": "regulatory_filing",
  "source_date": "2024-05-14",
  "confidence": "high"
}
```

---

### Entity 61: AO Iliadis (Aktsionernoe Obshchestvo Iliadis)

```json
{
  "entity_id": "DER-013",
  "full_legal_name": "Aktsionernoe Obshchestvo Iliadis",
  "aliases": ["AO Iliadis", "JSC Iliadis"],
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 4,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "Designated May 14 2024",
    "EU": "Designated June 28 2024"
  },
  "formation_date": "2023 â created within weeks of Beloglazov/Deripaska coordination",
  "role": "Created specifically as subsidiary of OOO Titul to acquire MKAO Rasperia Trading Limited. Entity did not exist before the evasion scheme was designed. Acquired Rasperia in early 2024 to hold Deripaska's frozen 28.5M Strabag SE shares.",
  "note": "Entity was formed after Potanin's 2022 designation specifically to execute this evasion scheme. Textbook new-entity-for-evasion pattern.",
  "source_primary": "US Treasury OFAC â AO Iliadis designated May 14 2024, formation described",
  "source_url": "https://home.treasury.gov/news/press-releases/jy2337",
  "source_type": "regulatory_filing",
  "source_date": "2024-05-14",
  "confidence": "high"
}
```

---

### Entity 62: MKAO Rasperia Trading Limited

```json
{
  "entity_id": "DER-014",
  "full_legal_name": "International Company Joint Stock Company Rasperia Trading Limited",
  "aliases": ["MKAO Rasperia Trading Limited", "Rasperia"],
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 4,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "Designated May 14 2024 â controlled by Iliadis",
    "EU": "Sanctioned â frozen Strabag shares"
  },
  "role": "Russia-based investment holding company. Holds 28.5 million Strabag SE shares (Austria) â frozen under EU sanctions. Deripaska's original Strabag stake vehicle. Acquired by Iliadis in early 2024 to enable supposed divestment. Raiffeisen Bank International attempted to buy Rasperia's Strabag stake â withdrew after US Treasury warning May 2024.",
  "strabag_connection": "Rasperia holds 28.5M frozen Strabag SE shares. Strabag excluded Rasperia from all General Meetings, removed Rasperia-delegated board member, reduced Rasperia stake below 25%.",
  "source_primary": "US Treasury OFAC â Rasperia designated May 14 2024; EU Council â 14th sanctions package June 28 2024",
  "source_url": "https://home.treasury.gov/news/press-releases/jy2337",
  "source_type": "regulatory_filing",
  "source_date": "2024-05-14",
  "confidence": "high",
  "additional_sources": [
    {"description": "EU Council press release â 14th sanctions package, Rasperia named", "url": "https://www.consilium.europa.eu/en/press/press-releases/2024/06/28/russia-s-war-of-aggression-against-ukraine-eu-lists-two-individuals-and-four-entities-for-circumventing-eu-sanctions-and-materially-supporting-the-russian-government/", "date": "2024-06-28"},
    {"description": "Strabag SE press release â confirmed Rasperia designation, company not affected", "url": "https://newsroom.strabag.com/en/press-releases/group/2024-05/us-sanctions-against-rasperia-and-iliadis-strabag-confirmed-in-its-course-of-strictest-sanctions-compliance", "date": "2024-05-14"}
  ]
}
```

---

### Entity 63: Strabag SE

```json
{
  "entity_id": "DER-015",
  "full_legal_name": "Strabag SE",
  "entity_type": "company",
  "jurisdiction": "Austria (Vienna Stock Exchange â STR)",
  "tier": 3,
  "risk_level": "medium",
  "sanctioned": false,
  "note": "Strabag itself is not sanctioned and not accused of wrongdoing. Flagged here because Rasperia (sanctioned) holds 28.5M frozen shares in Strabag. Any institution with Strabag exposure needs to understand the frozen Rasperia stake. Strabag has taken extensive steps to distance from Rasperia: excluded from General Meetings, board member removed, stake diluted below 25% via capital measure.",
  "source_primary": "Strabag SE press release May 2024 â company confirms Rasperia designation has no direct business impact",
  "source_url": "https://newsroom.strabag.com/en/press-releases/group/2024-05/us-sanctions-against-rasperia-and-iliadis-strabag-confirmed-in-its-course-of-strictest-sanctions-compliance",
  "source_type": "corporate_registry",
  "source_date": "2024-05-14",
  "confidence": "high"
}
```

---

### Entity 64: Raiffeisen Bank International

```json
{
  "entity_id": "DER-016",
  "full_legal_name": "Raiffeisen Bank International AG",
  "entity_type": "company",
  "jurisdiction": "Austria",
  "tier": 3,
  "risk_level": "medium",
  "sanctioned": false,
  "note": "Not sanctioned. Flagged because RBI announced acquisition of 28.5M Strabag shares from Rasperia (Deripaska vehicle) in March 2024. US Treasury warned RBI that its access to the US financial system could be restricted. RBI withdrew from deal May 8 2024 â 'unable to obtain the required comfort.' Compliance risk: any institution with RBI correspondent exposure was one step removed from a Deripaska share transfer.",
  "source_primary": "Polixis â US sanctions entities over Deripaska evasion scheme, RBI withdrawal described",
  "source_url": "https://polixis.com/news-and-press-releases/us-sanctions-entities-over-attempted-sanctions-evasion-scheme/",
  "source_type": "news_investigation",
  "source_date": "2024-05-14",
  "confidence": "high"
}
```

---

## SUBJECT 4: ROMAN ABRAMOVICH NETWORK

---

### Entity 65: Roman Arkadyevich Abramovich

```json
{
  "entity_id": "ABR-001",
  "full_legal_name": "Roman Arkadyevich Abramovich",
  "aliases": ["Ð Ð¾Ð¼Ð°Ð½ ÐÐ±ÑÐ°Ð¼Ð¾Ð²Ð¸Ñ"],
  "entity_type": "individual",
  "jurisdiction": "Russia / Israel / Portugal",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "UK": "Sanctioned March 10 2022 â asset freeze, travel ban",
    "EU": "Sanctioned March 2022",
    "OFAC": "NOT on SDN â US seized two aircraft but did not designate Abramovich personally",
    "note": "US approach: targeted assets (aircraft seizures) without full SDN designation"
  },
  "offshore_empire": "261 companies and trusts across Cyprus, BVI, Jersey per ICIJ Cyprus Confidential",
  "source_primary": "UK HM Treasury sanctioned Abramovich March 10 2022",
  "source_url": "https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets",
  "source_type": "regulatory_filing",
  "source_date": "2022-03-10",
  "confidence": "high"
}
```

---

### Entity 66: Greenleas International Holdings Ltd.

```json
{
  "entity_id": "ABR-002",
  "full_legal_name": "Greenleas International Holdings Ltd.",
  "entity_type": "company",
  "jurisdiction": "British Virgin Islands",
  "tier": 2,
  "risk_level": "critical",
  "sanctioned": false,
  "beneficial_owner": "Roman Abramovich (UK/EU sanctioned)",
  "role": "Primary BVI vehicle holding Abramovich's Evraz stake. On February 15 2022 â nine days before Russia invaded Ukraine â more than $1.7 billion worth of Evraz shares were transferred FROM Greenleas TO Abramovich personally. Also sold Yandex shares worth $61M+ in same week. Both transfers under active UK investigation.",
  "pre_invasion_transfer_date": "2022-02-15",
  "pre_invasion_transfer_value": "$1.7 billion in Evraz shares + $61M Yandex shares",
  "days_before_invasion": 9,
  "source_primary": "ICIJ Cyprus Confidential â Greenleas International Holdings Evraz transfer February 15 2022",
  "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-15/how-roman-abramovich-became-the-face-of-russian-wealth",
  "source_type": "icij",
  "source_date": "2023-11-15",
  "confidence": "high"
}
```

---

### Entity 67: Keygrove Holdings

```json
{
  "entity_id": "ABR-003",
  "full_legal_name": "Keygrove Holdings",
  "entity_type": "company",
  "jurisdiction": "British Virgin Islands",
  "tier": 2,
  "risk_level": "critical",
  "sanctioned": false,
  "beneficial_owner": "Roman Abramovich (UK/EU sanctioned)",
  "role": "BVI holding company owning multiple BVI firms that collectively channeled hundreds of millions into 200+ US and UK hedge funds. Returns from hedge fund investments allegedly used to bankroll Chelsea Football Club and other Abramovich assets. Ultimate beneficiary of these trusts was Abramovich â in 2022 his five children were listed as successors, apparent attempt to insulate wealth from sanctions.",
  "beneficiary_change": "2022 â children listed as successors from Abramovich sole beneficiary, apparent pre-sanctions restructuring",
  "source_primary": "BLiTZ â UK lawmakers probe Abramovich $1B tax evasion, Keygrove Holdings named",
  "source_url": "https://weeklyblitz.net/2025/03/18/uk-lawmakers-demand-probe-into-roman-abramovichs-alleged-1b-tax-evasion/",
  "source_type": "news_investigation",
  "source_date": "2025-03-17",
  "confidence": "high"
}
```

---

### Entity 68: Millhouse LLC

```json
{
  "entity_id": "ABR-004",
  "full_legal_name": "Millhouse LLC",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "beneficial_owner": "Roman Abramovich (UK/EU sanctioned)",
  "role": "Abramovich's primary Russian holding and investment vehicle. Manages his Russian portfolio including Evraz stake, Highland Gold, Norilsk Nickel stake, and real estate.",
  "source_primary": "TBIJ â Abramovich investigation, Millhouse identified as primary Russian vehicle",
  "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-15/how-roman-abramovich-became-the-face-of-russian-wealth",
  "source_type": "news_investigation",
  "source_date": "2023-11-15",
  "confidence": "high"
}
```

---

### Entity 69: MeritServus

```json
{
  "entity_id": "ABR-005",
  "full_legal_name": "MeritServus Limited",
  "entity_type": "company",
  "jurisdiction": "Cyprus",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "UK": "Sanctioned April 2023 after Cyprus Confidential investigation"
  },
  "role": "Cyprus-based financial services company. Administered the majority of Abramovich's 261+ offshore companies and trusts. Sanctioned UK April 2023 after ICIJ reporting on its role enabling oligarchs to hide and shield wealth from sanctions. Named Abramovich a 'high-risk client' per leaked files.",
  "source_primary": "ICIJ Cyprus Confidential â MeritServus as primary administrator of Abramovich offshore network, UK sanctions April 2023",
  "source_url": "https://www.cbn.com.cy/article/2023/11/15/743142/the-six-russian-oligarchs-mentioned-in-icijs-cyprus-confidential-report/",
  "source_type": "icij",
  "source_date": "2023-11-15",
  "confidence": "high"
}
```

---

### Entity 70: Cypcodirect

```json
{
  "entity_id": "ABR-006",
  "full_legal_name": "Cypcodirect",
  "entity_type": "company",
  "jurisdiction": "Cyprus",
  "tier": 7,
  "risk_level": "high",
  "sanctioned": false,
  "role": "Second Cyprus financial services provider that named Abramovich a 'high-risk client' per Cyprus Confidential files. Used alongside MeritServus for some Abramovich company administration.",
  "source_primary": "ICIJ Cyprus Confidential â Cypcodirect named Abramovich high-risk client",
  "source_url": "https://www.cbn.com.cy/article/2023/11/15/743142/the-six-russian-oligarchs-mentioned-in-icijs-cyprus-confidential-report/",
  "source_type": "icij",
  "source_date": "2023-11-15",
  "confidence": "high"
}
```

---

### Entity 71: Concord Management

```json
{
  "entity_id": "ABR-007",
  "full_legal_name": "Concord Management",
  "entity_type": "company",
  "jurisdiction": "USA (Tarrytown, New York)",
  "tier": 7,
  "risk_level": "high",
  "sanctioned": false,
  "role": "New York-based financial advisory firm. Facilitated Abramovich's use of shell companies in the Caribbean (BVI, Cayman) and an Austrian bank to invest billions in US hedge funds and private equity firms. Named in 2023 SEC lawsuit.",
  "source_primary": "DPL Surveillance â Abramovich sanctions impact article citing Concord Management; BLiTZ citing 2023 SEC lawsuit against Concord",
  "source_url": "https://weeklyblitz.net/2025/03/18/uk-lawmakers-demand-probe-into-roman-abramovichs-alleged-1b-tax-evasion/",
  "source_type": "news_investigation",
  "source_date": "2023-01-01",
  "confidence": "high"
}
```

---

### Entity 72: Eugene Shvidler

```json
{
  "entity_id": "ABR-008",
  "full_legal_name": "Eugene Shvidler",
  "entity_type": "individual",
  "jurisdiction": "USA / UK (dual national)",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "UK": "Sanctioned March 24 2022 â financial ties to Abramovich, non-executive director of Evraz"
  },
  "role": "Abramovich's long-time right-hand man. US-UK dual national. Former President of Sibneft (sold to Gazprom for $13B 2005). Exercised full control over strategic financial decisions including the hedge fund investment network. UK resident â creates potential UK tax liability on all hedge fund returns managed by him for Abramovich. Brought legal case against UK government over sanctions designation 2023.",
  "loans_from_abramovich": "Received $500M+ in loans from Abramovich-linked entities per Cyprus Confidential â including loan for $300M Evraz investment",
  "source_primary": "UK HM Treasury â Shvidler designation March 24 2022; TBIJ investigation into Shvidler's role",
  "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-28/oligarch-claimed-no-financial-ties-to-roman-abramovich-despite-500m-loan",
  "source_type": "regulatory_filing",
  "source_date": "2022-03-24",
  "confidence": "high"
}
```

---

### Entity 73: Evraz PLC

```json
{
  "entity_id": "ABR-009",
  "full_legal_name": "Evraz PLC",
  "entity_type": "company",
  "jurisdiction": "UK (LSE â currently suspended)",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "beneficial_owners": "Roman Abramovich (UK/EU sanctioned), Alexander Abramov (sanctioned), Alexander Frolov (sanctioned)",
  "role": "Major Russian/UK steel producer. LSE-listed but trading suspended post-2022 sanctions. Abramovich holds ~29% as largest shareholder via Greenleas International (transferred to himself personally Feb 15 2022 â nine days before invasion).",
  "co_owners_sanctioned": "Both Alexander Abramov and Alexander Frolov are separately sanctioned as Evraz co-owners",
  "source_primary": "TBIJ / ICIJ Cyprus Confidential â Evraz Greenleas transfer; UK sanctions on Abramovich citing Evraz",
  "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-15/how-roman-abramovich-became-the-face-of-russian-wealth",
  "source_type": "icij",
  "source_date": "2023-11-15",
  "confidence": "high"
}
```

---

### Entity 74: Alexander Grigorievich Abramov

```json
{
  "entity_id": "ABR-010",
  "full_legal_name": "Alexander Grigorievich Abramov",
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "UK": "Sanctioned â Evraz co-owner",
    "EU": "Sanctioned"
  },
  "role": "Evraz co-owner alongside Abramovich. Named in ICIJ Cyprus Confidential as client of same Cyprus financial services firms as Abramovich. Steel magnate. Reference letter prepared for him by Cyprus firm days after US listed him as oligarch close to Putin.",
  "source_primary": "ICIJ Pandora Papers â Abramov as Cyprus Confidential client; UK sanctions",
  "source_url": "https://www.icij.org/investigations/pandora-papers/global-investigation-tax-havens-offshore/",
  "source_type": "icij",
  "source_date": "2021-10-03",
  "confidence": "high"
}
```

---

### Entity 75: Alexander Vladimirovich Frolov

```json
{
  "entity_id": "ABR-011",
  "full_legal_name": "Alexander Vladimirovich Frolov",
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "UK": "Sanctioned â Evraz co-owner and CEO"
  },
  "role": "Evraz CEO and co-owner. Third major Evraz shareholder alongside Abramovich and Abramov. All three sanctioned.",
  "source_primary": "TBIJ â Abramovich investigation citing Frolov as Evraz co-owner, UK sanctions",
  "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-28/oligarch-claimed-no-financial-ties-to-roman-abramovich-despite-500m-loan",
  "source_type": "regulatory_filing",
  "source_date": "2022-03-01",
  "confidence": "high"
}
```

---

### Entity 76: Highland Gold Mining

```json
{
  "entity_id": "ABR-012",
  "full_legal_name": "Highland Gold Mining Limited",
  "entity_type": "company",
  "jurisdiction": "UK (formerly AIM-listed)",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "beneficial_owner": "Roman Abramovich (UK/EU sanctioned) via Millhouse",
  "role": "Precious metals mining company. Abramovich held significant stake via Millhouse. Delisted from AIM post-sanctions.",
  "source_primary": "TBIJ â Abramovich investigation listing Highland Gold as part of portfolio",
  "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-15/how-roman-abramovich-became-the-face-of-russian-wealth",
  "source_type": "news_investigation",
  "source_date": "2023-11-15",
  "confidence": "high"
}
```

---

### Entity 77: Oyf Companies (Vitesse Arnhem connection)

```json
{
  "entity_id": "ABR-013",
  "full_legal_name": "Oyf companies (multiple unnamed)",
  "entity_type": "company_group",
  "jurisdiction": "Cyprus / offshore",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "beneficial_owner": "Roman Abramovich (UK/EU sanctioned) via MeritServus",
  "role": "Group of companies administered by MeritServus heavily linked to Abramovich. Used for various Millhouse-led investment projects including Evraz and Highland Gold. Also linked to Vitesse Arnhem FC (Dutch football club) â which during Abramovich's Chelsea ownership was referred to as 'Chelsea B' due to extensive player loans.",
  "vitesse_connection": "Leaked documents reveal Abramovich's ongoing connection to Vitesse Arnhem via Oyf companies even after official claim of no ownership",
  "source_primary": "TBIJ â Abramovich Vitesse connection via Oyf companies, MeritServus-administered",
  "source_url": "https://www.thebureauinvestigates.com/stories/2024-05-10/leaked-documents-reveal-abramovichs-ongoing-vitesse-connection",
  "source_type": "icij",
  "source_date": "2024-05-10",
  "confidence": "high"
}
```

---

### Entity 78: Sibneft (historical â $13B Gazprom sale)

```json
{
  "entity_id": "ABR-014",
  "full_legal_name": "Sibneft (OAO Sibneft)",
  "entity_type": "company",
  "jurisdiction": "Russia (dissolved â sold to Gazprom 2005)",
  "tier": 3,
  "risk_level": "medium",
  "sanctioned": false,
  "status": "dissolved â sold to Gazprom for $13B September 2005",
  "role": "Oil company that was Abramovich's primary asset through 1990s-2005. Sale proceeds of $13B seeded the entire current Abramovich offshore structure. Shvidler served as President of Sibneft. Transaction was widely described as example of insider enrichment under Putin.",
  "source_primary": "TBIJ â Abramovich investigation, Sibneft $13B sale mentioned as wealth source",
  "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-15/how-roman-abramovich-became-the-face-of-russian-wealth",
  "source_type": "news_investigation",
  "source_date": "2023-11-15",
  "confidence": "high"
}
```

---

## CROSS-NETWORK CONNECTIONS
### The findings that only emerge when all four networks are investigated simultaneously

---

### Entity 79: Abramovich â Roldugin Advertising Company Transfer

```json
{
  "entity_id": "CROSS-001",
  "full_legal_name": "Unnamed advertising company (stake transferred Abramovich â Roldugin)",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": false,
  "significance": "CROSS-NETWORK LINK â connects Abramovich network directly to Putin wallet network",
  "description": "ICIJ Cyprus Confidential reporting shows that Abramovich made a covert transfer of stakes in an advertising company to Sergey Roldugin (Putin's wallet). This creates a direct financial edge between the Abramovich network and the Putin wealth management network. Not in any commercial screening database as a cross-network relationship.",
  "source_primary": "ICIJ Cyprus Confidential â about page describing Abramovich to Roldugin advertising stake transfer",
  "source_url": "https://www.icij.org/investigations/cyprus-confidential/about-cyprus-confidential-investigation/",
  "source_type": "icij",
  "source_date": "2023-11-15",
  "confidence": "high"
}
```

---

### Entity 80: Gazprombank Zurich (Swiss banking node)

```json
{
  "entity_id": "CROSS-002",
  "full_legal_name": "Gazprombank AG (Zurich)",
  "entity_type": "company",
  "jurisdiction": "Switzerland (Zurich)",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "role": "Swiss arm of Gazprombank. Held accounts for Roldugin's shell companies (Namiral, Norma Group). Four Swiss banking executives indicted by Zurich prosecutors for failing to flag suspicious transactions linked to Roldugin/Putin wealth network. Managed by Swiss law firm Dietrich, Baumgartner & Partners (also serves Bank Rossiya interests).",
  "source_primary": "ICIJ â Swiss bank employees indicted for Roldugin Gazprombank accounts",
  "source_url": "https://www.icij.org/investigations/panama-papers/swiss-bank-employees-indicted-in-connection-to-russia-presidents-vast-fortunes/",
  "source_type": "icij",
  "source_date": "2023-03-02",
  "confidence": "high"
}
```

---

### Entity 81: Dietrich, Baumgartner & Partners (Zurich law firm)

```json
{
  "entity_id": "CROSS-003",
  "full_legal_name": "Dietrich, Baumgartner & Partners",
  "entity_type": "law_firm",
  "jurisdiction": "Switzerland (Zurich)",
  "tier": 7,
  "risk_level": "high",
  "sanctioned": false,
  "role": "Swiss law firm. Manages Namiral Trading (Cyprus) and Norma Group Ltd (BVI) â both Roldugin/Putin network entities. Also supports Bank Rossiya interests through Gazprombank Zurich. Professional enabler appearing at intersection of Putin wallet network and Swiss banking.",
  "source_primary": "Wikipedia â Sergei Roldugin, Dietrich Baumgartner as advisor to Roldugin entities",
  "source_url": "https://en.wikipedia.org/wiki/Sergei_Roldugin",
  "source_type": "news_investigation",
  "source_date": "2026-03-01",
  "confidence": "high"
}
```

---

### Entity 82: RCB Bank (Cyprus â VTB subsidiary)

```json
{
  "entity_id": "CROSS-004",
  "full_legal_name": "RCB Bank Ltd",
  "entity_type": "company",
  "jurisdiction": "Cyprus",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "note": "VTB Bank holds large stake. VTB Bank is OFAC SDN (designated February 2022). RCB Bank therefore warrants OFAC 50% rule assessment depending on VTB ownership percentage.",
  "role": "Cyprus bank. Large stake controlled by VTB Bank (OFAC SDN). Provided preferential loans to Sandalwood Continental (Roldugin/Putin network BVI shell). Banking node connecting Roldugin network to Cyprus financial system.",
  "source_primary": "OCCRP â Russia Banking on Influence, Sandalwood loans from RCB Bank (VTB subsidiary)",
  "source_url": "https://www.occrp.org/en/project/the-panama-papers/russia-banking-on-influence",
  "source_type": "icij",
  "source_date": "2016-04-03",
  "confidence": "high"
}
```

---

## SQL-READY ENTITY ARRAY â ALL 82 MAPPED ENTITIES

```json
{
  "investigation_id": "KATHAROS-2026-OLIGARCHS-001",
  "schema_version": "1.0",
  "investigation_date": "2026-03-15",
  "total_entities_mapped_in_file": 82,
  "total_entities_in_networks": 127,
  "note": "82 entities individually mapped with full provenance. Remaining ~45 entities are: LLCInvest network (100+ Russia entities per OCCRP â requires bulk data import, listed as one network node PUT-029), Rosbank subsidiaries (17 VTB-adjacent entities from OFAC December 2022 action), and Abramovich's 261 total companies (179 not individually named â require ICIJ Cyprus Confidential bulk data import). All are real entities. Bulk import path documented in gaps section.",
  "entities": [
    {"id": "PUT-001", "name": "Vladimir Vladimirovich Putin", "subject": "Putin", "tier": 1, "jurisdiction": "Russia", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets", "source_date": "2022-03-01", "confidence": "high"},
    {"id": "PUT-002", "name": "Sergei Pavlovich Roldugin", "subject": "Putin", "tier": 2, "jurisdiction": "Russia", "sanctioned": true, "source_type": "icij", "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/", "source_date": "2016-04-03", "confidence": "high"},
    {"id": "PUT-003", "name": "Sonnette Overseas", "subject": "Putin", "tier": 2, "jurisdiction": "BVI", "sanctioned": false, "ofac_50pct": true, "source_type": "icij", "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/", "source_date": "2016-04-03", "confidence": "high"},
    {"id": "PUT-004", "name": "International Media Overseas", "subject": "Putin", "tier": 2, "jurisdiction": "Panama", "sanctioned": false, "ofac_50pct": true, "source_type": "icij", "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/", "source_date": "2016-04-03", "confidence": "high"},
    {"id": "PUT-005", "name": "Sandalwood Continental", "subject": "Putin", "tier": 2, "jurisdiction": "BVI", "sanctioned": false, "ofac_50pct": true, "source_type": "icij", "source_url": "https://www.occrp.org/en/project/the-panama-papers/russia-banking-on-influence", "source_date": "2016-04-03", "confidence": "high"},
    {"id": "PUT-006", "name": "Sunbarn Limited", "subject": "Putin", "tier": 2, "jurisdiction": "BVI", "sanctioned": false, "ofac_50pct": true, "source_type": "icij", "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/", "source_date": "2016-04-03", "confidence": "high"},
    {"id": "PUT-007", "name": "Ove Financial Corp", "subject": "Putin", "tier": 2, "jurisdiction": "BVI", "sanctioned": false, "ofac_50pct": true, "source_type": "news_investigation", "source_url": "https://en.wikipedia.org/wiki/Sergei_Roldugin", "source_date": "2026-03-01", "confidence": "medium"},
    {"id": "PUT-008", "name": "Namiral Trading Ltd", "subject": "Putin", "tier": 2, "jurisdiction": "Cyprus", "sanctioned": false, "ofac_50pct": true, "source_type": "news_investigation", "source_url": "https://en.wikipedia.org/wiki/Sergei_Roldugin", "source_date": "2026-03-01", "confidence": "high"},
    {"id": "PUT-009", "name": "Norma Group Ltd", "subject": "Putin", "tier": 2, "jurisdiction": "BVI", "sanctioned": false, "ofac_50pct": true, "source_type": "news_investigation", "source_url": "https://en.wikipedia.org/wiki/Sergei_Roldugin", "source_date": "2026-03-01", "confidence": "high"},
    {"id": "PUT-010", "name": "Raytar", "subject": "Putin", "tier": 2, "jurisdiction": "Cyprus", "sanctioned": false, "ofac_50pct": true, "source_type": "icij", "source_url": "https://www.newsweek.com/panama-papers-what-scandal-how-putin-linked-443630", "source_date": "2016-06-02", "confidence": "high"},
    {"id": "PUT-011", "name": "Desmin Holdings", "subject": "Putin", "tier": 2, "jurisdiction": "Unknown", "sanctioned": false, "ofac_50pct": true, "source_type": "icij", "source_url": "https://www.occrp.org/en/project/the-panama-papers/the-secret-caretaker", "source_date": "2016-04-03", "confidence": "high"},
    {"id": "PUT-012", "name": "Tokido Holdings", "subject": "Putin", "tier": 2, "jurisdiction": "Unknown", "sanctioned": false, "ofac_50pct": true, "source_type": "icij", "source_url": "https://www.occrp.org/en/project/the-panama-papers/the-secret-caretaker", "source_date": "2016-04-03", "confidence": "high"},
    {"id": "PUT-013", "name": "Bank Rossiya", "subject": "Putin", "tier": 1, "jurisdiction": "Russia", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jl23331", "source_date": "2014-03-20", "confidence": "high"},
    {"id": "PUT-014", "name": "Ozero Dacha Cooperative", "subject": "Putin", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jl23331", "source_date": "2014-03-20", "confidence": "high"},
    {"id": "PUT-015", "name": "Yury Kovalchuk", "subject": "Putin", "tier": 3, "jurisdiction": "Russia", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jl23331", "source_date": "2014-03-20", "confidence": "high"},
    {"id": "PUT-016", "name": "National Media Group", "subject": "Putin", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "ofac_50pct": true, "source_type": "news_investigation", "source_url": "https://en.wikipedia.org/wiki/Yury_Kovalchuk", "source_date": "2026-03-01", "confidence": "high"},
    {"id": "PUT-017", "name": "SOGAZ Insurance", "subject": "Putin", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "ofac_50pct": true, "source_type": "news_investigation", "source_url": "https://en.wikipedia.org/wiki/Yury_Kovalchuk", "source_date": "2021-12-01", "confidence": "high"},
    {"id": "PUT-018", "name": "Igora Ski Resort (Ozon LLC)", "subject": "Putin", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "ofac_50pct": true, "source_type": "icij", "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/", "source_date": "2016-04-03", "confidence": "high"},
    {"id": "PUT-019", "name": "Boris Kovalchuk", "subject": "Putin", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "source_type": "news_investigation", "source_url": "https://grokipedia.com/page/Yury_Kovalchuk", "source_date": "2024-05-14", "confidence": "high"},
    {"id": "PUT-020", "name": "Arkady Rotenberg", "subject": "Putin", "tier": 3, "jurisdiction": "Russia", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jl23331", "source_date": "2014-03-20", "confidence": "high"},
    {"id": "PUT-021", "name": "Boris Rotenberg", "subject": "Putin", "tier": 3, "jurisdiction": "Russia/Finland", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jl23331", "source_date": "2014-03-20", "confidence": "high"},
    {"id": "PUT-022", "name": "Stroygazmontazh", "subject": "Putin", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "ofac_50pct": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jl23331", "source_date": "2014-03-20", "confidence": "high"},
    {"id": "PUT-023", "name": "SMP Bank", "subject": "Putin", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "ofac_50pct": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jl23331", "source_date": "2014-03-20", "confidence": "high"},
    {"id": "PUT-024", "name": "Nikolai Shamalov", "subject": "Putin", "tier": 3, "jurisdiction": "Russia", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://www.opensanctions.org/entities/Q4225547/", "source_date": "2022-03-01", "confidence": "high"},
    {"id": "PUT-025", "name": "Kirill Shamalov", "subject": "Putin", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "source_type": "icij", "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/", "source_date": "2016-04-03", "confidence": "high"},
    {"id": "PUT-026", "name": "Vladimir Yakunin", "subject": "Putin", "tier": 3, "jurisdiction": "Russia", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jl23331", "source_date": "2014-03-20", "confidence": "high"},
    {"id": "PUT-027", "name": "Ermira (Cyprus)", "subject": "Putin", "tier": 5, "jurisdiction": "Cyprus", "sanctioned": false, "source_type": "news_investigation", "source_url": "https://www.proekt.media/en/guide-en/vladimir-putin-ermira-en/", "source_date": "2023-02-28", "confidence": "medium"},
    {"id": "PUT-028", "name": "Waidelotte Directors", "subject": "Putin", "tier": 5, "jurisdiction": "Cyprus", "sanctioned": false, "source_type": "news_investigation", "source_url": "https://www.proekt.media/en/guide-en/vladimir-putin-ermira-en/", "source_date": "2023-02-28", "confidence": "medium"},
    {"id": "PUT-029", "name": "LLCInvest Network (100+ entities)", "subject": "Putin", "tier": 5, "jurisdiction": "Russia", "sanctioned": false, "note": "Represents 100+ individual Russia entities â requires OCCRP bulk import", "source_type": "news_investigation", "source_url": "https://www.occrp.org/en/project/russian-asset-tracker/mysterious-group-of-companies-tied-to-bank-rossiya-unites-billions-of-dollars-in-assets-connected-to-vladimir-putin", "source_date": "2023-01-01", "confidence": "high"},
    {"id": "PUT-030", "name": "Maria Vorontsova", "subject": "Putin", "tier": 6, "jurisdiction": "Russia", "sanctioned": false, "source_type": "news_investigation", "source_url": "https://ngoreport.org/sanctions-database/putin-vladimir-vladimirovich/", "source_date": "2024-08-16", "confidence": "high"},
    {"id": "PUT-031", "name": "Katerina Tikhonova", "subject": "Putin", "tier": 6, "jurisdiction": "Russia", "sanctioned": false, "source_type": "icij", "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/", "source_date": "2016-04-03", "confidence": "high"},
    {"id": "PUT-032", "name": "Svetlana Krivonogikh", "subject": "Putin", "tier": 6, "jurisdiction": "Russia/Monaco", "sanctioned": false, "source_type": "icij", "source_url": "https://www.icij.org/investigations/pandora-papers/vladimir-putin-konstantin-ernst-russia-tv-offshore/", "source_date": "2021-10-03", "confidence": "medium"},
    {"id": "PUT-033", "name": "Peter Kolbin", "subject": "Putin", "tier": 6, "jurisdiction": "Russia", "sanctioned": false, "source_type": "icij", "source_url": "https://www.washingtonpost.com/world/interactive/2021/us-russia-sanctions/", "source_date": "2021-10-05", "confidence": "medium"},
    {"id": "POT-001", "name": "Vladimir Potanin", "subject": "Potanin", "tier": 1, "jurisdiction": "Russia", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jy1163", "source_date": "2022-12-15", "confidence": "high"},
    {"id": "POT-002", "name": "Interros", "subject": "Potanin", "tier": 1, "jurisdiction": "Russia", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jy1163", "source_date": "2022-12-15", "confidence": "high"},
    {"id": "POT-003", "name": "Rosbank", "subject": "Potanin", "tier": 1, "jurisdiction": "Russia", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jy1163", "source_date": "2022-12-15", "confidence": "high"},
    {"id": "POT-004", "name": "TCS Group / Tinkoff Bank", "subject": "Potanin", "tier": 3, "jurisdiction": "Cyprus (redomiciling)", "sanctioned": false, "source_type": "news_investigation", "source_url": "https://newsukraine.rbc.ua/news/russian-companies-fleeing-cyprus-amid-fbi-1702662921.html", "source_date": "2023-12-15", "confidence": "high"},
    {"id": "POT-005", "name": "Norilsk Nickel", "subject": "Potanin", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "source_type": "regulatory_filing", "source_url": "https://www.jdsupra.com/legalnews/ofac-sanctions-potanin-interros-and-2830961/", "source_date": "2022-12-15", "confidence": "high"},
    {"id": "POT-006", "name": "Paloma Foundation", "subject": "Potanin", "tier": 4, "jurisdiction": "Liechtenstein", "sanctioned": true, "evasion_scheme": true, "source_type": "regulatory_filing", "source_url": "https://www.miragenews.com/us-implements-new-measures-to-cripple-russias-1254551/", "source_date": "2024-06-12", "confidence": "high"},
    {"id": "POT-007", "name": "Spero Foundation", "subject": "Potanin", "tier": 4, "jurisdiction": "Liechtenstein", "sanctioned": true, "evasion_scheme": true, "source_type": "regulatory_filing", "source_url": "https://www.miragenews.com/us-implements-new-measures-to-cripple-russias-1254551/", "source_date": "2024-06-12", "confidence": "high"},
    {"id": "POT-008", "name": "Natwin Foundation", "subject": "Potanin", "tier": 4, "jurisdiction": "Liechtenstein", "sanctioned": true, "evasion_scheme": true, "source_type": "regulatory_filing", "source_url": "https://www.miragenews.com/us-implements-new-measures-to-cripple-russias-1254551/", "source_date": "2024-06-12", "confidence": "high"},
    {"id": "POT-009", "name": "Cafar Foundation", "subject": "Potanin", "tier": 4, "jurisdiction": "Liechtenstein", "sanctioned": true, "evasion_scheme": true, "source_type": "regulatory_filing", "source_url": "https://www.miragenews.com/us-implements-new-measures-to-cripple-russias-1254551/", "source_date": "2024-06-12", "confidence": "high"},
    {"id": "POT-010", "name": "Sentimare Enterprises Ltd", "subject": "Potanin", "tier": 4, "jurisdiction": "Cyprus", "sanctioned": true, "evasion_scheme": true, "source_type": "regulatory_filing", "source_url": "https://www.miragenews.com/us-implements-new-measures-to-cripple-russias-1254551/", "source_date": "2024-06-12", "confidence": "high"},
    {"id": "POT-011", "name": "Picotin Holdings Ltd", "subject": "Potanin", "tier": 4, "jurisdiction": "Cyprus", "sanctioned": true, "ofac_id": "49485", "evasion_scheme": true, "source_type": "regulatory_filing", "source_url": "https://www.opensanctions.org/entities/NK-5bHEDP5w389UXQ3zSjKpF5/", "source_date": "2024-06-12", "confidence": "high"},
    {"id": "POT-012", "name": "Sentimare Me Ltd", "subject": "Potanin", "tier": 4, "jurisdiction": "UAE", "sanctioned": true, "evasion_scheme": true, "source_type": "regulatory_filing", "source_url": "https://www.miragenews.com/us-implements-new-measures-to-cripple-russias-1254551/", "source_date": "2024-06-12", "confidence": "high"},
    {"id": "POT-013", "name": "Interros Capital", "subject": "Potanin", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "ofac_50pct": true, "source_type": "regulatory_filing", "source_url": "https://www.opensanctions.org/entities/Q739315/", "source_date": "2023-11-03", "confidence": "high"},
    {"id": "POT-014", "name": "Rosa Khutor", "subject": "Potanin", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "ofac_50pct": true, "source_type": "news_investigation", "source_url": "https://www.opensanctions.org/entities/Q739315/", "source_date": "2023-11-03", "confidence": "high"},
    {"id": "POT-015", "name": "Petrovaks Farm", "subject": "Potanin", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "ofac_50pct": true, "source_type": "news_investigation", "source_url": "https://www.opensanctions.org/entities/Q739315/", "source_date": "2023-11-03", "confidence": "high"},
    {"id": "DER-001", "name": "Oleg Deripaska", "subject": "Deripaska", "tier": 1, "jurisdiction": "Russia", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/sm0338", "source_date": "2018-04-06", "confidence": "high"},
    {"id": "DER-002", "name": "B-Finance Ltd.", "subject": "Deripaska", "tier": 1, "jurisdiction": "BVI", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/sm0338", "source_date": "2018-04-06", "confidence": "high"},
    {"id": "DER-003", "name": "Basic Element Limited", "subject": "Deripaska", "tier": 1, "jurisdiction": "Jersey", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/sm0338", "source_date": "2018-04-06", "confidence": "high"},
    {"id": "DER-004", "name": "EN+ Group PLC", "subject": "Deripaska", "tier": 2, "jurisdiction": "Jersey", "sanctioned": false, "note": "Delisted from SDN January 2019 â Barker Plan", "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/sm576", "source_date": "2018-12-19", "confidence": "high"},
    {"id": "DER-005", "name": "UC RUSAL PLC", "subject": "Deripaska", "tier": 2, "jurisdiction": "Jersey", "sanctioned": false, "note": "Delisted from SDN January 2019", "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/sm0338", "source_date": "2018-04-06", "confidence": "high"},
    {"id": "DER-006", "name": "EuroSibEnergo JSC", "subject": "Deripaska", "tier": 2, "jurisdiction": "Russia", "sanctioned": false, "note": "Delisted from SDN January 2019", "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/sm0338", "source_date": "2018-04-06", "confidence": "high"},
    {"id": "DER-007", "name": "Russian Machines", "subject": "Deripaska", "tier": 1, "jurisdiction": "Russia", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/sm0338", "source_date": "2018-04-06", "confidence": "high"},
    {"id": "DER-008", "name": "GAZ Group", "subject": "Deripaska", "tier": 1, "jurisdiction": "Russia", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/sm0338", "source_date": "2018-04-06", "confidence": "high"},
    {"id": "DER-009", "name": "Military Industrial Company LLC", "subject": "Deripaska", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "ofac_50pct": true, "source_type": "regulatory_filing", "source_url": "https://www.opensanctions.org/entities/Q315514/", "source_date": "2024-03-28", "confidence": "high"},
    {"id": "DER-010", "name": "Arzamas Machine-Building Plant", "subject": "Deripaska", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "ofac_50pct": true, "source_type": "regulatory_filing", "source_url": "https://www.opensanctions.org/entities/Q315514/", "source_date": "2024-03-28", "confidence": "high"},
    {"id": "DER-011", "name": "Dmitrii Beloglazov", "subject": "Deripaska", "tier": 4, "jurisdiction": "Russia", "sanctioned": true, "evasion_scheme": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jy2337", "source_date": "2024-05-14", "confidence": "high"},
    {"id": "DER-012", "name": "OOO Titul", "subject": "Deripaska", "tier": 4, "jurisdiction": "Russia", "sanctioned": true, "evasion_scheme": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jy2337", "source_date": "2024-05-14", "confidence": "high"},
    {"id": "DER-013", "name": "AO Iliadis", "subject": "Deripaska", "tier": 4, "jurisdiction": "Russia", "sanctioned": true, "evasion_scheme": true, "formed_for_evasion": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jy2337", "source_date": "2024-05-14", "confidence": "high"},
    {"id": "DER-014", "name": "MKAO Rasperia Trading Limited", "subject": "Deripaska", "tier": 4, "jurisdiction": "Russia", "sanctioned": true, "evasion_scheme": true, "strabag_shares": 28500000, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jy2337", "source_date": "2024-05-14", "confidence": "high"},
    {"id": "DER-015", "name": "Strabag SE", "subject": "Deripaska", "tier": 3, "jurisdiction": "Austria", "sanctioned": false, "note": "Not sanctioned â flagged for frozen Rasperia stake", "source_type": "corporate_registry", "source_url": "https://newsroom.strabag.com/en/press-releases/group/2024-05/us-sanctions-against-rasperia-and-iliadis-strabag-confirmed-in-its-course-of-strictest-sanctions-compliance", "source_date": "2024-05-14", "confidence": "high"},
    {"id": "DER-016", "name": "Raiffeisen Bank International", "subject": "Deripaska", "tier": 3, "jurisdiction": "Austria", "sanctioned": false, "note": "Not sanctioned â attempted buyer, withdrew after US Treasury warning", "source_type": "news_investigation", "source_url": "https://polixis.com/news-and-press-releases/us-sanctions-entities-over-attempted-sanctions-evasion-scheme/", "source_date": "2024-05-14", "confidence": "high"},
    {"id": "ABR-001", "name": "Roman Abramovich", "subject": "Abramovich", "tier": 1, "jurisdiction": "Russia/Israel/Portugal", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets", "source_date": "2022-03-10", "confidence": "high"},
    {"id": "ABR-002", "name": "Greenleas International Holdings Ltd.", "subject": "Abramovich", "tier": 2, "jurisdiction": "BVI", "sanctioned": false, "pre_invasion_transfer": true, "transfer_date": "2022-02-15", "transfer_value_usd": 1700000000, "source_type": "icij", "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-15/how-roman-abramovich-became-the-face-of-russian-wealth", "source_date": "2023-11-15", "confidence": "high"},
    {"id": "ABR-003", "name": "Keygrove Holdings", "subject": "Abramovich", "tier": 2, "jurisdiction": "BVI", "sanctioned": false, "source_type": "news_investigation", "source_url": "https://weeklyblitz.net/2025/03/18/uk-lawmakers-demand-probe-into-roman-abramovichs-alleged-1b-tax-evasion/", "source_date": "2025-03-17", "confidence": "high"},
    {"id": "ABR-004", "name": "Millhouse LLC", "subject": "Abramovich", "tier": 2, "jurisdiction": "Russia", "sanctioned": false, "source_type": "news_investigation", "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-15/how-roman-abramovich-became-the-face-of-russian-wealth", "source_date": "2023-11-15", "confidence": "high"},
    {"id": "ABR-005", "name": "MeritServus", "subject": "Abramovich", "tier": 7, "jurisdiction": "Cyprus", "sanctioned": true, "source_type": "icij", "source_url": "https://www.cbn.com.cy/article/2023/11/15/743142/the-six-russian-oligarchs-mentioned-in-icijs-cyprus-confidential-report/", "source_date": "2023-11-15", "confidence": "high"},
    {"id": "ABR-006", "name": "Cypcodirect", "subject": "Abramovich", "tier": 7, "jurisdiction": "Cyprus", "sanctioned": false, "source_type": "icij", "source_url": "https://www.cbn.com.cy/article/2023/11/15/743142/the-six-russian-oligarchs-mentioned-in-icijs-cyprus-confidential-report/", "source_date": "2023-11-15", "confidence": "high"},
    {"id": "ABR-007", "name": "Concord Management", "subject": "Abramovich", "tier": 7, "jurisdiction": "USA", "sanctioned": false, "source_type": "news_investigation", "source_url": "https://weeklyblitz.net/2025/03/18/uk-lawmakers-demand-probe-into-roman-abramovichs-alleged-1b-tax-evasion/", "source_date": "2023-01-01", "confidence": "high"},
    {"id": "ABR-008", "name": "Eugene Shvidler", "subject": "Abramovich", "tier": 7, "jurisdiction": "USA/UK", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-28/oligarch-claimed-no-financial-ties-to-roman-abramovich-despite-500m-loan", "source_date": "2022-03-24", "confidence": "high"},
    {"id": "ABR-009", "name": "Evraz PLC", "subject": "Abramovich", "tier": 3, "jurisdiction": "UK", "sanctioned": false, "co_owners_sanctioned": true, "source_type": "icij", "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-15/how-roman-abramovich-became-the-face-of-russian-wealth", "source_date": "2023-11-15", "confidence": "high"},
    {"id": "ABR-010", "name": "Alexander Abramov", "subject": "Abramovich", "tier": 3, "jurisdiction": "Russia", "sanctioned": true, "source_type": "icij", "source_url": "https://www.icij.org/investigations/pandora-papers/global-investigation-tax-havens-offshore/", "source_date": "2021-10-03", "confidence": "high"},
    {"id": "ABR-011", "name": "Alexander Frolov", "subject": "Abramovich", "tier": 3, "jurisdiction": "Russia", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-28/oligarch-claimed-no-financial-ties-to-roman-abramovich-despite-500m-loan", "source_date": "2022-03-01", "confidence": "high"},
    {"id": "ABR-012", "name": "Highland Gold Mining", "subject": "Abramovich", "tier": 3, "jurisdiction": "UK", "sanctioned": false, "ofac_50pct": true, "source_type": "news_investigation", "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-15/how-roman-abramovich-became-the-face-of-russian-wealth", "source_date": "2023-11-15", "confidence": "high"},
    {"id": "ABR-013", "name": "Oyf companies", "subject": "Abramovich", "tier": 2, "jurisdiction": "Cyprus/offshore", "sanctioned": false, "source_type": "icij", "source_url": "https://www.thebureauinvestigates.com/stories/2024-05-10/leaked-documents-reveal-abramovichs-ongoing-vitesse-connection", "source_date": "2024-05-10", "confidence": "high"},
    {"id": "ABR-014", "name": "Sibneft (historical)", "subject": "Abramovich", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "status": "dissolved", "source_type": "news_investigation", "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-15/how-roman-abramovich-became-the-face-of-russian-wealth", "source_date": "2023-11-15", "confidence": "high"},
    {"id": "CROSS-001", "name": "AbramovichâRoldugin advertising stake", "subject": "Cross-network", "tier": 7, "jurisdiction": "Russia", "sanctioned": false, "cross_network": true, "networks_linked": ["Abramovich", "Putin"], "source_type": "icij", "source_url": "https://www.icij.org/investigations/cyprus-confidential/about-cyprus-confidential-investigation/", "source_date": "2023-11-15", "confidence": "high"},
    {"id": "CROSS-002", "name": "Gazprombank Zurich", "subject": "Cross-network", "tier": 3, "jurisdiction": "Switzerland", "sanctioned": false, "bankers_indicted": true, "source_type": "icij", "source_url": "https://www.icij.org/investigations/panama-papers/swiss-bank-employees-indicted-in-connection-to-russia-presidents-vast-fortunes/", "source_date": "2023-03-02", "confidence": "high"},
    {"id": "CROSS-003", "name": "Dietrich Baumgartner & Partners", "subject": "Cross-network", "tier": 7, "jurisdiction": "Switzerland", "sanctioned": false, "source_type": "news_investigation", "source_url": "https://en.wikipedia.org/wiki/Sergei_Roldugin", "source_date": "2026-03-01", "confidence": "high"},
    {"id": "CROSS-004", "name": "RCB Bank Cyprus", "subject": "Cross-network", "tier": 3, "jurisdiction": "Cyprus", "sanctioned": false, "vtb_connection": true, "source_type": "icij", "source_url": "https://www.occrp.org/en/project/the-panama-papers/russia-banking-on-influence", "source_date": "2016-04-03", "confidence": "high"}
  ],
  "gaps": [
    {"gap": "LLCInvest network â 100+ individual Russia entities not mapped", "resolution": "OCCRP Russian Asset Tracker bulk data import", "risk_if_unresolved": "medium"},
    {"gap": "Abramovich 261 companies â 179 not individually named", "resolution": "ICIJ Cyprus Confidential bulk data download from offshoreleaks.icij.org", "risk_if_unresolved": "medium"},
    {"gap": "Rosbank subsidiaries â 17 VTB-adjacent entities from December 2022 OFAC action not individually mapped", "resolution": "OFAC SDN bulk download, filter for Rosbank-related entries", "risk_if_unresolved": "medium"},
    {"gap": "Ermira Cyprus (PUT-027) â medium confidence, not confirmed in ICIJ leaked data", "resolution": "Cyprus corporate registry search for Ermira; Proekt Media follow-up", "risk_if_unresolved": "high"},
    {"gap": "Keygrove Holdings beneficial ownership structure â individual BVI sub-entities not named", "resolution": "ICIJ Cyprus Confidential bulk data; BVI corporate registry", "risk_if_unresolved": "medium"},
    {"gap": "Abramovich unnamed advertising company transferred to Roldugin (CROSS-001) â legal name not disclosed in public reporting", "resolution": "ICIJ full Cyprus Confidential document review; follow-up investigation", "risk_if_unresolved": "high"}
  ],
  "critical_findings": [
    {
      "finding": "Potanin 2024 evasion scheme â 7 new entities (Liechtenstein/Cyprus/UAE) created to hold assets in minor children's names via foundation proxies",
      "why_screening_misses_it": "All 7 entities formed/designated after all ICIJ datasets. Not in any screening database before June 2024. Child-proxy structure invisible to standard beneficial owner screening.",
      "compliance_risk": "Any institution with Potanin-adjacent exposure must now screen Paloma, Spero, Natwin, Cafar, Sentimare Enterprises, Picotin Holdings, and Sentimare Me as blocked persons",
      "source": "US State Department + OFAC designation June 12 2024"
    },
    {
      "finding": "Deripaska 2024 evasion scheme â AO Iliadis created specifically after designation to acquire Rasperia and transfer frozen Strabag shares",
      "why_screening_misses_it": "Iliadis did not exist before the evasion scheme was designed. No screening database would flag a newly formed Russian financial services firm as a Deripaska vehicle.",
      "compliance_risk": "Any institution that processed the Rasperia-to-Iliadis share transfer would have facilitated a sanctioned person's evasion scheme. Raiffeisen walked away â institutions that didn't are exposed.",
      "source": "OFAC designation May 14 2024; EU Council June 28 2024"
    },
    {
      "finding": "Abramovich â Roldugin advertising company stake transfer",
      "why_screening_misses_it": "This cross-network edge does not exist as a queryable relationship in any commercial database. Only found by running both networks simultaneously.",
      "compliance_risk": "Any institution with Abramovich exposure also has indirect exposure to the Putin wallet network via this edge. Network contamination risk not visible in isolated screening.",
      "source": "ICIJ Cyprus Confidential November 2023"
    },
    {
      "finding": "Greenleas International Holdings $1.7B Evraz share transfer February 15 2022 â nine days before invasion",
      "why_screening_misses_it": "The transfer itself is in the ICIJ data but the timing (nine days pre-invasion) and its status as an active UK investigation are not surfaced by standard screening.",
      "compliance_risk": "Pre-sanctions asset movement under active investigation. Any institution that facilitated this transfer or currently holds Evraz shares may have compliance exposure.",
      "source": "ICIJ Cyprus Confidential November 2023"
    },
    {
      "finding": "Ozero Dacha Cooperative as organizational hub â all eight founding members became billionaires or senior officials after Putin took power",
      "why_screening_misses_it": "The cooperative itself is not a company and does not appear in corporate registries. The cross-member connections (Rotenbergs, Kovalchuk, Shamalov, Yakunin all linked through this single 1996 community) are invisible to entity-by-entity screening.",
      "compliance_risk": "Any institution with exposure to one Ozero member should be aware of all others. State contract risk, sanctions contagion risk, and reputational risk apply across the entire network.",
      "source": "OFAC SDN designation March 2014 â explicitly references Ozero as network hub"
    }
  ]
}
```

---

## ASSOCIATE ENTITIES â ADDED 2026-03-15

All entities below were researched and added as full individual records.
Previously referenced in descriptions only; now individually mapped with provenance.

---

### Entity 83: Oleg Gordin

```json
{
  "entity_id": "PUT-083",
  "full_legal_name": "Oleg Gordin",
  "entity_type": "individual",
  "jurisdiction": "Russia (St. Petersburg)",
  "dob": "unknown â no DOB in any public record including ICIJ offshore leaks database entry",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "role": "St. Petersburg businessman described in RCB Bank account opening form as having background in 'law enforcement agencies.' Owner on paper of Sandalwood Continental BVI from 2007 â the lynchpin entity of the entire Putin offshore network through which $2B+ was routed. Held power of attorney on Roldugin's company bank accounts. Roldugin's authorized representative in Sonnette Overseas and other companies alongside Plekhov. Co-owns LiRoss leasing company (33%) with Aleksander Plekhov â identified by Proekt Media as active Bank Rossiya sanctions evasion vehicle post-2014. Also owns St. Petersburg canal and river cruise tourism company. Proekt identifies him as an associate of Yury Kovalchuk.",
  "key_entities_controlled": ["Sandalwood Continental (BVI) â owner on paper", "LiRoss (33% stake, co-owned with Plekhov)"],
  "source_primary": "ICIJ Panama Papers â Gordin named as owner of Sandalwood Continental, Roldugin's authorized representative, background in law enforcement agencies per RCB bank form",
  "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/",
  "source_type": "icij",
  "source_date": "2016-04-03",
  "confidence": "high",
  "additional_sources": [
    {"description": "Meduza â Proekt Media report on LiRoss as Bank Rossiya sanctions evasion vehicle, Gordin as co-owner", "url": "https://meduza.io/en/feature/2019/04/03/a-new-report-asserts-that-a-russian-businessman-mentioned-in-the-panama-papers-is-helping-putin-associates-get-around-u-s-sanctions", "date": "2019-04-03"},
    {"description": "OCCRP â Secret Caretaker, Gordin and Plekhov as Rossiya Bank-affiliated representatives of Roldugin", "url": "https://www.occrp.org/en/project/the-panama-papers/the-secret-caretaker", "date": "2016-04-03"}
  ]
}
```

---

### Entity 84: Aleksander (Alexander) Grigorievich Plekhov

```json
{
  "entity_id": "PUT-084",
  "full_legal_name": "Aleksander Grigorievich Plekhov",
  "aliases": ["Alexander Plekhov", "Aleksandr Plekhov"],
  "entity_type": "individual",
  "jurisdiction": "Russia (St. Petersburg)",
  "dob": "1953-03-30",
  "pob": "St. Petersburg, Russia",
  "tier": 2,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "UK": "Sanctioned May 13 2022 â UK Sanctions List Ref RUS1459. 'Close friend of Putin.' Director of Vital Development Corporation JSC, described as carrying on business in a sector of strategic significance to the Government of Russia.",
    "OFAC": "Not designated as of investigation date",
    "EU": "Not designated as of investigation date"
  },
  "role": "Roldugin's legal representative in Sonnette Overseas BVI. Owner of Sunbarn Ltd BVI. With Gordin, stockholder of BVI companies Sandalwood Continental and Sunbarn. Owns Namiral Trading Ltd (Cyprus) and Norma Group Ltd (BVI) â together holding a combined ~20% stake in Video International, Russia's largest TV advertising firm, acquired via the Abramovich â Roldugin/Plekhov transfer. Co-owner LiRoss leasing company (33%) with Gordin â active Bank Rossiya sanctions evasion vehicle. Named by Swiss court as 'strawman' for Bank Rossiya alongside Roldugin. Co-founded Vital Development Corporation JSC in St. Petersburg scientific park established by Bank Rossiya-affiliated Regional Foundation for Scientific and Technological Development (led by Kovalchuk's partner Andrei Fursenko).",
  "key_entities": ["Sonnette Overseas BVI (Roldugin representative)", "Sunbarn Ltd BVI (owner)", "Namiral Trading Ltd Cyprus (owner)", "Norma Group Ltd BVI (owner)", "LiRoss (33% co-owner with Gordin)", "Vital Development Corporation JSC (director)"],
  "video_international_stake": "Namiral + Norma Group jointly hold ~20% stake. Received via Abramovich â Roldugin/Plekhov transfer. Both entities hold accounts at Gazprombank Zurich.",
  "source_primary": "UK HM Treasury Financial Sanctions Notice May 13 2022 â Plekhov designated RUS1459",
  "source_url": "https://www.bvifsc.vg/sites/default/files/2022-05-13_russia_notice.pdf",
  "source_type": "regulatory_filing",
  "source_date": "2022-05-13",
  "confidence": "high",
  "additional_sources": [
    {"description": "OCCRP â Secret Caretaker, Plekhov and Gordin as Rossiya Bank-affiliated Roldugin representatives", "url": "https://www.occrp.org/en/project/the-panama-papers/the-secret-caretaker", "date": "2016-04-03"},
    {"description": "TBIJ â Secret deal links Abramovich to Putin's wallet, Plekhov named as UK-sanctioned 'close friend of Putin', Namiral Trading in court documents", "url": "https://www.thebureauinvestigates.com/stories/2023-11-14/secret-deal-links-roman-abramovich-to-putins-wallet", "date": "2023-11-14"},
    {"description": "Meduza â Proekt Media report on LiRoss, Plekhov/Gordin as owners, sanctions evasion vehicle", "url": "https://meduza.io/en/feature/2019/04/03/a-new-report-asserts-that-a-russian-businessman-mentioned-in-the-panama-papers-is-helping-putin-associates-get-around-u-s-sanctions", "date": "2019-04-03"}
  ]
}
```

---

### Entity 85: Vital Development Corporation JSC

```json
{
  "entity_id": "PUT-085",
  "full_legal_name": "Vital Development Corporation JSC",
  "aliases": ["Vital Development", "ÐÐ ÐÐ¸ÑÐ°Ð» ÐÐµÐ²ÐµÐ»Ð¾Ð¿Ð¼ÐµÐ½Ñ ÐÐ¾ÑÐ¿Ð¾ÑÐµÐ¹ÑÐ½"],
  "entity_type": "company",
  "jurisdiction": "Russia (St. Petersburg)",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Aleksander Plekhov (UK sanctioned) as director",
  "role": "Biochemical company producing reagents for medical tests and COVID-19 testing kits. Founded by Plekhov in St. Petersburg scientific park established by Regional Foundation for Scientific and Technological Development â which was itself set up in collaboration with Bank Rossiya (OFAC SDN) and led by Andrei Fursenko (OFAC SDN). UK sanctions description: 'carrying on business in a sector of strategic significance and business of economic significance to the Government of Russia' and benefits from 'significant state patronage.' Active as of investigation date.",
  "source_primary": "UK Financial Sanctions Notice May 13 2022 â Vital Development Corporation named in Plekhov designation",
  "source_url": "https://www.bvifsc.vg/sites/default/files/2022-05-13_russia_notice.pdf",
  "source_type": "regulatory_filing",
  "source_date": "2022-05-13",
  "confidence": "high"
}
```

---

### Entity 86: LiRoss

```json
{
  "entity_id": "PUT-086",
  "full_legal_name": "LiRoss",
  "entity_type": "company",
  "jurisdiction": "Russia (St. Petersburg)",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owners": "Aleksander Plekhov (UK sanctioned, 33%), Oleg Gordin (33%)",
  "role": "Leasing operator offering technical and transport equipment for rent. Identified by Proekt Media 2019 as 'practically a part of' the Zest group, affiliated with Bank Rossiya (OFAC SDN). Shares identical telephone numbers and staff with both Zest and Rossiya Bank per Proekt. Separated from the official structure of Rossiya Bank and signed over to Plekhov and Gordin specifically because of the 2014 sanctions â enabling it to buy equipment abroad and collaborate with international companies without restrictions. Proekt: 'LiRoss helps Rossiya Bank avoid the effects of international sanctions.' Has received credit from Rossiya Bank using a building acquired from Mostostroy No. 6 as collateral. Active sanctions evasion vehicle.",
  "source_primary": "Meduza â Proekt Media April 2019 investigation naming LiRoss as active Bank Rossiya sanctions evasion vehicle",
  "source_url": "https://meduza.io/en/feature/2019/04/03/a-new-report-asserts-that-a-russian-businessman-mentioned-in-the-panama-papers-is-helping-putin-associates-get-around-u-s-sanctions",
  "source_type": "news_investigation",
  "source_date": "2019-04-03",
  "confidence": "high"
}
```

---

### Entity 87: Video International

```json
{
  "entity_id": "CROSS-005",
  "full_legal_name": "Video International",
  "aliases": ["ÐÐ¸Ð´ÐµÐ¾ ÐÐ½ÑÐµÑÐ½ÑÑÐ½Ð»"],
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "significance": "CROSS-NETWORK LINK â Abramovich â Roldugin/Plekhov transfer. Connects Abramovich network to Putin wallet network.",
  "role": "Russia's largest TV advertising brokerage firm at peak â commanded approximately 70% of Russia's TV advertising market. Co-founded by Mikhail Lesin (Putin's press minister, sanctioned). Abramovich secretly acquired a stake in Video International September 2003 â weeks after buying Chelsea FC. The stake was later sold to entities controlled by Roldugin and Plekhov (Namiral Trading + Norma Group), generating $30M in dividends and a $40M sale. Namiral Trading and Norma Group now hold a combined ~20% stake per court records and financial accounts reviewed by TBIJ. A Swiss court named Roldugin and Plekhov as 'strawmen' for Bank Rossiya in a case involving Video International.",
  "abramovich_stake_acquired": "September 2003",
  "transferred_to": "Roldugin and Plekhov entities (Namiral Trading Cyprus + Norma Group BVI)",
  "transfer_value": "$40M sale price + $30M dividends",
  "swiss_court": "Swiss court named Roldugin and Plekhov as Bank Rossiya strawmen in Video International case",
  "source_primary": "TBIJ â Secret deal links Abramovich to Putin's wallet â Video International named, stake transfer described",
  "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-14/secret-deal-links-roman-abramovich-to-putins-wallet",
  "source_type": "icij",
  "source_date": "2023-11-14",
  "confidence": "high"
}
```

---

### Entity 88: Mikhail Lvovich Shelomov

```json
{
  "entity_id": "PUT-088",
  "full_legal_name": "Mikhail Lvovich Shelomov",
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "dob": "unknown â not disclosed in UK sanctions notice or public record",
  "tier": 6,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "UK": "Sanctioned May 13 2022 â UK Sanctions List Ref RUS1375. 'First cousin, once removed, of President Vladimir Putin.' Via Akcept LLC is shareholder in Bank Rossiya, key stakeholder in National Media Group which supports Russian destabilisation policy. Associated with SOGAZ insurance (UK-sanctioned entity).",
    "OFAC": "NOT designated as of investigation date â significant gap",
    "EU": "NOT designated as of investigation date â significant gap"
  },
  "role": "Putin's first cousin once removed. Via Akcept LLC: 8.4% Bank Rossiya shareholder + 13.5% SOGAZ shareholder. In 2004 a Bank Rossiya subsidiary and Akcept jointly held 49.97% and 13.5% of SOGAZ respectively after a non-transparent acquisition from Gazprom. Akcept received $18M loan from Bank Rossiya network per OCCRP. Akcept shares employees with Binom JSC â the firm registered as owning 'Putin's Palace' in Gelendzhik. Hired in 2002 by state shipping company Sovcomflot at personal request of Igor Sechin. Akcept also became 50% co-owner of Igora Drive racetrack (near Putin's Igora ski resort). In 2024 purchased $7.85M French yacht and imported it to Russia in circumvention of sanctions. Separately purchased Western-made spare parts for private jet of Putin's reported companion Alina Kabaeva per investigative journalist Ezhov.",
  "note": "Not on OFAC SDN or EU list despite being Putin family, Bank Rossiya shareholder, and holding $1B+ in assets. One of the most significant OFAC gaps in the Putin network.",
  "key_entities": ["Akcept LLC (owner)", "Bank Rossiya (8.4% via Akcept)", "SOGAZ (13.5% via Akcept)", "Igora Drive (50% co-owner via Akcept)"],
  "source_primary": "UK HM Treasury Financial Sanctions Notice May 13 2022 â Shelomov designated RUS1375",
  "source_url": "https://www.bvifsc.vg/sites/default/files/2022-05-13_russia_notice.pdf",
  "source_type": "regulatory_filing",
  "source_date": "2022-05-13",
  "confidence": "high",
  "additional_sources": [
    {"description": "Gov.uk press release â UK sanctions shady Putin network, Shelomov named alongside Plekhov", "url": "https://s3.amazonaws.com/thegovernmentsays-files/content/180/1809787.html", "date": "2022-05-13"},
    {"description": "ACF / Anti-Corruption Foundation â Shelomov yacht purchase 2024, spare parts for Kabaeva jet", "url": "https://x.com/ACF_int/status/1815424489456627885", "date": "2024-07-23"},
    {"description": "OCCRP â Relative Wealth in Russia, Shelomov $573M assets, Akcept / Bank Rossiya / SOGAZ structure", "url": "https://www.occrp.org/en/putinandtheproxies/relative-wealth-in-russia/", "date": "2017-01-01"}
  ]
}
```

---

### Entity 89: Akcept LLC

```json
{
  "entity_id": "PUT-089",
  "full_legal_name": "Akcept LLC",
  "aliases": ["Accept LLC", "JSC Accept", "ÐÐÐ ÐÐºÑÐµÐ¿Ñ"],
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Mikhail Shelomov (UK sanctioned) â sole owner",
  "role": "Shelomov's primary holding vehicle. Via Akcept: 8.4% Bank Rossiya + 13.5% SOGAZ. Received $18M loan from Bank Rossiya network per OCCRP. Shares employees with Binom JSC (firm registered as owning 'Putin's Palace'). Co-owner of Igora Drive racetrack (50%). Operates in Russian financial services sector, described by UK as 'sector of strategic significance to the Government of Russia.'",
  "source_primary": "UK Financial Sanctions Notice May 13 2022 â Akcept LLC named as Shelomov's vehicle in RUS1375 designation",
  "source_url": "https://www.bvifsc.vg/sites/default/files/2022-05-13_russia_notice.pdf",
  "source_type": "regulatory_filing",
  "source_date": "2022-05-13",
  "confidence": "high",
  "additional_sources": [
    {"description": "OCCRP â Relative Wealth in Russia, Akcept's Bank Rossiya and SOGAZ stakes, $18M loan", "url": "https://www.occrp.org/en/putinandtheproxies/relative-wealth-in-russia/", "date": "2017-01-01"}
  ]
}
```

---

### Entity 90: Binom JSC

```json
{
  "entity_id": "PUT-090",
  "full_legal_name": "Binom JSC",
  "aliases": ["ÐÐ ÐÐ¸Ð½Ð¾Ð¼Ð¾", "Binom"],
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 5,
  "risk_level": "critical",
  "sanctioned": false,
  "role": "The firm registered as owning 'Putin's Palace' â the $1.3B Gelendzhik estate exposed by Navalny's Anti-Corruption Foundation. Shares employees with Shelomov's Akcept LLC per UK sanctions designation. Arkady Rotenberg later claimed himself as the palace's beneficiary January 2021. The employee-sharing link between Binom and Akcept was flagged by UK HM Treasury as a marker of the Shelomov â Putin network.",
  "putins_palace": "Registered owner of the Gelendzhik palace complex. Arkady Rotenberg later claimed beneficial ownership January 2021 (widely disbelieved as cover claim).",
  "source_primary": "UK Financial Sanctions Notice May 13 2022 â Binom JSC explicitly named as sharing employees with Shelomov's Akcept LLC",
  "source_url": "https://www.bvifsc.vg/sites/default/files/2022-05-13_russia_notice.pdf",
  "source_type": "regulatory_filing",
  "source_date": "2022-05-13",
  "confidence": "high"
}
```

---

### Entity 91: Andrei Alexandrovich Fursenko

```json
{
  "entity_id": "PUT-091",
  "full_legal_name": "Andrei Alexandrovich Fursenko",
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "dob": "1949-01-01",
  "pob": "Leningrad, Russia",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN March 20 2014 â designated as Russian government official, aide to the President of the Russian Federation since May 21 2012",
    "EU": "Sanctioned",
    "UK": "Sanctioned"
  },
  "role": "Ozero Dacha Cooperative co-founding member. Co-founder Bank Rossiya â participated in its 1991-1992 reconstruction from its original Soviet-era structure, alongside Yakunin and Kovalchuk. Worked with Kovalchuk at the Ioffe Physical Technical Institute in St. Petersburg through 1991. General Director of the Regional Foundation for Scientific and Technological Development of St. Petersburg 1994-2001 â the foundation established in collaboration with Bank Rossiya that provided the institutional base for Plekhov's Vital Development Corporation. Minister of Industry, Science and Technology / Minister of Education 2003-2012. Aide to President Putin since May 2012. Described as 'principal architect' of Russian science reform. Putin's neighbor at Komsomolskoye Lake in the 1990s before the cooperative was formally established.",
  "bank_rossiya_connection": "Co-founder of Bank Rossiya. The Regional Foundation he ran was established in collaboration with Bank Rossiya and provided the base for Plekhov's Vital Development.",
  "source_primary": "OFAC SDN designation March 20 2014 â Fursenko designated as Russian government official, aide to Putin",
  "source_url": "https://home.treasury.gov/news/press-releases/jl23331",
  "source_type": "regulatory_filing",
  "source_date": "2014-03-20",
  "confidence": "high",
  "additional_sources": [
    {"description": "OCCRP â Russia Banking on Influence, Fursenko as Bank Rossiya co-founder", "url": "https://www.occrp.org/en/project/the-panama-papers/russia-banking-on-influence", "date": "2016-04-03"},
    {"description": "Putin's List â Fursenko full biography and Bank Rossiya co-founding role", "url": "https://www.spisok-putina.org/en/personas/fursenko-2/", "date": "2022-01-01"},
    {"description": "Science/AAAS â Fursenko and Kovalchuk trained as physicists at same institute, both Ozero members", "url": "https://www.science.org/content/article/russias-science-reform-czar-us-sanctions-list", "date": "2014-03-20"}
  ]
}
```

---

### Entity 92: Viktor Myachin

```json
{
  "entity_id": "PUT-092",
  "full_legal_name": "Viktor Myachin",
  "entity_type": "individual",
  "jurisdiction": "Russia (St. Petersburg)",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "role": "Ozero Dacha Cooperative co-founding member. Original Bank Rossiya shareholder â among the businessmen who co-founded the Leningrad Association of Joint Ventures and whose member companies redeemed Bank Rossiya shares in December 1991 to restart the bank post-Soviet coup. Not individually sanctioned by any jurisdiction as of investigation date despite being an Ozero founding member and Bank Rossiya co-founder. All other primary Ozero co-founders are sanctioned.",
  "note": "Notable OFAC/EU/UK gap. Ozero founding member with identical network membership as Kovalchuk, Yakunin, and Fursenko who are all OFAC SDN.",
  "source_primary": "Wikipedia â Bank Rossiya, Myachin named as original 1991 shareholder via Leningrad Association of Joint Ventures",
  "source_url": "https://en.wikipedia.org/wiki/Rossiya_Bank",
  "source_type": "news_investigation",
  "source_date": "2026-03-01",
  "confidence": "high",
  "additional_sources": [
    {"description": "TAG24 â Putin's besties: Myachin named as Ozero founding member not yet sanctioned", "url": "https://www.tag24.com/topic/ukraine-conflict/putins-besties-six-key-players-sanctions-missed-out-on-2375622", "date": "2022-03-20"}
  ]
}
```

---

### Entity 93: Igor Arkadyevich Rotenberg

```json
{
  "entity_id": "PUT-093",
  "full_legal_name": "Igor Arkadyevich Rotenberg",
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "dob": "1973-05-09",
  "dob_note": "9 May 1973 per OFAC SDN list, Wikipedia Igor Rotenberg article, Putin's List, War and Sanctions Ukraine database. Conflicting source: Wikipedia Arkady Rotenberg article states '9 September 1974' â considered erroneous. 1973-05-09 used as authoritative per official sanctions lists.",
  "pob": "Leningrad (now St. Petersburg), Russia",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN April 6 2018 â E.O. 14024. Sanctioned due to financial ties to father Arkady Rotenberg (OFAC SDN 2014). US Senate PSI found that transfer of Arkady's companies to Igor was 'done solely to evade sanctions.'",
    "EU": "Sanctioned",
    "UK": "Sanctioned February 22 2022",
    "NZ": "Sanctioned",
    "Canada": "Sanctioned",
    "Australia": "Sanctioned"
  },
  "role": "Son of Arkady Rotenberg (OFAC SDN 2014). After Arkady was sanctioned in 2014, transferred to Igor: Mostotrest (major bridge/road construction company), TEK Mosenergo, Gazprom Drilling (Gazprom Bureniye), and TPS Real Estate (shopping mall developer). US Senate Permanent Subcommittee on Investigations found these transfers were done solely to evade sanctions. Igor was finally sanctioned himself April 2018 â four years after his father. Owner of RT-Invest Transport Systems (23.5%) â operator of Platon, Russia's monopolistic federal road toll system that earns 10.6B+ rubles/year from all trucks. Panama Papers identified Igor as UBO of Highland Business Group Limited (BVI) â managed by London attorney Mark Omelnitski of Markom Group, which 'intentionally structured ownership to be opaque in order to hide the identities of true beneficiaries.'",
  "platon_system": "Operator of Platon electronic toll collection monopoly via RT-Invest Transport Systems (23.5% stake). System introduced 2015 for all trucks over 12 tons on federal roads.",
  "markom_group": "London attorney Mark Omelnitski / Markom Group established and maintained Igor's shell companies including Highland Business Group BVI.",
  "source_primary": "OFAC SDN designation April 6 2018 â Igor Rotenberg sanctioned for financial ties to Arkady",
  "source_url": "https://home.treasury.gov/news/press-releases/sm0338",
  "source_type": "regulatory_filing",
  "source_date": "2018-04-06",
  "confidence": "high",
  "additional_sources": [
    {"description": "US Senate PSI report â transfer of Arkady's companies to Igor done solely to evade sanctions, Markom Group's role", "url": "https://www.govinfo.gov/content/pkg/GOVPUB-Y4_G74_9-PURL-gpo142344/pdf/GOVPUB-Y4_G74_9-PURL-gpo142344.pdf", "date": "2019-01-01"},
    {"description": "OpenSanctions â Igor Rotenberg, former owner Gazprom Drilling, shareholder Platon system", "url": "https://www.opensanctions.org/entities/Q18399315/", "date": "2024-03-28"},
    {"description": "Putin's List â Igor Rotenberg biography and asset list", "url": "https://www.spisok-putina.org/en/personas/rotenberg-8/", "date": "2022-01-01"}
  ]
}
```

---

### Entity 94: Highland Business Group Limited

```json
{
  "entity_id": "PUT-094",
  "full_legal_name": "Highland Business Group Limited",
  "entity_type": "company",
  "jurisdiction": "British Virgin Islands",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Igor Rotenberg (OFAC SDN 2018) â identified as UBO in Panama Papers email chain",
  "role": "BVI holding company identified as Igor Rotenberg's offshore vehicle in Panama Papers. Email chain obtained by US Senate PSI named Igor as UBO. Managed by Markom Group (London attorney Mark Omelnitski) who 'intentionally structured ownership to be opaque.' Bank closed all accounts associated with Markom Group after Senate PSI report. Milasi Engineering (Arkady's company) was transferred through this structure to Igor post-2014 sanctions.",
  "milasi_engineering_transfer": "Post-Arkady 2014 designation, Markom transferred Milasi Engineering ownership through this structure to Igor. Milasi Engineering transferred $124M+ from Arkady to Highland Ventures (Boris) in 2012-2013.",
  "source_primary": "US Senate PSI report â Highland Business Group identified as Igor Rotenberg BVI vehicle, Markom Group as manager",
  "source_url": "https://www.govinfo.gov/content/pkg/GOVPUB-Y4_G74_9-PURL-gpo142344/pdf/GOVPUB-Y4_G74_9-PURL-gpo142344.pdf",
  "source_type": "court_document",
  "source_date": "2019-01-01",
  "confidence": "high"
}
```

---

### Entity 95: Markom Group

```json
{
  "entity_id": "PUT-095",
  "full_legal_name": "Markom Group",
  "entity_type": "law_firm",
  "jurisdiction": "United Kingdom (London)",
  "tier": 7,
  "risk_level": "high",
  "sanctioned": false,
  "role": "London law firm operated by attorney Mark Omelnitski. Established and maintained shell companies for Arkady and Igor Rotenberg and art advisor Gregory Baltser. US Senate PSI: Markom 'intentionally structured [ownership] to be opaque in order to hide the identities of true beneficiaries.' Post-2014 sanctions, executed paperwork in July 2014 transferring Arkady's interest in Milasi Engineering to Igor. By summer 2015 began redomiciling most Rotenberg companies to Cyprus. Bank closed all accounts associated with Markom after Senate PSI findings.",
  "source_primary": "US Senate PSI report â Markom Group / Omelnitski role in Rotenberg shell company management and sanctions evasion",
  "source_url": "https://www.govinfo.gov/content/pkg/GOVPUB-Y4_G74_9-PURL-gpo142344/pdf/GOVPUB-Y4_G74_9-PURL-gpo142344.pdf",
  "source_type": "court_document",
  "source_date": "2019-01-01",
  "confidence": "high"
}
```

---

### Entity 96: Gennady Nikolaevich Timchenko

```json
{
  "entity_id": "PUT-096",
  "full_legal_name": "Gennady Nikolaevich Timchenko",
  "aliases": ["Gennadiy Timchenko", "Guennadi Timtchenko"],
  "entity_type": "individual",
  "jurisdiction": "Russia / Finland / Switzerland (Geneva)",
  "dob": "1952-11-09",
  "pob": "Leninakan, Armenia",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN March 20 2014 â E.O. 13661. 'Activities in the energy sector directly linked to Putin. Putin has investments in Gunvor and may have access to Gunvor funds.'",
    "EU": "Sanctioned",
    "UK": "Sanctioned February 22 2022"
  },
  "role": "Putin inner circle member. Co-founded Gunvor oil trading company with Swedish businessman TorbjÃ¶rn TÃ¶rnqvist 1997 â became one of world's largest commodity traders, handling a major share of Russian crude. Sold his Gunvor stake to TÃ¶rnqvist one day before US sanctions in March 2014. Co-founder Transoil oil company 2003. Via Volga Group holds stakes in Novatek (major gas producer) and Sibur Holding (petrochemicals). Shareholder in Bank Rossiya. Via Pandora Papers: co-owner of LTS Holdings (originally International Petroleum Products / IPP) alongside Peter Kolbin â transferred to Kolbin after 2014 designation.",
  "lts_holdings_chain": "LTS Holdings: Timchenko/Kolbin co-owned â transferred to Kolbin after Timchenko 2014 designation â Kolbin died 2018 â redomiciled Cyprus 2017 with Tatiana Kolbina as sole shareholder",
  "ofac_network_entities": ["Sven Olsson (individual)", "Avia Group Terminal LLC", "Transservice LLC", "Lerma Trading SA (Panama)", "LTS Holding Ltd.", "Maples SA", "Fentex Properties Ltd.", "White Seal Holdings (Cyprus)"],
  "source_primary": "OFAC SDN designation March 20 2014 â Timchenko designated, Putin linked to Gunvor",
  "source_url": "https://home.treasury.gov/news/press-releases/jl23331",
  "source_type": "regulatory_filing",
  "source_date": "2014-03-20",
  "confidence": "high",
  "additional_sources": [
    {"description": "ICIJ Pandora Papers â Timchenko and Kolbin offshore restructuring as sanctions hit, LTS Holdings transfer", "url": "https://www.icij.org/investigations/pandora-papers/as-the-west-takes-aim-with-russian-sanctions-heres-what-we-know-about-oligarchs-secret-finances/", "date": "2021-10-03"},
    {"description": "Wikipedia â Timchenko biography, Gunvor, Volga Group, Novatek, Sibur", "url": "https://en.wikipedia.org/wiki/Gennady_Timchenko", "date": "2026-03-01"}
  ]
}
```

---

### Entity 97: LTS Holdings Ltd.

```json
{
  "entity_id": "PUT-097",
  "full_legal_name": "LTS Holdings Ltd.",
  "aliases": ["LTS Holding Limited", "International Petroleum Products OY (IPP) â predecessor name"],
  "entity_type": "company",
  "jurisdiction": "Cyprus (redomiciled 2017 from BVI)",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "Designated 2015 â 'acting for or on behalf of' Timchenko"
  },
  "role": "Oil and investment holding company. Origins as International Petroleum Products OY (IPP) in Finland 1995, co-owned Timchenko/Kolbin network. In October 2003 Peter Kolbin became director. After Timchenko 2014 OFAC designation, Timchenko's stake transferred to Kolbin. Kolbin died 2018. In 2017 LTS Holdings redomiciled from BVI to Cyprus with Tatiana Kolbina (Kolbin's daughter) as sole shareholder â post-sanctions restructuring to insulate from OFAC 50% rule. Classic generational-transfer evasion structure.",
  "ownership_chain": "Timchenko + Kolbin (original) â Kolbin sole (post-2014 Timchenko designation) â Tatiana Kolbina sole (Cyprus redomicile 2017, post-Kolbin death 2018)",
  "source_primary": "OFAC â LTS Holdings designated 2015 as acting for or on behalf of Timchenko; Washington Post Pandora Papers â LTS Holdings Cyprus restructuring with Tatiana Kolbina as sole shareholder",
  "source_url": "https://www.washingtonpost.com/world/interactive/2021/us-russia-sanctions/",
  "source_type": "icij",
  "source_date": "2021-10-05",
  "confidence": "high"
}
```

---

### Entity 98: Tatiana Kolbina

```json
{
  "entity_id": "PUT-098",
  "full_legal_name": "Tatiana Kolbina",
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "dob": "unknown â not in public record",
  "tier": 6,
  "risk_level": "high",
  "sanctioned": false,
  "role": "Daughter of Peter Kolbin (Putin childhood friend, suspected Putin wallet). Became sole shareholder of LTS Holdings Ltd. when the company was redomiciled to Cyprus in 2017 during sanctions pressure on the Timchenko/Kolbin network. Peter Kolbin died 2018. Tatiana now holds as sole shareholder an OFAC-designated entity (LTS Holdings was designated 2015). OFAC 50% rule applies â any entity 50%+ owned by an SDN is itself a blocked person, regardless of who the current named owner is.",
  "note": "Not individually sanctioned. Holds sole ownership of OFAC-designated LTS Holdings. Textbook second-generation proxy structure post-principal death.",
  "source_primary": "Washington Post Pandora Papers October 2021 â Tatiana Kolbina named as sole shareholder of Cyprus-redomiciled LTS Holdings",
  "source_url": "https://www.washingtonpost.com/world/interactive/2021/us-russia-sanctions/",
  "source_type": "icij",
  "source_date": "2021-10-05",
  "confidence": "high"
}
```

---

## UPDATED SQL ENTITY ARRAY â ASSOCIATES ADDED (Entities 83-99)

The following entries extend the SQL array. Append to the main entities array above.

```json
[
  {"id": "PUT-083", "name": "Oleg Gordin", "subject": "Putin", "tier": 2, "jurisdiction": "Russia", "dob": "unknown", "sanctioned": false, "ofac_50pct": false, "source_type": "icij", "source_url": "https://www.icij.org/investigations/panama-papers/20160403-putin-russia-offshore-network/", "source_date": "2016-04-03", "confidence": "high"},
  {"id": "PUT-084", "name": "Aleksander Plekhov", "subject": "Putin", "tier": 2, "jurisdiction": "Russia", "dob": "1953-03-30", "sanctioned": true, "sanctions_ref": "UK RUS1459", "source_type": "regulatory_filing", "source_url": "https://www.bvifsc.vg/sites/default/files/2022-05-13_russia_notice.pdf", "source_date": "2022-05-13", "confidence": "high"},
  {"id": "PUT-085", "name": "Vital Development Corporation JSC", "subject": "Putin", "tier": 2, "jurisdiction": "Russia", "sanctioned": false, "ofac_50pct": true, "source_type": "regulatory_filing", "source_url": "https://www.bvifsc.vg/sites/default/files/2022-05-13_russia_notice.pdf", "source_date": "2022-05-13", "confidence": "high"},
  {"id": "PUT-086", "name": "LiRoss", "subject": "Putin", "tier": 2, "jurisdiction": "Russia", "sanctioned": false, "ofac_50pct": true, "active_evasion_vehicle": true, "source_type": "news_investigation", "source_url": "https://meduza.io/en/feature/2019/04/03/a-new-report-asserts-that-a-russian-businessman-mentioned-in-the-panama-papers-is-helping-putin-associates-get-around-u-s-sanctions", "source_date": "2019-04-03", "confidence": "high"},
  {"id": "CROSS-005", "name": "Video International", "subject": "Cross-network", "tier": 3, "jurisdiction": "Russia", "sanctioned": false, "cross_network": true, "networks_linked": ["Abramovich", "Putin"], "source_type": "icij", "source_url": "https://www.thebureauinvestigates.com/stories/2023-11-14/secret-deal-links-roman-abramovich-to-putins-wallet", "source_date": "2023-11-14", "confidence": "high"},
  {"id": "PUT-088", "name": "Mikhail Shelomov", "subject": "Putin", "tier": 6, "jurisdiction": "Russia", "dob": "unknown", "sanctioned": true, "sanctions_ref": "UK RUS1375", "ofac_gap": true, "eu_gap": true, "source_type": "regulatory_filing", "source_url": "https://www.bvifsc.vg/sites/default/files/2022-05-13_russia_notice.pdf", "source_date": "2022-05-13", "confidence": "high"},
  {"id": "PUT-089", "name": "Akcept LLC", "subject": "Putin", "tier": 2, "jurisdiction": "Russia", "sanctioned": false, "ofac_50pct": true, "source_type": "regulatory_filing", "source_url": "https://www.bvifsc.vg/sites/default/files/2022-05-13_russia_notice.pdf", "source_date": "2022-05-13", "confidence": "high"},
  {"id": "PUT-090", "name": "Binom JSC", "subject": "Putin", "tier": 5, "jurisdiction": "Russia", "sanctioned": false, "putins_palace": true, "source_type": "regulatory_filing", "source_url": "https://www.bvifsc.vg/sites/default/files/2022-05-13_russia_notice.pdf", "source_date": "2022-05-13", "confidence": "high"},
  {"id": "PUT-091", "name": "Andrei Fursenko", "subject": "Putin", "tier": 3, "jurisdiction": "Russia", "dob": "1949-01-01", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jl23331", "source_date": "2014-03-20", "confidence": "high"},
  {"id": "PUT-092", "name": "Viktor Myachin", "subject": "Putin", "tier": 3, "jurisdiction": "Russia", "dob": "unknown", "sanctioned": false, "ozero_member": true, "ofac_gap": true, "source_type": "news_investigation", "source_url": "https://en.wikipedia.org/wiki/Rossiya_Bank", "source_date": "2026-03-01", "confidence": "high"},
  {"id": "PUT-093", "name": "Igor Rotenberg", "subject": "Putin", "tier": 3, "jurisdiction": "Russia", "dob": "1973-05-09", "dob_conflict_note": "One Wikipedia source states 1974-09-09; OFAC SDN and majority of sources confirm 1973-05-09", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/sm0338", "source_date": "2018-04-06", "confidence": "high"},
  {"id": "PUT-094", "name": "Highland Business Group Limited", "subject": "Putin", "tier": 3, "jurisdiction": "BVI", "sanctioned": false, "ofac_50pct": true, "source_type": "court_document", "source_url": "https://www.govinfo.gov/content/pkg/GOVPUB-Y4_G74_9-PURL-gpo142344/pdf/GOVPUB-Y4_G74_9-PURL-gpo142344.pdf", "source_date": "2019-01-01", "confidence": "high"},
  {"id": "PUT-095", "name": "Markom Group", "subject": "Putin", "tier": 7, "jurisdiction": "UK", "sanctioned": false, "source_type": "court_document", "source_url": "https://www.govinfo.gov/content/pkg/GOVPUB-Y4_G74_9-PURL-gpo142344/pdf/GOVPUB-Y4_G74_9-PURL-gpo142344.pdf", "source_date": "2019-01-01", "confidence": "high"},
  {"id": "PUT-096", "name": "Gennady Timchenko", "subject": "Putin", "tier": 3, "jurisdiction": "Russia/Finland/Switzerland", "dob": "1952-11-09", "sanctioned": true, "source_type": "regulatory_filing", "source_url": "https://home.treasury.gov/news/press-releases/jl23331", "source_date": "2014-03-20", "confidence": "high"},
  {"id": "PUT-097", "name": "LTS Holdings Ltd.", "subject": "Putin", "tier": 3, "jurisdiction": "Cyprus", "sanctioned": true, "source_type": "icij", "source_url": "https://www.washingtonpost.com/world/interactive/2021/us-russia-sanctions/", "source_date": "2021-10-05", "confidence": "high"},
  {"id": "PUT-098", "name": "Tatiana Kolbina", "subject": "Putin", "tier": 6, "jurisdiction": "Russia", "dob": "unknown", "sanctioned": false, "holds_ofac_designated_entity": true, "source_type": "icij", "source_url": "https://www.washingtonpost.com/world/interactive/2021/us-russia-sanctions/", "source_date": "2021-10-05", "confidence": "high"},
  {"id": "PUT-099", "name": "Liliya Rotenberg", "subject": "Putin", "tier": 3, "jurisdiction": "Russia/Germany", "dob": "1978-04-17", "sanctioned": true, "pre_designation_transfer": true, "received_tps_real_estate_8_days_before_igor_ofac": true, "source_type": "regulatory_filing", "source_url": "https://www.opensanctions.org/entities/Q63611067/", "source_date": "2022-04-08", "confidence": "high"}
]
```

---

### Entity 99: Liliya Arkadievna Rotenberg

```json
{
  "entity_id": "PUT-099",
  "full_legal_name": "Liliya Arkadievna Rotenberg",
  "aliases": ["Lilia Rotenberg", "Liliia Rotenberg", "Lilia Arkadievna Rotenberg"],
  "entity_type": "individual",
  "jurisdiction": "Russia / Germany",
  "dob": "1978-04-17",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "Designated under E.O. 14024 â as adult child of Arkady Rotenberg (OFAC SDN). Designated alongside other family members of Chemezov, Arkady and Boris Rotenberg, and Igor Shuvalov.",
    "UK": "Sanctioned â UK Sanctions List Ref RUS0804",
    "EU": "Sanctioned April 2022",
    "Canada": "Sanctioned",
    "NZ": "Sanctioned",
    "Australia": "Sanctioned"
  },
  "role": "Daughter of Arkady Rotenberg (OFAC SDN 2014). Sister of Igor Rotenberg (OFAC SDN 2018). Received Igor's 33.3% stake in TPS Real Estate Holdings Ltd. for $1 billion on March 29 2018 â precisely eight days before Igor was placed on OFAC SDN on April 6 2018. Russian reporting confirmed the transfer timing as deliberate pre-sanctions asset protection. Later also held assets transferred from Arkady. Lives in Germany. TPS Real Estate is one of Russia's largest commercial real estate developers, managing 12+ major shopping centers across Russia and Ukraine. Classic intra-family evasion chain: Arkady (2014 designation) â Igor (2015-2018) â Liliya (2018-present). All three now individually sanctioned.",
  "pre_designation_transfer_chain": "Arkady sanctioned 2014 â transferred Gazprom Drilling + Mostotrest + TPS Real Estate + TEK Mosenergo to Igor â Igor sanctioned 2018 â transferred TPS Real Estate $1B to Liliya 8 days before designation â Liliya sanctioned under E.O. 14024 family member provision",
  "tps_real_estate": "One of Russia's largest shopping center developers. Manages Krasnodar Gallery, Sochi Moremoll, Kiev Ocean Plaza, 12+ centers, 2M+ sq meters.",
  "source_primary": "OpenSanctions â Liliya Rotenberg, designated as adult child of Arkady Rotenberg under E.O. 14024",
  "source_url": "https://www.opensanctions.org/entities/Q63611067/",
  "source_type": "regulatory_filing",
  "source_date": "2022-04-08",
  "confidence": "high",
  "additional_sources": [
    {"description": "Wikipedia â Igor Rotenberg, sold TPS Real Estate stake to sister Liliya (b. 17 April 1978) for $1B on March 29 2018, 8 days before OFAC designation", "url": "https://en.wikipedia.org/wiki/Igor_Rotenberg", "date": "2026-03-01"},
    {"description": "The Insider â Privatization report, TPS Real Estate transfer chain Arkady â Igor â Liliya after sanctions", "url": "https://theins.ru/en/inv/287544", "date": "2025-12-08"}
  ]
}
```

---

*99 entities mapped through Pass 2. Pass 3 entities below (100â158).*

---

## PASS 3 NEW ENTITIES â 2026-03-15

Branch accounting applied per protocol. Entities below represent Pass 3 findings across all four networks. All are individually mapped with full provenance. Open branches from Pass 3 documented in PASS 3 SUMMARY at end of this section.

---

### TIMCHENKO NETWORK â PASS 3

---

### Entity 100: Sven Anders Olsson

```json
{
  "entity_id": "PUT-100",
  "full_legal_name": "Sven Anders Olsson",
  "entity_type": "individual",
  "jurisdiction": "Sweden / Cyprus",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN 2015 â acting for or on behalf of Timchenko network"
  },
  "role": "Timchenko's authorized representative. Board member of Gunvor Group Ltd. Board member of Volga Group. Board member of IPP Oil Products (Cyprus) Limited â Timchenko's holding company for the Finnish (IPP OY) and Geneva branches of International Petroleum Products. Resigned from Gunvor board April 2014 alongside Menikos Yiannakou and Emilios Kallenos after Timchenko OFAC designation.",
  "source_primary": "OFAC SDN designation 2015 â Sven Olsson named as acting for or on behalf of Timchenko network; SwissInfo reporting on IPP board roles",
  "source_url": "https://home.treasury.gov/news/press-releases/jl0314",
  "source_type": "regulatory_filing",
  "source_date": "2015-12-22",
  "confidence": "high",
  "branches_spawned": ["IPP Oil Products Cyprus Ltd", "Gunvor Group Ltd (board connection)", "Menikos Yiannakou (Gunvor board, resigned Apr 2014)", "Emilios Kallenos (Gunvor board, resigned Apr 2014)"],
  "branches_investigated": [],
  "branches_open": ["IPP Oil Products Cyprus Ltd", "Menikos Yiannakou", "Emilios Kallenos"]
}
```

---

### Entity 101: OOO Volga Group

```json
{
  "entity_id": "PUT-101",
  "full_legal_name": "OOO Volga Group",
  "aliases": ["Volga Group", "ÐÐÐ ÐÐ¾Ð»Ð³Ð° ÐÑÑÐ¿"],
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN April 2014 â owned/controlled by Timchenko. 'Investment strategy group that holds interest in a variety of assets on behalf of Timchenko.' Timchenko is sole shareholder.",
    "EU": "Sanctioned 2022 alongside Timchenko"
  },
  "role": "Timchenko's primary investment holding vehicle registered in Russia. Sole shareholder Timchenko. Through Volga Group, Timchenko controls/controlled: Transoil, Aquanika, Sakhatrans, Avia Group LLC, Avia Group Nord, Stroytransgaz Holding/Group/LLC, and major stakes in Novatek and Sibur. Renamed from Volga Resources Group (Luxembourg) to Volga Group (Russia) 2013.",
  "portfolio": ["Transoil (rail freight oil transport)", "Aquanika/Russkoye Vremya (mineral water)", "Sakhatrans (coal/iron ore terminal)", "Avia Group LLC (Sheremetyevo aviation)", "Avia Group Nord (Pulkovo aviation)", "Stroytransgaz Holding+Group+LLC (construction)", "Novatek stake", "Sibur stake"],
  "source_primary": "OFAC SDN April 2014 â Volga Group designated, Timchenko as sole shareholder described",
  "source_url": "https://home.treasury.gov/news/press-releases/jl2369",
  "source_type": "regulatory_filing",
  "source_date": "2014-04-28",
  "confidence": "high"
}
```

---

### Entity 102: Transoil

```json
{
  "entity_id": "PUT-102",
  "full_legal_name": "Transoil",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {"OFAC": "SDN April 2014 â owned/controlled by Volga Group and Timchenko"},
  "role": "Russia-based rail freight operator specializing in transportation of oil and oil products. Owned by Volga Group/Timchenko. One of Russia's largest oil-by-rail operators.",
  "source_primary": "OFAC designation April 2014",
  "source_url": "https://home.treasury.gov/news/press-releases/jl2369",
  "source_type": "regulatory_filing",
  "source_date": "2014-04-28",
  "confidence": "high"
}
```

---

### Entity 103: Aquanika (Russkoye Vremya LLC)

```json
{
  "entity_id": "PUT-103",
  "full_legal_name": "Aquanika (Russkoye Vremya LLC)",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {"OFAC": "SDN April 2014 â owned/controlled by Volga Group and Timchenko"},
  "role": "Russia-based mineral water and soft drink company. Produces drinks under the Aquanika trade name and others. Owned by Volga Group/Timchenko.",
  "source_primary": "OFAC designation April 2014",
  "source_url": "https://home.treasury.gov/news/press-releases/jl2369",
  "source_type": "regulatory_filing",
  "source_date": "2014-04-28",
  "confidence": "high"
}
```

---

### Entity 104: Sakhatrans LLC

```json
{
  "entity_id": "PUT-104",
  "full_legal_name": "Sakhatrans LLC",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {"OFAC": "SDN April 2014 â owned/controlled by Volga Group and Timchenko"},
  "role": "Transportation company building and operating bulk terminal for coal and iron ore exports in Muchka Bay near Vanino, Russia's far east. Owned by Volga Group/Timchenko.",
  "source_primary": "OFAC designation April 2014",
  "source_url": "https://home.treasury.gov/news/press-releases/jl2369",
  "source_type": "regulatory_filing",
  "source_date": "2014-04-28",
  "confidence": "high"
}
```

---

### Entity 105: Avia Group LLC

```json
{
  "entity_id": "PUT-105",
  "full_legal_name": "Avia Group LLC",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {"OFAC": "SDN April 2014 â owned/controlled by Volga Group and Timchenko"},
  "role": "Ground infrastructure for Business Aviation Center at Sheremetyevo International Airport, Moscow. Aircraft maintenance, storage, flight operations support. Owned by Volga Group/Timchenko.",
  "source_primary": "OFAC designation April 2014",
  "source_url": "https://home.treasury.gov/news/press-releases/jl2369",
  "source_type": "regulatory_filing",
  "source_date": "2014-04-28",
  "confidence": "high"
}
```

---

### Entity 106: Avia Group Nord LLC

```json
{
  "entity_id": "PUT-106",
  "full_legal_name": "Avia Group Nord LLC",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {"OFAC": "SDN April 2014 â owned/controlled by Volga Group and Timchenko"},
  "role": "Corporate aviation management services at Pulkovo International Airport, St. Petersburg. Owned by Volga Group/Timchenko.",
  "source_primary": "OFAC designation April 2014",
  "source_url": "https://home.treasury.gov/news/press-releases/jl2369",
  "source_type": "regulatory_filing",
  "source_date": "2014-04-28",
  "confidence": "high"
}
```

---

### Entity 107: Stroytransgaz Holding

```json
{
  "entity_id": "PUT-107",
  "full_legal_name": "Stroytransgaz Holding",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {"OFAC": "SDN April 2014 â owned/controlled by Volga Group and Timchenko"},
  "role": "Holding company for construction assets. Parent of Stroytransgaz Group and Stroytransgaz LLC. Owned by Volga Group/Timchenko.",
  "source_primary": "OFAC designation April 2014",
  "source_url": "https://home.treasury.gov/news/press-releases/jl2369",
  "source_type": "regulatory_filing",
  "source_date": "2014-04-28",
  "confidence": "high"
}
```

---

### Entity 108: Stroytransgaz Group

```json
{
  "entity_id": "PUT-108",
  "full_legal_name": "Stroytransgaz Group",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {"OFAC": "SDN April 2014 â owned/controlled by Volga Group and Timchenko"},
  "role": "Russian construction conglomerate comprising entities specializing in different construction industry aspects. Parent of Stroytransgaz LLC. Owned by Volga Group/Timchenko.",
  "source_primary": "OFAC designation April 2014",
  "source_url": "https://home.treasury.gov/news/press-releases/jl2369",
  "source_type": "regulatory_filing",
  "source_date": "2014-04-28",
  "confidence": "high"
}
```

---

### Entity 109: Stroytransgaz LLC

```json
{
  "entity_id": "PUT-109",
  "full_legal_name": "Stroytransgaz LLC",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {"OFAC": "SDN April 2014 â owned/controlled by Stroytransgaz Group, Volga Group, and Timchenko"},
  "role": "Infrastructure construction company. Subsidiary of Stroytransgaz Group. Owned by Volga Group/Timchenko. Received government contracts worth $40B+ for pipelines.",
  "source_primary": "OFAC designation April 2014",
  "source_url": "https://home.treasury.gov/news/press-releases/jl2369",
  "source_type": "regulatory_filing",
  "source_date": "2014-04-28",
  "confidence": "high"
}
```

---

### Entity 110: Seqouia Treuhand Trust Reg

```json
{
  "entity_id": "PUT-110",
  "full_legal_name": "Seqouia Treuhand Trust Reg",
  "entity_type": "company",
  "jurisdiction": "Liechtenstein",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "Designated 2023 â for assisting sanctioned Gennady Timchenko and his family"
  },
  "role": "Liechtenstein-based trust services company. OFAC designated 2023 for assisting Timchenko and his family. Managing director (Liechtenstein/Swiss dual national â name not in public record) personally managed some of Timchenko's properties AND some properties of separately-sanctioned Alisher Usmanov â cross-network node connecting Timchenko and Usmanov wealth management.",
  "cross_network_significance": "Shared trust administrator between Timchenko network and Usmanov network â indicates common enabler infrastructure across two major sanctioned oligarch networks.",
  "source_primary": "US Sanctions Regulations Blog â OFAC 2023 action targeting Seqouia Treuhand for assisting Timchenko",
  "source_url": "https://ussanctions.com/2023/04/12/u-s-sanctions-large-global-networks-of-russia-facilitators-and-evaders/",
  "source_type": "regulatory_filing",
  "source_date": "2023-04-12",
  "confidence": "high"
}
```

---

### BANK ROSSIYA SUB-ENTITIES â PASS 3

---

### Entity 111: CJSC Zest

```json
{
  "entity_id": "PUT-111",
  "full_legal_name": "CJSC Zest",
  "aliases": ["Zest"],
  "entity_type": "company",
  "jurisdiction": "Russia (St. Petersburg)",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {"OFAC": "SDN April 2014 â owned/controlled by Bank Rossiya (OFAC SDN)"},
  "role": "Bank Rossiya subsidiary. Proekt Media identified Zest group as directly affiliated with Bank Rossiya â LiRoss (Plekhov/Gordin sanctions evasion vehicle) described as 'practically a part of' the Zest group. Shares identical telephone numbers and staff with Bank Rossiya per Proekt. Active node in Bank Rossiya-controlled entity cluster in St. Petersburg.",
  "lirross_connection": "LiRoss described by Proekt as 'practically a part of' the Zest group â connecting the LiRoss evasion vehicle directly to this OFAC-designated entity",
  "source_primary": "OFAC designation April 2014 â Zest designated as Bank Rossiya subsidiary",
  "source_url": "https://home.treasury.gov/news/press-releases/jl2369",
  "source_type": "regulatory_filing",
  "source_date": "2014-04-28",
  "confidence": "high"
}
```

---

### Entity 112: JSB Sobinbank

```json
{
  "entity_id": "PUT-112",
  "full_legal_name": "JSB Sobinbank",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {"OFAC": "SDN April 2014 â owned/controlled by Bank Rossiya (OFAC SDN)"},
  "role": "Russian bank owned/controlled by Bank Rossiya. Designated April 2014.",
  "source_primary": "OFAC designation April 2014",
  "source_url": "https://home.treasury.gov/news/press-releases/jl2369",
  "source_type": "regulatory_filing",
  "source_date": "2014-04-28",
  "confidence": "high"
}
```

---

### Entity 113: Investment Company Abros LLC

```json
{
  "entity_id": "PUT-113",
  "full_legal_name": "Investment Company Abros LLC",
  "aliases": ["Abros", "ÐÐÐ ÐÐ½Ð²ÐµÑÑÐ¸ÑÐ¸Ð¾Ð½Ð½Ð°Ñ ÐºÐ¾Ð¼Ð¿Ð°Ð½Ð¸Ñ ÐÐÐ ÐÐ¡"],
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {"OFAC": "SDN April 2014 â owned/controlled by Bank Rossiya (OFAC SDN)"},
  "role": "Bank Rossiya investment subsidiary. In January 2005 ABRos (Abros) and Akcept (Shelomov) jointly held 49.97% and 13.5% of SOGAZ respectively after Gazprom sold its stake â the vehicle through which Bank Rossiya acquired SOGAZ insurance.",
  "sogaz_acquisition": "Abros and Shelomov's Akcept jointly acquired SOGAZ from Gazprom in non-transparent 2004 deal â Abros as Bank Rossiya vehicle, Akcept as Shelomov vehicle",
  "source_primary": "OFAC designation April 2014 â Abros designated as Bank Rossiya subsidiary; Wikipedia Bank Rossiya â SOGAZ acquisition detail",
  "source_url": "https://home.treasury.gov/news/press-releases/jl2369",
  "source_type": "regulatory_filing",
  "source_date": "2014-04-28",
  "confidence": "high"
}
```

---

### Entity 114: InvestCapitalBank

```json
{
  "entity_id": "PUT-114",
  "full_legal_name": "InvestCapitalBank",
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {"OFAC": "SDN April 2014 â controlled by Arkady and Boris Rotenberg (both OFAC SDN)"},
  "role": "Russian bank controlled by Arkady and Boris Rotenberg. Designated April 2014 alongside SMP Bank (already in file).",
  "source_primary": "OFAC designation April 2014 â InvestCapitalBank designated as Rotenberg-controlled",
  "source_url": "https://home.treasury.gov/news/press-releases/jl2369",
  "source_type": "regulatory_filing",
  "source_date": "2014-04-28",
  "confidence": "high"
}
```

---

### MORDASHOV NETWORK â PASS 3

---

### Entity 115: Alexei Alexandrovich Mordashov

```json
{
  "entity_id": "PUT-115",
  "full_legal_name": "Alexei Alexandrovich Mordashov",
  "aliases": ["Alexey Mordashov", "ÐÐ»ÐµÐºÑÐµÐ¹ ÐÐ¾ÑÐ´Ð°ÑÐ¾Ð²"],
  "entity_type": "individual",
  "jurisdiction": "Russia (Cherepovets)",
  "dob": "1965-09-26",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "EU": "Sanctioned February 28 2022",
    "UK": "Sanctioned 2022",
    "OFAC": "Sanctioned June 2022 â three companies + two children + Marina Mordashova designated alongside"
  },
  "role": "Russia's wealthiest person as of 2025 ($30.5B Forbes). Chairman and majority shareholder Severstal PAO. Multiple documented payment channels into Roldugin/Putin wallet network: Levens Trading gave Roldugin $6M loan forgiven for $1 (2007); Jabiru Consultants + Pearl Kite Trading paid Sunbarn $30M (2009-10); Dulston Ventures wired $830K to Roldugin-linked firm (2010). Severgroup holds 5.8% Bank Rossiya. Co-founded National Media Group with Kovalchuk (2008). Co-owns Tele2 Russia 50% with Kovalchuk. 6% Bank Rossiya shareholder directly in June 2013. Used PwC Cyprus as offshore structure administrator for 20+ years.",
  "roldugin_payments": [
    {"vehicle": "Levens Trading", "amount": "$6M loan forgiven for $1", "date": "2007", "recipient": "Sonnette Overseas (Roldugin)"},
    {"vehicle": "Jabiru Consultants + Pearl Kite Trading", "amount": "$30M consulting fees", "date": "2009-2010", "recipient": "Sunbarn Ltd (Gordin/Roldugin)"},
    {"vehicle": "Dulston Ventures", "amount": "$830K", "date": "2010", "recipient": "Roldugin-linked firm"}
  ],
  "source_primary": "ICIJ Pandora Papers â Mordashov offshore structure, PwC advisory role, Roldugin payment connections",
  "source_url": "https://www.icij.org/investigations/pandora-papers/mordashov-pwc-russia-richest-offshore/",
  "source_type": "icij",
  "source_date": "2021-10-03",
  "confidence": "high",
  "additional_sources": [
    {"description": "ICIJ â US sanctions Mordashov and Roldugin, Levens Trading $6M loan detail", "url": "https://www.icij.org/investigations/russia-archive/putin-allies-mordashov-and-roldugin-targeted-in-latest-round-of-us-sanctions/", "date": "2022-06-03"},
    {"description": "Wikipedia â Mordashov full biography, Bank Rossiya shareholding, National Media Group, Tele2", "url": "https://en.wikipedia.org/wiki/Alexei_Mordashov", "date": "2026-03-01"}
  ]
}
```

---

### Entity 116: Severstal PAO

```json
{
  "entity_id": "PUT-116",
  "full_legal_name": "Severstal PAO",
  "aliases": ["Severstal", "ÐÐÐ Ð¡ÐµÐ²ÐµÑÑÑÐ°Ð»Ñ"],
  "entity_type": "company",
  "jurisdiction": "Russia (Cherepovets)",
  "tier": 1,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Alexei Mordashov (sanctioned) via Severgroup LLC â majority shareholder",
  "role": "One of world's largest steel and mining companies. Mordashov is chairman and majority owner via Severgroup. Severstal steel products used in Russian armored vehicles per EU sanctions rationale. US company Severstal Columbus Holdings LLC administered through Mordashov's offshore network â PwC Cyprus helped maintain. Lady M yacht (213ft, Benetti 2011) seized by Italian police March 2022.",
  "source_primary": "EU sanctions designation citing Severstal revenues for Russian state and armored vehicle production",
  "source_url": "https://en.wikipedia.org/wiki/Alexei_Mordashov",
  "source_type": "news_investigation",
  "source_date": "2022-02-28",
  "confidence": "high"
}
```

---

### Entity 117: Severgroup LLC

```json
{
  "entity_id": "PUT-117",
  "full_legal_name": "Severgroup LLC",
  "aliases": ["S-Group", "Ð¡ÐµÐ²ÐµÑÑÑÐ°Ð»ÑÐ³ÑÑÐ¿Ð¿"],
  "entity_type": "company",
  "jurisdiction": "Russia",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Alexei Mordashov (OFAC SDN, EU/UK sanctioned)",
  "role": "Mordashov's primary Russian holding company. Holds Severstal majority stake. Holds 5.8% Bank Rossiya (per last available financial statement). Holds TUI Group stake via Unifirm arrangement. Previously held Nordgold stake transferred to Marina Mordashova.",
  "source_primary": "ICIJ Pandora Papers â Severgroup as Mordashov holding company with Bank Rossiya stake",
  "source_url": "https://www.icij.org/investigations/pandora-papers/mordashov-pwc-russia-richest-offshore/",
  "source_type": "icij",
  "source_date": "2021-10-03",
  "confidence": "high"
}
```

---

### Entity 118: Levens Trading

```json
{
  "entity_id": "PUT-118",
  "full_legal_name": "Levens Trading",
  "entity_type": "company",
  "jurisdiction": "Unknown (offshore)",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "beneficial_owner": "Mordashov group â owned 100% of Severstal Vtormet per Russian company register",
  "role": "Mordashov-connected offshore shell. In July 2007, Levens Trading made a $6 million loan to Roldugin's Sonnette Overseas at 2% annual interest. One month later, for a repayment of $1, Levens forgave the entire $6M debt. Classic fictitious transaction pattern to funnel money to Putin wallet network. OCCRP: Levens Trading owned 100% of Severstal Vtormet (scrap steel company) per Russian company register.",
  "roldugin_transaction": "$6M loan to Sonnette Overseas July 2007 â forgiven for $1 one month later",
  "source_primary": "OCCRP Secret Caretaker â Levens Trading as Mordashov-connected entity, $6M loan to Roldugin forgiven for $1",
  "source_url": "https://www.occrp.org/en/project/the-panama-papers/the-secret-caretaker",
  "source_type": "icij",
  "source_date": "2016-04-03",
  "confidence": "high"
}
```

---

### Entity 119: Marina Mordashova

```json
{
  "entity_id": "PUT-119",
  "full_legal_name": "Marina Mordashova",
  "entity_type": "individual",
  "jurisdiction": "Russia (Moscow)",
  "dob": "1979-01-01",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "Designated June 2022 alongside Mordashov as life partner",
    "EU": "Sanctioned June 3 2022 â described as Mordashov's wife"
  },
  "role": "Mordashov's life partner/wife. Received $2.5B+ in transferred assets via two BVI shell structures as Mordashov faced EU sanctions: Ondero Ltd (BVI) â controlling TUI Group 29.9% stake (~$1.4B), controlled through her Ranel Assets (BVI, set up 2018 per Pandora Papers). Also received Nordgold stake. Combined transferred value $2.5B+.",
  "source_primary": "ICIJ Pandora Papers â Marina Mordashova identified as Ondero controlling shareholder; EU/OFAC sanctions June 2022",
  "source_url": "https://www.icij.org/investigations/russia-archive/pandora-papers-shed-light-on-1-4-billion-russian-sanctions-mystery/",
  "source_type": "icij",
  "source_date": "2022-03-22",
  "confidence": "high"
}
```

---

### Entity 120: Ondero Ltd

```json
{
  "entity_id": "PUT-120",
  "full_legal_name": "Ondero Ltd",
  "entity_type": "company",
  "jurisdiction": "British Virgin Islands",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Marina Mordashova (OFAC/EU sanctioned) via Ranel Assets",
  "role": "BVI company that became 29.9% shareholder of TUI Group (Germany, ~$1.4B stake) when Mordashov transferred his Unifirm group to Ondero February/March 2022. TUI initially declared it did not know the identity of Ondero's true owner. ICIJ reporters identified Marina Mordashova as owner via Pandora Papers. Controlled through Ranel Assets (BVI, Marina Mordashova).",
  "tui_stake_value": "$1.4B approximately",
  "source_primary": "ICIJ Pandora Papers â Ondero Ltd identified as holding Mordashov's TUI stake, controlled by Marina Mordashova via Ranel Assets",
  "source_url": "https://www.icij.org/investigations/russia-archive/pandora-papers-shed-light-on-1-4-billion-russian-sanctions-mystery/",
  "source_type": "icij",
  "source_date": "2022-03-22",
  "confidence": "high"
}
```

---

### Entity 121: Ranel Assets

```json
{
  "entity_id": "PUT-121",
  "full_legal_name": "Ranel Assets",
  "entity_type": "company",
  "jurisdiction": "British Virgin Islands",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Marina Mordashova (OFAC/EU sanctioned)",
  "role": "BVI company set up 2018 per Pandora Papers. Controlled by Marina Mordashova. Parent company of Ondero Ltd. The ownership chain: Ranel Assets (Marina) â Ondero Ltd â 29.9% TUI Group.",
  "source_primary": "ICIJ Pandora Papers â Ranel Assets named as Marina Mordashova's vehicle, parent of Ondero",
  "source_url": "https://www.icij.org/investigations/russia-archive/pandora-papers-shed-light-on-1-4-billion-russian-sanctions-mystery/",
  "source_type": "icij",
  "source_date": "2021-10-03",
  "confidence": "high"
}
```

---

### Entity 122: Suleiman Abusaidovich Kerimov

```json
{
  "entity_id": "PUT-122",
  "full_legal_name": "Suleiman Abusaidovich Kerimov",
  "aliases": ["Suleyman Kerimov", "Ð¡ÑÐ»ÐµÐ¹Ð¼Ð°Ð½ ÐÐµÑÐ¸Ð¼Ð¾Ð²"],
  "entity_type": "individual",
  "jurisdiction": "Russia (Dagestan)",
  "dob": "1966-03-12",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "OFAC": "SDN â designated for role in network",
    "EU": "Sanctioned",
    "UK": "Sanctioned"
  },
  "role": "Billionaire. Companies tied to Kerimov paid $200M to offshore entities linked to Roldugin per ICIJ. Tokido Holdings loaned 4 billion rubles to National Telecommunications JSC (NTC, Kerimov's Nafta group). Kerimov sold NTC to National Media Group but Tokido debt remained â enabling $59M to flow to Roldugin network for $2 payment (Desmin Holdings transaction). Kerimov was among senior business leaders summoned by Putin day of Ukraine invasion.",
  "roldugin_transactions": [
    {"description": "Tokido Holdings â NTC (Kerimov) â sold to NMG but Tokido debt remained â Tokido passed rights to Desmin Holdings â Desmin sold to Sandalwood for $1 â Roldugin network received 4 billion rubles for $2 total", "value": "$59M equivalent"},
    {"description": "Separate Kerimov company transaction to Roldugin offshore â $200M total per ICIJ", "value": "$200M"}
  ],
  "source_primary": "ICIJ Panama Papers â Kerimov companies, Tokido/Desmin/NTC transaction chain",
  "source_url": "https://www.occrp.org/en/project/the-panama-papers/the-secret-caretaker",
  "source_type": "icij",
  "source_date": "2016-04-03",
  "confidence": "high"
}
```

---

### DERIPASKA DOJ NETWORK â PASS 3

---

### Entity 123: Natalia Mikhaylovna Bardakova

```json
{
  "entity_id": "DER-017",
  "full_legal_name": "Natalia Mikhaylovna Bardakova",
  "aliases": ["Natalya Bardakova"],
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "dob": "approx. 1977 (age 45 at indictment September 2022)",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": false,
  "criminal_status": "Indicted September 29 2022, SDNY. Charged: conspiracy to violate and evade US sanctions + making false statements to FBI. At large in Russia as of investigation date. Not arrested.",
  "role": "Deripaska's Russia-based handler. Directed Shriki to conduct illegal transactions for Deripaska. Directed Voronina's two US birth tourism attempts. Made false statements to conceal Deripaska's financing of Voronina's travel.",
  "source_primary": "DOJ SDNY indictment September 29 2022 â Bardakova named as co-conspirator",
  "source_url": "https://www.justice.gov/usao-sdny/pr/russian-oligarch-oleg-vladimirovich-deripaska-and-associates-indicted-sanctions-evasion",
  "source_type": "court_document",
  "source_date": "2022-09-29",
  "confidence": "high"
}
```

---

### Entity 124: Olga Shriki

```json
{
  "entity_id": "DER-018",
  "full_legal_name": "Olga Shriki",
  "entity_type": "individual",
  "jurisdiction": "USA (New Jersey)",
  "dob": "approx. 1980 (age 42 at indictment September 2022)",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": false,
  "criminal_status": "Arrested September 29 2022. Charged: conspiracy to violate/evade US sanctions + obstruction of justice (deleted records after grand jury subpoena). US citizen.",
  "role": "Deripaska's US-based fixer. Facilitated $3M+ sale of Deripaska's California music studio 2019. Managed three Deripaska luxury properties in United States. Arranged $300K in US medical care, housing, childcare for Voronina's first US birth. Deleted electronic records after receiving grand jury subpoena â obstruction charge.",
  "source_primary": "DOJ SDNY indictment September 29 2022 â Shriki arrested, charges described",
  "source_url": "https://www.justice.gov/usao-sdny/pr/russian-oligarch-oleg-vladimirovich-deripaska-and-associates-indicted-sanctions-evasion",
  "source_type": "court_document",
  "source_date": "2022-09-29",
  "confidence": "high"
}
```

---

### Entity 125: Ekaterina Olegovna Voronina

```json
{
  "entity_id": "DER-019",
  "full_legal_name": "Ekaterina Olegovna Voronina",
  "aliases": ["Ekaterina Lobanova"],
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "dob": "approx. 1989 (age 33 at indictment September 2022)",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "criminal_status": "Indicted September 29 2022. Charged: making false statements to DHS agents. Not arrested. At large.",
  "role": "Deripaska's girlfriend. Entered US on false 10-day tourist visa, stayed ~6 months to give birth â child received US citizenship. Child's last name slightly altered to conceal Deripaska as father. Second attempt to return for second birth: denied entry at US border, returned to Istanbul.",
  "source_primary": "DOJ SDNY indictment September 29 2022",
  "source_url": "https://www.justice.gov/usao-sdny/pr/russian-oligarch-oleg-vladimirovich-deripaska-and-associates-indicted-sanctions-evasion",
  "source_type": "court_document",
  "source_date": "2022-09-29",
  "confidence": "high"
}
```

---

### Entity 126: Gracetown Inc.

```json
{
  "entity_id": "DER-020",
  "full_legal_name": "Gracetown Inc.",
  "entity_type": "company",
  "jurisdiction": "USA",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Oleg Deripaska (OFAC SDN) â used to illegally access US financial system post-designation",
  "role": "Deripaska's US corporate shell. Used to hold three US luxury properties and access US financial system after April 2018 OFAC designation. DOJ: 'illegally utilized the U.S. financial system to maintain and retain three luxury properties in the United States.' Part of shell company chain that obscured Deripaska's ownership of California music studio sold for $3M+ in 2019.",
  "source_primary": "DOJ SDNY indictment September 29 2022 â Gracetown Inc. named as Deripaska's US vehicle",
  "source_url": "https://www.justice.gov/usao-sdny/pr/russian-oligarch-oleg-vladimirovich-deripaska-and-associates-indicted-sanctions-evasion",
  "source_type": "court_document",
  "source_date": "2022-09-29",
  "confidence": "high"
}
```

---

### Entity 127: Ocean Studios California LLC

```json
{
  "entity_id": "DER-021",
  "full_legal_name": "Ocean Studios California LLC",
  "entity_type": "company",
  "jurisdiction": "USA (California)",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Oleg Deripaska (OFAC SDN) â owned through series of shell companies",
  "role": "California music studio owned by Deripaska through series of shell companies that obscured his ownership. Sold for $3M+ in 2019 by Shriki on Deripaska's behalf. Shriki attempted to repatriate $3M+ in proceeds to Russia-based account belonging to another Deripaska company through this shell â the specific evasion act charged in the indictment.",
  "source_primary": "DOJ SDNY indictment September 29 2022 â Ocean Studios California LLC named as proceeds repatriation vehicle",
  "source_url": "https://www.justice.gov/usao-sdny/pr/russian-oligarch-oleg-vladimirovich-deripaska-and-associates-indicted-sanctions-evasion",
  "source_type": "court_document",
  "source_date": "2022-09-29",
  "confidence": "high"
}
```

---

### Entity 128: Charles McGonigal

```json
{
  "entity_id": "DER-022",
  "full_legal_name": "Charles Francis McGonigal",
  "entity_type": "individual",
  "jurisdiction": "USA",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": false,
  "criminal_status": "Arrested January 2023. Pleaded guilty 2023. Sentenced 4+ years prison.",
  "role": "Former FBI Special Agent in Charge, Counterintelligence Division, New York Field Office â the senior FBI official responsible for investigating Russian spies and oligarchs. Hired via Sergei Fokin (unindicted co-conspirator) to research compromising information on Vladimir Potanin â at Deripaska's behest, to use against a rival oligarch. Also sought internship for Fokin's daughter at NYPD. Convicted of conspiring to help Deripaska evade sanctions. Among most significant corruption cases in FBI history.",
  "significance": "Active FBI counterintelligence chief investigating Deripaska while simultaneously working for Deripaska's network. Connects Deripaska network to corruption of senior US federal law enforcement.",
  "source_primary": "RFE/RL â McGonigal-Shestakov trial reporting, McGonigal conviction and sentence",
  "source_url": "https://www.rferl.org/a/russia-sanctions-deripaska-shestakov-mcgonigal-trial/33440136.html",
  "source_type": "court_document",
  "source_date": "2023-12-15",
  "confidence": "high"
}
```

---

### Entity 129: Sergei Shestakov

```json
{
  "entity_id": "DER-023",
  "full_legal_name": "Sergei Shestakov",
  "entity_type": "individual",
  "jurisdiction": "USA (naturalized)",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": false,
  "criminal_status": "Arrested January 2023. Trial set June 17 2025. Charged: conspiracy to help Deripaska evade sanctions + conspiracy to commit money laundering + lying to FBI agents.",
  "role": "Former Soviet and Russian diplomat. Naturalized US citizen. Licensed authorized US federal court interpreter. Business partner of McGonigal. Worked alongside McGonigal for Deripaska network. Accused of conspiring to help Deripaska evade US sanctions. Money laundering charges. Also linked to former Russian tycoon Vladimir Gusinsky (Connecticut mansion connection).",
  "gusinsky_connection": "Shestakov, McGonigal, and another Russian man linked to Vladimir Gusinsky (former Russian media tycoon, Connecticut). Gusinsky not implicated in criminal case.",
  "source_primary": "RFE/RL â Shestakov trial reporting, charges described",
  "source_url": "https://www.rferl.org/a/russia-sanctions-deripaska-shestakov-mcgonigal-trial/33440136.html",
  "source_type": "court_document",
  "source_date": "2025-06-12",
  "confidence": "high"
}
```

---

### Entity 130: Sergei Fokin

```json
{
  "entity_id": "DER-024",
  "full_legal_name": "Sergei Fokin",
  "entity_type": "individual",
  "jurisdiction": "Russia",
  "tier": 2,
  "risk_level": "critical",
  "sanctioned": false,
  "criminal_status": "Named as unindicted co-conspirator in McGonigal/Shestakov prosecution. US visa revoked 2022. FBI surveilled, photographed, and secretly recorded from July 2019.",
  "role": "Russian national. Intermediary who hired McGonigal and Shestakov on behalf of Deripaska to research compromising information on Potanin. Prosecutors named him unindicted co-conspirator. US visa revoked 2022 at FBI request after being surveilled for 3+ years.",
  "source_primary": "RFE/RL â Fokin named as unindicted co-conspirator, FBI surveillance described",
  "source_url": "https://www.rferl.org/a/russia-sanctions-deripaska-shestakov-mcgonigal-trial/33440136.html",
  "source_type": "court_document",
  "source_date": "2025-06-12",
  "confidence": "high"
}
```

---

### ABRAMOVICH NETWORK â PASS 3

---

### Entity 131: Sonora Capital Holdings Ltd

```json
{
  "entity_id": "ABR-015",
  "full_legal_name": "Sonora Capital Holdings Ltd",
  "entity_type": "company",
  "jurisdiction": "British Virgin Islands",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Roman Abramovich (UK/EU sanctioned) via Keygrove Holdings",
  "role": "BVI intermediate holding company. Received $2B+ in loans from Keygrove Holdings. In turn loaned to Camberley International Investments Ltd. The chain: Keygrove (hedge fund profits) â Sonora Capital â Camberley â Fordstam Ltd (Chelsea FC parent). Sonora provided ~$500M of the nearly $2B total that Camberley loaned to Chelsea via Fordstam.",
  "source_primary": "TBIJ â Abramovich $1B UK tax investigation, Keygrove â Sonora â Camberley â Fordstam chain",
  "source_url": "https://www.thebureauinvestigates.com/stories/2025-01-29/roman-abramovich-may-owe-uk-1bn-in-unpaid-tax",
  "source_type": "icij",
  "source_date": "2025-01-29",
  "confidence": "high"
}
```

---

### Entity 132: Camberley International Investments Ltd

```json
{
  "entity_id": "ABR-016",
  "full_legal_name": "Camberley International Investments Ltd",
  "entity_type": "company",
  "jurisdiction": "British Virgin Islands",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Roman Abramovich (UK/EU sanctioned) via Keygrove/Sonora chain",
  "role": "BVI company set up for one specific purpose: bankrolling Chelsea Football Club. By 2021 had loaned $1.9B to Chelsea via Fordstam Ltd. Received funding from Sonora Capital Holdings (which received from Keygrove). The vehicle through which Abramovich's allegedly untaxed offshore hedge fund profits flowed to Chelsea.",
  "source_primary": "TBIJ â Camberley named as Chelsea funding vehicle, $1.9B in loans to Fordstam by 2021",
  "source_url": "https://www.thebureauinvestigates.com/stories/2025-01-29/roman-abramovich-may-owe-uk-1bn-in-unpaid-tax",
  "source_type": "icij",
  "source_date": "2025-01-29",
  "confidence": "high"
}
```

---

### Entity 133: Fordstam Ltd

```json
{
  "entity_id": "ABR-017",
  "full_legal_name": "Fordstam Ltd",
  "entity_type": "company",
  "jurisdiction": "United Kingdom",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_50pct_rule": true,
  "beneficial_owner": "Roman Abramovich (UK/EU sanctioned)",
  "role": "UK-registered parent company of Chelsea Football Club. Received nearly $1.9B in loans from Camberley International Investments by 2021. Chelsea won Champions League, Club World Cup, and UEFA Super Cup while funded by loans traceable back to Abramovich's allegedly untaxed offshore hedge fund returns.",
  "source_primary": "TBIJ â Fordstam named as Chelsea parent, $1.9B in loans from Camberley",
  "source_url": "https://www.thebureauinvestigates.com/stories/2025-01-29/roman-abramovich-may-owe-uk-1bn-in-unpaid-tax",
  "source_type": "icij",
  "source_date": "2025-01-29",
  "confidence": "high"
}
```

---

### Entity 134: Millennium Capital Ventures Ltd

```json
{
  "entity_id": "ABR-018",
  "full_legal_name": "Millennium Capital Ventures Ltd",
  "entity_type": "company",
  "jurisdiction": "Unknown (offshore)",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "beneficial_owner": "Shvidler's wife (unnamed) â indirect owner; Eugene Shvidler appointed director 2000",
  "role": "The Shvidler-controlled vehicle that became Keygrove Holdings' investment manager. Appointed as Keygrove's investment manager from 2008 with 'full power and authority to supervise and direct' all investments 'without prior consultation with client.' Through this entity Shvidler exercised effective control of all Abramovich's $6B hedge fund investment decisions from the UK â the basis for UK's potential $1B+ tax claim. Owned indirectly by Shvidler's wife.",
  "significance": "The specific mechanism through which Shvidler directed all investment decisions. Its UK-based management and control is the legal basis for HMRC's potential tax claim against Abramovich's BVI structure.",
  "source_primary": "BBC/TBIJ â Millennium Capital Ventures named as Keygrove investment manager appointed by Shvidler",
  "source_url": "https://www.thebureauinvestigates.com/stories/2025-01-29/roman-abramovich-may-owe-uk-1bn-in-unpaid-tax",
  "source_type": "icij",
  "source_date": "2025-01-29",
  "confidence": "high"
}
```

---

### Entity 135: Blue Ocean Yacht Management

```json
{
  "entity_id": "ABR-019",
  "full_legal_name": "Blue Ocean Yacht Management",
  "entity_type": "company",
  "jurisdiction": "Cyprus",
  "tier": 2,
  "risk_level": "critical",
  "sanctioned": false,
  "criminal_charges": true,
  "role": "Cyprus company at center of Abramovich yacht VAT evasion scheme. Five Abramovich superyachts (owned through BVI companies) were rented to Blue Ocean, which leased them back to other BVI companies secretly owned by Abramovich's trust. Classified yachts as commercial vessels â exempting from EU VAT. Cyprus tax authority filed criminal charges August 2025 against former Blue Ocean directors. Tax sought: â¬25M+. Cypriot tax commissioner confirmed indictment August 26 2025.",
  "criminal_status": "Criminal charges filed August 26 2025 in Cyprus â former directors of Blue Ocean indicted",
  "source_primary": "TBIJ â Blue Ocean criminal charges filed August 2025",
  "source_url": "https://www.thebureauinvestigates.com/stories/2025-08-26/cyprus-files-criminal-charges-over-abramovich-tax-evasion-scheme",
  "source_type": "court_document",
  "source_date": "2025-08-26",
  "confidence": "high"
}
```

---

```json
{
  "pass3_summary": {
    "pass_number": 3,
    "date": "2026-03-15",
    "total_entities_found_this_pass": 47,
    "total_entities_individually_mapped": 36,
    "entities_added_to_file": "PUT-100 through PUT-135 (36 entities, IDs 100-135)",
    "open_branches_remaining": 18,
    "open_branches": [
      {"entity": "IPP Oil Products Cyprus Ltd", "why": "Timchenko/Olsson board overlap, pre-sanctions restructuring vehicle", "source": "SwissInfo 2014"},
      {"entity": "Menikos Yiannakou", "why": "Gunvor board member alongside Olsson, resigned April 2014", "source": "SwissInfo 2014"},
      {"entity": "Emilios Kallenos", "why": "Gunvor board member alongside Olsson, resigned April 2014", "source": "SwissInfo 2014"},
      {"entity": "Seqouia Treuhand managing director (unnamed)", "why": "Liechtenstein/Swiss dual national, managed Timchenko AND Usmanov properties â cross-network enabler", "source": "US Sanctions Blog 2023"},
      {"entity": "Jabiru Consultants", "why": "Mordashov-adjacent, paid Sunbarn $30M, previously Severstal shareholder", "source": "OCCRP Secret Caretaker"},
      {"entity": "Pearl Kite Trading", "why": "Mordashov-adjacent, paid Sunbarn $30M", "source": "OCCRP Secret Caretaker"},
      {"entity": "Dulston Ventures", "why": "Mordashov BVI shell, $830K to Roldugin-linked firm 2010", "source": "ICIJ Pandora Papers"},
      {"entity": "Mordashov 3 unnamed OFAC-designated companies", "why": "Designated alongside Mordashov June 2022 â names not retrieved in this pass", "source": "ICIJ sanctions reporting"},
      {"entity": "Mordashov 2 unnamed children", "why": "Designated alongside Mordashov June 2022 as family members â names not retrieved", "source": "ICIJ sanctions reporting"},
      {"entity": "De Vere Worldwide Corporation", "why": "BVI company used to fund German journalist Seipel's Putin-friendly books, funded by 2 Mordashov offshore entities", "source": "iStories Media 2023"},
      {"entity": "Sergei Fokin daughter", "why": "McGonigal sought NYPD internship for her â named in court documents", "source": "RFE/RL"},
      {"entity": "Vladimir Gusinsky", "why": "Connecticut mansion, linked to Shestakov/McGonigal through business connections", "source": "RFE/RL"},
      {"entity": "Two unnamed Cyprus trusts controlling Keygrove", "why": "Abramovich as sole beneficiary until 2022 then children â trust structure not individually named in public record", "source": "TBIJ/BBC"},
      {"entity": "Shvidler wife (unnamed)", "why": "Indirect owner Millennium Capital Ventures â name not in public record", "source": "BBC/TBIJ"},
      {"entity": "Abramovich 5 children (unnamed)", "why": "Named as Keygrove trust successors from 2022 â names not in public record", "source": "TBIJ"},
      {"entity": "Jersey trust structures (Sibneft $13B sale)", "why": "Jersey AG investigating Abramovich for money laundering via Jersey trusts used in Sibneft proceeds", "source": "Comsure/TBIJ 2025"},
      {"entity": "Nafta group (Kerimov)", "why": "Kerimov's primary holding company, controlled NTC which was used in Tokido/Desmin Roldugin transaction", "source": "OCCRP Secret Caretaker"},
      {"entity": "National Telecommunications JSC (NTC)", "why": "Kerimov company, received Tokido loan, then sold to National Media Group but debt enabled $59M to flow to Roldugin for $2", "source": "OCCRP Secret Caretaker"}
    ],
    "bulk_import_queue": [
      {"network": "Mordashov 60+ BVI shells via Unifirm group", "source": "ICIJ Pandora Papers", "method": "offshoreleaks.icij.org bulk download"},
      {"network": "Abramovich 200+ hedge fund investment BVI vehicles under Keygrove", "source": "ICIJ Cyprus Confidential", "method": "offshoreleaks.icij.org bulk download"},
      {"network": "Timchenko full Volga Group sub-portfolio and Novatek/Sibur stake vehicles", "source": "OFAC SDN XML + ICIJ", "method": "OFAC SDN XML bulk download"},
      {"network": "Kerimov Nafta group full entity list", "source": "ICIJ Offshore Leaks", "method": "offshoreleaks.icij.org search"}
    ],
    "total_entities_in_file_after_pass3": 135,
    "note": "135 entities individually mapped with full provenance. Open branches above represent Pass 4 investigation subjects. Bulk import queue represents ~400+ additional entities accessible via structured data downloads. File represents exhaustive open-source investigation at current pass depth."
  }
}
```

---

*135 entities individually mapped with full provenance as of 2026-03-15 Pass 3. Branch accounting implemented per protocol. Pass 3 added 36 new entities: full Timchenko Volga Group OFAC-designated sub-entities (PUT-100 through PUT-109), Seqouia Treuhand Trust (PUT-110), Bank Rossiya sub-entities (PUT-111 through PUT-114), Mordashov network (PUT-115 through PUT-122), Deripaska DOJ co-conspirators (DER-017 through DER-024 = entities 123-130), Abramovich extended chain (ABR-015 through ABR-019 = entities 131-135). Key new findings: Arkady â Igor â Liliya three-generation sanctions evasion chain; Deripaska hired active FBI counterintelligence chief (McGonigal) to target rival Potanin; Abramovich Chelsea FC funded by $1.9B from allegedly untaxed offshore profits via KeygroveâSonoraâCamberleyâFordstam chain; Blue Ocean Yacht Management criminal charges Cyprus August 2025; Seqouia Treuhand cross-network node connecting Timchenko and Usmanov wealth management. 18 open branches documented for Pass 4. Bulk import queue documented with sources and methods.*
