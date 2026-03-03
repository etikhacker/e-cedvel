'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'register' | 'forgot';

const FACULTIES: Record<string, string[]> = {
  'Təhsil fakültəsi': ['İS24.1','İS24.2','RI23','TPX24','Sİ24','Sİ25','MT24','MT25'],
  'Mühəndislik fakültəsi': ['İT24.1','İT24.2','İT23.1','İT23.2','EN24','EN23','KM24','KM23'],
  'İqtisadiyyat fakültəsi': ['İQTİSAD24.1','İQTİSAD24.2','İQTİSAD23.1','İQTİSAD23.2','MUHASİBAT24','MUHASİBAT23','MENECMENt24','MENECMENt23'],
};

export default function LoginPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [group, setGroup] = useState('');
  const [subgroup, setSubgroup] = useState<'ust' | 'alt' | ''>('');

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
    if (!faculty) { toast({ variant: 'destructive', title: 'Xəta', description: 'Fakültə seçin.' }); return; }
    if (!group) { toast({ variant: 'destructive', title: 'Xəta', description: 'Qrup seçin.' }); return; }
    if (!subgroup) { toast({ variant: 'destructive', title: 'Xəta', description: 'Alt/Üst qrup seçin.' }); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
  email, password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: { full_name: fullName, faculty, group, subgroup },
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
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Xəta', description: error.message });
    } else {
      toast({ title: 'Göndərildi!', description: 'Şifrə bərpası emaili göndərildi.' });
      setMode('login');
    }
  };

  const groups = faculty ? FACULTIES[faculty] || [] : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex min-h-[520px]">

        {/* Sol - Illustration */}
        <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-green-50 p-12 text-center">
          <svg viewBox="0 0 360 300" className="w-64 h-52 mb-6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="180" cy="150" r="120" fill="#dcfce7"/>
            <rect x="100" y="218" width="160" height="9" rx="4" fill="#16a34a" opacity="0.25"/>
            <rect x="112" y="226" width="7" height="32" rx="3" fill="#16a34a" opacity="0.2"/>
            <rect x="241" y="226" width="7" height="32" rx="3" fill="#16a34a" opacity="0.2"/>
            <rect x="186" y="177" width="58" height="44" rx="7" fill="#16a34a" opacity="0.5"/>
            <rect x="182" y="216" width="66" height="7" rx="3" fill="#15803d" opacity="0.5"/>
            <rect x="188" y="222" width="6" height="24" rx="3" fill="#15803d" opacity="0.4"/>
            <rect x="240" y="222" width="6" height="24" rx="3" fill="#15803d" opacity="0.4"/>
            <circle cx="196" cy="148" r="18" fill="#fde68a"/>
            <path d="M178 143 Q196 130 214 143" stroke="#92400e" strokeWidth="2.5" fill="none"/>
            <rect x="178" y="166" width="36" height="40" rx="8" fill="#4ade80"/>
            <rect x="156" y="170" width="26" height="9" rx="4" fill="#4ade80"/>
            <rect x="214" y="170" width="26" height="9" rx="4" fill="#4ade80"/>
            <rect x="105" y="168" width="52" height="64" rx="5" fill="white" stroke="#16a34a" strokeWidth="1.5"/>
            <line x1="114" y1="184" x2="147" y2="184" stroke="#16a34a" strokeWidth="1.5"/>
            <line x1="114" y1="196" x2="147" y2="196" stroke="#16a34a" strokeWidth="1.5"/>
            <line x1="114" y1="208" x2="138" y2="208" stroke="#16a34a" strokeWidth="1.5"/>
            <line x1="114" y1="220" x2="143" y2="220" stroke="#d1d5db" strokeWidth="1.5"/>
            <text x="65" y="100" fontSize="14" fill="#16a34a" opacity="0.6">f(x)</text>
            <text x="265" y="88" fontSize="13" fill="#16a34a" opacity="0.6">x+y</text>
            <text x="272" y="140" fontSize="16" fill="#16a34a" opacity="0.4">x</text>
            <text x="60" y="155" fontSize="12" fill="#16a34a" opacity="0.4">y</text>
            <circle cx="280" cy="112" r="15" fill="white" stroke="#16a34a" strokeWidth="1.5" opacity="0.8"/>
            <line x1="280" y1="102" x2="280" y2="112" stroke="#16a34a" strokeWidth="1.5"/>
            <line x1="280" y1="112" x2="288" y2="116" stroke="#16a34a" strokeWidth="1.5"/>
            <rect x="78" y="223" width="11" height="20" rx="3" fill="#92400e" opacity="0.4"/>
            <ellipse cx="83" cy="217" rx="13" ry="9" fill="#22c55e" opacity="0.6"/>
          </svg>
          <h2 className="text-lg font-bold text-gray-700 mb-1">Dərs Cədvəli Portalı</h2>
          <p className="text-gray-400 text-sm">Mingəçevir Dövlət Universiteti</p>
          <div className="flex gap-2 mt-5">
            {[0,1,2,3].map(i => (
              <div key={i} className={`h-2 rounded-full ${i===1?'w-6 bg-green-500':'w-2 bg-green-200'}`}/>
            ))}
          </div>
        </div>

        {/* Sağ - Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center overflow-y-auto">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="bg-green-600 text-white font-bold text-base px-3 py-1.5 rounded-xl">İT24</div>
              <span className="text-xl font-bold text-gray-800">E-Cədvəl</span>
            </div>
            <p className="text-gray-400 text-sm">
              {mode === 'login' ? 'Hesabınıza daxil olun' : mode === 'register' ? 'Yeni hesab yaradın' : 'Şifrə bərpası'}
            </p>
          </div>

          <div className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-gray-600 text-sm">Ad Soyad</Label>
                  <Input placeholder="Məs: Əli Həsənov" value={fullName} onChange={e => setFullName(e.target.value)}
                    className="h-11 rounded-xl border-gray-900"/>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-600 text-sm">Fakültə</Label>
                  <select value={faculty} onChange={e => { setFaculty(e.target.value); setGroup(''); }}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                    <option value="" disabled>Fakültə seçin</option>
                    {Object.keys(FACULTIES).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                {faculty && (
                  <div className="space-y-1.5">
                    <Label className="text-gray-600 text-sm">Qrup</Label>
                    <select value={group} onChange={e => setGroup(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                      <option value="" disabled>Qrup seçin</option>
                      {groups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                )}
                {group && (
                  <div className="space-y-1.5">
                    <Label className="text-gray-600 text-sm">Alt/Üst Qrup</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['ust', 'alt'] as const).map(s => (
                        <button key={s} type="button" onClick={() => setSubgroup(s)}
                          className={cn("h-11 rounded-xl border-2 font-semibold text-sm transition-all",
                            subgroup === s ? "border-green-500 bg-green-500 text-white" : "border-gray-200 text-gray-600 hover:border-green-300")}>
                          {s === 'ust' ? 'ÜST QRUP' : 'ALT QRUP'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-gray-600 text-sm">E-poçt</Label>
              <Input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)}
                className="h-11 rounded-xl border-gray-200" />
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-600 text-sm">Şifrə</Label>
                  {mode === 'login' && (
                    <button onClick={() => setMode('forgot')} className="text-xs text-green-600 hover:underline">
                      Şifrəni unutmusunuz?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && mode === 'login' && handleLogin()}
                    className="h-11 rounded-xl border-gray-200 pr-11" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <button disabled={loading}
              onClick={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgot}
              className="w-full h-11 bg-gray-900 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50">
              {loading ? 'Gözləyin...' : mode === 'login' ? 'Daxil ol' : mode === 'register' ? 'Qeydiyyat' : 'Email Göndər'}
            </button>
          </div>

          <div className="mt-5 text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>Hesabınız yoxdur?{' '}
                <button onClick={() => setMode('register')} className="text-green-600 font-semibold hover:underline">Qeydiyyat</button>
              </>
            ) : (
              <button onClick={() => setMode('login')} className="text-green-600 font-semibold hover:underline">← Geri qayıt</button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}