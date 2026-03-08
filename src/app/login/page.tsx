'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const selectClass = "w-full h-11 px-3 rounded-xl border border-white/10 bg-gray-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const inputClass = "h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:ring-blue-500";
  const labelClass = "text-white/60 text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-4xl bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex min-h-[520px] border border-white/5">

        {/* Sol */}
        <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-gradient-to-br from-blue-950 to-gray-900 p-12 text-center border-r border-white/5">
          <svg viewBox="0 0 360 300" className="w-64 h-52 mb-6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="180" cy="150" r="120" fill="#1e3a5f" opacity="0.6"/>
            <rect x="100" y="218" width="160" height="9" rx="4" fill="#3b82f6" opacity="0.25"/>
            <rect x="112" y="226" width="7" height="32" rx="3" fill="#3b82f6" opacity="0.2"/>
            <rect x="241" y="226" width="7" height="32" rx="3" fill="#3b82f6" opacity="0.2"/>
            <rect x="186" y="177" width="58" height="44" rx="7" fill="#2563eb" opacity="0.5"/>
            <rect x="182" y="216" width="66" height="7" rx="3" fill="#1d4ed8" opacity="0.5"/>
            <rect x="188" y="222" width="6" height="24" rx="3" fill="#1d4ed8" opacity="0.4"/>
            <rect x="240" y="222" width="6" height="24" rx="3" fill="#1d4ed8" opacity="0.4"/>
            <circle cx="196" cy="148" r="18" fill="#fde68a"/>
            <path d="M178 143 Q196 130 214 143" stroke="#92400e" strokeWidth="2.5" fill="none"/>
            <rect x="178" y="166" width="36" height="40" rx="8" fill="#3b82f6"/>
            <rect x="156" y="170" width="26" height="9" rx="4" fill="#3b82f6"/>
            <rect x="214" y="170" width="26" height="9" rx="4" fill="#3b82f6"/>
            <rect x="105" y="168" width="52" height="64" rx="5" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5"/>
            <line x1="114" y1="184" x2="147" y2="184" stroke="#3b82f6" strokeWidth="1.5"/>
            <line x1="114" y1="196" x2="147" y2="196" stroke="#3b82f6" strokeWidth="1.5"/>
            <line x1="114" y1="208" x2="138" y2="208" stroke="#3b82f6" strokeWidth="1.5"/>
            <line x1="114" y1="220" x2="143" y2="220" stroke="#334155" strokeWidth="1.5"/>
            <text x="65" y="100" fontSize="14" fill="#3b82f6" opacity="0.6">f(x)</text>
            <text x="265" y="88" fontSize="13" fill="#3b82f6" opacity="0.6">x+y</text>
            <circle cx="280" cy="112" r="15" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" opacity="0.8"/>
            <line x1="280" y1="102" x2="280" y2="112" stroke="#3b82f6" strokeWidth="1.5"/>
            <line x1="280" y1="112" x2="288" y2="116" stroke="#3b82f6" strokeWidth="1.5"/>
            <ellipse cx="83" cy="217" rx="13" ry="9" fill="#2563eb" opacity="0.6"/>
          </svg>
          <h2 className="text-lg font-bold text-white mb-1">Dərs Cədvəli Portalı</h2>
          <p className="text-white/40 text-sm">E-cədvəl</p>
          <div className="flex gap-2 mt-5">
            {[0,1,2,3].map(i => (
              <div key={i} className={`h-2 rounded-full ${i===1?'w-6 bg-blue-500':'w-2 bg-blue-900'}`}/>
            ))}
          </div>
        </div>

        {/* Sağ - Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center overflow-y-auto max-h-screen">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="bg-blue-600 text-white font-bold text-base px-3 py-1.5 rounded-xl">E-C</div>
              <span className="text-xl font-bold text-white">E-Cədvəl</span>
            </div>
            <p className="text-white/40 text-sm">
              {mode === 'login' ? 'Hesabınıza daxil olun' : mode === 'register' ? 'Yeni hesab yaradın' : 'Şifrə bərpası'}
            </p>
          </div>

          <div className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Ad Soyad</Label>
                  <Input placeholder="Məs: Əli Həsənov" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Universitet</Label>
                  <select value={selectedUni?.id || ''} onChange={e => handleUniChange(e.target.value)} className={selectClass}>
                    <option value="" disabled>Universitet seçin</option>
                    {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                {selectedUni && (
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Fakültə</Label>
                    <select value={selectedFaculty?.id || ''} onChange={e => handleFacultyChange(e.target.value)} className={selectClass}>
                      <option value="" disabled>Fakültə seçin</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                )}
                {selectedFaculty && (
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Qrup</Label>
                    <select value={selectedGroup?.id || ''} onChange={e => handleGroupChange(e.target.value)} className={selectClass}>
                      <option value="" disabled>Qrup seçin</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                )}
                {selectedGroup && hasSubgroups && (
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Alt/Üst Qrup</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['ust', 'alt'] as const).map(s => (
                        <button key={s} type="button" onClick={() => setSubgroup(s)}
                          className={cn("h-11 rounded-xl border-2 font-semibold text-sm transition-all",
                            subgroup === s ? "border-blue-500 bg-blue-600 text-white" : "border-white/10 text-white/60 hover:border-blue-500/50")}>
                          {s === 'ust' ? 'ÜST QRUP' : 'ALT QRUP'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="space-y-1.5">
              <Label className={labelClass}>E-poçt</Label>
              <Input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className={labelClass}>Şifrə</Label>
                  {mode === 'login' && (
                    <button onClick={() => setMode('forgot')} className="text-xs text-blue-400 hover:underline">
                      Şifrəni unutmusunuz?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && mode === 'login' && handleLogin()}
                    className={cn(inputClass, "pr-11")} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <button disabled={loading}
              onClick={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgot}
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50">
              {loading ? 'Gözləyin...' : mode === 'login' ? 'Daxil ol' : mode === 'register' ? 'Qeydiyyat' : 'Email Göndər'}
            </button>
          </div>

          <div className="mt-5 text-center text-sm text-white/40">
            {mode === 'login' ? (
              <>Hesabınız yoxdur?{' '}
                <button onClick={() => setMode('register')} className="text-blue-400 font-semibold hover:underline">Qeydiyyat</button>
              </>
            ) : (
              <button onClick={() => setMode('login')} className="text-blue-400 font-semibold hover:underline">← Geri qayıt</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}