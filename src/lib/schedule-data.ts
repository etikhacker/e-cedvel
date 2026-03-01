export type ScheduleItem = {
  day: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  type: string;
  subgroup: 'ust' | 'alt' | 'hamisi';
  week: 'ust' | 'alt' | 'hamisi';
  group: 'IT24.1' | 'IT24.2' | 'hamisi';
};

export const SCHEDULE_IT24_1: ScheduleItem[] = [
  { day: 'Bazar ertəsi', time: '14:05-15:25', subject: 'Obyektyönlü proqramlaşdırma', teacher: 'Validə Nuriyeva', room: '311', type: 'məş', subgroup: 'hamisi', week: 'ust', group: 'IT24.1' },
  { day: 'Bazar ertəsi', time: '14:05-15:25', subject: 'Diskret riyaziyyat', teacher: 'Lalə Rzayeva', room: '303', type: 'məş', subgroup: 'hamisi', week: 'alt', group: 'IT24.1' },
  { day: 'Bazar ertəsi', time: '15:35-16:55', subject: 'Verilənlər bazası sistemləri', teacher: 'Rəsmiyyə Əmiraslanova', room: '305', type: 'müh', subgroup: 'hamisi', week: 'hamisi', group: 'IT24.1' },
  { day: 'Bazar ertəsi', time: '17:05-18:25', subject: 'Kompüter şəbəkələri', teacher: 'Ceyhun Əlizadə', room: '308', type: 'lab', subgroup: 'ust', week: 'hamisi', group: 'IT24.1' },
  { day: 'Bazar ertəsi', time: '17:05-18:25', subject: 'Əməliyyat sistemləri', teacher: 'Elnur Xəlilov', room: '309', type: 'lab', subgroup: 'alt', week: 'hamisi', group: 'IT24.1' },
  { day: 'Çərşənbə axşamı', time: '12:30-13:50', subject: 'Diskret riyaziyyat', teacher: 'Lalə Rzayeva', room: '306', type: 'müh', subgroup: 'hamisi', week: 'hamisi', group: 'IT24.1' },
  { day: 'Çərşənbə axşamı', time: '14:05-15:25', subject: 'Kompüter şəbəkələri', teacher: 'Ceyhun Əlizadə', room: '305', type: 'müh', subgroup: 'hamisi', week: 'hamisi', group: 'IT24.1' },
  { day: 'Çərşənbə axşamı', time: '15:35-16:55', subject: 'Əməliyyat sistemləri', teacher: 'Elnur Xəlilov', room: '308', type: 'lab', subgroup: 'ust', week: 'hamisi', group: 'IT24.1' },
  { day: 'Çərşənbə axşamı', time: '15:35-16:55', subject: 'Kompüter şəbəkələri', teacher: 'Ceyhun Əlizadə', room: '309', type: 'lab', subgroup: 'alt', week: 'hamisi', group: 'IT24.1' },
  { day: 'Çərşənbə', time: '14:05-15:25', subject: 'Əməliyyat sistemləri', teacher: 'Elnur Xəlilov', room: '306', type: 'müh', subgroup: 'hamisi', week: 'hamisi', group: 'IT24.1' },
  { day: 'Çərşənbə', time: '15:35-16:55', subject: 'Obyektyönlü proqramlaşdırma', teacher: 'Validə Nuriyeva', room: '306', type: 'müh', subgroup: 'hamisi', week: 'hamisi', group: 'IT24.1' },
  { day: 'Çərşənbə', time: '17:05-18:25', subject: 'Verilənlər bazası sistemləri', teacher: 'Rəsmiyyə Əmiraslanova', room: '308', type: 'lab', subgroup: 'ust', week: 'ust', group: 'IT24.1' },
  { day: 'Çərşənbə', time: '17:05-18:25', subject: 'Obyektyönlü proqramlaşdırma', teacher: 'Validə Nuriyeva', room: '309', type: 'lab', subgroup: 'ust', week: 'alt', group: 'IT24.1' },
  { day: 'Çərşənbə', time: '17:05-18:25', subject: 'Obyektyönlü proqramlaşdırma', teacher: 'Validə Nuriyeva', room: '309', type: 'lab', subgroup: 'alt', week: 'ust', group: 'IT24.1' },
  { day: 'Çərşənbə', time: '17:05-18:25', subject: 'Verilənlər bazası sistemləri', teacher: 'Rəsmiyyə Əmiraslanova', room: '308', type: 'lab', subgroup: 'alt', week: 'alt', group: 'IT24.1' },
  { day: 'Cümə axşamı', time: '14:05-15:25', subject: 'Kompüter şəbəkələri', teacher: 'Ceyhun Əlizadə', room: '306', type: 'müh', subgroup: 'hamisi', week: 'ust', group: 'IT24.1' },
  { day: 'Cümə axşamı', time: '14:05-15:25', subject: 'Verilənlər bazası sistemləri', teacher: 'Rəsmiyyə Əmiraslanova', room: '306', type: 'müh', subgroup: 'hamisi', week: 'alt', group: 'IT24.1' },
  { day: 'Cümə axşamı', time: '15:35-16:55', subject: 'Verilənlər bazası sistemləri', teacher: 'Rəsmiyyə Əmiraslanova', room: '306', type: 'məş', subgroup: 'hamisi', week: 'ust', group: 'IT24.1' },
  { day: 'Cümə axşamı', time: '15:35-16:55', subject: 'Kompüter şəbəkələri', teacher: 'Ceyhun Əlizadə', room: '306', type: 'məş', subgroup: 'hamisi', week: 'alt', group: 'IT24.1' },
];

