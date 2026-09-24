'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { fetchAuthProfile } from '@/lib/auth/client';

const LOGIN_ERROR_KEY = 'ict_inventory_login_error';
const callbackSessions = new Map<string, Promise<Session>>();

function exchangeCallbackCodeOnce(code: string): Promise<Session> {
  const pending = callbackSessions.get(code);
  if (pending) return pending;

  const exchange = createBrowserClient().auth.exchangeCodeForSession(code).then(({ data, error }) => {
    if (error || !data.session) throw error || new Error('Google sign-in did not return a valid session.');
    return data.session;
  });
  callbackSessions.set(code, exchange);
  return exchange;
}

export function AuthCallback({ code, providerError }: { code: string | null; providerError: string | null }) {
  const [message, setMessage] = useState('Validating your authorized account…');

  useEffect(() => {
    let active = true;
    const complete = async () => {
      try {
        if (providerError) throw new Error('Google sign-in could not be completed. Use an account registered in Settings.');
        if (!code) throw new Error('Google sign-in did not return a valid session. Please try again.');

        const session = await exchangeCallbackCodeOnce(code);

        const response = await fetchAuthProfile(session.access_token);
        if (!response.ok) {
          if (response.status !== 401 && response.status !== 403) throw new Error('Could not check this account right now. Check your connection and try again.');
          throw new Error('This Google account is not registered as an authorized inventory user.');
        }

        window.location.replace('/');
      } catch (callbackError) {
        if (!active) return;
        const text = callbackError instanceof Error
          ? callbackError.message
          : 'Google sign-in could not be completed. Please try again.';
        window.sessionStorage.setItem(LOGIN_ERROR_KEY, text);
        await createBrowserClient().auth.signOut().catch(() => undefined);
        setMessage(text);
        window.setTimeout(() => window.location.replace('/'), 1200);
      }
    };
    void complete();
    return () => { active = false; };
  }, [code, providerError]);

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-5 dark:bg-zinc-950">
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span className="mx-auto mb-3 block h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{message}</p>
      </div>
    </main>
  );
}
