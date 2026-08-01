/*
 * CO2 LASER SERVICES — vitrine « machines couvertes ».
 * Une grande carte en scène, les trois autres empilées à côté : cliquer une
 * carte de la pile la fait passer en scène. Avance automatique, pilotable
 * (clic, clavier), en pause au survol/focus.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Ce composant était instable parce que QUATRE mécanismes indépendants
 * décidaient chacun de leur côté de ce qui devait tourner :
 *   - un setTimeout JS pour le changement de carte,
 *   - une animation CSS pour la barre de progression (durée à part),
 *   - une autre animation CSS pour le balayage lumineux (7 s fixes, donc
 *     jamais en phase avec le reste),
 *   - une classe .is-paused qui ne figeait QUE la barre.
 * D'où les symptômes : barre qui repart ou non au retour dans la section
 * (le minuteur redémarrait sans que l'animation CSS ne soit rejouée),
 * balayage désynchronisé, et clic qui relançait le minuteur alors que la
 * barre restait gelée par .is-paused.
 *
 * Ici, une seule horloge : une boucle requestAnimationFrame fait avancer
 * une unique valeur `progression` (0 → 1). La barre ET le balayage lisent
 * tous deux la variable CSS --progress, donc ils sont synchronisés par
 * construction, et « en pause » signifie simplement : on n'avance plus.
 * ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var stage = document.getElementById('mstage');
  if (!stage) return;

  var cards = Array.prototype.slice.call(stage.querySelectorAll('.mstage-card'));
  var panels = Array.prototype.slice.call(stage.querySelectorAll('.mstage-panel'));
  var rail = stage.querySelector('.mstage-rail');
  var indexEl = document.getElementById('mstage-n');

  var DUREE = 4800;

  var courant = 0;
  var progression = 0;   // 0 → 1 sur la durée d'une carte
  var dernier = null;

  // État de lecture, décomposé pour qu'aucune source ne puisse en écraser
  // une autre : la lecture n'a lieu que si les trois conditions tiennent.
  var visible = false;      // la vitrine est à l'écran
  var ongletActif = !document.hidden;
  var survol = false;
  var focus = false;

  function enLecture() { return visible && ongletActif && !survol && !focus; }

  function appliquer() {
    stage.style.setProperty('--progress', progression.toFixed(4));
  }

  function activer(i) {
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

    // Toute activation repart d'un cycle neuf — y compris en pause, pour que
    // le clic ait un effet visible immédiat plutôt qu'une barre figée.
    progression = 0;
    appliquer();
  }

  function boucle(t) {
    if (dernier === null) dernier = t;
    var dt = t - dernier;
    dernier = t; // remis à jour même en pause : pas de saut au redémarrage

    if (enLecture()) {
      progression += dt / DUREE;
      if (progression >= 1) activer(courant + 1); // remet progression à 0
      else appliquer();
    }
    requestAnimationFrame(boucle);
  }

  /* ------------------------------------------------ interactions */
  cards.forEach(function (card) {
    var idx = Number(card.getAttribute('data-panel'));
    card.addEventListener('click', function () { activer(idx); });
  });

  // Navigation clavier gauche/droite depuis n'importe quelle carte de la pile.
  rail.addEventListener('keydown', function (ev) {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
    ev.preventDefault();
    activer(courant + (ev.key === 'ArrowRight' ? 1 : -1));
    var suivante = cards.filter(function (c) { return !c.classList.contains('is-active'); })[0];
    if (suivante) suivante.focus();
  });

  stage.addEventListener('pointerenter', function () { survol = true; });
  stage.addEventListener('pointerleave', function () { survol = false; });

  // La pause au focus ne vise QUE la navigation clavier (ne rien faire bouger
  // sous les doigts de quelqu'un qui tabule). Un clic souris donne aussi le
  // focus au bouton : sans le test :focus-visible, cliquer une carte mettait
  // la vitrine en pause définitivement — c'est le « des fois, cliquer ne
  // relance rien » signalé. :focus-visible n'est vrai que pour un focus
  // clavier, ce qui distingue exactement les deux cas.
  stage.addEventListener('focusin', function (ev) {
    focus = !!(ev.target && ev.target.matches && ev.target.matches(':focus-visible'));
  });
  stage.addEventListener('focusout', function (ev) {
    // relatedTarget = l'élément qui reçoit le focus ; document.activeElement
    // n'est pas encore à jour à ce stade.
    focus = !!(ev.relatedTarget && stage.contains(ev.relatedTarget)
      && ev.relatedTarget.matches && ev.relatedTarget.matches(':focus-visible'));
  });

  document.addEventListener('visibilitychange', function () {
    ongletActif = !document.hidden;
  });

  // Au retour dans la section, le cycle repart proprement de zéro : c'est
  // prévisible, et ça évite une barre qui reprend au milieu sans raison.
  new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      if (e.isIntersecting && !visible) { visible = true; progression = 0; appliquer(); }
      else if (!e.isIntersecting) visible = false;
    });
  }, { threshold: 0.35 }).observe(stage);

  activer(0);
  requestAnimationFrame(boucle);
})();
