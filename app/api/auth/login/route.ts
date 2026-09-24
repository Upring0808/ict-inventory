import {
  createAdminClient,
  createPublicAuthClient,
  ensureAuthorizedIdentityLink,
  normalizeEmail,
  normalizeUsername,
} from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { emailOrUsername?: unknown; password?: unknown };
    const login = typeof payload.emailOrUsername === 'string' ? payload.emailOrUsername.trim() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';

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
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Password sign-in route could not reach Supabase:', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: 'Sign-in is temporarily unavailable.' }, { status: 503 });
  }
}
