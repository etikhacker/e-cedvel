# Phase 1 — tamamlandı, Phase 2 başlamayıb

6 noyabr 2026. İstifadəçi yalnız Phase 1 üçün açıq icazə verdi. Tətbiq mənbəyi: fix/production-hardening, c6783b65fc175b564c94b6939275234fc8634bd0.

## Vercel

- Mövcud e-cedvel project: prj_6Z8mY8gUMiosSJsZNR4ndixkNn00, team_4EkrgFVSXtz0IJcH6RJOhgd7.
- Project Node.js 24.x → **22.x** dəyişdirildi. Build logu cache-in Node 24 → 22 dəyişdiyi üçün istifadə edilmədiyini təsdiqləyir. Paket/lockfile və CI də Node 22-dir.
- Vercel Authentication **All Deployments aktivdir**. Əvvəlki seçim Standard Protection idi; Phase 2 uğurlu bitəndə əvvəlki seçim bərpa edilməlidir, Authentication tam söndürülməməlidir.
- Owner browser canonical https://e-cedvel.vercel.app və əvvəlki birbaşa deployment URL-də tətbiqi aça bildi.
- Cookiesiz/bypass-sız sorğular bütün 6 project alias-da və əvvəlki deployment URL-də HTTP 302 ilə Vercel SSO-ya yönləndi. Alias inventarında 6 qeyd, əlavə səhifə yoxdur.
- Yeni build: **dpl_FiJ5BSo9g5pbcmhW5m8bbHybPGMa**, https://e-cedvel-3qbfrbabl-etikhackers-projects.vercel.app, target production, **READY**, alias siyahısı boşdur. CLI 64.5.0 ilə --prod --skip-domain istifadə edildi; promote edilmədi. Yüklənən 87 mənbə faylında env, backup, output və node_modules yoxdur.
- Yeni deployment də cookiesiz HTTP 302 ilə Vercel SSO-ya yönləndi. Owner sessiyasında onun /api/public/catalog?type=universities endpoint-i real Supabase-dən mövcud universiteti qaytardı; read-only runtime smoke testi keçdi.
- Canonical və digər production alias-ları hələ **dpl_F9F61m7XpHBBvLPDqgy5ry1T8VEM** deployment-inə bağlıdır. Yeni build-in səhifələri canonical origin-ə yönləndirdiyindən tam yeni UI/Auth axını promote-dan əvvəl təsdiqlənmiş sayılmır.
- Local .vercel/project.json yalnız mövcud project/team ID-lərini saxlayır və Git ignore olunur. Yeni Vercel layihəsi yaradılmadı.

## Son backup və lokal bərpa

Qovluq: D:\e-cedvel\private-recovery\samcakpeuxwegyzrlrwp-phase1-20261106-190703

- Backup vaxtı: **2026-11-06 19:07:34 UTC / 23:07:34 Bakı**.
- database.dump.dpapi: tam DB arxivinin DPAPI şifrəli nüsxəsi. Açıq dump host diskə yazılmadı; pg_dump read-only bağlantı ilə işlədi. Əvvəlki backup-lar dəyişdirilmədi.
- SHA-256 (deşifrə edilmiş arxiv): d62474bfa2e410c7235d067c3b5c0fe38d4ebd1659c4ed9734c6a9f958ea4917.
- Arxiv oxunuşu və encryption round-trip keçdi. Yeni network=none, ports olmayan ec-phase1-20261106-190703 konteynerində public/Auth/Storage bərpa edildi. Hosted Vault/Realtime/platform-in tam bərpası sınağı kimi təqdim edilmir.
- 14 cədvəlin count/content fingerprint-i canlı oxunuşla eyni oldu: **11 Auth user, 11 identity**, 1 universitet, 1 admin, 8 dəvət; digər biznes məlumatı qorundu.
- omrbabayev455@gmail.com hesabı backup-da var; admin sətri yoxdur. Hesab silinməyib, recovery linki açılmayıb, parol dəyişdirilməyib.
- Mövcud **3 Storage binary obyektinin** yeni şifrəli nüsxələri endirildi; round-trip hash yoxlaması keçdi, əvvəlki nüsxə ilə hamısı eynidir. Path/hash manifesti də şifrəlidir.
- Auth config dry-run snapshot-ı şifrəli saxlanıldı: dry_run=true, wrote=false. SMTP/key/password/token dəyərləri çıxışa verilmədi.
- DPAPI bərpası eyni Windows hesabı/maşınına bağlıdır. Backup qovluğu Git xaricindədir.

