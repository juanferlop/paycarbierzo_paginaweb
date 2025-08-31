// /js/carrusel-responsive.js
const DIR = '/assets/img/webp';
const WIDTHS = [640, 1024, 1280, 1536, 1920, 2560];

// Orden de slides (el 1º ya está en el HTML)
const SLIDES = [
  'magazDeAbajo_2-2',
  'cubicos-12',
  'leon-4',
  'cubicos-14',
  'valtuille-3',
  'cubicos-10',
];

const $avif = document.getElementById('carrusel-avif');
const $webp = document.getElementById('carrusel-webp');
const $img = document.getElementById('carrusel-img');

function srcset(base, ext) {
  return WIDTHS.map((w) => `${DIR}/${base}-${w}.${ext} ${w}w`).join(', ');
}

function setSlide(idx) {
  const base = SLIDES[idx % SLIDES.length];
  // Actualiza conjuntos responsive
  $avif.setAttribute('srcset', srcset(base, 'avif'));
  $webp.setAttribute('srcset', srcset(base, 'webp'));
  // Fallback razonable
  $img.src = `${DIR}/${base}-1280.webp`;

  // Prefetch del siguiente slide (variante media)
  const next = SLIDES[(idx + 1) % SLIDES.length];
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'image';
  link.href = `${DIR}/${next}-1280.webp`;
  document.head.appendChild(link);
}

// Ergonomía: no marear a quien lo ha pedido y pausar en segundo plano
const prefersReduced = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
let i = 1; // ya hemos “mostrado” el 0º en el HTML
let timer = null;

function start() {
  if (prefersReduced) return; // no rotar
  if (timer) return; // ya está
  timer = setInterval(() => setSlide(i++), 7000);
}
function stop() {
  clearInterval(timer);
  timer = null;
}

// Arrancar cuando esté visible
document.addEventListener('visibilitychange', () => {
  document.visibilityState === 'visible' ? start() : stop();
});

// Inicia cuando el DOM esté listo
if (document.visibilityState === 'visible') {
  start();
}
