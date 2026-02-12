# Katharos Product Architecture

```
                                    KATHAROS
                        AI-Powered Compliance Intelligence

================================================================================

                              USER INTERFACE

  +------------------+  +------------------+  +------------------+
  |   KYC SCREENING  |  | CASE INVESTIGATION|  |   MONITORING     |
  |                  |  |                  |  |                  |
  | Screen individuals| | Upload documents | | Real-time alerts |
  | Screen entities  | | AI chat analysis | | Auto re-screening|
  | Screen wallets   | | Multi-case mgmt  | | Risk changes     |
  | View history     | | Evidence tracking| | Sanctions hits   |
  +--------+---------+  +--------+---------+  +--------+---------+
           |                      |                      |
           +----------------------+----------------------+
                                  |
                          +-------v-------+
                          |  RESULTS VIEW |
                          |               |
                          | Risk badge    |  +------------------+
                          | Analysis tabs |  | NETWORK GRAPH    |
                          | Risk factors  |  | D3 force-directed|
                          | Adverse media |  | Entity mapping   |
                          | Recommendations|  +------------------+
                          | PDF export    |
                          | Keep Exploring|  +------------------+
                          +-------+-------+  | PDF EXPORT       |
                                  |          | html2canvas + PDF|
                                  |          | Pixel-perfect    |
                                  |          +------------------+
================================================================================

                            API LAYER (Vercel Serverless)

  +------------------------------------------------------------------+
  |                                                                    |
  |  POST /api/screening/unified    (Master endpoint - 5 min timeout) |
  |                                                                    |
  |  POST /api/stream               (SSE streaming for AI chat)       |
  |  POST /api/messages             (Non-streaming AI proxy)          |
  |  POST /api/rag                  (Pinecone vector search)          |
  |  POST /api/extract-pdf          (Document text extraction)        |
  |                                                                    |
  +------------------------------+-------------------------------------+
                                 |
================================================================================

                    UNIFIED SCREENING PIPELINE
                    All 13 layers run in parallel

  +-------------------------------------------------------------------+
  |                                                                     |
  |  +-----------+  +-----------+  +-----------+  +-----------+        |
  |  |  LAYER 1  |  |  LAYER 2  |  |  LAYER 3  |  |  LAYER 4  |       |
  |  |   OFAC    |  |   PEP     |  |  ADVERSE  |  |   WEB     |       |
  |  | SDN List  |  | Screening |  |   MEDIA   |  |  INTEL    |       |
  |  +-----------+  +-----------+  +-----------+  +-----------+        |
  |                                                                     |
  |  +-----------+  +-----------+  +-----------+  +-----------+        |
  |  |  LAYER 5  |  |  LAYER 6  |  |  LAYER 7  |  |  LAYER 8  |       |
  |  |  COURT    |  |   OCCRP   |  | CORPORATE |  |REGULATORY |       |
  |  | RECORDS   |  |   ALEPH   |  | REGISTRIES|  |ENFORCEMENT|       |
  |  +-----------+  +-----------+  +-----------+  +-----------+        |
  |                                                                     |
  |  +-----------+  +-----------+  +-----------+  +-----------+        |
  |  |  LAYER 9  |  | LAYER 10  |  | LAYER 11  |  | LAYER 12  |       |
  |  |BLOCKCHAIN |  | SHIPPING  |  |ICIJ/SEC/  |  | OWNERSHIP |       |
  |  |  CHAINS   |  |  & TRADE  |  |WORLD BANK |  | ANALYSIS  |       |
  |  +-----------+  +-----------+  +-----------+  +-----------+        |
  |                                                                     |
  |                    +--LAYER 13--+                                   |
  |                    | SANCTIONS  |                                   |
  |                    |ANNOUNCEMENTS|                                  |
  |                    +------------+                                   |
  |                                                                     |
  +---------------------------+----------------------------------------+
                              |
                              v
  +-------------------------------------------------------------------+
  |                                                                     |
  |                    ADVERSE MEDIA KEYWORD ENGINE                     |
  |                    8 categories, ~80 regex patterns                 |
  |                                                                     |
  |  Financial Crime | Sanctions | Organized Crime | Regulatory/Legal  |
  |  Corporate       | AML       | High-Risk       | Cyber/Modern     |
  |                                                                     |
  |  + Negative keywords (acquitted, dismissed, cleared)               |
  |  + Severity weights: CRITICAL > HIGH > MEDIUM > LOW               |
  |                                                                     |
  +-------------------------------------------------------------------+
                              |
                              v
================================================================================

                         AI ANALYSIS ENGINE

  +-------------------------------------------------------------------+
  |                                                                     |
  |                    Claude (Anthropic API)                           |
  |                                                                     |
  |  Input:  All 13 screening layer results + documents + context      |
  |                                                                     |
  |  Output:                                                           |
  |    - Overall Risk Score (0-100) + Level (CRITICAL/HIGH/MED/LOW)   |
  |    - Executive Summary                                             |
  |    - Sanctions status + match details                              |
  |    - PEP status + positions                                        |
  |    - Adverse media findings + source URLs                          |
  |    - Ownership analysis (OFAC 50% Rule)                           |
  |    - Risk factors with severity                                    |
  |    - Regulatory guidance (OFAC, EU, AML directives)               |
  |    - Onboarding decision (SAFE / CONDITIONAL / REJECT)            |
  |    - Recommended next steps                                        |
  |                                                                     |
  +-------------------------------------------------------------------+

================================================================================

                      EXTERNAL DATA SOURCES (20+)

  SANCTIONS LISTS          CORPORATE REGISTRIES     INVESTIGATIVE DATA
  +-----------------+      +-----------------+      +-----------------+
  | OFAC SDN (Live) |      | OpenCorporates  |      | OCCRP Aleph     |
  | OpenSanctions   |      | UK Companies    |      | ICIJ Offshore   |
  | EU/UK/UN Lists  |      |   House         |      |   Leaks         |
  | (via web search)|      | SEC EDGAR       |      | Wikidata        |
  +-----------------+      +-----------------+      +-----------------+

  COURT & REGULATORY       MEDIA & NEWS             BLOCKCHAIN
  +-----------------+      +-----------------+      +-----------------+
  | CourtListener   |      | GDELT           |      | Etherscan       |
  | SEC Enforcement |      | Google News RSS |      | Bitcoin/        |
  | World Bank      |      | NewsAPI         |      |   Blockchair    |
  |   Debarment     |      | MediaCloud      |      | Solscan         |
  | FinCEN          |      | Wayback Machine |      | Tronscan        |
  +-----------------+      | Claude Web      |      | BSCScan         |
                           |   Search        |      | Polygonscan     |
  TRADE & MARITIME         +-----------------+      | OFAC Wallet     |
  +-----------------+                               |   Lists         |
  | UN Comtrade     |      STORAGE & MEMORY         +-----------------+
  | MarineTraffic   |      +-----------------+
  | Equasis         |      | Supabase (DB)   |
  | VesselFinder    |      | Pinecone (RAG)  |
  +-----------------+      | Stripe (Billing)|
                           +-----------------+

================================================================================

                         SCREENING FLOW SUMMARY

  User Query ──> Unified API ──> 13 Parallel Layers ──> Results Aggregation
                                                               |
                                                               v
                                                     Claude AI Analysis
                                                               |
                                                               v
                                                  Structured JSON Response
                                                               |
                                                               v
                                          Risk Badge + Full Report + Network Graph
```
