import {
  createAdminClient,
  createOrUpdateAuthUser,
  changeCredentialsWithCurrentPassword,
  deleteAuthUser,
  getAuthorizedActor,
  normalizeEmail,
  normalizeUsername,
  validEmail,
  validPassword,
  verifyCurrentPassword,
} from '@/lib/auth/server';
import { readJsonObject } from '@/lib/security/input';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

const MAX_ACCOUNTS = 2;
const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

function missingSecuritySchema(code: string | undefined) {
  return code === 'PGRST205' || code === '42P01' || code === '42703' || code === 'PGRST204';
}

async function manageAccount(
  admin: ReturnType<typeof createAdminClient>,
  params: Record<string, unknown>,
) {
  const result = await admin.rpc('manage_authorized_account', params);
  if (result.error?.code !== 'PGRST202') return result;
  const legacyParams = { ...params };
  delete legacyParams.p_session_id;
  return admin.rpc('manage_authorized_account', legacyParams);
}

function unauthorized() {
  return Response.json({ error: 'Sign in with an authorized account to continue.' }, { status: 401 });
}

function validAccountInput(name: string, email: string, username: string | null) {
  return name.length >= 2 && name.length <= 100 && email.length <= 254 && validEmail(email) &&
    (!username || USERNAME_PATTERN.test(username));
}

