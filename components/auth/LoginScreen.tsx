'use client';

import { useState, type FormEvent } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface LoginScreenProps {
  onPasswordSignIn: (credentials: LoginCredentials) => void | Promise<void>;
  onGoogleSignIn: () => void | Promise<void>;
  isLoading?: boolean;
  loadingMethod?: 'google' | 'password' | null;
  error?: string | null;
}

type LoginView = 'sign-in' | 'forgot-password';

const inputClassName = 'min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-green-600 focus:ring-4 focus:ring-green-600/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus:border-green-500 dark:focus:ring-green-500/10';

export function LoginScreen({
  onPasswordSignIn,
  onGoogleSignIn,
  isLoading = false,
  loadingMethod,
  error,
}: LoginScreenProps) {
  const [view, setView] = useState<LoginView>('sign-in');
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotNotice, setForgotNotice] = useState<string | null>(null);

  const activeLoadingMethod = loadingMethod ?? (isLoading ? 'password' : null);
  const isBusy = isLoading || activeLoadingMethod !== null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get('emailOrUsername') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (identifier && password) {
      void onPasswordSignIn({ emailOrUsername: identifier, password });
    }
  };

  const handleForgotSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsForgotSubmitting(true);
    setForgotError(null);
    setForgotNotice(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('forgotEmail') ?? '').trim();

    try {
      const { error: resetError } = await createBrowserClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (resetError) throw resetError;
      setForgotNotice('If an account is registered with this email, password reset instructions will be sent.');
    } catch {
      setForgotError('Could not start password reset. Please try again.');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  const openForgotPassword = () => {
    const candidate = emailOrUsername.trim();
    setForgotEmail(candidate.includes('@') ? candidate : '');
    setForgotError(null);
    setForgotNotice(null);
    setView('forgot-password');
  };

  const returnToSignIn = () => {
    setForgotError(null);
    setForgotNotice(null);
    setView('sign-in');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 sm:py-8">
      <div className="w-full max-w-[25rem]">
        <header className="mb-5 flex items-center justify-center gap-3 sm:mb-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-green-600 to-blue-600 text-white shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4.75 8.25 12 4l7.25 4.25v7.5L12 20l-7.25-4.25v-7.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="m8.5 12.15 2.3 2.3 4.7-4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">PENRO Batanes</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">ICT Inventory</p>
          </div>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_-32px_rgba(24,24,27,0.35)] dark:border-zinc-800 dark:bg-zinc-900 sm:p-7">
          {view === 'sign-in' ? (
            <>
              <div className="mb-5">
                <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-800 dark:border-green-900/70 dark:bg-green-950/40 dark:text-green-300">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 1.7a.8.8 0 0 1 .45.14l5.3 3.54a.8.8 0 0 1 .36.67v4.2c0 3.72-2.31 6.35-5.75 8.02a.8.8 0 0 1-.7 0C6.22 16.6 3.9 13.97 3.9 10.25v-4.2a.8.8 0 0 1 .36-.67l5.3-3.54a.8.8 0 0 1 .44-.14Zm2.86 6.62a.8.8 0 1 0-1.22-1.04l-2.5 2.92-1.1-1.1a.8.8 0 0 0-1.13 1.13l1.72 1.71a.8.8 0 0 0 1.17-.04l3.06-3.58Z" clipRule="evenodd" />
                  </svg>
                  Authorized access
                </p>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">Sign in to your account</h1>
                <p className="mt-1.5 text-sm leading-5 text-zinc-600 dark:text-zinc-400">Use your authorized account to continue to the inventory dashboard.</p>
              </div>

              <button
                type="button"
                onClick={() => void onGoogleSignIn()}
                disabled={isBusy}
                aria-busy={activeLoadingMethod === 'google'}
                className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
              >
                {activeLoadingMethod === 'google' ? <LoadingSpinner /> : <GoogleMark />}
                <span>{activeLoadingMethod === 'google' ? 'Connecting to Google…' : 'Continue with Google'}</span>
              </button>

              <div className="my-4 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">or use your account</span>
                <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="login-email" className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email or username</label>
                  <input
                    id="login-email"
                    name="emailOrUsername"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    disabled={isBusy}
                    value={emailOrUsername}
                    onChange={(event) => setEmailOrUsername(event.target.value)}
                    placeholder="name@denr.gov.ph"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <label htmlFor="login-password" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Password</label>
                    <button type="button" onClick={openForgotPassword} disabled={isBusy} className="rounded px-1 py-0.5 text-xs font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-300 dark:hover:text-blue-200">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      disabled={isBusy}
                      placeholder="Enter your password"
                      className={`${inputClassName} pr-20`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      disabled={isBusy}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-1 inline-flex min-h-11 min-w-[3.75rem] items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600/50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.1 0 8.7 4.4 9.5 6-.3.6-1 1.5-2.1 2.5M6.2 6.2C3.9 7.6 2.7 9.6 2.5 11c.5 1.2 4.1 7 9.5 7 1.2 0 2.3-.3 3.3-.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M2.5 12s3.2-7 9.5-7 9.5 7 9.5 7-3.2 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      )}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                </div>

                {error ? <AuthMessage kind="error">{error}</AuthMessage> : null}

                <button
                  type="submit"
                  disabled={isBusy}
                  aria-busy={activeLoadingMethod === 'password'}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-green-700 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-65"
                >
                  {activeLoadingMethod === 'password' ? <LoadingSpinner /> : null}
                  <span>{activeLoadingMethod === 'password' ? 'Signing in…' : 'Sign in'}</span>
                </button>
              </form>

              <p className="mt-5 border-t border-zinc-200 pt-4 text-xs leading-5 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                This workspace is limited to authorized PENRO Batanes inventory administrators.
              </p>
            </>
          ) : (
            <>
              <div className="mb-5">
                <button type="button" onClick={returnToSignIn} disabled={isForgotSubmitting} className="mb-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-1 text-xs font-semibold text-zinc-600 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300 dark:hover:text-zinc-100">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.25 10a.75.75 0 0 1-.75.75H6.06l2.72 2.72a.75.75 0 1 1-1.06 1.06l-4-4a.75.75 0 0 1 0-1.06l4-4a.75.75 0 1 1 1.06 1.06l-2.72 2.72h9.44a.75.75 0 0 1 .75.75Z" clipRule="evenodd" /></svg>
                  Back to sign in
                </button>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">Reset your password</h1>
                <p className="mt-1.5 text-sm leading-5 text-zinc-600 dark:text-zinc-400">Enter your account email and we’ll send reset instructions if it is eligible.</p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="forgot-email" className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email address</label>
                  <input
                    id="forgot-email"
                    name="forgotEmail"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    disabled={isForgotSubmitting}
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    placeholder="name@denr.gov.ph"
                    className={inputClassName}
                  />
                </div>
                {forgotError ? <AuthMessage kind="error">{forgotError}</AuthMessage> : null}
                {forgotNotice ? <AuthMessage kind="success">{forgotNotice}</AuthMessage> : null}
                <button
                  type="submit"
                  disabled={isForgotSubmitting}
                  aria-busy={isForgotSubmitting}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-green-700 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-65"
                >
                  {isForgotSubmitting ? <LoadingSpinner /> : null}
                  <span>{isForgotSubmitting ? 'Sending instructions…' : 'Send reset instructions'}</span>
                </button>
              </form>

              <p className="mt-5 border-t border-zinc-200 pt-4 text-xs leading-5 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                For account security, the response won’t confirm whether an email is registered.
              </p>
            </>
          )}
        </section>

        <p className="mt-4 text-center text-[11px] text-zinc-400 dark:text-zinc-500">Provincial Environment and Natural Resources Office · Batanes</p>
      </div>
    </main>
  );
}

function AuthMessage({ children, kind }: { children: string; kind: 'error' | 'success' }) {
  const styles = kind === 'error'
    ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/70 dark:bg-red-950/35 dark:text-red-300'
    : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-300';

  return <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-3 py-2.5 text-sm leading-5 ${styles}`}>{children}</div>;
}

function GoogleMark() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.66 17.74 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.47-4.74 7.16l7.66 5.94c4.47-4.13 7.12-10.2 7.12-17.57Z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.92 23.92 0 0 0 0 21.56l7.98-6.19Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.88l-7.66-5.94c-2.13 1.43-4.86 2.27-8.25 2.27-6.26 0-11.57-4.16-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
