import { createAdminClient } from '@/lib/auth/server';
import { publicEquipmentSummary, validPublicPropertyNumber } from '@/lib/publicEquipmentSummary';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';
const responseHeaders = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

/** The property number is printed in the QR label. No other column is public. */
export async function GET(request: Request) {
  const limit = await checkRateLimit(request, 'public-equipment', 60, 60);
  if (!limit.allowed) return rateLimitResponse(limit);

  const rawPropertyNumber = new URL(request.url).searchParams.get('propertyNumber');
  if (!validPublicPropertyNumber(rawPropertyNumber)) {
    return Response.json({ error: 'A valid equipment property number is required.' }, { status: 400, headers: responseHeaders });
  }
  const propertyNumber = rawPropertyNumber.trim();

  try {
    const { data, error } = await createAdminClient()
      .from('equipment')
      .select('property_number')
      .eq('property_number', propertyNumber)
      .maybeSingle();

    if (error) return Response.json({ error: 'Equipment verification is temporarily unavailable.' }, { status: 503, headers: responseHeaders });
    if (!data) return Response.json({ error: 'Equipment not found.' }, { status: 404, headers: responseHeaders });

    return Response.json(
      publicEquipmentSummary(data),
      { headers: responseHeaders },
    );
  } catch {
    return Response.json({ error: 'Equipment verification is temporarily unavailable.' }, { status: 503, headers: responseHeaders });
  }
}
