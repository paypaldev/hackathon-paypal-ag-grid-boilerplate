/**
 * YouTube URL Parser & Diagnostics Utility
 * 
 * Implements Tier 01: Input URL Parsing & Direct Access Diagnostics
 * as defined in the YouTube Video & Playlist UI Integration Blueprint.
 * 
 * Supports:
 * - standard watch URLs (youtube.com/watch?v=...)
 * - playlist links (youtube.com/playlist?list=...)
 * - combined video + playlist links (youtube.com/watch?v=...&list=...&pp=sAgC)
 * - shortlinks (youtu.be/...)
 * - embed links (youtube.com/embed/..., youtube-nocookie.com/embed/...)
 * - shorts (youtube.com/shorts/...)
 */

export interface YouTubeEmbedOptions {
  videoId?: string | null;
  playlistId?: string | null;
  startTime?: number | null; // in seconds
  captionLang?: string | null; // e.g. "en", "es", "fr" (ISO 639-1)
  forceCaptions?: boolean; // cc_load_policy=1
  autoplay?: boolean; // Note: autoplayed embedded videos do not increment YouTube views
  privacyEnhanced?: boolean; // use https://www.youtube-nocookie.com
  enableJsApi?: boolean;
  rel?: number; // 0 = show related videos from same channel only
  modestBranding?: boolean;
  controls?: boolean;
}

export interface PrivacyEmbedOptions {
  startTimeSeconds?: number;
  captionLanguage?: string;
  forceCaptions?: boolean;
  autoplay?: boolean;
  privacyEnhanced?: boolean;
  enableJsApi?: boolean;
  rel?: number;
  modestBranding?: boolean;
}

export interface YouTubeParsedUrl {
  isValid: boolean;
  originalUrl: string;
  videoId: string | null;
  playlistId: string | null;
  contextParam: string | null; // e.g. 'sAgC'
  playbackContextParam: string | null; // alias for backwards compatibility
  startTimestamp: number | null; // seconds
  canonicalUrl: string;
  canonicalWatchUrl: string | null;
  canonicalPlaylistUrl: string | null;
  privacyEmbedUrl: string | null;
  standardEmbedUrl: string | null;
  diagnostics: {
    urlType: 'watch' | 'playlist' | 'shortlink' | 'embed' | 'shorts' | 'unknown' | 'invalid';
    hasVideoId: boolean;
    hasPlaylistId: boolean;
    hasContextParam: boolean;
    directScrapeRisk: string;
    embedSupportStatus: 'direct_embed_supported' | 'playlist_container' | 'invalid';
  };
}

export type ParsedYouTubeUrl = YouTubeParsedUrl;

/**
 * Parses time formats such as "90", "1m30s", "1h2m3s", "90s" into integer seconds.
 */
export function parseTimestampToSeconds(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return isNaN(input) || input < 0 ? null : Math.floor(input);

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Pure integer / float
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const val = parseInt(trimmed, 10);
    return isNaN(val) ? null : val;
  }

  // Formats like 1h20m15s, 4m30s, 45s
  const match = trimmed.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);
  if (match) {
    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const seconds = match[3] ? parseInt(match[3], 10) : 0;
    const total = hours * 3600 + minutes * 60 + seconds;
    return total > 0 ? total : null;
  }

  return null;
}

/**
 * Extracts video ID, playlist ID, playback context parameter (pp=sAgC),
 * and timestamp from any YouTube URL format.
 */
