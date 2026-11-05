# Staging və production yerləşdirməsi

**Hazırkı status:** kod və SQL yerli hazırlanıb. Supabase miqrasiyaları, Edge Function yeniləməsi, GitHub push və Vercel production deploy icra edilməyib. Canlı köhnə icazələr hələ dəyişməyib.

## 1. Hazırlıq

1. Supabase backup/snapshot yaradın; bərpa prosedurunu staging-də yoxlayın.
2. Cari schema, grant və policy snapshot-ını saxlayın. `supabase/verify.sql` yalnız oxuma yoxlamalarıdır.
3. `university_admins` təyinatlarını Auth istifadəçiləri ilə tutuşdurun. Köhnə açıq INSERT səbəbindən yalnız rol sahəsinə baxıb bütün mövcud adminləri etibarlı saymaq olmaz.
4. İstifadə edilməmiş köhnə dəvətləri yenidən göndərmək üçün siyahı hazırlayın. Yeni axın exposed raw token-ləri qəbul etmir.
5. Staging layihəsində schema və anonimləşdirilmiş nümunə məlumat ilə miqrasiyaları yoxlayın. Yeni boş layihə üçün əvvəl `supabase/bootstrap.sql`; mövcud bazada bu bootstrap faylını işlətməyin.

## 2. SQL tətbiqi

CLI sintaksisi bu işdə `--help` ilə yoxlanıb. İcra etməzdən əvvəl istifadə etdiyiniz CLI versiyasının help nəticəsini yenidən yoxlayın:

```sh
npx supabase db push --help
npx supabase db push --remote=YOUR_STAGING_PROJECT_REF --dry-run --skip-vault
npx supabase db push --remote=YOUR_STAGING_PROJECT_REF --skip-vault
```

Production üçün əvvəl backup, staging nəticələri və istifadəçi təsdiqi tələb olunur. Eyni əmrlərdə yalnız layihə ref-i dəyişir. Bu sənəddəki placeholder-ları kor-koranə production-a tətbiq etməyin.

Miqrasiya ikinci mərhələdə conflict/invalid time səbəbilə dayanarsa dərsləri avtomatik silməyin. İlgili qeydləri tədris məsulu ilə düzəldin, sonra miqrasiyanı təkrarlayın. İlk miqrasiya artıq tətbiq edilmiş ola bilər; maintenance rejimini saxlayın.

Dashboard SQL Editor alternativdir: üç faylı sırası ilə icra edin və migration history-ni ayrıca düzgün qeyd edin. Sonradan CLI-nin eyni migration-ı ikinci dəfə işlətməsinə imkan verməyin.

## 3. Supabase Dashboard

- Authentication → URL Configuration: Site URL = dəqiq HTTPS production origin-i.
- Redirect allow-list: production və development üçün `/auth/callback`, invitation davamı olan query URL-lər; köhnə `/auth/calback` linkləri compatibility route ilə qalır. Preview URL-ləri yalnız nəzərdə tutulan domenlərlə məhdudlaşdırın.
- Email confirmation aktiv olsun. Minimum parol uzunluğunu ən az 12 edin.
- Leaked-password protection aktiv edin (audit zamanı deaktiv idi; plan dəstəyini yoxlayın).
- Default PKCE email confirmation redirect axınından istifadə edin. Token-hash şablonu varsa `type=email`/ `type=signup` və recovery üçün `type=recovery` uyğun olsun. Invitation təsdiqində `next=/admin/setup?token=...` davamı saxlanılmalıdır.
- Adi təsdiqin dashboard-a, recovery-nin reset-password səhifəsinə yönləndiyini real email ilə yoxlayın.
- Data API exposed schemas yalnız nəzərdə tutulan sxemlər olsun; **private expose edilməsin**.
- Hər universitet üçün `semester_start` (tədrisin ilk həftəsinin bazar ertəsi) və `first_week` (`ust`/ `alt`) daxil edin. Tarix məlum deyilsə təxmin etməyin; tətbiq naməlum vəziyyət göstərir.
- Storage: `Materials` böyük M ilə, private; maksimum 4 MB. `avatars` public, maksimum 2 MB. Kiçik hərfli mövcud bucket varsa env-i onun adına uyğunlaşdırın.
- Legacy material yollarının sahibi müəyyən deyilə obyektləri silməyin; ayrıca yoxlanmış köçürmə planı hazırlayın.
- Advisor hesabatını yeniləyin, RLS testlərini ayrıca iki tenant hesabı ilə təkrarlayın.

