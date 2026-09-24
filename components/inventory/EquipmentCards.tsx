'use client';

import React from 'react';
import { InventoryItem } from '@/types/inventory';
import { StatusBadge } from './StatusBadge';

interface EquipmentCardsProps {
  items: InventoryItem[];
  onViewDetails: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
}

export function EquipmentCards({
  items,
  onViewDetails,
  onEditItem,
  onDeleteItem,
}: EquipmentCardsProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
        <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">No equipment found</p>
        <p className="text-xs text-zinc-500">Adjust your filters to see results.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => {
        const isBeyond5 = item.shelfLife === 'BEYOND 5 YEARS';

        return (
          <div
            key={item.id}
            onClick={() => onViewDetails(item)}
            className="group relative cursor-pointer rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition-all hover:border-blue-300 hover:shadow-md focus-within:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            {/* Header: Property number & Shelf life badge */}
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate" title={item.propertyNumber}>
                {item.propertyNumber}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isBeyond5
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {isBeyond5 ? '> 5 Yrs' : '< 5 Yrs'}
              </span>
            </div>

            {/* Model & Brand */}
            <div className="mt-2">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-50 truncate" title={item.model}>
                {item.model}
              </h4>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-bold text-blue-600 dark:text-blue-400">{item.brand}</span>
                <span>•</span>
                <span>{item.location}</span>
                {item.yearAcquired && <span>• ({item.yearAcquired})</span>}
              </div>
            </div>

            {/* Specs Snippet if available */}
            {(item.processor || item.ram || item.osInstalled) && (
              <div className="mt-2.5 flex flex-wrap gap-1 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                {item.processor && (
                  <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800 truncate max-w-[170px]" title={item.processor}>
                    {item.processor.split('(')[0]}
                  </span>
                )}
                {item.ram && (
                  <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
                    {item.ram}
                  </span>
                )}
                {item.osInstalled && (
                  <span className="rounded-md bg-blue-50 text-blue-700 px-1.5 py-0.5 dark:bg-blue-950 dark:text-blue-300">
                    {item.osInstalled}
                  </span>
                )}
              </div>
            )}

            {/* Accountable Personnel */}
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-zinc-50 p-2 text-xs dark:bg-zinc-800/60">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                {item.accountablePersonnel.slice(0, 2).toUpperCase()}
              </div>
              <span className="truncate font-medium text-zinc-800 dark:text-zinc-200" title={item.accountablePersonnel}>
                {item.accountablePersonnel}
              </span>
            </div>

            {/* Status & Remarks */}
            <div className="mt-3">
              <StatusBadge
                category={item.statusCategory}
                rawStatus={item.status}
                remarks={item.remarks}
                size="sm"
              />
            </div>

            {/* Footer with actions */}
            <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-xs text-zinc-400 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
              <button type="button" data-equipment-id={item.id} onClick={() => onViewDetails(item)} className="rounded-md px-1.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/40">View details</button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEditItem(item)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50"
                  title="Edit Equipment"
                  aria-label={`Edit ${item.propertyNumber}`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteItem(item)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                  title="Delete Equipment"
                  aria-label={`Delete ${item.propertyNumber}`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
