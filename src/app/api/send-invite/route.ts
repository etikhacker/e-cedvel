// src/app/api/send-invite/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // ← service role key (public deyil!)
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { email, university_id, university_name } = await req.json();

    if (!email || !university_id) {
      return NextResponse.json({ error: 'Email və universitet tələb olunur.' }, { status: 400 });
    }

    // 1. Token yarat
    const token = randomUUID();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 gün

    // 2. university_invites-ə yaz
    const { error: dbErr } = await supabase.from('university_invites').insert({
      token,
      email,
      university_id,
      used: false,
      expires_at: expires_at.toISOString(),
    });

    if (dbErr) {
      console.error('DB error:', dbErr);
      return NextResponse.json({ error: 'Dəvət yaradılmadı: ' + dbErr.message }, { status: 500 });
    }

    // 3. Dəvət linki
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://e-cedvel.vercel.app';
    const inviteLink = `${baseUrl}/admin/setup?token=${token}`;

    // 4. Email göndər
    const { error: emailErr } = await resend.emails.send({
      from: 'E-Cədvəl <noreply@e-cedvel.vercel.app>',  // ← Resend-də verify edilmiş domain
      to: email,
      subject: `${university_name} — Admin Dəvəti`,
      html: emailTemplate({ email, university_name, inviteLink, expires_at }),
    });

    if (emailErr) {
      console.error('Email error:', emailErr);
      return NextResponse.json({ error: 'Email göndərilmədi: ' + emailErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, invite_link: inviteLink });
  } catch (err: any) {
    console.error('Server error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
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