import { parseBrowserLocation, type BrowserLocation } from '@/lib/security/browserLocation';

export function requestBrowserLocation(): Promise<BrowserLocation> {
  if (!window.isSecureContext || !navigator.geolocation) {
    return Promise.reject(new Error('Location needs HTTPS and a browser that supports location access.'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = parseBrowserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          capturedAt: position.timestamp,
        });
        if (!location) {
          reject(new Error('The browser returned an invalid or old location. Please try again.'));
          return;
        }
        resolve(location);
      },
      (error) => {
        const message = error.code === 1
          ? 'Location access was blocked. Allow location for this site in your browser settings, then try again.'
          : error.code === 3
            ? 'Location took too long. Check that your device location is on, then try again.'
            : 'Your device could not determine its location. Check location services and try again.';
        reject(new Error(message));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    );
  });
}
