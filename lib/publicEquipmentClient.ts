import type { EquipmentVerification, InventoryItem } from '@/types/inventory';
import { createBrowserClient } from '@/lib/supabase/client';
import { normalizeYearAcquired } from '@/lib/inventoryFormatting';

function mapPublicEquipment(row: Record<string, unknown>): InventoryItem {
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

export async function findPublicEquipment(propertyNumber: string): Promise<InventoryItem | null> {
  const normalized = propertyNumber.trim();
  if (!normalized) return null;

  const response = await fetch(`/api/public/equipment?propertyNumber=${encodeURIComponent(normalized)}`, {
    cache: 'no-store',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Equipment details are temporarily unavailable.');
  return mapPublicEquipment(await response.json() as Record<string, unknown>);
}

export async function recordPublicQrVerification(
  item: InventoryItem,
  actor: { id: string; email: string; name: string },
  comment?: string,
  resolveActiveRemark = false
): Promise<InventoryItem> {
  const verifiedAt = new Date().toISOString();
  const resolvedRemark = resolveActiveRemark ? item.remarks?.trim() : undefined;
  const verification: EquipmentVerification = {
    id: `verify-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    verifiedAt,
    verifiedBy: actor.name.trim(),
    verifiedByUserId: actor.id,
    verifiedByEmail: actor.email,
    comment: comment?.trim() || undefined,
    remarkResolved: Boolean(resolvedRemark),
    resolvedRemark,
    method: 'qr',
  };

  const updates: Record<string, unknown> = {
    last_verified_at: verifiedAt,
    last_verified_by: actor.name,
    verification_count: (item.verificationCount || 0) + 1,
    verification_history: [verification, ...(item.verificationHistory || [])].slice(0, 100),
  };

  if (resolvedRemark) {
    updates.remarks = null;
    updates.status = item.statusCategory;
  }

  const supabase = createBrowserClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
  const query = isUuid
    ? supabase.from('equipment').update(updates).eq('id', item.id).select('id').maybeSingle()
    : supabase.from('equipment').update(updates).eq('property_number', item.propertyNumber).select('id').maybeSingle();
  const { data, error } = await query;
  if (error || !data) throw new Error(error?.message || 'This account cannot record equipment verification.');

  return {
    ...item,
    updatedAt: verifiedAt,
    lastVerifiedAt: verifiedAt,
    lastVerifiedBy: actor.name,
    verificationCount: (item.verificationCount || 0) + 1,
    verificationHistory: [verification, ...(item.verificationHistory || [])].slice(0, 100),
    remarks: resolvedRemark ? undefined : item.remarks,
    status: resolvedRemark ? item.statusCategory : item.status,
  };
}
