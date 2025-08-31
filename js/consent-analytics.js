// /js/consent-analytics.js — diseño profesional + overlay + márgenes correctos
(function () {
  const GA_ID =
    (document.currentScript && document.currentScript.dataset.gaId) || '';
  const KEY = 'cookie-consent-simple'; // 'accepted' | 'declined'

  // -------- helpers --------
  const save = (v) => {
    try {
      localStorage.setItem(KEY, v);
    } catch (_) {}
  };
  const load = () => {
    try {
      return localStorage.getItem(KEY);
    } catch (_) {
      return null;
    }
  };

  function loadGA() {
    if (!GA_ID || window.__gaLoaded) return;
    window.__gaLoaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true, transport_type: 'beacon' });
  }

  // -------- overlay (fondo atenuado) --------
  let scrim = null;
  function ensureScrim() {
    if (scrim) return scrim;
    scrim = document.createElement('div');
    scrim.id = 'cookie-scrim';
    scrim.className =
      'fixed inset-0 z-[65] bg-black/30 backdrop-blur-[2px] hidden';
    document.body.appendChild(scrim);
    scrim.addEventListener('click', closePanel);
    return scrim;
  }

  // -------- banner (aire + layout) --------
  function ensureBanner() {
    let b = document.getElementById('cookie-banner');
    if (!b) {
      b = document.createElement('div');
      b.id = 'cookie-banner';
      b.className = [
        'fixed bottom-0 inset-x-0 z-50',
        'bg-white/95 dark:bg-gray-900/95 backdrop-blur',
        'border-t border-gray-200 dark:border-gray-700',
        'shadow-[0_-12px_32px_rgba(0,0,0,0.12)]',
        'pb-[env(safe-area-inset-bottom)]',
      ].join(' ');
      b.innerHTML = `
        <div class="max-w-7xl mx-auto px-5 md:px-6 py-5 md:py-7 grid gap-5 md:gap-6 md:grid-cols-[1fr_auto] items-center">
          <div class="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            <p class="font-title text-base md:text-lg font-bold text-gray-900 dark:text-gray-100">Tu privacidad</p>
            <p class="mt-1">Usamos cookies <strong>necesarias</strong> y <strong>analíticas</strong> (Google Analytics) opcionales.</p>
            <a href="#cookies-preferencias" class="mt-3 inline-block underline decoration-dashed hover:no-underline">Preferencias</a>
          </div>
          <div class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <a href="#cookies-decline" class="inline-flex justify-center px-4 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 text-sm font-medium">Rechazar no esenciales</a>
            <a href="#cookies-accept"  class="inline-flex justify-center px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow">Aceptar todo</a>
          </div>
        </div>`;
      document.body.appendChild(b);
    }
    return b;
  }

  // -------- panel (tarjeta con buen espaciado) --------
  let panel = null;
  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'cookie-panel';
    panel.className =
      'fixed z-[70] w-[min(92vw,520px)] max-h-[80vh] overflow-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-gray-200/80 dark:ring-gray-700/80 hidden';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'cookie-panel-title');
    panel.innerHTML = `
      <div class="p-6">
        <div class="flex items-start justify-between gap-4">
          <h2 id="cookie-panel-title" class="font-title text-lg md:text-xl font-bold">Preferencias de cookies</h2>
          <a href="#cookies-close" class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Cerrar">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </a>
        </div>

        <div class="mt-6 space-y-4 text-sm text-gray-800 dark:text-gray-200">
          <section class="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div class="flex items-start gap-3">
              <input type="checkbox" checked disabled class="mt-1 cursor-not-allowed">
              <div>
                <p class="font-semibold">Necesarias</p>
                <p class="mt-0.5">Imprescindibles para seguridad, sesión y preferencias. Siempre activas.</p>
              </div>
            </div>
          </section>

          <section class="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div class="flex items-start gap-3">
              <input id="cm-analytics" type="checkbox" class="mt-1 cursor-pointer accent-orange-500">
              <div>
                <p class="font-semibold">Analíticas (Google Analytics)</p>
                <p class="mt-0.5">Nos ayudan a mejorar midiendo visitas y uso. Opcionales.</p>
              </div>
            </div>
          </section>
        </div>

        <div class="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
          <a href="#cookies-cancel" class="inline-flex px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 text-sm">Cancelar</a>
          <a href="#cookies-save"   class="inline-flex px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow">Guardar preferencias</a>
        </div>
      </div>`;
    document.body.appendChild(panel);
    return panel;
  }

  // evitar solapes: banner + FAB (botón flotante tema)
  function getFabOffset() {
    const sels = [
      '[data-ui-fab]',
      '#theme-toggle',
      '.theme-toggle',
      '[data-theme-toggle]',
    ];
    let px = 0;
    for (const s of sels) {
      document.querySelectorAll(s).forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed') return;
        const r = el.getBoundingClientRect();
        px = Math.max(px, r.height + 16);
      });
      if (px) break;
    }
    return px;
  }
  function placePanel() {
    const p = ensurePanel();
    const b = document.getElementById('cookie-banner');
    const bannerH = b ? b.offsetHeight : 0;
    const offset = bannerH + getFabOffset() + 28; // más margen
    p.style.right = '28px';
    p.style.bottom = offset + 'px';
  }

  function openPanel() {
    ensureScrim().classList.remove('hidden');
    const p = ensurePanel();
    p.classList.remove('hidden');
    const v = load();
    const chk = p.querySelector('#cm-analytics');
    if (chk) chk.checked = v === 'accepted';
    placePanel();
  }
  function closePanel() {
    scrim && scrim.classList.add('hidden');
    panel && panel.classList.add('hidden');
  }

  // -------- acciones --------
  function acceptAll() {
    save('accepted');
    loadGA();
    document.getElementById('cookie-banner')?.remove();
    placePanel();
    closePanel();
  }
  function declineAll() {
    save('declined');
    document.getElementById('cookie-banner')?.remove();
    placePanel();
    closePanel();
  }
  function saveFromPanel() {
    const want = !!ensurePanel().querySelector('#cm-analytics').checked;
    if (want) acceptAll();
    else declineAll();
  }

  // -------- init --------
  const decision = load();
  if (decision === 'accepted') loadGA();
  if (!decision) ensureBanner();
  window.addEventListener('resize', placePanel);

  // -------- manejadores (enlaces <a>) --------
  document.addEventListener('click', (e) => {
    const el = e.target.nodeType === 1 ? e.target : e.target.parentElement;
    const a = el && el.closest ? el.closest('a') : null;
    if (!a) return;
    const h = (a.getAttribute('href') || '').toLowerCase();

    if (a.matches('[data-consent-manage]')) {
      e.preventDefault();
      openPanel();
      return;
    }

    if (h === '#cookies-accept') {
      e.preventDefault();
      acceptAll();
      return;
    }
    if (h === '#cookies-decline') {
      e.preventDefault();
      declineAll();
      return;
    }
    if (h === '#cookies-preferencias') {
      e.preventDefault();
      openPanel();
      return;
    }

    if (h === '#cookies-close' || h === '#cookies-cancel') {
      e.preventDefault();
      closePanel();
      return;
    }
    if (h === '#cookies-save') {
      e.preventDefault();
      saveFromPanel();
      return;
    }
  });
})();
