/* Mode liste : tous les lieux d'un coup d'œil, une carte par lieu sur le ciel du moment (nom, heure locale,
   temps qu'il fait, température, maximum et minimum du jour). Toucher une carte ouvre le lieu. */
(function () {
  var U = SM.U, I = SM.i18n, IC = SM.icons, CO = SM.codes;

  function info(p, ms) {
    var w = SM.app.data[p.id], nowS = Math.floor(ms / 1000);
    var tz = (w && w.tz) || p.tz, wl = I.wall(nowS, tz, w ? w.offset : 0);
    var c = w ? w.current : null, d = null;
    if (w) {
      for (var i = 0; i < w.daily.length; i++) if (I.wall(w.daily[i].t + 43200, tz, w.offset).key === wl.key) { d = w.daily[i]; break; }
    }
    var sky = SM.sky.colorsFor(p.lat, p.lon, ms, c ? c.code : null, c ? c.cloud : null);
    return { p: p, pl: I.place(p), c: c, d: d, wl: wl, sky: sky };
  }

  // Heure locale, suivie du jour quand il n'est pas celui d'ici (Sydney déjà demain, Tahiti encore hier).
  function timeText(wl) {
    var tt = I.t(), d = new Date(), devKey = d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
    var day = wl.key === devKey ? '' : (wl.key > devKey ? tt.tomorrow : tt.yesterday);
    return I.hm(wl) + (day ? ' · ' + day : '');
  }

  function card(ci, current) {
    var cols = ci.sky.cols;
    var bg = 'background:linear-gradient(to bottom,' + U.rgb(cols[0]) + ' 0%,' + U.rgb(cols[1]) + ' 60%,' + U.rgb(cols[2]) + ' 100%)';
    var hl = ci.d ? IC.ui('arrowUp') + I.temp(ci.d.max) + IC.ui('arrowDown') + I.temp(ci.d.min) : '';
    return '<div class="lcard' + (ci.sky.brightness > 0.62 ? ' bright' : '') + (current ? ' cur' : '') + '" data-place="' + U.esc(ci.p.id) + '" style="' + bg + '">' +
      '<div class="lrow"><div class="lname"><b>' + U.esc(ci.pl.name) + '</b><small class="ltime">' + timeText(ci.wl) + '</small></div>' +
      '<div class="ltemp">' + (ci.c && U.has(ci.c.temp) ? I.temp(ci.c.temp) : '–') + '</div></div>' +
      '<div class="lrow low"><span class="lcond">' + (ci.c ? U.esc(CO.label(ci.c.code)) : '') + '</span><span class="lhl">' + hl + '</span></div></div>';
  }

  // Nombre de colonnes : assez pour que tous les lieux tiennent à l'écran sans défiler quand c'est possible.
  function columns(n, land) {
    if (land) return n <= 8 ? 2 : (n <= 15 ? 3 : 4);
    return n <= 8 ? 1 : 2;
  }

  SM.list = {
    html: function (places, ms, currentId, land) {
      return '<div class="listview"><div class="lgrid c' + columns(places.length, land) + '">' +
        places.map(function (p) { return card(info(p, ms), p.id === currentId); }).join('') + '</div></div>';
    },
    // Chaque seconde : seules les heures qui changent sont réécrites.
    tick: function (root, places, ms) {
      var nodes = root.querySelectorAll('.ltime');
      for (var i = 0; i < nodes.length && i < places.length; i++) {
        var p = places[i], w = SM.app.data[p.id];
        var txt = timeText(I.wall(Math.floor(ms / 1000), (w && w.tz) || p.tz, w ? w.offset : 0));
        if (nodes[i].textContent !== txt) nodes[i].textContent = txt;
      }
    }
  };
})();
