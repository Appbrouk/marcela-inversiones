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
    portalId: '',
    formGuid: '',
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

  /* ---------- Varios ---------- */
  const year = d.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
