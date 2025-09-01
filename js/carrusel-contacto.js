// /js/carrusel-contacto.js — carrusel con flechas + autoplay (sin bullets)
const DIR = 'assets/img/webp';
const WIDTHS = [640, 1024, 1280, 1536, 1920];

// Bases de tus fotos
const SLIDES = ['cubicos-4', 'rodanillo-5', 'cubicos-5', 'puente-1', 'inca-2'];

const $avif = document.getElementById('cc-avif');
const $webp = document.getElementById('cc-webp');
const $img = document.getElementById('cc-img');
const $prev = document.getElementById('cc-prev');
const $next = document.getElementById('cc-next');

const prefersReduced = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

let current = 0; // empezamos en el 1º (coincide con el HTML)
let timer = null;
const INTERVAL = 5000; // autoplay

const srcset = (base, ext) =>
  WIDTHS.map((w) => `${DIR}/${base}-${w}.${ext} ${w}w`).join(', ');

function applySlide(idx) {
  current = (idx + SLIDES.length) % SLIDES.length;
  const base = SLIDES[current];

  // Actualiza conjuntos responsive (el navegador elige tamaño óptimo)
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
// Pausa corta tras pulsar flechas; luego reanuda solo
function bumpAutoplay() {
  stopAutoplay();
  setTimeout(startAutoplay, 4000);
}

// Inicial
applySlide(0); // asegura que srcset quede relleno al cargar

// Flechas
$prev?.addEventListener('click', () => {
  applySlide(current - 1);
  bumpAutoplay();
});
$next?.addEventListener('click', () => {
  applySlide(current + 1);
  bumpAutoplay();
});

// Pausar si la pestaña no está visible (ahorro batería)
document.addEventListener('visibilitychange', () => {
  document.visibilityState === 'visible' ? startAutoplay() : stopAutoplay();
});

// Arranca autoplay
if (document.visibilityState === 'visible') startAutoplay();
