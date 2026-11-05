'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

type Invite = {
  email: string;
  university_id: string;
  universities: { name: string } | null;
};

export default function AdminSetupPage() {
  const { toast } = useToast();
  const tokenRef = useRef('');
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signedIn,setSignedIn]=useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);

  const loadInvite = useCallback(async (t: string) => {
    const response = await fetch('/api/invitations', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'inspect',token:t})});
    const data = await response.json();
    const error = !response.ok;

    if (error || !data) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Link etibarsızdır və ya artıq istifadə edilib.' });
      setTimeout(() => window.location.replace('/'), 2000);
      return;
    }

    setInvite(data);
    setForm(prev => ({ ...prev, email: data.email }));
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('token');
    if (!inviteToken) {
      window.location.replace('/');
      return;
    }
    tokenRef.current = inviteToken;
    void supabase.auth.getUser().then(({data:{user}})=>setSignedIn(!!user));
    void loadInvite(inviteToken).catch(() => { setLoading(false); toast({variant:'destructive',title:'Xəta',description:'Dəvət yüklənmədi. Səhifəni yeniləyin.'}); });
  }, [loadInvite, toast]);

  const handleSetup = async () => {
    if (!signedIn && form.password !== form.confirm) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Şifrələr uyğun gəlmir.' });
      return;
    }
    if (!signedIn && form.password.length < 12) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Şifrə ən az 12 simvol olmalıdır.' });
      return;
    }

    if (!invite) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Dəvət məlumatı tapılmadı.' });
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      const {data:{user}}=await supabase.auth.getUser();
      if (!user) {
        const {data,error}=await supabase.auth.signUp({email:invite.email,password:form.password,options:{
          emailRedirectTo:window.location.origin+'/auth/callback?next='+encodeURIComponent('/admin/setup?token='+tokenRef.current),
        }});
        if (error) throw new Error('Qeydiyyat alınmadı. Mövcud hesabınız varsa daxil olun.');
        if (!data.session) {
          toast({title:'Emaili təsdiqləyin',description:'Emaildəki linki açın. Mövcud hesabınız varsa daxil olub bu dəvət linkinə qayıdın.'});
          return;
        }
      }
      const response=await fetch('/api/invitations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'consume',token:tokenRef.current})});
      const result=await response.json();
      if (!response.ok) throw new Error(result.error);
      setDone(true);
    } catch(error) {
      toast({variant:'destructive',title:'Xəta',description:error instanceof Error?error.message:'Əməliyyat tamamlanmadı.'});
    } finally { setSaving(false); }

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
          <a href="/login" className="block text-sm text-primary">Mövcud hesabla daxil olun, sonra bu dəvət linkinə qayıdın.</a>
          <Button className="w-full h-12 font-bold" onClick={handleSetup} disabled={saving}>
            {saving ? 'Yaradılır...' : signedIn ? 'Dəvəti qəbul et' : 'Hesabı Yarat'}
          </Button>
        </div>
      </div>
    </div>
  );
}