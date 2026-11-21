# Phase C — Production Acceptance və GitHub Release Planı (8 noyabr 2026)

Layihə `samcakpeuxwegyzrlrwp` · repo `etikhacker/e-cedvel` · branch `fix/production-hardening` · production `https://e-cedvel.vercel.app`.
Bu sənəd yalnız hazırlıqdır: **push, merge, deploy, email, hesab yaratma və upload icra edilməyib.**

## 1. Production və lokal kod fərqi

| Məsələ | Nəticə |
|--------|--------|
| Canlı build | `dpl_FiJ5BSo9g5pbcmhW5m8bbHybPGMa` — commit `c6783b6` ("fix: prepare authenticated maintenance and pin Node 22"), branch `fix/production-hardening`, Ready, Production/Current, alias `e-cedvel.vercel.app` |
| Lokal HEAD | `531ab48` ("docs: record verified phase one production checkpoint") |
| `c6783b6..HEAD` fərqi | **Yalnız sənəd**: `README.md`, `docs/PHASE-1-RESULT.md`, `docs/RELEASE-PREREQUISITES.md` (+57 sətir). `src/`, `supabase/`, `scripts/`, `.github/`, `package.json` — **sıfır fərq** |
| İş ağacı | 2 dəyişdirilməmiş sənəd (bu sənədin və Phase B nəticələrinin sənədləri) — commit edilməlidir |
| `main` → branch | 10 commit, 99 fayl (69 kod faylı); merge-base = `49160fc` = `main` HEAD → **fast-forward, konflikt yoxdur** |

**Nəticə:** production ilə lokal arasında tətbiq kodu fərqi yoxdur. Yeni build deploy etməyə ehtiyac yoxdur; yeganız nəzarət altında yeni build yaratmaq və ya `main`a merge etmək planı lazımdır.

## 2. Dağıdıcı olmayan qəbul yoxlamaları (icra edildi — `private-recovery/phaseC-acceptance.ps1`)

**16/16 keçdi** (`PHASEB_ACCEPTANCE_PASSED`):

- Marşrutlar (cookiesiz): `/` → 200, `/login` → 200, `/dashboard` → 307, `/admin` → 307, `/reset-password` → 307, `/auth/callback` → 307, `/api/public/catalog?type=universities` → 200, `type=faculties&university_id=…` → 200
- Storage: public avatar obyekti → **200**; `Materials` bucket → `public=false`; Materials obyekti anonim olaraq oxunmur
- RLS (rol-simulyasiya, yalnız SELECT): anon invite oxuma → **42501**, anon universitet → 1 (public), `authenticated` profil → 0 (süzülür), `authenticated` dərs → 0 (süzülür), `authenticated` invite oxuma → **42501**
- Qeydlər: 11 user, 1 universitet, 1 admin, 8 invite, 4 profil, 3 storage obyekti — dəyişməyib
- Loglar: Vercel Runtime Logs (production deployment) → **Error 0, Fatal 0, Warning 0**; brauzer konsolu → 0 xəta
- Bloklama qeydi: Supabase Management API-nin köhnə `logs.all` endpoint-i silinmiş, yeni `/analytics/endpoints/logs` SQL səthisi məhduddur (`select *` və `information_schema` qadağan) → DB tərəfi log təhlili üçün Dashboard Logs UI və ya SQL `postgres_logs` görünüşü lazımdır.

## 3. GitHub və CI hazırlığı

