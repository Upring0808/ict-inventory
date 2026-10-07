import {
  createAdminClient,
  createPublicAuthClient,
  ensureAuthorizedIdentityLink,
  normalizeEmail,
  normalizeUsername,
  verifiedSessionId,
} from '@/lib/auth/server';
import { recordAccountSession } from '@/lib/security/presence';
import { parseBrowserLocation } from '@/lib/security/browserLocation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json().catch(() => null) as unknown;
    if (!rawPayload || typeof rawPayload !== 'object') {
      return Response.json({ error: 'Invalid sign-in request.' }, { status: 400 });
    }
    const payload = rawPayload as { emailOrUsername?: unknown; password?: unknown; location?: unknown };
    const login = typeof payload.emailOrUsername === 'string' ? payload.emailOrUsername.trim() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';
    const location = parseBrowserLocation(payload.location);

    if (!location) {
      return Response.json({ error: 'Allow a fresh browser location before signing in.' }, { status: 400 });
    }

    if (!login || !password || login.length > 254 || password.length > 128) {
      return Response.json({ error: 'Invalid email/username or password.' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: accounts, error: accountError } = await admin
      .from('authorized_accounts')
      .select('id,email,username,full_name,auth_user_id')
      .limit(2);

    if (accountError) {
      return Response.json({ error: 'Sign-in is temporarily unavailable.' }, { status: 503 });
    }
    const isEmailLogin = login.includes('@');
    const normalizedLogin = isEmailLogin ? normalizeEmail(login) : normalizeUsername(login);
    const account = accounts?.find((candidate) => isEmailLogin
      ? normalizeEmail(candidate.email) === normalizedLogin
      : normalizeUsername(candidate.username) === normalizedLogin);
    if (!account) {
      return Response.json({ error: 'Invalid email/username or password.' }, { status: 401 });
    }

    const { data, error } = await createPublicAuthClient().auth.signInWithPassword({
      email: account.email,
      password,
    });

    if (error && error.status !== 400 && error.status !== 401 && error.status !== 403) {
      return Response.json({ error: 'Sign-in is temporarily unavailable. Please try again.' }, { status: 503 });
    }
    if (error || !data.session || !data.user?.email || normalizeEmail(data.user.email) !== normalizeEmail(account.email)) {
      return Response.json({ error: 'Invalid email/username or password.' }, { status: 401 });
    }

    // Repair missing or stale predefined links only after the password has
    // verified for this exact allowlisted email.
    if (data.user.id !== account.auth_user_id) {
      let linked = false;
      try {
        linked = await ensureAuthorizedIdentityLink(account.id, account.auth_user_id, data.user.id);
      } catch {
        console.error('Could not link an authorized account to its Auth identity.');
        return Response.json({ error: 'Sign-in is temporarily unavailable. Please try again.' }, { status: 503 });
      }
      if (!linked) {
        return Response.json({ error: 'This authorized account needs its sign-in identity repaired by an administrator.' }, { status: 409 });
      }
    }

    const metadata = data.user.user_metadata as Record<string, unknown> | null;
    const avatarUrl = typeof metadata?.avatar_url === 'string'
      ? metadata.avatar_url
      : typeof metadata?.picture === 'string' ? metadata.picture : null;

    try {
      await recordAccountSession({
        sessionId: verifiedSessionId(data.session.access_token, data.user.id),
        accountId: account.id,
        userId: data.user.id,
        name: account.full_name,
        email: normalizeEmail(data.user.email),
      }, request, 'signed_in', location);
    } catch {
      console.error('Could not record the password sign-in session.');
      return Response.json({ error: 'Could not record your sign-in location. Apply the latest database schema and try again.' }, { status: 503 });
    }

    return Response.json(
      {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        profile: {
          id: data.user.id,
          email: normalizeEmail(data.user.email),
          name: account.full_name,
          avatarUrl,
        },
      },
      { headers: { 'Cache-Control': 'no-store', 'Accept-CH': 'Sec-CH-UA-Model, Sec-CH-UA-Platform, Sec-CH-UA-Mobile' } }
    );
  } catch (error) {
    console.error('Password sign-in route could not reach Supabase:', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: 'Sign-in is temporarily unavailable.' }, { status: 503 });
  }
}
