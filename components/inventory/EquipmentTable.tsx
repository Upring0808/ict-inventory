'use client';

import React, { useState } from 'react';
import { InventoryItem } from '@/types/inventory';
import { StatusBadge } from './StatusBadge';

interface EquipmentTableProps {
  items: InventoryItem[];
  onViewDetails: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
}

type SortField =
  | 'propertyNumber'
  | 'equipmentType'
  | 'brand'
  | 'location'
  | 'statusCategory'
  | 'accountablePersonnel';
type SortOrder = 'asc' | 'desc';

function getAcquiredYear(yearStr?: string): number | null {
  if (!yearStr) return null;
  const match = yearStr.match(/\b(19\d\d|20\d\d)\b/);
  return match ? parseInt(match[1], 10) : null;
}

function AgeIndicator({ yearAcquired, shelfLife }: { yearAcquired?: string; shelfLife: string }) {
  const yr = getAcquiredYear(yearAcquired);
  const isOld = shelfLife === 'BEYOND 5 YEARS';
  const currentYear = new Date().getFullYear();
  const age = yr ? currentYear - yr : null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
        isOld ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
      }`}
      title={age !== null ? `${age} years old` : undefined}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isOld ? 'bg-amber-500' : 'bg-emerald-500'}`}
      />
      {yr ? yr : '—'}
      {age !== null && (
        <span className="text-zinc-400 font-normal">({age}yr)</span>
      )}
    </span>
  );
}

const TYPE_LABELS: Record<string, { short: string; emoji: string }> = {
  'Desktop Computers': { short: 'Desktop', emoji: '🖥️' },
  'Laptop Computers': { short: 'Laptop', emoji: '💻' },
  Printers: { short: 'Printer', emoji: '🖨️' },
  Scanners: { short: 'Scanner', emoji: '📄' },
};

function SortIcon({
  field,
  sortField,
  sortOrder,
}: {
  field: SortField;
  sortField: SortField;
  sortOrder: SortOrder;
}) {
  return (
    <span className={`ml-0.5 text-[10px] ${sortField === field ? 'text-blue-600' : 'text-zinc-300 group-hover:text-zinc-400'}`}>
      {sortField === field ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );
}

function SortableHeader({
  field,
  children,
  className = '',
  sortField,
  sortOrder,
  onSort,
}: {
  field: SortField;
  children: React.ReactNode;
  className?: string;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}) {
  return (
    <th
      onClick={() => onSort(field)}
      className={`group cursor-pointer select-none bg-inherit px-3 py-3 text-left text-[11px] font-semibold text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 ${className}`}
    >
      <span className="flex items-center gap-0.5">
        {children}
        <SortIcon field={field} sortField={sortField} sortOrder={sortOrder} />
      </span>
    </th>
  );
}

export function EquipmentTable({
  items,
  onViewDetails,
  onEditItem,
  onDeleteItem,
}: EquipmentTableProps) {
  const [sortField, setSortField] = useState<SortField>('propertyNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    let aVal: string | number = a[sortField] ?? '';
    let bVal: string | number = b[sortField] ?? '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex-1 min-h-0 overflow-auto relative">
        <table className="w-full min-w-[640px] text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 border-b border-zinc-200/80 bg-zinc-50/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
            <tr>
              <SortableHeader field="propertyNumber" className="pl-4" sortField={sortField} sortOrder={sortOrder} onSort={handleSort}>Property No.</SortableHeader>
              <SortableHeader field="equipmentType" sortField={sortField} sortOrder={sortOrder} onSort={handleSort}>Type</SortableHeader>
              <SortableHeader field="brand" sortField={sortField} sortOrder={sortOrder} onSort={handleSort}>Model / Brand</SortableHeader>
              <SortableHeader field="accountablePersonnel" sortField={sortField} sortOrder={sortOrder} onSort={handleSort}>Accountable</SortableHeader>
              <SortableHeader field="location" sortField={sortField} sortOrder={sortOrder} onSort={handleSort}>Division</SortableHeader>
              <SortableHeader field="statusCategory" sortField={sortField} sortOrder={sortOrder} onSort={handleSort}>Status</SortableHeader>
              <th className="px-3 py-3 text-right text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 pr-4 bg-inherit">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100/80 dark:divide-zinc-800/60">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No equipment found</p>
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Try adjusting your search or filters.</p>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, idx) => {
                const typeInfo = TYPE_LABELS[item.equipmentType] ?? { short: item.equipmentType, emoji: '🔧' };
                return (
                  <tr
                    key={item.id}
                    onClick={() => onViewDetails(item)}
                    className="group cursor-pointer transition hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 row-animate"
                    style={{ animationDelay: `${Math.min(idx, 20) * 18}ms` }}
                  >
                    {/* Property Number + Serial Number + Age dot */}
                    <td className="whitespace-nowrap pl-4 pr-3 py-3">
                      <p className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[150px]" title={item.propertyNumber}>
                        {item.propertyNumber}
                      </p>
                      {item.serialNumber && (
                        <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 truncate max-w-[150px]" title={`S/N: ${item.serialNumber}`}>
                          S/N: {item.serialNumber}
                        </p>
                      )}
                      <AgeIndicator yearAcquired={item.yearAcquired} shelfLife={item.shelfLife} />
                    </td>

                    {/* Type */}
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {typeInfo.emoji} {typeInfo.short}
                      </span>
                    </td>

                    {/* Model + Brand */}
                    <td className="px-3 py-3">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]" title={item.model}>
                        {item.model}
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{item.brand}</p>
                    </td>

                    {/* Acquired year — now shown as part of Property No. cell above; this col shows accountable */}
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 truncate max-w-[130px]" title={item.accountablePersonnel}>
                        {item.accountablePersonnel}
                      </p>
                    </td>

                    {/* Division / Location */}
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {item.location}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <StatusBadge
                        category={item.statusCategory}
                        rawStatus={item.status}
                        remarks={item.remarks}
                        size="sm"
                      />
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap pr-4 pl-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onViewDetails(item)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
                          title="View Details"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onEditItem(item)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          title="Edit"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteItem(item)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="shrink-0 flex flex-col items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/40 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Rows:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="hidden sm:inline text-zinc-400">
            {items.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + itemsPerPage, items.length)} of {items.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="rounded-lg border border-zinc-200 px-2 py-1 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >«</button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-zinc-200 px-2.5 py-1 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >Prev</button>
          <span className="px-2 font-semibold text-zinc-700 dark:text-zinc-300">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-zinc-200 px-2.5 py-1 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >Next</button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-zinc-200 px-2 py-1 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >»</button>
        </div>
      </div>
    </div>
  );
}
