# RestockPilot ☕🛒
### Autonomous Café Inventory Replenishment & Verified PayPal Purchasing Agent
**Submission for the PayPal AI Hackathon 2026**

> **Official Pitch:** *"Turn café inventory and sales into an AI-prioritized restock plan, review every quantity within your budget, and approve a PayPal sandbox purchase."*  
> **Core Architecture:** *"Your café never runs out, and your agent never overspends. AI proposes, deterministic code decides, the owner approves, and PayPal verifies."*

---

## 🎯 Target Prize Tracks
- **Grand Prize (1st–3rd) / Best Use of Agentic Commerce / Best Use of PayPal + AI**
- **Best Use of Channel3** (Live product search, multi-retailer offer comparison, filtered peer median anti-poisoning)
- **Best Use of AG Grid** (Double-entry financial & inventory reconciliation ledger with quick filters, status badges, idempotency keys, and pinned totals row)

---

## ⚡ 90-Second Judge Walkthrough

Judges can test the complete end-to-end loop in **zero-login, 1-click mode**:

1. **Open the Demo:** Navigate to [`/demo`](file:///d:/paypal%20ai%20hackathon/src/app/demo/page.tsx) ("Sunrise Roasters Café" seeded scenario).
2. **Execute Cycle:** Click the **`[Run Café Restock Cycle (1-Click)]`** button.
   - **Net-Inventory Math at Work:** Notice `OAT-MILK-6PK` (12 on-hand, 12 in-transit) computes `Net Position 24 > ROP 19.5` and orders **0 cases**, preventing **$838.50 in duplicate spending**!
   - `ESPRESSO-5LB` (4 on-hand, ROP 9.0) calculates a deficit and triggers a 14-bag replenishment order.
3. **Inspect Owner Approval Card:**
   - **Filtered Peer Median Defense:** Channel3 returns 6 raw offers ($8.99 scoop, $16.50 12oz bag, $36.00 trap, $62.00, $64.50, $68.00). Filtered median ($63.25) catches the suspicious $36.00 clearance trap (**ASK**) and selects the $62.00 valid offer (**ALLOW**).
   - Proven dollar savings: **+$17.50 vs peer median** and **+$28.00 vs last purchase**.
4. **Approve & Checkout with PayPal Sandbox:**
   - Click **`[Phase A: Create PayPal Order]`** — generates a deterministic SHA-256 `PayPal-Request-Id` idempotency key and custom_id contract hash.
   - Click **`[Approve on PayPal Sandbox ↗]`** — launches real buyer approval.
   - Click **`[Phase B: Verify & Capture Approved Order]`** — executes pre-capture GET check (preventing 422 `ORDER_NOT_APPROVED`), captures payment, and increments inventory `onOrder`.
5. **Reconciliation & Evidence:**
   - View the live **AG Grid Financial Ledger** below with quick-filters and pinned bottom totals.
   - Visit [`/evidence`](file:///d:/paypal%20ai%20hackathon/src/app/evidence/page.tsx) and click **`[Verify with PayPal GET]`** to view authoritative JSON metadata directly from `api-m.sandbox.paypal.com`.

---

## 🏛️ For Judges: Mapping to the 5 Official Judging Criteria

| Judging Criterion (20% Each) | How RestockPilot Delivers | Verifiable Proof in Repository |
| :--- | :--- | :--- |
| **1. Technological Implementation** *(Official Tie-Breaker)* | Two-Phase Idempotent Orders v2 pipeline, raw-body verified webhooks with CRC32+RSA-SHA256 fallback, periodic-review $(s, S)$ math, and read-only MCP server. | `src/lib/paypal.ts`, `src/app/api/paypal/webhook/route.ts`, `tests/paypal-restock.test.ts` (100% pass) |
| **2. Design** | Tailored specialty café UX with live savings proof, clear decision badges (ALLOW/ASK/BLOCK), and interactive AG Grid reconciliation ledger with status filtering. | `src/app/demo/page.tsx`, `src/app/evidence/page.tsx` |
| **3. Potential Impact** | Solves the #1 cash leak for independent cafés: prevents stockouts across daily drink volume while saving **$838.50 per cycle in redundant reorders**. | Evaluated in `scripts/eval.ts` and `src/lib/policy.ts:computeReorder()` |
| **4. Innovation / Idea** | B2B Agentic Commerce with human-in-the-loop: Channel3 multi-merchant search combined with a 9-rule non-short-circuiting severity lattice. | `src/lib/policy.ts:evaluateMandate()`, `src/lib/ai.ts` |
| **5. Presentation** | 2:45 crisp video walkthrough, structured 90-second judge path, real PayPal debug traces, and 24-case adversarial benchmark. | `docs/EVIDENCE.md`, `DEVPOST_SUBMISSION.md` |

---

## 🛡️ Lines the AI Model Cannot Cross

| Security Invariant | Enforced In (File & Function) | Automated Unit Test |
| :--- | :--- | :--- |
| **AI Has Zero Money-Moving Tools** | `src/lib/ai.ts` & `src/app/api/mcp/route.ts` | `tests/mcp-security.test.ts` |
| **Hard Sandbox Host Guard** | `src/lib/paypal.ts:assertSandboxBaseUrl()` | `tests/paypal-restock.test.ts` |
| **Deterministic Idempotency Key** | `src/lib/paypal.ts:createOrderForRestock()` | `tests/paypal-restock.test.ts` (`sha256(poId + ":create:" + cents)`) |
| **Pre-Capture Order Status Verification** | `src/lib/paypal.ts:captureApprovedOrder()` | `tests/paypal-restock.test.ts` (Verifies status === 'APPROVED') |
| **Raw-Body Webhook Splicing** | `src/app/api/paypal/webhook/route.ts` | `tests/paypal-restock.test.ts` (Preserves byte order & floats) |
| **Local CRC32 + RSA-SHA256 Fallback** | `src/lib/paypal-webhook-verifier.ts` | `tests/paypal-restock.test.ts` (Simulator-compatible verification) |
| **Non-Short-Circuiting Severity Lattice** | `src/lib/policy.ts:evaluateMandate()` | `tests/policy.test.ts` (Evaluates all 9 rules, BLOCK > ASK > ALLOW) |
| **Net-Inventory Periodic Review Math** | `src/lib/policy.ts:computeReorder()` | `tests/policy.test.ts` (Prevents $838.50 duplicate spend) |

---

## 💳 PayPal Developer Platform Integration

| PayPal API / Feature | Technical Implementation | Purpose in RestockPilot |
| :--- | :--- | :--- |
| **Orders v2 (`POST /v2/checkout/orders`)** | `intent: "CAPTURE"`, strict `item_total` breakdown, `custom_id: sha256(mandateId + ":" + poId)` | Phase A: Creates immutable checkout order anchored to owner mandate. |
| **Idempotent Header (`PayPal-Request-Id`)** | `sha256(poId + ":create:" + cents)` and `sha256(poId + ":capture:" + orderId)` | Prevents duplicate order creation or multiple captures on network retries. |
| **Pre-Capture Verification (`GET /v2/checkout/orders/{id}`)** | Pre-checks `status === "APPROVED"` and currency/amount match before calling capture | Eliminates HTTP 422 `ORDER_NOT_APPROVED` errors in Sandbox. |
| **Capture (`POST /v2/checkout/orders/{id}/capture`)** | `Prefer: return=representation`, reads `seller_receivable_breakdown.paypal_fee` | Phase B: Settles payment upon café owner authorization. |
| **Webhooks (`POST /v1/notifications/verify-webhook-signature`)** | Direct `rawBody` JSON string splicing + unsigned 32-bit CRC32 + RSA-SHA256 fallback | Dual verification: supports live sandbox deliveries & Webhook Simulator. |
| **State Reconciliation (`reconcileUnknownOrder`)** | Reconciles `UNKNOWN` status via authoritative GET read-back | Never retries a money-moving write blindly after network timeouts. |

---

## 🤝 Sponsor Tools Integration

### 1. Channel3 API (Product Discovery & Anti-Poisoning Peer Median)
- Queries live supplier catalogs across 25,000+ merchants for specialty café SKUs (whole-bean coffee, barista plant milks, cups, burrs).
- **Anti-Poisoning Peer Median (`computeVerifiedPeerMedian`):** Raw queries often return $8.99 scoops or 12oz bags alongside 5lb wholesale beans. RestockPilot filters to `sameProduct === true && inStock === true` before computing median unit price, preventing poisoned medians from approving counterfeit goods.

### 2. AG Grid Community & React
- Powers the **Interactive Financial & Inventory Reconciliation Ledger** on `/demo`.
- Features: Quick-filter search bar, status filter pills (`ALLOW`, `ASK`, `BLOCK`, `CAPTURED`, `WEBHOOK_VERIFIED`), custom status badge renderers, and a **pinned bottom totals row** dynamically calculating Total Approved Spend, Verified Savings, and Remaining Monthly Budget.

---

## 📊 24-Case Adversarial Benchmark Summary (`scripts/eval.ts`)

Run the benchmark locally:
```bash
npm run eval
```

| Metric | (A) Naive Baseline | (B) Short-Circuit + Unfiltered Median | (C) RestockPilot (Severity-Lattice) |
| :--- | :---: | :---: | :---: |
| **Accuracy Score** | 4 / 24 (16.7%) | 14 / 24 (58.3%) | **24 / 24 (100.0%)** |
| **Unsafe False-Spend Executed** | $7,419.49 | $3,800.00 | **$0.00 (Zero Unsafe Spend)** |
| **Wilson 95% Confidence Interval** | 16.7% | 58.3% | **86.2% Lower Bound** |
| **Prompt-Injection Resistance** | 0 / 2 (Vulnerable) | 1 / 2 (Partial) | **2 / 2 (100% Neutralized)** |
| **Duplicate Spend Prevented** | $0.00 | $0.00 | **$838.50 on OAT-MILK-6PK** |

Full report saved at [`eval/results.md`](file:///d:/paypal%20ai%20hackathon/eval/results.md).

---

## 🔍 Honest Limits & Security Disclosure
1. **Sandbox-Only Hard Guard:** RestockPilot strictly executes against `https://api-m.sandbox.paypal.com` and throws immediate runtime exceptions if pointed to live production.
2. **Transparent Mode Badge:** When developer credentials are unset or invalid in local testing, the UI clearly displays `SIMULATED MODE` with IDs prefixed `SIMULATED_`. It never blurs simulated records with live Sandbox IDs.
3. **Supplier Checkout Bridging:** Payments settle into the café owner's PayPal sandbox account; physical merchant fulfillment uses simulated Channel3 checkout triggers.

---

## 🚀 Setup & Execution Instructions

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Add your PayPal Sandbox Client ID & Secret in .env.local

# 3. Run typecheck & automated tests
npm run typecheck # or npx tsc --noEmit
npm test          # runs all 100+ unit and integration tests

# 4. Run the 24-Case Adversarial Benchmark
npm run eval

# 5. Launch development server
npm run dev
# Visit http://localhost:3000/demo
```

---

## 📜 License
MIT License — Copyright (c) 2026 RestockPilot & VeriSettle AI Contributors.
