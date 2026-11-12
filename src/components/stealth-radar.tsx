'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Activity, RefreshCw } from 'lucide-react';

interface RadarNode {
  id: string;
  label: string;
  type: 'ESCROW' | 'MATCH' | 'DISPUTE' | 'CATALOG';
  x: number; // percentage from center (-50 to 50)
  y: number;
  status: 'OPTIMAL' | 'PROTECTED' | 'VERIFIED' | 'MONITORED';
  amount: string;
  latencyMs: number;
  hash: string;
}

const INITIAL_NODES: RadarNode[] = [
  { id: 'node-1', label: 'PayPal Escrow Auth #882', type: 'ESCROW', x: -28, y: -25, status: 'PROTECTED', amount: '$4,250.00', latencyMs: 242, hash: '0x8f7d92a1...ef4' },
  { id: 'node-2', label: 'Gemini 3-Way Match #104', type: 'MATCH', x: 22, y: -32, status: 'VERIFIED', amount: '$12,890.50', latencyMs: 310, hash: '0x43bc1209...90a' },
  { id: 'node-3', label: 'Channel3 Price Norm #55', type: 'CATALOG', x: -35, y: 20, status: 'OPTIMAL', amount: '$940.00', latencyMs: 189, hash: '0x17fa6b33...c81' },
  { id: 'node-4', label: 'Deterministic Gate #12', type: 'ESCROW', x: 26, y: 22, status: 'PROTECTED', amount: '$6,120.00', latencyMs: 154, hash: '0x992b43cd...21f' },
  { id: 'node-5', label: 'CollusionGuard Shield #7', type: 'DISPUTE', x: 5, y: -15, status: 'MONITORED', amount: '$18,400.00', latencyMs: 275, hash: '0x6e88102a...e02' },
];

export function StealthRadar() {
  const [selectedNode, setSelectedNode] = useState<RadarNode>(INITIAL_NODES[0]);
  const [sweepActive, setSweepActive] = useState(true);
  const [livePings, setLivePings] = useState<number>(42);

  useEffect(() => {
    const interval = setInterval(() => {
      setLivePings((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#121215] border border-zinc-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden text-zinc-100">
      {/* Background cyber grid */}
      <div className="absolute inset-0 cyber-grid-bg opacity-30 pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="size-2 rounded-full bg-zinc-100 beacon-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-200">
            Stealth Escrow Telemetry Radar
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            FIPS 180-4 ACTIVE
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Activity className="w-3.5 h-3.5 text-zinc-300 animate-pulse" />
          <span>{livePings} Live Telemetry Pings</span>
          <button
            onClick={() => setSweepActive(!sweepActive)}
            className="ml-2 text-zinc-400 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 transition-colors"
            title="Toggle Radar Sweep"
          >
            <RefreshCw className={`w-3 h-3 ${sweepActive ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>
        </div>
      </div>

      {/* Grid: Radar Canvas + Live Telemetry Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* Left: Radar Visualizer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="relative size-64 sm:size-72 rounded-full border border-zinc-800 bg-[#09090b] flex items-center justify-center shadow-inner overflow-hidden">
            {/* Concentric Range Rings */}
            <div className="absolute inset-4 rounded-full border border-zinc-800/80" />
            <div className="absolute inset-12 rounded-full border border-zinc-850 border-dashed" />
            <div className="absolute inset-20 rounded-full border border-zinc-800/60" />
            <div className="absolute inset-28 rounded-full border border-zinc-900" />

            {/* Crosshairs */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-800/70" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-800/70" />

            {/* Rotating Radar Sweep Cone */}
            {sweepActive && (
              <div
                className="absolute inset-0 radar-sweep-anim pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg at 50% 50%, rgba(244, 244, 245, 0.15) 0deg, rgba(244, 244, 245, 0.02) 45deg, transparent 60deg)',
                }}
              />
            )}

            {/* Center Core Node */}
            <div className="relative z-10 size-4 rounded-full bg-zinc-100 border-2 border-zinc-900 shadow-md flex items-center justify-center">
              <div className="size-1.5 rounded-full bg-zinc-900" />
            </div>

            {/* Target Nodes on Radar */}
            {INITIAL_NODES.map((node) => {
              const isSelected = selectedNode.id === node.id;
              // Map percentage (-50 to 50) to pixels (center is 50%)
              const leftPercent = 50 + node.x;
              const topPercent = 50 + node.y;

              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`absolute z-20 group -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 cursor-pointer ${
                    isSelected ? 'scale-125' : 'hover:scale-110'
                  }`}
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                >
                  <div className="relative flex items-center justify-center">
                    {/* Ring aura */}
                    <div
                      className={`size-5 rounded-full transition-all ${
                        isSelected
                          ? 'border-2 border-zinc-200 bg-zinc-100/20'
                          : 'border border-zinc-600 bg-zinc-900 group-hover:border-zinc-400'
                      }`}
                    />
                    <div
                      className={`absolute size-2 rounded-full ${
                        isSelected ? 'bg-zinc-100' : 'bg-zinc-400 group-hover:bg-zinc-200'
                      }`}
                    />
                  </div>
                  {/* Tooltip badge */}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block whitespace-nowrap bg-zinc-900 border border-zinc-700 text-[10px] font-mono px-1.5 py-0.5 rounded text-zinc-200 shadow-lg z-30">
                    {node.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-4 text-[11px] font-mono text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-zinc-100" /> Active Auth Node
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full border border-zinc-600" /> Monitored Escrow
            </span>
          </div>
        </div>

        {/* Right: Selected Node Telemetry Card (5 cols) */}
        <div className="lg:col-span-5 bg-[#09090b] border border-zinc-850 rounded-xl p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Selected Security Node
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-200 border border-zinc-800">
                {selectedNode.type}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-zinc-100">{selectedNode.label}</h4>
                <div className="text-xl font-black font-mono text-white mt-1">
                  {selectedNode.amount}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-900 text-xs font-mono">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Deterministic Status:</span>
                <span className="text-emerald-400 font-semibold">{selectedNode.status}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Sandbox Latency:</span>
                <span className="text-zinc-200">{selectedNode.latencyMs} ms</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Payload Digest:</span>
                <span className="text-zinc-300 text-[11px] truncate max-w-[140px]" title={selectedNode.hash}>
                  {selectedNode.hash}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-zinc-400" />
              <span>Escrow Lock Engaged</span>
            </span>
            <span className="text-zinc-400">0 Policy Breaches</span>
          </div>
        </div>
      </div>
    </div>
  );
}
