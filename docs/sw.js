/* Garde la coquille de l'app pour démarrer sans réseau. Les données météo ne passent jamais par ici. */
var VERSION = 'sm-1.1.0';
var SHELL = [
  './', 'index.html', 'css/app.css?v=1.1.0',
  'js/config.js?v=1.1.0', 'js/diag.js?v=1.1.0', 'js/compat.js?v=1.1.0', 'js/store.js?v=1.1.0', 'js/i18n.js?v=1.1.0',
  'js/api.js?v=1.1.0', 'js/astro.js?v=1.1.0', 'js/codes.js?v=1.1.0', 'js/icons.js?v=1.1.0', 'js/sky.js?v=1.1.0',
  'js/ui.js?v=1.1.0', 'js/places.js?v=1.1.0', 'js/settings.js?v=1.1.0', 'js/app.js?v=1.1.0',
  'img/icon-180.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* Même origine seulement : réponse du cache tout de suite, mise à jour du cache en arrière-plan. */
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(e.request).then(function (hit) {
      var net = fetch(e.request).then(function (r) {
        if (r && r.ok) c.put(e.request, r.clone());
        return r;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
