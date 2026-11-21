import 'server-only';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { smtpAccepted, type MailConfig } from './mail-config';

export async function sendInvitationMail(config: MailConfig, message: {
  to: string; subject: string; html: string; invitationId: string;
}): Promise<boolean> {
  if (config.provider === 'resend') {
    const {error} = await new Resend(config.apiKey).emails.send({
      from: config.from, to: message.to, subject: message.subject, html: message.html,
    }, {idempotencyKey: 'invite/' + message.invitationId});
    return !error;
  }
  const {from, ...options} = config;
  const transport = nodemailer.createTransport(options);
  try {
    const result = await transport.sendMail({
      from, to: {address: message.to, name: ''}, subject: message.subject, html: message.html,
    });
    return smtpAccepted(result, message.to);
  } finally {
    transport.close();
  }
}
