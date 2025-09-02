/* js/consent-analytics.js
   Banner + panel de consentimiento (solo "Analíticas").
   - Guarda estado en localStorage (key: CONSENT_KEY)
   - Banner fijo abajo; Panel centrado con overlay por encima del header
   - Accesible: role=dialog, aria-modal, focus trap, cierre con Esc
   - Sin optional chaining para máxima compatibilidad
*/

(function () {
  var CONSENT_KEY = 'consent:analytics'; // 'accepted' | 'rejected' | null
  var scrim = null; // overlay
  var panel = null; // preferencias
  var banner = null; // tira inferior
  var lastActiveEl = null;
  var keydownListener = null;
  var INERT_SELECTORS = [
    'header',
    'main',
    'footer',
    '#app',
    '#__next',
    '.page-wrapper',
  ];
  var inertEls = [];

  // ---------- Storage ----------
  function load() {
    try {
      return localStorage.getItem(CONSENT_KEY);
    } catch (e) {
      return null;
    }
  }
  function save(v) {
    try {
      localStorage.setItem(CONSENT_KEY, v);
    } catch (e) {}
  }

  function setInert(on) {
    inertEls = [];
    for (var i = 0; i < INERT_SELECTORS.length; i++) {
      var el = document.querySelector(INERT_SELECTORS[i]);
      if (!el) continue;
      try {
        el.inert = !!on; // desactiva interacción/foco del fondo
        el.setAttribute('aria-hidden', on ? 'true' : 'false');
        inertEls.push(el);
      } catch (e) {}
    }
  }

  // (Opcional) carga Google Analytics si fue aceptado — deja tu ID si quieres.
  function enableAnalytics() {
    if (window.__analyticsEnabled) return;
    // Ejemplo simple de carga diferida de GA4 (sustituye G-XXXXXXX si lo usas)
    // var id = 'G-XXXXXXXX';
    // if (!id) return;
    // var s = document.createElement('script');
    // s.async = true;
    // s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    // document.head.appendChild(s);
    // window.dataLayer = window.dataLayer || [];
    // function gtag(){ dataLayer.push(arguments); } window.gtag = gtag;
    // gtag('js', new Date()); gtag('config', id, { anonymize_ip: true });
    window.__analyticsEnabled = true;
  }

  function applyDecision(v) {
    save(v);
    if (v === 'accepted') enableAnalytics();
    hideBanner();
  }

  // ---------- UI helpers ----------
  function createEl(tag, attrs, html) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) el.setAttribute(k, attrs[k]);
    if (html != null) el.innerHTML = html;
    return el;
  }

  // Overlay por encima de todo
  function ensureScrim() {
    if (scrim) return scrim;
    scrim = createEl('div');
    scrim.id = 'cookie-scrim';
    scrim.className =
      'fixed inset-0 z-[9990] bg-black/35 backdrop-blur-[2px] hidden';
    scrim.style.pointerEvents = 'auto';
    scrim.style.zIndex = '10990'; // por encima de header/menú, por debajo del panel
    document.body.appendChild(scrim);
    return scrim;
    // Nota: si tu build de Tailwind purga estas clases, añade estas cadenas
    // a la "safelist" de tu config.
  }

  // Panel centrado
  function ensurePanel() {
    if (panel) return panel;
    panel = createEl('div', { id: 'cookie-panel' });
    panel.className =
      'fixed z-[10000] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ' +
      'w-[min(92vw,520px)] max-h-[80dvh] overflow-auto rounded-2xl ' +
      'bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-gray-200/80 dark:ring-gray-700/80 hidden';
    panel.style.pointerEvents = 'auto';
    panel.style.zIndex = '11010'; // el más alto

    panel.setAttribute('tabindex', '-1');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'cookie-panel-title');

    // Contenido del panel
    panel.innerHTML =
      '' +
      '<div class="p-4 md:p-6">' +
      '<div class="flex items-start justify-between gap-2 mb-4">' +
      '<h2 id="cookie-panel-title" class="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">Preferencias de cookies</h2>' +
      '<button type="button" id="cm-close" aria-label="Cerrar" class="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10">' +
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.41 4.29 19.71 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29 10.59 10.59 16.89 4.29z"/></svg>' +
      '</button>' +
      '</div>' +
      '<div class="space-y-3">' +
      // Necesarias (bloque informativo)
      '<div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3">' +
      '<label class="flex items-start gap-3">' +
      '<input type="checkbox" checked disabled class="mt-1.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600">' +
      '<span class="text-sm text-gray-800 dark:text-gray-200">' +
      '<span class="font-medium">Necesarias</span><br/>' +
      'Imprescindibles para seguridad, sesión y preferencias. Siempre activas.' +
      '</span>' +
      '</label>' +
      '</div>' +
      // Analíticas (la única configurable)
      '<div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3">' +
      '<label class="flex items-start gap-3">' +
      '<input id="cm-analytics" type="checkbox" class="mt-1.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600">' +
      '<span class="text-sm text-gray-800 dark:text-gray-200">' +
      '<span class="font-medium">Analíticas (Google Analytics)</span><br/>' +
      'Nos ayudan a mejorar midiendo visitas y uso. Opcionales.' +
      '</span>' +
      '</label>' +
      '</div>' +
      '</div>' +
      '<div class="mt-4 flex items-center justify-end gap-3">' +
      '<button type="button" id="cm-cancel" class="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:opacity-90">Cancelar</button>' +
      '<button type="button" id="cm-save" class="px-3 py-2 rounded-lg bg-orange-600 text-white hover:opacity-90">Guardar preferencias</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(panel);

    // Eventos del panel
    var btnClose = panel.querySelector('#cm-close');
    if (btnClose) btnClose.addEventListener('click', closePanel);

    var btnCancel = panel.querySelector('#cm-cancel');
    if (btnCancel) btnCancel.addEventListener('click', closePanel);

    var btnSave = panel.querySelector('#cm-save');
    if (btnSave)
      btnSave.addEventListener('click', function () {
        var chk = panel.querySelector('#cm-analytics');
        applyDecision(chk && chk.checked ? 'accepted' : 'rejected');
        closePanel();
      });

    return panel;
  }

  // Posición del panel (centrado y compensando si el banner está visible)
  function placePanel() {
    var p = ensurePanel();
    var b = document.getElementById('cookie-banner');
    var bannerH = b && !b.classList.contains('hidden') ? b.offsetHeight : 0;

    p.style.left = '50%';
    p.style.top = '50%';
    p.style.transform = 'translate(-50%, -50%)';

    // Levanta un poco si el banner ocupa espacio
    if (bannerH > 0) {
      var topPx = Math.max(32, (window.innerHeight - bannerH) / 2);
      p.style.top = topPx + 'px';
      p.style.transform = 'translate(-50%, 0)';
    }

    // Altura máxima segura en móvil
    var maxH = Math.max(280, window.innerHeight - bannerH - 48);
    p.style.maxHeight = maxH + 'px';
  }

  // Focus Trap dentro del panel
  function trapFocus(e, panelEl) {
    if (e.key !== 'Tab') return;
    var focusables = panelEl.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;

    var first = focusables[0];
    var last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openPanel() {
    var s = ensureScrim();
    s.classList.remove('hidden');
    s.style.pointerEvents = 'auto';
    s.style.display = 'block'; // 👈 fuerza a mostrarse

    var p = ensurePanel();
    p.classList.remove('hidden');

    // Estado inicial del checkbox
    var v = load();
    var chk = p.querySelector('#cm-analytics');
    if (chk) chk.checked = v === 'accepted';

    placePanel();

    // Bloquear scroll y "apagar" fondo
    document.documentElement.style.overflow = 'hidden';
    setInert(true);

    // Guardar y mover foco
    lastActiveEl = document.activeElement;
    setTimeout(function () {
      try {
        p.focus();
      } catch (e) {}
    }, 0);

    // Cerrar con click en overlay / Esc y mantener foco dentro
    keydownListener = function (e) {
      if (e.key === 'Escape') {
        closePanel();
        return;
      }
      trapFocus(e, p);
    };
    document.addEventListener('keydown', keydownListener);
    s.addEventListener('click', closePanel, { once: true });
  }

  function closePanel() {
    if (scrim) scrim.classList.add('hidden');
    if (panel) panel.classList.add('hidden');

    // Restaurar scroll y fondo
    document.documentElement.style.overflow = '';
    setInert(false);

    // Listeners
    if (keydownListener) {
      document.removeEventListener('keydown', keydownListener);
      keydownListener = null;
    }

    // Devolver foco
    if (lastActiveEl && typeof lastActiveEl.focus === 'function') {
      try {
        lastActiveEl.focus();
      } catch (e) {}
    }
    lastActiveEl = null;
  }

  // Banner inferior
  function ensureBanner() {
    if (banner) return banner;
    banner = createEl('div', { id: 'cookie-banner' });
    banner.className =
      'fixed left-0 right-0 bottom-0 z-[11000] bg-white/95 dark:bg-gray-900/95 backdrop-blur ' +
      'border-t border-gray-200/80 dark:border-gray-700/70 shadow-lg';

    banner.style.pointerEvents = 'auto'; // 👈 asegura que el banner recibe los taps
    banner.style.zIndex = '11000'; // más que cualquier overlay de la página

    banner.innerHTML =
      '' +
      '<div class="mx-auto max-w-7xl px-4 py-4 md:py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">' +
      '<div class="text-sm md:text-base text-gray-800 dark:text-gray-200">' +
      '<div class="font-semibold mb-1">Tu privacidad</div>' +
      'Usamos cookies <span class="font-semibold">necesarias</span> y ' +
      '<span class="font-semibold">analíticas</span> (Google Analytics) opcionales.' +
      '<div><button id="cm-prefs" class="underline underline-offset-2 hover:opacity-90">Preferencias</button></div>' +
      '</div>' +
      '<div class="flex items-center gap-2 md:gap-3">' +
      '<button id="cm-reject" class="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:opacity-90">Rechazar no esenciales</button>' +
      '<button id="cm-accept" class="px-3 py-2 rounded-lg bg-orange-600 text-white hover:opacity-90">Aceptar todo</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(banner);

    // Eventos banner
    var btnPrefs = banner.querySelector('#cm-prefs');
    if (btnPrefs) {
      btnPrefs.addEventListener('click', openPanel);
      btnPrefs.addEventListener('pointerup', function (e) {
        e.preventDefault();
        openPanel();
      });
    }

    var btnAccept = banner.querySelector('#cm-accept');
    if (btnAccept) {
      btnAccept.addEventListener('click', function () {
        applyDecision('accepted');
      });
      btnAccept.addEventListener('pointerup', function (e) {
        e.preventDefault();
        applyDecision('accepted');
      });
    }

    var btnReject = banner.querySelector('#cm-reject');
    if (btnReject) {
      btnReject.addEventListener('click', function () {
        applyDecision('rejected');
      });
      btnReject.addEventListener('pointerup', function (e) {
        e.preventDefault();
        applyDecision('rejected');
      });
    }

    return banner;
  }

  function hideBanner() {
    var b = document.getElementById('cookie-banner') || banner;
    if (b) b.classList.add('hidden');
  }

  function showBanner() {
    ensureBanner().classList.remove('hidden');
    // 🔒 Asegura que el overlay no intercepte taps cuando solo hay banner
    var s = ensureScrim();
    s.classList.add('hidden');
    s.style.pointerEvents = 'none';
    s.style.display = 'none';
  }

  // ---------- Init ----------
  function init() {
    // Si ya hay decisión previa, no mostramos banner; y si aceptó, activamos analytics.
    var v = load();
    if (v === 'accepted') {
      enableAnalytics();
      return;
    }
    if (v === 'rejected') {
      return;
    }

    showBanner();

    // Recolocar panel si cambia el viewport (teclado móvil, giro, etc.)
    window.addEventListener('resize', function () {
      if (panel && !panel.classList.contains('hidden')) placePanel();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Activar enlace con data-consent-manage
  document.querySelectorAll('[data-consent-manage]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openPanel();
    });
  });
})();
