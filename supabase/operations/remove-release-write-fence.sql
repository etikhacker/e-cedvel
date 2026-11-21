-- ONLY after compatible app/Auth/DB/Edge are ready, or a pre-migration abort.
-- Drops only this operation's own triggers/function/schema; no CASCADE or data deletion.
begin;
set local lock_timeout = '5s';
do $$ declare r record; begin
  if session_user <> 'postgres' or current_user <> 'postgres' then
    raise exception 'Use the approved direct postgres operator session';
  end if;
  if to_regprocedure('ec_release_ops.block_client_writes()') is null then
    raise exception 'Expected release fence is absent; inspect before proceeding';
  end if;
  for r in select n.nspname,c.relname,t.tgname from pg_trigger t
    join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
    where t.tgfoid='ec_release_ops.block_client_writes()'::regprocedure and not t.tgisinternal
  loop
    execute format('drop trigger %I on %I.%I',r.tgname,r.nspname,r.relname);
  end loop;
end $$;
drop function ec_release_ops.block_client_writes();
drop schema ec_release_ops;
commit;
