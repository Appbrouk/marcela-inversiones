// ─────────────────────────────────────────────────────────────
// Marcela Díaz Inversiones — catálogo y parámetros desde la base compartida
// Vercel Serverless Function · GET /api/proyectos  →  JavaScript
//
// Devuelve `window.MD_PROJECTS` (proyectos activos marcados para mdiaz) y
// `window.MD_CONFIG` (parámetros publicados desde la intranet). Se carga
// después de js/projects.js: si la base no responde, el sitio sigue con
// el catálogo del repositorio. La intranet vive en imobu.cl/intranet.html
// y el esquema en imobu-web/supabase/web.sql.
//
// Variables de entorno: SUPABASE_URL y SUPABASE_ANON_KEY (públicas; solo lectura).
// ─────────────────────────────────────────────────────────────

const SITIO = 'mdiaz';

const cabeceras = (key) => (key.startsWith('eyJ') ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key });

async function leer(url, key, ruta) {
  const r = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/${ruta}`, { headers: cabeceras(key), signal: AbortSignal.timeout(2500) });
  if (!r.ok) throw new Error(`supabase ${r.status}`);
  return r.json();
}

const ufTexto = (n) => 'Desde ' + Math.round(Number(n) || 0).toLocaleString('es-CL') + ' UF';
const tipologia = (dorm) => (Array.isArray(dorm) ? dorm : []).map((d) => (Number(d) === 0 ? 'Studio' : Number(d) + 'D')).join(' · ');
const fotoSrc = (src) => (/^https?:\/\//.test(src) ? src : `https://images.unsplash.com/${src}?w=1600&q=80&auto=format&fit=crop`);

// Fila de web_proyectos → forma que dibujan js/main.js y js/evaluacion.js
export function proyectoMd(p) {
  const datos = Array.isArray(p.datos) && p.datos.length
    ? p.datos
    : [['Tipologías', tipologia(p.dorm)], ['Superficie', String(p.m2 || '')]].filter((d) => d[1]);
  const fotos = (Array.isArray(p.fotos) ? p.fotos : [])
    .filter((f) => f && typeof f.src === 'string' && f.src)
    .map((f) => ({ src: fotoSrc(f.src), alt: String(f.alt || '') }));
  return {
    id: String(p.id),
    nombre: String(p.nombre || ''),
    inmobiliaria: String(p.inmobiliaria || ''),
    comuna: String(p.comuna || ''),
    desde: ufTexto(p.uf),
    etiqueta: String(p.etiqueta || '') || (p.entrega === 'futura' ? 'Entrega futura' : 'Entrega inmediata'),
    resumen: String(p.resumen || ''),
    descripcion: Array.isArray(p.descripcion) ? p.descripcion.map(String) : [],
    datos,
    fotos,
    enlace: String(p.enlace || '')
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).send('');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send('/* base no conectada: se usa js/projects.js */');
  }
  try {
    const [sitios, filas] = await Promise.all([
      leer(url, key, `web_sitios?id=eq.${SITIO}&select=config`),
      leer(url, key, `web_proyectos?select=*&activo=eq.true&sitios=cs.{${SITIO}}&order=orden.asc,nombre.asc`)
    ]);
    const config = Array.isArray(sitios) && sitios[0] && sitios[0].config && typeof sitios[0].config === 'object' ? sitios[0].config : null;
    if (!config) {
      res.setHeader('Cache-Control', 'public, s-maxage=30');
      return res.status(200).send('/* sin parámetros publicados: se usa js/projects.js */');
    }
    const proyectos = (Array.isArray(filas) ? filas : []).map(proyectoMd);
    const seguro = (o) => JSON.stringify(o).replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029');
    // CDN: 60 s de caché y luego se sirve la versión anterior mientras se actualiza
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    return res.status(200).send(
      (proyectos.length ? `window.MD_PROJECTS = ${seguro(proyectos)};\n` : '/* catálogo vacío en la base: se usa js/projects.js */\n') +
      `window.MD_CONFIG = ${seguro(config)};`
    );
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send('/* catálogo no disponible: se usa js/projects.js */');
  }
}
