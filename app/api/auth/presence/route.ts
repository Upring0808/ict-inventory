import { createPublicAuthClient, getAuthorizedActor } from '@/lib/auth/server';
import { recordAccountSession } from '@/lib/security/presence';

export const dynamic = 'force-dynamic';

const responseHeaders = {
  'Cache-Control': 'no-store',
  'Accept-CH': 'Sec-CH-UA-Model, Sec-CH-UA-Platform, Sec-CH-UA-Mobile',
};

export async function POST(request: Request) {
  try {
    const actor = await getAuthorizedActor(request);
    if (!actor) return Response.json({ error: 'Sign in with an authorized account to continue.' }, { status: 401 });
    if (!actor.sessionId) return Response.json({ error: 'This sign-in has no verifiable session ID.' }, { status: 422 });

    const payload = await request.json().catch(() => null) as unknown;
    const event = payload && typeof payload === 'object' && 'event' in payload ? payload.event : null;
    if (event !== 'seen' && event !== 'ended') {
      return Response.json({ error: 'Invalid session event.' }, { status: 400 });
    }

    if (event === 'ended') {
      const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
      const { error } = await createPublicAuthClient().auth.admin.signOut(token, 'local');
      if (error) return Response.json({ error: 'Could not complete sign-out.' }, { status: 503 });
    }
    await recordAccountSession({
      sessionId: actor.sessionId,
      accountId: actor.accountId,
      userId: actor.id,
      name: actor.name,
      email: actor.email,
    }, request, event);
    return Response.json({ ok: true }, { headers: responseHeaders });
  } catch {
    return Response.json({ error: 'Could not record this session.' }, { status: 503 });
  }
}
