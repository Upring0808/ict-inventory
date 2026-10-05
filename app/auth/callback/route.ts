import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

function redirectAfterCallback(request: NextRequest, success: boolean) {
  const destination = new URL(success ? '/auth/completing' : '/', request.url);
  if (!success) destination.searchParams.set('auth_error', 'google');

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
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('Google OAuth code exchange failed:', error.message);
      return redirectAfterCallback(request, false);
    }

    return redirectAfterCallback(request, true);
  } catch (callbackError) {
    console.error(
      'Google OAuth callback could not be completed:',
      callbackError instanceof Error ? callbackError.message : 'Unknown error',
    );
    return redirectAfterCallback(request, false);
  }
}
