# E-Cədvəl: təhlükəsiz staging hazırlığı və real test planı

Hazırlıq tarixi: 5 noyabr 2026. Workspace: `D:\e-cedvel\audit-work`, branch: `fix/production-hardening`. Audit commit-i `7b242c7` saxlanılıb. Bu sənəd sonrakı setup üçün planıdır; aşağıdakı xarici əməliyyatlar icra edilməyib.

## Cari vəziyyət və sərhəd

Supabase inteqrasiyası ilə görünən layihələr və E-Cədvəl DB branch-ləri yalnız oxuma rejimində yoxlanıb. Ayrı `e-cedvel-staging` layihəsi tapılmadı; mövcud E-Cədvəldə yalnız default `main` var. Başqa təşkilatda/giriş icazəsi olmayan hesabda layihənin mövcudluğunu bu nəticə istisna etmir. Yeni layihə avtomatik yaradılmayıb.

Orijinal `.env.local` məxfi dəyərlər çıxarılmadan yoxlanıb: yalnız `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` və `SUPABASE_SERVICE_ROLE_KEY` var. URL məlum production layihəsinə, açarlar legacy JWT növünə aiddir. **Bu üç dəyərdən heç biri staging üçün köçürülməyib.** Orijinal fayl dəyişməyib.

Yeni `.env.local` Git-ignore daxilindədir. URL qəsdən `https://staging-not-configured.invalid`, bütün açarlar boşdur. Beləliklə staging yaradılanadək real Supabase/Resend bağlantısı yoxdur; bu işlək inteqrasiya konfiqurasiyası deyil. `.env.local`-ı chat, screenshot, commit və ya log vasitəsilə paylaşmayın.

Bu hazırlıqda SQL, migration dry-run/apply, production database yazması, Edge Function deploy, email göndərmə, GitHub push və Vercel deploy edilməyib. Miqrasiyaları işlədən `npm test` də bu mərhələdə yenidən icra edilmir; yalnız offline env yoxlayıcısının ayrıca testləri işlədilir.

## 1. Hansı dəyərlər lazımdır?

| Dəyişən/ayar | Harada istifadə olunur | Staging qərarı |
|---|---|---|
| `STAGING_SUPABASE_PROJECT_REF` | Yeni offline yoxlayıcı | Yeni layihənin ref-i; secret deyil, runtime DB parametri deyil |
| `NEXT_PUBLIC_SUPABASE_URL` | Brauzer, proxy, server, Auth/REST/Storage | Yeni staging URL-i; production URL-i reuse etməyin |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Brauzer və istifadəçi sessiyası ilə server client | Eyni staging layihəsinin publishable key-si; legacy anon mümkündür. Public olması production dəyərinin staging üçün uyğun olması demək deyil |
| `SUPABASE_SERVICE_ROLE_KEY` | Serverdə token inspect, delivery status, yoxlanmış upload | Eyni staging layihəsinin ayrıca secret key-si və ya staging legacy service_role. Production privileged key qadağandır |
| `NEXT_PUBLIC_APP_URL` | Callback, CSRF origin, dəvət linki | Lokal testdə `http://localhost:3000`; hosted staging-də dəqiq HTTPS origin. Production frontend URL-i reuse etməyin |
| `NEXT_PUBLIC_MATERIALS_BUCKET` | Material list/upload/download | `Materials` adı reuse oluna bilər; obyektlər yeni staging layihəsində ayrıca olmalıdır. Avatar bucket adı kodda `avatars`-dır |
| `RESEND_API_KEY` | Next.js `/api/send-invite` | Ayrıca staging sending-only açarı; mümkün olduqda staging göndərən domeninə məhdudlaşdırın |
| `RESEND_FROM_EMAIL` | Dəvət göndərən | Təsdiqlənmiş staging göndərən. Eyni təsdiqli domen ayrıca test ünvanı ilə istifadə oluna bilər, amma göndərmə icazəsi/domain scope yoxlanmalıdır |
| `VERCEL_ENV`, `VERCEL_URL` | Preview CSRF allow-list | Vercel özü təyin edir; lokal fayla production/preview dəyərləri kopyalamayın. Bu mərhələdə deploy yoxdur |
| `NODE_ENV` | Next development/production davranışı | Next əmri təyin edir; staging üçün `NODE_ENV=staging` yaratmayın |
| Auth SMTP host/port/user/password/sender | Supabase Auth signup/recovery emaili | Yalnız staging Dashboard-da. Next.js env-dəki Resend açarı SMTP-ni avtomatik qurmur |
| DB password / `DATABASE_URL` / management access token | Gələcək operator/CLI işi | Next runtime-a lazım deyil. Yeni layihə DB parolu parol menecerində; env və kodda saxlamayın |

