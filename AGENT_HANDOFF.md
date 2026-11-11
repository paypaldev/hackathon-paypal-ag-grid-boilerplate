# AGENT_HANDOFF.md — VeriSettle AI Build Specification

**Target Event:** PayPal AI Hackathon 2026 ("Build What's Next with PayPal and AI")  
**Hard Submission Deadline:** November 12, 2026 at 12:00 PM PST (November 13, 2026 at 1:30 AM IST)  
**System Name:** VeriSettle AI — Autonomous B2B Escrow, Multimodal 3-Way Invoice Reconciliation & Dispute Defense OS  
**Core Architectural Law:** "AI/ML Proposes, Deterministic Policy Disposes, PayPal Executes."

---

## 1. Strategic Context & Non-Negotiable Constraints

1. **Stage 1 Pass/Fail Viability Gates:**
   - **Working Sandbox Prototype:** Must execute real PayPal Sandbox API calls (`https://api-m.sandbox.paypal.com`).
   - **Public Open-Source License:** A top-level `LICENSE` file (MIT) committed immediately.
   - **Zero Leaked Secrets:** Never commit `.env` or `.env.local`. Place `import "server-only";` at the top of all server PayPal modules (`src/lib/paypal-*.ts`).
2. **Stage 2 Tie-Breaker (Rule Section 7):**
   - All judging ties are broken by **Technological Implementation**. Verifiable ML/DL pipelines, deterministic financial math, cryptographic policy digests, and multi-step PayPal Sandbox state transitions.
3. **Prize-Stacking Target (Rule Section 8):**
   - Maximize pool eligibility across Main Track and 5 Sponsor Tools:
     - **AG Grid / AG Studio:** 10-table relational ledger with `type: 'money'` formatting and variance badges.
     - **APIMatic:** Grounded via `paypaldev/server-sdk-context-plugin-preview` and `@paypal/paypal-server-sdk@2.5.0`.
     - **Bryntum:** Interactive Gantt chart modeling Finish-to-Start (`FS`) escrow milestones (`M1` -> `M2` -> `M3`).
     - **Channel3:** Multi-merchant product catalog discovery and category price norms.
     - **Render:** Cloud deployment blueprint (`render.yaml`) hosting Next.js 16 web app and Python FastAPI ML service.

---

## 2. Directory Architecture

```
verisettle-ai/
├── LICENSE                          # Mandatory MIT License
├── PAYPAL.md                        # Human-readable spend mandate constitution
├── render.yaml                      # Multi-service Render deployment spec
├── .env.example                     # Clean environment template
├── scripts/
│   └── seed-paypal.ts               # Official + extended sandbox seeder
├── src/
│   ├── app/
│   │   ├── dashboard/page.tsx       # Unified AG Studio + Bryntum + Audit Drawer UI
│   │   └── api/
│   │       ├── agent/route.ts       # Cosmos.AI 2-step MCP Gateway endpoint
│   │       ├── paypal/
│   │       │   ├── escrow/route.ts  # Authorize, Capture, Void endpoints
│   │       │   ├── invoice/route.ts # Skeptic Gate Invoicing v2 endpoint
│   │       │   ├── dispute/route.ts # Disputes v1 triage & execution endpoint
│   │       │   └── webhook/route.ts # CRC32 + HMAC-SHA256 webhook listener
│   │       └── test-bar/route.ts    # Judge 1-Click Live Sandbox Test actions
│   ├── lib/
│   │   ├── paypal-auth.ts           # Cached OAuth2 token helper + retry logic
│   │   ├── paypal-escrow-disputes.ts# Core PayPal REST execution + Audit Trace
│   │   ├── mcp-gateway.ts           # Cosmos.AI tool_search + execute_tool
│   │   ├── policy-firewall.ts       # PAYPAL.md AST parser + FIPS 180-4 SHA-256 gate
│   │   ├── ml-fallback.ts           # Pure TS fallback for EV, Holt-Winters & Risk
│   │   └── dashboard-data.ts        # Joins 9 PayPal tables + 10th ML Audit table
├── ml_service/
│   ├── main.py                      # FastAPI server (/ml/extract-document, /ml/score-transaction, /ml/evaluate-economics)
│   ├── extractor_layoutlmv3.py      # LayoutLMv3 + Gemini 2.5 Flash + Regex 3-way match
│   ├── risk_engine.py               # Leak-free XGBoost + PyTorch GAT + LSTM Autoencoder
│   ├── ev_controller.py             # Terms Desk Skeptic Gate + DisputePilot cost math
│   └── train_benchmark.py           # Generates ROC AUC validation metrics for README.md
└── tests/
    └── verisettle.test.ts           # 10+ Vitest verification tests
```
