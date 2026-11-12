'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, Cpu, Trash2 } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  type: 'PAYPAL_REST' | 'COSMOS_MCP' | 'CRYPTO_FIPS' | 'FIREWALL';
  message: string;
  details: string;
}

const SAMPLE_LOGS: LogEntry[] = [
  {
    timestamp: '08:14:02.102',
    type: 'PAYPAL_REST',
    message: 'POST /v2/checkout/orders HTTP/1.1 (intent=AUTHORIZE)',
    details: 'PayPal-Request-Id: 9f8a-21cb-44e1, Amount: $24,800.00 USD, Status: CREATED',
  },
  {
    timestamp: '08:14:02.344',
    type: 'COSMOS_MCP',
    message: 'tools/call: channel3_search_products (category: enterprise_server)',
    details: 'Market norm price calculated: $2,480.00/unit (Z-score: +0.02, Standard Deviation: 1.1)',
  },
  {
    timestamp: '08:14:02.580',
    type: 'FIREWALL',
    message: 'Deterministic 3-Way Match Firewall Evaluated',
    details: 'Price Variance: 0.00% <= 0.00%, Quantity Variance: 0.00% <= 0.00% -> PASS_PERMITTED',
  },
  {
    timestamp: '08:14:02.812',
    type: 'PAYPAL_REST',
    message: 'POST /v2/payments/authorizations/88M19204VA293841C/capture',
    details: 'HTTP 201 Created · final_capture: true, Capture ID: 41B920198VA99210M',
  },
  {
    timestamp: '08:14:02.940',
    type: 'CRYPTO_FIPS',
    message: 'FIPS 180-4 SHA-256 Digest Minted & Sealed',
    details: 'Digest: 0x9f4a7c81e2b53d4018ca91207e4d8b92 · Merkle Root Verified in AG Grid Ledger',
  },
];

export function StealthCyberTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>(SAMPLE_LOGS);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  const filteredLogs = activeFilter === 'ALL'
    ? logs
    : logs.filter((l) => l.type === activeFilter);

  const handleCopy = () => {
    const text = filteredLogs.map((l) => `[${l.timestamp}] [${l.type}] ${l.message}\n  ${l.details}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setLogs([]);
  };

  const handleReset = () => {
    setLogs(SAMPLE_LOGS);
  };

  return (
    <div className="w-full bg-[#121215] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col font-mono text-xs">
      {/* Top Terminal Bar */}
      <div className="bg-[#09090b] border-b border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-zinc-700/80 border border-zinc-600 inline-block" />
            <span className="size-3 rounded-full bg-zinc-700/80 border border-zinc-600 inline-block" />
            <span className="size-3 rounded-full bg-zinc-700/80 border border-zinc-600 inline-block" />
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <span className="font-bold text-zinc-200 text-xs">
              VeriSettle Stealth Audit Terminal (Cosmos.AI &amp; PayPal REST)
            </span>
          </div>
        </div>

        {/* Filter Pills & Actions */}
        <div className="flex items-center gap-2">
          {['ALL', 'PAYPAL_REST', 'COSMOS_MCP', 'CRYPTO_FIPS'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                activeFilter === filter
                  ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {filter}
            </button>
          ))}

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Copy Terminal Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={logs.length === 0 ? handleReset : handleClear}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={logs.length === 0 ? 'Restore logs' : 'Clear logs'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-4 bg-[#09090b]/95 min-h-[180px] max-h-[260px] overflow-y-auto space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-zinc-600 text-center py-6">
            Terminal buffer empty. Click restore icon above to repopulate.
          </div>
        ) : (
          filteredLogs.map((log, i) => (
            <div key={i} className="space-y-0.5 group">
              <div className="flex items-baseline gap-2">
                <span className="text-zinc-600 text-[10px] select-none">{log.timestamp}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                    log.type === 'PAYPAL_REST'
                      ? 'bg-blue-950/40 text-blue-300 border-blue-900/50'
                      : log.type === 'COSMOS_MCP'
                      ? 'bg-purple-950/40 text-purple-300 border-purple-900/50'
                      : log.type === 'CRYPTO_FIPS'
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/50'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {log.type}
                </span>
                <span className="text-zinc-200 font-semibold">{log.message}</span>
              </div>
              <div className="pl-6 text-[11px] text-zinc-400 font-mono">
                {log.details}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Terminal Footer Status */}
      <div className="bg-[#121215] border-t border-zinc-850 px-4 py-2 flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-zinc-400" />
          <span>Deterministic Firewall Integrity: Validated</span>
        </div>
        <span>FIPS 180-4 SHA-256 Engine</span>
      </div>
    </div>
  );
}
