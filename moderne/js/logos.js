/*
 * CO2 LASER SERVICES — bandeau de marques défilant.
 *
 * Historique des essais précédents (conservé pour ne pas retomber dans les
 * mêmes ornières) :
 * 1) répétitions codées en dur → trou visible sur grand écran ;
 * 2) boucle CSS translateX(-50%) → léger saut à chaque tour (pourcentage
 *    calculé sur la largeur totale, jamais pile exact au sous-pixel) ;
 * 3) boucle CSS sur un décalage mesuré en pixels exacts → saut toujours là ;
 * 4) défilement piloté en JS (requestAnimationFrame), bouclage arithmétique
 *    pur → plus de saut ponctuel, mais un DÉCALAGE qui apparaît "au bout
 *    d'un moment", pas dès le chargement.
 *
 * Cette dernière observation est la bonne piste : un décalage qui n'apparaît
 * pas tout de suite, mais seulement après un moment, signale presque
 * toujours un changement de mise en page APRÈS la mesure initiale — ici,
 * le chargement de la police maison 'PoliceTitre' (@font-face, voir
 * moderne.css). Au premier rendu, le texte du bandeau s'affiche dans la
 * police de secours (des caractères plus larges/étroits que la police
 * définitive) ; mesurer() calcule alors "unite" sur CETTE largeur-là. Une
 * fois la police maison chargée, le texte change de largeur (font-display:
 * swap) — mais "unite" n'est jamais recalculé : le point de bouclage devient
 * faux, d'où un décalage qui n'apparaît qu'au premier tour suivant le
 * chargement de la police, jamais immédiatement.
 *
 * Fix : redéclencher mesurer() dès que document.fonts.ready est résolu (API
 * standard de chargement des polices), en plus de la mesure initiale.
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
    // Après un redimensionnement ou un chargement de police, "pos" peut se
    // retrouver hors de la plage valide pour le nouveau "unite" : on le
    // ramène à 0 plutôt que de laisser le point de bouclage rater sa cible.
    if (pos <= -unite || pos > 0) pos = 0;
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

  // La mesure initiale peut avoir eu lieu avant que 'PoliceTitre' ne soit
  // chargée (texte encore dans la police de secours, plus large ou plus
  // étroite) : on la refait dès que toutes les polices de la page sont
  // effectivement prêtes, pour que "unite" corresponde à la largeur finale.
  if (window.document && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(mesurer);
  }
  // Filet de sécurité supplémentaire : tout ce qui a pu décaler la mise en
  // page (image tardive, etc.) est réglé une dernière fois ici.
  window.addEventListener('load', mesurer);

  var relance;
  window.addEventListener('resize', function () {
    clearTimeout(relance);
    relance = setTimeout(mesurer, 300);
  });
})();
