'use client';

// The dashboard: the PayPal shell (./shell) wrapped around a single AG Studio instance
// (./studio). This file is the glue between them. The shell owns saved reports, page names
// and navigation; Studio owns the report itself. They meet in two places:
//   - the shell drives Studio through its AgStudioApi (setState, getState, undo, redo)
//   - Studio reports every change back through onStateChange

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { AgReportState, AgStudioApi, AgStudioMode } from 'ag-studio';
import type { DashboardApiData } from '@/lib/dashboard-api';
import { AppShell } from './shell/app-shell';
import { CreateReportDialog, DeleteReportDialog, ResetDemoDialog, UnsavedChangesDialog } from './shell/dialogs';
import { EmptyData } from './shell/empty-data';
import { ReportHeader } from './shell/report-header';
import { blankReport, defaultReport, newId, pageTitle, reportsStore, type SavedReport } from './shell/reports-store';
import { ReportsSidebar } from './shell/sidebar';
import { DashboardSkeleton } from './shell/skeleton';
import { PayPalStudio, type StudioHistory } from './studio/paypal-studio';
import * as reportState from './studio/state';

const titlesFor = (state: AgReportState, titles: Record<string, string>) =>
  Object.fromEntries(state.pages.map((page) => [page.id, titles[page.id] ?? pageTitle({ pageTitles: titles, state }, page.id)]));

const hasData = (data: DashboardApiData) =>
  [data.invoices, data.transactions, data.products, data.plans, data.balances].some((rows) => rows.length > 0);

export function Dashboard({ data, licenseKey }: { data: DashboardApiData; licenseKey?: string }) {
  // Saved reports live in localStorage, so there's nothing to show until the browser has read them.
  const store = useSyncExternalStore(reportsStore.subscribe, reportsStore.getSnapshot, reportsStore.getServerSnapshot);
  if (!store) return <DashboardSkeleton />;
  return <Workspace reports={store.reports} initialReportId={store.activeId} data={data} licenseKey={licenseKey} />;
}

type DialogState =
  | { kind: 'unsaved'; then: () => void }
  | { kind: 'create' }
  | { kind: 'delete'; report: SavedReport }
  | { kind: 'reset' }
  | null;

