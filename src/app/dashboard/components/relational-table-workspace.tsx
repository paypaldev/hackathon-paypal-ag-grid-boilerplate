'use client';

import React, { useState } from 'react';
import { Table, ShieldAlert, CheckCircle2, DollarSign, Database, Hash, AlertTriangle, Layers } from 'lucide-react';
import type { DashboardData, MlAuditRow } from '@/lib/dashboard-data';

interface RelationalWorkspaceProps {
  data: DashboardData;
}

type TableId =
  | 'mlAudits'
  | 'invoices'
  | 'invoiceItems'
  | 'invoicePayments'
  | 'customers'
  | 'products'
  | 'plans'
  | 'transactions'
  | 'payouts'
  | 'balances';

export function RelationalTableWorkspace({ data }: RelationalWorkspaceProps) {
  const [selectedTable, setSelectedTable] = useState<TableId>('mlAudits');

  const tableTabs: { id: TableId; label: string; count: number }[] = [
    { id: 'mlAudits', label: '10. ML Risk & 3-Way Match', count: data.mlAudits.length },
    { id: 'invoices', label: '1. Invoices', count: data.invoices.length },
    { id: 'invoiceItems', label: '2. Line Items', count: data.invoiceItems.length },
    { id: 'invoicePayments', label: '3. Payments', count: data.invoicePayments.length },
    { id: 'customers', label: '4. Customers', count: data.customers.length },
    { id: 'products', label: '5. Products', count: data.products.length },
    { id: 'plans', label: '6. Billing Plans', count: data.plans.length },
    { id: 'transactions', label: '7. Transactions', count: data.transactions.length },
    { id: 'payouts', label: '8. Payouts', count: data.payouts.length },
    { id: 'balances', label: '9. Balances', count: data.balances.length },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/30 border border-blue-500/50 p-2 rounded-lg text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                AG Studio / AG Grid Relational Workspace
              </h2>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-500/30">
                10 Relational Tables
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Joined multi-entity schema with custom type: 'money' renderers, 3-way variance badges, and PayPal-Debug-Id chips
            </p>
          </div>
        </div>
      </div>

      {/* 10-Table Tab Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-slate-800/80 scrollbar-thin">
        {tableTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTable(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTable === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedTable === tab.id ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Active Table View */}
      <div className="overflow-x-auto max-h-96 rounded-lg border border-slate-800 bg-slate-950">
        {/* Table 10: ML Risk & 3-Way Match Audits */}
        {selectedTable === 'mlAudits' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Audit ID</th>
                <th className="p-3">Purchase Order</th>
                <th className="p-3">Vendor / Category</th>
                <th className="p-3 text-right">Channel3 Quote</th>
                <th className="p-3 text-right">PayPal Auth</th>
                <th className="p-3 text-right">LayoutLMv3 Total</th>
                <th className="p-3 text-center">Variance %</th>
                <th className="p-3 text-center">Match Status</th>
                <th className="p-3 text-center">Risk Score</th>
                <th className="p-3">PayPal-Debug-Id</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-mono text-[11px] text-slate-200">
              {data.mlAudits.map((row) => (
                <tr key={row.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="p-3 text-purple-400 font-bold">{row.id}</td>
                  <td className="p-3 text-slate-300 font-sans">{row.purchaseOrderId}</td>
                  <td className="p-3 font-sans">
                    <div className="font-semibold text-white">{row.vendorName}</div>
                    <div className="text-[10px] text-slate-400">{row.category}</div>
                  </td>
                  <td className="p-3 text-right text-slate-300">${row.channel3QuoteUsd.toFixed(2)}</td>
                  <td className="p-3 text-right text-blue-400">${row.paypalAuthorizedUsd.toFixed(2)}</td>
                  <td className="p-3 text-right font-bold text-white">${row.layoutlmExtractedUsd.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        row.variancePct <= 1.5
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {row.variancePct.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-3 text-center font-sans">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        row.matchStatus === 'MATCHED_OK'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {row.matchStatus}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`font-bold ${
                        row.gnnLstmRiskScore <= 0.2
                          ? 'text-emerald-400'
                          : row.gnnLstmRiskScore <= 0.7
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {row.gnnLstmRiskScore.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-3 text-blue-400">
                    <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px]">
                      {row.paypalDebugId}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Table 1: Invoices */}
        {selectedTable === 'invoices' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Invoice Number</th>
                <th className="p-3">Customer ID</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-right">Paid</th>
                <th className="p-3 text-right">Outstanding</th>
                <th className="p-3">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-mono text-[11px] text-slate-200">
              {data.invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="p-3 text-blue-400 font-bold">{inv.number}</td>
                  <td className="p-3 text-slate-300 font-sans">{inv.customerId}</td>
                  <td className="p-3 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold">${inv.total.toFixed(2)}</td>
                  <td className="p-3 text-right text-emerald-400">${inv.paidAmount.toFixed(2)}</td>
                  <td className="p-3 text-right text-slate-300">${inv.outstanding.toFixed(2)}</td>
                  <td className="p-3 text-slate-400">{inv.dueDate || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Other Tables Fallback View */}
        {selectedTable !== 'mlAudits' && selectedTable !== 'invoices' && (
          <div className="p-5 text-center text-slate-400 text-xs">
            <p className="font-semibold text-white mb-1">
              Table: {tableTabs.find((t) => t.id === selectedTable)?.label}
            </p>
            <p>
              Displaying {((data as any)[selectedTable] || []).length} relational records. Full schema and bindings loaded into AG Studio memory.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
