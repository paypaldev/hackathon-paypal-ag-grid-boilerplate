// Saved reports, kept in this browser's localStorage. Studio's state has no page names, so each
// report carries its page titles alongside the AG Studio state.
//
// The built-in report comes from ./components/studio/config/initialState.ts until it is saved;
// after that the saved copy wins until it is reset to default.

import type { AgReportState } from 'ag-studio';
import { dashboardReport } from './components/studio/config/initialState';

export type SavedReport = {
  id: string;
  name: string;
  builtIn?: boolean;
  pageTitles: Record<string, string>;
  state: AgReportState;
  updatedAt: string;
};

export type StoredReports = { reports: SavedReport[]; activeId: string };

const STORAGE_KEY = 'ag-paypal-demo:reports:v1';

export const BUILT_IN_ID = 'paypal-overview';

// Sidebar titles for the built-in report's pages, keyed by page id in initialState.ts.
const defaultPageTitles: Record<string, string> = {
  revenue: 'Revenue',
  receivables: 'Receivables',
  cash: 'Cash & payouts',
  catalogue: 'Catalogue',
};

export const defaultReport = (): SavedReport => ({
  id: BUILT_IN_ID,
  name: 'PayPal overview',
  builtIn: true,
  pageTitles: defaultPageTitles,
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

// A copy of a report under a new id. Copies of the built-in report are ordinary reports.
export const copyOf = (source: SavedReport): SavedReport => ({
  ...source,
  id: newId('report'),
  name: `${source.name} (copy)`,
  builtIn: undefined,
  updatedAt: new Date().toISOString(),
});

export const findReport = (reports: SavedReport[], id: string) => reports.find((r) => r.id === id);

// --- Updates ----------------------------------------------------------------------
// Pure: each returns the next StoredReports, for the caller to save.

export function upsert(current: StoredReports, report: SavedReport, { activate = false } = {}): StoredReports {
  const exists = current.reports.some((r) => r.id === report.id);
  const reports = exists ? current.reports.map((r) => (r.id === report.id ? report : r)) : [...current.reports, report];
  return { reports, activeId: activate ? report.id : current.activeId };
}

// Deleting the built-in report resets it to default rather than removing it.
export function remove(current: StoredReports, id: string): StoredReports {
  if (id === BUILT_IN_ID) return upsert(current, defaultReport());
  const reports = current.reports.filter((r) => r.id !== id);
  return { reports, activeId: current.activeId === id ? BUILT_IN_ID : current.activeId };
}

// Back to a fresh demo: only the built-in report, as defined in initialState.ts.
export const initialReports = (): StoredReports => ({ reports: [defaultReport()], activeId: BUILT_IN_ID });

// --- Storage ----------------------------------------------------------------------

export function loadReports(): StoredReports {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialReports();
    const stored = JSON.parse(raw) as StoredReports;
    // The built-in report is always listed first, from code unless a saved copy exists.
    const reports = [
      stored.reports.find((r) => r.id === BUILT_IN_ID) ?? defaultReport(),
      ...stored.reports.filter((r) => r.id !== BUILT_IN_ID),
    ];
    const activeId = reports.some((r) => r.id === stored.activeId) ? stored.activeId : BUILT_IN_ID;
    return { reports, activeId };
  } catch {
    return initialReports();
  }
}

export function saveReports(next: StoredReports) {
  // Only keep the built-in report once it differs from code, so edits to initialState.ts show up.
  const untouched = (r: SavedReport) =>
    r.id === BUILT_IN_ID &&
    r.state === dashboardReport &&
    r.pageTitles === defaultPageTitles &&
    r.name === defaultReport().name;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, reports: next.reports.filter((r) => !untouched(r)) }));
  } catch {
    // Storage full or blocked: keep working in memory for this session.
  }
}
