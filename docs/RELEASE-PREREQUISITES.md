# Qalan release şərtləri — 6 noyabr 2026

**BLOCKED.** Əvvəlki security audit, backup restore və üç migration sınağı təkrarlanmayıb. Burada yalnız yeni URL dəyişiklikləri, SMTP yoxlama vasitəsi və maintenance qoruması hazırlanıb. Canlı SQL/Auth/Storage/Edge dəyişməsi, deployment, promote, push və real email göndərişi edilməyib.

Yeni dəyişikliklərin yoxlaması: hədəfli lint və TypeScript, 4 canonical URL testi, lokal test-env build, PowerShell parser və boş SMTP input-un şəbəkədən əvvəl rəddi keçdi. Yeni DB fence install/test/remove sınağı ayrıca lokal nüsxədə keçdi. Bunlar real Gmail və hosted Auth/Storage nəticəsi kimi təqdim edilmir.

## 1. Canonical URL: Vercel hissəsi həll olundu

Canonical URL `https://e-cedvel.vercel.app`-dır. Vercel production-domain konfiqurasiyası yenidən oxundu: domen verified, redirect yoxdur; `it24-app.vercel.app` canonical domenə 307 ilə yönləndirilir.

`NEXT_PUBLIC_APP_URL` mövcud env qeydi API ilə bu URL-ə yeniləndi, API uğurlu cavab və yeni updatedAt qaytardı. Mövcud qeyd Production və Preview üçün ortaq idi; hər iki scope saxlanıldı. Vercel Sensitive tipindən plain tipinə yerində çevirməyə 400 qaytardı. Sonrakı value-only update keçdi; heç bir env qeydi silinmədi. Dəyər public URL olsa da API read-back-i gizlədir. Aktiv deployment dəyişmədi; yeni build bu dəyəri alacaq. Preview ayrıca staging hesab edilmir və production-dakı biznes məlumatı ilə sərbəst test edilməməlidir.

Yeni `canonicalPageRedirect` production browser səhifələrini Auth cookie-si yaradılmamışdan əvvəl canonical origin-ə yönləndirir. Recovery və dəvət query-ləri saxlanır; API/mutation, preview və local sorğular dəyişmir. UI eynidir. Köhnə alias-da başlamış PKCE axını yeni origin-də verifier cookie tapa bilməyə bilər: belə axını canonical login səhifəsindən yenidən başlatmaq lazımdır. Köhnə cookie-ləri başqa domenə köçürmürük.

