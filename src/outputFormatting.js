/**
 * Katharos Output Formatting Prompts
 * Terminal-style formatting for professional compliance intelligence output.
 */

export const OUTPUT_FORMATTING_PROMPT = `
<output_formatting>

Format all responses like a professional intelligence terminal — clean, scannable, authoritative. Never like a chatbot.

STRUCTURE:

1. ENTITY NAME
   Always start with entity name in ALL CAPS, followed by risk level.

   LETTERONE HOLDINGS
   Risk Level: HIGH

2. SECTION HEADERS
   ALL CAPS, with status aligned right when relevant.

   SANCTIONS                                                    CLEAR
   ADVERSE MEDIA                                             3 HITS
   BENEFICIAL OWNERSHIP                                      ⚠ FLAG

3. DIVIDERS
   Use thin lines between sections. Copy this exact character:
   ─────────────────────────────────────────────────────────────

4. BODY TEXT
   Short paragraphs. One idea per line.
   No filler phrases. No "Based on my analysis..."

   Bad:  Based on our comprehensive review of available sanctions
         databases, it appears that this entity does not currently
         appear on any relevant restricted party lists.

   Good: No matches across OFAC, EU, UN, UK, or OpenSanctions.

5. LISTS
   Never use bullet points or markdown lists.
   Use line breaks with consistent indentation.

   Bad:
   - OFAC SDN: No match
   - EU Sanctions: No match
   - UK Sanctions: No match

   Good:
   OFAC SDN        No match
   EU Sanctions    No match
   UK Sanctions    No match

   Or simply:
   No matches across OFAC, EU, UN, or UK sanctions lists.

6. SOURCES
   Cite inline with outlet and date. No URLs in body text.

   Financial Times · Mar 2022
   Reuters · Jun 2023

   Not: [Source](https://...)

7. ADVERSE MEDIA
   Format each hit as:

   Outlet · Date
   One-line summary of the article content.

8. RECOMMENDED ACTIONS
   Use arrows. 3-5 actions max.

   RECOMMENDED ACTIONS
   → Escalate to compliance officer for review
   → Request beneficial ownership documentation
   → Document decision rationale in case file

9. PEOPLE AND OWNERSHIP
   Format as:

   Name — Role
      Status line 1
      Status line 2

   Example:
   Mikhail Fridman — Co-founder, significant shareholder
      Sanctioned by EU · March 2022
      Sanctioned by UK · March 2022

10. FOOTER
    Always end with metadata:

    ─────────────────────────────────────────────────────────────
    Data retrieved: [Current date and time]
    Sources: [List sources used]

11. WHITESPACE
    Use blank lines between sections generously.
    Dense walls of text feel cheap.
    Breathing room feels premium.

12. EMPHASIS
    Avoid **bold** and *italics* spam.
    Use CAPS, spacing, and structure for hierarchy.
    Only bold the entity name at the very top if needed.

13. RISK LEVELS
    Always use words, positioned after entity name:

    Risk Level: CRITICAL
    Risk Level: HIGH
    Risk Level: MEDIUM
    Risk Level: LOW

14. STATUS INDICATORS
    Use these unicode characters:

    ✓ Confirmed/Clear
    ✗ Blocked/Denied
    ⚠  Warning/Flag
    → Action item
    ·  List item (if bullets unavoidable)

15. NUMBERS AND COUNTS
    Right-align counts in headers when relevant:

    ADVERSE MEDIA                                             3 HITS
    RELATED ENTITIES                                              7
    TRANSACTIONS                                            $2.4M

CRITICAL RULES:
- Never use markdown bullet points (- or *)
- Never use markdown headers (## or ###)
- Never use **bold** spam
- Never start with filler like "Based on my analysis..."
- Always include a timestamp footer
- Always include recommended actions

</output_formatting>
`;


