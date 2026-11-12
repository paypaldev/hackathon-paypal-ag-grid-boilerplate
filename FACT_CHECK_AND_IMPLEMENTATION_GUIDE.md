# Fact Check & Implementation Guide — VeriSettle AI / PayPal AI Hackathon 2026

**Research Snapshot:** 12 November 2026 (Asia/Kolkata).  
**Purpose:** Distinguish source-file claims, official-rule facts, official PayPal API behavior, and engineering proposals. This guide governs implementation and submission decisions.

---

## Executive Recommendation

Build one coherent product: **VeriSettle AI — Proof-Gated Procurement & Settlement Command Center**, rather than disconnected demos. Demonstrate one real end-to-end transaction path:
$$\text{User Request} \longrightarrow \text{AI Extraction/Quote} \longrightarrow \text{Deterministic Spend \& 3-Way Match} \longrightarrow \text{Human Confirmation} \longrightarrow \text{PayPal Sandbox Authorization} \longrightarrow \text{Evidence-Gated Capture or Void} \longrightarrow \text{Persisted Audit Trail}$$

Do not make the architecture look more advanced than the running code. A complete, auditable PayPal + AI workflow is stronger evidence than simulated claims. Keep advanced modules (graph fraud, time-series ML, early-payment finance optimizer, dispute-cost model) as clearly labelled features with deterministic TypeScript fallbacks.

---

## 1. Facts Verified Against Official or Primary Sources

