# Baza modeli və icazələr

Canlı layihənin schema/policy metadatası 5 noyabr 2026 tarixində oxunub. Şəxsi istifadəçi qeydləri hesabat üçün endirilməyib. Bu işdə canlı DDL/DML və deploy icra edilməyib.

## Əlaqələr

`universities → faculties → groups → schedule_lessons`.
`profiles.id → auth.users.id`, `profiles.group_id → groups.id`.
`university_admins.id → auth.users.id`, admin tenantı `university_id`.
`university_invites` email, tenant, hash, son tarix və istifadə vəziyyətini saxlayır.
`muracietler` və `university_requests` platforma müraciətləridir; onların açıq tenant ID-si olmadığından yalnız superadmin idarə edir.
`subjects` tenant səviyyəli fənn kataloqudur, istəyə bağlı group_id saxlayır.

Yeni composite FK-lar fakültə–qrup, qrup–profil, qrup–dərs və qrup–fənn əlaqələrində universitet uyğunluğunu məcbur edir. Köhnə məlumatı avtomatik silən düzəliş yoxdur.

## Rol matrisi

| Resurs | Anonim | Tələbə | University admin | Superadmin |
|---|---|---|---|---|
| Aktiv universitet/fakültə/qrup kataloqu | Oxu | Oxu | Oxu; öz tenantında fakültə/qrup yaz | İdarə |
| Cədvəl | Yox | Seçilmiş qrupunu oxu | Öz tenantında idarə | Hamısını idarə |
| Profil | Yox | Öz profilini idarə | Öz profilini idarə | Öz profilini idarə |
| Admin rolları | Yox | Yalnız öz təyinatını oxu, əgər varsa | Öz təyinatını oxu | İdarə |
| Müraciətlər | Yalnız etibarlı ilkin müraciət əlavə et | Yalnız əlavə et | Yalnız əlavə et | Oxu/yenilə/sil |
| Dəvətlər | Bearer linkini serverdə yoxlat | Öz emailinə uyğun dəvəti qəbul et | Öz emailinə uyğun dəvəti qəbul et | API vasitəsilə yarat |
| Materiallar | Yox | Öz qovluğu | Öz qovluğu | Öz qovluğu |
| Avatarlar | Açıq şəkilləri oxu | Öz faylını sil; upload API | Eyni | Eyni |

`user_metadata` rol qərarında istifadə edilmir. Qeydiyyatdakı qrup seçimi şəxsi seçimdir; FK/RLS uyğunluğunu baza yoxlayır. UI gizlətməsi icazə sərhədi deyil.

## Miqrasiyalar

1. `20261105151505_authorization_and_invites.sql`: restrictive RLS, rol normallaşdırması (`admin → university_admin`), profil qeydləri/bildiriş ayarları, semestr sahələri, dəvət hash-ləri, atomik qəbul və müraciət təsdiqi, tenant FK-ları.
2. `20261105151513_scheduling_integrity.sql`: tenantın qrupdan çıxarılması; vaxt/day/week/subgroup yoxlamaları; müəllim, otaq və qrup üçün GiST exclusion constraints; fənn tenantı.
3. `20261105151520_storage_isolation.sql`: Materials şəxsi olur; qovluq icazələri; limitlər; birbaşa upload/update bloklanır; server API format yoxlayıb yeni obyekt yaradır.

Hər fayl tranzaksiyadır. İkinci fayl köhnə konflikt varsa bütövlükdə dayanır. Bütün miqrasiyalar bir ümumi tranzaksiya deyil; aralıq versiyalarda köhnə tətbiq işləməyə bilər. Maintenance pəncərəsi və staging yoxlaması lazımdır.

Köhnə permissive siyasətlər saxlanılır, yeni restrictive siyasətlərlə kəsişdirilir. Bu, tanınmayan köhnə qaydanın icazəni genişləndirməsinin qarşısını alır. Dəvət cədvəlinə client grant-ları da geri alınır. RLS heç vaxt söndürülmür.

`private` sxemini Data API-yə expose etməyin. Privileged funksiyalar burada saxlanılır; public RPC-lər security-invoker wrapper-lardır. Daxili funksiyalarda verified auth.uid və baza rolu yoxlanır, search_path boşdur, PUBLIC execute geri alınır.

## Konflikt semantikası

Vaxtlar `HH:MM-HH:MM`, başlanğıc < son. Aralıq `[başlanğıc, son)` olduğundan 10:30-da bitən və 10:30-da başlayan dərslər toqquşmur. Üst/alt həftə intervalı ayrıdır. Müəllim/otaq konflikti altqrupdan asılı deyil. Qrup konflikti tam qrup və ya kəsişən altqrup üçün tətbiq edilir. Universitetlər bir-birindən ayrıdır.

PostgreSQL exclusion constraints paralel tranzaksiyaların eyni resursu rezerv etməsinə qarşı DB mexanizmidir. Yerli testlər constraint-in rədd nəticələrini yoxlayır; iki ayrı production bağlantısı ilə yarış testi hələ aparılmayıb.

## Məlumatların qorunması

`saved_grades`, `saved_details`, `absences`, şəkil URL-ləri və material obyektləri silinmir. Köhnə açıq bearer dəvətlərinin raw token sahələri tarixçə kimi qalır, ancaq yeni API yalnız token_hash qəbul edir. Onları yenidən göndərin.

Avatarlar açıq qalır, köhnə URL-lər işləməyə davam edir. Materials public URL-ləri qəsdən şəxsi rejimə keçir; tətbiq signed URL yaradır. UUID ilə başlayan istifadəçi qovluğu olmayan legacy materialları avtomatik kiməsə mənimsətməyin; sahibini yoxlayıb ayrıca planla köçürün.

`NOT VALID` məhdudiyyətlər köhnə qeydləri silmir, yeni yazılışları yoxlayır. Staging-də preflight-dan sonra uyğun constraint-ləri ayrıca VALIDATE edin.

## İstinadlar

[Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client),
[PostgreSQL exclusion constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION),
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
