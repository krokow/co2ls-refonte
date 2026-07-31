/*
 * CO2 LASER SERVICES — bandeau de marques défilant.
 *
 * Le bug signalé ("le bandeau arrive à court de marques puis revient
 * brutalement à 0") venait d'un nombre de répétitions codé en dur dans le
 * HTML : sur un écran large (grand desktop, ultra-wide), le contenu dupliqué
 * était plus étroit que le double de la largeur du bandeau, donc la boucle
 * CSS (translateX de 0 à -50%) traversait un passage sans contenu avant de
 * reboucler — d'où le trou puis le saut visible.
 *
 * Solution robuste : dupliquer la séquence de marques EN JS, autant de fois
 * que nécessaire pour que sa largeur dépasse largement celle du bandeau
 * (mesurée réellement, pas devinée), puis dupliquer cette séquence une
 * dernière fois pour la boucle. La largeur totale ainsi garantie est
 * toujours ≥ 2× celle du conteneur, donc la translation de -50% ne traverse
 * jamais de zone vide, quel que soit l'écran.
 */
(function () {
  'use strict';

  var track = document.getElementById('logos-track');
  if (!track) return;

  var bande = track.closest('.logos');
  var motif = Array.prototype.slice.call(track.children); // la séquence de base, telle qu'écrite en HTML

  function peupler() {
    var largeurCible = bande.getBoundingClientRect().width * 2.2; // marge de confort
    track.innerHTML = '';

    var largeur = 0;
    while (largeur < largeurCible) {
      motif.forEach(function (el) { track.appendChild(el.cloneNode(true)); });
      largeur = track.getBoundingClientRect().width;
      // Garde-fou : un HTML vide ou un conteneur non rendu ne doit pas boucler à l'infini.
      if (track.children.length > 400) break;
    }
    // Deuxième moitié identique à la première : la boucle -50% redevient invisible.
    var moitie = Array.prototype.slice.call(track.children).map(function (el) { return el.cloneNode(true); });
    moitie.forEach(function (el) { track.appendChild(el); });

    track.style.animationDuration = Math.max(18, track.children.length * 1.1) + 's';
  }

  peupler();

  var relance;
  window.addEventListener('resize', function () {
    clearTimeout(relance);
    relance = setTimeout(peupler, 300);
  });
})();
