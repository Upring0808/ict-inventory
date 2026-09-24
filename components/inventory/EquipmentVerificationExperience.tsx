'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { InventoryItem } from '@/types/inventory';
import { findPublicEquipment, recordPublicQrVerification } from '@/lib/publicEquipmentClient';
import { useAuth } from '@/components/auth/AuthProvider';
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
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-zinc-900 dark:text-zinc-100">{value || '—'}</dd>
    </div>
  );
}

export function EquipmentVerificationExperience({ propertyNumber }: EquipmentVerificationExperienceProps) {
  const router = useRouter();
  const { profile, status: authStatus } = useAuth();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [verificationComment, setVerificationComment] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [resolveActiveRemark, setResolveActiveRemark] = useState(false);
  const [showAllCheckIns, setShowAllCheckIns] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      setSuccessMessage(null);
      setErrorMessage(null);
      setConfirmed(false);
      setResolveActiveRemark(false);
      setShowAllCheckIns(false);
      try {
        const found = propertyNumber ? await findPublicEquipment(propertyNumber) : null;
        if (active) setItem(found);
      } catch (loadError) {
        if (active) {
          setItem(null);
          setLoadError(loadError instanceof Error ? loadError.message : 'Equipment details are temporarily unavailable.');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [propertyNumber]);

  const handleVerify = async () => {
    if (!item || !profile || !confirmed || isSaving) return;
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const updated = await recordPublicQrVerification(
        item,
        { id: profile.id, email: profile.email, name: profile.name },
        verificationComment,
        resolveActiveRemark
      );
      setItem(updated);
      setConfirmed(false);
      setVerificationComment('');
      setResolveActiveRemark(false);
      setSuccessMessage('Verification recorded! Returning to scanner…');
      // Redirect back to scanner after a short delay so the user sees the success message
      setTimeout(() => {
        router.push('/scanner');
      }, 1600);
    } catch {
      setErrorMessage('We could not save the verification. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isComputer = item?.equipmentType === 'Desktop Computers' || item?.equipmentType === 'Laptop Computers';
  const verificationCount = item?.verificationCount ?? item?.verificationHistory?.length ?? 0;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-700 text-white dark:bg-blue-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3Zm0 0h3a3 3 0 1 0 0-6 3 3 0 0 0-2.83 2M3 20a6 6 0 0 1 12 0v1H3v-1Zm12.5-3.5a4.5 4.5 0 0 1 5.5 4.38V21h-4" /></svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">PENRO Batanes · ICT Inventory</p>
              <h1 className="text-base font-bold tracking-tight sm:text-lg">Equipment verification</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {profile && item && (
              <Link
                href={`/?edit=${encodeURIComponent(item.propertyNumber)}`}
                className="rounded-lg px-2.5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-blue-300 dark:hover:bg-zinc-800"
              >
                Edit asset
              </Link>
            )}
            <a
              href="/scanner"
              className="flex min-h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h5v2H6v3H4V4Zm11 0h5v5h-2V6h-3V4ZM4 15h2v3h3v2H4v-5Zm14 0h2v5h-5v-2h3v-3ZM9 9h6v6H9V9Z" /></svg>
              Scanner
            </a>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-20" />
            <div className="skeleton h-14" />
          </div>
        ) : !item ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/60 dark:bg-amber-950/30">
            <h2 className="text-base font-bold text-amber-950 dark:text-amber-100">Equipment not found</h2>
            <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-200">{loadError || 'This label may be old, or this phone cannot reach the inventory cloud. Ask an ICT administrator to refresh or replace the QR label.'}</p>
          </section>
        ) : (
          <div className="space-y-4">
            <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <header className="px-5 pb-4 pt-5 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-800 dark:bg-blue-950/60 dark:text-blue-200">{item.equipmentType}</span>
                  <StatusBadge category={item.statusCategory} rawStatus={item.status} remarks={item.remarks} size="sm" showRemark={false} />
                </div>
                <h2 className="mt-3 text-xl font-bold tracking-tight text-zinc-950 dark:text-white">{item.model}</h2>
                <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{item.brand}</p>
                <p className="mt-3 font-mono text-sm font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">{item.propertyNumber}</p>
              </header>

              <dl className="grid grid-cols-2 gap-x-5 gap-y-4 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:px-6">
                <ReviewField label="Accountable person" value={item.accountablePersonnel} />
                <ReviewField label="Office / division" value={item.location} />
                <ReviewField label="Serial number" value={item.serialNumber} />
                <ReviewField label="Last verified" value={formatDate(item.lastVerifiedAt)} />
              </dl>

              {item.remarks && (
                <div className="mx-5 mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100 sm:mx-6">
                  <span className="font-semibold">Maintenance note · </span>{item.remarks}
                </div>
              )}

              <details className="group border-t border-zinc-100 dark:border-zinc-800">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/40 dark:text-zinc-200 dark:hover:bg-zinc-800/50 sm:px-6 [&::-webkit-details-marker]:hidden">
                  <span>Full equipment record</span>
                  <svg className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" /></svg>
                </summary>
                <div className="border-t border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:px-6">
                  <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
                    <ReviewField label="Year acquired" value={item.yearAcquired} />
                    <ReviewField label="Shelf life" value={item.shelfLife} />
                    <ReviewField label="Accountable sex" value={item.accountableSex} />
                    <ReviewField label="Employment status" value={item.accountableStatus} />
                    <ReviewField label="Condition" value={item.statusCategory} />
                    <ReviewField label="Reported status" value={item.status} />
                  </dl>
                  {isComputer && (
                    <section className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                      <h3 className="mb-3 text-xs font-semibold text-zinc-700 dark:text-zinc-200">Hardware &amp; software</h3>
                      <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
                        <ReviewField label="Computer name" value={item.computerName} />
                        <ReviewField label="Range category" value={item.rangeCategory} />
                        <ReviewField label="Processor" value={item.processor} />
                        <ReviewField label="RAM" value={item.ram} />
                        <ReviewField label="Graphics / GPU" value={item.gpu} />
                        <ReviewField label="Operating system" value={item.osInstalled} />
                        <ReviewField label="Office software" value={item.officeProductivityProduct} />
                        <ReviewField label="Endpoint protection" value={item.endpointProtection} />
                      </dl>
                    </section>
                  )}
                </div>
              </details>

              <details className="group border-t border-zinc-100 dark:border-zinc-800">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/40 dark:text-zinc-200 dark:hover:bg-zinc-800/50 sm:px-6 [&::-webkit-details-marker]:hidden">
                  <span>Verification history</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{verificationCount} check-in{verificationCount === 1 ? '' : 's'}</span>
                    <svg className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" /></svg>
                  </span>
                </summary>
                <div className="border-t border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:px-6">
                  {!item.verificationHistory?.length ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No QR check-ins have been recorded yet.</p>
                  ) : (
                    <>
                      <ol className="space-y-4 border-l border-zinc-200 pl-4 dark:border-zinc-700">
                        {(showAllCheckIns ? item.verificationHistory : item.verificationHistory.slice(0, 3)).map((checkIn) => (
                          <li key={checkIn.id} className="relative">
                            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-600 dark:border-zinc-900" />
                            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                              {formatDate(checkIn.verifiedAt)}{checkIn.verifiedBy ? ` · ${checkIn.verifiedBy}` : ''}
                            </p>
                            {checkIn.verifiedByEmail && <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">{checkIn.verifiedByEmail}</p>}
                            {checkIn.comment && <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">{checkIn.comment}</p>}
                            {checkIn.remarkResolved && (
                              <p className="mt-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                Resolved active remark{checkIn.resolvedRemark ? `: ${checkIn.resolvedRemark}` : ''}
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                      {item.verificationHistory.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setShowAllCheckIns((showAll) => !showAll)}
                          className="mt-4 rounded text-xs font-semibold text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-blue-300 dark:hover:text-blue-200"
                        >
                          {showAllCheckIns ? 'Show recent check-ins' : `Show all ${item.verificationHistory.length} check-ins`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </details>
            </article>

            {authStatus === 'loading' ? (
              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900" aria-label="Loading verification form">
                <div className="skeleton h-16 rounded-xl" />
              </section>
            ) : profile ? (
              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                <div>
                  <h3 className="text-base font-bold tracking-tight text-zinc-950 dark:text-white">Verify this equipment</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Compare the physical item, serial number, location, and accountable person before recording.</p>
                </div>

                <p className="mt-4 border-l-2 border-blue-500 pl-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  Recorded under <span className="font-semibold text-zinc-900 dark:text-zinc-100">{profile.name || profile.email}</span>{profile.name && profile.email ? ` · ${profile.email}` : ''}
                </p>

                <label htmlFor="verification-comment" className="mt-5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Note <span className="font-normal text-zinc-500 dark:text-zinc-400">· optional</span>
                </label>
                <textarea
                  id="verification-comment"
                  value={verificationComment}
                  onChange={(e) => setVerificationComment(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Add an observation from this check."
                  className="mt-1.5 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />

                {item.remarks && (
                  <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-200 p-3 text-xs leading-relaxed text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50">
                    <input
                      type="checkbox"
                      checked={resolveActiveRemark}
                      onChange={(e) => setResolveActiveRemark(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span><span className="font-semibold">Resolve active maintenance note</span><span className="block text-zinc-500 dark:text-zinc-400">Clear “{item.remarks}” after this check-in. The equipment condition will stay unchanged.</span></span>
                  </label>
                )}

                <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-700 transition hover:bg-zinc-100 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>I checked this physical equipment and confirm these details are accurate.</span>
                </label>

                <button
                  onClick={handleVerify}
                  disabled={!confirmed || isSaving}
                  className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus-visible:ring-offset-zinc-900"
                >
                  {isSaving ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                      Saving verification…
                    </>
                  ) : (
                    'Record verification'
                  )}
                </button>

                {successMessage && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" role="status">
                    <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m5 13 4 4L19 7" /></svg>
                    {successMessage}
                  </div>
                )}
                {errorMessage && (
                  <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-200" role="alert">{errorMessage}</p>
                )}
              </section>
            ) : (
              <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 dark:border-blue-900/50 dark:bg-blue-950/25">
                <h3 className="text-sm font-semibold text-blue-950 dark:text-blue-100">Public equipment record</h3>
                <p className="mt-1 text-sm leading-relaxed text-blue-800 dark:text-blue-200">Anyone can view this record. Sign in with an authorized inventory account to record a check-in or edit the asset.</p>
                <Link href="/" className="mt-3 inline-flex min-h-9 items-center rounded-lg bg-blue-700 px-3.5 text-xs font-semibold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500">Administrator sign in</Link>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
