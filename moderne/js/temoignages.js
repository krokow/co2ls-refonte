/*
 * CO2 LASER SERVICES — carrousel de témoignages (contenu de démonstration,
 * voir assets/js/content.js clés m.temoin.* : attribution par rôle/secteur
 * uniquement, aucun nom de client inventé — à remplacer par de vrais
 * retours dès que le client les fournit).
 */
(function () {
  'use strict';

  var bloc = document.getElementById('temoin');
  if (!bloc) return;

  var panels = Array.prototype.slice.call(bloc.querySelectorAll('.temoin-panel'));
  var dots = Array.prototype.slice.call(bloc.querySelectorAll('.temoin-dots button'));
  var DUREE = 6000;
  var courant = 0;
  var minuteur = null;

  function activer(i) {
    courant = (i + panels.length) % panels.length;
    panels.forEach(function (p) {
      p.classList.toggle('is-active', Number(p.getAttribute('data-panel')) === courant);
    });
    dots.forEach(function (d) {
      var on = Number(d.getAttribute('data-panel')) === courant;
      d.classList.toggle('is-active', on);
      d.setAttribute('aria-selected', String(on));
    });
  }

  function relancer() {
    clearTimeout(minuteur);
    minuteur = setTimeout(function () { activer(courant + 1); relancer(); }, DUREE);
  }

  dots.forEach(function (d) {
    d.addEventListener('click', function () {
      activer(Number(d.getAttribute('data-panel')));
      relancer();
    });
  });

  bloc.addEventListener('pointerenter', function () { clearTimeout(minuteur); });
  bloc.addEventListener('pointerleave', relancer);

  var obs = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      if (e.isIntersecting) relancer();
      else clearTimeout(minuteur);
    });
  }, { threshold: 0.4 });
  obs.observe(bloc);

  activer(0);
})();
