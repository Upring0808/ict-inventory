export interface BrowserLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: number;
}

export const LOCATION_MAX_AGE_MS = 5 * 60 * 1000;

export function parseBrowserLocation(value: unknown, now = Date.now()): BrowserLocation | null {
  if (!value || typeof value !== 'object') return null;
  const location = value as Record<string, unknown>;
  const { latitude, longitude, accuracyMeters, capturedAt } = location;
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
      typeof accuracyMeters !== 'number' || !Number.isFinite(accuracyMeters) || accuracyMeters <= 0 || accuracyMeters > 10_000_000 ||
      typeof capturedAt !== 'number' || !Number.isFinite(capturedAt) || capturedAt > now + 30_000 ||
      capturedAt < now - LOCATION_MAX_AGE_MS) return null;
  return { latitude, longitude, accuracyMeters, capturedAt };
}

export function formatBrowserLocation(latitude: number | null, longitude: number | null, accuracyMeters: number | null): string | null {
  if (latitude === null || longitude === null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const coordinates = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  return accuracyMeters !== null && Number.isFinite(accuracyMeters) && accuracyMeters > 0
    ? `${coordinates} · ±${Math.max(1, Math.round(accuracyMeters)).toLocaleString('en-PH')} m`
    : coordinates;
}

export function browserLocationMapUrl(latitude: number | null, longitude: number | null): string | null {
  if (latitude === null || longitude === null || !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  const lat = latitude.toFixed(6);
  const lon = longitude.toFixed(6);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
}
