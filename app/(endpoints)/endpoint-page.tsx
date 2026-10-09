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
    <main className="flex h-dvh flex-col bg-pp-canvas px-8 py-6 font-paypal text-pp-ink">
      <Link href="/" className="text-sm font-semibold text-pp-blue hover:underline">
        ← All pages
      </Link>
      <h1 className="mt-3 text-[28px] font-semibold text-pp-navy">{title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-pp-muted">
        {calls.map((call) => (
          <code key={call} className="rounded bg-pp-highlight px-2 py-0.5 text-pp-navy">
            {call}
          </code>
        ))}
        <span>
          via <code className="text-pp-navy">{source}</code> · {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </span>
      </div>
      {note && <p className="mt-2 max-w-4xl text-sm text-pp-muted">{note}</p>}
      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <DataGrid rows={rows} columns={columns} />
      </div>
    </main>
  );
}
