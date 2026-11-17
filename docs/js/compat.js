/* Outils communs, écrits pour Safari 12. */
(function () {
  var U = {};

  U.$ = function (sel, root) { return (root || document).querySelector(sel); };
  U.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  U.el = function (tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  U.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  U.pad = function (n) { return (n < 10 ? '0' : '') + n; };
  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  U.has = function (v) { return v !== null && v !== undefined && !(typeof v === 'number' && isNaN(v)); };

  /* Générateur pseudo-aléatoire reproductible, pour qu'un lieu garde le même horizon. */
  U.seeded = function (str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul ? Math.imul(h, 16777619) : (h * 16777619) | 0; }
    var s = h >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* fetch avec délai, sans AbortController. */
  U.fetchJSON = function (url, ms) {
    var timer;
    var timeout = new Promise(function (resolve, reject) {
      timer = setTimeout(function () { reject(new Error('timed out')); }, ms || 15000);
    });
    var req = fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
    return Promise.race([req, timeout]).then(function (v) { clearTimeout(timer); return v; },
      function (e) { clearTimeout(timer); throw e; });
  };

  /* Heure du jour en minutes : « 23:30 », ou un nombre d'heures (réglages d'avant la 1.14.0). */
  U.dayMin = function (v) {
    if (typeof v === 'number') return v * 60;
    var m = /^(\d{1,2}):(\d{2})/.exec(v || '');
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 0;
  };
  U.hhmm = function (v) { var n = U.dayMin(v); return U.pad(Math.floor(n / 60)) + ':' + U.pad(n % 60); };

  /* Couleurs */
  U.hex = function (h) {
    h = h.replace('#', '');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  };
  U.mix = function (a, b, t) { return [U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t), U.lerp(a[2], b[2], t)]; };
  U.rgb = function (c, a) {
    var r = Math.round(c[0]), g = Math.round(c[1]), b = Math.round(c[2]);
    return a == null ? 'rgb(' + r + ',' + g + ',' + b + ')' : 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  };
  U.luma = function (c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; };

  U.raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function (f) { return setTimeout(function () { f(Date.now()); }, 33); };

  SM.U = U;
})();
