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
