import { NextRequest, NextResponse } from 'next/server';
import { createPayPalInvoiceOnSandbox } from '@/lib/proofline/paypal-invoicing-adapter';
import { evaluateInvoicePolicy } from '@/lib/proofline/policy-engine';
import { prooflineStore } from '@/lib/proofline/store';
import type { CurrencyCode, ProoflineInvoice } from '@/lib/proofline/types';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: milestoneId } = await context.params;
    const body = await req.json();

    const {
      projectId,
      amountMinor,
      currency = 'USD' as CurrencyCode,
      recipientEmail,
      recipientBusinessName,
      itemTitle,
      itemDescription,
      note,
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const project = prooflineStore.projects.get(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const versions = prooflineStore.scopeVersions.get(projectId) || [];
    const activeScope = versions.find((v) => v.id === project.activeScopeVersionId) || versions[versions.length - 1];

    // Find previously issued invoices for this milestone
    const existingInvoices = Array.from(prooflineStore.invoices.values()).filter(
      (i) => i.milestoneId === milestoneId
    );

    // 1. Run Deterministic Policy Firewall
    const policyResult = evaluateInvoicePolicy({
      milestoneId,
      amountMinor: Number(amountMinor),
      currency,
      activeScopeVersion: activeScope || null,
      proposedByRole: 'FREELANCER',
      previouslyIssuedInvoiceIdsForMilestone: existingInvoices.map((i) => i.id),
    });

    if (policyResult.outcome === 'BLOCK') {
      return NextResponse.json({
        error: 'POLICY_BLOCKED',
        reasons: policyResult.reasons,
        policyResult,
      }, { status: 403 });
    }

    // 2. Dispatch to PayPal Sandbox Invoicing API
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    const adapterRes = await createPayPalInvoiceOnSandbox({
      projectId,
      milestoneId,
      scopeVersionId: activeScope?.id || 'NO_SCOPE',
      invoiceNumber,
      amountMinor: Number(amountMinor),
      currency,
      clientEmail: recipientEmail || project.clientEmail,
      clientBusinessName: recipientBusinessName || project.clientName,
      itemTitle: itemTitle || `Payment for milestone ${milestoneId}`,
      itemDescription,
      note,
    });

    if (!adapterRes.success) {
      return NextResponse.json({
        error: adapterRes.error || 'Failed to create PayPal invoice',
        paypalDebugId: adapterRes.paypalDebugId,
      }, { status: 502 });
    }

    // 3. Persist local invoice record
    const invoiceId = `proof-inv-${Date.now().toString(36)}`;
    const newInvoice: ProoflineInvoice = {
      id: invoiceId,
      projectId,
      milestoneId,
      scopeVersionId: activeScope?.id || 'NO_SCOPE',
      provider: 'PAYPAL_SANDBOX',
      providerInvoiceId: adapterRes.providerInvoiceId,
      invoiceNumber,
      amountMinor: Number(amountMinor),
      currency,
      status: adapterRes.status,
      recipientEmail: recipientEmail || project.clientEmail,
      recipientBusinessName: recipientBusinessName || project.clientName,
      hostedPaymentUrl: adapterRes.hostedPaymentUrl,
      lastReadbackAt: new Date().toISOString(),
      readbackRawStatus: adapterRes.rawStatus,
      createdAt: new Date().toISOString(),
    };

    prooflineStore.invoices.set(invoiceId, newInvoice);

    prooflineStore.appendAuditEntry(
      projectId,
      'PayPal Invoicing Adapter',
      'SYSTEM',
      'INVOICE_CREATED_ON_PAYPAL_SANDBOX',
      'INVOICE',
      invoiceId,
      'PAYPAL_CONFIRMED',
      {
        providerInvoiceId: adapterRes.providerInvoiceId,
        amountMinor,
        currency,
        status: adapterRes.status,
        paypalDebugId: adapterRes.paypalDebugId,
        simulated: adapterRes.simulated,
      }
    );

    return NextResponse.json({
      success: true,
      invoice: newInvoice,
      policyResult,
      adapter: adapterRes,
    }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

