import Link from 'next/link';
import type { PublicEquipmentSummary } from '@/lib/publicEquipmentSummary';
import { getEquipmentYear } from '@/lib/inventoryFormatting';
import type { InventoryItem } from '@/types/inventory';
import { StatusBadge } from './StatusBadge';
import { EquipmentVerificationField, formatVerificationDate } from './EquipmentVerificationField';

interface EquipmentVerificationSummaryProps {
  item: InventoryItem | PublicEquipmentSummary;
  canEdit: boolean;
  className?: string;
}

export function EquipmentVerificationSummary({
  item,
  canEdit,
  className = '',
}: EquipmentVerificationSummaryProps) {
  const isPublic = 'registered' in item;

  return (
    <article
      aria-label="Equipment summary"
      className={'min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ' + className}
    >
      <header className="px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <span className="max-w-full rounded-md bg-[#f8eee9] px-2.5 py-1 text-xs font-semibold text-[#8c3e2b] dark:bg-[#513329] dark:text-[#ffd3c4]">
            {item.equipmentType}
          </span>
          <StatusBadge
            category={item.statusCategory}
            rawStatus={isPublic ? undefined : item.status}
            remarks={isPublic ? undefined : item.remarks}
            size="sm"
            showRemark={false}
          />
        </div>

        <div className="mt-6 min-w-0">
          <h2 className="break-words text-[26px] font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-[30px]">
            {item.model}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">{item.brand}</p>
        </div>
      </header>

      <div className="flex min-w-0 items-center gap-3 bg-[#202d31] px-5 py-4 text-white dark:bg-[#152429] sm:px-6">
        <dl className="min-w-0 flex-1">
          <EquipmentVerificationField label="Property number" value={item.propertyNumber} monospace inverse />
        </dl>
        {canEdit && !isPublic && (
          <Link
            href={'/?edit=' + encodeURIComponent(item.propertyNumber)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-white/35 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#202d31]"
          >
            Edit record
          </Link>
        )}
      </div>

      {isPublic ? (
        <dl className="grid grid-cols-2 divide-x divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
          <div className="min-w-0 px-5 py-4 sm:px-6">
            <EquipmentVerificationField label="Condition" value={item.statusCategory} />
          </div>
          <div className="min-w-0 px-5 py-4 sm:px-6">
            <EquipmentVerificationField label="Year acquired" value={getEquipmentYear(item)} />
          </div>
        </dl>
      ) : (
        <dl className="grid divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900 sm:grid-cols-2 sm:divide-y-0">
          <div className="min-w-0 px-5 py-3.5 sm:border-b sm:border-r sm:border-slate-200 sm:px-6 dark:sm:border-slate-800">
            <EquipmentVerificationField label="Accountable person" value={item.accountablePersonnel} />
          </div>
          <div className="min-w-0 px-5 py-3.5 sm:border-b sm:border-slate-200 sm:px-6 dark:sm:border-slate-800">
            <EquipmentVerificationField label="Office / division" value={item.location} />
          </div>
          <div className="min-w-0 px-5 py-3.5 sm:border-r sm:border-slate-200 sm:px-6 dark:sm:border-slate-800">
            <EquipmentVerificationField label="Serial number" value={item.serialNumber} monospace />
          </div>
          <div className="min-w-0 px-5 py-3.5 sm:px-6">
            <EquipmentVerificationField
              label="Last verified"
              value={formatVerificationDate(item.lastVerifiedAt)}
            />
          </div>
        </dl>
      )}

      {!isPublic && item.remarks && (
        <div
          role="note"
          className="border-t border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900/60 dark:bg-amber-950/30 sm:px-6"
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
