/**
 * The field is intentionally a year, not an ambiguous date. Existing source
 * records contain values such as `9/20/23`, `2019/01/08`, and `2019-01-08`;
 * this produces one display/storage convention: `YYYY`.
 */
export function extractYearFromPropertyNumber(propertyNumber?: string): string | undefined {
  if (!propertyNumber) return undefined;

  const fullYear = propertyNumber.match(/(?:^|[^\d])((?:19|20)\d{2})(?:[^\d]|$)/)?.[1];
  if (fullYear) return fullYear;

  // Common DENR property-number formats include SEMI-LAP-23-101-001 and PTR-19-101-012.
  const segments = propertyNumber.toUpperCase().split(/[-/\s]+/).filter(Boolean);
  const shortYearIndex = segments.findIndex((segment) => /^(?:0\d|1\d|2\d)$/.test(segment));
  if (shortYearIndex >= 1) {
    const shortYear = Number(segments[shortYearIndex]);
    const currentSuffix = new Date().getFullYear() % 100;
    return String(shortYear <= currentSuffix ? 2000 + shortYear : 1900 + shortYear);
  }

  return undefined;
}

export function normalizeYearAcquired(value?: string, propertyNumber?: string): string | undefined {
  const rawValue = value?.trim();
  if (rawValue) {
    const fullYear = rawValue.match(/(?:19|20)\d{2}/)?.[0];
    if (fullYear) return fullYear;

    // A two-digit date year (e.g. 9/20/23 or simply 17) becomes a four-digit year.
    const shortYearMatches = rawValue.match(/(?:^|[^\d])(\d{2})(?:$|[^\d])/g)
      ?.map((part) => part.match(/\d{2}/)?.[0])
      .filter((part): part is string => Boolean(part));
    const shortYear = shortYearMatches?.[shortYearMatches.length - 1];
    if (shortYear) {
      const year = Number(shortYear);
      const currentSuffix = new Date().getFullYear() % 100;
      return String(year <= currentSuffix ? 2000 + year : 1900 + year);
    }
  }

  return extractYearFromPropertyNumber(propertyNumber);
}

export function getEquipmentYear(item: { yearAcquired?: string; propertyNumber: string }): string | undefined {
  return normalizeYearAcquired(item.yearAcquired, item.propertyNumber);
}
