import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { classifySmtpError, verifyAuthentication, resultFor } from '../scripts/smtp-auth-verification';

test('authentication requires an explicit successful verify result and always closes transport', async()=>{
  for (const value of [true,false,undefined]) {
    let closed=0;
    const status=await verifyAuthentication({verify:async()=>value,close(){closed++;}});
    assert.equal(status,value===true?'SMTP_AUTHENTICATED':'SMTP_CHECK_FAILED');
    assert.equal(closed,1);
  }
});
test('SMTP credential, connection and TLS errors are classified without returning provider text',()=>{
  const examples: [unknown,string][] = [
    [{code:'EAUTH',message:'fixture-password-must-not-leak'},'SMTP_AUTH_FAILED'],
    [{responseCode:535},'SMTP_AUTH_FAILED'],[{responseCode:534},'SMTP_AUTH_FAILED'],
    [{code:'ECONNREFUSED'},'SMTP_CONNECTION_FAILED'],[{code:'ENOTFOUND'},'SMTP_CONNECTION_FAILED'],
    [{code:'ETIMEDOUT'},'SMTP_CONNECTION_FAILED'],[{code:'ETLS'},'SMTP_TLS_FAILED'],
    [{code:'CERT_HAS_EXPIRED'},'SMTP_TLS_FAILED'],[{code:'ERR_TLS_CERT_ALTNAME_INVALID'},'SMTP_TLS_FAILED'],
    [{code:'ESOCKET',message:'self-signed certificate: fixture-password-must-not-leak'},'SMTP_TLS_FAILED'],
    [{code:'ESOCKET',cause:{code:'UNABLE_TO_VERIFY_LEAF_SIGNATURE'}},'SMTP_TLS_FAILED'],
    [{code:'ETIMEDOUT',command:'STARTTLS'},'SMTP_TLS_FAILED'],[Error('unexpected private detail'),'SMTP_CHECK_FAILED'],
  ];
  for (const [error,expected] of examples) assert.equal(classifySmtpError(error),expected);
});
test('synchronous errors, async rejection and a never-settling verify promise fail safely',async()=>{
  for(const verify of [()=>{throw {code:'EAUTH'};},async()=>{throw {code:'EAUTH'};}]) {
    let closed=false;
    assert.equal(await verifyAuthentication({verify,close(){closed=true;}}),'SMTP_AUTH_FAILED');
    assert.equal(closed,true);
  }
  assert.equal(await verifyAuthentication({verify:()=>new Promise(()=>{}),close(){}},15),'SMTP_CONNECTION_FAILED');
  assert.equal(await verifyAuthentication({verify:async()=>true,close(){throw Error('private');}}),'SMTP_CHECK_FAILED');
});
test('only explicit authentication success maps to exit zero',()=>{
  assert.equal(resultFor('SMTP_AUTHENTICATED').exitCode,0);
  for(const status of ['SMTP_AUTH_FAILED','SMTP_CONNECTION_FAILED','SMTP_TLS_FAILED','SMTP_CHECK_FAILED'] as const)
    assert.notEqual(resultFor(status).exitCode,0);
});
test('Node CLI rejects missing input and removed delivery mode without a network call',()=>{
  for(const args of [['--authenticate-only'],['--send-authorized-test']]) {
    const run=spawnSync(process.execPath,['--import','tsx','scripts/verify-gmail-smtp.ts',...args],{
      cwd:resolve('.'),input:'',encoding:'utf8',timeout:10000,windowsHide:true,
    });
    assert.equal(run.status,5);
    assert.equal(JSON.parse(run.stdout).status,'SMTP_CHECK_FAILED');
  }
});

const windows=process.platform==='win32';
for(const host of ['powershell.exe','pwsh.exe']) {
  test(`${host}: complete offline process boundary and exit-code regression`,{skip:!windows},async(t)=>{
    const cases: [string,string,number][] = [
      ['success','SMTP_AUTHENTICATED',0],['auth-rejected','SMTP_AUTH_FAILED',2],
      ['connection-refused','SMTP_CONNECTION_FAILED',3],['tls-invalid','SMTP_TLS_FAILED',4],
      ['timeout','SMTP_CONNECTION_FAILED',3],['no-output','SMTP_CHECK_FAILED',5],
      ['crash','SMTP_CHECK_FAILED',5],['stderr-noise','SMTP_AUTH_FAILED',2],
      ['wrong-exit','SMTP_CHECK_FAILED',5],['hang','SMTP_CHECK_FAILED',5],
    ];
    for(const [scenario,status,code] of cases) await t.test(scenario,()=>{
      const run=spawnSync(host,['-NoProfile','-NonInteractive','-File',resolve('scripts/verify-gmail-smtp.ps1'),'-MockScenario',scenario],{
        encoding:'utf8',timeout:15000,windowsHide:true,
      });
      assert.ifError(run.error);
      assert.equal(run.status,code,run.stdout+run.stderr);
      assert.match(run.stdout,new RegExp(`MOCK_RESULT: ${status}`));
      assert.match(run.stdout,new RegExp(`SMTP_EXIT_CODE=${code}`));
      assert.equal(run.stderr,'');
      assert.doesNotMatch(run.stdout+run.stderr,/fixture-password|mockpasswordabcd|535|self-signed/);
    });
    await t.test('invoking with & sets LASTEXITCODE in the caller',()=>{
      const script=resolve('scripts/verify-gmail-smtp.ps1').replace(/'/g,"''");
      const run=spawnSync(host,['-NoProfile','-NonInteractive','-Command',`& '${script}' -MockScenario auth-rejected; Write-Output "CALLER_CODE=$LASTEXITCODE"; exit $LASTEXITCODE`],{
        encoding:'utf8',timeout:15000,windowsHide:true,
      });
      assert.equal(run.status,2,run.stdout+run.stderr);
      assert.match(run.stdout,/CALLER_CODE=2/);
    });
  });
}
