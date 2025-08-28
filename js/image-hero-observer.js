// Móvil: muestra el overlay cuando la imagen entra en viewport.
// Desktop: ya funciona con :hover de Tailwind.
document.addEventListener('DOMContentLoaded', () => {
  const isTouch = () =>
    'ontouchstart' in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    window.matchMedia('(any-hover: none)').matches ||
    window.matchMedia('(any-pointer: coarse)').matches;

  const sections = document.querySelectorAll('[data-image-hero]');

  if (!sections.length || !isTouch()) return; // Solo móvil/tablet

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const overlay = entry.target.querySelector('[data-image-overlay]');
        if (!overlay) return;

        if (entry.isIntersecting) {
          overlay.classList.add('opacity-100', 'pointer-events-auto');
          overlay.classList.remove('opacity-0', 'pointer-events-none');
        } else {
          overlay.classList.remove('opacity-100', 'pointer-events-auto');
          overlay.classList.add('opacity-0', 'pointer-events-none');
        }
      });
    },
    { threshold: 0.4 } // aparece cuando ~40% de la sección es visible
  );

  sections.forEach((sec) => observer.observe(sec));
});
