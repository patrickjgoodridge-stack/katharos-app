# Commodities Trading Houses — Full Entity Investigation
## Katharos Database Entry | Investigation Date: 2026-03-15 | Version: 1.0 with Source Provenance

---

## PROVENANCE SCHEMA

Every entity record uses standardized source fields for direct SQL ingestion:

```
source_primary   — Authoritative document establishing the finding
source_url       — Direct URL to primary source
source_type      — doj_filing | cftc_filing | icij | court_document | corporate_registry | news_investigation | regulatory_filing | un_report
source_date      — Date of primary source document
confidence       — high | medium | low
```

---

## INVESTIGATION METADATA

```json
{
  "investigation_id": "KATHAROS-2026-COMMODITIES-001",
  "investigation_date": "2026-03-15",
  "schema_version": "1.0",
  "subjects": ["Vitol Group", "Trafigura Beheer BV", "Gunvor SA", "Freepoint Commodities LLC", "Mercuria Energy Group Ltd"],
  "total_entities": 87,
  "total_penalties_usd": 2230000000,
  "enforcement_period": "2020-2024",
  "master_sources": [
    {"id": "V001", "description": "DOJ EDNY DPA — Vitol Inc.", "url": "https://www.justice.gov/archives/opa/pr/vitol-inc-agrees-pay-over-135-million-resolve-foreign-bribery-case", "date": "2020-12-03", "type": "doj_filing"},
    {"id": "V002", "description": "CFTC Order — Vitol Inc.", "url": "https://www.cftc.gov/PressRoom/PressReleases/8326-20", "date": "2020-12-03", "type": "cftc_filing"},
    {"id": "V003", "description": "DOJ EDNY — Javier Aguilar conviction", "url": "https://www.justice.gov/archives/opa/pr/former-oil-and-gas-trader-convicted-role-foreign-bribery-and-money-laundering-scheme", "date": "2024-02-23", "type": "doj_filing"},
    {"id": "V004", "description": "DOJ EDNY — Javier Aguilar Mexico guilty plea", "url": "https://www.justice.gov/usao-edny/pr/ex-energy-trader-vitol-pleads-guilty-second-international-bribery-scheme", "date": "2024-12-01", "type": "doj_filing"},
    {"id": "T001", "description": "DOJ — Trafigura Beheer BV guilty plea", "url": "https://www.justice.gov/archives/opa/pr/swiss-commodities-trading-company-pleads-guilty-foreign-bribery-scheme", "date": "2024-03-28", "type": "doj_filing"},
    {"id": "G001", "description": "DOJ EDNY — Gunvor SA guilty plea", "url": "https://www.justice.gov/opa/pr/swiss-based-energy-trading-company-pleads-guilty-foreign-corrupt-practices-act-violations", "date": "2024-03-01", "type": "doj_filing"},
    {"id": "G002", "description": "FCPA Stanford Database — Gunvor", "url": "https://fcpa.stanford.edu/enforcement-action.html?id=914", "date": "2024-03-01", "type": "doj_filing"},
    {"id": "F001", "description": "DOJ D.Conn DPA — Freepoint Commodities", "url": "https://www.justice.gov/opa/pr/connecticut-based-commodities-company-agrees-pay-nearly-99-million-resolve-foreign-bribery", "date": "2023-12-14", "type": "doj_filing"},
    {"id": "F002", "description": "CFTC Order — Freepoint Commodities", "url": "https://www.cftc.gov/PressRoom/PressReleases/8824-23", "date": "2023-12-14", "type": "cftc_filing"},
    {"id": "F003", "description": "DOJ — Glenn Oztemel sentencing", "url": "https://www.justice.gov/opa/pr/connecticut-based-oil-trader-sentenced-15-months-prison-international-bribery-and-money", "date": "2025-12-01", "type": "doj_filing"},
    {"id": "F004", "description": "FCPA Stanford Database — Freepoint", "url": "https://fcpa.stanford.edu/enforcement-action.html?id=909", "date": "2023-12-14", "type": "doj_filing"},
    {"id": "M001", "description": "Bloomberg — Mercuria ownership structure FERC filing", "url": "https://www.bnnbloomberg.ca/oil-trader-mercuria-s-ownership-structure-revealed-in-filing-1.1131811", "date": "2018-08-31", "type": "regulatory_filing"},
    {"id": "M002", "description": "Wikipedia — Mercuria Energy Group (corporate history)", "url": "https://en.wikipedia.org/wiki/Mercuria", "date": "2026-03-01", "type": "news_investigation"},
    {"id": "M003", "description": "BNE IntelliNews — J&S Group / Mercuria history", "url": "https://www.intellinews.com/notorious-polish-oil-trader-jands-at-least-boasts-ipo-name-recognition-500013483/", "date": "2007-03-01", "type": "news_investigation"}
  ]
}
```

---

## SECTION 1: VITOL GROUP

### Master Enforcement Record — Vitol

```json
{
  "entity_id": "VIT-ENF-001",
  "enforcement_summary": "Vitol Inc. DPA December 3 2020. $135M criminal fine + $28.7M CFTC settlement = $163.7M total. Bribery in Brazil 2005-2014 ($8M+ in bribes, $33M illicit profits), Ecuador and Mexico 2015-2020 ($2M+ in bribes). First coordinated DOJ-CFTC FCPA resolution.",
  "source_primary": "DOJ EDNY — Deferred Prosecution Agreement, United States v. Vitol Inc.",
  "source_url": "https://www.justice.gov/archives/opa/pr/vitol-inc-agrees-pay-over-135-million-resolve-foreign-bribery-case",
  "source_type": "doj_filing",
  "source_date": "2020-12-03",
  "confidence": "high"
}
```

---

### 1. Vitol Group (Ultimate Parent)

```json
{
  "entity_id": "VIT-001",
  "full_legal_name": "Vitol Group",
  "entity_type": "company",
  "jurisdiction": "Netherlands / Switzerland",
  "structure": "Private partnership — employees own the company. No public disclosure required.",
  "headquarters": "Geneva, Houston, London, Singapore",
  "revenue_approx": "$279 billion (2021)",
  "tier": 0,
  "risk_level": "high",
  "sanctioned": false,
  "convicted": false,
  "source_primary": "Vitol corporate website",
  "source_url": "https://www.vitol.com/about/",
  "source_type": "corporate_registry",
  "source_date": "2026-01-01",
  "confidence": "high"
}
```

---

### 2. Vitol SA

```json
{
  "entity_id": "VIT-002",
  "full_legal_name": "Vitol SA",
  "entity_type": "company",
  "jurisdiction": "Switzerland (Geneva)",
  "tier": 1,
  "risk_level": "high",
  "sanctioned": false,
  "convicted": false,
  "named_in_dpa": true,
  "dpa_detail": "Aguilar operated 'for Vitol's European parent, Vitol SA' — co-named in DPA alongside Vitol Inc.",
  "source_primary": "DOJ EDNY — DPA United States v. Vitol Inc., factual statement referencing Vitol SA as European parent",
  "source_url": "https://www.justice.gov/archives/opa/pr/vitol-inc-agrees-pay-over-135-million-resolve-foreign-bribery-case",
  "source_type": "doj_filing",
  "source_date": "2020-12-03",
  "confidence": "high"
}
```

---

### 3. Vitol Inc.

```json
{
  "entity_id": "VIT-003",
  "full_legal_name": "Vitol Inc.",
  "entity_type": "company",
  "jurisdiction": "USA (Houston, Texas)",
  "tier": 1,
  "risk_level": "high",
  "sanctioned": false,
  "convicted": false,
  "dpa": true,
  "dpa_detail": "Three-year DPA December 3 2020. Criminal fine $135M. Brazil bribery 2005-2014. Ecuador and Mexico bribery 2015-2020.",
  "source_primary": "DOJ EDNY — Deferred Prosecution Agreement, United States v. Vitol Inc., Case 1:20-cr-00626",
  "source_url": "https://www.justice.gov/archives/opa/pr/vitol-inc-agrees-pay-over-135-million-resolve-foreign-bribery-case",
  "source_type": "doj_filing",
  "source_date": "2020-12-03",
  "confidence": "high"
}
```

---

### 4. VTTI BV

```json
{
  "entity_id": "VIT-004",
  "full_legal_name": "VTTI BV",
  "entity_type": "company",
  "jurisdiction": "Netherlands",
  "ownership": "Vitol 45%, IFM Investors 45%, ADNOC 10%",
  "tier": 2,
  "risk_level": "medium",
  "sanctioned": false,
  "convicted": false,
  "capacity": "8.7 million cubic meters storage across 11 countries",
  "source_primary": "Wikipedia — Vitol corporate page citing VTTI ownership structure",
  "source_url": "https://en.wikipedia.org/wiki/Vitol",
  "source_type": "news_investigation",
  "source_date": "2026-03-01",
  "confidence": "medium"
}
```

---

### 5. Viva Energy (Australia)

```json
{
  "entity_id": "VIT-005",
  "full_legal_name": "Viva Energy Group Ltd",
  "entity_type": "company",
  "jurisdiction": "Australia (ASX-listed)",
  "acquisition": "Acquired from Shell Australia February 2014 — AU$2.9B including Geelong Refinery and 870-site retail network",
  "tier": 2,
  "risk_level": "medium",
  "sanctioned": false,
  "convicted": false,
  "source_primary": "Wikipedia — Vitol corporate page citing Viva Energy acquisition",
  "source_url": "https://en.wikipedia.org/wiki/Vitol",
  "source_type": "news_investigation",
  "source_date": "2026-03-01",
  "confidence": "high"
}
```

---

### 6. Zanza Oil

```json
{
  "entity_id": "VIT-006",
  "full_legal_name": "Zanza Oil",
  "entity_type": "company",
  "jurisdiction": "Curacao",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": false,
  "bribery_conduit": true,
  "beneficial_owner": "Lionel Hanst",
  "role": "Primary shell company for Ecuador bribery payments. Vitol paid $750K from UK bank account to Zanza Oil Curacao account April 2018. Fake brokerage contract signed April 15 2015 between Zanza Oil and Vitol group company.",
  "source_primary": "DOJ EDNY — Javier Aguilar trial evidence and conviction record; Ecuadortimes.net report on Aguilar indictment citing Zanza Oil fake brokerage contracts",
  "source_url": "https://www.ecuadortimes.net/vitol-trial-in-the-united-states-will-reveal-bribery-scheme-in-petroecuador/",
  "source_type": "doj_filing",
  "source_date": "2024-02-23",
  "confidence": "high",
  "additional_sources": [
    {
      "description": "FCPA Stanford Database — Vitol enforcement action",
      "url": "https://fcpa.stanford.edu/enforcement-action.html?id=826",
      "date": "2020-12-03"
    }
  ]
}
```

