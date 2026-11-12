const V = 'caldaia-v4';
const FILES = ['./', 'index.html', 'caldaia.html', 'altro-marchio.html', 'configuratore.html', 'etichette.html', 'installatore.html', 'style.css', 'app.js', 'caldaia.js', 'theme.js', 'vendor/qrcode.js', 'vendor/jspdf.umd.min.js', 'vendor/html5-qrcode.min.js'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(FILES))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
