# E-Cədvəl — audit və düzəliş hesabatı

Tarix: 5 noyabr 2026. Repo: https://github.com/etikhacker/e-cedvel. Başlanğıc commit: `49160fc15e8f78627a2823c443de1636106bc1cd`.

Kod, təhlükəsizlik miqrasiyaları və testlər yerli repoda hazırlanıb. **Canlı Supabase icazələri hələ dəyişməyib. GitHub push, SQL tətbiqi, Edge Function yeniləməsi və Vercel production deploy edilməyib.** Buna görə production üçün “bütün kritik risklər bağlanıb” nəticəsi çıxarmaq olmaz. Aşağıdakı düzəlişlər birlikdə tətbiq edilməli və real Auth/email ilə qəbul testindən keçməlidir.

İş qovluğu `D:\e-cedvel\audit-work`-dur. İlkin `e-cedvel.app` qovluğunun remote-u başqa repo (`it24-app`) olduğundan ona toxunulmadan istənilən repo ayrıca klonlanıb. GitHub inteqrasiyası ilə repo/commit, Supabase inteqrasiyası ilə canlı layihənin schema, RLS, Storage, advisor və Edge Function metadatası yoxlanıb. Canlı bazada yalnız oxuma sorğuları işlədilib; istifadəçi məlumatı silinməyib və production-da test hesabı yaradılmayıb.

## 1. Başlanğıcda təsdiqlənmiş problemlər

| Ciddilik | Problem və sübut yeri | Hazırlanmış düzəliş |
|---|---|---|
| Kritik | `src/app/api/send-invite/route.ts`: server autentifikasiyası və superadmin yoxlaması olmadan service-role əməliyyatı | Verified `getUser`, DB rolu, input/Origin/body limitləri, server-only açarlar |
| Kritik | Canlı `university_admins` INSERT policy-si `WITH CHECK true` idi | Özünə rol verməyə qarşı restrictive RLS; yalnız superadmin yazır |
| Kritik | Canlı `university_invites` SELECT policy-si tokenləri açırdı | Client grant-ları geri alınır, RLS deny, hash əsaslı yeni axın; köhnə linklər qəbul edilmir |
| Yüksək | Canlı müraciət cədvəlinə bütün authenticated istifadəçilərin oxu/yaz/sil icazəsi | Platforma müraciətlərinin idarəsi yalnız superadmin |
| Yüksək | Canlı universitet yazma siyasətində tenant sərhədi yox idi | Rol/tenant RLS və composite FK-lar |
| Yüksək | Materials public idi, anon geniş Storage əməliyyatlarına malik idi | Private bucket, istifadəçi qovluğu, serverdə yoxlanmış upload, signed download |
| Yüksək | Canlı `send-invite` Edge Function yalnız JWT gateway yoxlamasına güvənib istənilən email/HTML göndərə bilirdi | Köhnə relay üçün 410 replacement hazırlanıb; ayrıca deploy lazımdır |
| Yüksək | Admin setup brauzerdən rol və dəvət vəziyyətini ayrıca yazırdı | Email-confirmed, email-bound, row-lock ilə atomik RPC |
| Yüksək | `findConflicts` yalnız eyni vaxt mətnini tuturdu; subgroup fərqi müəllim/otaq konfliktini də gizlədirdi | Qismən overlap yoxlaması və DB exclusion constraints |
| Orta | Profil kodu canlı schema-da olmayan sahələrə güvənirdi; qrup bərpası/localStorage hesab izolyasiyası problemləri | DB-first profil, real sütun adları, qeydlərin hesaba bağlı saxlanması |
| Orta | Qrupda cədvəl olmadıqda IT24 fallback, sərt semestr tarixi və statik bildirişlər | Real DB cədvəli, ayrıca empty/error vəziyyəti, universitet semestr ayarı |
| Orta | `auth/calback` yazılışı və adi təsdiqin reset səhifəsinə getməsi | Düzgün callback, köhnə yol üçün compatibility, recovery ayrılması |
| Orta | Service worker şəxsi GET cavablarını keşləyirdi | Yalnız açıq offline shell resursları, şəxsi səhifə/API keşinin olmaması |
| Orta | CSV formula və print HTML injection | Formula neytrallaşdırması, HTML escaping, təhlükəsiz fayl adları |
| Orta | Xətalı yazmalardan sonra uğur, yoxlanmayan Supabase nəticələri | Error/loading handling, sıfır təsirlənmiş sətir yoxlaması, təkrar submit qoruması |
| Orta | Superadmin dəvət forması açıq fonda ağ mətn göstərirdi | Mövcud mövzu rəngləri ilə kontrast düzəlişi; layout qorunub |

