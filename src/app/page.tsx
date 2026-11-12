import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  Users,
  Package,
  Sparkles,
  Activity,
  Video,
  Lock,
  Zap,
} from 'lucide-react';
import { MainNav } from '@/app/components/main-nav';
import { StealthRadar } from '@/components/stealth-radar';
import { ObsidianSettlementPipeline } from '@/components/stealth-pipeline';
import { StealthCyberTerminal } from '@/components/stealth-terminal';

const endpoints = [
  { href: '/products', label: 'Catalog Products & Inventory Admin', detail: 'GET /v1/catalogs/products' },
  { href: '/plans', label: 'Billing Plans', detail: 'GET /v1/billing/plans' },
  { href: '/invoices', label: 'B2B Invoices', detail: 'GET /v2/invoicing/invoices' },
  { href: '/transactions', label: 'Transaction Search', detail: 'GET /v1/reporting/transactions' },
  { href: '/balances', label: 'Account Balances', detail: 'GET /v1/reporting/balances' },
];

const coreWorkspaces = [
  {
    href: '/dashboard',
    title: 'Autonomous Command Center',
    desc: 'Escrow authorizations, 3-way match engine, AG Grid relational ledger & Bryntum milestone Gantt.',
    icon: ShieldCheck,
    badge: '1st Place Track ($17k)',
    accent: 'border-zinc-700 bg-zinc-900/80 text-zinc-100',
  },
  {
    href: '/users',
    title: 'Users & Counterparties Admin',
    desc: 'Profile pages, 6-month spend charts, GNN/LSTM collusion risk scores & CRUD modal management.',
    icon: Users,
    badge: 'React Admin Suite',
    accent: 'border-zinc-700 bg-zinc-900/80 text-zinc-100',
  },
  {
    href: '/products',
    title: 'Products Catalog & Radar',
    desc: 'Channel3 market norm pricing, anomaly Z-scores, Holt-Winters inventory cover & product specs.',
    icon: Package,
    badge: 'Catalog Admin',
    accent: 'border-zinc-700 bg-zinc-900/80 text-zinc-100',
  },
  {
    href: '/ai-sandbox',
    title: 'AI Multi-Modal Sandbox & Langfuse',
    desc: 'Streaming Q&A, LiveKit voice agent, image generation, sentiment analyzer & Rock-Paper-Scissors.',
    icon: Sparkles,
    badge: 'Langfuse Multi-Modal',
    accent: 'border-zinc-700 bg-zinc-900/80 text-zinc-100',
  },
  {
    href: '/walkthrough',
    title: 'Video & Blueprint Walkthrough',
    desc: 'Reverse-engineered YouTube player with Noembed oEmbed sync, Privacy Mode & restriction fallbacks.',
    icon: Video,
    badge: 'Media Subsystem',
    accent: 'border-zinc-700 bg-zinc-900/80 text-zinc-100',
  },
  {
    href: '/availability',
    title: 'System Health & Availability Hub',
    desc: 'Live telemetry, latency gauges, OAuth token caching metrics, and circuit-breaker diagnostics.',
    icon: Activity,
    badge: 'Health Radar',
    accent: 'border-zinc-700 bg-zinc-900/80 text-zinc-100',
  },
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white flex flex-col">
      <MainNav />

      <main className="flex-1 p-4 sm:p-6 md:p-10 max-w-6xl mx-auto w-full space-y-12">
        {/* Hero Header */}
        <section className="space-y-6 pt-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700/80 text-zinc-300 text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>PayPal AI Hackathon 2026 Submission</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-full">
              <Lock className="w-3 h-3 text-zinc-400" />
              <span>FIPS 180-4 SHA-256 Validated</span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white">
              VeriSettle <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-600">OS</span>
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 max-w-3xl leading-relaxed">
              Autonomous B2B Escrow, Multimodal 3-Way Invoice Reconciliation, Enterprise Admin Command Center &amp; Langfuse AI Observability Hub.
            </p>
          </div>

          <div className="p-4 bg-[#121215] border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 flex items-center justify-between gap-4">
            <div>
              <strong className="text-white">Core Architectural Law:</strong> &ldquo;AI/ML Proposes, Deterministic Policy Disposes, PayPal Executes.&rdquo;
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Zero-Hallucination Firewall</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm px-6 py-3 rounded-xl shadow-lg hover:shadow-zinc-700/20 transition-all cursor-pointer group"
            >
              <span>Launch Enterprise Command Center</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/ai-sandbox"
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-zinc-200 font-semibold text-sm px-5 py-3 rounded-xl transition-all"
            >
              <span>Explore AI Multi-Modal Sandbox</span>
              <Sparkles className="w-4 h-4 text-zinc-400" />
            </Link>
          </div>
        </section>

        {/* Feature 1: Live Stealth Escrow Radar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
              Live Escrow Telemetry &amp; Anomaly Detection Radar
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">REAL-TIME SANDBOX FREQUENCY</span>
          </div>
          <StealthRadar />
        </section>

        {/* Feature 2: Interactive 3-Way Match Settlement Pipeline */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
              Deterministic 3-Way Match Architecture
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">TWO-PHASE SETTLEMENT</span>
          </div>
          <ObsidianSettlementPipeline />
        </section>

        {/* Feature 3: Enterprise Workspaces Grid */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
            Enterprise Application Workspaces
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreWorkspaces.map((ws) => {
              const Icon = ws.icon;
              return (
                <Link
                  key={ws.href}
                  href={ws.href}
                  className="p-5 rounded-2xl bg-[#121215] border border-zinc-800 hover:border-zinc-600 flex flex-col justify-between space-y-4 transition-all hover:-translate-y-0.5 group shadow-lg"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl border ${ws.accent}`}>
                        <Icon className="w-5 h-5 text-zinc-200" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                        {ws.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-zinc-200 transition-colors">
                      {ws.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">{ws.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold pt-2 border-t border-zinc-850">
                    <span>Open workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-zinc-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Feature 4: Stealth Audit Terminal */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
              Live REST &amp; Cosmos.AI MCP Audit Stream
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">IDEMPOTENCY &amp; FIPS HASHES</span>
          </div>
          <StealthCyberTerminal />
        </section>

        {/* Multi-Sponsor Prize Integrations */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
            Multi-Sponsor Prize Integrations ($17,000 Stack Alignment)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {sponsorBadges.map((s) => (
              <div key={s.name} className="p-3.5 bg-[#121215] border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                <div className="font-bold text-white mb-0.5">{s.name}</div>
                <div className="text-zinc-400 text-[11px]">{s.role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Live PayPal Developer Platform Endpoints */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
            Live PayPal Developer Platform Endpoints
          </h2>
          <div className="divide-y divide-zinc-850 border border-zinc-800 rounded-xl bg-[#121215] overflow-hidden text-xs">
            {endpoints.map((ep) => (
              <Link
                key={ep.href}
                href={ep.href}
                className="flex items-center justify-between p-3.5 hover:bg-zinc-850/60 transition-colors group"
              >
                <span className="font-medium text-zinc-200 flex items-center gap-2 group-hover:text-white">
                  <span>{ep.label}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
                </span>
                <code className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  {ep.detail}
                </code>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-zinc-850 py-6 text-center text-xs font-mono text-zinc-500 bg-[#09090b]">
        VeriSettle AI · PayPal AI Hackathon 2026 · Autonomous B2B Escrow &amp; Dispute Defense OS
      </footer>
    </div>
  );
}
