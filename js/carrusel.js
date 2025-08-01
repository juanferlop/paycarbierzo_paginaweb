// Carrusel 1: imágenes en index.html

const imagenes = [
  "multimedia/imagenes/img4.jpeg",
  "multimedia/imagenes/panoramica-cubicos-4.jpeg",
  "multimedia/imagenes/panoramica-cubicos.jpeg",
  
];

let indice = 0;
const imgTag = document.getElementById('carrusel-img');

setInterval(() => {
  indice = (indice + 1) % imagenes.length;
  imgTag.src = imagenes[indice];
}, 3000); // Cambia cada 3 segundos

// Carrusel 2: imágenes en contacto
const imagenesAmigos = [
  "multimedia/imagenes/panoramica-cubicos-4.jpeg",
  "multimedia/imagenes/obra-random.jpeg",
  "multimedia/imagenes/panoramica-cubicos-3.jpeg",
];

let indiceAmigos = 0;
const imgAmigos = document.getElementById('carrusel-amigos');

setInterval(() => {
  imgAmigos.style.opacity = 0;
  setTimeout(() => {
    indiceAmigos = (indiceAmigos + 1) % imagenesAmigos.length;
    imgAmigos.src = imagenesAmigos[indiceAmigos];
    imgAmigos.style.opacity = 1;
  }, 300);
}, 5000);
