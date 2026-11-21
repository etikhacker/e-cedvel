import { sameOrigin } from '@/lib/request-origin';
import { readLimitedBody, BodyTooLarge } from '@/lib/request-body';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { serverSupabase, serviceSupabase } from '@/lib/supabase/server';
import { INVITE_TOKEN } from '@/lib/security';
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({error:'İcazə yoxdur.'},{status:403});
  try {
    const {token,action}=JSON.parse(new TextDecoder().decode(await readLimitedBody(req,1024)));
    if (typeof token!=='string' || !INVITE_TOKEN.test(token) || !['inspect','consume'].includes(action))
      return NextResponse.json({error:'Etibarsız dəvət.'},{status:400});
    const hash=createHash('sha256').update(token).digest('hex');
    if (action==='consume') {
      const db=await serverSupabase();
      const {data:{user},error:authError}=await db.auth.getUser();
      if (authError || !user) return NextResponse.json({error:'Əvvəlcə daxil olun və emailinizi təsdiqləyin.'},{status:401});
      const {error}=await db.rpc('consume_invitation',{p_hash:hash});
      if (error) return NextResponse.json({error:'Dəvət etibarsızdır, istifadə edilib və ya hesab uyğun deyil.'},{status:409});
      return NextResponse.json({success:true},{headers:{'Cache-Control':'no-store'}});
    }
    const {data,error}=await serviceSupabase().from('university_invites')
      .select('email,university_id,universities(name)').eq('token_hash',hash)
      .eq('used',false).eq('delivery_status','sent').gt('expires_at',new Date().toISOString()).maybeSingle();
    if (error) return NextResponse.json({error:'Dəvət yoxlanıla bilmədi.'},{status:503});
    if (!data) return NextResponse.json({error:'Dəvət etibarsızdır və ya müddəti bitib.'},{status:404});
    return NextResponse.json(data,{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return NextResponse.json({error:'Sorğu tamamlanmadı.'},{status:error instanceof BodyTooLarge?413:400}); }
}
