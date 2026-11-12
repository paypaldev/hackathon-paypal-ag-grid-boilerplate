'use client';

import '@/lib/suppress-license-warnings';

// VeriSettle AI — Multi-Sponsor Command Center & AG Studio Dashboard
// Combines:
//   1. Top Judge 1-Click Live Sandbox Test Bar
//   2. AG Studio / AG Grid 10-Table Relational Workspace
//   3. Bryntum Finish-to-Start (FS) Escrow Milestone Schedule
//   4. Invoicing v2 Skeptic Gate & Disputes v1 Cost Minimizer Simulator
//   5. Live Cosmos.AI MCP & PayPal REST Audit Drawer
//   6. Full AG Studio Visual Report Designer

import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  AgStudioAiModule,
  enableStudioDevValidations,
  type AgReportState,
  type AgStudioApi,
  type AgStudioMode,
} from 'ag-studio';
import { AgStudio, AgStudioProvider } from 'ag-studio-react';
import type { DashboardData } from '@/lib/dashboard-data';
import { AppShell } from './components/app-shell';
import {
  CreateReportDialog,
  DeleteReportDialog,
  ResetDemoDialog,
  UnsavedChangesDialog,
  type DashboardDialog,
} from './components/dialogs';
import { EmptyData } from './components/empty-data';
import { ReportHeader } from './components/report-header';
import {
  blankReport,
  copyOf,
  defaultReport,
  findReport,
  initialReports,
  newId,
  remove,
  upsert,
  type SavedReport,
} from './reports-store';
import { pagesFor, pageTitlesFor } from './page-titles';
import { ReportsSidebar } from './components/sidebar';
import { DashboardSkeleton } from './components/skeleton';
import * as reportState from './report-state';
import { buildAi } from './studio/ai';
import { buildStudioData, hasData } from './studio/data';
import { agStudioPayPalTheme } from './studio/theme';
import { useReports } from './use-reports';

