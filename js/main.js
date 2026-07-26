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

      .fromTo('.hero__lead, .hero__cta, .hero__meta',
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: .8, stagger: .1 }, '-=.85')

      .fromTo('.hero__scroll', { opacity: 0 }, { opacity: 1, duration: .6 }, '-=.4');

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
    var nums  = $$('.menu__link em', menu);
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
      .fromTo(nums,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: .5, stagger: .05 }, '-=.7')
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
  /*  5. CARRUSEL DE RESEÑAS                                            */
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

    function goTo(p, animated) {
      page = Math.max(0, Math.min(p, pages - 1));
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
      if (prevBtn) prevBtn.disabled = page === 0;
      if (nextBtn) nextBtn.disabled = page >= pages - 1;
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
  /*  9. VOLVER ARRIBA                                                  */
  /* ================================================================== */
  initToTop();

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
  initForm();

  function initForm() {
    var form = $('#form');
    if (!form) return;
    var note = $('#formNote');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

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

      /* Sin backend: se abre el cliente de correo con la consulta redactada. */
      var cuerpo =
        'Nombre: '   + nombre.value.trim()  + '\n' +
        'Email: '    + email.value.trim()   + '\n' +
        'Teléfono: ' + (tel.value.trim() || '—') + '\n' +
        'Materia: '  + materia.value        + '\n\n' +
        mensaje.value.trim();

      window.location.href =
        'mailto:info@cleverabogados.es' +
        '?subject=' + encodeURIComponent('Consulta web — ' + materia.value) +
        '&body='    + encodeURIComponent(cuerpo);

      show('Abriendo su gestor de correo… Si no se abre, escríbanos a info@cleverabogados.es', false);
    });

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

  /* recalcular posiciones cuando cargan fuentes e imágenes */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
