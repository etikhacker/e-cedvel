const CACHE_NAME='e-cedvel-public-v2';
const ASSETS=['/offline.html','/manifest.json','/icon-192x192.png','/icon-512x512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if (event.request.method!=='GET'||url.origin!==self.location.origin) return;
  if (ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
  } else if (event.request.mode==='navigate') {
    // Never cache HTML, authenticated responses, RSC payloads, APIs or Storage URLs.
    event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html')));
  }
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/dashboard'));
});
