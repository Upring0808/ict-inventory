'use client';

import React, { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import { authorizedApiFetch, fetchAuthProfile, readApiError } from '@/lib/auth/client';
import { createBrowserClient } from '@/lib/supabase/client';

const recoveryCodeExchanges = new Map<string, Promise<Session>>();

function exchangeRecoveryCode(code: string): Promise<Session> {
  const pending = recoveryCodeExchanges.get(code);
  if (pending) return pending;

  const exchange = createBrowserClient().auth.exchangeCodeForSession(code).then(({ data, error }) => {
    if (error || !data.session) throw error || new Error('The recovery link did not return a valid session.');
    return data.session;
  });
  recoveryCodeExchanges.set(code, exchange);
  return exchange;
}

type ScreenState = 'checking' | 'ready' | 'saving' | 'done' | 'error';

const inputClassName = 'mt-1.5 block min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100';

export function PasswordResetScreen() {
  const [screenState, setScreenState] = useState<ScreenState>('checking');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const validateRecoverySession = async () => {
      try {
        const client = createBrowserClient();
        const code = new URLSearchParams(window.location.search).get('code');
        let session: Session | null;

        if (code) {
          session = await exchangeRecoveryCode(code);
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.delete('code');
          window.history.replaceState({}, '', currentUrl);
        } else {
          const { data, error: sessionError } = await client.auth.getSession();
          if (sessionError) throw sessionError;
          session = data.session;
        }

        if (!session) throw new Error('This recovery link has expired. Request a new password reset email.');

        const response = await fetchAuthProfile(session.access_token);
        if (!response.ok) {
          const message = await readApiError(response, 'This recovery link is not for an authorized inventory account.');
          await client.auth.signOut().catch(() => undefined);
          throw new Error(message);
        }

        if (active) setScreenState('ready');
      } catch (recoveryError) {
        if (!active) return;
        setError(recoveryError instanceof Error ? recoveryError.message : 'The recovery link could not be verified.');
        setScreenState('error');
      }
    };

    void validateRecoverySession();
    return () => { active = false; };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get('password') || '');
    const confirmation = String(data.get('confirmation') || '');

    if (password.length < 12 || password.length > 128) {
      setError('Use a password between 12 and 128 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }

    setError(null);
    setScreenState('saving');
    try {
      const response = await authorizedApiFetch('/api/auth/password-reset', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      if (!response.ok) throw new Error(await readApiError(response, 'The password could not be updated.'));
      const result = await response.json() as { warning?: string };
      setWarning(result.warning || null);
      await createBrowserClient().auth.signOut().catch(() => undefined);
      setScreenState('done');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'The password could not be updated.');
      setScreenState('ready');
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <Link href="/" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">ICT Inventory</Link>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">{screenState === 'done' ? 'Password updated' : 'Reset your password'}</h1>
        {screenState === 'checking' ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Checking your recovery link…</p>
        ) : screenState === 'error' ? (
          <>
            <p role="alert" className="mt-3 text-sm leading-6 text-red-700 dark:text-red-300">{error}</p>
            <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900">Return to sign in</Link>
          </>
        ) : screenState === 'done' ? (
          <>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">You can now sign in with your new password.</p>
            {warning && <p role="status" className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{warning}</p>}
            <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900">Return to sign in</Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">Choose a new password for your authorized account.</p>
            <form onSubmit={(submitEvent) => void handleSubmit(submitEvent)} className="mt-5 space-y-4">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">New password<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className={inputClassName} /></label>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Confirm new password<input name="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className={inputClassName} /></label>
              {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
              <button type="submit" disabled={screenState === 'saving'} className="flex min-h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-zinc-900">{screenState === 'saving' ? 'Updating password…' : 'Update password'}</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
