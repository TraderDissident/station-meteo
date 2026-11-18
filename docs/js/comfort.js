/* Indice de bien-être sur 10. Barèmes et formule du document de conception (docs-conception/indice-bien-etre.md),
   validés par Matt le 18/11/2026 : base thermique (température ressentie, zone idéale 22 à 27 °C) × gênes (pluie,
   vent, qualité de l'air, ciel, moiteur, UV), puis plafonds en cas de danger. Même calcul que la page à curseurs. */
(function () {
  var INF = Infinity;
  function band(x, t) { for (var i = 0; i < t.length; i++) { if (x < t[i][0]) return t[i][1]; } return t[t.length - 1][1]; }

  var MOIT = [[-5, 9], [13, 10], [16, 9], [18, 7], [21, 5], [24, 3], [26, 1], [INF, 0]];
  var PLUIE = [[0.1, 10], [0.5, 7], [1, 6], [2.5, 5], [5, 3], [10, 2], [20, 1], [INF, 0]];
  var POP = [[30, 10], [70, 9], [INF, 8]];
  var CIEL = [[20, 10], [50, 9], [80, 7], [95, 5], [INF, 4]];
  var VENT_T = [[6, 10], [12, 10], [20, 9], [29, 8], [39, 6], [50, 4], [62, 2], [75, 1], [INF, 0]];
  var VENT_C = [[6, 8], [12, 10], [20, 10], [29, 9], [39, 7], [50, 5], [62, 3], [75, 1], [INF, 0]];
  var VENT_F = [[6, 10], [12, 9], [20, 8], [29, 6], [39, 4], [50, 3], [62, 1], [75, 0], [INF, 0]];
  var RAF = [[40, 10], [50, 7], [60, 5], [75, 3], [90, 1], [INF, 0]];
  var UV = [[6, 10], [8, 7], [11, 5], [INF, 3]];
  var AIR = [[40, 10], [60, 7], [80, 5], [100, 2], [INF, 0]];

  var CFG = { lo: 22, hi: 27, pc: 5, ph: 2,
    pluie: 60, vent: 40, air: 40, ciel: 20, moiteur: 10, uv: 10,
    c_grele: 2, c_orage: 3, c_verglas: 3, c_violente: 3, c_forte: 4, c_neige: 4,
    c_tempete: 1, c_ventfort: 3, c_coupvent: 5, canSeuil: 40, c_canicule: 3, c_extreme: 1, c_airx: 3, c_airtm: 5, c_brouillard: 6 };
  var ORDRE = ['pluie', 'vent', 'air', 'ciel', 'moiteur', 'uv'];
  var NEIGE = { neige1: 6, neige2: 4, neige3: 2 };

  // Température ressentie d'Open-Meteo (Steadman, à l'ombre), et point de rosée (Magnus).
  function ressenti(T, rh, v) {
    var w = v / 3.6 * 0.75, e = rh / 100 * 6.105 * Math.exp(17.27 * T / (237.7 + T));
    return T + 0.348 * e - 0.70 * w - 4.25;
  }
  function rosee(T, rh) {
    var g = Math.log(Math.max(rh, 1) / 100) + 17.625 * T / (243.04 + T);
    return 243.04 * g / (17.625 - g);
  }
  function therm(fl, c) {
    var n = 10;
    if (fl < c.lo) n = 10 - Math.ceil((c.lo - fl) / c.pc);
    else if (fl >= c.hi) n = 10 - (Math.floor((fl - c.hi) / c.ph) + 1);
    return Math.max(0, n);
  }
  // Type de précipitation d'après le code météo d'Open-Meteo.
  function typeOf(code) {
    if (code === 96 || code === 99) return 'grele';
    if (code === 95 || code === 97) return 'orage';
    if (code === 56 || code === 57 || code === 66 || code === 67) return 'verglas';
    if (code === 71 || code === 77 || code === 85) return 'neige1';
    if (code === 73) return 'neige2';
    if (code === 75 || code === 86) return 'neige3';
    if (code === 82) return 'violente';
    return 'auto';
  }

  /* s = { T, rh, v, g, mm, pop, nuages, uv, aqi, type, vis, jour, fl (ressenti fourni, facultatif), td (facultatif) } */
  function calc(s, c) {
    c = c || CFG;
    var T = s.T, v = s.v || 0, g = Math.max(s.g || 0, v);
    var fl = s.fl !== undefined && s.fl !== null ? s.fl : ressenti(T, s.rh, v);
    var td = s.td !== undefined && s.td !== null ? s.td : rosee(T, s.rh);
    var n = {}, caps = [], p, mm = s.mm || 0;
    n.thermique = therm(fl, c);
    n.moiteur = band(td, MOIT);
    if (s.type === 'grele') { p = 0; caps.push([c.c_grele, 'hail']); }
    else if (s.type === 'orage') { p = Math.min(band(mm, PLUIE), 2); caps.push([c.c_orage, 'storm']); }
    else if (s.type === 'verglas') { p = 1; caps.push([c.c_verglas, 'freezing']); }
    else if (NEIGE[s.type]) { p = NEIGE[s.type]; }
    else if (mm >= 0.1 || s.type === 'violente') { p = band(mm, PLUIE); }
    else { p = band(s.pop || 0, POP); }
    if (s.type === 'neige3') caps.push([c.c_neige, 'snow']);
    if (mm >= 20 || s.type === 'violente') caps.push([c.c_violente, 'downpour']);
    else if (mm >= 10) caps.push([c.c_forte, 'heavyRain']);
    n.pluie = p;
    var vis = s.vis === undefined || s.vis === null ? 20000 : s.vis, ci;
    if (vis < 1000) ci = 3;
    else {
      ci = band(s.nuages || 0, CIEL);
      if (vis < 4000) ci = Math.min(ci, 6);
      if (s.jour && fl >= 29) ci = Math.max(ci, 8);
    }
    if (!s.jour) ci = 10 - Math.floor((10 - ci) / 2);
    if (vis < 200) caps.push([c.c_brouillard, 'fog']);
    n.ciel = ci;
    var col = T < 15 ? VENT_F : (T >= 27 && T < 37 ? VENT_C : VENT_T);
    n.vent = Math.min(band(v, col), band(g, RAF));
    if (g >= 90 || v >= 75) caps.push([c.c_tempete, 'gale']);
    else if (g >= 75 || v >= 62) caps.push([c.c_ventfort, 'strongWind']);
    else if (g >= 60 || v >= 50) caps.push([c.c_coupvent, 'wind']);
    if (T >= c.canSeuil + 5) caps.push([c.c_extreme, 'extremeHeat']);
    else if (T >= c.canSeuil) caps.push([c.c_canicule, 'heatwave']);
    n.uv = s.jour ? band(s.uv || 0, UV) : 10;
    var aqi = s.aqi === undefined || s.aqi === null ? 0 : s.aqi;
    n.air = band(aqi, AIR);
    if (aqi >= 100) caps.push([c.c_airx, 'airBad']);
    else if (aqi >= 80) caps.push([c.c_airtm, 'airPoor']);
    var brut = n.thermique, eff = {}, i, key;
    for (i = 0; i < ORDRE.length; i++) {
      key = ORDRE[i];
      eff[key] = c[key] * (10 - n[key]) / 10;   // retrait, en %
      brut *= 1 - eff[key] / 100;
    }
    brut = Math.round(brut * 10 + 1e-9) / 10;
    var note = brut, lim = '';
    for (i = 0; i < caps.length; i++) { if (caps[i][0] < note) { note = caps[i][0]; lim = caps[i][1]; } }
    return { fl: fl, td: td, n: n, eff: eff, brut: brut, note: note, lim: lim };
  }

  // Niveau de la note : clé du libellé et couleur.
  function level(x) { return band(x, [[1, 'extreme'], [3, 'tough'], [5, 'poor'], [7, 'fair'], [9, 'pleasant'], [INF, 'ideal']]); }

  /* Situation de l'instant pour un lieu, d'après les données reçues (aucune requête de plus). */
  function now(w, nowS) {
    if (!w || !w.current || !SM.U.has(w.current.temp)) return null;
    var c = w.current, hi = SM.ui.hourIndex(w, nowS), h = (w.hourly && w.hourly[hi]) || {};
    var m0 = w.minutely && w.minutely.length ? w.minutely[0].p : null;
    var code = SM.U.has(c.code) ? c.code : 0;
    var vis = SM.U.has(h.vis) ? h.vis : 20000;
    if (code === 45 || code === 48) vis = Math.min(vis, 999);
    return calc({
      T: c.temp, rh: SM.U.has(c.hum) ? c.hum : 60, v: c.wind || 0, g: c.gust || 0,
      mm: SM.U.has(m0) ? m0 * 4 : (c.precip || 0), pop: h.pop || 0, nuages: SM.U.has(c.cloud) ? c.cloud : 0,
      uv: h.uv || 0, aqi: w.air ? w.air.aqi : null, type: typeOf(code), vis: vis, jour: c.isDay ? 1 : 0,
      fl: c.feels, td: SM.U.has(h.dew) ? h.dew : null
    });
  }

  SM.comfort = { calc: calc, now: now, level: level, typeOf: typeOf, ressenti: ressenti, ORDRE: ORDRE, CFG: CFG };
})();
