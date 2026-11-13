document.getElementById('year').textContent = new Date().getFullYear();

// Light / dark toggle, remembered per visitor.
const root = document.documentElement;
const toggle = document.querySelector('.theme-toggle');
const label = () => toggle.setAttribute('aria-label', `Switch to ${root.dataset.theme === 'dark' ? 'light' : 'dark'} theme`);
toggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  label();
});
label();

// Demo video: don't autoplay for visitors who ask for reduced motion (controls still let them play it).
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('video[autoplay]').forEach(v => { v.removeAttribute('autoplay'); v.pause(); });
}

// Image viewer: tap a screenshot to open it full screen. Swipe or arrow keys to move through the
// project's screenshots, pinch or double-tap to zoom, swipe down / Esc / tap outside to close.
(() => {
  const thumbs = [...document.querySelectorAll('.shots img, .gallery img')];
  if (!thumbs.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icon = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;

  const lb = document.createElement('div');
  lb.className = 'lb';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Screenshot viewer');
  lb.innerHTML = `
    <div class="lb-backdrop"></div>
    <div class="lb-top lb-ui"><span class="lb-count"></span>
      <button class="lb-btn lb-close" type="button" aria-label="Close">${icon('M6 6l12 12M18 6 6 18')}</button></div>
    <button class="lb-btn lb-prev lb-ui" type="button" aria-label="Previous screenshot">${icon('M15 5l-7 7 7 7')}</button>
    <button class="lb-btn lb-next lb-ui" type="button" aria-label="Next screenshot">${icon('M9 5l7 7-7 7')}</button>
    <div class="lb-stage"><img class="lb-img" alt=""></div>
    <p class="lb-cap lb-ui" aria-live="polite"></p>`;
  document.body.appendChild(lb);
  const $ = s => lb.querySelector(s);
  const stage = $('.lb-stage'), img = $('.lb-img'), backdrop = $('.lb-backdrop');
  const cap = $('.lb-cap'), count = $('.lb-count'), prevBtn = $('.lb-prev'), nextBtn = $('.lb-next'), closeBtn = $('.lb-close');

  // One set per project, including the screenshots behind "more screenshots".
  const groupOf = el => [...(el.closest('.project') || el.parentElement).querySelectorAll('.shots img, .gallery img')];
  let group = [], idx = 0, opener = null, open = false;
  let scale = 1, tx = 0, ty = 0;

  let cur = [0, 0, 1];
  const setT = (x, y, s, anim) => {
    cur = [x, y, s];
    img.classList.toggle('lb-anim', !!anim && !reduce);
    img.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  };
  const resetZoom = anim => { scale = 1; tx = 0; ty = 0; img.classList.remove('is-zoomed'); setT(0, 0, 1, anim); };

  const show = i => {
    idx = i;
    const t = group[i];
    img.src = t.currentSrc || t.src;
    img.alt = t.alt;
    const fc = t.closest('figure')?.querySelector('figcaption');
    cap.textContent = fc ? fc.textContent : t.alt;
    count.textContent = group.length > 1 ? `${i + 1} / ${group.length}` : '';
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === group.length - 1;
    [group[i - 1], group[i + 1]].forEach(n => { if (n) new Image().src = n.currentSrc || n.src; });
    resetZoom(false);
  };

  // Transform that places the full-size image over its thumbnail (for the open/close animation).
  const fromThumb = t => {
    const a = t.getBoundingClientRect(), r = img.getBoundingClientRect();
    const b = { left: r.left - cur[0], top: r.top - cur[1], width: r.width / cur[2] }; // untransformed box
    if (!a.width || !b.width || a.bottom < 0 || a.top > innerHeight) return null;
    return [a.left - b.left, a.top - b.top, a.width / b.width];
  };

  const openAt = t => {
    opener = t; group = groupOf(t); open = true;
    show(group.indexOf(t));
    document.documentElement.style.overflow = 'hidden';
    lb.classList.add('is-open');
    const go = () => {
      const f = fromThumb(t);
      if (f) { setT(...f, false); img.getBoundingClientRect(); }
      requestAnimationFrame(() => setT(0, 0, 1, true));
    };
    img.complete ? go() : img.addEventListener('load', go, { once: true });
    closeBtn.focus({ preventScroll: true });
  };

  const close = () => {
    if (!open) return;
    open = false;
    const t = group[idx];
    img.style.transition = '';
    const f = fromThumb(t);
    if (f && !reduce) setT(...f, true); else { img.classList.add('lb-anim'); img.style.opacity = '0'; }
    lb.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    backdrop.style.opacity = '';
    setTimeout(() => { if (!open) { img.style.opacity = ''; img.removeAttribute('src'); resetZoom(false); } }, 330);
    (t || opener)?.focus({ preventScroll: true });
  };

  const step = dir => {
    const n = idx + dir;
    if (n < 0 || n >= group.length) { setT(0, 0, 1, true); return; }
    const w = stage.clientWidth;
    setT(-dir * w, 0, 1, true);
    setTimeout(() => {
      show(n);
      setT(dir * w * .35, 0, 1, false);
      img.style.opacity = '0';
      img.getBoundingClientRect();
      img.style.opacity = '';
      setT(0, 0, 1, true);
    }, reduce ? 0 : 180);
  };

  // Zoom around a point on screen, keeping that point under the finger / cursor.
  const zoomTo = (s, cx, cy, anim) => {
    s = Math.min(4, Math.max(1, s));
    if (s === 1) return resetZoom(anim);
    const r = img.getBoundingClientRect();
    const baseL = r.left - tx, baseT = r.top - ty; // untransformed origin
    const px = (cx - r.left) / scale, py = (cy - r.top) / scale; // point in image space
    tx = cx - baseL - px * s; ty = cy - baseT - py * s; scale = s;
    clampPan();
    img.classList.add('is-zoomed');
    setT(tx, ty, scale, anim);
  };
  const clampPan = () => {
    const w = img.offsetWidth, h = img.offsetHeight;
    const minX = Math.min(0, w - w * scale - (stage.clientWidth - w) / 2), maxX = Math.max(0, (stage.clientWidth - w) / 2);
    const minY = Math.min(0, h - h * scale - (stage.clientHeight - h) / 2), maxY = Math.max(0, (stage.clientHeight - h) / 2);
    tx = Math.min(maxX, Math.max(minX, tx)); ty = Math.min(maxY, Math.max(minY, ty));
  };

  // Pointer gestures: swipe, drag-to-close, pan, pinch, tap and double-tap.
  const pts = new Map();
  let start = null, axis = null, pinch = null, lastTap = 0;
  stage.addEventListener('pointerdown', e => {
    stage.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: scale };
      start = null;
    } else if (pts.size === 1) {
      start = { x: e.clientX, y: e.clientY, tx, ty, t: Date.now(), onImg: e.target === img };
      axis = null;
    }
  });
  stage.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pts.size === 2) {
      const [a, b] = [...pts.values()];
      zoomTo(pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2, false);
      return;
    }
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (scale > 1) { tx = start.tx + dx; ty = start.ty + dy; clampPan(); setT(tx, ty, scale, false); return; }
    if (!axis && Math.hypot(dx, dy) > 8) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (axis === 'x') setT(dx, 0, 1, false);
    if (axis === 'y') {
      setT(0, dy, 1 - Math.min(Math.abs(dy) / 2000, .15), false);
      backdrop.style.opacity = String(Math.max(.2, 1 - Math.abs(dy) / 400));
    }
  });
  const end = e => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pinch) { if (pts.size < 2) { pinch = null; if (scale < 1.05) resetZoom(true); } return; }
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y, dt = Date.now() - start.t;
    const s = start; start = null;
    if (Math.hypot(dx, dy) < 8 && dt < 300) { // tap
      const now = Date.now();
      if (s.onImg && now - lastTap < 300) { lastTap = 0; scale > 1 ? resetZoom(true) : zoomTo(2.5, e.clientX, e.clientY, true); }
      else if (!s.onImg && scale === 1) close();
      else lastTap = now;
      return;
    }
    if (scale > 1) return;
    const fast = dt < 250;
    if (axis === 'x' && (Math.abs(dx) > stage.clientWidth * .2 || (fast && Math.abs(dx) > 40))) step(dx < 0 ? 1 : -1);
    else if (axis === 'y' && (Math.abs(dy) > 110 || (fast && Math.abs(dy) > 50))) close();
    else { backdrop.style.opacity = ''; setT(0, 0, 1, true); }
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('wheel', e => {
    if (!e.ctrlKey && scale === 1) return; // trackpad pinch arrives as ctrl+wheel
    e.preventDefault();
    zoomTo(scale * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .002)), e.clientX, e.clientY, false);
  }, { passive: false });

  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  closeBtn.addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === cap || e.target.classList.contains('lb-top')) close(); });
  document.addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Tab') { // keep focus inside the viewer
      const f = [...lb.querySelectorAll('button:not(:disabled)')].filter(b => b.offsetParent);
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length]?.focus();
    }
  });
  addEventListener('resize', () => { if (open && scale > 1) resetZoom(false); });

  thumbs.forEach(t => {
    t.classList.add('zoomable');
    t.tabIndex = 0;
    t.setAttribute('role', 'button');
    t.setAttribute('aria-label', `Open screenshot: ${t.alt}`);
    t.addEventListener('click', () => openAt(t));
    t.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAt(t); } });
  });
})();
