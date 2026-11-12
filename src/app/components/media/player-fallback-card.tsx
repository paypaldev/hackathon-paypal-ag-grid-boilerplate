'use client';

import React from 'react';
import {
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

interface PlayerFallbackCardProps {
  videoId: string | null;
  playlistId: string | null;
  contextParam: string | null;
  directWatchUrl: string;
  errorMessage?: string;
  onRetry?: () => void;
}

export function PlayerFallbackCard({
  videoId,
  playlistId,
  contextParam,
  directWatchUrl,
  errorMessage,
  onRetry,
}: PlayerFallbackCardProps) {
  return (
    <div className="flex flex-col justify-between p-6 sm:p-8 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950 border border-amber-500/30 rounded-b-xl text-slate-200">
      <div>
        {/* Alert Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-amber-200">
              Playback Restriction or External Embed Block Detected
            </h4>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              {errorMessage ||
                'This video or playlist cannot be displayed inside an embedded frame. Common causes include creator embed locks in YouTube Studio, age restrictions, or network firewall policies.'}
            </p>
          </div>
        </div>

        {/* Diagnostic Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400">Target Video ID</span>
            <p className="text-xs font-mono font-bold text-slate-100 mt-1 truncate">
              {videoId || 'None (Playlist Only)'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400">Parent Playlist ID</span>
            <p className="text-xs font-mono font-bold text-slate-100 mt-1 truncate">
              {playlistId || 'None (Single Video)'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400">Context Query (pp)</span>
            <p className="text-xs font-mono font-bold text-blue-400 mt-1 truncate">
              {contextParam || 'Standard Direct'}
            </p>
          </div>
        </div>

        {/* Network Administrator Allowlist Checklist */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2.5">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <ShieldAlert className="w-4 h-4 text-blue-400" />
            <span>Network Administrator Allowlist Requirements:</span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-400 pt-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <code className="text-slate-200">youtube.com</code> (Watch endpoints)
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <code className="text-slate-200">youtube-nocookie.com</code> (Privacy embed)
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <code className="text-slate-200">noembed.com</code> (oEmbed metadata JSON)
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <code className="text-slate-200">i.ytimg.com</code> (Thumbnails & sprites)
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-800/80 mt-5">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>Launch directly on YouTube with full playback context</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Embed</span>
            </button>
          )}

          <a
            href={directWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <span>Launch on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
