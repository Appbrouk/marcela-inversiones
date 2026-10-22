/* Marcela Díaz Inversiones — modal de detalle de proyecto
   Lo usan la portada (carrusel) y el catálogo (/proyectos). Expone window.MD_MODAL.open(id, trigger).
   Dibuja la galería, descripción y datos desde window.MD_PROJECTS; el botón "Conversemos" abre
   WhatsApp con el número publicado desde la intranet (window.MD_CONFIG). Sin enlaces a la
   inmobiliaria: los proyectos se venden por nuestros medios. */
(() => {
  'use strict';
  const d = document;
  const root = d.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dialog = d.getElementById('proyecto-modal');
  if (!dialog) { window.MD_MODAL = { open() {}, esc: (s) => String(s == null ? '' : s) }; return; }
  const MD = (window.MD_CONFIG && typeof window.MD_CONFIG === 'object') ? window.MD_CONFIG : {};
  const WHATSAPP = String((MD.sitio && MD.sitio.whatsapp) || '56951497482').replace(/\D/g, '');

  const pad2 = (n) => String(n).padStart(2, '0');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const PH_MARK = '<svg class="ph__mark" viewBox="0 0 200 160" fill="none" stroke-width="10" aria-hidden="true">'
    + '<path d="M10 150 L74 10 L138 150" stroke="#C8A0A0"/><path d="M106.6 53.2 L125.9 10 L190 150" stroke="#C8A868"/></svg>';
  const placeholder = (p, i, extra) => (
    '<div class="ph ph--' + ((i % 3) + 1) + ' ' + (extra || '') + '" role="img" aria-label="' + esc(p.nombre) + '">'
    + PH_MARK + '<span class="ph__num">' + pad2(i + 1) + '</span><span class="ph__label">' + esc(p.comuna) + '</span></div>'
  );
  const paragraphs = (t) => (Array.isArray(t) ? t : [t]).filter(Boolean);

  /* --- Modal --- */
  const modal = dialog && {
    wrap: d.getElementById('modal-gallery-wrap'),
    gallery: d.getElementById('modal-gallery'),
    thumbs: d.getElementById('modal-thumbs'),
    count: d.getElementById('modal-count'),
    gprev: dialog.querySelector('[data-gdir="-1"]'),
    gnext: dialog.querySelector('[data-gdir="1"]'),
    comuna: d.getElementById('modal-comuna'),
    tag: d.getElementById('modal-tag'),
    title: d.getElementById('modal-title'),
    price: d.getElementById('modal-price'),
    dev: d.getElementById('modal-dev'),
    desc: d.getElementById('modal-desc'),
    data: d.getElementById('modal-data'),
    wa: d.getElementById('modal-wa'),
  };
  let lastTrigger = null;
  let closing = false;
  let galleryCount = 1;

  const galleryIndex = () => {
    const g = modal.gallery;
    const w = g.clientWidth || 1;
    const max = g.scrollWidth - g.clientWidth;
    if (max > 0 && g.scrollLeft >= max - 2) return galleryCount - 1;
    return Math.max(0, Math.min(galleryCount - 1, Math.round(g.scrollLeft / w)));
  };
  const syncGallery = () => {
    if (!modal) return;
    const i = galleryIndex();
    if (modal.count) modal.count.textContent = (i + 1) + ' / ' + galleryCount;
    if (modal.gprev) modal.gprev.disabled = i <= 0;
    if (modal.gnext) modal.gnext.disabled = i >= galleryCount - 1;
    if (modal.thumbs) [...modal.thumbs.children].forEach((b, k) => b.classList.toggle('is-active', k === i));
  };
  const goGallery = (i) => {
    const g = modal.gallery;
    const to = Math.max(0, Math.min(galleryCount - 1, i));
    g.scrollTo({ left: to * g.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
  };

  const fillModal = (p, i) => {
    const fotos = Array.isArray(p.fotos) ? p.fotos.filter((f) => f && f.src) : [];
    galleryCount = Math.max(1, fotos.length);
    modal.gallery.innerHTML = fotos.length
      ? fotos.map((f, k) => '<figure class="gallery__item"><img src="' + esc(f.src) + '" alt="' + esc(f.alt || p.nombre) + '" loading="' + (k ? 'lazy' : 'eager') + '" decoding="async"></figure>').join('')
      : placeholder(p, i, 'gallery__item');
    modal.thumbs.innerHTML = fotos.length > 1
      ? fotos.map((f, k) => '<button type="button" data-to="' + k + '" aria-label="Foto ' + (k + 1) + ' de ' + fotos.length + '"><img src="' + esc(f.src) + '" alt="" loading="lazy"></button>').join('')
      : '';
    modal.wrap.classList.toggle('is-single', fotos.length < 2);
    modal.gallery.scrollLeft = 0;

    modal.comuna.textContent = p.comuna || '';
    modal.tag.textContent = p.etiqueta || '';
    modal.tag.hidden = !p.etiqueta;
    modal.title.textContent = p.nombre || '';
    modal.price.textContent = p.desde || '';
    modal.price.hidden = !p.desde;
    if (modal.dev) { modal.dev.textContent = p.inmobiliaria || ''; modal.dev.hidden = !p.inmobiliaria; }
    modal.desc.innerHTML = paragraphs(p.descripcion).map((t) => '<p>' + esc(t) + '</p>').join('');

    const datos = Array.isArray(p.datos) ? p.datos.filter((r) => Array.isArray(r) && r.length >= 2 && r[1]) : [];
    modal.data.innerHTML = datos.map((r) => '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>').join('');
    modal.data.hidden = !datos.length;

    if (modal.wa) {
      const msg = 'Hola Marcela, me interesa el proyecto ' + p.nombre + (p.comuna ? ' (' + p.comuna + ')' : '') + '. ¿Me puedes enviar más información?';
      modal.wa.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
    }
    syncGallery();
  };

  const openProject = (id, trigger) => {
    if (!dialog || !modal) return;
    const lista = Array.isArray(window.MD_PROJECTS) ? window.MD_PROJECTS : [];
    const i = lista.findIndex((x) => x.id === id);
    if (i === -1) return;
    fillModal(lista[i], i);
    lastTrigger = trigger || null;
    closing = false;
    if (typeof dialog.showModal === 'function') { if (!dialog.open) dialog.showModal(); }
    else dialog.setAttribute('open', '');
    root.classList.add('modal-open');
    if (dialog.querySelector('.modal__inner')) dialog.querySelector('.modal__inner').scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      dialog.classList.add('is-open');
      syncGallery();
    }));
    if (history.replaceState) history.replaceState(null, '', '#proyecto=' + encodeURIComponent(id));
  };

  const closeProject = () => {
    if (!dialog || !dialog.open || closing) return;
    closing = true;
    dialog.classList.remove('is-open');
    root.classList.remove('modal-open');
    const done = () => {
      closing = false;
      if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
      if (lastTrigger && d.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
      /* Si el cierre vino de un enlace interno (#registro) el hash ya cambió: lo respetamos */
      if (history.replaceState && /^#proyecto=/.test(location.hash)) history.replaceState(null, '', location.pathname === '/' ? '#proyectos' : location.pathname + location.search);
    };
    if (reduced) done(); else setTimeout(done, 460);
  };

  if (dialog && modal) {
    dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeProject(); });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) { closeProject(); return; }       // clic en el fondo
      if (e.target.closest('[data-close]')) closeProject();
      const th = e.target.closest('.gallery__thumbs [data-to]');
      if (th) goGallery(+th.dataset.to);
      const gb = e.target.closest('[data-gdir]');
      if (gb) goGallery(galleryIndex() + (+gb.dataset.gdir));
    });
    dialog.addEventListener('keydown', (e) => {
      if (galleryCount < 2) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goGallery(galleryIndex() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goGallery(galleryIndex() - 1); }
    });
    let gTick = false;
    modal.gallery.addEventListener('scroll', () => {
      if (gTick) return;
      gTick = true;
      requestAnimationFrame(() => { syncGallery(); gTick = false; });
    }, { passive: true });
    addEventListener('resize', () => { if (dialog.open) syncGallery(); });
  }


  window.MD_MODAL = { open: openProject, close: closeProject, esc, placeholder, paragraphs };
})();
