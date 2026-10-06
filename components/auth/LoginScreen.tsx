'use client';

import Image from 'next/image';
import { useEffect, useState, type FormEvent } from 'react';
import { AppBrand } from '@/components/branding/AppBrand';
import { withDeadline } from '@/lib/auth/client';
import { createBrowserClient } from '@/lib/supabase/client';
import styles from './LoginScreen.module.css';

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      const invitedEmail = url.searchParams.get('login_email');
      if (!invitedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitedEmail)) return;
      setEmailOrUsername(invitedEmail);
      url.searchParams.delete('login_email');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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
    const email = String(formData.get('forgotEmail') ?? '').trim().toLowerCase();

    try {
      const { error: resetError } = await withDeadline(
        createBrowserClient().auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }),
        12_000
      );
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
    <main className={styles.canvas}>
      <div className={styles.canvasIdentity} aria-hidden="true">
        <Image
          src="/brand/eco-inventory-mark.webp"
          alt=""
          width={680}
          height={680}
          loading="eager"
          className={styles.canvasMark}
        />
      </div>
      <section className={styles.shell} aria-label="PENRO Batanes ICT Inventory">
        <aside className={styles.photoPanel} aria-label="About the inventory workspace">
          <Image
            src="/auth/island-shoreline.webp"
            alt=""
            fill
            priority
            sizes="(max-width: 900px) 100vw, 55vw"
            className={styles.coastline}
          />
          <div className={styles.photoShade} aria-hidden="true" />
          <p className={styles.photoTopline}>PENRO Batanes</p>
          <div className={styles.photoBody}>
        
            <p className={styles.photoHeading}>A clearer view of every asset.</p>
            <p className={styles.photoDescription}>Track equipment with confidence and care for the resources behind every day of work.</p>
            <span className={styles.photoRule} aria-hidden="true" />
          </div>
        </aside>

        <div className={styles.formPanel}>
          <svg className={styles.curve} viewBox="0 0 134 700" preserveAspectRatio="none" aria-hidden="true">
            <path d="M134 0H112C100 75 39 145 57 215c16 62 78 98 73 166-6 77-76 104-79 178-3 66 31 108 77 141h6V0Z" />
          </svg>
          <Image
            src="/brand/eco-inventory-mark.webp"
            alt=""
            width={440}
            height={440}
            loading="eager"
            className={styles.watermark}
            aria-hidden="true"
          />

          <div className={styles.formInner}>
            <header>
              <AppBrand
                organizationClassName={styles.brandSmall}
                nameClassName={styles.brandName}
                markClassName={styles.brandMark}
                className={styles.brand}
              />
            </header>

            {view === 'sign-in' ? (
              <div className={styles.content}>
                
                <h1 className={styles.heading}>Welcome back.</h1>
                <p className={styles.subheading}>Sign in to manage ICT equipment and keep every record in view.</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.field}>
                    <label htmlFor="login-email" className={styles.label}>Email or username</label>
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
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.field}>
                    <div className={styles.passwordLabelRow}>
                      <label htmlFor="login-password" className={styles.label}>Password</label>
                      <button type="button" onClick={openForgotPassword} disabled={isBusy} className={styles.textButton}>Forgot password?</button>
                    </div>
                    <div className={styles.inputWrap}>
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        disabled={isBusy}
                        placeholder="Enter your password"
                        className={`${styles.input} ${styles.passwordInput}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        disabled={isBusy}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        className={styles.showButton}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  {error ? <AuthMessage kind="error">{error}</AuthMessage> : null}

                  <button type="submit" disabled={isBusy} aria-busy={activeLoadingMethod === 'password'} className={styles.primaryButton}>
                    {activeLoadingMethod === 'password' ? <LoadingSpinner /> : null}
                    <span>{activeLoadingMethod === 'password' ? 'Signing in…' : 'Sign in'}</span>
                  </button>
                </form>

                <div className={styles.divider} aria-hidden="true">or continue with</div>
                <button
                  type="button"
                  onClick={() => void onGoogleSignIn()}
                  disabled={isBusy}
                  aria-busy={activeLoadingMethod === 'google'}
                  className={styles.googleButton}
                >
                  {activeLoadingMethod === 'google' ? <LoadingSpinner /> : <GoogleMark />}
                  <span>{activeLoadingMethod === 'google' ? 'Connecting to Google…' : 'Google'}</span>
                </button>
              </div>
            ) : (
              <div className={styles.content}>
                <button type="button" onClick={returnToSignIn} disabled={isForgotSubmitting} className={styles.resetBack}>
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="m11.75 4.75-5.25 5.25 5.25 5.25M6.5 10h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Back to sign in
                </button>
                <p className={styles.eyebrow}>Account recovery</p>
                <h1 className={styles.heading}>Reset your password.</h1>
                <p className={styles.subheading}>Enter your account email and we’ll send reset instructions if it is eligible.</p>

                <form onSubmit={handleForgotSubmit} className={styles.form}>
                  <div className={styles.field}>
                    <label htmlFor="forgot-email" className={styles.label}>Email address</label>
                    <input
                      id="forgot-email"
                      name="forgotEmail"
                      type="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={254}
                      required
                      disabled={isForgotSubmitting}
                      value={forgotEmail}
                      onChange={(event) => setForgotEmail(event.target.value)}
                      placeholder="name@denr.gov.ph"
                      className={styles.input}
                    />
                  </div>
                  {forgotError ? <AuthMessage kind="error">{forgotError}</AuthMessage> : null}
                  {forgotNotice ? <AuthMessage kind="success">{forgotNotice}</AuthMessage> : null}
                  <button type="submit" disabled={isForgotSubmitting} aria-busy={isForgotSubmitting} className={styles.primaryButton}>
                    {isForgotSubmitting ? <LoadingSpinner /> : null}
                    <span>{isForgotSubmitting ? 'Sending instructions…' : 'Send reset instructions'}</span>
                  </button>
                </form>
              </div>
            )}

            <p className={styles.legal}>
              {view === 'sign-in'
                ? 'This workspace is limited to authorized PENRO Batanes inventory administrators.'
                : 'For account security, the response won’t confirm whether an email is registered.'}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function AuthMessage({ children, kind }: { children: string; kind: 'error' | 'success' }) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`${styles.message} ${styles[kind]}`}>
      {children}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.66 17.74 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.47-4.74 7.16l7.66 5.94c4.47-4.13 7.12-10.2 7.12-17.57Z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.92 23.92 0 0 0 0 21.56l7.98-6.19Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.88l-7.66-5.94c-2.13 1.43-4.86 2.27-8.25 2.27-6.26 0-11.57-4.16-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle opacity="0.25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path opacity="0.9" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
