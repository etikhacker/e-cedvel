'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, CheckCircle } from 'lucide-react';

export default function AdminRegisterPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: '',
    short_name: '',
    city: '',
    contact_email: '',
    contact_name: '',
    phone: '',
  });

  const handleSubmit = async () => {
    if (!form.name || !form.contact_email || !form.contact_name) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Zəhmət olmasa bütün məcburi sahələri doldurun.' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('university_requests').insert(form);
    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Xəta', description: error.message });
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border bg-muted/10">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Müraciətiniz Qəbul Edildi!</h1>
          <p className="text-muted-foreground">Müraciətiniz təsdiq üçün göndərildi. Tezliklə sizinlə əlaqə saxlanılacaq.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="bg-primary p-3 rounded-xl text-white font-bold text-2xl inline-block">QrupTap</div>
          <h1 className="text-2xl font-bold">Universitet Qeydiyyatı</h1>
          <p className="text-muted-foreground text-sm">Universitetinizi QrupTap-a əlavə edin</p>
        </div>

        <div className="space-y-4 p-6 rounded-2xl border bg-muted/10">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Building2 className="h-5 w-5" />
            Universitet Məlumatları
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Universitet Adı <span className="text-destructive">*</span></Label>
              <Input placeholder="Mingəçevir Dövlət Universiteti" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Qısa Ad</Label>
                <Input placeholder="MDU" value={form.short_name}
                  onChange={e => setForm(p => ({ ...p, short_name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Şəhər</Label>
                <Input placeholder="Mingəçevir" value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="font-bold text-sm">Əlaqə Məlumatları</div>
            <div className="space-y-1">
              <Label>Ad Soyad <span className="text-destructive">*</span></Label>
              <Input placeholder="Əli Həsənov" value={form.contact_name}
                onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" placeholder="info@university.edu.az" value={form.contact_email}
                onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Telefon</Label>
              <Input placeholder="+994 XX XXX XX XX" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>

          <Button className="w-full h-12 font-bold" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Göndərilir...' : 'Müraciət Göndər'}
          </Button>
        </div>
      </div>
    </div>
  );
}