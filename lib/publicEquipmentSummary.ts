/** Only these two fields are approved for an unauthenticated QR lookup. */
export interface PublicEquipmentSummary {
  propertyNumber: string;
  registered: true;
}

export function validPublicPropertyNumber(value: string | null): value is string {
  return Boolean(value && value.trim() && value.trim().length <= 160 && !/[\x00-\x1f\x7f]/.test(value));
}

export function publicEquipmentSummary(row: { property_number: string }): PublicEquipmentSummary {
  return { propertyNumber: row.property_number, registered: true };
}
