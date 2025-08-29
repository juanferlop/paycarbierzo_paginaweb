// Cambia de foto y actualiza los srcset para que el navegador elija el mejor tamaño.

const DIR = 'assets/img/webp';
const WIDTHS = [640, 1024, 1280, 1536, 1920, 2560];

// Lista de "bases" (sin extensión ni sufijo de ancho)
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

  // Fallback razonable (por si el navegador no soporta AVIF/WEBP)
  $img.src = `${DIR}/${base}-1280.webp`;
}

// Inicial
let i = 0;
setSlide(i);

// Rotación cada 7s
setInterval(() => {
  i = (i + 1) % SLIDES.length;
  setSlide(i);
}, 7000);
