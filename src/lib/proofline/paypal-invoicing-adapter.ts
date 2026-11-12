import 'server-only';
import { getPayPalAccessToken, isUsingSimulatedToken, generateRequestId } from '@/lib/paypal-auth';
import type { CurrencyCode, ProoflineInvoiceStatus } from './types';

const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

export interface CreateInvoicePayload {
  projectId: string;
  milestoneId: string;
  scopeVersionId: string;
  invoiceNumber: string;
  amountMinor: number;
  currency: CurrencyCode;
  clientEmail: string;
  clientBusinessName?: string;
  itemTitle: string;
  itemDescription?: string;
  note?: string;
}

export interface InvoiceAdapterResponse {
  success: boolean;
  providerInvoiceId: string | null;
  status: ProoflineInvoiceStatus;
  rawStatus?: string;
  hostedPaymentUrl?: string;
  paypalDebugId?: string;
  simulated: boolean;
  error?: string;
}

/**
 * Creates a real PayPal Invoicing v2 draft on Sandbox.
 * (POST /v2/invoicing/invoices)
 */
export async function createPayPalInvoiceOnSandbox(
  payload: CreateInvoicePayload
): Promise<InvoiceAdapterResponse> {
  const token = await getPayPalAccessToken();
  const isSimulated = isUsingSimulatedToken();
  const requestId = generateRequestId(`proof-inv-${payload.milestoneId}`);

  const majorAmount = (payload.amountMinor / 100).toFixed(2);

  if (isSimulated) {
    const simInvoiceId = `INV2-SIM-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      providerInvoiceId: simInvoiceId,
      status: 'CREATED',
      rawStatus: 'DRAFT',
      hostedPaymentUrl: `https://www.sandbox.paypal.com/invoice/p/#${simInvoiceId}`,
      paypalDebugId: `SIM-DBG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      simulated: true,
    };
  }

  const invoiceBody = {
    detail: {
      invoice_number: payload.invoiceNumber,
      currency_code: payload.currency,
      note: payload.note || 'Issued via Proofline Versioned Escrow & Milestone System',
      payment_term: {
        term_type: 'DUE_ON_RECEIPT',
      },
    },
    invoicer: {
      business_name: 'Independent Freelance Studio',
    },
    primary_recipients: [
      {
        billing_info: {
          email_address: payload.clientEmail,
          business_name: payload.clientBusinessName || 'Valued Client',
        },
      },
    ],
    items: [
      {
        name: payload.itemTitle,
        description: payload.itemDescription || `Delivery for milestone ${payload.milestoneId}`,
        quantity: '1',
        unit_amount: {
          currency_code: payload.currency,
          value: majorAmount,
        },
      },
    ],
    amount: {
      currency_code: payload.currency,
      value: majorAmount,
    },
    configuration: {
      allow_tip: false,
      tax_calculated_after_discount: true,
      tax_inclusive: false,
    },
  };

  try {
    const res = await fetch(`${PAYPAL_BASE_URL}/v2/invoicing/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'PayPal-Request-Id': requestId,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(invoiceBody),
    });

    const debugId = res.headers.get('paypal-debug-id') || undefined;

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        providerInvoiceId: null,
        status: 'FAILED_OR_UNKNOWN',
        paypalDebugId: debugId,
        simulated: false,
        error: `PayPal Invoicing API error (${res.status}): ${errText.slice(0, 300)}`,
      };
    }

    const data = (await res.json()) as Record<string, unknown>;
    const invId = (data.id as string) || (data.invoice_id as string);

    // Find client payment URL if provided in links
    const links = data.links as Array<{ rel?: string; href?: string }> | undefined;
    const paymentLink = links?.find((l) => l.rel === 'payer-view' || l.rel === 'self');

    return {
      success: true,
      providerInvoiceId: invId,
      status: 'CREATED',
      rawStatus: (data.status as string) || 'DRAFT',
      hostedPaymentUrl: paymentLink?.href || `https://www.sandbox.paypal.com/invoice/p/#${invId}`,
      paypalDebugId: debugId,
      simulated: false,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      providerInvoiceId: null,
      status: 'FAILED_OR_UNKNOWN',
      simulated: false,
      error: `Network failure connecting to PayPal Invoicing: ${msg}`,
    };
  }
}

/**
 * Sends a created PayPal Invoice to the recipient.
 * (POST /v2/invoicing/invoices/{id}/send)
 */
