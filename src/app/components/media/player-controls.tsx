'use client';

import React from 'react';
import { Clock, MessageSquare, Info, Eye, EyeOff } from 'lucide-react';

interface PlayerControlsProps {
  startTime: number;
  onStartTimeChange: (seconds: number) => void;
  captionLanguage: string;
  onCaptionLanguageChange: (lang: string) => void;
  autoplay: boolean;
  onAutoplayChange: (autoplay: boolean) => void;
  isFallbackMode: boolean;
  onToggleFallbackMode: () => void;
}

const LANGUAGE_OPTIONS = [
  { code: '', label: 'Default / Auto' },
  { code: 'en', label: 'English (en)' },
  { code: 'es', label: 'Spanish (es)' },
  { code: 'fr', label: 'French (fr)' },
  { code: 'de', label: 'German (de)' },
  { code: 'ja', label: 'Japanese (ja)' },
];

export function PlayerControls({
  startTime,
  onStartTimeChange,
  captionLanguage,
  onCaptionLanguageChange,
  autoplay,
  onAutoplayChange,
  isFallbackMode,
  onToggleFallbackMode,
}: PlayerControlsProps) {
  return (
    <div className="p-4 bg-slate-950/90 border-t border-slate-800 rounded-b-xl text-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Timestamp Seek Controls */}
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-slate-400 font-medium">Start Offset:</span>
          <div className="flex items-center gap-1">
            {[0, 30, 60, 120].map((sec) => (
              <button
                key={sec}
                onClick={() => onStartTimeChange(sec)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  startTime === sec
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {sec === 0 ? '0s' : `${sec}s`}
              </button>
            ))}
            <div className="flex items-center ml-1">
              <input
                type="number"
                min="0"
                value={startTime}
                onChange={(e) => onStartTimeChange(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 px-1.5 py-1 text-[11px] font-mono bg-slate-900 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="sec"
                title="Custom seconds offset (?start=)"
              />
              <span className="text-[10px] text-slate-500 ml-1">sec</span>
            </div>
          </div>
        </div>

        {/* Captions Localization */}
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-slate-400 font-medium">Captions:</span>
          <select
            value={captionLanguage}
            onChange={(e) => onCaptionLanguageChange(e.target.value)}
            className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Autoplay & Diagnostics Toggle */}
        <div className="flex items-center gap-3">
          <label
            className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 select-none"
            title="Embedded videos that are autoplayed do not increment YouTube video views"
          >
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(e) => onAutoplayChange(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer size-3.5"
            />
            <span className="text-[11px]">Autoplay</span>
          </label>

          <button
            onClick={onToggleFallbackMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
              isFallbackMode
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle between Embed iframe and Restriction Fallback Diagnostics"
          >
            {isFallbackMode ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{isFallbackMode ? 'Show Embed Player' : 'Show Fallback Card'}</span>
          </button>
        </div>
      </div>

      {/* Autoplay compliance note */}
      {autoplay && (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800/80">
          <Info className="w-3 h-3 text-amber-400 shrink-0" />
          <span>
            Compliance notice: Per YouTube TOS, embedded videos that are autoplayed do not increment
            YouTube video view counts.
          </span>
        </div>
      )}
    </div>
  );
}
