import Link from 'next/link';

const dashboard = { href: '/dashboard', label: 'Dashboard', detail: 'AG Studio reports over all of the data below' };

// One page per PayPal endpoint the demo calls, each in app/(endpoints).
const endpoints = [
  { href: '/products', label: 'Catalog products', detail: 'GET /v1/catalogs/products' },
  { href: '/plans', label: 'Billing plans', detail: 'GET /v1/billing/plans' },
  { href: '/invoices', label: 'Invoices', detail: 'GET /v2/invoicing/invoices' },
  { href: '/transactions', label: 'Transactions', detail: 'GET /v1/reporting/transactions' },
  { href: '/balances', label: 'Balances', detail: 'GET /v1/reporting/balances' },
];

function PageLink({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <li>
      <Link href={href} className="flex items-baseline justify-between gap-4 py-3 hover:text-pp-blue">
        <span className="font-semibold">{label} →</span>
        <code className="text-sm text-pp-muted">{detail}</code>
      </Link>
    </li>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl p-16 font-paypal text-pp-ink">
      <h1 className="text-[28px] font-semibold text-pp-navy">PayPal REST APIs with AG Grid &amp; AG Studio</h1>
      <ul className="mt-6 divide-y divide-pp-border border-y border-pp-border">
        <PageLink {...dashboard} />
      </ul>
      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-pp-muted">Endpoints</h2>
      <ul className="mt-2 divide-y divide-pp-border border-y border-pp-border">
        {endpoints.map((page) => (
          <PageLink key={page.href} {...page} />
        ))}
      </ul>
    </main>
  );
}
