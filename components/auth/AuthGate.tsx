'use client';

import Link from 'next/link';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { useAuth } from '@/components/auth/AuthProvider';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  if (auth.status === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm font-medium text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600" />
          Checking authorized access…
        </div>
      </main>
    );
  }

  if (auth.status === 'setup_required') {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-50 px-5 dark:bg-zinc-950">
        <section className="max-w-lg rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-green-600 to-blue-600 text-white">
            <span className="text-lg font-bold">ICT</span>
          </div>
          <h1 className="mt-5 text-xl font-bold text-zinc-900 dark:text-zinc-50">Set up the first authorized account</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">The dashboard is ready for its first administrator. Use the one-time setup key configured by the system maintainer.</p>
          <Link href="/setup" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-green-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm">Start secure setup</Link>
        </section>
      </main>
    );
  }

  if (auth.status === 'unavailable') {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-50 px-5 dark:bg-zinc-950">
        <section className="max-w-lg rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl dark:border-amber-900/60 dark:bg-zinc-900">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">!</div>
          <h1 className="mt-5 text-xl font-bold text-zinc-900 dark:text-zinc-50">Authentication is unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{auth.error || 'Check the Supabase server settings and apply the inventory schema.'}</p>
        </section>
      </main>
    );
  }

  if (auth.status !== 'authenticated') {
    return (
      <LoginScreen
        onPasswordSignIn={({ emailOrUsername, password }) => auth.signInWithPassword(emailOrUsername, password)}
        onGoogleSignIn={auth.signInWithGoogle}
        loadingMethod={auth.loadingMethod}
        error={auth.error}
      />
    );
  }

  return children;
}
