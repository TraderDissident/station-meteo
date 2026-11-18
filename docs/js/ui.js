/* Rendu d'un lieu : horloge, cadran, synthèse, pluie à 3 h, heures, jours, détails, avis. */
(function () {
  var U = SM.U, I = SM.i18n, IC = SM.icons, CO = SM.codes;

  function t() { return I.t(); }
  function wall(w, unix) { return I.wall(unix, w.tz, w.offset); }

  function hourIndex(w, now) {
    var h = w.hourly, idx = 0;
    for (var i = 0; i < h.length; i++) { if (h[i].t <= now) idx = i; else break; }
    return idx;
  }
  function dayIndex(w, now) {
    var key = wall(w, now).key;
    for (var i = 0; i < w.daily.length; i++) if (wall(w, w.daily[i].t + 43200).key === key) return i;
    return 0;
  }

  /* Échelle de couleur des températures, de −15 à 40 °C. */
  var TSTOPS = [[-15, '#8f7cff'], [-5, '#5aa6ff'], [3, '#59d0f0'], [10, '#5fe0b0'], [17, '#c6e65a'], [24, '#ffd24a'], [30, '#ff9a3d'], [38, '#ff5a4f']];
  function tempColor(v) {
    if (v <= TSTOPS[0][0]) return TSTOPS[0][1];
    for (var i = 1; i < TSTOPS.length; i++) {
      if (v <= TSTOPS[i][0]) {
        var a = TSTOPS[i - 1], b = TSTOPS[i], k = (v - a[0]) / (b[0] - a[0]);
        return U.rgb(U.mix(U.hex(a[1]), U.hex(b[1]), k));
      }
    }
    return TSTOPS[TSTOPS.length - 1][1];
  }

  function arrow(dir, cls) {
    // La flèche indique où va le vent : direction d'origine + 180°.
    return '<span class="warrow ' + (cls || '') + '" style="-webkit-transform:rotate(' + ((dir + 180) % 360) + 'deg);transform:rotate(' + ((dir + 180) % 360) + 'deg)">' + IC.ui('arrow') + '</span>';
  }

  function pct(v) { return U.has(v) ? Math.round(v) + ' %' : '–'; }

  /* ---------- synthèse ---------- */
  function intensity(mmh) { return mmh < 1 ? 0 : (mmh < 4 ? 1 : 2); }

  function summary(w, now) {
    var tt = t(), m = w.minutely || [];
    var snow = CO.isSnow(w.current.code);
    var kindKey = snow ? 'snow' : 'rain';
    var wet = function (p) { return p >= 0.05; };
    var futureM = m.filter(function (x) { return x.t + 900 > now; });
    if (futureM.length && wet(futureM[0].p)) {
      for (var i = 1; i < futureM.length; i++) {
        if (!wet(futureM[i].p)) return { icon: 'drop', text: (snow ? tt.snowNow : tt.rainNow)(I.hm(wall(w, futureM[i].t))) };
      }
      return { icon: 'drop', text: (snow ? tt.snowNow : tt.rainNow)(null) };
    }
    for (var k = 1; k < futureM.length; k++) {
      if (wet(futureM[k].p)) {
        var min = Math.max(5, Math.round((futureM[k].t - now) / 300) * 5);
        return { icon: 'drop', text: tt.rainSoon(tt.intensities[kindKey][intensity(futureM[k].p * 4)], min) };
      }
    }
    var hi = hourIndex(w, now);
    for (var j = hi + 1; j < Math.min(w.hourly.length, hi + 13); j++) {
      var h = w.hourly[j];
      if ((h.pop || 0) >= 50 && (h.precip || 0) >= 0.2) {
        var kk = CO.isSnow(h.code) ? 'snow' : 'rain';
        return { icon: 'drop', text: tt.rainLater(tt.intensities[kk][intensity(h.precip)], I.when(h.t, now, w.tz, w.offset)) };
      }
    }
    return { icon: 'sunny', text: tt.dry };
  }

  /* ---------- avis calculés sur 24 h ---------- */
  function alerts(w, now) {
    var tt = t(), A = tt.alerts, out = [];
    var hi = hourIndex(w, now), end = Math.min(w.hourly.length, hi + 24);
    var minT = null, maxG = null, maxR = null, storm = null, maxT = null, maxUV = null, snowSum = 0, snowStart = null;
    for (var i = hi; i < end; i++) {
      var h = w.hourly[i];
      if (U.has(h.temp) && (!minT || h.temp < minT.temp)) minT = h;
      if (U.has(h.temp) && (!maxT || h.temp > maxT.temp)) maxT = h;
      if (U.has(h.gust) && (!maxG || h.gust > maxG.gust)) maxG = h;
      if (U.has(h.precip) && (!maxR || h.precip > maxR.precip)) maxR = h;
      if (U.has(h.uv) && (!maxUV || h.uv > maxUV.uv)) maxUV = h;
      if (!storm && h.code >= 95) storm = h;
      if (h.snow > 0) { snowSum += h.snow; if (!snowStart) snowStart = h; }
    }
    var when = function (h) { return I.when(h.t, now, w.tz, w.offset); };
    if (storm) out.push({ lvl: 2, icon: 'warn', text: A.storm(when(storm)) });
    if (maxG && maxG.gust >= 60) out.push({ lvl: maxG.gust >= 90 ? 2 : 1, icon: 'wind', text: A.gust(Math.round(maxG.gust), when(maxG)) });
    if (maxR && maxR.precip >= 4) out.push({ lvl: maxR.precip >= 8 ? 2 : 1, icon: 'drop', text: A.rain(I.num(maxR.precip, maxR.precip < 10 ? 1 : 0), when(maxR)) });
    else {
      var sum = 0;
      for (var k = hi; k < end; k++) sum += w.hourly[k].precip || 0;
      if (sum >= 20) out.push({ lvl: 1, icon: 'drop', text: A.rainDay(Math.round(sum)) });
    }
    if (snowSum >= 0.5) out.push({ lvl: snowSum >= 5 ? 2 : 1, icon: 'cloud', text: A.snow(I.num(snowSum, snowSum < 10 ? 1 : 0), when(snowStart)) });
    if (minT && minT.temp <= 0) out.push({ lvl: minT.temp <= -8 ? 2 : 1, icon: 'thermo', text: A.frost(I.temp(minT.temp), when(minT)) });
    if (maxT && maxT.temp >= 30) out.push({ lvl: maxT.temp >= 35 ? 2 : 1, icon: 'thermo', text: A.heat(I.temp(maxT.temp), when(maxT)) });
    if (maxUV && maxUV.uv >= 6) out.push({ lvl: maxUV.uv >= 8 ? 2 : 1, icon: 'sunny', text: A.uv(Math.round(maxUV.uv), when(maxUV)) });
    if (w.air && U.has(w.air.aqi) && w.air.aqi >= 60) out.push({ lvl: w.air.aqi >= 80 ? 2 : 1, icon: 'leaf', text: A.air(Math.round(w.air.aqi), airLevel(w.air.aqi).label) });
    return out;
  }

  /* ---------- niveaux ---------- */
  var AQ = [[20, '#50f0e6'], [40, '#50ccaa'], [60, '#f0e641'], [80, '#ff5050'], [100, '#c4245a'], [1e9, '#8a2ba0']];
  function airLevel(v) {
    for (var i = 0; i < AQ.length; i++) if (v < AQ[i][0]) return { i: i, color: AQ[i][1], label: t().airLevels[i] };
    return { i: 5, color: AQ[5][1], label: t().airLevels[5] };
  }
  function uvLevel(v) {
    var i = v < 3 ? 0 : v < 6 ? 1 : v < 8 ? 2 : v < 11 ? 3 : 4;
    return { i: i, label: t().uvLevels[i] };
  }
  function pollenLevel(v, grass) {
    var s = grass ? [1, 5, 20, 50] : [1, 10, 50, 200], i = 0;
    while (i < s.length && v >= s[i]) i++;
    return i;
  }

  /* ---------- blocs ---------- */
  function hero(place, w, now) {
    var tt = t(), c = w.current, di = dayIndex(w, now), d = w.daily[di] || {};
    var hi = hourIndex(w, now), h = w.hourly[hi] || {};
    var isDay = U.has(c.isDay) ? c.isDay : h.isDay;
    return '' +
      '<div class="hero-top">' +
        '<div class="clock"><span class="hm"></span><span class="ss"></span></div>' +
        '<div class="date"></div>' +
      '</div>' +
      '<div class="dial">' +
        '<div class="dial-in">' +
          '<div class="temp">' + hang(c.temp) + '</div>' +
          '<div class="feels">' + tt.feels + ' ' + I.temp(c.feels) + '</div>' +
          '<div class="dial-mid">' +
            '<div class="dcol"><div><small>' + tt.max + '</small><b>' + I.temp(d.max) + '</b></div><div><small>' + tt.precip + '</small><b>' + I.mm(d.precip) + '</b></div></div>' +
            '<div class="dicon">' + IC.weather(CO.icon(c.code, isDay), 'big') + '</div>' +
            '<div class="dcol r"><div><small>' + tt.min + '</small><b>' + I.temp(d.min) + '</b></div><div><small>' + tt.chance + '</small><b>' + pct(d.pop) + '</b></div></div>' +
          '</div>' +
          '<div class="label">' + U.esc(CO.label(c.code)) + '</div>' +
          '<div class="dwind">' + arrow(c.dir) + '<span>' + I.dir(c.dir) + ' ' + Math.round(c.wind) + ' km/h</span><span class="g"> · ' + tt.gusts + ' ' + Math.round(c.gust) + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="status"></div>';
  }

  function nowcast(w, now) {
    var m = (w.minutely || []).filter(function (x) { return x.t + 900 > now; });
    var any = m.some(function (x) { return x.p >= 0.05; });
    if (!any) return '';
    var max = Math.max(1, Math.max.apply(null, m.map(function (x) { return x.p * 4; })));
    var bars = m.map(function (x, i) {
      var hgt = U.clamp(x.p * 4 / max, 0, 1) * 100;
      var label = i % 4 === 0 ? I.hm(wall(w, x.t)) : '';
      return '<div class="nb"><div class="bar"><i style="height:' + Math.max(hgt, x.p > 0 ? 6 : 2).toFixed(0) + '%"></i></div><span>' + label + '</span></div>';
    }).join('');
    return '<div class="card nowcast"><h2>' + IC.ui('drop') + t().next3h + '</h2><div class="nbars">' + bars + '</div></div>';
  }

  /* Choix d'affichage des heures, comme l'app Météo d'Apple : conditions, précipitations ou vent. */
  function hourView() { var v = SM.app.settings.hourView; return v === 'precip' || v === 'wind' ? v : 'cond'; }

  /* Bande des heures avec courbe de température. compact = vue d'un jour. */
  function hourStrip(w, from, count, now, opts) {
    opts = opts || {};
    var tt = t(), items = [], temps = [], view = hourView();
    var hs = w.hourly.slice(from, from + count);
    if (!hs.length) return '';
    var sunEvents = [];
    w.daily.forEach(function (d) { if (d.sunrise) sunEvents.push({ t: d.sunrise, rise: true }); if (d.sunset) sunEvents.push({ t: d.sunset, rise: false }); });
    hs.forEach(function (h, i) {
      var wl = wall(w, h.t);
      var isNow = !opts.day && i === 0;
      var ev = sunEvents.filter(function (e) { return e.t >= h.t && e.t < h.t + 3600; })[0];
      temps.push(h.temp);
      items.push('<div class="hi v' + view + (isNow ? ' now' : '') + (wl.h === 0 && !isNow ? ' midnight' : '') + '">' +
        '<div class="ht"><span>' + (isNow ? tt.now : (wl.h === 0 && !opts.day ? tt.daysShort[wl.wd] : I.hOnly(wl))) + '</span></div>' +
        (view === 'cond' ? IC.weather(CO.icon(h.code, h.isDay), 'sm') + '<div class="hv"></div>' : (view === 'precip' ? '<div class="hv"></div>' : '')) +
        (view === 'precip'
          ? '<div class="hp hpop' + ((h.pop || 0) > 0 ? '' : ' zero') + '">' + ((h.pop || 0) > 0 ? IC.ui('drop') : '') + Math.round(h.pop || 0) + ' %</div>'
          : view === 'wind'
            ? '<div class="hwv"><b>' + Math.round(h.wind || 0) + '</b><small>km/h</small></div>'
            : '<div class="hp">' + ((h.pop || 0) >= 10 ? '<span class="pop">' + Math.round(h.pop) + '%</span>' : '') + (h.precip >= 0.1 ? '<span class="mm">' + I.num(h.precip, 1) + '</span>' : '') + '</div>' +
              '<div class="hw">' + arrow(h.dir, 'sm') + Math.round(h.wind) + '</div>') +
        (view !== 'cond' ? '' : ev ? '<div class="hs">' + IC.ui(ev.rise ? 'sunrise' : 'sunset') + I.hm(wall(w, ev.t)) + '</div>' : '<div class="hs"></div>') +
      '</div>');
    });
    if (view === 'precip') {
      items = items.map(function (html, i) {
        var k = rainLevel(hs[i].precip);
        var bar = '<div class="pslot"><i style="height:' + (k * 100).toFixed(0) + '%"></i></div>';
        return html.replace('<div class="hv"></div>', '<div class="hv">' + bar + '</div>');
      });
      return '<div class="hscroll' + (opts.day ? ' dayx' : '') + '"><div class="hstrip vprecip" style="width:' + (hs.length * 4.4) + 'rem">' + items.join('') + '</div></div>';
    }
    if (view === 'wind') {
      // Une seule courbe sous les chiffres : rafales en aplat, vitesse en trait, comme Météo d'Apple.
      var top = Math.max.apply(null, hs.map(function (h) { return Math.max(h.gust || 0, h.wind || 0); }).concat([30]));
      var n = hs.length, CW = 100, WH = 40, px = function (i) { return i * CW + CW / 2; }, py = function (v) { return (WH - 3 - Math.min(v, top) / top * (WH - 8)).toFixed(1); };
      var gl = hs.map(function (h, i) { return px(i) + ' ' + py(h.gust || h.wind || 0); }).join('L');
      var sl = hs.map(function (h, i) { return px(i) + ' ' + py(h.wind || 0); }).join('L');
      var first = py(hs[0].gust || hs[0].wind || 0), firstS = py(hs[0].wind || 0), last = py(hs[n - 1].gust || hs[n - 1].wind || 0), lastS = py(hs[n - 1].wind || 0);
      var area = '<svg class="wcurve" viewBox="0 0 ' + (n * CW) + ' ' + WH + '" preserveAspectRatio="none" aria-hidden="true">' +
        '<defs><linearGradient id="wg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="rgba(150,140,50,.75)"/><stop offset="1" stop-color="rgba(40,110,80,.5)"/></linearGradient>' +
        '<linearGradient id="ws" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="rgba(20,170,150,.55)"/><stop offset="1" stop-color="rgba(20,90,110,.4)"/></linearGradient></defs>' +
        '<path d="M0 ' + WH + 'L0 ' + first + 'L' + gl + 'L' + (n * CW) + ' ' + last + 'L' + (n * CW) + ' ' + WH + 'z" fill="url(#wg)"/>' +
        '<path d="M0 ' + WH + 'L0 ' + firstS + 'L' + sl + 'L' + (n * CW) + ' ' + lastS + 'L' + (n * CW) + ' ' + WH + 'z" fill="url(#ws)"/>' +
        '<path d="M0 ' + firstS + 'L' + sl + 'L' + (n * CW) + ' ' + lastS + '" fill="none" stroke="#22d3c5" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>';
      return '<div class="hscroll' + (opts.day ? ' dayx' : '') + '"><div class="hstrip vwind" style="width:' + (hs.length * 4.4) + 'rem">' + area + items.join('') + '</div></div>';
    }
    var colorOf = tempColor;
    // Courbe : un point par heure, au centre de chaque colonne.
    var lo = Math.min.apply(null, temps), hi = Math.max.apply(null, temps);
    var span = Math.max(hi - lo, 4);
    var colW = 100, H = 60, pts = temps.map(function (v, i) { return [i * colW + colW / 2, 12 + (1 - (v - lo) / span) * (H - 24)]; });
    var d = 'M' + pts.map(function (p) { return p[0] + ' ' + p[1].toFixed(1); }).join('L');
    var grad = 'tg' + Math.round(Math.random() * 1e6);
    var stops = temps.map(function (v, i) { return '<stop offset="' + (i / Math.max(1, temps.length - 1)).toFixed(3) + '" stop-color="' + colorOf(v) + '"/>'; }).join('');
    var labels = pts.map(function (p, i) {
      return '<div class="tl" style="top:' + (p[1] / H * 100).toFixed(1) + '%">' + hang(temps[i]) + '</div><i class="tdot" style="top:' + (p[1] / H * 100).toFixed(1) + '%"></i>';
    });
    // Placer chaque étiquette dans sa colonne.
    items = items.map(function (html, i) { return html.replace('<div class="hv"></div>', '<div class="hv">' + labels[i] + '</div>'); });
    var curve = '<svg class="tcurve" viewBox="0 0 ' + (temps.length * colW) + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><linearGradient id="' + grad + '" x1="0" x2="1" y1="0" y2="0">' + stops + '</linearGradient></defs>' +
      '<path d="' + d + '" fill="none" stroke="url(#' + grad + ')" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>';
    return '<div class="hscroll' + (opts.day ? ' dayx' : '') + '"><div class="hstrip" style="width:' + (hs.length * 4.4) + 'rem">' + curve + items.join('') + '</div></div>';
  }

  /* Les 48 heures pèsent les deux tiers de l'écran (1 250 éléments sur 1 900) alors qu'on en voit 7. Au changement
     de lieu, seules les 12 premières sont construites ; le reste arrive une seconde plus tard (app.js, fillHours). */
  var FIRST_DAYS = 4;
  function firstHours() { return document.getElementById('app').className.indexOf('land') >= 0 ? 8 : 11; }
  function hoursCard(w, now) {
    var tt = t(), v = hourView();
    return '<div class="card hours"><div class="hhead"><div><h2>' + (v === 'wind' ? tt.hvWind : (v === 'precip' ? tt.hvPrecip : tt.hvCond)) + '</h2>' +
      '<p class="hsub">' + (v === 'wind' ? tt.hvWindSub : (v === 'precip' ? tt.hvPrecipSub : tt.hvCondSub)) + '</p></div>' + viewSwitch(v) + '</div>' +
      hourStrip(w, hourIndex(w, now), R.lazy ? firstHours() : 48, now) + '</div>';
  }

  // Le sélecteur à trois icônes de Météo d'Apple (iOS 27) : nuage, goutte, vent.
  function viewSwitch(v) {
    var tt = t();
    return '<span class="hview">' + [['cond', 'cloud', tt.hvCond], ['precip', 'drop', tt.hvPrecip], ['wind', 'wind', tt.hvWind]].map(function (o) {
      return '<button data-hview="' + o[0] + '" aria-label="' + o[2] + '"' + (o[0] === v ? ' class="on"' : '') + '>' + IC.ui(o[1]) + '</button>';
    }).join('') + '</span>';
  }

  // Hauteur d'une barre de pluie (0 à 1) : faible jusqu'à 2,5 mm/h, modérée jusqu'à 7,6, forte au-delà (seuils des lignes pointillées).
  function rainLevel(p) {
    if (!p || p < 0.05) return 0;
    var k = p <= 2.5 ? p / 2.5 / 3 : (p <= 7.6 ? 1 / 3 + (p - 2.5) / 5.1 / 3 : 2 / 3 + Math.min(p - 7.6, 12.4) / 12.4 / 3);
    return Math.max(k, 0.12);
  }

  // Les heures d'un jour (de minuit à minuit, heure du lieu).
  function hoursOfDay(w, d) {
    return w.hourly.filter(function (h) { return h.t >= d.t && h.t < d.t + 86400; });
  }

  // Petite courbe du vent d'une journée : rafales en aplat, vitesse en trait.
  function windSpark(hs, top) {
    var n = hs.length;
    if (n < 2) return '';
    var W = 100, H = 30, x = function (i) { return (i / (n - 1) * W).toFixed(1); }, y = function (v) { return (H - 2 - Math.min(v, top) / top * (H - 4)).toFixed(1); };
    var gust = hs.map(function (h, i) { return x(i) + ' ' + y(h.gust || h.wind || 0); }).join('L');
    var spd = hs.map(function (h, i) { return x(i) + ' ' + y(h.wind || 0); }).join('L');
    return '<svg class="wspark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0 ' + H + 'L' + gust + 'L' + W + ' ' + H + 'z" fill="rgba(120,150,70,.45)"/>' +
      '<path d="M0 ' + H + 'L' + spd + 'L' + W + ' ' + H + 'z" fill="rgba(30,150,140,.35)"/>' +
      '<path d="M' + spd + '" fill="none" stroke="#2ee0d0" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>';
  }

  function daysCard(w, now, part) {
    var tt = t(), di = dayIndex(w, now);
    var days = w.daily.slice(di);
    var lo = Math.min.apply(null, days.map(function (d) { return d.min; }));
    var hi = Math.max.apply(null, days.map(function (d) { return d.max; }));
    var span = Math.max(hi - lo, 1);
    var cur = w.current.temp;
    var v = hourView(), wtop = 30;
    if (v === 'wind') days.forEach(function (d) { hoursOfDay(w, d).forEach(function (h) { wtop = Math.max(wtop, h.gust || 0, h.wind || 0); }); });
    var rows = days.map(function (d, i) {
      var wl = wall(w, d.t + 43200);
      var name = i === 0 ? tt.todayShort : (i === 1 ? tt.tomorrow : tt.daysShort[wl.wd] + ' ' + wl.d);
      // Précipitations et vent : la journée heure par heure, comme Météo d'Apple.
      if (v === 'precip') {
        var bars = hoursOfDay(w, d).map(function (h) {
          var k = rainLevel(h.precip);
          return '<i' + (h.t + 3600 <= now ? ' class="past"' : '') + '><b style="height:' + (k ? (k * 100).toFixed(0) : 0) + '%"></b></i>';
        }).join('');
        return '<div class="drow vprecip" data-day="' + (di + i) + '"><div class="dn">' + name + '</div><div class="dbars">' + bars + '</div>' +
          '<div class="dmm">' + Math.round(d.precip || 0) + ' mm</div><div class="dpop">' + ((d.pop || 0) > 0 ? IC.ui('drop') : '') + Math.round(d.pop || 0) + ' %</div></div>' +
          '<div class="dexp" data-for="' + (di + i) + '"></div>';
      }
      if (v === 'wind') {
        var hd = hoursOfDay(w, d), sp = hd.map(function (h) { return h.wind || 0; });
        var lo2 = sp.length ? Math.round(Math.min.apply(null, sp)) : 0, hi2 = sp.length ? Math.round(Math.max.apply(null, sp)) : Math.round(d.windMax || 0);
        return '<div class="drow vwind" data-day="' + (di + i) + '"><div class="dn">' + name + '</div><div class="dspark">' + windSpark(hd, wtop) + '</div>' +
          '<div class="drange">' + lo2 + ' - ' + hi2 + ' <small>km/h</small></div></div>' +
          '<div class="dexp" data-for="' + (di + i) + '"></div>';
      }
      var l = (d.min - lo) / span * 100, r = (d.max - lo) / span * 100;
      var dot = i === 0 && U.has(cur) ? '<i class="dot" style="left:' + U.clamp((cur - lo) / span * 100, 0, 100).toFixed(1) + '%"></i>' : '';
      return '<div class="drow" data-day="' + (di + i) + '">' +
        '<div class="dn">' + name + '</div>' +
        '<div class="di">' + IC.weather(CO.icon(d.code, 1), 'sm') + '</div>' +
        '<div class="dp">' + ((d.pop || 0) >= 10 ? '<span class="pop">' + Math.round(d.pop) + '%</span>' : '') + (d.precip >= 0.1 ? '<span class="mm">' + I.mm(d.precip) + '</span>' : '') + '</div>' +
        '<div class="dmin">' + I.temp(d.min) + '</div>' +
        '<div class="dbar"><div class="track"><i class="rng" style="left:' + l.toFixed(1) + '%;width:' + Math.max(r - l, 3).toFixed(1) + '%;background:linear-gradient(to right,' + tempColor(d.min) + ',' + tempColor(d.max) + ')"></i>' + dot + '</div></div>' +
        '<div class="dmax">' + I.temp(d.max) + '</div>' +
        '<div class="dw">' + arrow(d.dir, 'sm') + Math.round(d.windMax) + '</div>' +
      '</div><div class="dexp" data-for="' + (di + i) + '"></div>';
    });
    // part : 'first' = les premiers jours seulement (carte marquée « partial »), 'rest' = les lignes suivantes seules.
    if (part === 'rest') return rows.slice(FIRST_DAYS).join('');
    var partial = part === 'first' && rows.length > FIRST_DAYS;
    rows = (partial ? rows.slice(0, FIRST_DAYS) : rows).join('');
    return '<div class="card days' + (partial ? ' partial' : '') + '"><h2>' + IC.ui(v === 'wind' ? 'wind' : (v === 'precip' ? 'drop' : 'sunny')) + tt.daily + '</h2>' + rows + '</div>';
  }

  var R = { editing: false };

  // Température centrée sur ses chiffres, le ° en débord à droite (comme Météo d'Apple).
  // Le signe moins déborde à gauche comme le ° à droite : le nombre reste centré et l'ensemble symétrique.
  function hang(v) {
    var n = I.num(v), neg = n.charAt(0) === '−';
    return '<span class="tn">' + (neg ? '<i class="tneg">−</i>' + n.slice(1) : n) + '<i class="tdeg">°</i></span>';
  }

  function tile(id, icon, title, body, cls) {
    return { id: id, icon: icon, title: title,
      html: '<div class="tile ' + (cls || '') + '" data-tile="' + id + '"><h3>' + IC.ui(icon) + title + '</h3>' + body + '</div>' };
  }

  function compass(dir, speed) {
    var tt = t(), L = I.lang === 'fr' ? ['N', 'E', 'S', 'O'] : ['N', 'E', 'S', 'W'];
    var ticks = '';
    for (var i = 0; i < 36; i++) {
      var a = i * 10 * Math.PI / 180, r1 = i % 9 === 0 ? 34 : 37;
      ticks += '<line x1="' + (50 + Math.sin(a) * r1).toFixed(1) + '" y1="' + (50 - Math.cos(a) * r1).toFixed(1) + '" x2="' + (50 + Math.sin(a) * 41).toFixed(1) + '" y2="' + (50 - Math.cos(a) * 41).toFixed(1) + '"/>';
    }
    var go = (dir + 180) % 360;
    return '<svg class="compass" viewBox="0 0 100 100" aria-hidden="true"><g stroke="rgba(255,255,255,.35)" stroke-width="1">' + ticks + '</g>' +
      '<text x="50" y="23" class="cl">' + L[0] + '</text><text x="80" y="54" class="cl">' + L[1] + '</text><text x="50" y="85" class="cl">' + L[2] + '</text><text x="20" y="54" class="cl">' + L[3] + '</text>' +
      '<g transform="rotate(' + go + ' 50 50)"><path d="M50 10l6 13h-12z" fill="#fff"/><line x1="50" y1="20" x2="50" y2="80" stroke="#fff" stroke-width="2"/><circle cx="50" cy="84" r="3" fill="none" stroke="#fff" stroke-width="2"/></g>' +
      '<circle cx="50" cy="50" r="15" fill="rgba(10,16,32,.85)"/><text x="50" y="50" class="cv">' + Math.round(speed) + '</text><text x="50" y="60" class="cu">km/h</text></svg>';
  }

  function sunArc(w, now, d) {
    if (!d || !d.sunrise || !d.sunset || d.sunset <= d.sunrise) return '';
    var k = U.clamp((now - d.sunrise) / (d.sunset - d.sunrise), 0, 1);
    var ang = Math.PI * (1 - k);
    var x = 50 + Math.cos(ang) * 40, y = 52 - Math.sin(ang) * 36;
    var up = now >= d.sunrise && now <= d.sunset;
    return '<svg class="sunarc" viewBox="0 0 100 60" aria-hidden="true">' +
      '<path d="M10 52A40 36 0 0 1 90 52" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1.5" stroke-dasharray="2 3"/>' +
      '<line x1="4" y1="52" x2="96" y2="52" stroke="rgba(255,255,255,.35)" stroke-width="1"/>' +
      (up ? '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5" fill="#ffd23f"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9" fill="rgba(255,210,63,.25)"/>' : '') +
      '</svg>';
  }

  // Décalage du tremblement d'un bloc à l'autre, celui du Socle (pastille-retirer).
  var DELAYS = [0, -0.1, -0.2, -0.05, -0.15];

  /* Indice de bien-être (voir comfort.js) : la note sur 10, son libellé, une jauge, puis d'où elle vient (la base
     thermique et ce que chaque gêne retire), et le plafond s'il en a un. */
  function comfortTile(w, now) {
    var tt = t(), r = SM.comfort.now(w, now);
    if (!r) return null;
    var lv = SM.comfort.level(r.note), parts = [];
    SM.comfort.ORDRE.forEach(function (k) {
      var e = Math.round(r.eff[k]);
      if (e >= 1) parts.push('<span>' + tt.comfortParts[k] + ' <b>−' + e + ' %</b></span>');
    });
    var body = '<div class="cmfh"><span class="big">' + R.comfortNum(r.note) + '<small>/10</small></span><span class="cmfl cmf-' + lv + '">' + tt.comfortLevels[lv] + '</span></div>' +
      '<div class="cmfbar"><i class="cmf-' + lv + '" style="width:' + (r.note * 10).toFixed(0) + '%"></i></div>' +
      '<p class="sub cmfd"><span>' + tt.comfortBase + ' <b>' + r.n.thermique + '</b> · ' + tt.comfortFeels + ' ' + I.temp(r.fl) + '</span>' +
      (parts.length ? parts.join('') : '<span>' + tt.comfortNone + '</span>') + '</p>' +
      (r.lim ? '<p class="sub cmfcap">' + tt.comfortCap + ' : ' + tt.comfortCaps[r.lim] + '</p>' : '');
    return tile('comfort', 'smile', tt.comfort, body, 'wide');
  }
  // Note affichée : une décimale, sans « ,0 » quand elle tombe juste.
  R.comfortNum = function (x) { return I.num(x, Math.round(x * 10) % 10 ? 1 : 0); };

  function details(place, w, now) {
    var tt = t(), c = w.current, hi = hourIndex(w, now), h = w.hourly[hi] || {}, di = dayIndex(w, now), d = w.daily[di] || {}, dn = w.daily[di + 1];
    var out = [];
    var cmf = comfortTile(w, now);
    if (cmf) out.push(cmf);
    out.push(tile('wind', 'wind', tt.wind, compass(c.dir, c.wind) + '<p class="sub">' + I.dir(c.dir) + ' · ' + tt.gusts + ' ' + Math.round(c.gust) + ' km/h</p>', 'wide-sm'));
    // Pression et tendance sur 3 h.
    var p3 = w.hourly[Math.max(0, hi - 3)], trend = U.has(p3 && p3.pres) && U.has(c.pres) ? c.pres - p3.pres : 0;
    var tr = trend > 1 ? tt.rising : (trend < -1 ? tt.falling : tt.steady);
    var gaugeK = U.clamp((c.pres - 970) / 70, 0, 1), ga = Math.PI * (1.25 - gaugeK * 1.5);
    out.push(tile('pressure', 'gauge', tt.pressure,
      '<svg class="gauge" viewBox="0 0 100 70" aria-hidden="true"><path d="M18 62A38 38 0 1 1 82 62" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="6" stroke-linecap="round"/>' +
      '<line x1="50" y1="40" x2="' + (50 + Math.cos(ga) * 30).toFixed(1) + '" y2="' + (40 - Math.sin(ga) * 30).toFixed(1) + '" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="40" r="4" fill="#fff"/></svg>' +
      '<div class="big">' + Math.round(c.pres) + '<small> hPa</small></div><p class="sub">' + tr + ' (' + (trend >= 0 ? '+' : '') + I.num(trend, 1) + (I.lang === 'fr' ? ' en 3 h)' : ' in 3 h)') + '</p>'));
    out.push(tile('humidity', 'drop', tt.humidity, '<div class="big">' + Math.round(c.hum) + '<small> %</small></div><p class="sub">' + tt.dew + ' ' + I.temp(h.dew) + '</p>'));
    var uvv = U.has(h.uv) ? h.uv : 0, ul = uvLevel(uvv);
    out.push(tile('uv', 'sunny', tt.uv, '<div class="big">' + Math.round(uvv) + '<small> ' + ul.label + '</small></div>' +
      '<div class="scale uvs"><i style="left:' + U.clamp(uvv / 11 * 100, 0, 100).toFixed(1) + '%"></i></div><p class="sub">' + tt.max + ' ' + Math.round(d.uvMax || 0) + '</p>'));
    var vis = h.vis;
    out.push(tile('visibility', 'eye', tt.visibility, '<div class="big">' + (U.has(vis) ? (vis >= 10000 ? Math.round(vis / 1000) : I.num(vis / 1000, 1)) : '–') + '<small> km</small></div>'));
    out.push(tile('clouds', 'cloud', tt.clouds, '<div class="big">' + Math.round(c.cloud) + '<small> %</small></div>'));
    // Précipitations du jour et sur 24 h.
    var sum24 = 0;
    for (var i = hi; i < Math.min(w.hourly.length, hi + 24); i++) sum24 += w.hourly[i].precip || 0;
    out.push(tile('rain', 'drop', tt.rainTotal, '<div class="big">' + I.mm(d.precip).replace(' mm', '<small> mm</small>') + '</div><p class="sub">' + tt.today24 + ' · ' + I.mm(sum24) + ' ' + tt.next24 + '</p>'));
    // Soleil.
    if (d.sunrise && d.sunset) {
      var diff = dn && dn.daylight && d.daylight ? Math.round((dn.daylight - d.daylight) / 60) : null;
      out.push(tile('sun', 'sunrise', tt.sun, sunArc(w, now, d) +
        '<div class="sunrow"><span>' + IC.ui('sunrise') + I.hm(wall(w, d.sunrise)) + '</span><span>' + IC.ui('sunset') + I.hm(wall(w, d.sunset)) + '</span></div>' +
        '<p class="sub">' + tt.daylight + ' ' + I.duration(d.daylight) + (diff !== null ? ' · ' + tt.tomorrowShort + ' ' + (diff >= 0 ? '+' : '−') + Math.abs(diff) + ' min' : '') + '</p>', 'wide'));
    }
    // Lune.
    var ph = SM.astro.moonPhase(now * 1000);
    out.push(tile('moon', 'moon', tt.moon, '<div class="moonrow">' + IC.moonPhase(ph, place.lat < 0, 56) + '<div><b>' + tt.moonPhases[SM.astro.phaseIndex(ph.phase)] + '</b><p class="sub">' + Math.round(ph.fraction * 100) + ' % ' + tt.illuminated + '</p></div></div>', w.air && U.has(w.air.aqi) ? '' : 'wide'));
    // Air.
    if (w.air && U.has(w.air.aqi)) {
      var al = airLevel(w.air.aqi), a = w.air;
      out.push(tile('air', 'leaf', tt.air, '<div class="big">' + Math.round(a.aqi) + '<small> ' + al.label + '</small></div>' +
        '<div class="scale aqs"><i style="left:' + U.clamp(a.aqi, 0, 100).toFixed(1) + '%"></i></div>' +
        '<p class="sub">' + (I.lang === 'fr' ? 'PM2,5 ' : 'PM2.5 ') + I.num(a.pm25) + ' · PM10 ' + I.num(a.pm10) + ' · NO₂ ' + I.num(a.no2) + ' · O₃ ' + I.num(a.o3) + ' µg/m³</p>'));
      var pol = [['alder', a.alder, false], ['birch', a.birch, false], ['grass', a.grass, true]].filter(function (p) { return U.has(p[1]) && p[1] >= 1; });
      if (pol.length) {
        out.push(tile('pollen', 'flower', tt.pollen, pol.map(function (p) {
          var lv = pollenLevel(p[1], p[2]);
          return '<div class="polrow"><span>' + tt[p[0]] + '</span><span class="pl l' + lv + '">' + tt.pollenLevels[lv] + '</span></div>';
        }).join('')));
      }
    }
    // Ordre et blocs retirés choisis en mode édition (réglages tiles et hiddenTiles).
    var st = SM.app.settings, order = (st.tiles || []).slice(), hidden = st.hiddenTiles || [], editing = !!R.editing;
    // Un bloc nouveau rejoint l'ordre choisi : le bien-être en tête, les autres à la fin.
    out.forEach(function (x) { if (order.indexOf(x.id) < 0) { if (x.id === 'comfort') order.unshift(x.id); else order.push(x.id); } });
    var byId = {};
    out.forEach(function (x) { byId[x.id] = x; });
    var shown = order.filter(function (id) { return byId[id] && hidden.indexOf(id) < 0; });
    var off = order.filter(function (id) { return byId[id] && hidden.indexOf(id) >= 0; });
    var k = 0;
    var tiles = shown.map(function (id) {
      var h = byId[id].html;
      if (!editing) return h;
      // Comme le Socle (carte tremblante) : deux éléments, le cadre porte le glisser, l'intérieur tremble.
      return '<div class="tslot' + (h.indexOf('class="tile wide"') >= 0 ? ' wide' : '') + '" data-tile="' + id + '"><div class="twig" style="-webkit-animation-delay:' + DELAYS[k % 5] + 's;animation-delay:' + DELAYS[k++ % 5] + 's">' +
        '<button class="tminus" data-remove="' + id + '" aria-label="' + tt.removeTile + '"><svg viewBox="0 0 24 24"><path d="M6 12h12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></button>' +
        h.replace(' data-tile="' + id + '"', '') + '</div></div>';
    }).join('');
    return '<div class="card details' + (editing ? ' editing' : '') + '"><h2>' + IC.ui('gauge') + tt.details +
      '<button class="tedit' + (editing ? ' on' : '') + '" data-edit="1">' + (editing ? tt.done : tt.edit) + '</button></h2>' +
      (editing ? '<p class="editband"><b>' + tt.editMode + '</b> · ' + tt.editHint + '</p>' : '') +
      '<div class="tiles">' + tiles + '</div>' +
      (editing && off.length ? '<div class="tadds"><span>' + tt.addTiles + '</span>' + off.map(function (id) {
        return '<button class="tadd" data-add="' + id + '">+ ' + IC.ui(byId[id].icon) + byId[id].title + '</button>';
      }).join('') + '</div>' : '') + '</div>';
  }

  /* ---------- assemblage ---------- */

  R.view = function (place, w, now) {
    var sm = summary(w, now), al = alerts(w, now);
    return '<div class="view">' +
      '<section class="hero">' + hero(place, w, now) + '</section>' +
      '<section class="side"><div class="side-in">' +
        '<div class="card summary">' + IC.ui(sm.icon) + '<span>' + U.esc(sm.text) + '</span></div>' +
        (al.length ? '<div class="alerts">' + al.map(function (a) { return '<div class="alert l' + a.lvl + '">' + IC.ui(a.icon) + '<span>' + U.esc(a.text) + '</span></div>'; }).join('') + '</div>' : '') +
        nowcast(w, now) + hoursCard(w, now) + daysCard(w, now, R.lazy ? 'first' : '') +
        // Les détails sont toujours sous le bas de l'écran à l'arrivée : construits au second temps, à la même hauteur.
        (R.lazy && !R.editing ? '<div class="card details lazy" style="min-height:' + (R.detailsH || 520) + 'px"></div>' : details(place, w, now)) +
        '<p class="credit">' + U.esc(t().source) + '</p>' +
      '</div></section></div>';
  };

  R.empty = function (place, msg, retry) {
    return '<div class="view empty"><section class="hero"><div class="hero-top"><div class="clock"><span class="hm"></span><span class="ss"></span></div><div class="date"></div></div>' +
      '<div class="dial"><div class="dial-in"><div class="label">' + U.esc(msg) + '</div>' + (retry ? '<button class="btn retry">' + t().retry + '</button>' : '') + '</div></div></section></div>';
  };

  R.dayHours = function (w, dayIdx, now) {
    var d = w.daily[dayIdx];
    if (!d) return '';
    var start = 0;
    for (var i = 0; i < w.hourly.length; i++) { if (w.hourly[i].t >= d.t) { start = i; break; } }
    return hourStrip(w, start, 24, now, { day: true });
  };

  // La courbe et les points doivent partager la même bande : la courbe se cale sur la zone des valeurs de la première heure.
  /* Blocs de détails sans trou : la grille compte autant de colonnes que la place le permet, et la dernière ligne
     pouvait rester à moitié vide (Lune et Qualité de l'air, puis un vide à droite). On simule le placement (les
     blocs larges prennent deux colonnes, les petits comblent les trous) ; si la dernière ligne n'est pas pleine,
     son dernier bloc s'élargit jusqu'au bord. Recalculé à chaque mise en page, donc valable en paysage comme en portrait. */
  function fillTiles(root) {
    [].forEach.call((root || document).querySelectorAll('.tiles'), function (grid) {
      var kids = [].slice.call(grid.children);
      kids.forEach(function (k) { if (k.getAttribute('data-fill')) { k.style.gridColumn = ''; k.removeAttribute('data-fill'); } });
      var cols = (getComputedStyle(grid).gridTemplateColumns || '').split(' ').filter(function (x) { return x; }).length;
      if (cols < 2 || !kids.length) return;
      var wideOk = window.innerWidth > 600, rows = [], placed = [];
      kids.forEach(function (k) {
        var span = k.classList.contains('wide') && wideOk ? Math.min(2, cols) : 1, r = 0, c, found = false;
        while (!found) {
          rows[r] = rows[r] || [];
          for (c = 0; c + span <= cols && !found; c++) {
            var free = true;
            for (var j = 0; j < span; j++) if (rows[r][c + j]) free = false;
            if (free) { for (j = 0; j < span; j++) rows[r][c + j] = true; found = true; placed.push({ el: k, r: r, c: c, span: span }); }
          }
          if (!found) r++;
        }
      });
      var last = rows.length - 1, used = 0;
      for (var i = 0; i < cols; i++) if (rows[last][i]) used = i + 1;
      var count = rows[last].filter(function (x) { return x; }).length;
      // Dernière ligne continue depuis la gauche et incomplète : son dernier bloc prend le reste.
      if (count === used && used < cols) {
        var tail = placed.filter(function (p) { return p.r === last && p.c + p.span === used; })[0];
        if (tail) { tail.el.style.gridColumn = 'span ' + (tail.span + cols - used); tail.el.setAttribute('data-fill', '1'); }
      }
    });
  }
  R.fillTiles = fillTiles;

  R.align = function (root) {
    fillTiles(root);
    [].forEach.call((root || document).querySelectorAll('.hstrip'), function (st) {
      var svg = st.querySelector('.tcurve'), hv = st.querySelector('.hv');
      if (!svg || !hv) return;
      // Mesures au sous-pixel (offsetTop arrondit au pixel entier).
      var a = st.getBoundingClientRect(), b = hv.getBoundingClientRect();
      if (!b.height) return;
      svg.style.top = (b.top - a.top).toFixed(2) + 'px';
      svg.style.height = b.height.toFixed(2) + 'px';
    });
  };

  R.daysRest = function (w, now) { return daysCard(w, now, 'rest'); };
  R.detailsCard = function (place, w, now) { return details(place, w, now); };
  R.hoursFull = function (w, now) { return hourStrip(w, hourIndex(w, now), 48, now); };
  R.hourIndex = hourIndex;
  R.tempColor = tempColor;
  R.summary = summary;
  R.alerts = alerts;
  SM.ui = R;
})();
