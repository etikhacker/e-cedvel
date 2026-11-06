-- New fence checks only, not a repeat of migration/RLS audit. Fixtures roll back.
begin;
do $$ begin
  if current_database() <> 'ec_restore' then raise exception 'LOCAL RECOVERY DATABASE ONLY'; end if;
  if (select count(*) from pg_trigger where tgname='ec_release_write_fence' and tgenabled='O') <> 11 then
    raise exception 'Expected fence on 10 public tables and storage.objects';
  end if;
end $$;
-- This operator write must remain possible for migration backfills (zero rows).
update public.universities set name=name where false;
create function public.ec_release_probe() returns void language plpgsql security definer set search_path='' as $$
begin update public.universities set name=name where false; end $$;
grant execute on function public.ec_release_probe() to anon, authenticated, service_role;
-- Grant only inside this rolled-back local fixture to prove the fence itself,
-- independently of whichever RLS/table grants a restored snapshot contains.
grant update on public.universities to anon, authenticated;
set session authorization authenticator;
set local role anon;
do $$ begin
  begin update public.universities set name=name where false; raise exception 'Anonymous direct bypass';
  exception when sqlstate 'PT503' then null; end;
  begin perform public.ec_release_probe(); raise exception 'Anonymous definer bypass';
  exception when sqlstate 'PT503' then null; end;
end $$;
set local role authenticated;
do $$ begin
  begin update public.universities set name=name where false; raise exception 'Authenticated direct bypass';
  exception when sqlstate 'PT503' then null; end;
  begin perform public.ec_release_probe(); raise exception 'Authenticated definer bypass';
  exception when sqlstate 'PT503' then null; end;
end $$;
set local role service_role;
do $$ begin
  begin update public.universities set name=name where false; raise exception 'Service role bypass';
  exception when sqlstate 'PT503' then null; end;
  begin perform public.ec_release_probe(); raise exception 'Service role definer bypass';
  exception when sqlstate 'PT503' then null; end;
end $$;
reset role;
reset session authorization;
set session authorization supabase_storage_admin;
do $$ begin
  begin update storage.objects set name=name where false; raise exception 'Storage bypass';
  exception when sqlstate 'PT503' then null; end;
end $$;
reset session authorization;
rollback;
