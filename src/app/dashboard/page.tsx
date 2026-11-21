"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, Bell, Calculator, User, Info, Smartphone, CheckCircle2, Moon, Sun, Settings, Settings2, RotateCcw, LogOut } from 'lucide-react';
import { UserProfile, WeekType, NotificationSettings } from '@/lib/types';
import { DailyView, WeeklyView } from '@/components/schedule-views';
import { Onboarding } from '@/components/onboarding';
import { type ScheduleItem } from '@/lib/schedule-data';
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
import { loadProfile, saveProfile } from '@/lib/profile';
import { academicWeek, bakuDate, filterSchedule, DAYS } from '@/lib/scheduling';
import { supabase } from '@/lib/supabase';

const DEFAULT_NOTIF_SETTINGS: NotificationSettings = {
  firstChannel: { enabled: true, firstClassMinutes: 60, otherClassesMinutes: 15 },
  secondChannel: { enabled: false, firstClassMinutes: 30, otherClassesMinutes: 10 }
};

export default function Home() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentWeek, setCurrentWeek] = useState<WeekType | null>(null);
  const [selectedWeeklyWeek, setSelectedWeeklyWeek] = useState<WeekType>('ust');
  const [isReady, setIsReady] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>('unknown');
  const [editingSubject,setEditingSubject]=useState('');
  const [activeTab, setActiveTab] = useState('daily');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dbSchedule, setDbSchedule] = useState<ScheduleItem[]>([]);

  const [loadError,setLoadError]=useState('');
  const [scheduleLoading,setScheduleLoading]=useState(true);
  const [semester,setSemester]=useState<{start:string|null;first:'ust'|'alt'}>({start:null,first:'ust'});
  const saveQueue=useRef(Promise.resolve());
  const latestProfile=useRef<UserProfile|null>(null);
  useEffect(()=>{
    let active=true;
    if ('Notification' in window) setNotifPermission(Notification.permission);
    loadProfile().then(p=>{
      if (!active) return;
      if (p) p={...p,notificationSettings:p.notificationSettings?.firstChannel?p.notificationSettings:DEFAULT_NOTIF_SETTINGS};
      latestProfile.current=p; setProfile(p); setIsReady(true);
    }).catch(()=>{if(active){setLoadError('Profil yüklənmədi. İnternet bağlantısını yoxlayıb səhifəni yeniləyin.');setIsReady(true);}});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event)=>{
      if(event==='SIGNED_OUT'){latestProfile.current=null;setProfile(null);setDbSchedule([]);window.location.replace('/login');}
    });
    return ()=>{active=false;subscription.unsubscribe();};
  },[]);

  useEffect(()=>{
    let active=true;
    const refresh=async()=>{
      if (!profile?.group_id) {if(active){setDbSchedule([]);setScheduleLoading(false);}return;}
      const [lessons,uni]=await Promise.all([
        supabase.from('schedule_lessons').select('*').eq('group_id',profile.group_id),
        supabase.from('universities').select('semester_start,first_week').eq('id',profile.university_id).single(),
      ]);
      if (!active) return;
      if(lessons.error||uni.error){setDbSchedule([]);setLoadError('Cədvəl yüklənmədi. Yenidən cəhd edin.');}
      else {
        setDbSchedule(lessons.data||[]);setLoadError('');
        setSemester({start:uni.data.semester_start,first:uni.data.first_week});
      }
      setScheduleLoading(false);
    };
    void refresh();
    const interval=setInterval(()=>void refresh(),60000);
    window.addEventListener('focus',refresh);
    return ()=>{active=false;clearInterval(interval);window.removeEventListener('focus',refresh);};
  },[profile?.group_id,profile?.university_id]);

  useEffect(()=>{
    const tick=()=>setCurrentWeek(academicWeek(semester.start,semester.first));
    tick();const interval=setInterval(tick,60000);return()=>clearInterval(interval);
  },[semester]);

  useEffect(()=>{
    const notify=async()=>{
      if (!profile?.id || !currentWeek || !('Notification' in window) || Notification.permission!=='granted'
        || !('serviceWorker' in navigator) || !profile.notificationSettings
        || !(profile.notificationSettings.firstChannel.enabled||profile.notificationSettings.secondChannel?.enabled)) return;
      const now=new Date(), date=bakuDate(now);
      const weekday=new Date(date+'T12:00:00Z').getUTCDay();
      const today=filterSchedule(dbSchedule,profile.subgroup,currentWeek).filter(c=>c.day===DAYS[weekday-1]);
      const reg=await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      for (const [index,lesson] of today.entries()) {
        const start=new Date(date+'T'+lesson.time.split('-')[0]+':00+04:00');
        const diff=Math.floor((start.getTime()-now.getTime())/60000);
        const settings=profile.notificationSettings;
        const channels=[settings.firstChannel,settings.secondChannel];
        for (const [channel,setting] of channels.entries()) {
          if(!setting?.enabled || diff<0 || diff!==(index===0?setting.firstClassMinutes:setting.otherClassesMinutes)) continue;
          const key=['ec-notif',profile.id,date,lesson.id||lesson.subject,lesson.time,channel].join(':');
          try {
            if(localStorage.getItem(key)) continue;
            await reg.showNotification('📚 '+lesson.subject,{body:diff+' dəqiqə sonra — '+lesson.time+', otaq '+lesson.room,tag:key,icon:'/icon-192x192.png'});
            localStorage.setItem(key,'1');
          } catch { /* Unsupported or denied notifications must not interrupt scheduling. */ }
        }
      }
    };
    const interval=setInterval(()=>void notify().catch(()=>{}),30000);
    return()=>clearInterval(interval);
  },[profile,dbSchedule,currentWeek]);

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

  if (loadError && !profile) return <div role="alert" className="p-8">{loadError}<Button onClick={()=>window.location.reload()}>Yenilə</Button></div>;

  if (!profile?.group_id) {
    return <Onboarding onComplete={async (p) => {
      const newProfile: UserProfile = {
        ...p,
        savedGrades: {},
        savedDetails: {},
        notificationSettings: DEFAULT_NOTIF_SETTINGS
      };
      try {
        const preserved={...profile,...newProfile,savedGrades:profile?.savedGrades??{},savedDetails:profile?.savedDetails??{},absences:profile?.absences??{}};
        await saveProfile(preserved);
        const loaded=await loadProfile(); latestProfile.current=loaded; setProfile(loaded);
      } catch { toast({variant:'destructive',title:'Xəta',description:'Profil saxlanmadı. Yenidən cəhd edin.'}); }

    }} />
  }

  const schedule = dbSchedule;
  const dailyClasses = filterSchedule(schedule,profile.subgroup,currentWeek??'unknown');
  const weeklyClasses = filterSchedule(schedule,profile.subgroup);
  const updateProfile = async (updatedProfile: UserProfile):Promise<boolean> => {
    // Serialize writes and merge only changed fields so rapid independent actions
    // do not erase grades, attendance or notification preferences.
    const patch=Object.fromEntries(Object.entries(updatedProfile).filter(([key,value])=>
      JSON.stringify(value)!==JSON.stringify(profile[key as keyof UserProfile])));
    let success=false;
    saveQueue.current=saveQueue.current.catch(()=>{}).then(async()=>{
      const next={...latestProfile.current,...patch} as UserProfile;
      try {await saveProfile(next);latestProfile.current=next;setProfile(next);success=true;}
      catch {toast({variant:'destructive',title:'Xəta',description:'Dəyişiklik saxlanmadı. Yenidən cəhd edin.'});}
    });
    await saveQueue.current;return success;
  };

  const handleSaveGrade = async (data: { subject: string; total: number; davamiyyat: number; serbest: number; kollokviumOrta: number; seminarOrta: number; labBal: number }) => {
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
    if (!await updateProfile(updatedProfile)) return false;
    toast({ title: "Yadda saxlanıldı", description: `${data.subject} balınız kabinetə əlavə edildi.` });
    return true;
  };

  const handleEditGrade = (subject: string) => {
    setEditingSubject(subject);
    setIsProfileOpen(false);
    setActiveTab('calculator');
  };

  const resetProfile = async () => {
    await saveQueue.current;
    const {error}=await supabase.auth.signOut();
    if(error){toast({variant:'destructive',title:'Xəta',description:'Çıxış alınmadı.'});return;}
    setProfile(null);setDbSchedule([]);window.location.replace('/login');
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
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) throw new Error('Bildiriş xidməti hazır deyil.');
        await registration.showNotification('İT24 Bildiriş Testi', {
          body: `Salam, ${profile.name}! Bu bir test bildirişidir.`,
          icon: 'https://placehold.co/192x192/4A90E2/ffffff?text=IT24',
          tag: 'test-notification'
        });
        toast({ title: "Test Göndərildi", description: "Bildiriş panelini yoxlayın!" });
      }
    } catch {
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
    if (value === 'weekly') setSelectedWeeklyWeek(currentWeek??'ust');
  };

  const logoText = profile.group || 'İT24';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg font-bold text-lg shadow-sm shrink-0">{logoText}</div>
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
                  <DialogDescription>Bildiriş sayını və vaxtını təyin edin. Xatırlatmalar tətbiq açıq olduqda işləyir.</DialogDescription>
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
                <AvatarImage src={profile.photo_url || profile.photo} />
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
                {currentWeek ? (currentWeek === 'ust' ? 'ÜST' : 'ALT') : 'TƏYİN EDİLMƏYİB'}
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
            <ProfileView subjects={Array.from(new Set(schedule.map(c=>c.subject)))} profile={profile} onUpdate={updateProfile} onEditGrade={handleEditGrade} />
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
              {loadError ? <p role="alert">{loadError}</p> : scheduleLoading ? <p>Yüklənir...</p> : <DailyView classes={dailyClasses} />}
              {!currentWeek && <p className="text-sm text-muted-foreground">Semestr başlanğıcı təyin edilməyib. Həftəlik görünüşdə üst və alt həftəni seçə bilərsiniz.</p>}
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
              <GradeCalculator key={editingSubject} initialSubject={editingSubject} subjects={Array.from(new Set([...schedule.map(c=>c.subject),...Object.keys(profile.savedGrades??{})]))} onSave={handleSaveGrade} />
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
