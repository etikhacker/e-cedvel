// Operator-only check. Credential arrives over stdin, never argv or an env file.
import nodemailer from 'nodemailer';
import { randomUUID } from 'node:crypto';
import { mailConfig } from '../src/lib/mail-config';
import { sendInvitationMail } from '../src/lib/invitation-mail';

async function main() {
  const mode = process.argv[2];
  if (process.argv.length !== 3 || !['--authenticate-only', '--send-authorized-test'].includes(mode)) {
    throw new Error('INVALID_MODE');
  }
  let password = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) {
    password += chunk;
    if (password.length > 256) throw new Error('INVALID_INPUT');
  }
  password = password.replace(/\s/g, '');
  if (!/^[a-z]{16}$/i.test(password)) throw new Error('INVALID_INPUT');
  const config = mailConfig({MAIL_PROVIDER:'smtp', SMTP_HOST:'smtp.gmail.com', SMTP_PORT:'587',
    SMTP_USER:'e.cedvel.qruptap@gmail.com', SMTP_FROM_EMAIL:'E-Cedvel <e.cedvel.qruptap@gmail.com>',
    SMTP_PASSWORD:password});
  password = '';
  if (config.provider !== 'smtp') throw new Error('INVALID_PROVIDER');
  const {from: _from, provider: _provider, ...options} = config;
  void _from; void _provider;
  const transport = nodemailer.createTransport(options);
  try {
    await transport.verify();
    console.log('SMTP_AUTHENTICATED');
    if (mode === '--send-authorized-test') {
      const testId = randomUUID();
      const accepted = await sendInvitationMail(config, {
        to:'e.cedvel.qruptap@gmail.com',
        subject:`E-Cedvel SMTP delivery test ${testId}`,
        html:'<p>Authorized SMTP delivery check. This is not an invitation and contains no login link.</p>',
        invitationId:testId,
      });
      console.log(accepted ? `SMTP_ACCEPTED test=${testId}` : 'SMTP_NOT_ACCEPTED');
      if (!accepted) process.exitCode = 1;
      console.log('INBOX_DELIVERY_UNVERIFIED: recipient must check the message, including Spam.');
    }
  } finally {
    transport.close();
    config.auth.pass = '';
  }
}

main().catch(() => {
  // Never print provider errors: they can contain SMTP protocol data or credentials.
  console.error('SMTP_CHECK_FAILED: check mode, masked input, network and Gmail App Password. No automatic retry.');
  process.exitCode = 1;
});