- Repo **public**, default branch `main`; `gh` CLI `etikhacker` hesabı ilə autentifikasiya olunub (skoplar: `repo`, `workflow`, `read:org`, `gist`)
- `.github/workflows/ci.yml` **yalnız branch-də** var (7b242c7 commiti ilə əlavə olunub), `main`-də `.github` yoxdur → GitHub Actions hələ **0 run** (heç vaxt işə düşməyib). PR açılanda `pull_request` trigger-i ilə ilk dəfə işə düşəcək
- CI məzmunu: `npm ci`, `lint`, `typecheck`, `test`, `test:staging-config`, `npm audit`, `build`, `test:e2e` (Playwright) + artefakt yükləmə. **`supabase db push` və ya hər hansı migration addımı YOXDUR** → merge heç bir migration təkrarlamır
- Vercel: repo `etikhacker/e-cedvel` ilə qoşulub (31 may), **Production branch = `main`** (auto-deploy), Preview = bütün digər branch-lər, `Development` = CLI ilə
- `.vercelignore`: `.env*`, `.git`, `.github`, `/docs`, `/tests`, `/supabase`, `/scripts`, `/output` bloklanır → build artefaktında SQL/migration/env yoxdur
- `package.json` `engines.node = 22.x`; `.npmrc` yoxdur (engine mismatch build-i dayandırmır)

## 4. Təhlükəsizlik yoxlaması (tracked fayllar)

- Tracked sensitive tapıntı: **yalnız `.env.example`** (şablon — `YOUR_STAGING_*` placeholder-ləri, real dəyər yox)
- `.env`, `.dump`, `.dpapi`, backup qovluqları, `private-recovery/` — **tracked deyil**, `.gitignore` ilə qorunur
- Kodda `SUPABASE_SERVICE_ROLE_KEY` yalnız `process.env` oxunuşu və test fixture-ləri kimi istifadə olunur; real açar/sifrə/parol **yoxdur**
- Untracked (ignored deyil) fayl: **yoxdur**

## 5. Real qəbul testləri (A3 və A4 icra edildi; A1/A2 rədd edildi)

Hər test üçün nəzarət olunan ünvan, ölçü məhdudiyyəti və gözlənilən nəticil müəyyən edilmişdir.

### A1 — Yeni qeydiyyat + email təsdiqi
- **Ön şərt:** `disable_signup=false`, `mailer_autoconfirm=false` (təsdiq ON), SMTP `smtp.gmail.com:587` aktiv.
- **Addımlar:** `/login` → qeydiyyat → nəzarət olunan email → ad/universitet/qrup/parol (≥12 simvol) → təsdiq email-i göndər → email-dəki link → PKCE exchange → dashboard.
- **Gözlənilən:** `auth.users` +1 (`email_confirmed_at` null → sonra dolur), `auth.identities` +1, `public.profiles` +1 (qrupla), email inbox-a gəlir, `/auth/callback` → 200 və dashboard açılır.
- **Production təsiri:** yeni auth user + profil qeydi. **Test hesabının silinməsi ayrıca icazı tələb edir** (silmək əvəzinə saxlanması daha təhlükəsizdir).

### A2 — Parol bərpası (recovery)
- **Ön şərt:** A1-də yaradılan hesab.
- **Addımlar:** `/login` → "parolu unutmusunuz" → email → recovery link → `/reset-password` → yeni parol (≥12, əvvəlkindən fərqli) → daxil ol.
- **Gözlənilən:** recovery email gəlir; yeni parol işləyir, köhnə parol **işləmir**; `auth.users.password_changed_at` yenilənir; session token-ləri etibarsızlaşır.
- **Risk:** parol dəyişikliyi → ayrıca icazı.

### A3 — Universitet admin dəvəti (superadmin → admin)
- **Ön şərt:** mövcud superadmin hesabı (1 admin) ilə daxil olmaq + nəzarət olunan email.
- **Addımlar:** `/admin` → dəvət yarat → email göndərilir → dəvət linki ilə qeydiyyat → ilk giriş → admin paneli.
- **Gözlənilən:** `public.university_invites` +1 (`delivery_status='sent'`), `auth.users` +1, `public.university_admins` +1 (`role='university_admin'`), email gəlir, **token replay rədd edilir** (2-ci istifadə → `invalid_invitation`), tələbə axını `university_requests` → superadmin təsdiqi.
- **Production təsiri:** yeni admin + invite qeydi -> icazı tələb edir.
- **Nəticə (icra edildi):** `e.cedvel.qruptap@gmail.com` üçün dəvət yaradıldı və **email göndərildi** (UI: "Dəvət emaili göndərildi!"). `public.university_invites` +1 (`delivery_status='sent'`, `used=false`, 7 günlük etibarlılıq), `auth.users` 11 (dəyişmədi), `public.university_admins` 1 (qəbul edildikdən sonra +1 olacaq). **Qalan addım:** dəvət linkinin inbox-dan açılması və universitet admin hesabının yaradılması (istifadəçinin inbox-ı ilə).

