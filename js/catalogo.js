/* Marcela Díaz Inversiones — catálogo con filtros (sección #proyectos de la portada)
   Dibuja las tarjetas desde window.MD_PROJECTS (base compartida vía /api/proyectos, o
   js/projects.js como respaldo) y filtra por comuna, precio en UF, entrega, dormitorios y orden.
   Los filtros viven en la URL (?comuna=&precio=&entrega=&dorm=&orden=) para poder compartirlos.
   El detalle se abre en el modal de js/modal.js. */
(() => {
  'use strict';
  const d = document;
  const grid = d.getElementById('catalogo');
  const form = d.getElementById('filtros');
  if (!grid || !form) return;
  const count = d.getElementById('catalogo-count');
  const empty = d.getElementById('catalogo-vacio');
  const esc = window.MD_MODAL ? window.MD_MODAL.esc : (s) => String(s == null ? '' : s);
  const placeholder = window.MD_MODAL && window.MD_MODAL.placeholder;
  const pad2 = (n) => String(n).padStart(2, '0');

  /* Los proyectos de respaldo (js/projects.js) no traen uf/entrega/dorm: se deducen del texto */
  const normalizar = (p) => {
    let uf = Number(p.uf) || 0;
    if (!uf) { const m = String(p.desde || '').match(/([\d.,]+)\s*UF/i); uf = m ? Number(m[1].replace(/\./g, '').replace(',', '.')) : 0; }
    let dorm = Array.isArray(p.dorm) ? p.dorm.map(Number) : [];
    if (!dorm.length) {
      const t = ((p.datos || []).find((x) => /tipolog/i.test(x[0])) || [])[1] || '';
      if (/studio|estudio/i.test(t)) dorm.push(0);
      for (const m of t.matchAll(/(\d)D/g)) dorm.push(Number(m[1]));
      dorm = [...new Set(dorm)].sort();
    }
    const entrega = p.entrega || (/futura|pronta|20\d\d/i.test(p.etiqueta || '') ? 'futura' : 'inmediata');
    const m2 = p.m2 || ((p.datos || []).find((x) => /superficie/i.test(x[0])) || [])[1] || '';
    return Object.assign({}, p, { uf, dorm, entrega, m2 });
  };
  const PROYECTOS = (Array.isArray(window.MD_PROJECTS) ? window.MD_PROJECTS : []).map(normalizar);
  const tipologia = (dorm) => {
    if (!dorm.length) return '';
    const l = (n) => (n === 0 ? 'Studio' : n + 'D');
    return dorm.length === 1 ? l(dorm[0]) : l(dorm[0]) + ' a ' + l(dorm[dorm.length - 1]);
  };

  /* Comunas desde el propio catálogo */
  const comunas = [...new Set(PROYECTOS.map((p) => p.comuna).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  comunas.forEach((c) => { const o = d.createElement('option'); o.value = c; o.textContent = c; form.comuna.appendChild(o); });

  /* Filtros que llegan por URL */
  const params = new URLSearchParams(location.search);
  ['comuna', 'precio', 'entrega', 'dorm', 'orden'].forEach((k) => { if (params.get(k) !== null && form[k]) form[k].value = params.get(k); });

  const card = (p, i) => {
    const cover = p.fotos && p.fotos[0];
    const media = cover
      ? '<img src="' + esc(cover.src) + '" alt="' + esc(cover.alt || p.nombre) + '" loading="' + (i < 3 ? 'eager' : 'lazy') + '" decoding="async">'
      : (placeholder ? placeholder(p, i) : '');
    const tag = p.etiqueta ? '<span class="badge badge--rose">' + esc(p.etiqueta) + '</span>' : '';
    const specs = [tipologia(p.dorm), p.m2].filter(Boolean).map((t) => '<span>' + esc(t) + '</span>').join('');
    return '<article class="project catalogo__card" data-id="' + esc(p.id) + '">'
      + '<div class="project__media">' + media + '<span class="project__index" aria-hidden="true">' + pad2(i + 1) + '</span></div>'
      + '<div class="project__body">'
      + '<div class="project__badges"><span class="badge">' + esc(p.comuna) + '</span>' + tag + '</div>'
      + '<h3>' + esc(p.nombre) + '</h3>'
      + (p.inmobiliaria ? '<p class="project__dev">' + esc(p.inmobiliaria) + '</p>' : '')
      + (specs ? '<p class="project__specs">' + specs + '</p>' : '')
      + (p.resumen ? '<p class="project__excerpt">' + esc(p.resumen) + '</p>' : '')
      + '<div class="project__foot"><span>' + esc(p.desde) + '</span>'
      + '<button class="btn btn--ghost btn--sm" type="button" data-open="' + esc(p.id) + '" aria-haspopup="dialog">Ver detalles</button>'
      + '</div></div></article>';
  };

  const render = () => {
    const f = { comuna: form.comuna.value, precio: form.precio.value, entrega: form.entrega.value, dorm: form.dorm.value, orden: form.orden.value };
    let lista = PROYECTOS.filter((p) => {
      if (f.comuna && p.comuna !== f.comuna) return false;
      if (f.entrega && p.entrega !== f.entrega) return false;
      if (f.dorm !== '' && p.dorm.indexOf(Number(f.dorm)) < 0) return false;
      if (f.precio) { const r = f.precio.split('-').map(Number); if (!p.uf || p.uf < r[0] || p.uf > r[1]) return false; }
      return true;
    });
    if (f.orden === 'precio-asc') lista = lista.slice().sort((a, b) => a.uf - b.uf);
    if (f.orden === 'precio-desc') lista = lista.slice().sort((a, b) => b.uf - a.uf);
    grid.innerHTML = lista.map(card).join('');
    if (empty) empty.hidden = lista.length > 0;
    if (count) {
      count.textContent = lista.length === PROYECTOS.length
        ? pad2(lista.length) + ' proyectos'
        : pad2(lista.length) + ' de ' + pad2(PROYECTOS.length) + ' proyectos';
    }
    /* La URL refleja los filtros: se puede compartir o volver atrás sin perderlos */
    const q = new URLSearchParams();
    Object.keys(f).forEach((k) => { if (f[k] && !(k === 'orden' && f[k] === 'destacados')) q.set(k, f[k]); });
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q.toString() : '') + location.hash);
  };

  form.addEventListener('change', render);
  form.addEventListener('submit', (e) => { e.preventDefault(); render(); });
  const limpiar = d.getElementById('filtros-limpiar');
  if (limpiar) limpiar.addEventListener('click', () => { form.reset(); render(); });

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.project');
    if (!card) return;
    const hit = e.target.closest('[data-open]') || e.target.closest('.project__media');
    if (!hit || !window.MD_MODAL) return;
    window.MD_MODAL.open(card.dataset.id, card.querySelector('[data-open]') || card);
  });

  render();

  /* Enlace directo: /proyectos#proyecto=<id> abre el detalle (al cargar y al cambiar el hash) */
  const abrirDesdeHash = () => {
    const m = location.hash.match(/^#proyecto=(.+)$/);
    if (m && window.MD_MODAL) window.MD_MODAL.open(decodeURIComponent(m[1]), null);
  };
  if (!d.querySelector('.hero')) setTimeout(abrirDesdeHash, 150);   // en la portada lo hace main.js tras el intro
  addEventListener('hashchange', abrirDesdeHash);
})();
