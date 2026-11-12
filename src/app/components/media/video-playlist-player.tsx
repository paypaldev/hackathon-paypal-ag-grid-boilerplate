'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  parseYouTubeUrl,
  buildPrivacyEnhancedEmbedUrl,
  buildDirectWatchUrl,
  type YouTubeParsedUrl,
} from '@/lib/youtube-parser';
import type { NoembedMetadata } from '@/lib/noembed-service';
import { PlayerHeader } from './player-header';
import { PlayerFallbackCard } from './player-fallback-card';
import { PlayerControls } from './player-controls';

export interface VideoPlaylistPlayerProps {
  /** Target YouTube URL (single video, playlist, or combined) */
  url?: string;
  /** Explicit video ID override */
  videoId?: string;
  /** Explicit playlist ID override */
  playlistId?: string;
  /** Context parameter override (e.g. "sAgC") */
  contextParam?: string;
  /** Initial start time offset in seconds */
  initialStartTime?: number;
  /** Initial caption language code (e.g., 'en', 'fr') */
  initialCaptionLang?: string;
  /** Enable autoplay by default */
  initialAutoplay?: boolean;
  /** Force fallback card mode on mount (e.g. for restricted videos) */
  forceFallbackMode?: boolean;
  /** Display player controls toolbar */
  showControls?: boolean;
  /** Callback when oEmbed metadata is loaded */
  onMetadataLoaded?: (metadata: NoembedMetadata) => void;
  /** Custom wrapper CSS class names */
  className?: string;
}

const DEFAULT_TARGET_URL =
  'https://www.youtube.com/watch?v=685tzja9ey4&list=PLT2es12MHToI&pp=sAgC';

export function VideoPlaylistPlayer({
  url = DEFAULT_TARGET_URL,
  videoId: propVideoId,
  playlistId: propPlaylistId,
  contextParam: propContextParam,
  initialStartTime = 0,
  initialCaptionLang = '',
  initialAutoplay = false,
  forceFallbackMode = false,
  showControls = true,
  onMetadataLoaded,
  className = '',
}: VideoPlaylistPlayerProps) {
  // State for player configuration
  const [startTime, setStartTime] = useState(initialStartTime);
  const [captionLanguage, setCaptionLanguage] = useState(initialCaptionLang);
  const [autoplay, setAutoplay] = useState(initialAutoplay);
  const [isFallbackMode, setIsFallbackMode] = useState(forceFallbackMode);

  // Metadata state
  const [metadata, setMetadata] = useState<NoembedMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  // Parse input URL and merge with any explicit prop overrides
  const parsedData: YouTubeParsedUrl = useMemo(() => {
    const parsed = parseYouTubeUrl(url);
    return {
      ...parsed,
      videoId: propVideoId ?? parsed.videoId,
      playlistId: propPlaylistId ?? parsed.playlistId,
      contextParam: propContextParam ?? parsed.contextParam,
      canonicalUrl: parsed.canonicalUrl,
      isValid: Boolean(propVideoId || propPlaylistId || parsed.isValid),
    };
  }, [url, propVideoId, propPlaylistId, propContextParam]);

  // Direct watch URL for external launches
  const directWatchUrl = useMemo(() => {
    return buildDirectWatchUrl({
      videoId: parsedData.videoId,
      playlistId: parsedData.playlistId,
      contextParam: parsedData.contextParam,
    });
  }, [parsedData]);

  // Privacy-enhanced embed URL
  const embedUrl = useMemo(() => {
    return buildPrivacyEnhancedEmbedUrl({
      videoId: parsedData.videoId,
      playlistId: parsedData.playlistId,
      options: {
        startTimeSeconds: startTime,
        captionLanguage: captionLanguage || undefined,
        forceCaptions: Boolean(captionLanguage),
        autoplay,
      },
    });
  }, [parsedData, startTime, captionLanguage, autoplay]);

  // Fetch oEmbed metadata via server API route
  useEffect(() => {
    let isMounted = true;

    const fetchMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const queryUrl = encodeURIComponent(parsedData.canonicalUrl);
        const res = await fetch(`/api/media/oembed?url=${queryUrl}`);
        if (res.ok) {
          const data: NoembedMetadata = await res.json();
          if (isMounted) {
            setMetadata(data);
            if (onMetadataLoaded) onMetadataLoaded(data);
          }
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch {
        if (isMounted) {
          setMetadata({
            title: parsedData.videoId
              ? `YouTube Video (${parsedData.videoId})`
              : parsedData.playlistId
              ? `YouTube Playlist (${parsedData.playlistId})`
              : 'YouTube Media Player',
            provider_name: 'YouTube',
            provider_url: 'https://www.youtube.com',
            type: 'video',
            url: parsedData.canonicalUrl,
            html: '',
            isFallback: true,
          });
        }
      } finally {
        if (isMounted) setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();

    return () => {
      isMounted = false;
    };
  }, [parsedData.canonicalUrl, parsedData.videoId, parsedData.playlistId, onMetadataLoaded]);

  return (
    <div
      className={`flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl shadow-black/40 ${className}`}
    >
      {/* Player Header */}
      <PlayerHeader
        metadata={metadata}
        isLoading={isLoadingMetadata}
        isRestricted={isFallbackMode}
        canonicalUrl={directWatchUrl}
      />

      {/* Main Viewport Container (16:9 Aspect Ratio) */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        {isFallbackMode ? (
          <div className="w-full h-full overflow-y-auto">
            <PlayerFallbackCard
              videoId={parsedData.videoId}
              playlistId={parsedData.playlistId}
              contextParam={parsedData.contextParam}
              directWatchUrl={directWatchUrl}
              onRetry={() => setIsFallbackMode(false)}
            />
          </div>
        ) : (
          <iframe
            key={embedUrl}
            src={embedUrl}
            title={metadata?.title || 'YouTube Media Player'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        )}
      </div>

      {/* Player Controls Bar */}
      {showControls && (
        <PlayerControls
          startTime={startTime}
          onStartTimeChange={setStartTime}
          captionLanguage={captionLanguage}
          onCaptionLanguageChange={setCaptionLanguage}
          autoplay={autoplay}
          onAutoplayChange={setAutoplay}
          isFallbackMode={isFallbackMode}
          onToggleFallbackMode={() => setIsFallbackMode((prev) => !prev)}
        />
      )}
    </div>
  );
}