export function parseYouTubeUrl(inputUrl: string): YouTubeParsedUrl {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return createInvalidResult(inputUrl || '');
  }

  const trimmed = inputUrl.trim();

  // If user passed a bare 11-char video ID (e.g., "685tzja9ey4")
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    const videoId = trimmed;
    const canonicalWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    return {
      isValid: true,
      originalUrl: trimmed,
      videoId,
      playlistId: null,
      contextParam: null,
      playbackContextParam: null,
      startTimestamp: null,
      canonicalUrl: canonicalWatchUrl,
      canonicalWatchUrl,
      canonicalPlaylistUrl: null,
      privacyEmbedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`,
      standardEmbedUrl: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`,
      diagnostics: {
        urlType: 'watch',
        hasVideoId: true,
        hasPlaylistId: false,
        hasContextParam: false,
        directScrapeRisk: 'High (Direct automated scraping of YouTube watch endpoints fails due to anti-bot measures, dynamic JS rendering, and lack of API headers. Use Noembed oEmbed or Privacy Embed API).',
        embedSupportStatus: 'direct_embed_supported',
      },
    };
  }

  let urlObj: URL;
  try {
    const normalizedUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    urlObj = new URL(normalizedUrl);
  } catch {
    return createInvalidResult(trimmed);
  }

  const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  let videoId: string | null = null;
  let playlistId: string | null = null;
  let contextParam: string | null = null;
  let startTimestamp: number | null = null;
  let urlType: YouTubeParsedUrl['diagnostics']['urlType'] = 'unknown';

  const isYouTubeDomain = [
    'youtube.com',
    'm.youtube.com',
    'youtube-nocookie.com',
    'youtu.be',
  ].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));

  if (!isYouTubeDomain) {
    return createInvalidResult(trimmed, 'Non-YouTube domain supplied.');
  }

  // 1. Extract context parameter (e.g. pp=sAgC)
  if (searchParams.has('pp')) {
    contextParam = searchParams.get('pp');
  }

  // 2. Extract timestamp parameter (t= or start=)
  if (searchParams.has('t')) {
    startTimestamp = parseTimestampToSeconds(searchParams.get('t'));
  } else if (searchParams.has('start')) {
    startTimestamp = parseTimestampToSeconds(searchParams.get('start'));
  }

  // 3. Extract playlist ID (list=)
  if (searchParams.has('list')) {
    playlistId = searchParams.get('list');
  }

  // 4. Extract video ID based on path pattern
  if (hostname === 'youtu.be') {
    const id = pathname.replace(/^\//, '').split('/')[0];
    if (id && id.length >= 6) {
      videoId = id;
      urlType = 'shortlink';
    }
  } else if (pathname === '/watch') {
    if (searchParams.has('v')) {
      videoId = searchParams.get('v');
      urlType = 'watch';
    }
  } else if (pathname.startsWith('/embed/')) {
    const parts = pathname.replace('/embed/', '').split('/');
    if (parts[0] && parts[0] !== 'videoseries') {
      videoId = parts[0];
    }
    urlType = 'embed';
  } else if (pathname.startsWith('/shorts/')) {
    const id = pathname.replace('/shorts/', '').split('/')[0];
    if (id) {
      videoId = id;
      urlType = 'shorts';
    }
  } else if (pathname === '/playlist') {
    urlType = 'playlist';
  }

  const isValidVideoId = Boolean(videoId && /^[\w-]{6,16}$/.test(videoId));
  const isValidPlaylistId = Boolean(playlistId && /^[\w-]{10,64}$/.test(playlistId));
  const isValid = isValidVideoId || isValidPlaylistId;

  if (!isValid) {
    return createInvalidResult(trimmed, 'Unable to identify a valid YouTube Video ID or Playlist ID.');
  }

  const canonicalWatchUrl = isValidVideoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
  const canonicalPlaylistUrl = isValidPlaylistId ? `https://www.youtube.com/playlist?list=${playlistId}` : null;

  const canonicalUrl = buildDirectWatchUrl({
    videoId: isValidVideoId ? videoId : null,
    playlistId: isValidPlaylistId ? playlistId : null,
    contextParam,
  });

  const privacyEmbedUrl = buildPrivacyEmbedUrl({
    videoId: isValidVideoId ? videoId : null,
    playlistId: isValidPlaylistId ? playlistId : null,
    startTime: startTimestamp,
    privacyEnhanced: true,
  });

  const standardEmbedUrl = buildPrivacyEmbedUrl({
    videoId: isValidVideoId ? videoId : null,
    playlistId: isValidPlaylistId ? playlistId : null,
    startTime: startTimestamp,
    privacyEnhanced: false,
  });

  return {
    isValid: true,
    originalUrl: trimmed,
    videoId: isValidVideoId ? videoId : null,
    playlistId: isValidPlaylistId ? playlistId : null,
    contextParam,
    playbackContextParam: contextParam,
    startTimestamp,
    canonicalUrl,
    canonicalWatchUrl,
    canonicalPlaylistUrl,
    privacyEmbedUrl,
    standardEmbedUrl,
    diagnostics: {
      urlType,
      hasVideoId: isValidVideoId,
      hasPlaylistId: isValidPlaylistId,
      hasContextParam: Boolean(contextParam),
      directScrapeRisk: 'High (Direct automated scraping of YouTube watch endpoints fails due to anti-bot measures, dynamic JS rendering, and lack of API headers. Use Noembed oEmbed or Privacy Embed API).',
      embedSupportStatus: isValidVideoId ? 'direct_embed_supported' : 'playlist_container',
    },
  };
}

