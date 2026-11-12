import { describe, it, expect } from "vitest";
import {
  computeReorder,
  computeVerifiedPeerMedian,
  evaluateMandate,
  type InventorySkuInput,
  type CandidateOffer,
  type Mandate,
} from "../src/lib/policy";

describe("RestockPilot Policy & Inventory Engine", () => {
  // Test Mandate
  const sampleMandate: Mandate = {
    id: "MANDATE-SUNRISE-001",
    active: true,
    expiresAt: "2027-01-01T00:00:00Z",
    allowedCategories: ["Coffee Beans", "Dairy & Plant Milk", "Paper Goods & Packaging", "Espresso Parts"],
    maxPerOrder: 1200.0,
    monthlyBudget: 3500.0,
    askFirstOver: 150.0,
    conditionNewOnly: true,
    strictNewBlock: false,
    preferredSellers: ["RoastSupply Co", "BaristaDepot", "EspressoParts Direct"],
  };

  describe("1. Net-Inventory Position & Periodic Review Math", () => {
    it("prevents $838.50 duplicate reorder when in-transit stock covers ROP (OAT-MILK-6PK)", () => {
      const oatMilk: InventorySkuInput = {
        sku: "OAT-MILK-6PK",
        name: "Barista Oat Milk (6x32oz Case)",
        category: "Dairy & Plant Milk",
        avgDailySales: 4.5,
        leadTimeDays: 3,
        safetyStock: 6,
        reviewPeriodDays: 7,
        onHand: 12,
        onOrder: 12, // In-transit from previous order
        committed: 0,
        packSize: 1,
        moq: 1,
        lastPaidUnitPrice: 21.5,
      };

      const result = computeReorder(oatMilk);

      // ROP = 4.5 * 3 + 6 = 19.5
      expect(result.reorderPoint).toBe(19.5);
      // Target S = 19.5 + 4.5 * 7 = 51.0
      expect(result.targetLevel).toBe(51.0);
      // Inventory Position = 12 + 12 - 0 = 24
      expect(result.inventoryPosition).toBe(24);
      // 24 > 19.5 -> needsReorder = false
      expect(result.needsReorder).toBe(false);
      expect(result.suggestedQty).toBe(0);
      // Naive onHand (12 <= 19.5) would have ordered 39 cases: 39 * $21.50 = $838.50
      expect(result.duplicateOrderPreventedSpend).toBe(838.5);
    });

    it("triggers reorder when inventory position is below ROP (ESPRESSO-5LB)", () => {
      const espresso: InventorySkuInput = {
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
      };

      const result = computeReorder(espresso);

      // ROP = 1.2 * 5 + 3 = 9.0
      expect(result.reorderPoint).toBe(9.0);
      // Target S = 9.0 + 1.2 * 7 = 17.4
      expect(result.targetLevel).toBe(17.4);
      // Position = 4
      expect(result.inventoryPosition).toBe(4);
      expect(result.needsReorder).toBe(true);
      // Deficit = 17.4 - 4 = 13.4 -> rounded up to 14 bags
      expect(result.suggestedQty).toBe(14);
    });

    it("enforces supplier case-pack rounding (packSize = 2) for paper cups", () => {
      const cups: InventorySkuInput = {
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
        packSize: 2, // Must buy in pairs of 2 sleeves
        moq: 2,
        lastPaidUnitPrice: 38.0,
      };

      const result = computeReorder(cups);

      // ROP = 0.8 * 4 + 2 = 5.2
      expect(result.reorderPoint).toBe(5.2);
      // Target S = 5.2 + 0.8 * 7 = 10.8
      expect(result.targetLevel).toBe(10.8);
      expect(result.needsReorder).toBe(true);
      // Raw deficit = 10.8 - 3 = 7.8 -> ceil(7.8 / 2) * 2 = 8 sleeves
      expect(result.suggestedQty).toBe(8);
    });
  });

  describe("2. Filtered Channel3 Peer Median Calculation", () => {
    it("excludes accessories, wrong pack sizes, and out-of-stock listings from median", () => {
      const rawOffers: CandidateOffer[] = [
        {
          id: "off-1",
          sku: "ESPRESSO-5LB",
          merchantName: "CoffeeTools",
          title: "Espresso Dosing Scoop Stainless",
          category: "Coffee Beans",
          condition: "new",
          unitPrice: 8.99, // Mismatched accessory
          totalPrice: 8.99,
          packSize: 1,
          inStock: true,
          sameProduct: false, // NOT same product
        },
        {
          id: "off-2",
          sku: "ESPRESSO-5LB",
          merchantName: "BeanRoast",
          title: "Colombia Espresso Beans 12oz Bag",
          category: "Coffee Beans",
          condition: "new",
          unitPrice: 16.5, // Mismatched pack size (12oz vs 5lb)
          totalPrice: 16.5,
          packSize: 1,
          inStock: true,
          sameProduct: false,
        },
        {
          id: "off-3",
          sku: "ESPRESSO-5LB",
          merchantName: "BargainBeans",
          title: "Colombia Espresso Whole Bean (5lb) - Expired Clearance",
          category: "Coffee Beans",
          condition: "new",
          unitPrice: 36.0, // Suspicious low price
          totalPrice: 504.0,
          packSize: 1,
          inStock: true,
          sameProduct: true,
        },
        {
          id: "off-4",
          sku: "ESPRESSO-5LB",
          merchantName: "WholesaleRoasters",
          title: "Colombia Espresso Whole Bean (5lb)",
          category: "Coffee Beans",
          condition: "new",
          unitPrice: 62.0,
          totalPrice: 868.0,
          packSize: 1,
          inStock: true,
          sameProduct: true,
        },
        {
          id: "off-5",
          sku: "ESPRESSO-5LB",
          merchantName: "PrimeCoffee",
          title: "Colombia Espresso Whole Bean (5lb)",
          category: "Coffee Beans",
          condition: "new",
          unitPrice: 64.5,
          totalPrice: 903.0,
          packSize: 1,
          inStock: true,
          sameProduct: true,
        },
        {
          id: "off-6",
          sku: "ESPRESSO-5LB",
          merchantName: "DirectBean",
          title: "Colombia Espresso Whole Bean (5lb)",
          category: "Coffee Beans",
          condition: "new",
          unitPrice: 68.0,
          totalPrice: 952.0,
          packSize: 1,
          inStock: true,
          sameProduct: true,
        },
      ];

      const verifiedMedian = computeVerifiedPeerMedian(rawOffers);

      // Verified pool has 4 items: [36.00, 62.00, 64.50, 68.00]
      // Median of 4 items is average of 62.00 and 64.50 = 63.25
      expect(verifiedMedian).toBe(63.25);
    });

    it("returns 0 if no valid in-stock same-product offers exist", () => {
      const invalidOffers: CandidateOffer[] = [
        {
          id: "off-x",
          sku: "ESPRESSO-5LB",
          merchantName: "FakeShop",
          title: "Out of Stock Teaser",
          category: "Coffee Beans",
          condition: "new",
          unitPrice: 20.0,
          totalPrice: 20.0,
          packSize: 1,
          inStock: false,
          sameProduct: true,
        },
      ];
      expect(computeVerifiedPeerMedian(invalidOffers)).toBe(0);
    });
  });

  describe("3. Non-Short-Circuiting 9-Rule Severity-Lattice Policy Gate", () => {
    it("ALLOWs a valid, in-stock, new offer within budget", () => {
      const validOffer: CandidateOffer[] = [
        {
          id: "off-valid",
          sku: "CUPS-12OZ-500",
          merchantName: "EcoPackaging Direct",
          title: "12oz Hot Paper Cups (Sleeve of 500, Pack of 2)",
          category: "Paper Goods & Packaging",
          condition: "new",
          unitPrice: 38.0,
          totalPrice: 152.0, // <= maxPerOrder (1200) & under budget
          packSize: 2,
          inStock: true,
          sameProduct: true,
        },
      ];

      // Note: askFirstOver is 150.0. 152.0 triggers ASK for threshold.
      // Let's test with totalPrice = 140.0
      const cheapOffer: CandidateOffer = {
        ...validOffer[0],
        totalPrice: 140.0,
        unitPrice: 35.0,
      };

      const result = evaluateMandate(sampleMandate, 500.0, cheapOffer, 38.0);
      expect(result.decision).toBe("ALLOW");
      expect(result.blockReasons).toHaveLength(0);
      expect(result.askReasons).toHaveLength(0);
      expect(result.reasons).toEqual(["All 9 mandate checks passed"]);
    });

    it("catches price-plausibility trap (>35% below median) and routes to ASK", () => {
      const trapOffer: CandidateOffer = {
        id: "off-trap",
        sku: "ESPRESSO-5LB",
        merchantName: "ShadyWholesale",
        title: "Colombia Espresso Whole Bean (5lb) - Liquidation",
        category: "Coffee Beans",
        condition: "new",
        unitPrice: 36.0, // 36 is < 0.65 * 63.25 ($41.11)
        totalPrice: 72.0,
        packSize: 1,
        inStock: true,
        sameProduct: true,
      };

      const result = evaluateMandate(sampleMandate, 200.0, trapOffer, 63.25);
      expect(result.decision).toBe("ASK");
      expect(result.blockReasons).toHaveLength(0);
      expect(result.askReasons.some((r) => r.includes(">35% below verified peer median"))).toBe(true);
    });

    it("routes refurbished equipment to ASK when conditionNewOnly is true", () => {
      const refurbishedGrinder: CandidateOffer = {
        id: "off-burrs",
        sku: "BURR-GRINDER-SET",
        merchantName: "PartsWarehouse",
        title: "Commercial 83mm Flat Espresso Burrs (Open Box / Refurbished)",
        category: "Espresso Parts",
        condition: "refurbished",
        unitPrice: 120.0,
        totalPrice: 120.0,
        packSize: 1,
        inStock: true,
        sameProduct: true,
      };

      const result = evaluateMandate(sampleMandate, 0, refurbishedGrinder, 145.0);
      expect(result.decision).toBe("ASK");
      expect(result.askReasons.some((r) => r.includes("refurbished/open-box"))).toBe(true);
    });

    it("prevents compound masking: an item that is refurbished AND out of budget resolves to BLOCK", () => {
      // If code short-circuits on condition (Rule 7), it might return ASK.
      // Severity lattice MUST return BLOCK because budget (Rule 6) fails!
      const compoundTrapOffer: CandidateOffer = {
        id: "off-compound",
        sku: "BURR-GRINDER-SET",
        merchantName: "OverpricedParts",
        title: "Custom Titanium Burr Set",
        category: "Espresso Parts",
        condition: "refurbished",
        unitPrice: 3800.0,
        totalPrice: 3800.0, // Exceeds both maxPerOrder (1200) and monthlyBudget (3500)
        packSize: 1,
        inStock: true,
        sameProduct: true,
      };

      const result = evaluateMandate(sampleMandate, 100.0, compoundTrapOffer, 150.0);
      expect(result.decision).toBe("BLOCK");
      expect(result.blockReasons.length).toBeGreaterThan(0);
      expect(result.askReasons.length).toBeGreaterThan(0);
      // Both the BLOCK reasons and ASK reasons are preserved in diagnostic reasons
      expect(result.reasons.some((r) => r.includes("exceeds per-order cap"))).toBe(true);
      expect(result.reasons.some((r) => r.includes("refurbished/open-box"))).toBe(true);
    });

    it("BLOCKs disallowed categories, out of stock, and expired mandates", () => {
      const disallowedCategoryOffer: CandidateOffer = {
        id: "off-furniture",
        sku: "LOUNGE-CHAIR",
        merchantName: "LoungeDeco",
        title: "Vintage Leather Café Armchair",
        category: "Furniture & Decor", // Disallowed
        condition: "new",
        unitPrice: 450.0,
        totalPrice: 450.0,
        packSize: 1,
        inStock: true,
        sameProduct: true,
      };

      const res = evaluateMandate(sampleMandate, 0, disallowedCategoryOffer, 450.0);
      expect(res.decision).toBe("BLOCK");
      expect(res.blockReasons[0]).toContain("not in allowed categories");

      // Expired mandate check
      const expiredMandate: Mandate = {
        ...sampleMandate,
        expiresAt: "2025-01-01T00:00:00Z",
      };
      const resExpired = evaluateMandate(expiredMandate, 0, { ...disallowedCategoryOffer, category: "Coffee Beans" }, 450.0);
      expect(resExpired.decision).toBe("BLOCK");
      expect(resExpired.blockReasons.some((r) => r.includes("expired"))).toBe(true);
    });
  });
});

