import { NextRequest, NextResponse } from 'next/server';
import { restockStore, type RestockPurchaseOrder } from '@/lib/restock-store';
import {
  computeReorder,
  computeVerifiedPeerMedian,
  evaluateMandate,
  type CandidateOffer,
} from '@/lib/policy';

/**
 * RestockPilot Read-Only Model Context Protocol (MCP) Server
 * Protocol Version: 2024-11-05 (Streamable HTTP JSON-RPC 2.0)
 * 
 * STRICT SECURITY INVARIANT:
 * Zero money-moving tools. AI agents can only read status, check inventory,
 * get quotes, and create DRAFT proposals awaiting owner approval.
 */

export const MCP_TOOLS = [
  {
    name: 'get_mandate',
    description: 'Returns current active café mandate, spending caps, and remaining monthly budget.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_low_stock',
    description:
      'Runs deterministic Net-Inventory Position math across all café SKUs and returns items needing reorder (plus items skipped due to onOrder in-transit stock).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_quotes',
    description:
      'Queries Channel3 / seeded multi-merchant offers for a SKU and returns offers with verifiedPeerMedian.',
    inputSchema: {
      type: 'object',
      properties: {
        sku: { type: 'string', description: 'Target café SKU, e.g. ESPRESSO-5LB' },
      },
      required: ['sku'],
    },
  },
  {
    name: 'propose_reorder',
    description:
      'Runs the 9-rule Severity-Lattice gate on an offer and creates a local DRAFT proposal awaiting human approval in the UI.',
    inputSchema: {
      type: 'object',
      properties: {
        sku: { type: 'string', description: 'Target café SKU' },
        offerId: { type: 'string', description: 'Selected Channel3 candidate offer ID' },
        qty: { type: 'number', description: 'Quantity to order' },
      },
      required: ['sku', 'offerId', 'qty'],
    },
  },
];

// Forbidden Money-Moving Tools List (Used by Security Audits)
export const FORBIDDEN_MONEY_TOOLS = [
  'pay',
  'capture',
  'approve',
  'refund',
  'payout',
  'update_mandate',
  'execute_payment',
  'transfer',
  'override_budget',
];

// Seeded Multi-Merchant Channel3 Quotes
const CHANNEL3_MCP_OFFERS: Record<string, CandidateOffer[]> = {
  'ESPRESSO-5LB': [
    {
      id: 'C3-OFF-ESP-01',
      sku: 'ESPRESSO-5LB',
      merchantName: 'CoffeeGadgets Direct',
      title: 'Espresso Dosing Scoop Stainless Steel 58mm',
      category: 'Coffee Beans',
      condition: 'new',
      unitPrice: 8.99,
      totalPrice: 8.99,
      packSize: 1,
      inStock: true,
      sameProduct: false,
    },
    {
      id: 'C3-OFF-ESP-03',
      sku: 'ESPRESSO-5LB',
      merchantName: 'BargainLiquidations',
      title: 'Colombia Espresso Whole Bean (5lb) - Expired Clearance Lot',
      category: 'Coffee Beans',
      condition: 'new',
      unitPrice: 36.0,
      totalPrice: 504.0,
      packSize: 1,
      inStock: true,
      sameProduct: true,
    },
    {
      id: 'C3-OFF-ESP-04',
      sku: 'ESPRESSO-5LB',
      merchantName: 'RoastSupply Co',
      title: 'Colombia Espresso Whole Bean Commercial 5lb Bag',
      category: 'Coffee Beans',
      condition: 'new',
      unitPrice: 62.0,
      totalPrice: 868.0,
      packSize: 1,
      inStock: true,
      sameProduct: true,
    },
    {
      id: 'C3-OFF-ESP-05',
      sku: 'ESPRESSO-5LB',
      merchantName: 'BaristaWholesale USA',
      title: 'Colombia Huila Espresso 5lb Bag Fresh Roast',
      category: 'Coffee Beans',
      condition: 'new',
      unitPrice: 64.5,
      totalPrice: 903.0,
      packSize: 1,
      inStock: true,
      sameProduct: true,
    },
    {
      id: 'C3-OFF-ESP-06',
      sku: 'ESPRESSO-5LB',
      merchantName: 'PacificCoffee Trade',
      title: 'Colombia Supremo Dark Espresso 5lb Bag',
      category: 'Coffee Beans',
      condition: 'new',
      unitPrice: 68.0,
      totalPrice: 952.0,
      packSize: 1,
      inStock: true,
      sameProduct: true,
    },
  ],
  'CUPS-12OZ-500': [
    {
      id: 'C3-OFF-CUPS-01',
      sku: 'CUPS-12OZ-500',
      merchantName: 'EcoPackaging Direct',
      title: '12oz Double-Wall Hot Paper Cups (Sleeve of 500, Pack of 2)',
      category: 'Paper Goods & Packaging',
      condition: 'new',
      unitPrice: 38.0,
      totalPrice: 304.0,
      packSize: 2,
      inStock: true,
      sameProduct: true,
    },
  ],
  'BURR-GRINDER-SET': [
    {
      id: 'C3-OFF-BURR-01',
      sku: 'BURR-GRINDER-SET',
      merchantName: 'EspressoTech Parts',
      title: 'Commercial 83mm Flat Espresso Burrs (Open-Box / Factory Refurbished)',
      category: 'Espresso Parts',
      condition: 'refurbished',
      unitPrice: 145.0,
      totalPrice: 290.0,
      packSize: 1,
      inStock: true,
      sameProduct: true,
    },
  ],
  'OAT-MILK-6PK': [
    {
      id: 'C3-OFF-OAT-01',
      sku: 'OAT-MILK-6PK',
      merchantName: 'OatDistribution Direct',
      title: 'Barista Oat Milk (6x32oz Carton Case)',
      category: 'Dairy & Plant Milk',
      condition: 'new',
      unitPrice: 21.5,
      totalPrice: 0,
      packSize: 1,
      inStock: true,
      sameProduct: true,
    },
  ],
};