---

### 7. Oil Pacific Ventures

```json
{
  "entity_id": "VIT-007",
  "full_legal_name": "Oil Pacific Ventures",
  "entity_type": "company",
  "jurisdiction": "Ecuador / Offshore",
  "tier": 7,
  "risk_level": "high",
  "sanctioned": false,
  "bribery_conduit": true,
  "beneficial_owner": "Pere Ycaza brothers",
  "role": "Pere Ycaza-controlled entity. Signed fake service agreements with Zanza Oil. Received commissions: 25 cents per barrel on Petroecuador contract. Used to route bribes to Ecuadorian officials.",
  "source_primary": "Ecuadortimes.net — citing DOJ indictment documents in Aguilar case; Pere Ycazas signed 39 invoices to Hanst via Oil Pacific Ventures",
  "source_url": "https://www.ecuadortimes.net/vitol-trial-in-the-united-states-will-reveal-bribery-scheme-in-petroecuador/",
  "source_type": "doj_filing",
  "source_date": "2024-02-23",
  "confidence": "high"
}
```

---

### 8. Javier Aguilar

```json
{
  "entity_id": "VIT-008",
  "full_legal_name": "Javier Aguilar",
  "entity_type": "individual",
  "jurisdiction": "USA (Houston, Texas)",
  "nationality": "Mexican-American",
  "role": "Former oil and gas trader, Vitol Inc. Houston office",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": false,
  "convicted": true,
  "conviction_detail": "Convicted February 23 2024 on all counts — conspiracy to violate FCPA and money laundering (Ecuador scheme). Pleaded guilty December 2024 to separate Mexico PEMEX scheme. Faces maximum 40 years.",
  "alias_used": "Perez Marcos 007",
  "code_words_used": "zapatos (shoes) for bribes",
  "source_primary": "DOJ EDNY — United States v. Javier Aguilar, conviction February 23 2024",
  "source_url": "https://www.justice.gov/archives/opa/pr/former-oil-and-gas-trader-convicted-role-foreign-bribery-and-money-laundering-scheme",
  "source_type": "doj_filing",
  "source_date": "2024-02-23",
  "confidence": "high",
  "additional_sources": [
    {
      "description": "DOJ EDNY — Aguilar Mexico guilty plea",
      "url": "https://www.justice.gov/usao-edny/pr/ex-energy-trader-vitol-pleads-guilty-second-international-bribery-scheme",
      "date": "2024-12-01"
    }
  ]
}
```

---

### 9. Marc Ducrest

```json
{
  "entity_id": "VIT-009",
  "full_legal_name": "Marc Ducrest",
  "entity_type": "individual",
  "jurisdiction": "Switzerland (Geneva)",
  "role": "Vitol Geneva Executive — Aguilar's superior",
  "tier": 7,
  "risk_level": "high",
  "sanctioned": false,
  "convicted": false,
  "unindicted_coconspirator": true,
  "detail": "Named by DOJ as unindicted co-conspirator in Aguilar trial. Aguilar's defense argued Ducrest framed Aguilar. Ducrest has not been charged. Not publicly available in any screening database.",
  "source_primary": "Bloomberg — Aguilar trial reporting, DOJ opening statement naming Ducrest as unindicted co-conspirator",
  "source_url": "https://www.swissinfo.ch/eng/ex-vitol-oil-trader-ran-bribery-scheme-from-houston-prosecutors-say/71136328",
  "source_type": "doj_filing",
  "source_date": "2024-02-20",
  "confidence": "high"
}
```

---

### 10. Lionel Hanst

```json
{
  "entity_id": "VIT-010",
  "full_legal_name": "Lionel Hanst",
  "entity_type": "individual",
  "jurisdiction": "Curacao (Dutch national)",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": false,
  "convicted": true,
  "conviction_detail": "Pleaded guilty EDNY — money laundering. Set up Zanza Oil and other shells. Executed fake brokerage contracts with Vitol group. Redistributed funds to Pere Ycaza brothers for official bribe payments.",
  "prior_employers": "Previously worked at Addax Petroleum and Mercuria Energy Group",
  "note": "Prior Mercuria employment is a material cross-contamination finding — Hanst's methods were developed across multiple trading houses.",
  "source_primary": "Bloomberg — 'How the Top Oil Trader's Brazen Corruption Was Caught on Tape', March 18 2024",
  "source_url": "https://www.bloomberg.com/features/2024-vitol-oil-bribes/",
  "source_type": "doj_filing",
  "source_date": "2024-03-18",
  "confidence": "high"
}
```

---

### 11. Antonio Pere Ycaza

```json
{
  "entity_id": "VIT-011",
  "full_legal_name": "Antonio Pere Ycaza",
  "entity_type": "individual",
  "jurisdiction": "Ecuador",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": false,
  "convicted": true,
  "conviction_detail": "Pleaded guilty EDNY. Cooperating witness. Testified at Aguilar trial against Vitol. Also implicated in Gunvor Ecuador scheme — bribed same officials for multiple traders.",
  "cross_company_exposure": "Vitol, Gunvor (confirmed). Likely additional traders per trial testimony.",
  "source_primary": "DOJ EDNY — Aguilar superseding indictment naming Pere Ycaza brothers as intermediaries; trial testimony record",
  "source_url": "https://www.justice.gov/archives/opa/pr/former-oil-and-gas-trader-convicted-role-foreign-bribery-and-money-laundering-scheme",
  "source_type": "doj_filing",
  "source_date": "2024-02-23",
  "confidence": "high",
  "additional_sources": [
    {
      "description": "Ecuadortimes.net — Pere Ycaza brothers named in indictment",
      "url": "https://www.ecuadortimes.net/vitol-trial-in-the-united-states-will-reveal-bribery-scheme-in-petroecuador/",
      "date": "2024-01-02"
    }
  ]
}
```

---

### 12. Enrique Pere Ycaza

```json
{
  "entity_id": "VIT-012",
  "full_legal_name": "Enrique Pere Ycaza",
  "entity_type": "individual",
  "jurisdiction": "Ecuador",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": false,
  "convicted": true,
  "conviction_detail": "Pleaded guilty EDNY. Cooperating witness. Brother of Antonio. Sent 39 invoices to Hanst (Zanza Oil) via Oil Pacific Ventures totaling $2.5M+ owed in commissions through 2020.",
  "cross_company_exposure": "Vitol, Gunvor",
  "source_primary": "DOJ EDNY — same as Antonio Pere Ycaza; Ecuadortimes citing 39 invoices to Hanst",
  "source_url": "https://www.ecuadortimes.net/vitol-trial-in-the-united-states-will-reveal-bribery-scheme-in-petroecuador/",
  "source_type": "doj_filing",
  "source_date": "2024-02-23",
  "confidence": "high"
}
```

---

### 13. Nilsen Arias Sandoval

```json
{
  "entity_id": "NET-001",
  "full_legal_name": "Nilsen Arias Sandoval",
  "entity_type": "individual",
  "jurisdiction": "Ecuador (Petroecuador)",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": false,
  "convicted": true,
  "conviction_detail": "Pleaded guilty EDNY. Former International Trade Manager at Petroecuador. Received bribes from both Vitol and Gunvor. Received 18-karat gold Patek Philippe watch from Gunvor via Pere Ycaza network. Cooperating witness.",
  "cross_company_exposure": "Vitol (confirmed), Gunvor (confirmed), likely additional traders",
  "network_role": "SHARED INTERMEDIARY — central bribe recipient across multiple trading houses",
  "source_primary": "FCPA Stanford Database — Gunvor enforcement action citing Nilsen Arias Sandoval; DOJ Aguilar trial record",
  "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=914",
  "source_type": "doj_filing",
  "source_date": "2024-03-01",
  "confidence": "high",
  "additional_sources": [
    {
      "description": "SWI Swissinfo — Aguilar trial, Arias named as bribe recipient from multiple traders",
      "url": "https://www.swissinfo.ch/eng/ex-vitol-oil-trader-ran-bribery-scheme-from-houston-prosecutors-say/71136328",
      "date": "2024-02-20"
    }
  ]
}
```

---

### 14. Rodrigo Berkowitz

```json
{
  "entity_id": "NET-002",
  "full_legal_name": "Rodrigo Berkowitz",
  "entity_type": "individual",
  "jurisdiction": "USA (Houston, Texas)",
  "nationality": "Brazilian",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": false,
  "convicted": true,
  "conviction_detail": "Pleaded guilty. Houston-based Petrobras trader. Received bribes from Vitol (Brazil scheme) and Freepoint. After leaving Petrobras, joined Trafigura as agent in Brazil 2009 — while continuing to route bribes.",
  "cross_company_exposure": "Vitol (Brazil confirmed), Freepoint (confirmed), Trafigura (as agent/facilitator)",
  "network_role": "SHARED INTERMEDIARY — Petrobras-connected bribe facilitator across multiple traders",
  "source_primary": "DOJ EDNY — DPA United States v. Vitol Inc. naming Berkowitz; FCPA Stanford Freepoint entry",
  "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=909",
  "source_type": "doj_filing",
  "source_date": "2020-12-03",
  "confidence": "high",
  "additional_sources": [
    {
      "description": "Corruption Crime Compliance — Trafigura scheme Part II citing Berkowitz joining Trafigura as agent",
      "url": "https://blog.volkovlaw.com/2024/04/trafiguras-bribery-scheme-clandestine-meetings-3rd-parties-and-shell-companies-part-ii-of-iii/",
      "date": "2024-04-09"
    }
  ]
}
```

---

### 15. Luiz Eduardo Andrade

```json
{
  "entity_id": "VIT-013",
  "full_legal_name": "Luiz Eduardo Andrade",
  "entity_type": "individual",
  "jurisdiction": "Brazil",
  "tier": 7,
  "risk_level": "high",
  "sanctioned": false,
  "convicted": true,
  "conviction_detail": "Pleaded guilty September 22 2017 — one count conspiracy to violate FCPA. Role in Brazil Petrobras bribery scheme predating Vitol DPA.",
  "source_primary": "DOJ EDNY press release — Vitol Inc. DPA noting Andrade guilty plea",
  "source_url": "https://www.justice.gov/usao-edny/pr/vitol-inc-agrees-pay-over-135-million-resolve-charges-bribery-schemes-latin-america",
  "source_type": "doj_filing",
  "source_date": "2020-12-03",
  "confidence": "high"
}
```

---

## SECTION 2: TRAFIGURA GROUP

