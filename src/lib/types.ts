export type WeekType = 'ust' | 'alt' | 'hamisi';

export interface ChannelSettings {
  enabled: boolean;
  firstClassMinutes: number;
  otherClassesMinutes: number;
}

export interface NotificationSettings {
  firstChannel: ChannelSettings;
  secondChannel: ChannelSettings;
}

export interface GradeDetails {
  total: number;
  davamiyyat?: number;
  serbest?: number;
  kollokviumOrta?: number;
  seminarOrta?: number;
  labBal?: number;
  attendance?: number;
  independentWork?: number;
  colloquiums?: number[];
  seminars?: number[];
  completedLabs?: number[];
  components?: Record<string, number>;
}

export interface UserProfile {
  name: string;
  group?: string;
  faculty?: string;
  subgroup: string;
  photo?: string;
  photo_url?: string;
  group_id?: string;
  university_id?: string;
  savedGrades?: Record<string, number>;
  savedDetails?: Record<string, GradeDetails>;
  notificationSettings?: NotificationSettings;
  notes?: string;        // ← əlavə et
  absences?: Record<string, number>;  // ← əlavə et
}