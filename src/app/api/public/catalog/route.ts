// src/app/api/public/catalog/route.ts
//
// Public kataloq API — qeydiyyat forması üçün universitet/fakültə/qrup
// siyahılarını RLS-ə baxmayaraq qaytarır. Yalnız oxumaq üçündür.
//
// Tələb olunur: .env.local-da  SUPABASE_SERVICE_ROLE_KEY  dəyişəni
//
// Query nümunələri:
//   GET /api/public/catalog?type=universities
//   GET /api/public/catalog?type=faculties&university_id=<uuid>
//   GET /api/public/catalog?type=groups&faculty_id=<uuid>

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY təyin edilməyib. .env.local-ə əlavə edin.'
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || '').toLowerCase();
    const universityId = searchParams.get('university_id');
    const facultyId = searchParams.get('faculty_id');

    if (!type) {
      return NextResponse.json(
        { error: 'type parametri tələb olunur (universities|faculties|groups)' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    if (type === 'universities') {
      const { data, error } = await supabase
        .from('universities')
        .select('id, name, short_name, city')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return NextResponse.json({ universities: data ?? [] });
    }

    if (type === 'faculties') {
      if (!universityId) {
        return NextResponse.json(
          { error: 'university_id tələb olunur' },
          { status: 400 }
        );
      }
      const { data, error } = await supabase
        .from('faculties')
        .select('id, name, university_id')
        .eq('university_id', universityId)
        .order('name', { ascending: true });
      if (error) throw error;
      return NextResponse.json({ faculties: data ?? [] });
    }

    if (type === 'groups') {
      if (!facultyId) {
        return NextResponse.json(
          { error: 'faculty_id tələb olunur' },
          { status: 400 }
        );
      }
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, faculty_id, university_id')
        .eq('faculty_id', facultyId)
        .order('name', { ascending: true });
      if (error) throw error;
      return NextResponse.json({ groups: data ?? [] });
    }

    return NextResponse.json(
      { error: `Naməlum tip: ${type}` },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gözlənilməz xəta';
    console.error('[public/catalog] xəta:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
