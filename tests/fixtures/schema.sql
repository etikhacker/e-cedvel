-- Schema-only fixture based on live information_schema, 2026-11-05. No user data.
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create schema storage;
create schema extensions;
create extension pgcrypto with schema extensions;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth,public,storage to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
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

create table storage.buckets(id text primary key,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);
insert into storage.buckets(id,public) values('avatars',true),('Materials',true);
alter table storage.objects enable row level security;
grant all on all tables in schema public,storage to anon,authenticated,service_role;
-- Deliberately permissive legacy policies: guards must contain even these.
do $$ declare t text; begin
for t in select tablename from pg_tables where schemaname='public' loop
execute format('alter table public.%I enable row level security',t);
execute format('create policy legacy_open on public.%I for all to public using(true) with check(true)',t);
end loop; end $$;
create policy legacy_storage on storage.objects for all to public using(true) with check(true);


alter table faculties add foreign key(university_id) references universities(id) on delete cascade;
alter table groups add foreign key(faculty_id) references faculties(id) on delete cascade;
alter table groups add foreign key(university_id) references universities(id) on delete cascade;
alter table profiles add foreign key(group_id) references groups(id) on delete no action;
alter table profiles add foreign key(university_id) references universities(id) on delete no action;
alter table profiles add foreign key(id) references auth.users(id) on delete cascade;
alter table schedule_lessons add foreign key(group_id) references groups(id) on delete cascade;
alter table subjects add foreign key(group_id) references groups(id) on delete cascade;
alter table university_admins add foreign key(id) references auth.users(id) on delete cascade;
alter table university_admins add foreign key(university_id) references universities(id) on delete cascade;
alter table university_invites add foreign key(university_id) references universities(id) on delete cascade;
alter table university_invites add unique(token);
