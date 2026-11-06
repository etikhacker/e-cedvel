export const exitCodes = {
  SMTP_AUTHENTICATED:0, SMTP_AUTH_FAILED:2, SMTP_CONNECTION_FAILED:3, SMTP_TLS_FAILED:4, SMTP_CHECK_FAILED:5,
} as const;
export type Status = keyof typeof exitCodes;
export type AuthTransport = {verify(): Promise<unknown>; close(): void};
export function resultFor(status: Status) { return {status,exitCode:exitCodes[status]}; }

export function classifySmtpError(error: unknown): Status {
  const chain: Record<string,unknown>[] = [];
  let item = error;
  for (let i=0; i<4 && item && typeof item==='object'; i++) {
    const record = item as Record<string,unknown>;
    chain.push(record); item=record.cause;
  }
  // Nodemailer may wrap certificate errors as ESOCKET, preserving only the message.
  // Inspect that text internally; never return/log provider messages.
  const tls = chain.some(e => /^(ETLS|EREQUIRETLS|ERR_TLS_|ERR_SSL_|CERT_|DEPTH_ZERO_SELF_SIGNED_CERT|SELF_SIGNED_CERT_IN_CHAIN|UNABLE_TO_VERIFY_LEAF_SIGNATURE|UNABLE_TO_GET_ISSUER_CERT)/.test(String(e.code??''))
    || e.command==='STARTTLS'
    || (e.code==='ESOCKET' && /certificate|self[- ]signed|tls|ssl|hostname.*match/i.test(String(e.message??''))));
  if (tls) return 'SMTP_TLS_FAILED';
  if (chain.some(e => e.code==='EAUTH' || e.responseCode===535 || e.responseCode===534)) return 'SMTP_AUTH_FAILED';
  if (chain.some(e => /^(ECONNECTION|ECONNREFUSED|ECONNRESET|ECONNABORTED|ENOTFOUND|EAI_AGAIN|EDNS|ETIMEDOUT|ETIMEOUT|ESOCKET|EHOSTUNREACH|ENETUNREACH|EPROTOCOL)$/.test(String(e.code??''))))
    return 'SMTP_CONNECTION_FAILED';
  return 'SMTP_CHECK_FAILED';
}

export async function verifyAuthentication(transport: AuthTransport, timeoutMs=30000): Promise<Status> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let status: Status = 'SMTP_CHECK_FAILED';
  try {
    const timeout = new Promise<never>((_,reject) => {
      timer=setTimeout(() => reject({code:'ETIMEDOUT'}),timeoutMs);
    });
    const verified = await Promise.race([Promise.resolve().then(() => transport.verify()),timeout]);
    status = verified === true ? 'SMTP_AUTHENTICATED' : 'SMTP_CHECK_FAILED';
  } catch (error) {
    status = classifySmtpError(error);
  } finally {
    clearTimeout(timer);
    try { transport.close(); } catch { status='SMTP_CHECK_FAILED'; }
  }
  return status;
}
