// carrusel-contacto.js (responsive + fade + pausa fuera de viewport)
(() => {
  const DIR = 'assets/img/webp';
  const WIDTHS = [640, 1024, 1280, 1536, 1920];

  // Slides con texto (SEO/a11y)
  const SLIDES = [
    {
      base: 'cubicos-4',
      alt: 'Obra de encofrado y estructura de hormigón',
      cap: 'Estructura reciente de hormigón.',
    },
    {
      base: 'rodanillo-5',
      alt: 'Armado y encofrado en Rodanillo (El Bierzo)',
      cap: 'Armado y encofrado en Rodanillo.',
    },
    {
      base: 'cubicos-5',
      alt: 'Puntales y forjado en obra',
      cap: 'Ejecución de forjado con puntales.',
    },
    {
      base: 'puente-1',
      alt: 'Trabajo de estructura cercano a zona de puente',
      cap: 'Obra con maquinaria para estructura.',
    },
    {
      base: 'inca-2',
      alt: 'Vertido y vibrado del hormigón en losa',
      cap: 'Vertido de hormigón en losa.',
    },
  ];

  const $avif = document.getElementById('cc-avif');
  const $webp = document.getElementById('cc-webp');
  const $img = document.getElementById('cc-img');
  const $cap = document.getElementById('cc-caption');
  const $wrap = document.getElementById('cc-picture');

  const srcset = (base, ext) =>
    WIDTHS.map((w) => `${DIR}/${base}-${w}.${ext} ${w}w`).join(', ');

  // precarga ligera (solo la siguiente)
  const preload = (url) => {
    const i = new Image();
    i.src = url;
    return i.decode?.().catch(() => {}) || Promise.resolve();
  };

  let idx = 0;
  let timer = null;
  const INTERVAL = 5000;

  function applySlide(i) {
    const s = SLIDES[i % SLIDES.length];

    // construir srcset para que el navegador elija el tamaño óptimo
    $avif.setAttribute('srcset', srcset(s.base, 'avif'));
    $webp.setAttribute('srcset', srcset(s.base, 'webp'));

    // actualizar alt/caption
    if (s.alt) $img.alt = s.alt;
    if ($cap && s.cap) $cap.textContent = s.cap;

    // fallback para navegadores sin AVIF/WebP
    $img.src = `${DIR}/${s.base}-1280.webp`;
  }

  async function next() {
    // fade-out
    $img.classList.add('opacity-0');

    // siguiente índice y precarga
    const nextIdx = (idx + 1) % SLIDES.length;
    const nextBase = SLIDES[nextIdx].base;
    const nextFallback = `${DIR}/${nextBase}-1280.webp`;
    await preload(nextFallback);

    // aplicar slide y fade-in
    idx = nextIdx;
    applySlide(idx);
    requestAnimationFrame(() => {
      // una vez actualizado el DOM, quitamos el fade
      $img.classList.remove('opacity-0');
    });

    // precarga de la siguiente siguiente (suave, no bloqueante)
    const afterIdx = (idx + 1) % SLIDES.length;
    preload(`${DIR}/${SLIDES[afterIdx].base}-1280.webp`);
  }

  function start() {
    if (timer) return;
    timer = setInterval(next, INTERVAL);
  }

  function stop() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  }

  // Pausa si no está en viewport (ahorra CPU/batería)
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        visible ? start() : stop();
      },
      { threshold: 0.2 }
    );
    io.observe($wrap);
  } else {
    start();
  }

  // Primer slide
  applySlide(idx);
})();
