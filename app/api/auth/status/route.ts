import { createAdminClient } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { count, error } = await createAdminClient()
      .from('authorized_accounts')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return Response.json(
        { error: 'The inventory database is not ready. Run the updated Supabase schema first.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return Response.json(
      { setupRequired: count === 0 },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json(
      { error: 'Supabase server configuration is incomplete.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
