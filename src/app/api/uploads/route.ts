import { sameOrigin } from '@/lib/request-origin';
import { readLimitedBody, BodyTooLarge } from '@/lib/request-body';
import { NextRequest,NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { serverSupabase, serviceSupabase } from '@/lib/supabase/server';
import { MATERIAL_BUCKET, MAX_MATERIAL_BYTES, validateUpload, materialSubjectPrefix } from '@/lib/uploads';
import { safeFilename } from '@/lib/security';
export async function POST(req:NextRequest) {
  if(!sameOrigin(req)) return NextResponse.json({error:'İcazə yoxdur.'},{status:403});
  try {
    const db=await serverSupabase();
    const {data:{user},error}=await db.auth.getUser();
    if(error||!user) return NextResponse.json({error:'Daxil olun.'},{status:401});
    if(Number(req.headers.get('content-length'))>MAX_MATERIAL_BYTES+65536) return NextResponse.json({error:'Fayl çox böyükdür.'},{status:413});
    const body=await readLimitedBody(req,MAX_MATERIAL_BYTES+65536);
    const form=await new Response(body,{headers:{'Content-Type':req.headers.get('content-type')||''}}).formData();
    const file=form.get('file'),kind=form.get('kind');
    if(!(file instanceof File)||!['avatar','material'].includes(String(kind))||file.size>MAX_MATERIAL_BYTES)
      return NextResponse.json({error:'Yanlış fayl.'},{status:400});
    const bytes=new Uint8Array(await file.arrayBuffer());
    const ext=validateUpload(file.type,bytes,kind==='avatar');
    const subject=String(form.get('subject')||'Digər').slice(0,150);
    const prefix=kind==='avatar'?'avatar':materialSubjectPrefix(subject);
    const filename=safeFilename(file.name.replace(/\.[^.]+$/,'')).replace(/\.+/g,'_')+'.'+ext;
    const path=user.id+'/'+prefix+'_'+randomUUID()+(kind==='avatar'?'.'+ext:'_'+filename);
    const bucket=kind==='avatar'?'avatars':MATERIAL_BUCKET;
    // User identity/path are derived server-side. Direct Storage INSERT is denied.
    const service=serviceSupabase();
    const {error:uploadError}=await service.storage.from(bucket).upload(path,bytes,{contentType:file.type,upsert:false});
    if(uploadError) return NextResponse.json({error:'Fayl yüklənmədi.'},{status:503});
    const url=kind==='avatar'?service.storage.from(bucket).getPublicUrl(path).data.publicUrl:undefined;
    return NextResponse.json({path,url},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return NextResponse.json({error:'Fayl qəbul edilmədi. Formatı və ölçünü yoxlayın.'},{status:error instanceof BodyTooLarge?413:400}); }
}
