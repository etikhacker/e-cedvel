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
  components?: Record<string, number>;
  total: number;
  davamiyyat?: number;
  serbest?: number;
  kollokviumOrta?: number;
  seminarOrta?: number;
  labBal?: number;
}

export interface UserProfile {
  name: string;
  group?: string;
  subgroup: string;
  photo?: string;
  savedGrades?: Record<string, number>;
  savedDetails?: Record<string, GradeDetails>;
  notificationSettings?: NotificationSettings;
}