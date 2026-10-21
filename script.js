const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

$('#year').textContent = new Date().getFullYear();

// Reveal on scroll
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
$$('.reveal').forEach(el => revealObserver.observe(el));

// Mobile menu
const menuButton = $('.menu-toggle');
const nav = $('.nav');
const closeMenu = () => { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); document.documentElement.classList.remove('menu-open'); };
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  document.documentElement.classList.toggle('menu-open', open);
});

// Curtain transition between sections: cover, jump, reveal.
const curtain = $('.curtain');
$$('a[href^="#"]:not(.hops a)').forEach(link => link.addEventListener('click', e => {
  const id = link.getAttribute('href');
  const target = id === '#top' ? document.body : $(id);
  if (!target) return;
  e.preventDefault();
  closeMenu();
  const y = id === '#top' ? 0 : target.getBoundingClientRect().top + scrollY;
  if (reduced) { scrollTo(0, y); return; }
  $('span', curtain).textContent = link.dataset.label || link.textContent.trim();
  curtain.classList.add('is-covering');
  setTimeout(() => {
    scrollTo({ top: y, behavior: 'instant' });
    curtain.classList.replace('is-covering', 'is-leaving');
    setTimeout(() => curtain.classList.remove('is-leaving'), 850);
  }, 750);
}));

// Hero: the arch grows into a full-screen image.
const header = $('.site-header');
const hero = $('.hero');
const arch = $('.hero-arch');
const archImg = $('.hero-arch img');
const heroFades = $$('.hero-fade');
const heroOverlay = $('.hero-overlay');

function updateHero() {
  const total = hero.offsetHeight - innerHeight;
  const raw = clamp(-hero.getBoundingClientRect().top / total);
  const p = reduced ? (raw > .5 ? 1 : 0) : ease(clamp(raw / .78));
  const vw = innerWidth, vh = innerHeight, small = vw < 640;
  const w0 = small ? vw * .62 : Math.min(vw * .3, 440);
  const short = small && vh < 720;
  const h0 = small ? vh * (short ? .27 : .32) : vh * .64;
  const w = w0 + (vw - w0) * p;
  const h = h0 + (vh - h0) * p;
  const r = (w0 / 2) * (1 - p);
  arch.style.width = `${w}px`;
  arch.style.height = `${h}px`;
  arch.style.borderRadius = `${r}px ${r}px 0 0`;
  // On phones the arch starts higher to leave room for the intro below it
  const top = short ? 34 : 38;
  arch.style.top = small ? `${top + (50 - top) * p}%` : '';
  archImg.style.transform = `scale(${1.18 - .18 * p})`;
  heroFades.forEach(el => {
    el.style.opacity = 1 - clamp(p * 2.4);
    el.style.transform = `translateY(${-p * 80}px)`;
  });
  heroOverlay.style.opacity = clamp((raw - .72) / .2);
  header.classList.toggle('is-solid', scrollY > hero.offsetHeight - innerHeight * .6);
}

// Journey: each chapter swaps the sticky arch image and moves the timeline marker.
const chapters = $$('.chapter');
const plates = $$('.plate');
const hops = $('.hops');
const hopItems = $$('.hops li');
const hopArcs = $('.hop-arcs');
const marker = $('.hop-marker');
const HOP_HEIGHT = 16;
let dots = [];
let current = -1;
let markerPos = null;
let hopFrame = 0;

function placeMarker(pos) {
  markerPos = pos;
  marker.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
}
function layoutHops() {
  const box = hops.getBoundingClientRect();
  dots = hopItems.map(li => {
    const r = $('a', li).getBoundingClientRect();
    return { x: r.left + r.width / 2 - box.left, y: r.top + 4.5 - box.top };
  });
  hopArcs.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
  hopArcs.innerHTML = dots.slice(1).map((d, i) => {
    const a = dots[i];
    return `<path d="M${a.x} ${a.y} Q${(a.x + d.x) / 2} ${a.y - HOP_HEIGHT * 2} ${d.x} ${d.y}"/>`;
  }).join('');
  markArcs();
  if (current >= 0) placeMarker(dots[current]);
}
function markArcs() {
  $$('path', hopArcs).forEach((path, j) => path.classList.toggle('is-done', j < current));
}
// The marker follows the same parabola as the arcs, so it hops stop to stop.
function hopTo(i) {
  cancelAnimationFrame(hopFrame);
  const to = dots[i];
  if (!markerPos || reduced || !hops.classList.contains('is-visible')) { placeMarker(to); return; }
  const from = { ...markerPos };
  const span = Math.max(1, Math.round(Math.abs(to.x - from.x) / (dots[1].x - dots[0].x)));
  const height = HOP_HEIGHT * (1 + (span - 1) * .35);
  const duration = 620 + (span - 1) * 160;
  const start = performance.now();
  const step = now => {
    const t = ease(clamp((now - start) / duration));
    placeMarker({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - 4 * height * t * (1 - t) });
    if (t < 1) hopFrame = requestAnimationFrame(step);
  };
  hopFrame = requestAnimationFrame(step);
}
function setChapter(i) {
  if (i === current) return;
  current = i;
  chapters.forEach((c, j) => c.classList.toggle('is-active', j === i));
  plates.forEach((pl, j) => {
    pl.classList.toggle('is-shown', j <= i);
    pl.classList.toggle('is-current', j === i);
  });
  hopItems.forEach((li, j) => {
    li.classList.toggle('is-past', j < i);
    li.classList.toggle('is-current', j === i);
  });
  markArcs();
  hopTo(i);
}
const chapterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) setChapter(+entry.target.dataset.index); });
}, { rootMargin: '-45% 0px -45% 0px' });
chapters.forEach(c => chapterObserver.observe(c));

