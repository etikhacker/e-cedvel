'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ChevronDown, ChevronUp, University, Users, BookOpen, LogOut } from 'lucide-react';

type University = { id: string; name: string; short_name: string; city: string };
type Faculty = { id: string; name: string; university_id: string };
type Group = { id: string; name: string; faculty_id: string; university_id: string };
type Lesson = { id: string; subject: string; teacher: string; room: string; day: string; time: string; week: string; subgroup: string; group_id: string };

const DAYS = ['Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];
const TIMES = ['08:00-09:20', '09:30-10:50', '11:00-12:20', '12:30-13:50', '14:00-15:20', '15:30-16:50', '17:00-18:20'];
const WEEKS = ['hamisi', 'ust', 'alt'];
const SUBGROUPS = ['hamisi', 'ust', 'alt'];

export default function AdminPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [selectedUni, setSelectedUni] = useState<string>('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [expandedSection, setExpandedSection] = useState<string>('universities');

  // Yeni əlavə formaları
  const [newUni, setNewUni] = useState({ name: '', short_name: '', city: '' });
  const [newFaculty, setNewFaculty] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [newLesson, setNewLesson] = useState({
    subject: '', teacher: '', room: '',
    day: DAYS[0], time: TIMES[0], week: 'hamisi', subgroup: 'hamisi'
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('Admin session:', session?.user?.email, error);
  if (!session) { window.location.replace('/login'); return; }

    const { data } = await supabase
      .from('university_admins')
      .select('role, university_id')
      .eq('id', session.user.id)
      .single();

    if (!data) { window.location.replace('/'); return; }

    setIsSuperadmin(data.role === 'superadmin');
    await loadData(data.role === 'superadmin' ? null : data.university_id);
    setLoading(false);
  };

  const loadData = async (uniId: string | null) => {
    const uniQuery = supabase.from('universities').select('*');
    const { data: unis } = uniId ? await uniQuery.eq('id', uniId) : await uniQuery;
    setUniversities(unis || []);

    const { data: facs } = await supabase.from('faculties').select('*');
    setFaculties(facs || []);

    const { data: grps } = await supabase.from('groups').select('*');
    setGroups(grps || []);
  };

  const loadLessons = async (groupId: string) => {
    const { data } = await supabase.from('schedule_lessons').select('*').eq('group_id', groupId);
    setLessons(data || []);
  };

  const addUniversity = async () => {
    if (!newUni.name) return;
    const { error } = await supabase.from('universities').insert(newUni);
    if (error) { toast({ variant: 'destructive', title: 'Xəta', description: error.message }); return; }
    toast({ title: 'Uğurlu', description: 'Universitet əlavə edildi' });
    setNewUni({ name: '', short_name: '', city: '' });
    await loadData(null);
  };

  const addFaculty = async () => {
    if (!newFaculty || !selectedUni) return;
    const { error } = await supabase.from('faculties').insert({ name: newFaculty, university_id: selectedUni });
    if (error) { toast({ variant: 'destructive', title: 'Xəta', description: error.message }); return; }
    toast({ title: 'Uğurlu', description: 'Fakültə əlavə edildi' });
    setNewFaculty('');
    await loadData(null);
  };

  const addGroup = async () => {
    if (!newGroup || !selectedFaculty || !selectedUni) return;
    const { error } = await supabase.from('groups').insert({ name: newGroup, faculty_id: selectedFaculty, university_id: selectedUni });
    if (error) { toast({ variant: 'destructive', title: 'Xəta', description: error.message }); return; }
    toast({ title: 'Uğurlu', description: 'Qrup əlavə edildi' });
    setNewGroup('');
    await loadData(null);
  };

  const addLesson = async () => {
    if (!newLesson.subject || !selectedGroup) return;
    const { error } = await supabase.from('schedule_lessons').insert({ ...newLesson, group_id: selectedGroup });
    if (error) { toast({ variant: 'destructive', title: 'Xəta', description: error.message }); return; }
    toast({ title: 'Uğurlu', description: 'Dərs əlavə edildi' });
    setNewLesson({ subject: '', teacher: '', room: '', day: DAYS[0], time: TIMES[0], week: 'hamisi', subgroup: 'hamisi' });
    await loadLessons(selectedGroup);
  };

  const deleteLesson = async (id: string) => {
    await supabase.from('schedule_lessons').delete().eq('id', id);
    setLessons(prev => prev.filter(l => l.id !== id));
  };

  const deleteGroup = async (id: string) => {
    await supabase.from('groups').delete().eq('id', id);
    setGroups(prev => prev.filter(g => g.id !== id));
    if (selectedGroup === id) { setSelectedGroup(''); setLessons([]); }
  };

  const Section = ({ id, title, icon: Icon, children }: any) => (
    <div className="border rounded-xl overflow-hidden">
      <button onClick={() => setExpandedSection(expandedSection === id ? '' : id)}
        className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-2 font-bold">
          <Icon className="h-5 w-5 text-primary" /> {title}
        </div>
        {expandedSection === id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expandedSection === id && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p>Yüklənir...</p></div>;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">QrupTap Admin</h1>
            <p className="text-sm text-muted-foreground">{isSuperadmin ? 'Superadmin' : 'Universitet Admin'}</p>
          </div>
          <Button variant="outline" className="gap-2 text-destructive border-destructive/20"
            onClick={() => supabase.auth.signOut().then(() => window.location.replace('/login'))}>
            <LogOut className="h-4 w-4" /> Çıx
          </Button>
        </header>

        {/* Universitetlər */}
        {isSuperadmin && (
          <Section id="universities" title="Universitetlər" icon={University}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input placeholder="Universitet adı" value={newUni.name} onChange={e => setNewUni(p => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Qısa ad (MDU)" value={newUni.short_name} onChange={e => setNewUni(p => ({ ...p, short_name: e.target.value }))} />
              <Input placeholder="Şəhər" value={newUni.city} onChange={e => setNewUni(p => ({ ...p, city: e.target.value }))} />
            </div>
            <Button onClick={addUniversity} className="gap-2"><Plus className="h-4 w-4" /> Əlavə et</Button>
            <div className="space-y-2 mt-2">
              {universities.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/10">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.short_name} — {u.city}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Fakültələr */}
        <Section id="faculties" title="Fakültələr" icon={Users}>
          <select value={selectedUni} onChange={e => setSelectedUni(e.target.value)}
            className="w-full p-2.5 rounded-xl border bg-background text-foreground text-sm">
            <option value="">-- Universitet seçin --</option>
            {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <div className="flex gap-2">
            <Input placeholder="Fakültə adı" value={newFaculty} onChange={e => setNewFaculty(e.target.value)} />
            <Button onClick={addFaculty} className="gap-2 shrink-0"><Plus className="h-4 w-4" /> Əlavə et</Button>
          </div>
          <div className="space-y-2">
            {faculties.filter(f => f.university_id === selectedUni).map(f => (
              <div key={f.id} className="p-3 rounded-xl border bg-muted/10">
                <p className="font-medium">{f.name}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Qruplar */}
        <Section id="groups" title="Qruplar" icon={Users}>
          <div className="grid grid-cols-2 gap-2">
            <select value={selectedUni} onChange={e => { setSelectedUni(e.target.value); setSelectedFaculty(''); }}
              className="p-2.5 rounded-xl border bg-background text-foreground text-sm">
              <option value="">-- Universitet --</option>
              {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)}
              className="p-2.5 rounded-xl border bg-background text-foreground text-sm">
              <option value="">-- Fakültə --</option>
              {faculties.filter(f => f.university_id === selectedUni).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Qrup adı (IT24.1)" value={newGroup} onChange={e => setNewGroup(e.target.value)} />
            <Button onClick={addGroup} className="gap-2 shrink-0"><Plus className="h-4 w-4" /> Əlavə et</Button>
          </div>
          <div className="space-y-2">
            {groups.filter(g => g.faculty_id === selectedFaculty).map(g => (
              <div key={g.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/10">
                <p className="font-medium">{g.name}</p>
                <button onClick={() => deleteGroup(g.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Cədvəl */}
        <Section id="schedule" title="Cədvəl Dərsləri" icon={BookOpen}>
          <select value={selectedUni} onChange={e => { setSelectedUni(e.target.value); setSelectedGroup(''); setLessons([]); }}
            className="w-full p-2.5 rounded-xl border bg-background text-foreground text-sm">
            <option value="">-- Universitet --</option>
            {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={selectedGroup} onChange={e => { setSelectedGroup(e.target.value); loadLessons(e.target.value); }}
            className="w-full p-2.5 rounded-xl border bg-background text-foreground text-sm">
            <option value="">-- Qrup seçin --</option>
            {groups.filter(g => g.university_id === selectedUni).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          {selectedGroup && (
            <div className="space-y-3 border rounded-xl p-4 bg-muted/10">
              <p className="font-bold text-sm text-primary">Yeni Dərs Əlavə Et</p>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Fənn" value={newLesson.subject} onChange={e => setNewLesson(p => ({ ...p, subject: e.target.value }))} />
                <Input placeholder="Müəllim" value={newLesson.teacher} onChange={e => setNewLesson(p => ({ ...p, teacher: e.target.value }))} />
                <Input placeholder="Otaq" value={newLesson.room} onChange={e => setNewLesson(p => ({ ...p, room: e.target.value }))} />
                <select value={newLesson.day} onChange={e => setNewLesson(p => ({ ...p, day: e.target.value }))}
                  className="p-2.5 rounded-xl border bg-background text-foreground text-sm">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={newLesson.time} onChange={e => setNewLesson(p => ({ ...p, time: e.target.value }))}
                  className="p-2.5 rounded-xl border bg-background text-foreground text-sm">
                  {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={newLesson.week} onChange={e => setNewLesson(p => ({ ...p, week: e.target.value }))}
                  className="p-2.5 rounded-xl border bg-background text-foreground text-sm">
                  {WEEKS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <select value={newLesson.subgroup} onChange={e => setNewLesson(p => ({ ...p, subgroup: e.target.value }))}
                  className="p-2.5 rounded-xl border bg-background text-foreground text-sm">
                  {SUBGROUPS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Button onClick={addLesson} className="w-full gap-2"><Plus className="h-4 w-4" /> Dərs Əlavə Et</Button>
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {lessons.map(l => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/10 text-sm">
                <div>
                  <p className="font-medium">{l.subject}</p>
                  <p className="text-xs text-muted-foreground">{l.day} {l.time} — {l.teacher} — {l.room} — {l.week} — {l.subgroup}</p>
                </div>
                <button onClick={() => deleteLesson(l.id)} className="text-muted-foreground hover:text-destructive shrink-0 ml-2">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
        ))}
          </div>
        </Section>
      </div>
    </div>
  );
}