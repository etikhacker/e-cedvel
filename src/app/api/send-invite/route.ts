import { sameOrigin } from '@/lib/request-origin';
import { readLimitedBody, BodyTooLarge } from '@/lib/request-body';
import { NextRequest, NextResponse } from 'next/server';
import { mailConfig } from '@/lib/mail-config';
import { sendInvitationMail } from '@/lib/invitation-mail';
import { randomBytes, createHash } from 'node:crypto';
import { serverSupabase, serviceSupabase } from '@/lib/supabase/server';
import { escapeHtml, inviteInput } from '@/lib/security';

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({error:'İcazə yoxdur.'},{status:403});
  try {
    const db=await serverSupabase();
    const {data:{user},error:authError}=await db.auth.getUser();
    if (authError || !user) return NextResponse.json({error:'Daxil olun.'},{status:401});
    const {data:admin,error:roleError}=await db.from('university_admins').select('role').eq('id',user.id).maybeSingle();
    if (roleError || admin?.role!=='superadmin') return NextResponse.json({error:'İcazə yoxdur.'},{status:403});
    const body=new TextDecoder().decode(await readLimitedBody(req,2048));
    if (body.length>2048) return NextResponse.json({error:'Sorğu çox böyükdür.'},{status:413});
    let parsed: unknown;
    try { parsed=JSON.parse(body); } catch { return NextResponse.json({error:'Yanlış JSON.'},{status:400}); }
    const input=inviteInput(parsed);
    if (!input) return NextResponse.json({error:'Düzgün email və universitet seçin.'},{status:400});
    const mail=mailConfig(process.env), base=process.env.NEXT_PUBLIC_APP_URL;
    if (!base) throw new Error('configuration');
    const appUrl=new URL(base);
    if (process.env.NODE_ENV==='production' && appUrl.protocol!=='https:') throw new Error('configuration');
    const {data:uni,error:uniError}=await db.from('universities').select('name').eq('id',input.university_id).eq('is_active',true).single();
    if (uniError || !uni) return NextResponse.json({error:'Universitet tapılmadı.'},{status:400});
    const service=serviceSupabase();
    const token=randomBytes(32).toString('hex');
    const {data:id,error}=await db.rpc('create_invitation',{
      p_email:input.email,p_university_id:input.university_id,p_hash:createHash('sha256').update(token).digest('hex'),
    });
    if (error || !id) {
      const limited=error?.message==='rate_limit';
      return NextResponse.json({error:limited?'Saatlıq dəvət limitinə çatdınız.':'Dəvət yaradıla bilmədi; aktiv dəvəti və admin hesabını yoxlayın.'},{status:limited?429:409});
    }
    const inviteLink=new URL('/admin/setup',appUrl); inviteLink.searchParams.set('token',token);
    let sent=false;
    try {
      sent=await sendInvitationMail(mail,{
        to:input.email,subject:uni.name+' — Admin Dəvəti',invitationId:id,
        html:emailTemplate({email:input.email,university_name:uni.name,inviteLink:inviteLink.href,expires_at:new Date(Date.now()+7*86400000)}),
      });
    } catch { sent=false; }
    const {error:deliveryError}=await service.from('university_invites')
      .update({delivery_status:sent?'sent':'failed',...(!sent?{expires_at:new Date().toISOString()}:{})}).eq('id',id);
    if (!sent || deliveryError) return NextResponse.json({error:'Dəvət göndərilməsi tamamlanmadı. Yenidən cəhd etməzdən əvvəl statusu yoxlayın.'},{status:503});
    return NextResponse.json({success:true,invite_link:inviteLink.href},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return NextResponse.json({error:error instanceof BodyTooLarge?'Sorğu çox böyükdür.':'Dəvət xidməti hazırda əlçatan deyil.'},{status:error instanceof BodyTooLarge?413:503}); }
}

/* ── Email şablonu ─────────────────────────────────────── */
function emailTemplate({
  email,
  university_name,
  inviteLink,
  expires_at,
}: {
  email: string;
  university_name: string;
  inviteLink: string;
  expires_at: Date;
}) {
  email = escapeHtml(email);
  university_name = escapeHtml(university_name);
  inviteLink = escapeHtml(inviteLink);
  const expiry = expires_at.toLocaleDateString('az-AZ', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="az">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>E-Cədvəl Admin Dəvəti</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:#fff;border-radius:16px;overflow:hidden;
             box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td style="background:#0d1117;padding:28px 40px;text-align:center;">
          <div style="display:inline-block;background:#3b82f6;
            padding:10px 20px;border-radius:10px;
            color:#fff;font-size:20px;font-weight:900;letter-spacing:-0.5px;">
            EC
          </div>
          <div style="color:#fff;font-size:18px;font-weight:700;margin-top:10px;">
            E-Cədvəl
          </div>
          <div style="color:rgba(255,255,255,0.4);font-size:13px;margin-top:4px;">
            Universitet Cədvəl Platforması
          </div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:36px 40px;">
          <h1 style="margin:0 0 8px;font-size:22px;color:#0d1117;font-weight:800;">
            Admin Dəvəti
          </h1>
          <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.6;">
            Sizi <strong style="color:#3b82f6;">${university_name}</strong> universiteti üçün
            <strong>E-Cədvəl</strong> platformasının admin panelinə dəvət edirik.
          </p>

          <!-- Info box -->
          <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;
            padding:16px 20px;margin-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#6b7280;font-size:13px;padding:4px 0;">Universitet:</td>
                <td style="color:#0d1117;font-size:13px;font-weight:700;
                  text-align:right;">${university_name}</td>
              </tr>
              <tr>
                <td style="color:#6b7280;font-size:13px;padding:4px 0;">Email:</td>
                <td style="color:#0d1117;font-size:13px;text-align:right;">${email}</td>
              </tr>
              <tr>
                <td style="color:#6b7280;font-size:13px;padding:4px 0;">Son tarix:</td>
                <td style="color:#ef4444;font-size:13px;font-weight:700;
                  text-align:right;">${expiry}</td>
              </tr>
            </table>
          </div>

          <!-- CTA Button -->
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${inviteLink}"
              style="display:inline-block;background:#3b82f6;color:#fff;
                font-size:15px;font-weight:700;padding:14px 36px;
                border-radius:10px;text-decoration:none;
                letter-spacing:0.2px;">
              Admin Hesabı Yarat →
            </a>
          </div>

          <!-- Link copy -->
          <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;
            padding:12px 16px;margin-bottom:20px;">
            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;font-weight:600;">
              DƏVƏT LİNKİ:
            </p>
            <p style="margin:0;font-size:11px;color:#6b7280;word-break:break-all;">
              ${inviteLink}
            </p>
          </div>

          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
            Bu link <strong>${expiry}</strong> tarixinə qədər etibarlıdır.
            Əgər bu dəvəti siz tələb etməmisinizsə, bu emaili nəzərə almayın.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;border-top:1px solid #e5e7eb;
          padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            © 2026 E-Cədvəl — Universitet Cədvəl Platforması
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}
