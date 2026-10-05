'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AppBrand } from '@/components/branding/AppBrand';
import { useAuth } from '@/components/auth/AuthProvider';
import { CameraIcon } from '@/components/icons/CameraIcon';
import { findPublicEquipment, recordPublicQrVerification } from '@/lib/publicEquipmentClient';
import type { InventoryItem } from '@/types/inventory';
import { EquipmentVerificationActionPanel } from './EquipmentVerificationActionPanel';
import { EquipmentVerificationRecordDetails } from './EquipmentVerificationRecordDetails';
import { EquipmentVerificationSummary } from './EquipmentVerificationSummary';

interface EquipmentVerificationExperienceProps {
  propertyNumber: string | null;
}

export function EquipmentVerificationExperience({ propertyNumber }: EquipmentVerificationExperienceProps) {
  const { profile, status: authStatus } = useAuth();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [verificationComment, setVerificationComment] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [resolveActiveRemark, setResolveActiveRemark] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const scannerRedirectTimer = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      setSuccessMessage(null);
      setErrorMessage(null);
      setConfirmed(false);
      setResolveActiveRemark(false);

      try {
        const found = propertyNumber ? await findPublicEquipment(propertyNumber) : null;
        if (active) setItem(found);
      } catch (error) {
        if (active) {
          setItem(null);
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Equipment details are temporarily unavailable.'
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [propertyNumber, loadAttempt]);

  useEffect(() => () => {
    if (scannerRedirectTimer.current !== null) {
      window.clearTimeout(scannerRedirectTimer.current);
    }
  }, []);

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      setSuccessMessage('Check-in saved. Returning to the scanner…');
      scannerRedirectTimer.current = window.setTimeout(() => {
        window.location.assign(new URL('/scanner', window.location.origin).href);
      }, 1600);
    } catch {
      setErrorMessage('We could not save this check-in. Check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const verificationCount = item?.verificationCount ?? item?.verificationHistory?.length ?? 0;

  return (
    <main className="min-h-[100svh] bg-slate-100 px-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] text-slate-950 selection:bg-emerald-200 selection:text-slate-950 dark:bg-slate-950 dark:text-slate-50 dark:selection:bg-emerald-900 dark:selection:text-white sm:px-6 sm:pb-[calc(2rem+env(safe-area-inset-bottom,0px))] sm:pt-[calc(1.5rem+env(safe-area-inset-top,0px))]">
      <div className="mx-auto w-full max-w-6xl">
        <nav
          aria-label="Equipment verification navigation"
          className="mb-5 flex min-h-12 items-center justify-between gap-3 border-b border-slate-300 pb-3 dark:border-slate-700"
        >
          <AppBrand
            size={34}
            className="inline-flex min-w-0 items-center gap-2.5"
            organizationClassName="block truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400"
            nameClassName="block truncate text-sm font-bold tracking-tight text-slate-950 dark:text-white"
            descriptorClassName="ml-1.5 text-[0.82em] font-semibold tracking-normal text-slate-600 dark:text-slate-400"
          />
          <Link
            href="/scanner"
            aria-label="Scan equipment QR code"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#123640] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#174955] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            <CameraIcon />
            Scan
          </Link>
        </nav>

        <header className="mb-5 sm:mb-6">
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Equipment verification
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-700 dark:text-slate-300">
            Compare this record with the physical equipment, then save a check-in.
          </p>
        </header>

        {isLoading ? (
          <div
            className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]"
            aria-busy="true"
            aria-label="Loading equipment details"
          >
            <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5">
              <div className="skeleton h-5 w-2/5 rounded" />
              <div className="skeleton h-9 w-3/4 rounded" />
              <div className="skeleton h-12 rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <div className="skeleton h-14 rounded" />
                <div className="skeleton h-14 rounded" />
                <div className="skeleton h-14 rounded" />
                <div className="skeleton h-14 rounded" />
              </div>
            </section>
            <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5">
              <div className="skeleton h-6 w-3/5 rounded" />
              <div className="skeleton h-16 rounded-lg" />
              <div className="skeleton h-24 rounded-lg" />
            </section>
          </div>
        ) : !item ? (
          <section
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30 sm:p-5"
            role={loadError ? 'alert' : 'status'}
          >
            <h2 className="text-base font-semibold text-amber-950 dark:text-amber-100">
              Equipment not found
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-5 text-amber-900 dark:text-amber-200">
              {loadError ||
                'This label may be old, or the equipment could not be found. Ask an ICT administrator to refresh or replace the QR label.'}
            </p>
            {loadError && (
              <button
                type="button"
                onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-white"
              >
                Try again
              </button>
            )}
          </section>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] lg:items-start lg:gap-5">
            <EquipmentVerificationSummary item={item} canEdit={Boolean(profile)} />
            <EquipmentVerificationRecordDetails
              item={item}
              verificationCount={verificationCount}
              className="lg:col-start-1 lg:row-start-2"
            />
            <EquipmentVerificationActionPanel
              item={item}
              isAuthLoading={authStatus === 'loading'}
              isAuthorized={Boolean(profile)}
              actorName={profile?.name || null}
              actorEmail={profile?.email || null}
              verificationComment={verificationComment}
              confirmed={confirmed}
              resolveActiveRemark={resolveActiveRemark}
              isSaving={isSaving}
              successMessage={successMessage}
              errorMessage={errorMessage}
              onCommentChange={setVerificationComment}
              onConfirmationChange={setConfirmed}
              onRemarkResolutionChange={setResolveActiveRemark}
              onSubmit={handleVerify}
              className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-4 lg:self-start"
            />
          </div>
        )}
      </div>
    </main>
  );
}
