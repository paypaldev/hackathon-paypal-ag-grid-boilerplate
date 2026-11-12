'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Subtitles,
  Clock,
  Globe,
  Radio,
} from 'lucide-react';
import { buildPrivacyEmbedUrl, parseYouTubeUrl } from '@/lib/youtube-parser';
import type { NormalizedMediaMetadata } from '@/lib/noembed-service';

export interface YouTubePlayerProps {
  /** Target YouTube URL or video ID (defaults to hackathon video 685tzja9ey4) */
  url?: string;
  /** Custom playlist ID if queuing a playlist (defaults to PLT2es12MHToI) */
  playlistId?: string;
  /** Playback context parameter (e.g. pp=sAgC) */
  playbackContextParam?: string;
  /** Custom start timestamp in seconds (?start=X) */
  startSeconds?: number;
  /** ISO 639-1 language code for captions (e.g. 'en', 'es', 'fr') */
  captionLanguage?: string;
  /** Whether to force captions to load automatically (&cc_load_policy=1) */
  forceCaptions?: boolean;
  /**
   * Whether to autoplay video.
   * NOTE: Autoplayed embedded videos do NOT increment YouTube video views.
   */
  autoplay?: boolean;
  /** Use privacy-enhanced domain https://www.youtube-nocookie.com */
  privacyEnhanced?: boolean;
  /** Whether to force showing fallback card (e.g. for testing embedding restrictions) */
  simulateRestriction?: boolean;
  /** Optional custom title override */
  titleOverride?: string;
  /** Callback when metadata is resolved */
  onMetadataLoaded?: (metadata: NormalizedMediaMetadata) => void;
  className?: string;
}

