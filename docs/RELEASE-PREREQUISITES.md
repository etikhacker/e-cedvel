# Koordinasiyalı production keçidi — 6 noyabr 2026

**Son vəziyyət:** istifadəçinin ayrıca icazəsi ilə Phase 1 tamamlandı: Node 22, All Deployments, qorunan/alias-sız READY build, yeni şifrəli backup və lokal bərpa/migration rehearsal keçdi. [PHASE-1-RESULT.md](PHASE-1-RESULT.md) aktual nəticədir. Aşağıdakı planın artıq tamamlanmış addımlarını təkrarlamayın; Phase 2 ayrıca icazə gözləyir. Canlı DB guard, Auth/Storage dəyişməsi və migration hələ yoxdur.

**Hazırlıq tamamlanıb; canlı icra üçün açıq icazə gözlənilir.** Statik IP maneəsi bağlanıb. Aşağıdakı yoxlama nöqtələri icazəli keçid daxilində məcburidir; onlardan biri keçməsə migration/promote/ictimai açılış dayanır. Canlı uğur və tam Auth E2E hələ iddia edilmir.

Gmail SMTP və ayrıca Supabase Auth recovery Inbox çatdırılması **PASSED**. [Gmail sübutu](SMTP-DELIVERY-TEST.md), [Auth sübutu](AUTH-DELIVERY-TEST.md). Testləri təkrarlamayın. Recovery linki açılmayıb, parol sıfırlanmayıb; adi Auth test hesabı saxlanılır. UI dəyişməyib.

## 1. Statik IP əvəzinə Vercel Authentication

Dashboard-da oxunaraq təsdiqlənib: etikhacker's projects **Hobby**, etikhacker **Owner**, e-cedvel → Deployment Protection → Require Log In aktiv, seçim **Standard Protection**. Menyuda **All Deployments — Protect all domains** mövcuddur, upgrade tələb etmir. Seçim dəyişdirilməyib, Save basılmayıb.

[Vercel-in 9 sentyabr 2026 yeniləməsi](https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan) bütün planlarda production daxil All Deployments qorumasını pulsuz edir. Köhnə sənədlərdəki Pro/add-on məhdudiyyəti bu qərara tətbiq olunmur. [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication).

Hazırkı Dashboard inventarı: aktiv shareable link yoxdur; automation bypass secret yoxdur; exception domeni siyahılanmır; OPTIONS bypass söndürülüb. Trusted Sources yalnız bu layihənin uyğun environment tokenlərini və development → preview keçidini göstərir. Production-a yeni bypass və ya istifadəçi girişi verilmir.

Əhatə: canonical e-cedvel.vercel.app, it24-app.vercel.app, e-cedvel-etikhackers-projects.vercel.app, e-cedvel-git-main-etikhackers-projects.vercel.app, cari e-cedvel-a41f5p6zr-etikhackers-projects.vercel.app və yeni deployment URL-ləri. All Deployments məhsul səviyyəsində bütün project domenlərini qoruyur; faktiki hər URL aktivləşdirmədən sonra yoxlanmalıdır. Canonical redirect-dən əvvəl Vercel gate işləməlidir.

### Aktivləşdirmə — yalnız release icazəsindən sonra

1. Owner-in işlək Vercel Dashboard sessiyası və production URL-i açacağı browser hazır olsun. Role/membership dəyişdirilmir. Owner sessiyasını bağlamayın; Dashboard tətbiqdən müstəqil idarəetmə yoludur.
2. Cari Standard Protection, alias siyahısı, exceptions/bypass/trusted-source inventarını saxlayın. Yeni bypass yaranıbsa avtomatik silməyin: onu ayrıca qiymətləndirin və maintenance sübutu tamamlanana qədər dayanıb bildirin.
3. Eyni layihədə Require Log In açıq qalmaqla All Deployments seçin və Save edin. API ekvivalenti project update body: {"ssoProtection":{"deploymentType":"all"}}. Team/project ID-ləri aşağıdadır; başqa project yaratmayın.
4. Owner browser canonical və birbaşa deployment URL-də daxil ola bilməlidir. Ayrı, Vercel cookie-si/bypass header-i olmayan sessiya hər alias-da Vercel login/protection görməlidir; tətbiq HTML/API-si ictimai açılmamalıdır. IP dəyişməsi tələb olunmur. Owner daxil ola bilmirsə DB-yə toxunmadan Standard Protection-a qaytarın.
5. Aktivləşdirmədən əvvəl başlayan server/Edge çağırışları və upload-ların bitməsini gözləyin. Gate köhnə açıq browser-in Supabase sorğularını dayandırmır: aşağıdakı DB qoruması ayrıca məcburidir.

