import type { BrowserLocation } from '@/lib/security/browserLocation';
import styles from './LoginScreen.module.css';

interface LocationPermissionProps {
  location: BrowserLocation | null;
  isChecking: boolean;
  error: string | null;
  disabled: boolean;
  onRequest: () => void;
}

export function LocationPermission({ location, isChecking, error, disabled, onRequest }: LocationPermissionProps) {
  return (
    <div className={styles.locationCard} aria-busy={isChecking}>
      <div className={styles.locationIcon} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      </div>
      <div className={styles.locationBody}>
        <p className={styles.locationTitle}>{location ? 'Location ready' : 'Location required to sign in'}</p>
        <p className={styles.locationCopy}>
          {location
            ? `Browser location checked · about ±${Math.max(1, Math.round(location.accuracyMeters)).toLocaleString('en-PH')} m`
            : 'Allow this site to check your device location. It will be recorded with your sign-in and checked while the app is open.'}
        </p>
        {error ? <p role="alert" className={styles.locationError}>{error}</p> : null}
        <button type="button" onClick={onRequest} disabled={disabled || isChecking} className={styles.locationButton}>
          {isChecking ? 'Checking location…' : location ? 'Check again' : 'Allow location'}
        </button>
      </div>
    </div>
  );
}
