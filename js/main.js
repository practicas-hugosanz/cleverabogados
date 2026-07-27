/* ==========================================================================
   CLEVER ABOGADOS — animaciones e interacción (GSAP + ScrollTrigger)
   ========================================================================== */
(function () {
  'use strict';

  var hasGSAP = typeof window.gsap !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animate = hasGSAP && !reduced;

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* año del footer */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* color del avatar de cada reseña */
  $$('.gcard__av').forEach(function (el) {
    el.style.setProperty('--_c', el.dataset.av || '#5f6368');
  });

  /* Envolvemos los títulos de sección para el revelado por máscara. */
  $$('.secTitle').forEach(function (t) {
    t.innerHTML = '<span>' + t.innerHTML + '</span>';
  });

  if (animate) document.documentElement.classList.add('js-anim');

  /* ================================================================== */
  /*  SIN GSAP / MOVIMIENTO REDUCIDO: se muestra todo y salimos.        */
  /* ================================================================== */
  if (!animate) {
    var l = $('#loader');
    if (l) l.remove();
    initNavState();
    initMenu(null);
    initSlider(null);
    initSelect();
    initForm();
    initToTop();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' });

  /* Estado inicial de los titulares con máscara.
     Lo fija GSAP (y no el CSS) para que yPercent sea el único componente de
     traslación: si el CSS aplicase translateY(102%), GSAP lo leería como `y`
     en píxeles y el tween a yPercent:0 dejaría el texto fuera de la máscara. */
  gsap.set('.hero__title .line > span, .secTitle > span', { yPercent: 102, opacity: 1 });

  /* ================================================================== */
  /*  1. PRELOADER                                                      */
  /* ================================================================== */
  var loader = $('#loader');

  var intro = gsap.timeline({
    onComplete: function () { clearInterval(failsafe); if (loader) loader.remove(); }
  });

  /* Red de seguridad del preloader. Sólo contamos el tiempo con la pestaña
     visible: si se abre en segundo plano el navegador congela
     requestAnimationFrame (y con él la línea de tiempo), y eso es normal — se
     reanuda al volver. Pero si tras 9 s de pantalla visible siguiera ahí,
     saltamos al final para no dejar la web tapada. */
  var visibleMs = 0;
  var failsafe = setInterval(function () {
    if (!document.querySelector('#loader')) { clearInterval(failsafe); return; }
    if (!document.hidden) visibleMs += 500;
    if (visibleMs >= 9000) { clearInterval(failsafe); intro.progress(1); }
  }, 500);

  intro
    .fromTo('.loader__logo', { opacity: 0, y: 14 }, { opacity: .92, y: 0, duration: .7 })
    .fromTo('.loader__bar span', { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power2.inOut' }, '-=.35')
    .to('.loader__inner', { opacity: 0, y: -14, duration: .45, ease: 'power2.in' }, '+=.1')
    .to(loader, { yPercent: -100, duration: .8, ease: 'expo.inOut' }, '-=.1');

  /* ================================================================== */
  /*  2. ENTRADA DEL HERO Y DE LA NAVBAR                                */
  /* ================================================================== */
  intro.add(heroIn(), '-=.45');

  function heroIn() {
    var tl = gsap.timeline();

    tl.fromTo('.nav__inner',
        { y: -40, opacity: 0 },
        { y: 0, opacity: 1, duration: .9, ease: 'expo.out' })

      /* enlaces de la navbar en cascada */
      .fromTo('.nav__links a, .nav__phone, .nav__actions .btn, .burger',
        { y: -14, opacity: 0 },
        { y: 0, opacity: 1, duration: .6, stagger: .06 }, '-=.55')

      /* titular: revelado por máscara, línea a línea */
      .to('.hero__title .line > span',
        { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: .1 }, '-=.5')

      /* imagen: la máscara se abre y la foto hace un leve zoom-out */
      .fromTo('.hero__mediaMask',
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut' }, '-=1.05')
      .fromTo('.hero__img', { scale: 1.22 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, '<')
      .fromTo('.hero__badge', { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: .7 }, '-=.6')

      .fromTo('.hero__lead, .hero__cta, .hero__nota',
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: .8, stagger: .1 }, '-=.85');

    return tl;
  }

  /* ================================================================== */
  /*  3. NAVBAR AL HACER SCROLL                                         */
  /* ================================================================== */
  initNavState();

  function initNavState() {
    var nav = $('#nav');
    if (!nav) return;

    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 60); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* la navbar se oculta al bajar y reaparece al subir */
  (function navHideOnScroll() {
    var nav = $('#nav');
    if (!nav) return;
    var last = 0;

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: function (self) {
        var y = self.scroll();

        /* nunca la escondemos con el menú abierto o cerca del inicio */
        if (document.body.classList.contains('menu-open') || y < 300) {
          gsap.to(nav, { yPercent: 0, duration: .4, overwrite: 'auto' });
          last = y;
          return;
        }
        if (y > last + 6)      gsap.to(nav, { yPercent: -100, duration: .45, ease: 'power2.inOut', overwrite: 'auto' });
        else if (y < last - 6) gsap.to(nav, { yPercent: 0,    duration: .45, ease: 'power2.out',   overwrite: 'auto' });
        last = y;
      }
    });
  })();

  /* barra de progreso de lectura */
  gsap.to('#navProgress', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: .3 }
  });

  /* enlace activo según la sección visible */
  $$('.nav__links a').forEach(function (link) {
    var id = link.getAttribute('href');
    var target = id && id.length > 1 ? $(id) : null;
    if (!target) return;

    ScrollTrigger.create({
      trigger: target,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: function (self) { link.classList.toggle('is-active', self.isActive); }
    });
  });

  /* ================================================================== */
  /*  4. MENÚ HAMBURGUESA                                               */
  /* ================================================================== */
  initMenu(gsap);

  function initMenu(g) {
    var burger = $('#burger');
    var menu   = $('#menu');
    if (!burger || !menu) return;

    var bg    = $('.menu__bg', menu);
    var links = $$('.menu__link span', menu);
    var aside = $$('.menu__block', menu);
    var open  = false;

    /* --- fallback sin GSAP: alternancia simple de clases --- */
    if (!g) {
      burger.addEventListener('click', function () {
        open = !open;
        menu.classList.toggle('is-open', open);
        burger.classList.toggle('is-open', open);
        document.body.classList.toggle('menu-open', open);
        burger.setAttribute('aria-expanded', String(open));
        menu.setAttribute('aria-hidden', String(!open));
        if (bg) bg.style.clipPath = open ? 'circle(150% at 50% 50%)' : 'circle(0% at 50% 50%)';
        document.documentElement.classList.toggle('is-locked', open);
      });
      $$('.menu__link', menu).forEach(function (a) {
        a.addEventListener('click', function () { burger.click(); });
      });
      return;
    }

    /* origen del círculo: el propio botón hamburguesa */
    function origin() {
      var r = burger.getBoundingClientRect();
      return (r.left + r.width / 2) + 'px ' + (r.top + r.height / 2) + 'px';
    }

    var l1 = $('.burger__line--1', burger);
    var l2 = $('.burger__line--2', burger);
    var l3 = $('.burger__line--3', burger);

    /* línea 1 baja 6.25px, línea 3 sube 6.25px, la del medio desaparece */
    var burgerTl = gsap.timeline({ paused: true, defaults: { duration: .42, ease: 'power3.inOut' } });
    burgerTl
      .to(l1, { y: 6.25, rotate: 45 }, 0)
      .to(l3, { y: -6.25, rotate: -45 }, 0)
      .to(l2, { scaleX: 0, opacity: 0, duration: .2, ease: 'power2.in' }, 0);

    var menuTl = gsap.timeline({
      paused: true,
      onStart: function () {
        menu.classList.add('is-open');
        document.body.classList.add('menu-open');
        document.documentElement.classList.add('is-locked');
      },
      onReverseComplete: function () {
        menu.classList.remove('is-open');
        document.body.classList.remove('menu-open');
        document.documentElement.classList.remove('is-locked');
      }
    });

    /* Teléfono y CTA perderían contraste sobre el overlay: los retiramos.
       Debe hacerlo GSAP, porque la animación de entrada les dejó opacity inline. */
    var navFade = $$('.nav__phone, .nav__actions > .btn');

    menuTl
      .set(bg, { clipPath: function () { return 'circle(0% at ' + origin() + ')'; } })
      .to(bg, {
        clipPath: function () { return 'circle(150% at ' + origin() + ')'; },
        duration: .85, ease: 'expo.inOut'
      })
      .to(navFade, { opacity: 0, duration: .3, ease: 'power2.out' }, 0)
      .fromTo(links,
        { yPercent: 115, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: .75, ease: 'expo.out', stagger: .06 }, '-=.45')
      .fromTo(aside,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: .6, stagger: .08 }, '-=.45');

    function toggle(force) {
      open = typeof force === 'boolean' ? force : !open;
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.setAttribute('aria-hidden', String(!open));

      if (open) { burgerTl.play(); menuTl.play(); }
      else      { burgerTl.reverse(); menuTl.reverse(); }
    }

    burger.addEventListener('click', function () { toggle(); });

    /* al pulsar un enlace: cerramos y luego navegamos */
    $$('.menu__link', menu).forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var href = a.getAttribute('href');
        toggle(false);
        gsap.delayedCall(.45, function () {
          var t = $(href);
          if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) toggle(false);
    });

    window.addEventListener('resize', function () {
      if (open && window.innerWidth > 1000) toggle(false);
    });
  }

  /* ================================================================== */
  /*  5. DESPLEGABLE DE ÁREAS DEL EQUIPO                                */
  /* ================================================================== */
  /* <details> abre y cierra de golpe: interceptamos la pulsación para animar
     la altura en los dos sentidos. Al cerrar hay que animar primero y quitar
     el atributo `open` después, porque en cuanto se quita el navegador oculta
     el contenido y no quedaría nada que animar. */
  $$('.areasDrop').forEach(function (det) {
    var sum  = $('summary', det);
    var wrap = $('.areasDrop__wrap', det);
    if (!sum || !wrap) return;
    var ocupado = false;

    sum.addEventListener('click', function (e) {
      e.preventDefault();
      if (ocupado) return;
      ocupado = true;

      if (!det.open) {
        det.open = true;
        gsap.fromTo(wrap,
          { height: 0, opacity: 0 },
          {
            height: 'auto', opacity: 1, duration: .5, ease: 'power2.out',
            onComplete: function () { gsap.set(wrap, { height: 'auto' }); ocupado = false; }
          });
      } else {
        gsap.to(wrap, {
          height: 0, opacity: 0, duration: .4, ease: 'power2.inOut',
          onComplete: function () {
            det.open = false;
            gsap.set(wrap, { height: 'auto', opacity: 1 });
            ocupado = false;
          }
        });
      }
    });
  });

  /* ================================================================== */
  /*  6. CARRUSEL DE RESEÑAS                                            */
  /* ================================================================== */
  initSlider(gsap);

  function initSlider(g) {
    var root = $('#slider');
    if (!root) return;

    var viewport = $('.slider__viewport', root);
    var track    = $('#sliderTrack');
    var cards    = $$('.gcard', track);
    var dotsWrap = $('#sliderDots');
    var prevBtn  = $('#sPrev');
    var nextBtn  = $('#sNext');
    if (!cards.length) return;

    var page = 0, pages = 1, perView = 1, step = 0, maxX = 0;

    function setX(x, animated) {
      if (g) {
        if (animated) g.to(track, { x: x, duration: .7, ease: 'expo.out', overwrite: true });
        else g.set(track, { x: x });
      } else {
        track.style.transform = 'translateX(' + x + 'px)';
      }
    }

    function currentX() {
      if (g) return g.getProperty(track, 'x') || 0;
      var m = /translateX\((-?[\d.]+)px\)/.exec(track.style.transform || '');
      return m ? parseFloat(m[1]) : 0;
    }

    function measure() {
      var cs  = getComputedStyle(track);
      var gap = parseFloat(cs.columnGap || cs.gap) || 0;
      var w   = cards[0].getBoundingClientRect().width;

      step    = w + gap;
      perView = Math.max(1, Math.round((viewport.clientWidth + gap) / step));
      pages   = Math.max(1, Math.ceil(cards.length / perView));
      maxX    = Math.max(0, track.scrollWidth - viewport.clientWidth);

      buildDots();
      goTo(Math.min(page, pages - 1), false);
    }

    /* la última página se alinea a la derecha en vez de dejar hueco */
    function offsetFor(p) { return Math.min(p * perView * step, maxX); }

    /* El carrusel da la vuelta: pasada la última reseña vuelve a la primera,
       y desde la primera hacia atrás salta a la última. */
    function goTo(p, animated) {
      if (p < 0) p = pages - 1;
      else if (p > pages - 1) p = 0;
      page = p;
      setX(-offsetFor(page), animated !== false);
      sync();
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      for (var i = 0; i < pages; i++) {
        var b = document.createElement('button');
        b.className = 'sdot';
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Reseñas, página ' + (i + 1) + ' de ' + pages);
        (function (idx) {
          b.addEventListener('click', function () { goTo(idx, true); });
        })(i);
        dotsWrap.appendChild(b);
      }
    }

    function sync() {
      if (dotsWrap) {
        $$('.sdot', dotsWrap).forEach(function (d, i) {
          d.classList.toggle('is-on', i === page);
          d.setAttribute('aria-selected', String(i === page));
        });
      }
      /* Las flechas nunca se desactivan: siempre hay adónde ir. Si todo cabe
         en una pantalla, escondemos los controles enteros. */
      var solaPagina = pages <= 1;
      root.classList.toggle('slider--single', solaPagina);
      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(page - 1, true); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(page + 1, true); });

    /* --- arrastre con ratón / dedo --- */
    var dragging = false, startX = 0, startTX = 0, moved = 0;

    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; moved = 0;
      startX  = e.clientX;
      startTX = currentX();
      viewport.classList.add('is-dragging');
      try { viewport.setPointerCapture(e.pointerId); } catch (err) { /* sin captura seguimos igual */ }
    });

    viewport.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      moved = e.clientX - startX;
      setX(startTX + moved, false);
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('is-dragging');
      /* un quinto de tarjeta basta para cambiar de página */
      if (Math.abs(moved) > step * .2) goTo(page + (moved < 0 ? 1 : -1), true);
      else goTo(page, true);
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    /* evitamos que el arrastre acabe abriendo un enlace de la tarjeta */
    viewport.addEventListener('click', function (e) {
      if (Math.abs(moved) > 6) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    /* --- teclado --- */
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(page + 1, true); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(page - 1, true); }
    });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(measure, 150);
    });

    measure();
    /* las fuentes cambian el alto de las tarjetas y, con ello, el ancho útil */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener('load', measure);
  }

  /* ================================================================== */
  /*  6. REVELADOS AL HACER SCROLL                                      */
  /* ================================================================== */

  /* títulos de sección: revelado por máscara */
  $$('[data-anim="lines"]').forEach(function (el) {
    gsap.to(el.querySelector('span'), {
      yPercent: 0, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  batch('[data-anim="fade"]', { y: 26, duration: .85, stagger: .09 });
  batch('[data-anim="card"]', { y: 46, duration: 1,   stagger: .12, ease: 'expo.out' });
  batch('[data-anim="row"]',  { y: 22, duration: .7,  stagger: .05 });

  function batch(selector, vars) {
    var els = $$(selector);
    if (!els.length) return;

    ScrollTrigger.batch(els, {
      start: 'top 90%',
      once: true,
      onEnter: function (targets) {
        /* Si ya se mostraron al entrar por un ancla, no los volvemos a ocultar
           para animarlos: se vería un parpadeo al subir y volver a bajar. */
        targets = targets.filter(function (t) {
          return Number(gsap.getProperty(t, 'opacity')) === 0;
        });
        if (!targets.length) return;

        gsap.fromTo(targets,
          { opacity: 0, y: vars.y },
          {
            opacity: 1, y: 0,
            duration: vars.duration,
            ease: vars.ease || 'power3.out',
            stagger: vars.stagger,
            overwrite: true
          });
      }
    });
  }

  /* ================================================================== */
  /*  7. CONTADORES                                                     */
  /* ================================================================== */
  $$('.stat__num').forEach(function (el) {
    var target = parseFloat(el.dataset.count || '0');
    var suffix = el.dataset.suffix || '';
    var obj = { v: 0 };

    /* el HTML ya trae la cifra final: la ponemos a cero justo antes de contar */
    el.textContent = '0' + suffix;

    gsap.to(obj, {
      v: target, duration: 1.8, ease: 'power2.out',
      onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; },
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* ================================================================== */
  /*  8. PARALLAX DEL HERO                                              */
  /* ================================================================== */
  /* Sólo aquí: su imagen tiene un 14% de altura extra reservada para este
     desplazamiento. Las fotos de equipo y despacho usan zoom al pasar el
     ratón (CSS), que no necesita holgura y no descuadra el encuadre. */
  if (window.innerWidth > 1000) {
    gsap.to('.hero__img', {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 }
    });
  }

  /* ================================================================== */
  /*  9. BOTONES FLOTANTES                                              */
  /* ================================================================== */
  initToTop();

  /* Al entrar en contacto retiramos los flotantes: la sección ya ofrece
     WhatsApp, teléfono y formulario, y el botón verde taparía «Enviar». */
  (function ocultarFlotantesEnContacto() {
    var contacto = $('#contacto');
    if (!contacto) return;

    ScrollTrigger.create({
      trigger: contacto,
      start: 'top 75%',
      end: 'bottom top',
      onToggle: function (self) {
        document.body.classList.toggle('contact-visible', self.isActive);
      }
    });
  })();

  function initToTop() {
    var btn = $('#toTop');
    if (!btn) return;

    var onScroll = function () {
      btn.classList.toggle('is-visible', window.scrollY > window.innerHeight * .9);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ================================================================== */
  /*  10. FORMULARIO                                                    */
  /* ================================================================== */
  initSelect();
  initForm();

  /* Desplegable propio. Las <option> nativas no se pueden maquetar en la
     mayoría de navegadores, así que ocultamos el <select> —que sigue en el
     DOM guardando el valor— y montamos encima una lista accesible. */
  function initSelect() {
    $$('.selectWrap').forEach(function (wrap) {
      var native = $('select', wrap);
      if (!native || wrap.classList.contains('is-enhanced')) return;

      var opts   = Array.prototype.slice.call(native.options);
      var abierto = false;
      var activo  = native.selectedIndex;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sel__btn';
      btn.id = native.id + 'Btn';
      btn.setAttribute('aria-haspopup', 'listbox');
      btn.setAttribute('aria-expanded', 'false');

      var texto = document.createElement('span');
      texto.textContent = opts[native.selectedIndex].text;
      btn.appendChild(texto);
      btn.insertAdjacentHTML('beforeend',
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.4L5.6 9 7 7.6l5 5 5-5L18.4 9z"/></svg>');

      var list = document.createElement('div');
      list.className = 'sel__list';
      list.setAttribute('role', 'listbox');
      list.setAttribute('aria-labelledby', btn.id);

      var items = opts.map(function (o, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'sel__opt' + (i === native.selectedIndex ? ' is-selected' : '');
        b.setAttribute('role', 'option');
        b.setAttribute('aria-selected', String(i === native.selectedIndex));
        b.textContent = o.text;
        b.addEventListener('click', function () { elegir(i); cerrar(); btn.focus(); });
        list.appendChild(b);
        return b;
      });

      wrap.appendChild(btn);
      wrap.appendChild(list);
      wrap.classList.add('is-enhanced');

      /* la etiqueta del campo pasa a señalar al botón, no al select oculto */
      var lab = document.querySelector('label[for="' + native.id + '"]');
      if (lab) lab.setAttribute('for', btn.id);

      function pintar(i) {
        texto.textContent = opts[i].text;
        items.forEach(function (b, j) {
          b.classList.toggle('is-selected', j === i);
          b.setAttribute('aria-selected', String(j === i));
        });
        activo = i;
      }

      function elegir(i) {
        native.selectedIndex = i;
        native.dispatchEvent(new Event('change', { bubbles: true }));
        pintar(i);
      }

      /* Tras enviar la consulta el formulario se vacía con reset(), pero eso
         sólo devuelve el <select> nativo —que está oculto— a su opción inicial:
         la lista propia seguiría mostrando la materia anterior. El setTimeout
         es necesario porque el evento «reset» se dispara antes de que los
         campos hayan cambiado de valor. */
      if (native.form) {
        native.form.addEventListener('reset', function () {
          setTimeout(function () { pintar(native.selectedIndex); }, 0);
        });
      }

      function resaltar(i) {
        activo = Math.max(0, Math.min(i, items.length - 1));
        items.forEach(function (b, j) { b.classList.toggle('is-active', j === activo); });
        items[activo].scrollIntoView({ block: 'nearest' });
      }

      /* El campo entero se eleva mientras el panel está abierto: si no, los
         campos posteriores del formulario lo tapan (ver nota en el CSS). */
      var campo = wrap.closest ? wrap.closest('.field') : wrap.parentElement;

      function abrir() {
        if (abierto) return;
        abierto = true;
        wrap.classList.add('is-open');
        if (campo) campo.classList.add('field--front');
        btn.setAttribute('aria-expanded', 'true');
        resaltar(native.selectedIndex);
      }

      function cerrar() {
        if (!abierto) return;
        abierto = false;
        wrap.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        items.forEach(function (b) { b.classList.remove('is-active'); });
        /* esperamos a que termine el desvanecido para bajarlo de capa */
        setTimeout(function () {
          if (!abierto && campo) campo.classList.remove('field--front');
        }, 320);
      }

      btn.addEventListener('click', function () { abierto ? cerrar() : abrir(); });

      btn.addEventListener('keydown', function (e) {
        var abre = e.key === 'ArrowDown' || e.key === 'ArrowUp' ||
                   e.key === 'Enter'     || e.key === ' ';
        if (abre) e.preventDefault();
        if (!abierto) { if (abre) abrir(); return; }

        if (e.key === 'ArrowDown')      resaltar(activo + 1);
        else if (e.key === 'ArrowUp')   resaltar(activo - 1);
        else if (e.key === 'Enter' || e.key === ' ') { elegir(activo); cerrar(); }
        else if (e.key === 'Escape')    { e.preventDefault(); cerrar(); }
        else if (e.key === 'Home')      { e.preventDefault(); resaltar(0); }
        else if (e.key === 'End')       { e.preventDefault(); resaltar(items.length - 1); }
      });

      document.addEventListener('click', function (e) {
        if (!wrap.contains(e.target)) cerrar();
      });
    });
  }

  function initForm() {
    var form = $('#form');
    if (!form) return;
    var note   = $('#formNote');
    var boton  = $('button[type="submit"]', form);
    var sello  = $('#formT');
    var enviando = false;

    /* Marca de tiempo para el filtro antispam del servidor. */
    if (sello) sello.value = String(Math.floor(Date.now() / 1000));

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (enviando) return;

      var nombre  = $('#nombre');
      var email   = $('#email');
      var tel     = $('#tel');
      var materia = $('#materia');
      var mensaje = $('#mensaje');
      var rgpd    = $('#rgpd');

      var faltan = [];
      [nombre, email, mensaje].forEach(function (f) {
        var bad = !f.value.trim();
        f.classList.toggle('is-error', bad);
        if (bad) faltan.push(f);
      });

      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      if (email.value.trim() && !emailOk) { email.classList.add('is-error'); faltan.push(email); }

      if (faltan.length) {
        show('Revise los campos marcados antes de enviar.', true);
        faltan[0].focus();
        return;
      }
      if (!rgpd.checked) {
        show('Debe aceptar la política de privacidad para continuar.', true);
        return;
      }

      /* El envío lo hace enviar.php en el propio servidor. La cabecera
         X-Requested-With es la que hace que conteste en JSON en lugar de
         redirigir, para no sacar al visitante de la página. */
      enviando = true;
      bloquear(true, 'Enviando…');
      show('Enviando su consulta…', false);

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      })
      .then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (data) {
        if (data && data.ok) {
          form.reset();
          if (sello) sello.value = String(Math.floor(Date.now() / 1000));
          show(data.mensaje, false);
          bloquear(true, 'Consulta enviada');
          return;
        }
        show((data && data.mensaje) || 'No hemos podido enviar la consulta. Escríbanos a info@cleverabogados.es', true);
        enviando = false;
        bloquear(false, 'Enviar consulta');
      })
      .catch(function () {
        /* Sin conexión o PHP caído: se le da una vía alternativa, no un error seco. */
        show('No hay conexión con el servidor. Llámenos al 966 300 232 o escriba a info@cleverabogados.es', true);
        enviando = false;
        bloquear(false, 'Enviar consulta');
      });
    });

    function bloquear(off, texto) {
      if (!boton) return;
      boton.disabled = off;
      boton.textContent = texto;
    }

    function show(msg, isError) {
      if (!note) return;
      note.textContent = msg;
      note.classList.toggle('is-error', !!isError);
      if (animate) gsap.fromTo(note, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .4 });
    }

    $$('input, textarea', form).forEach(function (f) {
      f.addEventListener('input', function () { f.classList.remove('is-error'); });
    });
  }

  /* ================================================================== */
  /*  ENTRADA POR ENLACE CON ANCLA                                      */
  /* ================================================================== */
  /* Al abrir la web directamente en una sección —cleverabogados.es/#contacto,
     un enlace compartido por WhatsApp, un sitelink de Google— el navegador
     coloca la página ahí de un salto. Todo lo que queda por encima nunca
     «entra» en pantalla, así que el onEnter de ScrollTrigger.batch no llega a
     dispararse y esos bloques se quedan a opacidad 0 de forma permanente: con
     #contacto no se veían ni el teléfono, ni el correo, ni el formulario.

     Los mostramos ya puestos, sin animación. El revelado es un adorno; que se
     vea el formulario de contacto no lo es. */
  function revelarLoQueYaEstaEnPantalla() {
    var limite = window.innerHeight * 0.9;   /* el mismo umbral que start:'top 90%' */

    $$('[data-anim]').forEach(function (el) {
      if (el.dataset.anim === 'lines') return;
      if (el.getBoundingClientRect().top >= limite) return;
      if (Number(gsap.getProperty(el, 'opacity')) > 0) return;
      gsap.set(el, { opacity: 1, y: 0 });
    });

    /* titulares con máscara: su span sigue desplazado fuera del recorte */
    $$('[data-anim="lines"] > span, .secTitle > span').forEach(function (span) {
      var el = span.parentNode;
      if (el.getBoundingClientRect().top >= limite) return;
      if (Number(gsap.getProperty(span, 'yPercent')) === 0) return;
      gsap.set(span, { yPercent: 0, opacity: 1 });
    });
  }

  /* Sólo si la página ha arrancado desplazada: a scroll 0 manda la animación
     de entrada del hero y no hay que tocar nada. */
  function siEntroPorAncla() {
    if (window.scrollY > 0) revelarLoQueYaEstaEnPantalla();
  }

  window.addEventListener('hashchange', function () {
    setTimeout(siEntroPorAncla, 100);
  });

  /* recalcular posiciones cuando cargan fuentes e imágenes */
  window.addEventListener('load', function () {
    ScrollTrigger.refresh();
    /* tras el refresh el navegador puede reajustar el salto del ancla */
    setTimeout(siEntroPorAncla, 100);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
