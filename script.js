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