// Show the timeline only while the journey is on screen.
new IntersectionObserver(([entry]) => {
  hops.classList.toggle('is-visible', entry.isIntersecting);
}, { rootMargin: '-40% 0px -40% 0px' }).observe($('.journey-body'));

// Timeline stops scroll smoothly to their chapter.
$$('a', hops).forEach(link => link.addEventListener('click', e => {
  e.preventDefault();
  const target = $(link.getAttribute('href'));
  const y = target.getBoundingClientRect().top + scrollY + target.offsetHeight / 2 - innerHeight / 2;
  scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
}));

// Projects: vertical scroll drives a horizontal walk through the rooms.
const work = $('.work');
const track = $('.work-track');
const progress = $('.work-progress span');
const horizontalQuery = matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
const panels = $$('.work-intro, .room');
let workStops = [];
// Each panel fills the screen; the walk pauses on each one before sliding on.
function sizeWork() {
  if (horizontalQuery.matches) {
    workStops = panels.map(el => el.offsetLeft - panels[0].offsetLeft);
    work.style.height = `${(panels.length - 1) * innerHeight * 1.5 + innerHeight}px`;
  } else {
    workStops = [];
    work.style.height = '';
    track.style.transform = '';
  }
}
function updateWork() {
  if (!workStops.length) return;
  const p = clamp(-work.getBoundingClientRect().top / (work.offsetHeight - innerHeight));
  const k = p * (workStops.length - 1);
  const i = Math.min(Math.floor(k), workStops.length - 2);
  const f = ease(clamp((k - i - .25) / .5));
  const x = workStops[i] + (workStops[i + 1] - workStops[i]) * f;
  track.style.transform = `translate3d(${-x}px, 0, 0)`;
  progress.style.transform = `scaleX(${p})`;
}

// Screenshot deck: click, arrows or swipe to flip; it also turns by itself while on screen until someone takes over.
$$('.deck').forEach((deck, n) => {
  const slides = $$('.deck-slide', deck);
  const count = $('.deck-count', deck);
  let front = 0, timer = 0, delay = 0, visible = false, touched = false, hovered = false, startX = null;
  const show = i => {
    front = (i + slides.length) % slides.length;
    slides.forEach((sl, j) => {
      const pos = (j - front + slides.length) % slides.length;
      sl.className = 'deck-slide' + (pos === 0 ? ' is-front' : pos === 1 ? ' is-next' : pos === 2 ? ' is-after' : '');
    });
    count.textContent = `${front + 1} / ${slides.length}`;
  };
  const autoplay = () => {
    clearInterval(timer);
    clearTimeout(delay);
    // The second deck turns half a beat after the first, so they never flip together.
    if (visible && !touched && !hovered && !reduced) delay = setTimeout(() => { timer = setInterval(() => show(front + 1), 6000); }, n * 3000);
  };
  const flip = step => { touched = true; clearInterval(timer); clearTimeout(delay); show(front + step); };
  $('.deck-prev', deck).addEventListener('click', () => flip(-1));
  $('.deck-next', deck).addEventListener('click', () => flip(1));
  $('.deck-stage', deck).addEventListener('click', () => flip(1));
  deck.addEventListener('pointerenter', () => { hovered = true; autoplay(); });
  deck.addEventListener('pointerleave', () => { hovered = false; autoplay(); });
  deck.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  deck.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (startX !== null && Math.abs(dx) > 40) flip(dx < 0 ? 1 : -1);
    startX = null;
  });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; autoplay(); }, { threshold: .5 }).observe(deck);
  show(0);
});

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { updateHero(); updateWork(); ticking = false; });
}
function onResize() { sizeWork(); layoutHops(); updateHero(); updateWork(); }
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onResize);
addEventListener('load', onResize);
onResize();
setChapter(0);
document.fonts?.ready.then(layoutHops);
