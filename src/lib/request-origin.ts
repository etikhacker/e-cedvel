import 'server-only';
export function appOrigin(request:Request):string {
  return new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin;
}
export function sameOrigin(request:Request):boolean {
  const origin=request.headers.get('origin');
  if(!origin)return false;
  const allowed=[appOrigin(request)];
  if(process.env.VERCEL_ENV==='preview' && process.env.VERCEL_URL)allowed.push('https://'+process.env.VERCEL_URL);
  return allowed.includes(origin);
}
