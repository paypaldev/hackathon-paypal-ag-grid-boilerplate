'use client';

// The AG Studio embed: the one place that renders <AgStudio>. Everything Studio needs to look
// and behave like part of the PayPal dashboard is configured here — the data sources, theme,
// default layout and AI assistant. The dashboard around it (../../dashboard.tsx) drives it
// through the AgStudioApi it hands back, and hears about changes through onStateChange.

import { useMemo, useState } from 'react';
import {
  AgStudioAiModule,
  createAiHarness,
  enableStudioDevValidations,
  type AgAiHarnessSetup,
  type AgAiPromptStarter,
  type AgReportState,
  type AgStudioApi,
  type AgStudioMode,
} from 'ag-studio';
import { AgStudio, AgStudioProvider } from 'ag-studio-react';
import type { DashboardApiData } from '@/lib/dashboard-api';
import { buildStudioData } from './config/data';
import { openaiAdapter } from './ai/openai-adapter';
import { paypalStudioTheme } from './config/theme';

if (process.env.NODE_ENV !== 'production') {
  enableStudioDevValidations();
}

// The adapter calls `${endpoint}/responses`, i.e. this app's proxy at app/api/ai/responses, which
// holds the OpenAI key. Nothing secret is sent from the browser. `models` are the ids allowed by
// OPENAI_MODELS on the server; the first is the default, and the picker only shows for two or more.
function buildAi(models: string[]): AgAiHarnessSetup {
  // Suggestions shown in a new AI conversation, before anything has been typed.
  const PROMPT_STARTERS: AgAiPromptStarter[] = [
    {
      label: 'Summarise this page',
      prompt:
        'Summarise what this page shows: every widget, the fields it reads, and what stands out.',
    },
    {
      label: 'Overdue invoices',
      prompt: 'Which customers owe the most on overdue invoices?',
    },
    {
      label: 'Revenue by month',
      prompt: 'Add a chart of paid invoice revenue by month.',
    },
  ];

  const adapter = openaiAdapter({ endpoint: '/api/ai', model: models[0] });

  return ({ api }) =>
    createAiHarness(api, {
      adapter,
      promptStarters: PROMPT_STARTERS,
      models:
        models.length > 1 ? models.map((id) => ({ id, label: id })) : undefined,
    });
}

export type StudioHistory = { canUndo: boolean; canRedo: boolean };

export const NO_HISTORY: StudioHistory = { canUndo: false, canRedo: false };

// What every Studio instance is built from: the PayPal data, the licence and the assistant's models.
export type StudioSource = {
  data: DashboardApiData;
  licenseKey?: string;
  /** OpenAI models the assistant may use; omitted when no key is configured, which hides the assistant. */
  aiModels?: string[];
};

export function PayPalStudio({
  data,
  licenseKey,
  aiModels,
  initialState,
  mode,
  onApiReady,
  onReady,
  onStateChange,
}: StudioSource & {
  initialState: AgReportState;
  mode: AgStudioMode;
  onApiReady: (api: AgStudioApi) => void;
  onReady: (state: AgReportState) => void;
  onStateChange: (state: AgReportState, history: StudioHistory) => void;
}) {
  const studioData = useMemo(() => buildStudioData(data), [data]);
  const [startingState] = useState(initialState);
  // `ai` is read once, when Studio is created.
  const ai = useMemo(
    () => (aiModels?.length ? buildAi(aiModels) : undefined),
    [aiModels],
  );

  return (
    <AgStudioProvider
      licenseKey={licenseKey}
      modules={ai ? [AgStudioAiModule] : undefined}
    >
      <AgStudio
        style={{ height: '100%', width: '100%' }}
        theme={paypalStudioTheme}
        layout={{ widgetBorderEnabled: true }}
        data={studioData}
        ai={ai}
        initialState={startingState}
        mode={mode}
        onApiReady={(event) => onApiReady(event.api)}
        onStudioReady={(event) => {
          const state = event.api.getState();
          console.log('[AG Studio] initial state', state);
          onReady(state);
        }}
        onStateUpdated={(event) => {
          console.log('[AG Studio] state updated', event.state);
          const { undo, redo } = event.api.getHistory();
          onStateChange(event.state, {
            canUndo: undo.length > 0,
            canRedo: redo.length > 0,
          });
        }}
      />
    </AgStudioProvider>
  );
}
