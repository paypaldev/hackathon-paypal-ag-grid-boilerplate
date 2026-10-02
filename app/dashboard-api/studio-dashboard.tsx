'use client';

import { useMemo, useRef, useState } from 'react';
import {
  enableStudioDevValidations,
  type AgStudioApi,
  type AgStudioApiReadyEvent,
  type AgStudioMode,
  type AgStudioStateUpdatedEvent,
} from 'ag-studio';
import { AgStudio, AgStudioProvider } from 'ag-studio-react';
import type { DashboardApiData } from '@/lib/dashboard-api';
import { dashboardPages, dashboardReport } from './report';
import { buildStudioData } from './studio-data';

if (process.env.NODE_ENV !== 'production') {
  enableStudioDevValidations();
}

const STUDIO_STYLE = { height: '100%', width: '100%' };

const toggleClass = (active: boolean) =>
  `px-3 py-1 ${active ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'}`;

export function StudioDashboard({
  data,
  licenseKey,
}: {
  data: DashboardApiData;
  licenseKey?: string;
}) {
  const studioData = useMemo(() => buildStudioData(data), [data]);
  const apiRef = useRef<AgStudioApi | null>(null);
  const [mode, setMode] = useState<AgStudioMode>('edit');
  const [pageId, setPageId] = useState(dashboardReport.selectedPageId);

  // Studio owns the selected page; the tabs follow its state, and switching keeps any edits.
  const onApiReady = (event: AgStudioApiReadyEvent) => {
    apiRef.current = event.api;
  };
  const onStateUpdated = (event: AgStudioStateUpdatedEvent) =>
    setPageId(event.state.selectedPageId);
  const selectPage = (id: string) => {
    const api = apiRef.current;
    if (api) api.setState({ ...api.getState(), selectedPageId: id });
  };

  return (
    <main className="flex h-dvh flex-col bg-white">
      <header className="flex flex-wrap items-center gap-4 border-b border-zinc-200 px-6 py-2 text-sm">
        <h1 className="font-semibold">PayPal dashboard (REST API)</h1>
        <div
          className="flex overflow-hidden rounded-md border border-zinc-300"
          role="tablist"
          aria-label="Dashboard pages"
        >
          {dashboardPages.map(({ title, state }) => (
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
        <div
          className="flex overflow-hidden rounded-md border border-zinc-300"
          role="group"
          aria-label="Studio mode"
        >
          {(['view', 'edit'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => setMode(option)}
              className={`capitalize ${toggleClass(mode === option)}`}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="text-zinc-500">
          Click a bar, slice or tile to cross-filter the page. Data as of{' '}
          {new Date(data.asOf).toLocaleString('en-GB')}.
        </p>
      </header>
      <div className="min-h-0 flex-1">
        <AgStudioProvider licenseKey={licenseKey}>
          <AgStudio
            style={STUDIO_STYLE}
            data={studioData}
            initialState={dashboardReport}
            mode={mode}
            onApiReady={onApiReady}
            onStateUpdated={onStateUpdated}
          />
        </AgStudioProvider>
      </div>
    </main>
  );
}