function Workspace({
  reports,
  initialReportId,
  data,
  licenseKey,
}: {
  reports: SavedReport[];
  initialReportId: string;
  data: DashboardApiData;
  licenseKey?: string;
}) {
  const apiRef = useRef<AgStudioApi | null>(null);

  // A single Studio instance for the whole session. It starts on the last opened report;
  // opening another report (or discarding changes) replaces its state with api.setState.
  const [initial] = useState(() => reports.find((r) => r.id === initialReportId) ?? reports[0]);
  const [initialState] = useState(() => reportState.withFiltersPanelFor('view', initial.state));
  const [reportId, setReportId] = useState(initial.id);
  const saved = reports.find((r) => r.id === reportId) ?? reports[0];

  const [titles, setTitles] = useState(saved.pageTitles);
  const [live, setLive] = useState<AgReportState | null>(null);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [history, setHistory] = useState<StudioHistory>({ canUndo: false, canRedo: false });
  const [mode, setMode] = useState<AgStudioMode>('view');
  const [dialog, setDialog] = useState<DialogState>(null);

  const state = live ?? initialState;
  const dirty =
    live !== null &&
    baseline !== null &&
    (reportState.durable(live) !== baseline ||
      JSON.stringify(titlesFor(live, titles)) !== JSON.stringify(titlesFor(live, saved.pageTitles)));

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // --- Driving Studio ---------------------------------------------------------------
  const load = (report: SavedReport, selectedPageId = report.state.selectedPageId, nextMode = mode) => {
    const api = apiRef.current;
    if (!api) return;
    api.setState(reportState.withFiltersPanelFor(nextMode, { ...report.state, selectedPageId }));
    // Undo shouldn't step back into the previous report.
    api.clearHistory();
    const current = api.getState();
    setReportId(report.id);
    setTitles(report.pageTitles);
    setLive(current);
    setBaseline(reportState.durable(current));
    setHistory({ canUndo: false, canRedo: false });
    reportsStore.setActive(report.id);
  };
  const updateState = (next: (current: AgReportState) => AgReportState) => {
    const api = apiRef.current;
    if (api) api.setState(next(api.getState()));
  };
  const changeMode = (next: AgStudioMode) => {
    updateState((s) => reportState.withFiltersPanelFor(next, s));
    setMode(next);
  };

  // --- Saving -----------------------------------------------------------------------
  const save = () => {
    const api = apiRef.current;
    if (!api) return;
    const current = api.getState();
    reportsStore.upsert({ ...saved, pageTitles: titlesFor(current, titles), state: current, updatedAt: new Date().toISOString() });
    setBaseline(reportState.durable(current));
    console.log('[AG Studio] saved report', saved.name, current);
  };
  const discard = () => {
    const selectedPageId = saved.state.pages.some((p) => p.id === state.selectedPageId)
      ? state.selectedPageId
      : saved.state.selectedPageId;
    load(saved, selectedPageId);
  };
  // Anything that leaves the current report asks first when it has unsaved changes.
  const guard = (then: () => void) => (dirty ? setDialog({ kind: 'unsaved', then }) : then());

  // --- Reports ----------------------------------------------------------------------
  const openReport = (id: string) => {
    const report = reports.find((r) => r.id === id);
    if (report && id !== saved.id) guard(() => load(report));
  };
  const createReport = (name: string) => {
    const report = blankReport(name);
    reportsStore.upsert(report, { activate: true });
    load(report, report.state.selectedPageId, 'edit');
    setMode('edit');
  };
  const duplicateReport = (id: string) =>
    guard(() => {
      const source = reports.find((r) => r.id === id);
      if (!source) return;
      const copy: SavedReport = {
        ...source,
        id: newId('report'),
        name: `${source.name} (copy)`,
        builtIn: undefined,
        updatedAt: new Date().toISOString(),
      };
      reportsStore.upsert(copy, { activate: true });
      load(copy);
    });
  const resetDemo = () => {
    reportsStore.reset();
    const report = defaultReport();
    load(report, report.state.selectedPageId, 'view');
    setMode('view');
  };
  const deleteReport = (report: SavedReport) => {
    reportsStore.remove(report.id);
    if (report.id !== saved.id) return;
    const { reports: next, activeId } = reportsStore.getSnapshot();
    load(next.find((r) => r.id === activeId) ?? next[0]);
  };
  const renameReport = (id: string, name: string) => {
    const report = reports.find((r) => r.id === id);
    if (report) reportsStore.upsert({ ...report, name });
  };

  // --- Pages ------------------------------------------------------------------------
  // Studio leaves page navigation to the host, and its state has no page names.
  const selectPage = (id: string, pageId: string) => {
    if (id === saved.id) updateState((s) => reportState.selectPage(s, pageId));
    else {
      const report = reports.find((r) => r.id === id);
      if (report) guard(() => load(report, pageId));
    }
  };
  const addPage = () => {
    const id = newId('page');
    setTitles((current) => ({ ...current, [id]: `Page ${state.pages.length + 1}` }));
    updateState((s) => reportState.addPage(s, id));
    return id;
  };
  const removePage = (id: string) => updateState((s) => reportState.removePage(s, id));
  const renamePage = (id: string, title: string) => setTitles((current) => ({ ...current, [id]: title }));

  const editing = mode === 'edit';
  const pages = state.pages.map((page) => ({ id: page.id, title: titles[page.id] ?? pageTitle({ pageTitles: titles, state }, page.id) }));

  return (
    <AppShell
      sidebar={
        <ReportsSidebar
          reports={reports}
          activeId={saved.id}
          activeDirty={dirty}
          activePages={pages}
          selectedPageId={state.selectedPageId}
          editing={editing}
          ready={live !== null}
          onSelectReport={openReport}
          onSelectPage={selectPage}
          onAddPage={() => (apiRef.current ? addPage() : undefined)}
          onRemovePage={removePage}
          onRenamePage={renamePage}
          onRenameReport={renameReport}
          onCreate={() => guard(() => setDialog({ kind: 'create' }))}
          onDuplicate={duplicateReport}
          onDelete={(id) => {
            const report = reports.find((r) => r.id === id);
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
        pageIsEmpty={live !== null && !reportState.pageHasWidgets(state)}
        dirty={dirty}
        saved={baseline !== null}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={() => apiRef.current?.undo()}
        onRedo={() => apiRef.current?.redo()}
        onSave={save}
        onDiscard={discard}
        onEditingChange={(next) => changeMode(next ? 'edit' : 'view')}
      />

      <div className="min-h-0 flex-1">
        {hasData(data) ? (
          <PayPalStudio
            data={data}
            licenseKey={licenseKey}
            initialState={initialState}
            mode={mode}
            onApiReady={(api) => {
              apiRef.current = api;
            }}
            onReady={(current) => {
              setLive(current);
              setBaseline(reportState.durable(current));
            }}
            onStateChange={(current, nextHistory) => {
              setLive(current);
              setHistory(nextHistory);
            }}
          />
        ) : (
          <EmptyData />
        )}
      </div>

      <UnsavedChangesDialog
        open={dialog?.kind === 'unsaved'}
        reportName={saved.name}
        onCancel={() => setDialog(null)}
        onDiscard={() => {
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
  );
}
