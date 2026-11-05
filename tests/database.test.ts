import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {btree_gist} from '@electric-sql/pglite/contrib/btree_gist';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
const id=(n:number)=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
test('PostgreSQL migrations and tenant authorization',async t=>{
  const db=new PGlite({extensions:{btree_gist,pgcrypto}});
  try {
    await db.exec(await readFile('tests/fixtures/schema.sql','utf8'));
    for(const name of (await readdir('supabase/migrations')).filter(n=>n.endsWith('.sql')).sort())
      await db.exec(await readFile('supabase/migrations/'+name,'utf8'));
    await db.exec(`
      insert into auth.users(id,email,email_confirmed_at) values
      ('${id(1)}','super@example.az',now()),('${id(2)}','admin@example.az',now()),
      ('${id(3)}','student@example.az',now()),('${id(4)}','other@example.az',now()),
      ('${id(5)}','invite@example.az',now()),('${id(6)}','unconfirmed@example.az',null);
      insert into universities(id,name) values('${id(101)}','A'),('${id(102)}','B');
      insert into faculties(id,name,university_id) values('${id(201)}','A','${id(101)}'),('${id(202)}','B','${id(102)}');
      insert into groups(id,name,faculty_id,university_id) values
      ('${id(301)}','A1','${id(201)}','${id(101)}'),('${id(302)}','A2','${id(201)}','${id(101)}'),('${id(303)}','B1','${id(202)}','${id(102)}');
      insert into university_admins(id,role,university_id) values('${id(1)}','superadmin',null),('${id(2)}','university_admin','${id(101)}');
      insert into profiles(id,name,group_id,university_id,subgroup,saved_grades) values
      ('${id(3)}','Student','${id(301)}','${id(101)}','ust','{"Math":42}'),
      ('${id(4)}','Other','${id(303)}','${id(102)}','alt','{}');
      insert into muracietler(universitet,ad_soyad,email) values('University','Example Person','x@example.az');
    `);
    const role=async(user:number|null,kind='authenticated')=>{
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user?id(user):'']);
      await db.exec('set role '+kind);
    };
    const denied=async(sql:string)=>assert.rejects(()=>db.query(sql),/permission|policy|forbidden/i);
    await t.test('anonymous cannot enumerate tokens or promote accounts',async()=>{
      await role(null,'anon');
      await denied('select * from university_invites');
      await denied(`insert into university_admins(id,role) values('${id(6)}','superadmin')`);
      await denied('select * from schedule_lessons');
    });
    await t.test('student cannot self-promote or read/change applications',async()=>{
      await role(3);
      await denied(`insert into university_admins(id,role) values('${id(3)}','superadmin')`);
      assert.equal((await db.query('select * from muracietler')).rows.length,0);
      assert.equal((await db.query("update muracietler set status='qebul' returning id")).rows.length,0);
      assert.equal((await db.query('delete from muracietler returning id')).rows.length,0);
      await denied(`select create_invitation('x@example.az','${id(101)}','${'a'.repeat(64)}')`);
    });
    await t.test('profile persistence preserves grades and rejects another account/tenant',async()=>{
      await role(3);
      await db.query("update profiles set notes='Əla',absences='{\"Math\":2}' where id=$1",[id(3)]);
      const saved=await db.query<{saved_grades:unknown;notes:string}>('select saved_grades,notes from profiles');
      assert.deepEqual(saved.rows,[{saved_grades:{Math:42},notes:'Əla'}]);
      await assert.rejects(()=>db.query('update profiles set group_id=$1 where id=$2',[id(303),id(3)]),/policy|foreign key/i);
      await denied(`insert into profiles(id,name) values('${id(5)}','intruder')`);
    });
    await t.test('university admin is isolated from another tenant and platform applications',async()=>{
      await role(2);
      await denied(`insert into faculties(name,university_id) values('wrong','${id(102)}')`);
      assert.equal((await db.query(`update universities set name='hacked' where id='${id(102)}' returning id`)).rows.length,0);
      assert.equal((await db.query('select * from muracietler')).rows.length,0);
      await assert.rejects(()=>db.query(`insert into groups(name,faculty_id,university_id) values('wrong','${id(202)}','${id(101)}')`),/foreign key/i);
    });
    const lesson=(group:number,time='09:00-10:30',week='hamisi',subgroup='ust',room='101',teacher='Teacher')=>
      db.query('insert into schedule_lessons(group_id,subject,day,time,week,subgroup,room,teacher) values($1,$2,$3,$4,$5,$6,$7,$8)',
      [id(group),'Math','Şənbə',time,week,subgroup,room,teacher]);
    await t.test('database rejects partial teacher/room/group overlaps and invalid time',async()=>{
      await role(2);await lesson(301);
      await assert.rejects(()=>lesson(302,'10:00-11:30','hamisi','alt'),/exclusion/i);
      await assert.rejects(()=>lesson(301,'10:00-11:30','hamisi','hamisi','102','Other'),/exclusion/i);
      await assert.rejects(()=>lesson(302,'12:00-11:00'),/Invalid lesson time/i);
      await lesson(301,'09:00-10:30','hamisi','alt','102','Other');
      await lesson(302,'10:30-12:00');
      await denied(`insert into schedule_lessons(group_id,subject,day,time) values('${id(303)}','Bad','Şənbə','09:00-10:30')`);
    });
    await t.test('student schedule reads only its group; private schedule not public catalog',async()=>{
      await role(3);
      const result=await db.query<{group_id:string}>('select group_id from schedule_lessons');
      assert.equal(result.rows.length,2);
      assert.ok(result.rows.every(r=>r.group_id===id(301)));
    });
    let invitation:string;
    await t.test('superadmin invitation is hashed, duplicate protected, email bound',async()=>{
      await role(1);
      const result=await db.query<{create_invitation:string}>(`select create_invitation('invite@example.az','${id(101)}','${'b'.repeat(64)}')`);
      invitation=result.rows[0].create_invitation;
      await assert.rejects(()=>db.query(`select create_invitation('invite@example.az','${id(101)}','${'c'.repeat(64)}')`),/duplicate_invitation/);
      await db.exec('reset role');
      await db.query("update university_invites set delivery_status='sent' where id=$1",[invitation]);
      await role(3);
      await assert.rejects(()=>db.query(`select consume_invitation('${'b'.repeat(64)}')`),/invalid_invitation/);
      await role(6);
      await assert.rejects(()=>db.query(`select consume_invitation('${'b'.repeat(64)}')`),/confirm_email/);
    });
    await t.test('expired/invalid invitations fail and consumption is one-time atomic',async()=>{
      await db.exec('reset role');
      await db.query("update university_invites set expires_at=now()-interval '1 second' where id=$1",[invitation]);
      await role(5);
      await assert.rejects(()=>db.query(`select consume_invitation('${'b'.repeat(64)}')`),/invalid_invitation/);
      await assert.rejects(()=>db.query(`select consume_invitation('${'f'.repeat(64)}')`),/invalid_invitation/);
      await db.exec('reset role');
      await db.query("update university_invites set expires_at=now()+interval '1 hour' where id=$1",[invitation]);
      await role(5);await db.query(`select consume_invitation('${'b'.repeat(64)}')`);
      assert.equal((await db.query<{role:string}>('select role from university_admins')).rows[0].role,'university_admin');
      await assert.rejects(()=>db.query(`select consume_invitation('${'b'.repeat(64)}')`),/invalid_invitation/);
    });
    await t.test('invitation rate limit persists across independent requests',async()=>{
      await role(1);
      for(let i=0;i<9;i++)await db.query('select create_invitation($1,$2,$3)',['rate'+i+'@example.az',id(101),String(i).repeat(64)]);
      await assert.rejects(()=>db.query('select create_invitation($1,$2,$3)',['last@example.az',id(101),'a'.repeat(64)]),/rate_limit/);
    });
    await t.test('inactive university does not leak through legacy public policies',async()=>{
      await db.exec('reset role');
      await db.query("insert into universities(name,is_active) values('Hidden',false)");
      await role(null,'anon');
      assert.equal((await db.query("select * from universities where name='Hidden'")).rows.length,0);
    });
    await t.test('Storage paths isolated, direct uploads denied, old avatar URLs retained',async()=>{
      await db.exec('reset role');
      await db.query("insert into storage.objects(bucket_id,name,owner_id) values('Materials',$1,$2),('Materials',$3,$4)",[id(3)+'/math.pdf',id(3),id(4)+'/other.pdf',id(4)]);
      await role(3);
      assert.equal((await db.query('select * from storage.objects')).rows.length,1);
      assert.equal((await db.query("delete from storage.objects where owner_id=$1 returning id",[id(4)])).rows.length,0);
      await denied(`insert into storage.objects(bucket_id,name) values('avatars','${id(3)}/fake.png')`);
      await role(null,'anon');
      assert.equal((await db.query("select * from storage.objects where bucket_id='Materials'")).rows.length,0);
      await db.exec('reset role');
      assert.equal((await db.query<{public:boolean}>("select public from storage.buckets where id='avatars'")).rows[0].public,true);
      assert.equal((await db.query<{public:boolean}>("select public from storage.buckets where id='Materials'")).rows[0].public,false);
    });
  } finally {await db.close();}
});
