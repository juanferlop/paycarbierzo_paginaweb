// /js/video-hero-observer.js
// Móvil/tablet: muestra el overlay cuando la sección entra en viewport y lo oculta al salir.
// Desktop: mantiene el :hover de Tailwind activo.
(function () {
  // Detección de entorno táctil menos estricta y más fiable
  const isLikelyTouch = () =>
    'ontouchstart' in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    window.matchMedia('(any-hover: none)').matches ||
    window.matchMedia('(any-pointer: coarse)').matches;

  const SECTIONS = document.querySelectorAll('[data-video-hero]');
  if (!SECTIONS.length) return;

  // Mostrar/Ocultar corrigiendo utilidades opuestas de Tailwind
  const SHOW = (el) => {
    el?.classList.remove('opacity-0', 'pointer-events-none');
    el?.classList.add('opacity-100', 'pointer-events-auto');
  };
  const HIDE = (el) => {
    el?.classList.remove('opacity-100', 'pointer-events-auto');
    el?.classList.add('opacity-0', 'pointer-events-none');
  };

  // Sensibilidad
  const THRESHOLD = 0.3;
  const ROOT_MARGIN = '-10% 0px -10% 0px';

  // Solo activamos el observador automático en dispositivos táctiles.
  if (!isLikelyTouch()) return; // en desktop seguimos solo con :hover

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const overlay = entry.target.querySelector('[data-video-overlay]');
          if (!overlay) return;
          if (entry.isIntersecting && entry.intersectionRatio >= THRESHOLD) {
            SHOW(overlay);
          } else {
            HIDE(overlay);
          }
        });
      },
      {
        root: null,
        threshold: [0, THRESHOLD, 0.5, 1],
        rootMargin: ROOT_MARGIN,
      }
    );

    SECTIONS.forEach((sec) => io.observe(sec));
  } else {
    // Fallback por scroll si no hay IntersectionObserver
    const check = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      SECTIONS.forEach((sec) => {
        const overlay = sec.querySelector('[data-video-overlay]');
        if (!overlay) return;
        const rect = sec.getBoundingClientRect();
        const visible = Math.max(
          0,
          Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
        );
        const ratio = visible / Math.min(vh, rect.height || 1);
        if (ratio >= THRESHOLD) SHOW(overlay);
        else HIDE(overlay);
      });
    };
    ['scroll', 'resize', 'orientationchange', 'load'].forEach((ev) =>
      window.addEventListener(ev, check, { passive: true })
    );
    check();
  }
})();
