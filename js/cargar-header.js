async function cargarHeader() {
  const elemento = document.getElementById('header');
  if (elemento) {
    try {
      const respuesta = await fetch('/header.html');
      elemento.innerHTML = await respuesta.text();
    } catch (error) {
      console.error('Error cargando header:', error);
    }
  }
}

cargarHeader();
