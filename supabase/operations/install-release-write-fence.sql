-- OPERATOR RUNBOOK ONLY. Not a migration; never run automatically.
-- Requires explicit production cutover approval. Rehearse on ec_restore first.
-- No business rows are changed. Existing writes drain under table DDL locks.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
do $$ begin
  if session_user <> 'postgres' or current_user <> 'postgres' then
    raise exception 'Use the approved direct postgres operator session';
  end if;
end $$;
-- Deliberately fail on a name collision instead of replacing someone else's objects.
create schema ec_release_ops;
revoke all on schema ec_release_ops from public, anon, authenticated, service_role;
create function ec_release_ops.block_client_writes() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  -- current_user alone is unsafe: a SECURITY DEFINER RPC can become postgres.
  -- SET ROLE from a privileged local test session must also remain blocked.
  if session_user <> 'postgres' or current_setting('role', true) not in ('none','postgres') then
    raise exception using errcode='PT503', message='Scheduled maintenance: writes are temporarily unavailable';
  end if;
  return null; -- statement trigger; direct operator writes/migration backfills continue
end $$;
revoke all on function ec_release_ops.block_client_writes() from public, anon, authenticated, service_role;
do $$ declare r record; begin
  for r in select n.nspname,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where c.relkind in ('r','p') and (n.nspname='public' or (n.nspname='storage' and c.relname='objects'))
    order by n.nspname,c.relname
  loop
    execute format('create trigger ec_release_write_fence before insert or update or delete or truncate on %I.%I for each statement execute function ec_release_ops.block_client_writes()',r.nspname,r.relname);
  end loop;
end $$;
commit;
