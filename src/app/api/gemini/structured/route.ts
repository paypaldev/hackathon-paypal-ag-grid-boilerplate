import { NextRequest, NextResponse } from "next/server";
import { generateStructuredAiResponse, isGeminiEnabled } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, schemaGuide } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt is required and must be a string." }, { status: 400 });
    }

    if (!isGeminiEnabled()) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured in .env.local." }, { status: 503 });
    }

    const { data, model } = await generateStructuredAiResponse(prompt, schemaGuide);
    return NextResponse.json({
      status: "success",
      model,
      data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

