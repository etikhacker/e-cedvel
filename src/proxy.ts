import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { canonicalPageRedirect } from '@/lib/canonical-url';
export async function proxy(request: NextRequest) {
  const canonical = canonicalPageRedirect(request.url,request.method,process.env.VERCEL_ENV,process.env.NEXT_PUBLIC_APP_URL);
  if (canonical) {
    const redirect = NextResponse.redirect(canonical,307);
    redirect.headers.set('Cache-Control','private, no-store');
    redirect.headers.set('Referrer-Policy','no-referrer');
    return redirect;
  }
  if (request.nextUrl.pathname === '/') return NextResponse.next();
  let response=NextResponse.next({request});
  const db=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{
    cookies:{getAll:()=>request.cookies.getAll(),setAll:values=>{
      values.forEach(({name,value})=>request.cookies.set(name,value));
      response=NextResponse.next({request});
      values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    }},
  });
  const {data:{user},error}=await db.auth.getUser();
  const path=request.nextUrl.pathname;
  const admin=path.startsWith('/admin') && path!=='/admin/setup';
  const protectedPage=admin || path.startsWith('/dashboard') || path==='/reset-password';
  let destination: string|null=null;
  if (protectedPage && (error || !user)) destination='/login';
  if (admin && user) {
    const {data,error:roleError}=await db.from('university_admins').select('role').eq('id',user.id).maybeSingle();
    if (roleError || !data || !['superadmin','university_admin','admin'].includes(data.role)
      || (path.startsWith('/admin/muracietler') && data.role!=='superadmin')) destination='/dashboard';
  }
  if (destination) {
    const redirect=NextResponse.redirect(new URL(destination,request.url));
    response.cookies.getAll().forEach(c=>redirect.cookies.set(c));
    response=redirect;
  }
  response.headers.set('Cache-Control','private, no-store');
  response.headers.set('Referrer-Policy',path==='/admin/setup'?'no-referrer':'same-origin');
  return response;
}
export const config={matcher:['/','/dashboard/:path*','/admin/:path*','/auth/:path*','/reset-password','/login','/api/:path*']};
