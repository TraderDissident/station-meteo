/* Indice de bien-être sur 10 (docs-conception/indice-bien-etre.md). Base thermique (température ressentie, zone
   idéale 22 à 27 °C) × gênes (pluie, vent, qualité de l'air, ciel, moiteur, UV), puis plafonds : une gêne forte
   limite la note à elle seule, et quatre dangers la plafonnent (orage, grêle, verglas, brouillard dense).
   Chaque critère est noté de façon continue, sans palier : une petite variation de la météo ne fait jamais sauter
   la note. Au soleil ou à l'ombre : le soleil réchauffe le ressenti (4 °C au plus) et donne tous les UV.
   Les valeurs de la formule se règlent dans la feuille « Calibration du ressenti » (calib.js) ; ce qui diffère
   des valeurs proposées est enregistré dans le réglage « comfort ». */
(function () {
  function borne(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function interp(x, p) {
    if (x <= p[0][0]) return p[0][1];
    for (var i = 1; i < p.length; i++) {
      if (x <= p[i][0]) return p[i - 1][1] + (p[i][1] - p[i - 1][1]) * (x - p[i - 1][0]) / (p[i][0] - p[i - 1][0]);
    }
    return p[p.length - 1][1];
  }
  function r1(x) { return Math.round(x * 10 + 1e-9) / 10; }

  // Barèmes : [valeur mesurée, note sur 10], interpolés entre deux points.
  var MOIT = [[14, 10], [17, 7], [19.5, 5], [22.5, 3], [25, 1], [27, 0]];          // point de rosée, °C
  var PLUIE = [[0.1, 7], [0.3, 6.5], [0.75, 6], [1.75, 5], [3.75, 3], [7.5, 2], [15, 1], [25, 0]];   // mm/h
  var POP = [[30, 10], [70, 9], [100, 8]];                                          // probabilité, s'il ne pleut pas
  var CIEL = [[15, 10], [35, 9], [65, 7], [87, 5], [100, 4]];                       // nuages, %
  var VIS = [[1000, 3], [4000, 6], [10000, 10]];                                    // visibilité, m
  var VENT_T = [[12, 10], [20, 9], [24.5, 8], [34, 6], [44.5, 4], [56, 2], [68.5, 1], [80, 0]];   // tempéré, km/h
  var VENT_C = [[3, 8], [9, 10], [16, 10], [24.5, 9], [34, 7], [44.5, 5], [56, 3], [68.5, 1], [80, 0]];   // chaud
  var VENT_F = [[3, 10], [9, 9], [16, 8], [24.5, 6], [34, 4], [44.5, 3], [56, 1], [68.5, 0]];     // froid
  var RAF = [[30, 10], [45, 7], [55, 5], [67, 3], [82, 1], [95, 0]];                // rafales, km/h
  var UV = [[5, 10], [7, 7], [9.5, 5], [12, 3]];
  var AIR = [[40, 10], [55, 7], [70, 5], [90, 2], [100, 0]];                        // indice européen
  var NEIGE = { neige1: 6, neige2: 4, neige3: 2 };
  var ORDRE = ['pluie', 'vent', 'air', 'ciel', 'moiteur', 'uv'];

  // Valeurs proposées de la formule.
  var DEF = { lo: 22, hi: 27, pc: 3.5, pc2: 6, ph: 3, chSeuil: 28, chPente: 2,
    pluie: 60, vent: 40, air: 40, ciel: 20, moiteur: 10, uv: 10,
    k_pluie: 90, k_vent: 80, k_air: 80, k_ciel: 30, k_moiteur: 30, k_uv: 30,
    annonce: 7, fh: 0.5, uvOmbre: 50,
    c_grele: 2, c_orage: 3, c_verglas: 3, c_brouillard: 6 };

  // Valeurs en vigueur : les proposées, sauf celles réglées dans la calibration.
  function cfg() {
    var c = {}, k, own = (SM.app && SM.app.settings && SM.app.settings.comfort) || {};
    for (k in DEF) c[k] = typeof own[k] === 'number' ? own[k] : DEF[k];
    return c;
  }

  // Température ressentie d'Open-Meteo (Steadman), avec le rayonnement du soleil, et point de rosée (Magnus).
  function esat(T) { return 6.105 * Math.exp(17.27 * T / (237.7 + T)); }
  function soleilUV(uv) { return 300 * Math.sqrt(Math.max(0, uv)); }   // rayonnement estimé d'après l'indice UV, W/m²
  function ressenti(T, rh, v, ray) {
    var w = v / 3.6 * 0.75, e = rh / 100 * esat(T), q = Math.max(0, 0.1 * ((ray || 0) - 550));
    return T + 0.348 * e - 0.70 * w + 0.70 * q / (w + 10) - 4.25;
  }
  function rosee(T, rh) {
    var g = Math.log(Math.max(rh, 1) / 100) + 17.625 * T / (243.04 + T);
    return 243.04 * g / (17.625 - g);
  }
  // Ressenti au soleil : celui d'Open-Meteo s'il est fourni ; à l'ombre ou la nuit, sans rayonnement.
  function flOf(s, soleil) {
    if (soleil && SM.U.has(s.fl)) return s.fl;
    return ressenti(s.T, s.rh, s.v || 0, soleil && s.jour ? (SM.U.has(s.ray) ? s.ray : soleilUV(s.uv || 0)) : 0);
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

  /* s = { T, rh, v, g, mm, pop, nuages, uv, aqi, type, vis, jour, fl (ressenti au soleil, facultatif), td (facultatif) }
     soleil : 1 au soleil (par défaut), 0 à l'ombre ; la nuit, toujours 0. */
  function calc(s, c, soleil) {
    c = c || cfg();
    soleil = s.jour ? (soleil === undefined ? 1 : soleil) : 0;
    var T = s.T, v = s.v || 0, g = Math.max(s.g || 0, v), mm = s.mm || 0, pop = s.pop || 0, type = s.type || 'auto';
    var rh = SM.U.has(s.rh) ? s.rh : 60, vis = SM.U.has(s.vis) ? s.vis : 20000, aqi = SM.U.has(s.aqi) ? s.aqi : 0;
    var fl = flOf(s, soleil), td = SM.U.has(s.td) ? s.td : rosee(T, rh);
    var n = {}, caps = [], p, i, key;
    // Confort thermique. Par temps froid, l'humidité ne réchauffe plus (calcul comme à 50 %), et le froid humide coûte un peu.
    var froid = borne((c.lo - fl) / 8, 0, 1);
    var flT = fl - froid * 0.348 * esat(T) * (rh - 50) / 100;
    var th = 10, ec = c.lo - flT;                                            // écart sous la zone idéale
    if (ec > 0) th = ec <= 14 ? 10 - ec / c.pc : 10 - 14 / c.pc - (ec - 14) / c.pc2;
    else if (flT > c.hi) th = 10 - (flT - c.hi) / c.ph;
    th -= c.fh * froid * borne((rh - 75) / 20, 0, 1);
    n.thermique = borne(th, 0, 10);
    n.moiteur = interp(td, MOIT);
    // Pluie, neige, orage.
    var popNote = interp(pop, POP);
    if (type === 'grele') { p = 0; caps.push([c.c_grele, 'hail']); }
    else if (type === 'orage') { p = Math.min(mm >= 0.1 ? interp(mm, PLUIE) : 10, 2); caps.push([c.c_orage, 'storm']); }
    else if (type === 'verglas') { p = 1; caps.push([c.c_verglas, 'freezing']); }
    else if (NEIGE[type]) { p = NEIGE[type]; }
    else if (type === 'violente') { p = Math.min(interp(Math.max(mm, 0.1), PLUIE), 1); }
    else if (mm >= 0.1) { p = interp(mm, PLUIE); }
    else if (type === 'annonce') { p = Math.min(popNote, c.annonce); }
    else { p = popNote; }
    n.pluie = p;
    // Ciel : nuages et visibilité. Par forte chaleur, de jour, les nuages gênent moins ; la nuit, le ciel compte deux fois moins.
    var ci = Math.min(interp(s.nuages || 0, CIEL), interp(vis, VIS));
    if (s.jour) ci += borne((fl - 27) / 4, 0, 1) * Math.max(0, 8 - ci);
    else ci = 10 - (10 - ci) / 2;
    if (vis < 1000) caps.push([interp(vis, [[200, c.c_brouillard], [1000, 10]]), 'fog']);
    n.ciel = ci;
    // Vent : barème du froid sous 13 °C, du chaud entre 29 et 35 °C, passage progressif entre les deux.
    var wF = borne((17 - T) / 4, 0, 1), wC = borne((T - 25) / 4, 0, 1) * borne((39 - T) / 4, 0, 1);
    n.vent = Math.min(wF * interp(v, VENT_F) + wC * interp(v, VENT_C) + (1 - wF - wC) * interp(v, VENT_T), interp(g, RAF));
    // Chaleur sèche : le ressenti la sous-estime, l'air très chaud limite la note.
    if (T > c.chSeuil) caps.push([Math.max(0, 10 - (T - c.chSeuil) / c.chPente), 'heat']);
    n.uv = s.jour ? interp((s.uv || 0) * (soleil ? 1 : c.uvOmbre / 100), UV) : 10;
    n.air = interp(aqi, AIR);
    var brut = n.thermique, eff = {}, f;
    for (i = 0; i < ORDRE.length; i++) {
      key = ORDRE[i];
      eff[key] = c[key] * (10 - n[key]) / 10;   // retrait, en %
      brut *= 1 - eff[key] / 100;
      f = 10 - c['k_' + key] / 100 * (10 - n[key]);   // une gêne forte limite aussi la note à elle seule
      if (f < 10) caps.push([f, key]);
    }
    brut = r1(brut);
    var note = brut, lim = '';
    for (i = 0; i < caps.length; i++) { if (r1(caps[i][0]) < note) { note = r1(caps[i][0]); lim = caps[i][1]; } }
    return { fl: fl, td: td, n: n, eff: eff, brut: brut, note: note, lim: lim, soleil: soleil };
  }

  // Niveau de la note : clé du libellé et couleur.
  function level(x) {
    return x < 1 ? 'extreme' : (x < 3 ? 'tough' : (x < 5 ? 'poor' : (x < 7 ? 'fair' : (x < 9 ? 'pleasant' : 'ideal'))));
  }

  /* Situation de l'instant pour un lieu, d'après les données reçues (aucune requête de plus). */
  function situation(w, nowS) {
    if (!w || !w.current || !SM.U.has(w.current.temp)) return null;
    var c = w.current, hi = SM.ui.hourIndex(w, nowS), h = (w.hourly && w.hourly[hi]) || {};
    var m0 = w.minutely && w.minutely.length ? w.minutely[0].p : null;
    var code = SM.U.has(c.code) ? c.code : 0;
    var vis = SM.U.has(h.vis) ? h.vis : 20000;
    if (code === 45 || code === 48) vis = Math.min(vis, 999);
    var mm = SM.U.has(m0) ? m0 * 4 : (c.precip || 0), type = typeOf(code);
    // Pluie ou bruine annoncée par le code, presque rien mesuré.
    if (type === 'auto' && mm < 0.1 && code >= 51 && code <= 82) type = 'annonce';
    return {
      T: c.temp, rh: SM.U.has(c.hum) ? c.hum : 60, v: c.wind || 0, g: c.gust || 0,
      mm: mm, pop: h.pop || 0, nuages: SM.U.has(c.cloud) ? c.cloud : 0,
      uv: h.uv || 0, aqi: w.air ? w.air.aqi : null, type: type, vis: vis, jour: c.isDay ? 1 : 0,
      fl: c.feels, td: SM.U.has(h.dew) ? h.dew : null
    };
  }
  function now(w, nowS) { var s = situation(w, nowS); return s ? calc(s) : null; }

  SM.comfort = { calc: calc, now: now, situation: situation, level: level, typeOf: typeOf, ressenti: ressenti, rosee: rosee,
    cfg: cfg, DEF: DEF, ORDRE: ORDRE };
})();
