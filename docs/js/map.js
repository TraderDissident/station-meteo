/* Carte du monde : jour, nuit et crépuscule à la minute, soleil et lune à leur aplomb, fuseaux horaires,
   villes avec leur météo et leur heure, horloges ou cartes météo en dessous. */
(function () {
  var U = SM.U, I = SM.i18n, IC = SM.icons, CO = SM.codes;
  var PI = Math.PI, RAD = PI / 180;

  /* ---------- projection de Miller, de 75° N à 58° S, coupée à 172,5° O pour aligner les fuseaux ---------- */
  var LON0 = -172.5, LAT_N = 75, LAT_S = -58;
  function miller(lat) { return 1.25 * Math.log(Math.tan(PI / 4 + 0.4 * lat * RAD)); }
  var MT = miller(LAT_N), MB = miller(LAT_S);
  var ASPECT = (MT - MB) / (2 * PI);
  function fx(lon) { return (((lon - LON0) % 360) + 360) % 360 / 360; }
  function fy(lat) { return (MT - miller(U.clamp(lat, -85, 85))) / (MT - MB); }
  function latAt(f) { var m = MT - f * (MT - MB); return (2.5 * Math.atan(Math.exp(0.8 * m)) - 0.625 * PI) / RAD; }

  /* ---------- tracé des terres, décodé une fois ---------- */
  var rings = null;
  function decode() {
    if (rings) return rings;
    rings = (SM.WORLD || []).map(function (r) {
      var out = new Float32Array(r.length), x = 0, y = 0, prev = null, shift = 0, lo = 1e9, hi = -1e9;
      for (var i = 0; i < r.length; i += 2) {
        x += r[i]; y += r[i + 1];
        // Déroule les longitudes : un contour qui franchit la ligne de changement de date reste continu.
        var lon = x / 20 + shift;
        if (prev !== null && lon - prev > 180) { shift -= 360; lon -= 360; }
        else if (prev !== null && lon - prev < -180) { shift += 360; lon += 360; }
        prev = lon;
        out[i] = lon; out[i + 1] = y / 20;
        if (lon < lo) lo = lon; if (lon > hi) hi = lon;
      }
      out.lo = lo; out.hi = hi;
      return out;
    });
    return rings;
  }

  var st = {
    root: null, box: null, cv: null, ctx: null, day: null, night: null, tmp: null, mask: null, tw: null,
    w: 0, h: 0, pr: 1, minuteKey: '', cards: 'clocks', places: [], hands: []
  };

  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* Dégradé des climats selon la latitude : banquise, toundra, taïga, tempéré, désert, savane, forêt tropicale. */
  var BIOMES = [[75, '#e4ecf1'], [68, '#b3c2bd'], [60, '#4f6e52'], [50, '#5f8456'], [42, '#7c9257'], [33, '#b8a26f'],
    [24, '#c2a873'], [15, '#93995e'], [6, '#3d7046'], [-6, '#3b6c45'], [-16, '#8d985c'], [-26, '#b9a06b'],
    [-36, '#6f8d58'], [-48, '#6b8a6c'], [-58, '#d5e0e6']];

  function tracePath(g, w, h, pr) {
    var rs = decode(), sx = w * pr / 360, sy = h * pr;
    g.beginPath();
    for (var k = 0; k < rs.length; k++) {
      var r = rs[k];
      // Dessiné à chaque copie de la carte (−360°, 0, +360°) qui touche le cadre.
      for (var c = -1; c <= 1; c++) {
        var off = c * 360 - LON0;
        if (r.hi + off < 0 || r.lo + off > 360) continue;
        for (var i = 0; i < r.length; i += 2) {
          var X = (r[i] + off) * sx, Y = fy(r[i + 1]) * sy;
          if (i === 0) g.moveTo(X, Y); else g.lineTo(X, Y);
        }
        g.closePath();
      }
    }
  }

  function buildLayers() {
    var w = st.w, h = st.h, pr = st.pr, cw = Math.round(w * pr), ch = Math.round(h * pr);
    st.day = canvas(cw, ch); st.night = canvas(cw, ch); st.tmp = canvas(cw, ch);
    // Jour
    var g = st.day.getContext('2d');
    var oc = g.createLinearGradient(0, 0, 0, ch);
    oc.addColorStop(0, '#0b2a4c'); oc.addColorStop(fy(30), '#15507f'); oc.addColorStop(fy(0), '#1d6aa3');
    oc.addColorStop(fy(-30), '#15507f'); oc.addColorStop(1, '#0b2a4c');
    g.fillStyle = oc; g.fillRect(0, 0, cw, ch);
    var lg = g.createLinearGradient(0, 0, 0, ch);
    BIOMES.forEach(function (b) { lg.addColorStop(U.clamp(fy(b[0]), 0, 1), b[1]); });
    tracePath(g, w, h, pr);
    g.fillStyle = lg; g.fill();
    g.lineWidth = 0.8 * pr; g.strokeStyle = 'rgba(255,255,255,0.28)'; g.stroke();
    // Nuit : océan profond, étoiles, terres bleu nuit.
    var n = st.night.getContext('2d');
    var on = n.createLinearGradient(0, 0, 0, ch);
    on.addColorStop(0, '#02060f'); on.addColorStop(0.5, '#061329'); on.addColorStop(1, '#02060f');
    n.fillStyle = on; n.fillRect(0, 0, cw, ch);
    var rnd = U.seeded('carte-etoiles');
    for (var i = 0; i < 420; i++) {
      n.fillStyle = 'rgba(220,230,255,' + (0.15 + rnd() * 0.6).toFixed(2) + ')';
      n.beginPath(); n.arc(rnd() * cw, rnd() * ch, (0.3 + rnd() * 0.8) * pr, 0, 6.283); n.fill();
    }
    tracePath(n, w, h, pr);
    var ln = n.createLinearGradient(0, 0, 0, ch);
    ln.addColorStop(0, '#1a2840'); ln.addColorStop(0.5, '#0f1b30'); ln.addColorStop(1, '#1a2840');
    n.fillStyle = ln; n.fill();
    n.lineWidth = 0.8 * pr; n.strokeStyle = 'rgba(130,170,235,0.32)'; n.stroke();
    // Masque jour/nuit et bande de crépuscule, calculés sur une grille fine puis lissés à l'agrandissement.
    var mw = 240, mh = Math.round(240 * ASPECT);
    st.mask = canvas(mw, mh); st.tw = canvas(mw, mh);
    st.lats = []; for (var y = 0; y < mh; y++) st.lats.push(latAt((y + 0.5) / mh) * RAD);
    st.minuteKey = '';
  }

  function drawSky(ms) {
    if (!st.ctx || !st.day || !st.mask) return;
    var w = st.w, h = st.h, pr = st.pr, cw = st.cv.width, ch = st.cv.height;
    var sun = SM.astro.subSolar(ms), dec = sun.lat * RAD;
    var mw = st.mask.width, mh = st.mask.height;
    var mg = st.mask.getContext('2d'), tg = st.tw.getContext('2d');
    var md = mg.createImageData(mw, mh), td = tg.createImageData(mw, mh);
    var sd = Math.sin(dec), cd = Math.cos(dec);
    for (var y = 0; y < mh; y++) {
      var la = st.lats[y], sl = Math.sin(la), cl = Math.cos(la);
      for (var x = 0; x < mw; x++) {
        var lon = LON0 + (x + 0.5) / mw * 360;
        var alt = Math.asin(sl * sd + cl * cd * Math.cos((lon - sun.lon) * RAD)) / RAD;
        var day = U.clamp((alt + 6) / 9, 0, 1);
        var tw = Math.max(0, 1 - Math.abs(alt + 2) / 6.5);
        var o = (y * mw + x) * 4;
        md.data[o] = md.data[o + 1] = md.data[o + 2] = 255; md.data[o + 3] = Math.round(day * day * (3 - 2 * day) * 255);
        // Crépuscule : orangé côté nuit, rosé côté jour.
        td.data[o] = 255; td.data[o + 1] = Math.round(120 + 60 * day); td.data[o + 2] = Math.round(70 + 60 * day);
        td.data[o + 3] = Math.round(tw * tw * 92);
      }
    }
    mg.putImageData(md, 0, 0); tg.putImageData(td, 0, 0);
    var c = st.ctx;
    c.imageSmoothingEnabled = true;
    c.globalCompositeOperation = 'source-over';
    c.drawImage(st.night, 0, 0);
    var t = st.tmp.getContext('2d');
    t.globalCompositeOperation = 'source-over';
    t.clearRect(0, 0, cw, ch);
    t.drawImage(st.day, 0, 0);
    t.globalCompositeOperation = 'destination-in';
    t.imageSmoothingEnabled = true;
    t.drawImage(st.mask, 0, 0, cw, ch);
    t.globalCompositeOperation = 'source-over';
    c.drawImage(st.tmp, 0, 0);
    c.drawImage(st.tw, 0, 0, cw, ch);
    // Reflet du soleil sur l'océan, répété de part et d'autre de la couture.
    var sx = fx(sun.lon) * cw, sy = fy(sun.lat) * ch, R = cw * 0.2;
    [sx - cw, sx, sx + cw].forEach(function (x) {
      var gl = c.createRadialGradient(x, sy, 0, x, sy, R);
      gl.addColorStop(0, 'rgba(255,248,220,0.30)'); gl.addColorStop(0.4, 'rgba(255,240,200,0.10)'); gl.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = gl; c.fillRect(x - R, sy - R, 2 * R, 2 * R);
    });
    // Limites des fuseaux, équateur et tropiques.
    c.lineWidth = Math.max(1, pr * 0.7);
    c.strokeStyle = 'rgba(255,255,255,0.08)';
    c.beginPath();
    for (var k = 1; k < 24; k++) { var X = Math.round(k / 24 * cw) + 0.5; c.moveTo(X, 0); c.lineTo(X, ch); }
    c.stroke();
    if (c.setLineDash) c.setLineDash([3 * pr, 5 * pr]);
    c.strokeStyle = 'rgba(255,255,255,0.12)';
    c.beginPath();
    [0, 23.44, -23.44].forEach(function (la) { var Y = Math.round(fy(la) * ch) + 0.5; c.moveTo(0, Y); c.lineTo(cw, Y); });
    c.stroke();
    if (c.setLineDash) c.setLineDash([]);
    // Soleil et lune à leur aplomb.
    var moon = SM.astro.subLunar(ms), ph = SM.astro.moonPhase(ms);
    place(st.sunEl, fx(sun.lon) * w, fy(sun.lat) * h);
    place(st.moonEl, fx(moon.lon) * w, fy(moon.lat) * h);
    var key = Math.round(ph.phase * 50);
    if (st.moonKey !== key) { st.moonKey = key; st.moonEl.innerHTML = IC.moonPhase(ph, false, 30, true); }
  }

  function place(el, x, y) { el.style.webkitTransform = el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)'; }

  /* ---------- heures et décalages ---------- */
  function cityOffsetMin(p, nowS) {
    var w = SM.app.data[p.id];
    var wl = I.wall(nowS, (w && w.tz) || p.tz, w ? w.offset : 0);
    // Les fuseaux sont des multiples de 15 min : on arrondit pour effacer les secondes.
    return Math.round((Date.UTC(wl.y, wl.mo, wl.d, wl.h, wl.mi, wl.s) / 1000 - nowS) / 900) * 15;
  }
  function offsetLabel(min) {
    var tt = I.t();
    if (min === 0) return tt.sameTime;
    var a = Math.abs(min), hh = Math.floor(a / 60), mm = a % 60;
    return (min > 0 ? '+' : '−') + hh + ' h' + (mm ? ' ' + U.pad(mm) : '');
  }
  function dayLabel(p, nowS) {
    var tt = I.t(), w = SM.app.data[p.id];
    var c = I.wall(nowS, (w && w.tz) || p.tz, w ? w.offset : 0);
    var d = new Date(nowS * 1000), devKey = d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
    return c.key === devKey ? tt.today : (c.key > devKey ? tt.tomorrow : tt.yesterday);
  }

  /* ---------- villes ---------- */
  function cityInfo(p, ms) {
    var w = SM.app.data[p.id], nowS = Math.floor(ms / 1000);
    var tz = (w && w.tz) || p.tz, wl = I.wall(nowS, tz, w ? w.offset : 0);
    var c = w ? w.current : null, d = null;
    if (w) {
      for (var i = 0; i < w.daily.length; i++) if (I.wall(w.daily[i].t + 43200, tz, w.offset).key === wl.key) { d = w.daily[i]; break; }
    }
    var sky = SM.sky.colorsFor(p.lat, p.lon, ms, c ? c.code : null, c ? c.cloud : null);
    return { p: p, pl: I.place(p), w: w, c: c, d: d, wl: wl, tz: tz, sky: sky, night: sky.alt < -3, temp: c ? c.temp : null };
  }

  function markerHTML(ci, i) {
    var icon = ci.c ? IC.weather(CO.icon(ci.c.code, ci.sky.alt > -1), 'mki') : '';
    var col = U.has(ci.temp) ? SM.ui.tempColor(ci.temp) : '#ffffff';
    return '<div class="mk' + (ci.night ? ' night' : '') + '" data-place="' + U.esc(ci.p.id) + '" style="left:' + (fx(ci.p.lon) * 100).toFixed(3) + '%;top:' + (fy(ci.p.lat) * 100).toFixed(3) + '%">' +
      '<i class="mkd" style="background:' + col + '"></i><i class="mkp" style="border-color:' + col + '"></i>' +
      '<div class="mkl">' + icon + '<div class="mkt"><b>' + (U.has(ci.temp) ? I.temp(ci.temp) : '') + '</b><span>' + U.esc(ci.pl.name) + '</span><small class="mktime"></small></div></div></div>';
  }

  function clockSVG(ci) {
    var ticks = '';
    for (var k = 0; k < 60; k++) {
      var a = k * 6 * RAD, big = k % 5 === 0, r1 = big ? 38 : 41.5;
      ticks += '<line x1="' + (50 + Math.sin(a) * r1).toFixed(2) + '" y1="' + (50 - Math.cos(a) * r1).toFixed(2) + '" x2="' + (50 + Math.sin(a) * 44).toFixed(2) + '" y2="' + (50 - Math.cos(a) * 44).toFixed(2) + '" class="' + (big ? 'tb' : 'ts') + '"/>';
    }
    var nums = [12, 3, 6, 9].map(function (n, i) {
      var a = i * 90 * RAD;
      return '<text x="' + (50 + Math.sin(a) * 30).toFixed(1) + '" y="' + (50 - Math.cos(a) * 30).toFixed(1) + '">' + n + '</text>';
    }).join('');
    return '<svg class="clk' + (ci.night ? ' night' : '') + '" viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="47" class="face"/>' + ticks + nums +
      '<line x1="50" y1="56" x2="50" y2="27" class="hh"/><line x1="50" y1="58" x2="50" y2="14" class="mh"/>' +
      '<line x1="50" y1="60" x2="50" y2="10" class="sh"/><circle cx="50" cy="50" r="2.6" class="hub"/></svg>';
  }

  function dayBar(ci) {
    if (!ci.d || !ci.d.sunrise || !ci.d.sunset) return '';
    var w = ci.w;
    var rise = I.wall(ci.d.sunrise, ci.tz, w.offset), set = I.wall(ci.d.sunset, ci.tz, w.offset);
    var fr = (rise.h * 60 + rise.mi) / 1440 * 100, fs = (set.h * 60 + set.mi) / 1440 * 100;
    var g = 'linear-gradient(to right,#18203c 0%,#18203c ' + Math.max(fr - 4, 0).toFixed(1) + '%,#f19a6a ' + fr.toFixed(1) + '%,#9fd0ff ' + Math.min(fr + 5, fs).toFixed(1) + '%,#9fd0ff ' + Math.max(fs - 5, fr).toFixed(1) + '%,#f08a5d ' + fs.toFixed(1) + '%,#18203c ' + Math.min(fs + 4, 100).toFixed(1) + '%,#18203c 100%)';
    return '<div class="dbar2" style="background:' + g + '"><i class="now"></i></div>' +
      '<div class="srow">' + IC.ui('sunrise') + I.hm(rise) + '<span></span>' + IC.ui('sunset') + I.hm(set) + '</div>';
  }

  function cardHTML(ci) {
    var tt = I.t(), cols = ci.sky.cols, isClock = st.cards === 'clocks';
    var bg = isClock ? '' : ' style="background:linear-gradient(to bottom,' + U.rgb(cols[0]) + ' 0%,' + U.rgb(cols[1]) + ' 60%,' + U.rgb(cols[2]) + ' 100%)"';
    var wx = ci.c ? IC.weather(CO.icon(ci.c.code, ci.sky.alt > -1), 'mci') : '';
    var hl = ci.d ? '<span class="hl">' + tt.max + ' ' + I.temp(ci.d.max) + ' · ' + tt.min + ' ' + I.temp(ci.d.min) + '</span>' : '';
    if (isClock) {
      return '<div class="mcard clock" data-place="' + U.esc(ci.p.id) + '">' + clockSVG(ci) + '<div class="mcc">' +
        '<div class="mcn">' + U.esc(ci.pl.name) + '</div><div class="mcbig"><span class="mctime"></span>' +
        (U.has(ci.temp) ? '<span class="mct">' + wx + I.temp(ci.temp) + '</span>' : '') + '</div>' +
        '<div class="mcs"><span class="mcday"></span></div>' + dayBar(ci) + '</div></div>';
    }
    return '<div class="mcard sky' + (ci.sky.brightness > 0.62 ? ' bright' : '') + '" data-place="' + U.esc(ci.p.id) + '"' + bg + '>' +
      '<div class="mch"><div><b>' + U.esc(ci.pl.name) + '</b><small>' + U.esc(ci.pl.country) + '</small></div>' + wx + '</div>' +
      '<div class="mcbig"><span class="mctime"></span><span class="mct">' + (U.has(ci.temp) ? I.temp(ci.temp) : '–') + '</span></div>' +
      '<div class="mcs"><span class="mcday"></span>' + (ci.c ? ' · ' + U.esc(CO.label(ci.c.code)) : '') + '</div>' +
      '<div class="mcs">' + hl + '</div>' + dayBar(ci) + '</div>';
  }

  /* Étiquettes : à droite, sinon à gauche, au-dessus ou au-dessous, sans chevauchement ni débordement. */
  function layoutLabels() {
    var W = st.w, H = st.h, mks = U.$$('.mk', st.box), lines = '';
    // Les points des villes sont des obstacles pour toutes les étiquettes.
    var placed = mks.map(function (mk) { return [mk.offsetLeft - 9, mk.offsetTop - 9, 18, 18]; });
    mks.forEach(function (mk) {
      var lab = U.$('.mkl', mk), lw = lab.offsetWidth, lh = lab.offsetHeight;
      var x = mk.offsetLeft, y = mk.offsetTop;
      var opts = [];
      [12, 34, 60].forEach(function (d) {
        opts.push([d, -lh / 2], [-lw - d, -lh / 2], [-lw / 2, -lh - d], [-lw / 2, d],
          [d * 0.7, -lh - d * 0.7], [d * 0.7, d * 0.7], [-lw - d * 0.7, -lh - d * 0.7], [-lw - d * 0.7, d * 0.7]);
      });
      var best = opts[0], bestScore = 1e9;
      opts.forEach(function (o, k) {
        var bx = x + o[0], by = y + o[1], score = k * 0.4;
        if (bx < 2) score += 100 + (2 - bx); if (bx + lw > W - 2) score += 100 + (bx + lw - W);
        if (by < 2) score += 100 + (2 - by); if (by + lh > H - 2) score += 100 + (by + lh - H);
        placed.forEach(function (r) {
          var ox = Math.min(bx + lw, r[0] + r[2]) - Math.max(bx, r[0]), oy = Math.min(by + lh, r[1] + r[3]) - Math.max(by, r[1]);
          if (ox > 0 && oy > 0) score += 10 + ox * oy / 100;
        });
        if (score < bestScore) { bestScore = score; best = o; }
      });
      lab.style.left = best[0].toFixed(0) + 'px'; lab.style.top = best[1].toFixed(0) + 'px';
      placed.push([x + best[0], y + best[1], lw, lh]);
      // Trait de rappel quand l'étiquette s'éloigne de son point.
      var cx = U.clamp(x, x + best[0], x + best[0] + lw), cy = U.clamp(y, y + best[1], y + best[1] + lh);
      if (Math.abs(cx - x) + Math.abs(cy - y) > 20) {
        lines += '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + cx.toFixed(1) + '" y2="' + cy.toFixed(1) + '"/>';
      }
    });
    U.$('.mklines', st.box).innerHTML = lines;
  }

  /* ---------- règle des fuseaux ---------- */
  function rulerHTML() {
    var s = '';
    for (var k = 0; k < 24; k++) s += '<span data-z="' + (k - 11) + '"></span>';
    return s;
  }
  function updateRuler(ms) {
    var dev = -new Date(ms).getTimezoneOffset();
    var devZone = Math.round(dev / 60), utc = new Date(ms);
    var uh = utc.getUTCHours(), um = utc.getUTCMinutes();
    U.$$('.zones span', st.root).forEach(function (sp) {
      var z = +sp.getAttribute('data-z'), h = (uh + z + 48) % 24;
      var alt = SM.astro.sun(ms, 0, z * 15).alt;
      sp.className = (z === devZone ? 'me' : '') + (alt > 0 ? ' d' : (alt > -12 ? ' t' : ''));
      sp.textContent = z === devZone ? U.pad(h) + ':' + U.pad(um) : U.pad(h);
    });
  }

  /* ---------- rendu et mise à jour ---------- */
  var M = {};

  M.render = function (container, places) {
    var tt = I.t();
    try { st.cards = localStorage.getItem('sm.mapCards') || 'clocks'; } catch (e) { st.cards = 'clocks'; }
    st.places = places;
    container.innerHTML =
      '<div class="mapview"><div class="mapwrap">' +
        '<div class="zones">' + rulerHTML() + '</div>' +
        '<div class="mapbox"><canvas></canvas><div class="msun"><i></i></div><div class="mmoon"></div>' +
        '<svg class="mklines" aria-hidden="true"></svg><div class="mks"></div><p class="mapcredit">' + U.esc(tt.mapCredit) + '</p></div>' +
      '</div>' +
      '<div class="mbottom"><div class="seg mswitch"><button data-cards="clocks"' + (st.cards === 'clocks' ? ' class="on"' : '') + '>' + tt.clocks + '</button>' +
        '<button data-cards="weather"' + (st.cards === 'weather' ? ' class="on"' : '') + '>' + tt.weatherCards + '</button></div>' +
        '<div class="mcards"></div></div></div>';
    st.root = U.$('.mapview', container);
    st.box = U.$('.mapbox', st.root);
    st.cv = U.$('canvas', st.box);
    st.ctx = st.cv.getContext('2d');
    st.sunEl = U.$('.msun', st.box); st.moonEl = U.$('.mmoon', st.box);
    st.moonKey = null;
    st.day = st.mask = null;
    M.refresh();
    M.resize(true);
  };

  /* Nouvelles données : on refait villes et cartes, pas le fond. */
  M.refresh = function () {
    if (!st.root) return;
    var ms = SM.app.nowMs();
    var infos = st.places.map(function (p) { return cityInfo(p, ms); });
    U.$('.mks', st.box).innerHTML = infos.map(markerHTML).join('');
    U.$('.mcards', st.root).innerHTML = infos.map(cardHTML).join('');
    st.infos = infos;
    st.minuteKey = '';
    M.tick(true);
    if (st.w) layoutLabels();
  };

  M.setCards = function (mode) {
    st.cards = mode;
    try { localStorage.setItem('sm.mapCards', mode); } catch (e) { /* rien */ }
    U.$$('.mswitch button', st.root).forEach(function (b) { b.className = b.getAttribute('data-cards') === mode ? 'on' : ''; });
    M.refresh();
    M.resize(true);
  };

  M.resize = function (force) {
    if (!st.root) return;
    var wrap = U.$('.mapwrap', st.root), bottom = U.$('.mbottom', st.root);
    var land = document.getElementById('app').className.indexOf('land') >= 0;
    var availW = st.root.clientWidth - 2 * parseFloat(getComputedStyle(wrap).paddingLeft || 0);
    var W = availW;
    if (land) {
      var rulerH = U.$('.zones', st.root).offsetHeight;
      var availH = st.root.clientHeight - bottom.offsetHeight - rulerH - 8;
      W = Math.min(availW, availH / ASPECT);
    }
    W = Math.floor(Math.max(W, 280));
    var H = Math.round(W * ASPECT);
    if (!force && W === st.w && H === st.h) return;
    st.w = W; st.h = H;
    st.pr = Math.min(window.devicePixelRatio || 1, 1.5);
    U.$('.zones', st.root).style.width = W + 'px';
    st.box.style.width = W + 'px'; st.box.style.height = H + 'px';
    st.cv.width = Math.round(W * st.pr); st.cv.height = Math.round(H * st.pr);
    st.cv.style.width = W + 'px'; st.cv.style.height = H + 'px';
    buildLayers();
    M.tick(true);
    layoutLabels();
  };

  /* Chaque seconde : aiguilles. Chaque minute (ou si forcé) : ciel de la carte, heures, règle. */
  M.tick = function (force) {
    if (!st.root || !st.infos) return;
    var ms = SM.app.nowMs(), nowS = Math.floor(ms / 1000);
    var minute = Math.floor(ms / 60000);
    var cards = U.$$('.mcard', st.root), mks = U.$$('.mk', st.box);
    st.infos.forEach(function (ci, i) {
      var wl = I.wall(nowS, ci.tz, ci.w ? ci.w.offset : 0);
      var card = cards[i];
      if (card && st.cards === 'clocks') {
        var sec = wl.s, mn = wl.mi + sec / 60, hr = (wl.h % 12) + mn / 60;
        var hs = U.$$('line.hh, line.mh, line.sh', card);
        if (hs.length === 3) {
          hs[0].setAttribute('transform', 'rotate(' + (hr * 30).toFixed(2) + ' 50 50)');
          hs[1].setAttribute('transform', 'rotate(' + (mn * 6).toFixed(2) + ' 50 50)');
          hs[2].setAttribute('transform', 'rotate(' + (sec * 6) + ' 50 50)');
        }
      }
      if (force || st.minuteKey !== minute) {
        if (card) {
          var tEl = U.$('.mctime', card), dEl = U.$('.mcday', card), now = U.$('.dbar2 .now', card);
          if (tEl) tEl.textContent = I.hm(wl);
          if (dEl) dEl.textContent = dayLabel(ci.p, nowS) + ', ' + offsetLabel(cityOffsetMin(ci.p, nowS) - (-new Date(ms).getTimezoneOffset()));
          if (now) now.style.left = ((wl.h * 60 + wl.mi) / 1440 * 100).toFixed(2) + '%';
        }
        var mk = mks[i];
        if (mk) U.$('.mktime', mk).textContent = I.hm(wl);
      }
    });
    if (force || st.minuteKey !== minute) {
      st.minuteKey = minute;
      drawSky(ms);
      updateRuler(ms);
    }
  };

  M.active = function () { return !!(st.root && document.body.contains(st.root)); };
  M.leave = function () { st.root = null; st.infos = null; st.day = st.night = st.tmp = st.mask = st.tw = null; st.w = st.h = 0; };

  SM.map = M;
})();
