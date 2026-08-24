'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { InviteSection } from '@/components/InviteSection'
import { Plus, Trash2, ChevronDown, ChevronUp, University, Users, BookOpen, LogOut, Mail, type LucideIcon } from 'lucide-react';
type University = { id: string; name: string; short_name: string; city: string };
type Faculty = { id: string; name: string; university_id: string };
type Group = { id: string; name: string; faculty_id: string; university_id: string };
type Lesson = { id: string; subject: string; teacher: string; room: string; day: string; time: string; week: string; subgroup: string; type: string; group_id: string };
type UniversityRequest = { id: string; name: string; short_name: string; city: string; contact_name: string; contact_email: string };

const DAYS = ['Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];
const TIMES = ['08:00-09:20', '09:30-10:50', '11:00-12:20', '12:30-13:50', '14:00-15:20', '15:30-16:50', '17:00-18:20'];
const SEL = "p-2.5 rounded-xl border bg-background text-foreground text-sm";
const EMPTY_LESSON = { subject: '', teacher: '', room: '', day: DAYS[0], time: TIMES[0], week: 'hamisi', subgroup: 'hamisi', type: 'mesqele' };

function Section({ id, title, icon: Icon, expanded, onToggle, children }: {
  id: string; title: string; icon: LucideIcon; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div data-section={id} className="border rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-2 font-bold"><Icon className="h-5 w-5 text-primary" /> {title}</div>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expanded && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

function LabeledSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground px-1">{label}</p>
      <select value={value} onChange={e => onChange(e.target.value)} className={`w-full ${SEL}`}>{children}</select>
    </div>
  );
}

export default function AdminPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [requests, setRequests] = useState<UniversityRequest[]>([]);
  const [selectedUni, setSelectedUni] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [expandedSection, setExpandedSection] = useState('universities');
  const [newUni, setNewUni] = useState({ name: '', short_name: '', city: '' });
  const [newFaculty, setNewFaculty] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [newLesson, setNewLesson] = useState(EMPTY_LESSON);

  const loadData = useCallback(async (uniId: string | null) => {
    const { data: unis } = uniId ? await supabase.from('universities').select('*').eq('id', uniId) : await supabase.from('universities').select('*');
    setUniversities(unis || []);
    const { data: facs } = await supabase.from('faculties').select('*');
    setFaculties(facs || []);
    const { data: grps } = await supabase.from('groups').select('*');
    setGroups(grps || []);
  }, []);

  const checkAdmin = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.replace('/login'); return; }
    const { data } = await supabase.from('university_admins').select('role, university_id').eq('id', session.user.id).single();
    if (!data) { window.location.replace('/'); return; }
    const superadmin = data.role === 'superadmin';
    setIsSuperadmin(superadmin);
    await loadData(superadmin ? null : data.university_id);
    if (superadmin) {
      const { data: reqs } = await supabase.from('university_requests').select('*').eq('status', 'pending');
      setRequests(reqs || []);
    }
    setLoading(false);
  }, [loadData]);

  async function loadLessons(groupId: string) {
    const { data } = await supabase.from('schedule_lessons').select('*').eq('group_id', groupId);
    setLessons(data || []);
  }

  useEffect(() => { void checkAdmin(); }, [checkAdmin]);

  const addUniversity = async () => {
    if (!newUni.name) return;
    const { data, error } = await supabase.from('universities').insert(newUni).select().single();
    if (error) { toast({ variant: 'destructive', title: 'Xəta', description: error.message }); return; }
    toast({ title: 'Uğurlu', description: 'Universitet əlavə edildi' });
    setNewUni({ name: '', short_name: '', city: '' });
    if (data) setUniversities(prev => [...prev, data]);
  };

  const addFaculty = async () => {
    if (!newFaculty || !selectedUni) return;
    const { data, error } = await supabase.from('faculties').insert({ name: newFaculty, university_id: selectedUni }).select().single();
    if (error) { toast({ variant: 'destructive', title: 'Xəta', description: error.message }); return; }
    toast({ title: 'Uğurlu', description: 'Fakültə əlavə edildi' });
    setNewFaculty('');
    if (data) setFaculties(prev => [...prev, data]);
  };

  const addGroup = async () => {
    if (!newGroup || !selectedFaculty || !selectedUni) return;
    const { data, error } = await supabase.from('groups').insert({ name: newGroup, faculty_id: selectedFaculty, university_id: selectedUni }).select().single();
    if (error) { toast({ variant: 'destructive', title: 'Xəta', description: error.message }); return; }
    toast({ title: 'Uğurlu', description: 'Qrup əlavə edildi' });
    setNewGroup('');
    if (data) setGroups(prev => [...prev, data]);
  };

  const addLesson = async () => {
    if (!newLesson.subject || !selectedGroup) return;
    const { data, error } = await supabase.from('schedule_lessons').insert({ ...newLesson, group_id: selectedGroup }).select().single();
    if (error) { toast({ variant: 'destructive', title: 'Xəta', description: error.message }); return; }
    toast({ title: 'Uğurlu', description: 'Dərs əlavə edildi' });
    setNewLesson(EMPTY_LESSON);
    if (data) setLessons(prev => [...prev, data]);
  };

  const deleteUniversity = async (id: string, name: string) => {
    await supabase.from('universities').delete().eq('id', id);
    setUniversities(prev => prev.filter(u => u.id !== id));
    toast({ title: 'Silindi', description: `${name} silindi` });
  };

  const deleteFaculty = async (id: string, name: string) => {
    await supabase.from('faculties').delete().eq('id', id);
    setFaculties(prev => prev.filter(f => f.id !== id));
    toast({ title: 'Silindi', description: `${name} silindi` });
  };

  const deleteGroup = async (id: string) => {
    await supabase.from('groups').delete().eq('id', id);
    setGroups(prev => prev.filter(g => g.id !== id));
    if (selectedGroup === id) { setSelectedGroup(''); setLessons([]); }
  };

  const deleteLesson = async (id: string) => {
    await supabase.from('schedule_lessons').delete().eq('id', id);
    setLessons(prev => prev.filter(l => l.id !== id));
  };

  const approveRequest = async (r: UniversityRequest) => {
    const { data: uni, error: uniError } = await supabase.from('universities').insert({ name: r.name, short_name: r.short_name, city: r.city }).select().single();
    if (uniError || !uni) { toast({ variant: 'destructive', title: 'Xəta', description: 'Universitet əlavə edilmədi' }); return; }
    const { data: invite, error: inviteError } = await supabase.from('university_invites').insert({ email: r.contact_email, university_id: uni.id }).select().single();
    if (inviteError || !invite) { toast({ variant: 'destructive', title: 'Xəta', description: 'Dəvət yaradılmadı' }); return; }
    await supabase.from('university_requests').update({ status: 'approved' }).eq('id', r.id);
    setRequests(prev => prev.filter(x => x.id !== r.id));
    setUniversities(prev => [...prev, uni]);
    const inviteLink = `${window.location.origin}/admin/setup?token=${invite.token}`;
    await supabase.functions.invoke('send-invite', { body: { email: r.contact_email, invite_link: inviteLink, university_name: r.name } });
    navigator.clipboard.writeText(inviteLink);
    toast({ title: 'Təsdiqləndi! ✅', description: `Dəvət linki kopyalandı — universitetə göndərin` });
  };

  const toggle = (id: string) => setExpandedSection(prev => prev === id ? '' : id);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p>Yüklənir...</p></div>;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">QrupTap Admin</h1>
            <p className="text-sm text-muted-foreground">{isSuperadmin ? 'Superadmin' : 'Universitet Admin'}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/admin/muracietler"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors">
              <Mail className="h-4 w-4" /> Müraciətlər
            </a>
            <Button variant="outline" className="gap-2 text-destructive border-destructive/20"
              onClick={() => supabase.auth.signOut().then(() => window.location.replace('/login'))}>
              <LogOut className="h-4 w-4" /> Çıx
            </Button>
          </div>
        </header>

        {isSuperadmin && requests.length > 0 && (
          <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 space-y-3">
            <p className="font-bold text-yellow-600">🔔 Gözləyən Müraciətlər ({requests.length})</p>
            {requests.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border bg-background">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.contact_name} · {r.contact_email} · {r.city}</p>
                </div>
                <Button size="sm" className="bg-green-500 hover:bg-green-400 text-white" onClick={() => approveRequest(r)}>Təsdiqlə</Button>
              </div>
            ))}
          </div>
        )}

        {isSuperadmin && (
          <Section id="universities" title="Universitetlər" icon={University} expanded={expandedSection === 'universities'} onToggle={() => toggle('universities')}>
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
                  <button onClick={() => deleteUniversity(u.id, u.name)} className="text-muted-foreground hover:text-destructive ml-2"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </Section>
        )}
        {isSuperadmin && <InviteSection />}
        <Section id="faculties" title="Fakültələr" icon={Users} expanded={expandedSection === 'faculties'} onToggle={() => toggle('faculties')}>
          <select value={selectedUni} onChange={e => setSelectedUni(e.target.value)} className={`w-full ${SEL}`}>
            <option value="">-- Universitet seçin --</option>
            {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <div className="flex gap-2">
            <Input placeholder="Fakültə adı" value={newFaculty} onChange={e => setNewFaculty(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFaculty()} />
            <Button onClick={addFaculty} className="gap-2 shrink-0"><Plus className="h-4 w-4" /> Əlavə et</Button>
          </div>
          <div className="space-y-2">
            {faculties.filter(f => f.university_id === selectedUni).map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/10">
                <p className="font-medium">{f.name}</p>
                <button onClick={() => deleteFaculty(f.id, f.name)} className="text-muted-foreground hover:text-destructive ml-2"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </Section>

        <Section id="groups" title="Qruplar" icon={Users} expanded={expandedSection === 'groups'} onToggle={() => toggle('groups')}>
          <div className="grid grid-cols-2 gap-2">
            <select value={selectedUni} onChange={e => { setSelectedUni(e.target.value); setSelectedFaculty(''); }} className={SEL}>
              <option value="">-- Universitet --</option>
              {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)} className={SEL}>
              <option value="">-- Fakültə --</option>
              {faculties.filter(f => f.university_id === selectedUni).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Qrup adı (IT24.1)" value={newGroup} onChange={e => setNewGroup(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGroup()} />
            <Button onClick={addGroup} className="gap-2 shrink-0"><Plus className="h-4 w-4" /> Əlavə et</Button>
          </div>
          <div className="space-y-2">
            {groups.filter(g => g.faculty_id === selectedFaculty).map(g => (
              <div key={g.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/10">
                <p className="font-medium">{g.name}</p>
                <button onClick={() => deleteGroup(g.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </Section>

        <Section id="schedule" title="Cədvəl Dərsləri" icon={BookOpen} expanded={expandedSection === 'schedule'} onToggle={() => toggle('schedule')}>
          <select value={selectedUni} onChange={e => { setSelectedUni(e.target.value); setSelectedFaculty(''); setSelectedGroup(''); setLessons([]); }} className={`w-full ${SEL}`}>
            <option value="">-- Universitet --</option>
            {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={selectedFaculty} onChange={e => { setSelectedFaculty(e.target.value); setSelectedGroup(''); setLessons([]); }} className={`w-full ${SEL}`}>
            <option value="">-- Fakültə --</option>
            {faculties.filter(f => f.university_id === selectedUni).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={selectedGroup} onChange={e => { setSelectedGroup(e.target.value); loadLessons(e.target.value); }} className={`w-full ${SEL}`}>
            <option value="">-- Qrup seçin --</option>
            {groups.filter(g => g.faculty_id === selectedFaculty).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          {selectedGroup && (
            <div className="space-y-3 border rounded-xl p-4 bg-muted/10">
              <p className="font-bold text-sm text-primary">Yeni Dərs Əlavə Et</p>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Fənn" value={newLesson.subject} onChange={e => setNewLesson(p => ({ ...p, subject: e.target.value }))} />
                <Input placeholder="Müəllim" value={newLesson.teacher} onChange={e => setNewLesson(p => ({ ...p, teacher: e.target.value }))} />
                <Input placeholder="Otaq" value={newLesson.room} onChange={e => setNewLesson(p => ({ ...p, room: e.target.value }))} />
                <select value={newLesson.day} onChange={e => setNewLesson(p => ({ ...p, day: e.target.value }))} className={SEL}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <Input placeholder="Vaxt (09:00-10:20)" value={newLesson.time} onChange={e => setNewLesson(p => ({ ...p, time: e.target.value }))} />
                <LabeledSelect label="Həftə" value={newLesson.week} onChange={v => setNewLesson(p => ({ ...p, week: v }))}>
                  <option value="hamisi">Hər həftə</option>
                  <option value="ust">Üst həftə</option>
                  <option value="alt">Alt həftə</option>
                </LabeledSelect>
                <LabeledSelect label="Subqrup" value={newLesson.subgroup} onChange={v => setNewLesson(p => ({ ...p, subgroup: v }))}>
                  <option value="hamisi">Bütün qrup</option>
                  <option value="ust">Üst qrup</option>
                  <option value="alt">Alt qrup</option>
                </LabeledSelect>
                <LabeledSelect label="Dərs növü" value={newLesson.type} onChange={v => setNewLesson(p => ({ ...p, type: v }))}>
                  <option value="mesqele">Məşğələ</option>
                  <option value="seminar">Mühazirə</option>
                  <option value="laboratoriya">Laboratoriya</option>
                </LabeledSelect>
              </div>
              <Button onClick={addLesson} className="w-full gap-2"><Plus className="h-4 w-4" /> Dərs Əlavə Et</Button>
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {lessons.map(l => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/10 text-sm">
                <div>
                  <p className="font-medium">{l.subject} <span className="text-xs text-primary">({l.type || 'məşğələ'})</span></p>
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