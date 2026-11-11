# MASTER_HACKATHON_REFERENCE.md — PayPal AI Hackathon 2026 Strategic Blueprint

> **Event:** PayPal AI Hackathon 2026 (Devpost: paypalaihackathon.devpost.com)  
> **Total Prize Pool:** $69,750 ($67,500 Cash + $2,250 Render Credits)  
> **System:** VeriSettle AI — Autonomous B2B Escrow, Multimodal 3-Way Invoice Reconciliation & Dispute Defense OS  
> **Core Architectural Law:** "AI/ML Proposes, Deterministic Policy Disposes, PayPal Executes."

---

## 1. Hackathon Mechanics & Section 8 Prize Stacking
- **Maximum Prize Ceiling:** $17,000 cash for a single project (Overall 1st $12,000 + Best Use of AG Grid $5,000).
- **Stage 1 Pass/Fail Gates:**
  1. Live working prototype executing real PayPal Sandbox APIs.
  2. Public Open-Source MIT License file visible in GitHub root.
  3. No secrets committed.
  4. Video demo under 3 minutes.
- **Stage 2 Scoring:** All ties broken by **Technological Implementation**.

---

## 2. Multi-Sponsor Tooling Alignments
1. **AG Grid / AG Studio:**
   - 10-table relational schema joining 9 PayPal tables (`Customers`, `Invoices`, `Invoice Line Items`, `Invoice Payments`, `Products`, `Plans`, `Transactions`, `Payouts`, `Balances`) with Table 10: `ML Risk & 3-Way Match Audits`.
   - Custom `type: 'money'` currency formatting, status badges, clickable `PayPal-Debug-Id` chips.
2. **APIMatic:**
   - Build-time grounding via `paypaldev/server-sdk-context-plugin-preview` and `@paypal/paypal-server-sdk@2.5.0`.
3. **Bryntum:**
   - Finish-to-Start (FS) interactive escrow Gantt schedule modeling:
     - `M1`: Channel3 Quote & 30% Order Authorization Deposit
     - `M2`: Carrier Transit & LayoutLMv3 Multimodal Invoice QA
     - `M3`: 3-Way Match Verification & 70% PayPal Capture / Release
4. **Channel3:**
   - Multi-merchant B2B catalog discovery and category price norms for anomaly z-scores.
5. **Render:**
   - Unified `render.yaml` deployment specification for Next.js 16 Web Command Center + Python FastAPI ML service.

---

## 3. Cosmos.AI MCP Architecture & Two-Step Pattern
PayPal's internal Cosmos.AI MCP Gateway enforces:
1. **Two-Step Meta-Tool Discovery:** Agents start only with `tool_search` and `execute_tool`.
2. **Double Authorization:** Permissions validated at discovery and re-verified at execution.
3. **Read-Only vs. Mutation Separation:** Discovery tools (`get_order`, `list_invoices`) are read-only. Financial mutations require formal proposals (`propose_escrow_settlement`) validated by a deterministic policy monitor.
4. **FIPS 180-4 SHA-256 Approval Digest:** Canonical JSON hash over recipient, amount, and verification evidence.
