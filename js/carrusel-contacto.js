// carrusel-contacto.js — cambio inmediato
const imagenes = [
  'assets/img/webp/cubicos-4.webp',
  'assets/img/webp/rodanillo-5.webp',
  'assets/img/webp/cubicos-5.webp',
  'assets/img/webp/puente-1.webp',
  'assets/img/webp/inca-2.webp',
];

const img = document.getElementById('carrusel-amigos');

// Pre-carga para evitar destellos por red
imagenes.forEach((src) => {
  const i = new Image();
  i.src = src;
});

let i = 0;
setInterval(() => {
  i = (i + 1) % imagenes.length;
  img.src = imagenes[i]; // cambio instantáneo, sin apagar/opacidad
}, 5000);
