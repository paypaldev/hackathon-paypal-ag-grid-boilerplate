'use client';

// The AG Studio embed: the one place that renders <AgStudio>. Everything Studio needs to look
// and behave like part of the PayPal dashboard is configured here — the data sources, theme and
// default layout. The shell around it (../shell) drives it through the AgStudioApi it hands
// back, and hears about changes through onStateChange.

import { useMemo } from 'react';
import {
  enableStudioDevValidations,
  type AgReportState,
  type AgStudioApi,
  type AgStudioMode,
} from 'ag-studio';
import { AgStudio, AgStudioProvider } from 'ag-studio-react';
import type { DashboardApiData } from '@/lib/dashboard-api';
import { buildStudioData } from './data';
import { paypalStudioTheme } from './theme';

if (process.env.NODE_ENV !== 'production') {
  enableStudioDevValidations();
}

// Module constants, so the props keep the same reference on every render.
const STUDIO_STYLE = { height: '100%', width: '100%' };

// Default page layout for every report: widgets are bordered cards, styled by the theme.
const STUDIO_LAYOUT = { widgetBorderEnabled: true };

export type StudioHistory = { canUndo: boolean; canRedo: boolean };

export function PayPalStudio({
  data,
  licenseKey,
  initialState,
  mode,
  onApiReady,
  onReady,
  onStateChange,
}: {
  data: DashboardApiData;
  licenseKey?: string;
  /** Read once, when Studio is created. Load other reports with api.setState. */
  initialState: AgReportState;
  mode: AgStudioMode;
  /** The API can be called from here on. */
  onApiReady: (api: AgStudioApi) => void;
  /** The data engine and UI are ready; this is Studio's normalised starting state. */
  onReady: (state: AgReportState) => void;
  onStateChange: (state: AgReportState, history: StudioHistory) => void;
}) {
  const studioData = useMemo(() => buildStudioData(data), [data]);

  return (
    <AgStudioProvider licenseKey={licenseKey}>
      <AgStudio
        style={STUDIO_STYLE}
        theme={paypalStudioTheme}
        layout={STUDIO_LAYOUT}
        data={studioData}
        initialState={initialState}
        mode={mode}
        onApiReady={(event) => onApiReady(event.api)}
        // The full report state is logged on load and on every change, so it can be copied
        // from the console (right-click > Copy object) and pasted back into ./report.ts.
        onStudioReady={(event) => {
          const state = event.api.getState();
          console.log('[AG Studio] initial state', state);
          onReady(state);
        }}
        onStateUpdated={(event) => {
          console.log('[AG Studio] state updated', event.state);
          const { undo, redo } = event.api.getHistory();
          onStateChange(event.state, { canUndo: undo.length > 0, canRedo: redo.length > 0 });
        }}
      />
    </AgStudioProvider>
  );
}
