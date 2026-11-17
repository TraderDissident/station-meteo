/* Écrans Réglages et Diagnostic (avec la démonstration du ciel). */
(function () {
  var U = SM.U, I = SM.i18n;
  function t() { return I.t(); }

  function seg(key, options, value) {
    return '<div class="seg" data-key="' + key + '">' + options.map(function (o) {
      return '<button data-v="' + U.esc(String(o[0])) + '"' + (String(o[0]) === String(value) ? ' class="on"' : '') + '>' + U.esc(o[1]) + '</button>';
    }).join('') + '</div>';
  }
  function field(label, html) { return '<div class="field"><label>' + U.esc(label) + '</label>' + html + '</div>'; }

  /* Champ d'heure de Travel Hub (TimePickerField) : un bouton avec une horloge, qui ouvre deux colonnes,
     heures puis minutes, avec « Maintenant ». Choisir l'heure garde les minutes ; choisir les minutes referme. */
  var CLOCK = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  function timeField(key, value) {
    return '<div class="tp"><button type="button" class="tpbtn" data-tp="' + key + '">' + CLOCK + '<span>' + U.hhmm(value) + '</span></button></div>';
  }
  function timePop(key) {
    var tt = t(), v = U.hhmm(SM.app.settings[key]), h = v.slice(0, 2), m = v.slice(3);
    function col(kind, label, items, sel) {
      return '<div class="tpcol"><p>' + U.esc(label) + '</p><div class="tplist" data-kind="' + kind + '">' + items.map(function (x) {
        return '<button type="button" data-' + kind + '="' + x + '"' + (x === sel ? ' class="on"' : '') + '>' + x + '</button>';
      }).join('') + '</div></div>';
    }
    var hours = [], mins = [];
    for (var i = 0; i < 24; i++) hours.push(U.pad(i));
    for (var j = 0; j < 60; j++) mins.push(U.pad(j));
    // 00 aux deux bouts des minutes, comme dans Travel Hub : après 59, l'heure revient.
    mins.push('00');
    return '<div class="tppop" data-for="' + key + '"><div class="tpcols">' + col('h', tt.tpHours, hours, h) + col('m', tt.tpMinutes, mins, m) + '</div>' +
      '<div class="tpfoot"><button type="button" data-tpnow="1">' + U.esc(tt.tpNow) + '</button></div></div>';
  }

  function settingsHTML() {
    var tt = t(), s = SM.app.settings;
    var html =
      field(tt.carousel, seg('carousel', [[0, tt.off], [30, tt.every(30)], [60, tt.every(60)], [300, tt.every(300)]], s.carousel)) +
      field(tt.veil, seg('veil', [['off', tt.off], ['auto', tt.auto], ['hours', tt.hours]], s.veil));
    if (s.veil === 'hours') {
      html += '<div class="twocol">' + field(tt.from, timeField('veilFrom', s.veilFrom)) + field(tt.to, timeField('veilTo', s.veilTo)) + '</div>';
    }
    if (s.veil !== 'off') html += field(tt.level, seg('veilLevel', [[0.35, '35 %'], [0.55, '55 %'], [0.7, '70 %']], s.veilLevel));
    html +=
      field(tt.motion, seg('motion', [['auto', tt.auto], ['reduced', tt.reduced], ['off', tt.motionOff]], s.motion)) +
      field(tt.seconds, seg('seconds', [[true, tt.yes], [false, tt.no]], s.seconds)) +
      field(tt.language, seg('lang', [['en', 'English'], ['fr', 'Français'], ['auto', tt.auto]], s.lang)) +
      field(tt.about, '<p class="about">' + tt.version + ' ' + SM.VERSION + '<br>' + U.esc(tt.source) + '<br>' + U.esc(tt.mapCredit) + '</p>' +
        '<p class="about" id="latestVer">' + U.esc(SM.update.latest ? tt.latest + ' ' + SM.update.latest : tt.checking) + '</p>' +
        '<div class="btnrow"><button class="btn" data-update="1">' + tt.forceUpdate + '</button>' +
        '<button class="btn" data-open="diag">' + tt.diagnostic + '</button></div>');
    return html;
  }

  function parse(key, v) {
    if (key === 'carousel') return parseInt(v, 10);
    if (key === 'veilLevel') return parseFloat(v);
    if (key === 'seconds') return v === 'true';
    return v;
  }

  function bindSettings(body) {
    body.innerHTML = settingsHTML();
    showLatest();
    body.onclick = function (e) {
      var b = e.target.closest('.seg button');
      if (b) {
        var key = b.parentNode.getAttribute('data-key');
        SM.app.setSetting(key, parse(key, b.getAttribute('data-v')));
        bindSettings(body);
        return;
      }
      if (e.target.closest('[data-open="diag"]')) SM.app.open('diag');
      // Champ d'heure.
      var pop = U.$('.tppop', body), tb = e.target.closest('.tpbtn');
      if (tb) {
        var k = tb.getAttribute('data-tp'), was = pop && pop.getAttribute('data-for') === k;
        if (pop) pop.parentNode.removeChild(pop);
        if (was) return;
        tb.parentNode.insertAdjacentHTML('beforeend', timePop(k));
        // Chaque colonne montre la valeur choisie en son milieu.
        U.$$('.tplist', body).forEach(function (l) {
          var on = U.$('.on', l);
          if (on) l.scrollTop = on.offsetTop - l.clientHeight / 2 + on.offsetHeight / 2;
        });
        return;
      }
      if (pop && e.target.closest('.tppop')) {
        var key2 = pop.getAttribute('data-for'), cur = U.hhmm(SM.app.settings[key2]);
        var bh = e.target.closest('[data-h]'), bm = e.target.closest('[data-m]'), now = e.target.closest('[data-tpnow]');
        if (bh) {
          SM.app.setSetting(key2, bh.getAttribute('data-h') + ':' + cur.slice(3));
          U.$$('[data-h]', pop).forEach(function (x) { x.className = x === bh ? 'on' : ''; });
          U.$('.tpbtn[data-tp="' + key2 + '"] span', body).textContent = U.hhmm(SM.app.settings[key2]);
        } else if (bm || now) {
          var d = new Date();
          SM.app.setSetting(key2, now ? U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()) : cur.slice(0, 2) + ':' + bm.getAttribute('data-m'));
          bindSettings(body);
        }
        return;
      }
      if (pop) pop.parentNode.removeChild(pop);
    };
    U.$$('select', body).forEach(function (sel) {
      sel.onchange = function () { SM.app.setSetting(sel.getAttribute('data-key'), parse(sel.getAttribute('data-key'), sel.value)); };
    });
  }

  /* ---------- diagnostic ---------- */
  function diagHTML() {
    var tt = t(), g = tt.diag, d = SM.diag, demo = SM.app.demo;
    var rows = [
      [g.version, SM.VERSION],
      [g.browser, navigator.userAgent],
      [g.screen, screen.width + '×' + screen.height + ' · ' + g.window + ' ' + innerWidth + '×' + innerHeight + ' · ×' + (window.devicePixelRatio || 1)],
      [g.home, navigator.standalone ? tt.yes : tt.no],
      [g.anim, (SM.sky.fps || '–') + ' ' + g.fps + ' · ' + g.quality + ' ' + SM.sky.quality() + ' · ' + g.motion[SM.app.settings.motion]],
      [g.lastCall, d.lastFetch || '–'],
      [g.network, navigator.onLine ? g.online : g.offline],
      [g.uptime, Math.round((Date.now() - d.started) / 60000) + ' min'],
      [g.errors, d.errors()]
    ];
    var times = ['reel', 'nuit', 'aube', 'lever', 'matin', 'midi', 'soir', 'coucher', 'crepuscule'];
    var weathers = Object.keys(tt.demoWeathers);
    return '<table class="kv">' + rows.map(function (r) { return '<tr><th>' + r[0] + '</th><td>' + U.esc(r[1]) + '</td></tr>'; }).join('') + '</table>' +
      field(tt.demo + ' · ' + tt.demoTime, '<div class="seg" data-demo="time">' + times.map(function (k) {
        var on = (k === 'reel' && !demo.time && !demo.cycle) || demo.time === k;
        return '<button data-v="' + k + '"' + (on ? ' class="on"' : '') + '>' + (k === 'reel' ? tt.demoWeathers.reel : tt.demoTimes[k]) + '</button>';
      }).join('') + '<button data-v="cycle"' + (demo.cycle ? ' class="on"' : '') + '>' + tt.demoCycle + '</button></div>') +
      field(tt.demo + ' · ' + tt.demoWeather, '<div class="seg" data-demo="weather">' + weathers.map(function (k) {
        var on = (k === 'reel' && !demo.weather) || demo.weather === k;
        return '<button data-v="' + k + '"' + (on ? ' class="on"' : '') + '>' + tt.demoWeathers[k] + '</button>';
      }).join('') + '</div>') +
      '<div class="btnrow"><button class="btn" data-x="reload">' + tt.reload + '</button><button class="btn" data-x="clear">' + tt.clearLog + '</button></div>' +
      '<pre class="log">' + U.esc(d.lines().slice().reverse().join('\n')) + '</pre>';
  }

  function bindDiag(body) {
    body.innerHTML = diagHTML();
    body.onclick = function (e) {
      var b = e.target.closest('[data-demo] button');
      if (b) {
        var which = b.parentNode.getAttribute('data-demo'), v = b.getAttribute('data-v');
        if (which === 'time') SM.app.setDemo({ time: v === 'reel' || v === 'cycle' ? null : v, cycle: v === 'cycle' });
        else SM.app.setDemo({ weather: v === 'reel' ? null : v });
        bindDiag(body);
        return;
      }
      var x = e.target.closest('[data-x]');
      if (!x) return;
      if (x.getAttribute('data-x') === 'reload') location.reload();
      if (x.getAttribute('data-x') === 'clear') { SM.diag.clear(); bindDiag(body); }
    };
  }

  // Bouton « Forcer la mise à jour » et version en ligne, lue à l'ouverture des réglages.
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-update]')) SM.update.force();
  });
  function showLatest() {
    var tt = t();
    SM.update.latestVersion().then(function (v) {
      var p = document.getElementById('latestVer');
      if (p) p.textContent = v === SM.VERSION ? tt.upToDate : tt.latest + ' ' + v;
    }).catch(function () {
      var p = document.getElementById('latestVer');
      if (p) p.textContent = tt.onlineUnknown;
    });
  }

  SM.settings = { open: bindSettings, openDiag: bindDiag };
})();
