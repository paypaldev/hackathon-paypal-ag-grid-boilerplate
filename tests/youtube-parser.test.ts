import { describe, it, expect } from 'vitest';
import {
  parseYouTubeUrl,
  buildPrivacyEnhancedEmbedUrl,
  buildDirectWatchUrl,
} from '../src/lib/youtube-parser';

describe('YouTube Parser Utility Suite', () => {
  const TARGET_URL = 'https://www.youtube.com/watch?v=685tzja9ey4&list=PLT2es12MHToI&pp=sAgC';

  it('parses combined video + playlist + query context URL', () => {
    const res = parseYouTubeUrl(TARGET_URL);

    expect(res.isValid).toBe(true);
    expect(res.videoId).toBe('685tzja9ey4');
    expect(res.playlistId).toBe('PLT2es12MHToI');
    expect(res.contextParam).toBe('sAgC');
    expect(res.canonicalUrl).toContain('685tzja9ey4');
    expect(res.canonicalUrl).toContain('PLT2es12MHToI');
  });

  it('parses isolated watch video URL', () => {
    const res = parseYouTubeUrl('https://www.youtube.com/watch?v=685tzja9ey4');

    expect(res.isValid).toBe(true);
    expect(res.videoId).toBe('685tzja9ey4');
    expect(res.playlistId).toBeNull();
    expect(res.contextParam).toBeNull();
  });

  it('parses standalone playlist URL', () => {
    const res = parseYouTubeUrl('https://www.youtube.com/playlist?list=PLT2es12MHToI');

    expect(res.isValid).toBe(true);
    expect(res.videoId).toBeNull();
    expect(res.playlistId).toBe('PLT2es12MHToI');
  });

  it('parses youtu.be shortlink', () => {
    const res = parseYouTubeUrl('https://youtu.be/685tzja9ey4?list=PLT2es12MHToI');

    expect(res.isValid).toBe(true);
    expect(res.videoId).toBe('685tzja9ey4');
    expect(res.playlistId).toBe('PLT2es12MHToI');
  });

  it('parses bare 11-char video ID', () => {
    const res = parseYouTubeUrl('685tzja9ey4');

    expect(res.isValid).toBe(true);
    expect(res.videoId).toBe('685tzja9ey4');
  });

  it('rejects invalid or non-YouTube URLs', () => {
    expect(parseYouTubeUrl('https://vimeo.com/123456').isValid).toBe(false);
    expect(parseYouTubeUrl('').isValid).toBe(false);
  });

  it('builds privacy-enhanced embed URL with custom parameters', () => {
    const embedUrl = buildPrivacyEnhancedEmbedUrl({
      videoId: '685tzja9ey4',
      playlistId: 'PLT2es12MHToI',
      options: {
        startTimeSeconds: 125,
        captionLanguage: 'fr',
        autoplay: true,
      },
    });

    expect(embedUrl).toContain('https://www.youtube-nocookie.com/embed/685tzja9ey4');
    expect(embedUrl).toContain('list=PLT2es12MHToI');
    expect(embedUrl).toContain('start=125');
    expect(embedUrl).toContain('cc_lang_pref=fr');
    expect(embedUrl).toContain('cc_load_policy=1');
    expect(embedUrl).toContain('autoplay=1');
  });

  it('builds direct watch fallback URL with context parameter', () => {
    const watchUrl = buildDirectWatchUrl({
      videoId: '685tzja9ey4',
      playlistId: 'PLT2es12MHToI',
      contextParam: 'sAgC',
    });

    expect(watchUrl).toBe('https://www.youtube.com/watch?v=685tzja9ey4&list=PLT2es12MHToI&pp=sAgC');
  });
});
