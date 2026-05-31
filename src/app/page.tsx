"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import s from './landing.module.css';

/* ─── Data ─────────────────────────────────────────────── */

const STATS = [
  { icon: '🏫', trend: '↗ Artır',  value: '150+', label: 'Aktiv İstifadəçi'  },
  { icon: '📋', trend: '↗ +34%',   value: '2.4K', label: 'Yaradılan Cədvəl'  },
  { icon: '⏱',  trend: '↗ +18%',   value: '1.2x', label: 'Vaxt Qənaəti'      },
  { icon: '🎯', trend: '↗ +24%',   value: '~0',   label: 'Cədvəl Toqquşması' },
];

const FEATURES = [
  { icon: '🏢', title: 'Multi-tenant Struktur',
    desc: 'Hər universitet öz izolyasiya edilmiş mühitdə işləyir. Fakültə, kafedra və qruplar ayrıca idarə olunur.' },
  { icon: '🔄', title: 'Avtomatik Toqquşma Yoxlaması',
    desc: 'Müəllim, otaq və qrup toqquşmaları real vaxtda aşkarlanır. Konfliktsiz cədvəl yaratmaq artıq asandır.' },
  { icon: '📱', title: 'Tam Responsiv İnterfeys',
    desc: 'Tələbələr və müəllimlər cədvələ istənilən cihazdan — telefon, tablet, kompüterdən — baxa bilərlər.' },
  { icon: '👥', title: 'Rol Əsaslı Giriş',
    desc: 'Admin, müəllim, tələbə və dekan üçün fərqli giriş səviyyələri. Hər rol yalnız lazımi məlumatı görür.' },
  { icon: '📤', title: 'PDF / Excel Export',
    desc: 'Cədvəlləri bir kliklə PDF və ya Excel formatında ixrac edin. Çap üçün hazır formatlar dəstəklənir.' },
  { icon: '🔔', title: 'Bildiriş Sistemi',
    desc: 'Cədvəl dəyişiklikləri haqqında tələbə və müəllimlərə avtomatik bildirişlər göndərilir.' },
];

const STEPS = [
  { title: 'Qeydiyyat & Konfiqurasiya',
    desc: 'Universitetinizi qeydiyyatdan keçirin, fakültə və kafedra strukturunu qurun. İlk dəfə 5 dəqiqədə hazır olursunuz.' },
  { title: 'Dərs & Müəllim Yükləyin',
    desc: 'Müəllimlər, fənlər, otaqlar və qrupları sisteme əlavə edin. Excel ilə toplu yükləmə dəstəklənir.' },
  { title: 'Cədvəl Yayımlayın',
    desc: 'Konfliktsiz cədvəli təsdiqləyib bütün istifadəçilərlə paylaşın. PDF export avtomatik işləyir.' },
];

/* ─── Schedule Grid ─────────────────────────────────────── */

type CellType = 't' | 'b' | 'y' | '';

const TIMES = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30'];
const GROUPS = ['GR-101', 'GR-102', 'GR-201', 'GR-202', 'GR-301'];

const GRID: CellType[][] = [
  ['t', '',  'b', 't', '' ],
  ['',  'y', 't', '',  'b'],
  ['b', 't', '',  'y', 't'],
  ['',  '',  'y', 'b', '' ],
  ['y', 'b', '',  '',  'y'],
  ['t', '',  't', '',  'b'],
];

const cellCls: Record<CellType, string | undefined> = {
  t: s.scT, b: s.scB, y: s.scY, '': s.scEmpty,
};
const cellLbl: Record<CellType, string> = {
  t: 'Riyaz.', b: 'Fizika', y: 'Kimya', '': '',
};

function ScheduleGrid() {
  return (
    <div className={s.scGrid}>
      <div />
      {GROUPS.map((g) => <div key={g} className={s.scHd}>{g}</div>)}
      {TIMES.map((time, ri) => (
        <>
          <div key={`t-${ri}`} className={s.scTime}>{time}</div>
          {GRID[ri].map((cell, ci) => (
            <div key={`${ri}-${ci}`} className={cellCls[cell]}>
              {cell !== '' ? cellLbl[cell] : null}
            </div>
          ))}
        </>
      ))}
    </div>
  );
}

