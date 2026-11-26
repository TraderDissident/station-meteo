/* Ancienne adresse de Station Météo (devenue Weather Hub) : ce service worker remplace l'ancien, se désinscrit et
   renvoie chaque fenêtre ouverte vers la nouvelle adresse. Les données (lieux, réglages) restent : même site. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(self.registration.unregister().then(function () { return self.clients.matchAll({ type: 'window' }); }).then(function (cs) {
    cs.forEach(function (c) { if (c.navigate) c.navigate(c.url.replace('/station-meteo/', '/weather-hub/')); });
  }));
});
self.addEventListener('fetch', function (e) { e.respondWith(fetch(e.request)); });
