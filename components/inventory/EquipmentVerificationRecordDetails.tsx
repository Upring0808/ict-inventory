'use client';

import { useState } from 'react';
import type { InventoryItem } from '@/types/inventory';
import { EquipmentVerificationField, formatVerificationDate } from './EquipmentVerificationField';

interface EquipmentVerificationRecordDetailsProps {
  item: InventoryItem;
  verificationCount: number;
  className?: string;
}

export function EquipmentVerificationRecordDetails({
  item,
  verificationCount,
  className = '',
}: EquipmentVerificationRecordDetailsProps) {
  const [showAllCheckIns, setShowAllCheckIns] = useState(false);
  const isComputer = item.equipmentType === 'Desktop Computers' || item.equipmentType === 'Laptop Computers';
  const history = item.verificationHistory || [];
  const visibleHistory = showAllCheckIns ? history : history.slice(0, 3);

  return (
    <section
      aria-label="Full equipment record and verification history"
      className={'min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 ' + className}
    >
      <details className="group">
        <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-3 bg-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-700 sm:px-5">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-950 dark:text-slate-100">
              Full equipment record
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-700 dark:text-slate-300">
              Specifications, acquisition, and assignment
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300 group-open:hidden">
            View details
          </span>
          <span className="hidden shrink-0 text-xs font-semibold text-slate-700 group-open:inline dark:text-slate-300">
            Hide details
          </span>
        </summary>

        <div className="space-y-5 border-t border-slate-300 px-4 py-4 dark:border-slate-700 sm:px-5">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <EquipmentVerificationField label="Year acquired" value={item.yearAcquired} />
            <EquipmentVerificationField label="Shelf life" value={item.shelfLife} />
            <EquipmentVerificationField label="Accountable person's sex" value={item.accountableSex} />
            <EquipmentVerificationField label="Employment status" value={item.accountableStatus} />
            <EquipmentVerificationField label="Condition" value={item.statusCategory} />
            <EquipmentVerificationField label="Reported status" value={item.status} />
          </dl>

          {isComputer && (
            <section className="border-t border-slate-300 pt-4 dark:border-slate-700">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Hardware and software
              </h3>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <EquipmentVerificationField label="Computer name" value={item.computerName} />
                <EquipmentVerificationField label="Range category" value={item.rangeCategory} />
                <EquipmentVerificationField label="Processor" value={item.processor} />
                <EquipmentVerificationField label="RAM" value={item.ram} />
                <EquipmentVerificationField label="Graphics / GPU" value={item.gpu} />
                <EquipmentVerificationField label="Operating system" value={item.osInstalled} />
                <EquipmentVerificationField label="Office software" value={item.officeProductivityProduct} />
                <EquipmentVerificationField label="Endpoint protection" value={item.endpointProtection} />
              </dl>
            </section>
          )}
        </div>
      </details>

      <details className="group border-t border-slate-300 dark:border-slate-700">
        <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-3 bg-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-700 sm:px-5">
          <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">
            Verification history
          </span>
          <span className="shrink-0 text-xs font-medium text-slate-600 dark:text-slate-400">
            {verificationCount} {verificationCount === 1 ? 'check-in' : 'check-ins'}
          </span>
        </summary>

        <div className="border-t border-slate-300 px-4 py-4 dark:border-slate-700 sm:px-5">
          {history.length === 0 ? (
            <p className="text-sm leading-5 text-slate-600 dark:text-slate-400">
              No check-ins have been recorded for this equipment yet.
            </p>
          ) : (
            <>
              <ol className="space-y-4 border-l border-slate-200 pl-4 dark:border-slate-700">
                {visibleHistory.map((checkIn) => (
                  <li key={checkIn.id} className="relative min-w-0">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-700 dark:border-slate-900 dark:bg-emerald-400"
                    />
                    <p className="break-words text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">
                      {formatVerificationDate(checkIn.verifiedAt)}
                      {checkIn.verifiedBy ? ' · ' + checkIn.verifiedBy : ''}
                    </p>
                    {checkIn.verifiedByEmail && (
                      <p className="mt-0.5 break-all text-xs leading-5 text-slate-600 dark:text-slate-400">
                        {checkIn.verifiedByEmail}
                      </p>
                    )}
                    {checkIn.comment && (
                      <p className="mt-1.5 break-words text-sm leading-5 text-slate-700 dark:text-slate-300">
                        {checkIn.comment}
                      </p>
                    )}
                    {checkIn.remarkResolved && (
                      <p className="mt-1.5 text-xs font-medium leading-5 text-emerald-800 dark:text-emerald-300">
                        Maintenance note resolved
                        {checkIn.resolvedRemark ? ': ' + checkIn.resolvedRemark : ''}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
              {history.length > 3 && (
                <button
                  type="button"
                  aria-expanded={showAllCheckIns}
                  onClick={() => setShowAllCheckIns((showAll) => !showAll)}
                  className="mt-3 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/40 dark:text-emerald-300 dark:hover:bg-slate-800"
                >
                  {showAllCheckIns ? 'Show recent check-ins' : 'Show all ' + history.length + ' check-ins'}
                </button>
              )}
            </>
          )}
        </div>
      </details>
    </section>
  );
}
