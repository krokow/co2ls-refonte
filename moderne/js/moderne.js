/*
 * CO2 LASER SERVICES — version « moderne ».
 * Défilement, révélations, compteurs, projecteur au curseur, menu mobile.
 * Aucune dépendance externe.
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ------------------------------------------------ en-tête & progression */
  var hdr = $('.hdr');
  var bar = $('.progress span');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    hdr.classList.toggle('is-stuck', y > 24);

    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

    var heroBg = $('.hero-bg');
    if (heroBg && y < window.innerHeight * 1.2) {
      heroBg.style.transform = 'translate3d(0,' + (y * 0.22) + 'px,0)';
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ------------------------------------------------ menu mobile */
  var burger = $('#burger');
  var nav = $('#nav');

  function closeMenu() {
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
  }

  burger.addEventListener('click', function () {
    var open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
  });

  nav.addEventListener('click', function (ev) {
    if (ev.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') closeMenu();
  });

  /* ------------------------------------------------ ancre active */
  var sections = $$('main section[id]');
  var navLinks = $$('.nav a');

  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var id = e.target.id;
      navLinks.forEach(function (a) {
        a.classList.toggle('is-current', a.getAttribute('href') === '#' + id);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach(function (s) { spy.observe(s); });

  /* ------------------------------------------------ révélations */
  var revealer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (e, i) {
      if (!e.isIntersecting) return;
      var el = e.target;
      // Décalage progressif entre voisins d'une même grille
      var siblings = el.parentElement ? $$('.reveal', el.parentElement) : [];
      var idx = Math.max(0, siblings.indexOf(el));
      el.style.transitionDelay = Math.min(idx, 5) * 90 + 'ms';
      el.classList.add('is-in');
      obs.unobserve(el);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  $$('.reveal').forEach(function (el) { revealer.observe(el); });

  /* ------------------------------------------------ compteurs */
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    var sup = el.querySelector('sup');
    var suffix = sup ? sup.outerHTML : '';
    var plain = el.hasAttribute('data-plain'); // années : pas de séparateur
    var start = performance.now();
    var dur = 1100;

    function frame(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = Math.round(target * eased);
      el.innerHTML = (plain ? String(val) : val.toLocaleString('fr-FR')) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var counters = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      runCounter(e.target);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(function (el) { counters.observe(el); });

  /* ------------------------------------------------ frise de la méthode */
  var steps = $('#steps');
  if (steps) {
    var drawer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        steps.classList.add('is-drawn');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.35 });
    drawer.observe(steps);
  }

  /* ------------------------------------------------ projecteur au curseur */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.card, .btn').forEach(function (el) {
      el.addEventListener('pointermove', function (ev) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
        el.style.setProperty('--my', (ev.clientY - r.top) + 'px');
      });
    });
  }

  /* ------------------------------------------------ formulaire (démonstration) */
  var form = $('#contact-form');
  if (form) {
    var box = $('#alert');
    var timer;

    function say(state, key) {
      box.className = 'alert is-shown ' + state;
      box.setAttribute('data-i18n', key);
      box.textContent = window.CO2LS.i18n.t(key);
      clearTimeout(timer);
      timer = setTimeout(function () {
        box.classList.remove('is-shown');
        box.removeAttribute('data-i18n');
      }, 8000);
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = $('#f-name').value.trim();
      var mail = $('#f-mail').value.trim();
      var msg = $('#f-msg').value.trim();

      if (!name || !mail || !msg) return say('is-error', 'form.errIncomplete');
      if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(mail)) return say('is-error', 'form.errEmail');

      // Démonstration : aucun envoi réseau.
      say('is-ok', 'form.demo');
      form.reset();
    });

    form.addEventListener('reset', function () { box.classList.remove('is-shown'); });
  }

  /* ------------------------------------------------ compteurs & langue */
  // Les libellés changent avec la langue ; les chiffres, eux, restent.
  document.addEventListener('i18n:changed', function () {
    closeMenu();
  });
})();
