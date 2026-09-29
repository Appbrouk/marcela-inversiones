/* Marcela Díaz Inversiones — datos de los proyectos
   ------------------------------------------------------------------
   Única fuente de verdad para la sección "Proyectos": el carrusel y el modal
   de detalle se dibujan a partir de este arreglo (ver js/main.js).

   Para agregar un proyecto basta con sumar un objeto a la lista y subir sus
   fotos a assets/. No hay que tocar HTML ni CSS.

   Campos:
     id            slug único, sin espacios ni tildes (se usa en la URL: #proyecto=<id>)
     nombre        nombre comercial del proyecto
     inmobiliaria  empresa que desarrolla/comercializa (se muestra en tarjeta y modal)
     comuna        aparece como badge en la tarjeta y en el modal
     desde         precio "Desde …" tal como debe mostrarse (texto libre)
     etiqueta      opcional · texto corto extra ("Entrega inmediata", "Últimas unidades")
     resumen       opcional · 1 frase para la tarjeta; si falta se usa la descripción
     descripcion   párrafo(s) breves para el modal: string o arreglo de strings
     datos         opcional · pares [etiqueta, valor] que se listan en el modal
     fotos         arreglo de { src, alt }. La primera es la portada de la tarjeta.
                   Si viene vacío se dibuja un placeholder editorial.
     enlace        opcional · URL de una ficha externa ("Ver ficha completa").
                   Hoy ningún proyecto lo usa, y es deliberado: Marcela vende estos
                   proyectos, así que el modal termina en "Conversemos" por WhatsApp
                   y no deriva el cliente al sitio de la inmobiliaria. El campo se
                   mantiene por si alguna vez conviene enlazar uno en particular;
                   al omitirlo, el botón simplemente no se dibuja. Las fichas
                   oficiales quedan como comentario en cada proyecto, para consulta
                   interna.

   Fuentes (sep. 2026): sitios públicos de cada inmobiliaria y portales. Brouk
   exige inicio de sesión, así que los precios/condiciones de convenio deben
   verificarse ahí antes de publicar.
*/
window.MD_PROJECTS = [
  {
    id: "stay",
    nombre: "Stay",
    inmobiliaria: "FDI",
    comuna: "Las Condes",
    desde: "Desde 7.303 UF",
    etiqueta: "Entrega inmediata",
    resumen:
      "Departamentos de 2 y 3 dormitorios con terraza panorámica en un barrio residencial consolidado.",
    descripcion: [
      "Edificio Stay está en Mar del Sur 1.111, en el corazón de Las Condes, un barrio tradicionalmente residencial con todo lo necesario a pasos: comercio, colegios y áreas verdes.",
      "Departamentos con terraza panorámica o jardín privado, de 68 a 234 m² totales. Espacios comunes con piscina, quincho con fogón, bike center, cowork y meeting point. Se visita sala de ventas y piloto.",
    ],
    datos: [
      ["Dirección", "Mar del Sur 1.111, Las Condes"],
      ["Tipologías", "2D2B · 3D2B"],
      ["Superficie", "68 a 234 m² totales"],
      ["Amenities", "Piscina · Quincho con fogón · Cowork · Bike center"],
    ],
    fotos: [{ src: "assets/stay-1.jpg", alt: "Fachada Edificio Stay" }],
    // Ficha oficial, solo como referencia interna: https://www.edificiostay.cl/
  },
  {
    id: "eco-florida",
    nombre: "Eco Florida",
    inmobiliaria: "Fundamenta",
    comuna: "La Florida",
    desde: "Desde 3.730 UF",
    etiqueta: "Entrega inmediata",
    resumen:
      "Torre de 23 pisos a pasos de dos líneas de metro, con foco en eficiencia y sustentabilidad.",
    descripcion: [
      "Eco Florida se ubica en Froilán Roa 1201, sector de alta conectividad: estaciones Vicuña Mackenna (L4 y L4A) y Bellavista de La Florida (L5). Diseño de Enrique Concha & Co.",
      "Studios y departamentos de 1 y 2 dormitorios. Piscina, jardines, quincho, gimnasio, cowork, lounge y zona gourmet; iluminación LED con sensores, puntos de carga para autos eléctricos, reciclaje y bicicleteros.",
    ],
    datos: [
      ["Dirección", "Froilán Roa 1201, La Florida"],
      ["Tipologías", "Studio · 1D1B · 2D2B"],
      ["Superficie", "30 a 56 m²"],
      ["Metro", "Vicuña Mackenna L4/L4A · Bellavista de La Florida L5"],
    ],
    fotos: [{ src: "assets/eco-florida-1.webp", alt: "Fachada Eco Florida" }],
    // Ficha oficial, solo como referencia interna: https://www.fundamenta.cl/proyectos-en-venta/departamento-en-la-florida/eco-florida/
  },
  {
    id: "pintor-cicarelli",
    nombre: "Pintor Cicarelli II",
    inmobiliaria: "Maestra",
    comuna: "San Joaquín",
    desde: "Desde 2.732 UF",
    etiqueta: "Entrega inmediata",
    resumen:
      "Ticket de entrada bajo a pasos del metro Rodrigo de Araya y Vicuña Mackenna.",
    descripcion: [
      "Pintor Cicarelli II, en San Joaquín, ofrece departamentos de 1, 2 y 3 dormitorios en una ubicación privilegiada, cercana a la avenida Vicuña Mackenna y al Metro Rodrigo de Araya: comercio, servicios, supermercados y ciclovías a la mano.",
      "Cortinas roller incluidas, cocina amoblada, walk-in closet en el dormitorio principal, aislación térmica EIFS con termopaneles PVC e instalación para lavadora. Con promoción, desde 2.459 UF (bases en maestra.cl).",
    ],
    datos: [
      ["Dirección", "Pintor Cicarelli 278, San Joaquín"],
      ["Tipologías", "1D1B · 2D1B · 3D1B"],
      ["Superficie", "32 a 47 m² totales"],
      ["Metro", "Rodrigo de Araya · L5"],
    ],
    fotos: [
      { src: "assets/cicarelli-1.webp", alt: "Fachada Pintor Cicarelli II" },
    ],
    // Ficha oficial, solo como referencia interna: https://maestra.cl/proyectos/pintor-cicarelli-ii/
  },
  {
    id: "teatinos-727",
    nombre: "Teatinos 727",
    inmobiliaria: "AJ Urbana", // la ficha pública (imonteclaro.cl/teatinos) es de Monteclaro Inmobiliaria: confirmar
    comuna: "Santiago Centro",
    desde: "Desde 2.858 UF",
    etiqueta: "Entrega inmediata",
    resumen:
      "Studios y departamentos de 1 y 2 dormitorios en el centro cívico, a menos de 5 minutos de cuatro líneas de metro.",
    descripcion: [
      "Teatinos 727 está pensado para una experiencia de conectividad: a pasos del centro cívico, con acceso a las líneas 1, 2, 3, 5 y la futura línea 7 caminando, además de parques, museos, mercados y el barrio Yungay/Brasil.",
      "Cocina full electric, iluminación LED, espacio para lavadora y ventanas termopanel. Lobby de doble altura, coffee lounge, cowork, gimnasio, quinchos, bicicleteros, laundry y jardín interior.",
    ],
    datos: [
      ["Dirección", "Teatinos 727, Santiago Centro"],
      ["Tipologías", "Studio · 1D1B · 2D1B · 2D2B"],
      ["Superficie", "Desde 26,6 m² totales"],
      ["Metro", "Plaza de Armas · L3/L5, a pasos de L1 y L2"],
    ],
    fotos: [{ src: "assets/teatinos-1.webp", alt: "Fachada Teatinos 727" }],
    // Ficha oficial, solo como referencia interna: https://www.imonteclaro.cl/teatinos
  },
  {
    id: "jardines-de-alvarado",
    nombre: "Jardines de Alvarado",
    inmobiliaria: "Maestra",
    comuna: "Independencia",
    desde: "Desde 2.430 UF",
    etiqueta: "Entrega inmediata",
    resumen:
      "Ticket de entrada bajo, cerca del metro Plaza Chacabuco y de la Autopista Central.",
    descripcion: [
      "Jardines de Alvarado, en Coronel Alvarado 2505, Independencia, queda cerca del metro Plaza Chacabuco, de Avenida Vivaceta y de la Autopista Central, con supermercados, colegios y servicios en el entorno.",
      "Departamentos de 1, 2 y 3 dormitorios con cortinas roller, cocina amoblada, walk-in closet, aislación térmica EIFS con termopaneles PVC e instalación para lavadora. Con promoción, desde 2.187 UF (bases en maestra.cl).",
    ],
    datos: [
      ["Dirección", "Coronel Alvarado 2505, Independencia"],
      ["Tipologías", "1D1B · 2D1B · 3D1B"],
      ["Superficie", "32 a 47 m² totales"],
      ["Metro", "Plaza Chacabuco · L3"],
    ],
    fotos: [
      { src: "assets/alvarado-1.jpg", alt: "Fachada Jardines de Alvarado" },
    ],
    // Ficha oficial, solo como referencia interna: https://maestra.cl/proyectos/jardines-de-alvarado/
  },
  {
    id: "nunoa-2024",
    nombre: "Ñuñoa 2024",
    inmobiliaria: "FDI", // el sitio oficial (nunoa2024.cl) lleva contacto de FDI (gmora@fdi.cl): confirmar
    comuna: "Ñuñoa",
    desde: "Desde 3.431 UF",
    etiqueta: "Entrega inmediata",
    resumen:
      "Cuatro tipologías de 1 a 3 dormitorios en Rodrigo de Araya, con amplias áreas comunes y metro cerca.",
    descripcion: [
      "Ubicado en la calle Rodrigo de Araya, el Edificio Ñuñoa 2024 se caracteriza por su gran conectividad y cercanía al metro, por sus numerosas áreas comunes y por su diseño arquitectónico.",
      "Cuatro tipologías, de 1 a 3 dormitorios y de 37,3 a 65,8 m² totales, con terminaciones pensadas para aprovechar el espacio. Gourmet zone, cowork, swimming lounge, kids zone, quinchos, gimnasio y rooftop.",
    ],
    datos: [
      ["Dirección", "Rodrigo de Araya, Ñuñoa"],
      ["Tipologías", "1D1B · 2D2B · 3D2B"],
      ["Superficie", "37,3 a 65,8 m² totales"],
      ["Sala de ventas", "Francisco de Paula 2024, Ñuñoa"],
    ],
    fotos: [{ src: "assets/nunoa.webp", alt: "Proyecto Ñuñoa 2024" }],
    // Ficha oficial, solo como referencia interna: https://nunoa2024.cl/
  },
  {
    id: "eco-valdes",
    nombre: "Eco Valdés I",
    inmobiliaria: "Fundamenta",
    comuna: "La Florida",
    desde: "Desde 2.162 UF",
    etiqueta: "Entrega inmediata",
    resumen:
      "Studios y departamentos de 1 y 2 dormitorios sobre la estación Vicente Valdés, donde se cruzan dos líneas de metro.",
    descripcion: [
      "Eco Valdés I está en Vicente Valdés 615, La Florida, sobre uno de los nodos mejor conectados del sur de Santiago: la estación Vicente Valdés reúne las líneas 4 y 5, y Vicuña Mackenna queda a pocas cuadras.",
      "Edificio de 8 pisos con studios y departamentos de 1 y 2 dormitorios, de 30 a 52 m². Áreas comunes con piscina, quinchos, fitness zone, cowork, salón gourmet, lounge TV, sala de lavado y pet zone.",
    ],
    datos: [
      ["Dirección", "Vicente Valdés 615, La Florida"],
      ["Tipologías", "Studio · 1D1B · 2D1B"],
      ["Superficie", "30,1 a 51,9 m²"],
      ["Metro", "Vicente Valdés · L4/L5"],
    ],
    fotos: [{ src: "assets/eco-valdes.webp", alt: "Proyecto Eco Valdés I" }],
  },
  {
    id: "nexus-vespucio",
    nombre: "Nexus Vespucio",
    inmobiliaria: "Costa Pacífico",
    comuna: "La Cisterna",
    desde: "Desde 2.100 UF",
    etiqueta: "Entrega inmediata",
    resumen:
      "Departamentos de 1, 2 y 3 dormitorios a una cuadra de la Intermodal La Cisterna, donde se cruzan dos líneas de metro.",
    descripcion: [
      "Nexus Vespucio está en Paulina 8753, La Cisterna, a una cuadra de la estación Intermodal La Cisterna, donde las líneas 2 y 4A del metro se cruzan con los buses interurbanos: conexión directa con el centro y con el sur de la región.",
      "Departamentos de 1, 2 y 3 dormitorios con living comedor amplio, cocina integrada amoblada y equipada, walk-in closet en el dormitorio principal, piso vinílico SPC, grandes ventanales y terraza propia. Conserjería 24/7, piscina, quincho, terraza panorámica, cowork, kitchenette y áreas verdes; pet friendly.",
    ],
    datos: [
      ["Dirección", "Paulina 8753, La Cisterna"],
      ["Tipologías", "1D · 2D · 3D (siete tipologías, A a G)"],
      ["Metro", "Intermodal La Cisterna · L2/L4A"],
      ["Sala de ventas", "Av. Américo Vespucio 231, La Cisterna"],
    ],
    fotos: [{ src: "assets/nexusfachada.webp", alt: "Proyecto Nexus Vespucio" }],
  },
  {
    id: "briones-luco-0920",
    nombre: "Briones Luco 0920",
    inmobiliaria: "Valle Sur",
    comuna: "La Cisterna",
    desde: "Desde 1.990 UF", // confirmar el "desde" vigente: los portales van de 1.890 a 2.324 UF
    etiqueta: "Entrega inmediata",
    resumen:
      "Departamentos de 1 y 2 dormitorios a pocas cuadras del metro Lo Ovalle, en el límite con San Miguel.",
    descripcion: [
      "Briones Luco 0920 está en un sector residencial consolidado y poco densificado de La Cisterna, en el límite con San Miguel: metro Lo Ovalle a pocas cuadras, y Gran Avenida y la Autopista Central a mano para salir en auto.",
      "Departamentos de 1 y 2 dormitorios, de 37 a 58 m², con piso gres, ventanas de PVC con termopanel, terraza con baranda de cristal, shower door y vanitorio en el baño principal, y cocina amoblada con cubierta de granito, horno, encimera y campana eléctrica.",
      "Áreas comunes en cubierta con piscina, quinchos y gimnasio equipado, más hall de acceso de doble altura, cowork, sala de juegos y salas multiuso. Conserjería 24 horas y accesos controlados por circuito cerrado de televisión.",
    ],
    datos: [
      ["Dirección", "Briones Luco 0920, La Cisterna"],
      ["Tipologías", "1D · 2D"],
      ["Superficie", "37 a 58 m²"],
      ["Metro", "Lo Ovalle · L2"],
    ],
    fotos: [{ src: "assets/fachadabriones.webp", alt: "Proyecto Briones Luco 0920" }],
    // Ficha oficial, solo como referencia interna: https://invs.cl/project/edificio-briones-luco-0920/
  },
  {
    id: "limit-apartments",
    nombre: "Limit Apartments",
    inmobiliaria: "Santolaya", // comercializa S. Silva (limit@ssilva.cl)
    comuna: "Macul",
    desde: "Desde 2.954 UF",
    etiqueta: "Entrega inmediata", // confirmar estado: la entrega estaba prevista para el 2º semestre de 2025
    resumen:
      "Departamentos de 1 y 2 dormitorios con piscina, gimnasio y cowork, con salida directa a la Autopista Vespucio Sur.",
    descripcion: [
      "Limit Apartments está en Mayor Abe 3090, sector Las Dalias de Macul, con acceso directo desde la Autopista Vespucio Sur: una ubicación pensada para moverse rápido hacia el oriente y el centro, con supermercados, comercio y servicios en el entorno.",
      "Seis tipologías de 1 y 2 dormitorios, con plantas compactas desde 35,6 m² totales. Cocina full electric con cubierta de cuarzo, porcelanato símil madera y ventanas de PVC con termopanel. Áreas comunes con piscina, gimnasio, quincho y cowork.",
    ],
    datos: [
      ["Dirección", "Mayor Abe 3090, Macul"],
      ["Tipologías", "1D1B · 2D2B (seis tipologías)"],
      ["Superficie", "Desde 35,6 m² totales"],
      ["Amenities", "Piscina · Gimnasio · Quincho · Cowork"],
    ],
    fotos: [{ src: "assets/limit.webp", alt: "Fachada de Limit Apartments" }],
    // Ficha oficial, solo como referencia interna: https://edificiolimit.cl/
  },
  {
    id: "puerta-la-florida",
    nombre: "Puerta La Florida",
    inmobiliaria: "S. Silva",
    comuna: "La Florida",
    desde: "Desde 2.353 UF",
    etiqueta: "Entrega inmediata",
    resumen:
      "Studios y departamentos de 1 dormitorio frente al Mall Florida Center, a pasos de dos estaciones de la línea 5.",
    descripcion: [
      "Puerta La Florida está en Av. Vicuña Mackenna Poniente 5860, justo frente al Mall Florida Center y a pasos de las estaciones Mirador y Pedrero de la línea 5. Universidades, supermercados y comercio a la mano: un proyecto pensado tanto para vivir como para arrendar.",
      "Edificio de 11 pisos con studios desde 20,6 m² útiles y departamentos de 1 dormitorio y 1 baño, con ventanas termopanel y cubiertas de granito en la cocina. Recepción, cowork, sala multiuso, lavandería, quinchos y bicicleteros. Pie del 5% pagadero hasta en 24 cuotas.",
    ],
    datos: [
      ["Dirección", "Av. Vicuña Mackenna Poniente 5860, La Florida"],
      ["Tipologías", "Studio · 1D1B"],
      ["Superficie", "Studios desde 20,6 m² útiles"],
      ["Metro", "Mirador y Pedrero · L5"],
    ],
    fotos: [{ src: "assets/puertalaflorida.webp", alt: "Fachada de Puerta La Florida" }],
    // Ficha oficial, solo como referencia interna: https://puertalaflorida.cl/
  },
  {
    id: "neohaus-vitacura",
    nombre: "Neohaus Vitacura",
    inmobiliaria: "Neohaus",
    comuna: "Vitacura",
    desde: "Desde 5.600 UF", // confirmar: los portales muestran desde 5.600 a 6.790 UF según la fecha
    etiqueta: "Entrega inmediata",
    resumen:
      "Departamentos de 1 y 2 dormitorios en Av. Las Condes, con piscina panorámica en el piso 16 y placa comercial propia.",
    descripcion: [
      "Neohaus Vitacura está en Av. Las Condes 12.170, en el eje comercial y de servicios de Vitacura. Son dos torres de 15 pisos más terraza, con 250 departamentos sobre una plaza central con placa comercial: el barrio resuelto en el mismo edificio.",
      "Departamentos de 1 y 2 dormitorios, de 51 a 100 m², amplios y luminosos, con iluminación LED y sensores de presencia. En la terraza del piso 16, piscina panorámica con solárium y dos hidromasajes; además gimnasio, sala de pool climatizada, sala gourmet, sala multimedia, cuatro quinchos, lavandería y talleres multipropósito.",
    ],
    datos: [
      ["Dirección", "Av. Las Condes 12.170, Vitacura"],
      ["Tipologías", "1D1B · 2D2B"],
      ["Superficie", "51 a 100 m²"],
      ["Amenities", "Piscina panorámica · Hidromasajes · Gimnasio · Sala gourmet"],
    ],
    fotos: [{ src: "assets/neohaus-vitacura.webp", alt: "Torres de Neohaus Vitacura" }],
    // Ficha oficial, solo como referencia interna: https://www.neohaus.cl/neohaus-vitacura/
  },
  {
    id: "neohaus-la-dehesa",
    nombre: "Neohaus La Dehesa",
    inmobiliaria: "Neohaus",
    comuna: "Lo Barnechea",
    desde: "Desde 5.440 UF", // confirmar: los portales muestran desde 5.440 a 6.718 UF según la fecha
    etiqueta: "Entrega inmediata",
    resumen:
      "Departamentos de 1 y 2 dormitorios equipados de fábrica, en el polo comercial de La Dehesa.",
    descripcion: [
      "Neohaus La Dehesa está en Av. La Dehesa 1540, Lo Barnechea, dentro de un desarrollo de uso mixto con oficinas y comercio. El Mall Portal La Dehesa, la Clínica Santa María y un Jumbo quedan a doscientos metros; colegios y clínicas, en el entorno inmediato.",
      "Departamentos de 1 y 2 dormitorios, de 47 a 92 m², que se entregan listos para habitar: cocina equipada con horno, campana retráctil, vitrocerámica, microondas, refrigerador y lavavajillas; aire acondicionado split independiente; baños en mármol travertino con losa radiante y toallero calefaccionado; piso flotante y equipamiento full electric. Piscina, terraza panorámica y zona de jacuzzi.",
    ],
    datos: [
      ["Dirección", "Av. La Dehesa 1540, Lo Barnechea"],
      ["Tipologías", "1D1B · 2D2B"],
      ["Superficie", "47 a 92 m²"],
      ["Entorno", "Mall Portal La Dehesa y Clínica Santa María a 200 m"],
    ],
    fotos: [{ src: "assets/neohaus-dehesa.webp", alt: "Fachada y piscina de Neohaus La Dehesa" }],
    // Ficha oficial, solo como referencia interna: https://www.neohaus.cl/neohaus-la-dehesa-departamentos/
  },
];
