import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  if (tokenHash && type === 'recovery') {
    await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  if (code) {
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    if (data?.user) {
      return NextResponse.redirect(`${origin}/reset-password`);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}