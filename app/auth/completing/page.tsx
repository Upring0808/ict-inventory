'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function CompletingSignInPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'loading') router.replace('/');
  }, [router, status]);

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-5 dark:bg-zinc-950">
      <section
        aria-live="polite"
        aria-busy="true"
        className="flex max-w-sm flex-col items-center rounded-2xl border border-zinc-200 bg-white px-8 py-7 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600" />
        <h1 className="mt-5 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Completing sign-in…
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Verifying your account and opening the inventory.
        </p>
      </section>
    </main>
  );
}
