"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

/* ─── Data ──────────────────────────────────────────── */

const NAV_LINKS = [
  { href: '#features', label: 'Xüsusiyyətlər' },
  { href: '#stats', label: 'Statistika' },
  { href: '#how', label: 'Necə İşləyir' },
  { href: '#contact', label: 'Əlaqə' },
];

const STATS = [
  { value: '150+', label: 'Aktiv İstifadəçi', trend: '+34% bu rüb' },
  { value: '2.4K', label: 'Yaradılan Cədvəl', trend: '+18% bu rüb' },
  { value: '1.2×', label: 'Vaxt Qənaəti', trend: '+24% bu rüb' },
  { value: '~0', label: 'Cədvəl Toqquşması', trend: '99.9% dəqiqlik' },
];

const FEATURES = [
  {
    title: 'Multi-tenant Struktur',
    desc: 'Hər universitet öz izolyasiya edilmiş mühitdə işləyir. Fakültə, kafedra və qruplar ayrıca idarə olunur.',
    icon: 'building',
  },
  {
    title: 'Avtomatik Toqquşma Yoxlaması',
    desc: 'Müəllim, otaq və qrup toqquşmaları real vaxtda aşkarlanır. Konfliktsiz cədvəl yaratmaq artıq asandır.',
    icon: 'merge',
  },
  {
    title: 'Tam Responsiv İnterfeys',
    desc: 'Tələbələr və müəllimlər cədvələ istənilən cihazdan — telefon, tablet, kompüterdən — baxa bilərlər.',
    icon: 'device',
  },
  {
    title: 'Rol Əsaslı Giriş',
    desc: 'Admin, müəllim, tələbə və dekan üçün fərqli giriş səviyyələri. Hər rol yalnız lazımi məlumatı görür.',
    icon: 'users',
  },
  {
    title: 'PDF / Excel Export',
    desc: 'Cədvəlləri bir kliklə PDF və ya Excel formatında ixrac edin. Çap üçün hazır formatlar dəstəklənir.',
    icon: 'export',
  },
  {
    title: 'Bildiriş Sistemi',
    desc: 'Cədvəl dəyişiklikləri haqqında tələbə və müəllimlərə avtomatik bildirişlər göndərilir.',
    icon: 'bell',
  },
];

const STEPS = [
  {
    title: 'Qeydiyyat & Quraşdırma',
    desc: 'Universitetinizi qeydiyyatdan keçirin, fakültə, kafedra və qrup strukturunu admin paneldən qurun.',
  },
  {
    title: 'Müəllim & Dərsləri Əlavə Edin',
    desc: 'Müəllimlər, fənlər, otaqlar və qrupları sistem üzərindən əlavə edin. Toqquşmalar avtomatik aşkarlanır.',
  },
  {
    title: 'Cədvəli Paylaşın',
    desc: 'Konfliktsiz cədvəl bütün tələbə və müəllimlərə avtomatik görünür. Həftəlik və günlük baxış dəstəklənir.',
  },
];

/* ─── Icons (Ultra-light, Phosphor-style) ───────────── */