/**
 * Builds a direct YouTube watch URL for external launches.
 */
export function buildDirectWatchUrl({
  videoId,
  playlistId,
  contextParam,
}: {
  videoId?: string | null;
  playlistId?: string | null;
  contextParam?: string | null;
}): string {
  if (videoId && playlistId) {
    const pp = contextParam ? `&pp=${encodeURIComponent(contextParam)}` : '';
    return `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}${pp}`;
  }
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  if (playlistId) {
    const pp = contextParam ? `&pp=${encodeURIComponent(contextParam)}` : '';
    return `https://www.youtube.com/playlist?list=${playlistId}${pp}`;
  }
  return 'https://www.youtube.com';
}

/**
 * Builds an embed URL targeting privacy-enhanced youtube-nocookie.com
 */
export function buildPrivacyEnhancedEmbedUrl({
  videoId,
  playlistId,
  options = {},
}: {
  videoId?: string | null;
  playlistId?: string | null;
  options?: PrivacyEmbedOptions;
}): string {
  return buildPrivacyEmbedUrl({
    videoId,
    playlistId,
    startTime: options.startTimeSeconds,
    captionLang: options.captionLanguage,
    forceCaptions: options.forceCaptions ?? Boolean(options.captionLanguage),
    autoplay: options.autoplay,
    privacyEnhanced: options.privacyEnhanced !== false,
    enableJsApi: options.enableJsApi !== false,
    rel: options.rel ?? 0,
    modestBranding: options.modestBranding !== false,
  });
}

/**
 * Builds an embed URL targeting either privacy-enhanced youtube-nocookie.com or standard youtube.com
 * strictly enforcing parameter compliance and sanitization.
 */
export function buildPrivacyEmbedUrl(options: YouTubeEmbedOptions): string {
  const {
    videoId,
    playlistId,
    startTime,
    captionLang,
    forceCaptions,
    autoplay,
    privacyEnhanced = true,
    enableJsApi = true,
    rel = 0,
    modestBranding = true,
    controls = true,
  } = options;

  const domain = privacyEnhanced ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com';

  let path = '';
  const query = new URLSearchParams();

  if (videoId) {
    path = `/embed/${encodeURIComponent(videoId)}`;
    if (playlistId) {
      query.set('list', playlistId);
    }
  } else if (playlistId) {
    path = '/embed/videoseries';
    query.set('list', playlistId);
  } else {
    return '';
  }

  // Start timestamp
  if (typeof startTime === 'number' && startTime > 0) {
    query.set('start', Math.floor(startTime).toString());
  }

  // Captions
  if (captionLang) {
    query.set('cc_lang_pref', captionLang.toLowerCase().slice(0, 2));
    query.set('cc_load_policy', '1');
  } else if (forceCaptions) {
    query.set('cc_load_policy', '1');
  }

  // Autoplay
  // NOTE: Autoplayed embedded videos do not increment YouTube view counts according to YouTube developer policies.
  if (autoplay) {
    query.set('autoplay', '1');
    query.set('mute', '1'); // Modern browsers block unmuted autoplay
  }

  if (enableJsApi) {
    query.set('enablejsapi', '1');
  }

  if (rel === 0) {
    query.set('rel', '0');
  }

  if (modestBranding) {
    query.set('modestbranding', '1');
  }

  if (!controls) {
    query.set('controls', '0');
  }

  const queryString = query.toString();
  return `${domain}${path}${queryString ? `?${queryString}` : ''}`;
}

function createInvalidResult(originalUrl: string, reason?: string): YouTubeParsedUrl {
  return {
    isValid: false,
    originalUrl,
    videoId: null,
    playlistId: null,
    contextParam: null,
    playbackContextParam: null,
    startTimestamp: null,
    canonicalUrl: originalUrl,
    canonicalWatchUrl: null,
    canonicalPlaylistUrl: null,
    privacyEmbedUrl: null,
    standardEmbedUrl: null,
    diagnostics: {
      urlType: 'invalid',
      hasVideoId: false,
      hasPlaylistId: false,
      hasContextParam: false,
      directScrapeRisk: reason || 'URL is not a recognized YouTube watch, playlist, shortlink, or embed URL.',
      embedSupportStatus: 'invalid',
    },
  };
}