Dependency başlanğıc auditi **48 zəiflik** qaytardı: 2 kritik, 25 yüksək, 16 orta, 5 aşağı. Başlanğıc lint və TypeScript keçdi; build `.env` olmadan invite modulunun import vaxtında Supabase URL tələb etməsi səbəbindən dayandı. Mövcud avtomatlaşdırılmış test dəsti yox idi.

Canlı read-only preflight nəticəsində qrup–fakültə uyğunsuzluğu, profil–qrup tenant uyğunsuzluğu, qrupsuz dərs, yanlış vaxt formatı və müəyyən edilən dərs konflikt cütləri **0** idi. Bu snapshot gələcək deploy anında yenidən yoxlanmalıdır. Advisor leaked-password protection ayarının deaktiv olduğunu göstərdi; advisor nəticəsinin sakit olması xüsusi RLS qaydalarının təhlükəsiz olduğunu sübut etmir.

## 2. Auth, dəvət və icazələr

- `@supabase/ssr` brauzer və server cookie axını; proxy sessiyanı yeniləyir, protected route-larda `getUser` ilə istifadəçini yoxlayır. Redirect-də yenilənmiş cookie-lər qorunur.
- Dashboard və admin server giriş nöqtələri ayrıca auth/rol yoxlayır. `/admin/muracietler` yalnız superadmin üçündür. Universitet admininin mövcud ayrıca interfeysi `/admin` seçiminə bağlanıb.
- Metadata rol və tenant idarəetmə icazəsi mənbəyi deyil. RLS brauzer filtrindən asılı olmadan əməliyyatları məhdudlaşdırır.
- Dəvət: 32 random bayt, bazada SHA-256 hash, 7 gün müddət, eyni aktiv email üçün duplicate qoruması, yaradana görə davamlı **10/saat** limit və transaction advisory lock.
- Universitetin adı/id-si serverdə DB-dən yoxlanır. Email HTML escape edilir. Resend sender env ilə təsdiqli domendən gəlməlidir. Göndərmə statusları `pending/sent/failed`; email/DB xətasında saxta uğur verilmir.
- Tokenin yoxlanması serverdədir. Qəbul RPC-si `auth.users.email_confirmed_at`, email uyğunluğu, son tarix, status və istifadəni yoxlayır. Rol təyinatı və `used` dəyişməsi eyni tranzaksiyadadır. Replay rədd edilir.
- PKCE code və uyğun token-hash callback dəstəklənir. Adi təsdiq dashboard-a; recovery reset-password-a; invitation davamı yalnız sərt allow-list-dən keçir. Köhnə `/auth/calback` saxlanılıb.
- Yeni parol UI minimumu 12-dir; Supabase Dashboard-da da eyni server ayarı tətbiq edilməlidir. Logout xətaları yoxlanır. Şəxsi cavablarda no-store, invitation/callback-də no-referrer var.

## 3. Cədvəl və məlumat bütövlüyü

Dashboard yalnız seçilmiş qrupun `schedule_lessons` qeydlərini göstərir. Cədvəli olmayan qrup boş vəziyyət alır; DB xətası boş cədvəl kimi təqdim edilmir. Fokus qayıdanda və 60 saniyəlik intervalda yenilənir. Şənbə, xronoloji sıralama və həftə/altqrup filtrləri qorunub.

Vaxtlar `HH:MM-HH:MM` formatında və başlanğıc < son olmalıdır. 09:00–10:30 ilə 10:00–11:30 toqquşur; 10:30-da bitən ilə həmin anda başlayan toqquşmur. Müəllim/otaq eyni universitetin bütün qrupları üzrə yoxlanır. Altqrup fərqi yalnız qrup konfliktinə təsir edir. Üst/alt həftə ayrı intervaldır.

DB trigger tenantı qrupdan çıxarır. Üç GiST exclusion constraint müəllim, otaq və qrup konfliktini bazada rədd edir. Bu qoruma birbaşa REST yazmasına da tətbiq olunur. Lokal PostgreSQL testləri constraint-ləri işlədib rədd nəticəsini yoxlayır; iki ayrı bağlantı ilə canlı paralellik testi hələ yoxdur.

Semestr `universities.semester_start` və `first_week` sahələrindən gəlir, Asia/Baku üzrə hesablanır. Ayar yoxdursa həftə təxmin edilmir. Xatırlatmalar DB cədvəlini və kanal seçimlərini istifadə edir; dedup açarı hesab/gün/dərs/kanal ilə ayrılıb. Brauzer bağlı olduqda push göndərən backend yoxdur.

