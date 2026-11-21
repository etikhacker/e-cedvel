-- LOCAL RECOVERY COPY ONLY. psql -v ON_ERROR_STOP=1. All fixtures roll back.
begin;
do $$ begin
  if current_database() <> 'ec_restore' then
    raise exception 'Run only in the isolated ec_restore recovery database';
  end if;
end $$;
create function pg_temp.assert_true(value boolean, label text) returns void
language plpgsql as $$ begin
  if value is distinct from true then raise exception 'FAILED: %', label; end if;
end $$;
create function pg_temp.expect_failure(command text, expected_state text) returns void
language plpgsql as $$ begin
  begin
    execute command;
  exception when others then
    if sqlstate = expected_state then return; end if;
    raise;
  end;
  raise exception 'Expected failure %', expected_state using errcode='XX000';
end $$;

insert into auth.users(id,email,email_confirmed_at) values
('90000000-0000-4000-8000-000000000001','admin-a@rehearsal.invalid',now()),
('90000000-0000-4000-8000-000000000002','student-a@rehearsal.invalid',now()),
('90000000-0000-4000-8000-000000000003','student-b@rehearsal.invalid',now()),
('90000000-0000-4000-8000-000000000004','super@rehearsal.invalid',now()),
('90000000-0000-4000-8000-000000000005','invited@rehearsal.invalid',now());
insert into public.universities(id,name) values
('90000000-0000-4000-8000-000000000101','Rehearsal A'),
('90000000-0000-4000-8000-000000000102','Rehearsal B');
insert into public.faculties(id,name,university_id) values
('90000000-0000-4000-8000-000000000201','A','90000000-0000-4000-8000-000000000101'),
('90000000-0000-4000-8000-000000000202','B','90000000-0000-4000-8000-000000000102');
insert into public.groups(id,name,faculty_id,university_id) values
('90000000-0000-4000-8000-000000000301','A1','90000000-0000-4000-8000-000000000201','90000000-0000-4000-8000-000000000101'),
('90000000-0000-4000-8000-000000000302','A2','90000000-0000-4000-8000-000000000201','90000000-0000-4000-8000-000000000101'),
('90000000-0000-4000-8000-000000000303','B1','90000000-0000-4000-8000-000000000202','90000000-0000-4000-8000-000000000102');
insert into public.university_admins(id,role,university_id) values
('90000000-0000-4000-8000-000000000001','university_admin','90000000-0000-4000-8000-000000000101'),
('90000000-0000-4000-8000-000000000004','superadmin',null);
insert into public.profiles(id,name,group_id,university_id,subgroup) values
('90000000-0000-4000-8000-000000000002','A','90000000-0000-4000-8000-000000000301','90000000-0000-4000-8000-000000000101','ust'),
('90000000-0000-4000-8000-000000000003','B','90000000-0000-4000-8000-000000000303','90000000-0000-4000-8000-000000000102','alt');
insert into public.schedule_lessons(group_id,subject,day,time,teacher,room,week,subgroup) values
('90000000-0000-4000-8000-000000000301','A','Şənbə','09:00-10:30','Teacher A','Room A','ust','ust'),
('90000000-0000-4000-8000-000000000303','B','Şənbə','09:00-10:30','Teacher A','Room A','ust','ust');

set local role anon;
select pg_temp.expect_failure('select token from public.university_invites','42501');
select pg_temp.expect_failure('select * from public.schedule_lessons','42501');
select pg_temp.expect_failure($q$insert into public.university_admins(id,role) values('90000000-0000-4000-8000-000000000005','superadmin')$q$,'42501');
select pg_temp.assert_true((select count(*)=0 from storage.objects where bucket_id='Materials'),'anonymous material isolation');
reset role;

