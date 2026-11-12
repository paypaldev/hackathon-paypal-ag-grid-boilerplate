/**
 * RestockPilot — Pure Inventory & Policy Engine (lib/policy.ts)
 * 
 * Strict Invariant: ZERO I/O, ZERO side-effects, 100% deterministic pure functions.
 * Covers:
 *  A. Net-Inventory Position & Case-Pack Rounding Periodic-Review (s, S) Replenishment Math
 *  B. Filtered Channel3 Peer Median Calculation (anti-median-poisoning)
 *  C. Non-Short-Circuiting 9-Rule Severity-Lattice Policy Gate (BLOCK > ASK > ALLOW)
 */

// ============================================================================
// A. Net-Inventory Position & Case-Pack Rounding Math
// ============================================================================

export interface InventorySkuInput {
  sku: string;
  name: string;
  category: string;
  avgDailySales: number;     // d (units / day)
  leadTimeDays: number;      // L (supplier lead time in days)
  safetyStock: number;       // SS (buffer stock)
  reviewPeriodDays?: number; // R (review cycle, default 7 days)
  onHand: number;            // Physical stock currently in café
  onOrder: number;           // In-transit stock from prior approved purchase orders
  committed?: number;        // Stock reserved / allocated (default 0)
  packSize?: number;         // Supplier case/pack multiple (default 1)
  moq?: number;              // Minimum order quantity (default 1)
  lastPaidUnitPrice: number; // Historical benchmark price in USD
}

export interface ReorderCalculation {
  sku: string;
  reorderPoint: number;      // ROP = d * L + SS
  targetLevel: number;       // S = ROP + d * R
  inventoryPosition: number; // onHand + onOrder - committed
  needsReorder: boolean;     // inventoryPosition <= ROP
  rawDeficit: number;        // max(0, S - inventoryPosition)
  suggestedQty: number;      // 0 if !needsReorder, else max(moq, ceil(rawDeficit / packSize) * packSize)
  duplicateOrderPreventedSpend?: number; // Estimated spend prevented by tracking onOrder
}

/**
 * Computes deterministic (s, S) replenishment with case-pack rounding and in-transit tracking.
 * Invariant: Never reorders if onHand + onOrder exceeds reorderPoint (ROP).
 */
export function computeReorder(item: InventorySkuInput): ReorderCalculation {
  const d = Math.max(0, item.avgDailySales);
  const L = Math.max(0, item.leadTimeDays);
  const SS = Math.max(0, item.safetyStock);
  const R = Math.max(1, item.reviewPeriodDays ?? 7);
  const onHand = Math.max(0, item.onHand);
  const onOrder = Math.max(0, item.onOrder);
  const committed = Math.max(0, item.committed ?? 0);
  const packSize = Math.max(1, item.packSize ?? 1);
  const moq = Math.max(1, item.moq ?? 1);

  // ROP = d * L + SS
  const reorderPoint = Number((d * L + SS).toFixed(2));
  // Target Level S = ROP + d * R
  const targetLevel = Number((reorderPoint + d * R).toFixed(2));
  // Net Inventory Position
  const inventoryPosition = Number((onHand + onOrder - committed).toFixed(2));

  // Periodic review trigger: Net Position <= ROP
  const needsReorder = inventoryPosition <= reorderPoint;
  const rawDeficit = needsReorder ? Math.max(0, Number((targetLevel - inventoryPosition).toFixed(2))) : 0;

  let suggestedQty = 0;
  if (needsReorder && rawDeficit > 0) {
    const packsNeeded = Math.ceil(rawDeficit / packSize);
    const roundedQty = packsNeeded * packSize;
    suggestedQty = Math.max(moq, roundedQty);
  }

  // Calculate duplicate spend prevented: what naive onHand <= ROP would order if onOrder was ignored
  let duplicateOrderPreventedSpend = 0;
  if (onOrder > 0) {
    const naiveInvPos = onHand - committed;
    if (naiveInvPos <= reorderPoint && !needsReorder) {
      const naiveDeficit = Math.max(0, targetLevel - naiveInvPos);
      const naivePacks = Math.ceil(naiveDeficit / packSize);
      const naiveQty = Math.max(moq, naivePacks * packSize);
      duplicateOrderPreventedSpend = Number((naiveQty * item.lastPaidUnitPrice).toFixed(2));
    }
  }

  return {
    sku: item.sku,
    reorderPoint,
    targetLevel,
    inventoryPosition,
    needsReorder,
    rawDeficit,
    suggestedQty,
    duplicateOrderPreventedSpend,
  };
}

