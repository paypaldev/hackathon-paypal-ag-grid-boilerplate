'use client';

import React, { useState } from 'react';
import {
  Layers,
  ShieldCheck,
  Globe,
  Terminal,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { parseYouTubeUrl, type ParsedYouTubeUrl } from '@/lib/youtube-parser';
import type { NormalizedMediaMetadata } from '@/lib/noembed-service';

interface MediaDiagnosticsDrawerProps {
  currentUrl: string;
  onUrlChange: (newUrl: string) => void;
  metadata: NormalizedMediaMetadata | null;
  onRefreshMetadata?: () => void;
}

export function MediaDiagnosticsDrawer({
  currentUrl,
  onUrlChange,
  metadata,
  onRefreshMetadata,
}: MediaDiagnosticsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'tier1' | 'tier2' | 'tier3' | 'blueprint'>('tier1');
  const [copied, setCopied] = useState<string | null>(null);

  const parsed: ParsedYouTubeUrl = parseYouTubeUrl(currentUrl);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const presets = [
    {
      label: 'Target Video (Pactra 2026)',
      url: 'https://www.youtube.com/watch?v=685tzja9ey4',
      badge: 'Video Target',
    },
    {
      label: 'Target Combined URL',
      url: 'https://www.youtube.com/watch?v=685tzja9ey4&list=PLT2es12MHToI&pp=sAgC',
      badge: 'Full Blueprint Target',
    },
    {
      label: 'Target Playlist Only',
      url: 'https://www.youtube.com/playlist?list=PLT2es12MHToI',
      badge: 'Playlist Container',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-slate-200">
      {/* Tab Navigation */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('tier1')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'tier1'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Tier 01: URL Diagnostics</span>
          </button>
          <button
            onClick={() => setActiveTab('tier2')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'tier2'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Tier 02: Noembed oEmbed JSON</span>
          </button>
          <button
            onClick={() => setActiveTab('tier3')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'tier3'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Tier 03: Compliance &amp; Specs</span>
          </button>
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'blueprint'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Two-Layer Blueprint</span>
          </button>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">Presets:</span>
          {presets.map((preset) => (
            <button
              key={preset.url}
              onClick={() => onUrlChange(preset.url)}
              className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
                currentUrl === preset.url
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 font-semibold'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800'
              }`}
            >
              {preset.badge}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Tier 01 URL Diagnostics & Parameter Parser */}
      {activeTab === 'tier1' && (
        <div className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Live Target YouTube URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="Paste YouTube watch or playlist URL..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => onUrlChange('https://www.youtube.com/watch?v=685tzja9ey4&list=PLT2es12MHToI&pp=sAgC')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-mono text-xs transition-colors"
              >
                Reset Default
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 mb-1">Video Identifier (v=)</div>
              <div className="text-sm font-bold font-mono text-blue-400">
                {parsed.videoId ? parsed.videoId : <span className="text-slate-500 italic">None</span>}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {parsed.videoId ? 'Valid YouTube 11-char ID' : 'Direct playlist container'}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 mb-1">Playlist Identifier (list=)</div>
              <div className="text-sm font-bold font-mono text-purple-400">
                {parsed.playlistId ? parsed.playlistId : <span className="text-slate-500 italic">None</span>}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {parsed.playlistId ? 'Queues parent series container' : 'Standalone video playback'}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 mb-1">Playback Context (pp=)</div>
              <div className="text-sm font-bold font-mono text-emerald-400">
                {parsed.playbackContextParam ? parsed.playbackContextParam : <span className="text-slate-500 italic">None</span>}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Standard YouTube playlist routing context
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Direct Headless Scraping Constraint Diagnostic</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Direct automated retrieval of <code className="text-blue-400 font-mono">youtube.com/watch</code> endpoints blocks headless bots with HTTP 429/403 or blank JS hydration shells. As documented in the Blueprint, client applications must never parse raw YouTube HTML directly; they must resolve metadata through the normalized <strong>Noembed oEmbed protocol</strong> and playback through <strong>YouTube Privacy-Enhanced Embeds</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Tier 02 Noembed oEmbed JSON Schema */}
      {activeTab === 'tier2' && (
        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-sm">Normalized oEmbed Metadata Contract</div>
              <div className="text-slate-400 text-xs">
                Querying <code className="text-purple-400 font-mono">https://noembed.com/embed?url=...</code> strictly over HTTPS
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onRefreshMetadata && (
                <button
                  onClick={onRefreshMetadata}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Re-fetch</span>
                </button>
              )}
              <button
                onClick={() => copyToClipboard(JSON.stringify(metadata, null, 2), 'metadata')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] transition-colors"
              >
                {copied === 'metadata' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied === 'metadata' ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 font-mono text-[11px]">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block">title (guaranteed)</span>
              <span className="text-blue-300 truncate block font-sans font-medium">{metadata?.title || 'Loading...'}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block">provider_name</span>
              <span className="text-purple-300 block">{metadata?.providerName || 'YouTube'}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block">author_name</span>
              <span className="text-emerald-300 block">{metadata?.authorName || 'Wild Factz'}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block">source</span>
              <span className="text-amber-300 block">{metadata?.fromCache ? 'In-Memory Cache' : 'Live oEmbed'}</span>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-[11px] overflow-x-auto text-slate-300 max-h-64">
            <pre>{JSON.stringify(metadata, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Tab 3: Tier 03 YouTube Embed Compliance & Specs */}
      {activeTab === 'tier3' && (
        <div className="p-5 space-y-4 text-xs">
          <div className="font-bold text-white text-sm">
            YouTube Embed Parameter &amp; Compliance Specification
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Parameter / Blueprint Requirement</th>
                  <th className="p-3">Implementation Specification</th>
                  <th className="p-3">Operational &amp; Compliance Nuances</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-emerald-400">Privacy-Enhanced Mode</td>
                  <td className="p-3 font-mono text-[11px] text-blue-300">https://www.youtube-nocookie.com/embed/...</td>
                  <td className="p-3 text-slate-400">Stores no viewing cookies until the user clicks play. Network admins must allowlist this domain.</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-white">Custom Start Timestamp</td>
                  <td className="p-3 font-mono text-[11px] text-blue-300">?start=&lt;seconds&gt;</td>
                  <td className="p-3 text-slate-400">Specified in integer seconds (e.g. 90 begins video playback at 1m30s).</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-white">Automated Captions</td>
                  <td className="p-3 font-mono text-[11px] text-blue-300">&amp;cc_lang_pref=en&amp;cc_load_policy=1</td>
                  <td className="p-3 text-slate-400">Turns captions on by default and locks caption language to the specified ISO 639-1 code.</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-purple-400">Autoplay Behavior</td>
                  <td className="p-3 font-mono text-[11px] text-blue-300">&amp;autoplay=1&amp;mute=1</td>
                  <td className="p-3 text-slate-400">Embedded autoplayed videos do <strong>not</strong> increment YouTube views. Must be muted to autoplay in modern browsers.</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-amber-400">Child-Directed Site Compliance</td>
                  <td className="p-3 font-mono text-[11px] text-blue-300">Self-designate via Google API Console</td>
                  <td className="p-3 text-slate-400">Mandatory under YouTube API Terms of Service; disables personalized ads and turns off certain tracking features.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Two-Layer Architecture Blueprint Flow */}
      {activeTab === 'blueprint' && (
        <div className="p-5 space-y-4 text-xs">
          <div className="font-bold text-white text-sm">Two-Layer Architecture for Video and Playlist UI Integration</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-red-500/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono text-[10px] font-bold">TIER 01</span>
                <span className="font-semibold text-white">URL Parsing &amp; Diagnostics</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Accepts user input URL, extracts <code className="text-blue-400 font-mono">v</code>, <code className="text-purple-400 font-mono">list</code>, and <code className="text-emerald-400 font-mono">pp</code> query parameters, and validates format before passing to upstream layers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-[10px] font-bold">TIER 02</span>
                <span className="font-semibold text-white">Noembed Metadata Service</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Queries Noembed strictly over HTTPS, enforces guaranteed schema (<code className="text-slate-300 font-mono">title</code>, <code className="text-slate-300 font-mono">provider_name</code>, <code className="text-slate-300 font-mono">html</code>, <code className="text-slate-300 font-mono">url</code>), and provides in-memory cache.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">TIER 03</span>
                <span className="font-semibold text-white">Privacy-Enhanced Player</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Renders responsive 16:9 iframe targeting <code className="text-emerald-400 font-mono">youtube-nocookie.com</code> with caption and timestamp controls, with an automatic Fallback Boundary Card when blocked.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
