import type {AuthTransport} from './smtp-auth-verification';
// Explicit offline scenarios for the real PowerShell/Node process boundary.
export function mockTransport(scenario: string): AuthTransport {
  return {close(){}, async verify() {
    switch(scenario) {
      case 'success': return true;
      case 'auth-rejected': throw {code:'EAUTH',responseCode:535,message:'fixture-password-must-not-leak'};
      case 'connection-refused': throw {code:'ECONNREFUSED'};
      case 'tls-invalid': throw {code:'ESOCKET',message:'self-signed certificate fixture-password-must-not-leak'};
      case 'timeout': return new Promise(() => {});
      case 'no-output': process.exit(0);
      case 'crash': process.exit(7);
      case 'wrong-exit':
        process.stdout.write('{"status":"SMTP_AUTHENTICATED","exitCode":0,"mode":"mock"}\n',()=>process.exit(7));
        return new Promise(() => {});
      case 'stderr-noise':
        process.stderr.write('fixture-password-must-not-leak\n'.repeat(5000));
        throw {code:'EAUTH'};
      case 'hang': return new Promise(() => {});
      default: throw Error('Invalid mock scenario');
    }
  }};
}
