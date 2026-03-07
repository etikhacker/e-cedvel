const CACHE_NAME = 'e-cedvel-v1';

// Offline üçün cache-lənəcək fayllar
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install — statik faylları cache-lə
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — köhnə cache-ləri sil
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  event.waitUntil(clients.claim());
});

// Fetch — əvvəlcə şəbəkədən çək, olmasa cache-dən ver
self.addEventListener('fetch', (event) => {
  // Supabase və API sorğularını cache-ləmə
  if (
    (event.request.url.includes('supabase.co') && !event.request.url.includes('storage')) ||
    event.request.url.includes('api.') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Uğurlu cavabı cache-ə yaz
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
          });
        }
        return response;
      })
      .catch(() => {
        // Şəbəkə yoxdursa cache-dən ver
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Əsas səhifəni qaytar (offline fallback)
          // Naviqasiya sorğuları üçün cache-dən qaytar, yoxdursa network-ə get
if (event.request.mode === 'navigate') {
  return fetch(event.request);
}
return caches.match('/');
        });
      })
  );
});

// Bildiriş göstər
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'schedule-notification',
      requireInteraction: false,
    });
  }
});

// Bildirişə klik
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});