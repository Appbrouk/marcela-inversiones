/* Marcela Díaz Inversiones — interacción y efectos
   Todo es progresivo: sin JS el sitio se ve completo; con movimiento reducido no hay animación. */
(() => {
  'use strict';

  const d = document;
  const root = d.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  /* Endpoint del formulario. Vacío = modo demo (muestra el éxito sin enviar).
     Ej.: 'https://formspree.io/f/xxxxxxx' o un webhook propio que reciba JSON. */
  const FORM_ENDPOINT = '';

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

  /* ---------- Nav: vidrio al hacer scroll · progreso · parallax ---------- */
  const nav = d.getElementById('nav');
  const progress = d.querySelector('.progress');
  const toTop = d.getElementById('to-top');
  const parallaxEls = reduced ? [] : [...d.querySelectorAll('[data-parallax]')];

  const updateParallax = () => {
    const vh = innerHeight;
    parallaxEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const speed = parseFloat(el.dataset.parallax) || 0;
      const center = r.top + r.height / 2 - vh / 2;
      el.style.setProperty('--py', (center * speed).toFixed(1) + 'px');
      const frame = el.closest('.frame');
      if (frame) frame.style.setProperty('--py', (center * speed).toFixed(1) + 'px');
    });
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
      updateParallax();
      sweepReveals();
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  if (toTop) toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  /* ---------- Hero: parallax de puntero (profundidad sutil) ---------- */
  if (finePointer && !reduced) {
    const hero = d.querySelector('.hero');
    const img = d.querySelector('[data-pointer]');
    if (hero && img) {
      let raf;
      hero.addEventListener('pointermove', (e) => {
        const x = e.clientX / innerWidth - 0.5;
        const y = e.clientY / innerHeight - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          img.style.setProperty('--px', (x * -14).toFixed(1) + 'px');
          img.style.setProperty('--rot', (x * 0.6).toFixed(2) + 'deg');
        });
      });
      hero.addEventListener('pointerleave', () => {
        img.style.setProperty('--px', '0px');
        img.style.setProperty('--rot', '0deg');
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
  const form = d.getElementById('form-registro');
  const ok = d.getElementById('registro-ok');
  if (form && ok) {
    const acepta = form.querySelector('#acepta');
    const submit = form.querySelector('button[type="submit"]');
    acepta.addEventListener('change', () => { submit.disabled = !acepta.checked; });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      submit.disabled = true;
      submit.classList.add('is-loading');
      const data = Object.fromEntries(new FormData(form).entries());
      data.origen = location.href;
      try {
        if (FORM_ENDPOINT) {
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
        alert('No pudimos enviar tu registro. Inténtalo de nuevo o escríbenos por WhatsApp.');
      }
    });
  }

  /* ---------- Varios ---------- */
  const year = d.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
