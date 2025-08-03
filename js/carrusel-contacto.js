const imagenes = [
  'multimedia/imagenes/cubicos-14.jpeg',
  'multimedia/imagenes/rodanillo-5.jpeg',
  'multimedia/imagenes/cubicos-5.jpeg',
  'multimedia/imagenes/puente-1.jpeg',
  'multimedia/imagenes/inca-2.jpg',
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
