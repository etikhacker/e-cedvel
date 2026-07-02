"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

/* ─── Scroll reveal hook ────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      transition: `opacity 1s ease ${delay}ms, transform 1s cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter 1s ease ${delay}ms`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(40px)',
      filter: visible ? 'blur(0)' : 'blur(6px)',
    }}>
      {children}
    </div>
  );
}

/* ─── Schedule animation ────────────────────────────────── */
type CellType = { label: string; c: 'v' | 'g' | 'a' | '' };
const SCHED: CellType[][] = [
  [{ label: 'Riyaz.', c: 'v' }, { label: '', c: '' }, { label: 'Fizika', c: 'g' }, { label: 'Riyaz.', c: 'v' }, { label: '', c: '' }],
  [{ label: '', c: '' }, { label: 'Kimya', c: 'a' }, { label: 'İnfor.', c: 'v' }, { label: '', c: '' }, { label: 'Fizika', c: 'g' }],
  [{ label: 'Fizika', c: 'g' }, { label: 'İnfor.', c: 'v' }, { label: '', c: '' }, { label: 'Kimya', c: 'a' }, { label: 'Riyaz.', c: 'v' }],
  [{ label: '', c: '' }, { label: '', c: '' }, { label: 'Kimya', c: 'a' }, { label: 'Fizika', c: 'g' }, { label: '', c: '' }],
  [{ label: 'Kimya', c: 'a' }, { label: 'Fizika', c: 'g' }, { label: '', c: '' }, { label: '', c: '' }, { label: 'İnfor.', c: 'v' }],
];
const DAYS = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C'];
const TIMES = ['08:00', '09:30', '11:00', '12:30', '14:00'];
const cellStyle = (c: string) => ({
  v: { bg: 'rgba(252,250,238,0.1)',  border: 'rgba(252,250,238,0.2)',  color: '#fcfaee' },
  g: { bg: 'rgba(147,137,119,0.15)', border: 'rgba(147,137,119,0.3)',  color: '#c4b89e' },
  a: { bg: 'rgba(147,137,119,0.08)', border: 'rgba(147,137,119,0.18)', color: '#a89880' },
  '': { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)', color: 'transparent' },
}[c] ?? { bg: '', border: '', color: '' });

