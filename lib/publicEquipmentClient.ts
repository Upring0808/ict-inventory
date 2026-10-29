import type { EquipmentVerification, InventoryItem } from '@/types/inventory';
import type { PublicEquipmentSummary } from '@/lib/publicEquipmentSummary';
import { createBrowserClient } from '@/lib/supabase/client';
import { normalizeYearAcquired } from '@/lib/inventoryFormatting';

function mapAuthorizedEquipment(row: Record<string, unknown>): InventoryItem {
  const verificationHistory = Array.isArray(row.verification_history)
    ? row.verification_history as EquipmentVerification[]
    : [];

  return {
    id: String(row.id),
    propertyNumber: String(row.property_number),
    serialNumber: row.serial_number ? String(row.serial_number) : undefined,
    equipmentType: row.equipment_type as InventoryItem['equipmentType'],
    model: String(row.model),
    brand: String(row.brand),
    location: String(row.location),
    accountablePersonnel: String(row.accountable_personnel),
    accountableSex: row.accountable_sex ? String(row.accountable_sex) : undefined,
    accountableStatus: row.accountable_status ? String(row.accountable_status) : undefined,
    yearAcquired: normalizeYearAcquired(row.year_acquired ? String(row.year_acquired) : undefined, String(row.property_number)),
    shelfLife: (row.shelf_life as InventoryItem['shelfLife']) || 'WITHIN 5 YEARS',
    processor: row.processor ? String(row.processor) : undefined,
    ram: row.ram ? String(row.ram) : undefined,
    gpu: row.gpu ? String(row.gpu) : undefined,
    rangeCategory: row.range_category ? String(row.range_category) : undefined,
    osInstalled: row.os_installed ? String(row.os_installed) : undefined,
    officeProductivityProduct: row.office_productivity_product ? String(row.office_productivity_product) : undefined,
    endpointProtection: row.endpoint_protection ? String(row.endpoint_protection) : undefined,
    computerName: row.computer_name ? String(row.computer_name) : undefined,
    datePmsConducted: String(row.date_pms_conducted || ''),
    status: String(row.status || 'Serviceable'),
    statusCategory: (row.status_category as InventoryItem['statusCategory']) || 'Serviceable',
    remarks: row.remarks ? String(row.remarks) : undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.last_verified_at && row.updated_at ? String(row.updated_at) : undefined,
    lastVerifiedAt: row.last_verified_at ? String(row.last_verified_at) : undefined,
    lastVerifiedBy: row.last_verified_by ? String(row.last_verified_by) : undefined,
    verificationCount: typeof row.verification_count === 'number'
      ? row.verification_count
      : Number(row.verification_count || verificationHistory.length) || undefined,
    verificationHistory,
  };
}

export type PublicEquipment = PublicEquipmentSummary;

export async function findPublicEquipment(propertyNumber: string): Promise<PublicEquipment | null> {
  const normalized = propertyNumber.trim();
  if (!normalized) return null;

  const response = await fetch(`/api/public/equipment?propertyNumber=${encodeURIComponent(normalized)}`, {
    cache: 'no-store',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Equipment verification is temporarily unavailable.');
  const result = await response.json() as Record<string, unknown>;
  if (
    result.registered !== true ||
    result.propertyNumber !== normalized ||
    typeof result.equipmentType !== 'string' ||
    typeof result.brand !== 'string' ||
    typeof result.model !== 'string' ||
    typeof result.statusCategory !== 'string' ||
    (result.yearAcquired !== undefined && typeof result.yearAcquired !== 'string')
  ) {
    throw new Error('Equipment verification returned an invalid response.');
  }
  return {
    propertyNumber: normalized,
    registered: true,
    equipmentType: result.equipmentType,
    brand: result.brand,
    model: result.model,
    statusCategory: result.statusCategory as InventoryItem['statusCategory'],
    yearAcquired: result.yearAcquired as string | undefined,
  };
}

/** Full records are read with the user's session and the equipment RLS policy. */
export async function findAuthorizedEquipment(propertyNumber: string): Promise<InventoryItem | null> {
  const normalized = propertyNumber.trim();
  if (!normalized) return null;
  const { data, error } = await createBrowserClient()
    .from('equipment')
    .select('*')
    .eq('property_number', normalized)
    .maybeSingle();
  if (error) throw new Error('Equipment details are temporarily unavailable.');
  return data ? mapAuthorizedEquipment(data) : null;
}

export async function recordPublicQrVerification(
  item: InventoryItem,
  comment?: string,
  resolveActiveRemark = false
): Promise<InventoryItem> {
  if (comment && comment.trim().length > 500) throw new Error('Verification note is too long.');
  const { data, error } = await createBrowserClient().rpc('record_equipment_verification', {
    p_equipment_id: item.id,
    p_comment: comment?.trim() || null,
    p_resolve_remark: resolveActiveRemark,
  });
  if (error || !data) throw new Error('This account cannot record equipment verification.');
  return mapAuthorizedEquipment(data as Record<string, unknown>);
}
