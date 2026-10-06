import 'server-only';

import { createAdminClient } from '@/lib/auth/server';
import { connectionFromRequest } from '@/lib/security/connection';

interface SessionIdentity {
  sessionId: string | null;
  accountId: string;
  userId: string;
  name: string;
  email: string;
}

export async function recordAccountSession(
  identity: SessionIdentity,
  request: Request,
  event: 'signed_in' | 'seen' | 'ended',
): Promise<void> {
  if (!identity.sessionId) throw new Error('This sign-in has no verifiable session ID.');
  const connection = connectionFromRequest(request);
  const { error } = await createAdminClient().rpc('record_account_session', {
    p_session_id: identity.sessionId,
    p_account_id: identity.accountId,
    p_auth_user_id: identity.userId,
    p_actor_name: identity.name,
    p_actor_email: identity.email,
    p_event: event,
    p_ip_address: connection.ipAddress,
    p_city: connection.city,
    p_region: connection.region,
    p_country: connection.country,
    p_device_model: connection.deviceModel,
    p_device_description: connection.deviceDescription,
    p_user_agent: connection.userAgent,
  });
  if (error) throw error;
}
