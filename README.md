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
├── js/main.js          # Intro, reveals al scroll, parallax, menú móvil,
│                       # scrollspy y envío del formulario de registro
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

En `js/main.js`, al inicio:

```js
const HUBSPOT = {
  portalId: '',            // tu Hub ID
  formGuid: '',            // el ID del formulario
  region: 'na1',           // 'eu1' si tu portal es europeo
  subscriptionTypeId: 0,   // ver punto 3
};
```

Ambos valores están en **Compartir / Insertar** del formulario, dentro del
fragmento de código (`portalId` y `formId`).

Mientras estén vacíos el sitio queda en **modo demo**: valida y muestra el mensaje
de éxito sin enviar nada.

### 3. Consentimiento (RGPD)

Solo si el formulario tiene activadas las opciones de consentimiento en HubSpot.
Pon en `subscriptionTypeId` el ID del tipo de suscripción y el checkbox
"Acepto recibir información de MD Invest" se enviará como consentimiento explícito.
Si lo dejas en `0` no se envía el bloque de consentimiento — que es lo correcto
cuando el formulario de HubSpot no lo pide, porque enviarlo de más da error.

### 4. Atribución de origen (opcional)

Para que HubSpot registre de dónde viene cada contacto, descomenta el script de
seguimiento al final de `index.html` y reemplaza `NNNNNNN` por tu Hub ID. El sitio
lee la cookie `hubspotutk` y la adjunta como `context.hutk`.

Instala cookies en el navegador de quien visita: revisa tu política de privacidad
antes de activarlo. Sin el script el contacto se crea igual, solo que sin atribución.

### Errores

Si HubSpot rechaza el envío, el motivo aparece bajo el botón (por ejemplo, un email
inválido) y se puede reintentar sin perder lo escrito. Ante un fallo de red o del
portal se muestra un mensaje genérico con la alternativa de WhatsApp.

### Sin HubSpot

Si prefieres otro destino, deja `HUBSPOT` vacío y define `FORM_ENDPOINT` en
`js/main.js` con una URL que reciba un `POST` JSON
`{ nombre, email, telefono, acepta, origen }`.

## Pendientes conocidos

- **Pegar `portalId` y `formGuid` de HubSpot** en `js/main.js`. Hasta entonces el
  formulario no envía nada: muestra el éxito en modo demo y los registros se pierden.
- Los proyectos 1, 2 y 3 usan placeholders. Reemplaza el `<div class="ph …">` de
  cada tarjeta por `<img src="assets/proyecto-N.jpg" alt="…">` cuando existan las fotos.
- Los enlaces de *Términos y condiciones*, *Política de privacidad*, LinkedIn y
  Facebook apuntan a `#` y están a la espera de sus URLs definitivas.
