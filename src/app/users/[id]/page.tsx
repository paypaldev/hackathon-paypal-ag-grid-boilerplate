'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MainNav } from '@/app/components/main-nav';
import {
  getUserById,
  updateUser,
  type UserRecord,
  type UserStatus,
} from '@/lib/users-data';
import { UserEditModal } from '../components/user-edit-modal';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  Lock,
  Unlock,
} from 'lucide-react';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<UserRecord | null>(() => getUserById(resolvedParams.id) || null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <MainNav />
        <main className="flex-1 max-w-4xl mx-auto w-full p-8 flex flex-col items-center justify-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-400" />
          <h1 className="text-xl font-bold">User Not Found</h1>
          <p className="text-sm text-slate-400">
            No enterprise user record found with ID: <code className="font-mono text-blue-400">{resolvedParams.id}</code>
          </p>
          <Link
            href="/users"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Users Directory</span>
          </Link>
        </main>
      </div>
    );
  }

  const handleSaveProfile = (updates: Partial<UserRecord>) => {
    const updated = updateUser(user.id, updates);
    if (updated) setUser(updated);
  };

  const handleToggleFreeze = () => {
    const nextStatus: UserStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const updated = updateUser(user.id, { status: nextStatus });
    if (updated) setUser(updated);
  };

  const isSuspended = user.status === 'SUSPENDED';
  const isHighRisk = user.riskScore >= 0.7;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <MainNav />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation & Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/users"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Users Directory</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={handleToggleFreeze}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isSuspended
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                  : 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
              }`}
            >
              {isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isSuspended ? 'Unfreeze Escrow' : 'Freeze Account'}</span>
            </button>
          </div>
        </div>

        {/* User Hero Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="size-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 shrink-0 shadow relative">
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {user.name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      user.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : user.status === 'FLAGGED'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    <span>{user.status}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{user.company}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{user.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:text-right shrink-0">
              <div className="text-[11px] text-slate-400">PayPal Payer ID</div>
              <div className="font-mono text-xs text-blue-400 font-semibold">{user.paypalPayerId}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Created: {new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Lifetime Escrow Volume</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ${user.totalSpendUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Through Orders v2 Auth</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Settled Transactions</span>
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {user.escrowTransactionsCount}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">100% 3-Way Verified</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Dispute / Chargeback Rate</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-400">
              {user.disputeRatePct.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Triage Model &lt;1.0% Threshold</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>CollusionGuard Risk Score</span>
              <AlertTriangle className={`w-4 h-4 ${isHighRisk ? 'text-red-400' : 'text-emerald-400'}`} />
            </div>
            <div className={`text-2xl font-bold font-mono ${isHighRisk ? 'text-red-400' : 'text-emerald-400'}`}>
              {user.riskScore.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isHighRisk ? 'Fail-closed freeze triggered' : 'Normal GNN/LSTM envelope'}
            </div>
          </div>
        </div>

        {/* Charts Section: Recharts Line/Area & Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Area Chart: Spend over time */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>6-Month Escrow Settlement Volume ($ USD)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Monthly progression of authorized milestone payments
                </p>
              </div>
              <span className="text-[11px] font-mono text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                Recharts Area
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={user.spendHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0070e0" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#001c64" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b0f17', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: unknown) => [`$${Number(val).toLocaleString()}`, 'Settled Volume']}
                  />
                  <Area
                    type="monotone"
                    dataKey="spendUsd"
                    stroke="#0070e0"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#spendGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Bar Chart: Monthly Transaction Count */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Monthly Transaction Count</h2>
                <p className="text-xs text-slate-400">Total milestone releases</p>
              </div>
              <span className="text-[11px] font-mono text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                Recharts Bar
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={user.spendHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b0f17', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: unknown) => [Number(val), 'Orders']}
                  />
                  <Bar dataKey="transactionsCount" fill="#7b61ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Transactions & Orders Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-2">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Recent Escrow Orders &amp; Settlement Trace
              </h2>
              <p className="text-xs text-slate-400">
                Verified PayPal Authorizations v2 captures and 3-way match variances
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {user.transactions.length} record{user.transactions.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Order Reference</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">3-Way Match</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">PayPal Debug ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {user.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No recent transactions recorded for this user.
                    </td>
                  </tr>
                ) : (
                  user.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-blue-400">{tx.id}</td>
                      <td className="py-3 px-4 font-mono text-slate-200">{tx.orderId}</td>
                      <td className="py-3 px-4 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        ${tx.amountUsd.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono ${
                            tx.variancePct <= 1.5
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {tx.variancePct.toFixed(1)}% {tx.variancePct <= 1.5 ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            tx.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : tx.status === 'HELD_IN_ESCROW'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          <span>{tx.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        <code>{tx.paypalDebugId}</code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
        initialUser={user}
      />
    </div>
  );
}
