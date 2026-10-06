// Pure helpers over AG Studio's report state (AgReportState). The shell uses these to decide
// what counts as an unsaved change and to edit pages; none of them touch the Studio API.

import type { AgReportState, AgStudioMode } from 'ag-studio';

// What Save keeps and Discard throws away. The selected page, cross-filters, selection and
// panel sizes also live in state, but changing them doesn't make a report unsaved.
export const durable = (state: AgReportState) =>
  JSON.stringify({
    schema: state.schema,
    pages: state.pages.map(({ id, widgets, widgetLayout, layout, filter }) => ({ id, widgets, widgetLayout, layout, filter })),
  });

// The filters panel starts expanded in view mode, where it's the only panel, and collapsed in
// Customise, where Compose and Data need the room. Panel state isn't something Save compares.
export const withFiltersPanelFor = (mode: AgStudioMode, state: AgReportState): AgReportState => ({
  ...state,
  panels: { ...state.panels, filters: { ...state.panels?.filters, collapsed: mode === 'edit' } },
});

// Studio leaves page navigation to the host: these add, remove and select pages in state.
export const selectPage = (state: AgReportState, pageId: string): AgReportState => ({ ...state, selectedPageId: pageId });

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
