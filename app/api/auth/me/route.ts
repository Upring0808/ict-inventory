import { getAuthorizedActor } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const actor = await getAuthorizedActor(request);
    if (!actor) {
      return Response.json({ error: 'This account is not authorized to use the inventory dashboard.' }, { status: 403 });
    }

    return Response.json(
      {
        id: actor.id,
        email: actor.email,
        name: actor.name,
        avatarUrl: actor.avatarUrl,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json({ error: 'Could not validate this account.' }, { status: 503 });
  }
}
