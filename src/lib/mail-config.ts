type MailEnvironment = Record<string, string | undefined>;
type ResendConfig = { provider: 'resend'; from: string; apiKey: string };
type SmtpConfig = {
  provider: 'smtp'; from: string; host: string; port: 465 | 587;
  secure: boolean; requireTLS: true;
  auth: { user: string; pass: string };
  tls: { minVersion: 'TLSv1.2'; rejectUnauthorized: true };
  connectionTimeout: number; greetingTimeout: number; socketTimeout: number;
  logger: false; debug: false; disableFileAccess: true; disableUrlAccess: true;
};
export type MailConfig = ResendConfig | SmtpConfig;

function sender(value: string | undefined): string {
  // Reject header injection and multi-recipient senders even in operator configuration.
  if (!value || /[\r\n,;]/.test(value)
    || !/^(?:[^<>]+ <[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>|[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)$/.test(value))
    throw new Error('Email configuration is incomplete or invalid');
  return value;
}

export function mailConfig(env: MailEnvironment): MailConfig {
  const provider = env.MAIL_PROVIDER || 'resend';
  if (provider === 'resend') {
    if (!env.RESEND_API_KEY) throw new Error('Email configuration is incomplete or invalid');
    return { provider, from: sender(env.RESEND_FROM_EMAIL), apiKey: env.RESEND_API_KEY };
  }
  if (provider !== 'smtp') throw new Error('Email provider is invalid');
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT || '587';
  if (!host || !/^[a-z0-9.-]+$/i.test(host) || !env.SMTP_USER || !env.SMTP_PASSWORD
    || !['465', '587'].includes(port))
    throw new Error('Email configuration is incomplete or invalid');
  return {
    provider, from: sender(env.SMTP_FROM_EMAIL), host, port: Number(port) as 465 | 587,
    secure: port === '465', requireTLS: true,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true,
  };
}

// SMTP acceptance is not proof that the message reached the recipient's inbox.
export function smtpAccepted(result: {accepted?: unknown[]; rejected?: unknown[]}, recipient: string): boolean {
  return (result.rejected?.length ?? 0) === 0 && !!result.accepted?.some(
    value => typeof value === 'string' && value.toLowerCase() === recipient.toLowerCase(),
  );
}
