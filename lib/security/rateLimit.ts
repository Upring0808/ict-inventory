import 'server-only';

import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { createAdminClient } from '@/lib/auth/server';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  unavailable?: boolean;
}

function clientAddress(request: Request): string {
  // Vercel replaces this header at its edge. Ignore user-supplied forwarding
  // headers on other hosts; they otherwise let a caller rotate their IP key.
  if (process.env.VERCEL !== '1') return 'unknown';
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  return isIP(forwarded) ? forwarded : 'unknown';
}

async function consume(key: string, maximum: number, windowSeconds: number): Promise<RateLimitResult> {
  const { data, error } = await createAdminClient().rpc('consume_security_rate_limit', {
    p_key: key,
    p_maximum: maximum,
    p_window_seconds: windowSeconds,
  });
  if (error || !data || typeof data !== 'object') throw new Error('Rate limiting is unavailable.');
  const result = data as Record<string, unknown>;
  if (typeof result.allowed !== 'boolean' || typeof result.retry_after_seconds !== 'number') {
    throw new Error('Rate limiting returned an invalid response.');
  }
  return { allowed: result.allowed, retryAfterSeconds: result.retry_after_seconds };
}

/** Atomic, shared across Vercel instances. A missing limiter fails closed. */
export async function checkRateLimit(
  request: Request,
  scope: string,
  maximum: number,
  windowSeconds: number,
  identity?: string,
  identityMaximum = maximum,
): Promise<RateLimitResult> {
  try {
    const secret = process.env.INVENTORY_RATE_LIMIT_SECRET ||
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (!secret || secret.length < 32) throw new Error('Rate limit secret is missing.');
    const ip = clientAddress(request);
    const hash = (value: string) => createHmac('sha256', secret).update(`${scope}:${value}`).digest('hex');
    const byIp = await consume(hash(`ip:${ip}`), maximum, windowSeconds);
    if (!byIp.allowed || !identity) return byIp;
    return consume(hash(`identity:${identity.trim().toLowerCase()}`), identityMaximum, windowSeconds);
  } catch {
    return { allowed: false, retryAfterSeconds: 60, unavailable: true };
  }
}

export function rateLimitResponse(result: RateLimitResult): Response {
  if (result.unavailable) {
    return Response.json(
      { error: 'This request is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' } },
    );
  }
  const retryAfter = Math.max(1, Math.ceil(result.retryAfterSeconds));
  return Response.json(
    { error: 'Too many attempts. Please try again later.' },
    { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(retryAfter) } },
  );
}