/* ─── Icons ─────────────────────────────────────────────── */

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1L2 3.5V7C2 10 4.5 12.5 7 13C9.5 12.5 12 10 12 7V3.5L7 1Z"
        stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7L5.5 10.5L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <polygon points="6.5,5 11,8 6.5,11" fill="currentColor" />
    </svg>
  );
}

/* ─── Page ──────────────────────────────────────────────── */

export default function LandingPage() {
  const router = useRouter();

  // Əgər istifadəçi artıq daxil olubsa → dashboard-a yönləndir
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard');
    });
  }, [router]);

  return (
    <div className={s.page}>

      {/* ── NAV ── */}
      <nav className={s.nav}>
        <Link href="/" className={s.logo}>
          <div className={s.logoBox}>EC</div>
          E-Cədvəl
        </Link>
        <ul className={s.navLinks}>
          <li><a href="#features">Xüsusiyyətlər</a></li>
          <li><a href="#stats">Statistika</a></li>
          <li><a href="#how">Necə İşləyir</a></li>
          <li><a href="#contact">Əlaqə</a></li>
        </ul>
        <div className={s.navCtas}>
          <Link href="/login" className={s.btnGhost}>Daxil Ol</Link>
          <a href="#contact" className={s.btnTeal}>Müraciət et →</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={s.hero}>

        {/* Left */}
        <div className={`${s.heroL} ${s.fadeUp} ${s.d1}`}>
          <div className={s.badge}>
            <span className={s.dot} />
            Universitet üçün SaaS platforma · Beta v1.0
          </div>
          <h1 className={s.heroH1}>
            Dərs Cədvəlini
            <span>Ağıllı İdarə Et</span>
          </h1>
          <p className={s.heroDesc}>
            Multi-tenant cədvəl sistemi ilə universitetin bütün fakültə, qrup və müəllim
            cədvəlini rahatlıqla yaradın, paylaşın və konflikt olmadan idarə edin.
          </p>
          <div className={s.heroBtns}>
            <Link href="/login" className={s.btnTealLg}>Başla →</Link>
            <a href="#how" className={s.btnOutlineLg}>
              <PlayIcon /> Demo İzlə
            </a>
          </div>
          <div className={s.trust}>
            <span className={s.trustItem}><ShieldIcon /> Məlumat Təhlükəsizliyi</span>
            <span className={s.trustItem}><CheckIcon /> 14 gün pulsuz sınaq</span>
            <span className={s.trustItem}><CheckIcon /> Kart tələb olunmur</span>
          </div>
        </div>

        {/* Right — schedule visual */}
        <div className={`${s.heroR} ${s.fadeUp} ${s.d3}`}>
          <div className={`${s.fc} ${s.fcTl}`}>
            <div className={s.fcVal}>+18%</div>
            <div className={s.fcLbl}>vaxt effektivliyi</div>
          </div>

          <div className={s.schedCard}>
            <div className={s.scHead}>
              <span className={s.scTitle}>📅 Bu həftə — Mühəndislik Fakültəsi</span>
              <div className={s.scDays}>
                <span className={s.scDay}>B.e</span>
                <span className={s.scDayOn}>Ç.a</span>
                <span className={s.scDay}>Ç</span>
                <span className={s.scDay}>C.a</span>
                <span className={s.scDay}>C</span>
              </div>
            </div>
            <ScheduleGrid />
          </div>

          <div className={`${s.fc} ${s.fcBr}`}>
            <div className={`${s.fcVal} ${s.fcValGreen}`}>0 konflikt</div>
            <div className={s.fcLbl}>cədvəl toqquşması</div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className={s.stats} id="stats">
        {STATS.map((stat) => (
          <div key={stat.label} className={s.statCard}>
            <div className={s.statTop}>
              <div className={s.statIco}>{stat.icon}</div>
              <div className={s.statTrend}>{stat.trend}</div>
            </div>
            <div className={s.statVal}>{stat.value}</div>
            <div className={s.statLbl}>{stat.label}</div>
          </div>
        ))}
      </section>

      <hr className={s.divider} />

      {/* ── FEATURES ── */}
      <section className={s.sec} id="features">
        <div className={s.secLabel}>XÜSUSİYYƏTLƏR</div>
        <h2 className={s.secTitle}>Cədvəl idarəetməsini <span>yenidən düşünün</span></h2>
        <p className={s.secDesc}>
          E-Cədvəl universitetin bütün struktur vahidlərini bir platformda birləşdirərək
          cədvəl prosesini tam avtomatlaşdırır.
        </p>
        <div className={s.featGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={s.feat}>
              <div className={s.featIco}>{f.icon}</div>
              <div className={s.featTitle}>{f.title}</div>
              <p className={s.featDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className={s.divider} />

      {/* ── HOW IT WORKS ── */}
      <section className={s.sec} id="how">
        <div className={s.howWrap}>
          <div className={s.secLabel}>NEC İŞLƏYİR</div>
          <h2 className={s.secTitle}>3 addımda <span>hazır cədvəl</span></h2>
          <p className={s.secDesc}>
            Qeydiyyatdan başlayaraq tam işlək cədvəl sistemi qurmaq sadəcə bir neçə dəqiqə çəkir.
          </p>
        </div>
        <div className={s.howGrid}>
          {STEPS.map((step, i) => (
            <div key={step.title} className={s.howStep}>
              <div className={s.howNum}>{i + 1}</div>
              <div className={s.howT}>{step.title}</div>
              <p className={s.howD}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className={s.divider} />

      {/* ── CONTACT ── */}
      <section className={s.sec} id="contact">
        <div className={s.contactCard}>
          <div className={s.cL}>
            <div className={s.secLabel}>ƏLAQƏ</div>
            <h2 className={s.cTitle}>Demo versiya üçün<br /><span>qeydiyyat</span></h2>
            <p className={s.cDesc}>
              Şəxsi demo seansı tamamilə pulsuzdur. 14 gün ərzində platformanın
              bütün xüsusiyyətlərini sınayın.
            </p>
            <ul className={s.cList}>
              <li><span className={s.ck}>✓</span> Şəxsi demo seansı</li>
              <li><span className={s.ck}>✓</span> Real mühitdə canlı sınaq</li>
              <li><span className={s.ck}>✓</span> Tam funksionallıq açıqdır</li>
            </ul>
          </div>
          <div className={s.cR}>
            <div className={s.fg}>
              <label className={s.flabel}>Tam ad</label>
              <input type="text" className={s.finput} placeholder="Ad Soyad" />
            </div>
            <div className={s.fg}>
              <label className={s.flabel}>E-mail</label>
              <input type="email" className={s.finput} placeholder="ad@nümunə.az" />
            </div>
            <div className={s.fg}>
              <label className={s.flabel}>Mobil nömrə</label>
              <input type="tel" className={s.finput} placeholder="+994 50 000 00 00" />
            </div>
            <button className={s.fsubmit}>Müraciət et →</button>
            <p className={s.fnote}>
              Göndərməklə <a href="#">İstifadə Şərtləri</a> ilə razılaşırsınız.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={s.footer}>
        <div className={s.fBrand}>
          <div className={s.logoBox}>EC</div>
          E-Cədvəl
        </div>
        <div className={s.fCopy}>© 2026 E-Cədvəl. Bütün hüquqlar qorunur.</div>
        <div className={s.fLinks}>
          <a href="#">Gizlilik Siyasəti</a>
          <a href="#">İstifadə Şərtləri</a>
          <Link href="/login">Daxil Ol</Link>
        </div>
      </footer>

    </div>
  );
}