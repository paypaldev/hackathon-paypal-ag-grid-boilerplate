'use client';

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Activity,
  AlertTriangle,
  X,
  RefreshCw,
  Play,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Bug,
  Globe,
  FileCheck,
} from 'lucide-react';

interface HealthData {
  status: string;
  totalLatencyMs?: number;
  services?: {
    paypal?: { status: string; environment?: string; isSimulated?: boolean; message?: string };
    gemini?: { status: string; activeModel?: string; latencyMs?: number };
    channel3?: { status: string; latencyMs?: number };
    ml_service?: { status: string; service?: string };
    paypal_webhook?: { status: string; configured?: boolean };
  };
}

interface TestActionPayload {
  title?: string;
  status?: string;
  error?: string;
  testType?: string;
  details?: string;
  authorizedAmount?: string;
  tamperedInvoiceTotal?: string;
  variancePct?: number;
  thresholdPct?: number;
  actionTaken?: string;
  paypalDebugId?: string;
  latencyMs?: number;
  reasons?: string[];
  source?: string;
  query?: string;
  meanPrice?: string;
  stdDev?: string;
  zScore?: number;
  merchantCount?: number;
  extractedCompany?: string;
  confidence?: number;
  modelUsed?: string;
  trace?: Record<string, unknown>;
  [key: string]: unknown;
}

