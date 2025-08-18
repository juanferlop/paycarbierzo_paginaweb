// js/toc.js
document.addEventListener('DOMContentLoaded', () => {
  const content = document.querySelector('#content');
  const toc = document.querySelector('#toc');
  if (!content || !toc) return;

  // 1) Recoger encabezados H2/H3
  const headings = [...content.querySelectorAll('h2, h3')];
  if (!headings.length) return;

  // 2) Crear IDs "slug" únicos para cada heading
  const used = new Set();
  const slugify = (str) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  headings.forEach((h) => {
    if (!h.id) {
      let base = slugify(h.textContent || 'seccion');
      let id = base || 'seccion';
      let i = 2;
      while (used.has(id)) id = `${base}-${i++}`;
      used.add(id);
      h.id = id;
    }
  });

  // 3) Construir TOC (H2 como principal, H3 como subitems)
  const list = document.createElement('ol');
  list.className = 'space-y-2';

  headings.forEach((h) => {
    const level = h.tagName.toLowerCase() === 'h2' ? 2 : 3;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${h.id}`;
    a.textContent = (h.textContent || '').trim();
    a.className = 'block hover:text-orange-500 transition';
    if (level === 3) a.className += ' pl-4 text-[0.95rem]';
    li.appendChild(a);
    list.appendChild(li);
  });

  toc.appendChild(list);

  // 4) Resaltar activo con IntersectionObserver
  const links = [...toc.querySelectorAll('a')];
  const mapIdToLink = new Map(
    links.map((a) => [a.getAttribute('href').slice(1), a])
  );

  const onIntersect = (entries) => {
    entries.forEach((entry) => {
      const id = entry.target.id;
      const link = mapIdToLink.get(id);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach((l) =>
          l.classList.remove('text-orange-600', 'font-semibold')
        );
        link.classList.add('text-orange-600', 'font-semibold');
      }
    });
  };

  const observer = new IntersectionObserver(onIntersect, {
    rootMargin: '0px 0px -70% 0px',
    threshold: 0.1,
  });

  headings.forEach((h) => observer.observe(h));
});
