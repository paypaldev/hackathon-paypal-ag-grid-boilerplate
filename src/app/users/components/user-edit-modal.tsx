'use client';

import { useState } from 'react';
import type { UserRecord, UserRole, UserStatus } from '@/lib/users-data';
import { X, Check } from 'lucide-react';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<UserRecord>) => void;
  initialUser?: UserRecord | null;
}

export function UserEditModal({ isOpen, onClose, onSave, initialUser }: UserEditModalProps) {
  const [name, setName] = useState(initialUser?.name || '');
  const [email, setEmail] = useState(initialUser?.email || '');
  const [role, setRole] = useState<UserRole>(initialUser?.role || 'BUYER');
  const [status, setStatus] = useState<UserStatus>(initialUser?.status || 'ACTIVE');
  const [company, setCompany] = useState(initialUser?.company || '');
  const [phone, setPhone] = useState(initialUser?.phone || '');
  const [totalSpendUsd, setTotalSpendUsd] = useState(initialUser?.totalSpendUsd?.toString() || '0');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid email is required';
    if (!company.trim()) newErrors.company = 'Company name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: initialUser?.id,
      name: name.trim(),
      email: email.trim(),
      role,
      status,
      company: company.trim(),
      phone: phone.trim() || '+1 (555) 000-0000',
      totalSpendUsd: parseFloat(totalSpendUsd) || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">
              {initialUser ? 'Edit User Profile' : 'Add New Enterprise User'}
            </h2>
            <p className="text-xs text-slate-400">
              {initialUser ? `Modifying ID: ${initialUser.id}` : 'Create a new buyer, supplier, or auditor profile'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 ${
                  errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-blue-500'
                }`}
              />
              {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Corporate Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 ${
                  errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-blue-500'
                }`}
              />
              {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Enterprise Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="PROCUREMENT_MANAGER">Procurement Manager</option>
                <option value="BUYER">Enterprise Buyer</option>
                <option value="SUPPLIER">B2B Supplier</option>
                <option value="FINANCE_AUDITOR">Finance Auditor</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Account Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="ACTIVE">Active (Verified)</option>
                <option value="PENDING">Pending Review</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="FLAGGED">Flagged for Audit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Company / Organization</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enterprise Ltd"
                className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 ${
                  errors.company ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-blue-500'
                }`}
              />
              {errors.company && <p className="text-[11px] text-red-400 mt-1">{errors.company}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-010-0000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Total Settled Escrow Spend (USD)</label>
            <input
              type="number"
              step="0.01"
              value={totalSpendUsd}
              onChange={(e) => setTotalSpendUsd(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{initialUser ? 'Save Changes' : 'Create User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

