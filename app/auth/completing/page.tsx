'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

export default function CompletingSignInPage() {
  const { status, error, retryAuthorization } = useAuth();
  const attemptedRef = useRef(false);
  const [retried, setRetried] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      window.location.replace('/');
    } else if (status === 'unauthenticated' && !attemptedRef.current) {
      attemptedRef.current = true;
      void retryAuthorization().then(
        () => setRetried(true),
        () => setRetried(true),
      );
    }
  }, [status, retryAuthorization]);

  const isVerifying = status === 'loading' || (status === 'unauthenticated' && !retried) || status === 'authenticated';

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-5 dark:bg-zinc-950">
      <section
        aria-live="polite"
        aria-busy={isVerifying}
        className="flex max-w-sm flex-col items-center rounded-2xl border border-zinc-200 bg-white px-8 py-7 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        {isVerifying && <span className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600" />}
        <h1 className="mt-5 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {isVerifying ? 'Completing sign-in…' : 'Google sign-in needs attention'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {isVerifying ? 'Verifying your account and opening the inventory.' : error || 'Your Google session could not be verified. Please try signing in again.'}
        </p>
        {!isVerifying && <Link href="/" className="mt-5 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Return to sign in</Link>}
      </section>
    </main>
  );
}
