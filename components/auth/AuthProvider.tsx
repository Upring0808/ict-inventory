'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { fetchAuthProfile, fetchWithTimeout, withDeadline } from '@/lib/auth/client';
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
  retryAuthorization: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const LOGIN_ERROR_KEY = 'ict_inventory_login_error';
const VERIFICATION_ERROR = 'Your account could not be checked right now. Please try again.';
type PendingPasswordSession = { accessToken: string; profile: AuthProfile };

async function responseError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json() as { error?: unknown };
    return typeof payload.error === 'string' ? payload.error : fallback;
  } catch {
    return fallback;
  }
}

function takeLoginError(): string | null {
  const message = window.sessionStorage.getItem(LOGIN_ERROR_KEY);
  if (message) window.sessionStorage.removeItem(LOGIN_ERROR_KEY);
  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<ReturnType<typeof createBrowserClient> | null>(null);
  const operationRef = useRef(0);
  const signInAttemptRef = useRef(0);
  const tokenRef = useRef<string | null>(null);
  const pendingPasswordRef = useRef<PendingPasswordSession | null>(null);
  const statusRef = useRef<AuthStatus>('loading');
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loadingMethod, setLoadingMethod] = useState<AuthLoadingMethod>(null);
  const [error, setError] = useState<string | null>(null);
  const googleLoadingTimerRef = useRef<number | null>(null);

  const changeStatus = useCallback((next: AuthStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const clearGoogleLoading = useCallback(() => {
    if (googleLoadingTimerRef.current !== null) {
      window.clearTimeout(googleLoadingTimerRef.current);
      googleLoadingTimerRef.current = null;
    }
    setLoadingMethod((current) => current === 'google' ? null : current);
  }, []);

  const showUnavailable = useCallback((message: string, operation: number) => {
    if (operation !== operationRef.current) return;
    setProfile(null);
    setError(message);
    changeStatus('unavailable');
  }, [changeStatus]);

  const acceptSession = useCallback((session: Session, nextProfile: AuthProfile) => {
    ++operationRef.current;
    tokenRef.current = session.access_token;
    pendingPasswordRef.current = null;
    setProfile(nextProfile);
    setError(null);
    setLoadingMethod(null);
    changeStatus('authenticated');
  }, [changeStatus]);

  const resolveNoSession = useCallback(async (checkSetup: boolean) => {
    const operation = ++operationRef.current;
    tokenRef.current = null;
    pendingPasswordRef.current = null;
    setProfile(null);
    clearGoogleLoading();
    setError(takeLoginError());
    if (!checkSetup) {
      changeStatus('unauthenticated');
      return;
    }

    changeStatus('loading');
    try {
      const response = await fetchWithTimeout('/api/auth/status', { cache: 'no-store' }, 8_000);
      if (operation !== operationRef.current) return;
      if (!response.ok) {
        showUnavailable(await responseError(response, 'Authentication is temporarily unavailable.'), operation);
        return;
      }
      const result = await response.json() as { setupRequired?: boolean };
      if (operation === operationRef.current) changeStatus(result.setupRequired ? 'setup_required' : 'unauthenticated');
    } catch {
      showUnavailable('Could not connect to the authentication service. Check your connection and try again.', operation);
    }
  }, [changeStatus, clearGoogleLoading, showUnavailable]);

  const verifySession = useCallback(async (session: Session, force = false) => {
    const pending = pendingPasswordRef.current;
    if (pending?.accessToken === session.access_token && pending.profile.id === session.user.id) {
      acceptSession(session, pending.profile);
      return;
    }
    // SIGNED_IN also fires on tab focus. Repeated events for the same token
    // must not cancel an in-flight account check.
    if (!force && tokenRef.current === session.access_token &&
      (statusRef.current === 'loading' || statusRef.current === 'authenticated')) return;

    const operation = ++operationRef.current;
    tokenRef.current = session.access_token;
    setProfile(null);
    setError(null);
    changeStatus('loading');
    try {
      const response = await fetchAuthProfile(session.access_token);
      if (operation !== operationRef.current) return;
      if (response.status === 401 || response.status === 403) {
        const message = await responseError(response, 'This account is not authorized to use the inventory dashboard.');
        if (operation !== operationRef.current) return;
        window.sessionStorage.setItem(LOGIN_ERROR_KEY, message);
        tokenRef.current = null;
        pendingPasswordRef.current = null;
        setProfile(null);
        changeStatus('loading');
        // Do not expose the login form until the rejected session is cleared:
        // a late SIGNED_OUT could otherwise erase a newly saved login.
        try {
          const { error: signOutError } = await withDeadline(
            createBrowserClient().auth.signOut({ scope: 'local' }), 8_000
          );
          if (signOutError) throw signOutError;
          if (operation === operationRef.current) await resolveNoSession(false);
        } catch {
          showUnavailable('Could not clear the rejected session. Please try again.', operation);
        }
        return;
      }
      if (!response.ok) {
        showUnavailable(VERIFICATION_ERROR, operation);
        return;
      }
      const nextProfile = await response.json() as AuthProfile;
      if (operation === operationRef.current) acceptSession(session, nextProfile);
    } catch {
      showUnavailable(VERIFICATION_ERROR, operation);
    }
  }, [acceptSession, changeStatus, resolveNoSession, showUnavailable]);

  const readInitialSession = useCallback(async () => {
    const operation = ++operationRef.current;
    try {
      const client = clientRef.current || createBrowserClient();
      clientRef.current = client;
      const { data, error: sessionError } = await withDeadline(client.auth.getSession(), 10_000);
      if (operation !== operationRef.current) return;
      if (sessionError) {
        showUnavailable('Your saved session could not be read. Please try again.', operation);
      } else if (data.session) {
        // A manual retry must run even when this is the same token that failed
        // verification earlier. SIGNED_IN may have fired during getSession.
        void verifySession(data.session, true);
      } else {
        void resolveNoSession(true);
      }
    } catch {
      showUnavailable('Your saved session could not be read. Please try again.', operation);
    }
  }, [resolveNoSession, showUnavailable, verifySession]);

  useEffect(() => {
    // The callback exchanges the OAuth code. This page verifies it once after
    // the redirect to /, avoiding duplicate checks during navigation.
    if (window.location.pathname === '/auth/callback') return;

    let active = true;
    let receivedEvent = false;
    let receivedNonInitialEvent = false;
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) clearGoogleLoading();
    };
    window.addEventListener('pageshow', handlePageShow);
    const initialTimer = window.setTimeout(() => {
      if (!active || receivedEvent) return;
      const operation = ++operationRef.current;
      showUnavailable('Your session check took too long. Please try again.', operation);
    }, 12_000);

    try {
      const client = createBrowserClient();
      clientRef.current = client;
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        if (!active || (event === 'INITIAL_SESSION' && receivedNonInitialEvent)) return;
        if (event !== 'INITIAL_SESSION') receivedNonInitialEvent = true;
        receivedEvent = true;
        window.clearTimeout(initialTimer);
        if (event === 'INITIAL_SESSION' && !session) {
          // Supabase also reports null when reading a stored session fails.
          void readInitialSession();
        } else if (event === 'SIGNED_OUT' || !session) {
          void resolveNoSession(false);
        } else {
          void verifySession(session, event === 'USER_UPDATED');
        }
      });
      return () => {
        active = false;
        ++operationRef.current;
        window.clearTimeout(initialTimer);
        window.removeEventListener('pageshow', handlePageShow);
        subscription.unsubscribe();
      };
    } catch (clientError) {
      const operation = ++operationRef.current;
      showUnavailable(clientError instanceof Error ? clientError.message : 'Authentication is not configured.', operation);
      return () => {
        active = false;
        ++operationRef.current;
        window.clearTimeout(initialTimer);
        window.removeEventListener('pageshow', handlePageShow);
      };
    }
  }, [clearGoogleLoading, readInitialSession, resolveNoSession, showUnavailable, verifySession]);

  const retryAuthorization = useCallback(async () => {
    setError(null);
    changeStatus('loading');
    await readInitialSession();
  }, [changeStatus, readInitialSession]);

  const signInWithPassword = useCallback(async (emailOrUsername: string, password: string) => {
    const attempt = ++signInAttemptRef.current;
    ++operationRef.current;
    let credentialsAccepted = false;
    let acceptedToken: string | null = null;
    setError(null);
    setLoadingMethod('password');
    try {
      const response = await fetchWithTimeout('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      }, 15_000);
      if (!response.ok) throw new Error(await responseError(response, 'Invalid email/username or password.'));

      const result = await response.json() as {
        access_token: string;
        refresh_token: string;
        profile: AuthProfile;
      };
      if (!result.access_token || !result.refresh_token || !result.profile?.id) {
        throw new Error('The sign-in response was incomplete. Please try again.');
      }
      credentialsAccepted = true;
      acceptedToken = result.access_token;
      pendingPasswordRef.current = { accessToken: result.access_token, profile: result.profile };
      const client = clientRef.current || createBrowserClient();
      clientRef.current = client;
      const { data, error: sessionError } = await withDeadline(client.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      }), 12_000);
      if (attempt !== signInAttemptRef.current) return;
      if (sessionError || !data.session || data.session.user.id !== result.profile.id) {
        throw new Error('Your session could not be saved. Please try again.');
      }
      if (statusRef.current !== 'authenticated' || tokenRef.current !== data.session.access_token) {
        acceptSession(data.session, result.profile);
      }
    } catch (signInError) {
      if (attempt !== signInAttemptRef.current) return;
      pendingPasswordRef.current = null;
      const message = signInError instanceof Error && signInError.name === 'AbortError'
        ? 'Sign-in took too long. Check your connection and try again.'
        : signInError instanceof Error ? signInError.message : 'Sign-in failed. Please try again.';
      if (credentialsAccepted && statusRef.current === 'authenticated' && tokenRef.current === acceptedToken) {
        return;
      }
      if (credentialsAccepted) {
        showUnavailable(message, ++operationRef.current);
      } else {
        setError(message);
      }
    } finally {
      if (attempt === signInAttemptRef.current) {
        setLoadingMethod((current) => current === 'password' ? null : current);
      }
    }
  }, [acceptSession, showUnavailable]);

  const signInWithGoogle = useCallback(async () => {
    ++signInAttemptRef.current;
    setError(null);
    clearGoogleLoading();
    setLoadingMethod('google');
    try {
      const client = clientRef.current || createBrowserClient();
      clientRef.current = client;
      const { error: oauthError } = await withDeadline(client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      }), 10_000);
      if (oauthError) throw oauthError;
      googleLoadingTimerRef.current = window.setTimeout(clearGoogleLoading, 15_000);
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : 'Google sign-in could not be started.');
      clearGoogleLoading();
    }
  }, [clearGoogleLoading]);

  const signOut = useCallback(async () => {
    ++signInAttemptRef.current;
    ++operationRef.current;
    pendingPasswordRef.current = null;
    clearGoogleLoading();
    setProfile(null);
    changeStatus('loading');
    try {
      const client = clientRef.current || createBrowserClient();
      clientRef.current = client;
      const { error: signOutError } = await withDeadline(client.auth.signOut({ scope: 'local' }), 8_000);
      if (signOutError) throw signOutError;
      if (statusRef.current !== 'unauthenticated') await resolveNoSession(false);
    } catch {
      showUnavailable('Sign-out could not be completed. Check your connection and try again.', ++operationRef.current);
    }
  }, [changeStatus, clearGoogleLoading, resolveNoSession, showUnavailable]);

  const value = useMemo<AuthContextValue>(() => ({
    status, profile, loadingMethod, error,
    signInWithPassword, signInWithGoogle, signOut, retryAuthorization,
    clearError: () => setError(null),
  }), [status, profile, loadingMethod, error, signInWithPassword, signInWithGoogle, signOut, retryAuthorization]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
