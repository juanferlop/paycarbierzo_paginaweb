// /js/video-hero-observer.js
// Móvil/tablet: muestra el overlay cuando la sección entra en viewport y lo oculta al salir.
// Desktop: no hace nada (sigue funcionando por :hover gracias a Tailwind).

(function () {
  // Detecta dispositivos táctiles (sin hover, puntero “grueso”)
  const isTouch = () =>
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  if (!isTouch()) return; // en desktop salimos: se gestiona con :hover

  const SECTIONS = document.querySelectorAll('[data-video-hero]');
  if (!SECTIONS.length) return;

  // Clases que activan/ocultan el overlay (deben existir en el HTML inicial)
  const SHOW = (el) => el?.classList.add('opacity-100', 'pointer-events-auto');
  const HIDE = (el) =>
    el?.classList.remove('opacity-100', 'pointer-events-auto');

  // Sensibilidad (ajústalo si quieres):
  /* Ajusta la sensibilidad cambiando threshold y rootMargin.
     Más pronto: sube rootMargin a -30% 0px -30% 0px o baja el threshold a 0.1.
     Más tarde: baja rootMargin (por ejemplo -10% …) o sube el threshold a 0.3.
     Si quieres que siempre quede visible en móvil mientras cualquier parte esté a la vista, usa threshold: 0 
     quita la condición del ratio.
  */

  const THRESHOLD = 0.3; //
  const ROOT_MARGIN = '-10% 0px -10% 0px';

  // Preferimos IntersectionObserver; si no existe, usamos un fallback por scroll
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
    // Fallback simple para navegadores sin IO
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
