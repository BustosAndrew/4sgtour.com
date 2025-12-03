import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
    }

    if (session?.user) {
      // Check if this is a new Google user who needs phone verification
      const isOAuthUser = session.user.app_metadata?.provider === 'google';
      const phoneVerified = session.user.user_metadata?.phone_verified === true;

      // Check if user profile exists with phone
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', session.user.id)
        .single();

      // If OAuth user without verified phone, redirect to complete profile
      if (isOAuthUser && !phoneVerified && !profile?.phone) {
        return NextResponse.redirect(`${origin}/auth/complete-profile`);
      }
    }
  }

  const redirectUrl = redirect ? `${origin}${redirect}` : `${origin}/`;
  return NextResponse.redirect(redirectUrl);
}
