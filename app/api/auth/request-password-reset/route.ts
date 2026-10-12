import { createPublicAuthClient, normalizeEmail, validEmail } from '@/lib/auth/server';
import { readJsonObject } from '@/lib/security/input';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const email = typeof payload?.email === 'string' ? normalizeEmail(payload.email) : '';
  const limit = await checkRateLimit(request, 'password-reset-request', 10, 3600, email || undefined, 3);
  if (!limit.allowed) return rateLimitResponse(limit);
  if (email.length > 254 || !validEmail(email)) {
    return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const appOrigin = process.env.INVENTORY_APP_ORIGIN ||
    (process.env.VERCEL === '1' ? null : new URL(request.url).origin);
  try {
    if (!appOrigin) throw new Error('App origin is not configured.');
    const origin = new URL(appOrigin);
    if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname))) {
      throw new Error('Invalid app origin.');
    }
    const { error } = await createPublicAuthClient().auth.resetPasswordForEmail(email, {
      redirectTo: new URL('/auth/reset-password', origin).href,
    });
    if (error) throw error;
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Password recovery is temporarily unavailable.' }, { status: 503 });
  }
}