export function YouTubePlayer({
  url = 'https://www.youtube.com/watch?v=685tzja9ey4&list=PLT2es12MHToI&pp=sAgC',
  playlistId: defaultPlaylistId,
  playbackContextParam: defaultContextParam,
  startSeconds: initialStartSeconds = 0,
  captionLanguage: initialCaptionLang = 'en',
  forceCaptions: initialForceCaptions = true,
  autoplay: initialAutoplay = false,
  privacyEnhanced: initialPrivacyEnhanced = true,
  simulateRestriction = false,
  titleOverride,
  onMetadataLoaded,
  className = '',
}: YouTubePlayerProps) {
  // Player state & controls
  const [customUrl] = useState<string | null>(null);
  const currentUrl = customUrl ?? url;
  const [startSeconds, setStartSeconds] = useState<number>(initialStartSeconds);
  const [captionLang, setCaptionLang] = useState<string>(initialCaptionLang);
  const [forceCaptions, setForceCaptions] = useState<boolean>(initialForceCaptions);
  const [autoplay, setAutoplay] = useState<boolean>(initialAutoplay);
  const [privacyEnhanced, setPrivacyEnhanced] = useState<boolean>(initialPrivacyEnhanced);
  const [isRestricted, setIsRestricted] = useState<boolean>(simulateRestriction);

  // Metadata state
  const [metadata, setMetadata] = useState<NormalizedMediaMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState<boolean>(true);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [checklist, setChecklist] = useState({
    youtubeAllowlist: true,
    nocookieAllowlist: true,
    noembedAllowlist: true,
    studioEmbeddingAllowed: true,
    ageRestrictionCleared: true,
    childDirectedDesignation: true,
  });

  const parsed = parseYouTubeUrl(currentUrl);
  const activeVideoId = parsed.videoId || '685tzja9ey4';
  const activePlaylistId = parsed.playlistId || defaultPlaylistId || 'PLT2es12MHToI';
  const activeContextParam = parsed.playbackContextParam || defaultContextParam || 'sAgC';

  // Build embed URL based on reactive options
  const embedUrl = buildPrivacyEmbedUrl({
    videoId: activeVideoId,
    playlistId: activePlaylistId,
    startTime: startSeconds > 0 ? startSeconds : null,
    captionLang: forceCaptions ? captionLang : null,
    forceCaptions,
    autoplay,
    privacyEnhanced,
    enableJsApi: true,
    rel: 0,
    modestBranding: true,
  });

  const canonicalExternalUrl = `https://www.youtube.com/watch?v=${activeVideoId}&list=${activePlaylistId}&pp=${activeContextParam}`;

  // Fetch normalized metadata via /api/media/oembed or fallback
  useEffect(() => {
    let isMounted = true;

    async function fetchMetadata() {
      setLoadingMetadata(true);
      try {
        const res = await fetch(`/api/media/oembed?url=${encodeURIComponent(currentUrl)}`);
        if (res.ok) {
          const data: NormalizedMediaMetadata = await res.json();
          if (isMounted) {
            setMetadata(data);
            if (onMetadataLoaded) onMetadataLoaded(data);
          }
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch {
        // Fallback default for Pactra
        if (isMounted) {
          const fallbackData: NormalizedMediaMetadata = {
            success: true,
            title: titleOverride || 'Pactra : AI-Powered Payment Governance | PayPal AI Hackathon 2026',
            providerName: 'YouTube',
            providerUrl: 'https://www.youtube.com/',
            authorName: 'Wild Factz',
            authorUrl: 'https://www.youtube.com/',
            thumbnailUrl: `https://i.ytimg.com/vi/${activeVideoId}/hqdefault.jpg`,
            canonicalUrl: canonicalExternalUrl,
            embedHtml: `<iframe src="${embedUrl}" allowfullscreen></iframe>`,
            type: 'video',
            resolvedAt: new Date().toISOString(),
            provider_name: 'YouTube',
            provider_url: 'https://www.youtube.com/',
            url: canonicalExternalUrl,
            html: `<iframe src="${embedUrl}" allowfullscreen></iframe>`,
            isFallback: true,
          };
          setMetadata(fallbackData);
          if (onMetadataLoaded) onMetadataLoaded(fallbackData);
        }
      } finally {
        if (isMounted) setLoadingMetadata(false);
      }
    }

    fetchMetadata();

    return () => {
      isMounted = false;
    };
  }, [currentUrl, activeVideoId, activePlaylistId, canonicalExternalUrl, embedUrl, onMetadataLoaded, titleOverride]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const reloadPlayer = () => {
    setIframeKey((prev) => prev + 1);
  };

  const displayTitle =
    titleOverride ||
    metadata?.title ||
    (activeVideoId === '685tzja9ey4'
      ? 'Pactra : AI-Powered Payment Governance | PayPal AI Hackathon 2026'
      : `YouTube Video (${activeVideoId})`);

  const providerName = metadata?.providerName || 'YouTube';

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      {/* 1. Header: Media Title, Provider, and Security Status Badges */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-red-600/10 border border-red-500/20 text-red-500 shrink-0">
            <Play className="w-4 h-4 fill-red-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-800/40">
                {providerName}
              </span>
              {privacyEnhanced ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Privacy-Enhanced (youtube-nocookie.com)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40">
                  <Globe className="w-3 h-3 text-amber-400" />
                  <span>Standard Embed (youtube.com)</span>
                </span>
              )}
            </div>
            <h3 className="text-sm md:text-base font-bold text-white truncate max-w-xl mt-0.5" title={displayTitle}>
              {loadingMetadata ? 'Resolving media title via Noembed...' : displayTitle}
            </h3>
          </div>
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={reloadPlayer}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reload embedded iframe"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reload</span>
          </button>
          <button
            onClick={() => handleCopy(embedUrl)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Copy Embed URL"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedUrl ? 'Copied' : 'Copy Embed'}</span>
          </button>
          <a
            href={canonicalExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow"
          >
            <span>Watch on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 2. Main Player Viewport or Restriction Fallback Boundary */}
      <div className="relative w-full aspect-video bg-black">
        {isRestricted ? (
          /* Restriction Fallback Boundary Card */
          <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-y-auto">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Playback Restricted / Fallback Boundary Triggered</span>
              </div>

              <div>
                <h4 className="text-xl font-bold text-white tracking-tight">
                  Target Media Inaccessible on 3rd-Party Embed
                </h4>
                <p className="text-xs md:text-sm text-slate-400 mt-1 leading-relaxed">
                  YouTube video <code className="text-blue-400 font-mono font-bold">{activeVideoId}</code> or playlist <code className="text-blue-400 font-mono font-bold">{activePlaylistId}</code> returned an inaccessible status, has <strong>&ldquo;Allow embedding&rdquo; unchecked</strong> in YouTube Studio, is <strong>Age-Restricted</strong>, or blocked by corporate firewall policies.
                </p>
              </div>

              {/* Direct Launch Button */}
              <div className="pt-2">
                <a
                  href={canonicalExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-lg hover:shadow-red-600/25 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Direct Launch on YouTube (watch?v={activeVideoId}&list={activePlaylistId})</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Network Administrator & Security Checklist */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Network Administrator &amp; Policy Checklist</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">VeriSettle Security Tier 03</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={checklist.youtubeAllowlist}
                    onChange={(e) => setChecklist({ ...checklist, youtubeAllowlist: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                  <span>Allowlist <code className="font-mono text-blue-400">youtube.com</code> on corporate proxy/firewall</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={checklist.nocookieAllowlist}
                    onChange={(e) => setChecklist({ ...checklist, nocookieAllowlist: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                  <span>Allowlist <code className="font-mono text-emerald-400">youtube-nocookie.com</code> for privacy embeds</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={checklist.noembedAllowlist}
                    onChange={(e) => setChecklist({ ...checklist, noembedAllowlist: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                  <span>Allowlist HTTPS metadata endpoint <code className="font-mono text-purple-400">noembed.com/embed</code></span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={checklist.studioEmbeddingAllowed}
                    onChange={(e) => setChecklist({ ...checklist, studioEmbeddingAllowed: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                  <span>YouTube Studio &gt; Content &gt; SHOW MORE &gt; &ldquo;Allow embedding&rdquo; checked</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={checklist.ageRestrictionCleared}
                    onChange={(e) => setChecklist({ ...checklist, ageRestrictionCleared: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                  <span>Video is not flagged as Age-Restricted (bypasses 3rd-party embed blocks)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={checklist.childDirectedDesignation}
                    onChange={(e) => setChecklist({ ...checklist, childDirectedDesignation: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                  <span>Child-directed self-designation verified under YouTube API Terms of Service</span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          /* Live Privacy-Enhanced Iframe Player */
          <iframe
            key={iframeKey}
            src={embedUrl}
            title={displayTitle}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        )}
      </div>

      {/* 3. Configurable Player Controls Bar & Diagnostics Drawer */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Start Time Parameter (?start=seconds) */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Start Timestamp</span>
              </span>
              <code className="text-[11px] font-mono text-blue-400">?start={startSeconds}s</code>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={600}
                step={10}
                value={startSeconds}
                onChange={(e) => setStartSeconds(Number(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono text-slate-300 w-10 text-right">{startSeconds}s</span>
            </div>
          </div>

          {/* Captions & Language (?cc_lang_pref=X&cc_load_policy=1) */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Subtitles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Captions &amp; Subtitles</span>
              </span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceCaptions}
                  onChange={(e) => setForceCaptions(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                />
                <span className="text-[10px] font-mono text-emerald-400">Force On</span>
              </label>
            </div>
            <select
              value={captionLang}
              onChange={(e) => setCaptionLang(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md py-1 px-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="en">English (en)</option>
              <option value="es">Spanish (es)</option>
              <option value="fr">French (fr)</option>
              <option value="de">German (de)</option>
              <option value="ja">Japanese (ja)</option>
              <option value="zh">Chinese (zh)</option>
            </select>
          </div>

          {/* Autoplay Toggle & View Increment Notice */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                <span>Autoplay</span>
              </span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoplay}
                  onChange={(e) => setAutoplay(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-0"
                />
                <span className="text-[10px] font-mono text-purple-400">{autoplay ? 'Active' : 'Off'}</span>
              </label>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Autoplayed embedded videos are muted by default and do <strong>not</strong> increment YouTube views.
            </p>
          </div>

          {/* Privacy Domain & Fallback Simulation Toggle */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Privacy &amp; Fallback</span>
              </span>
              <button
                onClick={() => setIsRestricted(!isRestricted)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  isRestricted
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {isRestricted ? 'Simulating Block' : 'Test Fallback'}
              </button>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={privacyEnhanced}
                onChange={(e) => setPrivacyEnhanced(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
              />
              <span>Use <code className="text-cyan-400 font-mono">youtube-nocookie.com</code></span>
            </label>
          </div>
        </div>

        {/* Informational Footer Bar: URL Breakdown & Compliance */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>Video ID: <strong className="text-blue-400">{activeVideoId}</strong></span>
            <span>Playlist ID: <strong className="text-purple-400">{activePlaylistId}</strong></span>
            <span>Context: <strong className="text-slate-300">{activeContextParam}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>COPPA &amp; YouTube TOS Compliant</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
