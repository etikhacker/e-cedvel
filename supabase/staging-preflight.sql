-- PREPARED ONLY; NOT EXECUTED. Read-only metadata, no credentials or user rows.
-- Manually select the separate staging project in Dashboard before running later.
-- current_database() is NOT proof of the Supabase project ref; inspect Dashboard URL.
select current_setting('server_version') as postgres_version, current_user;
select name,default_version,installed_version from pg_available_extensions
where name in ('pgcrypto','btree_gist');
select e.extname,e.extversion,n.nspname as extension_schema
from pg_extension e join pg_namespace n on n.oid=e.extnamespace
where e.extname in ('pgcrypto','btree_gist');
select rolname from pg_roles where rolname in ('postgres','anon','authenticated','service_role');
select to_regclass('auth.users') as auth_users,
       to_regclass('storage.buckets') as storage_buckets,
       to_regclass('storage.objects') as storage_objects,
       to_regprocedure('auth.uid()') as auth_uid;
select table_schema,table_name,column_name,data_type
from information_schema.columns
where (table_schema='auth' and table_name='users' and column_name in ('id','email','email_confirmed_at'))
   or (table_schema='storage' and table_name='objects' and column_name in ('bucket_id','name','owner_id'))
   or (table_schema='storage' and table_name='buckets' and column_name in ('id','name','public','file_size_limit','allowed_mime_types'))
order by 1,2,3;
-- Fresh project: all ten app tables below must be absent BEFORE bootstrap.
select tablename from pg_tables where schemaname='public'
and tablename in ('universities','faculties','groups','profiles','university_admins',
  'university_invites','schedule_lessons','subjects','muracietler','university_requests');
-- Existing names need review: migrations intentionally are not idempotent.
select n.nspname,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where (n.nspname='private' and p.proname in ('is_superadmin','manages','create_invitation','consume_invitation','lesson_tenant','owns_storage_path'))
or (n.nspname='public' and p.proname in ('create_invitation','consume_invitation','approve_university_request','lesson_minutes','lesson_cycle','resource_key'));
