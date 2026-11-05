'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const router=useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({data:{user},error})=>{
      if (error || !user) { window.location.replace('/login?error=invalid-link'); return; }
      setReady(true);
    });
  }, [toast]);

  const handleReset = async () => {
    if (password !== confirm) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Şifrələr uyğun gəlmir.' });
      return;
    }
    if (password.length < 12) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Şifrə ən az 12 simvol olmalıdır.' });
      return;
    }
    if (loading || !ready) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Şifrə yenilənmədi. Yenidən cəhd edin.' });
    } else {
      const {error:logoutError}=await supabase.auth.signOut();
      if (logoutError) { toast({variant:'destructive',title:'Xəta',description:'Şifrə dəyişdi, lakin çıxış alınmadı.'}); return; }
      setDone(true);
      toast({ title: 'Uğurlu!', description: 'Şifrəniz yeniləndi.' });
      router.replace('/login');router.refresh();
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