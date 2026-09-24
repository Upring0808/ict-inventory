import { createBrowserClient } from '@/lib/supabase/client';

// Supabase Auth calls can wait on initialization or a remote request. Keep
// those waits finite so the UI can offer a retry instead of spinning forever.
export async function withDeadline<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: number | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error('Authentication took too long. Please try again.')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 8_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    // Keep the deadline active through the body, not only until the headers arrive.
    await response.clone().arrayBuffer();
    return response;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchAuthProfile(accessToken: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchWithTimeout('/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      }, 5_000);
      if (response.status < 500 || attempt === 1) return response;
    } catch (error) {
      lastError = error;
      if (attempt === 1) throw error;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)));
  }

  throw lastError instanceof Error ? lastError : new Error('Could not verify the sign-in session.');
}

export async function authorizedApiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data, error } = await withDeadline(createBrowserClient().auth.getSession(), 10_000);
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
