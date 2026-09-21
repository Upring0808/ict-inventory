'use client';

import React, { useState } from 'react';
import { InventoryItem, InventorySummary } from '@/types/inventory';
import {
  getLocationDistribution,
  getBrandDistribution,
  getOsDistribution,
  getRamDistribution,
} from '@/lib/summaryUtils';

interface AnalyticsSectionProps {
  items: InventoryItem[];
  summary: InventorySummary;
  selectedShelfLife: string;
  onSelectShelfLife: (shelfLife: string) => void;
  onSelectLocation: (loc: string) => void;
  onSelectBrand: (brand: string) => void;
}

type TabType = 'lifespan' | 'os' | 'hardware' | 'offices';

export function AnalyticsSection({
  items,
  summary,
  selectedShelfLife,
  onSelectShelfLife,
  onSelectLocation,
  onSelectBrand,
}: AnalyticsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('lifespan');

  const locationStats = getLocationDistribution(items, 8);
  const brandStats = getBrandDistribution(items, 8);
  const osStats = getOsDistribution(items);
  const ramStats = getRamDistribution(items);

  // Donut chart calculations for Lifespan
  const total = summary.total || 1;
  const beyondPct = Math.round((summary.beyond5YearsCount / total) * 100);
  const withinPct = 100 - beyondPct;

  // Circumference for r=40 is 2 * PI * 40 ≈ 251.3
  const circumference = 251.3;
  const beyondStroke = (beyondPct / 100) * circumference;
  const withinStroke = circumference - beyondStroke;

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/90">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800/80 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </span>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Executive Fleet Analytics & Hardware Intelligence
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Real-time audit insights across asset lifecycle, operating systems, and office custody
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-100/70 p-1 dark:border-zinc-800 dark:bg-zinc-800/60">
          <button
            onClick={() => setActiveTab('lifespan')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'lifespan'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <span>⏰ Lifespan (5+ Yrs)</span>
          </button>
          <button
            onClick={() => setActiveTab('os')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'os'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <span>💻 OS Audit</span>
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'hardware'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <span>⚡ RAM & Brands</span>
          </button>
          <button
            onClick={() => setActiveTab('offices')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'offices'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <span>🏢 Office Custody</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mt-5">
        {/* 1. Lifespan & 5+ Years Old Equipment */}
        {activeTab === 'lifespan' && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-center animate-in fade-in duration-200">
            {/* Donut Chart Visual */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5 dark:border-zinc-800/60 dark:bg-zinc-800/30 lg:col-span-5">
              <div className="relative flex items-center justify-center">
                <svg className="h-44 w-44 -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-zinc-200 dark:stroke-zinc-700"
                    strokeWidth="12"
                    fill="none"
                  />
                  {/* Within 5 Years arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-blue-600 dark:stroke-blue-500"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${withinStroke} ${circumference}`}
                    strokeLinecap="round"
                  />
                  {/* Beyond 5 Years arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-amber-500 dark:stroke-amber-400"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${beyondStroke} ${circumference}`}
                    strokeDashoffset={-withinStroke}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Center metric */}
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                    {summary.total}
                  </span>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Total Units
                  </span>
                </div>
              </div>

              {/* Quick Donut Legend */}
              <div className="mt-4 flex items-center gap-5 text-xs font-semibold">
                <button
                  onClick={() => onSelectShelfLife(selectedShelfLife === 'WITHIN 5 YEARS' ? '' : 'WITHIN 5 YEARS')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                    selectedShelfLife === 'WITHIN 5 YEARS'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span>Within 5 Yrs ({summary.within5YearsCount})</span>
                </button>

                <button
                  onClick={() => onSelectShelfLife(selectedShelfLife === 'BEYOND 5 YEARS' ? '' : 'BEYOND 5 YEARS')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                    selectedShelfLife === 'BEYOND 5 YEARS'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span>Beyond 5 Yrs ({summary.beyond5YearsCount})</span>
                </button>
              </div>
            </div>

            {/* Detailed Lifecycle Cards */}
            <div className="space-y-3 lg:col-span-7">
              {/* Beyond 5 Years Highlight Card */}
              <div
                onClick={() => onSelectShelfLife(selectedShelfLife === 'BEYOND 5 YEARS' ? '' : 'BEYOND 5 YEARS')}
                className={`cursor-pointer rounded-2xl border p-4.5 transition-all ${
                  selectedShelfLife === 'BEYOND 5 YEARS'
                    ? 'border-amber-500 bg-amber-500/10 shadow-md dark:border-amber-400'
                    : 'border-zinc-200 bg-gradient-to-br from-amber-500/5 to-orange-500/5 hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      ⏰
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Aging Equipment (Beyond 5 Years Shelf Life)
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Due for preventive maintenance overhaul, SSD upgrade, or replacement
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {summary.beyond5YearsCount}
                    </span>
                    <span className="block text-[11px] font-semibold text-zinc-400">
                      {beyondPct}% of fleet
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-amber-200/40 pt-2.5 text-xs text-amber-700 dark:text-amber-300">
                  <span>Includes 2014–2021 Desktop & Laptop deployments</span>
                  <span className="font-bold underline">
                    {selectedShelfLife === 'BEYOND 5 YEARS' ? 'Filter Active (Click to clear)' : 'Click to Filter Table →'}
                  </span>
                </div>
              </div>

              {/* Within 5 Years Modern Deployment Card */}
              <div
                onClick={() => onSelectShelfLife(selectedShelfLife === 'WITHIN 5 YEARS' ? '' : 'WITHIN 5 YEARS')}
                className={`cursor-pointer rounded-2xl border p-4.5 transition-all ${
                  selectedShelfLife === 'WITHIN 5 YEARS'
                    ? 'border-blue-500 bg-blue-500/10 shadow-md dark:border-blue-400'
                    : 'border-zinc-200 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      🛡️
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Modern Deployments (Within 5 Years Shelf Life)
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Standard operational lifespan under active warranty or manufacturer lifecycle
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      {summary.within5YearsCount}
                    </span>
                    <span className="block text-[11px] font-semibold text-zinc-400">
                      {withinPct}% of fleet
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-blue-200/40 pt-2.5 text-xs text-blue-700 dark:text-blue-300">
                  <span>Recent 2022–2026 units (Core i3/i5/i7 11th–14th Gen, Ultra 7)</span>
                  <span className="font-bold underline">
                    {selectedShelfLife === 'WITHIN 5 YEARS' ? 'Filter Active (Click to clear)' : 'Click to Filter Table →'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. OS Audit Tab */}
        {activeTab === 'os' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-200">
            {osStats.map((item) => (
              <div
                key={item.os}
                className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-800/40"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Operating System
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r ${item.color}`}
                  >
                    {item.os.includes('Legacy') ? 'Legacy OS' : 'Supported'}
                  </span>
                </div>
                <div className="mt-3">
                  <h4 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                    {item.os}
                  </h4>
                  <p className="text-2xl font-black tracking-tight text-zinc-800 dark:text-zinc-200 mt-1">
                    {item.count}{' '}
                    <span className="text-xs font-normal text-zinc-500">workstations</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. Hardware & RAM Tab */}
        {activeTab === 'hardware' && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 animate-in fade-in duration-200">
            {/* RAM Grid */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800/60 dark:bg-zinc-800/30">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                RAM Configuration Distribution
              </h4>
              <div className="grid grid-cols-3 gap-2.5">
                {ramStats.map((item) => (
                  <div
                    key={item.ram}
                    className="rounded-xl border border-zinc-200 bg-white p-3 text-center shadow-xs dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <span className="block text-xs font-bold text-blue-600 dark:text-blue-400">
                      {item.ram}
                    </span>
                    <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                      {item.count}
                    </span>
                    <span className="block text-[10px] text-zinc-400">units</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Brands Grid */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800/60 dark:bg-zinc-800/30">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                Top Equipment Brands (Click to Filter)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {brandStats.map((item) => (
                  <button
                    key={item.brand}
                    onClick={() => onSelectBrand(item.brand)}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-2.5 text-left transition hover:border-blue-500 hover:shadow-xs dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                      {item.brand}
                    </span>
                    <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {item.count} ({item.percentage}%)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. Offices Tab */}
        {activeTab === 'offices' && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 animate-in fade-in duration-200">
            {locationStats.map((loc) => (
              <button
                key={loc.location}
                onClick={() => onSelectLocation(loc.location)}
                className="group flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-3.5 text-left transition hover:border-blue-500 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Division
                  </span>
                  <h5 className="text-sm font-bold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400 truncate">
                    {loc.location}
                  </h5>
                </div>
                <div className="mt-3 flex items-baseline justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800">
                  <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                    {loc.count} <span className="text-xs font-normal text-zinc-400">units</span>
                  </span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {loc.percentage}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
