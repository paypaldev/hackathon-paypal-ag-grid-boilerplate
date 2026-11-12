export type ProductStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';

export interface PriceHistoryPoint {
  month: string;
  catalogPriceUsd: number;
  channel3MarketAvgUsd: number;
}

export interface ProductRecord {
  id: string;
  sku: string;
  name: string;
  category: string;
  type: 'PHYSICAL' | 'SERVICE' | 'DIGITAL';
  description: string;
  priceUsd: number;
  marketAverageUsd: number;
  zScore: number;
  stockUnits: number;
  minThresholdUnits: number;
  status: ProductStatus;
  supplierName: string;
  leadTimeDays: number;
  lastRestocked: string;
  priceHistory: PriceHistoryPoint[];
  tags: string[];
}

export const INITIAL_PRODUCTS: ProductRecord[] = [
  {
    id: 'PROD-RACK-42U',
    sku: 'SKU-RACK-42U',
    name: '42U Enterprise Server Rack Enclosure',
    category: 'Cloud Hardware',
    type: 'PHYSICAL',
    description: 'Heavy-duty steel 42U datacenter server rack with perforated doors, cable organizers, and PDU mounting brackets.',
    priceUsd: 1225.0,
    marketAverageUsd: 1210.0,
    zScore: 0.18,
    stockUnits: 45,
    minThresholdUnits: 15,
    status: 'IN_STOCK',
    supplierName: 'Stratos High-Density Hardware',
    leadTimeDays: 5,
    lastRestocked: '2026-11-01',
    tags: ['datacenter', 'racks', 'hardware'],
    priceHistory: [
      { month: 'Jun 2026', catalogPriceUsd: 1250, channel3MarketAvgUsd: 1240 },
      { month: 'Jul 2026', catalogPriceUsd: 1240, channel3MarketAvgUsd: 1230 },
      { month: 'Aug 2026', catalogPriceUsd: 1230, channel3MarketAvgUsd: 1220 },
      { month: 'Sep 2026', catalogPriceUsd: 1225, channel3MarketAvgUsd: 1215 },
      { month: 'Oct 2026', catalogPriceUsd: 1225, channel3MarketAvgUsd: 1210 },
      { month: 'Nov 2026', catalogPriceUsd: 1225, channel3MarketAvgUsd: 1210 },
    ],
  },
  {
    id: 'PROD-GPU-H100',
    sku: 'SKU-GPU-H100',
    name: 'NVIDIA H100 SXM5 80GB AI Accelerator',
    category: 'Semiconductors',
    type: 'PHYSICAL',
    description: 'Enterprise AI training GPU with 80GB HBM3 memory, 3.35 TB/s memory bandwidth, and fourth-gen Tensor Cores.',
    priceUsd: 31500.0,
    marketAverageUsd: 32200.0,
    zScore: -0.42,
    stockUnits: 6,
    minThresholdUnits: 10,
    status: 'LOW_STOCK',
    supplierName: 'Apex Logistics Freight Inc.',
    leadTimeDays: 14,
    lastRestocked: '2026-10-18',
    tags: ['ai', 'gpu', 'datacenter', 'hbm3'],
    priceHistory: [
      { month: 'Jun 2026', catalogPriceUsd: 34000, channel3MarketAvgUsd: 34500 },
      { month: 'Jul 2026', catalogPriceUsd: 33500, channel3MarketAvgUsd: 33800 },
      { month: 'Aug 2026', catalogPriceUsd: 32800, channel3MarketAvgUsd: 33200 },
      { month: 'Sep 2026', catalogPriceUsd: 32000, channel3MarketAvgUsd: 32600 },
      { month: 'Oct 2026', catalogPriceUsd: 31800, channel3MarketAvgUsd: 32400 },
      { month: 'Nov 2026', catalogPriceUsd: 31500, channel3MarketAvgUsd: 32200 },
    ],
  },
  {
    id: 'PROD-SW-400G',
    sku: 'SKU-SW-400G',
    name: '32-Port 400GbE QSFP-DD Spine Switch',
    category: 'Networking',
    type: 'PHYSICAL',
    description: 'High-radix Ultra-low latency datacenter leaf-spine switch with redundant 80 Plus Titanium power supplies.',
    priceUsd: 8750.0,
    marketAverageUsd: 8690.0,
    zScore: 0.12,
    stockUnits: 18,
    minThresholdUnits: 8,
    status: 'IN_STOCK',
    supplierName: 'CloudMesh Telemetry Pvt Ltd',
    leadTimeDays: 7,
    lastRestocked: '2026-11-05',
    tags: ['switch', '400g', 'networking', 'spine'],
    priceHistory: [
      { month: 'Jun 2026', catalogPriceUsd: 9200, channel3MarketAvgUsd: 9150 },
      { month: 'Jul 2026', catalogPriceUsd: 9000, channel3MarketAvgUsd: 8950 },
      { month: 'Aug 2026', catalogPriceUsd: 8900, channel3MarketAvgUsd: 8850 },
      { month: 'Sep 2026', catalogPriceUsd: 8800, channel3MarketAvgUsd: 8750 },
      { month: 'Oct 2026', catalogPriceUsd: 8750, channel3MarketAvgUsd: 8700 },
      { month: 'Nov 2026', catalogPriceUsd: 8750, channel3MarketAvgUsd: 8690 },
    ],
  },
  {
    id: 'PROD-FIBER-OM5',
    sku: 'SKU-FIBER-OM5',
    name: '100m OM5 MPO-12 Armored Optical Fiber Cable',
    category: 'Cabling & Optics',
    type: 'PHYSICAL',
    description: '12-core multi-mode wideband OM5 fiber cable for 400G/800G transmission with LSZH low-smoke jacket.',
    priceUsd: 215.0,
    marketAverageUsd: 228.0,
    zScore: -0.55,
    stockUnits: 140,
    minThresholdUnits: 50,
    status: 'IN_STOCK',
    supplierName: 'Stratos High-Density Hardware',
    leadTimeDays: 3,
    lastRestocked: '2026-11-08',
    tags: ['cabling', 'fiber', 'om5', 'mpo'],
    priceHistory: [
      { month: 'Jun 2026', catalogPriceUsd: 245, channel3MarketAvgUsd: 250 },
      { month: 'Jul 2026', catalogPriceUsd: 235, channel3MarketAvgUsd: 242 },
      { month: 'Aug 2026', catalogPriceUsd: 228, channel3MarketAvgUsd: 235 },
      { month: 'Sep 2026', catalogPriceUsd: 220, channel3MarketAvgUsd: 230 },
      { month: 'Oct 2026', catalogPriceUsd: 218, channel3MarketAvgUsd: 229 },
      { month: 'Nov 2026', catalogPriceUsd: 215, channel3MarketAvgUsd: 228 },
    ],
  },
  {
    id: 'PROD-SAN-NVME',
    sku: 'SKU-SAN-NVME',
    name: '64TB NVMe-oF High-IOPS All-Flash Array',
    category: 'Storage',
    type: 'PHYSICAL',
    description: 'Dual-controller storage appliance delivering 12 million IOPS with RoCEv2 and NVMe/TCP interfaces.',
    priceUsd: 19800.0,
    marketAverageUsd: 18900.0,
    zScore: 0.85,
    stockUnits: 3,
    minThresholdUnits: 5,
    status: 'LOW_STOCK',
    supplierName: 'DataCore Systems GmbH',
    leadTimeDays: 10,
    lastRestocked: '2026-10-22',
    tags: ['nvme', 'storage', 'san', 'flash'],
    priceHistory: [
      { month: 'Jun 2026', catalogPriceUsd: 22000, channel3MarketAvgUsd: 21200 },
      { month: 'Jul 2026', catalogPriceUsd: 21500, channel3MarketAvgUsd: 20600 },
      { month: 'Aug 2026', catalogPriceUsd: 20800, channel3MarketAvgUsd: 19900 },
      { month: 'Sep 2026', catalogPriceUsd: 20200, channel3MarketAvgUsd: 19400 },
      { month: 'Oct 2026', catalogPriceUsd: 19900, channel3MarketAvgUsd: 19100 },
      { month: 'Nov 2026', catalogPriceUsd: 19800, channel3MarketAvgUsd: 18900 },
    ],
  },
  {
    id: 'PROD-PDU-SMART',
    sku: 'SKU-PDU-SMART',
    name: 'Monitored & Switched 3-Phase 30A Rack PDU',
    category: 'Power Management',
    type: 'PHYSICAL',
    description: 'Intelligent power distribution unit with outlet-level billing metering, environmental sensor ports, and remote reboot.',
    priceUsd: 940.0,
    marketAverageUsd: 920.0,
    zScore: 0.28,
    stockUnits: 28,
    minThresholdUnits: 12,
    status: 'IN_STOCK',
    supplierName: 'Stratos High-Density Hardware',
    leadTimeDays: 4,
    lastRestocked: '2026-11-03',
    tags: ['power', 'pdu', 'metering', 'rack'],
    priceHistory: [
      { month: 'Jun 2026', catalogPriceUsd: 980, channel3MarketAvgUsd: 960 },
      { month: 'Jul 2026', catalogPriceUsd: 965, channel3MarketAvgUsd: 950 },
      { month: 'Aug 2026', catalogPriceUsd: 955, channel3MarketAvgUsd: 940 },
      { month: 'Sep 2026', catalogPriceUsd: 945, channel3MarketAvgUsd: 930 },
      { month: 'Oct 2026', catalogPriceUsd: 940, channel3MarketAvgUsd: 925 },
      { month: 'Nov 2026', catalogPriceUsd: 940, channel3MarketAvgUsd: 920 },
    ],
  },
  {
    id: 'PROD-SRV-2U',
    sku: 'SKU-SRV-2U',
    name: '2U Dual AMD EPYC 9654 192-Core Server',
    category: 'Cloud Hardware',
    type: 'PHYSICAL',
    description: 'High-compute virtualization node with 1.5TB DDR5 ECC RAM, dual 100GbE NICs, and redundant 1600W PSUs.',
    priceUsd: 14200.0,
    marketAverageUsd: 13950.0,
    zScore: 0.35,
    stockUnits: 0,
    minThresholdUnits: 4,
    status: 'OUT_OF_STOCK',
    supplierName: 'DataCore Systems GmbH',
    leadTimeDays: 12,
    lastRestocked: '2026-09-30',
    tags: ['server', 'epyc', 'compute', 'virtualization'],
    priceHistory: [
      { month: 'Jun 2026', catalogPriceUsd: 15500, channel3MarketAvgUsd: 15200 },
      { month: 'Jul 2026', catalogPriceUsd: 15100, channel3MarketAvgUsd: 14800 },
      { month: 'Aug 2026', catalogPriceUsd: 14700, channel3MarketAvgUsd: 14450 },
      { month: 'Sep 2026', catalogPriceUsd: 14400, channel3MarketAvgUsd: 14150 },
      { month: 'Oct 2026', catalogPriceUsd: 14250, channel3MarketAvgUsd: 14000 },
      { month: 'Nov 2026', catalogPriceUsd: 14200, channel3MarketAvgUsd: 13950 },
    ],
  },
  {
    id: 'PROD-SLA-PREM',
    sku: 'SKU-SLA-PREM',
    name: '24/7/365 4-Hour On-Site Datacenter Maintenance SLA',
    category: 'Support & SLAs',
    type: 'SERVICE',
    description: 'Enterprise mission-critical hardware replacement SLA with dedicated field engineers and 15-minute triage.',
    priceUsd: 3600.0,
    marketAverageUsd: 3850.0,
    zScore: -0.68,
    stockUnits: 999,
    minThresholdUnits: 10,
    status: 'IN_STOCK',
    supplierName: 'VeriSettle Global Operations',
    leadTimeDays: 0,
    lastRestocked: '2026-11-01',
    tags: ['sla', 'support', 'maintenance', 'enterprise'],
    priceHistory: [
      { month: 'Jun 2026', catalogPriceUsd: 3900, channel3MarketAvgUsd: 4100 },
      { month: 'Jul 2026', catalogPriceUsd: 3800, channel3MarketAvgUsd: 4050 },
      { month: 'Aug 2026', catalogPriceUsd: 3750, channel3MarketAvgUsd: 3950 },
      { month: 'Sep 2026', catalogPriceUsd: 3700, channel3MarketAvgUsd: 3900 },
      { month: 'Oct 2026', catalogPriceUsd: 3650, channel3MarketAvgUsd: 3880 },
      { month: 'Nov 2026', catalogPriceUsd: 3600, channel3MarketAvgUsd: 3850 },
    ],
  },
];