### A4 — Upload və Storage izolyasiyası
- **Ön şərt:** daxil olmuş superadmin/universitet admin.
- **Addımlar:** `/admin` → fakültə/qrup → Materials-a fayl yüklə (PDF/PNG, ≤4MB) → avatar yüklə (≤2MB) → signed download.
- **Gözlənilən:** `storage.objects` +1 (Materials, private), public avatar **200**, Materials obyekti anonim olaraq **400/403**, başqa tenant admin faylı görmür, MIME/ölçü limitləri tətbiq olunur.
- **Production təsiri:** yeni Storage obyekti -> icazı tələb edir.
- **Nəticə (icra edildi, `PHASE_C_A4_PASSED`, 10/10):** production `POST /api/uploads` real fayl ilə iki dəfə **200** qaytarıldı: avatar (`avatars`, public bucket, 460 bayt PNG, public URL **200**) və material (`Materials`, private bucket). Materials obyekti anonim olaraq **400**; anonim signed URL rədd edilir (**400**), sahib (owner) signed URL alır (**200**), yəni tenant izolyasiyası təsdiqləndi. Limitlər tətbiq olunur: MIME uyğunluğu **400**, 4 MB-dan böyük fayl **413**, avatar üçün 2 MB limiti **400**. Profil məlumatı dəyişmədi (`profiles.photo_url` eyni qaldı), `auth.users` 11, `university_invites` 9.
- **Qeyd (UI məhdudiyyəti):** admin rollu hesablar `/dashboard`-dan `/admin`-ə yönləndirilir (`src/app/dashboard/layout.tsx:9`), ona görə profil/upload UI superadmin üçün əlçatan deyil. Test tətbiqin öz `POST /api/uploads` yolu ilə aparıldı (eyni-origin + cookie sessiya + MIME/obyekt bayt yoxlaması + `serviceSupabase()` yazması). Material yükləmə üçün `public.subjects` boşdur (fənn yoxdur), fənn yaratmaq ayrıca icazı tələb edir.

## 6. GitHub PR və merge planı (İCRA EDİLMƏYİB)

### 6.1 Təhlükəsizlik xüsusiyyətləri (artıq təsdiqlənib)
1. CI **migration təkrarlamır** (`supabase db push` yoxdur).
2. Vercel build artefaktında `supabase/`, `tests/`, `scripts/`, `docs/`, `.env*` yoxdur.
3. `main` → branch fast-forward; konflikt gözlənilmir.
4. **Risk:** Vercel Git repo qoşulub və Production branch `main` → `main`-a merge **avtomatik production deployment** yaradır. Bu, "uydurmayan build" riskinin əsas mənbəyidir.

### 6.2 Tövsiyə olunan ardıcıllıq (Təhlükəsiz variant)
1. Vercel → Settings → General → **Automatic Deployments = off** (yalnız merge anında yeni production build yaranmasın).
2. Əvvəlcə 2 dəyişdirilmiş sənədi commit et (`docs/LIVE-ROLLOUT.md`, `docs/RELEASE-PREREQUISITES.md` + bu sənəd) — commit mesajı: `docs: record phase B production release and phase C acceptance plan`.
3. `git push -u origin fix/production-hardening` → branch GitHub-da yaranır (production-ə toxunmur).
4. `gh pr create --base main --head fix/production-hardening` → PR açılır → CI (`pull_request`) ilk dəfə işə düşür.
5. CI keçəndən sonra review → **squash merge** və ya merge-commit ilə `main`-a merge.
6. Automatic Deployments hələ söndürülü halda main-a push **production deployment yaratmır** → production alias-ı dəyişmir.
7. Ayrıca icazə ilə eyni `c6783b6` build-i production-a qur (`vercel --prod --skip-domain` və ya Dashboard → Promote) → smoke → müşahidə.
8. Automatic Deployments-i geri qaytar.