const Icn = ({ d, viewBox = '0 0 24 24', className = 'w-4 h-4' }: { d: string; viewBox?: string; className?: string }) => (
  <svg className={className} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowUpRight = (p: { className?: string }) => (
  <Icn d="M7 17L17 7M17 7H9M17 7V15" className={p.className} />
);

const ShieldCheck = (p: { className?: string }) => (
  <Icn d="M12 3L4 7V12C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 12V7L12 3Z M9 12L11 14L15 10" className={p.className} />
);

const CheckBadge = (p: { className?: string }) => (
  <Icn d="M5 12L10 17L19 8" className={p.className} />
);

const PlayCircle = (p: { className?: string }) => (
  <svg className={p.className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <polygon points="10,8 16,12 10,16" fill="currentColor" />
  </svg>
);

const BuildingIcon = (p: { className?: string }) => (
  <Icn d="M4 10H20V22H4V10Z M8 10V6C8 4.9 8.9 4 10 4H14C15.1 4 16 4.9 16 6V10 M10 14V18 M14 14V18 M6 22H18" className={p.className} />
);

const MergeIcon = (p: { className?: string }) => (
  <Icn d="M8 6C8 7.1 7.1 8 6 8C4.9 8 4 7.1 4 6C4 4.9 4.9 4 6 4C7.1 4 8 4.9 8 6Z M20 6C20 7.1 19.1 8 18 8C16.9 8 16 7.1 16 6C16 4.9 16.9 4 18 4C19.1 4 20 4.9 20 6Z M6 8V12L12 18L18 12V8 M12 18V22" className={p.className} />
);

const DeviceIcon = (p: { className?: string }) => (
  <Icn d="M7 4H17C18.1 4 19 4.9 19 6V18C19 19.1 18.1 20 17 20H7C5.9 20 5 19.1 5 18V6C5 4.9 5.9 4 7 4Z M9 16H15 M12 4.5V4.5" className={p.className} />
);

const UsersIcon = (p: { className?: string }) => (
  <Icn d="M16 16C14.7 15.3 13 14.5 12 14.5C11 14.5 9.3 15.3 8 16M12 12C13.7 12 15 10.7 15 9C15 7.3 13.7 6 12 6C10.3 6 9 7.3 9 9C9 10.7 10.3 12 12 12Z M4 20C4 16.7 7.6 14 12 14C16.4 14 20 16.7 20 20 M18 8C19.7 8 21 6.7 21 5C21 3.3 19.7 2 18 2C16.3 2 15 3.3 15 5C15 6.7 16.3 8 18 8Z M22 20C22 18.2 20.8 16.8 19 16" className={p.className} />
);

const ExportIcon = (p: { className?: string }) => (
  <Icn d="M12 3V15M8 11L12 15L16 11M4 17V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V17" className={p.className} />
);

const BellIcon = (p: { className?: string }) => (
  <Icn d="M18 8C18 6.4 17.4 4.9 16.2 3.8C15 2.6 13.5 2 12 2C10.5 2 9 2.6 7.8 3.8C6.6 4.9 6 6.4 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z M13.7 20C13.5 20.4 13.1 20.7 12.7 20.9C12.3 21 11.7 21 11.3 20.9C10.9 20.7 10.5 20.4 10.3 20" className={p.className} />
);

const FEATURE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  building: BuildingIcon,
  merge: MergeIcon,
  device: DeviceIcon,
  users: UsersIcon,
  export: ExportIcon,
  bell: BellIcon,
};

/* ─── Scroll Reveal ─────────────────────────────────── */

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${
        visible ? 'translate-y-0 blur-0 opacity-100' : 'translate-y-20 blur-sm opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Double-Bezel Wrapper ──────────────────────────── */

function DoubleBezel({
  children,
  className = '',
  outerClass = '',
  innerClass = '',
}: {
  children: React.ReactNode;
  className?: string;
  outerClass?: string;
  innerClass?: string;
}) {
  return (
    <div className={`p-[5px] rounded-[2rem] bg-white/[0.03] ring-1 ring-white/[0.06] ${outerClass} ${className}`}>
      <div className={`rounded-[calc(2rem-5px)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] ${innerClass}`}>
        {children}
      </div>
    </div>
  );
}

/* ─── Schedule Grid ─────────────────────────────────── */

type CellType = 't' | 'b' | 'y' | '';

const TIMES = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30'];
const GROUPS = ['GR-101', 'GR-102', 'GR-201', 'GR-202', 'GR-301'];

const GRID: CellType[][] = [
  ['t', '', 'b', 't', ''],
  ['', 'y', 't', '', 'b'],
  ['b', 't', '', 'y', 't'],
  ['', '', 'y', 'b', ''],
  ['y', 'b', '', '', 'y'],
  ['t', '', 't', '', 'b'],
];

const cellStyle: Record<CellType, string> = {
  t: 'bg-white/[0.06] text-white/90 border border-white/[0.08]',
  b: 'bg-white/[0.03] text-white/60 border border-white/[0.05]',
  y: 'bg-[#FFBA32]/[0.08] text-[#FFBA32] border border-[#FFBA32]/[0.12]',
  '': 'bg-white/[0.02]',
};

const cellLabel: Record<CellType, string> = {
  t: 'Riyaz.',
  b: 'Fizika',
  y: 'Kimya',
  '': '',
};

function ScheduleGrid() {
  return (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: '40px repeat(5, 1fr)' }}>
      <div />
      {GROUPS.map((g) => (
        <div key={g} className="text-[10px] font-medium text-white/30 text-center leading-[24px]">
          {g}
        </div>
      ))}
      {TIMES.map((time, ri) => (
        <>
          <div key={`t-${ri}`} className="text-[10px] font-medium text-white/30 text-right pr-[5px] leading-[24px]">
            {time}
          </div>
          {GRID[ri].map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              className={`h-[24px] rounded-[4px] flex items-center justify-center text-[9px] font-semibold ${cellStyle[cell]}`}
            >
              {cell !== '' && cellLabel[cell]}
            </div>
          ))}
        </>
      ))}
    </div>
  );
}

