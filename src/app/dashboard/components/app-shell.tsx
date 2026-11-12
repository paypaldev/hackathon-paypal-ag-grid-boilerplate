'use client';

import type { ReactNode } from 'react';
import { BellIcon, HelpIcon } from './ui/icons';
import { AgStudioLogo } from './ui/logo';

function PayPalWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold italic tracking-tight ${className}`}>
      <span className="text-zinc-200">Pay</span>
      <span className="text-zinc-400">Pal</span>
    </span>
  );
}

function BrandLockup() {
  return (
    <div className="flex items-center gap-3">
      <AgStudioLogo className="-ml-3 h-12 w-auto" />
      <span className="h-6 w-px bg-pp-border" aria-hidden />
      <span className="flex items-baseline gap-1 text-xs text-pp-muted font-mono">
        powered by <PayPalWordmark className="text-sm" /> APIs
      </span>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-6 border-b border-pp-border bg-pp-surface px-6 text-zinc-100">
      <BrandLockup />
      <div className="ml-auto flex items-center gap-1 text-zinc-300">
        <span className="inline-flex size-9 items-center justify-center rounded-full hover:bg-zinc-800 transition-colors cursor-pointer" title="Help">
          <HelpIcon />
        </span>
        <span className="inline-flex size-9 items-center justify-center rounded-full hover:bg-zinc-800 transition-colors cursor-pointer" title="Notifications">
          <BellIcon />
        </span>
        <span className="ml-2 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-sm font-semibold text-white">
            AG
          </span>
          <span className="hidden text-sm font-medium sm:inline text-zinc-300">Demo merchant</span>
        </span>
      </div>
    </header>
  );
}

export function AppShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col bg-pp-canvas font-paypal text-pp-ink">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <nav className="flex w-64 shrink-0 flex-col border-r border-pp-border bg-pp-surface" aria-label="Reports">
          {sidebar}
        </nav>
        <main className="flex min-w-0 flex-1 flex-col bg-pp-canvas">{children}</main>
      </div>
    </div>
  );
}
