/* global GLightbox, Choices */

// ---------------- Estado canónico (independiente del DOM) ----------------
const state = {
  fecha: 'reciente', // 'reciente' | 'antigua'
  pueblo: '',
  tipo: '',
};

// ---------------- Elementos DOM ----------------
const contenedor = document.getElementById('contenedor-proyectos');
const filtroFecha = document.getElementById('filtro-fecha');
const filtroPueblo = document.getElementById('filtro-pueblo');
const filtroTipo = document.getElementById('filtro-tipo');

let proyectos = [];

// Config opcional para fuente remota (definida en js/proyectos-config.js)
const REMOTE_CONFIG = window.PAYCAR_SUPABASE || null;

// ---------------- Helpers: fetch con rutas de respaldo ----------------
const JSON_CANDIDATES = [
  'data/proyectos.json', // relativo a la página
  '/data/proyectos.json', // desde la raíz del dominio
  '../data/proyectos.json',
  '../../data/proyectos.json',
];

async function fetchJsonWithFallback(candidates) {
  const errors = [];
  for (const url of candidates) {
    try {
      const VERSION = '2025-08-29'; // cambia en cada deploy
      const res = await fetch(url + '?v=' + VERSION, { cache: 'default' });
      if (!res.ok) {
        errors.push(`${url} -> ${res.status} ${res.statusText}`);
        continue;
      }
      try {
        const data = await res.json();
        console.info(`[proyectos] JSON cargado desde: ${url}`);
        return data;
      } catch (_) {
        const txt = await res.text();
        const cleaned = txt.replace(/^\uFEFF/, '');
        const data = JSON.parse(cleaned);
        console.info(`[proyectos] JSON (parse manual) desde: ${url}`);
        return data;
      }
    } catch (e) {
      errors.push(`${url} -> ${e.message}`);
    }
  }
  throw new Error(
    'No se pudo cargar el JSON. Intentos: \n' + errors.join('\n')
  );
}

function hasRemoteConfig() {
  return Boolean(
    REMOTE_CONFIG?.url &&
      REMOTE_CONFIG?.anonKey &&
      REMOTE_CONFIG?.tableName
  );
}

function normalizeProyecto(raw) {
  return {
    pueblo: (raw?.pueblo || '').trim(),
    tipo: (raw?.tipo || '').trim(),
    fecha: (raw?.fecha || '').trim(),
    imagenes: Array.isArray(raw?.imagenes)
      ? raw.imagenes.filter((img) => typeof img === 'string' && img.trim())
      : [],
  };
}

async function fetchRemoteProyectos() {
  if (!hasRemoteConfig()) return [];

  const base = REMOTE_CONFIG.url.replace(/\/$/, '');
  const table = encodeURIComponent(REMOTE_CONFIG.tableName);
  const query = 'select=pueblo,tipo,fecha,imagenes';
  const url = `${base}/rest/v1/${table}?${query}`;

  const res = await fetch(url, {
    headers: {
      apikey: REMOTE_CONFIG.anonKey,
      Authorization: `Bearer ${REMOTE_CONFIG.anonKey}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data
    .map(normalizeProyecto)
    .filter((p) => p.pueblo && p.tipo && p.fecha);
}

// ---------------- Utilidades de imágenes responsive ----------------
const WIDTHS = [640, 1024, 1280, 1536, 1920]; // añade 2560 si usas pantallas 4K
const THUMB_W = 640; // el tamaño más pequeño que generaste
const DIR_SEP = '/';
const EXT_RE = /\.(avif|webp|png|jpe?g)$/i;

// tamaños reales de la tarjeta en tu grid: 1col/2col/3col/4col
// (coincide con: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 en trabajos.html) :contentReference[oaicite:1]{index=1}
const SIZES_MAIN =
  '(max-width:640px) 100vw, (max-width:1024px) 50vw, (max-width:1280px) 33vw, 25vw';

// devuelve base sin extensión (y sin sufijo de tamaño si lo tuviera)
function toBase(path) {
  return path.replace(EXT_RE, '');
}

function srcset(base, ext) {
  return WIDTHS.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ');
}

function thumbSrc(base) {
  return `${base}-${THUMB_W}.webp`;
}

function largeHref(base) {
  // lo que se abre en GLightbox (buena calidad)
  return `${base}-1920.webp`;
}

function isRemoteImage(path) {
  return /^https?:\/\//i.test(path || '');
}

// ALT por defecto si no lo pasas en el JSON
function buildAlt(p) {
  // ejemplo: "Vivienda Unifamiliar en Ponferrada (08-2024)"
  const parts = [];
  if (p.tipo) parts.push(p.tipo);
  if (p.pueblo) parts.push(`en ${p.pueblo}`);
  const head = parts.join(' ');
  return head ? `${head}${p.fecha ? ` (${p.fecha})` : ''}` : 'Proyecto';
}

// ---------------- Arranque ----------------
(async function init() {
  try {
    if (hasRemoteConfig()) {
      try {
        const remotos = await fetchRemoteProyectos();
        if (remotos.length > 0) {
          proyectos = remotos;
          console.info('[proyectos] Datos cargados desde Supabase.');
        } else {
          proyectos = await fetchJsonWithFallback(JSON_CANDIDATES);
          console.info('[proyectos] Supabase sin datos, usando JSON local.');
        }
      } catch (remoteErr) {
        console.warn('[proyectos] Error remoto, usando JSON local:', remoteErr);
        proyectos = await fetchJsonWithFallback(JSON_CANDIDATES);
      }
    } else {
      proyectos = await fetchJsonWithFallback(JSON_CANDIDATES); // :contentReference[oaicite:2]{index=2}
    }

    // Rellenar opciones de filtros
    cargarOpcionesFiltro(proyectos);

    // Forzar valores por defecto en los <select> nativos
    if (filtroFecha) filtroFecha.value = state.fecha;
    if (filtroPueblo) filtroPueblo.value = state.pueblo;
    if (filtroTipo) filtroTipo.value = state.tipo;

    // Inicializar Choices (si está incluido) y decorar modo oscuro
    inicializarChoices();

    // Primer render SIN depender de los selects/Choices
    render();

    // Listeners (con o sin Choices)
    [filtroFecha, filtroPueblo, filtroTipo].forEach((el) => {
      el?.addEventListener('change', () => {
        syncStateFromControls();
        render();
      });
    });
  } catch (e) {
    console.error('Error cargando proyectos:', e);
    if (contenedor) {
      contenedor.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-red-600 dark:text-red-400 font-semibold">No se pudieron cargar los proyectos.</p>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Abre la consola para ver las rutas probadas y el error.
          </p>
        </div>`;
    }
  }
})();

