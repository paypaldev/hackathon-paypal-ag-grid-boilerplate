import crypto from 'node:crypto';
import type { InventorySkuInput, Mandate, PolicyDecision } from './policy';

export type ClaimStatus =
  | 'DRAFT'
  | 'ORDER_CREATING'
  | 'AWAITING_BUYER_APPROVAL'
  | 'CAPTURE_PENDING'
  | 'CAPTURED'
  | 'UNKNOWN'
  | 'RECONCILED'
  | 'FAILED'
  | 'DECLINED';

export interface RestockPurchaseOrder {
  id: string; // e.g. PO-SUNRISE-101
  sku: string;
  name: string;
  category: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  merchantName: string;
  merchantUrl?: string;
  packSize: number;
  verifiedMedianPrice: number;
  lastPaidPrice: number;
  decision: PolicyDecision;
  reasons: string[];
  approvedByOwner: boolean;
  approvedAt?: string;
  createdAt: string;
}

export interface RestockClaim {
  poId: string;
  mandateId: string;
  status: ClaimStatus;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  approveUrl?: string;
  paypalFee?: string;
  amount: number;
  currency: string;
  paypalRequestIdCreate: string;
  paypalRequestIdCapture?: string;
  webhookEventId?: string;
  contractHash: string; // sha256(mandateId + ":" + poId)
  createdAt: string;
  updatedAt: string;
  errorDetails?: string;
}

export interface LedgerEntry {
  id: string;
  timestamp: string;
  step: string;
  sku: string;
  merchant: string;
  qty: number;
  total: number;
  savingsVsMedian: number;
  decision: PolicyDecision;
  status: 'PENDING' | 'ALLOW' | 'ASK' | 'BLOCK' | 'CAPTURED' | 'WEBHOOK_VERIFIED' | 'UNKNOWN' | 'RECONCILED';
  paypalOrderId?: string;
  paypalCaptureId?: string;
  webhookEventId?: string;
  idempotencyHash: string;
  notes?: string;
}

export function computeSha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export const SEEDED_MANDATE: Mandate = {
  id: "MANDATE-SUNRISE-2026",
  active: true,
  expiresAt: "2027-12-31T23:59:59Z",
  allowedCategories: [
    "Coffee Beans",
    "Dairy & Plant Milk",
    "Paper Goods & Packaging",
    "Syrups & Flavoring",
    "Espresso Parts",
  ],
  maxPerOrder: 1500.0,
  monthlyBudget: 4000.0,
  askFirstOver: 150.0,
  conditionNewOnly: true,
  strictNewBlock: true, // true for consumable food/beverage
  preferredSellers: [
    "RoastSupply Co",
    "OatDistribution Direct",
    "EcoPackaging Direct",
    "BaristaTools USA",
  ],
};

export const SEEDED_INVENTORY: Record<string, InventorySkuInput> = {
  "OAT-MILK-6PK": {
    sku: "OAT-MILK-6PK",
    name: "Barista Oat Milk (6x32oz Case)",
    category: "Dairy & Plant Milk",
    avgDailySales: 4.5,
    leadTimeDays: 3,
    safetyStock: 6,
    reviewPeriodDays: 7,
    onHand: 12,
    onOrder: 12, // 12 cases in-transit from prior PO!
    committed: 0,
    packSize: 1,
    moq: 1,
    lastPaidUnitPrice: 21.5,
  },
  "ESPRESSO-5LB": {
    sku: "ESPRESSO-5LB",
    name: "Colombia Espresso Whole Bean (5lb)",
    category: "Coffee Beans",
    avgDailySales: 1.2,
    leadTimeDays: 5,
    safetyStock: 3,
    reviewPeriodDays: 7,
    onHand: 4,
    onOrder: 0,
    committed: 0,
    packSize: 1,
    moq: 1,
    lastPaidUnitPrice: 64.0,
  },
  "CUPS-12OZ-500": {
    sku: "CUPS-12OZ-500",
    name: "12oz Hot Paper Cups (Sleeve of 500, Pack of 2)",
    category: "Paper Goods & Packaging",
    avgDailySales: 0.8,
    leadTimeDays: 4,
    safetyStock: 2,
    reviewPeriodDays: 7,
    onHand: 3,
    onOrder: 0,
    committed: 0,
    packSize: 2,
    moq: 2,
    lastPaidUnitPrice: 38.0,
  },
  "BURR-GRINDER-SET": {
    sku: "BURR-GRINDER-SET",
    name: "Commercial 83mm Flat Espresso Burrs",
    category: "Espresso Parts",
    avgDailySales: 0.1,
    leadTimeDays: 5,
    safetyStock: 1,
    reviewPeriodDays: 14,
    onHand: 1,
    onOrder: 0,
    committed: 0,
    packSize: 1,
    moq: 1,
    lastPaidUnitPrice: 145.0,
  },
};