/**
 * GET /api/mcp
 * MCP Server Health & Capabilities Discovery
 */
export async function GET() {
  return NextResponse.json({
    jsonrpc: '2.0',
    server: 'RestockPilot Model Context Protocol Server',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {
        listChanged: false,
      },
    },
    readOnly: true,
    securityPolicy: 'STRICT_HUMAN_IN_THE_LOOP',
    moneyMovingToolsExposed: 0,
    toolsCount: MCP_TOOLS.length,
    tools: MCP_TOOLS.map((t) => t.name),
  });
}

/**
 * POST /api/mcp
 * JSON-RPC 2.0 Handler
 */
export async function POST(req: NextRequest) {
  try {
    const rpc = await req.json();
    const id = rpc.id ?? 1;
    const method = rpc.method;
    const params = rpc.params || {};

    // 1. initialize
    if (method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {
              listChanged: false,
            },
          },
          serverInfo: {
            name: 'restockpilot-mcp',
            version: '1.0.0',
          },
        },
      });
    }

    // 2. tools/list
    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS,
        },
      });
    }

    // 3. tools/call
    if (method === 'tools/call') {
      const toolName = params.name as string;
      const args = params.arguments || {};

      // Hard Security Check: Reject forbidden money-moving tools immediately
      if (FORBIDDEN_MONEY_TOOLS.includes(toolName.toLowerCase())) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32000,
            message: `SECURITY ERROR: Tool '${toolName}' is forbidden. RestockPilot MCP server is strictly read-and-propose only; AI agents cannot move money or approve purchases.`,
          },
        });
      }

      // Execute: get_mandate
      if (toolName === 'get_mandate') {
        const mandate = restockStore.getMandate();
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  mandate,
                  spendSoFar: restockStore.spendSoFar,
                  remainingBudget: Math.max(0, mandate.monthlyBudget - restockStore.spendSoFar),
                }),
              },
            ],
          },
        });
      }

      // Execute: get_low_stock
      if (toolName === 'get_low_stock') {
        const inventory = restockStore.getInventory();
        const calculations = inventory.map(computeReorder);
        const lowStock = calculations.filter((c) => c.needsReorder);
        const inTransitSkipped = calculations.filter(
          (c) => !c.needsReorder && (c.duplicateOrderPreventedSpend ?? 0) > 0
        );

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  lowStockItems: lowStock,
                  inTransitDuplicatePreventedItems: inTransitSkipped,
                  totalDuplicateSpendPrevented: inTransitSkipped.reduce(
                    (s, c) => s + (c.duplicateOrderPreventedSpend || 0),
                    0
                  ),
                }),
              },
            ],
          },
        });
      }

      // Execute: get_quotes
      if (toolName === 'get_quotes') {
        const sku = args.sku as string;
        const candidateOffers = CHANNEL3_MCP_OFFERS[sku] || [];
        const verifiedMedian = computeVerifiedPeerMedian(candidateOffers);

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  sku,
                  verifiedPeerMedianPrice: verifiedMedian,
                  offersCount: candidateOffers.length,
                  offers: candidateOffers,
                }),
              },
            ],
          },
        });
      }

      // Execute: propose_reorder
      if (toolName === 'propose_reorder') {
        const { sku, offerId, qty } = args;
        const item = restockStore.getSku(sku);
        if (!item) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Unknown SKU: ${sku}` },
          });
        }

        const candidateOffers = CHANNEL3_MCP_OFFERS[sku] || [];
        const verifiedMedian = computeVerifiedPeerMedian(candidateOffers);
        const offer = candidateOffers.find((o) => o.id === offerId) || candidateOffers[0];

        if (!offer) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Offer not found: ${offerId}` },
          });
        }

        const orderTotal = Number((offer.unitPrice * qty).toFixed(2));
        const candidateToEval: CandidateOffer = {
          ...offer,
          totalPrice: orderTotal,
        };

        const mandate = restockStore.getMandate();
        const gate = evaluateMandate(mandate, restockStore.spendSoFar, candidateToEval, verifiedMedian);

        const po: RestockPurchaseOrder = {
          id: `PO-${sku}-${Date.now().toString(36).toUpperCase()}`,
          sku,
          name: item.name,
          category: item.category,
          qty,
          unitPrice: offer.unitPrice,
          totalPrice: orderTotal,
          merchantName: offer.merchantName,
          merchantUrl: offer.url,
          packSize: item.packSize || 1,
          verifiedMedianPrice: verifiedMedian,
          lastPaidPrice: item.lastPaidUnitPrice,
          decision: gate.decision,
          reasons: gate.reasons,
          approvedByOwner: gate.decision === 'ALLOW',
          createdAt: new Date().toISOString(),
        };

        restockStore.savePurchaseOrder(po);

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  proposalId: po.id,
                  decision: gate.decision,
                  reasons: gate.reasons,
                  totalPrice: orderTotal,
                  status: 'DRAFT_AWAITING_OWNER_APPROVAL',
                  notice:
                    'Proposal recorded in local store. Purchase can only proceed after owner review and PayPal approval.',
                }),
              },
            ],
          },
        });
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method or tool not found: ${toolName}` },
      });
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32600, message: `Invalid Request: unsupported method ${method}` },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32603, message: `Internal error: ${msg}` },
    });
  }
}
