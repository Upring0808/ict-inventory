import { createBrowserClient } from '@/lib/supabase/client';

export async function fetchAuthProfile(accessToken: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });
      if (response.status < 500 || attempt === 2) return response;
    } catch (error) {
      lastError = error;
      if (attempt === 2) throw error;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)));
  }

  throw lastError instanceof Error ? lastError : new Error('Could not verify the sign-in session.');
}

export async function authorizedApiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data, error } = await createBrowserClient().auth.getSession();
  if (error || !data.session) throw new Error('Your sign-in session has expired. Sign in again.');

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${data.session.access_token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  return fetch(path, { ...init, headers, cache: 'no-store' });
}

export async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json() as { error?: unknown };
    return typeof payload.error === 'string' ? payload.error : fallback;
  } catch {
    return fallback;
  }
}
