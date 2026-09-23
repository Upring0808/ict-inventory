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

interface AuthContextValue {
  status: AuthStatus;
  profile: AuthProfile | null;
  isLoading: boolean;
  error: string | null;
  signInWithPassword: (emailOrUsername: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const LOGIN_ERROR_KEY = 'ict_inventory_login_error';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        if (typeof window !== 'undefined') window.sessionStorage.setItem(LOGIN_ERROR_KEY, message);
        setProfile(null);
        setStatus('unauthenticated');
        await clientRef.current?.auth.signOut();
        setError(message);
        return false;
      }

      const nextProfile = await response.json() as AuthProfile;
      setProfile(nextProfile);
      setError(null);
      setStatus('authenticated');
      return true;
    } catch {
      setProfile(null);
      setStatus('unavailable');
      setError('Could not validate this account. Check your connection and try again.');
      return false;
    }
  }, []);

  useEffect(() => {
    let active = true;
    try {
      const client = createBrowserClient();
      clientRef.current = client;
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        if (!active) return;
        if (event === 'SIGNED_OUT' || !session) {
          window.setTimeout(() => {
            if (active) void setSignedOutState();
          }, 0);
        } else if (event !== 'INITIAL_SESSION') {
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
        subscription.unsubscribe();
      };
    } catch (clientError) {
      const message = clientError instanceof Error ? clientError.message : 'Supabase is not configured.';
      window.setTimeout(() => { void setSignedOutState(message); }, 0);
      return () => { active = false; };
    }
  }, [setSignedOutState, validateSession]);

  const signInWithPassword = useCallback(async (emailOrUsername: string, password: string) => {
    setError(null);
    setIsLoading(true);
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
      if (!await validateSession(data.session)) throw new Error('This account is not authorized to use the dashboard.');
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Sign-in failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  }, [validateSession]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);
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
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : 'Google sign-in could not be started.');
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await clientRef.current?.auth.signOut();
    } finally {
      setProfile(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    profile,
    isLoading,
    error,
    signInWithPassword,
    signInWithGoogle,
    signOut,
    clearError: () => setError(null),
  }), [status, profile, isLoading, error, signInWithPassword, signInWithGoogle, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