let globalProductsState = [...INITIAL_PRODUCTS];

export function getProducts(): ProductRecord[] {
  return [...globalProductsState];
}

export function getProductById(id: string): ProductRecord | undefined {
  return globalProductsState.find((p) => p.id === id || p.sku === id);
}

export function createProduct(prodData: Partial<ProductRecord>): ProductRecord {
  const newSku = prodData.sku || `SKU-GEN-${Math.floor(100 + Math.random() * 900)}`;
  const newId = `PROD-${newSku.replace('SKU-', '')}`;
  const price = Number(prodData.priceUsd) || 500;
  const mktAvg = Number(prodData.marketAverageUsd) || price * 0.98;

  const newProduct: ProductRecord = {
    id: newId,
    sku: newSku,
    name: prodData.name || 'Enterprise Hardware Component',
    category: prodData.category || 'Cloud Hardware',
    type: prodData.type || 'PHYSICAL',
    description: prodData.description || 'Enterprise grade infrastructure component with standard 3-year warranty.',
    priceUsd: price,
    marketAverageUsd: mktAvg,
    zScore: Number(((price - mktAvg) / (price * 0.08 || 1)).toFixed(2)),
    stockUnits: Number(prodData.stockUnits) ?? 20,
    minThresholdUnits: Number(prodData.minThresholdUnits) ?? 5,
    status: (prodData.stockUnits ?? 20) <= 0 ? 'OUT_OF_STOCK' : (prodData.stockUnits ?? 20) < 10 ? 'LOW_STOCK' : 'IN_STOCK',
    supplierName: prodData.supplierName || 'Stratos High-Density Hardware',
    leadTimeDays: Number(prodData.leadTimeDays) ?? 5,
    lastRestocked: new Date().toISOString().split('T')[0],
    tags: prodData.tags || ['hardware', 'datacenter'],
    priceHistory: [
      { month: 'Jun 2026', catalogPriceUsd: price * 1.05, channel3MarketAvgUsd: mktAvg * 1.04 },
      { month: 'Jul 2026', catalogPriceUsd: price * 1.03, channel3MarketAvgUsd: mktAvg * 1.02 },
      { month: 'Aug 2026', catalogPriceUsd: price * 1.02, channel3MarketAvgUsd: mktAvg * 1.01 },
      { month: 'Sep 2026', catalogPriceUsd: price * 1.01, channel3MarketAvgUsd: mktAvg * 1.00 },
      { month: 'Oct 2026', catalogPriceUsd: price, channel3MarketAvgUsd: mktAvg },
      { month: 'Nov 2026', catalogPriceUsd: price, channel3MarketAvgUsd: mktAvg },
    ],
  };

  globalProductsState = [newProduct, ...globalProductsState];
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<ProductRecord>): ProductRecord | undefined {
  const index = globalProductsState.findIndex((p) => p.id === id || p.sku === id);
  if (index === -1) return undefined;

  const current = globalProductsState[index];
  const price = updates.priceUsd !== undefined ? Number(updates.priceUsd) : current.priceUsd;
  const mktAvg = updates.marketAverageUsd !== undefined ? Number(updates.marketAverageUsd) : current.marketAverageUsd;
  const stock = updates.stockUnits !== undefined ? Number(updates.stockUnits) : current.stockUnits;

  const updated: ProductRecord = {
    ...current,
    ...updates,
    priceUsd: price,
    marketAverageUsd: mktAvg,
    stockUnits: stock,
    zScore: Number(((price - mktAvg) / (price * 0.08 || 1)).toFixed(2)),
    status: stock <= 0 ? 'OUT_OF_STOCK' : stock < (updates.minThresholdUnits || current.minThresholdUnits) ? 'LOW_STOCK' : 'IN_STOCK',
  };

  globalProductsState[index] = updated;
  return updated;
}

export function deleteProduct(id: string): boolean {
  const initialLen = globalProductsState.length;
  globalProductsState = globalProductsState.filter((p) => p.id !== id && p.sku !== id);
  return globalProductsState.length < initialLen;
}

export function resetProductsState(): void {
  globalProductsState = [...INITIAL_PRODUCTS];
}