### Deaktivləşdirmə / geri qaytarma

Qəbul sınaqları keçəndən sonra **Standard Protection** seçin və Save edin; Require Log In-i tam söndürməyin. Canonical production domeni cookie-siz açılmalı, preview/birbaşa deployment-lərin əvvəlki qoruması qalmalıdır. Owner girişi yenidən yoxlanır. API-nin əvvəlki normallaşdırılmış dəyəri all_except_custom_domains idi; onu yeni API enum-u kimi təxmin edib göndərməyin, Dashboard-dakı əvvəlki Standard Protection seçimini bərpa edin.

Əvvəlki firewall GET 404 Config not found aktiv WAF konfiqurasiyasının alınmadığını göstərirdi; konkret səbəb sübut olunmayıb. Project oxunur və Owner Dashboard-a daxil olur, buna görə bunu ümumi layihə giriş qadağası hesab etmirik. Eyni uğursuz sorğu bu mərhələdə təkrarlanmadı. Vercel Authentication ayrıca project qorumasıdır və WAF config-dən asılı deyil; firewall/IP allowlist artıq release şərti deyil.

## 2. Birbaşa Supabase yazmalarının qorunması

supabase/operations/install-release-write-fence.sql bütün public cədvəllərdə və storage.objects-da BEFORE STATEMENT INSERT/UPDATE/DELETE/TRUNCATE trigger-i qurur. API anon/authenticated/service_role, Storage sessiyası və SECURITY DEFINER daxilindən gələn yazmalar PT503 ilə dayanır. Mövcud JWT/session bunu keçmir; RLS söndürülmür. Yalnız birbaşa postgres operator sessiyası backfill/migration üçün yaza bilir. Privileged operator bağlantısı app/Edge-ə verilmir.

Service-role JWT ilə çalışan Next.js/Edge əməliyyatları da DB-də bloklanır. Lakin trigger xarici email/HTTP side-effect-i dayandıra bilməz: köhnə send-invite Edge relay əvvəl repo 410 replacement-i ilə bağlanmalıdır; JWT yoxlaması aktiv saxlanılır. Davam edən çağırışlar tamamlanmadan baseline götürülmür.

Bu, bütün Supabase-in offline rejimi deyil. Auth session/recovery fəaliyyəti, public reads, CDN və bəzi service daxili əməliyyatları davam edə bilər. Signup maintenance zamanı müvəqqəti bağlanır; digər Auth əməliyyatları avtomatik dəyişdirilmir. Mövcud istifadəçi/session/tokenlər silinmir. Yekun backup və müqayisədə legitim Auth timestamp dəyişiklikləri nəzərə alınır.

remove-release-write-fence.sql yalnız öz trigger/function/schema-sını CASCADE olmadan götürür. RLS, məlumat və başqa obyektlər dəyişdirilmir. Qoruma götürülən kimi köhnə birbaşa klientlər yenidən yeni RLS/constraint-lər çərçivəsində yaza bilər; Vercel gate-in onları hələ saxladığını fərz etməyin.

### Lokal enable/disable nəticəsi

scripts/test-maintenance-local.ps1 yalnız ec-recovery-20261106 konteynerini/ec_restore DB-ni qəbul edir; network=none və exposed port yoxdur. 11 trigger quruldu; anon/authenticated birbaşa və definer, service_role birbaşa və definer, Storage sessiyası rədd edildi; operator yolu açıq qaldı. Test grant/function-ları transaction rollback ilə silindi. Remove sonrası trigger/schema qalmadı, service_role və Storage zero-row yazmaları yenidən keçdi. **47 public/Auth/Storage cədvəlinin say və məzmun fingerprint-ləri eyni qaldı.** Konteyner dayandırıldı. Production guard aktiv deyil.

Hosted REST/Storage davranışı release zamanı ayrıca yoxlanır: mövcud obyektə overwrite/delete yoxdur; yalnız əvvəlcədən təsdiqlənmiş yeni test yolu istifadə oluna bilər. Qoruma bypass edilirsə migration başlamır.

## 3. Node.js, Auth və backup hazırlığı

