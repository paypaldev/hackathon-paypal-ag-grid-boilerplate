import {
  Client,
  Environment,
  LogLevel,
  SubscriptionsController,
  TransactionSearchController,
} from '@paypal/paypal-server-sdk';

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID!,
    oAuthClientSecret: process.env.PAYPAL_SECRET!,
  },
  timeout: 0,
  environment: Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: {
      logBody: true
    },
    logResponse: {
      logHeaders: true
    }
  },
});

// Transactions from the last 30 days (Transaction Search allows at most 31).
export async function getRecentTransactions(pageSize = 20) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const { result } = await new TransactionSearchController(client).searchTransactions({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    fields: 'all', // include payer info, not just transaction info
    pageSize,
  });
  return result.transactionDetails ?? [];
}

// return=representation includes billing cycles and payment preferences in the list.
export async function getBillingPlans(page = 1) {
  const { result } = await new SubscriptionsController(client).listBillingPlans({
    pageSize: 20,
    page,
    prefer: 'return=representation',
  });
  return result.plans ?? [];
}

// The plans list is capped at 20 per page, so keep paging until a short page.
export async function getAllBillingPlans() {
  const plans = [];
  for (let page = 1; ; page++) {
    const batch = await getBillingPlans(page);
    plans.push(...batch);
    if (batch.length < 20) return plans;
  }
}

export async function getBalances() {
  const { result } = await new TransactionSearchController(client).searchBalances({});
  return result;
}
