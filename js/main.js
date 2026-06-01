/* ============================================================================
   AMIT CHOUHAN — main.js
   Live clock · mobile nav · Lenis smooth scroll ⇄ GSAP/ScrollTrigger · loader ·
   scroll-reveal motion · count-ups · skill-bar fills · nav behaviour.
   Plus: projects carousel · contact form (separate modules below).
   Everything is transform/opacity-based and respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var REDUCE    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HAS_GSAP  = typeof window.gsap !== 'undefined';
  var HAS_ST    = typeof window.ScrollTrigger !== 'undefined';
  var HAS_LENIS = typeof window.Lenis === 'function';
  var MOBILE_MQ = window.matchMedia('(max-width: 767px)');
  var isMobile  = MOBILE_MQ.matches;
  var body = document.body;

  if (HAS_ST) {
    window.ScrollTrigger.config({ ignoreMobileResize: true });
  }

  /* ---- LIVE CLOCK (Ludhiana / IST, every second) ------------------------ */
  (function () {
    var els = document.querySelectorAll('.js-clock');
    if (!els.length) return;
    var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    function tick() { var t = fmt.format(new Date()); for (var i = 0; i < els.length; i++) els[i].textContent = t; }
    tick();
    setInterval(tick, 1000);
  })();

  /* ---- MOBILE NAV — hamburger → slide-in panel -------------------------- */
  (function () {
    var burger = document.getElementById('navBurger');
    var panel  = document.getElementById('navPanel');
    var scrim  = document.getElementById('navScrim');
    var scrollY = 0;

    function lockScroll() {
      scrollY = window.scrollY || window.pageYOffset || 0;
      body.style.top = '-' + scrollY + 'px';
    }

    function unlockScroll() {
      body.style.top = '';
      (document.documentElement || document.body).scrollTo({ top: scrollY, behavior: 'auto' });
    }

    function open() {
      lockScroll();
      body.classList.add('nav-open');
      if (burger) { burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Close menu'); }
      if (panel) panel.setAttribute('aria-hidden', 'false');
      if (scrim) scrim.hidden = false;
    }

    function close() {
      body.classList.remove('nav-open');
      if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu'); }
      if (panel) panel.setAttribute('aria-hidden', 'true');
      if (scrim) scrim.hidden = true;
      unlockScroll();
    }

    if (burger) burger.addEventListener('click', function () { body.classList.contains('nav-open') ? close() : open(); });
    if (scrim)  scrim.addEventListener('click', close);
    if (panel)  panel.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && body.classList.contains('nav-open')) close(); });
  })();

  /* ---- SMOOTH SCROLL — Lenis driven by the GSAP ticker (Desktop only) --- */
  var lenis = null;
  if (!REDUCE && HAS_LENIS && !isMobile) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    if (HAS_GSAP && HAS_ST) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
    }
  } else if (HAS_GSAP && HAS_ST) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  /* ---- ANCHOR SMOOTH SCROLL --------------------------------------------- */
  var NAV_OFFSET = 80;
  function scrollToAnchor(target, hash) {
    if (!target) return;
    var offset = NAV_OFFSET;
    if (hash === '#letstalk') offset = NAV_OFFSET + 8;
    if (lenis) {
      lenis.scrollTo(target, { offset: -offset });
      return;
    }
    if (HAS_ST) window.ScrollTrigger.refresh();
    var docEl = document.documentElement;
    var y = target.getBoundingClientRect().top + (window.pageYOffset || docEl.scrollTop) - offset;
    (docEl || document.body).scrollTo({ top: Math.max(0, y), behavior: REDUCE ? 'auto' : 'smooth' });
    if (HAS_ST) {
      window.setTimeout(function () { window.ScrollTrigger.refresh(); }, REDUCE ? 0 : 450);
    }
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      scrollToAnchor(target, id);
    });
  });

  /* ---- LOADER — bar fills, then slides up to reveal the hero ------------- */
  var loader = document.getElementById('loader');
  (function () {
    if (!loader) return;
    if (REDUCE || !HAS_GSAP) { loader.style.display = 'none'; revealHero(); return; }
    var tl = window.gsap.timeline();
    tl.set('.loader__bar-fill', { scaleX: 0 })
      .to('.loader__bar-fill', { scaleX: 1, duration: 0.9, ease: 'power2.inOut' })
      .to(loader, { yPercent: -100, duration: 0.7, ease: 'power4.inOut' }, '+=0.05')
      .set(loader, { display: 'none' })
      .add(revealHero, '-=0.25');
    // Safety: never trap the page behind the loader.
    setTimeout(function () { if (loader && getComputedStyle(loader).display !== 'none') loader.style.display = 'none'; }, 4500);
  })();

  function revealHero() {
    if (REDUCE || !HAS_GSAP) return;
    window.gsap.from('.about__image-container, .about__title, .about__lead, .about__currently, .about__cta, .stat', {
      y: 26, opacity: 0, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.08
    });
  }

  /* ---- SCROLL-TRIGGERED MOTION ------------------------------------------ */
  if (!REDUCE && HAS_GSAP && HAS_ST) initScrollMotion();

  function initScrollMotion() {
    var gsap = window.gsap, ST = window.ScrollTrigger;

    // Numbered //labels + headings slide in with overshoot
    gsap.utils.toArray('.section-head:not(.section--about .section-head)').forEach(function (head) {
      var items = head.querySelectorAll('.section-label, .section-title');
      if (!items.length) return;
      gsap.from(items, { yPercent: 45, opacity: 0, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.1,
        scrollTrigger: { trigger: head, start: 'top 85%' } });
    });

    // Big contact CTA
    var cta = document.querySelector('.cta__title');
    if (cta) gsap.from(cta, { yPercent: 30, opacity: 0, duration: 0.8, ease: 'back.out(1.5)',
      scrollTrigger: { trigger: cta, start: 'top 85%' } });

    // Card groups — stagger up so hard shadows "snap" into place
    [['.pillars', '.pillar'], ['#services .cards-grid', '.service'],
     ['.edu__list', '.edu__item'], ['.skills__groups', '.skill-group']
    ].forEach(function (g) {
      gsap.utils.toArray(g[0]).forEach(function (c) {
        var items = c.querySelectorAll(g[1]);
        if (!items.length) return;
        gsap.from(items, { y: 30, opacity: 0, duration: 0.6, ease: 'back.out(1.7)', stagger: 0.09,
          scrollTrigger: { trigger: c, start: 'top 82%' } });
      });
    });

    // Contact links: opacity only — y-transform bleeds into “Let's Talk” below on mobile
    gsap.utils.toArray('.contact__direct').forEach(function (c) {
      var items = c.querySelectorAll('.contact__btn');
      if (!items.length) return;
      gsap.from(items, { opacity: 0, duration: 0.55, ease: 'power2.out', stagger: 0.09,
        scrollTrigger: { trigger: c, start: 'top 82%' } });
    });

    // Timeline items
    gsap.utils.toArray('.timeline__item').forEach(function (item) {
      gsap.from(item, { y: 30, opacity: 0, duration: 0.6, ease: 'back.out(1.7)',
        scrollTrigger: { trigger: item, start: 'top 85%' } });
    });

    // Certification badge pop
    var cert = document.querySelector('.edu__cert');
    if (cert) gsap.from(cert, { scale: 0.92, opacity: 0, duration: 0.6, ease: 'back.out(2)',
      scrollTrigger: { trigger: cert, start: 'top 80%' } });

    // Story chapters — alternate slide in
    gsap.utils.toArray('.story__chapter').forEach(function (ch, i) {
      gsap.from(ch, { x: (i % 2 ? 50 : -50), opacity: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: ch, start: 'top 80%' } });
    });

    // Project cards
    var ptrack = document.getElementById('workTrack');
    if (ptrack) gsap.from(ptrack.children, { y: 30, opacity: 0, duration: 0.5, ease: 'back.out(1.6)', stagger: 0.06,
      scrollTrigger: { trigger: '#work', start: 'top 78%' } });

    // Contact form
    var cform = document.getElementById('contactForm');
    if (cform) gsap.from(cform, { y: 30, opacity: 0, duration: 0.6, ease: 'back.out(1.6)',
      scrollTrigger: { trigger: cform, start: 'top 82%', invalidateOnRefresh: true } });

    // COUNT-UP numbers (About stats + skill %)
    gsap.utils.toArray('.js-count').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-target'));
      if (isNaN(target)) return;
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var suf = el.getAttribute('data-suffix') || '';
      var pre = el.getAttribute('data-prefix') || '';
      var o = { v: 0 };
      el.textContent = pre + (0).toFixed(dec) + suf;
      gsap.to(o, { v: target, duration: 1.4, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate: function () { el.textContent = pre + o.v.toFixed(dec) + suf; },
        onComplete: function () { el.textContent = pre + target.toFixed(dec) + suf; } });
    });

    // SKILL bars — fill from 0 via transform (scaleX)
    gsap.utils.toArray('.skillbar__fill').forEach(function (fill) {
      gsap.fromTo(fill, { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left center', duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: fill, start: 'top 94%', once: true } });
    });

    // Parallax profile photo — desktop only (scrub parallax can break mobile scroll height)
    if (!isMobile) {
      var pimg = document.querySelector('.js-parallax-img');
      if (pimg) {
        gsap.fromTo(pimg,
          { yPercent: -12 },
          { yPercent: 12, ease: 'none',
            scrollTrigger: {
              trigger: '.about__image-container',
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.3
            }
          }
        );
      }
    }

    initNavBehavior(gsap, ST);

    ST.refresh();
    window.addEventListener('load', function () { ST.refresh(); });
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () { ST.refresh(); }, 200);
    });
    if (MOBILE_MQ.addEventListener) {
      MOBILE_MQ.addEventListener('change', function () { ST.refresh(); });
    }
  }

  /* ---- NAV: hide on scroll-down / show on scroll-up · progress · active -- */
  function initNavBehavior(gsap, ST) {
    var nav = document.getElementById('nav');
    var progress = document.getElementById('scrollProgress');
    var links = document.querySelectorAll('.nav__link');

    // Thin mint scroll-progress bar
    if (progress) gsap.to(progress, { scaleX: 1, transformOrigin: 'left center', ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    // Hide on scroll-down, show on scroll-up (never while the menu is open)
    if (nav) ST.create({ start: 0, end: 'max', onUpdate: function (self) {
      if (body.classList.contains('nav-open')) { nav.classList.remove('nav--hidden'); return; }
      if (self.direction === 1 && self.scroll() > 240) nav.classList.add('nav--hidden');
      else if (self.direction === -1) nav.classList.remove('nav--hidden');
    } });

    // Active link by section in view
    function setActive(link) { links.forEach(function (l) { l.classList.toggle('is-active', l === link); }); }
    links.forEach(function (link) {
      var id = link.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return;
      var sec = document.querySelector(id);
      if (!sec) return;
      ST.create({ trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onToggle: function (self) { if (self.isActive) setActive(link); } });
    });
  }

  /* ---- DARK THEME TOGGLE ------------------------------------------------ */
  (function () {
    var toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;
    toggleBtn.addEventListener('click', function () {
      var isDark = document.body.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  })();
})();

/* ============================================================================
   PROJECTS CAROUSEL — prev/next arrows · drag-to-scroll · snap · keyboard
   ========================================================================== */
(function () {
  'use strict';
  var track = document.getElementById('workTrack');
  if (!track) return;

  var prev = document.querySelector('.carousel__arrow[data-dir="prev"]');
  var next = document.querySelector('.carousel__arrow[data-dir="next"]');

  function stepSize() {
    var card = track.querySelector('.project');
    if (!card) return track.clientWidth * 0.9;
    var cs = getComputedStyle(track);
    var gap = parseFloat(cs.columnGap || cs.gap) || 20;
    return card.getBoundingClientRect().width + gap;
  }
  function updateArrows() {
    var max = track.scrollWidth - track.clientWidth - 2;
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= max;
  }
  function go(dir) { track.scrollBy({ left: dir * stepSize(), behavior: 'smooth' }); }

  if (prev) prev.addEventListener('click', function () { go(-1); });
  if (next) next.addEventListener('click', function () { go(1); });
  track.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();

  // Drag-to-scroll (mouse only; touch/trackpad use native scrolling)
  var down = false, startX = 0, startScroll = 0, moved = false;
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse') return;
    down = true; moved = false; startX = e.clientX; startScroll = track.scrollLeft;
    track.classList.add('is-dragging');
  });
  window.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    track.scrollLeft = startScroll - dx;
  });
  window.addEventListener('pointerup', function () {
    if (!down) return;
    down = false; track.classList.remove('is-dragging');
  });
  // Swallow the click that ends a drag so it doesn't trigger a card link/action
  track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);

  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  });
})();

