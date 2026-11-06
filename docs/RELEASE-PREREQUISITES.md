# Qalan release şərtləri — 6 noyabr 2026

**SMTP nəticələri — PASSED:** lokal Gmail SMTP autentifikasiyası və bir test məktubunun Inbox çatdırılması tamamlanıb. Supabase Auth-un ayrıca recovery məktubu da Inbox-a çatıb və istifadəçi təsdiqləyib. [Gmail sübutu](SMTP-DELIVERY-TEST.md), [Auth sübutu](AUTH-DELIVERY-TEST.md). Heç bir email testi təkrarlanmamalıdır. Recovery linki açılmayıb, parol sıfırlanmayıb. Callback E2E, Vercel runtime və maintenance checkpoint-ləri açıqdır.

**BLOCKED — maintenance hazırlığı və koordinasiyalı keçid icazəsi gözlənilir.** Əvvəlki audit, backup restore və üç migration sınağı təkrarlanmayıb. Ayrıca açıq icazə ilə bir adi Auth test hesabı yaradılıb və bir recovery məktubu göndərilib. Production miqrasiyaları, Auth konfiqurasiya dəyişməsi, Edge/Vercel deployment, promote və push edilməyib. Hazırkı sənəd yenilənməsi əlavə canlı yazma/email əməliyyatı etmir.

Yeni dəyişikliklərin yoxlaması: hədəfli lint və TypeScript, 4 canonical URL testi, lokal test-env build, PowerShell parser və boş SMTP input-un şəbəkədən əvvəl rəddi keçdi. Yeni DB fence install/test/remove sınağı ayrıca lokal nüsxədə keçdi. Bunlar real Gmail və hosted Auth/Storage nəticəsi kimi təqdim edilmir.

## 1. Canonical URL: Vercel hissəsi həll olundu

Canonical URL `https://e-cedvel.vercel.app`-dır. Vercel production-domain konfiqurasiyası yenidən oxundu: domen verified, redirect yoxdur; `it24-app.vercel.app` canonical domenə 307 ilə yönləndirilir.

`NEXT_PUBLIC_APP_URL` mövcud env qeydi API ilə bu URL-ə yeniləndi, API uğurlu cavab və yeni updatedAt qaytardı. Mövcud qeyd Production və Preview üçün ortaq idi; hər iki scope saxlanıldı. Vercel Sensitive tipindən plain tipinə yerində çevirməyə 400 qaytardı. Sonrakı value-only update keçdi; heç bir env qeydi silinmədi. Dəyər public URL olsa da API read-back-i gizlədir. Aktiv deployment dəyişmədi; yeni build bu dəyəri alacaq. Preview ayrıca staging hesab edilmir və production-dakı biznes məlumatı ilə sərbəst test edilməməlidir.

Yeni `canonicalPageRedirect` production browser səhifələrini Auth cookie-si yaradılmamışdan əvvəl canonical origin-ə yönləndirir. Recovery və dəvət query-ləri saxlanır; API/mutation, preview və local sorğular dəyişmir. UI eynidir. Köhnə alias-da başlamış PKCE axını yeni origin-də verifier cookie tapa bilməyə bilər: belə axını canonical login səhifəsindən yenidən başlatmaq lazımdır. Köhnə cookie-ləri başqa domenə köçürmürük.