## 4. Profil, Storage, export və PWA

- Profil real `name/photo_url/group_id/saved_grades/saved_details/absences` sütunları ilə işləyir. Yeni `notes/notification_settings` sahələri əlavə edilir. Mövcud qiymətlər və şəkil URL-ləri qorunur.
- Qeydlər ümumi localStorage-dan oxunmur. Profil yazmaları bir tab daxilində növbələnir; uğur yalnız DB yazısından sonra göstərilir. Başqa hesabın qeydləri görünmür. Köhnə sahibsiz local məlumat avtomatik hesaba aid edilmir.
- Avatar 2 MB, material 4 MB; MIME allow-list və fayl imzası yoxlanır, multipart sorğu oxunarkən ölçü limitlənir. Server verified user ID-si ilə UUID-li yol yaradır. Birbaşa Storage INSERT/UPDATE bloklanır. Avatarlar köhnə URL-lər üçün public qalır.
- Materiallar private olur, endirmə zamanı təzə 5 dəqiqəlik signed URL yaradılır. Adlar saxlanır, “Digər” materiallar da göstərilir; yükləmə/silmə xətaları görünür. Tam antivirus analizi tətbiq edilməyib.
- CSV UTF-8 BOM, escaping və formula injection qoruması alıb. Çap HTML-də bütün dəyişənlər escape edilir; blocked popup xətası göstərilir. UI **CSV** və **PDF/Çap** deyir; native XLSX/PDF yaradıldığı iddia edilmir.
- `next-pwa` çıxarılıb, bir əl ilə idarə olunan service worker saxlanılıb. Cache yalnız offline.html/manifest/icon resursları üçündür. Aktivləşmədə köhnə cache-lər təmizlənir; auth/API/Storage/RSC cavabları keşlənmir. Offline səhifədə şəxsi cədvəl yoxdur.
- Mövcud səhifələr, rəng sistemi və layout əsasən saxlanıb. Lokal screenshot-larda login 375/1280, dashboard 375/1280 və hər iki admin ekranı yoxlanıb; bu tam accessibility və bütün cihazlar üzrə audit deyil.

## 5. SQL və paket dəyişiklikləri

| Fayl | Məqsəd |
|---|---|
| `supabase/migrations/20261105151505_authorization_and_invites.sql` | RLS, rol/hash/RPC, profil və semestr sahələri, tenant FK-ları |
| `supabase/migrations/20261105151513_scheduling_integrity.sql` | Vaxt və həftə/altqrup yoxlamaları, tenant trigger, üç exclusion constraint, fənn tenantı |
| `supabase/migrations/20261105151520_storage_isolation.sql` | Private Materials, yol icazələri, MIME/ölçü limitləri, direct upload qadağası |
| `supabase/bootstrap.sql` | Yalnız boş Supabase layihəsi üçün ilkin schema; mövcud bazada işlədilmir |
| `supabase/verify.sql` | Read-only preflight və tətbiqdən sonrakı yoxlama |
| `supabase/functions/send-invite/index.ts` | Köhnə email relay-i üçün 410 replacement |

Miqrasiyalar CLI ilə yaradılmış ardıcıl fayllardır; hər fayl ayrıca tranzaksiyadır. Köhnə permissive siyasətlər kor-koranə silinmir, restrictive qoruma ilə kəsişdirilir. RLS söndürülmür. Legacy raw token qeydləri saxlanır, lakin yeni axında işləmirlər. `NOT VALID` constraint-lər yeni yazmaları qoruyur; legacy qeydlərin sonradan VALIDATE mərhələsi var. Köhnə conflict aşkar olunsa ikinci miqrasiya avtomatik dərs silmək əvəzinə dayanır.

Next **16.4.5**, React/DOM **19.3.1**, Supabase SSR **0.12.7**, Supabase JS **2.119.0** və uyğun lockfile. Deprecated auth-helpers/next-pwa çıxarılıb. İstifadəsiz shadcn CLI çıxarılıb, onun əvvəlki CSS-i MIT lisenziyası ilə vendor faylına alınıb. Yalnız `@typescript-eslint/typescript-estree` daxilində `minimatch:11.0.4` override dependency advisory-ni aradan qaldırır; lint/build yoxlamaları keçib. Node 22 ilə yoxlanıb. Yeni lint istisnası və ya TypeScript strict söndürülməsi edilməyib; başlanğıcdakı lint konfiqurasiyası qorunub.

## 6. Faktiki yoxlama nəticələri

