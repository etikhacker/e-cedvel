'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="bg-primary p-3 rounded-xl text-white font-bold text-2xl inline-block shadow-md">İT24</div>
          <h1 className="text-2xl font-bold text-foreground">Yeni Şifrə</h1>
          <p className="text-muted-foreground text-sm">Yeni şifrənizi daxil edin</p>
        </div>

        {done ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-4xl">✅</p>
            <p className="font-medium text-foreground">Şifrə yeniləndi!</p>
            <p className="text-sm text-muted-foreground">Login səhifəsinə yönləndirilirsiniz...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Yeni Şifrə</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Şifrəni Təsdiqlə</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReset()}
              />
            </div>
            <Button className="w-full h-11 font-bold" disabled={loading} onClick={handleReset}>
              {loading ? 'Gözləyin...' : 'Şifrəni Yenilə'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}