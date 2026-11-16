/* Soleil et lune, calculés sur place (formules de SunCalc, d'après Meeus). */
(function () {
  var PI = Math.PI, rad = PI / 180;
  var e = rad * 23.4397;

  function days(ms) { return ms / 86400000 - 10957.5; }
  function ra(l, b) { return Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l)); }
  function dec(l, b) { return Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l)); }
  function sidereal(d, lw) { return rad * (280.16 + 360.9856235 * d) - lw; }
  function altitude(H, phi, de) { return Math.asin(Math.sin(phi) * Math.sin(de) + Math.cos(phi) * Math.cos(de) * Math.cos(H)); }
  function azimuth(H, phi, de) { return Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(de) * Math.cos(phi)); }

  function sunCoords(d) {
    var M = rad * (357.5291 + 0.98560028 * d);
    var C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    var L = M + C + rad * 102.9372 + PI;
    return { dec: dec(L, 0), ra: ra(L, 0) };
  }

  function moonCoords(d) {
    var L = rad * (218.316 + 13.176396 * d);
    var M = rad * (134.963 + 13.064993 * d);
    var F = rad * (93.272 + 13.229350 * d);
    var l = L + rad * 6.289 * Math.sin(M);
    var b = rad * 5.128 * Math.sin(F);
    return { ra: ra(l, b), dec: dec(l, b), dist: 385001 - 20905 * Math.cos(M) };
  }

  var A = {};

  /* Hauteur et azimut en degrés, azimut compté depuis le nord vers l'est. */
  A.sun = function (ms, lat, lon) {
    var lw = rad * -lon, phi = rad * lat, d = days(ms);
    var c = sunCoords(d), H = sidereal(d, lw) - c.ra;
    return { alt: altitude(H, phi, c.dec) / rad, az: (azimuth(H, phi, c.dec) / rad + 180 + 360) % 360 };
  };

  A.moon = function (ms, lat, lon) {
    var lw = rad * -lon, phi = rad * lat, d = days(ms);
    var c = moonCoords(d), H = sidereal(d, lw) - c.ra;
    var h = altitude(H, phi, c.dec);
    h = h + rad * 0.017 / Math.tan(h + rad * 10.26 / (h + rad * 5.10));
    return { alt: h / rad, az: (azimuth(H, phi, c.dec) / rad + 180 + 360) % 360 };
  };

  /* fraction éclairée (0-1), phase (0 nouvelle, 0,5 pleine), croissante ou non. */
  A.moonPhase = function (ms) {
    var d = days(ms), s = sunCoords(d), m = moonCoords(d), sdist = 149598000;
    var phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
    var inc = Math.atan2(sdist * Math.sin(phi), m.dist - sdist * Math.cos(phi));
    var angle = Math.atan2(Math.cos(s.dec) * Math.sin(s.ra - m.ra), Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra));
    var phase = 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / PI;
    return { fraction: (1 + Math.cos(inc)) / 2, phase: phase, waxing: phase < 0.5 };
  };

  A.phaseIndex = function (phase) { return Math.round(phase * 8) % 8; };

  /* Point de la Terre où l'astre est au zénith : latitude = déclinaison, longitude = ascension droite − temps sidéral de Greenwich. */
  function subPoint(c, d) {
    var lon = (c.ra - sidereal(d, 0)) / rad;
    lon = ((lon + 540) % 360 + 360) % 360 - 180;
    return { lat: c.dec / rad, lon: lon };
  }
  A.subSolar = function (ms) { var d = days(ms); return subPoint(sunCoords(d), d); };
  A.subLunar = function (ms) { var d = days(ms); return subPoint(moonCoords(d), d); };

  /* Lever et coucher (hauteur −0,833°) autour d'un instant, par recherche minute à minute puis affinage. */
  A.crossings = function (fromMs, lat, lon, hours) {
    var out = [], step = 10 * 60000, prev = A.sun(fromMs, lat, lon).alt + 0.833;
    for (var t = fromMs + step; t <= fromMs + hours * 3600000; t += step) {
      var cur = A.sun(t, lat, lon).alt + 0.833;
      if ((prev < 0) !== (cur < 0)) {
        var a = t - step, b = t;
        for (var k = 0; k < 20; k++) {
          var m = (a + b) / 2, v = A.sun(m, lat, lon).alt + 0.833;
          if ((v < 0) === (prev < 0)) a = m; else b = m;
        }
        out.push({ t: (a + b) / 2, rise: prev < 0 });
      }
      prev = cur;
    }
    return out;
  };

  SM.astro = A;
  if (typeof module !== 'undefined') module.exports = A;
})();
