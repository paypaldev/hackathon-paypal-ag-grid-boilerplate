'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Users,
  Package,
  Sparkles,
  Activity,
  Home,
  ExternalLink,
  Video,
  FileCheck,
} from 'lucide-react';

export function MainNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/proofline', label: 'Proofline (Scope & Invoicing)', icon: FileCheck },
    { href: '/dashboard', label: 'Command Center', icon: ShieldCheck },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/ai-sandbox', label: 'AI Sandbox', icon: Sparkles },
    { href: '/walkthrough', label: 'Walkthrough', icon: Video },
    { href: '/availability', label: 'Health', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/80 text-zinc-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="size-8 rounded-lg bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-950 border border-zinc-700/80 flex items-center justify-center text-white font-black text-xs shadow-md shadow-black/40 group-hover:scale-105 transition-transform">
              VS
            </div>
            <span className="font-bold text-sm sm:text-base tracking-tight text-white group-hover:text-zinc-300 transition-colors">
              VeriSettle <span className="text-zinc-300 text-xs font-mono px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">OS</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-2 ml-2 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 shadow-inner">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>PayPal Sandbox Active</span>
          </div>
        </div>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-white font-medium border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-200' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick action: Open Live Command Center */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm hover:border-zinc-600"
          >
            <span>Live Workspace</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-zinc-800/80 overflow-x-auto text-xs bg-[#0c0c0e]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md shrink-0 transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
