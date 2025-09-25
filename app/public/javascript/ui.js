// Footer year + active nav
document.getElementById('year').textContent = new Date().getFullYear();
const path = location.pathname.replace(/\/+$/, '');
document.querySelectorAll('.navbar .nav-link').forEach(a => {
  const href = a.getAttribute('href');
  if (href && href !== '/' && path.startsWith(href)) {
    a.classList.add('active'); a.setAttribute('aria-current', 'page');
  }
});

// Spotlight follows pointer (updates CSS vars on overlay)
const overlay = document.querySelector('.bg-overlay');
const rectBody = () => document.body.getBoundingClientRect();
function setSpot(x, y, rect) {
  const px = ((x - rect.left) / rect.width) * 100;
  const py = ((y - rect.top) / rect.height) * 100;
  overlay.style.setProperty('--spot-x', px + '%');
  overlay.style.setProperty('--spot-y', py + '%');
}
window.addEventListener('mousemove', e => setSpot(e.clientX, e.clientY, rectBody()));
window.addEventListener('touchmove', e => { if (e.touches[0]) setSpot(e.touches[0].clientX, e.touches[0].clientY, rectBody()); }, { passive: true });

// Command palette
(function () {
  const overlay = document.getElementById('cmdk');
  const input = document.getElementById('cmdkInput');
  const list = document.getElementById('cmdkList');
  const openBtn = document.getElementById('openPalette');

  function open() { overlay.style.display = 'flex'; overlay.classList.add('open'); input.value = ''; filter(''); setTimeout(() => input.focus(), 0); }
  function close() { overlay.classList.remove('open'); overlay.style.display = 'none'; }
  function filter(q) { const s = q.toLowerCase().trim(); [...list.children].forEach(li => li.style.display = li.textContent.toLowerCase().includes(s) ? '' : 'none'); }

  openBtn.addEventListener('click', open);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  input.addEventListener('input', e => filter(e.target.value));
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName?.toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable;
    if (!typing && e.key === '/') { e.preventDefault(); open(); }
    if (e.key === 'Escape') close();
  });
  list.addEventListener('click', e => {
    const item = e.target.closest('.cmdk-item'); if (!item) return; window.location.href = item.dataset.href;
  });
})();
