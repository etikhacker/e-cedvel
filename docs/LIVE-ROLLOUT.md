# Mövcud Supabase layihəsinə təhlükəsiz keçid

Yoxlama tarixi 6 noyabr 2026. Layihə `samcakpeuxwegyzrlrwp`, iş qovluğu `D:\e-cedvel\audit-work`, branch `fix/production-hardening`.

**Aktual davam:** [RELEASE-PREREQUISITES.md](RELEASE-PREREQUISITES.md). Vercel canonical URL yeniləndi; SMTP üçün faylsız gizli input vasitəsi və lokal sınanmış maintenance əməliyyatları hazırlandı. Aşağıdakı əvvəlki mərhələ qeydləri tarixçə kimi saxlanır. Auth recovery sınağı istifadəçinin qərarı ilə sonraya saxlanıb.

**Son release yoxlaması:** [RELEASE-READINESS.md](RELEASE-READINESS.md). Aşağıdakı əvvəlki qeydlərin SMTP autentifikasiyası ilə bağlı məhdudiyyətləri qalır; təzə backup üzərində üç miqrasiyanın təkrarı və Dashboard email şablonlarının oxunması artıq tamamlanıb.

## Cari vəziyyət

Üç miqrasiya canlı bazaya hələ tətbiq edilməyib. Bu iş çərçivəsində canlı Auth/Storage ayarları və biznes məlumatları dəyişdirilməyib. Bu yoxlamada agent GitHub push və deployment etməyib. Son oxunan production deployment `dpl_F9F61m7XpHBBvLPDqgy5ry1T8VEM`, READY və auditdən əvvəlki `49160fc` commitidir. Yeni UI dəyişikliyi yoxdur. İstifadəçinin son göstərişi deploy etməməkdir.

### SMTP parolu əlavə edildikdən sonrakı yoxlama

- Vercel production-da `MAIL_PROVIDER`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_FROM_EMAIL`, `SMTP_PASSWORD` hamısı mövcuddur. `SMTP_PASSWORD` Sensitive tipindədir və dəyəri istənilməyib/açılmayıb.
- Provider `smtp`, host `smtp.gmail.com`, port `587` uyğundur. Göndərən ünvanı SMTP giriş hesabı ilə eynidir. Supabase Auth da eyni Gmail hesabı, göndərən və portdan istifadə edir. Public Supabase URL düzgün `samcakpeuxwegyzrlrwp` layihəsinə aiddir.
- Lokal kompüterdən Gmail-ə sertifikat yoxlaması ilə STARTTLS bağlantısı keçib. AUTH göndərilməyib, parol istifadə edilməyib, email göndərilməyib. Bu, Vercel-dən SMTP girişinin və inbox-a çatdırılmanın sınağı deyil.
- Next.js admin dəvətlərini öz SMTP dəyişənləri ilə göndərir. Qeydiyyat təsdiqi və recovery email-ləri Supabase-in ayrıca SMTP ayarlarından istifadə edir. Bu iki xidmətin App Password-u eyni olmaq məcburiyyətində deyil. Vercel-dəki yeni parol Supabase ayarını avtomatik dəyişmir.
- Auth email təsdiqi hələ söndürülüb, minimum parol 6-dır. Site URL artıq `https://e-cedvel-etikhackers-projects.vercel.app/`-dır. Redirect siyahısı əvvəlki iki ünvandan genişlənib və wildcard alias ünvanları ehtiva edir. Bunlar bu yoxlama zamanı dəyişdirilməyib.
- `NEXT_PUBLIC_APP_URL` Vercel-də Sensitive kimi saxlanıb, dəyəri oxuna bilməyib. Onun Auth Site URL ilə uyğunluğu hələ təsdiqlənməlidir. Köhnə lokal Auth planından redirect siyahısını əvəz edən hissə çıxarılıb ki, yeni canlı ayarlar təsadüfən silinməsin. Canlıya heç bir config push edilməyib.
- Signup, recovery və Auth invitation şablonları Dashboard-da oxunub: üçü də `{{ .ConfirmationURL }}` istifadə edir. Kodda PKCE code exchange və token-hash dəstəyi var. Eyni browser/origin və query parametrlərinin saxlanması şərtilə uyğunluq mövcuddur; real emaildən davam etmə ayrıca yoxlanmalıdır.

