'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Lock,
  Hash,
  FileText,
  X,
} from 'lucide-react';

export interface SettlementCertificateData {
  certificateId: string;
  issuedAt: string;
  standard: string;
  orderId: string;
  recipient: string;
  authorizedAmountUsd: number;
  verifiedSettledAmountUsd: number;
  currency: string;
  fipsDigestSha256: string;
  canonicalPayload: string;
  matchingEvidence: {
    purchaseOrder: string;
    vendorInvoice: string;
    carrierBillOfLading: string;
    carrierTrackingId: string;
    deliveryRatio: string;
    variancePct: number;
  };
  paypalExecutionTrace: {
    orderId: string;
    intent: string;
    authorizationId: string;
    captureId: string;
    finalCapture: boolean;
    paypalDebugId: string;
    sandboxHost: string;
  };
  policyCompliance: {
    threeWayVarianceCheck: string;
    riskThresholdCheck: string;
    weeklyBudgetCheck: string;
    partialDeliveryClamp: string;
    promptInjectionScanner: string;
  };
}

export const DEFAULT_CERTIFICATE: SettlementCertificateData = {
  certificateId: 'CERT-FIPS-2026-X88',
  issuedAt: '2026-11-12T07:15:00.000Z',
  standard: 'FIPS 180-4 SHA-256 Cryptographic Digest',
  orderId: 'ORD-2026-X88',
  recipient: 'Apex Cloud Hardware Inc.',
  authorizedAmountUsd: 2450.0,
  verifiedSettledAmountUsd: 1715.0,
  currency: 'USD',
  fipsDigestSha256: '9f83c12a87b54c0e6689d2b4a3c1f2e5d7a8b9c0e1f2a3b4c5d6e7f8a9b0c1d2',
  canonicalPayload: JSON.stringify(
    {
      invoice_total: '2450.00',
      order_id: 'ORD-2026-X88',
      recipient: 'apex cloud hardware inc.',
      risk_score: '0.1200',
      verified_amount: '1715.00',
    },
    null,
    2
  ),
  matchingEvidence: {
    purchaseOrder: 'PO-2026-001',
    vendorInvoice: 'INV-2026-X88',
    carrierBillOfLading: 'BOL-FEDEX-94821',
    carrierTrackingId: '1Z9999999999999999',
    deliveryRatio: '70.0% (14 of 20 server units verified)',
    variancePct: 0.0,
  },
  paypalExecutionTrace: {
    orderId: 'ORD-2026-X88',
    intent: 'AUTHORIZE',
    authorizationId: 'AUTH-2026-78901',
    captureId: 'CAP-2026-44321',
    finalCapture: false,
    paypalDebugId: 'DEBUG-CERT-PROOF-9921',
    sandboxHost: 'api-m.sandbox.paypal.com',
  },
  policyCompliance: {
    threeWayVarianceCheck: 'PASS (0.0% <= 1.5% threshold)',
    riskThresholdCheck: 'PASS (0.12 <= 0.70 threshold)',
    weeklyBudgetCheck: 'PASS ($2,450.00 <= $25,000.00 cap)',
    partialDeliveryClamp: 'APPLIED (Overridden from $2,450.00 to $1,715.00 for verified delivery)',
    promptInjectionScanner: 'CLEAR (Zero adversarial patterns)',
  },
};

interface SettlementProofModalProps {
  open: boolean;
  onClose: () => void;
  certificate?: SettlementCertificateData | null;
}

