/* Marcela Díaz Inversiones — evaluador de perfil inversionista
   ------------------------------------------------------------------
   Wizard de 5 pasos con pre-diagnóstico en vivo. Portado del evaluador de
   IMOBU (imobu-web), con tres cambios de fondo:

     · Sin sistema de asesores: aquí la asesora es una, Marcela.
     · El catálogo sale de window.MD_PROJECTS (js/projects.js), leyendo el
       precio en UF del campo de texto "desde".
     · El envío va a /api/evaluacion (función serverless propia), no al
       receptor multiformulario de IMOBU.

   Los supuestos financieros viven en CFG y se muestran al pie del panel:
   el texto se arma desde las mismas constantes que usa el cálculo, para que
   nunca puedan contradecirse. */
(function () {
  'use strict';

  var d = document;
  var form = d.getElementById('eval-form');
  if (!form) return;

  /* ---------- Supuestos del pre-diagnóstico ----------
     La UF es un valor fijo: revísala cada cierto tiempo (es referencial, no
     se usa para cerrar ninguna operación). */
  var CFG = {
    UF: 41065,
    TASA_ANUAL: 0.045,
    PLAZO_MESES: 25 * 12,
    PIE: 0.20,
    DIV_MAX: 0.25,      // dividendo máximo como fracción de la renta líquida
    CARGA_MAX: 0.45,    // carga financiera total máxima
    RENTA_MIN: 650000,  // renta mínima referencial de algunos bancos
    WHATSAPP: '56951497482'
  };

  /* ---------- Formato y matemática ---------- */
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clp(n) { return '$' + (Math.round(n / 1000) * 1000).toLocaleString('es-CL'); }
  function ufFmt(n) { return 'UF ' + Math.round(n).toLocaleString('es-CL'); }

  /* Crédito que soporta un dividendo dado: anualidad despejada al revés. */
  function creditoDesdeDividendo(dividendoCLP) {
    var i = Math.pow(1 + CFG.TASA_ANUAL, 1 / 12) - 1;
    var n = CFG.PLAZO_MESES;
    if (i <= 0) return dividendoCLP * n / CFG.UF;
    return dividendoCLP * (1 - Math.pow(1 + i, -n)) / i / CFG.UF;
  }

  function wa(mensaje) {
    return 'https://wa.me/' + CFG.WHATSAPP + '?text=' + encodeURIComponent(mensaje);
  }

  function telefonoValido(v) {
    var dig = String(v || '').replace(/\D/g, '');
    return dig.length >= 8 && dig.length <= 15;
  }

  /* ---------- Catálogo ----------
     projects.js guarda el precio como texto libre ("Desde 2.900 UF") porque es
     lo que se muestra en la tarjeta. Aquí se extrae el número para poder
     comparar; un proyecto sin UF legible simplemente no entra al matcher. */
  var PROYECTOS = (window.MD_PROJECTS || []).map(function (p) {
    var m = String(p.desde || '').match(/([\d.,]+)\s*UF/i);
    var uf = m ? Number(m[1].replace(/\./g, '').replace(',', '.')) : 0;
    return { id: p.id, nombre: p.nombre, comuna: p.comuna, uf: uf };
  }).filter(function (p) { return p.uf > 0; });

  function urlProyecto(p) { return '/#proyecto=' + encodeURIComponent(p.id); }

  /* Las comunas que se ofrecen salen del propio catálogo, no de una lista fija:
     así nunca se ofrece una comuna donde no hay nada que mostrar, y al sumar un
     proyecto en una comuna nueva aparece sola. */
  (function pintarComunas() {
    var cont = d.getElementById('comunas-choices');
    if (!cont) return;
    var comunas = [];
    PROYECTOS.forEach(function (p) { if (p.comuna && comunas.indexOf(p.comuna) < 0) comunas.push(p.comuna); });
    comunas.sort(function (a, b) { return a.localeCompare(b, 'es'); });
    comunas.push('Me da igual');
    cont.innerHTML = comunas.map(function (c) {
      return '<label class="choice"><input type="checkbox" name="comunas" value="' + esc(c) + '"><span>' + esc(c) + '</span></label>';
    }).join('');
  })();

  /* ---------- Estado del wizard ---------- */
  var steps = Array.prototype.slice.call(form.querySelectorAll('.step'));
  var progress = Array.prototype.slice.call(d.querySelectorAll('#progress li'));
  var btnBack = d.getElementById('btn-back');
  var btnNext = d.getElementById('btn-next');
  var btnSubmit = d.getElementById('btn-submit');
  var stepError = d.getElementById('step-error');
  var mini = d.getElementById('diag-mini');
  var current = 0;
  var enviado = false;

  var money = function (name) { var el = form.elements[name]; return el ? Number(String(el.value).replace(/\D/g, '')) || 0 : 0; };
  var val = function (name) { var el = form.elements[name]; return el ? (el.value || '') : ''; };

  /* Proyecto que viene desde la ficha del catálogo (?proyecto=) */
  var proyectoParam = new URLSearchParams(location.search).get('proyecto');
  if (proyectoParam) d.getElementById('proyecto').value = proyectoParam.slice(0, 120);

  /* Formato de montos en pesos mientras se escribe */
  form.querySelectorAll('[data-money]').forEach(function (input) {
    input.addEventListener('input', function () {
      var digits = input.value.replace(/\D/g, '').slice(0, 11);
      input.value = digits ? '$' + Number(digits).toLocaleString('es-CL') : '';
    });
  });

  /* Complemento de renta: el panel aparece y sus campos pasan a obligatorios */
  var compPanel = d.getElementById('comp-panel');
  function syncComplemento() {
    var on = val('complementa') === 'si';
    compPanel.hidden = !on;
    compPanel.querySelectorAll('[data-required-if-comp]').forEach(function (f) { f.required = on; });
  }

  function showStep(i) {
    current = i;
    steps.forEach(function (s, k) { s.hidden = k !== i; });
    progress.forEach(function (li, k) {
      li.classList.toggle('is-done', k < i);
      li.classList.toggle('is-current', k === i);
      if (k === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    btnBack.hidden = i === 0;
    btnNext.hidden = i === steps.length - 1;
    btnSubmit.hidden = i !== steps.length - 1;
    d.getElementById('step-count').textContent = 'Paso ' + (i + 1) + ' de ' + steps.length;
    stepError.hidden = true;
  }

  function validateStep(i) {
    var step = steps[i];
    var firstBad = null;
    step.querySelectorAll('input[required], select[required], textarea[required]').forEach(function (f) {
      /* Un campo dentro de un panel oculto (complemento en "no") no se exige */
      if (f.closest('[hidden]') && f.closest('[hidden]') !== step) return;
      var bad = !f.checkValidity() || (f.hasAttribute('data-money') && f.value === '');
      if (f.type !== 'checkbox') f.classList.toggle('is-invalid', bad);
      if (bad && !firstBad) firstBad = f;
    });
    step.querySelectorAll('.choice-group[data-required]').forEach(function (g) {
      var ok = !!g.querySelector('input:checked');
      g.classList.toggle('is-invalid', !ok);
      if (!ok && !firstBad) firstBad = g.querySelector('input');
    });
    stepError.textContent = 'Completa los campos marcados para continuar.';
    stepError.hidden = !firstBad;
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  function goTo(i) {
    showStep(i);
    d.getElementById('wizard').scrollIntoView({ block: 'start' });
    steps[i].querySelector('.step__title').focus({ preventScroll: true });
  }

  btnNext.addEventListener('click', function () { if (validateStep(current)) goTo(current + 1); });
  btnBack.addEventListener('click', function () { goTo(current - 1); });

  form.addEventListener('change', function (e) {
    if (e.target.name === 'complementa') syncComplemento();
    var g = e.target.closest('.choice-group');
    if (g) g.classList.remove('is-invalid');
    e.target.classList.remove('is-invalid');
    diagnose();
  });
  form.addEventListener('input', diagnose);

  /* ---------- Pre-diagnóstico referencial ---------- */
  function diagnose() {
    var renta = money('renta');
    var empty = d.getElementById('diag-empty');
    var body = d.getElementById('diag-body');
    if (!renta) { empty.hidden = false; body.hidden = true; toggleMini(false); return null; }
    empty.hidden = true; body.hidden = false;

    var comp = val('complementa') === 'si' ? money('comp_renta') : 0;
    var rentaTotal = renta + money('otros_ingresos') + comp;
    var deudas = money('deuda_consumo') + money('deuda_tarjetas') + money('deuda_hipotecario');
    /* El dividendo lo acota lo que sea más estricto: el tope por renta o el que
       deja libre la carga financiera ya comprometida. */
    var dividendo = Math.max(0, Math.min(CFG.DIV_MAX * rentaTotal, CFG.CARGA_MAX * rentaTotal - deudas));
    var creditoUF = creditoDesdeDividendo(dividendo);
    var precioUF = creditoUF / (1 - CFG.PIE);
    var pieUF = precioUF * CFG.PIE;
    var ahorroUF = money('ahorro_pie') / CFG.UF;
    var carga = rentaTotal > 0 ? deudas / rentaTotal : 0;

    var ok = [], warn = [], severo = false;
    var situacion = val('situacion'), antig = val('antiguedad'), dicom = val('dicom'), edad = Number(val('edad')) || 0;

    if (situacion === 'Dependiente con contrato indefinido' && antig && antig !== 'Menos de 1 año') ok.push('Contrato indefinido con antigüedad: muy bien valorado por los bancos.');
    if (antig === 'Menos de 1 año') warn.push('Antigüedad menor a 1 año: varios bancos piden entre 1 y 2 años.');
    if (situacion === 'Dependiente con contrato a plazo fijo') warn.push('Contrato a plazo fijo: los bancos suelen preferir contrato indefinido.');
    if (situacion === 'Independiente con boletas de honorarios' || situacion === 'Empresario/a o socio/a') warn.push('Como independiente te pedirán tus últimas declaraciones de renta (F22) y boletas.');
    if (dicom === 'No registro morosidades') ok.push('Sin morosidades declaradas.');
    if (dicom === 'Sí, tengo morosidades vigentes') { warn.push('Morosidades vigentes: hay que regularizarlas antes de postular al crédito.'); severo = true; }
    if (dicom === 'No lo sé') warn.push('Revisa tu informe comercial; Marcela te ayuda a interpretarlo.');
    if (val('residencia') === 'Extranjera con residencia temporal') { warn.push('La mayoría de los bancos exige residencia definitiva.'); severo = true; }
    if (renta < CFG.RENTA_MIN && !comp) warn.push('Renta bajo el mínimo de algunos bancos: complementar renta puede ayudarte.');
    if (comp) ok.push('Complementar renta aumenta tu capacidad de crédito.');
    if (carga > 0.2) warn.push('Tus deudas ya usan ' + Math.round(carga * 100) + '% de tu renta: reducirlas aumenta tu capacidad.');
    else if (rentaTotal > 0 && val('propiedades')) ok.push('Carga financiera saludable.');
    if (edad >= 60) warn.push('Por edad, el plazo del crédito podría ser menor a 25 años.');
    if (val('ahorro_pie') !== '' && precioUF > 0) {
      if (ahorroUF >= pieUF) ok.push('Tu ahorro cubre el pie estimado.');
      else warn.push('Para el pie te faltarían ≈ ' + ufFmt(pieUF - ahorroUF) + ': muchos proyectos en verde permiten pagarlo en cuotas.');
    }
    if (dividendo <= 0) severo = true;

    var status = d.getElementById('diag-status');
    status.className = 'diag__status ' + (severo ? 'diag__status--risk' : warn.length >= 2 ? 'diag__status--warn' : 'diag__status--ok');
    status.textContent = severo ? 'Requiere revisión' : warn.length >= 2 ? 'Perfil con observaciones' : 'Perfil favorable';

    d.getElementById('diag-precio').textContent = ufFmt(precioUF);
    d.getElementById('diag-precio-clp').textContent = '≈ ' + clp(precioUF * CFG.UF);
    d.getElementById('diag-carga-label').textContent = 'Carga financiera actual: ' + Math.round(carga * 100) + '% de tu renta';
    var meter = d.getElementById('diag-meter');
    meter.style.width = Math.min(100, carga / CFG.CARGA_MAX * 100) + '%';
    meter.style.backgroundColor = carga <= 0.2 ? '#4E8D6E' : carga <= 0.35 ? '#C8A868' : '#A9605C';
    d.getElementById('diag-renta').textContent = clp(rentaTotal);
    d.getElementById('diag-div').textContent = clp(dividendo);
    d.getElementById('diag-credito').textContent = ufFmt(creditoUF);
    d.getElementById('diag-pie').textContent = ufFmt(pieUF);
    d.getElementById('diag-ahorro').textContent = ufFmt(ahorroUF);
    d.getElementById('diag-flags').innerHTML =
      ok.map(function (t) { return '<li class="ok">' + esc(t) + '</li>'; }).join('') +
      warn.map(function (t) { return '<li class="warn">' + esc(t) + '</li>'; }).join('');

    var calzan = proyectosQueCalzan(precioUF);
    d.getElementById('diag-matches').innerHTML = calzan.length
      ? '<div class="diag__label">' + calzan.length + (calzan.length === 1 ? ' proyecto calza' : ' proyectos calzan') + ' con tu capacidad</div>' +
        calzan.slice(0, 3).map(function (p) {
          return '<a href="' + urlProyecto(p) + '">' + esc(p.nombre) + '<span>' + ufFmt(p.uf) + '</span></a>';
        }).join('')
      : '<div class="diag__label">Por ahora ningún proyecto del catálogo calza con esta estimación. Marcela te mostrará alternativas y cómo aumentar tu capacidad.</div>';

    d.getElementById('mini-precio').textContent = ufFmt(precioUF);
    toggleMini(!enviado);

    return {
      status: status.textContent,
      precioUF: Math.round(precioUF), creditoUF: Math.round(creditoUF),
      dividendo: Math.round(dividendo), carga: Math.round(carga * 100)
    };
  }

  /* Primero los de las comunas marcadas; dentro de cada grupo, los más
     cercanos al tope de la capacidad (aprovechan mejor el crédito). */
  function proyectosQueCalzan(precioUF) {
    var comunas = Array.prototype.map.call(form.querySelectorAll('input[name="comunas"]:checked'), function (c) { return c.value; })
      .filter(function (c) { return c !== 'Me da igual'; });
    return PROYECTOS.filter(function (p) { return p.uf <= precioUF; }).sort(function (a, b) {
      var ca = comunas.indexOf(a.comuna) >= 0 ? 0 : 1, cb = comunas.indexOf(b.comuna) >= 0 ? 0 : 1;
      return ca - cb || b.uf - a.uf;
    });
  }

  function toggleMini(on) {
    if (!mini) return;
    mini.classList.toggle('is-visible', on);
    d.body.classList.toggle('has-diag-mini', on);
  }

  /* Los supuestos que se muestran salen de CFG, igual que el cálculo */
  d.getElementById('diag-note').textContent =
    'Estimación referencial: dividendo de hasta ' + Math.round(CFG.DIV_MAX * 100) +
    '% de la renta líquida, carga financiera total de hasta ' + Math.round(CFG.CARGA_MAX * 100) +
    '%, tasa ' + (CFG.TASA_ANUAL * 100).toLocaleString('es-CL') + '% anual, ' + CFG.PLAZO_MESES / 12 +
    ' años, pie ' + Math.round(CFG.PIE * 100) + '% y UF de $' + CFG.UF.toLocaleString('es-CL') +
    '. No es una aprobación de crédito: la evaluación formal la hace Marcela junto a los bancos.';

  /* ---------- Envío ---------- */
  var t0 = Date.now();   // para descartar bots que completan al instante

  function datosDe() {
    var datos = {};
    new FormData(form).forEach(function (v, k) {
      v = String(v).slice(0, 1000);
      if (k === 'comunas') (datos.comunas = datos.comunas || []).push(v);
      else datos[k] = v;
    });
    return datos;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateStep(current)) return;

    var tel = form.elements.telefono;
    if (!telefonoValido(tel.value)) {
      goTo(0);
      tel.classList.add('is-invalid');
      stepError.textContent = 'Revisa tu teléfono: deben ser entre 8 y 15 dígitos.';
      stepError.hidden = false;
      tel.focus();
      return;
    }

    var prediagnostico = diagnose();
    var datos = datosDe();
    datos.prediagnostico = prediagnostico;

    /* Bots: se les responde como si todo hubiera ido bien, sin enviar nada */
    if (datos.sitio_web_empresa || Date.now() - t0 < 3000) {
      delete datos.sitio_web_empresa;
      mostrarConfirmacion(prediagnostico, datos);
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.classList.add('is-loading');
    stepError.hidden = true;

    fetch('/api/evaluacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datos: datos, pagina: 'evaluacion' })
    }).then(function (res) {
      if (!res.ok) throw new Error(res.status === 429
        ? 'Recibimos varios envíos seguidos desde este navegador. Espera unos minutos o escríbenos por WhatsApp.'
        : 'No pudimos enviar tu evaluación. Inténtalo de nuevo o escríbenos por WhatsApp.');
      mostrarConfirmacion(prediagnostico, datos);
    }).catch(function (err) {
      btnSubmit.disabled = false;
      btnSubmit.classList.remove('is-loading');
      stepError.textContent = err.message;
      stepError.hidden = false;
    });
  });

  function mostrarConfirmacion(prediagnostico, datos) {
    var nombre = datos.nombre || '';
    d.getElementById('done-title').textContent = '¡Gracias, ' + nombre + '! Recibimos tu evaluación.';

    var filas = [
      ['Situación laboral', datos.situacion + ' · ' + datos.antiguedad],
      ['Renta líquida', datos.renta + (datos.complementa === 'si' ? ' + complemento ' + datos.comp_renta : '')],
      ['Ahorro para el pie', datos.ahorro_pie],
      ['Objetivo', datos.objetivo + ' · ' + datos.cantidad + (datos.cantidad === '1' ? ' propiedad' : ' propiedades')],
      ['Comunas de interés', (datos.comunas || ['Sin preferencia']).join(', ')],
      ['Proyecto de interés', datos.proyecto || '—'],
      ['Contacto', datos.canal + (datos.horario ? ' · ' + datos.horario : '')],
      ['Pre-diagnóstico', prediagnostico ? prediagnostico.status + ' · hasta ' + ufFmt(prediagnostico.precioUF) : '—']
    ];
    d.getElementById('summary').innerHTML = filas.map(function (f) {
      return '<tr><th>' + esc(f[0]) + '</th><td>' + esc(f[1]) + '</td></tr>';
    }).join('');

    if (prediagnostico) {
      var sugeridos = proyectosQueCalzan(prediagnostico.precioUF).slice(0, 3);
      if (sugeridos.length) {
        d.getElementById('done-projects').hidden = false;
        d.getElementById('done-list').innerHTML = sugeridos.map(function (p) {
          return '<a class="done__card" href="' + urlProyecto(p) + '">' +
            '<span class="badge">' + esc(p.comuna) + '</span>' +
            '<strong>' + esc(p.nombre) + '</strong>' +
            '<span class="done__card-uf">Desde ' + ufFmt(p.uf) + '</span></a>';
        }).join('');
      }
    }

    d.getElementById('done-wa').href = wa(
      'Hola Marcela, soy ' + nombre + ' ' + (datos.apellido || '') +
      '. Acabo de completar la evaluación de perfil' + (datos.proyecto ? ' y me interesa ' + datos.proyecto : '') + '.'
    );

    enviado = true;
    toggleMini(false);
    form.hidden = true;
    d.getElementById('progress').hidden = true;
    var done = d.getElementById('done');
    done.classList.add('is-visible');
    d.getElementById('wizard').scrollIntoView({ block: 'start' });
    done.focus({ preventScroll: true });
  }

  showStep(0);
})();
