/* Mode édition des détails, sur le modèle du Socle (carte tremblante, pastille « − ») :
   bouton Modifier ou appui long sur un bloc, blocs qui tremblent, « − » pour retirer,
   « + » pour remettre, glisser au doigt ou à la souris pour réordonner. */
(function () {
  'use strict';
  var E = { dragging: false };
  var LONG = 550;

  function setEditing(on) {
    SM.ui.editing = on;
    SM.app.render();
  }

  function saveOrder() {
    var tilesEl = document.querySelector('.details .tiles');
    if (!tilesEl) return;
    var shown = [].map.call(tilesEl.querySelectorAll('.tslot'), function (n) { return n.getAttribute('data-tile'); });
    // Les blocs retirés ou absents aujourd'hui (pollen) gardent leur place après ceux qu'on voit.
    var old = SM.app.settings.tiles || [];
    var rest = old.filter(function (id) { return shown.indexOf(id) < 0; });
    SM.app.setSetting('tiles', shown.concat(rest));
  }

  function toggle(list, id, on) {
    var out = list.filter(function (x) { return x !== id; });
    if (on) out.push(id);
    return out;
  }

  // Boutons : Modifier / Terminé, « − », « + ».
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;
    var b = t.closest('[data-edit]');
    if (b) { setEditing(!SM.ui.editing); return; }
    b = t.closest('[data-remove]');
    if (b) {
      e.stopPropagation();
      saveOrder();
      SM.app.setSetting('hiddenTiles', toggle(SM.app.settings.hiddenTiles || [], b.getAttribute('data-remove'), true));
      SM.app.render();
      return;
    }
    b = t.closest('[data-add]');
    if (b) {
      SM.app.setSetting('hiddenTiles', toggle(SM.app.settings.hiddenTiles || [], b.getAttribute('data-add'), false));
      SM.app.render();
    }
  });

  /* ---------- appui long, puis glisser ---------- */
  var press = 0, sx = 0, sy = 0, slot = null, grabX = 0, grabY = 0, px = 0, py = 0;

  function point(e) {
    var p = e.touches ? e.touches[0] || e.changedTouches[0] : e;
    return { x: p.clientX, y: p.clientY };
  }

  function start(e) {
    if (!e.target.closest) return;
    var p = point(e);
    sx = p.x; sy = p.y;
    if (!SM.ui.editing) {
      // Appui long sur un bloc : entrée en mode édition.
      if (!e.target.closest('.details .tile')) return;
      clearTimeout(press);
      press = setTimeout(function () { press = 0; setEditing(true); }, LONG);
      return;
    }
    if (e.target.closest('.tminus')) return;
    var s = e.target.closest('.tslot');
    if (!s) return;
    var r = s.getBoundingClientRect();
    slot = s; grabX = p.x - r.left; grabY = p.y - r.top; px = p.x; py = p.y;
    if (e.type === 'mousedown') e.preventDefault();
  }

  function place() {
    slot.style.webkitTransform = slot.style.transform = 'none';
    var r = slot.getBoundingClientRect();
    var tr = 'translate3d(' + (px - grabX - r.left).toFixed(0) + 'px,' + (py - grabY - r.top).toFixed(0) + 'px,0)';
    slot.style.webkitTransform = slot.style.transform = tr;
  }

  function move(e) {
    var p = point(e);
    if (press && (Math.abs(p.x - sx) > 10 || Math.abs(p.y - sy) > 10)) { clearTimeout(press); press = 0; }
    if (!slot) return;
    if (e.cancelable) e.preventDefault();
    px = p.x; py = p.y;
    if (!E.dragging) {
      if (Math.abs(px - sx) < 6 && Math.abs(py - sy) < 6) return;
      E.dragging = true;
      slot.className += ' drag';
    }
    // Le bloc sous le doigt : on s'y glisse, avant ou après selon le côté.
    slot.style.visibility = 'hidden';
    var under = document.elementFromPoint(px, py);
    slot.style.visibility = '';
    var other = under && under.closest ? under.closest('.tslot') : null;
    if (other && other !== slot && other.parentNode === slot.parentNode) {
      var kids = [].slice.call(slot.parentNode.children);
      var after = kids.indexOf(other) > kids.indexOf(slot);
      slot.parentNode.insertBefore(slot, after ? other.nextSibling : other);
    }
    place();
  }

  function end() {
    clearTimeout(press); press = 0;
    if (!slot) return;
    var s = slot, was = E.dragging;
    slot = null; E.dragging = false;
    s.style.webkitTransform = s.style.transform = '';
    s.className = s.className.replace(' drag', '');
    if (was) saveOrder();
  }

  document.addEventListener('touchstart', start, { passive: true });
  document.addEventListener('touchmove', move, { passive: false });
  document.addEventListener('touchend', end);
  document.addEventListener('touchcancel', end);
  document.addEventListener('mousedown', start);
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', end);
  // Pas de menu « copier » à l'appui long sur iOS pendant l'édition.
  document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('.details')) e.preventDefault(); });

  SM.edit = E;
})();
