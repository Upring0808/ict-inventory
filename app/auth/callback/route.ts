import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

function redirectAfterCallback(request: NextRequest, success: boolean, errorKind: 'google' | 'browser' = 'google') {
  const destination = new URL(success ? '/auth/completing' : '/', request.url);
  if (!success) destination.searchParams.set('auth_error', errorKind);

  const response = NextResponse.redirect(destination);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  if (!code || searchParams.has('error')) return redirectAfterCallback(request, false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return redirectAfterCallback(request, false);

  try {
    const response = redirectAfterCallback(request, true);
    const supabase = createSupabaseServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session) {
      console.error('Google OAuth code exchange failed:', error?.message || 'No session was returned.');
      return redirectAfterCallback(request, false, error?.name === 'AuthPKCECodeVerifierMissingError' ? 'browser' : 'google');
    }

    return response;
  } catch (callbackError) {
    console.error(
      'Google OAuth callback could not be completed:',
      callbackError instanceof Error ? callbackError.message : 'Unknown error',
    );
    return redirectAfterCallback(request, false, callbackError instanceof Error && callbackError.name === 'AuthPKCECodeVerifierMissingError' ? 'browser' : 'google');
  }
}
