'use client';

import { useState } from 'react';
import type { ProductRecord, ProductStatus } from '@/lib/products-data';
import { X, Check } from 'lucide-react';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<ProductRecord>) => void;
  initialProduct?: ProductRecord | null;
}

export function ProductEditModal({ isOpen, onClose, onSave, initialProduct }: ProductEditModalProps) {
  const [name, setName] = useState(initialProduct?.name || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [category, setCategory] = useState(initialProduct?.category || 'Cloud Hardware');
  const [priceUsd, setPriceUsd] = useState(initialProduct?.priceUsd?.toString() || '999');
  const [marketAverageUsd, setMarketAverageUsd] = useState(initialProduct?.marketAverageUsd?.toString() || '980');
  const [stockUnits, setStockUnits] = useState(initialProduct?.stockUnits?.toString() || '25');
  const [minThresholdUnits, setMinThresholdUnits] = useState(initialProduct?.minThresholdUnits?.toString() || '8');
  const [supplierName, setSupplierName] = useState(initialProduct?.supplierName || 'Stratos High-Density Hardware');
  const [leadTimeDays, setLeadTimeDays] = useState(initialProduct?.leadTimeDays?.toString() || '5');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Product title is required';
    if (!sku.trim()) newErrors.sku = 'SKU identifier is required';
    if (isNaN(parseFloat(priceUsd)) || parseFloat(priceUsd) <= 0) {
      newErrors.priceUsd = 'Valid positive price required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const price = parseFloat(priceUsd);
    const mkt = parseFloat(marketAverageUsd) || price * 0.98;
    const stock = parseInt(stockUnits, 10) || 0;
    const minThreshold = parseInt(minThresholdUnits, 10) || 5;

    let status: ProductStatus = 'IN_STOCK';
    if (stock <= 0) status = 'OUT_OF_STOCK';
    else if (stock < minThreshold) status = 'LOW_STOCK';

    onSave({
      id: initialProduct?.id,
      name: name.trim(),
      sku: sku.trim(),
      category,
      priceUsd: price,
      marketAverageUsd: mkt,
      stockUnits: stock,
      minThresholdUnits: minThreshold,
      status,
      supplierName: supplierName.trim(),
      leadTimeDays: parseInt(leadTimeDays, 10) || 5,
      description: description.trim() || 'Enterprise B2B infrastructure component.',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">
              {initialProduct ? 'Edit Catalog Product' : 'Add New B2B Catalog Item'}
            </h2>
            <p className="text-xs text-slate-400">
              {initialProduct ? `SKU: ${initialProduct.sku}` : 'Cross-referenced against Channel3 Market Norms'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Product Title</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 42U Enterprise Server Rack"
              className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 ${
                errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-blue-500'
              }`}
            />
            {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">SKU Code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU-XXXX-001"
                className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-hidden focus:ring-1 ${
                  errors.sku ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-blue-500'
                }`}
              />
              {errors.sku && <p className="text-[11px] text-red-400 mt-1">{errors.sku}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="Cloud Hardware">Cloud Hardware</option>
                <option value="Semiconductors">Semiconductors</option>
                <option value="Networking">Networking</option>
                <option value="Cabling & Optics">Cabling &amp; Optics</option>
                <option value="Storage">Storage</option>
                <option value="Power Management">Power Management</option>
                <option value="Support & SLAs">Support &amp; SLAs</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Unit Price (USD)</label>
              <input
                type="number"
                step="0.01"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                placeholder="1225.00"
                className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-hidden focus:ring-1 ${
                  errors.priceUsd ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-blue-500'
                }`}
              />
              {errors.priceUsd && <p className="text-[11px] text-red-400 mt-1">{errors.priceUsd}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Channel3 Market Average</label>
              <input
                type="number"
                step="0.01"
                value={marketAverageUsd}
                onChange={(e) => setMarketAverageUsd(e.target.value)}
                placeholder="1210.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Stock On Hand (Units)</label>
              <input
                type="number"
                value={stockUnits}
                onChange={(e) => setStockUnits(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Min Restock Threshold</label>
              <input
                type="number"
                value={minThresholdUnits}
                onChange={(e) => setMinThresholdUnits(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Supplier Name</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Stratos Hardware"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Lead Time (Days)</label>
              <input
                type="number"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Technical Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed technical specifications..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{initialProduct ? 'Save Product' : 'Add to Catalog'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

