// carrusel-contacto.js — robusto para Pages + Cloudflare
(() => {
  // 1) rutas absolutas + versión para bustear cache
  const DIR = '/assets/img/webp'; // OJO: barra inicial (absoluta)
  const V = 'v=2025-08-30-a'; // cambia cuando subas cambios

  const WIDTHS = [640, 1024, 1280, 1536, 1920];

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

  if (!$img || !$avif || !$webp) {
    console.warn('[carrusel] faltan nodos en el HTML');
    return;
  }

  const url = (base, w, ext) => `${DIR}/${base}-${w}.${ext}?${V}`;
  const srcset = (base, ext) =>
    WIDTHS.map((w) => `${url(base, w, ext)} ${w}w`).join(', ');
  const fallbackChain = (base) => [
    url(base, 1280, 'webp'),
    `${DIR}/${base}.webp?${V}`,
    `${DIR}/${base}.jpg?${V}`,
    `${DIR}/${base}.png?${V}`,
  ];

  // Pre-carga (suave) de una URL
  const preload = (u) => {
    const i = new Image();
    i.src = u;
    return i.decode?.().catch(() => {}) || Promise.resolve();
  };

  // Si falla una imagen, intentamos otras rutas
  function attachErrorFallback(imgEl, base) {
    const tries = fallbackChain(base);
    let i = 0;
    imgEl.addEventListener('error', () => {
      if (i < tries.length) {
        imgEl.src = tries[i++];
      }
    });
  }

  let idx = 0;
  let timer = null;
  const INTERVAL = 5000;

  function applySlide(i) {
    const s = SLIDES[i % SLIDES.length];

    // srcset AVIF/WebP (el navegador elige el tamaño óptimo)
    $avif.setAttribute('srcset', srcset(s.base, 'avif'));
    $webp.setAttribute('srcset', srcset(s.base, 'webp'));

    // Fallback del <img> (para navegadores sin AVIF/WebP)
    $img.src = url(s.base, 1280, 'webp');

    // alt/caption
    if (s.alt) $img.alt = s.alt;
    if ($cap && s.cap) $cap.textContent = s.cap;

    // fallback en cadena si falta el archivo
    attachErrorFallback($img, s.base);
  }

  async function next() {
    $img.classList.add('opacity-0');

    const nextIdx = (idx + 1) % SLIDES.length;
    await preload(url(SLIDES[nextIdx].base, 1280, 'webp'));

    idx = nextIdx;
    applySlide(idx);

    requestAnimationFrame(() => $img.classList.remove('opacity-0'));

    const afterIdx = (idx + 1) % SLIDES.length;
    preload(url(SLIDES[afterIdx].base, 1280, 'webp'));
  }

  function start() {
    if (!timer) timer = setInterval(next, INTERVAL);
  }
  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  // 2) Arranca SIEMPRE, y luego pausa con IntersectionObserver
  start();
  if ('IntersectionObserver' in window && $wrap) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        visible ? start() : stop();
      },
      { threshold: 0.2 }
    );
    io.observe($wrap);
  }

  // 3) Primer slide ya con versionado
  applySlide(idx);

  console.info('[carrusel] versión', V);
})();
