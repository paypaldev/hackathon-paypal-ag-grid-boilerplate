import { NextRequest, NextResponse } from "next/server";
import {
  searchChannel3Catalog,
  getCategoryPriceNorm,
  evaluateChannel3PricingAnomaly,
} from "@/lib/channel3";

/**
 * VeriSettle AI — Channel3 Multi-Merchant Catalog & Pricing Intelligence API
 * 
 * Query or POST:
 *  - query: string (e.g., "server rack", "Dell PowerEdge", "shipping boxes")
 *  - category?: string
 *  - proposedPrice?: number (calculates Z-score against multi-merchant category norm)
 *  - limit?: number
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "42U Server Rack";
    const category = searchParams.get("category") || undefined;
    const proposedPrice = searchParams.get("proposedPrice")
      ? parseFloat(searchParams.get("proposedPrice")!)
      : undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 5;

    const { products, source } = await searchChannel3Catalog(query, { category, limit });
    const priceNorm = await getCategoryPriceNorm(query, limit);

    let anomalyEvaluation = null;
    if (proposedPrice !== undefined && !isNaN(proposedPrice)) {
      anomalyEvaluation = await evaluateChannel3PricingAnomaly(proposedPrice, query);
    }

    return NextResponse.json({
      success: true,
      source,
      query,
      count: products.length,
      products,
      priceNorm,
      anomalyEvaluation,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query || "42U Server Rack";
    const category = body.category || undefined;
    const proposedPrice = body.proposedPrice !== undefined ? Number(body.proposedPrice) : undefined;
    const limit = body.limit ? Number(body.limit) : 5;
    const mode = body.mode === "agentic" ? "agentic" : "default";

    const { products, source } = await searchChannel3Catalog(query, { category, limit, mode });
    const priceNorm = await getCategoryPriceNorm(query, limit);

    let anomalyEvaluation = null;
    if (proposedPrice !== undefined && !isNaN(proposedPrice)) {
      anomalyEvaluation = await evaluateChannel3PricingAnomaly(proposedPrice, query);
    }

    return NextResponse.json({
      success: true,
      source,
      query,
      count: products.length,
      products,
      priceNorm,
      anomalyEvaluation,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
