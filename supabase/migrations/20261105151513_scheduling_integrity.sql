begin;
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions;

create function public.lesson_minutes(value text) returns int4range
language plpgsql immutable strict set search_path = '' as $$
declare a integer; b integer;
begin
  if value !~ '^([01][0-9]|2[0-3]):[0-5][0-9]-([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'Invalid lesson time' using errcode='23514';
  end if;
  a := substring(value,1,2)::integer*60+substring(value,4,2)::integer;
  b := substring(value,7,2)::integer*60+substring(value,10,2)::integer;
  if a>=b then raise exception 'Invalid lesson time' using errcode='23514'; end if;
  return int4range(a,b,'[)');
end $$;
create function public.lesson_cycle(value text) returns int4range
language sql immutable set search_path = '' as $$
  select case value when 'ust' then int4range(1,2,'[)') when 'alt' then int4range(2,3,'[)') else int4range(1,3,'[)') end;
$$;
create function public.resource_key(value text) returns text
language sql immutable set search_path = '' as $$ select lower(regexp_replace(trim(value),'\s+',' ','g')); $$;

alter table public.schedule_lessons add column university_id uuid references public.universities(id);
update public.schedule_lessons l set university_id=g.university_id from public.groups g where g.id=l.group_id;
alter table public.schedule_lessons alter column university_id set not null;
alter table public.schedule_lessons alter column group_id set not null;
update public.schedule_lessons set week='hamisi' where week is null;
update public.schedule_lessons set subgroup='hamisi' where subgroup is null;
alter table public.schedule_lessons alter column week set not null;
alter table public.schedule_lessons alter column subgroup set not null;
alter table public.schedule_lessons add constraint valid_lesson_values check(
  week in ('ust','alt','hamisi') and subgroup in ('ust','alt','hamisi')
  and day in ('Bazar ertəsi','Çərşənbə axşamı','Çərşənbə','Cümə axşamı','Cümə','Şənbə')
  and length(trim(subject)) between 1 and 200);
alter table public.schedule_lessons add constraint lesson_group_tenant
  foreign key(group_id,university_id) references public.groups(id,university_id);
-- Derive tenancy rather than trusting a browser-supplied university.
create function private.lesson_tenant() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  select university_id into new.university_id from public.groups where id=new.group_id;
  if new.university_id is null then raise exception 'Invalid group' using errcode='23514'; end if;
  perform public.lesson_minutes(new.time);
  return new;
end $$;
create trigger lesson_tenant before insert or update on public.schedule_lessons
for each row execute function private.lesson_tenant();
-- GiST exclusion constraints lock conflicting index entries across transactions.
-- Unlike SELECT-before-INSERT or an advisory-lock trigger, they cannot race under MVCC.
-- If legacy overlaps exist this migration FAILS atomically. Resolve them explicitly;
-- do not remove constraints or silently delete lessons.
alter table public.schedule_lessons add constraint no_room_overlap exclude using gist
  (university_id with =, day with =, (public.resource_key(room)) with =,
   (public.lesson_minutes(time)) with &&, (public.lesson_cycle(week)) with &&)
  where (room is not null and trim(room)<>'');
alter table public.schedule_lessons add constraint no_teacher_overlap exclude using gist
  (university_id with =, day with =, (public.resource_key(teacher)) with =,
   (public.lesson_minutes(time)) with &&, (public.lesson_cycle(week)) with &&)
  where (teacher is not null and trim(teacher)<>'');
alter table public.schedule_lessons add constraint no_group_overlap exclude using gist
  (group_id with =, day with =, (public.lesson_minutes(time)) with &&,
   (public.lesson_cycle(week)) with &&, (public.lesson_cycle(subgroup)) with &&);
create index lessons_group_idx on public.schedule_lessons(group_id);

alter table public.subjects add column university_id uuid references public.universities(id);
update public.subjects s set university_id=g.university_id from public.groups g where s.group_id=g.id;
alter table public.subjects add constraint subject_tenant_required check(university_id is not null) not valid;
alter table public.subjects add constraint subject_group_tenant foreign key(group_id,university_id)
  references public.groups(id,university_id) not valid;
drop policy subject_guard on public.subjects;
create policy subject_guard on public.subjects as restrictive for all to authenticated
using(private.manages(university_id)) with check(private.manages(university_id));
create index subjects_tenant_idx on public.subjects(university_id);
commit;
