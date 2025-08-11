const imagenes = [
  'multimedia/imagenes/cubicos-14.webp',
  'multimedia/imagenes/rodanillo-5.webp',
  'multimedia/imagenes/cubicos-5.webp',
  'multimedia/imagenes/puente-1.webp',
  'multimedia/imagenes/inca-2.webp',
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
