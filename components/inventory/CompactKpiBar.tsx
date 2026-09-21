'use client';

import React from 'react';
import { InventorySummary } from '@/types/inventory';

interface CompactKpiBarProps {
  summary: InventorySummary;
  activeStatus: string;
  activeYear: string;
  onSelectStatus: (status: string) => void;
  onSelectYear: (year: string) => void;
  onResetAll: () => void;
  isAnalyticsOpen: boolean;
  onToggleAnalytics: () => void;
}

export function CompactKpiBar({
  summary,
  activeStatus,
  activeYear,
  onSelectStatus,
  onSelectYear,
  onResetAll,
  isAnalyticsOpen,
  onToggleAnalytics,
}: CompactKpiBarProps) {
  const isAgingActive = activeYear === '5_YEARS_OLD';
  const isServiceableActive = activeStatus === 'Serviceable';
  const isAttentionActive =
    activeStatus === 'Needs Attention' ||
    activeStatus === 'Parts Replacement' ||
    activeStatus === 'For Repair';

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-zinc-200/80 bg-white/95 px-3.5 py-2.5 shadow-xs transition-colors dark:border-zinc-800/80 dark:bg-zinc-900/90 sm:px-4">
      {/* Essential KPI Quick-Filters */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Total Assets */}
        <button
          onClick={onResetAll}
          className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            !activeStatus && !activeYear
              ? 'bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
          title="Show all inventory records"
        >
          <span className="text-[11px] font-normal uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Total
          </span>
          <span className="font-bold">{summary.total}</span>
        </button>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

        {/* Serviceable Units */}
        <button
          onClick={() => onSelectStatus(isServiceableActive ? '' : 'Serviceable')}
          className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            isServiceableActive
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-xs dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
              : 'border-zinc-200/70 bg-zinc-50/70 text-zinc-700 hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800'
          }`}
          title="Filter by Serviceable / Healthy units"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Serviceable</span>
          <span className="rounded-md bg-white/80 px-1.5 py-0.2 text-[11px] font-bold text-emerald-700 dark:bg-zinc-900 dark:text-emerald-300">
            {summary.serviceableCount}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
            ({summary.serviceableRate}%)
          </span>
        </button>

        {/* Needs Attention / Repair */}
        <button
          onClick={() => onSelectStatus(isAttentionActive ? '' : 'Needs Attention')}
          className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            isAttentionActive
              ? 'border-rose-300 bg-rose-50 text-rose-800 shadow-xs dark:border-rose-700 dark:bg-rose-950 dark:text-rose-200'
              : 'border-zinc-200/70 bg-zinc-50/70 text-zinc-700 hover:border-rose-200 hover:bg-rose-50/50 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800'
          }`}
          title="Filter by units needing repair, parts, or attention"
        >
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          <span>Issues / Defective</span>
          <span className="rounded-md bg-white/80 px-1.5 py-0.2 text-[11px] font-bold text-rose-700 dark:bg-zinc-900 dark:text-rose-300">
            {summary.needsAttentionCount + summary.partsReplacementCount + summary.forRepairCount}
          </span>
        </button>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

        {/* 5+ Years Old Equipment (User Priority) */}
        <button
          onClick={() => onSelectYear(isAgingActive ? '' : '5_YEARS_OLD')}
          className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            isAgingActive
              ? 'border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-400/20 shadow-xs dark:border-amber-600 dark:bg-amber-950/70 dark:text-amber-200'
              : 'border-zinc-200/70 bg-zinc-50/70 text-zinc-700 hover:border-amber-300 hover:bg-amber-50/40 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800'
          }`}
          title="Filter for aging equipment (5+ years old)"
        >
          <span className="text-amber-500">⏰</span>
          <span>5+ Years Old</span>
          <span className="rounded-md bg-amber-100 px-1.5 py-0.2 text-[11px] font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            {summary.beyond5YearsCount}
          </span>
        </button>
      </div>

      {/* Analytics Expand/Collapse Button */}
      <button
        onClick={onToggleAnalytics}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
          isAnalyticsOpen
            ? 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
            : 'border-zinc-200/70 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800'
        }`}
        title={isAnalyticsOpen ? "Hide visual charts" : "Show charts for OS, RAM, Lifespan, and Offices"}
      >
        <svg className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <span>{isAnalyticsOpen ? 'Hide Charts' : 'Charts'}</span>
        <svg
          className={`h-3 w-3 transition-transform ${isAnalyticsOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
