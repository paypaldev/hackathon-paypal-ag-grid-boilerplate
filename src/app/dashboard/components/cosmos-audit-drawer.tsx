'use client';

import React, { useState } from 'react';
import { Terminal, Hash } from 'lucide-react';

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

interface CosmosAuditDrawerProps {
  externalLogs?: AuditEntry[];
}

export function CosmosAuditDrawer({ externalLogs }: CosmosAuditDrawerProps = {}) {
  const [logs, setLogs] = useState<AuditEntry[]>(INITIAL_AUDIT_LOGS);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  const combinedLogs = externalLogs ? [...externalLogs, ...logs] : logs;
  const filteredLogs = combinedLogs.filter((l) => (filterType === 'ALL' ? true : l.eventType === filterType));

  return (
    <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5 shadow-2xl">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/80 text-zinc-200">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
              Cosmos.AI &amp; PayPal REST Audit Drawer
            </h3>
            <p className="text-[11px] text-zinc-400">
              Live double-authorization traces, SHA-256 digests &amp; PayPal-Debug-Id headers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#09090b] border border-zinc-700 text-zinc-200 text-[11px] rounded px-2 py-1 outline-none"
          >
            <option value="ALL">All Events</option>
            <option value="TOOL_SEARCH">Tool Search</option>
            <option value="POLICY_FIREWALL">Policy Firewall</option>
            <option value="PAYPAL_REST">PayPal REST</option>
          </select>

          <button
            onClick={() => setLogs(INITIAL_AUDIT_LOGS)}
            title="Reset audit logs"
            className="text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] cursor-pointer"
          >
            Reset
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] cursor-pointer"
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
              className="bg-[#09090b] p-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      log.status === 'SUCCESS'
                        ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                        : log.status === 'BLOCKED'
                        ? 'bg-amber-950/20 text-amber-300 border-amber-600/30'
                        : 'bg-rose-950/20 text-rose-300 border-rose-600/30'
                    }`}
                  >
                    {log.eventType}
                  </span>
                  <span className="text-zinc-100 font-semibold">{log.name}</span>
                </div>

                <div className="flex items-center gap-2 text-zinc-500 text-[10px]">
                  <span>{log.latencyMs}ms</span>
                  <span>{log.timestamp.slice(11, 19)}</span>
                </div>
              </div>

              <p className="text-zinc-300 text-[11px] font-sans mb-1">{log.details}</p>

              <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                {log.httpStatus && (
                  <span className="text-emerald-400">HTTP {log.httpStatus}</span>
                )}
                {log.paypalDebugId && (
                  <span className="text-zinc-300 flex items-center gap-0.5">
                    <Hash className="w-2.5 h-2.5 text-zinc-500" />
                    <span>PayPal-Debug-Id: {log.paypalDebugId}</span>
                  </span>
                )}
                {log.sha256Digest && (
                  <span className="text-zinc-400 truncate max-w-xs" title={log.sha256Digest}>
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

