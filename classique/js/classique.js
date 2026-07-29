/*
 * CO2 LASER SERVICES — version « classique ».
 * Génère les éléments communs (barre mobile, menu à triangles, pied de page)
 * pour éviter de dupliquer le même balisage sur les sept pages.
 */
(function () {
  'use strict';

  var ASSETS = '../assets/';

  var PAGES = [
    { cls: 'm1', file: 'bienvenue.html',    key: 'nav.welcome',  img: 'm1.png' },
    { cls: 'm2', file: 'entreprise.html',   key: 'nav.about',    img: 'm2.png' },
    { cls: 'm3', file: 'prestations.html',  key: 'nav.services', img: 'm3.png' },
    { cls: 'm4', file: 'moyens.html',       key: 'nav.means',    img: 'm4.png', short: 'nav.meansShort' },
    { cls: 'm5', file: 'contact.html',      key: 'nav.contact',  img: 'm5.png' }
  ];

  var CHEVRON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.3 5.3a1 1 0 0 0 0 1.4l5.3 5.3-5.3 5.3a1 1 0 1 0 1.4 1.4l6-6a1 1 0 0 0 0-1.4l-6-6a1 1 0 0 0-1.4 0Z"/></svg>';

  var body = document.body;
  var active = body.getAttribute('data-active') || '';

  /* ------------------------------------------------ pastilles chevron */
  document.querySelectorAll('.icon').forEach(function (el) {
    if (!el.innerHTML.trim()) el.innerHTML = CHEVRON;
  });

  /* ------------------------------------------------ barre supérieure mobile */
  var topbar = document.createElement('div');
  topbar.className = 'm-topbar mobile-only';
  topbar.innerHTML =
    '<a class="m-logo" href="index.html" data-i18n-aria="common.backHome">' +
      '<img src="' + ASSETS + 'img/logo.png" width="325" height="92" alt="CO2 LASER SERVICES">' +
    '</a>' +
    '<div class="m-lang" role="group" data-i18n-aria="nav.lang">' +
      '<button type="button" data-lang="fr" aria-pressed="false">FR</button>' +
      '<button type="button" data-lang="de" aria-pressed="false">DE</button>' +
      '<button type="button" data-lang="en" aria-pressed="false">EN</button>' +
    '</div>';
  body.insertBefore(topbar, body.firstChild);

  /* ------------------------------------------------ menu à triangles */
  var menu = document.getElementById('menu');
  if (menu) {
    menu.innerHTML = PAGES.map(function (p) {
      return '<li class="' + p.cls + (active === p.cls ? ' is-active' : '') + '">' +
               '<a href="' + p.file + '" data-i18n-title="' + p.key + '">' +
                 '<span data-i18n="' + (p.short || p.key) + '"></span>' +
               '</a>' +
             '</li>';
    }).join('');
  }

  /* ------------------------------------------------ tuiles de l'accueil mobile */
  var tiles = document.querySelector('.m-tiles');
  if (tiles) {
    tiles.innerHTML = PAGES.map(function (p) {
      return '<a href="' + p.file + '">' +
               '<span class="m-tile-ico" style="background-image:url(' + ASSETS + 'img/' + p.img + ')"></span>' +
               '<span data-i18n="' + p.key + '"></span>' +
             '</a>';
    }).join('');
  }

  /* ------------------------------------------------ pied de page */
  var footer = document.getElementById('footer');
  if (footer) {
    footer.innerHTML =
      '<p>' +
        '<span data-i18n="common.copyright"></span> | ' +
        '<a href="mentions-legales.html" data-i18n="nav.legal"></a>' +
        '<span class="footer-lang" role="group">' +
          '<button type="button" data-lang="fr">FR</button>' +
          '<button type="button" data-lang="de">DE</button>' +
          '<button type="button" data-lang="en">EN</button>' +
        '</span>' +
      '</p>';
  }

  /* ------------------------------------------------ formulaire (démonstration) */
  var form = document.getElementById('contact-form');
  if (form) {
    var alertBox = document.getElementById('form-alert');
    var timer;

    var show = function (state, key) {
      if (!alertBox) return;
      alertBox.className = 'form-alert is-shown ' + state;
      alertBox.setAttribute('data-i18n', key);
      alertBox.textContent = window.CO2LS.i18n.t(key);
      clearTimeout(timer);
      timer = setTimeout(function () {
        alertBox.classList.remove('is-shown');
        alertBox.removeAttribute('data-i18n');
      }, 8000);
    };

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = form.querySelector('#input-name').value.trim();
      var mail = form.querySelector('#input-email').value.trim();
      var msg = form.querySelector('#input-message').value.trim();

      if (!name || !mail || !msg) return show('is-error', 'form.errIncomplete');
      if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(mail)) return show('is-error', 'form.errEmail');

      // Démonstration : aucune requête réseau, le message n'est pas envoyé.
      show('is-ok', 'form.demo');
      form.reset();
    });

    form.addEventListener('reset', function () {
      if (alertBox) alertBox.classList.remove('is-shown');
    });
  }

  /* ------------------------------------------------ (re)traduction */
  window.CO2LS.i18n.apply();
})();
