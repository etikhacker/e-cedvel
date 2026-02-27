'use client';

import React from 'react';
import { ScheduleItem } from '@/lib/schedule-data';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User } from 'lucide-react';

const DAYS_OF_WEEK = [
  'Bazar ertəsi',
  'Çərşənbə axşamı',
  'Çərşənbə',
  'Cümə axşamı',
  'Cümə',
  'Şənbə',
  'Bazar',
];

const TYPE_COLORS: Record<string, string> = {
  'müh': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'məş': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'lab': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

function ClassCard({ c }: { c: ScheduleItem }) {
  return (
    <div className="p-4 border rounded-xl bg-card hover:shadow-md transition-shadow space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground">{c.subject}</h3>
        {c.type && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[c.type] || 'bg-muted text-muted-foreground'}`}>
            {c.type}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 shrink-0" /> {c.time}
        </span>
        {c.teacher && (
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5 shrink-0" /> {c.teacher}
          </span>
        )}
        {c.room && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> Otaq {c.room}
          </span>
        )}
      </div>
    </div>
  );
}

export const DailyView = ({ classes }: { classes: ScheduleItem[] }) => {
  const today = new Date();
  const dayIndex = today.getDay(); // 0=Bazar, 1=Bazar ertəsi...
  // JS-də 0=Bazar, 1=Bazar ertəsi, 2=Çərşənbə axşamı, 3=Çərşənbə, 4=Cümə axşamı, 5=Cümə, 6=Şənbə
  const dayMap: Record<number, string> = {
    1: 'Bazar ertəsi',
    2: 'Çərşənbə axşamı',
    3: 'Çərşənbə',
    4: 'Cümə axşamı',
    5: 'Cümə',
    6: 'Şənbə',
    0: 'Bazar',
  };
  const todayName = dayMap[dayIndex];
  const todayClasses = classes.filter(c => c.day === todayName);
  const sorted = [...todayClasses].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="font-bold text-lg text-foreground">{todayName}</h2>
        <Badge variant="outline" className="text-xs">{today.toLocaleDateString('az-AZ')}</Badge>
      </div>
      {sorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-medium">Bu gün dərs yoxdur!</p>
        </div>
      ) : (
        sorted.map((c, i) => <ClassCard key={i} c={c} />)
      )}
    </div>
  );
};

export const WeeklyView = ({ classes }: { classes: ScheduleItem[] }) => {
  const days = ['Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə'];

  return (
    <div className="space-y-6">
      {days.map(day => {
        const dayClasses = classes
          .filter(c => c.day === day)
          .sort((a, b) => a.time.localeCompare(b.time));
        
        if (dayClasses.length === 0) return null;

        return (
          <div key={day} className="space-y-2">
            <h3 className="font-bold text-primary border-b border-primary/20 pb-1">{day}</h3>
            {dayClasses.map((c, i) => <ClassCard key={i} c={c} />)}
          </div>
        );
      })}
    </div>
  );
};

export default function Dummy() { return <div>Yüklənir...</div> }