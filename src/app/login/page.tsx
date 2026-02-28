'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

type Mode = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast({ variant: 'destructive', title: 'Hesab Tapılmadı', description: 'Bu email ilə hesab mövcud deyil və ya şifrə yanlışdır.' });
      } else if (error.message.includes('Email not confirmed')) {
        toast({ variant: 'destructive', title: 'Email Təsdiqlənməyib', description: 'Zəhmət olmasa emailinizi təsdiqləyin.' });
      } else {
        toast({ variant: 'destructive', title: 'Xəta', description: error.message });
      }
    } else {
      window.location.href = '/';
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim()) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Ad Soyad daxil edin.' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Xəta', description: error.message });
    } else {
      toast({ title: 'Uğurlu!', description: 'Hesabınız yaradıldı! Daxil ola bilərsiniz.' });
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
      toast({ title: 'Göndərildi!', description: 'Şifrə bərpası üçün email göndərildi.' });
      setMode('login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
        
        {/* Sol tərəf - Form */}
        <div className="bg-gray-900 p-8 md:p-12 flex flex-col justify-center space-y-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">
              {mode === 'login' ? 'Daxil ol' : mode === 'register' ? 'Qeydiyyat' : 'Şifrəni Bərpa Et'}
            </h1>
          </div>

          <div className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="fullname" className="text-gray-300 text-sm">Ad Soyad</Label>
                <Input
                  id="fullname"
                  type="text"
                  placeholder="Məs: Əli Həsənov"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-12 rounded-xl"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm">E-poçt</Label>
              <Input
                id="email"
                type="email"
                placeholder="E-poçt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-12 rounded-xl"
              />
            </div>

            {mode !== 'forgot' && (
  <div className="space-y-2">
    <Label htmlFor="password" className="text-gray-300 text-sm">Şifrə</Label>
    <div className="relative">
      <Input
        id="password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Şifrə"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && mode === 'login' && handleLogin()}
        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-12 rounded-xl pr-12"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
      >
        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  </div>
)}

            <Button
              className="w-full h-12 font-bold text-base rounded-xl bg-teal-500 hover:bg-teal-400 text-white border-0"
              disabled={loading}
              onClick={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgot}
            >
              {loading ? 'Gözləyin...' : mode === 'login' ? 'Daxil ol' : mode === 'register' ? 'Qeydiyyat' : 'Email Göndər'}
            </Button>
          </div>

          <div className="text-center space-y-2 text-sm">
            {mode === 'login' && (
              <>
                <p className="text-gray-400">
                  Hesabınız yoxdur?{' '}
                  <button onClick={() => setMode('register')} className="text-teal-400 hover:underline font-medium">
                    Qeydiyyat
                  </button>
                </p>
                <button onClick={() => setMode('forgot')} className="text-teal-400 hover:underline block w-full">
                  Şifrəni unutmusunuz?
                </button>
              </>
            )}
            {(mode === 'register' || mode === 'forgot') && (
              <button onClick={() => setMode('login')} className="text-gray-400 hover:text-white">
                ← Geri qayıt
              </button>
            )}
          </div>
        </div>

        {/* Sağ tərəf - Banner */}
        <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-teal-600 to-teal-400 p-12 text-center">
          <h2 className="text-4xl font-extrabold text-white leading-tight tracking-wide uppercase">
            E-Cədvəl Portalına<br />Xoş Gəlmisiniz!
          </h2>
          <p className="mt-6 text-teal-100 text-sm font-medium">Mingachevir State University</p>
        </div>

      </div>
    </div>
  );
}