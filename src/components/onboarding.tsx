import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Step = 'group' | 'subgroup';

export function Onboarding({ onComplete }: { onComplete: (p: any) => void }) {
  const [step, setStep] = useState<Step>('group');
  const [group, setGroup] = useState<'it241' | 'it242' | null>(null);
  const [subgroup, setSubgroup] = useState<'ust' | 'alt' | null>(null);

  const handleComplete = () => {
    if (!group || !subgroup) return;
    onComplete({
      name: group === 'it241' ? 'İT24.1' : 'İT24.2',
      group,
      subgroup,
      savedGrades: {},
      savedDetails: {},
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="bg-primary p-3 rounded-xl text-white font-bold text-2xl inline-block shadow-md">İT24</div>
          <h1 className="text-2xl font-bold text-foreground">Xoş gəldiniz!</h1>
          <p className="text-muted-foreground text-sm">
            {step === 'group' ? 'Qrupunuzu seçin' : 'Alt/Üst qrupunuzu seçin'}
          </p>
        </div>

        {/* Addım göstəricisi */}
        <div className="flex items-center gap-2 justify-center">
          <div className={cn("h-2 w-16 rounded-full transition-all", step === 'group' ? "bg-primary" : "bg-primary/30")} />
          <div className={cn("h-2 w-16 rounded-full transition-all", step === 'subgroup' ? "bg-primary" : "bg-primary/30")} />
        </div>

        {/* Addım 1: Qrup seçimi */}
        {step === 'group' && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
            {(['it241', 'it242'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={cn(
                  "p-6 rounded-2xl border-2 font-bold text-lg transition-all",
                  group === g
                    ? "border-primary bg-primary text-white shadow-lg scale-105"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                )}
              >
                {g === 'it241' ? 'İT24.1' : 'İT24.2'}
              </button>
            ))}
          </div>
        )}

        {/* Addım 2: Alt/Üst qrup */}
        {step === 'subgroup' && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
            {(['ust', 'alt'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSubgroup(s)}
                className={cn(
                  "p-6 rounded-2xl border-2 font-bold text-lg transition-all",
                  subgroup === s
                    ? "border-primary bg-primary text-white shadow-lg scale-105"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                )}
              >
                {s === 'ust' ? 'ÜST' : 'ALT'}
              </button>
            ))}
          </div>
        )}

        {/* Düymələr */}
        <div className="flex gap-3">
          {step === 'subgroup' && (
            <Button variant="outline" className="flex-1 h-12" onClick={() => setStep('group')}>
              Geri
            </Button>
          )}
          <Button
            className="flex-1 h-12 text-base font-bold"
            disabled={step === 'group' ? !group : !subgroup}
            onClick={() => {
              if (step === 'group') setStep('subgroup');
              else handleComplete();
            }}
          >
            {step === 'group' ? 'Davam Et' : 'Başla'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;