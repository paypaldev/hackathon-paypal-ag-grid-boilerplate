"""
VeriSettle AI — Python FastAPI Machine Learning Intelligence Service
Exposes:
 1. POST /ml/extract-document: LayoutLMv3 + Gemini 2.5 Flash + Regex multimodal 3-way match
 2. POST /ml/score-transaction: Leak-free frequency encoding + LSTM Autoencoder / GNN + Platt-scaled BMA
 3. POST /ml/evaluate-economics: Invoicing v2 Skeptic Gate & Disputes v1 triage math
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from extractor_layoutlmv3 import run_layoutlmv3_inference, reconcile_3way_match
from risk_engine import score_transaction_risk
from ev_controller import evaluate_discount_skeptic_gate, evaluate_dispute_triage

app = FastAPI(
    title="VeriSettle AI — Machine Learning Intelligence Service",
    version="2026.1.0",
    description="Autonomous B2B Escrow, Multimodal 3-Way Reconciliation & Dispute Defense ML Engine"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Request / Response Schemas ----------------- #

class ExtractDocumentRequest(BaseModel):
    raw_text: str = Field(..., description="Raw text or OCR token stream from uploaded document")
    paypal_authorized_amount: float = Field(0.0, description="Amount currently held in PayPal escrow authorization")
    channel3_po_quote: float = Field(0.0, description="Original Channel3 PO quote for 3-way comparison")

class ScoreTransactionRequest(BaseModel):
    amount: float
    category: str
    unit_price: float
    channel3_category_mean: float = 120.0
    channel3_category_std: float = 15.0
    prior_orders: List[Dict[str, Any]] = []
    carrier_delivered: bool = True

class EvaluateEconomicsRequest(BaseModel):
    use_case: str = Field(..., description="'INVOICE_DISCOUNT_GATE' or 'DISPUTE_TRIAGE'")
    # Fields for INVOICE_DISCOUNT_GATE
    invoice_value: Optional[float] = 2500.0
    p_on_time: Optional[float] = 0.92
    annual_capital_cost: Optional[float] = 0.15
    # Fields for DISPUTE_TRIAGE
    dispute_id: Optional[str] = "PP-D-84920"
    order_id: Optional[str] = "ORD-2026-X88"
    tracking_number: Optional[str] = "1Z9999999999999999"
    invoice_id: Optional[str] = "INV-2026-001"
    disputed_amount: Optional[float] = 1850.0
    base_win_prob: Optional[float] = 0.85
    llm_win_prob_adjustment: Optional[float] = 0.05

# ----------------- API Endpoints ----------------- #

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "VeriSettle AI ML Service",
        "version": "2026.1.0",
        "models": [
            "devashish-pisal/layoutlmv3-sroie-token-classification",
            "leak_free_xgboost_payment_timing",
            "lstm_autoencoder_evt_anomaly",
            "gat_collusion_detector",
            "skeptic_gate_ev_controller"
        ]
    }

@app.post("/ml/extract-document")
def extract_document(req: ExtractDocumentRequest):
    try:
        extracted = run_layoutlmv3_inference(None, req.raw_text)
        reconciled = reconcile_3way_match(
            extracted_total=extracted["total_amount"],
            paypal_authorized_amount=req.paypal_authorized_amount,
            channel3_quote_amount=req.channel3_po_quote
        )
        return {
            "status": "success",
            "extracted": extracted,
            "reconciliation": reconciled
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ml/score-transaction")
def score_transaction(req: ScoreTransactionRequest):
    try:
        res = score_transaction_risk(
            amount=req.amount,
            category=req.category,
            unit_price=req.unit_price,
            channel3_mean=req.channel3_category_mean,
            channel3_std=req.channel3_category_std,
            prior_orders=req.prior_orders,
            carrier_delivered=req.carrier_delivered
        )
        return {"status": "success", "risk_evaluation": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ml/evaluate-economics")
def evaluate_economics(req: EvaluateEconomicsRequest):
    try:
        if req.use_case == "INVOICE_DISCOUNT_GATE":
            res = evaluate_discount_skeptic_gate(
                invoice_value=req.invoice_value or 2500.0,
                p_on_time=req.p_on_time or 0.90,
                annual_capital_cost=req.annual_capital_cost or 0.15
            )
            return {"status": "success", "use_case": req.use_case, "result": res}
        elif req.use_case == "DISPUTE_TRIAGE":
            res = evaluate_dispute_triage(
                dispute_id=req.dispute_id or "PP-D-84920",
                order_id=req.order_id or "ORD-2026-X88",
                tracking_number=req.tracking_number or "1Z9999999999999999",
                invoice_id=req.invoice_id or "INV-2026-001",
                disputed_amount=req.disputed_amount or 1850.0,
                base_win_prob=req.base_win_prob or 0.85,
                llm_win_prob_adjustment=req.llm_win_prob_adjustment or 0.0
            )
            return {"status": "success", "use_case": req.use_case, "result": res}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown use_case: {req.use_case}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
