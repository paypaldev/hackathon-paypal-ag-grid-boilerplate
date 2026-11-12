// Page titles for the sidebar and header. Studio's state has no page names, so each report
// keeps its own map of page id -> title. Pages without a saved title are numbered by position.

import type { AgReportState } from 'ag-studio';

type Titled = { pageTitles: Record<string, string>; state: AgReportState };

export type ReportPage = { id: string; title: string };

export const pageTitle = (report: Titled, pageId: string) =>
  report.pageTitles[pageId] ?? `Page ${report.state.pages.findIndex((page) => page.id === pageId) + 1}`;

export const pagesFor = (report: Titled): ReportPage[] =>
  report.state.pages.map((page) => ({ id: page.id, title: pageTitle(report, page.id) }));

export const pageTitlesFor = (report: Titled): Record<string, string> =>
  Object.fromEntries(pagesFor(report).map((page) => [page.id, page.title]));

