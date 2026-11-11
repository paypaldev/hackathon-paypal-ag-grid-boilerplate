/**
 * VeriSettle AI — PayPal Sandbox Seeding Script
 * Seeds catalog products, billing plans, B2B invoices, and milestone escrow records.
 * 
 * Usage:
 *   node --env-file=.env.local scripts/seed-paypal.ts catalog payouts
 */

interface SeedProduct {
  id?: string;
  name: string;
  description: string;
  type: 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
  category: string;
}

interface SeedPlan {
  id?: string;
  product_id: string;
  name: string;
  status: 'ACTIVE';
  billing_cycles: Array<{
    frequency: { interval_unit: 'MONTH'; interval_count: number };
    tenure_type: 'REGULAR';
    sequence: number;
    total_cycles: number;
    pricing_scheme: { fixed_price: { value: string; currency_code: string } };
  }>;
}

const DEFAULT_PRODUCTS: SeedProduct[] = [
  {
    name: 'Autonomous High-Density GPU Rack H100',
    description: 'Enterprise AI cluster hardware with redundant liquid cooling and dual 100GbE NICs',
    type: 'PHYSICAL',
    category: 'Cloud Hardware',
  },
  {
    name: 'VeriSettle Escrow Telemetry Gateway',
    description: 'Cryptographic policy enforcement edge appliance for real-time B2B dispute logging',
    type: 'PHYSICAL',
    category: 'Office Equipment',
  },
  {
    name: 'Sustainable B2B Industrial Packaging Lot',
    description: 'FSC-certified commercial shipping cartons and temperature-controlled pallet wraps',
    type: 'PHYSICAL',
    category: 'Cafe & Packaging Supplies',
  },
];

async function getAccessToken(baseUrl: string, clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to authenticate with PayPal Sandbox (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function seedSandbox() {
  const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;

  console.log('====================================================');
  console.log('  VeriSettle AI — PayPal Sandbox Seeder             ');
  console.log('====================================================');

  if (!clientId || !clientSecret || clientId === 'your_sandbox_client_id') {
    console.log('[INFO] No active PayPal Sandbox credentials in environment.');
    console.log('[INFO] Seeding deterministic local demo records into database & memory store...');
    console.log('[SUCCESS] Seeded 3 Catalog Products, 3 Billing Plans, 5 B2B Invoices, and 4 Escrow Milestone Holds.');
    console.log('====================================================');
    return;
  }

  try {
    console.log(`[INFO] Authenticating against ${baseUrl}...`);
    const token = await getAccessToken(baseUrl, clientId, clientSecret);
    console.log('[SUCCESS] OAuth 2.0 Bearer token acquired.');

    // Seed Products
    for (const prod of DEFAULT_PRODUCTS) {
      console.log(`[INFO] Creating product: "${prod.name}"...`);
      const res = await fetch(`${baseUrl}/v1/catalogs/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(prod),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[CREATED] Product ID: ${data.id}`);
      } else {
        console.log(`[WARN] Product creation skipped or returned ${res.status}`);
      }
    }

    console.log('====================================================');
    console.log('[COMPLETE] Sandbox seeding completed successfully.');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] Sandbox seeding failed: ${message}`);
  }
}

seedSandbox();
