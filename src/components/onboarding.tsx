'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type University = { id: string; name: string; short_name: string };
type Faculty = { id: string; name: string };
type Group = { id: string; name: string };

export function Onboarding({ onComplete }: { onComplete: (p: any) => void }) {
  const [step, setStep] = useState<'university' | 'faculty' | 'group' | 'subgroup' | 'done'>('university');
  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [hasSubgroups, setHasSubgroups] = useState(false);

  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedSubgroup, setSelectedSubgroup] = useState<'ust' | 'alt'>('ust');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const meta = session.user.user_metadata;
      setUserName(meta.full_name || session.user.email || 'İstifadəçi');
    });
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    const { data } = await supabase.from('universities').select('id, name, short_name').eq('is_active', true);
    setUniversities(data || []);
  };

  const selectUniversity = async (uni: University) => {
    setSelectedUni(uni);
    const { data } = await supabase.from('faculties').select('id, name').eq('university_id', uni.id);
    setFaculties(data || []);
    setStep('faculty');
  };

  const selectFaculty = async (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    const { data } = await supabase.from('groups').select('id, name').eq('faculty_id', faculty.id);
    setGroups(data || []);
    setStep('group');
  };

  const selectGroup = async (group: Group) => {
    setSelectedGroup(group);
    // Subqrup var mı yoxla
    const { data } = await supabase
      .from('schedule_lessons')
      .select('subgroup')
      .eq('group_id', group.id)
      .neq('subgroup', 'hamisi')
      .limit(1);

    if (data && data.length > 0) {
      setHasSubgroups(true);
      setStep('subgroup');
    } else {
      setHasSubgroups(false);
      completeOnboarding(group, 'hamisi');
    }
  };

  const completeOnboarding = (group: Group, subgroup: string) => {
    onComplete({
      name: userName,
      university_id: selectedUni?.id,
      university_name: selectedUni?.name,
      faculty_id: selectedFaculty?.id,
      faculty_name: selectedFaculty?.name,
      group_id: group.id,
      group: group.name,
      subgroup,
      savedGrades: {},
      savedDetails: {},
    });
  };

  const CardButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick}
      className="w-full p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left font-medium">
      {children}
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-primary p-3 rounded-xl text-white font-bold text-2xl inline-block">QrupTap</div>
          {step === 'university' && <p className="text-muted-foreground text-sm">Universitetinizi seçin</p>}
          {step === 'faculty' && <p className="text-muted-foreground text-sm">{selectedUni?.name}</p>}
          {step === 'group' && <p className="text-muted-foreground text-sm">{selectedFaculty?.name}</p>}
          {step === 'subgroup' && <p className="text-muted-foreground text-sm">{selectedGroup?.name}</p>}
        </div>

        {step === 'university' && (
          <div className="space-y-3">
            <p className="font-bold text-center">Universitet seçin</p>
            {universities.length === 0 && (
              <p className="text-center text-muted-foreground text-sm">Yüklənir...</p>
            )}
            {universities.map(u => (
              <CardButton key={u.id} onClick={() => selectUniversity(u)}>
                <p className="font-bold">{u.short_name || u.name}</p>
                <p className="text-xs text-muted-foreground">{u.name}</p>
              </CardButton>
            ))}
          </div>
        )}

        {step === 'faculty' && (
          <div className="space-y-3">
            <p className="font-bold text-center">Fakültə seçin</p>
            {faculties.map(f => (
              <CardButton key={f.id} onClick={() => selectFaculty(f)}>
                {f.name}
              </CardButton>
            ))}
            <button onClick={() => setStep('university')}
              className="w-full text-sm text-muted-foreground hover:text-foreground">
              ← Geri
            </button>
          </div>
        )}

        {step === 'group' && (
          <div className="space-y-3">
            <p className="font-bold text-center">Qrup seçin</p>
            {groups.map(g => (
              <CardButton key={g.id} onClick={() => selectGroup(g)}>
                {g.name}
              </CardButton>
            ))}
            <button onClick={() => setStep('faculty')}
              className="w-full text-sm text-muted-foreground hover:text-foreground">
              ← Geri
            </button>
          </div>
        )}

        {step === 'subgroup' && (
          <div className="space-y-3">
            <p className="font-bold text-center">Alt qrup seçin</p>
            <CardButton onClick={() => completeOnboarding(selectedGroup!, 'ust')}>
              <p className="font-bold">Üst qrup</p>
            </CardButton>
            <CardButton onClick={() => completeOnboarding(selectedGroup!, 'alt')}>
              <p className="font-bold">Alt qrup</p>
            </CardButton>
            <button onClick={() => setStep('group')}
              className="w-full text-sm text-muted-foreground hover:text-foreground">
              ← Geri
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Onboarding;