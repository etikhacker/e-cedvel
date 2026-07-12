"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, Bell, Calculator, User, Info, Smartphone, CheckCircle2, Moon, Sun, Settings, Settings2, RotateCcw, LogOut } from 'lucide-react';
import { UserProfile, WeekType, NotificationSettings } from '@/lib/types';
import { DailyView, WeeklyView } from '@/components/schedule-views';
import { Onboarding } from '@/components/onboarding';
import { getSchedule } from '@/lib/schedule-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { GradeCalculator } from '@/components/grade-calculator';
import { ProfileView } from '@/components/profile-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const DEFAULT_NOTIF_SETTINGS: NotificationSettings = {
  firstChannel: { enabled: true, firstClassMinutes: 60, otherClassesMinutes: 15 },
  secondChannel: { enabled: false, firstClassMinutes: 30, otherClassesMinutes: 10 }
};

export default function Home() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentWeek, setCurrentWeek] = useState<WeekType>('ust');
  const [selectedWeeklyWeek, setSelectedWeeklyWeek] = useState<WeekType>('ust');
  const [isReady, setIsReady] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>('unknown');
  const [activeTab, setActiveTab] = useState('daily');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dbSchedule, setDbSchedule] = useState<any[]>([]);

  useEffect(() => {
    // ---- .then() XARICINDƏ olan hər şey ----

    // Tema
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);

    // Bildiriş icazəsi
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }

    // Cari həftə
    const startDate = new Date('2026-02-16');
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(diffInDays / 7);
    const calculatedWeek = weekIndex % 2 === 0 ? 'ust' : 'alt';
    setCurrentWeek(calculatedWeek);
    setSelectedWeeklyWeek(calculatedWeek);

    // Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Avtomatik bildiriş — hər dəqiqə
    const notifInterval = setInterval(() => {
      if (Notification.permission !== 'granted') return;
      const savedP = localStorage.getItem('it24_profile');
      if (!savedP) return;
      const p = JSON.parse(savedP);
      if (!p.notificationSettings?.firstChannel?.enabled) return;

      const nowT = new Date();
      const sched = getSchedule(p.group || 'IT24.1');
      const dayNames = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];
      const todayName = dayNames[nowT.getDay()];
      const sd = new Date('2026-02-16');
      const dd = Math.floor((nowT.getTime() - sd.getTime()) / 86400000);
      const week = Math.floor(dd / 7) % 2 === 0 ? 'ust' : 'alt';

      const todayClasses = sched.filter(c =>
        c.day === todayName &&
        (c.subgroup === 'hamisi' || c.subgroup === p.subgroup) &&
        (c.week === 'hamisi' || c.week === week)
      );

      todayClasses.forEach(cls => {
        const [startTime] = cls.time.split('-');
        const [h, m] = startTime.split(':').map(Number);
        const classTime = new Date(nowT);
        classTime.setHours(h, m, 0, 0);
        const diffMin = Math.round((classTime.getTime() - nowT.getTime()) / 60000);
        const settings = p.notificationSettings;
        const isFirst = todayClasses[0] === cls;
        const t1 = isFirst ? settings.firstChannel.firstClassMinutes : settings.firstChannel.otherClassesMinutes;
        const t2 = settings.secondChannel.enabled
          ? (isFirst ? settings.secondChannel.firstClassMinutes : settings.secondChannel.otherClassesMinutes)
          : -1;
        const notifKey = `notif_${cls.day}_${cls.time}_${diffMin}`;
        if ((diffMin === t1 || diffMin === t2) && !sessionStorage.getItem(notifKey)) {
          sessionStorage.setItem(notifKey, '1');
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(`📚 ${cls.subject}`, {
              body: `${diffMin} dəqiqə sonra — ${cls.time}, otaq ${cls.room} (${cls.teacher})`,
              icon: '/icon-192x192.png',
              tag: notifKey,
            });
          });
        }
      });
    }, 60000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
  if (!session) {
    window.location.replace('/login');
    return;
  }

  const meta = session.user?.user_metadata;

  // DB-dən profili çək
  const { data: dbProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  // localStorage-dən çək
  const savedProfile = localStorage.getItem('it24_profile');
  let parsed: any = {};
  if (savedProfile) {
    try { parsed = JSON.parse(savedProfile); } catch (e) {}
  }

  // DB data varsa üstünlük ver
  if (dbProfile) {
    parsed.savedGrades = dbProfile.saved_grades || parsed.savedGrades || {};
    parsed.savedDetails = dbProfile.saved_details || parsed.savedDetails || {};
    parsed.absences = dbProfile.absences || parsed.absences || {};
    if (dbProfile.photo_url) parsed.photo_url = dbProfile.photo_url;
    if (dbProfile.photo_url) parsed.photo = dbProfile.photo_url;
  }

  if (meta?.full_name) parsed.name = meta.full_name;
  if (meta?.group) parsed.group = meta.group;
  if (meta?.subgroup) parsed.subgroup = meta.subgroup;
  if (meta?.faculty) parsed.faculty = meta.faculty;

  if (!parsed.notificationSettings?.firstChannel) {
    parsed.notificationSettings = DEFAULT_NOTIF_SETTINGS;
  }

  setProfile(parsed);
  // DB-dən cədvəl çək
  if (parsed.group_id) {
    const { data: lessons } = await supabase
      .from('schedule_lessons')
      .select('*')
      .eq('group_id', parsed.group_id);
    setDbSchedule(lessons || []);
  }
  setIsReady(true);
});

    return () => clearInterval(notifInterval); // ← useEffect-in ən sonu
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('it24_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('it24_theme', 'light');
    }
  };

  if (!isReady) return <div className="min-h-screen bg-background" />;

  if (!profile) {
    return <Onboarding onComplete={async (p: any) => {
      const newProfile: UserProfile = {
        ...p,
        savedGrades: {},
        savedDetails: {},
        notificationSettings: DEFAULT_NOTIF_SETTINGS
      };
      setProfile(newProfile);
      localStorage.setItem('it24_profile', JSON.stringify(newProfile));
      const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await supabase.from('profiles').upsert({
      id: session.user.id,
      name: p.name,
      group_id: p.group_id || null,
      university_id: p.university_id || null,
      subgroup: p.subgroup || null,
      updated_at: new Date().toISOString(),
    });}
    }} />
  }

  const schedule = (profile as any).group_id && dbSchedule.length > 0
  ? dbSchedule
  : getSchedule(profile.group || 'IT24.1');

  const dailyClasses = schedule.filter(c =>
    (c.subgroup === 'hamisi' || c.subgroup === profile.subgroup) &&
    (c.week === 'hamisi' || c.week === currentWeek)
  );

  const weeklyClasses = schedule.filter(c =>
  c.subgroup === 'hamisi' || c.subgroup === profile.subgroup
);

  const updateProfile = async (updatedProfile: UserProfile) => {
  setProfile(updatedProfile);
  localStorage.setItem('it24_profile', JSON.stringify(updatedProfile));

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await supabase.from('profiles').upsert({
  id: session.user.id,
  name: updatedProfile.name,
  photo_url: (updatedProfile as any).photo_url || null,
  absences: (updatedProfile as any).absences || {},
  saved_grades: updatedProfile.savedGrades || {},
  saved_details: updatedProfile.savedDetails || {},
  group_id: (updatedProfile as any).group_id || null,
  university_id: (updatedProfile as any).university_id || null,
  subgroup: (updatedProfile as any).subgroup || null,
  updated_at: new Date().toISOString(),
});
};

  const handleSaveGrade = (data: { subject: string; total: number; davamiyyat: number; serbest: number; kollokviumOrta: number; seminarOrta: number; labBal: number }) => {
    const updatedProfile = {
      ...profile,
      savedGrades: { ...(profile.savedGrades || {}), [data.subject]: Math.round(data.total) },
      savedDetails: {
        ...(profile.savedDetails || {}),
        [data.subject]: {
          total: Math.round(data.total),
          davamiyyat: data.davamiyyat,
          serbest: data.serbest,
          kollokviumOrta: data.kollokviumOrta,
          seminarOrta: data.seminarOrta,
          labBal: data.labBal,
        }
      }
    };
    updateProfile(updatedProfile);
    toast({ title: "Yadda saxlanıldı", description: `${data.subject} balınız kabinetə əlavə edildi.` });
  };

  const handleEditGrade = (subject: string) => {
    setIsProfileOpen(false);
    setActiveTab('calculator');
  };

  const resetProfile = () => {
  // Ballari saxla
  const savedProfile = localStorage.getItem('it24_profile');
  let savedGrades = {};
  let savedDetails = {};
  if (savedProfile) {
    try {
      const p = JSON.parse(savedProfile);
      savedGrades = p.savedGrades || {};
      savedDetails = p.savedDetails || {};
    } catch (e) {}
  }
  localStorage.removeItem('it24_profile');
  // Ballari geri yaz
  if (Object.keys(savedGrades).length > 0) {
    localStorage.setItem('it24_saved_grades', JSON.stringify({ savedGrades, savedDetails }));
  }
  supabase.auth.signOut().then(() => {
    window.location.replace('/login');
  });
};

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({ variant: "destructive", title: "Xəta", description: "Bu cihaz bildirişləri dəstəkləmir." });
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      toast({ title: "Uğurlu!", description: "Bildirişlər aktiv edildi." });
    }
  };

  const triggerTestNotification = async () => {
    if (notifPermission !== 'granted') {
      toast({ variant: "destructive", title: "İcazə Yoxdur", description: "Zəhmət olmasa əvvəlcə bildirişləri aktiv edin." });
      return;
    }
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('İT24 Bildiriş Testi', {
          body: `Salam, ${profile.name}! Bu bir test bildirişidir.`,
          icon: 'https://placehold.co/192x192/4A90E2/ffffff?text=IT24',
          tag: 'test-notification'
        });
        toast({ title: "Test Göndərildi", description: "Bildiriş panelini yoxlayın!" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Xəta", description: "Bildiriş göndərilə bilmədi." });
    }
  };

  const updateNotifSettings = (newSettings: NotificationSettings) => {
    if (!newSettings.firstChannel.enabled) newSettings.secondChannel.enabled = false;
    updateProfile({ ...profile, notificationSettings: newSettings });
  };

  const setStandardNotifSettings = () => {
    updateNotifSettings(DEFAULT_NOTIF_SETTINGS);
    toast({ title: "Standart Ayarlar", description: "Bildiriş ayarları sıfırlandı." });
  };

  const formatTimeMinutes = (min: number) => {
    if (min <= 0) return '';
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0) return `(${h} saat${m > 0 ? ` ${m} dəqiqə` : ''})`;
    return `(${m} dəqiqə)`;
  };

  const handleMinutesChange = (channel: 'firstChannel' | 'secondChannel', field: 'firstClassMinutes' | 'otherClassesMinutes', value: string) => {
    if (!profile.notificationSettings) return;
    const isOtherClass = field === 'otherClassesMinutes';
    const parsedValue = parseInt(value) || 0;
    const nonNegativeValue = Math.max(0, parsedValue);
    const numValue = value === '' ? 0 : (isOtherClass ? Math.min(90, nonNegativeValue) : nonNegativeValue);
    updateNotifSettings({
      ...profile.notificationSettings,
      [channel]: { ...profile.notificationSettings[channel], [field]: numValue }
    });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'weekly') setSelectedWeeklyWeek(currentWeek);
  };

  const logoText = profile.group || 'İT24';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg text-white font-bold text-lg shadow-sm shrink-0">{logoText}</div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dərs Cədvəli</h1>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs md:text-sm">
              <span>Salam, <b>{profile.name}</b></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full hover:bg-primary/10">
              {isDarkMode ? <Sun className="h-5 w-5 text-primary shrink-0" /> : <Moon className="h-5 w-5 text-primary shrink-0" />}
            </Button>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                  <Settings className="h-5 w-5 text-primary shrink-0" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-primary font-bold">
                    <Settings2 className="h-5 w-5 shrink-0" /> Bildiriş Ayarları
                  </DialogTitle>
                  <DialogDescription>Bildiriş sayını və göndərilmə vaxtını təyin edin.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl border border-primary/20">
                      <Label htmlFor="first-notif-channel" className="font-bold text-primary">Birinci Bildiriş Kanalı</Label>
                      <Switch id="first-notif-channel"
                        checked={profile.notificationSettings?.firstChannel.enabled}
                        onCheckedChange={(checked) => updateNotifSettings({
                          ...profile.notificationSettings!,
                          firstChannel: { ...profile.notificationSettings!.firstChannel, enabled: checked }
                        })} />
                    </div>
                    {profile.notificationSettings?.firstChannel.enabled && (
                      <div className="space-y-3 px-1">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <span>Günün İlk Dərsinə</span>
                            <span className="text-primary">{formatTimeMinutes(profile.notificationSettings.firstChannel.firstClassMinutes)}</span>
                            <span>Qalmış</span>
                          </Label>
                          <Input type="number" className="h-9" placeholder="Dəqiqə əvvəl" min="0"
                            value={profile.notificationSettings.firstChannel.firstClassMinutes || ''}
                            onChange={(e) => handleMinutesChange('firstChannel', 'firstClassMinutes', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <span>Digər Dərslərə</span>
                            <span className="text-primary">{formatTimeMinutes(profile.notificationSettings.firstChannel.otherClassesMinutes)}</span>
                            <span>Qalmış</span>
                          </Label>
                          <Input type="number" className="h-9" placeholder="Dəqiqə əvvəl (Maks 90)" min="0" max="90"
                            value={profile.notificationSettings.firstChannel.otherClassesMinutes || ''}
                            onChange={(e) => handleMinutesChange('firstChannel', 'otherClassesMinutes', e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className={cn("flex items-center justify-between p-3 rounded-xl border transition-opacity",
                      !profile.notificationSettings?.firstChannel.enabled ? "opacity-50 bg-muted" : "bg-muted/50")}>
                      <div className="space-y-0.5">
                        <Label htmlFor="second-notif-channel" className="font-bold text-muted-foreground">İkinci Bildiriş Kanalı</Label>
                        {!profile.notificationSettings?.firstChannel.enabled && (
                          <p className="text-[9px] text-destructive">Əvvəlcə birinci kanalı aktiv edin</p>
                        )}
                      </div>
                      <Switch id="second-notif-channel"
                        disabled={!profile.notificationSettings?.firstChannel.enabled}
                        checked={profile.notificationSettings?.secondChannel.enabled}
                        onCheckedChange={(checked) => updateNotifSettings({
                          ...profile.notificationSettings!,
                          secondChannel: { ...profile.notificationSettings!.secondChannel, enabled: checked }
                        })} />
                    </div>
                    {profile.notificationSettings?.secondChannel.enabled && (
                      <div className="space-y-3 px-1">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <span>Günün İlk Dərsinə</span>
                            <span className="text-primary">{formatTimeMinutes(profile.notificationSettings.secondChannel.firstClassMinutes)}</span>
                            <span>Qalmış</span>
                          </Label>
                          <Input type="number" className="h-9" placeholder="Dəqiqə əvvəl" min="0"
                            value={profile.notificationSettings.secondChannel.firstClassMinutes || ''}
                            onChange={(e) => handleMinutesChange('secondChannel', 'firstClassMinutes', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <span>Digər Dərslərə</span>
                            <span className="text-primary">{formatTimeMinutes(profile.notificationSettings.secondChannel.otherClassesMinutes)}</span>
                            <span>Qalmış</span>
                          </Label>
                          <Input type="number" className="h-9" placeholder="Dəqiqə əvvəl (Maks 90)" min="0" max="90"
                            value={profile.notificationSettings.secondChannel.otherClassesMinutes || ''}
                            onChange={(e) => handleMinutesChange('secondChannel', 'otherClassesMinutes', e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" className="w-full gap-2 text-primary border-primary/20 hover:bg-primary/5 h-11 font-bold" onClick={setStandardNotifSettings}>
                    <RotateCcw className="h-4 w-4 shrink-0" /> Standart Ayarlar
                  </Button>
                  <Button variant="outline" className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/5 h-11 font-bold"
                    onClick={() => { setIsSettingsOpen(false); resetProfile(); }}>
                    <LogOut className="h-4 w-4 shrink-0" /> Hesabdan Çıx
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <button aria-label="profil" onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="relative group transition-transform active:scale-95 ml-1">
              <Avatar className={`h-11 w-11 border-2 transition-all ${isProfileOpen ? 'border-primary ring-2 ring-primary/20' : 'border-background shadow-sm'}`}>
                <AvatarImage src={(profile as any).photo_url || profile.photo} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-6 w-6 shrink-0" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1 rounded-full border-2 border-background">
                <User className="h-3 w-3 shrink-0" />
              </div>
            </button>
          </div>
        </header>

        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <div className="flex gap-2 sm:absolute sm:left-0">
            <Button variant={notifPermission === 'granted' ? "ghost" : "default"} size="sm"
              onClick={requestPermission} disabled={notifPermission === 'granted'} className="gap-2">
              {notifPermission === 'granted' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <Bell className="h-4 w-4 shrink-0" />}
              {notifPermission === 'granted' ? 'Aktivdir' : 'Aktiv Et'}
            </Button>
            <Button variant="outline" size="sm" onClick={triggerTestNotification}
              className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
              <Smartphone className="h-4 w-4 shrink-0" /> Test
            </Button>
          </div>
          <div className="flex items-center gap-3 bg-background p-2 px-3 rounded-xl border border-primary/20 shadow-sm mx-auto">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Cari Həftə:</span>
              <Badge variant="default" className="font-bold text-[10px]">
                {currentWeek === 'ust' ? 'ÜST' : 'ALT'}
              </Badge>
            </div>
          </div>
        </div>

        {isProfileOpen ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-primary shrink-0" /> Şəxsi Kabinet
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setIsProfileOpen(false)}>Geri Qayıt</Button>
            </div>
            <ProfileView profile={profile} onUpdate={updateProfile} onEditGrade={handleEditGrade} />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background p-1.5 rounded-xl border overflow-x-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily" className="flex items-center gap-2 text-xs sm:text-sm">
                  <Bell className="h-4 w-4 shrink-0" /> Günlük
                </TabsTrigger>
                <TabsTrigger value="weekly" className="flex items-center gap-2 text-xs sm:text-sm">
                  <LayoutGrid className="h-4 w-4 shrink-0" /> Həftəlik
                </TabsTrigger>
                <TabsTrigger value="calculator" className="flex items-center gap-2 text-xs sm:text-sm">
                  <Calculator className="h-4 w-4 shrink-0" /> Giriş Ballarım
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="daily" className="min-h-[400px]">
              <DailyView classes={dailyClasses} />
            </TabsContent>

            <TabsContent value="weekly" className="min-h-[400px] space-y-6">
              <div className="flex justify-center">
                <Tabs value={selectedWeeklyWeek} onValueChange={(v) => setSelectedWeeklyWeek(v as WeekType)} className="w-fit">
                  <TabsList className="grid grid-cols-2 w-[240px] h-11">
                    <TabsTrigger value="ust" className="font-bold text-xs uppercase tracking-wider">Üst Həftə</TabsTrigger>
                    <TabsTrigger value="alt" className="font-bold text-xs uppercase tracking-wider">Alt Həftə</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <WeeklyView classes={weeklyClasses.filter(c => c.week === 'hamisi' || c.week === selectedWeeklyWeek)} />
            </TabsContent>

            <TabsContent value="calculator">
              <GradeCalculator onSave={handleSaveGrade} />
            </TabsContent>
          </Tabs>
        )}

        <footer className="pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© 2026 İT24 - Elizade Aksin and Omar Babayev</p>
          <p className="text-[10px] mt-1 opacity-50">Mingachevir State University</p>
        </footer>
      </div>
    </div>
  );
}