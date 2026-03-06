import { supabase } from './supabase';
import { UserProfile } from './types';

export async function loadProfile(): Promise<UserProfile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !data) return null;

  return {
    name: data.full_name,
    group: data.group,
    subgroup: data.subgroup,
    photo: data.photo,
    savedGrades: data.saved_grades || {},
    savedDetails: data.saved_details || {},
    notes: data.notes || '',
    absences: data.absences || {},
  };
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await supabase.from('profiles').upsert({
    id: session.user.id,
    full_name: profile.name,
    group: profile.group,
    subgroup: profile.subgroup,
    photo: profile.photo,
    saved_grades: profile.savedGrades || {},
    saved_details: profile.savedDetails || {},
    notes: profile.notes || '',
    absences: profile.absences || {},
  });
}