import { timingSafeEqual } from 'node:crypto';
import {
  createAdminClient,
  createOrUpdateAuthUser,
  normalizeEmail,
  normalizeUsername,
  validEmail,
  validPassword,
  deleteAuthUser,
} from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

function secretsMatch(expected: string, received: string): boolean {
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}

export async function POST(request: Request) {
  const bootstrapSecret = process.env.INVENTORY_BOOTSTRAP_SECRET;
  if (!bootstrapSecret || bootstrapSecret.length < 32) {
    return Response.json(
      { error: 'Initial setup is not enabled. Set a 32-character INVENTORY_BOOTSTRAP_SECRET on the server.' },
      { status: 503 }
    );
  }

  try {
    const payload = await request.json() as {
      bootstrapSecret?: unknown;
      name?: unknown;
      email?: unknown;
      username?: unknown;
      password?: unknown;
    };
    const receivedSecret = typeof payload.bootstrapSecret === 'string' ? payload.bootstrapSecret : '';
    if (!secretsMatch(bootstrapSecret, receivedSecret)) {
      return Response.json({ error: 'The setup key is incorrect.' }, { status: 403 });
    }

    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : '';
    const username = normalizeUsername(typeof payload.username === 'string' ? payload.username : null);
    const password = typeof payload.password === 'string' ? payload.password : '';

    if (name.length < 2 || name.length > 100 || !validEmail(email) || !validPassword(password)) {
      return Response.json({ error: 'Enter a name, a valid email, and a password of at least 12 characters.' }, { status: 400 });
    }
    if (username && !/^[a-z0-9._-]{3,32}$/.test(username)) {
      return Response.json({ error: 'Username must be 3–32 characters using letters, numbers, dots, underscores, or hyphens.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { count, error: countError } = await admin
      .from('authorized_accounts')
      .select('id', { count: 'exact', head: true });
    if (countError) return Response.json({ error: 'The inventory database is not ready. Run the updated Supabase schema first.' }, { status: 503 });
    if ((count ?? 0) > 0) return Response.json({ error: 'Initial setup has already been completed.' }, { status: 409 });

    const { user: authUser, created: createdAuthUser } = await createOrUpdateAuthUser(email, password, name);
    const { error: accountError } = await admin.rpc('manage_authorized_account', {
      p_operation: 'create',
      p_id: null,
      p_email: email,
      p_username: username,
      p_full_name: name,
      p_auth_user_id: authUser.id,
      p_actor_user_id: authUser.id,
      p_actor_email: email,
      p_actor_name: name,
      p_password_updated: false,
    });

    if (accountError) {
      if (createdAuthUser) await deleteAuthUser(authUser.id).catch(() => undefined);
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
