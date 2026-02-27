'use client';

import React, { useState } from 'react';
import { User, Camera, FileText, BookOpen, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfile } from '@/lib/types';

const SUBJECTS = [
  'Əməliyyat sistemləri',
  'Kompüter Şəbəkələri',
  'Verilənlər bazası sistemləri',
  'Obyektyönlü proqramlaşdırma',
  'Diskret riyaziyyat',
];

export function ProfileView({ profile, onUpdate, onEditGrade }: {
  profile: UserProfile;
  onUpdate: (p: UserProfile) => void;
  onEditGrade: (s: string) => void;
}) {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdate({ ...profile, photo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const getGrade = (subject: string) => {
    return profile.savedGrades?.[subject];
  };

  const getDetails = (subject: string) => {
    return profile.savedDetails?.[subject];
  };

  const gradeColor = (grade?: number) => {
    if (grade === undefined) return 'text-muted-foreground';
    if (grade >= 56) return 'text-green-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Profil kartı */}
      <div className="relative rounded-2xl border overflow-hidden">
        {/* Arxa fon gradient */}
        <div className="h-24 bg-gradient-to-r from-primary/80 to-primary/40" />
        
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-12 mb-4 w-fit">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile.photo} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer border-2 border-background hover:bg-primary/90 transition-colors">
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>

          {/* Ad və qrup */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
            <p className="text-xs font-bold text-primary uppercase tracking-widest">
              {profile.subgroup === 'ust' ? 'Yuxarı' : 'Aşağı'} Altqrup
            </p>
          </div>

          {/* Qeydlər və Materiallar */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button className="flex items-center justify-center gap-2 p-3 rounded-xl border hover:bg-muted/50 transition-colors text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4 shrink-0" /> Qeydlər (0)
            </button>
            <button className="flex items-center justify-center gap-2 p-3 rounded-xl border hover:bg-muted/50 transition-colors text-sm font-medium text-muted-foreground">
              <BookOpen className="h-4 w-4 shrink-0" /> Materiallar (0)
            </button>
          </div>
        </div>
      </div>

      {/* Giriş Balları */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg flex items-center gap-2">
          🎓 Giriş Ballarım:
        </h3>
        <div className="space-y-2">
          {SUBJECTS.map(subject => {
            const grade = getGrade(subject);
            const details = getDetails(subject);
            const isExpanded = expandedSubject === subject;

            return (
              <div key={subject} className="border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-medium text-sm">{subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${gradeColor(grade)}`}>
                      {grade !== undefined ? grade : 'Bal yoxdur'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => onEditGrade(subject)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {details && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => setExpandedSubject(isExpanded ? null : subject)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Genişlənmiş detallar */}
                {isExpanded && details && (
                  <div className="px-4 pb-4 pt-0 border-t bg-muted/20 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Davamiyyət:</span>
                        <span className="font-medium">{details.davamiyyat || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sərbəst iş:</span>
                        <span className="font-medium">{details.serbest || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kollokvium:</span>
                        <span className="font-medium">{details.kollokviumOrta?.toFixed(1) || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Seminar:</span>
                        <span className="font-medium">{details.seminarOrta?.toFixed(1) || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Laboratoriya:</span>
                        <span className="font-medium">{details.labBal?.toFixed(1) || 0}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-primary">Cəmi:</span>
                        <span className={gradeColor(details.total)}>{details.total}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProfileView;