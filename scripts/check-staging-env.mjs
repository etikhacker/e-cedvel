// Offline preflight only: no network, SQL, email, credential output, or file writes.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';

const productionRef = 'samcakpeuxwegyzrlrwp';
const required = ['STAGING_SUPABASE_PROJECT_REF', 'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_MATERIALS_BUCKET',
  'SUPABASE_SERVICE_ROLE_KEY'];

function legacyClaims(value) {
  try {
    if (value.split('.').length !== 3) return null;
    return JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString('utf8'));
  } catch { return null; }
}

export function checkStagingEnv(env, productionBuild = false) {
  const errors = [];
  const provider = env.MAIL_PROVIDER || 'resend';
  const mailRequired = provider === 'smtp'
    ? ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM_EMAIL']
    : ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'];
  for (const name of [...required, ...mailRequired]) {
    if (!env[name] || /YOUR_|REPLACE_|not-configured|\.invalid/i.test(env[name]))
      errors.push(`${name}: staging dəyəri tamamlanmayıb.`);
  }
  const ref = env.STAGING_SUPABASE_PROJECT_REF || '';
  if (!/^[a-z]{20}$/.test(ref) || ref === productionRef)
    errors.push('STAGING_SUPABASE_PROJECT_REF: ayrıca staging layihəsi tələb olunur.');
  if (env.NEXT_PUBLIC_SUPABASE_URL !== `https://${ref}.supabase.co` || ref === productionRef)
    errors.push('NEXT_PUBLIC_SUPABASE_URL: ayrıca staging ref-i ilə tam uyğun olmalıdır.');

  for (const [name, role, prefix] of [
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon', 'sb_publishable_'],
    ['SUPABASE_SERVICE_ROLE_KEY', 'service_role', 'sb_secret_'],
  ]) {
    const value = env[name] || '';
    if (value.startsWith(prefix) && value.length > prefix.length + 15) continue;
    const claims = legacyClaims(value);
    if (!claims || claims.role !== role || claims.ref !== ref || claims.ref === productionRef)
      errors.push(`${name}: açar növü və ya layihə uyğunluğu yanlışdır.`);
  }
  try {
    const app = new URL(env.NEXT_PUBLIC_APP_URL);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(app.hostname);
    if (app.origin !== env.NEXT_PUBLIC_APP_URL || app.username || app.password
      || !(app.protocol === 'https:' || (!productionBuild && local && app.protocol === 'http:')))
      throw new Error('invalid origin');
  } catch { errors.push('NEXT_PUBLIC_APP_URL: dəqiq origin tələb olunur; production build üçün HTTPS.'); }
  if (!['Materials', 'materials'].includes(env.NEXT_PUBLIC_MATERIALS_BUCKET))
    errors.push('NEXT_PUBLIC_MATERIALS_BUCKET: miqrasiyalarda qorunan bucket adı seçilməlidir.');
  if (!['resend', 'smtp'].includes(provider)) errors.push('MAIL_PROVIDER: resend və ya smtp seçin.');
  if (provider === 'smtp') {
    if (!/^[a-z0-9.-]+$/i.test(env.SMTP_HOST || '') || !['465','587'].includes(env.SMTP_PORT || '587'))
      errors.push('SMTP_HOST / SMTP_PORT: düzgün host və TLS portu 465/587 tələb olunur.');
  } else if (!/^re_[A-Za-z0-9_-]{16,}$/.test(env.RESEND_API_KEY || ''))
    errors.push('RESEND_API_KEY: ayrıca staging göndərmə açarı tələb olunur.');
  const senderKey = provider === 'smtp' ? 'SMTP_FROM_EMAIL' : 'RESEND_FROM_EMAIL';
  const senderValue = env[senderKey] || '';
  const sender = senderValue.match(/<?([^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)>?$/)?.[1];
  if (!sender || /[\r\n,;]/.test(senderValue) || /(?:@resend\.dev|\.(?:invalid|example|test))$/i.test(sender))
    errors.push(`${senderKey}: işlək göndərən ünvanı tələb olunur.`);
  return [...new Set(errors)];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let loadFailed = false;
  const productionBuild = process.argv.includes('--production');
  const { combinedEnv } = nextEnv.loadEnvConfig(process.cwd(), !productionBuild, {
    info() {}, error() { loadFailed = true; },
  }, true);
  const errors = checkStagingEnv(combinedEnv, productionBuild);
  if (loadFailed) errors.push('Environment faylı oxunmadı; dəyərlər göstərilmir.');
  if (errors.length) {
    console.error('STAGING HAZIR DEYİL. Heç bir şəbəkə/SQL əməliyyatı icra edilmədi.');
    errors.forEach(message => console.error('- ' + message));
    process.exitCode = 1;
  } else {
    console.log('Lokal staging konfiqurasiya yoxlaması keçdi. Heç bir şəbəkə/SQL əməliyyatı yoxdur.');
    console.log('Opaque açarların layihəyə aidliyi, aktivliyi və SMTP domeni Dashboard-da ayrıca yoxlanmalıdır.');
    console.log('Bu nəticə migration və ya real inteqrasiya testinin keçdiyini bildirmir.');
  }
}