export async function sendPayPalInvoiceOnSandbox(
  providerInvoiceId: string
): Promise<InvoiceAdapterResponse> {
  const token = await getPayPalAccessToken();
  const isSimulated = isUsingSimulatedToken() || providerInvoiceId.includes('SIM');
  const requestId = generateRequestId(`send-${providerInvoiceId}`);

  if (isSimulated) {
    return {
      success: true,
      providerInvoiceId,
      status: 'SENT',
      rawStatus: 'SENT',
      hostedPaymentUrl: `https://www.sandbox.paypal.com/invoice/p/#${providerInvoiceId}`,
      simulated: true,
    };
  }

  try {
    const res = await fetch(`${PAYPAL_BASE_URL}/v2/invoicing/invoices/${encodeURIComponent(providerInvoiceId)}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'PayPal-Request-Id': requestId,
      },
      body: JSON.stringify({
        send_to_recipient: true,
      }),
    });

    const debugId = res.headers.get('paypal-debug-id') || undefined;

    if (!res.ok && res.status !== 202 && res.status !== 200) {
      const errText = await res.text();
      return {
        success: false,
        providerInvoiceId,
        status: 'CREATED',
        paypalDebugId: debugId,
        simulated: false,
        error: `Failed to send PayPal invoice: ${errText.slice(0, 300)}`,
      };
    }

    return {
      success: true,
      providerInvoiceId,
      status: 'SENT',
      rawStatus: 'SENT',
      paypalDebugId: debugId,
      simulated: false,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      providerInvoiceId,
      status: 'CREATED',
      simulated: false,
      error: `Failed to dispatch invoice: ${msg}`,
    };
  }
}

/**
 * Performs authoritative server-side readback of invoice status directly from PayPal.
 * (GET /v2/invoicing/invoices/{id})
 */
export async function readbackPayPalInvoice(
  providerInvoiceId: string
): Promise<{
  success: boolean;
  status: ProoflineInvoiceStatus;
  rawStatus: string;
  amountMinor?: number;
  paidAmountMinor?: number;
  paypalDebugId?: string;
  simulated: boolean;
  error?: string;
}> {
  const token = await getPayPalAccessToken();
  const isSimulated = isUsingSimulatedToken() || providerInvoiceId.includes('SIM');

  if (isSimulated) {
    // In simulated sandbox, we return the status based on current mock lifecycle
    return {
      success: true,
      status: 'SENT',
      rawStatus: 'SENT',
      simulated: true,
    };
  }

  try {
    const res = await fetch(`${PAYPAL_BASE_URL}/v2/invoicing/invoices/${encodeURIComponent(providerInvoiceId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const debugId = res.headers.get('paypal-debug-id') || undefined;

    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        status: 'FAILED_OR_UNKNOWN',
        rawStatus: `HTTP_${res.status}`,
        paypalDebugId: debugId,
        simulated: false,
        error: `PayPal readback returned HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as Record<string, unknown>;
    const rawStatus = (data.status as string) || 'UNKNOWN';

    // Map PayPal Invoice status to ProoflineInvoiceStatus
    let mappedStatus: ProoflineInvoiceStatus = 'SENT';
    if (rawStatus === 'PAID' || rawStatus === 'MARKED_AS_PAID') {
      mappedStatus = 'PAID';
    } else if (rawStatus === 'PARTIALLY_PAID') {
      mappedStatus = 'PARTIALLY_PAID';
    } else if (rawStatus === 'CANCELLED') {
      mappedStatus = 'CANCELLED';
    } else if (rawStatus === 'REFUNDED' || rawStatus === 'PARTIALLY_REFUNDED') {
      mappedStatus = 'REFUNDED';
    } else if (rawStatus === 'DRAFT') {
      mappedStatus = 'CREATED';
    }

    const amountObj = data.amount as { value?: string } | undefined;
    const paymentsObj = data.payments as { paid_amount?: { value?: string } } | undefined;
    const totalVal = amountObj?.value ? parseFloat(amountObj.value) : undefined;
    const paidVal = paymentsObj?.paid_amount?.value ? parseFloat(paymentsObj.paid_amount.value) : undefined;

    return {
      success: true,
      status: mappedStatus,
      rawStatus,
      amountMinor: totalVal ? Math.round(totalVal * 100) : undefined,
      paidAmountMinor: paidVal ? Math.round(paidVal * 100) : undefined,
      paypalDebugId: debugId,
      simulated: false,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      status: 'FAILED_OR_UNKNOWN',
      rawStatus: 'ERROR',
      simulated: false,
      error: `Network failure during readback: ${msg}`,
    };
  }
}

