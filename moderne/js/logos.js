/*
 * CO2 LASER SERVICES — bandeau de marques défilant.
 *
 * Trois versions de ce fichier, dans l'ordre :
 * 1) répétitions codées en dur → le bandeau manquait de contenu sur grand
 *    écran (trou visible avant la boucle) ;
 * 2) boucle CSS sur translateX(-50%) → un petit saut restait visible à
 *    chaque tour, la valeur en pourcentage portant sur la largeur totale
 *    (deux moitiés + dizaines d'espaces cumulés), jamais pile exacte au
 *    sous-pixel près ;
 * 3) boucle CSS sur un décalage mesuré en pixels exacts → toujours un saut,
 *    ce qui pointe vers autre chose qu'un problème d'arrondi : le
 *    redémarrage d'une animation CSS `infinite` au bout de sa durée peut
 *    lui-même produire un accroc de rendu (recomposition du calque), même
 *    quand la valeur de départ et d'arrivée sont mathématiquement exactes.
 *
 * Cette version-ci ne dépend plus d'aucune animation CSS : la position est
 * recalculée à chaque frame par requestAnimationFrame et le point de
 * bouclage (repartir de 0 dès qu'on a défilé exactement la largeur d'une
 * répétition) est purement arithmétique — sans "fin de boucle" au sens du
 * navigateur, donc sans accroc de recomposition possible.
 */
(function () {
  'use strict';

  var track = document.getElementById('logos-track');
  var halfA = document.getElementById('logos-half-a');
  var halfB = document.getElementById('logos-half-b');
  if (!track || !halfA || !halfB) return;

  var bande = track.closest('.logos');
  var motif = Array.prototype.slice.call(halfA.children); // séquence de base, telle qu'écrite en HTML
  var VITESSE = 42; // pixels par seconde

  var unite = 0;   // distance exacte à défiler avant de reboucler (mesurée, pas devinée)
  var pos = 0;
  var dernier = null;
  var actif = true;

  function mesurer() {
    var largeurCible = bande.getBoundingClientRect().width * 1.15; // légère marge

    halfA.innerHTML = '';
    var largeur = 0;
    while (largeur < largeurCible) {
      motif.forEach(function (el) { halfA.appendChild(el.cloneNode(true)); });
      largeur = halfA.getBoundingClientRect().width;
      if (halfA.children.length > 200) break; // garde-fou anti-boucle infinie
    }
    halfB.innerHTML = halfA.innerHTML; // clone exact : largeurs identiques garanties

    unite = halfB.getBoundingClientRect().left - halfA.getBoundingClientRect().left;
    if (pos <= -unite || pos > 0) pos = 0; // la mesure a changé (redimensionnement) : repart proprement
  }

  function frame(t) {
    if (!actif) { dernier = null; requestAnimationFrame(frame); return; }
    if (dernier === null) dernier = t;
    var dt = (t - dernier) / 1000;
    dernier = t;

    pos -= VITESSE * dt;
    if (unite > 0 && pos <= -unite) pos += unite; // point de bouclage : purement arithmétique
    track.style.transform = 'translate3d(' + pos.toFixed(2) + 'px,0,0)';

    requestAnimationFrame(frame);
  }

  // Pause hors écran et onglet masqué : rien à gagner à faire tourner la
  // boucle pour rien, et ça évite tout calcul de delta-temps aberrant au
  // retour (l'écran resterait figé un instant sans cette pause explicite).
  document.addEventListener('visibilitychange', function () {
    actif = !document.hidden && dansEcran;
  });
  var dansEcran = true;
  new IntersectionObserver(function (entrees) {
    dansEcran = entrees[0].isIntersecting;
    actif = dansEcran && !document.hidden;
  }, { threshold: 0 }).observe(bande);

  mesurer();
  requestAnimationFrame(frame);

  var relance;
  window.addEventListener('resize', function () {
    clearTimeout(relance);
    relance = setTimeout(mesurer, 300);
  });
})();
