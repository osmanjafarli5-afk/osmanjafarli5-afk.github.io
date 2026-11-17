/* Maşın Elanları — PWA service worker
   HTML: şəbəkədən (həmişə təzə), şəkillər: keşdən (sürətli). */
const VER = 'v4';
const STATIC = `masin-static-${VER}`;
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png',
               '/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // HTML / naviqasiya — şəbəkə birinci, düşsə keşdən
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(STATIC).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('/')))
    );
    return;
  }

  // şəkillər — keşdən, olmasa şəbəkədən və keşə yaz
  if (/\.(png|jpe?g|webp|svg|gif|ico)$/i.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(STATIC).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
    return;
  }

  // JS/CSS — şəbəkə birinci (yeniliklər dərhal görünsün)
  if (/\.(js|css)$/i.test(url.pathname)) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(STATIC).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // qalanı — keşden, yoxsa şəbəkə
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
