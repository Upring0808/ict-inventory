'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { authorizedApiFetch, readApiError } from '@/lib/auth/client';

interface AuthorizedAccount {
  id: string;
  email: string;
  username: string | null;
  name: string;
  createdAt: string;
}

const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/i;

export function AccountSettings() {
  const { profile, signOut } = useAuth();
  const [accounts, setAccounts] = useState<AuthorizedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authorizedApiFetch('/api/admin/accounts');
      if (!response.ok) throw new Error(await readApiError(response, 'Could not load authorized accounts.'));
      const result = await response.json() as { accounts: AuthorizedAccount[] };
      setAccounts(result.accounts);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load authorized accounts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadAccounts(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAccounts]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusyId('new');
    setError(null);
    setSuccess(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const username = String(data.get('username') || '').trim();
    if (username && !USERNAME_PATTERN.test(username)) {
      setError('Username must be 3–32 characters using letters, numbers, dots, underscores, or hyphens.');
      setBusyId(null);
      return;
    }

    try {
      const response = await authorizedApiFetch('/api/admin/accounts', {
        method: 'POST',
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          username,
          password: data.get('password'),
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, 'The account could not be created.'));
      form.reset();
      setSuccess('Authorized account created.');
      await loadAccounts();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'The account could not be created.');
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>, account: AuthorizedAccount) => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusyId(account.id);
    setError(null);
    setSuccess(null);
    const data = new FormData(event.currentTarget);
    const username = String(data.get('username') || '').trim();
    const password = String(data.get('password') || '');
    if (username && !USERNAME_PATTERN.test(username)) {
      setError('Username must be 3–32 characters using letters, numbers, dots, underscores, or hyphens.');
      setBusyId(null);
      return;
    }

    try {
      const response = await authorizedApiFetch('/api/admin/accounts', {
        method: 'PATCH',
        body: JSON.stringify({ id: account.id, name: data.get('name'), username, password }),
      });
      if (!response.ok) throw new Error(await readApiError(response, 'The account could not be updated.'));
      setSuccess(password ? 'Account details and password updated.' : 'Account details updated.');
      form.reset();
      await loadAccounts();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'The account could not be updated.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (account: AuthorizedAccount) => {
    if (!window.confirm(`Remove ${account.name} (${account.email}) from authorized access?`)) return;
    setBusyId(account.id);
    setError(null);
    setSuccess(null);
    try {
      const response = await authorizedApiFetch('/api/admin/accounts', {
        method: 'DELETE',
        body: JSON.stringify({ id: account.id }),
      });
      if (!response.ok) throw new Error(await readApiError(response, 'The account could not be removed.'));
      const result = await response.json() as { removedCurrentUser?: boolean };
      if (result.removedCurrentUser) {
        await signOut();
        return;
      }
      setSuccess('Authorized account removed.');
      await loadAccounts();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'The account could not be removed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">System</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Settings</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage the two named people who can access the inventory dashboard.</p>
      </header>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 dark:border-blue-900/50 dark:bg-blue-950/25 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-950 dark:text-blue-100">Authorized user accounts</p>
            <p className="mt-1 text-xs leading-5 text-blue-800 dark:text-blue-200">Every listed account has the same access. Google sign-in only works for these email addresses.</p>
          </div>
          <span className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-800 dark:border-blue-800 dark:bg-zinc-900 dark:text-blue-200">{accounts.length} / 2 accounts</span>
        </div>
      </div>

      {(error || success) && (
        <div role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'}`}>
          {error || success}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Current accounts</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Update names, usernames, and passwords here.</p>
            </div>
            <button type="button" onClick={() => void loadAccounts()} disabled={isLoading} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">Refresh</button>
          </div>

          {isLoading ? (
            <div className="space-y-3"><div className="skeleton h-24 rounded-xl" /><div className="skeleton h-24 rounded-xl" /></div>
          ) : accounts.length ? (
            <div className="space-y-3">
              {accounts.map((account) => {
                const isCurrentUser = account.email.toLowerCase() === profile?.email.toLowerCase();
                return (
                  <form key={`${account.id}:${account.name}:${account.username || ''}`} onSubmit={(event) => void handleUpdate(event, account)} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{account.name}{isCurrentUser && <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800 dark:bg-green-950/50 dark:text-green-300">You</span>}</p>
                        <p className="mt-1 break-all text-xs text-zinc-500 dark:text-zinc-400">{account.email}</p>
                      </div>
                      <button type="button" onClick={() => void handleDelete(account)} disabled={busyId === account.id || accounts.length <= 1} title={accounts.length <= 1 ? 'At least one authorized account must remain.' : 'Remove account'} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/30">Remove</button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Name<input name="name" defaultValue={account.name} required minLength={2} maxLength={100} className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-normal text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" /></label>
                      <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Username <span className="font-normal">(optional)</span><input name="username" defaultValue={account.username || ''} minLength={3} maxLength={32} pattern="[A-Za-z0-9._-]{3,32}" className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-normal text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" /></label>
                      <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 sm:col-span-2">New password <span className="font-normal">(leave blank to keep current)</span><input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-normal text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" /></label>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button type="submit" disabled={busyId === account.id} className="rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">{busyId === account.id ? 'Saving…' : 'Save changes'}</button>
                    </div>
                  </form>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">No authorized accounts were returned.</p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Add an authorized user</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">Create the second account manually. Public registration is disabled.</p>
          </div>
          {accounts.length >= 2 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">The two authorized account slots are filled. Remove an account before adding another.</div>
          ) : (
            <form onSubmit={(event) => void handleCreate(event)} className="space-y-3">
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Name<input name="name" required minLength={2} maxLength={100} className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-normal text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" /></label>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Email address<input name="email" type="email" autoComplete="email" required className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-normal text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" /></label>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Username <span className="font-normal">(optional)</span><input name="username" minLength={3} maxLength={32} pattern="[A-Za-z0-9._-]{3,32}" className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-normal text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" /></label>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Initial password<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-normal text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" /><span className="mt-1 block font-normal text-zinc-400">At least 12 characters.</span></label>
              <button type="submit" disabled={busyId === 'new'} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">{busyId === 'new' ? 'Creating account…' : 'Create authorized account'}</button>
            </form>
          )}
        </section>
      </div>
    </section>
  );
}
