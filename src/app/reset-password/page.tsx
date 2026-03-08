'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    // URL hash-dən token-i oxu və sessiya yarat
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    if (accessToken && type === 'recovery') {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      }).then(({ error }) => {
        if (error) {
          toast({ variant: 'destructive', title: 'Xəta', description: 'Link etibarsızdır və ya müddəti bitib.' });
        } else {
          setReady(true);
        }
      });
    } else {
      // Token yoxdursa — mövcud sessiyaya bax
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setReady(true);
        } else {
          toast({ variant: 'destructive', title: 'Xəta', description: 'Etibarsız link. Yenidən şifrə bərpası göndərin.' });
        }
      });
    }
  }, []);

  const handleReset = async () => {
    if (password !== confirm) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Şifrələr uyğun gəlmir.' });
      return;
    }
    if (password.length < 6) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Şifrə ən az 6 simvol olmalıdır.' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Xəta', description: error.message });
    } else {
      setDone(true);
      toast({ title: 'Uğurlu!', description: 'Şifrəniz yeniləndi.' });
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-sm space-y-8 bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="bg-primary p-3 rounded-xl text-white font-bold text-2xl inline-block shadow-md">E-cədvəl_QrupTap</div>
          <h1 className="text-2xl font-bold text-white">Yeni Şifrə</h1>
          <p className="text-gray-400 text-sm">Yeni şifrənizi daxil edin</p>
        </div>

        {done ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-4xl">✅</p>
            <p className="font-medium text-white">Şifrə yeniləndi!</p>
            <p className="text-sm text-gray-400">Login səhifəsinə yönləndirilirsiniz...</p>
          </div>
        ) : !ready ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-gray-400 text-sm">Yüklənir...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Yeni Şifrə</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white h-12 rounded-xl pr-12"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Şifrəni Təsdiqlə</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                  className="bg-gray-800 border-gray-700 text-white h-12 rounded-xl pr-12"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button className="w-full h-12 font-bold rounded-xl bg-teal-500 hover:bg-teal-400 text-white border-0"
              disabled={loading || !password || !confirm} onClick={handleReset}>
              {loading ? 'Gözləyin...' : 'Şifrəni Yenilə'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}