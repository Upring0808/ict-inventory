import type { EquipmentStatusCategory } from '@/types/inventory';

/** Public QR details. Serial numbers, custody, notes, and audit data remain private. */
export interface PublicEquipmentSummary {
  propertyNumber: string;
  registered: true;
  equipmentType: string;
  brand: string;
  model: string;
  statusCategory: EquipmentStatusCategory;
  yearAcquired?: string;
}

export function validPublicPropertyNumber(value: string | null): value is string {
  return Boolean(value && value.trim() && value.trim().length <= 160 && !/[\x00-\x1f\x7f]/.test(value));
}

export function publicEquipmentSummary(row: {
  property_number: string;
  equipment_type: string;
  brand: string;
  model: string;
  status_category: string;
  year_acquired: string | number | null;
}): PublicEquipmentSummary {
  return {
    propertyNumber: row.property_number,
    registered: true,
    equipmentType: row.equipment_type,
    brand: row.brand,
    model: row.model,
    statusCategory: row.status_category as EquipmentStatusCategory,
    ...(row.year_acquired ? { yearAcquired: String(row.year_acquired) } : {}),
  };
}
