'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// Shown when the PayPal API can't be reached, or rejects the request, while loading an endpoint page.
export default function EndpointError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex h-dvh flex-col bg-pp-canvas px-8 py-6 font-paypal text-pp-ink">
      <Link href="/" className="text-sm font-semibold text-pp-blue hover:underline">
        ← All pages
      </Link>
      <h1 className="mt-3 text-[28px] font-semibold text-pp-navy">We couldn&apos;t load this PayPal data</h1>
      <p className="mt-2 text-sm text-pp-muted">
        Check the API credentials in <code>.env.local</code>, and that the sandbox app has the features this endpoint needs.
      </p>
      <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-pp-border bg-white p-4 font-mono text-xs text-pp-muted">
        {error.message}
      </pre>
      <button
        type="button"
        onClick={retry}
        className="mt-4 h-10 self-start rounded-full bg-pp-blue px-5 font-semibold text-white hover:bg-pp-blue-dark"
      >
        Try again
      </button>
    </main>
  );
}
