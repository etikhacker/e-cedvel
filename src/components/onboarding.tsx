'use client';

import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function Onboarding({ onComplete }: { onComplete: (p: any) => void }) {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const meta = session.user.user_metadata;
      onComplete({
        name: meta.full_name || session.user.email || 'İstifadəçi',
        faculty: meta.faculty || '',
        group: meta.group || 'IT24.1',
        subgroup: meta.subgroup || 'ust',
        savedGrades: {},
        savedDetails: {},
      });
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="bg-primary p-3 rounded-xl text-white font-bold text-2xl inline-block">İT24</div>
        <p className="text-muted-foreground text-sm">Yüklənir...</p>
      </div>
    </div>
  );
}

export default Onboarding;