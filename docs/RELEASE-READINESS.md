# Son production buraxılış yoxlaması — 6 noyabr 2026

**Nəticə: BLOCKED.** Bu sənəd icra icazəsi deyil. Production miqrasiyası, Auth/RLS/Storage dəyişikliyi, Edge Function/Vercel deploymenti və GitHub push edilməyib. UI dəyişməyib.

Layihə: `samcakpeuxwegyzrlrwp`. Repo: `D:\e-cedvel\audit-work`, branch `fix/production-hardening`. Tətbiq bazası `8b5db9d`, əvvəlki sənəd commit-i `ae2a3f5`. Son testlər bu kod üzərindədir; bu dəyişiklik yalnız sənədləri, CI test siyahısını və generated-artifact qaydasını yeniləyir.

## Dəqiq açıq məsələlər

1. Vercel-də `NEXT_PUBLIC_APP_URL` Sensitive olduğu üçün dəyəri oxunmur. İstifadəçi yalnız bu public URL-i bildirməlidir. Auth Site URL canonical domenlə eyni deyil. Keçiddə hər ikisi və redirect-lər eyni origin-ə uyğunlaşdırılmalıdır.
2. Vercel SMTP parolu mövcuddur, amma Gmail AUTH və email göndərişi hələ sınaqdan keçməyib. İstifadəçi eyni parolu Git tərəfindən ignore edilən `.env.smtp-test.local` faylına özü daxil edə bilər. Parolu çata yazmaq olmaz. Lokal test uğuru Vercel runtime şəbəkəsini ayrıca təsdiqləmir; sonuncu yalnız təsdiqlənmiş release mərhələsində sınana bilər.
3. Supabase Auth SMTP ayrıca saxlanır. Dashboard-da test email düyməsi yoxdur. Bir recovery emaili Auth-da token/göndərilmə vaxtını yeniləyə bildiyinə görə həmin məhdud əməl üçün ayrıca cavab gözlənilir. Parol dəyişməyəcək və link istifadə edilməyəcək. Alıcıya email icazəsi alınıb; faktiki SMTP AUTH və inbox çatdırılması hələ təsdiqlənməyib.
4. Köhnə klientlər birbaşa Supabase-ə qoşulur. Təkcə Vercel maintenance səhifəsi həmin sorğuları dayandırmır. Keçid üçün həm Vercel trafikini, həm köhnə Data API/Storage/Edge yazma yollarını dayandıran, operatora məhdud yoxlama imkanı saxlayan mexanizm seçilib sınaqdan keçirilməlidir. Hazırda bu mexanizmin işlədiyinə sübut yoxdur. Bunu həll etmədən miqrasiyaya başlamaq olmaz.

## URL və email uyğunluğu

Vercel production-domain API-də `e-cedvel.vercel.app` təsdiqlənib, redirect yoxdur; `it24-app.vercel.app` ona HTTP 307 ilə yönləndirilir. Buna görə canonical production origin **`https://e-cedvel.vercel.app`**-dır. Bu, domen konfiqurasiyasına əsaslanır.

| Mənbə | Faktiki vəziyyət |
|---|---|
| Vercel production deployment | `dpl_F9F61m7XpHBBvLPDqgy5ry1T8VEM`, READY, köhnə `49160fc` |
| NEXT_PUBLIC_APP_URL | Production/Preview-da var; Sensitive, dəyər naməlum |
| Auth Site URL | `https://e-cedvel-etikhackers-projects.vercel.app/` |
| Auth redirects | canonical `/auth/callback`, `/reset-password`; team alias root və `/**`; `e-*-cedvel-...` wildcard-ları |
| Next invitation SMTP | Gmail, 587, STARTTLS, TLS sertifikat yoxlaması, `MAIL_PROVIDER=smtp` |
| Auth SMTP | Gmail, 587, custom SMTP aktiv; parol ayrıca gizli saxlanır |
| Auth email confirmation / password minimum | söndürülüb / 6; release planında aktiv / 12 |

Göndərən və SMTP istifadəçisi hər iki xidmətdə `e.cedvel.qruptap@gmail.com`-dur. Sender display name fərqlidir; autentifikasiya üçün problem deyil. Next.js SMTP parolunu dəyişmək Auth SMTP parolunu dəyişmir. Gmail üçün Resend domeni tələb olunmur. Auth Dashboard şəxsi Gmail SMTP-nin transactional çatdırılmada məhdudiyyətləri olduğunu bildirir; real qəbul/inbox yoxlaması lazımdır.

