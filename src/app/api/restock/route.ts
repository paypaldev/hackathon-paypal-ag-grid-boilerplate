import { NextRequest, NextResponse } from 'next/server';
import {
  restockStore,
  type RestockPurchaseOrder,
} from '@/lib/restock-store';
import {
  computeReorder,
  computeVerifiedPeerMedian,
  evaluateMandate,
  type CandidateOffer,
  type ReorderCalculation,
} from '@/lib/policy';
import {
  createOrderForRestock,
  captureApprovedOrder,
  reconcileUnknownOrder,
  getExecutionMode,
} from '@/lib/paypal';

// Seeded Multi-Merchant Offers simulating live Channel3 catalog lookups
const CHANNEL3_SEEDED_OFFERS: Record<string, CandidateOffer[]> = {
  "ESPRESSO-5LB": [
    {
      id: "C3-OFF-ESP-01",
      sku: "ESPRESSO-5LB",
      merchantName: "CoffeeGadgets Direct",
      title: "Espresso Dosing Scoop Stainless Steel 58mm",
      category: "Coffee Beans",
      condition: "new",
      unitPrice: 8.99,
      totalPrice: 8.99,
      packSize: 1,
      inStock: true,
      sameProduct: false, // Accessory trap
      url: "https://trychannel3.com/products/dosing-scoop-58mm",
    },
    {
      id: "C3-OFF-ESP-02",
      sku: "ESPRESSO-5LB",
      merchantName: "SpecialtyRetail Co",
      title: "Colombia Supremo Whole Bean 12oz Bag",
      category: "Coffee Beans",
      condition: "new",
      unitPrice: 16.5,
      totalPrice: 16.5,
      packSize: 1,
      inStock: true,
      sameProduct: false, // Wrong pack size trap
      url: "https://trychannel3.com/products/colombia-12oz",
    },
    {
      id: "C3-OFF-ESP-03",
      sku: "ESPRESSO-5LB",
      merchantName: "BargainLiquidations",
      title: "Colombia Espresso Whole Bean (5lb) - Expired Clearance Lot",
      category: "Coffee Beans",
      condition: "new",
      unitPrice: 36.0, // Suspicious trap >35% below median!
      totalPrice: 504.0,
      packSize: 1,
      inStock: true,
      sameProduct: true,
      url: "https://trychannel3.com/products/colombia-5lb-clearance",
    },
    {
      id: "C3-OFF-ESP-04",
      sku: "ESPRESSO-5LB",
      merchantName: "RoastSupply Co",
      title: "Colombia Espresso Whole Bean Commercial 5lb Bag",
      category: "Coffee Beans",
      condition: "new",
      unitPrice: 62.0, // Best legitimate offer!
      totalPrice: 868.0, // 14 * 62.0
      packSize: 1,
      inStock: true,
      sameProduct: true,
      url: "https://trychannel3.com/products/roastsupply-colombia-5lb",
    },
    {
      id: "C3-OFF-ESP-05",
      sku: "ESPRESSO-5LB",
      merchantName: "BaristaWholesale USA",
      title: "Colombia Huila Espresso 5lb Bag Fresh Roast",
      category: "Coffee Beans",
      condition: "new",
      unitPrice: 64.5,
      totalPrice: 903.0,
      packSize: 1,
      inStock: true,
      sameProduct: true,
      url: "https://trychannel3.com/products/baristawholesale-5lb",
    },
    {
      id: "C3-OFF-ESP-06",
      sku: "ESPRESSO-5LB",
      merchantName: "PacificCoffee Trade",
      title: "Colombia Supremo Dark Espresso 5lb Bag",
      category: "Coffee Beans",
      condition: "new",
      unitPrice: 68.0,
      totalPrice: 952.0,
      packSize: 1,
      inStock: true,
      sameProduct: true,
      url: "https://trychannel3.com/products/pacific-colombia-5lb",
    },
  ],
  "CUPS-12OZ-500": [
    {
      id: "C3-OFF-CUPS-01",
      sku: "CUPS-12OZ-500",
      merchantName: "EcoPackaging Direct",
      title: "12oz Double-Wall Hot Paper Cups (Sleeve of 500, Pack of 2)",
      category: "Paper Goods & Packaging",
      condition: "new",
      unitPrice: 38.0,
      totalPrice: 304.0, // 8 * 38.0
      packSize: 2,
      inStock: true,
      sameProduct: true,
      url: "https://trychannel3.com/products/ecopackaging-12oz-cups",
    },
    {
      id: "C3-OFF-CUPS-02",
      sku: "CUPS-12OZ-500",
      merchantName: "SupplyDepot USA",
      title: "12oz Hot Paper Cups Case Pack 2 Sleeves",
      category: "Paper Goods & Packaging",
      condition: "new",
      unitPrice: 42.0,
      totalPrice: 336.0,
      packSize: 2,
      inStock: true,
      sameProduct: true,
      url: "https://trychannel3.com/products/supplydepot-12oz-cups",
    },
  ],
  "BURR-GRINDER-SET": [
    {
      id: "C3-OFF-BURR-01",
      sku: "BURR-GRINDER-SET",
      merchantName: "EspressoTech Parts",
      title: "Commercial 83mm Flat Espresso Burrs (Open-Box / Factory Refurbished)",
      category: "Espresso Parts",
      condition: "refurbished", // Triggers ASK gate!
      unitPrice: 145.0,
      totalPrice: 290.0, // 2 * 145.0
      packSize: 1,
      inStock: true,
      sameProduct: true,
      url: "https://trychannel3.com/products/espressotech-83mm-burrs",
    },
  ],
  "OAT-MILK-6PK": [
    {
      id: "C3-OFF-OAT-01",
      sku: "OAT-MILK-6PK",
      merchantName: "OatDistribution Direct",
      title: "Barista Oat Milk (6x32oz Carton Case)",
      category: "Dairy & Plant Milk",
      condition: "new",
      unitPrice: 21.5,
      totalPrice: 0,
      packSize: 1,
      inStock: true,
      sameProduct: true,
      url: "https://trychannel3.com/products/barista-oat-milk-6pk",
    },
  ],
};