/* ============================================================================
   CONTACT FORM — AJAX submit to php/send-mail.php (no page reload)
   ========================================================================== */
(function () {
  'use strict';
  var form = document.getElementById('contactForm');
  if (!form) return;

  var note = form.querySelector('.contact__form-note');
  var btn = form.querySelector('.contact__submit');
  var btnLabel = btn ? btn.textContent : 'Send';

  function setNote(msg, type) {
    if (!note) return;
    note.textContent = msg || '';
    note.classList.remove('is-success', 'is-error');
    if (type) note.classList.add(type === 'success' ? 'is-success' : 'is-error');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Honeypot — bots fill the hidden "_honey" field; bail silently.
    if (form._honey && form._honey.value) return;

    // Client-side validation
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var data = new FormData(form);
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    setNote('Sending your message…', null);

    fetch(form.action, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
      .then(function (r) {
        return r.json().catch(function () {
          return { success: false, message: 'Unexpected server response. Please email martialamit5@gmail.com directly.' };
        });
      })
      .then(function (res) {
        if (res && (res.success === 'true' || res.success === true)) {
          setNote(res.message || 'Thanks! Your message has been sent.', 'success');
          form.reset();
        } else {
          setNote((res && res.message) || 'Something went wrong. Please try again.', 'error');
        }
      })
      .catch(function () {
        setNote('Network error — please email martialamit5@gmail.com directly.', 'error');
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = btnLabel; }
      });
  });
})();
