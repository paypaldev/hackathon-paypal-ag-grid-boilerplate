# VeriSettle AI — Release & Render Deployment Guide

**Target Environment:** Render Cloud & GitHub  
**Release Tag:** `v1.0.0-hackathon`  
**Git Branch:** `fix/full-system-stabilization`  
**Blueprint File:** `render.yaml`  

---

## 1. Multi-Service Cloud Architecture

VeriSettle AI is configured as a dual-service architecture on Render:

1. **`verisettle-web`**: Next.js 16 Web Command Center & Cosmos.AI Gateway (Node.js environment).
   - Serves React 19 UI, AG Grid Relational Workspace, and Bryntum Gantt Panel.
   - Executes Next.js route handlers (`/api/paypal/*`, `/api/gemini/*`, `/api/channel3/*`, `/api/health`).
   - Enforces the Deterministic Policy Firewall before financial execution.
2. **`verisettle-ml`**: Python 3.11 FastAPI Microservice.
   - Hosts LayoutLMv3 document extraction, XGBoost risk classification, and EV decision controller.
   - Connected via internal service networking (`ML_SERVICE_URL`).

```
                              ┌─────────────────────────────────────────┐
                              │            RENDER BLUEPRINT             │
                              └────────────────────┬────────────────────┘
                                                   │
                         ┌─────────────────────────┴────────────────────────┐
                         │                                                  │
                         ▼                                                  ▼
             ┌─────────────────────────┐                        ┌────────────────────────┐
             │     verisettle-web      │                        │     verisettle-ml      │
             │   (Next.js 16 / Node)   │ ────── ML_SERVICE ────>│  (FastAPI / Python)    │
             │ Health: /api/health     │                        │ Health: /health        │
             └───────────┬─────────────┘                        └────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   PayPal Sandbox    Gemini AI       Channel3
   REST API v2       v1beta Models   Catalog API
```

---

## 2. Render Blueprint Specification (`render.yaml`)

```yaml
services:
  # 1. Next.js 16 Web Command Center & Cosmos.AI Gateway
  - type: web
    name: verisettle-web
    env: node
    plan: standard
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PAYPAL_ENVIRONMENT
        value: SANDBOX
      - key: PAYPAL_BASE_URL
        value: https://api-m.sandbox.paypal.com
      - key: PAYPAL_CLIENT_ID
        sync: false
      - key: PAYPAL_SECRET
        sync: false
      - key: PAYPAL_WEBHOOK_ID
        sync: false
      - key: GEMINI_API_KEY
        sync: false
      - key: CHANNEL3_API_KEY
        sync: false
      - key: ML_SERVICE_URL
        fromService:
          type: web
          name: verisettle-ml
          property: host
      - key: ML_MODE
        value: cached

  # 2. Python FastAPI ML/DL Microservice (LayoutLMv3 + XGBoost + GNN/LSTM)
  - type: web
    name: verisettle-ml
    env: python
    plan: standard
    buildCommand: cd ml_service && pip install -r requirements.txt
    startCommand: cd ml_service && uvicorn main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.8
      - key: GEMINI_API_KEY
        sync: false
```

---

## 3. Required Environment Variables

When deploying on Render, configure the following secrets in the Render Dashboard (or via the Blueprint environment variables prompt):

| Variable Name | Required Service | Purpose | Value Example / Format |
|---|---|---|---|
| `PAYPAL_CLIENT_ID` | `verisettle-web` | PayPal Sandbox REST Client ID | Standard 80-char alphanumeric string from Developer Dashboard |
| `PAYPAL_SECRET` | `verisettle-web` | PayPal Sandbox REST Secret | Sandbox Client Secret |
| `PAYPAL_WEBHOOK_ID` | `verisettle-web` | Registered PayPal Webhook ID | Webhook identifier from PayPal Developer Console |
| `GEMINI_API_KEY` | `verisettle-web`, `verisettle-ml` | Google Generative AI Developer Key | `AIzaSy...` key from Google AI Studio |
| `CHANNEL3_API_KEY` | `verisettle-web` | Channel3 Universal Catalog Key | `c3_live_...` API Key |
| `NODE_ENV` | `verisettle-web` | Node runtime environment | `production` |
| `PAYPAL_ENVIRONMENT`| `verisettle-web` | Sandbox vs Live targeting | `SANDBOX` |
| `PAYPAL_BASE_URL` | `verisettle-web` | Base URL for PayPal REST calls | `https://api-m.sandbox.paypal.com` |

---

## 4. One-Click Render Deployment Instructions

1. Log into your Render account at [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository (`vikassharma270907-alt/verisettle-ai` or your fork).
4. Select the branch `fix/full-system-stabilization`.
5. Render will automatically parse `render.yaml` and discover both services:
   - `verisettle-web` (Web Service)
   - `verisettle-ml` (Web Service)
6. Fill in the sensitive environment variables (`PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `GEMINI_API_KEY`, `CHANNEL3_API_KEY`) when prompted.
7. Click **Apply**.
8. Render will provision both services in parallel, execute builds, check `/api/health` and `/health`, and route traffic to the production URLs.

---

## 5. Post-Deployment Verification Checklist

- [ ] Check `https://<your-verisettle-web-url>/api/health`: Verify overall status returns `HEALTHY` or `DEGRADED` with latency breakdown.
- [ ] Access Dashboard at `https://<your-verisettle-web-url>/dashboard`: Verify AG Grid table renders transactions and Bryntum Gantt renders milestones.
- [ ] Test Channel3 Catalog Explorer: Run live product query (e.g., "Apple MacBook Pro").
- [ ] Test Gemini Extraction: Upload or trigger invoice test in Judge Bar.
- [ ] Verify Cosmos Audit Drawer: Inspect logged forensic event traces.
