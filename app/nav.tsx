"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PAGES } from "./sources";

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-6 border-b border-zinc-200 bg-white px-8 py-3 text-sm">
      <Link href="/" className="font-semibold">
        PayPal Sandbox Data
      </Link>
      {PAGES.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={pathname === href ? "font-medium text-blue-700" : "text-zinc-600 hover:text-zinc-900"}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
