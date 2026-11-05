-- Audited against samcakpeuxwegyzrlrwp on 2026-11-05. No production data is deleted.
-- Restrictive guards intersect ALL existing permissive policies; unknown policies
-- cannot widen these boundaries. Apply to a staging copy before production.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.is_superadmin() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.university_admins where id = auth.uid() and role = 'superadmin'
  );
$$;
create function private.manages(tenant uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.university_admins where id = auth.uid()
    and (role = 'superadmin' or (role in ('admin','university_admin') and university_id = tenant))
  );
$$;
revoke all on function private.is_superadmin(), private.manages(uuid) from public;
grant execute on function private.is_superadmin(), private.manages(uuid) to authenticated;

update public.university_admins set role = 'university_admin' where role = 'admin';
alter table public.university_admins add constraint valid_admin_role
  check (role is not null and (role = 'superadmin' or (role = 'university_admin' and university_id is not null))) not valid;
alter table public.profiles add column if not exists notes text not null default '';
alter table public.profiles add column if not exists notification_settings jsonb;
alter table public.universities add column if not exists semester_start date;
alter table public.universities add column if not exists first_week text not null default 'ust' check(first_week in ('ust','alt'));

-- Client roles cannot read bearer tokens or create/consume invitations directly.
revoke all on public.university_invites from public, anon, authenticated;
alter table public.university_invites enable row level security;
grant select,insert,update,delete on public.university_invites to service_role;
create policy invitation_client_guard on public.university_invites as restrictive for all to anon,authenticated using(false) with check(false);
alter table public.university_invites alter column token drop not null;
alter table public.university_invites alter column token drop default;
alter table public.university_invites add column token_hash text unique;
alter table public.university_invites add column created_by uuid references auth.users(id);
alter table public.university_invites add column consumed_by uuid references auth.users(id);
alter table public.university_invites add column delivery_status text not null default 'legacy'
  check(delivery_status in ('legacy','pending','sent','failed'));
create index invites_rate_limit on public.university_invites(created_by, created_at);
create function private.approve_university_request(p_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare application public.university_requests; tenant uuid;
begin
  if not private.is_superadmin() then raise exception 'forbidden' using errcode='42501'; end if;
  select * into application from public.university_requests where id=p_id for update;
  if not found or application.status<>'pending' then raise exception 'invalid request'; end if;
  insert into public.universities(name,short_name,city) values(application.name,application.short_name,application.city) returning id into tenant;
  update public.university_requests set status='approved' where id=p_id;
  return tenant;
end $$;
create function public.approve_university_request(p_id uuid) returns uuid
language sql security invoker set search_path = '' as $$ select private.approve_university_request(p_id); $$;
revoke all on function private.approve_university_request(uuid),public.approve_university_request(uuid) from public,anon;
grant execute on function private.approve_university_request(uuid),public.approve_university_request(uuid) to authenticated;
-- Existing raw-token links are deliberately not accepted by the new API. Reissue
-- them: their old SELECT policy exposed every token. Historical rows are retained.

create function private.create_invitation(p_email text, p_university_id uuid, p_hash text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  if not private.is_superadmin() then raise exception 'forbidden' using errcode='42501'; end if;
  if p_email is null or length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid input'; end if;
  -- Serialize per actor (rate limit) and per target (duplicate invitation).
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 1));
  perform pg_advisory_xact_lock(hashtextextended(lower(p_email), 2));
  if (select count(*) from public.university_invites where created_by=auth.uid()
      and created_at > now()-interval '1 hour') >= 10 then raise exception 'rate_limit'; end if;
  if not exists(select 1 from public.universities where id=p_university_id and is_active)
    then raise exception 'invalid university'; end if;
  if exists(select 1 from public.university_invites where lower(email)=lower(p_email)
      and not used and expires_at>now() and delivery_status in ('pending','sent'))
    or exists(select 1 from auth.users u join public.university_admins a on a.id=u.id where lower(u.email)=lower(p_email))
    then raise exception 'duplicate_invitation'; end if;
  insert into public.university_invites(email,university_id,token_hash,created_by,used,expires_at,delivery_status)
    values(lower(p_email),p_university_id,p_hash,auth.uid(),false,now()+interval '7 days','pending') returning id into result;
  return result;
