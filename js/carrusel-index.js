// /js/carrusel-index.js
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
const $prev = document.getElementById('prev-slide');
const $next = document.getElementById('next-slide');

const prefersReduced = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

let current = 0; // ya se muestra SLIDES[0] en el HTML
let timer = null;
const INTERVAL = 7000; // autoplay

const srcset = (base, ext) =>
  WIDTHS.map((w) => `${DIR}/${base}-${w}.${ext} ${w}w`).join(', ');

function applySlide(idx) {
  current = (idx + SLIDES.length) % SLIDES.length;
  const base = SLIDES[current];

  // Actualiza sources responsive
  $avif?.setAttribute('srcset', srcset(base, 'avif'));
  $webp?.setAttribute('srcset', srcset(base, 'webp'));
  // Fallback razonable
  if ($img) $img.src = `${DIR}/${base}-1280.webp`;

  // Prefetch del siguiente (variante media)
  const next = SLIDES[(current + 1) % SLIDES.length];
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'image';
  link.href = `${DIR}/${next}-1280.webp`;
  document.head.appendChild(link);
}

function startAutoplay() {
  if (prefersReduced || timer) return;
  timer = setInterval(() => applySlide(current + 1), INTERVAL);
}
function stopAutoplay() {
  clearInterval(timer);
  timer = null;
}
function bumpAutoplay() {
  stopAutoplay();
  setTimeout(startAutoplay, 4000); // pequeña pausa tras interacción
}

// Eventos flechas
$prev?.addEventListener('click', () => {
  applySlide(current - 1);
  bumpAutoplay();
});
$next?.addEventListener('click', () => {
  applySlide(current + 1);
  bumpAutoplay();
});

// Pausar si la pestaña no está visible
document.addEventListener('visibilitychange', () => {
  document.visibilityState === 'visible' ? startAutoplay() : stopAutoplay();
});

// Arrancar
if (document.visibilityState === 'visible') startAutoplay();