Canlı Auth read-only diff: Site URL hələ team alias-dır, email confirmation false, minimum parol 6; Gmail custom SMTP aktivdir. [Auth dəyişiklik planı](../supabase/operations/auth-cutover-plan.json) yalnız review üçündür, avtomatik config faylı deyil. Release zamanı canonical Site URL, dar callback query pattern-ləri, confirmation=true və minimum 12 birlikdə tətbiq olunacaq. Mövcud SMTP/MFA və başqa provider ayarları qorunacaq. Query-dəki literal `?` glob escape tələb edir; Dashboard-da JSON escape yox, tək `\?` yazılır. [Supabase redirect sintaksisi](https://supabase.com/docs/guides/auth/redirect-urls).

Əvvəl Dashboard-da oxunan signup/recovery/invite-user şablonları `{{ .ConfirmationURL }}` istifadə edir. Onlar dəyişdirilməyib. Signup → `/auth/callback` → dashboard; recovery → `/auth/callback?type=recovery` → reset-password; admin signup → kodlanmış `next=/admin/setup?token=...` davamı. Kod/query uyğunluğu yoxlanıb, real emaildən callback və cookie davamı hələ E2E sübut deyil.

## 2. Gmail SMTP: konfiqurasiya tam, real sınaq gözlənilir

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

Bu test lokal kompüterdən olur. Vercel runtime göndərişi, SMTP message acceptance və faktiki Inbox çatdırılması bu əmrlə yoxlanmır. İstifadəçinin əvvəlki real cəhdi çıxış göstərmədiyi üçün Gmail nəticəsi naməlumdur. Düzəldilmiş axın yalnız mock məlumatlarla sınanıb; real Gmail uğuru iddia edilmir. Əvvəlki `.env.smtp-test.local` yanaşması istifadə edilmir. Ayrı email delivery testi gələcək ayrıca işdir.

## 3. Supabase Auth SMTP: istifadəçi sonraya saxladı

Next.js dəvət SMTP-si və Supabase Auth SMTP-si iki ayrı credential/config dəstidir. Vercel App Password-u Auth-a kopyalanmayıb. Auth-da eyni Gmail host/port/göndərən konfiqurasiyası aktivdir; saxlanmış parol gizlidir.

İcazəli Gmail ünvanı üçün canlı read-only sorğu **0 Auth hesabı** göstərdi. Heç bir recovery əməliyyatı agent tərəfindən göndərilməyib, növbədə avtomatik göndəriş yoxdur. Qeydiyyatsız email üçün recovery API-nin ümumi uğur cavabı çatdırılma sübutu sayılmır. İstifadəçi açıq şəkildə **“sonraya saxla”** dedi; test dayandırılıb.

Gələcək test: istifadəçi artıq mövcud olan öz hesabının ünvanını və **bir recovery məktubu** üçün icazəni verir; əvvəl email sətirinin mövcudluğu yoxlanır. Recovery token/göndərilmə vaxtı yenilənə bilər, şifrə dəyişdirilmir. Inbox təsdiqindən sonra yeni tətbiq hazır olduqda eyni browser-də recovery linki → canonical callback → reset-password səhifəsi yoxlanır; parol dəyişmə submit-i ayrıca istifadəçi tərəfindən edilir. Signup confirmation və admin invitation E2E üçün ayrıca icazəli test hesabı/dəvəti lazımdır; mövcud adminləri dəyişmək və ya gizli test user yaratmaq olmaz.

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

1. SMTP və Auth testlərindəki açıq işləri bağlayın; release commit/SQL hash-ləri və operator IP-ni təsdiqləyin. Mövcud yoxlanmış backup-ı əsassız təkrar yaratmayın; yalnız yeni DB/Auth/Storage dəyişiklikləri onu köhnəldibsə yeniləyin.
2. Explicit deployment icazəsindən sonra yeni production build-i domenə promote etmədən hazırlayın. Yeni env və canonical redirect kodu bu build-də birlikdə olmalıdır; köhnə mock `.next` istifadə olunmur.
3. Vercel WAF gate-i aktivləşdirib iki şəbəkədən yoxlayın. Köhnə legacy `send-invite` Edge relay-i repo 410 replacement-i ilə bağlayın; artıq gedən çağırışların bitməsini gözləyin. Bu ayrıca təsdiqlənmiş release əməlidir, indi deploy edilmir.
4. `install-release-write-fence.sql`-i birbaşa postgres operator sessiyasında tətbiq edin. Trigger sayını və enable vəziyyətini yoxlayın. Köhnə JWT ilə read-only/no-op REST yazma cəhdi və icazəli təzə Storage test yolu rədd olunmalıdır. Yan keçmə varsa miqrasiyaya başlamayın. Auth signup-ı bu maintenance müddətində müvəqqəti bağlamağı əvvəlcədən planlaşdırın; mövcud session/tokenləri silməyin.
5. Son backup/baseline checkpoint-i tamamlayın. Üç migration history ilə əvvəlki təsdiqlənmiş ardıcıllıqda tətbiq olunur. Operator backfill-lərinə fence mane olmur. Xəta çıxsa fence/WAF saxlanır; sonrakı migration və promote dayanır.
6. Yeni Auth Site URL/redirect/confirmation/minimum-password planını tətbiq edin; SMTP/MFA-ya toxunmayın. `verify.sql`, say/məzmun müqayisəsi və policy checkpoint-lərini tamamlayın. Recovery zamanı gözlənilən Auth timestamp dəyişikliklərini məlumat itkisi ilə qarışdırmayın.
7. Yeni tətbiqi canonical domain-ə promote edin, WAF və DB fence hələ qalsın. Operator yeni versiyanın READY/commit/alias/read-only səhifələrini yoxlasın. Yeni kodda səhv varsa fence qalır, fix-forward edilir.
8. Bütün komponentlər uyğun olduqda DB fence-i götürün; WAF altında operator icazəli real sınaqları tamamlasın. Bu andan birbaşa Supabase klientləri yenidən yaza bilər, ancaq artıq yeni RLS/constraint-lər qüvvədədir. Köhnə invitation/upload axınları fail-closed qalır; istifadəçilər canonical səhifəni yeniləməlidir. “Bütün dünya hələ bağlıdır” fərziyyəsi ilə test aparmayın.
9. Qəbul yoxlamaları keçdikdə WAF müvəqqəti qaydasını götürün və planlaşdırılmış signup vəziyyətini bərpa edin. Email confirmation aktiv qalır. GitHub push/merge ayrıca icazə ilədir.

### Dayanma / bərpa

İlk migration-dan əvvəl abort olarsa fence-i çıxarmaq və WAF-ı açmaq mümkündür; Edge relay-i 410-a çevirmişiksə köhnə mail axını müvəqqəti bağlı qalacaq, təhlükəli relay-i avtomatik geri qaytarmayın. İlk migration-dan sonra köhnə tətbiqə tək Vercel rollback olmaz. Fence/WAF saxlanır, lokal nüsxədə fix-forward hazırlanır. Məlumat itkisi şübhəsində ayrıca nasaz vəziyyət backup-ı və yeni yazıların reconcile planı hazırlanır. Avtomatik reset, `pg_restore --clean`, bootstrap və RLS-in söndürülməsi yoxdur.

## İndi tələb olunan konkret addım

İstifadəçi maskalanmış SMTP authentication skriptini öz terminalında işlədir və yalnız nəticəni bildirir. Sonra ayrıca bir test emailinin SMTP acceptance və Inbox təsdiqi qeydə alınır. Auth testi istifadəçinin qərarı ilə təxirə salınıb. Operator IP/WAF canlı təsdiqi və hosted Storage checkpoint-i release pəncərəsində ayrıca tamamlanmalıdır. Bu işlər bitmədən READY deyil.