| Yoxlama | Nəticə |
|---|---|
| `npm ci` | Keçdi; 466 paket təmiz quraşdırıldı |
| `npm run lint` | Keçdi |
| `npx tsc --noEmit` | Keçdi |
| `npm run build` | Keçdi; Turbopack production build |
| `npm audit` | **0 zəiflik** |
| `npm test` | **28 keçdi, 0 xəta**; unit və PostgreSQL testləri birlikdə |
| `npm run test:e2e` | **11 keçdi, 0 xəta**; Chromium |
| Canlı Supabase | Read-only schema/policy/advisor/Edge və preflight; yazma/deploy yoxdur |
| GitHub Actions | Workflow yaradılıb; push edilmədiyindən remote run yoxdur |

SQL testləri PGlite içində real PostgreSQL, `btree_gist` və həqiqi migration SQL-i ilə işləyir. Fixture qəsdən geniş köhnə siyasətlər saxlayır ki, restrictive qorumanın onları daraltdığı yoxlanılsın. Anon/student/university-admin/superadmin, iki tenant, self-promotion, müraciət read/update/delete, profil persist/tenant FK, vaxt konfliktləri, dəvət expiry/email-confirmation/replay/rate-limit və Storage izolyasiyası yoxlanıb.

Brauzer testləri real Next production serverini, **lokal Auth/REST stand-in** xidmətini istifadə edir. Bu testlərdə saxta token yalnız həmin yerli fixture üçün işlədilir. Bunlar hosted Supabase Auth, real JWT signature yoxlaması, Resend delivery və real Storage upload testinin əvəzi deyil. E2E build dəyişənləri test üçündür; həmin `.next` build production-a daşınmamalıdır.

E2E ssenariləri: unauth route/API, CSRF, tələbə/university-admin dəvət qadağası, superadmin input/413, invalid callback/token, mobil/desktop login, iki admin interfeysi, Şənbə/boş cədvəl, hesablar arası qeydlər, save/query error, reload-dan sonra persist, private-cache qadağası və offline fallback.

Yerli loglar: `final-install.log`, `final-lint.log`, `final-typecheck.log`, `final-build.log`, `final-tests.log`, `final-e2e.log`, `final-audit.json` (git-ignore). Screenshot-lar `output/playwright/` altındadır. Əvvəl bir typecheck silinmiş test-colors səhifəsindən qalan generated route type səbəbindən dayanmışdı; build tipləri yenilədi və son ayrıca typecheck keçdi. Parent workspace lockfile və NO_COLOR/FORCE_COLOR xəbərdarlıqları check exit kodlarını dəyişmədi.

## 7. Qalan risklər və məhdudiyyətlər