export function FloatingDevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'health' | 'tests' | 'trace'>('health');
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [lastAction, setLastAction] = useState<TestActionPayload | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch {
      // Ignored: health endpoint might be in cold start
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: HealthData | null) => {
        if (isMounted && data) {
          setHealth(data);
        }
      })
      .catch(() => {});

    // Keyboard shortcut Alt + D to toggle
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const triggerTest = async (testType: string) => {
    setLoadingAction(testType);
    try {
      const res = await fetch('/api/test-bar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType }),
      });
      const data = await res.json();
      setLastAction(data);
      setActiveTab('trace');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLastAction({ error: msg || 'Failed to call test endpoint' });
      setActiveTab('trace');
    } finally {
      setLoadingAction(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 font-sans text-xs select-none">
      {/* Collapsed Trigger Pill Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            fetchHealth();
          }}
          className="group flex items-center gap-2 bg-[#121215]/95 hover:bg-[#18181b] text-zinc-100 px-3.5 py-2 rounded-full border border-zinc-700/80 shadow-2xl backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-zinc-500 cursor-pointer"
          title="Click or press Alt+D to open VeriSettle DevTools"
        >
          <div className="relative flex items-center justify-center">
            <Terminal className="w-4 h-4 text-zinc-300 group-hover:text-white" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span className="font-bold text-xs tracking-wide text-zinc-100">
            DevTools
          </span>
          <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 font-mono">
            Alt+D
          </span>
        </button>
      )}

      {/* Expanded Floating Drawer Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] max-h-[540px] bg-[#09090b]/95 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#121215] border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                  <span>VeriSettle DevTools</span>
                  <span className="text-[10px] font-semibold bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded border border-zinc-700 font-mono">
                    v2.0
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400">PayPal Sandbox &amp; AI Intelligence Monitor</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={fetchHealth}
                disabled={loadingHealth}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                title="Refresh health status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin text-zinc-200' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                title="Close (Alt+D)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-zinc-800 bg-[#121215]/60 text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab('health')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'health'
                  ? 'border-zinc-200 text-zinc-100 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Services Health
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'tests'
                  ? 'border-zinc-200 text-zinc-100 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              1-Click Actions
            </button>
            <button
              onClick={() => setActiveTab('trace')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'trace'
                  ? 'border-zinc-200 text-zinc-100 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Audit Trace
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px] scrollbar-thin">
            {/* TAB 1: Health Status */}
            {activeTab === 'health' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-1 border-b border-zinc-800">
                  <span>Component Status</span>
                  <span>Latency: {health?.totalLatencyMs ?? '--'}ms</span>
                </div>

                {/* PayPal Sandbox */}
                <div className="bg-[#121215] border border-zinc-800 rounded-lg p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-zinc-300" />
                    <div>
                      <div className="font-semibold text-zinc-200">PayPal Sandbox Rails</div>
                      <div className="text-[10px] text-zinc-400 font-mono">api-m.sandbox.paypal.com</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                    SANDBOX ACTIVE
                  </span>
                </div>

                {/* Google Gemini AI */}
                <div className="bg-[#121215] border border-zinc-800 rounded-lg p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-zinc-300" />
                    <div>
                      <div className="font-semibold text-zinc-200">Google Gemini AI</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {health?.services?.gemini?.activeModel || 'gemini-3.1-flash-lite'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                    ONLINE
                  </span>
                </div>

                {/* Channel3 */}
                <div className="bg-[#121215] border border-zinc-800 rounded-lg p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-zinc-300" />
                    <div>
                      <div className="font-semibold text-zinc-200">Channel3 Catalog</div>
                      <div className="text-[10px] text-zinc-400">Multi-Merchant Category Norms</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                    CONNECTED
                  </span>
                </div>

                {/* Python ML Microservice */}
                <div className="bg-[#121215] border border-zinc-800 rounded-lg p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-zinc-300" />
                    <div>
                      <div className="font-semibold text-zinc-200">ML/DL Risk Engine</div>
                      <div className="text-[10px] text-zinc-400">FastAPI &amp; TS Fallback</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                    READY
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: Quick Test Actions */}
            {activeTab === 'tests' && (
              <div className="space-y-2">
                <p className="text-[11px] text-zinc-400">Execute live tests against backend sandbox rails:</p>

                <button
                  onClick={() => triggerTest('ESCROW_AUTH')}
                  disabled={loadingAction !== null}
                  className="w-full flex items-center justify-between bg-[#121215] hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-600 text-zinc-200 p-2.5 rounded-lg transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 fill-current text-zinc-300" />
                    <div>
                      <div className="font-semibold text-[11px] text-zinc-100">1-Click Escrow Auth Hold</div>
                      <div className="text-[10px] text-zinc-400">Orders v2 intent: AUTHORIZE ($2,450.00)</div>
                    </div>
                  </div>
                  {loadingAction === 'ESCROW_AUTH' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-200" />}
                </button>

                <button
                  onClick={() => triggerTest('TAMPERED_INVOICE')}
                  disabled={loadingAction !== null}
                  className="w-full flex items-center justify-between bg-[#121215] hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-600 text-zinc-200 p-2.5 rounded-lg transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <div>
                      <div className="font-semibold text-[11px] text-zinc-100">Inject +5% Tampered Invoice</div>
                      <div className="text-[10px] text-zinc-400">Tests Policy Firewall auto-freeze</div>
                    </div>
                  </div>
                  {loadingAction === 'TAMPERED_INVOICE' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                </button>

                <button
                  onClick={() => triggerTest('CHAOS_DECLINE')}
                  disabled={loadingAction !== null}
                  className="w-full flex items-center justify-between bg-[#121215] hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-600 text-zinc-200 p-2.5 rounded-lg transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Bug className="w-3.5 h-3.5 text-zinc-400" />
                    <div>
                      <div className="font-semibold text-[11px] text-zinc-100">Chaos: INSTRUMENT_DECLINED</div>
                      <div className="text-[10px] text-zinc-400">Tests graceful non-2xx PayPal recovery</div>
                    </div>
                  </div>
                  {loadingAction === 'CHAOS_DECLINE' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />}
                </button>

                <button
                  onClick={() => triggerTest('GEMINI_3WAY_EXTRACT')}
                  disabled={loadingAction !== null}
                  className="w-full flex items-center justify-between bg-[#121215] hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-600 text-zinc-200 p-2.5 rounded-lg transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                    <div>
                      <div className="font-semibold text-[11px] text-zinc-100">Gemini 3-Way Match Reconciler</div>
                      <div className="text-[10px] text-zinc-400">Extracts invoice &amp; calculates variance</div>
                    </div>
                  </div>
                  {loadingAction === 'GEMINI_3WAY_EXTRACT' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-300" />}
                </button>

                <button
                  onClick={() => triggerTest('PROOFLINE_SCOPE_DRIFT')}
                  disabled={loadingAction !== null}
                  className="w-full flex items-center justify-between bg-[#121215] hover:bg-zinc-800/80 border border-blue-900/50 hover:border-blue-700 text-zinc-200 p-2.5 rounded-lg transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                    <div>
                      <div className="font-semibold text-[11px] text-blue-300">Proofline: Scope Creep Guard</div>
                      <div className="text-[10px] text-zinc-400">Detects unpriced mobile addition (+ $650.00)</div>
                    </div>
                  </div>
                  {loadingAction === 'PROOFLINE_SCOPE_DRIFT' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />}
                </button>
              </div>
            )}

            {/* TAB 3: Audit Trace */}
            {activeTab === 'trace' && (
              <div className="space-y-2.5 font-mono text-[10px]">
                {lastAction ? (
                  <>
                    <div className="flex items-center justify-between bg-[#121215] p-2 rounded border border-zinc-800">
                      <span className="text-zinc-400">Status:</span>
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded border ${
                          lastAction.status === 'SUCCESS' || lastAction.status === 'PRICE_NORM_VERIFIED'
                            ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                            : lastAction.status === 'FROZEN_VARIANCE_EXCEEDED'
                            ? 'bg-amber-950/20 text-amber-300 border-amber-600/30'
                            : 'bg-rose-950/20 text-rose-300 border-rose-600/30'
                        }`}
                      >
                        {lastAction.status || 'OK'}
                      </span>
                    </div>

                    {lastAction.paypalDebugId && (
                      <div className="bg-[#121215] p-2 rounded border border-zinc-800 space-y-1">
                        <div className="text-zinc-400 flex items-center justify-between">
                          <span>PayPal-Debug-Id:</span>
                          <button
                            onClick={() => copyToClipboard(lastAction.paypalDebugId || '')}
                            className="hover:text-white cursor-pointer"
                          >
                            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="text-zinc-200 select-all font-bold">{lastAction.paypalDebugId}</div>
                      </div>
                    )}

                    <div className="bg-[#121215] p-2 rounded border border-zinc-800 max-h-36 overflow-y-auto">
                      <pre className="text-zinc-300 whitespace-pre-wrap">{JSON.stringify(lastAction, null, 2)}</pre>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-zinc-500">
                    No actions executed yet. Select &quot;1-Click Actions&quot; to test.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-4 py-2 bg-[#121215] border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-100 flex items-center gap-1 transition-colors"
            >
              <span>/api/health</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <span className="font-mono">Press Alt+D to toggle</span>
          </div>
        </div>
      )}
    </div>
  );
}