// VeriSettle Multi-Sponsor Components
import { JudgeTestBar } from './components/judge-test-bar';
import { RelationalTableWorkspace } from './components/relational-table-workspace';
import { BryntumGanttPanel } from './components/bryntum-gantt-panel';
import { Channel3CatalogExplorer } from './components/channel3-catalog-explorer';
import { SkepticDisputeSimulator } from './components/skeptic-dispute-simulator';
import { CosmosAuditDrawer } from './components/cosmos-audit-drawer';
import {
  ShieldCheck,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Users,
  Package,
  Sparkles,
  Activity,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

if (process.env.NODE_ENV !== 'production') {
  enableStudioDevValidations();
}

type DashboardProps = {
  data: DashboardData;
  licenseKey?: string;
  aiModels?: string[];
};

type StudioHistory = { canUndo: boolean; canRedo: boolean };
const NO_HISTORY: StudioHistory = { canUndo: false, canRedo: false };
const noSubscription = () => () => { };

export function Dashboard(props: DashboardProps) {
  const inBrowser = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  return inBrowser ? <ReportsDashboard {...props} /> : <DashboardSkeleton />;
}

function ReportsDashboard({ data, licenseKey, aiModels }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'COMMAND_CENTER' | 'AG_STUDIO'>('COMMAND_CENTER');
  const { store, latest, update, editReport } = useReports();
  const apiRef = useRef<AgStudioApi | null>(null);

  const [studioState, setStudioState] = useState<AgReportState | null>(null);
  const [history, setHistory] = useState<StudioHistory>(NO_HISTORY);
  const [mode, setMode] = useState<AgStudioMode>('view');
  const [dialog, setDialog] = useState<DashboardDialog>(null);

  const { reports } = store;
  const saved = findReport(reports, store.activeId) ?? reports[0];
  const [initialState] = useState(() => reportState.withFiltersPanelFor('view', saved.state));
  const state = studioState ?? initialState;
  const studioData = useMemo(() => buildStudioData(data), [data]);
  const ai = useMemo(() => (aiModels?.length ? buildAi(aiModels) : undefined), [aiModels]);

  // --- Driving Studio ---
  const load = (report: SavedReport, selectedPageId = report.state.selectedPageId, nextMode = mode) => {
    const api = apiRef.current;
    if (!api) return;
    api.setState(
      reportState.withFiltersPanelFor(nextMode, {
        ...report.state,
        selectedPageId,
      }),
    );
    api.clearHistory();
    setStudioState(api.getState());
    setHistory(NO_HISTORY);
    setMode(nextMode);
    update((current) => ({ ...current, activeId: report.id }));
  };

  const updateState = (next: (current: AgReportState) => AgReportState) => {
    const api = apiRef.current;
    if (api) api.setState(next(api.getState()));
  };

  const changeMode = (next: AgStudioMode) => {
    updateState((s) => reportState.withFiltersPanelFor(next, s));
    setMode(next);
  };

  const save = () => {
    const api = apiRef.current;
    if (!api) return;
    const current = api.getState();
    editReport(saved.id, (report) => ({
      ...report,
      pageTitles: pageTitlesFor({ pageTitles: report.pageTitles, state: current }),
      state: current,
      updatedAt: new Date().toISOString(),
    }));
  };

  const discard = () => load(saved, reportState.pageToSelect(saved.state, state.selectedPageId));

  const guard = (then: () => void) => {
    const api = apiRef.current;
    if (api && reportState.hasChanges(api.getState(), saved.state)) {
      setDialog({ kind: 'unsaved', then });
    } else then();
  };

  const openReport = (id: string) => {
    const report = findReport(reports, id);
    if (report && id !== saved.id) guard(() => load(report));
  };

  const createReport = (name: string) => {
    const report = blankReport(name);
    update((current) => upsert(current, report));
    load(report, report.state.selectedPageId, 'edit');
  };

  const duplicateReport = (id: string) =>
    guard(() => {
      const source = findReport(reports, id);
      if (!source) return;
      const copy = copyOf(source);
      update((current) => upsert(current, copy));
      load(copy);
    });

  const resetDemo = () => {
    update(initialReports);
    load(defaultReport(), undefined, 'view');
  };

  const deleteReport = (report: SavedReport) => {
    update((current) => remove(current, report.id));
    if (report.id !== saved.id) return;
    const { reports: next, activeId } = latest();
    load(findReport(next, activeId) ?? next[0]);
  };

  const renameReport = (id: string, name: string) => editReport(id, (report) => ({ ...report, name }));

  const selectPage = (id: string, pageId: string) => {
    if (id === saved.id) updateState((s) => reportState.selectPage(s, pageId));
    else {
      const report = findReport(reports, id);
      if (report) guard(() => load(report, pageId));
    }
  };

  const addPage = () => {
    const id = newId('page');
    updateState((s) => reportState.addPage(s, id));
    if (mode !== 'edit') changeMode('edit');
    return id;
  };

  const removePage = (id: string) => updateState((s) => reportState.removePage(s, id));
  const renamePage = (id: string, title: string) =>
    editReport(saved.id, (report) => ({
      ...report,
      pageTitles: { ...report.pageTitles, [id]: title },
    }));

  const editing = mode === 'edit';
  const pages = pagesFor({ pageTitles: saved.pageTitles, state });

  // Calculate high-level KPIs
  const passRate = data.mlAudits.filter((a) => a.matchStatus === 'MATCHED_OK').length / (data.mlAudits.length || 1);
  const avgRisk = data.mlAudits.reduce((acc, a) => acc + a.gnnLstmRiskScore, 0) / (data.mlAudits.length || 1);

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] text-zinc-100 font-sans">
      {/* 1. TOP: Judge 1-Click Live Sandbox Test Bar */}
      <JudgeTestBar />

      {/* 2. Top-Level Mode Selector & Global Workspace Links */}
      <div className="bg-[#121215] border-b border-zinc-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-zinc-800 border border-zinc-700 text-white font-extrabold px-2.5 py-1 rounded-lg text-sm tracking-wider shadow group-hover:scale-105 transition-transform">
              VeriSettle OS
            </div>
          </Link>
          <span className="text-xs text-zinc-400 hidden xl:inline">
            Autonomous B2B Escrow, Multimodal 3-Way Reconciliation &amp; Dispute Defense
          </span>

          {/* Quick Links to newly integrated workspaces */}
          <div className="hidden md:flex items-center gap-1.5 border-l border-zinc-800 pl-3 text-xs">
            <Link
              href="/users"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users</span>
            </Link>
            <Link
              href="/products"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Products</span>
            </Link>
            <Link
              href="/ai-sandbox"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-850 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Sandbox &amp; Langfuse</span>
            </Link>
            <Link
              href="/walkthrough"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-850 transition-colors"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video Guide</span>
            </Link>
            <Link
              href="/availability"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-850 transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Health</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center bg-[#09090b] p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('COMMAND_CENTER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === 'COMMAND_CENTER'
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Autonomous Command Center</span>
          </button>
          <button
            onClick={() => setActiveTab('AG_STUDIO')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === 'AG_STUDIO'
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>AG Studio Visual BI &amp; Reports</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN CONTENT */}
      {activeTab === 'COMMAND_CENTER' ? (
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Executive KPI Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#121215] border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Active Escrow Under Hold</span>
                <DollarSign className="w-4 h-4 text-zinc-300" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">$2,450.00</div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <span>30% Auth placed via Orders v2</span>
              </div>
            </div>

            <div className="bg-[#121215] border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>3-Way Match Pass Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {(passRate * 100).toFixed(0)}%
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                LayoutLMv3 vs Channel3 vs PayPal
              </div>
            </div>

            <div className="bg-[#121215] border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Bayesian Model Avg Risk</span>
                <TrendingUp className="w-4 h-4 text-zinc-300" />
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-100">
                {avgRisk.toFixed(2)}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Leak-Free XGBoost + GNN/LSTM EVT
              </div>
            </div>

            <div className="bg-[#121215] border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Margin Preserved (Skeptic)</span>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">+$2,450.00</div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Dilutive 2/10 Net 30 blocked
              </div>
            </div>
          </div>

          {/* Recharts Data Visualization: Escrow Velocity & Risk Distribution */}
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Executive Escrow Analytics &amp; Settlement Velocity</span>
                  <span className="text-[10px] font-mono text-zinc-300 bg-zinc-850 border border-zinc-700 px-2 py-0.5 rounded">
                    Recharts Visualization
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Tracking monthly authorized holds versus settled captures under the 1.5% variance clamp.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-zinc-300" />
                  <span className="text-zinc-300">Authorized ($ USD)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  <span className="text-zinc-300">Captured ($ USD)</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { month: 'Jun 2026', authorized: 42000, captured: 41200 },
                    { month: 'Jul 2026', authorized: 68000, captured: 66500 },
                    { month: 'Aug 2026', authorized: 84000, captured: 81000 },
                    { month: 'Sep 2026', authorized: 98000, captured: 95400 },
                    { month: 'Oct 2026', authorized: 112000, captured: 108900 },
                    { month: 'Nov 2026', authorized: 135000, captured: 131500 },
                  ]}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="authGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4d4d8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#d4d4d8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', color: '#f4f4f5' }}
                    formatter={(val: unknown, name: unknown) => [
                      `$${Number(val).toLocaleString()}`,
                      name === 'authorized' ? 'Authorized Hold' : 'Settled Capture',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="authorized"
                    stroke="#d4d4d8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#authGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="captured"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#capGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 1: AG Grid 10-Table Relational Ledger */}
          <RelationalTableWorkspace data={data} />

          {/* Section 2: Bryntum Gantt Escrow Milestone Schedule */}
          <BryntumGanttPanel />

          {/* Section 3: Channel3 Multi-Merchant Catalog Discovery & Anomaly Z-Score Explorer */}
          <Channel3CatalogExplorer />

          {/* Section 4: Invoicing v2 Skeptic Gate & Disputes v1 Simulator */}
          <SkepticDisputeSimulator />

          {/* Section 5: Cosmos.AI MCP & PayPal REST Audit Drawer */}
          <CosmosAuditDrawer />
        </main>
      ) : (
        /* AG Studio Visual Report View */
        <div className="flex-1 flex flex-col h-[calc(100vh-105px)]">
          <AppShell
            sidebar={
              <ReportsSidebar
                reports={reports}
                activeId={saved.id}
                activePages={pages}
                selectedPageId={state.selectedPageId}
                editing={editing}
                ready={studioState !== null}
                onSelectReport={openReport}
                onSelectPage={selectPage}
                onAddPage={() => (apiRef.current ? addPage() : undefined)}
                onRemovePage={removePage}
                onRenamePage={renamePage}
                onRenameReport={renameReport}
                onCreate={() => guard(() => setDialog({ kind: 'create' }))}
                onDuplicate={duplicateReport}
                onDelete={(id) => {
                  const report = findReport(reports, id);
                  if (report) setDialog({ kind: 'delete', report });
                }}
                onReset={() => setDialog({ kind: 'reset' })}
              />
            }
          >
            <ReportHeader
              reportName={saved.name}
              pageTitle={pages.find((p) => p.id === state.selectedPageId)?.title}
              asOf={data.asOf}
              editing={editing}
              pageIsEmpty={studioState !== null && !reportState.pageHasWidgets(state)}
              canUndo={history.canUndo}
              canRedo={history.canRedo}
              onUndo={() => apiRef.current?.undo()}
              onRedo={() => apiRef.current?.redo()}
              onSave={save}
              onDiscard={discard}
              onEditingChange={(next) => (next ? changeMode('edit') : guard(() => changeMode('view')))}
            />

            <div className="min-h-0 flex-1">
              {hasData(data) ? (
                <AgStudioProvider licenseKey={licenseKey} modules={ai ? [AgStudioAiModule] : undefined}>
                  <AgStudio
                    style={{ height: '100%', width: '100%' }}
                    theme={agStudioPayPalTheme}
                    layout={{ widgetBorderEnabled: true }}
                    data={studioData}
                    ai={ai}
                    initialState={initialState}
                    mode={mode}
                    onApiReady={(event) => {
                      apiRef.current = event.api;
                    }}
                    onStudioReady={(event) => {
                      const current = event.api.getState();
                      setStudioState(current);
                    }}
                    onStateUpdated={(event) => {
                      const { undo, redo } = event.api.getHistory();
                      setStudioState(event.state);
                      setHistory({ canUndo: undo.length > 0, canRedo: redo.length > 0 });
                    }}
                  />
                </AgStudioProvider>
              ) : (
                <EmptyData />
              )}
            </div>

            <UnsavedChangesDialog
              open={dialog?.kind === 'unsaved'}
              reportName={saved.name}
              onCancel={() => setDialog(null)}
              onDiscard={() => {
                discard();
                if (dialog?.kind === 'unsaved') dialog.then();
                setDialog(null);
              }}
              onSave={() => {
                save();
                if (dialog?.kind === 'unsaved') dialog.then();
                setDialog(null);
              }}
            />
            <CreateReportDialog
              open={dialog?.kind === 'create'}
              onClose={() => setDialog(null)}
              onCreate={(name) => {
                setDialog(null);
                createReport(name);
              }}
            />
            <DeleteReportDialog
              report={dialog?.kind === 'delete' ? dialog.report : null}
              onCancel={() => setDialog(null)}
              onConfirm={(report) => {
                deleteReport(report);
                setDialog(null);
              }}
            />
            <ResetDemoDialog
              open={dialog?.kind === 'reset'}
              builtInName={defaultReport().name}
              onCancel={() => setDialog(null)}
              onConfirm={() => {
                resetDemo();
                setDialog(null);
              }}
            />
          </AppShell>
        </div>
      )}
    </div>
  );
}
