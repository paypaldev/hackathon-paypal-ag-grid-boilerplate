export type UserRole = 'ADMIN' | 'PROCUREMENT_MANAGER' | 'SUPPLIER' | 'BUYER' | 'FINANCE_AUDITOR';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'FLAGGED';

export interface UserTransaction {
  id: string;
  orderId: string;
  date: string;
  amountUsd: number;
  type: 'ESCROW_DEPOSIT' | 'ESCROW_CAPTURE' | 'DISPUTE_HOLD' | 'INVOICE_PAYMENT';
  status: 'COMPLETED' | 'HELD_IN_ESCROW' | 'FLAGGED' | 'REFUNDED';
  paypalDebugId: string;
  variancePct: number;
}

export interface MonthlySpend {
  month: string;
  spendUsd: number;
  transactionsCount: number;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string;
  company: string;
  phone: string;
  paypalPayerId: string;
  totalSpendUsd: number;
  escrowTransactionsCount: number;
  disputeRatePct: number;
  riskScore: number; // 0.00 to 1.00
  createdAt: string;
  spendHistory: MonthlySpend[];
  transactions: UserTransaction[];
}

export const INITIAL_USERS: UserRecord[] = [
  {
    id: 'USR-8012',
    name: 'Elena Rostova',
    email: 'elena.rostova@datacore-sys.com',
    role: 'PROCUREMENT_MANAGER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    company: 'DataCore Systems GmbH',
    phone: '+49 89 2441 8900',
    paypalPayerId: 'PAYER-DE-882194',
    totalSpendUsd: 148500.0,
    escrowTransactionsCount: 42,
    disputeRatePct: 0.8,
    riskScore: 0.12,
    createdAt: '2025-03-15T09:30:00Z',
    spendHistory: [
      { month: 'Jun 2026', spendUsd: 18500, transactionsCount: 6 },
      { month: 'Jul 2026', spendUsd: 24200, transactionsCount: 8 },
      { month: 'Aug 2026', spendUsd: 31000, transactionsCount: 9 },
      { month: 'Sep 2026', spendUsd: 22800, transactionsCount: 7 },
      { month: 'Oct 2026', spendUsd: 28000, transactionsCount: 8 },
      { month: 'Nov 2026', spendUsd: 24000, transactionsCount: 4 },
    ],
    transactions: [
      {
        id: 'TXN-901',
        orderId: 'ORD-2026-X991',
        date: '2026-11-10T14:22:00Z',
        amountUsd: 2450.0,
        type: 'ESCROW_CAPTURE',
        status: 'COMPLETED',
        paypalDebugId: 'dbg-991-live-sandbox',
        variancePct: 0.0,
      },
      {
        id: 'TXN-872',
        orderId: 'ORD-2026-X884',
        date: '2026-11-04T11:05:00Z',
        amountUsd: 8750.0,
        type: 'ESCROW_DEPOSIT',
        status: 'HELD_IN_ESCROW',
        paypalDebugId: 'dbg-884-auth-hold',
        variancePct: 0.4,
      },
      {
        id: 'TXN-831',
        orderId: 'ORD-2026-W702',
        date: '2026-10-28T16:40:00Z',
        amountUsd: 12100.0,
        type: 'INVOICE_PAYMENT',
        status: 'COMPLETED',
        paypalDebugId: 'dbg-702-paid-full',
        variancePct: 0.1,
      },
    ],
  },
  {
    id: 'USR-8013',
    name: 'Marcus Vance',
    email: 'm.vance@apexlogistics.io',
    role: 'SUPPLIER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    company: 'Apex Logistics Freight Inc.',
    phone: '+1 415 555 0192',
    paypalPayerId: 'PAYER-US-102938',
    totalSpendUsd: 312000.0,
    escrowTransactionsCount: 88,
    disputeRatePct: 1.2,
    riskScore: 0.18,
    createdAt: '2024-11-01T12:00:00Z',
    spendHistory: [
      { month: 'Jun 2026', spendUsd: 45000, transactionsCount: 14 },
      { month: 'Jul 2026', spendUsd: 52000, transactionsCount: 16 },
      { month: 'Aug 2026', spendUsd: 48000, transactionsCount: 15 },
      { month: 'Sep 2026', spendUsd: 61000, transactionsCount: 18 },
      { month: 'Oct 2026', spendUsd: 58000, transactionsCount: 17 },
      { month: 'Nov 2026', spendUsd: 48000, transactionsCount: 8 },
    ],
    transactions: [
      {
        id: 'TXN-902',
        orderId: 'ORD-2026-X992',
        date: '2026-11-11T09:15:00Z',
        amountUsd: 5400.0,
        type: 'ESCROW_CAPTURE',
        status: 'COMPLETED',
        paypalDebugId: 'dbg-992-apex-pay',
        variancePct: 0.2,
      },
    ],
  },
  {
    id: 'USR-8014',
    name: 'Aisha Al-Mansoor',
    email: 'aisha.mansoor@gulftech-sol.ae',
    role: 'BUYER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    company: 'GulfTech Enterprise Solutions',
    phone: '+971 4 391 0000',
    paypalPayerId: 'PAYER-AE-491029',
    totalSpendUsd: 94200.0,
    escrowTransactionsCount: 29,
    disputeRatePct: 0.0,
    riskScore: 0.08,
    createdAt: '2025-06-20T10:15:00Z',
    spendHistory: [
      { month: 'Jun 2026', spendUsd: 12000, transactionsCount: 4 },
      { month: 'Jul 2026', spendUsd: 15400, transactionsCount: 5 },
      { month: 'Aug 2026', spendUsd: 18000, transactionsCount: 6 },
      { month: 'Sep 2026', spendUsd: 19500, transactionsCount: 6 },
      { month: 'Oct 2026', spendUsd: 17300, transactionsCount: 5 },
      { month: 'Nov 2026', spendUsd: 12000, transactionsCount: 3 },
    ],
    transactions: [
      {
        id: 'TXN-903',
        orderId: 'ORD-2026-X993',
        date: '2026-11-08T15:45:00Z',
        amountUsd: 3200.0,
        type: 'ESCROW_CAPTURE',
        status: 'COMPLETED',
        paypalDebugId: 'dbg-993-gt-cap',
        variancePct: 0.0,
      },
    ],
  },
  {
    id: 'USR-8015',
    name: 'Devin Thorne',
    email: 'd.thorne@stratos-hardware.com',
    role: 'SUPPLIER',
    status: 'FLAGGED',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    company: 'Stratos High-Density Hardware',
    phone: '+1 206 555 0184',
    paypalPayerId: 'PAYER-US-991023',
    totalSpendUsd: 68400.0,
    escrowTransactionsCount: 19,
    disputeRatePct: 7.4,
    riskScore: 0.79, // CollusionGuard flagged
    createdAt: '2025-09-12T14:40:00Z',
    spendHistory: [
      { month: 'Jun 2026', spendUsd: 8000, transactionsCount: 3 },
      { month: 'Jul 2026', spendUsd: 11000, transactionsCount: 4 },
      { month: 'Aug 2026', spendUsd: 14000, transactionsCount: 4 },
      { month: 'Sep 2026', spendUsd: 15400, transactionsCount: 4 },
      { month: 'Oct 2026', spendUsd: 12000, transactionsCount: 3 },
      { month: 'Nov 2026', spendUsd: 8000, transactionsCount: 1 },
    ],
    transactions: [
      {
        id: 'TXN-904',
        orderId: 'ORD-2026-X994',
        date: '2026-11-09T18:10:00Z',
        amountUsd: 4500.0,
        type: 'DISPUTE_HOLD',
        status: 'FLAGGED',
        paypalDebugId: 'dbg-994-collusion-flag',
        variancePct: 5.2, // Exceeds 1.5% clamp
      },
    ],
  },
  {
    id: 'USR-8016',
    name: 'Dr. Aris Thorne',
    email: 'aris@cyberdyne-ai.io',
    role: 'FINANCE_AUDITOR',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    company: 'Cyberdyne Global Auditing LLP',
    phone: '+44 20 7946 0912',
    paypalPayerId: 'PAYER-UK-881230',
    totalSpendUsd: 520000.0,
    escrowTransactionsCount: 140,
    disputeRatePct: 0.2,
    riskScore: 0.04,
    createdAt: '2024-05-10T08:00:00Z',
    spendHistory: [
      { month: 'Jun 2026', spendUsd: 78000, transactionsCount: 22 },
      { month: 'Jul 2026', spendUsd: 84000, transactionsCount: 24 },
      { month: 'Aug 2026', spendUsd: 91000, transactionsCount: 26 },
      { month: 'Sep 2026', spendUsd: 95000, transactionsCount: 27 },
      { month: 'Oct 2026', spendUsd: 92000, transactionsCount: 25 },
      { month: 'Nov 2026', spendUsd: 80000, transactionsCount: 16 },
    ],
    transactions: [
      {
        id: 'TXN-905',
        orderId: 'ORD-2026-X995',
        date: '2026-11-11T12:00:00Z',
        amountUsd: 14500.0,
        type: 'ESCROW_CAPTURE',
        status: 'COMPLETED',
        paypalDebugId: 'dbg-995-audit-pass',
        variancePct: 0.0,
      },
    ],
  },
  {
    id: 'USR-8017',
    name: 'Siddharth Rao',
    email: 'siddharth@cloudmesh-networks.in',
    role: 'BUYER',
    status: 'PENDING',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    company: 'CloudMesh Telemetry Pvt Ltd',
    phone: '+91 80 4123 4567',
    paypalPayerId: 'PAYER-IN-552190',
    totalSpendUsd: 18500.0,
    escrowTransactionsCount: 7,
    disputeRatePct: 0.0,
    riskScore: 0.25,
    createdAt: '2026-10-01T11:20:00Z',
    spendHistory: [
      { month: 'Jun 2026', spendUsd: 0, transactionsCount: 0 },
      { month: 'Jul 2026', spendUsd: 0, transactionsCount: 0 },
      { month: 'Aug 2026', spendUsd: 0, transactionsCount: 0 },
      { month: 'Sep 2026', spendUsd: 0, transactionsCount: 0 },
      { month: 'Oct 2026', spendUsd: 11000, transactionsCount: 4 },
      { month: 'Nov 2026', spendUsd: 7500, transactionsCount: 3 },
    ],
    transactions: [
      {
        id: 'TXN-906',
        orderId: 'ORD-2026-X996',
        date: '2026-11-06T10:14:00Z',
        amountUsd: 2500.0,
        type: 'ESCROW_DEPOSIT',
        status: 'HELD_IN_ESCROW',
        paypalDebugId: 'dbg-996-in-pending',
        variancePct: 0.5,
      },
    ],
  },
  {
    id: 'USR-8018',
    name: 'Chloe Laurent',
    email: 'chloe.laurent@solarenergy-sas.fr',
    role: 'ADMIN',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    company: 'VeriSettle Global Operations',
    phone: '+33 1 42 68 55 00',
    paypalPayerId: 'PAYER-FR-330192',
    totalSpendUsd: 410000.0,
    escrowTransactionsCount: 112,
    disputeRatePct: 0.1,
    riskScore: 0.02,
    createdAt: '2024-02-18T14:30:00Z',
    spendHistory: [
      { month: 'Jun 2026', spendUsd: 65000, transactionsCount: 18 },
      { month: 'Jul 2026', spendUsd: 72000, transactionsCount: 20 },
      { month: 'Aug 2026', spendUsd: 68000, transactionsCount: 19 },
      { month: 'Sep 2026', spendUsd: 75000, transactionsCount: 21 },
      { month: 'Oct 2026', spendUsd: 71000, transactionsCount: 19 },
      { month: 'Nov 2026', spendUsd: 59000, transactionsCount: 15 },
    ],
    transactions: [
      {
        id: 'TXN-907',
        orderId: 'ORD-2026-X997',
        date: '2026-11-11T16:30:00Z',
        amountUsd: 7800.0,
        type: 'ESCROW_CAPTURE',
        status: 'COMPLETED',
        paypalDebugId: 'dbg-997-admin-action',
        variancePct: 0.0,
      },
    ],
  },
];

