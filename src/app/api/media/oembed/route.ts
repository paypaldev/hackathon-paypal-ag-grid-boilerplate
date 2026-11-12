import { NextRequest, NextResponse } from 'next/server';
import { parseYouTubeUrl } from '@/lib/youtube-parser';
import { resolveNoembedMetadata } from '@/lib/noembed-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  const noCache = searchParams.get('noCache') === 'true';

  if (!targetUrl) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required query parameter: ?url=<encoded_url>',
        diagnostics: null,
      },
      { status: 400 }
    );
  }

  try {
    const parsed = parseYouTubeUrl(targetUrl);
    const metadata = await resolveNoembedMetadata(targetUrl, { noCache });

    return NextResponse.json(
      {
        ...metadata,
        parsed,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to resolve oEmbed metadata: ${message}`,
      },
      { status: 500 }
    );
  }
}
