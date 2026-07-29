/*
 * CO2 LASER SERVICES — carte du rayon d'intervention.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  POUR MODIFIER LES POINTS : éditez le tableau POINTS ci-dessous.
 *  `lat` et `lon` sont les coordonnées géographiques réelles ; la position
 *  sur la carte s'en déduit toute seule, il n'y a aucune coordonnée d'écran
 *  à ajuster à la main. Les textes correspondants vivent dans
 *  assets/js/content.js, aux clés m.field.zNn (nom), zNr (région) et
 *  zNd (description).
 *
 *  Les descriptions décrivent des zones couvertes et des types
 *  d'intervention — pas des chantiers datés. Si le client souhaite afficher
 *  de vraies références, il suffit de remplacer les textes zNd.
 * ─────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  var BASE = { lat: 48.72, lon: 7.10 }; // Troisfontaines (57870)

  // `lab` place le libellé quand le placement par défaut (sous le point)
  // entrerait en collision avec un voisin.
  var POINTS = [
    { k: 'z1',  lat: 48.72, lon: 7.10, base: true, lab: 'haut' }, // Troisfontaines
    { k: 'z2',  lat: 48.83, lon: 9.07 },              // Ditzingen (TRUMPF)
    { k: 'z3',  lat: 48.58, lon: 7.75, lab: 'droite' }, // Strasbourg (colle à la base)
    { k: 'z4',  lat: 49.61, lon: 6.13 },              // Luxembourg
    { k: 'z5',  lat: 48.14, lon: 11.57 },             // Munich
    { k: 'z6',  lat: 50.11, lon: 8.68 },              // Francfort
    { k: 'z7',  lat: 50.85, lon: 4.35 },              // Bruxelles
    { k: 'z8',  lat: 47.37, lon: 8.54 },              // Zurich
    { k: 'z9',  lat: 45.76, lon: 4.84 },              // Lyon
    { k: 'z10', lat: 48.86, lon: 2.35 }               // Paris
  ];

  // Cadre de la carte, en degrés autour de la base. Projection
  // équirectangulaire corrigée en longitude : les distances relatives et les
  // cercles de rayon restent justes.
  var VIEW = { x0: -4.6, y0: -3.5, w: 9.2, h: 7.2 };
  var KM_PAR_DEGRE = 111.2;
  var ANNEAUX = [150, 300, 450];

  var K = Math.cos(BASE.lat * Math.PI / 180);

  function projeter(p) {
    return { x: (p.lon - BASE.lon) * K, y: -(p.lat - BASE.lat) };
  }
  function enPourcent(q) {
    return {
      l: ((q.x - VIEW.x0) / VIEW.w) * 100,
      t: ((q.y - VIEW.y0) / VIEW.h) * 100
    };
  }

  var carte = document.getElementById('carte');
  if (!carte) return;

  var svg = carte.querySelector('.carte-svg');
  var couche = carte.querySelector('.carte-points');
  var panneau = document.getElementById('carte-info');

  svg.setAttribute('viewBox', VIEW.x0 + ' ' + VIEW.y0 + ' ' + VIEW.w + ' ' + VIEW.h);

  /* ------------------------------------------------ fond : grille + anneaux */
  var dessin = '';

  for (var gx = Math.ceil(VIEW.x0); gx <= VIEW.x0 + VIEW.w; gx++) {
    dessin += '<line class="c-grille" x1="' + gx + '" y1="' + VIEW.y0 +
      '" x2="' + gx + '" y2="' + (VIEW.y0 + VIEW.h) + '" vector-effect="non-scaling-stroke"/>';
  }
  for (var gy = Math.ceil(VIEW.y0); gy <= VIEW.y0 + VIEW.h; gy++) {
    dessin += '<line class="c-grille" x1="' + VIEW.x0 + '" y1="' + gy +
      '" x2="' + (VIEW.x0 + VIEW.w) + '" y2="' + gy + '" vector-effect="non-scaling-stroke"/>';
  }

  ANNEAUX.forEach(function (km, i) {
    dessin += '<circle class="c-anneau" style="--i:' + i + '" cx="0" cy="0" r="' +
      (km / KM_PAR_DEGRE).toFixed(3) + '" vector-effect="non-scaling-stroke"/>';
  });

  POINTS.forEach(function (p, i) {
    if (p.base) return;
    var q = projeter(p);
    dessin += '<line class="c-lien" style="--i:' + i + '" x1="0" y1="0" x2="' +
      q.x.toFixed(3) + '" y2="' + q.y.toFixed(3) + '" vector-effect="non-scaling-stroke"/>';
  });

  svg.innerHTML = dessin;

  /* ------------------------------------------------ points cliquables */
  var t = window.CO2LS.i18n.t;

  couche.innerHTML = POINTS.map(function (p, i) {
    var pos = enPourcent(projeter(p));
    // Près du bord bas, le libellé passe au-dessus du point pour ne pas sortir.
    var place = p.lab === 'droite' ? ' lab-droite'
      : (p.lab === 'haut' || pos.t > 74) ? ' lab-haut' : '';
    return '<button type="button" class="c-point' + (p.base ? ' is-base' : '') + place +
      '" style="left:' + pos.l.toFixed(2) + '%;top:' + pos.t.toFixed(2) + '%;--i:' + i + '"' +
      ' data-k="' + p.k + '" data-i18n-aria="m.field.' + p.k + 'n">' +
      '<span class="c-pastille"></span>' +
      '<span class="c-nom" data-i18n="m.field.' + p.k + 'n"></span>' +
      '</button>';
  }).join('');

  // Repères de distance, posés sur le haut de chaque anneau
  couche.innerHTML += ANNEAUX.map(function (km) {
    var pos = enPourcent({ x: 0, y: -km / KM_PAR_DEGRE });
    if (pos.t < 2) return '';
    return '<span class="c-echelle" style="left:' + pos.l.toFixed(2) +
      '%;top:' + pos.t.toFixed(2) + '%">' + km + ' km</span>';
  }).join('');

  /* ------------------------------------------------ panneau de détail */
  var champRegion = panneau.querySelector('.carte-card-r');
  var champNom = panneau.querySelector('.carte-card-n');
  var champTexte = panneau.querySelector('.carte-card-d');
  var courant = 'z1';

  function afficher(k) {
    courant = k;
    champRegion.setAttribute('data-i18n', 'm.field.' + k + 'r');
    champNom.setAttribute('data-i18n', 'm.field.' + k + 'n');
    champTexte.setAttribute('data-i18n', 'm.field.' + k + 'd');
    champRegion.textContent = t('m.field.' + k + 'r');
    champNom.textContent = t('m.field.' + k + 'n');
    champTexte.textContent = t('m.field.' + k + 'd');

    couche.querySelectorAll('.c-point').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-k') === k);
    });
    panneau.classList.add('is-filled');
  }

  couche.querySelectorAll('.c-point').forEach(function (b) {
    var k = b.getAttribute('data-k');
    b.addEventListener('pointerenter', function () { afficher(k); });
    b.addEventListener('focus', function () { afficher(k); });
    b.addEventListener('click', function () { afficher(k); });
  });

  // Le panneau garde le dernier point consulté : moins de clignotement
  // qu'un affichage qui se vide dès que le curseur sort.
  document.addEventListener('i18n:changed', function () { afficher(courant); });

  // Sans survol possible, l'invitation parle de toucher plutôt que de survoler.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var invite = document.querySelector('.carte-hint');
    if (invite) invite.setAttribute('data-i18n', 'm.field.hintTouch');
  }

  window.CO2LS.i18n.apply(carte);
  afficher('z1');

  /* ------------------------------------------------ tracé à l'apparition */
  var obs = new IntersectionObserver(function (entrees, o) {
    entrees.forEach(function (e) {
      if (!e.isIntersecting) return;
      carte.classList.add('is-drawn');
      o.unobserve(e.target);
    });
  }, { threshold: 0.25 });
  obs.observe(carte);
})();
