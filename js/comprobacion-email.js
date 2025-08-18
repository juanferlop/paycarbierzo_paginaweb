(function () {
  const user = 'carlosfernandez_pyc';
  const domain = 'hotmail.com';
  const correo = `${user}@${domain}`;

  const enlace = document.getElementById('correo-enlace');
  const texto = document.getElementById('correo-texto');

  if (enlace && texto) {
    enlace.href = `mailto:${correo}`;
    texto.textContent = correo;
  }
})();
