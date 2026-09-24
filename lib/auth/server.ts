import 'server-only';

import { createClient, type User } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';

export interface AuthorizedAccountRow {
  id: string;
  email: string;
  username: string | null;
  full_name: string;
  auth_user_id: string;
  created_at: string;
}

export interface AuthorizedActor {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  accountId: string;
  authUser: User;
}

function requiredEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function createAdminClient() {
  const url = requiredEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  const secret =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!secret) {
    throw new Error('Set SUPABASE_SECRET_KEY on the server to enable account management.');
  }

  return createClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function createPublicAuthClient() {
  return createServerClient();
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeUsername(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized || null;
}

export function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validPassword(value: string): boolean {
  return value.length >= 12 && value.length <= 128;
}

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((user) => normalizeEmail(user.email || '') === normalizeEmail(email)) ?? null;
}

export async function createOrUpdateAuthUser(
  email: string,
  password: string,
  name: string
): Promise<{ user: User; created: boolean }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, name },
  });

  if (!error && data.user) return { user: data.user, created: true };

  // A previously used Google identity can exist before it is approved in this
  // app. An authorized administrator is explicitly approving that email here.
  const existing = await findAuthUserByEmail(email);
  if (!existing) throw error || new Error('The authentication user could not be created.');

  const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    user_metadata: { ...existing.user_metadata, full_name: name, name },
  });
  if (updateError || !updated.user) throw updateError || new Error('The authentication user could not be updated.');
  return { user: updated.user, created: false };
}

export async function deleteAuthUser(userId: string): Promise<void> {
  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) throw error;
}

/**
 * Repairs a missing/stale Auth identity link only after a verified Auth user
 * has presented the exact email already approved in authorized_accounts.
 */
export async function ensureAuthorizedIdentityLink(
  accountId: string,
  currentAuthUserId: string | null,
  verifiedAuthUserId: string
): Promise<boolean> {
  if (currentAuthUserId === verifiedAuthUserId) return true;

  const admin = createAdminClient();
  const updateQuery = admin
    .from('authorized_accounts')
    .update({ auth_user_id: verifiedAuthUserId, updated_at: new Date().toISOString() })
    .eq('id', accountId);
  const { data: linkedAccount, error: linkError } = currentAuthUserId
    ? await updateQuery.eq('auth_user_id', currentAuthUserId).select('auth_user_id').maybeSingle()
    : await updateQuery.is('auth_user_id', null).select('auth_user_id').maybeSingle();

  if (linkError) throw linkError;
  if (linkedAccount) return linkedAccount.auth_user_id === verifiedAuthUserId;

  // Another sign-in may have repaired the same row concurrently.
  const { data: latestAccount, error: refreshError } = await admin
    .from('authorized_accounts')
    .select('auth_user_id')
    .eq('id', accountId)
    .maybeSingle();
  if (refreshError) throw refreshError;
  return latestAccount?.auth_user_id === verifiedAuthUserId;
}

export async function getAuthorizedActor(request: Request): Promise<AuthorizedActor | null> {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1];
  const authClient = createPublicAuthClient();
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError) {
    // Transport/server errors are not proof that this user is unauthorized.
    // Let callers return a retryable 503 while preserving the browser session.
    if (authError.status !== 400 && authError.status !== 401 && authError.status !== 403) throw authError;
    return null;
  }
  if (!user?.email || !user.email_confirmed_at) return null;
  const userEmail = normalizeEmail(user.email);

  const admin = createAdminClient();
  const { data: accounts, error } = await admin
    .from('authorized_accounts')
    .select('id,email,username,full_name,auth_user_id,created_at')
    .limit(2);

  if (error) throw error;
  const account = accounts?.find((candidate) => normalizeEmail(candidate.email) === userEmail);
  if (!account) return null;
  if (!await ensureAuthorizedIdentityLink(account.id, account.auth_user_id, user.id)) return null;

  const metadata = user.user_metadata as Record<string, unknown> | null;
  const avatarUrl = typeof metadata?.avatar_url === 'string'
    ? metadata.avatar_url
    : typeof metadata?.picture === 'string'
      ? metadata.picture
      : null;

  return {
    id: user.id,
    email: normalizeEmail(user.email),
    name: account.full_name,
    avatarUrl,
    accountId: account.id,
    authUser: user,
  };
}

export function getAuthErrorResponse(error: unknown, fallback = 'The request could not be completed.') {
  const message = error instanceof Error ? error.message : fallback;
  const status = message.includes('not configured') ? 503 : 500;
  return Response.json({ error: status === 503 ? message : fallback }, { status });
}