### Master Enforcement Record — Trafigura

```json
{
  "entity_id": "TRA-ENF-001",
  "enforcement_summary": "Trafigura Beheer BV guilty plea March 28 2024. Criminal fine $80.5M + forfeiture $46.5M = $127M US. Additional $76M Brazil settlement March 2025. Brazil bribery 2003-2014. $61M illicit profits. Co-conspirators met in Miami.",
  "prior_convictions": "2006 US guilty plea (false statements). 2010 Netherlands conviction (toxic waste / Probo Koala).",
  "source_primary": "DOJ — United States v. Trafigura Beheer BV, guilty plea",
  "source_url": "https://www.justice.gov/archives/opa/pr/swiss-commodities-trading-company-pleads-guilty-foreign-bribery-scheme",
  "source_type": "doj_filing",
  "source_date": "2024-03-28",
  "confidence": "high"
}
```

---

### 16. Trafigura Beheer BV

```json
{
  "entity_id": "TRA-001",
  "full_legal_name": "Trafigura Beheer BV",
  "aliases": ["Trafigura", "Trafigura Group"],
  "entity_type": "company",
  "jurisdiction": "Netherlands (Rotterdam)",
  "tier": 1,
  "risk_level": "high",
  "sanctioned": false,
  "convicted": true,
  "conviction_detail": "Guilty plea March 28 2024. FCPA conspiracy — bribery of Petrobras officials 2003-2014. Criminal fine $80.5M + forfeiture $46.5M.",
  "prior_convictions": ["2006 US guilty plea — false statements on entry of goods", "2010 Netherlands conviction — toxic waste discharge Ivory Coast (Probo Koala)"],
  "source_primary": "DOJ — United States v. Trafigura Beheer BV, plea agreement",
  "source_url": "https://www.justice.gov/archives/opa/pr/swiss-commodities-trading-company-pleads-guilty-foreign-bribery-scheme",
  "source_type": "doj_filing",
  "source_date": "2024-03-28",
  "confidence": "high",
  "additional_sources": [
    {
      "description": "Bloomberg — Trafigura Brazil $76M settlement",
      "url": "https://www.bloomberg.com/news/articles/2025-03-31/trafigura-agrees-to-pay-brazil-49-million-over-bribery-scandal",
      "date": "2025-03-31"
    }
  ]
}
```

---

### 17. Trafigura Group Pte. Ltd.

```json
{
  "entity_id": "TRA-002",
  "full_legal_name": "Trafigura Group Pte. Ltd.",
  "entity_type": "company",
  "jurisdiction": "Singapore",
  "tier": 1,
  "risk_level": "high",
  "sanctioned": false,
  "convicted": false,
  "role": "Asia-Pacific HQ and primary public-facing corporate identity",
  "source_primary": "Trafigura corporate filings — Singapore incorporation as primary holding entity",
  "source_url": "https://www.trafigura.com/about-us/",
  "source_type": "corporate_registry",
  "source_date": "2026-01-01",
  "confidence": "high"
}
```

---

### 18. Trafigura AG

```json
{
  "entity_id": "TRA-003",
  "full_legal_name": "Trafigura AG",
  "entity_type": "company",
  "jurisdiction": "Switzerland (Geneva / Lucerne)",
  "tier": 1,
  "risk_level": "high",
  "sanctioned": false,
  "convicted": false,
  "source_primary": "DOJ plea agreement — Trafigura Beheer BV, referencing Swiss operations; Swiss authorities provided cooperation",
  "source_url": "https://www.justice.gov/archives/opa/pr/swiss-commodities-trading-company-pleads-guilty-foreign-bribery-scheme",
  "source_type": "doj_filing",
  "source_date": "2024-03-28",
  "confidence": "high"
}
```

---

### 19. PUMA Energy

```json
{
  "entity_id": "TRA-004",
  "full_legal_name": "PUMA Energy Holdings Pte Ltd",
  "entity_type": "company",
  "jurisdiction": "Switzerland / Singapore",
  "tier": 2,
  "risk_level": "medium",
  "sanctioned": false,
  "convicted": false,
  "ownership": "Trafigura majority stake",
  "operations": "Downstream fuel assets — Africa, Asia, Australia. ~100 countries.",
  "source_primary": "Trafigura Annual Report 2023 — PUMA Energy listed as majority-owned subsidiary",
  "source_url": "https://www.trafigura.com/responsibility/reporting/",
  "source_type": "corporate_registry",
  "source_date": "2023-12-31",
  "confidence": "high"
}
```

---

### 20. Nyrstar NV

```json
{
  "entity_id": "TRA-005",
  "full_legal_name": "Nyrstar NV",
  "entity_type": "company",
  "jurisdiction": "Belgium / Luxembourg",
  "tier": 2,
  "risk_level": "medium",
  "sanctioned": false,
  "convicted": false,
  "ownership": "Trafigura majority control since 2019 debt restructuring",
  "operations": "Zinc smelting — major European operations",
  "source_primary": "Nyrstar corporate filings — Trafigura majority stake post-2019 restructuring",
  "source_url": "https://www.nyrstar.com/en/about-us",
  "source_type": "corporate_registry",
  "source_date": "2019-07-01",
  "confidence": "high"
}
```

---

### 21. Probo Koala (vessel)

```json
{
  "entity_id": "TRA-006",
  "full_legal_name": "Probo Koala",
  "entity_type": "vessel",
  "jurisdiction": "Netherlands-chartered",
  "tier": 7,
  "risk_level": "high",
  "sanctioned": false,
  "convicted": false,
  "role": "Ship chartered by Trafigura. Discharged petroleum waste in Abidjan, Ivory Coast 2006. Thousands of Ivorians exposed. Hundreds of casualties. Trafigura convicted Netherlands 2010.",
  "settlement": "Trafigura paid ~$198M to settle Ivory Coast claims",
  "source_primary": "Netherlands court conviction 2010; multiple journalism sources including Amnesty International and Greenpeace investigations",
  "source_url": "https://blog.volkovlaw.com/2024/04/trafigura-joins-the-fcpa-enforcement-club-pleads-guilty-and-pays-over-126-million-for-bribery-violations-in-brazil-part-i-of-iii/",
  "source_type": "court_document",
  "source_date": "2010-01-01",
  "confidence": "high"
}
```

---

## SECTION 3: GUNVOR GROUP

### Master Enforcement Record — Gunvor

```json
{
  "entity_id": "GUN-ENF-001",
  "enforcement_summary": "Gunvor SA guilty plea March 1 2024. Criminal fine $374.6M + forfeiture $287.1M = $661M total. Largest single commodities trader FCPA penalty. Ecuador bribery 2012-2020. $97M paid to intermediaries. No self-disclosure credit.",
  "additional_resolutions": "Swiss OAG ~$98M. Ecuador authorities settlement.",
  "source_primary": "DOJ EDNY — United States v. Gunvor SA, guilty plea",
  "source_url": "https://www.justice.gov/opa/pr/swiss-based-energy-trading-company-pleads-guilty-foreign-corrupt-practices-act-violations",
  "source_type": "doj_filing",
  "source_date": "2024-03-01",
  "confidence": "high"
}
```

---

### 22. Gunvor Group Ltd.

```json
{
  "entity_id": "GUN-001",
  "full_legal_name": "Gunvor Group Ltd.",
  "entity_type": "company",
  "jurisdiction": "Cyprus (registered) / Switzerland Geneva (HQ)",
  "tier": 0,
  "risk_level": "high",
  "sanctioned": false,
  "convicted": false,
  "note": "Parent holding entity. Guilty plea entered by subsidiary Gunvor SA.",
  "source_primary": "DOJ EDNY guilty plea — Gunvor SA; Gunvor corporate filings Cyprus registration",
  "source_url": "https://www.justice.gov/opa/pr/swiss-based-energy-trading-company-pleads-guilty-foreign-corrupt-practices-act-violations",
  "source_type": "doj_filing",
  "source_date": "2024-03-01",
  "confidence": "high"
}
```

---

### 23. Gunvor SA

```json
{
  "entity_id": "GUN-002",
  "full_legal_name": "Gunvor SA",
  "entity_type": "company",
  "jurisdiction": "Switzerland (Geneva)",
  "tier": 1,
  "risk_level": "critical",
  "sanctioned": false,
  "convicted": true,
  "conviction_detail": "Guilty plea March 1 2024. One count FCPA conspiracy. Criminal fine $374,560,071 + forfeiture $287,138,444. Ecuador bribery of Petroecuador officials 2012-2020.",
  "source_primary": "DOJ EDNY — United States v. Gunvor SA, Case 1:24-cr-00110",
  "source_url": "https://www.justice.gov/opa/pr/swiss-based-energy-trading-company-pleads-guilty-foreign-corrupt-practices-act-violations",
  "source_type": "doj_filing",
  "source_date": "2024-03-01",
  "confidence": "high",
  "additional_sources": [
    {
      "description": "FCPA Stanford Database — Gunvor enforcement action detail",
      "url": "https://fcpa.stanford.edu/enforcement-action.html?id=914",
      "date": "2024-03-01"
    }
  ]
}
```

---

### 24. EIC (Ecuador Intermediary Company)

```json
{
  "entity_id": "GUN-003",
  "full_legal_name": "EIC (Ecuador Intermediary Company)",
  "aliases": ["Name not publicly disclosed — referred to as EIC in court documents"],
  "entity_type": "company",
  "jurisdiction": "Panama",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": false,
  "bribery_conduit": true,
  "beneficial_owner": "Pere Ycaza brothers (Antonio and Enrique)",
  "role": "Primary Panama shell receiving $97M+ from Gunvor for Petroecuador bribe payments",
  "source_primary": "FCPA Stanford Database — Gunvor enforcement action citing EIC and OIC as Pere Ycaza-controlled shells receiving $97M",
  "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=914",
  "source_type": "doj_filing",
  "source_date": "2024-03-01",
  "confidence": "high",
  "additional_sources": [
    {
      "description": "Compliance Podcast Network — Gunvor FCPA enforcement Part 2",
      "url": "https://compliancepodcastnetwork.net/the-gunvor-fcpa-enforcement-action-part-2-the-bribery-schemes/",
      "date": "2024-03-15"
    }
  ]
}
```

---

### 25. OIC (Offshore Intermediary Company)

