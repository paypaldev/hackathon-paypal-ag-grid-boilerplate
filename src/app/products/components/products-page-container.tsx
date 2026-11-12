'use client';

import { useState } from 'react';
import { MainNav } from '@/app/components/main-nav';
import { ProductsAdminView } from './products-admin-view';
import { DataGrid, type Row } from '@/app/(endpoints)/data-grid';
import type { ColDef } from 'ag-grid-community';
import { Package, Terminal } from 'lucide-react';

interface ProductsPageContainerProps {
  paypalRows: Row[];
  paypalColumns: ColDef<Row>[];
  calls: string[];
  source: string;
}

export function ProductsPageContainer({
  paypalRows,
  paypalColumns,
  calls,
  source,
}: ProductsPageContainerProps) {
  const [viewMode, setViewMode] = useState<'ADMIN_CATALOG' | 'PAYPAL_ENDPOINT'>('ADMIN_CATALOG');

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      <MainNav />

      {/* Mode Toggle Header Bar */}
      <div className="bg-[#121215] border-b border-zinc-800 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-zinc-400">
          Viewing: <strong className="text-white">{viewMode === 'ADMIN_CATALOG' ? 'Interactive Admin Catalog' : 'PayPal REST API Grid'}</strong>
        </div>

        <div className="flex items-center bg-[#09090b] p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setViewMode('ADMIN_CATALOG')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              viewMode === 'ADMIN_CATALOG' ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Admin Catalog View</span>
          </button>
          <button
            onClick={() => setViewMode('PAYPAL_ENDPOINT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              viewMode === 'PAYPAL_ENDPOINT' ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>PayPal REST Endpoint</span>
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {viewMode === 'ADMIN_CATALOG' ? (
          <ProductsAdminView />
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">Live PayPal Sandbox Products</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                {calls.map((call) => (
                  <code key={call} className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-blue-400">
                    {call}
                  </code>
                ))}
                <span>
                  via <code className="text-white">{source}</code> · {paypalRows.length} {paypalRows.length === 1 ? 'row' : 'rows'}
                </span>
              </div>
            </div>

            <div className="h-[550px] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              <DataGrid rows={paypalRows} columns={paypalColumns} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

