import {
  createAdminClient,
  createOrUpdateAuthUser,
  deleteAuthUser,
  getAuthorizedActor,
  normalizeEmail,
  normalizeUsername,
  validEmail,
  validPassword,
} from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

const MAX_ACCOUNTS = 2;
const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

function unauthorized() {
  return Response.json({ error: 'Sign in with an authorized account to continue.' }, { status: 401 });
}

function validAccountInput(name: string, email: string, username: string | null) {
  return name.length >= 2 && name.length <= 100 && validEmail(email) &&
    (!username || USERNAME_PATTERN.test(username));
}

export async function GET(request: Request) {
  try {
    const actor = await getAuthorizedActor(request);
    if (!actor) return unauthorized();

    const { data, error } = await createAdminClient()
      .from('authorized_accounts')
      .select('id,email,username,full_name,created_at')
      .order('created_at', { ascending: true });
    if (error) return Response.json({ error: 'Could not load authorized accounts.' }, { status: 503 });

    return Response.json(
      {
        accounts: (data || []).map((account) => ({
          id: account.id,
          email: account.email,
          username: account.username,
          name: account.full_name,
          createdAt: account.created_at,
          isCurrentUser: account.id === actor.accountId,
        })),
        limit: MAX_ACCOUNTS,
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

    const payload = await request.json() as {
      name?: unknown;
      email?: unknown;
      username?: unknown;
      password?: unknown;
    };
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
    const { error } = await admin.rpc('manage_authorized_account', {
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

    const payload = await request.json() as {
      id?: unknown;
      name?: unknown;
      email?: unknown;
      username?: unknown;
      password?: unknown;
    };
    const id = typeof payload.id === 'string' ? payload.id : '';
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const requestedEmail = typeof payload.email === 'string' ? normalizeEmail(payload.email) : null;
    const username = normalizeUsername(typeof payload.username === 'string' ? payload.username : null);
    const password = typeof payload.password === 'string' ? payload.password : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ||
      name.length < 2 || name.length > 100 || (requestedEmail !== null && !validEmail(requestedEmail)) ||
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

    if (emailChanged) {
      const { error } = await admin.auth.admin.updateUserById(account.auth_user_id!, {
        email,
        email_confirm: true,
      });
      if (error) {
        const emailConflict = /already|registered|exists|taken/i.test(error.message);
        return Response.json(
          { error: emailConflict ? 'That email is already in use by an authentication account.' : 'The sign-in email could not be updated.' },
          { status: emailConflict ? 409 : 400 }
        );
      }
    }

    const saveAccount = (passwordUpdated: boolean) => admin.rpc('manage_authorized_account', {
      p_operation: 'update',
      p_id: id,
      p_email: email,
      p_username: username,
      p_full_name: name,
      p_auth_user_id: account.auth_user_id,
      p_actor_user_id: actor.id,
      p_actor_email: actor.email,
      p_actor_name: actor.name,
      p_password_updated: passwordUpdated,
    });
    const restoreSignInEmail = async () => {
      if (!emailChanged || !account.auth_user_id) return true;
      const { error: rollbackError } = await admin.auth.admin.updateUserById(account.auth_user_id, {
        email: normalizeEmail(account.email),
        email_confirm: true,
      });
      if (rollbackError) console.error('Could not restore the sign-in email after an account update failed:', rollbackError);
      return !rollbackError;
    };

    const { error } = await saveAccount(false);
    if (error) {
      if (!await restoreSignInEmail()) {
        return Response.json(
          { error: 'The account details could not be saved. The sign-in email may have changed; use the new email if needed.' },
          { status: 503 }
        );
      }
      const conflict = error.code === '23505';
      return Response.json(
        { error: conflict ? 'That email or username is already in use.' : 'The authorized account could not be updated.' },
        { status: conflict ? 409 : 400 }
      );
    }

    if (emailChanged) {
      const { data: savedAccount, error: verifyError } = await admin
        .from('authorized_accounts')
        .select('email')
        .eq('id', id)
        .maybeSingle();
      if (!verifyError && normalizeEmail(savedAccount?.email || '') !== email) {
        const emailRestored = await restoreSignInEmail();
        return Response.json(
          { error: emailRestored
            ? 'Email changes need the updated Supabase schema. Apply the latest schema, then try again.'
            : 'Email changes need the updated Supabase schema. The sign-in email may have changed; use the new email if needed.' },
          { status: 503 }
        );
      }
    }

    let warning: string | undefined;
    if (password && account.auth_user_id) {
      const { error: passwordError } = await admin.auth.admin.updateUserById(account.auth_user_id, { password });
      if (passwordError) {
        warning = 'Other account details were saved, but the password could not be updated. Please retry the password change.';
      } else {
        const { error: auditError } = await saveAccount(true);
        if (auditError) {
          console.error('The password changed but its account activity marker could not be saved:', auditError);
          warning = 'The password changed, but its activity record could not be saved. Please contact the other authorized user.';
        }
      }
    }

    return Response.json(
      { ok: true, reauthenticate: emailChanged && account.auth_user_id === actor.id, ...(warning ? { warning } : {}) },
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

    const payload = await request.json() as { id?: unknown };
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

    const { error } = await admin.rpc('manage_authorized_account', {
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
    });
    if (error) {
      const lastAccount = error.message.includes('At least one authorized account must remain');
      return Response.json(
        { error: lastAccount ? 'At least one authorized account must remain.' : 'The authorized account could not be removed.' },
        { status: lastAccount ? 409 : 400 }
      );
    }

    if (account.auth_user_id) {
      await deleteAuthUser(account.auth_user_id).catch((error) => {
        console.error('Removed account left an unused Supabase Auth user:', error);
      });
    }

    return Response.json({ ok: true, removedCurrentUser: account.auth_user_id === actor.id }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'The authorized account could not be removed.' }, { status: 503 });
  }
}
