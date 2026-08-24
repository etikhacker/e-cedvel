'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

type Mode = 'login' | 'register' | 'forgot';
type University = { id: string; name: string; short_name: string };
type Faculty = { id: string; name: string };
type Group = { id: string; name: string };

export default function LoginPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');

  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [hasSubgroups, setHasSubgroups] = useState(false);

  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [subgroup, setSubgroup] = useState<'ust' | 'alt' | ''>('');

  useEffect(() => {
    supabase.from('universities').select('id, name, short_name').eq('is_active', true).then(({ data }) => {
      setUniversities(data || []);
    });
  }, []);

  const handleUniChange = async (uniId: string) => {
    const uni = universities.find(u => u.id === uniId) || null;
    setSelectedUni(uni);
    setSelectedFaculty(null);
    setSelectedGroup(null);
    setSubgroup('');
    setHasSubgroups(false);
    if (!uniId) return;
    const { data } = await supabase.from('faculties').select('id, name').eq('university_id', uniId);
    setFaculties(data || []);
  };

  const handleFacultyChange = async (facId: string) => {
    const fac = faculties.find(f => f.id === facId) || null;
    setSelectedFaculty(fac);
    setSelectedGroup(null);
    setSubgroup('');
    setHasSubgroups(false);
    if (!facId) return;
    const { data } = await supabase.from('groups').select('id, name').eq('faculty_id', facId);
    setGroups(data || []);
  };

  const handleGroupChange = async (grpId: string) => {
    const grp = groups.find(g => g.id === grpId) || null;
    setSelectedGroup(grp);
    setSubgroup('');
    if (!grpId) return;
    const { data } = await supabase
      .from('schedule_lessons')
      .select('subgroup')
      .eq('group_id', grpId)
      .neq('subgroup', 'hamisi')
      .limit(1);
    setHasSubgroups(!!(data && data.length > 0));
  };

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Email və ya şifrə yanlışdır.' });
    } else {
      window.location.href = '/';
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim()) { toast({ variant: 'destructive', title: 'Xəta', description: 'Ad Soyad daxil edin.' }); return; }
    if (!selectedUni) { toast({ variant: 'destructive', title: 'Xəta', description: 'Universitet seçin.' }); return; }
    if (!selectedFaculty) { toast({ variant: 'destructive', title: 'Xəta', description: 'Fakültə seçin.' }); return; }
    if (!selectedGroup) { toast({ variant: 'destructive', title: 'Xəta', description: 'Qrup seçin.' }); return; }
    if (hasSubgroups && !subgroup) { toast({ variant: 'destructive', title: 'Xəta', description: 'Alt/Üst qrup seçin.' }); return; }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          university_id: selectedUni.id,
          university_name: selectedUni.name,
          faculty_id: selectedFaculty.id,
          faculty_name: selectedFaculty.name,
          group_id: selectedGroup.id,
          group: selectedGroup.name,
          subgroup: hasSubgroups ? subgroup : 'hamisi',
        },
      },
    });
    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Xəta', description: error.message });
    } else {
      toast({ title: 'Uğurlu!', description: 'Hesabınız yaradıldı!' });
      setMode('login');
    }
  };

  const handleForgot = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Xəta', description: error.message });
    } else {
      toast({ title: 'Göndərildi!', description: 'Şifrə bərpası emaili göndərildi.' });
      setMode('login');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
        .login-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(24,12,4,0.04);
          border: 1px solid rgba(24,12,4,0.12);
          border-radius: 2px;
          font-family: Inter, sans-serif;
          font-size: 13px;
          color: #180c04;
          outline: none;
          transition: border-color 0.4s;
          box-sizing: border-box;
        }
        .login-input:focus {
          border-color: rgba(24,12,4,0.4);
        }
        .login-input::placeholder {
          color: rgba(24,12,4,0.3);
        }
        .login-select {
          width: 100%;
          padding: 12px 16px;
          background: rgba(24,12,4,0.04);
          border: 1px solid rgba(24,12,4,0.12);
          border-radius: 2px;
          font-family: Inter, sans-serif;
          font-size: 13px;
          color: #180c04;
          outline: none;
          transition: border-color 0.4s;
          box-sizing: border-box;
          appearance: none;
          cursor: pointer;
        }
        .login-select:focus {
          border-color: rgba(24,12,4,0.4);
        }
        .login-btn {
          width: 100%;
          padding: 14px;
          background: #180c04;
          color: #fcfaee;
          border: none;
          border-radius: 2px;
          font-family: Inter, sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.4s, transform 0.2s;
        }
        .login-btn:hover:not(:disabled) {
          background: #2a1e10;
          transform: translateY(-1px);
        }
        .login-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .subgroup-btn {
          padding: 12px;
          border: 1px solid rgba(24,12,4,0.12);
          border-radius: 2px;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
          background: transparent;
          color: #938977;
        }
        .subgroup-btn.active {
          background: #180c04;
          color: #fcfaee;
          border-color: #180c04;
        }
        .subgroup-btn:not(.active):hover {
          border-color: rgba(24,12,4,0.3);
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#fcfaee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Logo / Brand */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <h1 style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: 28,
                fontWeight: 500,
                color: '#180c04',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                E-Cədvəl
              </h1>
            </Link>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              color: '#938977',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              {mode === 'login' ? 'Hesabınıza daxil olun' : mode === 'register' ? 'Yeni hesab yaradın' : 'Şifrə bərpası'}
            </p>
          </div>

          {/* Divider line */}
          <div style={{ width: 40, height: 1, background: 'rgba(24,12,4,0.15)', margin: '0 auto 40px' }} />

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {mode === 'register' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#938977', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                    Ad Soyad
                  </label>
                  <input
                    className="login-input"
                    placeholder="Məs: Əli Həsənov"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#938977', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                    Universitet
                  </label>
                  <select
                    className="login-select"
                    value={selectedUni?.id || ''}
                    onChange={e => handleUniChange(e.target.value)}
                  >
                    <option value="" disabled>Universitet seçin</option>
                    {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                {selectedUni && (
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#938977', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                      Fakültə
                    </label>
                    <select
                      className="login-select"
                      value={selectedFaculty?.id || ''}
                      onChange={e => handleFacultyChange(e.target.value)}
                    >
                      <option value="" disabled>Fakültə seçin</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                )}
                {selectedFaculty && (
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#938977', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                      Qrup
                    </label>
                    <select
                      className="login-select"
                      value={selectedGroup?.id || ''}
                      onChange={e => handleGroupChange(e.target.value)}
                    >
                      <option value="" disabled>Qrup seçin</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                )}
                {selectedGroup && hasSubgroups && (
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#938977', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                      Alt/Üst Qrup
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {(['ust', 'alt'] as const).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSubgroup(s)}
                          className={`subgroup-btn ${subgroup === s ? 'active' : ''}`}
                        >
                          {s === 'ust' ? 'ÜST QRUP' : 'ALT QRUP'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#938977', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                E-poçt
              </label>
              <input
                className="login-input"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#938977', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    Şifrə
                  </label>
                  {mode === 'login' && (
                    <button
                      onClick={() => setMode('forgot')}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        fontSize: 11, color: '#938977', cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif', fontWeight: 500,
                        textDecoration: 'underline', textUnderlineOffset: '2px',
                      }}
                    >
                      Şifrəni unutmusunuz?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && mode === 'login' && handleLogin()}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      color: '#938977',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: 8 }}>
              <button
                className="login-btn"
                disabled={loading}
                onClick={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgot}
              >
                {loading ? 'Gözləyin...' : mode === 'login' ? 'Daxil Ol' : mode === 'register' ? 'Qeydiyyat' : 'Email Göndər'}
              </button>
            </div>
          </div>

          {/* Mode switch */}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            {mode === 'login' ? (
              <p style={{ fontSize: 13, color: '#938977' }}>
                Hesabınız yoxdur?{' '}
                <button
                  onClick={() => setMode('register')}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    fontSize: 13, color: '#180c04', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontWeight: 600,
                    textDecoration: 'underline', textUnderlineOffset: '3px',
                  }}
                >
                  Qeydiyyat
                </button>
              </p>
            ) : (
              <button
                onClick={() => setMode('login')}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  fontSize: 13, color: '#180c04', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  textDecoration: 'underline', textUnderlineOffset: '3px',
                }}
              >
                ← Geri qayıt
              </button>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <p style={{ fontSize: 11, color: '#b8a98e', letterSpacing: '1px' }}>
              © 2026 E-Cədvəl
            </p>
          </div>
        </div>
      </div>
    </>
  );
}