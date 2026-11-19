/* Mises à jour : compare la version en ligne à celle qui tourne, et recharge la page quand une autre version est en ligne. */
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

  /* Mise à jour : un simple rechargement, sans rien effacer. La page vient du réseau d'abord (sw.js), ses fichiers
     portent la nouvelle version dans leur adresse, et le nouveau service worker remplace l'ancien cache quand il
     s'active. Jusqu'à la 1.30.6, on effaçait les caches et on désinscrivait le service worker avant de recharger :
     sur l'iPad (iOS 12), la page repartait alors gelée dès la première seconde, par blocs d'une à deux minutes
     (journal du 19/11 : FROZEN 64 s, 89 s puis 126 s juste après « clearing caches and reloading »). */
  U.force = function () {
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* stockage indisponible */ }
    SM.diag.info('update: reloading, nothing cleared'); SM.diag.flush();
    location.replace(location.pathname + '?r=' + Date.now());
  };

  /* Bouton « Forcer la mise à jour » : seulement si une autre version est en ligne. Une app à jour n'efface plus
     ses fichiers en réserve (demande de Matt, 18/11, après un gel de l'iPad qui a suivi un forçage inutile). */
  U.forceIfNewer = function () {
    if (!U.latest || U.latest === SM.VERSION) { SM.diag.info('update: button ignored, running ' + SM.VERSION + ', online ' + (U.latest || '?')); return; }
    U.force();
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
