'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

type Step = 'name' | 'group' | 'subgroup';

export function Onboarding({ onComplete }: { onComplete: (p: any) => void }) {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [group, setGroup] = useState<'IT24.1' | 'IT24.2' | null>(null);
  const [subgroup, setSubgroup] = useState<'ust' | 'alt' | null>(null);

  useEffect(() => {
    // Supabase-dən adı avtomatik al
    supabase.auth.getSession().then(({ data: { session } }) => {
      const fullName = session?.user?.user_metadata?.full_name;
      if (fullName) {
        setName(fullName);
        setStep('group'); // Ad artıq var, birbaşa qrup seçiminə keç
      }
      // localStorage-dan da yoxla
      const pending = localStorage.getItem('it24_pending_name');
      if (pending && !fullName) {
        setName(pending);
      }
    });
  }, []);

  const handleComplete = () => {
    if (!group || !subgroup || !name.trim()) return;
    localStorage.removeItem('it24_pending_name');
    onComplete({
      name: name.trim(),
      group,
      subgroup,
      savedGrades: {},
      savedDetails: {},
    });
  };

  const steps: Step[] = ['name', 'group', 'subgroup'];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="bg-primary p-3 rounded-xl text-white font-bold text-2xl inline-block shadow-md">İT24</div>
          <h1 className="text-2xl font-bold text-foreground">Xoş gəldiniz!</h1>
          <p className="text-muted-foreground text-sm">
            {step === 'name' ? 'Adınızı daxil edin' : step === 'group' ? 'Qrupunuzu seçin' : 'Alt/Üst qrupunuzu seçin'}
          </p>
        </div>

        {/* Addım göstəricisi */}
        <div className="flex items-center gap-2 justify-center">
          {steps.map((s, i) => (
            <div key={s} className={cn("h-2 rounded-full transition-all", i <= stepIndex ? "bg-primary w-16" : "bg-primary/30 w-16")} />
          ))}
        </div>

        {/* Addım 1: Ad */}
        {step === 'name' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <Input
              type="text"
              placeholder="Ad Soyad (məs: Əli Həsənov)"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && setStep('group')}
              className="h-12 text-base"
              autoFocus
            />
          </div>
        )}

        {/* Addım 2: Qrup seçimi */}
        {step === 'group' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-sm text-muted-foreground text-center">Salam, <b className="text-foreground">{name}</b>! Qrupunuzu seçin:</p>
            <div className="grid grid-cols-2 gap-4">
              {(['IT24.1', 'IT24.2'] as const).map((g) => (
                <button key={g} onClick={() => setGroup(g)}
                  className={cn("p-6 rounded-2xl border-2 font-bold text-lg transition-all",
                    group === g ? "border-primary bg-primary text-white shadow-lg scale-105" : "border-border bg-card text-foreground hover:border-primary/50")}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Addım 3: Alt/Üst qrup */}
        {step === 'subgroup' && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
            {(['ust', 'alt'] as const).map((s) => (
              <button key={s} onClick={() => setSubgroup(s)}
                className={cn("p-6 rounded-2xl border-2 font-bold text-lg transition-all",
                  subgroup === s ? "border-primary bg-primary text-white shadow-lg scale-105" : "border-border bg-card text-foreground hover:border-primary/50")}>
                {s === 'ust' ? 'ÜST' : 'ALT'}
              </button>
            ))}
          </div>
        )}

        {/* Düymələr */}
        <div className="flex gap-3">
          {step !== 'name' && (
            <Button variant="outline" className="flex-1 h-12"
              onClick={() => setStep(step === 'subgroup' ? 'group' : 'name')}>
              Geri
            </Button>
          )}
          <Button className="flex-1 h-12 text-base font-bold"
            disabled={step === 'name' ? !name.trim() : step === 'group' ? !group : !subgroup}
            onClick={() => {
              if (step === 'name') setStep('group');
              else if (step === 'group') setStep('subgroup');
              else handleComplete();
            }}>
            {step === 'subgroup' ? 'Başla' : 'Davam Et'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;