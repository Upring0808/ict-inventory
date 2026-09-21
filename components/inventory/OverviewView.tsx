'use client';

import React, { useEffect, useRef, useState } from 'react';
import { InventoryItem, InventorySummary } from '@/types/inventory';
import { getLocationDistribution } from '@/lib/summaryUtils';

interface OverviewViewProps {
  items: InventoryItem[];
  summary: InventorySummary;
  onNavigateTab: (tab: 'all' | 'issues' | 'desktops' | 'laptops' | 'printers' | 'scanners') => void;
  onOpenAddModal: () => void;
  onViewDetails: (item: InventoryItem) => void;
}

// Animated donut using CSS transition on stroke-dashoffset
function DonutChart({
  withinCount,
  beyondCount,
  total,
}: {
  withinCount: number;
  beyondCount: number;
  total: number;
}) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<SVGSVGElement>(null);

  // Circumference for r=38
  const r = 38;
  const circumference = 2 * Math.PI * r; // ≈ 238.76

  const safeTotal = total || 1;
  const beyondPct = beyondCount / safeTotal;
  const withinPct = withinCount / safeTotal;

  const withinStroke = withinPct * circumference;
  const beyondStroke = beyondPct * circumference;

  useEffect(() => {
    // Small delay so the transition actually plays on mount
    const timer = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <svg
        ref={ref}
        className="-rotate-90 h-48 w-48"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          strokeWidth="11"
          className="stroke-zinc-100 dark:stroke-zinc-800"
        />
        {/* Within 5 years arc — green */}
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
          className="stroke-emerald-500"
          style={{
            strokeDasharray: `${animated ? withinStroke : 0} ${circumference}`,
            strokeDashoffset: 0,
            transition: 'stroke-dasharray 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
        {/* Beyond 5 years arc — amber, offset by the within arc */}
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
          className="stroke-amber-500"
          style={{
            strokeDasharray: `${animated ? beyondStroke : 0} ${circumference}`,
            strokeDashoffset: -withinStroke,
            transition: 'stroke-dasharray 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.15s, stroke-dashoffset 0s',
          }}
        />
      </svg>

      {/* Center label */}
      <div className="absolute text-center pointer-events-none">
        <span className="block text-2xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums">
          {total}
        </span>
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Total Units
        </span>
      </div>
    </div>
  );
}

export function OverviewView({
  items,
  summary,
  onNavigateTab,
  onOpenAddModal,
}: OverviewViewProps) {
  const locationStats = getLocationDistribution(items, 8);
  const issueCount = summary.needsAttentionCount + summary.partsReplacementCount + summary.forRepairCount;
  const total = summary.total || 1;
  const agingPct = Math.round((summary.beyond5YearsCount / total) * 100);
  const withinPct = 100 - agingPct;

  const maxLocationCount = locationStats.reduce((max, l) => Math.max(max, l.count), 0) || 1;

  const typeCards = [
    {
      label: 'Desktops',
      count: summary.desktopCount,
      tab: 'desktops' as const,
      color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
      ring: 'hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-700',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Laptops',
      count: summary.laptopCount,
      tab: 'laptops' as const,
      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      ring: 'hover:ring-2 hover:ring-emerald-300 dark:hover:ring-emerald-700',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Printers',
      count: summary.printerCount,
      tab: 'printers' as const,
      color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
      ring: 'hover:ring-2 hover:ring-violet-300 dark:hover:ring-violet-700',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      ),
    },
    {
      label: 'Scanners',
      count: summary.scannerCount,
      tab: 'scanners' as const,
      color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      ring: 'hover:ring-2 hover:ring-amber-300 dark:hover:ring-amber-700',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Dashboard</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            PENRO Batanes ICT Equipment Overview
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="press-scale flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-sm hover:shadow-md hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg, #16a34a 0%, #2563eb 100%)' }}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Equipment
        </button>
      </div>

      {/* 3 KPI Cards — staggered entrance */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Fleet */}
        <div
          onClick={() => onNavigateTab('all')}
          className="card-entrance hover-lift press-scale group cursor-pointer rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900"
          style={{ animationDelay: '0ms' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Assets</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/40 dark:to-blue-950/40">
              <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums">{summary.total}</p>
          <p className="mt-1 text-[11px] text-zinc-400">registered units</p>
        </div>

        {/* Serviceable */}
        <div
          onClick={() => onNavigateTab('all')}
          className="card-entrance hover-lift press-scale group cursor-pointer rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900"
          style={{ animationDelay: '60ms' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Serviceable</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{summary.serviceableRate}%</p>
          <p className="mt-1 text-[11px] text-zinc-400">{summary.serviceableCount} units in good condition</p>
        </div>

        {/* Needs Attention */}
        <div
          onClick={() => onNavigateTab('issues')}
          className="card-entrance hover-lift press-scale group cursor-pointer rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900"
          style={{ animationDelay: '120ms' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Needs Attention</span>
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${issueCount > 0 ? 'bg-red-50 dark:bg-red-950/40' : 'bg-zinc-50 dark:bg-zinc-800'}`}>
              <svg className={`h-4 w-4 ${issueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className={`mt-3 text-3xl font-black tabular-nums ${issueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-400'}`}>
            {issueCount}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">units flagged for repair or attention</p>
        </div>
      </div>

      {/* Equipment by Type — 4 tiles */}
      <div
        className="card-entrance rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900"
        style={{ animationDelay: '160ms' }}
      >
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Equipment by Type</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {typeCards.map((card, i) => (
            <button
              key={card.tab}
              onClick={() => onNavigateTab(card.tab)}
              className={`press-scale group flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200 ${card.color} ${card.ring}`}
              style={{ animationDelay: `${200 + i * 40}ms` }}
            >
              {card.icon}
              <span className="text-2xl font-black tabular-nums">{card.count}</span>
              <span className="text-[11px] font-semibold opacity-80">{card.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Donut Chart + Office Distribution — 2 col grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* Animated Donut Chart — Equipment Age */}
        <div
          className="card-entrance rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900"
          style={{ animationDelay: '220ms' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Equipment Age</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">5-year government lifecycle policy</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${agingPct > 30 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'}`}>
              {agingPct}% aging
            </span>
          </div>

          {/* Donut */}
          <div className="flex flex-col items-center gap-4">
            <DonutChart
              withinCount={summary.within5YearsCount}
              beyondCount={summary.beyond5YearsCount}
              total={summary.total}
            />

            {/* Legend */}
            <div className="flex items-center justify-center gap-5 w-full">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">{summary.within5YearsCount} units</p>
                  <p className="text-[10px] text-zinc-400">{withinPct}% · Within 5 Yrs</p>
                </div>
              </div>
              <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800" />
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">{summary.beyond5YearsCount} units</p>
                  <p className="text-[10px] text-zinc-400">{agingPct}% · Beyond 5 Yrs</p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 text-center">
              {summary.beyond5YearsCount} of {summary.total} units exceeded the 5-year government lifecycle.
            </p>
          </div>
        </div>

        {/* Office Distribution */}
        <div
          className="card-entrance rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900"
          style={{ animationDelay: '280ms' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Office Distribution</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">{locationStats.length} offices &amp; divisions</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {locationStats.map((loc, i) => (
              <div
                key={loc.location}
                className="row-animate"
                style={{ animationDelay: `${300 + i * 40}ms` }}
              >
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[60%]" title={loc.location}>
                    {loc.location}
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 ml-2 tabular-nums">
                    {loc.count}
                    <span className="font-normal text-zinc-400 ml-1">({loc.percentage}%)</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(loc.count / maxLocationCount) * 100}%`,
                      background: 'linear-gradient(90deg, #16a34a 0%, #2563eb 100%)',
                      transitionDelay: `${300 + i * 40}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
