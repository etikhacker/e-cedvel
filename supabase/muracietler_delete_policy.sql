-- supabase/muracietler_delete_policy.sql
--
-- YALNIZ müraciətləri silmək üçün lazım olan RLS policy.
-- Əgər /admin/muracietler səhifəsində "Sil" düyməsi
-- sıxılanda "Silmə əməliyyatı yerinə yetirilmədi"
-- xətası alırsınızsa, bu SQL-i Supabase SQL Editor-də Run edin.
--
-- Supabase Dashboard -> SQL Editor -> New query -> yapışdırın -> Run

ALTER TABLE muracietler ENABLE ROW LEVEL SECURITY;

-- Əvvəlcə mövcud policy-ləri təmizləyirik (təkrar işlətmək olsun deyə)
DROP POLICY IF EXISTS "Anon insert muracietler" ON muracietler;
DROP POLICY IF EXISTS "Authenticated read muracietler" ON muracietler;
DROP POLICY IF EXISTS "Authenticated update muracietler" ON muracietler;
DROP POLICY IF EXISTS "Authenticated delete muracietler" ON muracietler;
DROP POLICY IF EXISTS "Public insert muracietler" ON muracietler;
DROP POLICY IF EXISTS "Public read muracietler" ON muracietler;

-- Anon (qeydiyyatsız) istifadəçi landing page-dən müraciət göndərə bilər
CREATE POLICY "Public insert muracietler"
  ON muracietler
  FOR INSERT
  WITH CHECK (true);

-- Login olmuş istifadəçi (admin) müraciətləri oxuya bilər
CREATE POLICY "Authenticated read muracietler"
  ON muracietler
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Login olmuş istifadəçi statusu dəyişə bilər (Qəbul / Rədd)
CREATE POLICY "Authenticated update muracietler"
  ON muracietler
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Login olmuş istifadəçi müraciəti silə bilər
CREATE POLICY "Authenticated delete muracietler"
  ON muracietler
  FOR DELETE
  USING (auth.role() = 'authenticated');
