'use client';

// The dashboard: the PayPal shell (./components) wrapped around a single AG Studio instance
// (./components/studio). This file is the glue between them. The shell owns saved reports,
// page names and navigation; Studio owns the report being edited. They meet in two places:
//   - the shell drives Studio through its AgStudioApi (setState, getState, undo, redo)
//   - Studio reports every change back through onStateChange, which only redraws the shell
//
// Nothing tracks edits as they happen. Save reads the report from Studio with getState(), and
// leaving a report compares Studio's state with the saved one there and then.

import { useRef, useState, useSyncExternalStore } from 'react';
import type { AgReportState, AgStudioApi, AgStudioMode } from 'ag-studio';
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
  loadReports,
  newId,
  remove,
  saveReports,
  upsert,
  type SavedReport,
  type StoredReports,
} from './reports-store';
import { pagesFor, pageTitlesFor } from './page-titles';
import { ReportsSidebar } from './components/sidebar';
import { DashboardSkeleton } from './components/skeleton';
import { hasData } from './components/studio/config/data';
import {
  NO_HISTORY,
  PayPalStudio,
  type StudioHistory,
  type StudioSource,
} from './components/studio/ag-studio-paypal';
import * as reportState from './components/studio/utils/state-utils';

const noSubscription = () => () => {};

export function Dashboard(props: StudioSource) {
  // Saved reports live in localStorage, which only exists in the browser.
  const inBrowser = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  return inBrowser ? <ReportsDashboard {...props} /> : <DashboardSkeleton />;
}

function ReportsDashboard({ data, licenseKey, aiModels }: StudioSource) {
  const [store, setStore] = useState(loadReports);
  // The latest reports, for handlers that run one after another before React re-renders.
  const storeRef = useRef(store);
  const apiRef = useRef<AgStudioApi | null>(null);

  // The open report as it is in Studio now, unsaved edits included, for drawing the shell.
  // Null until Studio is ready.
  const [studioState, setStudioState] = useState<AgReportState | null>(null);
  const [history, setHistory] = useState<StudioHistory>(NO_HISTORY);
  const [mode, setMode] = useState<AgStudioMode>('view');
  const [dialog, setDialog] = useState<DashboardDialog>(null);

  const { reports } = store;
  // The open report, as it was last saved.
  const saved = findReport(reports, store.activeId) ?? reports[0];
  // Studio starts on the open report; after that, its state is read from Studio.
  const initialState = reportState.withFiltersPanelFor('view', saved.state);
  const state = studioState ?? initialState;

  // --- Saved reports ----------------------------------------------------------------
  const update = (change: (current: StoredReports) => StoredReports) => {
    const next = change(storeRef.current);
    storeRef.current = next;
    saveReports(next);
    setStore(next);
  };
  const editReport = (id: string, change: (report: SavedReport) => SavedReport) =>
    update((current) => {
      const report = findReport(current.reports, id);
      return report ? upsert(current, change(report)) : current;
    });

  // --- Driving Studio ---------------------------------------------------------------
  const load = (
    report: SavedReport,
    selectedPageId = report.state.selectedPageId,
    nextMode = mode,
  ) => {
    const api = apiRef.current;
    if (!api) return;
    api.setState(
      reportState.withFiltersPanelFor(nextMode, {
        ...report.state,
        selectedPageId,
      }),
    );
    // Undo shouldn't step back into the previous report.
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

  // --- Saving -----------------------------------------------------------------------
  const save = () => {
    const api = apiRef.current;
    if (!api) return;
    const current = api.getState();
    editReport(saved.id, (report) => ({
      ...report,
      // Titles for exactly the pages being saved.
      pageTitles: pageTitlesFor({ pageTitles: report.pageTitles, state: current }),
      state: current,
      updatedAt: new Date().toISOString(),
    }));
    console.log('[AG Studio] saved report', saved.name, current);
  };
  const discard = () =>
    load(saved, reportState.pageToSelect(saved.state, state.selectedPageId));
  // Anything that leaves the current report or edit mode asks first when it has unsaved changes.
  const guard = (then: () => void) => {
    const api = apiRef.current;
    if (api && reportState.hasChanges(api.getState(), saved.state)) {
      setDialog({ kind: 'unsaved', then });
    } else then();
  };

  // --- Reports ----------------------------------------------------------------------
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
    const { reports: next, activeId } = storeRef.current;
    load(findReport(next, activeId) ?? next[0]);
  };
  const renameReport = (id: string, name: string) =>
    editReport(id, (report) => ({ ...report, name }));

  // --- Pages ------------------------------------------------------------------------
  // Studio leaves page navigation to the host, and its state has no page names. Page names are
  // saved as soon as they change; new pages are numbered until they're named.
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
    // A new page is empty, so open edit mode to fill it.
    if (mode !== 'edit') changeMode('edit');
    return id;
  };
  const removePage = (id: string) =>
    updateState((s) => reportState.removePage(s, id));
  const renamePage = (id: string, title: string) =>
    editReport(saved.id, (report) => ({
      ...report,
      pageTitles: { ...report.pageTitles, [id]: title },
    }));

  const editing = mode === 'edit';
  const pages = pagesFor({ pageTitles: saved.pageTitles, state });

  return (
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
        onEditingChange={(next) =>
          next ? changeMode('edit') : guard(() => changeMode('view'))
        }
      />

      <div className="min-h-0 flex-1">
        {hasData(data) ? (
          <PayPalStudio
            data={data}
            licenseKey={licenseKey}
            aiModels={aiModels}
            initialState={initialState}
            mode={mode}
            onApiReady={(api) => {
              apiRef.current = api;
            }}
            onReady={setStudioState}
            onStateChange={(current, nextHistory) => {
              setStudioState(current);
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
  );
}
