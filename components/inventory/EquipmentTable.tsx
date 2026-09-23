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
  | 'accountablePersonnel'
  | 'remarks';
type SortOrder = 'asc' | 'desc';

const TYPE_LABELS: Record<string, string> = {
  'Desktop Computers': 'Desktop PC',
  'Laptop Computers': 'Laptop',
  'Printers': 'Printer',
  'Scanners': 'Scanner',
};

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
  const isSorted = sortField === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={`group cursor-pointer select-none bg-inherit px-4 py-3 text-left text-xs font-bold uppercase tracking-wider transition ${
        isSorted
          ? 'text-zinc-950 dark:text-zinc-50'
          : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'
      } ${className}`}
    >
      <span className="flex items-center gap-1.5">
        {children}
        <span className={`text-[10px] ${isSorted ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600'}`}>
          {isSorted ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
        </span>
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
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
      {/* Scrollable Table Area with Sticky Thead */}
      <div className="flex-1 min-h-0 overflow-auto relative">
        <table className="w-full min-w-[880px] text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 border-b-2 border-zinc-300 bg-slate-100/95 backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-950/95 shadow-xs">
            <tr>
              <SortableHeader field="propertyNumber" className="pl-4" sortField={sortField} sortOrder={sortOrder} onSort={handleSort}>
                Property No.
              </SortableHeader>
              <SortableHeader field="brand" sortField={sortField} sortOrder={sortOrder} onSort={handleSort}>
                Equipment & Model
              </SortableHeader>
              <SortableHeader field="equipmentType" sortField={sortField} sortOrder={sortOrder} onSort={handleSort}>
                Type
              </SortableHeader>
              <SortableHeader field="accountablePersonnel" sortField={sortField} sortOrder={sortOrder} onSort={handleSort}>
                Accountable Officer
              </SortableHeader>
              <SortableHeader field="location" sortField={sortField} sortOrder={sortOrder} onSort={handleSort}>
                Office / Division
              </SortableHeader>
              <SortableHeader field="statusCategory" sortField={sortField} sortOrder={sortOrder} onSort={handleSort}>
                Status
              </SortableHeader>
              <SortableHeader field="remarks" className="min-w-[200px]" sortField={sortField} sortOrder={sortOrder} onSort={handleSort}>
                Remarks
              </SortableHeader>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 pr-4 bg-inherit">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">No equipment found</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Try adjusting your search query or active filters.</p>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, idx) => {
                const typeLabel = TYPE_LABELS[item.equipmentType] ?? item.equipmentType;
                return (
                  <tr
                    key={item.id}
                    onClick={() => onViewDetails(item)}
                    className="group cursor-pointer transition-colors even:bg-white odd:bg-slate-50/50 hover:bg-blue-50/70 dark:even:bg-zinc-900 dark:odd:bg-zinc-900/60 dark:hover:bg-zinc-800/80 row-animate"
                    style={{ animationDelay: `${Math.min(idx, 20) * 16}ms` }}
                  >
                    {/* 1. Property Number + Serial Number */}
                    <td className="whitespace-nowrap pl-4 pr-3 py-2.5">
                      <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-50 truncate max-w-[160px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={item.propertyNumber}>
                        {item.propertyNumber}
                      </p>
                      {item.serialNumber ? (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[160px]" title={`Serial No: ${item.serialNumber}`}>
                          SN: {item.serialNumber}
                        </p>
                      ) : (
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-600">—</p>
                      )}
                    </td>

                    {/* 2. Model + Brand / Specs */}
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-50 truncate max-w-[220px]" title={item.model}>
                        {item.model}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[220px]">
                        <span>{item.brand}</span>
                        {item.computerName && (
                          <>
                            <span>·</span>
                            <span className="truncate" title={item.computerName}>{item.computerName}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 3. Type: Formal Office Badge */}
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                        {typeLabel}
                      </span>
                    </td>

                    {/* 4. Accountable Officer */}
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[170px]" title={item.accountablePersonnel}>
                        {item.accountablePersonnel}
                      </p>
                    </td>

                    {/* 5. Location / Office: Distinct high-contrast badge */}
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200 max-w-[160px] truncate" title={item.location}>
                        {item.location}
                      </span>
                    </td>

                    {/* 6. Status: Clear, high-contrast formal badge */}
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <StatusBadge
                        category={item.statusCategory}
                        rawStatus={item.status}
                        remarks={item.remarks}
                        size="sm"
                        showRemark={false}
                      />
                    </td>

                    {/* 7. Remarks / Maintenance Notes: Stretches responsively to display full text */}
                    <td className="px-4 py-2.5 min-w-[200px]">
                      {item.remarks ? (
                        <p
                          className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-normal break-words"
                          title={item.remarks}
                        >
                          {item.remarks}
                        </p>
                      ) : (
                        <span className="text-xs text-zinc-400 dark:text-zinc-600">—</span>
                      )}
                    </td>

                    {/* 8. Actions: View, Edit, and Delete action buttons (shown on row hover) */}
                    <td className="whitespace-nowrap pr-4 pl-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onViewDetails(item)}
                          className="rounded-md p-1.5 text-zinc-500 hover:bg-blue-100 hover:text-blue-700 dark:text-zinc-400 dark:hover:bg-blue-950 dark:hover:text-blue-300 transition-colors"
                          title="View Details"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onEditItem(item)}
                          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 transition-colors"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteItem(item)}
                          className="rounded-md p-1.5 text-zinc-500 hover:bg-red-100 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-950 dark:hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="shrink-0 flex flex-col items-center justify-between gap-3 border-t border-zinc-300 bg-slate-100/90 px-4 py-2.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-600 dark:text-zinc-400">Rows per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-800 shadow-2xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="hidden sm:inline font-medium text-zinc-600 dark:text-zinc-400 ml-1">
            {items.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + itemsPerPage, items.length)} of {items.length} units
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-medium">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >« First</button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >Previous</button>
          <span className="px-2 font-bold text-zinc-900 dark:text-zinc-50 text-xs">
            {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >Next</button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >Last »</button>
        </div>
      </div>
    </div>
  );
}
