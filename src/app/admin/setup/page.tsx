'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function AdminSetupPage() {
  const { toast } = useToast();
  const [token, setToken] = useState('');
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) { window.location.replace('/'); return; }
    setToken(t);
    loadInvite(t);
  }, []);

  const loadInvite = async (t: string) => {
    const { data, error } = await supabase
      .from('university_invites')
      .select('*, universities(name)')
      .eq('token', t)
      .eq('used', false)
      .single();

    if (error || !data) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Link etibarsızdır və ya artıq istifadə edilib.' });
      setTimeout(() => window.location.replace('/'), 2000);
      return;
    }

    setInvite(data);
    setForm(prev => ({ ...prev, email: data.email }));
    setLoading(false);
  };

  const handleSetup = async () => {
    if (form.password !== form.confirm) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Şifrələr uyğun gəlmir.' });
      return;
    }
    if (form.password.length < 6) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Şifrə ən az 6 simvol olmalıdır.' });
      return;
    }

    setSaving(true);

    // 1. Qeydiyyat
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError || !authData.user) {
      toast({ variant: 'destructive', title: 'Xəta', description: signUpError?.message || 'Qeydiyyat alınmadı.' });
      setSaving(false);
      return;
    }

    // 2. university_admins-ə əlavə et
    await supabase.from('university_admins').insert({
      id: authData.user.id,
      university_id: invite.university_id,
      role: 'admin',
    });

    // 3. Dəvəti istifadə edilmiş işarələ
    await supabase.from('university_invites').update({ used: true }).eq('token', token);

    setSaving(false);
    setDone(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Yüklənir...</p>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border bg-muted/10">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold">Hesabınız Yaradıldı!</h1>
        <p className="text-muted-foreground">İndi admin panelinə daxil ola bilərsiniz.</p>
        <Button className="w-full" onClick={() => window.location.replace('/login')}>
          Daxil Ol
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="bg-primary p-3 rounded-xl text-white font-bold text-2xl inline-block">QrupTap</div>
          <h1 className="text-2xl font-bold">Admin Hesabı Yarat</h1>
          <p className="text-muted-foreground text-sm">
            <span className="text-primary font-medium">{invite?.universities?.name}</span> universiteti üçün
          </p>
        </div>

        <div className="space-y-4 p-6 rounded-2xl border bg-muted/10">
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={form.email} disabled className="bg-muted" />
          </div>
          <div className="space-y-1">
            <Label>Şifrə</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Şifrəni Təsdiqlə</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
            />
          </div>
          <Button className="w-full h-12 font-bold" onClick={handleSetup} disabled={saving}>
            {saving ? 'Yaradılır...' : 'Hesabı Yarat'}
          </Button>
        </div>
      </div>
    </div>
  );
}