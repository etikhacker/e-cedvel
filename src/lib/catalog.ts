// src/lib/catalog.ts
//
// Qeydiyyat formasının public kataloq API-sinə müraciət helper-i.
// RLS-ə baxmayaraq universitet/fakültə/qrup siyahılarını qaytarır.

export type University = {
  id: string;
  name: string;
  short_name?: string | null;
  city?: string | null;
};

export type Faculty = {
  id: string;
  name: string;
  university_id: string;
};

export type Group = {
  id: string;
  name: string;
  faculty_id: string;
  university_id?: string | null;
};

async function call<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/public/catalog?${qs}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j.error || '';
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Kataloq sorğusu uğursuz oldu (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function fetchUniversities(): Promise<University[]> {
  const j = await call<{ universities: University[] }>({ type: 'universities' });
  return j.universities ?? [];
}

export async function fetchFaculties(universityId: string): Promise<Faculty[]> {
  const j = await call<{ faculties: Faculty[] }>({
    type: 'faculties',
    university_id: universityId,
  });
  return j.faculties ?? [];
}

export async function fetchGroups(facultyId: string): Promise<Group[]> {
  const j = await call<{ groups: Group[] }>({
    type: 'groups',
    faculty_id: facultyId,
  });
  return j.groups ?? [];
}
