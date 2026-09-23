import { connection } from "next/server";
import { PayPalError } from "@/lib/paypal";
import JsonGrid from "./json-grid";

type Props = {
  title: string;
  /** The PayPal endpoints the rows come from, shown under the title. */
  endpoints: string[];
  load: () => Promise<object[]>;
};

// Renders one PayPal data source as a table whose columns mirror the JSON shape.
export default async function DataSource({ title, endpoints, load }: Props) {
  // PayPal data is live; render per request instead of at build time.
  await connection();

  let rows: object[] | undefined;
  let error: PayPalError | undefined;
  try {
    rows = await load();
  } catch (err) {
    if (!(err instanceof PayPalError)) throw err;
    error = err;
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-8 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-zinc-600">
          {rows ? `${rows.length} records from ` : "Source: "}
          {endpoints.map((endpoint, i) => (
            <span key={endpoint}>
              {i > 0 && " → "}
              <code className="font-mono text-xs">{endpoint}</code>
            </span>
          ))}
          . Column groups follow the JSON nesting; hover a header for its full path.
        </p>
      </header>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-medium">{error.message}</p>
          {error.status === 403 && (
            <p className="mt-1">
              The sandbox REST app lacks the permission for this API. Enable it under the app&apos;s
              features in the PayPal developer dashboard, then run{" "}
              <code className="font-mono">npm run paypal:refresh-token</code>: PayPal keeps handing
              out the already-issued token (without the new permission) until it expires.
            </p>
          )}
        </div>
      )}
      {rows && <JsonGrid rows={rows} />}
    </main>
  );
}
