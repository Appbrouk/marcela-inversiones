/* Marcela Díaz Inversiones — interacción y efectos
   Todo es progresivo: sin JS el sitio se ve completo; con movimiento reducido no hay animación. */
(() => {
  'use strict';

  const d = document;
  const root = d.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  /* ---------- HubSpot ----------
     El formulario se envía a la Forms API de HubSpot. `portalId` y `formGuid` no son
     secretos: van a la vista en cualquier formulario embebido de HubSpot, así que
     pueden vivir aquí. Los datos salen del navegador directo a HubSpot, sin backend.

     Para obtenerlos: HubSpot → Marketing → Formularios → crea o abre el formulario →
     Compartir / Insertar. En el fragmento aparecen `portalId` (tu Hub ID) y `formId`.

     El formulario en HubSpot debe tener al menos estas propiedades de contacto:
     firstname, lastname, email, phone.

     Mientras `portalId` o `formGuid` estén vacíos, el sitio sigue en modo demo
     (valida y muestra el éxito sin enviar nada). */
  const HUBSPOT = {
    portalId: '51801072',
    formGuid: 'a8d33577-b4ec-4884-a984-08a08e1fe5e0',
    /* Región del portal: 'na1' (por defecto), 'eu1', etc. Aparece en la URL de HubSpot. */
    region: 'na1',
    /* Solo si el formulario tiene activado el consentimiento (RGPD) en HubSpot.
       Es el ID del tipo de suscripción; déjalo en 0 si no lo usas. */
    subscriptionTypeId: 0,
  };

  /* Alternativa sin HubSpot: un endpoint propio que reciba el JSON tal cual
     (Formspree, un webhook, una función serverless). Se usa solo si HUBSPOT
     no está configurado. */
  const FORM_ENDPOINT = '';

  /* ---------- Proyectos: carrusel + modal ----------
     Los datos viven en js/projects.js (window.MD_PROJECTS). Aquí solo se dibujan:
     las tarjetas del carrusel y, al pedir detalles, el contenido del <dialog>.
     Va antes del intro/reveals para que las tarjetas ya existan cuando se
     recolectan los [data-reveal]. */
  const PROJECTS = Array.isArray(window.MD_PROJECTS) ? window.MD_PROJECTS : [];
  const track = d.getElementById('proyectos-track');
  const carousel = d.getElementById('proyectos-carousel');
  const dialog = d.getElementById('proyecto-modal');
  const WHATSAPP = '56951497482';

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

  const projectCard = (p, i) => {
    const cover = p.fotos && p.fotos[0];
    const media = cover
      ? '<img src="' + esc(cover.src) + '" alt="' + esc(cover.alt || p.nombre) + '" loading="' + (i < 2 ? 'eager' : 'lazy') + '" decoding="async">'
      : placeholder(p, i);
    const tag = p.etiqueta ? '<span class="badge badge--rose">' + esc(p.etiqueta) + '</span>' : '';
    const excerpt = p.resumen || paragraphs(p.descripcion)[0] || '';
    return '<article class="project" role="listitem" data-reveal data-id="' + esc(p.id) + '" style="--d:' + Math.min(i, 3) * 110 + '">'
      + '<div class="project__media">' + media + '<span class="project__index" aria-hidden="true">' + pad2(i + 1) + '</span></div>'
      + '<div class="project__body">'
      + '<div class="project__badges"><span class="badge">' + esc(p.comuna) + '</span>' + tag + '</div>'
      + '<h3>' + esc(p.nombre) + '</h3>'
      + (p.inmobiliaria ? '<p class="project__dev">' + esc(p.inmobiliaria) + '</p>' : '')
      + (excerpt ? '<p class="project__excerpt">' + esc(excerpt) + '</p>' : '')
      + '<div class="project__foot"><span>' + esc(p.desde) + '</span>'
      + '<button class="btn btn--ghost btn--sm" type="button" data-open="' + esc(p.id) + '" aria-haspopup="dialog">Ver detalles</button>'
      + '</div></div></article>';
  };

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
    link: d.getElementById('modal-link'),
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

    if (modal.link) {
      modal.link.hidden = !p.enlace;
      if (p.enlace) modal.link.href = p.enlace;
    }
    if (modal.wa) {
      const msg = 'Hola Marcela, me interesa el proyecto ' + p.nombre + (p.comuna ? ' (' + p.comuna + ')' : '') + '. ¿Me puedes enviar más información?';
      modal.wa.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
    }
    syncGallery();
  };

  const openProject = (id, trigger) => {
    if (!dialog || !modal) return;
    const i = PROJECTS.findIndex((x) => x.id === id);
    if (i === -1) return;
    fillModal(PROJECTS[i], i);
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
      if (history.replaceState && /^#proyecto=/.test(location.hash)) history.replaceState(null, '', '#proyectos');
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

  /* --- Carrusel (bucle infinito) ---
     La pista lleva copias de las tarjetas a ambos lados de las reales. Cuando el
     scroll se asienta sobre una copia, saltamos sin animación a la tarjeta real
     equivalente: como el snap deja la pista exactamente sobre una tarjeta, el
     salto es invisible y desde la última siempre se ve venir la primera. */
  if (track && carousel && PROJECTS.length) {
    track.innerHTML = PROJECTS.map(projectCard).join('');
    const real = [...track.querySelectorAll('.project')];
    const n = real.length;
    const loop = n > 1;
    const dots = d.getElementById('proyectos-dots');
    const counter = d.getElementById('proyectos-count');
    const prev = carousel.querySelector('[data-dir="-1"]');
    const next = carousel.querySelector('[data-dir="1"]');
    if (dots) {
      dots.innerHTML = PROJECTS.map((p, i) => '<button type="button" data-to="' + i + '" aria-label="Ir a ' + esc(p.nombre) + '"></button>').join('');
    }
    const dotEls = dots ? [...dots.children] : [];

    let cards = real.slice();   // todas las tarjetas en la pista, copias incluidas
    let K = 0;                  // copias a cada lado
    let current = 0;            // índice real (0..n-1)
    let jumping = false;

    const stepOf = () => (cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth || 1);
    const origin = () => cards[0].offsetLeft - parseFloat(getComputedStyle(track).paddingLeft || 0);
    const slotOf = () => { // ranura (posición en la pista) más cercana al scroll actual
      const step = stepOf();
      return Math.max(0, Math.min(cards.length - 1, Math.round((track.scrollLeft - origin()) / step)));
    };
    const mod = (i) => ((i % n) + n) % n;

    const clone = (src) => {
      const c = src.cloneNode(true);
      c.removeAttribute('data-reveal');
      c.classList.add('in', 'is-clone');
      c.setAttribute('aria-hidden', 'true');
      c.removeAttribute('role');
      c.style.removeProperty('--d');
      c.querySelectorAll('button, a').forEach((el) => el.setAttribute('tabindex', '-1'));
      c.querySelectorAll('img').forEach((img) => img.setAttribute('loading', 'lazy'));
      return c;
    };

    /* Cuántas copias hacen falta para que, parado en la primera o la última
       tarjeta real, la pista siga llena hasta el borde de la pantalla. */
    const neededK = () => Math.max(2, Math.ceil(track.clientWidth / stepOf()) + 1);

    const build = () => {
      track.querySelectorAll('.is-clone').forEach((c) => c.remove());
      cards = real.slice();
      K = 0;
      if (!loop) return;
      K = neededK();
      const before = d.createDocumentFragment();
      const after = d.createDocumentFragment();
      for (let i = 0; i < K; i++) {
        before.appendChild(clone(real[mod(n - K + i)]));   // …, n-2, n-1
        after.appendChild(clone(real[mod(i)]));            // 0, 1, …
      }
      track.insertBefore(before, real[0]);
      track.appendChild(after);
      cards = [...track.querySelectorAll('.project')];
    };

    const jumpTo = (slot) => {
      jumping = true;
      track.classList.add('is-jumping');
      track.scrollTo({ left: origin() + slot * stepOf(), behavior: 'instant' });
      requestAnimationFrame(() => { track.classList.remove('is-jumping'); jumping = false; });
    };

    /* La pista sangra hasta los bordes del viewport: el margen negativo es la
       distancia real desde el contenedor al borde, que solo se conoce en runtime. */
    const bleed = () => {
      const left = Math.max(0, Math.round(carousel.getBoundingClientRect().left));
      track.style.setProperty('--bleed', left + 'px');
    };

    const sync = () => {
      const slot = slotOf();
      current = loop ? mod(slot - K) : slot;
      cards.forEach((c, k) => c.classList.toggle('is-current', k === slot));
      dotEls.forEach((b, k) => {
        b.classList.toggle('is-active', k === current);
        b.setAttribute('aria-current', k === current ? 'true' : 'false');
      });
      if (counter) counter.textContent = pad2(current + 1) + ' / ' + pad2(n);
      if (!loop) {
        const max = track.scrollWidth - track.clientWidth;
        if (prev) prev.disabled = track.scrollLeft <= 2;
        if (next) next.disabled = track.scrollLeft >= max - 2;
        carousel.classList.toggle('is-static', max <= 2);
      }
    };

    /* Al asentarse el scroll sobre una copia, volvemos a la tarjeta real equivalente */
    const settle = () => {
      if (!loop || jumping) return;
      const slot = slotOf();
      if (slot < K) jumpTo(slot + n);
      else if (slot >= K + n) jumpTo(slot - n);
    };

    const goToSlot = (slot) => {
      track.scrollTo({ left: origin() + slot * stepOf(), behavior: reduced ? 'auto' : 'smooth' });
    };
    /* Avanza `delta` tarjetas desde la actual, siempre por el camino corto */
    const move = (delta) => goToSlot(slotOf() + delta);
    /* Va al proyecto real `i` por el lado más cercano */
    const goTo = (i) => {
      if (!loop) { goToSlot(Math.max(0, Math.min(n - 1, i))); return; }
      const slot = slotOf();
      let delta = mod(i) - mod(slot - K);
      if (delta > n / 2) delta -= n;
      if (delta < -n / 2) delta += n;
      goToSlot(slot + delta);
    };

    let tick = false;
    let settleTimer = 0;
    const supportsScrollEnd = 'onscrollend' in window;
    track.addEventListener('scroll', () => {
      if (!tick) {
        tick = true;
        requestAnimationFrame(() => { sync(); tick = false; });
      }
      if (!supportsScrollEnd) {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(settle, 120);
      }
    }, { passive: true });
    if (supportsScrollEnd) track.addEventListener('scrollend', settle);

    let resizeTimer = 0;
    addEventListener('resize', () => {
      bleed();
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const keep = current;
        if (loop && neededK() !== K) build();
        jumpTo((loop ? K : 0) + keep);
        sync();
      }, 120);
    });

    if (prev) prev.addEventListener('click', () => move(-1));
    if (next) next.addEventListener('click', () => move(1));
    if (dots) dots.addEventListener('click', (e) => {
      const b = e.target.closest('[data-to]');
      if (b) goTo(+b.dataset.to);
    });
    track.addEventListener('keydown', (e) => {
      if (e.target !== track) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
      if (e.key === 'Enter') { e.preventDefault(); openProject(real[current].dataset.id, track); }
    });

    /* Arrastre con mouse (en táctil el scroll nativo ya lo hace) */
    let dragged = false;
    if (finePointer) {
      let down = false, startX = 0, startLeft = 0, moved = 0;
      track.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        down = true; moved = 0; startX = e.clientX; startLeft = track.scrollLeft;
      });
      track.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (!moved && Math.abs(dx) < 5) return;
        if (!moved) { track.classList.add('is-dragging'); track.setPointerCapture(e.pointerId); }
        moved = 1;
        track.scrollLeft = startLeft - dx;
      });
      const release = () => {
        if (!down) return;
        down = false;
        if (moved) {
          dragged = true;
          setTimeout(() => { dragged = false; }, 50);
          track.classList.remove('is-dragging');   // vuelve el snap: el navegador reacomoda
          goToSlot(slotOf());
        }
      };
      track.addEventListener('pointerup', release);
      track.addEventListener('pointercancel', release);
      track.addEventListener('lostpointercapture', release);
    }

    track.addEventListener('click', (e) => {
      if (dragged) { e.preventDefault(); return; }
      const card = e.target.closest('.project');
      if (!card) return;
      const hit = e.target.closest('[data-open]') || e.target.closest('.project__media');
      if (!hit) return;
      /* Si se pulsó una copia, el foco vuelve a la tarjeta real al cerrar */
      const source = real.find((r) => r.dataset.id === card.dataset.id) || card;
      openProject(card.dataset.id, source.querySelector('[data-open]') || source);
    });

    bleed();
    build();
    jumpTo(loop ? K : 0);
    sync();
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => { jumpTo((loop ? K : 0) + current); sync(); });
  } else if (carousel) {
    carousel.hidden = true;
  }

  /* ---------- Intro (una vez por sesión) ---------- */
  const intro = d.getElementById('intro');
  let introSeen = false;
  try { introSeen = sessionStorage.getItem('md-intro') === '1'; } catch (e) {}
  const playIntro = !!intro && !reduced && !introSeen;

  const endIntro = () => {
    if (!intro) return;
    intro.classList.add('is-done');
    root.classList.remove('intro-active');
    try { sessionStorage.setItem('md-intro', '1'); } catch (e) {}
    setTimeout(() => intro.remove(), 1000);
    startReveals();
  };

  if (playIntro) {
    root.classList.add('intro-active');
    intro.classList.add('is-playing');
    setTimeout(endIntro, 2000);
    intro.addEventListener('click', endIntro, { once: true });
  } else if (intro) {
    intro.remove();
  }

  /* ---------- Titular: palabras enmascaradas ---------- */
  d.querySelectorAll('[data-split]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const outer = d.createElement('span');
      outer.className = 'w';
      const inner = d.createElement('span');
      inner.textContent = w;
      inner.style.setProperty('--i', i);
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(d.createTextNode(' '));
    });
  });

  /* ---------- Reveals con escalonado ---------- */
  d.querySelectorAll('[data-stagger]').forEach((group) => {
    [...group.children].forEach((child, i) => {
      if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', '');
      child.style.setProperty('--d', i * 110);
    });
  });

  let revealsStarted = false;
  let pendingReveals = [];
  let revealObserver = null;

  function reveal(el) {
    el.classList.add('in');
    if (revealObserver) revealObserver.unobserve(el);
    const i = pendingReveals.indexOf(el);
    if (i !== -1) pendingReveals.splice(i, 1);
  }

  /* Red de seguridad: el IntersectionObserver no garantiza un callback cuando el
     scroll salta un elemento entero de una vez (rueda rápida, arrastre de la barra,
     Fin, salto a un ancla). Sin esto, esos bloques quedan en opacity:0 para siempre. */
  function sweepReveals() {
    if (!pendingReveals.length) return;
    const limit = innerHeight;
    for (let i = pendingReveals.length - 1; i >= 0; i--) {
      const el = pendingReveals[i];
      if (el.getBoundingClientRect().top < limit) reveal(el);
    }
  }

  function startReveals() {
    if (revealsStarted) return;
    revealsStarted = true;
    const targets = [...d.querySelectorAll('[data-reveal]')];
    if (!('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('in')); return; }
    pendingReveals = targets.slice();
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        // isIntersecting, o ya quedó por encima del viewport (se pasó de largo)
        if (e.isIntersecting || e.boundingClientRect.top < 0) reveal(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((t) => revealObserver.observe(t));
    sweepReveals();
  }
  if (!playIntro) startReveals();

  /* ---------- Nav: vidrio al hacer scroll · progreso ---------- */
  const nav = d.getElementById('nav');
  const progress = d.querySelector('.progress');
  const toTop = d.getElementById('to-top');

  /* ---------- Movimiento de las imágenes ligado al scroll ----------
     El scroll solo fija un objetivo; un bucle de rAF acerca cada imagen a ese
     objetivo una fracción del camino por frame. Así el movimiento tiene inercia
     propia — arranca y frena suave — y se mantiene continuo aunque los eventos
     de scroll lleguen con huecos (rueda, inercia táctil, barra arrastrada).

     Antes el valor se escribía tal cual en cada evento y se suavizaba con una
     transición CSS de .15s: cada evento reiniciaba la transición, así que la
     imagen nunca llegaba a su sitio y se veía arrastrada y a saltos.

     El bucle se apaga solo cuando todo llegó a su destino, para no gastar frames
     con la página quieta. */
  const EASE = 0.11;   // fracción del camino que se recorre por frame
  const STOP = 0.05;   // px: por debajo de esto damos el movimiento por terminado

  const parallax = reduced ? [] : [...d.querySelectorAll('[data-parallax]')].map((el) => ({
    el,
    frame: el.closest('.frame'),
    speed: parseFloat(el.dataset.parallax) || 0,
    current: 0, target: 0, painted: '',
  }));

  const pointer = { el: null, x: 0, rot: 0, tx: 0, trot: 0, painted: '' };

  /* Avance del elemento por el viewport: -1 al entrar por abajo, 0 centrado,
     1 al salir por arriba. Normalizarlo con la altura de la ventana hace que el
     recorrido se sienta igual en un móvil que en una pantalla grande. */
  const measure = (snap) => {
    const vh = innerHeight || 1;
    parallax.forEach((p) => {
      const r = p.el.getBoundingClientRect();
      const advance = (r.top + r.height / 2 - vh / 2) / vh;
      p.target = Math.max(-1.25, Math.min(1.25, advance)) * p.speed * vh * 0.7;
      /* Fuera de vista no hay nada que suavizar: dejamos el valor final puesto
         para que el elemento no aparezca persiguiendo su posición. */
      if (snap || r.bottom < -vh * 0.4 || r.top > vh * 1.4) p.current = p.target;
    });
  };

  const paint = () => {
    let moving = false;
    parallax.forEach((p) => {
      const diff = p.target - p.current;
      if (Math.abs(diff) > STOP) { p.current += diff * EASE; moving = true; }
      else p.current = p.target;
      const v = p.current.toFixed(2) + 'px';
      if (v === p.painted) return;
      p.painted = v;
      p.el.style.setProperty('--py', v);
      if (p.frame) p.frame.style.setProperty('--py', v);
    });
    if (pointer.el) {
      const dx = pointer.tx - pointer.x;
      const drot = pointer.trot - pointer.rot;
      if (Math.abs(dx) > STOP || Math.abs(drot) > 0.01) {
        pointer.x += dx * EASE;
        pointer.rot += drot * EASE;
        moving = true;
      } else {
        pointer.x = pointer.tx;
        pointer.rot = pointer.trot;
      }
      const v = pointer.x.toFixed(2) + '|' + pointer.rot.toFixed(3);
      if (v !== pointer.painted) {
        pointer.painted = v;
        pointer.el.style.setProperty('--px', pointer.x.toFixed(2) + 'px');
        pointer.el.style.setProperty('--rot', pointer.rot.toFixed(3) + 'deg');
      }
    }
    return moving;
  };

  let motionRaf = 0;
  let idleFrames = 0;
  const loop = () => {
    /* Unos frames de gracia antes de apagar el bucle: el scroll por inercia
       entrega eventos con pausas y no queremos reiniciarlo en cada una. */
    if (paint()) idleFrames = 0;
    else if (++idleFrames > 6) { motionRaf = 0; return; }
    motionRaf = requestAnimationFrame(loop);
  };
  const startLoop = () => {
    if (motionRaf) return;
    idleFrames = 0;
    motionRaf = requestAnimationFrame(loop);
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      nav.classList.toggle('is-scrolled', y > 24);
      const max = root.scrollHeight - innerHeight;
      if (progress) progress.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
      if (toTop) toTop.classList.toggle('is-visible', y > innerHeight * 0.9);
      measure(false);
      startLoop();
      sweepReveals();
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(true); paint(); onScroll(); });
  measure(true);
  paint();
  onScroll();

  if (toTop) toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  /* ---------- Hero: parallax de puntero (profundidad sutil) ----------
     Comparte bucle e interpolación con el parallax de scroll, así el retrato
     acompaña al cursor con algo de retraso elástico en vez de pegarse a él. */
  if (finePointer && !reduced) {
    const hero = d.querySelector('.hero');
    const img = d.querySelector('[data-pointer]');
    if (hero && img) {
      pointer.el = img;
      hero.addEventListener('pointermove', (e) => {
        const x = e.clientX / innerWidth - 0.5;
        pointer.tx = x * -14;
        pointer.trot = x * 0.6;
        startLoop();
      });
      hero.addEventListener('pointerleave', () => {
        pointer.tx = 0;
        pointer.trot = 0;
        startLoop();
      });
    }
  }

  /* ---------- Tarjetas: inclinación 3D + reflejo ---------- */
  if (finePointer && !reduced) {
    d.querySelectorAll('.tilt').forEach((card) => {
      let raf;
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.setProperty('--rx', ((0.5 - py) * 6).toFixed(2) + 'deg');
          card.style.setProperty('--ry', ((px - 0.5) * 8).toFixed(2) + 'deg');
          card.style.setProperty('--px', (px * 100).toFixed(1) + '%');
          card.style.setProperty('--py', (py * 100).toFixed(1) + '%');
        });
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });

    /* ---------- Botones magnéticos ---------- */
    d.querySelectorAll('.btn').forEach((b) => {
      if (b.classList.contains('btn--block')) return;
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / r.width;
        const y = (e.clientY - (r.top + r.height / 2)) / r.height;
        b.style.setProperty('--mx', (x * 8).toFixed(1) + 'px');
        b.style.setProperty('--my', (y * 6).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', () => {
        b.style.setProperty('--mx', '0px');
        b.style.setProperty('--my', '0px');
      });
    });
  }

  /* ---------- Scrollspy + indicador deslizante ---------- */
  const links = [...d.querySelectorAll('.nav__links a')];
  const indicator = d.querySelector('.nav__indicator');
  const sections = links.map((a) => d.querySelector(a.hash)).filter(Boolean);

  const setActive = (id) => {
    links.forEach((a) => {
      const on = a.hash === '#' + id;
      a.classList.toggle('is-active', on);
      if (on && indicator) {
        indicator.style.width = a.offsetWidth + 'px';
        indicator.style.transform = 'translateX(' + a.offsetLeft + 'px)';
      }
    });
  };
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach((s) => spy.observe(s));
  }
  const placeIndicator = () => {
    const a = d.querySelector('.nav__links a.is-active');
    if (a && indicator) {
      indicator.style.transition = 'none';
      indicator.style.width = a.offsetWidth + 'px';
      indicator.style.transform = 'translateX(' + a.offsetLeft + 'px)';
      requestAnimationFrame(() => { indicator.style.transition = ''; });
    }
  };
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(placeIndicator); else placeIndicator();
  addEventListener('resize', placeIndicator);

  /* ---------- Menú móvil ---------- */
  const burger = d.querySelector('.nav__burger');
  const menu = d.getElementById('menu');
  const toggleMenu = (open) => {
    const o = typeof open === 'boolean' ? open : !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', o);
    root.classList.toggle('menu-open', o);
    burger.setAttribute('aria-expanded', String(o));
    burger.setAttribute('aria-label', o ? 'Cerrar menú' : 'Abrir menú');
    if (o) nav.classList.add('is-scrolled');
    else onScroll();
  };
  if (burger && menu) {
    burger.addEventListener('click', () => toggleMenu());
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => toggleMenu(false)));
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) toggleMenu(false); });
    matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) toggleMenu(false); });
  }

  /* ---------- Registro ---------- */
  const hubspotReady = () => Boolean(HUBSPOT.portalId && HUBSPOT.formGuid);

  const hubspotUrl = () => {
    const host = HUBSPOT.region && HUBSPOT.region !== 'na1'
      ? 'https://api-' + HUBSPOT.region + '.hsforms.com'
      : 'https://api.hsforms.com';
    return host + '/submissions/v3/integration/submit/' + HUBSPOT.portalId + '/' + HUBSPOT.formGuid;
  };

  /* Cookie de seguimiento de HubSpot. Solo existe si se carga el script de
     tracking (ver index.html); sin ella el contacto se crea igual, pero sin
     atribución de origen. */
  const cookie = (name) => {
    const m = d.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  };

  /* El formulario pide un solo campo "Nombre"; HubSpot guarda nombre y apellido
     por separado. Primera palabra = nombre, el resto = apellido. */
  const splitNombre = (full) => {
    const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
    return { firstname: parts[0] || '', lastname: parts.slice(1).join(' ') };
  };

  const hubspotPayload = (data) => {
    const { firstname, lastname } = splitNombre(data.nombre);
    const fields = [
      { objectTypeId: '0-1', name: 'firstname', value: firstname },
      { objectTypeId: '0-1', name: 'email', value: data.email || '' },
    ];
    if (lastname) fields.push({ objectTypeId: '0-1', name: 'lastname', value: lastname });
    if (data.telefono) fields.push({ objectTypeId: '0-1', name: 'phone', value: data.telefono });

    const payload = { fields, context: { pageUri: location.href, pageName: d.title } };
    const hutk = cookie('hubspotutk');
    if (hutk) payload.context.hutk = hutk;

    if (HUBSPOT.subscriptionTypeId) {
      const text = 'Acepto recibir información de MD Invest';
      payload.legalConsentOptions = {
        consent: {
          consentToProcess: true,
          text,
          communications: [
            { value: true, subscriptionTypeId: HUBSPOT.subscriptionTypeId, text },
          ],
        },
      };
    }
    return payload;
  };

  const sendToHubspot = async (data) => {
    const res = await fetch(hubspotUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hubspotPayload(data)),
    });
    if (res.ok) return;
    /* HubSpot responde el detalle del error en JSON; sirve para distinguir un
       email inválido (recuperable por la persona) de un portal mal configurado. */
    let detail = 'HTTP ' + res.status;
    try {
      const body = await res.json();
      if (body && Array.isArray(body.errors) && body.errors.length) {
        detail = body.errors.map((x) => x.message).join(' · ');
      } else if (body && body.message) {
        detail = body.message;
      }
    } catch (e) {}
    const err = new Error(detail);
    err.invalidInput = res.status === 400 && /email|phone|fields\./i.test(detail);
    throw err;
  };

  const form = d.getElementById('form-registro');
  const ok = d.getElementById('registro-ok');
  if (form && ok) {
    const acepta = form.querySelector('#acepta');
    const submit = form.querySelector('button[type="submit"]');
    const error = d.getElementById('registro-error');
    acepta.addEventListener('change', () => { submit.disabled = !acepta.checked; });

    const showError = (msg) => {
      if (!error) { alert(msg); return; }
      error.textContent = msg;
      error.hidden = false;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (error) error.hidden = true;
      submit.disabled = true;
      submit.classList.add('is-loading');
      const data = Object.fromEntries(new FormData(form).entries());
      data.origen = location.href;
      try {
        if (hubspotReady()) {
          await sendToHubspot(data);
        } else if (FORM_ENDPOINT) {
          const res = await fetch(FORM_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        } else {
          await new Promise((r) => setTimeout(r, 700));
        }
        form.hidden = true;
        ok.hidden = false;
        requestAnimationFrame(() => ok.classList.add('in'));
      } catch (err) {
        submit.disabled = false;
        submit.classList.remove('is-loading');
        showError(err && err.invalidInput
          ? 'Revisa tus datos: ' + err.message
          : 'No pudimos enviar tu registro. Inténtalo de nuevo o escríbenos por WhatsApp.');
      }
    });
  }

  /* ---------- Enlace directo a un proyecto: mdiaz.cl/#proyecto=<id> ----------
     Útil para compartir por WhatsApp o Instagram. Espera a que termine el intro. */
  const openFromHash = () => {
    const m = location.hash.match(/^#proyecto=(.+)$/);
    if (!m) return;
    const id = decodeURIComponent(m[1]);
    if (!PROJECTS.some((p) => p.id === id)) return;
    const sec = d.getElementById('proyectos');
    if (sec) sec.scrollIntoView({ block: 'start', behavior: 'auto' });
    openProject(id, null);
  };
  setTimeout(openFromHash, playIntro ? 2400 : 250);

  /* ---------- Varios ---------- */
  const year = d.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
