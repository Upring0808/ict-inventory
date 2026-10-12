import { createHash, timingSafeEqual } from 'node:crypto';
import {
  createAdminClient,
  normalizeEmail,
  normalizeUsername,
  validEmail,
  validPassword,
  deleteAuthUser,
} from '@/lib/auth/server';
import { readJsonObject } from '@/lib/security/input';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

function secretsMatch(expected: string, received: string): boolean {
  const expectedDigest = createHash('sha256').update(expected).digest();
  const receivedDigest = createHash('sha256').update(received).digest();
  return timingSafeEqual(expectedDigest, receivedDigest);
}

export async function POST(request: Request) {
  try {
    const limit = await checkRateLimit(request, 'setup', 5, 3600, 'bootstrap', 100);
    if (!limit.allowed) return rateLimitResponse(limit);

    const admin = createAdminClient();
    const { count, error: countError } = await admin
      .from('authorized_accounts')
      .select('id', { count: 'exact', head: true });
    if (countError) return Response.json({ error: 'The inventory database is not ready. Run the updated Supabase schema first.' }, { status: 503 });
    if ((count ?? 0) > 0) return Response.json({ error: 'Initial setup has already been completed.' }, { status: 409 });

    const bootstrapSecret = process.env.INVENTORY_BOOTSTRAP_SECRET;
    if (!bootstrapSecret || bootstrapSecret.length < 32) {
      return Response.json({ error: 'Initial setup is not enabled.' }, { status: 503 });
    }
    const payload = await readJsonObject(request);
    if (!payload) return Response.json({ error: 'Invalid setup request.' }, { status: 400 });
    const receivedSecret = typeof payload.bootstrapSecret === 'string' ? payload.bootstrapSecret : '';
    if (!secretsMatch(bootstrapSecret, receivedSecret)) {
      return Response.json({ error: 'The setup key is incorrect.' }, { status: 403 });
    }

    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : '';
    const username = normalizeUsername(typeof payload.username === 'string' ? payload.username : null);
    const password = typeof payload.password === 'string' ? payload.password : '';

    if (name.length < 2 || name.length > 100 || email.length > 254 || !validEmail(email) || !validPassword(password)) {
      return Response.json({ error: 'Enter a name, a valid email, and a password of at least 12 characters.' }, { status: 400 });
    }
    if (username && !/^[a-z0-9._-]{3,32}$/.test(username)) {
      return Response.json({ error: 'Username must be 3–32 characters using letters, numbers, dots, underscores, or hyphens.' }, { status: 400 });
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, name },
    });
    if (createError || !created.user) {
      return Response.json({ error: 'The initial account could not be created. Use an unused email address.' }, { status: 409 });
    }
    const authUser = created.user;
    const { error: accountError } = await admin.rpc('manage_authorized_account', {
      p_operation: 'bootstrap',
      p_id: null,
      p_email: email,
      p_username: username,
      p_full_name: name,
      p_auth_user_id: authUser.id,
      p_actor_user_id: authUser.id,
      p_actor_email: email,
      p_actor_name: name,
      p_password_updated: false,
      p_session_id: null,
    });

    if (accountError) {
      await deleteAuthUser(authUser.id).catch(() => undefined);
      if (accountError.message.includes('already have the maximum')) {
        return Response.json({ error: 'Initial setup has already been completed.' }, { status: 409 });
      }
      return Response.json({ error: 'The initial account could not be saved. Check the database schema and try again.' }, { status: 400 });
    }

    return Response.json({ ok: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Initial setup could not be completed.' }, { status: 503 });
  }
}
