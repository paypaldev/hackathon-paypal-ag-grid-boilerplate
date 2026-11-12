'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductRecord,
} from '@/lib/products-data';
import { ProductEditModal } from './product-edit-modal';
import {
  Package,
  DollarSign,
  AlertTriangle,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

export function ProductsAdminView() {
  const [products, setProducts] = useState<ProductRecord[]>(() => getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof ProductRecord>('priceUsd');
  const [sortAsc, setSortAsc] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
        return matchesSearch && matchesCat && matchesStatus;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [products, searchQuery, selectedCategory, selectedStatus, sortField, sortAsc]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set);
  }, [products]);

  // Aggregate stats
  const totalValuation = products.reduce((acc, p) => acc + p.priceUsd * p.stockUnits, 0);
  const lowStockCount = products.filter((p) => p.status === 'LOW_STOCK' || p.status === 'OUT_OF_STOCK').length;
  const anomalyCount = products.filter((p) => Math.abs(p.zScore) >= 1.5).length;

  const handleSaveProduct = (prodData: Partial<ProductRecord>) => {
    if (editingProduct) {
      const updated = updateProduct(editingProduct.id, prodData);
      if (updated) setProducts(getProducts());
    } else {
      createProduct(prodData);
      setProducts(getProducts());
    }
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Remove product "${name}" (${id}) from catalog?`)) {
      deleteProduct(id);
      setProducts(getProducts());
    }
  };

  const toggleSort = (field: keyof ProductRecord) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Package className="w-3.5 h-3.5" />
            <span>Product Catalog &amp; Anomaly Radar</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            B2B Hardware &amp; Services Catalog
          </h2>
          <p className="text-xs text-slate-400">
            Multi-merchant pricing matched against Channel3 catalog and AP2 Spend Mandate limits.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg hover:shadow-blue-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Catalog SKUs</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{products.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">{categories.length} Active Categories</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Inventory Valuation</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ${totalValuation.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all warehouses</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Low Stock / Reorder Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{lowStockCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Holt-Winters reorder triggered</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Channel3 Anomaly Warnings</span>
            <Layers className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">{anomalyCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Variance &gt;1.5σ from market norm</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, SKU, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 shrink-0">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 shrink-0">Availability:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Product &amp; SKU</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('category')}>
                  <div className="flex items-center gap-1">
                    <span>Category</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('priceUsd')}>
                  <div className="flex items-center gap-1">
                    <span>Unit Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Channel3 Norm</th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('stockUnits')}>
                  <div className="flex items-center gap-1">
                    <span>Stock</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No products match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isAnomaly = Math.abs(p.zScore) >= 1.5;
                  return (
                    <tr key={p.id} className="hover:bg-slate-850/50 transition-colors">
                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div>
                          <Link
                            href={`/products/${p.id}`}
                            className="font-semibold text-white hover:text-blue-400 transition-colors flex items-center gap-1"
                          >
                            <span>{p.name}</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </Link>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <code className="text-blue-400 font-mono text-[10px]">{p.sku}</code>
                            <span className="text-slate-600">·</span>
                            <span>{p.supplierName}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {p.category}
                        </span>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white text-xs">
                        ${p.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Channel3 Norm & Z-score */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs text-slate-300">
                          ${p.marketAverageUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className={`text-[10px] font-mono px-1 rounded ${
                              isAnomaly ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}
                          >
                            {p.zScore > 0 ? `+${p.zScore.toFixed(2)}` : p.zScore.toFixed(2)}σ
                          </span>
                        </div>
                      </td>

                      {/* Stock Units */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold text-white">{p.stockUnits}</span>
                        <span className="text-[10px] text-slate-500 block">min: {p.minThresholdUnits}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.status === 'IN_STOCK'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : p.status === 'LOW_STOCK'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          <span>{p.status.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/products/${p.id}`}
                            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="View Specs & Trends"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {filteredProducts.length} of {products.length} products
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            Channel3 Multi-Merchant Verified
          </span>
        </div>
      </div>

      <ProductEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
      />
    </div>
  );
}
