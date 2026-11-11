import "server-only";
import { Channel3 } from "@channel3/sdk";

/**
 * VeriSettle AI — Channel3 B2B Universal Catalog & Multi-Merchant Pricing Intelligence
 * 
 * Features:
 *  - Real multi-merchant hardware & supply catalog discovery (Newegg, Adorama, Amazon, CDW, B&H, etc.)
 *  - Statistical category price norm computation (Mean, StdDev, Min, Max)
 *  - Anomaly Z-Score calculation for 3-Way Match Invoice Reconciliation & Escrow Authorization
 *  - Cosmos.AI MCP Gateway tool execution provider
 *  - In-memory query caching to avoid redundant network hops
 *  - Safe fallback if CHANNEL3_API_KEY is unset or unreachable
 */

export interface Channel3OfferSummary {
  domain: string;
  price: number;
  currency: string;
  availability: string;
  condition: string;
  url: string;
}

export interface Channel3ProductSummary {
  id: string;
  title: string;
  description: string;
  brand: string;
  category: string;
  imageUrl: string | null;
  lowestPrice: number;
  currency: string;
  offers: Channel3OfferSummary[];
}

export interface Channel3PriceNormResult {
  query: string;
  sampleSize: number;
  merchantCount: number;
  merchants: string[];
  meanPriceUsd: number;
  stdDevUsd: number;
  minPriceUsd: number;
  maxPriceUsd: number;
  productsFound: number;
  topProductTitle?: string;
}

export interface Channel3AnomalyEvaluation {
  proposedPriceUsd: number;
  categoryNorm: Channel3PriceNormResult;
  zScore: number;
  isAnomalous: boolean;
  varianceFromMeanPct: number;
  recommendedMaxPriceUsd: number;
  reasons: string[];
}

export interface Channel3HealthStatus {
  status: "healthy" | "unconfigured" | "error";
  configured: boolean;
  endpoint: string;
  latencyMs?: number;
  message: string;
  error?: string;
  timestamp: string;
}

let channel3ClientInstance: Channel3 | null = null;

