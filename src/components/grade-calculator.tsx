'use client';

import React, { useState } from 'react';
import { Calculator, RotateCcw, Plus, Trash2 } from 'lucide-react';
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

type GradeState = {
  davamiyyat: string;
  serbest: string;
  kollokvium: [string, string, string];
  seminar: string[];
  laboratoriya: number[];
};

const defaultState = (): GradeState => ({
  davamiyyat: '',
  serbest: '',
  kollokvium: ['', '', ''],
  seminar: [],
  laboratoriya: [],
});

export function GradeCalculator() {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [grades, setGrades] = useState<GradeState>(defaultState());
  const [result, setResult] = useState<number | null>(null);

  const reset = () => {
    setGrades(defaultState());
    setResult(null);
  };

  const handleSubjectChange = (s: string) => {
    setSubject(s);
    setGrades(defaultState());
    setResult(null);
  };

  const toggleLab = (n: number) => {
    setGrades(prev => ({
      ...prev,
      laboratoriya: prev.laboratoriya.includes(n)
        ? prev.laboratoriya.filter(x => x !== n)
        : [...prev.laboratoriya, n],
    }));
  };

  const addSeminar = () => {
    setGrades(prev => ({ ...prev, seminar: [...prev.seminar, ''] }));
  };

  const removeSeminar = (i: number) => {
    setGrades(prev => ({ ...prev, seminar: prev.seminar.filter((_, idx) => idx !== i) }));
  };

  const updateSeminar = (i: number, val: string) => {
    setGrades(prev => {
      const s = [...prev.seminar];
      s[i] = val;
      return { ...prev, seminar: s };
    });
  };

  const calculate = () => {
    const davamiyyat = Math.min(10, parseFloat(grades.davamiyyat) || 0);
    const serbest = Math.min(10, parseFloat(grades.serbest) || 0);
    
    const kollokviumVals = grades.kollokvium.map(k => Math.min(10, parseFloat(k) || 0));
    const kollokviumOrta = kollokviumVals.reduce((a, b) => a + b, 0) / 3;
    
    const seminarVals = grades.seminar.map(s => Math.min(10, parseFloat(s) || 0));
    const seminarOrta = seminarVals.length > 0
      ? seminarVals.reduce((a, b) => a + b, 0) / seminarVals.length
      : 0;
    
    const labCount = grades.laboratoriya.length;
    const labBal = Math.min(15, (labCount / 8) * 15);

    const total = davamiyyat + serbest + kollokviumOrta + seminarOrta + labBal;
    setResult(Math.round(total * 10) / 10);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="h-6 w-6 text-primary shrink-0" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Giriş Balı Hesablayıcı</h2>
          <p className="text-sm text-muted-foreground">Qiymətlərinizi daxil edin</p>
        </div>
      </div>

      {/* Fənn seçimi */}
      <div className="space-y-2">
        <Label className="font-bold">Fənn Seçin</Label>
        <select
          value={subject}
          onChange={e => handleSubjectChange(e.target.value)}
          className="w-full h-11 px-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {SUBJECTS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Davamiyyət və Sərbəst iş */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-bold text-sm">Davamiyyət <span className="text-muted-foreground font-normal">(Max 10)</span></Label>
          <Input
            type="number"
            min={0} max={10}
            placeholder="Məs: 10"
            value={grades.davamiyyat}
            onChange={e => setGrades(prev => ({ ...prev, davamiyyat: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label className="font-bold text-sm">Sərbəst İş <span className="text-muted-foreground font-normal">(Max 10)</span></Label>
          <Input
            type="number"
            min={0} max={10}
            placeholder="Məs: 10"
            value={grades.serbest}
            onChange={e => setGrades(prev => ({ ...prev, serbest: e.target.value }))}
          />
        </div>
      </div>

      {/* Kollokvium */}
      <div className="space-y-2">
        <Label className="font-bold text-sm">Kollokvium Qiymətləri <span className="text-muted-foreground font-normal">(Max 10)</span></Label>
        <div className="grid grid-cols-3 gap-3">
          {grades.kollokvium.map((k, i) => (
            <Input
              key={i}
              type="number"
              min={0} max={10}
              placeholder="Məs: 10"
              value={k}
              onChange={e => {
                const kol = [...grades.kollokvium] as [string, string, string];
                kol[i] = e.target.value;
                setGrades(prev => ({ ...prev, kollokvium: kol }));
              }}
            />
          ))}
        </div>
      </div>

      {/* Seminar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-bold text-sm">Seminar Qiymətləri <span className="text-muted-foreground font-normal">(Max 10)</span></Label>
          <Button variant="ghost" size="sm" onClick={addSeminar} className="gap-1 text-primary hover:bg-primary/10">
            <Plus className="h-4 w-4" /> Əlavə et
          </Button>
        </div>
        {grades.seminar.length === 0 && (
          <p className="text-sm text-muted-foreground italic">Seminar qiyməti əlavə edin</p>
        )}
        <div className="space-y-2">
          {grades.seminar.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input
                type="number"
                min={0} max={10}
                placeholder={`Seminar ${i + 1}`}
                value={s}
                onChange={e => updateSeminar(i, e.target.value)}
              />
              <Button variant="ghost" size="icon" onClick={() => removeSeminar(i)} className="text-destructive hover:bg-destructive/10 shrink-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Laboratoriya */}
      <div className="space-y-3 p-4 rounded-xl border bg-muted/30">
        <div className="flex items-center justify-between">
          <Label className="font-bold text-sm">
            Laboratoriya <span className="text-primary">{grades.laboratoriya.length} / 8</span>
          </Label>
          <Button variant="ghost" size="sm" onClick={() => setGrades(prev => ({ ...prev, laboratoriya: [] }))} className="gap-1 text-muted-foreground hover:bg-muted text-xs">
            <RotateCcw className="h-3 w-3" /> Sıfırla
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <button
              key={n}
              onClick={() => toggleLab(n)}
              className={cn(
                "h-10 w-10 rounded-full font-bold text-sm border-2 transition-all",
                grades.laboratoriya.includes(n)
                  ? "bg-primary border-primary text-white shadow-md scale-110"
                  : "bg-background border-border text-foreground hover:border-primary/50"
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Maksimum laboratoriya balı: <span className="font-bold">15</span></p>
      </div>

      {/* Hesabla */}
      <Button className="w-full h-14 text-base font-bold gap-2" onClick={calculate}>
        <Calculator className="h-5 w-5 shrink-0" /> Hesabla
      </Button>

      {/* Nəticə */}
      {result !== null && (
        <div className={cn(
          "p-6 rounded-2xl text-center border-2 space-y-1 animate-in fade-in slide-in-from-bottom-4",
          result >= 56 ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"
        )}>
          <p className="text-sm text-muted-foreground font-medium">Cari Giriş Balınız</p>
          <p className={cn("text-5xl font-bold", result >= 56 ? "text-green-500" : "text-red-500")}>
            {result}
          </p>
          <p className="text-sm font-medium mt-2">
            {result >= 56 ? '✅ İmtahana buraxılırsınız!' : '❌ İmtahana buraxılmırsınız'}
          </p>
          <p className="text-xs text-muted-foreground">Keçid balı: 56</p>
        </div>
      )}
    </div>
  );
}

export default GradeCalculator;