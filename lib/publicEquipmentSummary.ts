import type { EquipmentStatusCategory } from '@/types/inventory';

/** Public QR details are limited to equipment identification and current custody. */
export interface PublicEquipmentSummary {
  propertyNumber: string;
  registered: true;
  equipmentType: string;
  brand: string;
  model: string;
  serialNumber: string;
  accountablePersonnel: string;
  location: string;
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
  serial_number: string | null;
  accountable_personnel: string;
  location: string;
  status_category: string;
  year_acquired: string | number | null;
}): PublicEquipmentSummary {
  return {
    propertyNumber: row.property_number,
    registered: true,
    equipmentType: row.equipment_type,
    brand: row.brand,
    model: row.model,
    serialNumber: row.serial_number || '',
    accountablePersonnel: row.accountable_personnel,
    location: row.location,
    statusCategory: row.status_category as EquipmentStatusCategory,
    ...(row.year_acquired ? { yearAcquired: String(row.year_acquired) } : {}),
  };
}
