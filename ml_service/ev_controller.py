"""
VeriSettle AI — Deterministic Expected-Value (EV) Financial Controller
Implements:
 1. Invoicing v2 Early-Payment Discount "Skeptic Gate"
 2. Disputes v1 Chargeback Triage Calculator with ±0.15 LLM Adjustment Cap
"""

import math
from typing import Dict, Any

def evaluate_discount_skeptic_gate(
    invoice_value: float,
    discount_rate: float = 0.02,
    acceleration_days: int = 20,
    annual_capital_cost: float = 0.15,
    p_on_time: float = 0.90,
    p_accel: float = 0.85
) -> Dict[str, Any]:
    """
    Computes EV_discount = p_accel * V * ((1 - d) - 1 / (1 + r_daily)^delta_t) - p_on_time * (d * V)
    """
    v = invoice_value
    d = discount_rate
    delta_t = acceleration_days
    r_daily = annual_capital_cost / 365.0

    present_value_factor = 1.0 / math.pow(1.0 + r_daily, delta_t)
    ev_discount = p_accel * v * ((1.0 - d) - present_value_factor) - p_on_time * (d * v)
    preserved_margin = d * v
    annualized_cost_pct = (d / (1.0 - d)) * (365.0 / delta_t) * 100.0

    decision = "BLOCK_DISCOUNT" if ev_discount <= 0 else "PROPOSE_DISCOUNT"

    return {
        "ev_discount_usd": round(ev_discount, 2),
        "decision": decision,
        "preserved_margin_usd": round(preserved_margin, 2),
        "annualized_cost_pct": round(annualized_cost_pct, 1),
        "recommendation": (
            f"Blocked 2% discount (${preserved_margin:.2f} preserved). High on-time prob ({p_on_time*100:.1f}%) makes ~{annualized_cost_pct:.1f}% terms dilutive."
            if decision == "BLOCK_DISCOUNT"
            else f"Proposed 2/10 Net 30 discount (+$ {ev_discount:.2f} EV)."
        )
    }

def evaluate_dispute_triage(
    dispute_id: str,
    order_id: str,
    tracking_number: str,
    invoice_id: str,
    disputed_amount: float,
    dispute_fee: float = 15.0,
    seller_prep_labor_cost: float = 25.0,
    partial_offer_amount: float = 0.0,
    buyer_accept_offer_prob: float = 0.70,
    base_win_prob: float = 0.80,
    llm_win_prob_adjustment: float = 0.0
) -> Dict[str, Any]:
    """
    Disputes v1 Expected-Cost Triage Calculator.
    Camps LLM win-rate adjustment strictly to [-0.15, +0.15].
    """
    d = disputed_amount
    f = dispute_fee
    c_prep = seller_prep_labor_cost
    s = partial_offer_amount if partial_offer_amount > 0 else d * 0.5
    p_accept_offer = buyer_accept_offer_prob

    # Strict clamp to [-0.15, +0.15]
    clamped_adj = max(-0.15, min(0.15, llm_win_prob_adjustment))
    calibrated_win_prob = max(0.01, min(0.99, base_win_prob + clamped_adj))

    cost_fight = (1.0 - calibrated_win_prob) * (d + f) + c_prep
    cost_accept_claim = d
    cost_make_offer = p_accept_offer * s + (1.0 - p_accept_offer) * cost_fight

    best_strategy = "PROVIDE_EVIDENCE"
    min_cost = cost_fight

    if cost_make_offer < min_cost:
        min_cost = cost_make_offer
        best_strategy = "MAKE_OFFER"
    if cost_accept_claim < min_cost:
        min_cost = cost_accept_claim
        best_strategy = "ACCEPT_CLAIM"

    rebuttal_draft = (
        f"Rebuttal for Dispute [ID: {dispute_id}]: Fulfillment verified under Purchase Order [ID: {order_id}] "
        f"via Carrier Tracking [ID: {tracking_number}]. Matched Invoice [ID: {invoice_id}]. "
        f"Expected fight win-rate: {calibrated_win_prob*100:.1f}%."
    )

    return {
        "dispute_id": dispute_id,
        "calibrated_win_prob": round(calibrated_win_prob, 3),
        "llm_adjustment_applied": round(clamped_adj, 3),
        "cost_fight_usd": round(cost_fight, 2),
        "cost_accept_claim_usd": round(cost_accept_claim, 2),
        "cost_make_offer_usd": round(cost_make_offer, 2),
        "recommended_strategy": best_strategy,
        "expected_loss_usd": round(min_cost, 2),
        "rebuttal_draft": rebuttal_draft
    }

