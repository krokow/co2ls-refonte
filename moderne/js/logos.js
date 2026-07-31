/*
 * CO2 LASER SERVICES — bandeau de marques défilant.
 *
 * Deux bugs corrigés ici, dans l'ordre où ils sont apparus :
 *
 * 1) "Le bandeau arrive à court de marques" — le nombre de répétitions était
 *    codé en dur dans le HTML. Sur un écran large, le contenu dupliqué était
 *    plus étroit que le bandeau lui-même, donc la boucle traversait une zone
 *    vide. Fix : .logos-half-a est rempli en JS jusqu'à dépasser largement
 *    la largeur réelle du bandeau (mesurée, pas devinée).
 *
 * 2) "Un petit saut une fois par boucle" — la boucle CSS traduisait
 *    l'élément de "translateX(-50%)" à "translateX(0)". Ce -50% porte sur
 *    la largeur TOTALE du bandeau (les deux moitiés confondues, cumulées
 *    sur des dizaines de spans et d'espaces) : le sous-pixel d'arrondi qui
 *    en résulte n'est presque jamais exactement la moitié pile, d'où un
 *    saut visible à chaque tour. Fix : on mesure l'écart RÉEL en pixels
 *    entre le début de .logos-half-a et le début de son clone
 *    .logos-half-b (--logos-shift), plutôt que de faire confiance à un
 *    pourcentage calculé sur l'ensemble.
 */
(function () {
  'use strict';

  var track = document.getElementById('logos-track');
  var halfA = document.getElementById('logos-half-a');
  var halfB = document.getElementById('logos-half-b');
  if (!track || !halfA || !halfB) return;

  var bande = track.closest('.logos');
  var motif = Array.prototype.slice.call(halfA.children); // séquence de base, telle qu'écrite en HTML

  function peupler() {
    var largeurCible = bande.getBoundingClientRect().width * 1.15; // légère marge

    halfA.innerHTML = '';
    var largeur = 0;
    while (largeur < largeurCible) {
      motif.forEach(function (el) { halfA.appendChild(el.cloneNode(true)); });
      largeur = halfA.getBoundingClientRect().width;
      if (halfA.children.length > 200) break; // garde-fou anti-boucle infinie
    }

    // Clone exact : garantit des largeurs identiques au pixel près.
    halfB.innerHTML = halfA.innerHTML;

    // Valeur non arrondie à dessein : le sous-pixel mesuré est plus fidèle
    // qu'un arrondi, qui réintroduirait le décalage qu'on cherche à éliminer.
    var ecart = halfB.getBoundingClientRect().left - halfA.getBoundingClientRect().left;
    track.style.setProperty('--logos-shift', (-ecart) + 'px');
    track.style.setProperty('--logos-dur', Math.max(18, halfA.children.length * 2.2) + 's');
  }

  peupler();

  var relance;
  window.addEventListener('resize', function () {
    clearTimeout(relance);
    relance = setTimeout(peupler, 300);
  });
})();
