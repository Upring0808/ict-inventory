'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { authorizedApiFetch, readApiError } from '@/lib/auth/client';

interface ActivityEvent {
  id: number;
  actor_name: string;
  actor_email: string;
  actor_avatar_url?: string | null;
  action: string;
  target_type: 'equipment' | 'account';
  target_label: string;
  equipment_property_number: string | null;
  details: Record<string, unknown>;
  occurred_at: string;
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    'equipment.created': 'Equipment added',
    'equipment.updated': 'Equipment updated',
    'equipment.deleted': 'Equipment deleted',
    'equipment.verified': 'Equipment verified',
    'equipment.transferred': 'Ownership transferred',
    'account.created': 'User account created',
    'account.updated': 'User account updated',
    'account.deleted': 'User account removed',
  };
  return labels[action] || action.replace(/[._]/g, ' ');
}

function fieldLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function printable(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'blank';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function localDayRange(dateValue: string): { from: string; to: string } | null {
  const parts = dateValue.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return null;

  const [year, month, day] = parts;
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const nextDay = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
  if (Number.isNaN(start.getTime()) || Number.isNaN(nextDay.getTime())) return null;

  return {
    from: start.toISOString(),
    // The API uses an exclusive upper bound, so include the next midnight.
    to: nextDay.toISOString(),
  };
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function actionTone(action: string): string {
  if (action.endsWith('deleted')) return 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-300';
  if (action.endsWith('verified') || action.endsWith('created')) return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300';
  return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-300';
}

export function ActivityLogView() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const loadEvents = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setIsLoading(true);
    setIsLoadingMore(false);
    setError(null);
    setEvents([]);
    setTotal(0);
    setHasMore(false);

    try {
      const range = selectedDate ? localDayRange(selectedDate) : null;
      const params = new URLSearchParams({ limit: '60', offset: '0' });
      if (range) {
        params.set('from', range.from);
        params.set('to', range.to);
      }
      const query = `?${params.toString()}`;
      const response = await authorizedApiFetch(`/api/admin/activity${query}`);
      if (!response.ok) throw new Error(await readApiError(response, 'Could not load activity history.'));
      const result = await response.json() as { events: ActivityEvent[]; total: number; hasMore: boolean };
      if (requestId === latestRequest.current) {
        setEvents(result.events);
        setTotal(result.total);
        setHasMore(result.hasMore);
      }
    } catch (loadError) {
      if (requestId === latestRequest.current) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load activity history.');
      }
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, [selectedDate]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    const requestId = latestRequest.current;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: '60', offset: String(events.length) });
      const range = selectedDate ? localDayRange(selectedDate) : null;
      if (range) {
        params.set('from', range.from);
        params.set('to', range.to);
      }
      const response = await authorizedApiFetch(`/api/admin/activity?${params.toString()}`);
      if (!response.ok) throw new Error(await readApiError(response, 'Could not load more activity.'));
      const result = await response.json() as { events: ActivityEvent[]; total: number; hasMore: boolean };
      if (requestId === latestRequest.current) {
        setEvents((current) => [...current, ...result.events]);
        setTotal(result.total);
        setHasMore(result.hasMore);
      }
    } catch (loadError) {
      if (requestId === latestRequest.current) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load more activity.');
      }
    } finally {
      if (requestId === latestRequest.current) setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadEvents(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadEvents]);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 pb-4 sm:space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">Transparency</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">Activity log</h2>
          <p className="mt-1.5 text-sm leading-5 text-zinc-600 dark:text-zinc-400">A record of equipment changes, custody transfers, and QR checks.</p>
        </div>

        <div className="flex flex-wrap items-end gap-2.5">
          <label htmlFor="activity-date" className="block">
            <span className="mb-1 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Filter by day</span>
            <input
              id="activity-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="min-h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800 shadow-sm outline-none transition hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600"
            />
          </label>
          {selectedDate ? (
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className="min-h-11 rounded-xl px-2.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-200/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Clear date
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void loadEvents()}
            disabled={isLoading}
            className="min-h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Refresh
          </button>
        </div>
      </header>

      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">{error}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800 sm:px-5">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{selectedDate ? `Activity for ${selectedDate}` : 'Recent activity'}</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{isLoading ? 'Loading…' : `${events.length} of ${total} ${total === 1 ? 'event' : 'events'}`}</p>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4 sm:p-5" role="status" aria-label="Loading activity">
            <div className="skeleton h-16 rounded-xl" />
            <div className="skeleton h-16 rounded-xl" />
            <div className="skeleton h-16 rounded-xl" />
          </div>
        ) : events.length ? (
          <ol className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {events.map((event) => {
              const details = event.details || {};
              const changes = Object.entries(details).filter(([key]) => ![
                'record', 'verification', 'transfer', 'password_reset', 'password', 'secret', 'access_token', 'refresh_token',
              ].includes(key.toLowerCase()) && !(
                event.action === 'equipment.transferred' && ['accountable_personnel', 'location'].includes(key)
              ));
              const verification = details.verification && typeof details.verification === 'object'
                ? details.verification as Record<string, unknown>
                : null;
              const transfer = details.transfer && typeof details.transfer === 'object'
                ? details.transfer as Record<string, unknown>
                : null;
              const actorName = event.actor_name?.trim() || event.actor_email || 'Unknown user';
              const targetLabel = event.equipment_property_number || event.target_label || 'Inventory record';
              const occurredAt = new Date(event.occurred_at);
              const formattedTime = Number.isNaN(occurredAt.getTime())
                ? event.occurred_at
                : new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(occurredAt);

              return (
                <li key={event.id} className="grid grid-cols-2 items-center gap-x-3 gap-y-2.5 px-3.5 py-3.5 sm:gap-3 sm:px-4 md:grid-cols-[minmax(0,1.2fr)_minmax(7rem,0.75fr)_minmax(8rem,1fr)_auto] md:gap-4 md:px-5">
                  <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
                    <ActorAvatar name={actorName} imageUrl={event.actor_avatar_url} key={event.actor_avatar_url || 'no-avatar'} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{actorName}</p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{event.actor_email || 'Authorized user'}</p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <span className={`inline-flex max-w-full rounded-lg border px-2 py-1 text-[11px] font-semibold leading-4 ${actionTone(event.action)}`}>
                      <span className="truncate">{actionLabel(event.action)}</span>
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{event.target_type === 'equipment' ? 'Equipment' : 'User account'}</p>
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200" title={targetLabel}>{targetLabel}</p>
                  </div>

                  <time dateTime={event.occurred_at} className="col-span-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 md:col-span-1 md:text-right">
                    {formattedTime}
                  </time>

                  {(details.record !== undefined || details.password_reset === true || transfer || (verification && typeof verification.comment === 'string' && verification.comment) || changes.length > 0) ? (
                    <details className="col-span-2 border-t border-zinc-100 pt-2 text-xs dark:border-zinc-800 md:col-span-4">
                      <summary className="w-fit cursor-pointer select-none font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">View details</summary>
                      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                        {details.record !== undefined ? <span className="max-w-full break-all text-xs leading-5 text-zinc-600 dark:text-zinc-400">{printable(details.record)}</span> : null}
                        {details.password_reset === true ? <span className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">Password reset recorded</span> : null}
                        {verification && typeof verification.comment === 'string' && verification.comment ? <span className="rounded-md bg-zinc-50 px-2 py-1 text-xs leading-5 text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300">{verification.comment}</span> : null}
                        {transfer ? (
                          <div className="w-full rounded-lg border border-blue-100 bg-blue-50/60 p-2.5 leading-5 text-zinc-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-zinc-200">
                            <p><span className="font-semibold">Custodian:</span> {printable(transfer.fromPersonnel)} → {printable(transfer.toPersonnel)}</p>
                            <p><span className="font-semibold">Office:</span> {printable(transfer.fromLocation)} → {printable(transfer.toLocation)}</p>
                            <p><span className="font-semibold">Reason:</span> {printable(transfer.reason)}</p>
                            <p className="mt-1 break-all font-mono text-[10px] text-zinc-500 dark:text-zinc-400">Receipt {printable(transfer.id)}</p>
                          </div>
                        ) : null}
                        {changes.map(([key, value]) => {
                          const change = value && typeof value === 'object' ? value as Record<string, unknown> : null;
                          if (change && 'from' in change && 'to' in change) {
                            return <span key={key} className="max-w-full rounded-md bg-zinc-50 px-2 py-1 text-[11px] leading-4 text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300"><span className="font-semibold">{fieldLabel(key)}:</span> {printable(change.from)} → {printable(change.to)}</span>;
                          }
                          return <span key={key} className="max-w-full rounded-md bg-zinc-50 px-2 py-1 text-[11px] leading-4 text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300"><span className="font-semibold">{fieldLabel(key)}:</span> {printable(value)}</span>;
                        })}
                      </div>
                    </details>
                  ) : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" aria-hidden="true">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" strokeWidth="2" strokeLinecap="round" /></svg>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedDate ? 'No activity on this day' : 'No activity recorded yet'}</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{selectedDate ? 'Choose another date to review its activity.' : 'Equipment changes, transfers, and QR verifications will appear here.'}</p>
          </div>
        )}
      </div>
      {!isLoading && hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={isLoadingMore}
            className="min-h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 disabled:cursor-wait disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {isLoadingMore ? 'Loading…' : 'Load more activity'}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ActorAvatar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-zinc-200 bg-gradient-to-br from-green-50 to-blue-50 text-[11px] font-bold text-blue-800 dark:border-zinc-700 dark:from-green-950/50 dark:to-blue-950/50 dark:text-blue-200">
      {imageUrl && !imageFailed ? (
        <Image src={imageUrl} alt="" width={36} height={36} unoptimized loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} className="h-full w-full object-cover" />
      ) : initialsFor(name)}
    </span>
  );
}
