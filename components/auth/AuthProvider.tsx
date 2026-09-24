'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabase/client';

export interface AuthProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'setup_required' | 'unavailable';
export type AuthLoadingMethod = 'password' | 'google' | null;

interface AuthContextValue {
  status: AuthStatus;
  profile: AuthProfile | null;
  loadingMethod: AuthLoadingMethod;
  error: string | null;
  signInWithPassword: (emailOrUsername: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const LOGIN_ERROR_KEY = 'ict_inventory_login_error';

type SessionValidation = 'authorized' | 'rejected' | 'unavailable';

async function responseError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json() as { error?: unknown };
    return typeof payload.error === 'string' ? payload.error : fallback;
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<ReturnType<typeof createBrowserClient> | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loadingMethod, setLoadingMethod] = useState<AuthLoadingMethod>(null);
  const [error, setError] = useState<string | null>(null);
  const googleLoadingTimerRef = useRef<number | null>(null);

  const clearGoogleLoading = useCallback(() => {
    if (googleLoadingTimerRef.current !== null) {
      window.clearTimeout(googleLoadingTimerRef.current);
      googleLoadingTimerRef.current = null;
    }
    setLoadingMethod((current) => current === 'google' ? null : current);
  }, []);

  const setSignedOutState = useCallback(async (configurationError?: string) => {
    setProfile(null);
    if (typeof window !== 'undefined') {
      const pendingError = window.sessionStorage.getItem(LOGIN_ERROR_KEY);
      if (pendingError) {
        setError(pendingError);
        window.sessionStorage.removeItem(LOGIN_ERROR_KEY);
      }
    }

    if (configurationError) {
      setError(configurationError);
      setStatus('unavailable');
      return;
    }

    try {
      const response = await fetch('/api/auth/status', { cache: 'no-store' });
      if (!response.ok) {
        setError(await responseError(response, 'Authentication is not configured.'));
        setStatus('unavailable');
        return;
      }
      const result = await response.json() as { setupRequired?: boolean };
      setStatus(result.setupRequired ? 'setup_required' : 'unauthenticated');
    } catch {
      setError('Could not connect to the authentication service. Check your connection and try again.');
      setStatus('unavailable');
    }
  }, []);

  const validateSession = useCallback(async (session: Session) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      if (!response.ok) {
        const message = await responseError(response, 'This Google account is not on the authorized account list.');
        if (response.status !== 401 && response.status !== 403) {
          setProfile(null);
          setStatus('unauthenticated');
          setError('The sign-in service could not verify your account just now. Please try again.');
          return 'unavailable' satisfies SessionValidation;
        }
        if (typeof window !== 'undefined') window.sessionStorage.setItem(LOGIN_ERROR_KEY, message);
        setProfile(null);
        setStatus('unauthenticated');
        await clientRef.current?.auth.signOut();
        setError(message);
        return 'rejected' satisfies SessionValidation;
      }

      const nextProfile = await response.json() as AuthProfile;
      setProfile(nextProfile);
      setError(null);
      setStatus('authenticated');
      return 'authorized' satisfies SessionValidation;
    } catch {
      setProfile(null);
      setStatus('unauthenticated');
      setError('Could not validate your account right now. Check your connection and try again.');
      return 'unavailable' satisfies SessionValidation;
    }
  }, []);

  useEffect(() => {
    let active = true;
    const handlePageShow = (event: PageTransitionEvent) => {
      // A page restored from the back-forward cache keeps its React state.
      // Clear the pending OAuth state so the user can choose another method.
      if (event.persisted) clearGoogleLoading();
    };
    window.addEventListener('pageshow', handlePageShow);
    try {
      const client = createBrowserClient();
      clientRef.current = client;
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        if (!active) return;
        if (event === 'SIGNED_OUT' || !session) {
          clearGoogleLoading();
          window.setTimeout(() => {
            if (active) void setSignedOutState();
          }, 0);
        } else if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') {
          // Password sign-in validates explicitly after setSession. OAuth
          // validates on its callback page and again on the root page load.
          // Skipping SIGNED_IN here prevents duplicate, racing checks.
          window.setTimeout(() => {
            if (active) void validateSession(session);
          }, 0);
        }
      });

      void client.auth.getSession().then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) {
          void setSignedOutState('Your sign-in session could not be read. Sign in again.');
        } else if (data.session) {
          void validateSession(data.session);
        } else {
          void setSignedOutState();
        }
      });

      return () => {
        active = false;
        window.removeEventListener('pageshow', handlePageShow);
        subscription.unsubscribe();
      };
    } catch (clientError) {
      const message = clientError instanceof Error ? clientError.message : 'Supabase is not configured.';
      window.setTimeout(() => { void setSignedOutState(message); }, 0);
      return () => {
        active = false;
        window.removeEventListener('pageshow', handlePageShow);
      };
    }
  }, [clearGoogleLoading, setSignedOutState, validateSession]);

  const signInWithPassword = useCallback(async (emailOrUsername: string, password: string) => {
    setError(null);
    setLoadingMethod('password');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      });
      if (!response.ok) throw new Error(await responseError(response, 'Invalid email/username or password.'));

      const tokens = await response.json() as { access_token: string; refresh_token: string };
      const client = clientRef.current || createBrowserClient();
      clientRef.current = client;
      const { data, error: sessionError } = await client.auth.setSession(tokens);
      if (sessionError || !data.session) throw new Error('Sign-in could not be completed. Try again.');
      const validation = await validateSession(data.session);
      if (validation === 'rejected') throw new Error('This account is not authorized to use the dashboard.');
      if (validation === 'unavailable') throw new Error('Your credentials were accepted, but access could not be checked right now. Please try signing in again.');
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Sign-in failed. Try again.');
    } finally {
      setLoadingMethod((current) => current === 'password' ? null : current);
    }
  }, [validateSession]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    clearGoogleLoading();
    setLoadingMethod('google');
    try {
      const client = clientRef.current || createBrowserClient();
      clientRef.current = client;
      const { error: oauthError } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (oauthError) throw oauthError;
      // OAuth should navigate away immediately. This fallback recovers the
      // login form if the redirect is blocked or the provider never opens.
      googleLoadingTimerRef.current = window.setTimeout(clearGoogleLoading, 15_000);
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : 'Google sign-in could not be started.');
      clearGoogleLoading();
    }
  }, [clearGoogleLoading]);

  const signOut = useCallback(async () => {
    setError(null);
    clearGoogleLoading();
    try {
      await clientRef.current?.auth.signOut();
    } finally {
      setProfile(null);
      setStatus('unauthenticated');
    }
  }, [clearGoogleLoading]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    profile,
    loadingMethod,
    error,
    signInWithPassword,
    signInWithGoogle,
    signOut,
    clearError: () => setError(null),
  }), [status, profile, loadingMethod, error, signInWithPassword, signInWithGoogle, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
