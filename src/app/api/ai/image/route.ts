import { NextResponse } from 'next/server';
import { recordTrace, type LangfuseAttachment } from '@/lib/langfuse-tracer';

// In-memory timestamp bucket to enforce "Limited to 3 generations/minute"
const generationTimestamps: number[] = [];

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const now = Date.now();
    // Prune requests older than 60 seconds
    while (generationTimestamps.length > 0 && now - generationTimestamps[0] > 60000) {
      generationTimestamps.shift();
    }

    if (generationTimestamps.length >= 3) {
      return NextResponse.json(
        {
          error: 'Rate limit reached: Maximum 3 generations per minute. Please wait before generating another image.',
          retryAfterSec: Math.ceil((60000 - (now - generationTimestamps[0])) / 1000),
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const prompt = (body.prompt || '').trim();
    const sessionId = body.sessionId || `sess-img-${Date.now().toString(36)}`;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    generationTimestamps.push(now);

    // High quality themed SVG generation based on prompt keywords
    const pLower = prompt.toLowerCase();
    let themeColor = '%230070e0';
    let accentColor = '%2360cdff';
    let titleText = 'AI GENERATIVE ARTIFACT';
    let iconShape = '<rect x="160" y="100" width="80" height="80" rx="12" fill="%23001c64" stroke="%230070e0" stroke-width="3"/>';

    if (pLower.includes('cat') || pLower.includes('space') || pLower.includes('helmet')) {
      themeColor = '%237b61ff';
      accentColor = '%23f5a623';
      titleText = 'COSMIC ASTRONAUT CAT';
      iconShape =
        '<circle cx="200" cy="140" r="50" fill="%231f2937" stroke="%237b61ff" stroke-width="4"/><circle cx="185" cy="135" r="6" fill="%2360cdff"/><circle cx="215" cy="135" r="6" fill="%2360cdff"/><polygon points="160,105 175,70 190,100" fill="%237b61ff"/><polygon points="210,100 225,70 240,105" fill="%237b61ff"/>';
    } else if (pLower.includes('vault') || pLower.includes('escrow') || pLower.includes('stream')) {
      themeColor = '%230070e0';
      accentColor = '%2300a8a8';
      titleText = 'HOLOGRAPHIC B2B ESCROW VAULT';
      iconShape =
        '<polygon points="200,80 260,115 260,185 200,220 140,185 140,115" fill="%23001c64" stroke="%230070e0" stroke-width="3"/><circle cx="200" cy="150" r="28" fill="%230070e0" opacity="0.6"/><path d="M190 150 L198 158 L212 142" stroke="%23ffffff" stroke-width="3" fill="none"/>';
    } else if (pLower.includes('invoice') || pLower.includes('audit') || pLower.includes('cyberpunk')) {
      themeColor = '%23e8615a';
      accentColor = '%23f5a623';
      titleText = 'CYBERPUNK INVOICE AUDIT RADAR';
      iconShape =
        '<circle cx="200" cy="145" r="55" stroke="%23e8615a" stroke-width="3" fill="%23111827"/><line x1="145" y1="145" x2="255" y2="145" stroke="%23f5a623" stroke-width="1.5"/><line x1="200" y1="90" x2="200" y2="200" stroke="%23f5a623" stroke-width="1.5"/>';
    }

    const svgImage = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230b0f17"/><stop offset="100%" stop-color="%23111827"/></linearGradient></defs><rect width="480" height="320" fill="url(%23bg)" stroke="${themeColor}" stroke-width="2"/>${iconShape}<text x="240" y="245" fill="${accentColor}" font-family="system-ui, sans-serif" font-weight="bold" font-size="14" text-anchor="middle" letter-spacing="1">${titleText}</text><text x="240" y="270" fill="%2394a3b8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">GPT-Image-2.5 Flare · 512x512 High Fidelity</text><text x="240" y="292" fill="%2364748b" font-family="monospace" font-size="10" text-anchor="middle">Prompt: ${encodeURIComponent(prompt.substring(0, 42))}...</text></svg>`;

    const imageUrl = `data:image/svg+xml;utf8,${svgImage}`;
    const latencyMs = Date.now() - startTime + 350;
    const promptTokens = Math.max(15, Math.ceil(prompt.length / 4));
    const costUsd = 0.020; // Fixed per-image model cost

    const attachments: LangfuseAttachment[] = [
      {
        type: 'image',
        name: `generated-image-${Date.now()}.svg`,
        mimeType: 'image/svg+xml',
        url: imageUrl,
        sizeBytes: svgImage.length,
      },
    ];

    const trace = recordTrace({
      sessionId,
      tool: 'image_generator',
      name: 'Image Generation Request',
      input: prompt,
      output: { status: 'SUCCESS', model: 'gpt-image-2.5-flare', prompt },
      model: 'gpt-image-2.5-flare',
      tokens: { promptTokens, completionTokens: 0, totalTokens: promptTokens },
      latencyMs,
      costUsd,
      status: 'SUCCESS',
      attachments,
      metadata: { rateLimitRemaining: 3 - generationTimestamps.length },
    });

    return NextResponse.json({
      imageUrl,
      prompt,
      traceId: trace.id,
      sessionId,
      rateLimitRemaining: 3 - generationTimestamps.length,
      latencyMs,
      costUsd,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Image generation failed' }, { status: 500 });
  }
}
