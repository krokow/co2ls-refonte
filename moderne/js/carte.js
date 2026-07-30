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
 *
 *  Le littoral et les frontières (LAND / BORDERS) sont une silhouette
 *  simplifiée, tracée à la main à partir de coordonnées réelles
 *  approximatives (façade Atlantique, Manche, côte belgo-néerlandaise,
 *  frontières France/Allemagne/Suisse/Belgique). Ce n'est pas un tracé
 *  cadastral : l'objectif est qu'on reconnaisse la France au premier coup
 *  d'œil, pas une précision d'IGN. Comme ces tracés passent par la même
 *  fonction `projeter()` que les points, tout reste aligné même si BASE ou
 *  VIEW changent.
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
  // cercles de rayon restent justes. L'aspect-ratio du conteneur est dérivé
  // de w/h en JS (voir plus bas) : ne JAMAIS fixer un aspect-ratio différent
  // en CSS, les points (positionnés en %) et la carte SVG s'en trouveraient
  // désalignés — c'est exactement ce qui rendait la carte invisible en mobile.
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
  function chemin(pointsLatLon, ferme) {
    var d = '';
    pointsLatLon.forEach(function (ll, i) {
      var q = projeter({ lat: ll[0], lon: ll[1] });
      d += (i === 0 ? 'M' : 'L') + q.x.toFixed(3) + ',' + q.y.toFixed(3) + ' ';
    });
    return d + (ferme ? 'Z' : '');
  }

  /* ------------------------------------------------ silhouette (façade
     Atlantique/Manche/côte belgo-néerlandaise, refermée sur les bords de
     cadre au nord/est/sud puisque le continent s'étend au-delà de la vue) */
  var LAND = [
    [45.02, -0.75], [44.66, -1.17], [45.55, -1.05], [46.16, -1.15],
    [47.00, -2.15], [47.28, -2.90], [47.80, -4.35], [48.39, -4.79],
    [48.60, -4.10], [48.65, -3.20], [48.63, -2.03], [49.34, -1.65],
    [49.65, -1.62], [49.55, -1.15], [49.49, 0.11], [50.05, 1.30],
    [50.95, 1.85], [51.03, 2.38], [51.22, 2.90], [51.33, 3.20],
    [51.45, 3.60], [51.98, 4.13], [52.20, 4.60],
    [52.20, 14.07], [45.02, 14.07]
  ];

  // Frontières internes, simplifiées (France–Belgique/Luxembourg,
  // France–Allemagne le long du Rhin, France/Allemagne–Suisse).
  var FRONTIERES = [
    [[50.75, 2.55], [50.30, 3.20], [50.10, 4.20], [49.95, 4.85],
     [49.55, 5.30], [49.45, 5.75]],
    [[49.45, 5.75], [49.20, 7.60], [49.03, 8.13], [48.60, 7.95],
     [48.05, 7.75], [47.55, 7.60]],
    [[47.55, 7.60], [47.35, 7.55], [47.30, 7.00], [46.90, 6.50], [46.40, 6.20]],
    [[47.55, 7.60], [47.60, 8.20], [47.65, 8.75], [47.60, 9.20], [47.55, 9.60]]
  ];

  // Discrets, mais lèvent toute ambiguïté sur les pays représentés — placés
  // dans des zones du cadre sans point ni libellé de ville.
  var PAYS = [
    { key: 'labelFR', lat: 45.9, lon: 1.7 },
    { key: 'labelDE', lat: 51.2, lon: 12.4 }
  ];

  var carte = document.getElementById('carte');
  if (!carte) return;

  var svg = carte.querySelector('.carte-svg');
  var couche = carte.querySelector('.carte-points');
  var panneau = document.getElementById('carte-info');

  svg.setAttribute('viewBox', VIEW.x0 + ' ' + VIEW.y0 + ' ' + VIEW.w + ' ' + VIEW.h);
  // Fixé ici plutôt qu'en CSS : garantit que la carte SVG et les points
  // positionnés en % restent TOUJOURS proportionnés au même cadre,
  // quelle que soit la largeur d'écran.
  carte.style.aspectRatio = VIEW.w + ' / ' + VIEW.h;

  /* ------------------------------------------------ fond : terre + anneaux */
  var dessin = '';

  dessin += '<path class="c-terre" d="' + chemin(LAND, true) + '"/>';
  FRONTIERES.forEach(function (f, i) {
    dessin += '<path class="c-frontiere" style="--i:' + i + '" d="' + chemin(f, false) + '"/>';
  });

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

  // Noms de pays, discrets
  couche.innerHTML += PAYS.map(function (c) {
    var pos = enPourcent(projeter(c));
    return '<span class="c-pays" style="left:' + pos.l.toFixed(2) + '%;top:' + pos.t.toFixed(2) +
      '%" data-i18n="m.field.' + c.key + '"></span>';
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

  /* ------------------------------------------------ tracé à l'apparition
     Seuil bas + marge positive : l'animation démarre dès que la carte
     approche du bas de l'écran, pas seulement une fois posée bien en vue.
     Sur mobile, où l'on scrolle vite, un déclenchement tardif + une
     animation trop longue donnaient l'impression d'une carte vide/cassée. */
  var obs = new IntersectionObserver(function (entrees, o) {
    entrees.forEach(function (e) {
      if (!e.isIntersecting) return;
      carte.classList.add('is-drawn');
      o.unobserve(e.target);
    });
  }, { threshold: 0.05, rootMargin: '0px 0px 15% 0px' });
  obs.observe(carte);
})();