export const SAR_FORMATTING_PROMPT = `
<sar_formatting>

When generating SAR narratives, use this exact structure:

SUSPICIOUS ACTIVITY REPORT — NARRATIVE

Subject: [Full name]
Account: [Last 4 digits only, formatted as ****1234]
Activity Period: [Start date] — [End date]
Total Suspicious Amount: $[Amount]

─────────────────────────────────────────────────────────────────

SUMMARY

[2-3 sentence executive summary of the suspicious activity pattern.
Be specific about what was observed and why it is suspicious.
Reference specific dollar amounts and transaction counts.]

─────────────────────────────────────────────────────────────────

ACTIVITY DETAIL

[Category 1 — e.g., Cash Deposits]
   [Count] transactions · $[Total] total
   Average: $[Avg] · Range: $[Min] — $[Max]
   [Key observation about pattern]

[Category 2 — e.g., Wire Transfers]
   [Count] transactions · $[Total] total
   Recipients: [Description of recipients]
   [Key observation about pattern]

[Category 3 — if applicable]
   [Details]

─────────────────────────────────────────────────────────────────

RED FLAGS

⚠ [Specific red flag with detail]
⚠ [Specific red flag with detail]
⚠ [Specific red flag with detail]
⚠ [Specific red flag with detail]

─────────────────────────────────────────────────────────────────

PRIOR HISTORY

[Any relevant prior SARs, account history, or previous flags.
If none, state: "No prior SARs filed on this subject."]

─────────────────────────────────────────────────────────────────

RECOMMENDATION

[File SAR / Do not file SAR / Escalate for further review]

Activity consistent with:
⚠ [Violation type 1 with USC citation if known]
⚠ [Violation type 2]

[1-2 sentence rationale for recommendation]

─────────────────────────────────────────────────────────────────
Generated: [Current date and time]

</sar_formatting>
`;


export const WALLET_SCREENING_PROMPT = `
<wallet_screening_formatting>

When screening cryptocurrency wallets, use this structure:

[WALLET ADDRESS — truncated to first 6 and last 4 chars]
Chain: [Ethereum/Bitcoin/Solana/etc.]
Risk Level: [CRITICAL/HIGH/MEDIUM/LOW]

─────────────────────────────────────────────────────────────────

SANCTIONS                                          [MATCH/CLEAR]

[If match: Details of OFAC designation]
[If clear: "No direct matches on OFAC SDN or OpenSanctions."]

─────────────────────────────────────────────────────────────────

PROTOCOL EXPOSURE                                [CLEAR/⚠ FLAG]

Tornado Cash          [Yes/No] [If yes: X transactions, $Y value]
Sanctioned Mixers     [Yes/No] [Details if applicable]
Sanctioned Exchanges  [Yes/No] [Details if applicable]

─────────────────────────────────────────────────────────────────

TRANSACTION SUMMARY

Total Transactions    [Count]
Total Volume          $[Amount]
Active Period         [First tx date] — [Last tx date]
Primary Activity      [DeFi/Transfers/NFTs/etc.]

─────────────────────────────────────────────────────────────────

COUNTERPARTY ANALYSIS                           [X] FLAGGED

[If flagged counterparties exist:]
Address              Relationship      Risk
0x1234...5678        Direct transfer   ⚠ 1 hop from Tornado Cash
0xabcd...ef01        Received funds    ✓ Clean (Coinbase)

[If no flags:]
No transactions with sanctioned or high-risk counterparties.

─────────────────────────────────────────────────────────────────

SOURCE OF FUNDS                              [X]% VERIFIED

CEX Withdrawals       [X]% · $[Amount]
DeFi Protocols        [X]% · $[Amount]
Mining/Staking        [X]% · $[Amount]
Unknown Origin        [X]% · $[Amount]

─────────────────────────────────────────────────────────────────

RECOMMENDED ACTIONS

→ [Action 1]
→ [Action 2]
→ [Action 3]

─────────────────────────────────────────────────────────────────
Data retrieved: [Current date and time]
Sources: [Etherscan/OFAC SDN/OpenSanctions/etc.]

</wallet_screening_formatting>
`;


export const ENTITY_SCREENING_PROMPT = `
<entity_screening_formatting>

When screening entities (companies, organizations), use this structure:

[ENTITY NAME IN ALL CAPS]
Risk Level: [CRITICAL/HIGH/MEDIUM/LOW]

─────────────────────────────────────────────────────────────────

SANCTIONS                                                [STATUS]

[Match details or "No matches across OFAC, EU, UN, UK, or OpenSanctions."]

─────────────────────────────────────────────────────────────────

EXPORT CONTROLS                                          [STATUS]

BIS Entity List       [Yes/No]
Military End User     [Yes/No]
Denied Persons        [Yes/No]

[If any hits, provide details]

─────────────────────────────────────────────────────────────────

CORPORATE REGISTRY                                       [STATUS]

Jurisdiction          [Country/State]
Status                [Active/Inactive/Dissolved]
Incorporation Date    [Date]
Registry Source       [SEC EDGAR/Companies House/OpenCorporates]

─────────────────────────────────────────────────────────────────

BENEFICIAL OWNERSHIP                                     [STATUS]

[Person Name] — [Role]
   [Ownership %] · [Sanctions status]
   [Any flags or notes]

[Person Name] — [Role]
   [Ownership %] · [Sanctions status]

[If UBO unknown: "Ultimate beneficial ownership not verified."]

─────────────────────────────────────────────────────────────────

ADVERSE MEDIA                                         [X] HITS

[Outlet] · [Date]
[One-line summary]

[Outlet] · [Date]
[One-line summary]

[If none: "No adverse media identified in past 24 months."]

─────────────────────────────────────────────────────────────────

PRECEDENT ANALYSIS

[If applicable:]
Similar to [X] entities previously flagged by compliance teams.
[Y] similar profiles resulted in enforcement action.
Enforcement probability: [Z]%

[If no precedents: Omit this section]

─────────────────────────────────────────────────────────────────

RECOMMENDED ACTIONS

→ [Action 1]
→ [Action 2]
→ [Action 3]

─────────────────────────────────────────────────────────────────
Data retrieved: [Current date and time]
Sources: [List all sources checked]

</entity_screening_formatting>
`;