// ============================================================================
// B. Filtered Channel3 Peer Median Calculation
// ============================================================================

export interface CandidateOffer {
  id: string;
  sku: string;
  merchantName: string;
  title: string;
  category: string;
  condition: 'new' | 'refurbished' | 'used' | 'open_box';
  unitPrice: number;
  totalPrice: number;
  packSize: number;
  inStock: boolean;
  sameProduct: boolean;
  sellerRating?: number;
  url?: string;
  imageUrl?: string;
}

/**
 * Computes the verified peer median unitPrice across candidate supplier offers.
 * CRITICAL ANTI-POISONING GUARD:
 * Filters out offers where sameProduct === false (accessories, wrong pack sizes)
 * and inStock === false (teaser/fake listings) BEFORE computing the median.
 */
export function computeVerifiedPeerMedian(offers: CandidateOffer[]): number {
  if (!offers || offers.length === 0) return 0;

  // Filter to valid candidate pool
  const verifiedOffers = offers.filter(
    (o) => o.sameProduct === true && o.inStock === true && o.unitPrice > 0
  );

  if (verifiedOffers.length === 0) return 0;

  // Sort prices ascending
  const prices = verifiedOffers.map((o) => o.unitPrice).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);

  if (prices.length % 2 === 1) {
    return Number(prices[mid].toFixed(2));
  } else {
    return Number(((prices[mid - 1] + prices[mid]) / 2).toFixed(2));
  }
}

// ============================================================================
// C. Non-Short-Circuiting 9-Rule Severity-Lattice Policy Gate
// ============================================================================

export interface Mandate {
  id: string;
  active: boolean;
  expiresAt: string; // ISO 8601 timestamp string
  allowedCategories: string[];
  maxPerOrder: number;
  monthlyBudget: number;
  askFirstOver: number;
  conditionNewOnly: boolean;
  strictNewBlock: boolean; // true for food/beverage consumables -> BLOCK; false for equipment -> ASK
  preferredSellers: string[];
}

export type PolicyDecision = "ALLOW" | "ASK" | "BLOCK";

export interface PolicyEvaluationResult {
  decision: PolicyDecision;
  reasons: string[];
  blockReasons: string[];
  askReasons: string[];
  rulesPassed: string[];
  verifiedMedianPrice: number;
  evaluatedAt: string;
}

/**
 * 9-Rule Severity-Lattice Policy Gate.
 * Evaluates all 9 rules in fixed order WITHOUT short-circuiting.
 * Severity Resolution: BLOCK > ASK > ALLOW.
 */
