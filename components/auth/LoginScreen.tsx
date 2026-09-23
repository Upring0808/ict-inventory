'use client';

import type { FormEvent } from 'react';

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface LoginScreenProps {
  onPasswordSignIn: (credentials: LoginCredentials) => void | Promise<void>;
  onGoogleSignIn: () => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginScreen({
  onPasswordSignIn,
  onGoogleSignIn,
  isLoading = false,
  error,
}: LoginScreenProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const emailOrUsername = String(formData.get('emailOrUsername') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (emailOrUsername && password) {
      void onPasswordSignIn({ emailOrUsername, password });
    }
  };

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 sm:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white shadow-[0_24px_70px_-38px_rgba(24,24,27,0.38)] dark:border-zinc-800 dark:bg-zinc-900 sm:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-green-700 via-emerald-700 to-blue-700 p-10 text-white lg:flex xl:p-14">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-32 -top-28 h-[27rem] w-[27rem] rounded-full border border-white/10" />
            <div className="absolute -right-16 -top-12 h-[19rem] w-[19rem] rounded-full border border-white/10" />
            <div className="absolute -bottom-40 -left-28 h-[32rem] w-[32rem] rounded-full border border-white/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.15),transparent_34%)]" />
          </div>

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-sm backdrop-blur-sm">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4.75 8.25 12 4l7.25 4.25v7.5L12 20l-7.25-4.25v-7.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="m8.5 12.15 2.3 2.3 4.7-4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.19em] text-white/75">PENRO Batanes</p>
              <p className="mt-0.5 text-sm font-semibold tracking-wide">ICT Inventory</p>
            </div>
          </div>

          <div className="relative max-w-lg py-14">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 shadow-[0_0_0_3px_rgba(167,243,208,0.18)]" />
              Equipment stewardship, made clear
            </div>
            <h1 className="max-w-md text-4xl font-semibold leading-[1.12] tracking-tight xl:text-[3.25rem]">
              Everything in its place.
              <span className="mt-2 block text-white/75">Every record in view.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/80">
              A trusted workspace for the equipment records, verification, and day-to-day work of the office.
            </p>

            <div className="mt-10 flex max-w-sm items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg shadow-emerald-950/10 backdrop-blur-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 7.5h16M6.5 4.5h11A2.5 2.5 0 0 1 20 7v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18V7a2.5 2.5 0 0 1 2.5-2.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M8 11h8M8 14.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">One office inventory</p>
                <p className="mt-1 text-xs leading-5 text-white/75">Clear records for equipment across PENRO Batanes.</p>
              </div>
            </div>
          </div>

          <p className="relative text-xs text-white/65">Provincial Environment and Natural Resources Office • Batanes</p>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-blue-600 text-white shadow-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4.75 8.25 12 4l7.25 4.25v7.5L12 20l-7.25-4.25v-7.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="m8.5 12.15 2.3 2.3 4.7-4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">PENRO Batanes</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">ICT Inventory</p>
              </div>
            </div>

            <div className="mb-7">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-800 dark:border-green-900/70 dark:bg-green-950/40 dark:text-green-300">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 1.7a.8.8 0 0 1 .45.14l5.3 3.54a.8.8 0 0 1 .36.67v4.2c0 3.72-2.31 6.35-5.75 8.02a.8.8 0 0 1-.7 0C6.22 16.6 3.9 13.97 3.9 10.25v-4.2a.8.8 0 0 1 .36-.67l5.3-3.54a.8.8 0 0 1 .44-.14Zm2.86 6.62a.8.8 0 1 0-1.22-1.04l-2.5 2.92-1.1-1.1a.8.8 0 0 0-1.13 1.13l1.72 1.71a.8.8 0 0 0 1.17-.04l3.06-3.58Z" clipRule="evenodd" />
                </svg>
                Authorized access
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-[1.8rem]">Sign in to your account</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">Enter your authorized account to continue to the inventory dashboard.</p>
            </div>

            <button
              type="button"
              onClick={() => void onGoogleSignIn()}
              disabled={isLoading}
              className="group flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              <GoogleMark />
              <span>{isLoading ? 'Signing you in…' : 'Continue with Google'}</span>
            </button>

            <div className="my-6 flex items-center gap-4" aria-hidden="true">
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">or use your account</span>
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email or username</label>
                <input
                  id="login-email"
                  name="emailOrUsername"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  disabled={isLoading}
                  placeholder="name@denr.gov.ph"
                  className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-green-600 focus:ring-4 focus:ring-green-600/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus:border-green-500 dark:focus:ring-green-500/10"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor="login-password" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Password</label>
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">Case-sensitive</span>
                </div>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  placeholder="Enter your password"
                  className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-green-600 focus:ring-4 focus:ring-green-600/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus:border-green-500 dark:focus:ring-green-500/10"
                />
              </div>

              {error ? (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-800 dark:border-red-900/70 dark:bg-red-950/35 dark:text-red-300">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 1.67a8.33 8.33 0 1 0 0 16.66 8.33 8.33 0 0 0 0-16.66ZM8.6 6.5a.9.9 0 0 1 1.8 0v3.36a.9.9 0 1 1-1.8 0V6.5Zm.9 7.12a1.02 1.02 0 1 0 0-2.04 1.02 1.02 0 0 0 0 2.04Z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-900/10 transition hover:from-green-700 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-65"
              >
                {isLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M3.75 10a.75.75 0 0 1 .75-.75h9.69L11.47 6.53a.75.75 0 0 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 1 1-1.06-1.06l2.72-2.72H4.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-start gap-2.5 border-t border-zinc-200 pt-5 text-xs leading-5 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.83 7.5V5.83a4.17 4.17 0 0 1 8.34 0V7.5a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-2.5 2.5H5.83a2.5 2.5 0 0 1-2.5-2.5v-5a2.5 2.5 0 0 1 2.5-2.5Zm1.67 0h5V5.83a2.5 2.5 0 0 0-5 0V7.5Z" clipRule="evenodd" />
              </svg>
              <p>This workspace is limited to authorized PENRO Batanes inventory administrators. Contact your system administrator if you need access.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
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
