// ─────────────────────────────────────────────────────────────
// Marcela Díaz Inversiones — receptor del evaluador de perfil
// Vercel Serverless Function (Node 18+) · POST /api/evaluacion
//
// Es .mjs a propósito: así usa ESM sin necesidad de un package.json, que
// cambiaría cómo Vercel detecta el proyecto (hoy es estático, sin build).
//
// Variables de entorno — se configuran en Vercel, nunca en el código:
//
//   ALLOWED_ORIGINS   Obligatoria. Dominios permitidos, separados por coma.
//                     Ej: https://mdiaz.cl,https://www.mdiaz.cl
//                     Sin esto la función rechaza todo: es el cierre por omisión.
//
//   SUPABASE_URL      Obligatorias para guardar. La clave es la ANON, no la
//   SUPABASE_ANON_KEY service_role: la tabla md_leads solo le concede INSERT
//                     (ver supabase/leads.sql). Esta base está compartida con
//                     la operación de Brouk, así que una service_role aquí
//                     daría acceso a todo si se filtrara.
//
//   TURNSTILE_SECRET  Opcional pero recomendada. Anti-bots de Cloudflare.
//   RESEND_API_KEY    Opcionales. Avisan por correo de cada evaluación.
//   NOTIFY_EMAIL      Destinatario(s), separados por coma.
//   FROM_EMAIL        Remitente verificado en Resend.
//
// Si no hay ningún destino configurado responde 503 en vez de fingir éxito:
// una evaluación que se pierde en silencio es peor que un error visible.
// ─────────────────────────────────────────────────────────────

const MAX_BYTES = 20000;
const LIMITE_POR_IP = 6;
const VENTANA_MS = 10 * 60 * 1000;

// La memoria vive por instancia: frena ráfagas, no un ataque distribuido.
// Para eso haría falta un almacén compartido (Upstash/Redis).
const intentos = new Map();

// Lista blanca: [largo máximo, obligatorio]. Lo que no esté aquí se descarta,
// así un campo inyectado en el formulario del cliente nunca llega a la base.
const CAMPOS = {
  nombre: [80, true], apellido: [80, true], email: [120, true], telefono: [20, true],
  edad: [3, true], comuna_residencia: [80, true], estado_civil: [40, true], residencia: [60, true],
  situacion: [60, true], antiguedad: [30, true], renta: [20, true], otros_ingresos: [20],
  deuda_consumo: [20], deuda_tarjetas: [20], deuda_hipotecario: [20],
  propiedades: [30, true], dicom: [60, true], ahorro_pie: [20, true], ahorro_mensual: [20],
  complementa: [10, true], comp_relacion: [80], comp_renta: [20], comp_situacion: [60], comp_antiguedad: [30],
  objetivo: [40, true], cantidad: [10, true], comunas: [400], entrega: [60], plazo: [60, true],
  proyecto: [120], canal: [20, true], horario: [40], comentarios: [1000], acepto: [5, true],
};

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i;

const limpiar = (v, max) =>
  String(v).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/[<>]/g, '').replace(/\s{2,}/g, ' ').trim().slice(0, max);

const escHtml = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ipDe = (req) =>
  String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();

function limiteExcedido(ip) {
  const ahora = Date.now();
  const lista = (intentos.get(ip) || []).filter((t) => ahora - t < VENTANA_MS);
  lista.push(ahora);
  intentos.set(ip, lista);
  // Poda: sin esto el Map crece sin tope durante la vida de la instancia.
  if (intentos.size > 5000) {
    for (const [k, v] of intentos) if (!v.some((t) => ahora - t < VENTANA_MS)) intentos.delete(k);
  }
  return lista.length > LIMITE_POR_IP;
}

function validar(datos) {
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) return null;
  const limpio = {};
  for (const [campo, [max, obligatorio]] of Object.entries(CAMPOS)) {
    let v = datos[campo];
    if (Array.isArray(v)) v = v.map(String).join(', ');
    if (v == null || v === '') {
      if (obligatorio) return null;
      continue;
    }
    if (typeof v !== 'string' && typeof v !== 'number') return null;
    limpio[campo] = limpiar(v, max);
  }
  if (!EMAIL_RE.test(limpio.email)) return null;
  const digitos = limpio.telefono.replace(/\D/g, '');
  if (digitos.length < 8 || digitos.length > 15) return null;

  // El pre-diagnóstico se acepta solo como números: lo calcula el navegador,
  // así que no es un dato de confianza y Marcela lo recalcula de todas formas.
  const p = datos.prediagnostico;
  if (p && typeof p === 'object' && !Array.isArray(p)) {
    limpio.prediagnostico = {
      status: limpiar(p.status || '', 40),
      precioUF: Number(p.precioUF) || 0,
      creditoUF: Number(p.creditoUF) || 0,
      dividendo: Number(p.dividendo) || 0,
      carga: Number(p.carga) || 0,
    };
  }
  return limpio;
}

