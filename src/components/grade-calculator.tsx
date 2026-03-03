'use client';

import React, { useState } from 'react';
import { Calculator, RotateCcw, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const SUBJECTS = [
  'Kompüter Şəbəkələri',
  'Əməliyyat Sistemləri',
  'Obyektyönlü Proqramlaşdırma',
  'Verilənlər Bazası Sistemləri',
  'Diskret Riyaziyyat',
];

type Components = {
  hasKollokvium: boolean;
  hasSeminar: boolean;
  hasLab: boolean;
};

type GradeState = {
  davamiyyat: string;
  serbest: string;
  kollokvium: [string, string, string];
  seminar: string[];
  laboratoriya: number[];
};

const defaultGrades = (): GradeState => ({
  davamiyyat: '',
  serbest: '',
  kollokvium: ['', '', ''],
  seminar: [],
  laboratoriya: [],
});

type SaveData = {
  subject: string;
  total: number;
  davamiyyat: number;
  serbest: number;
  kollokviumOrta: number;
  seminarOrta: number;
  labBal: number;
};

interface GradeCalculatorProps {
  onSave?: (data: SaveData) => void;
}

export function GradeCalculator({ onSave }: GradeCalculatorProps) {
  const [subject, setSubject] = useState('');
  const [components, setComponents] = useState<Components | null>(null);
  const [grades, setGrades] = useState<GradeState>(defaultGrades());
  const [result, setResult] = useState<number | null>(null);
  const [lastCalc, setLastCalc] = useState<Omit<SaveData, 'subject'> | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubjectChange = (s: string) => {
    setSubject(s);
    setComponents(null);
    setGrades(defaultGrades());
    setResult(null);
    setSaved(false);
  };

  const handleComponentsConfirm = (c: Components) => {
    setComponents(c);
    setGrades(defaultGrades());
    setResult(null);
    setSaved(false);
  };

  const smartToggleLab = (n: number) => {
    setGrades(prev => {
      const selected = prev.laboratoriya;
      if (selected.includes(n)) {
        return { ...prev, laboratoriya: selected.filter(x => x !== n) };
      }
      const newSelected = [...selected, n].sort((a, b) => a - b);
      const max = Math.max(...newSelected);
      const consecutive = Array.from({ length: max }, (_, i) => i + 1);
      return { ...prev, laboratoriya: consecutive };
    });
  };

  const addSeminar = () => setGrades(prev => ({ ...prev, seminar: [...prev.seminar, ''] }));
  const removeSeminar = (i: number) => setGrades(prev => ({ ...prev, seminar: prev.seminar.filter((_, idx) => idx !== i) }));
  const updateSeminar = (i: number, val: string) => {
    setGrades(prev => { const s = [...prev.seminar]; s[i] = val; return { ...prev, seminar: s }; });
  };

  const calculate = () => {
    if (!components) return;
    const davamiyyat = Math.min(10, parseFloat(grades.davamiyyat) || 0);
    const serbest = Math.min(10, parseFloat(grades.serbest) || 0);

    const kollokviumVals = components.hasKollokvium
      ? grades.kollokvium.map(k => Math.min(10, parseFloat(k) || 0))
      : [];
    const seminarVals = components.hasSeminar
      ? grades.seminar.map(s => Math.min(10, parseFloat(s) || 0))
      : [];

    let kombinOrta = 0;
    let labBal = 0;

    if (components.hasLab && !components.hasSeminar && !components.hasKollokvium) {
      // Yalnız lab: max 30
      labBal = Math.min(30, (grades.laboratoriya.length / 8) * 30);
      kombinOrta = 0;
    } else if (!components.hasLab) {
      // Lab yoxdur: kollokvium+seminar orta, max 20
      const allVals = [...kollokviumVals, ...seminarVals];
      const orta = allVals.length > 0 ? allVals.reduce((a, b) => a + b, 0) / allVals.length : 0;
      kombinOrta = Math.min(20, (orta / 10) * 20);
      labBal = 0;
    } else {
      // Lab + (kollokvium və/və ya seminar): lab max 15, kombin max 10
      const allVals = [...kollokviumVals, ...seminarVals];
      const orta = allVals.length > 0 ? allVals.reduce((a, b) => a + b, 0) / allVals.length : 0;
      kombinOrta = Math.min(10, orta);
      labBal = Math.min(15, (grades.laboratoriya.length / 8) * 15);
    }

    const total = Math.round((davamiyyat + serbest + kombinOrta + labBal) * 10) / 10;
    setResult(total);
    setSaved(false);
    setLastCalc({ total, davamiyyat, serbest, kollokviumOrta: kombinOrta, seminarOrta: kombinOrta, labBal });
  };

  const handleSave = () => {
    if (!onSave || !lastCalc || !subject) return;
    onSave({ subject, ...lastCalc });
    setSaved(true);
  };

  // Fənn seçilməyib
  if (!subject) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-primary shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Giriş Balı Hesablayıcı</h2>
            <p className="text-sm text-muted-foreground">Qiymətlərinizi daxil edin</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-bold">Fənn Seçin</Label>
          <select value="" onChange={e => handleSubjectChange(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="" disabled>Dərsi seçin</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-3">
          <Calculator className="h-12 w-12 opacity-20" />
          <p className="text-sm">Zəhmət olmasa dərsi seçin</p>
        </div>
      </div>
    );
  }

  // Fənn seçilib, komponentlər seçilməyib
  if (!components) {
    return <ComponentSelector subject={subject} onSubjectChange={handleSubjectChange} onConfirm={handleComponentsConfirm} />;
  }

  // Əsas form
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="h-6 w-6 text-primary shrink-0" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Giriş Balı Hesablayıcı</h2>
          <p className="text-sm text-muted-foreground">Qiymətlərinizi daxil edin</p>
        </div>
      </div>

      {/* Fənn + dəyişdir */}
      <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/20">
        <div>
          <p className="font-bold text-foreground">{subject}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {[components.hasKollokvium && 'Kollokvium', components.hasSeminar && 'Seminar', components.hasLab && 'Lab'].filter(Boolean).join(' · ')}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => handleSubjectChange(subject)} className="text-xs text-primary">
          Dəyiş
        </Button>
      </div>

      {/* Davamiyyət + Sərbəst */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-bold text-sm">Davamiyyət <span className="text-muted-foreground font-normal">(Max 10)</span></Label>
          <Input type="number" min={0} max={10} placeholder="Məs: 10" value={grades.davamiyyat}
            onChange={e => setGrades(prev => ({ ...prev, davamiyyat: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label className="font-bold text-sm">Sərbəst İş <span className="text-muted-foreground font-normal">(Max 10)</span></Label>
          <Input type="number" min={0} max={10} placeholder="Məs: 10" value={grades.serbest}
            onChange={e => setGrades(prev => ({ ...prev, serbest: e.target.value }))} />
        </div>
      </div>

      {/* Kollokvium */}
      {components.hasKollokvium && (
        <div className="space-y-2">
          <Label className="font-bold text-sm">Kollokvium Qiymətləri <span className="text-muted-foreground font-normal">(Max 10)</span></Label>
          <div className="grid grid-cols-3 gap-3">
            {grades.kollokvium.map((k, i) => (
              <Input key={i} type="number" min={0} max={10} placeholder={`Kollokvium ${i+1}`} value={k}
                onChange={e => {
                  const kol = [...grades.kollokvium] as [string, string, string];
                  kol[i] = e.target.value;
                  setGrades(prev => ({ ...prev, kollokvium: kol }));
                }} />
            ))}
          </div>
        </div>
      )}

      {/* Seminar */}
      {components.hasSeminar && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-bold text-sm">Seminar Qiymətləri <span className="text-muted-foreground font-normal">(Max 10)</span></Label>
            <Button variant="ghost" size="sm" onClick={addSeminar} className="gap-1 text-primary hover:bg-primary/10">
              <Plus className="h-4 w-4" /> Əlavə et
            </Button>
          </div>
          {grades.seminar.length === 0 && <p className="text-sm text-muted-foreground italic">Seminar qiyməti əlavə edin</p>}
          <div className="space-y-2">
            {grades.seminar.map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input type="number" min={0} max={10} placeholder={`Seminar ${i + 1}`} value={s}
                  onChange={e => updateSeminar(i, e.target.value)} />
                <Button variant="ghost" size="icon" onClick={() => removeSeminar(i)}
                  className="text-destructive hover:bg-destructive/10 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Laboratoriya */}
      {components.hasLab && (
        <div className="space-y-3 p-4 rounded-xl border bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="font-bold text-sm">
              Laboratoriya <span className="text-primary">{grades.laboratoriya.length} / 8</span>
              <span className="text-muted-foreground font-normal ml-1">
                {!components.hasSeminar && !components.hasKollokvium ? '(Max 30)' : '(Max 15)'}
              </span>
            </Label>
            <Button variant="ghost" size="sm" onClick={() => setGrades(prev => ({ ...prev, laboratoriya: [] }))}
              className="gap-1 text-muted-foreground hover:bg-muted text-xs">
              <RotateCcw className="h-3 w-3" /> Sıfırla
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[1,2,3,4,5,6,7,8].map(n => (
              <button key={n} onClick={() => smartToggleLab(n)}
                className={cn("h-10 w-10 rounded-full font-bold text-sm border-2 transition-all",
                  grades.laboratoriya.includes(n)
                    ? "bg-primary border-primary text-white shadow-md scale-110"
                    : "bg-background border-border text-foreground hover:border-primary/50")}>
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button className="w-full h-14 text-base font-bold gap-2" onClick={calculate}>
        <Calculator className="h-5 w-5 shrink-0" /> Hesabla
      </Button>

      {result !== null && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
          <div className={cn("p-6 rounded-2xl text-center border-2 space-y-2",
            result >= 28 ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10")}>
            <p className="text-sm text-muted-foreground font-medium">Cari Giriş Balınız</p>
            <p className={cn("text-5xl font-bold", result >= 28 ? "text-green-500" : "text-red-500")}>{result}</p>
            <p className="text-xs text-muted-foreground">Maksimum: 50 bal</p>
            <div className={cn("inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold",
              result >= 28 ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600")}>
              {result >= 28 ? '✓ İmtahana buraxılırsınız' : '⚠ Kafi deyil!'}
            </div>
          </div>
          {onSave && (
            <Button variant="outline"
              className={cn("w-full h-12 gap-2 font-bold border-2 transition-all",
                saved ? "border-green-500/40 text-green-500 bg-green-500/10" : "border-primary/30 text-primary hover:bg-primary/5")}
              onClick={handleSave} disabled={saved}>
              <Save className="h-5 w-5 shrink-0" />
              {saved ? 'Yadda Saxlanıldı ✓' : 'Kabinetdə Yadda Saxla'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Komponent seçici
function ComponentSelector({ subject, onSubjectChange, onConfirm }: {
  subject: string;
  onSubjectChange: (s: string) => void;
  onConfirm: (c: Components) => void;
}) {
  const [hasKollokvium, setHasKollokvium] = useState(false);
  const [hasSeminar, setHasSeminar] = useState(false);
  const [hasLab, setHasLab] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="h-6 w-6 text-primary shrink-0" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Giriş Balı Hesablayıcı</h2>
          <p className="text-sm text-muted-foreground">Qiymətlərinizi daxil edin</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-bold">Fənn Seçin</Label>
        <select value={subject} onChange={e => onSubjectChange(e.target.value)}
          className="w-full h-11 px-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="" disabled>Dərsi seçin</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="p-5 rounded-2xl border bg-muted/20 space-y-4">
        <p className="font-bold text-foreground">Bu fənnin hansı komponentləri var?</p>
        <div className="space-y-3">
          {[
            { label: 'Kollokvium', value: hasKollokvium, set: setHasKollokvium },
            { label: 'Seminar', value: hasSeminar, set: setHasSeminar },
            { label: 'Laboratoriya', value: hasLab, set: setHasLab },
          ].map(({ label, value, set }) => (
            <button key={label} type="button" onClick={() => set(!value)}
              className={cn("w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all font-medium",
                value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:border-primary/40")}>
              <span>{label}</span>
              <span className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center text-xs",
                value ? "border-primary bg-primary text-white" : "border-muted-foreground")}>
                {value ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>
        <Button className="w-full h-11" disabled={!hasKollokvium && !hasSeminar && !hasLab}
          onClick={() => onConfirm({ hasKollokvium, hasSeminar, hasLab })}>
          Davam et →
        </Button>
      </div>
    </div>
  );
}

export default GradeCalculator;