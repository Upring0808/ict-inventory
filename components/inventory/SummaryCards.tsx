'use client';

import React from 'react';
import { InventorySummary } from '@/types/inventory';

interface SummaryCardsProps {
  summary: InventorySummary;
  selectedType: string;
  selectedStatus: string;
  selectedShelfLife: string;
  onSelectType: (type: string) => void;
  onSelectStatus: (status: string) => void;
  onSelectShelfLife: (shelfLife: string) => void;
}

export function SummaryCards({
  summary,
  selectedType,
  selectedStatus,
  selectedShelfLife,
  onSelectType,
  onSelectStatus,
  onSelectShelfLife,
}: SummaryCardsProps) {
  const categoryCards = [
    {
      id: 'Desktop Computers',
      name: 'Desktop Computers',
      count: summary.desktopCount,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40',
      activeBorder: 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400',
    }, 
    {
      id: 'Laptop Computers',
      name: 'Laptop Computers',
      count: summary.laptopCount,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      color: 'from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-900/40',
      activeBorder: 'border-indigo-500 ring-2 ring-indigo-500/20 dark:border-indigo-400',
    },
    {
      id: 'Printers',
      name: 'Printers',
      count: summary.printerCount,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
      ),
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-400',
    },
    {
      id: 'Scanners',
      name: 'Scanners',
      count: summary.scannerCount,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
      ),
      color: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20 dark:border-amber-400',
    },
  ];

  const statusPills = [
    {
      id: '',
      label: 'All Conditions',
      count: summary.total,
      color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      activeColor: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold',
    },
    {
      id: 'Serviceable',
      label: 'Serviceable',
      count: summary.serviceableCount,
      color: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40',
      activeColor: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30',
    },
    {
      id: 'Needs Attention',
      label: 'Needs Attention',
      count: summary.needsAttentionCount,
      color: 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
      activeColor: 'bg-amber-600 text-white shadow-sm shadow-amber-600/30',
    },
    {
      id: 'Parts Replacement',
      label: 'Parts Replacement',
      count: summary.partsReplacementCount,
      color: 'bg-orange-50 text-orange-700 border border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/40',
      activeColor: 'bg-orange-600 text-white shadow-sm shadow-orange-600/30',
    },
    {
      id: 'For Repair',
      label: 'For Repair',
      count: summary.forRepairCount,
      color: 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40',
      activeColor: 'bg-rose-600 text-white shadow-sm shadow-rose-600/30',
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Assets Card */}
        <div
          onClick={() => {
            onSelectType('');
            onSelectShelfLife('');
          }}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            selectedType === '' && selectedShelfLife === ''
              ? 'border-zinc-900 bg-zinc-900 text-white shadow-md dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
              : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
              Total Fleet
            </span>
            <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {summary.serviceableRate}% Good
            </span>
          </div>
          <div className="mt-2 text-2xl font-black">{summary.total}</div>
          <span className="text-[11px] opacity-70">registered units</span>
        </div>

        {/* Beyond 5 Years Card (Old Equipment Highlight) */}
        <div
          onClick={() =>
            onSelectShelfLife(selectedShelfLife === 'BEYOND 5 YEARS' ? '' : 'BEYOND 5 YEARS')
          }
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            selectedShelfLife === 'BEYOND 5 YEARS'
              ? 'border-amber-500 bg-amber-500 text-white shadow-md dark:border-amber-400'
              : 'border-amber-200/80 bg-amber-50/50 hover:border-amber-400 dark:border-amber-900/40 dark:bg-amber-950/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${selectedShelfLife === 'BEYOND 5 YEARS' ? 'text-white' : 'text-amber-700 dark:text-amber-400'}`}>
              Aging Fleet
            </span>
            <span className="text-xs">⏰</span>
          </div>
          <div className={`mt-2 text-2xl font-black ${selectedShelfLife === 'BEYOND 5 YEARS' ? 'text-white' : 'text-amber-700 dark:text-amber-300'}`}>
            {summary.beyond5YearsCount}
          </div>
          <span className={`text-[11px] font-medium ${selectedShelfLife === 'BEYOND 5 YEARS' ? 'text-white/80' : 'text-amber-600 dark:text-amber-400'}`}>
            &gt; 5 years old ({summary.agingRate}%)
          </span>
        </div>

        {/* 4 Category Quick Cards */}
        {categoryCards.map((card) => {
          const isSelected = selectedType === card.id;
          return (
            <div
              key={card.id}
              onClick={() => onSelectType(isSelected ? '' : card.id)}
              className={`group cursor-pointer rounded-2xl border p-4 transition-all ${
                isSelected
                  ? card.activeBorder + ' bg-white shadow-md dark:bg-zinc-900'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border bg-gradient-to-br ${card.color}`}
                >
                  {card.icon}
                </div>
                {isSelected && (
                  <span className="rounded-full bg-blue-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                    Active
                  </span>
                )}
              </div>

              <div className="mt-2.5">
                <div className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  {card.count}
                </div>
                <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                  {card.name.replace(' Computers', '')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Status Condition Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[11px] font-semibold text-zinc-400 mr-1 uppercase tracking-wider">
          Condition:
        </span>
        {statusPills.map((pill) => {
          const isSelected = selectedStatus === pill.id;
          return (
            <button
              key={pill.label}
              onClick={() => onSelectStatus(isSelected && pill.id !== '' ? '' : pill.id)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                isSelected ? pill.activeColor : pill.color + ' hover:opacity-80'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isSelected ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'
                }`}
              >
                {pill.count}
              </span>
            </button>
          );
        })}

        {/* Shelf-Life Quick Pills */}
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

        <button
          onClick={() =>
            onSelectShelfLife(selectedShelfLife === 'BEYOND 5 YEARS' ? '' : 'BEYOND 5 YEARS')
          }
          className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
            selectedShelfLife === 'BEYOND 5 YEARS'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'border border-amber-300/80 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
          }`}
        >
          <span>⏰ 5+ Years Old Equipment</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
            {summary.beyond5YearsCount}
          </span>
        </button>
      </div>
    </div>
  );
}
