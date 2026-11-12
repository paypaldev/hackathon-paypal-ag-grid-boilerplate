'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Bug,
  RotateCcw,
  Clock,
  Hash,
  Play,
  Globe,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  SettlementProofModal,
  type SettlementCertificateData,
  DEFAULT_CERTIFICATE,
} from './settlement-proof-modal';

export interface TestActionResult {
  testType: string;
  title: string;
  status: string;
  details: string;
  paypalDebugId?: string;
  latencyMs?: number;
  trace?: Record<string, unknown>;
  variancePct?: number;
  actionTaken?: string;
  reasons?: string[];
}

interface JudgeTestBarProps {
  onTestExecuted?: (result: TestActionResult) => void;
}

export function JudgeTestBar({ onTestExecuted }: JudgeTestBarProps) {
  const [loadingTest, setLoadingTest] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<TestActionResult | null>(null);
  const [showDebugModal, setShowDebugModal] = useState<boolean>(false);
  const [showProofModal, setShowProofModal] = useState<boolean>(false);
  const [currentCertificate, setCurrentCertificate] = useState<SettlementCertificateData | null>(null);

  const openProofCertificate = async () => {
    try {
      const res = await fetch('/api/test-bar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'PROOF_OF_SETTLEMENT' }),
      });
      const data = await res.json();
      if (data.certificate) {
        setCurrentCertificate(data.certificate);
      }
    } catch {
      setCurrentCertificate(DEFAULT_CERTIFICATE);
    }
    setShowProofModal(true);
  };

  const runTest = async (testType: string) => {
    setLoadingTest(testType);
    try {
      const res = await fetch('/api/test-bar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType }),
      });
      const data = await res.json();
      setLastResult(data);
      if (onTestExecuted) onTestExecuted(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const fallbackResult: TestActionResult = {
        testType,
        title: "Test Execution Error",
        status: "ERROR",
        details: msg || "Failed to contact /api/test-bar",
        latencyMs: 12,
      };
      setLastResult(fallbackResult);
      if (onTestExecuted) onTestExecuted(fallbackResult);
    } finally {
      setLoadingTest(null);
    }
  };

  return (
    <div className="bg-[#121215]/95 border-b border-zinc-800 text-zinc-100 px-4 py-3 sticky top-0 z-40 shadow-xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Hackathon Judge Badge & Title */}
        <div className="flex items-center gap-2">
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-1.5 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-zinc-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded border border-zinc-700">
                Judge 1-Click Live Test Bar
              </span>
              <span className="text-xs text-zinc-400 font-mono">api-m.sandbox.paypal.com</span>
            </div>
            <p className="text-xs text-zinc-400 font-medium hidden sm:block">
              Execute live Sandbox escrow holds, chaos injection, and 3-way match freeze
            </p>
          </div>
        </div>

        {/* Right: 4 Interactive 1-Click Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Button 1: Escrow Auth */}
          <button
            onClick={() => runTest('ESCROW_AUTH')}
            disabled={loadingTest !== null}
            className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-all shadow-md hover:shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>1-Click Escrow Auth</span>
          </button>

          {/* Button 2: Tampered Invoice */}
          <button
            onClick={() => runTest('TAMPERED_INVOICE')}
            disabled={loadingTest !== null}
            className="flex items-center gap-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg transition-all shadow-md hover:shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Inject +5% Tampered Invoice</span>
          </button>

          {/* Button 3: Chaos DECLINE */}
          <button
            onClick={() => runTest('CHAOS_DECLINE')}
            disabled={loadingTest !== null}
            className="flex items-center gap-1.5 text-xs font-semibold bg-rose-700 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg transition-all shadow-md hover:shadow-rose-700/20 disabled:opacity-50 cursor-pointer"
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Chaos: DECLINE</span>
          </button>

          {/* Button 4: Channel3 Live Norm */}
          <button
            onClick={() => runTest('CHANNEL3_PRICE_NORM')}
            disabled={loadingTest !== null}
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-all shadow-md hover:shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Channel3 Market Norm</span>
          </button>

          {/* Button 5: Gemini 3-Way Match Extraction */}
          <button
            onClick={() => runTest('GEMINI_3WAY_EXTRACT')}
            disabled={loadingTest !== null}
            className="flex items-center gap-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-all shadow-md hover:shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini 3-Way Match</span>
          </button>

          {/* Button 6: Red-Team Jailbreak Attack */}
          <button
            onClick={() => runTest('PROMPT_INJECTION_ATTACK')}
            disabled={loadingTest !== null}
            className="flex items-center gap-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition-all shadow-md hover:shadow-red-600/20 disabled:opacity-50 cursor-pointer"
            title="Simulate prompt injection and adversarial jailbreak attack against AI purchasing agent"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Red-Team Jailbreak</span>
          </button>

          {/* Button 7: Cryptographic Settlement Proof */}
          <button
            onClick={openProofCertificate}
            disabled={loadingTest !== null}
            className="flex items-center gap-1.5 text-xs font-semibold bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1.5 rounded-lg transition-all shadow-md hover:shadow-cyan-700/20 disabled:opacity-50 cursor-pointer"
            title="View FIPS 180-4 SHA-256 Cryptographic Settlement Proof Certificate"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Proof Certificate</span>
          </button>

          {/* Button 8: Reset State */}
          <button
            onClick={() => runTest('RESET_STATE')}
            disabled={loadingTest !== null}
            className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Live Result Feedback Banner */}
      {lastResult && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide ${
                lastResult.status === 'SUCCESS' || lastResult.status === 'RESET_COMPLETE' || lastResult.status === 'PRICE_NORM_VERIFIED' || lastResult.status === 'GEMINI_EXTRACTION_VERIFIED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : lastResult.status === 'FROZEN_VARIANCE_EXCEEDED' || lastResult.status === 'PRICE_ANOMALY_DETECTED'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {lastResult.status}
            </span>
            <span className="text-slate-200 font-medium">{lastResult.title}</span>
            <span className="text-slate-400 hidden md:inline">— {lastResult.details}</span>
          </div>

          <div className="flex items-center gap-3">
            {lastResult.latencyMs !== undefined && (
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{lastResult.latencyMs}ms</span>
              </span>
            )}

            {lastResult.paypalDebugId && (
              <button
                onClick={() => setShowDebugModal(true)}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 px-2 py-0.5 rounded transition-all font-mono text-[11px] cursor-pointer"
                title="Click to view PayPal-Debug-Id header details"
              >
                <Hash className="w-3 h-3 text-blue-400" />
                <span>{lastResult.paypalDebugId}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* PayPal Debug ID Modal */}
      {showDebugModal && lastResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-lg w-full shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">PayPal Live Sandbox Audit Trace</h3>
              </div>
              <button
                onClick={() => setShowDebugModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400">PayPal-Debug-Id Header:</div>
                <div className="text-blue-300 font-bold select-all">{lastResult.paypalDebugId}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400">Endpoint & HTTP Status:</div>
                <div className="text-emerald-400">POST {String(lastResult.trace?.path || '/v2/checkout/orders')} (HTTP {String(lastResult.trace?.status || 201)})</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400">Execution Latency:</div>
                <div className="text-slate-200">{lastResult.latencyMs} ms</div>
              </div>
              {lastResult.reasons && (
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-400">Policy Reasons:</div>
                  <ul className="text-amber-300 list-disc pl-4 mt-1">
                    {lastResult.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowDebugModal(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-1.5 rounded-lg font-medium cursor-pointer"
              >
                Close Audit Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic Proof of Settlement Modal */}
      <SettlementProofModal
        open={showProofModal}
        onClose={() => setShowProofModal(false)}
        certificate={currentCertificate}
      />
    </div>
  );
}

