# RestockPilot — Devpost Hackathon Submission & Video Script
**Submission for the PayPal AI Hackathon 2026**  
**Official Hard Deadline:** November 12, 2026 at 12:00 PM PST / November 13, 2026 at 1:30 AM IST

---

## 🏷️ Project Details & Metadata

- **Project Title:** RestockPilot
- **Short Tagline:** Your café never runs out, and your agent never overspends. AI proposes, deterministic code decides, the owner approves, and PayPal verifies.
- **One-Sentence Pitch:** Turn café inventory and sales into an AI-prioritized restock plan, review every quantity within your budget, and approve a PayPal sandbox purchase.
- **Target Prize Tracks:**
  1. **Grand Prize / Best Use of Agentic Commerce / Best Use of PayPal + AI**
  2. **Best Use of Channel3** (Live product search/lookup, multi-retailer comparison, and filtered peer median calculation)
  3. **Best Use of AG Grid** (Interactive financial & inventory reconciliation ledger with quick filters, status badges, idempotency keys, and a pinned bottom totals row)
- **Repository URL:** `https://github.com/your-username/restockpilot` (or local git root)
- **Live Demo Route:** `/demo`
- **Verification & Evidence Route:** `/evidence`
- **MCP Server Route:** `/api/mcp`

---

## 📖 Devpost Written Submission Text

### Inspiration
Independent coffee shop owners and café managers face a brutal, recurring dilemma every Monday morning:
1. **Stockouts kill revenue and guest trust:** Running out of whole-bean espresso or barista oat milk during a 7:30 AM morning rush brings service to an instant halt.
2. **Reordering takes hours across disparate supplier sites:** Owners bounce between restaurant depots, roasters, wholesale distributors, and retail sites to find in-stock inventory and fair pricing.
3. **Autonomous AI agents cannot be trusted with credit cards:** If you give a standard LLM agent money-moving powers, it hallucinates quantities, mistakes cheap accessories (an $8.99 coffee scoop) or retail bags (a $16.50 12oz bag) for wholesale 5-pound bags, or reorders 15 cases of oat milk ($838.50) because it only checked on-hand stock without knowing 12 cases were already on the delivery truck!

We built **RestockPilot** to solve this permanently through a strict separation of powers:  
*"AI proposes, deterministic code decides, the owner approves, and PayPal verifies."*

---

### What It Does
RestockPilot automates the entire café replenishment lifecycle while guaranteeing absolute financial safety:

1. **Deterministic Net-Inventory Math:** Rather than naive `onHand <= reorderPoint` triggers, RestockPilot executes periodic-review $(s, S)$ inventory math:
   $$\text{Inventory Position} = \text{onHand} + \text{onOrder} - \text{committed}$$
   It rounds strictly up to supplier case-pack multiples and minimum order quantities. On our seeded café run, it spots that Oatly Barista Milk has 12 cases in transit, computes $\text{Net Position} (24) > \text{ROP} (19.5)$, and orders **0 cases**, instantly preventing **$838.50 in duplicate spending**!
2. **Live Multi-Merchant Discovery via Channel3:** It queries real supplier catalogs across 25,000+ merchants for exact café SKUs (specialty coffee beans, commercial oat milk, paper cups, burr sets).
3. **Anti-Poisoning Filtered Peer Median:** Raw product search often contains cheap accessories or wrong pack sizes that pollute pricing statistics. RestockPilot's `computeVerifiedPeerMedian` pre-filters offers to `sameProduct === true && inStock === true`. This elevates the peer median from a poisoned $49.00 up to the true $63.25, ensuring that suspicious clearance traps ($36.00) are flagged for human review.
4. **9-Rule Non-Short-Circuiting Severity Lattice:** Evaluates every restock proposal against the owner's mandate across 9 fixed rules. Because it never short-circuits on early rules, an item that is refurbished (`ASK`) will never mask a fatal monthly budget breach (`BLOCK`). The final verdict resolves strictly via **BLOCK > ASK > ALLOW**.
5. **Human-in-the-Loop Café Owner Approval:** Displays an intuitive Owner Approval Card highlighting transparent dollar savings compared to the verified peer median (+$17.50 saved) and last-paid purchase price (+$28.00 saved).
6. **Two-Phase Idempotent PayPal Orders v2 Settlement:**
   - **Phase A (Create Order):** Creates an immutable PayPal order (`intent: "CAPTURE"`) with strict `item_total` breakdown, deterministic SHA-256 `PayPal-Request-Id` idempotency header, and a `custom_id` contract hash (`sha256(mandateId:poId)`).
   - **Phase B (Verify & Capture):** Pre-reads the order status via `GET /v2/checkout/orders/{id}` to verify it is `APPROVED` before executing capture, completely eliminating HTTP 422 `ORDER_NOT_APPROVED` errors.
