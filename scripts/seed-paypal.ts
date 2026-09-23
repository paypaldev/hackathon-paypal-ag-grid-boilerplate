// Seeds the PayPal sandbox. Every step is idempotent, so re-running only fills gaps.
// Usage: npm run seed [-- catalog invoices payouts]   (default: all)

import { seedCatalog } from "./seed/catalog.ts";
import { seedInvoices } from "./seed/invoices.ts";
import { seedPayouts } from "./seed/payouts.ts";

const STEPS: Record<string, () => Promise<void>> = {
  catalog: seedCatalog,
  invoices: seedInvoices,
  payouts: seedPayouts,
};

const requested = process.argv.slice(2);
const unknown = requested.filter((name) => !(name in STEPS));
if (unknown.length) {
  console.error(`Unknown step(s): ${unknown.join(", ")}. Choose from: ${Object.keys(STEPS).join(", ")}`);
  process.exit(1);
}

for (const name of requested.length ? requested : Object.keys(STEPS)) {
  console.log(`\n# ${name}`);
  await STEPS[name]();
}
console.log("\nSeed complete.");
