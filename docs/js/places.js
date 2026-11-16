/* Écran Lieux : liste, recherche, ajout, suppression, ordre, lieu de démarrage. */
(function () {
  var U = SM.U, I = SM.i18n, IC = SM.icons;
  var body, timer = 0, lastQuery = '', results = [];

  function t() { return I.t(); }

  function listHTML() {
    var tt = t(), places = SM.app.places, start = SM.store.startPlace() || places[0].id;
    return places.map(function (p, i) {
      return '<div class="prow" data-id="' + U.esc(p.id) + '">' +
        '<button class="mini star' + (p.id === start ? ' on' : '') + '" data-act="start" title="' + U.esc(tt.startHere) + '">' + IC.ui('star') + '</button>' +
        '<div class="pn" data-act="go"><b>' + U.esc(p.name) + '</b><small>' + U.esc([p.region, p.country].filter(Boolean).join(', ')) + '</small></div>' +
        '<button class="mini" data-act="up"' + (i === 0 ? ' disabled' : '') + '>' + IC.ui('up') + '</button>' +
        '<button class="mini" data-act="down"' + (i === places.length - 1 ? ' disabled' : '') + '>' + IC.ui('down') + '</button>' +
        '<button class="mini danger" data-act="del" title="' + U.esc(tt.remove) + '">' + IC.ui('trash') + '</button>' +
      '</div>';
    }).join('');
  }

  function resultsHTML(state) {
    var tt = t();
    if (state === 'busy') return '<p class="hint">' + tt.searching + '</p>';
    if (state === 'error') return '<p class="hint">' + tt.offline + '</p>';
    if (!results.length) return lastQuery.length > 1 ? '<p class="hint">' + tt.noResult + '</p>' : '';
    var have = {};
    SM.app.places.forEach(function (p) { have[p.lat.toFixed(2) + ',' + p.lon.toFixed(2)] = 1; });
    return results.map(function (r, i) {
      var dup = have[r.lat.toFixed(2) + ',' + r.lon.toFixed(2)];
      return '<div class="prow res">' +
        '<div class="pn"><b>' + U.esc(r.name) + '</b><small>' + U.esc([r.region, r.country].filter(Boolean).join(', ')) + '</small></div>' +
        (dup ? '<span class="hint">' + tt.alreadyThere + '</span>' : '<button class="btn sm" data-add="' + i + '">' + IC.ui('plus') + tt.add + '</button>') +
      '</div>';
    }).join('');
  }

  function render() {
    var tt = t();
    body.innerHTML =
      '<div class="searchbox">' + IC.ui('search') + '<input class="search" type="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="' + U.esc(tt.search) + '" value="' + U.esc(lastQuery) + '"></div>' +
      '<div class="results">' + resultsHTML() + '</div>' +
      '<div class="plist">' + listHTML() + '</div>';
    var input = U.$('input', body);
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = input.value.trim();
      lastQuery = q;
      if (q.length < 2) { results = []; U.$('.results', body).innerHTML = ''; return; }
      timer = setTimeout(function () { search(q); }, 450);
    });
  }

  function search(q) {
    var box = U.$('.results', body);
    box.innerHTML = resultsHTML('busy');
    SM.api.search(q).then(function (r) {
      if (q !== lastQuery) return;
      results = r;
      box.innerHTML = resultsHTML();
    }).catch(function (e) {
      SM.diag.warn('recherche : ' + e.message);
      box.innerHTML = resultsHTML('error');
    });
  }

  function refreshList() { U.$('.plist', body).innerHTML = listHTML(); U.$('.results', body).innerHTML = resultsHTML(); }

  function onClick(e) {
    var add = e.target.closest('[data-add]');
    if (add) {
      var r = results[+add.getAttribute('data-add')];
      if (!r) return;
      var places = SM.app.places.slice();
      places.push(r);
      SM.app.setPlaces(places);
      SM.app.toast(t().added + ' · ' + r.name);
      results = []; lastQuery = '';
      U.$('input', body).value = '';
      refreshList();
      return;
    }
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var row = btn.closest('.prow'), id = row.getAttribute('data-id'), act = btn.getAttribute('data-act');
    var list = SM.app.places.slice(), i = -1;
    list.forEach(function (p, k) { if (p.id === id) i = k; });
    if (i < 0) return;
    if (act === 'go') { SM.app.close(); SM.app.goTo(id); return; }
    if (act === 'start') { SM.store.saveStartPlace(id); refreshList(); return; }
    if (act === 'up' && i > 0) { list.splice(i - 1, 0, list.splice(i, 1)[0]); }
    if (act === 'down' && i < list.length - 1) { list.splice(i + 1, 0, list.splice(i, 1)[0]); }
    if (act === 'del') {
      if (list.length === 1) { SM.app.toast(t().lastPlace); return; }
      list.splice(i, 1);
      SM.store.dropWeather(id);
      if (SM.store.startPlace() === id) SM.store.saveStartPlace(list[0].id);
    }
    SM.app.setPlaces(list);
    refreshList();
  }

  SM.places = {
    open: function (b) {
      body = b;
      results = []; lastQuery = '';
      render();
      body.onclick = onClick;
    }
  };
})();
