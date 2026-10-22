# Marcela Díaz Inversiones

Sitio web de una sola página (landing) para **MD Invest** — asesoría en inversiones
inmobiliarias en Santiago de Chile.

Es un sitio **100% estático**: HTML, CSS y JavaScript sin dependencias ni paso de build.

## Estructura

```
.
├── index.html          # Toda la página (nav, hero, servicios, recursos,
│                       # proyectos, sobre mí, registro, CTA final, footer)
├── proyectos.html      # Catálogo completo con filtros (/proyectos)
├── js/catalogo.js      # Filtros del catálogo (comuna, precio UF, entrega, dormitorios, orden)
├── js/modal.js         # Modal de detalle de proyecto (lo comparten portada y catálogo)
├── css/catalogo.css    # Estilos del catálogo
├── css/styles.css      # Design system (tokens), componentes y animaciones
├── js/projects.js      # Catálogo de RESPALDO (carrusel + modal). El real viene de la base
│                       # compartida vía /api/proyectos y se edita en la intranet.
├── js/main.js          # Intro, reveals al scroll, parallax, menú móvil, scrollspy,
│                       # carrusel y modal de proyectos, envío del formulario
├── evaluacion.html     # Evaluador de perfil: wizard de 5 pasos
├── js/evaluacion.js    # Lógica del wizard y del pre-diagnóstico
├── css/evaluacion.css  # Estilos del evaluador
├── api/proyectos.mjs   # Función serverless: catálogo y parámetros desde la base compartida
├── api/formulario.mjs  # Función serverless que recibe registros y evaluaciones
├── supabase/README.md  # Dónde vive el esquema compartido (imobu-web/supabase/web.sql)
├── assets/             # Logos, favicon y fotografías
├── robots.txt
└── vercel.json         # Cabeceras de caché/seguridad y clean URLs
```

## Desarrollo local

No hay instalación. Basta con servir la carpeta por HTTP (abrir el archivo con
`file://` rompe las rutas relativas):

```bash
npx serve .
# o
python3 -m http.server 3000
```

Luego abre http://localhost:3000

## Despliegue en Vercel

El proyecto no necesita framework ni comando de build.

**Desde el dashboard**

1. *Add New… → Project* e importa este repositorio.
2. Framework Preset: **Other**.
3. Build Command: *(vacío)* · Output Directory: *(vacío / raíz)* · Install Command: *(vacío)*.
4. Deploy.

**Desde la CLI**

```bash
npx vercel        # preview
npx vercel --prod # producción
```

## Diseño: claro y oscuro

El sitio sigue el manual de marca (Ciruela, Burdeo, Rosa palo, Rosa antiguo,
Dorado, Blush · **Lora** títulos, **Poppins** textos) y cambia de esquema solo
con `prefers-color-scheme`, es decir según la preferencia del dispositivo. No
hay interruptor manual.

### Cómo está montado

Todo vive en tokens, al inicio de `css/styles.css`:

- **Marca** — `--ciruela`, `--burdeo`, `--rosa-palo`, `--rosa-antiguo`,
  `--dorado`, `--blush`. Nunca cambian.
- **Semánticos** — `--surface-page`, `--surface-raised`, `--text-heading`,
  `--accent`, `--on-accent`, `--glass`… Es lo único que se redefine en el
  bloque `@media (prefers-color-scheme: dark)` del final del archivo.
- **Alias heredados** — `--ink-900`, `--rose-600`, `--cream-100`… El sitio se
  escribió con esa escala antes del manual. Apuntan a los semánticos para no
  reescribir 700 reglas.

**Ninguna regla de componente se duplica entre esquemas.** Si al añadir algo
necesitas escribir una regla dentro del `@media` oscuro, probablemente falte un
token.

### Interruptor manual

Hay un botón en la barra de navegación, junto al CTA en escritorio y entre el
logo y la hamburguesa en móvil — ahí, y no dentro del menú, para que no haya
que abrirlo para cambiar de esquema.

- Por defecto el sitio sigue al dispositivo. En cuanto se pulsa el botón, la
  elección se guarda en `localStorage` y **gana sobre el dispositivo**.
