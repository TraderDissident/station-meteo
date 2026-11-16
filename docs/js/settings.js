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

  function hoursOptions() {
    var o = [];
    for (var h = 0; h < 24; h++) o.push([h, h + ' h']);
    return o;
  }

  function settingsHTML() {
    var tt = t(), s = SM.app.settings;
    var html =
      field(tt.carousel, seg('carousel', [[0, tt.off], [30, tt.every(30)], [60, tt.every(60)], [300, tt.every(300)]], s.carousel)) +
      field(tt.veil, seg('veil', [['off', tt.off], ['auto', tt.auto], ['hours', tt.hours]], s.veil));
    if (s.veil === 'hours') {
      html += '<div class="twocol">' + field(tt.from, '<select data-key="veilFrom">' + hoursOptions().map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === s.veilFrom ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>') +
        field(tt.to, '<select data-key="veilTo">' + hoursOptions().map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === s.veilTo ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>') + '</div>';
    }
    if (s.veil !== 'off') html += field(tt.level, seg('veilLevel', [[0.35, '35 %'], [0.55, '55 %'], [0.7, '70 %']], s.veilLevel));
    html +=
      field(tt.motion, seg('motion', [['auto', tt.auto], ['reduced', tt.reduced], ['off', tt.motionOff]], s.motion)) +
      field(tt.seconds, seg('seconds', [[true, tt.yes], [false, tt.no]], s.seconds)) +
      field(tt.language, seg('lang', [['auto', tt.auto], ['fr', 'Français'], ['en', 'English']], s.lang)) +
      field(tt.about, '<p class="about">' + tt.version + ' ' + SM.VERSION + '<br>' + U.esc(tt.source) + '</p>' +
        '<button class="btn" data-open="diag">' + tt.diagnostic + '</button>');
    return html;
  }

  function parse(key, v) {
    if (key === 'carousel' || key === 'veilFrom' || key === 'veilTo') return parseInt(v, 10);
    if (key === 'veilLevel') return parseFloat(v);
    if (key === 'seconds') return v === 'true';
    return v;
  }

  function bindSettings(body) {
    body.innerHTML = settingsHTML();
    body.onclick = function (e) {
      var b = e.target.closest('.seg button');
      if (b) {
        var key = b.parentNode.getAttribute('data-key');
        SM.app.setSetting(key, parse(key, b.getAttribute('data-v')));
        bindSettings(body);
        return;
      }
      if (e.target.closest('[data-open="diag"]')) SM.app.open('diag');
    };
    U.$$('select', body).forEach(function (sel) {
      sel.onchange = function () { SM.app.setSetting(sel.getAttribute('data-key'), parse(sel.getAttribute('data-key'), sel.value)); };
    });
  }

  /* ---------- diagnostic ---------- */
  function diagHTML() {
    var tt = t(), d = SM.diag, demo = SM.app.demo;
    var rows = [
      ['Version', SM.VERSION],
      ['Navigateur', navigator.userAgent],
      ['Écran', screen.width + '×' + screen.height + ' · fenêtre ' + innerWidth + '×' + innerHeight + ' · ×' + (window.devicePixelRatio || 1)],
      ['Écran d’accueil', navigator.standalone ? 'oui' : 'non'],
      ['Animation', (SM.sky.fps || '–') + ' i/s · qualité ' + SM.sky.quality() + ' · ' + SM.app.settings.motion],
      ['Dernier appel', d.lastFetch || '–'],
      ['Réseau', navigator.onLine ? 'en ligne' : 'hors ligne'],
      ['Allumé depuis', Math.round((Date.now() - d.started) / 60000) + ' min'],
      ['Erreurs', d.errors()]
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

  SM.settings = { open: bindSettings, openDiag: bindDiag };
})();
