// Catalog products and subscription billing plans.
// Products use fixed ids and plans are matched by name, so re-runs skip existing data.

import {
  getProduct,
  listPlans,
  paypalRequest,
  type BillingCycle,
  type IntervalUnit,
  type PlanStatus,
  type Product,
  type ProductType,
} from "../../lib/paypal.ts";

type PlanSeed = {
  name: string;
  interval: IntervalUnit;
  intervalCount?: number;
  price: string;
  trialDays?: number;
  setupFee?: string;
  status?: PlanStatus;
};

type ProductSeed = {
  id: string;
  name: string;
  description: string;
  type: ProductType;
  category: string;
  plans: PlanSeed[];
};

const CURRENCY = "USD";

const SEED: ProductSeed[] = [
  {
    id: "AGGRID-CLOUD-STORAGE",
    name: "Cloud Storage",
    description: "Encrypted file storage and sync across devices",
    type: "SERVICE",
    category: "SOFTWARE",
    plans: [
      { name: "Cloud Storage Basic (100 GB)", interval: "MONTH", price: "2.99", trialDays: 30 },
      { name: "Cloud Storage Plus (1 TB)", interval: "MONTH", price: "9.99" },
      { name: "Cloud Storage Plus (1 TB) Annual", interval: "YEAR", price: "99.00" },
      { name: "Cloud Storage Legacy (50 GB)", interval: "MONTH", price: "1.99", status: "INACTIVE" },
    ],
  },
  {
    id: "AGGRID-MUSIC-STREAMING",
    name: "Music Streaming",
    description: "Ad-free music streaming with offline downloads",
    type: "DIGITAL",
    category: "DIGITAL_MEDIA_BOOKS_MOVIES_MUSIC",
    plans: [
      { name: "Music Individual", interval: "MONTH", price: "10.99", trialDays: 30 },
      { name: "Music Duo", interval: "MONTH", price: "14.99", trialDays: 30 },
      { name: "Music Family", interval: "MONTH", price: "16.99", trialDays: 14 },
      { name: "Music Student", interval: "MONTH", price: "5.99", status: "CREATED" },
    ],
  },
  {
    id: "AGGRID-FITNESS-COACHING",
    name: "Fitness Coaching",
    description: "Personalised training programs with weekly coach check-ins",
    type: "SERVICE",
    category: "HEALTH_AND_PERSONAL_CARE",
    plans: [
      { name: "Fitness Weekly Check-in", interval: "WEEK", price: "19.00", setupFee: "25.00" },
      { name: "Fitness Monthly Coaching", interval: "MONTH", price: "59.00", setupFee: "25.00" },
      { name: "Fitness Quarterly Coaching", interval: "MONTH", intervalCount: 3, price: "159.00" },
    ],
  },
  {
    id: "AGGRID-MEAL-KIT",
    name: "Meal Kit Delivery",
    description: "Weekly boxes of fresh ingredients and recipes",
    type: "PHYSICAL",
    category: "FOOD_RETAIL_AND_SERVICE",
    plans: [
      { name: "Meal Kit 2 People x 3 Meals", interval: "WEEK", price: "59.94" },
      { name: "Meal Kit 4 People x 3 Meals", interval: "WEEK", price: "99.90" },
      { name: "Meal Kit 4 People x 5 Meals", interval: "WEEK", price: "149.85", status: "INACTIVE" },
    ],
  },
  {
    id: "AGGRID-NEWS-DIGEST",
    name: "Daily News Digest",
    description: "Curated morning news briefing with full archive access",
    type: "DIGITAL",
    category: "NEWS_DEALERS_AND_NEWSTANDS",
    plans: [
      { name: "News Digital Monthly", interval: "MONTH", price: "4.99", trialDays: 7 },
      { name: "News Digital Annual", interval: "YEAR", price: "49.99" },
      { name: "News Digital + Print", interval: "MONTH", price: "19.99", setupFee: "5.00" },
    ],
  },
];

function billingCycles(plan: PlanSeed): BillingCycle[] {
  const regular: BillingCycle = {
    frequency: { interval_unit: plan.interval, interval_count: plan.intervalCount ?? 1 },
    tenure_type: "REGULAR",
    sequence: plan.trialDays ? 2 : 1,
    total_cycles: 0, // bill until cancelled
    pricing_scheme: { fixed_price: { value: plan.price, currency_code: CURRENCY } },
  };
  if (!plan.trialDays) return [regular];
  // Free trial: a TRIAL cycle without a pricing scheme precedes the REGULAR cycle.
  const trial: BillingCycle = {
    frequency: { interval_unit: "DAY", interval_count: plan.trialDays },
    tenure_type: "TRIAL",
    sequence: 1,
    total_cycles: 1,
  };
  return [trial, regular];
}

async function seedProduct(seed: ProductSeed): Promise<void> {
  if (await getProduct(seed.id)) {
    console.log(`= product ${seed.id} exists`);
  } else {
    const product = await paypalRequest<Product>(
      "POST",
      "/v1/catalogs/products",
      {
        id: seed.id,
        name: seed.name,
        description: seed.description,
        type: seed.type,
        category: seed.category,
      },
      `seed-product-${seed.id}`,
    );
    console.log(`+ product ${product.id} (${product.name})`);
  }

  const existing = new Set((await listPlans(seed.id)).map((plan) => plan.name));
  for (const plan of seed.plans) {
    if (existing.has(plan.name)) {
      console.log(`  = plan "${plan.name}" exists`);
      continue;
    }
    const created = await paypalRequest<{ id: string; status: PlanStatus }>(
      "POST",
      "/v1/billing/plans",
      {
        product_id: seed.id,
        name: plan.name,
        description: `${seed.name}: ${plan.name}`,
        status: plan.status ?? "ACTIVE",
        billing_cycles: billingCycles(plan),
        payment_preferences: {
          auto_bill_outstanding: true,
          payment_failure_threshold: 3,
          setup_fee_failure_action: "CONTINUE",
          ...(plan.setupFee && {
            setup_fee: { value: plan.setupFee, currency_code: CURRENCY },
          }),
        },
      },
    );
    console.log(`  + plan ${created.id} "${plan.name}" [${created.status}]`);
  }
}

export async function seedCatalog(): Promise<void> {
  for (const product of SEED) {
    await seedProduct(product);
  }
}
