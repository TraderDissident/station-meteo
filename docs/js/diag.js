/* Journal d'erreurs, lisible depuis l'écran Diagnostic. Chargé en premier. */
(function () {
  var KEY = 'sm.log';
  var MAX = 100;
  var lines = [];
  try { lines = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { lines = []; }

  function stamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getMonth() + 1) + '/' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* stockage plein ou bloqué */ }
  }

  function log(level, msg) {
    lines.push(stamp() + ' ' + level + ' ' + String(msg).slice(0, 300));
    if (lines.length > MAX) lines = lines.slice(lines.length - MAX);
    save();
  }

  SM.diag = {
    info: function (m) { log('·', m); },
    warn: function (m) { log('!', m); },
    error: function (m) { log('✕', m); },
    lines: function () { return lines.slice(); },
    clear: function () { lines = []; save(); },
    errors: function () { return lines.filter(function (l) { return l.indexOf(' ✕ ') > 0; }).length; },
    fps: 0,
    lastFetch: '',
    started: Date.now()
  };

  window.addEventListener('error', function (e) {
    SM.diag.error((e.message || 'error') + ' @ ' + (e.filename || '').split('/').pop() + ':' + (e.lineno || 0));
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    SM.diag.error('promise: ' + (r && r.message ? r.message : r));
  });
  SM.diag.info('start ' + SM.VERSION + ' · ' + innerWidth + '×' + innerHeight);

  /* Boîte noire, pour comprendre un iPad figé : toutes les 30 s, l'app note qu'elle vit encore (heure, écran affiché,
     dernière météo reçue). Au démarrage suivant, si la dernière note date de plus de 2 min sans fermeture propre, le
     journal dit à quelle heure l'app s'est arrêtée et ce qu'elle affichait. Un blocage de plus de 5 s pendant qu'elle
     est à l'écran est noté aussi, avec sa durée. */
  var AKEY = 'sm.alive';
  try {
    var prev = JSON.parse(localStorage.getItem(AKEY) || 'null');
    if (prev && !prev.bye && Date.now() - prev.t > 120000) {
      var d = new Date(prev.t);
      SM.diag.error('previous run stopped answering at ' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.toTimeString().slice(0, 8) +
        ' · v' + prev.v + ' · ' + prev.ctx + ' · up ' + Math.round(prev.up / 60) + ' min');
    }
  } catch (e) { /* rien */ }
  function alive(bye) {
    try {
      var app = SM.app, ctx = '';
      if (app) {
        ctx = app.mode === 'map' ? 'map ' + (localStorage.getItem('sm.mapView') || 'map') + (app.mapFull ? ' full' : '') : 'place ' + ((app.places[app.idx] || {}).id || '');
        ctx += app.sheet ? ' · sheet ' + app.sheet : '';
      }
      ctx += ' · fps ' + SM.diag.fps + ' · dom ' + document.getElementsByTagName('*').length + ' · ' + SM.diag.lastFetch;
      localStorage.setItem(AKEY, JSON.stringify({ t: Date.now(), v: SM.VERSION, ctx: ctx, up: (Date.now() - SM.diag.started) / 1000, bye: !!bye }));
    } catch (e) { /* rien */ }
  }
  setInterval(function () { if (!document.hidden) alive(false); }, 30000);
  window.addEventListener('pagehide', function () { alive(true); });
  var tick = Date.now();
  setInterval(function () {
    var now = Date.now(), gap = now - tick;
    tick = now;
    if (gap > 6000 && !document.hidden) SM.diag.warn('stall ' + Math.round(gap / 1000) + ' s');
  }, 1000);
  document.addEventListener('visibilitychange', function () { tick = Date.now(); });
})();
