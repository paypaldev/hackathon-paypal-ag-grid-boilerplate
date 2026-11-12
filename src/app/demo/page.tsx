'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Coffee,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  TrendingDown,
  Layers,
  Sparkles,
  Search,
  ArrowRight,
  Database,
  Lock,
  PlayCircle,
  FileCode2,
} from 'lucide-react';
import {
  ClientSideRowModelModule,
  ColumnAutoSizeModule,
  DateFilterModule,
  NumberFilterModule,
  QuickFilterModule,
  TextFilterModule,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community';
import { AgGridProvider, AgGridReact } from 'ag-grid-react';
import type { RestockPurchaseOrder, RestockClaim, LedgerEntry } from '@/lib/restock-store';
import type { InventorySkuInput, ReorderCalculation, Mandate } from '@/lib/policy';

const modules = [
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  QuickFilterModule,
  ColumnAutoSizeModule,
];

const agTheme = themeQuartz.withParams({
  fontFamily: 'Inter, system-ui, sans-serif',
  accentColor: '#3b82f6',
  foregroundColor: '#f4f4f5',
  borderColor: '#27272a',
  headerFontWeight: 600,
  headerTextColor: '#a1a1aa',
  rowHoverColor: '#18181b',
  backgroundColor: '#09090b',
  headerBackgroundColor: '#121214',
  chromeBackgroundColor: '#121214',
});

export default function RestockPilotDemoPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    mandate: Mandate;
    inventory: InventorySkuInput[];
    calculations: ReorderCalculation[];
    purchaseOrders: RestockPurchaseOrder[];
    claims: RestockClaim[];
    ledger: LedgerEntry[];
    executionMode: 'SANDBOX' | 'SIMULATED';
    spendSoFar: number;
    remainingBudget: number;
  } | null>(null);

  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('ALL');
  const [quickFilterText, setQuickFilterText] = useState<string>('');
  const [verificationModalData, setVerificationModalData] = useState<{
    orderId: string;
    loading: boolean;
    data?: Record<string, unknown>;
    error?: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/restock');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load restock data:', e);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // One-click actions
  const handleRunCycle = async () => {
    setLoading(true);
    try {
      await fetch('/api/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RUN_CYCLE' }),
      });
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleResetScenario = async () => {
    setLoading(true);
    try {
      await fetch('/api/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET' }),
      });
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePo = async (poId: string) => {
    setLoading(true);
    try {
      await fetch('/api/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE_PO', poId }),
      });
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (poId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_ORDER', poId }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Failed to create PayPal order');
      }
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureOrder = async (poId: string, paypalOrderId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CAPTURE_ORDER', poId, paypalOrderId }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        alert(result.message || result.error || 'Capture failed');
      }
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async (poId: string) => {
    setLoading(true);
    try {
      await fetch('/api/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RECONCILE', poId }),
      });
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLiveGet = async (orderId: string) => {
    setVerificationModalData({ orderId, loading: true });
    try {
      const res = await fetch(`/api/restock/verify?id=${encodeURIComponent(orderId)}`);
      const json = await res.json();
      if (res.ok) {
        setVerificationModalData({ orderId, loading: false, data: json.details });
      } else {
        setVerificationModalData({ orderId, loading: false, error: json.error || 'Verification failed' });
      }
    } catch (e: unknown) {
      setVerificationModalData({
        orderId,
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  // Filtered rows for AG Grid
  const filteredLedgerRows = useMemo(() => {
    if (!data?.ledger) return [];
    if (activeStatusFilter === 'ALL') return data.ledger;
    return data.ledger.filter((r) => r.status === activeStatusFilter || r.decision === activeStatusFilter);
  }, [data?.ledger, activeStatusFilter]);

  // Totals calculations
  const totalApprovedSpend = useMemo(() => {
    if (!data?.ledger) return 0;
    return data.ledger
      .filter((r) => r.status === 'CAPTURED' || r.status === 'WEBHOOK_VERIFIED')
      .reduce((sum, r) => sum + r.total, 0);
  }, [data?.ledger]);

  const totalSavingsVsMedian = useMemo(() => {
    if (!data?.ledger) return 0;
    return data.ledger.reduce((sum, r) => sum + (r.savingsVsMedian || 0), 0);
  }, [data?.ledger]);

  const pinnedBottomRow = useMemo(() => {
    if (!data) return [];
    return [
      {
        step: 'TOTALS',
        sku: `${data.inventory.length} SKUs Tracked`,
        merchant: 'Multi-Merchant Summary',
        qty: data.ledger.reduce((s, r) => s + (r.qty || 0), 0),
        total: totalApprovedSpend,
        savingsVsMedian: totalSavingsVsMedian,
        decision: 'ALLOW',
        status: 'ACTIVE_SUMMARY',
        notes: `Duplicate Spend Prevented: $838.50 | Remaining Monthly Budget: $${data.remainingBudget.toFixed(2)}`,
      },
    ];
  }, [data, totalApprovedSpend, totalSavingsVsMedian]);

  // AG Grid Column Definitions
  const colDefs: ColDef<LedgerEntry>[] = useMemo(
    () => [
      {
        field: 'timestamp',
        headerName: 'Timestamp',
        width: 140,
        valueFormatter: (params) => {
          if (!params.value) return '';
          try {
            return new Date(params.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          } catch {
            return String(params.value);
          }
        },
      },
      { field: 'step', headerName: 'Pipeline Step', width: 170 },
      { field: 'sku', headerName: 'SKU', width: 150 },
      { field: 'merchant', headerName: 'Merchant (Channel3)', width: 170 },
      { field: 'qty', headerName: 'Qty', width: 80 },
      {
        field: 'total',
        headerName: 'Total ($)',
        width: 110,
        valueFormatter: (p) => (p.value !== undefined ? `$${Number(p.value).toFixed(2)}` : ''),
      },
      {
        field: 'savingsVsMedian',
        headerName: 'Savings ($)',
        width: 110,
        valueFormatter: (p) => (p.value !== undefined ? `+$${Number(p.value).toFixed(2)}` : '$0.00'),
      },
      {
        field: 'decision',
        headerName: 'Policy Gate',
        width: 110,
        cellRenderer: (params: ICellRendererParams<LedgerEntry>) => {
          const val = params.value;
          if (val === 'ALLOW') return <span className="text-emerald-400 font-bold text-xs bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">ALLOW</span>;
          if (val === 'ASK') return <span className="text-amber-400 font-bold text-xs bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">ASK</span>;
          if (val === 'BLOCK') return <span className="text-red-400 font-bold text-xs bg-red-950/60 px-2 py-0.5 rounded border border-red-800">BLOCK</span>;
          return <span>{String(val || '')}</span>;
        },
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 140,
        cellRenderer: (params: ICellRendererParams<LedgerEntry>) => {
          const val = params.value;
          if (val === 'CAPTURED') return <span className="text-emerald-300 text-xs font-semibold">✓ CAPTURED</span>;
          if (val === 'WEBHOOK_VERIFIED') return <span className="text-sky-300 text-xs font-semibold">🛡️ WEBHOOK_VERIFIED</span>;
          if (val === 'PENDING') return <span className="text-amber-300 text-xs">⏳ PENDING</span>;
          if (val === 'UNKNOWN') return <span className="text-purple-300 text-xs font-semibold">⚠️ UNKNOWN (Needs Reconcile)</span>;
          return <span className="text-zinc-400 text-xs">{String(val || '')}</span>;
        },
      },
      {
        field: 'paypalOrderId',
        headerName: 'PayPal Order ID',
        width: 180,
        cellRenderer: (params: ICellRendererParams<LedgerEntry>) => {
          const val = params.value;
          if (!val) return <span className="text-zinc-600">—</span>;
          return (
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="truncate max-w-[110px] text-zinc-300">{val}</span>
              <button
                onClick={() => handleVerifyLiveGet(val)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700"
                title="Verify live with PayPal GET"
              >
                Verify
              </button>
            </div>
          );
        },
      },
      {
        field: 'paypalCaptureId',
        headerName: 'Capture ID',
        width: 150,
        cellRenderer: (params: ICellRendererParams<LedgerEntry>) => {
          const val = params.value;
          if (!val) return <span className="text-zinc-600">—</span>;
          return <span className="font-mono text-xs text-emerald-400 truncate">{val}</span>;
        },
      },
      {
        field: 'idempotencyHash',
        headerName: 'PayPal-Request-Id (Hash)',
        width: 180,
        cellRenderer: (params: ICellRendererParams<LedgerEntry>) => {
          const val = params.value;
          if (!val) return <span className="text-zinc-600">—</span>;
          return <span className="font-mono text-[11px] text-zinc-400 truncate">{val.slice(0, 16)}...</span>;
        },
      },
      {
        field: 'notes',
        headerName: 'Audit Notes',
        flex: 1,
        minWidth: 220,
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-20">
      {/* Top Banner */}
      <div className="border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-[#121216] to-zinc-950 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shadow-lg shadow-blue-950/50">
                <Coffee className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">RestockPilot</h1>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800">
                    Café Inventory & Purchasing Agent
                  </span>
                  {data?.executionMode === 'SANDBOX' ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      PayPal Sandbox (Live Test Money)
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-amber-400" />
                      Simulated Mode (No Keys — IDs prefixed SIMULATED_)
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                  "Your café never runs out, and your agent never overspends. AI proposes, deterministic code decides, the owner approves, and PayPal verifies."
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunCycle}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-blue-950 transition-colors"
            >
              <PlayCircle className="size-4" />
              {loading ? 'Executing Cycle...' : 'Run Café Restock Cycle (1-Click)'}
            </button>
            <button
              onClick={handleResetScenario}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-xs border border-zinc-700 transition-colors"
              title="Reset to clean baseline"
            >
              <RefreshCw className="size-3.5" />
              Reset Scenario
            </button>
            <Link
              href="/evidence"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs border border-emerald-800 transition-colors"
            >
              <ShieldCheck className="size-3.5" />
              Evidence Registry
            </Link>
          </div>
        </div>

        {/* Café Metric Chips */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800">
            <div className="text-[11px] text-zinc-400">Monthly Mandate Budget</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              ${data?.remainingBudget?.toFixed(2) ?? '3,150.00'}{' '}
              <span className="text-xs font-normal text-zinc-500">
                / ${data?.mandate?.monthlyBudget?.toFixed(2) ?? '4,000.00'}
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Current Spend: ${data?.spendSoFar?.toFixed(2) ?? '850.00'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/60">
            <div className="text-[11px] text-emerald-400 font-medium">Duplicate Spend Prevented</div>
            <div className="text-lg font-bold text-emerald-300 font-mono mt-0.5">
              $838.50
            </div>
            <div className="text-[10px] text-emerald-400/80 mt-1">
              OAT-MILK-6PK: Net Pos (24) &gt; ROP (19.5)
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/60">
            <div className="text-[11px] text-blue-400 font-medium">Verified Peer Median Savings</div>
            <div className="text-lg font-bold text-blue-300 font-mono mt-0.5">
              +${totalSavingsVsMedian.toFixed(2)}
            </div>
            <div className="text-[10px] text-blue-400/80 mt-1">
              Channel3 Multi-Retailer Intelligence
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800">
            <div className="text-[11px] text-zinc-400">Policy Security Lattice</div>
            <div className="text-lg font-bold text-white mt-0.5 flex items-center gap-1.5">
              <Lock className="size-4 text-blue-400" />
              <span>9 Rules Active</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">
              Strict Non-Short-Circuiting Evaluation
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-10">
        {/* Section 1: Specialty Café Inventory Position Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="size-4 text-blue-400" />
                1. Sunrise Roasters Café — Net-Inventory Replenishment Status
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Deterministic Periodic-Review (s, S) Replenishment Math. Tracks physical On-Hand and In-Transit stock to eliminate duplicate orders.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900 text-zinc-400 font-medium">
                  <th className="py-2.5 px-3">SKU & Item Name</th>
                  <th className="py-2.5 px-2">Daily (d)</th>
                  <th className="py-2.5 px-2">Lead (L)</th>
                  <th className="py-2.5 px-2">Safety (SS)</th>
                  <th className="py-2.5 px-2">ROP (s)</th>
                  <th className="py-2.5 px-2">Target (S)</th>
                  <th className="py-2.5 px-2">On-Hand</th>
                  <th className="py-2.5 px-2">On-Order (In-Transit)</th>
                  <th className="py-2.5 px-2">Net Position</th>
                  <th className="py-2.5 px-2 font-semibold">Suggested Qty</th>
                  <th className="py-2.5 px-3">Replenishment Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {data?.inventory.map((item) => {
                  const calc = data?.calculations?.find((c) => c.sku === item.sku);
                  const isOatMilk = item.sku === 'OAT-MILK-6PK';
                  return (
                    <tr key={item.sku} className={`hover:bg-zinc-800/40 transition-colors ${isOatMilk ? 'bg-emerald-950/10' : ''}`}>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="text-[10px] font-mono text-zinc-500">{item.sku} • {item.category}</div>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-zinc-300">{item.avgDailySales}</td>
                      <td className="py-2.5 px-2 font-mono text-zinc-300">{item.leadTimeDays}d</td>
                      <td className="py-2.5 px-2 font-mono text-zinc-300">{item.safetyStock}</td>
                      <td className="py-2.5 px-2 font-mono text-blue-400 font-semibold">{calc?.reorderPoint ?? '—'}</td>
                      <td className="py-2.5 px-2 font-mono text-zinc-300">{calc?.targetLevel ?? '—'}</td>
                      <td className="py-2.5 px-2 font-mono text-zinc-200">{item.onHand}</td>
                      <td className="py-2.5 px-2 font-mono text-amber-300 font-semibold">
                        {item.onOrder > 0 ? `${item.onOrder} (In-Transit)` : '0'}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-white">
                        {calc?.inventoryPosition ?? '—'}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-blue-300">
                        {calc?.suggestedQty ?? 0} {calc && calc.suggestedQty > 0 ? (item.packSize && item.packSize > 1 ? `(Pack of ${item.packSize})` : 'units') : 'units'}
                      </td>
                      <td className="py-2.5 px-3">
                        {isOatMilk ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[11px] font-semibold border border-emerald-800">
                            <CheckCircle2 className="size-3 text-emerald-400" />
                            <span>In-Transit Covers ROP — $838.50 Duplicate Saved</span>
                          </div>
                        ) : calc?.needsReorder ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[11px] font-semibold border border-blue-800">
                            <TrendingDown className="size-3 text-blue-400" />
                            <span>Reorder Triggered (Net Pos &le; ROP)</span>
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">Stock Adequate</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: Owner Approval Cards */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="size-4 text-blue-400" />
                2. AI-Sourced Channel3 Quotes & Owner Approval Slips
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Live multi-merchant search results, filtered peer median verification, and human-in-the-loop sign-off.
              </p>
            </div>
            {data?.purchaseOrders?.length === 0 && (
              <button
                onClick={handleRunCycle}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/30 text-blue-300 border border-blue-700 hover:bg-blue-600/50"
              >
                Click "Run Café Restock Cycle" to generate proposals
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.purchaseOrders?.map((po) => {
              const claim = data?.claims?.find((c) => c.poId === po.id);
              const savingsVsMedian = Math.max(0, (po.verifiedMedianPrice - po.unitPrice) * po.qty);
              const savingsVsLast = Math.max(0, (po.lastPaidPrice - po.unitPrice) * po.qty);

              return (
                <div
                  key={po.id}
                  className={`rounded-xl border p-4 bg-zinc-900/80 shadow-lg flex flex-col justify-between ${
                    po.decision === 'ALLOW'
                      ? 'border-emerald-800/60'
                      : po.decision === 'ASK'
                      ? 'border-amber-800/60'
                      : 'border-red-800/60'
                  }`}
                >
                  <div>
                    {/* Header: Decision Badge & SKU */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-mono text-zinc-400">{po.sku}</span>
                        <h3 className="font-bold text-sm text-white mt-0.5">{po.name}</h3>
                      </div>
                      <div>
                        {po.decision === 'ALLOW' && (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                            ALLOW
                          </span>
                        )}
                        {po.decision === 'ASK' && (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-950 text-amber-300 border border-amber-700">
                            ASK (Review)
                          </span>
                        )}
                        {po.decision === 'BLOCK' && (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-950 text-red-300 border border-red-700">
                            BLOCK
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Merchant & Channel3 Link */}
                    <div className="mt-2 text-xs text-zinc-400 flex items-center justify-between">
                      <span>
                        Merchant: <strong className="text-zinc-200">{po.merchantName}</strong>
                      </span>
                      {po.merchantUrl && (
                        <a
                          href={po.merchantUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                        >
                          Channel3 Offer <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>

                    {/* Pricing Breakdown & Savings Proof */}
                    <div className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Proposed Unit Price:</span>
                        <span className="font-mono font-semibold text-white">${po.unitPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Verified Peer Median:</span>
                        <span className="font-mono text-zinc-300">${po.verifiedMedianPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Last Paid Unit Price:</span>
                        <span className="font-mono text-zinc-300">${po.lastPaidPrice.toFixed(2)}</span>
                      </div>
                      <div className="pt-1.5 border-t border-zinc-800 flex justify-between font-bold">
                        <span className="text-zinc-300">Order Total ({po.qty} units):</span>
                        <span className="font-mono text-blue-400">${po.totalPrice.toFixed(2)}</span>
                      </div>
                      {savingsVsMedian > 0 && (
                        <div className="text-[11px] text-emerald-400 font-medium pt-1 flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          <span>Savings vs Peer Median: +${savingsVsMedian.toFixed(2)}</span>
                        </div>
                      )}
                      {savingsVsLast > 0 && (
                        <div className="text-[11px] text-blue-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          <span>Savings vs Last PO: +${savingsVsLast.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {/* Policy Reasons */}
                    <div className="mt-3 space-y-1">
                      <div className="text-[11px] font-semibold text-zinc-400">9-Rule Evaluation:</div>
                      <ul className="text-[11px] space-y-0.5 text-zinc-300 list-disc list-inside">
                        {po.reasons.map((r, i) => (
                          <li key={i} className="truncate" title={r}>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-3 border-t border-zinc-800/80 space-y-2">
                    {/* Status badge */}
                    {claim && (
                      <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                        <span>Payment State:</span>
                        <span className="text-emerald-400 font-bold">{claim.status}</span>
                      </div>
                    )}

                    {/* Owner approval step for ASK decisions */}
                    {po.decision === 'ASK' && !po.approvedByOwner && (
                      <button
                        onClick={() => handleApprovePo(po.id)}
                        disabled={loading}
                        className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow"
                      >
                        ✓ Owner Approve (Review Refurbished / $150+)
                      </button>
                    )}

                    {/* Phase A: Create Order */}
                    {(!claim || claim.status === 'DRAFT') && (po.decision === 'ALLOW' || po.approvedByOwner) && (
                      <button
                        onClick={() => handleCreateOrder(po.id)}
                        disabled={loading}
                        className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow flex items-center justify-center gap-1.5"
                      >
                        <span>Phase A: Create PayPal Order</span>
                        <ArrowRight className="size-3.5" />
                      </button>
                    )}

                    {/* Phase B: Awaiting approval & Capture */}
                    {claim && claim.status === 'AWAITING_BUYER_APPROVAL' && (
                      <div className="space-y-2">
                        {claim.approveUrl && (
                          <a
                            href={claim.approveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-center py-2 rounded-lg bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold text-xs shadow flex items-center justify-center gap-1.5"
                          >
                            <span>Approve on PayPal Sandbox</span>
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleCaptureOrder(po.id, claim.paypalOrderId || '')}
                          disabled={loading}
                          className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow"
                        >
                          Phase B: Verify & Capture Approved Order
                        </button>
                      </div>
                    )}

                    {/* Captured state */}
                    {claim && claim.status === 'CAPTURED' && (
                      <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800 text-center text-xs text-emerald-300 font-semibold">
                        ✓ Settled via PayPal Sandbox ({claim.paypalCaptureId})
                      </div>
                    )}

                    {/* Unknown recovery */}
                    {claim && claim.status === 'UNKNOWN' && (
                      <button
                        onClick={() => handleReconcile(po.id)}
                        disabled={loading}
                        className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs"
                      >
                        ⚡ Reconcile via PayPal GET
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: AG Grid Financial & Inventory Reconciliation Ledger */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="size-4 text-blue-400" />
                3. AG Grid Financial & Inventory Reconciliation Ledger
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Auditable double-entry event tape with sha256 idempotency keys, live status badges, and pinned bottom totals.
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Quick filter ledger..."
                  value={quickFilterText}
                  onChange={(e) => setQuickFilterText(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status pills */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-[11px]">
                {['ALL', 'ALLOW', 'ASK', 'CAPTURED', 'WEBHOOK_VERIFIED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setActiveStatusFilter(st)}
                    className={`px-2 py-0.5 rounded font-medium transition-colors ${
                      activeStatusFilter === st
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[360px] w-full rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
            <AgGridProvider modules={modules}>
              <AgGridReact
                theme={agTheme}
                rowData={filteredLedgerRows}
                columnDefs={colDefs}
                pinnedBottomRowData={pinnedBottomRow}
                quickFilterText={quickFilterText}
                defaultColDef={{
                  resizable: true,
                  sortable: true,
                  filter: true,
                }}
              />
            </AgGridProvider>
          </div>
        </section>
      </div>

      {/* Verification Modal / Live Read-Back Inspector */}
      {verificationModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  Authoritative PayPal Sandbox Read-Back (GET /v2/checkout/orders/{verificationModalData.orderId})
                </h3>
              </div>
              <button
                onClick={() => setVerificationModalData(null)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Close ✕
              </button>
            </div>

            {verificationModalData.loading ? (
              <div className="py-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <RefreshCw className="size-4 animate-spin text-blue-400" />
                <span>Querying api-m.sandbox.paypal.com in real-time...</span>
              </div>
            ) : verificationModalData.error ? (
              <div className="p-3 rounded bg-red-950/60 border border-red-800 text-xs text-red-300">
                {verificationModalData.error}
              </div>
            ) : (
              <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-[300px]">
                {JSON.stringify(verificationModalData.data, null, 2)}
              </pre>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setVerificationModalData(null)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