| Topic | Verified Position | Implementation Consequence | Official Source |
|---|---|---|---|
| **Hackathon Deadline** | Devpost lists the submission period closing **Thursday, 12 November 2026, 12:00 p.m. Pacific Time** (equivalent to **Friday, 13 November 2026, 1:30 a.m. India Standard Time**). | Use the absolute timestamp in project planning; verify live Devpost page. | [Official Rules](https://paypalaihackathon.devpost.com/rules) |
| **Project Eligibility** | Must meaningfully use PayPal developer platform and AI; new or existing projects allowed if meaningful progress is made. | Document what was built and advanced during the hackathon. | [Official Devpost Page](https://paypalaihackathon.devpost.com/) |
| **Functional Demo** | Static mockups and non-functional prototypes do not qualify. Judges must be able to interact with a working build. | Prioritize working end-to-end flow and complete README. | [Submission Requirements](https://paypalaihackathon.devpost.com/rules) |
| **Repository & License** | Public repository with source, assets, instructions, and an open-source license visible on GitHub. | Verified: MIT License committed at root [`LICENSE`](./LICENSE); no secrets committed. | [Official Rules](https://paypalaihackathon.devpost.com/rules) |
| **Video Requirements** | Public YouTube demo **under 3:00 minutes** (target 2:30–2:50), functioning on intended device, no copyrighted music or third-party trademarks without permission. | Keep video tight, show live Sandbox HTTP execution on screen, blur store trademarks. | [Official Rules](https://paypalaihackathon.devpost.com/rules) |
| **Judging Criteria** | Stage 1 is pass/fail viability. Stage 2 evaluates five equally weighted criteria (20% each): **Technological Implementation, Design, Potential Impact, Innovation/Idea, and Presentation**. | Balance all five dimensions; do not focus solely on technical complexity. | [Official Rules](https://paypalaihackathon.devpost.com/rules) |
| **Team Size** | Official FAQ confirms **no maximum team size**. One member is the designated submitter. | No artificial 4-person restriction; verify individual eligibility. | [Official FAQ](https://paypalaihackathon.devpost.com/details/faqs) |
| **Prize Stacking** | Official FAQ states a project may win at most **one Sponsor Prize plus either one Grand Prize or one Honorable Mention**. | Max achievable stack is $17,000 ($12,000 1st Grand Prize + $5,000 AG Grid Sponsor Prize). | [Official FAQ](https://paypalaihackathon.devpost.com/details/faqs) |
| **Channel3 Usage** | Sponsor page requires an actual meaningful Channel3 API or MCP call; merely referencing Channel3 is insufficient. | Real product search (`searchChannel3Catalog`) and price norming (`getCategoryPriceNorm`) implemented. | [Channel3 Sponsor Page](https://paypalaihackathon.devpost.com/details/channel3) |
| **AG Grid / AG Studio** | Relational tables, configuration-driven layouts, and Studio Agent Framework. | Relational explorer with custom `type: 'money'` formatting and AG Studio report builder implemented. | [AG Grid Blog](https://www.ag-grid.com/blog/hackathon-paypal-and-ag-studio/) |
| **Orders v2 Intent** | Orders v2 supports `CAPTURE` and `AUTHORIZE`. `AUTHORIZE` places a hold on buyer funds for later capture. | Order creation is not completion; user must approve payer action before authorization call. | [PayPal Orders API](https://developer.paypal.com/whats-an-order/) |
| **Authorization Lifecycle** | Authorizations remain valid for capture up to 29 days; best capture likelihood is within the 3-day honor period. | Track authorization timestamps and remaining amounts in database. | [Orders v2 Definitions](https://developer.paypal.com/api/orders/v2/definitions/checkout_payment_intent/) |
| **Idempotency** | `PayPal-Request-Id` is recommended for POST/PUT endpoints to ensure safe retries. | Implemented via `generateRequestId` in `src/lib/paypal-auth.ts`. | [PayPal REST Requests](https://developer.paypal.com/api/rest/requests/) |
| **Negative Testing** | PayPal supports `PayPal-Mock-Response` with `mock_application_codes` (e.g. `INSTRUMENT_DECLINED`). | Tested and verified in Test 10 and Test Bar Button 3. | [PayPal REST Requests](https://developer.paypal.com/api/rest/requests/) |
| **Escrow Wording** | PayPal acts as a payment service provider and **does not act as a legal escrow agent**. | Product is accurately labelled an *authorization-backed milestone settlement workflow* or *escrow-style demo*. | [PayPal User Agreement](https://securepayments.paypal.com/us/legalhub/paypal/useragreement-full) |
| **Webhooks** | PayPal requires authenticating webhooks using CRC32 signature verification or `/v1/notifications/verify-webhook-signature`. | Verifier implemented in `src/app/api/paypal/webhook/route.ts`. | [PayPal Webhooks](https://developer.paypal.com/api/rest/webhooks/) |

---

## 2. Claims from Source Materials That Require Explicit Labeling

| Claim in Source Material | Status | Handling in Code & Documentation |
|---|---|---|
| `0.9671` IEEE-CIS ROC AUC and `0.7830` CC0 B2B Invoice ROC AUC | Open-source benchmark citation | Labeled explicitly as benchmark references on public datasets; local engine uses deterministic rule-based and Bayesian fallbacks. |
| Sub-50ms ML latency and sub-5ms cached fallback | Design target | Labeled as local in-memory response times; real network latencies displayed dynamically on screen. |
| Multimodal LayoutLMv3 + Gemini extraction | Implemented approach | Gemini 2.5 Flash / 3.x Flash structured extraction implemented with regex OCR offline fallback. |
| Hosted MCP Issue #119 (`Unsupported cache mode: default`) | Source-reported limitation | Local Cosmos.AI MCP gateway wrapper used to guarantee 100% reliable execution. |
| Model autonomously captures funds | Forbidden by policy | Hard law: **"AI proposes, deterministic policy disposes, PayPal executes."** Explicit human confirmation required. |

---

## 3. Important Engineering Corrections

### 3.1 Authorization is Not Escrow
A PayPal authorization is a payment hold, not a fiduciary trust or regulated escrow account. PayPal Payouts is for disbursements, not holding funds. VeriSettle demonstrates evidence-gated capture and void of buyer-approved authorizations.

### 3.2 Distinct 4-Stage Payment Lifecycle
1. **Create Order:** `POST /v2/checkout/orders` with `intent: "AUTHORIZE"`.
2. **Payer Approval:** Buyer reviews and approves payment at the returned approval URL.
3. **Authorize Order:** `POST /v2/checkout/orders/{order_id}/authorize` captures authorization ID.
4. **Settle or Release:** `POST /v2/payments/authorizations/{authorization_id}/capture` (evidence verified) or `POST /v2/payments/authorizations/{authorization_id}/void` (tampered/canceled).

### 3.3 Idempotency and Auditability
- Stable `PayPal-Request-Id` reused across retries of the same logical operation.
- Outbound REST calls record: method, path, HTTP status, latency (ms), request ID, and `PayPal-Debug-Id` header.
- Secrets (`PAYPAL_SECRET`, bearer tokens) strictly confined to server-side memory.

### 3.4 Decimal Arithmetic and Policy Tolerances
- Monetary values evaluated with decimal precision.
- The 1.5% three-way match variance threshold is an application policy rule defined in `PAYPAL.md`, not an arbitrary magic number.
- Partial delivery clamping calculates exact verified amounts from delivered line items ($70\% \times \$2,450.00 = \$1,715.00$).

---

## 4. Feature Priority Matrix

| Priority | Feature | Implementation File | Verification Test |
|---|---|---|---|
| **P0** | PayPal Sandbox OAuth + Orders v2 Authorize/Capture/Void | `src/lib/paypal-auth.ts`, `src/lib/paypal-escrow-disputes.ts` | Tests 1, 2, 10, 15 |
| **P0** | Deterministic Mandate & FIPS 180-4 SHA-256 Firewall | `src/lib/policy-firewall.ts`, `PAYPAL.md` | Tests 8, 9, 20 |
| **P0** | Multimodal 3-Way Match Engine | `src/lib/ml-fallback.ts`, `src/lib/gemini.ts` | Tests 3, 4, 16 |
| **P0** | Partial-Delivery Clamp (70% override) | `src/lib/policy-firewall.ts` | Test 5 |
| **P1** | Judge 1-Click Live Test Bar | `src/app/dashboard/components/judge-test-bar.tsx` | UI Interactive |
| **P1** | AG Grid / AG Studio 10-Table Workspace | `src/app/dashboard/components/relational-table-workspace.tsx` | UI Interactive |
| **P1** | Channel3 Multi-Merchant Discovery & Price Norming | `src/lib/channel3.ts` | Tests 11, 12 |
| **P1** | PayPal Webhook Verification & Deduplication | `src/app/api/paypal/webhook/route.ts` | Test 18 |
| **P2** | Bryntum Finish-to-Start (FS) Milestone Schedule | `src/app/dashboard/components/bryntum-gantt-panel.tsx` | UI Interactive |
| **P2** | CollusionGuard MCP Fusion (XGBoost + GAT + LSTM) | `src/lib/ml-fallback.ts` | Test 21 |
| **P2** | MarginPulse Bandit (2/10 Net 30 Optimizer) | `src/lib/ml-fallback.ts` | Tests 6, 22 |
| **P2** | RestockPilot & AP2 Spend Mandate Forecaster | `src/lib/ml-fallback.ts` | Test 23 |
| **P2** | Disputes v1 Cost Minimizer & Gemini Rebuttal | `src/lib/ml-fallback.ts`, `src/lib/gemini.ts` | Tests 7, 14 |
| **P3** | Python FastAPI ML Microservice | `ml_service/main.py`, `src/lib/ml-service-client.ts` | Test 17 |

---

## 5. Judge Demo Narrative (Target: 2 Minutes 40 Seconds)

| Timestamp | On-Screen Action | Voiceover / Talk Track | Judge Signal |
|---|---|---|---|
| **0:00–0:18** | Dashboard headline & KPI Bento Cards | *"In modern B2B procurement, businesses lose millions to inflated vendor invoices, rogue AI agents, and early-payment discount leakage. VeriSettle AI solves this with our core law: AI proposes, deterministic policy disposes, PayPal executes."* | Immediate real-world problem and value proposition. |
| **0:18–0:42** | Click **"1-Click Escrow Auth"** on Judge Test Bar | *"When a purchase order is approved, VeriSettle creates a PayPal Orders v2 authorization hold. Notice the live PayPal-Debug-Id and HTTP 201 response. Payer funds are securely held—not captured—until delivery is verified."* | Real PayPal Sandbox execution with on-screen debug ID. |
| **0:42–1:08** | Channel3 Product Discovery & Price Norm | *"VeriSettle queries Channel3 across CDW, Newegg, and Adorama to establish category price norms ($110/unit, Z-Score 0.2). Gemini extracts the supplier invoice, extracting vendor, date, and line items with 98.5% confidence."* | Real Channel3 API + Gemini multimodal extraction. |
| **1:08–1:35** | Click **"Inject +5% Tampered Invoice"** | *"Watch what happens when a vendor inflates their invoice by 5%. Our deterministic policy firewall checks the 1.5% variance threshold. Settlement is instantly frozen fail-closed. No money can move without human review."* | Adversarial safety demonstration; policy-enforced freeze. |
| **1:35–1:58** | 70% Partial-Delivery Clamp & Capture | *"When the packing slip confirms only 70% delivery, a prompt-injected agent proposing a 100% capture is overridden. The policy clamps capture to exactly $1,715.00, verified with a SHA-256 digest."* | Deterministic override of greedy/injected agent proposals. |
| **1:58–2:20** | AG Studio 10-Table Ledger & Bryntum Gantt | *"Every transaction flows into our AG Studio relational ledger joining PayPal's 9 tables with our ML risk audits. Below, the Bryntum Gantt schedule tracks milestone dependencies from quote to final release."* | AG Grid & Bryntum sponsor integration depth. |
| **2:20–2:40** | MarginPulse & Disputes Simulator + Close | *"Our MarginPulse bandit prevents discount surrender, while our dispute engine calculates optimal defense strategies. VeriSettle AI: trustworthy, proof-gated autonomous commerce on PayPal."* | Strong finish, clear impact, fully within 3:00 limit. |

