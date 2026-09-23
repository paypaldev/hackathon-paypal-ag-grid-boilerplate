"use client";

import type {
  AgDataSourcesDefinition,
  AgStudioApi,
  AgStudioApiReadyEvent,
  AgStudioMode,
  AgStudioStateUpdatedEvent,
} from "ag-studio";
import { enableStudioDevValidations } from "ag-studio";
import { AgStudio, AgStudioProvider } from "ag-studio-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { dashboardPages, dashboardReport } from "./report";

if (process.env.NODE_ENV !== "production") {
  enableStudioDevValidations();
}

const STUDIO_STYLE = { height: "100%", width: "100%" };

type Props = {
  data: AgDataSourcesDefinition;
  licenseKey: string | undefined;
  /** Data sources the PayPal app lacks permission for. */
  unavailable: string[];
};

const toggleClass = (active: boolean) =>
  `px-3 py-1 ${active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"}`;

export default function StudioDashboard({ data, licenseKey, unavailable }: Props) {
  const apiRef = useRef<AgStudioApi | null>(null);
  const [mode, setMode] = useState<AgStudioMode>("view");
  // Drop pages whose data source PayPal didn't return (e.g. Transaction Search without permission).
  const pages = useMemo(
    () =>
      dashboardPages.filter(
        ({ requiresSource }) => !requiresSource || data.sources.some((source) => source.id === requiresSource),
      ),
    [data],
  );
  const initialState = useMemo(() => dashboardReport(pages), [pages]);
  const [pageId, setPageId] = useState(initialState.selectedPageId);

  const onApiReady = useCallback((event: AgStudioApiReadyEvent) => {
    apiRef.current = event.api;
  }, []);
  // Studio owns the selected page; the tabs follow its state.
  const onStateUpdated = useCallback((event: AgStudioStateUpdatedEvent) => {
    setPageId(event.state.selectedPageId);
  }, []);
  // Studio has no page navigation of its own; switching keeps any edits in the current state.
  const selectPage = (id: string) => {
    const api = apiRef.current;
    if (api) api.setState({ ...api.getState(), selectedPageId: id });
  };

  return (
    // 45px = nav bar height; Studio fills the rest of the viewport.
    <main className="flex h-[calc(100dvh-45px)] flex-col">
      <div className="flex items-center gap-4 border-b border-zinc-200 bg-white px-8 py-2 text-sm">
        <div className="flex overflow-hidden rounded-md border border-zinc-300" role="tablist" aria-label="Dashboard pages">
          {pages.map(({ title, state }) => (
            <button
              key={state.id}
              type="button"
              role="tab"
              aria-selected={pageId === state.id}
              onClick={() => selectPage(state.id)}
              className={toggleClass(pageId === state.id)}
            >
              {title}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-md border border-zinc-300" role="group" aria-label="Studio mode">
          {(["view", "edit"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              aria-pressed={mode === option}
              className={`capitalize ${toggleClass(mode === option)}`}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="text-zinc-600">
          Click a chart bar or slice to cross-filter. Money is per currency (no FX); use the Currency filter to switch.
          {unavailable.length > 0 && ` Unavailable: ${unavailable.join(", ")}.`}
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <AgStudioProvider licenseKey={licenseKey}>
          <AgStudio
            style={STUDIO_STYLE}
            data={data}
            initialState={initialState}
            mode={mode}
            onApiReady={onApiReady}
            onStateUpdated={onStateUpdated}
          />
        </AgStudioProvider>
      </div>
    </main>
  );
}
