-- supabase/public_catalog_policies.sql
--
-- Qeydiyyat formasi (anon istifadeci) universitet/fakulte/qrup
-- siyahisini oxuya bilsin deye RLS policy-leri.
--
-- Supabase Dashboard -> SQL Editor -> "New query" -> yapishdirib Run edin.

-- 1) Universities
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read universities" ON universities;
CREATE POLICY "Public read universities"
  ON universities
  FOR SELECT
  USING (is_active = true);

-- 2) Faculties
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read faculties" ON faculties;
CREATE POLICY "Public read faculties"
  ON faculties
  FOR SELECT
  USING (true);

-- 3) Groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read groups" ON groups;
CREATE POLICY "Public read groups"
  ON groups
  FOR SELECT
  USING (true);

-- 4) (optional) schedule_lessons icinden subqrup yoxlamasi anon-a aciq olsun,
--    yoxsa login sehifesindeki "subgroup" hissesi islemeyecek.
ALTER TABLE schedule_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read schedule_lessons subgroup" ON schedule_lessons;
CREATE POLICY "Public read schedule_lessons subgroup"
  ON schedule_lessons
  FOR SELECT
  USING (true);

-- 5) muracietler (landing page form submissions) — anon yaza bilsin,
--    admin/logged-in user ise oxuya, statusu deyise ve sile bilsin.
ALTER TABLE muracietler ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon insert muracietler" ON muracietler;
CREATE POLICY "Anon insert muracietler"
  ON muracietler
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read muracietler" ON muracietler;
CREATE POLICY "Authenticated read muracietler"
  ON muracietler
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated update muracietler" ON muracietler;
CREATE POLICY "Authenticated update muracietler"
  ON muracietler
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated delete muracietler" ON muracietler;
CREATE POLICY "Authenticated delete muracietler"
  ON muracietler
  FOR DELETE
  USING (auth.role() = 'authenticated');
