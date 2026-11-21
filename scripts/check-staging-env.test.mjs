import test from 'node:test';
import assert from 'node:assert/strict';
import { checkStagingEnv } from './check-staging-env.mjs';
// All values are synthetic and never sent over the network.
const ref = 'abcdefghijklmnopqrst';
const fixture = () => ({ STAGING_SUPABASE_PROJECT_REF: ref,
  NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_' + 'fixture'.repeat(4),
  SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_' + 'fixture'.repeat(4),
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000', NEXT_PUBLIC_MATERIALS_BUCKET: 'Materials',
  RESEND_API_KEY: 're_' + 'fixture'.repeat(4), RESEND_FROM_EMAIL: 'Staging <testing@staging.example.org>',
});
const jwt = claims => 'header.' + Buffer.from(JSON.stringify(claims)).toString('base64url') + '.test';

test('SMTP alternative does not require a Resend domain or key', () => {
  const config = { ...fixture(), MAIL_PROVIDER:'smtp', RESEND_API_KEY:'', RESEND_FROM_EMAIL:'',
    SMTP_HOST:'smtp.gmail.com', SMTP_USER:'sender@example.org', SMTP_PASSWORD:'fixture-only',
    SMTP_FROM_EMAIL:'sender@example.org', SMTP_PORT:'587' };
  assert.deepEqual(checkStagingEnv(config), []);
  assert.ok(checkStagingEnv({...config,SMTP_PORT:'25'}).length);
  assert.ok(checkStagingEnv({...config,SMTP_PASSWORD:''}).length);
});
test('unconfigured environment blocks startup and never includes supplied secrets', () => {
  const secret = 'unique-secret-must-not-be-printed';
  const errors = checkStagingEnv({ SUPABASE_SERVICE_ROLE_KEY: secret });
  assert.ok(errors.length); assert.ok(!JSON.stringify(errors).includes(secret));
});
test('known production project, cross-project JWT and privileged browser key are rejected', () => {
  const prod = 'samcakpeuxwegyzrlrwp';
  assert.ok(checkStagingEnv({ ...fixture(), STAGING_SUPABASE_PROJECT_REF: prod,
    NEXT_PUBLIC_SUPABASE_URL: `https://${prod}.supabase.co` }).length);
  assert.ok(checkStagingEnv({ ...fixture(), SUPABASE_SERVICE_ROLE_KEY: jwt({ ref: prod, role: 'service_role' }) }).length);
  assert.ok(checkStagingEnv({ ...fixture(), NEXT_PUBLIC_SUPABASE_ANON_KEY: fixture().SUPABASE_SERVICE_ROLE_KEY }).length);
});
test('local development and HTTPS build origins are distinguished', () => {
  assert.deepEqual(checkStagingEnv(fixture()), []);
  assert.ok(checkStagingEnv(fixture(), true).length);
  assert.deepEqual(checkStagingEnv({ ...fixture(), NEXT_PUBLIC_APP_URL: 'https://staging.example.org' }, true), []);
  assert.ok(checkStagingEnv({ ...fixture(), NEXT_PUBLIC_APP_URL: 'https://user:password@staging.example.org' }).length);
});
test('legacy roles/ref, URL mismatch, placeholder sender and unsupported buckets are checked', () => {
  const legacy = { ...fixture(), NEXT_PUBLIC_SUPABASE_ANON_KEY: jwt({ ref, role: 'anon' }),
    SUPABASE_SERVICE_ROLE_KEY: jwt({ ref, role: 'service_role' }) };
  assert.deepEqual(checkStagingEnv(legacy), []);
  for (const patch of [{ NEXT_PUBLIC_SUPABASE_URL: 'https://other.supabase.co' },
    { RESEND_FROM_EMAIL: 'test@example.invalid' }, { NEXT_PUBLIC_MATERIALS_BUCKET: 'unprotected' }])
    assert.ok(checkStagingEnv({ ...legacy, ...patch }).length);
});
