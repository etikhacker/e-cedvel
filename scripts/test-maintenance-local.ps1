# Isolated, already-restored rehearsal only. Never connects to hosted Supabase.
$ErrorActionPreference = 'Stop'
$container = 'ec-recovery-20261106'
$root = Split-Path $PSScriptRoot -Parent
$maintenanceStarted = $false
$maintenanceInstalled = $false
function Invoke-LocalSql([string]$sql) {
  $result = $sql | docker exec -i $container psql -X -v ON_ERROR_STOP=1 -U postgres -d ec_restore -At
  if ($LASTEXITCODE -ne 0) { throw 'Local SQL verification failed' }
  return $result
}
$fingerprints = @'
select format('select %L, count(*), md5(coalesce(string_agg(md5(to_jsonb(t)::text),'''' order by md5(to_jsonb(t)::text)),'''')) from %I.%I t;', n.nspname||'.'||c.relname,n.nspname,c.relname)
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where c.relkind='r' and n.nspname in ('public','auth','storage') order by n.nspname,c.relname
\gexec
'@
try {
  $inspection = docker inspect $container | ConvertFrom-Json
  if ($LASTEXITCODE -ne 0 -or $inspection.Count -ne 1) { throw 'Expected local recovery container missing' }
  if ($inspection.HostConfig.NetworkMode -ne 'none' -or $inspection.HostConfig.PortBindings.PSObject.Properties.Count -gt 0) { throw 'Recovery container must have no network or exposed ports' }
  docker start $container | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Cannot start local recovery container' }
  $maintenanceStarted = $true
  $identity = Invoke-LocalSql "select current_database()||'|'||(select count(*) from pg_trigger where tgname='ec_release_write_fence');"
  if ($identity -ne 'ec_restore|0') { throw 'Unexpected database or existing maintenance guard' }
  $before = @(Invoke-LocalSql $fingerprints)
  Invoke-LocalSql (Get-Content -Raw (Join-Path $root 'supabase/operations/install-release-write-fence.sql')) | Out-Null
  $maintenanceInstalled = $true
  Invoke-LocalSql (Get-Content -Raw (Join-Path $root 'supabase/tests/release-write-fence.sql')) | Out-Null
  Write-Output 'MAINTENANCE_ENABLED_AND_ROLE_CHECKS_PASSED'
  Invoke-LocalSql (Get-Content -Raw (Join-Path $root 'supabase/operations/remove-release-write-fence.sql')) | Out-Null
  $maintenanceInstalled = $false
  Invoke-LocalSql @'
begin;
do $$ begin
  if exists(select 1 from pg_trigger where tgname='ec_release_write_fence') or to_regnamespace('ec_release_ops') is not null then
    raise exception 'Maintenance objects remain';
  end if;
end $$;
set session authorization authenticator;
set local role service_role;
update public.universities set name=name where false;
reset role;
reset session authorization;
set session authorization supabase_storage_admin;
update storage.objects set name=name where false;
reset session authorization;
rollback;
'@ | Out-Null
  $after = @(Invoke-LocalSql $fingerprints)
  if (Compare-Object $before $after) { throw 'Local table fingerprints changed' }
  Write-Output "MAINTENANCE_REMOVED_AND_DATA_PRESERVED tables=$($after.Count)"
} finally {
  try {
    if ($maintenanceInstalled) { Invoke-LocalSql (Get-Content -Raw (Join-Path $root 'supabase/operations/remove-release-write-fence.sql')) | Out-Null }
  } finally {
    if ($maintenanceStarted) {
      docker stop $container | Out-Null
      if ($LASTEXITCODE -ne 0) { throw 'Local recovery container did not stop' }
      $maintenanceFinalState = docker inspect $container --format '{{.State.Status}}'
      if ($LASTEXITCODE -ne 0 -or $maintenanceFinalState -ne 'exited') { throw 'Local recovery stop verification failed' }
      Write-Output 'LOCAL_RECOVERY_CONTAINER_STOPPED'
    }
  }
}
