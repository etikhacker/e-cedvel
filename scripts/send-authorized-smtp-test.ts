// One explicitly authorized message. No invitation/database/API integration.
import {mkdirSync, openSync, closeSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {mailConfig, smtpAccepted} from '../src/lib/mail-config';

const recipient='omrbabayev455@gmail.com';
const subject='E-Cədvəl — SMTP Test';
const html='<p>E-Cədvəl email sistemi yoxlanılır. Bu, zərərsiz sınaq məktubudur; heç bir əməliyyat tələb olunmur.</p>';
const mock=process.argv[2]==='--mock';
const directory=resolve('output/smtp-delivery',mock?'mock-20261106':'authorized-20261106-omrbabayev455');
let attempted=false, ownsLock=false, finished=false;
function finish(status:string,exitCode:number,responseCode:number|null=null,enhancedStatus:string|null=null) {
  if(finished)return;
  finished=true;
  const receipt={status,exitCode,mode:mock?'mock':'real',responseCode,enhancedStatus};
  if(ownsLock) {
    try {writeFileSync(resolve(directory,'receipt.json'),JSON.stringify({...receipt,attempted,recipient,subject,time:new Date().toISOString()},null,2));} catch { /* stdout still reports the result */ }
  }
  process.stdout.write(JSON.stringify(receipt)+'\n',()=>process.exit(exitCode));
}
const timeout=setTimeout(()=>finish(attempted?'SMTP_DELIVERY_UNKNOWN':'SMTP_CHECK_FAILED',attempted?7:5),35000);
process.on('uncaughtException',()=>finish(attempted?'SMTP_DELIVERY_UNKNOWN':'SMTP_CHECK_FAILED',attempted?7:5));
process.on('unhandledRejection',()=>finish(attempted?'SMTP_DELIVERY_UNKNOWN':'SMTP_CHECK_FAILED',attempted?7:5));

async function main() {
  if(process.argv.length!==3 || !['--send-once','--mock'].includes(process.argv[2]))return finish('SMTP_CHECK_FAILED',5);
  let password='';
  process.stdin.setEncoding('utf8');
  for await(const chunk of process.stdin) {password+=chunk;if(password.length>256)return finish('SMTP_CHECK_FAILED',5);}
  password=password.replace(/\s/g,'');
  if(!/^[a-z0-9]{16}$/i.test(password))return finish('SMTP_CHECK_FAILED',5);
  if(mock && password!=='mockpasswordabcd')return finish('SMTP_CHECK_FAILED',5);
  const config=mailConfig({MAIL_PROVIDER:'smtp',SMTP_HOST:'smtp.gmail.com',SMTP_PORT:'587',
    SMTP_USER:'e.cedvel.qruptap@gmail.com',SMTP_FROM_EMAIL:'E-Cedvel <e.cedvel.qruptap@gmail.com>',SMTP_PASSWORD:password});
  password='';
  if(config.provider!=='smtp')return finish('SMTP_CHECK_FAILED',5);
  mkdirSync(directory,{recursive:true});
  try {closeSync(openSync(resolve(directory,'attempt.lock'),'wx'));ownsLock=true;}
  catch(error) {if((error as NodeJS.ErrnoException).code==='EEXIST')return finish('SMTP_ALREADY_ATTEMPTED',8);throw error;}
  const {from,provider,...options}=config;void provider;
  // Uses the application's same SMTP configuration, transport and acceptance check.
  // No verify() round trip and no retry; exactly one sendMail call after the guard.
  const transport=mock?{
    async sendMail(message: {to:{address:string};subject:string;html:string}) {
      if(message.to.address!==recipient || message.subject!==subject || message.html!==html)throw Error('Mock envelope mismatch');
      return {accepted:[recipient],rejected:[],response:'250 2.0.0 fixture-queue-id'};
    },close(){},
  }:(await import('nodemailer')).default.createTransport(options);
  try {
    attempted=true;
    const result=await transport.sendMail({from,to:{address:recipient,name:''},subject,html});
    const match=/^(\d{3})(?:[ -](\d\.\d\.\d{1,3}))?/.exec(result.response??'');
    const code=match?Number(match[1]):null;
    const accepted=smtpAccepted(result,recipient);
    finish(accepted?'SMTP_ACCEPTED':'SMTP_NOT_ACCEPTED',accepted?0:6,code,match?.[2]??null);
  } catch {
    // A disconnected DATA response can be ambiguous: never retry automatically.
    finish('SMTP_DELIVERY_UNKNOWN',7);
  } finally {transport.close();config.auth.pass='';}
}
main().catch(()=>finish(attempted?'SMTP_DELIVERY_UNKNOWN':'SMTP_CHECK_FAILED',attempted?7:5)).finally(()=>clearTimeout(timeout));
