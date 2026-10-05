import Link from 'next/link';
import type { InventoryItem } from '@/types/inventory';
import { StatusBadge } from './StatusBadge';
import { EquipmentVerificationField, formatVerificationDate } from './EquipmentVerificationField';

interface EquipmentVerificationSummaryProps {
  item: InventoryItem;
  canEdit: boolean;
  className?: string;
}

export function EquipmentVerificationSummary({
  item,
  canEdit,
  className = '',
}: EquipmentVerificationSummaryProps) {
  return (
    <article
      aria-label="Equipment summary"
      className={'min-w-0 overflow-hidden rounded-2xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 ' + className}
    >
      <header className="bg-[#123640] px-4 pb-4 pt-4 text-white sm:px-5 sm:pb-5 sm:pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="max-w-full rounded-md border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
            {item.equipmentType}
          </span>
          <StatusBadge
            category={item.statusCategory}
            rawStatus={item.status}
            remarks={item.remarks}
            size="sm"
            showRemark={false}
          />
        </div>

        <div className="mt-4 min-w-0">
          <h2 className="break-words text-2xl font-semibold leading-tight tracking-tight text-white sm:text-[28px]">
            {item.model}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-200">{item.brand}</p>
        </div>

        <div className="mt-4 flex min-w-0 items-center gap-3 border-t border-white/20 pt-3">
          <dl className="min-w-0 flex-1">
            <EquipmentVerificationField label="Property number" value={item.propertyNumber} monospace inverse />
          </dl>
          {canEdit && (
            <Link
              href={'/?edit=' + encodeURIComponent(item.propertyNumber)}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-white/40 bg-white px-3 text-sm font-semibold text-[#123640] transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#123640]"
            >
              Edit record
            </Link>
          )}
        </div>
      </header>

      <dl className="grid grid-cols-2 divide-x divide-y divide-slate-300 bg-white dark:divide-slate-700 dark:bg-slate-900">
        <div className="min-w-0 px-4 py-3 sm:px-5">
          <EquipmentVerificationField label="Accountable person" value={item.accountablePersonnel} />
        </div>
        <div className="min-w-0 px-4 py-3 sm:px-5">
          <EquipmentVerificationField label="Office / division" value={item.location} />
        </div>
        <div className="min-w-0 px-4 py-3 sm:px-5">
          <EquipmentVerificationField label="Serial number" value={item.serialNumber} monospace />
        </div>
        <div className="min-w-0 px-4 py-3 sm:px-5">
          <EquipmentVerificationField
            label="Last verified"
            value={formatVerificationDate(item.lastVerifiedAt)}
          />
        </div>
      </dl>

      {item.remarks && (
        <div
          role="note"
          className="border-t border-amber-300 bg-amber-100 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/60 sm:px-5"
        >
          <p className="text-xs font-semibold text-amber-950 dark:text-amber-200">Maintenance note</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-amber-900 dark:text-amber-100">
            {item.remarks}
          </p>
        </div>
      )}
    </article>
  );
}