end $$;
create function public.create_invitation(p_email text, p_university_id uuid, p_hash text)
returns uuid language sql security invoker set search_path = '' as $$
  select private.create_invitation(p_email,p_university_id,p_hash);
$$;

create function private.consume_invitation(p_hash text) returns void
language plpgsql security definer set search_path = '' as $$
declare invitation public.university_invites; account_email text;
begin
  if auth.uid() is null then raise exception 'forbidden' using errcode='42501'; end if;
  select email into account_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
  if account_email is null then raise exception 'confirm_email'; end if;
  select * into invitation from public.university_invites where token_hash=p_hash for update;
  if not found or invitation.used or invitation.expires_at is null or invitation.expires_at<=now()
    or invitation.delivery_status<>'sent' or lower(invitation.email)<>lower(account_email)
    then raise exception 'invalid_invitation'; end if;
  if not exists(select 1 from public.universities where id=invitation.university_id and is_active)
    then raise exception 'invalid university'; end if;
  -- PK on administrator id and locked invitation prevent concurrent reassignment/replay.
  insert into public.university_admins(id,university_id,role)
    values(auth.uid(),invitation.university_id,'university_admin');
  update public.university_invites set used=true,consumed_by=auth.uid() where id=invitation.id;
end $$;
create function public.consume_invitation(p_hash text) returns void
language sql security invoker set search_path = '' as $$ select private.consume_invitation(p_hash); $$;
revoke all on function private.create_invitation(text,uuid,text), public.create_invitation(text,uuid,text),
  private.consume_invitation(text), public.consume_invitation(text) from public, anon;
grant execute on function private.create_invitation(text,uuid,text), public.create_invitation(text,uuid,text),
  private.consume_invitation(text), public.consume_invitation(text) to authenticated;

