'use client';

import React from 'react';
import { InventorySummary } from '@/types/inventory';
import { SyncStatus } from '@/lib/inventoryService';

export type SidebarTab =
  | 'overview'
  | 'all'
  | 'desktops'
  | 'laptops'
  | 'printers'
  | 'scanners'
  | 'issues';

interface SidebarProps {
  currentTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  summary: InventorySummary;
  syncStatus: SyncStatus;
  onOpenAddModal: () => void;
  onOpenSqlModal: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  summary,
  syncStatus,
  onOpenAddModal,
  onOpenSqlModal,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const navGroups: {
    label: string;
    items: {
      id: SidebarTab;
      label: string;
      icon: React.ReactNode;
      count?: number;
      accent?: 'default' | 'red';
    }[];
  }[] = [
    {
      label: 'Main',
      items: [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
        {
          id: 'all',
          label: 'All Equipment',
          count: summary.total,
          icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
        },
      ],
    },
    {
      label: 'By Type',
      items: [
        {
          id: 'desktops',
          label: 'Desktop PCs',
          count: summary.desktopCount,
          icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          id: 'laptops',
          label: 'Laptops',
          count: summary.laptopCount,
          icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          id: 'printers',
          label: 'Printers',
          count: summary.printerCount,
          icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          ),
        },
        {
          id: 'scanners',
          label: 'Scanners',
          count: summary.scannerCount,
          icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
          ),
        },
      ],
    },
    {
      label: 'Monitoring',
      items: [
        {
          id: 'issues',
          label: 'Needs Attention',
          count: summary.needsAttentionCount + summary.partsReplacementCount + summary.forRepairCount,
          accent: 'red',
          icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        },
      ],
    },
  ];

  const issueCount = summary.needsAttentionCount + summary.partsReplacementCount + summary.forRepairCount;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col overflow-hidden border-r border-zinc-200/80 bg-white transition-[width,transform] duration-300 ease-out dark:border-zinc-800/80 dark:bg-zinc-950 lg:static lg:translate-x-0 ${isCollapsed ? 'sidebar-collapsed lg:w-[72px]' : 'lg:w-60'} ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Title */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
              style={{ background: 'linear-gradient(135deg, #16a34a 0%, #2563eb 100%)' }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className={`sidebar-label overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'}`}>
              <p className="text-[11px] font-black tracking-widest text-zinc-900 uppercase dark:text-zinc-50">
                PENRO Batanes
              </p>
              <p className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                ICT Inventory
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 lg:hidden"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={onToggleCollapsed}
            className="hidden rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 lg:flex"
            title={isCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
          >
            <svg className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 19-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Add Asset Button */}
        <div className="px-3 pt-3">
          <button
            onClick={() => {
              onOpenAddModal();
              if (isMobileOpen) onCloseMobile();
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-98"
            title={isCollapsed ? 'Add equipment' : undefined}
            style={{ background: 'linear-gradient(135deg, #16a34a 0%, #2563eb 100%)' }}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className={`sidebar-label overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-28 opacity-100'}`}>Add Equipment</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className={`sidebar-label mb-1 overflow-hidden whitespace-nowrap px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 transition-[max-width,opacity] duration-200 dark:text-zinc-600 ${isCollapsed ? 'max-h-0 max-w-0 opacity-0' : 'max-h-4 max-w-32 opacity-100'}`}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentTab === item.id;
                  const isRed = item.accent === 'red';
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (isMobileOpen) onCloseMobile();
                      }}
                      className={`nav-item flex w-full items-center rounded-lg py-2 text-xs font-medium ${isCollapsed ? 'justify-center px-2' : 'justify-between px-2.5'} ${
                        isActive
                          ? 'text-white shadow-sm'
                          : isRed
                          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30'
                          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
                      }`}
                      style={
                        isActive
                          ? { background: 'linear-gradient(135deg, #16a34a 0%, #2563eb 100%)' }
                          : {}
                      }
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className={`flex min-w-0 items-center ${isCollapsed ? 'gap-0' : 'gap-2.5'}`}>
                        <span className={isActive ? 'text-white/90' : isRed ? '' : 'text-zinc-400 dark:text-zinc-500'}>
                          {item.icon}
                        </span>
                        <span className={`sidebar-label overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-28 opacity-100'}`}>{item.label}</span>
                      </div>
                      {item.count !== undefined && !isCollapsed && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : isRed && item.count > 0
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
          {/* Issue Alert */}
          {issueCount > 0 && (
            <div className={`mb-2 flex items-center rounded-lg bg-red-50 py-2 dark:bg-red-950/30 ${isCollapsed ? 'justify-center px-2' : 'gap-2 px-2.5'}`} title={isCollapsed ? `${issueCount} units need attention` : undefined}>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 animate-pulse" />
              <span className={`sidebar-label overflow-hidden whitespace-nowrap text-[11px] font-semibold text-red-700 transition-[max-width,opacity] duration-200 dark:text-red-400 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-36 opacity-100'}`}>
                {issueCount} unit{issueCount !== 1 ? 's' : ''} need attention
              </span>
            </div>
          )}

          {/* DB Status */}
          <button
            onClick={onOpenSqlModal}
            className={`flex w-full items-center rounded-lg py-1.5 text-left text-xs transition hover:bg-zinc-100 dark:hover:bg-zinc-800/60 ${isCollapsed ? 'justify-center px-2' : 'gap-2 px-2.5'}`}
            title={isCollapsed ? (syncStatus.source === 'supabase' ? 'Supabase connected' : 'Local storage') : undefined}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                syncStatus.source === 'supabase' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
              }`}
            />
            <span className={`sidebar-label overflow-hidden whitespace-nowrap text-zinc-500 transition-[max-width,opacity] duration-200 dark:text-zinc-400 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'}`}>
              {syncStatus.source === 'supabase' ? 'Supabase connected' : 'Local storage'}
            </span>
          </button>

          <p className={`sidebar-label mt-1 overflow-hidden whitespace-nowrap px-2.5 text-[10px] text-zinc-400 transition-[max-width,opacity] duration-200 dark:text-zinc-600 ${isCollapsed ? 'max-h-0 max-w-0 opacity-0' : 'max-h-4 max-w-40 opacity-100'}`}>
            DENR PENRO Batanes · Region 2
          </p>
        </div>
      </aside>
    </>
  );
}
