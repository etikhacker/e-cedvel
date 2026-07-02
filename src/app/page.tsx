"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

/* ─── Data ─────────────────────────────────────────────── */
const STATS = [
  { value: '150+', label: 'Aktiv İstifadəçi' },
  { value: '2.4K', label: 'Yaradılan Cədvəl' },
  { value: '~0',   label: 'Toqquşma' },
  { value: '3',    label: 'Addımda Hazır' },
];

const FEATURES = [
  {
    icon: '🏛',
    title: 'Multi-tenant Struktur',
    desc: 'Hər universitet öz izolyasiya edilmiş mühitdə işləyir. Fakültə, kafedra və qruplar ayrıca idarə olunur.',
  },
  {
    icon: '⚡',
    title: 'Real-vaxt Toqquşma Yoxlaması',
    desc: 'Müəllim, otaq və qrup toqquşmaları dərs əlavə edilən anda aşkarlanır. Xəbərdarlıq göstərilir.',
  },
  {
    icon: '📱',
    title: 'Tam Responsiv',
    desc: 'Tələbə və müəllimlər cədvələ telefon, tablet, kompüterdən baxa bilər. PWA dəstəklənir.',
  },
  {
    icon: '🔐',
    title: 'Rol Əsaslı Giriş',
    desc: 'Superadmin, university admin və tələbə üçün fərqli giriş səviyyələri. Hər rol yalnız lazımi datanı görür.',
  },
  {
    icon: '📊',
    title: 'CSV / PDF Export',
    desc: 'Cədvəli bir kliklə CSV (Excel) və ya PDF formatında yüklə. Çap üçün hazır A4 format.',
  },
  {
    icon: '🔔',
    title: 'Push Bildirişlər',
    desc: 'Tələbələr dərs başlamadan əvvəl push notification alır. Birinci dərs üçün ayrı vaxt təyini.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Qeydiyyat',
    desc: 'Superadmin paneldən universitetini əlavə et. Admin emailinə dəvət linki göndər.',
  },
  {
    n: '02',
    title: 'Strukturu Qur',
    desc: 'Fakültə, qrup, fənn və müəllimləri əlavə et. Toqquşma yoxlaması avtomatik işləyir.',
  },
  {
    n: '03',
    title: 'Cədvəl Yayımla',
    desc: 'Tələbələr qeydiyyatdan keçib qrupunu seçir. Cədvəl dərhal görünür.',
  },
];

/* ─── Schedule preview data ─────────────────────────────── */
type Cell = { label: string; color: 'v' | 'g' | 'a' | '' };
const SCHED: Cell[][] = [
  [{ label: 'Riyaz.', color: 'v' }, { label: '', color: '' }, { label: 'Fizika', color: 'g' }, { label: 'Riyaz.', color: 'v' }, { label: '', color: '' }],
  [{ label: '', color: '' }, { label: 'Kimya', color: 'a' }, { label: 'İnfor.', color: 'v' }, { label: '', color: '' }, { label: 'Fizika', color: 'g' }],
  [{ label: 'Fizika', color: 'g' }, { label: 'İnfor.', color: 'v' }, { label: '', color: '' }, { label: 'Kimya', color: 'a' }, { label: 'Riyaz.', color: 'v' }],
  [{ label: '', color: '' }, { label: '', color: '' }, { label: 'Kimya', color: 'a' }, { label: 'Fizika', color: 'g' }, { label: '', color: '' }],
  [{ label: 'Kimya', color: 'a' }, { label: 'Fizika', color: 'g' }, { label: '', color: '' }, { label: '', color: '' }, { label: 'İnfor.', color: 'v' }],
];
const DAYS = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C'];
const TIMES = ['08:00', '09:30', '11:00', '12:30', '14:00'];

/* ─── Cell colors ───────────────────────────────────────── */
const cellStyle = (color: string) => {
  if (color === 'v') return { bg: 'rgba(124,58,237,0.18)', border: 'rgba(124,58,237,0.35)', color: '#a78bfa' };
  if (color === 'g') return { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.28)', color: '#34d399' };
  if (color === 'a') return { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.22)',  color: '#fbbf24' };
  return { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.05)', color: 'transparent' };
};

