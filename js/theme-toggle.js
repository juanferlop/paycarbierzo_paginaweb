(function () {
  const storageKey = 'theme';
  const html = document.documentElement;

  function setIcon(btn, icon) {
    const isDark = html.classList.contains('dark');
    icon.innerHTML = isDark
      ? `
        <!-- Sol más realista -->
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      ` // ☀️
      : `
        <!-- Luna -->
        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z"/>
      `;
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  }

  function init() {
    const btn = document.getElementById('theme-toggle');
    const icon = document.getElementById('theme-icon');
    if (!btn || !icon) return;

    setIcon(btn, icon);

    btn.addEventListener('click', () => {
      const nextDark = !html.classList.contains('dark');
      html.classList.toggle('dark', nextDark);
      localStorage.setItem(storageKey, nextDark ? 'dark' : 'light');
      setIcon(btn, icon);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
