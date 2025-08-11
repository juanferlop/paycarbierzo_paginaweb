const imagenes = [
  'multimedia/imagenes/magazDeAbajo_2-2.webp',
  'multimedia/imagenes/cubicos-12.webp',
  'multimedia/imagenes/leon-4.webp',
  'multimedia/imagenes/cubicos-14.webp',
  'multimedia/imagenes/valtuille-3.webp',
  'multimedia/imagenes/cubicos-10.webp',
];

let indiceAmigos = 0;
const img = document.getElementById('carrusel-img');

// Mostrar la primera imagen (opcional si ya está en el HTML)
img.src = imagenes[indiceAmigos];

setInterval(() => {
  indiceAmigos = (indiceAmigos + 1) % imagenes.length;
  img.src = imagenes[indiceAmigos];
}, 5000);
