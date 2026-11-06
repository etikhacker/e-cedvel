# E-Cədvəl

Universitetlər üçün Next.js 16, React 19 və Supabase əsaslı cədvəl tətbiqi. Mövcud dizayn qorunub; autentifikasiya, tenant icazələri və cədvəl bütövlüyü server və PostgreSQL səviyyəsində yoxlanır.

**6 noyabr 2026 qərarı:** mövcud Supabase layihəsi saxlanılır, ayrıca staging layihəsi yaradılmır. Canlı keçidin yoxlanmış nəticələri, backup və açıq məsələlər [LIVE-ROLLOUT.md](docs/LIVE-ROLLOUT.md) sənədindədir. Aşağıdakı staging əmrləri əvvəlki alternativ hazırlıq üçündür, production keçidi üçün istifadə edilməməlidir.

## Quraşdırma

Node.js **22 LTS** tövsiyə edilir (paket 22–24 aralığını qəbul edir). Repo kökündə:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Windows PowerShell-də ikinci əmr: `Copy-Item .env.example .env.local`. Dəyişənləri öz development Supabase layihənizlə doldurun. İstehsal bazasında test məlumatı yaratmayın.

**Hazırlanmış audit workspace-də `.env.local` artıq mövcuddur; üzərinə kopyalamayın.** Staging layihəsi tapılmadığından açarlar boş, Supabase URL-i `.invalid` kimi saxlanılıb. Orijinal production açarları köçürülməyib. Fayl doldurulana qədər tətbiqin başlamaması gözləniləndir. Layihə yaratma, Dashboard ayarları, migration uyğunluğu və real test planı: [STAGING.md](docs/STAGING.md).

Staging dəyərlərini lokal doldurduqdan sonra `npm run check:staging`, sonra `npm run dev:staging`. Yoxlama şəbəkəyə qoşulmur, açarları göstərmir və tanınan production ref-ini rədd edir. Opaque açarların hansı layihəyə aid olduğunu Dashboard-da yoxlamaq yenə tələb olunur. Normal `npm run dev` bu əlavə yoxlamanı avtomatik çağırmır.

Mövcud baza üçün `supabase/migrations/` fayllarını ardıcıllıqla staging-də tətbiq edin. **Boş** Supabase layihəsində əvvəl `supabase/bootstrap.sql` tələb olunur; bu fayl mövcud bazada işlədilməməlidir. Tam addımlar: [yerləşdirmə təlimatı](docs/DEPLOYMENT.md).

## Mühit dəyişənləri

| Dəyişən | Təyinat |
|---|---|
| STAGING_SUPABASE_PROJECT_REF | Yalnız lokal staging yoxlayıcısı; ayrıca staging layihəsinin ref-i |
| NEXT_PUBLIC_SUPABASE_URL | Supabase layihəsinin API URL-i |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Brauzer üçün anon/publishable açar |
| NEXT_PUBLIC_APP_URL | Dəqiq sayt origin-i; production-da HTTPS; dəvət URL-i və CSRF yoxlaması |
| NEXT_PUBLIC_MATERIALS_BUCKET | Mövcud material bucket-inin böyük/kiçik hərfə həssas adı; standart Materials |
| SUPABASE_SERVICE_ROLE_KEY | Yalnız server; eyni staging layihəsinin secret key-si və ya legacy service_role; dəyişən adı uyğunluq üçün saxlanılıb |
| RESEND_API_KEY | Yalnız server; email göndərmə |
| RESEND_FROM_EMAIL | Resend-də təsdiqlənmiş domenə aid göndərən |
| MAIL_PROVIDER | `resend` (standart) və ya `smtp`; domen yoxdursa mövcud Gmail SMTP istifadə edilə bilər |
| SMTP_HOST / SMTP_PORT | SMTP host və TLS portu, Gmail üçün `smtp.gmail.com` və `587` |
| SMTP_USER / SMTP_PASSWORD | Yalnız server; Gmail ünvanı və tətbiq parolu, adi hesab parolu deyil |
| SMTP_FROM_EMAIL | SMTP hesabına aid göndərən ünvanı |
| VERCEL_ENV / VERCEL_URL | Vercel özü təyin edir; preview origin yoxlaması |

Service-role və Resend açarlarını heç vaxt `NEXT_PUBLIC_` adı ilə verməyin. Real sirlər repoda saxlanılmır.

Tətbiq REST/Auth/Storage SDK-larını istifadə edir; `DATABASE_URL`, DB parolu və Supabase management access token-i runtime üçün tələb olunmur. Signup/recovery SMTP ayarları Supabase Dashboard-da ayrıca edilir. Next.js-dəki `RESEND_API_KEY` yalnız tətbiqin admin dəvət emailini göndərir.

## Yoxlamalar

```sh
npm run lint
npm run typecheck
npm test
npm audit
npm run build
npx playwright install chromium
npm run test:e2e
```

E2E üçün build **test** dəyişənləri ilə hazırlanmalıdır:
`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54391`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key`,
`NEXT_PUBLIC_APP_URL=http://127.0.0.1:3100`.
Bu build-i production-a yerləşdirməyin. Test konfiqurasiyası yalnız yerli Auth/REST stand-in xidmətini başladır. SQL testləri PGlite/PostgreSQL üzərində real RLS və exclusion constraints işlədir; bunlar canlı Supabase Auth/email testinin əvəzi deyil.

GitHub Actions lint, TypeScript, unit/SQL testləri, dependency auditi, build və Chromium testlərini icra edir. Workflow repoya göndərilməyənədək GitHub-da işləməyib.

## İstifadə və məhdudiyyətlər

- Tələbə profili, qeydlər, qiymətlər və davamiyyət Supabase-də saxlanılır.
- Cədvəl yalnız seçilmiş qrupun bazadakı qeydlərindən yaranır. Yenilənmə: səhifəyə fokus qayıdanda və hər 60 saniyədə.
- Üst/alt həftə üçün `universities.semester_start` və `first_week` konfiqurasiyası tələb olunur. Hesablamalar Asia/Baku tarixindən istifadə edir.
- Bildirişlər tətbiq açıq və brauzer icazəsi aktiv olduqda işləyir. Tətbiq bağlı olduqda işləyən push backend yoxdur.
- İxrac UTF-8 **CSV** və brauzerin **çap pəncərəsidir**. Native XLSX/PDF generatoru yoxdur.
- Avatar: PNG/JPEG/WebP, 2 MB. Material: PDF, uyğun Office formatları və bu şəkillər, 4 MB. Materiallar şəxsi bucket-dədir, linklər 5 dəqiqəlikdir.
- Köhnə unscoped localStorage məlumatları avtomatik hesaba birləşdirilmir: onların sahibini müəyyən etmək mümkün deyil. Mövcud bazadakı qiymətlər qorunur.
- Statik IT24 məlumatı yalnız `schedule-data.ts` demo məlumatıdır; real dashboard onu import edib istifadə etmir.

[Audit hesabatı](docs/AUDIT-AZ.md) · [Baza və icazələr](docs/DATABASE.md) · [Yerləşdirmə](docs/DEPLOYMENT.md)

CSS üçün orijinal shadcn 3.8.5 faylı `src/app/vendor/` daxilində MIT lisenziyası ilə saxlanılıb. CLI tətbiqə lazım olmadığı üçün çıxarılıb.
