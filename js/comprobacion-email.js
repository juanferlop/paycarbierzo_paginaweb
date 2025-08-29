// js/comprobacion-email.js
(function () {
  // Por si quieres defaults globales (usará los data-* si están):
  const DEFAULT_USER = 'carlosfernandez_pyc';
  const DEFAULT_DOMAIN = 'hotmail.com';

  function hidratarEnlace(a) {
    if (!a || a.dataset.emailReady === '1') return;

    const user = a.dataset.user || DEFAULT_USER;
    const domain = a.dataset.domain || DEFAULT_DOMAIN;
    const email = `${user}@${domain}`;

    // href mailto
    if (!a.href || !a.href.startsWith('mailto:')) {
      a.href = `mailto:${email}`;
    }

    // aria-label accesible
    const base = a.dataset.label || 'Enviar correo a';
    a.setAttribute('aria-label', `${base} ${email}`);

    // Texto visible
    const span = a.querySelector('[data-email-text]');
    if (span) span.textContent = email;

    // Marcar como hidratado
    a.dataset.emailReady = '1';
  }

  function hidratarTodos() {
    // Soporta tu implementación antigua con IDs
    const legacyLink = document.getElementById('correo-enlace');
    const legacyText = document.getElementById('correo-texto');
    if (legacyLink) {
      // Si tiene data-* se respetan; si no, usa DEFAULT_*
      hidratarEnlace(legacyLink);
      if (legacyText && legacyLink.dataset.emailReady === '1') {
        // Ya lo escribió hidratarEnlace; nada más que hacer
      }
    }

    // Genérico: todos los [data-email]
    document.querySelectorAll('a[data-email]').forEach(hidratarEnlace);
  }

  // 1) Al cargar el DOM
  document.addEventListener('DOMContentLoaded', hidratarTodos);

  // 2) Cuando el header se inyecte por fetch (si usas cargar-header.js)
  //    a) Si tu cargar-header.js emite un evento 'header:loaded':
  document.addEventListener('header:loaded', hidratarTodos);

  //    b) Si no emite evento, observamos el contenedor #header una sola vez
  const header = document.getElementById('header');
  if (header && 'MutationObserver' in window) {
    const mo = new MutationObserver((muts, obs) => {
      if (header.querySelector('[data-email]')) {
        hidratarTodos();
        obs.disconnect();
      }
    });
    mo.observe(header, { childList: true, subtree: true });
  }

  // 3) Por si llegase tardísimo (fallback suave)
  window.addEventListener('load', hidratarTodos);
})();
