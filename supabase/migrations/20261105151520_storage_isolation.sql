-- Preserve all objects. Avatars remain intentionally public for existing photo URLs.
-- Materials become private; the application uses expiring signed download links.
begin;
update storage.buckets set public=false,file_size_limit=4194304,
  allowed_mime_types=array['application/pdf','image/jpeg','image/png','image/webp',
    'application/msword','application/vnd.ms-excel','application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation']
where id in ('Materials','materials');
update storage.buckets set file_size_limit=2097152,
  allowed_mime_types=array['image/jpeg','image/png','image/webp'] where id='avatars';

create function private.owns_storage_path(bucket text,path text,object_owner text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select auth.uid() is not null and path not like '%..%'
    and (split_part(path,'/',1)=auth.uid()::text
      or (bucket='avatars' and path='avatars/'||auth.uid()::text and object_owner=auth.uid()::text));
$$;
revoke all on function private.owns_storage_path(text,text,text) from public;
grant execute on function private.owns_storage_path(text,text,text) to authenticated;
-- These guards intersect the old broad policies, without deleting unrelated rules.
create policy storage_anon_guard on storage.objects as restrictive for all to anon
using(bucket_id='avatars') with check(false);
create policy storage_read_guard on storage.objects as restrictive for select to authenticated
using(bucket_id not in ('Materials','materials','avatars') or bucket_id='avatars'
  or private.owns_storage_path(bucket_id,name,owner_id));
create policy storage_insert_guard on storage.objects as restrictive for insert to authenticated
with check(bucket_id not in ('Materials','materials','avatars'));
create policy storage_update_guard on storage.objects as restrictive for update to authenticated
using(bucket_id not in ('Materials','materials','avatars'))
with check(bucket_id not in ('Materials','materials','avatars'));
create policy storage_delete_guard on storage.objects as restrictive for delete to authenticated
using(bucket_id not in ('Materials','materials','avatars') or private.owns_storage_path(bucket_id,name,owner_id));
create policy own_storage_access on storage.objects as permissive for all to authenticated
using(bucket_id in ('Materials','materials','avatars') and private.owns_storage_path(bucket_id,name,owner_id))
with check(bucket_id in ('Materials','materials','avatars') and private.owns_storage_path(bucket_id,name,owner_id));
create policy public_avatar_read on storage.objects for select to anon,authenticated using(bucket_id='avatars');
commit;
