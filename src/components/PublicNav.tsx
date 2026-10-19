'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function PublicNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/write', label: 'Workspace' },
    { href: '/ai', label: 'Vesper AI' },
    { href: '/ai-agents', label: 'AI Agents & MCP' },
    { href: '/tools', label: 'Free Tools' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/docs/api', label: 'API Docs' },
    { href: '/changelog', label: 'Changelog' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-slate-900 dark:text-white"
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black shadow-sm">
              T
            </span>
            <span>Typefully</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/signin"
            className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-900 transition"
          >
            Sign in
          </Link>
          <Link
            href="/write"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-orange-500 dark:hover:bg-orange-400 transition shadow-sm"
          >
            Open Composer →
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Toggle Menu"
          className="md:hidden p-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 space-y-2">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2">
            <Link
              href="/signin"
              className="flex-1 text-center py-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-sm font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/write"
              className="flex-1 text-center py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold"
            >
              Open Composer
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