| Ciddilik | Fayl/sahə | Qalan məsələ və tövsiyə |
|---|---|---|
| **Kritik — canlıda** | `supabase/migrations/*`, canlı `university_admins/university_invites` | Köhnə icazələr hələ aktivdir. Backup + staging + admin təyinatlarının etibarlılıq auditi + təsdiqli koordinasiyalı rollout. Bu işin lokal keçməsi canlı riski bağlamır. |
| **Yüksək — canlıda** | `supabase/functions/send-invite/index.ts` | Köhnə email relay ayrıca açıqdır; 410 replacement deploy edilməli, köhnə URL test olunmalıdır. |
| Yüksək — buraxılış yoxlaması | `src/app/auth/callback/route.ts`, `src/app/admin/setup/page.tsx`, `src/app/reset-password/page.tsx` | Real signup/verification/recovery/invitation email dövrəsi icra edilməyib. Staging-də iki fərqli email və replay ilə qəbul testi. |
| Orta | `src/app/api/send-invite/route.ts` | Mail göndərilib status update uğursuz olsa dəvət pending qala bilər. Operator delivery log ilə uzlaşdırmalı, lazım gəlsə yalnız həmin dəvəti etibarsızlaşdırıb yenidən göndərməlidir; avtomatik kor retry etməyin. |
| Orta | `supabase/migrations/20261105151513_scheduling_integrity.sql`, `tests/database.test.ts` | İki müstəqil DB sessiyasında paralel yarış testi yoxdur; staging-də eyni teacher/room üçün iki simultaneous INSERT ilə yoxlayın. Legacy orphan subjects üçün tenantı faktiki əlaqədən bərpa edin. |
| Orta | `src/app/page.tsx`, `supabase/migrations/20261105151505_authorization_and_invites.sql` | İctimai müraciət INSERT-i uzunluq/status ilə məhduddur, lakin CAPTCHA və davamlı anti-spam limit yoxdur. Public insert-i server/CAPTCHA + durable limiter arxasına keçirmək növbəti sərtləşdirmədir. |
| Orta | `src/app/api/uploads/route.ts`, `src/lib/uploads.ts` | Fayl başına limit var, hesab üzrə ümumi quota/rate və antivirus yoxdur. Shared durable quota və attachment scanning əlavə edin; imza yoxlamasını antivirus kimi təqdim etməyin. |
| Orta | `src/components/profile-view.tsx`, `supabase/migrations/20261105151520_storage_isolation.sql` | Sahibi UUID qovluğundan müəyyən edilməyən legacy material yolları ayrıca inventar tələb edir. Obyektləri silmədən sahibi yoxlanılmış köçürmə planı hazırlayın. |
| Orta | `src/components/profile-view.tsx`, `src/components/grade-calculator.tsx` | Köhnə fənn adlarına bağlı davamiyyət limitləri və 50/28 bal qaydaları saxlanıb; bütün universitetlər üçün təsdiqlənməyib. Universitet/fənn səviyyəsində qayda konfiqurasiyası və akademik təsdiq lazımdır. Qiymət redaktəsi əvvəlki xam seminar/lab girişlərini bərpa etmir, çünki əvvəl yalnız yekunlar saxlanırdı; versiyalı raw-input model əlavə edin. |
| Orta | `src/app/dashboard/page.tsx`, `src/lib/profile.ts` | Bir tabdakı yazmalar növbələnir; fərqli cihaz/tablarda bütün JSON profilini eyni anda yazmaq son yazının üstün gəlməsinə səbəb ola bilər. Optimistic version və ya sahə üzrə atomic RPC əlavə edin. |
| Orta — konfiqurasiya | `docs/DEPLOYMENT.md`, Supabase Auth | Leaked-password protection, server minimum password, URL allow-list və təsdiq şablonları operator tərəfindən tətbiq olunmalıdır. |
| Aşağı — funksional sərhəd | `src/app/dashboard/page.tsx`, `public/sw.js` | Bağlı tətbiqdə push yoxdur; server push subscription/scheduler tələb olunur. UI bunu artıq açıq deyir. |
| Aşağı — yoxlama sərhədi | `tests/e2e/application.spec.ts`, `supabase/bootstrap.sql` | Bütün admin alt-formaları, Safari/Firefox, bütün mobil ölçülər və boş hosted Supabase-dən tam quraşdırma end-to-end yoxlanmayıb. Staging qəbul siyahısını tamamlayın. |

Bu məhdudiyyətlərə görə tam production Definition of Done hələ yerinə yetirilib sayılmır. Lokal düzəliş paketi və məlum kritik icazə boşluqlarını bağlayan SQL hazırdır; canlı tətbiq və yuxarıdakı yüksək prioritetli qəbul yoxlamaları buraxılış şərtidir.

## 8. Supabase və Vercel üçün dəqiq davam addımları

1. [DEPLOYMENT.md](DEPLOYMENT.md) üzrə backup, schema/policy snapshot, mövcud admin hesablarının etibarlılıq yoxlaması və staging hazırlığı.
2. Üç migration-ı staging-də sırayla tətbiq edin, `verify.sql` və real iki-tenant testlərini işlədin. Uyğun `NOT VALID` constraint-ləri ayrıca validate edin. Mövcud production-a bootstrap tətbiq etməyin.
3. Köhnə Edge Function-u 410 replacement ilə bağlayın. Raw token-li köhnə dəvətləri yenidən göndərin.
4. Dashboard: Site URL/redirect allow-list, email confirmation, min password 12, leaked-password protection, private schema-nın expose olunmaması, universitet semestr ayarları, Storage private/ölçü/MIME yoxlaması.
5. Resend domenini təsdiqləyin. Vercel-də `.env.example`/README dəyişənlərini uyğun scope-a verin; service-role/Resend açarları yalnız serverdə. Node 22, install `npm ci`, build `npm run build`.
6. Real auth/email/upload və paralel DB testləri keçəndən sonra ayrıca təsdiqlə koordinasiyalı production rollout. SQL/Edge və yeni frontend bir-birindən asılıdır; köhnə kod aralıq versiyada işləməyə bilər.
7. READY status, production alias, HTTP cavabı və real URL browser yoxlaması ilə deploy-u təsdiqləyin. Tək GitHub push production sübutu deyil.

Tam schema/rol matrisi: [DATABASE.md](DATABASE.md). Dəyişənlər və lokal quraşdırma: [README](../README.md). Dəyişən faylların tam siyahısı: [CHANGED-FILES.md](CHANGED-FILES.md).
