import { InventoryItem } from '@/types/inventory';

/**
 * Encodes a property number in a URL-safe form. The property number remains
 * the source of truth, so labels do not need a separate token migration.
 */
export function encodeEquipmentReference(propertyNumber: string): string {
  const bytes = new TextEncoder().encode(propertyNumber.trim());
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function decodeEquipmentReference(reference: string): string | null {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(reference)) return null;

    const normalized = reference.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const propertyNumber = new TextDecoder().decode(bytes).trim();

    return propertyNumber && propertyNumber.length <= 160 ? propertyNumber : null;
  } catch {
    return null;
  }
}

export function equipmentVerificationPath(item: InventoryItem): string {
  return `/verify?asset=${encodeURIComponent(encodeEquipmentReference(item.propertyNumber))}`;
}

export function equipmentVerificationUrl(item: InventoryItem, origin: string): string {
  return `${origin.replace(/\/$/, '')}${equipmentVerificationPath(item)}`;
}

/** Accept a QR URL only when it points to this application's verify route. */
export function getVerificationPathFromScan(rawValue: string, origin: string): string | null {
  try {
    const scannedUrl = new URL(rawValue);
    const currentOrigin = new URL(origin).origin;
    const asset = scannedUrl.searchParams.get('asset');

    if (scannedUrl.origin !== currentOrigin || scannedUrl.pathname !== '/verify' || !asset) {
      return null;
    }

    return decodeEquipmentReference(asset) ? `${scannedUrl.pathname}?asset=${encodeURIComponent(asset)}` : null;
  } catch {
    return null;
  }
}