function ScheduleCard() {
  const [rev, setRev] = useState(0);
  const total = SCHED.length * SCHED[0].length;
  useEffect(() => {
    if (rev >= total) return;
    const t = setTimeout(() => setRev(r => r + 1), 70);
    return () => clearTimeout(t);
  }, [rev, total]);
  let idx = 0;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(12px)',
      border: '1px solid rgba(252,250,238,0.1)', borderRadius: 4, padding: 24,
      boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#938977' }}>
          Mühəndislik Fakültəsi
        </p>
        <div style={{ display: 'flex', gap: 3 }}>
          {DAYS.map((d, i) => (
            <span key={d} style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 2,
              background: i === 1 ? 'rgba(252,250,238,0.15)' : 'rgba(255,255,255,0.05)',
              color: i === 1 ? '#fcfaee' : '#938977', fontFamily: 'Inter,sans-serif' }}>{d}</span>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(5,1fr)', gap: 3 }}>
        <div />{DAYS.map(d => <div key={d} style={{ fontSize: 9, color: 'rgba(252,250,238,0.25)', textAlign: 'center', paddingBottom: 3, fontFamily: 'Inter,sans-serif' }}>{d}</div>)}
        {SCHED.map((row, ri) => (<>
          <div key={`t${ri}`} style={{ fontSize: 9, color: 'rgba(252,250,238,0.2)', lineHeight: '24px', textAlign: 'right', paddingRight: 6, fontFamily: 'Inter,sans-serif' }}>{TIMES[ri]}</div>
          {row.map((cell, ci) => {
            const show = ++idx <= rev;
            const cs = cellStyle(cell.c);
            return (
              <div key={`${ri}-${ci}`} style={{ height: 24, borderRadius: 2, background: show ? cs.bg : 'rgba(255,255,255,0.02)', border: `1px solid ${show ? cs.border : 'rgba(255,255,255,0.04)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 600, color: show ? cs.color : 'transparent', transition: 'all 0.4s ease', fontFamily: 'Inter,sans-serif' }}>
                {cell.label}
              </div>
            );
          })}
        </>))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(252,250,238,0.07)' }}>
        {['✓ 0 toqquşma', '⚡ Real vaxt', '5 qrup'].map(t => (
          <span key={t} style={{ fontSize: 10, color: '#938977', fontFamily: 'Inter,sans-serif', fontWeight: 600, letterSpacing: '0.5px' }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Pillar ────────────────────────────────────────────── */
function Pillar({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <Reveal>
      <div style={{ padding: '80px 0', borderBottom: '1px solid rgba(24,12,4,0.08)' }}>
        <p style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 11, fontWeight: 600, color: '#938977', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 24 }}>{label}</p>
        <h3 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 28, fontWeight: 600, lineHeight: 1.3, color: '#180c04', marginBottom: 20 }}>{title}</h3>
        <p style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 14, fontWeight: 400, lineHeight: 1.7, color: '#696969', maxWidth: 480 }}>{body}</p>
      </div>
    </Reveal>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [darkNav, setDarkNav] = useState(true);
  const [form, setForm] = useState({ universitet: '', qisa_ad: '', seher: '', ad_soyad: '', email: '', telefon: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session));
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      const lightIds = ['platform', 'contact', 'site-footer'];
      const navH = 64;
      const isLight = lightIds.some(id => {
        const el = document.getElementById(id);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.top <= navH && r.bottom >= navH;
      });
      setDarkNav(!isLight);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const hc = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
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

  const navTxt = darkNav ? '#fcfaee' : '#180c04';
  const navHov = darkNav ? '#938977' : '#696969';

  return (
    <div style={{ background: '#fcfaee', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
        html { scroll-behavior: smooth; }
        .nav-link:hover { opacity: 1 !important; }
        .liq-glass {
          background: rgba(255,255,255,0.01);
          backdrop-filter: blur(8px) saturate(130%);
          -webkit-backdrop-filter: blur(8px) saturate(130%);
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.18);
          position: relative; overflow: hidden;
        }
        .liq-glass::before {
          content: ''; position: absolute; inset: 0;
          padding: 1.4px; border-radius: inherit;
          background: linear-gradient(180deg,rgba(255,255,255,0.5) 0%,rgba(255,255,255,0.15) 20%,rgba(255,255,255,0) 40%,rgba(255,255,255,0) 60%,rgba(255,255,255,0.15) 80%,rgba(255,255,255,0.5) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          pointer-events: none; mix-blend-mode: screen; opacity: 0.22;
        }
        .inp { width:100%; padding:12px 16px; background:rgba(24,12,4,0.04); border:1px solid rgba(24,12,4,0.12); border-radius:2px; font-family:Inter,sans-serif; font-size:13px; color:#180c04; outline:none; transition:border-color 0.4s; box-sizing:border-box; }
        .inp:focus { border-color:rgba(24,12,4,0.4); }
        .inp::placeholder { color:rgba(24,12,4,0.3); }
        .cta-btn { transition: background 0.6s ease, color 0.6s ease; }
        .cta-btn:hover { background:#180c04 !important; color:#fcfaee !important; }
        .ghost-btn { transition: all 0.6s ease; }
        .ghost-btn:hover { background:#180c04 !important; color:#fcfaee !important; border-color:#180c04 !important; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100, padding: scrolled ? '12px 0' : '20px 0', transition: 'padding 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="liq-glass" style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 40px', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 20, fontWeight: 500, color: navTxt, letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase', transition: 'color 0.6s' }}>
            E-Cədvəl
          </Link>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {[['#platform', 'Platforma'], ['#contact', 'Müraciət'], ['#manifesto', 'Haqqımızda']].map(([h, l]) => (
              <a key={h} href={h} className="nav-link" style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, color: navTxt, letterSpacing: '1.3px', textDecoration: 'none', textTransform: 'uppercase', opacity: 0.8, transition: 'color 0.6s, opacity 0.6s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = navHov; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = navTxt; }}>
                {l}
              </a>
            ))}
            {loggedIn
              ? <Link href="/dashboard" style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, color: navTxt, letterSpacing: '1.3px', textDecoration: 'none', textTransform: 'uppercase', opacity: 0.8 }}>Dashboard →</Link>
              : <Link href="/login" style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, color: navTxt, letterSpacing: '1.3px', textDecoration: 'none', textTransform: 'uppercase', opacity: 0.8 }}>Daxil Ol</Link>
            }
          </div>
        </div>
      </nav>

      {/* ── HERO (dark) ── */}
      <section id="hero" style={{ position: 'relative', minHeight: '100vh', background: '#0e0a06', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '10vh', overflow: 'hidden' }}>
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(147,137,119,0.08) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 80% 90%, rgba(147,137,119,0.05) 0%, transparent 50%)', pointerEvents: 'none' }} />

        {/* Schedule background visual */}
        <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: 600, opacity: 0.6 }}>
          <ScheduleCard />
        </div>

        {/* Bottom gradient fade */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(14,10,6,0) 0%, rgba(14,10,6,0.3) 50%, rgba(14,10,6,0.92) 80%, #0e0a06 100%)', pointerEvents: 'none' }} />

        {/* Content panel */}
        <div className="liq-glass" style={{ position: 'relative', zIndex: 10, maxWidth: 620, width: '90%', padding: '52px 44px 44px', borderRadius: 2, textAlign: 'center' }}>
          <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, color: '#938977', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 24 }}>
            Universitetlər üçün · Beta v1.0
          </p>
          <h1 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 'clamp(38px,5.5vw,66px)', fontWeight: 400, color: '#fcfaee', lineHeight: 1.1, marginBottom: 24 }}>
            Dərs cədvəli,<br /><em style={{ fontStyle: 'italic' }}>ağıllı idarə edilmiş</em>
          </h1>
          <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 400, color: 'rgba(252,250,238,0.65)', lineHeight: 1.75, marginBottom: 36, maxWidth: 440, margin: '0 auto 36px' }}>
            Multi-tenant cədvəl platforması ilə universitetin fakültə, qrup
            və müəllim cədvəlini toqquşma olmadan idarə edin.
          </p>
          <a href="#contact" style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, color: '#fcfaee', letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none', borderBottom: '1px solid rgba(252,250,238,0.35)', paddingBottom: 4, display: 'inline-block', transition: 'border-color 0.6s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = '#938977'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = 'rgba(252,250,238,0.35)'; }}>
            Demo Müraciəti
          </a>
        </div>
      </section>

      {/* ── MANIFESTO (dark) ── */}
      <section id="manifesto" style={{ backgroundColor: '#180c04', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '78vw', margin: '0 auto', padding: '120px 0', textAlign: 'center' }}>
          <Reveal>
            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, color: '#938977', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 52 }}>Fəlsəfəmiz</p>
            <p style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 'clamp(1.4rem,3.5vw,2.8rem)', fontWeight: 400, lineHeight: 1.22, color: '#fcfaee' }}>
              Universitetdə cədvəl idarəetməsi gərgin, vaxt aparan bir proses olmamalıdır.
              E-Cədvəl bu yükü aradan qaldırmaq üçün yaradıldı — sadəcə sistemi qur,
              strukturunu daxil et, qalan işi o görsün.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── PLATFORM / ANATOMY (light) ── */}
      <section id="platform" style={{ backgroundColor: '#f0ecd7', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', padding: '100px 24px 32px' }}>
          <Reveal>
            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, color: '#938977', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>Platforma</p>
            <h2 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 42, fontWeight: 500, lineHeight: 1.2, color: '#180c04', maxWidth: 580, margin: '0 auto' }}>
              Müasir universitetlər üçün qurulmuş
            </h2>
          </Reveal>
        </div>

        <div style={{ display: 'flex', maxWidth: 1360, margin: '0 auto', minHeight: '100vh' }}>
          {/* Left sticky */}
          <div style={{ width: '45%', position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 48px' }}>
            <Reveal>
              <div style={{ background: '#180c04', borderRadius: 4, padding: 28, boxShadow: '0 20px 60px rgba(24,12,4,0.2)' }}>
                <ScheduleCard />
              </div>
            </Reveal>
          </div>

          {/* Right scroll */}
          <div style={{ width: '55%', padding: '0 48px' }}>
            <Pillar
              label="Struktur"
              title="Çox universitetli izolyasiya"
              body="Hər universitet öz fakültə, kafedra, qrup və müəllim strukturuyla tam izolyasiya edilmiş mühitdə işləyir. Superadmin paneldən yeni universitetlər əlavə edin, admin dəvəti göndərin — birkaç dəqiqədə hazır."
            />
            <Pillar
              label="İdarəetmə"
              title="Real vaxt toqquşma yoxlaması"
              body="Yeni dərs əlavə edəndə sistem avtomatik olaraq müəllim, otaq və qrup toqquşmalarını yoxlayır. Ziddiyyət tapılsa, xəbərdarlıq verilir — cədvəl heç vaxt konfliktli olmur."
            />
            <Pillar
              label="Əlçatanlıq"
              title="Tələbəyə birbaşa çatdırılma"
              body="Qeydiyyatdan keçən tələbə universitetini, fakültəsini və qrupunu seçir — cədvəl dərhal görünür. Günlük və həftəlik baxış, push bildirişlər, CSV/PDF export dəstəklənir."
            />
          </div>
        </div>
      </section>

      {/* ── CONTACT (cream) ── */}
      <section id="contact" style={{ backgroundColor: '#fcfaee', position: 'relative', zIndex: 2, padding: '100px 24px 120px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, color: '#938977', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>Müraciət</p>
              <h2 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 42, fontWeight: 500, lineHeight: 1.2, color: '#180c04' }}>
                Platformanı pulsuz sınayın
              </h2>
            </div>
          </Reveal>

          <div style={{ display: 'flex', gap: 80, alignItems: 'flex-start' }}>
            {/* Left */}
            <Reveal delay={100}>
              <div style={{ flex: '0 0 340px' }}>
                <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 14, color: '#696969', lineHeight: 1.7, marginBottom: 40 }}>
                  14 gün ərzində platformanın bütün xüsusiyyətlərini tam açıq şəkildə sınayın. Kart məlumatı tələb olunmur.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {[
                    ['01', 'Müraciəti göndərin', 'Aşağıdakı formu doldurun.'],
                    ['02', 'Demo seansı', 'Nümayəndəmiz sizinlə əlaqə saxlayar.'],
                    ['03', 'Başlayın', '14 gün pulsuz istifadə.'],
                  ].map(([n, t, d]) => (
                    <div key={n} style={{ display: 'flex', gap: 16 }}>
                      <span style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 28, fontWeight: 400, color: '#938977', lineHeight: 1, flexShrink: 0 }}>{n}</span>
                      <div>
                        <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, color: '#180c04', marginBottom: 4 }}>{t}</div>
                        <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#696969' }}>{d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Right — form */}
            <Reveal delay={200}>
              <div style={{ flex: 1 }}>
                {sent ? (
                  <div style={{ padding: '60px 0', textAlign: 'center' }}>
                    <p style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 36, fontWeight: 400, fontStyle: 'italic', color: '#180c04', marginBottom: 16 }}>Təşəkkür edirik</p>
                    <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 14, color: '#696969' }}>
                      Ən qısa zamanda <strong>{form.email}</strong> ünvanına cavab göndəriləcək.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, color: '#938977', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 20 }}>Universitet Məlumatları</p>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 500, color: '#938977', marginBottom: 8, letterSpacing: '0.5px' }}>Universitet Adı *</label>
                      <input name="universitet" type="text" className="inp" placeholder="Mingəçevir Dövlət Universiteti" value={form.universitet} onChange={hc} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
                      {[['qisa_ad','Qısa Ad','MDU'],['seher','Şəhər','Mingəçevir']].map(([n,l,p]) => (
                        <div key={n}>
                          <label style={{ display: 'block', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 500, color: '#938977', marginBottom: 8, letterSpacing: '0.5px' }}>{l}</label>
                          <input name={n} type="text" className="inp" placeholder={p} value={(form as any)[n]} onChange={hc} />
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid rgba(24,12,4,0.08)', marginBottom: 20 }} />
                    <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, color: '#938977', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 20 }}>Əlaqə Məlumatları</p>
                    {[['ad_soyad','text','Ad Soyad *','Əli Həsənov'],['email','email','Email *','info@university.edu.az'],['telefon','tel','Telefon','+994 XX XXX XX XX']].map(([n,t,l,p]) => (
                      <div key={n} style={{ marginBottom: 14 }}>
                        <label style={{ display: 'block', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 500, color: '#938977', marginBottom: 8, letterSpacing: '0.5px' }}>{l}</label>
                        <input name={n} type={t} className="inp" placeholder={p} value={(form as any)[n]} onChange={hc} />
                      </div>
                    ))}
                    {error && <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#c0392b', margin: '12px 0' }}>{error}</p>}
                    <div style={{ marginTop: 28 }}>
                      <button onClick={submit} disabled={loading} className="cta-btn"
                        style={{ display: 'inline-block', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, color: '#180c04', letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none', padding: '16px 40px', border: '1px solid rgba(24,12,4,0.25)', borderRadius: 2, background: 'transparent', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                        {loading ? 'Göndərilir...' : 'Müraciət Göndər'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="site-footer" style={{ backgroundColor: '#f0ecd7', borderTop: '1px solid rgba(24,12,4,0.1)', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', padding: '72px 24px 56px' }}>
          <p style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 'clamp(22px,3vw,34px)', fontWeight: 400, fontStyle: 'italic', color: '#180c04', lineHeight: 1.3, maxWidth: 480, margin: '0 auto' }}>
            Vaxtınız dəyərlidir. Cədvəl işini bizə buraxın.
          </p>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 72px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 40 }}>
          <div>
            <p style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 18, fontWeight: 500, color: '#180c04', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 14 }}>E-Cədvəl</p>
            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#696969', lineHeight: 1.65 }}>
              Universitetlər üçün<br />ağıllı cədvəl platforması.
            </p>
          </div>
          {[
            { heading: 'Platforma', links: [['Xüsusiyyətlər','#platform'],['Necə işləyir','#platform'],['Müraciət','#contact']] },
            { heading: 'Hesab', links: [['Daxil Ol','/login'],['Admin Panel','/admin'],['Dashboard','/dashboard']] },
            { heading: 'Hüquqi', links: [['Gizlilik Siyasəti','#'],['İstifadə Şərtləri','#']] },
          ].map(col => (
            <div key={col.heading}>
              <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, color: '#938977', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>{col.heading}</p>
              {col.links.map(([label, href]) => (
                <a key={label} href={href} style={{ display: 'block', fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#696969', textDecoration: 'none', marginBottom: 10, transition: 'color 0.4s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#180c04'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#696969'; }}>
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(24,12,4,0.08)', padding: 24, textAlign: 'center' }}>
          <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#696969' }}>© 2026 E-Cədvəl. Bütün hüquqlar qorunur.</p>
        </div>
      </footer>
    </div>
  );
}