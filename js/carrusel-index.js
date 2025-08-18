const imagenes = [
  'assets/img/webp/magazDeAbajo_2-2.webp',
  'assets/img/webp/cubicos-12.webp',
  'assets/img/webp/leon-4.webp',
  'assets/img/webp/cubicos-14.webp',
  'assets/img/webp/valtuille-3.webp',
  'assets/img/webp/cubicos-10.webp',
];

let indiceAmigos = 0;
const img = document.getElementById('carrusel-img');

// Mostrar la primera imagen (opcional si ya está en el HTML)
img.src = imagenes[indiceAmigos];

setInterval(() => {
  indiceAmigos = (indiceAmigos + 1) % imagenes.length;
  img.src = imagenes[indiceAmigos];
}, 7000);
