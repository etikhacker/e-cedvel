# Gmail SMTP autentifikasiya yoxlaması

Bu vasitə email göndərmir, Supabase-ə qoşulmur, Vercel deploy etmir. Tətbiqin invitation mail modulu dəyişdirilməyib; yoxlayıcı artıq onu import etmir. `-SendTest` çıxarılıb.

## Səssiz çıxışın səbəbi

Əvvəlki PowerShell wrapper yalnız stdin-i redirect edirdi. `CreateNoWindow=true` ilə başladılan Node prosesinin stdout/stderr-i wrapper tərəfindən capture/read/relay olunmurdu; görünməsi hostun inherited console handle-larından asılı qalırdı. Wrapper özü uğur nəticəsini yazmırdı və child exit 0-dan başqa heç bir nəticə sübutu tələb etmirdi. Beləliklə boş çıxışla exit 0 səssiz keçirdi. `.NET Process.Start()/WaitForExit()` PowerShell native-command pipeline-ı deyil; `$LASTEXITCODE` avtomatik təyin olunmurdu və skriptdə explicit `exit` də yox idi. Buna görə istifadəçinin `$LASTEXITCODE` sorğusu da boş qala bilərdi.

Node `verify()` çağırışını await edirdi; əvvəlki cəhdin vaxtından əvvəl Promise tamamlaması və ya həqiqi Gmail cavabı qeydə alınmadığından bunları kök səbəb kimi iddia etmirik. Əlavə qüsurlar: bütün SMTP xətalarının vahid generic mesaja çevrilməsi, parent timeout-un və nəticə protokolunun olmaması. Əvvəlki real Gmail cəhdinin uğuru/uğursuzluğu bərpa edilə bilmir.

Yeni wrapper stdout və stderr-i paralel oxuyur, amma xam məzmunu terminala çıxarmır. Yalnız sabit status/exitCode/mode JSON protokolunu yoxlayıb təhlükəsiz nəticəni özü göstərir. Child exit code və status uyğun olmalıdır. Səssiz çıxış, crash, uyğunsuz code, boş input və launcher problemi exit 5-dir. Proses üçün 45 saniyəlik xarici limit, verify üçün 30 saniyəlik limit var. Promise və async exception yolları da nəticəyə çevrilir. [Microsoft redirected streams](https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.redirectstandardoutput).

## Real yoxlama — istifadəçi özü işlədir

Windows PowerShell 5.1 və ya PowerShell 7 terminalında, dot-source (`. script`) etmədən:

```powershell
& 'D:\e-cedvel\audit-work\scripts\verify-gmail-smtp.ps1'
$LASTEXITCODE
```

Gmail App Password-u yalnız maskalanmış prompt-a daxil edin. Parolu çata, əmr sətrinə, fayla və ya env-ə yazmayın. Workspace-dəki Node 22 portable executable mövcuddursa ona üstünlük verilir; əks halda PATH-dəki Node istifadə edilir. `node_modules` və `tsx` quraşdırılmış olmalıdır. Skript parolu process arguments-ə daxil etmir; yalnız stdin borusu ilə ötürür. SMTP debug/logger söndürülüb. TLS certificate yoxlaması aktivdir və port 587-də STARTTLS tələb olunur. Xam provider səhvləri, exception text, stdout/stderr və parol loglanmır. İdarə olunan yaddaşın fiziki sıfırlanmasına zəmanət verilmir.

| Nəticə | Exit code | Mənası |
|---|---:|---|
| SMTP_AUTHENTICATED | 0 | Real rejimdə Gmail `verify()` autentifikasiyasını qəbul edib |
| SMTP_AUTH_FAILED | 2 | SMTP autentifikasiya rəddi, məsələn EAUTH/535/534 |
| SMTP_CONNECTION_FAILED | 3 | DNS, bağlantı, socket və ya verify timeout problemi |
| SMTP_TLS_FAILED | 4 | STARTTLS, certificate və ya hostname/TLS yoxlaması uğursuzdur |
| SMTP_CHECK_FAILED | 5 | Input, Node startup, async/internal xəta, səssiz exit və ya nəticə protokolu pozulub |

Həmişə ayrıca `SMTP_EXIT_CODE=<n>` göstərilir. Exit 5-də əlavə sabit `SMTP_CHECK_STAGE` mərhələsi göstərilir; bu, sirr və ya provider mesajı deyil. TLS problemi üçün certificate yoxlamasını söndürməyin. AUTH uğuru email acceptance və ya Inbox çatdırılmasını sübut etmir; bu vasitə `sendMail` çağırmır. [Nodemailer verify](https://nodemailer.com/smtp#verifying-the-configuration).

## Parolsuz və şəbəkəsiz mock sınağı

```powershell
& 'D:\e-cedvel\audit-work\scripts\verify-gmail-smtp.ps1' -MockScenario success
$LASTEXITCODE
```

`SMTP_MOCK_MODE` və `MOCK_RESULT: ...` prefiksləri mock nəticəsini real Gmail təsdiqindən ayırır. Bu rejim real SMTP transport-u yaratmır, parol soruşmur və şəbəkəyə qoşulmur. Digər ssenarilər: auth-rejected, connection-refused, tls-invalid, timeout, no-output, crash, stderr-noise, wrong-exit, hang.

Avtomatlaşdırılmış yoxlama: repo qovluğunda `npm run test:smtp-verification`. Testlər verify success/false/undefined, sync və async errors, TLS error wrapping, timeout, raw-error redaction, hər iki Windows PowerShell hostu, böyük stderr borusunun deadlock yaratmaması, boş/crashed child, səhv exit-code, parent watchdog və `&` çağırışından sonra `$LASTEXITCODE` davranışını əhatə edir. Windows host testləri başqa OS-də açıq şəkildə skip olunur.

Bu düzəliş real Gmail autentifikasiyasının uğurlu olduğunu göstərmir. İstifadəçinin düzəldilmiş real rejimi işlədib `SMTP_AUTHENTICATED` alması ayrıca tələb olunur.

6 noyabr 2026 nəticəsi: 29/29 hədəfli yoxlama, 0 skip, 0 failure; Windows PowerShell 5.1 və PowerShell 7 hər ikisi işlədi. Hədəfli ESLint və TypeScript yoxlaması keçdi. Real credential, real SMTP bağlantısı və email istifadə edilmədi.
