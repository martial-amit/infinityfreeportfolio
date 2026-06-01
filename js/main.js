/* ============================================================================
   AMIT CHOUHAN — main.js
   Mobile nav · Lenis ⇄ GSAP/ScrollTrigger · loader · scroll motion · form
   ========================================================================== */
(function () {
  'use strict';

  var REDUCE    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HAS_GSAP  = typeof window.gsap !== 'undefined';
  var HAS_ST    = typeof window.ScrollTrigger !== 'undefined';
  var HAS_LENIS = typeof window.Lenis === 'function';
  var MOBILE_MQ = window.matchMedia('(max-width: 767px)');
  var body = document.body;
  var mainEl = document.getElementById('main');
  var footerEl = document.querySelector('.footer');

  function isMobileView() {
    return MOBILE_MQ.matches;
  }

  if (HAS_ST) {
    window.ScrollTrigger.config({ ignoreMobileResize: true });
  }

  /* ---- MOBILE NAV ------------------------------------------------------- */
  var mobileNav = {
    lockedY: 0,
    close: function () {},
    unlockAndScroll: function () {}
  };

  (function () {
    var burger = document.getElementById('navBurger');
    var panel  = document.getElementById('navPanel');
    var scrim  = document.getElementById('navScrim');
    var focusables = [];

    function getFocusables() {
      if (!panel) return [];
      return Array.prototype.slice.call(
        panel.querySelectorAll('a[href], button:not([disabled])')
      );
    }

    function setInert(on) {
      if (mainEl) {
        if (on) mainEl.setAttribute('inert', '');
        else mainEl.removeAttribute('inert');
      }
      if (footerEl) {
        if (on) footerEl.setAttribute('inert', '');
        else footerEl.removeAttribute('inert');
      }
    }

    function lockScroll() {
      mobileNav.lockedY = window.scrollY || window.pageYOffset || 0;
      body.style.top = '-' + mobileNav.lockedY + 'px';
    }

    function unlockScroll(restoreY) {
      body.style.top = '';
      var y = typeof restoreY === 'number' ? restoreY : mobileNav.lockedY;
      window.scrollTo(0, y);
    }

    function setOpenState(isOpen) {
      if (burger) {
        burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        burger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      }
      if (panel) panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      if (scrim) scrim.hidden = !isOpen;
      setInert(isOpen);
      if (isOpen) {
        focusables = getFocusables();
        var first = focusables[0];
        if (first) window.setTimeout(function () { first.focus(); }, 120);
      } else if (burger) {
        burger.focus();
      }
    }

    function open() {
      lockScroll();
      body.classList.add('nav-open');
      setOpenState(true);
    }

    function close() {
      if (!body.classList.contains('nav-open')) return;
      body.classList.remove('nav-open');
      setOpenState(false);
      unlockScroll();
    }

    /** Close menu + restore document scroll, then jump to a section (mobile anchors). */
    function unlockAndScroll(targetY) {
      body.classList.remove('nav-open');
      body.style.top = '';
      setOpenState(false);
      var behavior = REDUCE ? 'auto' : 'smooth';
      requestAnimationFrame(function () {
        window.scrollTo({ top: Math.max(0, targetY), behavior: behavior });
        if (HAS_ST) {
          window.setTimeout(function () { window.ScrollTrigger.refresh(); }, REDUCE ? 0 : 450);
        }
      });
    }

    mobileNav.close = close;
    mobileNav.unlockAndScroll = unlockAndScroll;

    if (burger) {
      burger.addEventListener('click', function () {
        body.classList.contains('nav-open') ? close() : open();
      });
    }
    if (scrim) scrim.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (!body.classList.contains('nav-open')) return;
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab' || !focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  })();

  /* ---- SMOOTH SCROLL (Lenis — desktop only) ----------------------------- */
  var lenis = null;
  var lenisTickerAdded = false;

  function initLenis() {
    if (lenis) {
      if (typeof lenis.destroy === 'function') lenis.destroy();
      lenis = null;
    }
    document.documentElement.classList.remove('lenis-active');
    if (REDUCE || !HAS_LENIS || isMobileView()) return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    document.documentElement.classList.add('lenis-active');
    if (HAS_GSAP && HAS_ST) {
      lenis.on('scroll', window.ScrollTrigger.update);
      if (!lenisTickerAdded) {
        window.gsap.ticker.add(function (t) { if (lenis) lenis.raf(t * 1000); });
        window.gsap.ticker.lagSmoothing(0);
        lenisTickerAdded = true;
      }
    } else {
      (function raf(t) { if (lenis) lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }

  if (HAS_GSAP && HAS_ST) window.gsap.registerPlugin(window.ScrollTrigger);
  initLenis();

  if (MOBILE_MQ.addEventListener) {
    MOBILE_MQ.addEventListener('change', function () {
      initLenis();
      if (HAS_ST) window.ScrollTrigger.refresh();
    });
  }

  /* ---- ANCHOR SCROLL ---------------------------------------------------- */
  var NAV_OFFSET = 80;

  function getTargetScrollY(target, offset) {
    var y = 0;
    var node = target;
    while (node) {
      y += node.offsetTop || 0;
      node = node.offsetParent;
    }
    return Math.max(0, y - offset);
  }

  function scrollToAnchor(target, hash) {
    if (!target) return;
    var offset = NAV_OFFSET;
    if (hash === '#letstalk') offset = NAV_OFFSET + 8;
    var targetY = getTargetScrollY(target, offset);

    if (body.classList.contains('nav-open')) {
      mobileNav.unlockAndScroll(targetY);
      return;
    }

    if (lenis) {
      lenis.scrollTo(target, { offset: -offset });
      return;
    }

    if (HAS_ST) window.ScrollTrigger.refresh();
    window.scrollTo({
      top: targetY,
      behavior: REDUCE ? 'auto' : 'smooth'
    });
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

  /* ---- LOADER ----------------------------------------------------------- */
  var loader = document.getElementById('loader');
  (function () {
    if (!loader) return;
    if (REDUCE || !HAS_GSAP) {
      loader.style.display = 'none';
      revealHero();
      return;
    }
    var tl = window.gsap.timeline();
    tl.set('.loader__bar-fill', { scaleX: 0 })
      .to('.loader__bar-fill', { scaleX: 1, duration: 0.9, ease: 'power2.inOut' })
      .to(loader, { yPercent: -100, duration: 0.7, ease: 'power4.inOut' }, '+=0.05')
      .set(loader, { display: 'none' })
      .add(revealHero, '-=0.25');
    setTimeout(function () {
      if (loader && getComputedStyle(loader).display !== 'none') loader.style.display = 'none';
    }, 4500);
  })();

  function revealHero() {
    if (REDUCE || !HAS_GSAP) return;
    window.gsap.from('.about__image-container, .about__title, .about__lead, .about__currently, .about__cta, .stat', {
      y: 26, opacity: 0, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.08
    });
  }

  /* ---- SCROLL MOTION ---------------------------------------------------- */
  if (!REDUCE && HAS_GSAP && HAS_ST) initScrollMotion();

  function initScrollMotion() {
    var gsap = window.gsap;
    var ST = window.ScrollTrigger;

    initNavBehavior(gsap, ST);

    if (isMobileView()) {
      bindScrollRefresh(ST);
      return;
    }

    gsap.utils.toArray('.section-head:not(.section--about .section-head)').forEach(function (head) {
      var items = head.querySelectorAll('.section-label, .section-title');
      if (!items.length) return;
      gsap.from(items, {
        yPercent: 45, opacity: 0, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.1,
        scrollTrigger: { trigger: head, start: 'top 85%' }
      });
    });

    var cta = document.querySelector('.letstalk__cta .cta__title');
    if (cta) {
      gsap.from(cta, {
        opacity: 0, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: cta, start: 'top 88%', once: true, invalidateOnRefresh: true }
      });
    }

    [['.pillars', '.pillar'], ['#services .cards-grid', '.service'],
      ['.edu__list', '.edu__item'], ['.skills__groups', '.skill-group']
    ].forEach(function (g) {
      gsap.utils.toArray(g[0]).forEach(function (c) {
        var items = c.querySelectorAll(g[1]);
        if (!items.length) return;
        gsap.from(items, {
          y: 30, opacity: 0, duration: 0.6, ease: 'back.out(1.7)', stagger: 0.09,
          scrollTrigger: { trigger: c, start: 'top 82%' }
        });
      });
    });

    gsap.utils.toArray('.timeline__item').forEach(function (item) {
      gsap.from(item, {
        y: 30, opacity: 0, duration: 0.6, ease: 'back.out(1.7)',
        scrollTrigger: { trigger: item, start: 'top 85%' }
      });
    });

    var cert = document.querySelector('.edu__cert');
    if (cert) {
      gsap.from(cert, {
        scale: 0.92, opacity: 0, duration: 0.6, ease: 'back.out(2)',
        scrollTrigger: { trigger: cert, start: 'top 80%' }
      });
    }

    var ptrack = document.getElementById('workTrack');
    if (ptrack) {
      gsap.from(ptrack.children, {
        y: 30, opacity: 0, duration: 0.5, ease: 'back.out(1.6)', stagger: 0.06,
        scrollTrigger: { trigger: '#work', start: 'top 78%' }
      });
    }

    var cform = document.getElementById('contactForm');
    if (cform) {
      gsap.from(cform, {
        opacity: 0, duration: 0.55, ease: 'power2.out',
        scrollTrigger: { trigger: cform, start: 'top 88%', once: true, invalidateOnRefresh: true }
      });
    }

    gsap.utils.toArray('.js-count').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-target'));
      if (isNaN(target)) return;
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var suf = el.getAttribute('data-suffix') || '';
      var pre = el.getAttribute('data-prefix') || '';
      var o = { v: 0 };
      el.textContent = pre + (0).toFixed(dec) + suf;
      gsap.to(o, {
        v: target, duration: 1.4, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate: function () { el.textContent = pre + o.v.toFixed(dec) + suf; },
        onComplete: function () { el.textContent = pre + target.toFixed(dec) + suf; }
      });
    });

    gsap.utils.toArray('.skillbar__fill').forEach(function (fill) {
      gsap.fromTo(fill,
        { scaleX: 0 },
        {
          scaleX: 1, transformOrigin: 'left center', duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: fill, start: 'top 94%', once: true }
        }
      );
    });

    bindScrollRefresh(ST);
  }

  function bindScrollRefresh(ST) {
    ST.refresh();
    window.addEventListener('load', function () { ST.refresh(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ST.refresh(); });
    }
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () { ST.refresh(); }, 200);
    });
    if (MOBILE_MQ.addEventListener) {
      MOBILE_MQ.addEventListener('change', function () { ST.refresh(); });
    }
  }

  function initNavBehavior(gsap, ST) {
    var nav = document.getElementById('nav');
    var progress = document.getElementById('scrollProgress');
    var links = document.querySelectorAll('.nav__anchor');
    var mobile = isMobileView();

    if (progress) {
      if (mobile) {
        ST.create({
          start: 0,
          end: 'max',
          onUpdate: function (self) {
            gsap.set(progress, { scaleX: self.progress, transformOrigin: 'left center' });
          }
        });
      } else {
        gsap.to(progress, {
          scaleX: 1,
          transformOrigin: 'left center',
          ease: 'none',
          scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
        });
      }
    }

    if (nav) {
      ST.create({
        start: 0,
        end: mobile ? function () { return document.documentElement.scrollHeight; } : 'max',
        onUpdate: function (self) {
          if (body.classList.contains('nav-open')) {
            nav.classList.remove('nav--hidden');
            return;
          }
          if (self.direction === 1 && self.scroll() > 240) nav.classList.add('nav--hidden');
          else if (self.direction === -1) nav.classList.remove('nav--hidden');
        }
      });
    }

    function setActive(link) {
      links.forEach(function (l) {
        l.classList.toggle('is-active', l === link);
      });
    }

    links.forEach(function (link) {
      var id = link.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return;
      var sec = document.querySelector(id);
      if (!sec) return;
      ST.create({
        trigger: sec,
        start: 'top 45%',
        end: 'bottom 45%',
        onToggle: function (self) { if (self.isActive) setActive(link); }
      });
    });
  }

  /* ---- THEME TOGGLE ----------------------------------------------------- */
  (function () {
    var toggleBtn = document.getElementById('themeToggle');
    var themeMeta = document.getElementById('themeColorMeta');
    if (!toggleBtn) return;

    function applyThemeColor(dark) {
      if (themeMeta) themeMeta.setAttribute('content', dark ? '#121212' : '#F3EFE0');
    }

    toggleBtn.addEventListener('click', function () {
      var isDark = document.body.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      applyThemeColor(isDark);
    });
  })();
})();

/* ============================================================================
   PROJECTS CAROUSEL
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
    down = false;
    track.classList.remove('is-dragging');
  });
  track.addEventListener('click', function (e) {
    if (moved) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  });
})();

/* ============================================================================
   CONTACT FORM — FormSubmit.co AJAX
   ========================================================================== */
(function () {
  'use strict';
  var form = document.getElementById('contactForm');
  if (!form) return;

  var note = form.querySelector('.contact__form-note');
  var btn = form.querySelector('.contact__submit');
  var btnLabel = btn ? btn.textContent : 'Send';
  var honey = form.elements.namedItem('_honey');

  function setNote(msg, type) {
    if (!note) return;
    note.textContent = msg || '';
    note.classList.remove('is-success', 'is-error');
    if (type) note.classList.add(type === 'success' ? 'is-success' : 'is-error');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (honey && honey.value) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var data = new FormData(form);
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    setNote('Sending your message…', null);

    fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (r) {
        return r.json().catch(function () {
          return {
            success: false,
            message: 'Unexpected server response. Please email martialamit5@gmail.com directly.'
          };
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
