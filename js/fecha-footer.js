(function ensureYear() {
  const setYear = () => {
    const el = document.getElementById('anio-actual');
    if (el) {
      el.textContent = new Date().getFullYear();
      return true;
    }
    return false;
  };

  if (setYear()) return;

  const obs = new MutationObserver(() => {
    if (setYear()) obs.disconnect();
  });

  obs.observe(document.getElementById('footer') || document.body, {
    childList: true,
    subtree: true,
  });
})();
