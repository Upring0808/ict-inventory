import { createAdminClient, getAuthorizedActor, hasRecentRecoveryProof, updateAuthUserWithToken, validPassword } from '@/lib/auth/server';
import { readJsonObject } from '@/lib/security/input';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const actor = await getAuthorizedActor(request);
    if (!actor) {
      return Response.json({ error: 'This account is not authorized to reset an inventory account password.' }, { status: 403 });
    }

    const limit = await checkRateLimit(request, 'password-recovery', 20, 900, actor.id, 5);
    if (!limit.allowed) return rateLimitResponse(limit);
    const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1] || '';
    if (!hasRecentRecoveryProof(token, actor.id)) {
      return Response.json({ error: 'Open a recent password recovery link before changing your password.' }, { status: 403 });
    }

    const payload = await readJsonObject(request);
    if (!payload) return Response.json({ error: 'Invalid password recovery request.' }, { status: 400 });
    const password = typeof payload.password === 'string' ? payload.password : '';
    if (!validPassword(password)) {
      return Response.json({ error: 'Use a password between 12 and 128 characters.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: account, error: accountError } = await admin
      .from('authorized_accounts')
      .select('id,email,username,full_name,auth_user_id')
      .eq('id', actor.accountId)
      .maybeSingle();
    if (accountError) return Response.json({ error: 'Could not verify the authorized account.' }, { status: 503 });
    if (!account || account.auth_user_id !== actor.id) {
      return Response.json({ error: 'This recovery link is no longer valid for the authorized account.' }, { status: 403 });
    }

    const passwordUpdate = await updateAuthUserWithToken(token, { password });
    if (!passwordUpdate.ok) {
      return Response.json({ error: 'The password could not be updated. Request a new recovery email and try again.' }, { status: 400 });
    }

    const { error: signOutError } = await admin.auth.admin.signOut(token, 'global');

    const { error: auditError } = await admin.rpc('manage_authorized_account', {
      p_operation: 'update',
      p_id: account.id,
      p_email: account.email,
      p_username: account.username,
      p_full_name: account.full_name,
      p_auth_user_id: account.auth_user_id,
      p_actor_user_id: actor.id,
      p_actor_email: actor.email,
      p_actor_name: actor.name,
      p_password_updated: true,
      p_session_id: actor.sessionId,
    });
    if (auditError || signOutError) {
      console.error('Password recovery succeeded but session revocation or its activity record could not be saved.');
      return Response.json(
        { ok: true, warning: 'Your password changed. Review your other sessions and contact an administrator if they remain active.' },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Password recovery is temporarily unavailable.' }, { status: 503 });
  }
}