Dashboard-da baxılan signup (`Confirm Your Signup`), recovery (`Reset Your Password (E-CƏDVƏL)`) və invite-user şablonlarının linki `{{ .ConfirmationURL }}`-dır. Auth invite-user şablonu tətbiqin universitet-admin dəvət məktubu deyil. Sonuncunu Next `/api/send-invite` yaradır; dəvət alan qeydiyyatdan keçdikdə signup təsdiqi işləyir.

Kod `/auth/callback`-də `code` mübadiləsini və uyğun `token_hash` növlərini qəbul edir. Recovery redirect-i `?type=recovery`, admin signup redirect-i `?next=` daxilində kodlanmış `/admin/setup?token=...` davamını saxlamalıdır. PKCE başladılan browser-də verifier cookie tələb olunur; başqa origin/browser nəticəsini bu statik yoxlama təsdiqləmir. Hazır şablonlar bu məntiqə uyğundur, real end-to-end təsdiq isə açıqdır. [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [redirect qaydaları](https://supabase.com/docs/guides/auth/redirect-urls).

Release zamanı Site URL və NEXT_PUBLIC_APP_URL canonical origin olmalıdır. Allow-list ən azı canonical `/auth/callback`, `/auth/callback?type=recovery` və yalnız callback-in `next` query-si üçün dar pattern-i əhatə etməlidir. Supabase glob qaydalarında `?` xüsusi simvoldur: query variantlarının dəqiq uyğunluğunu real recovery/invitation testi ilə yoxlamadan təsdiqləməyin. Mövcud redirect-ləri kor-koranə əvəz etməyin; istifadə olunan alias-ları müəyyən edin, köhnə açıq login sessiyalarını yenidən canonical origin-dən başladın. Preview üçün ümumi production allow-list-i genişləndirməyin.

## Keçən sınaqlar və sübut sərhədi

| Yoxlama | Nəticə |
|---|---|
| Lint / TypeScript / build | keçdi |
| Unit + SQL + SMTP protokol testləri | 34/34 |
| Ayrıca DB test əmri | 12/12; yuxarıdakı SQL testlərinin təkrarıdır |
| Staging environment checker | 5/5 |
| Chromium E2E | 11/11; mock Auth/REST |
| npm audit | 0 vulnerability |
| Təzə bərpa edilmiş real PostgreSQL nüsxəsi | üç miqrasiya + RLS + verify.sql keçdi |

Build lokal mock env ilə hazırlanıb; bu `.next` çıxışı production-a deploy edilməməlidir. Real DB sınağı mock deyil, şəbəkəsiz Docker nüsxəsində aparılıb. Canlı Supabase email/sessiya brauzer sınağı ilə qarışdırılmamalıdır.

Backup vaxtı `2026-11-06T16:26:21.6123549Z`; açılmış dump SHA-256: `4d4d4ef4623b80aab8dfcf9c0f5aa5a4761229423a557dbb3b255ca5f45f11cd`. Dump DPAPI ilə şifrələnib, lokal bərpa ilə yoxlanıb. Mənbə PostgreSQL 17.6, test PostgreSQL 18.6-dır; tam hosted Supabase/Vault/Realtime disaster recovery sınağı deyil. Əsas şəxsi sübut qovluğu `D:\e-cedvel\private-recovery\samcakpeuxwegyzrlrwp-20261106`-dır. Storage obyektlərinin şifrəli nüsxələri əvvəlki `20261105` qovluğundadır; bu release yoxlamasında onlar yenidən endirilməyib.

Yeni nüsxədə miqrasiya sırası:

1. `20261105151505_authorization_and_invites.sql`
2. `20261105151513_scheduling_integrity.sql`
3. `20261105151520_storage_isolation.sql`

Faylların SHA-256 izləri (bayt səviyyəsində dəyişiklik olsa sınaq nəticəsini yenidən qiymətləndirin):

```text
20261105151505 779defe07379a2221524ff08bc25b0228a21def49493b7da9d130a15737646c6
20261105151513 87c7d662b2d84f9d495e6462d3c755b1c367387fba758aee4b57d2304c4d9c54
20261105151520 b12335d9fb6f6be105e53538e16d08b2750ab8b448629788f6d2606128cb3c2d
```

SQL baxışında DELETE/TRUNCATE və cədvəl silinməsi yoxdur. `DROP POLICY` əvəzlənən subject qaydasına, token sütunundakı `DROP` isə default/NOT NULL məhdudiyyətinə aiddir; sətirlər silinmir. Səlahiyyətlərin bağlanması köhnə klient üçün qırıcı dəyişiklikdir, buna görə rollout gate ayrıca tələbdir.

`readiness-preservation.json`: bütün 14 cədvəldə sətir sayı eynidir, 13 qeyri-bucket cədvəlin məzmun hash-i eynidir. `storage.buckets`-də yalnız planlı privacy/ölçü/MIME konfiqurasiyası fərqlidir. 10 Auth user, 10 identity, 8 invitation, 1 admin, 4 profil və 3 Storage obyekt qorunub. Üç integrity sayğacı 0-dır. Materials legacy owner-path problemi tapılmayıb. Bəzi əlavə FK/CHECK-lər qəsdən NOT VALID-dir; köhnə sətirlərin preflight müqayisəsi keçib, bütün constraint-lərin validated olduğu iddia edilmir.

Lokal RLS sınaqları superadmin, university-admin, student, anonymous; iki tenant; invitation email/replay; dərs qrup/müəllim/otaq conflict-ləri; vaxt/həftə intervalı və Storage birbaşa yazma rəddini əhatə edir. Test fixture-ləri rollback edilib. `local-recovery-verification.sql` yalnız `ec_restore` üçündür, canlıya işlədilməməlidir. Lokal nəticədə anon/authenticated invite SELECT qapalıdır, Materials private/4 MB, avatars public/2 MB-dir. Bunlar **canlı bazada hələ tətbiq edilməyib**.

## Koordinasiyalı release proseduru — yalnız ayrıca icazədən sonra

1. Yuxarıdakı dörd maneəni bağlayın. Dəqiq release commit-i, üç SQL faylının hash-ləri, old deployment ID, Auth/Storage/Edge əvvəlki ayarları və maintenance operator girişini qeyd edin. `git status` təmiz, branch düzgün olmalıdır. Canlı migration history hazırda boşdur; icradan dərhal əvvəl yenidən müqayisə edin. Yeni history/schema fərqi varsa dayanın.
2. Mövcud **e-cedvel** Vercel project ID-si `prj_6Z8mY8gUMiosSJsZNR4ndixkNn00`, team ID-si `team_4EkrgFVSXtz0IJcH6RJOhgd7` ilə linki yoxlayın; yeni project yaratmayın. Production env/canonical origin ilə yeni build hazırlamaq üçün gələcəkdə `vercel deploy --prod --skip-domain` istifadə ediləcək. Bu da deploymentdir və hazırda qadağandır. `env run` istifadə etməyin. READY olmadan sonrakı addım yoxdur. Bu versiya DB keçənədək ictimai trafik almamalıdır.
3. Əvvəlcədən sınanmış maintenance/write gate-i aktiv edin. Köhnə browser-in birbaşa REST/Storage sorğusunun və legacy Edge mail relay-inin işləmədiyini sübut edin. RLS-i söndürməyin. Yalnız app səhifəsini bağlamaq kifayət deyil. Tam gate alınmırsa release dayanır.
4. Son backup-dan sonra DB/Auth/Storage dəyişibsə yeni dump və Storage delta-nı şifrələyin; hash, arxiv oxuma və izolə edilmiş restore yoxlamasını tamamlayın. Son verified backup-ı əsassız təkrar yaratmayın, amma köhnəlmiş snapshot-u son vəziyyət kimi təqdim etməyin. Pre-cutover cədvəl say/hash, istifadəçi/admin sayı və Storage manifest-i saxlayın.
5. Yalnız bu üç migration olan yoxlanmış workdir-dən CLI `db push --remote=samcakpeuxwegyzrlrwp --dry-run --skip-vault` planını oxuyun. Plan tam eyni üç fayl olmalıdır. Sonra eyni target/workdir ilə dry-run olmadan history ilə tətbiq edin. Heç bir seed/bootstrap/reset/repair əmri yoxdur. Fayllar öz transaction-larını açır; üç fayl birlikdə atomic deyil. Hər xəta maintenance-i saxlayır, history və schema oxunmadan kor-koranə rerun edilmir.
6. Yalnız planlaşdırılmış Auth dəyişikliklərini tətbiq edin: canonical Site URL, yoxlanmış callback allow-list, confirmation aktiv, minimum parol 12. Digər SMTP/MFA/provider ayarlarını qoruyun. Mövcud şablonları yalnız real test tələb edərsə dəyişin. Repo `send-invite` Edge replacement-ini 410 qaytaran versiya ilə deploy edin; JWT yoxlamasını söndürməyin. Yeni mail yolu Next `/api/send-invite` olacaq.
7. Maintenance altında read-only `supabase/verify.sql`, yeni policy/grant/function/trigger/constraint siyahısı, integrity və pre/post say/hash müqayisəsini yoxlayın. Materials privacy və ölçü/MIME dəyişiklikləri gözlənilir, digər məlumat fərqi araşdırılmalıdır. Lokal fixture scriptini canlıda işlətməyin. Yeni versiyada yalnız icazəli operator hesabları ilə read-only RLS yoxlaması aparın.
8. DB/Auth/Edge checkpoint-ləri keçəndə staged deployment-i canonical domenə promote edin. Hələ maintenance altında yalnız operator üçün giriş açın. Real Gmail invitation SMTP, Auth recovery/confirmation, invitation accept/replay və Storage upload/signed download testlərini ayrıca təsdiqlənmiş hesab və test qeydləri ilə tamamlayın. Hazırda yeni biznes test qeydi yaratmağa ümumi icazə yoxdur; release təsdiqinə bu test planı da daxil edilməlidir.
9. Vercel READY + düzgün alias/commit, canonical URL, callback cookie, runtime log-larda secret olmaması, HTTP və real axın nəticələri keçdikdən sonra write gate və maintenance-i açın. Legacy dəvətlər saxlanır, amma yeni axında etibarsızdır; superadmin yalnız nəzərdə tutulan alıcılara yenisini göndərir.
10. GitHub push/merge ayrıca icazə tələb edir. Repository workflow lokal testləri əvəz etmir; push-dan sonra CI nəticəsi ayrıca yoxlanacaq. Production branch/auto-deploy davranışını nəzərə almadan main-ə merge etməyin.

CLI `db push` və `functions deploy` sintaksisi 6 noyabr `--help` ilə yenidən yoxlanıb. Gələcək icra operatoru əvvəl yalnız təsdiqlənmiş üç migration və `send-invite/index.ts` olan ayrıca release workdir hazırlamalıdır; minimal `supabase/config.toml`-da layihə ID-si verilməli, seed/başqa config daxil edilməməlidir. Aşağıdakı əmrlər **bu yoxlamada icra edilməyib** və maneələr bağlanıb explicit release icazəsi alınmadan işlədilməməlidir:

```powershell
# $releaseWorkdir: əvvəlcədən yoxlanmış minimal release bundle-in tam yolu.
npx supabase db push --workdir $releaseWorkdir --remote=samcakpeuxwegyzrlrwp --dry-run --skip-vault
# Yalnız plan eyni üç migration göstərirsə və maintenance/backup checkpoint-ləri keçibsə:
npx supabase db push --workdir $releaseWorkdir --remote=samcakpeuxwegyzrlrwp --skip-vault --yes
# Yalnız adı göstərilən legacy relay əvəz olunur; prune/no-verify-jwt istifadə olunmur:
npx supabase functions deploy send-invite --workdir $releaseWorkdir --remote=samcakpeuxwegyzrlrwp --use-api --yes
```

Auth ayarları minimal migration bundle-dan `config push` ilə kor-koranə tətbiq edilməməlidir. Dashboard-da yalnız planlaşdırılmış sahələri dəyişin və əvvəl/sonra diff-i yoxlayın. Promotion zamanı Vercel-in faktiki yeni deployment ID-sini qeyd edin; əvvəlcədən URL/ID uydurmayın.

## Dayandırma və bərpa

- DB/Auth/Edge dəyişməyibsə: staged app-i promote etməyin, köhnə deployment işləməyə davam edə bilər, maintenance-i təhlükəsiz açın.
- İlk migration tətbiq edilibsə: köhnə `49160fc` tətbiqinə təkcə Vercel rollback etmək uyğun deyil. Maintenance-i saxlayın, uğurlu migration history-ni qoruyun, xətanı lokal nüsxədə düzəldib fix-forward edin. Qadağan olunmuş grant-ları və köhnə public Materials siyasətini geri açmayın.
- Məlumat itkisi şübhəsində: yeni yazmaları dayandırın, nasaz vəziyyətin ayrıca şifrəli dump-ını saxlayın, pre/post fərqləri çıxarın. Verified backup-ı əvvəl izolə edilmiş bazada açıb restore edin. Yeni yazıların reconcile planı və ayrıca insan təsdiqi olmadan canlıya `pg_restore --clean`, DROP/reset və ya bootstrap tətbiq etməyin.
- DPAPI eyni Windows hesabı/kompüterdən asılıdır. Kompüterdənkənar şifrəli backup və ayrıca açar saxlanması əməliyyat riskini azaldan açıq işdir. Hosted tam bərpa zəmanəti verilmir.

## Git və artefaktlar

`.env.local` və müvəqqəti `.env.smtp-test.local` ignore edilir. Backup qovluğu repo xaricindədir. Playwright PNG-ləri yalnız lokal/CI artefaktıdır; Git izləməsindən çıxarılır, diskdən silinmir. CI staging-env testlərini də icra edir. Heç bir secret, backup və generated test jurnalı commit olunmamalıdır.
