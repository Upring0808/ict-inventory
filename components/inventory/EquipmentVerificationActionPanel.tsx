import type { FormEvent } from 'react';
import type { InventoryItem } from '@/types/inventory';

interface EquipmentVerificationActionPanelProps {
  item: InventoryItem;
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
  const actorLabel = actorName || actorEmail || 'Authorized inventory staff';
  const actorInitial = actorLabel.trim().charAt(0).toUpperCase() || 'I';
  const isConfirmationPending = !confirmed && !isSaving;
  const sectionClassName =
    'min-w-0 overflow-hidden rounded-2xl border border-[#cbd8ce] bg-[#f3f8f4] dark:border-slate-800 dark:bg-slate-900 ' +
    className;

  return (
    <section className={sectionClassName}>
      <header className="border-b border-[#bfd0c3] bg-[#dce8df] px-5 pb-5 pt-5 text-[#314538] dark:border-slate-800 dark:bg-[#152429] dark:text-white sm:px-6">
        <h2 className="text-xl font-semibold tracking-tight">Record a check-in</h2>
        <p className="mt-1.5 text-sm leading-6 text-[#465b4d] dark:text-[#d8e2e2]">
          Compare the property number, serial number, and assignment with the physical equipment.
        </p>
        <div className="mt-5 flex min-w-0 items-center gap-3 border-t border-[#c1d2c6] pt-4 dark:border-white/20">
          <span
            aria-hidden="true"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#c9decf] text-base font-bold text-[#21472f] dark:bg-[#a6c8ad] dark:text-[#173b28]"
          >
            {actorInitial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#49614f] dark:text-[#cbd8d8]">
              Signed in as
            </p>
            <p className="mt-0.5 break-words text-sm font-semibold leading-5 text-[#263d2c] dark:text-white">
              {actorLabel}
            </p>
            {actorName && actorEmail && (
              <p className="mt-0.5 break-all text-xs leading-5 text-[#465b4d] dark:text-[#cbd8d8]">
                {actorEmail}
              </p>
            )}
          </div>
        </div>
      </header>

      <form className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6" onSubmit={onSubmit}>
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
          className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#bacbbe] bg-white px-3 py-2.5 text-base leading-6 text-slate-950 caret-[#286544] outline-none placeholder:text-slate-500 focus:border-[#286544] focus:ring-2 focus:ring-[#286544]/20 disabled:cursor-not-allowed disabled:bg-[#f1f5f1] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:disabled:bg-slate-900"
        />
        <p id="verification-comment-count" className="mt-1 text-right text-xs tabular-nums text-slate-600 dark:text-slate-400">
          {verificationComment.length}/500
        </p>

        {item.remarks && (
          <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-slate-200 pt-4 text-sm leading-5 text-slate-800 dark:border-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={resolveActiveRemark}
              onChange={(event) => onRemarkResolutionChange(event.target.checked)}
              disabled={isSaving}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-400 text-[#286544] focus:ring-2 focus:ring-[#286544] disabled:cursor-not-allowed"
            />
            <span>
              <span className="block font-semibold">Resolve the maintenance note</span>
              <span className="mt-0.5 block text-xs leading-5 text-slate-600 dark:text-slate-400">
                Clear it after this check-in. The equipment condition will remain unchanged.
              </span>
            </span>
          </label>
        )}

        <label className={'mt-5 flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm leading-5 text-slate-950 transition-colors dark:text-slate-100 ' +
          (confirmed
            ? 'border-[#a9c8b1] bg-[#e7f0e8] hover:bg-[#dcebdd] dark:border-[#477654] dark:bg-[#20372b] dark:hover:bg-[#284334]'
            : 'border-[#c8d5ca] bg-[#f5f8f5] hover:bg-[#edf4ee] dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800')}
        >
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirmationChange(event.target.checked)}
            disabled={isSaving}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-400 text-[#286544] focus:ring-2 focus:ring-[#286544] disabled:cursor-not-allowed"
          />
          <span>I inspected the physical equipment and confirm this record is accurate.</span>
        </label>

        <button
          type="submit"
          disabled={!confirmed || isSaving}
          className={'mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#286544] focus-visible:ring-offset-2 disabled:cursor-not-allowed dark:focus-visible:ring-offset-slate-900 ' +
            (isConfirmationPending
              ? 'bg-[#dfe9e1] text-[#55665a] dark:bg-slate-800 dark:text-slate-400'
              : 'bg-[#245a40] text-white hover:bg-[#1e4e37] active:bg-[#163c2a] dark:bg-[#365157] dark:hover:bg-[#48656b]')}
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
            <>
              Confirm check-in
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </>
          )}
        </button>
      </form>

      {successMessage && (
        <p
          className="mx-5 mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium leading-5 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 sm:mx-6"
          role="status"
          aria-live="polite"
        >
          {successMessage}
        </p>
      )}
      {errorMessage && (
        <p
          className="mx-5 mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium leading-5 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 sm:mx-6"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </section>
  );
}
