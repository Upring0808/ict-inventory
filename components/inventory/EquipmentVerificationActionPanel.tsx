import type { FormEvent } from 'react';
import type { InventoryItem } from '@/types/inventory';

interface EquipmentVerificationActionPanelProps {
  item: InventoryItem;
  isAuthLoading: boolean;
  isAuthorized: boolean;
  actorName: string | null;
  actorEmail: string | null;
  verificationComment: string;
  confirmed: boolean;
  resolveActiveRemark: boolean;
  isSaving: boolean;
  successMessage: string | null;
  errorMessage: string | null;
  onCommentChange: (value: string) => void;
  onConfirmationChange: (checked: boolean) => void;
  onRemarkResolutionChange: (checked: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  className?: string;
}

export function EquipmentVerificationActionPanel({
  item,
  isAuthLoading,
  isAuthorized,
  actorName,
  actorEmail,
  verificationComment,
  confirmed,
  resolveActiveRemark,
  isSaving,
  successMessage,
  errorMessage,
  onCommentChange,
  onConfirmationChange,
  onRemarkResolutionChange,
  onSubmit,
  className = '',
}: EquipmentVerificationActionPanelProps) {
  const sectionClassName =
    'min-w-0 rounded-xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5 ' +
    className;

  if (isAuthLoading) {
    return (
      <section
        className={sectionClassName}
        aria-label="Loading verification form"
        aria-busy="true"
      >
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Record a check-in</h2>
        <div className="mt-4 space-y-3" aria-hidden="true">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-12 rounded-lg" />
          <div className="skeleton h-12 rounded-lg" />
        </div>
      </section>
    );
  }

  if (!isAuthorized) {
    return (
      <section className={sectionClassName} aria-label="Verification access restricted">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          Read-only access
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
          Verification is restricted
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
          Check-in and verification actions are available only to authorized inventory staff.
        </p>
      </section>
    );
  }

  return (
    <section className={sectionClassName}>
      <header className="border-b border-slate-300 pb-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Record a check-in</h2>
        <p className="mt-1.5 text-sm leading-5 text-slate-700 dark:text-slate-300">
          Compare the property number, serial number, and assignment with the physical equipment.
        </p>
      </header>

      <div className="border-b border-slate-300 bg-slate-100 py-3 dark:border-slate-700 dark:bg-slate-800/70">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Signed in as</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-950 dark:text-slate-100">
          {actorName || actorEmail || 'Authorized inventory staff'}
        </p>
        {actorName && actorEmail && (
          <p className="mt-0.5 break-all text-xs leading-5 text-slate-600 dark:text-slate-400">
            {actorEmail}
          </p>
        )}
      </div>

      <form className="pt-4" onSubmit={onSubmit}>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="verification-comment" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Field note
          </label>
          <span className="text-xs text-slate-600 dark:text-slate-400">Optional</span>
        </div>
        <textarea
          id="verification-comment"
          aria-describedby="verification-comment-count"
          value={verificationComment}
          onChange={(event) => onCommentChange(event.target.value)}
          rows={3}
          maxLength={500}
          disabled={isSaving}
          placeholder="Record an observation from this check."
          className="mt-1.5 min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base leading-6 text-slate-950 caret-emerald-700 outline-none placeholder:text-slate-500 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:disabled:bg-slate-900"
        />
        <p id="verification-comment-count" className="mt-1 text-right text-xs tabular-nums text-slate-600 dark:text-slate-400">
          {verificationComment.length}/500
        </p>

        {item.remarks && (
          <label className="mt-3 flex cursor-pointer items-start gap-3 border-y border-slate-200 py-3 text-sm leading-5 text-slate-800 dark:border-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={resolveActiveRemark}
              onChange={(event) => onRemarkResolutionChange(event.target.checked)}
              disabled={isSaving}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-400 text-emerald-700 focus:ring-emerald-700 disabled:cursor-not-allowed"
            />
            <span>
              <span className="block font-semibold">Resolve the maintenance note</span>
              <span className="mt-0.5 block text-xs leading-5 text-slate-600 dark:text-slate-400">
                Clear it after this check-in. The equipment condition will remain unchanged.
              </span>
            </span>
          </label>
        )}

        <label className="mt-3 flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-3 text-sm leading-5 text-slate-950 transition-colors hover:bg-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-slate-100 dark:hover:bg-emerald-950">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirmationChange(event.target.checked)}
            disabled={isSaving}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-400 text-emerald-700 focus:ring-emerald-700 disabled:cursor-not-allowed"
          />
          <span>I inspected the physical equipment and confirm this record is accurate.</span>
        </label>

        <button
          type="submit"
          disabled={!confirmed || isSaving}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:focus-visible:ring-offset-slate-900"
        >
          {isSaving ? (
            <>
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
              />
              Saving check-in…
            </>
          ) : (
            'Confirm check-in'
          )}
        </button>
      </form>

      {successMessage && (
        <p
          className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium leading-5 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
          role="status"
          aria-live="polite"
        >
          {successMessage}
        </p>
      )}
      {errorMessage && (
        <p
          className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium leading-5 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </section>
  );
}
