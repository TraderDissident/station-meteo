/* Feuille « Calibration du ressenti », ouverte depuis les Réglages comme le Diagnostic. En haut, la note d'une
   situation (au soleil et à l'ombre) avec le détail de chaque critère ; puis la situation, réglable (le lieu
   affiché, un cas type ou des curseurs) ; puis les valeurs de la formule (comfort.js), appliquées partout dans
   l'app dès qu'on lâche un curseur ; enfin les cas types recalculés en direct. */
(function () {
  var U = SM.U, I = SM.i18n;
  function t() { return I.t(); }
  function field(label, html, cls) { return '<div class="field' + (cls ? ' ' + cls : '') + '"><label>' + U.esc(label) + '</label>' + html + '</div>'; }
  function seg(key, options, value) {
    return '<div class="seg" data-ck="' + key + '">' + options.map(function (o) {
      return '<button data-v="' + U.esc(String(o[0])) + '"' + (String(o[0]) === String(value) ? ' class="on"' : '') + '>' + U.esc(o[1]) + '</button>';
    }).join('') + '</div>';
  }
  function num(x, d) { return I.num(x, d === undefined ? (Math.round(x * 10) % 10 ? 1 : 0) : d); }

  // Valeurs de la formule : [clé, min, max, pas, unité]. Les libellés sont dans i18n (calib.k).
  var REG = [
    ['therm', [['lo', 10, 26, 1, ' °C'], ['hi', 20, 34, 1, ' °C'], ['pc', 2, 8, 0.5, ' °C'], ['pc2', 2, 12, 0.5, ' °C'], ['fh', 0, 2, 0.1, ''],
      ['ph', 1, 6, 0.5, ' °C'], ['chSeuil', 24, 40, 1, ' °C'], ['chPente', 1, 5, 0.5, ' °C']]],
    ['weights', [['pluie', 0, 100, 5, ' %'], ['vent', 0, 100, 5, ' %'], ['air', 0, 100, 5, ' %'], ['ciel', 0, 100, 5, ' %'], ['moiteur', 0, 100, 5, ' %'], ['uv', 0, 100, 5, ' %']]],
    ['force', [['k_pluie', 0, 100, 10, ' %'], ['k_vent', 0, 100, 10, ' %'], ['k_air', 0, 100, 10, ' %'], ['k_ciel', 0, 100, 10, ' %'], ['k_moiteur', 0, 100, 10, ' %'], ['k_uv', 0, 100, 10, ' %']]],
    ['other', [['annonce', 5, 10, 0.5, ''], ['uvOmbre', 0, 100, 10, ' %']]],
    ['caps', [['c_orage', 0, 10, 1, ''], ['c_grele', 0, 10, 1, ''], ['c_verglas', 0, 10, 1, ''], ['c_brouillard', 0, 10, 1, '']]]
  ];
  // Situation : [clé, min, max, pas, unité].
  var SIT = [['T', -40, 50, 1, ' °C'], ['rh', 5, 100, 1, ' %'], ['v', 0, 100, 1, ' km/h'], ['g', 0, 130, 1, ' km/h'],
    ['mm', 0, 30, 0.1, ' mm/h'], ['pop', 0, 100, 5, ' %'], ['nuages', 0, 100, 5, ' %'], ['uv', 0, 14, 1, ''], ['aqi', 0, 150, 1, '']];
  var TYPES = ['auto', 'annonce', 'violente', 'neige1', 'neige2', 'neige3', 'verglas', 'orage', 'grele'];
  var VIS = [20000, 3000, 500, 150];

  // Cas types : température, humidité, vent, rafales, nuages, UV, indice de l'air, et le reste s'il diffère.
  function cas(T, rh, v, g, nuages, uv, aqi, extra) {
    var c = { T: T, rh: rh, v: v, g: g, nuages: nuages, uv: uv, aqi: aqi, mm: 0, pop: 0, type: 'auto', vis: 20000, jour: 1 };
    for (var e in (extra || {})) c[e] = extra[e];
    return c;
  }
  var CAS = [
    cas(24, 50, 8, 15, 10, 5, 18), cas(35, 20, 10, 20, 5, 9, 35), cas(35, 80, 8, 15, 40, 9, 35), cas(28, 85, 8, 15, 60, 8, 30),
    cas(30, 15, 30, 45, 0, 7, 45), cas(42, 10, 25, 40, 0, 10, 70), cas(15, 85, 15, 28, 100, 1, 15, { mm: 0.3 }),
    cas(5, 90, 30, 50, 100, 1, 15, { mm: 3 }), cas(-3, 70, 3, 6, 5, 1, 12), cas(-28, 75, 8, 12, 5, 0, 10),
    cas(22, 75, 20, 55, 100, 2, 25, { mm: 6, type: 'orage' }), cas(26, 55, 10, 18, 5, 11, 25), cas(24, 50, 5, 10, 20, 5, 115),
    cas(18, 70, 5, 10, 5, 0, 20, { jour: 0 }), cas(12, 60, 10, 18, 15, 4, 30), cas(0, 95, 10, 20, 100, 0, 20, { mm: 0.5, type: 'neige1' }),
    cas(2, 100, 3, 6, 100, 0, 45, { vis: 150 }), cas(18, 65, 55, 85, 70, 3, 15), cas(30, 85, 15, 35, 100, 3, 25, { mm: 15 }),
    cas(24, 60, 8, 15, 100, 3, 20), cas(9.2, 87, 6, 14, 100, 0, 48, { jour: 0, pop: 47, type: 'annonce' }), cas(34, 69, 5, 37, 10, 5, 23),
    cas(24, 50, 8, 15, 10, 5, 70), cas(32, 56, 14, 29, 12, 6.5, 45), cas(36, 7, 15, 41, 10, 6, 48), cas(23, 96, 6, 10, 88, 0, 30, { jour: 0 }),
    cas(2, 80, 10, 20, 100, 1, 30), cas(-5, 60, 5, 10, 0, 2, 20), cas(40, 10, 5, 12, 0, 10, 30), cas(30, 50, 10, 20, 10, 8, 25)
  ];

  // État de la feuille : la situation essayée, sa source, soleil ou ombre, les valeurs en cours de réglage.
  var st = { src: 'place', s: null, soleil: 1, c: null, body: null };

  function placeSit() {
    var p = SM.app.places[SM.app.idx], w = p && SM.store.weather(p.id);
    var s = w && SM.comfort.situation(w, Date.now() / 1000);
    if (!s) return null;
    return s;
  }

  function html() {
    var tt = t(), g = tt.calib, s = st.s, c = st.c;
    var out = '<p class="about">' + U.esc(g.hint) + '</p>' +
      '<div class="cbres" id="cbres"></div>' +
      field(g.situation, '<p class="about" id="cbname"></p>' + seg('src', [['place', g.srcPlace]], st.src)) +
      field(g.time, seg('jour', [[1, g.day], [0, g.night]], s.jour) + (s.jour ? seg('soleil', [[1, g.sun], [0, g.shade]], st.soleil) : '')) +
      SIT.map(function (d) { return slider('s', d, g.sit[d[0]], s[d[0]]); }).join('') +
      field(g.sit.type, seg('type', TYPES.map(function (k) { return [k, g.types[k]]; }), s.type)) +
      field(g.sit.vis, seg('vis', VIS.map(function (v, i) { return [v, g.vis[i]]; }), visKey(s.vis)));
    REG.forEach(function (grp) {
      out += '<h3 class="cbh">' + U.esc(g.groups[grp[0]]) + '</h3>' + (g.groupHints[grp[0]] ? '<p class="about">' + U.esc(g.groupHints[grp[0]]) + '</p>' : '') +
        grp[1].map(function (d) { return slider('r', d, g.k[d[0]], c[d[0]]); }).join('');
    });
    out += '<div class="btnrow"><button class="btn" data-cx="reset">' + U.esc(g.reset) + '</button><button class="btn" data-cx="copy">' + U.esc(tt.copy) + '</button></div>' +
      '<h3 class="cbh">' + U.esc(g.cases) + '</h3><p class="about">' + U.esc(g.casesHint) + '</p>' +
      '<table class="kv cbcases"><thead><tr><th>' + g.colCase + '</th><th class="n">' + g.colDef + '</th><th class="n">' + g.sun + '</th><th class="n">' + g.shade + '</th></tr></thead><tbody id="cbcases"></tbody></table>';
    return out;
  }
  function visKey(v) { for (var i = 0; i < VIS.length; i++) { if (v >= VIS[i]) return VIS[i]; } return VIS[VIS.length - 1]; }
  function slider(kind, d, label, v) {
    return field(label, '<input type="range" class="vrange" data-' + kind + '="' + d[0] + '" min="' + d[1] + '" max="' + d[2] + '" step="' + d[3] + '" value="' + v + '">' +
      '<div class="vends"><span>' + num(d[1]) + d[4] + '</span><b data-o="' + d[0] + '">' + out(d, v) + '</b><span>' + num(d[2]) + d[4] + '</span></div>', 'cbf');
  }
  function out(d, v) {
    var g = t().calib;
    if (d[0].indexOf('c_') === 0) return v >= 10 ? g.off : g.atMost + ' ' + num(v);
    return num(v) + d[4];
  }

  // Note de la situation, au soleil et à l'ombre, et le détail de chaque critère (mêmes blocs que l'écran d'un lieu).
  function result() {
    var tt = t(), g = tt.calib, s = st.s, c = st.c, sol = s.jour ? st.soleil : 0;
    var r = SM.comfort.calc(s, c, sol), lv = SM.comfort.level(r.note);
    var head = '<div class="cmfh"><span class="big">' + num(r.note) + '<small>/10</small></span><span class="cmfl cmf-' + lv + '">' + tt.comfortLevels[lv] + '</span>' +
      '<span class="cbmode">' + U.esc(s.jour ? (sol ? g.sun : g.shade) : g.night) + '</span></div>' +
      '<div class="cmfbar"><i class="cmf-' + lv + '" style="width:' + (r.note * 10).toFixed(0) + '%"></i></div>';
    var other = '';
    if (s.jour) {
      var a = SM.comfort.calc(s, c, sol ? 0 : 1), gap = Math.round(((sol ? a.note : r.note) - (sol ? r.note : a.note)) * 10) / 10;
      other = (sol ? g.shade : g.sun) + ' ' + num(a.note) + ' · ' + tt.comfortFeels + ' ' + num(a.fl, 0) + '° · ' +
        (Math.abs(gap) < 0.05 ? g.noGap : (gap > 0 ? g.shadeWins : g.sunWins) + ' ' + num(Math.abs(gap)));
    } else other = g.oneNight;
    var rows = ['thermique', 'moiteur', 'pluie', 'ciel', 'vent', 'uv', 'air'].map(function (k) {
      var v = Math.round(r.n[k] * 10) / 10, cl = v >= 7 ? 'good' : (v >= 4 ? 'mid' : 'bad'), e = k === 'thermique' ? 0 : Math.round(r.eff[k]);
      return '<div class="cwr"><span>' + tt.comfortWhyParts[k] + '</span><i class="cwb"><i class="cw-' + cl + '" style="width:' + v * 10 + '%"></i></i><b>' + num(v) + '</b>' +
        '<em>' + (k === 'thermique' ? tt.comfortBase : (e > 0 ? '−' + e + ' %' : '')) + '</em></div>';
    }).join('');
    var tail = '<p class="sub">' + U.esc(other) + '</p><p class="sub">' + tt.comfortFeels + ' ' + num(r.fl, 0) + '° · ' + g.dew + ' ' + num(r.td, 0) + '°</p>' +
      '<p class="sub' + (r.lim ? ' cmfcap' : '') + '">' + (r.lim ? g.capped.replace('%1', num(r.brut)).replace('%2', tt.comfortCaps[r.lim]).replace('%3', num(r.note)) : g.noCap) + '</p>';
    U.$('#cbres', st.body).innerHTML = '<div class="tile">' + head + tail + '</div><div class="tile">' + rows + '</div>';
  }
  function cases() {
    var g = t().calib, D = SM.comfort.DEF;
    U.$('#cbcases', st.body).innerHTML = CAS.map(function (x, i) {
      var sun = SM.comfort.calc(x, st.c, 1), sh = x.jour ? SM.comfort.calc(x, st.c, 0) : null, def = SM.comfort.calc(x, D, 1);
      return '<tr data-case="' + i + '"' + (st.src === String(i) ? ' class="on"' : '') + '><th>' + (i + 1) + '. ' + U.esc(g.caseNames[i]) + '</th><td class="n">' + num(def.note) + '</td>' +
        '<td class="n"><span class="lcmf cmf-' + SM.comfort.level(sun.note) + '">' + num(sun.note) + '</span></td><td class="n">' + (sh ? num(sh.note) : '–') + '</td></tr>';
    }).join('');
  }
  function name() {
    var g = t().calib, p = SM.app.places[SM.app.idx], el = U.$('#cbname', st.body);
    if (!el) return;
    el.textContent = st.src === 'place' ? (p ? I.place(p).name : '') + (st.edited ? ' · ' + g.edited : '') :
      (g.caseNames[+st.src] + (st.edited ? ' · ' + g.edited : ''));
  }
  function refresh() { result(); cases(); name(); }

  // Enregistre seulement ce qui diffère des valeurs proposées ; l'écran derrière la feuille suit à la fermeture.
  function save() {
    var D = SM.comfort.DEF, own = {};
    Object.keys(D).forEach(function (k) { if (st.c[k] !== D[k]) own[k] = st.c[k]; });
    SM.app.setSetting('comfort', own);
  }

  function load(src) {
    st.src = src; st.edited = false;
    var s = src === 'place' ? placeSit() : null;
    if (!s) { if (src === 'place') st.src = '0'; s = CAS[src === 'place' ? 0 : +src]; }
    st.s = {};
    for (var k in s) st.s[k] = s[k];
  }

  function bind(body) {
    st.body = body;
    if (!st.s) load('place');
    st.c = SM.comfort.cfg();
    body.innerHTML = html();
    refresh();
    body.onclick = function (e) {
      var b = e.target.closest('[data-ck] button'), tr = e.target.closest('[data-case]'), x = e.target.closest('[data-cx]');
      if (b) {
        var key = b.parentNode.getAttribute('data-ck'), v = b.getAttribute('data-v');
        if (key === 'src') load(v);
        else if (key === 'soleil') st.soleil = +v;
        else { st.s[key] = key === 'type' ? v : +v; touched(key); }
        bind(body);
        return;
      }
      if (tr) { load(tr.getAttribute('data-case')); bind(body); body.scrollTop = 0; return; }
      if (!x) return;
      if (x.getAttribute('data-cx') === 'reset') {
        st.c = {};
        Object.keys(SM.comfort.DEF).forEach(function (k) { st.c[k] = SM.comfort.DEF[k]; });
        save();
        var y = body.scrollTop; bind(body); body.scrollTop = y;
      }
      if (x.getAttribute('data-cx') === 'copy') {
        var tt = t();
        SM.settings.copyText(text(), function (ok) { x.textContent = ok ? tt.copied : tt.copyFailed; setTimeout(function () { x.textContent = tt.copy; }, 2000); });
      }
    };
    U.$$('.vrange', body).forEach(function (r) {
      var rk = r.getAttribute('data-r'), sk = r.getAttribute('data-s'), key = rk || sk;
      var d = findDef(key, !!rk), o = U.$('[data-o="' + key + '"]', body);
      // La note se recalcule pendant le glissement ; les valeurs de la formule s'enregistrent au lâcher.
      r.oninput = function () {
        var v = parseFloat(r.value);
        if (rk) {
          st.c[rk] = v;
          if (st.c.hi < st.c.lo) { if (rk === 'lo') st.c.hi = v; else st.c.lo = v; syncRange(body, rk === 'lo' ? 'hi' : 'lo', st.c[rk === 'lo' ? 'hi' : 'lo']); }
        } else {
          st.s[sk] = v;
          if (sk === 'v' && st.s.g < v) { st.s.g = v; syncRange(body, 'g', v); }
          touched(sk);
        }
        o.textContent = out(d, v);
        refresh();
      };
      if (rk) r.onchange = save;
    });
  }
  // Une situation retouchée garde sa source, marquée « retouchée » ; le ressenti reçu ne vaut plus.
  function touched(key) {
    st.edited = true;
    if (key !== 'type' && key !== 'aqi' && key !== 'pop' && key !== 'mm') { delete st.s.fl; }
    if (key === 'T' || key === 'rh') delete st.s.td;
  }
  function syncRange(body, key, v) {
    var r = U.$('.vrange[data-r="' + key + '"], .vrange[data-s="' + key + '"]', body), o = U.$('[data-o="' + key + '"]', body);
    if (r) r.value = v;
    if (o) o.textContent = out(findDef(key, !!U.$('.vrange[data-r="' + key + '"]', body)), v);
  }
  function findDef(key, reg) {
    var i, j;
    if (!reg) { for (i = 0; i < SIT.length; i++) if (SIT[i][0] === key) return SIT[i]; }
    for (i = 0; i < REG.length; i++) for (j = 0; j < REG[i][1].length; j++) if (REG[i][1][j][0] === key) return REG[i][1][j];
    return null;
  }

  // Les valeurs en clair, pour les envoyer ou les garder.
  function text() {
    var g = t().calib, D = SM.comfort.DEF, c = st.c, lines = [g.title + ' · ' + SM.VERSION];
    REG.forEach(function (grp) {
      lines.push(g.groups[grp[0]] + ' : ' + grp[1].map(function (d) { return g.k[d[0]] + ' ' + out(d, c[d[0]]); }).join(' ; '));
    });
    var mod = Object.keys(D).filter(function (k) { return c[k] !== D[k]; }).map(function (k) { return k + ' ' + D[k] + ' → ' + c[k]; });
    lines.push(mod.length ? g.changed + ' ' + mod.join(', ') : g.unchanged);
    return lines.join('\n');
  }

  // À chaque ouverture, la situation repart du lieu affiché.
  SM.calib = { open: function (body) { st.s = null; st.soleil = 1; bind(body); } };
})();