Canlı Auth read-only diff: Site URL hələ team alias-dır, email confirmation false, minimum parol 6; Gmail custom SMTP aktivdir. [Auth dəyişiklik planı](../supabase/operations/auth-cutover-plan.json) yalnız review üçündür, avtomatik config faylı deyil. Release zamanı canonical Site URL, dar callback query pattern-ləri, confirmation=true və minimum 12 birlikdə tətbiq olunacaq. Mövcud SMTP/MFA və başqa provider ayarları qorunacaq. Query-dəki literal `?` glob escape tələb edir; Dashboard-da JSON escape yox, tək `\?` yazılır. [Supabase redirect sintaksisi](https://supabase.com/docs/guides/auth/redirect-urls).

Əvvəl Dashboard-da oxunan signup/recovery/invite-user şablonları `{{ .ConfirmationURL }}` istifadə edir. Onlar dəyişdirilməyib. Signup → `/auth/callback` → dashboard; recovery → `/auth/callback?type=recovery` → reset-password; admin signup → kodlanmış `next=/admin/setup?token=...` davamı. Kod/query uyğunluğu yoxlanıb, real emaildən callback və cookie davamı hələ E2E sübut deyil.

## 2. Gmail SMTP: autentifikasiya və Inbox çatdırılması tamamlandı

Vercel Production metadata və qeyri-məxfi dəyərlər yenidən yoxlanıb:

| Dəyişən | Yoxlama |
|---|---|
| MAIL_PROVIDER | smtp |
| SMTP_HOST / SMTP_PORT | smtp.gmail.com / 587 |
| SMTP_USER | e.cedvel.qruptap@gmail.com |
| SMTP_FROM_EMAIL | E-Cedvel <e.cedvel.qruptap@gmail.com> |
| SMTP_PASSWORD | Production, Sensitive, mövcuddur; oxunmayıb |

Parolu **çata, env faylına, repoya, command argument-ə və shell history-yə yazmayın**. Öz PowerShell pəncərənizdə:

```powershell
& 'D:\e-cedvel\audit-work\scripts\verify-gmail-smtp.ps1'
```

Maskalanmış `Read-Host -AsSecureString` sorğusunda Vercel-də saxlanılan **eyni** App Password-u daxil edin. Skript parolu yalnız child-process stdin-ə ötürür; diskə və env-ə yazmır, SMTP debug-u söndürür. BSTR buffer-i finally-də sıfırlanır, proses bitir; JS/.NET idarə olunan yaddaşın dərhal fiziki silinməsinə zəmanət verilmir. Terminalda transkripsiya/screenshot aparmayın. Vercel Sensitive parolunu geri oxuya bilmədiyimiz üçün eyni parol olduğunu operator təsdiqləyir. Çıxış və exit-code xətasının düzəlişi: [SMTP-VERIFICATION.md](SMTP-VERIFICATION.md).

Bu əmr **yalnız autentifikasiyadır**; `-SendTest` və Node delivery rejimi çıxarılıb. `SMTP_AUTHENTICATED` (0), `SMTP_AUTH_FAILED` (2), `SMTP_CONNECTION_FAILED` (3), `SMTP_TLS_FAILED` (4), yaxud yerli proses/input/protokol xətası üçün `SMTP_CHECK_FAILED` (5) göstərir. Nəticədən dərhal sonra `$LASTEXITCODE` oxuna bilər. Boş çıxış və child exit 0 artıq uğur sayılmır.

Bu əmr lokal kompüterdə yalnız autentifikasiyanı yoxlayır. İstifadəçi düzəldilmiş skriptdə `SMTP_AUTHENTICATED`, exit 0 aldı. Ayrıca bir icazəli göndəriş `250 2.0.0` ilə qəbul olundu və `omrbabayev455@gmail.com` Inbox çatdırılması istifadəçi tərəfindən təsdiqləndi. Bu yoxlamaları təkrarlamayın. Vercel runtime və Supabase Auth-un ayrıca SMTP credential-i bu nəticə ilə təsdiqlənmir. Əvvəlki `.env.smtp-test.local` yanaşması istifadə edilmir.

## 3. Supabase Auth SMTP recovery çatdırılması: PASSED

Next.js dəvət SMTP-si və Supabase Auth SMTP-si iki ayrı credential/config dəstidir. Vercel App Password-u Auth-a kopyalanmayıb. Auth-da eyni Gmail host/port/göndərən konfiqurasiyası aktivdir; saxlanmış parol gizlidir.

İstifadəçi hesab yaratmağa və bir recovery məktubuna ayrıca açıq icazə verdi. Başlanğıc yoxlamasında `omrbabayev455@gmail.com` üçün 0 hesab və `auth.users` üçün 0 qeyri-sistem trigger vardı. Bir adi, emaili hələ təsdiqlənməmiş hesab yaradıldı; son yoxlamada 1 hesab, 0 universitet admin sətri, 0 public profil sətri təsdiqləndi.

Hesab server-side Auth API ilə təsadüfi, yalnız yaddaşda saxlanmış müvəqqəti parolla yaradıldı. Recovery API-yə yalnız bir POST göndərildi: HTTP 200, cavab `{}`. DB-də `recovery_sent_at=2026-11-06 18:30:19.863243+00` qeydə alındı. İstifadəçi məktubun Inbox-a çatdığını təsdiqlədi. Birbaşa Gmail SMTP cavabı Auth API-də göstərilmir; API nəticəsi və faktiki Inbox təsdiqi ayrı sübutlardır. Retry yoxdur; hesab ayrıca icazə olmadan silinməyəcək.

Bu sınaq Auth email çatdırılmasını yoxladı, callback/session/parol dəyişmə axınını yoxlamadı. Link açılmayıb; bu məktubu gələcək callback E2E üçün istifadə etməyin: PKCE browser axınından başlanmayıb və recovery yönləndirməsi yalnız email çatdırılma sınağı üçün idi. Tam callback E2E yeni tətbiq aktivləşəndə, ayrıca icazə ilə canonical login-dən eyni browser-də başladılmalıdır. Yeni email, signup hesabı, universitet admin dəvəti və parol dəyişmə submit-i ayrıca icazə tələb edir. Hazırda bunların heç biri icra olunmur.

Canlı signup, recovery və invite-user şablonlarının hamısı `{{ .ConfirmationURL }}` istifadə edir. Signup/recovery ilə tətbiqin PKCE callback-i statik baxışda uyğundur; actual query allow-list uyğunluğu, token exchange və cookie davamı hələ real E2E deyil. Dashboard-un **Invite user** əməliyyatı universitet admin dəvəti ilə eyni axın deyil; onu tətbiqin invitation testinin əvəzi kimi işlətməyin. Tətbiqin dəvəti Next.js emaili → admin setup → signup confirmation → server-side dəvət istehlakı ardıcıllığıdır.

Auth SMTP aktivdir: Gmail 587, eyni göndərən; ayrıca saxlanmış parol oxunmadan real Auth delivery ilə yoxlandı. Credential və email çatdırılma blocker-i bağlanıb. Vercel runtime-dan tətbiqin dəvət göndərişi hələ ayrıca release qəbul checkpoint-idir.

## 4. Maintenance: iki qatlı plan və lokal sübut

### Vercel trafik qatı

Deploy-dan asılı olmayan Dashboard WAF custom rule hazırlanmalıdır: bütün project host/path-lərində operatorun təsdiqlənmiş egress IP/CIDR-i xaricində sorğuları deny etsin. Qaydaları bütöv overwrite etməyin; ayrıca müvəqqəti rule əlavə edin, onun ID-sini saxlayın. Plan dəstəyi, faktiki operator IPv4/IPv6 ünvanı və ikinci şəbəkədən deny/operatordan allow yoxlaması canlı keçid checkpoint-idir. IP-ni təxmin etməyin. Mövcud firewall config sorğusu `404 Config not found` qaytardı; bu, WAF maintenance-in artıq işlədiyini və ya planın onu dəstəklədiyini sübut etmir. İndi heç bir qayda aktivləşdirilməyib. [Vercel custom rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules).

### Birbaşa Supabase yazmaları

Təkcə WAF, CORS, logout və ya `pgrst.db_pre_request` Storage/bütün köhnə klientləri dayandırmır. [Supabase pre-request məhdudiyyəti](https://supabase.com/docs/guides/api/securing-your-api).

`supabase/operations/install-release-write-fence.sql` ayrıca, **release icazəsi tələb edən əməliyyat**dır; üç audit migration-ına əlavə edilməyib. O, 10 public cədvəl və `storage.objects` üçün BEFORE STATEMENT trigger qurur. INSERT/UPDATE/DELETE/TRUNCATE yalnız birbaşa `postgres` operator sessiyası üçün mümkündür; API rolları, storage sessiyası və SECURITY DEFINER daxilindən gələn yazmalar PT503 ilə dayanır. RLS söndürülmür və köhnə policy-lər dəyişdirilmir. `session_user` yoxlaması definer funksiyasının postgres-ə çevrilərək qorumanı keçməsini dayandırır. [PostgreSQL session identity](https://www.postgresql.org/docs/17/functions-info.html).

Install tək transaction-dır, lock timeout 5 saniyədir; davam edən DB yazmalarını gözləyir, vaxt bitərsə bütöv rollback olur. Mövcud schema/trigger adı ilə toqquşma varsa əvəz etmir, dayanır. `remove-release-write-fence.sql` yalnız bu əməliyyatın öz trigger/function/schema-sını CASCADE olmadan götürür. Biznes sətirləri silinmir. Operator DB açarı browser/runtime-a verilmir.

Yeni lokal test şəbəkəsiz `ec_restore` nüsxəsində keçdi: 11 trigger; operator backfill yolu; anon/authenticated definer cəhdi; service-role birbaşa və definer cəhdi; Storage session yazması; rollback və remove-dan sonra 0 trigger. Əvvəlki migration/RLS auditi təkrarlanmadı. Test konteyneri yenidən dayandırılıb.

Bu qoruma **biznes və Storage metadata yazma dayanmasıdır**, bütün Supabase xidmətlərinin offline rejimi deyil. Public read/CDN downloads və bəzi Auth session fəaliyyəti davam edə bilər. Realtime/Vault/Storage service-in bütün daxili işlərinə zəmanət verilmir. İstifadəçinin artıq göndərdiyi upload-lar bitənədək gözləyin. Storage-nin rəsmi mənbəyində normal upload permission probe-u binary yazmadan əvvəl işləyir; hosted layihənin həmin davranışı ayrıca canlı checkpoint-də təsdiqlənməlidir. [Storage uploader mənbəyi](https://github.com/supabase/storage/blob/master/src/storage/uploader.ts). Qoruma altında mövcud faylı overwrite/delete edərək test etməyin; yalnız ayrıca təsdiqli yeni test yolu istifadə oluna bilər.

### Koordinasiyalı icra sırası — indi icra edilmir

1. SMTP delivery testlərini təkrarlamayın. Release commit/SQL hash-ləri, operator IP/CIDR, maintenance vaxtı və keçid üçün açıq icazə təsdiqlənməlidir. Yeni Auth test hesabı və recovery timestamp-i əvvəlki backup-da yoxdur: cutover-da son backup/baseline mütləq yenilənsin və yeni arxivin bərpa oluna bildiyi təsdiqlənsin; köhnə backup saxlanılsın. Tam security auditini təkrar aparmaq lazım deyil.
2. Explicit deployment icazəsindən sonra workspace-i məhz mövcud `e-cedvel` layihəsinə bağlayın: project `prj_6Z8mY8gUMiosSJsZNR4ndixkNn00`, team `team_4EkrgFVSXtz0IJcH6RJOhgd7`. Hazırda lokal `.vercel/project.json` yoxdur; CLI-nin yeni layihə yaratmasına yol verməyin. Vercel hazırda Node 24.x, yoxlanmış lokal/CI mühiti Node 22-dir: build-dən əvvəl Vercel runtime-ı 22.x-ə uyğunlaşdırın və API-dən oxuyub təsdiqləyin. Sonra yeni production build-i domenə promote etmədən, operatorla məhdud girişlə hazırlayın. Aliassız production build də deployment-dir və indi qadağandır. Yeni env və canonical redirect kodu birlikdə olmalıdır; köhnə mock `.next` istifadə olunmur. Build uğuru və birbaşa URL-in ictimai əlçatan olmaması checkpoint-dir.
3. Vercel WAF gate-i aktivləşdirib iki şəbəkədən yoxlayın. Köhnə legacy `send-invite` Edge relay-i repo 410 replacement-i ilə bağlayın; artıq gedən çağırışların bitməsini gözləyin. Bu ayrıca təsdiqlənmiş release əməlidir, indi deploy edilmir.
4. `install-release-write-fence.sql`-i birbaşa postgres operator sessiyasında tətbiq edin. Trigger sayını və enable vəziyyətini yoxlayın. Köhnə JWT ilə read-only/no-op REST yazma cəhdi və icazəli təzə Storage test yolu rədd olunmalıdır. Yan keçmə varsa miqrasiyaya başlamayın. Auth signup-ı bu maintenance müddətində müvəqqəti bağlamağı əvvəlcədən planlaşdırın; mövcud session/tokenləri silməyin.
5. Son backup/baseline checkpoint-i tamamlayın. Üç migration history ilə bu ardıcıllıqda tətbiq olunur: `20261105151505_authorization_and_invites.sql` → `20261105151513_scheduling_integrity.sql` → `20261105151520_storage_isolation.sql`. Canlı migration history hazırda boşdur; SQL fayllarının hash-ləri yoxlanmış lokal nüsxə ilə eynidir. Hər migration ayrı transaction-dır, üçü birlikdə atomik deyil. Operator backfill-lərinə fence mane olmur. Xəta çıxsa fence/WAF saxlanır; sonrakı migration və promote dayanır. Live `supabase/tests/local-recovery-verification.sql` və `bootstrap.sql` işlədilmir.
6. Yeni Auth Site URL/redirect/confirmation/minimum-password planını tətbiq edin; SMTP/MFA-ya toxunmayın. `verify.sql`, say/məzmun müqayisəsi və policy checkpoint-lərini tamamlayın. Recovery zamanı gözlənilən Auth timestamp dəyişikliklərini məlumat itkisi ilə qarışdırmayın.
7. Yeni tətbiqi canonical domain-ə promote edin, WAF və DB fence hələ qalsın. Operator yeni versiyanın READY/commit/alias/read-only səhifələrini yoxlasın. Yeni kodda səhv varsa fence qalır, fix-forward edilir.
8. Bütün komponentlər uyğun olduqda DB fence-i götürün; WAF altında operator icazəli real sınaqları tamamlasın. Bu andan birbaşa Supabase klientləri yenidən yaza bilər, ancaq artıq yeni RLS/constraint-lər qüvvədədir. Köhnə invitation/upload axınları fail-closed qalır; istifadəçilər canonical səhifəni yeniləməlidir. “Bütün dünya hələ bağlıdır” fərziyyəsi ilə test aparmayın.
9. Qəbul yoxlamaları keçdikdə WAF müvəqqəti qaydasını götürün və planlaşdırılmış signup vəziyyətini bərpa edin. Signup testinə maintenance daxilində ehtiyac varsa yalnız test üçün ayrıca razılaşdırılmış qısa pəncərədə açın; WAF birbaşa Auth API-ni qorumur. Email confirmation aktiv qalır.
10. Ayrı GitHub icazəsindən sonra yalnız təsdiqlənmiş feature branch push edilir, `main` üçün PR açılır, CI/review tamamlanır, sonra ayrıca merge icazəsi alınır. Push/merge-dən əvvəl Vercel Git production branch və avtomatik deployment davranışını faktiki yoxlayın; təsadüfi ikinci deployment-ə yol verməyin. GitHub CI hələ uzaqda işləməyib; lokal test nəticəsini uzaq CI kimi təqdim etməyin.

### Dayanma / bərpa

İlk migration-dan əvvəl abort olarsa fence-i çıxarmaq və WAF-ı açmaq mümkündür; Edge relay-i 410-a çevirmişiksə köhnə mail axını müvəqqəti bağlı qalacaq, təhlükəli relay-i avtomatik geri qaytarmayın. İlk migration-dan sonra köhnə tətbiqə tək Vercel rollback olmaz. Fence/WAF saxlanır, lokal nüsxədə fix-forward hazırlanır. Məlumat itkisi şübhəsində ayrıca nasaz vəziyyət backup-ı və yeni yazıların reconcile planı hazırlanır. Avtomatik reset, `pg_restore --clean`, bootstrap və RLS-in söndürülməsi yoxdur.

## İndi tələb olunan konkret addım

İstifadəçi maintenance zamanı işlədəcəyi sabit public IPv4/IPv6 və ya CIDR-i, ikinci şəbəkədən yoxlama imkanını və uyğun keçid vaxtını müəyyən etməlidir. Bundan sonra bütün hostları əhatə edən müvəqqəti qayda konkret hazırlanır və ayrıca keçid icazəsi alınır. Son read-only Vercel yoxlaması Node 24.x və firewall `404 Config not found` göstərdi; SSO `all_except_custom_domains` aktivdir, password/trusted-IP protection aktiv deyil. Bu metadata maintenance-in faktiki işlədiyini sübut etmir. Plan dəstəyi və operator allow / başqa şəbəkə deny canlı yoxlanmadan DB migration başlamır. Node 22.x uyğunlaşdırılması və yeni build ayrıca deployment icazəsindən sonra edilir.

Auth cutover-da Site URL canonical olmalıdır; signup `/auth/callback`, recovery `/auth/callback?type=recovery`, invitation signup kodlanmış `next=/admin/setup?token=...` allow-list-i hazır JSON plana əsasən əlavə edilir. Mövcud SMTP konfiqurasiyası dəyişdirilmir. Confirmation=true və minimum password=12 yeni tətbiqlə birlikdə aktivləşdirilir. Faktiki query matching, PKCE code exchange, cookie/session və son səhifə ayrıca real qəbul sınaqlarıdır. Statik uyğunluq və uğurlu Inbox bu sınaqları əvəz etmir.

## Yerli release paketinin tamlığı

`fix/production-hardening` branch-i, üç migration, tətbiq düzəlişləri, testlər, CI və konfiqurasiya nümunələri mövcuddur. SMTP receipt, `.env.local`, backup arxivləri, `.vercel` və yaradılmış test materialları commit-ə daxil edilmir. SMTP göndərişinin məxfi olmayan nəticəsi və bir dəfə göndərmə vasitəsi ayrıca yerli commit-ə daxil edilir.

`src/app/auth/calback/route.ts` yazılış səhvinə baxmayaraq köhnə URL-lər üçün qəsdən saxlanmış callback re-export-udur. İki Supabase client modulu browser/server sərhədləri üçündür, artıq dublikat deyil. Köhnə `muracietler_delete_policy.sql` və `public_catalog_policies.sql` istifadəyə cəhd ediləndə dayanan arxiv stublarıdır; yalnız üç versioned migration icra olunur. `functions/send-invite` 410 replacement-i hələ lazımdır. İşlək kod silinməyib və UI dəyişməyib.

Yoxlanmış backup: `D:\e-cedvel\private-recovery\samcakpeuxwegyzrlrwp-20261106`, 6 noyabr 16:26 UTC; manifestdə encryption/archive/restore verification true və 14 cədvəl var. Lokal rehearsal-da cədvəl sayları qorunub; bucket konfiqurasiyası gözlənilən dəyişiklikdir. DPAPI backup eyni Windows hesabı/maşınına bağlıdır; tam hosted restore və ayrıca portable/offsite bərpa sübutu deyil. 18:29 UTC-də yaradılmış Auth test hesabı bu backup-dan sonradır; yeni baseline onu və recovery timestamp-ini nəzərə almalıdır. İndiki sənəd/read-only hazırlıq mövcud istifadəçi və universitet məlumatlarını dəyişməyib.
