import { getAuthorizedActor } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const actor = await getAuthorizedActor(request);
    if (!actor) return Response.json({ error: 'Sign in with an authorized account to continue.' }, { status: 401 });

    const url = new URL(request.url);
    const rawLimit = Number(url.searchParams.get('limit') || 60);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100) : 60;
    const rawOffset = Number(url.searchParams.get('offset') || 0);
    const offset = Number.isFinite(rawOffset) ? Math.min(Math.max(Math.trunc(rawOffset), 0), 100_000) : 0;
    const fromValue = url.searchParams.get('from');
    const toValue = url.searchParams.get('to');

    let from: Date | null = null;
    let to: Date | null = null;
    if (fromValue || toValue) {
      from = fromValue ? new Date(fromValue) : null;
      to = toValue ? new Date(toValue) : null;
      const duration = from && to ? to.getTime() - from.getTime() : 0;
      if (!from || !to || !Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || duration < 22 * 60 * 60 * 1000 || duration > 26 * 60 * 60 * 1000) {
        return Response.json({ error: 'Choose a valid activity date.' }, { status: 400 });
      }
    }

    const admin = createAdminClient();
    let activityQuery = admin
      .from('activity_log')
      .select('id,actor_user_id,actor_name,actor_email,action,target_type,target_id,target_label,equipment_property_number,details,occurred_at', { count: 'exact' });
    if (from && to) activityQuery = activityQuery.gte('occurred_at', from.toISOString()).lt('occurred_at', to.toISOString());
    const { data, count, error } = await activityQuery
      .order('occurred_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) return Response.json({ error: 'Could not load the activity history.' }, { status: 503 });

    const activeIds = await admin
      .from('authorized_accounts')
      .select('auth_user_id')
      .not('auth_user_id', 'is', null)
      .limit(2);
    const actorIds = new Set((activeIds.data || [])
      .map((account) => account.auth_user_id)
      .filter((id): id is string => Boolean(id)));
    const eventActorIds = new Set((data || [])
      .map((event) => event.actor_user_id)
      .filter((id): id is string => typeof id === 'string' && actorIds.has(id)));
    const avatarByActorId = new Map<string, string>();

    await Promise.all([...eventActorIds].map(async (id) => {
      if (id === actor.id && actor.avatarUrl?.startsWith('https://')) {
        avatarByActorId.set(id, actor.avatarUrl);
        return;
      }
      try {
        const { data: authResult } = await admin.auth.admin.getUserById(id);
        const metadata = authResult.user?.user_metadata as Record<string, unknown> | null;
        const avatarUrl = typeof metadata?.avatar_url === 'string'
          ? metadata.avatar_url
          : typeof metadata?.picture === 'string'
            ? metadata.picture
            : null;
        if (avatarUrl?.startsWith('https://')) avatarByActorId.set(id, avatarUrl);
      } catch {
        // Keep the activity available if a profile image cannot be loaded.
      }
    }));

    const events = (data || []).map((event) => ({
      ...event,
      actor_avatar_url: event.actor_user_id ? avatarByActorId.get(event.actor_user_id) || null : null,
    }));
    const total = count || 0;
    return Response.json(
      { events, total, hasMore: offset + events.length < total, limit, offset },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json({ error: 'Could not load the activity history.' }, { status: 503 });
  }
}
