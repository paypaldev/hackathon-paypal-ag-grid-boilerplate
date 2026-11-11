'use client';

import React, { useState } from 'react';
import { Terminal, Shield, CheckCircle, AlertOctagon, Clock, Hash, ChevronRight, RefreshCw } from 'lucide-react';

export interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: 'TOOL_SEARCH' | 'EXECUTE_TOOL' | 'POLICY_FIREWALL' | 'PAYPAL_REST';
  name: string;
  status: 'SUCCESS' | 'BLOCKED' | 'DECLINED' | 'WARNING';
  httpStatus?: number;
  latencyMs: number;
  paypalDebugId?: string;
  sha256Digest?: string;
  details: string;
}

const INITIAL_AUDIT_LOGS: AuditEntry[] = [
  {
    id: 'AUD-001',
    timestamp: '2026-11-12T01:14:02Z',
    eventType: 'TOOL_SEARCH',
    name: 'tool_search("procure hardware", "buyer_agent")',
    status: 'SUCCESS',
    latencyMs: 14,
    details: 'Returned 4 scoped tools [get_order, channel3_search_products, propose_escrow_order, list_transactions]. Direct money moving APIs excluded.',
  },
  {
    id: 'AUD-002',
    timestamp: '2026-11-12T01:14:05Z',
    eventType: 'POLICY_FIREWALL',
    name: 'evaluatePolicyFirewall(PO-ESCROW-ALPHA-91)',
    status: 'SUCCESS',
    latencyMs: 6,
    sha256Digest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    details: 'Verified category "Cloud Hardware", variance 0.0% <= 1.5%, risk score 0.08 <= 0.70. Sealed with FIPS 180-4 SHA-256 digest.',
  },
  {
    id: 'AUD-003',
    timestamp: '2026-11-12T01:14:06Z',
    eventType: 'PAYPAL_REST',
    name: 'POST /v2/checkout/orders (intent: AUTHORIZE)',
    status: 'SUCCESS',
    httpStatus: 201,
    latencyMs: 182,
    paypalDebugId: 'LIVE-DBG-88219A',
    details: 'Milestone Escrow Hold created in PayPal Sandbox for $2,450.00 USD.',
  },
  {
    id: 'AUD-004',
    timestamp: '2026-11-12T01:14:15Z',
    eventType: 'POLICY_FIREWALL',
    name: 'evaluatePolicyFirewall(PO-ESCROW-GAMMA-77)',
    status: 'BLOCKED',
    latencyMs: 5,
    details: '3-Way match variance 5.00% > 1.5% threshold. Capture frozen into audit queue.',
  },
];

export function CosmosAuditDrawer() {
  const [logs, setLogs] = useState<AuditEntry[]>(INITIAL_AUDIT_LOGS);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredLogs = logs.filter((l) => (filterType === 'ALL' ? true : l.eventType === filterType));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Cosmos.AI & PayPal REST Audit Drawer
            </h3>
            <p className="text-[11px] text-slate-400">
              Live double-authorization traces, SHA-256 digests & PayPal-Debug-Id headers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-[11px] rounded px-2 py-1 outline-none"
          >
            <option value="ALL">All Events</option>
            <option value="TOOL_SEARCH">Tool Search</option>
            <option value="POLICY_FIREWALL">Policy Firewall</option>
            <option value="PAYPAL_REST">PayPal REST</option>
          </select>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-[11px] cursor-pointer"
          >
            {isOpen ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 font-mono text-[11px]">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : log.status === 'BLOCKED'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {log.eventType}
                  </span>
                  <span className="text-white font-semibold">{log.name}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                  <span>{log.latencyMs}ms</span>
                  <span>{log.timestamp.slice(11, 19)}</span>
                </div>
              </div>

              <p className="text-slate-300 text-[11px] font-sans mb-1">{log.details}</p>

              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                {log.httpStatus && (
                  <span className="text-emerald-400">HTTP {log.httpStatus}</span>
                )}
                {log.paypalDebugId && (
                  <span className="text-blue-400 flex items-center gap-0.5">
                    <Hash className="w-2.5 h-2.5" />
                    <span>PayPal-Debug-Id: {log.paypalDebugId}</span>
                  </span>
                )}
                {log.sha256Digest && (
                  <span className="text-purple-400 truncate max-w-xs" title={log.sha256Digest}>
                    SHA-256: {log.sha256Digest.slice(0, 16)}...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