// ---------------- Utilidades ----------------
function cargarOpcionesFiltro(data) {
  const pueblos = [...new Set(data.map((p) => p.pueblo))].sort();
  const tipos = [...new Set(data.map((p) => p.tipo))].sort();

  pueblos.forEach((p) => {
    const option = document.createElement('option');
    option.value = p;
    option.textContent = p;
    filtroPueblo.appendChild(option);
  });

  tipos.forEach((t) => {
    const option = document.createElement('option');
    option.value = t;
    option.textContent = t;
    filtroTipo.appendChild(option);
  });
}

function syncStateFromControls() {
  state.fecha = filtroFecha?.value || 'reciente';
  state.pueblo = filtroPueblo?.value || '';
  state.tipo = filtroTipo?.value || '';
}

function filtrarYOrdenar(data) {
  let out = [...data];

  if (state.pueblo) out = out.filter((p) => p.pueblo === state.pueblo);
  if (state.tipo) out = out.filter((p) => p.tipo === state.tipo);

  out.sort((a, b) => {
    const [ma, ya] = a.fecha.split('-').map(Number); // "mm-aaaa"
    const [mb, yb] = b.fecha.split('-').map(Number);
    const da = new Date(ya, ma - 1);
    const db = new Date(yb, mb - 1);
    return state.fecha === 'reciente' ? db - da : da - db;
  });

  return out;
}

