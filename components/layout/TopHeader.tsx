'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SyncStatus } from '@/lib/inventoryService';
import { useAuth } from '@/components/auth/AuthProvider';

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
  title?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  syncStatus: SyncStatus;
  onOpenSqlModal: () => void;
  onExportCsv: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function TopHeader({
  onOpenMobileMenu,
  title = 'PENRO BATANES ICT INVENTORY',
  searchQuery,
  onSearchChange,
  syncStatus,
  onOpenSqlModal,
  onExportCsv,
  onRefresh,
  isRefreshing,
}: TopHeaderProps) {
  const { profile, signOut } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const avatarFailed = Boolean(profile?.avatarUrl && failedAvatarUrl === profile.avatarUrl);
  const themeTransitionTimer = useRef<number | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => () => {
    if (themeTransitionTimer.current) window.clearTimeout(themeTransitionTimer.current);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    const root = document.documentElement;
    if (themeTransitionTimer.current) window.clearTimeout(themeTransitionTimer.current);
    root.classList.add('theme-transitioning');
    setIsDark(nextDark);
    if (nextDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    themeTransitionTimer.current = window.setTimeout(() => {
      root.classList.remove('theme-transitioning');
      themeTransitionTimer.current = null;
    }, 260);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/95 px-4 py-2.5 backdrop-blur-md transition-colors dark:border-zinc-800/70 dark:bg-zinc-950/95 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        {/* Left Side: Mobile toggle + Breadcrumb Title */}
        <div className="flex items-center gap-3">
          {/* Hamburger button on mobile */}
          <button
            onClick={onOpenMobileMenu}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 lg:hidden"
            aria-label="Open sidebar navigation"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-semibold text-zinc-400 dark:text-zinc-500 sm:inline">
                DENR /
              </span>
              <h2 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-sm">
                {title}
              </h2>
            </div>
            <p className="hidden text-[10px] text-zinc-400 dark:text-zinc-500 md:block">
              Provincial Environment and Natural Resources Office • Batanes
            </p>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search property no., model, serial, personnel..."
              className="w-full rounded-xl border-2 border-zinc-300 bg-white py-2 pl-10 pr-16 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-400">
                  ⌘K
                </kbd>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          {/* Camera scanning is offered only on phone-sized screens. */}
          <a
            href="/scanner"
            className="flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-sm font-bold text-white shadow-sm shadow-blue-500/30 transition hover:bg-blue-500 active:scale-95 sm:hidden"
            title="Open QR Scanner"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h5v2H6v3H4V4Zm11 0h5v5h-2V6h-3V4ZM4 15h2v3h3v2H4v-5Zm14 0h2v5h-5v-2h3v-3ZM9 9h6v6H9V9Z" />
            </svg>
            <span>Scan QR</span>
          </a>
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="hidden h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-2xs hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:flex"
            title="Refresh records"
          >
            <svg
              className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            type="button"
            className="hidden h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-2xs transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:flex"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {/* Cloud Sync Button */}
          <button
            onClick={onOpenSqlModal}
            className={`hidden h-8 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-medium transition sm:flex ${syncStatus.source === 'supabase'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
              }`}
            title="Database sync settings"
          >
            <span
              className={`h-2 w-2 rounded-full ${syncStatus.source === 'supabase' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-600'
                }`}
            />
            <span className="hidden sm:inline">
              {syncStatus.source === 'supabase' ? 'Supabase Live' : 'Cloud Sync'}
            </span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={onExportCsv}
            className="hidden h-8 items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:flex"
            title="Download CSV report"
          >
            <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Authenticated account profile */}
          <div className="relative border-l border-zinc-200 pl-2 dark:border-zinc-800 sm:pl-3">
            <button
              type="button"
              onClick={() => setIsProfileOpen((open) => !open)}
              aria-expanded={isProfileOpen}
              aria-label="Open user profile menu"
              className="flex max-w-[11rem] items-center gap-2 rounded-xl px-1 py-1 text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-800 sm:max-w-[14rem]"
            >
              {profile?.avatarUrl && !avatarFailed ? (
                // Google profile images are supplied by the authenticated identity.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt=""
                  onError={() => setFailedAvatarUrl(profile.avatarUrl || null)}
                  className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                />
              ) : (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-green-600 to-blue-600 text-xs font-bold text-white shadow-xs">
                  {(profile?.name || profile?.email || 'U').trim().slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="hidden min-w-0 text-left md:block">
                <span className="block truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">{profile?.name}</span>
                <span className="hidden truncate text-[10px] text-zinc-400 xl:block">{profile?.email}</span>
              </span>
              <svg className="hidden h-3.5 w-3.5 shrink-0 text-zinc-400 sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m7 10 5 5 5-5" /></svg>
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
                  <p className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">{profile?.name}</p>
                  <p className="mt-0.5 break-all text-[10px] text-zinc-500 dark:text-zinc-400">{profile?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsProfileOpen(false); void signOut(); }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3-3H9m0 0 3-3m-3 3 3 3" /></svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