export async function GET(request: Request) {
  try {
    const actor = await getAuthorizedActor(request);
    if (!actor) return unauthorized();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('authorized_accounts')
      .select('id,email,username,full_name,created_at')
      .order('created_at', { ascending: true });
    if (error) return Response.json({ error: 'Could not load authorized accounts.' }, { status: 503 });

    const accountIds = (data || []).map((account) => account.id);
    const activeSince = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const [activeResult, latestResults] = await Promise.all([
      admin.from('account_sessions')
        .select('account_id')
        .in('account_id', accountIds)
        .is('ended_at', null)
        .gte('last_seen_at', activeSince),
      Promise.all(accountIds.map((id) => admin.from('account_sessions')
        .select('last_seen_at,ip_address,city,region,country,latitude,longitude,accuracy_meters,location_captured_at,device_description')
        .eq('account_id', id)
        .order('last_seen_at', { ascending: false })
        .limit(1)
        .maybeSingle())),
    ]);
    const securityErrors = [activeResult.error, ...latestResults.map((result) => result.error)].filter((queryError) => queryError !== null);
    if (securityErrors.some((queryError) => !missingSecuritySchema(queryError.code))) {
      return Response.json({ error: 'Could not load account presence. Apply the latest Supabase schema if this feature is new.' }, { status: 503 });
    }
    const trackingAvailable = securityErrors.length === 0;
    const activeIds = new Set((activeResult.data || []).map((session) => session.account_id));
    const latestById = new Map(accountIds.map((id, index) => [id, latestResults[index].data]));

    return Response.json(
      {
        accounts: (data || []).map((account) => ({
          id: account.id,
          email: account.email,
          username: account.username,
          name: account.full_name,
          createdAt: account.created_at,
          isCurrentUser: account.id === actor.accountId,
          isActive: trackingAvailable && activeIds.has(account.id),
          lastOnline: latestById.get(account.id)?.last_seen_at ?? null,
          lastConnection: latestById.get(account.id) ? {
            ipAddress: latestById.get(account.id)?.ip_address ?? null,
            city: latestById.get(account.id)?.city ?? null,
            region: latestById.get(account.id)?.region ?? null,
            country: latestById.get(account.id)?.country ?? null,
            latitude: latestById.get(account.id)?.latitude ?? null,
            longitude: latestById.get(account.id)?.longitude ?? null,
            accuracyMeters: latestById.get(account.id)?.accuracy_meters ?? null,
            locationCapturedAt: latestById.get(account.id)?.location_captured_at ?? null,
            deviceDescription: latestById.get(account.id)?.device_description ?? null,
          } : null,
        })),
        limit: MAX_ACCOUNTS,
        trackingAvailable,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json({ error: 'Could not load authorized accounts.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getAuthorizedActor(request);
    if (!actor) return unauthorized();

    const payload = await readJsonObject(request);
    if (!payload) return Response.json({ error: 'Invalid account creation request.' }, { status: 400 });
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : '';
    const username = normalizeUsername(typeof payload.username === 'string' ? payload.username : null);
    const password = typeof payload.password === 'string' ? payload.password : '';

    if (!validAccountInput(name, email, username) || !validPassword(password)) {
      return Response.json(
        { error: 'Enter a valid name and email, optional valid username, and password of at least 12 characters.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { count, error: countError } = await admin
      .from('authorized_accounts')
      .select('id', { count: 'exact', head: true });
    if (countError) return Response.json({ error: 'Could not verify account capacity.' }, { status: 503 });
    if ((count ?? 0) >= MAX_ACCOUNTS) {
      return Response.json({ error: 'The system is limited to two authorized user accounts.' }, { status: 409 });
    }

    const { data: emailInUse, error: emailCheckError } = await admin
      .from('authorized_accounts')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (emailCheckError) return Response.json({ error: 'Could not validate the email address.' }, { status: 503 });
    if (emailInUse) return Response.json({ error: 'That email already belongs to an authorized account.' }, { status: 409 });
    if (username) {
      const { data: usernameInUse, error: usernameCheckError } = await admin
        .from('authorized_accounts')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      if (usernameCheckError) return Response.json({ error: 'Could not validate the username.' }, { status: 503 });
      if (usernameInUse) return Response.json({ error: 'That username is already in use.' }, { status: 409 });
    }

    const { user: authUser, created: createdAuthUser } = await createOrUpdateAuthUser(email, password, name);
    const { error } = await manageAccount(admin, {
      p_operation: 'create',
      p_id: null,
      p_email: email,
      p_username: username,
      p_full_name: name,
      p_auth_user_id: authUser.id,
      p_actor_user_id: actor.id,
      p_actor_email: actor.email,
      p_actor_name: actor.name,
      p_password_updated: false,
      p_session_id: actor.sessionId,
    });

    if (error) {
      if (createdAuthUser) await deleteAuthUser(authUser.id).catch(() => undefined);
      const conflict = error.code === '23505' || error.message.includes('maximum of two users');
      return Response.json(
        { error: conflict ? 'That email or username is already in use, or the two-account limit has been reached.' : 'The authorized account could not be saved.' },
        { status: conflict ? 409 : 400 }
      );
    }

    return Response.json({ ok: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'The authorized account could not be created.' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await getAuthorizedActor(request);
    if (!actor) return unauthorized();

    const payload = await readJsonObject(request);
    if (!payload) return Response.json({ error: 'Invalid account update request.' }, { status: 400 });
    const id = typeof payload.id === 'string' ? payload.id : '';
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const requestedEmail = typeof payload.email === 'string' ? normalizeEmail(payload.email) : null;
    const username = normalizeUsername(typeof payload.username === 'string' ? payload.username : null);
    const password = typeof payload.password === 'string' ? payload.password : '';
    const currentPassword = typeof payload.currentPassword === 'string' ? payload.currentPassword : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ||
      name.length < 2 || name.length > 100 || (requestedEmail !== null && (requestedEmail.length > 254 || !validEmail(requestedEmail))) ||
      (username && !USERNAME_PATTERN.test(username)) ||
      (password && !validPassword(password))) {
      return Response.json({ error: 'Enter a valid name, email, and username. A new password must be at least 12 characters.' }, { status: 400 });
    }
    if (id !== actor.accountId) {
      return Response.json({ error: 'You can only update your own account.' }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: account, error: findError } = await admin
      .from('authorized_accounts')
      .select('email,auth_user_id')
      .eq('id', id)
      .maybeSingle();
    if (findError) return Response.json({ error: 'Could not load the account to update.' }, { status: 503 });
    if (!account) return Response.json({ error: 'Authorized account not found.' }, { status: 404 });
    const email = requestedEmail ?? normalizeEmail(account.email);
    const emailChanged = email !== normalizeEmail(account.email);

    if (emailChanged || password) {
      const limit = await checkRateLimit(request, 'credential-change', 20, 900, actor.id, 5);
      if (!limit.allowed) return rateLimitResponse(limit);
      if (account.auth_user_id !== actor.id || !await verifyCurrentPassword(account.email, actor.id, currentPassword)) {
        return Response.json({ error: 'Enter your current password to change your email or password.' }, { status: 403 });
      }
    }

    if (emailChanged) {
      const { data: authorizedAccounts, error: emailCheckError } = await admin
        .from('authorized_accounts')
        .select('id,email')
        .neq('id', id)
        .limit(MAX_ACCOUNTS);
      if (emailCheckError) return Response.json({ error: 'Could not validate the email address.' }, { status: 503 });
      if (authorizedAccounts?.some((candidate) => normalizeEmail(candidate.email) === email)) {
        return Response.json({ error: 'That email already belongs to another authorized account.' }, { status: 409 });
      }
    }

    if (username) {
      const { data: usernameInUse, error: usernameCheckError } = await admin
        .from('authorized_accounts')
        .select('id')
        .eq('username', username)
        .neq('id', id)
        .maybeSingle();
      if (usernameCheckError) return Response.json({ error: 'Could not validate the username.' }, { status: 503 });
      if (usernameInUse) return Response.json({ error: 'That username is already in use.' }, { status: 409 });
    }

    if ((password || emailChanged) && !account.auth_user_id) {
      return Response.json({ error: 'This account has no active sign-in identity. Recreate it before changing its email or password.' }, { status: 409 });
    }

    const saveAccount = () => manageAccount(admin, {
      p_operation: 'update',
      p_id: id,
      // Supabase changes the Auth email only after its confirmation flow.
      // The auth.users trigger synchronizes this allowlist when confirmed.
      p_email: account.email,
      p_username: username,
      p_full_name: name,
      p_auth_user_id: account.auth_user_id,
      p_actor_user_id: actor.id,
      p_actor_email: actor.email,
      p_actor_name: actor.name,
      p_password_updated: false,
      p_session_id: actor.sessionId,
    });

    const { error } = await saveAccount();
    if (error) {
      const conflict = error.code === '23505';
      return Response.json(
        { error: conflict ? 'That email or username is already in use.' : 'The authorized account could not be updated.' },
        { status: conflict ? 409 : 400 }
      );
    }

    const clearPendingEmail = async () => {
      if (!emailChanged) return;
      await admin.from('pending_account_email_changes')
        .delete()
        .eq('auth_user_id', actor.id)
        .eq('new_email', email);
    };
    if (emailChanged) {
      const { error: approvalError } = await admin.from('pending_account_email_changes').upsert({
        auth_user_id: actor.id,
        account_id: id,
        new_email: email,
        requested_at: new Date().toISOString(),
      }, { onConflict: 'auth_user_id' });
      if (approvalError) {
        return Response.json({ error: 'Account details were saved, but email confirmation is unavailable until the new database schema is applied.' }, { status: 503 });
      }
    }

    let warning: string | undefined;
    let passwordUpdated = false;
    let emailChangePending = false;
    let appliedEmailChange = false;
    if (emailChanged || password) {
      let credentialResult: Awaited<ReturnType<typeof changeCredentialsWithCurrentPassword>>;
      try {
        credentialResult = await changeCredentialsWithCurrentPassword(account.email, actor.id, currentPassword, {
          ...(emailChanged ? { email } : {}),
          ...(password ? { password } : {}),
        });
      } catch {
        await clearPendingEmail();
        throw new Error('Credential update unavailable.');
      }
      if (!credentialResult.verified) {
        await clearPendingEmail();
        warning = 'Account details were saved, but your current password could not be verified for the credential change.';
      } else if (!credentialResult.update.ok) {
        await clearPendingEmail();
        warning = credentialResult.update.status === 422
          ? 'Account details were saved, but the new email or password was not accepted.'
          : 'Account details were saved, but the credential change could not be started.';
      } else {
        passwordUpdated = Boolean(password);
        appliedEmailChange = emailChanged && credentialResult.update.email === email;
        emailChangePending = emailChanged && !appliedEmailChange;
      }
    }

    if (appliedEmailChange || passwordUpdated) {
      const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (token) {
        const { error: signOutError } = await admin.auth.admin.signOut(token, 'global');
        if (signOutError) warning = 'Credentials changed. Sign out of every device and sign in again.';
      }
    }

    return Response.json(
      {
        ok: true,
        reauthenticate: appliedEmailChange || passwordUpdated,
        emailChanged: appliedEmailChange,
        emailChangePending,
        passwordUpdated,
        account: { id, name, email: appliedEmailChange ? email : account.email, username },
        ...(warning ? { warning } : {}),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json({ error: 'The authorized account could not be updated.' }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await getAuthorizedActor(request);
    if (!actor) return unauthorized();

    const payload = await readJsonObject(request);
    if (!payload) return Response.json({ error: 'Invalid account removal request.' }, { status: 400 });
    const id = typeof payload.id === 'string' ? payload.id : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return Response.json({ error: 'A valid account is required.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: account, error: findError } = await admin
      .from('authorized_accounts')
      .select('email,auth_user_id')
      .eq('id', id)
      .maybeSingle();
    if (findError) return Response.json({ error: 'Could not load the account to remove.' }, { status: 503 });
    if (!account) return Response.json({ error: 'Authorized account not found.' }, { status: 404 });
    if (id !== actor.accountId) {
      return Response.json({ error: 'You can only remove your own account.' }, { status: 403 });
    }

    const { error } = await manageAccount(admin, {
      p_operation: 'delete',
      p_id: id,
      p_email: account.email,
      p_username: null,
      p_full_name: '',
      p_auth_user_id: account.auth_user_id,
      p_actor_user_id: actor.id,
      p_actor_email: actor.email,
      p_actor_name: actor.name,
      p_password_updated: false,
      p_session_id: actor.sessionId,
    });
    if (error) {
      const lastAccount = error.message.includes('At least one authorized account must remain');
      return Response.json(
        { error: lastAccount ? 'At least one authorized account must remain.' : 'The authorized account could not be removed.' },
        { status: lastAccount ? 409 : 400 }
      );
    }

    if (account.auth_user_id) {
      await deleteAuthUser(account.auth_user_id).catch(() => {
        console.error('Removed account left an unused Supabase Auth user.');
      });
    }

    return Response.json({ ok: true, removedCurrentUser: account.auth_user_id === actor.id }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'The authorized account could not be removed.' }, { status: 503 });
  }
}
