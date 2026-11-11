'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  ShoppingCart,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Cpu,
  RefreshCw,
  Sparkles,
  Building2,
  Tag,
} from 'lucide-react';

interface Channel3Offer {
  domain: string;
  price: number;
  currency: string;
  availability: string;
  condition: string;
  url: string;
}

interface Channel3Product {
  id: string;
  title: string;
  description: string;
  brand: string;
  category: string;
  imageUrl: string | null;
  lowestPrice: number;
  currency: string;
  offers: Channel3Offer[];
}

interface Channel3PriceNorm {
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

interface Channel3Anomaly {
  proposedPriceUsd: number;
  zScore: number;
  isAnomalous: boolean;
  varianceFromMeanPct: number;
  recommendedMaxPriceUsd: number;
  reasons: string[];
}

export function Channel3CatalogExplorer() {
  const [query, setQuery] = useState('42U Server Rack');
  const [proposedPrice, setProposedPrice] = useState('1150');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'default' | 'agentic'>('default');
  const [products, setProducts] = useState<Channel3Product[]>([]);
  const [priceNorm, setPriceNorm] = useState<Channel3PriceNorm | null>(null);
  const [anomaly, setAnomaly] = useState<Channel3Anomaly | null>(null);
  const [source, setSource] = useState<'channel3_live_api' | 'channel3_fallback'>('channel3_live_api');
  const [hasQueried, setHasQueried] = useState(false);

  const fetchChannel3Data = async (searchQuery: string, priceStr: string, searchMode: 'default' | 'agentic') => {
    setLoading(true);
    try {
      const res = await fetch('/api/channel3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          proposedPrice: parseFloat(priceStr) || undefined,
          limit: 6,
          mode: searchMode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        setPriceNorm(data.priceNorm || null);
        setAnomaly(data.anomalyEvaluation || null);
        setSource(data.source || 'channel3_live_api');
        setHasQueried(true);
      }
    } catch (err) {
      console.error('Failed to query Channel3 API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannel3Data('42U Server Rack', '1150', 'default');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChannel3Data(query, proposedPrice, mode);
  };

  const presetQueries = [
    { label: 'Server Racks', q: '42U Server Rack', defaultPrice: '1150' },
    { label: 'Dell PowerEdge', q: 'Dell PowerEdge Server', defaultPrice: '3800' },
    { label: 'Network Switches', q: 'Cisco Gigabit Switch 48-Port', defaultPrice: '620' },
    { label: 'Packaging Supplies', q: 'Corrugated Shipping Boxes Pack', defaultPrice: '130' },
  ];

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-slate-850 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600/20 border border-indigo-500/30 p-2 rounded-lg text-indigo-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Channel3 Multi-Merchant Catalog &amp; Category Price Norms
              </h2>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                  source === 'channel3_live_api'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    source === 'channel3_live_api' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {source === 'channel3_live_api' ? 'Live Channel3 API Connected' : 'Offline Simulated Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Universal product discovery and merchant price distributions powering the 3-Way Match &amp; Escrow Anomaly Z-Score
            </p>
          </div>
        </div>

        {/* Sponsor Tag */}
        <div className="flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
          <span className="text-slate-400">Sponsor Integration:</span>
          <span className="text-indigo-400 font-semibold">@channel3/sdk 4.x</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Search & Query Bar */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[260px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search multi-merchant B2B catalog (e.g. Dell PowerEdge, 42U Rack)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            <div className="w-48 relative">
              <span className="text-xs text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 font-mono">$</span>
              <input
                type="number"
                step="any"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                placeholder="Proposed PO Price"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            {/* Mode Picker */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                type="button"
                onClick={() => setMode('default')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  mode === 'default' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setMode('agentic')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  mode === 'agentic' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                Agentic
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow hover:shadow-indigo-600/25 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Inspect Market</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
            <span className="text-[11px]">B2B Quick Presets:</span>
            {presetQueries.map((preset) => (
              <button
                key={preset.q}
                type="button"
                onClick={() => {
                  setQuery(preset.q);
                  setProposedPrice(preset.defaultPrice);
                  fetchChannel3Data(preset.q, preset.defaultPrice, mode);
                }}
                className={`px-2.5 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                  query === preset.q
                    ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </form>

        {/* Statistical Price Norm & Anomaly Z-Score Card */}
        {priceNorm && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            {/* Norm Stat 1: Mean Market Price */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Channel3 Mean Market Price</span>
              <span className="text-xl font-bold font-mono text-white">
                ${priceNorm.meanPriceUsd.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Across {priceNorm.merchantCount} merchant domains
              </span>
            </div>

            {/* Norm Stat 2: Market Dispersion (StdDev) */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Market Std Deviation (σ)</span>
              <span className="text-xl font-bold font-mono text-indigo-300">
                ±${priceNorm.stdDevUsd.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Range: ${priceNorm.minPriceUsd.toFixed(2)} – ${priceNorm.maxPriceUsd.toFixed(2)}
              </span>
            </div>

            {/* Norm Stat 3: Anomaly Z-Score */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Escrow Anomaly Z-Score</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xl font-bold font-mono ${
                    anomaly?.isAnomalous ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {anomaly ? (anomaly.zScore > 0 ? `+${anomaly.zScore}` : anomaly.zScore) : '0.00'}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    anomaly?.isAnomalous
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {anomaly?.isAnomalous ? 'ANOMALY (>2.0σ)' : 'WITHIN NORM'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Proposed PO: ${parseFloat(proposedPrice || '0').toFixed(2)}
              </span>
            </div>

            {/* Norm Stat 4: Merchants Participating */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Sampled Merchants</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {priceNorm.merchants.slice(0, 4).map((m) => (
                  <span
                    key={m}
                    className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700"
                  >
                    {m}
                  </span>
                ))}
                {priceNorm.merchants.length > 4 && (
                  <span className="text-[10px] text-slate-400 self-center">
                    +{priceNorm.merchants.length - 4} more
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {priceNorm.sampleSize} verified merchant offers
              </span>
            </div>
          </div>
        )}

        {/* Anomaly Decision Box */}
        {anomaly && (
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 ${
              anomaly.isAnomalous
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            }`}
          >
            {anomaly.isAnomalous ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-semibold">
                {anomaly.isAnomalous
                  ? 'Channel3 Price Anomaly Detected — Verification Advisory'
                  : 'Channel3 Price Distribution Grounding Verified'}
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {anomaly.reasons[0]} (Market cap recommended: ${anomaly.recommendedMaxPriceUsd.toFixed(2)} USD).
              </p>
            </div>
          </div>
        )}

        {/* Products & Offers Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-white flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Multi-Merchant Offers &amp; Product Matches ({products.length})</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Fetched via Channel3 Universal Catalog API
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded">
                      {product.brand}
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      from ${product.lowestPrice.toFixed(2)}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-white line-clamp-2 mb-1">
                    {product.title}
                  </h3>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                    {product.description || 'Enterprise grade B2B hardware and supplies.'}
                  </p>
                </div>

                {/* Merchant Offers Comparison Table */}
                <div className="border-t border-slate-850 pt-2.5 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                    Merchant Offers ({product.offers.length})
                  </span>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {product.offers.map((offer, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[11px] bg-slate-900/60 px-2 py-1 rounded border border-slate-800/60"
                      >
                        <span className="font-mono text-slate-300 truncate max-w-[120px]">
                          {offer.domain}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-white">
                            ${offer.price.toFixed(2)}
                          </span>
                          {offer.url && (
                            <a
                              href={offer.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-indigo-400 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                    {product.offers.length === 0 && (
                      <div className="text-[11px] text-slate-500 italic">
                        Standard catalog reference item
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
