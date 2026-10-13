'use client';

import Link from 'next/link';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { useAuth } from '@/components/auth/AuthProvider';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  if (auth.status === 'loading') {
    return (
      <main aria-busy="true" className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <span className="sr-only" role="status">Opening inventory…</span>
        <aside aria-hidden="true" className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:block">
          <div className="skeleton h-9 w-36" />
          <div className="mt-10 space-y-5">
            {[0, 1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-9 w-full" />)}
          </div>
        </aside>
        <div aria-hidden="true" className="min-w-0 flex-1">
          <div className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="skeleton h-5 w-40" />
            <div className="skeleton h-8 w-8 rounded-full" />
          </div>
          <div className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
            <div className="skeleton h-8 w-52" />
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((item) => <div key={item} className="skeleton h-28 rounded-2xl" />)}
            </div>
            <div className="skeleton h-56 rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  if (auth.status === 'setup_required') {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-50 px-5 dark:bg-zinc-950">
        <section className="max-w-lg rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-700 text-white">
            <span className="text-lg font-bold">ICT</span>
          </div>
          <h1 className="mt-5 text-xl font-bold text-zinc-900 dark:text-zinc-50">Set up the first authorized account</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">The dashboard is ready for its first administrator. Use the one-time setup key configured by the system maintainer.</p>
          <Link href="/setup" className="mt-6 inline-flex rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800">Start secure setup</Link>
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
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => void auth.retryAuthorization()} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15">Try again</button>
            <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">Reload page</button>
          </div>
        </section>
      </main>
    );
  }

  if (auth.status !== 'authenticated') {
    return (
      <LoginScreen
        onPasswordSignIn={({ emailOrUsername, password, location }) => auth.signInWithPassword(emailOrUsername, password, location)}
        onGoogleSignIn={auth.signInWithGoogle}
        loadingMethod={auth.loadingMethod}
        error={auth.error}
      />
    );
  }

  return children;
}