-- A permissive baseline is always intersected with these restrictive guards.
-- Preserve existing policies for review/rollback, while immediately containing them.
do $$ declare t text; begin
  foreach t in array array['profiles','university_admins','universities','faculties','groups','schedule_lessons','subjects','muracietler','university_requests'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    execute format('grant select,insert,update,delete on public.%I to service_role',t);
    execute format('create policy hardened_allow on public.%I as permissive for all to authenticated using (true) with check (true)',t);
  end loop;
end $$;
create policy profile_guard on public.profiles as restrictive for all to public
using (auth.uid()=id) with check (auth.uid()=id and (group_id is null or exists(
  select 1 from public.groups g where g.id=profiles.group_id and g.university_id=profiles.university_id)));
create policy admin_read_guard on public.university_admins as restrictive for select to authenticated
using (id=auth.uid() or private.is_superadmin());
create policy admin_anon_guard on public.university_admins as restrictive for all to anon using(false) with check(false);
create policy admin_insert_guard on public.university_admins as restrictive for insert to authenticated with check(private.is_superadmin());
create policy admin_update_guard on public.university_admins as restrictive for update to authenticated using(private.is_superadmin()) with check(private.is_superadmin());
create policy admin_delete_guard on public.university_admins as restrictive for delete to authenticated using(private.is_superadmin());

-- Intentionally public catalogue; inactive tenants must not leak through old policies.
grant select on public.universities, public.faculties, public.groups to anon;
create policy catalog_anon_read on public.universities for select to anon using(is_active);
create policy catalog_anon_read on public.faculties for select to anon using(true);
create policy catalog_anon_read on public.groups for select to anon using(true);
create policy university_read_guard on public.universities as restrictive for select to authenticated using(is_active or private.manages(id));
create policy university_public_guard on public.universities as restrictive for select to anon using(is_active);
create policy faculty_read_guard on public.faculties as restrictive for select to authenticated using(private.manages(university_id) or exists(select 1 from public.universities u where u.id=faculties.university_id and u.is_active));
create policy faculty_public_guard on public.faculties as restrictive for select to anon using(exists(select 1 from public.universities u where u.id=faculties.university_id and u.is_active));
create policy group_read_guard on public.groups as restrictive for select to authenticated using(private.manages(university_id) or exists(select 1 from public.universities u where u.id=groups.university_id and u.is_active));
create policy group_public_guard on public.groups as restrictive for select to anon using(exists(select 1 from public.universities u where u.id=groups.university_id and u.is_active));
do $$ declare t text; predicate text; begin
  foreach t in array array['universities','faculties','groups'] loop
    predicate := case when t='universities' then 'private.is_superadmin()' else 'private.manages(university_id)' end;
    execute format('create policy write_insert_guard on public.%I as restrictive for insert to authenticated with check(%s)',t,predicate);
    execute format('create policy write_update_guard on public.%I as restrictive for update to authenticated using(%s) with check(%s)',t,predicate,predicate);
    execute format('create policy write_delete_guard on public.%I as restrictive for delete to authenticated using(%s)',t,predicate);
    execute format('revoke insert,update,delete on public.%I from anon',t);
  end loop;
end $$;
-- Scheduling records are private to assigned students and tenant administrators.
revoke all on public.schedule_lessons,public.subjects from anon;
create policy lesson_read_guard on public.schedule_lessons as restrictive for select to authenticated using(
  exists(select 1 from public.groups g where g.id=group_id and private.manages(g.university_id))
  or exists(select 1 from public.profiles p where p.id=auth.uid() and p.group_id=schedule_lessons.group_id));
do $$ declare t text; predicate text; begin
  foreach t in array array['schedule_lessons','subjects'] loop
    predicate := format('exists(select 1 from public.groups g where g.id=%I.group_id and private.manages(g.university_id))',t);
    if t='schedule_lessons' then
      execute format('create policy lesson_insert_guard on public.%I as restrictive for insert to authenticated with check(%s)',t,predicate);
      execute format('create policy lesson_update_guard on public.%I as restrictive for update to authenticated using(%s) with check(%s)',t,predicate,predicate);
      execute format('create policy lesson_delete_guard on public.%I as restrictive for delete to authenticated using(%s)',t,predicate);
    end if;
  end loop;
end $$;
-- Subjects gain a tenant column in the next migration; temporarily restrict to group-based access.
create policy subject_guard on public.subjects as restrictive for all to authenticated
using(exists(select 1 from public.groups g where g.id=subjects.group_id and private.manages(g.university_id)))
with check(exists(select 1 from public.groups g where g.id=subjects.group_id and private.manages(g.university_id)));

do $$ declare t text; begin
  foreach t in array array['muracietler','university_requests'] loop
    execute format('create policy application_read_guard on public.%I as restrictive for select to authenticated using(private.is_superadmin())',t);
    execute format('create policy application_update_guard on public.%I as restrictive for update to authenticated using(private.is_superadmin()) with check(private.is_superadmin())',t);
    execute format('create policy application_delete_guard on public.%I as restrictive for delete to authenticated using(private.is_superadmin())',t);
    execute format('revoke select,update,delete on public.%I from anon',t);
  end loop;
end $$;
-- Public applications deliberately allow INSERT only, never caller-selected status.
grant insert on public.muracietler,public.university_requests to anon;
create policy public_application on public.muracietler for insert to anon with check(true);
create policy public_application on public.university_requests for insert to anon with check(true);
create policy application_insert_guard on public.muracietler as restrictive for insert to public with check(
  status='gozlemede' and length(universitet) between 2 and 200 and length(ad_soyad) between 2 and 200
  and length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');
create policy request_insert_guard on public.university_requests as restrictive for insert to public with check(
  status='pending' and length(name) between 2 and 200 and length(contact_email)<=254
  and contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');

-- Validate cross-tenant links at the database boundary, including direct REST writes.
create unique index groups_id_tenant_unique on public.groups(id,university_id);
create unique index faculties_id_tenant_unique on public.faculties(id,university_id);
alter table public.groups add constraint group_faculty_tenant foreign key(faculty_id,university_id)
  references public.faculties(id,university_id) not valid;
alter table public.profiles add constraint profile_group_tenant foreign key(group_id,university_id)
  references public.groups(id,university_id) not valid;
alter table public.groups add constraint group_tenant_required check(university_id is not null and faculty_id is not null) not valid;
alter table public.faculties add constraint faculty_tenant_required check(university_id is not null) not valid;
alter table public.profiles add constraint profile_tenant_required check(group_id is null or university_id is not null) not valid;
alter table public.profiles add constraint profile_subgroup check(subgroup is null or subgroup in ('ust','alt','hamisi')) not valid;
create index if not exists profiles_group_idx on public.profiles(group_id);
create index if not exists groups_university_idx on public.groups(university_id);
create index if not exists faculties_university_idx on public.faculties(university_id);
commit;
