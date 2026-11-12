'use client';

import React, { useState } from 'react';
import {
  FileCheck,
  Sparkles,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

interface PipelineStage {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  status: 'COMPLETED' | 'ACTIVE' | 'POLICY_LOCKED';
  payloadSummary: string;
  policyEnforcement: string;
  paypalApi: string;
}

const STAGES: PipelineStage[] = [
  {
    id: 'stage-1',
    stepNumber: '01',
    title: 'PO Verification',
    subtitle: 'Cryptographic Buyer Order Ingest',
    icon: FileCheck,
    status: 'COMPLETED',
    payloadSummary: 'PO-2026-B2B-891 ($24,800.00) signed by buyer RSA key',
    policyEnforcement: 'Strict schema validation, duplicate hash prevention',
    paypalApi: 'GET /v1/catalogs/products + internal ledger',
  },
  {
    id: 'stage-2',
    stepNumber: '02',
    title: 'Multimodal AI Extract',
    subtitle: 'LayoutLMv3 + Gemini 3.1 Pro Extraction',
    icon: Sparkles,
    status: 'COMPLETED',
    payloadSummary: 'OCR bounding boxes + JSON invoice fields extracted (0.992 confidence)',
    policyEnforcement: 'Deterministic type casting & NaN zero-tolerance clamp',
    paypalApi: 'POST /api/gemini/extract (Structured JSON Schema)',
  },
  {
    id: 'stage-3',
    stepNumber: '03',
    title: 'PayPal Escrow Hold',
    subtitle: 'Orders v2 Two-Phase Authorization',
    icon: Lock,
    status: 'COMPLETED',
    payloadSummary: 'Auth ID: 88M19204VA293841C ($24,800.00 Authorized in Escrow)',
    policyEnforcement: 'PayPal-Request-Id idempotency key + instrument check',
    paypalApi: 'POST /v2/checkout/orders + POST /v2/checkout/orders/{id}/authorize',
  },
  {
    id: 'stage-4',
    stepNumber: '04',
    title: 'Deterministic Policy Gate',
    subtitle: 'Absolute Mathematical Match Filter',
    icon: ShieldCheck,
    status: 'COMPLETED',
    payloadSummary: 'Line-item match: 100%, Price variance: 0.00%, Tax delta: $0.00',
    policyEnforcement: 'AI proposals CANNOT release funds; strict code threshold only',
    paypalApi: 'PayPal Disputes v1 auto-rebuttal + Invoicing v2 firewall',
  },
  {
    id: 'stage-5',
    stepNumber: '05',
    title: 'Cryptographic Settlement',
    subtitle: 'Final Capture & FIPS 180-4 Certificate',
    icon: CheckCircle2,
    status: 'ACTIVE',
    payloadSummary: 'Capture ID: 41B920198VA99210M, SHA-256 Digest: 0x9f4a...81e',
    policyEnforcement: 'FIPS 180-4 SHA-256 tamper-evident immutable proof generation',
    paypalApi: 'POST /v2/payments/authorizations/{id}/capture (final_capture: true)',
  },
];

export function ObsidianSettlementPipeline() {
  const [activeStage, setActiveStage] = useState<PipelineStage>(STAGES[4]);

  return (
    <div className="w-full bg-[#121215] border border-zinc-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden text-zinc-100">
      {/* Background Cyber Glow */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-zinc-800/20 blur-3xl pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-zinc-100 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-300">
              Deterministic 3-Way Match Architecture
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            Autonomous Escrow Verification Pipeline
          </h3>
          <p className="text-xs text-zinc-400">
            &ldquo;AI Proposes, Deterministic Policy Disposes, PayPal Executes.&rdquo;
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-300">
            Pipeline Health: 100% Operational
          </span>
        </div>
      </div>

      {/* Horizontal Pipeline Steps */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 relative z-10">
        {STAGES.map((stage) => {
          const Icon = stage.icon;
          const isSelected = activeStage.id === stage.id;

          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage)}
              className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 group ${
                isSelected
                  ? 'bg-zinc-900 border-zinc-400 shadow-lg shadow-black/50'
                  : 'bg-[#09090b]/80 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  isSelected ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                }`}>
                  STEP {stage.stepNumber}
                </span>
                <span className="size-2 rounded-full bg-zinc-200" />
              </div>

              <div>
                <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 w-fit mb-2 text-zinc-200 group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-zinc-100 group-hover:text-white">
                  {stage.title}
                </h4>
                <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                  {stage.subtitle}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-zinc-850">
                <span className="text-zinc-400">STATUS</span>
                <span className="text-emerald-400 font-semibold">{stage.status}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage Detail Card */}
      <div className="mt-5 p-4 rounded-xl bg-[#09090b] border border-zinc-800 text-xs font-mono relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-850">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <span className="font-bold text-zinc-200">
              Stage {activeStage.stepNumber} Inspection: {activeStage.title}
            </span>
          </div>
          <code className="text-[11px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            {activeStage.paypalApi}
          </code>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
          <div className="space-y-1">
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">
              Cryptographic Payload &amp; State
            </span>
            <p className="text-zinc-300 font-medium">
              {activeStage.payloadSummary}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">
              Deterministic Security Policy
            </span>
            <p className="text-zinc-300 font-medium">
              {activeStage.policyEnforcement}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
