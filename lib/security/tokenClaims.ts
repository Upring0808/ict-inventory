const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function claimsForUser(token: string, userId: string): Record<string, unknown> | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as unknown;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
    const claims = payload as Record<string, unknown>;
    return claims.sub === userId ? claims : null;
  } catch {
    return null;
  }
}

/** Call only after Supabase getUser has verified the bearer token. */
export function verifiedSessionId(token: string, userId: string): string | null {
  const claims = claimsForUser(token, userId);
  return claims && typeof claims.session_id === 'string' && UUID_PATTERN.test(claims.session_id)
    ? claims.session_id
    : null;
}

/** Call only after Supabase getUser has verified the bearer token. */
export function verifiedTokenIssuedAt(token: string, userId: string): number | null {
  const claims = claimsForUser(token, userId);
  return claims && typeof claims.iat === 'number' && Number.isFinite(claims.iat)
    ? claims.iat
    : null;
}

/** Call only after Supabase getUser has verified the bearer token. */
export function hasRecentRecoveryProof(token: string, userId: string, now = Date.now()): boolean {
  const claims = claimsForUser(token, userId);
  if (!claims || !Array.isArray(claims.amr)) return false;
  const nowSeconds = Math.floor(now / 1000);
  return claims.amr.some((entry: unknown) => {
    if (!entry || typeof entry !== 'object') return false;
    const proof = entry as Record<string, unknown>;
    return proof.method === 'recovery' && typeof proof.timestamp === 'number' &&
      proof.timestamp >= nowSeconds - 600 && proof.timestamp <= nowSeconds + 60;
  });
}
