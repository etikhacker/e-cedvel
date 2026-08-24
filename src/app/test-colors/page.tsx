'use client';

import { DailyView, WeeklyView } from '@/components/schedule-views';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScheduleItem } from '@/lib/schedule-data';

const SAMPLE: ScheduleItem[] = [
  { subject: 'Əməliyyat sistemləri', teacher: 'Məmmədov Ə.', room: '204', time: '09:00-10:30', day: 'Bazar ertəsi', type: 'müh', week: 'ust', subgroup: 'hamisi', group: 'hamisi' },
  { subject: 'Kompüter Şəbəkələri', teacher: 'Hüseynov R.', room: '301', time: '10:45-12:15', day: 'Bazar ertəsi', type: 'lab', week: 'ust', subgroup: 'ust', group: 'hamisi' },
  { subject: 'Verilənlər bazası', teacher: 'Əliyeva S.', room: '105', time: '13:00-14:30', day: 'Çərşənbə axşamı', type: 'müh', week: 'alt', subgroup: 'hamisi', group: 'hamisi' },
  { subject: 'Diskret riyaziyyat', teacher: 'Qasımov T.', room: '202', time: '09:00-10:30', day: 'Çərşənbə', type: 'məş', week: 'hamisi', subgroup: 'alt', group: 'hamisi' },
];

export default function TestColorsPage() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Rəng Test Səhifəsi</h1>
        <p className="text-muted-foreground text-sm">Bu səhifə yalnız rənglərin düzgünlüyünü yoxlamaq üçündür.</p>
        <p className="text-xs text-muted-foreground">Gözlənilən: krem arxa plan, tünd qəhvəyi düymələr, sızdırılmış qəhvəyi muted.</p>
      </header>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Düymələr (Buttons)</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Default Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Badge-lər</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      <Separator />

      <section className="space-y-4 max-w-md">
        <h2 className="text-xl font-bold text-foreground">Form Elementləri</h2>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="email@example.com" />
          </div>
          <div className="flex items-center justify-between p-3 bg-accent rounded-xl border">
            <Label>Bildirişləri aktiv et</Label>
            <Switch />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Tabs</h2>
        <Tabs defaultValue="daily" className="w-full max-w-2xl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Günlük</TabsTrigger>
            <TabsTrigger value="weekly">Həftəlik</TabsTrigger>
            <TabsTrigger value="calc">Kalkulyator</TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="pt-4">
            <DailyView classes={SAMPLE} />
          </TabsContent>
          <TabsContent value="weekly" className="pt-4">
            <WeeklyView classes={SAMPLE} />
          </TabsContent>
          <TabsContent value="calc" className="pt-4">
            <p className="text-muted-foreground">Kalkulyator burada görünəcək.</p>
          </TabsContent>
        </Tabs>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Birbaşa WeeklyView (schedule görünüşü)</h2>
        <div className="max-w-2xl">
          <WeeklyView classes={SAMPLE} />
        </div>
      </section>

      <footer className="pt-8 border-t text-sm text-muted-foreground">
        © 2026 E-Cədvəl — Rəng test səhifəsi
      </footer>
    </div>
  );
}
