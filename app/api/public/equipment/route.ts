import { createAdminClient } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

const PUBLIC_EQUIPMENT_FIELDS = [
  'id', 'property_number', 'serial_number', 'equipment_type', 'model', 'brand',
  'location', 'accountable_personnel', 'accountable_sex', 'accountable_status',
  'year_acquired', 'shelf_life', 'processor', 'ram', 'gpu', 'range_category',
  'os_installed', 'office_productivity_product', 'endpoint_protection',
  'computer_name', 'date_pms_conducted', 'status', 'status_category', 'remarks',
  'created_at', 'updated_at', 'last_verified_at', 'last_verified_by',
  'verification_count', 'verification_history',
].join(',');

export async function GET(request: Request) {
  const propertyNumber = new URL(request.url).searchParams.get('propertyNumber')?.trim();
  if (!propertyNumber || propertyNumber.length > 160) {
    return Response.json({ error: 'A valid equipment property number is required.' }, { status: 400 });
  }

  try {
    const { data, error } = await createAdminClient()
      .from('equipment')
      .select(PUBLIC_EQUIPMENT_FIELDS)
      .eq('property_number', propertyNumber)
      .maybeSingle();

    if (error) return Response.json({ error: 'Equipment details are temporarily unavailable.' }, { status: 503 });
    if (!data) return Response.json({ error: 'Equipment not found.' }, { status: 404 });

    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Equipment details are temporarily unavailable.' }, { status: 503 });
  }
}
