import { AuthCallback } from '@/components/auth/AuthCallback';

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[]; error?: string | string[] }>;
}) {
  const params = await searchParams;
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  return <AuthCallback code={code || null} providerError={error || null} />;
}
