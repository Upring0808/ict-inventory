'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabase/client';
import { withDeadline } from '@/lib/auth/client';

const callbackSessions = new Map<string, Promise<Session>>();

function exchangeCallbackCodeOnce(code: string): Promise<Session> {
  const pending = callbackSessions.get(code);
  if (pending) return pending;

  const exchange = createBrowserClient().auth.exchangeCodeForSession(code).then(({ data, error }) => {
    if (error || !data.session) throw error || new Error('Google sign-in did not return a valid session.');
    return data.session;
  }).catch((error: unknown) => {
    callbackSessions.delete(code);
    throw error;
  });
  callbackSessions.set(code, exchange);
  return exchange;
}

export function AuthCallback({ code, providerError }: { code: string | null; providerError: string | null }) {
  const [message, setMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setMessage(null);
    setChecking(true);
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const complete = async () => {
      try {
        if (providerError) throw new Error('Google sign-in was not completed. Please try again.');
        if (!code) throw new Error('Google sign-in did not return a valid session. Please try again.');

        // The code exchange saves the session. The dashboard verifies the
        // allowlisted account after this redirect, with one check per token.
        await withDeadline(exchangeCallbackCodeOnce(code), 15_000);
        if (active) window.location.replace('/');
      } catch (callbackError) {
        if (!active) return;
        setMessage(callbackError instanceof Error ? callbackError.message : 'Google sign-in could not be completed.');
        setChecking(false);
      }
    };
    void complete();
    return () => { active = false; };
  }, [code, providerError, attempt]);

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-5 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white px-6 py-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {checking ? <span className="mx-auto mb-3 block h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600" /> : null}
        <p role={checking ? 'status' : 'alert'} className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {checking ? 'Completing Google sign-in…' : message}
        </p>
        {!checking ? (
          <div className="mt-5 flex justify-center gap-3">
            {code && !providerError ? <button type="button" onClick={retry} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Try again</button> : null}
            <Link href="/" className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">Return to sign in</Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