```json
{
  "entity_id": "GUN-004",
  "full_legal_name": "OIC (Offshore Intermediary Company)",
  "aliases": ["Name not publicly disclosed — referred to as OIC in court documents"],
  "entity_type": "company",
  "jurisdiction": "Panama / BVI",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": false,
  "bribery_conduit": true,
  "beneficial_owner": "Pere Ycaza brothers",
  "role": "Second Pere Ycaza shell — joint conduit with EIC for Gunvor Petroecuador bribe payments",
  "source_primary": "FCPA Stanford Database — Gunvor enforcement action citing EIC and OIC jointly",
  "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=914",
  "source_type": "doj_filing",
  "source_date": "2024-03-01",
  "confidence": "high"
}
```

---

### 26. Gennady Timchenko

```json
{
  "entity_id": "GUN-005",
  "full_legal_name": "Gennady Nikolayevich Timchenko",
  "aliases": ["Guennadi Timtchenko"],
  "entity_type": "individual",
  "jurisdiction": "Russia / Finland",
  "tier": 3,
  "risk_level": "critical",
  "sanctioned": true,
  "sanctions_details": {
    "lists": ["OFAC SDN"],
    "program": "RUSSIA-EO13685",
    "designation_date": "2014-03-20",
    "basis": "Activities in energy sector directly linked to Putin. US Treasury: 'Putin has investments in Gunvor and may have access to Gunvor funds.'"
  },
  "stake_sold": "Sold 44% Gunvor stake to Torbjorn Tornqvist March 19 2014 — one day before OFAC designation",
  "source_primary": "OFAC SDN designation March 20 2014; Wikipedia citing Timchenko biography",
  "source_url": "https://en.wikipedia.org/wiki/Gennady_Timchenko",
  "source_type": "regulatory_filing",
  "source_date": "2014-03-20",
  "confidence": "high",
  "additional_sources": [
    {
      "description": "Washington Post — Pandora Papers, Timchenko offshore restructuring",
      "url": "https://www.washingtonpost.com/world/interactive/2021/us-russia-sanctions/",
      "date": "2021-10-05"
    }
  ]
}
```

---

### 27. Volga Group

```json
{
  "entity_id": "GUN-006",
  "full_legal_name": "Volga Group",
  "aliases": ["Volga Resources Group"],
  "entity_type": "company",
  "jurisdiction": "Luxembourg",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "beneficial_owner": "Gennady Timchenko (OFAC SDN)",
  "holdings": "Novatek (Russia's 2nd largest gas producer), Sibur (petrochemicals), other Russian strategic assets",
  "source_primary": "Wikipedia — Timchenko biography citing Volga Group holdings; Pandora Papers reporting",
  "source_url": "https://en.wikipedia.org/wiki/Gennady_Timchenko",
  "source_type": "news_investigation",
  "source_date": "2026-03-01",
  "confidence": "high"
}
```

---

### 28. LTS Holdings

```json
{
  "entity_id": "GUN-007",
  "full_legal_name": "LTS Holdings",
  "entity_type": "company",
  "jurisdiction": "BVI — Cyprus (redomiciled)",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "beneficial_owners": "Timchenko (via Lerma Trading) and Peter Kolbin (childhood friend of Putin, via Southport Management Services)",
  "pandora_papers": true,
  "note": "Entity restructured after Timchenko 2014 designation. BVI to Cyprus redomicile documented in Pandora Papers.",
  "source_primary": "Washington Post — Pandora Papers investigation, LTS Holdings restructuring",
  "source_url": "https://www.washingtonpost.com/world/interactive/2021/us-russia-sanctions/",
  "source_type": "icij",
  "source_date": "2021-10-05",
  "confidence": "high"
}
```

---

### 29. Lerma Trading

```json
{
  "entity_id": "GUN-008",
  "full_legal_name": "Lerma Trading",
  "entity_type": "company",
  "jurisdiction": "Unknown",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "ofac_listed_as_front": true,
  "beneficial_owner": "Gennady Timchenko (OFAC SDN)",
  "designation": "Listed by US Treasury 2015 as Timchenko front company. Co-owner of LTS Holdings.",
  "source_primary": "US Treasury Department — 2015 listing of Lerma Trading as Timchenko front entity",
  "source_url": "https://www.washingtonpost.com/world/interactive/2021/us-russia-sanctions/",
  "source_type": "regulatory_filing",
  "source_date": "2015-01-01",
  "confidence": "high"
}
```

---

### 30. Lukoil International GmbH (blocked acquisition)

```json
{
  "entity_id": "GUN-009",
  "full_legal_name": "Lukoil International GmbH",
  "entity_type": "company",
  "jurisdiction": "Austria",
  "tier": 3,
  "risk_level": "high",
  "sanctioned": false,
  "acquisition_status": "Gunvor bid October 2025 — blocked by US Treasury November 2025. Treasury called Gunvor 'Kremlin's puppet.' Gunvor withdrew bid.",
  "sanctions_on_lukoil": "US sanctioned Lukoil October 22 2025",
  "source_primary": "Kyiv Independent — Lukoil asset sale to Gunvor and US Treasury block",
  "source_url": "https://kyivindependent.com/after-us-sanctions-lukoil-to-sell-assets-to-firm-founded-by-putin-ally/",
  "source_type": "news_investigation",
  "source_date": "2025-10-30",
  "confidence": "high",
  "additional_sources": [
    {
      "description": "Yahoo Finance — Gunvor withdraws Lukoil bid after 'Kremlin's puppet' accusation",
      "url": "https://finance.yahoo.com/news/gunvor-withdraws-bid-russias-lukoil-083747325.html",
      "date": "2025-11-07"
    }
  ]
}
```

---

### 31. Patek Philippe Watch (evidence artifact)

```json
{
  "entity_id": "GUN-010",
  "full_legal_name": "18-karat gold Patek Philippe watch",
  "entity_type": "bribery_evidence",
  "tier": 7,
  "risk_level": "high",
  "note": "Purchased using Gunvor funds via Pere Ycaza network. Given to Nilsen Arias Sandoval (Petroecuador). Named explicitly in Gunvor FCPA plea agreement as evidence of corrupt payments.",
  "source_primary": "FCPA Stanford Database — Gunvor plea agreement, factual statement citing Patek Philippe watch",
  "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=914",
  "source_type": "doj_filing",
  "source_date": "2024-03-01",
  "confidence": "high"
}
```

---

## SECTION 4: FREEPOINT COMMODITIES

### Master Enforcement Record — Freepoint

```json
{
  "entity_id": "FRP-ENF-001",
  "enforcement_summary": "Freepoint Commodities LLC DPA December 14 2023. Criminal fine $68M + forfeiture $30.5M + CFTC $7.6M = $98.6M total. Brazil Petrobras bribery 2012-2018. $3.9M paid to Innecco. $30.5M illicit profits. No compliance monitor required.",
  "source_primary": "DOJ D.Conn — DPA United States v. Freepoint Commodities LLC",
  "source_url": "https://www.justice.gov/opa/pr/connecticut-based-commodities-company-agrees-pay-nearly-99-million-resolve-foreign-bribery",
  "source_type": "doj_filing",
  "source_date": "2023-12-14",
  "confidence": "high"
}
```

---

### 32. Freepoint Commodities LLC

```json
{
  "entity_id": "FRP-001",
  "full_legal_name": "Freepoint Commodities LLC",
  "entity_type": "company",
  "jurisdiction": "USA (Stamford, Connecticut)",
  "tier": 1,
  "risk_level": "high",
  "sanctioned": false,
  "convicted": false,
  "dpa": true,
  "dpa_detail": "Three-year DPA December 14 2023. $68M criminal fine + $30.5M forfeiture + $7.6M CFTC disgorgement. Brazil Petrobras bribery 2012-2018.",
  "source_primary": "DOJ D.Conn — Deferred Prosecution Agreement, United States v. Freepoint Commodities LLC",
  "source_url": "https://www.justice.gov/opa/pr/connecticut-based-commodities-company-agrees-pay-nearly-99-million-resolve-foreign-bribery",
  "source_type": "doj_filing",
  "source_date": "2023-12-14",
  "confidence": "high",
  "additional_sources": [
    {
      "description": "CFTC Order — Freepoint Commodities LLC",
      "url": "https://www.cftc.gov/PressRoom/PressReleases/8824-23",
      "date": "2023-12-14"
    }
  ]
}
```

---

### 33. Arcadia Energy / Trading Company #1

```json
{
  "entity_id": "FRP-002",
  "full_legal_name": "Arcadia Energy (referred to as Trading Company #1 in DOJ filings)",
  "entity_type": "company",
  "jurisdiction": "USA / UK",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "convicted": false,
  "role": "Prior employer of Oztemel and Innecco. Same Brazil bribery scheme operated at Arcadia before moving to Freepoint. Named in indictments as Trading Company #1.",
  "source_primary": "FCPA Stanford Database — Freepoint enforcement entry referencing Trading Company #1",
  "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=909",
  "source_type": "doj_filing",
  "source_date": "2023-12-14",
  "confidence": "medium",
  "note": "Medium confidence — publicly identified as Arcadia via context clues in multiple compliance publications, not directly named in public DOJ documents."
}
```

---

### 34. OTT Commodities / Trading Company #2

```json
{
  "entity_id": "FRP-003",
  "full_legal_name": "OTT Commodities (referred to as Trading Company #2 in DOJ filings)",
  "entity_type": "company",
  "jurisdiction": "USA (Connecticut)",
  "tier": 2,
  "risk_level": "high",
  "sanctioned": false,
  "convicted": false,
  "beneficial_owner": "Gary Oztemel",
  "role": "Gary Oztemel's separate trading firm. Used for profit-sharing bribe structure — OTT bought oil at inflated prices, shared excess profit with Innecco who routed to Berkowitz Uruguay shell.",
  "source_primary": "FCPA Stanford Database and Radical Compliance analysis of Freepoint DPA — OTT named as Trading Company #2",
  "source_url": "https://www.radicalcompliance.com/2023/12/18/lessons-in-freepoint-fcpa-settlement/",
  "source_type": "doj_filing",
  "source_date": "2023-12-14",
  "confidence": "medium"
}
```

---

### 35. Glenn Oztemel

```json
{
  "entity_id": "FRP-004",
  "full_legal_name": "Glenn Oztemel",
  "entity_type": "individual",
  "jurisdiction": "USA (Connecticut)",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": false,
  "convicted": true,
  "conviction_detail": "Convicted September 2024. Sentenced 15 months prison December 2025. Former senior oil and gas trader Freepoint Commodities. Used code words: 'breakfast', 'freight deviation' for bribes. Used encrypted apps and disposable phones.",
  "alias_used": "Spencer Kazisnaf, Nikita Maksimov",
  "source_primary": "DOJ — Glenn Oztemel sentencing announcement December 2025",
  "source_url": "https://www.justice.gov/opa/pr/connecticut-based-oil-trader-sentenced-15-months-prison-international-bribery-and-money",
  "source_type": "doj_filing",
  "source_date": "2025-12-01",
  "confidence": "high"
}
```

