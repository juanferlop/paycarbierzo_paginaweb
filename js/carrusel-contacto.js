// carrusel-contacto.js — igual de simple que el carrusel de portada
// (solo actualiza srcset + fallback)
// Requiere que existan las variantes -640/-1024/-1280/-1536/-1920.(avif|webp)

const DIR = 'assets/img/webp';
const WIDTHS = [640, 1024, 1280, 1536, 1920];

// Bases de tus fotos (sin extensión ni sufijo de tamaño)
const SLIDES = ['cubicos-4', 'rodanillo-5', 'cubicos-5', 'puente-1', 'inca-2'];

const $avif = document.getElementById('cc-avif');
const $webp = document.getElementById('cc-webp');
const $img = document.getElementById('cc-img');

function srcset(base, ext) {
  return WIDTHS.map((w) => `${DIR}/${base}-${w}.${ext} ${w}w`).join(', ');
}

function setSlide(idx) {
  const base = SLIDES[idx % SLIDES.length];

  // Actualiza conjuntos responsive (el navegador elige el tamaño óptimo)
  $avif.setAttribute('srcset', srcset(base, 'avif'));
  $webp.setAttribute('srcset', srcset(base, 'webp'));

  // Fallback razonable (si el navegador no soporta AVIF/WebP)
  $img.src = `${DIR}/${base}-1280.webp`;
}

// Inicial
let i = 0;
setSlide(i);

// Rotación cada 5 s (ajusta si quieres)
setInterval(() => {
  i = (i + 1) % SLIDES.length;
  setSlide(i);
}, 5000);