export const SCHEDULE_IT24_2: ScheduleItem[] = [
  { day: 'Bazar ertəsi', time: '12:35-13:55', subject: 'Kompüter şəbəkələri', teacher: 'Ceyhun Əlizadə', room: '308', type: 'lab', subgroup: 'ust', week: 'ust', group: 'IT24.2' },
  { day: 'Bazar ertəsi', time: '12:35-13:55', subject: 'Əməliyyat sistemləri', teacher: 'Elnur Xəlilov', room: '309', type: 'lab', subgroup: 'alt', week: 'ust', group: 'IT24.2' },
  { day: 'Bazar ertəsi', time: '14:05-15:25', subject: 'Əməliyyat sistemləri', teacher: 'Elnur Xəlilov', room: '308', type: 'lab', subgroup: 'ust', week: 'alt', group: 'IT24.2' },
  { day: 'Bazar ertəsi', time: '14:05-15:25', subject: 'Kompüter şəbəkələri', teacher: 'Ceyhun Əlizadə', room: '309', type: 'lab', subgroup: 'alt', week: 'alt', group: 'IT24.2' },
  { day: 'Bazar ertəsi', time: '15:35-16:55', subject: 'Verilənlər bazası sistemləri', teacher: 'Rəsmiyyə Əmiraslanova', room: '305', type: 'müh', subgroup: 'hamisi', week: 'hamisi', group: 'IT24.2' },
  { day: 'Çərşənbə axşamı', time: '12:30-13:50', subject: 'Diskret riyaziyyat', teacher: 'Lalə Rzayeva', room: '306', type: 'müh', subgroup: 'hamisi', week: 'hamisi', group: 'IT24.2' },
  { day: 'Çərşənbə axşamı', time: '14:05-15:25', subject: 'Kompüter şəbəkələri', teacher: 'Ceyhun Əlizadə', room: '305', type: 'müh', subgroup: 'hamisi', week: 'hamisi', group: 'IT24.2' },
  { day: 'Çərşənbə axşamı', time: '15:35-16:55', subject: 'Verilənlər bazası sistemləri', teacher: 'Rəsmiyyə Əmiraslanova', room: '311', type: 'lab', subgroup: 'ust', week: 'ust', group: 'IT24.2' },
  { day: 'Çərşənbə axşamı', time: '15:35-16:55', subject: 'Obyektyönlü proqramlaşdırma', teacher: 'Validə Nuriyeva', room: '311', type: 'lab', subgroup: 'ust', week: 'alt', group: 'IT24.2' },
  { day: 'Çərşənbə axşamı', time: '15:35-16:55', subject: 'Obyektyönlü proqramlaşdırma', teacher: 'Validə Nuriyeva', room: '313', type: 'lab', subgroup: 'alt', week: 'ust', group: 'IT24.2' },
  { day: 'Çərşənbə axşamı', time: '15:35-16:55', subject: 'Verilənlər bazası sistemləri', teacher: 'Rəsmiyyə Əmiraslanova', room: '313', type: 'lab', subgroup: 'alt', week: 'alt', group: 'IT24.2' },
  { day: 'Çərşənbə', time: '14:05-15:25', subject: 'Əməliyyat sistemləri', teacher: 'Elnur Xəlilov', room: '306', type: 'müh', subgroup: 'hamisi', week: 'hamisi', group: 'IT24.2' },
  { day: 'Çərşənbə', time: '15:35-16:55', subject: 'Obyektyönlü proqramlaşdırma', teacher: 'Validə Nuriyeva', room: '306', type: 'müh', subgroup: 'hamisi', week: 'hamisi', group: 'IT24.2' },
  { day: 'Cümə axşamı', time: '14:05-15:25', subject: 'Kompüter şəbəkələri', teacher: 'Ceyhun Əlizadə', room: '306', type: 'müh', subgroup: 'hamisi', week: 'ust', group: 'IT24.2' },
  { day: 'Cümə axşamı', time: '14:05-15:25', subject: 'Verilənlər bazası sistemləri', teacher: 'Rəsmiyyə Əmiraslanova', room: '306', type: 'müh', subgroup: 'hamisi', week: 'alt', group: 'IT24.2' },
  { day: 'Cümə axşamı', time: '15:35-16:55', subject: 'Obyektyönlü proqramlaşdırma', teacher: 'Validə Nuriyeva', room: '305', type: 'məş', subgroup: 'hamisi', week: 'ust', group: 'IT24.2' },
  { day: 'Cümə axşamı', time: '15:35-16:55', subject: 'Diskret riyaziyyat', teacher: 'Lalə Rzayeva', room: '305', type: 'məş', subgroup: 'hamisi', week: 'alt', group: 'IT24.2' },
  { day: 'Cümə axşamı', time: '17:05-18:25', subject: 'Verilənlər bazası sistemləri', teacher: 'Rəsmiyyə Əmiraslanova', room: '305', type: 'məş', subgroup: 'hamisi', week: 'ust', group: 'IT24.2' },
  { day: 'Cümə axşamı', time: '17:05-18:25', subject: 'Kompüter şəbəkələri', teacher: 'Ceyhun Əlizadə', room: '305', type: 'məş', subgroup: 'hamisi', week: 'alt', group: 'IT24.2' },
];

export const getSchedule = (group: string): ScheduleItem[] => {
  // Həm latın həm kiril İ-ni dəstəklə
  const normalized = group.replace('İ', 'I').replace('і', 'i').toUpperCase();
  if (normalized.includes('24.2') || normalized.includes('242')) return SCHEDULE_IT24_2;
  return SCHEDULE_IT24_1;
};

export const FIXED_SCHEDULE = SCHEDULE_IT24_1;