import {
  createAdminClient,
  createPublicAuthClient,
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
    const query = admin
      .from('authorized_accounts')
      .select('email,auth_user_id')
      .limit(1);
    const { data: account, error: accountError } = login.includes('@')
      ? await query.eq('email', normalizeEmail(login)).maybeSingle()
      : await query.eq('username', normalizeUsername(login)).maybeSingle();

    if (accountError) {
      return Response.json({ error: 'Sign-in is temporarily unavailable.' }, { status: 503 });
    }
    if (!account) {
      return Response.json({ error: 'Invalid email/username or password.' }, { status: 401 });
    }

    const { data, error } = await createPublicAuthClient().auth.signInWithPassword({
      email: account.email,
      password,
    });

    if (error || !data.session || data.user.id !== account.auth_user_id) {
      return Response.json({ error: 'Invalid email/username or password.' }, { status: 401 });
    }

    return Response.json(
      {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json({ error: 'Sign-in is temporarily unavailable.' }, { status: 503 });
  }
}
