// Saved reports, kept in this browser's localStorage. Studio's state has no page names, so each
// report carries its page titles alongside the AG Studio state.
//
// The built-in report comes from ../studio/report.ts until it is saved; after that the saved
// copy wins until it is reset to default.

import type { AgReportState } from 'ag-studio';
import { dashboardPages, dashboardReport } from '../studio/report';

export type SavedReport = {
  id: string;
  name: string;
  builtIn?: boolean;
  pageTitles: Record<string, string>;
  state: AgReportState;
  updatedAt: string;
};

type StoredReports = { reports: SavedReport[]; activeId: string };

const STORAGE_KEY = 'ag-paypal-demo:reports:v1';

export const BUILT_IN_ID = 'paypal-overview';

export const defaultReport = (): SavedReport => ({
  id: BUILT_IN_ID,
  name: 'PayPal overview',
  builtIn: true,
  pageTitles: Object.fromEntries(dashboardPages.map((page) => [page.state.id, page.title])),
  state: dashboardReport,
  updatedAt: new Date(0).toISOString(),
});

export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

export function blankReport(name: string): SavedReport {
  const pageId = newId('page');
  return {
    id: newId('report'),
    name,
    pageTitles: { [pageId]: 'Page 1' },
    state: { selectedPageId: pageId, pages: [{ id: pageId }] },
    updatedAt: new Date().toISOString(),
  };
}

export const pageTitle = (report: Pick<SavedReport, 'pageTitles' | 'state'>, pageId: string) =>
  report.pageTitles[pageId] ?? `Page ${report.state.pages.findIndex((page) => page.id === pageId) + 1}`;

// --- Store ------------------------------------------------------------------------
// A tiny external store so React reads it with useSyncExternalStore: nothing renders from
// localStorage on the server, and every tab of the app sees the same list.

let cache: StoredReports | null = null;
const listeners = new Set<() => void>();

function read(): StoredReports {
  const fallback = { reports: [defaultReport()], activeId: BUILT_IN_ID };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const stored = JSON.parse(raw) as StoredReports;
    // The built-in report is always listed first, from code unless a saved copy exists.
    const reports = [
      stored.reports.find((r) => r.id === BUILT_IN_ID) ?? defaultReport(),
      ...stored.reports.filter((r) => r.id !== BUILT_IN_ID),
    ];
    const activeId = reports.some((r) => r.id === stored.activeId) ? stored.activeId : BUILT_IN_ID;
    return { reports, activeId };
  } catch {
    return fallback;
  }
}

function write(next: StoredReports) {
  cache = next;
  try {
    // Only keep the built-in report once it differs from code, so edits to ../studio/report.ts show up.
    const untouched = (r: SavedReport) =>
      r.id === BUILT_IN_ID && r.state === dashboardReport && r.name === defaultReport().name;
    const reports = next.reports.filter((r) => !untouched(r));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, reports }));
  } catch {
    // Storage full or blocked: keep working in memory for this session.
  }
  listeners.forEach((listener) => listener());
}

export const reportsStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      cache = read();
      listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  },
  getSnapshot(): StoredReports {
    cache ??= read();
    return cache;
  },
  getServerSnapshot: (): StoredReports | null => null,

  setActive(activeId: string) {
    write({ ...reportsStore.getSnapshot(), activeId });
  },
  upsert(report: SavedReport, { activate = false } = {}) {
    const current = reportsStore.getSnapshot();
    const exists = current.reports.some((r) => r.id === report.id);
    const reports = exists
      ? current.reports.map((r) => (r.id === report.id ? report : r))
      : [...current.reports, report];
    write({ reports, activeId: activate ? report.id : current.activeId });
  },
  remove(id: string) {
    const current = reportsStore.getSnapshot();
    if (id === BUILT_IN_ID) {
      write({ ...current, reports: current.reports.map((r) => (r.id === id ? defaultReport() : r)) });
      return;
    }
    const reports = current.reports.filter((r) => r.id !== id);
    write({ reports, activeId: current.activeId === id ? BUILT_IN_ID : current.activeId });
  },
  // Back to a fresh demo: only the built-in report, as defined in ../studio/report.ts.
  reset() {
    write({ reports: [defaultReport()], activeId: BUILT_IN_ID });
  },
};