## 4. Köhnə email relay-i bağlayın

Canlı `send-invite` Edge Function rol yoxlamadan email göndərirdi. Yeni tətbiq onu çağırmır, lakin köhnə endpoint ayrıca bağlı qalmalıdır:

```sh
npx supabase functions deploy send-invite --remote=YOUR_STAGING_PROJECT_REF --use-api
```

Repodakı replacement 410 qaytarır. JWT yoxlamasını söndürən flag istifadə etməyin. Production replacement yalnız təsdiqdən sonra deploy edilməlidir. Email göndərmə funksiyası yeni Next.js `/api/send-invite` endpointində qalır.

## 5. Resend və Vercel

Resend-də göndərən domenin DNS/SPF/DKIM təsdiqini tamamlayın. `RESEND_FROM_EMAIL` həmin domenin ünvanı olmalıdır; development `onboarding@resend.dev` production üçün istifadə edilmir.

Vercel Root Directory bu repodur; Framework Next.js, Node 22, Build `npm run build`, Install `npm ci`. README-dəki bütün environment dəyişənlərini uyğun Preview/Production scope-da daxil edin. `NEXT_PUBLIC_` dəyişənləri build vaxtında yerləşdiyindən dəyişəndə rebuild lazımdır. Service-role və Resend açarları server-only qalmalıdır.

Preview başqa origin-dədirsə Vercel-in `VERCEL_ENV=preview` və `VERCEL_URL` dəyərləri CSRF allow-list üçün istifadə olunur. Dəvət linkinin hədəfi `NEXT_PUBLIC_APP_URL` olaraq qalır: staging-də production URL istifadə etməyin.

Tətbiq və DB bir-birindən asılıdır: maintenance pəncərəsində əvvəl SQL/Edge Function, sonra uyğun tətbiq versiyası. Köhnə kod yeni private cədvəllər və Storage yazma qaydaları ilə işləməyəcək. Rollback zamanı köhnə geniş icazələri geri açmaq əvəzinə yeni kodu düzəltməyi üstün tutun.

## 6. Buraxılışın qəbul yoxlaması

- Qeydiyyat → real email təsdiqi → seçilmiş qrup/profil → refresh.
- Recovery email → yeni parol → çıxış → yeni parolla giriş.
- Superadmin dəvəti → doğru email ilə qəbul; yanlış email, expired və replay rədd edilməlidir.
- Tələbə müraciətləri/tokenləri oxuya bilməməli; admin A tenant B-yə yaza bilməməlidir.
- İki ayrı DB sessiyasından eyni resursa paralel INSERT: yalnız biri uğurlu olmalıdır.
- Admin dərs əlavə etdikdən sonra tələbə cədvəli fokus/60 saniyə ilə yenilənməlidir.
- Şənbə, üst/alt həftə, tam/altqrup, boş cədvəl.
- Avatar/material upload və signed download; başqa hesabın faylını oxu/sil cəhdi.
- Resend göndərilmə və DB status xətalarında saxta uğur olmamalıdır.
- PWA update, offline fallback, iki hesab arasında keş izolyasiyası.
- Vercel READY, production alias və real URL HTTP/browser yoxlaması.

Bu son canlı yoxlamalar bu sessiyada icra edilməyib.
