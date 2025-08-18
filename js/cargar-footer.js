async function cargarFooter() {
  const elemento = document.getElementById('footer');
  if (elemento) {
    try {
      const respuesta = await fetch('footer.html');
      elemento.innerHTML = await respuesta.text();
    } catch (error) {
      console.error('Error cargando footer:', error);
    }
  }
}

cargarFooter();
