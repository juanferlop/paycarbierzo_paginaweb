const imagenes = [
  "multimedia/imagenes/img1.jpeg",
  "multimedia/imagenes/img2.jpeg",
  "multimedia/imagenes/img3.jpeg",
];

let indice = 0;
const imgTag = document.getElementById('carrusel-img');

setInterval(() => {
  indice = (indice + 1) % imagenes.length;
  imgTag.src = imagenes[indice];
}, 3000); // Cambia cada 3 segundos
