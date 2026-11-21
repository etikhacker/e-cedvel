import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalPageRedirect } from '../src/lib/canonical-url';
const canonical='https://e-cedvel.vercel.app';
test('production aliases redirect before starting cookie based authentication',()=>{
  assert.equal(canonicalPageRedirect('https://alias.vercel.app/login','GET','production',canonical),canonical+'/login');
  assert.equal(canonicalPageRedirect(canonical+'/login','GET','production',canonical),null);
});
test('callback recovery and encoded invitation continuation survive canonical redirect',()=>{
  for(const path of ['/auth/callback?code=synthetic&type=recovery','/admin/setup?token=synthetic',
    '/auth/callback?code=synthetic&next=%2Fadmin%2Fsetup%3Ftoken%3Dsynthetic'])
    assert.equal(canonicalPageRedirect('https://alias.vercel.app'+path,'GET','production',canonical),canonical+path);
});
test('preview, local, API requests and mutations are not redirected',()=>{
  for(const [url,method,env] of [
    ['https://alias.vercel.app/login','GET','preview'],['http://localhost:3000/login','GET','development'],
    ['https://alias.vercel.app/api/send-invite','GET','production'],['https://alias.vercel.app/login','POST','production']])
    assert.equal(canonicalPageRedirect(url,method,env,canonical),null);
});
test('invalid production origin does not redirect a browser to an insecure origin',()=>{
  assert.equal(canonicalPageRedirect('https://alias.vercel.app/login','GET','production','http://wrong.example'),null);
});
