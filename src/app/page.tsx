import Link from 'next/link';
import { ShieldCheck, ArrowRight, Database, Layers, ExternalLink, Cpu, CheckCircle2 } from 'lucide-react';

const endpoints = [
  { href: '/products', label: 'Catalog Products', detail: 'GET /v1/catalogs/products' },
  { href: '/plans', label: 'Billing Plans', detail: 'GET /v1/billing/plans' },
  { href: '/invoices', label: 'B2B Invoices', detail: 'GET /v2/invoicing/invoices' },
  { href: '/transactions', label: 'Transaction Search', detail: 'GET /v1/reporting/transactions' },
  { href: '/balances', label: 'Account Balances', detail: 'GET /v1/reporting/balances' },
];

const sponsorBadges = [
  { name: 'AG Grid / AG Studio', role: '10-Table Relational Schema & Custom Money Formats' },
  { name: 'APIMatic', role: 'Server SDK Context Plugin & TypeScript SDK 2.5.0' },
  { name: 'Bryntum', role: 'Finish-to-Start (FS) Escrow Gantt & 30-Day Liquidity Forecast' },
  { name: 'Channel3', role: 'Multi-Merchant B2B Catalog Discovery & Price Norm Z-Scores' },
  { name: 'Render', role: 'Multi-Service Cloud Spec (render.yaml Next.js + FastAPI)' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Hero Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PayPal AI Hackathon 2026 Submission</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            VeriSettle AI
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
            Autonomous B2B Escrow, Multimodal 3-Way Invoice Reconciliation &amp; Dispute Defense Operating System.
          </p>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-blue-300">
            <strong>Core Architectural Law:</strong> "AI/ML Proposes, Deterministic Policy Disposes, PayPal Executes."
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-lg hover:shadow-blue-600/25 transition-all"
            >
              <span>Launch Enterprise Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Sponsor Tooling Grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Multi-Sponsor Prize Integrations ($17,000 Stack Alignment)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {sponsorBadges.map((s) => (
              <div key={s.name} className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="font-semibold text-white mb-0.5">{s.name}</div>
                <div className="text-slate-400 text-[11px]">{s.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PayPal Sandbox Endpoints */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Live PayPal Developer Platform Endpoints
          </h2>
          <div className="divide-y divide-slate-850 border border-slate-850 rounded-lg bg-slate-900/50 overflow-hidden text-xs">
            {endpoints.map((ep) => (
              <Link
                key={ep.href}
                href={ep.href}
                className="flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition-colors"
              >
                <span className="font-medium text-white flex items-center gap-2">
                  <span>{ep.label}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </span>
                <code className="text-[11px] font-mono text-blue-400">{ep.detail}</code>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
