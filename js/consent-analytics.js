/* Banner de cookies (Aceptar / Rechazar) para sitio estático
   - Guarda consentimiento en localStorage con expiración (12 meses)
   - Muestra banner solo si no hay decisión o ha caducado
   - Inyecta GA4 únicamente si el usuario acepta
   - Diseño con Tailwind (claro/oscuro)
*/
(function () {
  var KEY = 'consent:analytics'; // 'accepted' | 'rejected'
  var EXP_DAYS = 365; // caducidad del consentimiento
  var scriptEl =
    document.currentScript ||
    document.querySelector('script[data-ga-id][src$="consent-banner.js"]');
  var GA_ID = scriptEl ? scriptEl.getAttribute('data-ga-id') : null;
  var banner = null;

  function now() {
    return Date.now();
  }
  function ms(days) {
    return days * 24 * 60 * 60 * 1000;
  }

  // ---- storage
  function save(val) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: val, ts: now() }));
    } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.ts || now() - o.ts > ms(EXP_DAYS)) {
        localStorage.removeItem(KEY);
        return null;
      }
      return o.v; // 'accepted' | 'rejected'
    } catch (e) {
      return null;
    }
  }

  // ---- GA4 solo tras aceptar
  function enableGA() {
    if (!GA_ID || window.__gaEnabled) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
    window.__gaEnabled = true;
  }

  // ---- UI
  function hideBanner() {
    if (banner) banner.classList.add('hidden');
  }

  function showBanner() {
    if (banner) {
      banner.classList.remove('hidden');
      return;
    }

    banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className =
      'fixed bottom-0 left-0 right-0 z-[10990] ' +
      'bg-white/95 dark:bg-gray-900/95 ' +
      'border-t border-gray-200 dark:border-gray-700 shadow-lg';

    banner.innerHTML =
      '<div class="mx-auto max-w-7xl px-4 py-4 md:py-5 ' +
      'flex flex-col md:flex-row md:items-center md:justify-between gap-3">' +
      '<div class="text-sm md:text-base text-gray-800 dark:text-gray-200">' +
      '<div class="font-semibold mb-1">Tu privacidad</div>' +
      'Usamos cookies <span class="font-semibold">necesarias</span> y ' +
      '<span class="font-semibold">analíticas</span> (Google Analytics) opcionales. ' +
      '<a href="/cookies.html" class="underline underline-offset-2 hover:text-orange-600">Más info</a>' +
      '</div>' +
      '<div class="flex items-center gap-2 md:gap-3">' +
      '<button id="cm-reject" class="px-3 py-2 rounded-lg ' +
      'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:opacity-90">Rechazar</button>' +
      '<button id="cm-accept" class="px-3 py-2 rounded-lg ' +
      'bg-orange-600 text-white hover:opacity-90">Aceptar</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(banner);

    // acciones
    var acceptBtn = banner.querySelector('#cm-accept');
    var rejectBtn = banner.querySelector('#cm-reject');

    acceptBtn.addEventListener('click', function () {
      save('accepted');
      enableGA();
      hideBanner();
    });

    rejectBtn.addEventListener('click', function () {
      save('rejected');
      hideBanner();
    });
  }

  // ---- init
  function init() {
    var v = load();
    if (v === 'accepted') {
      enableGA();
      hideBanner();
      return;
    }
    if (v === 'rejected') {
      hideBanner();
      return;
    }
    showBanner(); // primera visita, historial borrado o caducado
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
