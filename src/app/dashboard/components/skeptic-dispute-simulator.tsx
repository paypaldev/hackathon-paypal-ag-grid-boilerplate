'use client';

import React, { useState } from 'react';
import { DollarSign, ShieldAlert, Percent, ArrowRight, CheckCircle2, Lock, ExternalLink, Calculator } from 'lucide-react';
import { evaluateEarlyDiscountSkepticGate, evaluateDisputeTriage } from '@/lib/ml-fallback';

export function SkepticDisputeSimulator() {
  const [activeTab, setActiveTab] = useState<'INVOICE_GATE' | 'DISPUTE_TRIAGE'>('INVOICE_GATE');

  // Invoice Skeptic Gate State
  const [invoiceValue, setInvoiceValue] = useState<number>(2500);
  const [pOnTime, setPOnTime] = useState<number>(0.92);
  const [annualCost, setAnnualCost] = useState<number>(0.15);

  const skepticResult = evaluateEarlyDiscountSkepticGate({
    invoiceValueUsd: invoiceValue,
    pOnTimeClient: pOnTime,
    annualCapitalCost: annualCost,
    discountRate: 0.02,
    accelerationDays: 20,
  });

  // Dispute Triage State
  const [disputedAmount, setDisputedAmount] = useState<number>(1850);
  const [baseWinProb, setBaseWinProb] = useState<number>(0.85);
  const [llmAdj, setLlmAdj] = useState<number>(0.05);

  const triageResult = evaluateDisputeTriage({
    disputeId: 'PP-D-94821',
    orderId: 'ORD-2026-X88',
    trackingNumber: '1Z9999999999999999',
    invoiceId: 'INV-2026-001',
    disputedAmountUsd: disputedAmount,
    baseWinProb: baseWinProb,
    llmWinProbAdjustment: llmAdj,
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      {/* Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600/30 border border-emerald-500/50 p-2 rounded-lg text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Deterministic Economic Policy Simulators
            </h2>
            <p className="text-xs text-slate-400">
              Invoicing v2 "Skeptic Gate" margin preservation & Disputes v1 Expected-Cost Triage
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('INVOICE_GATE')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeTab === 'INVOICE_GATE'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Invoicing v2 Skeptic Gate
          </button>
          <button
            onClick={() => setActiveTab('DISPUTE_TRIAGE')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeTab === 'DISPUTE_TRIAGE'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Disputes v1 Triage
          </button>
        </div>
      </div>

      {/* TAB 1: Invoicing v2 Skeptic Gate */}
      {activeTab === 'INVOICE_GATE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Controls */}
          <div className="space-y-4 bg-slate-950/60 p-4 rounded-lg border border-slate-800">
            <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Percent className="w-4 h-4 text-blue-400" />
              <span>Simulate Early-Payment Terms (2/10 Net 30)</span>
            </h3>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Invoice Face Value ($V)</span>
                <span className="text-white font-mono font-bold">${invoiceValue.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={500}
                max={10000}
                step={100}
                value={invoiceValue}
                onChange={(e) => setInvoiceValue(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Client Historical On-Time Prob (p_on_time)</span>
                <span className="text-white font-mono font-bold">{(pOnTime * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.99}
                step={0.01}
                value={pOnTime}
                onChange={(e) => setPOnTime(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                Calibrated from XGBoost leak-free frequency model on 41,555 B2B invoices.
              </span>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Merchant Capital Cost (APR)</span>
                <span className="text-white font-mono font-bold">{(annualCost * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.35}
                step={0.01}
                value={annualCost}
                onChange={(e) => setAnnualCost(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Real-time Economic Outcome */}
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                  Skeptic Gate Decision
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[11px] ${
                    skepticResult.decision === 'BLOCK_DISCOUNT'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {skepticResult.decision}
                </span>
              </div>

              <p className="text-slate-300 mb-4 leading-relaxed">
                {skepticResult.recommendation}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Net Expected Value (EV)</div>
                  <div
                    className={`text-sm font-bold font-mono ${
                      skepticResult.evDiscountUsd <= 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    ${skepticResult.evDiscountUsd.toFixed(2)}
                  </div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Preserved Profit Margin</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    ${skepticResult.preservedMarginUsd.toFixed(2)}
                  </div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Annualized Terms Cost</div>
                  <div className="text-sm font-bold font-mono text-amber-400">
                    ~{skepticResult.annualizedCostOfDiscountPct}%
                  </div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Dispatched PayPal Action</div>
                  <div className="text-xs font-semibold text-slate-200">
                    {skepticResult.decision === 'BLOCK_DISCOUNT'
                      ? 'POST /v2/invoices (Full)'
                      : 'POST /v2/invoices (Net 10)'}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2">
              Formula: EV = p_accel · V · ((1 - d) - 1/(1+r)^Δt) - p_on_time · (d · V)
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Disputes v1 Triage Simulator */}
      {activeTab === 'DISPUTE_TRIAGE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Controls */}
          <div className="space-y-4 bg-slate-950/60 p-4 rounded-lg border border-slate-800">
            <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span>Simulate PayPal Disputes v1 Triage Math</span>
            </h3>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Disputed Claim Amount ($D)</span>
                <span className="text-white font-mono font-bold">${disputedAmount.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={200}
                max={5000}
                step={50}
                value={disputedAmount}
                onChange={(e) => setDisputedAmount(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Base Evidence Win Probability (Tracking + QA)</span>
                <span className="text-white font-mono font-bold">{(baseWinProb * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={0.99}
                step={0.01}
                value={baseWinProb}
                onChange={(e) => setBaseWinProb(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">LLM Contextual Shift (Clamped to ±15%)</span>
                <span className="text-purple-400 font-mono font-bold">
                  {(llmAdj > 0 ? '+' : '') + (llmAdj * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={-0.3}
                max={0.3}
                step={0.01}
                value={llmAdj}
                onChange={(e) => setLlmAdj(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                Notice: Raw LLM values exceeding ±15% are strictly clamped by policy-firewall.ts.
              </span>
            </div>
          </div>

          {/* Expected Cost Comparison */}
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                  Optimal Strategy
                </span>
                <span className="px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {triageResult.recommendedStrategy}
                </span>
              </div>

              {/* Strategy Comparison Matrix */}
              <div className="space-y-2 mb-4">
                <div
                  className={`p-2 rounded border flex items-center justify-between ${
                    triageResult.recommendedStrategy === 'PROVIDE_EVIDENCE'
                      ? 'bg-purple-950/40 border-purple-500/50 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span>1. Cost_fight (Provide Evidence)</span>
                  <span className="font-mono font-bold">${triageResult.costFightUsd.toFixed(2)}</span>
                </div>

                <div
                  className={`p-2 rounded border flex items-center justify-between ${
                    triageResult.recommendedStrategy === 'MAKE_OFFER'
                      ? 'bg-purple-950/40 border-purple-500/50 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span>2. Cost_make_offer (50% Settle)</span>
                  <span className="font-mono font-bold">${triageResult.costMakeOfferUsd.toFixed(2)}</span>
                </div>

                <div
                  className={`p-2 rounded border flex items-center justify-between ${
                    triageResult.recommendedStrategy === 'ACCEPT_CLAIM'
                      ? 'bg-purple-950/40 border-purple-500/50 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span>3. Cost_accept_claim (Forfeit)</span>
                  <span className="font-mono font-bold">${triageResult.costAcceptClaimUsd.toFixed(2)}</span>
                </div>
              </div>

              {/* ID-Cited Rebuttal Draft Preview */}
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300">
                <div className="text-slate-400 font-semibold mb-1">Clickable ID-Cited Rebuttal Draft:</div>
                <p className="font-mono text-purple-300">
                  {triageResult.rebuttalDraftWithCitations}
                </p>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 mt-3">
              Calibrated Win Rate: {(triageResult.calibratedWinProb * 100).toFixed(1)}% | Applied LLM Shift: {(triageResult.llmAdjustmentApplied * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

