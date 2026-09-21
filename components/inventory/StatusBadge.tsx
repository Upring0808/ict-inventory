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
        'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40';
      dotColor = 'bg-emerald-500';
      break;
    case 'Needs Attention':
      badgeStyle =
        'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40';
      dotColor = 'bg-amber-500';
      break;
    case 'Parts Replacement':
      badgeStyle =
        'bg-orange-50 text-orange-800 border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/40';
      dotColor = 'bg-orange-500';
      break;
    case 'For Repair':
      badgeStyle =
        'bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40';
      dotColor = 'bg-rose-500';
      break;
    case 'For Disposal':
      badgeStyle =
        'bg-purple-50 text-purple-800 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40';
      dotColor = 'bg-purple-500';
      break;
    default:
      badgeStyle =
        'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
      dotColor = 'bg-zinc-400';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <div className="inline-flex max-w-full flex-col gap-1">
      <span
        className={`inline-flex max-w-full self-start items-center gap-1.5 rounded-full border font-medium ${badgeStyle} ${padding}`}
        title={remarks || rawStatus || category}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
        <span className="min-w-0 truncate">{category}</span>
      </span>
      {showRemark && remarks && (
        <span className="max-w-full truncate text-[11px] leading-4 text-zinc-500 dark:text-zinc-400" title={remarks}>
          {remarks}
        </span>
      )}
    </div>
  );
}
