'use client';

import { useSyncExternalStore, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { EditIcon, EyeIcon, RedoIcon, RefreshIcon, UndoIcon } from './icons';
import { Button, IconButton } from './ui';

// The bar above Studio: which report and page you're on, how fresh the data is, and the
// Customise / Save / Discard controls.
export function ReportHeader({
  reportName,
  pageTitle,
  asOf,
  editing,
  pageIsEmpty,
  dirty,
  saved,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onDiscard,
  onEditingChange,
}: {
  reportName: string;
  pageTitle?: string;
  asOf: string;
  editing: boolean;
  pageIsEmpty: boolean;
  dirty: boolean;
  /** Studio is ready and its state matches the saved report. */
  saved: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onEditingChange: (editing: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-3 border-b border-pp-border bg-white px-8 py-5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-pp-muted">{reportName}</p>
        <h1 className="truncate text-[28px] font-semibold leading-tight text-pp-navy">{pageTitle}</h1>
        <DataFreshness asOf={asOf} />
      </div>
      <div className="flex items-center gap-2">
        {editing && pageIsEmpty && (
          <p className="mr-2 text-sm text-pp-muted">
            Drag a widget from <span className="font-semibold text-pp-navy">Compose</span> to get started.
          </p>
        )}
        {editing && (
          <>
            <IconButton label="Undo" disabled={!canUndo} onClick={onUndo}>
              <UndoIcon />
            </IconButton>
            <IconButton label="Redo" disabled={!canRedo} onClick={onRedo}>
              <RedoIcon />
            </IconButton>
            <span className="mx-2 h-6 w-px bg-pp-border" aria-hidden />
          </>
        )}
        <span className={`mr-2 text-sm ${dirty ? 'text-pp-warning' : 'text-pp-muted'}`} role="status">
          {dirty ? 'Unsaved changes' : saved ? 'All changes saved' : ''}
        </span>
        {dirty && (
          <Button onClick={onDiscard} size="sm">
            Discard
          </Button>
        )}
        {(editing || dirty) && (
          <Button variant="primary" size="sm" disabled={!dirty} onClick={onSave}>
            Save
          </Button>
        )}
        {editing ? (
          <Button variant="ghost" size="sm" onClick={() => onEditingChange(false)}>
            <EyeIcon className="size-4" /> Preview
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => onEditingChange(true)}>
            <EditIcon className="size-4" /> Customise
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Data freshness -----------------------------------------------------------------

const MINUTE_MS = 60_000;
let now = 0;
const subscribeNow = (listener: () => void) => {
  now = Date.now();
  const id = setInterval(() => {
    now = Date.now();
    listener();
  }, 30_000);
  return () => clearInterval(id);
};

function relativeTime(iso: string, at: number) {
  const minutes = Math.floor((at - Date.parse(iso)) / MINUTE_MS);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} h ago` : new Date(iso).toLocaleDateString('en-GB');
}

function DataFreshness({ asOf }: { asOf: string }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const at = useSyncExternalStore(subscribeNow, () => now, () => 0);

  return (
    <p className="mt-1 flex items-center gap-2 text-sm text-pp-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-pp-success" aria-hidden />
        PayPal sandbox
      </span>
      <span aria-hidden>·</span>
      <span title={new Date(asOf).toLocaleString('en-GB')}>
        {refreshing ? 'Refreshing…' : `Updated ${at ? relativeTime(asOf, at) : new Date(asOf).toLocaleTimeString('en-GB')}`}
      </span>
      <button
        type="button"
        onClick={() => startRefresh(() => router.refresh())}
        disabled={refreshing}
        aria-label="Refresh data"
        title="Refresh data"
        className="inline-flex size-7 items-center justify-center rounded-full text-pp-blue hover:bg-pp-highlight disabled:text-pp-muted"
      >
        <RefreshIcon className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
      </button>
    </p>
  );
}
