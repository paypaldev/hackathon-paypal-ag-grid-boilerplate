import Link from "next/link";
import { PAGES } from "./sources";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-8 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">PayPal Sandbox Data</h1>
        <p className="text-sm text-zinc-600">
          The dashboard analyses the data in AG Studio; the other pages read one PayPal API each and
          render its raw records in AG Grid. Seed with{" "}
          <code className="font-mono">npm run seed</code>.
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {PAGES.map(({ href, label, summary }) => (
          <li key={href}>
            <Link
              href={href}
              className="block rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400"
            >
              <p className="font-medium">{label}</p>
              <p className="text-sm text-zinc-600">{summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
