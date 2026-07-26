/* ==========================================================================
   CLEVER ABOGADOS — aviso de cookies
   Se carga en todas las páginas. Guarda la decisión en localStorage y avisa
   al resto del sitio con un evento, para que cualquier script de medición que
   se añada en el futuro sólo arranque si hay consentimiento.
   ========================================================================== */
(function () {
  'use strict';

  var CLAVE   = 'clever_cookies_v1';
  var doc     = document;
  var estado  = null;   /* { analiticas:bool, fecha:string } */

  /* ------------------------------------------------------------ estado -- */
  function leer() {
    try { return JSON.parse(localStorage.getItem(CLAVE)); }
    catch (e) { return null; }
  }

  function guardar(analiticas) {
    estado = { analiticas: !!analiticas, fecha: new Date().toISOString() };
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) {}
    doc.dispatchEvent(new CustomEvent('clever:consent', { detail: estado }));
  }

  /* ------------------------------------------------------------- vista -- */
  var caja, panel;

  function construir() {
    caja = doc.createElement('div');
    caja.className = 'ck';
    caja.setAttribute('role', 'dialog');
    caja.setAttribute('aria-live', 'polite');
    caja.setAttribute('aria-label', 'Aviso de cookies');
    caja.innerHTML =
      '<div class="ck__box">' +
        '<div class="ck__txt">' +
          '<h2>Cookies</h2>' +
          '<p>Usamos almacenamiento propio estrictamente necesario para que la web ' +
          'funcione y para recordar esta misma elección. No utilizamos cookies ' +
          'publicitarias ni de perfilado. Puede consultar el detalle en la ' +
          '<a href="politica-cookies.html">política de cookies</a>.</p>' +
        '</div>' +
        '<div class="ck__acciones">' +
          '<button type="button" class="btn btn--sm" data-ck="todas">Aceptar todas</button>' +
          '<button type="button" class="btn btn--sm btn--ghost" data-ck="necesarias">Solo las necesarias</button>' +
          '<button type="button" class="ck__link" data-ck="config">Configurar</button>' +
        '</div>' +
      '</div>';

    panel = doc.createElement('div');
    panel.className = 'ckPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'ckPanelTit');
    panel.hidden = true;
    panel.innerHTML =
      '<div class="ckPanel__fondo" data-ck="cerrar"></div>' +
      '<div class="ckPanel__caja">' +
        '<header class="ckPanel__head">' +
          '<h2 id="ckPanelTit">Configuración de cookies</h2>' +
          '<button type="button" class="ckPanel__x" data-ck="cerrar" aria-label="Cerrar">&times;</button>' +
        '</header>' +

        '<div class="ckGrupo">' +
          '<div class="ckGrupo__top">' +
            '<h3>Necesarias</h3>' +
            '<span class="ckGrupo__fija">Siempre activas</span>' +
          '</div>' +
          '<p>Permiten que la web se muestre correctamente y guardan la decisión que ' +
          'tome en este aviso. Sin ellas el sitio no puede funcionar, por lo que no ' +
          'requieren consentimiento.</p>' +
        '</div>' +

        '<div class="ckGrupo">' +
          '<div class="ckGrupo__top">' +
            '<h3>Analíticas</h3>' +
            '<label class="ckSwitch">' +
              '<input type="checkbox" id="ckAnaliticas">' +
              '<span class="ckSwitch__pista"><span class="ckSwitch__bola"></span></span>' +
              '<span class="ckSwitch__txt">Desactivadas</span>' +
            '</label>' +
          '</div>' +
          '<p>Nos permitirían saber qué páginas se visitan más, de forma agregada. ' +
          '<strong>Actualmente no hay ninguna herramienta de análisis instalada</strong>: ' +
          'si en el futuro se añade, sólo se activará si usted lo autoriza aquí.</p>' +
        '</div>' +

        '<footer class="ckPanel__pie">' +
          '<button type="button" class="btn btn--sm" data-ck="guardar">Guardar preferencias</button>' +
          '<a class="ck__link" href="politica-cookies.html">Leer la política completa</a>' +
        '</footer>' +
      '</div>';

    doc.body.appendChild(caja);
    doc.body.appendChild(panel);

    caja.addEventListener('click', alPulsar);
    panel.addEventListener('click', alPulsar);

    var chk = panel.querySelector('#ckAnaliticas');
    chk.addEventListener('change', function () {
      panel.querySelector('.ckSwitch__txt').textContent =
        chk.checked ? 'Activadas' : 'Desactivadas';
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) cerrarPanel();
    });
  }

  function alPulsar(e) {
    var b = e.target.closest('[data-ck]');
    if (!b) return;
    var accion = b.dataset.ck;

    if (accion === 'todas')      { guardar(true);  ocultarAviso(); cerrarPanel(); }
    if (accion === 'necesarias') { guardar(false); ocultarAviso(); cerrarPanel(); }
    if (accion === 'config')     abrirPanel();
    if (accion === 'cerrar')     cerrarPanel();
    if (accion === 'guardar')    {
      guardar(panel.querySelector('#ckAnaliticas').checked);
      ocultarAviso(); cerrarPanel();
    }
  }

  function mostrarAviso() { caja.classList.add('is-on'); }
  function ocultarAviso() { caja.classList.remove('is-on'); }

  var focoPrevio = null;

  function abrirPanel() {
    focoPrevio = doc.activeElement;
    var chk = panel.querySelector('#ckAnaliticas');
    chk.checked = !!(estado && estado.analiticas);
    panel.querySelector('.ckSwitch__txt').textContent =
      chk.checked ? 'Activadas' : 'Desactivadas';

    panel.hidden = false;
    /* Forzamos un reflujo para que el navegador registre el estado inicial
       antes de añadir la clase: así la transición de entrada se ve. Es
       síncrono, a diferencia de requestAnimationFrame, que en una pestaña en
       segundo plano no llega a ejecutarse. */
    void panel.offsetWidth;
    panel.classList.add('is-on');
    doc.documentElement.classList.add('is-locked');
    panel.querySelector('.ckPanel__x').focus();
  }

  function cerrarPanel() {
    if (panel.hidden) return;
    panel.classList.remove('is-on');
    doc.documentElement.classList.remove('is-locked');
    setTimeout(function () { panel.hidden = true; }, 300);
    if (focoPrevio && focoPrevio.focus) focoPrevio.focus();
  }

  /* -------------------------------------------------------------- init -- */
  function arrancar() {
    construir();
    estado = leer();

    if (!estado) mostrarAviso();
    else doc.dispatchEvent(new CustomEvent('clever:consent', { detail: estado }));

    /* Cualquier enlace con data-ck-abrir reabre el panel: lo usa la política
       de cookies y el pie de página. */
    doc.addEventListener('click', function (e) {
      var t = e.target.closest('[data-ck-abrir]');
      if (t) { e.preventDefault(); abrirPanel(); }
    });
  }

  /* API mínima por si hace falta desde fuera */
  window.cleverCookies = {
    estado:  function () { return estado; },
    abrir:   abrirPanel,
    revocar: function () { try { localStorage.removeItem(CLAVE); } catch (e) {} estado = null; mostrarAviso(); }
  };

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();