## Son snapshot-da migration və maintenance uyğunluğu

Yalnız yeni lokal ec_restore DB-də bu sıra keçdi:

1. 20261105151505_authorization_and_invites.sql
2. 20261105151513_scheduling_integrity.sql
3. 20261105151520_storage_isolation.sql

SQL hash-ləri əvvəlki təsdiqlənmiş rehearsal ilə eynidir. supabase/verify.sql və local-recovery-verification.sql keçdi: RLS, iki tenant izolyasiyası, dəvət email/expiry/replay, cədvəl konfliktləri və Storage yoxlamaları. group_faculty_mismatch, profile_group_mismatch, invalid_time_format sayları 0; legacy Storage owner-review yolu 0; anon/authenticated invite table oxuma icazələri false.

Yeni lokal snapshot-da guard install → role test → remove də keçdi. Anon/authenticated/service-role və definer/Storage yazmaları rədd edildi; yalnız operator backfill yolu açıqdır. Testlər rollback edilir. 14 cədvəlin sətir sayları qorundu; 13 cədvəlin köhnə sahələr üzrə content fingerprint-i eynidir; yalnız gözlənilən Storage bucket konfiqurasiyası dəyişdi. Lokal recovery konteyneri dayandırıldı.

Canlı yoxlama: migration history **boşdur**, release write-fence trigger sayı **0**. Heç bir production SQL migration, write fence, Auth/Storage ayarı və Edge replacement tətbiq edilmədi. UI, istifadəçilərin credential-ləri və biznes məlumatı dəyişdirilmədi. Əlavə email, GitHub push/merge olmadı.

## Drift və Phase 2 qərarı

Canlı Auth Site URL hələ köhnə team alias-dır; allow-list canonical /auth/callback və /reset-password ilə köhnə alias pattern-lərini saxlayır. Recovery type və dəvətin kodlanmış next parametrli dar pattern-ləri, canonical Site URL, confirmation=true və minimum password=12 Phase 2 planında qalır. Bunlar gözlənilən tətbiq edilməmiş dəyişikliklərdir; hazırda uğursuz migration/build yoxdur.

**Phase 2-yə nəzarətli başlamaq üçün texniki yoxlamalar keçib; ayrıca açıq icazə gözlənilir.** Vercel Authentication aktiv qalır, lakin birbaşa Supabase yazmaları, Auth və köhnə Edge hələ canlıdır. Bu backup sərt write-freeze altında götürülməyib. Phase 2 əvvəlində backup-dan sonrakı DB/Auth/Storage dəyişiklikləri müqayisə edilir; yeni dəyişiklik varsa backup yenilənib yoxlanmadan migration başlamır.

Phase 2 üçün ayrı icazə paketi: Edge 410 replacement və çağırışların bitməsi → signup maintenance planı və DB write fence → hosted bloklama/drift/backup checkpoint → üç migration → Auth cutover → verify/integrity → hazırlanmış build-in promote-u → qəbul yoxlamaları → write fence və Standard Protection bərpası. Hər checkpoint uğursuzluğunda dayanılır. Migration-dan sonra köhnə tətbiqə tək rollback edilmir; maintenance altında uyğun fix-forward/bərpa planı hazırlanır.

Yeni email, test dəvəti/yazması və parol dəyişməsi üçün konkret ayrıca icazə lazımdır. Phase 2, GitHub push/merge və test hesabının silinməsi **başlamayıb**.