select set_config('request.jwt.claim.sub','90000000-0000-4000-8000-000000000002',true) is not null;
select set_config('request.jwt.claim.role','authenticated',true) is not null;
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.muracietler),'student application isolation');
select pg_temp.assert_true((select count(*)=1 from public.profiles),'own profile only');
select pg_temp.assert_true((select count(*)=1 from public.schedule_lessons),'own group schedule only');
select pg_temp.expect_failure($q$insert into public.university_admins(id,role) values('90000000-0000-4000-8000-000000000002','superadmin')$q$,'42501');
select pg_temp.expect_failure($q$update public.profiles set group_id='90000000-0000-4000-8000-000000000303' where id=auth.uid()$q$,'42501');
select pg_temp.expect_failure($q$insert into storage.objects(bucket_id,name) values('avatars','90000000-0000-4000-8000-000000000002/forged.png')$q$,'42501');
reset role;

select set_config('request.jwt.claim.sub','90000000-0000-4000-8000-000000000001',true) is not null;
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.schedule_lessons where group_id='90000000-0000-4000-8000-000000000303'),'admin A cannot read tenant B lessons');
select pg_temp.expect_failure($q$insert into public.faculties(name,university_id) values('X','90000000-0000-4000-8000-000000000102')$q$,'42501');
select pg_temp.expect_failure($q$insert into public.schedule_lessons(group_id,subject,day,time,teacher,room,week,subgroup) values('90000000-0000-4000-8000-000000000302','X','Şənbə','10:00-11:30','Other','Room A','ust','alt')$q$,'23P01');
select pg_temp.expect_failure($q$insert into public.schedule_lessons(group_id,subject,day,time,teacher,room,week,subgroup) values('90000000-0000-4000-8000-000000000302','X','Şənbə','10:00-11:30','Teacher A','Other','ust','alt')$q$,'23P01');
select pg_temp.expect_failure($q$insert into public.schedule_lessons(group_id,subject,day,time,teacher,room,week,subgroup) values('90000000-0000-4000-8000-000000000301','X','Şənbə','10:00-11:30','Other','Other','ust','hamisi')$q$,'23P01');
select pg_temp.expect_failure($q$insert into public.schedule_lessons(group_id,subject,day,time) values('90000000-0000-4000-8000-000000000302','X','Şənbə','12:00-11:00')$q$,'23514');
insert into public.schedule_lessons(group_id,subject,day,time,teacher,room,week,subgroup) values
('90000000-0000-4000-8000-000000000302','Adjacent','Şənbə','10:30-12:00','Teacher A','Room A','ust','alt'),
('90000000-0000-4000-8000-000000000302','Alternating','Şənbə','09:00-10:30','Teacher A','Room A','alt','alt');
reset role;

select set_config('request.jwt.claim.sub','90000000-0000-4000-8000-000000000004',true) is not null;
set local role authenticated;
select public.create_invitation('invited@rehearsal.invalid','90000000-0000-4000-8000-000000000101',repeat('a',64)) is not null as invitation_created;
select pg_temp.expect_failure($q$select public.create_invitation('invited@rehearsal.invalid','90000000-0000-4000-8000-000000000101',repeat('b',64))$q$,'P0001');
reset role;
update public.university_invites set delivery_status='sent' where token_hash=repeat('a',64);
select set_config('request.jwt.claim.sub','90000000-0000-4000-8000-000000000002',true) is not null;
set local role authenticated;
select pg_temp.expect_failure($q$select public.consume_invitation(repeat('a',64))$q$,'P0001');
reset role;
select set_config('request.jwt.claim.sub','90000000-0000-4000-8000-000000000005',true) is not null;
set local role authenticated;
select public.consume_invitation(repeat('a',64));
select pg_temp.assert_true((select role='university_admin' from public.university_admins where id=auth.uid()),'invitation role assignment');
select pg_temp.expect_failure($q$select public.consume_invitation(repeat('a',64))$q$,'P0001');
reset role;
select 'PASS: restored-copy RLS, two-tenant isolation, conflicts, Storage and invitation replay' as result;
rollback;
