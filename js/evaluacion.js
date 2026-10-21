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

  /* ---------- Plantilla ----------
     El wizard se monta desde aquí y no desde el HTML para que la portada y
     /evaluacion compartan una sola fuente: son el mismo formulario escribiendo
     en la misma tabla, y dos copias del marcado acabarían divergiendo.
     Ambas páginas solo necesitan <div id="eval-mount"></div>. */
  var MARKUP = `
<div class="wizard panel" id="wizard">
  <ol class="progress-steps" id="progress" aria-label="Progreso de la evaluación">
    <li class="is-current">Tus datos</li>
    <li>Trabajo e ingresos</li>
    <li>Deudas y ahorro</li>
    <li>Complemento</li>
    <li>Tu objetivo</li>
  </ol>

  <form id="eval-form" novalidate>

    <!-- Trampa para bots: invisible y fuera del orden de tabulación -->
    <div class="hp" aria-hidden="true">
      <label>No completar<input type="text" name="sitio_web_empresa" tabindex="-1" autocomplete="off"></label>
    </div>

    <!-- PASO 1 -->
    <fieldset class="step" data-step="1">
      <legend class="step__title" tabindex="-1">Cuéntanos sobre ti</legend>
      <p class="step__hint">Uso estos datos para contactarte y para conocer tu situación personal.</p>
      <div class="form-grid">
        <label class="field">Nombre<input type="text" name="nombre" autocomplete="given-name" placeholder="Tu nombre" required></label>
        <label class="field">Apellido<input type="text" name="apellido" autocomplete="family-name" placeholder="Tu apellido" required></label>
        <label class="field">Correo electrónico<input type="email" name="email" autocomplete="email" placeholder="nombre@correo.cl" required></label>
        <label class="field">Teléfono<input type="tel" name="telefono" autocomplete="tel" placeholder="+56 9" required></label>
        <label class="field">Edad<input type="number" name="edad" min="18" max="85" inputmode="numeric" placeholder="Ej: 32" required></label>
        <label class="field">Comuna donde vives<input type="text" name="comuna_residencia" autocomplete="address-level2" placeholder="Ej: Ñuñoa" required></label>
        <fieldset class="choice-group full" data-required>
          <legend>Estado civil</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="estado_civil" value="Soltero/a"><span>Soltero/a</span></label>
            <label class="choice"><input type="radio" name="estado_civil" value="Casado/a"><span>Casado/a</span></label>
            <label class="choice"><input type="radio" name="estado_civil" value="Conviviente civil"><span>Conviviente civil</span></label>
            <label class="choice"><input type="radio" name="estado_civil" value="Divorciado/a o viudo/a"><span>Divorciado/a o viudo/a</span></label>
          </div>
        </fieldset>
        <fieldset class="choice-group full" data-required>
          <legend>Nacionalidad y residencia</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="residencia" value="Chilena"><span>Chilena</span></label>
            <label class="choice"><input type="radio" name="residencia" value="Extranjera con residencia definitiva"><span>Extranjera con residencia definitiva</span></label>
            <label class="choice"><input type="radio" name="residencia" value="Extranjera con residencia temporal"><span>Extranjera con residencia temporal</span></label>
          </div>
        </fieldset>
      </div>
    </fieldset>

    <!-- PASO 2 -->
    <fieldset class="step" data-step="2" hidden>
      <legend class="step__title" tabindex="-1">Trabajo e ingresos</legend>
      <p class="step__hint">Los bancos evalúan tu renta líquida (lo que recibes después de descuentos), tu tipo de contrato y tu antigüedad laboral.</p>
      <div class="form-grid">
        <fieldset class="choice-group full" data-required>
          <legend>Situación laboral</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="situacion" value="Dependiente con contrato indefinido"><span>Contrato indefinido</span></label>
            <label class="choice"><input type="radio" name="situacion" value="Dependiente con contrato a plazo fijo"><span>Contrato a plazo fijo</span></label>
            <label class="choice"><input type="radio" name="situacion" value="Independiente con boletas de honorarios"><span>Independiente (boletas)</span></label>
            <label class="choice"><input type="radio" name="situacion" value="Empresario/a o socio/a"><span>Empresario/a o socio/a</span></label>
            <label class="choice"><input type="radio" name="situacion" value="Jubilado/a o pensionado/a"><span>Jubilado/a o pensionado/a</span></label>
          </div>
        </fieldset>
        <fieldset class="choice-group full" data-required>
          <legend>Antigüedad laboral (o desde tu inicio de actividades)</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="antiguedad" value="Menos de 1 año"><span>Menos de 1 año</span></label>
            <label class="choice"><input type="radio" name="antiguedad" value="1 a 2 años"><span>1 a 2 años</span></label>
            <label class="choice"><input type="radio" name="antiguedad" value="2 a 5 años"><span>2 a 5 años</span></label>
            <label class="choice"><input type="radio" name="antiguedad" value="Más de 5 años"><span>Más de 5 años</span></label>
          </div>
        </fieldset>
        <label class="field">Renta líquida mensual<input type="text" name="renta" inputmode="numeric" data-money placeholder="$ 0" required></label>
        <label class="field"><span>Otros ingresos demostrables <span class="field__opt">(opcional)</span></span><input type="text" name="otros_ingresos" inputmode="numeric" data-money placeholder="Arriendos, pensiones, etc."></label>
      </div>
    </fieldset>

    <!-- PASO 3 -->
    <fieldset class="step" data-step="3" hidden>
      <legend class="step__title" tabindex="-1">Deudas y ahorro</legend>
      <p class="step__hint">Indica cuánto pagas al mes en cada tipo de deuda. Si no tienes, déjalo en blanco. Esto define tu carga financiera.</p>
      <div class="form-grid">
        <label class="field">Créditos de consumo o automotriz<input type="text" name="deuda_consumo" inputmode="numeric" data-money placeholder="$ 0 al mes"></label>
        <label class="field">Tarjetas y líneas de crédito<input type="text" name="deuda_tarjetas" inputmode="numeric" data-money placeholder="$ 0 al mes"></label>
        <label class="field">Dividendo hipotecario actual<input type="text" name="deuda_hipotecario" inputmode="numeric" data-money placeholder="$ 0 al mes"></label>
        <fieldset class="choice-group full" data-required>
          <legend>¿Tienes propiedades a tu nombre?</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="propiedades" value="No"><span>No</span></label>
            <label class="choice"><input type="radio" name="propiedades" value="Sí, una"><span>Sí, una</span></label>
            <label class="choice"><input type="radio" name="propiedades" value="Sí, dos o más"><span>Sí, dos o más</span></label>
          </div>
        </fieldset>
        <fieldset class="choice-group full" data-required>
          <legend>¿Registras morosidades o deudas impagas (DICOM)?</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="dicom" value="No registro morosidades"><span>No</span></label>
            <label class="choice"><input type="radio" name="dicom" value="Sí, pero ya están regularizadas"><span>Sí, ya regularizadas</span></label>
            <label class="choice"><input type="radio" name="dicom" value="Sí, tengo morosidades vigentes"><span>Sí, vigentes</span></label>
            <label class="choice"><input type="radio" name="dicom" value="No lo sé"><span>No lo sé</span></label>
          </div>
        </fieldset>
        <label class="field">Ahorro disponible para el pie<input type="text" name="ahorro_pie" inputmode="numeric" data-money placeholder="$ 0" required></label>
        <label class="field"><span>Capacidad de ahorro mensual <span class="field__opt">(opcional)</span></span><input type="text" name="ahorro_mensual" inputmode="numeric" data-money placeholder="$ 0 al mes"></label>
      </div>
    </fieldset>

    <!-- PASO 4 -->
    <fieldset class="step" data-step="4" hidden>
      <legend class="step__title" tabindex="-1">Complemento de renta</legend>
      <p class="step__hint">Sumar la renta de otra persona (cónyuge, pareja o familiar directo) puede aumentar el crédito al que puedes optar.</p>
      <div class="form-grid">
        <fieldset class="choice-group full" data-required>
          <legend>¿Complementarás renta con otra persona?</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="complementa" value="si"><span>Sí</span></label>
            <label class="choice"><input type="radio" name="complementa" value="no"><span>No</span></label>
            <label class="choice"><input type="radio" name="complementa" value="no-se"><span>Aún no lo sé</span></label>
          </div>
        </fieldset>
        <div class="subpanel" id="comp-panel" hidden>
          <label class="field">Relación
            <select name="comp_relacion" data-required-if-comp>
              <option value="">Selecciona</option>
              <option>Cónyuge</option>
              <option>Conviviente civil</option>
              <option>Pareja</option>
              <option>Familiar directo (padre, madre, hermano/a, hijo/a)</option>
            </select>
          </label>
          <label class="field">Su renta líquida mensual<input type="text" name="comp_renta" inputmode="numeric" data-money placeholder="$ 0" data-required-if-comp></label>
          <label class="field">Su situación laboral
            <select name="comp_situacion" data-required-if-comp>
              <option value="">Selecciona</option>
              <option>Contrato indefinido</option>
              <option>Contrato a plazo fijo</option>
              <option>Independiente (boletas)</option>
              <option>Empresario/a o socio/a</option>
              <option>Jubilado/a o pensionado/a</option>
            </select>
          </label>
          <label class="field">Su antigüedad laboral
            <select name="comp_antiguedad">
              <option value="">Selecciona</option>
              <option>Menos de 1 año</option>
              <option>1 a 2 años</option>
              <option>2 a 5 años</option>
              <option>Más de 5 años</option>
            </select>
          </label>
        </div>
      </div>
    </fieldset>

    <!-- PASO 5 -->
    <fieldset class="step" data-step="5" hidden>
      <legend class="step__title" tabindex="-1">Tu objetivo</legend>
      <p class="step__hint">Con esto filtro los proyectos que voy a recomendarte.</p>
      <div class="form-grid">
        <fieldset class="choice-group full" data-required>
          <legend>¿Para qué quieres la propiedad?</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="objetivo" value="Invertir para arrendar"><span>Invertir para arrendar</span></label>
            <label class="choice"><input type="radio" name="objetivo" value="Comprar para vivir"><span>Comprar para vivir</span></label>
            <label class="choice"><input type="radio" name="objetivo" value="Ambas"><span>Ambas</span></label>
          </div>
        </fieldset>
        <fieldset class="choice-group full" data-required>
          <legend>¿Cuántas propiedades te interesan?</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="cantidad" value="1"><span>1</span></label>
            <label class="choice"><input type="radio" name="cantidad" value="2"><span>2</span></label>
            <label class="choice"><input type="radio" name="cantidad" value="3 o más"><span>3 o más</span></label>
          </div>
        </fieldset>
        <fieldset class="choice-group full">
          <legend>Comunas de interés <span class="field__opt">(puedes marcar varias)</span></legend>
          <div class="choices" id="comunas-choices"></div>
        </fieldset>
        <fieldset class="choice-group full">
          <legend>Tipo de entrega preferida</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="entrega" value="Inmediata"><span>Inmediata</span></label>
            <label class="choice"><input type="radio" name="entrega" value="Futura (en verde o en blanco)"><span>Futura (en verde o en blanco)</span></label>
            <label class="choice"><input type="radio" name="entrega" value="Me da igual"><span>Me da igual</span></label>
          </div>
        </fieldset>
        <fieldset class="choice-group full" data-required>
          <legend>¿Cuándo te gustaría invertir?</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="plazo" value="Lo antes posible"><span>Lo antes posible</span></label>
            <label class="choice"><input type="radio" name="plazo" value="En los próximos 3 meses"><span>En 3 meses</span></label>
            <label class="choice"><input type="radio" name="plazo" value="En 6 meses o más"><span>En 6 meses o más</span></label>
            <label class="choice"><input type="radio" name="plazo" value="Solo estoy explorando"><span>Solo estoy explorando</span></label>
          </div>
        </fieldset>
        <label class="field full"><span>Proyecto de interés <span class="field__opt">(opcional)</span></span><input type="text" name="proyecto" id="proyecto" placeholder="Ej: Ñuñoa 2024"></label>
        <fieldset class="choice-group" data-required>
          <legend>¿Cómo prefieres que te contacte?</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="canal" value="WhatsApp"><span>WhatsApp</span></label>
            <label class="choice"><input type="radio" name="canal" value="Llamada"><span>Llamada</span></label>
            <label class="choice"><input type="radio" name="canal" value="Correo"><span>Correo</span></label>
          </div>
        </fieldset>
        <fieldset class="choice-group">
          <legend>Horario preferido</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="horario" value="Mañana (9 a 13 h)"><span>Mañana</span></label>
            <label class="choice"><input type="radio" name="horario" value="Tarde (13 a 18 h)"><span>Tarde</span></label>
            <label class="choice"><input type="radio" name="horario" value="Después de las 18 h"><span>Después de las 18 h</span></label>
          </div>
        </fieldset>
        <label class="field full"><span>¿Algo más que deba saber? <span class="field__opt">(opcional)</span></span><textarea name="comentarios" rows="3" placeholder="Ej: quiero usar mi subsidio, tengo un crédito por terminar, etc."></textarea></label>
        <label class="check full"><input type="checkbox" name="acepto" value="si" required>
          <span class="check__box" aria-hidden="true"><svg viewBox="0 0 10 8"><path pathLength="1" d="M1 4l2.5 2.5L9 1"/></svg></span>
          <span>Autorizo a Marcela Díaz Inversiones a usar estos datos para evaluar mi perfil y contactarme.</span>
        </label>
      </div>
      <p class="privacy-note">
        No te pido claves bancarias ni documentos en esta etapa, y no consulto tu DICOM: el pre-diagnóstico usa solo lo que declaras. Los antecedentes (liquidaciones, cotizaciones, carpeta tributaria) se solicitan más adelante.
      </p>
    </fieldset>

    <p class="form__error" id="step-error" role="alert" hidden></p>

    <div class="wizard__nav">
      <button type="button" class="btn btn--sm btn--ghost" id="btn-back" hidden>← Volver</button>
      <span class="wizard__count" id="step-count">Paso 1 de 5</span>
      <button type="button" class="btn" id="btn-next">Continuar →</button>
      <button type="submit" class="btn" id="btn-submit" hidden>Enviar evaluación</button>
    </div>
  </form>

  <!-- CONFIRMACIÓN -->
  <div class="done" id="done" role="status" tabindex="-1">
    <div class="done__head">
      <svg class="success__icon" viewBox="0 0 56 56" aria-hidden="true">
        <circle pathLength="1" cx="28" cy="28" r="26"/>
        <path pathLength="1" d="M18 29l7 7 14-16"/>
      </svg>
      <h2 id="done-title">¡Recibimos tu evaluación!</h2>
      <p>Revisaré tu perfil y te contactaré por el canal que elegiste con tus alternativas de inversión.</p>
    </div>
    <ol class="next-steps">
      <li><strong>Reviso tu perfil</strong>Analizo renta, deudas, ahorro y complemento como lo haría un banco.</li>
      <li><strong>Te contacto</strong>Conversamos tus resultados y resolvemos tus dudas.</li>
      <li><strong>Armamos tu carpeta</strong>Te pido los antecedentes para presentarte a los bancos.</li>
    </ol>
    <table class="summary" id="summary" aria-label="Resumen de tu evaluación"></table>
    <div class="done__projects" id="done-projects" hidden>
      <h3>Proyectos que podrían calzar contigo</h3>
      <div class="done__cards" id="done-list"></div>
    </div>
    <div class="done__actions">
      <a class="btn" id="done-wa" href="https://wa.me/56951497482" target="_blank" rel="noopener">Escribir a Marcela por WhatsApp</a>
      <a class="btn btn--ghost" href="/#proyectos">Ver proyectos</a>
    </div>
  </div>
</div>

<!-- PRE-DIAGNÓSTICO -->
<aside class="diag" id="diag" aria-live="polite" aria-label="Tu pre-diagnóstico">
  <div class="kicker kicker--rose diag__kicker">
    <span class="kicker__line"></span><span>Tu pre-diagnóstico</span><span class="kicker__line"></span>
  </div>
  <p class="diag__empty" id="diag-empty">Cuando ingreses tu renta (paso 2) verás aquí una estimación referencial de tu capacidad de inversión.</p>
  <div id="diag-body" class="diag__body" hidden>
    <span class="diag__status" id="diag-status">—</span>
    <div>
      <div class="diag__label">Podrías optar a propiedades de hasta</div>
      <div class="diag__big" id="diag-precio">UF 0</div>
      <div class="diag__label" id="diag-precio-clp">≈ $0</div>
    </div>
    <div>
      <div class="diag__label" id="diag-carga-label">Carga financiera actual: 0% de tu renta</div>
      <div class="meter" aria-hidden="true"><span id="diag-meter"></span></div>
    </div>
    <div class="diag__row"><span>Renta considerada</span><strong id="diag-renta">$0</strong></div>
    <div class="diag__row"><span>Dividendo máximo referencial</span><strong id="diag-div">$0</strong></div>
    <div class="diag__row"><span>Crédito estimado</span><strong id="diag-credito">UF 0</strong></div>
    <div class="diag__row"><span>Pie requerido (20%)</span><strong id="diag-pie">UF 0</strong></div>
    <div class="diag__row"><span>Tu ahorro para el pie</span><strong id="diag-ahorro">UF 0</strong></div>
    <ul class="flags" id="diag-flags"></ul>
    <div class="diag__matches" id="diag-matches"></div>
  </div>
  <p class="diag__note" id="diag-note"></p>
</aside>
`;

  var mount = d.getElementById('eval-mount');
  if (mount && !d.getElementById('eval-form')) mount.innerHTML = MARKUP;

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
