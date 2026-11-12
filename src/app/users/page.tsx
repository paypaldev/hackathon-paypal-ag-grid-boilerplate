'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MainNav } from '@/app/components/main-nav';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type UserRecord,
  type UserStatus,
} from '@/lib/users-data';
import { UserEditModal } from './components/user-edit-modal';
import {
  Users,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  Search,
  Plus,
  ArrowUpDown,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>(() => getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof UserRecord>('totalSpendUsd');
  const [sortAsc, setSortAsc] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // Filter & Sort
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        const matchesSearch =
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
        const matchesStatus = selectedStatus === 'ALL' || u.status === selectedStatus;
        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [users, searchQuery, selectedRole, selectedStatus, sortField, sortAsc]);

  // Aggregate Metrics
  const totalVolume = users.reduce((acc, u) => acc + u.totalSpendUsd, 0);
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const flaggedCount = users.filter((u) => u.status === 'FLAGGED' || u.riskScore > 0.7).length;
  const avgDisputeRate =
    users.reduce((acc, u) => acc + u.disputeRatePct, 0) / (users.length || 1);

  const handleSaveUser = (userData: Partial<UserRecord>) => {
    if (editingUser) {
      const updated = updateUser(editingUser.id, userData);
      if (updated) {
        setUsers(getUsers());
      }
    } else {
      createUser(userData);
      setUsers(getUsers());
    }
    setEditingUser(null);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove user "${name}" (${id})?`)) {
      deleteUser(id);
      setUsers(getUsers());
    }
  };

  const handleToggleStatus = (u: UserRecord) => {
    const nextStatus: UserStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    updateUser(u.id, { status: nextStatus });
    setUsers(getUsers());
  };

  const toggleSort = (field: keyof UserRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <MainNav />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page Title & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Identity &amp; Counterparty Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Enterprise Users &amp; Counterparties
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Manage buyers, suppliers, auditors, and verify automated risk profiles.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg hover:shadow-blue-600/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Active Accounts</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{activeCount} / {users.length}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Verified Counterparties</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Cumulative Escrow Volume</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Across Orders &amp; Auth v2</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Flagged / High Risk</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-red-400">{flaggedCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">CollusionGuard &gt;0.70 score</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Avg Counterparty Dispute Rate</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-400">
              {avgDisputeRate.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Expected-cost triage active</div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, company, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 shrink-0">Role:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Roles</option>
                <option value="PROCUREMENT_MANAGER">Procurement</option>
                <option value="BUYER">Buyer</option>
                <option value="SUPPLIER">Supplier</option>
                <option value="FINANCE_AUDITOR">Auditor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 shrink-0">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="FLAGGED">Flagged</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Grid / Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
                    <div className="flex items-center gap-1">
                      <span>User / Organization</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('role')}>
                    <div className="flex items-center gap-1">
                      <span>Role</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('totalSpendUsd')}>
                    <div className="flex items-center gap-1">
                      <span>Total Escrow Volume</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('riskScore')}>
                    <div className="flex items-center gap-1">
                      <span>Risk (GNN/LSTM)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No users match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isHighRisk = u.riskScore >= 0.7;
                    return (
                      <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                        {/* User Identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 relative">
                              <Image
                                src={u.avatarUrl}
                                alt={u.name}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <Link
                                href={`/users/${u.id}`}
                                className="font-semibold text-white hover:text-blue-400 transition-colors flex items-center gap-1"
                              >
                                <span>{u.name}</span>
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </Link>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                <span>{u.company}</span>
                                <span className="text-slate-600">·</span>
                                <code className="text-blue-400/90 font-mono text-[10px]">{u.id}</code>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Total Spend */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-white text-xs">
                            ${u.totalSpendUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {u.escrowTransactionsCount} transactions
                          </div>
                        </td>

                        {/* Risk Score */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                isHighRisk
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : u.riskScore >= 0.25
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {u.riskScore.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {isHighRisk ? 'Flagged' : u.riskScore >= 0.25 ? 'Moderate' : 'Low'}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : u.status === 'FLAGGED'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : u.status === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            <span className="size-1.5 rounded-full bg-current" />
                            <span>{u.status}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/users/${u.id}`}
                              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                              title="View Full Profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
                              title="Edit User"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                              title={u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                            >
                              {u.status === 'ACTIVE' ? (
                                <XCircle className="w-3.5 h-3.5" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {filteredUsers.length} of {users.length} registered accounts
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              FIPS 180-4 SHA-256 Verified Ledger
            </span>
          </div>
        </div>
      </main>

      <UserEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        initialUser={editingUser}
      />
    </div>
  );
}