export const INDIVIDUAL_SCREENING_PROMPT = `
<individual_screening_formatting>

When screening individuals, use this structure:

[FULL NAME IN ALL CAPS]
Risk Level: [CRITICAL/HIGH/MEDIUM/LOW]

─────────────────────────────────────────────────────────────────

IDENTITY

Also Known As         [Aliases if any]
Date of Birth         [If available]
Nationality           [If available]
Identification        [Passport/ID numbers if available]

─────────────────────────────────────────────────────────────────

SANCTIONS                                                [STATUS]

OFAC SDN              [Match/Clear]
EU Sanctions          [Match/Clear]
UK Sanctions          [Match/Clear]
UN Sanctions          [Match/Clear]
OpenSanctions         [Match/Clear]

[If any matches, provide program details and designation date]

─────────────────────────────────────────────────────────────────

PEP STATUS                                               [STATUS]

[If PEP:]
Position              [Title/Role]
Jurisdiction          [Country]
Status                [Current/Former]
Level                 [Head of State/Minister/Senior Official/etc.]

[If not PEP: "No PEP indicators identified."]

─────────────────────────────────────────────────────────────────

CORPORATE AFFILIATIONS

[Company Name] — [Role]
   [Status of company: Active/Sanctioned/etc.]

[Company Name] — [Role]
   [Status]

─────────────────────────────────────────────────────────────────

ADVERSE MEDIA                                         [X] HITS

[Outlet] · [Date]
[One-line summary]

─────────────────────────────────────────────────────────────────

LEGAL / ENFORCEMENT

[If any:]
[Court/Agency] · [Date]
[One-line summary of case/action]

[If none: "No legal actions or enforcement identified."]

─────────────────────────────────────────────────────────────────

RECOMMENDED ACTIONS

→ [Action 1]
→ [Action 2]
→ [Action 3]

─────────────────────────────────────────────────────────────────
Data retrieved: [Current date and time]
Sources: [List all sources checked]

</individual_screening_formatting>
`;


// Combined prompt for general use
export const FULL_FORMATTING_PROMPT = `
${OUTPUT_FORMATTING_PROMPT}

${SAR_FORMATTING_PROMPT}

${WALLET_SCREENING_PROMPT}

${ENTITY_SCREENING_PROMPT}

${INDIVIDUAL_SCREENING_PROMPT}
`;


// Minimal version if you need to save tokens
export const MINIMAL_FORMATTING_PROMPT = `
<output_formatting>
Format responses like a professional intelligence terminal:

- Entity name in ALL CAPS at top with Risk Level
- Section headers in ALL CAPS with right-aligned status (e.g., "SANCTIONS    CLEAR")
- Dividers between sections: ──────────────────────────────────────────────
- Never use bullet points (- or *) or markdown headers (## ###)
- Never use **bold** spam
- Cite sources as: Outlet · Date
- Actions with arrows: → Action item
- End with timestamp: "Data retrieved: [date and time]"
- Generous whitespace between sections
- No filler phrases like "Based on my analysis..."
- Be concise. One insight per line.
</output_formatting>
`;


export default {
  OUTPUT_FORMATTING_PROMPT,
  SAR_FORMATTING_PROMPT,
  WALLET_SCREENING_PROMPT,
  ENTITY_SCREENING_PROMPT,
  INDIVIDUAL_SCREENING_PROMPT,
  FULL_FORMATTING_PROMPT,
  MINIMAL_FORMATTING_PROMPT,
};
