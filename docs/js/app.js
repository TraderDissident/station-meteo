/* Chef d'orchestre : lieux, rafraîchissement, horloge, ciel, gestes, veille, démonstration. */
(function () {
  var U = SM.U, I = SM.i18n, IC = SM.icons;

  var A = {
    places: [], idx: 0, settings: null, data: {}, inflight: {}, failures: {}, retryAt: {},
    demo: { time: null, weather: null, cycle: false, cycleStart: 0 },
    lastTouch: Date.now(), sheet: null, hourKey: '', veilUntil: Date.now() + 30000, mode: 'place'
  };
  var el = {};

  /* ---------- démonstration ---------- */
  var DEMO_WX = {
    clair: { code: 0, cover: 0 }, voile: { code: 1, cover: 25 }, nuageux: { code: 2, cover: 55 }, couvert: { code: 3, cover: 100 },
    brouillard: { code: 45, cover: 100 }, bruine: { code: 53, cover: 95 }, pluie: { code: 63, cover: 100, rate: 3 },
    averse: { code: 81, cover: 80, rate: 5 }, orage: { code: 95, cover: 100, rate: 6 }, neige: { code: 73, cover: 100, rate: 1 },
    grele: { code: 96, cover: 100, rate: 5 }
  };

  /* Mots anglais acceptés dans ?demo= */
  var DEMO_ALIASES = {
    night: 'nuit', dawn: 'aube', sunrise: 'lever', morning: 'matin', noon: 'midi', evening: 'soir', sunset: 'coucher', dusk: 'crepuscule',
    clear: 'clair', hazy: 'voile', cloudy: 'nuageux', overcast: 'couvert', fog: 'brouillard', drizzle: 'bruine', rain: 'pluie',
    showers: 'averse', storm: 'orage', snow: 'neige', hail: 'grele'
  };

  /* Instant du jour où le soleil atteint la hauteur voulue, au lieu affiché. */
  function demoMs(place, key) {
    var now = Date.now(), lat = place.lat, lon = place.lon, best = null, maxAlt = -90, minAlt = 90, tMax = now, tMin = now;
    var step = 5 * 60000, from = now - 12 * 3600000, to = now + 12 * 3600000, t;
    for (t = from; t <= to; t += step) {
      var a = SM.astro.sun(t, lat, lon).alt;
      if (a > maxAlt) { maxAlt = a; tMax = t; }
      if (a < minAlt) { minAlt = a; tMin = t; }
    }
    if (key === 'midi') return tMax;
    if (key === 'nuit') return tMin;
    var target = { aube: -4, lever: 1, matin: Math.min(15, maxAlt * 0.6), soir: Math.min(15, maxAlt * 0.6), coucher: 1, crepuscule: -4 }[key];
    var rising = key === 'aube' || key === 'lever' || key === 'matin';
    var prev = SM.astro.sun(from, lat, lon).alt;
    for (t = from + step; t <= to; t += step) {
      var cur = SM.astro.sun(t, lat, lon).alt;
      if (rising ? (prev < target && cur >= target) : (prev > target && cur <= target)) {
        if (!best || Math.abs(t - now) < Math.abs(best - now)) best = t;
      }
      prev = cur;
    }
    return best || (rising ? tMin + (tMax - tMin) * 0.3 : tMax + 3 * 3600000);
  }

  function nowMs() {
    var p = A.places[A.idx];
    if (A.demo.cycle) return A.demo.cycleStart + (Date.now() - A.demo.cycleRealStart) * 1440;
    if (A.demo.time && p) {
      var key = p.id + A.demo.time + Math.floor(Date.now() / 600000);
      if (A.demoKey !== key) { A.demoKey = key; A.demoBase = demoMs(p, A.demo.time) - Date.now(); }
      return Date.now() + A.demoBase;
    }
    return Date.now();
  }

  /* ---------- ciel ---------- */
  function scene(instant) {
    var p = A.places[A.idx];
    if (!p || A.mode === 'map') return;
    var w = A.data[p.id], c = w ? w.current : {};
    var m0 = w && w.minutely && w.minutely.length ? w.minutely[0].p : 0;
    var sc = {
      lat: p.lat, lon: p.lon, ms: nowMs(), placeName: p.name,
      code: U.has(c.code) ? c.code : 2, cover: U.has(c.cloud) ? c.cloud : 40,
      rate: Math.max((m0 || 0) * 4, c.precip || 0), wind: c.wind || 8, windDir: U.has(c.dir) ? c.dir : 250,
      cold: U.has(c.temp) ? c.temp <= 1 : false
    };
    var dw = A.demo.weather && DEMO_WX[A.demo.weather];
    if (dw) { sc.code = dw.code; sc.cover = dw.cover; sc.rate = dw.rate || 0; sc.cold = dw.code >= 71 && dw.code <= 86; }
    var r = SM.sky.apply(sc, instant);
    // Panneaux plus opaques quand le ciel est clair, pour garder le texte lisible.
    var b = r.brightness;
    el.app.style.setProperty('--panel', 'rgba(8,14,30,' + (0.22 + b * 0.45).toFixed(3) + ')');
    el.app.style.setProperty('--dial', 'rgba(8,14,30,' + (0.18 + b * 0.42).toFixed(3) + ')');
    A.sunAlt = r.sunAlt;
  }

  /* ---------- rendu ---------- */
  function appClass() {
    var land = isLand(), w = innerWidth, base = parseFloat(document.documentElement.style.fontSize) || 16;
    // Colonne des prévisions trop étroite pour les 7 colonnes du tableau des jours : version resserrée.
    var narrow = (land ? w * 0.55 : w) < 31 * base;
    el.app.className = (land ? 'land' : 'port') + (narrow ? ' narrow' : '') + (A.mode === 'map' ? ' mapmode' : '');
  }

  /* iOS 12 en plein écran garde parfois les dimensions d'avant la rotation : window.orientation fait foi. */
  function isLand() {
    if (typeof window.orientation === 'number') return Math.abs(window.orientation) === 90;
    return innerWidth > innerHeight;
  }

  /* Hauteur réelle de l'écran : en plein écran avec barre d'état translucide, iOS 12 retire 20 px en bas. */
  function screenSize() {
    var w = innerWidth, h = innerHeight;
    if (navigator.standalone && screen.width && screen.height) {
      var a = Math.min(screen.width, screen.height), b = Math.max(screen.width, screen.height);
      w = isLand() ? b : a; h = isLand() ? a : b;
    }
    return { w: w, h: h };
  }

  /* La carte du monde (contours, frontières, globe : 155 Ko de code) ne se charge qu'à sa première ouverture. */
  var mapLoading = null;
  function loadMapCode() {
    if (SM.map) return Promise.resolve();
    if (mapLoading) return mapLoading;
    mapLoading = ['world', 'borders', 'globe', 'map'].reduce(function (pr, name) {
      return pr.then(function () {
        return new Promise(function (resolve, reject) {
          var s = document.createElement('script');
          s.src = 'js/' + name + '.js?v=' + SM.VERSION;
          s.onload = resolve;
          s.onerror = function () { reject(new Error(name + '.js')); };
          document.head.appendChild(s);
        });
      });
    }, Promise.resolve()).catch(function (e) {
      mapLoading = null;
      SM.diag.warn('map code: ' + e.message);
      throw e;
    });
    return mapLoading;
  }

  function renderMap() {
    var tt = I.t();
    appClass();
    SM.sky.pause(true);
    if (!SM.map) {
      el.pages.innerHTML = '';
      loadMapCode().then(function () { if (A.mode === 'map') { renderMap(); loadAll(); } }, function () {
        if (A.mode === 'map') { A.mode = 'place'; SM.store.saveMode('place'); render(0); scene(true); A.toast(I.t().offline); }
      });
    } else
    SM.map.render(el.pages, A.places);
    el.pname.textContent = tt.worldMap;
    el.pcountry.textContent = '';
    el.dots.innerHTML = '';
    el.badge.textContent = tt.badge;
    el.badge.style.display = A.demo.time || A.demo.weather || A.demo.cycle ? '' : 'none';
    U.$('[data-act=map]').className = 'iconbtn on';
  }

  function render(dir) {
    var p = A.places[A.idx];
    if (!p) return;
    // Pas de nouveau rendu pendant qu'un bloc est tenu au doigt.
    if (SM.edit && SM.edit.dragging) return;
    if (A.mode === 'map') { renderMap(); return; }
    if (el.app.className.indexOf('mapmode') >= 0) { if (SM.map) SM.map.leave(); appClass(); SM.sky.pause(false); }
    U.$('[data-act=map]').className = 'iconbtn';
    var w = A.data[p.id];
    var now = Math.floor(nowMs() / 1000);
    var oldSide = U.$('.side', el.pages), oldView = U.$('.view', el.pages);
    var keepScroll = !dir && oldSide ? oldSide.scrollTop : 0;
    var keepView = !dir && oldView ? oldView.scrollTop : 0;
    var html;
    try {
      html = w ? SM.ui.view(p, w, now) : SM.ui.empty(p, A.failures[p.id] ? I.t().offline : I.t().loading, !!A.failures[p.id]);
    } catch (e) {
      SM.diag.error('render: ' + e.message);
      html = SM.ui.empty(p, I.t().noData, true);
    }
    el.pages.innerHTML = html;
    SM.ui.align(el.pages);
    // Polices et icônes peuvent encore bouger la mise en page : on recale un peu après.
    setTimeout(function () { SM.ui.align(el.pages); }, 400);
    var v = U.$('.view', el.pages);
    if (dir) v.className += dir > 0 ? ' enter-r' : ' enter-l';
    else {
      var s = U.$('.side', el.pages);
      if (s) s.scrollTop = keepScroll;
      v.scrollTop = keepView;
    }
    var pl = I.place(p), tt = I.t();
    el.pname.textContent = pl.name;
    el.pcountry.textContent = pl.country;
    el.badge.textContent = tt.badge;
    U.$('[data-sheet=places]').setAttribute('aria-label', tt.places);
    U.$('[data-sheet=settings]').setAttribute('aria-label', tt.settings);
    U.$('.sheet-close').setAttribute('aria-label', tt.close);
    U.$('[data-act=map]').setAttribute('aria-label', tt.worldMap);
    el.dots.innerHTML = A.places.length > 1 ? A.places.map(function (q, i) { return '<i' + (i === A.idx ? ' class="on"' : '') + '></i>'; }).join('') : '';
    A.hourKey = w ? hourKey(w) : '';
    clock();
    status();
  }

  function hourKey(w) { return SM.ui.hourIndex(w, Math.floor(nowMs() / 1000)) + '|' + w.fetchedAt; }

  function clock() {
    var p = A.places[A.idx];
    if (!p) return;
    // Pas de nouveau rendu pendant qu'un bloc est tenu au doigt.
    if (SM.edit && SM.edit.dragging) return;
    if (A.mode === 'map') { if (SM.map) SM.map.tick(false); return; }
    var w = A.data[p.id];
    var wl = I.wall(Math.floor(nowMs() / 1000), (w && w.tz) || p.tz, w ? w.offset : 0);
    // Écrire un texte identique oblige quand même l'iPad à recalculer et repeindre : on n'écrit que ce qui change.
    setText('.hm', I.hm(wl));
    setText('.ss', A.settings.seconds ? ':' + U.pad(wl.s) : '');
    setText('.date', I.longDate(wl));
  }
  function setText(sel, txt) {
    var n = U.$(sel, el.pages);
    if (n && n.textContent !== txt) n.textContent = txt;
  }

  function status() {
    var p = A.places[A.idx], st = U.$('.status', el.pages);
    if (!p || !st) return;
    var w = A.data[p.id], tt = I.t();
    if (!w) { st.textContent = ''; return; }
    var age = Date.now() - w.fetchedAt, d = new Date(w.fetchedAt);
    var txt = tt.updated + ' ' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes());
    var off = !navigator.onLine || A.failures[p.id];
    st.className = 'status' + (age > SM.STALE_BADGE_MS || off ? ' stale' : '');
    st.innerHTML = (off ? IC.ui('offline') + tt.offline + ' · ' : '') + U.esc(txt) + (age > SM.STALE_DATA_MS ? ' · ' + tt.stale : '');
    var demo = A.demo.time || A.demo.weather || A.demo.cycle;
    el.badge.style.display = demo ? '' : 'none';
  }

  /* ---------- données ---------- */
  function load(p, force) {
    var w = A.data[p.id];
    var fresh = w && Date.now() - w.fetchedAt < SM.REFRESH_MS;
    if ((fresh && !force) || A.inflight[p.id]) return Promise.resolve();
    if (!force && A.retryAt[p.id] && Date.now() < A.retryAt[p.id]) return Promise.resolve();
    A.inflight[p.id] = true;
    return SM.api.forecast(p).then(function (nw) {
      var old = A.data[p.id];
      if (old && old.air && Date.now() - old.airAt < SM.AIR_REFRESH_MS) { nw.air = old.air; nw.airAt = old.airAt; }
      // Lieu supprimé pendant le chargement : on n'enregistre rien.
      if (!A.places.some(function (q) { return q.id === p.id; })) return;
      A.data[p.id] = nw;
      A.failures[p.id] = 0; A.retryAt[p.id] = 0;
      // Une seule écriture dans l'iPad par rafraîchissement, une fois la qualité de l'air arrivée (ou manquée).
      var save = function () { SM.store.saveWeather(p.id, nw); };
      if (!nw.air) {
        return SM.api.air(p).then(function (air) { nw.air = air; nw.airAt = Date.now(); })
          .catch(function (e) { SM.diag.warn('air quality ' + p.name + ': ' + e.message); }).then(save);
      }
      save();
    }).catch(function (e) {
      var n = (A.failures[p.id] || 0) + 1;
      A.failures[p.id] = n;
      A.retryAt[p.id] = Date.now() + [30, 60, 120, 300][Math.min(n - 1, 3)] * 1000;
      SM.diag.warn('forecast ' + p.name + ': ' + e.message);
    }).then(function () {
      A.inflight[p.id] = false;
      if (A.mode === 'map') { if (!A.sheet && SM.map) SM.map.refresh(); }
      else if (A.places[A.idx] && A.places[A.idx].id === p.id && !A.sheet) { render(0); scene(false); }
      else if (A.places[A.idx] && A.places[A.idx].id === p.id) status();
    });
  }

  /* ---------- navigation ---------- */
  A.goTo = function (id) {
    for (var i = 0; i < A.places.length; i++) if (A.places[i].id === id) { show(i, i > A.idx ? 1 : -1); return; }
  };
  function show(i, dir) {
    var n = A.places.length;
    if (A.mode === 'map') { A.mode = 'place'; SM.store.saveMode('place'); dir = 0; }
    A.idx = ((i % n) + n) % n;
    SM.store.saveCurrent(A.places[A.idx].id);
    render(dir || 0);
    scene(false);
    load(A.places[A.idx]);
  }
  function step(d) { if (A.places.length > 1) show(A.idx + d, d); }

  /* Carte du monde : ouvre ou referme, et charge les lieux qui n'ont pas de données fraîches. */
  A.toggleMap = function () {
    A.mode = A.mode === 'map' ? 'place' : 'map';
    SM.store.saveMode(A.mode);
    render(0);
    if (A.mode === 'place') scene(true);
    else loadAll();
  };
  function loadAll() {
    A.places.reduce(function (pr, p) { return pr.then(function () { return load(p); }); }, Promise.resolve());
  }
  A.nowMs = function () { return nowMs(); };

  A.setPlaces = function (list) {
    var cur = A.places[A.idx] && A.places[A.idx].id;
    A.places = list;
    SM.store.savePlaces(list);
    var i = 0;
    list.forEach(function (p, k) { if (p.id === cur) i = k; });
    A.idx = i;
    list.forEach(function (p) { if (!A.data[p.id]) { A.data[p.id] = SM.store.weather(p.id); if (!A.data[p.id]) delete A.data[p.id]; } });
    render(0);
    scene(true);
    load(A.places[A.idx]);
  };

  /* ---------- feuilles ---------- */
  A.open = function (which) {
    A.close(true);
    A.sheet = which;
    var sh = el.sheet, tt = I.t();
    U.$('h2', sh).textContent = which === 'places' ? tt.places : (which === 'settings' ? tt.settings : tt.diagnostic);
    var body = U.$('.sheet-body', sh);
    if (which === 'places') SM.places.open(body);
    else if (which === 'settings') SM.settings.open(body);
    else SM.settings.openDiag(body);
    sh.className = 'sheet open';
  };
  A.close = function (silent) {
    if (!A.sheet) return;
    A.sheet = null;
    el.sheet.className = 'sheet';
    U.$('.sheet-body', el.sheet).innerHTML = '';
    if (!silent) { render(0); scene(true); }
  };

  A.render = function () { render(0); };

  A.setSetting = function (key, v) {
    A.settings[key] = v;
    SM.store.saveSettings(A.settings);
    if (key === 'lang') { A.settings.langChosen = true; SM.store.saveSettings(A.settings); I.setLang(v); if (A.sheet) A.open(A.sheet); }
    if (key === 'motion') SM.sky.setMotion(v);
    if (key === 'veil' || key === 'veilLevel' || key === 'veilFrom' || key === 'veilTo') veil();
  };

  A.setDemo = function (d) {
    Object.keys(d).forEach(function (k) { A.demo[k] = d[k]; });
    if (d.cycle) { A.demo.cycleStart = demoMs(A.places[A.idx], 'nuit'); A.demo.cycleRealStart = Date.now(); }
    restartSkyTimer();
    scene(true);
    status();
  };

  A.toast = function (msg) {
    el.toast.textContent = msg;
    el.toast.className = 'on';
    clearTimeout(A.toastT);
    A.toastT = setTimeout(function () { el.toast.className = ''; }, 2500);
  };

  /* ---------- veille nocturne ---------- */
  function veilWanted() {
    var s = A.settings;
    if (s.veil === 'off') return false;
    if (s.veil === 'hours') {
      var h = new Date().getHours();
      return s.veilFrom > s.veilTo ? (h >= s.veilFrom || h < s.veilTo) : (h >= s.veilFrom && h < s.veilTo);
    }
    // Automatique : la nuit au lieu de démarrage, supposé être celui de l'iPad.
    var start = SM.store.startPlace(), home = A.places[0];
    A.places.forEach(function (p) { if (p.id === start) home = p; });
    return home ? SM.astro.sun(Date.now(), home.lat, home.lon).alt < -6 : false;
  }
  function veil() {
    var on = veilWanted() && Date.now() > A.veilUntil && !A.sheet;
    var key = on ? String(A.settings.veilLevel) : '0';
    if (key === veilKey) return;
    veilKey = key;
    el.veil.style.opacity = key;
    el.veil.className = on ? 'on' : '';
  }
  var veilKey = '', veilTimer = 0;
  // Un seul réveil programmé pour la fin du délai d'inactivité, au lieu d'une vérification toutes les 2 s.
  function veilLater() {
    if (veilTimer) return;
    veilTimer = setTimeout(function () {
      veilTimer = 0;
      if (Date.now() < A.veilUntil) veilLater(); else veil();
    }, Math.max(A.veilUntil - Date.now(), 0) + 300);
  }

  /* ---------- minuteries ---------- */
  var skyTimer = 0;
  function restartSkyTimer() {
    clearInterval(skyTimer);
    skyTimer = setInterval(function () {
      if (document.hidden) return;
      if (A.mode === 'map') { if (A.demo.cycle && SM.map) SM.map.tick(true); return; }
      scene(!!A.demo.cycle);
      if (A.demo.cycle) clock();
    }, A.demo.cycle ? 200 : 30000);
  }

  function everySecond() {
    if (document.hidden) return;
    clock();
  }

  function everyMinute() {
    if (document.hidden) return;
    var p = A.places[A.idx];
    if (A.mode === 'map') loadAll();
    else if (p) {
      load(p);
      var w = A.data[p.id];
      if (w && !A.sheet && hourKey(w) !== A.hourKey) render(0);
    }
    status();
    veil();
    // Défilement automatique des lieux, seulement si personne n'a touché l'écran depuis une minute.
    var c = A.settings.carousel;
    if (c && !A.sheet && A.mode === 'place' && Date.now() - A.lastTouch > 60000 && Date.now() - (A.lastCarousel || 0) >= c * 1000 - 500) {
      A.lastCarousel = Date.now();
      step(1);
    }
    // Rechargement quotidien vers 4 h pour repartir d'une mémoire propre.
    var d = new Date();
    if (d.getHours() === 4 && Date.now() - SM.diag.started > 3 * 3600000 && navigator.onLine && !A.sheet) {
      SM.diag.info('daily reload');
      location.reload();
    }
  }

  /* ---------- mise en page ---------- */
  function layout() {
    var sz = screenSize(), w = sz.w, h = sz.h;
    var base = U.clamp(Math.min(w, h) / 768 * 16, 11, 19);
    // En paysage, le cadran (23,9 rem avec son anneau) doit tenir dans sa colonne de 45 %.
    if (isLand()) base = Math.min(base, w * 0.45 / 25.5);
    document.documentElement.style.fontSize = base.toFixed(2) + 'px';
    var hs = h + 'px';
    document.documentElement.style.height = hs; document.body.style.height = hs; el.app.style.height = hs;
    appClass();
    SM.sky.resize();
    if (A.mode === 'map' && SM.map) SM.map.resize();
    SM.ui.align(el.pages);
  }

  /* ---------- gestes ---------- */
  function bindGestures() {
    /* Glisser horizontal : la page suit le doigt, puis change de lieu au-delà de 60 px (ou d'un geste vif). */
    var sx = 0, sy = 0, st = 0, ok = false, mode = '', dx = 0, view = null;
    function setShift(x, anim) {
      if (!view) return;
      var tr = x ? 'translate3d(' + x.toFixed(0) + 'px,0,0)' : '';
      view.style.webkitTransition = view.style.transition = anim ? '-webkit-transform .25s ease-out, transform .25s ease-out, opacity .25s' : 'none';
      view.style.webkitTransform = view.style.transform = tr;
      view.style.opacity = x ? String(1 - Math.min(Math.abs(x) / innerWidth, 0.5)) : '';
    }
    el.pages.addEventListener('touchstart', function (e) {
      A.lastTouch = Date.now();
      var tch = e.touches[0];
      ok = e.touches.length === 1 && A.mode === 'place' && A.places.length > 1 && !e.target.closest('.hscroll') && !SM.ui.editing;
      sx = tch.clientX; sy = tch.clientY; st = Date.now(); mode = ''; dx = 0;
      view = U.$('.view', el.pages);
    }, { passive: true });
    el.pages.addEventListener('touchmove', function (e) {
      if (!ok || e.touches.length !== 1) return;
      var tch = e.touches[0], mx = tch.clientX - sx, my = tch.clientY - sy;
      if (!mode && (Math.abs(mx) > 10 || Math.abs(my) > 10)) mode = Math.abs(mx) > Math.abs(my) * 1.2 ? 'h' : 'v';
      if (mode !== 'h') return;
      e.preventDefault();
      dx = mx;
      setShift(dx * 0.6, false);
    }, { passive: false });
    function endSwipe() {
      if (!ok || mode !== 'h') return;
      var fast = Math.abs(dx) > 30 && Date.now() - st < 300;
      if (Math.abs(dx) > 60 || fast) step(dx < 0 ? 1 : -1);
      else setShift(0, true);
      mode = '';
    }
    el.pages.addEventListener('touchend', endSwipe, { passive: true });
    el.pages.addEventListener('touchcancel', function () { if (mode === 'h') setShift(0, true); mode = ''; }, { passive: true });
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('keydown', function (e) {
      if (A.sheet) { if (e.keyCode === 27) A.close(); return; }
      if (e.keyCode === 39) step(1);
      if (e.keyCode === 37) step(-1);
    });
    document.addEventListener('mousedown', function () { A.lastTouch = Date.now(); });

    el.app.addEventListener('click', function (e) {
      A.lastTouch = Date.now();
      if (e.target.closest('[data-act=map]')) { A.toggleMap(); return; }
      var mv = e.target.closest('.mview button');
      if (mv) { SM.map.setView(mv.getAttribute('data-view')); return; }
      var ms = e.target.closest('.mstyle button');
      if (ms) { SM.map.setStyle(ms.getAttribute('data-style')); return; }
      var mc = e.target.closest('.mswitch button');
      if (mc) { SM.map.setCards(mc.getAttribute('data-cards')); return; }
      var city = e.target.closest('.mk, .mcard');
      if (city) { A.goTo(city.getAttribute('data-place')); return; }
      var b = e.target.closest('[data-sheet]');
      if (b) { A.open(b.getAttribute('data-sheet')); return; }
      if (e.target.closest('.sheet-close')) { A.close(); return; }
      if (e.target === el.sheet) { A.close(); return; }
      var hv = e.target.closest('[data-hview]');
      if (hv) { A.setSetting('hourView', hv.getAttribute('data-hview')); render(0); return; }
      if (e.target.closest('.retry')) { var p = A.places[A.idx]; A.retryAt[p.id] = 0; load(p, true); return; }
      if (e.target.closest('#dots i')) { var dots = U.$$('#dots i'); show(dots.indexOf(e.target.closest('#dots i')), 1); return; }
      var row = e.target.closest('.drow');
      if (row) {
        var di = +row.getAttribute('data-day'), box = U.$('.dexp[data-for="' + di + '"]', el.pages);
        var openNow = box.className.indexOf('open') >= 0;
        U.$$('.dexp.open', el.pages).forEach(function (x) { x.className = 'dexp'; x.innerHTML = ''; });
        U.$$('.drow.open', el.pages).forEach(function (x) { x.className = 'drow'; });
        if (!openNow) {
          var p2 = A.places[A.idx];
          box.innerHTML = SM.ui.dayHours(A.data[p2.id], di, Math.floor(nowMs() / 1000)); SM.ui.align(box);
          box.className = 'dexp open';
          row.className = 'drow open';
        }
      }
    });
    // Toute activité (souris, doigt, clavier, molette) repousse la veille de 30 s ; elle revient seule après.
    var wake = function () {
      var was = A.veilUntil > Date.now();
      A.veilUntil = Date.now() + 30000;
      if (!was || el.veil.className) veil();
      veilLater();
    };
    ['mousemove', 'mousedown', 'touchstart', 'keydown', 'wheel'].forEach(function (t) {
      document.addEventListener(t, wake, { capture: true, passive: true });
    });
    veilLater();
    el.veil.addEventListener('click', function () {
      A.veilUntil = Date.now() + 30000;
      veil();
      setTimeout(veil, 30500);
    });
  }

  /* ---------- démarrage ---------- */
  function parseDemo() {
    var m = /[?&]demo=([^&]+)/.exec(location.search);
    if (!m) return;
    decodeURIComponent(m[1]).split(',').forEach(function (k) {
      k = k.trim().toLowerCase().replace('é', 'e').replace('ê', 'e');
      k = DEMO_ALIASES[k] || k;
      if (k === 'cycle') { A.demo.cycle = true; }
      else if (I.t().demoTimes[k]) A.demo.time = k;
      else if (DEMO_WX[k]) A.demo.weather = k;
    });
  }

  A.init = function () {
    A.settings = SM.store.settings();
    I.setLang(A.settings.lang);
    A.places = SM.store.places();
    A.places.forEach(function (p) { var w = SM.store.weather(p.id); if (w) A.data[p.id] = w; });

    document.body.insertAdjacentHTML('afterbegin', IC.defs);
    el.app = U.$('#app');
    el.app.innerHTML =
      '<div id="sky"></div>' +
      '<div id="ui">' +
        '<header class="top">' +
          '<div class="hside"><button class="iconbtn" data-sheet="places" aria-label="Places">' + IC.ui('pin') + '</button></div>' +
          '<div class="ptitle"><div><span id="pname"></span><span id="pcountry"></span><span id="badge"></span></div><div id="dots"></div></div>' +
          '<div class="hside r"><button class="iconbtn" data-act="map" aria-label="Map">' + IC.ui('globe') + '</button>' +
          '<button class="iconbtn" data-sheet="settings" aria-label="Settings">' + IC.ui('gear') + '</button></div>' +
        '</header>' +
        '<main id="pages"></main>' +
      '</div>' +
      '<div id="veil"></div>' +
      '<div class="sheet" id="sheet"><div class="sheet-in"><header><h2></h2><button class="iconbtn sheet-close" aria-label="Close">' + IC.ui('close') + '</button></header><div class="sheet-body"></div></div></div>' +
      '<div id="toast"></div>';
    el.pages = U.$('#pages'); el.pname = U.$('#pname'); el.pcountry = U.$('#pcountry'); el.dots = U.$('#dots');
    el.badge = U.$('#badge'); el.veil = U.$('#veil'); el.sheet = U.$('#sheet'); el.toast = U.$('#toast');

    SM.sky.init(U.$('#sky'));
    SM.sky.motion = A.settings.motion;
    layout();
    parseDemo();
    if (A.demo.cycle) { A.demo.cycleRealStart = Date.now(); }

    var cur = SM.store.current() || SM.store.startPlace();
    var startId = SM.store.startPlace();
    // Un rechargement (geste, mise à jour, rechargement de 4 h) garde le lieu affiché ; seule une vraie
    // ouverture de l'app revient au lieu de démarrage. sessionStorage survit au rechargement, pas à la fermeture.
    var reload = false;
    try { reload = sessionStorage.getItem('sm.alive') === '1'; sessionStorage.setItem('sm.alive', '1'); } catch (e) { /* rien */ }
    var saved = SM.store.current();
    var want = reload && saved ? saved : (startId || cur);
    A.idx = 0;
    A.places.forEach(function (p, i) { if (p.id === want) A.idx = i; });
    A.mode = SM.store.mode() === 'map' ? 'map' : 'place';
    if (A.demo.cycle) A.demo.cycleStart = demoMs(A.places[A.idx], 'nuit');

    render(0);
    scene(true);
    load(A.places[A.idx]);
    // Les autres lieux se chargent en arrière-plan, l'un après l'autre.
    setTimeout(function () {
      A.places.reduce(function (pr, p, i) { return i === A.idx ? pr : pr.then(function () { return load(p); }); }, Promise.resolve());
    }, 4000);

    bindGestures();
    var relayout = function () { setTimeout(function () { layout(); render(0); scene(true); }, 300); };
    window.addEventListener('orientationchange', relayout);
    var rT = 0;
    window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { layout(); scene(true); }, 250); });
    document.addEventListener('visibilitychange', function () {
      SM.sky.pause(document.hidden || A.mode === 'map');
      if (!document.hidden) { SM.update.check(); if (A.mode === 'map') loadAll(); else load(A.places[A.idx]); render(0); scene(true); veil(); }
    });
    window.addEventListener('pageshow', function () { load(A.places[A.idx]); });
    window.addEventListener('online', function () { var p = A.places[A.idx]; A.retryAt[p.id] = 0; load(p, true); status(); });
    window.addEventListener('offline', status);

    setInterval(everySecond, 1000);
    setInterval(everyMinute, 60000);
    restartSkyTimer();
    veil();

    // Pas de service worker en local : il servirait d'anciens fichiers pendant les essais.
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').then(function (r) { if (r.update) r.update(); }).catch(function (e) { SM.diag.warn('service worker: ' + e.message); });
    }
    setTimeout(SM.update.check, 5000);
  };

  window.addEventListener('load', function () { if (SM.ui) SM.ui.align(); });
  SM.app = A;
  document.addEventListener('DOMContentLoaded', function () {
    try { A.init(); } catch (e) { SM.diag.error('start: ' + e.message); throw e; }
  });
})();
