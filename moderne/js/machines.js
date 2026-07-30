/*
 * CO2 LASER SERVICES — vitrine « machines couvertes ».
 * Défilement automatique entre 4 panneaux, pilotable (clic, clavier),
 * en pause au survol/focus. Respecte prefers-reduced-motion : pas
 * d'avance automatique, navigation manuelle uniquement.
 */
(function () {
  'use strict';

  var stage = document.getElementById('mstage');
  if (!stage) return;

  var tabs = Array.prototype.slice.call(stage.querySelectorAll('.mstage-tab'));
  var panels = Array.prototype.slice.call(stage.querySelectorAll('.mstage-panel'));
  var indexEl = document.getElementById('mstage-n');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var DUREE = 4800;
  var courant = 0;
  var minuteur = null;

  function activer(i, options) {
    var manuel = options && options.manuel;
    courant = (i + tabs.length) % tabs.length;

    tabs.forEach(function (tab, idx) {
      var on = idx === courant;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', String(on));
      var fill = tab.querySelector('.mstage-tab-fill');
      fill.classList.remove('is-filling');
      if (on && !reduce) {
        // Retirer puis remettre la classe force le navigateur à repartir
        // de zéro (sans ce reflow, l'animation CSS ne rejoue pas).
        // eslint-disable-next-line no-unused-expressions
        fill.offsetWidth;
        fill.style.setProperty('--duree', DUREE + 'ms');
        fill.classList.add('is-filling');
      } else if (on && reduce) {
        fill.style.width = '100%';
      } else {
        fill.style.width = '';
      }
    });

    panels.forEach(function (p, idx) {
      p.classList.toggle('is-active', idx === courant);
    });

    if (indexEl) indexEl.textContent = String(courant + 1).padStart(2, '0');

    if (manuel) relancer();
  }

  function suivant() { activer(courant + 1); }

  function relancer() {
    clearTimeout(minuteur);
    if (reduce) return;
    minuteur = setTimeout(suivant, DUREE);
  }

  tabs.forEach(function (tab, idx) {
    tab.addEventListener('click', function () { activer(idx, { manuel: true }); });
  });

  // Navigation clavier gauche/droite quand un onglet a le focus.
  stage.querySelector('.mstage-tabs').addEventListener('keydown', function (ev) {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
    ev.preventDefault();
    var dir = ev.key === 'ArrowRight' ? 1 : -1;
    activer(courant + dir, { manuel: true });
    tabs[courant].focus();
  });

  // Pause franche (barre gelée) au survol ou au focus clavier dans la vitrine.
  stage.addEventListener('pointerenter', function () {
    stage.classList.add('is-paused');
    clearTimeout(minuteur);
  });
  stage.addEventListener('pointerleave', function () {
    stage.classList.remove('is-paused');
    relancer();
  });
  stage.addEventListener('focusin', function () { stage.classList.add('is-paused'); clearTimeout(minuteur); });
  stage.addEventListener('focusout', function () {
    if (!stage.contains(document.activeElement)) { stage.classList.remove('is-paused'); relancer(); }
  });

  // Une fenêtre en arrière-plan (autre onglet du navigateur) ne doit pas
  // faire défiler la vitrine hors champ.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) clearTimeout(minuteur);
    else if (!stage.classList.contains('is-paused')) relancer();
  });

  activer(0);

  // L'avance automatique ne démarre que lorsque la vitrine est réellement
  // visible à l'écran (inutile de faire tourner un minuteur hors champ) :
  // le premier appel de l'observateur ci-dessous s'en charge.
  var obs = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      if (e.isIntersecting && !stage.classList.contains('is-paused')) relancer();
      else if (!e.isIntersecting) clearTimeout(minuteur);
    });
  }, { threshold: 0.4 });
  obs.observe(stage);
})();
