const imagenes = [
  'assets/img/webp/cubicos-4.webp',
  'assets/img/webp/rodanillo-5.webp',
  'assets/img/webp/cubicos-5.webp',
  'assets/img/webp/puente-1.webp',
  'assets/img/webp/inca-2.webp',
];

let indiceAmigos = 0;
const img = document.getElementById('carrusel-amigos');

setInterval(() => {
  img.style.opacity = 0;
  setTimeout(() => {
    indiceAmigos = (indiceAmigos + 1) % imagenes.length;
    img.src = imagenes[indiceAmigos];
    img.style.opacity = 1;
  }, 300);
}, 5000);