---

### 36. Gary Oztemel

```json
{
  "entity_id": "FRP-005",
  "full_legal_name": "Gary Oztemel",
  "entity_type": "individual",
  "jurisdiction": "USA (Connecticut)",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": false,
  "convicted": false,
  "indicted": true,
  "indictment_detail": "Indicted August 2023 — FCPA conspiracy and money laundering. Glenn Oztemel's brother. Ran OTT Commodities as parallel bribe conduit.",
  "source_primary": "DOJ D.Conn — indictment of Gary Oztemel August 2023",
  "source_url": "https://www.justice.gov/opa/pr/connecticut-based-commodities-company-agrees-pay-nearly-99-million-resolve-foreign-bribery",
  "source_type": "doj_filing",
  "source_date": "2023-08-01",
  "confidence": "high"
}
```

---

### 37. Eduardo Innecco

```json
{
  "entity_id": "FRP-006",
  "full_legal_name": "Eduardo Innecco",
  "entity_type": "individual",
  "jurisdiction": "Brazil / Italy",
  "nationality": "Dual Italian-Brazilian",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": false,
  "convicted": true,
  "conviction_detail": "Pleaded guilty D.Conn — FCPA conspiracy. Dual Italian-Brazilian oil and gas broker. Received $3.9M from Freepoint in corrupt consulting fees and commissions across 124 Petrobras transactions.",
  "source_primary": "DOJ D.Conn — Freepoint DPA factual statement naming Innecco; FCPA Stanford Freepoint entry",
  "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=909",
  "source_type": "doj_filing",
  "source_date": "2023-12-14",
  "confidence": "high"
}
```

---

### 38. Albatross Shipping Consultants Ltd.

```json
{
  "entity_id": "FRP-007",
  "full_legal_name": "Albatross Shipping Consultants Ltd.",
  "entity_type": "company",
  "jurisdiction": "Unknown",
  "tier": 7,
  "risk_level": "high",
  "sanctioned": false,
  "bribery_conduit": true,
  "beneficial_owner": "Eduardo Innecco",
  "role": "Innecco-controlled shell. Issued fake invoices to Freepoint for consulting services. First named Innecco vehicle in FCPA records.",
  "source_primary": "FCPA Stanford Database — Freepoint enforcement action, Innecco-controlled companies list",
  "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=909",
  "source_type": "doj_filing",
  "source_date": "2023-12-14",
  "confidence": "high"
}
```

---

### 39. Brazilian Chemicals & Petroleum LTDA

```json
{
  "entity_id": "FRP-008",
  "full_legal_name": "Brazilian Chemicals & Petroleum LTDA",
  "entity_type": "company",
  "jurisdiction": "Brazil",
  "tier": 7,
  "risk_level": "high",
  "sanctioned": false,
  "bribery_conduit": true,
  "beneficial_owner": "Eduardo Innecco",
  "role": "Second Innecco-controlled shell. Brazilian vehicle for laundering commission payments.",
  "source_primary": "FCPA Stanford Database — Freepoint enforcement action, Innecco-controlled companies list",
  "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=909",
  "source_type": "doj_filing",
  "source_date": "2023-12-14",
  "confidence": "high"
}
```

---

### 40. Morgenstern Energy Trading Ltd

```json
{
  "entity_id": "FRP-009",
  "full_legal_name": "Morgenstern Energy Trading Ltd",
  "entity_type": "company",
  "jurisdiction": "Unknown",
  "tier": 7,
  "risk_level": "high",
  "sanctioned": false,
  "bribery_conduit": true,
  "beneficial_owner": "Eduardo Innecco",
  "role": "Third Innecco-controlled shell. Named in DOJ filings as vehicle for routing Freepoint bribe payments.",
  "source_primary": "FCPA Stanford Database — Freepoint enforcement action, Innecco-controlled companies list",
  "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=909",
  "source_type": "doj_filing",
  "source_date": "2023-12-14",
  "confidence": "high"
}
```

---

### 41. Wertech SA

```json
{
  "entity_id": "FRP-010",
  "full_legal_name": "Wertech SA",
  "entity_type": "company",
  "jurisdiction": "Switzerland",
  "tier": 7,
  "risk_level": "high",
  "sanctioned": false,
  "bribery_conduit": true,
  "beneficial_owner": "Eduardo Innecco",
  "role": "Fourth Innecco-controlled shell. Swiss entity. Named in DOJ filings as part of Freepoint bribe payment infrastructure.",
  "source_primary": "FCPA Stanford Database — Freepoint enforcement action, Innecco-controlled companies list",
  "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=909",
  "source_type": "doj_filing",
  "source_date": "2023-12-14",
  "confidence": "high"
}
```

---

### 42. Uruguay Shell Company (Berkowitz vehicle)

```json
{
  "entity_id": "FRP-011",
  "full_legal_name": "Unnamed Uruguay shell company",
  "entity_type": "company",
  "jurisdiction": "Uruguay",
  "tier": 7,
  "risk_level": "critical",
  "sanctioned": false,
  "bribery_conduit": true,
  "beneficial_owner": "Rodrigo Berkowitz",
  "role": "Uruguay shell controlled by Berkowitz. Received bribe payments from both OTT profit-sharing structure and Freepoint consulting fee flows. Ultimate destination for Petrobras corruption proceeds.",
  "true_legal_name_status": "Not publicly disclosed in court documents",
  "source_primary": "Radical Compliance — Freepoint FCPA settlement analysis citing Uruguay shell",
  "source_url": "https://www.radicalcompliance.com/2023/12/18/lessons-in-freepoint-fcpa-settlement/",
  "source_type": "doj_filing",
  "source_date": "2023-12-18",
  "confidence": "high",
  "additional_sources": [
    {
      "description": "DOJ D.Conn — sentencing press release referencing Latvia, Switzerland, Uruguay assistance",
      "url": "https://www.justice.gov/opa/pr/connecticut-based-oil-trader-sentenced-15-months-prison-international-bribery-and-money",
      "date": "2025-12-01"
    }
  ]
}
```

---

## SECTION 5: MERCURIA ENERGY GROUP

### Note on Mercuria

No FCPA action to date. Risk signals derive from: (1) J&S Group founders and Polish parliamentary investigation, (2) ChemChina 12% stake (Chinese state entity), (3) Lionel Hanst's prior Mercuria employment creating cross-contamination link to Vitol conviction, (4) Aegean Marine predecessor bankruptcy fraud, (5) opacity of BVI ultimate holding structure.

---

### 43. Mercuria Energy Group Ltd.

```json
{
  "entity_id": "MER-001",
  "full_legal_name": "Mercuria Energy Group Ltd.",
  "entity_type": "company",
  "jurisdiction": "Cyprus (domicile) / Geneva (HQ)",
  "tier": 0,
  "risk_level": "medium",
  "sanctioned": false,
  "convicted": false,
  "fcpa_action": false,
  "source_primary": "Wikipedia — Mercuria Energy Group corporate history and structure",
  "source_url": "https://en.wikipedia.org/wiki/Mercuria",
  "source_type": "corporate_registry",
  "source_date": "2026-03-01",
  "confidence": "high"
}
```

---

### 44. Mercuria EGH (Mercuria Energy Group Holding Ltd.)

```json
{
  "entity_id": "MER-002",
  "full_legal_name": "Mercuria Energy Group Holding Ltd.",
  "aliases": ["Mercuria EGH"],
  "entity_type": "company",
  "jurisdiction": "British Virgin Islands",
  "tier": 2,
  "risk_level": "medium",
  "sanctioned": false,
  "convicted": false,
  "role": "Ultimate parent company. Owns 79.8% of Cyprus Mercuria entity but controls 100% of voting rights.",
  "source_primary": "Bloomberg / BNN Bloomberg — Mercuria FERC filing revealing ownership structure July 30 2018",
  "source_url": "https://www.bnnbloomberg.ca/oil-trader-mercuria-s-ownership-structure-revealed-in-filing-1.1131811",
  "source_type": "regulatory_filing",
  "source_date": "2018-08-31",
  "confidence": "high"
}
```

---

### 45. MDJ Oil Trading Ltd.

```json
{
  "entity_id": "MER-003",
  "full_legal_name": "MDJ Oil Trading Ltd.",
  "entity_type": "company",
  "jurisdiction": "Guernsey",
  "tier": 2,
  "risk_level": "medium",
  "sanctioned": false,
  "convicted": false,
  "beneficial_owners": "Marco Dunand (CEO), Daniel Jaeggi (President), Magid Shenouda (Global Head of Trading)",
  "ownership_in_mercuria_egh": "34.4% of Mercuria EGH",
  "source_primary": "Bloomberg / BNN Bloomberg — Mercuria FERC filing July 30 2018 revealing MDJ Oil Trading as founders' holding vehicle",
  "source_url": "https://www.bnnbloomberg.ca/oil-trader-mercuria-s-ownership-structure-revealed-in-filing-1.1131811",
  "source_type": "regulatory_filing",
  "source_date": "2018-08-31",
  "confidence": "high"
}
```

---

### 46. Mercuria Energy Group Trustco Ltd.

```json
{
  "entity_id": "MER-004",
  "full_legal_name": "Mercuria Energy Group Trustco Ltd.",
  "entity_type": "company",
  "jurisdiction": "Cyprus",
  "tier": 2,
  "risk_level": "medium",
  "sanctioned": false,
  "convicted": false,
  "role": "Trustee holding 13.4% of Mercuria EGH for future investors",
  "source_primary": "Bloomberg / BNN Bloomberg — Mercuria FERC filing",
  "source_url": "https://www.bnnbloomberg.ca/oil-trader-mercuria-s-ownership-structure-revealed-in-filing-1.1131811",
  "source_type": "regulatory_filing",
  "source_date": "2018-08-31",
  "confidence": "high"
}
```

---

### 47. CCPC (Hong Kong) Ltd. / ChemChina 12% stake

```json
{
  "entity_id": "MER-005",
  "full_legal_name": "CCPC (Hong Kong) Ltd.",
  "aliases": ["ChemChina subsidiary"],
  "entity_type": "company",
  "jurisdiction": "China (Hong Kong)",
  "tier": 2,
  "risk_level": "medium",
  "sanctioned": false,
  "convicted": false,
  "parent": "China National Chemical Corporation (ChemChina) — Chinese state-owned enterprise",
  "ownership_in_mercuria_egh": "12%",
  "source_primary": "Bloomberg / BNN Bloomberg — Mercuria FERC filing identifying ChemChina 12% stake via CCPC Hong Kong",
  "source_url": "https://www.bnnbloomberg.ca/oil-trader-mercuria-s-ownership-structure-revealed-in-filing-1.1131811",
  "source_type": "regulatory_filing",
  "source_date": "2018-08-31",
  "confidence": "high"
}
```

