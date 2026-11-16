/* Lieux, réglages et dernières données, conservés dans l'iPad. */
(function () {
  function read(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) {
      SM.diag.warn('cannot store ' + key);
      return false;
    }
  }

  var S = {};

  S.places = function () {
    var p = read('sm.places', null);
    if (!p || !p.length) p = SM.DEFAULT_PLACES.slice();
    // Les lieux d'origine enregistrés avant la 1.1.0 n'avaient leurs noms qu'en français.
    p.forEach(function (q) {
      SM.DEFAULT_PLACES.forEach(function (d) { if (d.id === q.id && !q.names) q.names = d.names; });
    });
    // 1.10.0 puis 1.11.0 (Singapour, Tokyo) : les nouveaux lieux d'origine rejoignent la liste déjà enregistrée, le tout rangé d'ouest en est.
    if (read('sm.defaults', 1) < 3) {
      SM.DEFAULT_PLACES.forEach(function (d) { if (!p.some(function (q) { return q.id === d.id; })) p.push(d); });
      p.sort(function (a, b) { return a.lon - b.lon; });
      write('sm.places', p);
      write('sm.defaults', 3);
    }
    return p;
  };
  S.savePlaces = function (list) { write('sm.places', list); };

  S.settings = function () {
    var s = read('sm.settings', {});
    // Avant la 1.1.0, la langue par défaut suivait l'iPad ; sans choix explicite, on passe à l'anglais.
    if (s.lang === 'auto' && !s.langChosen) delete s.lang;
    var out = { langChosen: !!s.langChosen };
    Object.keys(SM.DEFAULT_SETTINGS).forEach(function (k) { out[k] = s[k] !== undefined ? s[k] : SM.DEFAULT_SETTINGS[k]; });
    return out;
  };
  S.saveSettings = function (s) { write('sm.settings', s); };

  S.current = function () { return read('sm.current', null); };
  S.saveCurrent = function (id) { write('sm.current', id); };

  S.mode = function () { return read('sm.mode', 'place'); };
  S.saveMode = function (m) { write('sm.mode', m); };

  S.startPlace = function () { return read('sm.start', null); };
  S.saveStartPlace = function (id) { write('sm.start', id); };

  S.weather = function (id) { return read('sm.w.' + id, null); };
  S.saveWeather = function (id, w) { write('sm.w.' + id, w); };
  S.dropWeather = function (id) { try { localStorage.removeItem('sm.w.' + id); } catch (e) { /* rien */ } };

  SM.store = S;
})();