Auth və tətbiqin email yolları üçün istinadlar [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [email təsdiqi](https://supabase.com/docs/guides/auth/general-configuration), [redirect uyğunluğu](https://supabase.com/docs/guides/auth/redirect-urls).

İstifadəçinin son qərarı mövcud Supabase layihəsindən istifadə etməkdir. `STAGING.md` ayrıca boş layihə üçün əvvəlki alternativ təlimatdır. Bu keçid üçün ayrıca Supabase layihəsi yaradılmır. `bootstrap.sql` mövcud bazada işlədilməməlidir.

## Təsdiqlənmiş yoxlamalar

- Tam PostgreSQL custom-format dump və parolsuz rol siyahısı çıxarılıb. Faylların SHA-256 və Windows DPAPI şifrələmə/açma yoxlaması keçib.
- `public`, `auth` və `storage` sxemləri şəbəkəsiz lokal PostgreSQL konteynerinə bərpa edilib. Miqrasiyalardan əvvəl 14 cədvəlin say və məzmun izləri canlı mənbə ilə uyğun gəlib.
- Üç real migration faylı bərpa edilmiş nüsxədə ardıcıllıqla uğurla işləyib. Mövcud biznes və istifadəçi məlumatları saxlanılıb. Storage bucket ayarlarının dəyişməsi gözlənilən fərqdir.
- `supabase/tests/local-recovery-verification.sql` superadmin, universitet admini, tələbə və anonim rolları, iki universitetin izolyasiyasını, dəvət replay/email yoxlamalarını, Storage icazələrini və dərs toqquşmalarını yoxlayıb. Sınaq məlumatları rollback edilib.
- İki müstəqil lokal DB sessiyasından eyni vaxt aralığına yazıda biri keçib, digəri exclusion constraint ilə rədd edilib.
- `supabase/verify.sql` həm canlı köhnə bazada, həm də lokal miqrasiya edilmiş nüsxədə işlədilib. Canlı nəticə hələ təhlükəsiz deyil. Anonim və tələbə hesabları köhnə dəvət qeydlərini oxuya bilir. Tələbə inzibati müraciət qeydinə çıxış əldə edir.
- 6 noyabr ilk təkrar yoxlamasında Auth users məzmun izi dəyişdiyindən backup yeniləndi. Yeni backup-ın lokal bərpasında 14 cədvəlin sətir sayı və məzmun izi canlı baza ilə tam uyğun gəldi. İstifadəçi sayı 10, universitet 1, fakültə 4, qrup 21, admin 1, profil 4, dəvət 8, Storage obyekt sayı 3-dür.
- SMTP dəstəyindən sonra 34 tətbiq/SQL/SMTP testi, 5 staging-konfiqurasiya testi və 11 brauzer testi keçib. Lint, TypeScript və test env ilə production build keçib, dependency audit 0 boşluq göstərib. Lokal SMTP protokol sınağı STARTTLS yoxdursa AUTH/parol göndərilmədiyini faktiki socket bağlantısında yoxlayır. Brauzer testləri mock Supabase istifadə edir, canlı hesablara daxil olmur.
- 6 noyabr canlı `verify.sql` yenidən tam işlədilib, yeddi sorğu icra olunub. Üç integrity sayğacı sıfırdır. Anonim və authenticated dəvət oxuma grant-ları hələ aktivdir. Hər iki Storage bucket hələ public-dir və ölçü/MIME məhdudiyyətləri yoxdur.

Bu sübutlar real email çatdırılmasını və real brauzer hesabları ilə bütün axınları təsdiqləmir. Canlı bazada yalnız bir universitet və bir superadmin olduğundan iki tenant ssenarisi lokal bərpa nüsxəsində yoxlanıb.

## Backup və bərpa planı

Yeni baza arxivi `D:\e-cedvel\private-recovery\samcakpeuxwegyzrlrwp-20261106` qovluğundadır. `backup-manifest.json` archive/encryption/restore yoxlamalarını, `restore-comparison.json` 14 cədvəlin müqayisəsini saxlayır. Yeni izolə edilmiş `ec-recovery-20261106` konteynerində üç miqrasiya yenidən ardıcıllıqla tətbiq edilib; `local-recovery-verification.sql` və `verify.sql` keçib. `readiness-preservation.json` 14 cədvəlin sətir sayının, bucket konfiqurasiyası xaricində 13 cədvəlin məzmun izinin dəyişmədiyini təsdiqləyir. Şifrəli ilkin dump dəyişdirilməyib.

Əvvəlki parolsuz rol nüsxəsi, Storage faylları və ilk migration sınağının sübutları `D:\e-cedvel\private-recovery\samcakpeuxwegyzrlrwp-20261105` qovluğundadır. Bərpada həmin rol nüsxəsindən istifadə olunub. Üç Storage arxivinin DPAPI açma və SHA-256 yoxlaması yenidən keçib. Storage faylları bu mərhələdə yenidən endirilməyib. Hər iki qovluq repodan kənardadır.

- `database.dump.dpapi` tam baza dump-ını saxlayır.
- `roles.sql.dpapi` parolları olmayan rol siyahısıdır.
- `backup-manifest.json` açılmış faylların ölçü və SHA-256 izlərini saxlayır.
- `storage-0.dpapi`, `storage-1.dpapi`, `storage-2.dpapi` üç mövcud Storage obyektinin ayrıca şifrələnmiş nüsxələridir. `storage-manifest.dpapi` ad, bucket və hash uyğunluğunu saxlayır.
- Bərpa jurnalları, migration jurnalları və müqayisə izləri həmin qovluqdadır. Bunlar Git-ə daxil edilməməlidir.

DPAPI faylları həmin Windows istifadəçisi və kompüterin açarlarından asılıdır. Bu, ayrıca kompüterdə bərpa edilə bilən offsite backup deyil. Daşına bilən şifrəli nüsxə və açarların ayrıca saxlanması istifadəçi tərəfindən tamamlanmalıdır. Supabase backup kataloqunda hazır backup yoxdur, PITR aktiv deyil.

6 noyabr əvvəlki şifrəli dump və rol faylları yenidən açılıb SHA-256 ilə yoxlanıb. İlk yeni backup cəhdi Docker xətası səbəbindən alınmayıb. Sonrakı yoxlamada Docker 29.7.2 işlək olub, təzə dump çıxarılıb, şifrələnib və lokal bərpa ilə yoxlanıb. Köhnə və yeni dump-ın açıq dublikatları yalnız şifrəli nüsxə yoxlandıqdan sonra silinib. Şifrəli arxivlər saxlanılır.

Əvvəlki Docker başlanma problemi `sailor-ingest.sock` üçün Windows 1920 xətası idi. Factory reset, WSL reset və ya konteyner məlumatlarının silinməsi edilməyib. Hazırkı yoxlamada Docker işlədiyi üçün bu maneə artıq yoxdur.

Bərpa sınağı mənbə PostgreSQL 17.6-dan lokal PostgreSQL 18.6-ya public/Auth/Storage sxemlərini əhatə edib. Vault və Realtime tam xidmət bərpası, Auth sessiyalarının yenidən işləməsi və hosted Supabase-in bütöv fəlakət bərpası ayrıca sınaqdan keçirilməyib.

Keçiddən əvvəl təzə dump çıxarın, şifrələyin, SHA-256 yoxlayın və izolə edilmiş nüsxədə bərpa sınağını təkrarlayın. Canlı məlumat itkisi şübhəsi yaranarsa yazmaları dayandırın, mövcud nasaz vəziyyətin ayrıca dump-ını saxlayın və yeni yazıları backup-la tutuşdurun. Mövcud bazanın üzərinə avtomatik `pg_restore --clean`, reset, DROP və ya bootstrap işlətməyin. Bərpanı əvvəl lokal nüsxədə yoxlayın. Canlı bərpa ayrıca konkret plan tələb edir.

## Keçidə mane olan ayarlar

1. Gmail SMTP dəyişənləri artıq tam mövcuddur. Qalan email şərti parolun Gmail tərəfindən qəbul edilməsi və Vercel runtime-dan real göndərişdir. Məxfi parol oxunmadığından bu nəticə hələ təsdiqlənmir.
2. Auth email təsdiqi söndürülüb, minimum parol uzunluğu 6-dır. Yeni axınla birlikdə email təsdiqi və minimum 12 simvol planlaşdırılıb. Canonical origin və redirect-lər ayrıca dəqiqləşdirilməlidir. SMTP/MFA və digər mövcud ayarlar qorunmalıdır.
3. Köhnə canlı tətbiq yeni dəvət və upload icazələri ilə işləməyəcək. İlk və üçüncü migration köhnə axınların səlahiyyətlərini bağlayır. Hazır tətbiq, Auth, Edge Function və DB koordinasiyalı keçməlidir.
4. Mövcud istifadə olunmamış legacy dəvətlər yeni axında qəbul edilmir. Keçiddən sonra superadmin həmin şəxslərə yeni dəvətlər göndərməlidir. Tarixi qeydlər silinmir.

## İcra sırası

1. Canonical tətbiq URL-i ilə Auth Site URL/callback-ləri uyğunlaşdırmaq üçün son planı hazırlayın. SMTP dəyişənləri mövcuddur, Supabase public URL düzgündür. Məxfi dəyərləri terminala çıxarmayın. `.env.local` Git-dən kənarda qalmalıdır. Real göndərmə sınağı üçün nəzarət olunan alıcı müəyyənləşdirin.
2. Dəqiq yoxlanmış kodu production env ilə domen təyin etmədən qurun. Vercel CLI üçün `deploy --prod --skip-domain` istifadə edin. Staged deployment hazır olmalıdır. `.vercelignore` env, SQL backup, test çıxışları və jurnalları upload-dan çıxarır. Server Supabase modulu paketdə qalır.
3. Qısa maintenance pəncərəsində köhnə tətbiqin yeni sorğularını dayandırın. Açıq köhnə brauzer sessiyalarının birbaşa Supabase sorğuları yenə gələ bilər. Son yoxlamalar və migration transaction-ları bu riski nəzərə almalıdır. RLS-i söndürməyin.
4. Backup-ı yeniləyin və yoxlayın. Biznes məlumatı, Storage və istifadəçi sayı üçün keçid öncəsi müqayisə izlərini saxlayın.
5. `20261105151505_authorization_and_invites.sql`, sonra `20261105151513_scheduling_integrity.sql`, sonra `20261105151520_storage_isolation.sql` tətbiq edin. Yalnız bu üç faylı migration history ilə işlədin. Xəta çıxsa məlumat silərək düzəltməyin və tətbiqi köhnə icazələrlə açmayın.
6. Yalnız yenilənmiş və yenidən diff ilə yoxlanmış Auth planını tətbiq edin. `send-invite` Edge Function-ı repodakı 410 qaytaran versiya ilə əvəz edin. Yeni tətbiqdə email göndərilməsi `/api/send-invite` vasitəsilə işləyir.
7. Canlı `verify.sql`, RLS rol yoxlamaları, integrity və say/məzmun müqayisəsini işlədin. Qəbul meyarları keçdikdə əvvəl qurulmuş tətbiqi domenlərə keçirin və maintenance-i bitirin.
8. Real email təsdiqi, recovery, dəvətin qəbul edilməsi və təkrar istifadənin rəddi, upload/signed download və tenant izolyasiyasını yoxlayın. Test üçün yalnız istifadəçinin göstərdiyi nəzarət olunan email ünvanlarından istifadə edin.
9. READY deployment, əsas domen, HTTP nəticələri və runtime xətalarını yoxlayın. Nəticələri bu sənəddə yeniləyin. GitHub push/merge ayrıca istənilməyənədək etməyin.

## Manual tamamlanacaq məsələlər

- `NEXT_PUBLIC_APP_URL` ilə Auth Site URL uyğunluğunun təsdiqi və real email testləri. Şablonlar oxunub; test alıcısı `e.cedvel.qruptap@gmail.com` üçün açıq icazə alınıb. SMTP parolu Vercel-də əlavə edilib, amma autentifikasiya hələ sınanmayıb.
- Supabase leaked-password protection plan dəstəyi və aktivləşdirilməsi.
- Dörd mövcud tələbə profilində qrup seçimi yoxdur. İstifadəçilər onboarding vasitəsilə düzgün qrupu seçməlidir. Qrup uydurulmur.
- Canlı bazada dərs sayı sıfırdır. Yeni tətbiq boş real cədvəl göstərəcək. Universitetin real cədvəli, semester_start və first_week tədris məsulunun təsdiqi ilə daxil edilməlidir.
- Daşına bilən şifrəli offsite backup və tam xidmət bərpa sınağı.

## Alət hadisəsi

6 noyabr Vercel CLI `env run` əmri gözlənilmədən ayrıca `production-env-check` layihəsi və tək deployment yaratdı. Əsas E-Cədvəl deploymenti və Supabase dəyişməyib. Yoxlama skriptində real açar yoxdur. İstifadəçinin ayrıca təsdiqindən sonra layihə silinib, Vercel API-də 404 ilə yoxlanıb. Bu köməkçi layihə production buraxılışı hesab edilmir.

## Domen olmadan Gmail SMTP hazırlığı

1. Supabase SMTP-də istifadə olunan Gmail hesabına daxil olun. [Google App Password](https://myaccount.google.com/apppasswords) bölməsində tətbiq parolu yaradın. Google bunun üçün iki mərhələli doğrulama tələb edir. [Google təlimatı](https://support.google.com/accounts/answer/185833).
2. [Vercel environment ayarlarını](https://vercel.com/etikhackers-projects/e-cedvel/settings/environment-variables) açın. `SMTP_PASSWORD` adını, həmin tətbiq parolunu, Production scope və Sensitive seçimini saxlayın. Parolu söhbətə, Git-ə və ya screenshot-a daxil etməyin. Hələ Redeploy etməyin.
3. SMTP göndərişi TLS sertifikatını yoxlayır, port 587-də STARTTLS tələb edir, port 465-də birbaşa TLS istifadə edir. Parol və SMTP məzmunu log-a yazılmır. Fayl/URL attachment oxunması bağlanıb. [Nodemailer SMTP sənədi](https://nodemailer.com/smtp).
4. Mövcud invitation rate-limit, emailə bağlı token hash, atomic consume və replay qoruması dəyişməyib. SMTP alıcını qəbul etməsə uğur qaytarılmır. SMTP qəbul cavabı inbox-a çatdırılma sübutu deyil. Şəbəkə xətası zamanı email çatmış olsa da token failed kimi bağlana bilər, buna görə avtomatik kor-koranə təkrar göndərmə edilmir.
5. UI dizaynı və email şablonu dəyişməyib. Bu kod yeni tətbiqlə birlikdə deploy edilməlidir. Köhnə Vercel versiyası SMTP provider seçimini istifadə etmir.
