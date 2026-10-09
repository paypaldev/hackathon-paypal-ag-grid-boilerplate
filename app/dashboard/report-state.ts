// Pure helpers over AG Studio's report state (AgReportState). The shell uses these to check for
// unsaved changes and to edit pages; none of them touch the Studio API.

import type { AgReportState, AgStudioMode } from 'ag-studio';

// Whether `state` differs from `saved` in anything worth saving. The selected page, cross-filters,
// selection and panel sizes also live in state, but changing them doesn't make a report unsaved.
export const hasChanges = (state: AgReportState, saved: AgReportState) => durable(state) !== durable(saved);

const durable = (state: AgReportState) =>
  JSON.stringify({
    schema: state.schema,
    pages: state.pages.map(({ id, widgets, widgetLayout, layout, filter }) => ({ id, widgets, widgetLayout, layout, filter })),
  });

// The filters panel starts expanded in view mode, where it's the only panel, and collapsed in
// edit mode, where Compose and Data need the room. Panel state isn't something Save compares.
export const withFiltersPanelFor = (mode: AgStudioMode, state: AgReportState): AgReportState => ({
  ...state,
  panels: { ...state.panels, filters: { ...state.panels?.filters, collapsed: mode === 'edit' } },
});

// Studio leaves page navigation to the host: these add, remove and select pages in state.
export const selectPage = (state: AgReportState, pageId: string): AgReportState => ({ ...state, selectedPageId: pageId });

// The page to show in `state`: `preferredPageId` if it has that page, otherwise its own selection.
export const pageToSelect = (state: AgReportState, preferredPageId: string) =>
  state.pages.some((p) => p.id === preferredPageId) ? preferredPageId : state.selectedPageId;

export const addPage = (state: AgReportState, pageId: string): AgReportState => ({
  ...state,
  pages: [...state.pages, { id: pageId }],
  selectedPageId: pageId,
});

export const removePage = (state: AgReportState, pageId: string): AgReportState => {
  const index = state.pages.findIndex((p) => p.id === pageId);
  const pages = state.pages.filter((p) => p.id !== pageId);
  const selectedPageId = state.selectedPageId === pageId ? pages[Math.max(0, index - 1)].id : state.selectedPageId;
  return { ...state, pages, selectedPageId };
};

export const pageHasWidgets = (state: AgReportState) =>
  Object.keys(state.pages.find((p) => p.id === state.selectedPageId)?.widgets ?? {}).length > 0;
