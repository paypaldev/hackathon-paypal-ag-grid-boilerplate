'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Percent,
  Calculator,
  TrendingUp,
  ShoppingCart,
  Cpu,
} from 'lucide-react';
import {
  evaluateEarlyDiscountSkepticGate,
  evaluateDisputeTriage,
  evaluateCollusionGuardMcp,
  evaluateMarginPulseBandit,
  evaluateRestockForecaster,
} from '@/lib/ml-fallback';

export function SkepticDisputeSimulator() {
  const [activeTab, setActiveTab] = useState<
    'INVOICE_GATE' | 'DISPUTE_TRIAGE' | 'COLLUSION_GUARD' | 'MARGIN_PULSE' | 'RESTOCK_AP2'
  >('INVOICE_GATE');

  // 1. Invoice Skeptic Gate State
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

  // 2. Dispute Triage State
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

  // 3. CollusionGuard MCP State
  const [vendorTxns, setVendorTxns] = useState<number>(45);
  const totalTxns = 500;
  const lateTxns = 1;
  const [proposalAmount, setProposalAmount] = useState<number>(2450);
  const [lstmZ, setLstmZ] = useState<number>(0.4);
  const [gatScore, setGatScore] = useState<number>(0.12);

  const collusionResult = evaluateCollusionGuardMcp({
    vendorId: 'VEND-APEX-901',
    priorVendorTxns: vendorTxns,
    totalPriorTxns: totalTxns,
    priorVendorLateCount: lateTxns,
    amountUsd: proposalAmount,
    categoryMeanUsd: 2200,
    categoryStdUsd: 250,
    lstmReconResidualZ: lstmZ,
    gnnCollusionScore: gatScore,
  });

  // 4. MarginPulse Bandit State
  const [banditInvoiceValue, setBanditInvoiceValue] = useState<number>(4800);
  const [banditPOnTime, setBanditPOnTime] = useState<number>(0.72);

  const banditResult = evaluateMarginPulseBandit({
    invoiceValueUsd: banditInvoiceValue,
    pOnTimeClient: banditPOnTime,
    annualCapitalCost: 0.15,
  });

  // 5. RestockPilot & AP2 Mandate State
  const [currentStock, setCurrentStock] = useState<number>(18);
  const [leadTime, setLeadTime] = useState<number>(5);
  const [budgetCap, setBudgetCap] = useState<number>(5000);

  const restockResult = evaluateRestockForecaster({
    sku: 'SKU-RACK-42U',
    itemTitle: '42U Enterprise Server Rack Enclosure',
    historicalDailySales: [14, 16, 15, 20, 18, 22, 21],
    leadTimeDays: leadTime,
    currentStockUnits: currentStock,
    unitPriceUsd: 1225.0,
    authorizedBudgetCapUsd: budgetCap,
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      {/* Header & Tab Selector */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600/30 border border-emerald-500/50 p-2 rounded-lg text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Deterministic Economic &amp; ML Policy Workbenches
            </h2>
            <p className="text-xs text-slate-400">
              Interactive simulators for Invoicing v2, Disputes v1, CollusionGuard MCP, MarginPulse Bandit &amp; AP2 Spend Mandate
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs gap-1">
          <button
            onClick={() => setActiveTab('INVOICE_GATE')}
            className={`px-2.5 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeTab === 'INVOICE_GATE'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Invoicing v2 Gate
          </button>
          <button
            onClick={() => setActiveTab('DISPUTE_TRIAGE')}
            className={`px-2.5 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeTab === 'DISPUTE_TRIAGE'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Disputes v1 Triage
          </button>
          <button
            onClick={() => setActiveTab('COLLUSION_GUARD')}
            className={`px-2.5 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeTab === 'COLLUSION_GUARD'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            CollusionGuard MCP
          </button>
          <button
            onClick={() => setActiveTab('MARGIN_PULSE')}
            className={`px-2.5 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeTab === 'MARGIN_PULSE'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MarginPulse Bandit
          </button>
          <button
            onClick={() => setActiveTab('RESTOCK_AP2')}
            className={`px-2.5 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeTab === 'RESTOCK_AP2'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Restock AP2 Mandate
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

      {/* TAB 3: Module A — CollusionGuard MCP Spend Firewall */}
      {activeTab === 'COLLUSION_GUARD' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Controls */}
          <div className="space-y-4 bg-slate-950/60 p-4 rounded-lg border border-slate-800">
            <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>CollusionGuard MCP: Counterparty Graph &amp; Sequence Scorer</span>
            </h3>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Proposed Purchase Amount ($)</span>
                <span className="text-white font-mono font-bold">${proposalAmount.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={500}
                max={6000}
                step={50}
                value={proposalAmount}
                onChange={(e) => setProposalAmount(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Historical Vendor Transactions (f_e)</span>
                <span className="text-white font-mono font-bold">{vendorTxns} / {totalTxns} txns</span>
              </div>
              <input
                type="range"
                min={0}
                max={150}
                step={1}
                value={vendorTxns}
                onChange={(e) => setVendorTxns(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                Leak-free frequency: f_e = {collusionResult.leakFreeVendorFreq.toFixed(4)}
              </span>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">PyTorch Geometric GAT Collusion Score</span>
                <span className="text-purple-400 font-mono font-bold">{gatScore.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.0}
                max={0.99}
                step={0.01}
                value={gatScore}
                onChange={(e) => setGatScore(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">LSTM Sequence Anomaly Residual (z)</span>
                <span className="text-purple-400 font-mono font-bold">z = {lstmZ.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={-1.0}
                max={3.5}
                step={0.1}
                value={lstmZ}
                onChange={(e) => setLstmZ(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                EVT Tail Anomaly Probability: {(collusionResult.evtTailAnomalyProb * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Firewall Outcome */}
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                  Cosmos.AI MCP Firewall Verdict
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[11px] ${
                    collusionResult.status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {collusionResult.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Comprehensive Risk Score</div>
                  <div
                    className={`text-sm font-bold font-mono ${
                      collusionResult.comprehensiveRiskScore > 0.70 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {collusionResult.comprehensiveRiskScore.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-500">Threshold: &le; 0.700</div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">On-Time Settlement Prob</div>
                  <div className="text-sm font-bold font-mono text-blue-400">
                    {(collusionResult.pOnTime * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500">Platt-calibrated BMA</div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Channel3 Price Z-Score</div>
                  <div className="text-sm font-bold font-mono text-purple-300">
                    +{collusionResult.channel3PriceZScore.toFixed(2)} &sigma;
                  </div>
                  <div className="text-[10px] text-slate-500">Category Mean: $2,200</div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Vault v3 Token Release</div>
                  <div className="text-xs font-semibold text-slate-200">
                    {collusionResult.status === 'PASS' ? 'AUTHORIZED (Hold)' : 'DENIED (Fail-Closed)'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px]">
                <div className="text-slate-400 font-semibold mb-1">Reason Audit Codes:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 font-mono text-[10px]">
                  {collusionResult.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 mt-3">
              FIPS 180-4 SHA-256 policy digest re-verified before tool execution.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Module B — MarginPulse Bandit Dynamic Terms */}
      {activeTab === 'MARGIN_PULSE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Controls */}
          <div className="space-y-4 bg-slate-950/60 p-4 rounded-lg border border-slate-800">
            <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>MarginPulse Bandit: Multi-Armed B2B Terms Optimizer</span>
            </h3>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Invoice Face Value ($V)</span>
                <span className="text-white font-mono font-bold">${banditInvoiceValue.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={15000}
                step={250}
                value={banditInvoiceValue}
                onChange={(e) => setBanditInvoiceValue(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Client Historical Baseline On-Time Rate</span>
                <span className="text-white font-mono font-bold">{(banditPOnTime * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.10}
                max={0.99}
                step={0.01}
                value={banditPOnTime}
                onChange={(e) => setBanditPOnTime(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                Client on-time payment probability from CC0 B2B invoice dataset model.
              </span>
            </div>
          </div>

          {/* Bandit Tier Comparison Matrix */}
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                  Recommended Policy Tier
                </span>
                <span className="px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {banditResult.selectedTier.tierName}
                </span>
              </div>

              <p className="text-slate-300 mb-4 leading-relaxed">
                {banditResult.strategyExplanation}
              </p>

              <div className="space-y-2 mb-4">
                {banditResult.tiers.map((t) => (
                  <div
                    key={t.tierName}
                    className={`p-2.5 rounded border flex items-center justify-between ${
                      t.recommended
                        ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-white">{t.tierName}</span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {t.discountPct > 0 ? `(~${t.impliedAprPct}% APR, Δt=20d)` : '(Full Price Net 30)'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold ${
                          t.evUsd > 0 ? 'text-emerald-400' : 'text-slate-300'
                        }`}
                      >
                        {t.evUsd > 0 ? `+$${t.evUsd.toFixed(2)} EV` : '$0.00 EV'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 mt-3">
              Contextual Bandit explores discount sensitivity and auto-resets unpaid discounted invoices on Day 10.
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Module C — RestockPilot & AP2 Spend Mandate Card */}
      {activeTab === 'RESTOCK_AP2' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Controls */}
          <div className="space-y-4 bg-slate-950/60 p-4 rounded-lg border border-slate-800">
            <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span>RestockPilot: Holt-Winters 80% Prediction Interval</span>
            </h3>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Current Warehouse Stock</span>
                <span className="text-white font-mono font-bold">{currentStock} Units</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                Days of cover remaining: {restockResult.daysOfCoverRemaining.toFixed(1)} days
              </span>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Supplier Lead Time (Days)</span>
                <span className="text-white font-mono font-bold">{leadTime} Days</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={leadTime}
                onChange={(e) => setLeadTime(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Authorized Mandate Cap ($)</span>
                <span className="text-white font-mono font-bold">${budgetCap.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={15000}
                step={250}
                value={budgetCap}
                onChange={(e) => setBudgetCap(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* AP2 Mandate Card & Receipt Docket */}
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                  Google AP2 Spend Mandate Card
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[11px] ${
                    restockResult.budgetCompliance === 'WITHIN_BUDGET'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {restockResult.budgetCompliance}
                </span>
              </div>

              {/* Docket-style Receipt Preview */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-300">
                <div className="text-emerald-400 font-bold border-b border-slate-800 pb-1 flex justify-between">
                  <span>{restockResult.ap2SpendMandatePayload.protocol}</span>
                  <span className="text-slate-400 text-[10px]">{restockResult.ap2SpendMandatePayload.mandateId}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Item:</span>
                  <span className="text-white font-semibold">{restockResult.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recommended Order:</span>
                  <span className="text-emerald-300 font-bold">{restockResult.reorderQuantityUnits} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Total Cost:</span>
                  <span className="text-white font-bold">${restockResult.estimatedTotalCostUsd.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Authorized Cap:</span>
                  <span className="text-slate-300">${budgetCap.toFixed(2)} USD</span>
                </div>
                <div className="border-t border-slate-800 pt-1 text-[10px] text-slate-500 break-all">
                  SHA-256: {restockResult.ap2SpendMandatePayload.sha256PolicyHash}
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 mt-3">
              Computed from Holt-Winters 80% interval (Upper bound: {restockResult.forecastUpper80PctUnits} units/day).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
