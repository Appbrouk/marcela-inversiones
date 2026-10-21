/* Marcela Díaz Inversiones — interruptor de esquema claro/oscuro
   ------------------------------------------------------------------
   El sitio sigue por defecto la preferencia del dispositivo; este botón la
   sobrescribe y la elección queda guardada. El CSS tiene los dos disparadores
   (ver el bloque de modo oscuro en css/styles.css), así que sin JavaScript el
   esquema automático sigue funcionando: lo único que se pierde es el botón.

   Para que no haya destello al cargar, el atributo data-theme lo escribe un
   fragmento en línea dentro del <head>, antes de pintar. Aquí solo se cablea
   el botón. */
(function () {
  'use strict';

  var d = document;
  var raiz = d.documentElement;
  var CLAVE = 'md-tema';
  var oscuro = matchMedia('(prefers-color-scheme: dark)');

  function guardada() {
    try { return localStorage.getItem(CLAVE); } catch (e) { return null; }
  }

  /* El esquema que se está viendo ahora mismo */
  function actual() {
    return raiz.getAttribute('data-theme') || (oscuro.matches ? 'dark' : 'light');
  }

  function aplicar(tema) {
    raiz.setAttribute('data-theme', tema);
    try { localStorage.setItem(CLAVE, tema); } catch (e) { /* sin almacenamiento */ }
    // La barra del navegador acompaña al cambio
    d.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.content = tema === 'dark' ? '#4A2530' : '#FAF0EE';
    });
    pintarBotones(tema);
  }

  function pintarBotones(tema) {
    d.querySelectorAll('.tema').forEach(function (b) {
      var aOscuro = tema !== 'dark';
      b.setAttribute('aria-pressed', String(tema === 'dark'));
      b.setAttribute('aria-label', aOscuro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
      b.setAttribute('title', aOscuro ? 'Modo oscuro' : 'Modo claro');
    });
  }

  d.querySelectorAll('.tema').forEach(function (b) {
    b.addEventListener('click', function () {
      aplicar(actual() === 'dark' ? 'light' : 'dark');
    });
  });

  /* Si nunca se eligió a mano, el sitio sigue al dispositivo también cuando
     este cambia de esquema a mitad de sesión (atardecer, modo automático). */
  oscuro.addEventListener('change', function (e) {
    if (guardada()) return;
    pintarBotones(e.matches ? 'dark' : 'light');
  });

  pintarBotones(actual());
})();