/* ─── SchedulePreview ───────────────────────────────────── */
function SchedulePreview() {
  const [revealed, setRevealed] = useState(0);
  const total = SCHED.length * SCHED[0].length;

  useEffect(() => {
    if (revealed >= total) return;
    const t = setTimeout(() => setRevealed(r => r + 1), 60);
    return () => clearTimeout(t);
  }, [revealed, total]);

  let idx = 0;

  return (
    <div style={{
      background: 'rgba(14,16,26,0.8)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding: 20,
      backdropFilter: 'blur(20px)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
          CƏDVƏL — MÜHƏNDİSLİK
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {DAYS.map((d, i) => (
            <span key={d} style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
              background: i === 1 ? '#7c3aed' : 'rgba(255,255,255,0.06)',
              color: i === 1 ? '#fff' : 'rgba(255,255,255,0.4)',
            }}>{d}</span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '38px repeat(5, 1fr)', gap: 3 }}>
        <div />
        {DAYS.map(d => (
          <div key={d} style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textAlign: 'center', paddingBottom: 4 }}>{d}</div>
        ))}
        {SCHED.map((row, ri) => (
          <>
            <div key={`t${ri}`} style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', lineHeight: '26px', textAlign: 'right', paddingRight: 5 }}>
              {TIMES[ri]}
            </div>
            {row.map((cell, ci) => {
              const show = ++idx <= revealed;
              const cs = cellStyle(cell.color);
              return (
                <div key={`${ri}-${ci}`} style={{
                  height: 26, borderRadius: 4,
                  background: show ? cs.bg : 'rgba(255,255,255,0.015)',
                  border: `1px solid ${show ? cs.border : 'rgba(255,255,255,0.04)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: show ? cs.color : 'transparent',
                  transition: 'all 0.3s ease',
                }}>
                  {cell.label}
                </div>
              );
            })}
          </>
        ))}
      </div>

      {/* Footer badges */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', fontWeight: 700 }}>
          ✓ 0 toqquşma
        </span>
        <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa', fontWeight: 700 }}>
          ⚡ Real vaxt
        </span>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [form, setForm] = useState({ universitet: '', qisa_ad: '', seher: '', ad_soyad: '', email: '', telefon: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.universitet || !form.ad_soyad || !form.email) { setError('Məcburi sahələri doldurun.'); return; }
    setLoading(true); setError('');
    const { error: dbErr } = await supabase.from('muracietler').insert([{
      universitet: form.universitet, qisa_ad: form.qisa_ad || null,
      seher: form.seher || null, ad_soyad: form.ad_soyad,
      email: form.email, telefon: form.telefon || null,
    }]);
    setLoading(false);
    if (dbErr) { setError(`Xəta: ${dbErr.message}`); return; }
    setSent(true);
  };

  const V = '#7c3aed';   // violet primary
  const BG = '#06070e';  // near-black

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all duration-300 placeholder:text-white/20";

  return (
    <div style={{ background: BG, color: '#fff', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)', overflowX: 'hidden' }}>

      {/* ── Background mesh ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.12) 0%, transparent 60%),
                     radial-gradient(ellipse 40% 30% at 90% 80%, rgba(52,211,153,0.05) 0%, transparent 50%)` }} />

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 64,
        padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(6,7,14,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: V,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 900, color: '#fff' }}>EC</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>E-Cədvəl</span>
        </Link>

        <div style={{ display: 'flex', gap: 28, listStyle: 'none' }}>
          {[['#features','Xüsusiyyətlər'],['#how','Necə İşləyir'],['#contact','Əlaqə']].map(([h,l]) => (
            <a key={h} href={h} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>{l}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {loggedIn ? (
            <Link href="/dashboard" style={{ padding: '8px 18px', background: V, color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/login" style={{ padding: '8px 18px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none', background: 'transparent' }}>
                Daxil Ol
              </Link>
              <a href="#contact" style={{ padding: '8px 18px', background: V, color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Başla →
              </a>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1160, margin: '0 auto', padding: '130px 5% 90px', display: 'flex', alignItems: 'center', gap: 64, minHeight: '100vh' }}>
        <div style={{ flex: '0 0 480px' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 100,
            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.22)',
            fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block',
              animation: 'pulse 2s infinite' }} />
            SaaS platforma · Beta v1.0
          </div>

          <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Dərs Cədvəlini<br />
            <span style={{ color: '#a78bfa' }}>Ağıllı Planlaşdır</span>
          </h1>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 36, maxWidth: 420 }}>
            Multi-tenant cədvəl platforması ilə universitetin bütün fakültə, qrup
            və müəllim cədvəlini konflikt olmadan idarə edin.
          </p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
            <a href="#contact" style={{ padding: '13px 26px', background: V, color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              Pulsuz Başla →
            </a>
            <a href="#how" style={{ padding: '13px 26px', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
              Necə işləyir?
            </a>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {['Məlumat Təhlükəsizliyi', '14 gün pulsuz', 'Kart tələb olunmur'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ color: '#34d399' }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Schedule preview */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Floating cards */}
          <div style={{ position: 'absolute', top: -20, right: -20, background: 'rgba(6,7,14,0.95)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px',
            animation: 'float 4s ease-in-out infinite', zIndex: 2 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#34d399', lineHeight: 1 }}>~0</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>toqquşma</div>
          </div>
          <div style={{ position: 'absolute', bottom: -16, left: -16, background: 'rgba(6,7,14,0.95)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px',
            animation: 'float 4s ease-in-out infinite 2s', zIndex: 2 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#a78bfa', lineHeight: 1 }}>150+</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>istifadəçi</div>
          </div>
          <SchedulePreview />
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1160, margin: '0 auto', padding: '0 5% 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '22px 20px' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 5%', borderTop: '1px solid rgba(255,255,255,0.05)' }} />

      {/* ── FEATURES ── */}
      <section id="features" style={{ position: 'relative', zIndex: 1, maxWidth: 1160, margin: '0 auto', padding: '80px 5%' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 10 }}>XÜSUSİYYƏTLƏR</div>
          <h2 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.025em' }}>
            Cədvəl idarəetməsini<br /><span style={{ color: '#a78bfa' }}>yenidən düşünün</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24,
              transition: 'all 0.2s', cursor: 'default' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(124,58,237,0.07)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(124,58,237,0.22)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}>
              <div style={{ fontSize: 26, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 5%', borderTop: '1px solid rgba(255,255,255,0.05)' }} />

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ position: 'relative', zIndex: 1, maxWidth: 1160, margin: '0 auto', padding: '80px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 10 }}>NEC İŞLƏYİR</div>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.025em' }}>
            3 addımda <span style={{ color: '#a78bfa' }}>hazır cədvəl</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 28, left: '16%', right: '16%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent)' }} />
          {STEPS.map((step) => (
            <div key={step.n} style={{ padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: V, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 900, margin: '0 auto 18px', letterSpacing: '-0.02em' }}>{step.n}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{step.title}</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 5%', borderTop: '1px solid rgba(255,255,255,0.05)' }} />

      {/* ── CONTACT ── */}
      <section id="contact" style={{ position: 'relative', zIndex: 1, maxWidth: 1160, margin: '0 auto', padding: '80px 5%' }}>
        <div style={{ background: 'rgba(14,16,26,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '52px 56px', display: 'flex', gap: 80, backdropFilter: 'blur(20px)' }}>
          {/* Left */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 12 }}>ƏLAQƏ</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.18, letterSpacing: '-0.025em', marginBottom: 14 }}>
              Demo versiya üçün<br /><span style={{ color: '#a78bfa' }}>qeydiyyat</span>
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: 28 }}>
              14 gün ərzində platformanın bütün xüsusiyyətlərini pulsuz sınayın.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Şəxsi demo seansı', 'Real mühitdə canlı sınaq', 'Tam funksionallıq açıqdır'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>✓</span> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div style={{ flex: 1 }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '2px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 22 }}>✓</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Müraciətiniz qəbul edildi!</div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.65)' }}>{form.email}</span> ünvanına cavab göndəriləcək.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Uni info */}
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Universitet Məlumatları</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Universitet Adı *</label>
                  <input name="universitet" type="text" className={inputCls} placeholder="Mingəçevir Dövlət Universiteti" value={form.universitet} onChange={handleChange}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[['qisa_ad', 'Qısa Ad', 'MDU'], ['seher', 'Şəhər', 'Mingəçevir']].map(([n, l, p]) => (
                    <div key={n}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{l}</label>
                      <input name={n} type="text" placeholder={p} value={(form as any)[n]} onChange={handleChange}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }} />

                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Əlaqə Məlumatları</div>
                {[
                  ['ad_soyad', 'text', 'Ad Soyad *', 'Əli Həsənov'],
                  ['email',    'email','Email *',     'info@university.edu.az'],
                  ['telefon',  'tel',  'Telefon',      '+994 XX XXX XX XX'],
                ].map(([n, t, l, p]) => (
                  <div key={n} style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{l}</label>
                    <input name={n} type={t} placeholder={p} value={(form as any)[n]} onChange={handleChange}
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                  </div>
                ))}

                {error && (
                  <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 12, color: '#ef4444' }}>
                    {error}
                  </div>
                )}

                <button onClick={handleSubmit} disabled={loading}
                  style={{ marginTop: 16, width: '100%', padding: '13px', background: V, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {loading ? 'Göndərilir...' : 'Müraciət Göndər →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, maxWidth: 1160, margin: '0 auto', padding: '24px 5%',
        borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 700, fontSize: 14 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: V, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff' }}>EC</div>
          E-Cədvəl
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>© 2026 E-Cədvəl. Bütün hüquqlar qorunur.</div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Gizlilik Siyasəti', 'İstifadə Şərtləri'].map(t => (
            <a key={t} href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{t}</a>
          ))}
          <Link href="/login" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Daxil Ol</Link>
        </div>
      </footer>

      {/* Keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}