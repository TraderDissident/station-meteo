/* Mises à jour : compare la version en ligne à celle qui tourne, et sait repartir de zéro (service worker et caches effacés). */
(function () {
  'use strict';
  var KEY = 'sm-update-try';
  var U = { latest: null, lastCheck: 0 };

  // config.js lu directement sur le réseau : « fresh » fait passer le service worker à côté.
  U.latestVersion = function () {
    return fetch('js/config.js?fresh=' + Date.now(), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (t) {
      var m = /SM\.VERSION = '([^']+)'/.exec(t);
      U.latest = m ? m[1] : null;
      return U.latest;
    });
  };

  // Efface tout ce qui garde l'ancienne version, puis recharge depuis le réseau.
  U.force = function () {
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* stockage indisponible */ }
    SM.diag.info('update: clearing caches and reloading'); SM.diag.flush();
    var jobs = [];
    if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
      jobs.push(navigator.serviceWorker.getRegistrations().then(function (regs) {
        return Promise.all(regs.map(function (r) { return r.unregister(); }));
      }));
    }
    if (window.caches) {
      jobs.push(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== 'sm-diag'; }).map(function (k) { return caches.delete(k); })); }));
    }
    var go = function () { location.replace(location.pathname + '?r=' + Date.now()); };
    Promise.all(jobs).then(go, go);
  };

  // Au démarrage et au retour sur l'app (au plus toutes les 30 min) : version plus récente en ligne ⇒ mise à jour seule.
  U.check = function () {
    if (location.protocol !== 'https:' || !navigator.onLine) return Promise.resolve(null);
    if (Date.now() - U.lastCheck < 30 * 60000) return Promise.resolve(U.latest);
    U.lastCheck = Date.now();
    return U.latestVersion().then(function (v) {
      SM.diag.info('update check: online ' + v + ', running ' + SM.VERSION);
      if (!v || v === SM.VERSION) return v;
      var last = 0;
      try { last = parseInt(localStorage.getItem(KEY), 10) || 0; } catch (e) { /* rien */ }
      // GitHub Pages garde ses fichiers 10 min : pas de nouvel essai avant 15 min, pour ne jamais boucler.
      if (Date.now() - last > 15 * 60000) { SM.diag.info('update ' + SM.VERSION + ' → ' + v); U.force(); }
      return v;
    }).catch(function (e) { SM.diag.warn('update check: ' + e.message); return null; });
  };

  SM.update = U;
})();