/* ─── Fluid Island Nav ──────────────────────────────── */

function FluidNav({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center mt-3 sm:mt-5 px-4">
        <div className="w-full max-w-5xl mx-auto h-[56px] rounded-full bg-black/80 backdrop-blur-2xl border border-white/[0.08] px-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-white font-bold text-sm tracking-tight">
            <span className="w-[28px] h-[28px] rounded-[7px] bg-white flex items-center justify-center text-black text-[10px] font-extrabold">
              EC
            </span>
            E-Cədvəl
          </Link>

          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-[13px] font-medium text-white/50 hover:text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-3">
            {loggedIn ? (
              <Link
                href="/dashboard"
                className="h-[36px] rounded-full bg-white px-4 flex items-center gap-2 text-[12px] font-semibold text-black transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] hover:bg-white/90"
              >
                Dashboard
                <span className="w-5 h-5 rounded-full bg-black/[0.06] flex items-center justify-center">
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="h-[36px] rounded-full px-4 flex items-center text-[12px] font-medium text-white/60 hover:text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  Daxil Ol
                </Link>
                <a
                  href="#contact"
                  className="h-[36px] rounded-full bg-white px-4 flex items-center gap-2 text-[12px] font-semibold text-black transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] hover:bg-white/90"
                >
                  Müraciət et
                  <span className="w-5 h-5 rounded-full bg-black/[0.06] flex items-center justify-center">
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </a>
              </>
            )}
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden relative w-6 h-6" aria-label="Menu">
            <span
              className={`absolute left-0 w-full h-[1.5px] bg-white/70 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                open ? 'top-[11px] rotate-45' : 'top-[5px]'
              }`}
            />
            <span
              className={`absolute left-0 w-full h-[1.5px] bg-white/70 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                open ? 'opacity-0' : 'top-[11px]'
              }`}
            />
            <span
              className={`absolute left-0 w-full h-[1.5px] bg-white/70 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                open ? 'top-[11px] -rotate-45' : 'top-[17px]'
              }`}
            />
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-3xl">
          <nav className="flex flex-col items-center gap-10">
            {NAV_LINKS.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-[28px] sm:text-[36px] font-semibold tracking-tight text-white/60 hover:text-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{
                  animation: `nav-item-reveal 0.6s ${0.08 + i * 0.1}s cubic-bezier(0.32,0.72,0,1) forwards`,
                  opacity: 0,
                  transform: 'translateY(40px)',
                  filter: 'blur(4px)',
                }}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}

/* ─── Page ──────────────────────────────────────────── */

export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
  }, []);

  /* ── Form state ── */
  const [form, setForm] = useState({
    universitet: '', qisa_ad: '', seher: '',
    ad_soyad: '', email: '', telefon: '',
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.universitet || !form.ad_soyad || !form.email) {
      setError('Zəhmət olmasa məcburi sahələri doldurun.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: dbErr } = await supabase.from('muracietler').insert([
      {
        universitet: form.universitet,
        qisa_ad: form.qisa_ad || null,
        seher: form.seher || null,
        ad_soyad: form.ad_soyad,
        email: form.email,
        telefon: form.telefon || null,
      },
    ]);
    setLoading(false);
    if (dbErr) {
      setError(`Xəta: ${dbErr.message}`);
      return;
    }
    setSent(true);
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#050505] text-white overflow-x-hidden font-sans">

      {/* ── Background Orbs ── */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[-8%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-[#4F8CFF]/[0.07] blur-[140px]" />
        <div className="absolute bottom-[15%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#8B5CF6]/[0.05] blur-[140px]" />
        <div className="absolute top-[45%] left-[-10%] w-[350px] h-[350px] rounded-full bg-[#34D399]/[0.025] blur-[120px]" />
      </div>

      {/* ── Noise Grain ── */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Nav ── */}
      <FluidNav loggedIn={loggedIn} />

      {/* ── Hero ── */}
      <section className="relative z-[2] max-w-6xl mx-auto px-4 pt-36 pb-20 md:pt-40 md:pb-28 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 min-h-[100dvh]">
        <RevealSection className="flex-1 w-full max-w-[520px] lg:max-w-none">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.08] px-4 py-1.5 mb-6">
            <span className="w-[5px] h-[5px] rounded-full bg-[#4F8CFF] animate-pulse" />
            <span className="text-[11px] font-medium tracking-wide text-white/50 uppercase">
              Universitet üçün SaaS · Beta v1.0
            </span>
          </div>

          <h1 className="text-[40px] sm:text-[52px] md:text-[64px] font-bold leading-[1.05] tracking-[-0.03em] mb-5">
            Dərs Cədvəlini
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#4F8CFF] to-[#8B5CF6] mt-1">
              Ağıllı İdarə Et
            </span>
          </h1>

          <p className="text-[15px] sm:text-[16px] leading-[1.7] text-white/40 max-w-[440px] mb-8 font-normal">
            Multi-tenant cədvəl sistemi ilə universitetin bütün fakültə, qrup
            və müəllim cədvəlini rahatlıqla yaradın, paylaşın və konflikt
            olmadan idarə edin.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <Link
              href="/login"
              className="group rounded-full bg-white px-6 py-3 flex items-center gap-3 text-[14px] font-semibold text-black transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] hover:bg-white/90"
            >
              Başla
              <span className="w-7 h-7 rounded-full bg-black/[0.06] flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-[2px] group-hover:-translate-y-[1px] group-hover:scale-105">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
            <a
              href="#how"
              className="group rounded-full border border-white/[0.12] px-6 py-3 flex items-center gap-3 text-[14px] font-medium text-white/60 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] hover:border-white/20 hover:text-white"
            >
              <PlayCircle className="w-4 h-4" />
              Demo İzlə
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            {[
              { icon: ShieldCheck, text: 'Məlumat Təhlükəsizliyi' },
              { icon: CheckBadge, text: '14 gün pulsuz sınaq' },
              { icon: CheckBadge, text: 'Kart tələb olunmur' },
            ].map((item) => (
              <span key={item.text} className="flex items-center gap-2 text-[12px] font-medium text-white/35">
                <item.icon className="w-3.5 h-3.5 text-[#4F8CFF]" />
                {item.text}
              </span>
            ))}
          </div>
        </RevealSection>

        <RevealSection className="flex-1 w-full lg:max-w-none">
          <div className="relative flex items-center justify-center min-h-[360px] sm:min-h-[400px]">
            <DoubleBezel outerClass="w-full max-w-[500px]" innerClass="bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-white/70">
                  📅 Bu həftə — Mühəndislik Fakültəsi
                </span>
                <div className="flex gap-1">
                  {['B.e', 'Ç.a', 'Ç', 'C.a', 'C'].map((d, i) => (
                    <span
                      key={d}
                      className={`px-2 py-0.5 rounded-[5px] text-[9px] font-semibold ${
                        i === 1
                          ? 'bg-white text-black'
                          : 'bg-white/[0.05] text-white/40'
                      }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              <ScheduleGrid />
            </DoubleBezel>

            <div className="absolute -top-[12px] -left-[8px] sm:-left-[16px] bg-black/90 backdrop-blur-xl border border-white/[0.08] rounded-xl px-3.5 py-2.5 animate-[float_4s_ease-in-out_infinite]">
              <div className="text-[18px] font-bold text-[#4F8CFF] leading-none">+18%</div>
              <div className="text-[10px] font-medium text-white/40 mt-0.5">vaxt effektivliyi</div>
            </div>

            <div className="absolute -bottom-[12px] -right-[8px] sm:-right-[16px] bg-black/90 backdrop-blur-xl border border-white/[0.08] rounded-xl px-3.5 py-2.5 animate-[float_4s_ease-in-out_infinite_2s]">
              <div className="text-[18px] font-bold text-[#34D399] leading-none">0 konflikt</div>
              <div className="text-[10px] font-medium text-white/40 mt-0.5">cədvəl toqquşması</div>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ── Divider ── */}
      <div className="relative z-[2] max-w-6xl mx-auto px-4">
        <div className="border-t border-white/[0.05]" />
      </div>

      {/* ── Stats ── */}
      <section className="relative z-[2] max-w-6xl mx-auto px-4 py-28 md:py-32" id="stats">
        <RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <DoubleBezel
                key={stat.label}
                outerClass={
                  i === 0
                    ? 'sm:col-span-2 lg:col-span-2'
                    : i === 3
                      ? 'sm:col-span-2 lg:col-span-2'
                      : ''
                }
                innerClass="bg-white/[0.02] p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[28px] sm:text-[36px] font-extrabold tracking-[-0.03em] text-white">
                    {stat.value}
                  </span>
                  <span className="text-[10px] font-semibold text-[#4F8CFF] bg-[#4F8CFF]/[0.08] rounded-full px-2 py-0.5 whitespace-nowrap">
                    {stat.trend}
                  </span>
                </div>
                <div className="text-[13px] font-medium text-white/35">{stat.label}</div>
              </DoubleBezel>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* ── Divider ── */}
      <div className="relative z-[2] max-w-6xl mx-auto px-4">
        <div className="border-t border-white/[0.05]" />
      </div>

      {/* ── Features ── */}
      <section className="relative z-[2] max-w-6xl mx-auto px-4 py-28 md:py-32" id="features">
        <RevealSection>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.08] px-4 py-1.5 mb-5">
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/40">
              Xüsusiyyətlər
            </span>
          </div>
          <h2 className="text-[32px] sm:text-[44px] md:text-[52px] font-bold leading-[1.08] tracking-[-0.03em] mb-4">
            Cədvəl idarəetməsini
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#4F8CFF] to-[#8B5CF6]">
              yenidən düşünün
            </span>
          </h2>
          <p className="text-[15px] leading-[1.7] text-white/40 max-w-[480px] mb-14 font-normal">
            E-Cədvəl universitetin bütün struktur vahidlərini bir platformda
            birləşdirərək cədvəl prosesini tam avtomatlaşdırır.
          </p>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = FEATURE_ICONS[f.icon];
            const isWide = i === 0 || i === 3;
            return (
              <RevealSection
                key={f.title}
                className={isWide ? 'md:col-span-2' : 'md:col-span-1'}
              >
                <DoubleBezel innerClass="bg-white/[0.02] p-7 h-full">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-white/50" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-white/80 mb-3">{f.title}</h3>
                  <p className="text-[13px] leading-[1.7] text-white/35 font-normal">{f.desc}</p>
                </DoubleBezel>
              </RevealSection>
            );
          })}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="relative z-[2] max-w-6xl mx-auto px-4">
        <div className="border-t border-white/[0.05]" />
      </div>

      {/* ── How It Works ── */}
      <section className="relative z-[2] max-w-6xl mx-auto px-4 py-28 md:py-32" id="how">
        <RevealSection>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.08] px-4 py-1.5 mb-5">
              <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/40">
                Necə İşləyir
              </span>
            </div>
            <h2 className="text-[32px] sm:text-[44px] md:text-[52px] font-bold leading-[1.08] tracking-[-0.03em] mb-4">
              3 addımda
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#4F8CFF] to-[#8B5CF6]">
                hazır cədvəl
              </span>
            </h2>
            <p className="text-[15px] leading-[1.7] text-white/40 max-w-[480px] mx-auto font-normal">
              Qeydiyyatdan başlayaraq tam işlək cədvəl sistemi qurmaq sadəcə
              bir neçə dəqiqə çəkir.
            </p>
          </div>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
          <div className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          {STEPS.map((step, i) => (
            <RevealSection key={step.title}>
              <DoubleBezel innerClass={`bg-white/[0.02] p-8 text-center ${i === 1 ? 'md:mt-0' : ''}`}>
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center mx-auto mb-5">
                  <span className="text-[14px] font-bold text-black">{i + 1}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-white/80 mb-3">{step.title}</h3>
                <p className="text-[13px] leading-[1.7] text-white/35 font-normal">{step.desc}</p>
              </DoubleBezel>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="relative z-[2] max-w-6xl mx-auto px-4">
        <div className="border-t border-white/[0.05]" />
      </div>

      {/* ── Contact ── */}
      <section className="relative z-[2] max-w-6xl mx-auto px-4 py-28 md:py-32" id="contact">
        <DoubleBezel outerClass="w-full" innerClass="bg-white/[0.015]">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 p-8 sm:p-12 lg:p-16">
            <RevealSection className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.08] px-4 py-1.5 mb-5">
                <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/40">
                  Əlaqə
                </span>
              </div>
              <h2 className="text-[28px] sm:text-[36px] font-bold leading-[1.12] tracking-[-0.03em] mb-4">
                Demo versiya üçün
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#4F8CFF] to-[#8B5CF6]">
                  qeydiyyat
                </span>
              </h2>
              <p className="text-[14px] leading-[1.7] text-white/40 mb-8 font-normal max-w-[400px]">
                Şəxsi demo seansı tamamilə pulsuzdur. 14 gün ərzində
                platformanın bütün xüsusiyyətlərini sınayın.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  'Şəxsi demo seansı',
                  'Real mühitdə canlı sınaq',
                  'Tam funksionallıq açıqdır',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[13px] font-medium text-white/40">
                    <span className="w-5 h-5 rounded-full bg-[#4F8CFF]/[0.1] flex items-center justify-center">
                      <CheckBadge className="w-3 h-3 text-[#4F8CFF]" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </RevealSection>

            <RevealSection className="flex-1 w-full">
              <DoubleBezel outerClass="w-full" innerClass="bg-white/[0.02] p-6 sm:p-8">
                {sent ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 rounded-full bg-[#34D399]/[0.12] border-2 border-[#34D399]/[0.25] flex items-center justify-center mx-auto mb-5">
                      <CheckBadge className="w-6 h-6 text-[#34D399]" />
                    </div>
                    <h3 className="text-[18px] font-bold text-white/80 mb-2">Müraciətiniz qəbul edildi!</h3>
                    <p className="text-[13px] text-white/40 font-normal">
                      Ən qısa zamanda <span className="text-white/60">{form.email}</span> ünvanına
                      cavab göndəriləcək.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 mb-6">
                      <span className="text-[13px] font-semibold text-white/60">
                        Universitet Məlumatları
                      </span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-medium text-white/40 mb-2 tracking-wide">
                          Universitet Adı <span className="text-[#EF4444]">*</span>
                        </label>
                        <DoubleBezel innerClass="bg-white/[0.03]">
                          <input
                            name="universitet"
                            type="text"
                            className="w-full bg-transparent px-4 py-2.5 text-[13px] text-white/80 outline-none placeholder:text-white/15"
                            placeholder="Mingəçevir Dövlət Universiteti"
                            value={form.universitet}
                            onChange={handleChange}
                          />
                        </DoubleBezel>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-medium text-white/40 mb-2 tracking-wide">
                            Qısa Ad
                          </label>
                          <DoubleBezel innerClass="bg-white/[0.03]">
                            <input
                              name="qisa_ad"
                              type="text"
                              className="w-full bg-transparent px-4 py-2.5 text-[13px] text-white/80 outline-none placeholder:text-white/15"
                              placeholder="MDU"
                              value={form.qisa_ad}
                              onChange={handleChange}
                            />
                          </DoubleBezel>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-white/40 mb-2 tracking-wide">
                            Şəhər
                          </label>
                          <DoubleBezel innerClass="bg-white/[0.03]">
                            <input
                              name="seher"
                              type="text"
                              className="w-full bg-transparent px-4 py-2.5 text-[13px] text-white/80 outline-none placeholder:text-white/15"
                              placeholder="Mingəçevir"
                              value={form.seher}
                              onChange={handleChange}
                            />
                          </DoubleBezel>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 my-6">
                      <span className="text-[13px] font-semibold text-white/60">
                        Əlaqə Məlumatları
                      </span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-medium text-white/40 mb-2 tracking-wide">
                          Ad Soyad <span className="text-[#EF4444]">*</span>
                        </label>
                        <DoubleBezel innerClass="bg-white/[0.03]">
                          <input
                            name="ad_soyad"
                            type="text"
                            className="w-full bg-transparent px-4 py-2.5 text-[13px] text-white/80 outline-none placeholder:text-white/15"
                            placeholder="Əli Həsənov"
                            value={form.ad_soyad}
                            onChange={handleChange}
                          />
                        </DoubleBezel>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-white/40 mb-2 tracking-wide">
                          Email <span className="text-[#EF4444]">*</span>
                        </label>
                        <DoubleBezel innerClass="bg-white/[0.03]">
                          <input
                            name="email"
                            type="email"
                            className="w-full bg-transparent px-4 py-2.5 text-[13px] text-white/80 outline-none placeholder:text-white/15"
                            placeholder="info@university.edu.az"
                            value={form.email}
                            onChange={handleChange}
                          />
                        </DoubleBezel>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-white/40 mb-2 tracking-wide">
                          Telefon
                        </label>
                        <DoubleBezel innerClass="bg-white/[0.03]">
                          <input
                            name="telefon"
                            type="tel"
                            className="w-full bg-transparent px-4 py-2.5 text-[13px] text-white/80 outline-none placeholder:text-white/15"
                            placeholder="+994 XX XXX XX XX"
                            value={form.telefon}
                            onChange={handleChange}
                          />
                        </DoubleBezel>
                      </div>
                    </div>

                    {error && (
                      <div className="mt-4 p-3 rounded-xl bg-[#EF4444]/[0.06] border border-[#EF4444]/[0.12]">
                        <p className="text-[12px] text-[#EF4444] font-medium">{error}</p>
                      </div>
                    )}

                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="group rounded-full bg-white w-full mt-6 px-6 py-3.5 flex items-center justify-center gap-3 text-[13px] font-semibold text-black transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {loading ? 'Göndərilir...' : 'Müraciət Göndər'}
                      {!loading && (
                        <span className="w-7 h-7 rounded-full bg-black/[0.06] flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-[2px] group-hover:-translate-y-[1px] group-hover:scale-105">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                  </>
                )}
              </DoubleBezel>
            </RevealSection>
          </div>
        </DoubleBezel>
      </section>

      {/* ── Divider ── */}
      <div className="relative z-[2] max-w-6xl mx-auto px-4">
        <div className="border-t border-white/[0.05]" />
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-[2] max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="w-[26px] h-[26px] rounded-[6px] bg-white flex items-center justify-center text-black text-[9px] font-extrabold">
            EC
          </span>
          <span className="text-[13px] font-semibold text-white/60">E-Cədvəl</span>
        </div>
        <div className="text-[11px] font-medium text-white/25 order-3 sm:order-2">
          © 2026 E-Cədvəl. Bütün hüquqlar qorunur.
        </div>
        <div className="flex items-center gap-6 order-2 sm:order-3">
          <a href="#" className="text-[11px] font-medium text-white/30 hover:text-white/60 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
            Gizlilik Siyasəti
          </a>
          <a href="#" className="text-[11px] font-medium text-white/30 hover:text-white/60 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
            İstifadə Şərtləri
          </a>
          <Link
            href="/login"
            className="text-[11px] font-medium text-white/30 hover:text-white/60 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            Daxil Ol
          </Link>
        </div>
      </footer>

    </div>
  );
}
