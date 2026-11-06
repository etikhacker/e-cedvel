# Bir dəfə icazəli SMTP göndərişi — 6 noyabr 2026

**Real nəticə təsdiqləndi:** yerli receipt `mode=real`, `SMTP_ACCEPTED`, exit 0 və SMTP **250 2.0.0** göstərir. Göndəriş vaxtı 6 noyabr 2026, 22:14:44 (Asia/Baku). Alıcı və mövzu aşağıdakı icazə ilə tam uyğundur. İstifadəçi məktubun **Inbox-a çatdığını** təsdiqlədi. Əlavə göndəriş və retry edilmədi. Bu nəticə lokal Gmail SMTP yolunundur; Vercel runtime və Supabase Auth SMTP sınağı deyil.

İstifadəçi real authentication yoxlamasında `SMTP_AUTHENTICATED`, exit 0 aldığını bildirib. Bu, istifadəçinin bildirdiyi nəticədir; inbox delivery sübutu deyil.

Bu ayrıca əməliyyat üçün icazə: **bir** email, alıcı `omrbabayev455@gmail.com`, mövzu **E-Cədvəl — SMTP Test**. Göndərən `E-Cedvel <e.cedvel.qruptap@gmail.com>`. Mətn yalnız E-Cədvəl email sisteminin yoxlanıldığını bildirir, link/token və hər hansı əməliyyat tələbi yoxdur.

```powershell
& 'D:\e-cedvel\audit-work\scripts\send-authorized-smtp-test.ps1'
$LASTEXITCODE
```

App Password yalnız maskalanmış terminal sorğusunda daxil edilir. Chat, fayl, env və process arguments-ə yazılmır. Tətbiqin eyni `mailConfig`, Nodemailer transport və `smtpAccepted` yoxlaması istifadə olunur. Invitation/database modulu çağırılmır, real dəvət yaradılmır. Bir `sendMail` çağırışı var, retry yoxdur.

Göndərmədən əvvəl exclusive `attempt.lock` yaradılır. Qovluq: `output/smtp-delivery/authorized-20261106-omrbabayev455/`. İkinci çağırış `SMTP_ALREADY_ATTEMPTED` (8) ilə dayanır. Lock-u silməyin və nəticə qeyri-müəyyəndirsə təkrar göndərməyin. Yeni cəhd ayrıca istifadəçi icazəsi tələb edir. Mock qovluğu real göndərişdən ayrıdır.

| Nəticə | Kod | Şərh |
|---|---:|---|
| SMTP_ACCEPTED | 0 | SMTP alıcını/məktubu qəbul edib; Inbox sübutu deyil |
| SMTP_NOT_ACCEPTED | 6 | SMTP qəbul meyarı keçməyib |
| SMTP_DELIVERY_UNKNOWN | 7 | Şəbəkə/SMTP xətası; qəbul olub-olmadığı qeyri-müəyyəndir, retry yoxdur |
| SMTP_ALREADY_ATTEMPTED | 8 | Bu icazənin göndəriş cəhdi artıq başlayıb |
| SMTP_CHECK_FAILED | 5 | Yerli input/proses/nəticə problemi; təkrar etmədən receipt-i yoxlayın |

`SMTP_RESPONSE_CODE` və `SMTP_ENHANCED_STATUS` yalnız rəqəmli sanitizə edilmiş SMTP cavabıdır. Tam server cavabı, queue ID, parol və exception mətni göstərilmir. `receipt.json` yalnız təhlükəsiz nəticəni, vaxtı, alıcı və mövzunu saxlayır; parol saxlamır. Bu qovluq Git tərəfindən ignore olunur. Proses nəticə yazmadan dayansa lock qalır və duplicate qarşısını alır.

Hazırlıq yoxlamaları keçib: hədəfli lint, TypeScript, mock SMTP acceptance və ikinci mock çağırışın rəddi (8). Sonradan istifadəçi gizli credential girişini tamamladı; yuxarıdakı real nəticə ayrıca `authorized-20261106-omrbabayev455/receipt.json` qeydinə əsaslanır.

SMTP acceptance və istifadəçinin Inbox təsdiqi birlikdə qeydə alınıb. Production Supabase/Auth, UI, Vercel və GitHub dəyişdirilməyib.
