import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import nodemailer from 'nodemailer';
import { mailConfig, smtpAccepted } from '../src/lib/mail-config';

const smtp = { MAIL_PROVIDER:'smtp', SMTP_HOST:'smtp.gmail.com', SMTP_USER:'sender@example.test',
  SMTP_PASSWORD:'fixture-not-a-real-password', SMTP_FROM_EMAIL:'E-Cedvel <sender@example.test>' };

test('SMTP works without Resend configuration and enforces certificate-verified TLS', () => {
  const config=mailConfig(smtp);
  assert.equal(config.provider,'smtp');
  if(config.provider!=='smtp') throw Error('SMTP expected');
  assert.equal(config.port,587);
  assert.equal(config.secure,false);
  assert.equal(config.requireTLS,true);
  assert.deepEqual(config.tls,{minVersion:'TLSv1.2',rejectUnauthorized:true});
  assert.equal(config.debug,false);
  assert.equal(config.disableFileAccess,true);
  assert.equal(config.disableUrlAccess,true);
  const implicit=mailConfig({...smtp,SMTP_PORT:'465'});
  assert.ok(implicit.provider==='smtp' && implicit.secure);
});

test('incomplete or unsafe SMTP settings fail before creating an invitation', () => {
  for(const override of [{SMTP_PASSWORD:''},{SMTP_HOST:''},{SMTP_PORT:'25'},
    {SMTP_PORT:'587junk'},{SMTP_FROM_EMAIL:'sender@example.test\r\nBcc: victim@example.test'},
    {SMTP_FROM_EMAIL:'Sender <sender@example.test'},{SMTP_FROM_EMAIL:'sender@example.test>'},
    {MAIL_PROVIDER:'unknown'}]) {
    assert.throws(()=>mailConfig({...smtp,...override}));
  }
});

test('configuration failures do not reveal a password', () => {
  assert.throws(()=>mailConfig({...smtp,SMTP_HOST:'bad/host'}), error =>
    error instanceof Error && !error.message.includes(smtp.SMTP_PASSWORD));
});

test('existing Resend configuration remains the default', () => {
  assert.equal(mailConfig({RESEND_API_KEY:'fixture',RESEND_FROM_EMAIL:'sender@example.test'}).provider,'resend');
  assert.throws(()=>mailConfig({RESEND_API_KEY:'fixture'}));
});

test('SMTP rejection or an empty acceptance list never reports success', () => {
  assert.equal(smtpAccepted({},'recipient@example.test'),false);
  assert.equal(smtpAccepted({accepted:['other@example.test']},'recipient@example.test'),false);
  assert.equal(smtpAccepted({accepted:['recipient@example.test'],rejected:['recipient@example.test']},'recipient@example.test'),false);
  assert.equal(smtpAccepted({accepted:['RECIPIENT@example.test'],rejected:[]},'recipient@example.test'),true);
});

test('real SMTP transport refuses plaintext credentials when STARTTLS is unavailable', async () => {
  const commands: string[]=[];
  const server=createServer(socket => {
    socket.write('220 fixture.local ESMTP\r\n');
    let buffer='';
    socket.on('data', chunk => {
      buffer+=chunk.toString();
      let end:number;
      while((end=buffer.indexOf('\r\n'))>=0) {
        const line=buffer.slice(0,end); buffer=buffer.slice(end+2);
        commands.push(line.split(' ')[0]);
        if(line.startsWith('EHLO')) socket.write('250-fixture.local\r\n250 AUTH PLAIN\r\n');
        else if(line==='STARTTLS') socket.write('454 TLS unavailable\r\n');
        else socket.write('500 unexpected command\r\n');
      }
    });
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();
  assert.ok(address && typeof address==='object');
  const config=mailConfig(smtp);
  assert.equal(config.provider,'smtp');
  if(config.provider!=='smtp') throw Error('SMTP expected');
  // Only the loopback test destination/port changes. Production TLS settings stay intact.
  const transport=nodemailer.createTransport({...config,host:'127.0.0.1',port:address.port});
  try {
    await assert.rejects(transport.verify());
    assert.ok(commands.includes('STARTTLS'));
    assert.ok(!commands.some(command=>['AUTH','MAIL','DATA'].includes(command)));
  } finally {
    transport.close();
    await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
  }
});
