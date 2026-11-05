-- EMPTY Supabase project only. Never run against an existing database.
-- Schema snapshot (no user data), inspected 2026-11-05. Existing projects start
-- with migrations/, not this file. CREATE TABLE intentionally fails if it exists.
begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create table public."faculties" (
"id" uuid primary key not null default gen_random_uuid(),
"university_id" uuid,
"name" text not null,
"created_at" timestamp with time zone default now()
);
create table public."groups" (
"id" uuid primary key not null default gen_random_uuid(),
"faculty_id" uuid,
"university_id" uuid,
"name" text not null,
"created_at" timestamp with time zone default now()
);
create table public."muracietler" (
"id" uuid primary key not null default gen_random_uuid(),
"universitet" text not null,
"qisa_ad" text,
"seher" text,
"ad_soyad" text not null,
"email" text not null,
"telefon" text,
"status" text default 'gozlemede'::text,
"created_at" timestamp with time zone default now()
);
create table public."profiles" (
"id" uuid primary key not null,
"name" text,
"photo_url" text,
"absences" jsonb default '{}'::jsonb,
"saved_grades" jsonb default '{}'::jsonb,
"saved_details" jsonb default '{}'::jsonb,
"updated_at" timestamp with time zone default now(),
"group_id" uuid,
"university_id" uuid,
"subgroup" text
);
create table public."schedule_lessons" (
"id" uuid primary key not null default gen_random_uuid(),
"group_id" uuid,
"subject" text not null,
"teacher" text,
"room" text,
"day" text not null,
"time" text not null,
"week" text default 'hamisi'::text,
"subgroup" text default 'hamisi'::text,
"created_at" timestamp with time zone default now(),
"type" text default 'mesqele'::text
);
create table public."subjects" (
"id" uuid primary key not null default gen_random_uuid(),
"group_id" uuid,
"name" text not null,
"teacher" text,
"created_at" timestamp with time zone default now()
);
create table public."universities" (
"id" uuid primary key not null default gen_random_uuid(),
"name" text not null,
"short_name" text,
"city" text,
"logo_url" text,
"is_active" boolean default true,
"created_at" timestamp with time zone default now()
);
create table public."university_admins" (
"id" uuid primary key not null,
"university_id" uuid,
"role" text default 'admin'::text,
"created_at" timestamp with time zone default now()
);
create table public."university_invites" (
"id" uuid primary key not null default gen_random_uuid(),
"email" text not null,
"university_id" uuid,
"token" text not null default encode(extensions.gen_random_bytes(32), 'hex'::text),
"used" boolean default false,
"created_at" timestamp with time zone default now(),
"expires_at" timestamp with time zone
);
create table public."university_requests" (
"id" uuid primary key not null default gen_random_uuid(),
"name" text not null,
"short_name" text,
"city" text,
"contact_email" text not null,
"contact_name" text,
"phone" text,
"status" text default 'pending'::text,
"created_at" timestamp with time zone default now()
);
alter table public.faculties add foreign key(university_id) references public.universities(id) on delete cascade;
alter table public.groups add foreign key(faculty_id) references public.faculties(id) on delete cascade;
alter table public.groups add foreign key(university_id) references public.universities(id) on delete cascade;
alter table public.profiles add foreign key(group_id) references public.groups(id) on delete no action;
alter table public.profiles add foreign key(university_id) references public.universities(id) on delete no action;
alter table public.profiles add foreign key(id) references auth.users(id) on delete cascade;
alter table public.schedule_lessons add foreign key(group_id) references public.groups(id) on delete cascade;
alter table public.subjects add foreign key(group_id) references public.groups(id) on delete cascade;
alter table public.university_admins add foreign key(id) references auth.users(id) on delete cascade;
alter table public.university_admins add foreign key(university_id) references public.universities(id) on delete cascade;
alter table public.university_invites add foreign key(university_id) references public.universities(id) on delete cascade;
alter table public.university_invites add unique(token);
-- Keep the empty base fail-closed until the authorization migrations run.
do $$ declare t text; begin
for t in select tablename from pg_tables where schemaname='public' loop
execute format('alter table public.%I enable row level security',t);
end loop; end $$;
insert into storage.buckets(id,name,public) values('avatars','avatars',true),('Materials','Materials',false);
commit;
