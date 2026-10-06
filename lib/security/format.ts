const dateTimeFormatter = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

export function formatSecurityTime(value: string | null): string {
  if (!value) return 'Not recorded yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : dateTimeFormatter.format(date);
}

export function formatApproximateLocation(city: string | null, countryCode: string | null): string {
  const country = countryCode && /^[A-Z]{2}$/.test(countryCode)
    ? countryNames.of(countryCode) || countryCode
    : countryCode;
  const parts = [city, country].filter(Boolean);
  return parts.length ? `Approx. ${parts.join(', ')} (from IP)` : 'Location unavailable';
}
