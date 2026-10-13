'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { authorizedApiFetch, readApiError } from '@/lib/auth/client';
import { formatApproximateLocation, formatSecurityTime } from '@/lib/security/format';
import { browserLocationMapUrl, formatBrowserLocation } from '@/lib/security/browserLocation';

interface ActivityEvent {
  id: number;
  actor_name: string;
  actor_email: string;
  actor_avatar_url?: string | null;
  action: string;
  target_type: 'equipment' | 'account' | 'session';
  target_label: string;
  equipment_property_number: string | null;
  details: Record<string, unknown>;
  occurred_at: string;
  session_id: string | null;
  connection_ip: string | null;
  connection_city: string | null;
  connection_region: string | null;
  connection_country: string | null;
  connection_latitude: number | null;
  connection_longitude: number | null;
  connection_accuracy_meters: number | null;
  connection_location_captured_at: string | null;
  device_description: string | null;
  connection_observed_at: string | null;
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
    'auth.signed_in': 'Signed in',
    'auth.session_observed': 'Session first observed',
    'auth.connection_changed': 'Connection details changed',
    'auth.signed_out': 'Signed out',
  };
  return labels[action] || action.replace(/[._]/g, ' ');
}

function eventSearchText(event: ActivityEvent): string {
  const details = event.details || {};
  const hiddenFields = [
    'verification', 'transfer', 'password_reset', 'password', 'secret', 'access_token', 'refresh_token',
  ];
  const changes = Object.entries(details)
    .filter(([key]) => !hiddenFields.includes(key.toLowerCase()) && !(
      event.action === 'equipment.transferred' && ['accountable_personnel', 'location'].includes(key)
    ))
    .map(([key, value]) => `${fieldLabel(key)} ${printable(value)}`);

  return [
    event.actor_name,
    event.actor_email,
    actionLabel(event.action),
    event.target_type,
    event.target_label,
    event.equipment_property_number,
    event.connection_ip,
    event.connection_city,
    event.connection_country,
    event.connection_latitude,
    event.connection_longitude,
    event.device_description,
    ...changes,
  ].filter((value) => value !== null && value !== undefined && value !== '').join(' ').toLowerCase();
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
  if (action.endsWith('deleted') || action === 'auth.signed_out') return 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-300';
  if (action.endsWith('verified') || action.endsWith('created') || action === 'auth.signed_in' || action === 'auth.session_observed') return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300';
  return 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300';
}

function actionDotTone(action: string): string {
  if (action.endsWith('deleted') || action === 'auth.signed_out') return 'bg-red-500';
  if (action.endsWith('verified') || action.endsWith('created') || action === 'auth.signed_in' || action === 'auth.session_observed') return 'bg-emerald-500';
  return 'bg-zinc-500';
}

