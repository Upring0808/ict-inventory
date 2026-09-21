'use client';

import React, { useState } from 'react';
import { InventoryItem, EquipmentStatusCategory } from '@/types/inventory';
import { StatusBadge } from './StatusBadge';
import { EquipmentQrLabel } from './EquipmentQrLabel';

interface EquipmentDetailDrawerProps {
  item: InventoryItem | null;
  onClose: () => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  // kept for API compatibility but not used in read-only view
  onQuickStatusChange?: (item: InventoryItem, newCategory: EquipmentStatusCategory) => void;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-0.5">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 break-words">
        {value || <span className="text-zinc-400 dark:text-zinc-600 font-normal italic">—</span>}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {title}
        </h4>
      </div>
      <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

export function EquipmentDetailDrawer({
  item,
  onClose,
  onEdit,
  onDelete,
}: EquipmentDetailDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [showAllCheckIns, setShowAllCheckIns] = useState(false);

  if (!item) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(item.propertyNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBeyond5 = item.shelfLife === 'BEYOND 5 YEARS';
  const currentYear = new Date().getFullYear();
  const yearNum = item.yearAcquired ? parseInt(item.yearAcquired.match(/\d{4}/)?.[0] ?? '0') : 0;
  const age = yearNum > 2000 ? currentYear - yearNum : null;

  const isComputer =
    item.equipmentType === 'Desktop Computers' ||
    item.equipmentType === 'Laptop Computers';
  const checkIns = item.verificationHistory || [];

  return (
    /* Backdrop — z-50 */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-label="Equipment details" className="flex max-h-[94svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-zinc-200/80 bg-zinc-50 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 dark:border-zinc-800 dark:bg-zinc-950 sm:max-h-[92vh] sm:rounded-2xl sm:zoom-in-95">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200/80 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                {item.equipmentType}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                  isBeyond5
                    ? 'border-amber-300/60 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                }`}
              >
                {isBeyond5 ? '⏰ Aging' : '✓ Within 5 Yrs'}
                {age !== null && ` · ${age}yr`}
              </span>
              <StatusBadge
                category={item.statusCategory}
                rawStatus={item.status}
                remarks={item.remarks}
                size="sm"
                showRemark={false}
              />
            </div>
            <h3 className="mt-1.5 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
              {item.model}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.brand}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
            title="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {/* Identity IDs */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 sm:grid-cols-2">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Property Number</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {item.propertyNumber}
                </span>
                <button
                  onClick={handleCopy}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-100 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Serial Number</span>
              <span className="mt-1 block font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 break-all">
                {item.serialNumber || <span className="text-zinc-400 italic font-normal">Not recorded</span>}
              </span>
            </div>
          </div>

          <EquipmentQrLabel item={item} />

          <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Verification audit</h4>
                <p className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {item.verificationCount || 0} QR confirmation{item.verificationCount === 1 ? '' : 's'}
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {item.lastVerifiedAt ? 'Verified' : 'Not verified yet'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 border-t border-zinc-100 pt-3 text-xs dark:border-zinc-800 sm:grid-cols-2">
              <InfoRow label="Last verified" value={item.lastVerifiedAt ? new Date(item.lastVerifiedAt).toLocaleString() : undefined} />
              <InfoRow label="Verified by" value={item.lastVerifiedBy} />
              <InfoRow label="Last updated by approved QR" value={item.updatedAt ? new Date(item.updatedAt).toLocaleString() : undefined} />
            </div>
            {checkIns.length > 0 && (
              <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Check-in history</p>
                <div className="mt-2 space-y-1.5">
                  {(showAllCheckIns ? checkIns : checkIns.slice(0, 3)).map((verification) => (
                    <div key={verification.id} className="text-[11px] text-zinc-600 dark:text-zinc-300">
                      <p><span className="font-semibold">QR verified</span> · {new Date(verification.verifiedAt).toLocaleString()}{verification.verifiedBy ? ` by ${verification.verifiedBy}` : ''}</p>
                      {verification.comment && <p className="mt-1 rounded-lg bg-zinc-50 px-2 py-1.5 leading-relaxed text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{verification.comment}</p>}
                      {verification.remarkResolved && <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">✓ Active remark resolved{verification.resolvedRemark ? `: ${verification.resolvedRemark}` : ''}</p>}
                    </div>
                  ))}
                </div>
                {checkIns.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCheckIns((showAll) => !showAll)}
                    className="mt-3 text-[11px] font-bold text-blue-700 transition hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {showAllCheckIns ? 'Show recent check-ins' : `Show all ${checkIns.length} check-ins`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Hardware specs — only for computers */}
          {isComputer && (
            <Section title="Hardware & Software Specifications">
              <InfoRow label="Processor" value={item.processor} />
              <InfoRow label="RAM" value={item.ram} />
              <InfoRow label="Graphics (GPU)" value={item.gpu} />
              <InfoRow label="Operating System" value={item.osInstalled} />
              <InfoRow label="Office Productivity" value={item.officeProductivityProduct} />
              <InfoRow label="Endpoint Protection" value={item.endpointProtection} />
            </Section>
          )}

          {/* Custody */}
          <Section title="Accountability & Office Custody">
            <InfoRow label="Accountable Officer" value={item.accountablePersonnel} />
            <InfoRow label="Division / Office" value={item.location} />
            <InfoRow label="Year Acquired" value={item.yearAcquired} />
            <InfoRow label="Employment Status" value={item.accountableStatus} />
          </Section>

          {/* Condition */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
              Condition & Maintenance
            </h4>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoRow label="Condition" value={item.statusCategory} />
              <InfoRow label="PMS Conducted" value={item.datePmsConducted} />
              {item.remarks && (
                <div className="col-span-2 sm:col-span-3">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Remarks / Notes</span>
                  <p className="mt-1 rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                    {item.remarks}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-zinc-200/80 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/80">
          <button
            onClick={() => onDelete(item)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Close
            </button>
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-green-500 hover:to-blue-500 transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