// Query cache: key -> { data, timestamp }
const queryCache = new Map<string, { products: Channel3ProductSummary[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Returns a Channel3 client instance using the CHANNEL3_API_KEY environment variable.
 */
export function getChannel3Client(): Channel3 | null {
  const apiKey = process.env.CHANNEL3_API_KEY?.trim();
  if (!apiKey || apiKey === "your_channel3_api_key") {
    return null;
  }

  if (!channel3ClientInstance) {
    channel3ClientInstance = new Channel3({ apiKey });
  }

  return channel3ClientInstance;
}

/** Check if Channel3 is configured */
export function isChannel3Enabled(): boolean {
  return Boolean(getChannel3Client());
}

/**
 * Fallback static B2B catalog items if API key is missing or offline
 */
const FALLBACK_B2B_PRODUCTS: Channel3ProductSummary[] = [
  {
    id: "JYkWyTu",
    title: "42U Heavy-Duty Server Rack Enclosure",
    description: "42U high-density IT equipment installation rack with reversible locking doors and EIA-310 compliance.",
    brand: "Tripp Lite",
    category: "Server Cabinets & Enclosures",
    imageUrl: "https://cdn.trychannel3.com/00038126-7e23-4059-8707-710304eaaa5f",
    lowestPrice: 980.99,
    currency: "USD",
    offers: [
      {
        domain: "adorama.com",
        price: 980.99,
        currency: "USD",
        availability: "InStock",
        condition: "new",
        url: "https://adorama.com",
      },
      {
        domain: "newegg.com",
        price: 1499.99,
        currency: "USD",
        availability: "InStock",
        condition: "new",
        url: "https://newegg.com",
      },
      {
        domain: "cdw.com",
        price: 1250.00,
        currency: "USD",
        availability: "InStock",
        condition: "new",
        url: "https://cdw.com",
      },
    ],
  },
  {
    id: "DL-R760",
    title: "Dell PowerEdge R760 Rack Server",
    description: "2U dual-socket enterprise rack server designed for compute-intensive virtualization and database workloads.",
    brand: "Dell",
    category: "Enterprise Servers",
    imageUrl: null,
    lowestPrice: 3490.00,
    currency: "USD",
    offers: [
      {
        domain: "newegg.com",
        price: 3490.00,
        currency: "USD",
        availability: "InStock",
        condition: "new",
        url: "https://newegg.com",
      },
      {
        domain: "dell.com",
        price: 3850.00,
        currency: "USD",
        availability: "InStock",
        condition: "new",
        url: "https://dell.com",
      },
    ],
  },
  {
    id: "PKG-CORR-01",
    title: "Heavy-Duty Corrugated Shipping Boxes (Pack of 100)",
    description: "Multi-ply commercial packing boxes for B2B logistics and warehouse fulfillment.",
    brand: "OmniSupply",
    category: "Cafe & Packaging Supplies",
    imageUrl: null,
    lowestPrice: 120.00,
    currency: "USD",
    offers: [
      {
        domain: "uline.com",
        price: 120.00,
        currency: "USD",
        availability: "InStock",
        condition: "new",
        url: "https://uline.com",
      },
      {
        domain: "grainger.com",
        price: 135.00,
        currency: "USD",
        availability: "InStock",
        condition: "new",
        url: "https://grainger.com",
      },
    ],
  },
];

/**
 * Searches the Channel3 multi-merchant universal product catalog.
 */
export async function searchChannel3Catalog(
  query: string,
  options: { limit?: number; mode?: "default" | "agentic"; category?: string } = {}
): Promise<{ products: Channel3ProductSummary[]; source: "channel3_live_api" | "channel3_fallback" }> {
  const client = getChannel3Client();
  const cacheKey = `${query.toLowerCase().trim()}:${options.limit || 5}`;

  // Check cache
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      products: cached.products,
      source: "channel3_live_api",
    };
  }

  if (!client) {
    const filtered = FALLBACK_B2B_PRODUCTS.filter(
      (p) =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        p.brand.toLowerCase().includes(query.toLowerCase())
    );
    return {
      products: filtered.length > 0 ? filtered : FALLBACK_B2B_PRODUCTS.slice(0, options.limit || 5),
      source: "channel3_fallback",
    };
  }

  try {
    const page = await client.products.search({
      query: query || "B2B Hardware",
      limit: Math.min(options.limit || 5, 20),
      config: options.mode ? { mode: options.mode } : undefined,
    });

    const rawList = (page as any).data || (page as any).response?.products || [];
    const products: Channel3ProductSummary[] = rawList.map((p: any) => {
      const offers: Channel3OfferSummary[] = (p.offers || []).map((o: any) => {
        let priceVal = 0;
        let cur = "USD";
        if (typeof o.price === "number") {
          priceVal = o.price;
        } else if (o.price && typeof o.price.price === "number") {
          priceVal = o.price.price;
          cur = o.price.currency || "USD";
        } else if (o.price && typeof o.price.price === "string") {
          priceVal = parseFloat(o.price.price) || 0;
          cur = o.price.currency || "USD";
        }

        return {
          domain: o.domain || "merchant",
          price: priceVal,
          currency: cur,
          availability: o.availability || "InStock",
          condition: o.condition || "new",
          url: o.url || "",
        };
      });

      const validPrices = offers.map((o) => o.price).filter((pr) => pr > 0);
      const lowestPrice = validPrices.length > 0 ? Math.min(...validPrices) : (typeof p.price === "number" ? p.price : 0);

      return {
        id: p.id || String(Math.random()),
        title: p.title || "Untitled Product",
        description: p.description || "",
        brand: p.brands?.[0]?.name || "Generic",
        category: p.category?.title || p.category?.slug || options.category || "General Hardware",
        imageUrl: p.images?.[0]?.url || null,
        lowestPrice,
        currency: offers[0]?.currency || "USD",
        offers,
      };
    });

    if (products.length > 0) {
      queryCache.set(cacheKey, { products, timestamp: Date.now() });
      return {
        products,
        source: "channel3_live_api",
      };
    }

    return {
      products: FALLBACK_B2B_PRODUCTS.slice(0, options.limit || 5),
      source: "channel3_fallback",
    };
  } catch (error) {
    console.warn("[Channel3] Live API error, utilizing deterministic fallback:", error);
    return {
      products: FALLBACK_B2B_PRODUCTS.slice(0, options.limit || 5),
      source: "channel3_fallback",
    };
  }
}

/**
 * Computes statistical category price norms across multiple merchants from Channel3.
 */