function render() {
  if (!contenedor) return;
  contenedor.innerHTML = '';

  const filtrados = filtrarYOrdenar(proyectos);

  if (filtrados.length === 0) {
    contenedor.innerHTML = `<div class="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">No hay proyectos para mostrar.</div>`;
    return;
  }

  filtrados.forEach((proyecto, idx) => {
    // Imagen principal y thumbs desde el JSON (ej: "assets/img/webp/cubicos-12.webp") :contentReference[oaicite:3]{index=3}
    const principal =
      proyecto.imagenes?.[0] || 'multimedia/imagenes/no-image.png';
    const thumbsArr = proyecto.imagenes?.length
      ? proyecto.imagenes
      : [principal];

    const principalBase = isRemoteImage(principal) ? '' : toBase(principal);
    const alt = buildAlt(proyecto);

    // Miniaturas ligeras: usamos 320w para el <img> y enlazamos a 1920w en GLightbox
    const thumbsHtml = thumbsArr
      .map((imgPath) => {
        if (isRemoteImage(imgPath)) {
          return `
      <a href="${imgPath}" class="glightbox-${idx}" data-gallery="galeria-${idx}">
        <img
          src="${imgPath}"
          class="min-w-[4rem] w-16 h-16 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 transition"
          alt="${alt}"
          loading="lazy" decoding="async" width="64" height="64"
        >
      </a>`;
        }

        const base = toBase(imgPath); // p.ej. /assets/img/webp/cubicos-12
        return `
      <a href="${largeHref(base)}" class="glightbox-${idx}" data-gallery="galeria-${idx}">
        <img
          src="${thumbSrc(base)}"
          data-fallback-base="${base}"
          data-role="thumb"
          class="min-w-[4rem] w-16 h-16 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 transition"
          alt="${alt}"
          loading="lazy" decoding="async" width="64" height="64"
        >
      </a>`;
      })
      .join('');

        const mainImageHtml = isRemoteImage(principal)
       ? `
       <img id="main-img-${idx}"
         src="${principal}"
         class="w-full h-full object-cover transition duration-300"
         alt="${alt}"
         loading="lazy" decoding="async" fetchpriority="low"
         width="1200" height="1200">`
       : `
       <picture>
         <source type="image/avif" srcset="${srcset(principalBase, 'avif')}" sizes="${SIZES_MAIN}">
         <source type="image/webp" srcset="${srcset(principalBase, 'webp')}" sizes="${SIZES_MAIN}">
         <img id="main-img-${idx}"
           src="${principal}"
           onerror="this.onerror=null; this.src='${principalBase}-1024.webp';"
           class="w-full h-full object-cover transition duration-300"
           alt="${alt}"
           loading="lazy" decoding="async" fetchpriority="low"
           width="1200" height="1200">
       </picture>`;

    const template = `
  <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col gap-2 p-4">
    <div class="mb-2">
      <span class="block text-lg font-bold text-gray-800 dark:text-gray-100">${proyecto.pueblo}</span>
      <span class="block text-base text-orange-500 dark:text-orange-400">${proyecto.tipo}</span>
      <span class="block text-sm text-gray-500 dark:text-gray-400">${proyecto.fecha}</span>
    </div>

    <div class="relative w-full min-w-[16rem] aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
      ${mainImageHtml}
    </div>

    ${
      thumbsArr.length > 0
        ? `<div class="flex gap-2 px-2 pb-2 pt-2 overflow-x-auto">
             ${thumbsHtml}
           </div>`
        : ''
    }
  </div>`;

    contenedor.insertAdjacentHTML('beforeend', template);
  });

  // Inicializa GLightbox si está presente (tu HTML ya lo carga por CDN) :contentReference[oaicite:4]{index=4}
  setTimeout(() => {
    try {
      if (typeof GLightbox === 'function') {
        GLightbox({ selector: '[class^="glightbox-"]' });
      }
    } catch (e) {
      console.warn('GLightbox no disponible:', e);
    }
  }, 100);
}

// Inicializar Choices y forzar estilos dark con utilidades Tailwind (!important)
function inicializarChoices() {
  if (typeof Choices !== 'function') return;

  const chFecha = new Choices(filtroFecha, {
    searchEnabled: false,
    itemSelectText: '',
  });
  const chPueblo = new Choices(filtroPueblo, {
    searchEnabled: true,
    itemSelectText: '',
  });
  const chTipo = new Choices(filtroTipo, {
    searchEnabled: false,
    itemSelectText: '',
  });

  const styleChoicesBox = (box) => {
    if (!box) return;
    const inner = box.querySelector('.choices__inner');
    if (inner) {
      inner.classList.add(
        'border',
        'rounded',
        'p-2',
        '!bg-white',
        '!text-gray-900',
        '!border-gray-300',
        'dark:!bg-gray-800',
        'dark:!text-gray-200',
        'dark:!border-gray-600'
      );
    }
    const dropdown = box.querySelector('.choices__list--dropdown');
    if (dropdown) {
      dropdown.classList.add(
        '!bg-white',
        '!text-gray-900',
        '!border',
        '!border-gray-300',
        '!rounded',
        'dark:!bg-gray-800',
        'dark:!text-gray-200',
        'dark:!border-gray-600'
      );
    }
    const input = box.querySelector('.choices__input--cloned');
    if (input)
      input.classList.add(
        '!bg-white',
        '!text-gray-900',
        'dark:!bg-gray-800',
        'dark:!text-gray-200'
      );
    box
      .querySelectorAll('.choices__item')
      .forEach((el) => el.classList.add('dark:!text-gray-200'));
  };

  [filtroFecha, filtroPueblo, filtroTipo].forEach((select) => {
    const box = select?.nextElementSibling?.classList?.contains('choices')
      ? select.nextElementSibling
      : select?.parentElement?.querySelector('.choices');
    styleChoicesBox(box);
    if (box) {
      const mo = new MutationObserver(() => styleChoicesBox(box));
      mo.observe(box, { childList: true, subtree: true });
    }
  });
}
