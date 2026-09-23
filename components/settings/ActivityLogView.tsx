'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { authorizedApiFetch, readApiError } from '@/lib/auth/client';

interface ActivityEvent {
  id: number;
  actor_name: string;
  actor_email: string;
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

export function ActivityLogView() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authorizedApiFetch('/api/admin/activity?limit=100');
      if (!response.ok) throw new Error(await readApiError(response, 'Could not load activity history.'));
      const result = await response.json() as { events: ActivityEvent[] };
      setEvents(result.events);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load activity history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadEvents(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadEvents]);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Transparency</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Activity log</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">A record of who changed or verified equipment and when.</p>
        </div>
        <button type="button" onClick={() => void loadEvents()} disabled={isLoading} className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">Refresh</button>
      </header>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {isLoading ? (
          <div className="space-y-3 p-5"><div className="skeleton h-14 rounded-xl" /><div className="skeleton h-14 rounded-xl" /><div className="skeleton h-14 rounded-xl" /></div>
        ) : events.length ? (
          <ol className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {events.map((event) => {
              const details = event.details || {};
              const changes = Object.entries(details).filter(([key]) => key !== 'record' && key !== 'verification' && key !== 'password_reset');
              const verification = details.verification && typeof details.verification === 'object'
                ? details.verification as Record<string, unknown>
                : null;
              return (
                <li key={event.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-5">
                  <div className="flex min-w-0 gap-3">
                    <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${event.action.endsWith('deleted') ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300' : event.action.endsWith('verified') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'}`}>
                      {event.target_type === 'equipment' ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 13.5v-7ZM8 20h8m-4-4v4" strokeWidth="1.7" strokeLinecap="round" /></svg>
                      ) : <span className="text-xs font-bold">U</span>}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{actionLabel(event.action)}</p>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{event.equipment_property_number || event.target_label}</span>
                      </div>
                      <p className="mt-1 break-all text-xs text-zinc-600 dark:text-zinc-400">{event.actor_name} <span className="text-zinc-400">·</span> {event.actor_email}</p>
                      {details.record !== undefined && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{printable(details.record)}</p>}
                      {details.password_reset === true && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Password reset</p>}
                      {verification && typeof verification.comment === 'string' && verification.comment && <p className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300">{verification.comment}</p>}
                      {changes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {changes.map(([key, value]) => {
                            const change = value && typeof value === 'object' ? value as Record<string, unknown> : null;
                            if (change && 'from' in change && 'to' in change) {
                              return <span key={key} className="rounded-lg bg-zinc-50 px-2 py-1 text-[10px] text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300"><span className="font-bold">{fieldLabel(key)}:</span> {printable(change.from)} → {printable(change.to)}</span>;
                            }
                            return <span key={key} className="rounded-lg bg-zinc-50 px-2 py-1 text-[10px] text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300"><span className="font-bold">{fieldLabel(key)}</span>: {printable(value)}</span>;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <time dateTime={event.occurred_at} className="pl-12 text-[11px] font-medium text-zinc-400 sm:pl-0 sm:text-right">{new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.occurred_at))}</time>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="p-10 text-center">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">—</div>
            <h3 className="mt-3 text-sm font-bold text-zinc-800 dark:text-zinc-200">No activity recorded yet</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Equipment changes and QR verifications will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
