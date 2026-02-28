'use client';

import React, { useState, useEffect } from 'react';
import { User, Camera, FileText, BookOpen, Pencil, ChevronDown, ChevronUp, Upload, Trash2, FileIcon, X, Plus } from 'lucide-react';
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

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('it24_notes');
    if (saved) setNotes(saved);
  }, []);

  // Load materials from Supabase
  useEffect(() => {
    if (activePanel === 'materials') {
      loadMaterials();
    }
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

      if (error || !data) {
        setMaterials([]);
        return;
      }

      const mats: Material[] = data
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => ({
          name: f.name,
          url: supabase.storage.from('materials').getPublicUrl(`${userId}/${f.name}`).data.publicUrl,
          path: `${userId}/${f.name}`,
          type: f.metadata?.mimetype || 'file',
          uploadedAt: f.created_at || '',
        }));

      setMaterials(mats);
    } catch (e) {
      setMaterials([]);
    }
    setLoadingMaterials(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;
      const fileName = `${Date.now()}_${file.name}`;
      const path = `${userId}/${fileName}`;

      const { error } = await supabase.storage
        .from('materials')
        .upload(path, file);

      if (!error) {
        await loadMaterials();
      }
    } catch (e) {}
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (path: string) => {
    const { error } = await supabase.storage.from('materials').remove([path]);
    if (!error) {
      setMaterials(prev => prev.filter(m => m.path !== path));
    }
  };

  const saveNotes = (val: string) => {
    setNotes(val);
    localStorage.setItem('it24_notes', val);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdate({ ...profile, photo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const getGrade = (subject: string) => profile.savedGrades?.[subject];
  const getDetails = (subject: string) => profile.savedDetails?.[subject];

  const gradeColor = (grade?: number) => {
    if (grade === undefined) return 'text-muted-foreground';
    if (grade >= 56) return 'text-green-500';
    return 'text-red-500';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    return '📎';
  };

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel(prev => prev === panel ? 'none' : panel);
  };

  return (
    <div className="space-y-6">
      {/* Profil kartı */}
      <div className="relative rounded-2xl border overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/80 to-primary/40" />
        <div className="px-6 pb-6">
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

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
            <p className="text-xs font-bold text-primary uppercase tracking-widest">
              {profile.subgroup === 'ust' ? 'Yuxarı' : 'Aşağı'} Altqrup
            </p>
          </div>

          {/* Qeydlər və Materiallar düymələri */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => togglePanel('notes')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors text-sm font-medium ${activePanel === 'notes' ? 'bg-primary text-white border-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
            >
              <FileText className="h-4 w-4 shrink-0" /> Qeydlər
            </button>
            <button
              onClick={() => togglePanel('materials')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors text-sm font-medium ${activePanel === 'materials' ? 'bg-primary text-white border-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
            >
              <BookOpen className="h-4 w-4 shrink-0" /> Materiallar ({materials.length})
            </button>
          </div>

          {/* Qeydlər paneli */}
          {activePanel === 'notes' && (
            <div className="mt-4 space-y-2 animate-in slide-in-from-top-2">
              <textarea
                value={notes}
                onChange={e => saveNotes(e.target.value)}
                placeholder="Qeydlərinizi buraya yazın..."
                className="w-full h-40 p-3 rounded-xl border bg-muted/30 text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground text-right">Avtomatik yadda saxlanılır</p>
            </div>
          )}

          {/* Materiallar paneli */}
          {activePanel === 'materials' && (
            <div className="mt-4 space-y-3 animate-in slide-in-from-top-2">
              {/* Yüklə düyməsi */}
              <label className={`flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-primary">
                  {uploading ? 'Yüklənir...' : 'Fayl əlavə et (PDF, şəkil, sənəd)'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>

              {/* Material siyahısı */}
              {loadingMaterials ? (
                <p className="text-center text-sm text-muted-foreground py-4">Yüklənir...</p>
              ) : materials.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">Hələ material yoxdur</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {materials.map(m => (
                    <div key={m.path} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <span className="text-xl shrink-0">{getFileIcon(m.type)}</span>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm font-medium text-foreground hover:text-primary truncate"
                      >
                        {m.name.replace(/^\d+_/, '')}
                      </a>
                      <button
                        onClick={() => handleDelete(m.path)}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Giriş Balları */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg flex items-center gap-2">🎓 Giriş Ballarım:</h3>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onEditGrade(subject)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {details && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setExpandedSubject(isExpanded ? null : subject)}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>

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