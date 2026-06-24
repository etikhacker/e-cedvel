// src/middleware.ts  ← src/ qovluğuna birbaşa qoy (app/ deyil)

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (!path.startsWith('/university-admin')) return NextResponse.next();

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          ),
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Login olmayıbsa → login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // university_admins cədvəlini yoxla
  const { data: adminRow } = await supabase
    .from('university_admins')
    .select('id')
    .eq('id', session.user.id)
    .single();

  // University admin deyilsə → ana səhifə
  if (!adminRow) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/university-admin/:path*'],
};