export function SettlementProofModal({
  open,
  onClose,
  certificate = DEFAULT_CERTIFICATE,
}: SettlementProofModalProps) {
  const [copiedDigest, setCopiedDigest] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!open || !certificate) return null;

  const handleCopyDigest = () => {
    navigator.clipboard.writeText(certificate.fipsDigestSha256);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(certificate, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(certificate, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${certificate.certificateId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-left text-zinc-200 divide-y divide-zinc-800">
        {/* Certificate Header */}
        <div className="p-6 bg-[#09090b] relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-mono tracking-widest bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded border border-zinc-700">
                  FIPS 180-4 VERIFIED
                </span>
                <span className="text-xs text-zinc-400 font-mono">{certificate.certificateId}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Cryptographic Proof of Settlement Certificate
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Autonomous Escrow Authorization &amp; Evidence-Gated Capture Verification
              </p>
            </div>
          </div>
        </div>

        {/* SHA-256 Digest Callout Banner */}
        <div className="p-6 bg-[#09090b] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
              <Lock className="w-3.5 h-3.5 text-zinc-300" />
              <span>Immutable FIPS 180-4 SHA-256 Digest</span>
            </span>
            <button
              onClick={handleCopyDigest}
              className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white font-medium cursor-pointer font-mono"
            >
              {copiedDigest ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDigest ? 'Copied Digest' : 'Copy Hash'}</span>
            </button>
          </div>
          <div className="p-3 bg-[#121215] border border-zinc-700/80 rounded-lg font-mono text-xs text-zinc-200 select-all break-all shadow-inner">
            {certificate.fipsDigestSha256}
          </div>
        </div>

        {/* Financial & Delivery Evidence Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Left Column: Settlement & Clamping */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5 font-mono">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>Financial Settlement Details</span>
            </h3>

            <div className="space-y-2 bg-[#09090b] p-3.5 rounded-xl border border-zinc-800">
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Order ID:</span>
                <span className="font-mono font-semibold text-white">{certificate.orderId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Vendor Recipient:</span>
                <span className="font-semibold text-zinc-200">{certificate.recipient}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Escrow Authorized:</span>
                <span className="font-mono text-zinc-300">
                  ${certificate.authorizedAmountUsd.toFixed(2)} {certificate.currency}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Verified Settled:</span>
                <span className="font-mono font-bold text-white">
                  ${certificate.verifiedSettledAmountUsd.toFixed(2)} {certificate.currency}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Delivery Ratio:</span>
                <span className="font-mono text-zinc-300">
                  {certificate.matchingEvidence.deliveryRatio}
                </span>
              </div>
            </div>

            <div className="space-y-2 bg-[#09090b] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                Evidence Documents Verified
              </span>
              <div className="text-[11px] font-mono space-y-1 text-zinc-300">
                <div>PO: {certificate.matchingEvidence.purchaseOrder}</div>
                <div>Invoice: {certificate.matchingEvidence.vendorInvoice}</div>
                <div>Bill of Lading: {certificate.matchingEvidence.carrierBillOfLading}</div>
                <div>Carrier Tracking: {certificate.matchingEvidence.carrierTrackingId}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Policy Compliance & PayPal REST Trace */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Policy Compliance Rules</span>
            </h3>

            <div className="space-y-2 bg-[#09090b] p-3.5 rounded-xl border border-zinc-800 text-[11px] font-mono">
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">3-Way Variance Check:</span>
                <span className="text-emerald-400 font-semibold">{certificate.policyCompliance.threeWayVarianceCheck}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Risk Threshold:</span>
                <span className="text-emerald-400 font-semibold">{certificate.policyCompliance.riskThresholdCheck}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Weekly Budget Cap:</span>
                <span className="text-emerald-400 font-semibold">{certificate.policyCompliance.weeklyBudgetCheck}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Prompt Injection Scanner:</span>
                <span className="text-emerald-400 font-semibold">{certificate.policyCompliance.promptInjectionScanner}</span>
              </div>
              <div className="py-1 text-zinc-300">
                <span className="text-zinc-500 block text-[10px]">PARTIAL CLAMP APPLIED:</span>
                {certificate.policyCompliance.partialDeliveryClamp}
              </div>
            </div>

            <div className="space-y-1.5 bg-[#09090b] p-3.5 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-300">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                PayPal Execution Trace
              </span>
              <div>Auth ID: {certificate.paypalExecutionTrace.authorizationId}</div>
              <div>Capture ID: {certificate.paypalExecutionTrace.captureId}</div>
              <div>PayPal-Debug-Id: {certificate.paypalExecutionTrace.paypalDebugId}</div>
              <div>Host: {certificate.paypalExecutionTrace.sandboxHost}</div>
            </div>
          </div>
        </div>

        {/* Canonical JSON Payload Accordion */}
        <div className="p-6 bg-[#09090b] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
              <Hash className="w-3.5 h-3.5 text-zinc-400" />
              <span>Canonical SHA-256 Pre-Image Payload</span>
            </span>
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white font-medium cursor-pointer font-mono"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJson ? 'Copied Payload' : 'Copy JSON'}</span>
            </button>
          </div>
          <pre className="p-3 bg-[#121215] border border-zinc-800 rounded-lg font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-36">
            {certificate.canonicalPayload}
          </pre>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-[#121215] flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-500 font-mono">
            Issued: {new Date(certificate.issuedAt).toUTCString()}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer font-mono"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Cert</span>
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer font-mono"
            >
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
