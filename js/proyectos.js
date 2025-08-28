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
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        errors.push(`${url} -> ${res.status} ${res.statusText}`);
        continue;
      }
      // Intento directo:
      try {
        const data = await res.json();
        console.info(`[proyectos] JSON cargado desde: ${url}`);
        return data;
      } catch (_) {
        // Si el JSON tiene BOM u otros, reintento manual:
        const txt = await res.text();
        const cleaned = txt.replace(/^\uFEFF/, ''); // quita BOM si hay
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

// ---------------- Arranque ----------------
(async function init() {
  try {
    proyectos = await fetchJsonWithFallback(JSON_CANDIDATES);

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
    const principal =
      proyecto.imagenes?.[0] || 'multimedia/imagenes/no-image.png';
    const thumbs = proyecto.imagenes?.length ? proyecto.imagenes : [principal];

    const thumbsHtml = thumbs
      .map(
        (img) => `
  <a href="${img}" class="glightbox-${idx}" data-gallery="galeria-${idx}">
    <img src="${img}" class="min-w-[4rem] w-16 h-16 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 transition" alt="">
  </a>
`
      )
      .join('');

    const template = `
  <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col gap-2 p-4">
    <div class="mb-2">
      <span class="block text-lg font-bold text-gray-800 dark:text-gray-100">${proyecto.pueblo}</span>
      <span class="block text-base text-orange-500 dark:text-orange-400">${proyecto.tipo}</span>
      <span class="block text-sm text-gray-500 dark:text-gray-400">${proyecto.fecha}</span>
    </div>
    <div class="relative w-full min-w-[16rem] h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
      <img id="main-img-${idx}" src="${principal}" class="object-cover w-full h-full max-w-full max-h-full transition duration-300" alt="">
    </div>
    ${
      thumbs.length > 0
        ? `
    <div class="flex gap-2 px-2 pb-2 pt-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-700">
      ${thumbsHtml}
    </div>
    `
        : ''
    }
  </div>
`;

    contenedor.insertAdjacentHTML('beforeend', template);
  });

  /* Inicializo GLightBox para cada galería */
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

  // Aplica clases a un contenedor .choices concreto
  const styleChoicesBox = (box) => {
    if (!box) return;

    // Caja visible del select
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

    // Dropdown de opciones
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

    // Input clonado (buscador) — solo existe en el de pueblos
    const input = box.querySelector('.choices__input--cloned');
    if (input) {
      input.classList.add(
        '!bg-white',
        '!text-gray-900',
        'dark:!bg-gray-800',
        'dark:!text-gray-200'
      );
    }

    // Ítems ya renderizados (seleccionado/placeholder y opciones abiertas)
    box.querySelectorAll('.choices__item').forEach((el) => {
      el.classList.add('dark:!text-gray-200');
    });
  };

  // Estiliza los tres selects
  [filtroFecha, filtroPueblo, filtroTipo].forEach((select) => {
    const box = select?.nextElementSibling?.classList?.contains('choices')
      ? select.nextElementSibling
      : select?.parentElement?.querySelector('.choices');
    styleChoicesBox(box);

    // Reaplica estilos cuando Choices inserte nodos nuevos (abrir dropdown, buscar, etc.)
    if (box) {
      const mo = new MutationObserver(() => styleChoicesBox(box));
      mo.observe(box, { childList: true, subtree: true });
    }
  });
}