- El icono anuncia el destino, no el estado: luna en claro, sol en oscuro.
- Sin JavaScript el botón no se muestra, pero el esquema automático del CSS
  sigue funcionando: lo único que se pierde es la elección manual.

Para evitar el destello al cargar, un fragmento en línea dentro del `<head>`
escribe `data-theme` **antes de pintar**. Si se moviera a un archivo externo
volvería el salto de claro a oscuro en cada carga.

El bloque de modo oscuro de `css/styles.css` se repite bajo dos selectores
—`@media (prefers-color-scheme: dark)` con `:root:not([data-theme="light"])`, y
`:root[data-theme="dark"]`— porque una media query no puede ir dentro de una
lista de selectores. **Es la única duplicación del archivo: si tocas uno, toca
el otro.** A cambio, no hay ni una regla de componente duplicada: todas las
diferencias de esquema son tokens, incluidos el logo (`--logo-nav`), el filtro
de las fotos (`--photo-filter`) y el brillo del héroe (`--glow-filter`).

### Ritmo de secciones

Antes blush, cream y blanco estaban a dos o tres puntos de luminancia: las
secciones no se distinguían. Ahora hay cinco tonos separados de verdad más dos
anclas oscuras que cortan la página:

| Sección | Clase | Claro | Oscuro |
|---|---|---|---|
| Hero | — | Blush | Ciruela |
| Evaluador | `bg-tint` | Rosa claro | Ciruela clara |
| Servicios | `bg-cream` | Crema | Ciruela tostada |
| Recursos | `bg-base` | Blush | Ciruela |
| Proyectos | `bg-rose` | Rosa palo | Ciruela rosada |
| Sobre mí | `bg-anchor` | **Ciruela** | Ciruela profunda |
| Registro | `bg-tint` | Rosa claro | Ciruela clara |
| Cierre | `bg-accent` | **Burdeo** | Burdeo |
| Footer | — | **Ciruela** | Ciruela profunda |

En claro las anclas son oscuras y cortan la página. En oscuro no se usan
secciones claras —un bloque blush a media página deslumbra—: la diferenciación
va por matices de ciruela y burdeo.

**`.bg-anchor`, `.bg-accent` y `.footer` redefinen los tokens de texto como
variables locales.** Como las custom properties cascadean, todo lo que hay
dentro (titulares, párrafos, filetes, botones, tarjetas) se adapta solo. Si
añades una sección oscura, dale una de esas clases en vez de escribir reglas de
color: no debería hacer falta ninguna.

### Reglas al tocar colores

1. **Nunca pongas un color literal en una regla.** Un `#fff` en el fondo de una
   tarjeta se queda blanco en modo oscuro. Usa `var(--surface-raised)`.
2. `--ink-900` ya **no** significa "casi negro" sino "el color de mayor
   contraste del esquema": en oscuro es blush. Para rellenos de botón usa
   `--accent`, no `--ink-900`.
3. Los alias se mapearon por **uso real**, no por nombre: `--rose-600` y
   `--gold-600` solo aparecen como texto, así que en oscuro se aclaran;
   `--rose-300` y `--gold-400` son fondos y se oscurecen.

### Logo

`assets/logo-lockup-dark.png` y `logo-wordmark-dark.png` se generaron
recoloreando **solo** los píxeles neutros del original a blush, conservando el
isotipo en rosa y dorado — que es lo que indica el manual para fondo oscuro.
Invertir la imagen entera habría estropeado el isotipo. El cambio se hace con
`content:url()` dentro del bloque oscuro.

Si algún día hay un lockup oficial en negativo, reemplaza esos dos archivos.

### Semáforo del pre-diagnóstico

Los colores de estado (`--estado-ok-fg`, `--estado-warn-fg`, `--estado-risk-fg`)
están en `css/evaluacion.css`, no en el JS. El medidor de carga financiera
recibe una clase (`is-ok` / `is-warn` / `is-risk`), no un color en línea, para
que siga al esquema.

### Alternativas descartadas

