'use client';

import React from 'react';
import { EquipmentStatusCategory } from '@/types/inventory';

interface StatusBadgeProps {
  category: EquipmentStatusCategory;
  rawStatus?: string;
  remarks?: string;
  size?: 'sm' | 'md';
  showRemark?: boolean;
}

export function StatusBadge({ category, rawStatus, remarks, size = 'md', showRemark = true }: StatusBadgeProps) {
  let badgeStyle = '';
  let dotColor = '';

  switch (category) {
    case 'Serviceable':
      badgeStyle =
        'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700/80 dark:bg-emerald-950/40 dark:text-emerald-200';
      dotColor = 'bg-emerald-600 dark:bg-emerald-400';
      break;
    case 'Needs Attention':
      badgeStyle =
        'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700/80 dark:bg-amber-950/40 dark:text-amber-200';
      dotColor = 'bg-amber-600 dark:bg-amber-400';
      break;
    case 'Parts Replacement':
      badgeStyle =
        'border-orange-300 bg-orange-50 text-orange-950 dark:border-orange-700/80 dark:bg-orange-950/40 dark:text-orange-200';
      dotColor = 'bg-orange-600 dark:bg-orange-400';
      break;
    case 'For Repair':
      badgeStyle =
        'border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-700/80 dark:bg-rose-950/40 dark:text-rose-200';
      dotColor = 'bg-rose-600 dark:bg-rose-400';
      break;
    case 'For Disposal':
      badgeStyle =
        'border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200';
      dotColor = 'bg-zinc-500 dark:bg-zinc-400';
      break;
    default:
      badgeStyle =
        'border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200';
      dotColor = 'bg-zinc-500';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <div className="inline-flex max-w-full flex-col gap-0.5">
      <span
        className={`inline-flex max-w-full self-start items-center gap-1.5 rounded-md border font-medium ${badgeStyle} ${padding}`}
        title={remarks || rawStatus || category}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
        <span className="min-w-0 truncate">{category}</span>
      </span>
      {showRemark && remarks && (
        <span className="max-w-full truncate text-[11px] leading-tight text-zinc-500 dark:text-zinc-400" title={remarks}>
          {remarks}
        </span>
      )}
    </div>
  );
}
