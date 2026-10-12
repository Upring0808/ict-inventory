import { createAdminClient, getAuthorizedActor } from '@/lib/auth/server';
import { recordAccountSession } from '@/lib/security/presence';
import { parseBrowserLocation } from '@/lib/security/browserLocation';
import { readJsonObject } from '@/lib/security/input';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

const responseHeaders = {
  'Cache-Control': 'no-store',
  'Accept-CH': 'Sec-CH-UA-Platform, Sec-CH-UA-Mobile',
};

export async function POST(request: Request) {
  try {
    const actor = await getAuthorizedActor(request);
    if (!actor) return Response.json({ error: 'Sign in with an authorized account to continue.' }, { status: 401 });
    if (!actor.sessionId) return Response.json({ error: 'This sign-in has no verifiable session ID.' }, { status: 422 });
    const limit = await checkRateLimit(request, 'presence', 600, 900, actor.id, 300);
    if (!limit.allowed) return rateLimitResponse(limit);

    const payload = await readJsonObject(request);
    const event = payload?.event;
    if (event !== 'signed_in' && event !== 'seen' && event !== 'ended') {
      return Response.json({ error: 'Invalid session event.' }, { status: 400 });
    }
    const rawLocation = payload?.location ?? null;
    const location = rawLocation === null ? null : parseBrowserLocation(rawLocation);
    if ((event === 'signed_in' && !location) || (rawLocation !== null && !location)) {
      return Response.json({ error: 'Allow a fresh browser location before signing in.' }, { status: 400 });
    }

    if (event === 'ended') {
      const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
      const { error } = await createAdminClient().auth.admin.signOut(token, 'local');
      if (error) return Response.json({ error: 'Could not complete sign-out.' }, { status: 503 });
    }
    await recordAccountSession({
      sessionId: actor.sessionId,
      accountId: actor.accountId,
      userId: actor.id,
      name: actor.name,
      email: actor.email,
    }, request, event, location);
    return Response.json({ ok: true }, { headers: responseHeaders });
  } catch {
    return Response.json({ error: 'Could not record this session.' }, { status: 503 });
  }
}