En `design/temas/` quedan cuatro propuestas previas con esta misma paleta. La
versión clara implementada corresponde a la lectura de `t1` (Lora en caja
mixta). Si prefieres los titulares en versales con tracking ancho, está en
`t3.css` y es un cambio de tres reglas.

## Proyectos (carrusel + modal)

La sección **Proyectos** se dibuja a partir de `window.MD_PROJECTS`. Hay dos
fuentes, en este orden:

1. `js/projects.js` — catálogo de **respaldo**, el mismo formato de siempre.
2. `/api/proyectos` — función serverless que lee la **base compartida con
   IMOBU** (`web_proyectos`) y, si hay proyectos marcados para `mdiaz`,
   reemplaza `window.MD_PROJECTS`. También deja `window.MD_CONFIG` con los
   parámetros publicados desde la intranet (WhatsApp, HubSpot, supuestos del
   evaluador).

Los proyectos se crean y editan en la **intranet compartida**
(<https://imobu.cl/intranet.html>): un proyecto se guarda una vez y aparece en
imobu.cl y en mdiaz.cl según las webs que se marquen en "Mostrar en". Los
cambios se ven aquí en menos de un minuto (la función se cachea 60 s en el CDN).
El esquema y la activación están en `imobu-web/supabase/web.sql` y
`imobu-web/docs/INTRANET-COMPARTIDA.md`.

### Qué campos tiene un proyecto

```js
{
  id: "vitacura-parque",          // slug único; da la URL mdiaz.cl/#proyecto=vitacura-parque
  nombre: "Vitacura Parque",
  inmobiliaria: "Fundamenta",     // se muestra bajo el nombre
  comuna: "Vitacura",
  desde: "Desde 5.200 UF",        // en la base es el número en UF; aquí llega ya formateado
  etiqueta: "Últimas unidades",   // badge rosa; vacío = "Entrega inmediata" o "Entrega futura"
  resumen: "Una frase para la tarjeta.",                 // opcional
  descripcion: ["Párrafo 1 del modal.", "Párrafo 2."],   // string o arreglo
  datos: [["Tipologías", "1D1B · 2D2B"], ["Entrega", "2026"]], // opcional; si falta se arma con tipologías y superficie
  fotos: [
    { src: "https://mdiaz.cl/assets/vitacura-1.webp", alt: "Fachada" },   // la primera es la portada
  ],
  enlace: "https://…",            // opcional: botón "Ver ficha completa"
}
```

Las fotos deben ser URLs completas (`https://…`), porque el mismo proyecto se
muestra desde dos dominios. Si `fotos` va vacío se dibuja un placeholder
editorial. El botón **Conversemos** del modal abre WhatsApp con el nombre del
proyecto ya escrito.

### Catálogo con filtros

`/proyectos` muestra todos los proyectos en una grilla con filtros por comuna,
precio en UF, entrega, dormitorios y orden (mismos criterios que el catálogo de
IMOBU, con el diseño de este sitio). Los filtros se reflejan en la URL
(`/proyectos?comuna=Ñuñoa&precio=0-2500`) para poder compartirlos. Las comunas
salen del propio catálogo. El detalle se abre en el mismo modal de la portada
(`js/modal.js`).

El modal **no tiene enlaces a la inmobiliaria**: los proyectos se venden por
nuestros medios, así que termina en "Quiero más información" (registro) y
"Conversemos" (WhatsApp). El campo "ficha de la inmobiliaria" de la intranet es
solo referencia interna.

### Enlace directo

Cada proyecto tiene URL propia para compartir: `https://mdiaz.cl/#proyecto=<id>`
(abre el modal sobre la portada) o `https://mdiaz.cl/proyectos#proyecto=<id>`
(sobre el catálogo).

## Formulario de registro → intranet + HubSpot

El formulario hace `POST /api/formulario` (`tipo: "registro"`): la función
valida y guarda el registro en la tabla compartida `web_leads`, de donde lo lee
la intranet (pestaña **Formularios**, junto a los de IMOBU). Si eso falla, la
persona ve un error y puede reintentar. Si funciona, además se **copia a la
Forms API de HubSpot** desde el navegador, sin bloquear: si HubSpot rechaza el
envío, el dato ya quedó en la intranet.

`portalId` y `formGuid` son públicos (aparecen en cualquier formulario embebido
de HubSpot). Se editan en la intranet (Web MD Invest → Formularios y HubSpot) y
llegan en `window.MD_CONFIG.hubspot`; los valores de `js/main.js` son el
respaldo.

### 1. Crear el formulario en HubSpot

En HubSpot: **Marketing → Formularios → Crear formulario**, con estas propiedades
de contacto:

| Campo del sitio | Propiedad en HubSpot   |
|-----------------|------------------------|
| Nombre          | `firstname` + `lastname` |
| Email           | `email`                |
| Teléfono        | `phone`                |

El campo *Nombre* es uno solo en el sitio: la primera palabra se guarda como
`firstname` y el resto como `lastname` ("María José Pérez" → `María` / `José Pérez`).
Si necesitas la separación exacta, conviene dividir el campo en el HTML.

### 2. Pegar los identificadores

Ya están puestos en `js/main.js`, al inicio:

```js
const HUBSPOT = {
  portalId: '51801072',                              // Hub ID
  formGuid: 'a8d33577-b4ec-4884-a984-08a08e1fe5e0',  // ID del formulario
  region: 'na1',                                     // 'eu1' si el portal fuera europeo
  subscriptionTypeId: 0,                             // ver punto 3
};
```

Ambos valores están en **Compartir / Insertar** del formulario, dentro del
fragmento de código (`portalId` y `formId`). Para apuntar a otro formulario, basta
con reemplazarlos aquí.

Si se dejan vacíos el sitio vuelve a **modo demo**: valida y muestra el mensaje de
éxito sin enviar nada.

### 3. Consentimiento (RGPD)

Solo si el formulario tiene activadas las opciones de consentimiento en HubSpot.
Pon en `subscriptionTypeId` el ID del tipo de suscripción y el checkbox
"Acepto recibir información de MD Invest" se enviará como consentimiento explícito.
Si lo dejas en `0` no se envía el bloque de consentimiento — que es lo correcto
cuando el formulario de HubSpot no lo pide, porque enviarlo de más da error.

### 4. Atribución de origen

El script de seguimiento (`js.hs-scripts.com/51801072.js`) está **activo** al final
de `index.html`: deja la cookie `hubspotutk` y el sitio la adjunta como
`context.hutk`, para que HubSpot registre de dónde viene cada contacto.

Instala cookies en el navegador de quien visita: revisa tu política de privacidad.
Si prefieres no usarlo, comenta esa línea; el contacto se crea igual, solo que sin
atribución.

### Errores

Si HubSpot rechaza el envío, el motivo aparece bajo el botón (por ejemplo, un email
inválido) y se puede reintentar sin perder lo escrito. Ante un fallo de red o del
portal se muestra un mensaje genérico con la alternativa de WhatsApp.

### Sin HubSpot

Deja vacíos `portalId` o `formGuid` en la intranet: el registro sigue llegando a
la intranet y simplemente no se copia a HubSpot.

## Evaluador de perfil

`/evaluacion` es un wizard de 5 pasos que calcula en vivo la capacidad de
inversión y sugiere proyectos del catálogo. Portado del evaluador de IMOBU
(`Appbrouk/imobu-web`), con dos diferencias: no hay sistema de asesores y el
envío va a una función propia. Los supuestos (UF, tasa, plazo, pie…) llegan en
`window.MD_CONFIG.finanzas` desde la intranet; los de `js/evaluacion.js` son el
respaldo.

### Cómo calcula

Todo sale de `CFG`, al inicio de `js/evaluacion.js`:

| Supuesto | Valor |
|---|---|
| Dividendo máximo | 25% de la renta líquida |
| Carga financiera total | 45% |
| Tasa anual | 4,5% |
| Plazo | 25 años |
| Pie | 20% |
| Renta mínima referencial | $650.000 |
| UF | $41.065 |

El dividendo se acota por lo que sea más estricto entre el tope por renta y lo
que deja libre la deuda ya comprometida. De ahí sale el crédito (anualidad
despejada), y el precio tope es el crédito dividido por `1 - pie`.

**La UF está fija.** Es referencial y no cierra ninguna operación, pero
conviene revisarla cada cierto tiempo. El texto de supuestos que aparece bajo
el panel se arma desde estas mismas constantes, así que nunca puede
contradecir al cálculo.

### Proyectos sugeridos

Se leen de `window.MD_PROJECTS` y el precio se extrae del campo de texto
`desde` ("Desde 2.900 UF" → 2900). Un proyecto sin UF legible no entra al
matcher. Las comunas que se ofrecen en el paso 5 también salen del catálogo:
al sumar un proyecto en una comuna nueva, aparece sola.

### Backend

`POST /api/formulario` con `{ tipo: "evaluacion", datos, pagina }` (función
serverless de Vercel, la misma que recibe el registro). Es `.mjs` a propósito:
así usa ESM sin un `package.json`, que cambiaría cómo Vercel detecta el
proyecto — hoy es estático, sin build.

**1. La base:** es la compartida con IMOBU; el esquema se ejecuta una sola vez
desde `imobu-web/supabase/web.sql` (ver `supabase/README.md`).

**2. Variables de entorno en Vercel:**

| Variable | Obligatoria | Para qué |
|---|---|---|
| `ALLOWED_ORIGINS` | **Sí** | `https://mdiaz.cl,https://www.mdiaz.cl`. Sin esto la función rechaza todo. |
| `SUPABASE_URL` | Sí* | URL del proyecto de Supabase compartido |
| `SUPABASE_ANON_KEY` | Sí* | Clave **anon / publishable**, no la service_role (ver más abajo). La usan también `/api/proyectos`. |
| `TURNSTILE_SECRET` | No | Anti-bots de Cloudflare |
| `RESEND_API_KEY` | No | Avisa por correo de cada formulario |
| `NOTIFY_EMAIL` | No | Destinatario(s) del aviso |
| `FROM_EMAIL` | No | Remitente verificado en Resend |

\* Si no hay ningún destino configurado la función responde **503** en vez de
fingir éxito: una evaluación que se pierde en silencio es peor que un error
visible.

### Por qué la clave anon y no la service_role

La tabla `web_leads` concede a `anon` **solo INSERT**, y solo en columnas
fijas (`sitio`, `tipo`, `pagina`, `asesor`, `datos`). Esa credencial no puede
leer los leads ni tocar ninguna otra tabla, y además nunca llega al navegador
porque la función hace de intermediaria. Los leen únicamente los
administradores autenticados en la intranet (lo impone la base vía RLS).

### Defensas del endpoint

Lista blanca de campos (lo que no esté en ella se descarta), validación de
correo y teléfono, tope de 20 KB, límite de 6 envíos por IP cada 10 minutos,
cierre por omisión si falta `ALLOWED_ORIGINS`, y campo trampa para bots. Los
datos nunca se escriben en los logs: traen renta, deudas y morosidades.

### Retención de datos

`web_leads` guarda datos personales y financieros. Define un plazo de retención
y decláralo en la política de privacidad.

## Pendientes conocidos

- **Enviar un registro de prueba** y confirmar que llega a HubSpot. La Forms API
  rechaza los campos que no existan en el formulario, así que el formulario del
  portal debe incluir `firstname`, `lastname`, `email` y `phone`.
- Los datos de `js/projects.js` (respaldo) salen de los sitios públicos de cada
  inmobiliaria: contrastar precios y condiciones antes de cargarlos en la intranet.
- Cada proyecto tiene una sola foto. Para la galería del modal basta con sumar más
  entradas en `fotos` (idealmente `.webp` ≤ 1600 px; con ffmpeg:
  `ffmpeg -i foto.jpg -vf "scale=1600:-2" -c:v libwebp -quality 82 foto.webp`).
- Los enlaces de *Términos y condiciones*, *Política de privacidad*, LinkedIn y
  Facebook apuntan a `#` y están a la espera de sus URLs definitivas.
