// Shown while an endpoint page waits for PayPal (list calls, then one detail call per record).
export default function Loading() {
  return (
    <main className="flex h-dvh items-center justify-center bg-pp-canvas font-paypal text-pp-muted" role="status">
      Loading PayPal data…
    </main>
  );
}
