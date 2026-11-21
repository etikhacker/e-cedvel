export const DAYS=['Bazar ertəsi','Çərşənbə axşamı','Çərşənbə','Cümə axşamı','Cümə','Şənbə'];
export function timeRange(value:string): [number,number] {
  const m=/^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!m) throw new Error('Vaxt HH:MM-HH:MM formatında olmalıdır.');
  const a=+m[1]*60+(+m[2]),b=+m[3]*60+(+m[4]);
  if (a>=b) throw new Error('Dərsin bitmə vaxtı başlama vaxtından sonra olmalıdır.');
  return [a,b];
}
export const overlaps=(a:string|null|undefined,b:string|null|undefined)=>!a||!b||a==='hamisi'||b==='hamisi'||a===b;
export const resourceKey=(value:string|null|undefined)=>(value||'').trim().replace(/\s+/g,' ').toLowerCase();
export type ConflictLesson={id?:string;group_id:string;university_id?:string;day:string;time:string;teacher:string|null;room:string|null;week:string;subgroup:string};
export function findConflicts<T extends ConflictLesson>(form:ConflictLesson,lessons:T[]): {type:'teacher'|'room'|'group';with:T}[] {
  const [a,b]=timeRange(form.time);
  const result:{type:'teacher'|'room'|'group';with:T}[]=[];
  for (const lesson of lessons) {
    if (form.id && lesson.id===form.id || lesson.day!==form.day || !overlaps(lesson.week,form.week)) continue;
    if (form.university_id && lesson.university_id && form.university_id!==lesson.university_id) continue;
    const [c,d]=timeRange(lesson.time);
    if (a>=d || c>=b) continue;
    if (resourceKey(form.teacher) && resourceKey(form.teacher)===resourceKey(lesson.teacher)) result.push({type:'teacher',with:lesson});
    if (resourceKey(form.room) && resourceKey(form.room)===resourceKey(lesson.room)) result.push({type:'room',with:lesson});
    if (form.group_id===lesson.group_id && overlaps(form.subgroup,lesson.subgroup)) result.push({type:'group',with:lesson});
  }
  return result;
}
export function filterSchedule<T extends {week:string;subgroup:string;time:string;day:string}>(lessons:T[],subgroup:string,week?:string):T[] {
  return lessons.filter(c=>(c.subgroup==='hamisi'||c.subgroup===subgroup)&&(!week||c.week==='hamisi'||c.week===week))
    .sort((a,b)=>DAYS.indexOf(a.day)-DAYS.indexOf(b.day)||timeRange(a.time)[0]-timeRange(b.time)[0]);
}
export function bakuDate(now=new Date()):string { return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Baku',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function academicWeek(start:string|null,first:'ust'|'alt'='ust',now=new Date()):'ust'|'alt'|null {
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return null;
  const delta=Date.parse(bakuDate(now))-Date.parse(start);
  if (!Number.isFinite(delta)||delta<0) return null;
  return Math.floor(delta/604800000)%2===0?first:(first==='ust'?'alt':'ust');
}
