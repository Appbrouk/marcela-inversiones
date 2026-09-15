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

## Formulario de registro

Por defecto el formulario está en **modo demo**: valida los campos y muestra el
mensaje de éxito sin enviar nada a ningún servidor.

Para conectarlo a un servicio real, define la URL en `js/main.js`:

```js
const FORM_ENDPOINT = ''; // ej.: 'https://formspree.io/f/xxxxxxxx'
```

El endpoint recibe un `POST` con `Content-Type: application/json` y el cuerpo
`{ nombre, email, telefono, acepta, origen }`.

## Pendientes conocidos

- Los proyectos 1, 2 y 3 usan placeholders. Reemplaza el `<div class="ph …">` de
  cada tarjeta por `<img src="assets/proyecto-N.jpg" alt="…">` cuando existan las fotos.
- Los enlaces de *Términos y condiciones*, *Política de privacidad*, LinkedIn y
  Facebook apuntan a `#` y están a la espera de sus URLs definitivas.
