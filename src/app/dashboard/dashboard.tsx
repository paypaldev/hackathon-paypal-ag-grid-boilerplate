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
import { ShieldCheck, BarChart3, TrendingUp, CheckCircle2, DollarSign } from 'lucide-react';

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
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* 1. TOP: Judge 1-Click Live Sandbox Test Bar */}
      <JudgeTestBar />

      {/* 2. Top-Level Mode Selector (Command Center vs AG Studio BI) */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold px-3 py-1 rounded-lg text-sm tracking-wider shadow">
            VeriSettle AI
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Autonomous B2B Escrow, Multimodal 3-Way Reconciliation &amp; Dispute Defense OS
          </span>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('COMMAND_CENTER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${activeTab === 'COMMAND_CENTER'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Autonomous Command Center</span>
          </button>
          <button
            onClick={() => setActiveTab('AG_STUDIO')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${activeTab === 'AG_STUDIO'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
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
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Active Escrow Under Hold</span>
                <DollarSign className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">$2,450.00</div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <span>30% Auth placed via Orders v2</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>3-Way Match Pass Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {(passRate * 100).toFixed(0)}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                LayoutLMv3 vs Channel3 vs PayPal
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Bayesian Model Avg Risk</span>
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-purple-400">
                {avgRisk.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Leak-Free XGBoost + GNN/LSTM EVT
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Margin Preserved (Skeptic)</span>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">+$2,450.00</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Dilutive 2/10 Net 30 blocked
              </div>
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
