'use client';

import React from 'react';
import { FilterState } from '@/types/inventory';
import { AnimatedDropdown, DropdownOption } from '@/components/ui/AnimatedDropdown';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availableLocations: string[];
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
  resultCount: number;
}

export function FilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  availableLocations,
  viewMode,
  onViewModeChange,
  resultCount,
}: FilterBarProps) {
  const hasActiveFilters = Boolean(
    filters.searchQuery ||
    filters.location ||
    filters.statusCategory ||
    filters.year
  );

  const statusOptions: DropdownOption[] = [
    { value: '', label: 'All Statuses' },
    { value: 'Serviceable', label: 'Serviceable' },
    { value: 'Needs Attention', label: 'Needs Attention' },
    { value: 'Parts Replacement', label: 'Parts Replacement' },
    { value: 'For Repair', label: 'For Repair' },
    { value: 'For Disposal', label: 'For Disposal' },
  ];

  const yearOptions: DropdownOption[] = [
    { value: '', label: 'All Years' },
    { value: '5_YEARS_OLD', label: 'Aging (5+ years)' },
    { value: '2025', label: '2025' },
    { value: '2024', label: '2024' },
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' },
    { value: '2021', label: '2021' },
    { value: '2020', label: '2020' },
    { value: 'OLDER', label: '2019 & Older' },
  ];

  const locationOptions: DropdownOption[] = [
    { value: '', label: 'All Offices' },
    ...availableLocations.map((loc) => ({ value: loc, label: loc })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filter Dropdowns */}
      <AnimatedDropdown
        options={statusOptions}
        value={filters.statusCategory}
        onChange={(val) => onFilterChange({ statusCategory: val })}
        placeholder="All Statuses"
      />

      <AnimatedDropdown
        options={yearOptions}
        value={filters.year}
        onChange={(val) => onFilterChange({ year: val })}
        placeholder="All Years"
      />

      <AnimatedDropdown
        options={locationOptions}
        value={filters.location}
        onChange={(val) => onFilterChange({ location: val })}
        placeholder="All Offices"
      />

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onResetFilters}
          className="flex items-center gap-1 rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          title="Reset all filters"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}

      {/* Divider */}
      <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

      {/* Result count */}
      <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
        <strong className="text-zinc-800 dark:text-zinc-200">{resultCount}</strong> results
      </span>

      {/* View Mode Toggle */}
      <div className="ml-auto flex rounded-xl border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
        <button
          onClick={() => onViewModeChange('table')}
          title="Table view"
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
            viewMode === 'table'
              ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" />
          </svg>
          <span className="hidden sm:inline">Table</span>
        </button>
        <button
          onClick={() => onViewModeChange('cards')}
          title="Card view"
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
            viewMode === 'cards'
              ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="hidden sm:inline">Cards</span>
        </button>
      </div>
    </div>
  );
}
