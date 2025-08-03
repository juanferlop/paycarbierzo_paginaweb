
const imagenes = [
  'multimedia/imagenes/magazDeAbajo_2-2.jpg',
  'multimedia/imagenes/cubicos-12.jpeg',
  'multimedia/imagenes/leon-4.jpeg',
  'multimedia/imagenes/cubicos-14.jpeg',
  'multimedia/imagenes/valtuille-3.jpg',
  'multimedia/imagenes/cubicos-10.jpeg',

];

let indiceAmigos = 0;
const img = document.getElementById('carrusel-img');

// Mostrar la primera imagen (opcional si ya está en el HTML)
img.src = imagenes[indiceAmigos];

setInterval(() => {
  indiceAmigos = (indiceAmigos + 1) % imagenes.length;
  img.src = imagenes[indiceAmigos];
}, 5000);
