import Link from 'next/link';
import type { ColDef } from 'ag-grid-community';
import { DataGrid, type Row } from './data-grid';

// The frame shared by the endpoint pages: which PayPal calls produced the data, which function in
// lib/paypal.ts makes them, and the rows in an AG Grid.
export function EndpointPage({
  title,
  calls,
  source,
  note,
  rows,
  columns,
}: {
  title: string;
  /** The REST calls behind the page, e.g. 'GET /v1/catalogs/products'. */
  calls: string[];
  /** The lib/paypal.ts function the page calls. */
  source: string;
  note?: string;
  rows: Row[];
  columns: ColDef<Row>[];
}) {
  return (
    <main className="flex h-dvh flex-col bg-[#09090b] px-6 sm:px-8 py-6 font-paypal text-zinc-100">
      <div className="flex items-center gap-4 text-xs font-semibold">
        <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
          ← All workspaces
        </Link>
        <span className="text-zinc-600">·</span>
        <Link href="/dashboard" className="text-zinc-300 hover:text-white transition-colors">
          Command Center →
        </Link>
      </div>
      <h1 className="mt-3 text-2xl sm:text-[28px] font-bold text-white tracking-tight">{title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
        {calls.map((call) => (
          <code key={call} className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-zinc-200 font-mono">
            {call}
          </code>
        ))}
        <span>
          via <code className="text-zinc-200 font-mono">{source}</code> · {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </span>
      </div>
      {note && <p className="mt-2 max-w-4xl text-xs text-zinc-400 leading-relaxed">{note}</p>}
      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <DataGrid rows={rows} columns={columns} />
      </div>
    </main>
  );
}
