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
})();
