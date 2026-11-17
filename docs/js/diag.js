/* Journal de l'app, lisible et copiable depuis l'écran Diagnostic. Chargé en premier.
   Gardé 7 jours dans l'iPad (4 000 lignes au plus). Chaque ligne : date, heure à la seconde, niveau, message.
   Niveaux : · information, ! avertissement, ✕ erreur. */
(function () {
  var KEY = 'sm.log2';
  var KEEP_MS = 7 * 24 * 3600 * 1000, MAX = 4000;
  var rows = [];   // [temps en ms, niveau, message]
  try { rows = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { rows = []; }
  try { localStorage.removeItem('sm.log'); } catch (e) { /* ancien journal */ }

  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function stamp(t) {
    var d = new Date(t);
    return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
  }
  function prune() {
    var limit = Date.now() - KEEP_MS, i = 0;
    while (i < rows.length && rows[i][0] < limit) i++;
    if (i) rows = rows.slice(i);
    if (rows.length > MAX) rows = rows.slice(rows.length - MAX);
  }
  var saveT = 0;
  function saveNow() {
    clearTimeout(saveT); saveT = 0;
    prune();
    try { localStorage.setItem(KEY, JSON.stringify(rows)); } catch (e) {
      // Stockage plein : on garde la moitié la plus récente.
      rows = rows.slice(Math.floor(rows.length / 2));
      try { localStorage.setItem(KEY, JSON.stringify(rows)); } catch (e2) { /* bloqué */ }
    }
  }
  // Avertissements et erreurs écrits tout de suite ; les informations, groupées (2 s), pour ménager l'iPad.
  function log(level, msg) {
    rows.push([Date.now(), level, String(msg).slice(0, 400)]);
    if (level === '·') { if (!saveT) saveT = setTimeout(saveNow, 2000); } else saveNow();
  }
  function line(r) { return stamp(r[0]) + ' ' + r[1] + ' ' + r[2]; }

  SM.diag = {
    info: function (m) { log('·', m); },
    warn: function (m) { log('!', m); },
    error: function (m) { log('✕', m); },
    lines: function () { return rows.map(line); },
    count: function () { return rows.length; },
    days: 7,
    clear: function () { rows = []; saveNow(); },
    errors: function () { return rows.filter(function (r) { return r[1] === '✕'; }).length; },
    flush: saveNow,
    // Texte complet à copier : l'état de l'appareil, puis le journal du plus récent au plus ancien.
    report: function () {
      var a = SM.app, head = [
        'Station Météo ' + SM.VERSION + ' · ' + stamp(Date.now()),
        navigator.userAgent,
        'screen ' + screen.width + '×' + screen.height + ' · window ' + innerWidth + '×' + innerHeight + ' · ×' + (window.devicePixelRatio || 1) +
          ' · standalone ' + (navigator.standalone ? 'yes' : 'no') + ' · ' + (navigator.onLine ? 'online' : 'offline'),
        'up ' + Math.round((Date.now() - SM.diag.started) / 60000) + ' min · fps ' + SM.diag.fps + ' · dom ' + document.getElementsByTagName('*').length +
          ' · canvas ' + document.getElementsByTagName('canvas').length + ' · last request ' + (SM.diag.lastFetch || '–'),
        a ? 'mode ' + a.mode + ' · place ' + ((a.places[a.idx] || {}).id || '') + ' · places ' + a.places.length + ' · settings ' + JSON.stringify(a.settings) : '',
        rows.length + ' lines · ' + SM.diag.days + ' days kept',
        ''
      ];
      return head.concat(rows.map(line).reverse()).join('\n');
    },
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
  SM.diag.info('start ' + SM.VERSION + ' · ' + innerWidth + '×' + innerHeight + ' · ' + (navigator.standalone ? 'home screen' : 'browser') + ' · ' + (navigator.onLine ? 'online' : 'offline'));

  /* Boîte noire : toutes les 30 s, l'app note qu'elle vit encore (heure, écran affiché, dernière météo reçue). Au
     démarrage suivant, si la dernière note date de plus de 2 min sans fermeture propre, le journal dit à quelle
     heure l'app s'est arrêtée et ce qu'elle affichait. */
  var AKEY = 'sm.alive';
  function context() {
    var app = SM.app, ctx = '';
    try {
      if (app) {
        ctx = app.mode === 'map' ? 'map ' + (localStorage.getItem('sm.mapView') || 'map') + (app.mapFull ? ' full' : '') : 'place ' + ((app.places[app.idx] || {}).id || '');
        ctx += app.sheet ? ' · sheet ' + app.sheet : '';
      }
    } catch (e) { /* rien */ }
    return ctx + ' · fps ' + SM.diag.fps + ' · dom ' + document.getElementsByTagName('*').length + ' · canvas ' + document.getElementsByTagName('canvas').length;
  }
  try {
    var prev = JSON.parse(localStorage.getItem(AKEY) || 'null');
    if (prev && !prev.bye && Date.now() - prev.t > 120000) {
      SM.diag.error('previous run stopped answering at ' + stamp(prev.t) + ' · v' + prev.v + ' · ' + prev.ctx + ' · up ' + Math.round(prev.up / 60) + ' min');
    }
  } catch (e) { /* rien */ }
  function alive(bye) {
    try { localStorage.setItem(AKEY, JSON.stringify({ t: Date.now(), v: SM.VERSION, ctx: context(), up: (Date.now() - SM.diag.started) / 1000, bye: !!bye })); } catch (e) { /* rien */ }
  }
  setInterval(function () { if (!document.hidden) alive(false); }, 30000);

  /* Gel : une minuterie d'une seconde qui revient avec plus de 6 s de retard, alors que la page est à l'écran,
     veut dire que tout était arrêté. On note la durée et l'heure du début : c'est la trace du blocage nocturne. */
  var tick = Date.now(), hiddenAt = 0;
  setInterval(function () {
    var now = Date.now(), gap = now - tick;
    if (gap > 6000 && !document.hidden) SM.diag.error('FROZEN ' + Math.round(gap / 1000) + ' s (since ' + stamp(tick) + ') · ' + context());
    tick = now;
  }, 1000);

  /* Tout ce que le système fait à la page : masquée, montrée, mise en veille, réveillée, réseau, taille. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { hiddenAt = Date.now(); SM.diag.info('page hidden'); saveNow(); }
    else { SM.diag.info('page visible' + (hiddenAt ? ' after ' + Math.round((Date.now() - hiddenAt) / 1000) + ' s' : '')); tick = Date.now(); }
  });
  window.addEventListener('pagehide', function (e) { SM.diag.info('pagehide' + (e.persisted ? ' (kept in memory)' : '')); alive(true); saveNow(); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) SM.diag.info('pageshow (back from memory)'); });
  window.addEventListener('online', function () { SM.diag.info('network online'); });
  window.addEventListener('offline', function () { SM.diag.warn('network offline'); });
  window.addEventListener('focus', function () { SM.diag.info('window focus'); });
  window.addEventListener('blur', function () { SM.diag.info('window blur'); });
  window.addEventListener('orientationchange', function () { SM.diag.info('orientation ' + window.orientation); });
  ['freeze', 'resume'].forEach(function (n) { document.addEventListener(n, function () { SM.diag.warn('page ' + n); saveNow(); }); });
  // Premier toucher après un long silence : dit quand quelqu'un est revenu devant l'iPad.
  var lastTouch = Date.now();
  ['touchstart', 'mousedown'].forEach(function (n) {
    document.addEventListener(n, function () {
      var idle = Date.now() - lastTouch;
      if (idle > 10 * 60000) SM.diag.info('touch after ' + Math.round(idle / 60000) + ' min idle');
      lastTouch = Date.now();
    }, { capture: true, passive: true });
  });
  // Point de situation toutes les heures.
  setInterval(function () { if (!document.hidden) SM.diag.info('hourly · up ' + Math.round((Date.now() - SM.diag.started) / 60000) + ' min · ' + context()); }, 3600000);
})();
