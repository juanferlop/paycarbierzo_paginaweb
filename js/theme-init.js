(function () {
  const storageKey = 'theme';
  const userPref = localStorage.getItem(storageKey);
  const systemPrefersDark = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches;
  const useDark = userPref ? userPref === 'dark' : systemPrefersDark;
  document.documentElement.classList.toggle('dark', useDark);
})();
