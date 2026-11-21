# Supabase Auth recovery email — PASSED

Layihə: `samcakpeuxwegyzrlrwp`. Alıcı: `omrbabayev455@gmail.com`.

İstifadəçi bir adi test hesabı və yalnız bir recovery məktubu üçün açıq icazə verdi. Başlanğıc read-only yoxlaması: 0 mövcud hesab, 0 qeyri-sistem `auth.users` trigger-i.

- Hesab yaradılması: 2026-11-06 18:29:52 UTC, Auth API HTTP 200. Təsadüfi müvəqqəti parol yalnız proses yaddaşında yaradıldı, göstərilmədi və faylda saxlanılmadı.
- Recovery: bir POST, HTTP 200, boş JSON `{}`; avtomatik retry edilmədi.
- DB təsdiqi: `recovery_sent_at=2026-11-06 18:30:19.863243+00`; 1 adi authenticated hesab, 0 universitet admin sətri, 0 public profil sətri. Email təsdiqlənməmiş, sign-in edilməmişdi.
- İstifadəçi məktubun **Inbox-a çatdığını** təsdiqlədi: **PASSED**.
- Recovery linki açılmayıb, parol sıfırlanmayıb. Hesab saxlanılır; silmək ayrıca icazə tələb edir.

Bu, Next.js SMTP-dən ayrı Supabase Auth-un real çatdırılma sübutudur. Auth API birbaşa Gmail SMTP server cavabını qaytarmır. Token/code exchange, callback, cookie və reset-password səhifəsi bu testdə yoxlanmayıb. Mövcud linki E2E testi kimi istifadə etməyin; yeni axın/email yalnız ayrıca icazə ilədir.

Məxfi olmayan yerli receipt-lər `D:\e-cedvel\private-recovery\auth-cutover\authorized-20261106-omrbabayev455` altındadır, Git xaricindədir. Exclusive attempt lock-larını silməyin və testi təkrarlamayın. Başqa istifadəçi, Auth ayarı, SQL migration, Vercel deployment və GitHub push dəyişməsi edilmədi.

Yeni hesab əvvəlki 16:26 UTC backup-da yoxdur. Production cutover baseline/backup bu icazəli əlavə məlumatı da qorumalıdır.
