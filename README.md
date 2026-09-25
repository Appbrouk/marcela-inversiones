# Marcela Díaz Inversiones

Sitio web de una sola página (landing) para **MD Invest** — asesoría en inversiones
inmobiliarias en Santiago de Chile.

Es un sitio **100% estático**: HTML, CSS y JavaScript sin dependencias ni paso de build.

## Estructura

```
.
├── index.html          # Toda la página (nav, hero, servicios, recursos,
│                       # proyectos, sobre mí, registro, CTA final, footer)
├── css/styles.css      # Design system (tokens), componentes y animaciones
├── js/projects.js      # DATOS de los proyectos (carrusel + modal). Editar aquí.
├── js/main.js          # Intro, reveals al scroll, parallax, menú móvil, scrollspy,
│                       # carrusel y modal de proyectos, envío del formulario
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

## Proyectos (carrusel + modal)

La sección **Proyectos** se dibuja a partir de `js/projects.js`, que expone un
arreglo `window.MD_PROJECTS`. Es la **única fuente de verdad**: el carrusel
(tarjetas) y el modal de detalle (galería, descripción, fichas) salen de ahí. No hay
que tocar HTML ni CSS para agregar, quitar o reordenar proyectos.

### Agregar un proyecto

1. Sube las fotos a `assets/` (idealmente `.webp`, ≤ 1600 px de ancho, < 250 KB).
2. Agrega un objeto al arreglo:

```js
{
  id: "vitacura-parque",          // slug único; da la URL mdiaz.cl/#proyecto=vitacura-parque
  nombre: "Vitacura Parque",
  inmobiliaria: "Fundamenta",     // se muestra bajo el nombre
  comuna: "Vitacura",
  desde: "Desde 5.200 UF",
  etiqueta: "Últimas unidades",   // opcional, badge rosa
  resumen: "Una frase para la tarjeta.",                 // opcional
  descripcion: ["Párrafo 1 del modal.", "Párrafo 2."],   // string o arreglo
  datos: [["Tipologías", "1D1B · 2D2B"], ["Entrega", "2026"]], // opcional
  fotos: [
    { src: "assets/vitacura-1.webp", alt: "Fachada" },   // la primera es la portada
    { src: "assets/vitacura-2.webp", alt: "Piscina" },
  ],
  enlace: "https://…",            // opcional: botón "Ver ficha completa"
}
```

Si `fotos` va vacío se dibuja un placeholder editorial con el número del proyecto.
El botón **Conversemos** del modal abre WhatsApp con el nombre del proyecto ya
escrito en el mensaje.

### Enlace directo

Cada proyecto tiene URL propia para compartir: `https://mdiaz.cl/#proyecto=<id>`.
Al abrirla, la página baja hasta la sección y abre el modal.

### ¿Y si los proyectos cambian seguido?

El archivo JS es la opción más simple para un sitio estático: sin build, sin CORS,
sin un request extra y funciona incluso abriendo el HTML en local. Si más adelante
alguien sin acceso al repo necesita editar proyectos, el mismo arreglo puede venir
de un `data/projects.json` (con `fetch`) o de un CMS/Airtable/Sheets: la forma de los
datos no cambia, solo de dónde se leen.

## Formulario de registro → HubSpot

El formulario envía los datos a la **Forms API de HubSpot** directamente desde el
navegador. No hay backend ni claves secretas: `portalId` y `formGuid` son públicos
(aparecen en cualquier formulario embebido de HubSpot).

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

Si prefieres otro destino, deja `HUBSPOT` vacío y define `FORM_ENDPOINT` en
`js/main.js` con una URL que reciba un `POST` JSON
`{ nombre, email, telefono, acepta, origen }`.

## Pendientes conocidos

- **Enviar un registro de prueba** y confirmar que llega a HubSpot. La Forms API
  rechaza los campos que no existan en el formulario, así que el formulario del
  portal debe incluir `firstname`, `lastname`, `email` y `phone`.
- Los datos de `js/projects.js` salen de los sitios públicos de cada inmobiliaria
  (Brouk exige login): contrastar precios y condiciones de convenio antes de publicar.
- Cada proyecto tiene una sola foto. Para la galería del modal basta con sumar más
  entradas en `fotos` (idealmente `.webp` ≤ 1600 px; con ffmpeg:
  `ffmpeg -i foto.jpg -vf "scale=1600:-2" -c:v libwebp -quality 82 foto.webp`).
- Los enlaces de *Términos y condiciones*, *Política de privacidad*, LinkedIn y
  Facebook apuntan a `#` y están a la espera de sus URLs definitivas.