async function verificarTurnstile(token, ip) {
  if (!process.env.TURNSTILE_SECRET) return true;
  if (!token || typeof token !== 'string' || token.length > 2048) return false;
  const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: token, remoteip: ip });
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const j = await r.json().catch(() => ({}));
  return j.success === true;
}

// Guarda y avisa. Solo falla si NINGÚN destino recibió el lead: si el correo
// cae pero la base lo guardó, la evaluación no se pierde.
async function entregar(datos, pagina) {
  const tareas = [];
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (url && key) {
    tareas.push(fetch(`${url.replace(/\/+$/, '')}/rest/v1/md_leads`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ tipo: 'evaluacion', pagina, datos }),
    }));
  }

  if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL && process.env.FROM_EMAIL) {
    const filas = Object.entries(datos).map(([k, v]) =>
      `<tr><th align="left" style="padding:4px 14px 4px 0;white-space:nowrap">${escHtml(k)}</th>` +
      `<td>${escHtml(typeof v === 'object' ? JSON.stringify(v) : v)}</td></tr>`).join('');
    const pre = datos.prediagnostico;
    tareas.push(fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL,
        to: process.env.NOTIFY_EMAIL.split(',').map((s) => s.trim()).filter(Boolean),
        subject: `Evaluación de perfil: ${datos.nombre} ${datos.apellido}` + (pre ? ` · ${pre.status}` : ''),
        html: `<p>Nueva evaluación desde <b>${escHtml(pagina)}</b></p><table>${filas}</table>`,
      }),
    }));
  }

  if (!tareas.length) throw new Error('sin-destino');

  const resultados = await Promise.allSettled(tareas);
  const alguno = resultados.some((r) => r.status === 'fulfilled' && r.value && r.value.ok);
  if (!alguno) throw new Error('destino');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'metodo' });

  // Cierre por omisión: sin ALLOWED_ORIGINS configurada no se acepta nada.
  const permitidos = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const origen = req.headers.origin || '';
  if (!permitidos.length || !permitidos.includes(origen)) return res.status(403).json({ ok: false, error: 'origen' });

  if (!String(req.headers['content-type'] || '').includes('application/json')) return res.status(415).json({ ok: false });
  if (Number(req.headers['content-length'] || 0) > MAX_BYTES) return res.status(413).json({ ok: false });

  const ip = ipDe(req);
  if (limiteExcedido(ip)) return res.status(429).json({ ok: false, error: 'limite' });

  const cuerpo = typeof req.body === 'object' && req.body !== null ? req.body : {};
  if (JSON.stringify(cuerpo).length > MAX_BYTES) return res.status(413).json({ ok: false });

  // Trampa para bots: se responde OK sin guardar, para no darles la pista.
  if (cuerpo.datos && cuerpo.datos.sitio_web_empresa) return res.status(200).json({ ok: true });

  const datos = validar(cuerpo.datos);
  if (!datos) return res.status(400).json({ ok: false, error: 'datos' });

  try {
    if (!(await verificarTurnstile(cuerpo.turnstileToken, ip))) return res.status(403).json({ ok: false, error: 'verificacion' });
    await entregar(datos, limpiar(cuerpo.pagina || 'evaluacion', 60));
    return res.status(200).json({ ok: true });
  } catch (e) {
    // Nunca se registran los datos en los logs: traen renta, deudas y morosidades.
    if (e.message === 'sin-destino') {
      console.error('evaluacion: no hay destino configurado (falta SUPABASE_URL/SUPABASE_ANON_KEY o Resend)');
      return res.status(503).json({ ok: false, error: 'sin-destino' });
    }
    console.error('evaluacion: ningún destino aceptó el lead');
    return res.status(502).json({ ok: false, error: 'destino' });
  }
}
