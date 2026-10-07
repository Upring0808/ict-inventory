'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authorizedApiFetch, fetchAuthProfile, fetchWithTimeout, withDeadline } from '@/lib/auth/client';
import { createBrowserClient } from '@/lib/supabase/client';
import { LOCATION_MAX_AGE_MS, parseBrowserLocation, type BrowserLocation } from '@/lib/security/browserLocation';
import { requestBrowserLocation } from '@/lib/security/browserLocation.client';

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
  hasSession: boolean;
  profile: AuthProfile | null;
  loadingMethod: AuthLoadingMethod;
  error: string | null;
  signInWithPassword: (emailOrUsername: string, password: string, location: BrowserLocation) => Promise<void>;
  signInWithGoogle: (location: BrowserLocation) => Promise<void>;
  signOut: () => Promise<void>;
  retryAuthorization: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const LOGIN_ERROR_KEY = 'ict_inventory_login_error';
const PENDING_GOOGLE_LOCATION_KEY = 'ict_inventory_google_location';
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
  try {
    const message = window.sessionStorage.getItem(LOGIN_ERROR_KEY);
    if (message) window.sessionStorage.removeItem(LOGIN_ERROR_KEY);
    return message;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<ReturnType<typeof createBrowserClient> | null>(null);
  const operationRef = useRef(0);
  const signInAttemptRef = useRef(0);
  const tokenRef = useRef<string | null>(null);
  const locationRef = useRef<BrowserLocation | null>(null);
  const googleSignInInProgressRef = useRef(false);
  const pendingPasswordRef = useRef<PendingPasswordSession | null>(null);
  const pendingLoginErrorRef = useRef<string | null>(null);
  const profileRef = useRef<AuthProfile | null>(null);
  const statusRef = useRef<AuthStatus>('loading');
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [hasSession, setHasSession] = useState(false);
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
    profileRef.current = null;
    setProfile(null);
    setError(message);
    changeStatus('unavailable');
  }, [changeStatus]);

  const acceptSession = useCallback((session: Session, nextProfile: AuthProfile) => {
    ++operationRef.current;
    tokenRef.current = session.access_token;
    setHasSession(true);
    pendingLoginErrorRef.current = null;
    takeLoginError();
    pendingPasswordRef.current = null;
    profileRef.current = nextProfile;
    setProfile(nextProfile);
    setError(null);
    setLoadingMethod(null);
    changeStatus('authenticated');
  }, [changeStatus]);

  const resolveNoSession = useCallback(async (checkSetup: boolean) => {
    const operation = ++operationRef.current;
    setHasSession(false);
    // A settled login/setup screen should not disappear when an OAuth tab is
    // closed or this document becomes visible again without a new session.
    if (checkSetup && (statusRef.current === 'unauthenticated' || statusRef.current === 'setup_required')) {
      clearGoogleLoading();
      const loginError = takeLoginError() || pendingLoginErrorRef.current;
      pendingLoginErrorRef.current = null;
      if (loginError) setError(loginError);
      return;
    }
    tokenRef.current = null;
    locationRef.current = null;
    pendingPasswordRef.current = null;
    profileRef.current = null;
    setProfile(null);
    clearGoogleLoading();
    setError(takeLoginError() || pendingLoginErrorRef.current);
    pendingLoginErrorRef.current = null;
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
    if (googleSignInInProgressRef.current) return;
    setHasSession(true);
    const pending = pendingPasswordRef.current;
    if (pending?.accessToken === session.access_token && pending.profile.id === session.user.id) {
      acceptSession(session, pending.profile);
      return;
    }
    // SIGNED_IN also fires on tab focus. Repeated events for the same token
    // must not cancel an in-flight account check.
    if (!force && tokenRef.current === session.access_token &&
      (statusRef.current === 'loading' || statusRef.current === 'authenticated')) return;

    // Refocusing a tab can refresh the token for the same signed-in user.
    // Revalidate access in the background without unmounting the dashboard.
    const isRevalidation = statusRef.current === 'authenticated' &&
      profileRef.current?.id === session.user.id;
    const operation = ++operationRef.current;
    tokenRef.current = session.access_token;
    setError(null);
    if (!isRevalidation) {
      profileRef.current = null;
      setProfile(null);
      changeStatus('loading');
    }

    const verificationFailed = () => {
      if (operation !== operationRef.current) return;
      if (isRevalidation) {
        // A network failure is not a sign-out. Let the next auth event retry
        // this token while the last server-authorized profile stays visible.
        tokenRef.current = null;
      } else {
        showUnavailable(VERIFICATION_ERROR, operation);
      }
    };
    try {
      const response = await fetchAuthProfile(session.access_token);
      if (operation !== operationRef.current) return;
      if (response.status === 401 || response.status === 403) {
        const message = await responseError(response, 'This account is not authorized to use the inventory dashboard.');
        if (operation !== operationRef.current) return;
        pendingLoginErrorRef.current = message;
        try {
          window.sessionStorage.setItem(LOGIN_ERROR_KEY, message);
        } catch {
          // Keep the message in memory when browser storage is unavailable.
        }
        tokenRef.current = null;
        pendingPasswordRef.current = null;
        profileRef.current = null;
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
        verificationFailed();
        return;
      }
      const nextProfile = await response.json() as AuthProfile;
      if (operation !== operationRef.current) return;

      let pendingLocationRaw: string | null = null;
      try { pendingLocationRaw = window.sessionStorage.getItem(PENDING_GOOGLE_LOCATION_KEY); } catch { /* OAuth requires browser storage. */ }
      if (pendingLocationRaw || window.location.pathname === '/auth/completing') {
        let pendingLocation: BrowserLocation | null = null;
        try { pendingLocation = parseBrowserLocation(JSON.parse(pendingLocationRaw || 'null')); } catch { /* Invalid stored location. */ }
        if (!pendingLocation) {
          const message = 'Google sign-in needs a fresh browser location. Return to sign in and allow location again.';
          pendingLoginErrorRef.current = message;
          try { window.sessionStorage.setItem(LOGIN_ERROR_KEY, message); } catch { /* Keep the message in memory. */ }
          try { window.sessionStorage.removeItem(PENDING_GOOGLE_LOCATION_KEY); } catch { /* Browser storage may be unavailable. */ }
          try {
            await withDeadline(createBrowserClient().auth.signOut({ scope: 'local' }), 8_000);
            if (operation === operationRef.current) await resolveNoSession(false);
          } catch {
            showUnavailable('Could not clear a Google session without location. Please try again.', operation);
          }
          return;
        }
        const locationResponse = await fetchWithTimeout('/api/auth/presence', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'signed_in', location: pendingLocation }),
        }, 12_000);
        if (!locationResponse.ok) {
          showUnavailable(await responseError(locationResponse, 'Could not record your sign-in location. Please try again.'), operation);
          return;
        }
        if (operation !== operationRef.current) return;
        locationRef.current = pendingLocation;
        try { window.sessionStorage.removeItem(PENDING_GOOGLE_LOCATION_KEY); } catch { /* Session location is recorded. */ }
      }
      acceptSession(session, nextProfile);
    } catch {
      verificationFailed();
    }
  }, [acceptSession, changeStatus, resolveNoSession, showUnavailable]);

  const readInitialSession = useCallback(async (forceVerification = true) => {
    // A visibility check must not cancel a verification already in progress.
    const operation = forceVerification ? ++operationRef.current : operationRef.current;
    const isBackgroundRead = !forceVerification && statusRef.current === 'authenticated';
    const sessionReadFailed = (message: string) => {
      if (!isBackgroundRead) showUnavailable(message, operation);
    };
    try {
      const client = clientRef.current || createBrowserClient();
      clientRef.current = client;
      const { data, error: sessionError } = await withDeadline(client.auth.getSession(), 10_000);
      if (operation !== operationRef.current) return;
      if (sessionError) {
        sessionReadFailed('Your saved session could not be read. Please try again.');
      } else if (data.session) {
        // A manual retry must run even when this is the same token that failed
        // verification earlier. SIGNED_IN may have fired during getSession.
        void verifySession(data.session, forceVerification);
      } else {
        void resolveNoSession(statusRef.current !== 'authenticated');
      }
    } catch {
      sessionReadFailed('Your saved session could not be read. Please try again.');
    }
  }, [resolveNoSession, showUnavailable, verifySession]);

  useEffect(() => {
    const pageUrl = new URL(window.location.href);
    const callbackError = pageUrl.searchParams.get('auth_error');
    if (callbackError === 'google' || callbackError === 'browser') {
      const message = callbackError === 'browser'
        ? 'Google sign-in lost its browser session. Open the inventory in the same Chrome tab and try again.'
        : 'Google sign-in could not be completed. Please try again.';
      pendingLoginErrorRef.current = message;
      try { window.sessionStorage.removeItem(PENDING_GOOGLE_LOCATION_KEY); } catch { /* Browser storage may be unavailable. */ }
      pageUrl.searchParams.delete('auth_error');
      window.history.replaceState(null, '', `${pageUrl.pathname}${pageUrl.search}${pageUrl.hash}`);
    }

    let active = true;
    let receivedEvent = false;
    let receivedNonInitialEvent = false;
    let pageWasHidden = false;
    let resumeCheckTimer: number | null = null;
    const recheckOnResume = () => {
      clearGoogleLoading();
      if (resumeCheckTimer !== null) return;
      resumeCheckTimer = window.setTimeout(() => {
        resumeCheckTimer = null;
        if (active) void readInitialSession(false);
      }, 0);
    };
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      // Mobile Safari may restore the pre-OAuth login document from its
      // back/forward cache. Its React state is stale, so reconcile it with the
      // Supabase session saved by the callback before leaving the login screen.
      googleSignInInProgressRef.current = false;
      recheckOnResume();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pageWasHidden = true;
        return;
      }
      if (!pageWasHidden) return;
      pageWasHidden = false;
      recheckOnResume();
    };
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
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
        if (resumeCheckTimer !== null) window.clearTimeout(resumeCheckTimer);
        window.removeEventListener('pageshow', handlePageShow);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        subscription.unsubscribe();
      };
    } catch (clientError) {
      const operation = ++operationRef.current;
      showUnavailable(clientError instanceof Error ? clientError.message : 'Authentication is not configured.', operation);
      return () => {
        active = false;
        // This sequence counter must invalidate the latest pending operation.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        ++operationRef.current;
        window.clearTimeout(initialTimer);
        if (resumeCheckTimer !== null) window.clearTimeout(resumeCheckTimer);
        window.removeEventListener('pageshow', handlePageShow);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [clearGoogleLoading, readInitialSession, resolveNoSession, showUnavailable, verifySession]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let lastSentAt = 0;
    let lastLocationAttemptAt = locationRef.current?.capturedAt ?? 0;
    const recordPresence = async () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastSentAt < 20_000) return;
      lastSentAt = Date.now();
      if (Date.now() - lastLocationAttemptAt >= LOCATION_MAX_AGE_MS) {
        lastLocationAttemptAt = Date.now();
        try { locationRef.current = await requestBrowserLocation(); } catch { locationRef.current = null; }
      }
      const location = locationRef.current && parseBrowserLocation(locationRef.current);
      void authorizedApiFetch('/api/auth/presence', {
        method: 'POST',
        body: JSON.stringify({ event: 'seen', location }),
      }).catch(() => undefined);
    };
    recordPresence();
    const interval = window.setInterval(recordPresence, 60_000);
    window.addEventListener('focus', recordPresence);
    document.addEventListener('visibilitychange', recordPresence);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', recordPresence);
      document.removeEventListener('visibilitychange', recordPresence);
    };
  }, [status, profile?.id]);

  const retryAuthorization = useCallback(async () => {
    setError(null);
    changeStatus('loading');
    await readInitialSession();
  }, [changeStatus, readInitialSession]);

  const signInWithPassword = useCallback(async (emailOrUsername: string, password: string, location: BrowserLocation) => {
    if (!parseBrowserLocation(location)) {
      setError('Check your browser location again before signing in.');
      return;
    }
    const attempt = ++signInAttemptRef.current;
    ++operationRef.current;
    pendingLoginErrorRef.current = null;
    takeLoginError();
    try { window.sessionStorage.removeItem(PENDING_GOOGLE_LOCATION_KEY); } catch { /* Continue with password sign-in. */ }
    let credentialsAccepted = false;
    let acceptedToken: string | null = null;
    setError(null);
    setLoadingMethod('password');
    try {
      const response = await fetchWithTimeout('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password, location }),
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
      locationRef.current = location;
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
        locationRef.current = location;
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
      locationRef.current = null;
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

  const signInWithGoogle = useCallback(async (location: BrowserLocation) => {
    if (!parseBrowserLocation(location)) {
      setError('Check your browser location again before signing in.');
      return;
    }
    const attempt = ++signInAttemptRef.current;
    ++operationRef.current;
    googleSignInInProgressRef.current = true;
    pendingLoginErrorRef.current = null;
    takeLoginError();
    setError(null);
    clearGoogleLoading();
    setLoadingMethod('google');
    tokenRef.current = null;
    pendingPasswordRef.current = null;
    profileRef.current = null;
    setProfile(null);
    setHasSession(false);
    changeStatus('unauthenticated');
    try {
      try {
        window.sessionStorage.setItem(PENDING_GOOGLE_LOCATION_KEY, JSON.stringify(location));
      } catch {
        throw new Error('Google sign-in needs browser storage in this tab. Enable site storage and try again.');
      }
      const client = clientRef.current || createBrowserClient();
      clientRef.current = client;

      // A login screen can be restored from mobile browser history with an old
      // local session still cached. Clear it before choosing a Google identity
      // so the callback cannot leave the previous account active.
      const { data: sessionData, error: sessionReadError } = await withDeadline(client.auth.getSession(), 10_000);
      if (sessionReadError) throw sessionReadError;
      if (sessionData.session) {
        const { error: signOutError } = await withDeadline(
          client.auth.signOut({ scope: 'local' }),
          8_000
        );
        if (signOutError) throw signOutError;
      }
      if (attempt !== signInAttemptRef.current) return;

      tokenRef.current = null;
      pendingPasswordRef.current = null;
      profileRef.current = null;
      setProfile(null);
      setHasSession(false);
      if (statusRef.current !== 'unauthenticated') changeStatus('unauthenticated');
      setLoadingMethod('google');

      const { data, error: oauthError } = await withDeadline(client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
          skipBrowserRedirect: true,
        },
      }), 10_000);
      if (attempt !== signInAttemptRef.current) return;
      if (oauthError) throw oauthError;
      if (!data.url) throw new Error('Google sign-in could not be started. Please try again.');
      window.location.replace(data.url);
    } catch (oauthError) {
      if (attempt !== signInAttemptRef.current) return;
      try { window.sessionStorage.removeItem(PENDING_GOOGLE_LOCATION_KEY); } catch { /* Browser storage was unavailable. */ }
      googleSignInInProgressRef.current = false;
      setError(oauthError instanceof Error ? oauthError.message : 'Google sign-in could not be started.');
      clearGoogleLoading();
    }
  }, [changeStatus, clearGoogleLoading]);

  const signOut = useCallback(async () => {
    ++signInAttemptRef.current;
    ++operationRef.current;
    googleSignInInProgressRef.current = false;
    pendingPasswordRef.current = null;
    locationRef.current = null;
    clearGoogleLoading();
    profileRef.current = null;
    setProfile(null);
    changeStatus('loading');
    try {
      const client = clientRef.current || createBrowserClient();
      clientRef.current = client;
      const token = tokenRef.current;
      if (token) {
        await fetchWithTimeout('/api/auth/presence', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'ended' }),
        }, 2_000).catch(() => undefined);
      }
      const { error: signOutError } = await withDeadline(client.auth.signOut({ scope: 'local' }), 8_000);
      if (signOutError) throw signOutError;
      if (statusRef.current !== 'unauthenticated') await resolveNoSession(false);
    } catch {
      showUnavailable('Sign-out could not be completed. Check your connection and try again.', ++operationRef.current);
    }
  }, [changeStatus, clearGoogleLoading, resolveNoSession, showUnavailable]);

  const value = useMemo<AuthContextValue>(() => ({
    status, hasSession, profile, loadingMethod, error,
    signInWithPassword, signInWithGoogle, signOut, retryAuthorization,
    clearError: () => setError(null),
  }), [status, hasSession, profile, loadingMethod, error, signInWithPassword, signInWithGoogle, signOut, retryAuthorization]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
