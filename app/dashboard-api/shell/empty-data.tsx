import { InboxIcon } from './icons';

// Shown in place of Studio when the sandbox account has nothing to report on.
export function EmptyData() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-pp-highlight text-pp-blue">
        <InboxIcon className="size-7" />
      </span>
      <h2 className="mt-4 text-xl font-semibold text-pp-navy">No PayPal data yet</h2>
      <p className="mt-2 max-w-md text-[15px] text-pp-muted">
        This sandbox account has no invoices, products, plans or transactions. Create some in the PayPal sandbox, then
        refresh to build reports from them.
      </p>
      <a
        href="https://developer.paypal.com/dashboard/"
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex h-10 items-center rounded-full bg-pp-blue px-5 font-semibold text-white hover:bg-pp-blue-dark"
      >
        Open PayPal Developer Dashboard
      </a>
    </div>
  );
}