export function evaluateMandate(
  mandate: Mandate,
  spendSoFar: number,
  offer: CandidateOffer,
  verifiedMedianPrice: number,
  now: Date | string = new Date()
): PolicyEvaluationResult {
  const blockReasons: string[] = [];
  const askReasons: string[] = [];
  const rulesPassed: string[] = [];
  const currentDate = typeof now === 'string' ? new Date(now) : now;
  const expiryDate = new Date(mandate.expiresAt);

  // 1. Mandate Active & Unexpired
  if (!mandate.active) {
    blockReasons.push("Mandate is inactive");
  } else if (currentDate.getTime() > expiryDate.getTime()) {
    blockReasons.push(`Mandate expired on ${mandate.expiresAt}`);
  } else {
    rulesPassed.push("Rule 1: Mandate is active and unexpired");
  }

  // 2. Category Allowed
  const isCategoryAllowed = mandate.allowedCategories.some(
    (cat) => cat.toLowerCase() === offer.category.toLowerCase()
  );
  if (!isCategoryAllowed) {
    blockReasons.push(
      `Category '${offer.category}' is not in allowed categories: [${mandate.allowedCategories.join(", ")}]`
    );
  } else {
    rulesPassed.push(`Rule 2: Category '${offer.category}' is allowed`);
  }

  // 3. In Stock
  if (offer.inStock !== true) {
    blockReasons.push("Offer is currently out of stock");
  } else {
    rulesPassed.push("Rule 3: Item is in stock");
  }

  // 4. Same Product & Pack Match
  if (offer.sameProduct !== true) {
    blockReasons.push("Offer does not match target SKU specification or pack size");
  } else {
    rulesPassed.push("Rule 4: Exact product and pack-size specification match verified");
  }

  // 5. Per-Order Cap
  if (offer.totalPrice > mandate.maxPerOrder) {
    blockReasons.push(
      `Order total $${offer.totalPrice.toFixed(2)} exceeds per-order cap of $${mandate.maxPerOrder.toFixed(2)}`
    );
  } else {
    rulesPassed.push(`Rule 5: Order total $${offer.totalPrice.toFixed(2)} is within per-order cap`);
  }

  // 6. Monthly Budget Cap
  const projectedTotalSpend = spendSoFar + offer.totalPrice;
  if (projectedTotalSpend > mandate.monthlyBudget) {
    blockReasons.push(
      `Projected monthly spend $${projectedTotalSpend.toFixed(2)} (current: $${spendSoFar.toFixed(2)} + order: $${offer.totalPrice.toFixed(2)}) breaches monthly budget of $${mandate.monthlyBudget.toFixed(2)}`
    );
  } else {
    rulesPassed.push(
      `Rule 6: Projected monthly spend $${projectedTotalSpend.toFixed(2)} is within monthly budget of $${mandate.monthlyBudget.toFixed(2)}`
    );
  }

  // 7. Condition Check
  if (offer.condition !== 'new') {
    const isConsumable = ['coffee', 'dairy', 'milk', 'syrup', 'beverage', 'food', 'consumables', 'cups'].some(
      (keyword) => offer.category.toLowerCase().includes(keyword)
    );

    if (mandate.strictNewBlock || isConsumable) {
      blockReasons.push(
        `Item condition is '${offer.condition}'; strict new-condition policy enforced for consumables`
      );
    } else if (mandate.conditionNewOnly) {
      askReasons.push(
        `Item condition is '${offer.condition}' (refurbished/open-box) — requires owner review`
      );
    } else {
      rulesPassed.push(`Rule 7: Non-new condition '${offer.condition}' accepted by policy`);
    }
  } else {
    rulesPassed.push("Rule 7: Item condition is brand new");
  }

  // 8. Price Plausibility vs. Verified Peer Median
  if (verifiedMedianPrice > 0 && offer.unitPrice < 0.65 * verifiedMedianPrice) {
    const diffPct = Math.round(((verifiedMedianPrice - offer.unitPrice) / verifiedMedianPrice) * 100);
    askReasons.push(
      `Unit price $${offer.unitPrice.toFixed(2)} is >35% below verified peer median ($${verifiedMedianPrice.toFixed(2)}, -${diffPct}%) — verify not counterfeit, expired, or wrong unit size`
    );
  } else {
    rulesPassed.push(
      verifiedMedianPrice > 0
        ? `Rule 8: Price $${offer.unitPrice.toFixed(2)} aligns with verified peer median $${verifiedMedianPrice.toFixed(2)}`
        : "Rule 8: Price plausibility check skipped (no verified peer median available)"
    );
  }

  // 9. Ask-First Dollar Threshold
  if (offer.totalPrice > mandate.askFirstOver) {
    askReasons.push(
      `Order total $${offer.totalPrice.toFixed(2)} exceeds owner auto-approval threshold of $${mandate.askFirstOver.toFixed(2)}`
    );
  } else {
    rulesPassed.push(
      `Rule 9: Order total $${offer.totalPrice.toFixed(2)} is under auto-approval threshold ($${mandate.askFirstOver.toFixed(2)})`
    );
  }

  // Severity Lattice Resolution: BLOCK > ASK > ALLOW
  let decision: PolicyDecision = "ALLOW";
  let combinedReasons: string[] = [];

  if (blockReasons.length > 0) {
    decision = "BLOCK";
    combinedReasons = [...blockReasons, ...askReasons];
  } else if (askReasons.length > 0) {
    decision = "ASK";
    combinedReasons = askReasons;
  } else {
    decision = "ALLOW";
    combinedReasons = ["All 9 mandate checks passed"];
  }

  return {
    decision,
    reasons: combinedReasons,
    blockReasons,
    askReasons,
    rulesPassed,
    verifiedMedianPrice,
    evaluatedAt: currentDate.toISOString(),
  };
}
