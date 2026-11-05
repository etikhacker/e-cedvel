import {test,expect,type BrowserContext} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const origin='http://127.0.0.1:3100';
const id=(n:number)=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
async function signIn(context:BrowserContext,n:number){
  const payload={sub:id(n),aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000)};
  const jwt=[Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),Buffer.from(JSON.stringify(payload)).toString('base64url'),'test-signature'].join('.');
  const session={access_token:jwt,refresh_token:'test-refresh',expires_at:payload.exp,expires_in:3600,token_type:'bearer',user:{id:id(n),aud:'authenticated',role:'authenticated',email:'test'+n+'@example.az',app_metadata:{},user_metadata:{}}};
  await context.clearCookies();
  await context.addCookies([{name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),url:origin}]);
}
test('unauthenticated pages and invitation/upload APIs reject access',async({request})=>{
  for(const path of ['/dashboard','/admin','/admin/muracietler','/reset-password']){
    const response=await request.get(path,{maxRedirects:0});
    expect(response.status()).toBe(307);expect(response.headers().location).toContain('/login');
  }
  const response=await request.post('/api/send-invite',{headers:{origin},data:{email:'x@example.az',university_id:id(101)}});
  expect(response.status()).toBe(401);
  expect((await request.post('/api/uploads',{headers:{origin},data:{}})).status()).toBe(401);
  expect((await request.post('/api/send-invite',{headers:{origin:'https://evil.example'},data:{}})).status()).toBe(403);
});
test('student and university admin cannot create platform invitations',async({context})=>{
  for(const n of [3,2]){
    await signIn(context,n);
    const response=await context.request.post('/api/send-invite',{headers:{origin},data:{email:'x@example.az',university_id:id(101)}});
    expect(response.status()).toBe(403);
    const page=await context.request.get('/admin/muracietler',{maxRedirects:0});
    expect(page.status()).toBe(307);expect(page.headers().location).toContain('/dashboard');
  }
});
test('superadmin still needs valid JSON and strict invitation input',async({context})=>{
  await signIn(context,1);
  expect((await context.request.post('/api/send-invite',{headers:{origin,'Content-Type':'application/json'},data:'{bad'})).status()).toBe(400);
  expect((await context.request.post('/api/send-invite',{headers:{origin},data:{email:'bad',university_id:'bad',role:'superadmin'}})).status()).toBe(400);
  expect((await context.request.post('/api/send-invite',{headers:{origin},data:{email:'x'.repeat(4096),university_id:id(101)}})).status()).toBe(413);
});
test('invalid token and callback are handled without exposing data',async({request})=>{
  const response=await request.post('/api/invitations',{headers:{origin},data:{action:'inspect',token:'invalid'}});
  expect(response.status()).toBe(400);
  const callback=await request.get('/auth/callback?next=//evil.example',{maxRedirects:0});
  expect(callback.headers().location).toBe(origin+'/login?error=invalid-link');
});
test('login retains layout at mobile and desktop widths',async({page})=>{
  await mkdir('output/playwright',{recursive:true});
  for(const width of [375,1280]){
    await page.setViewportSize({width,height:900});await page.goto('/login');
    await expect(page.getByRole('button',{name:'Daxil Ol',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
    await page.screenshot({path:'output/playwright/login-'+width+'.png',fullPage:true});
  }
});
test('both administrator roles open their assigned existing interfaces',async({context,page})=>{
  await signIn(context,1);await page.goto('/admin');
  await expect(page.getByRole('heading',{name:'QrupTap Admin',exact:true})).toBeVisible();
  await expect(page.getByText('Superadmin',{exact:true})).toBeVisible();
  await page.screenshot({path:'output/playwright/superadmin.png',fullPage:true});
  await signIn(context,2);await page.goto('/admin');
  await expect(page.getByText('Test Universiteti',{exact:true}).first()).toBeVisible();
  await page.screenshot({path:'output/playwright/university-admin.png',fullPage:true});
});
test('database schedules include Saturday and never fall back to IT24',async({context,page})=>{
  await signIn(context,3);await page.goto('/dashboard');
  await page.getByRole('tab',{name:'Həftəlik',exact:true}).click();
  await expect(page.getByText('Şənbə dərsi',{exact:true})).toBeVisible();
  await expect(page.getByText('TEST-1',{exact:true})).toBeVisible();
  await page.screenshot({path:'output/playwright/dashboard.png',fullPage:true});
  await page.setViewportSize({width:375,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  await page.screenshot({path:'output/playwright/dashboard-mobile.png',fullPage:true});
  await signIn(context,4);await page.goto('/dashboard');
  await page.getByRole('tab',{name:'Həftəlik',exact:true}).click();
  await expect(page.getByText('Bu qrup üçün cədvəl yoxdur.',{exact:true})).toBeVisible();
  await expect(page.getByText('Obyektyönlü proqramlaşdırma',{exact:true})).toHaveCount(0);
});
test('shared browser notes are isolated and database save failure is visible',async({context,page})=>{
  await signIn(context,3);await page.goto('/dashboard');await page.getByRole('button',{name:'profil',exact:true}).click();
  await page.getByRole('button',{name:'Qeydler',exact:true}).click();
  await expect(page.locator('textarea')).toHaveValue('First account note');
  await signIn(context,4);await page.goto('/dashboard');await page.getByRole('button',{name:'profil',exact:true}).click();
  await page.getByRole('button',{name:'Qeydler',exact:true}).click();
  await expect(page.locator('textarea')).toHaveValue('Second account note');
  await signIn(context,8);await page.goto('/dashboard');await page.getByRole('button',{name:'profil',exact:true}).click();
  await page.getByRole('button',{name:'Qeydler',exact:true}).click();
  await page.locator('textarea').fill('Unsaved');await page.locator('textarea').blur();
  await expect(page.getByText('Dəyişiklik saxlanmadı. Yenidən cəhd edin.',{exact:true})).toBeVisible();
});
test('schedule database failure is distinguished from an empty schedule',async({context,page})=>{
  await signIn(context,7);await page.goto('/dashboard');
  await expect(page.getByRole('alert').filter({hasText:'Cədvəl yüklənmədi.'})).toBeVisible();
});
test('profile notes persist after a successful database save and reload',async({context,page})=>{
  await signIn(context,3);await page.goto('/dashboard');await page.getByRole('button',{name:'profil',exact:true}).click();
  await page.getByRole('button',{name:'Qeydler',exact:true}).click();
  const saved=page.waitForResponse(response=>response.url().includes('/rest/v1/profiles')&&response.request().method()==='POST');
  await page.locator('textarea').fill('Persisted note');await page.locator('textarea').blur();expect((await saved).status()).toBe(201);
  await page.reload();await page.getByRole('button',{name:'profil',exact:true}).click();
  await page.getByRole('button',{name:'Qeydler',exact:true}).click();await expect(page.locator('textarea')).toHaveValue('Persisted note');
});
test('service worker never caches authenticated pages',async({context,page})=>{
  await signIn(context,3);await page.goto('/dashboard');
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
  await page.reload();await page.getByRole('tab',{name:'Həftəlik',exact:true}).click();
  const urls=await page.evaluate(async()=>{const keys=await caches.keys();return(await Promise.all(keys.map(async key=>(await(await caches.open(key)).keys()).map(r=>r.url)))).flat();});
  expect(urls.some(url=>/dashboard|\/api\/|\/auth\/|\/rest\//.test(url))).toBeFalsy();
  await context.setOffline(true);await page.reload();
  await expect(page.getByRole('heading',{name:'İnternet bağlantısı yoxdur'})).toBeVisible();
  await expect(page.getByText('Şənbə dərsi',{exact:true})).toHaveCount(0);
  await context.setOffline(false);
});
