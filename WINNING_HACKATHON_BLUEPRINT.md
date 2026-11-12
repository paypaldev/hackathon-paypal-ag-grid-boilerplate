# WINNING HACKATHON BLUEPRINT — VeriSettle AI
## Master Idea, Feature, UI Style & Multi-Sponsor Integration Specification

**Event:** PayPal AI Hackathon 2026 (Devpost)  
**Target Prize Stack:** Max $17,000 Alignment (Overall 1st Place $12,000 + Best Use of AG Grid $5,000, plus eligibility for APIMatic, Bryntum, Channel3, and Render awards)  
**Core Architectural Law:** *"AI/ML Proposes, Deterministic Policy Disposes, PayPal Executes."*

---

## 1. Unified Project Architecture (How All 4 Ideas Fit Together)

VeriSettle AI unifies the four highest-value hackathon concepts into a single enterprise command center.

| Module / Idea Layer | Target Track | Core Problem Solved | How It Works Inside Your App |
|---|---|---|---|
| **Core OS: VeriSettle AI**<br/>(Autonomous Milestone Escrow, 3-Way Match & Dispute Defense) | Overall 1st ($12,000) + AG Grid 1st ($5,000) | B2B buyers and merchants lose margin to overbilled supplier invoices, unprofitable early-payment discounts, and costly chargebacks. | Locks funds via PayPal Orders v2 (`intent: "AUTHORIZE"`), parses supplier PDFs via LayoutLMv3 + Gemini, captures via Authorizations v2 only if 3-way match variance $\le 1.5\%$, gates Invoicing v2 discounts via EV math, and triages Disputes v1. |
| **Module A: CollusionGuard MCP**<br/>(Graph + Sequence Spend Firewall) | Best Use of PayPal + AI ($5,000) + APIMatic ($1,000) | Autonomous AI agents can be prompt-injected into overspending or tricked by sybil merchant collusion rings. | Implements PayPal's Cosmos.AI Two-Step MCP Gateway (`tool_search` + `execute_tool`), scores counterparties in $<50\text{ms}$ using GAT + LSTM Autoencoder + Leak-Free XGBoost, and verifies a FIPS 180-4 SHA-256 digest against `PAYPAL.md` before any money moves. |
| **Module B: MarginPulse Bandit**<br/>(Dynamic B2B Invoice Terms Optimizer) | Most Impactful ($5,000) + Bryntum ($1,000) | Blanket "2/10 net 30" discounts cost $\sim 37\%$ APR and surrender margin when clients would have paid on time anyway. | Uses leak-free XGBoost (0.7830 ROC AUC on 41,555 closed B2B invoices) and an Expected-Value Skeptic Gate to dynamically select 2/10 net 30, 1/10 net 30, or 0% on Invoicing v2, auto-resetting to full price if unpaid after Day 10. |
| **Module C: RestockPilot & SmartPay**<br/>(Forecasting + AP2 Spend Mandate) | Best Use of Agentic Commerce ($5,000) + Channel3 ($1,500) | Small shops and freelancers run out of stock or struggle to forecast cashflow and catch outlier unit prices. | Computes 80% demand/cashflow prediction intervals (Holt-Winters / ETS fallback), flags outlier prices against Channel3 multi-merchant norms using robust Z-scores, and enforces an AP2-style JSON Spend Mandate card. |

---

## 2. Complete Winning Feature Checklist (10 High-Impact Features)

1. **Judge 1-Click Live Sandbox Verification Bar:**  
   A persistent top toolbar featuring 6 instant judge actions:
   - *1-Click Sandbox Escrow Auth:* Places a real PayPal Orders v2 (`intent: "AUTHORIZE"`) hold with on-screen `PayPal-Debug-Id`.
   - *Inject +5% Tampered Supplier Invoice:* Triggers automatic fail-closed capture freeze ($5.0\% > 1.5\%$).
   - *Inject INSTRUMENT_DECLINED Chaos:* Sends `PayPal-Mock-Response` to verify error handling and audit logging.
   - *Channel3 Market Norm:* Multi-merchant catalog price distribution and Z-score verification.
   - *Gemini 3-Way Match:* Multimodal invoice extraction with field-level confidence.
   - *Reset Demo State:* Restores clean baseline records idempotently.

2. **Multimodal 3-Way Match Engine:**  
   Extracts `company_name`, `invoice_date` (YYYY-MM-DD), `invoice_number`, and `total_amount` using Google Gemini 2.5 Flash with fallback OCR, cross-checking against the approved Purchase Order and Channel3 catalog quote.

3. **Deterministic Partial-Delivery Clamp:**  
   If an agent proposes capturing 100% of an authorization hold when the verified delivery note confirms only 70% delivery, the policy engine deterministically overrides the capture to exactly 70% ($1,715.00) and records the audit reason.

4. **Leak-Free Tabular + Graph + Sequence Risk Engine:**  
   Computes prior-timestamp categorical frequency encoding $f_e = \frac{n_e}{n}$, GAT counterparty collusion score, and 50-transaction sequence reconstruction error with Extreme Value Theory (EVT) tail anomaly probability:
   $$L_{\text{recon}} = \sum_{t=1}^{T} \|x_t - \hat{x}_t\|^2, \quad P(X > z) = 1 - \exp\left(-\exp\left(-\frac{z - \mu}{\sigma}\right)\right)$$

