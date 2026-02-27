'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type Mode = 'login' | 'register' | 'forgot' | 'confirm';

export default function LoginPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast({
          variant: 'destructive',
          title: 'Hesab Tapılmadı',
          description: 'Bu email ilə hesab mövcud deyil və ya şifrə yanlışdır. Qeydiyyatdan keçin.',
        });
      } else if (error.message.includes('Email not confirmed')) {
        toast({
          variant: 'destructive',
          title: 'Email Təsdiqlənməyib',
          description: 'Zəhmət olmasa emailinizi təsdiqləyin.',
        });
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
      options: {
        data: { full_name: fullName },
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
      toast({ title: 'Göndərildi!', description: 'Şifrə bərpası üçün email göndərildi.' });
      setMode('login');
    }
  };

  // Email təsdiq ekranı
  if (mode === 'confirm') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="bg-primary p-3 rounded-xl text-white font-bold text-2xl inline-block shadow-md">İT24</div>
          <div className="space-y-4 p-6 rounded-2xl border bg-card">
            <p className="text-6xl">📧</p>
            <h2 className="text-xl font-bold text-foreground">Email Göndərildi!</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              <span className="font-bold text-foreground">{email}</span> ünvanına təsdiq linki göndərildi.
              Emailinizi yoxlayın və linki açın.
            </p>
            <div className="bg-primary/10 rounded-xl p-3 text-xs text-primary font-medium">
              Spam qovluğunu da yoxlamağı unutmayın!
            </div>
          </div>
          <Button className="w-full h-11 font-bold" onClick={() => setMode('login')}>
            Daxil ol səhifəsinə qayıt
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="bg-primary p-3 rounded-xl text-white font-bold text-2xl inline-block shadow-md">İT24</div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === 'login' ? 'Daxil ol' : mode === 'register' ? 'Qeydiyyat' : 'Şifrəni Bərpa Et'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === 'login' ? 'Hesabınıza daxil olun' : mode === 'register' ? 'Yeni hesab yaradın' : 'Emailinizi daxil edin'}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Ad Soyad - yalnız qeydiyyatda */}
          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="fullname">Ad Soyad</Label>
              <Input
                id="fullname"
                type="text"
                placeholder="Məs: Əli Həsənov"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Şifrə */}
          {mode !== 'forgot' && (
            <div className="space-y-2">
              <Label htmlFor="password">Şifrə</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && mode === 'login' && handleLogin()}
              />
            </div>
          )}

          <Button
            className="w-full h-11 font-bold"
            disabled={loading}
            onClick={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgot}
          >
            {loading ? 'Gözləyin...' : mode === 'login' ? 'Daxil ol' : mode === 'register' ? 'Qeydiyyat' : 'Email Göndər'}
          </Button>
        </div>

        {/* Alt keçidlər */}
        <div className="text-center space-y-2 text-sm">
          {mode === 'login' && (
            <>
              <button onClick={() => setMode('forgot')} className="text-primary hover:underline block w-full">
                Şifrəni unutmusunuz?
              </button>
              <button onClick={() => setMode('register')} className="text-muted-foreground hover:underline block w-full">
                Hesabınız yoxdur? <span className="text-primary font-medium">Qeydiyyat</span>
              </button>
            </>
          )}
          {(mode === 'register' || mode === 'forgot') && (
            <button onClick={() => setMode('login')} className="text-muted-foreground hover:underline">
              ← Geri qayıt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}