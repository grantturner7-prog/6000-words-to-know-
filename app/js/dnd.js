/* Drag and drop for touch and mouse (Pointer Events), plus tap-then-tap for keyboards and small screens.
   The browser's built-in drag API is unreliable on touch screens, so it is not used. */
(function (G) {
  'use strict';

  /* G.dnd.attach(root, { chip, zone, onDrop(chip, zone), onTap?(chip), tapPlace?(chip), canDrag?(chip) })
     chip:  selector for draggable words or letters
     zone:  selector for places they can land
     tapPlace: when given, a tap on a chip lands it on the zone this returns (used for letter tiles)
     onTap:    runs first on a tap; return true to stop the default select behaviour */
  function attach(root, o) {
    let sel = null, drag = null, justDragged = false;

    function zones() { return G.$$(o.zone, root); }
    function clearSel() {
      if (sel) sel.classList.remove('sel');
      sel = null; zones().forEach(z => z.classList.remove('waiting'));
    }
    function select(chip) {
      clearSel(); sel = chip; chip.classList.add('sel');
      zones().forEach(z => { if (!z.classList.contains('locked')) z.classList.add('waiting'); });
    }
    function zoneAt(x, y) {
      const els = document.elementsFromPoint(x, y);
      for (const el of els) {
        const z = el.closest && el.closest(o.zone);
        if (z && root.contains(z) && !z.classList.contains('locked')) return z;
      }
      return null;
    }
    function usable(chip) {
      return !chip.classList.contains('ok') && !chip.classList.contains('used') && !chip.disabled &&
        chip.getAttribute('aria-disabled') !== 'true' && (!o.canDrag || o.canDrag(chip));
    }

    root.addEventListener('pointerdown', e => {
      const chip = e.target.closest(o.chip);
      if (!chip || !root.contains(chip) || !usable(chip)) return;
      if (e.button !== undefined && e.button > 0) return;
      drag = { chip, x0: e.clientX, y0: e.clientY, id: e.pointerId, moved: false, ghost: null, over: null };
    });

    function onMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 7) {
        drag.moved = true;
        const r = drag.chip.getBoundingClientRect();
        const g = drag.chip.cloneNode(true);
        g.classList.add('ghost'); g.classList.remove('sel', 'dragging');
        g.style.width = r.width + 'px'; g.style.height = r.height + 'px';
        document.body.appendChild(g);
        drag.ghost = g; drag.dx = e.clientX - r.left; drag.dy = e.clientY - r.top;
        drag.chip.classList.add('dragging'); clearSel();
      }
      if (drag.moved) {
        e.preventDefault();
        drag.ghost.style.left = (e.clientX - drag.dx) + 'px';
        drag.ghost.style.top = (e.clientY - drag.dy) + 'px';
        const z = zoneAt(e.clientX, e.clientY);
        if (z !== drag.over) {
          if (drag.over) drag.over.classList.remove('over');
          drag.over = z; if (z) z.classList.add('over');
        }
      }
    }
    window.addEventListener('pointermove', onMove, { passive: false });

    function finish(e, drop) {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      if (!d.moved) return;
      const z = drop ? zoneAt(e.clientX, e.clientY) : null;
      if (d.over) d.over.classList.remove('over');
      if (d.ghost) d.ghost.remove();
      d.chip.classList.remove('dragging');
      justDragged = true; setTimeout(() => { justDragged = false; }, 0);
      if (z) o.onDrop(d.chip, z);
    }
    const onUp = e => finish(e, true), onCancel = e => finish(e, false);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    G.onLeave(() => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    });

    root.addEventListener('click', e => {
      if (justDragged) return;
      const chip = e.target.closest(o.chip);
      if (chip && root.contains(chip)) {
        if (!usable(chip)) return;
        if (o.onTap && o.onTap(chip) === true) { clearSel(); return; }
        if (o.tapPlace) { const z = o.tapPlace(chip); if (z) { clearSel(); o.onDrop(chip, z); return; } }
        if (sel === chip) clearSel(); else select(chip);
        return;
      }
      const zone = e.target.closest(o.zone);
      if (zone && root.contains(zone) && sel && !zone.classList.contains('locked')) {
        const c = sel; clearSel(); o.onDrop(c, zone);
      }
    });

    root.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches(o.zone) && !e.target.matches('button')) {
        e.preventDefault(); e.target.click();
      }
    });

    return { clearSel };
  }

  G.dnd = { attach };
})(window.G = window.G || {});
