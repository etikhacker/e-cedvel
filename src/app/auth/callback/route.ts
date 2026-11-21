import { appOrigin } from '@/lib/request-origin';
import { NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/supabase/server';
import { callbackDestination } from '@/lib/security';
export async function GET(request: Request) {
  const url=new URL(request.url);
  const db=await serverSupabase();
  const code=url.searchParams.get('code'), hash=url.searchParams.get('token_hash'), type=url.searchParams.get('type');
  let ok=false;
  if (code) { const {error}=await db.auth.exchangeCodeForSession(code); ok=!error; }
  else if (hash && (type==='recovery' || type==='email' || type==='signup' || type==='invite')) {
    const {error}=await db.auth.verifyOtp({token_hash:hash,type}); ok=!error;
  }
  const target=ok?callbackDestination(type,url.searchParams.get('next')):'/login?error=invalid-link';
  const response=NextResponse.redirect(new URL(target,appOrigin(request)));
  response.headers.set('Cache-Control','private, no-store');
  response.headers.set('Referrer-Policy','no-referrer');
  return response;
}
