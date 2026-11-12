'use client';

import React, { useState } from 'react';
import { ArrowRight, TrendingUp, Layers } from 'lucide-react';

interface MilestoneTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  percentDone: number;
  dependency: string | null; // e.g. "M1" for Finish-to-Start (FS)
  dependencyType: 'FS' | 'SS' | 'FF';
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'FROZEN';
  holdAmountUsd: number;
  description: string;
}

const INITIAL_MILESTONES: MilestoneTask[] = [
  {
    id: 'M1',
    name: 'Channel3 Multi-Merchant Quote & 30% Order Auth',
    startDate: '2026-11-10',
    endDate: '2026-11-11',
    percentDone: 100,
    dependency: null,
    dependencyType: 'FS',
    status: 'COMPLETED',
    holdAmountUsd: 735.0,
    description: '30% deposit placed in PayPal Sandbox escrow hold (intent: AUTHORIZE).',
  },
  {
    id: 'M2',
    name: 'Carrier Transit & LayoutLMv3 Multimodal QA',
    startDate: '2026-11-11',
    endDate: '2026-11-14',
    percentDone: 65,
    dependency: 'M1',
    dependencyType: 'FS',
    status: 'IN_PROGRESS',
    holdAmountUsd: 0.0,
    description: 'Real-time telemetry tracking & OCR receipt scanning with agreement boosting.',
  },
  {
    id: 'M3',
    name: '3-Way Match Verification & 70% Final Capture',
    startDate: '2026-11-14',
    endDate: '2026-11-15',
    percentDone: 0,
    dependency: 'M2',
    dependencyType: 'FS',
    status: 'PENDING',
    holdAmountUsd: 1715.0,
    description: 'Conditional release of 70% balance via /v2/payments/authorizations/{id}/capture (final_capture: true).',
  },
];

export function BryntumGanttPanel() {
  const [milestones, setMilestones] = useState<MilestoneTask[]>(INITIAL_MILESTONES);
  const [selectedTask, setSelectedTask] = useState<MilestoneTask>(INITIAL_MILESTONES[1]);

  const toggleStatus = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        if (m.status === 'COMPLETED') return { ...m, status: 'IN_PROGRESS', percentDone: 50 };
        if (m.status === 'IN_PROGRESS') return { ...m, status: 'FROZEN', percentDone: 65 };
        if (m.status === 'FROZEN') return { ...m, status: 'PENDING', percentDone: 0 };
        return { ...m, status: 'COMPLETED', percentDone: 100 };
      })
    );
  };

  return (
    <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-zinc-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-zinc-800/80 border border-zinc-700/80 p-2 rounded-lg text-zinc-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-100 tracking-wide">
                Bryntum Escrow Milestone Schedule
              </h2>
              <span className="text-[10px] bg-zinc-800 text-zinc-300 font-semibold px-2 py-0.5 rounded border border-zinc-700">
                Finish-to-Start (FS) Dependencies
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Interactive timeline mapping Channel3 Quote → Carrier Transit → 3-Way Match Settlement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-zinc-200"></span>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
            <span>In Transit</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
            <span>Pending FS</span>
          </div>
        </div>
      </div>

      {/* Interactive Gantt Timeline Rows */}
      <div className="space-y-3">
        {milestones.map((m) => {
          const isSelected = selectedTask.id === m.id;
          return (
            <div
              key={m.id}
              onClick={() => setSelectedTask(m)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#18181b] border-zinc-600 shadow-md ring-1 ring-zinc-600/40'
                  : 'bg-[#09090b] border-zinc-800 hover:bg-[#18181b]/50'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    {m.id}
                  </span>
                  <span className="text-xs font-semibold text-zinc-100">{m.name}</span>
                  {m.dependency && (
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-zinc-500" />
                      <span>Linked ({m.dependency} {m.dependencyType})</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-zinc-400 font-mono">
                    {m.startDate} → {m.endDate}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(m.id);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border uppercase tracking-wider cursor-pointer ${
                      m.status === 'COMPLETED'
                        ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                        : m.status === 'IN_PROGRESS'
                        ? 'bg-zinc-800/80 text-zinc-200 border-zinc-600'
                        : m.status === 'FROZEN'
                        ? 'bg-amber-950/20 text-amber-300 border-amber-500/30'
                        : 'bg-[#121215] text-zinc-500 border-zinc-800'
                    }`}
                  >
                    {m.status}
                  </button>
                </div>
              </div>

              {/* Gantt Bar Visualization */}
              <div className="w-full bg-zinc-800/70 rounded-full h-2.5 relative overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    m.status === 'COMPLETED'
                      ? 'bg-gradient-to-r from-zinc-500 to-zinc-200'
                      : m.status === 'IN_PROGRESS'
                      ? 'bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-100'
                      : m.status === 'FROZEN'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                      : 'bg-zinc-700'
                  }`}
                  style={{ width: `${m.percentDone}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-[11px] text-zinc-400 mt-1.5">
                <span>{m.description}</span>
                <span className="font-semibold text-zinc-300">
                  {m.holdAmountUsd > 0 ? `$${m.holdAmountUsd.toFixed(2)} USD` : 'Verification Gated'} ({m.percentDone}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 30-Day Liquidity Forecast Summary */}
      <div className="mt-5 p-4 rounded-lg bg-[#09090b] border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/80 text-zinc-200">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
              30-Day Treasury Liquidity Forecast
            </h4>
            <p className="text-xs text-zinc-400">
              Escrow release projection: $2,450.00 current holds. Zero capital drag under Finish-to-Start milestones.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <div className="text-zinc-500 text-[11px]">Active Authorized Holds</div>
            <div className="text-zinc-100 font-bold font-mono text-sm">$2,450.00</div>
          </div>
          <div>
            <div className="text-zinc-500 text-[11px]">Projected M3 Release</div>
            <div className="text-zinc-200 font-bold font-mono text-sm">$1,715.00 (70%)</div>
          </div>
          <div>
            <div className="text-zinc-500 text-[11px]">Next Settlement</div>
            <div className="text-zinc-300 font-bold font-mono text-sm">Nov 15, 2026</div>
          </div>
        </div>
      </div>
    </div>
  );
}

