# Propuestas de rediseño — paleta del manual de marca

Cuatro lecturas del manual de marca (Ciruela, Burdeo, Rosa palo, Rosa antiguo,
Dorado, Blush · Lora + Poppins), renderizadas sobre el sitio real.

**Ninguna está aplicada.** Son capas de tokens que se inyectan encima de
`css/styles.css` para previsualizar; si se elige una, hay que llevarla a los
tokens de `:root` de verdad, no dejarla como capa.

| Archivo | Propuesta | Carácter |
|---|---|---|
| `t1.jpg` / `t1.css` | **Editorial claro** | Base blush, Lora en caja mixta, botones burdeo, dorado en filetes. La lectura más fiel del manual. |
| `t2.jpg` / `t2.css` | **Ciruela señorial** | Honra el 60% ciruela: héroe, "Sobre mí", CTA final y footer oscuros, alternando con secciones claras. Dorado como color de acción. |
| `t3.jpg` / `t3.css` | **Contraste cálido** | Conserva las versales y el tracking ancho del sitio actual, en Lora. La transición más suave. |
| `t4.jpg` / `t4.css` | **Rosa suave** | Rosa antiguo como acción, ciruela solo en texto, dorado al detalle. La más liviana. |

`_base.css` es común a las cuatro: declara los seis colores del manual y asigna
Lora a los titulares y Poppins al resto.

## Decisión de fondo pendiente

El CSS actual pone los titulares en **versales con tracking de .18em**, que
funciona con Montserrat pero aprieta a un serif como Lora. En t1, t2 y t4 pasé a
caja mixta; t3 mantiene las versales para poder comparar. Esa es la elección que
define el carácter tipográfico, más que el color.

## Si se elige t2 (oscura)

1. Falta el **logo en negativo**. Hoy hay un solo PNG; en la vista previa lo
   invertí con un filtro CSS, que sirve para mirar pero no para producción.
   El manual trae la versión sobre fondo oscuro.
2. Hay **29 `#fff` fijos** en `css/styles.css` (fondos de tarjeta, texto de
   botones). Para los temas claros da igual; para el oscuro hay que pasarlos a
   tokens o el modo oscuro queda a parches.

## Cómo volver a previsualizar

Las capturas se generaron sirviendo el sitio e inyectando `_base.css` + `tN.css`
con Playwright, más Lora y Poppins descargadas localmente (las de Google Fonts
no cargan tras el proxy del entorno).
