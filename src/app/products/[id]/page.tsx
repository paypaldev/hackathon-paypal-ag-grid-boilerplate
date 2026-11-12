'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { MainNav } from '@/app/components/main-nav';
import {
  getProductById,
  updateProduct,
  type ProductRecord,
} from '@/lib/products-data';
import { ProductEditModal } from '../components/product-edit-modal';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft,
  Layers,
  DollarSign,
  AlertCircle,
  Truck,
  Building,
  Edit2,
  Calendar,
  Package,
} from 'lucide-react';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<ProductRecord | null>(() => getProductById(resolvedParams.id) || null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <MainNav />
        <main className="flex-1 max-w-4xl mx-auto w-full p-8 flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400" />
          <h1 className="text-xl font-bold">Product Not Found</h1>
          <p className="text-sm text-slate-400">
            No product found with identifier: <code className="font-mono text-blue-400">{resolvedParams.id}</code>
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products Directory</span>
          </Link>
        </main>
      </div>
    );
  }

  const handleSaveProduct = (updates: Partial<ProductRecord>) => {
    const updated = updateProduct(product.id, updates);
    if (updated) setProduct(updated);
  };

  const isAnomaly = Math.abs(product.zScore) >= 1.5;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <MainNav />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products Catalog</span>
          </Link>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Specifications</span>
          </button>
        </div>

        {/* Product Hero Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {product.sku}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {product.category}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    product.status === 'IN_STOCK'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : product.status === 'LOW_STOCK'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  <span>{product.status.replace('_', ' ')}</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  <span>Supplier: {product.supplierName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lead Time: {product.leadTimeDays} days</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Restocked: {product.lastRestocked}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:text-right shrink-0">
              <div className="text-xs text-slate-400 mb-0.5">Catalog Unit Price</div>
              <div className="font-mono text-2xl font-bold text-white">
                ${product.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Stock On Hand: <strong className="text-slate-300 font-mono">{product.stockUnits} units</strong>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Catalog List Price</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              ${product.priceUsd.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">PayPal Catalog Reference</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Channel3 Market Average</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ${product.marketAverageUsd.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Aggregated Cross-Merchant Quote</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Anomaly Z-Score</span>
              <AlertCircle className={`w-4 h-4 ${isAnomaly ? 'text-red-400' : 'text-emerald-400'}`} />
            </div>
            <div className={`text-2xl font-bold font-mono ${isAnomaly ? 'text-red-400' : 'text-emerald-400'}`}>
              {product.zScore > 0 ? `+${product.zScore.toFixed(2)}` : product.zScore.toFixed(2)}σ
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isAnomaly ? 'High variance flagged' : 'Within normal market band'}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Inventory Buffer</span>
              <Package className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-400">
              {product.stockUnits} / {product.minThresholdUnits} min
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Holt-Winters 80% Cover</div>
          </div>
        </div>

        {/* Charts & Market Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">
                6-Month Price Trend vs. Channel3 Market Norms ($ USD)
              </h2>
              <p className="text-xs text-slate-400">
                Comparing catalog quote against multi-merchant benchmark
              </p>
            </div>
            <span className="text-[11px] font-mono text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              Recharts Line
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={product.priceHistory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b0f17', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: unknown, name: unknown) => [
                    `$${Number(val).toLocaleString()}`,
                    name === 'catalogPriceUsd' ? 'Catalog Price' : 'Channel3 Market Norm',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="catalogPriceUsd"
                  name="Catalog Price"
                  stroke="#0070e0"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0070e0' }}
                />
                <Line
                  type="monotone"
                  dataKey="channel3MarketAvgUsd"
                  name="Channel3 Market Avg"
                  stroke="#2e9e6a"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#2e9e6a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Description & Technical Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-white">Product Description</h2>
            <p className="text-xs text-slate-300 leading-relaxed">{product.description}</p>
            <div className="pt-2">
              <span className="text-xs text-slate-400 font-semibold block mb-1.5">Tags &amp; Metadata:</span>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-white">AP2 Spend Mandate Governance</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Purchases for this SKU are constrained by the Spend Mandate policy envelope. Single orders cannot exceed{' '}
              <strong className="text-white">$5,000.00</strong> without a secondary cryptographic approval digest, and Holt-Winters reorder quantity is gated by lead time ({product.leadTimeDays} days).
            </p>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-blue-300">
              Protocol: AP2-MANDATE-v1 · Status: COMPLIANT · Hash: 0x8a1b2c...
            </div>
          </div>
        </div>
      </main>

      <ProductEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProduct}
        initialProduct={product}
      />
    </div>
  );
}
