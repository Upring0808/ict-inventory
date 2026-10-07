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
    let query = admin.from('activity_log')
      .select('id,actor_user_id,actor_name,actor_email,action,target_type,target_id,target_label,equipment_property_number,details,occurred_at,session_id,connection_ip,connection_city,connection_region,connection_country,connection_latitude,connection_longitude,connection_accuracy_meters,connection_location_captured_at,device_model,device_description,connection_observed_at');
    if (from && to) query = query.gte('occurred_at', from.toISOString()).lt('occurred_at', to.toISOString());
    // Fetch one extra row to determine whether more results exist.
    const fullResult = await query.order('occurred_at', { ascending: false })
      .order('id', { ascending: false }).range(offset, offset + limit);
    let rows = fullResult.data || [];
    let trackingAvailable = true;
    if (fullResult.error?.code === '42703' || fullResult.error?.code === 'PGRST204') {
      let legacyQuery = admin.from('activity_log')
        .select('id,actor_user_id,actor_name,actor_email,action,target_type,target_id,target_label,equipment_property_number,details,occurred_at');
      if (from && to) legacyQuery = legacyQuery.gte('occurred_at', from.toISOString()).lt('occurred_at', to.toISOString());
      const legacyResult = await legacyQuery.order('occurred_at', { ascending: false })
        .order('id', { ascending: false }).range(offset, offset + limit);
      if (legacyResult.error) return Response.json({ error: 'Could not load the activity history.' }, { status: 503 });
      rows = (legacyResult.data || []).map((event) => ({
        ...event,
        session_id: null,
        connection_ip: null,
        connection_city: null,
        connection_region: null,
        connection_country: null,
        connection_latitude: null,
        connection_longitude: null,
        connection_accuracy_meters: null,
        connection_location_captured_at: null,
        device_model: null,
        device_description: null,
        connection_observed_at: null,
      }));
      trackingAvailable = false;
    }
    if (fullResult.error && trackingAvailable) return Response.json({ error: 'Could not load the activity history.' }, { status: 503 });

    const hasMore = rows.length > limit;
    const events = rows.slice(0, limit).map((event) => ({
      ...event,
      actor_avatar_url: event.actor_user_id === actor.id && actor.avatarUrl?.startsWith('https://')
        ? actor.avatarUrl
        : null,
    }));
    return Response.json(
      { events, hasMore, limit, offset, trackingAvailable },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json({ error: 'Could not load the activity history.' }, { status: 503 });
  }
}
