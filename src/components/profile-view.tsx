'use client';

import React, { useState, useEffect } from 'react';
import { User, Camera, FileText, BookOpen, Pencil, ChevronDown, ChevronUp, Upload, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfile } from '@/lib/types';
import { supabase } from '@/lib/supabase';

const SUBJECTS = [
  'Əməliyyat sistemləri',
  'Kompüter Şəbəkələri',
  'Verilənlər bazası sistemləri',
  'Obyektyönlü proqramlaşdırma',
  'Diskret riyaziyyat',
];

// Qayib limitlari: [1bal_cixilir, 2bal_cixilir, kesir]
const ABSENCE_LIMITS: Record<string, [number, number, number]> = {
  'Kompüter Şəbəkələri': [5, 8, 11],
  'Əməliyyat sistemləri': [3, 6, 8],
  'Verilənlər bazası sistemləri': [4, 8, 10],
  'Diskret riyaziyyat': [3, 5, 6],
  'Obyektyönlü proqramlaşdırma': [3, 6, 8],
};

type Material = {
  name: string;
  url: string;
  path: string;
  type: string;
  uploadedAt: string;
};

type ActivePanel = 'none' | 'notes' | 'materials';

export function ProfileView({ profile, onUpdate, onEditGrade }: {
  profile: UserProfile;
  onUpdate: (p: UserProfile) => void;
  onEditGrade: (s: string) => void;
}) {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [materialsBySubject, setMaterialsBySubject] = useState<Record<string, Material[]>>({});

  // Qayib saylari - profile-dan oxu
  const getAbsences = (subject: string): number => {
    return (profile as any).absences?.[subject] || 0;
  };

  const setAbsences = (subject: string, count: number) => {
    const absences = { ...((profile as any).absences || {}), [subject]: Math.max(0, count) };
    onUpdate({ ...profile, absences } as any);
  };

  const getAbsenceStatus = (subject: string) => {
    const count = getAbsences(subject);
    const limits = ABSENCE_LIMITS[subject];
    if (!limits) return { label: 'Normal', color: 'text-green-500', bg: 'bg-green-500/10', penalty: 0 };
    const [l1, l2, l3] = limits;
    if (count >= l3) return { label: 'Kəsir!', color: 'text-red-600', bg: 'bg-red-500/20', penalty: -1 };
    if (count >= l2) return { label: '-2 bal', color: 'text-orange-500', bg: 'bg-orange-500/10', penalty: 2 };
    if (count >= l1) return { label: '-1 bal', color: 'text-yellow-500', bg: 'bg-yellow-500/10', penalty: 1 };
    return { label: 'Normal', color: 'text-green-500', bg: 'bg-green-500/10', penalty: 0 };
  };

  useEffect(() => {
    const saved = localStorage.getItem('it24_notes');
    if (saved) setNotes(saved);
  }, []);

  useEffect(() => {
    if (activePanel === 'materials') loadMaterials();
  }, [activePanel]);

  const loadMaterials = async () => {
  setLoadingMaterials(true);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const userId = session.user.id;
    const { data, error } = await supabase.storage
      .from('materials')
      .list(`${userId}/`, { sortBy: { column: 'created_at', order: 'desc' } });
    if (error || !data) { setMaterials([]); setMaterialsBySubject({}); return; }

    const allMats: Material[] = data
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => ({
        name: f.name,
        url: supabase.storage.from('materials').getPublicUrl(`${userId}/${f.name}`).data.publicUrl,
        path: `${userId}/${f.name}`,
        type: f.metadata?.mimetype || 'file',
        uploadedAt: f.created_at || '',
      }));

    setMaterials(allMats);

    // Fənnə görə qruplaşdır
    const grouped: Record<string, Material[]> = {};
    SUBJECTS.forEach(s => { grouped[s] = []; });
    grouped['Digər'] = [];

    allMats.forEach(m => {
      const cleanName = m.name.replace(/^\d+_/, '');
      const subject = SUBJECTS.find(s => m.name.includes(encodeSubject(s)));
      if (subject) {
        grouped[subject].push({ ...m, name: cleanName });
      } else {
        grouped['Digər'].push({ ...m, name: cleanName });
      }
    });

    setMaterialsBySubject(grouped);
  } catch (e) { setMaterials([]); }
  setLoadingMaterials(false);
};

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !selectedSubject) return;
  setUploading(true);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const userId = session.user.id;
    const subjectPrefix = encodeSubject(selectedSubject);
    const fileName = `${subjectPrefix}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('materials').upload(`${userId}/${fileName}`, file);
    if (!error) await loadMaterials();
  } catch (e) {}
  setUploading(false);
  e.target.value = '';
};

  const handleDelete = async (path: string) => {
    const { error } = await supabase.storage.from('materials').remove([path]);
    if (!error) setMaterials(prev => prev.filter(m => m.path !== path));
  };

  const saveNotes = (val: string) => {
    setNotes(val);
    localStorage.setItem('it24_notes', val);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const { data: { session } } = await supabase.auth.getSession();
  console.log('Session:', session?.user?.id);
  if (!session) return;

  const filePath = `avatars/${session.user.id}`;
const { error } = await supabase.storage
  .from('avatars')
  .upload(filePath, file, { upsert: true });

if (error) return;

const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(filePath);

// Cache-i keç üçün timestamp əlavə et
const photoUrl = `${data.publicUrl}?t=${Date.now()}`;
onUpdate({ ...profile, photo: photoUrl, photo_url: photoUrl } as any);
  };

  const getGrade = (subject: string) => profile.savedGrades?.[subject];
  const getDetails = (subject: string) => profile.savedDetails?.[subject];

  const gradeColor = (grade?: number) => {
    if (grade === undefined) return 'text-muted-foreground';
    if (grade >= 28) return 'text-green-500';
    return 'text-red-500';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    return '📎';
  };
  const encodeSubject = (subject: string) => {
  return subject.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
};
  const togglePanel = (panel: ActivePanel) => setActivePanel(prev => prev === panel ? 'none' : panel);

  return (
    <div className="space-y-6">
      {/* Profil karti */}
      <div className="relative rounded-2xl border overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/80 to-primary/40" />
        <div className="px-6 pb-6">
          <div className="relative -mt-12 mb-4 w-fit">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={(profile as any).photo_url || profile.photo} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer border-2 border-background hover:bg-primary/90 transition-colors">
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
            <p className="text-xs font-bold text-primary uppercase tracking-widest">
              {profile.subgroup === 'ust' ? 'Yuxari' : 'Asagi'} Altqrup
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button onClick={() => togglePanel('notes')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors text-sm font-medium ${activePanel === 'notes' ? 'bg-primary text-white border-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}>
              <FileText className="h-4 w-4 shrink-0" /> Qeydler
            </button>
            <button onClick={() => togglePanel('materials')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors text-sm font-medium ${activePanel === 'materials' ? 'bg-primary text-white border-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}>
              <BookOpen className="h-4 w-4 shrink-0" /> Materiallar ({materials.length})
            </button>
          </div>

          {activePanel === 'notes' && (
            <div className="mt-4 space-y-2 animate-in slide-in-from-top-2">
              <textarea value={notes} onChange={e => saveNotes(e.target.value)}
                placeholder="Qeydlerinizi buraya yazin..."
                className="w-full h-40 p-3 rounded-xl border bg-muted/30 text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
              <p className="text-xs text-muted-foreground text-right">Avtomatik yadda saxlanilir</p>
            </div>
          )}

          {activePanel === 'materials' && (
  <div className="mt-4 space-y-3 animate-in slide-in-from-top-2">
    
    {/* Fənn seçimi dropdown */}
    <div className="space-y-2">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fənn seçin:</p>
      <select
        value={selectedSubject}
        onChange={e => setSelectedSubject(e.target.value)}
        className="w-full p-2.5 rounded-xl border bg-muted/30 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
        <option value="">-- Fənn seçin --</option>
        {SUBJECTS.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>

    {/* Fayl yüklə */}
    <label className={`flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed transition-colors
      ${!selectedSubject ? 'opacity-40 pointer-events-none border-muted' : 'border-primary/40 hover:border-primary hover:bg-primary/5 cursor-pointer'}
      ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
      <Upload className="h-4 w-4 text-primary shrink-0" />
      <span className="text-sm font-medium text-primary">
        {uploading ? 'Yüklənilir...' : selectedSubject ? `${selectedSubject} üçün fayl əlavə et` : 'Əvvəlcə fənn seçin'}
      </span>
      <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*" className="hidden"
        onChange={handleUpload} disabled={uploading || !selectedSubject} />
    </label>

    {/* Materiallar fənnə görə */}
    {loadingMaterials ? (
      <p className="text-center text-sm text-muted-foreground py-4">Yüklənilir...</p>
    ) : (
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {SUBJECTS.map(subject => {
          const subMats = materialsBySubject[subject] || [];
          if (subMats.length === 0) return null;
          return (
            <div key={subject} className="space-y-1">
              <p className="text-xs font-bold text-primary uppercase tracking-wider px-1">{subject}</p>
              {subMats.map(m => (
                <div key={m.path} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <span className="text-xl shrink-0">{getFileIcon(m.type)}</span>
                  <a href={m.url} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-sm font-medium text-foreground hover:text-primary truncate">
                    {m.name}
                  </a>
                  <button onClick={() => handleDelete(m.path)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
        {Object.values(materialsBySubject).every(arr => arr.length === 0) && (
          <p className="text-center text-sm text-muted-foreground py-4">Hələ material yoxdur</p>
        )}
      </div>
    )}
  </div>
)}
        </div>
      </div>

      {/* Giris Ballari */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg flex items-center gap-2">🎓 Giriş Ballarım:</h3>
        <div className="space-y-2">
          {SUBJECTS.map(subject => {
            const grade = getGrade(subject);
            const details = getDetails(subject);
            const isExpanded = expandedSubject === subject;
            const absenceCount = getAbsences(subject);
            const absenceStatus = getAbsenceStatus(subject);
            const limits = ABSENCE_LIMITS[subject];

            return (
              <div key={subject} className="border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-medium text-sm">{subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${gradeColor(grade)}`}>
                      {grade !== undefined ? grade : '-'}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => onEditGrade(subject)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
                      onClick={() => setExpandedSubject(isExpanded ? null : subject)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t bg-muted/20 space-y-4 text-sm">
                    
                    {/* Bal detallari */}
                    {details && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Davamiyyet:</span>
                          <span className="font-medium">{details.davamiyyat || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Serbest is:</span>
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
                          <span className="text-primary">Cemi:</span>
                          <span className={gradeColor(details.total)}>{details.total}</span>
                        </div>
                      </div>
                    )}

                    {/* Qayib bolmesi */}
                    <div className="mt-3 p-3 rounded-xl border bg-background space-y-3">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Qayıblar</p>
                      
                      {/* Sayac */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setAbsences(subject, absenceCount - 1)}
                            className="h-8 w-8 rounded-full border-2 border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-2xl font-bold w-8 text-center">{absenceCount}</span>
                          <button onClick={() => setAbsences(subject, absenceCount + 1)}
                            className="h-8 w-8 rounded-full border-2 border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${absenceStatus.bg} ${absenceStatus.color}`}>
                          {absenceStatus.label === 'Kəsir!' ? '✗ Kəsir!' : absenceStatus.label === 'Normal' ? '✓ Normal' : `⚠ ${absenceStatus.label}`}
                        </div>
                      </div>

                      {/* Limit gosterimi */}
                      {limits && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">-1 bal:</span>
                            <span className={`font-medium ${absenceCount >= limits[0] ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                              {limits[0]}+ qayıb {absenceCount >= limits[0] ? '✓' : ''}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">-2 bal:</span>
                            <span className={`font-medium ${absenceCount >= limits[1] ? 'text-orange-500' : 'text-muted-foreground'}`}>
                              {limits[1]}+ qayıb {absenceCount >= limits[1] ? '✓' : ''}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Kəsir:</span>
                            <span className={`font-medium ${absenceCount >= limits[2] ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>
                              {limits[2]}+ qayıb {absenceCount >= limits[2] ? '✗' : ''}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${
                              absenceCount >= limits[2] ? 'bg-red-500' :
                              absenceCount >= limits[1] ? 'bg-orange-400' :
                              absenceCount >= limits[0] ? 'bg-yellow-400' : 'bg-green-400'
                            }`} style={{ width: `${Math.min(100, (absenceCount / limits[2]) * 100)}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground text-right">
                            {Math.max(0, limits[2] - absenceCount)} qayıb qalıb (kəsirə)
                          </p>
                        </div>
                      )}
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