let globalUsersState = [...INITIAL_USERS];

export function getUsers(): UserRecord[] {
  return [...globalUsersState];
}

export function getUserById(id: string): UserRecord | undefined {
  return globalUsersState.find((u) => u.id === id);
}

export function createUser(userData: Partial<UserRecord>): UserRecord {
  const newId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
  const newUser: UserRecord = {
    id: newId,
    name: userData.name || 'New Enterprise Member',
    email: userData.email || `user-${Date.now()}@domain.com`,
    role: userData.role || 'BUYER',
    status: userData.status || 'ACTIVE',
    avatarUrl:
      userData.avatarUrl ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    company: userData.company || 'Enterprise Partner Inc.',
    phone: userData.phone || '+1 (555) 010-0000',
    paypalPayerId: userData.paypalPayerId || `PAYER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    totalSpendUsd: Number(userData.totalSpendUsd) || 0,
    escrowTransactionsCount: Number(userData.escrowTransactionsCount) || 0,
    disputeRatePct: Number(userData.disputeRatePct) || 0,
    riskScore: Number(userData.riskScore) || 0.1,
    createdAt: new Date().toISOString(),
    spendHistory: [
      { month: 'Jun 2026', spendUsd: 0, transactionsCount: 0 },
      { month: 'Jul 2026', spendUsd: 0, transactionsCount: 0 },
      { month: 'Aug 2026', spendUsd: 0, transactionsCount: 0 },
      { month: 'Sep 2026', spendUsd: 0, transactionsCount: 0 },
      { month: 'Oct 2026', spendUsd: 0, transactionsCount: 0 },
      { month: 'Nov 2026', spendUsd: Number(userData.totalSpendUsd) || 0, transactionsCount: 1 },
    ],
    transactions: [],
  };

  globalUsersState = [newUser, ...globalUsersState];
  return newUser;
}

export function updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
  const index = globalUsersState.findIndex((u) => u.id === id);
  if (index === -1) return undefined;

  const updated: UserRecord = {
    ...globalUsersState[index],
    ...updates,
  };
  globalUsersState[index] = updated;
  return updated;
}

export function deleteUser(id: string): boolean {
  const initialLen = globalUsersState.length;
  globalUsersState = globalUsersState.filter((u) => u.id !== id);
  return globalUsersState.length < initialLen;
}

export function resetUsersState(): void {
  globalUsersState = [...INITIAL_USERS];
}

