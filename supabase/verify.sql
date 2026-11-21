-- Read-only preflight/post-deployment inspection. Does not expose tokens or user content.
select c.relname as table_name,c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' order by 1;

select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
from pg_policies where schemaname in ('public','storage') order by 1,2,3;

select conrelid::regclass as table_name,conname,convalidated,pg_get_constraintdef(oid)
from pg_constraint where connamespace='public'::regnamespace order by 1,2;

select 'group_faculty_mismatch' as check_name,count(*) from public.groups g
left join public.faculties f on f.id=g.faculty_id
where f.id is null or g.university_id is null or g.university_id is distinct from f.university_id
union all
select 'profile_group_mismatch',count(*) from public.profiles p join public.groups g on g.id=p.group_id
where p.university_id is distinct from g.university_id
union all
select 'invalid_time_format',count(*) from public.schedule_lessons
where time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]-([01][0-9]|2[0-3]):[0-5][0-9]$';

select id,public,file_size_limit,allowed_mime_types from storage.buckets;
select bucket_id,count(*) as legacy_paths_needing_owner_review from storage.objects
where bucket_id in ('Materials','materials')
  and name !~ '^[0-9a-f-]{36}/' group by bucket_id;

select has_table_privilege('anon','public.university_invites','select') as anon_invites,
has_table_privilege('authenticated','public.university_invites','select') as authenticated_invites;
-- Both must be false after deployment. Verify policies with actual role identities too:
-- metadata alone is not proof of tenant isolation.
