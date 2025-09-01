// /js/carrusel-index.js (compat + robusto)
(function () {
  var DIR = 'assets/img/webp'; // relativo para GH Pages si hace falta
  var WIDTHS = [640, 1024, 1280, 1536, 1920, 2560];
  var SLIDES = [
    'magazDeAbajo_2-2',
    'cubicos-12',
    'leon-4',
    'cubicos-14',
    'valtuille-3',
    'cubicos-10',
  ];

  var $avif = document.getElementById('carrusel-avif');
  var $webp = document.getElementById('carrusel-webp');
  var $img = document.getElementById('carrusel-img');
  var $prev = document.getElementById('prev-slide');
  var $next = document.getElementById('next-slide');

  // si falta algo esencial, no seguimos (evita errores en páginas sin carrusel)
  if (!$img || (!$avif && !$webp)) return;

  var prefersReduced = false;
  try {
    prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
  } catch (e) {}

  var current = 0;
  var timer = null;
  var INTERVAL = 7000;

  function srcset(base, ext) {
    return WIDTHS.map(function (w) {
      return DIR + '/' + base + '-' + w + '.' + ext + ' ' + w + 'w';
    }).join(', ');
  }

  function applySlide(idx) {
    current = (idx + SLIDES.length) % SLIDES.length;
    var base = SLIDES[current];

    if ($avif) $avif.setAttribute('srcset', srcset(base, 'avif'));
    if ($webp) $webp.setAttribute('srcset', srcset(base, 'webp'));
    if ($img) $img.src = DIR + '/' + base + '-1280.webp';

    // Prefetch del siguiente (variante media)
    var next = SLIDES[(current + 1) % SLIDES.length];
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = DIR + '/' + next + '-1280.webp';
    document.head.appendChild(link);
  }

  function startAutoplay() {
    if (prefersReduced || timer) return;
    timer = setInterval(function () {
      applySlide(current + 1);
    }, INTERVAL);
  }
  function stopAutoplay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  function bumpAutoplay() {
    stopAutoplay();
    setTimeout(startAutoplay, 4000);
  }

  if ($prev)
    $prev.addEventListener('click', function () {
      applySlide(current - 1);
      bumpAutoplay();
    });
  if ($next)
    $next.addEventListener('click', function () {
      applySlide(current + 1);
      bumpAutoplay();
    });

  document.addEventListener('visibilitychange', function () {
    document.visibilityState === 'visible' ? startAutoplay() : stopAutoplay();
  });

  // arranque seguro (por si 'defer' no se respeta en algún builder)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.visibilityState === 'visible') startAutoplay();
    });
  } else {
    if (document.visibilityState === 'visible') startAutoplay();
  }
})();
