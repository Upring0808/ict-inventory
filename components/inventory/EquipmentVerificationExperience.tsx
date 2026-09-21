'use client';

import React, { useEffect, useState } from 'react';
import { InventoryItem } from '@/types/inventory';
import { findItemByPropertyNumber, recordQrVerification } from '@/lib/inventoryService';
import { StatusBadge } from './StatusBadge';

interface EquipmentVerificationExperienceProps {
  propertyNumber: string | null;
}

function formatDate(value?: string) {
  if (!value) return 'Not yet verified';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function ReviewField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-zinc-800 dark:text-zinc-100">{value || '—'}</p>
    </div>
  );
}

export function EquipmentVerificationExperience({ propertyNumber }: EquipmentVerificationExperienceProps) {
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [verifierName, setVerifierName] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setMessage(null);
      setConfirmed(false);
      const found = propertyNumber ? await findItemByPropertyNumber(propertyNumber) : null;
      if (active) {
        setItem(found);
        setIsLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [propertyNumber]);

  const handleVerify = async () => {
    if (!item || !confirmed || isSaving) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await recordQrVerification(item, verifierName);
      setItem(updated);
      setConfirmed(false);
      setMessage('Verification recorded. This equipment is now marked as reviewed.');
    } catch {
      setMessage('We could not save the verification. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7faf9] px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:py-8">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-green-600 to-blue-600 text-white shadow-lg shadow-blue-500/20">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3Zm0 0h3a3 3 0 1 0 0-6 3 3 0 0 0-2.83 2M3 20a6 6 0 0 1 12 0v1H3v-1Zm12.5-3.5a4.5 4.5 0 0 1 5.5 4.38V21h-4" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">PENRO Batanes · ICT Inventory</p>
            <h1 className="text-lg font-bold tracking-tight">Equipment verification</h1>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-3 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-20" />
            <div className="skeleton h-20" />
          </div>
        ) : !item ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3 2 21h20L12 3Z" /></svg>
            </div>
            <h2 className="mt-3 text-base font-bold text-amber-950 dark:text-amber-100">Equipment not found</h2>
            <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-200">This label may be old, or this phone cannot reach the inventory cloud. Ask an ICT administrator to refresh or replace the QR label.</p>
          </section>
        ) : (
          <div className="space-y-4">
            <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-5 text-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">{item.equipmentType}</span>
                  <StatusBadge category={item.statusCategory} rawStatus={item.status} remarks={item.remarks} size="sm" />
                </div>
                <h2 className="mt-4 text-xl font-bold tracking-tight">{item.model}</h2>
                <p className="mt-0.5 text-sm text-white/80">{item.brand}</p>
                <p className="mt-4 font-mono text-sm font-bold tracking-wide">{item.propertyNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                <ReviewField label="Serial number" value={item.serialNumber} />
                <ReviewField label="Office / division" value={item.location} />
                <ReviewField label="Accountable person" value={item.accountablePersonnel} />
                <ReviewField label="PMS date" value={item.datePmsConducted} />
              </div>
              {item.remarks && <div className="mx-4 mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"><span className="font-bold">Maintenance note: </span>{item.remarks}</div>}
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex gap-3">
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m5 13 4 4L19 7" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold">Confirm the details on site</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">Only approve when the physical equipment, its assigned location, and the details above match.</p>
                </div>
              </div>

              <label className="mt-4 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">Verified by <span className="font-normal text-zinc-400">optional</span></label>
              <input value={verifierName} onChange={(event) => setVerifierName(event.target.value)} placeholder="Your name or initials" className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
                <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                <span>I have checked this physical equipment and confirm that the displayed details are accurate.</span>
              </label>

              <button onClick={handleVerify} disabled={!confirmed || isSaving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:from-green-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-45">
                {isSaving ? 'Saving verification…' : 'Approve & record verification'}
              </button>
              {message && <p className={`mt-3 rounded-xl p-3 text-xs font-medium ${message.startsWith('Verification') ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200'}`} role="status">{message}</p>}
            </section>

            <p className="px-2 text-center text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">Last verified: {formatDate(item.lastVerifiedAt)}{item.lastVerifiedBy ? ` by ${item.lastVerifiedBy}` : ''} · {item.verificationCount || 0} QR confirmation{item.verificationCount === 1 ? '' : 's'}</p>
            <p className="px-2 text-center text-[10px] text-zinc-400 dark:text-zinc-600">Record last updated: {formatDate(item.updatedAt)}</p>
          </div>
        )}
      </div>
    </main>
  );
}
