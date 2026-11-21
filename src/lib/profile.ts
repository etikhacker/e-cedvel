import { supabase } from './supabase';
import type { UserProfile } from './types';
export async function loadProfile(): Promise<UserProfile|null> {
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if (authError || !user) throw new Error('Hesaba yenidən daxil olun.');
  const {data,error}=await supabase.from('profiles').select('*').eq('id',user.id).maybeSingle();
  if (error) throw new Error('Profil yüklənmədi.');
  const meta=user.user_metadata;
  // Metadata is only an initial preference, never authorization. DB validates tenancy.
  const groupId=data?.group_id || (typeof meta.group_id==='string'?meta.group_id:null);
  type GroupRow={id:string;name:string;university_id:string;faculties:{name:string}|null};
  let group: GroupRow|null=null;
  if (groupId) {
    const result=await supabase.from('groups').select('id,name,university_id,faculties!groups_faculty_id_fkey(name)').eq('id',groupId).maybeSingle();
    if (result.error) throw new Error('Qrup yüklənmədi.');
    group=result.data as GroupRow|null;
  }
  const profile:UserProfile={
    id:user.id,name:data?.name || (typeof meta.full_name==='string'?meta.full_name:'İstifadəçi'),
    subgroup:data?.subgroup || (['ust','alt','hamisi'].includes(meta.subgroup)?meta.subgroup:'hamisi'),
    group_id:group?.id,university_id:group?.university_id,group:group?.name,faculty:group?.faculties?.name,
    photo_url:data?.photo_url || undefined,photo:data?.photo_url || undefined,
    savedGrades:data?.saved_grades ?? {},savedDetails:data?.saved_details ?? {},absences:data?.absences ?? {},
    notes:data?.notes ?? '',notificationSettings:data?.notification_settings ?? undefined,
  };
  if (!data || (!data.group_id && group)) await saveProfile(profile);
  return profile;
}
export async function saveProfile(profile:UserProfile):Promise<void> {
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if (authError || !user) throw new Error('Hesaba yenidən daxil olun.');
  const {error}=await supabase.from('profiles').upsert({
    id:user.id,name:profile.name,group_id:profile.group_id||null,university_id:profile.university_id||null,
    subgroup:profile.subgroup,photo_url:profile.photo_url||profile.photo||null,
    saved_grades:profile.savedGrades??{},saved_details:profile.savedDetails??{},absences:profile.absences??{},
    notes:profile.notes??'',notification_settings:profile.notificationSettings??null,updated_at:new Date().toISOString(),
  });
  if (error) throw new Error('Dəyişiklik yadda saxlanmadı. Yenidən cəhd edin.');
}
