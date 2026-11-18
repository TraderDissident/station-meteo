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
    return { p: p, pl: I.place(p), c: c, d: d, wl: wl, sky: sky, cmf: w ? SM.comfort.now(w, nowS) : null };
  }

  // Heure locale, suivie du jour quand il n'est pas celui d'ici (Sydney déjà demain, Tahiti encore hier).
  function timeText(wl) {
    var tt = I.t(), d = new Date(), devKey = d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
    var day = wl.key === devKey ? '' : (wl.key > devKey ? tt.tomorrow : tt.yesterday);
    return I.hm(wl) + (day ? ' · ' + day : '');
  }

  // Une carte en trois morceaux, comparés séparément à la mise à jour : fond (ciel), heure (réécrite chaque minute
  // par tick) et contenu (températures, temps qu'il fait), qui ne change qu'à l'arrivée de nouvelles données.
  function bgOf(ci) {
    var cols = ci.sky.cols;
    return 'linear-gradient(to bottom,' + U.rgb(cols[0]) + ' 0%,' + U.rgb(cols[1]) + ' 60%,' + U.rgb(cols[2]) + ' 100%)';
  }
  function inner(ci) {
    var hl = ci.d ? IC.ui('arrowUp') + I.temp(ci.d.max) + IC.ui('arrowDown') + I.temp(ci.d.min) : '';
    return '<div class="lrow"><div class="lname"><b>' + U.esc(ci.pl.name) + '</b><small class="ltime">' + timeText(ci.wl) + '</small></div>' +
      '<div class="ltemp">' + (ci.c && U.has(ci.c.temp) ? I.temp(ci.c.temp) : '–') + '</div></div>' +
      '<div class="lrow low"><span class="lcond">' + comfortPill(ci) + (ci.c ? U.esc(CO.label(ci.c.code)) : '') + '</span><span class="lhl">' + hl + '</span></div>';
  }
  // Note de bien-être du lieu, en pastille colorée devant le temps qu'il fait.
  function comfortPill(ci) {
    if (!ci.cmf) return '';
    var lv = SM.comfort.level(ci.cmf.note);
    return '<span class="lcmf cmf-' + lv + '">' + SM.ui.comfortNum(ci.cmf.note) + '</span>';
  }
  // Clé du contenu sans l'heure (qui change chaque minute et a son propre chemin).
  function contentKey(ci) {
    return (ci.cmf ? ci.cmf.note + '|' : '') + (ci.c ? ci.c.temp + '|' + ci.c.code : '') + '|' + (ci.d ? ci.d.max + '|' + ci.d.min : '') + '|' + ci.pl.name;
  }
  function card(ci, current) {
    return '<div class="lcard' + (ci.sky.brightness > 0.62 ? ' bright' : '') + (current ? ' cur' : '') + '" data-place="' + U.esc(ci.p.id) + '"' +
      ' data-k="' + U.esc(contentKey(ci)) + '" style="background:' + bgOf(ci) + '">' + inner(ci) + '</div>';
  }

  // Nombre de colonnes : assez pour que tous les lieux tiennent à l'écran sans défiler quand c'est possible.
  // En paysage, jamais plus de 5 cartes par colonne : au-delà de 20 lieux, une colonne de plus.
  var ROWS = 5;
  function columns(n, land) {
    if (land) return Math.max(n <= 8 ? 2 : (n <= 15 ? 3 : 4), Math.ceil(n / ROWS));
    return n <= 8 ? 1 : 2;
  }

  SM.list = {
    html: function (places, ms, currentId, land) {
      return '<div class="listview"><div class="lgrid c' + columns(places.length, land) + '">' +
        places.map(function (p) { return card(info(p, ms), p.id === currentId); }).join('') + '</div></div>';
    },
    /* Chaque minute et à l'arrivée de données : mise à jour sur place. Mesuré sur l'iPad : reconstruire toute la liste
       coûtait 275 ms une fois par minute. Seul ce qui a changé est touché : le fond d'une carte (le ciel avance avec
       l'heure), son contenu si de nouvelles données sont arrivées. La liste n'est reconstruite que si les lieux ont changé. */
    update: function (root, places, ms) {
      var grid = root.querySelector('.lgrid'), nodes = grid ? grid.children : [];
      var same = grid && nodes.length === places.length;
      for (var i = 0; same && i < places.length; i++) if (nodes[i].getAttribute('data-place') !== places[i].id) same = false;
      if (!same) { SM.app.rerender(); return; }
      for (i = 0; i < places.length; i++) {
        var ci = info(places[i], ms), n = nodes[i], k = contentKey(ci), bg = bgOf(ci);
        if (n.getAttribute('data-k') !== k) { n.innerHTML = inner(ci); n.setAttribute('data-k', k); }
        if (n.getAttribute('data-bg') !== bg) { n.style.background = bg; n.setAttribute('data-bg', bg); }
        var cls = 'lcard' + (ci.sky.brightness > 0.62 ? ' bright' : '') + (n.className.indexOf(' cur') >= 0 ? ' cur' : '');
        if (n.className !== cls) n.className = cls;
      }
    },
    /* Paysage : les cartes prennent toute la hauteur libre, 5 rangées (demande de Matt), au lieu d'une hauteur fixe
       qui laissait un vide en bas. Recalculé à chaque mise en page. */
    fit: function (root) {
      var view = root.querySelector('.listview'), grid = view && view.querySelector('.lgrid');
      if (!grid) return;
      var cards = grid.children, land = document.getElementById('app').className.indexOf('land') >= 0;
      var h = '';
      if (land && cards.length) {
        var cs = getComputedStyle(grid), m = parseFloat(getComputedStyle(cards[0]).marginTop) || 0;
        var avail = view.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        h = Math.floor(avail / ROWS - 2 * m) + 'px';
      }
      for (var i = 0; i < cards.length; i++) if (cards[i].style.height !== h) cards[i].style.height = h;
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
