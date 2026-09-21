'use client';

import React from 'react';
import { InventoryItem } from '@/types/inventory';

interface DeleteConfirmModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: InventoryItem) => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  item,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Delete Equipment Record?
            </h3>
            <p className="text-xs text-zinc-500">This action will remove the asset from the inventory.</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-800/40">
          <p className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
            {item.propertyNumber}
          </p>
          <p className="text-zinc-600 dark:text-zinc-400">
            {item.model} ({item.brand}) — {item.location}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Personnel: {item.accountablePersonnel}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(item)}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}
