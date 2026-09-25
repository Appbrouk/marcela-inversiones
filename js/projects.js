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
     enlace        opcional · URL de la ficha externa ("Ver ficha completa")

   Fuentes (sep. 2026): sitios públicos de cada inmobiliaria y portales. Brouk
   exige inicio de sesión, así que los precios/condiciones de convenio deben
   verificarse ahí antes de publicar. Fotos: pendientes de subir a assets/.
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
    enlace: "https://www.edificiostay.cl/",
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
    enlace:
      "https://www.fundamenta.cl/proyectos-en-venta/departamento-en-la-florida/eco-florida/",
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
    enlace: "https://maestra.cl/proyectos/pintor-cicarelli-ii/",
  },
  {
    id: "teatinos-727",
    nombre: "Teatinos 727",
    inmobiliaria: "AJ Urbana", // la ficha pública (imonteclaro.cl/teatinos) es de Monteclaro Inmobiliaria: confirmar
    comuna: "Santiago Centro",
    desde: "Desde 2.858 UF",
    etiqueta: "",
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
    enlace: "https://www.imonteclaro.cl/teatinos",
  },
  {
    id: "jardines-de-alvarado",
    nombre: "Jardines de Alvarado",
    inmobiliaria: "Maestra",
    comuna: "Independencia",
    desde: "Desde 2.430 UF",
    etiqueta: "Entrega inmediata",
    resumen:
      "El precio de entrada más bajo de la selección, cerca del metro Plaza Chacabuco y Autopista Central.",
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
    enlace: "https://maestra.cl/proyectos/jardines-de-alvarado/",
  },
  {
    id: "nunoa-2024",
    nombre: "Ñuñoa 2024",
    inmobiliaria: "FDI", // el sitio oficial (nunoa2024.cl) lleva contacto de FDI (gmora@fdi.cl): confirmar
    comuna: "Ñuñoa",
    desde: "Desde 3.431 UF",
    etiqueta: "",
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
    enlace: "https://nunoa2024.cl/",
  },
];
