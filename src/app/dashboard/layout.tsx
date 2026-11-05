import { redirect } from 'next/navigation';
import { serverSupabase } from '@/lib/supabase/server';
export default async function DashboardLayout({children}:{children:React.ReactNode}) {
  const db=await serverSupabase();
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user) redirect('/login');
  const {data:admin,error:roleError}=await db.from('university_admins').select('role').eq('id',user.id).maybeSingle();
  if(roleError) throw new Error('Hesab icazələri yoxlanmadı.');
  if(admin && ['superadmin','university_admin','admin'].includes(admin.role)) redirect('/admin');
  return children;
}
