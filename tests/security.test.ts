import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeHtml,csvCell,safeFilename,inviteInput,callbackDestination} from '../src/lib/security';
import {validateUpload,materialSubjectPrefix,materialDisplayName} from '../src/lib/uploads';
test('HTML attributes and elements are escaped',()=>assert.equal(escapeHtml('<img src=x onerror="x">&\''),'&lt;img src=x onerror=&quot;x&quot;&gt;&amp;&#39;'));
test('CSV formulas including whitespace/control prefixes are neutralized',()=>{
  for(const value of ['=1+1','+cmd','-1','@SUM(A1)','  =1','\t=1','\r=1']) assert.ok(csvCell(value).startsWith('"\''));
  assert.equal(csvCell('Əli "A"'),'"Əli ""A"""');
});
test('filenames cannot add paths',()=>assert.equal(safeFilename('../a/b:*'),'.._a_b__'));
test('invite schema rejects role tricks and invalid identifiers',()=>{
  for(const email of ['first,second@example.az','first;second@example.az','Name(address)@example.az'])
    assert.equal(inviteInput({email,university_id:'10000000-0000-4000-8000-000000000001'}),null);
  assert.equal(inviteInput({email:'x\r\n@foo.az',university_id:'x'}),null);
  assert.equal(inviteInput({email:'x@example.az',university_id:'not-a-uuid',role:'superadmin'}),null);
  assert.deepEqual(inviteInput({email:' X@example.az ',university_id:'10000000-0000-4000-8000-000000000001',role:'superadmin'}),{email:'x@example.az',university_id:'10000000-0000-4000-8000-000000000001'});
});
test('verification and recovery have distinct safe destinations',()=>{
  assert.equal(callbackDestination(null,null),'/dashboard');
  assert.equal(callbackDestination('recovery','https://evil.test'),'/reset-password');
  for(const next of ['//evil.test','/\\evil.test','https://evil.test','/admin']) assert.equal(callbackDestination('signup',next),'/dashboard');
  assert.equal(callbackDestination('signup','/admin/setup?token='+'a'.repeat(64)),'/admin/setup?token='+'a'.repeat(64));
});
test('upload rejects forged MIME, active content and oversize data',()=>{
  assert.throws(()=>validateUpload('image/png',new TextEncoder().encode('<svg onload="alert(1)">'),true));
  assert.throws(()=>validateUpload('image/svg+xml',new Uint8Array(10),true));
  assert.throws(()=>validateUpload('application/pdf',new Uint8Array(5*1024*1024)));
  assert.equal(validateUpload('application/pdf',new TextEncoder().encode('%PDF-1.7')),'pdf');
});
test('material filenames preserve Azerbaijani labels without losing subject grouping',()=>{
  const prefix=materialSubjectPrefix('Fənn / 1.');
  assert.ok(/^[a-zA-Z0-9_-]+$/.test(prefix));
  assert.equal(materialDisplayName(prefix+'_00000000-0000-4000-8000-000000000001_Mühazirə.pdf',prefix),'Mühazirə.pdf');
  assert.equal(materialDisplayName(prefix+'_1700000000_Əvvəlki.pdf',prefix),'Əvvəlki.pdf');
});