export async function getCategoryPriceNorm(
  queryOrCategory: string,
  sampleLimit = 10
): Promise<Channel3PriceNormResult> {
  const { products } = await searchChannel3Catalog(queryOrCategory, { limit: sampleLimit });

  const allOfferPrices: number[] = [];
  const merchantSet = new Set<string>();

  for (const product of products) {
    for (const offer of product.offers) {
      if (offer.price > 0) {
        allOfferPrices.push(offer.price);
        merchantSet.add(offer.domain);
      }
    }
    // Also include lowestPrice if no offers were explicitly expanded
    if (product.offers.length === 0 && product.lowestPrice > 0) {
      allOfferPrices.push(product.lowestPrice);
    }
  }

  // Fallback defaults if no offers found
  if (allOfferPrices.length === 0) {
    return {
      query: queryOrCategory,
      sampleSize: 1,
      merchantCount: 1,
      merchants: ["standard-market"],
      meanPriceUsd: 1500.0,
      stdDevUsd: 150.0,
      minPriceUsd: 1350.0,
      maxPriceUsd: 1650.0,
      productsFound: 0,
    };
  }

  const n = allOfferPrices.length;
  const mean = allOfferPrices.reduce((a, b) => a + b, 0) / n;
  const variance = allOfferPrices.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n > 1 ? n - 1 : 1);
  const stdDev = Math.sqrt(variance);

  return {
    query: queryOrCategory,
    sampleSize: n,
    merchantCount: merchantSet.size,
    merchants: Array.from(merchantSet),
    meanPriceUsd: Math.round(mean * 100) / 100,
    stdDevUsd: Math.max(Math.round(stdDev * 100) / 100, 1.0),
    minPriceUsd: Math.round(Math.min(...allOfferPrices) * 100) / 100,
    maxPriceUsd: Math.round(Math.max(...allOfferPrices) * 100) / 100,
    productsFound: products.length,
    topProductTitle: products[0]?.title,
  };
}

/**
 * Evaluates whether a proposed purchase order unit price is an anomaly against Channel3 category norms.
 * Z-score > 2.0 indicates an abnormal price variance requiring verification before escrow capture.
 */
export async function evaluateChannel3PricingAnomaly(
  proposedPriceUsd: number,
  queryOrCategory: string
): Promise<Channel3AnomalyEvaluation> {
  const norm = await getCategoryPriceNorm(queryOrCategory);

  const zScore = Math.round(((proposedPriceUsd - norm.meanPriceUsd) / norm.stdDevUsd) * 100) / 100;
  const varianceFromMeanPct =
    norm.meanPriceUsd > 0
      ? Math.round(((proposedPriceUsd - norm.meanPriceUsd) / norm.meanPriceUsd) * 10000) / 100
      : 0;

  const isAnomalous = zScore > 2.0;
  const recommendedMaxPriceUsd = Math.round((norm.meanPriceUsd + 2.0 * norm.stdDevUsd) * 100) / 100;

  const reasons: string[] = [];
  if (isAnomalous) {
    reasons.push(
      `Unit price $${proposedPriceUsd.toFixed(2)} is +${zScore} std dev above Channel3 norm ($${norm.meanPriceUsd.toFixed(2)} avg across ${norm.merchantCount} merchants). Potential over-billing.`
    );
  } else {
    reasons.push(
      `Unit price $${proposedPriceUsd.toFixed(2)} aligns with Channel3 norm ($${norm.meanPriceUsd.toFixed(2)} ± $${norm.stdDevUsd.toFixed(2)}, z=${zScore}). Market verified.`
    );
  }

  return {
    proposedPriceUsd,
    categoryNorm: norm,
    zScore,
    isAnomalous,
    varianceFromMeanPct,
    recommendedMaxPriceUsd,
    reasons,
  };
}

/**
 * Validates Channel3 API connectivity and returns detailed health status.
 */
export async function checkChannel3Health(): Promise<Channel3HealthStatus> {
  const apiKey = process.env.CHANNEL3_API_KEY?.trim();
  const endpoint = "https://api.trychannel3.com";

  if (!apiKey || apiKey === "your_channel3_api_key") {
    return {
      status: "unconfigured",
      configured: false,
      endpoint,
      message: "CHANNEL3_API_KEY is not configured in .env.local. Using deterministic fallback catalog.",
      timestamp: new Date().toISOString(),
    };
  }

  const start = performance.now();
  try {
    const client = getChannel3Client();
    if (!client) throw new Error("Could not initialize Channel3 client");

    const page = await client.products.search({ query: "server", limit: 1 });
    const latencyMs = Math.round(performance.now() - start);
    const count = (page as any).data?.length ?? 0;

    return {
      status: "healthy",
      configured: true,
      endpoint,
      latencyMs,
      message: `Channel3 API healthy and operational (found ${count} sample items).`,
      timestamp: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : String(err);
    return {
      status: "error",
      configured: true,
      endpoint,
      latencyMs,
      message: "Channel3 API failed health check.",
      error: message.slice(0, 250),
      timestamp: new Date().toISOString(),
    };
  }
}
