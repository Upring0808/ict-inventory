'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { InventoryItem } from '@/types/inventory';
import { StatusBadge } from './StatusBadge';
import { EquipmentQrLabel } from './EquipmentQrLabel';

interface Props {
  item: InventoryItem;
  onClose: () => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onTransfer: (item: InventoryItem, input: { newPersonnel: string; newLocation: string; reason: string }) => Promise<void>;
  availableLocations?: string[];
}

const shown = (value?: string | null) => value?.trim() || 'Not recorded';

function dateLabel(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function Field({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return <div className="min-w-0"><dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{label}</dt><dd className={(mono ? 'font-mono ' : '') + 'mt-1 break-words text-sm font-medium text-zinc-800 dark:text-zinc-100'}>{shown(value)}</dd></div>;
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900"><div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:px-6"><h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>{subtitle && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}</div><div className="p-5 sm:p-6">{children}</div></section>;
}

function Arrow({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" /></svg>;
}

export function EquipmentDetailDrawer({ item, onClose, onEdit, onDelete, onTransfer, availableLocations = [] }: Props) {
  const surfaceRef = useRef<HTMLElement>(null);
  const transferRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [copiedTransactionId, setCopiedTransactionId] = useState<string | null>(null);
  const [showAllCheckIns, setShowAllCheckIns] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [newPersonnel, setNewPersonnel] = useState('');
  const [newLocation, setNewLocation] = useState(item.location);
  const [reason, setReason] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  useEffect(() => {
    surfaceRef.current?.scrollTo({ top: 0 });
    surfaceRef.current?.focus({ preventScroll: true });
  }, []);

  const history = useMemo(() => [...(item.ownershipHistory || [])].sort((a, b) =>
    new Date(b.transferredAt).getTime() - new Date(a.transferredAt).getTime()
  ), [item.ownershipHistory]);
  const checkIns = item.verificationHistory || [];
  const isComputer = item.equipmentType === 'Desktop Computers' || item.equipmentType === 'Laptop Computers';
  const acquiredYear = Number(item.yearAcquired?.match(/\b\d{4}\b/)?.[0]);
  const acquisitionLabel = acquiredYear > 1900 ? `Acquired ${acquiredYear}` : null;
  const canTransfer = Boolean(newPersonnel.trim() && newLocation.trim() && reason.trim()) &&
    (newPersonnel.trim().toLowerCase() !== item.accountablePersonnel.trim().toLowerCase() || newLocation.trim().toUpperCase() !== item.location.trim().toUpperCase());

  const openTransfer = () => {
    if (!transferOpen) setNewLocation(item.location);
    setTransferOpen(true);
    setTransferError(null);
    setTransferSuccess(false);
    window.setTimeout(() => {
      transferRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      firstFieldRef.current?.focus({ preventScroll: true });
    }, 40);
  };

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(item.propertyNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { setCopied(false); }
  };

  const copyTransaction = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedTransactionId(id);
      window.setTimeout(() => setCopiedTransactionId(null), 2000);
    } catch { setCopiedTransactionId(null); }
  };

  const submitTransfer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canTransfer || transferring) return;
    setTransferring(true);
    setTransferError(null);
    try {
      await onTransfer(item, { newPersonnel: newPersonnel.trim(), newLocation: newLocation.trim(), reason: reason.trim() });
      setTransferOpen(false);
      setNewPersonnel('');
      setReason('');
      setTransferSuccess(true);
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : 'The transfer could not be recorded. Please try again.');
    } finally { setTransferring(false); }
  };

  return (
    <article ref={surfaceRef} tabIndex={-1} aria-label={'Equipment details for ' + item.propertyNumber} className="equipment-detail-surface min-h-0 flex-1 overflow-y-auto rounded-2xl border border-zinc-200 bg-slate-50 outline-none dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-4 sm:px-6 sm:pb-10">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/40"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m14 6-6 6 6 6" /></svg>Back to inventory</button>
          <span aria-hidden="true">/</span><span className="truncate font-medium text-zinc-700 dark:text-zinc-200">{item.propertyNumber}</span>
        </nav>

        <header className="mb-5 flex flex-col gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">{item.equipmentType}</span><StatusBadge category={item.statusCategory} rawStatus={item.status} remarks={item.remarks} size="sm" showRemark={false} /></div><h1 className="break-words text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">{item.brand} {item.model}</h1><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300"><span className="font-mono font-bold text-zinc-800 dark:text-zinc-100">{item.propertyNumber}</span><span aria-hidden="true">•</span><span>{item.location}</span>{acquisitionLabel && <><span aria-hidden="true">•</span><span>{acquisitionLabel}</span></>}</div></div>
          <div className="flex shrink-0 items-center gap-2"><button type="button" onClick={() => onEdit(item)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">Edit equipment</button><button type="button" onClick={openTransfer} className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-green-700 dark:bg-green-600 dark:hover:bg-green-500">Transfer ownership <Arrow className="h-4 w-4" /></button></div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
          <div className="min-w-0 space-y-5">
            <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-900/70 dark:bg-zinc-900">
              <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-blue-50 px-5 py-4 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-blue-950/25 sm:px-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300">Current custody</p><h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Accountable person and office</h2></div><span className="rounded-md border border-emerald-200 bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:border-emerald-900 dark:bg-zinc-900 dark:text-emerald-300">Active assignment</span></div></div>
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:items-center sm:p-6"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Accountable person</p><p className="mt-1 break-words text-xl font-bold text-zinc-900 dark:text-zinc-50">{shown(item.accountablePersonnel)}</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{shown(item.accountableStatus)}</p></div><div className="min-w-0 sm:border-l sm:border-zinc-200 sm:pl-6 dark:sm:border-zinc-700"><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Office / division</p><p className="mt-1 break-words text-lg font-bold text-zinc-900 dark:text-zinc-50">{shown(item.location)}</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Custody recorded for this asset</p></div></div>
              {transferSuccess && <p role="status" className="mx-5 mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200 sm:mx-6">Transfer recorded. The current custodian and proof trail have been updated.</p>}
            </section>

            {transferOpen && <div ref={transferRef} className="scroll-mt-4 rounded-2xl border-2 border-green-600 bg-white shadow-sm dark:border-green-500 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:px-6"><div><h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Record a custody transfer</h2><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">This handoff is recorded with your account, the time, and a receipt ID.</p></div><button type="button" onClick={() => { setTransferOpen(false); setTransferError(null); }} disabled={transferring} aria-label="Cancel transfer" className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-40 dark:hover:bg-zinc-800"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" d="M5 5l14 14M19 5 5 19" /></svg></button></div>
              <form onSubmit={submitTransfer} className="space-y-4 p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">New accountable person <span className="text-rose-600">*</span><input ref={firstFieldRef} required maxLength={160} value={newPersonnel} onChange={(event) => setNewPersonnel(event.target.value)} placeholder="Full name" className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50" /></label>
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">Destination office / division <span className="text-rose-600">*</span><input required maxLength={160} list="transfer-locations" value={newLocation} onChange={(event) => setNewLocation(event.target.value)} placeholder="Office or division" className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50" /><datalist id="transfer-locations">{availableLocations.map((location) => <option key={location} value={location} />)}</datalist></label>
                </div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">Reason / handoff reference <span className="text-rose-600">*</span><textarea required maxLength={1000} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why is custody changing? Include the handoff or document reference if available." className="mt-1.5 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50" /></label>
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/20"><p className="text-[10px] font-bold uppercase tracking-widest text-blue-800 dark:text-blue-300">Review handoff</p><div className="mt-2 grid gap-2 text-xs sm:grid-cols-[1fr_auto_1fr] sm:items-center"><span className="break-words text-zinc-700 dark:text-zinc-200"><strong>{item.accountablePersonnel}</strong><br />{item.location}</span><Arrow className="h-4 w-4 text-blue-600" /><span className="break-words text-zinc-700 dark:text-zinc-200"><strong>{newPersonnel.trim() || 'New accountable person'}</strong><br />{newLocation.trim() || 'Destination office'}</span></div></div>
                {newPersonnel.trim() && newLocation.trim() && newPersonnel.trim().toLowerCase() === item.accountablePersonnel.trim().toLowerCase() && newLocation.trim().toUpperCase() === item.location.trim().toUpperCase() && <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Change the accountable person or office to record a transfer.</p>}
                {transferError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{transferError}</p>}
                <div className="flex flex-wrap items-center justify-end gap-2"><button type="button" disabled={transferring} onClick={() => { setTransferOpen(false); setTransferError(null); }} className="rounded-lg border border-zinc-300 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">Cancel</button><button type="submit" disabled={!canTransfer || transferring} className="rounded-lg bg-green-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-500">{transferring ? 'Recording transfer…' : 'Confirm transfer'}</button></div>
              </form>
            </div>}

            <Section title="Custody history" subtitle="A chronological record of completed transfers and the person who recorded each handoff.">
              {history.length === 0 ? <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-7 text-center dark:border-zinc-700 dark:bg-zinc-800/30"><p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">No transfers recorded yet</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">The first confirmed handoff will appear here with its date, reason, actor, and transaction ID.</p></div> :
                <ol className="relative space-y-5 border-l-2 border-emerald-200 pl-5 dark:border-emerald-900">
                  {history.map((transfer) => <li key={transfer.id} className="relative">
                    <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-600 shadow-sm dark:border-zinc-900" aria-hidden="true" />
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{transfer.fromPersonnel} <span className="font-normal text-zinc-400">→</span> {transfer.toPersonnel}</p>
                        <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300">{transfer.fromLocation} → {transfer.toLocation}</p>
                      </div>
                      <time dateTime={transfer.transferredAt} className="shrink-0 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{dateLabel(transfer.transferredAt)}</time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200">{transfer.reason}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-600 dark:text-zinc-300">
                      <span>Recorded by <strong className="text-zinc-800 dark:text-zinc-100">{shown(transfer.actorName)}</strong>{transfer.actorEmail && ' · ' + transfer.actorEmail}</span>
                      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className="break-all font-mono text-[11px]">ID {transfer.id}</span>
                        <button type="button" onClick={() => void copyTransaction(transfer.id)} aria-label={`Copy transaction ID ${transfer.id}`} className="rounded px-1.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/40">
                          {copiedTransactionId === transfer.id ? 'Copied' : 'Copy ID'}
                        </button>
                      </span>
                    </div>
                  </li>)}
                </ol>}
            </Section>

            <Section title="Verification audit" subtitle="QR check-ins and updates recorded against this equipment.">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{item.verificationCount || 0} QR confirmation{item.verificationCount === 1 ? '' : 's'}</p><span className={(item.lastVerifiedAt ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300') + ' rounded-md px-2.5 py-1 text-[11px] font-bold'}>{item.lastVerifiedAt ? 'Verified' : 'Not verified yet'}</span></div>
              <dl className="grid gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800 sm:grid-cols-3"><Field label="Last verified" value={dateLabel(item.lastVerifiedAt)} /><Field label="Verified by" value={item.lastVerifiedBy} /><Field label="Last updated" value={dateLabel(item.updatedAt)} /></dl>
              {checkIns.length > 0 && <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800"><h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Check-in history</h3><ol className="space-y-3">{(showAllCheckIns ? checkIns : checkIns.slice(0, 3)).map((verification) => <li key={verification.id} className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-200"><p><strong>QR verified</strong> · {dateLabel(verification.verifiedAt)}{verification.verifiedBy && ' by ' + verification.verifiedBy}</p>{verification.verifiedByEmail && <p className="mt-1 break-all text-[11px] text-zinc-500 dark:text-zinc-400">{verification.verifiedByEmail}</p>}{verification.comment && <p className="mt-2 leading-relaxed">{verification.comment}</p>}{verification.remarkResolved && <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-300">Active remark resolved{verification.resolvedRemark && ': ' + verification.resolvedRemark}</p>}</li>)}</ol>{checkIns.length > 3 && <button type="button" onClick={() => setShowAllCheckIns((value) => !value)} className="mt-3 rounded text-xs font-bold text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-blue-300">{showAllCheckIns ? 'Show recent check-ins' : 'Show all ' + checkIns.length + ' check-ins'}</button>}</div>}
            </Section>
          </div>

          <div className="min-w-0 space-y-5">
            <Section title="Asset identity" subtitle="Identifiers and registration details for this unit."><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><div><Field label="Property number" value={item.propertyNumber} mono /><button type="button" onClick={() => void copyNumber()} className="mt-1 rounded text-[11px] font-bold text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-blue-300">{copied ? 'Copied' : 'Copy number'}</button></div><Field label="Serial number" value={item.serialNumber} mono /><Field label="Computer name" value={item.computerName} /><Field label="Year acquired" value={item.yearAcquired} /><Field label="Shelf life" value={item.shelfLife} /><Field label="Last PMS" value={item.datePmsConducted} /></dl></Section>
            <EquipmentQrLabel item={item} />
            {isComputer && <Section title="Hardware & software"><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><Field label="Processor" value={item.processor} /><Field label="RAM" value={item.ram} /><Field label="Graphics (GPU)" value={item.gpu} /><Field label="Range category" value={item.rangeCategory} /><Field label="Operating system" value={item.osInstalled} /><Field label="Office productivity" value={item.officeProductivityProduct} /><Field label="Endpoint protection" value={item.endpointProtection} /></dl></Section>}
            <Section title="Condition & maintenance"><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><Field label="Condition" value={item.statusCategory} /><Field label="Status" value={item.status} /><Field label="Employment status" value={item.accountableStatus} /><Field label="Accountable person's sex" value={item.accountableSex} /></dl><div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800"><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Remarks / notes</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{shown(item.remarks)}</p></div></Section>
          </div>
        </div>
        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800"><button type="button" onClick={() => onDelete(item)} className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-600 dark:text-rose-300 dark:hover:bg-rose-950/30">Delete equipment</button><button type="button" onClick={onClose} className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">Back to inventory</button></footer>
      </div>
    </article>
  );
}
