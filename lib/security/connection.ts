import 'server-only';

import { isIP } from 'node:net';

export interface ConnectionInfo {
  ipAddress: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  deviceModel: string | null;
  deviceDescription: string;
  userAgent: string | null;
}

function clean(value: string | null, maxLength: number): string | null {
  const trimmed = value?.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : null;
}

function clientHint(value: string | null, maxLength: number): string | null {
  if (!value) return null;
  try {
    const decoded = JSON.parse(value) as unknown;
    return typeof decoded === 'string' ? clean(decoded, maxLength) : null;
  } catch {
    return null;
  }
}

function cityHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return clean(decodeURIComponent(value), 100);
  } catch {
    return null;
  }
}

function browserName(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) return 'Edge';
  if (/OPR\//i.test(userAgent)) return 'Opera';
  if (/CriOS\//i.test(userAgent)) return 'Chrome';
  if (/FxiOS\//i.test(userAgent)) return 'Firefox';
  if (/Firefox\//i.test(userAgent)) return 'Firefox';
  if (/Chrome\//i.test(userAgent)) return 'Chrome';
  if (/Safari\//i.test(userAgent)) return 'Safari';
  return 'Browser unknown';
}

function platformName(userAgent: string, platformHint: string | null): string {
  if (platformHint) return platformHint;
  if (/iPad|iPhone|iPod/i.test(userAgent)) return 'iOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Mac OS X|Macintosh/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'OS unknown';
}

function androidModel(userAgent: string): string | null {
  const match = userAgent.match(/Android[^;)]*;\s*([^;)]+?)(?:\s+Build\/[^;)]*)?(?:;|\))/i);
  const model = clean(match?.[1] ?? null, 80);
  return model && model.length >= 3 && !/^(?:wv|mobile|linux|android)$/i.test(model) ? model : null;
}

export function connectionFromRequest(request: Request): ConnectionInfo {
  const headers = request.headers;
  const onVercel = process.env.VERCEL === '1';
  const forwarded = onVercel
    ? (headers.get('x-vercel-forwarded-for') || headers.get('x-forwarded-for'))?.split(',')[0].trim()
    : null;
  const ipAddress = forwarded && isIP(forwarded) ? forwarded : null;
  const countryHeader = onVercel && ipAddress ? clean(headers.get('x-vercel-ip-country'), 2)?.toUpperCase() : null;
  const country = countryHeader && /^[A-Z]{2}$/.test(countryHeader) ? countryHeader : null;
  const regionHeader = onVercel && ipAddress ? clean(headers.get('x-vercel-ip-country-region'), 8)?.toUpperCase() : null;
  const region = regionHeader && /^[A-Z0-9-]{1,8}$/.test(regionHeader) ? regionHeader : null;
  const city = onVercel && ipAddress ? cityHeader(headers.get('x-vercel-ip-city')) : null;

  const userAgent = clean(headers.get('user-agent'), 512);
  const platform = platformName(userAgent || '', clientHint(headers.get('sec-ch-ua-platform'), 40));
  const isTablet = /iPad|Tablet/i.test(userAgent || '') || (/Android/i.test(userAgent || '') && !/Mobile/i.test(userAgent || ''));
  const isMobile = headers.get('sec-ch-ua-mobile') === '?1' || /iPhone|iPod|Mobile/i.test(userAgent || '');
  const deviceType = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop';
  const deviceModel = clientHint(headers.get('sec-ch-ua-model'), 80) || androidModel(userAgent || '');
  const deviceDescription = `${deviceType} · ${browserName(userAgent || '')} on ${platform}`;

  return { ipAddress, city, region, country, deviceModel, deviceDescription, userAgent };
}
