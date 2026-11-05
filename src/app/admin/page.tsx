import { redirect } from 'next/navigation';
import { serverSupabase } from '@/lib/supabase/server';
import AdminClient from './admin-client';
import UniversityAdmin from './university_admin';
export default async function AdminPage() {
  const db=await serverSupabase();
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user)redirect('/login');
  const {data:admin,error:roleError}=await db.from('university_admins').select('role').eq('id',user.id).maybeSingle();
  if(roleError||!admin)redirect('/dashboard');
  if(admin.role==='superadmin')return <AdminClient/>;
  if(['university_admin','admin'].includes(admin.role))return <UniversityAdmin/>;
  redirect('/dashboard');
}
