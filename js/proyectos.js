/* global GLightbox, Choices */

const contenedor = document.getElementById('contenedor-proyectos');
const filtroFecha = document.getElementById('filtro-fecha');
const filtroPueblo = document.getElementById('filtro-pueblo');
const filtroTipo = document.getElementById('filtro-tipo');

let proyectos = [];

fetch('proyectos.json')
  .then((res) => res.json())
  .then((data) => {
    proyectos = data;
    cargarOpcionesFiltro(data);
    inicializarChoices();
    mostrarProyectos();
  });

// Cargar opciones únicas en los selectores
function cargarOpcionesFiltro(data) {
  // Pueblos y tipos de obra serán ordenados alfabéticamente.
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

// Mostrar proyectos filtrados
function mostrarProyectos() {
  contenedor.innerHTML = '';

  let filtrados = [...proyectos];

  // Aplicar filtros
  if (filtroPueblo.value) {
    filtrados = filtrados.filter((p) => p.pueblo === filtroPueblo.value);
  }
  if (filtroTipo.value) {
    filtrados = filtrados.filter((p) => p.tipo === filtroTipo.value);
  }

  // Ordenar por fecha
  filtrados.sort((a, b) => {
    const [ma, ya] = a.fecha.split('-').map(Number);
    const [mb, yb] = b.fecha.split('-').map(Number);
    const da = new Date(ya, ma - 1);
    const db = new Date(yb, mb - 1);
    return filtroFecha.value === 'reciente' ? db - da : da - db;
  });

  // Si no hay resultados
  if (filtrados.length === 0) {
    contenedor.innerHTML = `<div class="col-span-full text-center text-gray-500 py-12">No hay proyectos para mostrar.</div>`;
    return;
  }

  // Mostrar cada tarjeta
  filtrados.forEach((proyecto, idx) => {
    const principal =
      proyecto.imagenes[0] || 'multimedia/imagenes/no-image.png';
    const thumbs = proyecto.imagenes.length ? proyecto.imagenes : [principal];

    const thumbsHtml = thumbs
      .map(
        (img) => `
      <a href="${img}" class="glightbox-${idx}" data-gallery="galeria-${idx}">
        <img src="${img}" class="min-w-[4rem] w-16 h-16 object-cover rounded-lg border-2 border-gray-200 hover:border-orange-500 transition" alt="">
      </a>
    `
      )
      .join('');

    const template = `
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col gap-2 p-4">
        <div class="mb-2">
          <span class="block text-lg font-bold text-gray-800">${proyecto.pueblo}</span>
          <span class="block text-base text-orange-500">${proyecto.tipo}</span>
          <span class="block text-sm text-gray-500">${proyecto.fecha}</span>
        </div>
        <div class="relative w-full min-w-[16rem] h-64 flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden">
          <img id="main-img-${idx}" src="${principal}" class="object-cover w-full h-full max-w-full max-h-full transition duration-300" alt="">   
        </div>
        ${
          thumbs.length > 0
            ? `
        <div class="flex gap-2 px-2 pb-2 pt-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
          ${thumbsHtml}
        </div>

        `
            : ''
        }
      </div>
    `;
    contenedor.innerHTML += template;
  });

  /* Inicializo GLightBox para cada galería */
  setTimeout(() => {
    GLightbox({ selector: '[class^="glightbox-"]' });
  }, 100); // espera breve para asegurar que el DOM esté listo
}

// Eventos para actualizar al cambiar filtros
filtroFecha.addEventListener('change', mostrarProyectos);
filtroPueblo.addEventListener('change', mostrarProyectos);
filtroTipo.addEventListener('change', mostrarProyectos);

// Inicializar Choices.js
function inicializarChoices() {
  new Choices(filtroFecha, { searchEnabled: false, itemSelectText: '' });
  new Choices(filtroPueblo, { searchEnabled: true, itemSelectText: '' });
  new Choices(filtroTipo, { searchEnabled: false, itemSelectText: '' });
}
