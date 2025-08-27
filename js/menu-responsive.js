// (function () {
//   const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

//   function wireMenu(root = document) {
//     const scope = root.querySelector ? root : document;

//     const btn = scope.querySelector('#menu-btn');
//     const menu = scope.querySelector('#menu');
//     const servicesMenu = scope.querySelector('.services-menu');
//     const servicesLink = servicesMenu ? servicesMenu.querySelector('a') : null;
//     const servicesDrop = servicesMenu
//       ? servicesMenu.querySelector('.services-dropdown')
//       : null;

//     if (!btn || !menu) return false;

//     // Evita duplicados si reinyectas el header
//     if (btn.dataset.wired === '1') return true;
//     btn.dataset.wired = '1';

//     const openMenu = () => {
//       menu.classList.remove('hidden');
//       if (isMobile()) menu.classList.add('mobile-open'); // <-- clave con tu CSS
//       btn.setAttribute('aria-expanded', 'true');
//     };

//     const closeMenu = () => {
//       if (isMobile()) menu.classList.remove('mobile-open');
//       menu.classList.add('hidden');
//       btn.setAttribute('aria-expanded', 'false');
//     };

//     const toggleMenu = () => {
//       const willOpen = menu.classList.contains('hidden');
//       willOpen ? openMenu() : closeMenu();
//     };

//     // Botón hamburguesa
//     btn.addEventListener('click', toggleMenu);

//     // Cerrar al hacer click en un enlace (en móvil)
//     menu.addEventListener('click', (e) => {
//       const a = e.target.closest('a');
//       if (!a) return;
//       if (isMobile() && !menu.classList.contains('hidden')) {
//         closeMenu();
//       }
//     });

//     // Cerrar con Escape
//     document.addEventListener('keydown', (e) => {
//       if (e.key === 'Escape') closeMenu();
//     });

//     // Submenú "Servicios": en móvil se abre por click (tu CSS usa .mobile-open)
//     if (servicesLink && servicesDrop) {
//       servicesLink.addEventListener('click', (e) => {
//         if (!isMobile()) return; // en desktop abre por :hover (CSS)
//         e.preventDefault();
//         servicesDrop.classList.toggle('mobile-open');
//       });

//       // Cerrar el dropdown al clicar fuera (solo móvil)
//       document.addEventListener('click', (e) => {
//         if (!isMobile()) return;
//         if (e.target.closest('.services-menu')) return;
//         servicesDrop.classList.remove('mobile-open');
//       });
//     }

//     // Limpieza al pasar a escritorio
//     window.addEventListener('resize', () => {
//       if (!isMobile()) {
//         menu.classList.remove('mobile-open'); // evita que se quede con max-height
//         servicesDrop && servicesDrop.classList.remove('mobile-open');
//         btn.setAttribute('aria-expanded', 'false');
//       }
//     });

//     return true;
//   }

//   // 1) Intento inmediato (por si el header ya está puesto)
//   if (wireMenu(document)) return;

//   // 2) Observa el contenedor hasta que cargar-header inyecte el header
//   const host = document.getElementById('header') || document.body;
//   const obs = new MutationObserver(() => {
//     if (wireMenu(host)) obs.disconnect();
//   });
//   obs.observe(host, { childList: true, subtree: true });

//   // 3) Fallback DOMContentLoaded
//   document.addEventListener('DOMContentLoaded', () => wireMenu(document));
// })();

// /js/menu-responsive.js
(function () {
  // Debe coincidir con tu CSS: @media (max-width: 767px)
  const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

  function wire(root = document) {
    const scope = root.querySelector ? root : document;

    const btn = scope.querySelector('#menu-btn');
    const menu = scope.querySelector('#menu');

    // Estructura "Servicios" de tu header:
    // <div class="services-menu">
    //   <a href="#">Servicios</a>
    //   <div class="services-dropdown">...</div>
    // </div>
    const servicesMenu = scope.querySelector('.services-menu');
    const servicesLink = servicesMenu
      ? servicesMenu.querySelector('a,button,[data-services-toggle]')
      : null;
    const servicesDrop = servicesMenu
      ? servicesMenu.querySelector('.services-dropdown')
      : null;

    if (!btn || !menu) return false;

    // Evita duplicar listeners si el header se reinyecta
    if (btn.dataset.wired === '1') return true;
    btn.dataset.wired = '1';

    // ----- MENÚ HAMBURGUESA -----
    const openMenu = () => {
      menu.classList.remove('hidden');
      if (isMobile()) menu.classList.add('mobile-open'); // tu CSS anima con max-height
      btn.setAttribute('aria-expanded', 'true');
    };

    const closeMenu = () => {
      if (isMobile()) menu.classList.remove('mobile-open');
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
      // cierra también submenú móvil si estuviera abierto
      if (servicesDrop) servicesDrop.classList.remove('mobile-open');
    };

    btn.addEventListener('click', () => {
      const willOpen = menu.classList.contains('hidden');
      willOpen ? openMenu() : closeMenu();
    });

    // Cierra al hacer click en un enlace del menú (solo móvil)...
    // ...PERO IGNORA el click sobre el "toggle" de Servicios.
    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      // si el click fue dentro del bloque .services-menu, NO cierres aquí
      if (isMobile() && servicesMenu && servicesMenu.contains(a)) return;
      if (isMobile() && !menu.classList.contains('hidden')) {
        closeMenu();
      }
    });

    // Cierra con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    // ----- SUBMENÚ "SERVICIOS" (solo móvil por click) -----
    if (servicesLink && servicesDrop) {
      servicesLink.addEventListener('click', (e) => {
        if (!isMobile()) return; // en escritorio abre por :hover (CSS)
        e.preventDefault(); // no navegar a "#"
        e.stopPropagation(); // que no salte el handler del <nav>
        servicesDrop.classList.toggle('mobile-open'); // tu CSS lo muestra/oculta
      });

      // Cerrar el dropdown al clicar fuera (solo móvil)
      document.addEventListener('click', (e) => {
        if (!isMobile()) return;
        if (servicesMenu && servicesMenu.contains(e.target)) return;
        servicesDrop.classList.remove('mobile-open');
      });
    }

    // Limpieza al pasar a escritorio
    window.addEventListener('resize', () => {
      if (!isMobile()) {
        menu.classList.remove('mobile-open');
        servicesDrop && servicesDrop.classList.remove('mobile-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    return true;
  }

  // 1) Intenta cablear ya (por si el header ya está en el DOM)
  if (wire(document)) return;

  // 2) Observa el contenedor hasta que cargar-header inyecte el header
  const host = document.getElementById('header') || document.body;
  const obs = new MutationObserver(() => {
    if (wire(host)) obs.disconnect();
  });
  obs.observe(host, { childList: true, subtree: true });

  // 3) Fallback cuando el DOM está listo
  document.addEventListener('DOMContentLoaded', () => wire(document));
})();
