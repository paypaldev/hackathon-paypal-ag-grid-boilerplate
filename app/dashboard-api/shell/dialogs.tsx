'use client';

import type { SavedReport } from './reports-store';
import { Button, Dialog } from './ui';

// The shell's confirmation dialogs. Each takes its own open flag and callbacks, so the
// dashboard decides when they show and what happens next.

export function UnsavedChangesDialog({
  open,
  reportName,
  onCancel,
  onDiscard,
  onSave,
}: {
  open: boolean;
  reportName: string;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <Dialog
      open={open}
      title={`Save changes to “${reportName}”?`}
      onClose={onCancel}
      actions={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onDiscard}>Discard changes</Button>
          <Button variant="primary" onClick={onSave}>
            Save
          </Button>
        </>
      }
    >
      Your changes to this report haven&apos;t been saved yet.
    </Dialog>
  );
}

export function CreateReportDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}) {
  const formId = 'create-report';
  return (
    <Dialog
      open={open}
      title="New report"
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={formId}>
            Create report
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault();
          const name = String(new FormData(e.currentTarget).get('name') ?? '').trim();
          onCreate(name || 'Untitled report');
        }}
      >
        <p>Start from a blank page and build it with the widgets in Compose.</p>
        <label className="mt-4 block text-sm font-semibold text-pp-navy" htmlFor="report-name">
          Report name
        </label>
        <input
          id="report-name"
          name="name"
          autoFocus
          defaultValue="Untitled report"
          onFocus={(e) => e.currentTarget.select()}
          className="mt-1 h-11 w-full rounded border border-pp-border px-3 text-[15px] text-pp-ink outline-none focus:border-pp-blue focus:ring-2 focus:ring-pp-highlight"
        />
      </form>
    </Dialog>
  );
}

/** Deletes a report, or resets the built-in one to the version shipped with the app. */
export function DeleteReportDialog({
  report,
  onCancel,
  onConfirm,
}: {
  report: SavedReport | null;
  onCancel: () => void;
  onConfirm: (report: SavedReport) => void;
}) {
  return (
    <Dialog
      open={report !== null}
      title={report?.builtIn ? 'Reset to default?' : 'Delete report?'}
      onClose={onCancel}
      actions={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => report && onConfirm(report)}>
            {report?.builtIn ? 'Reset' : 'Delete'}
          </Button>
        </>
      }
    >
      {report &&
        (report.builtIn
          ? `“${report.name}” will go back to the report shipped with the app. Your saved changes to it will be lost.`
          : `“${report.name}” will be removed from this browser. This can't be undone.`)}
    </Dialog>
  );
}

export function ResetDemoDialog({
  open,
  builtInName,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  builtInName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      title="Reset the demo?"
      onClose={onCancel}
      actions={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Reset demo
          </Button>
        </>
      }
    >
      All reports you&apos;ve created will be deleted and “{builtInName}” will go back to its original state,
      including any unsaved changes. This can&apos;t be undone.
    </Dialog>
  );
}
