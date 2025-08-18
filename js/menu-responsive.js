// js/menu-responsive.js
(function () {
  function wireMenu(headerRoot = document) {
    const btn = headerRoot.getElementById
      ? headerRoot.getElementById('menu-btn')
      : headerRoot.querySelector('#menu-btn');
    const menu = headerRoot.getElementById
      ? headerRoot.getElementById('menu')
      : headerRoot.querySelector('#menu');
    if (!btn || !menu) return false;

    // Evita duplicar listeners si se reinyecta el header
    if (btn.dataset.wired === '1') return true;
    btn.dataset.wired = '1';

    const toggle = () => {
      const isHidden = menu.classList.toggle('hidden');
      btn.setAttribute('aria-expanded', String(!isHidden));
    };

    btn.addEventListener('click', toggle);

    // Cierra al hacer click en enlaces del menú (móvil)
    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      if (!menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    // Cierra al pulsar Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    return true;
  }

  // 1) Intenta cablear inmediatamente (por si el header ya está en el DOM)
  if (wireMenu(document)) return;

  // 2) Observa la inyección del header (cargar-header.js)
  const headerHost = document.getElementById('header') || document.body;
  const obs = new MutationObserver(() => {
    if (wireMenu(headerHost)) obs.disconnect();
  });
  obs.observe(headerHost, { childList: true, subtree: true });

  // 3) Fallback cuando el DOM está listo
  document.addEventListener('DOMContentLoaded', () => wireMenu(document));
})();
