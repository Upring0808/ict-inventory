'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InitialSetupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    const data = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bootstrapSecret: data.get('bootstrapSecret'),
          name: data.get('name'),
          email: data.get('email'),
          username: data.get('username'),
          password: data.get('password'),
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Initial setup could not be completed.');
      setIsComplete(true);
      window.setTimeout(() => router.replace('/'), 1200);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Initial setup could not be completed.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-5xl place-items-center">
        <section className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="bg-gradient-to-r from-green-700 to-blue-700 px-7 py-7 text-white sm:px-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">PENRO Batanes · ICT Inventory</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create the first authorized account</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">This one-time setup is available only while no inventory account exists and requires the server setup key.</p>
          </div>

          <div className="p-6 sm:p-10">
            {isComplete ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <h2 className="font-semibold text-emerald-900 dark:text-emerald-100">First account created</h2>
                <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">Sign in, then open Settings to add the second authorized user.</p>
                <Link href="/" className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-green-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Continue to sign in</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="bootstrap-secret" className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">One-time setup key</label>
                  <input id="bootstrap-secret" name="bootstrapSecret" type="password" autoComplete="off" required minLength={32} className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-950" />
                </div>
                <div>
                  <label htmlFor="account-name" className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Name</label>
                  <input id="account-name" name="name" autoComplete="name" required minLength={2} maxLength={100} className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-950" />
                </div>
                <div>
                  <label htmlFor="account-username" className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Username <span className="font-normal text-zinc-400">optional</span></label>
                  <input id="account-username" name="username" autoComplete="username" minLength={3} maxLength={32} pattern="[A-Za-z0-9._-]{3,32}" className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-950" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="account-email" className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email address</label>
                  <input id="account-email" name="email" type="email" autoComplete="email" required className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-950" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="account-password" className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Password</label>
                  <input id="account-password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-950" />
                  <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">Use at least 12 characters. This account can add the second administrator in Settings.</p>
                </div>
                {error && <p role="alert" className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
                <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
                  <Link href="/" className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100">Back to sign in</Link>
                  <button type="submit" disabled={isSaving} className="rounded-xl bg-gradient-to-r from-green-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? 'Creating account…' : 'Create first account'}</button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
