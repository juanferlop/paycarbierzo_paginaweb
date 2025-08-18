document.addEventListener('DOMContentLoaded', () => {
  const timeElement = document.getElementById('ultima-actualizacion');
  if (!timeElement) return;

  const hoy = new Date();

  // Atributo datetime en formato ISO (2025-08-18)
  timeElement.dateTime = hoy.toISOString().split('T')[0];

  // Texto visible en formato dd/mm/yyyy
  timeElement.textContent =
    hoy.getDate().toString().padStart(2, '0') +
    '/' +
    (hoy.getMonth() + 1).toString().padStart(2, '0') +
    '/' +
    hoy.getFullYear();
});
