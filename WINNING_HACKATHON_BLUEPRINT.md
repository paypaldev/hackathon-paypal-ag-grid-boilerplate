# PART 1: Unified Ideas, Features, UI Style & Integrations (WINNING_HACKATHON_BLUEPRINT.md)

Save this section as WINNING_HACKATHON_BLUEPRINT.md in the root of your project. It merges all four high-scoring project concepts, every technical feature, the complete UI/UX design system, and all PayPal and sponsor integrations into one cohesive architecture designed to win the Technological Implementation tie-breaker (Official Rule Section 7) and unlock the $17,000 maximum prize stack (Official Rule Section 8).   

1. Unified Project Concepts (How All 4 Ideas Fit Together)

Whether you are building greenfield or upgrading an existing codebase, this architecture unites the four highest-value hackathon concepts into one modular operating system governed by the law: \"AI/ML Proposes, Deterministic Policy Disposes, PayPal Executes\".   

Module / Idea Layer\tTarget Prize Track\tCore User Problem Solved\tHow It Works Inside Your App
Core OS: VeriSettle AI (Autonomous Escrow, 3-Way Match & Dispute Defense)\t

Overall 1st ($12,000) + AG Grid 1st ($5,000) = $17,000 Max Stack 

\t

B2B buyers and merchants lose margin to overbilled supplier invoices, unprofitable early-payment discounts, and costly chargebacks. 

\t