package.json və package-lock.json kök engines.node artıq **22.x**-dir. Lokal Node v22.23.4 ilə metadata uyğunluğu keçdi; əvvəlki build/test həmin major-da uğurlu idi. CI artıq Node 22 seçir. Dependency versiyaları və UI dəyişməyib; bütün audit təkrarlanmadı. [Vercel engines override davranışı](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

Canlı project setting hələ 24.x-dir, dəyişdirilməyib. Release icazəsindən sonra Build and Deployment → Node.js 22.x, framework Next.js, root audit repo kökü, Install npm ci, Build npm run build. Yeni build logunda/runtime metadata-da 22.x təsdiqlənməlidir; package engines də bunu məcbur edir. Köhnə .next istifadə edilmir.

Canonical URL və NEXT_PUBLIC_APP_URL: https://e-cedvel.vercel.app. Mövcud env qeydi bu dəyərlə yenilənib; hazırkı köhnə deployment rebuild edilməyib. Auth Site URL son oxunuşda köhnə team alias, confirmation=false, minimum parol=6 idi. [auth-cutover-plan.json](../supabase/operations/auth-cutover-plan.json) yalnız review planıdır:
- Site URL canonical;
- signup /auth/callback;
- recovery /auth/callback?type=recovery;
- invitation signup /auth/callback?next=%2Fadmin%2Fsetup%3Ftoken%3D...;
- /reset-password; keçid müddətində köhnə alias allow-list saxlanılır;
- confirmation=true, minimum password=12; SMTP/MFA/providers/rate limits və ConfirmationURL şablonları saxlanılır.

Dashboard query glob-larında literal sual işarəsi tək backslash ilə escape edilir; JSON faylı bunu iki backslash ilə kodlayır. Real query matching, PKCE verifier/cookie və son səhifə E2E-si icazəli yeni tətbiqdə yoxlanmalıdır. Mail çatdırılma sınağındakı açılmamış link bu testin əvəzi deyil. Dashboard Invite user universitet admin dəvəti axını deyil.

Backup: D:\e-cedvel\private-recovery\samcakpeuxwegyzrlrwp-20261106, 16:26 UTC; encryption/archive/restore verified, 14 biznes/Auth/Storage cədvəli üzrə əvvəlki preservation sübutu var. Üç migration hash-i əvvəlki uğurlu rehearsal ilə eynidir. 18:29 UTC Auth test hesabı bu arxivdən sonradır: son cutover backup/baseline yeni hesabı da əhatə etməli, yeni arxiv ayrıca restore yoxlamasından keçməlidir. Köhnə yoxlanmış backup üzərinə yazılmır; tarix+saatlı yeni qovluq istifadə edilir. DPAPI yalnız eyni Windows hesabı/maşını ilə açılır; hosted tam restore sübutu kimi təqdim edilmir. Storage binary obyektləri əvvəlki snapshot-dan dəyişibsə yeni/dəyişmiş obyektlərin ayrıca şifrəli nüsxəsi də götürülür.

## 4. Dəqiq icra ardıcıllığı — hələ icra edilmir

1. İstifadəçi aşağıdakı release əməliyyatlarına və maintenance vaxtına açıq icazə verir. Commit/hash, plan və owner sessiyası təsdiqlənir; başqa deploy/push prosesi başlamamalıdır.
2. Mövcud Vercel project-ə local link hazırla: project prj_6Z8mY8gUMiosSJsZNR4ndixkNn00, team team_4EkrgFVSXtz0IJcH6RJOhgd7. Yeni project yaratma. Node 22/build/env ayarlarını yoxla; canlı setting dəyişməsi yalnız verilmiş icazə ilə.
3. Vercel Authentication All Deployments-i aktivləşdir; owner allow + cookiesiz bütün production alias/deployment URL-lərində deny yoxlaması keçsin. Sonra yeni production build-i --skip-domain ilə hazırla. Bu da deployment-dir, indi qadağandır. Build uğursuzdursa DB migration yoxdur; Standard Protection-a geri qayıtmaq olar.
4. Köhnə send-invite Edge Function-u repo 410 replacement ilə bağla, JWT yoxlamasını saxla. Çağırış/upload-lar bitsin. Auth signup-ı müvəqqəti bağla; əvvəlki ayarı qeyd et. Digər istifadəçi credential-lərinə toxunma.
5. DB write fence-i birbaşa postgres operator sessiyasında qur. Canlı trigger sayı/enable vəziyyətini və birbaşa API/Storage bloklamasını təsdiqlə. Xəta varsa dayan.
6. Yeni saatlı backup/baseline götür, şifrələmə+archive+izolyasiya olunmuş restore yoxlamasını tamamla; mövcud test hesabı daxil bütün məlumat qorunsun. Köhnə backup saxlanılsın. DB migration hələ başlamayıb.
7. Migration history-ni yenidən oxu, eyni SQL hash-lərini təsdiqlə. Bu üç faylı ardıcıl tətbiq et: 20261105151505_authorization_and_invites.sql → 20261105151513_scheduling_integrity.sql → 20261105151520_storage_isolation.sql. Hər biri ayrıca transaction-dır; birinci xəta zamanı dayan. bootstrap.sql və local-recovery-verification.sql production-da işlədilmir.
8. Auth cutover planını tətbiq et. supabase/verify.sql, tenant/RLS/grant/constraint/Storage və count/content müqayisələrini tamamla. Bucket siyasəti və nəzərdə tutulan backfill dəyişikliklərini əvvəlki rehearsal nəticəsinə görə ayırd et. SQL yoxlamaları yaşıl olmadan promote etmə.
9. Hazır production build-i canonical domenə promote et; Vercel gate və DB fence qalsın. Commit/READY/Node22/alias/read-only səhifələri owner ilə yoxla. App DB-yə uyğundursa DB fence-i götür; bu andan birbaşa Supabase yazmaları yeni qaydalarla açıla bilər.
10. Ayrıca icazəli real qəbul sınaqlarını owner browser-də et: signup confirmation, recovery callback/reset səhifəsi, superadmin/university admin/student isolation, tətbiq dəvəti, upload/signed download. Yeni email/dəvət/parol dəyişikliyi/test yazması ayrıca scope tələb edir; mövcud delivery testləri təkrarlanmır. Signup testi lazım olduqda razılaşdırılmış qısa pəncərədə signup açılır; Vercel gate birbaşa Auth endpoint-i qorumur.
11. Qəbul meyarları keçdikdə signup-ın planlaşdırılmış açıq vəziyyətini bərpa et, confirmation aktiv qalsın. Vercel Authentication-ı Standard Protection-a qaytar. Canonical açılış və preview qorumasını təsdiqlə; müşahidə et.
12. GitHub push/PR/merge ayrıca icazə ilədir. Əvvəl Vercel Git production branch/auto-deploy davranışı oxunur ki, ikinci planlaşdırılmamış deployment yaranmasın. Sonra feature push → main üçün PR → CI/review → ayrıca merge icazəsi.

## 5. Dayanma və bərpa

Migration-dan əvvəl abort: local build/maintenance problemi düzələnədək SQL-ə başlama; DB fence qurulubsa onu çıxarma və əvvəlki signup/Standard Protection bərpası uyğun abort planı ilə mümkündür. Edge relay 410-a çevrilibsə təhlükəli köhnə relay avtomatik geri açılmır; köhnə dəvət axını bağlı qala bilər.

İlk migration-dan sonra tək köhnə Vercel deployment-ə rollback uyğun deyil. Vercel Authentication və DB fence saxlanır; uyğun kod/SQL fix-forward lokal yoxlanıb ayrıca tətbiq olunur. Yeni yazmalar başlamışsa nasaz vəziyyətin ayrıca backup-ı və reconcile planı hazırlanır. Destruktiv restore/reset, pg_restore --clean, bootstrap və RLS söndürülməsi avtomatik icra edilmir. Məlumat itkisi/destruktiv dəyişiklik tələb edən nəticədə dayanıb istifadəçiyə bildir.

## İcazə sərhədi

Hazırda yalnız lokal engines/test/sənəd dəyişiklikləri və read-only Dashboard yoxlaması edilib. İcazə gözləyən paket: Vercel Node22 + All Deployments aktivləşməsi/bərpası + qorunan production build/promote; Edge 410 replacement; müvəqqəti signup və DB write fence; yeni backup/restore checkpoint; üç production migration; Auth cutover. Real istifadəçi axını üçün email/test-data/parol əməliyyatlarının konkret scope-u ayrıca təsdiqlənir. GitHub push/merge və test hesabının silinməsi bu paketə daxil deyil.

Köhnə callback calback re-export-u qəsdən compatibility üçündür. Köhnə SQL policy stubları və bootstrap release əmrləri deyil. Yalnız üç versioned migration istifadə edilir; UI/refactor dəyişikliyi yoxdur.
