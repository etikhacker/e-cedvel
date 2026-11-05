import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
export async function serverSupabase() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{
    cookies: {
      getAll: () => jar.getAll(),
      setAll: values => { try { values.forEach(({name,value,options})=>jar.set(name,value,options)); } catch {
        // Server Components cannot write cookies; proxy handles their refresh.
      } },
    },
  });
}
export function serviceSupabase() {
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Server configuration missing');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
