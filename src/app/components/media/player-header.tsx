'use client';

import React from 'react';
import { Play, ShieldCheck, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';
import type { NoembedMetadata } from '@/lib/noembed-service';

interface PlayerHeaderProps {
  metadata: NoembedMetadata | null;
  isLoading: boolean;
  isRestricted: boolean;
  canonicalUrl: string;
}

export function PlayerHeader({
  metadata,
  isLoading,
  isRestricted,
  canonicalUrl,
}: PlayerHeaderProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!canonicalUrl) return;
    navigator.clipboard.writeText(canonicalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-950/80 border-b border-slate-800 backdrop-blur rounded-t-xl">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center size-9 rounded-lg bg-red-600/10 border border-red-500/20 text-red-500 shrink-0">
          <Play className="w-5 h-5 fill-red-500" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {metadata?.provider_name || 'YouTube'}
            </span>
            {isRestricted ? (
              <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertCircle className="w-3 h-3" />
                <span>Restriction Fallback</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                <span>Privacy-Enhanced Mode</span>
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-slate-100 truncate mt-1 max-w-md md:max-w-xl">
            {isLoading ? (
              <span className="inline-block w-48 h-4 bg-slate-800 animate-pulse rounded" />
            ) : (
              metadata?.title || 'YouTube Player & Playlist Stream'
            )}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
          title="Copy Canonical URL"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Share'}</span>
        </button>

        <a
          href={canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 text-xs transition-colors"
          title="Open in YouTube"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open</span>
        </a>
      </div>
    </div>
  );
}
