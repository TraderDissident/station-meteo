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
      SM.diag.warn('stockage impossible : ' + key);
      return false;
    }
  }

  var S = {};

  S.places = function () {
    var p = read('sm.places', null);
    if (!p || !p.length) p = SM.DEFAULT_PLACES.slice();
    return p;
  };
  S.savePlaces = function (list) { write('sm.places', list); };

  S.settings = function () {
    var s = read('sm.settings', {});
    var out = {};
    Object.keys(SM.DEFAULT_SETTINGS).forEach(function (k) { out[k] = s[k] !== undefined ? s[k] : SM.DEFAULT_SETTINGS[k]; });
    return out;
  };
  S.saveSettings = function (s) { write('sm.settings', s); };

  S.current = function () { return read('sm.current', null); };
  S.saveCurrent = function (id) { write('sm.current', id); };

  S.startPlace = function () { return read('sm.start', null); };
  S.saveStartPlace = function (id) { write('sm.start', id); };

  S.weather = function (id) { return read('sm.w.' + id, null); };
  S.saveWeather = function (id, w) { write('sm.w.' + id, w); };
  S.dropWeather = function (id) { try { localStorage.removeItem('sm.w.' + id); } catch (e) { /* rien */ } };

  SM.store = S;
})();
