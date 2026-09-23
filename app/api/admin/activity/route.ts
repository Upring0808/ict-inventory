import { getAuthorizedActor } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const actor = await getAuthorizedActor(request);
    if (!actor) return Response.json({ error: 'Sign in with an authorized account to continue.' }, { status: 401 });

    const rawLimit = Number(new URL(request.url).searchParams.get('limit') || 100);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 200) : 100;
    const { data, error } = await createAdminClient()
      .from('activity_log')
      .select('id,actor_user_id,actor_name,actor_email,action,target_type,target_id,target_label,equipment_property_number,details,occurred_at')
      .order('occurred_at', { ascending: false })
      .limit(limit);
    if (error) return Response.json({ error: 'Could not load the activity history.' }, { status: 503 });

    return Response.json({ events: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Could not load the activity history.' }, { status: 503 });
  }
}