5. **Invoicing v2 Early-Payment Discount "Skeptic Gate":**  
   Evaluates expected value before offering "2/10 net 30" discount terms:
   $$EV_{\text{discount}} = p_{\text{accel}} \cdot V \cdot \left((1 - d) - \frac{1}{(1 + r_{\text{daily}})^{\Delta t}}\right) - p_{\text{on\_time}} \cdot (d \cdot V)$$
   Blocks negative-EV discounts and logs exact preserved margin ($+\$2,450.00$).

6. **Disputes v1 Expected-Cost Chargeback Triage & Rebuttal Generator:**  
   Compares:
   $$\text{Cost}_{\text{fight}} = (1 - p_{\text{win}})(D + F) + C_{\text{prep}}, \quad \text{Cost}_{\text{accept}} = D, \quad \text{Cost}_{\text{offer}} = p_{\text{offer}} S + (1 - p_{\text{offer}})\text{Cost}_{\text{fight}}$$
   Caps LLM win-rate adjustments strictly to $[-0.15, +0.15]$ and generates clickable `[ID: ...]` citations.

7. **Cosmos.AI Two-Step MCP Gateway:**  
   Implements PayPal's two-step pattern (`tool_search` + `execute_tool`). Scopes `@paypal/agent-toolkit` strictly to read-only discovery tools and requires formal proposals for all money movement.

8. **`PAYPAL.md` Spend Constitution & FIPS 180-4 SHA-256 Digest Gate:**  
   Enforces weekly budget caps ($25,000), single-order limits ($5,000), allowed categories, and computes a cryptographic SHA-256 approval digest over canonical JSON before any payment execution.

9. **Demand & Cashflow Probabilistic Forecaster:**  
   Computes days-of-cover and 80% prediction intervals using Holt-Winters exponential smoothing, ensuring purchasing agents never order outside authorized demand projections.

10. **Live Telemetry & PayPal-Debug-Id Audit Drawer:**  
    Every outbound PayPal REST call logs timestamp, HTTP method, path, status, latency in milliseconds, `PayPal-Request-Id`, and `PayPal-Debug-Id` in a real-time collapsible terminal inspector.

---

## 3. UI Style & Design System Specification ("Enterprise Fintech Command Center")

### 3.1 Design Tokens (Tailwind CSS)
- **Canvas Background:** `#0B0F17` (Deep Obsidian Dark) / `#F8FAFC` (Slate-50 Light)
- **Card Surface:** `#111827` (Slate-900) with 1px solid `#1F2937` (Slate-800) border
- **PayPal Brand Accent:** Deep Navy `#003087` and Action Blue `#1A73E8`
- **Semantic Badges:**
  - *PASS / VERIFIED:* `#E6F4EA` bg, `#137333` text, `#81C995` border (Emerald)
  - *NEEDS APPROVAL / HOLD:* `#FEF7E0` bg, `#B06000` text, `#FCC934` border (Amber)
  - *BLOCKED / FAIL-CLOSED:* `#FCE8E6` bg, `#C5221F` text, `#F28B82` border (Crimson)
- **Monospace Financial Numbers:** `JetBrains Mono` / `Geist Mono` (`font-mono`, `tabular-nums`)

### 3.2 Five-Zone Command Center Layout (`/dashboard`)
- **Zone 1 (Sticky Header):** App branding, Sandbox environment pill, and Judge 1-Click Live Test Bar.
- **Zone 2 (KPI Bento Row):** 4 cards showing Active Escrow Holds, 3-Way Match Pass Rate, Model Risk, and Preserved Margin.
- **Zone 3 (AG Studio / AG Grid Relational Workspace):** 10-table explorer joining 9 PayPal tables with ML Risk & 3-Way Match Audits.
- **Zone 4 (Bryntum Gantt & Economic Workbenches):** Interactive milestone dependency timeline paired with Invoicing, Disputes, CollusionGuard, MarginPulse, and AP2 simulators.
- **Zone 5 (Cosmos.AI & PayPal REST Audit Drawer):** Collapsible real-time inspector for `tool_search`, `execute_tool`, SHA-256 digests, and `PayPal-Debug-Id`.

---

## 4. Multi-Sponsor Integration Matrix

| Sponsor Partner | Prize Track | Exact Package / Endpoint | Implementation Evidence |
|---|---|---|---|
| **AG Grid / AG Studio** | **Best Use of AG Grid ($5,000)** | `ag-grid-react`, `ag-grid-community`, `ag-studio`, `ag-studio-react` | 10-table relational ledger, `type: 'money'` cells, and visual report designer. |
| **APIMatic** | **Best Use of APIMatic ($1,000)** | `@paypal/paypal-server-sdk@2.5.0` + APIMatic Context Plugin | Build-time API grounding eliminating deprecated SDK hallucination. |
| **Bryntum** | **Best Use of Bryntum ($1,000)** | Interactive Finish-to-Start (FS) Gantt Schedule | Milestone dependencies ($M_1 \to M_2 \to M_3$) tied directly to payment authorization holds. |
| **Channel3** | **Best Use of Channel3 ($1,500)** | `@channel3/sdk` + REST catalog search | Multi-merchant price norms and category anomaly Z-score detection. |
| **Render** | **Best Use of Render ($1,000 Credits)** | `render.yaml` multi-service blueprint | Next.js 16 Web Command Center + Python FastAPI ML service deployment. |