export async function GET() {
  const mandate = restockStore.getMandate();
  const inventory = restockStore.getInventory();
  const calculations: ReorderCalculation[] = inventory.map(computeReorder);
  const purchaseOrders = Array.from(restockStore.purchaseOrders.values());
  const claims = Array.from(restockStore.claims.values());
  const ledger = restockStore.getLedger();
  const executionMode = getExecutionMode();

  return NextResponse.json({
    mandate,
    inventory,
    calculations,
    purchaseOrders,
    claims,
    ledger,
    executionMode,
    spendSoFar: restockStore.spendSoFar,
    remainingBudget: Math.max(0, mandate.monthlyBudget - restockStore.spendSoFar),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === "RESET") {
      restockStore.reset();
      return NextResponse.json({ success: true, message: "RestockPilot store reset to seeded café state." });
    }

    if (action === "RUN_CYCLE") {
      const inventory = restockStore.getInventory();
      const mandate = restockStore.getMandate();
      const newOrders: RestockPurchaseOrder[] = [];

      for (const item of inventory) {
        const calc = computeReorder(item);
        if (!calc.needsReorder || calc.suggestedQty <= 0) continue;

        const candidateOffers = CHANNEL3_SEEDED_OFFERS[item.sku] || [];
        const verifiedMedian = computeVerifiedPeerMedian(candidateOffers);

        // Find primary matching offer
        // For ESPRESSO-5LB: offers include 36.0 trap (ASK) and 62.0 valid offer (ALLOW)
        const selectedOffer =
          candidateOffers.find((o) => o.sameProduct && o.inStock && o.unitPrice >= 0.65 * verifiedMedian) ||
          candidateOffers.find((o) => o.sameProduct && o.inStock) ||
          candidateOffers[0];

        if (!selectedOffer) continue;

        const orderTotal = Number((selectedOffer.unitPrice * calc.suggestedQty).toFixed(2));
        const candidateToEval: CandidateOffer = {
          ...selectedOffer,
          totalPrice: orderTotal,
        };

        const policyResult = evaluateMandate(mandate, restockStore.spendSoFar, candidateToEval, verifiedMedian);

        const po: RestockPurchaseOrder = {
          id: `PO-${item.sku}-${Date.now().toString(36).toUpperCase()}`,
          sku: item.sku,
          name: item.name,
          category: item.category,
          qty: calc.suggestedQty,
          unitPrice: selectedOffer.unitPrice,
          totalPrice: orderTotal,
          merchantName: selectedOffer.merchantName,
          merchantUrl: selectedOffer.url,
          packSize: item.packSize || 1,
          verifiedMedianPrice: verifiedMedian,
          lastPaidPrice: item.lastPaidUnitPrice,
          decision: policyResult.decision,
          reasons: policyResult.reasons,
          approvedByOwner: policyResult.decision === "ALLOW", // Auto-approved if ALLOW
          createdAt: new Date().toISOString(),
        };

        restockStore.savePurchaseOrder(po);
        newOrders.push(po);
      }

      return NextResponse.json({
        success: true,
        ordersCreated: newOrders.length,
        orders: newOrders,
        summary: `Cycle executed: ${newOrders.length} purchase order(s) generated.`,
      });
    }

    if (action === "APPROVE_PO") {
      const { poId } = body;
      const po = restockStore.getPurchaseOrder(poId);
      if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });

      po.approvedByOwner = true;
      po.approvedAt = new Date().toISOString();
      restockStore.savePurchaseOrder(po);

      return NextResponse.json({ success: true, po });
    }

    if (action === "CREATE_ORDER") {
      const { poId } = body;
      const result = await createOrderForRestock(poId);
      return NextResponse.json(result);
    }

    if (action === "CAPTURE_ORDER") {
      const { poId, paypalOrderId } = body;
      const result = await captureApprovedOrder(poId, paypalOrderId);
      return NextResponse.json(result);
    }

    if (action === "RECONCILE") {
      const { poId } = body;
      const claim = await reconcileUnknownOrder(poId);
      return NextResponse.json({ success: true, claim });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