function ConnectionDetails({ event }: { event: ActivityEvent }) {
  if (!event.connection_observed_at) {
    return (
      <div className="space-y-1 text-xs leading-4 text-zinc-700 dark:text-zinc-300">
        <p className="break-all"><span className="font-semibold text-zinc-900 dark:text-zinc-100">IP address:</span> {event.connection_ip || 'Unavailable'}</p>
        <p className="break-words"><span className="font-semibold text-zinc-900 dark:text-zinc-100">Device:</span> {event.device_description || 'Unavailable'}</p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{event.session_id ? `No recent check · Session ${event.session_id.slice(0, 8)}` : 'No connection observation recorded'}</p>
      </div>
    );
  }

  const browserLocation = formatBrowserLocation(event.connection_latitude, event.connection_longitude, event.connection_accuracy_meters);
  const location = browserLocation || formatApproximateLocation(event.connection_city, event.connection_country) || 'Unavailable';
  const mapUrl = browserLocationMapUrl(event.connection_latitude, event.connection_longitude);
  return (
    <div className="min-w-0 space-y-1 text-xs leading-4 text-zinc-700 dark:text-zinc-300">
      <p className="break-words"><span className="font-semibold text-zinc-900 dark:text-zinc-100">Location:</span> {location}</p>
      {mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-block font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300">View map</a> : null}
      {event.connection_location_captured_at ? <p className="text-zinc-500 dark:text-zinc-400"><span className="font-semibold">Location captured:</span> {formatSecurityTime(event.connection_location_captured_at)}</p> : null}
      <p className="break-all"><span className="font-semibold text-zinc-900 dark:text-zinc-100">IP address:</span> {event.connection_ip || 'Unavailable'}</p>
      <p className="break-words"><span className="font-semibold text-zinc-900 dark:text-zinc-100">Device:</span> {event.device_description || 'Unavailable'}</p>
      <time dateTime={event.connection_observed_at} className="block text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="font-semibold">{event.action.startsWith('auth.') ? 'Checked:' : 'Last session check:'}</span> {formatSecurityTime(event.connection_observed_at)}
      </time>
      {event.session_id ? <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Session {event.session_id.slice(0, 8)}</p> : null}
    </div>
  );
}

type ActivityDetailItem =
  | { id: string; type: 'record'; value: string }
  | { id: string; type: 'password-reset' }
  | { id: string; type: 'verification'; value: string }
  | { id: string; type: 'transfer'; value: Record<string, unknown> }
  | { id: string; type: 'change'; field: string; value: unknown };

function DetailPill({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0 max-w-full rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-2.5 py-1.5 text-xs leading-4 text-zinc-700 dark:border-zinc-700/80 dark:bg-zinc-800/60 dark:text-zinc-300">
      {children}
    </div>
  );
}

function ActivityDetail({ item }: { item: ActivityDetailItem }) {
  if (item.type === 'record') {
    return <DetailPill><span className="font-semibold text-zinc-800 dark:text-zinc-100">Record</span><span className="mx-1.5 text-zinc-400">·</span><span className="break-words">{item.value}</span></DetailPill>;
  }
  if (item.type === 'password-reset') {
    return <DetailPill><span className="font-semibold text-zinc-800 dark:text-zinc-100">Security</span><span className="mx-1.5 text-zinc-400">·</span>Password reset recorded</DetailPill>;
  }
  if (item.type === 'verification') {
    return <DetailPill><span className="font-semibold text-zinc-800 dark:text-zinc-100">Verification</span><span className="mx-1.5 text-zinc-400">·</span><span className="break-words">{item.value}</span></DetailPill>;
  }
  if (item.type === 'transfer') {
    const transfer = item.value;
    return (
      <div className="min-w-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200 sm:col-span-2">
        <p><span className="font-semibold text-zinc-900 dark:text-zinc-100">Custodian</span><span className="mx-1.5 text-zinc-400">·</span><span className="break-words">{printable(transfer.fromPersonnel)} <span className="text-emerald-700 dark:text-emerald-300">→</span> {printable(transfer.toPersonnel)}</span></p>
        <p><span className="font-semibold text-zinc-900 dark:text-zinc-100">Office</span><span className="mx-1.5 text-zinc-400">·</span><span className="break-words">{printable(transfer.fromLocation)} <span className="text-emerald-700 dark:text-emerald-300">→</span> {printable(transfer.toLocation)}</span></p>
        <p><span className="font-semibold text-zinc-900 dark:text-zinc-100">Reason</span><span className="mx-1.5 text-zinc-400">·</span><span className="break-words">{typeof transfer.reason === 'string' && transfer.reason.trim() ? transfer.reason : 'No reason provided'}</span></p>
        <p className="mt-0.5 break-all font-mono text-[10px] leading-4 text-zinc-500 dark:text-zinc-400">Receipt {printable(transfer.id)}</p>
      </div>
    );
  }

  const change = item.value && typeof item.value === 'object' ? item.value as Record<string, unknown> : null;
  return (
    <DetailPill>
      <span className="font-semibold text-zinc-800 dark:text-zinc-100">{fieldLabel(item.field)}</span>
      <span className="mx-1.5 text-zinc-400">·</span>
      <span className="break-words">{change && 'from' in change && 'to' in change ? <>{printable(change.from)} <span className="text-emerald-700 dark:text-emerald-300">→</span> {printable(change.to)}</> : printable(item.value)}</span>
    </DetailPill>
  );
}

export function ActivityLogView({ isActive = true }: { isActive?: boolean }) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [trackingAvailable, setTrackingAvailable] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);
  const requestInFlight = useRef(false);
  const wasActive = useRef(isActive);

  const loadEvents = useCallback(async (preserveEvents = false) => {
    const requestId = ++latestRequest.current;
    requestInFlight.current = true;
    if (preserveEvents) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
      setIsRefreshing(false);
      setEvents([]);
      setHasMore(false);
    }
    setIsLoadingMore(false);
    setError(null);

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
      const result = await response.json() as { events: ActivityEvent[]; hasMore: boolean; trackingAvailable?: boolean };
      if (requestId === latestRequest.current) {
        setEvents(result.events);
        setHasMore(result.hasMore);
        setTrackingAvailable(result.trackingAvailable !== false);
      }
    } catch (loadError) {
      if (requestId === latestRequest.current) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load activity history.');
      }
    } finally {
      if (requestId === latestRequest.current) {
        requestInFlight.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [selectedDate]);

  const loadMore = async () => {
    if (isRefreshing || isLoadingMore || !hasMore) return;
    const requestId = latestRequest.current;
    requestInFlight.current = true;
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
      const result = await response.json() as { events: ActivityEvent[]; hasMore: boolean };
      if (requestId === latestRequest.current) {
        setEvents((current) => [...current, ...result.events]);
        setHasMore(result.hasMore);
      }
    } catch (loadError) {
      if (requestId === latestRequest.current) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load more activity.');
      }
    } finally {
      if (requestId === latestRequest.current) {
        requestInFlight.current = false;
        setIsLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadEvents(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadEvents]);

  useEffect(() => {
    const becameActive = isActive && !wasActive.current;
    wasActive.current = isActive;
    if (becameActive && !requestInFlight.current) void loadEvents(true);
  }, [isActive, loadEvents]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleEvents = normalizedSearch
    ? events.filter((event) => eventSearchText(event).includes(normalizedSearch))
    : events;

  return (
    <section className="w-full min-w-0 space-y-5 pb-4 sm:space-y-6">
      <header className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[30px]">Activity log</h2>
          <p className="mt-1.5 max-w-[75ch] text-sm leading-5 text-zinc-600 dark:text-zinc-400">See equipment changes and sign-in session checks, including observed connections.</p>
          <details className="group mt-2 max-w-[105ch] text-xs text-zinc-600 dark:text-zinc-400">
            <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-1.5 rounded-md font-medium text-emerald-800 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-emerald-600/15 dark:text-emerald-300 [&::-webkit-details-marker]:hidden">
              How location details are recorded
              <svg aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="m5 7.5 5 5 5-5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </summary>
            <p className="mt-1 leading-5">Location is reported by the browser at sign-in and during active session checks, with its estimated accuracy. IP and device details are separate. Older activity may only have approximate IP location.</p>
          </details>
        </div>

        <div className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 sm:grid-cols-2 sm:items-end lg:grid-cols-[minmax(20rem,1fr)_auto_auto] dark:border-zinc-800 dark:bg-zinc-900/50">
          <label htmlFor="activity-search" className="block min-w-0 sm:col-span-2 lg:col-span-1">
            <span className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Search activity</span>
            <span className="relative block">
              <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <circle cx="8.75" cy="8.75" r="5.75" strokeWidth="1.6" />
                <path d="m13 13 4 4" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                id="activity-search"
                type="search"
                aria-describedby="activity-search-hint"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Name, IP, device, or change"
                className="min-h-11 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-500 hover:border-zinc-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:hover:border-zinc-600"
              />
            </span>
            <span id="activity-search-hint" className="mt-1.5 block text-xs text-zinc-500 dark:text-zinc-400">Searches the entries loaded below.</span>
          </label>
          <label htmlFor="activity-date" className="block">
            <span className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Filter by day</span>
            <input
              id="activity-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none transition hover:border-zinc-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 sm:w-auto dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-600"
            />
          </label>
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
            {selectedDate || searchQuery ? (
              <button
                type="button"
                onClick={() => { setSelectedDate(''); setSearchQuery(''); }}
                className="min-h-11 rounded-lg px-3 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-200/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Clear filters
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void loadEvents(true)}
              disabled={isLoading || isRefreshing}
              className="min-h-11 rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">{error}</p> : null}
      {!trackingAvailable && !error ? <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">Security connection tracking will appear after the updated Supabase schema is applied. Existing activity is still available.</p> : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800 sm:px-5">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{selectedDate ? `Activity for ${selectedDate}` : 'Recent activity'}</p>
          <p aria-live="polite" className="text-xs text-zinc-500 dark:text-zinc-400">
            {isLoading
              ? 'Loading…'
              : `${normalizedSearch ? `${visibleEvents.length} matching in ` : ''}${events.length} loaded${hasMore ? ' · more available' : ''}${isRefreshing ? ' · Refreshing' : ''}`}
          </p>
        </div>

        {isLoading ? (
          <div className="divide-y divide-zinc-100 px-4 dark:divide-zinc-800 sm:px-5" role="status" aria-label="Loading activity">
            {[0, 1, 2].map((item) => (
              <div key={item} className="grid gap-4 py-5 xl:grid-cols-[minmax(13rem,0.9fr)_minmax(0,1.6fr)_minmax(15rem,1fr)] xl:gap-6">
                <div className="space-y-2">
                  <div className="skeleton h-3 w-32 rounded" />
                  <div className="skeleton h-10 w-4/5 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <div className="skeleton h-6 w-44 rounded-lg" />
                  <div className="skeleton h-10 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                  <div className="skeleton h-3 w-28 rounded" />
                  <div className="skeleton h-16 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length ? (
          visibleEvents.length ? (
            <ol aria-label="Activity log entries" className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {visibleEvents.map((event) => {
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
              const formattedDate = Number.isNaN(occurredAt.getTime())
                ? event.occurred_at
                : new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(occurredAt);
              const formattedTime = Number.isNaN(occurredAt.getTime())
                ? ''
                : new Intl.DateTimeFormat('en-PH', { timeStyle: 'short' }).format(occurredAt);

              const detailItems: ActivityDetailItem[] = [];
              const recordText = details.record !== undefined ? printable(details.record) : '';
              const verificationComment = verification && typeof verification.comment === 'string' ? verification.comment.trim() : '';
              const transferTextLength = transfer
                ? [transfer.fromPersonnel, transfer.toPersonnel, transfer.fromLocation, transfer.toLocation, transfer.reason, transfer.id].map(printable).join(' ').length
                : 0;
              if (details.record !== undefined) detailItems.push({ id: 'record', type: 'record', value: recordText });
              if (details.password_reset === true) detailItems.push({ id: 'password-reset', type: 'password-reset' });
              if (verificationComment) detailItems.push({ id: 'verification', type: 'verification', value: verificationComment });
              if (transfer) detailItems.push({ id: 'transfer', type: 'transfer', value: transfer });
              changes.forEach(([key, value]) => detailItems.push({ id: `change-${key}`, type: 'change', field: key, value }));

              const detailTextLength = detailItems.reduce((length, item) => {
                if (item.type === 'record' || item.type === 'verification') return length + item.value.length;
                if (item.type === 'transfer') return length + transferTextLength;
                if (item.type === 'change') return length + `${item.field} ${printable(item.value)}`.length;
                return length + 24;
              }, 0);
              const isDense = detailItems.length > 4 || changes.length > 3 || detailTextLength > 460 ||
                recordText.length > 220 || verificationComment.length > 220 || transferTextLength > 260;
              const inlineLimit = isDense ? 2 : Number.POSITIVE_INFINITY;
              let inlineCount = 0;
              const inlineDetails: ActivityDetailItem[] = [];
              const expandedDetails: ActivityDetailItem[] = [];
              detailItems.forEach((item) => {
                const length = item.type === 'record' || item.type === 'verification'
                  ? item.value.length
                  : item.type === 'transfer'
                    ? transferTextLength
                    : item.type === 'change'
                      ? `${item.field} ${printable(item.value)}`.length
                      : 0;
                const maxInlineLength = item.type === 'transfer' ? 280 : 200;
                const canShowInline = length <= maxInlineLength && inlineCount < inlineLimit;
                if (canShowInline) {
                  inlineDetails.push(item);
                  if (item.type !== 'password-reset') inlineCount += 1;
                } else {
                  expandedDetails.push(item);
                }
              });

              return (
                <li key={event.id} className="px-4 py-4 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/25 sm:px-5 sm:py-5">
                  <article className="grid min-w-0 gap-4 xl:grid-cols-[minmax(13rem,0.9fr)_minmax(0,1.6fr)_minmax(15rem,1fr)] xl:gap-6">
                    <div className="min-w-0">
                      <time dateTime={event.occurred_at} className="flex flex-wrap items-center gap-x-2 text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
                        <span>{formattedDate}</span>
                        {formattedTime ? <><span aria-hidden="true" className="text-zinc-400">·</span><span>{formattedTime}</span></> : null}
                      </time>
                      <p className="mb-1 mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Performed by</p>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <ActorAvatar name={actorName} imageUrl={event.actor_avatar_url} key={event.actor_avatar_url || 'no-avatar'} />
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-zinc-900 dark:text-zinc-100">{actorName}</p>
                          <p className="break-all text-xs text-zinc-500 dark:text-zinc-400">{event.actor_email || 'Authorized user'}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Affected item</p>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">{event.target_type === 'equipment' ? 'Equipment' : event.target_type === 'session' ? 'Security session' : 'User account'}</p>
                        <p className="mt-0.5 break-words text-sm font-medium text-zinc-800 dark:text-zinc-200" title={targetLabel}>{targetLabel}</p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Action</h3>
                      <div className="grid min-w-0 justify-items-start gap-2">
                        <span className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold leading-4 ${actionTone(event.action)}`}>
                          <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${actionDotTone(event.action)}`} />
                          <span className="break-words">{actionLabel(event.action)}</span>
                        </span>
                        {inlineDetails.length ? <div className="grid min-w-0 gap-1.5">{inlineDetails.map((item) => <ActivityDetail key={item.id} item={item} />)}</div> : null}
                        {expandedDetails.length ? (
                          <details className="group w-fit max-w-full">
                            <summary className="flex min-h-8 cursor-pointer select-none items-center gap-1.5 rounded-md px-1.5 text-xs font-semibold text-emerald-800 outline-none transition hover:bg-emerald-50 focus-visible:ring-4 focus-visible:ring-emerald-600/15 dark:text-emerald-300 dark:hover:bg-emerald-950/35">
                              <svg aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.25 4.5a.75.75 0 0 1 1.06.02l4.25 4.5a.75.75 0 0 1 0 1.03l-4.25 4.5a.75.75 0 1 1-1.09-1.03L10.99 9.5 7.23 5.53a.75.75 0 0 1 .02-1.03Z" clipRule="evenodd" /></svg>
                              <span className="group-open:hidden">Show {expandedDetails.length} more {expandedDetails.length === 1 ? 'detail' : 'details'}</span>
                              <span className="hidden group-open:inline">Hide additional details</span>
                            </summary>
                            <div className="mt-1.5 grid min-w-0 gap-1.5">{expandedDetails.map((item) => <ActivityDetail key={item.id} item={item} />)}</div>
                          </details>
                        ) : detailItems.length === 0 ? <span className="text-xs text-zinc-500 dark:text-zinc-400">No extra details</span> : null}
                      </div>
                    </div>

                    <div className="min-w-0 border-t border-zinc-100 pt-3 dark:border-zinc-800 xl:border-l xl:border-t-0 xl:border-zinc-100 xl:pl-5 xl:pt-0 dark:xl:border-zinc-800">
                      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Connection</h3>
                      <ConnectionDetails event={event} />
                    </div>
                  </article>
                </li>
              );
            })}
            </ol>
          ) : (
            <div className="px-5 py-12 text-center">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No matches in loaded activity</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Try another term{hasMore ? ' or load older activity to expand the search.' : ' or clear the search.'}</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 min-h-9 rounded-lg px-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15 dark:text-emerald-300 dark:hover:bg-emerald-950/35"
              >
                Clear search
              </button>
            </div>
          )
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
            disabled={isLoadingMore || isRefreshing}
            className="min-h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15 disabled:cursor-wait disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {isLoadingMore ? 'Loading…' : isRefreshing ? 'Refreshing…' : 'Load more activity'}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ActorAvatar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-emerald-200 bg-emerald-50 text-[11px] font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
      {imageUrl && !imageFailed ? (
        <Image src={imageUrl} alt="" width={36} height={36} unoptimized loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} className="h-full w-full object-cover" />
      ) : initialsFor(name)}
    </span>
  );
}