### 6.3 Sadə variant (CI + avtomatik build)
Merge → avtomatik production build (main-dan, eyni app kodu) → build logunda **Node 22** təsdiqlənir → smoke → problem olarsa köhnə build-in `vercel --prod --skip-domain` ilə qaytarılması və ya "Instant Rollback".
**Risk:** Node.js project setting (24.x/22.x seçimi) əvvəlcədən `22.x`-ə sabitlənməlidir; avtomatik build uğursuz olsa production dəyişmir (Vercel əvvəlki deployment-ı saxlayır).

### 6.4 Pre-merge checklist (read-only, indi tamamlanıb)
- [x] `c6783b6..HEAD` diff yalnız sənəd
- [x] migration/operations/test/CI faylları tracked
- [x] tracked secret yoxdur (yalnız `.env.example` şablon)
- [x] branch `main`-in ancestor-u (fast-forward)
- [x] CI migration təkrarlamır
- [x] `.vercelignore` build-ə SQL/env daxil etmir
- [ ] Node.js project setting `22.x` ilə təsdiqləndi (build logu)
- [x] 2 dəyişdirilmiş sənəd + bu sənəd commit edildi (yerli commit, **push edilməyib**)
- [ ] istifadəçinin push/merge icazəsi

## 7. Phase C icra nəticələri (8 noyabr 2026)

- **Production = lokal kod:** `c6783b6..HEAD` arasında yalnız sənəd dəyişikliyi var (`531ab48`), tətbiq kodu fərqi **yoxdur**. Production deployment `dpl_FiJ5BSo9g5pbcmhW5m8bbHybPGMa` = Production/Current, alias `e-cedvel.vercel.app`.
- **Funksional qəbul:** 16/16 yoxlama keçir (`/`, `/login`, `/dashboard`, `/admin`, `/reset-password`, `/auth/callback`, catalog 2/2, RLS 5/5, Storage 3/3). Yekun təkrar icrasında eyni nəticə; yalnız "uç qeydlər baseline" dəyişdi (A3 dəvəti +1, A4 Storage obyektləri +5), bu gözlənilən və icazəli dəyişiklikdir.
- **Loglar:** Vercel Runtime Logs: Error **0**, Fatal **0**, Warning **0** ("All systems normal"). Request Logs: A4 sorğuları canonical hostda göründü (`/api/uploads` 200 / 200 / 400 / 413 / 400).
- **Təhlükəsizlik:** tracked fayllarda real açar, backup və ya `.env` yoxdur (yalnız `.env.example` şablonu); `.dump`/`.dpapi`/`private-recovery` tracked deyil.
- **GitHub hazırlığı:** `fix/production-hardening` branch-i `main`-in ancestor-udur (10 commit, fast-forward, konflikt yoxdur); `.github/workflows/ci.yml` yalnız branch-dədir və `supabase db push` **yoxdur**; repo public-dir. Vercel Production branch `main`, ona görə merge anında avtomatik deployment riski var.
- **Evidence:** `private-recovery/phaseB-20261107-191427/` (`phasec-*.json`), `private-recovery/phaseC-acceptance.ps1`, `private-recovery/phaseC-upload.ps1`.
- **Qalan blokajlar:** (1) A3: dəvət linkinin inbox-dan açılması və universitet admin hesabının yaradılması; (2) A4: material yükləmə üçün fənn (`public.subjects`) yoxdur, fənn yaratmaq ayrıca icazı tələb edir; (3) push/merge üçün yazılı icazı yoxdur; (4) Node.js project setting `22.x` build logunda təsdiqlənməlidir; (5) Supabase DB logları Management API ilə əlçatan deyil, Dashboard Logs UI lazımdır.
