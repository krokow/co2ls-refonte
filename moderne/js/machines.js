/*
 * CO2 LASER SERVICES — vitrine « machines couvertes ».
 * Une grande carte en scène, les trois autres empilées à côté : cliquer une
 * carte de la pile la fait passer en scène. Avance automatique toutes les
 * 4,8 s, pilotable (clic, clavier), en pause au survol/focus.
 */
(function () {
  'use strict';

  var stage = document.getElementById('mstage');
  if (!stage) return;

  var cards = Array.prototype.slice.call(stage.querySelectorAll('.mstage-card'));
  var panels = Array.prototype.slice.call(stage.querySelectorAll('.mstage-panel'));
  var indexEl = document.getElementById('mstage-n');
  var fill = document.getElementById('mstage-fill');

  var DUREE = 4800;
  var courant = 0;
  var minuteur = null;

  function activer(i, options) {
    var manuel = options && options.manuel;
    courant = (i + cards.length) % cards.length;

    cards.forEach(function (card) {
      var on = Number(card.getAttribute('data-panel')) === courant;
      card.classList.toggle('is-active', on);
      card.setAttribute('aria-selected', String(on));
      card.tabIndex = on ? -1 : 0;
    });

    panels.forEach(function (p) {
      p.classList.toggle('is-active', Number(p.getAttribute('data-panel')) === courant);
    });

    stage.setAttribute('data-active', String(courant));
    if (indexEl) indexEl.textContent = String(courant + 1).padStart(2, '0');

    fill.classList.remove('is-filling');
    // eslint-disable-next-line no-unused-expressions
    fill.offsetWidth; // force le reflow pour rejouer l'animation depuis 0
    fill.style.setProperty('--duree', DUREE + 'ms');
    fill.classList.add('is-filling');

    if (manuel) relancer();
  }

  function suivant() { activer(courant + 1); }

  function relancer() {
    clearTimeout(minuteur);
    minuteur = setTimeout(suivant, DUREE);
  }

  cards.forEach(function (card) {
    var idx = Number(card.getAttribute('data-panel'));
    card.addEventListener('click', function () { activer(idx, { manuel: true }); });
  });

  // Navigation clavier gauche/droite depuis n'importe quelle carte de la pile.
  stage.querySelector('.mstage-rail').addEventListener('keydown', function (ev) {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
    ev.preventDefault();
    var dir = ev.key === 'ArrowRight' ? 1 : -1;
    activer(courant + dir, { manuel: true });
    var suivante = cards.filter(function (c) { return !c.classList.contains('is-active'); })[0];
    if (suivante) suivante.focus();
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