Brauzer üçün publishable, server üçün secret key seçimi [Supabase sənədinə](https://supabase.com/docs/guides/getting-started/api-keys) uyğundur. Mövcud env adları dəyişməyib: adında `ANON`/`SERVICE_ROLE` olsa da SDK müvafiq yeni key növünü qəbul edir. Secret key RLS-i keçdiyindən tenant testlərində istifadəçi client-i əvəzinə işlədilməməlidir.

Təkrar istifadə edilən təhlükəsiz hissələr yalnız kod, migration faylları, bucket adları və lokal localhost origin seçimidir. Production Auth istifadəçiləri, sessiyalar, parollar, storage obyektləri və məxfi açarlar staging-ə kopyalanmır.

## 2. Ayrı layihəni özünüz hazırlayın

1. Supabase Dashboard-da uyğun təşkilatı seçin → **New project**. Ad: `e-cedvel-staging`. Mövcud `e-cedvel` layihəsinin settings səhifəsində dəyişiklik etməyin.
2. Ayrı güclü DB parolu yaradıb parol menecerində saxlayın. Region üçün production-a yaxın `eu-west-1` seçilə bilər; plan/region imkanını Dashboard-da yoxlayın. Standart PostgreSQL seçin; experimental engine tələb olunmur.
3. Sağlam/ready vəziyyəti gözləyin. Yeni layihə ID/ref-inin production `samcakpeuxwegyzrlrwp` ilə fərqli olduğunu Dashboard URL-indən təsdiqləyin.
4. **Connect / Settings → API Keys**: staging URL, publishable key və server üçün ayrıca adlandırılmış secret key əldə edin. Dəyərləri yalnız lokal `.env.local`-a daxil edin. Tək URL-i dəyişib köhnə key-i saxlamaq olmaz.
5. Ref-i `STAGING_SUPABASE_PROJECT_REF`-ə daxil edin; Supabase URL formatı `https://<staging-ref>.supabase.co` olmalıdır. Hazırkı checker custom Supabase domenini qəbul etmir.
6. GitHub/Vercel inteqrasiyasını hələ bağlamayın, production data restore etməyin, Edge Function yaratmayın. Yeni staging tətbiqi köhnə `send-invite` Edge Function-a ehtiyac duymur.

## 3. Dashboard-da manual Auth və email ayarları

- **Authentication → Providers/Sign In:** email+password aktiv, email confirmation aktiv. Anonymous sign-ins və istifadə olunmayan OAuth provider-lər açılmasın.
- **Password Security:** minimum 12; plan dəstəkləyirsə leaked-password protection aktiv. Bu UI seçiminin server tərəfidir.
- **URL Configuration:** lokal mərhələdə Site URL `http://localhost:3000`. Redirect allow-list-də eyni host üçün `/auth/callback` və query davamlarının uyğunluğu olmalıdır. Lokal staging-only mərhələdə `http://localhost:3000/auth/callback**` istifadə edilə bilər; faktiki query URL-lərlə yoxlayın. `127.0.0.1` ilə localhost-u qarışdırmayın.
- Recovery URL: `/auth/callback?type=recovery`; invitation təsdiqinin URL-i `/auth/callback?next=` içində URL-encoded `/admin/setup?token=...` saxlayır. Tokeni test hesabatına yazmayın. Gələcək HTTPS staging origin-i yalnız həmin origin üçün allow-list-ə əlavə edin; ümumi `https://**` açmayın. [Redirect sənədi](https://supabase.com/docs/guides/auth/redirect-urls).
- **Email Templates:** əvvəl default PKCE/ConfirmationURL axınını saxlayın. Qeydiyyatı başladığınız brauzerdə email linkini açın. Mövcud custom template yalnız SiteURL-ə aparırsa `next`/recovery davamını itirə bilər; real testdə yoxlayın. Token-hash flow ayrıca dəstəklənir, amma iki üsulu təsadüfi qarışdırmayın.
- **Custom SMTP:** signup və recovery üçün staging SMTP sender və giriş məlumatlarını Dashboard-da qurun. Default SMTP yalnız təşkilatın icazəli ünvanlarına göndərir və sərt limitlidir; ayrıca test email hesabları üçün custom SMTP lazımdır. [SMTP sənədi](https://supabase.com/docs/guides/auth/auth-smtp).
- **Resend:** tətbiq dəvətləri üçün ayrıca staging key, `sending_access` və uyğun domain scope; göndərən domenin DNS təsdiqini tamamlayın. Mümkünsə Auth SMTP üçün başqa key istifadə edin ki, ayrı ləğv edilə bilsin. [Resend key icazələri](https://resend.com/docs/api-reference/api-keys/create-api-key).
- **Data API:** `public` istifadə olunur, `private` exposed schemas siyahısında olmamalıdır. API grants və RLS miqrasiyalarla birlikdə yoxlanacaq.

## 4. Üç miqrasiyanın staging uyğunluğu

**Nəticə: statik olaraq standart Supabase/PostgreSQL və nəzərdə tutulan başlanğıc schema ilə uyğundur; mövcud olmayan staging-də canlı uyğunluq təsdiqlənməyib.** Bu mərhələdə fayllar dəyişdirilməyib və heç biri icra edilməyib. Əvvəlki 28 test nəticəsi köhnə auditin lokal PostgreSQL sübutudur, yeni hosted layihə testi deyil.

| Fayl | Ön şərt / diqqət |
|---|---|
| `20261105151505_authorization_and_invites.sql` | 10 tətbiq cədvəli və original sütunlar mövcud olmalıdır. Native `auth.users`, `auth.uid()`, anon/authenticated/service_role rolları, postgres DDL səlahiyyəti. Existing function/policy adları ilə toqquşma olmamalıdır |
| `20261105151513_scheduling_integrity.sql` | Birinci migration uğurlu; `btree_gist` əlçatan. Qruplar tenantlı, vaxt/day/week/subgroup dəyərləri etibarlı, overlap yoxdur. `university_id` sütunları əvvəlki təkrar tətbiqdən qalmamalıdır |
| `20261105151520_storage_isolation.sql` | Native `storage.objects.owner_id` text, buckets-in public/size/MIME sütunları; `avatars` və `Materials` əvvəlcədən mövcud. `UPDATE` bucket yaratmır; bucket yoxdursa səssiz 0 sətir dəyişə bilər |

Boş layihədə üç migration təkbaşına işləməz: **əvvəl `supabase/bootstrap.sql`** tələb olunur. Bootstrap tətbiq schema-sını və iki bucket-i yaradır, Auth/Storage sistem schema-larını yaratmır. Mövcud cədvəllərə malik layihədə bootstrap işlədilməməlidir. Fresh staging-də bucket-ləri əvvəl Dashboard-dan yaratmayın; bootstrap-da eyni ID INSERT-i toqquşar.

`pgcrypto` üçün `extensions.gen_random_bytes(integer)` lazımdır. `CREATE EXTENSION IF NOT EXISTS` artıq başqa schema-da olan extension-u köçürmür; preflight nəticəsində `pgcrypto` varsa `extensions`-də olmalıdır. `btree_gist` yoxdursa ikinci migration onu `extensions`-də qurur; əvvəl varsa onun operator class-ları `public, extensions` search_path-ində görünməlidir. Tətbiq privileged açarı ilə DDL icra etməyin; gələcək apply postgres/operator səlahiyyəti ilə olmalıdır.

Hazırlanmış `supabase/staging-preflight.sql` yalnız metadata SELECT-ləridir və **işlədilməyib**. Yeni layihə hazır olduqdan sonra ayrıca icazəli mərhələdə Dashboard-da onun ref-ini yoxlayaraq nəticəsini alın: native rollar/schema-lar, extension yeri, Storage sütunları, əvvəlki tətbiq cədvəl/funksiya toqquşmaları.

Son PostgreSQL minor dəyişiklikləri də nəzərdən keçirildi. Buradakı GiST sütunları UUID/text/int-range-dir, float/NaN yoxdur; pgcrypto yalnız random byte yaradır, legacy PGP cipher/ltree/custom selectivity operator istifadə olunmur. Buna görə həmin konkret dəyişikliklər üzrə kodda blocker görünmür. Bu statik nəticədir. [Supabase PostgreSQL changelog](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes).

Sonrakı migration mərhələsi üçün sıra (hazırda icra etməyin):

1. Yeni staging ref-i, backup/snapshot və preflight nəticəsini təsdiqləyin.
2. Yalnız tam boş tətbiq schema-sında bootstrap; sonra üç migration faylı timestamp sırası ilə.
3. Hər fayl ayrıca tranzaksiyadır. İkinci fail olsa birinci artıq tətbiq edilə bilər. Bütün faylları kor təkrar işlətməyin; migration history ilə faktiki schema-nı tutuşdurun.
4. SQL Editor ilə tətbiq etsəniz CLI migration history-ni uyğunlaşdırmadan sonra `db push` işlətməyin. CLI istifadə edilsə versiyasını pin edin, `--help` ilə yoxlayın və `--remote=<staging-ref>` açıq yazın. [CLI v3 davranışı](https://supabase.com/changelog/supabase-cli-v3). Bu hazırlıqda CLI link/push/dry-run yoxdur.
5. `supabase/verify.sql`, advisor və real istifadəçi RLS testləri. `NOT VALID` FK/check-lərin ayrıca validation nəticəsini qeyd edin; yeni yazmalar onsuz da yoxlanılır.

## 5. Storage, ilk admin və test məlumatı

Migration mərhələsindən sonra yalnız staging Dashboard-da:

- Storage: `avatars` public, 2 MB; `Materials` private, 4 MB; migration-dakı MIME allow-list. Yeni obyektlər serverdə verified user UUID qovluğuna yazılır. Bucket adları böyük/kiçik hərfə həssasdır.
- İlk superadmin üçün ayrıca test email ilə Auth istifadəçisi yaradın/təsdiqləyin. Onun UUID-sini `university_admins` cədvəlinə Dashboard operatoru kimi `role=superadmin`, `university_id=NULL` ilə əlavə edin. Bu bootstrap təyinatı brauzer signup metadata-sından edilməməlidir. Admin sirləri və test parolları repoya yazılmır.
- Sonra superadmin UI-dan iki süni universitet A/B, fakültələr və qruplar yaradın; digər adminləri normal dəvət axını ilə qoşun. Test email-lərinə çıxışınız olmalıdır. Production tələbə siyahısı import etməyin.
- Hər universitet üçün `semester_start` bazar ertəsi və `first_week=ust/alt` ayarı; test həftəsi və gözlənilən nəticəni qeyd edin.

## 6. Lokal konfiqurasiya yoxlaması və başlatma

```sh
npm run check:staging
npm run test:staging-config
npm run dev:staging
```

İlk əmr hazırkı boş `.env.local` ilə exit 1 qaytarmalıdır; bu gözlənilən qoruma nəticəsidir. Dəyərlər düzgün doldurulduqdan və DB ayrıca hazırlandıqdan sonra `dev:staging` yoxlayıcını keçib Next development serverini açır. Adi `npm run dev` bu yoxlayıcını məcbur etmir.

Checker şəbəkəyə qoşulmur, SQL/email göndərmir və heç bir key dəyəri çap etmir. Next-in env precedence qaydasını istifadə edir: shell dəyişənləri fayldan üstün ola bilər. Hazırlıq anında cari shell-də bu layihəyə aid env override tapılmadı. Legacy JWT ref/role statik yoxlanır; signature/aktivlik təsdiqlənmir. Opaque publishable/secret key-in project binding-i lokaldan müəyyən edilmir — eyni staging Dashboard-dan götürülməsi operatorun yoxlamasıdır.

`npm run check:staging -- --production` build/start rejimi üçün HTTPS origin tələb edir. Mövcud invite API production rejimində HTTP localhost-u qəbul etmir; localhost real-email testi üçün `dev:staging` istifadə edin. Sonrakı hosted production-build staging testi üçün ayrıca HTTPS staging origin-i tələb olunur. Bu mərhələdə HTTPS tunel və ya deployment yaradılmayıb.

Real Supabase testlərini `npm run test:e2e` ilə qarışdırmayın: mövcud Playwright suite lokal mock Auth/REST üçündür və test build tələb edir. `.next` hazırda auditin mock build-i ola bilər; real staging üçün lazımi env ilə yenidən build/dev başladın. Staging secret-lərini mock prosesə və ya GitHub workflow-a köçürməyin.

Git yoxlaması: `git check-ignore -v .env.local` ignore qaydasını göstərməlidir; `git ls-files -- .env.local` boş qalmalıdır. Yalnız `.env.example` version control üçündür. `.env.staging.local` Next-in standart avtomatik environment faylı deyil; bu workspace `.env.local` istifadə edir.

Hazırlıqda faktiki yoxlamalar: offline env testləri **4/4**, lint və TypeScript keçdi. Boş staging konfiqurasiyası gözlənildiyi kimi exit 1 ilə rədd edildi. Original env SHA-256 dəyişməyib; onun hər iki key-sinin production ref/rol uyğunluğu yalnız boolean nəticələrlə yoxlandı. Yeni fayllarda həmin key-lərin olmadığı, `.env.local`-ın Git-də izlənmədiyi, tətbiq/UI kodunun, bootstrap və üç migration-ın audit commit-indən dəyişmədiyi təsdiqləndi. Bunlar real Supabase inteqrasiya testləri deyil.

Bu hazırlıqda dəyişən izlənən fayllar `.env.example`, `README.md`, `docs/DEPLOYMENT.md`, `package.json`; yeni paylaşılabilən fayllar bu sənəd, `scripts/check-staging-env.mjs`, onun offline test faylı və `supabase/staging-preflight.sql`-dır. `.env.local` yalnız lokal, ignored fayldır. Yeni hazırlıq dəyişiklikləri ayrıca commit edilməyib; audit commit-i yerindədir.

## 7. Real inteqrasiya qəbul siyahısı — hamısı hələ gözləyir

| Sınaq | Gözlənilən nəticə / sübut |
|---|---|
| Tələbə A qeydiyyat + real email | Link eyni brauzerdə açılır, normal təsdiq dashboard-a gedir; seçilmiş qrup, profil və refresh düzgündür |
| Password recovery | Yalnız recovery reset səhifəsinə gedir; yeni parolla giriş, köhnə parolla uğursuzluq |
| Logout/sessiya yenilənməsi | Protected route logout-dan sonra bağlanır; session refresh profil və rol davranışını saxlayır |
| Superadmin → admin A dəvəti | Staging göndərənindən real email; email-confirmed hesab qəbul edir; doğru tenant rolu; used status yalnız uğurdan sonra |
| Invalid/expired/reused/wrong-email token | Qəbul rədd edilir, rol yaranmır. Tokenlərin özünü loga yazmadan status saxlanır |
| Anon/student/admin dəvət cəhdi | Müvafiq 401/403; superadmin malformed/oversize input 400/413; limitdən artıq sorğu 429 (yalnız test ünvanları) |
| RLS: tələbə və admin A/B | Birbaşa SDK/REST, **istifadəçi sessiyası ilə**. Student müraciət/token/admin yazısına çata bilmir; admin A B tenantına read/write edə bilmir; başqa profilə update olmaz |
| Profil/qiymət/qeyd/davamiyyət | Save + reload; eyni brauzerdə hesab B A-nın qeydlərini görmür. Rədd edilmiş yazmada uğur göstərilmir |
| Cədvəl | Şənbə/üst-alt/tam-altqrup; boş qrupda IT24 fallback yoxdur; admin dəyişməsi fokus və ya 60 saniyədə görünür |
| Vaxt və concurrency | 09:00–10:30 / 10:00–11:30 teacher/room/group konflikti rədd; 10:30–12:00 adjacency keçir. İki ayrı DB bağlantısında paralel eyni resurs INSERT-dən biri uğursuz olmalıdır |
| Upload/download/delete | Avatar 2 MB, material 4 MB; forged MIME/ölçü rədd; public material URL açılmır; öz signed download işləyir; başqa hesabın yolunu read/delete edə bilmir |
| Email/DB xətası | Nəzarətli staging failure sınağında saxta uğur olmur; pending/failed status operator tərəfindən uzlaşdırılır |
| PWA/export | CSV/print düzgün, şəxsi cache yoxdur; iki hesab/offline fallback; install/notification üçün real HTTPS build yoxlaması ayrıca |

Sübut formatı: test ID, vaxt, staging ref, tətbiq commit-i, gözlənilən/faktiki nəticə, pass/fail, redaktə olunmuş screenshot. Key, Authorization header, cookie, password və dəvət tokenini sübut fayllarına yazmayın. Mock test nəticəsini bu cədvəldə real PASS kimi qeyd etməyin.

Növbəti addım: ayrı staging layihəsini yaradın və Dashboard/env məlumatlarını lokal tamamlayın. Bundan sonra ref və preflight yoxlanaraq ayrıca icazəli migration mərhələsinə keçilə bilər. Production və ya Vercel dəyişiklikləri bu hazırlığın tərkibi deyil.