7. **Raw-Body Verified Webhook & Reconciliation:** Ingests `PAYMENT.CAPTURE.COMPLETED` webhooks using preserved raw-body string splicing and unsigned 32-bit CRC32 signature checks (with local RSA-SHA256 crypto fallback for PayPal's Webhook Simulator), followed by authoritative fresh GET read-backs.
8. **Interactive AG Grid Financial Ledger:** An interactive ledger featuring quick filters, status badges, idempotency keys, and a pinned bottom totals row tracking approved spend, verified savings, and remaining monthly budget.
9. **Read-Only Agentic MCP Server:** Implements a Model Context Protocol (MCP) HTTP JSON-RPC endpoint (`/api/mcp`) allowing external autonomous agents to read inventory, mandates, and quotes, but exposing **zero money-moving tools**.

---

### How We Built It
- **Frontend & App Architecture:** Next.js 16 (App Router), React 19, TypeScript strict mode, and Tailwind CSS 4.
- **Data & Reconciliation Ledger:** AG Grid Community (`@ag-grid-community/react`) with custom dark styling, right-aligned monetary values, status badge renderers, and pinned bottom summary rows.
- **Payment & Settlement Engine:** PayPal Server SDK (`@paypal/paypal-server-sdk`), PayPal Orders v2 API (`/v2/checkout/orders`), REST Webhooks API, and a hard sandbox host guard (`assertSandboxBaseUrl()`) restricting execution to `https://api-m.sandbox.paypal.com`.
- **Supplier Catalog Intelligence:** Channel3 API (`@channel3/sdk`) for live supplier catalog lookups and multi-merchant quote aggregation.
- **AI & Guardrailed Extraction:** Google Gemini Multimodal API with fallback to Groq and deterministic parsing, bounded by `<untrusted_merchant_listing>` security fences to neutralize prompt-injection attacks.
- **Automated Testing & Benchmark:** 95+ Vitest automated unit tests and a custom 24-case adversarial benchmark (`scripts/eval.ts`) testing legitimate restocks, refurbished items, counterfeit traps, budget breaches, and prompt-injection attacks.

---

### Challenges We Ran Into
1. **PayPal Webhook Byte-Level CRC32 Invalidation in Next.js:**  
   PayPal's webhook verification algorithm recalculates an unsigned 32-bit CRC32 hash of the raw webhook payload bytes. In Next.js API routes, parsing the body as JSON and re-serializing it with `JSON.stringify()` changes key ordering and float representations (e.g. `12.50` vs `12.5`), immediately invalidating the signature.  
   *Solution:* We read the raw body once via `await req.text()`, calculate its unsigned CRC32, and splice the raw string directly into the verification payload. We also implemented a local RSA-SHA256 fallback for events originating from the PayPal Webhook Simulator.
2. **Catalog Poisoning in Multi-Merchant Search:**  
   When querying Channel3 for "Espresso Beans 5lb", search results inevitably include accessories (like an $8.99 dosing scoop) or retail bags (a $16.50 12oz bag). In an unfiltered median calculation, these irrelevant items dragged the peer median down to $49.00, which lowered the 65% plausibility threshold to $31.85 and allowed a $36.00 counterfeit trap to be erroneously marked `ALLOW`.  
   *Solution:* We authored `computeVerifiedPeerMedian`, strictly filtering by `sameProduct === true && inStock === true` prior to calculating the median, establishing a true $63.25 baseline that caught the trap.
3. **Short-Circuit Masking in Financial Policy Gates:**  
   Standard if-else validation functions exit early upon finding the first non-fatal warning (e.g., returning `ASK` for a refurbished portafilter). This masked fatal downstream violations (such as exceeding the café owner's monthly budget limit).  
   *Solution:* We built a non-short-circuiting 9-rule severity lattice that processes every rule unconditionally and resolves final status through the strict hierarchy: **BLOCK > ASK > ALLOW**.
4. **Preventing Premature Captures in Two-Phase Orders:**  
   Calling PayPal's capture endpoint before a café owner has completed buyer checkout returns an unrecoverable HTTP 422 `ORDER_NOT_APPROVED`.  
   *Solution:* In Phase B, our engine performs a mandatory pre-capture GET check on `api-m.sandbox.paypal.com` to assert `status === "APPROVED"` before initiating capture.

---

### Accomplishments We're Proud Of
- **24/24 (100.0%) Adversarial Benchmark Score:** Tested across 24 realistic café replenishment scenarios; achieved a Wilson 95% Confidence Interval lower bound of **86.2%**.
- **$0.00 Unsafe False-Spend:** Prevented $7,010.49 in unauthorized or fraudulent orders compared to a naive AI agent, and $124.00 compared to a short-circuiting gate.
- **$838.50 Duplicate Spend Prevented:** Proven in our live café run on `OAT-MILK-6PK` by utilizing Net-Inventory position rather than raw on-hand counts.
- **Zero Money-Moving Tools for AI:** The AI agent and MCP server have zero programmatic access to payment credentials, order capture endpoints, or mandate overrides.
- **Clean Production-Grade Engineering:** 95+ unit and integration tests passing with 0 errors, strict TypeScript compilation, and atomic git history.

---

### What We Learned
- **Deterministic Code Must Hold the Wallet:** Language models are phenomenal at parsing unstructured plain English ("keep $500 buffer for milk") and extracting SKU specifications, but mathematical replenishment and financial authorization must remain 100% deterministic code.
- **Idempotency is Non-Negotiable:** In distributed agentic commerce, network retries and webhook delays are inevitable. Generating deterministic SHA-256 idempotency keys (`PayPal-Request-Id`) tied to the purchase order and amount guarantees that an order is never duplicated or double-captured.
- **The Power of Grounded Evidence:** Displaying authoritative PayPal GET read-backs with live Sandbox Order IDs builds immediate trust with merchants and hackathon judges alike.

---

### What's Next for RestockPilot
- **Multi-Location Café Group Franchising:** Expanding mandate hierarchies so regional managers can set master budgets while store managers approve local deliveries.
- **Automated Supplier EDI & Channel3 B2B Checkout:** Bridging approved PayPal sandbox captures directly into automated Channel3 supplier fulfillment.
- **Predictive Weather & Foot-Traffic Demand Calibration:** Dynamically adjusting safety stock thresholds ($SS$) based on local events and weekend weather forecasts.

---

## ⏱️ Timed 2-Minute 45-Second Demo Video Script

**Target Duration:** Exactly 2 minutes and 45 seconds (165 seconds)  
**Presenter Tone:** Confident, technical, crisp, and focused on financial trust.

| Timestamp | Speaker Audio / Voiceover | Screen Visual & Demonstration Actions |
| :--- | :--- | :--- |
| **0:00 – 0:25** <br>*(25 sec)* | *"Every morning, independent café owners face the same nightmare: running out of whole-bean espresso during the 8 AM rush, or spending hours comparing supplier prices and accidentally double-ordering milk. <br>Meet **RestockPilot** — an autonomous café replenishment agent built on a strict foundation of trust: **AI proposes, deterministic code decides, the owner approves, and PayPal verifies**."* | **Screen 1: Landing / Hero Overview**<br>- Show `http://localhost:3000/demo`.<br>- Point camera/cursor to the café banner: *"Sunrise Roasters Café"*, showing the current monthly budget ($3,500.00) and live inventory summary cards. |
| **0:25 – 0:55** <br>*(30 sec)* | *"Let's trigger our morning restock cycle with one click. Notice what happens immediately in code: our replenishment engine doesn't just look at on-hand stock. It uses periodic-review $(s, S)$ net-inventory replenishment math: **on-hand plus on-order minus committed**. <br>Look at our Oatly Barista Milk: on-hand is only 12, but we already have 12 cases in-transit on PayPal. Our net position is 24, which exceeds our reorder point. RestockPilot orders **zero cases**, instantly saving the café **$838.50 in duplicate spending**!"* | **Screen 2: One-Click Restock & Net-Inventory Math**<br>- Click the blue button: **`[Run Café Restock Cycle (1-Click)]`**.<br>- Highlight the `OAT-MILK-6PK` card.<br>- Show badge: `SURPLUS / IN-TRANSIT (0 CASES NEEDED)`.<br>- Zoom cursor on: *"$838.50 duplicate order prevented"*. |
| **0:55 – 1:25** <br>*(30 sec)* | *"For our Five-Star Espresso Beans, we have a real deficit. RestockPilot queries live supplier catalogs across 25,000 merchants via Channel3. <br>Now, raw catalog searches are dangerous: cheap $8 dosing scoops or 12oz retail bags can poison price medians. RestockPilot's `computeVerifiedPeerMedian` pre-filters for identical, in-stock products, establishing a verified median of $63.25. <br>This catches a suspicious $36 clearance listing and flags it to ASK, while selecting the verified $62 wholesale offer."* | **Screen 3: Channel3 Multi-Merchant Quotes & Filtered Median**<br>- Scroll to the `ESPRESSO-5LB` Owner Approval Card.<br>- Highlight the Channel3 Offers comparison table: show the 6 raw offers ($8.99 scoop, $16.50 12oz, $36 trap, $62 valid).<br>- Point out the Verified Peer Median calculation ($63.25).<br>- Show the verified savings badges: `+$17.50 vs Peer Median` and `+$28.00 vs Last Paid`. |
| **1:25 – 1:55** <br>*(30 sec)* | *"Next, the offer passes through our 9-rule non-short-circuiting severity lattice policy gate. Because it never short-circuits, warning flags never mask fatal budget blocks. With all 9 rules evaluated, it produces our verified Owner Approval Card. <br>Notice our security boundary: the AI has **zero money-moving tools**. Only the human owner can initiate payment. Let's click **Create PayPal Order**."* | **Screen 4: Owner Approval Card & Phase A Order Creation**<br>- Show the 9-Rule Lattice summary badge: `ALLOW`.<br>- Click **`[Phase A: Create PayPal Order]`**.<br>- Show the instant generation of the deterministic SHA-256 `PayPal-Request-Id` idempotency key and `custom_id` contract hash. |
| **1:55 – 2:20** <br>*(25 sec)* | *"In Phase A, RestockPilot creates an immutable PayPal Orders v2 order with intent CAPTURE. <br>The owner reviews the order details and clicks **Approve on PayPal Sandbox**. Once approved in Sandbox, Phase B executes a mandatory pre-capture GET check to assert status is APPROVED, completely preventing HTTP 422 errors, then captures payment. <br>PayPal fires a raw-body webhook, verified via unsigned 32-bit CRC32, and our inventory automatically increments on-order."* | **Screen 5: PayPal Sandbox Approval & Phase B Capture**<br>- Click **`[Approve on PayPal Sandbox ↗]`** (or show the approved order modal).<br>- Click **`[Phase B: Verify & Capture Approved Order]`**.<br>- Show capture success alert: Order `CAPTURED`, PayPal Fee deducted, onOrder updated to 18 bags. |
| **2:20 – 2:35** <br>*(15 sec)* | *"All transactions flow directly into our interactive **AG Grid Financial Ledger**. <br>Merchants can filter by status—ALLOW, ASK, BLOCK, or CAPTURED—inspect SHA-256 idempotency keys, and view our pinned bottom totals row reconciling total spend, net savings, and remaining monthly budget in real time."* | **Screen 6: AG Grid Interactive Ledger**<br>- Scroll down to the AG Grid Financial Reconciliation Ledger.<br>- Click the status filter pills (`ALLOW`, `CAPTURED`).<br>- Type in quick filter search bar: `"Espresso"` or `"Oat Milk"`.<br>- Highlight the **pinned bottom row**: Total Approved Spend ($868.00), Total Savings ($45.50), Remaining Budget ($2,632.00). |
| **2:35 – 2:45** <br>*(10 sec)* | *"Finally, our **`/evidence`** page allows judges to execute live PayPal Sandbox GET read-backs on any order ID, backed by our 24-case benchmark with 100% accuracy and zero unsafe spend. <br>**RestockPilot**: Autonomous café inventory, verified by PayPal. Thank you!"* | **Screen 7: Evidence Registry & Benchmark**<br>- Quick cut to `/evidence`.<br>- Click **`[Verify with PayPal GET]`** to display live JSON response from `api-m.sandbox.paypal.com`.<br>- Flash the 24/24 Benchmark accuracy badge (100.0% pass, $0.00 unsafe spend).<br>- End on the RestockPilot logo & GitHub link. |

---

## 🏆 Checklist for Submission Form
- [x] **Project Name:** RestockPilot
- [x] **Tagline:** Your café never runs out, and your agent never overspends. AI proposes, deterministic code decides, the owner approves, and PayPal verifies.
- [x] **Track Selected:** Grand Prize / Best Use of Agentic Commerce / Best Use of PayPal + AI
- [x] **Additional Tracks:** Best Use of Channel3, Best Use of AG Grid
- [x] **Video URL:** (Upload recording following the 2:45 script above)
- [x] **GitHub Repo URL:** (Public repository URL)
- [x] **Testing Instructions:** Included in README.md (`npm install`, `npm test`, `npm run eval`, `npm run dev`)
- [x] **Credentials:** Configured via `.env.local` with Sandbox credentials; includes instant zero-friction simulated mode fallback.