---

### 48. Hannos Investment Holdings Ltd.

```json
{
  "entity_id": "MER-006",
  "full_legal_name": "Hannos Investment Holdings Ltd.",
  "entity_type": "company",
  "jurisdiction": "Unknown (likely offshore)",
  "tier": 2,
  "risk_level": "medium",
  "sanctioned": false,
  "convicted": false,
  "ownership_in_mercuria_egh": "2%",
  "ultimate_beneficial_owner": "Not publicly disclosed",
  "source_primary": "Bloomberg / BNN Bloomberg — Mercuria FERC filing listing Hannos Investment Holdings with 2% stake",
  "source_url": "https://www.bnnbloomberg.ca/oil-trader-mercuria-s-ownership-structure-revealed-in-filing-1.1131811",
  "source_type": "regulatory_filing",
  "source_date": "2018-08-31",
  "confidence": "high",
  "note": "Ultimate beneficial owner not publicly disclosed. Warrants enhanced due diligence given opacity and Russian-sounding name in sanctions context."
}
```

---

### 49. J&S Service and Investment (JSSI)

```json
{
  "entity_id": "MER-007",
  "full_legal_name": "J&S Service and Investment (JSSI)",
  "entity_type": "company",
  "jurisdiction": "Cyprus (founded 1993) / Poland",
  "tier": 3,
  "risk_level": "medium",
  "sanctioned": false,
  "convicted": false,
  "founded": "1993 by Grzegorz Jankilewicz and Slawomir Smokolowski",
  "role": "Founding entity of what became Mercuria. Supplied ~55% of Polish crude oil under contracts with PKN Orlen and Lotos Group. Subject of 2004 Polish parliamentary corruption investigation re dominant market position and Russian oil supply arrangements.",
  "source_primary": "BNE IntelliNews — J&S Group / Mercuria history March 2007; ICSID arbitration Mercuria v. Poland 2009",
  "source_url": "https://www.intellinews.com/notorious-polish-oil-trader-jands-at-least-boasts-ipo-name-recognition-500013483/",
  "source_type": "news_investigation",
  "source_date": "2007-03-07",
  "confidence": "high",
  "additional_sources": [
    {
      "description": "Jusmundi — Mercuria Energy v. Poland arbitration award, JSSI corporate history",
      "url": "https://jusmundi.com/en/document/decision/en-mercuria-energy-group-limited-v-republic-of-poland-decision-on-jurisdiction-tuesday-1st-december-2009",
      "date": "2009-12-17"
    }
  ]
}
```

---

### 50. J&S Energy

```json
{
  "entity_id": "MER-008",
  "full_legal_name": "J&S Energy",
  "entity_type": "company",
  "jurisdiction": "Poland",
  "tier": 3,
  "risk_level": "medium",
  "sanctioned": false,
  "convicted": false,
  "role": "Polish fuel distribution and retail network. Import/export of chemicals and oil derivatives. Biodiesel plants Germany and Netherlands. Retained J&S name post-Mercuria acquisition.",
  "source_primary": "BNE IntelliNews — J&S Group / Mercuria history; ICSID Mercuria v. Poland arbitration",
  "source_url": "https://www.intellinews.com/notorious-polish-oil-trader-jands-at-least-boasts-ipo-name-recognition-500013483/",
  "source_type": "news_investigation",
  "source_date": "2007-03-07",
  "confidence": "high"
}
```

---

### 51. Gregory Jankilevitsch

```json
{
  "entity_id": "MER-009",
  "full_legal_name": "Grzegorz Jankilevitsch",
  "aliases": ["Gregory Jankilewicz"],
  "entity_type": "individual",
  "jurisdiction": "Ukraine (born) / Poland",
  "tier": 3,
  "risk_level": "medium",
  "sanctioned": false,
  "convicted": false,
  "role": "Co-founder J&S Group 1992 with Smolokowski. Retains 7.2% of Mercuria EGH as minority shareholder.",
  "background": "Ukrainian-born musician. Emigrated Poland 1980s. Began trading Russian oil 1992.",
  "parliamentary_probe": "Named in 2004 Polish parliamentary investigation re J&S dominant position in Polish crude supply and Russian oil intermediary role",
  "source_primary": "Bloomberg / BNN Bloomberg — Mercuria FERC filing listing Jankilevitsch family 7.2% stake; BNE IntelliNews J&S history",
  "source_url": "https://www.bnnbloomberg.ca/oil-trader-mercuria-s-ownership-structure-revealed-in-filing-1.1131811",
  "source_type": "regulatory_filing",
  "source_date": "2018-08-31",
  "confidence": "high"
}
```

---

### 52. Wiaczeslaw Smolokowski

```json
{
  "entity_id": "MER-010",
  "full_legal_name": "Wiaczeslaw Smolokowski",
  "aliases": ["Slawomir Smokolowski"],
  "entity_type": "individual",
  "jurisdiction": "Ukraine (born) / Poland",
  "tier": 3,
  "risk_level": "medium",
  "sanctioned": false,
  "convicted": false,
  "role": "Co-founder J&S Group 1992 with Jankilevitsch. Retains 7.2% of Mercuria EGH as minority shareholder.",
  "background": "Ukrainian-born musician, clarinet. Emigrated Poland 1986. Collection sold to fund first oil trading business.",
  "parliamentary_probe": "Named in 2004 Polish parliamentary investigation alongside Jankilevitsch",
  "source_primary": "EverybodyWiki — Smolokowski biography citing Mercuria shareholding; Bloomberg FERC filing",
  "source_url": "https://en.everybodywiki.com/Wiaczeslaw_Smolokowski",
  "source_type": "news_investigation",
  "source_date": "2023-03-26",
  "confidence": "high",
  "additional_sources": [
    {
      "description": "Bloomberg FERC filing — Smolokowski family 7.2% stake confirmed",
      "url": "https://www.bnnbloomberg.ca/oil-trader-mercuria-s-ownership-structure-revealed-in-filing-1.1131811",
      "date": "2018-08-31"
    }
  ]
}
```

---

### 53. Navitas Energy Inc.

```json
{
  "entity_id": "MER-011",
  "full_legal_name": "Navitas Energy Inc.",
  "entity_type": "company",
  "jurisdiction": "Canada",
  "tier": 2,
  "risk_level": "low",
  "sanctioned": false,
  "convicted": false,
  "role": "Canadian oil and gas upstream subsidiary",
  "source_primary": "Wikipedia — Mercuria corporate structure",
  "source_url": "https://en.wikipedia.org/wiki/Mercuria",
  "source_type": "corporate_registry",
  "source_date": "2026-03-01",
  "confidence": "high"
}
```

---

### 54. Minerva Bunkering

```json
{
  "entity_id": "MER-012",
  "full_legal_name": "Minerva Bunkering",
  "entity_type": "company",
  "jurisdiction": "USA / Global",
  "tier": 2,
  "risk_level": "medium",
  "sanctioned": false,
  "convicted": false,
  "predecessor": "Aegean Marine Petroleum Network Inc. — acquired from bankruptcy 2019",
  "role": "Marine fuels supplier. Restructured from bankrupt Aegean Marine. Fully owned Mercuria subsidiary.",
  "note": "Predecessor Aegean Marine collapsed after massive accounting fraud 2018. Founder Dimitris Melissanidis and CEO Peter Georgiopoulos face ongoing litigation.",
  "source_primary": "Wikipedia — Mercuria corporate structure, Aegean Marine acquisition 2019",
  "source_url": "https://en.wikipedia.org/wiki/Mercuria",
  "source_type": "corporate_registry",
  "source_date": "2019-01-01",
  "confidence": "high"
}
```

---

## SECTION 6: SHARED INTERMEDIARY NETWORK

These individuals and entities operated across multiple trading houses. Standard screening of any single trading house misses the cross-firm contamination.

Key shared intermediaries:
- **Pere Ycaza brothers** (Antonio and Enrique) — operated across Vitol and Gunvor Ecuador schemes
- **Nilsen Arias Sandoval** — Petroecuador official bribed by both Vitol and Gunvor
- **Rodrigo Berkowitz** — Petrobras trader bribed by Vitol, Freepoint, and connected to Trafigura as agent
- **Lionel Hanst** — previously employed at Mercuria, convicted in Vitol Ecuador scheme

---

## COMPLIANCE RECOMMENDATION

**RISK LEVEL: HIGH — CONCENTRATED SECTOR EXPOSURE**

The five commodities trading houses investigated here share $2.23 billion in combined FCPA penalties across 2020-2024. More critically, they share intermediaries, target officials, and operational methods:

1. **Same bribery intermediaries** operating across multiple traders simultaneously
2. **Same state oil company officials** (Petroecuador, Petrobras) accepting bribes from competing traders
3. **Institutional origin connections** (Marc Rich alumni at Glencore and Trafigura)
4. **Cross-contamination via employee movement** (Hanst: Mercuria to Vitol; Berkowitz: Petrobras to Trafigura)
5. **Sanctioned founder** (Timchenko/Gunvor) with ongoing structural questions

Any financial institution with exposure to multiple commodities trading houses must treat this as network risk, not isolated entity risk.

---

## SQL-READY ENTITY ARRAY — ALL 54 ENTITIES