Locks funds via PayPal Orders v2 (intent: \"AUTHORIZE\"), parses supplier PDFs via LayoutLMv3 + Gemini, captures via Authorizations v2 only if 3-way match variance 
≤
1.5
%
≤1.5%, gates Invoicing v2 discounts via EV math, and triages Disputes v1. 


Module A: CollusionGuard MCP (Graph + Sequence Spend Firewall)\t

Best Use of PayPal + AI ($5,000) + APIMatic ($1,000) 

\t

Autonomous AI agents can be prompt-injected into overspending or tricked by sybil merchant collusion rings. 

\t

Implements PayPal's Cosmos.AI Two-Step MCP Gateway (tool_search + execute_tool), scores counterparties in 
<
50
ms
<50ms using GAT + LSTM Autoencoder + Leak-Free XGBoost, and verifies a FIPS 180-4 SHA-256 digest against PAYPAL.md before any money moves. 


Module B: MarginPulse Bandit (Dynamic B2B Invoice Terms Optimizer)\t

Most Impactful ($5,000) + Bryntum ($1,000) 

\t

Blanket \"
2
/
10
 net 
30
2/10 net 30\" discounts cost 
∼
37
%
∼37% APR and waste margin when clients would have paid on time anyway. 

\t

Uses leak-free XGBoost (0.7830 ROC AUC on 41,555 closed B2B invoices) and an Expected-Value Skeptic Gate to dynamically select 2/10 net 30, 1/10 net 30, or 0% on Invoicing v2, auto-resetting to full price if unpaid after Day 10. 


Module C: RestockPilot & SmartPay Upgrade (Forecasting + AP2 Mandate)\t

Best Use of Agentic Commerce ($5,000) + Channel3 ($1,500) 

\t

Small shops and freelancers run out of stock or struggle to forecast cashflow and catch outlier unit prices. 

\t

Computes 80% demand/cashflow prediction intervals (Prophet/ETS/Croston or 50-line TypeScript Holt-Winters fallback), flags outlier prices against Channel3 norms using Isolation Forest, and enforces a Google AP2-style JSON Spend Mandate card. 

2. Complete Winning Feature Checklist (10 High-Impact Features)

Judge 1-Click Live Sandbox Verification Bar: A persistent top toolbar with four instant judge actions:

1-Click Sandbox Escrow Auth: Creates a real PayPal Orders v2 (intent: \"AUTHORIZE\") hold using pre-wired sandbox test credentials and displays the live PayPal-Debug-Id badge.   

Inject +5% Tampered Supplier PDF: Feeds an inflated invoice into the 3-way match engine, triggering an automatic fail-closed capture freeze (variance > 1.5%).   

Inject INSTRUMENT_DECLINED Chaos Test: Sends PayPal-Mock-Response: {\"mock_application_codes\": \"INSTRUMENT_DECLINED\"} to prove resilient error handling and webhook recovery.   

1-Click Reset Demo State: Restores clean seeded sandbox records so judges can re-test deterministically.   

Multimodal 3-Way Match Engine (LayoutLMv3 + Gemini 2.5 Flash + Regex): Extracts company_name, invoice_date (YYYY-MM-DD), and total_amount from uploaded vendor invoices and packing slips using 2D bounding boxes (
0
–
1000
0–1000 scale) and BIO tagging (devashish-pisal/layoutlmv3-sroie-token-classification), cross-checking against the Channel3 quote and PayPal Order Authorization.   

Deterministic Partial-Delivery Clamp: If a prompt-injected or hallucinating LLM agent proposes capturing 
100
%
100% of an authorization hold when the packing slip confirms only 
70
%
70% partial delivery, deterministic TypeScript code overrides the agent's proposal to 
70
%
70% and logs the override badge on-screen.   

Leak-Free Time-Split XGBoost + GAT / LSTM Risk Engine: Computes strict prior-timestamp categorical frequency encoding 
𝑓
𝑒
=
𝑛
𝑒
𝑛
f
e
\t​

=
n
n
e
\t​

\t​

, multi-head Graph Attention (
𝛼
𝑖
𝑗
α
ij
\t​

) for collusion detection, and 50-transaction LSTM Autoencoder reconstruction error 
𝐿
recon
=
∑
𝑡
=
1
𝑇
∥
𝑥
𝑡
−
𝑥
^
𝑡
∥
2
L
recon
\t​

=∑
t=1
T
\t​

∥x
t
\t​

−
x
^
t
\t​

∥
2
 with Extreme Value Theory tail probability 
𝑃
(
𝑋
>
𝑧
)
=
1
−
exp
⁡
(
−
exp
⁡
(
−
𝑧
−
𝜇
𝜎
)
)
P(X>z)=1−exp(−exp(−
σ
z−μ
\t​

)), fused via Platt Scaling and Bayesian Model Averaging.   

Invoicing v2 Early-Payment Discount \"Skeptic Gate\": Evaluates 
EV
discount
=
𝑝
accel
⋅
𝑉
⋅
(
(
1
−
𝑑
)
−
1
(
1
+
𝑟
daily
)
Δ
𝑡
)
−
𝑝
on_time
⋅
(
𝑑
⋅
𝑉
)
EV
discount
\t​

=p
accel
\t​

⋅V⋅((1−d)−
(1+r
daily
\t​

)
Δt
1
\t​

)−p
on_time
\t​

⋅(d⋅V) before calling POST /v2/invoicing/invoices. Blocks negative-EV discounts and logs exact preserved margin.   

Disputes v1 Expected-Cost Chargeback Triage & ID-Cited Rebuttal Generator: Compares 
Cost
fight
=
(
1
−
𝑝
win
)
(
𝐷
+
𝐹
)
+
𝐶
prep
Cost
fight
\t​

=(1−p
win
\t​

)(D+F)+C
prep
\t​

, 
Cost
accept_claim
=
𝐷
Cost
accept_claim
\t​

=D, and 
Cost
make_offer
=
𝑝
accept_offer
⋅
𝑆
+
(
1
−
𝑝
accept_offer
)
⋅
Cost
fight
Cost
make_offer
\t​

=p
accept_offer
\t​

⋅S+(1−p
accept_offer
\t​

)⋅Cost
fight
\t​

 (capping LLM win-rate adjustments strictly at 
±
15
±15 percentage points) to trigger /provide-evidence, /make-offer, or /accept-claim with clickable [ID: ...] citations.   

Cosmos.AI Two-Step MCP Gateway (tool_search + execute_tool): Prevents context bloat and unauthorized tool calls by initializing the agent with only two meta-tools, enforcing PayPal's Four-Step Identity & Double-Authorization rule, and restricting @paypal/agent-toolkit to read-only discovery tools.   

PAYPAL.md Spend Constitution & FIPS 180-4 SHA-256 Digest Gate: Parses human-readable budget caps, per-order limits, allowed Channel3 categories, and risk thresholds into a deterministic validator that computes a SHA-256 approval hash prior to any PayPal API execution.   

Demand & Cashflow Probabilistic Forecaster: Computes days-of-cover and 80% prediction intervals (Prophet/ETS/Croston with a 50-line TypeScript Holt-Winters exponential smoothing fallback) so the agent knows what and how much to reorder before searching Channel3.   

Live Telemetry & PayPal-Debug-Id Audit Drawer: Every PayPal Sandbox REST call records its timestamp, HTTP method, path, status code (200/201/204), latency in milliseconds, PayPal-Request-Id idempotency key, and PayPal-Debug-Id response header in a slide-out inspector.   

3. UI Style & Design System Specification (\"Enterprise Fintech Command Center\")

To score maximum points in Design (20%) and win the $5,000 AG Grid / AG Studio and $1,000 Bryntum prizes, implement a high-contrast, zero-clutter Bento Command Center aesthetic:   

3.1 Typography & Color Tokens (Tailwind CSS)

Font Stack:

Primary UI & Headlines: Google Sans, Inter, or Plus Jakarta Sans (font-sans, tracking -0.015em).

Financial Ledger, Currency, Latencies, PayPal-Debug-Id & SHA-256 Hashes: JetBrains Mono or Geist Mono (font-mono, tabular-nums so numbers align vertically in every column).

Color Palette:

Canvas Background: #F8FAFC (Slate-50 Light) / #0B0F17 (Deep Obsidian Dark).

Card Surface: #FFFFFF with 1px solid #E2E8F0 border (Light) / #111827 with 1px solid #1F2937 border (Dark).

PayPal Brand Accent: Deep Navy #003087 and Action Blue #0070BA / #1A73E8.

Semantic Status Badges (3-State Mandate & Firewall Pills):

PASS / VERIFIED CAPTURE: Background #E6F4EA, Text #137333, Border #81C995 (Emerald).

NEEDS HUMAN APPROVAL / ESCROW HOLD: Background #FEF7E0, Text #B06000, Border #FCC934 (Amber).

BLOCKED FAIL-CLOSED / VARIANCE FREEZE: Background #FCE8E6, Text #C5221F, Border #F28B82 (Crimson).

3.2 Five-Zone Screen Layout (/dashboard)

Zone 1 (Top Sticky Header — h-14):

Left: App Logo + \"VeriSettle AI — Autonomous Escrow & Treasury OS\" + Live Sandbox Mode Pill (SANDBOX: api-m.sandbox.paypal.com).   

Right: \"Judge 1-Click Live Sandbox Test Bar\" (4 action buttons with loading spinners and instant toast notifications) + ML_MODE: LIVE | CACHED toggle switch.   

Zone 2 (Top KPI Bento Row — 4 Cards):

Card 1: Active Escrow Holds (Orders v2 AUTHORIZE) — Total USD locked + count of pending milestones.   

Card 2: 3-Way Match Status (LayoutLMv3 + Channel3) — Percentage of invoices verified within 
≤
1.5
%
≤1.5% variance + count of frozen tampered invoices.   

Card 3: Treasury Margin Preserved (EV Skeptic Gate) — Total USD saved by blocking unprofitable 
2
/
10
 net 
30
2/10 net 30 discounts on Invoicing v2.   

Card 4: Dispute Triage Savings (Disputes v1) — Expected cost saved across active chargebacks + average XGBoost/GAT risk score.   

Zone 3 (Main Left/Center Workspace — AG Studio / AG Grid 10-Table Relational Explorer):

Tabbed relational selector joining PayPal's 9 boilerplate tables (Customers, Invoices, Invoice Line Items, Invoice Payments, Products, Plans, Transactions, Payouts, Balances) with Table 10: ML Risk & 3-Way Match Audits.   

Custom AG Grid cell renderers: type: 'money' right-aligned tabular currency, color-coded Variance % pills, horizontal progress bar for XGBoost On-Time Prob & GNN/LSTM Risk Score, and clickable PayPal-Debug-Id badges that open the Audit Drawer to that exact HTTP call.   

Zone 4 (Lower Split Workspace — Bryntum Gantt Escrow Timeline + AP2 Spend Mandate & Docket Receipt):

Left (60% width): Bryntum Gantt Finish-to-Start (FS) Milestone Schedule showing every Purchase Order progressing across M1: Channel3 Quote & 30% PayPal Auth 
→
→ M2: Carrier Transit & LayoutLMv3 Receipt QA 
→
→ M3: 3-Way Match & 70% PayPal Capture/Void, paired with a 30-day cashflow/demand forecast chart.   

Right (40% width): AP2 Spend Mandate Card (PAYPAL.md) & Interactive EV / Dispute Simulator + Docket-Style Receipt Preview showing line-item forecast intervals, risk reasons, and human Approve & Capture / Void Hold buttons.   

Zone 5 (Right Collapsible Drawer — Live PayPal REST & Cosmos.AI MCP Telemetry):

Real-time terminal-style stream showing tool_search discovery, execute_tool double-authorization, FIPS 180-4 SHA-256 digest verification, HTTP status code, latency (ms), and PayPal-Debug-Id.   

4. Complete Integrations Matrix (PayPal + ML/DL + Sponsors)
Integration Layer\tExact Package / Endpoint / Model\tCritical Implementation Rule for Hackathon Judges
PayPal OAuth 2.0\tPOST [https://api-m.sandbox.paypal.com/v1/oauth2/token](https://api-m.sandbox.paypal.com/v1/oauth2/token)\t

Cache Bearer tokens in memory (valid 3–8 hrs in sandbox); auto-retry HTTP 401/429/5xx; enforce import \"server-only\";. 


PayPal Orders v2 & Authorizations v2\tPOST /v2/checkout/orders (intent: \"AUTHORIZE\") 
→
→ POST /v2/payments/authorizations/{id}/capture (final_capture: true) or /void\t

Attach deterministic PayPal-Request-Id idempotency headers and record paypal-debug-id response headers on every call. 


PayPal Invoicing v2\tPOST /v2/invoicing/invoices\t

Gate 
2
/
10
 net 
30
2/10 net 30 discounts through the deterministic 
EV
discount
EV
discount
\t​

 Skeptic Gate; reset to full price if unpaid after Day 10. 


PayPal Customer Disputes v1\tGET /v1/customer/disputes, POST .../provide-evidence, .../make-offer, .../accept-claim, .../require-evidence (Sandbox helper), .../adjudicate (Sandbox helper)\t

Use /require-evidence in sandbox seeding so judges can test live dispute evidence submission and /make-offer settlement on demand. 


PayPal Agent Toolkit & MCP\t@paypal/agent-toolkit + Local REST Wrapper\t

Issue #119 Fix: Never call hosted [https://mcp.sandbox.paypal.com/sse](https://mcp.sandbox.paypal.com/sse) (fails with Unsupported cache mode: default). Expose read-only toolkit schemas via local Cosmos.AI tool_search + execute_tool. 


PayPal Webhooks & Chaos QA\tPayPal-Mock-Response header + CRC32 / HMAC-SHA256 Webhook Verifier + Status Polling Fallback\t

Support mock_application_codes: \"INSTRUMENT_DECLINED\" and poll order status as a fallback if sandbox webhook delivery lags. 


APIMatic (Sponsor)\tnpx context-plugins install [https://github.com/paypaldev/server-sdk-context-plugin-preview](https://github.com/paypaldev/server-sdk-context-plugin-preview) + @paypal/paypal-server-sdk@2.5.0\t

Grounds the coding agent in strongly-typed SDK models across TypeScript and Python. 


AG Grid / AG Studio (Sponsor)\tag-grid-react, ag-grid-community (paypaldev/hackathon-paypal-ag-grid-boilerplate)\t

Join the 9 PayPal relational tables with Table 10 (ML Risk & 3-Way Match Audits) using type: 'money' and custom status cells. 


Bryntum (Sponsor)\tInteractive Finish-to-Start (FS) Milestone Gantt & Cashflow Timeline\t

Models M1 (Auth) 
→
→ M2 (Transit/OCR) 
→
→ M3 (Capture/Dispute) dependencies. 


Channel3 (Sponsor)\tMulti-Merchant Product Search & Price History API\t

Provides clean product quotes and category mean/std price distributions for anomaly z-scores. 


Render (Sponsor)\trender.yaml Blueprint (Next.js Web Service + Python FastAPI ML Service)\t

Deploy with ML_MODE=cached enabled by default so starter cloud instances respond in 
<
5
ms
<5ms without OOM crashes. 

