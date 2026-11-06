// Authentication only: no sendMail import/call and no database access.
import { mailConfig } from '../src/lib/mail-config';
import { verifyAuthentication, resultFor, type Status, type AuthTransport } from './smtp-auth-verification';

const mock = process.argv[2] === '--mock';
let finished = false;
function finish(status: Status) {
  if (finished) return;
  finished = true;
  const result = {...resultFor(status), mode:mock ? 'mock' : 'real'};
  process.stdout.write(JSON.stringify(result)+'\n', () => process.exit(result.exitCode));
}
process.on('uncaughtException', () => finish('SMTP_CHECK_FAILED'));
process.on('unhandledRejection', () => finish('SMTP_CHECK_FAILED'));
// Referenced watchdog prevents a pending Promise from silently exiting with 0.
const watchdog = setTimeout(() => finish('SMTP_CHECK_FAILED'), 40000);

async function main() {
  if ((!mock && (process.argv[2] !== '--authenticate-only' || process.argv.length !== 3))
    || (mock && process.argv.length !== 4)) return finish('SMTP_CHECK_FAILED');
  let password = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) {
    password += chunk;
    if (password.length > 256) return finish('SMTP_CHECK_FAILED');
  }
  password = password.replace(/\s/g, '');
  if (!/^[a-z0-9]{16}$/i.test(password)) return finish('SMTP_CHECK_FAILED');
  let transport: AuthTransport;
  let clearCredential = () => { password = ''; };
  if (mock) {
    if (password !== 'mockpasswordabcd') return finish('SMTP_CHECK_FAILED');
    password = '';
    const {mockTransport} = await import('./smtp-auth-mocks');
    transport = mockTransport(process.argv[3]);
  } else {
    const config = mailConfig({MAIL_PROVIDER:'smtp', SMTP_HOST:'smtp.gmail.com', SMTP_PORT:'587',
      SMTP_USER:'e.cedvel.qruptap@gmail.com', SMTP_FROM_EMAIL:'e.cedvel.qruptap@gmail.com', SMTP_PASSWORD:password});
    password = '';
    if (config.provider !== 'smtp') return finish('SMTP_CHECK_FAILED');
    clearCredential = () => { config.auth.pass = ''; };
    const {from, provider, ...options} = config;
    void from; void provider;
    const {default:nodemailer} = await import('nodemailer');
    transport = nodemailer.createTransport(options);
  }
  try {
    const status = await verifyAuthentication(transport, mock && process.argv[3]!=='hang' ? 50 : 30000);
    finish(status);
  } finally {
    clearCredential();
  }
}
main().catch(() => finish('SMTP_CHECK_FAILED')).finally(() => clearTimeout(watchdog));
