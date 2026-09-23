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
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-zinc-900 dark:text-zinc-50">{value || '—'}</p>
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

  return (
    <main className="min-h-screen bg-[#f7faf9] px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:py-8">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-green-600 to-blue-600 text-white shadow-lg shadow-blue-500/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3Zm0 0h3a3 3 0 1 0 0-6 3 3 0 0 0-2.83 2M3 20a6 6 0 0 1 12 0v1H3v-1Zm12.5-3.5a4.5 4.5 0 0 1 5.5 4.38V21h-4" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">PENRO Batanes · ICT Inventory</p>
              <h1 className="text-lg font-bold tracking-tight">Equipment verification</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {profile && item && (
              <Link
                href={`/?edit=${encodeURIComponent(item.propertyNumber)}`}
                className="rounded-xl bg-gradient-to-r from-green-600 to-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
              >
                Edit asset
              </Link>
            )}
            <a
              href="/scanner"
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/60"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h5v2H6v3H4V4Zm11 0h5v5h-2V6h-3V4ZM4 15h2v3h3v2H4v-5Zm14 0h2v5h-5v-2h3v-3ZM9 9h6v6H9V9Z" /></svg>
              Scanner
            </a>
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
            <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-200">{loadError || 'This label may be old, or this phone cannot reach the inventory cloud. Ask an ICT administrator to refresh or replace the QR label.'}</p>
          </section>
        ) : (
          <div className="space-y-4">
            {/* ── Equipment identity card ── */}
            <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-5 text-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">{item.equipmentType}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge category={item.statusCategory} rawStatus={item.status} remarks={item.remarks} size="sm" showRemark={false} />
                  </div>
                </div>
                <h2 className="mt-4 text-xl font-bold tracking-tight">{item.model}</h2>
                <p className="mt-0.5 text-sm text-white/80">{item.brand}</p>
                <p className="mt-4 font-mono text-sm font-bold tracking-wide">{item.propertyNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4">
                <ReviewField label="Serial number" value={item.serialNumber} />
                <ReviewField label="Office / division" value={item.location} />
                <ReviewField label="Accountable person" value={item.accountablePersonnel} />
                <ReviewField label="Last verified" value={formatDate(item.lastVerifiedAt)} />
              </div>
              {item.remarks && <div className="mx-4 mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"><span className="font-bold">Maintenance note: </span>{item.remarks}</div>}
            </section>

            {/* ── Asset, custody & condition ── */}
            <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">Record details</p>
                <h3 className="mt-0.5 text-sm font-bold text-zinc-900 dark:text-zinc-50">Asset, custody &amp; condition</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ReviewField label="Year acquired" value={item.yearAcquired} />
                <ReviewField label="Shelf life" value={item.shelfLife} />
                <ReviewField label="Accountable sex" value={item.accountableSex} />
                <ReviewField label="Employment status" value={item.accountableStatus} />
                <ReviewField label="Condition" value={item.statusCategory} />
                <ReviewField label="Reported status" value={item.status} />
              </div>
            </section>

            {/* ── Technical details (computers only) ── */}
            {isComputer && (
              <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">Technical details</p>
                  <h3 className="mt-0.5 text-sm font-bold text-zinc-900 dark:text-zinc-50">Hardware &amp; software</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ReviewField label="Computer name" value={item.computerName} />
                  <ReviewField label="Range category" value={item.rangeCategory} />
                  <ReviewField label="Processor" value={item.processor} />
                  <ReviewField label="RAM" value={item.ram} />
                  <ReviewField label="Graphics / GPU" value={item.gpu} />
                  <ReviewField label="Operating system" value={item.osInstalled} />
                  <ReviewField label="Office software" value={item.officeProductivityProduct} />
                  <ReviewField label="Endpoint protection" value={item.endpointProtection} />
                </div>
              </section>
            )}

            {/* ── Check-in history ── */}
            <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">Verification audit</p>
                  <h3 className="mt-0.5 text-sm font-bold text-zinc-900 dark:text-zinc-50">Check-in history</h3>
                </div>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {item.verificationHistory?.length || 0} check-in{item.verificationHistory?.length === 1 ? '' : 's'}
                </span>
              </div>

              {!item.verificationHistory?.length ? (
                <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
                  No QR check-ins have been recorded yet.
                </p>
              ) : (
                <>
                  <ol className="mt-4 space-y-3 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
                    {(showAllCheckIns ? item.verificationHistory : item.verificationHistory.slice(0, 3)).map((checkIn) => (
                      <li key={checkIn.id} className="relative">
                        <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-500 dark:border-zinc-900" />
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          QR verified · {formatDate(checkIn.verifiedAt)}
                          {checkIn.verifiedBy ? ` by ${checkIn.verifiedBy}` : ''}
                        </p>
                        {checkIn.verifiedByEmail && <p className="mt-0.5 text-[10px] text-zinc-400">{checkIn.verifiedByEmail}</p>}
                        {checkIn.comment && <p className="mt-1 rounded-lg bg-zinc-50 px-2.5 py-2 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">{checkIn.comment}</p>}
                        {checkIn.remarkResolved && (
                          <p className="mt-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            ✓ Resolved active remark{checkIn.resolvedRemark ? `: ${checkIn.resolvedRemark}` : ''}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                  {item.verificationHistory.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllCheckIns((showAll) => !showAll)}
                      className="mt-4 text-xs font-bold text-blue-700 transition hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {showAllCheckIns ? 'Show recent check-ins' : `Show all ${item.verificationHistory.length} check-ins`}
                    </button>
                  )}
                </>
              )}
            </section>

            {/* Public QR visitors can read the record; only authorized users can record a check-in. */}
            {authStatus === 'loading' ? (
              <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="skeleton h-16 rounded-xl" />
              </section>
            ) : profile ? (
              <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex gap-3">
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m5 13 4 4L19 7" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Confirm the details on site</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">Only approve when the physical equipment, its assigned location, and the details above match.</p>
                </div>
              </div>

              <p className="mt-4 rounded-xl bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
                Verification will be recorded under <span className="font-bold">{profile.name}</span> ({profile.email}).
              </p>

              <label className="mt-4 block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Verification comment <span className="font-normal text-zinc-400">optional</span></label>
              <textarea
                value={verificationComment}
                onChange={(e) => setVerificationComment(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Add an observation, issue, or note from this on-site check."
                className="mt-1.5 w-full resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              />

              {item.remarks && (
                <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs leading-relaxed text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100">
                  <input
                    type="checkbox"
                    checked={resolveActiveRemark}
                    onChange={(e) => setResolveActiveRemark(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    <span className="block font-bold">Resolve active remark</span>
                    <span className="mt-0.5 block">Clear “{item.remarks}” after this check-in. The selected equipment condition stays unchanged.</span>
                  </span>
                </label>
              )}

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span>I have checked this physical equipment and confirm that the displayed details are accurate.</span>
              </label>

              <button
                onClick={handleVerify}
                disabled={!confirmed || isSaving}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:from-green-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSaving ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                    Saving verification…
                  </>
                ) : (
                  'Approve & record verification'
                )}
              </button>

              {successMessage && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" role="status">
                  <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m5 13 4 4L19 7" /></svg>
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-200" role="alert">{errorMessage}</p>
              )}
              </section>
            ) : (
              <section className="rounded-3xl border border-blue-100 bg-blue-50/80 p-5 dark:border-blue-900/50 dark:bg-blue-950/25">
                <h3 className="text-sm font-bold text-blue-950 dark:text-blue-100">Public equipment details</h3>
                <p className="mt-1 text-xs leading-5 text-blue-800 dark:text-blue-200">Anyone can view this record. Sign in with one of the authorized inventory accounts to verify or edit it.</p>
                <Link href="/" className="mt-3 inline-flex rounded-lg bg-gradient-to-r from-green-600 to-blue-600 px-3.5 py-2 text-xs font-bold text-white">Administrator sign in</Link>
              </section>
            )}

            <p className="px-2 text-center text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Last verified: {formatDate(item.lastVerifiedAt)}{item.lastVerifiedBy ? ` by ${item.lastVerifiedBy}` : ''} · {item.verificationCount || 0} QR confirmation{item.verificationCount === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
