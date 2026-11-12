'use client';

import React, { useState } from 'react';
import { MainNav } from '@/app/components/main-nav';
import { VideoPlaylistPlayer } from '@/app/components/media';
import { MediaDiagnosticsDrawer } from '@/components/media/media-diagnostics-drawer';
import type { NormalizedMediaMetadata } from '@/lib/noembed-service';
import {
  ShieldCheck,
  Layers,
  Terminal,
  ExternalLink,
  Code2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function WalkthroughPage() {
  const [currentUrl, setCurrentUrl] = useState<string>(
    'https://www.youtube.com/watch?v=685tzja9ey4&list=PLT2es12MHToI&pp=sAgC'
  );
  const [metadata, setMetadata] = useState<NormalizedMediaMetadata | null>(null);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      <MainNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800">
                Staff Architecture Blueprint
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-zinc-900 text-emerald-400 border border-zinc-800">
                Privacy-Enhanced Embed
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800">
                Noembed oEmbed Resolution
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Pactra : AI-Powered Payment Governance
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Official PayPal AI Hackathon 2026 Video &amp; Playlist Media Subsystem incorporating
              Noembed oEmbed metadata resolution, YouTube Privacy-Enhanced Mode (
              <code>youtube-nocookie.com</code>), and graceful restriction fallback boundaries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-xs font-bold text-zinc-950 shadow-md transition-colors"
            >
              <span>Command Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              <span>Source URL</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Video Player Display Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <VideoPlaylistPlayer
              url={currentUrl}
              showControls={true}
              onMetadataLoaded={(m) => setMetadata(m as NormalizedMediaMetadata)}
              className="border-slate-800 shadow-2xl"
            />

            {/* Architecture Overview */}
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Layers className="w-5 h-5 text-blue-400" />
                <h2>Reverse-Engineered 3-Tier Pipeline</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="font-mono font-bold text-blue-400">Tier 01: URL Decomposition</div>
                  <p className="text-slate-400 leading-relaxed">
                    Splits watch queries into video ID (<code>v=685tzja9ey4</code>), playlist ID (
                    <code>list=PLT2es12MHToI</code>), and query context (<code>pp=sAgC</code>).
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="font-mono font-bold text-indigo-400">Tier 02: Noembed Resolution</div>
                  <p className="text-slate-400 leading-relaxed">
                    Asynchronously fetches canonical metadata strictly over HTTPS from{' '}
                    <code>noembed.com/embed</code> to avoid Chrome mixed content blocks.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="font-mono font-bold text-emerald-400">Tier 03: Privacy Embed</div>
                  <p className="text-slate-400 leading-relaxed">
                    Constructs sandboxed iframe pointing to <code>youtube-nocookie.com</code> with
                    timestamp seek, captions, and fallback safeguards.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Diagnostics & Blueprint Inspector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <span>Interactive Diagnostics &amp; oEmbed Inspector</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">Live Parameter Tester</span>
              </div>

              <MediaDiagnosticsDrawer
                currentUrl={currentUrl}
                onUrlChange={setCurrentUrl}
                metadata={metadata}
              />
            </div>
          </div>

          {/* Sidebar Specs & Diagnostics */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3>Compliance &amp; Best Practices</h3>
              </div>

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Privacy Mode:</strong> Prevents third-party cookie tracking prior to user
                    playback via <code>youtube-nocookie.com</code>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Autoplay Policy:</strong> Autoplayed embedded videos do not artificially
                    increment YouTube view counts.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Child-Directed Sites:</strong> Self-designation via Google developer
                    tools is mandatory if serving children under COPPA.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Firewall Allowlist:</strong> Enterprise corporate networks must allowlist{' '}
                    <code>youtube.com</code>, <code>youtube-nocookie.com</code>, and{' '}
                    <code>noembed.com</code>.
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3>PayPal Hackathon Alignment</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                This media module powers the video submission and demonstration of{' '}
                <strong>Pactra / VeriSettle AI</strong> for the PayPal AI Hackathon 2026, showcasing
                autonomous milestone escrow holds, multimodal invoice matching, and deterministic policy defense.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                >
                  <span>Launch Live Escrow Command Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                <Code2 className="w-4 h-4 text-blue-400" />
                <h3>Code Integration Contract</h3>
              </div>

              <div className="space-y-2 text-xs font-mono text-slate-400">
                <p className="text-[11px] text-slate-300 font-sans">
                  Easily embed in any React/Next.js page:
                </p>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] overflow-x-auto text-blue-300">
{`<VideoPlaylistPlayer
  url="https://youtube.com/..."
  startTimeSeconds={30}
  captionLanguage="en"
  showControls={true}
/>`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