class RestockPilotStore {
  mandate: Mandate = { ...SEEDED_MANDATE };
  inventory: Map<string, InventorySkuInput> = new Map();
  purchaseOrders: Map<string, RestockPurchaseOrder> = new Map();
  claims: Map<string, RestockClaim> = new Map();
  ledger: LedgerEntry[] = [];
  processedWebhookIds: Set<string> = new Set();
  spendSoFar: number = 850.0; // Current cycle spend before new orders

  constructor() {
    this.reset();
  }

  reset() {
    this.mandate = { ...SEEDED_MANDATE };
    this.inventory.clear();
    for (const [sku, item] of Object.entries(SEEDED_INVENTORY)) {
      this.inventory.set(sku, { ...item });
    }
    this.purchaseOrders.clear();
    this.claims.clear();
    this.ledger = [];
    this.processedWebhookIds.clear();
    this.spendSoFar = 850.0;

    // Seed baseline ledger entries showing previous verified activity
    this.ledger.push({
      id: "LEDGER-INIT-001",
      timestamp: "2026-11-10T14:32:00Z",
      step: "PO Approved & Captured",
      sku: "OAT-MILK-6PK",
      merchant: "OatDistribution Direct",
      qty: 12,
      total: 258.0,
      savingsVsMedian: 18.0,
      decision: "ALLOW",
      status: "CAPTURED",
      paypalOrderId: "5O190127TN364715T",
      paypalCaptureId: "78G12345TN987654K",
      webhookEventId: "WH-20261110-884102",
      idempotencyHash: computeSha256("PO-OAT-INIT:create:25800"),
      notes: "Prior replenishment cycle in-transit (covers current ROP)",
    });
  }

  getMandate(): Mandate {
    return this.mandate;
  }

  getInventory(): InventorySkuInput[] {
    return Array.from(this.inventory.values());
  }

  getSku(sku: string): InventorySkuInput | undefined {
    return this.inventory.get(sku);
  }

  updateOnOrder(sku: string, qtyToAdd: number) {
    const item = this.inventory.get(sku);
    if (item) {
      item.onOrder = Math.max(0, item.onOrder + qtyToAdd);
      this.inventory.set(sku, item);
    }
  }

  savePurchaseOrder(po: RestockPurchaseOrder) {
    this.purchaseOrders.set(po.id, po);
  }

  getPurchaseOrder(id: string): RestockPurchaseOrder | undefined {
    return this.purchaseOrders.get(id);
  }

  saveClaim(claim: RestockClaim) {
    this.claims.set(claim.poId, claim);
  }

  getClaim(poId: string): RestockClaim | undefined {
    return this.claims.get(poId);
  }

  addLedgerEntry(entry: LedgerEntry) {
    this.ledger.unshift(entry);
  }

  getLedger(): LedgerEntry[] {
    return this.ledger;
  }
}

export const restockStore = new RestockPilotStore();

