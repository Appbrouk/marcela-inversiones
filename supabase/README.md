# Base de datos compartida

Este sitio ya no tiene una tabla propia. Los proyectos, los parámetros y los
formularios recibidos viven en la **base compartida con IMOBU** (proyecto
Supabase de la organización IMOBU), y se administran desde la intranet común en
<https://imobu.cl/intranet.html>.

El esquema (`web_sitios`, `web_proyectos`, `web_leads`, `web_historial`,
`web_admins`) está en el repositorio de IMOBU: `imobu-web/supabase/web.sql`.
Ejecútalo una sola vez en el SQL Editor del proyecto; ahí también están las
instrucciones para dar acceso a los administradores.

Lo que este sitio hace con esa base:

| Función | Tabla | Clave |
|---|---|---|
| `api/proyectos.mjs` lee el catálogo y los parámetros de `mdiaz` | `web_proyectos`, `web_sitios` | anon (solo lectura) |
| `api/formulario.mjs` guarda registros y evaluaciones | `web_leads` (`sitio = 'mdiaz'`) | anon (solo INSERT) |

Variables de entorno en Vercel: `SUPABASE_URL`, `SUPABASE_ANON_KEY` y
`ALLOWED_ORIGINS` (ver README principal).