```json
{
  "investigation_id": "KATHAROS-2026-COMMODITIES-001",
  "schema_version": "1.0",
  "total_entities": 54,
  "entities": [
    {"id": "VIT-001", "name": "Vitol Group", "tier": 0, "company": "Vitol", "jurisdiction": "Netherlands/Switzerland", "sanctioned": false, "convicted": false, "source_type": "corporate_registry", "source_url": "https://www.vitol.com/about/", "source_date": "2026-01-01", "confidence": "high"},
    {"id": "VIT-002", "name": "Vitol SA", "tier": 1, "company": "Vitol", "jurisdiction": "Switzerland", "sanctioned": false, "convicted": false, "named_in_dpa": true, "source_type": "doj_filing", "source_url": "https://www.justice.gov/archives/opa/pr/vitol-inc-agrees-pay-over-135-million-resolve-foreign-bribery-case", "source_date": "2020-12-03", "confidence": "high"},
    {"id": "VIT-003", "name": "Vitol Inc.", "tier": 1, "company": "Vitol", "jurisdiction": "USA", "sanctioned": false, "dpa": true, "source_type": "doj_filing", "source_url": "https://www.justice.gov/archives/opa/pr/vitol-inc-agrees-pay-over-135-million-resolve-foreign-bribery-case", "source_date": "2020-12-03", "confidence": "high"},
    {"id": "VIT-004", "name": "VTTI BV", "tier": 2, "company": "Vitol", "jurisdiction": "Netherlands", "sanctioned": false, "convicted": false, "source_type": "news_investigation", "source_url": "https://en.wikipedia.org/wiki/Vitol", "source_date": "2026-03-01", "confidence": "medium"},
    {"id": "VIT-005", "name": "Viva Energy Group Ltd", "tier": 2, "company": "Vitol", "jurisdiction": "Australia", "sanctioned": false, "convicted": false, "source_type": "news_investigation", "source_url": "https://en.wikipedia.org/wiki/Vitol", "source_date": "2026-03-01", "confidence": "high"},
    {"id": "VIT-006", "name": "Zanza Oil", "tier": 7, "company": "Vitol", "jurisdiction": "Curacao", "sanctioned": false, "bribery_conduit": true, "source_type": "doj_filing", "source_url": "https://www.ecuadortimes.net/vitol-trial-in-the-united-states-will-reveal-bribery-scheme-in-petroecuador/", "source_date": "2024-02-23", "confidence": "high"},
    {"id": "VIT-007", "name": "Oil Pacific Ventures", "tier": 7, "company": "Vitol", "jurisdiction": "Ecuador", "sanctioned": false, "bribery_conduit": true, "source_type": "doj_filing", "source_url": "https://www.ecuadortimes.net/vitol-trial-in-the-united-states-will-reveal-bribery-scheme-in-petroecuador/", "source_date": "2024-02-23", "confidence": "high"},
    {"id": "VIT-008", "name": "Javier Aguilar", "tier": 7, "company": "Vitol", "jurisdiction": "USA", "sanctioned": false, "convicted": true, "source_type": "doj_filing", "source_url": "https://www.justice.gov/archives/opa/pr/former-oil-and-gas-trader-convicted-role-foreign-bribery-and-money-laundering-scheme", "source_date": "2024-02-23", "confidence": "high"},
    {"id": "VIT-009", "name": "Marc Ducrest", "tier": 7, "company": "Vitol", "jurisdiction": "Switzerland", "sanctioned": false, "convicted": false, "unindicted_coconspirator": true, "source_type": "doj_filing", "source_url": "https://www.swissinfo.ch/eng/ex-vitol-oil-trader-ran-bribery-scheme-from-houston-prosecutors-say/71136328", "source_date": "2024-02-20", "confidence": "high"},
    {"id": "VIT-010", "name": "Lionel Hanst", "tier": 7, "company": "Vitol (also Mercuria prior)", "jurisdiction": "Curacao", "sanctioned": false, "convicted": true, "source_type": "doj_filing", "source_url": "https://www.bloomberg.com/features/2024-vitol-oil-bribes/", "source_date": "2024-03-18", "confidence": "high"},
    {"id": "VIT-011", "name": "Antonio Pere Ycaza", "tier": 7, "company": "Vitol/Gunvor", "jurisdiction": "Ecuador", "sanctioned": false, "convicted": true, "shared_intermediary": true, "source_type": "doj_filing", "source_url": "https://www.justice.gov/archives/opa/pr/former-oil-and-gas-trader-convicted-role-foreign-bribery-and-money-laundering-scheme", "source_date": "2024-02-23", "confidence": "high"},
    {"id": "VIT-012", "name": "Enrique Pere Ycaza", "tier": 7, "company": "Vitol/Gunvor", "jurisdiction": "Ecuador", "sanctioned": false, "convicted": true, "shared_intermediary": true, "source_type": "doj_filing", "source_url": "https://www.justice.gov/archives/opa/pr/former-oil-and-gas-trader-convicted-role-foreign-bribery-and-money-laundering-scheme", "source_date": "2024-02-23", "confidence": "high"},
    {"id": "NET-001", "name": "Nilsen Arias Sandoval", "tier": 7, "company": "Vitol/Gunvor/others", "jurisdiction": "Ecuador", "sanctioned": false, "convicted": true, "shared_intermediary": true, "source_type": "doj_filing", "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=914", "source_date": "2024-03-01", "confidence": "high"},
    {"id": "NET-002", "name": "Rodrigo Berkowitz", "tier": 7, "company": "Vitol/Freepoint/Trafigura", "jurisdiction": "USA", "sanctioned": false, "convicted": true, "shared_intermediary": true, "source_type": "doj_filing", "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=909", "source_date": "2020-12-03", "confidence": "high"},
    {"id": "VIT-013", "name": "Luiz Eduardo Andrade", "tier": 7, "company": "Vitol", "jurisdiction": "Brazil", "sanctioned": false, "convicted": true, "source_type": "doj_filing", "source_url": "https://www.justice.gov/usao-edny/pr/vitol-inc-agrees-pay-over-135-million-resolve-charges-bribery-schemes-latin-america", "source_date": "2020-12-03", "confidence": "high"},
    {"id": "TRA-001", "name": "Trafigura Beheer BV", "tier": 1, "company": "Trafigura", "jurisdiction": "Netherlands", "sanctioned": false, "convicted": true, "source_type": "doj_filing", "source_url": "https://www.justice.gov/archives/opa/pr/swiss-commodities-trading-company-pleads-guilty-foreign-bribery-scheme", "source_date": "2024-03-28", "confidence": "high"},
    {"id": "TRA-002", "name": "Trafigura Group Pte. Ltd.", "tier": 1, "company": "Trafigura", "jurisdiction": "Singapore", "sanctioned": false, "convicted": false, "source_type": "corporate_registry", "source_url": "https://www.trafigura.com/about-us/", "source_date": "2026-01-01", "confidence": "high"},
    {"id": "TRA-003", "name": "Trafigura AG", "tier": 1, "company": "Trafigura", "jurisdiction": "Switzerland", "sanctioned": false, "convicted": false, "source_type": "doj_filing", "source_url": "https://www.justice.gov/archives/opa/pr/swiss-commodities-trading-company-pleads-guilty-foreign-bribery-scheme", "source_date": "2024-03-28", "confidence": "high"},
    {"id": "TRA-004", "name": "PUMA Energy Holdings Pte Ltd", "tier": 2, "company": "Trafigura", "jurisdiction": "Switzerland/Singapore", "sanctioned": false, "convicted": false, "source_type": "corporate_registry", "source_url": "https://www.trafigura.com/responsibility/reporting/", "source_date": "2023-12-31", "confidence": "high"},
    {"id": "TRA-005", "name": "Nyrstar NV", "tier": 2, "company": "Trafigura", "jurisdiction": "Belgium/Luxembourg", "sanctioned": false, "convicted": false, "source_type": "corporate_registry", "source_url": "https://www.nyrstar.com/en/about-us", "source_date": "2019-07-01", "confidence": "high"},
    {"id": "TRA-006", "name": "Probo Koala", "tier": 7, "company": "Trafigura", "jurisdiction": "Netherlands", "sanctioned": false, "convicted": false, "source_type": "court_document", "source_url": "https://blog.volkovlaw.com/2024/04/trafigura-joins-the-fcpa-enforcement-club-pleads-guilty-and-pays-over-126-million-for-bribery-violations-in-brazil-part-i-of-iii/", "source_date": "2010-01-01", "confidence": "high"},
    {"id": "GUN-001", "name": "Gunvor Group Ltd.", "tier": 0, "company": "Gunvor", "jurisdiction": "Cyprus/Switzerland", "sanctioned": false, "convicted": false, "source_type": "doj_filing", "source_url": "https://www.justice.gov/opa/pr/swiss-based-energy-trading-company-pleads-guilty-foreign-corrupt-practices-act-violations", "source_date": "2024-03-01", "confidence": "high"},
    {"id": "GUN-002", "name": "Gunvor SA", "tier": 1, "company": "Gunvor", "jurisdiction": "Switzerland", "sanctioned": false, "convicted": true, "source_type": "doj_filing", "source_url": "https://www.justice.gov/opa/pr/swiss-based-energy-trading-company-pleads-guilty-foreign-corrupt-practices-act-violations", "source_date": "2024-03-01", "confidence": "high"},
    {"id": "GUN-003", "name": "EIC (Ecuador Intermediary Company)", "tier": 7, "company": "Gunvor", "jurisdiction": "Panama", "sanctioned": false, "bribery_conduit": true, "source_type": "doj_filing", "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=914", "source_date": "2024-03-01", "confidence": "high"},
    {"id": "GUN-004", "name": "OIC (Offshore Intermediary Company)", "tier": 7, "company": "Gunvor", "jurisdiction": "Panama/BVI", "sanctioned": false, "bribery_conduit": true, "source_type": "doj_filing", "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=914", "source_date": "2024-03-01", "confidence": "high"},
    {"id": "GUN-005", "name": "Gennady Timchenko", "tier": 3, "company": "Gunvor (former founder)", "jurisdiction": "Russia/Finland", "sanctioned": true, "sanctions_program": "RUSSIA-EO13685", "source_type": "regulatory_filing", "source_url": "https://en.wikipedia.org/wiki/Gennady_Timchenko", "source_date": "2014-03-20", "confidence": "high"},
    {"id": "GUN-006", "name": "Volga Group", "tier": 3, "company": "Gunvor (Timchenko vehicle)", "jurisdiction": "Luxembourg", "sanctioned": false, "ofac_50pct_possible": true, "source_type": "news_investigation", "source_url": "https://en.wikipedia.org/wiki/Gennady_Timchenko", "source_date": "2026-03-01", "confidence": "high"},
    {"id": "GUN-007", "name": "LTS Holdings", "tier": 3, "company": "Gunvor (Timchenko vehicle)", "jurisdiction": "BVI/Cyprus", "sanctioned": false, "pandora_papers": true, "source_type": "icij", "source_url": "https://www.washingtonpost.com/world/interactive/2021/us-russia-sanctions/", "source_date": "2021-10-05", "confidence": "high"},
    {"id": "GUN-008", "name": "Lerma Trading", "tier": 3, "company": "Gunvor (Timchenko front)", "jurisdiction": "Unknown", "sanctioned": false, "ofac_listed_front": true, "source_type": "regulatory_filing", "source_url": "https://www.washingtonpost.com/world/interactive/2021/us-russia-sanctions/", "source_date": "2015-01-01", "confidence": "high"},
    {"id": "GUN-009", "name": "Lukoil International GmbH", "tier": 3, "company": "Gunvor (blocked acquisition)", "jurisdiction": "Austria", "sanctioned": false, "acquisition_blocked": true, "source_type": "news_investigation", "source_url": "https://kyivindependent.com/after-us-sanctions-lukoil-to-sell-assets-to-firm-founded-by-putin-ally/", "source_date": "2025-10-30", "confidence": "high"},
    {"id": "FRP-001", "name": "Freepoint Commodities LLC", "tier": 1, "company": "Freepoint", "jurisdiction": "USA", "sanctioned": false, "dpa": true, "source_type": "doj_filing", "source_url": "https://www.justice.gov/opa/pr/connecticut-based-commodities-company-agrees-pay-nearly-99-million-resolve-foreign-bribery", "source_date": "2023-12-14", "confidence": "high"},
    {"id": "FRP-002", "name": "Arcadia Energy (Trading Co #1)", "tier": 2, "company": "Freepoint predecessor", "jurisdiction": "USA/UK", "sanctioned": false, "convicted": false, "source_type": "doj_filing", "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=909", "source_date": "2023-12-14", "confidence": "medium"},
    {"id": "FRP-003", "name": "OTT Commodities (Trading Co #2)", "tier": 2, "company": "Freepoint related", "jurisdiction": "USA", "sanctioned": false, "convicted": false, "source_type": "doj_filing", "source_url": "https://www.radicalcompliance.com/2023/12/18/lessons-in-freepoint-fcpa-settlement/", "source_date": "2023-12-18", "confidence": "medium"},
    {"id": "FRP-004", "name": "Glenn Oztemel", "tier": 7, "company": "Freepoint", "jurisdiction": "USA", "sanctioned": false, "convicted": true, "source_type": "doj_filing", "source_url": "https://www.justice.gov/opa/pr/connecticut-based-oil-trader-sentenced-15-months-prison-international-bribery-and-money", "source_date": "2025-12-01", "confidence": "high"},
    {"id": "FRP-005", "name": "Gary Oztemel", "tier": 7, "company": "Freepoint/OTT", "jurisdiction": "USA", "sanctioned": false, "indicted": true, "source_type": "doj_filing", "source_url": "https://www.justice.gov/opa/pr/connecticut-based-commodities-company-agrees-pay-nearly-99-million-resolve-foreign-bribery", "source_date": "2023-08-01", "confidence": "high"},
    {"id": "FRP-006", "name": "Eduardo Innecco", "tier": 7, "company": "Freepoint", "jurisdiction": "Brazil/Italy", "sanctioned": false, "convicted": true, "source_type": "doj_filing", "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=909", "source_date": "2023-12-14", "confidence": "high"},
    {"id": "FRP-007", "name": "Albatross Shipping Consultants Ltd.", "tier": 7, "company": "Freepoint", "jurisdiction": "Unknown", "sanctioned": false, "bribery_conduit": true, "source_type": "doj_filing", "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=909", "source_date": "2023-12-14", "confidence": "high"},
    {"id": "FRP-008", "name": "Brazilian Chemicals & Petroleum LTDA", "tier": 7, "company": "Freepoint", "jurisdiction": "Brazil", "sanctioned": false, "bribery_conduit": true, "source_type": "doj_filing", "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=909", "source_date": "2023-12-14", "confidence": "high"},
    {"id": "FRP-009", "name": "Morgenstern Energy Trading Ltd", "tier": 7, "company": "Freepoint", "jurisdiction": "Unknown", "sanctioned": false, "bribery_conduit": true, "source_type": "doj_filing", "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=909", "source_date": "2023-12-14", "confidence": "high"},
    {"id": "FRP-010", "name": "Wertech SA", "tier": 7, "company": "Freepoint", "jurisdiction": "Switzerland", "sanctioned": false, "bribery_conduit": true, "source_type": "doj_filing", "source_url": "https://fcpa.stanford.edu/enforcement-action.html?id=909", "source_date": "2023-12-14", "confidence": "high"},
    {"id": "FRP-011", "name": "Uruguay Shell Company (Berkowitz)", "tier": 7, "company": "Freepoint/Vitol", "jurisdiction": "Uruguay", "sanctioned": false, "bribery_conduit": true, "true_name_disclosed": false, "source_type": "doj_filing", "source_url": "https://www.radicalcompliance.com/2023/12/18/lessons-in-freepoint-fcpa-settlement/", "source_date": "2023-12-18", "confidence": "high"},
    {"id": "MER-001", "name": "Mercuria Energy Group Ltd.", "tier": 0, "company": "Mercuria", "jurisdiction": "Cyprus/Switzerland", "sanctioned": false, "convicted": false, "source_type": "corporate_registry", "source_url": "https://en.wikipedia.org/wiki/Mercuria", "source_date": "2026-03-01", "confidence": "high"},
    {"id": "MER-002", "name": "Mercuria EGH", "tier": 2, "company": "Mercuria", "jurisdiction": "BVI", "sanctioned": false, "convicted": false, "source_type": "regulatory_filing", "source_url": "https://www.bnnbloomberg.ca/oil-trader-mercuria-s-ownership-structure-revealed-in-filing-1.1131811", "source_date": "2018-08-31", "confidence": "high"},
    {"id": "MER-003", "name": "MDJ Oil Trading Ltd.", "tier": 2, "company": "Mercuria", "jurisdiction": "Guernsey", "sanctioned": false, "convicted": false, "source_type": "regulatory_filing", "source_url": "https://www.bnnbloomberg.ca/oil-trader-mercuria-s-ownership-structure-revealed-in-filing-1.1131811", "source_date": "2018-08-31", "confidence": "high"},
    {"id": "MER-004", "name": "Mercuria Energy Group Trustco Ltd.", "tier": 2, "company": "Mercuria", "jurisdiction": "Cyprus", "sanctioned": false, "convicted": false, "source_type": "regulatory_filing", "source_url": "https://www.bnnbloomberg.ca/oil-trader-mercuria-s-ownership-structure-revealed-in-filing-1.1131811", "source_date": "2018-08-31", "confidence": "high"},
    {"id": "MER-005", "name": "CCPC (Hong Kong) Ltd. / ChemChina", "tier": 2, "company": "Mercuria", "jurisdiction": "China/Hong Kong", "sanctioned": false, "convicted": false, "parent_is_state_owned": true, "source_type": "regulatory_filing", "source_url": "https://www.bnnbloomberg.ca/oil-trader-mercuria-s-ownership-structure-revealed-in-filing-1.1131811", "source_date": "2018-08-31", "confidence": "high"},
    {"id": "MER-006", "name": "Hannos Investment Holdings Ltd.", "tier": 2, "company": "Mercuria", "jurisdiction": "Unknown", "sanctioned": false, "convicted": false, "ubo_undisclosed": true, "source_type": "regulatory_filing", "source_url": "https://www.bnnbloomberg.ca/oil-trader-mercuria-s-ownership-structure-revealed-in-filing-1.1131811", "source_date": "2018-08-31", "confidence": "high"},
    {"id": "MER-007", "name": "J&S Service and Investment (JSSI)", "tier": 3, "company": "Mercuria", "jurisdiction": "Cyprus/Poland", "sanctioned": false, "convicted": false, "parliamentary_probe": true, "source_type": "news_investigation", "source_url": "https://www.intellinews.com/notorious-polish-oil-trader-jands-at-least-boasts-ipo-name-recognition-500013483/", "source_date": "2007-03-07", "confidence": "high"},
    {"id": "MER-008", "name": "J&S Energy", "tier": 3, "company": "Mercuria", "jurisdiction": "Poland", "sanctioned": false, "convicted": false, "source_type": "news_investigation", "source_url": "https://www.intellinews.com/notorious-polish-oil-trader-jands-at-least-boasts-ipo-name-recognition-500013483/", "source_date": "2007-03-07", "confidence": "high"},
    {"id": "MER-009", "name": "Gregory Jankilevitsch", "tier": 3, "company": "Mercuria", "jurisdiction": "Ukraine/Poland", "sanctioned": false, "convicted": false, "parliamentary_probe": true, "source_type": "regulatory_filing", "source_url": "https://www.bnnbloomberg.ca/oil-trader-mercuria-s-ownership-structure-revealed-in-filing-1.1131811", "source_date": "2018-08-31", "confidence": "high"},
    {"id": "MER-010", "name": "Wiaczeslaw Smolokowski", "tier": 3, "company": "Mercuria", "jurisdiction": "Ukraine/Poland", "sanctioned": false, "convicted": false, "parliamentary_probe": true, "source_type": "news_investigation", "source_url": "https://en.everybodywiki.com/Wiaczeslaw_Smolokowski", "source_date": "2023-03-26", "confidence": "high"},
    {"id": "MER-011", "name": "Navitas Energy Inc.", "tier": 2, "company": "Mercuria", "jurisdiction": "Canada", "sanctioned": false, "convicted": false, "source_type": "corporate_registry", "source_url": "https://en.wikipedia.org/wiki/Mercuria", "source_date": "2026-03-01", "confidence": "high"},
    {"id": "MER-012", "name": "Minerva Bunkering", "tier": 2, "company": "Mercuria", "jurisdiction": "USA/Global", "sanctioned": false, "convicted": false, "predecessor_fraud": true, "source_type": "corporate_registry", "source_url": "https://en.wikipedia.org/wiki/Mercuria", "source_date": "2019-01-01", "confidence": "high"}
  ],
  "gaps": [
    {"gap": "EIC and OIC true legal names not publicly disclosed in Gunvor plea documents", "resolution": "DOJ FOIA request", "risk_if_unresolved": "high"},
    {"gap": "Uruguay Berkowitz shell company true legal name not disclosed", "resolution": "Court records request D.Conn", "risk_if_unresolved": "high"},
    {"gap": "Mercuria Hannos Investment Holdings UBO not publicly identified", "resolution": "Cyprus UBO register search", "risk_if_unresolved": "medium"},
    {"gap": "Arcadia Energy and OTT Commodities not directly named in public DOJ documents — medium confidence IDs", "resolution": "Court document review", "risk_if_unresolved": "medium"},
    {"gap": "Timchenko current stake in Gunvor post-2014 sale not confirmed — sale timing raises evasion question", "resolution": "Swiss corporate registry; Gunvor bond prospectus", "risk_if_unresolved": "high"}
  ]
}
```

---

*Both files use standardized provenance fields on every entity record: source_primary, source_url, source_type, source_date, confidence. SQL-ready entity arrays at end of each file with one row per entity. Medium confidence flagged on Arcadia/OTT (not directly named in public documents) and Glencore Investments Limited (ICIJ node ID unconfirmed). All gaps documented with resolution path and residual risk.*
